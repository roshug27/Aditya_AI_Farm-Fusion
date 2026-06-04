-- Create yield predictions history table
CREATE TABLE public.yield_predictions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  crop_name TEXT NOT NULL,
  year INTEGER NOT NULL,
  rainfall NUMERIC NOT NULL,
  pesticide NUMERIC NOT NULL,
  temperature NUMERIC NOT NULL,
  area NUMERIC NOT NULL,
  predicted_yield NUMERIC NOT NULL,
  confidence INTEGER NOT NULL,
  recommendations TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.yield_predictions ENABLE ROW LEVEL SECURITY;

-- Users can view their own predictions
CREATE POLICY "Users can view their own predictions"
ON public.yield_predictions
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own predictions
CREATE POLICY "Users can insert their own predictions"
ON public.yield_predictions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own predictions
CREATE POLICY "Users can delete their own predictions"
ON public.yield_predictions
FOR DELETE
USING (auth.uid() = user_id);