"""
Sdeume AI Modal Backend
원본 워크플로우 기반 + GPU 메모리 프로파일링

Note: batch_size는 1로 유지해야 함 (Impact Pack의 BboxDetectorSEGS가 배치 미지원)
"""

import modal
import os
import json
import time
import base64
import subprocess

# Modal 앱 정의
app = modal.App("sdeume-ai-comfyui")

# 모델 저장용 Volume
models_volume = modal.Volume.from_name("sdeume-ai-models", create_if_missing=True)

# ComfyUI 이미지 정의 (프로파일링 패키지 추가)
image = (
    modal.Image.debian_slim(python_version="3.11")
    .apt_install(
        "git",
        "wget",
        "curl",
        "libgl1-mesa-glx",
        "libglib2.0-0",
        "libsm6",
        "libxrender1",
        "libxext6",
        "ffmpeg",
    )
    # NumPy 1.x를 먼저 설치 (PyTorch와 호환성 문제 방지)
    .pip_install("numpy<2")
    .pip_install(
        "torch==2.4.0",
        "torchvision==0.19.0",
        "torchaudio==2.4.0",
        extra_index_url="https://download.pytorch.org/whl/cu121",
    )
    .pip_install(
        "comfy-cli",
        "aiohttp",
        "requests",
        "opencv-python-headless",
        "scikit-image",
        "piexif",
        "fastapi",
        "dill",
        "segment-anything",
        "nvidia-ml-py3",  # GPU 프로파일링용 추가
        "safetensors",  # LoRA 형식 변환용
    )
    .run_commands(
        # ComfyUI 설치
        "comfy --skip-prompt install --nvidia",
    )
    .run_commands(
        # Impact Pack 설치
        "cd /root/comfy/ComfyUI/custom_nodes && git clone https://github.com/ltdrdata/ComfyUI-Impact-Pack.git",
        "cd /root/comfy/ComfyUI/custom_nodes/ComfyUI-Impact-Pack && pip install -r requirements.txt || true",
        # Impact Subpack 설치
        "cd /root/comfy/ComfyUI/custom_nodes && git clone https://github.com/ltdrdata/ComfyUI-Impact-Subpack.git",
        "cd /root/comfy/ComfyUI/custom_nodes/ComfyUI-Impact-Subpack && pip install -r requirements.txt || true",
    )
)

