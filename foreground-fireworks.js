(() => {
  const canvas = document.getElementById('fireworks-foreground');
  const buttons = [...document.querySelectorAll('[data-launch-fireworks-foreground]')];
  if (!canvas || !buttons.length) return;

  const ctx = canvas.getContext('2d', { alpha: true });
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarse = matchMedia('(pointer: coarse)').matches;
  const colours = ['#ffd166','#ff9f68','#ff6b81','#ffffff','#7dd3fc','#a78bfa','#6ee7b7','#f9a8d4'];
  const particles = [];
  const shells = [];
  const timers = [];
  let pendingEvents = 0;
  let dpr = 1;
  let running = false;
  let raf = 0;
  let last = 0;
  let activeButton = null;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, coarse ? 1.5 : 2);
    canvas.width = Math.round(innerWidth * dpr);
    canvas.height = Math.round(innerHeight * dpr);
    canvas.style.width = `${innerWidth}px`;
    canvas.style.height = `${innerHeight}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  addEventListener('resize', resize, { passive: true });
  addEventListener('orientationchange', () => setTimeout(resize, 150), { passive: true });
  resize();

  function rand(min, max) { return min + Math.random() * (max - min); }
  function pick(list) { return list[(Math.random() * list.length) | 0]; }

  function addParticle(x, y, vx, vy, colour, life, size, drag = .985, gravity = 72, twinkle = 0) {
    particles.push({
      x, y, px: x, py: y, vx, vy, colour, life, maxLife: life,
      size, drag, gravity, twinkle, seed: Math.random() * Math.PI * 2
    });
  }

  function explode(x, y, colour = pick(colours), style = 'sphere', boost = 1) {
    const mobile = innerWidth < 760;
    const count = Math.round((mobile ? 92 : 190) * boost);

    for (let i = 0; i < count; i += 1) {
      const t = i / count;
      let angle = Math.random() * Math.PI * 2;
      let speed = rand(mobile ? 90 : 130, mobile ? 260 : 430) * boost;
      let vx;
      let vy;

      if (style === 'ring') {
        angle = t * Math.PI * 2 + rand(-.035, .035);
        speed = rand(mobile ? 150 : 220, mobile ? 245 : 360) * boost;
        vx = Math.cos(angle) * speed;
        vy = Math.sin(angle) * speed * .72;
      } else if (style === 'palm') {
        const spokes = 12;
        const spoke = Math.floor(Math.random() * spokes);
        angle = (spoke / spokes) * Math.PI * 2 + rand(-.075, .075);
        speed = rand(mobile ? 120 : 170, mobile ? 315 : 470) * boost;
        vx = Math.cos(angle) * speed;
        vy = Math.sin(angle) * speed * .72 - rand(30, 100);
      } else {
        vx = Math.cos(angle) * speed;
        vy = Math.sin(angle) * speed;
      }

      addParticle(
        x, y, vx, vy, colour,
        rand(1.35, mobile ? 2.0 : 2.55),
        rand(mobile ? 1.2 : 1.25, mobile ? 2.3 : 2.8) * boost,
        rand(.978, .991),
        style === 'palm' ? 92 : 70,
        Math.random() < .22 ? rand(5, 12) : 0
      );
    }


    const inner = Math.round((mobile ? 26 : 54) * boost);
    for (let i = 0; i < inner; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const speed = rand(60, mobile ? 155 : 220) * boost;
      addParticle(x, y, Math.cos(angle) * speed, Math.sin(angle) * speed, '#fff7e6', rand(.65, 1.25), rand(1.0, 2.1), .975, 64, 8);
    }

    particles.push({ flash: true, x, y, life: .24, maxLife: .24, size: (mobile ? 40 : 62) * boost, colour });
  }

  function launchShell(targetX, targetY, colour, style, boost = 1) {
    shells.push({
      x: rand(innerWidth * .12, innerWidth * .88),
      y: innerHeight + 24,
      startY: innerHeight + 24,
      targetX,
      targetY,
      colour,
      style,
      boost,
      age: 0,
      duration: rand(.55, .9)
    });
  }

  function targetFor(index, count) {
    const mobile = innerWidth < 760;
    const cols = mobile ? 3 : 6;
    const col = index % cols;
    const row = Math.floor(index / cols);
    const x = ((col + .5) / cols) * innerWidth + rand(-innerWidth / cols * .18, innerWidth / cols * .18);
    const yBand = mobile ? .16 + (row % 3) * .16 : .12 + (row % 3) * .18;
    return { x, y: innerHeight * yBand + rand(-30, 35) };
  }

  function clearTimers() {
    while (timers.length) clearTimeout(timers.pop());
    pendingEvents = 0;
  }

  function schedule(fn, delay) {
    pendingEvents += 1;
    const id = setTimeout(() => {
      const index = timers.indexOf(id);
      if (index >= 0) timers.splice(index, 1);
      pendingEvents = Math.max(0, pendingEvents - 1);
      fn();
    }, delay);
    timers.push(id);
    return id;
  }

  function startShow(button) {
    if (running) return;
    running = true;
    activeButton = button;
    canvas.classList.add('is-active');
    if (button) {
      button.disabled = true;
      button.classList.remove('is-launching');
      void button.offsetWidth;
      button.classList.add('is-launching');
    }
    clearTimers();

    const mobile = innerWidth < 760;
    const count = reducedMotion ? (mobile ? 4 : 7) : (mobile ? 9 : 20);
    const styles = ['sphere','ring','sphere','palm','sphere','ring'];
    const interval = reducedMotion ? 420 : (mobile ? 360 : 250);


    const firstTarget = targetFor(0, count);
    launchShell(firstTarget.x, firstTarget.y, pick(colours), 'sphere', 1.08);

    for (let i = 1; i < count; i += 1) {
      schedule(() => {
        const target = targetFor(i, count);
        launchShell(target.x, target.y, pick(colours), styles[i % styles.length], i >= count - (mobile ? 2 : 4) ? 1.18 : 1);
      }, i * interval + rand(0, mobile ? 90 : 120));
    }


    const finaleDelay = count * interval + (mobile ? 280 : 380);
    schedule(() => {
      const spots = reducedMotion
        ? (mobile ? [[.28,.23],[.72,.22]] : [[.18,.24],[.50,.16],[.82,.24]])
        : (mobile
          ? [[.20,.23],[.52,.15],[.82,.25]]
          : [[.08,.26],[.28,.14],[.50,.22],[.72,.13],[.92,.25],[.39,.34],[.62,.32]]);
      spots.forEach((spot, i) => {
        schedule(() => explode(innerWidth * spot[0], innerHeight * spot[1], pick(colours), i % 3 === 1 ? 'ring' : 'sphere', mobile ? 1.12 : 1.30), i * 80);
      });
    }, finaleDelay);

    if (!raf) {
      last = performance.now();
      raf = requestAnimationFrame(frame);
    }
    window.showToast?.('Fireworks launched ✦');
  }

  function finishIfIdle() {
    if (shells.length || particles.length || pendingEvents > 0) return;
    running = false;
    canvas.classList.remove('is-active');
    if (activeButton) {
      activeButton.disabled = false;
      activeButton.classList.remove('is-launching');
      activeButton = null;
    }
    clearTimers();
  }

  function frame(now) {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(.033, Math.max(.001, (now - last) / 1000));
    last = now;

    ctx.clearRect(0, 0, innerWidth, innerHeight);
    ctx.globalCompositeOperation = 'lighter';


    for (let i = shells.length - 1; i >= 0; i -= 1) {
      const shell = shells[i];
      shell.age += dt;
      const p = Math.min(1, shell.age / shell.duration);
      const eased = 1 - Math.pow(1 - p, 2.4);
      const prevX = shell.x;
      const prevY = shell.y;
      shell.x += (shell.targetX - shell.x) * Math.min(1, dt * 5.6);
      shell.y = shell.startY + (shell.targetY - shell.startY) * eased;

      ctx.strokeStyle = shell.colour;
      ctx.globalAlpha = 1 - p * .25;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(prevX, prevY);
      ctx.lineTo(shell.x, shell.y);
      ctx.stroke();

      if (Math.random() < .75) addParticle(shell.x, shell.y + 6, rand(-18,18), rand(20,70), '#ffe8b0', rand(.28,.62), rand(.8,1.7), .965, 20, 5);

      if (p >= 1) {
        explode(shell.targetX, shell.targetY, shell.colour, shell.style, shell.boost);
        shells.splice(i, 1);
      }
    }

    for (let i = particles.length - 1; i >= 0; i -= 1) {
      const particle = particles[i];
      particle.life -= dt;
      if (particle.life <= 0) {
        particles.splice(i, 1);
        continue;
      }

      const alpha = Math.max(0, particle.life / particle.maxLife);

      if (particle.flash) {
        const radius = particle.size * (1 + (1 - alpha) * 1.8);
        const g = ctx.createRadialGradient(particle.x, particle.y, 0, particle.x, particle.y, radius);
        g.addColorStop(0, `rgba(255,255,255,${alpha})`);
        g.addColorStop(.18, particle.colour + Math.round(alpha * 200).toString(16).padStart(2,'0'));
        g.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.globalAlpha = .9;
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, radius, 0, Math.PI * 2);
        ctx.fill();
        continue;
      }

      particle.px = particle.x;
      particle.py = particle.y;
      particle.vx *= Math.pow(particle.drag, dt * 60);
      particle.vy = particle.vy * Math.pow(particle.drag, dt * 60) + particle.gravity * dt;
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;

      const twinkle = particle.twinkle ? .55 + .45 * Math.sin(now * .001 * particle.twinkle + particle.seed) : 1;
      ctx.globalAlpha = alpha * twinkle;
      ctx.strokeStyle = particle.colour;
      ctx.lineWidth = particle.size;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(particle.px, particle.py);
      ctx.lineTo(particle.x, particle.y);
      ctx.stroke();
    }

    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    finishIfIdle();

    if (!running && !shells.length && !particles.length) {
      cancelAnimationFrame(raf);
      raf = 0;
      ctx.clearRect(0, 0, innerWidth, innerHeight);
    }
  }

  function pauseRendering() {
    if (!raf) return;
    cancelAnimationFrame(raf);
    raf = 0;
  }

  function resumeRendering() {
    if (!running || raf || document.hidden) return;
    last = performance.now();
    raf = requestAnimationFrame(frame);
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) pauseRendering();
    else resumeRendering();
  });

  addEventListener('pagehide', () => {
    pauseRendering();
    clearTimers();
    shells.length = 0;
    particles.length = 0;
    running = false;
  }, { once: true });

  buttons.forEach(button => button.addEventListener('click', () => startShow(button)));
})();
