"""
Test cases for convert_diffusers_to_comfyui_flux_lora function.

Tests PEFT/Diffusers format to ComfyUI format conversion including:
- Single transformer blocks Q/K/V merging to linear1
- Single transformer blocks proj_out to linear2
- Double transformer blocks image Q/K/V merging to img_attn_qkv
- Double transformer blocks text Q/K/V merging to txt_attn_qkv
- Double transformer blocks to_out.0 to img_attn_proj
- Double transformer blocks to_add_out to txt_attn_proj
- transformer.proj_out to lora_unet_proj_out
- Alpha/scale key preservation
"""

import os
import sys
import tempfile
import pytest
import torch
from safetensors.torch import save_file, load_file

# Import the function from production code
# Since modal module may not be available, we extract the function dynamically
def _load_convert_function():
    """Load convert_diffusers_to_comfyui_flux_lora from production code."""
    import re

    # Read the production file
    production_file = os.path.join(
        os.path.dirname(os.path.dirname(__file__)),
        "comfyui_workflow.py"
    )

    with open(production_file, "r") as f:
        content = f.read()

    # Extract the function using regex - find from def to next def at same level or end of file
    pattern = r"(def convert_diffusers_to_comfyui_flux_lora\(input_path: str, output_path: str\) -> bool:.*?)(?=\n@app\.cls|\nclass |\ndef [a-z]|\Z)"
    match = re.search(pattern, content, re.DOTALL)

    if not match:
        raise ImportError("Could not find convert_diffusers_to_comfyui_flux_lora in production code")

    func_code = match.group(1)

    # Create a namespace and execute the function definition
    namespace = {}
    exec(func_code, namespace)

    return namespace["convert_diffusers_to_comfyui_flux_lora"]


# Load the function from production code
convert_diffusers_to_comfyui_flux_lora = _load_convert_function()


