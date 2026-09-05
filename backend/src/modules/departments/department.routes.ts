import { Router } from 'express';
import { departmentController } from './department.controller';
import { authenticate, authorize } from '../../middleware/auth';

const router = Router();

router.use(authenticate);

router.post('/', authorize('Admin', 'HR Manager'), (req, res, next) => departmentController.create(req, res, next));
router.get('/', authorize('Admin', 'HR Manager', 'HR Payroll User', 'HR Payroll Manager', 'Employee'), (req, res, next) => departmentController.getAll(req, res, next));
router.get('/:id', authorize('Admin', 'HR Manager', 'HR Payroll User', 'HR Payroll Manager', 'Employee'), (req, res, next) => departmentController.getById(req, res, next));
router.put('/:id', authorize('Admin', 'HR Manager'), (req, res, next) => departmentController.update(req, res, next));
router.delete('/:id', authorize('Admin', 'HR Manager'), (req, res, next) => departmentController.delete(req, res, next));

export default router;
