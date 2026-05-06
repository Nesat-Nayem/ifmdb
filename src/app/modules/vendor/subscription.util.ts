import { Types } from 'mongoose';
import { VendorApplication } from './vendor.model';
import { IVendorPackage } from './vendorPackage.model';

/**
 * Compute number of calendar days for a given duration/durationType combo.
 * Used to extend subscriptionEnd on approval/renewal.
 */
export const computeDurationDays = (
  duration: number,
  durationType: 'days' | 'months' | 'years'
): number => {
  if (durationType === 'years') return Math.round(duration * 365);
  if (durationType === 'months') return Math.round(duration * 30);
  return duration;
};

export const addDays = (from: Date, days: number): Date => {
  const d = new Date(from);
  d.setDate(d.getDate() + days);
  return d;
};

/**
 * Returns the current subscription status for a film_trade service.
 */
export const getFilmTradeServiceStatus = (svc: any): 'active' | 'expired' | 'pending_payment' => {
  if (!svc?.subscriptionEnd) return 'pending_payment';
  const end = new Date(svc.subscriptionEnd);
  return end.getTime() > Date.now() ? 'active' : 'expired';
};

/**
 * Returns user IDs whose film_trade subscription is expired or not active.
 * Public listings should hide content owned by these vendors (movies).
 * A small in-memory cache avoids hitting the DB on every listing call.
 */
let cache: { ids: Types.ObjectId[]; expiresAt: number } | null = null;
const CACHE_TTL_MS = 30 * 1000;

export const invalidateExpiredFilmTradeCache = (): void => {
  cache = null;
};

export const getExpiredFilmTradeVendorIds = async (): Promise<Types.ObjectId[]> => {
  const now = Date.now();
  if (cache && cache.expiresAt > now) return cache.ids;

  const rows = await VendorApplication.find(
    {
      isDeleted: false,
      status: 'approved',
      selectedServices: {
        $elemMatch: {
          serviceType: 'film_trade',
          $or: [
            { subscriptionEnd: { $lte: new Date() } },
            { subscriptionEnd: { $exists: false } },
            { subscriptionEnd: null },
          ],
        },
      },
      vendorUserId: { $exists: true, $ne: null },
    },
    { vendorUserId: 1 }
  ).lean();

  const ids = rows
    .map((r: any) => r.vendorUserId as Types.ObjectId)
    .filter(Boolean);
  cache = { ids, expiresAt: now + CACHE_TTL_MS };
  return ids;
};

/**
 * Given a vendor user id, compute the list of "active" services they can use
 * right now. film_trade is only active if subscription is valid; events and
 * movie_watch are always considered active (they use per-transaction fees).
 */
export const computeActiveServicesForVendor = async (
  vendorUserId: Types.ObjectId | string
): Promise<string[]> => {
  const app = await VendorApplication.findOne({
    vendorUserId,
    isDeleted: false,
    status: 'approved',
  }).lean();

  if (!app || !Array.isArray(app.selectedServices)) return [];

  const active: string[] = [];
  for (const svc of app.selectedServices as any[]) {
    if (svc.serviceType === 'film_trade') {
      const status = getFilmTradeServiceStatus(svc);
      if (status === 'active') active.push('film_trade');
    } else if (svc.serviceType === 'events' || svc.serviceType === 'movie_watch') {
      active.push(svc.serviceType);
    }
  }
  return active;
};
