import { Router } from 'express';
import { employeeController } from './employee.controller';
import { authenticate, authorize, verifyEmployeeOwnership } from '../../middleware/auth';

const router = Router();

router.use(authenticate);

router.post('/', authorize('Admin', 'HR Manager'), (req, res, next) => employeeController.create(req, res, next));
router.get('/', authorize('Admin', 'HR Manager', 'HR Payroll User', 'HR Payroll Manager'), (req, res, next) => employeeController.getAll(req, res, next));
router.get('/me', (req, res, next) => {
  if (!req.user || !req.user.employeeId) {
    res.status(404).json({
      status: 'error',
      message: 'No employee record associated with current user'
    });
    return;
  }
  (req.params as Record<string, string>).id = req.user.employeeId.toString();
  employeeController.getById(req, res, next);
});
router.get('/:id', authorize('Admin', 'HR Manager', 'HR Payroll User', 'HR Payroll Manager', 'Employee'), verifyEmployeeOwnership('id'), (req, res, next) => employeeController.getById(req, res, next));
router.put('/:id', authorize('Admin', 'HR Manager'), (req, res, next) => employeeController.update(req, res, next));
router.patch('/:id', authorize('Admin', 'HR Manager'), (req, res, next) => employeeController.update(req, res, next));
router.delete('/:id', authorize('Admin', 'HR Manager'), (req, res, next) => employeeController.delete(req, res, next));

export default router;
