import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Dices, 
  Goal, 
  Layers, 
  Users, 
  Clock, 
  CornerUpRight, 
  Loader2,
  Sparkles,
  History,
  LogOut,
  User as UserIcon,
  Download,
  Share2
} from 'lucide-react';
import html2canvas from 'html2canvas';
import { Header } from './components/Header';
import { LiveScoreTicker } from './components/LiveScoreTicker';
import { MatchSelector } from './components/MatchSelector';
import { UpcomingMatches } from './components/UpcomingMatches';
import { MatchDisplay } from './components/MatchDisplay';
import { MatchDetails } from './components/MatchDetails';
import { PredictionCard } from './components/PredictionCard';
import { StatsPanel } from './components/StatsPanel';
import { PredictionTrends } from './components/PredictionTrends';
import { SettingsPage } from './components/SettingsPage';
import { Match, Prediction, UserProfile, LiveOdds, LiveScore } from './types';
import { generateMatchPrediction, getLiveScores } from './services/geminiService';
import { fetchLiveOdds, subscribeToOdds } from './services/oddsService';
import { auth, signInWithGoogle, logout, db } from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp, collection, addDoc } from 'firebase/firestore';

export default function App() {
  const [user, setUser] = React.useState<User | null>(null);
  const [userProfile, setUserProfile] = React.useState<UserProfile | null>(null);
  const [view, setView] = React.useState<'home' | 'settings'>('home');
  const [selectedMatch, setSelectedMatch] = React.useState<Match | null>(null);
  const [prediction, setPrediction] = React.useState<Prediction | null>(null);
  const [liveOdds, setLiveOdds] = React.useState<LiveOdds | null>(null);
  const [liveMatches, setLiveMatches] = React.useState<LiveScore[]>([]);
  const [liveStatus, setLiveStatus] = React.useState<{ score: string; status: string } | null>(null);
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [isLiveUpdating, setIsLiveUpdating] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [history, setHistory] = React.useState<{ match: Match; prediction: Prediction }[]>([]);
  const predictionRef = React.useRef<HTMLDivElement>(null);

  const handleExportImage = async () => {
    if (!predictionRef.current) return;
    
    try {
      // Temporarily hide elements that shouldn't be in the export
      const canvas = await html2canvas(predictionRef.current, {
        backgroundColor: '#000000',
        scale: 2,
        useCORS: true,
        logging: false,
        onclone: (clonedDoc) => {
          // You can modify the cloned document here if needed
          const exportBtn = clonedDoc.getElementById('export-button');
          if (exportBtn) exportBtn.style.display = 'none';
        }
      });
      
      const image = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = image;
      link.download = `prediction-${selectedMatch?.homeTeam.name}-vs-${selectedMatch?.awayTeam.name}.png`;
      link.click();
    } catch (err) {
      console.error('Export failed:', err);
      setError('Failed to export image. Please try again.');
    }
  };

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Create or update user profile in Firestore
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (!userDoc.exists()) {
          const profile: UserProfile = {
            uid: currentUser.uid,
            displayName: currentUser.displayName,
            email: currentUser.email,
            photoURL: currentUser.photoURL,
            role: 'user',
            createdAt: serverTimestamp()
          };
          await setDoc(userDocRef, profile);
          setUserProfile(profile);
        } else {
          setUserProfile(userDoc.data() as UserProfile);
        }
      } else {
        setUserProfile(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // Real-time Odds Subscription
  React.useEffect(() => {
    if (!selectedMatch) {
      setLiveOdds(null);
      return;
    }

    // Initial fetch
    fetchLiveOdds(selectedMatch.league.id, selectedMatch.id).then(setLiveOdds);

    // Subscribe to real-time updates
    const unsubscribe = subscribeToOdds(
      selectedMatch.league.id, 
      selectedMatch.id, 
      (newOdds) => {
        setLiveOdds(newOdds);
        // If we have a prediction, update its odds too for consistency
        if (prediction) {
          setPrediction(prev => prev ? {
            ...prev,
            odds: {
              home: newOdds.home,
              draw: newOdds.draw,
              away: newOdds.away
            }
          } : null);
        }
      }
    );

    return () => unsubscribe();
  }, [selectedMatch, prediction?.id]); // Re-subscribe if match changes or new prediction generated

  // Global Live Scores Polling
  React.useEffect(() => {
    const fetchGlobalLiveScores = async () => {
      try {
        const scores = await getLiveScores();
        setLiveMatches(scores);
      } catch (err) {
        console.error("Error fetching global live scores:", err);
      }
    };

    fetchGlobalLiveScores();
    const interval = setInterval(fetchGlobalLiveScores, 60000); // Poll every minute
    return () => clearInterval(interval);
  }, []);

  // Live Match Status Polling for Selected Match
  React.useEffect(() => {
    if (!selectedMatch) {
      setLiveStatus(null);
      return;
    }

    const currentMatch = liveMatches.find(m => 
      (m.homeTeam.toLowerCase().includes(selectedMatch.homeTeam.name.toLowerCase()) || 
       selectedMatch.homeTeam.name.toLowerCase().includes(m.homeTeam.toLowerCase())) &&
      (m.awayTeam.toLowerCase().includes(selectedMatch.awayTeam.name.toLowerCase()) || 
       selectedMatch.awayTeam.name.toLowerCase().includes(m.awayTeam.toLowerCase()))
    );

    if (currentMatch) {
      setLiveStatus({ score: currentMatch.score, status: currentMatch.status });
    } else {
      setLiveStatus(null);
    }
  }, [selectedMatch, liveMatches]);

  // Trigger re-prediction on live status change
  React.useEffect(() => {
    if (selectedMatch && prediction && liveStatus && !isGenerating && !isLiveUpdating) {
      // Only re-predict if score or status changed significantly
      const handleLiveUpdate = async () => {
        setIsLiveUpdating(true);
        try {
          const result = await generateMatchPrediction(selectedMatch, {
            score: liveStatus.score,
            status: liveStatus.status,
            odds: liveOdds
          });
          setPrediction(result);
        } catch (err) {
          console.error("Live update failed:", err);
        } finally {
          setIsLiveUpdating(false);
        }
      };

      handleLiveUpdate();
    }
  }, [liveStatus?.score, liveStatus?.status]);

  const handleGeneratePrediction = async () => {
    if (!selectedMatch) return;
    
    setIsGenerating(true);
    setPrediction(null);
    setError(null);
    
    try {
      const result = await generateMatchPrediction(selectedMatch);
      
      // Enrich match data with AI-found details if available
      if (result.enrichedTeams) {
        setSelectedMatch(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            homeTeam: {
              ...prev.homeTeam,
              logo: result.enrichedTeams?.home.logo || prev.homeTeam.logo,
              form: result.enrichedTeams?.home.form || prev.homeTeam.form,
            },
            awayTeam: {
              ...prev.awayTeam,
              logo: result.enrichedTeams?.away.logo || prev.awayTeam.logo,
              form: result.enrichedTeams?.away.form || prev.awayTeam.form,
            }
          };
        });
      }

      setPrediction(result);
      setHistory(prev => [{ match: selectedMatch, prediction: result }, ...prev.slice(0, 9)]);

      // Save to Firestore if user is logged in
      if (user) {
        try {
          await addDoc(collection(db, 'prediction_history'), {
            uid: user.uid,
            matchId: selectedMatch.id,
            homeTeam: selectedMatch.homeTeam.name,
            awayTeam: selectedMatch.awayTeam.name,
            correctScore: result.correctScore,
            confidence: result.confidence,
            createdAt: serverTimestamp()
          });
        } catch (fsErr) {
          console.error("Error saving prediction to Firestore:", fsErr);
        }
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans selection:bg-emerald-500 selection:text-black">
      <Header 
        selectedLeague={selectedMatch?.league} 
        user={user} 
        onLogin={signInWithGoogle} 
        onLogout={() => {
          logout();
          setView('home');
        }} 
        onSettings={() => setView('settings')}
      />
      
      <LiveScoreTicker />
      
      <main className="max-w-7xl mx-auto px-4 py-12 space-y-12">
        <AnimatePresence mode="wait">
          {view === 'settings' && user && userProfile ? (
            <SettingsPage 
              key="settings"
              user={user} 
              userProfile={userProfile}
              onBack={() => setView('home')}
              onLogout={() => {
                logout();
                setView('home');
              }}
            />
          ) : (
            <motion.div
              key="home"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-12"
            >
              {/* Hero Section */}
              <section className="text-center space-y-4 max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-500 text-xs font-bold uppercase tracking-widest"
          >
            <Sparkles className="w-3 h-3" />
            Next-Gen AI Analysis
          </motion.div>
          <h2 className="text-4xl md:text-6xl font-black tracking-tighter text-white">
            PREDICT THE <span className="text-emerald-500">UNPREDICTABLE</span>
          </h2>
          <p className="text-zinc-500 text-lg">
            Advanced neural networks analyzing thousands of data points to give you the most accurate football predictions.
          </p>
        </section>

        {/* Upcoming Matches Section */}
        <section>
          <UpcomingMatches 
            liveMatches={liveMatches}
            onMatchSelect={(match) => {
              setSelectedMatch(match);
              setPrediction(null);
              // Scroll to analysis section
              window.scrollTo({ top: 400, behavior: 'smooth' });
            }} 
          />
        </section>

        {/* Match Selection */}
        <section className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
          <div className="xl:col-span-5">
            <MatchSelector 
              liveMatches={liveMatches}
              onMatchSelect={(match) => {
                setSelectedMatch(match);
                setPrediction(null);
              }} 
            />
          </div>
          
          <div className="xl:col-span-7 space-y-8">
            <AnimatePresence mode="wait">
              {selectedMatch ? (
                <motion.div
                  key={selectedMatch.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                  <MatchDisplay 
                    match={selectedMatch} 
                    prediction={prediction} 
                    liveOdds={liveOdds}
                    liveStatus={liveStatus}
                  />
                  
                  <div className="flex justify-center">
                    <button
                      onClick={handleGeneratePrediction}
                      disabled={isGenerating}
                      className="group relative flex items-center gap-3 bg-white text-black px-12 py-5 rounded-full font-black text-lg hover:bg-emerald-400 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
                    >
                      <AnimatePresence mode="wait">
                        {isGenerating ? (
                          <motion.div
                            key="loading"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="flex items-center gap-3"
                          >
                            <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
                            <span className="tracking-tighter">AI កំពុងវិភាគ...</span>
                          </motion.div>
                        ) : (
                          <motion.div
                            key="idle"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="flex items-center gap-3"
                          >
                            <Dices className="w-6 h-6 group-hover:rotate-12 transition-transform" />
                            <span>បង្កើតការទស្សន៍ទាយ</span>
                          </motion.div>
                        )}
                      </AnimatePresence>
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                    </button>
                  </div>

                  <MatchDetails match={selectedMatch} prediction={prediction} />
                </motion.div>
              ) : (
                <div className="h-full min-h-[400px] flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-[2.5rem] text-zinc-600 gap-4">
                  <div className="p-4 bg-zinc-900 rounded-full">
                    <Goal className="w-12 h-12" />
                  </div>
                  <p className="font-medium">Select a match to start analysis</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </section>

        {/* Prediction Results */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-red-500/10 border border-red-500/20 rounded-3xl p-6 text-red-500 text-center font-medium"
            >
              {error}
            </motion.div>
          )}

          {prediction && selectedMatch && (
            <motion.section
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8 pt-12 border-t border-white/5"
            >
              <div ref={predictionRef} className="p-8 bg-black rounded-[2.5rem] border border-white/5 space-y-8">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col gap-1">
                    <h3 className="text-2xl font-black text-white uppercase tracking-tight">លទ្ធផលនៃការវិភាគ</h3>
                    <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                      {selectedMatch.homeTeam.name} vs {selectedMatch.awayTeam.name} • {new Date().toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 no-export" id="export-button">
                    {isLiveUpdating && (
                      <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full animate-pulse">
                        <Loader2 className="w-3 h-3 animate-spin text-emerald-500" />
                        <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Live Updating...</span>
                      </div>
                    )}
                    <button
                      onClick={handleExportImage}
                      className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 rounded-xl border border-emerald-500/20 transition-all text-xs font-bold uppercase tracking-widest"
                    >
                      <Download className="w-4 h-4" />
                      Export Image
                    </button>
                    <div className="flex flex-col items-end gap-1">
                      <div className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Live Market Data
                      </div>
                      <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                        Updated: {new Date().toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                </div>

                <StatsPanel 
                  homeTeam={selectedMatch.homeTeam} 
                  awayTeam={selectedMatch.awayTeam} 
                  confidence={prediction.confidence} 
                  h2h={prediction.h2h}
                />

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <PredictionCard title="Correct Score" value={prediction.correctScore} icon={Goal} delay={0.1} />
                    <PredictionCard title={`O/U ${prediction.marketOverUnder}`} value={prediction.overUnder} icon={Layers} delay={0.2} />
                    <PredictionCard title="Asian Handicap" value={prediction.asianHandicap} icon={Users} delay={0.25} />
                    <PredictionCard title="Market HDP" value={prediction.marketHdp} icon={Users} delay={0.3} />
                    <PredictionCard title="AI Suggestion (HDP)" value={prediction.suggestedHdp} icon={Sparkles} delay={0.4} />
                    <PredictionCard title="Both Teams To Score" value={prediction.btts} icon={Sparkles} delay={0.5} />
                    <PredictionCard title="Half-Time Result" value={prediction.halfTimeResult} icon={Clock} delay={0.6} />
                    <PredictionCard title="Total Corners" value={prediction.corners} icon={CornerUpRight} delay={0.7} />
                  </div>
                  <div className="lg:col-span-1">
                    <PredictionTrends history={history} />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-zinc-900/30 border border-white/5 rounded-3xl p-8">
                    <h4 className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-500" />
                      ការវិភាគដោយ AI
                    </h4>
                    <div className="space-y-4">
                      {prediction.reasoning.map((point, i) => (
                        <motion.div 
                          key={i}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.8 + (i * 0.1) }}
                          className="flex gap-4 group"
                        >
                          <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500/40 group-hover:bg-emerald-500 transition-colors shrink-0" />
                          <p className="text-zinc-300 leading-relaxed font-medium">
                            {point}
                          </p>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-zinc-900/30 border border-white/5 rounded-3xl p-8 space-y-6">
                    <h4 className="text-sm font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                      <Layers className="w-4 h-4 text-emerald-500" />
                      ព័ត៌មានលម្អិតបន្ថែម (Full Details)
                    </h4>
                    
                    <div className="grid grid-cols-1 gap-4">
                      <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                        <span className="text-xs font-bold text-zinc-500 uppercase">Stadium</span>
                        <span className="text-sm font-medium text-white">{prediction.stadium || 'Unknown'}</span>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                        <span className="text-xs font-bold text-zinc-500 uppercase">Start Time</span>
                        <span className="text-sm font-medium text-white">{prediction.startTime || 'Unknown'}</span>
                      </div>
                      <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-3">
                        <span className="text-xs font-bold text-zinc-500 uppercase block">Team Summaries</span>
                        <div className="space-y-4">
                          <div>
                            <div className="text-[10px] font-black text-emerald-500 uppercase mb-1">{selectedMatch.homeTeam.name}</div>
                            <p className="text-xs text-zinc-400 leading-relaxed">{prediction.enrichedTeams?.home.description}</p>
                          </div>
                          <div>
                            <div className="text-[10px] font-black text-white uppercase mb-1">{selectedMatch.awayTeam.name}</div>
                            <p className="text-xs text-zinc-400 leading-relaxed">{prediction.enrichedTeams?.away.description}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* History Section */}
        {history.length > 0 && (
          <section className="space-y-6">
            <div className="flex items-center gap-2 text-zinc-400">
              <History className="w-5 h-5" />
              <h3 className="text-lg font-bold uppercase tracking-tight">Recent History</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {history.map((item, i) => (
                <div key={i} className="bg-zinc-900/30 border border-white/5 rounded-2xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img src={item.match.homeTeam.logo} alt="" className="w-6 h-6 object-contain" referrerPolicy="no-referrer" />
                    <span className="text-xs font-bold text-white">{item.prediction.correctScore}</span>
                    <img src={item.match.awayTeam.logo} alt="" className="w-6 h-6 object-contain" referrerPolicy="no-referrer" />
                  </div>
                  <div className="text-[10px] font-bold text-zinc-600 uppercase">{item.match.homeTeam.name} vs {item.match.awayTeam.name}</div>
                </div>
              ))}
            </div>
          </section>
        )}
      </motion.div>
    )}
  </AnimatePresence>
</main>

      <footer className="py-12 border-t border-white/5 text-center text-zinc-600 text-sm">
        <p>© 2026 AI Football Predictor. For entertainment purposes only.</p>
      </footer>
    </div>
  );
}
