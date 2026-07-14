import { useState } from 'react';
import type { DuelMapUIProps } from '../../types/duelMap';
import type { TeamMember, TeamMemberTileStatistics } from '../../types/team';
import { UserInfo } from '../../data/userInfo';
import { duelMapTilesData } from './duelMapTilesData';
import { actionButtonClassName, getMaxHp, HpBar } from './duelMapShared';
import {
  getActiveStatusNames,
  getEffectiveBonus,
  getOwnPassiveDefenceBonus,
  getPassiveAllyAttackBonus,
  getPassiveAttackBonus,
  getPassiveDefenceBonus,
  getPassiveDodgeBonus,
  getStatModifierTotal,
} from '../../utils/abilities';
import { getTileBPBonus } from '../../utils/tileBonus';
import { isNeighborTile } from '../../utils/adjacency';
import { DuelSidePanel } from './duelSidePanel';

const END_TURN_HIDE_DURATION_MS = 3000;

const abbreviateAvatarName = (name: string) => {
  return name
    .split('_')
    .map((part) => {
      const versionMatch = part.match(/^v(\d+)$/i);
      if (versionMatch) return versionMatch[1];
      return part.charAt(0).toUpperCase();
    })
    .join('');
};

const TILE_BP_LABELS: Record<keyof TeamMemberTileStatistics, string> = {
  grassBP: 'Grass',
  sandBP: 'Sand',
  stoneBP: 'Stone',
  dirtBP: 'Dirt',
  forestBP: 'Forest',
  desertBP: 'Desert',
  rocksBP: 'Rocks',
};

const formatTileName = (tileName: string) =>
  tileName
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' / ');

const getTile = (tileID: number) =>
  duelMapTilesData.find(({ id }) => id === tileID);

const getTileName = (tileID: number) => getTile(tileID)?.tileName ?? '';

const HudCorners = () => (
  <>
    <span className="duel-corner top-0 left-0 border-t-2 border-l-2" />
    <span className="duel-corner top-0 right-0 border-t-2 border-r-2" />
    <span className="duel-corner bottom-0 left-0 border-b-2 border-l-2" />
    <span className="duel-corner bottom-0 right-0 border-b-2 border-r-2" />
  </>
);

const StatRow = ({
  label,
  value,
  bonus,
}: {
  label: string;
  value: number;
  bonus: number;
}) => (
  <div className="flex justify-between text-sm">
    <span className="game-label">{label}</span>
    <span>
      {value + bonus}
      {bonus !== 0 && (
        <span className="opacity-70">
          {' '}
          ({bonus > 0 ? '+' : ''}
          {bonus})
        </span>
      )}
    </span>
  </div>
);