# 워크플로우 JSON (원본 기반)
# Note: batch_size=1 필수 - Impact Pack BboxDetectorSEGS가 배치 이미지 미지원
WORKFLOW_JSON = r'''
{
  "3": {
    "inputs": {
      "seed": 163068160694334,
      "steps": 25,
      "cfg": 1,
      "sampler_name": "euler",
      "scheduler": "simple",
      "denoise": 1,
      "model": ["34", 0],
      "positive": ["6", 0],
      "negative": ["7", 0],
      "latent_image": ["5", 0]
    },
    "class_type": "KSampler",
    "_meta": {"title": "KSampler"}
  },
  "4": {
    "inputs": {"ckpt_name": "flux1-dev-fp8.safetensors"},
    "class_type": "CheckpointLoaderSimple",
    "_meta": {"title": "체크포인트 로드"}
  },
  "5": {
    "inputs": {"width": 1024, "height": 1024, "batch_size": 1},
    "class_type": "EmptyLatentImage",
    "_meta": {"title": "빈 잠재 이미지"}
  },
  "6": {
    "inputs": {
      "text": "(Front view, full frontal shot, facing camera directly, looking at viewer:1.4), (Full body shot:1.5), wide angle shot, A high-end editorial wedding photo of a Korean groom and a Korean bride standing side by side facing forward in a luxury Cheongdam-dong minimal studio.\n\n(Background): Clean white horizon, soft shadows, minimalist classic molding wall, elegant atmosphere.\n\n(Groom styling): The groom is standing tall facing the camera, wearing a perfectly tailored black tuxedo, black bow tie, and shiny patent leather shoes. He has a (trendy Korean Guile cut hairstyle:1.3), wet hair styling, clean and sophisticated look. He is looking straight at the camera with a gentle smile.\n\n(Bride styling): The bride is wearing a luxurious (Mermaid line wedding dress:1.2) that accentuates her figure, with intricate lace details and a long veil flowing down. She has a (modern low bun hairstyle:1.3) with (wispy side bangs:1.2). She is wearing high heels, standing gracefully facing forward, looking straight at the camera.\n\n(Lighting & Quality): Softbox studio lighting, high-key lighting, soft skin texture, 8k resolution, highly detailed fabric texture, Vogue Korea style, sharp focus, professional photography, Canon R5, 85mm lens.",
      "clip": ["34", 1]
    },
    "class_type": "CLIPTextEncode",
    "_meta": {"title": "CLIP 텍스트 인코딩 (프롬프트)"}
  },
  "7": {
    "inputs": {
      "text": "(western, caucasian, white people, foreigner, american, european:1.3), blue eyes, blonde hair,\n(malformed hands, fused fingers, too many fingers, missing fingers, extra fingers:1.3), impossible hand pose, claw, paw, floating hands, long fingers, bad anatomy, bad proportions, malformed limbs, extra limbs, missing limbs, disconnected limbs, long neck, mutated, deformed, disfigured, (illustration, painting, drawing, anime, cartoon, 3d render:1.2), text, watermark, signature, logo, low quality, worst quality, lowres, glitch, cropped, casual clothes, jeans, messy, dark, gloomy",
      "clip": ["34", 1]
    },
    "class_type": "CLIPTextEncode",
    "_meta": {"title": "CLIP 텍스트 인코딩 (프롬프트)"}
  },
  "8": {
    "inputs": {"samples": ["3", 0], "vae": ["4", 2]},
    "class_type": "VAEDecode",
    "_meta": {"title": "VAE 디코드"}
  },
  "14": {
    "inputs": {
      "lora_name": "groom_lora.safetensors",
      "strength_model": 1,
      "strength_clip": 1,
      "model": ["34", 0],
      "clip": ["34", 1]
    },
    "class_type": "LoraLoader",
    "_meta": {"title": "LoRA 로드"}
  },
  "15": {
    "inputs": {
      "lora_name": "bride_lora.safetensors",
      "strength_model": 1,
      "strength_clip": 1,
      "model": ["34", 0],
      "clip": ["34", 1]
    },
    "class_type": "LoraLoader",
    "_meta": {"title": "LoRA 로드"}
  },
  "19": {
    "inputs": {"model_name": "bbox/face_yolov8m.pt"},
    "class_type": "UltralyticsDetectorProvider",
    "_meta": {"title": "UltralyticsDetectorProvider"}
  },
  "21": {
    "inputs": {
      "text": "closeup of Korean GROOM_SDME man, (East Asian facial features:1.2), brown eyes, black hair, (trendy Guile cut hairstyle:1.3), (wet hair styling:1.2), gentle smile, (cinematic lighting, warm spotlight:1.2)\n",
      "clip": ["34", 1]
    },
    "class_type": "CLIPTextEncode",
    "_meta": {"title": "CLIP 텍스트 인코딩 (프롬프트)"}
  },
  "23": {
    "inputs": {
      "text": "closeup of Korean BRIDE_SDME woman, (East Asian facial features:1.2), brown eyes, black hair, (modern low bun hairstyle:1.2), (wispy side bangs:1.2), soft makeup, (cinematic lighting, warm spotlight:1.2)\n",
      "clip": ["34", 1]
    },
    "class_type": "CLIPTextEncode",
    "_meta": {"title": "CLIP 텍스트 인코딩 (프롬프트)"}
  },
  "24": {
    "inputs": {"filename_prefix": "lora", "images": ["37", 0]},
    "class_type": "SaveImage",
    "_meta": {"title": "이미지 저장"}
  },
  "26": {
    "inputs": {
      "text": "woman, girl, female, makeup, lipstick, feminine, low quality, worst quality, (western, caucasian, white people, foreigner, american, european:1.3), blue eyes, blonde hair",
      "clip": ["34", 1]
    },
    "class_type": "CLIPTextEncode",
    "_meta": {"title": "CLIP 텍스트 인코딩 (프롬프트)"}
  },
  "27": {
    "inputs": {
      "text": "man, boy, male, beard, mustache, masculine, bad anatomy, distortion, low quality, worst quality, (western, caucasian, white people, foreigner, american, european:1.3), blue eyes, blonde hair,",
      "clip": ["34", 1]
    },
    "class_type": "CLIPTextEncode",
    "_meta": {"title": "CLIP 텍스트 인코딩 (프롬프트)"}
  },
  "29": {
    "inputs": {
      "target": "area(=w*h)",
      "order": true,
      "take_start": 0,
      "take_count": 1,
      "segs": ["30", 0]
    },
    "class_type": "ImpactSEGSOrderedFilter",
    "_meta": {"title": "SEGS Filter (ordered)"}
  },
  "30": {
    "inputs": {
      "threshold": 0.25,
      "dilation": 10,
      "crop_factor": 5,
      "drop_size": 10,
      "labels": "all",
      "bbox_detector": ["19", 0],
      "image": ["8", 0]
    },
    "class_type": "BboxDetectorSEGS",
    "_meta": {"title": "BBOX Detector (SEGS)"}
  },
  "32": {
    "inputs": {
      "guide_size": 1024,
      "guide_size_for": true,
      "max_size": 1024,
      "seed": 163068160694334,
      "steps": 15,
      "cfg": 1,
      "sampler_name": "euler",
      "scheduler": "simple",
      "denoise": 0.6,
      "feather": 5,
      "noise_mask": true,
      "force_inpaint": true,
      "wildcard": "",
      "cycle": 1,
      "inpaint_model": false,
      "noise_mask_feather": 20,
      "tiled_encode": false,
      "tiled_decode": false,
      "image": ["8", 0],
      "segs": ["29", 0],
      "model": ["14", 0],
      "clip": ["14", 1],
      "vae": ["4", 2],
      "positive": ["21", 0],
      "negative": ["26", 0]
    },
    "class_type": "DetailerForEach",
    "_meta": {"title": "디테일러 (SEGS)"}
  },
  "33": {
    "inputs": {
      "guide_size": 1024,
      "guide_size_for": true,
      "max_size": 1024,
      "seed": 733073276389082,
      "steps": 8,
      "cfg": 1,
      "sampler_name": "euler",
      "scheduler": "simple",
      "denoise": 0.6,
      "feather": 5,
      "noise_mask": true,
      "force_inpaint": true,
      "wildcard": "",
      "cycle": 1,
      "inpaint_model": false,
      "noise_mask_feather": 20,
      "tiled_encode": false,
      "tiled_decode": false,
      "image": ["32", 0],
      "segs": ["29", 1],
      "model": ["15", 0],
      "clip": ["15", 1],
      "vae": ["4", 2],
      "positive": ["23", 0],
      "negative": ["27", 0]
    },
    "class_type": "DetailerForEach",
    "_meta": {"title": "디테일러 (SEGS)"}
  },
  "34": {
    "inputs": {
      "lora_name": "Flux-Realism.safetensors",
      "strength_model": 0.45,
      "strength_clip": 1,
      "model": ["4", 0],
      "clip": ["4", 1]
    },
    "class_type": "LoraLoader",
    "_meta": {"title": "LoRA 로드"}
  },
  "35": {
    "inputs": {"model_name": "bbox/hand_yolov8s.pt"},
    "class_type": "UltralyticsDetectorProvider",
    "_meta": {"title": "UltralyticsDetectorProvider"}
  },
  "36": {
    "inputs": {
      "threshold": 0.4,
      "dilation": 10,
      "crop_factor": 3,
      "drop_size": 10,
      "labels": "all",
      "bbox_detector": ["35", 0],
      "image": ["33", 0]
    },
    "class_type": "BboxDetectorSEGS",
    "_meta": {"title": "BBOX Detector (SEGS)"}
  },
  "37": {
    "inputs": {
      "guide_size": 512,
      "guide_size_for": true,
      "max_size": 1024,
      "seed": 964000217776175,
      "steps": 10,
      "cfg": 8,
      "sampler_name": "euler",
      "scheduler": "simple",
      "denoise": 0.35,
      "feather": 5,
      "noise_mask": true,
      "force_inpaint": true,
      "wildcard": "",
      "cycle": 1,
      "inpaint_model": false,
      "noise_mask_feather": 20,
      "tiled_encode": false,
      "tiled_decode": false,
      "image": ["33", 0],
      "segs": ["36", 0],
      "model": ["4", 0],
      "clip": ["34", 1],
      "vae": ["4", 2],
      "positive": ["38", 0],
      "negative": ["39", 0]
    },
    "class_type": "DetailerForEach",
    "_meta": {"title": "디테일러 (SEGS)"}
  },
  "38": {
    "inputs": {
      "text": "beautiful detailed hands, fingers, texture, anatomy",
      "clip": ["34", 1]
    },
    "class_type": "CLIPTextEncode",
    "_meta": {"title": "CLIP 텍스트 인코딩 (프롬프트)"}
  },
  "39": {
    "inputs": {
      "text": "extra fingers, missing fingers, mutated",
      "clip": ["34", 1]
    },
    "class_type": "CLIPTextEncode",
    "_meta": {"title": "CLIP 텍스트 인코딩 (프롬프트)"}
  }
}
'''


