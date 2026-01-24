#!/usr/bin/env python3
"""
Debug script to trace prompt generation and workflow node application.

Usage (from project root):
    cd modal && python -c "exec(open('prompts/debug_prompts.py').read())"

Or:
    cd modal && python prompts/debug_prompts.py [theme_slug]

Examples:
    cd modal && python prompts/debug_prompts.py                    # All themes
    cd modal && python prompts/debug_prompts.py white_studio       # Specific theme
    cd modal && python prompts/debug_prompts.py --compare          # Compare themes
"""

import json
import sys
from pathlib import Path

# IMPORTANT: Run this script from the 'modal' directory to avoid
# conflict with Python's built-in 'types' module.
# Example: cd modal && python prompts/debug_prompts.py

from prompts.loader import load_all_themes
from prompts.builder import (
    build_main_prompt,
    build_negative_prompt,
    apply_theme_prompts,
    apply_generation_settings,
)

# Minimal workflow template for testing (only prompt nodes)
WORKFLOW_TEMPLATE = {
    "3": {"inputs": {"seed": 0, "steps": 25, "cfg": 1, "sampler_name": "euler", "scheduler": "simple", "denoise": 1}},
    "5": {"inputs": {"width": 1024, "height": 1024, "batch_size": 1}},
    "6": {"inputs": {"text": "PLACEHOLDER_MAIN_POSITIVE"}},
    "7": {"inputs": {"text": "PLACEHOLDER_MAIN_NEGATIVE"}},
    "21": {"inputs": {"text": "PLACEHOLDER_GROOM_FACE_POSITIVE"}},
    "23": {"inputs": {"text": "PLACEHOLDER_BRIDE_FACE_POSITIVE"}},
    "26": {"inputs": {"text": "PLACEHOLDER_GROOM_FACE_NEGATIVE"}},
    "27": {"inputs": {"text": "PLACEHOLDER_BRIDE_FACE_NEGATIVE"}},
    "38": {"inputs": {"text": "PLACEHOLDER_HAND_POSITIVE"}},
    "39": {"inputs": {"text": "PLACEHOLDER_HAND_NEGATIVE"}},
}

NODE_DESCRIPTIONS = {
    "3": "KSampler (Generation Settings)",
    "5": "EmptyLatentImage (Dimensions)",
    "6": "Main Positive Prompt",
    "7": "Main Negative Prompt",
    "21": "Groom Face Positive (with GROOM_SDME trigger)",
    "23": "Bride Face Positive (with BRIDE_SDME trigger)",
    "26": "Groom Face Negative",
    "27": "Bride Face Negative",
    "38": "Hand Positive",
    "39": "Hand Negative",
}


def print_separator(char: str = "=", length: int = 80):
    print(char * length)


def print_header(title: str):
    print_separator()
    print(f"  {title}")
    print_separator()


