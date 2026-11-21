(() => {
  'use strict';
  // Pinned UMD plugins load before this file. Respect auto-registration and register once.
  const gsap = window.gsap;
  if (!gsap) return;
  const registered = Object.values(gsap.core.globals());
  const missing = [window.ScrollTrigger, window.SplitText].filter(
    (plugin) => plugin && !registered.includes(plugin),
  );
  if (missing.length) gsap.registerPlugin(...missing);
})();

(() => {
  'use strict';
  // Enhance in-page navigation only. Real page, external, download and image links stay links.
  const pathKey = (path) => path.replace(/\/index\.html$/, '/').replace(/\/+$/, '') || '/';
  function enhanceNavigation(root) {
    const links = root.matches?.('a[href]') ? [root] : [...root.querySelectorAll('a[href]')];
    links.forEach((link) => {
      if (link.hasAttribute('download') || (link.target && link.target !== '_self')) return;
      const url = new URL(link.href, location.href);
      if (
        url.origin !== location.origin ||
        pathKey(url.pathname) !== pathKey(location.pathname) ||
        url.search !== location.search
      )
        return;
      let target;
      try {
        target = url.hash && document.getElementById(decodeURIComponent(url.hash.slice(1)));
      } catch {
        return;
      }
      const top = !url.hash && link.matches('.site-header .nav-btn.active');
      if (!target && !top) return;
      const button = document.createElement('button');
      for (const attribute of link.attributes) {
        if (!['href', 'target', 'rel'].includes(attribute.name))
          button.setAttribute(attribute.name, attribute.value);
      }
      button.type = 'button';
      if (top) {
        button.dataset.inpageTop = '';
        button.setAttribute('aria-current', 'page');
      } else button.dataset.inpageTarget = target.id;
      button.append(...link.childNodes);
      link.replaceWith(button);
    });
  }
  enhanceNavigation(document);
  document.addEventListener('click', (event) => {
    const button =
      event.target instanceof Element &&
      event.target.closest('button[data-inpage-target], button[data-inpage-top]');
    if (!button) return;
    const top = button.hasAttribute('data-inpage-top');
    const target = top
      ? document.querySelector('main h1, main')
      : document.getElementById(button.dataset.inpageTarget);
    if (!target) return;
    if (document.body.classList.contains('menu-open'))
      document.dispatchEvent(new Event('rikesh:navigation-close'));
    const behavior = matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth';
    requestAnimationFrame(() => {
      if (top) scrollTo({ top: 0, behavior });
      else target.scrollIntoView({ block: 'start', behavior });
      target.tabIndex = -1;
      target.focus({ preventScroll: true });
    });
  });
  const observer = new MutationObserver((records) => {
    records.forEach((record) => {
      if (record.type === 'attributes') enhanceNavigation(record.target);
      else
        record.addedNodes.forEach((node) => {
          if (node instanceof Element) enhanceNavigation(node);
        });
    });
  });
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['href'],
  });
})();

