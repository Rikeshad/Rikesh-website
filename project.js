(() => {
  'use strict';

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const gallery = $('[data-gallery]');
  if (!gallery) return;

  const cards = $$('[data-gallery-card]', gallery);
  const prev = $('[data-gallery-prev]', gallery);
  const next = $('[data-gallery-next]', gallery);
  const count = $('[data-gallery-count]', gallery);
  const title = $('[data-gallery-title]', gallery);
  const kicker = $('[data-gallery-kicker]', gallery);
  const description = $('[data-gallery-description]', gallery);
  const dotsWrap = $('[data-gallery-dots]', gallery);
  const stage = $('[data-gallery-stage]', gallery);
  const modal = $('[data-gallery-modal]');
  const modalImage = $('[data-modal-image]', modal || document);
  const modalTitle = $('[data-modal-title]', modal || document);
  const modalDescription = $('[data-modal-description]', modal || document);
  const modalClose = $('[data-modal-close]', modal || document);
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;

  let index = 0;
  let autoId = null;
  let resumeId = null;
  let pointerStart = null;
  let pointerDelta = 0;

  const wrapIndex = value => (value + cards.length) % cards.length;

  function shortestOffset(cardIndex, activeIndex) {
    let distance = cardIndex - activeIndex;
    const half = cards.length / 2;
    if (distance > half) distance -= cards.length;
    if (distance < -half) distance += cards.length;
    return distance;
  }

  function updateDetails(card) {
    if (!card) return;
    if (kicker) kicker.textContent = card.dataset.kicker || '';
    if (title) title.textContent = card.dataset.title || '';
    if (description) description.textContent = card.dataset.description || '';
    if (count) {
      count.textContent = `${String(index + 1).padStart(2, '0')} / ${String(cards.length).padStart(2, '0')}`;
    }
  }

  function resetTilt(card) {
    card.style.setProperty('--tilt-x', '0deg');
    card.style.setProperty('--tilt-y', '0deg');
  }

  function update() {
    index = wrapIndex(index);

    cards.forEach((card, cardIndex) => {
      const offset = shortestOffset(cardIndex, index);
      const distance = Math.abs(offset);
      const active = offset === 0;

      card.classList.toggle('is-active', active);
      card.setAttribute('aria-current', active ? 'true' : 'false');
      card.style.zIndex = String(30 - distance);
      card.style.pointerEvents = distance <= 2 ? 'auto' : 'none';
      card.tabIndex = distance <= 1 ? 0 : -1;
      resetTilt(card);

      let x = 0;
      let z = 0;
      let scale = 1;
      let rotateY = 0;
      let opacity = 1;

      if (offset === -1) {
        x = -46;
        z = -90;
        scale = 0.91;
        rotateY = 17;
        opacity = 0.96;
      } else if (offset === 1) {
        x = 46;
        z = -90;
        scale = 0.91;
        rotateY = -17;
        opacity = 0.96;
      } else if (offset === -2) {
        x = -77;
        z = -190;
        scale = 0.78;
        rotateY = 25;
        opacity = 0.72;
      } else if (offset === 2) {
        x = 77;
        z = -190;
        scale = 0.78;
        rotateY = -25;
        opacity = 0.72;
      } else if (distance > 2) {
        x = offset < 0 ? -118 : 118;
        z = -260;
        scale = 0.66;
        rotateY = offset < 0 ? 30 : -30;
        opacity = 0;
      } else {
        z = 72;
      }

      card.style.transform = [
        'translate(-50%, -50%)',
        `translateX(${x}%)`,
        `translateZ(${z}px)`,
        `rotateX(var(--tilt-x, 0deg))`,
        `rotateY(calc(${rotateY}deg + var(--tilt-y, 0deg)))`,
        `scale(${scale})`
      ].join(' ');
      card.style.opacity = String(opacity);
      card.style.filter = 'none';
    });

    updateDetails(cards[index]);

    $$('.gallery-dot', dotsWrap || gallery).forEach((dot, dotIndex) => {
      const active = dotIndex === index;
      dot.classList.toggle('active', active);
      dot.setAttribute('aria-current', active ? 'true' : 'false');
    });
  }

  function stopAuto() {
    if (autoId) clearInterval(autoId);
    if (resumeId) clearTimeout(resumeId);
    autoId = null;
    resumeId = null;
  }

  function startAuto(delay = 3600) {
    stopAuto();
    if (reducedMotion || cards.length < 2 || modal?.open) return;
    autoId = setInterval(() => {
      index = wrapIndex(index + 1);
      update();
    }, delay);
  }

  function pauseThenResume() {
    stopAuto();
    if (!reducedMotion) resumeId = setTimeout(() => startAuto(), 4200);
  }

  function go(delta) {
    index = wrapIndex(index + delta);
    update();
    pauseThenResume();
  }

  if (dotsWrap) {
    cards.forEach((card, cardIndex) => {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'gallery-dot';
      dot.setAttribute('aria-label', `Show ${card.dataset.title || 'slide'} ${cardIndex + 1}`);
      dot.addEventListener('click', () => {
        index = cardIndex;
        update();
        pauseThenResume();
      });
      dotsWrap.appendChild(dot);
    });
  }

  [prev, next, dotsWrap].forEach(control => {
    control?.addEventListener('pointerdown', event => event.stopPropagation());
    control?.addEventListener('pointerup', event => event.stopPropagation());
  });

  prev?.addEventListener('click', event => {
    event.stopPropagation();
    go(-1);
  });
  next?.addEventListener('click', event => {
    event.stopPropagation();
    go(1);
  });

  cards.forEach((card, cardIndex) => {
    card.addEventListener('click', () => {
      if (cardIndex !== index) {
        index = cardIndex;
        update();
        pauseThenResume();
        return;
      }

      const image = $('img', card);
      if (!image || !modal || !modalImage) return;

      modalImage.src = image.currentSrc || image.src;
      modalImage.alt = image.alt;
      if (modalTitle) modalTitle.textContent = card.dataset.title || '';
      if (modalDescription) modalDescription.textContent = card.dataset.description || '';

      if (typeof modal.showModal === 'function') modal.showModal();
      else modal.setAttribute('open', '');

      stopAuto();
    });

    if (finePointer) {
      card.addEventListener('pointermove', event => {
        if (cardIndex !== index) return;
        const rect = card.getBoundingClientRect();
        const x = (event.clientX - rect.left) / Math.max(1, rect.width) - 0.5;
        const y = (event.clientY - rect.top) / Math.max(1, rect.height) - 0.5;
        card.style.setProperty('--tilt-x', `${(-y * 4.2).toFixed(2)}deg`);
        card.style.setProperty('--tilt-y', `${(x * 5.0).toFixed(2)}deg`);
      });

      card.addEventListener('pointerleave', () => resetTilt(card));
    }
  });

  function closeModal() {
    modal?.close?.();
    modal?.removeAttribute('open');
    startAuto();
  }

  modalClose?.addEventListener('click', closeModal);
  modal?.addEventListener('click', event => {
    if (event.target === modal) closeModal();
  });
  modal?.addEventListener('close', () => startAuto());

  stage?.addEventListener('pointerdown', event => {
    pointerStart = event.clientX;
    pointerDelta = 0;
    stage.setPointerCapture?.(event.pointerId);
    stopAuto();
  });

  stage?.addEventListener('pointermove', event => {
    if (pointerStart === null) return;
    pointerDelta = event.clientX - pointerStart;
  });

  stage?.addEventListener('pointerup', event => {
    if (pointerStart === null) return;
    if (Math.abs(pointerDelta) > 45) {
      index = wrapIndex(index + (pointerDelta < 0 ? 1 : -1));
    }
    pointerStart = null;
    pointerDelta = 0;
    stage.releasePointerCapture?.(event.pointerId);
    update();
    pauseThenResume();
  });

  stage?.addEventListener('pointercancel', () => {
    pointerStart = null;
    pointerDelta = 0;
    pauseThenResume();
  });

  gallery.addEventListener('mouseenter', stopAuto);
  gallery.addEventListener('mouseleave', () => startAuto());
  gallery.addEventListener('focusin', stopAuto);
  gallery.addEventListener('focusout', () => startAuto());
  gallery.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      go(-1);
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      go(1);
    }
  });

  update();
  startAuto();
})();
