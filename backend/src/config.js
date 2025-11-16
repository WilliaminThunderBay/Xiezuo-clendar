require('dotenv').config();

const config = {
  port: process.env.PORT || 3000,
  jwtSecret: process.env.JWT_SECRET || 'xiezuo-calendar-secret',
  tokenExpiresIn: process.env.JWT_EXPIRES_IN || '12h',
  deepSeekApiKey: process.env.DEEPSEEK_API_KEY || '',
  deepSeekApiUrl: process.env.DEEPSEEK_API_URL || 'https://api.deepseek.com/v1/chat/completions',
  wechatAppId: process.env.WECHAT_APP_ID || '',
  wechatAppSecret: process.env.WECHAT_APP_SECRET || '',
  whatsappAccessToken: process.env.WHATSAPP_ACCESS_TOKEN || '',
  whatsappTemplateName: process.env.WHATSAPP_TEMPLATE || 'authentication',
  uploadDir: process.env.UPLOAD_DIR || 'uploads'
};

module.exports = config;

