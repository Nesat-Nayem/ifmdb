/**
 * Video Expiry Scheduler
 * 
 * Handles automatic deletion/hiding of expired videos and episodes
 * Runs periodically to check for expired content and process them
 */

import mongoose from 'mongoose';
import { WatchVideo } from '../modules/watch-videos/watch-videos.model';
import Event from '../modules/events/events.model';
import Movie from '../modules/movies/movies.model';

/**
 * Process expired content (Videos, Events, Trade Movies)
 * - Hides content that has passed their visibleUntil date
 * - Deletes content with autoDeleteOnExpiry flag set to true
 */
export const processExpiredContent = async (): Promise<{
  videos: { hidden: number; deleted: number };
  events: { hidden: number; deleted: number };
  movies: { hidden: number; deleted: number };
  errors: string[];
}> => {
  const now = new Date();
  const result = {
    videos: { hidden: 0, deleted: 0 },
    events: { hidden: 0, deleted: 0 },
    movies: { hidden: 0, deleted: 0 },
    errors: [] as string[],
  };

  try {
    // 1. Process Expired Watch Videos
    const expiredVideos = await WatchVideo.find({
      isScheduled: true,
      visibleUntil: { $lte: now },
      isActive: true,
    });

    for (const video of expiredVideos) {
      try {
        if ((video as any).autoDeleteOnExpiry) {
          await WatchVideo.findByIdAndDelete(video._id);
          result.videos.deleted++;
        } else {
          await WatchVideo.findByIdAndUpdate(video._id, { isActive: false, status: 'archived' });
          result.videos.hidden++;
        }
      } catch (err: any) {
        result.errors.push(`Video ${video._id}: ${err.message}`);
      }
    }

    // 2. Process Expired Events
    const expiredEvents = await Event.find({
      isScheduled: true,
      visibleUntil: { $lte: now },
      isActive: true,
    });

    for (const event of expiredEvents) {
      try {
        if ((event as any).autoDeleteOnExpiry) {
          await Event.findByIdAndDelete(event._id);
          result.events.deleted++;
        } else {
          await Event.findByIdAndUpdate(event._id, { isActive: false, status: 'completed' });
          result.events.hidden++;
        }
      } catch (err: any) {
        result.errors.push(`Event ${event._id}: ${err.message}`);
      }
    }

    // 3. Process Expired Trade Movies
    const expiredMovies = await Movie.find({
      isScheduled: true,
      visibleUntil: { $lte: now },
      isActive: true,
    });

    for (const movie of expiredMovies) {
      try {
        if ((movie as any).autoDeleteOnExpiry) {
          await Movie.findByIdAndDelete(movie._id);
          result.movies.deleted++;
        } else {
          await Movie.findByIdAndUpdate(movie._id, { isActive: false, status: 'released' });
          result.movies.hidden++;
        }
      } catch (err: any) {
        result.errors.push(`Movie ${movie._id}: ${err.message}`);
      }
    }

    // Process expired episodes within series
    await processExpiredEpisodes(now, result);

  } catch (error: any) {
    result.errors.push(`General error: ${error.message}`);
  }

  return result;
};

/**
 * Process expired episodes within series
 */
const processExpiredEpisodes = async (
  now: Date,
  result: any
): Promise<void> => {
  try {
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
                  season.episodes.splice(i, 1);
                  result.videos.deleted++;
                  hasChanges = true;
                } else {
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
        seriesData.totalEpisodes = seriesData.seasons.reduce(
          (total: number, season: any) => total + (season.episodes?.length || 0),
          0
        );
        await series.save();
      }
    }
  } catch (error: any) {
    result.errors.push(`Episodes error: ${error.message}`);
  }
};

/**
 * Get upcoming expiring content (for admin dashboard)
 */
export const getUpcomingExpiringContent = async (daysAhead: number = 7): Promise<any> => {
  const now = new Date();
  const futureDate = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);

  const filter = {
    isScheduled: true,
    isActive: true,
    visibleUntil: { $gte: now, $lte: futureDate },
  };

  const [videos, events, movies] = await Promise.all([
    WatchVideo.find(filter).select('title thumbnailUrl visibleUntil autoDeleteOnExpiry').lean(),
    Event.find(filter).select('title posterImage visibleUntil autoDeleteOnExpiry').lean(),
    Movie.find(filter).select('title posterUrl visibleUntil autoDeleteOnExpiry').lean(),
  ]);

  return { videos, events, movies };
};

let schedulerInterval: NodeJS.Timeout | null = null;

export const startVideoExpiryScheduler = (intervalMs: number = 60 * 60 * 1000): void => {
  if (schedulerInterval) return;

  console.log(`Starting content expiry scheduler (interval: ${intervalMs / 1000 / 60} minutes)`);

  processExpiredContent().then(r => console.log('Initial check:', r)).catch(e => console.error(e));

  schedulerInterval = setInterval(async () => {
    try {
      const result = await processExpiredContent();
      console.log('Scheduled check completed:', result);
    } catch (error) {
      console.error('Scheduled check failed:', error);
    }
  }, intervalMs);
};

export const stopVideoExpiryScheduler = (): void => {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
  }
};

export default {
  processExpiredContent,
  getUpcomingExpiringContent,
  startVideoExpiryScheduler,
  stopVideoExpiryScheduler,
};
