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
exports.MovieController = void 0;
const http_status_1 = __importDefault(require("http-status"));
const movies_model_1 = __importDefault(require("./movies.model"));
const catchAsync_1 = require("../../utils/catchAsync");
const sendResponse_1 = require("../../utils/sendResponse");
// Create a new movie
const createMovie = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const movieData = req.body;
    const newMovie = yield movies_model_1.default.create(movieData);
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_1.default.CREATED,
        success: true,
        message: 'Movie created successfully',
        data: newMovie
    });
}));
// Get all movies with filtering, searching, and pagination
const getAllMovies = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { page = 1, limit = 10, search, genre, language, country, status, rating, releaseYear, minRating, maxRating, format, sortBy = 'releaseDate', sortOrder = 'desc' } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;
    // Build filter query
    const filter = { isActive: true };
    if (search) {
        filter.$or = [
            { title: { $regex: search, $options: 'i' } },
            { originalTitle: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } },
            { tags: { $in: [new RegExp(search, 'i')] } },
            { 'castCrew.name': { $regex: search, $options: 'i' } }
        ];
    }
    if (genre)
        filter.genres = { $in: [genre] };
    if (language)
        filter.languages = { $in: [language] };
    if (country)
        filter.country = { $regex: country, $options: 'i' };
    if (status)
        filter.status = status;
    if (rating)
        filter.rating = rating;
    if (format)
        filter.formats = { $in: [format] };
    // Release year filter
    if (releaseYear) {
        const year = parseInt(releaseYear);
        const startDate = new Date(year, 0, 1);
        const endDate = new Date(year + 1, 0, 1);
        filter.releaseDate = { $gte: startDate, $lt: endDate };
    }
    // Rating range filter
    if (minRating || maxRating) {
        filter.imdbRating = {};
        if (minRating)
            filter.imdbRating.$gte = parseFloat(minRating);
        if (maxRating)
            filter.imdbRating.$lte = parseFloat(maxRating);
    }
    // Sort options
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
    const movies = yield movies_model_1.default.find(filter)
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum)
        .lean();
    const total = yield movies_model_1.default.countDocuments(filter);
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_1.default.OK,
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
}));
// Get single movie by ID
const getMovieById = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const movie = yield movies_model_1.default.findById(id);
    if (!movie) {
        return (0, sendResponse_1.sendResponse)(res, {
            statusCode: http_status_1.default.NOT_FOUND,
            success: false,
            message: 'Movie not found',
            data: null
        });
    }
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Movie retrieved successfully',
        data: movie
    });
}));
// Update movie
const updateMovie = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const updateData = req.body;
    const updatedMovie = yield movies_model_1.default.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
    if (!updatedMovie) {
        return (0, sendResponse_1.sendResponse)(res, {
            statusCode: http_status_1.default.NOT_FOUND,
            success: false,
            message: 'Movie not found',
            data: null
        });
    }
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Movie updated successfully',
        data: updatedMovie
    });
}));
// Delete movie (soft delete)
const deleteMovie = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const deletedMovie = yield movies_model_1.default.findByIdAndUpdate(id, { isActive: false }, { new: true });
    if (!deletedMovie) {
        return (0, sendResponse_1.sendResponse)(res, {
            statusCode: http_status_1.default.NOT_FOUND,
            success: false,
            message: 'Movie not found',
            data: null
        });
    }
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Movie deleted successfully',
        data: deletedMovie
    });
}));
// Add review to movie
const addReview = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const reviewData = req.body;
    const movie = yield movies_model_1.default.findById(id);
    if (!movie) {
        return (0, sendResponse_1.sendResponse)(res, {
            statusCode: http_status_1.default.NOT_FOUND,
            success: false,
            message: 'Movie not found',
            data: null
        });
    }
    // Check if user already reviewed this movie
    const existingReview = movie.reviews.find((review) => review.userId.toString() === reviewData.userId);
    if (existingReview) {
        return (0, sendResponse_1.sendResponse)(res, {
            statusCode: http_status_1.default.BAD_REQUEST,
            success: false,
            message: 'User has already reviewed this movie',
            data: null
        });
    }
    movie.reviews.push(reviewData);
    yield movie.save();
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_1.default.CREATED,
        success: true,
        message: 'Review added successfully',
        data: movie
    });
}));
// Get movie reviews
const getMovieReviews = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;
    const movie = yield movies_model_1.default.findById(id);
    if (!movie) {
        return (0, sendResponse_1.sendResponse)(res, {
            statusCode: http_status_1.default.NOT_FOUND,
            success: false,
            message: 'Movie not found',
            data: null
        });
    }
    // Sort reviews
    const sortedReviews = movie.reviews.sort((a, b) => {
        const aValue = a[sortBy];
        const bValue = b[sortBy];
        if (sortOrder === 'desc') {
            return bValue > aValue ? 1 : -1;
        }
        else {
            return aValue > bValue ? 1 : -1;
        }
    });
    // Paginate reviews
    const paginatedReviews = sortedReviews.slice(skip, skip + limitNum);
    const total = movie.reviews.length;
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_1.default.OK,
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
}));
// Get movies by genre
const getMoviesByGenre = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { genre } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;
    const movies = yield movies_model_1.default.find({
        genres: { $in: [genre] },
        isActive: true,
        status: 'released'
    })
        .sort({ averageRating: -1, imdbRating: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean();
    const total = yield movies_model_1.default.countDocuments({
        genres: { $in: [genre] },
        isActive: true,
        status: 'released'
    });
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_1.default.OK,
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
}));
// Get upcoming movies
const getUpcomingMovies = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { page = 1, limit = 10 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;
    const currentDate = new Date();
    const movies = yield movies_model_1.default.find({
        releaseDate: { $gte: currentDate },
        status: 'upcoming',
        isActive: true
    })
        .sort({ releaseDate: 1 })
        .skip(skip)
        .limit(limitNum)
        .lean();
    const total = yield movies_model_1.default.countDocuments({
        releaseDate: { $gte: currentDate },
        status: 'upcoming',
        isActive: true
    });
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_1.default.OK,
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
}));
// Get top rated movies
const getTopRatedMovies = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { page = 1, limit = 10 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;
    const movies = yield movies_model_1.default.find({
        isActive: true,
        status: 'released',
        averageRating: { $gte: 7 }
    })
        .sort({ averageRating: -1, imdbRating: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean();
    const total = yield movies_model_1.default.countDocuments({
        isActive: true,
        status: 'released',
        averageRating: { $gte: 7 }
    });
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_1.default.OK,
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
}));
// Get movie cast and crew
const getMovieCastCrew = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { role } = req.query;
    const movie = yield movies_model_1.default.findById(id).select('castCrew title');
    if (!movie) {
        return (0, sendResponse_1.sendResponse)(res, {
            statusCode: http_status_1.default.NOT_FOUND,
            success: false,
            message: 'Movie not found',
            data: null
        });
    }
    let castCrew = movie.castCrew;
    if (role) {
        castCrew = movie.castCrew.filter((person) => person.role === role);
    }
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Movie cast and crew retrieved successfully',
        data: {
            movieTitle: movie.title,
            castCrew: castCrew
        }
    });
}));
exports.MovieController = {
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
