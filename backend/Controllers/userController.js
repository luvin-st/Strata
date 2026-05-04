const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaPg } = require('@prisma/adapter-pg');

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const nodemailer = require('nodemailer');
const crypto = require('crypto');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const { uploadToCloudinary } = require('../middleware/upload');

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
    res.json({
      token,
      user: {
        id:    user.id,
        name:  user.name,
        email: user.email,
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { id: true, name: true, email: true, createdAt: true }
    });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Could not fetch user' });
  }
};

exports.logout = (req, res) => {
  res.json({ message: 'Logged out successfully' });
};

exports.editProfile = async (req, res) => {
  const { name, email } = req.body;
  if (!name && !email) return res.status(400).json({ message: 'Nothing to update' });
  try {
    if (email) {
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing && existing.id !== parseInt(req.params.id)) {
        return res.status(400).json({ message: 'Email already in use' });
      }
    }
    const user = await prisma.user.update({
      where: { id: parseInt(req.params.id) },
      data: {
        ...(name  && { name }),
        ...(email && { email }),
      },
      select: { id: true, name: true, email: true, profilePicture: true }
    });
    res.json(user);
  } catch (err) {
    console.error('editProfile error:', err);
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

exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ message: 'No account with that email' });

    const token  = crypto.randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + 3600000); // 1 hour

    await prisma.user.update({
      where: { email },
      data: { resetToken: token, resetTokenExpiry: expiry },
    });

    const resetLink = `http://localhost:5500/reset-password.html?token=${token}`;

    await transporter.sendMail({
      from:    process.env.EMAIL_USER,
      to:      email,
      subject: 'Strata — Password Reset',
      html: `
        <h2>Reset your Strata password</h2>
        <p>Click the link below to reset your password. This link expires in 1 hour.</p>
        <a href="${resetLink}">Reset Password</a>
        <p>If you didn't request this, ignore this email.</p>
      `,
    });

    res.json({ message: 'Reset email sent' });
  } catch (err) {
    console.error('forgotPassword error:', err);
    res.status(500).json({ message: 'Could not send reset email' });
  }
};

exports.resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;
  try {
    const user = await prisma.user.findFirst({
      where: {
        resetToken:       token,
        resetTokenExpiry: { gt: new Date() },
      },
    });

    if (!user) return res.status(400).json({ message: 'Invalid or expired token' });

    const hashed = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password:         hashed,
        resetToken:       null,
        resetTokenExpiry: null,
      },
    });

    res.json({ message: 'Password reset successfully' });
  } catch (err) {
    console.error('resetPassword error:', err);
    res.status(500).json({ message: 'Could not reset password' });
  }
};

exports.changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Current and new password are required' });
  }
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId }
    });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const match = await bcrypt.compare(currentPassword, user.password);
    if (!match) return res.status(401).json({ message: 'Current password is incorrect' });

    if (currentPassword === newPassword) {
      return res.status(400).json({ message: 'New password must be different from current password' });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: req.user.userId },
      data:  { password: hashed }
    });

    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    console.error('changePassword error:', err);
    res.status(500).json({ message: 'Could not change password' });
  }
};

exports.saveSettings = async (req, res) => {
  const { defaultCategory, defaultPriority } = req.body;
  try {
    const user = await prisma.user.update({
      where: { id: parseInt(req.params.id) },
      data: {
        ...(defaultCategory !== undefined && { defaultCategory }),
        ...(defaultPriority !== undefined && { defaultPriority }),
      },
      select: { id: true, name: true, email: true, defaultCategory: true, defaultPriority: true }
    });
    res.json(user);
  } catch (err) {
    console.error('saveSettings error:', err);
    res.status(500).json({ message: 'Could not save settings' });
  }
};

exports.updateProfilePicture = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const result = await uploadToCloudinary(req.file.buffer);

    const user = await prisma.user.update({
      where: { id: req.user.userId },
      data:  { profilePicture: result.secure_url },
      select: { id: true, name: true, email: true, profilePicture: true }
    });

    res.json(user);
  } catch (err) {
    console.error('updateProfilePicture error:', err);
    res.status(500).json({ message: 'Could not upload profile picture' });
  }
};