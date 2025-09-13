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
const movieCategory_model_1 = require("./movieCategory.model");
// Create a new movie
const createMovie = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const movieData = req.body;
    // Normalize admin UI payload
    const normalized = Object.assign({}, movieData);
    // Handle alias 'geners' -> 'genres'
    if (!normalized.genres && normalized.geners) {
        if (typeof normalized.geners === 'string') {
            normalized.genres = normalized.geners.split(',').map((s) => s.trim()).filter(Boolean);
        }
        else if (Array.isArray(normalized.geners)) {
            normalized.genres = normalized.geners;
        }
        delete normalized.geners;
    }
    // Ensure arrays for formats, languages, genres
    if (normalized.formats) {
        if (typeof normalized.formats === 'string')
            normalized.formats = [normalized.formats];
    }
    if (normalized.languages) {
        if (typeof normalized.languages === 'string') {
            normalized.languages = normalized.languages.includes(',')
                ? normalized.languages.split(',').map((s) => s.trim()).filter(Boolean)
                : [normalized.languages];
        }
    }
    if (normalized.genres && typeof normalized.genres === 'string') {
        normalized.genres = normalized.genres.includes(',')
            ? normalized.genres.split(',').map((s) => s.trim()).filter(Boolean)
            : [normalized.genres];
    }
    // Coerce number fields that might arrive as strings
    ['duration', 'imdbRating', 'rottenTomatoesRating', 'budget', 'boxOffice', 'productionCost'].forEach((k) => {
        if (normalized[k] !== undefined && typeof normalized[k] === 'string') {
            const n = Number(normalized[k]);
            if (!Number.isNaN(n))
                normalized[k] = n;
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
    const newMovie = yield movies_model_1.default.create(normalized);
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
    const updateData = Object.assign({}, req.body);
    // Normalize admin UI payload similarly as in create
    if (updateData.geners && !updateData.genres) {
        if (typeof updateData.geners === 'string') {
            updateData.genres = updateData.geners.split(',').map((s) => s.trim()).filter(Boolean);
        }
        else if (Array.isArray(updateData.geners)) {
            updateData.genres = updateData.geners;
        }
        delete updateData.geners;
    }
    if (updateData.formats) {
        if (typeof updateData.formats === 'string')
            updateData.formats = [updateData.formats];
    }
    if (updateData.languages) {
        if (typeof updateData.languages === 'string') {
            updateData.languages = updateData.languages.includes(',')
                ? updateData.languages.split(',').map((s) => s.trim()).filter(Boolean)
                : [updateData.languages];
        }
    }
    if (updateData.genres && typeof updateData.genres === 'string') {
        updateData.genres = updateData.genres.includes(',')
            ? updateData.genres.split(',').map((s) => s.trim()).filter(Boolean)
            : [updateData.genres];
    }
    ['duration', 'imdbRating', 'rottenTomatoesRating', 'budget', 'boxOffice', 'productionCost'].forEach((k) => {
        if (updateData[k] !== undefined && typeof updateData[k] === 'string') {
            const n = Number(updateData[k]);
            if (!Number.isNaN(n))
                updateData[k] = n;
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
// ===================== Movie Categories (for Admin UI) =====================
// Create movie category
const createMovieCategory = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { title, status } = req.body;
    const titleTrimmed = (title || '').trim();
    const statusNorm = (status || 'active').toString().toLowerCase();
    const exists = yield movieCategory_model_1.MovieCategory.findOne({ title: titleTrimmed, isDeleted: false });
    if (exists) {
        return (0, sendResponse_1.sendResponse)(res, {
            statusCode: http_status_1.default.BAD_REQUEST,
            success: false,
            message: 'Category with this title already exists',
            data: null,
        });
    }
    const created = yield movieCategory_model_1.MovieCategory.create({ title: titleTrimmed, status: statusNorm });
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_1.default.CREATED,
        success: true,
        message: 'Movie category created successfully',
        data: created,
    });
}));
// Get all movie categories
const getAllMovieCategories = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const categories = yield movieCategory_model_1.MovieCategory.find({ isDeleted: false }).sort({ createdAt: -1 });
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Movie categories retrieved successfully',
        data: categories,
    });
}));
// Get single movie category
const getMovieCategoryById = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const category = yield movieCategory_model_1.MovieCategory.findOne({ _id: id, isDeleted: false });
    if (!category) {
        return (0, sendResponse_1.sendResponse)(res, {
            statusCode: http_status_1.default.NOT_FOUND,
            success: false,
            message: 'Movie category not found',
            data: null,
        });
    }
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Movie category retrieved successfully',
        data: category,
    });
}));
// Update movie category
const updateMovieCategory = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { title, status } = req.body;
    const payload = {};
    if (title) {
        const titleTrimmed = title.trim();
        const exists = yield movieCategory_model_1.MovieCategory.findOne({ _id: { $ne: id }, title: titleTrimmed, isDeleted: false });
        if (exists) {
            return (0, sendResponse_1.sendResponse)(res, {
                statusCode: http_status_1.default.BAD_REQUEST,
                success: false,
                message: 'Category with this title already exists',
                data: null,
            });
        }
        payload.title = titleTrimmed;
    }
    if (status)
        payload.status = status.toString().toLowerCase();
    const updated = yield movieCategory_model_1.MovieCategory.findOneAndUpdate({ _id: id, isDeleted: false }, payload, { new: true });
    if (!updated) {
        return (0, sendResponse_1.sendResponse)(res, {
            statusCode: http_status_1.default.NOT_FOUND,
            success: false,
            message: 'Movie category not found',
            data: null,
        });
    }
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Movie category updated successfully',
        data: updated,
    });
}));
// Delete movie category (soft)
const deleteMovieCategory = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const deleted = yield movieCategory_model_1.MovieCategory.findOneAndUpdate({ _id: id, isDeleted: false }, { isDeleted: true }, { new: true });
    if (!deleted) {
        return (0, sendResponse_1.sendResponse)(res, {
            statusCode: http_status_1.default.NOT_FOUND,
            success: false,
            message: 'Movie category not found',
            data: null,
        });
    }
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Movie category deleted successfully',
        data: deleted,
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
    getMovieCastCrew,
    // categories
    createMovieCategory,
    getAllMovieCategories,
    getMovieCategoryById,
    updateMovieCategory,
    deleteMovieCategory,
};
