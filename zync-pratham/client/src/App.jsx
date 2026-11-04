import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import HostLobby from './pages/HostLobby';
import PlayerLobby from './pages/PlayerLobby';
import HostQuizView from './pages/HostQuizView';
import PlayerQuizPad from './pages/PlayerQuizPad';
import HostPresenterView from './pages/HostPresenterView';
import PlayerPresenterView from './pages/PlayerPresenterView';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/host/:roomPin" element={<HostLobby />} />
        <Route path="/player/:roomPin" element={<PlayerLobby />} />
        <Route path="/host/quiz/:roomPin" element={<HostQuizView />} />
        <Route path="/player/quiz/:roomPin" element={<PlayerQuizPad />} />
        <Route path="/host/presenter/:roomPin" element={<HostPresenterView />} />
        <Route path="/player/presenter/:roomPin" element={<PlayerPresenterView />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
