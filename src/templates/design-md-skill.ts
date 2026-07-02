export function composeDesignMdSkill(): string {
  return `---
name: design-md
description: Generate a DESIGN.md file for the current project via interactive questionnaire and archetype matching. Use for brownfield projects that need design tokens.
---

# DESIGN.md Generation Skill

Generate a comprehensive \`DESIGN.md\` design token document for the current project.

**Trigger:** User invokes \`/design-md\` manually, or auto-triggered after \`specfuse init\` for frontend projects.

---

## §1 Questionnaire

Ask the user exactly 5 questions, one at a time. Each answer maps to one or more dimension axes (colorTemp, lightness, density, borderRadius, tone) on a 1-5 scale.

### Q1: Product Category

"What type of product is this?"

Options:
- A) Internal tool / Admin panel → category: internal-tool, density +2
- B) Dashboard / Analytics → category: dashboard, density +1, lightness -1
- C) Consumer app (social/media) → category: consumer, tone +2
- D) Developer tool / API portal → category: developer, colorTemp -1
- E) Mobile app → category: mobile, borderRadius +1
- F) E-commerce / Marketplace → category: e-commerce, tone +1
- G) Marketing / Landing page → category: marketing, density -2, lightness +1
- H) Form-heavy / Workflow → category: form-heavy, density +1
- I) Content / Blog / Docs → category: content, lightness +1, density -1

Mapping: Sets the \`category\` field and adjusts relevant dimensions from baseline 3.

### Q2: Visual Temperature

"How warm or cool should the palette feel?"

Options:
- A) Very cool (blues, blue-greys) → colorTemp: 1
- B) Cool-neutral → colorTemp: 2
- C) Balanced / Neutral → colorTemp: 3
- D) Warm-neutral → colorTemp: 4
- E) Very warm (ambers, warm greys) → colorTemp: 5

Mapping: Directly sets \`colorTemp\` dimension.

### Q3: Interface Density

"How information-dense should the interface be?"

Options:
- A) Maximum density (monitoring dashboards, trading) → density: 1
- B) High density (admin panels, data tables) → density: 2
- C) Balanced (standard SaaS) → density: 3
- D) Spacious (consumer apps, marketing) → density: 4
- E) Very spacious (luxury, editorial) → density: 5

Mapping: Directly sets \`density\` dimension.

### Q4: Shape Language

"What shape personality fits your brand?"

Options:
- A) Sharp / Angular (technical, serious) → borderRadius: 1
- B) Slightly rounded (professional) → borderRadius: 2
- C) Moderately rounded (friendly-professional) → borderRadius: 3
- D) Well-rounded (approachable, consumer) → borderRadius: 4
- E) Very rounded / Pill-shaped (playful) → borderRadius: 5

Mapping: Directly sets \`borderRadius\` dimension.

### Q5: Brand Personality

"What tone should the design communicate?"

Options:
- A) Strictly functional (no personality) → tone: 1
- B) Professional and restrained → tone: 2
- C) Confident and polished → tone: 3
- D) Friendly and approachable → tone: 4
- E) Playful and expressive → tone: 5

Mapping: Directly sets \`tone\` dimension. Also influences \`lightness\`: tone 1-2 → lightness -1, tone 4-5 → lightness +1.

---

## §2 Matching Algorithm

After collecting answers, compute a 5-dimensional vector: \`[colorTemp, lightness, density, borderRadius, tone]\`.

**Weighted Euclidean distance** against all 16 archetype seed files:

\`\`\`
distance(user, archetype) = sqrt(
  w_colorTemp * (u.colorTemp - a.colorTemp)² +
  w_lightness * (u.lightness - a.lightness)² +
  w_density * (u.density - a.density)² +
  w_borderRadius * (u.borderRadius - a.borderRadius)² +
  w_tone * (u.tone - a.tone)²
)
\`\`\`

Weights: \`colorTemp=1.0, lightness=1.0, density=1.5, borderRadius=0.8, tone=1.2\`

**Category bonus:** If the archetype's \`category\` matches the user's Q1 answer, subtract 1.5 from its distance score (floor at 0). This ensures category-appropriate archetypes rank higher.

Select the archetype with the lowest adjusted distance. Present it to the user for confirmation. Allow fine-tuning individual dimensions before final generation.

---

## §3 Token Derivation Rules

From the matched archetype's \`anchors\`, derive a complete design token system:

### Colors (15+ semantic colors)

Starting from \`anchors.colors.primary\` and \`anchors.colors.auxiliary\`:
1. Generate primary scale: 50, 100, 200, 300, 400, 500, 600, 700, 800, 900 (10 shades)
2. Generate 2-3 auxiliary/accent scales (5 shades each from auxiliary anchors)
3. Derive semantic colors: success, warning, error, info (from primary hue-shift)
4. Neutral scale: 11 steps (white → black) calibrated to lightness dimension
5. Surface colors: background, surface, elevated, overlay

Total: minimum 15+ semantic color tokens with named purposes.

### Typography Scale

From \`anchors.typography.baseSize\` and \`anchors.typography.scale\`:
- Generate type scale using the modular ratio: xs, sm, base, md, lg, xl, 2xl, 3xl, 4xl
- Each step = previous × scale ratio
- Define font weights: regular (400), medium (500), semibold (600), bold (700)
- Define line heights: tight (1.2), normal (1.5), relaxed (1.75)

### Spacing (6-level system)

From \`anchors.spacing.unit\`:
- Generate 6 named levels: xs, sm, md, lg, xl, 2xl
- Each level = unit × multiplier: 1×, 2×, 3×, 4×, 6×, 8×
- Example with 4px unit: 4, 8, 12, 16, 24, 32

### Radius (6-level system)

From \`anchors.radius.base\`:
- Generate 6 named levels: none, sm, md, lg, xl, full
- Values: 0, base÷2, base, base×1.5, base×2, 9999px
- Example with 8px base: 0, 4, 8, 12, 16, 9999

### Elevation

Derive 5 elevation levels based on density dimension:
- Level 0: none (flat)
- Level 1: subtle (small shadow for cards)
- Level 2: medium (dropdowns, popovers)
- Level 3: high (modals, dialogs)
- Level 4: highest (notifications, toasts)

Shadow intensity scales with density: high-density UIs use subtler shadows.

### Component Tokens (8-10 groups)

From \`structure.componentTokens\`, define tokens for each component using cross-reference syntax:

\`\`\`yaml
button:
  padding: "{spacing.sm} {spacing.md}"
  borderRadius: "{radius.md}"
  fontSize: "{typography.sm}"
  primary:
    background: "{colors.primary.500}"
    text: "{colors.white}"
  secondary:
    background: "{colors.neutral.100}"
    text: "{colors.neutral.800}"
\`\`\`

Cross-reference format: \`"{category.token}"\` where category is one of colors, typography, spacing, radius, elevation.

---

## §4 Output Format

Generate \`DESIGN.md\` with two parts:

### YAML Front Matter

\`\`\`markdown
---
designSystem:
  name: "<project name> Design System"
  version: "1.0.0"
  archetype: "<matched archetype id>"
  generatedAt: "<ISO date>"
tokens:
  colors:
    primary: { ... full scale ... }
    auxiliary: { ... }
    semantic: { success, warning, error, info }
    neutral: { ... 11 steps ... }
  typography:
    scale: { xs, sm, base, md, lg, xl, 2xl, 3xl, 4xl }
    weights: { regular, medium, semibold, bold }
    lineHeights: { tight, normal, relaxed }
  spacing: { xs, sm, md, lg, xl, 2xl }
  radius: { none, sm, md, lg, xl, full }
  elevation: { 0, 1, 2, 3, 4 }
  components: { ... 8-10 component token groups ... }
---
\`\`\`

### Markdown Body structure

The Markdown body follows this structure:

1. **Overview** — archetype name, philosophy, key decisions
2. **Color Palette** — visual swatches (using HTML/unicode), semantic meanings
3. **Typography** — scale table, font stack recommendations
4. **Spacing & Layout** — grid system, spacing scale visualization
5. **Border Radius** — shape language explanation
6. **Elevation & Shadows** — usage guidelines per level
7. **Component Tokens** — per-component token table with cross-references
8. **Responsive Breakpoints** — from \`structure.requiredSections\`
9. **Usage Guidelines** — do/don't patterns for applying tokens

---

## §5 Backup & Overwrite Protection

Before writing \`DESIGN.md\`:

1. Check if \`DESIGN.md\` already exists in the target directory
2. If it exists:
   - Ask for overwrite confirmation: "DESIGN.md already exists. Overwrite? (A .bak backup will be created)"
   - On confirmation: copy existing file to \`DESIGN.md.bak\`
   - On rejection: abort without changes
3. If it does not exist: proceed directly

Never silently overwrite an existing DESIGN.md file.
`;
}
