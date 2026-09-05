import { Router } from 'express';
import { departmentController } from './department.controller';

const router = Router();

router.post('/', (req, res, next) => departmentController.create(req, res, next));
router.get('/', (req, res, next) => departmentController.getAll(req, res, next));
router.get('/:id', (req, res, next) => departmentController.getById(req, res, next));
router.put('/:id', (req, res, next) => departmentController.update(req, res, next));
router.delete('/:id', (req, res, next) => departmentController.delete(req, res, next));

export default router;
