import { Router } from 'express';
import { attendanceController } from './attendance.controller';
import { authenticate, authorize } from '../../middleware/auth';

const router = Router();

router.use(authenticate);

// Employee Self-Service Attendance Routes (Employee role only)
router.post('/check-in', (req, res, next) => attendanceController.checkIn(req, res, next));
router.post('/check-out', (req, res, next) => attendanceController.checkOut(req, res, next));

router.post('/', authorize('Admin', 'HR Manager', 'Employee'), (req, res, next) => attendanceController.create(req, res, next));
router.get('/', authorize('Admin', 'HR Manager', 'HR Payroll User', 'HR Payroll Manager', 'Employee'), (req, res, next) => attendanceController.getAll(req, res, next));
router.get('/employee/:employeeId', authorize('Admin', 'HR Manager', 'HR Payroll User', 'HR Payroll Manager', 'Employee'), (req, res, next) => attendanceController.getByEmployeeId(req, res, next));
router.get('/status', (req, res, next) => attendanceController.getStatus(req, res, next));
router.get('/:id', authorize('Admin', 'HR Manager', 'HR Payroll User', 'HR Payroll Manager', 'Employee'), (req, res, next) => attendanceController.getById(req, res, next));
router.put('/:id', authorize('Admin', 'HR Manager', 'Employee'), (req, res, next) => attendanceController.update(req, res, next));
router.patch('/:id', authorize('Admin', 'HR Manager', 'Employee'), (req, res, next) => attendanceController.update(req, res, next));
router.delete('/:id', authorize('Admin', 'HR Manager'), (req, res, next) => attendanceController.delete(req, res, next));

export default router;

