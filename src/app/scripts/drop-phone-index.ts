/**
 * Script to drop the unique phone index from the users collection
 * Run this once to fix the duplicate phone number issue
 * 
 * Usage: npx ts-node src/app/scripts/drop-phone-index.ts
 * Or add to package.json: "drop-phone-index": "ts-node src/app/scripts/drop-phone-index.ts"
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function dropPhoneIndex() {
  try {
    const mongoUri = process.env.DATABASE_URL || process.env.MONGODB_URI;
    
    if (!mongoUri) {
      console.error('❌ No MongoDB URI found in environment variables');
      process.exit(1);
    }

    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    if (!db) {
      console.error('❌ Database connection not established');
      process.exit(1);
    }

    const collection = db.collection('users');

    // List all indexes
    console.log('\n📋 Current indexes on users collection:');
    const indexes = await collection.indexes();
    indexes.forEach((index, i) => {
      console.log(`  ${i + 1}. ${index.name}: ${JSON.stringify(index.key)}`);
    });

    // Try to drop phone_1 index if it exists
    try {
      await collection.dropIndex('phone_1');
      console.log('\n✅ Successfully dropped phone_1 index');
    } catch (err: any) {
      if (err.code === 27) {
        console.log('\n⚠️ phone_1 index does not exist (already dropped or never created)');
      } else {
        console.error('\n❌ Error dropping phone_1 index:', err.message);
      }
    }

    // List indexes again to confirm
    console.log('\n📋 Indexes after cleanup:');
    const newIndexes = await collection.indexes();
    newIndexes.forEach((index, i) => {
      console.log(`  ${i + 1}. ${index.name}: ${JSON.stringify(index.key)}`);
    });

    console.log('\n🎉 Done! Phone number is no longer unique.');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

dropPhoneIndex();
