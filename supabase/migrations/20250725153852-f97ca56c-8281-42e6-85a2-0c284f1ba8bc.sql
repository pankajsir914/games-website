-- Create initial Color Prediction round to start the game
INSERT INTO public.color_prediction_rounds (
  round_number,
  period,
  status,
  bet_end_time,
  total_bets_amount,
  total_players
) VALUES (
  1,
  '20250125001',
  'betting',
  NOW() + INTERVAL '30 seconds',
  0.00,
  0
);