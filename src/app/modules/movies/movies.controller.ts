import { Request, Response } from 'express';
import httpStatus from 'http-status';
import Movie from './movies.model';
import { catchAsync } from '../../utils/catchAsync';
import { sendResponse } from '../../utils/sendResponse';
import { MovieCategory } from './movieCategory.model';
import { userInterface } from '../../middlewares/userInterface';

// Create a new movie
const createMovie = catchAsync(async (req: Request, res: Response) => {
  const user = (req as userInterface).user;
  const movieData = req.body as any;
  // Normalize admin UI payload
  const normalized: any = { ...movieData };

  // Handle alias 'geners' -> 'genres'
  if (!normalized.genres && normalized.geners) {
    if (typeof normalized.geners === 'string') {
      normalized.genres = normalized.geners.split(',').map((s: string) => s.trim()).filter(Boolean);
    } else if (Array.isArray(normalized.geners)) {
      normalized.genres = normalized.geners;
    }
    delete normalized.geners;
  }

  // Ensure arrays for formats, languages, genres
  if (normalized.formats) {
    if (typeof normalized.formats === 'string') normalized.formats = [normalized.formats];
  }
  if (normalized.languages) {
    if (typeof normalized.languages === 'string') {
      normalized.languages = normalized.languages.includes(',')
        ? normalized.languages.split(',').map((s: string) => s.trim()).filter(Boolean)
        : [normalized.languages];
    }
  }
  if (normalized.genres && typeof normalized.genres === 'string') {
    normalized.genres = normalized.genres.includes(',')
      ? normalized.genres.split(',').map((s: string) => s.trim()).filter(Boolean)
      : [normalized.genres];
  }

  // Coerce number fields that might arrive as strings
  ['duration', 'imdbRating', 'rottenTomatoesRating', 'budget', 'boxOffice', 'productionCost'].forEach((k) => {
    if (normalized[k] !== undefined && typeof normalized[k] === 'string') {
      const n = Number(normalized[k]);
      if (!Number.isNaN(n)) normalized[k] = n;
    }
  });

  // Company mapping from UI
  const hasCompanyFields = ['productionhouse', 'website', 'address', 'state', 'phone', 'email'].some((k) => normalized[k] !== undefined);
  if (hasCompanyFields) {
    normalized.company = {
      productionHouse: normalized.productionhouse || normalized.productionHouse || '',
      website: normalized.website || '',
      address: normalized.address || '',
      state: normalized.state || '',
      phone: normalized.phone || '',
      email: normalized.email || '',
    };
    // Do not persist the loose fields
    delete normalized.productionhouse;
    delete normalized.productionHouse;
    delete normalized.website;
    delete normalized.address;
    delete normalized.state;
    delete normalized.phone;
    delete normalized.email;
  }

  // If user is a vendor, add vendorId to the movie
  if (user && user.role === 'vendor') {
    normalized.vendorId = user._id;
  }

  const newMovie = await Movie.create(normalized);
  
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Movie created successfully',
    data: newMovie
  });
});

// Get all movies with filtering, searching, and pagination
const getAllMovies = catchAsync(async (req: Request, res: Response) => {
  const user = (req as userInterface).user;
  const {
    page = 1,
    limit = 10,
    search,
    genre,
    language,
    country,
    status,
    rating,
    releaseYear,
    minRating,
    maxRating,
    format,
    sortBy = 'releaseDate',
    sortOrder = 'desc'
  } = req.query;

  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const skip = (pageNum - 1) * limitNum;

  // Build filter query
  const filter: any = { isActive: true };

  // Visibility schedule filter - only for non-admin/vendor panel requests
  const isAdminOrVendor = user && (user.role === 'admin' || user.role === 'vendor');
  if (!isAdminOrVendor) {
    const now = new Date();
    filter.$or = [
      { isScheduled: { $ne: true } },
      {
        isScheduled: true,
        $and: [
          { $or: [{ visibleFrom: null }, { visibleFrom: { $lte: now } }] },
          { $or: [{ visibleUntil: null }, { visibleUntil: { $gt: now } }] }
        ]
      }
    ];
  }

  // If user is a vendor, only show their own movies
  if (user && user.role === 'vendor') {
    filter.vendorId = user._id;
  }

  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { originalTitle: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { tags: { $in: [new RegExp(search as string, 'i')] } },
      { 'castCrew.name': { $regex: search, $options: 'i' } }
    ];
  }

  if (genre) filter.genres = { $in: [genre] };
  if (language) filter.languages = { $in: [language] };
  if (country) filter.country = { $regex: country, $options: 'i' };
  if (status) filter.status = status;
  if (rating) filter.rating = rating;
  if (format) filter.formats = { $in: [format] };

  // Release year filter
  if (releaseYear) {
    const year = parseInt(releaseYear as string);
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year + 1, 0, 1);
    filter.releaseDate = { $gte: startDate, $lt: endDate };
  }

  // Rating range filter
  if (minRating || maxRating) {
    filter.imdbRating = {};
    if (minRating) filter.imdbRating.$gte = parseFloat(minRating as string);
    if (maxRating) filter.imdbRating.$lte = parseFloat(maxRating as string);
  }

  // Sort options
  const sortOptions: any = {};
  sortOptions[sortBy as string] = sortOrder === 'desc' ? -1 : 1;

  const movies = await Movie.find(filter)
    .sort(sortOptions)
    .skip(skip)
    .limit(limitNum)
    .lean();

  const total = await Movie.countDocuments(filter);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Movies retrieved successfully',
    data: movies,
    meta: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum)
    }
  });
});

