"""
Test cases for theme prompt system.

Tests cover:
- 8 prompt nodes replacement completeness
- LoRA trigger injection in Node 21/23
- White residue regression (garden/classic should not have white markers)
- Face prompt background prohibition lint
- Aspect ratio application (width/height)
- cfg/steps application
- YAML cache behavior
- extraStyleTags security filtering
"""

import pytest
import tempfile
import os
from pathlib import Path


class TestPromptTypes:
    """Test suite for prompt type definitions."""

    def test_theme_prompt_config_has_required_fields(self):
        """should define ThemePromptConfig with all required fields"""
        from modal.prompts.types import ThemePromptConfig

        # Check dataclass has required fields
        assert hasattr(ThemePromptConfig, "__dataclass_fields__")
        fields = ThemePromptConfig.__dataclass_fields__

        assert "meta" in fields
        assert "main" in fields
        assert "groom_face" in fields
        assert "bride_face" in fields
        assert "hand" in fields
        assert "generation" in fields
        assert "options" in fields

    def test_meta_config_has_slug_and_names(self):
        """should define MetaConfig with slug and name fields"""
        from modal.prompts.types import MetaConfig

        fields = MetaConfig.__dataclass_fields__
        assert "slug" in fields
        assert "name_ko" in fields
        assert "name_en" in fields

    def test_main_prompt_has_shot_type_sections(self):
        """should define MainPrompt with full_body and closeup sections"""
        from modal.prompts.types import MainPrompt

        fields = MainPrompt.__dataclass_fields__
        assert "full_body" in fields
        assert "closeup" in fields
        assert "scene" in fields
        assert "lighting" in fields
        assert "groom_style" in fields
        assert "bride_style" in fields
        assert "quality" in fields
        assert "negative" in fields

    def test_face_prompt_has_positive_and_negative(self):
        """should define FacePrompt with positive and negative sections"""
        from modal.prompts.types import FacePrompt

        fields = FacePrompt.__dataclass_fields__
        assert "positive" in fields
        assert "negative" in fields

    def test_generation_settings_has_cfg_steps_dimensions(self):
        """should define GenerationSettings with cfg, steps, width, height"""
        from modal.prompts.types import GenerationSettings

        fields = GenerationSettings.__dataclass_fields__
        assert "cfg" in fields
        assert "steps" in fields
        assert "width" in fields
        assert "height" in fields


class TestLintRules:
    """Test suite for lint rules and security filters."""

    def test_forbidden_background_keywords_defined(self):
        """should define FORBIDDEN_IN_FACE_PROMPT list"""
        from modal.prompts.lint_rules import FORBIDDEN_IN_FACE_PROMPT

        assert isinstance(FORBIDDEN_IN_FACE_PROMPT, list)
        assert len(FORBIDDEN_IN_FACE_PROMPT) > 0

        # Check specific forbidden keywords
        assert "garden" in FORBIDDEN_IN_FACE_PROMPT
        assert "ballroom" in FORBIDDEN_IN_FACE_PROMPT
        assert "chandelier" in FORBIDDEN_IN_FACE_PROMPT
        assert "background" in FORBIDDEN_IN_FACE_PROMPT

    def test_studio_not_in_forbidden_list(self):
        """should NOT include 'studio' in forbidden list (false positive for 'studio lighting')"""
        from modal.prompts.lint_rules import FORBIDDEN_IN_FACE_PROMPT

        assert "studio" not in FORBIDDEN_IN_FACE_PROMPT

    def test_sanitize_extra_tags_removes_special_chars(self):
        """should remove special characters from extraStyleTags"""
        from modal.prompts.lint_rules import sanitize_extra_tags

        # Valid input passes through
        assert sanitize_extra_tags("cinematic, warm light") == "cinematic, warm light"

        # Special characters removed
        result = sanitize_extra_tags("hack<script>alert</script>")
        assert "<" not in result
        assert ">" not in result

    def test_sanitize_extra_tags_limits_length(self):
        """should limit extraStyleTags to MAX_EXTRA_TAGS_LENGTH"""
        from modal.prompts.lint_rules import sanitize_extra_tags, MAX_EXTRA_TAGS_LENGTH

        long_input = "a" * 500
        result = sanitize_extra_tags(long_input)
        assert len(result) <= MAX_EXTRA_TAGS_LENGTH

    def test_sanitize_extra_tags_handles_empty(self):
        """should return empty string for None/empty input"""
        from modal.prompts.lint_rules import sanitize_extra_tags

        assert sanitize_extra_tags("") == ""
        assert sanitize_extra_tags(None) == ""

    def test_max_extra_tags_length_is_reasonable(self):
        """should have MAX_EXTRA_TAGS_LENGTH in reasonable range"""
        from modal.prompts.lint_rules import MAX_EXTRA_TAGS_LENGTH

        assert isinstance(MAX_EXTRA_TAGS_LENGTH, int)
        assert 50 <= MAX_EXTRA_TAGS_LENGTH <= 1000

    def test_check_face_prompt_lint_detects_background(self):
        """should detect forbidden background keywords in face prompt"""
        from modal.prompts.lint_rules import check_face_prompt_lint

        # Clean prompt passes
        clean_prompt = "closeup portrait, soft lighting, gentle smile"
        errors = check_face_prompt_lint(clean_prompt)
        assert len(errors) == 0

        # Forbidden keywords detected
        bad_prompt = "portrait in a garden with chandeliers"
        errors = check_face_prompt_lint(bad_prompt)
        assert len(errors) > 0
        assert any("garden" in e.lower() for e in errors)

    def test_soft_studio_lighting_not_flagged(self):
        """should NOT flag 'soft studio lighting' as violation"""
        from modal.prompts.lint_rules import check_face_prompt_lint

        prompt = "closeup portrait with soft studio lighting on face"
        errors = check_face_prompt_lint(prompt)
        assert len(errors) == 0


