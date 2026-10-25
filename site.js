(() => {
  'use strict';

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];


  const fontReadyPromise = (() => {
    if (!document.fonts?.load) {
      document.documentElement.classList.add('fonts-ready');
      return Promise.resolve();
    }

    const timeout = new Promise(resolve => setTimeout(resolve, 1200));
    const load = Promise.all([
      document.fonts.load('600 1em "Inter"'),
      document.fonts.load('500 1em "Playfair Display"')
    ]).catch(() => undefined);

    return Promise.race([load, timeout]).then(() => {
      document.documentElement.classList.add('fonts-ready');
    });
  })();


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

    }

    syncThemeControls();
  }

  $$('[data-theme-toggle]').forEach(button => {
    button.addEventListener('click', () => {
      setTheme(currentTheme() === 'light' ? 'dark' : 'light');
    });
  });

  syncThemeControls();


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

    let cursorRaf = 0;

    function animateCursor() {
      if (document.hidden) {
        cursorRaf = 0;
        return;
      }
      ringX += (mouseX - ringX) * 0.16;
      ringY += (mouseY - ringY) * 0.16;
      cursorRing.style.left = `${ringX}px`;
      cursorRing.style.top = `${ringY}px`;
      cursorRaf = requestAnimationFrame(animateCursor);
    }

    function startCursor() {
      if (!cursorRaf && !document.hidden) cursorRaf = requestAnimationFrame(animateCursor);
    }

    function stopCursor() {
      if (!cursorRaf) return;
      cancelAnimationFrame(cursorRaf);
      cursorRaf = 0;
    }

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) stopCursor();
      else startCursor();
    });
    addEventListener('pagehide', stopCursor, { once: true });
    startCursor();

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


  const galaxyCanvas = $('.bg-canvas');

  if (galaxyCanvas) {
    const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const finePointer = matchMedia('(pointer: fine)').matches;
    const hardwareThreads = navigator.hardwareConcurrency || 4;
    const deviceMemory = navigator.deviceMemory || 8;

    let targetScroll = scrollY;
    let smoothedScroll = scrollY;
    let pointerX = 0;
    let pointerY = 0;

    function initGalaxy() {
      const THREE = window.THREE;
      if (!THREE) {
        galaxyCanvas.style.display = 'none';
        return;
      }

      const compact = innerWidth < 760;
      const medium = innerWidth < 1180;
      const lowPower = hardwareThreads <= 4 || deviceMemory <= 4;

      const renderer = new THREE.WebGLRenderer({
        canvas: galaxyCanvas,
        alpha: true,
        antialias: !compact,
        powerPreference: 'high-performance'
      });

      renderer.setPixelRatio(Math.min(devicePixelRatio || 1, compact ? (lowPower ? 1 : 1.15) : (lowPower ? 1.35 : 1.6)));
      renderer.setSize(innerWidth, innerHeight, false);
      renderer.setClearColor(0x000000, 0);
      if ('outputEncoding' in renderer && THREE.sRGBEncoding) renderer.outputEncoding = THREE.sRGBEncoding;

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
        count: compact ? (lowPower ? 42000 : 72000) : (medium || lowPower ? 108000 : 181000),
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
        if ('encoding' in texture && THREE.sRGBEncoding) texture.encoding = THREE.sRGBEncoding;
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
      let smoothedStoryProgress = 0;
      let lastSceneLightTheme = null;

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


      const waveHemisphere = new THREE.HemisphereLight(0xffffff, 0x56605b, compact ? 0.82 : 1.0);
      scene.add(waveHemisphere);
      const waveKey = new THREE.DirectionalLight(0xffffff, compact ? 1.05 : 1.35);
      waveKey.position.set(4.5, 6.0, 7.5);
      scene.add(waveKey);
      const waveRim = new THREE.PointLight(0xb9ead8, compact ? 0.9 : 1.25, 22);
      waveRim.position.set(-4.5, -1.5, 5.0);
      scene.add(waveRim);

      const rippleTempColour = new THREE.Color();

      function createRippleSystem(options = {}) {
        const group = new THREE.Group();
        const rings = [];
        const materials = [];
        const glowMaterials = [];
        const ringCount = options.ringCount ?? (compact ? 12 : 16);
        const radialSegments = compact ? 6 : 8;
        const tubularSegments = compact ? 84 : 144;
        const maxRadius = options.maxRadius ?? (compact ? 3.12 : 3.82);
        const minRadius = options.minRadius ?? 0.34;
        const depthStep = options.depthStep ?? (compact ? 0.030 : 0.036);
        const tubeBase = options.tube ?? (compact ? 0.0105 : 0.0125);

        for (let ringIndex = 0; ringIndex < ringCount; ringIndex += 1) {
          const t = ringIndex / Math.max(1, ringCount - 1);
          const radius = minRadius + (maxRadius - minRadius) * t;
          const tube = tubeBase * (0.84 + t * 0.42);
          const geometry = new THREE.TorusGeometry(radius, tube, radialSegments, tubularSegments);
          const material = new THREE.MeshStandardMaterial({
            color: 0x86e7d1,
            emissive: 0x86e7d1,
            emissiveIntensity: 0.045,
            roughness: 0.36,
            metalness: 0.08,
            transparent: true,
            opacity: 0,
            depthWrite: false,
            side: THREE.DoubleSide
          });
          const ring = new THREE.Mesh(geometry, material);
          const baseZ = (ringIndex - (ringCount - 1) / 2) * depthStep;
          ring.position.z = baseZ;
          ring.userData = {
            baseZ,
            ringIndex,
            t,
            phase: ringIndex * 0.43
          };


          const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0x86e7d1,
            transparent: true,
            opacity: 0,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            side: THREE.DoubleSide
          });
          const glow = new THREE.Mesh(geometry, glowMaterial);
          glow.scale.setScalar(1.018);
          ring.add(glow);
          ring.userData.glow = glow;

          group.add(ring);
          rings.push(ring);
          materials.push(material);
          glowMaterials.push(glowMaterial);
        }


        const beadCount = compact ? 120 : 220;
        const beadPositions = new Float32Array(beadCount * 3);
        for (let i = 0; i < beadCount; i += 1) {
          const ringT = Math.random();
          const radius = minRadius + (maxRadius - minRadius) * ringT;
          const angle = Math.random() * Math.PI * 2;
          beadPositions[i * 3] = Math.cos(angle) * radius;
          beadPositions[i * 3 + 1] = Math.sin(angle) * radius;
          beadPositions[i * 3 + 2] = (Math.random() - 0.5) * depthStep * ringCount;
        }
        const beadGeometry = new THREE.BufferGeometry();
        beadGeometry.setAttribute('position', new THREE.BufferAttribute(beadPositions, 3));
        const beadMaterial = new THREE.PointsMaterial({
          size: compact ? 0.020 : 0.017,
          color: 0xb9ead8,
          transparent: true,
          opacity: 0,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
          sizeAttenuation: true
        });
        const beads = new THREE.Points(beadGeometry, beadMaterial);
        group.add(beads);

        scene.add(group);
        return { group, rings, materials, glowMaterials, beads, beadMaterial };
      }

      const rippleMain = createRippleSystem({ depthStep: compact ? 0.032 : 0.038 });
      const rippleEchoA = createRippleSystem({ maxRadius: compact ? 2.78 : 3.38, ringCount: compact ? 10 : 13, depthStep: compact ? 0.034 : 0.042 });
      const rippleEchoB = createRippleSystem({ maxRadius: compact ? 2.50 : 3.18, ringCount: compact ? 9 : 12, depthStep: compact ? 0.038 : 0.046 });

      function smoothStep(edge0, edge1, value) {
        const x = Math.max(0, Math.min(1, (value - edge0) / Math.max(0.0001, edge1 - edge0)));
        return x * x * (3 - 2 * x);
      }

      function sampleRipplePose(progress) {
        const keys = compact ? [
          { p:0.00, x:0.05, y:-2.50, z:0.35, s:0.88, rx:0.08, ry:0.00, rz:0.00 },
          { p:0.24, x:0.05, y:-2.55, z:0.18, s:0.38, rx:0.18, ry:0.02, rz:0.00 },
          { p:0.50, x:0.05, y:-2.18, z:0.15, s:1.00, rx:1.30, ry:0.10, rz:-0.04 },
          { p:0.72, x:-1.08, y:-0.94, z:0.34, s:1.48, rx:0.78, ry:0.46, rz:-0.32 },
          { p:1.00, x:0.92, y:0.30, z:0.52, s:2.02, rx:0.46, ry:-0.58, rz:0.27 }
        ] : [
          { p:0.00, x:2.28, y:-1.30, z:0.45, s:1.10, rx:0.09, ry:0.02, rz:0.00 },
          { p:0.24, x:1.82, y:-1.58, z:0.20, s:0.49, rx:0.19, ry:0.03, rz:0.00 },
          { p:0.50, x:1.26, y:-1.28, z:0.18, s:1.20, rx:1.28, ry:0.12, rz:-0.04 },
          { p:0.72, x:-1.64, y:-0.30, z:0.36, s:1.70, rx:0.74, ry:0.48, rz:-0.30 },
          { p:1.00, x:2.18, y:0.48, z:0.58, s:2.34, rx:0.44, ry:-0.56, rz:0.27 }
        ];

        let a = keys[0];
        let b = keys[keys.length - 1];
        for (let i = 0; i < keys.length - 1; i += 1) {
          if (progress >= keys[i].p && progress <= keys[i + 1].p) {
            a = keys[i]; b = keys[i + 1]; break;
          }
        }
        const raw = Math.max(0, Math.min(1, (progress - a.p) / Math.max(0.0001, b.p - a.p)));
        const t = raw * raw * (3 - 2 * raw);
        const lerp = (x, y) => x + (y - x) * t;
        return {
          x:lerp(a.x,b.x), y:lerp(a.y,b.y), z:lerp(a.z,b.z), s:lerp(a.s,b.s),
          rx:lerp(a.rx,b.rx), ry:lerp(a.ry,b.ry), rz:lerp(a.rz,b.rz)
        };
      }

      function applyRipplePose(system, pose, opacity, colourHex, extra = {}) {
        const { group, materials, glowMaterials, beadMaterial } = system;
        group.position.set(
          pose.x + (extra.x || 0),
          pose.y + (extra.y || 0),
          pose.z + (extra.z || 0)
        );
        const scale = pose.s * (extra.scale || 1);
        group.scale.setScalar(scale);
        group.rotation.set(
          pose.rx + (extra.rx || 0),
          pose.ry + (extra.ry || 0),
          pose.rz + (extra.rz || 0)
        );

        materials.forEach((material, index) => {
          const ringT = index / Math.max(1, materials.length - 1);
          rippleTempColour.setHex(colourHex);


          rippleTempColour.offsetHSL(ringT * 0.010, 0, ringT * 0.055);
          material.color.copy(rippleTempColour);
          material.emissive.copy(rippleTempColour);
          material.emissiveIntensity = document.documentElement.dataset.theme === 'light' ? 0.035 : 0.11;
          const edge = 0.60 + ringT * 0.40;
          material.opacity = opacity * edge;

          const glow = glowMaterials[index];
          glow.color.copy(rippleTempColour);
          glow.opacity = opacity * edge * (document.documentElement.dataset.theme === 'light' ? 0.12 : 0.25);
        });

        rippleTempColour.setHex(colourHex);
        beadMaterial.color.copy(rippleTempColour);
        beadMaterial.opacity = opacity * (document.documentElement.dataset.theme === 'light' ? 0.18 : 0.30);
      }

      function deformRippleSystem(system, elapsed, progress, intensity = 1) {
        const waveAmount = (0.018 + smoothStep(0.42, 1.0, progress) * 0.065) * intensity;
        system.rings.forEach((ring, ringIndex) => {
          const phase = ring.userData.phase;
          const ringT = ring.userData.t;
          const travelingWave = Math.sin(elapsed * 0.82 + phase + progress * Math.PI * 5.2);
          const secondary = Math.cos(elapsed * 0.46 - phase * 0.72 + progress * Math.PI * 3.0);
          ring.position.z = ring.userData.baseZ + travelingWave * waveAmount * (0.75 + ringT * 1.2);
          ring.rotation.x = secondary * waveAmount * 0.22;
          ring.rotation.y = travelingWave * waveAmount * 0.18;
          ring.rotation.z = Math.sin(elapsed * 0.30 + phase) * waveAmount * 0.32;
          const pulse = 1 + travelingWave * waveAmount * 0.18;
          ring.scale.set(pulse, 1 + secondary * waveAmount * 0.12, 1);
        });
        system.beads.rotation.z = elapsed * 0.035 * intensity + progress * 0.34;
        system.beads.rotation.x = Math.sin(elapsed * 0.21) * 0.035;
      }


      const fireworks = [];
      const fireworkShells = [];
      const fireworkFlashes = [];
      let fireworksShowActive = false;
      let fireworksShowTimers = [];

      const fireworkColours = [
        0xffd166,
        0xff6f61,
        0xffa94d,
        0xfff4c2,
        0x7dd3fc,
        0xc4b5fd,
        0xf472b6,
        0x86efac
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


        const column = index % 6;
        const row = Math.floor(index / 6);
        const xBands = [-6.2, -3.8, -1.4, 1.4, 3.8, 6.2];
        const baseX = xBands[column] + (Math.random() - 0.5) * 1.15;
        const baseY = 1.2 + (row % 3) * 2.15 + Math.random() * 1.35;
        const z = -2.4 + Math.random() * 4.0;


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
        const storyProgressTarget = Math.max(0, Math.min(1, Number(window.__rikeshWaveStoryProgress || 0)));
        smoothedStoryProgress += (storyProgressTarget - smoothedStoryProgress) * (reduceMotion ? 1 : (compact ? 0.11 : 0.085));
        const storyProgress = smoothedStoryProgress;
        const exactStoryLayerActive = Boolean(window.__rikeshWaveStoryActive);
        const storySphereReveal = exactStoryLayerActive ? smoothStep(0.72, 1, storyProgress) : 1;
        const storyTarget = exactStoryLayerActive ? 1 : 0;
        storyVisual += (storyTarget - storyVisual) * (reduceMotion ? 1 : 0.07);
        const lightTheme = document.documentElement.dataset.theme === 'light';


        galaxy.rotation.y = reduceMotion
          ? 0.10
          : elapsed * (parameters.rotationSpeed * 0.20) + scroll * 0.20 - storyVisual * 0.16;
        if (lastSceneLightTheme !== lightTheme) {
          lastSceneLightTheme = lightTheme;
          const blend = lightTheme ? THREE.NormalBlending : THREE.AdditiveBlending;
          galaxyPoints.material.blending = blend;
          backgroundStars.material.blending = blend;
          waveShellMaterial.blending = blend;
          wavePointMaterial.blending = blend;
          waveHaloMaterial.blending = blend;
          spiralMaterials.forEach(material => { material.blending = blend; material.needsUpdate = true; });
          [galaxyPoints.material, backgroundStars.material, waveShellMaterial, wavePointMaterial, waveHaloMaterial]
            .forEach(material => { material.needsUpdate = true; });

          waveShellMaterial.color.setHex(lightTheme ? 0x8f6a17 : 0xf6d365);
          wavePointMaterial.color.setHex(lightTheme ? 0x9c741b : 0xffdf86);
          waveHaloMaterial.color.setHex(lightTheme ? 0x8f6a17 : 0xf6d365);
          coreGlow.material.color.setHex(lightTheme ? 0xb55d2c : 0xff7c3f);
          backgroundStars.material.color.setHex(lightTheme ? 0x75665d : 0xf6dfd2);
        }


        galaxyPoints.material.opacity = lightTheme
          ? 0.20 - storyVisual * 0.045
          : 0.20 - storyVisual * 0.07;
        coreGlow.material.opacity = lightTheme
          ? 0.055 - storyVisual * 0.015
          : 0.045 - storyVisual * 0.010;
        backgroundStars.material.opacity = lightTheme ? 0.10 : 0.12;


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
        waveShellMaterial.opacity = ((lightTheme ? 0.075 : 0.10) + storyVisual * (lightTheme ? 0.10 : 0.17)) * storySphereReveal;
        wavePointMaterial.opacity = ((lightTheme ? 0.08 : 0.13) + storyVisual * (lightTheme ? 0.11 : 0.18)) * storySphereReveal;

        waveHalo.scale.setScalar((reduceMotion ? 1 : 1 + Math.sin(elapsed * 0.92 + storyPhase * 0.08) * 0.08) * (0.94 + storyVisual * 0.18));
        waveHalo.material.opacity = ((lightTheme ? 0.035 : 0.055) + storyVisual * (lightTheme ? 0.05 : 0.08)) * storySphereReveal;
        spiralTraces.forEach((trace, traceIndex) => {
          const spiralScale = 0.92 + storyVisual * 0.12;
          trace.scale.setScalar(spiralScale);
          if (!reduceMotion) {
            trace.rotation.y = elapsed * (0.045 + traceIndex * 0.006) + storyProgress * (0.45 + traceIndex * 0.08);
            trace.rotation.x = Math.sin(elapsed * 0.16 + traceIndex * 0.9) * 0.065;
            trace.rotation.z = Math.sin(elapsed * 0.14 + traceIndex) * 0.04;
          }
          spiralMaterials[traceIndex].opacity = ((lightTheme ? 0.018 : 0.045) + (1 - storyVisual) * (lightTheme ? 0.035 : 0.07)) * storySphereReveal;
        });


        const rippleColour = lightTheme ? 0x6eae9c : 0xf2c45d;
        const pose = sampleRipplePose(storyProgress);
        const rippleBaseOpacity = exactStoryLayerActive
          ? 0
          : storyVisual * (lightTheme ? 0.82 : 0.76) + (1 - storyVisual) * (lightTheme ? 0.12 : 0.16);
        deformRippleSystem(rippleMain, elapsed, storyProgress, 1);
        applyRipplePose(rippleMain, pose, rippleBaseOpacity, rippleColour);

        const echoIn = exactStoryLayerActive ? 0 : smoothStep(0.56, 0.80, storyProgress) * storyVisual;
        deformRippleSystem(rippleEchoA, elapsed + 0.8, storyProgress, 0.65);
        deformRippleSystem(rippleEchoB, elapsed + 1.6, storyProgress, 0.52);
        applyRipplePose(rippleEchoA, pose, echoIn * (lightTheme ? 0.54 : 0.46), rippleColour, {
          x: compact ? -2.85 : -4.0,
          y: compact ? 0.85 : 0.55,
          scale: compact ? 0.92 : 1.02,
          rx:0.20,
          ry:0.55,
          rz:-0.18
        });
        applyRipplePose(rippleEchoB, pose, echoIn * (lightTheme ? 0.48 : 0.40), rippleColour, {
          x: compact ? 2.75 : 4.2,
          y: compact ? 1.35 : 0.95,
          scale:compact ? 0.78 : 0.92,
          rx:-0.18,
          ry:-0.60,
          rz:0.22
        });


        waveShellMaterial.opacity = (lightTheme
          ? 0.13 + storyVisual * 0.13
          : 0.085 + storyVisual * 0.17) * storySphereReveal;
        wavePointMaterial.opacity = (lightTheme
          ? 0.11 + storyVisual * 0.12
          : 0.10 + storyVisual * 0.16) * storySphereReveal;
        waveHalo.material.opacity = (lightTheme
          ? 0.055 + storyVisual * 0.045
          : 0.035 + storyVisual * 0.055) * storySphereReveal;


        const baseOrbit = 0.56 + scroll * 0.10 + (finePointer && !reduceMotion ? pointerX * 0.026 : 0);
        const normalRadius = compact ? 9.6 : 8.1;
        const normalY = (compact ? 5.8 : 4.35) - scroll * 0.35 + (finePointer && !reduceMotion ? pointerY * 0.22 : 0);
        const storyRadius = compact ? 9.15 : 7.35;
        const storyX = compact ? 0 : -0.45 + storyProgress * 0.28;
        const storyZ = storyRadius;
        const storyY = compact ? 0.05 : 0.10;

        const normalX = Math.sin(baseOrbit) * normalRadius;
        const normalZ = Math.cos(baseOrbit) * normalRadius;

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
        renderer.setPixelRatio(Math.min(devicePixelRatio || 1, innerWidth < 760 ? (lowPower ? 1 : 1.15) : (lowPower ? 1.35 : 1.6)));
        renderer.setSize(innerWidth, innerHeight, false);
        if (reduceMotion) renderScene();
      });

      document.addEventListener('visibilitychange', () => {
        if (document.hidden) stopAnimation();
        else if (!reduceMotion) startAnimation();
      });
      addEventListener('pagehide', stopAnimation, { once: true });

      renderScene();
      if (!reduceMotion) startAnimation();


      void galaxyPoints;
    }

    initGalaxy();
  }


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


  $$('img[data-hide-on-error]').forEach(image => {
    const hide = () => { image.hidden = true; };
    image.addEventListener('error', hide, { once: true });
    if (image.complete && image.naturalWidth === 0) hide();
  });


  const menuToggle = $('[data-menu-toggle]');
  const mobileMenu = $('.mobile-menu');
  const mobileMenuBackdrop = $('[data-menu-backdrop]');
  let menuScrollY = 0;
  let menuTouchStartY = null;

  function lockPageForMenu() {
    if (document.body.classList.contains('menu-open')) return;
    menuScrollY = window.scrollY || document.documentElement.scrollTop || 0;
    document.body.classList.add('menu-open');
    document.body.style.position = 'fixed';
    document.body.style.top = `-${menuScrollY}px`;
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.width = '100%';
    document.documentElement.style.overflow = 'hidden';
  }

  function unlockPageForMenu() {
    if (!document.body.classList.contains('menu-open')) return;
    document.body.classList.remove('menu-open');
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.left = '';
    document.body.style.right = '';
    document.body.style.width = '';
    document.documentElement.style.overflow = '';
    window.scrollTo(0, menuScrollY);
  }

  function closeMobileMenu() {
    mobileMenu?.classList.remove('open');
    menuToggle?.classList.remove('is-open');
    if (menuToggle) menuToggle.textContent = '☰';
    menuToggle?.setAttribute('aria-expanded', 'false');
    menuToggle?.setAttribute('aria-label', 'Open navigation');
    unlockPageForMenu();
  }

  $$('[data-scroll-target]').forEach(button => {
    button.addEventListener('click', () => {
      const target = document.getElementById(button.dataset.scrollTarget);
      const menuWasOpen = mobileMenu?.classList.contains('open');
      if (menuWasOpen) closeMobileMenu();
      requestAnimationFrame(() => {
        target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
  });

  menuToggle?.addEventListener('click', event => {
    event.stopPropagation();
    const isOpen = mobileMenu?.classList.toggle('open') ?? false;
    menuToggle.classList.toggle('is-open', isOpen);
    menuToggle.textContent = isOpen ? '×' : '☰';
    menuToggle.setAttribute('aria-expanded', String(isOpen));
    menuToggle.setAttribute('aria-label', isOpen ? 'Close navigation' : 'Open navigation');
    if (isOpen) {
      lockPageForMenu();
      mobileMenu?.scrollTo({ top: 0, behavior: 'auto' });
    } else {
      unlockPageForMenu();
    }
  });


  mobileMenu?.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', closeMobileMenu);
  });

  mobileMenuBackdrop?.addEventListener('click', closeMobileMenu);


  mobileMenuBackdrop?.addEventListener('touchstart', event => {
    menuTouchStartY = event.touches[0]?.clientY ?? null;
  }, { passive: true });
  mobileMenuBackdrop?.addEventListener('touchend', event => {
    if (menuTouchStartY == null) return;
    const endY = event.changedTouches[0]?.clientY ?? menuTouchStartY;
    if (endY - menuTouchStartY < -55) closeMobileMenu();
    menuTouchStartY = null;
  }, { passive: true });


  mobileMenu?.addEventListener('wheel', event => {
    if (mobileMenu.scrollTop <= 1 && event.deltaY < -30) closeMobileMenu();
  }, { passive: true });


  document.addEventListener('pointerdown', event => {
    if (!mobileMenu?.classList.contains('open')) return;
    if (mobileMenu.contains(event.target) || menuToggle?.contains(event.target)) return;
    if (mobileMenuBackdrop?.contains(event.target)) return;
    closeMobileMenu();
  }, { passive: true });

  addEventListener('keydown', event => {
    if (event.key === 'Escape' && mobileMenu?.classList.contains('open')) closeMobileMenu();
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


  window.showToast = message => {
    const toast = $('#toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(window.__toast);
    window.__toast = setTimeout(() => toast.classList.remove('show'), 3100);
  };


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


  $('#year')?.replaceChildren(document.createTextNode(new Date().getFullYear()));
})();
