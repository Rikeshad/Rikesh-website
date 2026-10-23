(() => {
  'use strict';

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  /* --------------------------------------------------------------------------
     Scroll-led spherical-wave story
     Four full-screen chapters stay pinned while the WebGL sphere responds to
     scroll progress. The words reveal in short 3D lifts instead of appearing
     all at once, echoing the supplied Spherical Waves motion language.
  -------------------------------------------------------------------------- */
  const waveStory = $('[data-wave-story]');

  if (waveStory) {
    const storyFrames = $$('[data-story-frame]', waveStory);
    const storyCounter = $('[data-story-counter]', waveStory);
    const storyProgressBar = $('[data-story-progress]', waveStory);
    let currentStoryFrame = -1;
    let storyRaf = null;

    $$('[data-story-words]', waveStory).forEach(heading => {
      const words = heading.textContent.trim().split(/\s+/);
      heading.textContent = '';

      words.forEach((word, index) => {
        const clip = document.createElement('span');
        clip.className = 'story-word-clip';
        const inner = document.createElement('span');
        inner.className = 'story-word';
        inner.textContent = word;
        inner.style.setProperty('--word-delay', `${index * 46}ms`);
        clip.appendChild(inner);
        heading.appendChild(clip);
        if (index < words.length - 1) heading.append(' ');
      });
    });

    const clamp01 = value => Math.max(0, Math.min(1, value));

    function updateWaveStory() {
      storyRaf = null;
      const rect = waveStory.getBoundingClientRect();
      const travel = Math.max(1, waveStory.offsetHeight - innerHeight);
      const progress = clamp01(-rect.top / travel);
      const stage = progress * Math.max(1, storyFrames.length - 1);
      const activeIndex = Math.min(storyFrames.length - 1, Math.max(0, Math.round(stage)));
      const active = rect.top <= 2 && rect.bottom >= innerHeight * 0.72;

      window.__rikeshWaveStoryProgress = progress;
      window.__rikeshWaveStoryActive = active;
      document.documentElement.style.setProperty('--wave-story-progress', progress.toFixed(4));
      document.body.classList.toggle('wave-story-active', active);

      if (storyProgressBar) storyProgressBar.style.transform = `scaleX(${Math.max(0.02, progress)})`;
      if (storyCounter) storyCounter.textContent = String(activeIndex + 1).padStart(3, '0');

      storyFrames.forEach((frame, index) => {
        const distance = index - stage;
        const opacity = clamp01(1 - Math.abs(distance) * 1.55);
        const translate = distance * 58;
        const scale = 0.965 + opacity * 0.035;
        frame.style.opacity = opacity.toFixed(3);
        frame.style.transform = `translate3d(0, ${translate.toFixed(2)}px, 0) scale(${scale.toFixed(4)})`;
        frame.style.filter = `blur(${((1 - opacity) * 10).toFixed(2)}px)`;
      });

      if (activeIndex !== currentStoryFrame) {
        currentStoryFrame = activeIndex;
        storyFrames.forEach((frame, index) => frame.classList.toggle('is-current', index === activeIndex));
      }
    }

    function requestWaveStoryUpdate() {
      if (storyRaf !== null) return;
      storyRaf = requestAnimationFrame(updateWaveStory);
    }

    addEventListener('scroll', requestWaveStoryUpdate, { passive: true });
    addEventListener('resize', requestWaveStoryUpdate, { passive: true });
    updateWaveStory();
  }

  /* --------------------------------------------------------------------------
     Hero wave lettering
  -------------------------------------------------------------------------- */
  $$('[data-wave]').forEach((line, lineIndex) => {
    const text = line.textContent;
    line.textContent = '';

    [...text].forEach((character, characterIndex) => {
      const span = document.createElement('span');
      span.className = 'wave-letter';
      span.textContent = character === ' ' ? '\u00a0' : character;
      span.style.animationDelay = `${characterIndex * 0.07 + lineIndex * 0.12}s`;
      line.appendChild(span);
    });
  });

  /* --------------------------------------------------------------------------
     Calculator
  -------------------------------------------------------------------------- */
  let expression = '';
  const display = $('#calc-display');
  const history = $('#calc-history');

  function renderCalculator() {
    if (display) display.textContent = expression || '0';
  }

  function evaluateExpression(source) {
    const text = source.replace(/×/g, '*').replace(/÷/g, '/');
    let position = 0;

    function skipSpaces() {
      while (/\s/.test(text[position] || '')) position += 1;
    }

    function parseNumber() {
      skipSpaces();
      const start = position;
      let dots = 0;

      while (/[0-9.]/.test(text[position] || '')) {
        if (text[position] === '.') dots += 1;
        if (dots > 1) throw new Error('Invalid number');
        position += 1;
      }

      if (start === position) throw new Error('Number expected');
      const value = Number(text.slice(start, position));
      if (!Number.isFinite(value)) throw new Error('Invalid number');
      return value;
    }

    function parsePrimary() {
      skipSpaces();
      let value;

      if (text[position] === '(') {
        position += 1;
        value = parseExpression();
        skipSpaces();
        if (text[position] !== ')') throw new Error('Missing parenthesis');
        position += 1;
      } else {
        value = parseNumber();
      }

      skipSpaces();
      while (text[position] === '%') {
        value /= 100;
        position += 1;
        skipSpaces();
      }

      return value;
    }

    function parseUnary() {
      skipSpaces();
      if (text[position] === '+') {
        position += 1;
        return parseUnary();
      }
      if (text[position] === '-') {
        position += 1;
        return -parseUnary();
      }
      return parsePrimary();
    }

    function parseTerm() {
      let value = parseUnary();

      while (true) {
        skipSpaces();
        const operator = text[position];
        if (operator !== '*' && operator !== '/') break;
        position += 1;
        const right = parseUnary();
        value = operator === '*' ? value * right : value / right;
      }

      return value;
    }

    function parseExpression() {
      let value = parseTerm();

      while (true) {
        skipSpaces();
        const operator = text[position];
        if (operator !== '+' && operator !== '-') break;
        position += 1;
        const right = parseTerm();
        value = operator === '+' ? value + right : value - right;
      }

      return value;
    }

    const result = parseExpression();
    skipSpaces();
    if (position !== text.length || !Number.isFinite(result)) throw new Error('Invalid expression');
    return result;
  }

  window.calcInput = value => {
    if (expression.length >= 42) return;
    expression += value;
    renderCalculator();
  };

  window.calcClear = () => {
    expression = '';
    if (history) history.textContent = '';
    renderCalculator();
  };

  window.calcDelete = () => {
    expression = expression.slice(0, -1);
    renderCalculator();
  };

  window.calcEquals = () => {
    if (!expression) return;

    try {
      const result = evaluateExpression(expression);
      if (history) history.textContent = `${expression} =`;
      expression = String(Math.round((result + Number.EPSILON) * 1e10) / 1e10);
      renderCalculator();
    } catch {
      if (display) display.textContent = 'Error';
      expression = '';
    }
  };

  $$('[data-calc]').forEach(button => {
    button.addEventListener('click', () => {
      const value = button.dataset.calc;
      if (value === 'clear') calcClear();
      else if (value === 'delete') calcDelete();
      else if (value === 'equals') calcEquals();
      else calcInput(value);
    });
  });

  addEventListener('keydown', event => {
    const target = event.target;
    if (
      target instanceof HTMLElement &&
      (target.matches('input, textarea, select') || target.isContentEditable)
    ) {
      return;
    }

    if (/^[0-9.+\-*/()%]$/.test(event.key)) {
      calcInput(event.key);
      event.preventDefault();
    } else if (event.key === 'Enter' || event.key === '=') {
      calcEquals();
      event.preventDefault();
    } else if (event.key === 'Backspace') {
      calcDelete();
      event.preventDefault();
    } else if (event.key === 'Escape') {
      calcClear();
    }
  });

  /* --------------------------------------------------------------------------
     Persistent timer
  -------------------------------------------------------------------------- */
  const STORAGE_KEY = 'rikeshFocusTimerV2';
  const timerDisplay = $('#timer-display');
  const timerStatus = $('#timer-status');
  const timerProgress = $('#timer-progress');
  const timerStart = $('#timer-start');
  const notificationToggle = $('#notify-toggle');
  const timerRing = $('.timer-ring');
  const circumference = 2 * Math.PI * 42;

  let tickId = null;
  let state = {
    durationMs: 10 * 60000,
    remainingMs: 10 * 60000,
    endTime: null,
    running: false,
    warningFired: false
  };

  function saveTimer() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function formatTime(milliseconds) {
    const seconds = Math.max(0, Math.ceil(milliseconds / 1000));
    return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  }

  function beep(frequency = 740, duration = 0.14) {
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      const audio = new AudioContextClass();
      const oscillator = audio.createOscillator();
      const gain = audio.createGain();
      oscillator.frequency.value = frequency;
      oscillator.connect(gain);
      gain.connect(audio.destination);
      gain.gain.setValueAtTime(0.07, audio.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + duration);
      oscillator.start();
      oscillator.stop(audio.currentTime + duration);
    } catch {
      /* Audio is optional. */
    }
  }

  function renderTimer() {
    if (timerDisplay) timerDisplay.textContent = formatTime(state.remainingMs);
    if (timerStatus) {
      timerStatus.textContent = state.running
        ? 'Focus in progress'
        : state.remainingMs === 0
          ? 'Time’s up'
          : 'Ready';
    }

    if (timerProgress) {
      const ratio = state.durationMs ? state.remainingMs / state.durationMs : 0;
      timerProgress.style.strokeDasharray = circumference;
      timerProgress.style.strokeDashoffset = circumference * (1 - ratio);
    }

    if (timerStart) timerStart.textContent = state.running ? 'Pause' : 'Start';
    if (state.remainingMs > 60000) timerRing?.classList.remove('one-minute');
  }

  async function warnAtOneMinute() {
    if (state.warningFired || state.remainingMs > 60000 || state.remainingMs <= 0) return;

    state.warningFired = true;
    saveTimer();
    timerRing?.classList.add('one-minute');
    beep(880, 0.18);
    showToast('1 minute remaining');

    if (notificationToggle?.checked && 'Notification' in window) {
      try {
        if (Notification.permission === 'default') await Notification.requestPermission();
        if (Notification.permission === 'granted') {
          new Notification('1 minute remaining', {
            body: 'Your timer on rikeshad.com is almost finished.'
          });
        }
      } catch {
        /* Browser notifications are optional. */
      }
    }
  }

  function tick() {
    if (!state.running) return;

    state.remainingMs = Math.max(0, state.endTime - Date.now());
    warnAtOneMinute();

    if (state.remainingMs <= 0) {
      state.running = false;
      state.endTime = null;
      state.warningFired = false;
      beep(560, 0.22);
      setTimeout(() => beep(760, 0.26), 260);
      showToast('Time’s up!');
      clearInterval(tickId);
      tickId = null;
    }

    saveTimer();
    renderTimer();
  }

  function startTicking() {
    if (tickId) clearInterval(tickId);
    tickId = setInterval(tick, 500);
    tick();
  }

  window.timerPreset = minutes => {
    state = {
      durationMs: minutes * 60000,
      remainingMs: minutes * 60000,
      endTime: null,
      running: false,
      warningFired: false
    };

    if (tickId) clearInterval(tickId);
    tickId = null;
    saveTimer();
    renderTimer();
    $$('.preset').forEach(button => {
      button.classList.toggle('active', Number(button.dataset.min) === minutes);
    });
  };

  const customInput = $('#custom-min');
  const customSet = $('#custom-set');

  function setCustomTimer() {
    const value = Number(customInput?.value);

    if (!Number.isFinite(value) || value < 1 || value > 180) {
      showToast('Enter a time between 1 and 180 minutes.');
      customInput?.focus();
      return;
    }

    const minutes = Math.round(value);
    timerPreset(minutes);
    if (customInput) customInput.value = String(minutes);
    showToast(`Timer set for ${minutes} minute${minutes === 1 ? '' : 's'}.`);
  }

  customSet?.addEventListener('click', setCustomTimer);
  customInput?.addEventListener('keydown', event => {
    if (event.key === 'Enter') {
      event.preventDefault();
      setCustomTimer();
    }
  });

  $$('.preset').forEach(button => {
    button.addEventListener('click', () => timerPreset(Number(button.dataset.min)));
  });

  timerStart?.addEventListener('click', () => {
    if (state.remainingMs <= 0) state.remainingMs = state.durationMs;

    if (state.running) {
      state.remainingMs = Math.max(0, state.endTime - Date.now());
      state.running = false;
      state.endTime = null;
      if (tickId) clearInterval(tickId);
      tickId = null;
    } else {
      state.running = true;
      state.endTime = Date.now() + state.remainingMs;
      if (state.remainingMs > 60000) state.warningFired = false;
      startTicking();
    }

    saveTimer();
    renderTimer();
  });

  $('#timer-reset')?.addEventListener('click', () => {
    state.remainingMs = state.durationMs;
    state.endTime = null;
    state.running = false;
    state.warningFired = false;
    if (tickId) clearInterval(tickId);
    tickId = null;
    saveTimer();
    renderTimer();
    timerRing?.classList.remove('one-minute');
  });

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && state.running) tick();
  });

  function loadTimer() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if (saved && typeof saved === 'object') state = { ...state, ...saved };
    } catch {
      /* Ignore corrupt saved state. */
    }

    if (state.running && state.endTime) {
      state.remainingMs = Math.max(0, state.endTime - Date.now());
      if (state.remainingMs <= 0) {
        state.running = false;
        state.endTime = null;
        state.remainingMs = 0;
      }
    }

    saveTimer();
    renderTimer();
    if (state.running) startTicking();
  }

  loadTimer();
})();