class TestYAMLLoader:
    """Test suite for YAML loading and caching."""

    def test_get_prompts_dir_returns_valid_path(self):
        """should return valid prompts directory path"""
        from modal.prompts.loader import get_prompts_dir

        path = get_prompts_dir()
        assert isinstance(path, Path)
        # In test environment, path should exist
        assert path.exists() or "prompts" in str(path)

    def test_load_theme_parses_yaml_correctly(self):
        """should parse YAML into ThemePromptConfig"""
        from modal.prompts.loader import load_theme
        from modal.prompts.types import ThemePromptConfig

        # Get path to white_studio.yaml
        prompts_dir = Path(__file__).parent.parent
        theme_path = prompts_dir / "themes" / "white_studio.yaml"

        if theme_path.exists():
            config = load_theme(theme_path)
            assert isinstance(config, ThemePromptConfig)
            assert config.meta.slug == "white_studio"

    def test_load_all_themes_returns_dict(self):
        """should return dict of theme slug -> ThemePromptConfig"""
        from modal.prompts.loader import load_all_themes

        themes = load_all_themes()
        assert isinstance(themes, dict)

        if len(themes) > 0:
            for slug, config in themes.items():
                assert isinstance(slug, str)

    def test_load_all_themes_is_cached(self):
        """should cache theme loading (same object returned)"""
        from modal.prompts.loader import load_all_themes

        themes1 = load_all_themes()
        themes2 = load_all_themes()

        # Should be same object due to caching
        assert themes1 is themes2


class TestPromptBuilder:
    """Test suite for prompt building functions."""

    def test_build_main_prompt_full_body(self):
        """should build main prompt for full_body shot type"""
        from modal.prompts.builder import build_main_prompt
        from modal.prompts.loader import load_all_themes

        themes = load_all_themes()
        if "white_studio" in themes:
            theme = themes["white_studio"]
            prompt = build_main_prompt(theme.main, "full_body")

            assert isinstance(prompt, str)
            assert len(prompt) > 0
            # Should include camera/composition for full_body
            assert "body" in prompt.lower() or "couple" in prompt.lower()

    def test_build_main_prompt_closeup(self):
        """should build main prompt for closeup shot type (fallback when closeup is None)"""
        from modal.prompts.builder import build_main_prompt
        from modal.prompts.loader import load_all_themes

        themes = load_all_themes()
        if "white_studio" in themes:
            theme = themes["white_studio"]
            prompt = build_main_prompt(theme.main, "closeup")

            assert isinstance(prompt, str)
            assert len(prompt) > 0
            # white_studio has no closeup section, so it falls back to full_body
            # Just verify a valid prompt is produced
            if theme.main.closeup is None:
                # Should use full_body content as fallback
                assert "studio" in prompt.lower() or "portrait" in prompt.lower()
            else:
                assert "upper" in prompt.lower() or "close" in prompt.lower()

    def test_build_negative_prompt(self):
        """should build negative prompt from config"""
        from modal.prompts.builder import build_negative_prompt
        from modal.prompts.types import NegativePrompt

        negative = NegativePrompt(
            style="illustration, anime",
            quality="low quality, blurry",
            mood="dark, gloomy"
        )

        result = build_negative_prompt(negative)
        assert "illustration" in result
        assert "low quality" in result
        assert "dark" in result


