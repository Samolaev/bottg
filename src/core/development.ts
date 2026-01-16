import { Context, Telegraf } from 'telegraf';
import { Update } from 'telegraf/typings/core/types/typegram';
import createDebug from 'debug';

const debug = createDebug('bot:dev');

const development = async (bot: Telegraf<Context<Update>>) => {
  try {
    const botInfo = (await bot.telegram.getMe()).username;

    debug('Bot runs in development mode');
    debug(`${botInfo} deleting webhook`);
    await bot.telegram.deleteWebhook();
    debug(`${botInfo} starting polling`);

    await bot.launch();

    process.once('SIGINT', () => bot.stop('SIGINT'));
    process.once('SIGTERM', () => bot.stop('SIGTERM'));
  } catch (error) {
    console.error('Development mode error:', error);
    console.error('Make sure BOT_TOKEN is set in your environment variables.');
  }
};

export { development };
