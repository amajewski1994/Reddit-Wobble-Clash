const items = [
    {
      id: "iron_tonic",
      name: "Iron Tonic",
      target: "self",
      duration: 3,
      statModifiers: {
        defence: 3
      },
      description: "Gain +3 Defence for 3 turns."
    },
    {
      id: "power_cookie",
      name: "Power Cookie",
      target: "self",
      duration: 2,
      statModifiers: {
        attack: 4
      },
      description: "Gain +4 Attack for 2 turns."
    },
    {
      id: "lucky_clover",
      name: "Lucky Clover",
      target: "self",
      duration: 3,
      statModifiers: {
        dodge: 5
      },
      description: "Gain +5 Dodge for 3 turns."
    },
    {
      id: "focus_lens",
      name: "Focus Lens",
      target: "self",
      duration: 3,
      statModifiers: {
        accuracy: 10
      },
      description: "Gain +10 Accuracy for 3 turns."
    },
    {
      id: "energy_berry",
      name: "Energy Berry",
      target: "self",
      duration: 1,
      statModifiers: {
        AP: 1
      },
      description: "Gain +1 AP for 1 turn."
    },
    {
      id: "hero_medal",
      name: "Hero Medal",
      target: "self",
      duration: -1,
      statModifiers: {
        hp: 15
      },
      description: "Gain +15 maximum HP for the entire battle."
    },
    {
      id: "training_badge",
      name: "Training Badge",
      target: "self",
      duration: -1,
      statModifiers: {
        attack: 2,
        accuracy: 5
      },
      description: "Gain +2 Attack and +5 Accuracy for the entire battle."
    },
    {
      id: "guardian_pin",
      name: "Guardian Pin",
      target: "self",
      duration: -1,
      statModifiers: {
        defence: 2,
        dodge: -2
      },
      description: "Gain +2 Defence and lose 2 Dodge for the entire battle."
    },
    {
      id: "swift_ribbon",
      name: "Swift Ribbon",
      target: "self",
      duration: 2,
      statModifiers: {
        AP: 1,
        defence: -2
      },
      description: "Gain +1 AP and lose 2 Defence for 2 turns."
    },
    {
      id: "brave_badge",
      name: "Brave Badge",
      target: "self",
      duration: 3,
      statModifiers: {
        attack: 5,
        accuracy: -10
      },
      description: "Gain +5 Attack and lose 10 Accuracy for 3 turns."
    },
    {
      id: "steady_boots",
      name: "Steady Boots",
      target: "self",
      duration: -1,
      statModifiers: {
        accuracy: 5,
        dodge: 3
      },
      description: "Gain +5 Accuracy and +3 Dodge for the entire battle."
    },
    {
      id: "heavy_helmet",
      name: "Heavy Helmet",
      target: "self",
      duration: -1,
      statModifiers: {
        hp: 10,
        defence: 2,
        dodge: -3
      },
      description: "Gain +10 maximum HP and +2 Defence, but lose 3 Dodge for the entire battle."
    },
    {
      id: "grass_charm",
      name: "Grass Charm",
      target: "self",
      duration: -1,
      statModifiers: {
        tileBP: {
          grassBP: 2
        }
      },
      description: "Gain +2 Grass Battle Power for the entire battle."
    },
    {
      id: "sand_charm",
      name: "Sand Charm",
      target: "self",
      duration: -1,
      statModifiers: {
        tileBP: {
          sandBP: 2
        }
      },
      description: "Gain +2 Sand Battle Power for the entire battle."
    },
    {
      id: "stone_charm",
      name: "Stone Charm",
      target: "self",
      duration: -1,
      statModifiers: {
        tileBP: {
          stoneBP: 2
        }
      },
      description: "Gain +2 Stone Battle Power for the entire battle."
    },
    {
      id: "dirt_charm",
      name: "Dirt Charm",
      target: "self",
      duration: -1,
      statModifiers: {
        tileBP: {
          dirtBP: 2
        }
      },
      description: "Gain +2 Dirt Battle Power for the entire battle."
    },
    {
      id: "forest_charm",
      name: "Forest Charm",
      target: "self",
      duration: -1,
      statModifiers: {
        tileBP: {
          forestBP: 2
        }
      },
      description: "Gain +2 Forest Battle Power for the entire battle."
    },
    {
      id: "desert_charm",
      name: "Desert Charm",
      target: "self",
      duration: -1,
      statModifiers: {
        tileBP: {
          desertBP: 2
        }
      },
      description: "Gain +2 Desert Battle Power for the entire battle."
    },
    {
      id: "rocks_charm",
      name: "Rocks Charm",
      target: "self",
      duration: -1,
      statModifiers: {
        tileBP: {
          rocksBP: 2
        }
      },
      description: "Gain +2 Rocks Battle Power for the entire battle."
    },
    {
      id: "trickster_dust",
      name: "Trickster Dust",
      target: "enemy",
      duration: 2,
      statModifiers: {
        accuracy: -15,
        dodge: -5
      },
      description: "Target enemy loses 15 Accuracy and 5 Dodge for 2 turns."
    }
  ]