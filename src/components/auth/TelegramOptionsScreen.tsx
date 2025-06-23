import React, { useState } from 'react';
import { useTelegram } from '../../contexts/TelegramContext';
import TelegramHybridAuthScreen from './TelegramHybridAuthScreen';
import { XIcon, Send, ArrowRight, AlertTriangle } from 'lucide-react';

interface TelegramOptionsScreenProps {
  onSuccess: () => void;
  onClose?: () => void;
}

const TelegramOptionsScreen: React.FC<TelegramOptionsScreenProps> = ({ onSuccess, onClose }) => {
  const { user: telegramUser, isReady } = useTelegram();
  const [authError, setAuthError] = useState<string | null>(null);
  const { telegram } = useTelegram();

  const handleAuthSuccess = () => {
    if (telegram?.HapticFeedback) {
      telegram.HapticFeedback.notificationOccurred('success');
    }
    onSuccess();
  };

  const handleAuthError = (error: string) => {
    if (telegram?.HapticFeedback) {
      telegram.HapticFeedback.notificationOccurred('error');
    }
    setAuthError(error);
  };

  const handleClose = () => {
    if (telegram?.HapticFeedback) {
      telegram.HapticFeedback.impactOccurred('light');
    }
    onClose?.();
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-md">
        {/* Main card with gradient */}
        <div className="bg-gradient-to-br from-[#1a1538] to-[#0f0c1d] rounded-xl border border-purple-500/30 shadow-lg overflow-hidden">
          {/* Header */}
          <div className="flex justify-between items-center bg-purple-900/50 p-4 border-b border-purple-500/30">
            <div className="flex items-center">
              <Send className="text-yellow-400 mr-2" size={20} />
              <h2 className="text-lg font-bold text-white">TELEGRAM ВХОД</h2>
            </div>
            
            {onClose && (
              <button 
                onClick={handleClose}
                className="p-1 rounded-full hover:bg-purple-500/20 transition-colors"
                aria-label="Закрыть"
              >
                <XIcon className="text-gray-300 hover:text-white" size={20} />
              </button>
            )}
          </div>
          
          {/* Error message */}
          {authError && (
            <div className="bg-red-900/20 border border-red-500/30 p-3 mx-4 mt-4 rounded-lg flex items-start">
              <AlertTriangle className="text-red-400 mr-2 mt-0.5 flex-shrink-0" size={16} />
              <span className="text-red-200 text-sm">{authError}</span>
            </div>
          )}
          
          {/* Content */}
          <div className="p-5">
            {isReady && telegramUser ? (
              <TelegramHybridAuthScreen 
                onSuccess={handleAuthSuccess}
                onError={handleAuthError}
                onClose={onClose}
              />
            ) : (
              <div className="space-y-5">
                <p className="text-center text-gray-300 text-sm">
                  Войдите через Telegram, чтобы сохранять прогресс и участвовать в рейтинге
                </p>
                
                {/* Auth button */}
                <button 
                  onClick={() => window.location.href = "https://t.me/YASUKA_PERS_BOT?start=auth"}
                  className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white py-3 px-4 rounded-lg font-medium flex items-center justify-center transition-all shadow-md active:scale-95"
                >
                  <Send className="mr-2" size={18} />
                  Войти через Telegram
                  <ArrowRight className="ml-2" size={16} />
                </button>
                
                {/* Info box */}
                <div className="bg-purple-900/20 rounded-lg p-3 border border-purple-500/20">
                  <p className="text-xs text-gray-300 text-center">
                    Ваши данные будут защищены, а прогресс синхронизирован
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TelegramOptionsScreen;