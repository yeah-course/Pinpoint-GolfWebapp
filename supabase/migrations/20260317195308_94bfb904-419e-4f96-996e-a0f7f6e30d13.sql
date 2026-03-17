
ALTER TABLE public.round_holes
  ADD COLUMN approach_start_lie text,
  ADD COLUMN approach_distance integer,
  ADD COLUMN putt_distance_feet integer;
