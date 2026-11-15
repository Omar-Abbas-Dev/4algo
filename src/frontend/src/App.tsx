import React, { useMemo } from 'react';
import { ContainerContext, createContainer } from './app/container';
import { ArenaPage } from './presentation/pages/ArenaPage';
import { ErrorBoundary } from './app/ErrorBoundary';

export const App: React.FC = () => {
  const container = useMemo(() => createContainer(), []);

  return (
    <ErrorBoundary>
      <ContainerContext.Provider value={container}>
        <ArenaPage />
      </ContainerContext.Provider>
    </ErrorBoundary>
  );
};

export default App;
