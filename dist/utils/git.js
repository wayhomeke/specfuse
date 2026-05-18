import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
const exec = promisify(execFile);
export async function gitInit(cwd) {
    await exec('git', ['init'], { cwd });
    await exec('git', ['branch', '-M', 'main'], { cwd });
}
export async function gitInitialCommit(cwd) {
    await exec('git', ['add', '-A'], { cwd });
    await exec('git', ['commit', '-m', 'chore: scaffold project with fusion methodology'], { cwd });
}
export async function tryOpenspecInit(cwd) {
    try {
        await exec('openspec', ['init', '--tools', 'claude', '--force'], { cwd });
        return true;
    }
    catch {
        return false;
    }
}
//# sourceMappingURL=git.js.map