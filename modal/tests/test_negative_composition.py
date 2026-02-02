"""
Test cases for negative.composition field support.

Verifies that the composition field in negative prompts (e.g., position reversal
prevention tags) is properly parsed from YAML and included in the built negative prompt.
"""

import pytest
from pathlib import Path


class TestNegativeCompositionType:
    """Test NegativePrompt dataclass includes composition field."""

    def test_negative_prompt_has_composition_field(self):
        """NegativePrompt should accept an optional composition field"""
        from prompts.types import NegativePrompt

        neg = NegativePrompt(
            style="illustration",
            quality="low quality",
            mood="dark",
            composition="(groom on right:1.5)",
        )
        assert neg.composition == "(groom on right:1.5)"

    def test_negative_prompt_composition_defaults_to_none(self):
        """NegativePrompt composition should default to None"""
        from prompts.types import NegativePrompt

        neg = NegativePrompt(style="a", quality="b", mood="c")
        assert neg.composition is None


class TestNegativeCompositionLoader:
    """Test YAML loader parses composition field."""

    def test_parse_negative_includes_composition(self):
        """_parse_negative should parse composition from YAML data"""
        from prompts.loader import _parse_negative

        data = {
            "style": "illustration",
            "quality": "low quality",
            "mood": "dark",
            "composition": "(groom on right:1.5)",
        }
        result = _parse_negative(data)
        assert result.composition == "(groom on right:1.5)"

    def test_parse_negative_composition_defaults_to_none(self):
        """_parse_negative should default composition to None when absent"""
        from prompts.loader import _parse_negative

        data = {"style": "a", "quality": "b", "mood": "c"}
        result = _parse_negative(data)
        assert result.composition is None

    def test_white_studio_has_composition(self):
        """white_studio.yaml should have negative.composition loaded"""
        from prompts.loader import load_theme

        themes_dir = Path(__file__).parent.parent / "prompts" / "themes"
        theme = load_theme(themes_dir / "white_studio.yaml")
        assert theme.main.negative.composition is not None
        assert "groom" in theme.main.negative.composition.lower() or "bride" in theme.main.negative.composition.lower()


class TestNegativeCompositionBuilder:
    """Test prompt builder includes composition in output."""

    def test_build_negative_includes_composition(self):
        """build_negative_prompt should include composition when present"""
        from prompts.types import NegativePrompt
        from prompts.builder import build_negative_prompt

        neg = NegativePrompt(
            style="illustration",
            quality="low quality",
            mood="dark",
            composition="(groom on right:1.5)",
        )
        result = build_negative_prompt(neg)
        assert "(groom on right:1.5)" in result

    def test_build_negative_omits_composition_when_none(self):
        """build_negative_prompt should work without composition"""
        from prompts.types import NegativePrompt
        from prompts.builder import build_negative_prompt

        neg = NegativePrompt(style="illustration", quality="low quality", mood="dark")
        result = build_negative_prompt(neg)
        assert result == "illustration, low quality, dark"
