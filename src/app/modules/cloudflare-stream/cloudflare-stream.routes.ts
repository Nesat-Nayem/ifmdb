import { Router } from 'express';
import { CloudflareStreamController } from './cloudflare-stream.controller';
import { auth } from '../../middlewares/authMiddleware';

const router = Router();

// Get Cloudflare config
router.get('/config', CloudflareStreamController.getConfig);

// Generate direct upload URL (for files under 200MB)
router.post('/upload-url', auth(), CloudflareStreamController.getDirectUploadUrl);

// Generate TUS upload URL (for resumable uploads / large files)
router.post('/tus-upload-url', auth(), CloudflareStreamController.getTusUploadUrl);

// Get video details
router.get('/video/:videoId', CloudflareStreamController.getVideoDetails);

// Get video status (for polling during processing)
router.get('/video/:videoId/status', CloudflareStreamController.getVideoStatus);

// Delete video
router.delete('/video/:videoId', auth(), CloudflareStreamController.deleteVideo);

// List all videos (admin only)
router.get('/videos', auth(), CloudflareStreamController.listVideos);

export const cloudflareStreamRouter = router;
