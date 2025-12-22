"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SectionSettingsController = void 0;
const http_status_1 = __importDefault(require("http-status"));
const catchAsync_1 = require("../../utils/catchAsync");
const sendResponse_1 = require("../../utils/sendResponse");
const section_settings_model_1 = require("./section-settings.model");
// ==================== SECTION DIVIDER CONTROLLERS ====================
// Get all section dividers
const getAllSectionDividers = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { isActive } = req.query;
    const query = {};
    if (isActive !== undefined) {
        query.isActive = isActive === 'true';
    }
    const dividers = yield section_settings_model_1.SectionDivider.find(query).sort({ order: 1 });
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Section dividers retrieved successfully',
        data: dividers
    });
}));
// Get section divider by key
const getSectionDividerByKey = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { key } = req.params;
    const divider = yield section_settings_model_1.SectionDivider.findOne({ sectionKey: key });
    if (!divider) {
        return (0, sendResponse_1.sendResponse)(res, {
            statusCode: http_status_1.default.NOT_FOUND,
            success: false,
            message: 'Section divider not found',
            data: null
        });
    }
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Section divider retrieved successfully',
        data: divider
    });
}));
// Create section divider
const createSectionDivider = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const dividerData = req.body;
    const existing = yield section_settings_model_1.SectionDivider.findOne({ sectionKey: dividerData.sectionKey });
    if (existing) {
        return (0, sendResponse_1.sendResponse)(res, {
            statusCode: http_status_1.default.BAD_REQUEST,
            success: false,
            message: 'Section divider with this key already exists',
            data: null
        });
    }
    const divider = yield section_settings_model_1.SectionDivider.create(dividerData);
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_1.default.CREATED,
        success: true,
        message: 'Section divider created successfully',
        data: divider
    });
}));
// Update section divider
const updateSectionDivider = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { key } = req.params;
    const updateData = req.body;
    const divider = yield section_settings_model_1.SectionDivider.findOneAndUpdate({ sectionKey: key }, updateData, { new: true, runValidators: true });
    if (!divider) {
        return (0, sendResponse_1.sendResponse)(res, {
            statusCode: http_status_1.default.NOT_FOUND,
            success: false,
            message: 'Section divider not found',
            data: null
        });
    }
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Section divider updated successfully',
        data: divider
    });
}));
// Delete section divider
const deleteSectionDivider = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { key } = req.params;
    const divider = yield section_settings_model_1.SectionDivider.findOneAndDelete({ sectionKey: key });
    if (!divider) {
        return (0, sendResponse_1.sendResponse)(res, {
            statusCode: http_status_1.default.NOT_FOUND,
            success: false,
            message: 'Section divider not found',
            data: null
        });
    }
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Section divider deleted successfully',
        data: null
    });
}));
// Bulk update section dividers order
const updateDividersOrder = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { orders } = req.body; // [{ sectionKey: string, order: number }]
    if (!Array.isArray(orders)) {
        return (0, sendResponse_1.sendResponse)(res, {
            statusCode: http_status_1.default.BAD_REQUEST,
            success: false,
            message: 'Orders must be an array',
            data: null
        });
    }
    const bulkOps = orders.map((item) => ({
        updateOne: {
            filter: { sectionKey: item.sectionKey },
            update: { $set: { order: item.order } }
        }
    }));
    yield section_settings_model_1.SectionDivider.bulkWrite(bulkOps);
    const dividers = yield section_settings_model_1.SectionDivider.find().sort({ order: 1 });
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Section dividers order updated successfully',
        data: dividers
    });
}));
// ==================== SECTION TITLE CONTROLLERS ====================
// Get all section titles
const getAllSectionTitles = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { isActive, parentDivider } = req.query;
    const query = {};
    if (isActive !== undefined) {
        query.isActive = isActive === 'true';
    }
    if (parentDivider) {
        query.parentDivider = parentDivider;
    }
    const titles = yield section_settings_model_1.SectionTitle.find(query).sort({ parentDivider: 1, order: 1 });
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Section titles retrieved successfully',
        data: titles
    });
}));
// Get section title by key
const getSectionTitleByKey = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { key } = req.params;
    const title = yield section_settings_model_1.SectionTitle.findOne({ sectionKey: key });
    if (!title) {
        return (0, sendResponse_1.sendResponse)(res, {
            statusCode: http_status_1.default.NOT_FOUND,
            success: false,
            message: 'Section title not found',
            data: null
        });
    }
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Section title retrieved successfully',
        data: title
    });
}));
// Create section title
const createSectionTitle = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const titleData = req.body;
    const existing = yield section_settings_model_1.SectionTitle.findOne({ sectionKey: titleData.sectionKey });
    if (existing) {
        return (0, sendResponse_1.sendResponse)(res, {
            statusCode: http_status_1.default.BAD_REQUEST,
            success: false,
            message: 'Section title with this key already exists',
            data: null
        });
    }
    const title = yield section_settings_model_1.SectionTitle.create(titleData);
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_1.default.CREATED,
        success: true,
        message: 'Section title created successfully',
        data: title
    });
}));
// Update section title
const updateSectionTitle = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { key } = req.params;
    const updateData = req.body;
    const title = yield section_settings_model_1.SectionTitle.findOneAndUpdate({ sectionKey: key }, updateData, { new: true, runValidators: true });
    if (!title) {
        return (0, sendResponse_1.sendResponse)(res, {
            statusCode: http_status_1.default.NOT_FOUND,
            success: false,
            message: 'Section title not found',
            data: null
        });
    }
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Section title updated successfully',
        data: title
    });
}));
// Delete section title
const deleteSectionTitle = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { key } = req.params;
    const title = yield section_settings_model_1.SectionTitle.findOneAndDelete({ sectionKey: key });
    if (!title) {
        return (0, sendResponse_1.sendResponse)(res, {
            statusCode: http_status_1.default.NOT_FOUND,
            success: false,
            message: 'Section title not found',
            data: null
        });
    }
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Section title deleted successfully',
        data: null
    });
}));
// Bulk update section titles order
const updateTitlesOrder = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { orders } = req.body; // [{ sectionKey: string, order: number }]
    if (!Array.isArray(orders)) {
        return (0, sendResponse_1.sendResponse)(res, {
            statusCode: http_status_1.default.BAD_REQUEST,
            success: false,
            message: 'Orders must be an array',
            data: null
        });
    }
    const bulkOps = orders.map((item) => ({
        updateOne: {
            filter: { sectionKey: item.sectionKey },
            update: { $set: { order: item.order } }
        }
    }));
    yield section_settings_model_1.SectionTitle.bulkWrite(bulkOps);
    const titles = yield section_settings_model_1.SectionTitle.find().sort({ parentDivider: 1, order: 1 });
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Section titles order updated successfully',
        data: titles
    });
}));
// ==================== PUBLIC API ====================
// Get all section settings (for frontend)
const getAllSectionSettings = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const [dividers, titles] = yield Promise.all([
        section_settings_model_1.SectionDivider.find({ isActive: true }).sort({ order: 1 }),
        section_settings_model_1.SectionTitle.find({ isActive: true }).sort({ parentDivider: 1, order: 1 })
    ]);
    // Group titles by parent divider
    const groupedData = dividers.map(divider => ({
        divider,
        sections: titles.filter(title => title.parentDivider === divider.sectionKey)
    }));
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Section settings retrieved successfully',
        data: {
            dividers,
            titles,
            grouped: groupedData
        }
    });
}));
// Seed default section settings
const seedDefaultSettings = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // Default Section Dividers
    const defaultDividers = [
        {
            sectionKey: 'trade_movies',
            title: '🎬 Trade Movies',
            subtitle: 'Discover film rights and investment opportunities',
            icon: '🎬',
            order: 1,
            isActive: true
        },
        {
            sectionKey: 'live_events',
            title: '🎭 Live Events & Experiences',
            subtitle: 'Book your next unforgettable experience',
            icon: '🎭',
            order: 2,
            isActive: true
        },
        {
            sectionKey: 'watch_movie',
            title: '🎥 Watch Movie',
            subtitle: 'Stream the latest movies and series',
            icon: '🎥',
            order: 3,
            isActive: true
        }
    ];
    // Default Section Titles
    const defaultTitles = [
        // Trade Movies sections
        { sectionKey: 'hot_rights_available', parentDivider: 'trade_movies', title: '🔥 Hot Rights Available', icon: '🔥', viewMoreLink: '/film-mart?section=hot_rights_available', order: 1 },
        { sectionKey: 'profitable_picks', parentDivider: 'trade_movies', title: '💰 Profitable Picks', icon: '💰', viewMoreLink: '/film-mart?section=profitable_picks', order: 2 },
        { sectionKey: 'international_deals', parentDivider: 'trade_movies', title: '🌍 International Deals', icon: '🌍', viewMoreLink: '/film-mart?section=international_deals', order: 3 },
        { sectionKey: 'indie_gems', parentDivider: 'trade_movies', title: '💎 Indie Gems', icon: '💎', viewMoreLink: '/film-mart?section=indie_gems', order: 4 },
        // Live Events sections
        { sectionKey: 'trending_events', parentDivider: 'live_events', title: '🔥 Trending Events', icon: '🔥', viewMoreLink: '/events?section=trending_events', order: 1 },
        { sectionKey: 'celebrity_events', parentDivider: 'live_events', title: '⭐ Celebrity Events', icon: '⭐', viewMoreLink: '/events?section=celebrity_events', order: 2 },
        { sectionKey: 'exclusive_invite_only', parentDivider: 'live_events', title: '🎟️ Exclusive / Invite Only', icon: '🎟️', viewMoreLink: '/events?section=exclusive_invite_only', order: 3 },
        { sectionKey: 'near_you', parentDivider: 'live_events', title: '📍 Near You', icon: '📍', viewMoreLink: '/events?section=near_you', order: 4 },
        // Watch Movie sections
        { sectionKey: 'trending_now', parentDivider: 'watch_movie', title: '🔥 Trending Now', icon: '🔥', viewMoreLink: '/watch-movies?section=trending_now', order: 1 },
        { sectionKey: 'most_popular', parentDivider: 'watch_movie', title: '🏆 Most Popular', icon: '🏆', viewMoreLink: '/watch-movies?section=most_popular', order: 2 },
        { sectionKey: 'exclusive_on_moviemart', parentDivider: 'watch_movie', title: '✨ Exclusive on Movie Mart', icon: '✨', viewMoreLink: '/watch-movies?section=exclusive_on_moviemart', order: 3 },
        { sectionKey: 'new_release', parentDivider: 'watch_movie', title: '🆕 New Release', icon: '🆕', viewMoreLink: '/watch-movies?section=new_release', order: 4 }
    ];
    // Insert dividers (upsert)
    for (const divider of defaultDividers) {
        yield section_settings_model_1.SectionDivider.findOneAndUpdate({ sectionKey: divider.sectionKey }, divider, { upsert: true, new: true });
    }
    // Insert titles (upsert)
    for (const title of defaultTitles) {
        yield section_settings_model_1.SectionTitle.findOneAndUpdate({ sectionKey: title.sectionKey }, title, { upsert: true, new: true });
    }
    const [dividers, titles] = yield Promise.all([
        section_settings_model_1.SectionDivider.find().sort({ order: 1 }),
        section_settings_model_1.SectionTitle.find().sort({ parentDivider: 1, order: 1 })
    ]);
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Default section settings seeded successfully',
        data: { dividers, titles }
    });
}));
exports.SectionSettingsController = {
    // Dividers
    getAllSectionDividers,
    getSectionDividerByKey,
    createSectionDivider,
    updateSectionDivider,
    deleteSectionDivider,
    updateDividersOrder,
    // Titles
    getAllSectionTitles,
    getSectionTitleByKey,
    createSectionTitle,
    updateSectionTitle,
    deleteSectionTitle,
    updateTitlesOrder,
    // Public & Utility
    getAllSectionSettings,
    seedDefaultSettings
};
