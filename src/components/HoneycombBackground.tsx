'use client';

export default function HoneycombBackground() {
  return (
    <div 
      className="fixed inset-0 pointer-events-none opacity-20"
      style={{ 
        zIndex: -1,
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        backgroundImage: `
          linear-gradient(60deg, rgba(255, 215, 0, 0.1) 25%, transparent 25%, transparent 75%, rgba(255, 215, 0, 0.1) 75%), 
          linear-gradient(120deg, rgba(255, 215, 0, 0.1) 25%, transparent 25%, transparent 75%, rgba(255, 215, 0, 0.1) 75%)
        `,
        backgroundSize: '60px 60px, 60px 60px',
        backgroundPosition: '0 0, 30px 30px'
      }}
    />
  );
}