class TestApplyThemePrompts:
    """Test suite for workflow prompt application."""

    @pytest.fixture
    def sample_workflow(self):
        """Create minimal workflow structure for testing."""
        return {
            "3": {"inputs": {"seed": 0, "steps": 20, "cfg": 1}},
            "5": {"inputs": {"width": 1024, "height": 1024, "batch_size": 1}},
            "6": {"inputs": {"text": "original main positive"}},
            "7": {"inputs": {"text": "original main negative"}},
            "21": {"inputs": {"text": "original groom face positive"}},
            "23": {"inputs": {"text": "original bride face positive"}},
            "26": {"inputs": {"text": "original groom face negative"}},
            "27": {"inputs": {"text": "original bride face negative"}},
            "38": {"inputs": {"text": "original hand positive"}},
            "39": {"inputs": {"text": "original hand negative"}},
        }

    def test_apply_replaces_all_8_prompt_nodes(self, sample_workflow):
        """should replace all 8 prompt nodes with meaningful content"""
        from modal.prompts.builder import apply_theme_prompts

        result = apply_theme_prompts(
            sample_workflow,
            theme_slug="white_studio",
            shot_type="full_body",
        )

        # All prompt nodes should be modified with non-empty content
        prompt_nodes = ["6", "7", "21", "23", "26", "27", "38", "39"]
        for node_id in prompt_nodes:
            text = result[node_id]["inputs"]["text"]
            assert isinstance(text, str), f"Node {node_id} text is not a string"
            # Node 39 (hand negative) can be empty per design
            if node_id != "39":
                assert len(text) > 0, f"Node {node_id} prompt is empty"

        # Verify content differs from original
        assert result["6"]["inputs"]["text"] != "original main positive"
        assert result["7"]["inputs"]["text"] != "original main negative"
        assert result["21"]["inputs"]["text"] != "original groom face positive"
        assert result["23"]["inputs"]["text"] != "original bride face positive"
        assert result["26"]["inputs"]["text"] != "original groom face negative"
        assert result["27"]["inputs"]["text"] != "original bride face negative"
        assert result["38"]["inputs"]["text"] != "original hand positive"
        assert result["39"]["inputs"]["text"] != "original hand negative"

    def test_lora_trigger_always_in_node_21(self, sample_workflow):
        """should always include GROOM trigger in Node 21"""
        from modal.prompts.builder import apply_theme_prompts

        result = apply_theme_prompts(
            sample_workflow,
            theme_slug="white_studio",
            groom_trigger="GROOM_SDME",
        )

        node_21_text = result["21"]["inputs"]["text"]
        assert "GROOM_SDME" in node_21_text

    def test_lora_trigger_always_in_node_23(self, sample_workflow):
        """should always include BRIDE trigger in Node 23"""
        from modal.prompts.builder import apply_theme_prompts

        result = apply_theme_prompts(
            sample_workflow,
            theme_slug="white_studio",
            bride_trigger="BRIDE_SDME",
        )

        node_23_text = result["23"]["inputs"]["text"]
        assert "BRIDE_SDME" in node_23_text

    def test_custom_triggers_applied(self, sample_workflow):
        """should apply custom trigger words"""
        from modal.prompts.builder import apply_theme_prompts

        result = apply_theme_prompts(
            sample_workflow,
            theme_slug="white_studio",
            groom_trigger="CUSTOM_GROOM",
            bride_trigger="CUSTOM_BRIDE",
        )

        assert "CUSTOM_GROOM" in result["21"]["inputs"]["text"]
        assert "CUSTOM_BRIDE" in result["23"]["inputs"]["text"]

    def test_main_triggers_off_by_default(self, sample_workflow):
        """should NOT include triggers in main prompt by default"""
        from modal.prompts.builder import apply_theme_prompts

        result = apply_theme_prompts(
            sample_workflow,
            theme_slug="white_studio",
            groom_trigger="GROOM_SDME",
            bride_trigger="BRIDE_SDME",
            include_main_triggers=False,
        )

        main_text = result["6"]["inputs"]["text"]
        assert "GROOM_SDME" not in main_text
        assert "BRIDE_SDME" not in main_text

    def test_main_triggers_on_option(self, sample_workflow):
        """should include triggers in main prompt when option enabled"""
        from modal.prompts.builder import apply_theme_prompts

        result = apply_theme_prompts(
            sample_workflow,
            theme_slug="white_studio",
            groom_trigger="GROOM_SDME",
            bride_trigger="BRIDE_SDME",
            include_main_triggers=True,
        )

        main_text = result["6"]["inputs"]["text"]
        assert "GROOM_SDME" in main_text
        assert "BRIDE_SDME" in main_text

    def test_extra_style_tags_appended(self, sample_workflow):
        """should append extraStyleTags to main prompt"""
        from modal.prompts.builder import apply_theme_prompts

        result = apply_theme_prompts(
            sample_workflow,
            theme_slug="white_studio",
            extra_style_tags="cinematic, warm light",
        )

        main_text = result["6"]["inputs"]["text"]
        assert "cinematic" in main_text
        assert "warm light" in main_text

    def test_extra_style_tags_sanitized(self, sample_workflow):
        """should sanitize extraStyleTags before appending"""
        from modal.prompts.builder import apply_theme_prompts

        result = apply_theme_prompts(
            sample_workflow,
            theme_slug="white_studio",
            extra_style_tags="valid<script>hack</script>",
        )

        main_text = result["6"]["inputs"]["text"]
        assert "<script>" not in main_text

    def test_falls_back_to_white_studio(self, sample_workflow):
        """should fallback to white_studio for unknown theme"""
        from modal.prompts.builder import apply_theme_prompts

        result = apply_theme_prompts(
            sample_workflow,
            theme_slug="unknown_theme",
        )

        # Should still apply prompts (fallback)
        assert result["6"]["inputs"]["text"] != "original main positive"
        # Verify fallback applied valid content
        assert len(result["6"]["inputs"]["text"]) > 0

    def test_both_triggers_no_duplication(self, sample_workflow):
        """should apply triggers without duplication"""
        from modal.prompts.builder import apply_theme_prompts

        result = apply_theme_prompts(
            sample_workflow,
            theme_slug="white_studio",
            groom_trigger="GROOM_TAG",
            bride_trigger="BRIDE_TAG",
        )

        groom_text = result["21"]["inputs"]["text"]
        bride_text = result["23"]["inputs"]["text"]

        # Each trigger should appear exactly once
        assert groom_text.count("GROOM_TAG") == 1
        assert bride_text.count("BRIDE_TAG") == 1

    def test_trigger_at_start_of_face_prompt(self, sample_workflow):
        """should place trigger at start of face prompt"""
        from modal.prompts.builder import apply_theme_prompts

        result = apply_theme_prompts(
            sample_workflow,
            theme_slug="white_studio",
            groom_trigger="GROOM_SDME",
            bride_trigger="BRIDE_SDME",
        )

        # Triggers should be at the start
        assert result["21"]["inputs"]["text"].startswith("GROOM_SDME")
        assert result["23"]["inputs"]["text"].startswith("BRIDE_SDME")


