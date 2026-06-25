/* ==========================================================================
   PRIMARY PURPOSE: Stores global game state, constant dictionaries,
   initial global state, and system utility functions.
   ========================================================================= */

window.GAME_VERSION = 0.85; // Pre-release Alpha 0.8.5 // Increment this whenever you push a new release

// --- SYSTEM UTILS ---

window.formatNumber = function (num) {
  if (num === null || num === undefined || isNaN(num)) return "0";
  if (num < 1000) {
    return num % 1 === 0 ? num.toFixed(0) : num.toFixed(1);
  }
  const standardSuffixes = [
    "",
    "K",
    "M",
    "B",
    "T",
    "Qa",
    "Qi",
    "Sx",
    "Sp",
    "Oc",
    "No",
    "Dc",
  ];
  const i = Math.floor(Math.log10(num) / 3);
  if (i < standardSuffixes.length) {
    return `${(num / Math.pow(10, i * 3)).toFixed(2)} ${standardSuffixes[i]}`;
  }

  // Procedural alphabetical suffix engine (aa - zz, then aaa - zzz)
  let baseAlpha = i - standardSuffixes.length;
  let suffix = "";
  if (baseAlpha < 676) {
    let char1 = String.fromCharCode(97 + Math.floor(baseAlpha / 26));
    let char2 = String.fromCharCode(97 + (baseAlpha % 26));
    suffix = char1 + char2;
  } else {
    let temp = baseAlpha - 676;
    let char1 = String.fromCharCode(97 + Math.floor(temp / 676));
    let char2 = String.fromCharCode(97 + Math.floor((temp % 676) / 26));
    let char3 = String.fromCharCode(97 + (temp % 26));
    suffix = char1 + char2 + char3;
  }
  suffix = suffix.toUpperCase(); // Gives it the premium 'AAA' look!

  const formatted = (num / Math.pow(10, i * 3)).toFixed(2);
  return `${formatted} ${suffix}`;
};

window.randInt = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min;
window.randFloat = (min, max) => Math.random() * (max - min) + min;

// --- STATIC DATA POOLS ---

window.MYSTICAL_STOCK = [
  {
    name: "SP Reset Scroll",
    cost: 2500,
    currency: "Gold",
    color: "#9b59b6",
    desc: "Refunds spent Skill Points from the Attribute Matrix.",
  },
  {
    name: "PP Reset Scroll",
    cost: 5000,
    currency: "Gold",
    color: "#e67e22",
    desc: "Refunds spent Prestige Points from the Ascension Altar.",
  },
  {
    name: "Gacha Key",
    cost: 5,
    currency: "Luminous Soul",
    color: "#f1c40f",
    desc: "Trade 5 rare Luminous Souls for 1 Vending Gacha Key.",
  },
  {
    name: "Astral Essence",
    cost: 10,
    currency: "Luminous Soul",
    color: "#9b59b6",
    desc: "Trade 10 rare Luminous Souls for 1 Astral Essence.",
  },
  {
    name: "Catalyst Core",
    cost: 15,
    currency: "Astral Shards",
    color: "#2ecc71",
    desc: "Trade 15 Astral Crucible Shards for 1 Catalyst Core.",
  },
];

window.POTION_TRANSMUTATIONS = [
  {
    result: "Greater Attack Elixir",
    req: "Attack Elixir",
    amount: 3,
    color: "#27ae60",
    desc: "Transmute 3x Attack Elixir into 1x Greater Attack Elixir.",
  },
  {
    result: "Supernal Attack Elixir",
    req: "Greater Attack Elixir",
    amount: 3,
    color: "#1e824c",
    desc: "Transmute 3x Greater Attack Elixir into 1x Supernal Attack Elixir.",
  },
  {
    result: "Greater Vitality Elixir",
    req: "Vitality Elixir",
    amount: 3,
    color: "#c0392b",
    desc: "Transmute 3x Vitality Elixir into 1x Greater Vitality Elixir.",
  },
  {
    result: "Supernal Vitality Elixir",
    req: "Greater Vitality Elixir",
    amount: 3,
    color: "#962d22",
    desc: "Transmute 3x Greater Vitality Elixir into 1x Supernal Vitality Elixir.",
  },
  {
    result: "Greater Armored Elixir",
    req: "Armored Elixir",
    amount: 3,
    color: "#2980b9",
    desc: "Transmute 3x Armored Elixir into 1x Greater Armored Elixir.",
  },
  {
    result: "Supernal Armored Elixir",
    req: "Greater Armored Elixir",
    amount: 3,
    color: "#1f3a52",
    desc: "Transmute 3x Greater Armored Elixir into 1x Supernal Armored Elixir.",
  },
  {
    result: "Greater Haste Elixir",
    req: "Haste Elixir",
    amount: 3,
    color: "#f39c12",
    desc: "Transmute 3x Haste Elixir into 1x Greater Haste Elixir.",
  },
  {
    result: "Supernal Haste Elixir",
    req: "Greater Haste Elixir",
    amount: 3,
    color: "#d35400",
    desc: "Transmute 3x Greater Haste Elixir into 1x Supernal Haste Elixir.",
  },
];

window.etcDex = {
  "Eridium Shard":
    "A glowing, alien fragment used in the Forge to Tier Up an item's Star Rarity.",
  "Gacha Key":
    "Guaranteed drop from Rift Guardians. Used at the Vending Machine for a gear roll.",
  "Ancient Core":
    "Rare drop from Stage Bosses. Sacrifice 10 at the Ancient Altar to summon a Rift Guardian.",
  "Overlord's Sigil":
    "Guaranteed drop from the Equipment Dungeon Overlord. Used to temper Unique Artifacts.",
  "Astral Essence":
    "A pulsing, cosmic residue extracted by salvaging Unique Artifacts. Exceedingly rare.",
  "Catalyst Core":
    "Earned in the Crucible or bought from the Alchemy Shop. Spent at the Blacksmith post to re-roll and lock select weapon and armor attributes.",
  "Monster Soul":
    "A dark, swirling essence harvested from fallen standard monsters. Spent for basic forging and trades.",
  "Luminous Soul":
    "A radiant, pure soul dropped by rare monsters. Extremely valuable for advanced mystical trades.",
  "Mythic Scrap":
    "A perfect fragment of mythic-tier gear. Highly sought after for end-game tempering.",
  "Legendary Scrap":
    "A piece of legendary-tier material, essential for high-level tempering.",
  "Epic Scrap":
    "A sturdy piece of epic-tier material used in mid-to-high level tempering.",
  "Magic Scrap": "A glowing magical fragment utilized for mid-tier tempering.",
  "Rare Scrap":
    "A clean scrap of rare metal, useful for early-to-mid-tier tempering.",
};

window.useDex = {
  "Guild Reward Sack": {
    desc: "Standardised Guild Reward. Consume to initiate untying. Guarantees 1 MP and rolls daily loot with consecutive extra item chances!",
    color: "#f1c40f",
  },
  "Guild Weekly Sack": {
    desc: "Venerable Weekly Guild Reward. Consume to break the seal. Guarantees 3 MP, 1x Ancient Core, 1x Overlord's Sigil, 1x Eridium Shard, and 3x Legendary Scraps!",
    color: "#9b59b6",
  },
  "SP Reset Scroll": {
    desc: "Refunds spent Skill Points from the Attribute Matrix.",
    color: "#9b59b6",
  },
  "PP Reset Scroll": {
    desc: "Refunds spent Prestige Points from the Ascension Altar.",
    color: "#e67e22",
  },
  "Attack Elixir": {
    desc: "Increases Attack Power by +10% for 5 minutes (scales with INT).",
    color: "#2ecc71",
  },
  "Greater Attack Elixir": {
    desc: "Increases Attack Power by +20% for 5 minutes (scales with INT).",
    color: "#27ae60",
  },
  "Supernal Attack Elixir": {
    desc: "Increases Attack Power by +35% for 5 minutes (scales with INT).",
    color: "#1e824c",
  },
  "Vitality Elixir": {
    desc: "Increases Max HP by +10% for 5 minutes (scales with INT).",
    color: "#e74c3c",
  },
  "Greater Vitality Elixir": {
    desc: "Increases Max HP by +20% for 5 minutes (scales with INT).",
    color: "#c0392b",
  },
  "Supernal Vitality Elixir": {
    desc: "Increases Max HP by +35% for 5 minutes (scales with INT).",
    color: "#962d22",
  },
  "Armored Elixir": {
    desc: "Increases Defense by +10% for 5 minutes (scales with INT).",
    color: "#3498db",
  },
  "Greater Armored Elixir": {
    desc: "Increases Defense by +20% for 5 minutes (scales with INT).",
    color: "#2980b9",
  },
  "Supernal Armored Elixir": {
    desc: "Increases Defense by +35% for 5 minutes (scales with INT).",
    color: "#1f3a52",
  },
  "Haste Elixir": {
    desc: "Increases movement speed and attack recovery (reduces delay frames) by +10% for 5 minutes (scales with INT).",
    color: "#f1c40f",
  },
  "Greater Haste Elixir": {
    desc: "Increases movement speed and attack recovery (reduces delay frames) by +20% for 5 minutes (scales with INT).",
    color: "#f39c12",
  },
  "Supernal Haste Elixir": {
    desc: "Increases movement speed and attack recovery (reduces delay frames) by +35% for 5 minutes (scales with INT).",
    color: "#d35400",
  },
  "Double XP Potion": {
    desc: "Doubles all acquired experience gains (+100% EXP) for 5 minutes (scales with INT).",
    color: "#a855f7",
  },
  "Double Drop Potion": {
    desc: "Doubles current drop rate multiplier (+100%) for 5 minutes (scales with INT).",
    color: "#22c55e",
  },
  "Drop Quality Potion": {
    desc: "Boosts item drop quality checks by +25% for 5 minutes (scales with INT).",
    color: "#3b82f6",
  },
};

window.ARTIFACT_POOL = [
  {
    name: "Berserker Stone",
    trait: "frenzy",
    desc: "Grants Frenzy Mode for 5s every 15 kills. Passive +3% Crit Chance.",
    breakdown:
      "<strong>Frenzy Buff Breakdown:</strong><br>• Trigger Requirement: <span style='color:#2ecc71;'>Reduced to 15 kills</span><br>• Active Atk Spd: Max Haste (4-frame cap)<br>• Crit Chance: <span style='color:#e67e22;'>100% Guaranteed</span><br>• Crit Multi: <span style='color:#f1c40f;'>+30% Extra Multiplier</span><br>• Passive: <span style='color:#e67e22;'>+3% Base Crit Chance</span>",
    critChance: 0.03,
    dropRate: 0,
    quality: 0,
    goldMulti: 0,
    rareSpawn: 0,
    fairySpawn: 0,
  },
  {
    name: "Blood-Soaked Chalice",
    trait: "vampirism",
    desc: "Heals 0.5% of damage dealt on hit (Capped at 3% Max HP per second globally). Passive +20 Max HP.",
    breakdown:
      "<strong>Vampirism Breakdown:</strong><br>• Life Steal: <span style='color:#e74c3c;'>0.5% of total slash damage</span> directly heals your HP pool.<br>• Global Ceiling: <span style='color:#aaa;'>Capped at 3% of Max HP per second</span> to prevent speed-exploited immortality.<br>• Passive: <span style='color:#e74c3c;'>+20 Flat Max HP</span>",
    maxHp: 20,
    dropRate: 0,
    quality: 0,
    goldMulti: 0,
    rareSpawn: 0,
    fairySpawn: 0,
  },
  {
    name: "Philosopher's Anchor",
    trait: "gold_hoard",
    desc: "Permanent x1.30 Gold Multiplier bonus. Passive +10 Attack.",
    breakdown:
      "<strong>Hoard Breakdown:</strong><br>• Gold: Multiplies direct gold drops from mobs and bosses by flat <span style='color:#f1c40f;'>+30%</span>.<br>• Passive: <span style='color:#f1c40f;'>+10 Flat Attack</span> to support combat pacing.",
    atk: 10,
    dropRate: 0,
    quality: 0,
    goldMulti: 0.3,
    rareSpawn: 0,
    fairySpawn: 0,
  },
  {
    name: "Gilded Scarab",
    trait: "magic_find",
    desc: "+25% Drop Rate and +15% Drop Quality. Passive +5 DEX.",
    breakdown:
      "<strong>Scarab Hunting Breakdown:</strong><br>• Drop Rate: <span style='color:#2ecc71;'>+25% Item Frequency</span><br>• Drop Quality: <span style='color:#9b59b6;'>+15% Higher Stat Line Probability</span><br>• Passive: <span style='color:#3498db;'>+5 Flat DEX</span>",
    dex: 5,
    dropRate: 0.25,
    quality: 0.15,
    goldMulti: 0,
    rareSpawn: 0,
    fairySpawn: 0,
  },
  {
    name: "Windwalker Boots",
    trait: "move_speed",
    desc: "Grants +10% Movement Speed and +3% Parry Rate.",
    breakdown:
      "<strong>Fleet Footed:</strong><br>• Movement: Grants a massive <span style='color:#3498db;'>+10% Movement Speed</span> multiplier.<br>• Defensive: Grants <span style='color:#e74c3c;'>+3% Parry Rate</span> to evade high-stage damage.",
    moveSpeedPct: 0.1,
    parry: 0.03,
    dropRate: 0,
    quality: 0,
    goldMulti: 0,
    rareSpawn: 0,
    fairySpawn: 0,
  },
  {
    name: "Aegis Core",
    trait: "defense",
    desc: "Grants +6% Max HP and +8% Defense.",
    breakdown:
      "<strong>Iron Clad:</strong><br>• Mitigation: Grants a sturdy <span style='color:#3498db;'>+8% Defense</span> multiplier.<br>• Pool: Grants a hearty <span style='color:#e74c3c;'>+6% Max HP</span> multiplier.",
    maxHpPct: 0.06,
    defPct: 0.08,
    dropRate: 0,
    quality: 0,
    goldMulti: 0,
    rareSpawn: 0,
    fairySpawn: 0,
  },
  {
    name: "Riposte Gauntlet",
    trait: "parry_strike",
    desc: "Parrying instantly counters for 50% damage. Passive +2% Parry Rate.",
    breakdown:
      "<strong>Lethal Deflection:</strong><br>• Counter Strike: Successful parries immediately hit back for 50% weapon power.<br>• Passive: Increases your base chance to parry by <span style='color:#e74c3c;'>+2%</span>.",
    parry: 0.02,
    dropRate: 0,
    quality: 0,
    goldMulti: 0,
    rareSpawn: 0,
    fairySpawn: 0,
  },
  {
    name: "Phantom Blade",
    trait: "echo_strike",
    desc: "Attacks have 30% chance to hit a second time for 25% damage. Passive +3 Attack.",
    breakdown:
      "<strong>Echo Strike:</strong><br>• Phantom Hit: Every swing has a <span style='color:#9b59b6;'>30% chance</span> to trigger a secondary hit for 25% damage.<br>• Passive: <span style='color:#f1c40f;'>+3 Flat Attack</span>",
    atk: 3,
    dropRate: 0,
    quality: 0,
    goldMulti: 0,
    rareSpawn: 0,
    fairySpawn: 0,
  },
  {
    name: "Sloth's Blessing",
    trait: "idle_spd",
    desc: "Increases Idle Attack Speed by +15%. Passive +5% Gold Multiplier.",
    breakdown:
      "<strong>Lazy Haste:</strong><br>• Speed Increase: Attacks automatically trigger <span style='color:#3498db;'>15% faster</span>.<br>• Passive: Adds <span style='color:#f1c40f;'>+5% Gold Multiplier</span>.",
    idleAttackSpeed: 0.15,
    goldMulti: 0.05,
    dropRate: 0,
    quality: 0,
    rareSpawn: 0,
    fairySpawn: 0,
  },
  {
    name: "Zealot's Charm",
    trait: "active_spd",
    desc: "Increases Active Attack Speed limit by +10%. Passive +3% Crit Chance.",
    breakdown:
      "<strong>Feverish Swings:</strong><br>• Speed Increase: Increases active clicking speed limit by <span style='color:#2ecc71;'>10%</span>.<br>• Passive: <span style='color:#e67e22;'>+3% Base Crit Chance</span>",
    activeAttackSpeed: 0.1,
    critChance: 0.03,
    dropRate: 0,
    quality: 0,
    goldMulti: 0,
    rareSpawn: 0,
    fairySpawn: 0,
  },
  {
    name: "Survivor's Adrenaline",
    trait: "dodge_buff",
    desc: "Blocking/Parrying grants +30% Dmg for 6s. Passive +2% Block & Parry.",
    breakdown:
      "<strong>Adrenaline Rush:</strong><br>• Buff: +30% damage output temporarily on defensive procs.<br>• Passive: Adds <span style='color:#3498db;'>+2% Block Rate</span> and <span style='color:#e74c3c;'>+2% Parry Rate</span>.",
    block: 0.02,
    parry: 0.02,
    dropRate: 0,
    quality: 0,
    goldMulti: 0,
    rareSpawn: 0,
    fairySpawn: 0,
  },
  {
    name: "Chrono Hourglass",
    trait: "extend_buffs",
    desc: "Extends all temporary buffs by 3 seconds. Passive +3 INT.",
    breakdown:
      "<strong>Chronology:</strong><br>• Buff Hold: Extends active Frenzy or Adrenaline by <span style='color:#f1c40f;'>3s</span>.<br>• Passive: Adds <span style='color:#9b59b6;'>+3 INT</span> to extend potion durations and boost defense.",
    int: 3,
    dropRate: 0,
    quality: 0,
    goldMulti: 0,
    rareSpawn: 0,
    fairySpawn: 0,
  },
  {
    name: "Dimensional Pouch",
    trait: "bag_space",
    desc: "Expands equipment sack capacity to 50. Passive +10% Drop Rate.",
    breakdown:
      "<strong>Bottomless Bag:</strong><br>• Space: Expanded bag capacity.<br>• Passive: Adds <span style='color:#2ecc71;'>+10% Drop Rate</span> to help fill your larger satchel.",
    dropRate: 0.1,
    quality: 0,
    goldMulti: 0,
    rareSpawn: 0,
    fairySpawn: 0,
  },
  {
    name: "Phoenix Ankh",
    trait: "second_wind",
    desc: "Ignore a fatal blow once per run (25% Heal). Passive +5 STR & +30 Max HP.",
    breakdown:
      "<strong>Second Wind:</strong><br>• Survive fatal blows with <span style='color:#e74c3c;'>25% HP restored</span>.<br>• Passive: Grants <span style='color:#e74c3c;'>+5 STR</span> (+50 Max HP and +7.5 Atk) and <span style='color:#2ecc71;'>+30 Flat Max HP</span>.",
    str: 5,
    maxHp: 30,
    dropRate: 0,
    quality: 0,
    goldMulti: 0,
    rareSpawn: 0,
    fairySpawn: 0,
  },
  {
    name: "Golem's Core",
    trait: "golem_stance",
    desc: "+20% Attack while healthy (>80% HP). Passive +5 STR.",
    breakdown:
      "<strong>Golem's Stance Breakdown:</strong><br>• High-HP Benefit: Gain a massive <span style='color:#2ecc71;'>+20% Attack Power</span> bonus while sitting above 80% HP.<br>• Passive: Adds <span style='color:#e74c3c;'>+5 STR</span> (+50 Max HP and +7.5 Atk).",
    str: 5,
    dropRate: 0,
    quality: 0,
    goldMulti: 0,
    rareSpawn: 0,
    fairySpawn: 0,
  },
  {
    name: "Fairy Queen's Crown",
    trait: "fairy_wealth",
    desc: "+15% Fairy Spawn. Fairies have 8% chance to drop 1 Luminous Soul. Passive +6% Gold.",
    breakdown:
      "<strong>Crown of Nymphs Breakdown:</strong><br>• Pixie Swarm: Multiplies wild fairy appearance rates by <span style='color:#2ecc71;'>+15%</span>.<br>• Magical Attunement: Fairies have an <span style='color:#ffb6c1;'>8% chance</span> to drop a rare Luminous Soul when caught.<br>• Passive: Adds <span style='color:#f1c40f;'>+6% Gold Multiplier</span>.",
    goldMulti: 0.06,
    dropRate: 0,
    quality: 0,
    rareSpawn: 0,
    fairySpawn: 0.15,
  },
  {
    name: "Void Core",
    trait: "void_pull",
    desc: "+20% Rare Spawn. Defeating Rares heals 15% Max HP. Passive +3 DEX.",
    breakdown:
      "<strong>Void Pull Breakdown:</strong><br>• Hunting Grounds: Enhances rare creature spawn frequencies by <span style='color:#9b59b6;'>+20%</span>.<br>• Singularity Syphon: Slaying any Rare target immediately syphon-heals <span style='color:#e74c3c;'>15% of your Max HP</span>.<br>• Passive: Adds <span style='color:#3498db;'>+3 DEX</span>.",
    dex: 3,
    dropRate: 0,
    quality: 0,
    goldMulti: 0,
    rareSpawn: 0.2,
    fairySpawn: 0,
  },
  {
    name: "Titan's Shield Grip",
    trait: "titan_grip",
    desc: "Increases Block Cap to 25% (with Shield) and Parry Cap to 30% (with Dagger). Passive +4% Block & Parry.",
    breakdown:
      "<strong>Titan's Grip Breakdown:</strong><br>• Raising Caps: Increases your Block ceiling to <span style='color:#3498db;'>25%</span> (with Shield) and Parry ceiling to <span style='color:#e74c3c;'>30%</span> (with Dagger).<br>• Passive: Adds <span style='color:#3498db;'>+4% base Block Rate</span> and <span style='color:#e74c3c;'>+4% base Parry Rate</span>.",
    block: 0.04,
    parry: 0.04,
    dropRate: 0,
    quality: 0,
    goldMulti: 0,
    rareSpawn: 0,
    fairySpawn: 0,
  },
  {
    name: "Alchemist's Alembic",
    trait: "alchemist_alembic",
    desc: "All consumed elixirs are 15% more potent. Passive +3 INT.",
    breakdown:
      "<strong>Alchemist's Alembic Breakdown:</strong><br>• Potion Potency: Amplifies the base multipliers of all consumed potions by <span style='color:#2ecc71;'>+15%</span>.<br>• Passive: Adds <span style='color:#9b59b6;'>+3 INT</span>.",
    int: 3,
    dropRate: 0,
    quality: 0,
    goldMulti: 0,
    rareSpawn: 0,
    fairySpawn: 0,
  },
  {
    name: "Philosopher's Catalyst",
    trait: "philosopher_catalyst",
    desc: "Consuming an elixir has a 12% chance to not consume the item. Passive +4 INT.",
    breakdown:
      "<strong>Philosopher's Catalyst Breakdown:</strong><br>• Sparing Effect: Sparing consumption check with <span style='color:#2ecc71;'>12% free use probability</span>.<br>• Passive: Adds <span style='color:#9b59b6;'>+4 INT</span>.",
    int: 4,
    dropRate: 0,
    quality: 0,
    goldMulti: 0,
    rareSpawn: 0,
    fairySpawn: 0,
  },
  {
    name: "Cauldron of Eternity",
    trait: "cauldron_eternity",
    desc: "While any potion buff is active, reduces Idle Attack delay by 2 frames. Passive +5% Max HP.",
    breakdown:
      "<strong>Cauldron of Eternity Breakdown:</strong><br>• Haste Trigger: Attacks automatically <span style='color:#3498db;'>2 frames faster</span> while any potion effect is running.<br>• Passive: Adds a <span style='color:#e74c3c;'>+5% Max HP</span> multiplier.",
    maxHpPct: 0.05,
    dropRate: 0,
    quality: 0,
    goldMulti: 0,
    rareSpawn: 0,
    fairySpawn: 0,
  },
];

