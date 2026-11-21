(() => {
  'use strict';

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];


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


  let expression = '';
  const display = $('#calc-display');
  const history = $('#calc-history');
  const calculator = display?.closest('.neo-calc');

  function renderCalculator() {
    if (!display) return;
    display.textContent = expression || '0';
    fitCalculatorDisplay();
  }

  function fitCalculatorDisplay() {
    if (!display) return;
    display.style.removeProperty('font-size');
    display.style.removeProperty('height');
    const maximum = parseFloat(getComputedStyle(display).fontSize);
    const height = display.clientHeight;
    if (display.scrollWidth > display.clientWidth) {
      let low = 18;
      let high = maximum;
      display.style.height = `${height}px`;
      // Measure the rendered font, including its real spacing, rather than
      // guessing a size from the number of characters.
      display.style.fontSize = `${low}px`;
      if (display.scrollWidth <= display.clientWidth) {
        while (high - low > .25) {
          const size = (low + high) / 2;
          display.style.fontSize = `${size}px`;
          if (display.scrollWidth <= display.clientWidth) low = size;
          else high = size;
        }
      }
      display.style.fontSize = `${low}px`;
    }
    display.scrollLeft = display.scrollWidth;
    if (history) history.scrollLeft = history.scrollWidth;
  }
  if (display && 'ResizeObserver' in window) {
    let previousWidth = 0;
    new ResizeObserver(entries => {
      const width = entries[0].contentRect.width;
      if (width !== previousWidth) {
        previousWidth = width;
        fitCalculatorDisplay();
      }
    }).observe(display);
  } else if (display) {
    addEventListener('resize', fitCalculatorDisplay, { passive: true });
  }
  document.fonts?.ready.then(fitCalculatorDisplay);

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
      fitCalculatorDisplay();
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
    if (!calculator?.contains(target) || event.defaultPrevented ||
        event.ctrlKey || event.metaKey || event.altKey) return;
    if (target instanceof HTMLElement &&
        (target.matches('input, textarea, select') || target.isContentEditable)) return;
    // Enter on a calculator button must activate that button exactly once.
    if (event.key === 'Enter' && target.closest('button')) return;

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


  const STORAGE_KEY = 'rikeshFocusTimerV2';
  const timerDisplay = $('#timer-display');
  const timerStatus = $('#timer-status');
  const timerProgress = $('#timer-progress');
  const timerStart = $('#timer-start');
  const notificationToggle = $('#notify-toggle');
  const alarmPanel = $('#timer-alarm');
  const alarmMessage = $('#timer-alarm-message');
  const enableSound = $('#timer-enable-sound');
  const audioSupported = Boolean(window.AudioContext || window.webkitAudioContext);
  let timerAudio = null;
  let alarmSource = null;
  const tones = new Set();
  const timerRing = $('.timer-ring');
  const circumference = 2 * Math.PI * 42;

  let tickId = null;
  let state = {
    durationMs: 10 * 60000,
    remainingMs: 10 * 60000,
    endTime: null,
    running: false,
    warningFired: false,
    alarming: false,
  };

  function saveTimer() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {}
  }

  function formatTime(milliseconds) {
    const seconds = Math.max(0, Math.ceil(milliseconds / 1000));
    return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  }

  function unlockAudio() {
    try {
      const Audio = window.AudioContext || window.webkitAudioContext;
      if (!Audio) return;
      if (!timerAudio || timerAudio.state === 'closed') {
        timerAudio = new Audio();
        timerAudio.addEventListener('statechange', () => {
          if (state.alarming) startAlarm();
          renderTimer();
        });
      }
      if (timerAudio.state === 'suspended')
        timerAudio
          .resume()
          .then(() => {
            if (state.alarming) startAlarm();
            renderTimer();
          })
          .catch(() => renderTimer());
    } catch {
      /* The visual alarm remains available if audio is unavailable. */
    }
  }
  function stopSound() {
    if (alarmSource) {
      try {
        alarmSource.stop();
      } catch {}
      alarmSource.disconnect();
      alarmSource = null;
    }
    tones.forEach((tone) => {
      try {
        tone.stop();
      } catch {}
    });
    tones.clear();
  }
  function silenceAlarm() {
    stopSound();
    state.alarming = false;
  }
  function startAlarm() {
    if (!state.alarming || alarmSource || !timerAudio || timerAudio.state !== 'running') return;
    try {
      const rate = timerAudio.sampleRate;
      const buffer = timerAudio.createBuffer(1, Math.ceil(rate * 1.5), rate);
      const samples = buffer.getChannelData(0);
      for (let pulse = 0; pulse < 3; pulse++) {
        const start = Math.floor(pulse * 0.28 * rate);
        const length = Math.floor(0.18 * rate);
        for (let i = 0; i < length; i++) {
          const envelope = Math.min(1, i / (rate * 0.01), (length - i) / (rate * 0.025));
          samples[start + i] =
            0.12 * envelope * Math.sin((2 * Math.PI * (pulse % 2 ? 880 : 660) * i) / rate);
        }
      }
      alarmSource = timerAudio.createBufferSource();
      alarmSource.buffer = buffer;
      alarmSource.loop = true;
      alarmSource.connect(timerAudio.destination);
      alarmSource.start();
    } catch {
      stopSound();
    }
  }
  function beep(frequency = 740, duration = 0.14) {
    if (!timerAudio || timerAudio.state !== 'running') return;
    try {
      const tone = timerAudio.createOscillator(),
        gain = timerAudio.createGain();
      tone.frequency.value = frequency;
      tone.connect(gain);
      gain.connect(timerAudio.destination);
      gain.gain.setValueAtTime(0.07, timerAudio.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, timerAudio.currentTime + duration);
      tones.add(tone);
      tone.onended = () => {
        tones.delete(tone);
        tone.disconnect();
        gain.disconnect();
      };
      tone.start();
      tone.stop(timerAudio.currentTime + duration);
    } catch {}
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
    const audible = Boolean(alarmSource && timerAudio?.state === 'running');
    if (alarmPanel) alarmPanel.hidden = !state.alarming;
    const moveAlarmFocus = audible && document.activeElement === enableSound;
    if (enableSound) enableSound.hidden = !state.alarming || audible || !audioSupported;
    if (alarmMessage) {
      const message = !state.alarming
        ? ''
        : audible
          ? "Time's up. Alarm ringing until stopped."
          : !audioSupported
            ? "Time's up. Sound is unavailable in this browser."
            : "Time's up. Enable alarm sound or stop the alarm.";
      if (alarmMessage.textContent !== message) alarmMessage.textContent = message;
    }
    if (moveAlarmFocus) $('#timer-stop-alarm')?.focus({ preventScroll: true });
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
            body: 'Your timer on rikeshad.com is almost finished.',
          });
        }
      } catch {}
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
      state.alarming = true;
      startAlarm();
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

  window.timerPreset = (minutes) => {
    silenceAlarm();
    state = {
      durationMs: minutes * 60000,
      remainingMs: minutes * 60000,
      endTime: null,
      running: false,
      warningFired: false,
      alarming: false,
    };

    if (tickId) clearInterval(tickId);
    tickId = null;
    saveTimer();
    renderTimer();
    $$('.preset').forEach((button) => {
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
  customInput?.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      setCustomTimer();
    }
  });

  $$('.preset').forEach((button) => {
    button.addEventListener('click', () => timerPreset(Number(button.dataset.min)));
  });

  timerStart?.addEventListener('click', () => {
    unlockAudio();
    silenceAlarm();
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
    silenceAlarm();
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

  $('#timer-stop-alarm')?.addEventListener('click', () => {
    silenceAlarm();
    saveTimer();
    renderTimer();
    timerStart?.focus({ preventScroll: true });
  });
  enableSound?.addEventListener('click', () => {
    unlockAudio();
    startAlarm();
    renderTimer();
    if (enableSound.hidden) $('#timer-stop-alarm')?.focus({ preventScroll: true });
  });
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      if (state.running) tick();
      if (state.alarming) {
        startAlarm();
        renderTimer();
      }
    }
  });
  addEventListener('pagehide', stopSound);
  addEventListener('pageshow', () => {
    if (state.running) tick();
    if (state.alarming) {
      startAlarm();
      renderTimer();
    }
  });

  function loadTimer() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if (saved && typeof saved === 'object') state = { ...state, ...saved };
    } catch {}

    if (state.running && state.endTime) {
      state.remainingMs = Math.max(0, state.endTime - Date.now());
      if (state.remainingMs <= 0) {
        state.running = false;
        state.endTime = null;
        state.remainingMs = 0;
        state.alarming = true;
      }
    }

    saveTimer();
    renderTimer();
    if (state.running) startTicking();
    if (state.alarming) {
      startAlarm();
      renderTimer();
    }
  }

  loadTimer();
})();
