import { Router } from 'express';
import { authController } from './auth.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();

router.post('/login', (req, res, next) => authController.login(req, res, next));
router.post('/reset-password', (req, res, next) => authController.resetPassword(req, res, next));
router.get('/me', authenticate, (req, res, next) => authController.me(req, res, next));
router.patch('/change-password', authenticate, (req, res, next) => authController.changePassword(req, res, next));
router.post('/change-password', authenticate, (req, res, next) => authController.changePassword(req, res, next));

export default router;