window.SET_DEFINITIONS = {
  Vanguard: {
    bonuses: [
      {
        count: 2,
        desc: "+5% Attack Power",
        apply: (p) => {
          p.atkPctBonus = (p.atkPctBonus || 0) + 0.05;
        },
      },
      {
        count: 3,
        desc: "+10% Attack Power, +15 Flat Attack",
        apply: (p) => {
          p.atkPctBonus = (p.atkPctBonus || 0) + 0.1;
          p.atk += 15;
        },
      },
    ],
  },
  Colossus: {
    name: "Colossus",
    bonuses: [
      {
        count: 2,
        desc: "+8% Max HP",
        apply: (p) => {
          p.maxHpPctBonus = (p.maxHpPctBonus || 0) + 0.08;
        },
      },
      {
        count: 3,
        desc: "+15% Max HP, +50 Flat Max HP",
        apply: (p) => {
          p.maxHpPctBonus = (p.maxHpPctBonus || 0) + 0.15;
          p.maxHp += 50;
        },
      },
    ],
  },
  Bastion: {
    name: "Bastion",
    bonuses: [
      {
        count: 2,
        desc: "+5% Defense",
        apply: (p) => {
          p.defPctBonus = (p.defPctBonus || 0) + 0.05;
        },
      },
      {
        count: 3,
        desc: "+12% Defense, +10 Flat Defense",
        apply: (p) => {
          p.defPctBonus = (p.defPctBonus || 0) + 0.12;
          p.flatDefBonus = (p.flatDefBonus || 0) + 10;
        },
      },
    ],
  },
  Windrunner: {
    name: "Windrunner",
    bonuses: [
      {
        count: 2,
        desc: "+5 Move Speed",
        apply: (p) => {
          p.moveSpeed += 5;
        },
      },
      {
        count: 3,
        desc: "+15 Move Speed, +15% Idle Attack Speed",
        apply: (p) => {
          p.moveSpeed += 15;
          p.idleSpeedPct = (p.idleSpeedPct || 0) + 0.15;
        },
      },
    ],
  },
  Wraith: {
    name: "Wraith",
    bonuses: [
      {
        count: 2,
        desc: "+3% Crit Chance",
        apply: (p) => {
          p.critChance += 0.03;
        },
      },
      {
        count: 3,
        desc: "+8% Crit Chance, +15% Crit Multiplier",
        apply: (p) => {
          p.critChance += 0.08;
          p.critDamage += 0.15;
        },
      },
    ],
  },
  Reaver: {
    name: "Reaver",
    bonuses: [
      {
        count: 2,
        desc: "+15% Crit Multiplier",
        apply: (p) => {
          p.critDamage += 0.15;
        },
      },
      {
        count: 3,
        desc: "+35% Crit Multiplier, +2% Crit Chance",
        apply: (p) => {
          p.critDamage += 0.35;
          p.critChance += 0.02;
        },
      },
    ],
  },
  Dreadnought: {
    name: "Dreadnought",
    bonuses: [
      {
        count: 2,
        desc: "+3% Block Rate",
        apply: (p) => {
          p.block += 0.03;
        },
      },
      {
        count: 3,
        desc: "+8% Block Rate, +5 Flat Defense",
        apply: (p) => {
          p.block += 0.08;
          p.flatDefBonus = (p.flatDefBonus || 0) + 5;
        },
      },
    ],
  },
  Duellist: {
    name: "Duellist",
    bonuses: [
      {
        count: 2,
        desc: "+2% Parry Rate",
        apply: (p) => {
          p.parry += 0.02;
        },
      },
      {
        count: 3,
        desc: "+6% Parry Rate, +10% Active Attack Speed",
        apply: (p) => {
          p.parry += 0.06;
          p.activeSpeedPct = (p.activeSpeedPct || 0) + 0.1;
        },
      },
    ],
  },
  Scholar: {
    name: "Scholar",
    bonuses: [
      {
        count: 2,
        desc: "+5 INT",
        apply: (p) => {
          p.int += 5;
        },
      },
      {
        count: 3,
        desc: "+15 INT, +10% Active Attack Speed",
        apply: (p) => {
          p.int += 15;
          p.activeSpeedPct = (p.activeSpeedPct || 0) + 0.1;
        },
      },
    ],
  },
  Berserker: {
    name: "Berserker",
    bonuses: [
      {
        count: 2,
        desc: "+5 STR",
        apply: (p) => {
          p.str += 5;
        },
      },
      {
        count: 3,
        desc: "+15 STR, +10% Idle Attack Speed",
        apply: (p) => {
          p.str += 15;
          p.idleSpeedPct = (p.idleSpeedPct || 0) + 0.1;
        },
      },
    ],
  },
  Scout: {
    name: "Scout",
    bonuses: [
      {
        count: 2,
        desc: "+5 DEX",
        apply: (p) => {
          p.dex += 5;
        },
      },
      {
        count: 3,
        desc: "+15 DEX, +8 Move Speed",
        apply: (p) => {
          p.dex += 15;
          p.moveSpeed += 8;
        },
      },
    ],
  },
  Fortune: {
    name: "Fortune",
    bonuses: [
      {
        count: 2,
        desc: "+15% Gold Multiplier",
        apply: (p) => {
          p.gold += 0.15;
        },
      },
      {
        count: 3,
        desc: "+30% Gold Multiplier, +10% Drop Rate Mod",
        apply: (p) => {
          p.gold += 0.3;
          p.drop += 0.1;
        },
      },
    ],
  },
  Mystic: {
    name: "Mystic",
    bonuses: [
      {
        count: 2,
        desc: "+5% Drop Quality Mod",
        apply: (p) => {
          p.qly += 0.05;
        },
      },
      {
        count: 3,
        desc: "+15% Drop Quality Mod, +5 INT",
        apply: (p) => {
          p.qly += 0.15;
          p.int += 5;
        },
      },
    ],
  },
  Alchemist: {
    name: "Alchemist",
    bonuses: [
      {
        count: 2,
        desc: "+10% Max HP",
        apply: (p) => {
          p.maxHpPctBonus = (p.maxHpPctBonus || 0) + 0.1;
        },
      },
      {
        count: 3,
        desc: "+10% Attack Power, +10% Potion Duration",
        apply: (p) => {
          p.atkPctBonus = (p.atkPctBonus || 0) + 0.1;
        },
      },
    ],
  },
  Midas: {
    name: "Midas' Legacy",
    bonuses: [
      {
        count: 2,
        desc: "+20% Gold Multiplier",
        apply: (p) => {
          p.gold += 0.2;
        },
      },
      {
        count: 3,
        desc: "+40% Gold Multiplier. (Midas Touch: +1% Attack per 10% Gold Mult)",
        apply: (p) => {
          p.gold += 0.4;
          let goldBonusPct = Math.floor(p.gold * 10) * 0.01;
          p.atkPctBonus = (p.atkPctBonus || 0) + goldBonusPct;
        },
      },
    ],
  },
  Biohazard: {
    name: "Biohazard",
    bonuses: [
      {
        count: 2,
        desc: "+10% Max HP",
        apply: (p) => {
          p.maxHpPctBonus = (p.maxHpPctBonus || 0) + 0.1;
        },
      },
      {
        count: 3,
        desc: "Corrosive Spores: 20% chance to poison targets for DoT & Life-stealing",
        apply: (p) => {
          p.hasCorrosiveSet = true;
        },
      },
    ],
  },
  Warlord: {
    name: "Warlord",
    bonuses: [
      {
        count: 2,
        desc: "+12% Crit Damage",
        apply: (p) => {
          p.critDamage += 0.12;
        },
      },
      {
        count: 3,
        desc: "Shattering Blows: Crits have 25% chance to trigger unblockable secondary hits",
        apply: (p) => {
          p.hasShatterSet = true;
        },
      },
    ],
  },
  VoidTouched: {
    name: "Void-Touched",
    bonuses: [
      {
        count: 2,
        desc: "+1.5% Rare Spawn Rate",
        apply: (p) => {
          p.rareSpawn += 0.015;
        },
      },
      {
        count: 3,
        desc: "Singularity: Spawning a Rare instantly triggers a 5s Frenzy Mode",
        apply: (p) => {
          p.hasSingularitySet = true;
        },
      },
    ],
  },
};

