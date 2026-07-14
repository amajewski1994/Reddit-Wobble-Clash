import type { CharacterAbilities } from '../types/characters';

export const abilities: CharacterAbilities[] = [
  {
    id: 0,
    class: 'Warrior',
    abilities: {
      passive: {
        name: 'Battle Spirit',
        description: 'After defeating an enemy, gains +2 Attack (max +6).',
      },
      active: [
        {
          name: 'Power Strike',
          description: 'Next attack deals 50% more damage.',
        },
        {
          name: 'Cleansing Strike',
          description: 'Removes all positive effects from the target.',
        },
        {
          name: 'Second Wind',
          description: 'Restore 20 HP.',
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
      },
      active: [
        {
          name: 'Shield Wall',
          description: 'Gain +4 Defence for 2 turns.',
        },
        {
          name: 'Protect',
          description: 'Take damage instead of an adjacent ally for 1 turn.',
        },
        {
          name: 'Taunt',
          description: 'Adjacent enemies lose 10 Accuracy for 1 turn.',
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
      },
      active: [
        {
          name: 'Heal',
          description: 'Restore HP to a target ally.',
        },
        {
          name: 'Group Heal',
          description: 'Restore HP to all adjacent allies.',
        },
        {
          name: 'Cleanse',
          description: 'Remove all negative effects from an ally.',
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
      },
      active: [
        {
          name: 'Inspire',
          description: 'Target ally gains +3 Attack.',
        },
        {
          name: 'Fortify',
          description: 'Target ally gains +3 Defence.',
        },
        {
          name: 'Quick Step',
          description: 'Target ally gains +1 AP next turn.',
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
        description: 'The first attack in battle deals double damage.',
      },
      active: [
        {
          name: 'Smash',
          description: 'Perform a powerful melee attack.',
        },
        {
          name: 'Cleave',
          description: 'Attack all adjacent enemies.',
        },
        {
          name: 'Rage',
          description: 'Gain +5 Attack for 2 turns.',
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
      },
      active: [
        {
          name: 'Precise Shot',
          description: 'This attack cannot be dodged.',
        },
        {
          name: 'Focus',
          description: 'Gain +5 Attack and +10 Accuracy for the next attack.',
        },
        {
          name: 'Double Shot',
          description: 'Attack twice with reduced damage.',
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
        description: 'Gain +10 Dodge.',
      },
      active: [
        {
          name: 'Dash',
          description: 'Move up to 3 tiles instantly.',
        },
        {
          name: 'Counter Step',
          description:
            'After a successful Dodge, your next attack deals 50% more damage.',
        },
        {
          name: 'Blur',
          description: 'Gain +15 Dodge for 1 turn.',
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
        description: 'Gain +1 AP.',
      },
      active: [
        {
          name: 'Sprint',
          description: 'This movement may travel up to 2 tiles instead of 1.',
        },
        {
          name: 'Relay',
          description: 'Give 1 AP to a target ally.',
        },
        {
          name: 'Hit and Run',
          description: 'Move after attacking.',
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
        description: 'Restore 5 HP each turn while standing on Grass.',
      },
      active: [
        {
          name: 'Root Trap',
          description: 'Target enemy loses 1 AP next turn.',
        },
        {
          name: 'Vine Shield',
          description: 'Gain +3 Defence while on Grass.',
        },
        {
          name: 'Bloom',
          description: 'Gain +3 Attack while on Grass.',
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
        description: 'Gain +10 Dodge while on Sand.',
      },
      active: [
        {
          name: 'Sandstorm',
          description: 'Enemies lose 10 Accuracy for 1 turn.',
        },
        {
          name: 'Sand Shield',
          description: 'Reduce incoming damage for 2 turns.',
        },
        {
          name: 'Dune Rush',
          description: 'Move one extra tile while on Sand.',
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
        description: 'Gain +3 Defence while on Stone.',
      },
      active: [
        {
          name: 'Stone Smash',
          description: 'Powerful melee attack.',
        },
        {
          name: 'Fortify',
          description: 'Gain +5 Defence for 2 turns.',
        },
        {
          name: 'Earthquake',
          description: 'Deal damage to all adjacent enemies.',
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
        description: 'Move one extra tile while on Dirt.',
      },
      active: [
        {
          name: 'Mud Trap',
          description: 'Target enemy loses 1 AP next turn.',
        },
        {
          name: 'Dig In',
          description: 'Gain +4 Defence.',
        },
        {
          name: 'Earth Boost',
          description: 'Gain +4 Attack while on Dirt.',
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
      },
      active: [
        {
          name: 'Endure',
          description: 'HP cannot drop below 1 this turn.',
        },
        {
          name: 'Recover',
          description: 'Restore 30 HP.',
        },
        {
          name: 'Stand Firm',
          description: 'Become immune to all damage for 1 turn.',
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
        description: 'Gain +1 Attack and +1 Defence.',
      },
      active: [
        {
          name: 'Adapt',
          description: 'Randomly gain +3 Attack or +3 Defence for 2 turns.',
        },
        {
          name: 'Lucky Find',
          description: 'Refresh a random ability of a target ally.',
        },
        {
          name: 'Motivation',
          description: 'Target ally gains +3 AP next turn.',
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
      },
      active: [
        {
          name: 'Boulder Slam',
          description: 'Perform a powerful melee attack.',
        },
        {
          name: 'Stone Guard',
          description: 'Gain +5 Defence while on Rocks.',
        },
        {
          name: 'Avalanche',
          description: 'Deal damage to all adjacent enemies.',
        },
      ],
    },
  },
];
