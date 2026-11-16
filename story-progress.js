(() => {
  'use strict';
  const story = document.getElementById('home');
  const sticky = story?.querySelector('.wave-story-sticky');
  if (!story || !sticky) return;
  const listeners = new Set();
  let frame = 0;
  let current;

  function update() {
    frame = 0;
    const rect = story.getBoundingClientRect();
    const height = sticky.clientHeight;
    const visibleHeight = Math.min(innerHeight, window.visualViewport?.height || innerHeight);
    current = {
      progress: Math.min(1, Math.max(0, -rect.top / Math.max(1, story.offsetHeight - height))),
      active: rect.bottom > 0 && rect.top < innerHeight,
      mobile: innerWidth <= 760,
      bottomLift: Math.max(0, height - visibleHeight)
    };
    window.__rikeshWaveStoryProgress = current.progress;
    window.__rikeshWaveStoryActive = current.active;
    story.classList.toggle('spiral-in-view', current.active);
    document.body.classList.toggle('exact-wave-story-active', current.active);
    listeners.forEach(listener => listener(current));
  }

  function refresh() {
    if (!frame) frame = requestAnimationFrame(update);
  }

  window.rikeshStory = {
    get current() { return current; },
    refresh,
    subscribe(listener) {
      listeners.add(listener);
      if (current) listener(current);
      return () => listeners.delete(listener);
    }
  };
  addEventListener('scroll', refresh, { passive: true });
  addEventListener('resize', refresh, { passive: true });
  addEventListener('pageshow', refresh);
  window.visualViewport?.addEventListener('resize', refresh, { passive: true });
  // Font loading can change section geometry without a window resize.
  document.fonts?.ready.then(refresh);
  update();
})();
