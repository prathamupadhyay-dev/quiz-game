import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import Squares from './reactbits/Squares';
import PortalSwitcher from './PortalSwitcher';

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col relative overflow-x-hidden select-none">
      {/* Universal Top Role-Based Portal Switcher */}
      <PortalSwitcher current="admin" />

      {/* React Bits: Squares Interactive Drift Grid */}
      <Squares
        direction="diagonal"
        speed={0.3}
        squareSize={48}
        borderColor="rgba(255, 255, 255, 0.03)"
        hoverFillColor="rgba(94, 92, 230, 0.15)"
      />

      {/* Ambient Top Spotlight */}
      <div className="absolute top-0 left-1/3 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[160px] pointer-events-none z-1" />

      <Navbar onToggleSidebar={() => setSidebarOpen((prev) => !prev)} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      {/* Main Content Area */}
      <main className="relative z-10 flex-1 min-[900px]:ml-[260px] pt-[56px] transition-all duration-250 ease-ios">
        <div className="max-w-[1200px] p-6 mx-auto w-full">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
