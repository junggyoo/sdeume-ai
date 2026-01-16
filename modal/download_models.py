"""
SdmAI 모델 다운로드 스크립트
Modal Volume에 필수 모델들을 사전 다운로드합니다.

실행 방법:
    modal run download_models.py::download_all_models
"""

import modal
import os

app = modal.App("sdmai-model-downloader")

# 모델 저장용 Volume (sdmai_modal.py와 동일한 Volume 사용)
models_volume = modal.Volume.from_name("sdeume-ai-models", create_if_missing=True)

# 다운로드용 이미지 (가벼운 이미지 사용)
downloader_image = modal.Image.debian_slim(python_version="3.11").pip_install(
    "requests",
    "huggingface_hub",
)

# 다운로드할 모델 목록
MODELS = {
    "checkpoints": [
        {
            "name": "flux1-dev-fp8.safetensors",
            "url": "https://huggingface.co/Comfy-Org/flux1-dev/resolve/main/flux1-dev-fp8.safetensors",
            "size": "~17GB",
        },
    ],
    "loras": [
        {
            "name": "Flux-Realism.safetensors",
            "url": "https://huggingface.co/XLabs-AI/flux-RealismLora/resolve/main/lora.safetensors",
            "size": "~300MB",
        },
    ],
    "ultralytics/bbox": [
        {
            "name": "face_yolov8m.pt",
            "url": "https://huggingface.co/Bingsu/adetailer/resolve/main/face_yolov8m.pt",
            "size": "~52MB",
        },
        {
            "name": "hand_yolov8s.pt",
            "url": "https://huggingface.co/Bingsu/adetailer/resolve/main/hand_yolov8s.pt",
            "size": "~22MB",
        },
    ],
}


@app.function(
    image=downloader_image,
    volumes={"/models": models_volume},
    timeout=7200,  # 2시간 (대용량 모델 다운로드 고려)
)
def download_all_models():
    """모든 필수 모델 다운로드"""
    import requests

    print("=" * 60)
    print("SdmAI Model Downloader")
    print("=" * 60)

    downloaded = []
    skipped = []
    failed = []

    for category, models in MODELS.items():
        category_path = f"/models/{category}"
        os.makedirs(category_path, exist_ok=True)

        for model in models:
            name = model["name"]
            url = model["url"]
            size = model["size"]
            dest_path = f"{category_path}/{name}"

            print(f"\n[{category}] {name} ({size})")

            # 이미 존재하면 스킵
            if os.path.exists(dest_path):
                file_size = os.path.getsize(dest_path)
                print(f"  -> Already exists ({file_size / 1024 / 1024:.1f} MB), skipping...")
                skipped.append(name)
                continue

            print(f"  -> Downloading from {url[:50]}...")

            try:
                response = requests.get(url, stream=True, timeout=600)
                response.raise_for_status()

                total_size = int(response.headers.get("content-length", 0))
                downloaded_size = 0

                with open(dest_path, "wb") as f:
                    for chunk in response.iter_content(chunk_size=8192 * 16):
                        f.write(chunk)
                        downloaded_size += len(chunk)

                        # 진행률 표시 (10% 단위)
                        if total_size > 0:
                            progress = downloaded_size / total_size * 100
                            if int(progress) % 10 == 0 and int(progress) > 0:
                                print(f"  -> {progress:.0f}% ({downloaded_size / 1024 / 1024:.1f} MB)")

                final_size = os.path.getsize(dest_path)
                print(f"  -> Downloaded successfully ({final_size / 1024 / 1024:.1f} MB)")
                downloaded.append(name)

            except Exception as e:
                print(f"  -> Failed: {e}")
                failed.append(name)

                # 실패한 파일 삭제
                if os.path.exists(dest_path):
                    os.remove(dest_path)

    # Volume 커밋
    models_volume.commit()

    # 결과 요약
    print("\n" + "=" * 60)
    print("Download Summary")
    print("=" * 60)
    print(f"Downloaded: {len(downloaded)} files")
    for name in downloaded:
        print(f"  - {name}")

    print(f"\nSkipped (already exist): {len(skipped)} files")
    for name in skipped:
        print(f"  - {name}")

    if failed:
        print(f"\nFailed: {len(failed)} files")
        for name in failed:
            print(f"  - {name}")

    return {
        "downloaded": downloaded,
        "skipped": skipped,
        "failed": failed,
    }


@app.function(
    image=downloader_image,
    volumes={"/models": models_volume},
    timeout=60,
)
def list_models():
    """설치된 모델 목록 확인"""
    result = {}

    for category in ["checkpoints", "loras", "ultralytics/bbox"]:
        path = f"/models/{category}"
        if os.path.exists(path):
            files = []
            for f in os.listdir(path):
                file_path = f"{path}/{f}"
                if os.path.isfile(file_path):
                    size = os.path.getsize(file_path)
                    files.append({"name": f, "size_mb": round(size / 1024 / 1024, 1)})
            result[category] = files
        else:
            result[category] = []

    print("\n" + "=" * 60)
    print("Installed Models")
    print("=" * 60)

    for category, files in result.items():
        print(f"\n[{category}]")
        if files:
            for f in files:
                print(f"  - {f['name']} ({f['size_mb']} MB)")
        else:
            print("  (empty)")

    return result


@app.function(
    image=downloader_image,
    volumes={"/models": models_volume},
    timeout=300,
)
def clear_models():
    """모든 모델 삭제 (주의: 되돌릴 수 없음)"""
    import shutil

    print("Clearing all models...")

    for category in ["checkpoints", "loras", "ultralytics"]:
        path = f"/models/{category}"
        if os.path.exists(path):
            shutil.rmtree(path)
            print(f"  Removed: {path}")

    models_volume.commit()
    print("All models cleared.")


if __name__ == "__main__":
    print("""
SdmAI Model Downloader

Usage:
    # 모든 모델 다운로드
    modal run download_models.py::download_all_models

    # 설치된 모델 확인
    modal run download_models.py::list_models

    # 모든 모델 삭제 (주의!)
    modal run download_models.py::clear_models
""")
