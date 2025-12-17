import { useRef, useCallback, useState } from 'react';

export const useLudoSounds = () => {
  const [isMuted, setIsMuted] = useState(false);
  const audioContext = useRef<AudioContext | null>(null);

  // Initialize audio context
  const initAudio = useCallback(() => {
    if (!audioContext.current) {
      audioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }, []);

  // Generate tone for different game events
  const playTone = useCallback((frequency: number, duration: number, type: OscillatorType = 'sine') => {
    if (isMuted) return;
    
    initAudio();
    if (!audioContext.current) return;

    const oscillator = audioContext.current.createOscillator();
    const gainNode = audioContext.current.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.current.destination);

    oscillator.frequency.setValueAtTime(frequency, audioContext.current.currentTime);
    oscillator.type = type;

    gainNode.gain.setValueAtTime(0.3, audioContext.current.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.current.currentTime + duration);

    oscillator.start(audioContext.current.currentTime);
    oscillator.stop(audioContext.current.currentTime + duration);
  }, [isMuted, initAudio]);

  const playDiceRoll = useCallback(() => {
    if (isMuted) return;
    
    // Simulate dice rolling sound with multiple tones
    setTimeout(() => playTone(300, 0.1, 'square'), 0);
    setTimeout(() => playTone(320, 0.1, 'square'), 100);
    setTimeout(() => playTone(340, 0.1, 'square'), 200);
    setTimeout(() => playTone(360, 0.1, 'square'), 300);
    setTimeout(() => playTone(400, 0.2, 'triangle'), 400);
  }, [isMuted, playTone]);

  const playTokenMove = useCallback(() => {
    if (isMuted) return;
    
    // Pop sound for token movement
    playTone(600, 0.15, 'sine');
    setTimeout(() => playTone(550, 0.1, 'sine'), 50);
  }, [isMuted, playTone]);

  const playTokenCapture = useCallback(() => {
    if (isMuted) return;
    
    // Capture sound - descending tones
    playTone(800, 0.1, 'triangle');
    setTimeout(() => playTone(600, 0.1, 'triangle'), 100);
    setTimeout(() => playTone(400, 0.2, 'triangle'), 200);
  }, [isMuted, playTone]);

  const playWin = useCallback(() => {
    if (isMuted) return;
    
    // Victory fanfare
    const notes = [523, 659, 784, 1047]; // C, E, G, C (major chord)
    notes.forEach((note, index) => {
      setTimeout(() => playTone(note, 0.5, 'sine'), index * 100);
    });
    
    // Add some sparkle
    setTimeout(() => {
      for (let i = 0; i < 5; i++) {
        setTimeout(() => playTone(1200 + i * 100, 0.1, 'triangle'), i * 50);
      }
    }, 500);
  }, [isMuted, playTone]);

  const playTurnChange = useCallback(() => {
    if (isMuted) return;
    
    // Gentle notification for turn change
    playTone(440, 0.2, 'sine');
    setTimeout(() => playTone(523, 0.15, 'sine'), 100);
  }, [isMuted, playTone]);

  const playError = useCallback(() => {
    if (isMuted) return;
    
    // Error/invalid move sound
    playTone(200, 0.3, 'sawtooth');
  }, [isMuted, playTone]);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => !prev);
  }, []);

  return {
    isMuted,
    toggleMute,
    playDiceRoll,
    playTokenMove,
    playTokenCapture,
    playWin,
    playTurnChange,
    playError,
  };
};