import React from 'react';

interface GameBackgroundProps {
  variant?: 'casino' | 'space' | 'neon' | 'cards' | 'dice';
  children: React.ReactNode;
}

const GameBackground: React.FC<GameBackgroundProps> = ({ variant = 'casino', children }) => {
  const getBackgroundClass = () => {
    switch (variant) {
      case 'casino':
        return 'bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900';
      case 'space':
        return 'bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900';
      case 'neon':
        return 'bg-gradient-to-br from-pink-900 via-purple-900 to-blue-900';
      case 'cards':
        return 'bg-gradient-to-br from-red-900 via-gray-900 to-black';
      case 'dice':
        return 'bg-gradient-to-br from-green-900 via-emerald-800 to-teal-900';
      default:
        return 'bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900';
    }
  };

  return (
    <div className={`min-h-screen relative overflow-hidden ${getBackgroundClass()}`}>
      {/* Animated gradient orbs */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000" />
      </div>

      {/* Pattern overlay */}
      <div className="absolute inset-0 opacity-5">
        {variant === 'cards' && (
          <div className="h-full w-full" style={{
            backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(255,255,255,.1) 35px, rgba(255,255,255,.1) 70px)`,
          }} />
        )}
        {variant === 'dice' && (
          <div className="h-full w-full" style={{
            backgroundImage: `radial-gradient(circle at 20% 50%, transparent 20%, rgba(255,255,255,.05) 21%, rgba(255,255,255,.05) 34%, transparent 35%, transparent),
                            radial-gradient(circle at 75% 75%, transparent 20%, rgba(255,255,255,.05) 21%, rgba(255,255,255,.05) 34%, transparent 35%, transparent)`,
            backgroundSize: '75px 50px',
          }} />
        )}
      </div>

      {/* Floating shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-white/10 rounded-full floating"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${10 + Math.random() * 20}s`,
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>

      <style>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
};

export default GameBackground;