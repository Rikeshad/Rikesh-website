(() => {
  'use strict';
  const page = document.querySelector('.case-page');
  if (!page) return;
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const ease = (t) => t * t * (3 - 2 * t);
  let pending = 0;
  let measureNeeded = true;
  let storyTop = 0;
  let stepStarts = [];
  const story = $('.pos-experience');
  const laptop = $('.laptop');
  const steps = $$('[data-pos-step]');
  const screens = $$('[data-screen]');
  const editorial = $$('[data-editorial]');
  const composition = $('.brew-composition');
  const floats = $$('[data-brew-select]');
  const imageReady = new WeakMap();

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
    const height = story ? $('.pos-device-stage').clientHeight : innerHeight;
    if (story) {
      if (measureNeeded) {
        storyTop = story.getBoundingClientRect().top + scrollY;
        stepStarts = steps.map((step) => step.offsetTop);
      }
      const position = scrollY - storyTop;
      const opening = clamp(position / (height * 0.95));
      const angle = motion.matches ? (opening < 0.55 ? 0 : 110) : ease(opening) * 110;
      story.style.setProperty('--lid-angle', `${angle.toFixed(3)}deg`);
      story.style.setProperty('--device-top', `${59 - 7 * ease(opening)}%`);
      const last = stepStarts[stepStarts.length - 1];
      const exit = clamp((position - last) / (height * 0.7));
      story.style.setProperty(
        '--device-scale',
        motion.matches ? '1' : (1 - 0.12 * ease(exit)).toFixed(4),
      );
      story.style.setProperty(
        '--device-turn',
        `${motion.matches ? -6 : -6 + opening * 6 + exit * 4}deg`,
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
      const power = motion.matches ? (angle ? 1 : 0) : ease(clamp((opening - 0.65) / 0.35));
      // Never fade to a screenshot which has not arrived yet.
      const incomingReady = imageReady.get(screens[next]);
      const blend = next !== current && incomingReady ? mix : 0;
      let visible = imageReady.get(screens[current])
        ? current
        : screens.findIndex((img) => imageReady.get(img));
      screens.forEach((img, i) => {
        img.style.opacity = String(power * (i === visible ? 1 - blend : i === next ? blend : 0));
      });
      laptop.dataset.angle = angle.toFixed(2);
      laptop.setAttribute(
        'aria-label',
        angle < 1
          ? 'Closed laptop. Scroll down to open.'
          : `Laptop showing ${screens[Math.max(0, visible)].alt}`,
      );
      steps.forEach((step, i) => {
        if (!i) return;
        const center = stepStarts[i] + step.offsetHeight * 0.5;
        const distance = Math.abs(position + height * 0.5 - center) / height;
        step.style.setProperty(
          '--copy-opacity',
          motion.matches ? '1' : String(clamp(1.35 - distance)),
        );
        step.style.setProperty(
          '--copy-y',
          motion.matches
            ? '0px'
            : `${clamp((center - position - height * 0.5) * 0.045, -20, 20)}px`,
        );
      });
    }
    if (!motion.matches && composition) {
      const r = composition.getBoundingClientRect();
      if (r.bottom > 0 && r.top < height)
        floats.forEach((card, i) =>
          card.style.setProperty(
            '--float-y',
            `${clamp((height * 0.5 - r.top - r.height * 0.5) * (0.025 + i * 0.018), -22, 22)}px`,
          ),
        );
    }
    editorial.forEach((section) => {
      const r = section.getBoundingClientRect();
      if (r.bottom <= 0 || r.top >= height) return;
      const p = clamp((height - r.top) / (height + r.height));
      section.style.setProperty('--editorial-y', motion.matches ? '0px' : `${(1 - p * 2) * 22}px`);
      section.style.setProperty(
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

  const inspect = $('.brew-inspect');
  floats.forEach((card) =>
    card.addEventListener('click', () => {
      floats.forEach((other) => {
        const selected = other === card;
        other.classList.toggle('is-selected', selected);
        other.setAttribute('aria-pressed', String(selected));
      });
      const libraryLink = $$('.case-library-card')[Number(card.dataset.brewSelect)];
      const fullPreview = libraryLink.href.replace(/\.png$/, '.webp');
      $('img', card).src = fullPreview;
      $('[data-brew-caption]').textContent = libraryLink.dataset.description;
      inspect.href = libraryLink.href;
      inspect.dataset.title = libraryLink.dataset.title;
      inspect.dataset.description = libraryLink.dataset.description;
    }),
  );

  const dialog = $('.case-viewer');
  const viewerImage = $('[data-viewer-image]');
  const zoom = $('[data-zoom]');
  let lastFocus;
  function resetZoom() {
    dialog.classList.remove('is-zoomed');
    zoom.setAttribute('aria-pressed', 'false');
    zoom.textContent = 'Zoom to original';
  }
  $$('[data-view-image]').forEach((link) =>
    link.addEventListener('click', (event) => {
      if (!dialog.showModal || event.ctrlKey || event.metaKey || event.shiftKey) return;
      event.preventDefault();
      lastFocus = link;
      resetZoom();
      const media = $('.viewer-media');
      const source = link.href;
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
      viewerImage.src = link.href;
      viewerImage.alt = link.dataset.title + ' screenshot';
      $('#viewer-title').textContent = link.dataset.title;
      $('[data-viewer-description]').textContent = link.dataset.description;
      $('[data-original]').href = link.href;
      dialog.showModal();
      $('[data-close]').focus();
    }),
  );
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
