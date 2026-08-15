import json
import os
from datetime import datetime
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.error import HTTPError, URLError
from urllib.parse import parse_qs, urlparse
from urllib.request import Request, urlopen

ROOT = os.path.dirname(__file__)


def load_env_file(path):
    if not os.path.exists(path):
        return
    with open(path, 'r', encoding='utf-8') as fh:
        for line in fh:
            line = line.strip()
            if not line or line.startswith('#') or '=' not in line:
                continue
            key, value = line.split('=', 1)
            key = key.strip()
            value = value.strip().strip('"').strip("'")
            os.environ.setdefault(key, value)


load_env_file(os.path.join(ROOT, '.env'))

PORT = int(os.environ.get('PORT', '8000'))
API_KEY = os.environ.get('OPENWEATHER_API_KEY', '')
API_BASE = 'https://api.openweathermap.org/data/2.5'

FALLBACK_BY_CITY = {
    'brazzaville': {
        'current': {'temp': 28, 'humidity': 64, 'description': 'partiellement nuageux', 'icon': '02d'},
        'forecast': [
            {'day': "Aujourd'hui", 'temp': 29, 'icon': '02d'},
            {'day': 'Demain', 'temp': 30, 'icon': '03d'},
            {'day': 'Mercredi', 'temp': 27, 'icon': '10d'},
            {'day': 'Jeudi', 'temp': 26, 'icon': '09d'},
            {'day': 'Vendredi', 'temp': 31, 'icon': '01d'}
        ]
    },
    'paris': {
        'current': {'temp': 18, 'humidity': 58, 'description': 'nuageux', 'icon': '03d'},
        'forecast': [
            {'day': "Aujourd'hui", 'temp': 19, 'icon': '03d'},
            {'day': 'Demain', 'temp': 17, 'icon': '02d'},
            {'day': 'Mercredi', 'temp': 16, 'icon': '10d'},
            {'day': 'Jeudi', 'temp': 15, 'icon': '09d'},
            {'day': 'Vendredi', 'temp': 20, 'icon': '01d'}
        ]
    },
    'london': {
        'current': {'temp': 14, 'humidity': 71, 'description': 'pluvieux', 'icon': '10d'},
        'forecast': [
            {'day': "Aujourd'hui", 'temp': 14, 'icon': '10d'},
            {'day': 'Demain', 'temp': 13, 'icon': '09d'},
            {'day': 'Mercredi', 'temp': 12, 'icon': '13d'},
            {'day': 'Jeudi', 'temp': 15, 'icon': '10d'},
            {'day': 'Vendredi', 'temp': 16, 'icon': '02d'}
        ]
    },
    'default': {
        'current': {'temp': 24, 'humidity': 60, 'description': 'ensoleillé', 'icon': '01d'},
        'forecast': [
            {'day': "Aujourd'hui", 'temp': 25, 'icon': '01d'},
            {'day': 'Demain', 'temp': 26, 'icon': '02d'},
            {'day': 'Mercredi', 'temp': 23, 'icon': '03d'},
            {'day': 'Jeudi', 'temp': 24, 'icon': '04d'},
            {'day': 'Vendredi', 'temp': 27, 'icon': '01d'}
        ]
    }
}


def build_fallback(city):
    city_key = (city or 'Brazzaville').strip().lower()
    data = FALLBACK_BY_CITY.get(city_key, FALLBACK_BY_CITY['default'])
    return {
        'current': {
            'name': city or 'Brazzaville',
            'main': {'temp': data['current']['temp'], 'humidity': data['current']['humidity']},
            'weather': [{'description': data['current']['description'], 'icon': data['current']['icon']}],
            'dt': int(datetime.now().timestamp())
        },
        'forecast': data['forecast']
    }


def aggregate_forecast(forecast_data):
    by_day = {}
    for item in forecast_data.get('list', []):
        day_key = datetime.fromtimestamp(item['dt']).strftime('%d/%m/%Y')
        by_day.setdefault(day_key, []).append(item)

    result = []
    for day, items in list(by_day.items())[:5]:
        midday = min(items, key=lambda item: abs(datetime.fromtimestamp(item['dt']).hour - 12))
        result.append({
            'day': day,
            'temp': round(midday['main']['temp']),
            'icon': midday['weather'][0]['icon']
        })
    return result


def fetch_json(url):
    request = Request(url, headers={'User-Agent': 'DataDash/1.0'})
    with urlopen(request, timeout=20) as response:
        return json.loads(response.read().decode('utf-8'))


def get_weather(city):
    if not API_KEY:
        return build_fallback(city)

    try:
        current_url = f"{API_BASE}/weather?q={city}&units=metric&lang=fr&appid={API_KEY}"
        forecast_url = f"{API_BASE}/forecast?q={city}&units=metric&lang=fr&appid={API_KEY}"
        current = fetch_json(current_url)
        forecast_data = fetch_json(forecast_url)
        return {
            'current': current,
            'forecast': aggregate_forecast(forecast_data)
        }
    except (HTTPError, URLError, ValueError):
        return build_fallback(city)


class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        parsed = urlparse(self.path)

        if parsed.path == '/api/weather':
            params = parse_qs(parsed.query)
            city = params.get('city', ['Brazzaville'])[0].strip() or 'Brazzaville'
            payload = get_weather(city)
            self.send_response(200)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(payload).encode('utf-8'))
            return

        file_path = parsed.path.strip('/') or 'index.html'
        disk_path = os.path.normpath(os.path.join(ROOT, file_path))
        if os.path.commonpath([ROOT, disk_path]) != ROOT:
            self.send_response(403)
            self.end_headers()
            self.wfile.write(b'Forbidden')
            return

        if not os.path.exists(disk_path):
            self.send_response(404)
            self.end_headers()
            self.wfile.write(b'Not Found')
            return

        ext = os.path.splitext(disk_path)[1].lower()
        content_type = {
            '.html': 'text/html; charset=utf-8',
            '.css': 'text/css; charset=utf-8',
            '.js': 'application/javascript; charset=utf-8',
            '.json': 'application/json; charset=utf-8'
        }.get(ext, 'application/octet-stream')

        with open(disk_path, 'rb') as fh:
            body = fh.read()

        self.send_response(200)
        self.send_header('Content-Type', content_type)
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, *args):
        return


if __name__ == '__main__':
    server = ThreadingHTTPServer(('0.0.0.0', PORT), Handler)
    print(f'DataDash secure server running on http://localhost:{PORT}')
    server.serve_forever()
