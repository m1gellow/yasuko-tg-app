import React, { useState, useEffect, useRef } from 'react';
import { useTelegram } from '../../../../../contexts/TelegramContext';
import { BoltIcon } from 'lucide-react';
import { gameService } from '../../../../../services/gameService';
import GameArea from './GameArea';
import GameHeader from './GameHeader';
import StartScreen from './StartScreen';
import GameOverScreen from './GameOverScreen';
import PauseScreen from './PauseScreen';
import GameStats from './GameStats';
import { useAuth } from '../../../../../contexts/AuthContext';

interface NutCatcherGameProps {
  onClose: () => void;
  onEnergyEarned: (amount: number) => void;
}

const NutCatcherGame: React.FC<NutCatcherGameProps> = ({ onClose, onEnergyEarned }) => {
  const [gameActive, setGameActive] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [energyEarned, setEnergyEarned] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [highScore, setHighScore] = useState(() => {
    return parseInt(localStorage.getItem('nutCatcherHighScore') || '0');
  });
  const [gamesPlayed, setGamesPlayed] = useState(() => {
    const storedGames = localStorage.getItem('nutCatcherGamesPlayed');
    if (!storedGames) return 0;

    try {
      const gamesData = JSON.parse(storedGames);
      const today = new Date().toISOString().split('T')[0];
      if (gamesData.date !== today) return 0;
      return gamesData.count;
    } catch {
      return 0;
    }
  });
  const [canPlay, setCanPlay] = useState(true);
  const [showTips, setShowTips] = useState(false);
  const [showRewardAnimation, setShowRewardAnimation] = useState(false);
  const [timeToReset, setTimeToReset] = useState('');
  const [energyWasSent, setEnergyWasSent] = useState(false); // Новое состояние
  const gameTimerRef = useRef<NodeJS.Timeout | null>(null);
  const resetTimerRef = useRef<NodeJS.Timeout | null>(null);
  const { user } = useAuth();
  const { telegram } = useTelegram();

  // Проверка лимита игр
  useEffect(() => {
    const maxDailyGames = 3;
    setCanPlay(gamesPlayed < maxDailyGames);
  }, [gamesPlayed]);

  // Таймер до сброса лимита
  useEffect(() => {
    const calculateTimeToReset = () => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      const diffMs = tomorrow.getTime() - now.getTime();
      const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const diffSecs = Math.floor((diffMs % (1000 * 60)) / 1000);

      return `${diffHrs.toString().padStart(2, '0')}:${diffMins.toString().padStart(2, '0')}:${diffSecs.toString().padStart(2, '0')}`;
    };

    const updateTimer = () => {
      setTimeToReset(calculateTimeToReset());
    };

    setTimeToReset(calculateTimeToReset());
    resetTimerRef.current = setInterval(updateTimer, 1000);

    return () => {
      if (resetTimerRef.current) clearInterval(resetTimerRef.current);
    };
  }, []);

  // Таймер игры
  useEffect(() => {
    if (gameActive && !isPaused && !gameOver) {
      gameTimerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            endGame();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (gameTimerRef.current) clearInterval(gameTimerRef.current);
    };
  }, [gameActive, isPaused, gameOver]);

  const recordGamePlayed = () => {
    const today = new Date().toISOString().split('T')[0];
    const newCount = gamesPlayed + 1;

    localStorage.setItem(
      'nutCatcherGamesPlayed',
      JSON.stringify({ date: today, count: newCount })
    );

    setGamesPlayed(newCount);
  };

  const startGame = () => {
    if (!canPlay) {
      if (telegram?.HapticFeedback) {
        telegram.HapticFeedback.notificationOccurred('error');
      }
      alert('Вы достигли лимита игр на сегодня (3 игры). Приходите завтра!');
      return;
    }

    setGameActive(true);
    setGameOver(false);
    setScore(0);
    setEnergyEarned(0);
    setTimeLeft(60);
    setIsPaused(false);
    setEnergyWasSent(false); // Сбрасываем флаг при новой игре
    recordGamePlayed();

    if (user) {
      gameService
        .trackUserAction(user.id, 'game_started', {
          game: 'nut_catcher',
          games_played_today: gamesPlayed + 1,
          timestamp: new Date().toISOString(),
        })
        .catch(console.error);
    }

    if (telegram?.HapticFeedback) {
      telegram.HapticFeedback.impactOccurred('medium');
    }
  };

  const togglePause = () => {
    const newPausedState = !isPaused;
    setIsPaused(newPausedState);

    if (user) {
      gameService
        .trackUserAction(user.id, newPausedState ? 'game_paused' : 'game_resumed', {
          game: 'nut_catcher',
          time_left: timeLeft,
          score: score,
          timestamp: new Date().toISOString(),
        })
        .catch(console.error);
    }

    if (telegram?.HapticFeedback) {
      telegram.HapticFeedback.selectionChanged();
    }
  };

  const endGame = () => {
    setGameActive(false);
    setGameOver(true);

    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem('nutCatcherHighScore', score.toString());
    }

    // Начисляем энергию сразу, без ожидания анимации
    if (!energyWasSent && energyEarned > 0) {
      onEnergyEarned(energyEarned);
      setEnergyWasSent(true);
    }

    setShowRewardAnimation(true);
    setTimeout(() => {
      setShowRewardAnimation(false);
      
      // Дублирующая проверка на случай, если энергия не была отправлена ранее
      if (!energyWasSent && energyEarned > 0) {
        onEnergyEarned(energyEarned);
        setEnergyWasSent(true);
      }

      if (user) {
        try {
          const notificationData = {
            user_id: user.id,
            type: 'reward',
            title: 'Награда за мини-игру',
            message: `Вы заработали +${energyEarned} энергии в игре "Ловитель орехов"!`,
            data: {
              game: 'nut-catcher',
              reward_type: 'energy',
              amount: energyEarned,
            },
          };

          fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/notifications`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            },
            body: JSON.stringify(notificationData),
          }).catch(console.error);

          gameService
            .trackUserAction(user.id, 'game_finished', {
              game: 'nut_catcher',
              score: score,
              energy_earned: energyEarned,
              high_score: Math.max(highScore, score),
              is_high_score: score > highScore,
              game_duration: 60 - timeLeft,
              timestamp: new Date().toISOString(),
            })
            .catch(console.error);
        } catch (err) {
          console.error('Ошибка при создании уведомления:', err);
        }
      }
    }, 2000);

    if (telegram?.HapticFeedback) {
      telegram.HapticFeedback.impactOccurred('medium');
    }
  };

  const closeGame = () => {
    if (telegram?.HapticFeedback) {
      telegram.HapticFeedback.impactOccurred('light');
    }

    // Начисляем энергию при выходе, если она ещё не была начислена
    if (!energyWasSent && energyEarned > 0) {
      onEnergyEarned(energyEarned);
      setEnergyWasSent(true);
    }

    if (gameTimerRef.current) clearInterval(gameTimerRef.current);
    if (resetTimerRef.current) clearInterval(resetTimerRef.current);
    onClose();
  };

  const handleScoreUpdate = (points: number) => {
    setScore(prev => prev + points);
    setEnergyEarned(prev => prev + points);

    if (telegram?.HapticFeedback) {
      telegram.HapticFeedback.impactOccurred('light');
    }
  };

  const toggleTips = () => {
    setShowTips(!showTips);
  };

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex flex-col items-center justify-center p-0 touch-none md:p-4">
      <div className="bg-[#1a1625] w-full h-full md:max-w-lg md:h-auto md:max-h-[90vh] rounded-lg overflow-hidden shadow-xl relative md:rounded-xl">
        <GameHeader
          title="ЛОВИТЕЛЬ ОРЕХОВ"
          isPaused={isPaused}
          isGameActive={gameActive && !gameOver}
          onTogglePause={togglePause}
          onClose={closeGame}
        />

        <GameStats score={score} energyEarned={energyEarned} timeLeft={timeLeft} />

        <GameArea
          isActive={gameActive && !gameOver && !isPaused}
          onScoreUpdate={handleScoreUpdate}
        />

        {showRewardAnimation && (
          <div className="absolute inset-0 flex items-center justify-center z-30 bg-black/70">
            <div className="bg-yellow-500 text-black px-8 py-6 rounded-lg animate-bounce flex flex-col items-center">
              <BoltIcon size={48} className="mb-2" />
              <h3 className="text-xl font-bold">+{energyEarned} ЭНЕРГИИ!</h3>
            </div>
          </div>
        )}

        {isPaused && <PauseScreen onResume={togglePause} onExit={closeGame} />}

        {!gameActive && !gameOver && (
          <StartScreen
            onStart={startGame}
            highScore={highScore}
            gamesPlayed={gamesPlayed}
            gamesLimit={3}
            canPlay={canPlay}
            onShowTips={toggleTips}
            showTips={showTips}
            timeToReset={timeToReset}
            onClose={closeGame}
          />
        )}

        {gameOver && (
          <GameOverScreen
            score={score}
            energyEarned={energyEarned}
            highScore={highScore}
            onRestart={startGame}
            onExit={closeGame}
            canPlay={canPlay}
            timeToReset={timeToReset}
          />
        )}
      </div>
    </div>
  );
};

export default NutCatcherGame;