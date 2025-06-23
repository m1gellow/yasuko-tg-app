import React, { useState, useEffect } from 'react';

import { Check, X, ArrowLeft } from 'lucide-react';
import { useTelegram } from '../../../../contexts/TelegramContext';
import { useAuth } from '../../../../contexts/AuthContext';
import LoginForm from './forms/LoginForm';
import RegisterForm from './forms/RegisterForm';


interface AuthScreenProps {
  onClose?: () => void;
  telegramData?: any;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onClose, telegramData }) => {
  const { user } = useAuth();
  const { telegram } = useTelegram();
  const [showLogin, setShowLogin] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);

  // Загрузка данных Telegram из localStorage
  useEffect(() => {
    const email = localStorage.getItem('telegram_auth_email');
    const password = localStorage.getItem('telegram_auth_password');

    if (email && password && showLogin) {
      setTimeout(() => {
        const emailInput = document.getElementById('email') as HTMLInputElement;
        const passwordInput = document.getElementById('password') as HTMLInputElement;
        if (emailInput && passwordInput) {
          emailInput.value = email;
          passwordInput.value = password;
        }
      }, 300);
    }
  }, [showLogin]);

  // Обработка успешной авторизации
  useEffect(() => {
    if (user) {
      setShowSuccess(true);
      const timer = setTimeout(() => onClose?.(), 1500);
      return () => clearTimeout(timer);
    }
  }, [user, onClose]);

  const handleClose = () => {
    telegram?.HapticFeedback?.impactOccurred('light');
    onClose?.();
  };

  const toggleForm = () => {
    telegram?.HapticFeedback?.selectionChanged();
    setShowLogin(!showLogin);
  };

  if (showSuccess) {
    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
        <div className="bg-gradient-to-br from-[#1a1538] to-[#0f0c1d] rounded-xl p-8 w-full max-w-md border border-purple-500/30 shadow-lg text-center">
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-teal-500 rounded-full flex items-center justify-center mb-4">
              <Check size={32} className="text-white" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">УСПЕШНАЯ АВТОРИЗАЦИЯ</h2>
            <p className="text-gray-400">Переход в игру...</p>
          </div>
        </div>
      </div>
    );
  }

  if (user && !showSuccess) {
    handleClose();
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="relative w-full max-w-md">
        {/* Main auth container */}
        <div className="bg-gradient-to-br from-[#1a1538] to-[#0f0c1d] rounded-xl border border-purple-500/30 shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-purple-900/50 p-4 border-b border-purple-500/30 flex justify-between items-center">
            <h2 className="text-lg font-bold text-white">{showLogin ? 'ВХОД' : 'РЕГИСТРАЦИЯ'}</h2>
            {onClose && (
              <button
                onClick={handleClose}
                className="p-1 rounded-full hover:bg-purple-500/20 transition-colors text-gray-300 hover:text-white"
              >
                <X size={20} />
              </button>
            )}
          </div>

          {/* Auth form */}
          <div className="p-5">
            {showLogin ? (
              <LoginForm onSwitchToRegister={toggleForm} />
            ) : (
              <RegisterForm
                onSwitchToLogin={toggleForm}
                onRegistrationSuccess={handleClose}
                telegramData={telegramData}
              />
            )}
          </div>

          {/* Footer with switch button */}
          <div className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 p-3 border-t border-purple-500/30 text-center">
            <button
              onClick={toggleForm}
              className="text-sm text-gray-300 hover:text-white flex items-center justify-center w-full"
            >
              {showLogin ? (
                <>
                  Нет аккаунта? <span className="text-yellow-400 ml-1">Зарегистрироваться</span>
                  <ArrowLeft className="ml-1 transform rotate-180" size={16} />
                </>
              ) : (
                <>
                  Уже есть аккаунт? <span className="text-yellow-400 ml-1">Войти</span>
                  <ArrowLeft className="ml-1" size={16} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthScreen;
