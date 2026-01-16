// api/index.js
import { Telegraf } from 'telegraf';

const token = process.env.TELEGRAM_TOKEN;
if (!token) {
  throw new Error('❌ TELEGRAM_TOKEN is missing in environment variables!');
}

const bot = new Telegraf(token);

bot.on('text', async (ctx) => {
  const text = ctx.message.text;
  const message = `✅ Thanks for your message: *"${text}"*\nHave a great day! 👋🏻`;
  await ctx.replyWithMarkdown(message);
});

bot.catch((err) => {
  console.error('⚠️ Bot error:', err);
});

// Экспорт в формате Vercel (ESM)
export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    // ✅ Vercel автоматически парсит тело, если использовать request.json()
    const update = await request.json();

    // Передаём в Telegraf
    await bot.handleUpdate(update, response);
  } catch (error) {
    console.error('Handler error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}