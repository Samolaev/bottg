// scripts/set-webhook.mjs
const TOKEN = process.env.BOT_TOKEN;
// 👇 ЯВНО УКАЗЫВАЕМ ОСНОВНОЙ ДОМЕН
const PRODUCTION_URL = "bottg-peach.vercel.app";
const WEBHOOK_URL = `https://${PRODUCTION_URL}/api/`;

if (!TOKEN) {
  console.warn('⚠️ BOT_TOKEN не задан — пропускаем установку вебхука');
  process.exit(0);
}

// 👇 Устанавливаем вебхук ТОЛЬКО для production-деплоев
if (process.env.VERCEL_ENV !== 'production') {
  console.log('⏭️ Пропускаем установку вебхука (не production)');
  process.exit(0);
}

async function setWebhook() {
  try {
    const url = `https://api.telegram.org/bot${TOKEN}/setWebhook`;
    const body = new URLSearchParams({
      url: WEBHOOK_URL,
      drop_pending_updates: 'true'
    });

    const res = await fetch(url, {
      method: 'POST',
      body,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    const data = await res.json();
    if (data.ok) {
      console.log(`✅ Вебхук успешно установлен на: ${WEBHOOK_URL}`);
    } else {
      console.error(`❌ Ошибка Telegram: ${data.description}`);
    }
  } catch (e) {
    console.error(`💥 Ошибка при установке вебхука: ${e.message}`);
  }
}

setWebhook();