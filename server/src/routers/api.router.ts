import { Router } from 'express';
import { 
    apihealthGet,
    apipastesPost,
    apipasteGet,
} from '../controllers/api.controller';


export const apiRouter = Router();


apiRouter.get('/healthz', apihealthGet);
apiRouter.post('/pastes', apipastesPost);
apiRouter.get('/pastes/:id', apipasteGet);
