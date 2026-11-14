import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { projects } from '../../data/projects';
import { ProjectDetail } from './project-detail';

describe('ProjectDetail gallery', () => {
  const project = projects.find(p => (p.screenshots?.length ?? 0) > 1)!;

  async function render() {
    TestBed.configureTestingModule({ imports: [ProjectDetail], providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(ProjectDetail);
    fixture.componentRef.setInput('slug', project.slug);
    await fixture.whenStable();
    return fixture;
  }

  it('opens the clicked screenshot in the viewer and steps through with wraparound', async () => {
    const fixture = await render();
    const el: HTMLElement = fixture.nativeElement;
    const dialog = el.querySelector('dialog')!;
    const shots = project.screenshots!;

    el.querySelectorAll<HTMLButtonElement>('figure > button')[1].click();
    await fixture.whenStable();
    expect(dialog.open).toBeTrue();
    expect(dialog.querySelector('img')!.alt).toBe(shots[1].caption);

    dialog.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    dialog.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    await fixture.whenStable();
    expect(dialog.querySelector('img')!.alt).toBe(shots[(1 + 2) % shots.length].caption);

    dialog.close();
  });

  it('uses each caption as the thumbnail alt text', async () => {
    const fixture = await render();
    const alts = [...fixture.nativeElement.querySelectorAll('figure > button img')].map((i: HTMLImageElement) => i.alt);
    expect(alts).toEqual(project.screenshots!.map(s => s.caption));
  });
});
