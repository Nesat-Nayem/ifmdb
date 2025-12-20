import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { catchAsync } from '../../utils/catchAsync';
import { sendResponse } from '../../utils/sendResponse';
import axios from 'axios';

const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const CLOUDFLARE_STREAM_CUSTOMER_CODE = process.env.CLOUDFLARE_STREAM_CUSTOMER_CODE;

const getMaxAllowedBytes = (uploadType?: string, videoType?: string) => {
  if (uploadType === 'trailer') return 100 * 1024 * 1024;
  if (videoType === 'series') return 500 * 1024 * 1024;
  return 2 * 1024 * 1024 * 1024;
};

/**
 * Generate Direct Upload URL for basic uploads (under 200MB)
 */
const getDirectUploadUrl = catchAsync(async (req: Request, res: Response) => {
  const {
    maxDurationSeconds = 3600,
    meta = {},
    fileName,
    fileSize,
    uploadType,
    videoType,
  } = req.body;

  if (!CLOUDFLARE_ACCOUNT_ID || !CLOUDFLARE_API_TOKEN) {
    return sendResponse(res, {
      statusCode: httpStatus.INTERNAL_SERVER_ERROR,
      success: false,
      message: 'Cloudflare configuration missing',
      data: null,
    });
  }

  if (typeof fileSize !== 'number' || fileSize <= 0) {
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: 'fileSize is required',
      data: null,
    });
  }

  const maxAllowedBytes = getMaxAllowedBytes(uploadType, videoType);
  if (fileSize > maxAllowedBytes) {
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: 'File too large for this upload type',
      data: {
        fileSize,
        maxAllowedBytes,
        uploadType,
        videoType,
      },
    });
  }

  const response = await axios.post(
    `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/stream/direct_upload`,
    {
      maxDurationSeconds,
      meta: {
        ...meta,
        ...(fileName ? { name: fileName } : {}),
        ...(uploadType ? { uploadType } : {}),
        ...(videoType ? { videoType } : {}),
      },
      requireSignedURLs: false,
      allowedOrigins: ['*'],
    },
    {
      headers: {
        'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.data.success) {
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: 'Failed to generate upload URL',
      data: response.data.errors,
    });
  }

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Direct upload URL generated successfully',
    data: {
      uploadURL: response.data.result.uploadURL,
      uid: response.data.result.uid,
      customerCode: CLOUDFLARE_STREAM_CUSTOMER_CODE,
    },
  });
});

/**
 * Generate TUS Upload URL for resumable uploads (large files)
 * This endpoint is called with JSON body from the frontend, then we request Cloudflare for a TUS URL
 */
const getTusUploadUrl = catchAsync(async (req: Request, res: Response) => {
  const {
    maxDurationSeconds = 21600,
    fileName = 'video',
    fileSize,
    uploadType,
    videoType,
  } = req.body; // Default 6 hours max

  if (!CLOUDFLARE_ACCOUNT_ID || !CLOUDFLARE_API_TOKEN) {
    return sendResponse(res, {
      statusCode: httpStatus.INTERNAL_SERVER_ERROR,
      success: false,
      message: 'Cloudflare configuration missing. Check CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN.',
      data: null,
    });
  }

  if (typeof fileSize !== 'number' || fileSize <= 0) {
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: 'fileSize is required for TUS uploads',
      data: null,
    });
  }

  const maxAllowedBytes = getMaxAllowedBytes(uploadType, videoType);
  if (fileSize > maxAllowedBytes) {
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: 'File too large for this upload type',
      data: {
        fileSize,
        maxAllowedBytes,
        uploadType,
        videoType,
      },
    });
  }

  try {
    // Encode metadata in base64 as required by TUS protocol
    const maxDurationBase64 = Buffer.from(String(maxDurationSeconds)).toString('base64');
    const nameBase64 = Buffer.from(fileName).toString('base64');
    const uploadTypeBase64 = uploadType ? Buffer.from(String(uploadType)).toString('base64') : undefined;
    const videoTypeBase64 = videoType ? Buffer.from(String(videoType)).toString('base64') : undefined;
    const uploadMetadataParts = [`maxDurationSeconds ${maxDurationBase64}`, `name ${nameBase64}`];
    if (uploadTypeBase64) uploadMetadataParts.push(`uploadType ${uploadTypeBase64}`);
    if (videoTypeBase64) uploadMetadataParts.push(`videoType ${videoTypeBase64}`);
    const uploadMetadata = uploadMetadataParts.join(',');

    console.log('Requesting TUS URL from Cloudflare...');
    console.log('Account ID:', CLOUDFLARE_ACCOUNT_ID);
    console.log('Upload Metadata:', uploadMetadata);

    const response = await axios.post(
      `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/stream?direct_user=true`,
      null,
      {
        headers: {
          'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
          'Tus-Resumable': '1.0.0',
          'Upload-Length': String(fileSize),
          'Upload-Metadata': uploadMetadata,
        },
        // Important: Don't throw on 2xx responses
        validateStatus: (status) => status < 500,
      }
    );

    if (response.status < 200 || response.status >= 300) {
      return sendResponse(res, {
        statusCode: httpStatus.BAD_REQUEST,
        success: false,
        message: 'Failed to generate TUS upload URL from Cloudflare',
        data: response.data,
      });
    }

    console.log('Cloudflare response status:', response.status);
    console.log('Cloudflare response headers:', response.headers);

    // Cloudflare returns the upload URL in the Location header
    const location = response.headers['location'] || response.headers['Location'];
    const streamMediaId = response.headers['stream-media-id'] || response.headers['Stream-Media-Id'];

    if (!location) {
      console.error('No location header in Cloudflare response:', response.data);
      return sendResponse(res, {
        statusCode: httpStatus.BAD_REQUEST,
        success: false,
        message: 'Failed to get upload URL from Cloudflare',
        data: response.data,
      });
    }

    // Extract UID from the location URL or use stream-media-id header
    const uid = streamMediaId || location.split('/').pop()?.split('?')[0];

    console.log('TUS Upload URL:', location);
    console.log('Video UID:', uid);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'TUS upload URL generated successfully',
      data: {
        uploadUrl: location,
        uid,
        customerCode: CLOUDFLARE_STREAM_CUSTOMER_CODE,
      },
    });
  } catch (error: any) {
    console.error('Cloudflare API Error:', error.response?.data || error.message);
    
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: error.response?.data?.errors?.[0]?.message || 'Failed to generate TUS upload URL',
      data: error.response?.data || null,
    });
  }
});

