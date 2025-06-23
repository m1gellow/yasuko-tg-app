import React from 'react';
import { InfoIcon, AlertCircle, XIcon, TrophyIcon, ClockIcon } from 'lucide-react';
import { useTelegram } from '../../../../../contexts/TelegramContext';

interface StartScreenProps {
  onStart: () => void;
  highScore: number;
  gamesPlayed: number;
  gamesLimit: number;
  canPlay: boolean;
  onShowTips: () => void;
  showTips: boolean;
  timeToReset: string;
  onClose?: () => void;
}

const StartScreen: React.FC<StartScreenProps> = ({
  onStart,
  highScore,
  gamesPlayed,
  gamesLimit,
  canPlay,
  onShowTips,
  showTips,
  timeToReset,
  onClose,
}) => {
  const { telegram } = useTelegram();

  const handleStart = () => {
    if (telegram?.HapticFeedback) {
      telegram.HapticFeedback.impactOccurred('medium');
    }
    onStart();
  };

  const handleShowTips = () => {
    if (telegram?.HapticFeedback) {
      telegram.HapticFeedback.selectionChanged();
    }
    onShowTips();
  };

  const handleClose = () => {
    if (telegram?.HapticFeedback) {
      telegram.HapticFeedback.impactOccurred('light');
    }
    if (onClose) onClose();
  };

  return (
    <div className="absolute inset-0 bg-gradient-to-b from-[#0f0c1d]/90 to-[#1a1538]/90 flex flex-col items-center justify-center text-center p-6 z-20 backdrop-blur-sm">
      {/* Кнопка закрытия */}
      {onClose && (
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 bg-gradient-to-br from-[#323248] to-[#3a3a5a] hover:from-[#3a3a5a] hover:to-[#42426a] rounded-xl transition-all shadow-md hover:shadow-purple-500/20"
          aria-label="Закрыть"
        >
          <XIcon size={20} className="text-gray-300 hover:text-white transition-colors" />
        </button>
      )}

      {/* Заголовок с градиентом */}
      <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600 mb-6 tracking-wide">
        ЛОВИТЕЛЬ ОРЕХОВ
      </h2>

      {/* Иллюстрация игры */}
      <div className="relative w-full h-40 mb-6">
        <div className="absolute inset-0 flex justify-center">
          <img src="/assets/dub.png" alt="Дуб" className="h-32 object-contain z-10" />
          <img
            src="/assets/belka.png"
            alt="Белка"
            className="absolute top-8 right-1/4 w-16 h-16 transform -scale-x-100 object-contain z-20"
          />
          <img
            src="/assets/golud.png"
            alt="Желудь"
            className="absolute top-20 left-1/3 w-6 h-6 animate-bounce object-contain z-20"
          />
          <img
            src="/assets/oreh.png"
            alt="Орех"
            className="absolute top-24 right-1/4 w-5 h-5 animate-bounce object-contain z-20"
            style={{ animationDelay: '0.3s' }}
          />
          <img
            src="/assets/korzina.png"
            alt="Корзина"
            className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-10 h-10 object-contain z-20"
          />
        </div>
      </div>

      {!showTips ? (
        <div className="w-full max-w-md">
          {/* Основная информация */}
          <div className="bg-gradient-to-br from-[#252538] to-[#1e1e32] p-5 rounded-xl border border-purple-500/20 shadow-lg mb-4">
            <p className="text-lg text-white mb-4">Ловите орехи, которые сбрасывает белка с дерева!</p>

            <div className="flex justify-center gap-4 mb-5">
              <div className="flex flex-col items-center">
                <img src="/assets/golud.png" alt="Желудь" className="w-8 h-8 mb-1" />
                <span className="text-yellow-400 font-medium">+1</span>
              </div>
              <div className="flex flex-col items-center">
                <img src="/assets/oreh.png" alt="Грецкий" className="w-8 h-8 mb-1" />
                <span className="text-orange-400 font-medium">+2</span>
              </div>
            </div>

            {/* Лимит игр */}
            <div className="bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 p-3 rounded-lg mb-5 border border-yellow-500/30">
              <div className="flex justify-between items-center text-sm">
                <div className="flex items-center">
                  <ClockIcon size={16} className="mr-2 text-yellow-400" />
                  <span>Игр сегодня:</span>
                </div>
                <span className="font-bold">
                  {Math.max(0, gamesLimit - gamesPlayed)}/{gamesLimit}
                </span>
              </div>
              {!canPlay && (
                <div className="mt-2 text-xs text-yellow-300">
                  Сброс через: <span className="font-bold">{timeToReset}</span>
                </div>
              )}
            </div>

            {/* Кнопка начала */}
            <button
              onClick={handleStart}
              disabled={!canPlay}
              className={`w-full py-3 rounded-xl font-bold text-lg transition-all ${
                canPlay
                  ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black shadow-lg hover:shadow-yellow-500/30'
                  : 'bg-gradient-to-r from-gray-600 to-gray-700 text-gray-400'
              }`}
            >
              {canPlay ? 'НАЧАТЬ ИГРУ' : 'ЛИМИТ ИСЧЕРПАН'}
            </button>

            {/* Кнопка подсказок */}
            <button
              onClick={handleShowTips}
              className="mt-4 text-blue-400 hover:text-blue-300 transition-colors flex items-center justify-center mx-auto text-sm"
            >
              <InfoIcon size={14} className="mr-1" /> Как играть?
            </button>
          </div>

          {/* Сообщение о лимите */}
          {!canPlay && (
            <div className="bg-gradient-to-r from-red-500/20 to-red-600/20 p-3 rounded-lg border border-red-500/30 flex items-start mb-4">
              <AlertCircle size={18} className="mr-2 mt-0.5 flex-shrink-0 text-red-400" />
              <p className="text-red-300 text-sm">Вы достигли дневного лимита игр. Возвращайтесь завтра!</p>
            </div>
          )}

          {/* Рекорд */}
          <div className="flex items-center justify-center text-yellow-400">
            <TrophyIcon size={16} className="mr-2" />
            <span className="text-sm">
              Рекорд: <span className="font-bold">{highScore}</span>
            </span>
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-br from-[#252538] to-[#1e1e32] p-5 rounded-xl border border-purple-500/20 shadow-lg w-full max-w-md max-h-[70vh] overflow-auto">
          <h3 className="font-bold text-xl text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600 mb-4">
            Как играть
          </h3>

          <ul className="text-left space-y-4 mb-6">
            {[
              'Перемещайте корзину влево и вправо, чтобы ловить падающие орехи',
              'Желуди (маленькие) дают больше очков, но сложнее поймать',
              'Создавайте комбо, ловя орехи подряд без пропусков',
              'Игра длится 60 секунд, скорость падения орехов постепенно увеличивается',
              'Вся заработанная энергия будет добавлена к вашему персонажу',
            ].map((tip, index) => (
              <li key={index} className="flex items-start">
                <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-black rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mr-3 mt-0.5">
                  {index + 1}
                </div>
                <span className="text-white">{tip}</span>
              </li>
            ))}
          </ul>

          <button
            onClick={handleShowTips}
            className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black py-3 rounded-xl font-bold transition-all shadow-md"
          >
            Понятно
          </button>
        </div>
      )}
    </div>
  );
};

export default StartScreen;
