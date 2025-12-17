import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Sparkles, TrendingUp, Users, Trophy } from 'lucide-react';

interface AnimatedGameCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  poster?: string;
  path: string;
  gradient: string;
  players?: number;
  prize?: string;
  trending?: boolean;
}

const AnimatedGameCard: React.FC<AnimatedGameCardProps> = ({
  title,
  description,
  icon,
  poster,
  path,
  gradient,
  players = Math.floor(Math.random() * 500) + 100,
  prize,
  trending = false
}) => {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div 
      className="relative perspective-1000"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Glow effect */}
      {isHovered && (
        <div className={`absolute inset-0 bg-gradient-to-r ${gradient} opacity-30 blur-xl rounded-2xl transition-opacity duration-500`} />
      )}
      
      {/* Trending badge */}
      {trending && (
        <div className="absolute -top-2 -right-2 z-10">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full animate-pulse" />
            <div className="relative bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              HOT
            </div>
          </div>
        </div>
      )}

      <Card className={`
        relative overflow-hidden border-0
        bg-gradient-to-br from-card/80 via-card/60 to-card/40
        backdrop-blur-xl
        transition-all duration-500 ease-out
        ${isHovered ? 'transform -translate-y-2 rotate-y-5 scale-105' : ''}
        shadow-game-card hover:shadow-game-neon
        group
      `}>
        {/* Animated background */}
        <div className={`
          absolute inset-0 opacity-20
          bg-gradient-to-br ${gradient}
          transition-opacity duration-500
          ${isHovered ? 'opacity-40' : ''}
        `} />
        
        {/* Floating particles */}
        {isHovered && (
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 bg-white rounded-full animate-float"
                style={{
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${i * 0.2}s`,
                  animationDuration: `${2 + Math.random() * 2}s`
                }}
              />
            ))}
          </div>
        )}

        <CardHeader className="relative p-0">
          {/* Poster Image */}
          {poster ? (
            <div className="relative w-full h-48 overflow-hidden rounded-t-lg">
              <img 
                src={poster} 
                alt={title}
                className={`
                  w-full h-full object-cover
                  transform transition-all duration-500
                  ${isHovered ? 'scale-110' : 'scale-100'}
                `}
              />
              {/* Gradient overlay */}
              <div className={`
                absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent
                opacity-70
              `} />
            </div>
          ) : (
            <>
              {/* Fallback Icon Container */}
              <div className="relative mx-auto mb-4 pt-6">
                <div className={`
                  w-20 h-20 mx-auto rounded-2xl
                  bg-gradient-to-br ${gradient}
                  flex items-center justify-center
                  transform transition-all duration-500
                  ${isHovered ? 'rotate-12 scale-110' : ''}
                  shadow-lg
                `}>
                  <div className="text-3xl transform transition-transform duration-500 group-hover:scale-125">
                    {icon}
                  </div>
                </div>
                
                {/* Icon glow */}
                {isHovered && (
                  <div className={`
                    absolute inset-0 rounded-2xl
                    bg-gradient-to-br ${gradient}
                    blur-2xl opacity-50
                    animate-pulse
                  `} />
                )}
              </div>

              <CardTitle className="text-xl font-bold text-white relative text-center pb-2">
                <span className={isHovered ? 'neon-text' : ''}>{title}</span>
              </CardTitle>
            </>
          )}
        </CardHeader>

        <CardContent className="relative text-center space-y-4 pt-4">
          {!poster && (
            <p className="text-muted-foreground text-sm">
              {description}
            </p>
          )}

          {/* Stats */}
          <div className="flex justify-around text-xs">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Users className="w-3 h-3" />
              <span>{players} playing</span>
            </div>
            {prize && (
              <div className="flex items-center gap-1 text-yellow-500">
                <Trophy className="w-3 h-3" />
                <span>{prize}</span>
              </div>
            )}
          </div>

          <Button 
            onClick={() => navigate(path)}
            className={`
              w-full relative overflow-hidden
              bg-gradient-to-r ${gradient}
              hover:opacity-90 text-white font-bold
              transform transition-all duration-300
              hover:scale-105 active:scale-95
              group
            `}
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              Play Now
              <Sparkles className="w-4 h-4 animate-pulse" />
            </span>
            
            {/* Button shimmer effect */}
            <div className="absolute inset-0 -top-2 -bottom-2 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnimatedGameCard;