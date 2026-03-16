
-- Enums
CREATE TYPE public.round_mode AS ENUM ('quick', 'standard', 'advanced');
CREATE TYPE public.tee_shot_result AS ENUM ('fairway', 'rough', 'sand', 'recovery', 'penalty');

-- Updated at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Profiles
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  handicap_index NUMERIC(3,1),
  preferred_units TEXT NOT NULL DEFAULT 'yards',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Courses
CREATE TABLE public.courses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  location TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view courses" ON public.courses FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create courses" ON public.courses FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Creators can update own courses" ON public.courses FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "Creators can delete own courses" ON public.courses FOR DELETE USING (auth.uid() = created_by);

-- Tee Sets
CREATE TABLE public.tee_sets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#ffffff',
  course_rating NUMERIC(4,1),
  slope_rating INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.tee_sets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view tee sets" ON public.tee_sets FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create tee sets" ON public.tee_sets FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update tee sets" ON public.tee_sets FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can delete tee sets" ON public.tee_sets FOR DELETE USING (auth.uid() IS NOT NULL);

-- Course Holes
CREATE TABLE public.course_holes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  tee_set_id UUID NOT NULL REFERENCES public.tee_sets(id) ON DELETE CASCADE,
  hole_number INTEGER NOT NULL CHECK (hole_number BETWEEN 1 AND 18),
  par INTEGER NOT NULL CHECK (par BETWEEN 3 AND 6),
  yardage INTEGER NOT NULL,
  stroke_index INTEGER CHECK (stroke_index BETWEEN 1 AND 18),
  UNIQUE (tee_set_id, hole_number)
);

ALTER TABLE public.course_holes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view course holes" ON public.course_holes FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create course holes" ON public.course_holes FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update course holes" ON public.course_holes FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can delete course holes" ON public.course_holes FOR DELETE USING (auth.uid() IS NOT NULL);

-- Rounds
CREATE TABLE public.rounds (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  tee_set_id UUID NOT NULL REFERENCES public.tee_sets(id) ON DELETE CASCADE,
  date_played DATE NOT NULL DEFAULT CURRENT_DATE,
  mode round_mode NOT NULL DEFAULT 'standard',
  holes_played INTEGER NOT NULL DEFAULT 18 CHECK (holes_played IN (9, 18)),
  is_completed BOOLEAN NOT NULL DEFAULT false,
  total_score INTEGER,
  is_public BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.rounds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own rounds" ON public.rounds FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Anyone can view public rounds" ON public.rounds FOR SELECT USING (is_public = true);
CREATE POLICY "Users can create own rounds" ON public.rounds FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own rounds" ON public.rounds FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own rounds" ON public.rounds FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_rounds_updated_at BEFORE UPDATE ON public.rounds FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Round Holes
CREATE TABLE public.round_holes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  round_id UUID NOT NULL REFERENCES public.rounds(id) ON DELETE CASCADE,
  hole_number INTEGER NOT NULL CHECK (hole_number BETWEEN 1 AND 18),
  par INTEGER NOT NULL CHECK (par BETWEEN 3 AND 6),
  yardage INTEGER NOT NULL,
  score INTEGER CHECK (score BETWEEN 1 AND 20),
  putts INTEGER CHECK (putts BETWEEN 0 AND 10),
  fairway_hit BOOLEAN,
  gir BOOLEAN,
  penalty_strokes INTEGER NOT NULL DEFAULT 0,
  scramble_attempted BOOLEAN,
  scramble_converted BOOLEAN,
  sand_save_attempted BOOLEAN,
  sand_save_converted BOOLEAN,
  tee_shot_result tee_shot_result,
  approach_result TEXT,
  UNIQUE (round_id, hole_number)
);

ALTER TABLE public.round_holes ENABLE ROW LEVEL SECURITY;

-- Security definer function to check round ownership
CREATE OR REPLACE FUNCTION public.owns_round(_round_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.rounds WHERE id = _round_id AND user_id = auth.uid()
  )
$$;

CREATE OR REPLACE FUNCTION public.is_round_public(_round_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.rounds WHERE id = _round_id AND is_public = true
  )
$$;

CREATE POLICY "Users can view own round holes" ON public.round_holes FOR SELECT USING (public.owns_round(round_id));
CREATE POLICY "Anyone can view public round holes" ON public.round_holes FOR SELECT USING (public.is_round_public(round_id));
CREATE POLICY "Users can create own round holes" ON public.round_holes FOR INSERT WITH CHECK (public.owns_round(round_id));
CREATE POLICY "Users can update own round holes" ON public.round_holes FOR UPDATE USING (public.owns_round(round_id));
CREATE POLICY "Users can delete own round holes" ON public.round_holes FOR DELETE USING (public.owns_round(round_id));

-- Indexes for performance
CREATE INDEX idx_rounds_user_id ON public.rounds(user_id);
CREATE INDEX idx_rounds_course_id ON public.rounds(course_id);
CREATE INDEX idx_round_holes_round_id ON public.round_holes(round_id);
CREATE INDEX idx_course_holes_course_id ON public.course_holes(course_id);
CREATE INDEX idx_course_holes_tee_set_id ON public.course_holes(tee_set_id);
CREATE INDEX idx_tee_sets_course_id ON public.tee_sets(course_id);
