"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const section_settings_controller_1 = require("./section-settings.controller");
const authMiddleware_1 = require("../../middlewares/authMiddleware");
const router = express_1.default.Router();
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
router.get('/', section_settings_controller_1.SectionSettingsController.getAllSectionSettings);
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
router.get('/dividers', (0, authMiddleware_1.auth)('admin'), section_settings_controller_1.SectionSettingsController.getAllSectionDividers);
/**
 * @swagger
 * /section-settings/dividers:
 *   post:
 *     summary: Create section divider
 *     tags: [Section Settings - Dividers]
 *     security:
 *       - bearerAuth: []
 */
router.post('/dividers', (0, authMiddleware_1.auth)('admin'), section_settings_controller_1.SectionSettingsController.createSectionDivider);
/**
 * @swagger
 * /section-settings/dividers/order:
 *   patch:
 *     summary: Update section dividers order
 *     tags: [Section Settings - Dividers]
 *     security:
 *       - bearerAuth: []
 */
router.patch('/dividers/order', (0, authMiddleware_1.auth)('admin'), section_settings_controller_1.SectionSettingsController.updateDividersOrder);
/**
 * @swagger
 * /section-settings/dividers/{key}:
 *   get:
 *     summary: Get section divider by key
 *     tags: [Section Settings - Dividers]
 *     security:
 *       - bearerAuth: []
 */
router.get('/dividers/:key', (0, authMiddleware_1.auth)('admin'), section_settings_controller_1.SectionSettingsController.getSectionDividerByKey);
/**
 * @swagger
 * /section-settings/dividers/{key}:
 *   put:
 *     summary: Update section divider
 *     tags: [Section Settings - Dividers]
 *     security:
 *       - bearerAuth: []
 */
router.put('/dividers/:key', (0, authMiddleware_1.auth)('admin'), section_settings_controller_1.SectionSettingsController.updateSectionDivider);
/**
 * @swagger
 * /section-settings/dividers/{key}:
 *   delete:
 *     summary: Delete section divider
 *     tags: [Section Settings - Dividers]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/dividers/:key', (0, authMiddleware_1.auth)('admin'), section_settings_controller_1.SectionSettingsController.deleteSectionDivider);
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
router.get('/titles', (0, authMiddleware_1.auth)('admin'), section_settings_controller_1.SectionSettingsController.getAllSectionTitles);
/**
 * @swagger
 * /section-settings/titles:
 *   post:
 *     summary: Create section title
 *     tags: [Section Settings - Titles]
 *     security:
 *       - bearerAuth: []
 */
router.post('/titles', (0, authMiddleware_1.auth)('admin'), section_settings_controller_1.SectionSettingsController.createSectionTitle);
/**
 * @swagger
 * /section-settings/titles/order:
 *   patch:
 *     summary: Update section titles order
 *     tags: [Section Settings - Titles]
 *     security:
 *       - bearerAuth: []
 */
router.patch('/titles/order', (0, authMiddleware_1.auth)('admin'), section_settings_controller_1.SectionSettingsController.updateTitlesOrder);
/**
 * @swagger
 * /section-settings/titles/{key}:
 *   get:
 *     summary: Get section title by key
 *     tags: [Section Settings - Titles]
 *     security:
 *       - bearerAuth: []
 */
router.get('/titles/:key', (0, authMiddleware_1.auth)('admin'), section_settings_controller_1.SectionSettingsController.getSectionTitleByKey);
/**
 * @swagger
 * /section-settings/titles/{key}:
 *   put:
 *     summary: Update section title
 *     tags: [Section Settings - Titles]
 *     security:
 *       - bearerAuth: []
 */
router.put('/titles/:key', (0, authMiddleware_1.auth)('admin'), section_settings_controller_1.SectionSettingsController.updateSectionTitle);
/**
 * @swagger
 * /section-settings/titles/{key}:
 *   delete:
 *     summary: Delete section title
 *     tags: [Section Settings - Titles]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/titles/:key', (0, authMiddleware_1.auth)('admin'), section_settings_controller_1.SectionSettingsController.deleteSectionTitle);
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
router.post('/seed', (0, authMiddleware_1.auth)('admin'), section_settings_controller_1.SectionSettingsController.seedDefaultSettings);
exports.default = router;
