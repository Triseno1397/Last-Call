import { useEffect, type ReactElement } from 'react';
import { useGameStore } from '@/state/gameStore';
import { TitleScreen } from '@/ui/screens/TitleScreen';
import { CreationScreen } from '@/ui/screens/CreationScreen';
import { CityScreen } from '@/ui/screens/CityScreen';
import { DayEndScreen } from '@/ui/screens/DayEndScreen';
import { WeekEndScreen } from '@/ui/screens/WeekEndScreen';

export function App(): ReactElement {
  const screen = useGameStore((store) => store.screen);
  const game = useGameStore((store) => store.game);

  // A new screen always starts at the top, however far down the last one was.
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [screen]);

  const body = (): ReactElement => {
    if (screen === 'creation') return <CreationScreen />;
    if (!game) return <TitleScreen />;
    if (screen === 'dayEnd') return <DayEndScreen game={game} />;
    if (screen === 'weekEnd') return <WeekEndScreen game={game} />;
    if (screen === 'city') return <CityScreen game={game} />;
    return <TitleScreen />;
  };

  return (
    <div className="min-h-[100dvh] w-full">
      <div className="mx-auto flex min-h-[100dvh] w-full max-w-[720px] flex-col px-4">{body()}</div>
    </div>
  );
}
