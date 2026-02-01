"""
YAML theme loader with caching.

Loads theme configurations from YAML files with LRU caching for performance.
"""

import os
from functools import lru_cache
from pathlib import Path
from typing import Dict

import yaml

from .types import (
    ThemePromptConfig,
    MetaConfig,
    MainPrompt,
    ShotSection,
    SceneSection,
    LightingSection,
    GroomStyleSection,
    BrideStyleSection,
    QualitySection,
    NegativePrompt,
    FacePrompt,
    FacePositive,
    FaceNegative,
    HandPrompt,
    GenerationSettings,
    ThemeOptions,
)


def get_prompts_dir() -> Path:
    """
    Get the prompts directory path (works in both local and Modal environments).

    Returns:
        Path to the prompts directory

    Raises:
        FileNotFoundError: If prompts directory cannot be found
    """
    # Environment variable override (for testing/custom deployments)
    if env_path := os.getenv("PROMPTS_DIR"):
        return Path(env_path)

    # Modal deployment environment
    modal_path = Path("/app/prompts")
    if modal_path.exists():
        return modal_path

    # Local development environment
    local_path = Path(__file__).parent
    if local_path.exists():
        return local_path

    raise FileNotFoundError("prompts directory not found")


def _parse_shot_section(data: dict) -> ShotSection:
    """Parse shot section from YAML data."""
    return ShotSection(
        camera=data.get("camera", ""),
        composition=data.get("composition", ""),
    )


def _parse_scene_section(data: dict) -> SceneSection:
    """Parse scene section from YAML data."""
    return SceneSection(
        background=data.get("background", ""),
        atmosphere=data.get("atmosphere", ""),
    )


def _parse_groom_style(data: dict) -> GroomStyleSection:
    """Parse groom style section from YAML data."""
    return GroomStyleSection(
        attire=data.get("attire", ""),
        hair=data.get("hair", ""),
        pose=data.get("pose"),
        expression=data.get("expression"),
    )


def _parse_bride_style(data: dict) -> BrideStyleSection:
    """Parse bride style section from YAML data."""
    return BrideStyleSection(
        attire=data.get("attire", ""),
        hair=data.get("hair", ""),
        accessories=data.get("accessories"),
        pose=data.get("pose"),
        expression=data.get("expression"),
    )


def _parse_negative(data: dict) -> NegativePrompt:
    """Parse negative prompt section from YAML data."""
    return NegativePrompt(
        style=data.get("style", ""),
        quality=data.get("quality", ""),
        mood=data.get("mood", ""),
    )


def _parse_main_prompt(data: dict) -> MainPrompt:
    """Parse main prompt section from YAML data."""
    closeup_data = data.get("closeup")
    return MainPrompt(
        full_body=_parse_shot_section(data.get("full_body", {})),
        scene=_parse_scene_section(data.get("scene", {})),
        lighting=LightingSection(description=data.get("lighting", {}).get("description", "")),
        groom_style=_parse_groom_style(data.get("groom_style", {})),
        bride_style=_parse_bride_style(data.get("bride_style", {})),
        quality=QualitySection(technical=data.get("quality", {}).get("technical", "")),
        negative=_parse_negative(data.get("negative", {})),
        closeup=_parse_shot_section(closeup_data) if closeup_data else None,
    )


def _parse_face_prompt(data: dict) -> FacePrompt:
    """Parse face prompt section from YAML data.

    Supports both flat string and nested {core: ...} formats.
    """
    positive_data = data.get("positive", {})
    negative_data = data.get("negative", {})

    if isinstance(positive_data, str):
        positive_core = positive_data.strip()
    else:
        positive_core = positive_data.get("core", "")

    if isinstance(negative_data, str):
        negative_core = negative_data.strip()
    else:
        negative_core = negative_data.get("core", "")

    return FacePrompt(
        positive=FacePositive(core=positive_core),
        negative=FaceNegative(core=negative_core),
    )


def _parse_hand_prompt(data: dict) -> HandPrompt:
    """Parse hand prompt section from YAML data."""
    return HandPrompt(
        positive=data.get("positive", ""),
        negative=data.get("negative", ""),
    )


def _parse_generation(data: dict) -> GenerationSettings:
    """Parse generation settings from YAML data."""
    return GenerationSettings(
        cfg=data.get("cfg", 7),
        steps=data.get("steps", 25),
        width=data.get("width", 896),
        height=data.get("height", 1152),
    )


def _parse_options(data: dict) -> ThemeOptions:
    """Parse theme options from YAML data."""
    return ThemeOptions(
        include_main_triggers=data.get("include_main_triggers", False),
    )


def load_theme(yaml_path: Path) -> ThemePromptConfig:
    """
    Load a single theme from YAML file.

    Args:
        yaml_path: Path to the theme YAML file

    Returns:
        Parsed ThemePromptConfig
    """
    with open(yaml_path, "r", encoding="utf-8") as f:
        data = yaml.safe_load(f)

    meta_data = data.get("meta", {})

    return ThemePromptConfig(
        meta=MetaConfig(
            slug=meta_data.get("slug", yaml_path.stem),
            name_ko=meta_data.get("name_ko", ""),
            name_en=meta_data.get("name_en", ""),
            description=meta_data.get("description", ""),
        ),
        main=_parse_main_prompt(data.get("main", {})),
        groom_face=_parse_face_prompt(data.get("groom_face", {})),
        bride_face=_parse_face_prompt(data.get("bride_face", {})),
        hand=_parse_hand_prompt(data.get("hand", {})),
        generation=_parse_generation(data.get("generation", {})),
        options=_parse_options(data.get("options", {})),
    )


@lru_cache(maxsize=1)
def load_all_themes() -> Dict[str, ThemePromptConfig]:
    """
    Load all theme configurations from YAML files.

    Results are cached using LRU cache (maxsize=1).

    Returns:
        Dictionary mapping theme slug to ThemePromptConfig
    """
    themes: Dict[str, ThemePromptConfig] = {}

    try:
        prompts_dir = get_prompts_dir()
        themes_dir = prompts_dir / "themes"

        if themes_dir.exists():
            for yaml_file in themes_dir.glob("*.yaml"):
                try:
                    theme = load_theme(yaml_file)
                    themes[theme.meta.slug] = theme
                except Exception as e:
                    print(f"Warning: Failed to load theme {yaml_file}: {e}")
    except FileNotFoundError:
        print("Warning: prompts directory not found, using empty themes")

    return themes


def reload_themes() -> Dict[str, ThemePromptConfig]:
    """
    Force reload of themes (clears cache).

    Use this in development when YAML files are modified.

    Returns:
        Freshly loaded themes dictionary
    """
    load_all_themes.cache_clear()
    return load_all_themes()
