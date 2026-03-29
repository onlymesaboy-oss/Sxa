import React from 'react';
import { motion } from 'motion/react';
import { User as UserIcon, Camera, Trash2, Shield, ArrowLeft, Save, Loader2, AlertCircle } from 'lucide-react';
import { User } from 'firebase/auth';
import { UserProfile } from '../types';
import { updateProfile, deleteAccount } from '../firebase';

interface SettingsPageProps {
  user: User;
  userProfile: UserProfile;
  onBack: () => void;
  onLogout: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ user, userProfile, onBack, onLogout }) => {
  const [displayName, setDisplayName] = React.useState(userProfile.displayName || '');
  const [photoURL, setPhotoURL] = React.useState(userProfile.photoURL || '');
  const [isSaving, setIsSaving] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      await updateProfile(user, { 
        displayName: displayName || undefined, 
        photoURL: photoURL || undefined 
      });
      setSuccess('Profile updated successfully!');
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('Are you absolutely sure? This action cannot be undone and all your data will be permanently deleted.')) {
      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      await deleteAccount(user);
      onLogout();
    } catch (err: any) {
      setError(err.message || 'Failed to delete account. You might need to re-login first.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-3xl mx-auto space-y-8"
    >
      <div className="flex items-center justify-between">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-bold uppercase tracking-widest">Back to Predictor</span>
        </button>
        <h2 className="text-2xl font-black text-white uppercase tracking-tight">Account Settings</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column: Profile Card */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-zinc-900/50 border border-white/5 rounded-3xl p-6 text-center space-y-4">
            <div className="relative inline-block">
              {photoURL ? (
                <img 
                  src={photoURL} 
                  alt={displayName} 
                  className="w-24 h-24 rounded-full border-4 border-emerald-500/20 object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-zinc-800 flex items-center justify-center border-4 border-white/5">
                  <UserIcon className="w-10 h-10 text-zinc-600" />
                </div>
              )}
              <div className="absolute bottom-0 right-0 bg-emerald-500 p-1.5 rounded-full border-2 border-black">
                <Camera className="w-3 h-3 text-black" />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">{displayName || 'Anonymous User'}</h3>
              <p className="text-xs text-zinc-500 truncate">{user.email}</p>
            </div>
            <div className="pt-4 border-t border-white/5">
              <div className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-1">Role</div>
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-500 text-[10px] font-black uppercase">
                <Shield className="w-2.5 h-2.5" />
                {userProfile.role}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Forms */}
        <div className="md:col-span-2 space-y-8">
          {/* Profile Details Form */}
          <section className="bg-zinc-900/30 border border-white/5 rounded-3xl p-8 space-y-6">
            <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
              <UserIcon className="w-4 h-4 text-emerald-500" />
              Profile Details
            </h3>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest ml-1">Display Name</label>
                <input 
                  type="text" 
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full bg-black/50 border border-white/10 rounded-2xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500/50 transition-colors"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest ml-1">Photo URL</label>
                <input 
                  type="url" 
                  value={photoURL}
                  onChange={(e) => setPhotoURL(e.target.value)}
                  placeholder="https://example.com/photo.jpg"
                  className="w-full bg-black/50 border border-white/10 rounded-2xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500/50 transition-colors"
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 text-red-500 text-xs font-medium bg-red-500/10 p-3 rounded-xl border border-red-500/20">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}

              {success && (
                <div className="flex items-center gap-2 text-emerald-500 text-xs font-medium bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20">
                  <Save className="w-4 h-4" />
                  {success}
                </div>
              )}

              <button 
                type="submit"
                disabled={isSaving}
                className="w-full flex items-center justify-center gap-2 bg-white text-black py-3 rounded-2xl font-bold hover:bg-emerald-400 transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving Changes...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Profile</span>
                  </>
                )}
              </button>
            </form>
          </section>

          {/* Security & Danger Zone */}
          <section className="bg-zinc-900/30 border border-white/5 rounded-3xl p-8 space-y-6">
            <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
              <Shield className="w-4 h-4 text-red-500" />
              Security & Danger Zone
            </h3>

            <div className="space-y-6">
              <div className="p-4 bg-zinc-900/50 border border-white/5 rounded-2xl space-y-2">
                <h4 className="text-xs font-bold text-white uppercase tracking-widest">Password Management</h4>
                <p className="text-xs text-zinc-500">
                  Since you are signed in with Google, your password is managed by your Google Account. 
                  To change your password, please visit your Google Security settings.
                </p>
                <a 
                  href="https://myaccount.google.com/security" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-block text-[10px] font-bold text-emerald-500 hover:underline mt-2"
                >
                  Manage Google Account →
                </a>
              </div>

              <div className="p-4 bg-red-500/5 border border-red-500/10 rounded-2xl space-y-4">
                <div>
                  <h4 className="text-xs font-bold text-red-500 uppercase tracking-widest">Delete Account</h4>
                  <p className="text-xs text-zinc-500 mt-1">
                    Once you delete your account, there is no going back. Please be certain.
                  </p>
                </div>
                <button 
                  onClick={handleDeleteAccount}
                  disabled={isDeleting}
                  className="flex items-center gap-2 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/20 px-4 py-2 rounded-xl text-xs font-bold transition-all"
                >
                  {isDeleting ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Trash2 className="w-3 h-3" />
                  )}
                  Delete My Account
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </motion.div>
  );
};