window.AchievementsData = [
  // 1. SLAYERS (Kills) - Bridged Geometric Curve (Flat Atk + % Atk)
  {
    id: "slayer_1",
    name: "Novice Slayer",
    icon: "⚔️",
    desc: "Slay 100 total enemies",
    reqType: "kills",
    reqValue: 100,
    stats: { atk: 1, atkPct: 0.01 },
  },
  {
    id: "slayer_2",
    name: "Adept Slayer",
    icon: "💀",
    desc: "Slay 1,000 total enemies",
    reqType: "kills",
    reqValue: 1000,
    stats: { atk: 2, atkPct: 0.02 },
  },
  {
    id: "slayer_3",
    name: "Elite Slayer",
    icon: "🔥",
    desc: "Slay 10,000 total enemies",
    reqType: "kills",
    reqValue: 10000,
    stats: { atk: 4, atkPct: 0.03 },
  },
  {
    id: "slayer_4",
    name: "Deathbringer",
    icon: "😈",
    desc: "Slay 100,000 total enemies",
    reqType: "kills",
    reqValue: 100000,
    stats: { atk: 8, atkPct: 0.04 },
  },
  {
    id: "slayer_5",
    name: "God of War",
    icon: "🥊",
    desc: "Slay 1,000,000 total enemies",
    reqType: "kills",
    reqValue: 1000000,
    stats: { atk: 16, atkPct: 0.05 },
  },
  {
    id: "slayer_6",
    name: "Void Reaper",
    icon: "🌌",
    desc: "Slay 10,000,000 total enemies",
    reqType: "kills",
    reqValue: 10000000,
    stats: { atk: 32, atkPct: 0.06 },
  },
  {
    id: "slayer_7",
    name: "Harbinger of Ruin",
    icon: "☄️",
    desc: "Slay 25,000,000 total enemies",
    reqType: "kills",
    reqValue: 25000000,
    stats: { atk: 64, atkPct: 0.08 },
  },
  {
    id: "slayer_8",
    name: "Star Crusher",
    icon: "🌟",
    desc: "Slay 50,000,000 total enemies",
    reqType: "kills",
    reqValue: 50000000,
    stats: { atk: 128, atkPct: 0.1 },
  },
  {
    id: "slayer_9",
    name: "Galaxy Devourer",
    icon: "🌀",
    desc: "Slay 100,000,000 total enemies",
    reqType: "kills",
    reqValue: 100000000,
    stats: { atk: 256, atkPct: 0.12 },
  },
  {
    id: "slayer_10",
    name: "Universal Eraser",
    icon: "♾️",
    desc: "Slay 250,000,000 total enemies",
    reqType: "kills",
    reqValue: 250000000,
    stats: { atk: 512, atkPct: 0.15 },
  },

  // 2. TREASURE HUNTERS (Gold) - Bridged Geometric Curve (Flat HP + % Gold)
  {
    id: "hoarder_1",
    name: "Penny Pincher",
    icon: "💰",
    desc: "Collect 5,000 total gold",
    reqType: "gold",
    reqValue: 5000,
    stats: { gold: 0.01, maxHp: 5 },
  },
  {
    id: "hoarder_2",
    name: "Merchant's Trust",
    icon: "💰",
    desc: "Collect 50,000 total gold",
    reqType: "gold",
    reqValue: 50000,
    stats: { gold: 0.02, maxHp: 10 },
  },
  {
    id: "hoarder_3",
    name: "Capitalist",
    icon: "💼",
    desc: "Collect 500,000 total gold",
    reqType: "gold",
    reqValue: 500000,
    stats: { gold: 0.03, maxHp: 20 },
  },
  {
    id: "hoarder_4",
    name: "Guild Patron",
    icon: "🏛️",
    desc: "Collect 5,000,000 total gold",
    reqType: "gold",
    reqValue: 5000000,
    stats: { gold: 0.04, maxHp: 40 },
  },
  {
    id: "hoarder_5",
    name: "Vault Guardian",
    icon: "🏰",
    desc: "Collect 50,000,000 total gold",
    reqType: "gold",
    reqValue: 50000000,
    stats: { gold: 0.05, maxHp: 80 },
  },
  {
    id: "hoarder_6",
    name: "Golden Deity",
    icon: "👑",
    desc: "Collect 500,000,000 total gold",
    reqType: "gold",
    reqValue: 500000000,
    stats: { gold: 0.06, maxHp: 160 },
  },
  {
    id: "hoarder_7",
    name: "Treasury Overlord",
    icon: "🏺",
    desc: "Collect 1,000,000,000 total gold",
    reqType: "gold",
    reqValue: 1000000000,
    stats: { gold: 0.08, maxHp: 320 },
  },
  {
    id: "hoarder_8",
    name: "Midas' Equal",
    icon: "🌟",
    desc: "Collect 5,000,000,000 total gold",
    reqType: "gold",
    reqValue: 5000000000,
    stats: { gold: 0.1, maxHp: 640 },
  },
  {
    id: "hoarder_9",
    name: "Plutus' Architect",
    icon: "🏛️",
    desc: "Collect 25,000,000,000 total gold",
    reqType: "gold",
    reqValue: 25000000000,
    stats: { gold: 0.12, maxHp: 1280 },
  },
  {
    id: "hoarder_10",
    name: "Infinite Hoarder",
    icon: "♾️",
    desc: "Collect 100,000,000,000 total gold",
    reqType: "gold",
    reqValue: 100000000000,
    stats: { gold: 0.15, maxHp: 2560 },
  },

  // 3. PIONEERS (Stages) - Bridged Geometric Curve (Flat Def + % Def)
  {
    id: "stage_1",
    name: "Greenhorn Explorer",
    icon: "🗺️",
    desc: "Reach Stage 10",
    reqType: "stage",
    reqValue: 10,
    stats: { def: 1, defPct: 0.01 },
  },
  {
    id: "stage_2",
    name: "Seasoned Ranger",
    icon: "🧭",
    desc: "Reach Stage 50",
    reqType: "stage",
    reqValue: 50,
    stats: { def: 2, defPct: 0.02 },
  },
  {
    id: "stage_3",
    name: "Abyss Crawler",
    icon: "🌋",
    desc: "Reach Stage 100",
    reqType: "stage",
    reqValue: 100,
    stats: { def: 4, defPct: 0.03 },
  },
  {
    id: "stage_4",
    name: "Slayer of Giants",
    icon: "🛡️",
    desc: "Reach Stage 200",
    reqType: "stage",
    reqValue: 200,
    stats: { def: 8, defPct: 0.04 },
  },
  {
    id: "stage_5",
    name: "The Unstoppable",
    icon: "🔱",
    desc: "Reach Stage 350",
    reqType: "stage",
    reqValue: 350,
    stats: { def: 16, defPct: 0.05 },
  },
  {
    id: "stage_6",
    name: "Voidwalker",
    icon: "🌌",
    desc: "Reach Stage 500",
    reqType: "stage",
    reqValue: 500,
    stats: { def: 32, defPct: 0.06 },
  },
  {
    id: "stage_7",
    name: "Dimensional Pioneer",
    icon: "🌀",
    desc: "Reach Stage 650",
    reqType: "stage",
    reqValue: 650,
    stats: { def: 64, defPct: 0.08 },
  },
  {
    id: "stage_8",
    name: "Aether Lord",
    icon: "🪐",
    desc: "Reach Stage 800",
    reqType: "stage",
    reqValue: 800,
    stats: { def: 128, defPct: 0.1 },
  },
  {
    id: "stage_9",
    name: "Galaxy Warden",
    icon: "🌟",
    desc: "Reach Stage 900",
    reqType: "stage",
    reqValue: 900,
    stats: { def: 256, defPct: 0.12 },
  },
  {
    id: "stage_10",
    name: "Master of the Cosmos",
    icon: "♾️",
    desc: "Reach Stage 1,000",
    reqType: "stage",
    reqValue: 1000,
    stats: { def: 512, defPct: 0.15 },
  },

  // 4. VENERABLE SAGES (Level) - Percentage only (Smooth Bridge)
  {
    id: "level_1",
    name: "Novice Adventurer",
    icon: "🔰",
    desc: "Reach Level 10",
    reqType: "level",
    reqValue: 10,
    stats: { atkPct: 0.02, maxHpPct: 0.02 },
  },
  {
    id: "level_2",
    name: "Elite Hero",
    icon: "🛡️",
    desc: "Reach Level 30",
    reqType: "level",
    reqValue: 30,
    stats: { atkPct: 0.03, maxHpPct: 0.03 },
  },
  {
    id: "level_3",
    name: "Champion Sage",
    icon: "🎖️",
    desc: "Reach Level 75",
    reqType: "level",
    reqValue: 75,
    stats: { atkPct: 0.04, maxHpPct: 0.04 },
  },
  {
    id: "level_4",
    name: "Transcendent",
    icon: "🌟",
    desc: "Reach Level 150",
    reqType: "level",
    reqValue: 150,
    stats: { atkPct: 0.05, maxHpPct: 0.05 },
  },
  {
    id: "level_5",
    name: "Immortal Legend",
    icon: "👑",
    desc: "Reach Level 250",
    reqType: "level",
    reqValue: 250,
    stats: { atkPct: 0.06, maxHpPct: 0.06 },
  },
  {
    id: "level_6",
    name: "Level Tactician",
    icon: "⚡",
    desc: "Reach Level 350",
    reqType: "level",
    reqValue: 350,
    stats: { atkPct: 0.08, maxHpPct: 0.08 },
  },
  {
    id: "level_7",
    name: "Mortal Ascendant",
    icon: "💫",
    desc: "Reach Level 500",
    reqType: "level",
    reqValue: 500,
    stats: { atkPct: 0.1, maxHpPct: 0.1 },
  },
  {
    id: "level_8",
    name: "Cosmic Paragon",
    icon: "🪐",
    desc: "Reach Level 650",
    reqType: "level",
    reqValue: 650,
    stats: { atkPct: 0.12, maxHpPct: 0.12 },
  },
  {
    id: "level_9",
    name: "Eldritch Scholar",
    icon: "🌌",
    desc: "Reach Level 800",
    reqType: "level",
    reqValue: 800,
    stats: { atkPct: 0.15, maxHpPct: 0.15 },
  },
  {
    id: "level_10",
    name: "Apex Deity",
    icon: "♾️",
    desc: "Reach Level 1,000",
    reqType: "level",
    reqValue: 1000,
    stats: { atkPct: 0.2, maxHpPct: 0.2 },
  },

  // 5. MASTERWORK (Tempers) - Smooth Bridge
  {
    id: "forge_1",
    name: "Bronze Anvil",
    icon: "🔨",
    desc: "Temper items 1 time",
    reqType: "temper",
    reqValue: 1,
    stats: { str: 1, strPct: 0.01 },
  },
  {
    id: "forge_2",
    name: "Iron Hammer",
    icon: "⚒️",
    desc: "Temper items 10 times",
    reqType: "temper",
    reqValue: 10,
    stats: { str: 2, strPct: 0.02 },
  },
  {
    id: "forge_3",
    name: "Steel Melter",
    icon: "🔥",
    desc: "Temper items 50 times",
    reqType: "temper",
    reqValue: 50,
    stats: { str: 4, strPct: 0.03 },
  },
  {
    id: "forge_4",
    name: "Master Blacksmith",
    icon: "🔱",
    desc: "Temper items 250 times",
    reqType: "temper",
    reqValue: 250,
    stats: { str: 8, strPct: 0.04 },
  },
  {
    id: "forge_5",
    name: "God of the Forge",
    icon: "🌋",
    desc: "Temper items 500 times",
    reqType: "temper",
    reqValue: 500,
    stats: { str: 16, strPct: 0.05 },
  },
  {
    id: "forge_6",
    name: "Celestial Smelter",
    icon: "☄️",
    desc: "Temper items 1,000 times",
    reqType: "temper",
    reqValue: 1000,
    stats: { str: 32, strPct: 0.06 },
  },
  {
    id: "forge_7",
    name: "Starmetal Shaper",
    icon: "🪐",
    desc: "Temper items 2,500 times",
    reqType: "temper",
    reqValue: 2500,
    stats: { str: 64, strPct: 0.08 },
  },
  {
    id: "forge_8",
    name: "Eternity Architect",
    icon: "♾️",
    desc: "Temper items 5,000 times",
    reqType: "temper",
    reqValue: 5000,
    stats: { str: 128, strPct: 0.12 },
  },

  // 6. RUNIC SCRIBES (Enchants) - Smooth Bridge
  {
    id: "enchant_1",
    name: "Magic Infusion",
    icon: "🔮",
    desc: "Enchant 1 time",
    reqType: "enchant",
    reqValue: 1,
    stats: { int: 1, intPct: 0.01 },
  },
  {
    id: "enchant_2",
    name: "Mystic Scholar",
    icon: "📜",
    desc: "Enchant items 5 times",
    reqType: "enchant",
    reqValue: 5,
    stats: { int: 2, intPct: 0.02 },
  },
  {
    id: "enchant_3",
    name: "Eldritch Weaver",
    icon: "🕸️",
    desc: "Enchant items 20 times",
    reqType: "enchant",
    reqValue: 20,
    stats: { int: 4, intPct: 0.03 },
  },
  {
    id: "enchant_4",
    name: "Runic Architect",
    icon: "🧙",
    desc: "Enchant items 100 times",
    reqType: "enchant",
    reqValue: 100,
    stats: { int: 8, intPct: 0.04 },
  },
  {
    id: "enchant_5",
    name: "Enchantment Sage",
    icon: "🏗️",
    desc: "Enchant items 250 times",
    reqType: "enchant",
    reqValue: 250,
    stats: { int: 16, intPct: 0.05 },
  },
  {
    id: "enchant_6",
    name: "Aether Scribe",
    icon: "🌌",
    desc: "Enchant items 500 times",
    reqType: "enchant",
    reqValue: 500,
    stats: { int: 32, intPct: 0.06 },
  },
  {
    id: "enchant_7",
    name: "Chronos Sigil Weaver",
    icon: "⏳",
    desc: "Enchant items 1,000 times",
    reqType: "enchant",
    reqValue: 1000,
    stats: { int: 64, intPct: 0.08 },
  },
  {
    id: "enchant_8",
    name: "Arcane Singularity",
    icon: "⚡",
    desc: "Enchant items 2,000 times",
    reqType: "enchant",
    reqValue: 2000,
    stats: { int: 128, intPct: 0.12 },
  },

  // 7. VOID CLEANSERS (Rifts) - Smooth Bridge
  {
    id: "rift_1",
    name: "Reality Breaker",
    icon: "🌌",
    desc: "Slay 1 Rift Guardian",
    reqType: "rift",
    reqValue: 1,
    stats: { dex: 1, dexPct: 0.01 },
  },
  {
    id: "rift_2",
    name: "Rift Conqueror",
    icon: "🌀",
    desc: "Slay 5 Rift Guardians",
    reqType: "rift",
    reqValue: 5,
    stats: { dex: 2, dexPct: 0.02 },
  },
  {
    id: "rift_3",
    name: "Guardian's Bane",
    icon: "⚔️",
    desc: "Slay 25 Rift Guardians",
    reqType: "rift",
    reqValue: 25,
    stats: { dex: 4, dexPct: 0.03 },
  },
  {
    id: "rift_4",
    name: "Cosmic Arbiter",
    icon: "🛸",
    desc: "Slay 100 Rift Guardians",
    reqType: "rift",
    reqValue: 100,
    stats: { dex: 8, dexPct: 0.04 },
  },
  {
    id: "rift_5",
    name: "Aether Sovereign",
    icon: "🪐",
    desc: "Slay 250 Rift Guardians",
    reqType: "rift",
    reqValue: 250,
    stats: { dex: 16, dexPct: 0.05 },
  },
  {
    id: "rift_6",
    name: "Galaxy Purger",
    icon: "☄️",
    desc: "Slay 500 Rift Guardians",
    reqType: "rift",
    reqValue: 500,
    stats: { dex: 32, dexPct: 0.06 },
  },
  {
    id: "rift_7",
    name: "Singularity Watcher",
    icon: "🌌",
    desc: "Slay 1,000 Rift Guardians",
    reqType: "rift",
    reqValue: 1000,
    stats: { dex: 64, dexPct: 0.08 },
  },
  {
    id: "rift_8",
    name: "Shatterer of Realities",
    icon: "💫",
    desc: "Slay 2,500 Rift Guardians",
    reqType: "rift",
    reqValue: 2500,
    stats: { dex: 128, dexPct: 0.12 },
  },

  // 8. REBORN LEGENDS (Prestige) - Smooth Bridge
  {
    id: "prestige_1",
    name: "Mortal Ascension",
    icon: "🐉",
    desc: "Ascend 1 time at the Altar",
    reqType: "prestige",
    reqValue: 1,
    stats: { expPct: 0.01, gold: 0.01 },
  },
  {
    id: "prestige_2",
    name: "Chrono Rebirth",
    icon: "⌛",
    desc: "Ascend 5 times at the Altar",
    reqType: "prestige",
    reqValue: 5,
    stats: { expPct: 0.02, gold: 0.02 },
  },
  {
    id: "prestige_3",
    name: "Eternal Cycle",
    icon: "🌀",
    desc: "Ascend 10 times at the Altar",
    reqType: "prestige",
    reqValue: 10,
    stats: { expPct: 0.03, gold: 0.03 },
  },
  {
    id: "prestige_4",
    name: "Dimensional Shifter",
    icon: "🌌",
    desc: "Ascend 25 times at the Altar",
    reqType: "prestige",
    reqValue: 25,
    stats: { expPct: 0.04, gold: 0.04 },
  },
  {
    id: "prestige_5",
    name: "Aetheric Soul",
    icon: "☄️",
    desc: "Ascend 50 times at the Altar",
    reqType: "prestige",
    reqValue: 50,
    stats: { expPct: 0.05, gold: 0.05 },
  },
  {
    id: "prestige_6",
    name: "Shattered Reality",
    icon: "💫",
    desc: "Ascend 100 times at the Altar",
    reqType: "prestige",
    reqValue: 100,
    stats: { expPct: 0.06, gold: 0.06 },
  },
  {
    id: "prestige_7",
    name: "Timeless Deity",
    icon: "⏳",
    desc: "Ascend 175 times at the Altar",
    reqType: "prestige",
    reqValue: 175,
    stats: { expPct: 0.07, gold: 0.07 },
  },
  {
    id: "prestige_8",
    name: "Quantum Reborn",
    icon: "🌟",
    desc: "Ascend 250 times at the Altar",
    reqType: "prestige",
    reqValue: 250,
    stats: { expPct: 0.08, gold: 0.08 },
  },
  {
    id: "prestige_9",
    name: "Cosmic Reincarnated",
    icon: "🪐",
    desc: "Ascend 375 times at the Altar",
    reqType: "prestige",
    reqValue: 375,
    stats: { expPct: 0.1, gold: 0.1 },
  },
  {
    id: "prestige_10",
    name: "Omnipresent Overlord",
    icon: "♾️",
    desc: "Ascend 500 times at the Altar",
    reqType: "prestige",
    reqValue: 500,
    stats: { expPct: 0.15, gold: 0.15 },
  },

  // 9. ARSENAL KINGS (Equip Dungeon) - Smooth Bridge
  {
    id: "d_eq_1",
    name: "Steel Miner",
    icon: "⛏️",
    desc: "Reach Floor 10 in Equip Dungeon",
    reqType: "dungeon_equip",
    reqValue: 10,
    stats: { atk: 2, atkPct: 0.01 },
  },
  {
    id: "d_eq_2",
    name: "Armory Sentry",
    icon: "🗡️",
    desc: "Reach Floor 30 in Equip Dungeon",
    reqType: "dungeon_equip",
    reqValue: 30,
    stats: { atk: 4, atkPct: 0.02 },
  },
  {
    id: "d_eq_3",
    name: "Knight Defender",
    icon: "🛡️",
    desc: "Reach Floor 50 in Equip Dungeon",
    reqType: "dungeon_equip",
    reqValue: 50,
    stats: { atk: 8, atkPct: 0.03 },
  },
  {
    id: "d_eq_4",
    name: "Armory Tyrant",
    icon: "⚔️",
    desc: "Reach Floor 100 in Equip Dungeon",
    reqType: "dungeon_equip",
    reqValue: 100,
    stats: { atk: 16, atkPct: 0.04 },
  },
  {
    id: "d_eq_5",
    name: "Obsidian Guard",
    icon: "🌋",
    desc: "Reach Floor 150 in Equip Dungeon",
    reqType: "dungeon_equip",
    reqValue: 150,
    stats: { atk: 32, atkPct: 0.05 },
  },
  {
    id: "d_eq_6",
    name: "Paladin General",
    icon: "🎖️",
    desc: "Reach Floor 250 in Equip Dungeon",
    reqType: "dungeon_equip",
    reqValue: 250,
    stats: { atk: 64, atkPct: 0.06 },
  },
  {
    id: "d_eq_7",
    name: "Bastion Commander",
    icon: "🏰",
    desc: "Reach Floor 400 in Equip Dungeon",
    reqType: "dungeon_equip",
    reqValue: 400,
    stats: { atk: 128, atkPct: 0.08 },
  },
  {
    id: "d_eq_8",
    name: "Armory God",
    icon: "👑",
    desc: "Reach Floor 600 in Equip Dungeon",
    reqType: "dungeon_equip",
    reqValue: 600,
    stats: { atk: 256, atkPct: 0.1 },
  },
  {
    id: "d_eq_9",
    name: "Astral Sentry",
    icon: "🪐",
    desc: "Reach Floor 800 in Equip Dungeon",
    reqType: "dungeon_equip",
    reqValue: 800,
    stats: { atk: 512, atkPct: 0.12 },
  },
  {
    id: "d_eq_10",
    name: "Arsenal Prime",
    icon: "♾️",
    desc: "Reach Floor 1,000 in Equip Dungeon",
    reqType: "dungeon_equip",
    reqValue: 1000,
    stats: { atk: 1024, atkPct: 0.15 },
  },

  // 10. MIDAS' HAND (Gold Dungeon) - Smooth Bridge
  {
    id: "d_go_1",
    name: "Sooty Pockets",
    icon: "💰",
    desc: "Reach Floor 10 in Gold Mine",
    reqType: "dungeon_gold",
    reqValue: 10,
    stats: { gold: 0.01, goldMulti: 0.01 },
  },
  {
    id: "d_go_2",
    name: "Lode Prospector",
    icon: "⛏️",
    desc: "Reach Floor 30 in Gold Mine",
    reqType: "dungeon_gold",
    reqValue: 30,
    stats: { gold: 0.02, goldMulti: 0.02 },
  },
  {
    id: "d_go_3",
    name: "Ore Overlord",
    icon: "💰",
    desc: "Reach Floor 50 in Gold Mine",
    reqType: "dungeon_gold",
    reqValue: 50,
    stats: { gold: 0.03, goldMulti: 0.03 },
  },
  {
    id: "d_go_4",
    name: "Midas' Disciple",
    icon: "👑",
    desc: "Reach Floor 100 in Gold Mine",
    reqType: "dungeon_gold",
    reqValue: 100,
    stats: { gold: 0.04, goldMulti: 0.04 },
  },
  {
    id: "d_go_5",
    name: "Vast Coffers",
    icon: "🏦",
    desc: "Reach Floor 150 in Gold Mine",
    reqType: "dungeon_gold",
    reqValue: 150,
    stats: { gold: 0.05, goldMulti: 0.05 },
  },
  {
    id: "d_go_6",
    name: "Plutus' Architect",
    icon: "🏛️",
    desc: "Reach Floor 250 in Gold Mine",
    reqType: "dungeon_gold",
    reqValue: 250,
    stats: { gold: 0.06, goldMulti: 0.06 },
  },
  {
    id: "d_go_7",
    name: "Aurum Monarch",
    icon: "🏺",
    desc: "Reach Floor 400 in Gold Mine",
    reqType: "dungeon_gold",
    reqValue: 400,
    stats: { gold: 0.08, goldMulti: 0.08 },
  },
  {
    id: "d_go_8",
    name: "Sovereign Treasury",
    icon: "🏰",
    desc: "Reach Floor 600 in Gold Mine",
    reqType: "dungeon_gold",
    reqValue: 600,
    stats: { gold: 0.1, goldMulti: 0.1 },
  },
  {
    id: "d_go_9",
    name: "Galactic Cartel",
    icon: "🪐",
    desc: "Reach Floor 800 in Gold Mine",
    reqType: "dungeon_gold",
    reqValue: 800,
    stats: { gold: 0.12, goldMulti: 0.12 },
  },
  {
    id: "d_go_10",
    name: "Vault of Eternity",
    icon: "♾️",
    desc: "Reach Floor 1,000 in Gold Mine",
    reqType: "dungeon_gold",
    reqValue: 1000,
    stats: { gold: 0.15, goldMulti: 0.15 },
  },

  // 11. TOXIC PURIFIERS (Material Dungeon) - Smooth Bridge
  {
    id: "d_ma_1",
    name: "Toxic Scavenger",
    icon: "🧪",
    desc: "Reach Floor 10 in Material Pit",
    reqType: "dungeon_mat",
    reqValue: 10,
    stats: { maxHp: 15, maxHpPct: 0.01 },
  },
  {
    id: "d_ma_2",
    name: "Sludge Dredger",
    icon: "🦠",
    desc: "Reach Floor 30 in Material Pit",
    reqType: "dungeon_mat",
    reqValue: 30,
    stats: { maxHp: 30, maxHpPct: 0.02 },
  },
  {
    id: "d_ma_3",
    name: "Plague Alchemist",
    icon: "☣️",
    desc: "Reach Floor 50 in Material Pit",
    reqType: "dungeon_mat",
    reqValue: 50,
    stats: { maxHp: 60, maxHpPct: 0.03 },
  },
  {
    id: "d_ma_4",
    name: "Contagion Master",
    icon: "🧫",
    desc: "Reach Floor 100 in Material Pit",
    reqType: "dungeon_mat",
    reqValue: 100,
    stats: { maxHp: 120, maxHpPct: 0.04 },
  },
  {
    id: "d_ma_5",
    name: "Bio-Hazard Specialist",
    icon: "☢️",
    desc: "Reach Floor 150 in Material Pit",
    reqType: "dungeon_mat",
    reqValue: 150,
    stats: { maxHp: 240, maxHpPct: 0.05 },
  },
  {
    id: "d_ma_6",
    name: "Vector Prime",
    icon: "🧬",
    desc: "Reach Floor 250 in Material Pit",
    reqType: "dungeon_mat",
    reqValue: 250,
    stats: { maxHp: 480, maxHpPct: 0.06 },
  },
  {
    id: "d_ma_7",
    name: "Quarantine Warden",
    icon: "🏥",
    desc: "Reach Floor 400 in Material Pit",
    reqType: "dungeon_mat",
    reqValue: 400,
    stats: { maxHp: 960, maxHpPct: 0.08 },
  },
  {
    id: "d_ma_8",
    name: "Biosphere Custodian",
    icon: "🪐",
    desc: "Reach Floor 600 in Material Pit",
    reqType: "dungeon_mat",
    reqValue: 600,
    stats: { maxHp: 1920, maxHpPct: 0.1 },
  },
  {
    id: "d_ma_9",
    name: "Aether Alchemist",
    icon: "🌌",
    desc: "Reach Floor 800 in Material Pit",
    reqType: "dungeon_mat",
    reqValue: 800,
    stats: { maxHp: 3840, maxHpPct: 0.12 },
  },
  {
    id: "d_ma_10",
    name: "Great Purifier",
    icon: "♾️",
    desc: "Reach Floor 1,000 in Material Pit",
    reqType: "dungeon_mat",
    reqValue: 1000,
    stats: { maxHp: 8000, maxHpPct: 0.15 },
  },

  // 12. CRUCIBLE GLADIATORS (Crucible Waves) - Smooth Bridge
  {
    id: "d_cr_1",
    name: "Spark of Survival",
    icon: "🔥",
    desc: "Survive to Wave 15 in Crucible",
    reqType: "crucible",
    reqValue: 15,
    stats: { block: 0.005, parry: 0.005 },
  },
  {
    id: "d_cr_2",
    name: "Gladiator Recruit",
    icon: "🛡️",
    desc: "Survive to Wave 30 in Crucible",
    reqType: "crucible",
    reqValue: 30,
    stats: { block: 0.01, parry: 0.01 },
  },
  {
    id: "d_cr_3",
    name: "Crucible Crusader",
    icon: "💥",
    desc: "Survive to Wave 50 in Crucible",
    reqType: "crucible",
    reqValue: 50,
    stats: { block: 0.015, parry: 0.015 },
  },
  {
    id: "d_cr_4",
    name: "Astral Sentinel",
    icon: "🪐",
    desc: "Survive to Wave 100 in Crucible",
    reqType: "crucible",
    reqValue: 100,
    stats: { block: 0.02, parry: 0.02 },
  },
  {
    id: "d_cr_5",
    name: "Cosmic Knight",
    icon: "🌠",
    desc: "Survive to Wave 200 in Crucible",
    reqType: "crucible",
    reqValue: 200,
    stats: { block: 0.025, parry: 0.025 },
  },
  {
    id: "d_cr_6",
    name: "Rift Gladiator",
    icon: "🌀",
    desc: "Survive to Wave 350 in Crucible",
    reqType: "crucible",
    reqValue: 350,
    stats: { block: 0.03, parry: 0.03 },
  },
  {
    id: "d_cr_7",
    name: "Crucible Veteran",
    icon: "🤺",
    desc: "Survive to Wave 500 in Crucible",
    reqType: "crucible",
    reqValue: 500,
    stats: { block: 0.04, parry: 0.04 },
  },
  {
    id: "d_cr_8",
    name: "Aether Champion",
    icon: "☄️",
    desc: "Survive to Wave 650 in Crucible",
    reqType: "crucible",
    reqValue: 650,
    stats: { block: 0.05, parry: 0.05 },
  },
  {
    id: "d_cr_9",
    name: "Eternity Gladiator",
    icon: "🌟",
    desc: "Survive to Wave 800 in Crucible",
    reqType: "crucible",
    reqValue: 800,
    stats: { block: 0.06, parry: 0.06 },
  },
  {
    id: "d_cr_10",
    name: "Crucible Overlord",
    icon: "♾️",
    desc: "Survive to Wave 1,000 in Crucible",
    reqType: "crucible",
    reqValue: 1000,
    stats: { block: 0.08, parry: 0.08 },
  },

  // 13. COLOSSUS STRIKE (Single Hit) - Smooth Bridge
  {
    id: "hit_1",
    name: "Flesh Wound",
    icon: "⚔️",
    desc: "Deal 150 single hit damage",
    reqType: "single_hit",
    reqValue: 150,
    stats: { critChance: 0.002, critDamage: 0.01 },
  },
  {
    id: "hit_2",
    name: "Deep Gash",
    icon: "💥",
    desc: "Deal 1,500 single hit damage",
    reqType: "single_hit",
    reqValue: 1500,
    stats: { critChance: 0.004, critDamage: 0.02 },
  },
  {
    id: "hit_3",
    name: "Heavy Slam",
    icon: "🔨",
    desc: "Deal 15,000 single hit damage",
    reqType: "single_hit",
    reqValue: 15000,
    stats: { critChance: 0.006, critDamage: 0.03 },
  },
  {
    id: "hit_4",
    name: "Annihilation",
    icon: "☄️",
    desc: "Deal 150,000 single hit damage",
    reqType: "single_hit",
    reqValue: 150000,
    stats: { critChance: 0.008, critDamage: 0.04 },
  },
  {
    id: "hit_5",
    name: "Mountain Shatterer",
    icon: "⛰️",
    desc: "Deal 1,500,000 single hit damage",
    reqType: "single_hit",
    reqValue: 1500000,
    stats: { critChance: 0.01, critDamage: 0.05 },
  },
  {
    id: "hit_6",
    name: "Continent Smasher",
    icon: "🌋",
    desc: "Deal 10,000,000 single hit damage",
    reqType: "single_hit",
    reqValue: 10000000,
    stats: { critChance: 0.015, critDamage: 0.06 },
  },
  {
    id: "hit_7",
    name: "Planet Cracker",
    icon: "🪐",
    desc: "Deal 50,000,000 single hit damage",
    reqType: "single_hit",
    reqValue: 50000000,
    stats: { critChance: 0.02, critDamage: 0.08 },
  },
  {
    id: "hit_8",
    name: "Supernova Strike",
    icon: "🌟",
    desc: "Deal 250,000,000 single hit damage",
    reqType: "single_hit",
    reqValue: 250000000,
    stats: { critChance: 0.03, critDamage: 0.12 },
  },

  // 14. NYMPH WHISPERERS (Fairies) - Smooth Bridge
  {
    id: "fairy_1",
    name: "Sprite Chaser",
    icon: "🧚",
    desc: "Capture 5 wild fairies",
    reqType: "fairies_clicked",
    reqValue: 5,
    stats: { fairySpawn: 0.01, moveSpeedPct: 0.01 },
  },
  {
    id: "fairy_2",
    name: "Pixie Wrangler",
    icon: "✨",
    desc: "Capture 25 wild fairies",
    reqType: "fairies_clicked",
    reqValue: 25,
    stats: { fairySpawn: 0.02, moveSpeedPct: 0.02 },
  },
  {
    id: "fairy_3",
    name: "Forest Friend",
    icon: "🌳",
    desc: "Capture 100 wild fairies",
    reqType: "fairies_clicked",
    reqValue: 100,
    stats: { fairySpawn: 0.03, moveSpeedPct: 0.03 },
  },
  {
    id: "fairy_4",
    name: "Nymph Nabber",
    icon: "🎐",
    desc: "Capture 500 wild fairies",
    reqType: "fairies_clicked",
    reqValue: 500,
    stats: { fairySpawn: 0.04, moveSpeedPct: 0.04 },
  },
  {
    id: "fairy_5",
    name: "Sylph Sovereign",
    icon: "🌟",
    desc: "Capture 2,000 wild fairies",
    reqType: "fairies_clicked",
    reqValue: 2000,
    stats: { fairySpawn: 0.05, moveSpeedPct: 0.05 },
  },
  {
    id: "fairy_6",
    name: "Aether Whisperer",
    icon: "🌀",
    desc: "Capture 5,000 wild fairies",
    reqType: "fairies_clicked",
    reqValue: 5000,
    stats: { fairySpawn: 0.06, moveSpeedPct: 0.06 },
  },
  {
    id: "fairy_7",
    name: "Nebula Friend",
    icon: "🪐",
    desc: "Capture 10,000 wild fairies",
    reqType: "fairies_clicked",
    reqValue: 10000,
    stats: { fairySpawn: 0.08, moveSpeedPct: 0.08 },
  },
  {
    id: "fairy_8",
    name: "Faerie Monarch",
    icon: "👑",
    desc: "Capture 25,000 wild fairies",
    reqType: "fairies_clicked",
    reqValue: 25000,
    stats: { fairySpawn: 0.12, moveSpeedPct: 0.12 },
  },

  // 15. UNYIELDING WILL (Defeats) - Smooth Bridge
  {
    id: "death_1",
    name: "Flesh & Blood",
    icon: "🩸",
    desc: "Suffer defeat 1 time",
    reqType: "death_count",
    reqValue: 1,
    stats: { maxHp: 5, maxHpPct: 0.01 },
  },
  {
    id: "death_2",
    name: "Struggler's Path",
    icon: "🥀",
    desc: "Suffer defeat 10 times",
    reqType: "death_count",
    reqValue: 10,
    stats: { maxHp: 10, maxHpPct: 0.02 },
  },
  {
    id: "death_3",
    name: "Death's Familiar",
    icon: "💀",
    desc: "Suffer defeat 50 times",
    reqType: "death_count",
    reqValue: 50,
    stats: { maxHp: 20, maxHpPct: 0.03 },
  },
  {
    id: "death_4",
    name: "Reborn Resolve",
    icon: "🌅",
    desc: "Suffer defeat 200 times",
    reqType: "death_count",
    reqValue: 200,
    stats: { maxHp: 40, maxHpPct: 0.04 },
  },
  {
    id: "death_5",
    name: "Ashen Spirit",
    icon: "🪵",
    desc: "Suffer defeat 500 times",
    reqType: "death_count",
    reqValue: 500,
    stats: { maxHp: 80, maxHpPct: 0.05 },
  },
  {
    id: "death_6",
    name: "Eternal Phoenix",
    icon: "🔥",
    desc: "Suffer defeat 1,000 times",
    reqType: "death_count",
    reqValue: 1000,
    stats: { maxHp: 160, maxHpPct: 0.06 },
  },
  {
    id: "death_7",
    name: "Valiant Reclaim",
    icon: "🌟",
    desc: "Suffer defeat 2,500 times",
    reqType: "death_count",
    reqValue: 2500,
    stats: { maxHp: 320, maxHpPct: 0.08 },
  },
  {
    id: "death_8",
    name: "Undying Transcendence",
    icon: "♾️",
    desc: "Suffer defeat 5,000 times",
    reqType: "death_count",
    reqValue: 5000,
    stats: { maxHp: 640, maxHpPct: 0.12 },
  },

  // 16. SCRAP COLLECTORS (Salvages) - Smooth Bridge
  {
    id: "salvage_1",
    name: "Scrap Collector",
    icon: "♻️",
    desc: "Salvage 10 items",
    reqType: "salvage",
    reqValue: 10,
    stats: { drop: 0.01, qly: 0.01 },
  },
  {
    id: "salvage_2",
    name: "Deconstruction Derby",
    icon: "🚜",
    desc: "Salvage 100 items",
    reqType: "salvage",
    reqValue: 100,
    stats: { drop: 0.02, qly: 0.02 },
  },
  {
    id: "salvage_3",
    name: "Infinite Recycler",
    icon: "⚙️",
    desc: "Salvage 500 items",
    reqType: "salvage",
    reqValue: 500,
    stats: { drop: 0.03, qly: 0.03 },
  },
  {
    id: "salvage_4",
    name: "Scrap Colossus",
    icon: "🤖",
    desc: "Salvage 2,000 items",
    reqType: "salvage",
    reqValue: 2000,
    stats: { drop: 0.04, qly: 0.04 },
  },
  {
    id: "salvage_5",
    name: "Meltdown Engineer",
    icon: "🌋",
    desc: "Salvage 5,000 items",
    reqType: "salvage",
    reqValue: 5000,
    stats: { drop: 0.05, qly: 0.05 },
  },
  {
    id: "salvage_6",
    name: "Nanotech Recycler",
    icon: "🧬",
    desc: "Salvage 10,000 items",
    reqType: "salvage",
    reqValue: 10000,
    stats: { drop: 0.06, qly: 0.06 },
  },
  {
    id: "salvage_7",
    name: "Atomic Disassembler",
    icon: "🪐",
    desc: "Salvage 25,000 items",
    reqType: "salvage",
    reqValue: 25000,
    stats: { drop: 0.08, qly: 0.08 },
  },
  {
    id: "salvage_8",
    name: "Quantum Disassembler",
    icon: "♾️",
    desc: "Salvage 50,000 items",
    reqType: "salvage",
    reqValue: 50000,
    stats: { drop: 0.12, qly: 0.12 },
  },

  // 17. FAIRY BLITZ (Speed Fairy captures) - Clean progression
  {
    id: "f_spd_1",
    name: "Nymph Chaser",
    icon: "🧚",
    desc: "Click 2 fairies in 10s",
    reqType: "fairy_speed",
    reqValue: 2,
    stats: { fairySpawn: 0.01, moveSpeedPct: 0.01 },
  },
  {
    id: "f_spd_2",
    name: "Swift Fingers",
    icon: "⚡",
    desc: "Click 3 fairies in 10s",
    reqType: "fairy_speed",
    reqValue: 3,
    stats: { fairySpawn: 0.02, moveSpeedPct: 0.02 },
  },
  {
    id: "f_spd_3",
    name: "Pixie Cyclone",
    icon: "🌀",
    desc: "Click 4 fairies in 10s",
    reqType: "fairy_speed",
    reqValue: 4,
    stats: { fairySpawn: 0.03, moveSpeedPct: 0.03 },
  },
  {
    id: "f_spd_4",
    name: "Sprite Hurricane",
    icon: "🌪️",
    desc: "Click 5 fairies in 10s",
    reqType: "fairy_speed",
    reqValue: 5,
    stats: { fairySpawn: 0.04, moveSpeedPct: 0.04 },
  },
  {
    id: "f_spd_5",
    name: "Chronos Reflexes",
    icon: "⌛",
    desc: "Click 6 fairies in 10s",
    reqType: "fairy_speed",
    reqValue: 6,
    stats: { fairySpawn: 0.06, moveSpeedPct: 0.06 },
  },
  {
    id: "f_spd_6",
    name: "Aetherial Velocity",
    icon: "🌌",
    desc: "Click 8 fairies in 10s",
    reqType: "fairy_speed",
    reqValue: 8,
    stats: { fairySpawn: 0.1, moveSpeedPct: 0.1 },
  },

  // 18. UNBREAKABLE AEGIS (Deflections) - Smooth Bridge
  {
    id: "defl_1",
    name: "Parry Practice",
    icon: "🤺",
    desc: "Deflect 100 attacks",
    reqType: "deflections",
    reqValue: 100,
    stats: { def: 2, defPct: 0.01 },
  },
  {
    id: "defl_2",
    name: "Deflector Shield",
    icon: "🛡️",
    desc: "Deflect 500 attacks",
    reqType: "deflections",
    reqValue: 500,
    stats: { def: 4, defPct: 0.02 },
  },
  {
    id: "defl_3",
    name: "Phalanx Wall",
    icon: "🧱",
    desc: "Deflect 2,000 attacks",
    reqType: "deflections",
    reqValue: 2000,
    stats: { def: 8, defPct: 0.03 },
  },
  {
    id: "defl_4",
    name: "Aegis Sentinel",
    icon: "🛡️",
    desc: "Deflect 10,000 attacks",
    reqType: "deflections",
    reqValue: 10000,
    stats: { def: 16, defPct: 0.04 },
  },
  {
    id: "defl_5",
    name: "Bastion Wall",
    icon: "🏰",
    desc: "Deflect 25,000 attacks",
    reqType: "deflections",
    reqValue: 25000,
    stats: { def: 32, defPct: 0.05 },
  },
  {
    id: "defl_6",
    name: "Titan Fortress",
    icon: "🤖",
    desc: "Deflect 50,000 attacks",
    reqType: "deflections",
    reqValue: 50000,
    stats: { def: 64, defPct: 0.06 },
  },
  {
    id: "defl_7",
    name: "Aetherial Bulwark",
    icon: "🪐",
    desc: "Deflect 75,000 attacks",
    reqType: "deflections",
    reqValue: 75000,
    stats: { def: 128, defPct: 0.08 },
  },
  {
    id: "defl_8",
    name: "Impenetrable Anomaly",
    icon: "🌀",
    desc: "Deflect 100,000 attacks",
    reqType: "deflections",
    reqValue: 100000,
    stats: { def: 256, defPct: 0.12 },
  },

  // 19. POLYMORPH COCKTAIL (Simultaneous active buffs) - Cap is 6
  {
    id: "buff_1",
    name: "Doped",
    icon: "🧪",
    desc: "Have 1 active buff",
    reqType: "buff_stack",
    reqValue: 1,
    stats: { potDurationPct: 0.01, potStrengthPct: 0.01 },
  },
  {
    id: "buff_2",
    name: "Double Dose",
    icon: "🍺",
    desc: "Have 2 active buffs",
    reqType: "buff_stack",
    reqValue: 2,
    stats: { potDurationPct: 0.02, potStrengthPct: 0.02 },
  },
  {
    id: "buff_3",
    name: "Stimulated",
    icon: "🍷",
    desc: "Have 3 active buffs",
    reqType: "buff_stack",
    reqValue: 3,
    stats: { potDurationPct: 0.03, potStrengthPct: 0.03 },
  },
  {
    id: "buff_4",
    name: "Cocktail Shaker",
    icon: "🍸",
    desc: "Have 4 active buffs",
    reqType: "buff_stack",
    reqValue: 4,
    stats: { potDurationPct: 0.04, potStrengthPct: 0.04 },
  },
  {
    id: "buff_5",
    name: "Hyper Charged",
    icon: "⚡",
    desc: "Have 5 active buffs",
    reqType: "buff_stack",
    reqValue: 5,
    stats: { potDurationPct: 0.06, potStrengthPct: 0.06 },
  },
  {
    id: "buff_6",
    name: "Ultimate Panacea",
    icon: "🌌",
    desc: "Have 6 active buffs",
    reqType: "buff_stack",
    reqValue: 6,
    stats: { potDurationPct: 0.1, potStrengthPct: 0.1 },
  },

  // 20. ELITE REFORGING (Total Reforges via Catalyst Cores) - Smooth Bridge
  {
    id: "refo_1",
    name: "Tinker",
    icon: "🔧",
    desc: "Reforge modifiers 5 times",
    reqType: "reforges",
    reqValue: 5,
    stats: { dex: 1, dexPct: 0.01 },
  },
  {
    id: "refo_2",
    name: "Locksmith",
    icon: "🔒",
    desc: "Reforge modifiers 15 times",
    reqType: "reforges",
    reqValue: 15,
    stats: { dex: 2, dexPct: 0.02 },
  },
  {
    id: "refo_3",
    name: "Optimizer",
    icon: "⚙️",
    desc: "Reforge modifiers 50 times",
    reqType: "reforges",
    reqValue: 50,
    stats: { dex: 4, dexPct: 0.03 },
  },
  {
    id: "refo_4",
    name: "Modifier Master",
    icon: "🛠️",
    desc: "Reforge modifiers 150 times",
    reqType: "reforges",
    reqValue: 150,
    stats: { dex: 8, dexPct: 0.04 },
  },
  {
    id: "refo_5",
    name: "Core Siphon",
    icon: "🔋",
    desc: "Reforge modifiers 300 times",
    reqType: "reforges",
    reqValue: 300,
    stats: { dex: 16, dexPct: 0.05 },
  },
  {
    id: "refo_6",
    name: "Cosmic Calibration",
    icon: "💫",
    desc: "Reforge modifiers 500 times",
    reqType: "reforges",
    reqValue: 500,
    stats: { dex: 32, dexPct: 0.06 },
  },
  {
    id: "refo_7",
    name: "Matrix Adjuster",
    icon: "🛸",
    desc: "Reforge modifiers 750 times",
    reqType: "reforges",
    reqValue: 750,
    stats: { dex: 64, dexPct: 0.08 },
  },
  {
    id: "refo_8",
    name: "Paradox Adjuster",
    icon: "🌌",
    desc: "Reforge modifiers 1,000 times",
    reqType: "reforges",
    reqValue: 1000,
    stats: { dex: 128, dexPct: 0.12 },
  },

  // 21. GUILD INVESTMENTS (Combined levels of permanent Gold Sinks) - Smooth Bridge
  {
    id: "g_up_1",
    name: "Smart Spender",
    icon: "💰",
    desc: "Combined Gold Upgrade level 5",
    reqType: "gold_upgrades",
    reqValue: 5,
    stats: { gold: 0.01, int: 1 },
  },
  {
    id: "g_up_2",
    name: "Capital Allocator",
    icon: "💼",
    desc: "Combined Gold Upgrade level 15",
    reqType: "gold_upgrades",
    reqValue: 15,
    stats: { gold: 0.02, int: 2 },
  },
  {
    id: "g_up_3",
    name: "Guild Associate",
    icon: "🏛️",
    desc: "Combined Gold Upgrade level 30",
    reqType: "gold_upgrades",
    reqValue: 30,
    stats: { gold: 0.03, int: 4 },
  },
  {
    id: "g_up_4",
    name: "Monopoly Holder",
    icon: "🏦",
    desc: "Combined Gold Upgrade level 50",
    reqType: "gold_upgrades",
    reqValue: 50,
    stats: { gold: 0.04, int: 8 },
  },
  {
    id: "g_up_5",
    name: "Market Mogul",
    icon: "💹",
    desc: "Combined Gold Upgrade level 70",
    reqType: "gold_upgrades",
    reqValue: 70,
    stats: { gold: 0.05, int: 16 },
  },
  {
    id: "g_up_6",
    name: "High Financier",
    icon: "👑",
    desc: "Combined Gold Upgrade level 90",
    reqType: "gold_upgrades",
    reqValue: 90,
    stats: { gold: 0.06, int: 32 },
  },
  {
    id: "g_up_7",
    name: "Venture Captain",
    icon: "🪐",
    desc: "Combined Gold Upgrade level 120",
    reqType: "gold_upgrades",
    reqValue: 120,
    stats: { gold: 0.08, int: 64 },
  },
  {
    id: "g_up_8",
    name: "Midas' Treasurer",
    icon: "🌌",
    desc: "Combined Gold Upgrade level 150",
    reqType: "gold_upgrades",
    reqValue: 150,
    stats: { gold: 0.12, int: 128 },
  },

  // 22. JACKPOT (Gold Earned in a single drop) - Smooth Bridge
  {
    id: "drop_g_1",
    name: "Spare Coins",
    icon: "💰",
    desc: "Earn 1,000 gold from a single drop",
    reqType: "single_gold_drop",
    reqValue: 1000,
    stats: { gold: 0.01, critDamage: 0.01 },
  },
  {
    id: "drop_g_2",
    name: "Pouch of Silver",
    icon: "💰",
    desc: "Earn 10,000 gold from a single drop",
    reqType: "single_gold_drop",
    reqValue: 10000,
    stats: { gold: 0.02, critDamage: 0.02 },
  },
  {
    id: "drop_g_3",
    name: "Heavy Satchel",
    icon: "💼",
    desc: "Earn 100,000 gold from a single drop",
    reqType: "single_gold_drop",
    reqValue: 100000,
    stats: { gold: 0.03, critDamage: 0.03 },
  },
  {
    id: "drop_g_4",
    name: "Vault Breaker",
    icon: "🏦",
    desc: "Earn 1,000,000 gold from a single drop",
    reqType: "single_gold_drop",
    reqValue: 1000000,
    stats: { gold: 0.04, critDamage: 0.04 },
  },
  {
    id: "drop_g_5",
    name: "Royal Treasury",
    icon: "🏰",
    desc: "Earn 5,000,000 gold from a single drop",
    reqType: "single_gold_drop",
    reqValue: 5000000,
    stats: { gold: 0.05, critDamage: 0.05 },
  },
  {
    id: "drop_g_6",
    name: "Dragon's Hoard",
    icon: "🐉",
    desc: "Earn 10,000,000 gold from a single drop",
    reqType: "single_gold_drop",
    reqValue: 10000000,
    stats: { gold: 0.06, critDamage: 0.06 },
  },
  {
    id: "drop_g_7",
    name: "Celestial Fortune",
    icon: "🪐",
    desc: "Earn 50,000,000 gold from a single drop",
    reqType: "single_gold_drop",
    reqValue: 50000000,
    stats: { gold: 0.08, critDamage: 0.08 },
  },
  {
    id: "drop_g_8",
    name: "Cosmic Treasury",
    icon: "🌌",
    desc: "Earn 100,000,000 gold from a single drop",
    reqType: "single_gold_drop",
    reqValue: 100000000,
    stats: { gold: 0.12, critDamage: 0.12 },
  },

  // 23. RARE SIGHTINGS (Rare Spawns Slayed) - Smooth Bridge
  {
    id: "rare_s_1",
    name: "Uncommon Encounter",
    icon: "✨",
    desc: "Slay 5 Rare Spawns",
    reqType: "rare_spawns",
    reqValue: 5,
    stats: { rareSpawn: 0.001, qly: 0.01 },
  },
  {
    id: "rare_s_2",
    name: "Rarity Hunter",
    icon: "🧭",
    desc: "Slay 25 Rare Spawns",
    reqType: "rare_spawns",
    reqValue: 25,
    stats: { rareSpawn: 0.002, qly: 0.02 },
  },
  {
    id: "rare_s_3",
    name: "Shimmering Predator",
    icon: "🐅",
    desc: "Slay 100 Rare Spawns",
    reqType: "rare_spawns",
    reqValue: 100,
    stats: { rareSpawn: 0.003, qly: 0.03 },
  },
  {
    id: "rare_s_4",
    name: "Elite Exterminator",
    icon: "⚔️",
    desc: "Slay 500 Rare Spawns",
    reqType: "rare_spawns",
    reqValue: 500,
    stats: { rareSpawn: 0.004, qly: 0.04 },
  },
  {
    id: "rare_s_5",
    name: "Stardust Tracker",
    icon: "🌌",
    desc: "Slay 1,000 Rare Spawns",
    reqType: "rare_spawns",
    reqValue: 1000,
    stats: { rareSpawn: 0.005, qly: 0.05 },
  },
  {
    id: "rare_s_6",
    name: "Chronos Stalker",
    icon: "⏳",
    desc: "Slay 2,000 Rare Spawns",
    reqType: "rare_spawns",
    reqValue: 2000,
    stats: { rareSpawn: 0.006, qly: 0.06 },
  },
  {
    id: "rare_s_7",
    name: "Nebula Hunter",
    icon: "🪐",
    desc: "Slay 5,000 Rare Spawns",
    reqType: "rare_spawns",
    reqValue: 5000,
    stats: { rareSpawn: 0.008, qly: 0.08 },
  },
  {
    id: "rare_s_8",
    name: "Mythic Hunter of Legend",
    icon: "👑",
    desc: "Slay 10,000 Rare Spawns",
    reqType: "rare_spawns",
    reqValue: 10000,
    stats: { rareSpawn: 0.012, qly: 0.12 },
  },

  // ==========================================================================
  // SINGLE TIER ACHIEVEMENTS / VALOR FEATS (isSingleTier: true)
  // ==========================================================================
  {
    id: "sing_murphys_law",
    name: "Murphy's Law",
    icon: "🍀",
    desc: "Fail a tempering attempt with a success rate of 90% or higher",
    isSingleTier: true,
    stats: { qly: 0.05, maxHpPct: 0.03 },
  },
  {
    id: "sing_against_odds",
    name: "Against All Odds",
    icon: "🌟",
    desc: "Obtain a 5★ Mythic item from a standard campaign non-boss monster",
    isSingleTier: true,
    stats: { qly: 0.05, atkPct: 0.03 },
  },
  {
    id: "sing_lucky_seven",
    name: "Lucky Seven",
    icon: "🎲",
    desc: "Roll a crit, block, and parry all within a 1-second window",
    isSingleTier: true,
    stats: { atkPct: 0.05, defPct: 0.05 },
  },
  {
    id: "sing_back_brink",
    name: "Back from the Brink",
    icon: "🩸",
    desc: "Trigger Second Wind (Ankh) and successfully defeat that same boss",
    isSingleTier: true,
    stats: { maxHpPct: 0.05, defPct: 0.05 },
  },
  {
    id: "sing_elemental_conv",
    name: "Elemental Convergence",
    icon: "🌀",
    desc: "Trigger Lightning, Fire, and Frost tome spells simultaneously",
    isSingleTier: true,
    stats: { intPct: 0.1, potStrengthPct: 0.05 },
  },
  {
    id: "sing_no_hands",
    name: "Look Ma, No Hands",
    icon: "⚔️",
    desc: "Defeat a boss stage without clicking/pressing space once in that battle",
    isSingleTier: true,
    stats: { idleSpeedPct: 0.05, expPct: 0.05 },
  },
  {
    id: "sing_poly_cocktail",
    name: "Polymorph Cocktail",
    icon: "🧪",
    desc: "Have 6 distinct potion/relic buffs active at the same time",
    isSingleTier: true,
    stats: { potDurationPct: 0.1, potStrengthPct: 0.05 },
  },
  {
    id: "sing_hoarder",
    name: "Paranoid Hoarder",
    icon: "🎒",
    desc: "Fill your equipment bag to maximum capacity with entirely LOCKED gear",
    isSingleTier: true,
    stats: { qly: 0.05, gold: 0.05 },
  },
  {
    id: "sing_unified_set",
    name: "Unified Aesthetics",
    icon: "🎨",
    desc: "Equip 6 armor/weapon slots from the exact same named Dungeon Set",
    isSingleTier: true,
    stats: { atkPct: 0.08, defPct: 0.08 },
  },
  {
    id: "sing_golden_touch",
    name: "Golden Touch",
    icon: "👑",
    desc: "Equip 3 Gold-boosting Unique Artifacts simultaneously",
    isSingleTier: true,
    stats: { gold: 0.15, goldMulti: 0.1 },
  },
  {
    id: "sing_untouchable",
    name: "Untouchable",
    icon: "🛡️",
    desc: "Defeat a Campaign or Dungeon Boss taking exactly 0 damage",
    isSingleTier: true,
    stats: { parry: 0.02, block: 0.02, defPct: 0.05 },
  },
  {
    id: "sing_overkill",
    name: "Overkill",
    icon: "💥",
    desc: "Deal a critical hit that exceeds a route monster's remaining HP by 1000%+",
    isSingleTier: true,
    stats: { critDamage: 0.15, atkPct: 0.05 },
  },
  {
    id: "sing_speedrun",
    name: "Speedrunner's Delight",
    icon: "⏱️",
    desc: "Ascend at the Altar within 15 minutes of your previous Ascension",
    isSingleTier: true,
    stats: { expPct: 0.1, gold: 0.05 },
  },
  {
    id: "sing_exact_change",
    name: "Exact Change",
    icon: "💰",
    desc: "Buy an item or upgrade that brings your gold balance to exactly 0",
    isSingleTier: true,
    stats: { gold: 0.1, goldMulti: 0.05 },
  },
  {
    id: "sing_unfortunate_soul",
    name: "Unfortunate Soul",
    icon: "💔",
    desc: "Suffer three consecutive tempering failures on the same item at +9 or below",
    isSingleTier: true,
    stats: { qly: 0.05, drop: 0.05 },
  },
  {
    id: "sing_alchemical_synth",
    name: "Alchemical Override",
    icon: "🔮",
    desc: "Override an active potion with a higher tier of the same type",
    isSingleTier: true,
    stats: { potStrengthPct: 0.05, potDurationPct: 0.05 },
  },
  {
    id: "sing_patient_shepherd",
    name: "Patient Shepherd",
    icon: "🧚",
    desc: "Let 3 fairies fly simultaneously, then capture all of them in 2 seconds",
    isSingleTier: true,
    stats: { fairySpawn: 0.1, moveSpeedPct: 0.05 },
  },
  {
    id: "sing_battlemage",
    name: "Battlemage's Legacy",
    icon: "🧙",
    desc: "Equip heavy plate armor in every slot while wielding the unique Staff",
    isSingleTier: true,
    stats: { atkPct: 0.05, defPct: 0.05, intPct: 0.05 },
  },
  {
    id: "sing_bare_fists",
    name: "Bare Fists",
    icon: "🥊",
    desc: "Defeat any Stage or Dungeon Boss with no weapon equipped",
    isSingleTier: true,
    stats: { atk: 10, atkPct: 0.02 },
  },
  {
    id: "sing_perfect_deflection",
    name: "Perfect Deflection",
    icon: "⚡",
    desc: "Parry three consecutive attacks without taking damage or blocking",
    isSingleTier: true,
    stats: { parry: 0.01, dexPct: 0.05 },
  },
  {
    id: "sing_night_owl",
    name: "Night Owl",
    icon: "🦉",
    desc: "Slay any monster between 12:00 AM and 4:00 AM local time",
    isSingleTier: true,
    stats: { critDamage: 0.05, atkPct: 0.03 },
  },
  {
    id: "sing_early_bird",
    name: "Early Bird",
    icon: "🌅",
    desc: "Slay any monster between 5:00 AM and 8:00 AM local time",
    isSingleTier: true,
    stats: { expPct: 0.05, maxHpPct: 0.03 },
  },
  {
    id: "sing_coffee_run",
    name: "Coffee Run",
    icon: "☕",
    desc: "Consume a Haste Elixir between 7:00 AM and 9:00 AM local time",
    isSingleTier: true,
    stats: { potDurationPct: 0.05, moveSpeedPct: 0.03 },
  },
  {
    id: "sing_high_noon",
    name: "High Noon",
    icon: "☀️",
    desc: "Defeat any Boss between 12:00 PM and 1:00 PM local time",
    isSingleTier: true,
    stats: { gold: 0.05, goldMulti: 0.03 },
  },
  {
    id: "sing_witching_hour",
    name: "The Witching Hour",
    icon: "🧙‍♀️",
    desc: "Defeat a Rift Guardian between 3:00 AM and 4:00 AM local time",
    isSingleTier: true,
    stats: { qly: 0.05, drop: 0.05 },
  },
  {
    id: "sing_weekend_warrior",
    name: "Weekend Warrior",
    icon: "🗓️",
    desc: "Active in Dungeons or Crucible on Saturday or Sunday",
    isSingleTier: true,
    stats: { drop: 0.1, gold: 0.05 },
  },
  {
    id: "sing_time_capsule",
    name: "Time Capsule",
    icon: "⏳",
    desc: "Claim maximum 8-hour offline gains",
    isSingleTier: true,
    stats: { expPct: 0.05, gold: 0.05 },
  },
  {
    id: "sing_long_run",
    name: "The Long Run",
    icon: "♾️",
    desc: "Keep the game running continuously in an active tab for 1 hour",
    isSingleTier: true,
    stats: { atk: 25, def: 25, maxHpPct: 0.05 },
  },
  {
    id: "sing_clicking_tempest",
    name: "Clicking Tempest",
    icon: "⚡",
    desc: "Click/Tap the canvas exactly 100 times in a 10-second window",
    isSingleTier: true,
    stats: { critChance: 0.02, moveSpeedPct: 0.03 },
  },
  {
    id: "sing_aetheric_recharge",
    name: "Aetheric Recharge",
    icon: "🌀",
    desc: "Spend 10 minutes continuously inside any Dungeon or Crucible run",
    isSingleTier: true,
    stats: { drop: 0.05, qly: 0.05 },
  },
];

