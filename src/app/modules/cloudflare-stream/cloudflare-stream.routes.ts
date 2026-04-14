import { Router } from 'express';
import { CloudflareStreamController } from './cloudflare-stream.controller';
import { auth } from '../../middlewares/authMiddleware';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Cloudflare Stream
 *   description: |
 *     Cloudflare Stream video upload and management endpoints.
 *
 *     **Upload Flow:**
 *     1. Call `/tus-upload-url` (large files) or `/upload-url` (< 200MB) to get an upload URL
 *     2. Upload the video directly to Cloudflare using the returned URL
 *     3. Poll `/video/{videoId}/status` until `readyToStream: true`
 *     4. Call `/video/{videoId}/enable-download` to generate the MP4 download file
 *     5. Save the `videoUrl` (iframe embed URL) and `uid` to your WatchVideo record
 *
 *     **Download URL format:**
 *     `https://customer-{customerCode}.cloudflarestream.com/{uid}/downloads/default.mp4`
 *
 *     > ⚠️ The download URL only works **after** `enable-download` has been called and
 *     > Cloudflare has finished encoding the MP4 (usually 1–5 minutes).
 */

/**
 * @swagger
 * /v1/api/cloudflare-stream/config:
 *   get:
 *     summary: Get Cloudflare Stream configuration
 *     description: Returns the customer code and whether Cloudflare Stream is properly configured. Use this to verify your environment variables are set.
 *     tags: [Cloudflare Stream]
 *     responses:
 *       200:
 *         description: Configuration retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Cloudflare Stream config
 *                 data:
 *                   type: object
 *                   properties:
 *                     customerCode:
 *                       type: string
 *                       example: knrip21zyp1p9ejd
 *                     configured:
 *                       type: boolean
 *                       example: true
 */
router.get('/config', CloudflareStreamController.getConfig);

/**
 * @swagger
 * /v1/api/cloudflare-stream/upload-url:
 *   post:
 *     summary: Generate a direct upload URL (files under 200MB)
 *     description: |
 *       Generates a one-time direct upload URL for uploading video files under 200MB directly to Cloudflare Stream.
 *       For larger files use `/tus-upload-url` instead.
 *     tags: [Cloudflare Stream]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fileSize
 *             properties:
 *               fileSize:
 *                 type: number
 *                 description: File size in bytes (must be > 0)
 *                 example: 52428800
 *               fileName:
 *                 type: string
 *                 description: Original file name
 *                 example: my-movie.mp4
 *               maxDurationSeconds:
 *                 type: number
 *                 description: Maximum allowed video duration in seconds
 *                 default: 3600
 *                 example: 3600
 *               uploadType:
 *                 type: string
 *                 enum: [main, trailer, episode]
 *                 description: Type of upload — trailers max 100MB, episodes max 500MB, main max 2GB
 *                 example: main
 *               videoType:
 *                 type: string
 *                 enum: [single, series]
 *                 description: Video type metadata (size limit is determined by uploadType)
 *                 example: single
 *               meta:
 *                 type: object
 *                 description: Optional metadata to attach to the video in Cloudflare
 *                 example: { title: "My Movie" }
 *     responses:
 *       200:
 *         description: Upload URL generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     uploadURL:
 *                       type: string
 *                       description: One-time URL to upload the video file to
 *                       example: https://upload.videodelivery.net/abc123
 *                     uid:
 *                       type: string
 *                       description: Cloudflare video UID — save this as cloudflareVideoUid
 *                       example: 1512df154348c8aa92125e5451e3d038
 *                     customerCode:
 *                       type: string
 *                       example: knrip21zyp1p9ejd
 *       400:
 *         description: File too large or invalid parameters
 */
router.post('/upload-url', auth(), CloudflareStreamController.getDirectUploadUrl);

