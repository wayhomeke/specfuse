import path from 'node:path';
import { access, readFile } from 'node:fs/promises';
import chalk from 'chalk';
import ora from 'ora';
import { composeGitignore } from './templates/gitignore.js';
import { composeClaudeSettings } from './templates/claude-settings.js';
import { composeOpenspecConfig } from './templates/openspec-config.js';
import { composeCLAUDEmd } from './templates/claude-md.js';
import { createDir, writeText, writeJSON, writeYAML } from './utils/fs.js';
import { gitInit, gitInitialCommit } from './utils/git.js';
import { detectCodegraph, installCodegraph, initCodegraph, detectOpenspec, installOpenspec, initOpenspec } from './utils/tools.js';
async function fileExists(filePath) {
    try {
        await access(filePath);
        return true;
    }
    catch {
        return false;
    }
}
async function readTextSafe(filePath) {
    try {
        return await readFile(filePath, 'utf-8');
    }
    catch {
        return null;
    }
}
function mergeFusionIntoCLAUDEmd(existing, fusionBlock) {
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
function mergeGitignore(existing, generated) {
    const existingLines = new Set(existing.split('\n').map((l) => l.trim()).filter(Boolean));
    const newLines = generated.split('\n').filter((l) => {
        const trimmed = l.trim();
        return trimmed && !trimmed.startsWith('#') && !existingLines.has(trimmed);
    });
    if (newLines.length === 0)
        return existing;
    return existing.trimEnd() + '\n\n# Added by specfuse\n' + newLines.join('\n') + '\n';
}
function mergeClaudeSettings(existing, generated) {
    const existingPerms = existing?.permissions?.allow ?? [];
    const generatedPerms = generated?.permissions?.allow ?? [];
    const merged = [...new Set([...existingPerms, ...generatedPerms])];
    return { ...existing, permissions: { ...existing?.permissions, allow: merged } };
}
export async function scaffold(config) {
    const { targetDir, stack, projectName, isExisting } = config;
    const ctx = { projectName, stack };
    if (!isExisting && await fileExists(targetDir)) {
        throw new Error(`Directory "${targetDir}" already exists. Omit project name to init in current directory.`);
    }
    const spinner = ora(isExisting ? 'Initializing specfuse in current directory...' : 'Scaffolding project...').start();
    await createDir(targetDir);
    // .gitignore
    spinner.text = 'Writing .gitignore...';
    const gitignorePath = path.join(targetDir, '.gitignore');
    const existingGitignore = await readTextSafe(gitignorePath);
    const generatedGitignore = composeGitignore(stack);
    if (existingGitignore) {
        await writeText(gitignorePath, mergeGitignore(existingGitignore, generatedGitignore));
    }
    else {
        await writeText(gitignorePath, generatedGitignore);
    }
    // CLAUDE.md
    spinner.text = 'Writing CLAUDE.md...';
    const claudeMdPath = path.join(targetDir, 'CLAUDE.md');
    const existingCLAUDEmd = await readTextSafe(claudeMdPath);
    const generatedCLAUDEmd = composeCLAUDEmd(ctx);
    if (existingCLAUDEmd) {
        await writeText(claudeMdPath, mergeFusionIntoCLAUDEmd(existingCLAUDEmd, generatedCLAUDEmd));
    }
    else {
        await writeText(claudeMdPath, generatedCLAUDEmd);
    }
    // .claude/settings.local.json
    spinner.text = 'Writing .claude/settings.local.json...';
    const settingsPath = path.join(targetDir, '.claude', 'settings.local.json');
    const existingSettings = await readTextSafe(settingsPath);
    const generatedSettings = composeClaudeSettings(stack);
    if (existingSettings) {
        try {
            const parsed = JSON.parse(existingSettings);
            await writeJSON(settingsPath, mergeClaudeSettings(parsed, generatedSettings));
        }
        catch {
            await writeJSON(settingsPath, generatedSettings);
        }
    }
    else {
        await writeJSON(settingsPath, generatedSettings);
    }
    // OpenSpec
    if (config.initOpenspec) {
        spinner.text = 'Setting up OpenSpec...';
        await createDir(path.join(targetDir, 'openspec', 'specs'));
        await createDir(path.join(targetDir, 'openspec', 'changes', 'archive'));
        const configYamlPath = path.join(targetDir, 'openspec', 'config.yaml');
        if (await fileExists(configYamlPath)) {
            spinner.text = 'OpenSpec config.yaml already exists, skipping...';
        }
        else {
            await writeYAML(configYamlPath, composeOpenspecConfig(ctx));
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
        }
        else {
            spinner.text = 'Installing OpenSpec CLI...';
            const installed = await installOpenspec();
            if (installed) {
                const ok = await initOpenspec(targetDir);
                if (!ok) {
                    spinner.warn('OpenSpec installed but init failed. Run manually: openspec init --tools claude --force');
                }
            }
            else {
                spinner.warn('OpenSpec CLI installation failed. Install manually: npm i -g @fission-ai/openspec && openspec init');
            }
        }
    }
    // CodeGraph
    if (config.initCodegraph) {
        spinner.text = 'Setting up CodeGraph...';
        const hasCodegraph = await detectCodegraph();
        if (hasCodegraph) {
            const ok = await initCodegraph(targetDir);
            if (ok) {
                spinner.text = 'CodeGraph initialized.';
            }
            else {
                spinner.warn('CodeGraph init failed. Run manually: codegraph init -i && codegraph install');
            }
        }
        else {
            spinner.text = 'Installing CodeGraph...';
            const installed = await installCodegraph();
            if (installed) {
                const ok = await initCodegraph(targetDir);
                if (!ok) {
                    spinner.warn('CodeGraph installed but init failed. Run manually: codegraph init -i && codegraph install');
                }
            }
            else {
                spinner.warn('CodeGraph installation failed. Install manually:\n  curl -fsSL https://raw.githubusercontent.com/colbymchenry/codegraph/main/install.sh | sh\n  Then run: codegraph init -i && codegraph install');
            }
        }
    }
    spinner.succeed(isExisting ? 'SpecFuse initialized in current directory!' : 'Project scaffolded!');
    console.log('');
    console.log(chalk.bold(`  ${projectName}/`));
    const tag = (label) => isExisting ? `${label} ${chalk.yellow('(merged)')}` : label;
    console.log(`    CLAUDE.md                         ${chalk.dim(tag('Bridge declaration'))}`);
    console.log(`    .gitignore                        ${chalk.dim(tag(stack.label + ' patterns'))}`);
    console.log(`    .claude/settings.local.json       ${chalk.dim(tag('Permissions'))}`);
    if (config.initOpenspec) {
        console.log(`    openspec/config.yaml              ${chalk.dim('Spec-driven config')}`);
    }
    console.log('');
    console.log(chalk.bold('  Next steps:'));
    if (!isExisting)
        console.log(`    cd ${projectName}`);
    console.log('    claude');
    console.log('    /opsx:propose   # start your first change');
    if (config.initCodegraph) {
        const localBin = path.join(process.env.HOME || '', '.local', 'bin');
        const inPath = (process.env.PATH || '').split(':').includes(localBin);
        if (!inPath) {
            console.log('');
            console.log(chalk.yellow('  Note: ~/.local/bin is not in your PATH.'));
            console.log(chalk.dim('  Add it to use codegraph directly:'));
            console.log(chalk.dim('    echo \'export PATH="$HOME/.local/bin:$PATH"\' >> ~/.bashrc && source ~/.bashrc'));
        }
    }
    console.log('');
}
//# sourceMappingURL=scaffolder.js.map