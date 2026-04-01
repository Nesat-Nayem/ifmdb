import express from 'express';
import { EventParticipationTypeController } from './event-participation-type.controller';
import { auth } from '../../middlewares/authMiddleware';

const router = express.Router();

router.get('/active', EventParticipationTypeController.getActiveParticipationTypes);

router.get('/', auth('admin'), EventParticipationTypeController.getAllParticipationTypes);

router.post('/', auth('admin'), EventParticipationTypeController.createParticipationType);

router.get('/:id', auth('admin'), EventParticipationTypeController.getParticipationTypeById);

router.put('/:id', auth('admin'), EventParticipationTypeController.updateParticipationType);

router.delete('/:id', auth('admin'), EventParticipationTypeController.deleteParticipationType);

export const eventParticipationTypeRouter = router;
