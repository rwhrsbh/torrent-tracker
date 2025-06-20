'use client';

import { useEffect, useState, useRef } from 'react';

interface Bee {
  id: number;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  angle: number;
  speed: number;
  size: number;
  delay: number;
}

export default function BeeSwarm() {
  const [bees, setBees] = useState<Bee[]>([]);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const animationRef = useRef<number>();

  // Инициализация роя пчел
  useEffect(() => {
    const initialBees: Bee[] = [];
    for (let i = 0; i < 12; i++) {
      initialBees.push({
        id: i,
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        targetX: 0,
        targetY: 0,
        angle: Math.random() * Math.PI * 2,
        speed: 0.02 + Math.random() * 0.03,
        size: 0.8 + Math.random() * 0.4,
        delay: i * 100 + Math.random() * 200,
      });
    }
    setBees(initialBees);
  }, []);

  // Отслеживание движения мыши
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Анимация пчел
  useEffect(() => {
    const animateBees = () => {
      setBees(prevBees => 
        prevBees.map((bee, index) => {
          // Вычисляем целевую позицию с offset для роя
          const swarmRadius = 50;
          const angleOffset = (index / prevBees.length) * Math.PI * 2;
          const targetX = mousePos.x + Math.cos(angleOffset) * swarmRadius + Math.sin(Date.now() * 0.001 + index) * 20;
          const targetY = mousePos.y + Math.sin(angleOffset) * swarmRadius + Math.cos(Date.now() * 0.001 + index) * 20;

          // Плавное движение к цели с задержкой
          const dx = targetX - bee.x;
          const dy = targetY - bee.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          // Пчелы летят медленнее когда близко к цели
          const adjustedSpeed = bee.speed * Math.min(1, distance / 100);
          
          const newX = bee.x + dx * adjustedSpeed;
          const newY = bee.y + dy * adjustedSpeed;

          // Угол поворота пчелы
          const newAngle = Math.atan2(dy, dx);

          return {
            ...bee,
            x: newX,
            y: newY,
            angle: newAngle,
            targetX,
            targetY,
          };
        })
      );

      animationRef.current = requestAnimationFrame(animateBees);
    };

    if (bees.length > 0) {
      animationRef.current = requestAnimationFrame(animateBees);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [mousePos, bees.length]);

  return (
    <div className="fixed inset-0 pointer-events-none z-50" style={{ zIndex: 9999 }}>
      {bees.map((bee) => (
        <div
          key={bee.id}
          className="absolute transition-opacity duration-500"
          style={{
            left: bee.x - 8,
            top: bee.y - 6,
            transform: `rotate(${bee.angle}rad) scale(${bee.size})`,
            opacity: mousePos.x > 0 ? 0.8 : 0,
          }}
        >
          <div className="bee-sprite">
            🐝
          </div>
        </div>
      ))}
      
      <style jsx>{`
        .bee-sprite {
          font-size: 16px;
          filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
          animation: bee-flutter 0.3s ease-in-out infinite alternate;
        }
        
        @keyframes bee-flutter {
          0% { transform: translateY(0px) rotate(-2deg); }
          100% { transform: translateY(-1px) rotate(2deg); }
        }
        
        .bee-sprite:hover {
          animation: bee-buzz 0.1s ease-in-out infinite;
        }
        
        @keyframes bee-buzz {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-0.5px); }
          75% { transform: translateX(0.5px); }
        }
      `}</style>
    </div>
  );
}