# Flux Prompt Writing Guidelines

## Core Principles

### 1. Natural Language Phrases
- Use natural, descriptive phrases instead of tag soup
- Write as if describing a photograph to a professional photographer
- Example: "A front-facing full body portrait of a couple standing together" instead of "full body, couple, front view, standing"

### 2. Length Guidelines
- **Recommended**: 250-400 characters
- **Maximum**: 600 characters
- Longer prompts may lose coherence

### 3. Theme Differentiation
Themes should differ primarily in:
- **Background/Scene** (strongest impact)
- **Lighting** (strong impact)
- **Mood/Atmosphere** (strong impact)
- Hair/Dress/Makeup (soft preferences, not strict requirements)

---

## FaceDetailer Prompt Rules (MANDATORY)

Face prompts (Node 21/23) must:
1. Focus ONLY on: face, skin, makeup, expression, hair (lightly)
2. Include soft lighting descriptions
3. NEVER contain background/scene keywords

### Forbidden Keywords in Face Prompts
```
garden, ballroom, chandelier, flowers, foliage, background,
interior, outdoor, indoor, wall, horizon, scenery, marble,
velvet, drapes
```

**Note**: "studio" is allowed because "soft studio lighting" is a valid face lighting term.

---

## LoRA Trigger Policy

### Default Behavior
- Triggers are FORCED in FaceDetailer nodes (21/23)
- Triggers are NOT included in main prompt by default

### A/B Testing Option
- Set `includeMainTriggers: true` to add triggers to main prompt
- Use only when experiencing "mask effect" artifacts
- Default is `false` for cleaner generation

---

## Generation Parameters

### Recommended Defaults
| Parameter | Default | Range |
|-----------|---------|-------|
| cfg | 7 | 5-10 |
| steps | 25 | 20-30 |
| width | 896 | 512-1152 |
| height | 1152 | 512-1536 |

### Aspect Ratios
- **3:4** (896x1152): Standard portrait orientation
- **4:3** (1152x896): Landscape orientation
- **1:1** (1024x1024): Square format

---

## Theme YAML Structure

```yaml
meta:
  slug: theme_name          # URL-safe identifier
  name_ko: Korean name
  name_en: English name
  description: Short description

main:
  full_body:
    camera: Camera position and framing
    composition: Shot composition details
  closeup:
    camera: Camera position for closeup
    composition: Closeup composition
  scene:
    background: Background description (STRONG)
    atmosphere: Mood and feeling (STRONG)
  lighting:
    description: Lighting setup (STRONG)
  groom_style:
    attire: Clothing description (soft)
    hair: Hairstyle (soft)
    pose: Pose description
  bride_style:
    attire: Dress description (soft)
    hair: Hairstyle (soft)
    accessories: Jewelry, veil (soft)
    pose: Pose description
  quality:
    technical: Technical quality descriptors
  negative:
    style: Style negatives
    quality: Quality negatives
    mood: Mood negatives

groom_face:
  positive:
    core: Face-only description (NO BACKGROUND!)
  negative:
    core: Face negative

bride_face:
  positive:
    core: Face-only description (NO BACKGROUND!)
  negative:
    core: Face negative

hand:
  positive: Hand description
  negative: Hand negative (can be empty)

generation:
  cfg: 7
  steps: 25
  width: 896
  height: 1152

options:
  include_main_triggers: false
```

---

## Security Considerations

### extraStyleTags Filtering
- Only alphanumeric, spaces, commas, periods, hyphens allowed
- Maximum 200 characters
- Special characters are automatically stripped

### Input Validation
All user-provided strings are sanitized before injection into prompts.

---

## Adding New Themes

1. Create `modal/prompts/themes/<theme_slug>.yaml`
2. Follow the YAML structure above
3. Run tests: `python -m pytest modal/prompts/tests/`
4. Verify no background keywords in face prompts
5. Verify theme-specific elements differ from white_studio

---

## Troubleshooting

### "Mask Effect" on Faces
- Try `includeMainTriggers: true`
- Reduce LoRA strength if persistent

### White Residue in Non-White Themes
- Check that theme YAML doesn't contain "white" keywords
- Verify background description is theme-appropriate

### Hallucination in Face Area
- Check for forbidden background keywords in face prompts
- Ensure face prompts focus only on facial features
