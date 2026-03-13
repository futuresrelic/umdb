import { Router } from 'express';
import { getBoxSet } from '../controllers/boxSetController';

const router = Router();

router.get('/:id', getBoxSet);

export default router;
