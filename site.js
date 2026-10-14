(() => {
'use strict';
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const intro=$('#site-intro');
const introSeen=sessionStorage.getItem('rikeshIntroSeen')==='1';
function finishIntro(){ if(!intro) return; intro.classList.add('intro-hidden'); document.body.classList.remove('no-scroll'); setTimeout(()=>intro.remove(),750); }
if(intro){
  if(introSeen){ intro.remove(); document.body.classList.remove('no-scroll'); }
  else {
    document.body.classList.add('no-scroll');
    const bar=$('[data-intro-bar]',intro), pct=$('[data-intro-pct]',intro); let p=0;
    const id=setInterval(()=>{ p=Math.min(100,p+Math.ceil(Math.random()*8)+3); if(bar) bar.style.width=p+'%'; if(pct) pct.textContent=p+'%'; if(p>=100){clearInterval(id); sessionStorage.setItem('rikeshIntroSeen','1'); setTimeout(finishIntro,350);} },95);
  }
}
// cursor
const dot=$('.cursor-dot'), ring=$('.cursor-ring'); if(dot&&ring&&matchMedia('(pointer:fine)').matches){let x=0,y=0,rx=0,ry=0;addEventListener('mousemove',e=>{x=e.clientX;y=e.clientY;dot.style.left=x+'px';dot.style.top=y+'px'});(function loop(){rx+=(x-rx)*.16;ry+=(y-ry)*.16;ring.style.left=rx+'px';ring.style.top=ry+'px';requestAnimationFrame(loop)})();$$('a,button,input,textarea,select').forEach(el=>{el.addEventListener('mouseenter',()=>{ring.style.width='54px';ring.style.height='54px';ring.style.borderColor='#f6d365'});el.addEventListener('mouseleave',()=>{ring.style.width='36px';ring.style.height='36px';ring.style.borderColor='rgba(212,175,55,.48)'})})}
// canvas
const c=$('.bg-canvas'); if(c){const ctx=c.getContext('2d');let pts=[];function resize(){c.width=innerWidth*devicePixelRatio;c.height=innerHeight*devicePixelRatio;c.style.width=innerWidth+'px';c.style.height=innerHeight+'px';ctx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0);pts=Array.from({length:innerWidth<760?18:38},()=>({x:Math.random()*innerWidth,y:Math.random()*innerHeight,vx:(Math.random()-.5)*.18,vy:(Math.random()-.5)*.18,r:Math.random()*1.5+.4}))}resize();addEventListener('resize',resize);(function anim(){ctx.clearRect(0,0,innerWidth,innerHeight);for(const p of pts){p.x+=p.vx;p.y+=p.vy;if(p.x<0)p.x=innerWidth;if(p.x>innerWidth)p.x=0;if(p.y<0)p.y=innerHeight;if(p.y>innerHeight)p.y=0;ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fillStyle='rgba(212,175,55,.25)';ctx.fill()}requestAnimationFrame(anim)})()}
// Darwin clock
function clock(){const v=new Intl.DateTimeFormat('en-AU',{timeZone:'Australia/Darwin',hour:'2-digit',minute:'2-digit',hour12:true}).format(new Date());$$('[data-darwin-time]').forEach(el=>el.textContent=v)} clock();setInterval(clock,30000);
// scroll buttons no # fragments
$$('[data-scroll-target]').forEach(btn=>btn.addEventListener('click',()=>{const id=btn.dataset.scrollTarget;const el=document.getElementById(id);if(el) el.scrollIntoView({behavior:'smooth',block:'start'});$('.mobile-menu')?.classList.remove('open')}));
$('[data-menu-toggle]')?.addEventListener('click',()=>$('.mobile-menu')?.classList.toggle('open'));
$$('[data-back-top]').forEach(b=>b.addEventListener('click',()=>scrollTo({top:0,behavior:'smooth'})));
// nav active observer
const sections=$$('main section[id]'); const navBtns=$$('[data-scroll-target]'); if('IntersectionObserver'in window){const obs=new IntersectionObserver(es=>{for(const e of es) if(e.isIntersecting) navBtns.forEach(b=>b.classList.toggle('active',b.dataset.scrollTarget===e.target.id))},{rootMargin:'-38% 0px -52% 0px'});sections.forEach(s=>obs.observe(s))}
// toast
window.showToast=(msg)=>{const t=$('#toast');if(!t)return;t.textContent=msg;t.classList.add('show');clearTimeout(window.__toast);window.__toast=setTimeout(()=>t.classList.remove('show'),2300)};
// copy email
$$('[data-copy-email]').forEach(b=>b.addEventListener('click',async()=>{const email='arikesh873@gmail.com';try{await navigator.clipboard.writeText(email)}catch{const ta=document.createElement('textarea');ta.value=email;document.body.append(ta);ta.select();document.execCommand('copy');ta.remove()}showToast('Email copied: '+email)}));
// contact form -> mail client with prefilled message
const form=$('#contact-form'); form?.addEventListener('submit',e=>{e.preventDefault();const fd=new FormData(form);const name=(fd.get('name')||'').toString().trim();const from=(fd.get('email')||'').toString().trim();const subject=(fd.get('subject')||'Website enquiry').toString().trim();const message=(fd.get('message')||'').toString().trim();const body=`Name: ${name}\nEmail: ${from}\n\n${message}`;location.href=`mailto:arikesh873@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;showToast('Opening your email app…')});
$('#year')?.replaceChildren(document.createTextNode(new Date().getFullYear()));
})();