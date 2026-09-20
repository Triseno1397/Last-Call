import { useEffect, type ReactElement } from 'react';
import { useGameStore } from '@/state/gameStore';
import { TitleScreen } from '@/ui/screens/TitleScreen';
import { CreationScreen } from '@/ui/screens/CreationScreen';
import { CityScreen } from '@/ui/screens/CityScreen';
import { DayEndScreen } from '@/ui/screens/DayEndScreen';
import { WeekEndScreen } from '@/ui/screens/WeekEndScreen';
import { VenueScreen } from '@/ui/screens/VenueScreen';
import { EncounterScreen } from '@/ui/screens/EncounterScreen';
import { EncounterEndScreen } from '@/ui/screens/EncounterEndScreen';
import { GalleryScreen } from '@/ui/screens/GalleryScreen';
import { PhoneScreen } from '@/ui/screens/PhoneScreen';
import { ThreadScreen } from '@/ui/screens/ThreadScreen';
import { SettingsScreen } from '@/ui/screens/SettingsScreen';

export function App(): ReactElement {
  const screen = useGameStore((store) => store.screen);
  const game = useGameStore((store) => store.game);
  const visit = useGameStore((store) => store.visit);
  const encounter = useGameStore((store) => store.encounter);
  const openThreadId = useGameStore((store) => store.openThreadId);

  // A new screen always starts at the top, however far down the last one was.
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [screen]);

  const body = (): ReactElement => {
    if (screen === 'creation') return <CreationScreen />;
    if (!game) return <TitleScreen />;
    switch (screen) {
      case 'dayEnd':
        return <DayEndScreen game={game} />;
      case 'weekEnd':
        return <WeekEndScreen game={game} />;
      case 'venue':
        return visit ? <VenueScreen game={game} visit={visit} /> : <CityScreen game={game} />;
      case 'encounter':
      case 'date':
        return <EncounterScreen game={game} encounter={encounter} />;
      case 'phone':
        return <PhoneScreen game={game} />;
      case 'thread':
        return openThreadId ? (
          <ThreadScreen game={game} threadId={openThreadId} />
        ) : (
          <PhoneScreen game={game} />
        );
      case 'encounterEnd':
        return <EncounterEndScreen game={game} encounter={encounter} />;
      case 'gallery':
        return <GalleryScreen game={game} />;
      case 'settings':
        return <SettingsScreen game={game} />;
      case 'city':
        return <CityScreen game={game} />;
      default:
        return <TitleScreen />;
    }
  };

  const reduced = game?.settings.reducedMotion ?? false;

  return (
    <div className="min-h-[100dvh] w-full" data-reduced-motion={reduced ? 'true' : undefined}>
      <div className="mx-auto flex min-h-[100dvh] w-full max-w-[720px] flex-col px-4">
        <div key={screen} className={reduced ? '' : 'screen-in'}>
          {body()}
        </div>
      </div>
    </div>
  );
}
