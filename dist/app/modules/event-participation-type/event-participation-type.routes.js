"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.eventParticipationTypeRouter = void 0;
const express_1 = __importDefault(require("express"));
const event_participation_type_controller_1 = require("./event-participation-type.controller");
const authMiddleware_1 = require("../../middlewares/authMiddleware");
const router = express_1.default.Router();
router.get('/active', event_participation_type_controller_1.EventParticipationTypeController.getActiveParticipationTypes);
router.get('/', (0, authMiddleware_1.auth)('admin'), event_participation_type_controller_1.EventParticipationTypeController.getAllParticipationTypes);
router.post('/', (0, authMiddleware_1.auth)('admin'), event_participation_type_controller_1.EventParticipationTypeController.createParticipationType);
router.get('/:id', (0, authMiddleware_1.auth)('admin'), event_participation_type_controller_1.EventParticipationTypeController.getParticipationTypeById);
router.put('/:id', (0, authMiddleware_1.auth)('admin'), event_participation_type_controller_1.EventParticipationTypeController.updateParticipationType);
router.delete('/:id', (0, authMiddleware_1.auth)('admin'), event_participation_type_controller_1.EventParticipationTypeController.deleteParticipationType);
exports.eventParticipationTypeRouter = router;