window.slotNouns = {
  weapon: [
    "Greatsword",
    "Longsword",
    "Halberd",
    "Warhammer",
    "Battleaxe",
    "Broadsword",
    "Flanged Mace",
    "Claymore",
  ],
  subweapon: {
    shield: [
      "Kite Shield",
      "Tower Shield",
      "Buckler",
      "Aegis",
      "Heater Shield",
    ],
    dagger: ["Kris", "Stiletto", "Baselard", "Dirk", "Main-Gauche"],
    tome: ["Grimoire", "Spellbook", "Codex", "Lexicon", "Chronicle"],
  },
  helmet: [
    "Greathelm",
    "Armet",
    "Bascinet",
    "Coif",
    "Barbuta",
    "Circlet",
    "Visor",
  ],
  chest: [
    "Hauberk",
    "Cuirass",
    "Brigandine",
    "Plate Mail",
    "Chain Mail",
    "Doublet",
  ],
  leggings: ["Greaves", "Legplates", "Chausses", "Cuisses"],
  boots: ["Sabatons", "Sollerets", "Steel Boots", "Treads"],
  overall: ["Exosuit", "Inquisitor Robes", "Full Plate Armor", "Trenchcoat"],
};

// --- CORE DATA HELPERS ---

window.getAchievementProgress = function (ach) {
  if (ach.reqType === "kills")
    return window.playerStats.totalLifetimeKills || 0;
  if (ach.reqType === "gold") return window.playerStats.totalGoldEarned || 0;
  if (ach.reqType === "stage") return window.playerStats.maxStage || 1;
  if (ach.reqType === "temper") return window.playerStats.totalTempers || 0;
  if (ach.reqType === "enchant") return window.playerStats.totalEnchants || 0;
  if (ach.reqType === "rift") return window.playerStats.riftGuardiansSlain || 0;
  if (ach.reqType === "level") return window.playerStats.level || 1;
  if (ach.reqType === "elixirs") return window.playerStats.elixirsConsumed || 0;
  if (ach.reqType === "bag_count") return window.inventory.EQUIP.length || 0;
  if (ach.reqType === "salvage") return window.playerStats.itemsSalvaged || 0;
  if (ach.reqType === "prestige") return window.playerStats.prestigeCount || 0;
  if (ach.reqType === "crucible") return window.playerStats.cruciblePeak || 1;
  if (ach.reqType === "dungeon_equip")
    return (
      (window.playerStats.dungeonPeaks &&
        window.playerStats.dungeonPeaks.equip) ||
      1
    );
  if (ach.reqType === "dungeon_gold")
    return (
      (window.playerStats.dungeonPeaks &&
        window.playerStats.dungeonPeaks.gold) ||
      1
    );
  if (ach.reqType === "dungeon_mat")
    return (
      (window.playerStats.dungeonPeaks &&
        window.playerStats.dungeonPeaks.mat) ||
      1
    );
  if (ach.reqType === "artifacts_held")
    return (window.inventory.ARTIFACT && window.inventory.ARTIFACT.length) || 0;
  if (ach.reqType === "fairies_clicked")
    return window.playerStats.fairiesClicked || 0;
  if (ach.reqType === "death_count") return window.playerStats.deathCount || 0;
  if (ach.reqType === "single_hit")
    return window.playerStats.peakSingleHit || 0;
  if (ach.reqType === "fairy_speed")
    return window.playerStats.maxFairyClicksInWindow || 0;
  if (ach.reqType === "deflections")
    return window.playerStats.totalDeflections || 0;
  if (ach.reqType === "buff_stack")
    return window.playerStats.peakSimultaneousBuffs || 0;
  if (ach.reqType === "reforges") return window.playerStats.totalReforges || 0;
  if (ach.reqType === "gold_upgrades")
    return (
      (window.playerStats.vendingQLevel || 0) +
      (window.playerStats.shopQLevel || 0) +
      (window.playerStats.globalQLevel || 0)
    );
  if (ach.reqType === "single_gold_drop")
    return window.playerStats.peakSingleGoldDrop || 0;
  if (ach.reqType === "rare_spawns")
    return window.playerStats.rareSpawnsSlain || 0;
  if (ach.reqType === "materials_held") {
    let maxHeld = 0;
    for (let k in window.inventory.ETC) {
      maxHeld = Math.max(maxHeld, window.inventory.ETC[k] || 0);
    }
    return maxHeld;
  }
  if (ach.isSingleTier) {
    if (ach.id === "sing_murphys_law")
      return window.playerStats.hasTriggeredMurphysLaw ? 1 : 0;
    if (ach.id === "sing_against_odds")
      return window.playerStats.hasTriggeredAgainstOdds ? 1 : 0;
    if (ach.id === "sing_lucky_seven")
      return window.playerStats.hasTriggeredLuckySeven ? 1 : 0;
    if (ach.id === "sing_back_brink")
      return window.playerStats.hasTriggeredBackFromBrink ? 1 : 0;
    if (ach.id === "sing_elemental_conv")
      return window.playerStats.hasTriggeredElementalConvergence ? 1 : 0;
    if (ach.id === "sing_no_hands")
      return window.playerStats.hasTriggeredLookMaNoHands ? 1 : 0;
    if (ach.id === "sing_poly_cocktail")
      return window.playerStats.peakSimultaneousBuffs >= 6 ? 1 : 0;
    if (ach.id === "sing_hoarder")
      return window.inventory.EQUIP.length >= window.getMaxBagSlots() &&
        window.inventory.EQUIP.every((i) => i.locked)
        ? 1
        : 0;
    if (ach.id === "sing_unified_set") {
      let slots = [
        "weapon",
        "subweapon",
        "helmet",
        "chest",
        "leggings",
        "boots",
      ];
      let setsEquipped = slots.map((s) =>
        window.equippedSlots[s]
          ? window.getItemSetName(window.equippedSlots[s])
          : null,
      );
      let validSets = setsEquipped.filter((s) => s !== null);
      if (validSets.length === 6 && validSets.every((s) => s === validSets[0]))
        return 1;
      return 0;
    }
    if (ach.id === "sing_golden_touch") {
      let arts = [
        window.equippedSlots.art1,
        window.equippedSlots.art2,
        window.equippedSlots.art3,
      ];
      let count = arts.filter((a) => a && a.goldMulti > 0).length;
      return count >= 3 ? 1 : 0;
    }
    if (ach.id === "sing_untouchable")
      return window.playerStats.hasTriggeredUntouchable ? 1 : 0;
    if (ach.id === "sing_overkill")
      return window.playerStats.hasTriggeredOverkill ? 1 : 0;
    if (ach.id === "sing_speedrun")
      return window.playerStats.hasTriggeredSpeedrun ? 1 : 0;
    if (ach.id === "sing_exact_change")
      return window.playerStats.hasTriggeredExactChange ? 1 : 0;
    if (ach.id === "sing_unfortunate_soul")
      return window.playerStats.hasTriggeredUnfortunateSoul ? 1 : 0;
    if (ach.id === "sing_alchemical_synth")
      return window.playerStats.hasTriggeredAlchemicalSynthesis ? 1 : 0;
    if (ach.id === "sing_patient_shepherd")
      return window.playerStats.hasTriggeredPatientShepherd ? 1 : 0;
    if (ach.id === "sing_battlemage") {
      let isHeavy = ["helmet", "chest", "leggings", "boots"].every(
        (s) =>
          window.equippedSlots[s] &&
          (window.equippedSlots[s].name.includes("Vanguard") ||
            window.equippedSlots[s].name.includes("Colossus") ||
            window.equippedSlots[s].name.includes("Bastion") ||
            window.equippedSlots[s].name.includes("Dreadnought")),
      );
      let isStaff =
        window.equippedSlots.weapon &&
        window.equippedSlots.weapon.isUniqueStaff;
      return isHeavy && isStaff ? 1 : 0;
    }
    if (ach.id === "sing_bare_fists")
      return !window.equippedSlots.weapon &&
        window.playerStats.hasTriggeredBareFists
        ? 1
        : 0;
    if (ach.id === "sing_perfect_deflection")
      return window.playerStats.hasTriggeredPerfectDeflection ? 1 : 0;
    let hr = new Date().getHours();
    if (ach.id === "sing_night_owl") return hr >= 0 && hr < 4 ? 1 : 0;
    if (ach.id === "sing_early_bird") return hr >= 5 && hr < 8 ? 1 : 0;
    if (ach.id === "sing_coffee_run")
      return hr >= 7 && hr < 9 && window.playerStats.hastePotionTimer > 0
        ? 1
        : 0;
    if (ach.id === "sing_high_noon")
      return hr >= 12 && hr < 13 && window.playerStats.hasTriggeredHighNoon
        ? 1
        : 0;
    if (ach.id === "sing_witching_hour")
      return hr >= 3 && hr < 4 && window.playerStats.hasTriggeredWitchingHour
        ? 1
        : 0;
    if (ach.id === "sing_weekend_warrior") {
      let day = new Date().getDay();
      return day === 0 || day === 6 ? 1 : 0;
    }
    if (ach.id === "sing_time_capsule")
      return window.playerStats.hasTriggeredTimeCapsule ? 1 : 0;
    if (ach.id === "sing_long_run")
      return window.playerStats.sessionPlaytime >= 3600000 ? 1 : 0;
    if (ach.id === "sing_clicking_tempest")
      return window.playerStats.maxCanvasClicksInWindow >= 100 ? 1 : 0;
    if (ach.id === "sing_aetheric_recharge")
      return window.playerStats.hasTriggeredAethericRecharge ? 1 : 0;
  }
  return 0;
};

