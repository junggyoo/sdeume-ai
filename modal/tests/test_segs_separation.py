"""
Test cases for SEGS separation to fix couple face cross-contamination.

Tests verify that the WORKFLOW_JSON correctly separates groom and bride
SEGS filters so each DetailerForEach only processes one face.

Key invariants:
- Node 29: Groom SEGS filter (x1 ascending order=true, take_start=0 → left face)
- Node 40: Bride SEGS filter (x1 descending order=false, take_start=0 → right face)
- Node 32 (Groom Detailer): reads original image from Node 8
- Node 33 (Bride Detailer): reads original image from Node 8 (NOT Node 32)
- Node 30: BboxDetectorSEGS with dilation=6, crop_factor=3.0
- Node 41/42: SEGSPreview nodes for debugging
- Seed interval: 10000 between batch images
"""

import json
import pytest


def load_workflow():
    """Load WORKFLOW_JSON from production code."""
    import re
    import os

    production_file = os.path.join(
        os.path.dirname(os.path.dirname(__file__)),
        "comfyui_workflow.py"
    )

    with open(production_file, "r") as f:
        content = f.read()

    # Extract WORKFLOW_JSON string
    match = re.search(r"WORKFLOW_JSON\s*=\s*r'''(.*?)'''", content, re.DOTALL)
    if not match:
        raise ImportError("Could not find WORKFLOW_JSON in production code")

    return json.loads(match.group(1))


