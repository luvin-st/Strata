const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

exports.createTask = async (req, res) => {
  const { title, description, priority, dueDate, category } = req.body;
  try {
    const task = await prisma.task.create({
      data: {
        title,
        description,
        priority,
        dueDate: dueDate ? new Date(dueDate) : null,
        category: category || 'Work',
        userId: req.user.userId
      }
    });
    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ message: 'Could not create task' });
  }
};

exports.getAllTasks = async (req, res) => {
  try {
    const tasks = await prisma.task.findMany({ where: { userId: req.user.userId } });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: 'Could not fetch tasks' });
  }
};

exports.editTask = async (req, res) => {
  const { title, description } = req.body;
  try {
    const task = await prisma.task.update({
      where: { id: parseInt(req.params.id) },
      data: { title, description }
    });
    res.json(task);
  } catch (err) {
    res.status(500).json({ message: 'Could not update task' });
  }
};

exports.deleteTask = async (req, res) => {
  try {
    await prisma.task.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Could not delete task' });
  }
};

exports.markComplete = async (req, res) => {
  try {
    const task = await prisma.task.update({
      where: { id: parseInt(req.params.id) },
      data: { completed: true }
    });
    res.json(task);
  } catch (err) {
    res.status(500).json({ message: 'Could not mark task complete' });
  }
};

exports.setPriority = async (req, res) => {
  const { priority } = req.body;
  try {
    const task = await prisma.task.update({
      where: { id: parseInt(req.params.id) },
      data: { priority }
    });
    res.json(task);
  } catch (err) {
    res.status(500).json({ message: 'Could not set priority' });
  }
};

exports.setDueDate = async (req, res) => {
  const { dueDate } = req.body;
  try {
    const task = await prisma.task.update({
      where: { id: parseInt(req.params.id) },
      data: { dueDate: new Date(dueDate) }
    });
    res.json(task);
  } catch (err) {
    res.status(500).json({ message: 'Could not set due date' });
  }
};