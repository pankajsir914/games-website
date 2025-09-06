import { useRef, useCallback } from 'react';

export const useChickenRunSounds = () => {
  const audioContext = useRef<AudioContext | null>(null);
  const isPlaying = useRef<{ [key: string]: boolean }>({});

  const initAudio = () => {
    if (!audioContext.current) {
      audioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContext.current;
  };

  const playSound = useCallback((
    frequency: number,
    duration: number,
    type: OscillatorType = 'sine',
    volume: number = 0.3,
    attack: number = 0.01,
    decay: number = 0.1
  ) => {
    const ctx = initAudio();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
    
    // ADSR envelope
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(volume, ctx.currentTime + attack);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);

    return oscillator;
  }, []);

  const playChickenWalk = useCallback(() => {
    // Light footstep sounds
    playSound(200, 0.1, 'sine', 0.1);
    setTimeout(() => playSound(180, 0.1, 'sine', 0.1), 100);
  }, [playSound]);

  const playChickenJump = useCallback(() => {
    // Ascending jump sound
    const ctx = initAudio();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(300, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.2);
    
    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.3);
  }, []);

  const playFireTrap = useCallback(() => {
    // Crackling fire sound
    const ctx = initAudio();
    const whiteNoise = ctx.createBufferSource();
    const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.5, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < buffer.length; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    whiteNoise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1000, ctx.currentTime);
    filter.Q.setValueAtTime(0.5, ctx.currentTime);

    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);

    whiteNoise.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);

    whiteNoise.start(ctx.currentTime);
    whiteNoise.stop(ctx.currentTime + 0.5);

    // Add some low frequency rumble
    playSound(50, 0.5, 'sawtooth', 0.1);
  }, [playSound]);

  const playSafeTile = useCallback(() => {
    // Pleasant coin/success sound
    playSound(523.25, 0.1, 'sine', 0.2); // C5
    setTimeout(() => playSound(659.25, 0.1, 'sine', 0.2), 50); // E5
    setTimeout(() => playSound(783.99, 0.15, 'sine', 0.3), 100); // G5
  }, [playSound]);

  const playVictory = useCallback(() => {
    // Victory fanfare
    const notes = [523.25, 587.33, 659.25, 783.99, 880, 1046.5]; // C5, D5, E5, G5, A5, C6
    notes.forEach((freq, i) => {
      setTimeout(() => playSound(freq, 0.3, 'square', 0.2), i * 100);
    });
  }, [playSound]);

  const playGameOver = useCallback(() => {
    // Descending sad sound
    playSound(440, 0.2, 'sawtooth', 0.3);
    setTimeout(() => playSound(415.3, 0.2, 'sawtooth', 0.3), 200);
    setTimeout(() => playSound(392, 0.2, 'sawtooth', 0.3), 400);
    setTimeout(() => playSound(349.23, 0.4, 'sawtooth', 0.3), 600);
  }, [playSound]);

  const playButtonClick = useCallback(() => {
    playSound(800, 0.05, 'square', 0.1);
  }, [playSound]);

  const playBetPlaced = useCallback(() => {
    // Cash register sound
    playSound(1000, 0.05, 'square', 0.2);
    setTimeout(() => playSound(1200, 0.05, 'square', 0.2), 50);
  }, [playSound]);

  const playCashOut = useCallback(() => {
    // Multiple coin sounds
    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        playSound(800 + Math.random() * 400, 0.1, 'triangle', 0.2);
      }, i * 50);
    }
  }, [playSound]);

  const playAmbientMusic = useCallback(() => {
    if (isPlaying.current.ambient) return;
    
    const ctx = initAudio();
    isPlaying.current.ambient = true;

    const playNote = (freq: number, delay: number) => {
      setTimeout(() => {
        if (!isPlaying.current.ambient) return;
        
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(freq, ctx.currentTime);
        
        gainNode.gain.setValueAtTime(0, ctx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 0.5);
        gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 2);

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 2);
      }, delay);
    };

    // Simple looping melody
    const melody = [261.63, 293.66, 329.63, 349.23, 392, 349.23, 329.63, 293.66];
    const loop = () => {
      if (!isPlaying.current.ambient) return;
      
      melody.forEach((note, i) => {
        playNote(note, i * 500);
      });
      
      setTimeout(loop, melody.length * 500);
    };

    loop();
  }, []);

  const stopAmbientMusic = useCallback(() => {
    isPlaying.current.ambient = false;
  }, []);

  return {
    playChickenWalk,
    playChickenJump,
    playFireTrap,
    playSafeTile,
    playVictory,
    playGameOver,
    playButtonClick,
    playBetPlaced,
    playCashOut,
    playAmbientMusic,
    stopAmbientMusic
  };
};