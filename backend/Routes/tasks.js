const express = require('express');
const router = express.Router();
const taskController = require('../Controllers/taskController');
const auth = require('../middleware/auth');

router.post('/', auth, taskController.createTask);
router.get('/', auth, taskController.getAllTasks);
router.get('/sorted', auth, taskController.getTasksSorted);
router.put('/:id', auth, taskController.editTask);
router.delete('/:id', auth, taskController.deleteTask);
router.patch('/:id/complete', auth, taskController.markComplete);
router.patch('/:id/uncomplete', auth, taskController.unmarkComplete);
router.patch('/:id/priority', auth, taskController.setPriority);
router.patch('/:id/due', auth, taskController.setDueDate);
router.patch('/:id/category', auth, taskController.setCategory);

module.exports = router;