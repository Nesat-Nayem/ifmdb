"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AboutUsRouter = void 0;
const express_1 = __importDefault(require("express"));
const about_us_controller_1 = require("./about-us.controller");
const authMiddleware_1 = require("../../middlewares/authMiddleware");
const router = express_1.default.Router();
router.get('/', about_us_controller_1.getAboutUs);
router.put('/', (0, authMiddleware_1.auth)('admin'), about_us_controller_1.updateAboutUs);
exports.AboutUsRouter = router;