(() => {
  'use strict';
  const fine = matchMedia('(any-pointer: fine)');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const cursors = ['cursor-dot', 'cursor-ring'].map((name) => {
    const element = document.querySelector(`.${name}`) || document.createElement('div');
    element.className = name;
    element.setAttribute('aria-hidden', 'true');
    element.hidden = true;
    if (!element.isConnected) document.body.append(element);
    return element;
  });
  const [dot, ring] = cursors;
  let targetX = 0,
    targetY = 0,
    ringX = 0,
    ringY = 0;
  let frame = 0,
    lastFrame = 0,
    placed = false;
  function hide() {
    cancelAnimationFrame(frame);
    frame = lastFrame = 0;
    placed = false;
    cursors.forEach((element) => (element.hidden = true));
    ring.classList.remove('is-interactive');
  }
  function paint(now) {
    frame = 0;
    if (document.hidden || reduced.matches || !fine.matches) return hide();
    const blend = 1 - Math.exp(-Math.min(40, lastFrame ? now - lastFrame : 16) / 65);
    lastFrame = now;
    ringX += (targetX - ringX) * blend;
    ringY += (targetY - ringY) * blend;
    const moving = Math.hypot(targetX - ringX, targetY - ringY) > 0.25;
    if (!moving) {
      ringX = targetX;
      ringY = targetY;
    }
    dot.style.transform = `translate3d(${targetX}px, ${targetY}px, 0) translate(-50%, -50%)`;
    ring.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) translate(-50%, -50%)`;
    if (moving) frame = requestAnimationFrame(paint);
  }
  document.addEventListener(
    'pointermove',
    (event) => {
      if (event.pointerType !== 'mouse' || !fine.matches || reduced.matches || document.hidden)
        return hide();
      targetX = event.clientX;
      targetY = event.clientY;
      if (!placed) {
        ringX = targetX;
        ringY = targetY;
        placed = true;
      }
      cursors.forEach((element) => (element.hidden = false));
      ring.classList.toggle(
        'is-interactive',
        Boolean(
          event.target instanceof Element &&
          event.target.closest(
            'a, button, input, textarea, select, summary, [role="button"], [contenteditable="true"]',
          ),
        ),
      );
      if (!frame) frame = requestAnimationFrame(paint);
    },
    { passive: true },
  );
  document.addEventListener(
    'pointerdown',
    (event) => {
      if (event.pointerType !== 'mouse') hide();
    },
    { passive: true },
  );
  document.addEventListener('pointerleave', hide, { passive: true });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Tab') hide();
  });
  document.addEventListener('visibilitychange', hide);
  addEventListener('blur', hide);
  addEventListener('pagehide', hide);
  reduced.addEventListener('change', hide);
  fine.addEventListener('change', hide);
  // A modal is in the browser's top layer; keep the decorative cursor in that layer too.
  const dialogs = [...document.querySelectorAll('dialog')];
  if (dialogs.length) {
    const observer = new MutationObserver(() => {
      const host = [...dialogs].reverse().find((dialog) => dialog.open) || document.body;
      cursors.forEach((element) => {
        if (element.parentElement !== host) host.append(element);
      });
    });
    dialogs.forEach((dialog) =>
      observer.observe(dialog, { attributes: true, attributeFilter: ['open'] }),
    );
  }
})();

(() => {
  'use strict';
  const story = document.querySelector('.journey-story');
  let waveLayer = document.querySelector('.page-waves');
  // Project pages use this same surface and scheduler, never a second renderer.
  if (!waveLayer && document.querySelector('main')) {
    waveLayer = document.createElement('div');
    waveLayer.className = 'journey-waves page-waves';
    waveLayer.setAttribute('aria-hidden', 'true');
    waveLayer.innerHTML = `<svg class="wave-mask-defs" width="0" height="0" focusable="false"><defs>
      <linearGradient id="page-wave-fade" x1="0" y1="0" x2="0" y2="1">
        <stop stop-color="white" stop-opacity="0"/><stop offset=".12" stop-color="white"/>
        <stop offset=".9" stop-color="white"/><stop offset="1" stop-color="white" stop-opacity="0"/>
      </linearGradient>
      <mask id="page-wave-mask" x="0" y="0" width="1" height="1" maskUnits="userSpaceOnUse" mask-type="luminance">
        <rect data-wave-mask-base width="1" height="1" fill="url(#page-wave-fade)"/>
        <g data-wave-mask-holes fill="black"/>
      </mask></defs></svg><canvas class="page-wave-surface" width="1" height="1"></canvas>
      <span class="journey-still-wave"></span>`;
    document.body.prepend(waveLayer);
  }
  if (!story && !waveLayer) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = matchMedia('(any-pointer: fine)');
  const chapters = [...(story?.querySelectorAll('[data-journey-chapter]') || [])];
  const count = story?.querySelector('[data-journey-count]');
  const darwin = story?.querySelector('[data-darwin-src]');
  const stage = story?.querySelector('.journey-stage');
  const waveCanvas = waveLayer?.querySelector('.page-wave-surface');
  let waveContext;
  try {
    waveContext = waveCanvas?.getContext('2d');
  } catch {
    // The same masked layer can render CSS bands if Canvas 2D is unavailable.
  }
  waveLayer?.classList.toggle('wave-canvas-ready', Boolean(waveContext));
  const canvasWaves = new Set();
  const waveSprites = new Map();
  let waveFrame = 0;
  let lastWavePaint = -Infinity;
  let atmosphereTime = 0;
  let lastAtmosphereFrame = 0;
  let atmospherePalette;
  let atmosphereBlocks = [];
  let atmosphereStrength = 0.8;
  let atmosphereTarget = 0.8;
  let atmosphereScroll = scrollY;
  const landscapePhotos = [...document.querySelectorAll('.darwin-page .place-card > img')];
  const atmospherePaths = [];
  const dust = Array.from({ length: 42 }, (_, i) => ({
    x: (i * 0.618034) % 1,
    y: (i * 0.381966 + 0.17) % 1,
    phase: i * 2.39996,
  }));
  if (typeof Path2D !== 'undefined') {
    for (let arm = 0; arm < 3; arm++) {
      const path = new Path2D();
      for (let i = 0; i <= 96; i++) {
        const t = i / 96;
        const radius = 0.08 + t * 0.92;
        const angle = (arm * Math.PI * 2) / 3 + t * Math.PI * 3.2;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        if (i) path.lineTo(x, y);
        else path.moveTo(x, y);
      }
      atmospherePaths.push(path);
    }
  }
  let waveScale = 1;
  const waveMask = document.querySelector('#page-wave-mask');
  const maskBase = document.querySelector('[data-wave-mask-base]');
  const maskHoles = document.querySelector('[data-wave-mask-holes]');
  const routeNode = story?.querySelector('.journey-network circle:nth-child(2)');
  const ripples = new Map();
  const lastRipple = new WeakMap();
  let routePulsed = false;
  let pointerSample;
  let pendingPointer;
  let pointerSpeed = 0;
  let pointerDistance = 0;
  let lastTrailWave = -Infinity;
  let lastInputType = finePointer.matches ? 'mouse' : 'touch';
  let activeRingCount = 0;
  let pageRingCount = 0;
  let touchOrigin;
  let protectedBlocks = [];
  let previousScrollY = Math.max(0, scrollY);
  let upwardDistance = 0;
  let lastAmbientWave = -Infinity;
  let ambientSide = 0;
  let previousMask = '';
  let maskDirty = true;
  let maskBoxes = [];
  let maximumScroll = Infinity;
  let frame = 0,
    measure = true,
    storyTop = 0,
    travel = 1,
    width = 0,
    height = 0;
  let darwinReady = false,
    darwinRequested = false;
  let activeChapter = -1;
  const clamp = (v) => Math.max(0, Math.min(1, v));
  const ease = (v) => v * v * (3 - 2 * v);
  const staticView = () => {
    const viewport = window.visualViewport;
    return (
      reduced.matches ||
      (story && Math.min(innerHeight, viewport?.scale === 1 ? viewport.height : innerHeight) < 560)
    );
  };
  function set(name, value) {
    if (story.style.getPropertyValue(name) !== value) story.style.setProperty(name, value);
  }
  function requestDarwin() {
    if (darwinRequested) return;
    darwinRequested = true;
    darwin.src = darwin.dataset.darwinSrc;
    darwin.decode().then(
      () => {
        darwinReady = true;
        schedule();
      },
      () => {},
    );
  }
  function clearRipples() {
    [...ripples.values()].forEach((remove) => remove());
    cancelAnimationFrame(waveFrame);
    waveFrame = 0;
    lastAtmosphereFrame = 0;
    waveContext?.clearRect(0, 0, innerWidth, innerHeight);
    resetPointerTrail();
  }
  function sizeWaveCanvas() {
    if (!waveContext) return;
    const mobile = innerWidth <= 760 || !finePointer.matches;
    // Cap both the backing-store area and dimensions, even on high-DPR displays.
    waveScale = reduced.matches
      ? Math.min(0.7, Math.sqrt(300000 / (innerWidth * innerHeight)))
      : Math.min(
          devicePixelRatio || 1,
          mobile ? 1 : 1.5,
          2048 / innerWidth,
          1440 / innerHeight,
          Math.sqrt((mobile ? 600000 : 1500000) / (innerWidth * innerHeight)),
        );
    const w = Math.max(1, Math.floor(innerWidth * waveScale));
    const h = Math.max(1, Math.floor(innerHeight * waveScale));
    if (waveCanvas.width !== w || waveCanvas.height !== h) {
      waveCanvas.width = w;
      waveCanvas.height = h;
      waveContext.setTransform(waveScale || 1, 0, 0, waveScale || 1, 0, 0);
    }
  }
  function measureAtmosphere() {
    const candidates = document.querySelectorAll(
      'main :is(h1,h2,h3,p,li,span,small,strong,dt,dd,label,img,form,a,button,input,textarea,select,.eyebrow,.case-kicker,.section-index,.glass,.identity-card,.work-card,.tool-card,.skill-card,.place-card,.practical-card,.case-library-card,.case-study,.brew-feature-image,.brew-selected), footer :is(a,button,span)',
    );
    const covered = new Set(candidates);
    atmosphereBlocks = [...candidates].flatMap((element) => {
      // Scenery remains visible. Sticky captions/devices are measured at paint time.
      if (element.closest('.journey-stage, .pos-device-stage, .pos-copy, .brew-composition'))
        return [];
      // A card/form/heading cutout already protects its children.
      for (let parent = element.parentElement; parent; parent = parent.parentElement) {
        if (covered.has(parent)) return [];
      }
      const rect = element.getBoundingClientRect();
      if (!rect.width || !rect.height) return [];
      return [{ x: rect.x, y: rect.y + scrollY, w: rect.width, h: rect.height }];
    });
  }
  function clearAtmosphere(x, y, w, h) {
    if (!w || !h) return;
    waveContext.save();
    waveContext.globalCompositeOperation = 'destination-out';
    // Feather content cutouts with a few cheap alpha steps, rather than live blur.
    for (const [padding, alpha] of [
      [24, 0.12],
      [18, 0.25],
      [13, 0.5],
    ]) {
      waveContext.fillStyle = `rgb(0 0 0 / ${alpha})`;
      waveContext.fillRect(x - padding, y - padding, w + padding * 2, h + padding * 2);
    }
    waveContext.restore();
    waveContext.clearRect(x - 8, y - 8, w + 16, h + 16);
  }
  function paintAtmosphere(now) {
    if (!atmospherePaths.length) return;
    const mobile = innerWidth <= 760 || !finePointer.matches;
    const dt = lastAtmosphereFrame ? Math.min(64, now - lastAtmosphereFrame) / 1000 : 0;
    lastAtmosphereFrame = now;
    if (!reduced.matches) atmosphereTime += dt;
    atmosphereScroll +=
      (scrollY - atmosphereScroll) * (reduced.matches ? 1 : 1 - Math.exp(-dt * 5));
    atmosphereStrength += (atmosphereTarget - atmosphereStrength) * (1 - Math.exp(-dt * 1.6));
    if (!atmospherePalette) {
      const style = getComputedStyle(waveLayer);
      atmospherePalette = [
        '--wave-tone',
        '--wave-accent',
        '--wave-scenic-tone',
        '--wave-scenic-accent',
      ].map((name) => style.getPropertyValue(name).trim());
    }
    const scenic = Boolean(stage && scrollY < storyTop + travel + height);
    const tones = atmospherePalette.slice(scenic ? 2 : 0, scenic ? 4 : 2);
    const t = reduced.matches ? 0 : atmosphereTime;
    const intensity =
      (document.body.classList.contains('case-page') ? 0.58 : 1) *
      (mobile ? 0.7 : 1) *
      (reduced.matches ? 0.5 : atmosphereStrength);
    const size = Math.min(innerWidth * 0.7, innerHeight * 0.86, 780);
    waveContext.save();
    for (let layer = 0; layer < (mobile ? 1 : 2); layer++) {
      const turn = t * (layer ? -0.013 : 0.021);
      const centreX = innerWidth * (layer ? 0.14 : 0.84);
      const centreY =
        innerHeight * (layer ? 0.72 : 0.34) +
        Math.sin(t * 0.09 + layer) * 12 -
        Math.sin(atmosphereScroll * 0.0004) * 20;
      const glow = atmosphereGlow(scenic);
      if (glow) {
        waveContext.globalAlpha = intensity * (0.8 + Math.sin(t * 0.21 + layer) * 0.12);
        waveContext.drawImage(glow, centreX - size, centreY - size * 0.6, size * 2, size * 1.2);
        waveContext.globalAlpha = 1;
      }
      waveContext.save();
      waveContext.translate(centreX, centreY);
      waveContext.rotate(-0.3 + turn);
      waveContext.scale(size * (layer ? 0.8 : 1), size * (layer ? 0.36 : 0.5));
      for (let arm = 0; arm < atmospherePaths.length; arm++) {
        const breath = 0.8 + Math.sin(t * 0.23 + arm * 1.7 + layer) * 0.16;
        waveContext.strokeStyle = `rgb(${tones[arm % 2]} / ${0.13 * intensity * breath})`;
        waveContext.lineWidth = 0.009;
        waveContext.stroke(atmospherePaths[arm]);
        waveContext.strokeStyle = `rgb(${tones[arm % 2]} / ${0.23 * intensity * breath})`;
        waveContext.lineWidth = 0.0015;
        waveContext.stroke(atmospherePaths[arm]);
      }
      waveContext.restore();
    }
    for (let i = 0; i < (mobile ? 18 : 42); i++) {
      const particle = dust[i];
      const x = particle.x * innerWidth + Math.sin(t * 0.055 + particle.phase) * 14;
      const y =
        (((particle.y * innerHeight - t * (1.3 + particle.x) - atmosphereScroll * 0.018) %
          innerHeight) +
          innerHeight) %
        innerHeight;
      waveContext.fillStyle = `rgb(${tones[0]} / ${intensity * (0.13 + 0.09 * Math.sin(t * 0.31 + particle.phase))})`;
      waveContext.beginPath();
      waveContext.arc(x, y, 0.7 + particle.x * 0.7, 0, Math.PI * 2);
      waveContext.fill();
    }
    waveContext.restore();
    // Ambient geometry belongs in the background; pointer wakes still cross card surfaces.
    for (const rect of atmosphereBlocks) {
      const y = rect.y - scrollY;
      if (y + rect.h < 0 || y > innerHeight) continue;
      clearAtmosphere(rect.x, y, rect.w, rect.h);
    }
    document
      .querySelectorAll(
        '.journey-chapter.is-active, .pos-copy, .pos-terminal, .brew-composition, .brew-float, .case-nav, .site-header',
      )
      .forEach((element) => {
        const rect = element.getBoundingClientRect();
        if (
          rect.bottom <= 0 ||
          rect.top >= innerHeight ||
          getComputedStyle(element).visibility === 'hidden'
        )
          return;
        clearAtmosphere(rect.x, rect.y, rect.width, rect.height);
      });
  }
  function atmosphereGlow(scenic) {
    const key = scenic ? 'glow-scenic' : 'glow-page';
    if (waveSprites.has(key)) return waveSprites.get(key);
    const sprite = document.createElement('canvas');
    sprite.width = sprite.height = 128;
    const context = sprite.getContext('2d');
    if (!context) return null;
    const gradient = context.createRadialGradient(64, 64, 0, 64, 64, 64);
    const colour = atmospherePalette[scenic ? 2 : 0];
    gradient.addColorStop(0, `rgb(${colour} / 0.09)`);
    gradient.addColorStop(0.4, `rgb(${colour} / 0.035)`);
    gradient.addColorStop(1, `rgb(${colour} / 0)`);
    context.fillStyle = gradient;
    context.fillRect(0, 0, 128, 128);
    waveSprites.set(key, sprite);
    return sprite;
  }
  function waveSprite(scenic) {
    const key = scenic ? 'scenic' : 'page';
    if (waveSprites.has(key)) return waveSprites.get(key);
    const style = getComputedStyle(waveLayer);
    const tone = style.getPropertyValue(scenic ? '--wave-scenic-tone' : '--wave-tone').trim();
    const accent = style.getPropertyValue(scenic ? '--wave-scenic-accent' : '--wave-accent').trim();
    const sprite = document.createElement('canvas');
    sprite.width = sprite.height = 256;
    const context = sprite.getContext('2d');
    if (!context) return null;
    const gradient = context.createRadialGradient(128, 128, 0, 128, 128, 128);
    // Broad translucent crests and quieter troughs, baked once per palette.
    for (const [stop, alpha, colour = tone] of [
      [0, 0],
      [0.32, 0],
      [0.4, 0.025],
      [0.46, 0.12],
      [0.49, 0.22],
      [0.54, 0.05],
      [0.59, 0],
      [0.63, 0.01, accent],
      [0.69, 0.1, accent],
      [0.73, 0.25, accent],
      [0.77, 0.08, accent],
      [0.82, 0],
      [0.86, 0.02],
      [0.9, 0.13],
      [0.93, 0.3],
      [0.96, 0.07],
      [1, 0],
    ])
      gradient.addColorStop(stop, `rgb(${colour} / ${alpha})`);
    context.fillStyle = gradient;
    context.fillRect(0, 0, 256, 256);
    waveSprites.set(key, sprite);
    return sprite;
  }
  function paintWaves(now) {
    waveFrame = 0;
    if (document.hidden || !waveContext) return;
    const interval =
      innerWidth <= 760 || !finePointer.matches ? 1000 / 24 : 1000 / (canvasWaves.size ? 60 : 30);
    if (now - lastWavePaint >= interval - 1) {
      lastWavePaint = now;
      waveContext.clearRect(0, 0, innerWidth, innerHeight);
      if (!document.body.matches('.intro-running:not(.intro-revealing), .has-intro'))
        paintAtmosphere(now);
      for (const wave of canvasWaves) {
        const progress = clamp((now - wave.start) / wave.duration);
        if (progress >= 1) {
          ripples.get(wave)();
          continue;
        }
        const sprite = waveSprite(wave.scenic);
        if (!sprite) continue;
        const diameter = wave.size * (0.2 + 1.05 * (1 - (1 - progress) ** 2));
        waveContext.save();
        // Document coordinates keep old waves in their creation place during scrolling.
        waveContext.translate(wave.x, wave.y - scrollY);
        waveContext.rotate(wave.turn);
        waveContext.scale(1, wave.aspect);
        waveContext.globalAlpha = Math.sin(Math.PI * progress) ** 1.2 * (wave.touch ? 0.6 : 0.85);
        waveContext.drawImage(sprite, -diameter / 2, -diameter / 2, diameter, diameter);
        waveContext.restore();
      }
    }
    if (!reduced.matches) waveFrame = requestAnimationFrame(paintWaves);
  }
  function canvasRipple(x, y, size, { ambient, trail, touch, scenic }) {
    const wave = {
      x,
      y: y + scrollY,
      size,
      scenic,
      touch,
      start: performance.now(),
      duration: touch ? 1800 : ambient ? 4000 : trail ? 3000 : 2600,
      turn: Math.sin(x * 0.013 + y * 0.009) * 0.16,
      aspect: 0.94 + Math.sin(x * 0.01) * 0.035,
    };
    canvasWaves.add(wave);
    activeRingCount += 1;
    pageRingCount += 1;
    ripples.set(wave, () => {
      canvasWaves.delete(wave);
      ripples.delete(wave);
      activeRingCount -= 1;
      pageRingCount -= 1;
    });
    if (!waveFrame) waveFrame = requestAnimationFrame(paintWaves);
  }
  function resetPointerTrail() {
    pendingPointer = pointerSample = null;
    pointerSpeed = pointerDistance = 0;
    lastTrailWave = -Infinity;
  }
  function measureProtectedBlocks() {
    protectedBlocks = [
      ...document.querySelectorAll(
        '.calc-screen, .calc-grid, .timer-presets, .custom-time, .timer-ring, .timer-actions, .notify-row, .work-link, .copy-btn, .linkedin-connect, .contact-form :is(input, textarea, button), .darwin-page main :is(a, button, input, textarea, select), .darwin-page [data-back-top], .case-page :is(.case-next, .case-footer, button[data-inpage-target], button[data-view-image])',
      ),
    ].flatMap((element) => {
      const rect = element.getBoundingClientRect();
      if (!rect.width || !rect.height) return [];
      // Only controls need cutouts: broad text/image masks make waves look behind a card.
      const padding = 12;
      return [
        { x: rect.left, y: rect.top + scrollY, width: rect.width, height: rect.height, padding },
      ];
    });
  }
  function protectedRects() {
    const rects = protectedBlocks.map((rect) => ({ ...rect, y: rect.y - scrollY }));
    const scene = stage?.getBoundingClientRect();
    if (scene && scene.bottom > 0 && scene.top < innerHeight) {
      story.querySelectorAll('.journey-skip').forEach((element) => {
        const rect = element.getBoundingClientRect();
        rects.push({ x: rect.left, y: rect.top, width: rect.width, height: rect.height });
      });
    }
    return rects.filter((rect) => rect.y + rect.height > -24 && rect.y < innerHeight + 24);
  }
  function updateWaveMask(rects) {
    if (!waveLayer || !waveMask || !maskBase || !maskHoles) return;
    if (!maskDirty && !rects) return;
    const boxes = (rects || protectedRects()).map((rect) => {
      const padding = rect.padding ?? 16;
      return [
        Math.round(rect.x - padding),
        Math.round(rect.y - padding),
        Math.round(rect.width + padding * 2),
        Math.round(rect.height + padding * 2),
      ];
    });
    maskBoxes = boxes;
    maskDirty = false;
    const signature = `${innerWidth}:${innerHeight}:${JSON.stringify(boxes)}`;
    if (signature === previousMask) return;
    previousMask = signature;
    // Reuse one small SVG mask rather than allocate an image URL on every scroll frame.
    for (const element of [waveMask, maskBase]) {
      for (const [attribute, value] of [
        ['width', String(innerWidth)],
        ['height', String(innerHeight)],
      ]) {
        if (element.getAttribute(attribute) !== value) element.setAttribute(attribute, value);
      }
    }
    while (maskHoles.children.length > boxes.length) maskHoles.lastElementChild.remove();
    boxes.forEach((box, index) => {
      let rect = maskHoles.children[index];
      if (!rect) {
        rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('rx', '12');
        maskHoles.append(rect);
      }
      ['x', 'y', 'width', 'height'].forEach((attribute, i) => {
        const value = String(box[i]);
        if (rect.getAttribute(attribute) !== value) rect.setAttribute(attribute, value);
      });
    });
    if (!waveLayer.style.maskImage) {
      waveLayer.style.maskImage = 'url("#page-wave-mask")';
      waveLayer.style.webkitMaskImage = 'url("#page-wave-mask")';
    }
  }
  function upwardWave() {
    const position = Math.min(Math.max(0, scrollY), maximumScroll);
    const delta = position - previousScrollY;
    previousScrollY = position;
    if (delta) maskDirty = true;
    if (
      staticView() ||
      !finePointer.matches ||
      lastInputType === 'touch' ||
      document.hidden ||
      document.body.matches('.intro-running, .has-intro')
    ) {
      upwardDistance = 0;
      return;
    }
    if (delta > 8) upwardDistance = 0;
    if (delta < -1) upwardDistance -= delta;
    const mobile = innerWidth <= 760;
    if (upwardDistance < (mobile ? 110 : 80)) return;
    upwardDistance = 0;
    const now = performance.now();
    if (now - lastAmbientWave < (mobile ? 4800 : 3600)) return;
    const rects = protectedRects();
    const x = innerWidth * (ambientSide % 2 ? 0.92 : 0.08);
    let edge = innerHeight * 0.16;
    let bestGap = 0;
    let y = innerHeight * 0.64;
    const ranges = rects
      .filter((rect) => x >= rect.x - 24 && x <= rect.x + rect.width + 24)
      .map((rect) => [
        Math.max(edge, rect.y - 24),
        Math.min(innerHeight * 0.9, rect.y + rect.height + 24),
      ])
      .filter(([top, bottom]) => bottom > top)
      .sort((a, b) => a[0] - b[0]);
    for (const [top, bottom] of [...ranges, [innerHeight * 0.9, innerHeight * 0.9]]) {
      if (top - edge > bestGap) {
        bestGap = top - edge;
        y = (top + edge) / 2;
      }
      edge = Math.max(edge, bottom);
    }
    if (
      ripple(
        waveLayer,
        x,
        y,
        mobile ? Math.min(innerWidth * 0.85, 320) : Math.min(innerWidth * 0.48, 640),
        { ambient: true },
      )
    ) {
      lastAmbientWave = now;
      ambientSide += 1;
      updateWaveMask(rects);
    }
  }
  function ripple(host, x, y, size = 140, { ambient = false, trail = false } = {}) {
    if (
      !host ||
      staticView() ||
      document.hidden ||
      document.body.matches('.intro-running, .has-intro')
    )
      return false;
    const now = performance.now();
    const touch = !finePointer.matches || lastInputType !== 'mouse';
    const rings = host === waveLayer || trail || touch ? 1 : 3;
    if (!trail && now - (lastRipple.get(host) ?? -Infinity) < (touch ? 650 : 2200)) return false;
    if (activeRingCount + rings > 12) return false;
    let scenic = false;
    if (host === waveLayer) {
      if (ambient && pageRingCount > 2) return false;
      if (pageRingCount + rings > (touch || innerWidth <= 760 ? 2 : 8)) return false;
      updateWaveMask();
      const scene = stage?.getBoundingClientRect();
      scenic = Boolean(scene && y >= scene.top && y <= scene.bottom);
      // Skip completely occluded trail rings instead of spending the budget behind a card.
      const radius = size * 0.625;
      if (
        trail &&
        maskBoxes.some(
          ([left, top, w, h]) =>
            x - radius >= left &&
            x + radius <= left + w &&
            y - radius >= top &&
            y + radius <= top + h,
        )
      )
        return false;
    }
    if (!trail) lastRipple.set(host, now);
    if (host === waveLayer && waveContext) {
      canvasRipple(x, y, size, { ambient, trail, touch, scenic });
      return true;
    }
    const wave = document.createElement('span');
    wave.className = trail
      ? 'network-ripple pointer-ripple'
      : ambient
        ? 'network-ripple ambient-ripple'
        : 'network-ripple';
    wave.setAttribute('aria-hidden', 'true');
    wave.style.setProperty('--ripple-x', `${x}px`);
    wave.style.setProperty('--ripple-y', `${y + (host === waveLayer ? scrollY : 0)}px`);
    wave.style.setProperty('--ripple-size', `${size}px`);
    if (host === waveLayer) {
      wave.style.transform = `translateY(${-scrollY}px)`;
      wave.classList.toggle('scenic-ripple', scenic);
    }
    for (let i = 0; i < rings; i++) wave.append(document.createElement('i'));
    activeRingCount += rings;
    if (host === waveLayer) pageRingCount += rings;
    let fallback;
    const remove = () => {
      if (!ripples.has(wave)) return;
      clearTimeout(fallback);
      wave.remove();
      ripples.delete(wave);
      activeRingCount -= rings;
      if (host === waveLayer) pageRingCount -= rings;
    };
    ripples.set(wave, remove);
    wave.lastElementChild.addEventListener('animationend', remove, { once: true });
    host.append(wave);
    if (host === waveLayer) updateWaveMask();
    fallback = setTimeout(remove, ambient ? 4500 : trail ? 3300 : 2200);
    return true;
  }
  function sceneRipple(clientX, clientY) {
    if (!stage) return false;
    const scene = stage.getBoundingClientRect();
    if (scene.bottom <= 0 || scene.top >= innerHeight) return false;
    return pageRipple(clientX, clientY, innerWidth <= 760 ? 120 : 180);
  }
  function pageRipple(clientX, clientY, size, options) {
    if (!waveLayer) return false;
    if (clientX < 0 || clientY < 0 || clientX > innerWidth || clientY > innerHeight) return false;
    return ripple(waveLayer, clientX, clientY, size, options);
  }
  function pointerTrail() {
    const point = pendingPointer;
    pendingPointer = null;
    if (!point) return;
    const previous = pointerSample;
    pointerSample = point;
    if (!previous || point.time - previous.time > 200) {
      pointerSpeed = pointerDistance = 0;
      return;
    }
    const distance = Math.hypot(point.x - previous.x, point.y - previous.y);
    pointerDistance += distance;
    const elapsed = Math.max(8, point.time - previous.time);
    pointerSpeed +=
      (Math.min(2, distance / elapsed) - pointerSpeed) * (1 - Math.exp(-elapsed / 100));
    const speed = clamp(pointerSpeed / 1.2);
    const interval = 480 - speed * 280;
    if (pointerDistance < 30 || point.time - lastTrailWave < interval) return;
    // A recent position leaves a wake; no element follows or replaces the cursor.
    const x = previous.x * 0.6 + point.x * 0.4;
    const y = previous.y * 0.6 + point.y * 0.4;
    const size = Math.min(400, Math.max(190, innerWidth * 0.34)) * (0.78 + speed * 0.22);
    if (pageRipple(x, y, size, { trail: true })) {
      lastTrailWave = point.time;
      pointerDistance = 0;
    }
  }
  function update() {
    frame = 0;
    if (document.hidden) return;
    if (measure) {
      sizeWaveCanvas();
      const viewport = window.visualViewport;
      const nextHeight = Math.round(
        Math.min(innerHeight, viewport?.scale === 1 ? viewport.height : innerHeight),
      );
      if (story && (width !== innerWidth || Math.abs(nextHeight - height) > 130)) {
        width = innerWidth;
        height = nextHeight;
        story.style.setProperty(
          '--journey-travel',
          `${Math.round(height * (width <= 760 ? 1.35 : 1.8))}px`,
        );
      }
      if (story) {
        story.style.setProperty('--journey-vh', `${nextHeight}px`);
        storyTop = story.getBoundingClientRect().top + scrollY;
        travel = Math.max(1, story.offsetHeight - stage.clientHeight);
      }
      measureProtectedBlocks();
      measureAtmosphere();
      maskDirty = true;
      maximumScroll = Math.max(0, document.documentElement.scrollHeight - innerHeight);
      measure = false;
    }
    if (story) {
      // The sticky mountain scene needs light navigation ink in either colour theme.
      const scene = stage.getBoundingClientRect();
      const headerEdge = document.querySelector('.site-header')?.offsetHeight || 0;
      document.body.classList.toggle(
        'header-over-scenery',
        scene.top < headerEdge && scene.bottom > headerEdge,
      );
    }
    const calm = staticView();
    landscapePhotos.forEach((image) => {
      if (calm) {
        image.style.removeProperty('object-position');
        return;
      }
      const rect = image.getBoundingClientRect();
      if (rect.bottom <= 0 || rect.top >= innerHeight) return;
      const offset =
        ((rect.top + rect.height / 2) / innerHeight - 0.5) * (innerWidth <= 760 ? 3 : 7);
      image.style.objectPosition = `50% calc(50% + ${offset.toFixed(2)}px)`;
    });
    if (story) {
      const progress = clamp((scrollY - storyTop) / travel);
      if (progress > 0.15 && !calm) requestDarwin();
      const index = calm
        ? 0
        : Math.min(chapters.length - 1, Math.floor(progress * chapters.length));
      if (activeChapter !== index) {
        maskDirty = true;
        activeChapter = index;
        chapters.forEach((chapter, i) => {
          chapter.classList.toggle('is-active', calm || i === index);
          chapter.setAttribute('aria-hidden', String(!calm && i !== index));
        });
        document.dispatchEvent(
          new CustomEvent('rikesh:chapter-change', { detail: { chapter: chapters[index] } }),
        );
        count.textContent = calm
          ? 'My work and journey'
          : `${String(index + 1).padStart(2, '0')} / 04`;
      }
      const factor = calm ? 0 : innerWidth <= 760 ? 0.2 : 1;
      set('--story-progress', calm ? '1' : progress.toFixed(4));
      set(
        '--landscape-mix',
        darwinReady && !calm ? ease(clamp((progress - 0.43) / 0.35)).toFixed(4) : '0',
      );
      set('--landscape-y', `${((0.5 - progress) * 20 * factor).toFixed(2)}px`);
      set('--orbit-angle', `${(progress * 28 * factor).toFixed(2)}deg`);
      set(
        '--orb-opacity',
        (innerWidth <= 760 ? 0.15 : 0.16 + 0.1 * Math.sin(progress * Math.PI)).toFixed(3),
      );
      set('--route-progress', calm ? '0' : clamp(progress / 0.22).toFixed(4));
      if (progress === 0) routePulsed = false;
      if (
        !calm &&
        finePointer.matches &&
        lastInputType !== 'touch' &&
        !routePulsed &&
        progress >= 0.06 &&
        progress < 0.28 &&
        routeNode
      ) {
        routePulsed = true;
        const node = routeNode.getBoundingClientRect();
        sceneRipple(node.left + node.width / 2, node.top + node.height / 2);
      }
    }
    upwardWave();
    pointerTrail();
    updateWaveMask();
    const section = [...document.querySelectorAll('main > section[id], main .section[id]')].find(
      (element) => {
        const rect = element.getBoundingClientRect();
        return rect.top < innerHeight * 0.5 && rect.bottom > innerHeight * 0.5;
      },
    );
    atmosphereTarget =
      section?.id === 'tools'
        ? 0.48
        : section?.id === 'about' || section?.id === 'contact'
          ? 0.65
          : 0.9;
    if (!waveFrame) waveFrame = requestAnimationFrame(paintWaves);
    waveLayer?.querySelectorAll('.network-ripple').forEach((wave) => {
      wave.style.transform = `translateY(${-scrollY}px)`;
    });
  }
  function schedule() {
    if (!frame) frame = requestAnimationFrame(update);
  }
  function configure() {
    clearRipples();
    sizeWaveCanvas();
    previousScrollY = Math.max(0, scrollY);
    upwardDistance = 0;
    if (story) {
      story.classList.toggle('journey-enhanced', !staticView());
      document.body.classList.toggle('journey-reduced', staticView());
    }
    activeChapter = -1;
    measure = true;
    schedule();
  }
  addEventListener('scroll', schedule, { passive: true });
  addEventListener(
    'resize',
    () => {
      if (story && story.classList.contains('journey-enhanced') === staticView()) configure();
      measure = true;
      schedule();
    },
    { passive: true },
  );
  window.visualViewport?.addEventListener(
    'resize',
    () => {
      if (story && story.classList.contains('journey-enhanced') === staticView()) configure();
      measure = true;
      schedule();
    },
    { passive: true },
  );
  reduced.addEventListener('change', configure);
  document.addEventListener('rikesh:motion-settled', () => {
    measure = true;
    schedule();
  });
  finePointer.addEventListener('change', configure);
  const themeObserver = new MutationObserver(() => {
    waveSprites.clear();
    atmospherePalette = null;
    lastWavePaint = -Infinity;
    if (!waveFrame && !document.hidden) waveFrame = requestAnimationFrame(paintWaves);
  });
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme'],
  });
  if ('ResizeObserver' in window) {
    const observer = new ResizeObserver(() => {
      measure = true;
      schedule();
    });
    observer.observe(document.querySelector('main'));
  }
  document.fonts?.ready.then(() => {
    measure = true;
    schedule();
  });
  document.addEventListener(
    'pointermove',
    (event) => {
      if (event.pointerType !== 'mouse') {
        if (
          touchOrigin &&
          Math.hypot(event.clientX - touchOrigin.x, event.clientY - touchOrigin.y) > 10
        )
          touchOrigin = null;
        return;
      }
      lastInputType = 'mouse';
      if (
        !finePointer.matches ||
        event.buttons ||
        staticView() ||
        document.hidden ||
        document.body.matches('.intro-running, .has-intro')
      ) {
        resetPointerTrail();
        return;
      }
      pendingPointer = { x: event.clientX, y: event.clientY, time: performance.now() };
      schedule();
    },
    { passive: true },
  );
  document.addEventListener('pointerleave', resetPointerTrail, { passive: true });
  document.addEventListener(
    'pointerdown',
    (event) => {
      lastInputType = event.pointerType === 'mouse' ? 'mouse' : 'touch';
      resetPointerTrail();
      touchOrigin = null;
      if (
        event.pointerType === 'mouse' ||
        event.target.closest('a, button, input, textarea, select, [contenteditable]')
      )
        return;
      touchOrigin = {
        id: event.pointerId,
        x: event.clientX,
        y: event.clientY,
        time: performance.now(),
        scroll: scrollY,
      };
    },
    { passive: true },
  );
  document.addEventListener(
    'pointerup',
    (event) => {
      const start = touchOrigin;
      touchOrigin = null;
      if (
        !start ||
        event.pointerId !== start.id ||
        event.target.closest('a, button, input, textarea, select, [contenteditable]')
      )
        return;
      if (
        performance.now() - start.time > 450 ||
        Math.abs(scrollY - start.scroll) > 4 ||
        Math.hypot(event.clientX - start.x, event.clientY - start.y) > 10
      )
        return;
      pageRipple(event.clientX, event.clientY, 120);
    },
    { passive: true },
  );
  document.addEventListener(
    'pointercancel',
    () => {
      touchOrigin = null;
      resetPointerTrail();
    },
    { passive: true },
  );
  document
    .querySelectorAll('.portfolio-home :is(.work-preview, .nav-contact, .linkedin-connect)')
    .forEach((link) => {
      function echo(event) {
        if (event.type === 'pointerenter' && event.pointerType !== 'mouse') return;
        if (event.type === 'pointerdown' && event.pointerType !== 'mouse') return;
        const rect = link.getBoundingClientRect();
        ripple(
          link,
          rect.width * 0.65,
          rect.height * 0.55,
          link.classList.contains('work-preview') ? 130 : 74,
        );
      }
      link.addEventListener('pointerenter', echo, { passive: true });
      link.addEventListener('pointerdown', echo, { passive: true });
      link.addEventListener('focus', echo);
      link.addEventListener(
        'click',
        (event) => {
          if (lastInputType === 'touch') echo(event);
        },
        { passive: true },
      );
    });
  document.addEventListener('visibilitychange', () => {
    resetPointerTrail();
    if (document.hidden) {
      clearRipples();
      cancelAnimationFrame(frame);
      frame = 0;
    } else {
      previousScrollY = Math.max(0, scrollY);
      measure = true;
      schedule();
    }
  });
  addEventListener('pagehide', clearRipples);
  addEventListener('pageshow', () => {
    measure = true;
    lastAtmosphereFrame = 0;
    schedule();
  });
  configure();
})();

(() => {
  'use strict';
  // Reference stages follow aaa.mp4. The final 1s hands the dark wipe to the existing page.
  const timing = Object.freeze({
    line: 0.55,
    lineDuration: 0.32,
    expand: 1.1,
    expandDuration: 0.9,
    retract: 4.45,
    retractDuration: 0.75,
    lineCollapse: 5.25,
    lineCollapseDuration: 0.2,
    dark: 5.48,
    darkDuration: 0.55,
    page: 6.06,
    pageDuration: 0.62,
    handover: 7.04,
    heading: 0.72,
    content: 0.62,
    image: 0.82,
    entrance: 0.68,
  });
  const root = document.documentElement;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const gsap = window.gsap;
  const seen = new WeakSet();
  const running = new Set();
  let observer;
  let welcome = document.querySelector('#site-intro');
  let welcomeTimeline;
  let welcoming = false;
  let welcomeStyles;
  let welcomeTargets = [];
  let navigationTimeline;
  let navigationTimer;
  let navigationURL;
  const pageOpacity = document.body.style.opacity;

  function resetPageExit() {
    navigationTimeline?.kill();
    navigationTimeline = null;
    clearTimeout(navigationTimer);
    navigationURL = null;
    if (pageOpacity) document.body.style.opacity = pageOpacity;
    else document.body.style.removeProperty('opacity');
    if (!document.body.getAttribute('style')) document.body.removeAttribute('style');
  }
  document.addEventListener('click', (event) => {
    if (
      !gsap ||
      motion.matches ||
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    )
      return;
    const link = event.target instanceof Element && event.target.closest('a[href]');
    if (!link || link.hasAttribute('download') || (link.target && link.target !== '_self')) return;
    let url;
    try {
      url = new URL(link.href, location.href);
    } catch {
      return;
    }
    if (
      url.origin !== location.origin ||
      !['http:', 'https:'].includes(url.protocol) ||
      (url.pathname === location.pathname && url.search === location.search)
    )
      return;
    if (navigationTimeline && !navigationURL) return;
    // Intercept only ordinary internal activation; native new-tab/download/link semantics remain.
    event.preventDefault();
    navigationURL = url.href;
    if (navigationTimeline) return;
    finishEntries();
    const navigate = () => {
      if (!navigationURL) return;
      const destination = navigationURL;
      navigationURL = null;
      clearTimeout(navigationTimer);
      location.assign(destination);
    };
    try {
      navigationTimeline = gsap.to(document.body, {
        opacity: 0.35,
        duration: 0.16,
        ease: 'power1.inOut',
        onComplete: navigate,
      });
      // Navigation still completes if a suspended animation frame misses its callback.
      navigationTimer = setTimeout(navigate, 260);
    } catch {
      navigate();
    }
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && navigationTimeline) resetPageExit();
  });

  const entryTargets = () => [
    ...document.querySelectorAll(
      '.journey-chapter.is-active :is(h1,h2), .journey-chapter.is-active .journey-description, ' +
        '.darwin-hero > :is(h1,p,.eyebrow), .pos-opening .pos-copy > :is(h1,p,.case-kicker), ' +
        '.brew-intro :is(h1,p), .brew-opening .brew-selected, .case-page .case-nav, .site-header .nav-shell',
    ),
  ];
  const contentSelector = [
    '.section-head :is(h2,p)',
    '.work-card',
    '.about-copy > p',
    '.skill-card',
    '.darwin-commitment',
    '.tool-card',
    '.identity-card',
    '.contact-copy > :is(h2,p)',
    '.contact-form',
    '.darwin-stat',
    '.darwin-personal-note',
    '.travel-banner',
    '.place-card',
    '.day-card',
    '.practical-card',
    '.case-study > :is(h2,p)',
    '.case-study-grid > *',
    '.case-library :is(h2,.case-library-card)',
    '.brew-feature-copy > :is(h2,p)',
    '.case-next',
    '.case-summary',
    '.story > div > h2',
    '.story-item',
    '.case-section-head > :is(h2,p)',
    '.editorial-lead > :is(h2,p)',
    '.work-preview img',
    '.place-card > img',
    '.brew-feature-image img',
    '.footer-inner',
    '.case-footer',
  ].join(',');
  function saveStyles(targets) {
    return targets.map((element) => ({
      element,
      properties: ['opacity', 'translate', 'clip-path', 'will-change'].map((name) => [
        name,
        element.style.getPropertyValue(name),
        element.style.getPropertyPriority(name),
      ]),
    }));
  }
  function restoreStyles(records = []) {
    (records || []).forEach(({ element, properties }) => {
      properties.forEach(([name, value, priority]) => {
        if (value) element.style.setProperty(name, value, priority);
        else element.style.removeProperty(name);
      });
      if (!element.getAttribute('style')) element.removeAttribute('style');
    });
  }
  function animateEntry(targets, build) {
    if (!gsap || motion.matches || !targets.length) return;
    const entry = { targets, styles: saveStyles(targets), done: false };
    function finish() {
      if (entry.done) return;
      entry.done = true;
      restoreStyles(entry.styles);
      running.delete(entry);
      document.dispatchEvent(new Event('rikesh:motion-settled'));
    }
    entry.timeline = gsap.timeline({ paused: true, onComplete: finish, onInterrupt: finish });
    try {
      targets.forEach((element) => element.style.setProperty('will-change', 'opacity, translate'));
      build(entry.timeline);
      running.add(entry);
      entry.timeline.play(0);
    } catch {
      entry.timeline.kill();
      finish();
    }
  }
  function reveal(element) {
    if (seen.has(element) || !element.isConnected) return;
    seen.add(element);
    const heading = element.matches('h1,h2,h3');
    const image = element instanceof HTMLImageElement;
    animateEntry([element], (timeline) => {
      const from = { opacity: heading ? 0.2 : 0.65, translate: image ? '0px 0px' : '0px 12px' };
      const to = {
        opacity: 1,
        translate: '0px 0px',
        duration: image ? timing.image : heading ? timing.heading : timing.content,
        ease: 'power3.out',
      };
      // A moving line mask keeps the original text nodes, wrapping and kerning intact.
      if (heading || image) {
        from.clipPath = heading ? 'inset(0% -2% 100% -2%)' : 'inset(4% 0% 4% 0%)';
        to.clipPath = 'inset(-12% -2% -12% -2%)';
      }
      timeline.fromTo(element, from, to);
    });
  }
  function observeContent() {
    observer?.disconnect();
    if (!gsap || motion.matches || !('IntersectionObserver' in window)) return;
    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting || welcoming) return;
          observer.unobserve(entry.target);
          reveal(entry.target);
        });
      },
      { rootMargin: '0px 0px -4% 0px', threshold: 0.06 },
    );
    document.querySelectorAll(contentSelector).forEach((element) => {
      if (!seen.has(element)) observer.observe(element);
    });
  }
  function finishEntries() {
    [...running].forEach((entry) => entry.timeline.progress(1).kill());
  }
  function unlockPage() {
    document.querySelectorAll('[data-motion-inert]').forEach((element) => {
      element.inert = element.dataset.motionInert === 'true';
      delete element.dataset.motionInert;
    });
  }
  function releaseWelcome(focus = false) {
    const wasWelcoming = welcoming;
    welcoming = false;
    welcomeTimeline?.kill();
    welcomeTimeline = null;
    restoreStyles(welcomeStyles);
    welcomeStyles = null;
    clearTimeout(window.__rikeshIntroSafety);
    root.classList.remove('motion-intro-pending');
    document.body.classList.remove('intro-running', 'intro-revealing', 'has-intro', 'no-scroll');
    unlockPage();
    welcome?.remove();
    welcome = null;
    try {
      sessionStorage.setItem('rikeshIntroSeen', '1');
    } catch {}
    if (focus && wasWelcoming) {
      const target =
        document.querySelector('.journey-skip') ||
        document.querySelector('main h1') ||
        document.querySelector('main');
      if (target) {
        if (!target.matches('button,a')) target.tabIndex = -1;
        target.focus({ preventScroll: true });
      }
    }
    observeContent();
    dispatchEvent(new Event('resize'));
  }
  function entrance(timeline, at = 0) {
    welcomeTargets.forEach((element, index) => {
      seen.add(element);
      const navigation = element.matches('.nav-shell,.case-nav');
      timeline.fromTo(
        element,
        { opacity: 0.25, translate: navigation ? '0px -8px' : '0px 14px' },
        { opacity: 1, translate: '0px 0px', duration: timing.entrance, ease: 'power3.out' },
        at + Math.min(index * 0.05, 0.28),
      );
    });
    const scenery = document.querySelector('.journey-scenery');
    if (scenery)
      timeline.fromTo(
        scenery,
        { opacity: 0.6 },
        { opacity: 1, duration: timing.entrance, ease: 'power2.out' },
        at,
      );
    const controls = document.querySelector('.journey-controls');
    if (controls)
      timeline.fromTo(controls, { opacity: 0.25 }, { opacity: 1, duration: 0.55 }, at + 0.35);
    const display = document.querySelector('.terminal-display');
    if (display)
      timeline.fromTo(
        display,
        { clipPath: 'inset(100% 0% 0% 0%)' },
        { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.8, ease: 'power3.inOut' },
        at,
      );
  }
  function startWelcome() {
    if (!welcome) {
      welcome = document.createElement('div');
      welcome.id = 'site-intro';
      welcome.className = 'site-intro motion-welcome';
      welcome.setAttribute('role', 'dialog');
      welcome.setAttribute('aria-modal', 'true');
      welcome.setAttribute('aria-labelledby', 'intro-heading');
      welcome.setAttribute('aria-describedby', 'intro-description');
      welcome.innerHTML =
        '<div class="welcome-composition"> <div class="welcome-primary-mask"><h2 class="welcome-primary-text" id="intro-heading">Hi nice to meet you.</h2></div> <span class="welcome-divider" aria-hidden="true"></span> <div class="welcome-secondary-mask"><p class="welcome-secondary-text" id="intro-description">Welcome to my website.</p></div> </div> <div class="welcome-dark-wipe" aria-hidden="true"></div><button class="welcome-skip" type="button" data-skip-intro>Skip intro</button>';
      document.body.prepend(welcome);
    }
    welcoming = true;
    welcome.classList.add('motion-welcome');
    const skip = welcome.querySelector('[data-skip-intro]');
    const primary = welcome.querySelector('.welcome-primary-text');
    const secondary = welcome.querySelector('.welcome-secondary-text');
    const divider = welcome.querySelector('.welcome-divider');
    const darkWipe = welcome.querySelector('.welcome-dark-wipe');
    document.body.classList.add('intro-running');
    [...document.body.children].forEach((element) => {
      if (
        element === welcome ||
        element.matches('script,style,.page-waves,.cursor-dot,.cursor-ring')
      )
        return;
      element.dataset.motionInert = String(element.inert);
      element.inert = true;
    });
    root.classList.remove('motion-intro-pending');
    skip.addEventListener('click', () => releaseWelcome(true));
    welcome.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') releaseWelcome(true);
      if (event.key === 'Tab') {
        event.preventDefault();
        skip.focus();
      }
      if (['PageDown', 'PageUp', 'ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key))
        event.preventDefault();
    });
    welcome.addEventListener('wheel', (event) => event.preventDefault(), { passive: false });
    welcome.addEventListener('touchmove', (event) => event.preventDefault(), { passive: false });
    welcome.tabIndex = -1;
    welcome.focus({ preventScroll: true });
    welcomeTargets = entryTargets();
    welcomeStyles = saveStyles([
      ...welcomeTargets,
      ...document.querySelectorAll('.journey-scenery,.journey-controls,.terminal-display'),
    ]);
    welcomeTimeline = gsap.timeline({
      id: 'site-welcome',
      paused: true,
      onComplete: () => releaseWelcome(welcome?.contains(document.activeElement)),
    });
    // The masks stay fixed. Translating their contents reproduces the reference's centre-out reveal.
    welcomeTimeline.set(primary, { xPercent: 105 }, 0);
    welcomeTimeline.set(secondary, { xPercent: -105 }, 0);
    welcomeTimeline.set(divider, { scaleY: 0, transformOrigin: '50% 50%' }, 0);
    welcomeTimeline.to(skip, { opacity: 1, duration: 0.16 }, timing.line);
    welcomeTimeline.fromTo(
      divider,
      { scaleY: 0 },
      { scaleY: 1, duration: timing.lineDuration, ease: 'power2.out' },
      timing.line,
    );
    welcomeTimeline.to(
      [primary, secondary],
      { xPercent: 0, duration: timing.expandDuration, ease: 'power3.inOut' },
      timing.expand,
    );
    welcomeTimeline.to(
      primary,
      { xPercent: 105, duration: timing.retractDuration, ease: 'power3.inOut' },
      timing.retract,
    );
    welcomeTimeline.to(
      secondary,
      { xPercent: -105, duration: timing.retractDuration, ease: 'power3.inOut' },
      timing.retract,
    );
    welcomeTimeline.to(
      divider,
      { scaleY: 0, duration: timing.lineCollapseDuration, ease: 'power2.in' },
      timing.lineCollapse,
    );
    welcomeTimeline.fromTo(
      darkWipe,
      { clipPath: 'inset(0% 50% 0% 50%)' },
      { clipPath: 'inset(0% 0% 0% 0%)', duration: timing.darkDuration, ease: 'power3.inOut' },
      timing.dark,
    );
    // Remove white only once black covers it completely; then uncover the existing page.
    welcomeTimeline.call(
      () => {
        welcome.classList.add('welcome-dark-reveal');
        document.body.classList.add('intro-revealing');
      },
      [],
      timing.dark + timing.darkDuration,
    );
    welcomeTimeline.to(
      darkWipe,
      { clipPath: 'inset(0% 0% 100% 0%)', duration: timing.pageDuration, ease: 'power3.inOut' },
      timing.page,
    );
    welcomeTimeline.set(welcome, { pointerEvents: 'none' }, timing.page + timing.pageDuration);
    welcomeTimeline.call(unlockPage, [], timing.page + timing.pageDuration);
    entrance(welcomeTimeline, timing.page + 0.02);
    welcomeTimeline.call(() => {}, [], timing.handover);
    welcomeTimeline.play(0);
  }
  function stopAll() {
    releaseWelcome(false);
    finishEntries();
  }
  document.addEventListener('rikesh:motion-reset', stopAll);
  document.addEventListener('rikesh:chapter-change', (event) => {
    if (welcoming || motion.matches) return;
    event.detail.chapter?.querySelectorAll('h1,h2,.journey-description').forEach(reveal);
  });
  document.addEventListener('rikesh:pos-screen', (event) => {
    if (welcoming || motion.matches) return;
    event.detail.step?.querySelectorAll('h2,p').forEach(reveal);
  });
  function makeInteractive(event) {
    if (
      !(event.target instanceof Element) ||
      !event.target.closest('a,button,input,textarea,select')
    )
      return;
    [...running].forEach((entry) => {
      if (entry.targets.some((element) => element.contains(event.target)))
        entry.timeline.progress(1).kill();
    });
  }
  document.addEventListener('focusin', makeInteractive);
  document.addEventListener('pointerover', makeInteractive, { passive: true });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stopAll();
  });
  addEventListener('pagehide', () => {
    resetPageExit();
    stopAll();
    observer?.disconnect();
  });
  addEventListener('pageshow', (event) => {
    resetPageExit();
    if (event.persisted) {
      stopAll();
      observeContent();
    }
  });
  motion.addEventListener('change', () => {
    stopAll();
    observeContent();
  });
  function alignInitialFragment() {
    if (!location.hash || performance.getEntriesByType('navigation')[0]?.type === 'back_forward')
      return;
    let target;
    try {
      target = document.getElementById(decodeURIComponent(location.hash.slice(1)));
    } catch {
      return;
    }
    if (!target) return;
    const initialURL = location.href;
    const controller = new AbortController();
    let interacted = false;
    const cancel = () => {
      interacted = true;
      controller.abort();
    };
    ['wheel', 'pointerdown', 'touchstart', 'keydown'].forEach((type) =>
      addEventListener(type, cancel, { passive: true, signal: controller.signal }),
    );
    const align = () => {
      if (!interacted && location.href === initialURL)
        target.scrollIntoView({ block: 'start', behavior: 'instant' });
    };
    let pending = 2;
    const settled = () => {
      align();
      if (--pending === 0) controller.abort();
    };
    // Sticky journey/mobile device measurements can change height after native fragment scrolling.
    requestAnimationFrame(() => requestAnimationFrame(settled));
    document.fonts?.ready.then(() => {
      requestAnimationFrame(settled);
    });
    addEventListener('pagehide', () => controller.abort(), { once: true });
  }
  try {
    if (gsap && !motion.matches && root.classList.contains('motion-intro-pending')) startWelcome();
    else {
      releaseWelcome(false);
      const back = performance.getEntriesByType('navigation')[0]?.type === 'back_forward';
      if (gsap && !motion.matches && !location.hash && !back) {
        welcomeTargets = entryTargets();
        const targets = [
          ...welcomeTargets,
          ...document.querySelectorAll('.journey-scenery,.journey-controls,.terminal-display'),
        ];
        animateEntry(targets, (timeline) => entrance(timeline));
      }
    }
  } catch {
    stopAll();
  }
  alignInitialFragment();
})();
