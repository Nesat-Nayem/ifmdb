import mongoose, { Document, Schema } from 'mongoose';

// Section Divider Interface - For major category dividers
export interface ISectionDivider extends Document {
  sectionKey: string; // e.g., 'trade_movies', 'live_events', 'watch_movie'
  title: string;
  subtitle: string;
  icon: string; // emoji or icon class
  isActive: boolean;
  order: number;
  style: {
    // Background styles
    backgroundType: 'solid' | 'gradient' | 'image';
    backgroundColor: string;
    gradientFrom: string;
    gradientVia: string;
    gradientTo: string;
    gradientDirection: 'to-r' | 'to-l' | 'to-t' | 'to-b' | 'to-tr' | 'to-tl' | 'to-br' | 'to-bl';
    backgroundImage: string;
    backgroundOpacity: number;
    
    // Text styles
    titleColor: string;
    titleGradientEnabled: boolean;
    titleGradientFrom: string;
    titleGradientVia: string;
    titleGradientTo: string;
    subtitleColor: string;
    
    // Font styles
    titleFontSize: string; // e.g., 'text-lg', 'text-2xl', 'text-3xl'
    titleFontWeight: string; // e.g., 'font-normal', 'font-bold', 'font-extrabold'
    subtitleFontSize: string;
    
    // Border styles
    borderColor: string;
    borderWidth: string;
    borderStyle: 'solid' | 'dashed' | 'dotted' | 'none';
    
    // Padding & Spacing
    paddingY: string;
    paddingX: string;
    
    // Animation
    animation: string; // e.g., 'none', 'pulse', 'bounce', 'fade-in'
  };
  createdAt: Date;
  updatedAt: Date;
}

// Section Title Interface - For individual content sections
export interface ISectionTitle extends Document {
  sectionKey: string; // e.g., 'hot_rights_available', 'trending_events'
  parentDivider: string; // links to section divider key
  title: string;
  icon: string;
  viewMoreLink: string;
  isActive: boolean;
  order: number;
  style: {
    // Text styles
    textColor: string;
    textGradientEnabled: boolean;
    gradientFrom: string;
    gradientVia: string;
    gradientTo: string;
    
    // Font styles
    fontSize: string;
    fontWeight: string;
    
    // Icon styles
    iconColor: string;
    iconSize: string;
    iconPosition: 'left' | 'right';
    
    // Background (for title container)
    backgroundColor: string;
    backgroundOpacity: number;
    
    // Border
    borderRadius: string;
    borderColor: string;
    borderWidth: string;
    
    // Spacing
    paddingY: string;
    paddingX: string;
    marginBottom: string;
    
    // Underline/Accent
    accentEnabled: boolean;
    accentColor: string;
    accentWidth: string;
    accentPosition: 'bottom' | 'left' | 'right';
    
    // Hover effects
    hoverEffect: 'none' | 'scale' | 'glow' | 'underline' | 'color-shift';
    hoverColor: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

// Section Divider Schema
const sectionDividerSchema: Schema = new Schema(
  {
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
  },
  { timestamps: true }
);

// Section Title Schema
const sectionTitleSchema: Schema = new Schema(
  {
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
  },
  { timestamps: true }
);

// Indexes
sectionDividerSchema.index({ sectionKey: 1 });
sectionDividerSchema.index({ order: 1 });
sectionDividerSchema.index({ isActive: 1 });

sectionTitleSchema.index({ sectionKey: 1 });
sectionTitleSchema.index({ parentDivider: 1 });
sectionTitleSchema.index({ order: 1 });
sectionTitleSchema.index({ isActive: 1 });

export const SectionDivider = mongoose.model<ISectionDivider>('SectionDivider', sectionDividerSchema);
export const SectionTitle = mongoose.model<ISectionTitle>('SectionTitle', sectionTitleSchema);
