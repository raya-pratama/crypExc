'use client';

import React, { createContext, useContext, useState } from 'react';

type AlertType = 'success' | 'error' | 'info';

interface AlertContextType {
  showAlert: (msg: string, type?: AlertType) => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export function AlertProvider({ children }: { children: React.ReactNode }) {
  const [alert, setAlert] = useState<{ msg: string; type: AlertType } | null>(null);

  const showAlert = (msg: string, type: AlertType = 'success') => {
    setAlert({ msg, type });
    setTimeout(() => setAlert(null), 3000);
  };

  return (
    <AlertContext.Provider value={{ showAlert }}>
      {children}
      
      {/* UI ALERT GLOBAL */}
      {alert && (
        <div className="fixed top-20 right-4 md:right-10 z-[999] animate-in fade-in slide-in-from-right-10 pointer-events-none">
          <div className={`flex items-center gap-3 px-6 py-4 rounded-2xl border shadow-2xl backdrop-blur-md ${
            alert.type === 'success' ? 'bg-green-500/10 border-green-500/50 text-green-500' : 
            alert.type === 'error' ? 'bg-red-500/10 border-red-500/50 text-red-500' :
            'bg-blue-500/10 border-blue-500/50 text-blue-500'
          }`}>
            <span className="text-xl">{alert.type === 'success' ? '✅' : alert.type === 'error' ? '❌' : 'ℹ️'}</span>
            <div className="flex flex-col">
              <p className="text-[10px] font-black uppercase tracking-widest opacity-50">System Message</p>
              <p className="text-xs font-bold uppercase tracking-tighter text-white">{alert.msg}</p>
            </div>
          </div>
        </div>
      )}
    </AlertContext.Provider>
  );
}

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) throw new Error('useAlert must be used within AlertProvider');
  return context;
};