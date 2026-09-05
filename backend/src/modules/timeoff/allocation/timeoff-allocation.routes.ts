import { Router } from 'express';
import { timeOffAllocationController } from './timeoff-allocation.controller';
import { authenticate, authorize } from '../../../middleware/auth';

const router = Router();

router.use(authenticate);

router.post('/', authorize('Admin', 'HR Manager'), (req, res, next) => timeOffAllocationController.create(req, res, next));
router.get('/', authorize('Admin', 'HR Manager', 'HR Payroll User', 'HR Payroll Manager', 'Employee'), (req, res, next) => timeOffAllocationController.getAll(req, res, next));
router.get('/available', authorize('Admin', 'HR Manager', 'HR Payroll User', 'HR Payroll Manager', 'Employee'), (req, res, next) => timeOffAllocationController.getAvailable(req, res, next));
router.get('/:id', authorize('Admin', 'HR Manager', 'HR Payroll User', 'HR Payroll Manager', 'Employee'), (req, res, next) => timeOffAllocationController.getById(req, res, next));
router.put('/:id', authorize('Admin', 'HR Manager'), (req, res, next) => timeOffAllocationController.update(req, res, next));
router.patch('/:id', authorize('Admin', 'HR Manager'), (req, res, next) => timeOffAllocationController.update(req, res, next));
router.patch('/:id/approve', authorize('Admin', 'HR Manager'), (req, res, next) => timeOffAllocationController.approve(req, res, next));

export default router;
