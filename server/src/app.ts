import express from 'express';
import dotenv from 'dotenv';
dotenv.config();
const app = express();
import morgan from 'morgan'
import helmet from 'helmet';
import cors from 'cors';

import type { NextFunction, ErrorRequestHandler } from 'express';
import { apiRouter } from './routers/api.router';

const errorHandler: ErrorRequestHandler = (err, req, res, next: NextFunction) => {
    if ((res as any).headersSent) {
        return next(err); // goes to the default error handler
    }

    return res.status(500).send('Something broke!');
}



app.use(express.json());
app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));
app.use(morgan("common"));
app.use(express.urlencoded({ extended: false }));
app.use(cors());

app.use('/api', apiRouter);

app.use(errorHandler);

export default app;
