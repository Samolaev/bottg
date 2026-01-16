// api/index.js
const { Telegraf } = require('telegraf');

// Проверка токена
const token = process.env.TELEGRAM_TOKEN;
if (!token) {
  console.error('❌ TELEGRAM_TOKEN is missing in environment variables!');
  throw new Error('TELEGRAM_TOKEN is required');
}

// Создаём бота
const bot = new Telegraf(token);

// Обрабатываем текстовые сообщения
bot.on('text', async (ctx) => {
  const text = ctx.message.text;
  const message = `✅ Thanks for your message: *"${text}"*\nHave a great day! 👋🏻`;
  await ctx.replyWithMarkdown(message);
});

// Обработка ошибок (логирование)
bot.catch((err, ctx) => {
  console.error(`⚠️ Error while processing update ${ctx.update.update_id}:`, err);
});

// Экспортируем обработчик для Vercel
module.exports = async (req, res) => {
  try {
    // Передаём запрос в Telegraf
    await bot.handleUpdate(req.body, res);
  } catch (error) {
    console.error('Bot error:', error);
    res.status(500).send('Internal Server Error');
  }
};