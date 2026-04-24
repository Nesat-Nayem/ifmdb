"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.eventTypeRouter = void 0;
const express_1 = __importDefault(require("express"));
const event_type_controller_1 = require("./event-type.controller");
const authMiddleware_1 = require("../../middlewares/authMiddleware");
const router = express_1.default.Router();
// Public: used by events-add / events-edit forms to populate the Event Type <select>
router.get('/active', event_type_controller_1.EventTypeController.getActiveEventTypes);
// Admin CRUD
router.get('/', (0, authMiddleware_1.auth)('admin'), event_type_controller_1.EventTypeController.getAllEventTypes);
router.post('/', (0, authMiddleware_1.auth)('admin'), event_type_controller_1.EventTypeController.createEventType);
router.get('/:id', (0, authMiddleware_1.auth)('admin'), event_type_controller_1.EventTypeController.getEventTypeById);
router.put('/:id', (0, authMiddleware_1.auth)('admin'), event_type_controller_1.EventTypeController.updateEventType);
router.delete('/:id', (0, authMiddleware_1.auth)('admin'), event_type_controller_1.EventTypeController.deleteEventType);
exports.eventTypeRouter = router;
