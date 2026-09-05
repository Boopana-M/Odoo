import { Router } from 'express';
import { scheduleController } from './schedule.controller';
import { authenticate, authorize } from '../../middleware/auth';

const router = Router();

router.use(authenticate);

router.post('/', authorize('Admin', 'HR Manager'), (req, res, next) => scheduleController.create(req, res, next));
router.get('/', authorize('Admin', 'HR Manager', 'HR Payroll User', 'HR Payroll Manager', 'Employee'), (req, res, next) => scheduleController.getAll(req, res, next));
router.get('/:id', authorize('Admin', 'HR Manager', 'HR Payroll User', 'HR Payroll Manager', 'Employee'), (req, res, next) => scheduleController.getById(req, res, next));
router.put('/:id', authorize('Admin', 'HR Manager'), (req, res, next) => scheduleController.update(req, res, next));
router.patch('/:id', authorize('Admin', 'HR Manager'), (req, res, next) => scheduleController.update(req, res, next));
router.delete('/:id', authorize('Admin', 'HR Manager'), (req, res, next) => scheduleController.delete(req, res, next));

export default router;
