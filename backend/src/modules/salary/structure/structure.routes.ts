import { Router } from 'express';
import { salaryStructureController } from './structure.controller';
import { authenticate, authorize } from '../../../middleware/auth';

const router = Router();

router.use(authenticate);

router.post(
  '/',
  authorize('Admin', 'HR Payroll Manager'),
  (req, res, next) => salaryStructureController.create(req, res, next)
);

router.get(
  '/',
  authorize('Admin', 'HR Manager', 'HR Payroll Manager', 'HR Payroll User'),
  (req, res, next) => salaryStructureController.getAll(req, res, next)
);

router.get(
  '/:id',
  authorize('Admin', 'HR Manager', 'HR Payroll Manager', 'HR Payroll User'),
  (req, res, next) => salaryStructureController.getById(req, res, next)
);

router.put(
  '/:id',
  authorize('Admin', 'HR Payroll Manager'),
  (req, res, next) => salaryStructureController.update(req, res, next)
);

router.patch(
  '/:id',
  authorize('Admin', 'HR Payroll Manager'),
  (req, res, next) => salaryStructureController.update(req, res, next)
);

router.delete(
  '/:id',
  authorize('Admin', 'HR Payroll Manager'),
  (req, res, next) => salaryStructureController.delete(req, res, next)
);

export default router;
