/**
 * Video Expiry Scheduler
 * 
 * Handles automatic deletion/hiding of expired videos and episodes
 * Runs periodically to check for expired content and process them
 */

import mongoose from 'mongoose';
import { WatchVideo } from '../modules/watch-videos/watch-videos.model';

/**
 * Process expired videos
 * - Hides videos that have passed their visibleUntil date
 * - Deletes videos with autoDeleteOnExpiry flag set to true
 */
export const processExpiredVideos = async (): Promise<{
  hidden: number;
  deleted: number;
  errors: string[];
}> => {
  const now = new Date();
  const result = {
    hidden: 0,
    deleted: 0,
    errors: [] as string[],
  };

  try {
    // Find all expired videos that need processing
    const expiredVideos = await WatchVideo.find({
      isScheduled: true,
      visibleUntil: { $lte: now },
      isActive: true, // Only process active videos
    });

    console.log(`Found ${expiredVideos.length} expired videos to process`);

    for (const video of expiredVideos) {
      try {
        const videoData = video as any;
        
        if (videoData.autoDeleteOnExpiry) {
          // Permanently delete the video
          await WatchVideo.findByIdAndDelete(video._id);
          result.deleted++;
          console.log(`Deleted expired video: ${video.title} (${video._id})`);
        } else {
          // Just hide the video (set isActive to false)
          await WatchVideo.findByIdAndUpdate(video._id, { 
            isActive: false,
            status: 'archived'
          });
          result.hidden++;
          console.log(`Hidden expired video: ${video.title} (${video._id})`);
        }
      } catch (videoError: any) {
        const errorMsg = `Error processing video ${video._id}: ${videoError.message}`;
        result.errors.push(errorMsg);
        console.error(errorMsg);
      }
    }

    // Also process expired episodes within series
    await processExpiredEpisodes(now, result);

  } catch (error: any) {
    const errorMsg = `Error in processExpiredVideos: ${error.message}`;
    result.errors.push(errorMsg);
    console.error(errorMsg);
  }

  return result;
};

/**
 * Process expired episodes within series
 */
const processExpiredEpisodes = async (
  now: Date,
  result: { hidden: number; deleted: number; errors: string[] }
): Promise<void> => {
  try {
    // Find all series with scheduled episodes
    const seriesWithEpisodes = await WatchVideo.find({
      videoType: 'series',
      isActive: true,
      'seasons.episodes.isScheduled': true,
    });

    for (const series of seriesWithEpisodes) {
      const seriesData = series as any;
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
                } else {
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
        seriesData.totalEpisodes = seriesData.seasons.reduce(
          (total: number, season: any) => total + (season.episodes?.length || 0),
          0
        );
        await series.save();
      }
    }
  } catch (error: any) {
    const errorMsg = `Error processing expired episodes: ${error.message}`;
    result.errors.push(errorMsg);
    console.error(errorMsg);
  }
};

/**
 * Get upcoming expiring videos (for admin dashboard)
 */
export const getUpcomingExpiringVideos = async (daysAhead: number = 7): Promise<any[]> => {
  const now = new Date();
  const futureDate = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);

  const expiringVideos = await WatchVideo.find({
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
};

/**
 * Start the scheduler
 * Runs every hour to check for expired content
 */
let schedulerInterval: NodeJS.Timeout | null = null;

export const startVideoExpiryScheduler = (intervalMs: number = 60 * 60 * 1000): void => {
  if (schedulerInterval) {
    console.log('Video expiry scheduler is already running');
    return;
  }

  console.log(`Starting video expiry scheduler (interval: ${intervalMs / 1000 / 60} minutes)`);

  // Run immediately on start
  processExpiredVideos()
    .then((result) => {
      console.log(`Initial video expiry check completed:`, result);
    })
    .catch((error) => {
      console.error('Initial video expiry check failed:', error);
    });

  // Schedule periodic runs
  schedulerInterval = setInterval(async () => {
    console.log('Running scheduled video expiry check...');
    try {
      const result = await processExpiredVideos();
      console.log('Video expiry check completed:', result);
    } catch (error) {
      console.error('Scheduled video expiry check failed:', error);
    }
  }, intervalMs);
};

export const stopVideoExpiryScheduler = (): void => {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
    console.log('Video expiry scheduler stopped');
  }
};

export default {
  processExpiredVideos,
  getUpcomingExpiringVideos,
  startVideoExpiryScheduler,
  stopVideoExpiryScheduler,
};
