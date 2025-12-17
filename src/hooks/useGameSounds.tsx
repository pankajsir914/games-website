import { useRef, useCallback } from 'react';

export const useGameSounds = () => {
  const audioContext = useRef<AudioContext | null>(null);

  const initAudio = () => {
    if (!audioContext.current) {
      audioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContext.current;
  };

  const playSound = useCallback((frequency: number, duration: number, type: OscillatorType = 'sine', volume: number = 0.3) => {
    const ctx = initAudio();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.frequency.value = frequency;
    oscillator.type = type;
    
    gainNode.gain.setValueAtTime(volume, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);
  }, []);

  const playCardFlip = useCallback(() => {
    playSound(800, 0.1, 'square', 0.2);
    setTimeout(() => playSound(1200, 0.1, 'square', 0.2), 50);
  }, [playSound]);

  const playChipPlace = useCallback(() => {
    playSound(600, 0.05, 'sine', 0.3);
    playSound(900, 0.05, 'sine', 0.2);
  }, [playSound]);

  const playWin = useCallback(() => {
    const notes = [523, 659, 784, 1047]; // C, E, G, C (octave up)
    notes.forEach((note, i) => {
      setTimeout(() => playSound(note, 0.3, 'sine', 0.3), i * 100);
    });
  }, [playSound]);

  const playLose = useCallback(() => {
    playSound(200, 0.3, 'sawtooth', 0.2);
    setTimeout(() => playSound(150, 0.3, 'sawtooth', 0.2), 150);
  }, [playSound]);

  const playClick = useCallback(() => {
    playSound(1000, 0.05, 'sine', 0.2);
  }, [playSound]);

  const playDiceRoll = useCallback(() => {
    for (let i = 0; i < 10; i++) {
      setTimeout(() => {
        const freq = 200 + Math.random() * 400;
        playSound(freq, 0.05, 'square', 0.1);
      }, i * 30);
    }
  }, [playSound]);

  const playSpinWheel = useCallback(() => {
    for (let i = 0; i < 20; i++) {
      setTimeout(() => {
        playSound(400 + i * 20, 0.05, 'sine', 0.2 - i * 0.008);
      }, i * 50);
    }
  }, [playSound]);

  const playCountdown = useCallback(() => {
    playSound(800, 0.1, 'square', 0.3);
  }, [playSound]);

  const playNotification = useCallback(() => {
    playSound(880, 0.1, 'sine', 0.3);
    setTimeout(() => playSound(1100, 0.15, 'sine', 0.3), 100);
  }, [playSound]);

  // Aviator-specific sounds
  const playJetEngine = useCallback(() => {
    const ctx = initAudio();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(100, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 2);
    
    gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 2);
    
    oscillator.start();
    oscillator.stop(ctx.currentTime + 2);
  }, []);

  const stopJetEngine = useCallback(() => {
    // In real implementation, we'd store and stop the oscillator
    // For now, sounds auto-stop after duration
  }, []);

  const playCrash = useCallback(() => {
    playSound(150, 0.5, 'sawtooth', 0.5);
    setTimeout(() => playSound(80, 0.3, 'square', 0.4), 100);
    setTimeout(() => playSound(50, 0.2, 'triangle', 0.3), 200);
  }, [playSound]);

  const playCashOut = useCallback(() => {
    playSound(800, 0.1, 'sine', 0.3);
    setTimeout(() => playSound(1000, 0.1, 'sine', 0.3), 50);
    setTimeout(() => playSound(1200, 0.2, 'sine', 0.4), 100);
  }, [playSound]);

  const playTakeoff = useCallback(() => {
    playSound(200, 0.3, 'sine', 0.2);
    setTimeout(() => playSound(400, 0.2, 'sine', 0.3), 100);
    setTimeout(() => playSound(600, 0.1, 'sine', 0.2), 200);
  }, [playSound]);

  const playShuffle = useCallback(() => {
    // Card shuffle sound effect
    for (let i = 0; i < 8; i++) {
      setTimeout(() => {
        playSound(400 + Math.random() * 200, 0.03, 'square', 0.1);
      }, i * 30);
    }
  }, [playSound]);

  const playGenericSound = useCallback((soundName: string) => {
    switch(soundName) {
      case 'shuffle': playShuffle(); break;
      case 'cardFlip': playCardFlip(); break;
      case 'win': playWin(); break;
      case 'lose': playLose(); break;
      case 'click': playClick(); break;
      default: break;
    }
  }, [playShuffle, playCardFlip, playWin, playLose, playClick]);

  return {
    playCardFlip,
    playChipPlace,
    playWin,
    playLose,
    playClick,
    playDiceRoll,
    playSpinWheel,
    playCountdown,
    playNotification,
    playJetEngine,
    stopJetEngine,
    playCrash,
    playCashOut,
    playTakeoff,
    playShuffle,
    playSound: playGenericSound
  };
};