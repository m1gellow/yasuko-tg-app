import React from 'react';
import { XIcon, PauseIcon, PlayIcon } from 'lucide-react';
import { useTelegram } from '../../../contexts/TelegramContext';

interface GameHeaderProps {
  title: string;
  isPaused: boolean;
  isGameActive: boolean;
  onTogglePause: () => void;
  onClose: () => void;
}

const GameHeader: React.FC<GameHeaderProps> = ({ 
  title, 
  isPaused, 
  isGameActive, 
  onTogglePause, 
  onClose 
}) => {
  const { telegram } = useTelegram();
  
  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (telegram?.HapticFeedback) {
      telegram.HapticFeedback.impactOccurred('light');
    }
    
    onClose();
  };
  
  const handlePause = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (telegram?.HapticFeedback) {
      telegram.HapticFeedback.selectionChanged();
    }
    
    onTogglePause();
  };

  return (
    <div className="bg-gradient-to-r from-[#1a1625] to-[#252538] p-4 flex justify-between items-center border-b border-purple-500/20 sticky top-0 z-20 backdrop-blur-sm">
      <div className="flex items-center space-x-3">
        <h3 className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600 font-bold text-lg tracking-wide">
          {title}
        </h3>
        
        {isGameActive && (
          <button 
            onClick={handlePause}
            className={`p-2 rounded-xl flex items-center justify-center transition-all ${
              isPaused 
                ? 'bg-gradient-to-br from-green-500/20 to-green-600/30 hover:from-green-500/30 hover:to-green-600/40'
                : 'bg-gradient-to-br from-yellow-500/20 to-yellow-600/30 hover:from-yellow-500/30 hover:to-yellow-600/40'
            }`}
            aria-label={isPaused ? "Продолжить" : "Пауза"}
          >
            {isPaused ? 
              <PlayIcon size={18} className="text-green-400" /> : 
              <PauseIcon size={18} className="text-yellow-400" />
            }
          </button>
        )}
      </div>
      
      <button 
        className="p-2 bg-gradient-to-br from-[#323248] to-[#3a3a5a] hover:from-[#3a3a5a] hover:to-[#42426a] rounded-xl transition-all shadow-md hover:shadow-purple-500/20"
        onClick={handleClose}
        aria-label="Закрыть"
      >
        <XIcon size={20} className="text-gray-300 hover:text-white transition-colors" />
      </button>
    </div>
  );
};

export default GameHeader;