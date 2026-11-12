import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  HelpCircle,
  Presentation,
  Gamepad2,
  UserCheck,
  Shield,
  GraduationCap,
  Sparkles,
  ArrowRight,
  Clock
} from 'lucide-react';
import { api } from '../api';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import Badge from '../components/Badge';

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboard = async () => {
    try {
      const res = await api.getDashboard();
      setData(res);
      setError(null);
    } catch (err) {
      if (!data) {
        setError(err.message || 'Failed to retrieve dashboard metrics');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
    // Live polling every 1000ms
    const interval = setInterval(fetchDashboard, 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !data) {
    return <LoadingState message="Loading dashboard statistics" />;
  }

  if (error && !data) {
    return <ErrorState title="Dashboard error" message={error} onRetry={fetchDashboard} />;
  }

  const { counts, latestGames = [] } = data || {};
  const userRoles = counts?.usersByRole || {};

  return (
    <div className="space-y-8 animate-in fade-in duration-250">
      {/* Header */}
      <div>
        <h1 className="text-large-title text-label">Dashboard</h1>
        <p className="text-subheadline text-label-2 mt-1">
          Overview of platform users, resources, and live activity
        </p>
      </div>

      {/* Main Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Users */}
        <div className="content-card p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-label-2 mb-3">
            <span className="text-subheadline font-medium">Total users</span>
            <Users size={20} strokeWidth={1.75} className="text-accent" />
          </div>
          <div className="text-title font-rounded-num text-label">{counts?.totalUsers || 0}</div>
          <span className="text-footnote text-label-3 mt-2">Registered platform accounts</span>
        </div>

        {/* Currently Online */}
        <div className="content-card p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-label-2 mb-3">
            <span className="text-subheadline font-medium">Currently online</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34D399]" />
          </div>
          <div className="text-title font-rounded-num text-emerald-400">{counts?.currentlyOnline || 1}</div>
          <span className="text-footnote text-label-3 mt-2">Active connected users</span>
        </div>

        {/* Currently in Quiz */}
        <div className="content-card p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-label-2 mb-3">
            <span className="text-subheadline font-medium">Currently in quiz</span>
            <Gamepad2 size={20} strokeWidth={1.75} className="text-sky-400" />
          </div>
          <div className="text-title font-rounded-num text-sky-400">{counts?.currentlyInQuiz || 0}</div>
          <span className="text-footnote text-label-3 mt-2">Live participating players</span>
        </div>

        {/* Total Games */}
        <div className="content-card p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-label-2 mb-3">
            <span className="text-subheadline font-medium">Total games</span>
            <Gamepad2 size={20} strokeWidth={1.75} className="text-green" />
          </div>
          <div className="text-title font-rounded-num text-label">{counts?.games || 0}</div>
          <span className="text-footnote text-label-3 mt-2">
            {counts?.players || 0} total joined players
          </span>
        </div>
      </div>

      {/* Users By Role Breakdown */}
      <div>
        <h2 className="text-title text-label mb-4">Users by role</h2>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          {/* Admin */}
          <div className="content-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <Shield size={16} strokeWidth={1.75} className="text-accent" />
              <span className="text-subheadline text-label-2">Administrators</span>
            </div>
            <div className="text-title font-rounded-num text-label">{userRoles.admin || 0}</div>
          </div>

          {/* Creator */}
          <div className="content-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={16} strokeWidth={1.75} className="text-amber-400" />
              <span className="text-subheadline text-label-2">Creators</span>
            </div>
            <div className="text-title font-rounded-num text-label">{userRoles.creator || userRoles.principal || 0}</div>
          </div>

          {/* Presentor */}
          <div className="content-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <GraduationCap size={16} strokeWidth={1.75} className="text-emerald-400" />
              <span className="text-subheadline text-label-2">Presenters</span>
            </div>
            <div className="text-title font-rounded-num text-label">{userRoles.presentor || userRoles.teacher || 0}</div>
          </div>

          {/* Moderator */}
          <div className="content-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <UserCheck size={16} strokeWidth={1.75} className="text-indigo-400" />
              <span className="text-subheadline text-label-2">Moderators</span>
            </div>
            <div className="text-title font-rounded-num text-label">{userRoles.moderator || 0}</div>
          </div>

          {/* User / Student */}
          <div className="content-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users size={16} strokeWidth={1.75} className="text-sky-400" />
              <span className="text-subheadline text-label-2">Users</span>
            </div>
            <div className="text-title font-rounded-num text-label">{userRoles.user || userRoles.student || 0}</div>
          </div>
        </div>
      </div>

      {/* Latest Games */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-title text-label">Recent games</h2>
            <p className="text-subheadline text-label-2">Latest classroom quiz and slides sessions</p>
          </div>
          <Link
            to="/games"
            className="btn-motion text-subheadline text-accent hover:underline flex items-center gap-1 font-medium"
          >
            <span>View all games</span>
            <ArrowRight size={16} strokeWidth={1.75} />
          </Link>
        </div>

        {latestGames.length === 0 ? (
          <div className="content-card p-8 text-center text-label-2 text-subheadline">
            No games have been initiated yet.
          </div>
        ) : (
          <div className="content-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-separator/40 text-footnote text-label-2 bg-surface-2/40">
                    <th className="py-3 px-4 font-medium">Type</th>
                    <th className="py-3 px-4 font-medium">PIN</th>
                    <th className="py-3 px-4 font-medium">Status</th>
                    <th className="py-3 px-4 font-medium">Host</th>
                    <th className="py-3 px-4 font-medium text-right">Players</th>
                    <th className="py-3 px-4 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-separator/20">
                  {latestGames.map((game) => (
                    <tr key={game._id} className="h-11 hover:bg-white/[0.02] transition-colors">
                      <td className="py-2.5 px-4 text-subheadline capitalize font-medium text-label">
                        {game.type}
                      </td>
                      <td className="py-2.5 px-4 text-subheadline font-rounded-num text-accent font-semibold tracking-wider">
                        {game.pin}
                      </td>
                      <td className="py-2.5 px-4 text-subheadline">
                        <Badge
                          variant={
                            game.status === 'live' || game.status === 'question'
                              ? 'green'
                              : game.status === 'lobby'
                              ? 'blue'
                              : 'neutral'
                          }
                        >
                          {game.status}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-4 text-subheadline text-label-2">{game.hostName}</td>
                      <td className="py-2.5 px-4 text-subheadline font-rounded-num text-right text-label">
                        {game.playerCount}
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <Link
                          to={`/games`}
                          className="btn-motion inline-flex items-center text-footnote text-accent hover:underline gap-1"
                        >
                          Details
                          <ArrowRight size={14} strokeWidth={1.75} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
