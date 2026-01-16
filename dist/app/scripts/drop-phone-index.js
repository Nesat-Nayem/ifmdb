"use strict";
/**
 * Script to drop the unique phone index from the users collection
 * Run this once to fix the duplicate phone number issue
 *
 * Usage: npx ts-node src/app/scripts/drop-phone-index.ts
 * Or add to package.json: "drop-phone-index": "ts-node src/app/scripts/drop-phone-index.ts"
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
function dropPhoneIndex() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const mongoUri = process.env.DATABASE_URL || process.env.MONGODB_URI;
            if (!mongoUri) {
                console.error('❌ No MongoDB URI found in environment variables');
                process.exit(1);
            }
            console.log('🔗 Connecting to MongoDB...');
            yield mongoose_1.default.connect(mongoUri);
            console.log('✅ Connected to MongoDB');
            const db = mongoose_1.default.connection.db;
            if (!db) {
                console.error('❌ Database connection not established');
                process.exit(1);
            }
            const collection = db.collection('users');
            // List all indexes
            console.log('\n📋 Current indexes on users collection:');
            const indexes = yield collection.indexes();
            indexes.forEach((index, i) => {
                console.log(`  ${i + 1}. ${index.name}: ${JSON.stringify(index.key)}`);
            });
            // Try to drop phone_1 index if it exists
            try {
                yield collection.dropIndex('phone_1');
                console.log('\n✅ Successfully dropped phone_1 index');
            }
            catch (err) {
                if (err.code === 27) {
                    console.log('\n⚠️ phone_1 index does not exist (already dropped or never created)');
                }
                else {
                    console.error('\n❌ Error dropping phone_1 index:', err.message);
                }
            }
            // List indexes again to confirm
            console.log('\n📋 Indexes after cleanup:');
            const newIndexes = yield collection.indexes();
            newIndexes.forEach((index, i) => {
                console.log(`  ${i + 1}. ${index.name}: ${JSON.stringify(index.key)}`);
            });
            console.log('\n🎉 Done! Phone number is no longer unique.');
        }
        catch (error) {
            console.error('❌ Error:', error);
        }
        finally {
            yield mongoose_1.default.disconnect();
            console.log('🔌 Disconnected from MongoDB');
            process.exit(0);
        }
    });
}
dropPhoneIndex();
