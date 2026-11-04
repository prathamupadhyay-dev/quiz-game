import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

export default function QRCodeModal({ isOpen, onClose, roomPin, joinUrl }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white text-xl p-2"
        >
          ✕
        </button>
        <h3 className="text-xl font-bold text-white mb-2">Scan to Join Room</h3>
        <p className="text-sm text-slate-400 mb-6">Point your phone camera to join instantly</p>
        
        <div className="bg-white p-4 rounded-2xl inline-block shadow-inner mb-6">
          <QRCodeSVG value={joinUrl} size={220} level="H" />
        </div>

        <div className="bg-slate-800 p-3 rounded-xl border border-slate-700 mb-4">
          <span className="text-xs text-slate-400 block mb-1">Room PIN</span>
          <span className="text-3xl font-mono font-extrabold text-amber-400 tracking-widest">
            {roomPin}
          </span>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-semibold text-white transition"
        >
          Close
        </button>
      </div>
    </div>
  );
}
