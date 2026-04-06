const express = require('express');
const router = express.Router();
const habitController = require('../controllers/habitController');
const auth = require('../middleware/auth');

// Create a new habit
router.post('/', auth, habitController.createHabit);

// Mark habit as complete
router.patch('/:id/complete', auth, habitController.markHabitComplete);

module.exports = router;