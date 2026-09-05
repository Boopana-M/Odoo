import { Router } from 'express';
import { userController } from './user.controller';
import { authenticate, authorize } from '../../middleware/auth';

const router = Router();

router.use(authenticate);

router.post('/', authorize('Admin'), (req, res, next) => userController.create(req, res, next));
router.get('/', authorize('Admin'), (req, res, next) => userController.getAll(req, res, next));
router.get('/:id', authorize('Admin'), (req, res, next) => userController.getById(req, res, next));
router.put('/:id', authorize('Admin'), (req, res, next) => userController.update(req, res, next));
router.delete('/:id', authorize('Admin'), (req, res, next) => userController.delete(req, res, next));

export default router;
