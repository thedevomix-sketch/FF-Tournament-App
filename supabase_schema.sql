-- Smart FF Tournament Database Schema

-- 1. Users table (Extends Supabase Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    name TEXT NOT NULL,
    ff_uid TEXT UNIQUE NOT NULL,
    in_game_name TEXT NOT NULL,
    avatar_url TEXT,
    role TEXT DEFAULT 'player' CHECK (role IN ('super_admin', 'organizer', 'moderator', 'player')),
    is_banned BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Squads table
CREATE TABLE IF NOT EXISTS public.squads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    leader_id UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tournaments table
CREATE TABLE IF NOT EXISTS public.tournaments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    type TEXT CHECK (type IN ('solo', 'squad')),
    status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'live', 'completed')),
    max_slots INTEGER NOT NULL,
    match_count INTEGER DEFAULT 1,
    start_date TIMESTAMPTZ,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Matches table
CREATE TABLE IF NOT EXISTS public.matches (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tournament_id UUID REFERENCES public.tournaments(id) ON DELETE CASCADE,
    match_number INTEGER NOT NULL,
    room_id TEXT,
    room_password TEXT,
    status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'live', 'finished')),
    start_time TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Registrations table
CREATE TABLE IF NOT EXISTS public.registrations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tournament_id UUID REFERENCES public.tournaments(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id),
    squad_id UUID REFERENCES public.squads(id),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'reserve')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tournament_id, user_id)
);

-- 6. Match Results table
CREATE TABLE IF NOT EXISTS public.match_results (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    match_id UUID REFERENCES public.matches(id) ON DELETE CASCADE,
    tournament_id UUID REFERENCES public.tournaments(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id),
    squad_id UUID REFERENCES public.squads(id),
    kills INTEGER DEFAULT 0,
    placement INTEGER NOT NULL,
    placement_points INTEGER DEFAULT 0,
    total_points INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Leaderboard (Aggregate table)
CREATE TABLE IF NOT EXISTS public.leaderboard (
    tournament_id UUID REFERENCES public.tournaments(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id),
    squad_id UUID REFERENCES public.squads(id),
    total_kills INTEGER DEFAULT 0,
    total_placement_points INTEGER DEFAULT 0,
    total_points INTEGER DEFAULT 0,
    matches_played INTEGER DEFAULT 0,
    best_placement INTEGER DEFAULT 100,
    PRIMARY KEY (tournament_id, user_id)
);

-- 8. Protests table
CREATE TABLE IF NOT EXISTS public.protests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tournament_id UUID REFERENCES public.tournaments(id),
    match_id UUID REFERENCES public.matches(id),
    user_id UUID REFERENCES public.profiles(id),
    description TEXT NOT NULL,
    screenshot_url TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- FUNCTIONS & TRIGGERS

-- Function to calculate placement points
CREATE OR REPLACE FUNCTION calculate_placement_points(pos INTEGER)
RETURNS INTEGER AS $$
BEGIN
    RETURN CASE
        WHEN pos = 1 THEN 12
        WHEN pos = 2 THEN 9
        WHEN pos = 3 THEN 8
        WHEN pos = 4 THEN 7
        WHEN pos = 5 THEN 6
        WHEN pos = 6 THEN 5
        WHEN pos = 7 THEN 4
        WHEN pos = 8 THEN 3
        WHEN pos = 9 THEN 2
        WHEN pos = 10 THEN 1
        ELSE 0
    END;
END;
$$ LANGUAGE plpgsql;

-- Trigger function for match results
CREATE OR REPLACE FUNCTION handle_match_result_insert()
RETURNS TRIGGER AS $$
DECLARE
    p_points INTEGER;
    t_points INTEGER;
BEGIN
    -- Calculate points
    p_points := calculate_placement_points(NEW.placement);
    t_points := p_points + NEW.kills;
    
    NEW.placement_points := p_points;
    NEW.total_points := t_points;

    -- Update or Insert into Leaderboard
    INSERT INTO public.leaderboard (
        tournament_id, user_id, squad_id, total_kills, total_placement_points, total_points, matches_played, best_placement
    )
    VALUES (
        NEW.tournament_id, NEW.user_id, NEW.squad_id, NEW.kills, p_points, t_points, 1, NEW.placement
    )
    ON CONFLICT (tournament_id, user_id) DO UPDATE SET
        total_kills = leaderboard.total_kills + EXCLUDED.total_kills,
        total_placement_points = leaderboard.total_placement_points + EXCLUDED.total_placement_points,
        total_points = leaderboard.total_points + EXCLUDED.total_points,
        matches_played = leaderboard.matches_played + 1,
        best_placement = LEAST(leaderboard.best_placement, EXCLUDED.best_placement);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_match_result_insert
    BEFORE INSERT ON public.match_results
    FOR EACH ROW EXECUTE FUNCTION handle_match_result_insert();

-- RLS POLICIES (Simplified for demo, but structure is there)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaderboard ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Tournaments are viewable by everyone" ON public.tournaments FOR SELECT USING (true);
CREATE POLICY "Matches are viewable by everyone" ON public.matches FOR SELECT USING (true);
CREATE POLICY "Leaderboard is viewable by everyone" ON public.leaderboard FOR SELECT USING (true);

-- Admin write access
-- (In a real app, we'd check the role in public.profiles)
CREATE POLICY "Admins can manage tournaments" ON public.tournaments FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('super_admin', 'organizer'))
);
