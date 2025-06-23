import React, { useState, useEffect, useRef, useCallback } from 'react';
import Squirrel from './Squirrel';
import Basket from './Basket';
import Nut from './Nut';
import ComboMessage from './ComboMessage';
import Tree from './Tree';
import NutCatchAnimation from './NutCatchAnimation';
import { useTelegram } from '../../../contexts/TelegramContext';
import { FlameIcon, ZapIcon, StarIcon, ClockIcon, AwardIcon } from 'lucide-react';

export const NUT_TYPES = ['acorn', 'walnut', 'hazelnut'] as const;
export const NUT_POINTS = {
  acorn: 1,
  walnut: 2,
  hazelnut: 3
};

export interface Nut {
  id: number;
  x: number;
  y: number;
  speed: number;
  rotation: number;
  size: number;
  type: 'acorn' | 'walnut' | 'hazelnut';
}

interface GameAreaProps {
  isActive: boolean;
  onScoreUpdate: (points: number) => void;
  onTimerUpdate: () => void;
  remainingTime: number;
}

const GameArea: React.FC<GameAreaProps> = ({ isActive, onScoreUpdate, onTimerUpdate, remainingTime }) => {
  const [nuts, setNuts] = useState<Nut[]>([]);
  const [basketPosition, setBasketPosition] = useState(50);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [gameWidth, setGameWidth] = useState(0);
  const [gameHeight, setGameHeight] = useState(0);
  const [squirrel, setSquirrel] = useState({ 
    position: 50, 
    direction: 1, 
    throwing: false, 
    frame: 0 
  });
  const [comboMultiplier, setComboMultiplier] = useState(1);
  const [comboTimer, setComboTimer] = useState(0);
  const [showComboMessage, setShowComboMessage] = useState(false);
  const [comboMessage, setComboMessage] = useState('');
  const [nutCatchAnimation, setNutCatchAnimation] = useState<{x: number, y: number, active: boolean, type: string}>({
    x: 0, y: 0, active: false, type: 'acorn'
  });
  const [score, setScore] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<number | null>(null);
  const lastNutTime = useRef<number>(0);
  const nutIdCounter = useRef<number>(0);
  const animationFrameRef = useRef<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const tapSoundRef = useRef<HTMLAudioElement | null>(null);
  const [audioLoaded, setAudioLoaded] = useState(false);
  
  const { telegram } = useTelegram();
  
  const COMBO_DURATION = 3;
  const BASKET_WIDTH_PERCENTAGE = 25;
  const GAME_DURATION = 60;

  // Загрузка звуков
  useEffect(() => {
    try {
      tapSoundRef.current = new Audio('/assets/audio/tap-sound.mp3');
      tapSoundRef.current.addEventListener('canplaythrough', () => setAudioLoaded(true));
      tapSoundRef.current.addEventListener('error', () => setAudioLoaded(false));
      
      return () => {
        if (tapSoundRef.current) {
          tapSoundRef.current.pause();
          tapSoundRef.current.removeEventListener('canplaythrough', () => {});
          tapSoundRef.current.removeEventListener('error', () => {});
        }
      };
    } catch (error) {
      console.warn('Ошибка при инициализации аудио:', error);
    }
  }, []);

  // Инициализация размеров игры
  useEffect(() => {
    if (gameAreaRef.current) {
      const { clientWidth, clientHeight } = gameAreaRef.current;
      setGameWidth(clientWidth);
      setGameHeight(clientHeight);
    }
    
    nutIdCounter.current = 0;
    lastNutTime.current = 0;
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, []);
  
  const handleResize = () => {
    if (gameAreaRef.current) {
      const { clientWidth, clientHeight } = gameAreaRef.current;
      setGameWidth(clientWidth);
      setGameHeight(clientHeight);
    }
  };

  // Анимация белки
  useEffect(() => {
    if (!isActive) return;
    
    const animateSquirrel = () => {
      animationFrameRef.current = (animationFrameRef.current + 1) % 60;
      
      if (animationFrameRef.current % 10 === 0) {
        setSquirrel(prev => ({
          ...prev,
          frame: (prev.frame + 1) % 4,
          throwing: Math.random() > 0.7
        }));
      }
      
      setSquirrel(prev => {
        const newDirection = Math.random() > 0.98 ? prev.direction * -1 : prev.direction;
        let newPosition = prev.position + newDirection * 0.5;
        
        if (newPosition < 10) {
          return { ...prev, position: 10, direction: 1, frame: prev.frame };
        } else if (newPosition > 90) {
          return { ...prev, position: 90, direction: -1, frame: prev.frame };
        }
        
        return { 
          ...prev, 
          position: newPosition, 
          direction: newDirection,
          frame: prev.frame
        };
      });
    };
    
    const interval = setInterval(animateSquirrel, 50);
    return () => clearInterval(interval);
  }, [isActive]);
  
  // Таймер игры
  useEffect(() => {
    if (!isActive) {
      if (timerRef.current) clearInterval(timerRef.current);
      setElapsedTime(0);
      return;
    }
    
    timerRef.current = setInterval(() => {
      setElapsedTime(prev => prev + 1);
      onTimerUpdate();
    }, 1000);
    
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, onTimerUpdate]);

  // Комбо-таймер
  useEffect(() => {
    if (!isActive || comboTimer <= 0) return;
    
    const interval = setInterval(() => {
      setComboTimer(prev => {
        if (prev <= 0) {
          setComboMultiplier(1);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [comboTimer, isActive]);
  
  // Сообщение о комбо
  useEffect(() => {
    if (!showComboMessage) return;
    
    const timeout = setTimeout(() => {
      setShowComboMessage(false);
    }, 1500);
    
    return () => clearTimeout(timeout);
  }, [showComboMessage]);
  
  // Игровой цикл
  useEffect(() => {
    if (!isActive) {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      return;
    };
    
    const gameLoop = (timestamp: number) => {
      const speedMultiplier = 1 + (elapsedTime / GAME_DURATION) * 0.5;
      
      // Создание новых орехов
      if (timestamp - lastNutTime.current > 800 - Math.min(400, score * 10)) {
        lastNutTime.current = timestamp;
        
        if (squirrel.throwing) {
          const nutTypeRand = Math.random();
          const nutType = 
            nutTypeRand < 0.7 ? 'acorn' :
            nutTypeRand < 0.85 ? 'walnut' : 'hazelnut';
          
          const newNut: Nut = {
            id: nutIdCounter.current++,
            x: squirrel.position + (Math.random() * 10) - 5,
            y: 10,
            speed: (2 + Math.random() * 3 + Math.min(3, score / 20)) * speedMultiplier,
            rotation: Math.random() * 360,
            size: nutType === 'acorn' ? 25 + Math.random() * 15 : 40 + Math.random() * 20,
            type: nutType
          };
          
          setNuts(prevNuts => [...prevNuts, newNut]);
        } else if (Math.random() > 0.5) {
          const nutTypeRand = Math.random();
          const nutType = 
            nutTypeRand < 0.7 ? 'acorn' :
            nutTypeRand < 0.85 ? 'walnut' : 'hazelnut';
          
          const newNut: Nut = {
            id: nutIdCounter.current++,
            x: Math.random() * 80 + 10,
            y: 10,
            speed: (2 + Math.random() * 3 + Math.min(3, score / 20)) * speedMultiplier,
            rotation: Math.random() * 360,
            size: nutType === 'acorn' ? 25 + Math.random() * 15 : 40 + Math.random() * 20,
            type: nutType
          };
          
          setNuts(prevNuts => [...prevNuts, newNut]);
        }
      }
      
      // Обновление позиций орехов
      setNuts(prevNuts => {
        const updatedNuts = prevNuts.map(nut => {
          const newY = nut.y + nut.speed;
          const newRotation = nut.rotation + 5;
          
          // Проверка столкновения с корзиной
          if (newY > gameHeight - 100 && newY < gameHeight - 20) {
            const nutCenter = nut.x;
            const basketLeft = basketPosition - BASKET_WIDTH_PERCENTAGE / 2;
            const basketRight = basketPosition + BASKET_WIDTH_PERCENTAGE / 2;
            
            if (nutCenter > basketLeft && nutCenter < basketRight) {
              const pointsEarned = nut.type === 'acorn' ? 
                NUT_POINTS[nut.type] * comboMultiplier * 2 : 
                NUT_POINTS[nut.type] * comboMultiplier;
              
              if (tapSoundRef.current && audioLoaded) {
                tapSoundRef.current.currentTime = 0;
                tapSoundRef.current.play().catch(console.warn);
              }
              
              if (telegram?.HapticFeedback) {
                telegram.HapticFeedback.impactOccurred('light');
              }
              
              setScore(prev => Math.floor(prev + pointsEarned));
              onScoreUpdate(Math.floor(pointsEarned));
              
              setNutCatchAnimation({
                x: basketPosition,
                y: gameHeight - 70,
                active: true,
                type: nut.type
              });
              setTimeout(() => setNutCatchAnimation(prev => ({...prev, active: false})), 500);
              
              setComboMultiplier(prev => Math.min(3, prev + 0.1));
              setComboTimer(COMBO_DURATION);
              
              if (comboMultiplier >= 1.5 && comboMultiplier < 2 && !showComboMessage) {
                setComboMessage('КОМБО x1.5!');
                setShowComboMessage(true);
              } else if (comboMultiplier >= 2 && comboMultiplier < 2.5 && !showComboMessage) {
                setComboMessage('КОМБО x2!');
                setShowComboMessage(true);
              } else if (comboMultiplier >= 2.5 && !showComboMessage) {
                setComboMessage('СУПЕР КОМБО x3!');
                setShowComboMessage(true);
              }
              
              return null;
            }
          }
          
          if (newY > gameHeight) {
            setComboMultiplier(1);
            setComboTimer(0);
            return null;
          }
          
          return { ...nut, y: newY, rotation: newRotation };
        }).filter((nut): nut is Nut => nut !== null);
        
        return updatedNuts;
      });
      
      requestRef.current = requestAnimationFrame(gameLoop);
    };
    
    requestRef.current = requestAnimationFrame(gameLoop);
    
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isActive, score, basketPosition, gameHeight, squirrel, comboMultiplier, onScoreUpdate, audioLoaded, telegram, elapsedTime, showComboMessage]);
  
  // Обработчики управления
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    setTouchStart(e.touches[0].clientX);
  }, []);
  
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    if (touchStart === null || !gameWidth) return;
    const touchX = e.touches[0].clientX;
    const deltaX = touchX - touchStart;
    
    setBasketPosition(prev => Math.max(10, Math.min(90, prev + (deltaX / gameWidth * 100))));
    setTouchStart(touchX);
  }, [touchStart, gameWidth]);
  
  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    setTouchStart(null);
  }, []);
  
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!gameAreaRef.current) return;
    const rect = gameAreaRef.current.getBoundingClientRect();
    setBasketPosition(Math.max(10, Math.min(90, (e.clientX - rect.left) / rect.width * 100)));
  }, []);

  return (
    <div className="relative h-[70vh] max-h-[600px] w-full overflow-hidden">
      {/* Фон с градиентом и деревом */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0f2e4d] via-[#1a1538] to-[#0f0c1d]">
        <Tree />
      </div>
      
      {/* Игровая статистика */}
      <div className="absolute top-4 left-4 right-4 z-10 flex justify-between">
        <div className="bg-black/40 backdrop-blur-sm px-3 py-1 rounded-lg border border-yellow-500/30 flex items-center">
          <StarIcon className="text-yellow-400 mr-2" size={18} />
          <span className="font-bold text-white">{score}</span>
        </div>
        
        <div className="bg-black/40 backdrop-blur-sm px-3 py-1 rounded-lg border border-blue-500/30 flex items-center">
          <ClockIcon className="text-blue-400 mr-2" size={18} />
          <span className="font-bold text-white">{remainingTime}s</span>
        </div>
        
        {comboMultiplier > 1 && (
          <div className="bg-black/40 backdrop-blur-sm px-3 py-1 rounded-lg border border-purple-500/30 flex items-center animate-pulse">
            <FlameIcon className="text-purple-400 mr-2" size={18} />
            <span className="font-bold text-white">x{comboMultiplier.toFixed(1)}</span>
          </div>
        )}
      </div>
      
      {/* Игровое поле */}
      <div 
        ref={gameAreaRef}
        className="relative h-full w-full touch-none"
        onTouchStart={isActive ? handleTouchStart : undefined}
        onTouchMove={isActive ? handleTouchMove : undefined}
        onTouchEnd={isActive ? handleTouchEnd : undefined}
        onMouseMove={isActive ? handleMouseMove : undefined}
      >
        {/* Белка */}
        {isActive && (
          <Squirrel 
            position={squirrel.position}
            direction={squirrel.direction}
            frame={squirrel.frame}
            throwing={squirrel.throwing}
          />
        )}
        
        {/* Падающие орехи */}
        {nuts.map(nut => (
          <Nut key={nut.id} nut={nut} />
        ))}
        
        {/* Анимация поимки ореха */}
        {nutCatchAnimation.active && (
          <NutCatchAnimation 
            x={nutCatchAnimation.x}
            y={nutCatchAnimation.y}
            points={(NUT_POINTS[nutCatchAnimation.type as 'acorn' | 'walnut' | 'hazelnut'] * comboMultiplier).toFixed(0)}
            type={nutCatchAnimation.type}
          />
        )}
        
        {/* Корзина */}
        <Basket position={basketPosition} />
        
        {/* Сообщение о комбо */}
        {showComboMessage && (
          <ComboMessage message={comboMessage} />
        )}
      </div>
      
      {/* Подсказка управления */}
      {isActive && (
        <div className="absolute bottom-2 left-0 right-0 text-center">
          <p className="text-sm text-white/70">Двигайте корзину пальцем или мышью</p>
        </div>
      )}
    </div>
  );
};

export default GameArea;
export { Nut };