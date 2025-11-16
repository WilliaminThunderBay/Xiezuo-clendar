const express = require('express');
const axios = require('axios');
const { v4: uuid } = require('uuid');
const bcrypt = require('bcryptjs');
const config = require('../config');
const { readDb, writeDb } = require('../db');
const { createToken, sanitizeUser } = require('../utils/auth');

const router = express.Router();

router.post('/token', async (req, res) => {
  const { code } = req.body;
  if (!code) {
    return res.status(400).json({ message: '缺少 code 参数' });
  }

  if (!config.wechatAppId || !config.wechatAppSecret) {
    return res.json({
      access_token: 'mock_access_token',
      openid: `mock_openid_${Date.now()}`,
      expires_in: 7200
    });
  }

  try {
    const response = await axios.get('https://api.weixin.qq.com/sns/oauth2/access_token', {
      params: {
        appid: config.wechatAppId,
        secret: config.wechatAppSecret,
        code,
        grant_type: 'authorization_code'
      }
    });

    res.json(response.data);
  } catch (error) {
    console.error('获取微信 token 失败:', error.response?.data || error.message);
    res.status(500).json({ message: '获取微信 token 失败', detail: error.response?.data || error.message });
  }
});

router.post('/userinfo', async (req, res) => {
  const { access_token, openid } = req.body;
  if (!access_token || !openid) {
    return res.status(400).json({ message: '缺少 access_token 或 openid' });
  }

  let profile;
  if (!config.wechatAppId || !config.wechatAppSecret) {
    profile = {
      openid,
      nickname: `微信用户${openid.slice(-4)}`,
      headimgurl: '',
      unionid: '',
      city: '上海'
    };
  } else {
    try {
      const response = await axios.get('https://api.weixin.qq.com/sns/userinfo', {
        params: { access_token, openid, lang: 'zh_CN' }
      });
      profile = response.data;
    } catch (error) {
      console.error('获取微信用户信息失败:', error.response?.data || error.message);
      return res.status(500).json({ message: '获取微信用户信息失败', detail: error.response?.data || error.message });
    }
  }

  const data = readDb();
  let user = data.users.find(u => u.wechatOpenId === profile.openid);
  if (!user) {
    user = {
      id: uuid(),
      username: profile.nickname || `wechat_${profile.openid.slice(-4)}`,
      email: `wechat_${profile.openid}@example.com`,
      passwordHash: bcrypt.hashSync(uuid(), 10),
      role: 'user',
      avatar: profile.headimgurl || '',
      createdAt: new Date().toISOString(),
      loginType: 'wechat',
      wechatOpenId: profile.openid
    };
    data.users.push(user);
  } else {
    user.avatar = profile.headimgurl || user.avatar;
    user.username = profile.nickname || user.username;
  }

  writeDb(data);

  const token = createToken(user);
  res.json({
    token,
    user: sanitizeUser(user),
    profile
  });
});

module.exports = router;

