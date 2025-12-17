import { useGameSettings } from './useGameSettings';
import { toast } from './use-toast';

export const useGameManagement = () => {
  const { data: gameSettings, updateGameSetting } = useGameSettings();

  const pauseGame = (gameType: string) => {
    const game = gameSettings?.find(g => g.game_type === gameType);
    if (!game) return;

    updateGameSetting({
      gameType,
      updates: { is_paused: true }
    });

    toast({
      title: "Game Paused",
      description: `${gameType.replace('_', ' ')} has been paused successfully.`,
    });
  };

  const resumeGame = (gameType: string) => {
    const game = gameSettings?.find(g => g.game_type === gameType);
    if (!game) return;

    updateGameSetting({
      gameType,
      updates: { is_paused: false }
    });

    toast({
      title: "Game Resumed",
      description: `${gameType.replace('_', ' ')} has been resumed successfully.`,
    });
  };

  const toggleGameStatus = (gameType: string) => {
    const game = gameSettings?.find(g => g.game_type === gameType);
    if (!game) return;

    if (game.is_paused) {
      resumeGame(gameType);
    } else {
      pauseGame(gameType);
    }
  };

  const isGamePaused = (gameType: string) => {
    const game = gameSettings?.find(g => g.game_type === gameType);
    return game?.is_paused || false;
  };

  return {
    pauseGame,
    resumeGame,
    toggleGameStatus,
    isGamePaused,
    gameSettings
  };
};