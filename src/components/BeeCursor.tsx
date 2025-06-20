'use client';

import { useEffect } from 'react';

export default function BeeCursor() {
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      * {
        cursor: none !important;
      }
      
      .bee-cursor {
        position: fixed;
        top: 0;
        left: 0;
        width: 32px;
        height: 32px;
        background: none;
        pointer-events: none;
        z-index: 10000;
        transition: transform 0.1s ease;
        font-size: 24px;
        transform: translate(-50%, -50%);
      }
      
      .bee-cursor.clicking {
        transform: translate(-50%, -50%) scale(1.5) rotate(15deg);
      }
      
      .bee-cursor.hovering {
        transform: translate(-50%, -50%) scale(1.2);
        animation: bee-hover 0.3s ease-in-out infinite alternate;
      }
      
      @keyframes bee-hover {
        0% { transform: translate(-50%, -50%) scale(1.2) rotate(-5deg); }
        100% { transform: translate(-50%, -50%) scale(1.2) rotate(5deg); }
      }
    `;
    document.head.appendChild(style);

    const cursor = document.createElement('div');
    cursor.className = 'bee-cursor';
    cursor.innerHTML = '🐝';
    document.body.appendChild(cursor);

    const updateCursor = (e: MouseEvent) => {
      cursor.style.left = e.clientX + 'px';
      cursor.style.top = e.clientY + 'px';
    };

    const handleMouseDown = () => {
      cursor.classList.add('clicking');
    };

    const handleMouseUp = () => {
      cursor.classList.remove('clicking');
    };

    const handleMouseEnter = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'BUTTON' || target.tagName === 'A' || target.closest('button') || target.closest('a')) {
        cursor.classList.add('hovering');
      }
    };

    const handleMouseLeave = () => {
      cursor.classList.remove('hovering');
    };

    document.addEventListener('mousemove', updateCursor);
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mouseover', handleMouseEnter);
    document.addEventListener('mouseout', handleMouseLeave);

    return () => {
      document.removeEventListener('mousemove', updateCursor);
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mouseover', handleMouseEnter);
      document.removeEventListener('mouseout', handleMouseLeave);
      document.head.removeChild(style);
      document.body.removeChild(cursor);
    };
  }, []);

  return null;
}