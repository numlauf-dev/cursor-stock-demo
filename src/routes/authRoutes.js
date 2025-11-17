import express from 'express';
import * as authController from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import { registerValidator, loginValidator } from '../validators/authValidators.js';
import { handleValidationErrors } from '../middleware/validation.js';

const router = express.Router();

router.post('/register', authLimiter, registerValidator, handleValidationErrors, authController.register);
router.post('/login', authLimiter, loginValidator, handleValidationErrors, authController.login);
router.get('/me', authenticate, authController.getMe);

export default router;
