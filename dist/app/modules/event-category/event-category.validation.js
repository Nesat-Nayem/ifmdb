"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventCategoryValidation = void 0;
const zod_1 = require("zod");
// Create event category validation
const createEventCategoryValidation = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(1, 'Category name is required'),
        image: zod_1.z.string().optional(),
        isMusicShow: zod_1.z.boolean().optional().default(false),
        isComedyShow: zod_1.z.boolean().optional().default(false),
        isActive: zod_1.z.boolean().optional().default(true)
    })
});
// Update event category validation
const updateEventCategoryValidation = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(1, 'Category name is required').optional(),
        image: zod_1.z.string().optional(),
        isMusicShow: zod_1.z.boolean().optional(),
        isComedyShow: zod_1.z.boolean().optional(),
        isActive: zod_1.z.boolean().optional()
    })
});
// Get event categories query validation
const getEventCategoriesValidation = zod_1.z.object({
    query: zod_1.z.object({
        page: zod_1.z.string().optional(),
        limit: zod_1.z.string().optional(),
        search: zod_1.z.string().optional(),
        isMusicShow: zod_1.z.string().optional(),
        isComedyShow: zod_1.z.string().optional(),
        isActive: zod_1.z.string().optional(),
        sortBy: zod_1.z.enum(['name', 'createdAt', 'eventCount']).optional(),
        sortOrder: zod_1.z.enum(['asc', 'desc']).optional()
    })
});
exports.EventCategoryValidation = {
    createEventCategoryValidation,
    updateEventCategoryValidation,
    getEventCategoriesValidation
};
