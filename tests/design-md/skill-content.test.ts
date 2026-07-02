import { describe, it, expect } from 'vitest';
import { composeDesignMdSkill } from '../../src/templates/design-md-skill';

describe('composeDesignMdSkill() output', () => {
  const content = composeDesignMdSkill();

  describe('frontmatter', () => {
    it('starts with YAML frontmatter containing name and description', () => {
      expect(content).toMatch(/^---\nname: design-md\n/);
      expect(content).toMatch(/description:.+/);
      expect(content).toMatch(/---\n/);
    });
  });

  describe('§1 Questionnaire', () => {
    it('contains a questionnaire section with exactly 5 questions', () => {
      expect(content).toMatch(/## .*(Questionnaire|questionnaire)/i);
      const questionMatches = content.match(/### Q[1-5]/g);
      expect(questionMatches).toHaveLength(5);
    });

    it('each question maps to dimension axes', () => {
      for (const dim of ['colorTemp', 'lightness', 'density', 'borderRadius', 'tone']) {
        expect(content).toContain(dim);
      }
    });
  });

  describe('§2 Matching Algorithm', () => {
    it('describes weighted Euclidean distance matching', () => {
      expect(content).toMatch(/[Ww]eighted.*[Ee]uclidean/);
    });

    it('mentions category bonus', () => {
      expect(content).toMatch(/category.*bonus/i);
    });
  });

  describe('§3 Token Derivation Rules', () => {
    it('specifies 15+ semantic colors requirement', () => {
      expect(content).toMatch(/15\+?\s*(semantic)?\s*color/i);
    });

    it('describes typography scale derivation', () => {
      expect(content).toMatch(/typography.*scale/i);
    });

    it('describes 6-level spacing system', () => {
      expect(content).toMatch(/spacing.*6.*(level|step)|6.*(level|step).*spacing/i);
    });

    it('describes 6-level radius system', () => {
      expect(content).toMatch(/radius.*6.*(level|step)|6.*(level|step).*radius/i);
    });

    it('describes elevation tokens', () => {
      expect(content).toMatch(/elevation/i);
    });

    it('specifies 8-10 component token groups', () => {
      expect(content).toMatch(/8.?10.*component/i);
    });

    it('documents cross-reference syntax using {category.token}', () => {
      expect(content).toMatch(/\{.*\..*\}/);
    });
  });

  describe('§4 Output Format', () => {
    it('specifies YAML front matter in output', () => {
      expect(content).toMatch(/YAML.*front.?matter/i);
    });

    it('specifies Markdown body structure', () => {
      expect(content).toMatch(/[Mm]arkdown.*body/i);
    });
  });

  describe('§5 Backup / Overwrite Protection', () => {
    it('mentions .bak backup creation', () => {
      expect(content).toContain('.bak');
    });

    it('mentions overwrite confirmation', () => {
      expect(content).toMatch(/overwrite.*confirm|confirm.*overwrite/i);
    });
  });
});