# GPU 메모리 프로파일러 (임베드)
class GPUMemoryProfiler:
    """GPU 메모리 프로파일링 클래스"""

    def __init__(self):
        try:
            import pynvml
            pynvml.nvmlInit()
            self.handle = pynvml.nvmlDeviceGetHandleByIndex(0)
            self.pynvml = pynvml
            self.initialized = True
            self.measurements = []
            print("✓ GPU Memory Profiler initialized")
        except Exception as e:
            print(f"✗ GPU Profiler init failed: {e}")
            self.initialized = False
            self.measurements = []

    def get_memory_info(self):
        """현재 GPU 메모리 사용량 조회"""
        if not self.initialized:
            return {"total_gb": 0, "used_gb": 0, "free_gb": 0, "utilization_pct": 0}

        try:
            info = self.pynvml.nvmlDeviceGetMemoryInfo(self.handle)
            total_gb = info.total / (1024 ** 3)
            used_gb = info.used / (1024 ** 3)
            free_gb = info.free / (1024 ** 3)
            utilization_pct = (used_gb / total_gb) * 100

            return {
                "total_gb": round(total_gb, 2),
                "used_gb": round(used_gb, 2),
                "free_gb": round(free_gb, 2),
                "utilization_pct": round(utilization_pct, 1)
            }
        except Exception as e:
            print(f"Error getting memory: {e}")
            return {"total_gb": 0, "used_gb": 0, "free_gb": 0, "utilization_pct": 0}

    def record(self, label: str):
        """메모리 사용량 기록"""
        memory_info = self.get_memory_info()
        measurement = {"label": label, **memory_info}
        self.measurements.append(measurement)

        print(f"🔍 [{label}] GPU Memory: {memory_info['used_gb']:.2f} GB / "
              f"{memory_info['total_gb']:.2f} GB ({memory_info['utilization_pct']:.1f}%)")

        return measurement

    def print_report(self):
        """프로파일링 리포트 출력"""
        if not self.measurements:
            return

        print("\n" + "="*60)
        print("📊 GPU MEMORY PROFILING REPORT")
        print("="*60)

        peak = max(self.measurements, key=lambda x: x['used_gb'])
        first = self.measurements[0]
        last = self.measurements[-1]

        print(f"\n💾 Memory Usage:")
        print(f"  Start:    {first['used_gb']:.2f} GB")
        print(f"  End:      {last['used_gb']:.2f} GB")
        print(f"  Peak:     {peak['used_gb']:.2f} GB ({peak['utilization_pct']:.1f}%)")
        print(f"  Increase: {last['used_gb'] - first['used_gb']:+.2f} GB")
        print(f"\n🔝 Peak at: {peak['label']}")
        print(f"\n📈 Timeline:")
        for i, m in enumerate(self.measurements):
            print(f"  {i+1}. [{m['label']}] {m['used_gb']:.2f} GB ({m['utilization_pct']:.1f}%)")

        print("="*60 + "\n")

    def cleanup(self):
        """리소스 정리"""
        if self.initialized:
            try:
                self.pynvml.nvmlShutdown()
            except:
                pass


