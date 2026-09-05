import { Router } from 'express';
import { payrunController } from './payrun.controller';
import { authenticate, authorize } from '../../middleware/auth';

const router = Router();

router.use(authenticate);

// Eligible employees for Step 1
router.get(
  '/eligible-employees',
  authorize('Admin', 'HR Payroll Manager', 'HR Payroll User'),
  (req, res, next) => payrunController.getEligibleEmployees(req, res, next)
);

router.post(
  '/eligible-employees',
  authorize('Admin', 'HR Payroll Manager', 'HR Payroll User'),
  (req, res, next) => payrunController.getEligibleEmployees(req, res, next)
);

// CRUD & Payrun Actions
router.post(
  '/',
  authorize('Admin', 'HR Payroll Manager', 'HR Payroll User'),
  (req, res, next) => payrunController.create(req, res, next)
);

router.get(
  '/',
  authorize('Admin', 'HR Payroll Manager', 'HR Payroll User'),
  (req, res, next) => payrunController.getAll(req, res, next)
);

router.get(
  '/:id',
  authorize('Admin', 'HR Payroll Manager', 'HR Payroll User'),
  (req, res, next) => payrunController.getById(req, res, next)
);

router.put(
  '/:id',
  authorize('Admin', 'HR Payroll Manager', 'HR Payroll User'),
  (req, res, next) => payrunController.update(req, res, next)
);

router.patch(
  '/:id',
  authorize('Admin', 'HR Payroll Manager', 'HR Payroll User'),
  (req, res, next) => payrunController.update(req, res, next)
);

router.post(
  '/:id/compute',
  authorize('Admin', 'HR Payroll Manager', 'HR Payroll User'),
  (req, res, next) => payrunController.compute(req, res, next)
);

router.post(
  '/:id/validate',
  authorize('Admin', 'HR Payroll Manager', 'HR Payroll User'),
  (req, res, next) => payrunController.validate(req, res, next)
);

router.post(
  '/:id/mark-paid',
  authorize('Admin', 'HR Payroll Manager', 'HR Payroll User'),
  (req, res, next) => payrunController.markPaid(req, res, next)
);

// Bulk send payslips by email
router.post(
  '/:id/send-payslips',
  authorize('Admin', 'HR Payroll Manager', 'HR Payroll User'),
  (req, res, next) => payrunController.sendPayslips(req, res, next)
);

// Delete Payrun & associated payslips
router.delete(
  '/:id',
  authorize('Admin', 'HR Payroll Manager', 'HR Payroll User'),
  (req, res, next) => payrunController.delete(req, res, next)
);

export default router;
