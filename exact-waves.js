(() => {
  const canvas = document.getElementById('waveCanvas');
  const story = document.getElementById('home');
  const copies = [...document.querySelectorAll('.wave-story .story-copy')];
  const chapterNumber = document.getElementById('chapterNumber');
  const progressFill = document.getElementById('progressFill');


  const chapterStops = [0, .15, .42, .70, 1];
  const chapterFor = progress => {
    for (let i = 0; i < 4; i += 1) {
      if (progress < chapterStops[i + 1]) return i;
    }
    return 3;
  };
  const localChapterProgress = (progress, index) => Math.min(1, Math.max(0,
    (progress - chapterStops[index]) / (chapterStops[index + 1] - chapterStops[index])));
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const lowPower = (navigator.hardwareConcurrency || 4) <= 4 || (navigator.deviceMemory || 8) <= 4;

  if (!story || !copies.length) return;

  if (!canvas || !window.THREE) {
    const updateTextOnly = () => {
      const rect = story.getBoundingClientRect();
      const progress = Math.min(1, Math.max(0, -rect.top / Math.max(1, story.offsetHeight - (story.querySelector('.wave-story-sticky')?.clientHeight || innerHeight))));
      const index = chapterFor(progress);
      const chapterProgress = localChapterProgress(progress, index);
      story.style.setProperty('--story-swipe-lift', `${(-18 * chapterProgress).toFixed(1)}px`);
      story.style.setProperty('--story-swipe-scale', (1 - .025 * chapterProgress).toFixed(4));
      copies.forEach((copy, i) => copy.classList.toggle('is-active', i === index));
      if (chapterNumber) chapterNumber.textContent = String(index + 1).padStart(3, '0');
      if (progressFill) progressFill.style.transform = `scaleX(${progress})`;
    };
    addEventListener('scroll', updateTextOnly, { passive: true });
    addEventListener('resize', updateTextOnly, { passive: true });
    updateTextOnly();
    return;
  }




  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(43, innerWidth / innerHeight, 0.1, 100);
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: !lowPower && innerWidth >= 760,
      powerPreference: 'high-performance'
    });
  } catch {
    const updateTextOnly = () => {
      const rect = story.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, -rect.top / Math.max(1, story.offsetHeight - (story.querySelector('.wave-story-sticky')?.clientHeight || innerHeight))));
      const index = chapterFor(p);
      copies.forEach((copy, i) => copy.classList.toggle('is-active', i === index));
      if (chapterNumber) chapterNumber.textContent = String(index + 1).padStart(3, '0');
      if (progressFill) progressFill.style.transform = `scaleX(${p})`;
    };
    addEventListener('scroll', updateTextOnly, {passive:true});
    addEventListener('resize', updateTextOnly, {passive:true});
    updateTextOnly();
    return;
  }
  renderer.setSize(innerWidth, innerHeight);
  renderer.setPixelRatio(Math.min(devicePixelRatio, innerWidth < 760 ? 1.1 : (lowPower ? 1.2 : 1.45)));
  if ('outputEncoding' in renderer && THREE.sRGBEncoding) renderer.outputEncoding = THREE.sRGBEncoding;

  const root = new THREE.Group();
  scene.add(root);

  scene.add(new THREE.HemisphereLight(0xffffff, 0x53605b, 1.18));

  const keyLight = new THREE.DirectionalLight(0xffffff, 1.45);
  keyLight.position.set(4, 5, 6);
  scene.add(keyLight);

  const rimLight = new THREE.PointLight(0xbaf0dd, 1.2, 18);
  rimLight.position.set(-4, -1, 4);
  scene.add(rimLight);

  const palette = {
    light: [0xb9ead8, 0x91ddc6, 0xc8f2e3],
    dark:  [0xd9b650, 0xe49358, 0xf1ce76]
  };

  let dark = document.documentElement.dataset.theme === 'dark';

  function createMaterial(color, opacity) {
    return new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: dark ? 0.09 : 0.035,
      roughness: 0.58,
      metalness: 0.12,
      transparent: true,
      opacity,
      depthWrite: false,
      side: THREE.DoubleSide
    });
  }

  function makeTorusRing(radius, tube, color, opacity, radialSegments, tubularSegments) {
    const geometry = new THREE.TorusGeometry(radius, tube, radialSegments, tubularSegments);
    const material = createMaterial(color, opacity);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.userData.baseOpacity = opacity;
    return mesh;
  }

  function makeRingGroup({ count, startRadius, step, tube, colorIndex, opacity, depthStep = .025 }) {
    const group = new THREE.Group();
    const mobile = innerWidth < 760;
    const radialSegments = mobile ? 6 : 8;
    const tubularSegments = mobile ? (lowPower ? 72 : 96) : (lowPower ? 112 : 144);

    for (let i = 0; i < count; i += 1) {
      const fade = 1 - (i / Math.max(1, count - 1)) * .28;
      const ring = makeTorusRing(
        startRadius + i * step,
        tube,
        palette.light[colorIndex],
        opacity * fade,
        radialSegments,
        tubularSegments
      );
      ring.position.z = (i - (count - 1) / 2) * depthStep;
      ring.rotation.z = (i - count / 2) * .0012;
      group.add(ring);
    }

    root.add(group);
    return group;
  }

  const groupA = makeRingGroup({ count: 16, startRadius: .50, step: .19, tube: .012, colorIndex: 0, opacity: .86, depthStep: .022 });
  const groupB = makeRingGroup({ count: 12, startRadius: .72, step: .24, tube: .013, colorIndex: 1, opacity: .70, depthStep: .03 });
  const groupC = makeRingGroup({ count: 10, startRadius: 1.02, step: .28, tube: .014, colorIndex: 2, opacity: .58, depthStep: .034 });
  const groups = [groupA, groupB, groupC];

  groupA.rotation.set(.10, .04, 0);
  groupB.rotation.set(.55, 1.02, .48);
  groupC.rotation.set(1.02, -.76, -.18);

  const state = {
    progress: 0,
    smooth: 0,
    pointerX: 0,
    pointerY: 0,
    pointerSmoothX: 0,
    pointerSmoothY: 0,
    active: false,
    chapter: -1
  };

  function setGroupOpacity(group, opacity) {
    group.children.forEach(ring => {
      ring.material.opacity = ring.userData.baseOpacity * opacity;
    });
  }

  function setGroupTheme(group, hex) {
    group.children.forEach(ring => {
      ring.material.color.setHex(hex);
      ring.material.emissive.setHex(hex);
      ring.material.emissiveIntensity = dark ? .10 : .035;
    });
  }

  function mix(a, b, t) { return a + (b - a) * t; }
  function clamp(v, a = 0, b = 1) { return Math.min(b, Math.max(a, v)); }
  function seg(p, a, b) { return clamp((p - a) / (b - a)); }
  function smoothstep(t) { return t * t * (3 - 2 * t); }
  function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }

  function updateScrollProgress() {
    const rect = story.getBoundingClientRect();
    const travel = Math.max(1, story.offsetHeight - (story.querySelector('.wave-story-sticky')?.clientHeight || innerHeight));
    state.progress = clamp(-rect.top / travel);
    state.active = rect.bottom > 0 && rect.top < innerHeight;
    window.__rikeshWaveStoryProgress = state.progress;
    window.__rikeshWaveStoryActive = state.active;
    document.body.classList.toggle('exact-wave-story-active', state.active);
  }

  function updateChapter(p) {
    const index = chapterFor(p);
    const chapterProgress = localChapterProgress(p, index);

    story.style.setProperty('--story-swipe-lift', `${(-18 * chapterProgress).toFixed(1)}px`);
    story.style.setProperty('--story-swipe-scale', (1 - .025 * chapterProgress).toFixed(4));
    if (index !== state.chapter) {
      state.chapter = index;
      copies.forEach((copy, i) => copy.classList.toggle('is-active', i === index));
      if (chapterNumber) chapterNumber.textContent = String(index + 1).padStart(3, '0');
    }
    if (progressFill) progressFill.style.transform = `scaleX(${p})`;
  }

  function applyTheme() {
    dark = document.documentElement.dataset.theme === 'dark';
    const colors = dark ? palette.dark : palette.light;
    groups.forEach((group, index) => setGroupTheme(group, colors[index]));
    rimLight.color.setHex(dark ? 0xe7a34e : 0xbaf0dd);
  }

  const themeObserver = new MutationObserver(mutations => {
    if (mutations.some(m => m.attributeName === 'data-theme')) applyTheme();
  });
  themeObserver.observe(document.documentElement, { attributes: true });

  addEventListener('scroll', () => {
    updateScrollProgress();
    if (state.active) startAnimation();
    else if (!document.hidden) updateChapter(state.progress);
  }, { passive: true });
  addEventListener('pointermove', event => {
    if (matchMedia('(pointer: coarse)').matches) return;
    state.pointerX = (event.clientX / innerWidth - .5) * 2;
    state.pointerY = (event.clientY / innerHeight - .5) * 2;
  }, { passive: true });

  function resize() {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
    renderer.setPixelRatio(Math.min(devicePixelRatio, innerWidth < 760 ? 1.1 : (lowPower ? 1.2 : 1.45)));
    updateScrollProgress();
  }
  addEventListener('resize', resize, { passive: true });
  addEventListener('orientationchange', () => setTimeout(resize, 150), { passive: true });

  let rafId = 0;

  let lastDraw = 0;
  const frameSpacing = 1000 / (lowPower ? (innerWidth < 760 ? 32 : 42) : 65);
  function animate(now) {
    if (document.hidden || !state.active) {
      rafId = 0;
      return;
    }

    rafId = requestAnimationFrame(animate);
    if (now - lastDraw < frameSpacing) return;
    lastDraw = now;
    state.smooth += (state.progress - state.smooth) * (reducedMotion ? 1 : .075);
    state.pointerSmoothX += (state.pointerX - state.pointerSmoothX) * .035;
    state.pointerSmoothY += (state.pointerY - state.pointerSmoothY) * .035;

    const p = state.smooth;
    const mobile = innerWidth < 760;
    updateChapter(p);


    const handoff = smoothstep(seg(p, .82, 1));
    const exactSceneOpacity = 1 - handoff * .94;
    const galaxyBuild = smoothstep(seg(p, .015, .50));
    const galaxyBaseOpacity = dark
      ? mix(.16, .28, galaxyBuild)
      : mix(.20, .34, galaxyBuild);
    const galaxySceneOpacity = mix(galaxyBaseOpacity, dark ? .96 : .86, handoff);
    document.body.style.setProperty('--exact-wave-opacity', exactSceneOpacity.toFixed(3));
    document.body.style.setProperty('--story-bg-opacity', galaxySceneOpacity.toFixed(3));
    document.body.style.setProperty('--story-veil-opacity', (dark ? mix(.08, .46, handoff) : mix(.02, .10, handoff)).toFixed(3));

    const camIntro = smoothstep(seg(p, 0, .22));
    const camFinal = easeOutCubic(seg(p, .55, 1));
    camera.position.z = mix(mobile ? 9.45 : 7.65, mobile ? 7.9 : 6.05, camIntro);
    camera.position.x = mix(mobile ? 0 : .75, mobile ? 0 : -.2, camFinal) + state.pointerSmoothX * (mobile ? .025 : .09);
    camera.position.y = mix(.1, -.08, camFinal) - state.pointerSmoothY * (mobile ? .018 : .07);
    camera.lookAt(0, mobile ? -.48 : -.18, 0);


    const t01 = smoothstep(seg(p, 0, .25));
    groupA.position.set(
      mobile ? 0 : 2.18,
      mix(mobile ? -2.05 : -1.15, mobile ? -2.48 : -1.62, t01),
      mix(.25, -.45, t01)
    );
    const aScale = mix(mobile ? .90 : 1.08, mobile ? .60 : .72, t01);
    groupA.scale.set(aScale, aScale, aScale);
    groupA.rotation.x = mix(.08, .23, t01) + state.pointerSmoothY * .02;
    groupA.rotation.y = mix(.04, .10, t01) + state.pointerSmoothX * .018;
    groupA.rotation.z = p * .16;
    setGroupOpacity(groupA, mix(1, .96, t01) * exactSceneOpacity);


    const t12 = smoothstep(seg(p, .25, .62));
    groupA.rotation.x = mix(.23, 1.04, t12) + state.pointerSmoothY * .02;
    groupA.rotation.y = mix(.10, .22, t12) + state.pointerSmoothX * .02;
    groupA.rotation.z = mix(.04, -.04, t12);
    groupA.scale.x = mix(mobile ? .60 : .72, mobile ? .92 : 1.08, t12);
    groupA.scale.y = mix(mobile ? .60 : .72, mobile ? .78 : .88, t12);
    groupA.scale.z = mix(mobile ? .60 : .72, mobile ? .82 : .90, t12);
    groupA.position.y = mix(mobile ? -2.48 : -1.62, mobile ? -2.22 : -1.62, t12);
    groupA.position.x = mix(mobile ? 0 : 2.18, mobile ? .48 : 2.42, t12);
    groupA.position.z = mix(-.45, .05, t12);
    setGroupOpacity(groupA, mix(.96, .58, t12) * exactSceneOpacity);


    const t23 = smoothstep(seg(p, .62, .86));
    setGroupOpacity(groupA, mix(.96, .08, t23) * exactSceneOpacity);

    groupB.position.set(
      mix(mobile ? 3.9 : 5.4, mobile ? 1.25 : 2.35, t23),
      mix(mobile ? -1.15 : -.30, mobile ? -.55 : .10, t23),
      mix(-1.3, .75, t23)
    );
    const bScale = mix(mobile ? 1.45 : 1.90, mobile ? 2.15 : 2.80, t23);
    groupB.scale.set(bScale, bScale * .94, bScale);
    groupB.rotation.x = mix(.62, .30, t23);
    groupB.rotation.y = mix(1.15, .72, t23);
    groupB.rotation.z = .48 + p * .38;
    setGroupOpacity(groupB, mix(0, .88, t23) * exactSceneOpacity);

    groupC.position.set(
      mix(mobile ? -4.2 : -5.8, mobile ? -1.65 : -2.75, t23),
      mix(mobile ? 1.75 : 1.8, mobile ? .65 : .65, t23),
      mix(-1.55, .55, t23)
    );
    const cScale = mix(mobile ? 1.22 : 1.62, mobile ? 1.95 : 2.52, t23);
    groupC.scale.set(cScale, cScale * 1.04, cScale);
    groupC.rotation.x = mix(1.05, .82, t23);
    groupC.rotation.y = mix(-.78, -.45, t23);
    groupC.rotation.z = -.18 - p * .30;
    setGroupOpacity(groupC, mix(0, .70, t23) * exactSceneOpacity);

    const tf = smoothstep(seg(p, .84, 1));
    const bFinal = mix(1, mobile ? 1.28 : 1.40, tf);
    const cFinal = mix(1, mobile ? 1.34 : 1.46, tf);
    groupB.scale.multiplyScalar(bFinal);
    groupC.scale.multiplyScalar(cFinal);
    groupB.position.x = mix(groupB.position.x, mobile ? .45 : 1.15, tf);
    groupC.position.x = mix(groupC.position.x, mobile ? -.82 : -1.55, tf);

    if (!reducedMotion) {
      const time = performance.now() * .00014;
      groupA.rotation.z += Math.sin(time) * .00028;
      groupB.rotation.x += Math.sin(time * .75) * .0008;
      groupC.rotation.y += Math.cos(time * .68) * .0007;
    }

    renderer.render(scene, camera);
  }

  function startAnimation() {
    if (rafId || document.hidden) return;
    rafId = requestAnimationFrame(animate);
  }

  function stopAnimation() {
    if (!rafId) return;
    cancelAnimationFrame(rafId);
    rafId = 0;
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stopAnimation();
    else if (state.active) startAnimation();
  });
  addEventListener('pagehide', stopAnimation, { once: true });

  applyTheme();
  updateScrollProgress();
  resize();
  if (state.active) startAnimation();
})();
