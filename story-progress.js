(() => {
  'use strict';
  const story = document.getElementById('home');
  const sticky = story?.querySelector('.wave-story-sticky');
  if (!story || !sticky) return;
  const listeners = new Set();
  let frame = 0;
  let current;
  let mobileWidth = 0;
  let mobileHeight = 0;

  function update() {
    frame = 0;
    const mobile = innerWidth <= 760;
    const viewport = window.visualViewport;
    const visibleHeight = Math.round(Math.min(innerHeight,
      !viewport || viewport.scale !== 1 ? innerHeight : viewport.height));
    if (mobile) {
      // Keep scroll travel stable when Android's address bar opens or closes.
      // Only the visible scene resizes; its text, scenery and canvas share it.
      if (mobileWidth !== innerWidth) {
        story.style.setProperty('--story-scroll-distance', `${Math.round(visibleHeight * 2.9)}px`);
        mobileWidth = innerWidth;
      }
      if (mobileHeight !== visibleHeight) {
        story.style.setProperty('--story-viewport-height', `${visibleHeight}px`);
        mobileHeight = visibleHeight;
      }
    } else if (mobileWidth) {
      story.style.removeProperty('--story-scroll-distance');
      story.style.removeProperty('--story-viewport-height');
      mobileWidth = mobileHeight = 0;
    }
    const rect = story.getBoundingClientRect();
    const height = sticky.clientHeight;
    current = {
      progress: Math.min(1, Math.max(0, -rect.top / Math.max(1, story.offsetHeight - height))),
      active: rect.bottom > 0 && rect.top < innerHeight,
      mobile,
      viewportHeight: mobile ? visibleHeight : innerHeight
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
