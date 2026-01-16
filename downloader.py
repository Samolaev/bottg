import requests

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

    return None, "Failed to download video"