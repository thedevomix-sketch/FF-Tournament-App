import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Home, 
  Trophy, 
  BarChart3, 
  User, 
  Plus, 
  Shield, 
  LogOut, 
  ChevronRight, 
  Calendar, 
  Users, 
  Sword,
  CheckCircle2,
  Clock,
  Lock,
  Settings,
  LayoutDashboard
} from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';
import { supabase, type Tournament, type Profile, type LeaderboardEntry } from './supabase';
import { cn } from './utils';
import { Login } from './components/Login';
import { AdminPanel } from './components/AdminPanel';

// --- Components ---

const BottomNav = ({ activeTab, setActiveTab, isAdmin }: { activeTab: string, setActiveTab: (tab: string) => void, isAdmin: boolean }) => {
  const tabs = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'tournaments', icon: Trophy, label: 'Tournaments' },
    { id: 'leaderboard', icon: BarChart3, label: 'Leaderboard' },
    { id: 'profile', icon: User, label: 'Profile' },
  ];

  if (isAdmin) {
    tabs.splice(3, 0, { id: 'admin', icon: LayoutDashboard, label: 'Admin' });
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800 px-6 py-3 z-50">
      <div className="max-w-md mx-auto flex justify-between items-center">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex flex-col items-center gap-1 transition-colors",
              activeTab === tab.id ? "text-orange-500" : "text-slate-400 hover:text-slate-200"
            )}
          >
            <tab.icon size={20} strokeWidth={activeTab === tab.id ? 2.5 : 2} />
            <span className="text-[10px] font-medium uppercase tracking-wider">{tab.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
};

const TournamentCard = ({ tournament, onClick }: { tournament: Tournament, onClick: () => void, key?: React.Key }) => {
  const statusColors = {
    upcoming: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    live: 'bg-red-500/10 text-red-400 border-red-500/20 animate-pulse',
    completed: 'bg-green-500/10 text-green-400 border-green-500/20',
  };

  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="bg-slate-800/50 border border-slate-700 rounded-2xl p-4 cursor-pointer hover:border-orange-500/50 transition-all group"
    >
      <div className="flex justify-between items-start mb-3">
        <span className={cn("text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full border", statusColors[tournament.status])}>
          {tournament.status}
        </span>
        <div className="flex items-center gap-1 text-slate-400 text-xs">
          <Users size={14} />
          <span>{tournament.max_slots} Slots</span>
        </div>
      </div>
      <h3 className="text-lg font-bold text-white group-hover:text-orange-400 transition-colors">{tournament.title}</h3>
      <p className="text-slate-400 text-sm line-clamp-2 mt-1 mb-4">{tournament.description}</p>
      
      <div className="flex items-center justify-between pt-4 border-t border-slate-700/50">
        <div className="flex items-center gap-2 text-slate-300 text-xs">
          <Calendar size={14} className="text-orange-500" />
          <span>{new Date(tournament.start_date).toLocaleDateString()}</span>
        </div>
        <div className="flex items-center gap-1 text-orange-500 font-bold text-sm">
          <span>View Details</span>
          <ChevronRight size={16} />
        </div>
      </div>
    </motion.div>
  );
};

