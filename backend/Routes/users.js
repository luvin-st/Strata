const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');

router.post('/register', userController.register);
router.post('/login', userController.login);
router.post('/logout', auth, userController.logout);
router.put('/:id', auth, userController.editProfile);
router.delete('/:id', auth, userController.deleteAccount);
router.get('/:id/tasks', auth, userController.getUserTasks);
router.patch('/reset-password', userController.resetPassword);

module.exports = router;