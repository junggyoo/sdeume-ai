"""
Lint rules and security filters for prompt system.

Enforces FaceDetailer background prohibition and input sanitization.
"""

import re
from typing import List, Optional

# =============================================================================
# Face Prompt Background Prohibition
# =============================================================================

# Keywords forbidden in face prompts (would cause hallucination in FaceDetailer)
# NOTE: "studio" is intentionally excluded to avoid false positives like "soft studio lighting"
FORBIDDEN_IN_FACE_PROMPT: List[str] = [
    "garden",
    "ballroom",
    "chandelier",
    "flowers",
    "foliage",
    "background",
    "interior",
    "outdoor",
    "indoor",
    "wall",
    "horizon",
    "scenery",
    "marble",
    "velvet",
    "drapes",
]

# Excessive anatomy negative patterns (warning only)
EXCESSIVE_NEGATIVE_PATTERNS: List[str] = [
    "malformed hands",
    "fused fingers",
    "extra fingers",
    "missing fingers",
    "too many fingers",
]


def check_face_prompt_lint(prompt: str) -> List[str]:
    """
    Check face prompt for forbidden background keywords.

    Args:
        prompt: The face prompt text to check

    Returns:
        List of error messages for violations found
    """
    errors: List[str] = []
    prompt_lower = prompt.lower()

    for keyword in FORBIDDEN_IN_FACE_PROMPT:
        if keyword in prompt_lower:
            errors.append(f"Forbidden keyword '{keyword}' found in face prompt")

    return errors


# =============================================================================
# Extra Style Tags Security Filter
# =============================================================================

# Only allow alphanumeric, spaces, commas, periods, hyphens
ALLOWED_CHARS_PATTERN = re.compile(r'^[a-zA-Z0-9\s,.\-]+$')

# Maximum length for extra style tags
MAX_EXTRA_TAGS_LENGTH: int = 200


def sanitize_extra_tags(tags: Optional[str]) -> str:
    """
    Sanitize extraStyleTags input for security.

    - Removes special characters that could cause injection
    - Limits length to MAX_EXTRA_TAGS_LENGTH

    Args:
        tags: Raw input string from user

    Returns:
        Sanitized string safe for prompt injection
    """
    if not tags:
        return ""

    # Remove any characters not in allowed set
    if not ALLOWED_CHARS_PATTERN.match(tags):
        # Filter to only allowed characters
        tags = re.sub(r'[^a-zA-Z0-9\s,.\-]', '', tags)

    # Limit length
    return tags[:MAX_EXTRA_TAGS_LENGTH]


def lint_and_filter_tags(tags: str) -> str:
    """
    Additional lint filtering for style tags.

    Removes excessive whitespace and normalizes format.

    Args:
        tags: Pre-sanitized tags string

    Returns:
        Cleaned tags string
    """
    if not tags:
        return ""

    # Normalize whitespace
    tags = re.sub(r'\s+', ' ', tags)

    # Remove leading/trailing whitespace
    tags = tags.strip()

    # Remove multiple consecutive commas
    tags = re.sub(r',\s*,+', ',', tags)

    # Remove leading/trailing commas
    tags = tags.strip(',').strip()

    return tags
