import { Types } from 'mongoose';
import { User } from '../auth/auth.model';

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

let cache: { ids: Types.ObjectId[]; expiresAt: number } | null = null;
const CACHE_TTL_MS = 30 * 1000; // 30s

export const invalidateBlockedVendorCache = (): void => {
  cache = null;
};

export const getBlockedVendorUserIds = async (): Promise<Types.ObjectId[]> => {
  const now = Date.now();
  if (cache && cache.expiresAt > now) return cache.ids;

  const rows = await User.find({ isBlocked: true }, { _id: 1 }).lean();
  const ids = rows.map((r: any) => r._id as Types.ObjectId);
  cache = { ids, expiresAt: now + CACHE_TTL_MS };
  return ids;
};