class TestApplyGenerationSettings:
    """Test suite for generation settings application."""

    @pytest.fixture
    def sample_workflow(self):
        """Create minimal workflow structure for testing."""
        return {
            "3": {"inputs": {"seed": 0, "steps": 20, "cfg": 1}},
            "5": {"inputs": {"width": 1024, "height": 1024, "batch_size": 1}},
        }

    def test_applies_width_height(self, sample_workflow):
        """should apply width and height to Node 5"""
        from modal.prompts.builder import apply_generation_settings

        result = apply_generation_settings(
            sample_workflow,
            width=896,
            height=1152,
        )

        assert result["5"]["inputs"]["width"] == 896
        assert result["5"]["inputs"]["height"] == 1152

    def test_applies_cfg_steps(self, sample_workflow):
        """should apply cfg and steps to Node 3"""
        from modal.prompts.builder import apply_generation_settings

        result = apply_generation_settings(
            sample_workflow,
            cfg=7,
            steps=25,
        )

        assert result["3"]["inputs"]["cfg"] == 7
        assert result["3"]["inputs"]["steps"] == 25

    def test_applies_seed_when_provided(self, sample_workflow):
        """should apply specific seed when provided"""
        from modal.prompts.builder import apply_generation_settings

        result = apply_generation_settings(
            sample_workflow,
            seed=12345,
        )

        assert result["3"]["inputs"]["seed"] == 12345

    def test_generates_random_seed_when_none(self, sample_workflow):
        """should generate random seed when not provided"""
        from modal.prompts.builder import apply_generation_settings

        result = apply_generation_settings(
            sample_workflow,
            seed=None,
        )

        seed = result["3"]["inputs"]["seed"]
        assert isinstance(seed, int)
        assert 0 <= seed <= 2**53

    def test_default_values(self, sample_workflow):
        """should use default values: 896x1152, cfg=7, steps=25"""
        from modal.prompts.builder import apply_generation_settings

        result = apply_generation_settings(sample_workflow)

        assert result["5"]["inputs"]["width"] == 896
        assert result["5"]["inputs"]["height"] == 1152
        assert result["3"]["inputs"]["cfg"] == 7
        assert result["3"]["inputs"]["steps"] == 25

    def test_preserves_batch_size(self, sample_workflow):
        """should preserve batch_size when applying settings"""
        from modal.prompts.builder import apply_generation_settings

        original_batch = sample_workflow["5"]["inputs"]["batch_size"]

        result = apply_generation_settings(
            sample_workflow,
            width=768,
            height=1024,
        )

        assert result["5"]["inputs"]["batch_size"] == original_batch


