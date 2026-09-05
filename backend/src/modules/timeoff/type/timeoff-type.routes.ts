import { Router } from 'express';
import { timeOffTypeController } from './timeoff-type.controller';
import { authenticate, authorize } from '../../../middleware/auth';

const router = Router();

router.use(authenticate);

router.post('/', authorize('Admin', 'HR Manager'), (req, res, next) => timeOffTypeController.create(req, res, next));
router.get('/', authorize('Admin', 'HR Manager', 'HR Payroll User', 'HR Payroll Manager', 'Employee'), (req, res, next) => timeOffTypeController.getAll(req, res, next));
router.get('/:id', authorize('Admin', 'HR Manager', 'HR Payroll User', 'HR Payroll Manager', 'Employee'), (req, res, next) => timeOffTypeController.getById(req, res, next));
router.put('/:id', authorize('Admin', 'HR Manager'), (req, res, next) => timeOffTypeController.update(req, res, next));
router.patch('/:id', authorize('Admin', 'HR Manager'), (req, res, next) => timeOffTypeController.update(req, res, next));
router.delete('/:id', authorize('Admin', 'HR Manager'), (req, res, next) => timeOffTypeController.delete(req, res, next));

export default router;