def download_file(url: str, dest: str) -> bool:
    """파일 다운로드"""
    import requests
    try:
        response = requests.get(url, stream=True, timeout=300)
        response.raise_for_status()
        os.makedirs(os.path.dirname(dest), exist_ok=True)
        with open(dest, "wb") as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)
        return True
    except Exception as e:
        print(f"Download failed: {url} -> {e}")
        return False


def convert_diffusers_to_comfyui_flux_lora(input_path: str, output_path: str) -> bool:
    """
    Diffusers/PEFT 및 SimpleTuner 형식의 FLUX LoRA를 ComfyUI 형식으로 변환 (Universal Fix)
    """
    try:
        from safetensors.torch import load_file, save_file
        import torch
        import re

        print(f"🔄 Converting LoRA: {input_path}")

        state_dict = load_file(input_path)
        converted_dict = {}

        # Buffers for merging (Diffusers format)
        single_linear1 = {}
        double_img_qkv = {}
        double_txt_qkv = {}

        def get_tensor_entry(buffer, block_idx, comp_type):
            if block_idx not in buffer:
                buffer[block_idx] = {}
            if comp_type not in buffer[block_idx]:
                buffer[block_idx][comp_type] = {}
            return buffer[block_idx][comp_type]

        def save_alpha(key_base, rank):
            converted_dict[f'{key_base}.alpha'] = torch.tensor(rank, dtype=torch.float32)

        converted_count = 0
        
        for key, value in state_dict.items():
            matched = False

            # =================================================================
            # A. SimpleTuner / Kohya-Legacy Format (Flux-Realism 등)
            # 패턴: double_blocks.{i}.processor.qkv_lora1.down.weight
            # =================================================================
            
            # Double Blocks: QKV (1=Image, 2=Text)
            match = re.match(r"double_blocks\.(\d+)\.processor\.qkv_lora(\d+)\.(down|up)\.weight", key)
            if match:
                idx, type_id, part = match.groups() # type_id: 1=img, 2=txt
                name_part = "img_attn_qkv" if type_id == "1" else "txt_attn_qkv"
                new_key_base = f"lora_unet_double_blocks_{idx}_{name_part}"
                
                converted_dict[f"{new_key_base}.lora_{part}.weight"] = value
                if part == "down": 
                    save_alpha(new_key_base, value.shape[0])
                    converted_count += 1
                matched = True
                continue

            # Double Blocks: Proj (1=Image, 2=Text)
            match = re.match(r"double_blocks\.(\d+)\.processor\.proj_lora(\d+)\.(down|up)\.weight", key)
            if match:
                idx, type_id, part = match.groups()
                name_part = "img_attn_proj" if type_id == "1" else "txt_attn_proj"
                new_key_base = f"lora_unet_double_blocks_{idx}_{name_part}"
                
                converted_dict[f"{new_key_base}.lora_{part}.weight"] = value
                if part == "down":
                    save_alpha(new_key_base, value.shape[0])
                    converted_count += 1
                matched = True
                continue

            # Single Blocks: Linear1 (QKV+MLP) -> proj_lora1
            match = re.match(r"single_blocks\.(\d+)\.processor\.proj_lora1\.(down|up)\.weight", key)
            if match:
                idx, part = match.groups()
                new_key_base = f"lora_unet_single_blocks_{idx}_linear1"
                
                converted_dict[f"{new_key_base}.lora_{part}.weight"] = value
                if part == "down":
                    save_alpha(new_key_base, value.shape[0])
                    converted_count += 1
                matched = True
                continue

            # Single Blocks: Linear2 (Output) -> proj_lora2
            match = re.match(r"single_blocks\.(\d+)\.processor\.proj_lora2\.(down|up)\.weight", key)
            if match:
                idx, part = match.groups()
                new_key_base = f"lora_unet_single_blocks_{idx}_linear2"
                
                converted_dict[f"{new_key_base}.lora_{part}.weight"] = value
                if part == "down":
                    save_alpha(new_key_base, value.shape[0])
                    converted_count += 1
                matched = True
                continue

            # =================================================================
            # B. Diffusers / Fal.ai Format (Standard)
            # =================================================================

            # 1. Single Blocks (Merge: Q+K+V+MLP -> linear1)
            match = re.match(r"transformer\.single_transformer_blocks\.(\d+)\.(attn\.to_([qkv])|proj_mlp)\.lora_(A|B)\.weight", key)
            if match:
                idx = match.group(1)
                part_type = match.group(3) if match.group(3) else "mlp"
                ab = match.group(4) # A=down, B=up
                entry = get_tensor_entry(single_linear1, idx, part_type)
                entry["down" if ab == "A" else "up"] = value
                matched = True
                continue

            # Single: proj_out -> linear2
            match = re.match(r"transformer\.single_transformer_blocks\.(\d+)\.proj_out\.lora_(A|B)\.weight", key)
            if match:
                idx, part = match.groups()
                new_key_base = f'lora_unet_single_blocks_{idx}_linear2'
                converted_dict[f'{new_key_base}.lora_{"down" if part == "A" else "up"}.weight'] = value
                if part == "A": 
                    save_alpha(new_key_base, value.shape[0])
                    converted_count += 1
                matched = True
                continue

            # 2. Double Blocks (Merge: Q+K+V -> qkv)
            # Image Q/K/V
            match = re.match(r"transformer\.transformer_blocks\.(\d+)\.attn\.to_([qkv])\.lora_(A|B)\.weight", key)
            if match:
                idx, qkv, part = match.groups()
                entry = get_tensor_entry(double_img_qkv, idx, qkv)
                entry["down" if part == "A" else "up"] = value
                matched = True
                continue

            # Text Q/K/V
            match = re.match(r"transformer\.transformer_blocks\.(\d+)\.attn\.add_([qkv])_proj\.lora_(A|B)\.weight", key)
            if match:
                idx, qkv, part = match.groups()
                entry = get_tensor_entry(double_txt_qkv, idx, qkv)
                entry["down" if part == "A" else "up"] = value
                matched = True
                continue

            # 3. Double Blocks MLP & Projections
            # Image MLP
            match = re.match(r"transformer\.transformer_blocks\.(\d+)\.ff\.net\.(\d+)(\.proj)?\.lora_(A|B)\.weight", key)
            if match:
                idx, layer_idx, _, part = match.groups()
                new_key_base = f'lora_unet_double_blocks_{idx}_img_mlp_{layer_idx}'
                converted_dict[f'{new_key_base}.lora_{"down" if part == "A" else "up"}.weight'] = value
                if part == "A":
                    save_alpha(new_key_base, value.shape[0])
                    converted_count += 1
                matched = True
                continue

            # Text MLP
            match = re.match(r"transformer\.transformer_blocks\.(\d+)\.ff_context\.net\.(\d+)(\.proj)?\.lora_(A|B)\.weight", key)
            if match:
                idx, layer_idx, _, part = match.groups()
                new_key_base = f'lora_unet_double_blocks_{idx}_txt_mlp_{layer_idx}'
                converted_dict[f'{new_key_base}.lora_{"down" if part == "A" else "up"}.weight'] = value
                if part == "A":
                    save_alpha(new_key_base, value.shape[0])
                    converted_count += 1
                matched = True
                continue

            # Output Projections (to_out.0)
            match = re.match(r"transformer\.transformer_blocks\.(\d+)\.attn\.to_out\.0\.lora_(A|B)\.weight", key)
            if match:
                idx, part = match.groups()
                new_key_base = f'lora_unet_double_blocks_{idx}_img_attn_proj'
                converted_dict[f'{new_key_base}.lora_{"down" if part == "A" else "up"}.weight'] = value
                if part == "A":
                    save_alpha(new_key_base, value.shape[0])
                    converted_count += 1
                matched = True
                continue

            # Output Projections (to_add_out)
            match = re.match(r"transformer\.transformer_blocks\.(\d+)\.attn\.to_add_out\.lora_(A|B)\.weight", key)
            if match:
                idx, part = match.groups()
                new_key_base = f'lora_unet_double_blocks_{idx}_txt_attn_proj'
                converted_dict[f'{new_key_base}.lora_{"down" if part == "A" else "up"}.weight'] = value
                if part == "A":
                    save_alpha(new_key_base, value.shape[0])
                    converted_count += 1
                matched = True
                continue

            # 4. Final Layers
            match = re.match(r"transformer\.proj_out\.lora_(A|B)\.weight", key)
            if match:
                part = match.group(1)
                new_key_base = f'lora_unet_final_layer_linear'
                converted_dict[f'{new_key_base}.lora_{"down" if part == "A" else "up"}.weight'] = value
                if part == "A":
                    save_alpha(new_key_base, value.shape[0])
                    converted_count += 1
                matched = True
                continue

        # =====================================================================
        # Merge Logic (Only for Diffusers/Fal format)
        # =====================================================================
        def merge_qkv_buffer(buffer, output_name_pattern, dims):
            nonlocal converted_count
            total_out = sum(dims)
            comp_keys = ["q", "k", "v"]
            if len(dims) == 4: comp_keys.append("mlp")

            for idx, comp_map in buffer.items():
                if not all(c in comp_map for c in ["q", "k", "v"]): continue
                
                down_list = []
                for c in comp_keys:
                    if c in comp_map and "down" in comp_map[c]:
                        down_list.append(comp_map[c]["down"])
                
                if not down_list: continue
                merged_down = torch.cat(down_list, dim=0)

                ranks = []
                for c in comp_keys:
                    if c in comp_map and "up" in comp_map[c]:
                        ranks.append(comp_map[c]["up"].shape[1])
                    else:
                        ranks.append(0)
                
                total_rank = sum(ranks)
                merged_up = torch.zeros(total_out, total_rank, dtype=down_list[0].dtype)

                out_offset = 0
                rank_offset = 0
                
                for i, c in enumerate(comp_keys):
                    if c in comp_map and "up" in comp_map[c]:
                        up_tensor = comp_map[c]["up"]
                        target_dim = dims[i]
                        actual_out = up_tensor.shape[0]
                        use_dim = min(target_dim, actual_out)
                        current_rank = ranks[i]
                        merged_up[out_offset:out_offset+use_dim, rank_offset:rank_offset+current_rank] = up_tensor[:use_dim, :]
                    
                    out_offset += dims[i]
                    rank_offset += ranks[i]

                base_key = output_name_pattern.format(idx)
                converted_dict[f"{base_key}.lora_down.weight"] = merged_down
                converted_dict[f"{base_key}.lora_up.weight"] = merged_up
                converted_dict[f"{base_key}.alpha"] = torch.tensor(total_rank, dtype=torch.float32)
                converted_count += 1

        merge_qkv_buffer(single_linear1, "lora_unet_single_blocks_{}_linear1", [3072, 3072, 3072, 12288])
        merge_qkv_buffer(double_img_qkv, "lora_unet_double_blocks_{}_img_attn_qkv", [3072, 3072, 3072])
        merge_qkv_buffer(double_txt_qkv, "lora_unet_double_blocks_{}_txt_attn_qkv", [3072, 3072, 3072])

        if converted_count > 0:
            save_file(converted_dict, output_path)
            print(f"✅ Conversion complete: {len(converted_dict)} keys created (Clean & Universal).")
            return True
        else:
            print(f"❌ No keys converted.")
            return False

    except Exception as e:
        print(f"❌ LoRA conversion crashed: {e}")
        import traceback
        traceback.print_exc()
        return False