const FullCard = ({
  avatar,
  opposingTeam,
  allyTeam,
  isEnemy,
  isMoveMode,
  isAttackMode,
  isAbilitiesOpen,
  isAbilityMode,
  onAttack,
  onMove,
  onAbilities,
}: {
  avatar: TeamMember;
  opposingTeam: TeamMember[];
  allyTeam: TeamMember[];
  isEnemy: boolean;
  isMoveMode: boolean;
  isAttackMode: boolean;
  isAbilitiesOpen: boolean;
  isAbilityMode: boolean;
  onAttack: () => void;
  onMove: () => void;
  onAbilities: () => void;
}) => {
  const isDead = avatar.statistics.hp <= 0;
  const avatarTile = getTile(avatar.tileID);
  const avatarTileName = avatarTile?.tileName ?? '';
  const tileBonus = getEffectiveBonus(
    getTileBPBonus(avatarTileName, avatar.statistics.tileBP),
    avatar
  );
  const abilityAttackBoost = getStatModifierTotal(
    avatar,
    'attack',
    avatar.statistics.attack
  );
  const passiveAttackBoost = getEffectiveBonus(
    getPassiveAttackBonus(avatar, opposingTeam, avatarTileName),
    avatar
  );
  const allyAttackBoost = getEffectiveBonus(
    getPassiveAllyAttackBonus(avatar, allyTeam, (ally) => {
      const allyTile = getTile(ally.tileID);
      return !!avatarTile && !!allyTile && isNeighborTile(allyTile, avatarTile);
    }),
    avatar
  );
  const defenceAbilityBoost = getStatModifierTotal(
    avatar,
    'defence',
    avatar.statistics.defence
  );
  const passiveDefenceBoost = getEffectiveBonus(
    getPassiveDefenceBonus(avatar, allyTeam, (ally) => {
      const allyTile = getTile(ally.tileID);
      return !!avatarTile && !!allyTile && isNeighborTile(allyTile, avatarTile);
    }),
    avatar
  );
  const ownPassiveDefenceBoost = getEffectiveBonus(
    getOwnPassiveDefenceBonus(avatar, avatarTileName),
    avatar
  );
  const attackBonus = tileBonus + abilityAttackBoost + passiveAttackBoost + allyAttackBoost;
  const defenceBonus =
    tileBonus + defenceAbilityBoost + passiveDefenceBoost + ownPassiveDefenceBoost;
  const accuracyBonus = getStatModifierTotal(
    avatar,
    'accuracy',
    avatar.statistics.accuracy
  );
  const passiveDodgeBoost = getEffectiveBonus(
    getPassiveDodgeBonus(avatar, avatarTileName),
    avatar
  );
  const dodgeBonus =
    getStatModifierTotal(avatar, 'dodge', avatar.statistics.dodge) + passiveDodgeBoost;
  const activeStatuses = getActiveStatusNames(avatar);

  return (
    <div
      className={`duel-panel ${isEnemy ? 'duel-panel--enemy' : 'duel-panel--team'} fixed top-1/2 right-4 -translate-y-1/2 z-10 w-56 flex flex-col gap-1 p-4 transition-all duration-300 ${
        isMoveMode || isAttackMode || isAbilitiesOpen || isAbilityMode
          ? 'translate-x-[calc(100%+1rem)]'
          : ''
      } ${isDead ? 'opacity-40 grayscale' : ''}`}
    >
      <div className="text-center font-bold">{avatar.name}</div>
      <div className="flex items-center justify-center w-full h-32 rounded-md border-2 border-dashed border-(--panel-border) text-4xl opacity-70">
        {isEnemy ? '💀' : '🪖'}
      </div>
      <div className="flex justify-between text-sm">
        <span className="game-label">HP</span>
        <span className="font-bold">{avatar.statistics.hp}</span>
      </div>
      <HpBar
        hp={avatar.statistics.hp}
        maxHp={getMaxHp(avatar.id)}
        isEnemy={isEnemy}
      />
      <div className="flex justify-between text-sm">
        <span className="game-label">AP</span>
        <span>{avatar.statistics.AP}</span>
      </div>
      <StatRow
        label="Attack"
        value={avatar.statistics.attack}
        bonus={attackBonus}
      />
      <StatRow
        label="Defence"
        value={avatar.statistics.defence}
        bonus={defenceBonus}
      />
      <StatRow
        label="Dodge"
        value={avatar.statistics.dodge}
        bonus={dodgeBonus}
      />
      <StatRow
        label="Accuracy"
        value={avatar.statistics.accuracy}
        bonus={accuracyBonus}
      />
      {activeStatuses.length > 0 && (
        <div className="flex flex-wrap gap-1 border-t border-(--panel-border) pt-2">
          {activeStatuses.map((status) => (
            <span
              key={status}
              className="text-[10px] font-semibold uppercase game-label rounded border border-(--panel-border) px-1.5 py-0.5"
            >
              {status}
            </span>
          ))}
        </div>
      )}
      <div className="flex justify-between text-sm">
        <span className="game-label">Tile</span>
        <span>{formatTileName(getTileName(avatar.tileID))}</span>
      </div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-1 border-t border-(--panel-border) pt-2">
        {(Object.keys(TILE_BP_LABELS) as (keyof typeof TILE_BP_LABELS)[]).map(
          (key) => {
            const value = avatar.statistics.tileBP[key];
            if (value === undefined) return null;
            return (
              <div key={key} className="flex justify-between text-xs">
                <span className="game-label">{TILE_BP_LABELS[key]} BP</span>
                <span>{value}</span>
              </div>
            );
          }
        )}
      </div>
      {!isEnemy && (
        <div className="flex flex-col gap-2">
          <button
            className={actionButtonClassName}
            onClick={onAttack}
            disabled={avatar.statistics.AP === 0 || isDead}
          >
            Attack
          </button>
          <button
            className={actionButtonClassName}
            onClick={onMove}
            disabled={avatar.statistics.AP === 0 || isDead}
          >
            Move
          </button>
          <button
            className={actionButtonClassName}
            onClick={onAbilities}
            disabled={avatar.statistics.AP === 0 || isDead}
          >
            Abilities
          </button>
        </div>
      )}
    </div>
  );
};

