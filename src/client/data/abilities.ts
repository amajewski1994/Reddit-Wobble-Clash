import type { CharacterAbilities } from '../../shared/types/characters';

//

export const abilities: CharacterAbilities[] = [
  {
    id: 0,
    class: 'Warrior',
    abilities: {
      passive: {
        name: 'Battle Spirit',
        description: 'Gains +2 Attack for each defeated enemy.',
        category: 'boost',
        cooldown: null,
      },
      active: [
        {
          name: 'Power Strike',
          description: 'Next attack deals 50% more damage.',
          category: 'boost',
          cooldown: 2,
        },
        {
          name: 'Cleansing Strike',
          description: 'Removes all bonuses from the target for 3 turns.',
          category: 'reduce',
          cooldown: 3,
        },
        {
          name: 'Second Wind',
          description: 'Restore 20 HP.',
          category: 'heal',
          cooldown: 3,
        },
      ],
    },
  },
  {
    id: 1,
    class: 'Guardian',
    abilities: {
      passive: {
        name: 'Protector',
        description: 'Adjacent allies gain +1 Defence.',
        category: 'boost',
        cooldown: null,
      },
      active: [
        {
          name: 'Shield Wall',
          description: 'Gain +4 Defence for 2 turns.',
          category: 'boost',
          cooldown: 4,
        },
        {
          name: 'Protect',
          description: 'Take damage instead of an adjacent ally for 1 turn.',
          category: 'utility',
          cooldown: 2,
        },
        {
          name: 'Taunt',
          description: 'Removes 10 Accuracy from the target for 3 turns.',
          category: 'reduce',
          cooldown: 2,
        },
      ],
    },
  },
  {
    id: 2,
    class: 'Healer',
    abilities: {
      passive: {
        name: 'Natural Recovery',
        description: 'Restore 5 HP at the start of each turn.',
        category: 'heal',
        cooldown: null,
      },
      active: [
        {
          name: 'Heal',
          description: 'Restore 20 HP to a target ally.',
          category: 'heal',
          cooldown: 2,
        },
        {
          name: 'Group Heal',
          description: 'Restore 20 HP to all allies.',
          category: 'heal',
          cooldown: 4,
        },
        {
          name: 'Cleanse',
          description: 'Add +5 defence for 1 turn.',
          category: 'boost',
          cooldown: 4,
        },
      ],
    },
  },
  {
    id: 3,
    class: 'Support',
    abilities: {
      passive: {
        name: 'Encouragement',
        description: 'Adjacent allies gain +1 Attack.',
        category: 'boost',
        cooldown: null,
      },
      active: [
        {
          name: 'Inspire',
          description: 'Target ally gains +3 Attack for 2 turns.',
          category: 'boost',
          cooldown: 3,
        },
        {
          name: 'Fortify',
          description: 'Target ally gains +3 Defence for 2 turns.',
          category: 'boost',
          cooldown: 3,
        },
        {
          name: 'Quick Step',
          description: 'Target ally gains +1 AP.',
          category: 'boost',
          cooldown: 2,
        },
      ],
    },
  },
  {
    id: 4,
    class: 'Champion',
    abilities: {
      passive: {
        name: 'Crushing Blows',
        description: 'First attack in battle deals +100% damage.',
        category: 'boost',
        cooldown: null,
      },
      active: [
        {
          name: 'Smash',
          description: 'Attack with +50% attack value.',
          category: 'attack',
          cooldown: 3,
        },
        {
          name: 'Cleave',
          description: 'Attack two enemies.',
          category: 'attack',
          cooldown: 3,
        },
        {
          name: 'Rage',
          description: 'Gain +5 Attack for 2 turns.',
          category: 'boost',
          cooldown: 4,
        },
      ],
    },
  },
  {
    id: 5,
    class: 'Sharpshooter',
    abilities: {
      passive: {
        name: 'Eagle Eye',
        description: 'Ignore enemy Dodge bonuses.',
        category: 'boost',
        cooldown: null,
      },
      active: [
        {
          name: 'Precise Shot',
          description: 'This attack cannot be dodged.',
          category: 'attack',
          cooldown: 2,
        },
        {
          name: 'Focus',
          description: 'Gain +50 Accuracy for 1 turn.',
          category: 'boost',
          cooldown: 3,
        },
        {
          name: 'Double Shot',
          description: 'Gains +5 Attack for 1 turn.',
          category: 'boost',
          cooldown: 3,
        },
      ],
    },
  },
  {
    id: 6,
    class: 'Nimble',
    abilities: {
      passive: {
        name: 'Evasion',
        description: 'Ignore enemy Accuracy bonuses.',
        category: 'boost',
        cooldown: null,
      },
      active: [
        {
          name: 'Dash',
          description: 'Move up to 2 tiles.',
          category: 'utility',
          cooldown: 2,
        },
        {
          name: 'Counter Step',
          description: 'Gains + 30 Accuracy for 2 turns.',
          category: 'boost',
          cooldown: 3,
        },
        {
          name: 'Blur',
          description: 'Gain +20 Dodge for 2 turns.',
          category: 'boost',
          cooldown: 4,
        },
      ],
    },
  },
  {
    id: 7,
    class: 'Runner',
    abilities: {
      passive: {
        name: 'Fast Feet',
        description: 'Gain +1 AP each turn.',
        category: 'boost',
        cooldown: null,
      },
      active: [
        {
          name: 'Sprint',
          description: 'Move up to 2 tiles.',
          category: 'utility',
          cooldown: 1,
        },
        {
          name: 'Relay',
          description: 'Add 1 AP to a target ally.',
          category: 'boost',
          cooldown: 3,
        },
        {
          name: 'Hit and Run',
          description: 'Move in random direction after attack.',
          category: 'utility',
          cooldown: 2,
        },
      ],
    },
  },
  {
    id: 8,
    class: 'Grass Warden',
    abilities: {
      passive: {
        name: "Nature's Blessing",
        description: 'Restore 10 HP each turn while standing on the Grass.',
        category: 'heal',
        cooldown: null,
      },
      active: [
        {
          name: 'Root Trap',
          description: 'Target enemy loses 1 AP next turn.',
          category: 'reduce',
          cooldown: 2,
        },
        {
          name: 'Vine Shield',
          description: 'Gain +3 Defence while on Grass for 3 turns.',
          category: 'boost',
          cooldown: 3,
        },
        {
          name: 'Bloom',
          description: 'Gain +7 Attack while on Grass for 3 turns.',
          category: 'boost',
          cooldown: 4,
        },
      ],
    },
  },
  {
    id: 9,
    class: 'Sand Warden',
    abilities: {
      passive: {
        name: 'Desert Walker',
        description: 'Gain +10 Dodge while standing on the Sand.',
        category: 'boost',
        cooldown: null,
      },
      active: [
        {
          name: 'Sandstorm',
          description: 'Target enemy lose 20 Accuracy for 1 turn.',
          category: 'reduce',
          cooldown: 2,
        },
        {
          name: 'Sand Shield',
          description: 'Gain +3 defence for 2 turns.',
          category: 'boost',
          cooldown: 3,
        },
        {
          name: 'Dune Rush',
          description: 'Move up to 3 tiles while standing on the Sand.',
          category: 'utility',
          cooldown: 1,
        },
      ],
    },
  },
  {
    id: 10,
    class: 'Stone Warden',
    abilities: {
      passive: {
        name: 'Stone Skin',
        description: 'Gain +5 Defence while standing on the Stone.',
        category: 'boost',
        cooldown: null,
      },
      active: [
        {
          name: 'Stone Smash',
          description: 'Attack with +50% attack value.',
          category: 'attack',
          cooldown: 3,
        },
        {
          name: 'Fortify',
          description: 'Gain +5 Defence for 2 turns.',
          category: 'boost',
          cooldown: 3,
        },
        {
          name: 'Earthquake',
          description: 'Attack 2 enemies.',
          category: 'attack',
          cooldown: 3,
        },
      ],
    },
  },
  {
    id: 11,
    class: 'Dirt Warden',
    abilities: {
      passive: {
        name: 'Solid Ground',
        description: 'Gain 100% Accuracy while standing on the Dirt.',
        category: 'utility',
        cooldown: null,
      },
      active: [
        {
          name: 'Mud Trap',
          description: 'Target enemy loses 1 AP next turn.',
          category: 'reduce',
          cooldown: 2,
        },
        {
          name: 'Dig In',
          description: 'Gain +4 Defence for 2 turns.',
          category: 'boost',
          cooldown: 3,
        },
        {
          name: 'Earth Boost',
          description: 'Gain +10 Attack while on Dirt for 2 turns.',
          category: 'boost',
          cooldown: 4,
        },
      ],
    },
  },
  {
    id: 12,
    class: 'Veteran',
    abilities: {
      passive: {
        name: 'Toughness',
        description: 'Gain +20 maximum HP.',
        category: 'boost',
        cooldown: null,
      },
      active: [
        {
          name: 'Endure',
          description: 'HP cannot drop below 1 until next turn.',
          category: 'utility',
          cooldown: 4,
        },
        {
          name: 'Recover',
          description: 'Restore 30 HP.',
          category: 'heal',
          cooldown: 4,
        },
        {
          name: 'Stand Firm',
          description: 'Become immune to all damage for 1 turn.',
          category: 'utility',
          cooldown: 5,
        },
      ],
    },
  },
  {
    id: 13,
    class: 'Adventurer',
    abilities: {
      passive: {
        name: 'Jack of All Trades',
        description: 'Gain +10 Attack and +5 Defence.',
        category: 'boost',
        cooldown: null,
      },
      active: [
        {
          name: 'Adapt',
          description: 'Randomly gain +10 Attack or +5 Defence for 2 turns.',
          category: 'boost',
          cooldown: 4,
        },
        {
          name: 'Lucky Find',
          description: 'Refresh a random ability of a target ally.',
          category: 'utility',
          cooldown: 4,
        },
        {
          name: 'Motivation',
          description: 'Target ally gains +3 AP.',
          category: 'boost',
          cooldown: 6,
        },
      ],
    },
  },
  {
    id: 14,
    class: 'Rock Warden',
    abilities: {
      passive: {
        name: 'Mountain Strength',
        description: 'Gain +3 Attack while on Rocks.',
        category: 'boost',
        cooldown: null,
      },
      active: [
        {
          name: 'Boulder Slam',
          description: 'This attack cannot be missed.',
          category: 'attack',
          cooldown: 1,
        },
        {
          name: 'Stone Guard',
          description: 'Gain +5 Defence while on Rocks for 3 turns.',
          category: 'boost',
          cooldown: 3,
        },
        {
          name: 'Avalanche',
          description: 'Attack 2 enemies.',
          category: 'attack',
          cooldown: 3,
        },
      ],
    },
  },
];
