const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const auth = require('../middleware/auth');

router.post('/', auth, taskController.createTask);
router.get('/', auth, taskController.getAllTasks);
router.put('/:id', auth, taskController.editTask);
router.delete('/:id', auth, taskController.deleteTask);
router.patch('/:id/complete', auth, taskController.markComplete);
router.patch('/:id/priority', auth, taskController.setPriority);
router.patch('/:id/due', auth, taskController.setDueDate);

module.exports = router;