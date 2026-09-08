import { describe, it, expect } from 'vitest';
import { program } from '../src/index.js';

describe('CLI options — stack-free', () => {
  const longs = program.options.map((o) => o.long);

  it('does not advertise --stack', () => {
    expect(longs).not.toContain('--stack');
  });

  it('does not advertise --stack-from', () => {
    expect(longs).not.toContain('--stack-from');
  });

  it('still exposes --yes for non-interactive mode', () => {
    expect(longs).toContain('--yes');
  });
});
