(() => {
  'use strict';
  const page = document.querySelector('.case-page');
  if (!page) return;
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const mobilePOS = matchMedia('(max-width: 600px)');
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const ease = (t) => t * t * (3 - 2 * t);
  let pending = 0;
  let measureNeeded = true;
  let storyTop = 0;
  let stepStarts = [];
  let stepHeights = [];
  let sceneHeight = innerHeight;
  let storyHeight = 0;
  let mobileLayout = null;
  let lastVisible = 0;
  const story = $('.pos-experience');
  const terminal = $('.pos-terminal');
  const screenNote = $('[data-pos-current]');
  const steps = $$('[data-pos-step]');
  const screens = $$('img[data-screen]');
  const editorial = $$('[data-editorial]');
  const composition = $('.brew-composition');
  const floats = $$('[data-brew-select]');
  const imageReady = new WeakMap();
  function setVariable(element, name, value) {
    if (element.style.getPropertyValue(name) !== value) element.style.setProperty(name, value);
  }

  function measureMobilePOS() {
    const viewport = window.visualViewport;
    const height = Math.round(
      Math.min(innerHeight, viewport?.scale === 1 ? viewport.height : innerHeight),
    );
    const copies = steps.map((step) => $('.pos-copy', step));
    const copyHeight = Math.max(...copies.slice(1).map((copy) => copy.offsetHeight));
    const openingBottom = copies[0].getBoundingClientRect().bottom + scrollY - storyTop;
    const top = 24,
      gap = 20,
      footer = 44;
    const availableHeight = Math.min(
      height - copyHeight - top - gap - footer,
      height - openingBottom - gap - footer,
    );
    const deviceWidth = Math.max(120, Math.min(innerWidth * 0.88, 520, (availableHeight * 4) / 3));
    const deviceHeight = deviceWidth * 0.75;
    const openingTop = openingBottom + gap;
    mobileLayout = {
      height,
      copyHeight,
      copyTop: top + deviceHeight + gap,
      lift: openingTop - top,
    };
    setVariable(story, '--pos-mobile-vh', `${height}px`);
    setVariable(story, '--pos-mobile-device-width', `${deviceWidth}px`);
    setVariable(story, '--pos-mobile-device-center', `${openingTop + deviceHeight / 2}px`);
    setVariable(story, '--pos-mobile-copy-top', `${mobileLayout.copyTop}px`);
    return height;
  }

  function navigateScreen(index) {
    const step = steps[clamp(index, 0, steps.length - 1)];
    if (!step) return;
    window.scrollTo({
      top: step.getBoundingClientRect().top + scrollY,
      behavior: motion.matches ? 'auto' : 'smooth',
    });
  }

  function loadScreen(image) {
    if (!image || imageReady.has(image)) return;
    imageReady.set(image, false);
    if (image.dataset.src) image.src = image.dataset.src;
    const loaded = async () => {
      try {
        await image.decode();
      } catch {}
      if (!image.naturalWidth) return;
      imageReady.set(image, true);
      schedule();
    };
    if (image.complete && image.naturalWidth) loaded();
    else {
      image.addEventListener('load', loaded, { once: true });
      image.addEventListener(
        'error',
        () => {
          imageReady.delete(image);
        },
        { once: true },
      );
    }
  }

  function update() {
    pending = 0;
    if (measureNeeded) {
      mobileLayout = null;
      page.classList.toggle('pos-mobile-ready', Boolean(story && mobilePOS.matches));
      if (story) storyTop = story.getBoundingClientRect().top + scrollY;
      sceneHeight = story
        ? mobilePOS.matches
          ? measureMobilePOS()
          : $('.pos-device-stage').clientHeight
        : innerHeight;
    }
    const height = sceneHeight;
    // Complete layout reads before changing any scene styles.
    const compositionRect = composition?.getBoundingClientRect();
    const editorialRects = editorial.map((section) => section.getBoundingClientRect());
    if (story) {
      if (measureNeeded) {
        storyTop = story.getBoundingClientRect().top + scrollY;
        stepStarts = steps.map((step) => step.offsetTop);
        stepHeights = steps.map((step) => step.offsetHeight);
        storyHeight = story.offsetHeight;
      }
      const position = scrollY - storyTop;
      const opening = clamp(position / (height * 0.95));
      const lift = motion.matches ? (opening >= 0.7 ? 1 : 0) : ease(opening);
      setVariable(
        story,
        '--device-lift',
        `${-(mobileLayout ? mobileLayout.lift : height * 0.17) * lift}px`,
      );
      const last = stepStarts[stepStarts.length - 1];
      const exit = clamp((position - last) / (height * 0.7));
      setVariable(
        story,
        '--device-scale',
        motion.matches ? '1' : (1 - 0.12 * ease(exit)).toFixed(4),
      );
      const cursor = position + height * 0.5;
      let current = 0;
      for (let i = 1; i < stepStarts.length; i++) if (cursor >= stepStarts[i]) current = i;
      const next = Math.min(current + 1, screens.length - 1);
      loadScreen(screens[current]);
      if (opening > 0.35) [Math.max(0, current - 1), next].forEach((i) => loadScreen(screens[i]));
      const mix = motion.matches
        ? 0
        : ease(clamp((cursor - (stepStarts[next] - height * 0.08)) / (height * 0.08)));
      // Never fade to a screenshot which has not arrived yet.
      const incomingReady = imageReady.get(screens[next]);
      const blend = next !== current && incomingReady ? mix : 0;
      let visible = imageReady.get(screens[current]) ? current : lastVisible;
      lastVisible = visible;
      screens.forEach((img, i) => {
        // Keep the underlying screen opaque to avoid a dark dip during a dissolve.
        const opacity = String(i === visible ? 1 : i === next ? blend : 0);
        if (img.style.opacity !== opacity) img.style.opacity = opacity;
      });
      terminal.setAttribute(
        'aria-label',
        `Restaurant POS terminal showing ${screens[Math.max(0, visible)].alt}. Use the left and right arrow keys or swipe the screen to browse.`,
      );
      if (terminal.dataset.screen !== String(visible)) {
        terminal.dataset.screen = String(visible);
        document.dispatchEvent(
          new CustomEvent('rikesh:pos-screen', { detail: { step: steps[visible] } }),
        );
      }
      if (mobileLayout) {
        const offset = Math.min(0, storyHeight - height - position);
        setVariable(story, '--pos-mobile-stage-offset', `${offset}px`);
        const copyTop = mobileLayout.copyTop + offset;
        story.classList.toggle(
          'is-mobile-active',
          position >= 0 && copyTop < height && copyTop + mobileLayout.copyHeight > 0,
        );
      } else {
        story.classList.remove('is-mobile-active');
      }
      if (screenNote) {
        const label = `${String(visible + 1).padStart(2, '0')} / ${screens[visible].alt.replace(/ interface$/, '')}`;
        if (screenNote.textContent !== label) screenNote.textContent = label;
      }
      steps.forEach((step, i) => {
        step.classList.toggle('is-current', Boolean(mobileLayout && i === visible));
        if (!i) return;
        const center = stepStarts[i] + stepHeights[i] * 0.5;
        const distance = Math.abs(position + height * 0.5 - center) / height;
        setVariable(
          step,
          '--copy-opacity',
          mobileLayout
            ? String(i === visible ? 1 : 0)
            : motion.matches
              ? '1'
              : String(clamp(1.35 - distance)),
        );
        setVariable(
          step,
          '--copy-y',
          motion.matches || mobileLayout
            ? '0px'
            : `${clamp((center - position - height * 0.5) * 0.045, -20, 20)}px`,
        );
      });
    }
    if (!motion.matches && composition) {
      const r = compositionRect;
      if (r.bottom > 0 && r.top < height)
        floats.forEach((card, i) =>
          setVariable(
            card,
            '--float-y',
            `${clamp((height * 0.5 - r.top - r.height * 0.5) * (0.025 + i * 0.018), -22, 22)}px`,
          ),
        );
    }
    editorial.forEach((section, i) => {
      const r = editorialRects[i];
      if (r.bottom <= 0 || r.top >= height) return;
      const p = clamp((height - r.top) / (height + r.height));
      setVariable(section, '--editorial-y', motion.matches ? '0px' : `${(1 - p * 2) * 22}px`);
      setVariable(
        section,
        '--editorial-scale',
        motion.matches ? '1' : String(0.975 + 0.025 * ease(clamp(p * 2))),
      );
    });
    measureNeeded = false;
  }
  function schedule() {
    if (!pending && !document.hidden) pending = requestAnimationFrame(update);
  }
  addEventListener('scroll', schedule, { passive: true });
  addEventListener(
    'resize',
    () => {
      measureNeeded = true;
      schedule();
    },
    { passive: true },
  );
  window.visualViewport?.addEventListener(
    'resize',
    () => {
      if (story && mobilePOS.matches && window.visualViewport.scale === 1) {
        measureNeeded = true;
        schedule();
      }
    },
    { passive: true },
  );
  mobilePOS.addEventListener('change', () => {
    measureNeeded = true;
    schedule();
  });
  addEventListener('pageshow', () => {
    measureNeeded = true;
    schedule();
  });
  addEventListener('pagehide', () => {
    cancelAnimationFrame(pending);
    pending = 0;
  });
  document.addEventListener('visibilitychange', schedule);
  motion.addEventListener('change', schedule);
  document.fonts?.ready.then(() => {
    measureNeeded = true;
    schedule();
  });

  if (story && terminal) {
    terminal.addEventListener('keydown', (event) => {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      event.preventDefault();
      const current = Number(terminal.dataset.screen || 0);
      navigateScreen(current + (event.key === 'ArrowRight' ? 1 : -1));
    });
    const display = $('.terminal-display');
    let touchStart;
    display?.addEventListener(
      'pointerdown',
      (event) => {
        if (event.pointerType === 'mouse') return;
        touchStart = { x: event.clientX, y: event.clientY };
      },
      { passive: true },
    );
    display?.addEventListener(
      'pointerup',
      (event) => {
        if (!touchStart) return;
        const dx = event.clientX - touchStart.x;
        const dy = event.clientY - touchStart.y;
        touchStart = null;
        if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy) * 1.25) return;
        navigateScreen(Number(terminal.dataset.screen || 0) + (dx < 0 ? 1 : -1));
      },
      { passive: true },
    );
    display?.addEventListener('pointercancel', () => {
      touchStart = null;
    });
  }

  const dialog = $('.case-viewer');
  const imageSource = (element) =>
    element instanceof HTMLAnchorElement ? element.href : element.dataset.imageSrc;
  const imageActions = $$('[data-view-image]').map((link) => {
    if (!(link instanceof HTMLAnchorElement) || !dialog?.showModal) return link;
    const button = document.createElement('button');
    for (const attribute of link.attributes) {
      if (!['href', 'target', 'rel'].includes(attribute.name))
        button.setAttribute(attribute.name, attribute.value);
    }
    button.type = 'button';
    button.dataset.imageSrc = link.href;
    button.setAttribute('aria-haspopup', 'dialog');
    if (!dialog.id) dialog.id = 'case-screenshot-viewer';
    button.setAttribute('aria-controls', dialog.id);
    button.append(...link.childNodes);
    link.replaceWith(button);
    return button;
  });
  const inspect = $('.brew-inspect');
  floats.forEach((card) =>
    card.addEventListener('click', () => {
      floats.forEach((other) => {
        const selected = other === card;
        other.classList.toggle('is-selected', selected);
        other.setAttribute('aria-pressed', String(selected));
      });
      const libraryLink = $$('.case-library-card')[Number(card.dataset.brewSelect)];
      const source = imageSource(libraryLink);
      const fullPreview = source.replace(/\.png$/, '.webp');
      $('img', card).src = fullPreview;
      $('[data-brew-caption]').textContent = libraryLink.dataset.description;
      if (inspect instanceof HTMLAnchorElement) inspect.href = source;
      else inspect.dataset.imageSrc = source;
      inspect.dataset.title = libraryLink.dataset.title;
      inspect.dataset.description = libraryLink.dataset.description;
    }),
  );

  const viewerImage = $('[data-viewer-image]');
  const zoom = $('[data-zoom]');
  let lastFocus;
  function resetZoom() {
    dialog.classList.remove('is-zoomed');
    zoom.setAttribute('aria-pressed', 'false');
    zoom.textContent = 'Zoom to original';
  }
  imageActions.forEach((link) =>
    link.addEventListener('click', (event) => {
      if (!dialog.showModal) return;
      if (event.ctrlKey || event.metaKey || event.shiftKey) {
        if (link instanceof HTMLButtonElement) {
          event.preventDefault();
          window.open(imageSource(link), '_blank', 'noopener');
        }
        return;
      }
      event.preventDefault();
      lastFocus = link;
      resetZoom();
      const media = $('.viewer-media');
      const source = imageSource(link);
      media.setAttribute('aria-busy', 'true');
      media.dataset.message = 'Loading original screenshot…';
      viewerImage.style.visibility = 'hidden';
      viewerImage.onload = async () => {
        try {
          await viewerImage.decode();
        } catch {}
        if (viewerImage.src !== source) return;
        media.setAttribute('aria-busy', 'false');
        viewerImage.style.visibility = 'visible';
      };
      viewerImage.onerror = () => {
        media.dataset.message = 'Unable to load. Try the original image link below.';
        media.setAttribute('aria-busy', 'false');
      };
      viewerImage.src = source;
      viewerImage.alt = link.dataset.title + ' screenshot';
      $('#viewer-title').textContent = link.dataset.title;
      $('[data-viewer-description]').textContent = link.dataset.description;
      $('[data-original]').href = source;
      dialog.showModal();
      $('[data-close]').focus();
    }),
  );
  imageActions.forEach((button) => {
    if (!(button instanceof HTMLButtonElement)) return;
    button.addEventListener('auxclick', (event) => {
      if (event.button !== 1) return;
      event.preventDefault();
      window.open(imageSource(button), '_blank', 'noopener');
    });
  });
  $('[data-close]').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (e) => {
    if (
      e.target === dialog &&
      (e.clientX < dialog.getBoundingClientRect().left ||
        e.clientX > dialog.getBoundingClientRect().right ||
        e.clientY < dialog.getBoundingClientRect().top ||
        e.clientY > dialog.getBoundingClientRect().bottom)
    )
      dialog.close();
  });
  dialog.addEventListener('close', () => {
    resetZoom();
    lastFocus?.focus({ preventScroll: true });
  });
  zoom.addEventListener('click', () => {
    const enabled = dialog.classList.toggle('is-zoomed');
    zoom.setAttribute('aria-pressed', String(enabled));
    zoom.textContent = enabled ? 'Fit to screen' : 'Zoom to original';
  });
  function syncTheme() {
    const light = document.documentElement.dataset.theme !== 'dark';
    $$('[data-theme-label]').forEach((el) => {
      el.textContent = light ? 'Night' : 'Day';
    });
    $$('[data-theme-toggle]').forEach((el) => {
      el.setAttribute('aria-label', `Switch to ${light ? 'night' : 'day'} mode`);
      el.setAttribute('aria-pressed', String(!light));
    });
  }
  $$('[data-theme-toggle]').forEach((button) =>
    button.addEventListener('click', () => {
      const theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
      document.documentElement.dataset.theme = theme;
      try {
        localStorage.setItem('rikeshTheme', theme);
      } catch {}
      syncTheme();
    }),
  );
  syncTheme();
  screens.slice(0, 1).forEach(loadScreen);
  update();
})();
