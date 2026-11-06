/**
 * Nature ambience synthesised live with the Web Audio API: wind, a flowing stream and birdsong.
 * Nothing is downloaded and there is no recording to license, and birds never repeat a loop.
 * Must be started from a user gesture, so it cannot autoplay.
 */
const MASTER_LEVEL = 0.32;

function noiseBuffer(ctx, seconds, brown) {
  const buffer = ctx.createBuffer(2, ctx.sampleRate * seconds, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const data = buffer.getChannelData(ch);
    let last = 0;
    for (let i = 0; i < data.length; i++) {
      const white = Math.random() * 2 - 1;
      if (brown) {
        last = (last + 0.02 * white) / 1.02;
        data[i] = last * 3.5;
      } else {
        data[i] = white;
      }
    }
  }
  return buffer;
}

function rand(min, max) {
  return min + Math.random() * (max - min);
}

export function createNatureAudio() {
  let ctx = null;
  let master = null;
  let birdBus = null;
  let birdTimer = null;
  let running = false;

  function loop(buffer) {
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    return source;
  }

  /** A slow random-feeling swell: two detuned sine LFOs driving one AudioParam. */
  function swell(param, depth, speedA, speedB) {
    [speedA, speedB].forEach((speed) => {
      const lfo = ctx.createOscillator();
      const gain = ctx.createGain();
      lfo.frequency.value = speed;
      gain.gain.value = depth;
      lfo.connect(gain).connect(param);
      lfo.start();
    });
  }

  function build() {
    const Ctor = window.AudioContext || window.webkitAudioContext;
    ctx = new Ctor();
    master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);

    const brown = noiseBuffer(ctx, 6, true);
    const white = noiseBuffer(ctx, 4, false);

    // Soft wind through the trees.
    const wind = loop(brown);
    const windFilter = ctx.createBiquadFilter();
    windFilter.type = 'lowpass';
    windFilter.frequency.value = 520;
    const windGain = ctx.createGain();
    windGain.gain.value = 0.42;
    swell(windFilter.frequency, 170, 0.07, 0.13);
    swell(windGain.gain, 0.12, 0.05, 0.11);
    wind.connect(windFilter).connect(windGain).connect(master);
    wind.start();

    // Leaves rustling: the same wind, high up and very quiet.
    const leaves = loop(white);
    const leavesFilter = ctx.createBiquadFilter();
    leavesFilter.type = 'highpass';
    leavesFilter.frequency.value = 4200;
    const leavesGain = ctx.createGain();
    leavesGain.gain.value = 0.012;
    swell(leavesGain.gain, 0.008, 0.09, 0.17);
    leaves.connect(leavesFilter).connect(leavesGain).connect(master);
    leaves.start();

    // A stream: two water-coloured noise bands with a quick, shallow babble.
    [
      { freq: 950, q: 0.7, level: 0.05, babble: [0.9, 2.3] },
      { freq: 2300, q: 1.1, level: 0.022, babble: [1.7, 3.1] },
    ].forEach(({ freq, q, level, babble }) => {
      const water = loop(white);
      const band = ctx.createBiquadFilter();
      band.type = 'bandpass';
      band.frequency.value = freq;
      band.Q.value = q;
      const gain = ctx.createGain();
      gain.gain.value = level;
      swell(band.frequency, freq * 0.1, babble[0], babble[1]);
      swell(gain.gain, level * 0.22, babble[1], babble[0] * 1.6);
      water.connect(band).connect(gain).connect(master);
      water.start();
    });

    // Birds sing through a short echo, which places them away among the trees.
    birdBus = ctx.createGain();
    birdBus.gain.value = 0.5;
    const echo = ctx.createDelay(1);
    echo.delayTime.value = 0.23;
    const feedback = ctx.createGain();
    feedback.gain.value = 0.28;
    const echoLevel = ctx.createGain();
    echoLevel.gain.value = 0.35;
    birdBus.connect(master);
    birdBus.connect(echo);
    echo.connect(feedback).connect(echo);
    echo.connect(echoLevel).connect(master);
  }

  function chirp(when, from, to, length, level, pan) {
    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    const panner = ctx.createStereoPanner();
    panner.pan.value = pan;
    osc.type = 'sine';
    osc.frequency.setValueAtTime(from, when);
    osc.frequency.exponentialRampToValueAtTime(to, when + length);
    env.gain.setValueAtTime(0.0001, when);
    env.gain.exponentialRampToValueAtTime(level, when + length * 0.25);
    env.gain.exponentialRampToValueAtTime(0.0001, when + length);
    osc.connect(env).connect(panner).connect(birdBus);
    osc.start(when);
    osc.stop(when + length + 0.02);
  }

  /** Three simple songs: a whistle, a quick trill and a two-note call. */
  function birdSong() {
    const now = ctx.currentTime + 0.05;
    const pan = rand(-0.8, 0.8);
    const level = rand(0.05, 0.11);
    const kind = Math.floor(Math.random() * 3);
    if (kind === 0) {
      const base = rand(2400, 3400);
      const notes = 2 + Math.floor(Math.random() * 3);
      for (let i = 0; i < notes; i++) {
        chirp(now + i * 0.24, base * rand(0.95, 1.05), base * rand(1.15, 1.4), 0.17, level, pan);
      }
    } else if (kind === 1) {
      const base = rand(3800, 5000);
      const notes = 6 + Math.floor(Math.random() * 7);
      for (let i = 0; i < notes; i++) {
        chirp(now + i * 0.075, base, base * 0.86, 0.055, level * 0.75, pan);
      }
    } else {
      const base = rand(1700, 2400);
      chirp(now, base * 1.25, base, 0.32, level, pan);
      chirp(now + 0.42, base, base * 0.82, 0.42, level, pan);
    }
  }

  function scheduleBirds() {
    birdTimer = setTimeout(() => {
      if (!running) return;
      birdSong();
      scheduleBirds();
    }, rand(1800, 6500));
  }

  return {
    async start() {
      if (running) return;
      if (!ctx) build();
      running = true;
      await ctx.resume();
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.setValueAtTime(master.gain.value, ctx.currentTime);
      master.gain.linearRampToValueAtTime(MASTER_LEVEL, ctx.currentTime + 1.5);
      scheduleBirds();
    },
    stop() {
      running = false;
      clearTimeout(birdTimer);
      if (!ctx) return;
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.setValueAtTime(0, ctx.currentTime);
      ctx.suspend();
    },
    destroy() {
      this.stop();
      ctx?.close();
      ctx = null;
    },
  };
}
