import { createContext, useContext } from 'react';
import { HttpGateways } from '../infrastructure/api/HttpGateways';
import { RaceAnimator } from '../application/services/RaceAnimator';
import { MapGateway, RaceGateway, StatsGateway } from '../application/ports/ports';

export interface AppContainer {
  raceGateway: RaceGateway;
  mapGateway: MapGateway;
  statsGateway: StatsGateway;
  raceAnimator: RaceAnimator;
}

export function createContainer(): AppContainer {
  const backendBaseUrl = 'http://localhost:5000/api';
  const gateways = new HttpGateways(backendBaseUrl);
  const raceAnimator = new RaceAnimator();

  return {
    raceGateway: gateways,
    mapGateway: gateways,
    statsGateway: gateways,
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
