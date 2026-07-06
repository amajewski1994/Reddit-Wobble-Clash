import './index.css';

import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { navigateTo } from '@devvit/web/client';
import { useCounter } from './hooks/useCounter';
import { Map } from './components/map';
import { MapUI } from './components/createMapUI';

export const App = () => {
  // const { count, username, loading, increment, decrement } = useCounter();
  const [selectedTileName, setSelectedTileName] = useState<string | null>(null);
  const [rotatingTileId, setRotatingTileId] = useState<number | null>(null);

  return (
    <div>
      <MapUI
        selectedTileName={selectedTileName}
        onSelectTileName={setSelectedTileName}
        onResetRotation={() => setRotatingTileId(null)}
      />
      <Map
        selectedTileName={selectedTileName}
        rotatingTileId={rotatingTileId}
        onRotatingTileIdChange={setRotatingTileId}
      />
    </div>
  );
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