/**
 * Get video details from Cloudflare Stream
 */
const getVideoDetails = catchAsync(async (req: Request, res: Response) => {
  const { videoId } = req.params;

  if (!CLOUDFLARE_ACCOUNT_ID || !CLOUDFLARE_API_TOKEN) {
    return sendResponse(res, {
      statusCode: httpStatus.INTERNAL_SERVER_ERROR,
      success: false,
      message: 'Cloudflare configuration missing',
      data: null,
    });
  }

  const response = await axios.get(
    `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/stream/${videoId}`,
    {
      headers: {
        'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
      },
    }
  );

  if (!response.data.success) {
    return sendResponse(res, {
      statusCode: httpStatus.NOT_FOUND,
      success: false,
      message: 'Video not found',
      data: null,
    });
  }

  const video = response.data.result;

  sendResponse(res, {
    statusCode: httpStatus.OK,
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
        hls: video.playback?.hls,
        dash: video.playback?.dash,
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
});

/**
 * Get video upload status (for polling during upload)
 */
const getVideoStatus = catchAsync(async (req: Request, res: Response) => {
  const { videoId } = req.params;

  if (!CLOUDFLARE_ACCOUNT_ID || !CLOUDFLARE_API_TOKEN) {
    return sendResponse(res, {
      statusCode: httpStatus.INTERNAL_SERVER_ERROR,
      success: false,
      message: 'Cloudflare configuration missing',
      data: null,
    });
  }

  const response = await axios.get(
    `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/stream/${videoId}`,
    {
      headers: {
        'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
      },
    }
  );

  const video = response.data.result;

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Video status fetched',
    data: {
      uid: video.uid,
      status: video.status?.state || 'processing',
      readyToStream: video.readyToStream,
      pctComplete: video.status?.pctComplete || 0,
      errorReasonCode: video.status?.errorReasonCode,
      errorReasonText: video.status?.errorReasonText,
    },
  });
});

/**
 * Delete video from Cloudflare Stream
 */
const deleteVideo = catchAsync(async (req: Request, res: Response) => {
  const { videoId } = req.params;

  if (!CLOUDFLARE_ACCOUNT_ID || !CLOUDFLARE_API_TOKEN) {
    return sendResponse(res, {
      statusCode: httpStatus.INTERNAL_SERVER_ERROR,
      success: false,
      message: 'Cloudflare configuration missing',
      data: null,
    });
  }

  await axios.delete(
    `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/stream/${videoId}`,
    {
      headers: {
        'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
      },
    }
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Video deleted successfully',
    data: null,
  });
});

/**
 * List all videos from Cloudflare Stream
 */
const listVideos = catchAsync(async (req: Request, res: Response) => {
  if (!CLOUDFLARE_ACCOUNT_ID || !CLOUDFLARE_API_TOKEN) {
    return sendResponse(res, {
      statusCode: httpStatus.INTERNAL_SERVER_ERROR,
      success: false,
      message: 'Cloudflare configuration missing',
      data: null,
    });
  }

  const response = await axios.get(
    `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/stream`,
    {
      headers: {
        'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
      },
    }
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Videos fetched successfully',
    data: response.data.result,
  });
});

/**
 * Get Cloudflare Stream configuration for frontend
 */
const getConfig = catchAsync(async (req: Request, res: Response) => {
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Cloudflare Stream config',
    data: {
      customerCode: CLOUDFLARE_STREAM_CUSTOMER_CODE,
      configured: !!(CLOUDFLARE_ACCOUNT_ID && CLOUDFLARE_API_TOKEN && CLOUDFLARE_STREAM_CUSTOMER_CODE),
    },
  });
});

export const CloudflareStreamController = {
  getDirectUploadUrl,
  getTusUploadUrl,
  getVideoDetails,
  getVideoStatus,
  deleteVideo,
  listVideos,
  getConfig,
};
