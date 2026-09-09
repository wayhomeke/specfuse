import path from 'node:path';
import { access, readFile, writeFile, readdir, copyFile } from 'node:fs/promises';
import { existsSync, readFileSync, type Dirent } from 'node:fs';
import os from 'node:os';
import chalk from 'chalk';
import ora from 'ora';
import type { ProjectConfig } from './types.js';
import { composeGitignore } from './templates/gitignore.js';
import { composeClaudeSettings } from './templates/claude-settings.js';
import { composeOpenspecConfig } from './templates/openspec-config.js';
import { composeDesignMdSkill } from './templates/design-md-skill.js';
import { composeFuseReviewSkill } from './templates/fusereview-skill.js';
import { composeFuseQASkill } from './templates/fuseqa-skill.js';
import { composeCLAUDEmd } from './templates/claude-md.js';
import { createDir, writeText, writeJSON, writeYAML } from './utils/fs.js';
import { gitInit, gitInitialCommit } from './utils/git.js';
import { detectOpenspec, installOpenspec, initOpenspec } from './utils/tools.js';

function hasSuperpowersPlugin(): boolean {
  const pluginsPath = path.join(process.env.HOME || '', '.claude', 'plugins', 'installed_plugins.json');
  if (!existsSync(pluginsPath)) return false;
  try {
    const data = JSON.parse(readFileSync(pluginsPath, 'utf-8'));
    return Object.keys(data.plugins || {}).some((k) => k.startsWith('superpowers'));
  } catch {
    return false;
  }
}