class TestWhiteResidueRegression:
    """Test suite for white residue regression prevention."""

    @pytest.fixture
    def sample_workflow(self):
        """Create minimal workflow structure."""
        return {
            "3": {"inputs": {"seed": 0, "steps": 20, "cfg": 1}},
            "5": {"inputs": {"width": 1024, "height": 1024, "batch_size": 1}},
            "6": {"inputs": {"text": ""}},
            "7": {"inputs": {"text": ""}},
            "21": {"inputs": {"text": ""}},
            "23": {"inputs": {"text": ""}},
            "26": {"inputs": {"text": ""}},
            "27": {"inputs": {"text": ""}},
            "38": {"inputs": {"text": ""}},
            "39": {"inputs": {"text": ""}},
        }

    def test_garden_theme_no_white_keywords(self, sample_workflow):
        """garden_studio should NOT contain 'white wall' or 'white horizon'"""
        from modal.prompts.builder import apply_theme_prompts

        result = apply_theme_prompts(
            sample_workflow,
            theme_slug="garden_studio",
        )

        main_text = result["6"]["inputs"]["text"].lower()
        assert "white wall" not in main_text
        assert "white horizon" not in main_text

    def test_classic_theme_no_white_keywords(self, sample_workflow):
        """classic_studio should NOT contain 'white wall' or 'white horizon'"""
        from modal.prompts.builder import apply_theme_prompts

        result = apply_theme_prompts(
            sample_workflow,
            theme_slug="classic_studio",
        )

        main_text = result["6"]["inputs"]["text"].lower()
        assert "white wall" not in main_text
        assert "white horizon" not in main_text

    def test_white_studio_has_white_elements(self, sample_workflow):
        """white_studio should contain white background elements"""
        from modal.prompts.builder import apply_theme_prompts

        result = apply_theme_prompts(
            sample_workflow,
            theme_slug="white_studio",
        )

        main_text = result["6"]["inputs"]["text"].lower()
        # White studio should have white elements
        assert "white" in main_text


