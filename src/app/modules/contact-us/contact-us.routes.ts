import express from 'express';
import { getContactUs, updateContactUs } from './contact-us.controller';
import { auth } from '../../middlewares/authMiddleware';
import { adminMiddleware } from '../../middlewares/adminMiddleware';

const router = express.Router();

router.get('/', getContactUs);
router.put('/', auth('admin'), updateContactUs);

export const ContactUsRouter = router;
