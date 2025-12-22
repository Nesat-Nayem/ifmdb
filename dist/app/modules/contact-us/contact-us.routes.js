"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContactUsRouter = void 0;
const express_1 = __importDefault(require("express"));
const contact_us_controller_1 = require("./contact-us.controller");
const authMiddleware_1 = require("../../middlewares/authMiddleware");
const router = express_1.default.Router();
router.get('/', contact_us_controller_1.getContactUs);
router.put('/', (0, authMiddleware_1.auth)('admin'), contact_us_controller_1.updateContactUs);
exports.ContactUsRouter = router;
