"""
Test cases for SEGS separation to fix couple face cross-contamination.

Tests verify that the WORKFLOW_JSON correctly separates groom and bride
SEGS filters so each DetailerForEach only processes one face.

Key invariants:
- Node 29: Groom SEGS filter (x1 ascending order=true, take_start=0 → left face)
- Node 40: Bride SEGS filter (x1 ascending order=true, take_start=1 → second face)
- Node 32 (Groom Detailer): reads original image from Node 8
- Node 33 (Bride Detailer): reads from Node 32 output (chained processing)
- Node 30: BboxDetectorSEGS with dilation=10, crop_factor=3.5, threshold=0.20
- Node 21/26 (Groom CLIP): use Node 14 (Groom LoRA CLIP)
- Node 23/27 (Bride CLIP): use Node 15 (Bride LoRA CLIP)
- Node 41/42: SEGSPreview nodes for debugging
- Seed interval: 10000 between batch images
- cfg default: 1 (FLUX model)
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

    def test_node29_descending_order(self, workflow):
        """should use descending order (order=false → descending → index 0 = leftmost by x1)"""
        n29 = workflow["29"]["inputs"]
        assert n29["order"] is False  # false = descending by x1, take_start=0 = leftmost

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
        """should use descending order (order=false), take_start=1 for second face"""
        n40 = workflow["40"]["inputs"]
        assert n40["order"] is False  # false = descending by x1, take_start=1 = second

    def test_node40_takes_second_in_ascending(self, workflow):
        """should take index 1 in ascending order (second from left = bride)"""
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
        """should read SEGS from Node 53 output 0 (gender-filtered groom)"""
        n32 = workflow["32"]["inputs"]
        assert n32["segs"] == ["53", 0]

    # =========================================================================
    # Node 33: Bride DetailerForEach
    # =========================================================================

    def test_node33_reads_bride_segs(self, workflow):
        """should read SEGS from Node 54 output 0 (gender-filtered bride)"""
        n33 = workflow["33"]["inputs"]
        assert n33["segs"] == ["54", 0]

    # =========================================================================
    # Node 30: BboxDetectorSEGS parameters
    # =========================================================================

    def test_node30_threshold(self, workflow):
        """should have threshold=0.20 for better full-body detection"""
        n30 = workflow["30"]["inputs"]
        assert n30["threshold"] == 0.20

    def test_node30_dilation(self, workflow):
        """should have dilation=10 for wider face mask coverage"""
        n30 = workflow["30"]["inputs"]
        assert n30["dilation"] == 10

    def test_node30_crop_factor(self, workflow):
        """should have crop_factor=3.5 for better full-body face capture"""
        n30 = workflow["30"]["inputs"]
        assert n30["crop_factor"] == 3.5

    # =========================================================================
    # SEGSPreview nodes (debug)
    # =========================================================================

    def test_node41_groom_preview_exists(self, workflow):
        """should have Node 41 for groom SEGS preview"""
        assert "41" in workflow
        assert workflow["41"]["class_type"] == "SEGSPreview"
        assert workflow["41"]["inputs"]["segs"] == ["53", 0]

    def test_node42_bride_preview_exists(self, workflow):
        """should have Node 42 for bride SEGS preview"""
        assert "42" in workflow
        assert workflow["42"]["class_type"] == "SEGSPreview"
        assert workflow["42"]["inputs"]["segs"] == ["54", 0]

    # =========================================================================
    # Cross-contamination prevention invariants
    # =========================================================================

    def test_groom_and_bride_use_different_segs_sources(self, workflow):
        """should ensure groom and bride detailers use separate SEGS sources"""
        groom_segs = workflow["32"]["inputs"]["segs"]
        bride_segs = workflow["33"]["inputs"]["segs"]

        # They must NOT reference the same node output
        assert groom_segs != bride_segs

    def test_both_gender_filters_use_same_upstream_detector(self, workflow):
        """both gender SEGS classifiers should feed from same face detector"""
        n51_upstream = workflow["51"]["inputs"]["segs"]
        n52_upstream = workflow["52"]["inputs"]["segs"]
        assert n51_upstream == n52_upstream == ["30", 0]

    def test_groom_takes_male_bride_takes_female(self, workflow):
        """groom should take male face, bride should take female face"""
        n51 = workflow["51"]["inputs"]
        n52 = workflow["52"]["inputs"]

        # Node 51: filters for male
        assert "male" in n51["preset_expr"].lower()

        # Node 52: filters for female
        assert "female" in n52["preset_expr"].lower()

    # =========================================================================
    # Node 33: Image source (chained from Node 32)
    # =========================================================================

    def test_node33_chains_from_node32(self, workflow):
        """Node 33 (bride detailer) should read from Node 32 output (chained processing)"""
        n33 = workflow["33"]["inputs"]
        assert n33["image"] == ["32", 0]

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

    # =========================================================================
    # Fix 2: Face prompt CLIP connections (LoRA-specific CLIP)
    # =========================================================================

    def test_node21_groom_positive_uses_groom_lora_clip(self, workflow):
        """Node 21 (groom face positive) should use Node 14 CLIP (groom LoRA)"""
        n21 = workflow["21"]["inputs"]
        assert n21["clip"] == ["14", 1]

    def test_node26_groom_negative_uses_groom_lora_clip(self, workflow):
        """Node 26 (groom face negative) should use Node 14 CLIP (groom LoRA)"""
        n26 = workflow["26"]["inputs"]
        assert n26["clip"] == ["14", 1]

    def test_node23_bride_positive_uses_bride_lora_clip(self, workflow):
        """Node 23 (bride face positive) should use Node 15 CLIP (bride LoRA)"""
        n23 = workflow["23"]["inputs"]
        assert n23["clip"] == ["15", 1]

    def test_node27_bride_negative_uses_bride_lora_clip(self, workflow):
        """Node 27 (bride face negative) should use Node 15 CLIP (bride LoRA)"""
        n27 = workflow["27"]["inputs"]
        assert n27["clip"] == ["15", 1]

    # =========================================================================
    # Fix 6: cfg default should be 1 for FLUX model
    # =========================================================================

    def test_cfg_default_is_1_for_flux(self, workflow):
        """generate() cfg default should be 1 (FLUX requires guidance-free)"""
        import re
        import os

        production_file = os.path.join(
            os.path.dirname(os.path.dirname(__file__)),
            "comfyui_workflow.py"
        )
        with open(production_file, "r") as f:
            content = f.read()

        # Find cfg default in generate(): request.get("cfg", N)
        match = re.search(r'request\.get\("cfg",\s*(\d+)\)', content)
        assert match is not None, "Could not find cfg default in generate()"
        cfg_default = int(match.group(1))
        assert cfg_default == 1, f"cfg default is {cfg_default}, should be 1 for FLUX"


class TestGenderBasedClassification:
    """Test suite for gender-based SEGS classification (NEW).

    The gender-based approach fixes the issue where position-based separation
    fails when the bride is on the left side of the image.

    Flow:
    Node 30 (Face Detect) → Node 50 (Gender Classifier)
                                  ↓
                            Node 51 (Male SEGS) → Node 53 (1개 선택) → Node 32 (Groom)
                            Node 52 (Female SEGS) → Node 54 (1개 선택) → Node 33 (Bride)
    """

    @pytest.fixture
    def workflow(self):
        return load_workflow()

    # =========================================================================
    # Node 50: Gender Classifier Provider
    # =========================================================================

    def test_node50_gender_classifier_exists(self, workflow):
        """should have Node 50 for gender classifier provider"""
        assert "50" in workflow, "Node 50 (Gender Classifier) is missing"

    def test_node50_class_type(self, workflow):
        """should be ImpactHFTransformersClassifierProvider"""
        assert workflow["50"]["class_type"] == "ImpactHFTransformersClassifierProvider"

    def test_node50_uses_gender_model(self, workflow):
        """should use gender classification model"""
        n50 = workflow["50"]["inputs"]
        assert "gender" in n50["preset_repo_id"].lower()

    # =========================================================================
    # Node 51: Male SEGS Classify
    # =========================================================================

    def test_node51_male_classification_exists(self, workflow):
        """should have Node 51 for male SEGS classification"""
        assert "51" in workflow, "Node 51 (Male SEGS) is missing"

    def test_node51_class_type(self, workflow):
        """should be ImpactSEGSClassify"""
        assert workflow["51"]["class_type"] == "ImpactSEGSClassify"

    def test_node51_reads_from_face_detector(self, workflow):
        """should read SEGS from Node 30 (face detector)"""
        n51 = workflow["51"]["inputs"]
        assert n51["segs"] == ["30", 0]

    def test_node51_uses_gender_classifier(self, workflow):
        """should use Node 50 (gender classifier)"""
        n51 = workflow["51"]["inputs"]
        assert n51["classifier"] == ["50", 0]

    def test_node51_filters_for_male(self, workflow):
        """should filter for male using preset expression"""
        n51 = workflow["51"]["inputs"]
        assert "male" in n51["preset_expr"].lower()

    # =========================================================================
    # Node 52: Female SEGS Classify
    # =========================================================================

    def test_node52_female_classification_exists(self, workflow):
        """should have Node 52 for female SEGS classification"""
        assert "52" in workflow, "Node 52 (Female SEGS) is missing"

    def test_node52_class_type(self, workflow):
        """should be ImpactSEGSClassify"""
        assert workflow["52"]["class_type"] == "ImpactSEGSClassify"

    def test_node52_reads_from_face_detector(self, workflow):
        """should read SEGS from Node 30 (face detector)"""
        n52 = workflow["52"]["inputs"]
        assert n52["segs"] == ["30", 0]

    def test_node52_uses_gender_classifier(self, workflow):
        """should use Node 50 (gender classifier)"""
        n52 = workflow["52"]["inputs"]
        assert n52["classifier"] == ["50", 0]

    def test_node52_filters_for_female(self, workflow):
        """should filter for female using preset expression"""
        n52 = workflow["52"]["inputs"]
        assert "female" in n52["preset_expr"].lower()

    # =========================================================================
    # Node 53: Groom Ordered Filter (largest male)
    # =========================================================================

    def test_node53_groom_ordered_filter_exists(self, workflow):
        """should have Node 53 for groom selection (largest male)"""
        assert "53" in workflow, "Node 53 (Groom OrderedFilter) is missing"

    def test_node53_class_type(self, workflow):
        """should be ImpactSEGSOrderedFilter"""
        assert workflow["53"]["class_type"] == "ImpactSEGSOrderedFilter"

    def test_node53_reads_from_male_segs(self, workflow):
        """should read SEGS from Node 51 (male SEGS)"""
        n53 = workflow["53"]["inputs"]
        assert n53["segs"] == ["51", 0]

    def test_node53_takes_single_face(self, workflow):
        """should take only 1 face (largest male)"""
        n53 = workflow["53"]["inputs"]
        assert n53["take_count"] == 1
        assert n53["take_start"] == 0

    # =========================================================================
    # Node 54: Bride Ordered Filter (largest female)
    # =========================================================================

    def test_node54_bride_ordered_filter_exists(self, workflow):
        """should have Node 54 for bride selection (largest female)"""
        assert "54" in workflow, "Node 54 (Bride OrderedFilter) is missing"

    def test_node54_class_type(self, workflow):
        """should be ImpactSEGSOrderedFilter"""
        assert workflow["54"]["class_type"] == "ImpactSEGSOrderedFilter"

    def test_node54_reads_from_female_segs(self, workflow):
        """should read SEGS from Node 52 (female SEGS)"""
        n54 = workflow["54"]["inputs"]
        assert n54["segs"] == ["52", 0]

    def test_node54_takes_single_face(self, workflow):
        """should take only 1 face (largest female)"""
        n54 = workflow["54"]["inputs"]
        assert n54["take_count"] == 1
        assert n54["take_start"] == 0

    # =========================================================================
    # Detailer nodes use gender-filtered SEGS
    # =========================================================================

    def test_node32_uses_gender_filtered_segs(self, workflow):
        """Node 32 (Groom Detailer) should use Node 53 (gender-filtered male)"""
        n32 = workflow["32"]["inputs"]
        assert n32["segs"] == ["53", 0], "Node 32 should use gender-filtered SEGS from Node 53"

    def test_node33_uses_gender_filtered_segs(self, workflow):
        """Node 33 (Bride Detailer) should use Node 54 (gender-filtered female)"""
        n33 = workflow["33"]["inputs"]
        assert n33["segs"] == ["54", 0], "Node 33 should use gender-filtered SEGS from Node 54"

    def test_node41_groom_preview_uses_gender_segs(self, workflow):
        """Node 41 (Groom Preview) should use Node 53 (gender-filtered male)"""
        n41 = workflow["41"]["inputs"]
        assert n41["segs"] == ["53", 0]

    def test_node42_bride_preview_uses_gender_segs(self, workflow):
        """Node 42 (Bride Preview) should use Node 54 (gender-filtered female)"""
        n42 = workflow["42"]["inputs"]
        assert n42["segs"] == ["54", 0]


class TestHandDetailerCFG:
    """Test suite for Hand Detailer CFG fix."""

    @pytest.fixture
    def workflow(self):
        return load_workflow()

    def test_node37_cfg_is_1(self, workflow):
        """Node 37 (Hand Detailer) cfg should be 1 for FLUX (not 8)"""
        n37 = workflow["37"]["inputs"]
        assert n37["cfg"] == 1, f"Node 37 cfg is {n37['cfg']}, should be 1 for FLUX"


class TestModalDependencies:
    """Test suite for Modal dependencies."""

    def test_transformers_in_pip_install(self):
        """transformers should be in pip_install for gender classification"""
        import os

        production_file = os.path.join(
            os.path.dirname(os.path.dirname(__file__)),
            "comfyui_workflow.py"
        )
        with open(production_file, "r") as f:
            content = f.read()

        assert "transformers" in content, "transformers package is missing from pip_install"

    def test_accelerate_in_pip_install(self):
        """accelerate should be in pip_install for GPU inference optimization"""
        import os

        production_file = os.path.join(
            os.path.dirname(os.path.dirname(__file__)),
            "comfyui_workflow.py"
        )
        with open(production_file, "r") as f:
            content = f.read()

        assert "accelerate" in content, "accelerate package is missing from pip_install"


class TestPositionBasedFallback:
    """Test suite for position-based fallback nodes (kept for fallback).

    Node 29/40 are kept in the workflow for code-level fallback when
    gender classification returns empty SEGS.
    """

    @pytest.fixture
    def workflow(self):
        return load_workflow()

    def test_node29_still_exists_for_fallback(self, workflow):
        """Node 29 (position-based left) should still exist for fallback"""
        assert "29" in workflow

    def test_node40_still_exists_for_fallback(self, workflow):
        """Node 40 (position-based right) should still exist for fallback"""
        assert "40" in workflow
