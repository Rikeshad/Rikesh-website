(() => {
  'use strict';
  const gallery = document.querySelector('[data-gallery]');
  if (!gallery) return;
  const $ = selector => gallery.querySelector(selector);
  const cards = [...gallery.querySelectorAll('[data-gallery-card]')];
  const slides = [...gallery.querySelectorAll('[data-feature-slide]')];
  if (!cards.length || slides.length < 2) return;
  const stage = $('[data-gallery-stage]');
  const rail = $('.gallery-rail');
  const title = $('[data-gallery-title]');
  const kicker = $('[data-gallery-kicker]');
  const description = $('[data-gallery-description]');
  const count = $('[data-gallery-count]');
  const prev = $('[data-gallery-prev]');
  const next = $('[data-gallery-next]');
  const dotsWrap = $('[data-gallery-dots]');
  const enlarge = $('[data-gallery-enlarge]');
  const modal = document.querySelector('[data-gallery-modal]');
  const modalImage = modal?.querySelector('[data-modal-image]');
  const modalTitle = modal?.querySelector('[data-modal-title]');
  const modalDescription = modal?.querySelector('[data-modal-description]');
  const modalClose = modal?.querySelector('[data-modal-close]');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const wrap = value => (value + cards.length) % cards.length;
  let index = 0;
  let currentSlide = 0;
  let pendingImage = 0;
  let startPoint = null;

  function showImage(card) {
    const incomingIndex = 1 - currentSlide;
    const incoming = slides[incomingIndex];
    const image = card.querySelector('img');
    if (!image) return;
    const src = image.dataset.fullSrc || image.currentSrc || image.getAttribute('src');
    const bg = incoming.querySelector('[data-feature-bg]');
    const front = incoming.querySelector('[data-feature-image]');
    const token = ++pendingImage;
    if (bg) bg.src = src;
    if (front) front.src = src;
    const finish = () => {
      if (token !== pendingImage) return;
      slides[currentSlide].classList.remove('is-current');
      slides[currentSlide].setAttribute('aria-hidden', 'true');
      incoming.classList.add('is-current');
      incoming.setAttribute('aria-hidden', 'false');
      currentSlide = incomingIndex;
    };
    if (!front || (front.complete && front.naturalWidth)) finish();
    else {
      front.addEventListener('load', finish, {once:true});
      front.addEventListener('error', finish, {once:true});
    }
  }

  function select(nextIndex, user = true) {
    const nextValue = wrap(nextIndex);
    const changed = nextValue !== index;
    index = nextValue;
    const selected = cards[index];
    if (changed) showImage(selected);
    cards.forEach((card, position) => {
      const active = position === index;
      card.classList.toggle('is-active', active);
      card.setAttribute('aria-pressed', String(active));
      if (active) card.setAttribute('aria-current', 'true');
      else card.removeAttribute('aria-current');
    });
    if (kicker) kicker.textContent = selected.dataset.kicker || '';
    if (title) title.textContent = selected.dataset.title || '';
    if (description) description.textContent = selected.dataset.description || '';
    if (count) count.textContent = `${String(index + 1).padStart(2, '0')} / ${String(cards.length).padStart(2, '0')}`;
    if (changed && title && !reducedMotion) {
      title.classList.remove('timed-copy-enter');
      void title.offsetWidth;
      title.classList.add('timed-copy-enter');
    }
    dotsWrap?.querySelectorAll('.gallery-dot').forEach((dot, position) => {
      dot.classList.toggle('active', position === index);
      dot.setAttribute('aria-current', String(position === index));
    });
    if (rail) {
      const left = selected.offsetLeft + selected.offsetWidth / 2 - rail.clientWidth / 2;
      rail.scrollTo({left:Math.max(0,left),behavior:user && !reducedMotion?'smooth':'instant'});
    }
  }

  function openModal() {
    const image = cards[index].querySelector('img');
    if (!image || !modal || !modalImage) return;
    modalImage.src = image.dataset.fullSrc || image.getAttribute('src');
    modalImage.alt = image.alt || cards[index].dataset.title || 'Project screenshot';
    if (modalTitle) modalTitle.textContent = cards[index].dataset.title || '';
    if (modalDescription) modalDescription.textContent = cards[index].dataset.description || '';
    if (typeof modal.showModal === 'function') modal.showModal();
    else modal.setAttribute('open', '');
  }

  function closeModal() {
    if (!modal) return;
    if (typeof modal.close === 'function' && modal.open) modal.close();
    else modal.removeAttribute('open');
  }

  cards.forEach((card, position) => {
    card.addEventListener('click', () => position === index ? openModal() : select(position));
    if (dotsWrap) {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'gallery-dot';
      dot.setAttribute('aria-label', `Show screenshot ${position + 1}: ${card.dataset.title || ''}`);
      dot.addEventListener('click', () => select(position));
      dotsWrap.appendChild(dot);
    }
  });
  prev?.addEventListener('click', () => select(index - 1));
  next?.addEventListener('click', () => select(index + 1));
  enlarge?.addEventListener('click', openModal);
  modalClose?.addEventListener('click', closeModal);
  modal?.addEventListener('click', event => {if (event.target === modal) closeModal();});
  stage?.addEventListener('pointerdown', event => {
    if (event.pointerType === 'mouse' || event.target.closest('.gallery-rail, button')) return;
    startPoint = {x:event.clientX,y:event.clientY};
  });
  stage?.addEventListener('pointerup', event => {
    if (!startPoint) return;
    const dx = event.clientX - startPoint.x;
    const dy = event.clientY - startPoint.y;
    startPoint = null;
    if (Math.abs(dx)>45 && Math.abs(dx)>Math.abs(dy)*1.2) select(index + (dx<0?1:-1));
  });
  stage?.addEventListener('pointercancel', () => {startPoint=null;});
  gallery.addEventListener('keydown', event => {
    if (modal?.open || event.target.closest('input, textarea')) return;
    if (event.key === 'ArrowLeft') {event.preventDefault();select(index - 1);}
    if (event.key === 'ArrowRight') {event.preventDefault();select(index + 1);}
  });
  select(0,false);
})();

(() => {
  const lazyVideos = [...document.querySelectorAll('video[data-lazy-video]')];
  if (!lazyVideos.length) return;
  const loadVideo = video => {
    if (video.dataset.loaded === 'true') return;
    video.querySelectorAll('source[data-src]').forEach(source => {
      source.src = source.dataset.src;
      source.removeAttribute('data-src');
    });
    video.dataset.loaded = 'true';
    video.load();
  };
  if (!('IntersectionObserver' in window)) {lazyVideos.forEach(loadVideo);return;}
  const observer = new IntersectionObserver(entries => entries.forEach(entry => {
    const video = entry.target;
    if (entry.isIntersecting) {
      loadVideo(video);
      video.play().catch(() => undefined);
    } else if (!video.paused) video.pause();
  }), {rootMargin:'240px 0px',threshold:.01});
  lazyVideos.forEach(video => observer.observe(video));
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) lazyVideos.forEach(video => { if (!video.paused) video.pause(); });
    else lazyVideos.forEach(video => {
      if (video.dataset.loaded === 'true' && video.getBoundingClientRect().top < innerHeight && video.getBoundingClientRect().bottom > 0) video.play().catch(() => undefined);
    });
  });
  addEventListener('pagehide', () => observer.disconnect(), {once:true});
})();
