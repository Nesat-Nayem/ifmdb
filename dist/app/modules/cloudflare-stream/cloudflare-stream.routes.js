"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cloudflareStreamRouter = void 0;
const express_1 = require("express");
const cloudflare_stream_controller_1 = require("./cloudflare-stream.controller");
const authMiddleware_1 = require("../../middlewares/authMiddleware");
const router = (0, express_1.Router)();
// Get Cloudflare config
router.get('/config', cloudflare_stream_controller_1.CloudflareStreamController.getConfig);
// Generate direct upload URL (for files under 200MB)
router.post('/upload-url', (0, authMiddleware_1.auth)(), cloudflare_stream_controller_1.CloudflareStreamController.getDirectUploadUrl);
// Generate TUS upload URL (for resumable uploads / large files)
router.post('/tus-upload-url', (0, authMiddleware_1.auth)(), cloudflare_stream_controller_1.CloudflareStreamController.getTusUploadUrl);
// Get video details
router.get('/video/:videoId', cloudflare_stream_controller_1.CloudflareStreamController.getVideoDetails);
// Get video status (for polling during processing)
router.get('/video/:videoId/status', cloudflare_stream_controller_1.CloudflareStreamController.getVideoStatus);
// Delete video
router.delete('/video/:videoId', (0, authMiddleware_1.auth)(), cloudflare_stream_controller_1.CloudflareStreamController.deleteVideo);
// List all videos (admin only)
router.get('/videos', (0, authMiddleware_1.auth)(), cloudflare_stream_controller_1.CloudflareStreamController.listVideos);
exports.cloudflareStreamRouter = router;
