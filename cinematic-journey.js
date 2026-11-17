(() => {
  'use strict';
  const story = document.getElementById('home');
  const scenery = document.querySelector('[data-scenic-layers]');
  if (!story || !scenery) return;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const clamp = value => Math.min(1, Math.max(0, value));
  let previousProgress;
  let previousReduced;
  function update({ progress }) {
    if (progress === previousProgress && reduced.matches === previousReduced) return;
    previousProgress = progress;
    previousReduced = reduced.matches;
    const blend = clamp((progress - .30) / .44);
    const mix = blend * blend * (3 - 2 * blend);
    const factor = reduced.matches ? 0 : 1;
    const ease = t => t*t*(3 - 2*t);
    const exit = ease(clamp((progress - .82) / .18));
    const textExit = ease(clamp((progress - .985) / .015));
    const imageExit = ease(clamp((progress - .82) / .18));
    const uiExit = ease(clamp((progress - .92) / .08));
    story.style.setProperty('--journey-image-opacity', (1 - imageExit).toFixed(4));
    story.style.setProperty('--journey-ui-exit', uiExit.toFixed(4));
    story.style.setProperty('--journey-exit', exit.toFixed(4));
    story.style.setProperty('--journey-copy-exit', textExit.toFixed(4));
    story.style.setProperty('--journey-darwin', mix.toFixed(4));
    story.style.setProperty('--journey-distance', `${((.5 - progress) * 34 * factor).toFixed(1)}px`);
    story.style.setProperty('--journey-foreground', `${((.5 - progress) * 114 * factor).toFixed(1)}px`);
    story.style.setProperty('--wire-scroll-x', `${((progress - .5) * 120 * factor).toFixed(1)}px`);
  }
  window.rikeshStory?.subscribe(update);
  reduced.addEventListener?.('change', () => window.rikeshStory?.refresh());
})();
