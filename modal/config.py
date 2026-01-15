"""
Sdeume AI - Modal Backend Configuration
"""
import os
from typing import Optional
from pydantic import BaseModel


class Settings(BaseModel):
    """Application settings"""
    # Supabase
    supabase_url: str = os.getenv("SUPABASE_URL", "")
    supabase_service_key: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")

    # Fal.ai
    fal_key: str = os.getenv("FAL_KEY", "")

    # Model Paths (Network Volume)
    model_base_path: str = "/models"
    flux_checkpoint: str = f"{model_base_path}/flux1-dev-fp8.safetensors"

    # Generation Settings
    default_steps: int = 25
    default_cfg_scale: float = 3.5
    default_width: int = 1024
    default_height: int = 1024

    # Video Settings
    video_width: int = 1080
    video_height: int = 1920
    video_fps: int = 30
    video_duration_per_image: float = 2.5

    class Config:
        env_file = ".env"


settings = Settings()


# Theme Configurations
THEME_CONFIGS = {
    "white_studio": {
        "prompt_prefix": "professional wedding photography in minimalist white studio, soft natural lighting, clean background",
        "negative_prompt": "low quality, blurry, oversaturated, artificial lighting",
        "bgm": "elegant_piano.mp3",
        "transitions": ["fade", "dissolve"],
    },
    "garden_studio": {
        "prompt_prefix": "romantic garden wedding photography, warm sunlight, beautiful bokeh, green foliage, natural outdoor setting",
        "negative_prompt": "low quality, blurry, harsh shadows, indoor",
        "bgm": "romantic_strings.mp3",
        "transitions": ["light_leak", "dissolve"],
    },
    "classic_studio": {
        "prompt_prefix": "elegant classic wedding photography, grand hotel ballroom, chandelier lighting, luxurious interior",
        "negative_prompt": "low quality, blurry, modern, casual",
        "bgm": "classical_orchestra.mp3",
        "transitions": ["fade", "ken_burns"],
    },
}
