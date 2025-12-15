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
exports.CloudflareStreamController = void 0;
const http_status_1 = __importDefault(require("http-status"));
const catchAsync_1 = require("../../utils/catchAsync");
const sendResponse_1 = require("../../utils/sendResponse");
const axios_1 = __importDefault(require("axios"));
const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const CLOUDFLARE_STREAM_CUSTOMER_CODE = process.env.CLOUDFLARE_STREAM_CUSTOMER_CODE;
/**
 * Generate Direct Upload URL for basic uploads (under 200MB)
 */
const getDirectUploadUrl = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { maxDurationSeconds = 3600, meta = {} } = req.body;
    if (!CLOUDFLARE_ACCOUNT_ID || !CLOUDFLARE_API_TOKEN) {
        return (0, sendResponse_1.sendResponse)(res, {
            statusCode: http_status_1.default.INTERNAL_SERVER_ERROR,
            success: false,
            message: 'Cloudflare configuration missing',
            data: null,
        });
    }
    const response = yield axios_1.default.post(`https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/stream/direct_upload`, {
        maxDurationSeconds,
        meta,
        requireSignedURLs: false,
        allowedOrigins: ['*'],
    }, {
        headers: {
            'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
            'Content-Type': 'application/json',
        },
    });
    if (!response.data.success) {
        return (0, sendResponse_1.sendResponse)(res, {
            statusCode: http_status_1.default.BAD_REQUEST,
            success: false,
            message: 'Failed to generate upload URL',
            data: response.data.errors,
        });
    }
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Direct upload URL generated successfully',
        data: {
            uploadURL: response.data.result.uploadURL,
            uid: response.data.result.uid,
            customerCode: CLOUDFLARE_STREAM_CUSTOMER_CODE,
        },
    });
}));
/**
 * Generate TUS Upload URL for resumable uploads (large files)
 * This endpoint is called with JSON body from the frontend, then we request Cloudflare for a TUS URL
 */
const getTusUploadUrl = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f, _g;
    const { maxDurationSeconds = 21600, fileName = 'video' } = req.body; // Default 6 hours max
    if (!CLOUDFLARE_ACCOUNT_ID || !CLOUDFLARE_API_TOKEN) {
        return (0, sendResponse_1.sendResponse)(res, {
            statusCode: http_status_1.default.INTERNAL_SERVER_ERROR,
            success: false,
            message: 'Cloudflare configuration missing. Check CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN.',
            data: null,
        });
    }
    try {
        // Encode metadata in base64 as required by TUS protocol
        const maxDurationBase64 = Buffer.from(String(maxDurationSeconds)).toString('base64');
        const nameBase64 = Buffer.from(fileName).toString('base64');
        const uploadMetadata = `maxDurationSeconds ${maxDurationBase64},name ${nameBase64}`;
        console.log('Requesting TUS URL from Cloudflare...');
        console.log('Account ID:', CLOUDFLARE_ACCOUNT_ID);
        console.log('Upload Metadata:', uploadMetadata);
        const response = yield axios_1.default.post(`https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/stream?direct_user=true`, null, {
            headers: {
                'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
                'Tus-Resumable': '1.0.0',
                'Upload-Length': '1', // Placeholder, actual size sent by client
                'Upload-Metadata': uploadMetadata,
            },
            // Important: Don't throw on 2xx responses
            validateStatus: (status) => status < 500,
        });
        console.log('Cloudflare response status:', response.status);
        console.log('Cloudflare response headers:', response.headers);
        // Cloudflare returns the upload URL in the Location header
        const location = response.headers['location'] || response.headers['Location'];
        const streamMediaId = response.headers['stream-media-id'] || response.headers['Stream-Media-Id'];
        if (!location) {
            console.error('No location header in Cloudflare response:', response.data);
            return (0, sendResponse_1.sendResponse)(res, {
                statusCode: http_status_1.default.BAD_REQUEST,
                success: false,
                message: 'Failed to get upload URL from Cloudflare',
                data: response.data,
            });
        }
        // Extract UID from the location URL or use stream-media-id header
        const uid = streamMediaId || ((_a = location.split('/').pop()) === null || _a === void 0 ? void 0 : _a.split('?')[0]);
        console.log('TUS Upload URL:', location);
        console.log('Video UID:', uid);
        (0, sendResponse_1.sendResponse)(res, {
            statusCode: http_status_1.default.OK,
            success: true,
            message: 'TUS upload URL generated successfully',
            data: {
                uploadUrl: location,
                uid,
                customerCode: CLOUDFLARE_STREAM_CUSTOMER_CODE,
            },
        });
    }
    catch (error) {
        console.error('Cloudflare API Error:', ((_b = error.response) === null || _b === void 0 ? void 0 : _b.data) || error.message);
        return (0, sendResponse_1.sendResponse)(res, {
            statusCode: http_status_1.default.BAD_REQUEST,
            success: false,
            message: ((_f = (_e = (_d = (_c = error.response) === null || _c === void 0 ? void 0 : _c.data) === null || _d === void 0 ? void 0 : _d.errors) === null || _e === void 0 ? void 0 : _e[0]) === null || _f === void 0 ? void 0 : _f.message) || 'Failed to generate TUS upload URL',
            data: ((_g = error.response) === null || _g === void 0 ? void 0 : _g.data) || null,
        });
    }
}));
/**
 * Get video details from Cloudflare Stream
 */
