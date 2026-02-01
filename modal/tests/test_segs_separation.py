"""
Test cases for SEGS separation to fix couple face cross-contamination.

Tests verify that the WORKFLOW_JSON correctly separates groom and bride
SEGS filters so each DetailerForEach only processes one face.

Key invariants:
- Node 29: Groom SEGS filter (x1 sort, take_count=1, take_start=0)
- Node 40: Bride SEGS filter (x1 sort, take_count=1, take_start=1)
- Node 32 (Groom Detailer): reads from Node 29 output 0
- Node 33 (Bride Detailer): reads from Node 40 output 0
- Node 30: BboxDetectorSEGS with dilation=6, crop_factor=3.0
- Node 41/42: SEGSPreview nodes for debugging
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
        """should use ascending order (left face first)"""
        n29 = workflow["29"]["inputs"]
        assert n29["order"] is False  # false = ascending

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

    def test_node40_ascending_order(self, workflow):
        """should use ascending order"""
        n40 = workflow["40"]["inputs"]
        assert n40["order"] is False

    def test_node40_takes_second_face(self, workflow):
        """should take face at index 1 (bride = rightmost)"""
        n40 = workflow["40"]["inputs"]
        assert n40["take_count"] == 1
        assert n40["take_start"] == 1

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
        """groom should take index 0 (left), bride should take index 1 (right)"""
        n29 = workflow["29"]["inputs"]
        n40 = workflow["40"]["inputs"]

        # Both use x1 ascending
        assert n29["target"] == n40["target"] == "x1"
        assert n29["order"] == n40["order"] == False

        # Groom = index 0, Bride = index 1
        assert n29["take_start"] == 0
        assert n40["take_start"] == 1
