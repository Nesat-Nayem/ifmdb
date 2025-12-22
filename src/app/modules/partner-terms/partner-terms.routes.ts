import express from 'express';
import { getPartnerTerms, updatePartnerTerms } from './partner-terms.controller';
import { auth } from '../../middlewares/authMiddleware';
import { adminMiddleware } from '../../middlewares/adminMiddleware';

const router = express.Router();

router.get('/', getPartnerTerms);
router.put('/', auth('admin'), updatePartnerTerms);

export const PartnerTermsRouter = router;
