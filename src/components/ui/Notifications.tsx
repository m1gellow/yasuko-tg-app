import React, { useState, useEffect } from 'react';
import { BellIcon, XIcon, TrophyIcon, BarChart2Icon, GiftIcon, InfoIcon, MessageCircleIcon, BellOffIcon } from 'lucide-react';
import { useTelegram } from '../../contexts/TelegramContext';
import { useAuth } from '../../contexts/AuthContext';
import { NotificationItem } from '../../types';

interface NotificationsProps {
  notifications: NotificationItem[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onDelete: (id: string) => void;
}

const Notifications: React.FC<NotificationsProps> = ({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onDelete
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();
  const { telegram } = useTelegram();
  
  const unreadCount = notifications.filter(n => !n.is_read).length;
  
  useEffect(() => {
    if (isOpen && telegram?.HapticFeedback) {
      telegram.HapticFeedback.impactOccurred('light');
    }
  }, [isOpen, telegram]);

  const uniqueNotifications = notifications.reduce((acc: NotificationItem[], current) => {
    if (current.type === 'achievement') {
      const duplicate = acc.find(item => 
        item.type === current.type && 
        item.title === current.title && 
        item.message === current.message
      );
      if (!duplicate) acc.push(current);
    } else {
      acc.push(current);
    }
    return acc;
  }, []);

  const getNotificationIcon = (type: string) => {
    const iconClass = "w-5 h-5 p-1 rounded-full";
    switch (type) {
      case 'achievement':
        return <TrophyIcon className={`${iconClass} text-yellow-500 bg-yellow-500/10`} />;
      case 'rating':
        return <BarChart2Icon className={`${iconClass} text-green-500 bg-green-500/10`} />;
      case 'reward':
        return <GiftIcon className={`${iconClass} text-purple-500 bg-purple-500/10`} />;
      case 'message':
        return <MessageCircleIcon className={`${iconClass} text-blue-500 bg-blue-500/10`} />;
      default:
        return <InfoIcon className={`${iconClass} text-gray-500 bg-gray-500/10`} />;
    }
  };
  
  const formatDateTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'только что';
    }
  };

  const handleClickOutside = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) setIsOpen(false);
  };
  
  const handleOpenNotifications = () => {
    telegram?.HapticFeedback?.selectionChanged();
    setIsOpen(true);
  };
  
  const handleMarkAsRead = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    telegram?.HapticFeedback?.selectionChanged();
    onMarkAsRead(id);
  };
  
  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    telegram?.HapticFeedback?.impactOccurred('light');
    onDelete(id);
  };
  
  const handleMarkAllAsRead = () => {
    telegram?.HapticFeedback?.notificationOccurred('success');
    onMarkAllAsRead();
  };

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button 
        onClick={handleOpenNotifications}
        className="relative p-2 rounded-full hover:bg-[#252538]/50 transition-colors group"
        aria-label={`Уведомления (${unreadCount} новых)`}
      >
        <div className="relative">
          <BellIcon className="w-6 h-6 text-gray-300 group-hover:text-white transition-colors" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full text-xs w-5 h-5 flex items-center justify-center animate-pulse">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </div>
      </button>
      
      {/* Notification Panel */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/70 z-50 flex justify-end pt-16 pb-4 px-4"
          onClick={handleClickOutside}
        >
          <div 
            className="bg-gradient-to-b from-[#1e183a] to-[#15122b] rounded-xl w-full max-w-sm shadow-xl border border-purple-500/20 animate-slide-left"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-b from-[#1e183a] to-[#1e183a]/90 p-4 border-b border-purple-500/20 z-10 backdrop-blur-sm">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-white">Уведомления</h3>
                <div className="flex space-x-2">
                  {unreadCount > 0 && (
                    <button 
                      onClick={handleMarkAllAsRead}
                      className="text-xs bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 px-3 py-1 rounded-lg transition-colors"
                    >
                      Прочитать все
                    </button>
                  )}
                  <button 
                    onClick={() => setIsOpen(false)}
                    className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-[#323248] transition-colors"
                  >
                    <XIcon size={20} />
                  </button>
                </div>
              </div>
            </div>
            
            {/* Notifications List */}
            <div className="max-h-[70vh] overflow-y-auto">
              {uniqueNotifications.length > 0 ? (
                <div className="divide-y divide-purple-500/10">
                  {uniqueNotifications.map((notification) => (
                    <div 
                      key={notification.id}
                      className={`p-4 hover:bg-[#252538]/50 transition-colors cursor-pointer ${!notification.is_read ? 'bg-[#252538]' : ''}`}
                      onClick={(e) => !notification.is_read && handleMarkAsRead(notification.id, e)}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="mt-1">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start">
                            <h4 className={`font-medium text-sm ${!notification.is_read ? 'text-white' : 'text-gray-300'}`}>
                              {notification.title}
                            </h4>
                            <button 
                              onClick={(e) => handleDelete(notification.id, e)}
                              className="text-gray-500 hover:text-red-400 ml-2 transition-colors"
                            >
                              <XIcon size={16} />
                            </button>
                          </div>
                          <p className="text-sm text-gray-400 mt-1">{notification.message}</p>
                          <p className="text-xs text-gray-500 mt-2">
                            {formatDateTime(notification.created_at)}
                            {!notification.is_read && (
                              <span className="ml-2 text-blue-400">Новое</span>
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <BellOffIcon className="w-10 h-10 text-gray-500/50" />
                    <p className="text-gray-400">Нет новых уведомлений</p>
                    <p className="text-xs text-gray-500">Здесь будут появляться важные события</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Notifications;