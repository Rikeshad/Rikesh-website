(() => {
  'use strict';
  const gallery = document.querySelector('[data-gallery]');
  if (!gallery) return;
  const $ = selector => gallery.querySelector(selector);
  const cards = [...gallery.querySelectorAll('[data-gallery-card]')];
  const slides = [...gallery.querySelectorAll('[data-feature-slide]')];
  if (!cards.length || slides.length !== 2) return;
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
  const copy = [kicker, title, description, enlarge].filter(Boolean);
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const wrap = value => (value + cards.length) % cards.length;
  const gsapReady = () => typeof window.gsap !== 'undefined';
  let index = 0;
  let currentSlide = 0;
  let busy = false;
  let touchStart = null;
  let lastModalFocus = null;
  const cache = new Map();

  function sourceFor(card) {
    const img = card.querySelector('img');
    return img?.dataset.fullSrc || img?.getAttribute('src') || '';
  }
  function preload(src) {
    if (!src) return Promise.resolve(false);
    if (cache.has(src)) return cache.get(src);
    const promise = new Promise(resolve => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = src;
      if (img.complete) resolve(img.naturalWidth > 0);
    });
    cache.set(src, promise);
    return promise;
  }
  function animateElement(el, target, duration, easing) {
    if (!el || reducedMotion || !duration) {
      if (el) Object.assign(el.style, target);
      return Promise.resolve();
    }
    if (gsapReady()) {
      return new Promise(resolve => window.gsap.to(el, {
        ...target, duration: duration / 1000,
        ease: easing === 'out' ? 'power3.out' : 'power3.inOut',
        onComplete: resolve
      }));
    }
    const before = {};
    for (const key of Object.keys(target)) before[key] = getComputedStyle(el)[key];
    const animation = el.animate([before, target], {
      duration, easing:easing === 'out' ? 'cubic-bezier(.16,1,.3,1)' : 'cubic-bezier(.65,0,.35,1)', fill:'forwards'
    });
    return animation.finished.catch(() => undefined).then(() => {
      Object.assign(el.style, target);
      animation.cancel();
    });
  }
  function setContent(card) {
    kicker.textContent = card.dataset.kicker || '';
    title.textContent = card.dataset.title || '';
    description.textContent = card.dataset.description || '';
    count.textContent = `${String(index + 1).padStart(2, '0')} / ${String(cards.length).padStart(2, '0')}`;
  }
  function positionCards() {
    cards.forEach((card, i) => {
      const active = i === index;
      card.classList.toggle('is-active', active);
      card.setAttribute('aria-pressed', String(active));
      if (active) card.setAttribute('aria-current', 'true');
      else card.removeAttribute('aria-current');
      card.style.setProperty('--card-offset', String(wrap(i - index)));
    });
    dotsWrap?.querySelectorAll('.gallery-dot').forEach((dot, i) => {
      dot.classList.toggle('active', i === index);
      dot.setAttribute('aria-current', String(i === index));
    });
    const active = cards[index];
    if (rail && active) {
      const left = active.offsetLeft + active.offsetWidth / 2 - rail.clientWidth / 2;
      rail.scrollTo({left:Math.max(0,left), behavior:reducedMotion?'instant':'smooth'});
    }
  }
  function changeSlide(src) {
    const incomingIndex = 1 - currentSlide;
    const incoming = slides[incomingIndex];
    const bg = incoming.querySelector('[data-feature-bg]');
    const front = incoming.querySelector('[data-feature-image]');
    if (bg) bg.src = src;
    if (front) front.src = src;
    slides[currentSlide].classList.remove('is-current');
    slides[currentSlide].setAttribute('aria-hidden','true');
    incoming.classList.add('is-current');
    incoming.setAttribute('aria-hidden','false');
    currentSlide = incomingIndex;
  }
  async function select(nextIndex) {
    const nextValue = wrap(nextIndex);
    if (busy || nextValue === index) return;
    busy = true;
    const selected = cards[nextValue];
    const src = sourceFor(selected);
    const rect = selected.getBoundingClientRect();
    const viewWidth = document.documentElement.clientWidth;
    const viewHeight = window.innerHeight;
    const ready = await preload(src);
    const canMorph = ready && !reducedMotion && rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.top < viewHeight;
    let expanding = null;
    if (canMorph) {
      expanding = document.createElement('div');
      expanding.className = 'gallery-expanding-card';
      Object.assign(expanding.style, {
        left:'0px', top:'0px', width:`${viewWidth}px`, height:`${viewHeight}px`,
        transformOrigin:'top left',
        transform:`translate3d(${rect.left}px,${rect.top}px,0) scale(${rect.width/viewWidth},${rect.height/viewHeight})`,
        borderRadius:'15px',
        backgroundImage:`url("${src.replace(/"/g,'%22')}")`
      });
      document.body.appendChild(expanding);
      selected.classList.add('is-expanding');
      if (gsapReady()) window.gsap.to(copy,{y:-18,opacity:0,stagger:.035,duration:.22,ease:'power2.in'});
      else copy.forEach(el=>el.classList.add('gallery-copy-out'));
      await animateElement(expanding, {
        transform:'translate3d(0px,0px,0px) scale(1)',borderRadius:'0px'
      }, 1020);
    }
    index = nextValue;
    changeSlide(src);
    setContent(selected);
    positionCards();
    if (expanding) {
      await animateElement(expanding, {opacity:'0'}, 240,'out');
      expanding.remove();
      selected.classList.remove('is-expanding');
    }
    copy.forEach(el=>el.classList.remove('gallery-copy-out'));
    if (!reducedMotion) {
      if (gsapReady()) window.gsap.fromTo(copy,{y:26,opacity:0},{y:0,opacity:1,stagger:.075,duration:.55,ease:'power3.out',clearProps:'transform,opacity'});
      else copy.forEach((el,i)=>{
        el.animate([{opacity:0,transform:'translateY(26px)'},{opacity:1,transform:'translateY(0)'}],{
          duration:550,delay:i*75,easing:'cubic-bezier(.16,1,.3,1)'
        });
      });
    }
    busy = false;
    const nextSrc = sourceFor(cards[wrap(index+1)]);
    if (nextSrc) preload(nextSrc);
  }
  function openModal() {
    if (busy || !modal || !modalImage) return;
    const card = cards[index];
    lastModalFocus = document.activeElement;
    modalImage.src = sourceFor(card);
    modalImage.alt = card.dataset.title || 'Project screenshot';
    if (modalTitle) modalTitle.textContent = card.dataset.title || '';
    if (modalDescription) modalDescription.textContent = card.dataset.description || '';
    if (modal.showModal) modal.showModal();
    else modal.setAttribute('open','');
    modalClose?.focus();
  }
  function closeModal() {
    if (!modal) return;
    if (modal.close && modal.open) modal.close();
    else modal.removeAttribute('open');
    lastModalFocus?.focus?.();
  }
  cards.forEach((card,i)=>{
    card.addEventListener('click',()=>i === index?openModal():select(i));
    if (dotsWrap) {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'gallery-dot';
      dot.setAttribute('aria-label',`Show screenshot ${i+1}: ${card.dataset.title||''}`);
      dot.addEventListener('click',()=>select(i));
      dotsWrap.appendChild(dot);
    }
  });
  prev?.addEventListener('click',()=>select(index-1));
  next?.addEventListener('click',()=>select(index+1));
  enlarge?.addEventListener('click',openModal);
  modalClose?.addEventListener('click',closeModal);
  modal?.addEventListener('click',e=>{if(e.target===modal)closeModal();});
  stage?.addEventListener('pointerdown', e=>{
    if(e.pointerType==='mouse'||e.target.closest('.gallery-rail, button'))return;
    touchStart={x:e.clientX,y:e.clientY};
  });
  stage?.addEventListener('pointerup',e=>{
    if(!touchStart)return;
    const dx=e.clientX-touchStart.x,dy=e.clientY-touchStart.y;
    touchStart=null;
    if(Math.abs(dx)>42&&Math.abs(dx)>Math.abs(dy)*1.2) select(index+(dx<0?1:-1));
  });
  stage?.addEventListener('pointercancel',()=>{touchStart=null;});
  gallery.addEventListener('keydown',e=>{
    if(modal?.open||e.target.closest('input,textarea'))return;
    if(e.key==='ArrowRight'){e.preventDefault();select(index+1);}
    if(e.key==='ArrowLeft'){e.preventDefault();select(index-1);}
  });
  setContent(cards[0]);
  positionCards();
  preload(sourceFor(cards[1]));
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
