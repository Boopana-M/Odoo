import { Router } from 'express';
import { employeeController } from './employee.controller';

const router = Router();

router.post('/', (req, res, next) => employeeController.create(req, res, next));
router.get('/', (req, res, next) => employeeController.getAll(req, res, next));
router.get('/:id', (req, res, next) => employeeController.getById(req, res, next));
router.put('/:id', (req, res, next) => employeeController.update(req, res, next));
router.patch('/:id', (req, res, next) => employeeController.update(req, res, next));
router.delete('/:id', (req, res, next) => employeeController.delete(req, res, next));

export default router;
