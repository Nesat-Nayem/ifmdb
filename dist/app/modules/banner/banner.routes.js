"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bannerRouter = void 0;
const express_1 = __importDefault(require("express"));
const banner_controller_1 = require("./banner.controller");
const cloudinary_1 = require("../../config/cloudinary");
const authMiddleware_1 = require("../../middlewares/authMiddleware");
const router = express_1.default.Router();
/**
 * @swagger
 * tags:
 *   - name: Banners
 *     description: |
 *       Manage banners for all pages and platforms.
 *
 *       **Banner Types:**
 *       - `home` — Home page banner (Web: 1920×600px recommended, Mobile: 1080×400px)
 *       - `film_mart` — Film Mart listing page banner (Web: 1920×400px, Mobile: 1080×360px)
 *       - `events` — Events listing page banner (Web: 1920×400px, Mobile: 1080×360px)
 *       - `watch_movies` — Watch Movies listing page banner (Web: 1920×400px, Mobile: 1080×360px)
 *
 *       **Platform:**
 *       - `web` — Displayed only on the web application
 *       - `mobile` — Displayed only on the Flutter mobile application
 *       - `both` — Displayed on both web and mobile
 */
/**
 * @swagger
 * components:
 *   schemas:
 *     Banner:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: "64a9f1c2e4b0a1234567890a"
 *         title:
 *           type: string
 *           example: "Moviemart Summer Film Festival"
 *         image:
 *           type: string
 *           example: "https://res.cloudinary.com/demo/image/upload/banner.jpg"
 *         bannerType:
 *           type: string
 *           enum: [home, film_mart, events, watch_movies]
 *           example: home
 *           description: |
 *             Page this banner belongs to:
 *             - `home`: Home page (Web 1920×600px / Mobile 1080×400px)
 *             - `film_mart`: Film Mart page (Web 1920×400px / Mobile 1080×360px)
 *             - `events`: Events page (Web 1920×400px / Mobile 1080×360px)
 *             - `watch_movies`: Watch Movies page (Web 1920×400px / Mobile 1080×360px)
 *         platform:
 *           type: string
 *           enum: [web, mobile, both]
 *           example: both
 *           description: Platform the banner is shown on
 *         isActive:
 *           type: boolean
 *           example: true
 *         order:
 *           type: integer
 *           example: 1
 *         isDeleted:
 *           type: boolean
 *           example: false
 *         createdAt:
 *           type: string
 *           example: "1/6/2025, 12:00:00 AM"
 *         updatedAt:
 *           type: string
 *           example: "1/6/2025, 12:00:00 AM"
 */
/**
 * @swagger
 * components:
 *   schemas:
 *     Error:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         statusCode:
 *           type: integer
 *           example: 400
 *         message:
 *           type: string
 *           example: "Validation error"
 */
