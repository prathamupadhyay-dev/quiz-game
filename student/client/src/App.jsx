import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import confetti from 'canvas-confetti';
import {
  Sparkles,
  Shirt,
  CheckCircle2,
  XCircle,
  Pencil,
  Check,
  X,
  LogOut,
  HelpCircle,
  Send,
  Trophy,
  Users,
  Timer,
  TrendingUp,
  TrendingDown,
  Minus,
  Crown,
  Medal,
  Award,
  ArrowRight,
  Layers,
  AlertTriangle,
  Dices,
  Shuffle,
  Repeat,
  Lock
} from 'lucide-react';

import CharacterAvatar from './components/CharacterAvatar';
import WardrobeDrawer from './components/WardrobeDrawer';
import Hyperspeed from './components/reactbits/Hyperspeed';
import StarBorder from './components/reactbits/StarBorder';
import ShinyText from './components/reactbits/ShinyText';
import Squares from './components/reactbits/Squares';
import PortalSwitcher from './components/PortalSwitcher';

// Google Client ID
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
const hasValidGoogleClientId = Boolean(
  GOOGLE_CLIENT_ID &&
  GOOGLE_CLIENT_ID.includes('.apps.googleusercontent.com') &&
  !GOOGLE_CLIENT_ID.includes('dummy')
);

// Geometric shapes for anti-cheat pad
const PAD_OPTIONS = [
  {
    index: 0,
    name: 'Triangle',
    color: 'bg-[#FF453A]',
    border: 'border-[#FF453A]',
    shadow: 'shadow-[#FF453A]/40',
    icon: (
      <svg viewBox="0 0 40 40" className="w-12 h-12 fill-white drop-shadow">
        <polygon points="20,4 38,36 2,36" />
      </svg>
    )
  },
  {
    index: 1,
    name: 'Diamond',
    color: 'bg-[#0A84FF]',
    border: 'border-[#0A84FF]',
    shadow: 'shadow-[#0A84FF]/40',
    icon: (
      <svg viewBox="0 0 40 40" className="w-12 h-12 fill-white drop-shadow">
        <polygon points="20,2 38,20 20,38 2,20" />
      </svg>
    )
  },
  {
    index: 2,
    name: 'Circle',
    color: 'bg-[#FFD60A]',
    border: 'border-[#FFD60A]',
    shadow: 'shadow-[#FFD60A]/40',
    icon: (
      <svg viewBox="0 0 40 40" className="w-12 h-12 fill-black drop-shadow">
        <circle cx="20" cy="20" r="17" />
      </svg>
    )
  },
  {
    index: 3,
    name: 'Square',
    color: 'bg-[#30D158]',
    border: 'border-[#30D158]',
    shadow: 'shadow-[#30D158]/40',
    icon: (
      <svg viewBox="0 0 40 40" className="w-12 h-12 fill-white drop-shadow">
        <rect x="4" y="4" width="32" height="32" rx="4" />
      </svg>
    )
  }
];

