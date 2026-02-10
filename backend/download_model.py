import os
import requests

FILES = {
    "MobileNetSSD_deploy.prototxt": 
        "https://raw.githubusercontent.com/chuanqi305/MobileNet-SSD/master/voc/MobileNetSSD_deploy.prototxt",
    "MobileNetSSD_deploy.caffemodel": 
        "https://github.com/robmarkcole/object-detection-app/raw/master/model/MobileNetSSD_deploy.caffemodel"
}

def download_progress(current, total):
    percent = (current / total) * 100 if total else 0
    print(f"\rProgress: {percent:.1f}% ({current//1024}/{total//1024 if total else 0} KB)", end="", flush=True)

def download_files():
    for filename, url in FILES.items():
        if os.path.exists(filename):
            print(f"{filename} already exists.")
            continue
        
        try:
            print(f"Downloading {filename}...")
            response = requests.get(url, stream=True, timeout=60)
            response.raise_for_status()
            
            total_size = int(response.headers.get('content-length', 0))
            with open(filename, 'wb') as f:
                downloaded = 0
                for chunk in response.iter_content(chunk_size=8192):
                    if chunk:
                        f.write(chunk)
                        downloaded += len(chunk)
                        if total_size:
                            download_progress(downloaded, total_size)
            size_mb = total_size / (1024*1024) if total_size else 0
            print(f"\nDownloaded {filename} ({size_mb:.1f} MB)")
        except Exception as e:
            print(f"\nFailed to download {filename}: {e}")

if __name__ == "__main__":
    download_files()