/**
 * @swagger
 * /v1/api/banners:
 *   post:
 *     summary: Create a new banner
 *     description: |
 *       Creates a banner with image upload. Only admin is allowed.
 *
 *       **Recommended Image Sizes by Banner Type & Platform:**
 *       | bannerType    | Web (px)    | Mobile (px) |
 *       |---------------|-------------|-------------|
 *       | home          | 1920 × 600  | 1080 × 400  |
 *       | film_mart     | 1920 × 400  | 1080 × 360  |
 *       | events        | 1920 × 400  | 1080 × 360  |
 *       | watch_movies  | 1920 × 400  | 1080 × 360  |
 *     tags: [Banners]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - image
 *               - bannerType
 *               - platform
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Moviemart Summer Film Festival"
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: "Upload banner image. See recommended sizes in description."
 *               bannerType:
 *                 type: string
 *                 enum: [home, film_mart, events, watch_movies]
 *                 default: home
 *                 example: home
 *                 description: |
 *                   Which page this banner belongs to:
 *                   - `home`: Home page banner
 *                   - `film_mart`: Film Mart listing page banner
 *                   - `events`: Events listing page banner
 *                   - `watch_movies`: Watch Movies listing page banner
 *               platform:
 *                 type: string
 *                 enum: [web, mobile, both]
 *                 default: both
 *                 example: both
 *                 description: |
 *                   Which platform displays this banner:
 *                   - `web`: Web only (Next.js frontend)
 *                   - `mobile`: Mobile only (Flutter app)
 *                   - `both`: Both web and mobile
 *               isActive:
 *                 type: boolean
 *                 default: true
 *                 example: true
 *               order:
 *                 type: integer
 *                 description: Lower numbers show first
 *                 example: 1
 *     responses:
 *       201:
 *         description: Banner created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 statusCode:
 *                   type: integer
 *                   example: 201
 *                 message:
 *                   type: string
 *                   example: Banner created successfully
 *                 data:
 *                   $ref: '#/components/schemas/Banner'
 *       400:
 *         description: Validation error or missing image
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 */
// Create a new banner with image upload
router.post('/', (0, authMiddleware_1.auth)('admin'), cloudinary_1.upload.single('image'), banner_controller_1.createBanner);
/**
 * @swagger
 * /v1/api/banners:
 *   get:
 *     summary: Get all banners
 *     description: |
 *       Returns all non-deleted banners. Filter by bannerType, platform, and active status.
 *
 *       **Flutter Mobile Usage Example:**
 *       - Home banners for mobile: `GET /v1/api/banners?bannerType=home&platform=mobile&active=true`
 *       - Events banners for mobile: `GET /v1/api/banners?bannerType=events&platform=mobile&active=true`
 *     tags: [Banners]
 *     parameters:
 *       - in: query
 *         name: active
 *         schema:
 *           type: boolean
 *         description: If true, only active banners are returned
 *         example: true
 *       - in: query
 *         name: bannerType
 *         schema:
 *           type: string
 *           enum: [home, film_mart, events, watch_movies]
 *         description: Filter banners by page type
 *         example: home
 *       - in: query
 *         name: platform
 *         schema:
 *           type: string
 *           enum: [web, mobile, both, all]
 *         description: |
 *           Filter by platform. Use `mobile` to get banners where platform is `mobile` or `both`.
 *           Use `web` to get banners where platform is `web` or `both`. Use `all` to skip filter.
 *         example: mobile
 *     responses:
 *       200:
 *         description: Banners retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 statusCode:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: Banners retrieved successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Banner'
 */
// Get all banners (with optional active filter)
router.get('/', banner_controller_1.getAllBanners);
/**
 * @swagger
 * /v1/api/banners/{id}:
 *   get:
 *     summary: Get a banner by ID
 *     tags: [Banners]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Banner ID
 *     responses:
 *       200:
 *         description: Banner retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 statusCode:
 *                   type: integer
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Banner'
 *       404:
 *         description: Banner not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// Get a single banner by ID
router.get('/:id', banner_controller_1.getBannerById);
/**
 * @swagger
 * /v1/api/banners/{id}:
 *   put:
 *     summary: Update a banner by ID
 *     description: Updates banner fields and optionally replaces the image. Only admin is allowed.
 *     tags: [Banners]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Banner ID
 *     requestBody:
 *       required: false
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: "New Release Spotlight"
 *               image:
 *                 type: string
 *                 format: binary
 *               bannerType:
 *                 type: string
 *                 enum: [home, film_mart, events, watch_movies]
 *                 example: events
 *               platform:
 *                 type: string
 *                 enum: [web, mobile, both]
 *                 example: mobile
 *               isActive:
 *                 type: boolean
 *                 example: false
 *               order:
 *                 type: integer
 *                 example: 3
 *     responses:
 *       200:
 *         description: Banner updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 statusCode:
 *                   type: integer
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Banner'
 *       404:
 *         description: Banner not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 */
// Update a banner by ID with optional image upload
router.put('/:id', (0, authMiddleware_1.auth)('admin'), cloudinary_1.upload.single('image'), banner_controller_1.updateBannerById);
/**
 * @swagger
 * /v1/api/banners/{id}:
 *   delete:
 *     summary: Delete a banner by ID (soft delete)
 *     description: Marks the banner as deleted. Only admin is allowed.
 *     tags: [Banners]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Banner ID
 *     responses:
 *       200:
 *         description: Banner deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 statusCode:
 *                   type: integer
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Banner'
 *       404:
 *         description: Banner not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// Delete a banner by ID (soft delete)
router.delete('/:id', (0, authMiddleware_1.auth)('admin'), banner_controller_1.deleteBannerById);
exports.bannerRouter = router;
