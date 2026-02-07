import Groq from 'groq-sdk';
import Search from '../models/Search.js';
import Document from '../models/Document.js';
import { elasticClient, rabbitChannel } from '../config/db.js';

let groq = null;
const apiKey = process.env.GROQ_API_KEY?.trim();
const GROQ_MODEL = 'llama-3.3-70b-versatile';

if (apiKey && apiKey.startsWith('gsk_')) {
    try {
        groq = new Groq({ apiKey });
        console.log('✅ Groq initialized in service');
    } catch (error) {
        console.error('❌ Groq service initialization failed:', error.message);
    }
}

const logToRabbitMQ = (action, data) => {
    if (rabbitChannel) {
        rabbitChannel.sendToQueue('search_logs', Buffer.from(JSON.stringify({ action, data, timestamp: new Date() })));
    }
};

// Helper to extract relevant snippet around query terms
const extractRelevantContext = (content, query = '', maxLength = 4000) => {
    if (!content) return '';
    if (!query) return content.substring(0, maxLength);

    const lowerContent = content.toLowerCase();
    const cleanQuery = query.toLowerCase().replace(/[^\w\s]/g, '');

    // 1. Try to find the exact phrase first
    const phraseIndex = lowerContent.indexOf(cleanQuery);
    if (phraseIndex !== -1) {
        const start = Math.max(0, phraseIndex - 1000);
        const end = Math.min(content.length, start + maxLength);
        return (start > 0 ? '...' : '') + content.substring(start, end) + (end < content.length ? '...' : '');
    }

    // 2. Keyword density search
    // Allow short words like "2", "4" if they are part of the query
    const words = cleanQuery.split(/\s+/).filter(w => w.length > 1);
    if (words.length === 0) return content.substring(0, maxLength);

    // Find all positions of all keywords
    const matches = [];
    words.forEach(word => {
        let regex = new RegExp(word, 'gi');
        let match;
        while ((match = regex.exec(lowerContent)) !== null) {
            matches.push(match.index);
        }
    });

    if (matches.length === 0) return content.substring(0, maxLength);

    matches.sort((a, b) => a - b);

    // Find the window of size `maxLength` containing the most matches
    let bestStart = 0;
    let maxMatchCount = 0;

    for (let i = 0; i < matches.length; i++) {
        const currentStart = matches[i];
        // Look ahead to see how many matches fit in the window starting here
        let count = 0;
        for (let j = i; j < matches.length; j++) {
            if (matches[j] - currentStart < maxLength) {
                count++;
            } else {
                break;
            }
        }

        if (count > maxMatchCount) {
            maxMatchCount = count;
            bestStart = matches[i];
        }
    }

    // Capture context around the best start
    // Start a bit before the first match to give context
    const start = Math.max(0, bestStart - 500);
    const end = Math.min(content.length, start + maxLength);

    return (start > 0 ? '...' : '') + content.substring(start, end) + (end < content.length ? '...' : '');
};

export const performSearch = async (userId, query) => {
    console.log('\n=== PERFORMING SEARCH ===');
    console.log('Query:', query);

    let relevantDocs = [];

    if (elasticClient) {
        try {
            const searchResult = await elasticClient.search({
                index: 'documents',
                body: {
                    query: {
                        bool: {
                            must: [
                                { match: { userId: userId } },
                                { match: { content: query } }
                            ]
                        }
                    },
                    size: 5
                }
            });
            relevantDocs = searchResult.hits.hits.map(hit => ({
                id: hit._id,
                content: hit._source.content,
                filename: hit._source.filename
            }));
        } catch (error) {
            console.warn('Elasticsearch failed:', error.message);
        }
    }

    if (relevantDocs.length === 0) {
        const docs = await Document.find({ userId: userId }).sort({ uploadDate: -1 });
        const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);

        const scoredDocs = docs.map(doc => {
            if (!doc.content) return { doc, score: 0 };
            const content = doc.content.toLowerCase();
            let score = 0;
            queryWords.forEach(word => {
                const regex = new RegExp(word, 'gi');
                if (content.match(regex)) score += (content.match(regex) || []).length;
            });
            // Boost recent
            const daysSinceUpload = (Date.now() - new Date(doc.uploadDate).getTime()) / (1000 * 60 * 60 * 24);
            if (daysSinceUpload < 1) score *= 2;
            return { doc, score };
        });

        relevantDocs = scoredDocs
            .filter(item => item.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, 3)
            .map(item => ({
                id: item.doc._id.toString(),
                content: item.doc.content,
                filename: item.doc.originalName,
                score: item.score
            }));
    }

    let response;

    if (relevantDocs.length === 0) {
        if (groq) {
            try {
                const completion = await groq.chat.completions.create({
                    model: GROQ_MODEL,
                    messages: [
                        { role: 'system', content: 'You are a helpful AI assistant.' },
                        { role: 'user', content: query }
                    ],
                    max_tokens: 500
                });
                response = completion.choices[0].message.content;

                await Search.findOneAndUpdate(
                    { userId, query },
                    { userId, query, response, documentIds: [], timestamp: new Date() },
                    { upsert: true, new: true }
                );
                logToRabbitMQ('search', { userId, query, type: 'general' });

                return { response, sources: [] };
            } catch (e) {
                console.error('Groq general query failed', e);
            }
        }
        return {
            response: 'No documents found. Upload documents or add Groq API key.',
            sources: []
        };
    }

    // Use smart context extraction
    // Use smaller chunk per file but targeted
    const context = relevantDocs
        .slice(0, 3)
        .map(doc => `File: ${doc.filename}\nContent: ${extractRelevantContext(doc.content, query, 5000)}`) // Increased to 5000
        .join('\n\n');
    console.log('Sending Context Length:', context.length);

    if (groq) {
        try {
            const completion = await groq.chat.completions.create({
                model: GROQ_MODEL,
                messages: [
                    {
                        role: 'system',
                        content: 'You are a helpful AI assistant. Answer the question based ONLY on the provided document context. If the answer is not explicitly in the context, say "I cannot find the answer in the provided documents." Do not hallucinate. Keep your answer concise. IMPORTANT: If the answer involves a table, chart, or structured data, you MUST format it as a valid Markdown table. If the user asks for an image, explain that you can only provide text and tables extracted from the documents.'
                    },
                    {
                        role: 'user',
                        content: `Context from documents:\n${context}\n\nQuestion: ${query}\n\nProvide a clear, specific answer based only on the context above.`
                    }
                ],
                max_tokens: 1000,
                temperature: 0.3
            });
            response = completion.choices[0].message.content;
        } catch (error) {
            console.error('Groq query error:', error);
            response = `I encountered an error processing your request with the AI model (${error.message || 'Unknown error'}). \n\nHowever, I found these relevant documents that might help:\n\n${context.substring(0, 500)}...`;
        }
    } else {
        response = `Based on your documents:\n\n${context.substring(0, 500)}...`;
    }

    await Search.findOneAndUpdate(
        { userId, query },
        {
            userId,
            query,
            response,
            documentIds: relevantDocs.map(d => d.id),
            timestamp: new Date()
        },
        { upsert: true, new: true }
    );

    logToRabbitMQ('search', { userId, query });

    return {
        response,
        sources: relevantDocs.map(d => d.filename)
    };
};
