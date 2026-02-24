import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  Users, 
  Check, 
  X, 
  AlertTriangle,
  Upload,
  BarChart2
} from 'lucide-react';
import { supabase, type Tournament, type Profile } from '../supabase';
import { toast } from 'react-hot-toast';

export const AdminPanel = () => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [pendingRegistrations, setPendingRegistrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const { data: tData } = await supabase.from('tournaments').select('*');
      const { data: rData } = await supabase
        .from('registrations')
        .select('*, profiles(*), tournaments(*)')
        .eq('status', 'pending');
      
      setTournaments(tData || []);
      setPendingRegistrations(rData || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (regId: string) => {
    try {
      const { error } = await supabase
        .from('registrations')
        .update({ status: 'approved' })
        .eq('id', regId);
      if (error) throw error;
      toast.success('Player approved');
      fetchAdminData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-center">
        <h1 className="text-2xl font-black text-white uppercase tracking-tighter">Admin <span className="text-orange-500">Panel</span></h1>
        <div className="flex gap-2">
           <button className="bg-slate-800 text-white p-2 rounded-xl border border-slate-700">
             <BarChart2 size={20} />
           </button>
           <button className="bg-orange-500 text-black p-2 rounded-xl font-bold flex items-center gap-1">
             <Plus size={20} />
             <span className="text-xs uppercase tracking-widest">New</span>
           </button>
        </div>
      </header>

      {/* Pending Approvals */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Users size={18} className="text-orange-500" />
          <h2 className="text-sm font-black text-white uppercase tracking-widest">Pending Approvals ({pendingRegistrations.length})</h2>
        </div>
        <div className="space-y-3">
          {pendingRegistrations.length > 0 ? (
            pendingRegistrations.map((reg) => (
              <div key={reg.id} className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center justify-between">
                <div>
                  <p className="text-white font-bold">{reg.profiles?.in_game_name}</p>
                  <p className="text-slate-500 text-[10px] uppercase tracking-wider">{reg.tournaments?.title}</p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleApprove(reg.id)}
                    className="w-10 h-10 rounded-xl bg-green-500/10 text-green-500 flex items-center justify-center hover:bg-green-500/20 transition-colors"
                  >
                    <Check size={20} />
                  </button>
                  <button className="w-10 h-10 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center hover:bg-red-500/20 transition-colors">
                    <X size={20} />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 bg-slate-900/50 border border-dashed border-slate-800 rounded-2xl">
              <p className="text-slate-600 text-xs font-bold uppercase tracking-widest">No pending requests</p>
            </div>
          )}
        </div>
      </section>

      {/* Tournament Management */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Edit3 size={18} className="text-orange-500" />
          <h2 className="text-sm font-black text-white uppercase tracking-widest">Manage Tournaments</h2>
        </div>
        <div className="space-y-4">
          {tournaments.map((t) => (
            <div key={t.id} className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-white font-bold">{t.title}</h3>
                  <p className="text-slate-500 text-[10px] uppercase tracking-widest">{t.status} • {t.type}</p>
                </div>
                <div className="flex gap-2">
                  <button className="text-slate-400 hover:text-white transition-colors"><Edit3 size={18} /></button>
                  <button className="text-red-500/50 hover:text-red-500 transition-colors"><Trash2 size={18} /></button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button className="bg-slate-800 text-white py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2">
                  <Upload size={14} />
                  Upload Results
                </button>
                <button className="bg-slate-800 text-white py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2">
                  <AlertTriangle size={14} />
                  Manage Bans
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