// Get single movie by ID
const getMovieById = catchAsync(async (req: Request, res: Response) => {
  const user = (req as userInterface).user;
  const { id } = req.params;
  
  const movie = await Movie.findById(id);
  
  if (!movie || !movie.isActive) {
    return sendResponse(res, {
      statusCode: httpStatus.NOT_FOUND,
      success: false,
      message: 'Movie not found',
      data: null
    });
  }

  // Check visibility schedule for public access
  const isAdminOrVendor = user && (user.role === 'admin' || user.role === 'vendor');
  if (!isAdminOrVendor && movie.isScheduled) {
    const now = new Date();
    if (movie.visibleFrom && now < movie.visibleFrom) {
      return sendResponse(res, {
        statusCode: httpStatus.FORBIDDEN,
        success: false,
        message: `This movie will be visible from ${movie.visibleFrom.toLocaleString()}`,
        data: { visibleFrom: movie.visibleFrom }
      });
    }
    if (movie.visibleUntil && now > movie.visibleUntil) {
      return sendResponse(res, {
        statusCode: httpStatus.GONE,
        success: false,
        message: 'This movie is no longer available',
        data: { expiredAt: movie.visibleUntil }
      });
    }
  }

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Movie retrieved successfully',
    data: movie
  });
});

// Update movie
const updateMovie = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updateData = { ...(req.body as any) };

  // Normalize admin UI payload similarly as in create
  if (updateData.geners && !updateData.genres) {
    if (typeof updateData.geners === 'string') {
      updateData.genres = updateData.geners.split(',').map((s: string) => s.trim()).filter(Boolean);
    } else if (Array.isArray(updateData.geners)) {
      updateData.genres = updateData.geners;
    }
    delete updateData.geners;
  }
  if (updateData.formats) {
    if (typeof updateData.formats === 'string') updateData.formats = [updateData.formats];
  }
  if (updateData.languages) {
    if (typeof updateData.languages === 'string') {
      updateData.languages = updateData.languages.includes(',')
        ? updateData.languages.split(',').map((s: string) => s.trim()).filter(Boolean)
        : [updateData.languages];
    }
  }
  if (updateData.genres && typeof updateData.genres === 'string') {
    updateData.genres = updateData.genres.includes(',')
      ? updateData.genres.split(',').map((s: string) => s.trim()).filter(Boolean)
      : [updateData.genres];
  }

  ['duration', 'imdbRating', 'rottenTomatoesRating', 'budget', 'boxOffice', 'productionCost'].forEach((k) => {
    if (updateData[k] !== undefined && typeof updateData[k] === 'string') {
      const n = Number(updateData[k]);
      if (!Number.isNaN(n)) updateData[k] = n;
    }
  });

  const hasCompanyFields = ['productionhouse', 'productionHouse', 'website', 'address', 'state', 'phone', 'email'].some((k) => updateData[k] !== undefined);
  if (hasCompanyFields) {
    updateData.company = {
      productionHouse: updateData.productionhouse || updateData.productionHouse || '',
      website: updateData.website || '',
      address: updateData.address || '',
      state: updateData.state || '',
      phone: updateData.phone || '',
      email: updateData.email || '',
    };
    delete updateData.productionhouse;
    delete updateData.productionHouse;
    delete updateData.website;
    delete updateData.address;
    delete updateData.state;
    delete updateData.phone;
    delete updateData.email;
  }
  
  const updatedMovie = await Movie.findByIdAndUpdate(
    id,
    updateData,
    { new: true, runValidators: true }
  );
  
  if (!updatedMovie) {
    return sendResponse(res, {
      statusCode: httpStatus.NOT_FOUND,
      success: false,
      message: 'Movie not found',
      data: null
    });
  }

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Movie updated successfully',
    data: updatedMovie
  });
});

