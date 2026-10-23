(() => {
  'use strict';

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  /* --------------------------------------------------------------------------
     Font readiness
     The welcome screen waits briefly for the display face so the large words
     never flash in a wider/bolder fallback and then jump after load.
  -------------------------------------------------------------------------- */
  const fontReadyPromise = (() => {
    if (!document.fonts?.load) {
      document.documentElement.classList.add('fonts-ready');
      return Promise.resolve();
    }

    const timeout = new Promise(resolve => setTimeout(resolve, 1200));
    const load = Promise.all([
      document.fonts.load('700 1em "Space Grotesk"'),
      document.fonts.load('800 1em "Plus Jakarta Sans"')
    ]).catch(() => undefined);

    return Promise.race([load, timeout]).then(() => {
      document.documentElement.classList.add('fonts-ready');
    });
  })();

  /* --------------------------------------------------------------------------
     Manual day / night theme
  -------------------------------------------------------------------------- */
  const THEME_KEY = 'rikeshTheme';

  function currentTheme() {
    return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
  }

  function syncThemeControls() {
    const isLight = currentTheme() === 'light';

    $$('[data-theme-toggle]').forEach(button => {
      const icon = $('[data-theme-icon]', button);
      const label = $('[data-theme-label]', button);

      if (icon) icon.textContent = isLight ? '☾' : '☀';
      if (label) label.textContent = isLight
        ? (button.classList.contains('theme-toggle-mobile') ? 'Night mode' : 'Night')
        : (button.classList.contains('theme-toggle-mobile') ? 'Day mode' : 'Day');

      button.setAttribute('aria-label', isLight ? 'Switch to night mode' : 'Switch to day mode');
      button.setAttribute('aria-pressed', String(isLight));
      button.title = isLight ? 'Switch to night mode' : 'Switch to day mode';
    });
  }

  function setTheme(theme) {
    const nextTheme = theme === 'light' ? 'light' : 'dark';
    document.documentElement.dataset.theme = nextTheme;

    try {
      localStorage.setItem(THEME_KEY, nextTheme);
    } catch {
      /* localStorage can be unavailable in strict privacy modes. */
    }

    syncThemeControls();
  }

  $$('[data-theme-toggle]').forEach(button => {
    button.addEventListener('click', () => {
      setTheme(currentTheme() === 'light' ? 'dark' : 'light');
    });
  });

  syncThemeControls();

  /* --------------------------------------------------------------------------
     One-time cinematic intro
  -------------------------------------------------------------------------- */
  const intro = $('#site-intro');
  const introSeen = sessionStorage.getItem('rikeshIntroSeen') === '1';

  function finishIntro() {
    if (!intro) return;
    intro.classList.add('intro-hidden');
    document.body.classList.remove('no-scroll');
    setTimeout(() => intro.remove(), 750);
  }

  if (intro) {
    if (introSeen) {
      intro.remove();
      document.body.classList.remove('no-scroll');
    } else {
      document.body.classList.add('no-scroll');
      const bar = $('[data-intro-bar]', intro);
      const percentage = $('[data-intro-pct]', intro);
      let progress = 0;

      fontReadyPromise.then(() => {
        const introTimer = setInterval(() => {
          progress = Math.min(100, progress + Math.ceil(Math.random() * 8) + 3);
          if (bar) bar.style.width = `${progress}%`;
          if (percentage) percentage.textContent = `${progress}%`;

          if (progress >= 100) {
            clearInterval(introTimer);
            sessionStorage.setItem('rikeshIntroSeen', '1');
            setTimeout(finishIntro, 350);
          }
        }, 95);
      });
    }
  }

  /* --------------------------------------------------------------------------
     Custom cursor
  -------------------------------------------------------------------------- */
  const cursorDot = $('.cursor-dot');
  const cursorRing = $('.cursor-ring');

  if (cursorDot && cursorRing && matchMedia('(pointer: fine)').matches) {
    let mouseX = 0;
    let mouseY = 0;
    let ringX = 0;
    let ringY = 0;

    addEventListener('mousemove', event => {
      mouseX = event.clientX;
      mouseY = event.clientY;
      cursorDot.style.left = `${mouseX}px`;
      cursorDot.style.top = `${mouseY}px`;
    }, { passive: true });

    function animateCursor() {
      ringX += (mouseX - ringX) * 0.16;
      ringY += (mouseY - ringY) * 0.16;
      cursorRing.style.left = `${ringX}px`;
      cursorRing.style.top = `${ringY}px`;
      requestAnimationFrame(animateCursor);
    }

    animateCursor();

    $$('a, button, input, textarea, select').forEach(element => {
      element.addEventListener('mouseenter', () => {
        cursorRing.style.width = '54px';
        cursorRing.style.height = '54px';
        cursorRing.style.borderColor = '#f6d365';
      });

      element.addEventListener('mouseleave', () => {
        cursorRing.style.width = '36px';
        cursorRing.style.height = '36px';
        cursorRing.style.borderColor = 'rgba(212,175,55,.48)';
      });
    });
  }

  /* --------------------------------------------------------------------------
     Reference-matched 3D spiral galaxy

     The galaxy uses the same visual recipe as the supplied reference:
     7 branches, radius 14, spin 2.823, high randomness power, a hot orange
     centre and deep red outer stars. It is a single coherent 3D object.
     The camera moves gently with scroll and pointer input, while the WebGL
     canvas remains fixed behind the website and never receives input.
  -------------------------------------------------------------------------- */
  const galaxyCanvas = $('.bg-canvas');

  if (galaxyCanvas) {
    const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const finePointer = matchMedia('(pointer: fine)').matches;
    const hardwareThreads = navigator.hardwareConcurrency || 4;

    let targetScroll = scrollY;
    let smoothedScroll = scrollY;
    let pointerX = 0;
    let pointerY = 0;

    async function initGalaxy() {
      let THREE;

      try {
        THREE = await import('https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js');
      } catch (error) {
        console.warn('3D galaxy could not load; the static background will remain.', error);
        galaxyCanvas.style.display = 'none';
        return;
      }

      const compact = innerWidth < 760;
      const medium = innerWidth < 1180;
      const lowPower = hardwareThreads <= 4;

      const renderer = new THREE.WebGLRenderer({
        canvas: galaxyCanvas,
        alpha: true,
        antialias: !compact,
        powerPreference: 'high-performance'
      });

      renderer.setPixelRatio(Math.min(devicePixelRatio || 1, compact ? 1.15 : 1.6));
      renderer.setSize(innerWidth, innerHeight, false);
      renderer.setClearColor(0x000000, 0);
      renderer.outputColorSpace = THREE.SRGBColorSpace;

      const scene = new THREE.Scene();
      scene.fog = new THREE.FogExp2(0x000000, compact ? 0.010 : 0.0065);

      const camera = new THREE.PerspectiveCamera(
        compact ? 72 : 70,
        innerWidth / innerHeight,
        0.1,
        120
      );

      const galaxy = new THREE.Group();
      galaxy.position.set(0, 0, 0);
      scene.add(galaxy);

      const lookTarget = new THREE.Vector3(0, 0, 0);
      const clock = new THREE.Clock();

      const parameters = {
        count: compact ? 72000 : (medium || lowPower ? 128000 : 181000),
        size: compact ? 0.040 : 0.031,
        radius: 14,
        branches: 7,
        spin: 2.823,
        randomness: 2,
        randomnessPower: 8.495,
        insideColor: '#ff6e38',
        outsideColor: '#791b1b',
        rotationSpeed: 0.75
      };

      function createParticleTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const context = canvas.getContext('2d');
        const gradient = context.createRadialGradient(32, 32, 0, 32, 32, 32);
        gradient.addColorStop(0, 'rgba(255,255,255,1)');
        gradient.addColorStop(0.12, 'rgba(255,255,255,.96)');
        gradient.addColorStop(0.36, 'rgba(255,255,255,.50)');
        gradient.addColorStop(0.68, 'rgba(255,255,255,.10)');
        gradient.addColorStop(1, 'rgba(255,255,255,0)');
        context.fillStyle = gradient;
        context.fillRect(0, 0, 64, 64);

        const texture = new THREE.CanvasTexture(canvas);
        texture.colorSpace = THREE.SRGBColorSpace;
        return texture;
      }

      const particleTexture = createParticleTexture();
      const inside = new THREE.Color(parameters.insideColor);
      const outside = new THREE.Color(parameters.outsideColor);

      function signedRandom(power) {
        return Math.pow(Math.random(), power) * (Math.random() < 0.5 ? -1 : 1);
      }

      function buildGalaxy() {
        const positions = new Float32Array(parameters.count * 3);
        const colours = new Float32Array(parameters.count * 3);

        for (let i = 0; i < parameters.count; i += 1) {
          const i3 = i * 3;
          const radius = Math.random() * parameters.radius;
          const spinAngle = radius * parameters.spin;
          const branchAngle = ((i % parameters.branches) / parameters.branches) * Math.PI * 2;

          const randomX = signedRandom(parameters.randomnessPower) * parameters.randomness * radius;
          const randomY = signedRandom(parameters.randomnessPower) * parameters.randomness * radius;
          const randomZ = signedRandom(parameters.randomnessPower) * parameters.randomness * radius;

          positions[i3] = Math.cos(branchAngle + spinAngle) * radius + randomX;
          positions[i3 + 1] = randomY;
          positions[i3 + 2] = Math.sin(branchAngle + spinAngle) * radius + randomZ;

          const t = radius / parameters.radius;
          const brightness = 0.82 + Math.random() * 0.30;
          colours[i3] = Math.min(1, (inside.r + (outside.r - inside.r) * t) * brightness);
          colours[i3 + 1] = Math.min(1, (inside.g + (outside.g - inside.g) * t) * brightness);
          colours[i3 + 2] = Math.min(1, (inside.b + (outside.b - inside.b) * t) * brightness);
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colours, 3));

        const material = new THREE.PointsMaterial({
          size: parameters.size,
          sizeAttenuation: true,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
          vertexColors: true,
          map: particleTexture,
          transparent: true,
          opacity: 0.93
        });

        const points = new THREE.Points(geometry, material);
        galaxy.add(points);
        return points;
      }

      const galaxyPoints = buildGalaxy();

      /* A restrained warm core keeps the centre bright without hiding the arms. */
      const coreGlow = new THREE.Sprite(new THREE.SpriteMaterial({
        map: particleTexture,
        color: 0xff7c3f,
        transparent: true,
        opacity: 0.18,
        depthWrite: false,
        blending: THREE.AdditiveBlending
      }));
      coreGlow.scale.set(compact ? 3.2 : 4.0, compact ? 3.2 : 4.0, 1);
      galaxy.add(coreGlow);

      /* Sparse distant stars keep the black sky alive without competing with the galaxy. */
      const backgroundStarCount = compact ? 260 : 520;
      const backgroundPositions = new Float32Array(backgroundStarCount * 3);

      for (let i = 0; i < backgroundStarCount; i += 1) {
        const i3 = i * 3;
        const radius = 28 + Math.random() * 30;
        const theta = Math.random() * Math.PI * 2;
        const u = Math.random() * 2 - 1;
        const s = Math.sqrt(1 - u * u);
        backgroundPositions[i3] = radius * s * Math.cos(theta);
        backgroundPositions[i3 + 1] = radius * u;
        backgroundPositions[i3 + 2] = radius * s * Math.sin(theta);
      }

      const backgroundGeometry = new THREE.BufferGeometry();
      backgroundGeometry.setAttribute('position', new THREE.BufferAttribute(backgroundPositions, 3));
      const backgroundStars = new THREE.Points(
        backgroundGeometry,
        new THREE.PointsMaterial({
          size: compact ? 0.045 : 0.035,
          color: 0xf6dfd2,
          transparent: true,
          opacity: 0.32,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
          map: particleTexture,
          sizeAttenuation: true
        })
      );
      scene.add(backgroundStars);

      /* ----------------------------------------------------------------------
         Spherical-wave spiral energy

         Inspired by the supplied Spherical Waves references: a faint morphing
         wire shell and several coherent luminous spiral traces sit inside the
         galaxy. They move as one visual system rather than random particles.
      ---------------------------------------------------------------------- */
      const waveEnergy = new THREE.Group();
      galaxy.add(waveEnergy);

      const waveShellGeometry = new THREE.IcosahedronGeometry(compact ? 2.85 : 3.75, compact ? 3 : 4);
      const waveShellPositions = waveShellGeometry.attributes.position;
      const waveShellBase = new Float32Array(waveShellPositions.array.length);
      waveShellBase.set(waveShellPositions.array);

      const waveShellMaterial = new THREE.MeshBasicMaterial({
        color: 0xf6d365,
        wireframe: true,
        transparent: true,
        opacity: compact ? 0.08 : 0.12,
        depthWrite: false,
        blending: THREE.AdditiveBlending
      });
      const waveShell = new THREE.Mesh(waveShellGeometry, waveShellMaterial);
      waveShell.rotation.x = 0.18;
      waveShell.rotation.z = -0.12;
      waveEnergy.add(waveShell);

      const wavePointMaterial = new THREE.PointsMaterial({
        size: compact ? 0.035 : 0.026,
        color: 0xffdf86,
        transparent: true,
        opacity: compact ? 0.12 : 0.18,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true
      });
      const wavePoints = new THREE.Points(waveShellGeometry, wavePointMaterial);
      waveEnergy.add(wavePoints);

      let storyVisual = 0;

      const spiralMaterials = [];
      const spiralTraces = [];
      const spiralPalette = [0xf6d365, 0xff7a3d, 0x7dd3fc];

      function createSpiralTrace(traceIndex) {
        const sampleCount = compact ? 1450 : 2600;
        const positions = new Float32Array(sampleCount * 3);
        const phase = traceIndex * (Math.PI * 2 / 3);
        const sphereRadius = compact ? 3.05 : 3.98;

        for (let i = 0; i < sampleCount; i += 1) {
          const t = i / (sampleCount - 1);
          const theta = phase + t * Math.PI * 2 * (5.3 + traceIndex * 0.35);
          const phi = 0.18 * Math.PI + t * 0.64 * Math.PI;
          const ripple = Math.sin(t * Math.PI * 18 + phase) * (compact ? 0.045 : 0.075);
          const radius = sphereRadius + ripple;
          const i3 = i * 3;
          positions[i3] = Math.sin(phi) * Math.cos(theta) * radius;
          positions[i3 + 1] = Math.cos(phi) * radius;
          positions[i3 + 2] = Math.sin(phi) * Math.sin(theta) * radius;
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const material = new THREE.PointsMaterial({
          size: compact ? 0.045 : 0.034,
          color: spiralPalette[traceIndex % spiralPalette.length],
          map: particleTexture,
          transparent: true,
          opacity: traceIndex === 2 ? 0.18 : 0.28,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
          sizeAttenuation: true
        });
        const trace = new THREE.Points(geometry, material);
        trace.rotation.y = phase * 0.12;
        waveEnergy.add(trace);
        spiralMaterials.push(material);
        spiralTraces.push(trace);
      }

      for (let i = 0; i < 3; i += 1) createSpiralTrace(i);

      const waveHaloGeometry = new THREE.RingGeometry(compact ? 3.1 : 3.8, compact ? 3.13 : 3.84, 180);
      const waveHaloMaterial = new THREE.MeshBasicMaterial({
        color: 0xf6d365,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.10,
        depthWrite: false,
        blending: THREE.AdditiveBlending
      });
      const waveHalo = new THREE.Mesh(waveHaloGeometry, waveHaloMaterial);
      waveHalo.rotation.x = Math.PI / 2;
      waveEnergy.add(waveHalo);

      /* ----------------------------------------------------------------------
         Full-screen celebration fireworks under the portrait
         A launch creates a multi-wave show across the viewport. No text is
         rendered in the sky; the effect is purely visual.
      ---------------------------------------------------------------------- */
      const fireworks = [];
      const fireworkShells = [];
      const fireworkFlashes = [];
      let fireworksShowActive = false;
      let fireworksShowTimers = [];

      const fireworkColours = [
        0xffd166, // gold
        0xff6f61, // coral
        0xffa94d, // warm orange
        0xfff4c2, // warm white
        0x7dd3fc, // sky blue
        0xc4b5fd, // lavender
        0xf472b6, // pink
        0x86efac  // mint green
      ];

      function randomFireworkColour() {
        return fireworkColours[Math.floor(Math.random() * fireworkColours.length)];
      }

      function createFireworkFlash(origin, colour, scale = 1) {
        const material = new THREE.SpriteMaterial({
          map: particleTexture,
          color: colour,
          transparent: true,
          opacity: 1,
          depthWrite: false,
          blending: THREE.AdditiveBlending
        });
        const sprite = new THREE.Sprite(material);
        sprite.position.copy(origin);
        sprite.scale.setScalar((compact ? 0.75 : 1.05) * scale);
        scene.add(sprite);
        fireworkFlashes.push({ sprite, material, age: 0, life: 0.42, baseScale: sprite.scale.x });
      }

      function spawnFireworkBurst(origin, colour, options = {}) {
        const {
          style = 'sphere',
          particleCount = compact ? 120 : 250,
          speedMin = compact ? 1.8 : 2.35,
          speedMax = compact ? 3.8 : 5.1,
          life = 2.4 + Math.random() * 0.65,
          size = compact ? 0.085 : 0.072
        } = options;

        const positions = new Float32Array(particleCount * 3);
        const velocities = new Float32Array(particleCount * 3);
        const drag = new Float32Array(particleCount);

        for (let i = 0; i < particleCount; i += 1) {
          const i3 = i * 3;
          const theta = Math.random() * Math.PI * 2;
          let vx;
          let vy;
          let vz;

          if (style === 'ring') {
            const tilt = (Math.random() - 0.5) * 0.30;
            const speed = speedMin + Math.random() * (speedMax - speedMin);
            vx = Math.cos(theta) * speed;
            vy = Math.sin(theta) * speed * 0.85;
            vz = tilt * speed;
          } else if (style === 'palm') {
            const spokeCount = 10;
            const spoke = Math.floor(Math.random() * spokeCount);
            const spokeAngle = (spoke / spokeCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.16;
            const speed = speedMin + Math.random() * (speedMax - speedMin);
            const lift = 0.25 + Math.random() * 0.75;
            vx = Math.cos(spokeAngle) * speed;
            vy = lift * speed;
            vz = Math.sin(spokeAngle) * speed * 0.56;
          } else {
            const phi = Math.acos(2 * Math.random() - 1);
            const speed = speedMin + Math.random() * (speedMax - speedMin);
            const sinPhi = Math.sin(phi);
            vx = Math.cos(theta) * sinPhi * speed;
            vy = Math.cos(phi) * speed;
            vz = Math.sin(theta) * sinPhi * speed;
          }

          positions[i3] = origin.x;
          positions[i3 + 1] = origin.y;
          positions[i3 + 2] = origin.z;
          velocities[i3] = vx;
          velocities[i3 + 1] = vy;
          velocities[i3 + 2] = vz;
          drag[i] = 0.982 + Math.random() * 0.012;
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const material = new THREE.PointsMaterial({
          size,
          color: colour,
          map: particleTexture,
          transparent: true,
          opacity: 1,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
          sizeAttenuation: true
        });

        const points = new THREE.Points(geometry, material);
        scene.add(points);
        fireworks.push({
          points,
          geometry,
          material,
          velocities,
          drag,
          age: 0,
          life,
          gravity: style === 'palm' ? 0.52 : 0.38
        });

        createFireworkFlash(origin, colour, style === 'ring' ? 0.8 : 1.15);

        // A small inner sparkle makes each explosion feel fuller without
        // blurring the main burst.
        if (!compact && particleCount >= 220) {
          const innerCount = Math.floor(particleCount * 0.24);
          const innerPositions = new Float32Array(innerCount * 3);
          const innerVelocities = new Float32Array(innerCount * 3);
          const innerDrag = new Float32Array(innerCount);

          for (let i = 0; i < innerCount; i += 1) {
            const i3 = i * 3;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            const speed = 0.8 + Math.random() * 2.0;
            const sinPhi = Math.sin(phi);
            innerPositions[i3] = origin.x;
            innerPositions[i3 + 1] = origin.y;
            innerPositions[i3 + 2] = origin.z;
            innerVelocities[i3] = Math.cos(theta) * sinPhi * speed;
            innerVelocities[i3 + 1] = Math.cos(phi) * speed;
            innerVelocities[i3 + 2] = Math.sin(theta) * sinPhi * speed;
            innerDrag[i] = 0.974 + Math.random() * 0.012;
          }

          const innerGeometry = new THREE.BufferGeometry();
          innerGeometry.setAttribute('position', new THREE.BufferAttribute(innerPositions, 3));
          const innerMaterial = new THREE.PointsMaterial({
            size: 0.045,
            color: 0xfff5df,
            map: particleTexture,
            transparent: true,
            opacity: 0.95,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            sizeAttenuation: true
          });
          const innerPoints = new THREE.Points(innerGeometry, innerMaterial);
          scene.add(innerPoints);
          fireworks.push({
            points: innerPoints,
            geometry: innerGeometry,
            material: innerMaterial,
            velocities: innerVelocities,
            drag: innerDrag,
            age: 0,
            life: 1.35 + Math.random() * 0.4,
            gravity: 0.25
          });
        }
      }

      function spawnFireworkShell(target, colour, style, sizeBoost = 1) {
        // Start low in the scene so a visible rising shell precedes the burst.
        const start = new THREE.Vector3(
          target.x + (Math.random() - 0.5) * 0.8,
          -2.6 - Math.random() * 0.8,
          target.z + (Math.random() - 0.5) * 0.5
        );
        const duration = compact ? 0.55 + Math.random() * 0.22 : 0.72 + Math.random() * 0.30;

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array([start.x, start.y, start.z]), 3));
        const material = new THREE.PointsMaterial({
          size: compact ? 0.13 : 0.105,
          color: colour,
          map: particleTexture,
          transparent: true,
          opacity: 1,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
          sizeAttenuation: true
        });
        const point = new THREE.Points(geometry, material);
        scene.add(point);

        fireworkShells.push({
          point,
          geometry,
          material,
          start,
          target,
          colour,
          style,
          sizeBoost,
          duration,
          age: 0,
          trailClock: 0
        });
      }

      function celebrationTarget(index, total) {
        // Fan explosions across the entire viewport instead of concentrating
        // everything in the centre. The slight Z variation adds real 3D depth.
        const column = index % 6;
        const row = Math.floor(index / 6);
        const xBands = [-6.2, -3.8, -1.4, 1.4, 3.8, 6.2];
        const baseX = xBands[column] + (Math.random() - 0.5) * 1.15;
        const baseY = 1.2 + (row % 3) * 2.15 + Math.random() * 1.35;
        const z = -2.4 + Math.random() * 4.0;

        // The final bursts are placed higher/larger for a strong finale.
        if (index >= total - (compact ? 2 : 4)) {
          return new THREE.Vector3(baseX * 0.72, 4.4 + Math.random() * 2.8, z - 0.7);
        }
        return new THREE.Vector3(baseX, baseY, z);
      }

      function clearFireworkTimers() {
        fireworksShowTimers.forEach(timer => clearTimeout(timer));
        fireworksShowTimers = [];
      }

      function launchFireworks(button) {
        if (reduceMotion) {
          window.showToast?.('Fireworks are paused because reduced motion is enabled.');
          return;
        }

        if (fireworksShowActive) {
          window.showToast?.('The fireworks show is already running ✦');
          return;
        }

        fireworksShowActive = true;
        clearFireworkTimers();

        const burstCount = compact ? 9 : 20;
        const schedule = compact
          ? [0, 300, 680, 1050, 1460, 1940, 2480, 3050, 3550]
          : [0, 140, 320, 520, 760, 980, 1240, 1510, 1800, 2120, 2450, 2790, 3140, 3490, 3860, 4240, 4620, 5000, 5360, 5660];
        const styles = ['sphere', 'ring', 'sphere', 'palm', 'sphere', 'ring'];

        for (let i = 0; i < burstCount; i += 1) {
          const timer = setTimeout(() => {
            const target = celebrationTarget(i, burstCount);
            const colour = randomFireworkColour();
            const style = styles[i % styles.length];
            const finale = i >= burstCount - (compact ? 2 : 4);
            spawnFireworkShell(target, colour, style, finale ? 1.38 : 1);
          }, schedule[i]);
          fireworksShowTimers.push(timer);
        }

        // Finale: several simultaneous large bursts fill the upper sky.
        const finaleTimer = setTimeout(() => {
          const finaleOrigins = compact
            ? [new THREE.Vector3(-2.8, 5.2, -1.8), new THREE.Vector3(2.8, 5.6, -1.6)]
            : [
                new THREE.Vector3(-6.0, 4.8, -1.9),
                new THREE.Vector3(-2.1, 6.0, -2.0),
                new THREE.Vector3(2.0, 5.8, -1.8),
                new THREE.Vector3(6.0, 4.9, -2.1),
                new THREE.Vector3(0, 7.2, -2.4)
              ];

          finaleOrigins.forEach((origin, index) => {
            spawnFireworkBurst(origin, randomFireworkColour(), {
              style: index % 2 ? 'ring' : 'sphere',
              particleCount: compact ? 165 : 360,
              speedMin: compact ? 2.2 : 2.9,
              speedMax: compact ? 4.2 : 6.3,
              life: compact ? 2.2 : 3.15,
              size: compact ? 0.095 : 0.082
            });
          });
        }, compact ? 3920 : 6100);
        fireworksShowTimers.push(finaleTimer);

        const endTimer = setTimeout(() => {
          fireworksShowActive = false;
          fireworksShowTimers = [];
          if (button) button.disabled = false;
        }, compact ? 6900 : 9300);
        fireworksShowTimers.push(endTimer);

        window.showToast?.('Fireworks launched ✦');

        if (button) {
          button.disabled = true;
          button.classList.remove('is-launching');
          void button.offsetWidth;
          button.classList.add('is-launching');
          setTimeout(() => button.classList.remove('is-launching'), 1100);
        }
      }

      $$('[data-launch-fireworks]').forEach(button => {
        button.addEventListener('click', () => launchFireworks(button));
      });

      function updateFireworkShells(delta) {
        for (let i = fireworkShells.length - 1; i >= 0; i -= 1) {
          const shell = fireworkShells[i];
          shell.age += delta;
          shell.trailClock += delta;
          const progress = Math.min(1, shell.age / shell.duration);
          const eased = 1 - Math.pow(1 - progress, 2.2);
          const position = shell.geometry.getAttribute('position');
          const array = position.array;

          array[0] = THREE.MathUtils.lerp(shell.start.x, shell.target.x, eased);
          array[1] = THREE.MathUtils.lerp(shell.start.y, shell.target.y, eased) + Math.sin(progress * Math.PI) * 0.38;
          array[2] = THREE.MathUtils.lerp(shell.start.z, shell.target.z, eased);
          position.needsUpdate = true;
          shell.material.opacity = Math.max(0.2, 1 - progress * 0.25);

          // Small sparks behind the rising shell create the launch trail.
          if (shell.trailClock > (compact ? 0.085 : 0.055) && progress < 0.92) {
            shell.trailClock = 0;
            spawnFireworkBurst(new THREE.Vector3(array[0], array[1] - 0.08, array[2]), 0xffd9a0, {
              style: 'sphere',
              particleCount: compact ? 5 : 8,
              speedMin: 0.08,
              speedMax: 0.42,
              life: 0.48,
              size: compact ? 0.045 : 0.035
            });
          }

          if (progress >= 1) {
            const finaleBoost = shell.sizeBoost;
            spawnFireworkBurst(shell.target, shell.colour, {
              style: shell.style,
              particleCount: Math.round((compact ? 145 : 285) * finaleBoost),
              speedMin: (compact ? 1.9 : 2.45) * finaleBoost,
              speedMax: (compact ? 4.0 : 5.35) * finaleBoost,
              life: (compact ? 2.1 : 2.75) * Math.min(1.2, finaleBoost),
              size: (compact ? 0.088 : 0.074) * Math.min(1.12, finaleBoost)
            });

            scene.remove(shell.point);
            shell.geometry.dispose();
            shell.material.dispose();
            fireworkShells.splice(i, 1);
          }
        }
      }

      function updateFireworks(delta) {
        updateFireworkShells(delta);

        for (let i = fireworks.length - 1; i >= 0; i -= 1) {
          const firework = fireworks[i];
          firework.age += delta;
          const position = firework.geometry.getAttribute('position');
          const array = position.array;

          for (let j = 0, particle = 0; j < array.length; j += 3, particle += 1) {
            const drag = firework.drag?.[particle] ?? 0.988;
            firework.velocities[j] *= drag;
            firework.velocities[j + 1] = firework.velocities[j + 1] * drag - firework.gravity * delta;
            firework.velocities[j + 2] *= drag;
            array[j] += firework.velocities[j] * delta;
            array[j + 1] += firework.velocities[j + 1] * delta;
            array[j + 2] += firework.velocities[j + 2] * delta;
          }

          position.needsUpdate = true;
          const remaining = Math.max(0, 1 - firework.age / firework.life);
          firework.material.opacity = Math.min(1, remaining * 1.35) * remaining;

          if (firework.age >= firework.life) {
            scene.remove(firework.points);
            firework.geometry.dispose();
            firework.material.dispose();
            fireworks.splice(i, 1);
          }
        }

        for (let i = fireworkFlashes.length - 1; i >= 0; i -= 1) {
          const flash = fireworkFlashes[i];
          flash.age += delta;
          const progress = Math.min(1, flash.age / flash.life);
          flash.material.opacity = Math.pow(1 - progress, 2);
          const scale = flash.baseScale * (1 + progress * 3.4);
          flash.sprite.scale.setScalar(scale);

          if (progress >= 1) {
            scene.remove(flash.sprite);
            flash.material.dispose();
            fireworkFlashes.splice(i, 1);
          }
        }
      }

      function scrollFraction() {
        const maxScroll = Math.max(1, document.documentElement.scrollHeight - innerHeight);
        return Math.max(0, Math.min(1, smoothedScroll / maxScroll));
      }

      let rafId = null;
      let lastFrame = performance.now();

      function renderScene(now = performance.now()) {
        const elapsed = clock.getElapsedTime();
        const delta = Math.min(0.05, Math.max(0.001, (now - lastFrame) / 1000));
        lastFrame = now;

        smoothedScroll += (targetScroll - smoothedScroll) * (reduceMotion ? 1 : 0.065);
        const scroll = scrollFraction();
        const storyProgress = Math.max(0, Math.min(1, Number(window.__rikeshWaveStoryProgress || 0)));
        const storyTarget = window.__rikeshWaveStoryActive ? 1 : 0;
        storyVisual += (storyTarget - storyVisual) * (reduceMotion ? 1 : 0.07);
        const lightTheme = document.documentElement.dataset.theme === 'light';

        /* The galaxy remains one object, but retreats while the scroll story
           brings the spherical wave forward. */
        galaxy.rotation.y = reduceMotion
          ? 0.10
          : elapsed * (parameters.rotationSpeed * 0.20) + scroll * 0.20 - storyVisual * 0.16;
        galaxyPoints.material.opacity = lightTheme
          ? 0.18 + (1 - storyVisual) * 0.08
          : 0.92 - storyVisual * 0.50;
        coreGlow.material.opacity = lightTheme
          ? 0.08 + storyVisual * 0.04
          : 0.16 + storyVisual * 0.08;
        backgroundStars.material.opacity = lightTheme ? 0.16 : 0.28;

        /* True spherical-wave deformation. The mesh itself changes shape every
           frame, rather than only scaling a rigid sphere. Scroll adds another
           time dimension so each story chapter visibly reshapes the surface. */
        const waveArray = waveShellPositions.array;
        const storyWave = 0.11 + storyVisual * (compact ? 0.16 : 0.25);
        const storyPhase = storyProgress * Math.PI * 7.5;

        if (!reduceMotion) {
          for (let i = 0; i < waveArray.length; i += 3) {
            const bx = waveShellBase[i];
            const by = waveShellBase[i + 1];
            const bz = waveShellBase[i + 2];
            const length = Math.max(0.0001, Math.hypot(bx, by, bz));
            const nx = bx / length;
            const ny = by / length;
            const nz = bz / length;
            const fluid = Math.sin(nx * 5.1 + elapsed * 1.55 + storyPhase)
              * Math.cos(ny * 4.7 - elapsed * 1.12 + storyPhase * 0.42);
            const crossWave = Math.sin((nx + nz) * 8.6 - elapsed * 0.82 + storyPhase * 0.78);
            const displacement = fluid * storyWave + crossWave * storyWave * 0.30;
            const nextLength = length + displacement;
            waveArray[i] = nx * nextLength;
            waveArray[i + 1] = ny * nextLength;
            waveArray[i + 2] = nz * nextLength;
          }
          waveShellPositions.needsUpdate = true;
        }

        const wavePulse = reduceMotion ? 1 : 1 + Math.sin(elapsed * 0.66 + storyPhase * 0.08) * (0.035 + storyVisual * 0.035);
        const waveScale = wavePulse * (0.90 + storyVisual * 0.24);
        waveShell.scale.setScalar(waveScale);
        wavePoints.scale.setScalar(waveScale);
        waveShell.rotation.y = reduceMotion ? 0.16 : elapsed * 0.095 + storyProgress * 1.8 + scroll * 0.18;
        waveShell.rotation.x = reduceMotion ? 0.18 : 0.18 + Math.sin(elapsed * 0.24 + storyProgress * Math.PI) * 0.16;
        waveShell.rotation.z = reduceMotion ? -0.12 : -0.12 + Math.sin(elapsed * 0.34) * 0.075;
        wavePoints.rotation.copy(waveShell.rotation);
        waveShellMaterial.opacity = (lightTheme ? 0.075 : 0.10) + storyVisual * (lightTheme ? 0.10 : 0.17);
        wavePointMaterial.opacity = (lightTheme ? 0.08 : 0.13) + storyVisual * (lightTheme ? 0.11 : 0.18);

        waveHalo.scale.setScalar((reduceMotion ? 1 : 1 + Math.sin(elapsed * 0.92 + storyPhase * 0.08) * 0.08) * (0.94 + storyVisual * 0.18));
        waveHalo.material.opacity = (lightTheme ? 0.035 : 0.055) + storyVisual * (lightTheme ? 0.05 : 0.08);
        spiralTraces.forEach((trace, traceIndex) => {
          const spiralScale = 0.92 + storyVisual * 0.22;
          trace.scale.setScalar(spiralScale);
          if (!reduceMotion) {
            trace.rotation.y = elapsed * (0.06 + traceIndex * 0.008) + storyProgress * (0.9 + traceIndex * 0.16);
            trace.rotation.x = Math.sin(elapsed * 0.20 + traceIndex * 0.9 + storyPhase * 0.04) * 0.10;
            trace.rotation.z = Math.sin(elapsed * 0.17 + traceIndex) * 0.055;
          }
          spiralMaterials[traceIndex].opacity = (lightTheme ? 0.07 : (traceIndex === 2 ? 0.12 : 0.17))
            + storyVisual * (lightTheme ? 0.10 : 0.18);
        });

        /* Camera choreography follows the story while it is pinned, then blends
           back into the wider full-screen galaxy for the portfolio itself. */
        const baseOrbit = 0.56 + scroll * 0.10 + (finePointer && !reduceMotion ? pointerX * 0.026 : 0);
        const normalRadius = compact ? 9.6 : 8.1;
        const normalY = (compact ? 5.8 : 4.35) - scroll * 0.35 + (finePointer && !reduceMotion ? pointerY * 0.22 : 0);
        const storyOrbit = -0.48 + storyProgress * 1.42 + (finePointer && !reduceMotion ? pointerX * 0.05 : 0);
        const storyRadius = compact ? 7.8 : 6.75;
        const storyY = (compact ? 1.15 : 0.62) + Math.sin(storyProgress * Math.PI * 2) * (compact ? 0.28 : 0.52);

        const normalX = Math.sin(baseOrbit) * normalRadius;
        const normalZ = Math.cos(baseOrbit) * normalRadius;
        const storyX = Math.sin(storyOrbit) * storyRadius;
        const storyZ = Math.cos(storyOrbit) * storyRadius;

        camera.position.x = normalX + (storyX - normalX) * storyVisual;
        camera.position.z = normalZ + (storyZ - normalZ) * storyVisual;
        camera.position.y = normalY + (storyY - normalY) * storyVisual;
        camera.lookAt(lookTarget);

        backgroundStars.rotation.y = reduceMotion ? 0 : -elapsed * 0.003;
        if (!reduceMotion) updateFireworks(delta);

        renderer.render(scene, camera);
      }

      function animate(now) {
        renderScene(now);
        rafId = requestAnimationFrame(animate);
      }

      function startAnimation() {
        if (reduceMotion || rafId !== null || document.hidden) return;
        lastFrame = performance.now();
        rafId = requestAnimationFrame(animate);
      }

      function stopAnimation() {
        if (rafId === null) return;
        cancelAnimationFrame(rafId);
        rafId = null;
      }

      addEventListener('scroll', () => {
        targetScroll = scrollY;
        if (reduceMotion) renderScene();
      }, { passive: true });

      if (finePointer && !reduceMotion) {
        addEventListener('pointermove', event => {
          const x = (event.clientX / Math.max(1, innerWidth)) * 2 - 1;
          const y = -((event.clientY / Math.max(1, innerHeight)) * 2 - 1);
          pointerX += (x - pointerX) * 0.10;
          pointerY += (y - pointerY) * 0.10;
        }, { passive: true });
      }

      addEventListener('resize', () => {
        camera.aspect = innerWidth / innerHeight;
        camera.fov = innerWidth < 760 ? 72 : 70;
        camera.updateProjectionMatrix();
        renderer.setPixelRatio(Math.min(devicePixelRatio || 1, innerWidth < 760 ? 1.15 : 1.6));
        renderer.setSize(innerWidth, innerHeight, false);
        if (reduceMotion) renderScene();
      });

      document.addEventListener('visibilitychange', () => {
        if (document.hidden) stopAnimation();
        else if (!reduceMotion) startAnimation();
      });

      renderScene();
      if (!reduceMotion) startAnimation();

      /* Keep references alive for the lifetime of the page. */
      void galaxyPoints;
    }

    initGalaxy();
  }

  /* --------------------------------------------------------------------------
     Hero role typewriter
  -------------------------------------------------------------------------- */
  const typewriter = $('[data-role-typewriter]');

  if (typewriter) {
    const phrases = [
      'Telecommunications Network Planner',
      'Business IT & Systems',
      'Software Development',
      'Darwin · Home by Choice'
    ];
    const reduceTypingMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduceTypingMotion) {
      typewriter.textContent = phrases[0];
    } else {
      let phraseIndex = 0;
      let characterIndex = phrases[0].length;
      let deleting = true;

      function typeRole() {
        const phrase = phrases[phraseIndex];

        if (deleting) {
          characterIndex = Math.max(0, characterIndex - 1);
          typewriter.textContent = phrase.slice(0, characterIndex);

          if (characterIndex === 0) {
            deleting = false;
            phraseIndex = (phraseIndex + 1) % phrases.length;
            setTimeout(typeRole, 280);
            return;
          }
        } else {
          const nextPhrase = phrases[phraseIndex];
          characterIndex = Math.min(nextPhrase.length, characterIndex + 1);
          typewriter.textContent = nextPhrase.slice(0, characterIndex);

          if (characterIndex === nextPhrase.length) {
            deleting = true;
            setTimeout(typeRole, 1650);
            return;
          }
        }

        setTimeout(typeRole, deleting ? 34 : 62);
      }

      setTimeout(typeRole, 1500);
    }
  }

  /* --------------------------------------------------------------------------
     Local and Darwin clocks
  -------------------------------------------------------------------------- */
  function updateLocalTime() {
    const localTime = new Intl.DateTimeFormat(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(new Date());

    $$('[data-local-time]').forEach(element => {
      element.textContent = localTime;
    });
  }

  function updateDarwinTime() {
    const darwinTime = new Intl.DateTimeFormat('en-AU', {
      timeZone: 'Australia/Darwin',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(new Date());

    $$('[data-darwin-time]').forEach(element => {
      element.textContent = darwinTime;
    });
  }

  updateLocalTime();
  updateDarwinTime();
  setInterval(updateLocalTime, 30000);
  setInterval(updateDarwinTime, 30000);

  /* --------------------------------------------------------------------------
     Scroll entrance reveals
     Shared across the homepage, project pages and Darwin page. The pinned wave
     story has its own continuous scroll choreography and is excluded here.
  -------------------------------------------------------------------------- */
  const revealTargets = $$([
    '.section-head',
    '.work-card',
    '.tool-card',
    '.more-tools',
    '.about-copy',
    '.identity-card',
    '.skill-card',
    '.contact-copy',
    '.contact-form',
    '.cosmic-fact',
    '.project-hero-copy',
    '.showcase-shell',
    '.project-copy',
    '.darwin-hero > *',
    '.darwin-card',
    '.story > *'
  ].join(','));

  if (revealTargets.length) {
    const reduceRevealMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
    revealTargets.forEach(element => element.classList.add('scroll-reveal'));

    if (reduceRevealMotion || !('IntersectionObserver' in window)) {
      revealTargets.forEach(element => element.classList.add('in-view'));
    } else {
      const revealObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('in-view');
          revealObserver.unobserve(entry.target);
        });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.10 });

      revealTargets.forEach(element => revealObserver.observe(element));
    }
  }

  /* --------------------------------------------------------------------------
     Navigation and smooth scrolling
  -------------------------------------------------------------------------- */
  const menuToggle = $('[data-menu-toggle]');
  const mobileMenu = $('.mobile-menu');

  function closeMobileMenu() {
    mobileMenu?.classList.remove('open');
    menuToggle?.setAttribute('aria-expanded', 'false');
  }

  $$('[data-scroll-target]').forEach(button => {
    button.addEventListener('click', () => {
      const target = document.getElementById(button.dataset.scrollTarget);
      target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      closeMobileMenu();
    });
  });

  menuToggle?.addEventListener('click', () => {
    const isOpen = mobileMenu?.classList.toggle('open') ?? false;
    menuToggle.setAttribute('aria-expanded', String(isOpen));
  });

  addEventListener('resize', () => {
    if (innerWidth > 1100) closeMobileMenu();
  });

  $$('[data-back-top]').forEach(button => {
    button.addEventListener('click', () => scrollTo({ top: 0, behavior: 'smooth' }));
  });

  const sections = $$('main section[id]');
  const navigationButtons = $$('[data-scroll-target]');

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        navigationButtons.forEach(button => {
          button.classList.toggle('active', button.dataset.scrollTarget === entry.target.id);
        });
      }
    }, { rootMargin: '-38% 0px -52% 0px' });

    sections.forEach(section => observer.observe(section));
  }

  /* --------------------------------------------------------------------------
     Toast
  -------------------------------------------------------------------------- */
  window.showToast = message => {
    const toast = $('#toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(window.__toast);
    window.__toast = setTimeout(() => toast.classList.remove('show'), 3100);
  };

  /* --------------------------------------------------------------------------
     Copy email
  -------------------------------------------------------------------------- */
  $$('[data-copy-email]').forEach(button => {
    button.addEventListener('click', async () => {
      const email = 'arikesh873@gmail.com';

      try {
        await navigator.clipboard.writeText(email);
      } catch {
        const textarea = document.createElement('textarea');
        textarea.value = email;
        document.body.append(textarea);
        textarea.select();
        document.execCommand('copy');
        textarea.remove();
      }

      showToast(`Email copied: ${email}`);
    });
  });

  /* --------------------------------------------------------------------------
     Contact form
     - Desktop/laptop: open a pre-filled Gmail compose window in a new tab.
     - Mobile/tablet: keep the native mailto flow so the visitor's mail app opens.
  -------------------------------------------------------------------------- */
  const contactForm = $('#contact-form');

  function isMobileMailDevice() {
    if (typeof navigator.userAgentData?.mobile === 'boolean') {
      return navigator.userAgentData.mobile;
    }

    return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
  }

  contactForm?.addEventListener('submit', event => {
    event.preventDefault();

    if (!contactForm.reportValidity()) return;

    const data = new FormData(contactForm);
    const name = String(data.get('name') || '').trim();
    const from = String(data.get('email') || '').trim();
    const subject = String(data.get('subject') || 'Website enquiry').trim();
    const message = String(data.get('message') || '').trim();

    const body = `Hi Rikesh,\n\n${message}\n\nRegards,\n${name}\n${from}`;
    const recipient = 'arikesh873@gmail.com';
    const mailto = `mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    if (isMobileMailDevice()) {
      showToast('Your email app should open with the message ready to send.');
      window.location.href = mailto;
      return;
    }

    const gmailUrl =
      'https://mail.google.com/mail/?view=cm&fs=1' +
      `&to=${encodeURIComponent(recipient)}` +
      `&su=${encodeURIComponent(subject)}` +
      `&body=${encodeURIComponent(body)}`;

    const gmailTab = window.open(gmailUrl, '_blank');

    if (gmailTab) {
      gmailTab.opener = null;
      showToast('Gmail opened in a new tab with your message ready to send.');
    } else {
      showToast('Your browser blocked the Gmail tab. Please allow pop-ups and try again.');
    }
  });

  /* --------------------------------------------------------------------------
     Footer year
  -------------------------------------------------------------------------- */
  $('#year')?.replaceChildren(document.createTextNode(new Date().getFullYear()));
})();
