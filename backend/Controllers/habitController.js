// Name: Ana Rosales
// Habit Controller - Handles habit creation and habit completion with streak implementation

require('dotenv').config();
console.log('DATABASE_URL loaded:', !!process.env.DATABASE_URL);
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// Create Habit
exports.createHabit = async (req, res) => {
  const { name, description, frequency } = req.body;

  if (!name) {
    return res.status(400).json({ message: 'Habit name is required' });
  }

  try {
    const habit = await prisma.habit.create({
      data: {
        name,
        description,
        frequency,
        streak: 0,
        lastCompletedDate: null,
        userId: req.user.userId
      }
    });

    res.status(201).json(habit);
  } catch (err) {
    res.status(500).json({ message: 'Could not create habit' });
  }
};

exports.getHabits = async (req, res) => {
  try {
    const habits = await prisma.habit.findMany({
      where: { userId: req.user.userId }
    });
    res.json(habits);
  } catch (err) {
    console.error('getHabits error:', err);
    res.status(500).json({ message: 'Could not fetch habits', error: err.message });
  }
};

// Mark Habit as Complete
exports.markHabitComplete = async (req, res) => {
  try {
    const habit = await prisma.habit.findUnique({
      where: { id: parseInt(req.params.id) }
    });

    if (!habit) {
      return res.status(404).json({ message: 'Habit not found' });
    }

    const today = new Date();
    const todayStr = today.toDateString();

    const lastDate = habit.lastCompletedDate
      ? new Date(habit.lastCompletedDate)
      : null;

    // Prevent duplicate completion in same day
    if (lastDate && lastDate.toDateString() === todayStr) {
      return res.json({ message: 'Already completed today' });
    }

    let newStreak = 1;

    if (lastDate) {
      const yesterday = new Date();
      yesterday.setDate(today.getDate() - 1);

      if (lastDate.toDateString() === yesterday.toDateString()) {
        newStreak = habit.streak + 1;
      }
    }

    const updatedHabit = await prisma.habit.update({
      where: { id: parseInt(req.params.id) },
      data: {
        streak: newStreak,
        lastCompletedDate: today
      }
    });

    res.json(updatedHabit);
  } catch (err) {
    res.status(500).json({ message: 'Could not update habit' });
  }
};

exports.deleteHabit = async (req, res) => {
  try {
    await prisma.habit.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ message: 'Habit deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Could not delete habit' });
  }
};