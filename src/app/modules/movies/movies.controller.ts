import { Request, Response } from 'express';
import httpStatus from 'http-status';
import Movie from './movies.model';
import { catchAsync } from '../../utils/catchAsync';
import { sendResponse } from '../../utils/sendResponse';

// Create a new movie
const createMovie = catchAsync(async (req: Request, res: Response) => {
  const movieData = req.body;
  
  const newMovie = await Movie.create(movieData);
  
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Movie created successfully',
    data: newMovie
  });
});

// Get all movies with filtering, searching, and pagination
const getAllMovies = catchAsync(async (req: Request, res: Response) => {
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
  const { id } = req.params;
  
  const movie = await Movie.findById(id);
  
  if (!movie) {
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
    message: 'Movie retrieved successfully',
    data: movie
  });
});

// Update movie
const updateMovie = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updateData = req.body;
  
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
  getMovieCastCrew
};
