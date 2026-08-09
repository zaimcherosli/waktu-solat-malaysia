import urllib.request

urls = [
    "https://ia800204.us.archive.org/11/items/AzanMakkah/AzanMakkah.mp3",
    "https://archive.org/download/AdzanOfWorld/Adzan%20dari%20Masjid%20al%20Haram%20Makkah.mp3",
    "https://ia800909.us.archive.org/21/items/AdzanOfWorld/Adzan%20dari%20Masjid%20al%20Haram%20Makkah.mp3"
]

for url in urls:
    try:
        print(f"Trying {url}...")
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"})
        with urllib.request.urlopen(req) as resp:
            data = resp.read()
            if len(data) > 100000 and not data.startswith(b"<!DOCTYPE") and not data.startswith(b"<html"):
                with open("audio/azan.mp3", "wb") as f:
                    f.write(data)
                print(f"SUCCESS! File size: {len(data)} bytes")
                break
    except Exception as e:
        print(f"Failed: {e}")
