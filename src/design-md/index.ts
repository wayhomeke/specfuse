import { existsSync, writeFileSync, copyFileSync } from 'node:fs';
import { join } from 'node:path';
import { runQuestionnaire } from './questionnaire.js';
import { matchArchetype } from './matcher.js';
import { deriveVector } from './matcher.js';
import { applyOverrides, type DimensionOverrides } from './fine-tuner.js';
import { renderDesignMd } from './renderer.js';
import type { DimensionVector } from './types.js';

export async function generateDesignMd(targetDir: string): Promise<string | null> {
  const { confirm, select, number } = await import('@inquirer/prompts');
  const outputPath = join(targetDir, 'DESIGN.md');

  if (existsSync(outputPath)) {
    const overwrite = await confirm({ message: 'DESIGN.md already exists. Overwrite?' });
    if (!overwrite) return null;
    copyFileSync(outputPath, join(targetDir, 'DESIGN.md.bak'));
  }

  const answers = await runQuestionnaire();
  const results = matchArchetype(answers);
  const top = results[0];

  const accepted = await confirm({
    message: `Best match: ${top.archetype.name} (distance: ${top.distance.toFixed(2)}). Accept?`,
  });

  if (!accepted) return null;

  const baseVector = deriveVector(answers);

  const action = await select({
    message: 'Fine-tune dimensions?',
    choices: [
      { value: 'accept', name: 'Accept as-is' },
      { value: 'tune', name: 'Adjust dimensions manually' },
    ],
  });

  let finalVector: DimensionVector = baseVector;

  if (action === 'tune') {
    const overrides: DimensionOverrides = {};
    for (const key of Object.keys(baseVector) as (keyof DimensionVector)[]) {
      const val = await number({
        message: `${key} (current: ${baseVector[key]}, 1-5, Enter to keep):`,
      });
      if (val !== undefined) overrides[key] = val;
    }
    finalVector = applyOverrides(baseVector, overrides);
  }

  const content = renderDesignMd(top.archetype, finalVector);
  writeFileSync(outputPath, content, 'utf-8');

  return outputPath;
}
