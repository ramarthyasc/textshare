import express from 'express';
import dotenv from 'dotenv';
dotenv.config();
const app = express();
import morgan from 'morgan'
import helmet from 'helmet';
// import cors from 'cors';

import type { NextFunction, ErrorRequestHandler } from 'express';
import { apiRouter } from './routers/api.router';
import { apipasteHtmlGet } from './controllers/api.controller';

const errorHandler: ErrorRequestHandler = (err, req, res, next: NextFunction) => {
    if ((res as any).headersSent) {
        return next(err); // goes to the default error handler
    }

    return res.status(500).send('Something broke!');
}



// const corsOptions ={
//     origin: "https://textshare-client-virid.vercel.app",
//     methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
//     allowedHeaders: ["Content-Type", "Authorization"]
// }
//
// app.use(cors(corsOptions));
// app.options("/*splat", cors(corsOptions));

app.use(express.json());
app.use(helmet());
// app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));
if (process.env.NODE_ENV === "development") {
    app.use(morgan("common"));
}
app.use(express.urlencoded({ extended: false }));

// app.get('/', (req, res) => {
//     return res.json({ message: "Server is working" });
// })
app.use('/api', apiRouter);
app.get('/p/:id', apipasteHtmlGet);


app.use((req, res) => {
    console.log("404 path not found");
    return res.status(404).send("Request to unknown path");
})

app.use(errorHandler);

export default app;