async function trustDirectory(absPath: string): Promise<void> {
  const claudeJsonPath = path.join(os.homedir(), '.claude.json');
  let data: Record<string, any> = {};
  try {
    const raw = await readFile(claudeJsonPath, 'utf-8');
    data = JSON.parse(raw);
  } catch {
    // file missing or malformed — start fresh
  }
  if (!data.projects) data.projects = {};
  if (!data.projects[absPath]) data.projects[absPath] = {};
  data.projects[absPath].hasTrustDialogAccepted = true;
  await writeFile(claudeJsonPath, JSON.stringify(data, null, 2) + '\n', 'utf-8');
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function readTextSafe(filePath: string): Promise<string | null> {
  try {
    return await readFile(filePath, 'utf-8');
  } catch {
    return null;
  }
}

function mergeFusionIntoCLAUDEmd(existing: string, fusionBlock: string): string {
  const startMarker = '<!-- FUSION:START -->';
  const endMarker = '<!-- FUSION:END -->';
  const startIdx = existing.indexOf(startMarker);
  const endIdx = existing.indexOf(endMarker);

  const newCLAUDEmd = fusionBlock;
  const fusionStart = newCLAUDEmd.indexOf(startMarker);
  const fusionEnd = newCLAUDEmd.indexOf(endMarker);
  const fusionContent = newCLAUDEmd.slice(fusionStart, fusionEnd + endMarker.length);

  if (startIdx !== -1 && endIdx !== -1) {
    return existing.slice(0, startIdx) + fusionContent + existing.slice(endIdx + endMarker.length);
  }

  return existing.trimEnd() + '\n\n---\n\n' + fusionContent + '\n';
}

function mergeGitignore(existing: string, generated: string): string {
  const existingLines = new Set(existing.split('\n').map((l) => l.trim()).filter(Boolean));
  const newLines = generated.split('\n').filter((l) => {
    const trimmed = l.trim();
    return trimmed && !trimmed.startsWith('#') && !existingLines.has(trimmed);
  });

  if (newLines.length === 0) return existing;
  return existing.trimEnd() + '\n\n# Added by specfuse\n' + newLines.join('\n') + '\n';
}

function mergeClaudeSettings(existing: object, generated: object): object {
  const existingPerms: string[] = (existing as any)?.permissions?.allow ?? [];
  const generatedPerms: string[] = (generated as any)?.permissions?.allow ?? [];
  const merged = [...new Set([...existingPerms, ...generatedPerms])];
  return { ...existing, permissions: { ...(existing as any)?.permissions, allow: merged } };
}

/**
 * Copy every file in a template directory. Deliberately unfiltered: template
 * directories contain only templates, and an extension filter silently drops
 * whatever format it was not told about (the .yaml-only filter this replaced
 * would have dropped all three Markdown FuseQA templates).
 *
 * A missing source directory is fatal rather than skipped: a skill that
 * references templates which were never copied is worse than a failed scaffold,
 * because the failure surfaces later and further from its cause.
 */
async function copyTemplateDir(srcDir: string, destDir: string): Promise<void> {
  let entries: Dirent[];
  try {
    entries = await readdir(srcDir, { withFileTypes: true });
  } catch {
    throw new Error(`Template source directory missing: ${srcDir}`);
  }
  await createDir(destDir);
  for (const e of entries) {
    const src = path.join(srcDir, e.name);
    const dest = path.join(destDir, e.name);
    if (e.isDirectory()) {
      await copyTemplateDir(src, dest);
    } else {
      await copyFile(src, dest);
    }
  }
}

export async function scaffold(config: ProjectConfig): Promise<void> {
  const { targetDir, projectName, isExisting } = config;
  const ctx = { projectName };

  if (!isExisting && await fileExists(targetDir)) {
    throw new Error(`Directory "${targetDir}" already exists. Omit project name to init in current directory.`);
  }

  const spinner = ora(isExisting ? 'Initializing specfuse in current directory...' : 'Scaffolding project...').start();

  await createDir(targetDir);

  // .gitignore
  spinner.text = 'Writing .gitignore...';
  const gitignorePath = path.join(targetDir, '.gitignore');
  const existingGitignore = await readTextSafe(gitignorePath);
  const generatedGitignore = composeGitignore();
  if (existingGitignore) {
    await writeText(gitignorePath, mergeGitignore(existingGitignore, generatedGitignore));
  } else {
    await writeText(gitignorePath, generatedGitignore);
  }

  // CLAUDE.md
  spinner.text = 'Writing CLAUDE.md...';
  const claudeMdPath = path.join(targetDir, 'CLAUDE.md');
  const existingCLAUDEmd = await readTextSafe(claudeMdPath);
  const generatedCLAUDEmd = composeCLAUDEmd(ctx);
  if (existingCLAUDEmd) {
    await writeText(claudeMdPath, mergeFusionIntoCLAUDEmd(existingCLAUDEmd, generatedCLAUDEmd));
  } else {
    await writeText(claudeMdPath, generatedCLAUDEmd);
  }

  // .claude/settings.local.json
  spinner.text = 'Writing .claude/settings.local.json...';
  const settingsPath = path.join(targetDir, '.claude', 'settings.local.json');
  const existingSettings = await readTextSafe(settingsPath);
  const generatedSettings = composeClaudeSettings();
  if (existingSettings) {
    try {
      const parsed = JSON.parse(existingSettings);
      await writeJSON(settingsPath, mergeClaudeSettings(parsed, generatedSettings));
    } catch {
      await writeJSON(settingsPath, generatedSettings);
    }
  } else {
    await writeJSON(settingsPath, generatedSettings);
  }

  // Design-md skill
  spinner.text = 'Writing .claude/skills/design-md/SKILL.md...';
  const designMdSkillPath = path.join(targetDir, '.claude', 'skills', 'design-md', 'SKILL.md');
  const existingDesignMdSkill = await readTextSafe(designMdSkillPath);
  if (!existingDesignMdSkill) {
    await createDir(path.join(targetDir, '.claude', 'skills', 'design-md'));
    await writeText(designMdSkillPath, composeDesignMdSkill());
  }

  // FuseReview skill
  spinner.text = 'Writing .claude/skills/fusereview/SKILL.md...';
  const fusereviewSkillPath = path.join(targetDir, '.claude', 'skills', 'fusereview', 'SKILL.md');
  const existingFusereviewSkill = await readTextSafe(fusereviewSkillPath);
  if (!existingFusereviewSkill) {
    await createDir(path.join(targetDir, '.claude', 'skills', 'fusereview'));
    await writeText(fusereviewSkillPath, composeFuseReviewSkill(ctx));
  }

  // FuseQA skill
  spinner.text = 'Writing .claude/skills/fuseqa/SKILL.md...';
  const fuseqaSkillPath = path.join(targetDir, '.claude', 'skills', 'fuseqa', 'SKILL.md');
  const existingFuseqaSkill = await readTextSafe(fuseqaSkillPath);
  if (!existingFuseqaSkill) {
    await createDir(path.join(targetDir, '.claude', 'skills', 'fuseqa'));
    await writeText(fuseqaSkillPath, composeFuseQASkill(ctx));
  }

  // Skill templates
  spinner.text = 'Copying skill templates...';
  await copyTemplateDir(
    path.join(import.meta.dirname, 'design-md', 'templates'),
    path.join(targetDir, '.claude', 'skills', 'design-md', 'templates'),
  );
  await copyTemplateDir(
    path.join(import.meta.dirname, 'fuseqa', 'templates'),
    path.join(targetDir, '.claude', 'skills', 'fuseqa', 'templates'),
  );
  spinner.succeed('Installed design-md and fuseqa skills with templates');

  // OpenSpec
  if (config.initOpenspec) {
    spinner.text = 'Setting up OpenSpec...';
    await createDir(path.join(targetDir, 'openspec', 'specs'));
    await createDir(path.join(targetDir, 'openspec', 'changes', 'archive'));
    const configYamlPath = path.join(targetDir, 'openspec', 'config.yaml');
    if (await fileExists(configYamlPath)) {
      spinner.text = 'OpenSpec config.yaml already exists, skipping...';
    } else {
      await writeYAML(configYamlPath, composeOpenspecConfig());
    }
  }

  // Git
  if (config.initGit) {
    spinner.text = 'Initializing git...';
    await gitInit(targetDir);
    await gitInitialCommit(targetDir);
  }

  // OpenSpec skills
  if (config.initOpenspec) {
    spinner.text = 'Setting up OpenSpec...';
    const hasOpenspec = await detectOpenspec();

    if (hasOpenspec) {
      const ok = await initOpenspec(targetDir);
      if (!ok) {
        spinner.warn('OpenSpec init failed. Run manually: openspec init --tools claude --force');
      }
    } else {
      spinner.text = 'Installing OpenSpec CLI...';
      const installed = await installOpenspec();
      if (installed) {
        const ok = await initOpenspec(targetDir);
        if (!ok) {
          spinner.warn('OpenSpec installed but init failed. Run manually: openspec init --tools claude --force');
        }
      } else {
        spinner.warn(
          'OpenSpec CLI installation failed. Install manually: npm i -g @fission-ai/openspec && openspec init',
        );
      }
    }
  }

  // Trust the project directory so .claude/settings.local.json permissions take effect
  try {
    await trustDirectory(path.resolve(targetDir));
  } catch {
    // non-fatal: user can accept trust dialog manually
  }

  spinner.succeed(isExisting ? 'SpecFuse initialized in current directory!' : 'Project scaffolded!');

  console.log('');
  console.log(chalk.bold(`  ${projectName}/`));

  const tag = (label: string) => isExisting ? `${label} ${chalk.yellow('(merged)')}` : label;

  console.log(`    CLAUDE.md                         ${chalk.dim(tag('Bridge declaration'))}`);
  console.log(`    .gitignore                        ${chalk.dim(tag('Shared ignore patterns'))}`);
  console.log(`    .claude/settings.local.json       ${chalk.dim(tag('Permissions'))}`);
  if (config.initOpenspec) {
    console.log(`    openspec/config.yaml              ${chalk.dim('Spec-driven config')}`);
  }
  console.log('');
  console.log(chalk.bold('  Next steps:'));
  if (!isExisting) console.log(`    cd ${projectName}`);
  console.log('    claude');
  console.log('    /opsx:propose   # start your first change');

  if (!hasSuperpowersPlugin()) {
    console.log('');
    console.log(chalk.yellow('  Note: Superpowers plugin not detected.'));
    console.log(chalk.dim('  The workflow requires the brainstorming skill from Superpowers.'));
    console.log(chalk.dim('  Install in Claude Code:'));
    console.log(chalk.dim('    /plugins add obra/superpowers'));
  }

  console.log('');
}
