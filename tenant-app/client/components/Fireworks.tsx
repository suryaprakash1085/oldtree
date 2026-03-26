import { useEffect, useState } from 'react';
import './Fireworks.css';

interface Firework {
  id: string;
  left: number;
  top: number;
}

const COLORS = ['#FF1744', '#F50057', '#D500F9', '#651FFF', '#2979F3', '#00BCD4', '#00E676', '#FFC400', '#FF9100', '#FF3D00'];

export default function Fireworks() {
  const [fireworks, setFireworks] = useState<Firework[]>([]);

  useEffect(() => {
    const addFirework = () => {
      const newFirework = {
        id: `firework-${Date.now()}-${Math.random()}`,
        left: Math.random() * 80 + 10, // 10% to 90% of screen width
        top: Math.random() * 40 + 20, // 20% to 60% of screen height
      };

      setFireworks(prev => [...prev, newFirework]);

      // Remove firework after animation completes (4s)
      setTimeout(() => {
        setFireworks(prev => prev.filter(f => f.id !== newFirework.id));
      }, 4000);
    };

    // Add new firework every 2 seconds (slower)
    const interval = setInterval(addFirework, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fireworks-container">
      {fireworks.map((firework, idx) => (
        <div
          key={firework.id}
          className="firework-burst"
          style={{
            left: `${firework.left}%`,
            top: `${firework.top}%`,
          }}
        >
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="firework-particle"
              style={{
                backgroundColor: COLORS[i % COLORS.length],
                animation: `burst 3.5s ease-out forwards`,
                animationDelay: '0s',
                '--angle': `${(i / 12) * 360}deg`,
              } as React.CSSProperties & { '--angle': string }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
