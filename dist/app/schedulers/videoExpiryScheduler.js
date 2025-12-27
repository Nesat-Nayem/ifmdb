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
Object.defineProperty(exports, "__esModule", { value: true });
exports.stopVideoExpiryScheduler = exports.startVideoExpiryScheduler = exports.getUpcomingExpiringVideos = exports.processExpiredVideos = void 0;
const watch_videos_model_1 = require("../modules/watch-videos/watch-videos.model");
/**
 * Process expired videos
 * - Hides videos that have passed their visibleUntil date
 * - Deletes videos with autoDeleteOnExpiry flag set to true
 */
const processExpiredVideos = () => __awaiter(void 0, void 0, void 0, function* () {
    const now = new Date();
    const result = {
        hidden: 0,
        deleted: 0,
        errors: [],
    };
    try {
        // Find all expired videos that need processing
        const expiredVideos = yield watch_videos_model_1.WatchVideo.find({
            isScheduled: true,
            visibleUntil: { $lte: now },
            isActive: true, // Only process active videos
        });
        console.log(`Found ${expiredVideos.length} expired videos to process`);
        for (const video of expiredVideos) {
            try {
                const videoData = video;
                if (videoData.autoDeleteOnExpiry) {
                    // Permanently delete the video
                    yield watch_videos_model_1.WatchVideo.findByIdAndDelete(video._id);
                    result.deleted++;
                    console.log(`Deleted expired video: ${video.title} (${video._id})`);
                }
                else {
                    // Just hide the video (set isActive to false)
                    yield watch_videos_model_1.WatchVideo.findByIdAndUpdate(video._id, {
                        isActive: false,
                        status: 'archived'
                    });
                    result.hidden++;
                    console.log(`Hidden expired video: ${video.title} (${video._id})`);
                }
            }
            catch (videoError) {
                const errorMsg = `Error processing video ${video._id}: ${videoError.message}`;
                result.errors.push(errorMsg);
                console.error(errorMsg);
            }
        }
        // Also process expired episodes within series
        yield processExpiredEpisodes(now, result);
    }
    catch (error) {
        const errorMsg = `Error in processExpiredVideos: ${error.message}`;
        result.errors.push(errorMsg);
        console.error(errorMsg);
    }
    return result;
});
exports.processExpiredVideos = processExpiredVideos;
/**
 * Process expired episodes within series
 */
const processExpiredEpisodes = (now, result) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Find all series with scheduled episodes
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
                                    // Remove the episode from the array
                                    season.episodes.splice(i, 1);
                                    result.deleted++;
                                    hasChanges = true;
                                    console.log(`Deleted expired episode: ${episode.title} from ${series.title}`);
                                }
                                else {
                                    // Hide the episode
                                    episode.isActive = false;
                                    result.hidden++;
                                    hasChanges = true;
                                    console.log(`Hidden expired episode: ${episode.title} from ${series.title}`);
                                }
                            }
                        }
                    }
                }
            }
            if (hasChanges) {
                // Recalculate total episodes
                seriesData.totalEpisodes = seriesData.seasons.reduce((total, season) => { var _a; return total + (((_a = season.episodes) === null || _a === void 0 ? void 0 : _a.length) || 0); }, 0);
                yield series.save();
            }
        }
    }
    catch (error) {
        const errorMsg = `Error processing expired episodes: ${error.message}`;
        result.errors.push(errorMsg);
        console.error(errorMsg);
    }
});
/**
 * Get upcoming expiring videos (for admin dashboard)
 */
const getUpcomingExpiringVideos = (...args_1) => __awaiter(void 0, [...args_1], void 0, function* (daysAhead = 7) {
    const now = new Date();
    const futureDate = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);
    const expiringVideos = yield watch_videos_model_1.WatchVideo.find({
        isScheduled: true,
        isActive: true,
        visibleUntil: {
            $gte: now,
            $lte: futureDate,
        },
    })
        .select('title thumbnailUrl visibleUntil autoDeleteOnExpiry')
        .sort({ visibleUntil: 1 });
    return expiringVideos;
});
exports.getUpcomingExpiringVideos = getUpcomingExpiringVideos;
/**
 * Start the scheduler
 * Runs every hour to check for expired content
 */
let schedulerInterval = null;
const startVideoExpiryScheduler = (intervalMs = 60 * 60 * 1000) => {
    if (schedulerInterval) {
        console.log('Video expiry scheduler is already running');
        return;
    }
    console.log(`Starting video expiry scheduler (interval: ${intervalMs / 1000 / 60} minutes)`);
    // Run immediately on start
    (0, exports.processExpiredVideos)()
        .then((result) => {
        console.log(`Initial video expiry check completed:`, result);
    })
        .catch((error) => {
        console.error('Initial video expiry check failed:', error);
    });
    // Schedule periodic runs
    schedulerInterval = setInterval(() => __awaiter(void 0, void 0, void 0, function* () {
        console.log('Running scheduled video expiry check...');
        try {
            const result = yield (0, exports.processExpiredVideos)();
            console.log('Video expiry check completed:', result);
        }
        catch (error) {
            console.error('Scheduled video expiry check failed:', error);
        }
    }), intervalMs);
};
exports.startVideoExpiryScheduler = startVideoExpiryScheduler;
const stopVideoExpiryScheduler = () => {
    if (schedulerInterval) {
        clearInterval(schedulerInterval);
        schedulerInterval = null;
        console.log('Video expiry scheduler stopped');
    }
};
exports.stopVideoExpiryScheduler = stopVideoExpiryScheduler;
exports.default = {
    processExpiredVideos: exports.processExpiredVideos,
    getUpcomingExpiringVideos: exports.getUpcomingExpiringVideos,
    startVideoExpiryScheduler: exports.startVideoExpiryScheduler,
    stopVideoExpiryScheduler: exports.stopVideoExpiryScheduler,
};