@app.cls(
    image=image,
    gpu="A100-80GB",
    timeout=600,
    scaledown_window=120,
    volumes={"/models": models_volume},
    enable_memory_snapshot=True,
)
@modal.concurrent(max_inputs=4)
class ComfyUIServer:
    """ComfyUI 서버 클래스 (프로파일링 포함)"""

    process: subprocess.Popen = None
    profiler: GPUMemoryProfiler = None

    def check_server_ready(self) -> bool:
        """ComfyUI 서버 준비 상태 확인"""
        import requests
        try:
            response = requests.get("http://127.0.0.1:8188/system_stats", timeout=5)
            return response.status_code == 200
        except Exception:
            return False

    @modal.enter()
    def start_server(self):
        """컨테이너 시작 시 ComfyUI 서버 실행"""
        import shutil

        # 프로파일러 초기화
        self.profiler = GPUMemoryProfiler()
        self.profiler.record("Container Start")

        print("Starting ComfyUI server...")

        comfyui_dir = "/root/comfy/ComfyUI"
        comfyui_models_dir = f"{comfyui_dir}/models"
        volume_models_dir = "/models"

        # 기존 models 폴더 삭제하고 심볼릭 링크 생성
        if os.path.exists(comfyui_models_dir):
            if os.path.islink(comfyui_models_dir):
                os.unlink(comfyui_models_dir)
            else:
                shutil.rmtree(comfyui_models_dir)

        os.symlink(volume_models_dir, comfyui_models_dir)
        print(f"Created symlink: {comfyui_models_dir} -> {volume_models_dir}")

        # 볼륨 내 디렉토리 확인
        os.makedirs(f"{volume_models_dir}/checkpoints", exist_ok=True)
        os.makedirs(f"{volume_models_dir}/loras", exist_ok=True)
        os.makedirs(f"{volume_models_dir}/ultralytics/bbox", exist_ok=True)

        self.profiler.record("Before Server Start")

        # ComfyUI 서버 시작
        self.process = subprocess.Popen(
            ["python", "main.py", "--listen", "127.0.0.1", "--port", "8188", "--highvram"],
            cwd=comfyui_dir,
            stdout=None,
            stderr=None,
        )

        # 서버 준비 대기
        max_wait = 180
        for i in range(max_wait):
            if self.check_server_ready():
                print(f"ComfyUI server ready! (took {i+1} seconds)")
                self.profiler.record("After Server Start")
                return
            if i % 10 == 0:
                print(f"Waiting for ComfyUI server... ({i}s)")
            time.sleep(1)

        raise RuntimeError("ComfyUI server failed to start within 180 seconds")

    @modal.exit()
    def stop_server(self):
        """컨테이너 종료 시 서버 정리"""
        if self.profiler:
            self.profiler.print_report()
            self.profiler.cleanup()

        if self.process:
            self.process.terminate()
            self.process.wait()
            print("ComfyUI server stopped")

    @modal.fastapi_endpoint(method="POST")
    def generate(self, request: dict):
        """이미지 생성 API 엔드포인트 (프로파일링 포함)"""
        import requests
        import random

        comfyui_dir = "/root/comfy/ComfyUI"
        models_dir = "/models"

        # 요청 파라미터 추출
        prompt = request.get("prompt")
        groom_lora_url = request.get("groomLoraUrl")
        bride_lora_url = request.get("brideLoraUrl")

        print(f"🎨 Generation request - prompt: {prompt[:50] if prompt else 'None'}...")

        self.profiler.record("Before LoRA Download")

        # 동적 LoRA 다운로드 및 형식 변환 (매번 새로 다운로드 - 사용자별 LoRA가 다름)
        if groom_lora_url:
            groom_lora_temp = f"{models_dir}/loras/groom_lora_temp.safetensors"
            groom_lora_path = f"{models_dir}/loras/groom_lora.safetensors"
            # 기존 파일 삭제
            for path in [groom_lora_temp, groom_lora_path]:
                if os.path.exists(path):
                    os.remove(path)
            print(f"Downloading groom LoRA from {groom_lora_url}")
            if download_file(groom_lora_url, groom_lora_temp):
                # PEFT → ComfyUI 형식 변환 (sparse matrix 방식)
                if convert_diffusers_to_comfyui_flux_lora(groom_lora_temp, groom_lora_path):
                    os.remove(groom_lora_temp)
                else:
                    # 변환 실패시 원본 사용
                    print("  ℹ️ Conversion failed, using original file")
                    os.rename(groom_lora_temp, groom_lora_path)

        if bride_lora_url:
            bride_lora_temp = f"{models_dir}/loras/bride_lora_temp.safetensors"
            bride_lora_path = f"{models_dir}/loras/bride_lora.safetensors"
            # 기존 파일 삭제
            for path in [bride_lora_temp, bride_lora_path]:
                if os.path.exists(path):
                    os.remove(path)
            print(f"Downloading bride LoRA from {bride_lora_url}")
            if download_file(bride_lora_url, bride_lora_temp):
                # PEFT → ComfyUI 형식 변환 (sparse matrix 방식)
                if convert_diffusers_to_comfyui_flux_lora(bride_lora_temp, bride_lora_path):
                    os.remove(bride_lora_temp)
                else:
                    # 변환 실패시 원본 사용
                    print("  ℹ️ Conversion failed, using original file")
                    os.rename(bride_lora_temp, bride_lora_path)

        # =================================================================
        # [추가할 코드] Flux-Realism.safetensors 자동 변환 로직
        # =================================================================
        realism_path = f"{models_dir}/loras/Flux-Realism.safetensors"
        
        # 파일이 존재하면 변환 시도
        if os.path.exists(realism_path):
            # 변환이 필요한지 확인하기 위해 임시 파일로 변환 시도
            print(f"🔍 Checking Flux-Realism format: {realism_path}")
            realism_temp_out = f"{models_dir}/loras/Flux-Realism_fixed.safetensors"
            
            # 1. 이미 변환된 파일(_fixed)이 있다면 그걸 덮어쓰기 (중복 변환 방지)
            # (이 부분은 Volume에 영구 저장되므로 매번 실행되지 않게 체크하는 것이 좋으나, 
            #  현재 변환 함수는 Diffusers 키가 없으면 False를 반환하므로 안전합니다.)
            
            is_converted = convert_diffusers_to_comfyui_flux_lora(realism_path, realism_temp_out)
            
            if is_converted:
                print("✨ Flux-Realism converted to ComfyUI format. Overwriting original.")
                os.remove(realism_path)             # 원본(Diffusers형식) 삭제
                os.rename(realism_temp_out, realism_path) # 변환본을 원본 이름으로 변경
            else:
                print("✅ Flux-Realism is already in correct format or incompatible.")
                if os.path.exists(realism_temp_out):
                    os.remove(realism_temp_out)
        # =================================================================

        self.profiler.record("After LoRA Download")

        # 워크플로우 로드
        workflow = json.loads(WORKFLOW_JSON)

        # 워크플로우 동적 수정
        if prompt:
            if "6" in workflow and "inputs" in workflow["6"]:
                base_prompt = workflow["6"]["inputs"]["text"]
                workflow["6"]["inputs"]["text"] = f"{prompt}, {base_prompt}"

        # 랜덤 시드 적용
        random_seed = random.randint(0, 2**53)
        if "3" in workflow and "inputs" in workflow["3"]:
            workflow["3"]["inputs"]["seed"] = random_seed

        self.profiler.record("Before Workflow Queue")

        # ComfyUI에 워크플로우 전송
        try:
            response = requests.post(
                "http://127.0.0.1:8188/prompt",
                json={"prompt": workflow},
                timeout=30,
            )
            response.raise_for_status()
            prompt_id = response.json()["prompt_id"]
            print(f"Workflow queued: {prompt_id}")
        except Exception as e:
            return {"error": f"Failed to queue workflow: {str(e)}"}

        self.profiler.record("After Workflow Queue")

        # 결과 대기
        output_images = []
        max_wait = 300

        workflow_started = False

        for i in range(max_wait):
            try:
                history_response = requests.get(
                    f"http://127.0.0.1:8188/history/{prompt_id}",
                    timeout=10,
                )
                history = history_response.json()

                if prompt_id in history:
                    # 첫 실행 시 메모리 기록
                    if not workflow_started:
                        self.profiler.record("Workflow Executing")
                        workflow_started = True

                    outputs = history[prompt_id].get("outputs", {})

                    for node_id, node_output in outputs.items():
                        if "images" in node_output:
                            for img in node_output["images"]:
                                img_path = f"{comfyui_dir}/output/{img['filename']}"

                                if os.path.exists(img_path):
                                    with open(img_path, "rb") as f:
                                        img_data = f.read()
                                        img_base64 = base64.b64encode(img_data).decode("utf-8")
                                        output_images.append({
                                            "base64": img_base64,
                                            "content_type": "image/png",
                                            "width": 1024,
                                            "height": 1024,
                                        })

                    if output_images:
                        self.profiler.record("After Generation Complete")
                        print(f"Generation complete! {len(output_images)} images")
                        break

            except Exception as e:
                print(f"Waiting for result... ({i+1}s) - {e}")

            time.sleep(1)

        if not output_images:
            return {"error": "Image generation timed out or failed"}

        return {"images": output_images}


@app.function(
    image=image,
    volumes={"/models": models_volume},
    timeout=60,
)
def check_models():
    """설치된 모델 확인"""
    models_dir = "/models"

    result = {
        "checkpoints": [],
        "loras": [],
        "ultralytics": [],
    }

    for subdir in ["checkpoints", "loras", "ultralytics/bbox"]:
        path = f"{models_dir}/{subdir}"
        if os.path.exists(path):
            files = os.listdir(path)
            key = subdir.split("/")[0]
            result[key].extend(files)

    return result


if __name__ == "__main__":
    print("Modal app defined. Deploy with: modal deploy sdmai_modal_profiled_fixed.py")
