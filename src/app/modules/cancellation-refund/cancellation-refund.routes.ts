import express from 'express';
import { getCancellationRefund, updateCancellationRefund } from './cancellation-refund.controller';
import { auth } from '../../middlewares/authMiddleware';
import { adminMiddleware } from '../../middlewares/adminMiddleware';

const router = express.Router();

router.get('/', getCancellationRefund);
router.put('/', auth('admin'), updateCancellationRefund);

export const CancellationRefundRouter = router;