const LeaderboardRow = ({ entry, rank }: { entry: LeaderboardEntry, rank: number, key?: React.Key }) => {
  return (
    <div className="flex items-center gap-4 p-4 bg-slate-800/30 border border-slate-700/50 rounded-xl mb-2">
      <div className={cn(
        "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm",
        rank === 1 ? "bg-yellow-500 text-black" : 
        rank === 2 ? "bg-slate-300 text-black" :
        rank === 3 ? "bg-orange-600 text-white" : "bg-slate-700 text-slate-300"
      )}>
        {rank}
      </div>
      <div className="flex-1">
        <p className="text-white font-bold">{entry.profiles?.in_game_name || 'Unknown Player'}</p>
        <p className="text-slate-500 text-[10px] uppercase tracking-wider">UID: {entry.profiles?.ff_uid}</p>
      </div>
      <div className="text-right">
        <p className="text-orange-500 font-black text-lg leading-none">{entry.total_points}</p>
        <p className="text-slate-500 text-[10px] uppercase tracking-tighter">Total Points</p>
      </div>
      <div className="text-right min-w-[60px]">
        <p className="text-white font-bold leading-none">{entry.total_kills}</p>
        <p className="text-slate-500 text-[10px] uppercase tracking-tighter">Kills</p>
      </div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [session, setSession] = useState<any>(null);
  const [user, setUser] = useState<Profile | null>(null);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchUserProfile(session.user.id);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchUserProfile(session.user.id);
      else {
        setUser(null);
        setLoading(false);
      }
    });

    fetchTournaments();
    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      setUser(data);
    } catch (err) {
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success('Logged out');
  };

  const fetchTournaments = async () => {
    try {
      const { data, error } = await supabase
        .from('tournaments')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setTournaments(data || []);
    } catch (err) {
      console.error('Error fetching tournaments:', err);
      // Fallback mock data
      setTournaments([
        { id: 't1', title: 'FF Pro League Season 1', description: 'The ultimate battle for the crown.', type: 'solo', status: 'live', max_slots: 48, match_count: 5, start_date: new Date().toISOString() },
        { id: 't2', title: 'Squad Showdown: Desert', description: 'Bring your squad and dominate.', type: 'squad', status: 'upcoming', max_slots: 12, match_count: 3, start_date: new Date(Date.now() + 86400000).toISOString() }
      ]);
    }
  };

  const fetchLeaderboard = async (tournamentId: string) => {
    try {
      const { data, error } = await supabase
        .from('leaderboard')
        .select('*, profiles(*)')
        .eq('tournament_id', tournamentId)
        .order('total_points', { ascending: false });
      
      if (error) throw error;
      setLeaderboard(data || []);
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
    }
  };

  const renderHome = () => (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">SMART <span className="text-orange-500">FF</span></h1>
          <p className="text-slate-400 text-xs font-medium uppercase tracking-widest">Tournament Hub</p>
        </div>
        <button className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-orange-500">
          <Shield size={20} />
        </button>
      </header>

      <div className="relative h-48 rounded-3xl overflow-hidden group">
        <img src="https://picsum.photos/seed/ff/800/400" className="w-full h-full object-cover brightness-50" alt="Featured" referrerPolicy="no-referrer" />
        <div className="absolute inset-0 p-6 flex flex-col justify-end bg-gradient-to-t from-slate-950 via-transparent to-transparent">
          <span className="text-orange-500 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Live Now</span>
          <h2 className="text-2xl font-black text-white leading-tight">FF Pro League <br/>Season 1</h2>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-800/50 border border-slate-700 p-4 rounded-2xl">
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">Your Rank</p>
          <p className="text-2xl font-black text-white">#124</p>
        </div>
        <div className="bg-slate-800/50 border border-slate-700 p-4 rounded-2xl">
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">Total Kills</p>
          <p className="text-2xl font-black text-orange-500">1,240</p>
        </div>
      </div>

      <section>
        <h2 className="text-lg font-bold text-white mb-4">Active Tournaments</h2>
        <div className="space-y-4">
          {tournaments.slice(0, 2).map(t => (
            <TournamentCard key={t.id} tournament={t} onClick={() => { setSelectedTournament(t); fetchLeaderboard(t.id); }} />
          ))}
        </div>
      </section>
    </div>
  );

  const renderTournaments = () => (
    <div className="space-y-6">
      <h1 className="text-2xl font-black text-white">Tournaments</h1>
      <div className="space-y-4">
        {tournaments.map(t => (
          <TournamentCard key={t.id} tournament={t} onClick={() => { setSelectedTournament(t); fetchLeaderboard(t.id); }} />
        ))}
      </div>
    </div>
  );

  const renderLeaderboard = () => (
    <div className="space-y-6">
      <h1 className="text-2xl font-black text-white">Global Ranking</h1>
      <div className="space-y-2">
        {leaderboard.map((entry, idx) => (
          <LeaderboardRow key={idx} entry={entry} rank={idx + 1} />
        ))}
      </div>
    </div>
  );

  const renderProfile = () => (
    <div className="space-y-8">
      <div className="flex flex-col items-center pt-4">
        <div className="w-24 h-24 rounded-full border-4 border-orange-500 p-1">
          <img src="https://picsum.photos/seed/avatar/200" className="w-full h-full rounded-full object-cover" alt="Avatar" referrerPolicy="no-referrer" />
        </div>
        <h2 className="text-2xl font-black text-white mt-4">{user?.in_game_name || 'Player'}</h2>
        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">UID: {user?.ff_uid || 'Not Set'}</p>
      </div>

      <div className="space-y-3">
        <button className="w-full flex items-center justify-between p-4 bg-slate-800/30 border border-slate-700/50 rounded-2xl">
          <div className="flex items-center gap-3">
            <Settings size={20} className="text-orange-500" />
            <p className="text-white font-bold text-sm">Settings</p>
          </div>
          <ChevronRight size={18} className="text-slate-600" />
        </button>

        <button onClick={handleLogout} className="w-full flex items-center justify-between p-4 bg-red-500/5 border border-red-500/20 rounded-2xl hover:bg-red-500/10 transition-colors">
          <div className="flex items-center gap-3">
            <LogOut size={20} className="text-red-500" />
            <p className="text-red-500 font-bold text-sm">Logout</p>
          </div>
        </button>
      </div>
    </div>
  );

  const renderTournamentDetails = () => {
    if (!selectedTournament) return null;
    return (
      <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className="fixed inset-0 bg-slate-950 z-[60] overflow-y-auto pb-24">
        <div className="relative h-64">
          <img src={`https://picsum.photos/seed/${selectedTournament.id}/800/400`} className="w-full h-full object-cover brightness-50" alt="Tournament" referrerPolicy="no-referrer" />
          <button onClick={() => setSelectedTournament(null)} className="absolute top-6 left-6 w-10 h-10 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white">
            <ChevronRight size={24} className="rotate-180" />
          </button>
          <div className="absolute bottom-6 left-6 right-6">
            <h1 className="text-3xl font-black text-white leading-none">{selectedTournament.title}</h1>
          </div>
        </div>
        <div className="p-6 space-y-8">
          <section>
            <h3 className="text-white font-bold mb-2">Description</h3>
            <p className="text-slate-400 text-sm leading-relaxed">{selectedTournament.description}</p>
          </section>
          <section>
            <h3 className="text-white font-bold mb-4">Live Leaderboard</h3>
            <div className="space-y-2">
              {leaderboard.map((entry, idx) => (
                <LeaderboardRow key={idx} entry={entry} rank={idx + 1} />
              ))}
            </div>
          </section>
        </div>
        <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-slate-950 to-transparent">
          <button className="w-full bg-orange-500 text-black font-black py-4 rounded-2xl shadow-lg shadow-orange-500/20 active:scale-95 transition-transform">REGISTER NOW</button>
        </div>
      </motion.div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-orange-500 font-black tracking-widest uppercase text-xs">Loading Arena...</p>
      </div>
    );
  }

  if (!session) {
    return (
      <>
        <Toaster position="top-center" />
        <Login onLoginSuccess={() => {}} />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-orange-500/30">
      <Toaster position="top-center" />
      <main className="max-w-md mx-auto px-6 pt-8 pb-32">
        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
            {activeTab === 'home' && renderHome()}
            {activeTab === 'tournaments' && renderTournaments()}
            {activeTab === 'leaderboard' && renderLeaderboard()}
            {activeTab === 'admin' && (user?.role === 'super_admin' || user?.role === 'organizer') && <AdminPanel />}
            {activeTab === 'profile' && renderProfile()}
          </motion.div>
        </AnimatePresence>
      </main>
      <AnimatePresence>{selectedTournament && renderTournamentDetails()}</AnimatePresence>
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} isAdmin={user?.role === 'super_admin' || user?.role === 'organizer'} />
    </div>
  );
}
