import { projects } from './projects';

describe('projects data', () => {
  it('has unique, url-safe slugs', () => {
    const slugs = projects.map(p => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    slugs.forEach(s => expect(s).toMatch(/^[a-z0-9-]+$/));
  });
});
