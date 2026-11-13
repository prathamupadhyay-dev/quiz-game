import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, ArrowRight, ExternalLink } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Hyperspeed from '../components/reactbits/Hyperspeed';
import StarBorder from '../components/reactbits/StarBorder';
import ShinyText from '../components/reactbits/ShinyText';
import PortalSwitcher from '../components/PortalSwitcher';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [redirectPortal, setRedirectPortal] = useState(null);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    setRedirectPortal(null);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      console.error('Login error:', err);
      if (err.data && err.data.portalName && err.data.portalUrl) {
        setRedirectPortal({
          name: err.data.portalName,
          url: err.data.portalUrl
        });
      } else {
        setErrorMessage(err.message || 'Login failed. Please check your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4 relative overflow-hidden select-none">
      {/* React Bits: Hyperspeed 3D Cosmic Starfield (Matching User Login Theme) */}
      <Hyperspeed
        speed={1.6}
        starCount={450}
        warpSpeed={36}
        trailColor="#5E5CE6"
      />

      {/* Ambient Radial Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,rgba(0,0,0,0.85)_100%)] pointer-events-none z-1" />

      <div className="w-full max-w-sm bg-[#121214]/90 backdrop-blur-3xl border border-white/10 rounded-3xl p-6 sm:p-7 shadow-2xl relative z-10 flex flex-col items-center">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-[#5E5CE6] to-[#06B6D4] flex items-center justify-center text-white mb-3 shadow-lg shadow-[#5E5CE6]/30">
            <Shield size={28} strokeWidth={2} />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-2">
            <ShinyText text="ZYNC" speed={2.5} className="font-extrabold" />
            <span className="text-xs font-mono uppercase tracking-widest px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Admin
            </span>
          </h1>
          <p className="text-xs text-neutral-400 mt-1 font-medium">
            System administration and platform controls
          </p>
        </div>

        {/* Other role redirect alert */}
        {redirectPortal && (
          <div className="w-full mb-4 p-3 rounded-2xl bg-amber-400/10 border border-amber-400/30 text-left">
            <p className="text-xs text-amber-300 font-bold mb-1">
              Use the {redirectPortal.name} portal
            </p>
            <a
              href={redirectPortal.url}
              className="inline-flex items-center gap-1.5 text-[11px] text-white bg-white/10 px-3 py-1 rounded-full border border-white/20 hover:border-amber-400 transition"
            >
              <span>Go to {redirectPortal.name} portal</span>
              <ExternalLink size={12} />
            </a>
          </div>
        )}

        {/* Error message */}
        {errorMessage && (
          <div className="w-full mb-4 p-2.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-400 text-center font-medium">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="w-full space-y-3">
          <div className="space-y-1 text-left">
            <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 ml-1">
              Email / Username
            </label>
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@zync.local"
              required
              autoComplete="username"
              className="w-full h-12 px-4 rounded-2xl bg-white/[0.04] border border-white/10 text-white placeholder-neutral-600 focus:outline-none focus:border-indigo-400 text-sm font-mono transition"
            />
          </div>

          <div className="space-y-1 text-left">
            <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 ml-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
              className="w-full h-12 px-4 rounded-2xl bg-white/[0.04] border border-white/10 text-white placeholder-neutral-600 focus:outline-none focus:border-indigo-400 text-sm transition"
            />
          </div>

          <div className="pt-2">
            <StarBorder
              as="button"
              type="submit"
              disabled={loading}
              color="#5E5CE6"
              speed="3.5s"
              className="w-full cursor-pointer active:scale-95 transition-transform"
              innerClassName="h-12 px-6 flex items-center justify-center"
            >
              <div className="font-extrabold text-sm tracking-wide flex items-center justify-center gap-2 text-white">
                <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
                <ArrowRight size={16} />
              </div>
            </StarBorder>
          </div>
        </form>

        <div className="mt-6 pt-4 border-t border-white/10 text-center w-full">
          <p className="text-[11px] text-neutral-500">
            Only users with the admin role may access this control center.
          </p>
        </div>
      </div>
    </div>
  );
}
