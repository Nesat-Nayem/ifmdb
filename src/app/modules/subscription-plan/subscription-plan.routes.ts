import express from 'express';
import { auth } from '../../middlewares/authMiddleware';
import {
  createSubscriptionPlan,
  getAllSubscriptionPlans,
  getSubscriptionPlanById,
  updateSubscriptionPlanById,
  deleteSubscriptionPlanById,
} from './subscription-plan.controller';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: SubscriptionPlans
 *     description: Manage subscription plans
 */

/**
 * @swagger
 * /v1/api/subscription-plans:
 *   post:
 *     summary: Create a new subscription plan
 *     tags: [SubscriptionPlans]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SubscriptionPlanCreate'
 *     responses:
 *       201:
 *         description: Subscription plan created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/', auth('admin'), createSubscriptionPlan);

/**
 * @swagger
 * /v1/api/subscription-plans:
 *   get:
 *     summary: Get all subscription plans
 *     tags: [SubscriptionPlans]
 *     responses:
 *       200:
 *         description: Subscription plans retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 */
router.get('/', getAllSubscriptionPlans);

/**
 * @swagger
 * /v1/api/subscription-plans/{id}:
 *   get:
 *     summary: Get a subscription plan by ID
 *     tags: [SubscriptionPlans]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Subscription plan ID
 *     responses:
 *       200:
 *         description: Subscription plan retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       404:
 *         description: Subscription plan not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id', getSubscriptionPlanById);

/**
 * @swagger
 * /v1/api/subscription-plans/{id}:
 *   put:
 *     summary: Update a subscription plan by ID
 *     tags: [SubscriptionPlans]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Subscription plan ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SubscriptionPlanUpdate'
 *     responses:
 *       200:
 *         description: Subscription plan updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       404:
 *         description: Subscription plan not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/:id', auth('admin'), updateSubscriptionPlanById);

/**
 * @swagger
 * /v1/api/subscription-plans/{id}:
 *   delete:
 *     summary: Delete a subscription plan by ID (soft delete)
 *     tags: [SubscriptionPlans]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Subscription plan ID
 *     responses:
 *       200:
 *         description: Subscription plan deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       404:
 *         description: Subscription plan not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/:id', auth('admin'), deleteSubscriptionPlanById);

export const subscriptionPlanRouter = router;