class TestFacePromptBackgroundProhibition:
    """Test suite for face prompt background prohibition."""

    @pytest.fixture
    def sample_workflow(self):
        """Create minimal workflow structure."""
        return {
            "3": {"inputs": {"seed": 0, "steps": 20, "cfg": 1}},
            "5": {"inputs": {"width": 1024, "height": 1024, "batch_size": 1}},
            "6": {"inputs": {"text": ""}},
            "7": {"inputs": {"text": ""}},
            "21": {"inputs": {"text": ""}},
            "23": {"inputs": {"text": ""}},
            "26": {"inputs": {"text": ""}},
            "27": {"inputs": {"text": ""}},
            "38": {"inputs": {"text": ""}},
            "39": {"inputs": {"text": ""}},
        }

    def test_groom_face_no_background_keywords(self, sample_workflow):
        """Node 21 (groom face) should not contain background keywords"""
        from modal.prompts.builder import apply_theme_prompts
        from modal.prompts.lint_rules import FORBIDDEN_IN_FACE_PROMPT

        for theme_slug in ["white_studio", "garden_studio", "classic_studio"]:
            result = apply_theme_prompts(sample_workflow.copy(), theme_slug=theme_slug)
            face_text = result["21"]["inputs"]["text"].lower()

            for forbidden in FORBIDDEN_IN_FACE_PROMPT:
                assert forbidden not in face_text, f"{forbidden} found in groom face for {theme_slug}"

    def test_bride_face_no_background_keywords(self, sample_workflow):
        """Node 23 (bride face) should not contain background keywords"""
        from modal.prompts.builder import apply_theme_prompts
        from modal.prompts.lint_rules import FORBIDDEN_IN_FACE_PROMPT

        for theme_slug in ["white_studio", "garden_studio", "classic_studio"]:
            result = apply_theme_prompts(sample_workflow.copy(), theme_slug=theme_slug)
            face_text = result["23"]["inputs"]["text"].lower()

            for forbidden in FORBIDDEN_IN_FACE_PROMPT:
                assert forbidden not in face_text, f"{forbidden} found in bride face for {theme_slug}"


class TestHandPrompts:
    """Test suite for hand prompt handling."""

    @pytest.fixture
    def sample_workflow(self):
        """Create minimal workflow structure."""
        return {
            "3": {"inputs": {"seed": 0, "steps": 20, "cfg": 1}},
            "5": {"inputs": {"width": 1024, "height": 1024, "batch_size": 1}},
            "6": {"inputs": {"text": ""}},
            "7": {"inputs": {"text": ""}},
            "21": {"inputs": {"text": ""}},
            "23": {"inputs": {"text": ""}},
            "26": {"inputs": {"text": ""}},
            "27": {"inputs": {"text": ""}},
            "38": {"inputs": {"text": ""}},
            "39": {"inputs": {"text": ""}},
        }

    def test_hand_positive_has_content(self, sample_workflow):
        """Node 38 (hand positive) should have meaningful content"""
        from modal.prompts.builder import apply_theme_prompts

        result = apply_theme_prompts(sample_workflow, theme_slug="white_studio")
        hand_positive = result["38"]["inputs"]["text"]

        assert isinstance(hand_positive, str)
        assert len(hand_positive) > 0

    def test_hand_negative_can_be_empty(self, sample_workflow):
        """Node 39 (hand negative) can be empty by design"""
        from modal.prompts.builder import apply_theme_prompts

        result = apply_theme_prompts(sample_workflow, theme_slug="white_studio")
        hand_negative = result["39"]["inputs"]["text"]

        # Empty is allowed for hand negative
        assert isinstance(hand_negative, str)


class TestThemePromptsExport:
    """Test suite for THEME_PROMPTS export."""

    def test_theme_prompts_dict_exported(self):
        """should export THEME_PROMPTS dict from __init__"""
        from modal.prompts import THEME_PROMPTS

        assert isinstance(THEME_PROMPTS, dict)

    def test_contains_three_themes(self):
        """should contain white_studio, garden_studio, classic_studio"""
        from modal.prompts import THEME_PROMPTS

        assert "white_studio" in THEME_PROMPTS
        assert "garden_studio" in THEME_PROMPTS
        assert "classic_studio" in THEME_PROMPTS

    def test_apply_functions_exported(self):
        """should export apply_theme_prompts and apply_generation_settings"""
        from modal.prompts import apply_theme_prompts, apply_generation_settings

        assert callable(apply_theme_prompts)
        assert callable(apply_generation_settings)
