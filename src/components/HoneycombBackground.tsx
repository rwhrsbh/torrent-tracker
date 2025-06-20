'use client';

import { useEffect, useRef } from 'react';

export default function HoneycombBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Функция для рисования шестиугольника (сота)
    const drawHexagon = (x: number, y: number, size: number, opacity: number) => {
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI) / 3;
        const hexX = x + size * Math.cos(angle);
        const hexY = y + size * Math.sin(angle);
        if (i === 0) {
          ctx.moveTo(hexX, hexY);
        } else {
          ctx.lineTo(hexX, hexY);
        }
      }
      ctx.closePath();
      ctx.strokeStyle = `rgba(255, 215, 0, ${opacity})`;
      ctx.lineWidth = 1;
      ctx.stroke();
    };

    // Анимация сот
    const animateHoneycomb = (timestamp: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const hexSize = 30;
      const hexWidth = hexSize * 2;
      const hexHeight = hexSize * Math.sqrt(3);

      // Создаем сетку сот
      for (let row = -2; row < canvas.height / hexHeight + 2; row++) {
        for (let col = -2; col < canvas.width / hexWidth + 2; col++) {
          const x = col * hexWidth * 0.75;
          const y = row * hexHeight + (col % 2) * hexHeight * 0.5;

          // Анимация прозрачности основанная на времени и позиции
          const wave = Math.sin(timestamp * 0.001 + (x + y) * 0.01) * 0.5 + 0.5;
          const opacity = 0.1 + wave * 0.15;

          drawHexagon(x, y, hexSize, opacity);

          // Случайные "активные" соты
          if (Math.random() < 0.001) {
            const pulseOpacity = Math.sin(timestamp * 0.01) * 0.3 + 0.4;
            drawHexagon(x, y, hexSize * 1.2, pulseOpacity);
          }
        }
      }

      requestAnimationFrame(animateHoneycomb);
    };

    requestAnimationFrame(animateHoneycomb);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: -1 }}
    />
  );
}