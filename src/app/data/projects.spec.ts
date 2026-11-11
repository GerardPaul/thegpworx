import { profile } from './profile';
import { Project, projectLabel, projects } from './projects';
import { techLogos } from './tech';

describe('projects data', () => {
  it('has unique, url-safe slugs', () => {
    const slugs = projects.map(p => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    slugs.forEach(s => expect(s).toMatch(/^[a-z0-9-]+$/));
  });

  it('labels each kind of project', () => {
    const base: Project = { slug: 'x', title: 'X', tagline: '', description: [], tech: [], platform: 'web' };
    const live = { links: { live: 'https://example.com' } };
    expect(projectLabel(base)).toBeUndefined();
    expect(projectLabel({ ...base, ...live })).toBe('Live site');
    expect(projectLabel({ ...base, ...live, concept: true })).toBe('Concept');
    expect(projectLabel({ ...base, tool: '/tools/x' })).toBe('Interactive');
  });
});

describe('skills data', () => {
  it('has a logo in tech.ts for every skill', () => {
    const missing = profile.skills.filter(s => !techLogos[s]);
    expect(missing).withContext('add these to data/tech.ts').toEqual([]);
  });
});
