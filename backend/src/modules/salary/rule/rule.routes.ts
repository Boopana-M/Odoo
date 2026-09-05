import { Router } from 'express';
import { salaryRuleController } from './rule.controller';
import { authenticate, authorize } from '../../../middleware/auth';

const router = Router();

router.use(authenticate);

// Create Salary Rule (Admin, HR Payroll Manager)
router.post(
  '/',
  authorize('Admin', 'HR Payroll Manager'),
  (req, res, next) => salaryRuleController.create(req, res, next)
);

// Get All Salary Rules (Admin, HR Payroll Manager, HR Payroll User)
router.get(
  '/',
  authorize('Admin', 'HR Payroll Manager', 'HR Payroll User'),
  (req, res, next) => salaryRuleController.getAll(req, res, next)
);

// Get Salary Rules for a specific structure (Admin, HR Payroll Manager, HR Payroll User)
router.get(
  '/structure/:structureId',
  authorize('Admin', 'HR Payroll Manager', 'HR Payroll User'),
  (req, res, next) => salaryRuleController.getByStructure(req, res, next)
);

// Get one Salary Rule (Admin, HR Payroll Manager, HR Payroll User)
router.get(
  '/:id',
  authorize('Admin', 'HR Payroll Manager', 'HR Payroll User'),
  (req, res, next) => salaryRuleController.getById(req, res, next)
);

// Update Salary Rule (Admin, HR Payroll Manager)
router.put(
  '/:id',
  authorize('Admin', 'HR Payroll Manager'),
  (req, res, next) => salaryRuleController.update(req, res, next)
);

router.patch(
  '/:id',
  authorize('Admin', 'HR Payroll Manager'),
  (req, res, next) => salaryRuleController.update(req, res, next)
);

// Delete Salary Rule (Admin, HR Payroll Manager)
router.delete(
  '/:id',
  authorize('Admin', 'HR Payroll Manager'),
  (req, res, next) => salaryRuleController.delete(req, res, next)
);

export default router;
