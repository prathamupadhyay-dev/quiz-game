import React from 'react';

export default function DanmakuOverlay({ messages = [] }) {
  if (!messages || messages.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden z-40">
      {messages.map((item, idx) => (
        <div
          key={item.id || idx}
          className="absolute whitespace-nowrap text-lg font-bold px-3 py-1 rounded-full shadow-lg transition-transform"
          style={{
            top: `${(idx * 40) % (window.innerHeight - 100) + 20}px`,
            right: 0,
            color: item.color || '#fff',
            backgroundColor: 'rgba(0, 0, 0, 0.4)'
          }}
        >
          {item.text}
        </div>
      ))}
    </div>
  );
}