window.recalculateAchievementTotals = function () {
  let totals = {
    atk: 0,
    maxHp: 0,
    def: 0,
    moveSpeed: 0,
    critChance: 0,
    critDamage: 0,
    block: 0,
    parry: 0,
    drop: 0,
    qly: 0,
    gold: 0,
    str: 0,
    dex: 0,
    int: 0,
    fairySpawn: 0,
    rareSpawn: 0,
    expPct: 0,
    potDurationPct: 0,
    potStrengthPct: 0,
    atkPct: 0,
    maxHpPct: 0,
    defPct: 0,
    moveSpeedPct: 0,
    strPct: 0,
    dexPct: 0,
    intPct: 0,
    idleSpeedPct: 0,
    activeSpeedPct: 0,
  };
  if (window.playerStats.unlockedAchievements) {
    window.playerStats.unlockedAchievements.forEach((id) => {
      let ach = window.AchievementsData.find((a) => a.id === id);
      if (ach && ach.stats) {
        for (let k in ach.stats) {
          if (totals[k] !== undefined) totals[k] += ach.stats[k];
        }
      }
    });
  }
  window.playerStats.cachedAchievementBonusTotals = totals;
};

window.checkAchievements = function () {
  if (!window.playerStats.unlockedAchievements)
    window.playerStats.unlockedAchievements = [];

  let activeBuffs = 0;
  if (window.playerStats.atkPotionTimer > 0) activeBuffs++;
  if (window.playerStats.hpPotionTimer > 0) activeBuffs++;
  if (window.playerStats.defPotionTimer > 0) activeBuffs++;
  if (window.playerStats.hastePotionTimer > 0) activeBuffs++;
  if (window.playerStats.frenzyTimer > 0) activeBuffs++;
  if (window.playerStats.adrenalineTimer > 0) activeBuffs++;
  window.playerStats.peakSimultaneousBuffs = Math.max(
    window.playerStats.peakSimultaneousBuffs || 0,
    activeBuffs,
  );

  let unlockedAny = false;
  window.AchievementsData.forEach((ach) => {
    if (window.playerStats.unlockedAchievements.includes(ach.id)) return;
    let progress = window.getAchievementProgress(ach);
    let targetValue = ach.isSingleTier ? 1 : ach.reqValue;
    if (progress >= targetValue) {
      window.playerStats.unlockedAchievements.push(ach.id);
      if (!window.playerStats.unviewedAchievements)
        window.playerStats.unviewedAchievements = [];
      if (!window.playerStats.unviewedAchievements.includes(ach.id)) {
        window.playerStats.unviewedAchievements.push(ach.id);
      }
      unlockedAny = true;

      let currentAchId = ach.id;
      if (typeof window.pushLog === "function")
        window.pushLog(
          `<strong style="color:#f1c40f;">🏆 CHALLENGE ACHIEVED: [${ach.name}]!</strong> - ${ach.desc}`,
        );
      if (typeof window.pushHeaderToast === "function")
        window.pushHeaderToast(
          `🏆 Milestone Unlocked: ${ach.name}! (Click to View)`,
          "#f1c40f",
          function () {
            if (typeof window.navigateToAchievement === "function")
              window.navigateToAchievement(currentAchId);
          },
        );
    }
  });
  if (unlockedAny) {
    window.recalculateAchievementTotals();
    if (
      typeof window.resolvePlayerStats === "function" &&
      typeof window.updateUI === "function"
    ) {
      let p = window.resolvePlayerStats();
      window.playerStats.currentHp = Math.min(
        window.playerStats.currentHp,
        p.maxHp,
      );
      window.updateUI();
      if (typeof window.renderInventory === "function")
        window.renderInventory();
      if (typeof window.saveGame === "function") window.saveGame();
    }
  }
};

