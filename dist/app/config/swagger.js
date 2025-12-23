"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupSwagger = void 0;
const swagger_jsdoc_1 = __importDefault(require("swagger-jsdoc"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Moviemart',
            version: '1.0.0',
            // description: 'A comprehensive e-commerce API built with Express.js and TypeScript',
            contact: {
                name: 'Moviemart Team',
                email: 'support@moviemart.com',
            },
            license: {
                name: 'ISC',
            },
        },
        servers: [
            {
                url: 'https://api.moviemart.org',
                description: 'Development server',
            },
            {
                url: 'https://api.moviemart.org',
                description: 'Production server',
            }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
            schemas: {
                User: {
                    type: 'object',
                    properties: {
                        _id: {
                            type: 'string',
                            description: 'User ID',
                        },
                        name: {
                            type: 'string',
                            description: 'User full name',
                        },
                        email: {
                            type: 'string',
                            format: 'email',
                            description: 'User email address',
                        },
                        phone: {
                            type: 'string',
                            description: 'User phone number',
                        },
                        status: {
                            type: 'string',
                            enum: ['active', 'inactive', 'pending'],
                            description: 'User account status',
                        },
                        createdAt: {
                            type: 'string',
                            format: 'date-time',
                        },
                        updatedAt: {
                            type: 'string',
                            format: 'date-time',
                        },
                    },
                },
                SubscriptionPlan: {
                    type: 'object',
                    required: ['planName', 'planCost', 'planInclude'],
                    properties: {
                        _id: { type: 'string', description: 'Subscription plan ID', example: '66f2c0fd8b1a2c3456789012' },
                        planName: { type: 'string', example: 'Premium' },
                        planCost: { type: 'number', example: 29.99 },
                        planInclude: { type: 'array', items: { type: 'string' }, example: ['Ad-free', 'HD Streaming', 'Priority Support'] },
                        metaTitle: { type: 'string', example: 'Premium Plan - Best Value' },
                        metaTag: { type: 'array', items: { type: 'string' }, example: ['premium', 'subscription'] },
                        metaDescription: { type: 'string', example: 'Get access to premium features with our Premium plan.' },
                        isDeleted: { type: 'boolean', example: false },
                        createdAt: { type: 'string', description: 'IST formatted string in API output' },
                        updatedAt: { type: 'string', description: 'IST formatted string in API output' },
                    },
                },
                SubscriptionPlanCreate: {
                    type: 'object',
                    required: ['planName', 'planCost', 'planInclude'],
                    properties: {
                        planName: { type: 'string' },
                        planCost: { type: 'number' },
                        planInclude: { type: 'array', items: { type: 'string' } },
                        metaTitle: { type: 'string' },
                        metaTag: { type: 'array', items: { type: 'string' } },
                        metaDescription: { type: 'string' },
                    },
                },
                SubscriptionPlanUpdate: {
                    type: 'object',
                    properties: {
                        planName: { type: 'string' },
                        planCost: { type: 'number' },
                        planInclude: { type: 'array', items: { type: 'string' } },
                        metaTitle: { type: 'string' },
                        metaTag: { type: 'array', items: { type: 'string' } },
                        metaDescription: { type: 'string' },
                    },
                },
                PrivacyPolicy: {
                    type: 'object',
                    required: ['content'],
                    properties: {
                        _id: { type: 'string', description: 'Privacy policy ID' },
                        content: { type: 'string', description: 'HTML or markdown content', example: '<p>Privacy Policy content goes here.</p>' },
                        createdAt: { type: 'string', description: 'Creation timestamp (IST formatted string in API output)' },
                        updatedAt: { type: 'string', description: 'Update timestamp (IST formatted string in API output)' },
                    },
                },
                TermsCondition: {
                    type: 'object',
                    required: ['content'],
                    properties: {
                        _id: { type: 'string', description: 'Terms & Conditions ID' },
                        content: { type: 'string', description: 'HTML or markdown content', example: '<p> Terms and Conditions content goes here.</p>' },
                        createdAt: { type: 'string', description: 'Creation timestamp (IST formatted string in API output)' },
                        updatedAt: { type: 'string', description: 'Update timestamp (IST formatted string in API output)' },
                    },
                },
                HelpCenter: {
                    type: 'object',
                    required: ['content'],
                    properties: {
                        _id: { type: 'string', description: 'Help Center ID' },
                        content: { type: 'string', description: 'HTML or markdown content', example: '<p>Help Center content goes here.</p>' },
                        createdAt: { type: 'string', description: 'Creation timestamp (IST formatted string in API output)' },
                        updatedAt: { type: 'string', description: 'Update timestamp (IST formatted string in API output)' },
                    },
                },
                GeneralSettings: {
                    type: 'object',
                    properties: {
                        number: { type: 'string', example: '+971500000000' },
                        email: { type: 'string', example: 'info@moviemart.com' },
                        facebook: { type: 'string', example: 'https://facebook.com/moviemart' },
                        instagram: { type: 'string', example: 'https://instagram.com/moviemart' },
                        linkedin: { type: 'string', example: 'https://linkedin.com/company/moviemart' },
                        twitter: { type: 'string', example: 'https://twitter.com/moviemart' },
                        youtube: { type: 'string', example: 'https://youtube.com/@moviemart' },
                        favicon: { type: 'string', example: 'https://res.cloudinary.com/demo/image/upload/v1724300000/moviemart/assets/favicon.ico' },
                        logo: { type: 'string', example: 'https://res.cloudinary.com/demo/image/upload/v1724300000/moviemart/assets/logo.png' },
                        createdAt: { type: 'string' },
                        updatedAt: { type: 'string' },
                    },
                },
                GeneralSettingsUpdate: {
                    type: 'object',
                    properties: {
                        number: { type: 'string' },
                        email: { type: 'string' },
                        facebook: { type: 'string' },
                        instagram: { type: 'string' },
                        linkedin: { type: 'string' },
                        twitter: { type: 'string' },
                        youtube: { type: 'string' },
                        favicon: { type: 'string' },
                        logo: { type: 'string' },
                    },
                },
                Advertise: {
                    type: 'object',
                    required: ['image'],
                    properties: {
                        _id: {
                            type: 'string',
                            description: 'Advertisement ID',
                            example: '66d88b4ea31a5e0f9c7654321'
                        },
                        image: {
                            type: 'string',
                            description: 'Advertisement image URL',
                            example: 'https://res.cloudinary.com/demo/image/upload/v1724300000/moviemart/ads/ad-1.jpg'
                        },
                        link: {
                            type: 'string',
                            description: 'Optional URL to open when the ad is clicked',
                            example: 'https://example.com/promo'
                        },
                        status: {
                            type: 'string',
                            enum: ['active', 'inactive'],
                            description: 'Advertisement status',
                            example: 'active'
                        },
                        isDeleted: {
                            type: 'boolean',
                            description: 'Soft delete flag',
                            example: false
                        },
                        createdAt: {
                            type: 'string',
                            description: 'Creation timestamp (IST formatted string in API output)'
                        },
                        updatedAt: {
                            type: 'string',
                            description: 'Update timestamp (IST formatted string in API output)'
                        }
                    }
                },
                Category: {
                    type: 'object',
                    required: ['title', 'image'],
                    properties: {
                        _id: {
                            type: 'string',
                            description: 'Category ID',
                            example: '66d88b4ea31a5e0f9c123456'
                        },
                        title: {
                            type: 'string',
                            description: 'Category title',
                            example: 'Action'
                        },
                        image: {
                            type: 'string',
                            description: 'Category image URL',
                            example: 'https://res.cloudinary.com/demo/image/upload/v1724300000/moviemart/categories/action.jpg'
                        },
                        status: {
                            type: 'string',
                            enum: ['active', 'inactive'],
                            description: 'Category status (optional; not enforced in backend model)',
                            example: 'active'
                        },
                    },
                },
                Banner: {
                    type: 'object',
                    properties: {
                        _id: {
                            type: 'string',
                            description: 'Banner ID',
                            example: '66c8a2f9e9b1c5a7d1234567'
                        },
                        title: {
                            type: 'string',
                            description: 'Banner title',
                            example: 'Moviemart Summer Film Festival'
                        },
                        image: {
                            type: 'string',
                            description: 'Banner image URL',
                            example: 'https://res.cloudinary.com/demo/image/upload/v1724300000/moviemart/banners/summer-film-fest.jpg'
                        },
                        isActive: {
                            type: 'boolean',
                            description: 'Whether the banner is visible',
                            example: true
                        },
                        order: {
                            type: 'integer',
                            description: 'Display order (lower shows first)',
                            example: 1
                        },
                        isDeleted: {
                            type: 'boolean',
                            description: 'Soft delete flag',
                            example: false
                        },
                        createdAt: {
                            type: 'string',
                            description: 'Creation timestamp (IST formatted string in API output)',
                            example: '8/22/2025, 9:30:12 AM'
                        },
                        updatedAt: {
                            type: 'string',
                            description: 'Update timestamp (IST formatted string in API output)',
                            example: '8/22/2025, 9:35:44 AM'
                        },
                    },
                },
                Error: {
                    type: 'object',
                    properties: {
                        success: {
                            type: 'boolean',
                            example: false,
                        },
                        statusCode: {
                            type: 'integer',
                            example: 400,
                        },
                        message: {
                            type: 'string',
                            example: 'Error message',
                        },
                        errorSources: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    path: {
                                        type: 'string',
                                    },
                                    message: {
                                        type: 'string',
                                    },
                                },
                            },
                        },
                    },
                },
                Success: {
                    type: 'object',
                    properties: {
                        success: {
                            type: 'boolean',
                            example: true,
                        },
                        statusCode: {
                            type: 'integer',
                            example: 200,
                        },
                        message: {
                            type: 'string',
                            example: 'Operation successful',
                        },
                        data: {
                            type: 'object',
                            description: 'Response data',
                        },
                    },
                },
                Channel: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string', example: '67890abcdef1234567890123' },
                        name: { type: 'string', example: 'Moviemart Originals' },
                        description: { type: 'string', example: 'Official channel for Moviemart exclusive content and original series' },
                        logoUrl: { type: 'string', example: 'https://res.cloudinary.com/demo/image/upload/v1724300000/moviemart/channels/moviemart-logo.png' },
                        bannerUrl: { type: 'string', example: 'https://res.cloudinary.com/demo/image/upload/v1724300000/moviemart/channels/moviemart-banner.jpg' },
                        ownerId: { type: 'string', example: '507f1f77bcf86cd799439011' },
                        ownerType: { type: 'string', enum: ['admin', 'vendor'], example: 'admin' },
                        subscriberCount: { type: 'number', example: 125000 },
                        totalViews: { type: 'number', example: 5420000 },
                        isVerified: { type: 'boolean', example: true },
                        isActive: { type: 'boolean', example: true },
                        socialLinks: {
                            type: 'object',
                            properties: {
                                website: { type: 'string', example: 'https://moviemart.com' },
                                youtube: { type: 'string', example: 'https://youtube.com/@moviemart' },
                                instagram: { type: 'string', example: 'https://instagram.com/moviemart' },
                                twitter: { type: 'string', example: 'https://twitter.com/moviemart' },
                                facebook: { type: 'string', example: 'https://facebook.com/moviemart' }
                            }
                        },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' }
                    }
                },
                ChannelCreate: {
                    type: 'object',
                    required: ['name'],
                    properties: {
                        name: { type: 'string', example: 'Moviemart Originals' },
                        description: { type: 'string', example: 'Official channel for Moviemart exclusive content' },
                        logoUrl: { type: 'string', example: 'https://res.cloudinary.com/demo/image/upload/v1724300000/moviemart/channels/logo.png' },
                        bannerUrl: { type: 'string', example: 'https://res.cloudinary.com/demo/image/upload/v1724300000/moviemart/channels/banner.jpg' },
                        socialLinks: {
                            type: 'object',
                            properties: {
                                website: { type: 'string', example: 'https://moviemart.com' },
                                youtube: { type: 'string', example: 'https://youtube.com/@moviemart' },
                                instagram: { type: 'string', example: 'https://instagram.com/moviemart' },
                                twitter: { type: 'string', example: 'https://twitter.com/moviemart' },
                                facebook: { type: 'string', example: 'https://facebook.com/moviemart' }
                            }
                        }
                    }
                },
                ChannelUpdate: {
                    type: 'object',
                    properties: {
                        name: { type: 'string', example: 'Moviemart Originals Updated' },
                        description: { type: 'string', example: 'Updated description' },
                        logoUrl: { type: 'string' },
                        bannerUrl: { type: 'string' },
                        isVerified: { type: 'boolean', example: true },
                        isActive: { type: 'boolean', example: true },
                        socialLinks: { type: 'object' }
                    }
                },
                WatchVideoCategory: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string', example: '67890abcdef1234567890456' },
                        name: { type: 'string', example: 'Action & Adventure' },
                        description: { type: 'string', example: 'High-octane action movies and thrilling adventures' },
                        imageUrl: { type: 'string', example: 'https://res.cloudinary.com/demo/image/upload/v1724300000/moviemart/categories/action.jpg' },
                        iconUrl: { type: 'string', example: 'https://res.cloudinary.com/demo/image/upload/v1724300000/moviemart/icons/action.svg' },
                        parentId: { type: 'string', nullable: true, example: null },
                        order: { type: 'number', example: 1 },
                        isActive: { type: 'boolean', example: true },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' }
                    }
                },
                WatchVideoCategoryCreate: {
                    type: 'object',
                    required: ['name'],
                    properties: {
                        name: { type: 'string', example: 'Action & Adventure' },
                        description: { type: 'string', example: 'High-octane action movies and thrilling adventures' },
                        imageUrl: { type: 'string', example: 'https://res.cloudinary.com/demo/image/upload/v1724300000/moviemart/categories/action.jpg' },
                        iconUrl: { type: 'string', example: 'https://res.cloudinary.com/demo/image/upload/v1724300000/moviemart/icons/action.svg' },
                        parentId: { type: 'string', nullable: true },
                        order: { type: 'number', example: 1 }
                    }
                },
                WatchVideo: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string', example: '67890abcdef1234567890789' },
                        title: { type: 'string', example: 'The Dark Knight' },
                        description: { type: 'string', example: 'When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice.' },
                        channelId: { type: 'string', example: '67890abcdef1234567890123' },
                        videoType: { type: 'string', enum: ['single', 'series'], example: 'single' },
                        category: { type: 'string', example: 'Action & Adventure' },
                        categoryId: { type: 'string', example: '67890abcdef1234567890456' },
                        genres: { type: 'array', items: { type: 'string' }, example: ['Action', 'Crime', 'Drama', 'Thriller'] },
                        languages: { type: 'array', items: { type: 'string' }, example: ['English', 'Hindi', 'Tamil'] },
                        tags: { type: 'array', items: { type: 'string' }, example: ['superhero', 'batman', 'dc', 'crime-thriller'] },
                        videoUrl: { type: 'string', example: 'https://stream.moviemart.com/videos/dark-knight-1080p.m3u8' },
                        trailerUrl: { type: 'string', example: 'https://stream.moviemart.com/trailers/dark-knight-trailer.mp4' },
                        thumbnailUrl: { type: 'string', example: 'https://res.cloudinary.com/demo/image/upload/v1724300000/moviemart/thumbnails/dark-knight.jpg' },
                        posterUrl: { type: 'string', example: 'https://res.cloudinary.com/demo/image/upload/v1724300000/moviemart/posters/dark-knight.jpg' },
                        backdropUrl: { type: 'string', example: 'https://res.cloudinary.com/demo/image/upload/v1724300000/moviemart/backdrops/dark-knight.jpg' },
                        galleryImages: { type: 'array', items: { type: 'string' }, example: ['https://res.cloudinary.com/demo/image/upload/v1724300000/moviemart/gallery/dk-1.jpg', 'https://res.cloudinary.com/demo/image/upload/v1724300000/moviemart/gallery/dk-2.jpg'] },
                        duration: { type: 'number', example: 9120, description: 'Duration in seconds (152 minutes)' },
                        releaseDate: { type: 'string', format: 'date-time', example: '2008-07-18T00:00:00.000Z' },
                        isFree: { type: 'boolean', example: false },
                        defaultPrice: { type: 'number', example: 299 },
                        countryPricing: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    countryCode: { type: 'string', example: 'US' },
                                    countryName: { type: 'string', example: 'United States' },
                                    currency: { type: 'string', example: 'USD' },
                                    price: { type: 'number', example: 3.99 },
                                    isActive: { type: 'boolean', example: true }
                                }
                            }
                        },
                        averageRating: { type: 'number', example: 9.0 },
                        totalRatings: { type: 'number', example: 15420 },
                        viewCount: { type: 'number', example: 2540000 },
                        likeCount: { type: 'number', example: 98500 },
                        ageRating: { type: 'string', enum: ['U', 'UA', 'A', 'S', 'G', 'PG', 'PG-13', 'R', 'NC-17'], example: 'PG-13' },
                        certification: { type: 'string', example: 'CBFC: UA' },
                        director: { type: 'string', example: 'Christopher Nolan' },
                        producer: { type: 'string', example: 'Emma Thomas, Charles Roven' },
                        cast: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    name: { type: 'string', example: 'Christian Bale' },
                                    role: { type: 'string', example: 'Bruce Wayne / Batman' },
                                    image: { type: 'string', example: 'https://res.cloudinary.com/demo/image/upload/v1724300000/moviemart/cast/christian-bale.jpg' }
                                }
                            }
                        },
                        crew: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    name: { type: 'string', example: 'Wally Pfister' },
                                    designation: { type: 'string', example: 'Director of Photography' },
                                    image: { type: 'string', example: 'https://res.cloudinary.com/demo/image/upload/v1724300000/moviemart/crew/wally-pfister.jpg' }
                                }
                            }
                        },
                        status: { type: 'string', enum: ['draft', 'published', 'archived'], example: 'published' },
                        isActive: { type: 'boolean', example: true },
                        isFeatured: { type: 'boolean', example: true },
                        uploadedBy: { type: 'string', example: '507f1f77bcf86cd799439011' },
                        uploadedByType: { type: 'string', enum: ['admin', 'vendor'], example: 'admin' },
                        homeSection: { type: 'string', enum: ['', 'trending_now', 'most_popular', 'exclusive_on_moviemart', 'new_release'], example: 'trending_now' },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' }
                    }
                },
                WatchVideoCreate: {
                    type: 'object',
                    required: ['title', 'description', 'channelId', 'videoType', 'category', 'thumbnailUrl', 'posterUrl', 'duration', 'releaseDate', 'uploadedBy', 'uploadedByType'],
                    properties: {
                        title: { type: 'string', example: 'The Dark Knight' },
                        description: { type: 'string', example: 'When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests.' },
                        channelId: { type: 'string', example: '67890abcdef1234567890123' },
                        videoType: { type: 'string', enum: ['single', 'series'], example: 'single' },
                        category: { type: 'string', example: 'Action & Adventure' },
                        categoryId: { type: 'string', example: '67890abcdef1234567890456' },
                        genres: { type: 'array', items: { type: 'string' }, example: ['Action', 'Crime', 'Drama'] },
                        languages: { type: 'array', items: { type: 'string' }, example: ['English', 'Hindi'] },
                        tags: { type: 'array', items: { type: 'string' }, example: ['superhero', 'batman'] },
                        videoUrl: { type: 'string', example: 'https://stream.moviemart.com/videos/dark-knight-1080p.m3u8' },
                        trailerUrl: { type: 'string', example: 'https://stream.moviemart.com/trailers/dark-knight-trailer.mp4' },
                        thumbnailUrl: { type: 'string', example: 'https://res.cloudinary.com/demo/image/upload/v1724300000/moviemart/thumbnails/dark-knight.jpg' },
                        posterUrl: { type: 'string', example: 'https://res.cloudinary.com/demo/image/upload/v1724300000/moviemart/posters/dark-knight.jpg' },
                        backdropUrl: { type: 'string', example: 'https://res.cloudinary.com/demo/image/upload/v1724300000/moviemart/backdrops/dark-knight.jpg' },
                        galleryImages: { type: 'array', items: { type: 'string' } },
                        duration: { type: 'number', example: 9120 },
                        releaseDate: { type: 'string', format: 'date-time', example: '2008-07-18T00:00:00.000Z' },
                        isFree: { type: 'boolean', example: false },
                        defaultPrice: { type: 'number', example: 299 },
                        countryPricing: { type: 'array', items: { type: 'object' } },
                        ageRating: { type: 'string', enum: ['U', 'UA', 'A', 'S', 'G', 'PG', 'PG-13', 'R', 'NC-17'], example: 'PG-13' },
                        certification: { type: 'string', example: 'CBFC: UA' },
                        director: { type: 'string', example: 'Christopher Nolan' },
                        producer: { type: 'string', example: 'Emma Thomas' },
                        cast: { type: 'array', items: { type: 'object' } },
                        crew: { type: 'array', items: { type: 'object' } },
                        status: { type: 'string', enum: ['draft', 'published', 'archived'], example: 'draft' },
                        isFeatured: { type: 'boolean', example: false },
                        uploadedBy: { type: 'string', example: '507f1f77bcf86cd799439011' },
                        uploadedByType: { type: 'string', enum: ['admin', 'vendor'], example: 'admin' }
                    }
                },
                Season: {
                    type: 'object',
                    properties: {
                        seasonNumber: { type: 'number', example: 1 },
                        title: { type: 'string', example: 'Season 1' },
                        description: { type: 'string', example: 'The first season of the epic series' },
                        episodes: { type: 'array', items: { $ref: '#/components/schemas/Episode' } },
                        releaseDate: { type: 'string', format: 'date-time' },
                        isActive: { type: 'boolean', example: true }
                    }
                },
                Episode: {
                    type: 'object',
                    properties: {
                        episodeNumber: { type: 'number', example: 1 },
                        title: { type: 'string', example: 'Pilot' },
                        description: { type: 'string', example: 'The beginning of an epic journey' },
                        videoUrl: { type: 'string', example: 'https://stream.moviemart.com/series/s1e1.m3u8' },
                        thumbnailUrl: { type: 'string', example: 'https://res.cloudinary.com/demo/image/upload/v1724300000/moviemart/episodes/s1e1.jpg' },
                        duration: { type: 'number', example: 3600 },
                        releaseDate: { type: 'string', format: 'date-time' },
                        isActive: { type: 'boolean', example: true },
                        viewCount: { type: 'number', example: 125000 }
                    }
                },
                VideoReview: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string', example: '67890abcdef1234567890999' },
                        videoId: { type: 'string', example: '67890abcdef1234567890789' },
                        userId: { type: 'string', example: '507f1f77bcf86cd799439011' },
                        rating: { type: 'number', minimum: 1, maximum: 10, example: 9 },
                        reviewText: { type: 'string', example: 'An absolute masterpiece! Christopher Nolan delivers a gripping and intense superhero film.' },
                        isVerified: { type: 'boolean', example: true },
                        helpfulCount: { type: 'number', example: 245 },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' }
                    }
                },
                VideoReviewCreate: {
                    type: 'object',
                    required: ['userId', 'rating'],
                    properties: {
                        userId: { type: 'string', example: '507f1f77bcf86cd799439011' },
                        rating: { type: 'number', minimum: 1, maximum: 10, example: 9 },
                        reviewText: { type: 'string', example: 'An absolute masterpiece! Highly recommended.' }
                    }
                },
                WatchProgress: {
                    type: 'object',
                    required: ['userId', 'watchedDuration', 'totalDuration'],
                    properties: {
                        userId: { type: 'string', example: '507f1f77bcf86cd799439011' },
                        watchedDuration: { type: 'number', example: 4560, description: 'Watched duration in seconds' },
                        totalDuration: { type: 'number', example: 9120, description: 'Total duration in seconds' },
                        episodeId: { type: 'string', nullable: true },
                        seasonNumber: { type: 'number', nullable: true },
                        episodeNumber: { type: 'number', nullable: true }
                    }
                },
                VideoPurchase: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string', example: '67890abcdef1234567891111' },
                        userId: { type: 'string', example: '507f1f77bcf86cd799439011' },
                        videoId: { type: 'string', example: '67890abcdef1234567890789' },
                        purchaseType: { type: 'string', enum: ['rent', 'buy'], example: 'buy' },
                        amount: { type: 'number', example: 299 },
                        currency: { type: 'string', example: 'INR' },
                        countryCode: { type: 'string', example: 'IN' },
                        paymentStatus: { type: 'string', enum: ['pending', 'completed', 'failed', 'refunded'], example: 'completed' },
                        paymentMethod: { type: 'string', example: 'cashfree' },
                        transactionId: { type: 'string', example: 'TXN_20231218_123456' },
                        purchaseReference: { type: 'string', example: 'PURCHASE_20231218_123456' },
                        expiresAt: { type: 'string', format: 'date-time', nullable: true },
                        customerDetails: {
                            type: 'object',
                            properties: {
                                name: { type: 'string', example: 'John Doe' },
                                email: { type: 'string', example: 'john.doe@example.com' },
                                phone: { type: 'string', example: '+919876543210' }
                            }
                        },
                        purchasedAt: { type: 'string', format: 'date-time' },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' }
                    }
                },
                PaymentOrderCreate: {
                    type: 'object',
                    required: ['userId', 'customerDetails'],
                    properties: {
                        userId: { type: 'string', example: '507f1f77bcf86cd799439011' },
                        purchaseType: { type: 'string', enum: ['rent', 'buy'], example: 'buy' },
                        countryCode: { type: 'string', example: 'IN' },
                        customerDetails: {
                            type: 'object',
                            required: ['name', 'email', 'phone'],
                            properties: {
                                name: { type: 'string', example: 'John Doe' },
                                email: { type: 'string', example: 'john.doe@example.com' },
                                phone: { type: 'string', example: '+919876543210' }
                            }
                        },
                        returnUrl: { type: 'string', example: 'https://moviemart.com/payment/success' }
                    }
                },
                PaymentOrderResponse: {
                    type: 'object',
                    properties: {
                        orderId: { type: 'string', example: 'ORDER_20231218_123456' },
                        paymentSessionId: { type: 'string', example: 'session_abc123xyz' },
                        amount: { type: 'number', example: 299 },
                        currency: { type: 'string', example: 'INR' },
                        paymentUrl: { type: 'string', example: 'https://payments.cashfree.com/order/session_abc123xyz' }
                    }
                },
                SubscriptionStatus: {
                    type: 'object',
                    properties: {
                        isSubscribed: { type: 'boolean', example: true },
                        isNotificationEnabled: { type: 'boolean', example: true },
                        subscribedAt: { type: 'string', format: 'date-time' }
                    }
                }
            },
        },
        security: [
            {
                bearerAuth: [],
            },
        ],
    },
    apis: [
        './src/app/modules/*/*.routes.ts',
        './src/app/modules/*/*.controller.ts',
        './src/app/routes/index.ts',
    ],
};
const specs = (0, swagger_jsdoc_1.default)(options);
const setupSwagger = (app) => {
    // ElysiaJS-inspired modern Swagger UI with enhanced styling
    const customCss = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
    
    /* Reset and base styles */
    .swagger-ui * {
      box-sizing: border-box;
    }
    
    /* Hide default topbar */
    .swagger-ui .topbar { display: none; }
    
    /* Main container - clean white background like ElysiaJS */
    .swagger-ui {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #ffffff;
      color: #1a1a1a;
      line-height: 1.6;
    }
    
    /* Info section - minimal and clean */
    .swagger-ui .info {
      background: transparent;
      padding: 3rem 0 2rem 0;
      margin: 0;
      border: none;
      box-shadow: none;
    }
    
    .swagger-ui .info .title {
      color: #1a1a1a;
      font-size: 2.25rem;
      font-weight: 700;
      margin-bottom: 0.5rem;
      letter-spacing: -0.025em;
    }
    
    .swagger-ui .info .description {
      color: #6b7280;
      font-size: 1rem;
      font-weight: 400;
      margin-bottom: 2rem;
    }
    
    /* Wrapper for better spacing */
    .swagger-ui .wrapper {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 2rem;
    }
    
    /* Operation blocks - clean and minimal */
    .swagger-ui .opblock {
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      margin: 0 0 1rem 0;
      box-shadow: none;
      overflow: hidden;
    }
    
    .swagger-ui .opblock:hover {
      border-color: #d1d5db;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }
    
    /* Method colors - subtle and modern */
    .swagger-ui .opblock.opblock-get {
      border-left: 3px solid #10b981;
    }
    
    .swagger-ui .opblock.opblock-post {
      border-left: 3px solid #3b82f6;
    }
    
    .swagger-ui .opblock.opblock-put {
      border-left: 3px solid #f59e0b;
    }
    
    .swagger-ui .opblock.opblock-patch {
      border-left: 3px solid #8b5cf6;
    }
    
    .swagger-ui .opblock.opblock-delete {
      border-left: 3px solid #ef4444;
    }
    
    /* Operation summary */
    .swagger-ui .opblock-summary {
      padding: 1rem 1.5rem;
      background: transparent;
      border: none;
      cursor: pointer;
    }
    
    .swagger-ui .opblock-summary:hover {
      background: #f9fafb;
    }
    
    /* Method badges */
    .swagger-ui .opblock-summary-method {
      border-radius: 4px;
      padding: 0.25rem 0.75rem;
      font-weight: 600;
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      min-width: 60px;
      text-align: center;
    }
    
    .swagger-ui .opblock.opblock-get .opblock-summary-method {
      background: #10b981;
      color: white;
    }
    
    .swagger-ui .opblock.opblock-post .opblock-summary-method {
      background: #3b82f6;
      color: white;
    }
    
    .swagger-ui .opblock.opblock-put .opblock-summary-method {
      background: #f59e0b;
      color: white;
    }
    
    .swagger-ui .opblock.opblock-patch .opblock-summary-method {
      background: #8b5cf6;
      color: white;
    }
    
    .swagger-ui .opblock.opblock-delete .opblock-summary-method {
      background: #ef4444;
      color: white;
    }
    
    /* Path styling */
    .swagger-ui .opblock-summary-path {
      font-family: 'JetBrains Mono', 'Fira Code', monospace;
      font-weight: 500;
      color: #374151;
      font-size: 0.875rem;
      margin-left: 1rem;
    }
    
    .swagger-ui .opblock-summary-description {
      color: #6b7280;
      font-size: 0.875rem;
      margin-left: auto;
    }
    
    /* Expanded content */
    .swagger-ui .opblock-description-wrapper {
      background: #f9fafb;
      border-top: 1px solid #e5e7eb;
      padding: 1.5rem;
    }
    
    /* Tags - clean section headers */
    .swagger-ui .opblock-tag {
      background: transparent;
      border: none;
      margin: 2rem 0 1rem 0;
      box-shadow: none;
    }
    
    .swagger-ui .opblock-tag-section h3 {
      background: transparent;
      color: #1a1a1a;
      padding: 0;
      margin: 0 0 1rem 0;
      font-size: 1.5rem;
      font-weight: 600;
      border-bottom: 2px solid #e5e7eb;
      padding-bottom: 0.5rem;
    }
    
    /* Buttons - clean and modern */
    .swagger-ui .btn {
      border-radius: 6px;
      font-weight: 500;
      padding: 0.5rem 1rem;
      font-size: 0.875rem;
      border: 1px solid transparent;
      transition: all 0.15s ease;
    }
    
    .swagger-ui .btn.authorize {
      background: #3b82f6;
      color: white;
      border-color: #3b82f6;
    }
    
    .swagger-ui .btn.authorize:hover {
      background: #2563eb;
      border-color: #2563eb;
    }
    
    .swagger-ui .btn.execute {
      background: #10b981;
      color: white;
      border-color: #10b981;
    }
    
    .swagger-ui .btn.execute:hover {
      background: #059669;
      border-color: #059669;
    }
    
    .swagger-ui .btn.try-out__btn {
      background: transparent;
      color: #3b82f6;
      border-color: #3b82f6;
    }
    
    .swagger-ui .btn.try-out__btn:hover {
      background: #3b82f6;
      color: white;
    }
    
    /* Parameters table */
    .swagger-ui table {
      border-collapse: collapse;
      width: 100%;
    }
    
    .swagger-ui table thead tr td,
    .swagger-ui table thead tr th {
      background: #f9fafb;
      color: #374151;
      font-weight: 600;
      font-size: 0.875rem;
      padding: 0.75rem;
      border-bottom: 1px solid #e5e7eb;
    }
    
    .swagger-ui table tbody tr td {
      padding: 0.75rem;
      border-bottom: 1px solid #f3f4f6;
      font-size: 0.875rem;
    }
    
    /* Response section */
    .swagger-ui .responses-wrapper {
      background: transparent;
      border: none;
      padding: 0;
      margin-top: 1.5rem;
    }
    
    .swagger-ui .response-col_status {
      font-family: 'JetBrains Mono', monospace;
      font-weight: 500;
    }
    
    /* Code blocks */
    .swagger-ui .highlight-code {
      background: #1f2937;
      color: #f9fafb;
      border-radius: 6px;
      padding: 1rem;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.875rem;
    }
    
    /* Input fields */
    .swagger-ui input[type=text],
    .swagger-ui input[type=password],
    .swagger-ui input[type=email],
    .swagger-ui textarea {
      border: 1px solid #d1d5db;
      border-radius: 6px;
      padding: 0.5rem 0.75rem;
      font-size: 0.875rem;
      background: white;
      color: #374151;
    }
    
    .swagger-ui input[type=text]:focus,
    .swagger-ui input[type=password]:focus,
    .swagger-ui input[type=email]:focus,
    .swagger-ui textarea:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }
    
    /* Models section */
    .swagger-ui .model-box {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      padding: 1rem;
    }
    
    .swagger-ui .model-title {
      color: #374151;
      font-weight: 600;
    }
    
    /* Authorization modal */
    .swagger-ui .modal-ux {
      background: white;
      border-radius: 8px;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
      border: 1px solid #e5e7eb;
    }
    
    .swagger-ui .modal-ux-header {
      background: #f9fafb;
      border-bottom: 1px solid #e5e7eb;
      padding: 1rem 1.5rem;
    }
    
    .swagger-ui .modal-ux-content {
      padding: 1.5rem;
    }
    
    /* Scrollbar */
    .swagger-ui ::-webkit-scrollbar {
      width: 8px;
      height: 8px;
    }
    
    .swagger-ui ::-webkit-scrollbar-track {
      background: #f3f4f6;
    }
    
    .swagger-ui ::-webkit-scrollbar-thumb {
      background: #d1d5db;
      border-radius: 4px;
    }
    
    .swagger-ui ::-webkit-scrollbar-thumb:hover {
      background: #9ca3af;
    }
    
    /* Show and style the authorization (security schemes) section */
    .swagger-ui .scheme-container {
      display: block !important;
      margin: 1rem 0 !important;
      padding: 1rem !important;
      background: #f8fafc !important;
      border: 1px solid #e5e7eb !important;
      border-radius: 8px !important;
    }
    .swagger-ui .auth-wrapper {
      display: flex !important;
      align-items: center !important;
      gap: 1rem !important;
    }
    
    /* Custom header styling */
    .swagger-ui .info hgroup.main {
      margin: 0;
    }
    
    .swagger-ui .info hgroup.main a {
      color: #3b82f6;
      text-decoration: none;
    }
    
    .swagger-ui .info hgroup.main a:hover {
      text-decoration: underline;
    }
  `;
    app.use('/api-docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(specs, {
        explorer: true,
        customCss,
        customSiteTitle: '🚀 Moviemart API Documentation',
        customfavIcon: 'https://cdn-icons-png.flaticon.com/512/2721/2721297.png',
        swaggerOptions: {
            persistAuthorization: true,
            displayRequestDuration: true,
            filter: true,
            tryItOutEnabled: true,
            docExpansion: 'none',
            defaultModelsExpandDepth: 2,
            defaultModelExpandDepth: 2,
            displayOperationId: false,
            showExtensions: true,
            showCommonExtensions: true,
        },
    }));
    // JSON endpoint for the swagger spec
    app.get('/api-docs.json', (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.send(specs);
    });
    console.log('📚 Swagger documentation available at: https://api.moviemart.org/api-docs');
};
exports.setupSwagger = setupSwagger;
exports.default = specs;
