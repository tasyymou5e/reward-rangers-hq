import { useEffect, useState } from "react";

export function ConfettiEffect() {
  const [particles, setParticles] = useState<Array<{
    id: number;
    x: number;
    y: number;
    color: string;
    delay: number;
  }>>([]);

  useEffect(() => {
    const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'];
    const newParticles = [];
    
    for (let i = 0; i < 50; i++) {
      newParticles.push({
        id: i,
        x: Math.random() * 100,
        y: -10,
        color: colors[Math.floor(Math.random() * colors.length)],
        delay: Math.random() * 2000,
      });
    }
    
    setParticles(newParticles);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute w-3 h-3 rounded-full animate-bounce"
          style={{
            left: `${particle.x}%`,
            backgroundColor: particle.color,
            animationDelay: `${particle.delay}ms`,
            animationDuration: '3s',
            animationTimingFunction: 'ease-out',
            animationFillMode: 'forwards',
            transform: `translateY(100vh)`,
          }}
        />
      ))}
      
      {/* Sparkle effects */}
      {Array.from({ length: 20 }).map((_, i) => (
        <div
          key={`sparkle-${i}`}
          className="absolute text-2xl animate-ping"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 2000}ms`,
            animationDuration: '1s',
          }}
        >
          ✨
        </div>
      ))}
    </div>
  );
}