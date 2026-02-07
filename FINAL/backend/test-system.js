import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { Client } from '@elastic/elasticsearch';
import Groq from 'groq-sdk';

dotenv.config();

console.log('\n=== SYSTEM CHECK ===\n');

// 1. Check Environment Variables
console.log('1. Environment Variables:');
console.log('   PORT:', process.env.PORT);
console.log('   MONGODB_URI:', process.env.MONGODB_URI);
console.log('   GROQ_API_KEY:', process.env.GROQ_API_KEY ? `${process.env.GROQ_API_KEY.substring(0, 10)}...` : 'NOT SET');
console.log('   ELASTICSEARCH_NODE:', process.env.ELASTICSEARCH_NODE);

// 2. Check MongoDB
console.log('\n2. Testing MongoDB...');
try {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('   ✅ MongoDB connected');

  const User = mongoose.model('User', new mongoose.Schema({ username: String }));
  const userCount = await User.countDocuments();
  console.log('   Users in database:', userCount);

  const Document = mongoose.model('Document', new mongoose.Schema({
    userId: mongoose.Schema.Types.ObjectId,
    content: String,
    originalName: String
  }));
  const docCount = await Document.countDocuments();
  console.log('   Documents in database:', docCount);

  if (docCount > 0) {
    const docs = await Document.find().limit(3);
    docs.forEach(doc => {
      console.log(`   - ${doc.originalName}: ${doc.content?.length || 0} chars`);
    });
  }
} catch (error) {
  console.log('   ❌ MongoDB error:', error.message);
}

// 3. Check Elasticsearch
console.log('\n3. Testing Elasticsearch...');
try {
  const esClient = new Client({ node: process.env.ELASTICSEARCH_NODE });
  const health = await esClient.cluster.health();
  console.log('   ✅ Elasticsearch connected');
  console.log('   Status:', health.status);

  const indices = await esClient.cat.indices({ format: 'json' });
  console.log('   Indices:', indices.map(i => i.index).join(', '));
} catch (error) {
  console.log('   ❌ Elasticsearch error:', error.message);
}

// 4. Check Groq
console.log('\n4. Testing Groq...');
try {
  const apiKey = process.env.GROQ_API_KEY?.trim();
  if (apiKey && apiKey.startsWith('gsk_')) {
    const groq = new Groq({ apiKey });
    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: 'Say "test successful"' }],
      max_tokens: 10
    });
    console.log('   ✅ Groq connected');
    console.log('   Response:', response.choices[0].message.content);
  } else {
    console.log('   ❌ Groq API key not configured');
  }
} catch (error) {
  console.log('   ❌ Groq error:', error.message);
}

console.log('\n=== CHECK COMPLETE ===\n');
process.exit(0);
