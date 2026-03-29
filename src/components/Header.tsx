import React from 'react';
import { Trophy, LogIn, LogOut, User as UserIcon, Settings } from 'lucide-react';
import { League } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { LiveScoreTicker } from './LiveScoreTicker';
import { User } from 'firebase/auth';

interface HeaderProps {
  selectedLeague?: League;
  user: User | null;
  onLogin: () => void;
  onLogout: () => void;
  onSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({ selectedLeague, user, onLogin, onLogout, onSettings }) => {
  return (
    <header className="border-b border-white/10 bg-black/50 backdrop-blur-md sticky top-0 z-50">
      <LiveScoreTicker />
      <div className="py-6 px-4 max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-500 p-2 rounded-lg shadow-lg shadow-emerald-500/20">
              <Trophy className="w-6 h-6 text-black" />
            </div>
            <h1 className="text-2xl font-bold tracking-tighter text-white">
              AI <span className="text-emerald-500">FOOTBALL</span> PREDICTOR
            </h1>
          </div>

          <AnimatePresence mode="wait">
            {selectedLeague && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="hidden lg:flex items-center gap-2 pl-6 border-l border-white/10"
              >
                <div className="w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center p-1.5">
                  <img 
                    src={selectedLeague.logo} 
                    alt={selectedLeague.name} 
                    className="w-full h-full object-contain"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <span className="text-xs font-black text-zinc-400 uppercase tracking-widest">{selectedLeague.name}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        <div className="flex items-center gap-6">
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-zinc-400">
            <a href="#" className="hover:text-white transition-colors">Leagues</a>
            <a href="#" className="hover:text-white transition-colors">Predictions</a>
            <a href="#" className="hover:text-white transition-colors">Stats</a>
          </nav>

          <div className="flex items-center gap-4 pl-6 border-l border-white/10">
            {user ? (
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-bold text-white leading-none">{user.displayName}</div>
                  <div className="text-[10px] font-medium text-zinc-500 uppercase tracking-tighter mt-1">Authenticated</div>
                </div>
                {user.photoURL ? (
                  <img 
                    src={user.photoURL} 
                    alt={user.displayName || 'User'} 
                    className="w-8 h-8 rounded-full border border-white/10"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center">
                    <UserIcon className="w-4 h-4 text-zinc-400" />
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <button 
                    onClick={onSettings}
                    className="p-2 text-zinc-400 hover:text-emerald-500 transition-colors"
                    title="Settings"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={onLogout}
                    className="p-2 text-zinc-400 hover:text-red-500 transition-colors"
                    title="Logout"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <button 
                onClick={onLogin}
                className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-full hover:bg-emerald-400 transition-colors text-sm font-bold"
              >
                <LogIn className="w-4 h-4" />
                <span>Login with Google</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
