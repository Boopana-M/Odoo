import { Router } from 'express';
import { payslipController } from './payslip.controller';
import { authenticate, authorize, verifyEmployeeOwnership } from '../../middleware/auth';

const router = Router();

router.use(authenticate);

// List payslips (Admin, HR Payroll Manager, HR Payroll User, Employee - scoped to own in service)
router.get(
  '/',
  authorize('Admin', 'HR Payroll Manager', 'HR Payroll User', 'Employee'),
  (req, res, next) => payslipController.getAll(req, res, next)
);

// Preview calculation without saving (Admin, HR Payroll Manager, HR Payroll User)
router.post(
  '/calculate',
  authorize('Admin', 'HR Payroll Manager', 'HR Payroll User'),
  (req, res, next) => payslipController.calculate(req, res, next)
);

// Get all payslips for a specific payrun
router.get(
  '/payrun/:payrunId',
  authorize('Admin', 'HR Payroll Manager', 'HR Payroll User'),
  (req, res, next) => payslipController.getByPayrun(req, res, next)
);

// Get all payslips for a specific employee (Employee ownership checked)
router.get(
  '/employee/:employeeId',
  authorize('Admin', 'HR Payroll Manager', 'HR Payroll User', 'Employee'),
  verifyEmployeeOwnership('employeeId'),
  (req, res, next) => payslipController.getByEmployee(req, res, next)
);

// Get single payslip by ID (Admin, HR Payroll Manager, HR Payroll User, Employee - scoped in service)
router.get(
  '/:id',
  authorize('Admin', 'HR Payroll Manager', 'HR Payroll User', 'Employee'),
  (req, res, next) => payslipController.getById(req, res, next)
);

// Generate / Download Payslip PDF (Admin, HR Payroll Manager, HR Payroll User, Employee - scoped in service)
router.get(
  '/:id/pdf',
  authorize('Admin', 'HR Payroll Manager', 'HR Payroll User', 'Employee'),
  (req, res, next) => payslipController.generatePdf(req, res, next)
);

router.post(
  '/:id/pdf',
  authorize('Admin', 'HR Payroll Manager', 'HR Payroll User', 'Employee'),
  (req, res, next) => payslipController.generatePdf(req, res, next)
);

// Update payslip (Admin, HR Payroll Manager, HR Payroll User)
router.put(
  '/:id',
  authorize('Admin', 'HR Payroll Manager', 'HR Payroll User'),
  (req, res, next) => payslipController.update(req, res, next)
);

router.patch(
  '/:id',
  authorize('Admin', 'HR Payroll Manager', 'HR Payroll User'),
  (req, res, next) => payslipController.update(req, res, next)
);

// Mark payslip validated
router.post(
  '/:id/validate',
  authorize('Admin', 'HR Payroll Manager', 'HR Payroll User'),
  (req, res, next) => payslipController.validate(req, res, next)
);

// Mark payslip paid
router.post(
  '/:id/mark-paid',
  authorize('Admin', 'HR Payroll Manager', 'HR Payroll User'),
  (req, res, next) => payslipController.markPaid(req, res, next)
);

// Delete payslip (Admin, HR Payroll Manager)
router.delete(
  '/:id',
  authorize('Admin', 'HR Payroll Manager'),
  (req, res, next) => payslipController.delete(req, res, next)
);

export default router;
