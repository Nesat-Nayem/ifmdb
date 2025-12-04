import express, {Application, Request,Response} from 'express';
import router from './app/routes';
import notFound from './app/middlewares/notFound';
import globalErrorHandler from './app/middlewares/globalErrorHandler';
import { setupSwagger } from './app/config/swagger';
import initializeFirebaseAdmin from './app/config/firebase-admin';
const app:Application = express();
import cors from 'cors';

// Initialize Firebase Admin SDK for Google Auth
try {
  initializeFirebaseAdmin();
} catch (error) {
  console.warn('⚠️ Firebase Admin SDK not initialized - Google auth will not work');
}


// parsers
app.use(express.json());

// CORS configuration for production
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  credentials: true
}));

// swagger configuration
setupSwagger(app);

// application routes
app.use('/v1/api',router)

const entryRoute = (req:Request, res:Response)=>{
    const message = 'Surver is running...';
    res.send(message)
}

app.get('/', entryRoute)

//Not Found
app.use(notFound);

app.use(globalErrorHandler);

export default app;