"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PartnerTermsRouter = void 0;
const express_1 = __importDefault(require("express"));
const partner_terms_controller_1 = require("./partner-terms.controller");
const authMiddleware_1 = require("../../middlewares/authMiddleware");
const router = express_1.default.Router();
router.get('/', partner_terms_controller_1.getPartnerTerms);
router.put('/', (0, authMiddleware_1.auth)('admin'), partner_terms_controller_1.updatePartnerTerms);
exports.PartnerTermsRouter = router;