window.checkArtifactTrait = function (trait) {
  if (!window.equippedSlots) return false;
  return (
    (window.equippedSlots.art1 && window.equippedSlots.art1.trait === trait) ||
    (window.equippedSlots.art2 && window.equippedSlots.art2.trait === trait) ||
    (window.equippedSlots.art3 && window.equippedSlots.art3.trait === trait)
  );
};

window.getItemSetName = function (item) {
  if (!item || item.type === "artifact" || item.statsRolled === "UNIQUE")
    return null;
  return item.setName || null;
};

window.getMaxBagSlots = function () {
  let base = window.checkArtifactTrait("bag_space") ? 50 : 20;
  let missionBag =
    ((window.playerStats.missionUpgrades &&
      window.playerStats.missionUpgrades.bag) ||
      0) * 10;
  return base + missionBag;
};

window.getTierName = function (stars) {
  if (stars === "UNIQUE") return "Unique Artifact";
  const tiers = ["Common", "Rare", "Magic", "Epic", "Legendary", "Mythic"];
  return tiers[stars] || "Unknown";
};

window.getTierColor = function (stars) {
  if (stars === "UNIQUE") return "#1abc9c";
  const colors = [
    "#ffffff",
    "#3498db",
    "#9b59b6",
    "#e67e22",
    "#f1c40f",
    "#e74c3c",
  ];
  return colors[stars] || "#fff";
};