type SelectionItem = {
  name: string;
  description?: string | undefined;
  disabled?: boolean | undefined;
  isPassive?: boolean | undefined;
  cooldown?: number | null | undefined;
  remainingCooldown?: number | undefined;
};

const SelectableCard = ({
  name,
  description,
  disabled,
  isPassive,
  cooldown,
  remainingCooldown,
  onSelect,
}: {
  name: string;
  description?: string | undefined;
  disabled?: boolean | undefined;
  isPassive?: boolean | undefined;
  cooldown?: number | null | undefined;
  remainingCooldown?: number | undefined;
  onSelect: () => void;
}) => (
  <div
    onClick={disabled ? undefined : onSelect}
    className={`duel-panel duel-panel--team flex flex-col items-center gap-2 w-28 p-2 transition-opacity ${
      disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:opacity-80'
    }`}
  >
    <div className="flex items-center justify-center w-full h-20 rounded border border-dashed border-(--panel-border) game-label">
      Zdjęcie
    </div>
    <span className="text-xs font-semibold text-center">{name}</span>
    {description && (
      <span className="text-[10px] text-center opacity-70">{description}</span>
    )}
    {isPassive ? (
      <span className="text-[10px] font-semibold uppercase game-label">
        Passive
      </span>
    ) : remainingCooldown && remainingCooldown > 0 ? (
      <span className="text-[10px] game-label">
        Unlocks in {remainingCooldown}{' '}
        {remainingCooldown === 1 ? 'turn' : 'turns'}
      </span>
    ) : (
      typeof cooldown === 'number' && (
        <span className="text-[10px] game-label">Cooldown: {cooldown}</span>
      )
    )}
  </div>
);

const SelectionPopup = ({
  title,
  items,
  onSelectItem,
  onBack,
}: {
  title: string;
  items: SelectionItem[];
  onSelectItem: (name: string) => void;
  onBack: () => void;
}) => (
  <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/40">
    <div className="duel-panel duel-panel--team flex flex-col gap-4 w-full max-w-md mx-4 p-6">
      <div className="text-center font-bold">{title}</div>
      <div className="flex flex-wrap justify-center gap-3">
        {items.map(
          ({ name, description, disabled, isPassive, cooldown, remainingCooldown }) => (
            <SelectableCard
              key={name}
              name={name}
              description={description}
              disabled={disabled}
              isPassive={isPassive}
              cooldown={cooldown}
              remainingCooldown={remainingCooldown}
              onSelect={() => onSelectItem(name)}
            />
          )
        )}
      </div>
      <button className={actionButtonClassName} onClick={onBack}>
        ← Back
      </button>
    </div>
  </div>
);

const BottomTeamCard = ({
  id,
  name,
  hp,
  isActive,
  onSelect,
}: {
  id: number;
  name: string;
  hp: number;
  isActive: boolean;
  onSelect: () => void;
}) => (
  <div
    className={`flex flex-col items-center gap-1 w-14 ${hp <= 0 ? 'opacity-40 grayscale' : ''}`}
  >
    <div
      onClick={onSelect}
      className={`flex items-center justify-center w-14 h-14 shrink-0 rounded-md border-2 cursor-pointer transition-all text-sm font-bold ${
        isActive
          ? 'bg-(--secondary) border-(--secondary) text-white'
          : 'duel-panel duel-panel--team'
      }`}
    >
      {abbreviateAvatarName(name)}
    </div>
    <HpBar hp={hp} maxHp={getMaxHp(id)} isEnemy={false} />
  </div>
);

