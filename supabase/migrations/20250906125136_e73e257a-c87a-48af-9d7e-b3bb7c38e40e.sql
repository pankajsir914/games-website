-- Create storage bucket for game assets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'game-assets',
  'game-assets',
  true,
  52428800, -- 50MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'audio/mpeg', 'audio/wav']
);

-- Create game_assets table
CREATE TABLE public.game_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_type TEXT NOT NULL,
  asset_type TEXT NOT NULL CHECK (asset_type IN ('cover_image', 'banner', 'icon', 'background', 'logo', 'promotional')),
  asset_url TEXT NOT NULL,
  asset_name TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  dimensions JSONB, -- {width: 1920, height: 1080}
  is_active BOOLEAN DEFAULT true,
  uploaded_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create game_content table
CREATE TABLE public.game_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_type TEXT NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('description', 'rules', 'how_to_play', 'terms', 'seo_meta')),
  content JSONB NOT NULL, -- {title: "", description: "", content: "", meta: {}}
  language TEXT DEFAULT 'en',
  is_active BOOLEAN DEFAULT true,
  updated_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create game_schedules table
CREATE TABLE public.game_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_type TEXT NOT NULL,
  schedule_type TEXT NOT NULL CHECK (schedule_type IN ('maintenance', 'event', 'promotion', 'auto_restart')),
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  is_recurring BOOLEAN DEFAULT false,
  recurrence_pattern JSONB, -- {type: 'daily', interval: 1, days: [1,2,3]}
  action_config JSONB, -- {pause_game: true, show_message: "Under maintenance"}
  is_active BOOLEAN DEFAULT true,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create RLS policies for game_assets
ALTER TABLE public.game_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view game assets" ON public.game_assets
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage game assets" ON public.game_assets
  FOR ALL USING (is_admin_user(auth.uid()));

-- Create RLS policies for game_content
ALTER TABLE public.game_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active game content" ON public.game_content
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage game content" ON public.game_content
  FOR ALL USING (is_admin_user(auth.uid()));

-- Create RLS policies for game_schedules
ALTER TABLE public.game_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view game schedules" ON public.game_schedules
  FOR SELECT USING (is_admin_user(auth.uid()));

CREATE POLICY "Admins can manage game schedules" ON public.game_schedules
  FOR ALL USING (is_admin_user(auth.uid()));

-- Create storage policies for game-assets bucket
CREATE POLICY "Anyone can view game assets" ON storage.objects
  FOR SELECT USING (bucket_id = 'game-assets');

CREATE POLICY "Admins can upload game assets" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'game-assets' AND 
    is_admin_user(auth.uid())
  );

CREATE POLICY "Admins can update game assets" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'game-assets' AND 
    is_admin_user(auth.uid())
  );

CREATE POLICY "Admins can delete game assets" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'game-assets' AND 
    is_admin_user(auth.uid())
  );

-- Add trigger for updating updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_game_assets_updated_at
  BEFORE UPDATE ON public.game_assets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_game_content_updated_at
  BEFORE UPDATE ON public.game_content
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_game_schedules_updated_at
  BEFORE UPDATE ON public.game_schedules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default content for existing games
INSERT INTO public.game_content (game_type, content_type, content) VALUES
('aviator', 'description', '{"title": "Aviator - Crash Game", "short_description": "Watch the plane fly and cash out before it crashes!", "full_description": "Aviator is an exciting crash game where you watch a plane take off and multiply your bet. The longer the plane flies, the higher the multiplier goes. But be careful - the plane can crash at any moment! Cash out before it crashes to win your multiplied bet."}'),
('color_prediction', 'description', '{"title": "Color Prediction", "short_description": "Predict the winning color and multiply your bet!", "full_description": "A fast-paced color prediction game where you bet on Red, Green, or Violet. Each color has different multipliers - test your luck and prediction skills!"}'),
('andar_bahar', 'description', '{"title": "Andar Bahar", "short_description": "Traditional Indian card game", "full_description": "Andar Bahar is a traditional Indian card game. Bet on whether the matching card will appear on Andar (left) or Bahar (right) side."}'),
('roulette', 'description', '{"title": "Roulette", "short_description": "Classic casino roulette game", "full_description": "Place your bets on numbers, colors, or combinations and watch the wheel spin. Will luck be on your side?"}'),
('teen_patti', 'description', '{"title": "Teen Patti", "short_description": "Indian Poker - 3 Card Game", "full_description": "Teen Patti is the Indian version of poker played with 3 cards. Show your poker skills and win big!"}'),
('chicken_road', 'description', '{"title": "Chicken Road", "short_description": "Navigate the chicken through dangerous traps!", "full_description": "Help the chicken cross the road by avoiding traps. Each step increases your multiplier, but hit a trap and lose everything!"}')