window.getScrapYieldName = function (stars) {
  if (stars === "UNIQUE") return "Ancient Core";
  const scraps = [
    "Monster Soul",
    "Rare Scrap",
    "Magic Scrap",
    "Epic Scrap",
    "Legendary Scrap",
    "Mythic Scrap",
  ];
  return scraps[stars] || "Monster Soul";
};

// --- CORE STATS RESOLVER ---

window.resolvePlayerStats = function (useDraft = false) {
  let p = {
    atk: window.playerStats.baseAtk,
    maxHp: window.playerStats.baseMaxHp,
    def: window.playerStats.baseDef,
    moveSpeed: window.playerStats.baseMoveSpeed,
    idleAttackSpeed: window.playerStats.baseIdleSpeed,
    activeAttackSpeed: window.playerStats.baseActiveSpeed,
    drop: window.playerStats.baseDrop,
    qly: window.playerStats.baseQuality,
    gold: window.playerStats.baseGold,
    critChance: window.playerStats.baseCritChance,
    critDamage: window.playerStats.baseCritDamage,
    block: window.playerStats.baseBlock,
    parry: window.playerStats.baseParry,
    rareSpawn: window.playerStats.baseRareSpawn,
    str: window.playerStats.baseStr,
    dex: window.playerStats.baseDex,
    int: window.playerStats.baseInt,
    fairySpawn: window.playerStats.baseFairySpawn,
  };

  if (!window.playerStats.cachedAchievementBonusTotals) {
    window.recalculateAchievementTotals();
  }
  let aT = window.playerStats.cachedAchievementBonusTotals;

  p.atk += aT.atk;
  p.maxHp += aT.maxHp;
  p.def += aT.def;
  p.moveSpeed += aT.moveSpeed;
  p.critChance += aT.critChance;
  p.critDamage += aT.critDamage;
  p.block += aT.block;
  p.parry += aT.parry;
  p.drop += aT.drop;
  p.qly += aT.qly;
  p.gold += aT.gold;
  p.str += aT.str;
  p.dex += aT.dex;
  p.int += aT.int;
  p.fairySpawn += aT.fairySpawn;
  p.rareSpawn += aT.rareSpawn;

  let achAtkPct = 1.0 + aT.atkPct;
  let achMaxHpPct = 1.0 + aT.maxHpPct;
  let achDefPct = 1.0 + aT.defPct;
  let achMoveSpeedPct = 1.0 + aT.moveSpeedPct;
  let achStrPct = 1.0 + aT.strPct;
  let achDexPct = 1.0 + aT.dexPct;
  let achIntPct = 1.0 + aT.intPct;

  let alloc =
    useDraft && window.draftAllocations
      ? window.draftAllocations
      : window.playerStats.spAllocations;
  p.str += (alloc.spStr || 0) * 3;
  p.dex += (alloc.spDex || 0) * 3;
  p.int += (alloc.spInt || 0) * 3;

  p.maxHp += alloc.spHp * 50;
  p.atk += alloc.spAtk * 6;
  p.def += alloc.spDef * 5;
  p.critChance += alloc.spCrit * 0.005;
  p.critDamage += alloc.spCritDmg * 0.02;
  p.block += alloc.spBlock * 0.005;
  p.parry += alloc.spParry * 0.005;
  p.moveSpeed += alloc.spSpd * 1;

  let itemAtkPct = 0;
  let itemHpPct = 0;
  let itemDefPct = 0;
  let itemSpdPct = 0;
  let idleSpeedPct = 0.0 + (aT.idleSpeedPct || 0);
  let activeSpeedPct = 0.0 + (aT.activeSpeedPct || 0);

  for (let key in window.equippedSlots) {
    let item = window.equippedSlots[key];
    if (item) {
      p.atk += item.atk || 0;
      p.maxHp += item.maxHp || 0;
      p.moveSpeed += item.moveSpeed || 0;

      let itemIdleSpeed = item.idleAttackSpeed || 0;
      if (itemIdleSpeed < 0) itemIdleSpeed = Math.abs(itemIdleSpeed) * 0.05;
      idleSpeedPct += itemIdleSpeed;

      let itemActiveSpeed = item.activeAttackSpeed || 0;
      if (itemActiveSpeed < 0)
        itemActiveSpeed = Math.abs(itemActiveSpeed) * 0.05;
      activeSpeedPct += itemActiveSpeed;

      p.drop += item.dropRate || 0;
      p.qly += item.quality || 0;
      p.gold += item.goldMulti || 0;
      p.critChance += item.critChance || 0;
      p.critDamage += item.critDamage || 0;
      p.block += item.block || 0;
      p.parry += item.parry || 0;
      p.str += item.str || 0;
      p.dex += item.dex || 0;
      p.int += item.int || 0;
      p.rareSpawn += item.rareSpawn || 0;
      p.fairySpawn += item.fairySpawn || 0;

      if (item.atkPct) itemAtkPct += item.atkPct;
      if (item.maxHpPct) itemHpPct += item.maxHpPct;
      if (item.defPct) itemDefPct += item.defPct;
      if (item.moveSpeedPct) itemSpdPct += item.moveSpeedPct;
    }
  }

  if (
    window.checkArtifactTrait("golem_stance") &&
    window.playerStats.currentHp / p.maxHp >= 0.8
  )
    itemAtkPct += 0.2;

  let setCounts = {};
  const eligibleSetSlots = [
    "weapon",
    "subweapon",
    "helmet",
    "chest",
    "leggings",
    "overall",
    "boots",
  ];
  let overallAdoptedSet = null;
  if (window.equippedSlots.overall) {
    overallAdoptedSet =
      (window.equippedSlots.helmet &&
        window.getItemSetName(window.equippedSlots.helmet)) ||
      (window.equippedSlots.boots &&
        window.getItemSetName(window.equippedSlots.boots)) ||
      (window.equippedSlots.weapon &&
        window.getItemSetName(window.equippedSlots.weapon)) ||
      null;
  }
  eligibleSetSlots.forEach((slot) => {
    let item = window.equippedSlots[slot];
    if (item) {
      let setName = window.getItemSetName(item);
      if (slot === "overall" && overallAdoptedSet) setName = overallAdoptedSet;
      if (setName)
        setCounts[setName] =
          (setCounts[setName] || 0) + (slot === "overall" ? 2 : 1);
    }
  });

  let setCtx = {
    atk: 0,
    maxHp: 0,
    moveSpeed: 0,
    idleSpeedPct: 0,
    activeSpeedPct: 0,
    critChance: 0,
    critDamage: 0,
    block: 0,
    parry: 0,
    atkPctBonus: 0,
    maxHpPctBonus: 0,
    defPctBonus: 0,
    flatDefBonus: 0,
    str: 0,
    dex: 0,
    int: 0,
    gold: 0,
    drop: 0,
    qly: 0,
    rareSpawn: 0,
    hasCorrosiveSet: false,
    hasShatterSet: false,
    hasSingularitySet: false,
  };
  for (let setName in setCounts) {
    let count = setCounts[setName];
    let setDef = window.SET_DEFINITIONS[setName];
    if (setDef)
      setDef.bonuses.forEach((b) => {
        if (count >= b.count) b.apply(setCtx);
      });
  }

  p.atk += setCtx.atk;
  p.maxHp += setCtx.maxHp;
  p.moveSpeed += setCtx.moveSpeed;
  idleSpeedPct += setCtx.idleSpeedPct;
  activeSpeedPct += setCtx.activeSpeedPct;
  p.critChance += setCtx.critChance;
  p.critDamage += setCtx.critDamage;
  p.block += setCtx.block;
  p.parry += setCtx.parry;

  p.str += setCtx.str;
  p.dex += setCtx.dex;
  p.int += setCtx.int;
  p.gold += setCtx.gold;
  p.drop += setCtx.drop;
  p.qly += setCtx.qly;
  p.rareSpawn += setCtx.rareSpawn;
  p.hasCorrosiveSet = setCtx.hasCorrosiveSet;
  p.hasShatterSet = setCtx.hasShatterSet;
  p.hasSingularitySet = setCtx.hasSingularitySet;

  achAtkPct += setCtx.atkPctBonus;
  achMaxHpPct += setCtx.maxHpPctBonus;
  p.str = Math.floor(p.str * achStrPct);
  p.dex = Math.floor(p.dex * achDexPct);
  p.int = Math.floor(p.int * achIntPct);

  let effectiveStr = Math.max(0, p.str - 5);
  let effectiveDex = Math.max(0, p.dex - 5);
  let effectiveInt = Math.max(0, p.int - 5);

  itemAtkPct += effectiveStr * 0.003;
  itemHpPct += effectiveStr * 0.003;
  itemDefPct += Math.log10(effectiveInt + 1) * 0.15;
  p.critChance += parseFloat(
    ((effectiveDex * 0.3) / (effectiveDex + 250)).toFixed(4),
  );
  p.critDamage += effectiveDex * 0.003;
  p.moveSpeed += parseFloat(
    ((effectiveDex * 20) / (effectiveDex + 150)).toFixed(1),
  );
  p.block += parseFloat(
    ((effectiveInt * 0.12) / (effectiveInt + 150)).toFixed(4),
  );
  p.parry += parseFloat(
    ((effectiveInt * 0.12) / (effectiveInt + 150)).toFixed(4),
  );
  p.fairySpawn += parseFloat((effectiveInt * 0.001).toFixed(4));

  let flatDef =
    window.playerStats.baseDef + alloc.spDef * 4 + aT.def + setCtx.flatDefBonus;
  let defMultiplier = 1.0 + setCtx.defPctBonus;

  for (let key in window.equippedSlots) {
    let item = window.equippedSlots[key];
    if (item) {
      flatDef += item.def || 0;
      if (["chest", "leggings", "overall", "helmet"].includes(item.type)) {
        let stars = item.statsRolled === "UNIQUE" ? 5 : item.statsRolled || 0;
        defMultiplier += stars * 0.03 + item.temperLevel * 0.01;
      }
    }
  }

  const hasSubweapon = !!window.equippedSlots.subweapon;
  const subType = window.equippedSlots.subweapon
    ? window.equippedSlots.subweapon.subType
    : null;
  let maxBlockCap = 0.0;
  let maxParryCap = window.checkArtifactTrait("titan_grip") ? 0.18 : 0.15;

  if (hasSubweapon) {
    if (subType === "shield") {
      let shield = window.equippedSlots.subweapon;
      let shieldStars =
        shield.statsRolled === "UNIQUE" ? 5 : shield.statsRolled || 0;
      defMultiplier += 0.12 + shieldStars * 0.02 + shield.temperLevel * 0.01;
      maxBlockCap = window.checkArtifactTrait("titan_grip") ? 0.25 : 0.2;
    } else if (subType === "tome") {
      let intScale = Math.max(0, p.int - 5);
      p.arcaneBarrier = parseFloat(
        Math.min(0.35, 0.2 + (intScale * 0.15) / (intScale + 150)).toFixed(4),
      );
      p.block = 0.0;
    } else if (subType === "dagger") {
      maxParryCap = window.checkArtifactTrait("titan_grip") ? 0.3 : 0.25;
      p.block = 0.0;
    }
  } else {
    p.block = 0.0;
  }

  p.atk = Math.floor(p.atk * (achAtkPct + itemAtkPct));
  p.maxHp = Math.floor(p.maxHp * (achMaxHpPct + itemHpPct));
  p.def = Math.ceil(flatDef * (defMultiplier + itemDefPct) * achDefPct);
  p.moveSpeed = p.moveSpeed * (achMoveSpeedPct + itemSpdPct);

  let potStrengthMultiplier = 1.0;
  if (window.playerStats.unlockedAchievements && window.AchievementsData) {
    window.playerStats.unlockedAchievements.forEach((id) => {
      let ach = window.AchievementsData.find((a) => a.id === id);
      if (ach && ach.stats && ach.stats.potStrengthPct)
        potStrengthMultiplier += ach.stats.potStrengthPct;
    });
  }
  if (window.checkArtifactTrait("alchemist_alembic"))
    potStrengthMultiplier += 0.3;

  if (window.playerStats.atkPotionTimer > 0)
    p.atk = Math.ceil(
      p.atk *
        (1 +
          (window.playerStats.atkPotionStrength || 0.1) *
            potStrengthMultiplier),
    );
  if (window.playerStats.hpPotionTimer > 0)
    p.maxHp = Math.ceil(
      p.maxHp *
        (1 +
          (window.playerStats.hpPotionStrength || 0.1) * potStrengthMultiplier),
    );
  if (window.playerStats.defPotionTimer > 0)
    p.def = Math.ceil(
      p.def *
        (1 +
          (window.playerStats.defPotionStrength || 0.1) *
            potStrengthMultiplier),
    );

  if (window.playerStats.hastePotionTimer > 0) {
    let tier = window.playerStats.hastePotionStrength || 1;
    p.moveSpeed += Math.ceil(3 * tier * potStrengthMultiplier);
    activeSpeedPct += 0.1 * tier * potStrengthMultiplier;
    idleSpeedPct += 0.1 * tier * potStrengthMultiplier;
  }

  // Additive Double Drop and Drop Quality checks
  if (window.playerStats.dropPotionTimer > 0) {
    p.drop += 1.0 * potStrengthMultiplier;
  }
  if (window.playerStats.qlyPotionTimer > 0) {
    p.qly += 0.5 * potStrengthMultiplier;
  }

  if (window.checkArtifactTrait("move_speed")) p.moveSpeed += 10;
  if (window.checkArtifactTrait("gold_hoard")) p.gold += 0.5;
  if (window.checkArtifactTrait("idle_spd")) idleSpeedPct += 0.35;
  if (window.checkArtifactTrait("active_spd")) activeSpeedPct += 0.25;

  if (
    window.equippedSlots.subweapon &&
    window.equippedSlots.subweapon.isUniqueWatch &&
    window.playerStats.watchActiveTimer > 0
  ) {
    idleSpeedPct += 0.15;
    activeSpeedPct += 0.15;
  }
  if (
    window.checkArtifactTrait("cauldron_eternity") &&
    (window.playerStats.atkPotionTimer > 0 ||
      window.playerStats.hpPotionTimer > 0 ||
      window.playerStats.defPotionTimer > 0 ||
      window.playerStats.hastePotionTimer > 0)
  ) {
    idleSpeedPct += 0.08;
  }

  let finalIdleDivisor = Math.max(0.1, 1 + idleSpeedPct);
  let finalActiveDivisor = Math.max(0.1, 1 + activeSpeedPct);
  p.idleAttackSpeed = Math.max(10, Math.round(60 / finalIdleDivisor));
  p.activeAttackSpeed = Math.max(4, Math.round(15 / finalActiveDivisor));

  if (window.playerStats.frenzyTimer > 0) {
    p.critChance = 1.0;
    p.critDamage += 0.5;
    p.activeAttackSpeed = 4;
    p.idleAttackSpeed = 15;
  }

  p.rawBlock = p.block;
  p.rawParry = p.parry;

  if (p.block > maxBlockCap) p.block = maxBlockCap;
  if (p.parry > maxParryCap) p.parry = maxParryCap;

  p.atk = Math.floor(p.atk);
  p.maxHp = Math.floor(p.maxHp);
  p.def = Math.floor(p.def);
  p.moveSpeed = parseFloat(p.moveSpeed.toFixed(1));

  if (
    window.equippedSlots.boots &&
    window.equippedSlots.boots.isUniqueWarpCore &&
    !window.playerStats.isDungeonMode &&
    !window.playerStats.isCrucibleMode
  ) {
    let limit = Math.floor((window.playerStats.lifetimePeakStage || 1) * 0.85);
    if (window.playerStats.stage < limit) {
      p.moveSpeed = parseFloat((p.moveSpeed * 2.5).toFixed(1));
      window.playerStats.targetsRequired = 3;
    } else {
      window.playerStats.targetsRequired = 5;
    }
  } else {
    window.playerStats.targetsRequired = 5;
  }

  if (
    window.equippedSlots.subweapon &&
    window.equippedSlots.subweapon.isUniqueChronicle &&
    !window.playerStats.isDungeonMode &&
    !window.playerStats.isCrucibleMode
  ) {
    window.playerStats.bypassGearLockActive = true;
  } else {
    window.playerStats.bypassGearLockActive = false;
  }

  let prestigeGoldBonus =
    (window.playerStats.prestigeUpgrades?.gold || 0) * 0.25;
  p.gold += prestigeGoldBonus;
  let prestigeDropBonus =
    (window.playerStats.prestigeUpgrades?.drop || 0) * 0.05;
  p.drop += prestigeDropBonus;
  let prestigeFairyBonus =
    (window.playerStats.prestigeUpgrades?.fairy || 0) * 0.05;
  p.fairySpawn += prestigeFairyBonus;

  // Apply permanent Mission Shop Upgrades
  let missionGoldBonus = (window.playerStats.missionUpgrades?.gold || 0) * 0.05;
  p.gold += missionGoldBonus;

  if (window.playerStats.dropPotionTimer > 0) {
    p.drop += window.playerStats.dropPotionStrength || 1.0;
  }
  if (window.playerStats.qlyPotionTimer > 0) {
    p.qly += window.playerStats.qlyPotionStrength || 0.5;
  }

  let activeStage = window.playerStats.stage;
  if (window.playerStats.isDungeonMode && window.playerStats.currentDungeon) {
    activeStage =
      window.playerStats.currentDungeonStage[
        window.playerStats.currentDungeon
      ] || 1;
  } else if (window.playerStats.isUberBoss) {
    let riftLvl = window.playerStats.activeRiftLevel || 1;
    activeStage = 50 + riftLvl * 10;
  }
  let stageScale = Math.floor((activeStage - 1) / 10) + 1;

  let prestigeAtkMult = Math.pow(
    1.12,
    window.playerStats.prestigeUpgrades?.atk || 0,
  );
  p.atk = Math.floor(p.atk * prestigeAtkMult);
  let prestigeHpMult = Math.pow(
    1.1,
    window.playerStats.prestigeUpgrades?.fort || 0,
  );
  let prestigeDefMult = Math.pow(
    1.05,
    window.playerStats.prestigeUpgrades?.fort || 0,
  );

  // Apply Mission Shop Attack and Health multipliers
  let missionAtkMult =
    1.0 + (window.playerStats.missionUpgrades?.atk || 0) * 0.02;
  p.atk = Math.floor(p.atk * missionAtkMult);
  let missionHpMult =
    1.0 + (window.playerStats.missionUpgrades?.hp || 0) * 0.03;
  p.maxHp = Math.floor(p.maxHp * prestigeHpMult * missionHpMult);
  p.def = Math.floor(p.def * prestigeDefMult);

  if (
    isNaN(p.idleAttackSpeed) ||
    p.idleAttackSpeed <= 0 ||
    !isFinite(p.idleAttackSpeed)
  )
    p.idleAttackSpeed = 60;
  if (
    isNaN(p.activeAttackSpeed) ||
    p.activeAttackSpeed <= 0 ||
    !isFinite(p.activeAttackSpeed)
  )
    p.activeAttackSpeed = 15;

  return p;
};

