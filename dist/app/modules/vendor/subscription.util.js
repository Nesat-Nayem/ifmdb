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
exports.computeActiveServicesForVendor = exports.getExpiredFilmTradeVendorIds = exports.invalidateExpiredFilmTradeCache = exports.getFilmTradeServiceStatus = exports.addDays = exports.computeDurationDays = void 0;
const vendor_model_1 = require("./vendor.model");
/**
 * Compute number of calendar days for a given duration/durationType combo.
 * Used to extend subscriptionEnd on approval/renewal.
 */
const computeDurationDays = (duration, durationType) => {
    if (durationType === 'years')
        return Math.round(duration * 365);
    if (durationType === 'months')
        return Math.round(duration * 30);
    return duration;
};
exports.computeDurationDays = computeDurationDays;
const addDays = (from, days) => {
    const d = new Date(from);
    d.setDate(d.getDate() + days);
    return d;
};
exports.addDays = addDays;
/**
 * Returns the current subscription status for a film_trade service.
 */
const getFilmTradeServiceStatus = (svc) => {
    if (!(svc === null || svc === void 0 ? void 0 : svc.subscriptionEnd))
        return 'pending_payment';
    const end = new Date(svc.subscriptionEnd);
    return end.getTime() > Date.now() ? 'active' : 'expired';
};
exports.getFilmTradeServiceStatus = getFilmTradeServiceStatus;
/**
 * Returns user IDs whose film_trade subscription is expired or not active.
 * Public listings should hide content owned by these vendors (movies).
 * A small in-memory cache avoids hitting the DB on every listing call.
 */
let cache = null;
const CACHE_TTL_MS = 30 * 1000;
const invalidateExpiredFilmTradeCache = () => {
    cache = null;
};
exports.invalidateExpiredFilmTradeCache = invalidateExpiredFilmTradeCache;
const getExpiredFilmTradeVendorIds = () => __awaiter(void 0, void 0, void 0, function* () {
    const now = Date.now();
    if (cache && cache.expiresAt > now)
        return cache.ids;
    const rows = yield vendor_model_1.VendorApplication.find({
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
    }, { vendorUserId: 1 }).lean();
    const ids = rows
        .map((r) => r.vendorUserId)
        .filter(Boolean);
    cache = { ids, expiresAt: now + CACHE_TTL_MS };
    return ids;
});
exports.getExpiredFilmTradeVendorIds = getExpiredFilmTradeVendorIds;
/**
 * Given a vendor user id, compute the list of "active" services they can use
 * right now. film_trade is only active if subscription is valid; events and
 * movie_watch are always considered active (they use per-transaction fees).
 */
const computeActiveServicesForVendor = (vendorUserId) => __awaiter(void 0, void 0, void 0, function* () {
    const app = yield vendor_model_1.VendorApplication.findOne({
        vendorUserId,
        isDeleted: false,
        status: 'approved',
    }).lean();
    if (!app || !Array.isArray(app.selectedServices))
        return [];
    const active = [];
    for (const svc of app.selectedServices) {
        if (svc.serviceType === 'film_trade') {
            const status = (0, exports.getFilmTradeServiceStatus)(svc);
            if (status === 'active')
                active.push('film_trade');
        }
        else if (svc.serviceType === 'events' || svc.serviceType === 'movie_watch') {
            active.push(svc.serviceType);
        }
    }
    return active;
});
exports.computeActiveServicesForVendor = computeActiveServicesForVendor;
