import { createContext, useContext } from 'react';
import { HttpGateways } from '../infrastructure/api/HttpGateways';
import { BrowserSoundPlayer } from '../infrastructure/audio/BrowserSoundPlayer';
import { RaceAnimator } from '../application/services/RaceAnimator';
import { MapGateway, RaceGateway, SoundPlayer, StatsGateway } from '../application/ports/ports';

export interface AppContainer {
  raceGateway: RaceGateway;
  mapGateway: MapGateway;
  statsGateway: StatsGateway;
  soundPlayer: SoundPlayer;
  raceAnimator: RaceAnimator;
}

export function createContainer(): AppContainer {
  const backendBaseUrl = 'http://localhost:5000/api';
  const gateways = new HttpGateways(backendBaseUrl);
  const soundPlayer = new BrowserSoundPlayer(`${backendBaseUrl}/audio`);
  const raceAnimator = new RaceAnimator();
  raceAnimator.setSoundPlayer(soundPlayer);

  return {
    raceGateway: gateways,
    mapGateway: gateways,
    statsGateway: gateways,
    soundPlayer,
    raceAnimator,
  };
}

export const ContainerContext = createContext<AppContainer | null>(null);

export function useContainer(): AppContainer {
  const container = useContext(ContainerContext);
  if (!container) {
    throw new Error('useContainer must be used within a ContainerContext.Provider');
  }
  return container;
}
