## 1. Research & Material Gathering

- [x] 1.1 Extract key code snippets from `src/templates/claude-md.ts` (TDD enforcement, verification evidence, trigger conditions)
  - Verify: snippets saved to working notes, each with source line reference
- [x] 1.2 Review `docs/product-overview.md` to identify content boundaries (what NOT to repeat)
  - Verify: boundary list documented, no overlap in final output
- [x] 1.3 Collect design decisions from commit history and openspec archive for decision chain material
  - Verify: at least 8 distinct decisions identified with rationale

## 2. Write Chapter 1 — 核心问题定义

- [x] 2.1 Draft Chapter 1: define the capability-vs-discipline gap, state SpecFuse's position (~1500 words)
  - Verify: chapter exists in `docs/design-philosophy.md`, contains problem statement and position declaration

## 3. Write Chapter 2 — 两个半成品的相遇

- [x] 3.1 Draft Chapter 2: OpenSpec and Superpowers individual limitations, fusion motivation, CLAUDE.md as bridge (~1500 words)
  - Verify: chapter contains at least 2 decision chains with counter-arguments

## 4. Write Chapter 3 — 三阶段流水线设计

- [x] 4.1 Draft Chapter 3: Think-Do-Verify pipeline design with code snippets at decision points (~2500 words)
  - Verify: chapter contains at least 2 code/config snippets from actual project source

## 5. Write Chapter 4 — AI 行为建模与约束哲学

- [x] 5.1 Draft Chapter 4: declarative rules, progressive complexity, SHOULD vs MUST, trigger conditions (~2500 words)
  - Verify: chapter contains trigger condition snippet and at least 3 decision chains

## 6. Write Chapter 5 — 已知局限

- [x] 6.1 Draft Chapter 5: at least 3 named limitations with severity, distinguish trade-offs from unresolved problems (~1500 words)
  - Verify: each limitation has explicit severity assessment and category (intentional/unresolved)

## 7. Write Chapter 6 — 核心信念收束

- [x] 7.1 Draft Chapter 6: closing vision, connect back to Chapter 1's problem statement (~500 words)
  - Verify: chapter references the opening problem and states forward direction

## 8. Quality & Style Verification

- [x] 8.1 Verify professional third-person tone: fewer than 5% of sentences use "我们" as subject
  - Verify: manual scan confirms analytical phrasing throughout
- [x] 8.2 Verify word count is between 8000-12000 characters (prose only, excluding code blocks)
  - Verify: `cat docs/design-philosophy.md | sed '/^```/,/^```/d' | wc -m` reports 8000-12000
- [x] 8.3 Verify all six chapters present in correct order with ## headers
  - Verify: `grep "^## " docs/design-philosophy.md` shows 6 headers in sequence
- [x] 8.4 Verify `docs/product-overview.md` unchanged
  - Verify: `git diff docs/product-overview.md` shows no changes
