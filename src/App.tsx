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
  Settings
} from 'lucide-react';
import { Toaster } from 'react-hot-toast';
import { supabase, type Tournament, type Profile, type LeaderboardEntry } from './supabase';
import { cn } from './utils';

// --- Components ---

const BottomNav = ({ activeTab, setActiveTab }: { activeTab: string, setActiveTab: (tab: string) => void }) => {
  const tabs = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'tournaments', icon: Trophy, label: 'Tournaments' },
    { id: 'leaderboard', icon: BarChart3, label: 'Leaderboard' },
    { id: 'profile', icon: User, label: 'Profile' },
  ];

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
  const [user, setUser] = useState<Profile | null>(null);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    fetchTournaments();
    const mockUser: Profile = {
      id: '1',
      name: 'John Doe',
      ff_uid: '1234567890',
      in_game_name: 'SMART_GAMER',
      avatar_url: null,
      role: 'super_admin',
      is_banned: false
    };
    setUser(mockUser);
  }, []);

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
      setTournaments([
        {
          id: 't1',
          title: 'FF Pro League Season 1',
          description: 'The ultimate battle for the crown. Solo tournament with 48 slots.',
          type: 'solo',
          status: 'live',
          max_slots: 48,
          match_count: 5,
          start_date: new Date().toISOString()
        },
        {
          id: 't2',
          title: 'Squad Showdown: Desert',
          description: 'Bring your squad and dominate the Kalahari desert.',
          type: 'squad',
          status: 'upcoming',
          max_slots: 12,
          match_count: 3,
          start_date: new Date(Date.now() + 86400000).toISOString()
        }
      ]);
    } finally {
      setLoading(false);
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
      setLeaderboard([
        { tournament_id: tournamentId, user_id: '1', squad_id: null, total_kills: 15, total_placement_points: 36, total_points: 51, matches_played: 3, best_placement: 1, profiles: { in_game_name: 'KING_FF', ff_uid: '99887766' } as any },
        { tournament_id: tournamentId, user_id: '2', squad_id: null, total_kills: 12, total_placement_points: 28, total_points: 40, matches_played: 3, best_placement: 2, profiles: { in_game_name: 'NOOB_KILLER', ff_uid: '11223344' } as any },
        { tournament_id: tournamentId, user_id: '3', squad_id: null, total_kills: 8, total_placement_points: 20, total_points: 28, matches_played: 3, best_placement: 4, profiles: { in_game_name: 'SNIPER_GOD', ff_uid: '55667788' } as any },
      ]);
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
        <img 
          src="https://picsum.photos/seed/ff/800/400" 
          className="w-full h-full object-cover brightness-50 group-hover:scale-105 transition-transform duration-700"
          alt="Featured"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 p-6 flex flex-col justify-end bg-gradient-to-t from-slate-950 via-transparent to-transparent">
          <span className="text-orange-500 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Live Now</span>
          <h2 className="text-2xl font-black text-white leading-tight">FF Pro League <br/>Season 1</h2>
          <div className="flex items-center gap-4 mt-3">
            <div className="flex items-center gap-1 text-white text-xs font-bold">
              <Users size={14} className="text-orange-500" />
              <span>48/48 Players</span>
            </div>
            <div className="flex items-center gap-1 text-white text-xs font-bold">
              <Sword size={14} className="text-orange-500" />
              <span>Match 3/5</span>
            </div>
          </div>
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
        <div className="flex justify-between items-end mb-4">
          <h2 className="text-lg font-bold text-white">Active Tournaments</h2>
          <button onClick={() => setActiveTab('tournaments')} className="text-orange-500 text-xs font-bold">See All</button>
        </div>
        <div className="space-y-4">
          {tournaments.slice(0, 2).map(t => (
            <TournamentCard key={t.id} tournament={t} onClick={() => {
              setSelectedTournament(t);
              fetchLeaderboard(t.id);
            }} />
          ))}
        </div>
      </section>
    </div>
  );

  const renderTournaments = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-black text-white">Tournaments</h1>
        {user?.role === 'super_admin' && (
          <button className="bg-orange-500 text-black p-2 rounded-xl font-bold flex items-center gap-1 text-sm">
            <Plus size={18} />
            <span>Create</span>
          </button>
        )}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
        {['All', 'Solo', 'Squad', 'Live', 'Upcoming'].map(filter => (
          <button key={filter} className="px-4 py-2 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-xs font-bold whitespace-nowrap hover:border-orange-500/50 transition-colors">
            {filter}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {tournaments.map(t => (
          <TournamentCard key={t.id} tournament={t} onClick={() => {
            setSelectedTournament(t);
            fetchLeaderboard(t.id);
          }} />
        ))}
      </div>
    </div>
  );

  const renderLeaderboard = () => (
    <div className="space-y-6">
      <h1 className="text-2xl font-black text-white">Global Ranking</h1>
      
      <div className="bg-orange-500 rounded-3xl p-6 relative overflow-hidden">
        <div className="relative z-10">
          <p className="text-black/60 text-[10px] font-black uppercase tracking-widest mb-1">Top Player of the Month</p>
          <h2 className="text-3xl font-black text-black leading-none mb-4">SMART_GAMER</h2>
          <div className="flex gap-6">
            <div>
              <p className="text-black font-black text-xl leading-none">450</p>
              <p className="text-black/60 text-[10px] font-bold uppercase">Kills</p>
            </div>
            <div>
              <p className="text-black font-black text-xl leading-none">12</p>
              <p className="text-black/60 text-[10px] font-bold uppercase">Wins</p>
            </div>
          </div>
        </div>
        <Trophy size={120} className="absolute -right-4 -bottom-4 text-black/10 rotate-12" />
      </div>

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
        <div className="relative">
          <div className="w-24 h-24 rounded-full border-4 border-orange-500 p-1">
            <img 
              src="https://picsum.photos/seed/avatar/200" 
              className="w-full h-full rounded-full object-cover" 
              alt="Avatar"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="absolute -bottom-1 -right-1 bg-orange-500 text-black p-1.5 rounded-full border-4 border-slate-950">
            <Shield size={14} />
          </div>
        </div>
        <h2 className="text-2xl font-black text-white mt-4">{user?.in_game_name}</h2>
        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">UID: {user?.ff_uid}</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="text-center p-4 bg-slate-800/50 rounded-2xl border border-slate-700">
          <p className="text-orange-500 font-black text-xl">45</p>
          <p className="text-slate-500 text-[10px] font-bold uppercase">Matches</p>
        </div>
        <div className="text-center p-4 bg-slate-800/50 rounded-2xl border border-slate-700">
          <p className="text-orange-500 font-black text-xl">28%</p>
          <p className="text-slate-500 text-[10px] font-bold uppercase">Win Rate</p>
        </div>
        <div className="text-center p-4 bg-slate-800/50 rounded-2xl border border-slate-700">
          <p className="text-orange-500 font-black text-xl">1.5k</p>
          <p className="text-slate-500 text-[10px] font-bold uppercase">Points</p>
        </div>
      </div>

      <div className="space-y-3">
        <button className="w-full flex items-center justify-between p-4 bg-slate-800/30 border border-slate-700/50 rounded-2xl hover:bg-slate-800/50 transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
              <Shield size={20} />
            </div>
            <div className="text-left">
              <p className="text-white font-bold text-sm">Account Verification</p>
              <p className="text-slate-500 text-[10px]">Verified via Phone OTP</p>
            </div>
          </div>
          <CheckCircle2 size={18} className="text-green-500" />
        </button>

        <button className="w-full flex items-center justify-between p-4 bg-slate-800/30 border border-slate-700/50 rounded-2xl hover:bg-slate-800/50 transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500">
              <Settings size={20} />
            </div>
            <div className="text-left">
              <p className="text-white font-bold text-sm">Settings</p>
              <p className="text-slate-500 text-[10px]">Privacy, Notifications, Theme</p>
            </div>
          </div>
          <ChevronRight size={18} className="text-slate-600" />
        </button>

        <button className="w-full flex items-center justify-between p-4 bg-red-500/5 border border-red-500/20 rounded-2xl hover:bg-red-500/10 transition-colors mt-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500">
              <LogOut size={20} />
            </div>
            <p className="text-red-500 font-bold text-sm">Logout</p>
          </div>
        </button>
      </div>
    </div>
  );

  const renderTournamentDetails = () => {
    if (!selectedTournament) return null;

    return (
      <motion.div 
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        className="fixed inset-0 bg-slate-950 z-[60] overflow-y-auto pb-24"
      >
        <div className="relative h-64">
          <img 
            src={`https://picsum.photos/seed/${selectedTournament.id}/800/400`} 
            className="w-full h-full object-cover brightness-50"
            alt="Tournament"
            referrerPolicy="no-referrer"
          />
          <button 
            onClick={() => setSelectedTournament(null)}
            className="absolute top-6 left-6 w-10 h-10 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white"
          >
            <ChevronRight size={24} className="rotate-180" />
          </button>
          <div className="absolute bottom-6 left-6 right-6">
            <span className="bg-orange-500 text-black text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded mb-2 inline-block">
              {selectedTournament.type}
            </span>
            <h1 className="text-3xl font-black text-white leading-none">{selectedTournament.title}</h1>
          </div>
        </div>

        <div className="p-6 space-y-8">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-orange-500 font-black text-lg leading-none">{selectedTournament.match_count}</p>
              <p className="text-slate-500 text-[10px] font-bold uppercase mt-1">Matches</p>
            </div>
            <div className="text-center border-x border-slate-800">
              <p className="text-white font-black text-lg leading-none">{selectedTournament.max_slots}</p>
              <p className="text-slate-500 text-[10px] font-bold uppercase mt-1">Slots</p>
            </div>
            <div className="text-center">
              <p className="text-white font-black text-lg leading-none">Free</p>
              <p className="text-slate-500 text-[10px] font-bold uppercase mt-1">Entry</p>
            </div>
          </div>

          <section>
            <h3 className="text-white font-bold mb-2">Description</h3>
            <p className="text-slate-400 text-sm leading-relaxed">{selectedTournament.description}</p>
          </section>

          <section>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-white font-bold">Match Room</h3>
              <span className="text-slate-500 text-[10px] font-bold uppercase flex items-center gap-1">
                <Clock size={12} />
                Opens 15m before
              </span>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col items-center justify-center gap-4">
              <Lock size={32} className="text-slate-700" />
              <div className="text-center">
                <p className="text-white font-bold text-sm">Room Details Locked</p>
                <p className="text-slate-500 text-xs mt-1">Register and wait for the match to start to see Room ID and Password.</p>
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-white font-bold mb-4">Live Leaderboard</h3>
            <div className="space-y-2">
              {leaderboard.length > 0 ? (
                leaderboard.map((entry, idx) => (
                  <LeaderboardRow key={idx} entry={entry} rank={idx + 1} />
                ))
              ) : (
                <div className="text-center py-12 border-2 border-dashed border-slate-800 rounded-2xl">
                  <BarChart3 size={32} className="text-slate-700 mx-auto mb-2" />
                  <p className="text-slate-500 text-sm">No results uploaded yet.</p>
                </div>
              )}
            </div>
          </section>
        </div>

        <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-slate-950 to-transparent">
          <button className="w-full bg-orange-500 text-black font-black py-4 rounded-2xl shadow-lg shadow-orange-500/20 active:scale-95 transition-transform">
            REGISTER NOW
          </button>
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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-orange-500/30">
      <Toaster position="top-center" />
      
      <main className="max-w-md mx-auto px-6 pt-8 pb-32">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'home' && renderHome()}
            {activeTab === 'tournaments' && renderTournaments()}
            {activeTab === 'leaderboard' && renderLeaderboard()}
            {activeTab === 'profile' && renderProfile()}
          </motion.div>
        </AnimatePresence>
      </main>

      <AnimatePresence>
        {selectedTournament && renderTournamentDetails()}
      </AnimatePresence>

      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}
