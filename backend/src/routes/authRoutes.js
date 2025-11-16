const express = require('express');
const bcrypt = require('bcryptjs');
const { v4: uuid } = require('uuid');
const dayjs = require('dayjs');
const config = require('../config');
const { readDb, writeDb } = require('../db');
const { authenticate } = require('../middleware/auth');
const { createToken, sanitizeUser } = require('../utils/auth');

const router = express.Router();

router.post('/register', async (req, res) => {
  const { username, whatsapp, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: '用户名和密码为必填项' });
  }

  if (password.length < 5) {
    return res.status(400).json({ message: '密码至少需要5位' });
  }

  const data = readDb();
  
  // 检查用户名是否已存在
  const usernameExists = data.users.some(u => u.username === username);
  if (usernameExists) {
    return res.status(409).json({ message: '用户名已被注册' });
  }
  
  // 如果提供了WhatsApp账号，检查是否已存在
  if (whatsapp && whatsapp.trim()) {
    const whatsappExists = data.users.some(u => u.whatsapp === whatsapp);
    if (whatsappExists) {
      return res.status(409).json({ message: 'WhatsApp账号已被注册' });
    }
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const newUser = {
    id: uuid(),
    username,
    whatsapp: whatsapp || '',
    email: `${username}@system.local`, // 兼容旧字段
    passwordHash,
    role: 'user',
    avatar: '',
    createdAt: new Date().toISOString()
  };

  data.users.push(newUser);
  writeDb(data);

  const token = createToken(newUser);
  res.json({ token, user: sanitizeUser(newUser) });
});

router.post('/login', async (req, res) => {
  const { usernameOrEmail, password } = req.body;

  if (!usernameOrEmail || !password) {
    return res.status(400).json({ message: '请输入用户名/WhatsApp账号与密码' });
  }

  if (password.length < 5) {
    return res.status(400).json({ message: '密码至少需要5位' });
  }

  const data = readDb();
  const user = data.users.find(
    u => u.username === usernameOrEmail || u.whatsapp === usernameOrEmail || u.email === usernameOrEmail
  );

  if (!user) {
    return res.status(401).json({ message: '用户名或密码错误' });
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ message: '用户名或密码错误' });
  }

  const token = createToken(user);
  res.json({ token, user: sanitizeUser(user) });
});

router.get('/me', authenticate, (req, res) => {
  const data = readDb();
  const user = data.users.find(u => u.id === req.user.id);
  if (!user) {
    return res.status(404).json({ message: '用户不存在' });
  }
  res.json({ user: sanitizeUser(user) });
});

router.post('/logout', (req, res) => {
  res.json({ message: '已退出' });
});

router.post('/whatsapp/send-otp', (req, res) => {
  const { phone } = req.body;
  if (!phone) {
    return res.status(400).json({ message: '请输入手机号' });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = dayjs().add(10, 'minute').toISOString();
  const data = readDb();

  data.whatsappOtps = data.whatsappOtps.filter(entry => entry.phone !== phone);
  data.whatsappOtps.push({ phone, code: otp, expiresAt, verified: false });
  writeDb(data);

  console.log(`[WhatsApp OTP] ${phone} -> ${otp} (有效期10分钟)`);

  // 在无真实 WhatsApp 能力时返回演示提示
  const isMock = !config.whatsappAccessToken;
  res.json({
    message: isMock ? '已生成演示验证码，请查看服务器日志' : '验证码已发送',
    expiresAt
  });
});

router.post('/whatsapp/verify-otp', (req, res) => {
  const { phone, code } = req.body;
  if (!phone || !code) {
    return res.status(400).json({ message: '请输入验证码和手机号' });
  }

  const data = readDb();
  const otpRecord = data.whatsappOtps.find(entry => entry.phone === phone);

  if (!otpRecord) {
    return res.status(400).json({ message: '请先获取验证码' });
  }

  if (dayjs().isAfter(dayjs(otpRecord.expiresAt))) {
    return res.status(400).json({ message: '验证码已过期，请重新获取' });
  }

  if (otpRecord.code !== code) {
    return res.status(400).json({ message: '验证码错误' });
  }

  otpRecord.verified = true;
  data.whatsappOtps = data.whatsappOtps.filter(entry => entry.phone !== phone);

  let user = data.users.find(u => u.email === `whatsapp_${phone}@example.com`);
  if (!user) {
    user = {
      id: uuid(),
      username: `wa_${phone.slice(-4)}`,
      email: `whatsapp_${phone}@example.com`,
      passwordHash: bcrypt.hashSync(uuid(), 10),
      role: 'user',
      avatar: '',
      createdAt: new Date().toISOString(),
      loginType: 'whatsapp'
    };
    data.users.push(user);
  }

  writeDb(data);

  const token = createToken(user);
  res.json({
    token,
    user: sanitizeUser(user)
  });
});

module.exports = router;
