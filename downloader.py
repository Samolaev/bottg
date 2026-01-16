import requests
import yt_dlp

def download_video(url):
    # Попытка через Cobalt
    try:
        response = requests.post('https://api.cobalt.tools/api/json', json={'url': url})
        data = response.json()
        if data.get('status') == 'success':
            download_url = data['url']
            # Скачиваем видео
            video_response = requests.get(download_url)
            if video_response.status_code == 200:
                return video_response.content, None
    except:
        pass

    # Если Cobalt не сработал, yt-dlp
    try:
        ydl_opts = {
            'format': 'best[height<=720]',  # Короткие видео, ограничиваем качество
        }
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
            if 'formats' in info:
                format = info['formats'][-1]  # Лучший формат
                video_url = format['url']
                video_response = requests.get(video_url)
                if video_response.status_code == 200:
                    return video_response.content, None
    except:
        pass

    return None, "Failed to download video"