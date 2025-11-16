const express = require('express');
const axios = require('axios');
const { readDb } = require('../db');
const config = require('../config');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

router.post('/chat', async (req, res) => {
  const { messages = [], prompt = '', mode = 'chat', deepThink = false, temperature = 0.7 } = req.body;
  const data = readDb();

  const taskStats = `当前共有 ${data.tasks.length} 个有效工单，员工：${(data.staff || []).map(s => s.name).join('、') || '暂无'}。`;
  let systemPrompt = `你是一个专业的工程安装管理AI助手，需要结合实时工单和人员信息给出建议。${taskStats}`;

  if (mode === 'schedule') {
    systemPrompt += `
当用户请求创建工单时，请输出 JSON 对象：
{
  "action": "create_schedule",
  "data": {
    "number": "工单号",
    "plate": "车牌号",
    "staff": "安装人员",
    "date": "YYYY-MM-DD",
    "time": "HH:MM-HH:MM",
    "location": "地点",
    "service": "服务类型",
    "note": "备注(可选)",
    "color": "red/blue/orange/green/white"
  }
}
并在 JSON 之前附上你的自然语言建议。`;
  }

  const finalMessages = [
    { role: 'system', content: systemPrompt },
    ...messages
  ];

  if (!messages.length && prompt) {
    finalMessages.push({ role: 'user', content: prompt });
  }

  if (!config.deepSeekApiKey) {
    return res.json({
      mock: true,
      choices: [
        {
          message: {
            role: 'assistant',
            content: `（演示模式）基于 ${data.tasks.length} 条工单数据，建议先处理紧急任务，并优先安排 ${data.staff?.[0]?.name || '李明'} 前往市区单子。`
          }
        }
      ]
    });
  }

  try {
    const response = await axios.post(
      config.deepSeekApiUrl,
      {
        model: deepThink ? 'deepseek-reasoner' : 'deepseek-chat',
        messages: finalMessages,
        temperature,
        max_tokens: 2000,
        stream: false
      },
      {
        headers: {
          Authorization: `Bearer ${config.deepSeekApiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error('调用 DeepSeek 失败:', error.response?.data || error.message);
    res.status(500).json({
      message: '调用 DeepSeek 失败',
      detail: error.response?.data || error.message
    });
  }
});

module.exports = router;

