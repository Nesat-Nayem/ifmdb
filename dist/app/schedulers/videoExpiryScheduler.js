"use strict";
/**
 * Video Expiry Scheduler
 *
 * Handles automatic deletion/hiding of expired videos and episodes
 * Runs periodically to check for expired content and process them
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
exports.stopVideoExpiryScheduler = exports.startVideoExpiryScheduler = exports.getUpcomingExpiringContent = exports.processExpiredContent = void 0;
const watch_videos_model_1 = require("../modules/watch-videos/watch-videos.model");
const events_model_1 = __importDefault(require("../modules/events/events.model"));
const movies_model_1 = __importDefault(require("../modules/movies/movies.model"));
/**
 * Process expired content (Videos, Events, Trade Movies)
 * - Hides content that has passed their visibleUntil date
 * - Deletes content with autoDeleteOnExpiry flag set to true
 */
const processExpiredContent = () => __awaiter(void 0, void 0, void 0, function* () {
    const now = new Date();
    const result = {
        videos: { hidden: 0, deleted: 0 },
        events: { hidden: 0, deleted: 0 },
        movies: { hidden: 0, deleted: 0 },
        errors: [],
    };
    try {
        // 1. Process Expired Watch Videos
        const expiredVideos = yield watch_videos_model_1.WatchVideo.find({
            isScheduled: true,
            visibleUntil: { $lte: now },
            isActive: true,
        });
        for (const video of expiredVideos) {
            try {
                if (video.autoDeleteOnExpiry) {
                    yield watch_videos_model_1.WatchVideo.findByIdAndDelete(video._id);
                    result.videos.deleted++;
                }
                else {
                    yield watch_videos_model_1.WatchVideo.findByIdAndUpdate(video._id, { isActive: false, status: 'archived' });
                    result.videos.hidden++;
                }
            }
            catch (err) {
                result.errors.push(`Video ${video._id}: ${err.message}`);
            }
        }
        // 2. Process Expired Events
        const expiredEvents = yield events_model_1.default.find({
            isScheduled: true,
            visibleUntil: { $lte: now },
            isActive: true,
        });
        for (const event of expiredEvents) {
            try {
                if (event.autoDeleteOnExpiry) {
                    yield events_model_1.default.findByIdAndDelete(event._id);
                    result.events.deleted++;
                }
                else {
                    yield events_model_1.default.findByIdAndUpdate(event._id, { isActive: false, status: 'completed' });
                    result.events.hidden++;
                }
            }
            catch (err) {
                result.errors.push(`Event ${event._id}: ${err.message}`);
            }
        }
        // 3. Process Expired Trade Movies
        const expiredMovies = yield movies_model_1.default.find({
            isScheduled: true,
            visibleUntil: { $lte: now },
            isActive: true,
        });
        for (const movie of expiredMovies) {
            try {
                if (movie.autoDeleteOnExpiry) {
                    yield movies_model_1.default.findByIdAndDelete(movie._id);
                    result.movies.deleted++;
                }
                else {
                    yield movies_model_1.default.findByIdAndUpdate(movie._id, { isActive: false, status: 'released' });
                    result.movies.hidden++;
                }
            }
            catch (err) {
                result.errors.push(`Movie ${movie._id}: ${err.message}`);
            }
        }
        // Process expired episodes within series
        yield processExpiredEpisodes(now, result);
    }
    catch (error) {
        result.errors.push(`General error: ${error.message}`);
    }
    return result;
});
exports.processExpiredContent = processExpiredContent;
/**
 * Process expired episodes within series
 */
const processExpiredEpisodes = (now, result) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const seriesWithEpisodes = yield watch_videos_model_1.WatchVideo.find({
            videoType: 'series',
            isActive: true,
            'seasons.episodes.isScheduled': true,
        });
        for (const series of seriesWithEpisodes) {
            const seriesData = series;
            let hasChanges = false;
            if (seriesData.seasons) {
                for (const season of seriesData.seasons) {
                    if (season.episodes) {
                        for (let i = season.episodes.length - 1; i >= 0; i--) {
                            const episode = season.episodes[i];
                            if (episode.isScheduled && episode.visibleUntil && new Date(episode.visibleUntil) <= now) {
                                if (episode.autoDeleteOnExpiry) {
                                    season.episodes.splice(i, 1);
                                    result.videos.deleted++;
                                    hasChanges = true;
                                }
                                else {
                                    episode.isActive = false;
                                    result.videos.hidden++;
                                    hasChanges = true;
                                }
                            }
                        }
                    }
                }
            }
            if (hasChanges) {
                seriesData.totalEpisodes = seriesData.seasons.reduce((total, season) => { var _a; return total + (((_a = season.episodes) === null || _a === void 0 ? void 0 : _a.length) || 0); }, 0);
                yield series.save();
            }
        }
    }
    catch (error) {
        result.errors.push(`Episodes error: ${error.message}`);
    }
});
/**
 * Get upcoming expiring content (for admin dashboard)
 */
const getUpcomingExpiringContent = (...args_1) => __awaiter(void 0, [...args_1], void 0, function* (daysAhead = 7) {
    const now = new Date();
    const futureDate = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);
    const filter = {
        isScheduled: true,
        isActive: true,
        visibleUntil: { $gte: now, $lte: futureDate },
    };
    const [videos, events, movies] = yield Promise.all([
        watch_videos_model_1.WatchVideo.find(filter).select('title thumbnailUrl visibleUntil autoDeleteOnExpiry').lean(),
        events_model_1.default.find(filter).select('title posterImage visibleUntil autoDeleteOnExpiry').lean(),
        movies_model_1.default.find(filter).select('title posterUrl visibleUntil autoDeleteOnExpiry').lean(),
    ]);
    return { videos, events, movies };
});
exports.getUpcomingExpiringContent = getUpcomingExpiringContent;
let schedulerInterval = null;
const startVideoExpiryScheduler = (intervalMs = 60 * 60 * 1000) => {
    if (schedulerInterval)
        return;
    console.log(`Starting content expiry scheduler (interval: ${intervalMs / 1000 / 60} minutes)`);
    (0, exports.processExpiredContent)().then(r => console.log('Initial check:', r)).catch(e => console.error(e));
    schedulerInterval = setInterval(() => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const result = yield (0, exports.processExpiredContent)();
            console.log('Scheduled check completed:', result);
        }
        catch (error) {
            console.error('Scheduled check failed:', error);
        }
    }), intervalMs);
};
exports.startVideoExpiryScheduler = startVideoExpiryScheduler;
const stopVideoExpiryScheduler = () => {
    if (schedulerInterval) {
        clearInterval(schedulerInterval);
        schedulerInterval = null;
    }
};
exports.stopVideoExpiryScheduler = stopVideoExpiryScheduler;
exports.default = {
    processExpiredContent: exports.processExpiredContent,
    getUpcomingExpiringContent: exports.getUpcomingExpiringContent,
    startVideoExpiryScheduler: exports.startVideoExpiryScheduler,
    stopVideoExpiryScheduler: exports.stopVideoExpiryScheduler,
};
