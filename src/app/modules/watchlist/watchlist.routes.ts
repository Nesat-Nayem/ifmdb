import express from 'express';
import { WatchlistController } from './watchlist.controller';
import { auth } from '../../middlewares/authMiddleware';

const router = express.Router();

/**
 * @swagger
 * /v1/api/watchlist:
 *   post:
 *     summary: Add item to watchlist
 *     description: Add a video, movie, or event to user's watchlist
 *     tags: [Watchlist]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - itemType
 *               - itemId
 *             properties:
 *               itemType:
 *                 type: string
 *                 enum: [watch-video, movie, event]
 *               itemId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Added to watchlist successfully
 *       400:
 *         description: Item already in watchlist
 *       401:
 *         description: Unauthorized
 */
router.post('/', auth(), WatchlistController.addToWatchlist);

/**
 * @swagger
 * /v1/api/watchlist:
 *   delete:
 *     summary: Remove item from watchlist
 *     description: Remove a video, movie, or event from user's watchlist
 *     tags: [Watchlist]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - itemType
 *               - itemId
 *             properties:
 *               itemType:
 *                 type: string
 *                 enum: [watch-video, movie, event]
 *               itemId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Removed from watchlist successfully
 *       404:
 *         description: Item not found in watchlist
 */
router.delete('/', auth(), WatchlistController.removeFromWatchlist);

/**
 * @swagger
 * /v1/api/watchlist/check/{itemType}/{itemId}:
 *   get:
 *     summary: Check if item is in watchlist
 *     description: Check if a specific item is in user's watchlist
 *     tags: [Watchlist]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: itemType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [watch-video, movie, event]
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Watchlist status retrieved
 */
router.get('/check/:itemType/:itemId', auth(), WatchlistController.checkWatchlistStatus);

/**
 * @swagger
 * /v1/api/watchlist:
 *   get:
 *     summary: Get user's watchlist
 *     description: Retrieve all items in user's watchlist with pagination
 *     tags: [Watchlist]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: itemType
 *         schema:
 *           type: string
 *           enum: [watch-video, movie, event]
 *         description: Filter by item type
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Watchlist retrieved successfully
 */
router.get('/', auth(), WatchlistController.getUserWatchlist);

/**
 * @swagger
 * /v1/api/watchlist/counts:
 *   get:
 *     summary: Get watchlist counts
 *     description: Get count of items in watchlist by type
 *     tags: [Watchlist]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Watchlist counts retrieved
 */
router.get('/counts', auth(), WatchlistController.getWatchlistCounts);

export default router;
