import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, ArrowRight, ShieldCheck, Key } from 'lucide-react';
import { supabase } from '../supabase';
import { toast } from 'react-hot-toast';

export const Login = ({ onLoginSuccess }: { onLoginSuccess: () => void }) => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [loading, setLoading] = useState(false);

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return toast.error('Please enter your email address');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return toast.error('Please enter a valid email');
    
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email,
        options: {
          shouldCreateUser: true,
        }
      });
      if (error) throw error;
      setStep('otp');
      toast.success('OTP sent to your email');
    } catch (err: any) {
      toast.error(err.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) return toast.error('Please enter the OTP');

    setLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email: email,
        token: otp,
        type: 'email',
      });
      if (error) throw error;
      toast.success('Login successful!');
      onLoginSuccess();
    } catch (err: any) {
      toast.error(err.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md space-y-8"
      >
        <div className="text-center">
          <div className="w-20 h-20 bg-orange-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-orange-500/20 rotate-3">
            <ShieldCheck size={40} className="text-black" />
          </div>
          <h1 className="text-4xl font-black text-white tracking-tighter">SMART <span className="text-orange-500">FF</span></h1>
          <p className="text-slate-400 text-sm mt-2 font-medium">Tournament Arena Login</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-2xl">
          {step === 'email' ? (
            <form onSubmit={handleSendOTP} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                  <input
                    type="email"
                    placeholder="player@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all outline-none"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-orange-500 text-black font-black py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-orange-400 transition-colors disabled:opacity-50"
              >
                {loading ? 'SENDING...' : 'GET OTP'}
                <ArrowRight size={20} />
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOTP} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Enter OTP</label>
                <div className="relative">
                  <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                  <input
                    type="text"
                    placeholder="123456"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all outline-none text-center tracking-[1em] font-black"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-orange-500 text-black font-black py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-orange-400 transition-colors disabled:opacity-50"
              >
                {loading ? 'VERIFYING...' : 'VERIFY & LOGIN'}
                <CheckCircle2 size={20} />
              </button>
              <button
                type="button"
                onClick={() => setStep('email')}
                className="w-full text-slate-500 text-xs font-bold uppercase tracking-widest hover:text-slate-300 transition-colors"
              >
                Change Email Address
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-slate-600 text-[10px] uppercase tracking-widest font-bold">
          By logging in, you agree to our <br/> Terms of Service & Privacy Policy
        </p>
      </motion.div>
    </div>
  );
};

const CheckCircle2 = ({ size, className }: { size: number, className?: string }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/>
    <path d="m9 12 2 2 4-4"/>
  </svg>
);