class TestSEGSSeparation:
    """Test suite for SEGS filter separation (groom/bride)."""

    @pytest.fixture
    def workflow(self):
        return load_workflow()

    # =========================================================================
    # Node 29: Groom SEGS Filter
    # =========================================================================

    def test_node29_sorts_by_x1(self, workflow):
        """should sort SEGS by x1 coordinate for left-right separation"""
        n29 = workflow["29"]["inputs"]
        assert n29["target"] == "x1"

    def test_node29_ascending_order(self, workflow):
        """should use ascending order (order=true → ascending → index 0 = leftmost)"""
        n29 = workflow["29"]["inputs"]
        assert n29["order"] is True  # true = ascending, index 0 = left

    def test_node29_takes_single_face(self, workflow):
        """should take only 1 face (groom = leftmost)"""
        n29 = workflow["29"]["inputs"]
        assert n29["take_count"] == 1
        assert n29["take_start"] == 0

    def test_node29_reads_from_detector(self, workflow):
        """should read SEGS from Node 30 (BboxDetectorSEGS)"""
        n29 = workflow["29"]["inputs"]
        assert n29["segs"] == ["30", 0]

    def test_node29_class_type(self, workflow):
        """should be ImpactSEGSOrderedFilter"""
        assert workflow["29"]["class_type"] == "ImpactSEGSOrderedFilter"

    # =========================================================================
    # Node 40: Bride SEGS Filter (NEW)
    # =========================================================================

    def test_node40_exists(self, workflow):
        """should have Node 40 for bride SEGS filter"""
        assert "40" in workflow

    def test_node40_sorts_by_x1(self, workflow):
        """should sort SEGS by x1 coordinate"""
        n40 = workflow["40"]["inputs"]
        assert n40["target"] == "x1"

    def test_node40_descending_order(self, workflow):
        """should use descending order (order=false → descending → index 0 = rightmost)"""
        n40 = workflow["40"]["inputs"]
        assert n40["order"] is False  # false = descending, index 0 = right

    def test_node40_takes_first_in_descending(self, workflow):
        """should take index 0 in descending order (rightmost = bride)"""
        n40 = workflow["40"]["inputs"]
        assert n40["take_count"] == 1
        assert n40["take_start"] == 0

    def test_node40_reads_from_same_detector(self, workflow):
        """should read SEGS from same Node 30 as Node 29"""
        n40 = workflow["40"]["inputs"]
        assert n40["segs"] == ["30", 0]

    def test_node40_class_type(self, workflow):
        """should be ImpactSEGSOrderedFilter"""
        assert workflow["40"]["class_type"] == "ImpactSEGSOrderedFilter"

    # =========================================================================
    # Node 32: Groom DetailerForEach
    # =========================================================================

    def test_node32_reads_groom_segs(self, workflow):
        """should read SEGS from Node 29 output 0 (groom filter)"""
        n32 = workflow["32"]["inputs"]
        assert n32["segs"] == ["29", 0]

    # =========================================================================
    # Node 33: Bride DetailerForEach
    # =========================================================================

    def test_node33_reads_bride_segs(self, workflow):
        """should read SEGS from Node 40 output 0 (bride filter, NOT Node 29)"""
        n33 = workflow["33"]["inputs"]
        assert n33["segs"] == ["40", 0]

    # =========================================================================
    # Node 30: BboxDetectorSEGS parameters
    # =========================================================================

    def test_node30_dilation(self, workflow):
        """should have dilation=6 (reduced from 10)"""
        n30 = workflow["30"]["inputs"]
        assert n30["dilation"] == 6

    def test_node30_crop_factor(self, workflow):
        """should have crop_factor=3.0 (reduced from 5)"""
        n30 = workflow["30"]["inputs"]
        assert n30["crop_factor"] == 3.0

    # =========================================================================
    # SEGSPreview nodes (debug)
    # =========================================================================

    def test_node41_groom_preview_exists(self, workflow):
        """should have Node 41 for groom SEGS preview"""
        assert "41" in workflow
        assert workflow["41"]["class_type"] == "SEGSPreview"
        assert workflow["41"]["inputs"]["segs"] == ["29", 0]

    def test_node42_bride_preview_exists(self, workflow):
        """should have Node 42 for bride SEGS preview"""
        assert "42" in workflow
        assert workflow["42"]["class_type"] == "SEGSPreview"
        assert workflow["42"]["inputs"]["segs"] == ["40", 0]

    # =========================================================================
    # Cross-contamination prevention invariants
    # =========================================================================

    def test_groom_and_bride_use_different_segs_sources(self, workflow):
        """should ensure groom and bride detailers use separate SEGS sources"""
        groom_segs = workflow["32"]["inputs"]["segs"]
        bride_segs = workflow["33"]["inputs"]["segs"]

        # They must NOT reference the same node output
        assert groom_segs != bride_segs

    def test_both_filters_use_same_upstream_detector(self, workflow):
        """both SEGS filters should feed from same face detector"""
        n29_upstream = workflow["29"]["inputs"]["segs"]
        n40_upstream = workflow["40"]["inputs"]["segs"]
        assert n29_upstream == n40_upstream == ["30", 0]

    def test_groom_takes_left_bride_takes_right(self, workflow):
        """groom should take left face, bride should take right face"""
        n29 = workflow["29"]["inputs"]
        n40 = workflow["40"]["inputs"]

        # Both sort by x1
        assert n29["target"] == n40["target"] == "x1"

        # Node 29: ascending (order=true), take_start=0 → leftmost = groom
        assert n29["order"] is True
        assert n29["take_start"] == 0

        # Node 40: descending (order=false), take_start=0 → rightmost = bride
        assert n40["order"] is False
        assert n40["take_start"] == 0

    # =========================================================================
    # Node 33: Image source (independent processing)
    # =========================================================================

    def test_node33_uses_original_image(self, workflow):
        """Node 33 (bride detailer) should read from original image (Node 8), not Node 32"""
        n33 = workflow["33"]["inputs"]
        assert n33["image"] == ["8", 0]

    def test_node33_not_chained_from_node32(self, workflow):
        """Node 33 image source must NOT be Node 32 output (prevents cumulative corruption)"""
        n33 = workflow["33"]["inputs"]
        assert n33["image"] != ["32", 0]

    # =========================================================================
    # Seed interval
    # =========================================================================

    def test_seed_interval_sufficient(self, workflow):
        """seed interval in batch loop should be 10000 (not 1000) for diversity"""
        import re
        import os

        production_file = os.path.join(
            os.path.dirname(os.path.dirname(__file__)),
            "comfyui_workflow.py"
        )
        with open(production_file, "r") as f:
            content = f.read()

        # Find the seed calculation line: base_seed + (img_idx * N)
        match = re.search(r"base_seed\s*\+\s*\(img_idx\s*\*\s*(\d+)\)", content)
        assert match is not None, "Could not find seed interval calculation"
        interval = int(match.group(1))
        assert interval >= 10000, f"Seed interval {interval} is too small, should be >= 10000"
