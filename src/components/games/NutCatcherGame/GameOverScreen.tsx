import React from 'react';
import { TrophyIcon, ZapIcon, ClockIcon, RefreshCwIcon, HomeIcon } from 'lucide-react';

interface GameOverScreenProps {
  score: number;
  energyEarned: number;
  highScore: number;
  onRestart: () => void;
  onExit: () => void;
  canPlay: boolean;
  timeToReset: string;
}

const GameOverScreen: React.FC<GameOverScreenProps> = ({ 
  score, 
  energyEarned, 
  highScore, 
  onRestart, 
  onExit,
  canPlay,
  timeToReset
}) => {
  const isNewRecord = score > highScore;

  return (
    <div className="absolute inset-0 bg-gradient-to-b from-[#0f0c1d]/90 to-[#1a1538]/90 flex flex-col items-center justify-center text-center p-6 z-20 backdrop-blur-sm overflow-auto">
      {/* Заголовок с градиентом */}
      <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600 mb-6 tracking-wide">
        ИГРА ОКОНЧЕНА
      </h2>

      {/* Статистика игры */}
      <div className="bg-gradient-to-br from-[#252538] to-[#1e1e32] p-5 rounded-xl border border-purple-500/20 shadow-lg w-full max-w-xs mb-6">
        <div className="space-y-4">
          {/* Счет */}
          <div className="flex justify-between items-center">
            <div className="flex items-center text-gray-300">
              <TrophyIcon size={18} className="mr-2" />
              <span>Счет:</span>
            </div>
            <span className="font-bold text-xl text-yellow-400">{score}</span>
          </div>
          
          {/* Энергия */}
          <div className="flex justify-between items-center">
            <div className="flex items-center text-gray-300">
              <ZapIcon size={18} className="mr-2" />
              <span>Энергия:</span>
            </div>
            <span className="font-bold text-xl text-blue-400">+{energyEarned}</span>
          </div>
          
          {/* Рекорд */}
          <div className="flex justify-between items-center">
            <div className="flex items-center text-gray-300">
              <TrophyIcon size={18} className="mr-2" />
              <span>Рекорд:</span>
            </div>
            <span className="font-bold text-xl">{highScore}</span>
          </div>
        </div>
      </div>

      {/* Кнопки действий */}
      <div className="flex flex-col space-y-3 w-full max-w-xs mb-4">
        {/* Кнопка рестарта */}
        <button 
          onClick={onRestart}
          disabled={!canPlay}
          className={`flex items-center justify-center py-3 rounded-xl font-bold transition-all ${
            canPlay 
              ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black shadow-lg hover:shadow-yellow-500/30'
              : 'bg-gradient-to-r from-gray-600 to-gray-700 text-gray-400'
          }`}
        >
          <RefreshCwIcon size={18} className="mr-2" />
          {canPlay ? 'ИГРАТЬ СНОВА' : 'ЛИМИТ ИСЧЕРПАН'}
        </button>
        
        {/* Кнопка выхода */}
        <button 
          onClick={onExit}
          className="flex items-center justify-center py-3 bg-gradient-to-r from-[#323248] to-[#3a3a5a] hover:from-[#3a3a5a] hover:to-[#42426a] text-white rounded-xl transition-all shadow-md hover:shadow-purple-500/20"
        >
          <HomeIcon size={18} className="mr-2" />
          ВЫЙТИ
        </button>
      </div>

      {/* Сообщение о лимите */}
      {!canPlay && (
        <div className="bg-gradient-to-r from-red-500/20 to-red-600/20 p-3 rounded-lg border border-red-500/30 w-full max-w-xs mb-4">
          <div className="flex items-center justify-center text-sm text-red-300 mb-1">
            <ClockIcon size={16} className="mr-2" />
            <span>Вы достигли дневного лимита игр</span>
          </div>
          <p className="text-xs text-gray-300">
            Сброс через: <span className="font-bold">{timeToReset}</span>
          </p>
        </div>
      )}

      {/* Сообщение о новом рекорде */}
      {isNewRecord && (
        <div className="mt-2 bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 p-3 rounded-lg border border-yellow-500/30 animate-pulse">
          <p className="text-yellow-400 font-bold text-lg">🎉 НОВЫЙ РЕКОРД! 🎉</p>
        </div>
      )}
    </div>
  );
};

export default GameOverScreen;