const getVideoDetails = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const { videoId } = req.params;
    if (!CLOUDFLARE_ACCOUNT_ID || !CLOUDFLARE_API_TOKEN) {
        return (0, sendResponse_1.sendResponse)(res, {
            statusCode: http_status_1.default.INTERNAL_SERVER_ERROR,
            success: false,
            message: 'Cloudflare configuration missing',
            data: null,
        });
    }
    const response = yield axios_1.default.get(`https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/stream/${videoId}`, {
        headers: {
            'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
        },
    });
    if (!response.data.success) {
        return (0, sendResponse_1.sendResponse)(res, {
            statusCode: http_status_1.default.NOT_FOUND,
            success: false,
            message: 'Video not found',
            data: null,
        });
    }
    const video = response.data.result;
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Video details fetched successfully',
        data: {
            uid: video.uid,
            status: video.status,
            readyToStream: video.readyToStream,
            duration: video.duration,
            size: video.size,
            thumbnail: video.thumbnail,
            preview: video.preview,
            playback: {
                hls: (_a = video.playback) === null || _a === void 0 ? void 0 : _a.hls,
                dash: (_b = video.playback) === null || _b === void 0 ? void 0 : _b.dash,
            },
            input: video.input,
            meta: video.meta,
            created: video.created,
            modified: video.modified,
            customerCode: CLOUDFLARE_STREAM_CUSTOMER_CODE,
            embedUrl: `https://customer-${CLOUDFLARE_STREAM_CUSTOMER_CODE}.cloudflarestream.com/${video.uid}/iframe`,
            thumbnailUrl: `https://customer-${CLOUDFLARE_STREAM_CUSTOMER_CODE}.cloudflarestream.com/${video.uid}/thumbnails/thumbnail.jpg`,
        },
    });
}));
/**
 * Get video upload status (for polling during upload)
 */
const getVideoStatus = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    const { videoId } = req.params;
    if (!CLOUDFLARE_ACCOUNT_ID || !CLOUDFLARE_API_TOKEN) {
        return (0, sendResponse_1.sendResponse)(res, {
            statusCode: http_status_1.default.INTERNAL_SERVER_ERROR,
            success: false,
            message: 'Cloudflare configuration missing',
            data: null,
        });
    }
    const response = yield axios_1.default.get(`https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/stream/${videoId}`, {
        headers: {
            'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
        },
    });
    const video = response.data.result;
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Video status fetched',
        data: {
            uid: video.uid,
            status: ((_a = video.status) === null || _a === void 0 ? void 0 : _a.state) || 'processing',
            readyToStream: video.readyToStream,
            pctComplete: ((_b = video.status) === null || _b === void 0 ? void 0 : _b.pctComplete) || 0,
            errorReasonCode: (_c = video.status) === null || _c === void 0 ? void 0 : _c.errorReasonCode,
            errorReasonText: (_d = video.status) === null || _d === void 0 ? void 0 : _d.errorReasonText,
        },
    });
}));
/**
 * Delete video from Cloudflare Stream
 */
const deleteVideo = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { videoId } = req.params;
    if (!CLOUDFLARE_ACCOUNT_ID || !CLOUDFLARE_API_TOKEN) {
        return (0, sendResponse_1.sendResponse)(res, {
            statusCode: http_status_1.default.INTERNAL_SERVER_ERROR,
            success: false,
            message: 'Cloudflare configuration missing',
            data: null,
        });
    }
    yield axios_1.default.delete(`https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/stream/${videoId}`, {
        headers: {
            'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
        },
    });
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Video deleted successfully',
        data: null,
    });
}));
/**
 * List all videos from Cloudflare Stream
 */
const listVideos = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!CLOUDFLARE_ACCOUNT_ID || !CLOUDFLARE_API_TOKEN) {
        return (0, sendResponse_1.sendResponse)(res, {
            statusCode: http_status_1.default.INTERNAL_SERVER_ERROR,
            success: false,
            message: 'Cloudflare configuration missing',
            data: null,
        });
    }
    const response = yield axios_1.default.get(`https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/stream`, {
        headers: {
            'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
        },
    });
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Videos fetched successfully',
        data: response.data.result,
    });
}));
/**
 * Get Cloudflare Stream configuration for frontend
 */
const getConfig = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Cloudflare Stream config',
        data: {
            customerCode: CLOUDFLARE_STREAM_CUSTOMER_CODE,
            configured: !!(CLOUDFLARE_ACCOUNT_ID && CLOUDFLARE_API_TOKEN && CLOUDFLARE_STREAM_CUSTOMER_CODE),
        },
    });
}));
exports.CloudflareStreamController = {
    getDirectUploadUrl,
    getTusUploadUrl,
    getVideoDetails,
    getVideoStatus,
    deleteVideo,
    listVideos,
    getConfig,
};
