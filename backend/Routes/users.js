const express = require('express');
const router = express.Router();
const userController = require('../Controllers/userController');
const auth = require('../middleware/auth');
const { upload } = require('../middleware/upload');

router.post('/register', userController.register);
router.post('/login', userController.login);
router.get('/me', auth, userController.getMe);
router.post('/logout', auth, userController.logout);
router.put('/:id', auth, userController.editProfile);
router.delete('/:id', auth, userController.deleteAccount);
router.get('/:id/tasks', auth, userController.getUserTasks);
router.post('/forgot-password', userController.forgotPassword);
router.post('/reset-password',  userController.resetPassword);
router.patch('/change-password', auth, userController.changePassword);
router.put('/:id/settings', auth, userController.saveSettings);
router.patch('/profile-picture', auth, upload.single('image'), userController.updateProfilePicture);

module.exports = router;