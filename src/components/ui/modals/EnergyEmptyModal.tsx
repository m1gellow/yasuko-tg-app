import React, { useState } from 'react';
import { useGame } from '../../../contexts/GameContext';
import { referralService } from '../../../services/referralService';
import { useTelegram } from '../../../contexts/TelegramContext';
import { BoltIcon, UsersIcon, GamepadIcon, XIcon, ZapIcon, GiftIcon } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';

interface EnergyEmptyModalProps {
  onClose: () => void;
}

const EnergyEmptyModal: React.FC<EnergyEmptyModalProps> = ({ onClose }) => {
  const [creatingReferral, setCreatingReferral] = useState(false);
  const [referralLink, setReferralLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const { dispatch } = useGame();
  const { user } = useAuth();
  const { telegram } = useTelegram();

  const handleCreateReferral = async () => {
    if (!user) {
      onClose();
      return;
    }

    setCreatingReferral(true);

    try {
      const result = await referralService.createReferralLink(user.id, {
        reward: { coins: 100, energy: 100 },
      });

      if (result.success && result.code) {
        setReferralLink(result.code);
      }
    } catch (error) {
      console.error('Ошибка при создании приглашения:', error);
    } finally {
      setCreatingReferral(false);
    }
  };

  const copyReferralLink = () => {
    if (!referralLink) return;

    navigator.clipboard.writeText(referralLink)
      .then(() => {
        setCopied(true);
        if (telegram?.HapticFeedback) {
          telegram.HapticFeedback.notificationOccurred('success');
        }

        setTimeout(() => {
          setShowSuccess(true);
          dispatch({ type: 'REGEN_ENERGY', payload: 100 });
          dispatch({ type: 'CLAIM_REWARD', payload: { type: 'coins', amount: 100 } });
          setTimeout(() => onClose(), 1500);
        }, 300);
      })
      .catch(console.error);
  };

  const shareToTelegram = () => {
    if (!referralLink || !telegram) {
      copyReferralLink();
      return;
    }

    const shareText = `Присоединяйся к игре "Ясуко"! Получи +100 монет и +100 энергии по моей ссылке: ${referralLink}`;
    
    try {
      telegram.WebApp?.openTelegramLink(
        `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(shareText)}`
      );
      
      setShowSuccess(true);
      dispatch({ type: 'REGEN_ENERGY', payload: 100 });
      dispatch({ type: 'CLAIM_REWARD', payload: { type: 'coins', amount: 100 } });
      setTimeout(() => onClose(), 1500);
    } catch {
      copyReferralLink();
    }
  };

  const openMiniGame = () => {
    window.dispatchEvent(new CustomEvent('open-mini-game'));
    onClose();
  };

  const handleClose = () => {
    telegram?.HapticFeedback?.selectionChanged();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      {showSuccess ? (
        <div className="bg-gradient-to-br from-green-600 to-emerald-800 rounded-t-2xl sm:rounded-2xl p-6 text-center w-full max-w-sm shadow-xl border border-green-400/30 animate-pop-in">
          <div className="bg-green-500/20 p-3 rounded-full inline-flex mb-3">
            <GiftIcon className="text-white" size={32} />
          </div>
          <h2 className="text-xl font-bold text-white mb-1">БОНУС ПОЛУЧЕН!</h2>
          <p className="text-white/90 text-sm">+100 энергии и +100 монет</p>
        </div>
      ) : (
        <div className="bg-gradient-to-br from-[#1e183a] to-[#15122b] rounded-t-2xl sm:rounded-2xl w-full max-w-sm shadow-xl border-t border-purple-500/30 animate-slide-up">
          {/* Compact Header */}
          <div className="bg-gradient-to-r from-red-600 to-red-800 p-3 flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <BoltIcon className="text-white" size={20} />
              <h2 className="text-lg font-bold text-white">ЭНЕРГИЯ ЗАКОНЧИЛАСЬ</h2>
            </div>
            <button
              onClick={handleClose}
              className="text-white/80 hover:text-white p-1"
              aria-label="Закрыть"
            >
              <XIcon size={20} />
            </button>
          </div>

          {/* Compact Content */}
          <div className="p-4">
            <p className="text-center text-gray-300 text-sm mb-4">
              Выберите способ пополнения энергии:
            </p>

            <div className="space-y-3">
              {/* Mini Game Option - Compact */}
              <button
                onClick={openMiniGame}
                className="w-full bg-gradient-to-r from-yellow-500/10 to-orange-500/10 hover:from-yellow-500/20 hover:to-orange-500/20 p-3 rounded-lg border border-yellow-500/20 flex items-center space-x-3 transition-all"
              >
                <div className="bg-yellow-500/20 p-2 rounded-lg">
                  <GamepadIcon className="text-yellow-400" size={18} />
                </div>
                <div className="text-left">
                  <h3 className="font-medium text-white text-sm">Мини-игра</h3>
                  <p className="text-gray-400 text-xs">Заработайте энергию в игре</p>
                </div>
              </button>

              {/* Referral Option - Compact */}
              <div className="bg-gradient-to-r from-blue-500/10 to-indigo-500/10 hover:from-blue-500/20 hover:to-indigo-500/20 p-3 rounded-lg border border-blue-500/20 transition-all">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="bg-blue-500/20 p-2 rounded-lg">
                    <UsersIcon className="text-blue-400" size={18} />
                  </div>
                  <div className="text-left">
                    <h3 className="font-medium text-white text-sm">Пригласить друга</h3>
                    <p className="text-gray-400 text-xs">Получите +100 энергии и монет</p>
                  </div>
                </div>

                {!referralLink ? (
                  <button
                    onClick={handleCreateReferral}
                    disabled={creatingReferral}
                    className={`w-full py-2 rounded-md text-sm font-medium ${
                      creatingReferral
                        ? 'bg-gray-600 text-gray-400'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    {creatingReferral ? 'Создание...' : 'Создать ссылку'}
                  </button>
                ) : (
                  <div className="space-y-2">
                    <div className="bg-[#0f0c1d] p-2 rounded-md text-gray-300 text-xs break-all border border-purple-500/20">
                      {referralLink}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={copyReferralLink}
                        className={`py-2 rounded-md text-xs font-medium ${
                          copied
                            ? 'bg-green-600 text-white'
                            : 'bg-yellow-500 hover:bg-yellow-600 text-black'
                        }`}
                      >
                        {copied ? 'Скопировано!' : 'Копировать'}
                      </button>
                      <button
                        onClick={shareToTelegram}
                        className="bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md text-xs font-medium"
                      >
                        Поделиться
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 flex items-center justify-center text-gray-400 text-xs">
              <ZapIcon className="text-yellow-400 mr-1" size={14} />
              <span>Энергия восстанавливается со временем</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnergyEmptyModal;