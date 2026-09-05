import { Router } from 'express';
import { contractController } from './contract.controller';
import { authenticate, authorize } from '../../middleware/auth';

const router = Router();

router.use(authenticate);

router.post('/', authorize('Admin', 'HR Manager'), (req, res, next) => contractController.create(req, res, next));
router.get('/', authorize('Admin', 'HR Manager', 'HR Payroll User', 'HR Payroll Manager'), (req, res, next) => contractController.getAll(req, res, next));
router.get('/applicable', authorize('Admin', 'HR Manager', 'HR Payroll User', 'HR Payroll Manager'), (req, res, next) => contractController.getApplicable(req, res, next));
router.get('/:id', authorize('Admin', 'HR Manager', 'HR Payroll User', 'HR Payroll Manager'), (req, res, next) => contractController.getById(req, res, next));
router.put('/:id', authorize('Admin', 'HR Manager'), (req, res, next) => contractController.update(req, res, next));
router.patch('/:id', authorize('Admin', 'HR Manager'), (req, res, next) => contractController.update(req, res, next));
router.delete('/:id', authorize('Admin', 'HR Manager'), (req, res, next) => contractController.delete(req, res, next));

export default router;
