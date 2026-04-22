const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaPg } = require('@prisma/adapter-pg');

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

exports.register = async (req, res) => {
  const { name, email, password } = req.body;

    if (!name || !email || !password) {
    return res.status(400).json({ message: 'All fields required' });
  }

  if (!email.includes('@')) {
    return res.status(400).json({ message: 'Invalid email format' });
  }

  if (password.length < 6 || password.length > 12) {
    return res.status(400).json({ message: 'Password must be 6-12 characters' });
  }

  if (!/\d/.test(password)) {
    return res.status(400).json({ message: 'Password must contain a number' });
  }

  try {
    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { name, email, password: hashed }
    });
    res.status(201).json({ message: 'User created', userId: user.id });
  } catch (err) {
    res.status(400).json({ message: 'Email already in use' });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: 'Wrong password' });

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.logout = (req, res) => {
  res.json({ message: 'Logged out successfully' });
};

exports.editProfile = async (req, res) => {
  const { name, email } = req.body;
  try {
    const user = await prisma.user.update({
      where: { id: parseInt(req.params.id) },
      data: { name, email }
    });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Could not update profile' });
  }
};

exports.deleteAccount = async (req, res) => {
  try {
    await prisma.user.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ message: 'Account deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Could not delete account' });
  }
};

exports.getUserTasks = async (req, res) => {
  try {
    const tasks = await prisma.task.findMany({
      where: { userId: parseInt(req.params.id) }
    });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: 'Could not fetch tasks' });
  }
};

exports.resetPassword = async (req, res) => {
  console.log("RESET PASSWORD HIT");

  const { email, newPassword, confirmPassword } = req.body;

  if (!email || !newPassword || !confirmPassword) {
    return res.status(400).json({ message: 'All fields required' });
  }

  if (newPassword !== confirmPassword) {
    return res.status(400).json({ message: 'Passwords do not match' });
  }

  return res.json({ message: 'Password reset successful' });
};