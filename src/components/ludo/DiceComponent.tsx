
import React from 'react';
import { useContext } from 'react';

const DiceComponent: React.FC = () => {
  const renderDiceFace = (value: number) => {
    const dots = [];
    const positions = [
      [], // 0 (not used)
      [{ x: 50, y: 50 }], // 1
      [{ x: 25, y: 25 }, { x: 75, y: 75 }], // 2
      [{ x: 25, y: 25 }, { x: 50, y: 50 }, { x: 75, y: 75 }], // 3
      [{ x: 25, y: 25 }, { x: 75, y: 25 }, { x: 25, y: 75 }, { x: 75, y: 75 }], // 4
      [{ x: 25, y: 25 }, { x: 75, y: 25 }, { x: 50, y: 50 }, { x: 25, y: 75 }, { x: 75, y: 75 }], // 5
      [{ x: 25, y: 25 }, { x: 75, y: 25 }, { x: 25, y: 50 }, { x: 75, y: 50 }, { x: 25, y: 75 }, { x: 75, y: 75 }] // 6
    ];

    if (value >= 1 && value <= 6) {
      positions[value].forEach((pos, index) => {
        dots.push(
          <circle
            key={index}
            cx={pos.x}
            cy={pos.y}
            r="6"
            fill="currentColor"
          />
        );
      });
    }

    return (
      <svg width="24" height="24" viewBox="0 0 100 100" className="text-foreground">
        <rect x="10" y="10" width="80" height="80" rx="10" fill="none" stroke="currentColor" strokeWidth="4"/>
        {dots}
      </svg>
    );
  };

  return (
    <div className="flex items-center justify-center">
      {renderDiceFace(1)}
    </div>
  );
};

export default DiceComponent;