// Delete movie (soft delete)
const deleteMovie = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  const deletedMovie = await Movie.findByIdAndUpdate(
    id,
    { isActive: false },
    { new: true }
  );
  
  if (!deletedMovie) {
    return sendResponse(res, {
      statusCode: httpStatus.NOT_FOUND,
      success: false,
      message: 'Movie not found',
      data: null
    });
  }

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Movie deleted successfully',
    data: deletedMovie
  });
});

// Add review to movie
const addReview = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const reviewData = req.body;
  
  const movie = await Movie.findById(id);
  
  if (!movie) {
    return sendResponse(res, {
      statusCode: httpStatus.NOT_FOUND,
      success: false,
      message: 'Movie not found',
      data: null
    });
  }

  // Check if user already reviewed this movie
  const existingReview = movie.reviews.find(
    (review: any) => review.userId.toString() === reviewData.userId
  );

  if (existingReview) {
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: 'User has already reviewed this movie',
      data: null
    });
  }

  movie.reviews.push(reviewData);
  await movie.save();

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Review added successfully',
    data: movie
  });
});

// Get movie reviews
const getMovieReviews = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const skip = (pageNum - 1) * limitNum;

  const movie = await Movie.findById(id);
  
  if (!movie) {
    return sendResponse(res, {
      statusCode: httpStatus.NOT_FOUND,
      success: false,
      message: 'Movie not found',
      data: null
    });
  }

  // Sort reviews
  const sortedReviews = movie.reviews.sort((a: any, b: any) => {
    const aValue = a[sortBy as string];
    const bValue = b[sortBy as string];
    
    if (sortOrder === 'desc') {
      return bValue > aValue ? 1 : -1;
    } else {
      return aValue > bValue ? 1 : -1;
    }
  });

  // Paginate reviews
  const paginatedReviews = sortedReviews.slice(skip, skip + limitNum);
  const total = movie.reviews.length;

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Movie reviews retrieved successfully',
    data: paginatedReviews,
    meta: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
      averageRating: movie.averageRating,
      totalReviews: movie.totalReviews
    }
  });
});

// Get movies by genre
const getMoviesByGenre = catchAsync(async (req: Request, res: Response) => {
  const { genre } = req.params;
  const { page = 1, limit = 10 } = req.query;

  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const skip = (pageNum - 1) * limitNum;

  const movies = await Movie.find({
    genres: { $in: [genre] },
    isActive: true,
    status: 'released'
  })
    .sort({ averageRating: -1, imdbRating: -1 })
    .skip(skip)
    .limit(limitNum)
    .lean();

  const total = await Movie.countDocuments({
    genres: { $in: [genre] },
    isActive: true,
    status: 'released'
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: `${genre} movies retrieved successfully`,
    data: movies,
    meta: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum)
    }
  });
});

// Get upcoming movies
const getUpcomingMovies = catchAsync(async (req: Request, res: Response) => {
  const { page = 1, limit = 10 } = req.query;

  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const skip = (pageNum - 1) * limitNum;

  const currentDate = new Date();

  const movies = await Movie.find({
    releaseDate: { $gte: currentDate },
    status: 'upcoming',
    isActive: true
  })
    .sort({ releaseDate: 1 })
    .skip(skip)
    .limit(limitNum)
    .lean();

  const total = await Movie.countDocuments({
    releaseDate: { $gte: currentDate },
    status: 'upcoming',
    isActive: true
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Upcoming movies retrieved successfully',
    data: movies,
    meta: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum)
    }
  });
});

