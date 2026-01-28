import express from 'express';
import dotenv from 'dotenv';
dotenv.config();
const app = express();
import morgan from 'morgan'
import helmet from 'helmet';
import cors from 'cors';

import type { NextFunction, ErrorRequestHandler } from 'express';
import { apiRouter } from '../src/routers/api.router';
import { apipasteHtmlGet } from '../src/controllers/api.controller';

const errorHandler: ErrorRequestHandler = (err, req, res, next: NextFunction) => {
    if ((res as any).headersSent) {
        return next(err); // goes to the default error handler
    }

    return res.status(500).send('Something broke!');
}



app.use(express.json());
app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));
if (process.env.NODE_ENV === "development") {
    app.use(morgan("common"));
}
app.use(express.urlencoded({ extended: false }));
app.use(cors());

app.get('/', (req, res) => {
    return res.send("Server is running");
})
app.use('/api', apiRouter);
app.get('/p/:id', apipasteHtmlGet);

app.use(errorHandler);



app.listen(3000, () => {
    console.log("Server listening at 3000");
})

export default app;
