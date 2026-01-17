import axios from 'axios';
import { Context } from 'telegraf';
import createDebug from 'debug';

const debug = createDebug('bot:videoDownloader');

// Типы для результатов скачивания
export interface VideoDownloadResult {
  success: boolean;
  url?: string;
  filename?: string;
  error?: string;
  platform?: string | null;
}

// Функция определения платформы по URL
export function detectPlatform(url: string): string | null {
  const lowerUrl = url.toLowerCase();

  if (lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be')) {
    return 'youtube';
  } else if (lowerUrl.includes('instagram.com') || lowerUrl.includes('instagr.am')) {
    return 'instagram';
  } else if (lowerUrl.includes('tiktok.com') || lowerUrl.includes('vm.tiktok.com')) {
    return 'tiktok';
  }

  return null;
}

// Функция для скачивания видео с YouTube через y2mate.com
export async function downloadFromYouTube(url: string): Promise<VideoDownloadResult> {
  try {
    debug(`Attempting to download YouTube video: ${url}`);

    // Получаем ID видео из URL
    const videoId = extractYouTubeId(url);
    if (!videoId) {
      return { success: false, error: 'Invalid YouTube URL' };
    }

    // Используем простой API для получения прямой ссылки
    const apiUrl = `https://api.y2mate.com/v2/analyze?url=https://www.youtube.com/watch?v=${videoId}`;

    const response = await axios.get(apiUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json'
      },
      timeout: 10000
    });

    if (response.data && response.data.vid) {
      // Получаем ссылку на скачивание
      const convertUrl = `https://api.y2mate.com/v2/convert?url=https://www.youtube.com/watch?v=${videoId}&vid=${response.data.vid}&k=mp4`;

      const convertResponse = await axios.get(convertUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json'
        },
        timeout: 15000
      });

      if (convertResponse.data && convertResponse.data.dlink) {
        return {
          success: true,
          url: convertResponse.data.dlink,
          platform: 'youtube',
          filename: `youtube_${videoId}.mp4`
        };
      }
    }

    return { success: false, error: 'Could not get download link from y2mate' };
  } catch (error: any) {
    debug(`YouTube download failed: ${error.message}`);
    return { success: false, error: `YouTube download failed: ${error.message}` };
  }
}

// Функция для скачивания видео с TikTok через ssstik.io
export async function downloadFromTikTok(url: string): Promise<VideoDownloadResult> {
  try {
    debug(`Attempting to download TikTok video: ${url}`);

    // Используем API ssstik.io
    const apiUrl = `https://ssstik.io/api/ssstik?url=${encodeURIComponent(url)}`;

    const response = await axios.get(apiUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
        'Referer': 'https://ssstik.io/'
      },
      timeout: 15000
    });

    if (response.data && response.data.video_url) {
      return {
        success: true,
        url: response.data.video_url,
        platform: 'tiktok',
        filename: 'tiktok_video.mp4'
      };
    }

    return { success: false, error: 'Could not get video URL from ssstik' };
  } catch (error: any) {
    debug(`TikTok download failed: ${error.message}`);
    return { success: false, error: `TikTok download failed: ${error.message}` };
  }
}

// Функция для скачивания видео с Instagram
export async function downloadFromInstagram(url: string): Promise<VideoDownloadResult> {
  try {
    debug(`Attempting to download Instagram video: ${url}`);

    // Используем простой API для Instagram
    const apiUrl = `https://instagram-downloader-api.vercel.app/api/download?url=${encodeURIComponent(url)}`;

    const response = await axios.get(apiUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json'
      },
      timeout: 15000
    });

    if (response.data && response.data.video_url) {
      return {
        success: true,
        url: response.data.video_url,
        platform: 'instagram',
        filename: 'instagram_video.mp4'
      };
    }

    return { success: false, error: 'Could not get video URL from Instagram API' };
  } catch (error: any) {
    debug(`Instagram download failed: ${error.message}`);
    return { success: false, error: `Instagram download failed: ${error.message}` };
  }
}

// Вспомогательная функция для извлечения YouTube ID
function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
    /youtube\.com\/embed\/([^&\n?#]+)/,
    /youtube\.com\/v\/([^&\n?#]+)/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

// Основная функция загрузки видео
export async function downloadVideo(url: string): Promise<VideoDownloadResult> {
  const platform = detectPlatform(url);

  debug(`Detected platform: ${platform} for URL: ${url}`);

  if (!platform) {
    return {
      success: false,
      error: 'Unsupported platform. Currently supported: YouTube, Instagram, TikTok.'
    };
  }

  // Выбираем метод в зависимости от платформы
  let downloadFunction: (url: string) => Promise<VideoDownloadResult>;

  switch (platform) {
    case 'youtube':
      downloadFunction = downloadFromYouTube;
      break;
    case 'instagram':
      downloadFunction = downloadFromInstagram;
      break;
    case 'tiktok':
      downloadFunction = downloadFromTikTok;
      break;
    default:
      return { success: false, error: 'Unsupported platform' };
  }

  try {
    debug(`Starting download for ${platform} video`);

    // Устанавливаем таймаут для загрузки
    const timeoutPromise = new Promise<VideoDownloadResult>((_, reject) => {
      setTimeout(() => reject(new Error('Download timeout')), 30000); // 30 секунд
    });

    const downloadPromise = downloadFunction(url);

    const result = await Promise.race([downloadPromise, timeoutPromise]);

    if (result.success) {
      debug(`Successfully downloaded ${platform} video`);
      return result;
    } else {
      debug(`Download failed: ${result.error}`);
      return result;
    }
  } catch (error: any) {
    debug(`Download error: ${error.message}`);
    return { success: false, error: `Download failed: ${error.message}` };
  }
}

// Функция отправки видео пользователю
export async function sendVideoToUser(ctx: Context, videoResult: VideoDownloadResult) {
  if (!videoResult.success || !videoResult.url) {
    const errorMessage = videoResult.error || 'Неизвестная ошибка при загрузке видео';
    await ctx.reply(`❌ Ошибка при загрузке видео: ${errorMessage}`);
    return;
  }

  try {
    await ctx.reply('📥 Видео готово! Отправляю...');

    // Проверяем размер файла перед отправкой
    try {
      const headResponse = await axios.head(videoResult.url, { timeout: 5000 });
      const contentLength = headResponse.headers['content-length'];

      if (contentLength) {
        const fileSizeInMB = parseInt(contentLength) / (1024 * 1024);

        if (fileSizeInMB > 50) {
          await ctx.reply(`⚠️ Видео слишком большое для отправки в Telegram (${fileSizeInMB.toFixed(2)} MB). Вы можете скачать его по ссылке: ${videoResult.url}`);
          return;
        }
      }
    } catch (headError) {
      debug(`Could not determine file size: ${headError}`);
      // Продолжаем отправку даже если не удалось проверить размер
    }

    await ctx.replyWithVideo({
      url: videoResult.url
    }, {
      caption: `📹 Видео с ${videoResult.platform || 'неизвестной платформы'}`
    });
  } catch (error: any) {
    debug(`Failed to send video to user: ${error.message}`);
    await ctx.reply(`⚠️ Не удалось отправить видео напрямую, но вы можете скачать его по ссылке: ${videoResult.url}`);
  }
}