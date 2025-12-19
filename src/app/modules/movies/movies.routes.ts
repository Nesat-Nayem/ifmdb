import express from 'express';
import { MovieController } from './movies.controller';
import validateRequest from '../../middlewares/validateRequest';
import { MovieValidation } from './movies.validation';
import { auth, optionalAuth } from '../../middlewares/authMiddleware';

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     CastCrew:
 *       type: object
 *       required:
 *         - name
 *         - role
 *       properties:
 *         name:
 *           type: string
 *           description: Name of the cast/crew member
 *         role:
 *           type: string
 *           enum: [actor, actress, director, producer, writer, cinematographer, music_director, editor, other]
 *           description: Role in the movie
 *         characterName:
 *           type: string
 *           description: Character name (for actors/actresses)
 *         profileImage:
 *           type: string
 *           description: URL to profile image
 *         bio:
 *           type: string
 *           description: Biography
 *         isMainCast:
 *           type: boolean
 *           description: Whether this is a main cast member
 * 
 *     MovieReview:
 *       type: object
 *       required:
 *         - userId
 *         - userName
 *         - rating
 *         - reviewText
 *       properties:
 *         userId:
 *           type: string
 *           description: ID of the user who wrote the review
 *         userName:
 *           type: string
 *           description: Name of the reviewer
 *         userImage:
 *           type: string
 *           description: URL to user's profile image
 *         rating:
 *           type: integer
 *           minimum: 1
 *           maximum: 10
 *           description: Rating out of 10
 *         reviewText:
 *           type: string
 *           description: Review content
 *         isVerified:
 *           type: boolean
 *           description: Whether the review is verified
 *         helpfulCount:
 *           type: integer
 *           description: Number of helpful votes
 *         createdAt:
 *           type: string
 *           format: date-time
 * 
 *     Movie:
 *       type: object
 *       required:
 *         - title
 *         - description
 *         - releaseDate
 *         - duration
 *         - genres
 *         - languages
 *         - posterUrl
 *         - country
 *       properties:
 *         _id:
 *           type: string
 *           description: Movie ID
 *         title:
 *           type: string
 *           description: Movie title
 *         originalTitle:
 *           type: string
 *           description: Original title in native language
 *         description:
 *           type: string
 *           description: Movie description/plot
 *         releaseDate:
 *           type: string
 *           format: date
 *           description: Release date
 *         duration:
 *           type: integer
 *           minimum: 1
 *           description: Duration in minutes
 *         genres:
 *           type: array
 *           items:
 *             type: string
 *           description: Movie genres
 *         languages:
 *           type: array
 *           items:
 *             type: string
 *           description: Available languages
 *         originalLanguage:
 *           type: string
 *           description: Original language
 *         rating:
 *           type: string
 *           enum: [G, PG, PG-13, R, NC-17, NR]
 *           description: Content rating
 *         imdbRating:
 *           type: number
 *           minimum: 0
 *           maximum: 10
 *           description: IMDB rating
 *         rottenTomatoesRating:
 *           type: number
 *           minimum: 0
 *           maximum: 100
 *           description: Rotten Tomatoes rating
 *         posterUrl:
 *           type: string
 *           description: URL to poster image
 *         backdropUrl:
 *           type: string
 *           description: URL to backdrop image
 *         trailerUrl:
 *           type: string
 *           description: URL to trailer video
 *         galleryImages:
 *           type: array
 *           items:
 *             type: string
 *           description: Array of gallery image URLs
 *         budget:
 *           type: number
 *           minimum: 0
 *           description: Production budget
 *         boxOffice:
 *           type: number
 *           minimum: 0
 *           description: Box office earnings
 *         country:
 *           type: string
 *           description: Country of origin
 *         productionCompanies:
 *           type: array
 *           items:
 *             type: string
 *           description: Production companies
 *         distributors:
 *           type: array
 *           items:
 *             type: string
 *           description: Distribution companies
 *         castCrew:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/CastCrew'
 *         reviews:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/MovieReview'
 *         averageRating:
 *           type: number
 *           minimum: 0
 *           maximum: 10
 *           description: Average user rating
 *         totalReviews:
 *           type: integer
 *           description: Total number of reviews
 *         formats:
 *           type: array
 *           items:
 *             type: string
 *           description: Available formats (free-form strings, e.g., 2d, 3d, imax, dolby_atmos, imax_3d)
 *         status:
 *           type: string
 *           enum: [upcoming, released, in_production]
 *           description: Movie status
 *         isActive:
 *           type: boolean
 *           description: Whether the movie is active
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *           description: Movie tags
 *         awards:
 *           type: array
 *           items:
 *             type: string
 *           description: Awards received
 *         director:
 *           type: string
 *           description: Director name
 *         producer:
 *           type: string
 *           description: Producer name
 *         productionCost:
 *           type: number
 *           description: Production cost (numeric)
 *         uaCertification:
 *           type: string
 *           description: UA certification
 *         company:
 *           $ref: '#/components/schemas/MovieCompany'
 *         cast:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/AdminCast'
 *           description: Simple cast list for admin UI
 *         crew:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/AdminCrew'
 *           description: Simple crew list for admin UI
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /v1/api/movies:
 *   post:
 *     summary: Create a new movie
 *     tags: [Movies]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Movie'
 *     responses:
 *       201:
 *         description: Movie created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Movie'
 *       400:
 *         description: Bad request
 */
