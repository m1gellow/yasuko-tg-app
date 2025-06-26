import React, { useState, useCallback } from 'react';
import { usePhrases } from '../../../../hooks/usePhrases';
import { gameService } from '../../../../services/gameService';
import { useTelegram } from '../../../../contexts/TelegramContext';
import { useAuth } from '../../../../contexts/AuthContext';
import { XIcon, Heart, Utensils, Gamepad2, Zap } from 'lucide-react';

interface CharacterCardProps {
  level: number;
  health: number;
  happiness: number;
  hunger: number;
  mood: string;
  characterType: 'yasuko' | 'fishko';
  onToggleCharacterCard: () => void;
}

const CharacterCard: React.FC<CharacterCardProps> = ({
  level,
  health,
  happiness,
  hunger,
  mood,
  characterType,
  onToggleCharacterCard
}) => {
  const [showPhrase, setShowPhrase] = useState(false);
  const [currentPhrase, setCurrentPhrase] = useState('');
  const [actionType, setActionType] = useState<'feed' | 'play' | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const { user } = useAuth();
  const { telegram } = useTelegram();

  const { getRandomPhrase: getRandomFeedPhrase } = usePhrases('feed');
  const { getRandomPhrase: getRandomPlayPhrase } = usePhrases('pet');

  const getCharacterName = () => {
    if (characterType === 'yasuko') {
      return level === 1 ? 'ОРЕХ' : 'БЕЛКА';
    } else {
      return level === 1 ? 'ИКРИНКА' : level === 2 ? 'МАЛЫШ' : 'ФИШКО';
    }
  };

  const getMoodColor = () => {
    if (happiness >= 80) return 'text-green-400';
    if (happiness >= 50) return 'text-yellow-400';
    return 'text-red-400';
  };

  const handleAction = useCallback(async (type: 'feed' | 'play') => {
    if (!user || isUpdating) return;

    if (telegram?.HapticFeedback) {
      telegram.HapticFeedback.impactOccurred('medium');
    }

    setIsUpdating(true);
    setActionType(type);

    try {
      const phrase = type === 'feed' ? getRandomFeedPhrase() : getRandomPlayPhrase();
      setCurrentPhrase(phrase);
      setShowPhrase(true);

      setTimeout(() => setShowPhrase(false), 2000);

      await gameService.recordUserAction(user.id, type);
      
      await gameService.trackUserAction(user.id, `character_${type}`, {
        character_type: characterType,
        character_level: level,
        timestamp: new Date().toISOString(),
        stat_before: type === 'feed' ? hunger : happiness,
        stat_after: Math.min(100, (type === 'feed' ? hunger : happiness) + 20),
        phrase: phrase,
      });

      const result = await gameService.updateCharacter(user.id, {
        ...(type === 'feed' ? { satiety: Math.min(100, hunger + 20) } : { mood: Math.min(100, happiness + 20) }),
        last_interaction: new Date().toISOString(),
      });

      if (!result.success) {
        console.error('Failed to update character:', result.error);
      }
    } catch (error) {
      console.error(`Error in handle${type === 'feed' ? 'Feed' : 'Play'}:`, error);
    } finally {
      setIsUpdating(false);
      setActionType(null);
    }
  }, [getRandomFeedPhrase, getRandomPlayPhrase, user, hunger, happiness, isUpdating, characterType, level, telegram]);

  const renderProgressBar = (value: number, color: string, icon: React.ReactNode) => (
    <div className="flex items-center space-x-3">
      <div className="text-gray-400">{icon}</div>
      <div className="flex-1">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-gray-300">{Math.round(value)}%</span>
        </div>
        <div className="w-full bg-gray-700 h-2 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-500 ${color}`} 
            style={{ width: `${value}%` }} 
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 shadow-xl w-full max-w-sm mx-auto relative border border-gray-700">
      {/* Close button */}
      <button 
        onClick={onToggleCharacterCard}
        className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors p-1 rounded-full bg-gray-700/50"
      >
        <XIcon size={20} />
      </button>

      {/* Character phrase */}
      {showPhrase && (
        <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-black/80 text-white px-4 py-2 rounded-lg text-sm animate-fade-in-down whitespace-nowrap max-w-xs text-center z-20 border border-gray-600">
          {currentPhrase}
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">{getCharacterName()}</h2>
          <div className="flex items-center space-x-2 mt-1">
            <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded-full">Уровень {level}</span>
            <span className={`text-xs px-2 py-1 rounded-full ${getMoodColor()} bg-opacity-20`}>
              {mood}
            </span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="space-y-4 mb-6">
        {renderProgressBar(
          hunger, 
          'bg-gradient-to-r from-red-500 to-orange-500', 
          <Utensils size={16} className="text-orange-400" />
        )}
        
        {renderProgressBar(
          happiness, 
          'bg-gradient-to-r from-yellow-400 to-yellow-600', 
          <Heart size={16} className="text-yellow-400" />
        )}
        
        {renderProgressBar(
          health, 
          'bg-gradient-to-r from-green-500 to-teal-400', 
          <Zap size={16} className="text-green-400" />
        )}
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => handleAction('feed')}
          disabled={isUpdating || !user}
          className={`flex items-center justify-center space-x-2 py-3 px-4 rounded-xl transition-all ${
            isUpdating && actionType === 'feed' 
              ? 'bg-orange-600' 
              : 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600'
          } text-white font-medium disabled:opacity-50`}
        >
          <Utensils size={18} />
          <span>{isUpdating && actionType === 'feed' ? '...' : 'Кормить'}</span>
        </button>
        
        <button
          onClick={() => handleAction('play')}
          disabled={isUpdating || !user}
          className={`flex items-center justify-center space-x-2 py-3 px-4 rounded-xl transition-all ${
            isUpdating && actionType === 'play' 
              ? 'bg-blue-600' 
              : 'bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600'
          } text-white font-medium disabled:opacity-50`}
        >
          <Gamepad2 size={18} />
          <span>{isUpdating && actionType === 'play' ? '...' : 'Играть'}</span>
        </button>
      </div>

      {/* Level 1 special info */}
      {level === 1 && characterType === 'yasuko' && (
        <div className="mt-6 text-center text-xs text-gray-400 bg-gray-800/50 p-3 rounded-lg">
          Кормите и играйте с Орехом, чтобы он превратился в Белку!
          <div className="mt-2 w-full bg-gray-700 h-1.5 rounded-full overflow-hidden">
            <div 
              className="bg-gradient-to-r from-yellow-400 to-orange-400 h-full" 
              style={{ width: `${(hunger + happiness) / 2}%` }} 
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default CharacterCard;