(() => {
  'use strict';
  const story = document.getElementById('home');
  const scenery = document.querySelector('[data-scenic-layers]');
  if (!story || !scenery) return;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const clamp = value => Math.min(1, Math.max(0, value));
  let waiting = false;
  function update() {
    waiting = false;
    const rect = story.getBoundingClientRect();
    const distance = Math.max(1, story.offsetHeight - innerHeight);
    const progress = clamp(-rect.top / distance);
    const blend = clamp((progress - .30) / .44);
    const mix = blend * blend * (3 - 2 * blend);
    const factor = reduced.matches ? 0 : 1;
    story.style.setProperty('--journey-darwin', mix.toFixed(4));
    story.style.setProperty('--journey-distance', `${((.5 - progress) * 34 * factor).toFixed(1)}px`);
    story.style.setProperty('--journey-foreground', `${((.5 - progress) * 114 * factor).toFixed(1)}px`);
    story.style.setProperty('--story-spiral-turn', `${(-14 + progress * 88 * factor).toFixed(2)}deg`);
    story.style.setProperty('--story-spiral-scale', (1 + progress * .1 * factor).toFixed(4));
    const label = story.querySelector('[data-journey-label]');
    if (label) label.textContent = mix >= .6 ? 'DARWIN · MY PRESENT' : 'NEPAL · MY ROOTS';
  }
  function schedule() {
    if (waiting) return;
    waiting = true;
    requestAnimationFrame(update);
  }
  window.addEventListener('scroll', schedule, {passive:true});
  window.addEventListener('resize', schedule, {passive:true});
  reduced.addEventListener?.('change', schedule);
  update();
})();
