"""
Theme prompt system type definitions.

Dataclasses for structured prompt configuration.
"""

from dataclasses import dataclass, field
from typing import Optional


@dataclass
class MetaConfig:
    """Theme metadata configuration."""
    slug: str
    name_ko: str
    name_en: str
    description: str = ""


@dataclass
class ShotSection:
    """Camera and composition for a shot type."""
    camera: str
    composition: str


@dataclass
class SceneSection:
    """Scene description (background + atmosphere)."""
    background: str
    atmosphere: str


@dataclass
class LightingSection:
    """Lighting description."""
    description: str


@dataclass
class GroomStyleSection:
    """Groom styling details."""
    attire: str
    hair: str
    pose: str


@dataclass
class BrideStyleSection:
    """Bride styling details."""
    attire: str
    hair: str
    accessories: str
    pose: str


@dataclass
class QualitySection:
    """Technical quality descriptors."""
    technical: str


@dataclass
class NegativePrompt:
    """Negative prompt components."""
    style: str
    quality: str
    mood: str


@dataclass
class MainPrompt:
    """Main prompt configuration with all sections."""
    full_body: ShotSection
    closeup: ShotSection
    scene: SceneSection
    lighting: LightingSection
    groom_style: GroomStyleSection
    bride_style: BrideStyleSection
    quality: QualitySection
    negative: NegativePrompt


@dataclass
class FacePositive:
    """Face positive prompt."""
    core: str


@dataclass
class FaceNegative:
    """Face negative prompt."""
    core: str


@dataclass
class FacePrompt:
    """Face prompt configuration."""
    positive: FacePositive
    negative: FaceNegative


@dataclass
class HandPrompt:
    """Hand prompt configuration."""
    positive: str
    negative: str


@dataclass
class GenerationSettings:
    """Generation parameter defaults."""
    cfg: float = 7
    steps: int = 25
    width: int = 896
    height: int = 1152


@dataclass
class ThemeOptions:
    """Theme-level options."""
    include_main_triggers: bool = False


@dataclass
class ThemePromptConfig:
    """Complete theme prompt configuration."""
    meta: MetaConfig
    main: MainPrompt
    groom_face: FacePrompt
    bride_face: FacePrompt
    hand: HandPrompt
    generation: GenerationSettings
    options: ThemeOptions = field(default_factory=ThemeOptions)