router.post(
  '/',
  auth(),
  validateRequest(MovieValidation.createMovieValidation),
  MovieController.createMovie
);

/**
 * @swagger
 * /v1/api/movies:
 *   get:
 *     summary: Get all movies with filtering and pagination
 *     tags: [Movies]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of movies per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in title, description, tags, and cast
 *       - in: query
 *         name: genre
 *         schema:
 *           type: string
 *         description: Filter by genre
 *       - in: query
 *         name: language
 *         schema:
 *           type: string
 *         description: Filter by language
 *       - in: query
 *         name: country
 *         schema:
 *           type: string
 *         description: Filter by country
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [upcoming, released, in_production]
 *         description: Filter by status
 *       - in: query
 *         name: rating
 *         schema:
 *           type: string
 *           enum: [G, PG, PG-13, R, NC-17, NR]
 *         description: Filter by content rating
 *       - in: query
 *         name: releaseYear
 *         schema:
 *           type: integer
 *         description: Filter by release year
 *       - in: query
 *         name: minRating
 *         schema:
 *           type: number
 *         description: Minimum IMDB rating
 *       - in: query
 *         name: maxRating
 *         schema:
 *           type: number
 *         description: Maximum IMDB rating
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *         description: Filter by format (free-form string)
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [title, releaseDate, imdbRating, averageRating, createdAt]
 *           default: releaseDate
 *         description: Sort by field
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: Movies retrieved successfully
 */
router.get(
  '/',
  optionalAuth(),
  validateRequest(MovieValidation.getMoviesValidation),
  MovieController.getAllMovies
);

/**
 * @swagger
 * /v1/api/movies/upcoming:
 *   get:
 *     summary: Get upcoming movies
 *     tags: [Movies]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Upcoming movies retrieved successfully
 */
router.get('/upcoming', MovieController.getUpcomingMovies);

/**
 * @swagger
 * /v1/api/movies/top-rated:
 *   get:
 *     summary: Get top rated movies
 *     tags: [Movies]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Top rated movies retrieved successfully
 */
router.get('/top-rated', MovieController.getTopRatedMovies);

/**
 * @swagger
 * /v1/api/movies/genre/{genre}:
 *   get:
 *     summary: Get movies by genre
 *     tags: [Movies]
 *     parameters:
 *       - in: path
 *         name: genre
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Movies by genre retrieved successfully
 */
router.get('/genre/:genre', MovieController.getMoviesByGenre);

/**
 * @swagger
 * /v1/api/movies/categories:
 *   post:
 *     summary: Create a movie category
 *     tags: [MovieCategories]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title]
 *             properties:
 *               title:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *     responses:
 *       201:
 *         description: Movie category created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MovieCategory'
 */
router.post('/categories', MovieController.createMovieCategory);

/**
 * @swagger
 * /v1/api/movies/categories:
 *   get:
 *     summary: Get all movie categories
 *     tags: [MovieCategories]
 *     responses:
 *       200:
 *         description: Movie categories retrieved successfully
 */
router.get('/categories', MovieController.getAllMovieCategories);

/**
 * @swagger
 * /v1/api/movies/categories/{id}:
 *   get:
 *     summary: Get a movie category by ID
 *     tags: [MovieCategories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Movie category retrieved successfully
 *       404:
 *         description: Movie category not found
 */
