"use strict";
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
exports.getBlockedVendorUserIds = exports.invalidateBlockedVendorCache = void 0;
const auth_model_1 = require("../auth/auth.model");
/**
 * Returns the list of _ids of users that an admin has blocked.
 * Content owned by these users (events.vendorId, movies.vendorId,
 * watch-videos.uploadedBy) must be hidden from public listings on the frontend.
 *
 * We also reject login for any of these users in auth.controller.ts.
 *
 * A tiny in-memory cache is used to avoid hitting the DB on every listing
 * request. Block/unblock endpoints call invalidateBlockedVendorCache() so
 * changes propagate immediately.
 */
let cache = null;
const CACHE_TTL_MS = 30 * 1000; // 30s
const invalidateBlockedVendorCache = () => {
    cache = null;
};
exports.invalidateBlockedVendorCache = invalidateBlockedVendorCache;
const getBlockedVendorUserIds = () => __awaiter(void 0, void 0, void 0, function* () {
    const now = Date.now();
    if (cache && cache.expiresAt > now)
        return cache.ids;
    const rows = yield auth_model_1.User.find({ isBlocked: true }, { _id: 1 }).lean();
    const ids = rows.map((r) => r._id);
    cache = { ids, expiresAt: now + CACHE_TTL_MS };
    return ids;
});
exports.getBlockedVendorUserIds = getBlockedVendorUserIds;
