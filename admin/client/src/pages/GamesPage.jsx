import React, { useState, useEffect } from 'react';
import { Gamepad2, ArrowRight, Eye, Trophy, Users, Clock } from 'lucide-react';
import { api } from '../api';
import Button from '../components/Button';
import Modal from '../components/Modal';
import Badge from '../components/Badge';
import AvatarSvg from '../components/AvatarSvg';
import LoadingState from '../components/LoadingState';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';

export default function GamesPage() {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Selected game detail state
  const [selectedGameId, setSelectedGameId] = useState(null);
  const [gameDetail, setGameDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchGames = async () => {
    try {
      const data = await api.getGames();
      setGames(data);
      setError(null);
    } catch (err) {
      if (games.length === 0) {
        setError(err.message || 'Failed to load games');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchDetail = async (id) => {
    try {
      setDetailLoading(true);
      const detail = await api.getGameDetails(id);
      setGameDetail(detail);
    } catch (err) {
      alert(err.message || 'Failed to load game details');
    } finally {
      setDetailLoading(false);
    }
  };

  // Poll games list every 1000ms as per game rules
  useEffect(() => {
    fetchGames();
    const interval = setInterval(() => {
      fetchGames();
      if (selectedGameId) {
        // Also refresh detail if modal open
        api.getGameDetails(selectedGameId).then((res) => setGameDetail(res)).catch(() => {});
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [selectedGameId]);

  const handleOpenDetail = (id) => {
    setSelectedGameId(id);
    fetchDetail(id);
  };

  const handleCloseDetail = () => {
    setSelectedGameId(null);
    setGameDetail(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-250">
      <div>
        <h1 className="text-large-title text-label">Games</h1>
        <p className="text-subheadline text-label-2 mt-1">
          Monitor all active and completed classroom game sessions in real time
        </p>
      </div>

      {loading && games.length === 0 ? (
        <LoadingState message="Loading games" />
      ) : error && games.length === 0 ? (
        <ErrorState title="Game history error" message={error} onRetry={fetchGames} />
      ) : games.length === 0 ? (
        <EmptyState
          icon={Gamepad2}
          title="No games found"
          description="Teachers have not initiated any game lobbies yet."
        />
      ) : (
        <div className="content-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-separator/40 text-footnote text-label-2 bg-surface-2/40">
                  <th className="py-3 px-4 font-medium">Session PIN</th>
                  <th className="py-3 px-4 font-medium">Type</th>
                  <th className="py-3 px-4 font-medium">Status</th>
                  <th className="py-3 px-4 font-medium">Host</th>
                  <th className="py-3 px-4 font-medium text-center">Players</th>
                  <th className="py-3 px-4 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-separator/20">
                {games.map((g) => (
                  <tr key={g._id} className="h-11 hover:bg-white/[0.02] transition-colors">
                    <td className="py-2 px-4 text-subheadline font-rounded-num text-accent font-semibold tracking-wider">
                      {g.pin}
                    </td>
                    <td className="py-2 px-4 text-subheadline capitalize font-medium text-label">
                      {g.type}
                    </td>
                    <td className="py-2 px-4 text-subheadline">
                      <Badge
                        variant={
                          g.status === 'live' || g.status === 'question'
                            ? 'green'
                            : g.status === 'lobby'
                            ? 'blue'
                            : 'neutral'
                        }
                      >
                        {g.status}
                      </Badge>
                    </td>
                    <td className="py-2 px-4 text-subheadline text-label-2">{g.hostName}</td>
                    <td className="py-2 px-4 text-subheadline font-rounded-num text-center text-label">
                      {g.playerCount}
                    </td>
                    <td className="py-2 px-4 text-right">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleOpenDetail(g._id)}
                        className="gap-1.5"
                      >
                        <Eye size={14} strokeWidth={1.75} />
                        <span>Scores</span>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Game Details & Scores Modal */}
      <Modal
        isOpen={Boolean(selectedGameId)}
        onClose={handleCloseDetail}
        title={`Session PIN ${gameDetail?.game?.pin || ''}`}
        maxWidth="max-w-2xl"
        footer={
          <div className="flex justify-end">
            <Button variant="secondary" onClick={handleCloseDetail}>
              Close
            </Button>
          </div>
        }
      >
        {detailLoading && !gameDetail ? (
          <LoadingState message="Loading player leaderboard" />
        ) : gameDetail ? (
          <div className="space-y-6">
            {/* Game Info Bar */}
            <div className="p-4 rounded-field bg-surface-2/60 border border-separator/40 grid grid-cols-2 sm:grid-cols-4 gap-3 text-subheadline">
              <div>
                <span className="text-footnote text-label-3 block">Type</span>
                <span className="font-medium capitalize text-label">{gameDetail.game.type}</span>
              </div>
              <div>
                <span className="text-footnote text-label-3 block">Status</span>
                <Badge
                  variant={
                    gameDetail.game.status === 'live' || gameDetail.game.status === 'question'
                      ? 'green'
                      : 'neutral'
                  }
                >
                  {gameDetail.game.status}
                </Badge>
              </div>
              <div>
                <span className="text-footnote text-label-3 block">Host</span>
                <span className="font-medium text-label">{gameDetail.game.hostName}</span>
              </div>
              <div>
                <span className="text-footnote text-label-3 block">Content</span>
                <span className="font-medium text-label truncate block">
                  {gameDetail.game.refTitle || 'Untitled'}
                </span>
              </div>
            </div>

            {/* Players Leaderboard */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Trophy size={18} strokeWidth={1.75} className="text-yellow" />
                  <h3 className="text-headline text-label font-semibold">Player leaderboard</h3>
                </div>
                <span className="text-footnote text-label-2 font-rounded-num">
                  {gameDetail.players?.length || 0} players joined
                </span>
              </div>

              {!gameDetail.players || gameDetail.players.length === 0 ? (
                <div className="p-8 text-center bg-surface-2/30 rounded-field border border-separator/30 text-label-2 text-subheadline">
                  No students have joined this game yet.
                </div>
              ) : (
                <div className="overflow-hidden rounded-field border border-separator/40 bg-surface">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-separator/30 text-footnote text-label-3 bg-surface-2/50">
                        <th className="py-2.5 px-4 font-medium w-12 text-center">Rank</th>
                        <th className="py-2.5 px-4 font-medium">Player</th>
                        <th className="py-2.5 px-4 font-medium text-center">Status</th>
                        <th className="py-2.5 px-4 font-medium text-right">Score</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-separator/20">
                      {gameDetail.players.map((p, idx) => (
                        <tr key={p._id} className="h-11 hover:bg-white/[0.02]">
                          <td className="py-2 px-4 text-center text-subheadline font-rounded-num font-semibold text-label-2">
                            {idx + 1}
                          </td>
                          <td className="py-2 px-4 text-subheadline font-medium text-label">
                            <div className="flex items-center gap-2.5">
                              {p.avatarId ? (
                                <AvatarSvg
                                  shape={p.avatarId.shape}
                                  color={p.avatarId.color}
                                  accentColor={p.avatarId.accentColor}
                                  size={24}
                                />
                              ) : (
                                <div className="w-6 h-6 rounded-full bg-surface-2" />
                              )}
                              <span>{p.nickname}</span>
                            </div>
                          </td>
                          <td className="py-2 px-4 text-center">
                            <Badge
                              variant={
                                p.status === 'active'
                                  ? 'active'
                                  : p.status === 'muted'
                                  ? 'yellow'
                                  : 'red'
                              }
                            >
                              {p.status}
                            </Badge>
                          </td>
                          <td className="py-2 px-4 text-right text-headline font-rounded-num font-bold text-accent">
                            {p.score}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
