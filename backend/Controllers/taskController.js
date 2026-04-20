const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

//creates new task in database
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

//fetches all tasks for a user from database
exports.getAllTasks = async (req, res) => {
  try {
    const tasks = await prisma.task.findMany({ where: { userId: req.user.userId } });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: 'Could not fetch tasks' });
  }
};

//fetches all tasks for a user from database, sorted by a criterion (,title, priority, due date, or category)
exports.getTasksSorted = async (req, res) => {
  const { sortBy } = req.query;
  try {
    const tasks = await prisma.task.findMany({
      where: { userId: req.user.userId },
      orderBy: { [sortBy]: 'asc' }
    });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: 'Could not fetch tasks' });
  }
};

//edits task in database: title and description can be changed, but not completed status, priority, due date, or category
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

//deletes task from database
exports.deleteTask = async (req, res) => {
  try {
    await prisma.task.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Could not delete task' });
  }
};

//changes completed status of task to true
exports.markComplete = async (req, res) => {
  try {
    const task = await prisma.task.update({
      where: { id: parseInt(req.params.id) },
      data: { completed: true }
    });
    res.json(task);
  } catch (err) {
    res.status(500).json({ message: 'Could not mark task as complete' });
  }
};

//changes completed status of task to false
exports.unmarkComplete = async (req, res) => {
  try {
    const task = await prisma.task.update({
      where: { id: parseInt(req.params.id) },
      data: { completed: false }
    });
    res.json(task);
  } catch (err) {
    res.status(500).json({ message: 'Could not mark task as incomplete' });
  }
};

//changes priority level of task
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

//changes due date of task
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

//changes category of task
exports.setCategory = async (req, res) => {
  const { category } = req.body;
  try {
    const task = await prisma.task.update({
      where: { id: parseInt(req.params.id) },
      data: { category }
    });
    res.json(task);
  } catch (err) {
    res.status(500).json({ message: 'Could not set category' });
  }
};

