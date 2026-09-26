const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');
const { authMiddleware } = require('../middleware/authMiddleware');

router.post('/register', AuthController.register);
router.post('/verify-email-otp', AuthController.verifyEmailOTP);
router.post('/resend-email-otp', AuthController.resendEmailOTP);
router.post('/login', AuthController.login);
router.post('/logout', AuthController.logout);
router.get('/me', authMiddleware, AuthController.getMe);
router.post('/forgot-password', AuthController.forgotPassword);
router.post('/verify-reset-otp', AuthController.verifyResetOTP);
router.post('/reset-password', AuthController.resetPassword);

module.exports = router;
