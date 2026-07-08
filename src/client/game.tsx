import './index.css';

import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { navigateTo } from '@devvit/web/client';
import { useCounter } from './hooks/useCounter';
import { Map } from './components/createMapMode/createMap';
import { MapUI } from './components/createMapMode/createMapUI';
import { DuelMap } from './components/duelMode/duelMap';
import { DuelMapUI } from './components/duelMode/duelMapUI';
import { userTeam, enemyTeam as initialEnemyTeam } from './components/duelMode/teamsDate';
import { GameInfo } from './data/game';

export const App = () => {
  // const { count, username, loading, increment, decrement } = useCounter();
  const [selectedTileName, setSelectedTileName] = useState<string | null>(null);
  const [rotatingTileId, setRotatingTileId] = useState<number | null>(null);
  const [team, setTeam] = useState(userTeam);
  const [enemyTeam, setEnemyTeam] = useState(initialEnemyTeam);
  const [activeAvatarId, setActiveAvatarId] = useState<number | null>(null);
  const [isMoveMode, setIsMoveMode] = useState(false);
  const [isAttackMode, setIsAttackMode] = useState(false);
  const [turn, setTurn] = useState(GameInfo.turn);

  const handleSelectAvatarId = (id: number | null) => {
    setActiveAvatarId(id);
    setIsMoveMode(false);
    setIsAttackMode(false);
  };

  const handleMove = () => {
    setIsMoveMode(true);
    setIsAttackMode(false);
  };

  const handleAttack = () => {
    setIsAttackMode(true);
    setIsMoveMode(false);
  };

  const handleMoveAvatarToTile = (tileId: number) => {
    if (activeAvatarId === null) return;
    setTeam((prev) =>
      prev.map((member) =>
        member.id === activeAvatarId
          ? { ...member, tileID: tileId, AP: Math.max(0, member.AP - 1) }
          : member
      )
    );
    handleSelectAvatarId(null);
  };

  const handleAttackTile = (attackerId: number, targetId: number) => {
    const attacker = [...team, ...enemyTeam].find(({ id }) => id === attackerId);
    if (!attacker) return;

    const applyDamage = (member: (typeof team)[number]) => {
      if (member.id !== targetId) return member;
      const nextHp = member.hp - attacker.attack + member.defence;
      return { ...member, hp: nextHp <= 0 ? 0 : nextHp };
    };

    const applyApCost = (member: (typeof team)[number]) => {
      if (member.id !== attackerId) return member;
      return { ...member, AP: Math.max(0, member.AP - 1) };
    };

    setTeam((prev) => prev.map(applyDamage).map(applyApCost));
    setEnemyTeam((prev) => prev.map(applyDamage).map(applyApCost));
    handleSelectAvatarId(null);
  };

  const handleUtilities = () => {
    if (activeAvatarId === null) return;
    setTeam((prev) =>
      prev.map((member) =>
        member.id === activeAvatarId ? { ...member, AP: Math.max(0, member.AP - 1) } : member
      )
    );
    handleSelectAvatarId(null);
  };

  const handleEndTurn = () => {
    setTurn((prev) => prev + 1);
    setTeam((prev) =>
      prev.map((member) => {
        const initial = userTeam.find(({ id }) => id === member.id);
        return initial ? { ...member, AP: initial.AP } : member;
      })
    );
  };

  return (
    <div>
      {/* <MapUI
        selectedTileName={selectedTileName}
        onSelectTileName={setSelectedTileName}
        onResetRotation={() => setRotatingTileId(null)}
      />
      <Map
        selectedTileName={selectedTileName}
        rotatingTileId={rotatingTileId}
        onRotatingTileIdChange={setRotatingTileId}
      /> */}

      <DuelMapUI
        team={team}
        enemyTeam={enemyTeam}
        activeAvatarId={activeAvatarId}
        onSelectAvatarId={handleSelectAvatarId}
        isMoveMode={isMoveMode}
        isAttackMode={isAttackMode}
        onAttack={handleAttack}
        onMove={handleMove}
        onUtilities={handleUtilities}
        turn={turn}
        onEndTurn={handleEndTurn}
      />
      <DuelMap
        selectedTileName={selectedTileName}
        team={team}
        enemyTeam={enemyTeam}
        activeAvatarId={activeAvatarId}
        isMoveMode={isMoveMode}
        isAttackMode={isAttackMode}
        onMoveAvatarToTile={handleMoveAvatarToTile}
        onAttackTile={handleAttackTile}
      />
    </div>
  );
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