// Get top rated movies
const getTopRatedMovies = catchAsync(async (req: Request, res: Response) => {
  const { page = 1, limit = 10 } = req.query;

  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const skip = (pageNum - 1) * limitNum;

  const movies = await Movie.find({
    isActive: true,
    status: 'released',
    averageRating: { $gte: 7 }
  })
    .sort({ averageRating: -1, imdbRating: -1 })
    .skip(skip)
    .limit(limitNum)
    .lean();

  const total = await Movie.countDocuments({
    isActive: true,
    status: 'released',
    averageRating: { $gte: 7 }
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Top rated movies retrieved successfully',
    data: movies,
    meta: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum)
    }
  });
});

// Get movie cast and crew
const getMovieCastCrew = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { role } = req.query;
  
  const movie = await Movie.findById(id).select('castCrew title');
  
  if (!movie) {
    return sendResponse(res, {
      statusCode: httpStatus.NOT_FOUND,
      success: false,
      message: 'Movie not found',
      data: null
    });
  }

  let castCrew = movie.castCrew;
  
  if (role) {
    castCrew = movie.castCrew.filter((person: any) => person.role === role);
  }

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Movie cast and crew retrieved successfully',
    data: {
      movieTitle: movie.title,
      castCrew: castCrew
    }
  });
});

// ===================== Movie Categories (for Admin UI) =====================

// Create movie category
const createMovieCategory = catchAsync(async (req: Request, res: Response) => {
  const { title, status } = req.body as any;
  const titleTrimmed = (title || '').trim();
  const statusNorm = (status || 'active').toString().toLowerCase();

  const exists = await MovieCategory.findOne({ title: titleTrimmed, isDeleted: false });
  if (exists) {
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: 'Category with this title already exists',
      data: null,
    });
  }

  const created = await MovieCategory.create({ title: titleTrimmed, status: statusNorm });
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Movie category created successfully',
    data: created,
  });
});

// Get all movie categories
const getAllMovieCategories = catchAsync(async (req: Request, res: Response) => {
  const categories = await MovieCategory.find({ isDeleted: false }).sort({ createdAt: -1 });
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Movie categories retrieved successfully',
    data: categories,
  });
});

// Get single movie category
const getMovieCategoryById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const category = await MovieCategory.findOne({ _id: id, isDeleted: false });
  if (!category) {
    return sendResponse(res, {
      statusCode: httpStatus.NOT_FOUND,
      success: false,
      message: 'Movie category not found',
      data: null,
    });
  }
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Movie category retrieved successfully',
    data: category,
  });
});

// Update movie category
const updateMovieCategory = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { title, status } = req.body as any;

  const payload: any = {};
  if (title) {
    const titleTrimmed = title.trim();
    const exists = await MovieCategory.findOne({ _id: { $ne: id }, title: titleTrimmed, isDeleted: false });
    if (exists) {
      return sendResponse(res, {
        statusCode: httpStatus.BAD_REQUEST,
        success: false,
        message: 'Category with this title already exists',
        data: null,
      });
    }
    payload.title = titleTrimmed;
  }
  if (status) payload.status = status.toString().toLowerCase();

  const updated = await MovieCategory.findOneAndUpdate({ _id: id, isDeleted: false }, payload, { new: true });
  if (!updated) {
    return sendResponse(res, {
      statusCode: httpStatus.NOT_FOUND,
      success: false,
      message: 'Movie category not found',
      data: null,
    });
  }

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Movie category updated successfully',
    data: updated,
  });
});

// Delete movie category (soft)
const deleteMovieCategory = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const deleted = await MovieCategory.findOneAndUpdate({ _id: id, isDeleted: false }, { isDeleted: true }, { new: true });
  if (!deleted) {
    return sendResponse(res, {
      statusCode: httpStatus.NOT_FOUND,
      success: false,
      message: 'Movie category not found',
      data: null,
    });
  }
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Movie category deleted successfully',
    data: deleted,
  });
});

export const MovieController = {
  createMovie,
  getAllMovies,
  getMovieById,
  updateMovie,
  deleteMovie,
  addReview,
  getMovieReviews,
  getMoviesByGenre,
  getUpcomingMovies,
  getTopRatedMovies,
  getMovieCastCrew,
  // categories
  createMovieCategory,
  getAllMovieCategories,
  getMovieCategoryById,
  updateMovieCategory,
  deleteMovieCategory,
};