router.get('/categories/:id', MovieController.getMovieCategoryById);

/**
 * @swagger
 * /v1/api/movies/categories/{id}:
 *   put:
 *     summary: Update a movie category
 *     tags: [MovieCategories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *     responses:
 *       200:
 *         description: Movie category updated successfully
 *       404:
 *         description: Movie category not found
 */
router.put('/categories/:id', MovieController.updateMovieCategory);

/**
 * @swagger
 * /v1/api/movies/categories/{id}:
 *   delete:
 *     summary: Delete (soft) a movie category
 *     tags: [MovieCategories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Movie category deleted successfully
 *       404:
 *         description: Movie category not found
 */
router.delete('/categories/:id', MovieController.deleteMovieCategory);

/**
 * @swagger
 * /v1/api/movies/{id}:
 *   get:
 *     summary: Get movie by ID
 *     tags: [Movies]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Movie ID
 *     responses:
 *       200:
 *         description: Movie retrieved successfully
 *       404:
 *         description: Movie not found
 */
router.get('/:id', MovieController.getMovieById);

/**
 * @swagger
 * /v1/api/movies/{id}/cast-crew:
 *   get:
 *     summary: Get movie cast and crew
 *     tags: [Movies]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Movie ID
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [actor, actress, director, producer, writer, cinematographer, music_director, editor, other]
 *         description: Filter by role
 *     responses:
 *       200:
 *         description: Cast and crew retrieved successfully
 *       404:
 *         description: Movie not found
 */
router.get('/:id/cast-crew', MovieController.getMovieCastCrew);

/**
 * @swagger
 * /v1/api/movies/{id}/reviews:
 *   get:
 *     summary: Get movie reviews
 *     tags: [Movies]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Movie ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [rating, createdAt, helpfulCount]
 *           default: createdAt
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *     responses:
 *       200:
 *         description: Movie reviews retrieved successfully
 *       404:
 *         description: Movie not found
 */
router.get('/:id/reviews', MovieController.getMovieReviews);

/**
 * @swagger
 * /v1/api/movies/{id}/reviews:
 *   post:
 *     summary: Add a review to a movie
 *     tags: [Movies]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Movie ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MovieReview'
 *     responses:
 *       201:
 *         description: Review added successfully
 *       400:
 *         description: User has already reviewed this movie
 *       404:
 *         description: Movie not found
 */
router.post(
  '/:id/reviews',
  validateRequest(MovieValidation.addReviewValidation),
  MovieController.addReview
);

/**
 * @swagger
 * /v1/api/movies/{id}:
 *   put:
 *     summary: Update movie
 *     tags: [Movies]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Movie ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Movie'
 *     responses:
 *       200:
 *         description: Movie updated successfully
 *       404:
 *         description: Movie not found
 */
router.put(
  '/:id',
  validateRequest(MovieValidation.updateMovieValidation),
  MovieController.updateMovie
);

/**
 * @swagger
 * /v1/api/movies/{id}:
 *   delete:
 *     summary: Delete movie (soft delete)
 *     tags: [Movies]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Movie ID
 *     responses:
 *       200:
 *         description: Movie deleted successfully
 *       404:
 *         description: Movie not found
 */
router.delete('/:id', MovieController.deleteMovie);

/**
 * @swagger
 * components:
 *   schemas:
 *     MovieCompany:
 *       type: object
 *       properties:
 *         productionHouse:
 *           type: string
 *         website:
 *           type: string
 *         address:
 *           type: string
 *         state:
 *           type: string
 *         phone:
 *           type: string
 *         email:
 *           type: string
 *     AdminCast:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         type:
 *           type: string
 *         image:
 *           type: string
 *     AdminCrew:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         designation:
 *           type: string
 *         image:
 *           type: string
 *     MovieCategory:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: Movie category ID
 *         title:
 *           type: string
 *         status:
 *           type: string
 *           enum: [active, inactive]
 *         isDeleted:
 *           type: boolean
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /v1/api/movies/categories:
 *   post:
 *     summary: Create a movie category
 *     tags: [MovieCategories]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title]
 *             properties:
 *               title:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *     responses:
 *       201:
 *         description: Movie category created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MovieCategory'
 */
// (moved categories routes above to avoid conflict with generic :id routes)

export const movieRouter = router;
