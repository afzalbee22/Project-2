import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

const DocumentSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  content: String,
  originalName: String,
  filename: String
});

const Document = mongoose.model('Document', DocumentSchema);

console.log('\n=== TESTING SEARCH ===\n');

await mongoose.connect(process.env.MONGODB_URI);
console.log('Connected to MongoDB');

// Get all documents
const allDocs = await Document.find();
console.log(`\nTotal documents: ${allDocs.length}`);

allDocs.forEach((doc, i) => {
  console.log(`\n${i + 1}. ${doc.originalName}`);
  console.log(`   Content length: ${doc.content?.length || 0} chars`);
  console.log(`   First 100 chars: ${doc.content?.substring(0, 100) || 'NO CONTENT'}`);
});

// Test search
const testQuery = 'database';
console.log(`\n\nSearching for: "${testQuery}"`);

const results = allDocs.filter(doc => 
  doc.content && doc.content.toLowerCase().includes(testQuery.toLowerCase())
);

console.log(`Found ${results.length} matching documents:`);
results.forEach(doc => {
  console.log(`  - ${doc.originalName}`);
});

process.exit(0);