class TestLoRAConversion:
    """Test suite for PEFT/Diffusers to ComfyUI LoRA conversion."""

    @pytest.fixture
    def temp_dir(self):
        """Create a temporary directory for test files."""
        with tempfile.TemporaryDirectory() as tmpdir:
            yield tmpdir

    @pytest.fixture
    def sample_rank(self):
        """Sample LoRA rank for testing."""
        return 16

    @pytest.fixture
    def hidden_dim(self):
        """Sample hidden dimension for testing."""
        return 64

    # =========================================================================
    # Single Transformer Blocks Tests
    # =========================================================================

    def test_single_block_qkv_merged_to_linear1(
        self, temp_dir, sample_rank, hidden_dim
    ):
        """should merge single block Q/K/V into linear1 when all tensors present"""
        # Arrange: Create PEFT format QKV tensors for single block 0
        peft_dict = {
            "transformer.single_transformer_blocks.0.attn.to_q.lora_A.weight": torch.randn(
                sample_rank, hidden_dim
            ),
            "transformer.single_transformer_blocks.0.attn.to_q.lora_B.weight": torch.randn(
                hidden_dim, sample_rank
            ),
            "transformer.single_transformer_blocks.0.attn.to_k.lora_A.weight": torch.randn(
                sample_rank, hidden_dim
            ),
            "transformer.single_transformer_blocks.0.attn.to_k.lora_B.weight": torch.randn(
                hidden_dim, sample_rank
            ),
            "transformer.single_transformer_blocks.0.attn.to_v.lora_A.weight": torch.randn(
                sample_rank, hidden_dim
            ),
            "transformer.single_transformer_blocks.0.attn.to_v.lora_B.weight": torch.randn(
                hidden_dim, sample_rank
            ),
        }

        input_path = os.path.join(temp_dir, "input.safetensors")
        output_path = os.path.join(temp_dir, "output.safetensors")
        save_file(peft_dict, input_path)

        # Act
        result = convert_diffusers_to_comfyui_flux_lora(input_path, output_path)

        # Assert
        assert result is True
        assert os.path.exists(output_path)

        converted = load_file(output_path)

        # Check merged QKV keys exist
        assert "lora_unet_single_blocks_0_linear1.lora_down.weight" in converted
        assert "lora_unet_single_blocks_0_linear1.lora_up.weight" in converted

        # Check shapes: down should be (3*rank, hidden), up should be (hidden, 3*rank)
        down_tensor = converted["lora_unet_single_blocks_0_linear1.lora_down.weight"]
        up_tensor = converted["lora_unet_single_blocks_0_linear1.lora_up.weight"]

        assert down_tensor.shape == (sample_rank * 3, hidden_dim)
        assert up_tensor.shape == (hidden_dim, sample_rank * 3)

    def test_single_block_proj_out_to_linear2(self, temp_dir, sample_rank, hidden_dim):
        """should convert single block proj_out to linear2"""
        # Arrange
        peft_dict = {
            "transformer.single_transformer_blocks.5.proj_out.lora_A.weight": torch.randn(
                sample_rank, hidden_dim
            ),
            "transformer.single_transformer_blocks.5.proj_out.lora_B.weight": torch.randn(
                hidden_dim, sample_rank
            ),
        }

        input_path = os.path.join(temp_dir, "input.safetensors")
        output_path = os.path.join(temp_dir, "output.safetensors")
        save_file(peft_dict, input_path)

        # Act
        result = convert_diffusers_to_comfyui_flux_lora(input_path, output_path)

        # Assert
        assert result is True
        converted = load_file(output_path)

        assert "lora_unet_single_blocks_5_linear2.lora_down.weight" in converted
        assert "lora_unet_single_blocks_5_linear2.lora_up.weight" in converted

    # =========================================================================
    # Double Transformer Blocks Tests
    # =========================================================================

    def test_double_block_image_qkv_merged_to_img_attn_qkv(
        self, temp_dir, sample_rank, hidden_dim
    ):
        """should merge double block image Q/K/V into img_attn_qkv"""
        # Arrange
        peft_dict = {
            "transformer.transformer_blocks.3.attn.to_q.lora_A.weight": torch.randn(
                sample_rank, hidden_dim
            ),
            "transformer.transformer_blocks.3.attn.to_q.lora_B.weight": torch.randn(
                hidden_dim, sample_rank
            ),
            "transformer.transformer_blocks.3.attn.to_k.lora_A.weight": torch.randn(
                sample_rank, hidden_dim
            ),
            "transformer.transformer_blocks.3.attn.to_k.lora_B.weight": torch.randn(
                hidden_dim, sample_rank
            ),
            "transformer.transformer_blocks.3.attn.to_v.lora_A.weight": torch.randn(
                sample_rank, hidden_dim
            ),
            "transformer.transformer_blocks.3.attn.to_v.lora_B.weight": torch.randn(
                hidden_dim, sample_rank
            ),
        }

        input_path = os.path.join(temp_dir, "input.safetensors")
        output_path = os.path.join(temp_dir, "output.safetensors")
        save_file(peft_dict, input_path)

        # Act
        result = convert_diffusers_to_comfyui_flux_lora(input_path, output_path)

        # Assert
        assert result is True
        converted = load_file(output_path)

        assert "lora_unet_double_blocks_3_img_attn_qkv.lora_down.weight" in converted
        assert "lora_unet_double_blocks_3_img_attn_qkv.lora_up.weight" in converted

        down_tensor = converted["lora_unet_double_blocks_3_img_attn_qkv.lora_down.weight"]
        up_tensor = converted["lora_unet_double_blocks_3_img_attn_qkv.lora_up.weight"]

        assert down_tensor.shape == (sample_rank * 3, hidden_dim)
        assert up_tensor.shape == (hidden_dim, sample_rank * 3)

    def test_double_block_text_qkv_merged_to_txt_attn_qkv(
        self, temp_dir, sample_rank, hidden_dim
    ):
        """should merge double block text Q/K/V into txt_attn_qkv"""
        # Arrange
        peft_dict = {
            "transformer.transformer_blocks.7.attn.add_q_proj.lora_A.weight": torch.randn(
                sample_rank, hidden_dim
            ),
            "transformer.transformer_blocks.7.attn.add_q_proj.lora_B.weight": torch.randn(
                hidden_dim, sample_rank
            ),
            "transformer.transformer_blocks.7.attn.add_k_proj.lora_A.weight": torch.randn(
                sample_rank, hidden_dim
            ),
            "transformer.transformer_blocks.7.attn.add_k_proj.lora_B.weight": torch.randn(
                hidden_dim, sample_rank
            ),
            "transformer.transformer_blocks.7.attn.add_v_proj.lora_A.weight": torch.randn(
                sample_rank, hidden_dim
            ),
            "transformer.transformer_blocks.7.attn.add_v_proj.lora_B.weight": torch.randn(
                hidden_dim, sample_rank
            ),
        }

        input_path = os.path.join(temp_dir, "input.safetensors")
        output_path = os.path.join(temp_dir, "output.safetensors")
        save_file(peft_dict, input_path)

        # Act
        result = convert_diffusers_to_comfyui_flux_lora(input_path, output_path)

        # Assert
        assert result is True
        converted = load_file(output_path)

        assert "lora_unet_double_blocks_7_txt_attn_qkv.lora_down.weight" in converted
        assert "lora_unet_double_blocks_7_txt_attn_qkv.lora_up.weight" in converted

    def test_double_block_to_out_to_img_attn_proj(
        self, temp_dir, sample_rank, hidden_dim
    ):
        """should convert double block to_out.0 to img_attn_proj"""
        # Arrange
        peft_dict = {
            "transformer.transformer_blocks.10.attn.to_out.0.lora_A.weight": torch.randn(
                sample_rank, hidden_dim
            ),
            "transformer.transformer_blocks.10.attn.to_out.0.lora_B.weight": torch.randn(
                hidden_dim, sample_rank
            ),
        }

        input_path = os.path.join(temp_dir, "input.safetensors")
        output_path = os.path.join(temp_dir, "output.safetensors")
        save_file(peft_dict, input_path)

        # Act
        result = convert_diffusers_to_comfyui_flux_lora(input_path, output_path)

        # Assert
        assert result is True
        converted = load_file(output_path)

        assert "lora_unet_double_blocks_10_img_attn_proj.lora_down.weight" in converted
        assert "lora_unet_double_blocks_10_img_attn_proj.lora_up.weight" in converted

    def test_double_block_to_add_out_to_txt_attn_proj(
        self, temp_dir, sample_rank, hidden_dim
    ):
        """should convert double block to_add_out to txt_attn_proj"""
        # Arrange
        peft_dict = {
            "transformer.transformer_blocks.15.attn.to_add_out.lora_A.weight": torch.randn(
                sample_rank, hidden_dim
            ),
            "transformer.transformer_blocks.15.attn.to_add_out.lora_B.weight": torch.randn(
                hidden_dim, sample_rank
            ),
        }

        input_path = os.path.join(temp_dir, "input.safetensors")
        output_path = os.path.join(temp_dir, "output.safetensors")
        save_file(peft_dict, input_path)

        # Act
        result = convert_diffusers_to_comfyui_flux_lora(input_path, output_path)

        # Assert
        assert result is True
        converted = load_file(output_path)

        assert "lora_unet_double_blocks_15_txt_attn_proj.lora_down.weight" in converted
        assert "lora_unet_double_blocks_15_txt_attn_proj.lora_up.weight" in converted

    # =========================================================================
    # Final proj_out Tests
    # =========================================================================

    def test_transformer_proj_out_to_lora_unet_proj_out(
        self, temp_dir, sample_rank, hidden_dim
    ):
        """should convert transformer.proj_out to lora_unet_proj_out"""
        # Arrange
        peft_dict = {
            "transformer.proj_out.lora_A.weight": torch.randn(sample_rank, hidden_dim),
            "transformer.proj_out.lora_B.weight": torch.randn(hidden_dim, sample_rank),
        }

        input_path = os.path.join(temp_dir, "input.safetensors")
        output_path = os.path.join(temp_dir, "output.safetensors")
        save_file(peft_dict, input_path)

        # Act
        result = convert_diffusers_to_comfyui_flux_lora(input_path, output_path)

        # Assert
        assert result is True
        converted = load_file(output_path)

        assert "lora_unet_proj_out.lora_down.weight" in converted
        assert "lora_unet_proj_out.lora_up.weight" in converted

    # =========================================================================
    # Alpha/Scale Preservation Tests
    # =========================================================================

    def test_alpha_keys_preserved(self, temp_dir, sample_rank, hidden_dim):
        """should preserve alpha keys without modification"""
        # Arrange
        peft_dict = {
            "transformer.proj_out.lora_A.weight": torch.randn(sample_rank, hidden_dim),
            "transformer.proj_out.lora_B.weight": torch.randn(hidden_dim, sample_rank),
            "lora_alpha": torch.tensor(16.0),
            "some_scale_value": torch.tensor(1.0),
        }

        input_path = os.path.join(temp_dir, "input.safetensors")
        output_path = os.path.join(temp_dir, "output.safetensors")
        save_file(peft_dict, input_path)

        # Act
        result = convert_diffusers_to_comfyui_flux_lora(input_path, output_path)

        # Assert
        assert result is True
        converted = load_file(output_path)

        assert "lora_alpha" in converted
        assert "some_scale_value" in converted

    # =========================================================================
    # Legacy Format Tests (backward compatibility)
    # =========================================================================

    def test_legacy_double_blocks_converted(self, temp_dir):
        """should convert legacy fal.ai format (double_blocks.X.processor...)"""
        # Arrange
        peft_dict = {
            "double_blocks.5.processor.proj_lora1.down.weight": torch.randn(16, 64),
            "double_blocks.5.processor.proj_lora1.up.weight": torch.randn(64, 16),
            "double_blocks.5.processor.qkv_lora1.down.weight": torch.randn(16, 64),
            "double_blocks.5.processor.qkv_lora1.up.weight": torch.randn(64, 16),
        }

        input_path = os.path.join(temp_dir, "input.safetensors")
        output_path = os.path.join(temp_dir, "output.safetensors")
        save_file(peft_dict, input_path)

        # Act
        result = convert_diffusers_to_comfyui_flux_lora(input_path, output_path)

        # Assert
        assert result is True
        converted = load_file(output_path)

        assert "lora_unet_double_blocks_5_img_attn_proj.lora_down.weight" in converted
        assert "lora_unet_double_blocks_5_img_attn_proj.lora_up.weight" in converted
        assert "lora_unet_double_blocks_5_img_attn_qkv.lora_down.weight" in converted
        assert "lora_unet_double_blocks_5_img_attn_qkv.lora_up.weight" in converted

    def test_legacy_single_blocks_converted(self, temp_dir):
        """should convert legacy fal.ai format (single_blocks.X.processor...)"""
        # Arrange
        peft_dict = {
            "single_blocks.10.processor.proj_lora1.down.weight": torch.randn(16, 64),
            "single_blocks.10.processor.proj_lora1.up.weight": torch.randn(64, 16),
            "single_blocks.10.processor.qkv_lora1.down.weight": torch.randn(16, 64),
            "single_blocks.10.processor.qkv_lora1.up.weight": torch.randn(64, 16),
        }

        input_path = os.path.join(temp_dir, "input.safetensors")
        output_path = os.path.join(temp_dir, "output.safetensors")
        save_file(peft_dict, input_path)

        # Act
        result = convert_diffusers_to_comfyui_flux_lora(input_path, output_path)

        # Assert
        assert result is True
        converted = load_file(output_path)

        assert "lora_unet_single_blocks_10_linear2.lora_down.weight" in converted
        assert "lora_unet_single_blocks_10_linear2.lora_up.weight" in converted
        assert "lora_unet_single_blocks_10_linear1.lora_down.weight" in converted
        assert "lora_unet_single_blocks_10_linear1.lora_up.weight" in converted

    # =========================================================================
    # Edge Cases
    # =========================================================================

    def test_empty_input_returns_false(self, temp_dir):
        """should return False when input has no convertible keys"""
        # Arrange
        peft_dict = {
            "some_unknown_key": torch.randn(10, 10),
        }

        input_path = os.path.join(temp_dir, "input.safetensors")
        output_path = os.path.join(temp_dir, "output.safetensors")
        save_file(peft_dict, input_path)

        # Act
        result = convert_diffusers_to_comfyui_flux_lora(input_path, output_path)

        # Assert
        assert result is False

    def test_incomplete_qkv_skips_merging(self, temp_dir, sample_rank, hidden_dim):
        """should skip QKV merging when missing one of Q/K/V"""
        # Arrange: Only Q and K, missing V
        peft_dict = {
            "transformer.single_transformer_blocks.0.attn.to_q.lora_A.weight": torch.randn(
                sample_rank, hidden_dim
            ),
            "transformer.single_transformer_blocks.0.attn.to_q.lora_B.weight": torch.randn(
                hidden_dim, sample_rank
            ),
            "transformer.single_transformer_blocks.0.attn.to_k.lora_A.weight": torch.randn(
                sample_rank, hidden_dim
            ),
            "transformer.single_transformer_blocks.0.attn.to_k.lora_B.weight": torch.randn(
                hidden_dim, sample_rank
            ),
            # V is missing
        }

        input_path = os.path.join(temp_dir, "input.safetensors")
        output_path = os.path.join(temp_dir, "output.safetensors")
        save_file(peft_dict, input_path)

        # Act
        result = convert_diffusers_to_comfyui_flux_lora(input_path, output_path)

        # Assert: Should return False since nothing was converted
        assert result is False

    def test_multiple_blocks_converted_correctly(
        self, temp_dir, sample_rank, hidden_dim
    ):
        """should convert multiple blocks in a single file"""
        # Arrange: Multiple single blocks
        peft_dict = {}
        for block_idx in [0, 5, 10, 20]:
            peft_dict.update(
                {
                    f"transformer.single_transformer_blocks.{block_idx}.attn.to_q.lora_A.weight": torch.randn(
                        sample_rank, hidden_dim
                    ),
                    f"transformer.single_transformer_blocks.{block_idx}.attn.to_q.lora_B.weight": torch.randn(
                        hidden_dim, sample_rank
                    ),
                    f"transformer.single_transformer_blocks.{block_idx}.attn.to_k.lora_A.weight": torch.randn(
                        sample_rank, hidden_dim
                    ),
                    f"transformer.single_transformer_blocks.{block_idx}.attn.to_k.lora_B.weight": torch.randn(
                        hidden_dim, sample_rank
                    ),
                    f"transformer.single_transformer_blocks.{block_idx}.attn.to_v.lora_A.weight": torch.randn(
                        sample_rank, hidden_dim
                    ),
                    f"transformer.single_transformer_blocks.{block_idx}.attn.to_v.lora_B.weight": torch.randn(
                        hidden_dim, sample_rank
                    ),
                }
            )

        input_path = os.path.join(temp_dir, "input.safetensors")
        output_path = os.path.join(temp_dir, "output.safetensors")
        save_file(peft_dict, input_path)

        # Act
        result = convert_diffusers_to_comfyui_flux_lora(input_path, output_path)

        # Assert
        assert result is True
        converted = load_file(output_path)

        for block_idx in [0, 5, 10, 20]:
            assert f"lora_unet_single_blocks_{block_idx}_linear1.lora_down.weight" in converted
            assert f"lora_unet_single_blocks_{block_idx}_linear1.lora_up.weight" in converted

    def test_mixed_single_and_double_blocks(self, temp_dir, sample_rank, hidden_dim):
        """should convert both single and double blocks in same file"""
        # Arrange
        peft_dict = {
            # Single block
            "transformer.single_transformer_blocks.0.attn.to_q.lora_A.weight": torch.randn(
                sample_rank, hidden_dim
            ),
            "transformer.single_transformer_blocks.0.attn.to_q.lora_B.weight": torch.randn(
                hidden_dim, sample_rank
            ),
            "transformer.single_transformer_blocks.0.attn.to_k.lora_A.weight": torch.randn(
                sample_rank, hidden_dim
            ),
            "transformer.single_transformer_blocks.0.attn.to_k.lora_B.weight": torch.randn(
                hidden_dim, sample_rank
            ),
            "transformer.single_transformer_blocks.0.attn.to_v.lora_A.weight": torch.randn(
                sample_rank, hidden_dim
            ),
            "transformer.single_transformer_blocks.0.attn.to_v.lora_B.weight": torch.randn(
                hidden_dim, sample_rank
            ),
            # Double block image
            "transformer.transformer_blocks.0.attn.to_q.lora_A.weight": torch.randn(
                sample_rank, hidden_dim
            ),
            "transformer.transformer_blocks.0.attn.to_q.lora_B.weight": torch.randn(
                hidden_dim, sample_rank
            ),
            "transformer.transformer_blocks.0.attn.to_k.lora_A.weight": torch.randn(
                sample_rank, hidden_dim
            ),
            "transformer.transformer_blocks.0.attn.to_k.lora_B.weight": torch.randn(
                hidden_dim, sample_rank
            ),
            "transformer.transformer_blocks.0.attn.to_v.lora_A.weight": torch.randn(
                sample_rank, hidden_dim
            ),
            "transformer.transformer_blocks.0.attn.to_v.lora_B.weight": torch.randn(
                hidden_dim, sample_rank
            ),
            # proj_out
            "transformer.proj_out.lora_A.weight": torch.randn(sample_rank, hidden_dim),
            "transformer.proj_out.lora_B.weight": torch.randn(hidden_dim, sample_rank),
        }

        input_path = os.path.join(temp_dir, "input.safetensors")
        output_path = os.path.join(temp_dir, "output.safetensors")
        save_file(peft_dict, input_path)

        # Act
        result = convert_diffusers_to_comfyui_flux_lora(input_path, output_path)

        # Assert
        assert result is True
        converted = load_file(output_path)

        # Single block linear1
        assert "lora_unet_single_blocks_0_linear1.lora_down.weight" in converted
        assert "lora_unet_single_blocks_0_linear1.lora_up.weight" in converted

        # Double block img_attn_qkv
        assert "lora_unet_double_blocks_0_img_attn_qkv.lora_down.weight" in converted
        assert "lora_unet_double_blocks_0_img_attn_qkv.lora_up.weight" in converted

        # proj_out
        assert "lora_unet_proj_out.lora_down.weight" in converted
        assert "lora_unet_proj_out.lora_up.weight" in converted

    def test_nonexistent_input_file_returns_false(self, temp_dir):
        """should return False when input file does not exist"""
        # Arrange
        input_path = os.path.join(temp_dir, "nonexistent.safetensors")
        output_path = os.path.join(temp_dir, "output.safetensors")

        # Act
        result = convert_diffusers_to_comfyui_flux_lora(input_path, output_path)

        # Assert
        assert result is False