// --- INITIAL GLOBAL STATE ---

window.playerStats = {
  level: 1,
  xp: 0,
  xpReq: 250,
  sp: 0,
  spAllocations: {
    spHp: 0,
    spAtk: 0,
    spDef: 0,
    spCrit: 0,
    spCritDmg: 0,
    spBlock: 0,
    spParry: 0,
    spSpd: 0,
    spStr: 0,
    spDex: 0,
    spInt: 0,
  },
  vendingQLevel: 0,
  shopQLevel: 0,
  globalQLevel: 0,
  missionTokens: 0,
  missionUpgrades: { gold: 0, atk: 0, hp: 0 },
  vendingPity: 0,
  stickyCanvas: true,
  baseStr: 5,
  baseDex: 5,
  baseInt: 5,
  baseAtk: 10,
  baseMaxHp: 100,
  baseDef: 0,
  baseMoveSpeed: 10,
  baseIdleSpeed: 60,
  baseActiveSpeed: 15,
  baseDrop: 1.0,
  baseQuality: 1.0,
  baseGold: 1.0,
  baseCritChance: 0.05,
  baseCritDamage: 1.5,
  baseBlock: 0.0,
  baseParry: 0.0,
  baseRareSpawn: 0.01,
  baseFairySpawn: 1.0,
  currentHp: 100,
  coins: 0,
  stage: 1,
  maxStage: 1,
  killCount: 0,
  totalLifetimeKills: 0,
  targetsRequired: 5,
  isBossMode: false,
  isFarmingLoop: false,
  isUberBoss: false,
  currentUberBoss: "guardian",
  frenzyTimer: 0,
  frenzyKillCount: 0,
  adrenalineTimer: 0,
  usedSecondWind: false,
  isDungeonMode: false,
  currentDungeon: null,
  dungeonWave: 1,
  equipKeys: 3,
  goldKeys: 3,
  matKeys: 3,
  nextEquipKeyTime: 0,
  nextGoldKeyTime: 0,
  nextMatKeyTime: 0,
  shopRefreshTime: 0,
  shopItems: [],
  atkPotionTimer: 0,
  atkPotionStrength: 0.1,
  hpPotionTimer: 0,
  hpPotionStrength: 0.1,
  defPotionTimer: 0,
  defPotionStrength: 0.1,
  hastePotionTimer: 0,
  hastePotionStrength: 1,
  xpPotionTimer: 0,
  xpPotionStrength: 1.0,
  dropPotionTimer: 0,
  dropPotionStrength: 1.0,
  qlyPotionTimer: 0,
  qlyPotionStrength: 0.5,
  autoSalvageThreshold: -1,
  volumeMaster: 0.5,
  volumeSFX: 0.8,
  mute: false,
  fairiesClicked: 0,
  deathCount: 0,
  dungeonPeaks: { equip: 1, gold: 1, mat: 1 },
  currentDungeonStage: { equip: 1, gold: 1, mat: 1 },
  astralShards: 0,
  crucibleWave: 1,
  cruciblePeak: 1,
  crucibleStartWave: 1,
  isCrucibleMode: false,
  crucibleKills: 0,
  runKills: 0,
  runGold: 0,
  runXp: 0,
  killedBy: "Unknown Foe",
  killedByMob: null,
  prestigePoints: 0,
  prestigeUpgrades: {
    bag: 0,
    gold: 0,
    exp: 0,
    drop: 0,
    atk: 0,
    fort: 0,
    fairy: 0,
  },
  prestigeCount: 0,
  lifetimePeakStage: 1,
  isPrestigeBossMode: false,
  prestigeApproachTimer: 0,
  highestRiftLevel: 0,
  activeRift: null,
  activeRiftLevel: 1,
  peakSingleHit: 0,
  maxFairyClicksInWindow: 0,
  totalDeflections: 0,
  peakSimultaneousBuffs: 0,
  totalReforges: 0,
  peakSingleGoldDrop: 0,
  rareSpawnsSlain: 0,
  maxCanvasClicksInWindow: 0,
  sessionPlaytime: 0,
  activityTimer: 0,
  fairyClicksWindow: [],
  canvasClicksWindow: [],
  recentHeals: [], // Track siphoned heals in a sliding 1,000ms window

  // Achievement Checkpoint Flags
  hasTriggeredMurphysLaw: false,
  hasTriggeredAgainstOdds: false,
  hasTriggeredLuckySeven: false,
  hasTriggeredBackFromBrink: false,
  hasTriggeredElementalConvergence: false,
  hasTriggeredLookMaNoHands: false,
  hasTriggeredOverkill: false,
  hasTriggeredSpeedrun: false,
  hasTriggeredExactChange: false,
  hasTriggeredUnfortunateSoul: false,
  hasTriggeredAlchemicalSynthesis: false,
  hasTriggeredPatientShepherd: false,
  hasTriggeredBareFists: false,
  hasTriggeredPerfectDeflection: false,
  hasTriggeredWitchingHour: false,
  hasTriggeredHighNoon: false,
  hasTriggeredTimeCapsule: false,
  hasTriggeredAethericRecharge: false,
  hasClickedThisBattle: false,
  damageTakenThisBattle: 0,
  ankhTriggeredThisBattle: false,
  dailyMissions: [],
  weeklyMissions: [],
  dailyRerollsDone: 0, // Reset daily at 12:00 AM PST/PDT
  lastDailyResetTime: 0,
  lastWeeklyResetTime: 0,
  dailyRewardClaimed: false,
  weeklyRewardClaimed: false,
  unviewedAchievements: [],
};

// --- PROCEDURAL MISSION & QUEST SYSTEM ---

window.generateDailyMissions = function () {
  let pool = [
    {
      type: "kills",
      label: "Slay monsters",
      targetBase: 300,
      unit: "monsters",
    },
    { type: "rares", label: "Slay rare spawns", targetBase: 5, unit: "rares" },
    {
      type: "gold",
      label: "Collect Gold",
      targetBase: 2500,
      stageScale: true,
      unit: "Gold",
    },
    {
      type: "fairies",
      label: "Catch wild fairies",
      targetBase: 8,
      unit: "fairies",
    },
    {
      type: "tempers",
      label: "Successfully temper gear",
      targetBase: 1,
      unit: "tempers",
    },
    {
      type: "reforges",
      label: "Reforge gear modifiers",
      targetBase: 2,
      unit: "reforges",
    },
    {
      type: "dungeons",
      label: "Clear Dungeon floors",
      targetBase: 5,
      unit: "floors",
    },
    {
      type: "salvage",
      label: "Salvage gear items",
      targetBase: 15,
      unit: "items",
    },
    {
      type: "elixirs",
      label: "Consume active elixirs",
      targetBase: 3,
      unit: "elixirs",
    },
    {
      type: "active_clicks",
      label: "Manually click canvas",
      targetBase: 250,
      unit: "clicks",
    },
  ];

  pool.sort(() => Math.random() - 0.5);
  let selected = pool.slice(0, 6);

  let stage = window.playerStats.stage || 1;
  window.playerStats.dailyMissions = selected.map((m, idx) => {
    let target = m.targetBase;
    if (m.stageScale) {
      target = Math.ceil(m.targetBase * Math.pow(1.045, stage));
    }
    return {
      id: `daily_${idx + 1}`,
      type: m.type,
      desc: `${m.label} (${target.toLocaleString()} ${m.unit})`,
      current: 0,
      target: target,
      treat: "Guild Reward Sack",
      treatQty: 1,
      completed: false,
      claimed: false,
    };
  });
};

window.generateWeeklyMissions = function () {
  let pool = [
    {
      type: "rifts",
      label: "Slay Rift Guardians",
      targetBase: 3,
      unit: "guardians",
    },
    {
      type: "dungeons",
      label: "Ascend Dungeon floors",
      targetBase: 15,
      unit: "floors",
    },
    {
      type: "gold",
      label: "Amass extreme wealth",
      targetBase: 15000,
      stageScale: true,
      unit: "Gold",
    },
    {
      type: "kills",
      label: "Execute massive purges",
      targetBase: 1500,
      unit: "enemies",
    },
    {
      type: "tempers",
      label: "Master blacksmithing",
      targetBase: 15,
      unit: "tempers",
    },
  ];

  pool.sort(() => Math.random() - 0.5);
  let selected = pool.slice(0, 3);

  let peakStage =
    window.playerStats.lifetimePeakStage || window.playerStats.stage || 1;
  window.playerStats.weeklyMissions = selected.map((m, idx) => {
    let target = m.targetBase;
    if (m.stageScale) {
      target = Math.ceil(m.targetBase * Math.pow(1.045, peakStage));
    }
    return {
      id: `weekly_${idx + 1}`,
      type: m.type,
      desc: `${m.label} (${target.toLocaleString()} ${m.unit})`,
      current: 0,
      target: target,
      treat: "Guild Weekly Sack",
      treatQty: 1,
      completed: false,
      claimed: false,
    };
  });
};

window.checkAndResetMissions = function () {
  let now = Date.now();

  // Fully Timezone-Aware PST/PDT Date Resolution
  let ptString = new Date(now).toLocaleString("en-US", {
    timeZone: "America/Los_Angeles",
  });
  let ptDate = new Date(ptString);
  let currentDayStr = ptDate.toLocaleDateString("en-US"); // e.g. "6/25/2026"

  // Check Daily reset against absolute Pacific date string
  if (
    !window.playerStats.lastDailyResetDayStr ||
    window.playerStats.lastDailyResetDayStr !== currentDayStr
  ) {
    window.generateDailyMissions();
    window.playerStats.lastDailyResetDayStr = currentDayStr;
    window.playerStats.lastDailyResetTime = now;
    window.playerStats.dailyRewardClaimed = false;
    window.playerStats.dailyRerollsDone = 0; // Reset active re-roll tracker daily
    if (typeof window.pushLog === "function")
      window.pushLog(
        "<span style='color:#2ecc71; font-weight:bold;'>📅 [SYSTEM] Daily Board refreshed! Reset at 12:00 AM PST/PDT. Complete at least 5 for a grand treat!</span>",
      );
  }

  // Check Weekly reset (Monday 12:00 AM PST/PDT)
  let dayOfWeek = ptDate.getDay(); // 0 is Sunday, 1 is Monday...
  let daysSinceMonday = (dayOfWeek + 6) % 7; // Days elapsed since last Monday
  let lastMondayDate = new Date(ptDate);
  lastMondayDate.setDate(ptDate.getDate() - daysSinceMonday);
  let lastMondayStr = lastMondayDate.toLocaleDateString("en-US");

  if (window.playerStats.prestigeCount > 0) {
    if (
      !window.playerStats.lastWeeklyResetMondayStr ||
      window.playerStats.lastWeeklyResetMondayStr !== lastMondayStr
    ) {
      window.generateWeeklyMissions();
      window.playerStats.lastWeeklyResetMondayStr = lastMondayStr;
      window.playerStats.lastWeeklyResetTime = now;
      window.playerStats.weeklyRewardClaimed = false;
      if (typeof window.pushLog === "function")
        window.pushLog(
          "<span style='color:#9b59b6; font-weight:bold;'>📅 [SYSTEM] Weekly Board refreshed! Reset Monday at 12:00 AM PST/PDT. Slay Rift targets and complete objectives.</span>",
        );
    }
  } else {
    window.playerStats.weeklyMissions = [];
  }
};

window.progressMission = function (type, amount) {
  if (window.isGamePaused) return;
  let updated = false;

  if (window.playerStats.dailyMissions) {
    window.playerStats.dailyMissions.forEach((m) => {
      if (m.type === type && !m.completed) {
        m.current = Math.min(m.target, m.current + amount);
        if (m.current >= m.target) {
          m.completed = true;
          if (typeof window.pushHeaderToast === "function") {
            window.pushHeaderToast(`📅 Daily Done: ${m.desc}!`, "#2ecc71");
          }
        }
        updated = true;
      }
    });
  }

  if (
    window.playerStats.prestigeCount > 0 &&
    window.playerStats.weeklyMissions
  ) {
    window.playerStats.weeklyMissions.forEach((m) => {
      if (m.type === type && !m.completed) {
        m.current = Math.min(m.target, m.current + amount);
        if (m.current >= m.target) {
          m.completed = true;
          if (typeof window.pushHeaderToast === "function") {
            window.pushHeaderToast(`📆 Weekly Done: ${m.desc}!`, "#9b59b6");
          }
        }
        updated = true;
      }
    });
  }

  if (updated) {
    if (typeof window.updateUI === "function") window.updateUI();
  }
};

window.equippedSlots = {
  weapon: null,
  subweapon: null,
  helmet: null,
  chest: null,
  leggings: null,
  overall: null,
  boots: null,
  art1: null,
  art2: null,
  art3: null,
};
window.inventory = { EQUIP: [], ARTIFACT: [], ETC: {}, USE: {} };
window.logsHistory = [];
window.frozenItemDb = {};
window.idCounter = 0;
window.hero = {
  x: 40,
  y: 205,
  w: 25,
  h: 35,
  attackTimer: 0,
  slashFrame: false,
};
window.mob = null;
window.effects = [];
window.particles = [];
window.beams = [];
window.snowflakes = [];
window.bgScenery = [];
window.fgScenery = [];
window.activeFairies = [];
window.damageHistory = [];
window.projectiles = [];
window.groundScroll = 0;
window.logicClock = 0;
window.spacePressed = false;
window.state = { autoAttack: true, efficiency: 1.0, currentSubTab: "EQUIP" };
window.isGamePaused = false;
window.reviveTimer = 0;
window.deathAnimationTimer = 0;
window.deathMaxFrames = 90;
window.lastUpdateTime = Date.now();
window.sessionStartTime = Date.now();
window.respawnIntervalId = null;
