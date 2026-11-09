import React, { useEffect } from 'react';
import { PushNotification } from '../types';
import { Bell, X } from 'lucide-react';

interface NotificationToastProps {
  notification: PushNotification | null;
  onClose: () => void;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({
  notification,
  onClose,
}) => {
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        onClose();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notification, onClose]);

  if (!notification) return null;

  return (
    <div className="fixed top-3 inset-x-3 z-50 max-w-sm mx-auto animate-in slide-in-from-top-4 duration-300">
      <div className="bg-[#152b36]/95 backdrop-blur-xl border border-[#0d2b52] rounded-2xl p-3 shadow-2xl shadow-[#0d2b52]/80 flex items-start gap-3">
        {/* App Icon / User Avatar */}
        <div className="relative shrink-0">
          {notification.icon ? (
            <img
              src={notification.icon}
              alt="Avatar"
              className="w-10 h-10 rounded-xl object-cover border border-[#0d2b52]"
            />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#a10b2b] to-[#6ea900] text-white flex items-center justify-center font-bold">
              <Bell size={18} />
            </div>
          )}
          <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#6ea900] text-black text-[9px] font-black flex items-center justify-center border border-[#152b36]">
            b
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 pr-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
              betterme • {notification.time}
            </span>
            <button
              onClick={onClose}
              className="text-zinc-400 hover:text-white transition-colors"
            >
              <X size={14} />
            </button>
          </div>
          <h4 className="font-bold text-xs text-white truncate mt-0.5">{notification.title}</h4>
          <p className="text-xs text-zinc-300 leading-tight mt-0.5">{notification.body}</p>
        </div>
      </div>
    </div>
  );
};
