import { useRef, useCallback, useEffect } from 'react';

interface AviatorSoundsReturn {
  playJetEngine: () => void;
  stopJetEngine: () => void;
  playCrash: () => void;
  playCashOut: () => void;
  playTakeoff: () => void;
  playCountdown: () => void;
  playFlyingLoop: () => void;
  stopFlyingLoop: () => void;
}

export const useAviatorSounds = (): AviatorSoundsReturn => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const engineOscillatorRef = useRef<OscillatorNode | null>(null);
  const engineGainRef = useRef<GainNode | null>(null);
  const windOscillatorRef = useRef<OscillatorNode | null>(null);
  const windGainRef = useRef<GainNode | null>(null);
  const noiseSourceRef = useRef<AudioBufferSourceNode | null>(null);

  const initAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  // Create white noise buffer for jet engine sound
  const createNoiseBuffer = useCallback((duration: number = 2): AudioBuffer => {
    const ctx = initAudioContext();
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    
    return buffer;
  }, [initAudioContext]);

  // Smooth jet engine sound with white noise and filter
  const playJetEngine = useCallback(() => {
    try {
      const ctx = initAudioContext();
      
      // Create white noise source
      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = createNoiseBuffer(2);
      noiseSource.loop = false;
      
      // Bandpass filter for turbine frequency range
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 400;
      filter.Q.value = 1.5;
      
      // Gain node for volume control
      const gainNode = ctx.createGain();
      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.15, ctx.currentTime + 0.5);
      gainNode.gain.exponentialRampToValueAtTime(0.08, ctx.currentTime + 2);
      
      // Connect nodes
      noiseSource.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      // Start and schedule stop
      noiseSource.start(ctx.currentTime);
      noiseSource.stop(ctx.currentTime + 2);
      
      noiseSourceRef.current = noiseSource;
    } catch (error) {
      console.error('Error playing jet engine sound:', error);
    }
  }, [initAudioContext, createNoiseBuffer]);

  const stopJetEngine = useCallback(() => {
    try {
      if (noiseSourceRef.current) {
        const ctx = audioContextRef.current;
        if (ctx) {
          noiseSourceRef.current.stop();
          noiseSourceRef.current = null;
        }
      }
    } catch (error) {
      // Already stopped
    }
  }, []);

  // Smooth takeoff sound
  const playTakeoff = useCallback(() => {
    try {
      const ctx = initAudioContext();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(150, ctx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 1.5);
      
      gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.3);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.5);
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 1.5);
    } catch (error) {
      console.error('Error playing takeoff sound:', error);
    }
  }, [initAudioContext]);

  // Flying loop with smooth engine hum
  const playFlyingLoop = useCallback(() => {
    try {
      stopFlyingLoop();
      
      const ctx = initAudioContext();
      
      // Engine hum
      const engineOsc = ctx.createOscillator();
      const engineGain = ctx.createGain();
      
      engineOsc.type = 'sine';
      engineOsc.frequency.value = 120;
      
      engineGain.gain.setValueAtTime(0, ctx.currentTime);
      engineGain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.5);
      
      engineOsc.connect(engineGain);
      engineGain.connect(ctx.destination);
      
      engineOsc.start();
      
      engineOscillatorRef.current = engineOsc;
      engineGainRef.current = engineGain;
      
      // Wind ambience
      const windOsc = ctx.createOscillator();
      const windGain = ctx.createGain();
      
      windOsc.type = 'sine';
      windOsc.frequency.value = 80;
      
      windGain.gain.setValueAtTime(0, ctx.currentTime);
      windGain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.8);
      
      windOsc.connect(windGain);
      windGain.connect(ctx.destination);
      
      windOsc.start();
      
      windOscillatorRef.current = windOsc;
      windGainRef.current = windGain;
    } catch (error) {
      console.error('Error playing flying loop:', error);
    }
  }, [initAudioContext]);

  const stopFlyingLoop = useCallback(() => {
    try {
      const ctx = audioContextRef.current;
      if (!ctx) return;
      
      if (engineGainRef.current) {
        engineGainRef.current.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.5);
      }
      
      if (windGainRef.current) {
        windGainRef.current.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.5);
      }
      
      setTimeout(() => {
        try {
          if (engineOscillatorRef.current) {
            engineOscillatorRef.current.stop();
            engineOscillatorRef.current = null;
          }
          if (windOscillatorRef.current) {
            windOscillatorRef.current.stop();
            windOscillatorRef.current = null;
          }
        } catch (error) {
          // Already stopped
        }
      }, 500);
    } catch (error) {
      console.error('Error stopping flying loop:', error);
    }
  }, []);

  // Smooth crash sound
  const playCrash = useCallback(() => {
    try {
      const ctx = initAudioContext();
      
      // Deep bass drop
      const bassOsc = ctx.createOscillator();
      const bassGain = ctx.createGain();
      
      bassOsc.type = 'sine';
      bassOsc.frequency.setValueAtTime(400, ctx.currentTime);
      bassOsc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.6);
      
      bassGain.gain.setValueAtTime(0.25, ctx.currentTime);
      bassGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);
      
      bassOsc.connect(bassGain);
      bassGain.connect(ctx.destination);
      
      bassOsc.start();
      bassOsc.stop(ctx.currentTime + 0.8);
      
      // Explosion burst
      setTimeout(() => {
        const burstOsc = ctx.createOscillator();
        const burstGain = ctx.createGain();
        
        burstOsc.type = 'sawtooth';
        burstOsc.frequency.value = 100;
        
        burstGain.gain.setValueAtTime(0.15, ctx.currentTime);
        burstGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        
        burstOsc.connect(burstGain);
        burstGain.connect(ctx.destination);
        
        burstOsc.start();
        burstOsc.stop(ctx.currentTime + 0.3);
      }, 100);
    } catch (error) {
      console.error('Error playing crash sound:', error);
    }
  }, [initAudioContext]);

  // Pleasant cash out sound
  const playCashOut = useCallback(() => {
    try {
      const ctx = initAudioContext();
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C-E-G-C major chord
      
      notes.forEach((freq, i) => {
        setTimeout(() => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          
          osc.type = 'sine';
          osc.frequency.value = freq;
          
          gain.gain.setValueAtTime(0.15, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
          
          osc.connect(gain);
          gain.connect(ctx.destination);
          
          osc.start();
          osc.stop(ctx.currentTime + 0.4);
        }, i * 80);
      });
    } catch (error) {
      console.error('Error playing cash out sound:', error);
    }
  }, [initAudioContext]);

  // Gentle countdown beep
  const playCountdown = useCallback(() => {
    try {
      const ctx = initAudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.value = 600;
      
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } catch (error) {
      console.error('Error playing countdown sound:', error);
    }
  }, [initAudioContext]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopFlyingLoop();
      stopJetEngine();
    };
  }, [stopFlyingLoop, stopJetEngine]);

  return {
    playJetEngine,
    stopJetEngine,
    playCrash,
    playCashOut,
    playTakeoff,
    playCountdown,
    playFlyingLoop,
    stopFlyingLoop,
  };
};
