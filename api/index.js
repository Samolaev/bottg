// api/index.js
import { Telegraf } from 'telegraf';

// Создаём бота один раз
const bot = new Telegraf(process.env.TELEGRAM_TOKEN);

bot.on('text', async (ctx) => {
  const text = ctx.message.text;
  const message = `✅ Thanks for your message: *"${text}"*\nHave a great day! 👋🏻`;
  await ctx.replyWithMarkdown(message);
});

bot.catch((err) => {
  console.error('⚠️ Bot error:', err);
});

export default async function handler(request) {
  // Логируем токен (уже видим, что он есть)
  console.log('🔍 TELEGRAM_TOKEN length:', process.env.TELEGRAM_TOKEN?.length || 'MISSING');

  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    const update = await request.json();

    // 🚀 Обрабатываем сообщение в фоне
    // Используем setImmediate вместо setTimeout для немедленного запуска
    setImmediate(() => {
      bot.handleUpdate(update).catch(console.error);
    });

    // ✅ Возвращаем ответ СРАЗУ — это предотвращает таймаут
    return new Response('OK', { status: 200 });
  } catch (error) {
    console.error('Handler error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}