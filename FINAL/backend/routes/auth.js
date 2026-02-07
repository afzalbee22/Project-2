import express from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User.js';
import { redisClient, rabbitChannel } from '../config/db.js';
import { sendResetEmail } from '../utils/email.js';

const router = express.Router();

const logToRabbitMQ = (action, data) => {
  if (rabbitChannel) {
    rabbitChannel.sendToQueue('auth_logs', Buffer.from(JSON.stringify({ action, data, timestamp: new Date() })));
  }
};

router.post('/signup', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const passwordRegex = /^(?=.*[\d@$!%*#?&]).{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        error: 'Password must be at least 8 characters long and contain at least one number or special character'
      });
    }

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const user = new User({ username, email, password });
    await user.save();

    logToRabbitMQ('signup', { userId: user._id, username, email });

    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/signin', async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '24h' });

    if (redisClient) {
      await redisClient.setEx(`session:${user._id}`, 86400, token);
    }

    logToRabbitMQ('signin', { userId: user._id, username });

    res.json({ token, username: user.username, email: user.email });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetTokenExpiry = Date.now() + 3600000;
    await user.save();

    await sendResetEmail(email, resetToken);

    logToRabbitMQ('forgot_password', { userId: user._id, email });

    res.json({ message: 'Reset email sent' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
      resetToken: hashedToken,
      resetTokenExpiry: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired token' });
    }

    user.password = newPassword;
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;
    await user.save();

    logToRabbitMQ('reset_password', { userId: user._id });

    res.json({ message: 'Password reset successful' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