/**
 * @swagger
 * /v1/api/cloudflare-stream/tus-upload-url:
 *   post:
 *     summary: Generate a TUS resumable upload URL (large files)
 *     description: |
 *       Generates a TUS protocol upload URL for resumable uploads of large video files.
 *       Use this for files over 200MB. The upload can be paused and resumed.
 *
 *       **Size limits by uploadType:**
 *       - `trailer`: max 100MB
 *       - `episode`: max 500MB
 *       - `main`: max 2GB
 *     tags: [Cloudflare Stream]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fileSize
 *             properties:
 *               fileSize:
 *                 type: number
 *                 description: File size in bytes
 *                 example: 1073741824
 *               fileName:
 *                 type: string
 *                 description: Original file name
 *                 example: the-dark-knight.mp4
 *               maxDurationSeconds:
 *                 type: number
 *                 description: Maximum allowed video duration in seconds
 *                 default: 21600
 *                 example: 7200
 *               uploadType:
 *                 type: string
 *                 enum: [main, trailer, episode]
 *                 description: Type of upload — trailers max 100MB, episodes max 500MB, main max 2GB
 *                 example: main
 *               videoType:
 *                 type: string
 *                 enum: [single, series]
 *                 example: single
 *     responses:
 *       200:
 *         description: TUS upload URL generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     uploadUrl:
 *                       type: string
 *                       description: TUS upload endpoint URL
 *                       example: https://upload.videodelivery.net/tus/abc123
 *                     uid:
 *                       type: string
 *                       description: Cloudflare video UID — save this as cloudflareVideoUid
 *                       example: 1512df154348c8aa92125e5451e3d038
 *                     customerCode:
 *                       type: string
 *                       example: knrip21zyp1p9ejd
 *       400:
 *         description: File too large or Cloudflare configuration missing
 */
router.post('/tus-upload-url', auth(), CloudflareStreamController.getTusUploadUrl);

/**
 * @swagger
 * /v1/api/cloudflare-stream/video/{videoId}:
 *   get:
 *     summary: Get video details from Cloudflare Stream
 *     description: Fetches full metadata for a video from Cloudflare Stream including playback URLs, thumbnail, and processing status.
 *     tags: [Cloudflare Stream]
 *     parameters:
 *       - in: path
 *         name: videoId
 *         required: true
 *         schema:
 *           type: string
 *         description: Cloudflare video UID
 *         example: 1512df154348c8aa92125e5451e3d038
 *     responses:
 *       200:
 *         description: Video details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     uid:
 *                       type: string
 *                       example: 1512df154348c8aa92125e5451e3d038
 *                     status:
 *                       type: string
 *                       example: ready
 *                     readyToStream:
 *                       type: boolean
 *                       example: true
 *                     duration:
 *                       type: number
 *                       example: 120
 *                     embedUrl:
 *                       type: string
 *                       example: https://customer-knrip21zyp1p9ejd.cloudflarestream.com/1512df154348c8aa92125e5451e3d038/iframe
 *                     thumbnailUrl:
 *                       type: string
 *                       example: https://customer-knrip21zyp1p9ejd.cloudflarestream.com/1512df154348c8aa92125e5451e3d038/thumbnails/thumbnail.jpg
 *       404:
 *         description: Video not found
 */
router.get('/video/:videoId', CloudflareStreamController.getVideoDetails);

/**
 * @swagger
 * /v1/api/cloudflare-stream/video/{videoId}/status:
 *   get:
 *     summary: Poll video processing status
 *     description: |
 *       Poll this endpoint after upload to check when the video is ready to stream.
 *       Keep polling until `readyToStream: true` or `pctComplete: 100`.
 *
 *       **Typical states:** `queued` → `inprogress` → `ready` (or `error`)
 *     tags: [Cloudflare Stream]
 *     parameters:
 *       - in: path
 *         name: videoId
 *         required: true
 *         schema:
 *           type: string
 *         description: Cloudflare video UID
 *         example: 1512df154348c8aa92125e5451e3d038
 *     responses:
 *       200:
 *         description: Status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     uid:
 *                       type: string
 *                       example: 1512df154348c8aa92125e5451e3d038
 *                     status:
 *                       type: string
 *                       enum: [queued, inprogress, ready, error]
 *                       example: ready
 *                     readyToStream:
 *                       type: boolean
 *                       example: true
 *                     pctComplete:
 *                       type: number
 *                       description: Processing progress percentage (0–100)
 *                       example: 100
 *                     errorReasonCode:
 *                       type: string
 *                       nullable: true
 *                       example: null
 *                     errorReasonText:
 *                       type: string
 *                       nullable: true
 *                       example: null
 */
