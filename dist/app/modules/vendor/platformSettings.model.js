"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlatformSettings = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const PlatformSettingsSchema = new mongoose_1.Schema({
    key: { type: String, required: true, unique: true },
    value: { type: Number, required: true, default: 0 },
    label: { type: String, required: true },
    description: { type: String, default: '' },
    updatedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });
// Create default settings if they don't exist
PlatformSettingsSchema.statics.ensureDefaults = function () {
    return __awaiter(this, void 0, void 0, function* () {
        const defaults = [
            { key: 'event_platform_fee', value: 20, label: 'Event Platform Fee (%)', description: 'Platform fee percentage for event vendors' },
            { key: 'movie_watch_platform_fee', value: 50, label: 'Movie Watch Platform Fee (%)', description: 'Platform fee percentage for movie watch vendors' },
        ];
        for (const setting of defaults) {
            yield this.findOneAndUpdate({ key: setting.key }, { $setOnInsert: setting }, { upsert: true, new: true });
        }
    });
};
exports.PlatformSettings = mongoose_1.default.model('PlatformSettings', PlatformSettingsSchema);