class TestQKVMergingLogic:
    """Test suite specifically for QKV tensor merging logic."""

    @pytest.fixture
    def temp_dir(self):
        """Create a temporary directory for test files."""
        with tempfile.TemporaryDirectory() as tmpdir:
            yield tmpdir

    def test_qkv_down_tensors_concatenated_on_dim0(self, temp_dir):
        """should concatenate Q/K/V down (A) tensors on dimension 0"""
        # Arrange
        rank = 8
        hidden = 32

        q_down = torch.ones(rank, hidden) * 1.0
        k_down = torch.ones(rank, hidden) * 2.0
        v_down = torch.ones(rank, hidden) * 3.0

        peft_dict = {
            "transformer.single_transformer_blocks.0.attn.to_q.lora_A.weight": q_down,
            "transformer.single_transformer_blocks.0.attn.to_q.lora_B.weight": torch.randn(hidden, rank),
            "transformer.single_transformer_blocks.0.attn.to_k.lora_A.weight": k_down,
            "transformer.single_transformer_blocks.0.attn.to_k.lora_B.weight": torch.randn(hidden, rank),
            "transformer.single_transformer_blocks.0.attn.to_v.lora_A.weight": v_down,
            "transformer.single_transformer_blocks.0.attn.to_v.lora_B.weight": torch.randn(hidden, rank),
        }

        input_path = os.path.join(temp_dir, "input.safetensors")
        output_path = os.path.join(temp_dir, "output.safetensors")
        save_file(peft_dict, input_path)

        # Act
        convert_diffusers_to_comfyui_flux_lora(input_path, output_path)

        # Assert
        converted = load_file(output_path)
        merged_down = converted["lora_unet_single_blocks_0_linear1.lora_down.weight"]

        # Shape should be (3*rank, hidden)
        assert merged_down.shape == (rank * 3, hidden)

        # Verify concatenation order: Q, K, V
        assert torch.allclose(merged_down[:rank], q_down)
        assert torch.allclose(merged_down[rank : rank * 2], k_down)
        assert torch.allclose(merged_down[rank * 2 :], v_down)

    def test_qkv_up_tensors_concatenated_on_dim1(self, temp_dir):
        """should concatenate Q/K/V up (B) tensors on dimension 1"""
        # Arrange
        rank = 8
        hidden = 32

        q_up = torch.ones(hidden, rank) * 1.0
        k_up = torch.ones(hidden, rank) * 2.0
        v_up = torch.ones(hidden, rank) * 3.0

        peft_dict = {
            "transformer.single_transformer_blocks.0.attn.to_q.lora_A.weight": torch.randn(rank, hidden),
            "transformer.single_transformer_blocks.0.attn.to_q.lora_B.weight": q_up,
            "transformer.single_transformer_blocks.0.attn.to_k.lora_A.weight": torch.randn(rank, hidden),
            "transformer.single_transformer_blocks.0.attn.to_k.lora_B.weight": k_up,
            "transformer.single_transformer_blocks.0.attn.to_v.lora_A.weight": torch.randn(rank, hidden),
            "transformer.single_transformer_blocks.0.attn.to_v.lora_B.weight": v_up,
        }

        input_path = os.path.join(temp_dir, "input.safetensors")
        output_path = os.path.join(temp_dir, "output.safetensors")
        save_file(peft_dict, input_path)

        # Act
        convert_diffusers_to_comfyui_flux_lora(input_path, output_path)

        # Assert
        converted = load_file(output_path)
        merged_up = converted["lora_unet_single_blocks_0_linear1.lora_up.weight"]

        # Shape should be (hidden, 3*rank)
        assert merged_up.shape == (hidden, rank * 3)

        # Verify concatenation order: Q, K, V on dim 1
        assert torch.allclose(merged_up[:, :rank], q_up)
        assert torch.allclose(merged_up[:, rank : rank * 2], k_up)
        assert torch.allclose(merged_up[:, rank * 2 :], v_up)