export default function App() {
  // -------------------------------------------------------------
  // STATE: AUTH & STUDENT PROFILE
  // -------------------------------------------------------------
  const [authToken, setAuthToken] = useState(() => localStorage.getItem('zync_token') || localStorage.getItem('zync_student_auth_token') || '');
  const [student, setStudent] = useState(() => {
    try {
      const saved = localStorage.getItem('zync_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'
  const [authUsername, setAuthUsername] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authConfirmPassword, setAuthConfirmPassword] = useState('');
  const [podiumComments, setPodiumComments] = useState([]);
  const [newPodiumComment, setNewPodiumComment] = useState('');
  const [sendingComment, setSendingComment] = useState(false);
  const [isWarping, setIsWarping] = useState(false);
  const [showStage, setShowStage] = useState(() => Boolean(localStorage.getItem('zync_token') || localStorage.getItem('zync_student_auth_token')));

  // -------------------------------------------------------------
  // STATE: CHARACTER CUSTOMIZER & WARDROBE
  // -------------------------------------------------------------
  const [isWardrobeOpen, setIsWardrobeOpen] = useState(false);
  const [avatarConfig, setAvatarConfig] = useState({
    skinColor: '#F5C7A9',
    hairStyle: 'curly',
    hairColor: '#24252D',
    faceExpression: 'smile',
    topType: 'hoodie',
    topColor: '#5E5CE6',
    bottomType: 'jeans',
    bottomColor: '#1E293B',
    shoesType: 'sneakers',
    shoesColor: '#F8FAFC',
    accessory: 'none',
    presetOutfit: 'naruto'
  });
  const initialAvatarConfigRef = useRef(null);
  const [isSavingAvatar, setIsSavingAvatar] = useState(false);

  // -------------------------------------------------------------
  // STATE: DYNAMIC ANIME CATEGORIES & CHARACTERS (FROM MONGODB)
  // -------------------------------------------------------------
  const [animeCategories, setAnimeCategories] = useState([]);
  const [characterList, setCharacterList] = useState([]);
  const [characterRegistry, setCharacterRegistry] = useState({});

  useEffect(() => {
    fetch('/api/student/characters')
      .then(res => res.json())
      .then(data => {
        if (data.categories && data.characters) {
          setAnimeCategories(data.categories);
          setCharacterList(data.characters);
          const reg = {};
          data.characters.forEach(c => {
            const key = c.characterId || c._id;
            reg[key] = c;
          });
          setCharacterRegistry(reg);
        }
      })
      .catch(err => console.error('Failed to load dynamic characters:', err));
  }, []);

  // -------------------------------------------------------------
  // STATE: USERNAME EDITING (BUBBLE ONLY)
  // -------------------------------------------------------------
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [usernameError, setUsernameError] = useState('');

  // -------------------------------------------------------------
  // STATE: ROOM PIN & IN-GAME SESSION
  // -------------------------------------------------------------
  const [pin, setPin] = useState('');
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinError, setJoinError] = useState('');
  const [session, setSession] = useState(() => {
    const saved = localStorage.getItem('zync_student_session');
    return saved ? JSON.parse(saved) : null;
  });
  const [gameState, setGameState] = useState(null);
  const [isRemoved, setIsRemoved] = useState(false);

  // -------------------------------------------------------------
  // STATE: QUIZ & PRESENTATION ACTIONS
  // -------------------------------------------------------------
  const [selectedChoice, setSelectedChoice] = useState(null);
  const [slideComment, setSlideComment] = useState('');
  const [confusedSent, setConfusedSent] = useState(false);
  const [repeatSent, setRepeatSent] = useState(false);
  const [showAskDoubt, setShowAskDoubt] = useState(false);
  const [doubtText, setDoubtText] = useState('');
  const [commentError, setCommentError] = useState('');
  const [resultsActiveTab, setResultsActiveTab] = useState('stats');

  const confettiFiredRef = useRef(false);

  // -------------------------------------------------------------
  // AUTH INITIALIZATION
  // -------------------------------------------------------------
  useEffect(() => {
    if (authToken) {
      fetch('/api/student/me', {
        headers: { Authorization: `Bearer ${authToken}` }
      })
        .then(res => {
          if (!res.ok) throw new Error('Session expired');
          return res.json();
        })
        .then(data => {
          if (data.student) {
            setStudent(data.student);
            if (data.student.avatarConfig) {
              setAvatarConfig(data.student.avatarConfig);
            }
          }
        })
        .catch(() => {
          setAuthToken('');
          localStorage.removeItem('zync_student_auth_token');
          setStudent(null);
        });
    }
  }, [authToken]);

  // Real Google Login Success
  const handleGoogleSuccess = async credentialResponse => {
    setAuthLoading(true);
    setAuthError('');
    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: credentialResponse.credential })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to authenticate');

      localStorage.setItem('zync_student_auth_token', data.token);
      setAuthToken(data.token);
      setStudent(data.student);
      if (data.student.avatarConfig) {
        setAvatarConfig(data.student.avatarConfig);
      }
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  // One-Click Google / Guest Auth (No 401 popups)
  const handleDirectAuth = async (isGoogle = false) => {
    setAuthLoading(true);
    setAuthError('');
    try {
      const randomNum = Math.floor(10 + Math.random() * 90);
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          demoUser: {
            email: isGoogle ? `google_student_${randomNum}@gmail.com` : `guest_${randomNum}@zync.app`,
            name: isGoogle ? `Google Student ${randomNum}` : `Guest ${randomNum}`
          }
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to sign in');

      localStorage.setItem('zync_student_auth_token', data.token);
      setAuthToken(data.token);
      setStudent(data.student);
      if (data.student.avatarConfig) {
        setAvatarConfig(data.student.avatarConfig);
      }
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  // Submit Login or Register
  const handleAuthSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!authUsername.trim() || !authPassword) {
      setAuthError('Please fill in all required fields');
      return;
    }

    if (authMode === 'register' && authPassword !== authConfirmPassword) {
      setAuthError('Passwords do not match');
      return;
    }

    setAuthLoading(true);
    setAuthError('');

    try {
      const endpoint = authMode === 'register' ? '/api/auth/register' : '/api/auth/login';
      const body = authMode === 'register'
        ? {
            username: authUsername.toLowerCase().trim(),
            password: authPassword,
            confirmPassword: authConfirmPassword
          }
        : {
            username: authUsername.toLowerCase().trim(),
            password: authPassword
          };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      setIsWarping(true);
      const authenticatedUser = data.user || data.student;
      localStorage.setItem('zync_token', data.token);
      localStorage.setItem('zync_user', JSON.stringify(authenticatedUser));
      localStorage.setItem('zync_student_auth_token', data.token);
      localStorage.setItem('zync_admin_token', data.token);
      localStorage.setItem('zync_creator_token', data.token);
      localStorage.setItem('zync_teacher_token', data.token);
      localStorage.setItem('zync_moderator_token', data.token);

      setAuthToken(data.token);
      setStudent(authenticatedUser);
      if (authenticatedUser?.avatarConfig) {
        setAvatarConfig(authenticatedUser.avatarConfig);
      }

      // Check role redirection or ?redirect= query param
      const params = new URLSearchParams(window.location.search);
      const redirectParam = params.get('redirect');
      const userRole = (authenticatedUser?.role || 'user').toLowerCase();
      const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

      if (redirectParam) {
        window.location.href = redirectParam;
        return;
      }

      if (userRole === 'admin') {
        window.location.href = isLocal ? 'http://localhost:5171' : '/admin';
        return;
      }
      if (userRole === 'creator' || userRole === 'principal') {
        window.location.href = isLocal ? 'http://localhost:5175' : '/creator';
        return;
      }
      if (userRole === 'presentor' || userRole === 'teacher') {
        window.location.href = isLocal ? 'http://localhost:5173' : '/presentor';
        return;
      }
      if (userRole === 'moderator') {
        window.location.href = isLocal ? 'http://localhost:5174' : '/moderator';
        return;
      }

      setTimeout(() => {
        setShowStage(true);
        setIsWarping(false);
      }, 900);
    } catch (err) {
      setAuthError(err.message);
      setIsWarping(false);
    } finally {
      setAuthLoading(false);
    }
  };

  // Send celebratory live comment on podium
  const handleSendPodiumComment = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!newPodiumComment.trim() || !session) return;
    setSendingComment(true);
    try {
      await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.sessionToken}`,
          'x-session-token': session.sessionToken
        },
        body: JSON.stringify({
          text: newPodiumComment.trim()
        })
      });
      setNewPodiumComment('');
    } catch (err) {
      console.error('Failed to send comment:', err);
    } finally {
      setSendingComment(false);
    }
  };

  // Cinematic guest sequence with Hyperspeed warp
  const handleStartGuest = async () => {
    setIsWarping(true);
    setAuthError('');

    try {
      await handleDirectAuth(false);
      setTimeout(() => {
        setShowStage(true);
        setIsWarping(false);
      }, 950);
    } catch (err) {
      setIsWarping(false);
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem('zync_student_auth_token');
    localStorage.removeItem('zync_student_session');
    setAuthToken('');
    setStudent(null);
    setSession(null);
    setGameState(null);
    setIsWardrobeOpen(false);
    setShowStage(false);
    setIsWarping(false);
  };

  // 1-Click Auto-generate new gamertag username
  const handleRandomizeUsername = async () => {
    try {
      const res = await fetch('/api/student/generate-username');
      const data = await res.json();
      if (data.username && authToken) {
        await fetch('/api/student/profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`
          },
          body: JSON.stringify({ username: data.username })
        });
        setStudent(prev => ({ ...prev, username: data.username }));
      }
    } catch (e) {}
  };

  // 1-Click Auto-generate new avatar outfit
  const handleRandomizeOutfit = async () => {
    try {
      const res = await fetch('/api/student/generate-avatar');
      const data = await res.json();
      if (data.avatarConfig) {
        setAvatarConfig(data.avatarConfig);
        // If wardrobe is NOT open, auto-persist to database immediately
        // While customizing in wardrobe, dice rolls are previews until "Save Character" is clicked!
        if (authToken && !isWardrobeOpen) {
          await fetch('/api/student/profile', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${authToken}`
            },
            body: JSON.stringify({ avatarConfig: data.avatarConfig })
          });
          setStudent(prev => ({ ...prev, avatarConfig: data.avatarConfig }));
        }
      }
    } catch (e) {}
  };

  // -------------------------------------------------------------
  // OPEN & CANCEL WARDROBE (WITH BACKUP / REVERT)
  // -------------------------------------------------------------
  const handleOpenWardrobe = () => {
    initialAvatarConfigRef.current = { ...avatarConfig };
    setIsWardrobeOpen(true);
  };

  const handleCancelWardrobe = () => {
    if (initialAvatarConfigRef.current) {
      setAvatarConfig({ ...initialAvatarConfigRef.current });
    }
    setIsWardrobeOpen(false);
  };

  // -------------------------------------------------------------
  // RANDOMIZE CHARACTERS (MALE & FEMALE DICE BUTTONS FROM MONGODB)
  // -------------------------------------------------------------
  const handleRandomMale = () => {
    const maleChars = characterList.filter(c => c.gender === 'male');
    const poolList = maleChars.length > 0 ? maleChars : characterList;
    if (!poolList.length) return;
    const currentId = avatarConfig.presetOutfit || 'naruto';
    const pool = poolList.filter(c => (c.characterId || c._id) !== currentId);
    const pick = pool.length > 0
      ? pool[Math.floor(Math.random() * pool.length)]
      : poolList[Math.floor(Math.random() * poolList.length)];
    setAvatarConfig(prev => ({
      ...prev,
      presetOutfit: pick.characterId || pick._id
    }));
  };

  const handleRandomFemale = () => {
    const femaleChars = characterList.filter(c => c.gender === 'female');
    if (!femaleChars.length) return;
    const currentId = avatarConfig.presetOutfit || 'naruto';
    const pool = femaleChars.filter(c => (c.characterId || c._id) !== currentId);
    const pick = pool.length > 0
      ? pool[Math.floor(Math.random() * pool.length)]
      : femaleChars[Math.floor(Math.random() * femaleChars.length)];
    setAvatarConfig(prev => ({
      ...prev,
      presetOutfit: pick.characterId || pick._id
    }));
  };

  // -------------------------------------------------------------
  // SAVE AVATAR CONFIG
  // -------------------------------------------------------------
  const handleSaveAvatar = async () => {
    if (!authToken) return;
    setIsSavingAvatar(true);
    try {
      const res = await fetch('/api/student/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({ avatarConfig })
      });
      if (res.ok) {
        const data = await res.json();
        setStudent(data.student);
        initialAvatarConfigRef.current = { ...avatarConfig };
        setIsWardrobeOpen(false);
      }
    } catch (err) {
      console.error('Failed to save avatar:', err);
    } finally {
      setIsSavingAvatar(false);
    }
  };

  // -------------------------------------------------------------
  // UPDATE USERNAME (BUBBLE)
  // -------------------------------------------------------------
  const handleSaveUsername = async () => {
    if (!newUsername.trim()) return;
    setUsernameError('');
    try {
      const res = await fetch('/api/student/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({ username: newUsername.trim() })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Username already taken');

      setStudent(data.student);
      setIsEditingUsername(false);
    } catch (err) {
      setUsernameError(err.message);
    }
  };

  // -------------------------------------------------------------
  // JOIN GAME ROOM
  // -------------------------------------------------------------
  const handleJoinGame = async e => {
    e.preventDefault();
    if (!pin.trim()) {
      setJoinError('Enter 6-digit code');
      return;
    }

    setJoinLoading(true);
    setJoinError('');

    try {
      const res = await fetch('/api/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pin: pin.trim(),
          nickname: student ? student.username : `Player${Math.floor(Math.random() * 1000)}`,
          avatarConfig,
          studentId: student ? student._id : null
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to join');
      }

      const sessionData = {
        sessionToken: data.player.sessionToken,
        playerId: data.player._id,
        nickname: data.player.nickname,
        avatarConfig: data.player.avatarConfig || avatarConfig,
        pin: data.game.pin,
        gameId: data.game._id
      };

      localStorage.setItem('zync_student_session', JSON.stringify(sessionData));
      setSession(sessionData);
      setIsRemoved(false);
      confettiFiredRef.current = false;
    } catch (err) {
      setJoinError(err.message);
    } finally {
      setJoinLoading(false);
    }
  };

  const handleLeaveGame = async () => {
    const token = session?.sessionToken;
    const pId = session?.playerId;
    const pPin = session?.pin || gameState?.pin || pin;
    const pNickname = session?.nickname || student?.username;
    const sId = student?._id || null;

    localStorage.removeItem('zync_student_session');
    setSession(null);
    setGameState(null);
    setSelectedChoice(null);
    setIsRemoved(false);

    try {
      await fetch('/api/game/leave', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          sessionToken: token,
          playerId: pId,
          nickname: pNickname,
          pin: pPin,
          studentId: sId
        })
      });
    } catch (e) {
      console.error('Leave game error:', e);
    }
  };

  // -------------------------------------------------------------
  // GAME STATE POLLING (1000ms)
  // -------------------------------------------------------------
  useEffect(() => {
    if (!session || !session.sessionToken) return;

    let isMounted = true;
    const pollState = async () => {
      try {
        const res = await fetch('/api/game/state', {
          headers: {
            Authorization: `Bearer ${session.sessionToken}`
          }
        });

        if (res.status === 403) {
          if (isMounted) setIsRemoved(true);
          return;
        }

        if (res.status === 401) {
          if (isMounted) {
            localStorage.removeItem('zync_student_session');
            setSession(null);
          }
          return;
        }

        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setGameState(data);
            if (data.hasAnswered && data.answerChoice !== null && data.answerChoice !== undefined) {
              setSelectedChoice(data.answerChoice);
            }
          }
        }
      } catch (err) {}
    };

    pollState();
    const interval = setInterval(pollState, 1000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [session]);

  // Reset answer choice on question change
  const prevQuestionIndex = useRef(null);
  useEffect(() => {
    if (gameState && gameState.status === 'question') {
      if (prevQuestionIndex.current !== gameState.currentIndex) {
        prevQuestionIndex.current = gameState.currentIndex;
        if (!gameState.hasAnswered) {
          setSelectedChoice(null);
        }
      }
    }
  }, [gameState]);

  // Confetti on game end
  useEffect(() => {
    if (gameState && gameState.status === 'ended' && !confettiFiredRef.current) {
      confettiFiredRef.current = true;
      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (e) {}
    }
  }, [gameState]);

  // Poll live Danmaku comments during podium celebration
  useEffect(() => {
    if (!session || !gameState || gameState.status !== 'ended') return;
    let isMounted = true;
    const fetchComments = async () => {
      try {
        const res = await fetch('/api/comments', {
          headers: {
            Authorization: `Bearer ${session.sessionToken}`,
            'x-session-token': session.sessionToken
          }
        });
        if (res.ok && isMounted) {
          const data = await res.json();
          if (data.comments) setPodiumComments(data.comments);
        }
      } catch (e) {}
    };
    fetchComments();
    const interval = setInterval(fetchComments, 2000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [session, gameState?.status]);


  // Submit Answer
  const handleAnswer = async choiceIndex => {
    if (selectedChoice !== null || !session) return;
    setSelectedChoice(choiceIndex);

    try {
      await fetch('/api/answer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.sessionToken}`
        },
        body: JSON.stringify({
          questionIndex: gameState?.currentIndex || 0,
          choice: choiceIndex
        })
      });
    } catch (err) {
      console.error('Answer error:', err);
    }
  };

  const handleSlideComment = async e => {
    if (e && e.preventDefault) e.preventDefault();
    if (!slideComment.trim() || !session) return;
    setCommentError('');
    try {
      const res = await fetch('/api/presentations/comment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.sessionToken}`,
          'x-session-token': session.sessionToken
        },
        body: JSON.stringify({
          slideIndex: gameState?.currentIndex || 0,
          text: slideComment.trim()
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setCommentError(data.error || 'Live commenting disabled by Class Monitor');
        setTimeout(() => setCommentError(''), 3000);
        return;
      }

      setSlideComment('');
    } catch (err) {
      setCommentError('Failed to send comment');
      setTimeout(() => setCommentError(''), 3000);
    }
  };

  const handleConfused = async () => {
    if (confusedSent || !session) return;
    try {
      await fetch('/api/presentations/confused', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.sessionToken}`,
          'x-session-token': session.sessionToken
        },
        body: JSON.stringify({
          slideIndex: gameState?.currentIndex || 0
        })
      });
      setConfusedSent(true);
      setTimeout(() => setConfusedSent(false), 2500);
    } catch (err) {}
  };

  const handleRepeat = async () => {
    if (repeatSent || !session) return;
    try {
      await fetch('/api/presentations/repeat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.sessionToken}`,
          'x-session-token': session.sessionToken
        },
        body: JSON.stringify({
          slideIndex: gameState?.currentIndex || 0
        })
      });
      setRepeatSent(true);
      setTimeout(() => setRepeatSent(false), 2500);
    } catch (err) {}
  };

  const handleSendDoubt = async e => {
    if (e && e.preventDefault) e.preventDefault();
    if (!doubtText.trim() || !session) return;
    try {
      await fetch('/api/presentations/doubt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.sessionToken}`,
          'x-session-token': session.sessionToken
        },
        body: JSON.stringify({
          slideIndex: gameState?.currentIndex || 0,
          text: doubtText.trim()
        })
      });
      setDoubtText('');
      setShowAskDoubt(false);
      alert('Your question was sent to the teacher!');
    } catch (err) {
      alert('Failed to send question');
    }
  };

  // ---------------------------------------------------------------------------
  // SCREEN 1: CINEMATIC REACT BITS INTRO & WARP TRANSITION
  // ---------------------------------------------------------------------------
  if (!authToken || !student || !showStage) {
    return (
      <div className="h-screen w-full bg-black text-white flex flex-col items-center justify-center p-4 relative overflow-hidden select-none">
        {/* React Bits: Hyperspeed 3D Starfield & Warp Tunnel */}
        <Hyperspeed
          isWarping={isWarping}
          speed={1.6}
          warpSpeed={36}
          trailColor="#5E5CE6"
        />

        {/* Ambient Radial Vignette */}
        <div className="absolute inset-0 bg-radial-vignette pointer-events-none z-1" />

        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={
            isWarping
              ? { opacity: 0, scale: 0.8, filter: 'blur(14px)', transition: { duration: 0.5 } }
              : { opacity: 1, scale: 1, filter: 'blur(0px)', transition: { duration: 0.4 } }
          }
          className="w-full max-w-sm bg-[#121214]/90 backdrop-blur-3xl border border-white/10 rounded-3xl p-6 sm:p-7 flex flex-col items-center text-center shadow-2xl relative z-10"
        >
          {/* Logo Mark with Gradient Glow */}
          <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-[#5E5CE6] to-[#06B6D4] flex items-center justify-center mb-3 shadow-lg shadow-[#5E5CE6]/40">
            <Sparkles className="w-7 h-7 text-white" />
          </div>

          <h1 className="text-3xl font-black tracking-tight mb-1">
            <ShinyText text="ZYNC" speed={2.5} className="font-extrabold" />
          </h1>

          <p className="text-xs text-neutral-400 font-medium mb-4">
            {authMode === 'login' ? 'Sign in to access your avatar and quizzes' : 'Create your unique student account'}
          </p>

          {authError && (
            <div className="w-full mb-3 p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
              {authError}
            </div>
          )}

          <form onSubmit={handleAuthSubmit} className="w-full space-y-3">
            <div className="space-y-1 text-left">
              <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 ml-1">Username</label>
              <input
                type="text"
                value={authUsername}
                onChange={(e) => {
                  const val = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
                  setAuthUsername(val);
                }}
                placeholder="e.g. shadow_ninja"
                maxLength={24}
                required
                className="w-full h-12 px-4 bg-white/[0.04] border border-white/10 focus:border-indigo-400 rounded-2xl text-sm font-mono text-white placeholder:text-neutral-600 outline-none transition-all shadow-inner"
              />
              {authMode === 'register' && (
                <span className="text-[10px] text-neutral-500 block ml-1 font-mono">
                  lowercase letters, numbers, and _ only
                </span>
              )}
            </div>

            <div className="space-y-1 text-left">
              <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 ml-1">Password</label>
              <input
                type="password"
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full h-12 px-4 bg-white/[0.04] border border-white/10 focus:border-indigo-400 rounded-2xl text-sm text-white placeholder:text-neutral-600 outline-none transition-all shadow-inner"
              />
            </div>

            {authMode === 'register' && (
              <div className="space-y-1 text-left">
                <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 ml-1">Confirm Password</label>
                <input
                  type="password"
                  value={authConfirmPassword}
                  onChange={(e) => setAuthConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full h-12 px-4 bg-white/[0.04] border border-white/10 focus:border-indigo-400 rounded-2xl text-sm text-white placeholder:text-neutral-600 outline-none transition-all shadow-inner"
                />
              </div>
            )}

            <StarBorder
              as="button"
              type="submit"
              disabled={authLoading || isWarping}
              color="#5E5CE6"
              speed="3.5s"
              className="w-full cursor-pointer active:scale-95 transition-transform pt-1"
              innerClassName="h-13 px-6 flex items-center justify-center"
            >
              <div className="font-extrabold text-sm tracking-wide flex items-center justify-center gap-2">
                <span>{isWarping ? 'Warping...' : authLoading ? 'Verifying...' : authMode === 'login' ? 'Login' : 'Confirm'}</span>
                <ArrowRight size={16} className={isWarping ? 'translate-x-1' : ''} />
              </div>
            </StarBorder>
          </form>

          {/* Toggle Login <-> Register */}
          <div className="mt-4 pt-3 border-t border-white/10 w-full flex items-center justify-center gap-1.5 text-xs text-neutral-400">
            <span>{authMode === 'login' ? "Don't have an account?" : 'Already have an account?'}</span>
            <button
              type="button"
              onClick={() => {
                setAuthError('');
                setAuthMode(authMode === 'login' ? 'register' : 'login');
              }}
              className="font-bold text-indigo-400 hover:text-indigo-300 underline underline-offset-2 transition-colors cursor-pointer"
            >
              {authMode === 'login' ? 'Sign Up' : 'Login'}
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // REMOVED / KICKED MODAL
  // ---------------------------------------------------------------------------
  if (isRemoved) {
    return (
      <div className="h-screen w-full bg-black text-white flex items-center justify-center p-4">
        <div className="bg-[#1C1C1E] border border-red-500/30 p-6 rounded-3xl max-w-xs text-center shadow-2xl">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <h2 className="text-lg font-bold mb-1">Removed from Room</h2>
          <p className="text-xs text-white/50 mb-5">
            You were disconnected from this session.
          </p>
          <button
            onClick={handleLeaveGame}
            className="w-full py-2.5 bg-[#5E5CE6] hover:bg-[#5E5CE6]/90 rounded-xl font-bold text-xs transition-all cursor-pointer"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // SCREEN 2: CHARACTER STAGE & JOIN SPACE (REACT BITS SQUARES + NO SCROLL)
  if (!session) {
    const currentCharId = avatarConfig.presetOutfit || 'naruto';
    const currentCharData = characterRegistry[currentCharId] || characterList.find(c => c.characterId === currentCharId) || characterList[0] || {
      name: 'Naruto Uzumaki',
      animeName: 'Naruto Shippuden',
      color: '#F97316'
    };

    return (
      <div className="h-screen w-full bg-black text-white flex flex-col justify-between p-4 sm:p-5 relative overflow-hidden select-none">
        {/* Universal Top Role-Based Portal Switcher */}
        <PortalSwitcher current="user" currentUser={student} />
        {/* React Bits: Squares Interactive Drift Grid */}
        <Squares
          direction="diagonal"
          speed={0.4}
          squareSize={42}
          borderColor="rgba(255, 255, 255, 0.04)"
          hoverFillColor="rgba(94, 92, 230, 0.25)"
        />

        {/* Ambient Spotlight */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#5E5CE6]/15 rounded-full blur-[120px] pointer-events-none z-1" />

        {/* Top Floating Controls */}
        <header className="w-full flex justify-end z-20">
          <button
            onClick={handleSignOut}
            title="Sign Out"
            className="p-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white/40 hover:text-white transition-all cursor-pointer"
          >
            <LogOut size={15} />
          </button>
        </header>

        {/* Main Stage Arena: Single Permanent 2-Column Grid (Zero Character Jumping) */}
        <main className="w-full max-w-6xl mx-auto flex-1 flex items-center justify-center z-10 min-h-0 px-3 sm:px-6 py-4">
          <div className="w-full max-w-5xl mx-auto flex flex-col-reverse md:flex-row items-center justify-center gap-10 sm:gap-14 md:gap-16">
            
            {/* =========================================================
                LEFT COLUMN: Controls <-> Wardrobe Drawer Animated Switcher
            ========================================================= */}
            <div className="w-full md:w-1/2 flex flex-col justify-center min-w-0 max-w-md lg:max-w-lg">
              <AnimatePresence mode="wait">
                {!isWardrobeOpen ? (
                  <motion.div
                    key="room-controls"
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -12 }}
                    transition={{ duration: 0.18 }}
                    className="w-full flex flex-col gap-5 sm:gap-6"
                  >
                    {/* 1. Sleek ReactBits Username Bubble + Dice Button (Symmetrical with Code Row) */}
                    <div className="flex flex-col gap-1.5 w-full">
                      <div className="flex items-center gap-3.5 w-full">
                        <StarBorder
                          as="div"
                          color="#5E5CE6"
                          speed="4s"
                          className="flex-1 shadow-2xl"
                          innerClassName="h-14 sm:h-16 px-5 sm:px-6 flex items-center justify-between"
                        >
                          {isEditingUsername ? (
                            <div className="flex items-center gap-2 w-full">
                              <input
                                type="text"
                                value={newUsername}
                                onChange={e => setNewUsername(e.target.value)}
                                onKeyDown={e => {
                                  if (e.key === 'Enter') handleSaveUsername();
                                  if (e.key === 'Escape') setIsEditingUsername(false);
                                }}
                                maxLength={20}
                                placeholder="Enter username"
                                className="bg-transparent border-none text-white text-base sm:text-lg font-bold px-1 focus:outline-none flex-1 font-mono tracking-wide"
                                autoFocus
                              />
                              {/* Green Tick Button on right */}
                              <button
                                type="button"
                                onClick={handleSaveUsername}
                                className="w-8 h-8 rounded-full bg-[#30D158] text-black hover:brightness-110 flex items-center justify-center transition-all cursor-pointer shadow-md active:scale-95 flex-shrink-0"
                                title="Save Username"
                              >
                                <Check size={16} className="stroke-[3]" />
                              </button>
                              {/* Red Cross Button on right */}
                              <button
                                type="button"
                                onClick={() => setIsEditingUsername(false)}
                                className="w-8 h-8 rounded-full bg-red-500/20 text-red-400 hover:bg-red-500/30 flex items-center justify-center transition-all cursor-pointer border border-red-500/30 active:scale-95 flex-shrink-0"
                                title="Cancel"
                              >
                                <X size={16} />
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setNewUsername(student.username);
                                setIsEditingUsername(true);
                              }}
                              className="flex items-center justify-center hover:opacity-90 transition-opacity cursor-pointer group text-center w-full truncate py-1"
                              title="Click to Edit Username"
                            >
                              <ShinyText
                                text={student.username}
                                speed={3.5}
                                className="font-black text-lg sm:text-xl text-white tracking-wider truncate"
                              />
                            </button>
                          )}
                        </StarBorder>

                        {/* 1-Click Auto-Generate Username Button (OUTSIDE the bubble, perfectly symmetric with Join button below) */}
                        <button
                          type="button"
                          onClick={handleRandomizeUsername}
                          title="Auto-Generate Username"
                          className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#141416]/90 backdrop-blur-3xl border border-white/10 hover:border-[#5E5CE6]/60 text-white/70 hover:text-white transition-all cursor-pointer flex items-center justify-center shadow-2xl active:scale-95 flex-shrink-0 hover:shadow-[0_0_20px_rgba(94,92,230,0.3)]"
                        >
                          <Dices size={22} className="text-[#5E5CE6]" />
                        </button>
                      </div>

                      {usernameError && (
                        <p className="text-red-400 text-xs font-semibold px-4">{usernameError}</p>
                      )}
                    </div>

                    {/* 2. Sleek ReactBits CODE Bubble + Join Button (PERFECT SYMMETRY WITH USERNAME ROW) */}
                    <div className="flex flex-col gap-1.5 w-full">
                      <form onSubmit={handleJoinGame} className="flex items-center gap-3.5 w-full">
                        <StarBorder
                          as="div"
                          color="#0A84FF"
                          speed="4s"
                          className="flex-1 shadow-2xl"
                          innerClassName="h-14 sm:h-16 px-5 sm:px-6 flex items-center justify-center"
                        >
                          <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            maxLength={6}
                            value={pin}
                            onChange={e => setPin(e.target.value.replace(/\D/g, ''))}
                            placeholder="CODE"
                            className="w-full text-center text-2xl sm:text-3xl tracking-[0.3em] font-black bg-transparent border-none text-white placeholder-white/20 focus:outline-none transition-all font-mono"
                          />
                        </StarBorder>

                        <button
                          type="submit"
                          disabled={joinLoading || pin.length < 4}
                          title="Join Room"
                          className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-tr from-[#5E5CE6] to-[#0A84FF] hover:brightness-110 active:scale-95 disabled:opacity-30 disabled:pointer-events-none text-white shadow-xl shadow-[#5E5CE6]/30 transition-all flex items-center justify-center cursor-pointer flex-shrink-0 hover:shadow-[0_0_25px_rgba(10,132,255,0.45)]"
                        >
                          {joinLoading ? (
                            <Sparkles size={20} className="animate-spin" />
                          ) : (
                            <ArrowRight size={22} className="stroke-[2.5]" />
                          )}
                        </button>
                      </form>

                      {joinError && (
                        <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs text-center font-medium">
                          {joinError}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="wardrobe-catalog"
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -12 }}
                    transition={{ duration: 0.18 }}
                    className="w-full"
                  >
                    <WardrobeDrawer
                      config={avatarConfig}
                      onChange={newConfig => setAvatarConfig(newConfig)}
                      categories={animeCategories}
                      characters={characterList}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* =========================================================
                RIGHT COLUMN: Character Avatar (PERMANENTLY MOUNTED - ZERO JUMP)
                With Action Button morphing between "Switch" and "[Dice] + [Save] [X]"
            ========================================================= */}
            <div className="w-full md:w-1/2 flex flex-col items-center justify-center text-center select-none flex-shrink-0">
              {/* Spotlight & ENLARGED Character Avatar */}
              <div className="relative flex flex-col items-center mb-3">
                <div
                  className="absolute bottom-2 w-72 sm:w-80 h-16 rounded-[100%] blur-2xl pointer-events-none transition-colors duration-500 opacity-60"
                  style={{
                    backgroundColor: currentCharData?.color ? `${currentCharData.color}45` : 'rgba(94, 92, 230, 0.35)'
                  }}
                />
                <div className="absolute bottom-3 w-48 sm:w-56 h-8 bg-white/15 rounded-[100%] blur-md pointer-events-none" />
                
                <CharacterAvatar
                  config={avatarConfig}
                  mode="fullBody"
                  size={320}
                  animate="idle"
                  characterRegistry={characterRegistry}
                />
              </div>

              {/* Character Name & Anime Title */}
              <div className="mb-5">
                <h2 className="text-2xl sm:text-3xl font-black text-white tracking-wide">
                  {currentCharData?.name || 'Naruto Uzumaki'}
                </h2>
                <p
                  className="text-sm sm:text-base font-extrabold tracking-wider mt-1 transition-colors duration-300"
                  style={{ color: currentCharData?.color || '#A1A1AA' }}
                >
                  {currentCharData?.animeName || currentCharData?.anime || 'Naruto Shippuden'}
                </p>
              </div>

              {/* Action Button Container: "Switch" Button Morphs Into [Dice] + [Save] [X] */}
              <div className="flex flex-col items-center w-full min-h-[56px] justify-center">
                <AnimatePresence mode="wait">
                  {!isWardrobeOpen ? (
                    <motion.div
                      key="switch-button-wrap"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="flex justify-center"
                    >
                      <StarBorder
                        onClick={handleOpenWardrobe}
                        color="#5E5CE6"
                        speed="3s"
                        className="cursor-pointer active:scale-95 transition-all shadow-2xl"
                      >
                        <div className="px-9 py-3.5 font-black text-sm sm:text-base flex items-center gap-2.5 text-white">
                          <Shirt size={18} />
                          <span>Switch</span>
                        </div>
                      </StarBorder>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="save-cancel-actions-wrap"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="flex flex-col items-center gap-2.5 w-full max-w-xs"
                    >
                      {/* Top Row: Two Icon-Only Dice Buttons (Blue for Male, Pink for Female - 100% Identical Gradient Style) */}
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={handleRandomMale}
                          title="Random Male Character"
                          className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-600/40 via-sky-500/30 to-indigo-600/40 hover:from-blue-500/60 hover:via-sky-400/50 hover:to-indigo-500/60 border-2 border-sky-400/60 hover:border-sky-300 text-sky-200 flex items-center justify-center transition-all cursor-pointer shadow-lg shadow-sky-500/30 hover:shadow-[0_0_20px_rgba(56,189,248,0.45)] active:scale-90 backdrop-blur-xl"
                        >
                          <Dices size={20} className="text-sky-300 drop-shadow-[0_0_10px_rgba(56,189,248,0.8)]" />
                        </button>
                        <button
                          type="button"
                          onClick={handleRandomFemale}
                          title="Random Female Character"
                          className="w-11 h-11 rounded-2xl bg-gradient-to-br from-pink-600/40 via-rose-500/30 to-fuchsia-600/40 hover:from-pink-500/60 hover:via-rose-400/50 hover:to-fuchsia-500/60 border-2 border-pink-400/60 hover:border-pink-300 text-pink-200 flex items-center justify-center transition-all cursor-pointer shadow-lg shadow-pink-500/30 hover:shadow-[0_0_20px_rgba(244,63,94,0.45)] active:scale-90 backdrop-blur-xl"
                        >
                          <Dices size={20} className="text-pink-300 drop-shadow-[0_0_10px_rgba(244,63,94,0.8)]" />
                        </button>
                      </div>

                      {/* Bottom Row: [Save] [X] - Cross button strictly on the RIGHT side of Save */}
                      <div className="flex items-center gap-2.5 w-full justify-center">
                        <button
                          type="button"
                          onClick={handleSaveAvatar}
                          disabled={isSavingAvatar}
                          className="flex-1 max-w-[170px] py-2.5 px-5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 active:scale-95 text-black font-black text-xs sm:text-sm shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                        >
                          <Check size={16} className="stroke-[3]" />
                          <span>{isSavingAvatar ? 'Saving...' : 'Save'}</span>
                        </button>

                        {/* Revert / Cancel Cross (X) on RIGHT side */}
                        <button
                          type="button"
                          onClick={handleCancelWardrobe}
                          title="Cancel / Revert"
                          className="w-10 h-10 rounded-2xl bg-white/[0.08] hover:bg-red-500/20 border border-white/15 hover:border-red-500/30 text-white/70 hover:text-red-400 flex items-center justify-center transition-all cursor-pointer shadow-lg active:scale-90 backdrop-blur-xl"
                        >
                          <X size={17} />
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

          </div>
        </main>

        <footer className="text-center text-[10px] text-white/20 py-1">
          ZYNC
        </footer>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // SCREEN 2.5: WAITING ROOM SCREEN (PENDING HOST / MODERATOR ADMISSION)
  // ---------------------------------------------------------------------------
  if (session && (!gameState || gameState.status === 'waiting_approval' || gameState.waiting || gameState.status === 'declined')) {
    const isDeclined = gameState?.status === 'declined';
    const myConfig = session?.avatarConfig || avatarConfig;
    const currentCharId = myConfig?.presetOutfit || 'naruto';
    const currentCharData = characterRegistry[currentCharId] || characterList.find(c => c.characterId === currentCharId) || {
      name: 'Hero',
      animeName: 'Universe',
      color: '#5E5CE6'
    };

    return (
      <div className="h-screen w-full bg-black text-white flex flex-col justify-between p-4 sm:p-6 relative overflow-hidden select-none">
        {/* Background Atmosphere */}
        <Squares
          direction="diagonal"
          speed={0.3}
          squareSize={48}
          borderColor="rgba(255, 255, 255, 0.03)"
          hoverFillColor="rgba(94, 92, 230, 0.2)"
        />

        {/* Ambient Character Spotlight Glow */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full blur-[140px] pointer-events-none opacity-25 transition-colors duration-700"
          style={{ backgroundColor: currentCharData?.color || '#5E5CE6' }}
        />

        {/* Top Header Bar: Room Code & Leave Button */}
        <header className="w-full flex items-center justify-between z-20 max-w-4xl mx-auto">
          {/* Room Code Badge */}
          <div className="flex items-center gap-2.5 px-5 py-2.5 rounded-2xl bg-white/[0.05] backdrop-blur-2xl border border-white/10 shadow-xl">
            <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">ROOM PIN</span>
            <span className="font-mono font-black text-lg sm:text-xl tracking-wider text-white">
              {session?.pin}
            </span>
          </div>

          {/* Leave Button */}
          <button
            onClick={handleLeaveGame}
            title="Leave Queue"
            className="group flex items-center gap-2 h-11 px-4 rounded-2xl bg-white/[0.06] hover:bg-red-500/15 border border-white/10 hover:border-red-500/30 text-white/70 hover:text-red-400 font-bold text-xs transition-all cursor-pointer shadow-lg active:scale-95 backdrop-blur-xl"
          >
            <LogOut size={15} className="group-hover:-translate-x-0.5 transition-transform" />
            <span>Leave</span>
          </button>
        </header>

        {/* Center Showcase: Pulse Radar + Character Preview */}
        <main className="flex-1 flex flex-col items-center justify-center text-center z-10 my-auto py-2">
          {isDeclined ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-md p-6 rounded-3xl bg-rose-500/10 border border-rose-500/30 backdrop-blur-2xl text-center space-y-3 shadow-2xl"
            >
              <div className="w-16 h-16 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto border border-rose-500/40">
                <X size={32} />
              </div>
              <h2 className="text-xl font-black text-white">Admission Declined</h2>
              <p className="text-xs text-neutral-300">
                The presenter or moderator declined admission to this room.
              </p>
              <button
                type="button"
                onClick={handleLeaveGame}
                className="h-12 px-6 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition active:scale-95 cursor-pointer"
              >
                Return to Stage
              </button>
            </motion.div>
          ) : (
            <>
              {/* "Joined as: {username}" Holographic Pill */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.08] backdrop-blur-2xl border border-white/15 shadow-xl mb-4"
              >
                <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_#FBBF24] animate-ping" />
                <span className="text-xs text-white/60 font-semibold tracking-wide">Joined as</span>
                <span className="text-sm font-black text-white tracking-wide">{session?.nickname}</span>
              </motion.div>

              {/* Character Radar Pulse Stage */}
              <div className="relative flex flex-col items-center justify-center my-2">
                {/* Radar Ripple Waves */}
                <div className="absolute w-72 h-72 rounded-full border border-amber-400/20 animate-ping pointer-events-none" style={{ animationDuration: '3s' }} />
                <div className="absolute w-56 h-56 rounded-full border border-amber-400/30 animate-pulse pointer-events-none" />

                {/* Outer Aura Glow */}
                <div
                  className="absolute bottom-2 w-72 sm:w-80 h-16 rounded-[100%] blur-2xl pointer-events-none transition-colors duration-500 opacity-60"
                  style={{
                    backgroundColor: currentCharData?.color ? `${currentCharData.color}50` : 'rgba(94, 92, 230, 0.4)'
                  }}
                />
                {/* Center Floor Disc */}
                <div className="absolute bottom-3 w-48 sm:w-56 h-8 bg-white/15 rounded-[100%] blur-md pointer-events-none" />

                <CharacterAvatar
                  config={myConfig}
                  mode="fullBody"
                  size={300}
                  animate="idle"
                  characterRegistry={characterRegistry}
                />
              </div>

              {/* Character Name */}
              <div className="mt-2 text-center">
                <h2 className="text-2xl sm:text-3xl font-black text-white tracking-wide">
                  {currentCharData?.name || 'Character Outfit'}
                </h2>
                <p className="text-xs sm:text-sm font-bold uppercase tracking-wider text-neutral-400 mt-0.5">
                  {currentCharData?.animeName || 'Anime Universe'}
                </p>
              </div>
            </>
          )}
        </main>

        {/* Footer: Radar Status Pill */}
        {!isDeclined && (
          <footer className="w-full flex flex-col items-center justify-center pb-2 z-20 max-w-md mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="h-14 px-6 rounded-2xl bg-white/[0.04] backdrop-blur-2xl border border-amber-400/30 shadow-[0_0_25px_rgba(251,191,36,0.15)] inline-flex items-center gap-3"
            >
              <div className="w-3 h-3 rounded-full bg-amber-400 relative flex items-center justify-center">
                <span className="absolute w-5 h-5 rounded-full bg-amber-400/40 animate-ping" />
              </div>
              <div className="text-left">
                <div className="text-xs font-black text-amber-300 uppercase tracking-wider">
                  Waiting for Admission
                </div>
                <div className="text-[11px] text-white/70 font-medium">
                  Presenter or moderator will admit you into the lobby shortly
                </div>
              </div>
            </motion.div>
          </footer>
        )}
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // SCREEN 3: LIVE PLAYER AVATAR LOBBY / COUNTDOWN
  // ---------------------------------------------------------------------------
  if (gameState && (gameState.status === 'lobby' || gameState.status === 'countdown')) {
    const isCountdown = gameState.status === 'countdown';
    const countdownRemaining = gameState.countdownRemaining !== undefined ? gameState.countdownRemaining : (gameState.countdownDuration || 5);
    const myConfig = session?.avatarConfig || avatarConfig;
    const currentCharId = myConfig?.presetOutfit || 'naruto';
    const currentCharData = characterRegistry[currentCharId] || characterList.find(c => c.characterId === currentCharId) || {
      name: 'Hero',
      animeName: 'Universe',
      color: '#5E5CE6'
    };

    return (
      <div className="h-screen w-full bg-black text-white flex flex-col justify-between p-4 sm:p-6 relative overflow-hidden select-none">
        {/* Background Atmosphere */}
        <Squares
          direction="diagonal"
          speed={0.3}
          squareSize={48}
          borderColor="rgba(255, 255, 255, 0.03)"
          hoverFillColor="rgba(94, 92, 230, 0.2)"
        />

        {/* Ambient Character Spotlight Glow */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full blur-[140px] pointer-events-none opacity-25 transition-colors duration-700"
          style={{ backgroundColor: currentCharData?.color || '#5E5CE6' }}
        />

        {/* Top Header Bar: Room Code & Leave Button */}
        <header className="w-full flex items-center justify-between z-20 max-w-4xl mx-auto">
          {/* Room Code Badge */}
          <div className="flex items-center gap-2.5 px-5 py-2.5 rounded-2xl bg-white/[0.05] backdrop-blur-2xl border border-white/10 shadow-xl">
            <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">CODE</span>
            <span className="font-mono font-black text-lg sm:text-xl tracking-wider text-white">
              {gameState.pin || session.pin}
            </span>
          </div>

          {/* Leave Button */}
          <button
            onClick={handleLeaveGame}
            title="Leave Lobby"
            className="group flex items-center gap-2 h-11 px-4 rounded-2xl bg-white/[0.06] hover:bg-red-500/15 border border-white/10 hover:border-red-500/30 text-white/70 hover:text-red-400 font-bold text-xs transition-all cursor-pointer shadow-lg active:scale-95 backdrop-blur-xl"
          >
            <LogOut size={15} className="group-hover:-translate-x-0.5 transition-transform" />
            <span>Leave</span>
          </button>
        </header>

        {/* Center Showcase: Joined As Pill + Full-Screen Character Outfit */}
        <main className="flex-1 flex flex-col items-center justify-center text-center z-10 my-auto py-2">
          {/* "Joined as: {username}" Holographic Pill */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.08] backdrop-blur-2xl border border-white/15 shadow-xl mb-4"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34D399] animate-pulse" />
            <span className="text-xs text-white/60 font-semibold tracking-wide">Joined as</span>
            <span className="text-sm font-black text-white tracking-wide">{session.nickname}</span>
          </motion.div>

          {/* Character Stage with Glow Pedestal */}
          <div className="relative flex flex-col items-center justify-center my-2">
            {/* Outer Aura Glow */}
            <div
              className="absolute bottom-2 w-72 sm:w-80 h-16 rounded-[100%] blur-2xl pointer-events-none transition-colors duration-500 opacity-60"
              style={{
                backgroundColor: currentCharData?.color ? `${currentCharData.color}50` : 'rgba(94, 92, 230, 0.4)'
              }}
            />
            {/* Center Floor Disc */}
            <div className="absolute bottom-3 w-48 sm:w-56 h-8 bg-white/15 rounded-[100%] blur-md pointer-events-none" />

            <CharacterAvatar
              config={myConfig}
              mode="fullBody"
              size={320}
              animate={isCountdown ? "bounce" : "idle"}
              characterRegistry={characterRegistry}
            />
          </div>

          {/* Character Name & Anime Universe */}
          <div className="mt-2 text-center">
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-wide">
              {currentCharData?.name || 'Character Outfit'}
            </h2>
            <p
              className="text-xs sm:text-sm font-extrabold tracking-wider mt-0.5 transition-colors duration-300"
              style={{ color: currentCharData?.color || '#A1A1AA' }}
            >
              {currentCharData?.animeName || currentCharData?.anime || 'Anime Universe'}
            </p>
          </div>
        </main>

        {/* Bottom Status / Timer Bar */}
        <footer className="w-full flex flex-col items-center justify-center pb-2 z-20 max-w-md mx-auto text-center">
          <AnimatePresence mode="wait">
            {!isCountdown ? (
              <motion.div
                key="waiting-host"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="h-14 px-6 rounded-2xl bg-white/[0.04] backdrop-blur-2xl border border-white/10 shadow-2xl inline-flex items-center gap-3"
              >
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 relative flex items-center justify-center">
                  <span className="absolute w-4 h-4 rounded-full bg-emerald-400/40 animate-ping" />
                </div>
                <span className="text-xs sm:text-sm font-bold text-white/80">
                  Waiting for host to start...
                </span>
              </motion.div>
            ) : (
              <motion.div
                key="countdown-running"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex flex-col items-center gap-2 px-8 py-3.5 rounded-3xl bg-white/[0.04] backdrop-blur-2xl border-2 border-sky-400/40 shadow-[0_0_35px_rgba(56,189,248,0.25)]"
              >
                <div className="flex items-center gap-2 text-xs sm:text-sm font-extrabold uppercase tracking-widest text-sky-300">
                  <Timer size={16} className="animate-pulse text-sky-400" />
                  <span>Quiz starts in</span>
                </div>
                <div className="flex items-center justify-center">
                  <span className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-sky-200 to-indigo-200 font-mono tracking-tight animate-bounce">
                    {countdownRemaining}
                  </span>
                  <span className="text-lg font-bold text-sky-300 ml-1">s</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </footer>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // SCREEN 4: ANTI-CHEAT QUIZ CONTROLLER PAD
  // ---------------------------------------------------------------------------
  if (gameState && gameState.status === 'question') {
    const hasAnswered = selectedChoice !== null;
    const timeRemaining = gameState.timeRemaining !== undefined ? gameState.timeRemaining : 0;
    const timeLimit = gameState.timeLimit || 20;
    const percentTime = Math.max(0, Math.min(100, (timeRemaining / timeLimit) * 100));

    return (
      <div className="h-screen w-full bg-black text-white flex flex-col justify-between p-4 sm:p-6 max-w-xl mx-auto relative overflow-hidden select-none">
        {/* Background Atmosphere */}
        <Squares
          direction="diagonal"
          speed={0.3}
          squareSize={48}
          borderColor="rgba(255, 255, 255, 0.03)"
          hoverFillColor="rgba(94, 92, 230, 0.2)"
        />

        {/* Ambient Spotlight */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[140px] pointer-events-none z-1" />

        <header className="relative z-10 w-full space-y-2">
          <div className="flex items-center justify-between text-xs text-neutral-400 font-mono font-bold uppercase tracking-wider">
            <span>Question {gameState.currentIndex + 1} of {gameState.totalQuestions}</span>
            <span className="flex items-center gap-1.5 font-mono text-sm text-amber-300 font-black">
              <Timer size={15} className="text-amber-400" />
              <span>{timeRemaining}s</span>
            </span>
          </div>

          <div className="w-full h-2.5 bg-white/[0.06] rounded-full overflow-hidden p-0.5 border border-white/10">
            <div
              className={`h-full transition-all duration-300 rounded-full shadow-lg ${
                percentTime > 50
                  ? 'bg-gradient-to-r from-emerald-400 to-teal-400 shadow-emerald-500/40'
                  : percentTime > 25
                  ? 'bg-gradient-to-r from-amber-400 to-yellow-500 shadow-amber-500/40'
                  : 'bg-gradient-to-r from-rose-500 to-red-600 shadow-red-500/40'
              }`}
              style={{ width: `${percentTime}%` }}
            />
          </div>
        </header>

        <div className="relative z-10 my-auto text-center py-2">
          {hasAnswered ? (
            <div className="inline-flex flex-col items-center gap-2 p-5 rounded-3xl bg-white/[0.04] backdrop-blur-2xl border border-white/15 shadow-2xl">
              <CheckCircle2 size={36} className="text-emerald-400" />
              <h3 className="text-lg font-black text-white">Answer Locked</h3>
              <p className="text-xs text-neutral-400 font-medium">Look at projector</p>
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.05] border border-white/10 text-xs font-mono font-bold tracking-widest text-neutral-400 uppercase">
              <span>Select Shape on Projector</span>
            </div>
          )}
        </div>

        {/* 2x2 Shapes Pad */}
        <div className="relative z-10 grid grid-cols-2 gap-4 w-full h-[58vh] min-h-[300px]">
          {[
            {
              index: 0,
              name: 'Triangle',
              gradient: 'from-rose-500/95 to-red-600/95',
              border: 'border-rose-400/50',
              shadow: 'shadow-rose-950/50',
              textColor: 'text-white',
              icon: (
                <svg viewBox="0 0 40 40" className="w-14 h-14 fill-white drop-shadow-md">
                  <polygon points="20,4 38,36 2,36" />
                </svg>
              )
            },
            {
              index: 1,
              name: 'Diamond',
              gradient: 'from-blue-500/95 to-indigo-600/95',
              border: 'border-blue-400/50',
              shadow: 'shadow-blue-950/50',
              textColor: 'text-white',
              icon: (
                <svg viewBox="0 0 40 40" className="w-14 h-14 fill-white drop-shadow-md">
                  <polygon points="20,2 38,20 20,38 2,20" />
                </svg>
              )
            },
            {
              index: 2,
              name: 'Circle',
              gradient: 'from-amber-400/95 to-yellow-500/95',
              border: 'border-amber-300/60',
              shadow: 'shadow-yellow-950/50',
              textColor: 'text-black',
              icon: (
                <svg viewBox="0 0 40 40" className="w-14 h-14 fill-black drop-shadow-md">
                  <circle cx="20" cy="20" r="17" />
                </svg>
              )
            },
            {
              index: 3,
              name: 'Square',
              gradient: 'from-emerald-500/95 to-teal-600/95',
              border: 'border-emerald-400/50',
              shadow: 'shadow-emerald-950/50',
              textColor: 'text-white',
              icon: (
                <svg viewBox="0 0 40 40" className="w-14 h-14 fill-white drop-shadow-md">
                  <rect x="4" y="4" width="32" height="32" rx="4" />
                </svg>
              )
            }
          ].map(opt => {
            const isSelected = selectedChoice === opt.index;
            const isDimmed = hasAnswered && !isSelected;

            return (
              <button
                key={opt.index}
                type="button"
                onClick={() => handleAnswer(opt.index)}
                disabled={hasAnswered}
                className={`relative rounded-3xl border-2 flex flex-col items-center justify-center transition-all duration-150 select-none bg-gradient-to-br ${opt.gradient} ${opt.border} shadow-2xl ${opt.shadow} cursor-pointer ${
                  isSelected
                    ? 'ring-4 ring-white scale-[0.98]'
                    : isDimmed
                    ? 'opacity-20 grayscale scale-95 pointer-events-none'
                    : 'active:scale-95 hover:brightness-105'
                }`}
              >
                <div className="p-1">
                  {opt.icon}
                </div>
                <span className={`text-xs font-black uppercase tracking-wider ${opt.textColor} mt-2`}>
                  {opt.name}
                </span>

                {isSelected && (
                  <div className="absolute top-3 right-3 bg-white text-black p-1 rounded-full shadow-lg">
                    <Check size={14} className="stroke-[3]" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // SCREEN 5 & 6: POST-QUESTION STATS & ANIMATED LEADERBOARD
  // ---------------------------------------------------------------------------
  if (gameState && gameState.status === 'results') {
    const isCorrect = gameState.correct;
    const pointsEarned = gameState.pointsEarned || 0;
    const optionCounts = gameState.optionCounts || [0, 0, 0, 0];
    const totalAnswers = gameState.totalAnswers || optionCounts.reduce((a, b) => a + b, 0) || 1;
    const correctIndex = gameState.correctIndex !== undefined ? gameState.correctIndex : 0;
    const leaderboard = gameState.leaderboard || [];

    return (
      <div className="h-screen w-full bg-black text-white flex flex-col justify-between p-4 sm:p-6 max-w-xl mx-auto relative overflow-hidden select-none">
        {/* Background Atmosphere */}
        <Squares
          direction="diagonal"
          speed={0.3}
          squareSize={48}
          borderColor="rgba(255, 255, 255, 0.03)"
          hoverFillColor="rgba(94, 92, 230, 0.2)"
        />

        {/* Ambient Spotlight */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[140px] pointer-events-none z-1" />

        {/* Result Banner */}
        <header className="relative z-10 text-center pt-1 pb-3">
          <div
            className={`p-5 rounded-3xl border shadow-2xl backdrop-blur-2xl flex flex-col items-center ${
              isCorrect
                ? 'bg-emerald-500/15 border-emerald-500/40 shadow-emerald-500/20'
                : 'bg-rose-500/15 border-rose-500/40 shadow-rose-500/20'
            }`}
          >
            {isCorrect ? (
              <>
                <CheckCircle2 size={36} className="text-emerald-400 mb-1" />
                <h2 className="text-2xl font-black text-emerald-400">CORRECT!</h2>
                <span className="text-sm font-bold text-white mt-0.5">+{pointsEarned} pts</span>
              </>
            ) : (
              <>
                <XCircle size={36} className="text-rose-400 mb-1" />
                <h2 className="text-2xl font-black text-rose-400">INCORRECT</h2>
                <span className="text-sm text-neutral-400 mt-0.5">+0 pts</span>
              </>
            )}

            <div className="mt-3 flex items-center gap-3 text-xs font-semibold px-4 py-1.5 rounded-full bg-white/[0.06] border border-white/10 text-white/80">
              <span className="font-mono font-bold text-white">{gameState.score || 0} pts</span>
              <span>&bull;</span>
              <span className="flex items-center gap-1 font-mono">
                Rank #{gameState.playerRank || 1}
                {gameState.rankDelta > 0 ? (
                  <span className="text-emerald-400 font-bold flex items-center">
                    <TrendingUp size={12} /> +{gameState.rankDelta}
                  </span>
                ) : gameState.rankDelta < 0 ? (
                  <span className="text-rose-400 font-bold flex items-center">
                    <TrendingDown size={12} /> {gameState.rankDelta}
                  </span>
                ) : (
                  <span className="text-neutral-400 flex items-center">
                    <Minus size={12} />
                  </span>
                )}
              </span>
            </div>
          </div>
        </header>

        {/* Tab Toggle */}
        <div className="relative z-10 flex items-center justify-center gap-2 mb-3">
          <button
            type="button"
            onClick={() => setResultsActiveTab('stats')}
            className={`h-11 px-6 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
              resultsActiveTab === 'stats'
                ? 'bg-white text-black shadow-lg font-black'
                : 'bg-white/[0.06] text-neutral-400 hover:text-white border border-white/10'
            }`}
          >
            Stats
          </button>
          <button
            type="button"
            onClick={() => setResultsActiveTab('leaderboard')}
            className={`h-11 px-6 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
              resultsActiveTab === 'leaderboard'
                ? 'bg-white text-black shadow-lg font-black'
                : 'bg-white/[0.06] text-neutral-400 hover:text-white border border-white/10'
            }`}
          >
            Ranks
          </button>
        </div>

        <main className="relative z-10 flex-1 overflow-y-auto mb-2 no-scrollbar">
          {resultsActiveTab === 'stats' ? (
            <div className="space-y-3 bg-white/[0.03] backdrop-blur-2xl border border-white/10 p-5 rounded-3xl shadow-2xl">
              {PAD_OPTIONS.map(opt => {
                const count = optionCounts[opt.index] || 0;
                const percentage = Math.round((count / totalAnswers) * 100);
                const isThisCorrect = opt.index === correctIndex;

                return (
                  <div key={opt.index} className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <div className="flex items-center gap-2">
                        <span className={`w-3.5 h-3.5 rounded-full ${opt.color} shadow-sm`} />
                        <span className="text-white font-bold">{opt.name}</span>
                        {isThisCorrect && (
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                            <Check size={11} className="stroke-[3]" /> Correct
                          </span>
                        )}
                      </div>
                      <span className="text-neutral-400 font-mono text-xs font-bold">
                        {count} ({percentage}%)
                      </span>
                    </div>

                    <div className="w-full h-3 bg-white/[0.06] rounded-xl overflow-hidden p-0.5 border border-white/5">
                      <div
                        className={`h-full rounded-lg transition-all duration-500 ${opt.color} shadow-md`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-2.5">
              {leaderboard.map((item, idx) => {
                const isMe = item.nickname === session.nickname;
                return (
                  <motion.div
                    key={item._id}
                    layout
                    className={`p-3.5 rounded-2xl border flex items-center justify-between transition-all backdrop-blur-xl ${
                      isMe
                        ? 'bg-indigo-500/20 border-indigo-500/50 shadow-lg shadow-indigo-500/20'
                        : 'bg-white/[0.04] border-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-7 h-7 rounded-xl flex items-center justify-center font-mono font-black text-xs ${
                        idx === 0 ? 'bg-amber-400 text-black' : idx === 1 ? 'bg-slate-300 text-black' : idx === 2 ? 'bg-amber-700 text-white' : 'bg-white/[0.08] text-neutral-300'
                      }`}>
                        #{idx + 1}
                      </span>
                      <CharacterAvatar
                        config={item.avatarConfig || avatarConfig}
                        mode="bust"
                        size={36}
                        animate="none"
                      />
                      <div>
                        <span className="text-sm font-bold text-white block">{item.nickname}</span>
                        <span className="text-xs text-neutral-400 font-mono font-bold">{item.score} pts</span>
                      </div>
                    </div>

                    <div className="text-xs font-bold font-mono">
                      {item.delta > 0 ? (
                        <span className="text-emerald-400 flex items-center gap-0.5 font-bold">
                          <TrendingUp size={13} /> +{item.delta}
                        </span>
                      ) : item.delta < 0 ? (
                        <span className="text-rose-400 flex items-center gap-0.5 font-bold">
                          <TrendingDown size={13} /> {item.delta}
                        </span>
                      ) : (
                        <span className="text-neutral-500">
                          <Minus size={13} />
                        </span>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </main>

        <footer className="relative z-10 text-center text-xs font-mono text-neutral-500 py-1">
          Next question starting soon...
        </footer>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // SCREEN 7: GRAND FINALE PODIUM & CELEBRATION
  // ---------------------------------------------------------------------------
  if (gameState && gameState.status === 'ended') {
    const podium = gameState.podium || [];
    const allParticipants = gameState.allParticipants || [];

    const first = podium[0];
    const second = podium[1];
    const third = podium[2];

    return (
      <div className="h-screen w-full bg-black text-white flex flex-col justify-between p-4 sm:p-6 max-w-xl mx-auto relative overflow-hidden select-none">
        <style>{`
          @keyframes danmaku-podium {
            0% { transform: translateX(100vw); }
            100% { transform: translateX(-150%); }
          }
        `}</style>

        {/* Background Atmosphere */}
        <Squares
          direction="diagonal"
          speed={0.3}
          squareSize={48}
          borderColor="rgba(255, 255, 255, 0.03)"
          hoverFillColor="rgba(94, 92, 230, 0.2)"
        />

        {/* Floating Live Danmaku Comments Overlay */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-25">
          {podiumComments && podiumComments.slice(0, 15).map((c, idx) => {
            const topPct = 8 + ((idx % 5) * 15);
            const animDuration = 8 + ((idx % 3) * 2.5);
            return (
              <div
                key={c._id || idx}
                className="absolute whitespace-nowrap px-4 py-1.5 rounded-full bg-black/85 backdrop-blur-md border border-amber-400/30 text-white shadow-2xl flex items-center gap-2 text-xs font-semibold pointer-events-none"
                style={{
                  top: `${topPct}%`,
                  animation: `danmaku-podium ${animDuration}s linear infinite`,
                  animationDelay: `${(idx * 1.6) % 5}s`
                }}
              >
                <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_#F59E0B]" />
                <span className="font-bold text-amber-300">{c.author}:</span>
                <span className="text-white">{c.text}</span>
              </div>
            );
          })}
        </div>

        {/* Ambient Spotlight */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[160px] pointer-events-none z-1" />

        <header className="relative z-10 text-center pt-2 pb-2">
          <ShinyText text="Podium" speed={2.5} className="text-3xl font-black text-white tracking-wide" />
        </header>

        {/* 3-Place Podium with Ladder Climbing Animation */}
        <div className="relative z-10 flex items-end justify-center gap-3 mb-2">
          {/* 2nd Place: Silver Ladder Climb */}
          {second && (
            <motion.div
              initial={{ y: 90, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.9, delay: 0.8, type: 'spring', bounce: 0.35 }}
              className="flex-1 flex flex-col items-center max-w-[110px]"
            >
              <CharacterAvatar
                config={second.avatarConfig || avatarConfig}
                mode="fullBody"
                size={75}
                animate="celebrate"
              />
              <span className="text-xs font-bold text-white truncate max-w-full mt-1.5 mb-1">
                {second.nickname}
              </span>
              <div className="w-full h-24 bg-gradient-to-t from-slate-600 to-slate-400 border-t-2 border-slate-300 rounded-t-3xl flex flex-col items-center justify-between p-2 font-black text-base text-black shadow-xl shadow-slate-900/50 relative overflow-hidden">
                <div className="w-full flex flex-col items-center gap-1.5 opacity-30 mt-1">
                  <div className="w-3/4 h-1 bg-white/70 rounded-full" />
                  <div className="w-3/4 h-1 bg-white/70 rounded-full" />
                  <div className="w-3/4 h-1 bg-white/70 rounded-full" />
                </div>
                <span>2nd</span>
              </div>
            </motion.div>
          )}

          {/* 1st Place: Gold Crown & Ladder Peak Climb */}
          {first && (
            <motion.div
              initial={{ y: 130, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 1.1, delay: 1.5, type: 'spring', bounce: 0.4 }}
              className="flex-1 flex flex-col items-center max-w-[130px] z-10"
            >
              <Crown size={28} className="text-amber-300 animate-bounce mb-1 drop-shadow-[0_0_10px_rgba(251,191,36,0.6)]" />
              <CharacterAvatar
                config={first.avatarConfig || avatarConfig}
                mode="fullBody"
                size={95}
                animate="celebrate"
              />
              <span className="text-xs font-black text-amber-300 truncate max-w-full mt-1.5 mb-1">
                {first.nickname}
              </span>
              <div className="w-full h-32 bg-gradient-to-t from-amber-500 to-yellow-400 border-t-2 border-yellow-200 rounded-t-3xl flex flex-col items-center justify-between p-2 font-black text-xl text-black shadow-2xl shadow-amber-500/30 relative overflow-hidden">
                <div className="w-full flex flex-col items-center gap-2 opacity-35 mt-1">
                  <div className="w-3/4 h-1 bg-black rounded-full" />
                  <div className="w-3/4 h-1 bg-black rounded-full" />
                  <div className="w-3/4 h-1 bg-black rounded-full" />
                  <div className="w-3/4 h-1 bg-black rounded-full" />
                </div>
                <span>1st</span>
              </div>
            </motion.div>
          )}

          {/* 3rd Place: Bronze Ladder Climb */}
          {third && (
            <motion.div
              initial={{ y: 70, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.2, type: 'spring', bounce: 0.35 }}
              className="flex-1 flex flex-col items-center max-w-[110px]"
            >
              <CharacterAvatar
                config={third.avatarConfig || avatarConfig}
                mode="fullBody"
                size={70}
                animate="celebrate"
              />
              <span className="text-xs font-bold text-white truncate max-w-full mt-1.5 mb-1">
                {third.nickname}
              </span>
              <div className="w-full h-20 bg-gradient-to-t from-amber-900 to-amber-700 border-t-2 border-amber-600 rounded-t-3xl flex flex-col items-center justify-between p-2 font-black text-base text-amber-200 shadow-xl shadow-amber-950/50 relative overflow-hidden">
                <div className="w-full flex flex-col items-center gap-1.5 opacity-30 mt-1">
                  <div className="w-3/4 h-1 bg-white/70 rounded-full" />
                  <div className="w-3/4 h-1 bg-white/70 rounded-full" />
                </div>
                <span>3rd</span>
              </div>
            </motion.div>
          )}
        </div>

        {/* Personal Standing */}
        <div className="relative z-10 bg-white/[0.04] backdrop-blur-2xl border border-white/10 rounded-2xl p-3 text-center mb-2 shadow-xl">
          <span className="text-xs sm:text-sm text-neutral-300 font-medium">
            You finished <b className="text-indigo-400 font-black">#{gameState.finalRank || 1}</b> with{' '}
            <b className="text-emerald-400 font-mono font-bold">{gameState.finalScore || 0} pts</b>
          </span>
        </div>

        {/* Class Celebration Parade */}
        <div className="relative z-10 bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-2.5 mb-2 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-4 min-w-max">
            {allParticipants.map((p, idx) => (
              <div key={p._id || idx} className="flex flex-col items-center text-center">
                <CharacterAvatar
                  config={p.avatarConfig || avatarConfig}
                  mode="fullBody"
                  size={48}
                  animate="celebrate"
                />
                <span className="text-[11px] font-bold text-white truncate max-w-[65px] mt-1">{p.nickname}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Live Danmaku Floating Comment Input Bar */}
        <form onSubmit={handleSendPodiumComment} className="relative z-20 flex items-center gap-2 mb-2">
          <input
            type="text"
            value={newPodiumComment}
            onChange={e => setNewPodiumComment(e.target.value)}
            placeholder="Send a live comment to podium..."
            maxLength={80}
            className="flex-1 h-12 px-4 rounded-2xl bg-white/[0.06] backdrop-blur-xl border border-white/15 text-white placeholder:text-neutral-500 text-xs focus:outline-none focus:border-amber-400/60"
          />
          <button
            type="submit"
            disabled={!newPodiumComment.trim() || sendingComment}
            className="h-12 px-5 rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-500 hover:brightness-110 active:scale-95 disabled:opacity-40 text-black font-extrabold text-xs shadow-lg shadow-amber-500/20 flex items-center gap-1.5 transition cursor-pointer"
          >
            <Send size={14} />
            <span>Send</span>
          </button>
        </form>

        <button
          type="button"
          onClick={handleLeaveGame}
          className="relative z-10 h-12 w-full rounded-2xl bg-gradient-to-r from-[#5E5CE6] to-[#0A84FF] hover:brightness-110 active:scale-95 text-white font-black text-sm shadow-xl shadow-[#5E5CE6]/30 transition-all flex items-center justify-center cursor-pointer"
        >
          Home
        </button>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // INTERACTIVE CLASSROOM PRESENTATION (SLIDES / VIDEO / YOUTUBE)
  // ---------------------------------------------------------------------------
  if (gameState && (gameState.type === 'presentation' || gameState.type === 'slides')) {
    const isLive = gameState.status === 'live';
    const presentation = gameState.presentation || {};
    const isPdf = presentation.type === 'pdf' || presentation.type === 'slides';
    const isVideo = presentation.type === 'video';
    const isYt = presentation.type === 'youtube';
    const canComment = gameState.player?.canComment !== false && gameState.player?.status !== 'muted';

    return (
      <div className="h-screen w-full bg-black text-white flex flex-col justify-between p-4 sm:p-6 max-w-2xl mx-auto relative overflow-hidden select-none">
        <style>{`
          @keyframes danmaku-student {
            0% { transform: translateX(100vw); }
            100% { transform: translateX(-150%); }
          }
        `}</style>

        {/* Background Atmosphere */}
        <Squares
          direction="diagonal"
          speed={0.3}
          squareSize={48}
          borderColor="rgba(255, 255, 255, 0.03)"
          hoverFillColor="rgba(94, 92, 230, 0.2)"
        />

        {/* Ambient Top Spotlight */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[140px] pointer-events-none z-1" />

        {/* Header Bar */}
        <header className="relative z-10 w-full flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/[0.06] border border-white/10">
              <span className="text-[10px] font-mono font-black uppercase text-neutral-400 tracking-wider">CODE</span>
              <span className="font-mono font-black text-sm text-white tracking-widest">
                {gameState.pin || session?.pin}
              </span>
            </div>

            <span className="text-xs font-mono font-bold text-neutral-400 truncate max-w-[150px] sm:max-w-xs">
              {presentation.title || 'Live Stream'}
            </span>
          </div>

          <button
            onClick={handleLeaveGame}
            title="Leave Session"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-red-500/15 border border-white/10 hover:border-red-500/30 text-white/70 hover:text-red-400 font-bold text-xs transition cursor-pointer active:scale-95"
          >
            <LogOut size={14} />
            <span>Leave</span>
          </button>
        </header>

        {/* Main Presentation Viewport */}
        <main className="relative z-10 flex-1 my-3 flex flex-col justify-center">
          <div className="relative w-full h-[50vh] sm:h-[56vh] rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-black flex items-center justify-center">
            {isYt && (
              <iframe
                src={`https://www.youtube.com/embed/${presentation.youtubeVideoId}?autoplay=1&mute=0`}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title="Presentation Video"
              />
            )}

            {isVideo && (
              <video
                src={presentation.fileUrl}
                controls
                autoPlay
                className="w-full h-full object-contain"
              />
            )}

            {isPdf && (
              <iframe
                src={`${presentation.fileUrl}#page=${(gameState.currentIndex || 0) + 1}&toolbar=1`}
                className="w-full h-full bg-white"
                title="Presentation Slide"
              />
            )}

            {!isYt && !isVideo && !isPdf && (
              <div className="text-center p-6 space-y-2">
                <h3 className="text-xl font-bold text-white">{gameState.slide?.title || 'Class Presentation'}</h3>
                <p className="text-xs text-white/70">{gameState.slide?.body || 'Follow along with the teacher.'}</p>
              </div>
            )}

            {/* Danmaku Bullet Comments Overlay */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
              {gameState.comments && gameState.comments.slice(0, 12).map((c, idx) => {
                const topPct = 10 + ((idx % 5) * 16);
                const animDuration = 8 + ((idx % 3) * 2);
                return (
                  <div
                    key={c._id || idx}
                    className="absolute whitespace-nowrap px-3.5 py-1.5 rounded-full bg-black/85 backdrop-blur-md border border-white/20 text-white shadow-2xl flex items-center gap-2 text-xs font-semibold pointer-events-none"
                    style={{
                      top: `${topPct}%`,
                      animation: `danmaku-student ${animDuration}s linear infinite`,
                      animationDelay: `${(idx * 1.5) % 6}s`
                    }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#34D399]" />
                    <span className="font-bold text-indigo-300">{c.author || 'Student'}:</span>
                    <span>{c.text}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </main>

        {/* Bottom Interactive Classroom Dock */}
        <footer className="relative z-10 w-full space-y-3">
          {/* Class Monitor Mute Warning Notice */}
          {!canComment && (
            <div className="flex items-center justify-center gap-2 py-2 px-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-bold shadow-lg animate-pulse">
              <Lock size={14} />
              <span>Live commenting disabled by Class Monitor</span>
            </div>
          )}

          {/* Quick Reaction Row: Confused, Repeat, Doubt */}
          <div className="grid grid-cols-3 gap-2.5">
            {/* Confused Button */}
            <button
              type="button"
              onClick={handleConfused}
              className={`h-12 rounded-2xl border text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer shadow-lg ${
                confusedSent
                  ? 'bg-amber-500/25 border-amber-500 text-amber-300 shadow-amber-500/30'
                  : 'bg-white/[0.05] border-white/10 text-white/80 hover:bg-white/10'
              }`}
            >
              <AlertTriangle size={15} className={confusedSent ? 'text-amber-400' : 'text-amber-400/80'} />
              <span>{confusedSent ? 'Sent!' : 'Confused'}</span>
            </button>

            {/* Repeat Button */}
            <button
              type="button"
              onClick={handleRepeat}
              className={`h-12 rounded-2xl border text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer shadow-lg ${
                repeatSent
                  ? 'bg-cyan-500/25 border-cyan-500 text-cyan-300 shadow-cyan-500/30'
                  : 'bg-white/[0.05] border-white/10 text-white/80 hover:bg-white/10'
              }`}
            >
              <Repeat size={15} className={repeatSent ? 'text-cyan-400' : 'text-cyan-400/80'} />
              <span>{repeatSent ? 'Sent!' : 'Repeat'}</span>
            </button>

            {/* Doubt Button */}
            <button
              type="button"
              onClick={() => setShowAskDoubt(true)}
              className="h-12 rounded-2xl bg-white/[0.05] hover:bg-white/10 border border-white/10 text-white/80 text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer shadow-lg"
            >
              <HelpCircle size={15} className="text-indigo-400" />
              <span>Doubt</span>
            </button>
          </div>

          {/* Live Bullet Comment Input Bar */}
          <form onSubmit={handleSlideComment} className="flex items-center gap-2.5">
            <div className="relative flex-1">
              <input
                type="text"
                value={slideComment}
                onChange={e => setSlideComment(e.target.value)}
                disabled={!canComment}
                placeholder={
                  !canComment
                    ? "Commenting disabled by Class Monitor"
                    : "Type a live bullet comment..."
                }
                className="w-full h-14 pl-4 pr-10 bg-white/[0.05] disabled:bg-rose-500/5 border border-white/10 disabled:border-rose-500/30 focus:border-indigo-400 rounded-2xl text-white text-xs outline-none transition font-medium placeholder:text-white/30"
              />
              {!canComment && (
                <Lock size={15} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-rose-400" />
              )}
            </div>

            <button
              type="submit"
              disabled={!slideComment.trim() || !canComment}
              className="w-14 h-14 rounded-2xl bg-gradient-to-r from-[#5E5CE6] to-[#0A84FF] hover:brightness-110 disabled:opacity-20 text-white flex items-center justify-center transition active:scale-95 cursor-pointer shadow-lg shadow-[#5E5CE6]/30 shrink-0"
            >
              <Send size={18} />
            </button>
          </form>
        </footer>

        {/* Ask Doubt Modal */}
        {showAskDoubt && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50">
            <div className="bg-[#121214]/95 border border-white/15 p-6 rounded-3xl max-w-sm w-full space-y-4 shadow-2xl">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <HelpCircle size={18} className="text-indigo-400" />
                  <h3 className="text-base font-black text-white">Ask a Question</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAskDoubt(false)}
                  className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white cursor-pointer"
                >
                  <X size={15} />
                </button>
              </div>

              <form onSubmit={handleSendDoubt} className="space-y-4">
                <textarea
                  value={doubtText}
                  onChange={e => setDoubtText(e.target.value)}
                  placeholder="Type your question for the teacher..."
                  className="w-full h-28 p-3.5 bg-white/[0.05] border border-white/10 focus:border-indigo-400 rounded-2xl text-white text-xs outline-none resize-none font-medium placeholder:text-white/30"
                  required
                />

                <div className="flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setShowAskDoubt(false)}
                    className="px-5 py-2.5 rounded-xl bg-white/[0.06] text-white/70 hover:text-white text-xs font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#5E5CE6] to-[#0A84FF] text-white font-bold text-xs shadow-lg active:scale-95 cursor-pointer"
                  >
                    Submit
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-black text-white flex items-center justify-center">
      <Sparkles className="animate-spin text-[#5E5CE6]" size={18} />
    </div>
  );
}
