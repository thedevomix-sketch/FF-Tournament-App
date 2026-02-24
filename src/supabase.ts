import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xegpartxomzpaskqxkva.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhlZ3BhcnR4b216cGFza3F4a3ZhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5Mzg4MTgsImV4cCI6MjA4NzUxNDgxOH0.fAr4-V6A1Rn1Yaeudx_sW2n1VkNYIyfvXqIJzEH_OPQ';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Profile = {
  id: string;
  name: string;
  ff_uid: string;
  in_game_name: string;
  avatar_url: string | null;
  role: 'super_admin' | 'organizer' | 'moderator' | 'player';
  is_banned: boolean;
};

export type Tournament = {
  id: string;
  title: string;
  description: string;
  type: 'solo' | 'squad';
  status: 'upcoming' | 'live' | 'completed';
  max_slots: number;
  match_count: number;
  start_date: string;
};

export type Match = {
  id: string;
  tournament_id: string;
  match_number: number;
  room_id: string | null;
  room_password: string | null;
  status: 'scheduled' | 'live' | 'finished';
  start_time: string;
};

export type LeaderboardEntry = {
  tournament_id: string;
  user_id: string;
  squad_id: string | null;
  total_kills: number;
  total_placement_points: number;
  total_points: number;
  matches_played: number;
  best_placement: number;
  profiles?: Profile;
};
