import { useCallback, useRef } from 'react';

export const useRouletteSounds = () => {
  const audioContext = useRef<AudioContext | null>(null);
  const gainNode = useRef<GainNode | null>(null);

  const initAudio = useCallback(() => {
    if (!audioContext.current) {
      audioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      gainNode.current = audioContext.current.createGain();
      gainNode.current.connect(audioContext.current.destination);
      gainNode.current.gain.value = 0.5;
    }
  }, []);

  const playBallRolling = useCallback(() => {
    initAudio();
    if (!audioContext.current || !gainNode.current) return;

    const duration = 4;
    const oscillator = audioContext.current.createOscillator();
    const gainEnvelope = audioContext.current.createGain();
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(800, audioContext.current.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(200, audioContext.current.currentTime + duration);
    
    gainEnvelope.gain.setValueAtTime(0.3, audioContext.current.currentTime);
    gainEnvelope.gain.exponentialRampToValueAtTime(0.01, audioContext.current.currentTime + duration);
    
    oscillator.connect(gainEnvelope);
    gainEnvelope.connect(gainNode.current);
    
    oscillator.start();
    oscillator.stop(audioContext.current.currentTime + duration);
  }, [initAudio]);

  const playBallDrop = useCallback(() => {
    initAudio();
    if (!audioContext.current || !gainNode.current) return;

    const oscillator = audioContext.current.createOscillator();
    const gainEnvelope = audioContext.current.createGain();
    
    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(150, audioContext.current.currentTime);
    
    gainEnvelope.gain.setValueAtTime(0.4, audioContext.current.currentTime);
    gainEnvelope.gain.exponentialRampToValueAtTime(0.01, audioContext.current.currentTime + 0.2);
    
    oscillator.connect(gainEnvelope);
    gainEnvelope.connect(gainNode.current);
    
    oscillator.start();
    oscillator.stop(audioContext.current.currentTime + 0.2);
  }, [initAudio]);

  const playChipPlace = useCallback(() => {
    initAudio();
    if (!audioContext.current || !gainNode.current) return;

    const oscillator = audioContext.current.createOscillator();
    const gainEnvelope = audioContext.current.createGain();
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(600, audioContext.current.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.current.currentTime + 0.1);
    
    gainEnvelope.gain.setValueAtTime(0.2, audioContext.current.currentTime);
    gainEnvelope.gain.exponentialRampToValueAtTime(0.01, audioContext.current.currentTime + 0.1);
    
    oscillator.connect(gainEnvelope);
    gainEnvelope.connect(gainNode.current);
    
    oscillator.start();
    oscillator.stop(audioContext.current.currentTime + 0.1);
  }, [initAudio]);

  const playWin = useCallback(() => {
    initAudio();
    if (!audioContext.current || !gainNode.current) return;

    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
    
    notes.forEach((freq, i) => {
      const oscillator = audioContext.current!.createOscillator();
      const gainEnvelope = audioContext.current!.createGain();
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(freq, audioContext.current!.currentTime + i * 0.15);
      
      gainEnvelope.gain.setValueAtTime(0, audioContext.current!.currentTime + i * 0.15);
      gainEnvelope.gain.linearRampToValueAtTime(0.3, audioContext.current!.currentTime + i * 0.15 + 0.05);
      gainEnvelope.gain.exponentialRampToValueAtTime(0.01, audioContext.current!.currentTime + i * 0.15 + 0.5);
      
      oscillator.connect(gainEnvelope);
      gainEnvelope.connect(gainNode.current!);
      
      oscillator.start(audioContext.current!.currentTime + i * 0.15);
      oscillator.stop(audioContext.current!.currentTime + i * 0.15 + 0.5);
    });
  }, [initAudio]);

  const playDealerVoice = useCallback((message: string) => {
    // Using browser's speech synthesis for dealer voice
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(message);
      utterance.rate = 0.9;
      utterance.pitch = 1.0;
      utterance.volume = 0.5;
      
      // Try to use a more natural voice if available
      const voices = speechSynthesis.getVoices();
      const preferredVoice = voices.find(voice => 
        voice.lang.startsWith('en') && voice.name.includes('Female')
      ) || voices[0];
      
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }
      
      speechSynthesis.speak(utterance);
    }
  }, []);

  const setVolume = useCallback((volume: number) => {
    if (gainNode.current) {
      gainNode.current.gain.value = Math.max(0, Math.min(1, volume));
    }
  }, []);

  return {
    playBallRolling,
    playBallDrop,
    playChipPlace,
    playWin,
    playDealerVoice,
    setVolume
  };
};