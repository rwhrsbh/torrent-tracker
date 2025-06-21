'use client';

export default function BeehiveBackground() {
  return (
    <div className="beehive-background">
      <style jsx>{`
        .beehive-background {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: -1;
          overflow: hidden;
          pointer-events: none;
        }
        
        .beehive-video {
          width: 100%;
          height: 100%;
          object-fit: cover;
          opacity: 0.4;
          filter: brightness(0.7) contrast(1.2) saturate(0.8);
        }
        
        .beehive-gif {
          width: 100%;
          height: 100%;
          object-fit: cover;
          opacity: 0.4;
          filter: brightness(0.7) contrast(1.2) saturate(0.8);
        }
        
        .beehive-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(
            45deg,
            rgba(0, 0, 0, 0.3) 0%,
            rgba(0, 0, 0, 0.2) 50%,
            rgba(0, 0, 0, 0.3) 100%
          );
        }
      `}</style>
      
      {/* Пытаемся сначала видео, потом fallback на GIF */}
      <video 
        src="/beehive.mp4"
        className="beehive-video"
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        onError={(e) => {
          console.log('Video failed to load, trying GIF fallback');
          // Если видео не загрузилось, скрываем его и показываем GIF
          e.currentTarget.style.display = 'none';
          const gif = e.currentTarget.nextElementSibling as HTMLImageElement;
          if (gif) gif.style.display = 'block';
        }}
      />
      
      <img 
        src="/beehive.gif" 
        alt="Beehive background"
        className="beehive-gif"
        style={{ display: 'none' }}
        onLoad={() => console.log('GIF loaded successfully')}
        onError={() => console.log('GIF failed to load')}
      />
      
      <div className="beehive-overlay"></div>
    </div>
  );
}