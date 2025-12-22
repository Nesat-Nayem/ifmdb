"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.SectionTitle = exports.SectionDivider = void 0;
const mongoose_1 = __importStar(require("mongoose"));
// Section Divider Schema
const sectionDividerSchema = new mongoose_1.Schema({
    sectionKey: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    subtitle: {
        type: String,
        default: ''
    },
    icon: {
        type: String,
        default: ''
    },
    isActive: {
        type: Boolean,
        default: true
    },
    order: {
        type: Number,
        default: 0
    },
    style: {
        backgroundType: {
            type: String,
            enum: ['solid', 'gradient', 'image'],
            default: 'solid'
        },
        backgroundColor: {
            type: String,
            default: '#0a0a0a'
        },
        gradientFrom: {
            type: String,
            default: '#ef4444' // red-500
        },
        gradientVia: {
            type: String,
            default: '#f97316' // orange-500
        },
        gradientTo: {
            type: String,
            default: '#eab308' // yellow-500
        },
        gradientDirection: {
            type: String,
            enum: ['to-r', 'to-l', 'to-t', 'to-b', 'to-tr', 'to-tl', 'to-br', 'to-bl'],
            default: 'to-r'
        },
        backgroundImage: {
            type: String,
            default: ''
        },
        backgroundOpacity: {
            type: Number,
            default: 100,
            min: 0,
            max: 100
        },
        titleColor: {
            type: String,
            default: '#ffffff'
        },
        titleGradientEnabled: {
            type: Boolean,
            default: true
        },
        titleGradientFrom: {
            type: String,
            default: '#ef4444'
        },
        titleGradientVia: {
            type: String,
            default: '#f97316'
        },
        titleGradientTo: {
            type: String,
            default: '#eab308'
        },
        subtitleColor: {
            type: String,
            default: '#9ca3af' // gray-400
        },
        titleFontSize: {
            type: String,
            default: 'text-2xl'
        },
        titleFontWeight: {
            type: String,
            default: 'font-bold'
        },
        subtitleFontSize: {
            type: String,
            default: 'text-sm'
        },
        borderColor: {
            type: String,
            default: '#374151' // gray-700
        },
        borderWidth: {
            type: String,
            default: '1'
        },
        borderStyle: {
            type: String,
            enum: ['solid', 'dashed', 'dotted', 'none'],
            default: 'solid'
        },
        paddingY: {
            type: String,
            default: '8'
        },
        paddingX: {
            type: String,
            default: '4'
        },
        animation: {
            type: String,
            default: 'none'
        }
    }
}, { timestamps: true });
// Section Title Schema
const sectionTitleSchema = new mongoose_1.Schema({
    sectionKey: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    parentDivider: {
        type: String,
        required: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    icon: {
        type: String,
        default: ''
    },
    viewMoreLink: {
        type: String,
        default: ''
    },
    isActive: {
        type: Boolean,
        default: true
    },
    order: {
        type: Number,
        default: 0
    },
    style: {
        textColor: {
            type: String,
            default: '#ffffff'
        },
        textGradientEnabled: {
            type: Boolean,
            default: false
        },
        gradientFrom: {
            type: String,
            default: '#ef4444'
        },
        gradientVia: {
            type: String,
            default: '#f97316'
        },
        gradientTo: {
            type: String,
            default: '#eab308'
        },
        fontSize: {
            type: String,
            default: 'text-xl'
        },
        fontWeight: {
            type: String,
            default: 'font-bold'
        },
        iconColor: {
            type: String,
            default: '#ffffff'
        },
        iconSize: {
            type: String,
            default: 'text-xl'
        },
        iconPosition: {
            type: String,
            enum: ['left', 'right'],
            default: 'left'
        },
        backgroundColor: {
            type: String,
            default: 'transparent'
        },
        backgroundOpacity: {
            type: Number,
            default: 100
        },
        borderRadius: {
            type: String,
            default: '0'
        },
        borderColor: {
            type: String,
            default: 'transparent'
        },
        borderWidth: {
            type: String,
            default: '0'
        },
        paddingY: {
            type: String,
            default: '2'
        },
        paddingX: {
            type: String,
            default: '0'
        },
        marginBottom: {
            type: String,
            default: '4'
        },
        accentEnabled: {
            type: Boolean,
            default: false
        },
        accentColor: {
            type: String,
            default: '#ef4444'
        },
        accentWidth: {
            type: String,
            default: '2'
        },
        accentPosition: {
            type: String,
            enum: ['bottom', 'left', 'right'],
            default: 'bottom'
        },
        hoverEffect: {
            type: String,
            enum: ['none', 'scale', 'glow', 'underline', 'color-shift'],
            default: 'none'
        },
        hoverColor: {
            type: String,
            default: '#ef4444'
        }
    }
}, { timestamps: true });
// Indexes
sectionDividerSchema.index({ sectionKey: 1 });
sectionDividerSchema.index({ order: 1 });
sectionDividerSchema.index({ isActive: 1 });
sectionTitleSchema.index({ sectionKey: 1 });
sectionTitleSchema.index({ parentDivider: 1 });
sectionTitleSchema.index({ order: 1 });
sectionTitleSchema.index({ isActive: 1 });
exports.SectionDivider = mongoose_1.default.model('SectionDivider', sectionDividerSchema);
exports.SectionTitle = mongoose_1.default.model('SectionTitle', sectionTitleSchema);
