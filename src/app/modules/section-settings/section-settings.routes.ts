import express from 'express';
import { SectionSettingsController } from './section-settings.controller';
import { auth } from '../../middlewares/authMiddleware';

const router = express.Router();

// ==================== PUBLIC ROUTES ====================

/**
 * @swagger
 * /section-settings:
 *   get:
 *     summary: Get all section settings (for frontend)
 *     tags: [Section Settings]
 *     responses:
 *       200:
 *         description: Section settings retrieved successfully
 */
router.get('/', SectionSettingsController.getAllSectionSettings);

// ==================== SECTION DIVIDER ROUTES (Admin Only) ====================

/**
 * @swagger
 * /section-settings/dividers:
 *   get:
 *     summary: Get all section dividers
 *     tags: [Section Settings - Dividers]
 *     security:
 *       - bearerAuth: []
 */
router.get('/dividers', auth('admin'), SectionSettingsController.getAllSectionDividers);

/**
 * @swagger
 * /section-settings/dividers:
 *   post:
 *     summary: Create section divider
 *     tags: [Section Settings - Dividers]
 *     security:
 *       - bearerAuth: []
 */
router.post('/dividers', auth('admin'), SectionSettingsController.createSectionDivider);

/**
 * @swagger
 * /section-settings/dividers/order:
 *   patch:
 *     summary: Update section dividers order
 *     tags: [Section Settings - Dividers]
 *     security:
 *       - bearerAuth: []
 */
router.patch('/dividers/order', auth('admin'), SectionSettingsController.updateDividersOrder);

/**
 * @swagger
 * /section-settings/dividers/{key}:
 *   get:
 *     summary: Get section divider by key
 *     tags: [Section Settings - Dividers]
 *     security:
 *       - bearerAuth: []
 */
router.get('/dividers/:key', auth('admin'), SectionSettingsController.getSectionDividerByKey);

/**
 * @swagger
 * /section-settings/dividers/{key}:
 *   put:
 *     summary: Update section divider
 *     tags: [Section Settings - Dividers]
 *     security:
 *       - bearerAuth: []
 */
router.put('/dividers/:key', auth('admin'), SectionSettingsController.updateSectionDivider);

/**
 * @swagger
 * /section-settings/dividers/{key}:
 *   delete:
 *     summary: Delete section divider
 *     tags: [Section Settings - Dividers]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/dividers/:key', auth('admin'), SectionSettingsController.deleteSectionDivider);

// ==================== SECTION TITLE ROUTES (Admin Only) ====================

/**
 * @swagger
 * /section-settings/titles:
 *   get:
 *     summary: Get all section titles
 *     tags: [Section Settings - Titles]
 *     security:
 *       - bearerAuth: []
 */
router.get('/titles', auth('admin'), SectionSettingsController.getAllSectionTitles);

/**
 * @swagger
 * /section-settings/titles:
 *   post:
 *     summary: Create section title
 *     tags: [Section Settings - Titles]
 *     security:
 *       - bearerAuth: []
 */
router.post('/titles', auth('admin'), SectionSettingsController.createSectionTitle);

/**
 * @swagger
 * /section-settings/titles/order:
 *   patch:
 *     summary: Update section titles order
 *     tags: [Section Settings - Titles]
 *     security:
 *       - bearerAuth: []
 */
router.patch('/titles/order', auth('admin'), SectionSettingsController.updateTitlesOrder);

/**
 * @swagger
 * /section-settings/titles/{key}:
 *   get:
 *     summary: Get section title by key
 *     tags: [Section Settings - Titles]
 *     security:
 *       - bearerAuth: []
 */
router.get('/titles/:key', auth('admin'), SectionSettingsController.getSectionTitleByKey);

/**
 * @swagger
 * /section-settings/titles/{key}:
 *   put:
 *     summary: Update section title
 *     tags: [Section Settings - Titles]
 *     security:
 *       - bearerAuth: []
 */
router.put('/titles/:key', auth('admin'), SectionSettingsController.updateSectionTitle);

/**
 * @swagger
 * /section-settings/titles/{key}:
 *   delete:
 *     summary: Delete section title
 *     tags: [Section Settings - Titles]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/titles/:key', auth('admin'), SectionSettingsController.deleteSectionTitle);

// ==================== UTILITY ROUTES ====================

/**
 * @swagger
 * /section-settings/seed:
 *   post:
 *     summary: Seed default section settings
 *     tags: [Section Settings]
 *     security:
 *       - bearerAuth: []
 */
router.post('/seed', auth('admin'), SectionSettingsController.seedDefaultSettings);

export default router;
