import React from 'react';

export function ConfettiEffect() {
  const pieces = Array.from({ length: 42 }).map((_, i) => {
    const colors = ['#34c759', '#0071e3', '#ff9500', '#af52de', '#ff2d55', '#ffcc00'];
    const color = colors[i % colors.length];
    const left = (i * 2.4 + Math.random() * 3) % 98;
    const delay = (i % 6) * 0.12;
    const size = 6 + (i % 5) * 1.5;
    return { id: i, color, left, delay, size };
  });

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
      {pieces.map((p) => (
        <div
          key={p.id}
          className="confetti-particle"
          style={{
            left: `${p.left}%`,
            backgroundColor: p.color,
            width: `${p.size}px`,
            height: `${p.size * 1.25}px`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
    </div>
  );
}
