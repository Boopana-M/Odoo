import { Router } from 'express';
import { timeOffRequestController } from './request.controller';
import { authenticate, authorize } from '../../../middleware/auth';

const router = Router();

router.use(authenticate);

router.post('/', authorize('Admin', 'HR Manager', 'Employee'), (req, res, next) => timeOffRequestController.create(req, res, next));
router.get('/', authorize('Admin', 'HR Manager', 'HR Payroll User', 'HR Payroll Manager', 'Employee'), (req, res, next) => timeOffRequestController.getAll(req, res, next));
router.get('/:id', authorize('Admin', 'HR Manager', 'HR Payroll User', 'HR Payroll Manager', 'Employee'), (req, res, next) => timeOffRequestController.getById(req, res, next));
router.patch('/:id/approve', authorize('Admin', 'HR Manager'), (req, res, next) => timeOffRequestController.approve(req, res, next));
router.put('/:id/approve', authorize('Admin', 'HR Manager'), (req, res, next) => timeOffRequestController.approve(req, res, next));
router.patch('/:id/refuse', authorize('Admin', 'HR Manager'), (req, res, next) => timeOffRequestController.refuse(req, res, next));
router.put('/:id/refuse', authorize('Admin', 'HR Manager'), (req, res, next) => timeOffRequestController.refuse(req, res, next));
router.delete('/:id', authorize('Admin', 'HR Manager'), (req, res, next) => timeOffRequestController.delete(req, res, next));

export default router;