def trace_theme(theme_slug: str, shot_type: str = "full_body"):
    """Trace prompt generation for a specific theme."""
    themes = load_all_themes()

    if theme_slug not in themes:
        print(f"Error: Theme '{theme_slug}' not found. Available: {list(themes.keys())}")
        return

    theme = themes[theme_slug]

    print_header(f"THEME: {theme.meta.name_ko} ({theme_slug})")
    print(f"Description: {theme.meta.description}")
    print()

    # 1. Show raw prompt components
    print_header("1. RAW PROMPT COMPONENTS")

    shot = theme.main.full_body if shot_type == "full_body" else theme.main.closeup

    print(f"\n[Shot Type: {shot_type}]")
    print(f"  Camera: {shot.camera}")
    print(f"  Composition: {shot.composition}")

    print(f"\n[Scene]")
    print(f"  Background: {theme.main.scene.background}")
    print(f"  Atmosphere: {theme.main.scene.atmosphere}")

    print(f"\n[Lighting]")
    print(f"  Description: {theme.main.lighting.description}")

    print(f"\n[Groom Style]")
    print(f"  Attire: {theme.main.groom_style.attire}")
    print(f"  Hair: {theme.main.groom_style.hair}")
    print(f"  Pose: {theme.main.groom_style.pose}")

    print(f"\n[Bride Style]")
    print(f"  Attire: {theme.main.bride_style.attire}")
    print(f"  Hair: {theme.main.bride_style.hair}")
    print(f"  Accessories: {theme.main.bride_style.accessories}")
    print(f"  Pose: {theme.main.bride_style.pose}")

    print(f"\n[Quality]")
    print(f"  Technical: {theme.main.quality.technical}")

    print(f"\n[Negative]")
    print(f"  Style: {theme.main.negative.style}")
    print(f"  Quality: {theme.main.negative.quality}")
    print(f"  Mood: {theme.main.negative.mood}")

    print(f"\n[Face Prompts]")
    print(f"  Groom Positive: {theme.groom_face.positive.core}")
    print(f"  Groom Negative: {theme.groom_face.negative.core}")
    print(f"  Bride Positive: {theme.bride_face.positive.core}")
    print(f"  Bride Negative: {theme.bride_face.negative.core}")

    print(f"\n[Hand Prompts]")
    print(f"  Positive: {theme.hand.positive}")
    print(f"  Negative: {theme.hand.negative}")

    print(f"\n[Generation Settings]")
    print(f"  CFG: {theme.generation.cfg}")
    print(f"  Steps: {theme.generation.steps}")
    print(f"  Width: {theme.generation.width}")
    print(f"  Height: {theme.generation.height}")

    # 2. Show assembled prompts
    print_header("2. ASSEMBLED PROMPTS")

    main_positive = build_main_prompt(theme.main, shot_type)
    main_negative = build_negative_prompt(theme.main.negative)

    print(f"\n[Main Positive (Node 6)]")
    print(f"  {main_positive}")

    print(f"\n[Main Negative (Node 7)]")
    print(f"  {main_negative}")

    print(f"\n[Groom Face Positive (Node 21) - with trigger]")
    print(f"  GROOM_SDME, {theme.groom_face.positive.core}")

    print(f"\n[Bride Face Positive (Node 23) - with trigger]")
    print(f"  BRIDE_SDME, {theme.bride_face.positive.core}")

    # 3. Show workflow application
    print_header("3. WORKFLOW NODE APPLICATION")

    workflow = json.loads(json.dumps(WORKFLOW_TEMPLATE))  # Deep copy

    workflow = apply_theme_prompts(
        workflow,
        theme_slug=theme_slug,
        shot_type=shot_type,
        groom_trigger="GROOM_SDME",
        bride_trigger="BRIDE_SDME",
    )

    workflow = apply_generation_settings(
        workflow,
        width=theme.generation.width,
        height=theme.generation.height,
        cfg=theme.generation.cfg,
        steps=theme.generation.steps,
        seed=12345,  # Fixed seed for testing
    )

    for node_id, description in NODE_DESCRIPTIONS.items():
        print(f"\n[Node {node_id}] {description}")
        inputs = workflow[node_id]["inputs"]

        if "text" in inputs:
            text = inputs["text"]
            # Truncate long text for display
            if len(text) > 200:
                print(f"  Text: {text[:200]}...")
                print(f"  (Total length: {len(text)} chars)")
            else:
                print(f"  Text: {text}")
        else:
            for key, value in inputs.items():
                if key not in ["model", "positive", "negative", "latent_image", "clip", "segs", "image", "vae", "bbox_detector"]:
                    print(f"  {key}: {value}")

    print()
    print_separator()
    print()


def trace_all_themes():
    """Trace all available themes."""
    themes = load_all_themes()

    print_header("AVAILABLE THEMES")
    for slug, theme in themes.items():
        print(f"  - {slug}: {theme.meta.name_ko}")
    print()

    for slug in themes.keys():
        trace_theme(slug)


def compare_themes():
    """Compare key differences between themes."""
    themes = load_all_themes()

    print_header("THEME COMPARISON")

    print("\n[Background]")
    for slug, theme in themes.items():
        print(f"  {slug}: {theme.main.scene.background[:80]}...")

    print("\n[Lighting]")
    for slug, theme in themes.items():
        print(f"  {slug}: {theme.main.lighting.description[:80]}...")

    print("\n[Groom Attire]")
    for slug, theme in themes.items():
        print(f"  {slug}: {theme.main.groom_style.attire}")

    print("\n[Bride Attire]")
    for slug, theme in themes.items():
        print(f"  {slug}: {theme.main.bride_style.attire}")

    print("\n[Negative Mood]")
    for slug, theme in themes.items():
        print(f"  {slug}: {theme.main.negative.mood}")

    print()


if __name__ == "__main__":
    if len(sys.argv) > 1:
        theme_arg = sys.argv[1]
        if theme_arg == "--compare":
            compare_themes()
        else:
            trace_theme(theme_arg)
    else:
        trace_all_themes()
