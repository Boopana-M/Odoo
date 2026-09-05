import { Router } from 'express';
import { dashboardController } from './dashboard.controller';
import { authenticate, authorize } from '../../middleware/auth';

const router = Router();

router.use(authenticate);

// Full unified dashboard
router.get(
  '/',
  authorize('Admin', 'HR Manager', 'HR Payroll Manager', 'HR Payroll User'),
  (req, res, next) => dashboardController.getPayrollDashboard(req, res, next)
);

router.get(
  '/payroll',
  authorize('Admin', 'HR Manager', 'HR Payroll Manager', 'HR Payroll User'),
  (req, res, next) => dashboardController.getPayrollDashboard(req, res, next)
);

// Summary KPI metrics
router.get(
  '/payroll/summary',
  authorize('Admin', 'HR Manager', 'HR Payroll Manager', 'HR Payroll User'),
  (req, res, next) => dashboardController.getSummary(req, res, next)
);

// Salary expenditure by department
router.get(
  '/payroll/salary-by-department',
  authorize('Admin', 'HR Manager', 'HR Payroll Manager', 'HR Payroll User'),
  (req, res, next) => dashboardController.getSalaryByDepartment(req, res, next)
);

// Monthly Net Salary Trends
router.get(
  '/payroll/monthly-net-salary',
  authorize('Admin', 'HR Manager', 'HR Payroll Manager', 'HR Payroll User'),
  (req, res, next) => dashboardController.getMonthlyNetSalary(req, res, next)
);

// Department headcount breakdown
router.get(
  '/payroll/headcount',
  authorize('Admin', 'HR Manager', 'HR Payroll Manager', 'HR Payroll User'),
  (req, res, next) => dashboardController.getHeadcount(req, res, next)
);

router.get(
  '/headcount',
  authorize('Admin', 'HR Manager', 'HR Payroll Manager', 'HR Payroll User'),
  (req, res, next) => dashboardController.getHeadcount(req, res, next)
);

// Attendance and Time Off overview
router.get(
  '/payroll/attendance-timeoff',
  authorize('Admin', 'HR Manager', 'HR Payroll Manager', 'HR Payroll User'),
  (req, res, next) => dashboardController.getAttendanceTimeOff(req, res, next)
);

router.get(
  '/attendance-timeoff',
  authorize('Admin', 'HR Manager', 'HR Payroll Manager', 'HR Payroll User'),
  (req, res, next) => dashboardController.getAttendanceTimeOff(req, res, next)
);

// Operational alerts
router.get(
  '/payroll/alerts',
  authorize('Admin', 'HR Manager', 'HR Payroll Manager', 'HR Payroll User'),
  (req, res, next) => dashboardController.getAlerts(req, res, next)
);

router.get(
  '/alerts',
  authorize('Admin', 'HR Manager', 'HR Payroll Manager', 'HR Payroll User'),
  (req, res, next) => dashboardController.getAlerts(req, res, next)
);

export default router;
