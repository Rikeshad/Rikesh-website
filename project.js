(() => {
  'use strict';
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
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
  const modal = $('[data-gallery-modal]');
  const modalImage = $('[data-modal-image]', modal || document);
  const modalTitle = $('[data-modal-title]', modal || document);
  const modalDescription = $('[data-modal-description]', modal || document);
  const modalClose = $('[data-modal-close]', modal || document);
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let index = 0, autoId = null, resumeId = null, pointerStart = null, pointerDelta = 0;

  const wrapIndex = i => (i + cards.length) % cards.length;
  const shortestOffset = (i, active) => {
    let d = i - active;
    const half = cards.length / 2;
    if (d > half) d -= cards.length;
    if (d < -half) d += cards.length;
    return d;
  };

  function updateDetails(card) {
    if (!card) return;
    if (kicker) kicker.textContent = card.dataset.kicker || '';
    if (title) title.textContent = card.dataset.title || '';
    if (description) description.textContent = card.dataset.description || '';
    if (count) count.textContent = `${String(index+1).padStart(2,'0')} / ${String(cards.length).padStart(2,'0')}`;
  }

  function update() {
    index = wrapIndex(index);
    cards.forEach((card, i) => {
      const offset = shortestOffset(i, index);
      const dist = Math.abs(offset);
      card.classList.toggle('is-active', offset === 0);
      card.setAttribute('aria-current', offset === 0 ? 'true' : 'false');
      card.style.zIndex = String(20 - dist);
      card.style.pointerEvents = dist <= 2 ? 'auto' : 'none';
      let x=0, scale=1, rotate=0, opacity=1;
      if (offset === -1) { x=-40; scale=.90; rotate=16; opacity=.96; }
      else if (offset === 1) { x=40; scale=.90; rotate=-16; opacity=.96; }
      else if (offset === -2) { x=-72; scale=.78; rotate=23; opacity=.78; }
      else if (offset === 2) { x=72; scale=.78; rotate=-23; opacity=.78; }
      else if (dist > 2) { x=offset<0?-116:116; scale=.66; rotate=offset<0?28:-28; opacity=0; }
      card.style.transform = `translate(-50%, -50%) translateX(${x}%) rotateY(${rotate}deg) scale(${scale})`;
      card.style.opacity = opacity;
      card.style.filter = 'none';
      card.tabIndex = dist <= 1 ? 0 : -1;
    });
    updateDetails(cards[index]);
    $$('.gallery-dot', dotsWrap || gallery).forEach((dot,i) => { dot.classList.toggle('active', i===index); dot.setAttribute('aria-current', i===index ? 'true':'false'); });
  }

  function stopAuto() { if (autoId) clearInterval(autoId); autoId=null; if (resumeId) clearTimeout(resumeId); resumeId=null; }
  function startAuto(delay=4300) { stopAuto(); if (reducedMotion || cards.length < 2) return; autoId=setInterval(()=>{ index=wrapIndex(index+1); update(); }, delay); }
  function pauseThenResume() { stopAuto(); if (!reducedMotion) resumeId=setTimeout(()=>startAuto(), 3800); }
  function go(delta) { index=wrapIndex(index+delta); update(); pauseThenResume(); }

  if (dotsWrap) {
    cards.forEach((card,i) => {
      const dot=document.createElement('button'); dot.type='button'; dot.className='gallery-dot'; dot.setAttribute('aria-label',`Show ${card.dataset.title || 'slide'} ${i+1}`);
      dot.addEventListener('click',()=>{ index=i; update(); pauseThenResume(); }); dotsWrap.appendChild(dot);
    });
  }

  prev?.addEventListener('click',()=>go(-1));
  next?.addEventListener('click',()=>go(1));

  cards.forEach((card,i)=>card.addEventListener('click',()=>{
    if (i !== index) { index=i; update(); pauseThenResume(); return; }
    const img=$('img',card); if (!img || !modal || !modalImage) return;
    modalImage.src=img.src; modalImage.alt=img.alt;
    if (modalTitle) modalTitle.textContent=card.dataset.title || '';
    if (modalDescription) modalDescription.textContent=card.dataset.description || '';
    if (typeof modal.showModal === 'function') modal.showModal(); else modal.setAttribute('open','');
    stopAuto();
  }));

  modalClose?.addEventListener('click',()=>{ modal.close?.(); modal.removeAttribute('open'); startAuto(); });
  modal?.addEventListener('click',event=>{ if (event.target === modal) { modal.close?.(); modal.removeAttribute('open'); startAuto(); } });
  modal?.addEventListener('close',()=>startAuto());

  const stage=$('[data-gallery-stage]',gallery);
  stage?.addEventListener('pointerdown',event=>{ pointerStart=event.clientX; pointerDelta=0; stage.setPointerCapture?.(event.pointerId); stopAuto(); });
  stage?.addEventListener('pointermove',event=>{ if (pointerStart === null) return; pointerDelta=event.clientX-pointerStart; });
  stage?.addEventListener('pointerup',event=>{ if (pointerStart === null) return; if (Math.abs(pointerDelta)>45) index=wrapIndex(index+(pointerDelta<0?1:-1)); pointerStart=null; pointerDelta=0; stage.releasePointerCapture?.(event.pointerId); update(); pauseThenResume(); });
  stage?.addEventListener('pointercancel',()=>{ pointerStart=null; pointerDelta=0; pauseThenResume(); });
  gallery.addEventListener('mouseenter',stopAuto);
  gallery.addEventListener('mouseleave',()=>startAuto());
  gallery.addEventListener('focusin',stopAuto);
  gallery.addEventListener('focusout',()=>startAuto());
  gallery.addEventListener('keydown',event=>{ if (event.key==='ArrowLeft') { event.preventDefault(); go(-1); } if (event.key==='ArrowRight') { event.preventDefault(); go(1); } });

  update(); startAuto();
})();