router.get('/video/:videoId/status', CloudflareStreamController.getVideoStatus);

/**
 * @swagger
 * /v1/api/cloudflare-stream/video/{videoId}/enable-download:
 *   post:
 *     summary: Enable MP4 download for a video
 *     description: |
 *       Triggers Cloudflare to generate a downloadable MP4 file for the video.
 *       This is the API equivalent of clicking **"Generate Download"** in the Cloudflare Stream dashboard.
 *
 *       **When to call this:**
 *       - Automatically called when a new WatchVideo is created (handled by the backend)
 *       - Call manually for **existing videos** that were uploaded before this feature was added
 *
 *       **After calling this endpoint:**
 *       - Cloudflare encodes the MP4 in the background (takes 1–5 minutes depending on video length)
 *       - Once ready, the download URL becomes active:
 *         `https://customer-{customerCode}.cloudflarestream.com/{uid}/downloads/default.mp4`
 *
 *       **To enable downloads for all existing videos at once**, call this endpoint for each video UID:
 *       ```
 *       POST /v1/api/cloudflare-stream/video/{uid}/enable-download
 *       Authorization: Bearer <admin-token>
 *       ```
 *     tags: [Cloudflare Stream]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: videoId
 *         required: true
 *         schema:
 *           type: string
 *         description: Cloudflare video UID (the hex string from the iframe URL or cloudflareVideoUid field)
 *         example: 1512df154348c8aa92125e5451e3d038
 *     responses:
 *       200:
 *         description: Download generation triggered successfully. The MP4 will be ready in 1–5 minutes.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Download generation triggered successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     uid:
 *                       type: string
 *                       example: 1512df154348c8aa92125e5451e3d038
 *                     status:
 *                       type: string
 *                       enum: [inprogress, ready]
 *                       description: inprogress = still encoding, ready = download URL is active
 *                       example: inprogress
 *                     url:
 *                       type: string
 *                       description: The download URL (active once status becomes ready)
 *                       example: https://customer-knrip21zyp1p9ejd.cloudflarestream.com/1512df154348c8aa92125e5451e3d038/downloads/default.mp4
 *       400:
 *         description: Failed to enable download (e.g. video not yet ready to stream)
 *       401:
 *         description: Unauthorized — Bearer token required
 */
router.post('/video/:videoId/enable-download', auth(), CloudflareStreamController.enableDownload);

/**
 * @swagger
 * /v1/api/cloudflare-stream/video/{videoId}:
 *   delete:
 *     summary: Delete a video from Cloudflare Stream
 *     description: Permanently deletes a video from Cloudflare Stream. This cannot be undone.
 *     tags: [Cloudflare Stream]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: videoId
 *         required: true
 *         schema:
 *           type: string
 *         description: Cloudflare video UID
 *         example: 1512df154348c8aa92125e5451e3d038
 *     responses:
 *       200:
 *         description: Video deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Video deleted successfully
 *                 data:
 *                   nullable: true
 *                   example: null
 *       401:
 *         description: Unauthorized
 */
router.delete('/video/:videoId', auth(), CloudflareStreamController.deleteVideo);

/**
 * @swagger
 * /v1/api/cloudflare-stream/videos:
 *   get:
 *     summary: List all videos in Cloudflare Stream (admin only)
 *     description: Returns all videos stored in your Cloudflare Stream account. Useful for auditing or bulk operations.
 *     tags: [Cloudflare Stream]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Videos listed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       uid:
 *                         type: string
 *                         example: 1512df154348c8aa92125e5451e3d038
 *                       status:
 *                         type: object
 *                         properties:
 *                           state:
 *                             type: string
 *                             example: ready
 *                       readyToStream:
 *                         type: boolean
 *                         example: true
 *                       meta:
 *                         type: object
 *                       created:
 *                         type: string
 *                         format: date-time
 *       401:
 *         description: Unauthorized
 */
router.get('/videos', auth(), CloudflareStreamController.listVideos);

export const cloudflareStreamRouter = router;