export const DuelMapUI = ({
  team,
  enemyTeam,
  activeAvatarId,
  onSelectAvatarId,
  isMoveMode,
  isAttackMode,
  onAttack,
  onMove,
  selectedAbilityName,
  onSelectAbility,
  onCancelAbility,
  turn,
  onEndTurn,
}: DuelMapUIProps) => {
  const [isEndingTurn, setIsEndingTurn] = useState(false);
  const [isAbilitiesOpen, setisAbilitiesOpen] = useState(false);
  const [isItemsOpen, setIsItemsOpen] = useState(false);
  const [lastActiveAvatarId, setLastActiveAvatarId] = useState(activeAvatarId);
  const activeAvatar = [...team, ...enemyTeam].find(
    ({ id }) => id === activeAvatarId
  );
  const isActiveAvatarEnemy =
    !!activeAvatar && enemyTeam.some(({ id }) => id === activeAvatarId);
  const isCardOpen = !!activeAvatar;

  if (activeAvatarId !== lastActiveAvatarId) {
    setLastActiveAvatarId(activeAvatarId);
    setisAbilitiesOpen(false);
  }

  const handleEndTurn = () => {
    if (isEndingTurn) return;
    setIsEndingTurn(true);
    onSelectAvatarId(null);
    setTimeout(() => {
      onEndTurn();
      setIsEndingTurn(false);
    }, END_TURN_HIDE_DURATION_MS);
  };

  return (
    <>
      <div
        className={`duel-banner fixed top-4 left-1/2 -translate-x-1/2 z-10 transition-all duration-500 ${
          isEndingTurn ? 'translate-y-[-150%] opacity-0' : 'opacity-100'
        }`}
      >
        <div className="duel-banner__inner px-8 py-2 text-base font-bold uppercase tracking-wide whitespace-nowrap">
          Turn <span className="text-(--primary)">{turn}</span>
        </div>
      </div>
      <DuelSidePanel
        side="left"
        members={team}
        isVisible={!(isCardOpen || isEndingTurn)}
        onSelectAvatarId={onSelectAvatarId}
        onItemsClick={() => setIsItemsOpen(true)}
      />
      <DuelSidePanel
        side="right"
        members={enemyTeam}
        isVisible={!(isCardOpen || isEndingTurn)}
        onSelectAvatarId={onSelectAvatarId}
      />
      {activeAvatar && (
        <button
          className="fixed top-4 right-4 z-20 text-xs font-semibold text-(--primary) hover:underline"
          onClick={() => onSelectAvatarId(null)}
        >
          ← Back
        </button>
      )}
      {activeAvatar && selectedAbilityName && (
        <button
          className="fixed top-12 right-4 z-20 text-xs font-semibold text-(--primary) hover:underline"
          onClick={() => {
            onCancelAbility();
            setisAbilitiesOpen(true);
          }}
        >
          ← Back to Abilities
        </button>
      )}
      {activeAvatar && (
        <FullCard
          avatar={activeAvatar}
          opposingTeam={isActiveAvatarEnemy ? team : enemyTeam}
          allyTeam={isActiveAvatarEnemy ? enemyTeam : team}
          isEnemy={isActiveAvatarEnemy}
          isMoveMode={isMoveMode}
          isAttackMode={isAttackMode}
          isAbilitiesOpen={isAbilitiesOpen}
          isAbilityMode={!!selectedAbilityName}
          onAttack={onAttack}
          onMove={onMove}
          onAbilities={() => setisAbilitiesOpen(true)}
        />
      )}
      {activeAvatar && isAbilitiesOpen && (
        <SelectionPopup
          title="Abilities"
          items={[
            {
              name: activeAvatar.abilities.passive.name,
              description: activeAvatar.abilities.passive.description,
              disabled: true,
              isPassive: true,
              cooldown: activeAvatar.abilities.passive.cooldown,
            },
            ...activeAvatar.abilities.active.map(
              ({ name, description, cooldown }) => {
                const remainingCooldown =
                  activeAvatar.abilityCooldowns[name] ?? 0;
                return {
                  name,
                  description,
                  disabled: remainingCooldown > 0,
                  isPassive: false,
                  cooldown,
                  remainingCooldown,
                };
              }
            ),
          ]}
          onSelectItem={(name) => {
            setisAbilitiesOpen(false);
            onSelectAbility(name);
          }}
          onBack={() => setisAbilitiesOpen(false)}
        />
      )}
      {isItemsOpen && (
        <SelectionPopup
          title="Items"
          items={UserInfo.items.map((name) => ({ name }))}
          onSelectItem={() => setIsItemsOpen(false)}
          onBack={() => setIsItemsOpen(false)}
        />
      )}

      {/* BOTTOM BAR */}
      <div
        className={`fixed bottom-4 inset-x-4 z-10 transition-all duration-500 ${
          isCardOpen || isEndingTurn
            ? 'translate-y-[150%] opacity-0'
            : 'opacity-100'
        }`}
      >
        <div className="relative flex items-center justify-between px-4 py-3">
          <HudCorners />
          <div className="flex gap-2">
            {team.map(({ id, name, statistics }) => (
              <BottomTeamCard
                key={id}
                id={id}
                name={name}
                hp={statistics.hp}
                isActive={activeAvatarId === id}
                onSelect={() => onSelectAvatarId(id)}
              />
            ))}
          </div>
          <button
            className={actionButtonClassName}
            onClick={handleEndTurn}
            disabled={isEndingTurn}
          >
            End Turn
          </button>
        </div>
      </div>
    </>
  );
};
