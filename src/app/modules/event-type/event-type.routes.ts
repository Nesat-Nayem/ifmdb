import express from 'express';
import { EventTypeController } from './event-type.controller';
import { auth } from '../../middlewares/authMiddleware';

const router = express.Router();

// Public: used by events-add / events-edit forms to populate the Event Type <select>
router.get('/active', EventTypeController.getActiveEventTypes);

// Admin CRUD
router.get('/', auth('admin'), EventTypeController.getAllEventTypes);
router.post('/', auth('admin'), EventTypeController.createEventType);
router.get('/:id', auth('admin'), EventTypeController.getEventTypeById);
router.put('/:id', auth('admin'), EventTypeController.updateEventType);
router.delete('/:id', auth('admin'), EventTypeController.deleteEventType);

export const eventTypeRouter = router;
