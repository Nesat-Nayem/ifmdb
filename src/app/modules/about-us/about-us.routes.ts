import express from 'express';
import { getAboutUs, updateAboutUs } from './about-us.controller';
import { auth } from '../../middlewares/authMiddleware';
import { adminMiddleware } from '../../middlewares/adminMiddleware';

const router = express.Router();

router.get('/', getAboutUs);
router.put('/', auth('admin'), updateAboutUs);

export const AboutUsRouter = router;
