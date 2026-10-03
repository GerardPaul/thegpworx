import { profile } from './profile';
import { projects } from './projects';
import { techLogos } from './tech';

describe('projects data', () => {
  it('has unique, url-safe slugs', () => {
    const slugs = projects.map(p => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    slugs.forEach(s => expect(s).toMatch(/^[a-z0-9-]+$/));
  });
});

describe('skills data', () => {
  it('has a logo in tech.ts for every skill', () => {
    const missing = profile.skills.filter(s => !techLogos[s]);
    expect(missing).withContext('add these to data/tech.ts').toEqual([]);
  });
});
