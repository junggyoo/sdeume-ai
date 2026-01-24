"""
Prompt builder functions.

Assembles prompts from theme configurations and applies them to workflows.
"""

import random
from typing import Optional

from .types import MainPrompt, NegativePrompt, ThemePromptConfig
from .loader import load_all_themes
from .lint_rules import sanitize_extra_tags, lint_and_filter_tags


def build_main_prompt(main: MainPrompt, shot_type: str = "full_body") -> str:
    """
    Build main positive prompt from configuration.

    Args:
        main: MainPrompt configuration
        shot_type: "full_body" or "closeup"

    Returns:
        Assembled prompt string
    """
    # Select shot-specific section
    shot = main.full_body if shot_type == "full_body" else main.closeup

    # Assemble parts in natural flow
    parts = []

    # Camera and composition
    if shot.camera:
        parts.append(shot.camera)
    if shot.composition:
        parts.append(shot.composition)

    # Scene
    if main.scene.background:
        parts.append(main.scene.background)
    if main.scene.atmosphere:
        parts.append(main.scene.atmosphere)

    # Lighting
    if main.lighting.description:
        parts.append(main.lighting.description)

    # Groom styling
    groom_parts = []
    if main.groom_style.attire:
        groom_parts.append(main.groom_style.attire)
    if main.groom_style.hair:
        groom_parts.append(main.groom_style.hair)
    if main.groom_style.pose:
        groom_parts.append(main.groom_style.pose)
    if groom_parts:
        parts.append(" ".join(groom_parts))

    # Bride styling
    bride_parts = []
    if main.bride_style.attire:
        bride_parts.append(main.bride_style.attire)
    if main.bride_style.hair:
        bride_parts.append(main.bride_style.hair)
    if main.bride_style.accessories:
        bride_parts.append(main.bride_style.accessories)
    if main.bride_style.pose:
        bride_parts.append(main.bride_style.pose)
    if bride_parts:
        parts.append(" ".join(bride_parts))

    # Quality
    if main.quality.technical:
        parts.append(main.quality.technical)

    # Join with proper punctuation
    return ". ".join(part.rstrip(". ") for part in parts if part) + "."


def build_negative_prompt(negative: NegativePrompt) -> str:
    """
    Build negative prompt from configuration.

    Args:
        negative: NegativePrompt configuration

    Returns:
        Assembled negative prompt string
    """
    parts = []

    if negative.style:
        parts.append(negative.style)
    if negative.quality:
        parts.append(negative.quality)
    if negative.mood:
        parts.append(negative.mood)

    return ", ".join(parts)


def apply_theme_prompts(
    workflow: dict,
    theme_slug: str = "white_studio",
    shot_type: str = "full_body",
    extra_style_tags: Optional[str] = None,
    groom_trigger: str = "GROOM_SDME",
    bride_trigger: str = "BRIDE_SDME",
    include_main_triggers: bool = False,
) -> dict:
    """
    Apply theme prompts to all 8 prompt nodes in workflow.

    Args:
        workflow: ComfyUI workflow dict
        theme_slug: Theme identifier
        shot_type: "full_body" or "closeup"
        extra_style_tags: Additional style tags to append
        groom_trigger: Groom LoRA trigger word
        bride_trigger: Bride LoRA trigger word
        include_main_triggers: Whether to include triggers in main prompt (A/B test)

    Returns:
        Modified workflow dict
    """
    # Load themes and get config (fallback to white_studio)
    themes = load_all_themes()
    theme = themes.get(theme_slug, themes.get("white_studio"))

    # If no themes loaded, return workflow unchanged
    if theme is None:
        print(f"Warning: No theme found for '{theme_slug}', no prompts applied")
        return workflow

    # Sanitize extra style tags
    if extra_style_tags:
        extra_style_tags = sanitize_extra_tags(extra_style_tags)
        extra_style_tags = lint_and_filter_tags(extra_style_tags)

    # =========================================================================
    # Node 6: Main Positive Prompt
    # =========================================================================
    main_positive = build_main_prompt(theme.main, shot_type)

    # Optional: Include triggers in main prompt (A/B testing)
    if include_main_triggers:
        main_positive = f"{groom_trigger}, {bride_trigger}, {main_positive}"

    # Append extra style tags
    if extra_style_tags:
        main_positive = f"{main_positive} {extra_style_tags}"

    workflow["6"]["inputs"]["text"] = main_positive

    # =========================================================================
    # Node 7: Main Negative Prompt
    # =========================================================================
    workflow["7"]["inputs"]["text"] = build_negative_prompt(theme.main.negative)

    # =========================================================================
    # Node 21: Groom Face Positive (TRIGGER FORCED)
    # =========================================================================
    groom_face_core = theme.groom_face.positive.core
    workflow["21"]["inputs"]["text"] = f"{groom_trigger}, {groom_face_core}"

    # =========================================================================
    # Node 26: Groom Face Negative
    # =========================================================================
    workflow["26"]["inputs"]["text"] = theme.groom_face.negative.core

    # =========================================================================
    # Node 23: Bride Face Positive (TRIGGER FORCED)
    # =========================================================================
    bride_face_core = theme.bride_face.positive.core
    workflow["23"]["inputs"]["text"] = f"{bride_trigger}, {bride_face_core}"

    # =========================================================================
    # Node 27: Bride Face Negative
    # =========================================================================
    workflow["27"]["inputs"]["text"] = theme.bride_face.negative.core

    # =========================================================================
    # Node 38: Hand Positive
    # =========================================================================
    workflow["38"]["inputs"]["text"] = theme.hand.positive

    # =========================================================================
    # Node 39: Hand Negative
    # =========================================================================
    workflow["39"]["inputs"]["text"] = theme.hand.negative

    return workflow


def apply_generation_settings(
    workflow: dict,
    width: int = 896,
    height: int = 1152,
    cfg: float = 7,
    steps: int = 25,
    seed: Optional[int] = None,
) -> dict:
    """
    Apply generation settings to workflow.

    Args:
        workflow: ComfyUI workflow dict
        width: Image width (default 896)
        height: Image height (default 1152)
        cfg: CFG scale (default 7)
        steps: Sampling steps (default 25)
        seed: Random seed (None for random)

    Returns:
        Modified workflow dict
    """
    # Node 5: EmptyLatentImage (dimensions)
    workflow["5"]["inputs"]["width"] = width
    workflow["5"]["inputs"]["height"] = height

    # Node 3: KSampler (generation params)
    workflow["3"]["inputs"]["cfg"] = cfg
    workflow["3"]["inputs"]["steps"] = steps

    # Seed handling
    if seed is not None:
        workflow["3"]["inputs"]["seed"] = seed
    else:
        workflow["3"]["inputs"]["seed"] = random.randint(0, 2**53)

    return workflow
