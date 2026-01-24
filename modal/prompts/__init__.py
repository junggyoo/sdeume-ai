"""
Theme Prompt System for SDEUME AI.

Provides YAML-based theme configuration for ComfyUI workflow prompts.

Usage:
    from modal.prompts import THEME_PROMPTS, apply_theme_prompts, apply_generation_settings

    # Get available themes
    print(THEME_PROMPTS.keys())  # ['white_studio', 'garden_studio', 'classic_studio']

    # Apply theme to workflow
    workflow = apply_theme_prompts(workflow, theme_slug="white_studio", shot_type="full_body")
    workflow = apply_generation_settings(workflow, width=896, height=1152, cfg=7, steps=25)
"""

from .loader import load_all_themes, reload_themes
from .builder import (
    apply_theme_prompts,
    apply_generation_settings,
    build_main_prompt,
    build_negative_prompt,
)
from .lint_rules import (
    FORBIDDEN_IN_FACE_PROMPT,
    MAX_EXTRA_TAGS_LENGTH,
    sanitize_extra_tags,
    check_face_prompt_lint,
)
from .types import (
    ThemePromptConfig,
    MetaConfig,
    MainPrompt,
    FacePrompt,
    HandPrompt,
    GenerationSettings,
    NegativePrompt,
)

# Pre-load themes at import time
THEME_PROMPTS = load_all_themes()

__all__ = [
    # Main exports
    "THEME_PROMPTS",
    "apply_theme_prompts",
    "apply_generation_settings",
    # Builder functions
    "build_main_prompt",
    "build_negative_prompt",
    # Loader functions
    "load_all_themes",
    "reload_themes",
    # Lint rules
    "FORBIDDEN_IN_FACE_PROMPT",
    "MAX_EXTRA_TAGS_LENGTH",
    "sanitize_extra_tags",
    "check_face_prompt_lint",
    # Types
    "ThemePromptConfig",
    "MetaConfig",
    "MainPrompt",
    "FacePrompt",
    "HandPrompt",
    "GenerationSettings",
    "NegativePrompt",
]
