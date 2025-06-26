import React, { ChangeEvent, useState } from 'react';
import { XIcon, GiftIcon, ZapIcon } from 'lucide-react';
import { useGame } from '../../../../../contexts/GameContext';
import { supabase } from '../../../../../lib/supabase';
import { useAuth } from '../../../../../contexts/AuthContext';

interface PromoCodeModalProps {
  onClose: () => void;
}

const PromoCodeModal: React.FC<PromoCodeModalProps> = ({ onClose }) => {
  const { state, dispatch } = useGame();
  const { user } = useAuth();

  const [promoCode, setPromoCode] = useState<string | null>(null);

  const handleChangePromo = (e: ChangeEvent<HTMLInputElement>) => {
    setPromoCode(e.target.value)
  };

 const handleApplyPromo = async () => {
  if (!promoCode) {
    console.error("Промокод не введён");
    return;
  }

  try {
    // 1. Находим запись в referral_links по промокоду
    const { data: referralLink, error: referralError } = await supabase
      .from("referral_links")
      .select("*")
      .eq("code", promoCode)
      .single(); // Ожидаем только одну запись

    if (referralError || !referralLink) {
      console.error("Промокод не найден или ошибка:", referralError);
      return;
    }

    // 2. Вставляем запись в referral_uses, используя ID ссылки (referralLink.id)
    const { error } = await supabase.from('referral_uses').insert({
      referral_id: referralLink.id, // Важно: используем id записи, а не user_id!
      user_id: user?.id, // ID текущего пользователя
      reward_claimed: true,
    });

    if (error) {
      console.error("Ошибка при активации промокода:", error);
      return;
    }

    // 3. Если всё успешно, начисляем энергию
    dispatch({
      type: 'REGEN_ENERGY',
      payload: 100 - state.energy.current,
    });
    console.log("Промокод успешно применён!");

  } catch (err) {
    console.error("Неожиданная ошибка:", err);
  }
};

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-gradient-to-br from-[#1e183a] to-[#15122b] rounded-xl w-full max-w-sm shadow-xl border border-purple-500/30 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-yellow-600 to-amber-600 p-4 flex justify-between items-center">
          <div className="flex items-center">
            <GiftIcon className="text-white mr-2" size={24} />
            <h2 className="text-xl font-bold text-white">АКТИВИРУЙТЕ ПРОМОКОД</h2>
          </div>
          <button
            onClick={() => onClose()}
            className="text-white/80 hover:text-white p-1 rounded-full hover:bg-amber-700/50 transition-all"
            aria-label="Закрыть"
          >
            <XIcon size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-6">
            <label htmlFor="promo-code" className="block text-gray-300 mb-2 text-sm font-medium">
              Введите промокод
            </label>
            <input
              id="promo-code"
              type="text"
              value={promoCode}
              placeholder="PROMO2025"
              className="w-full bg-[#0f0c1d] border border-purple-500/30 text-white p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all"
              autoFocus
              onChange={(e) => handleChangePromo(e)}
            />
          </div>

          <div className="flex justify-between space-x-3">
            <button
              className="px-4 py-3 bg-[#1e183a] hover:bg-[#2a1a4a] text-white rounded-lg font-medium flex-1 transition-all border border-purple-500/20 hover:border-purple-500/40"
              onClick={onClose}
            >
              Отмена
            </button>
            <button
              onClick={handleApplyPromo}
              className="px-4 py-3 bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 text-black rounded-lg font-bold flex-1 transition-all shadow-md disabled:opacity-50 disabled:pointer-events-none"
            >
              Активировать
            </button>
          </div>

          <div className="mt-6 text-center text-sm text-gray-400">
            <div className="flex items-center justify-center">
              <ZapIcon className="text-yellow-400 mr-2" size={16} />
              <span>Промокоды дают бонусы: энергию, монеты или предметы</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PromoCodeModal;
