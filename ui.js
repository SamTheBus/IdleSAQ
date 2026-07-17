/* ==========================================================================
   PRIMARY PURPOSE: Manages all UI interactions, DOM updates, menus,
   tooltips, and modal displays.
   ========================================================================= */

// Global Touch-Tracking Event Listener to prevent mouse-hover simulation double-triggers
window.state = window.state || {};
window.state.lastTouchTime = 0;
document.addEventListener(
  "touchstart",
  () => {
    window.state.lastTouchTime = Date.now();
  },
  { passive: true },
);

// High-performance, Garbage Collection-free particle pool
class PoolParticle {
  constructor() {
    this.x = 0;
    this.y = 0;
    this.vx = 0;
    this.vy = 0;
    this.radius = 0;
    this.color = "";
    this.alpha = 1;
    this.life = 0;
    this.maxLife = 0;
    this.gravity = undefined;
    this.fade = false;
    this.growth = undefined;
  }
  init(
    x,
    y,
    vx,
    vy,
    radius,
    color,
    alpha,
    life,
    maxLife = 0,
    gravity = undefined,
    fade = false,
    growth = undefined,
  ) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.radius = radius;
    this.color = color;
    this.alpha = alpha;
    this.life = life;
    this.maxLife = maxLife;
    this.gravity = gravity;
    this.fade = fade;
    this.growth = growth;
  }
}

class ParticlePoolClass {
  constructor(initialSize = 500) {
    this.pool = [];
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(new PoolParticle());
    }
  }
  get(
    x,
    y,
    vx,
    vy,
    radius,
    color,
    alpha,
    life,
    maxLife = 0,
    gravity = undefined,
    fade = false,
    growth = undefined,
  ) {
    let p = null;
    for (let i = 0; i < this.pool.length; i++) {
      if (this.pool[i].life <= 0) {
        p = this.pool[i];
        break;
      }
    }
    if (!p) {
      if (this.pool.length < 2000) {
        p = new PoolParticle();
        this.pool.push(p);
      } else {
        let lowestLife = Infinity;
        let lowestIdx = 0;
        for (let i = 0; i < this.pool.length; i++) {
          if (this.pool[i].life < lowestLife) {
            lowestLife = this.pool[i].life;
            lowestIdx = i;
          }
        }
        p = this.pool[lowestIdx];
        p.life = 0;
      }
    }
    p.init(
      x,
      y,
      vx,
      vy,
      radius,
      color,
      alpha,
      life,
      maxLife,
      gravity,
      fade,
      growth,
    );
    return p;
  }
}

class PoolCombatEffect {
  constructor() {
    this.type = undefined;
    this.x = 0;
    this.y = 0;
    this.vx = 0;
    this.vy = 0;
    this.amount = 0;
    this.color = "";
    this.life = 0;
    this.maxLife = 0;
    this.text = "";
    this.isCumulative = false;
    this.iconColor = "";
    this.itemType = "";
  }
  init(
    type,
    x,
    y,
    vx,
    vy,
    amount,
    color,
    life,
    maxLife = 0,
    text = "",
    isCumulative = false,
    iconColor = "",
    itemType = "",
  ) {
    this.type = type;
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.amount = amount;
    this.color = color;
    this.life = life;
    this.maxLife = maxLife;
    this.text = text;
    this.isCumulative = isCumulative;
    this.iconColor = iconColor;
    this.itemType = itemType;
  }
}

class CombatEffectPoolClass {
  constructor(initialSize = 150) {
    this.pool = [];
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(new PoolCombatEffect());
    }
  }
  get(
    type,
    x,
    y,
    vx,
    vy,
    amount,
    color,
    life,
    maxLife = 0,
    text = "",
    isCumulative = false,
    iconColor = "",
    itemType = "",
  ) {
    let f = null;
    for (let i = 0; i < this.pool.length; i++) {
      if (this.pool[i].life <= 0) {
        f = this.pool[i];
        break;
      }
    }
    if (!f) {
      if (this.pool.length < 500) {
        f = new PoolCombatEffect();
        this.pool.push(f);
      } else {
        let lowestLife = Infinity;
        let lowestIdx = 0;
        for (let i = 0; i < this.pool.length; i++) {
          if (this.pool[i].life < lowestLife) {
            lowestLife = this.pool[i].life;
            lowestIdx = i;
          }
        }
        f = this.pool[lowestIdx];
        f.life = 0;
      }
    }
    f.init(
      type,
      x,
      y,
      vx,
      vy,
      amount,
      color,
      life,
      maxLife,
      text,
      isCumulative,
      iconColor,
      itemType,
    );
    return f;
  }
}

window.CombatEffectPool = new CombatEffectPoolClass(150);

window.ParticlePool = new ParticlePoolClass(500);

// Validates whether an incoming hover event is a simulated mobile ghost-trigger
window.isSimulatedMouseEvent = function (e) {
  if (e && (e.type === "mouseenter" || e.type === "mouseover")) {
    let lastTouch = window.state.lastTouchTime || 0;
    if (Date.now() - lastTouch < 500) {
      return true; // Discard simulated hover triggers on touchscreens
    }
  }
  return false;
};

window.getEquipIconHtml = function (item, size = 32) {
  if (!item) return "";
  let isUnique =
    item.isUniqueStaff ||
    item.isUniqueSword ||
    item.isUniqueSingularity ||
    item.isUniqueMaelstrom ||
    item.isUniqueAegis ||
    item.isUniqueWatch ||
    item.isUniqueChronicle ||
    item.isUniqueWarpCore ||
    item.isUniqueTempest;

  if (item.type === "artifact" || item.statsRolled === "UNIQUE") {
    return window.getArtifactIconHtml(item.trait, size);
  }
  if (isUnique) {
    return window.getUniqueIconHtml(item, size);
  }

  let color = window.getTierColor(item.statsRolled);
  let id =
    (item.id || Math.floor(Math.random() * 100000)) +
    "_" +
    Math.floor(Math.random() * 1000000);
  let innerHtml = "";

  let type = item.type;
  if (type === "subweapon") {
    type = item.subType || "shield";
  }

  // Normalize item noun for precise lookup (e.g., "Full Plate Armor" -> "full_plate_armor")
  let nounKey = item.noun ? item.noun.toLowerCase().replace(/\s+/g, "_") : "";

  if (window.AssetCatalog.genericEquipment[nounKey]) {
    innerHtml = window.AssetCatalog.genericEquipment[nounKey](id, color);
  } else if (window.AssetCatalog.genericEquipment[type]) {
    innerHtml = window.AssetCatalog.genericEquipment[type](id, color);
  } else {
    innerHtml = `<circle cx="16" cy="16" r="10" fill="${color}" stroke="#000000" stroke-width="1.5"/>`;
  }

  return window.AssetCatalog.compile("0 0 32 32", innerHtml, size);
};

window.getBossIconHtml = function (bossType) {
  let uid = Math.floor(Math.random() * 10000000);
  let innerHtml = "";
  if (window.AssetCatalog.bosses[bossType]) {
    innerHtml = window.AssetCatalog.bosses[bossType](uid);
  } else {
    return "🔮";
  }
  return `
    <svg width="56" height="56" viewBox="0 0 64 64" style="display:block; margin: 0 auto; filter: drop-shadow(0 0 6px rgba(52, 152, 219, 0.45));">
        ${innerHtml}
    </svg>
  `;
};

window.getEtcIconHtml = function (key, size = 32) {
  let uid = Math.floor(Math.random() * 10000000);
  let bg = "rgba(170, 170, 170, 0.12)";
  let border = "#444";
  let innerHtml = "";

  if (key === "Eridium Shard") {
    bg = "rgba(155, 89, 182, 0.25)";
    border = "#9b59b6";
  } else if (key === "Glimmering Gachapon Key") {
    bg = "rgba(0, 210, 255, 0.18)";
    border = "#00d2ff";
  } else if (key === "Gacha Key") {
    bg = "rgba(241, 196, 15, 0.25)";
    border = "#f1c40f";
  } else if (key === "Ancient Core") {
    bg = "rgba(231, 76, 60, 0.25)";
    border = "#e74c3c";
  } else if (key === "Overlord's Sigil") {
    bg = "rgba(26, 188, 156, 0.25)";
    border = "#1abc9c";
  } else if (key === "Astral Essence") {
    bg = "rgba(142, 68, 173, 0.25)";
    border = "#8e44ad";
  } else if (key === "Luminous Soul") {
    bg = "rgba(255, 182, 193, 0.25)";
    border = "#ffb6c1";
  } else if (key === "Monster Soul") {
    bg = "rgba(170, 170, 170, 0.25)";
    border = "#888";
  } else if (key === "Catalyst Core") {
    bg = "rgba(46, 204, 113, 0.25)";
    border = "#2ecc71";
  } else if (key.includes("Scrap")) {
    let stop1 = "#bdc3c7",
      stop2 = "#7f8c8d";
    if (key === "Mythic Scrap") {
      bg = "rgba(231, 76, 60, 0.25)";
      border = "#e74c3c";
      stop1 = "#ff7675";
      stop2 = "#d63031";
    } else if (key === "Legendary Scrap") {
      bg = "rgba(241, 196, 15, 0.25)";
      border = "#f1c40f";
      stop1 = "#ffeaa7";
      stop2 = "#fdcb6e";
    } else if (key === "Epic Scrap") {
      bg = "rgba(230, 126, 34, 0.25)";
      border = "#e67e22";
      stop1 = "#ffbe76";
      stop2 = "#e67e22";
    } else if (key === "Magic Scrap") {
      bg = "rgba(155, 89, 182, 0.25)";
      border = "#9b59b6";
      stop1 = "#a29bfe";
      stop2 = "#6c5ce7";
    } else if (key === "Rare Scrap") {
      bg = "rgba(52, 152, 219, 0.25)";
      border = "#3498db";
      stop1 = "#74b9ff";
      stop2 = "#0984e3";
    }
    innerHtml = window.AssetCatalog.materials.Scrap(uid, stop1, stop2);
  }

  if (!innerHtml && window.AssetCatalog.materials[key]) {
    innerHtml = window.AssetCatalog.materials[key](uid);
  } else if (!innerHtml) {
    innerHtml = `
      <rect x="6" y="8" width="20" height="18" rx="2" fill="#7f8c8d" stroke="#000" stroke-width="2"/>
      <path d="M6 14 L26 14" stroke="#000" stroke-width="2"/>
      <rect x="13" y="10" width="6" height="8" fill="#d5dbdb" stroke="#000" stroke-width="1.5" />
    `;
  }

  return window.AssetCatalog.compile("0 0 32 32", innerHtml, size, bg, border);
};

window.getUseIconHtml = function (key, size = 32) {
  let uid = Math.floor(Math.random() * 10000000);
  let bg = "rgba(170, 170, 170, 0.12)";
  let border = "#444";
  let innerHtml = "";

  // Set 64x64 grid coordinates dynamically for upscaled vector items
  let isHighFidelity =
    key.includes("Sack") || key.includes("Crate") || key.includes("Sigil");
  let viewBox = isHighFidelity ? "0 0 64 64" : "0 0 32 32";

  // 1. Handle special unique assets
  if (key === "SP Reset Scroll") {
    bg = "rgba(155, 89, 182, 0.25)";
    border = "#9b59b6";
    innerHtml = window.AssetCatalog.consumables.scroll(uid, "#9b59b6");
  } else if (key === "PP Reset Scroll") {
    bg = "rgba(230, 126, 34, 0.25)";
    border = "#e67e22";
    innerHtml = window.AssetCatalog.consumables.scroll(uid, "#e67e22");
  } else if (key === "Cavern Sigil Sack") {
    bg = "rgba(155, 89, 182, 0.25)";
    border = "#9b59b6";
    innerHtml = window.AssetCatalog.consumables.cavern_sigil_sack(uid);
  } else if (key.includes("Sack")) {
    bg = key.includes("Weekly")
      ? "rgba(155, 89, 182, 0.25)"
      : "rgba(241, 196, 15, 0.25)";
    border = key.includes("Weekly") ? "#9b59b6" : "#f1c40f";
    let stopCol = key.includes("Weekly") ? "#4a154b" : "#d35400";
    innerHtml = window.AssetCatalog.consumables.sack(uid, stopCol);
  } else if (key === "Weekly Clan Supply Crate") {
    bg = "rgba(255, 170, 0, 0.25)";
    border = "#ffaa00";
    innerHtml = window.AssetCatalog.consumables.crate(uid);
  } else if (key.includes("Elixir")) {
    // 2. Map standard elixirs to the potion template
    let pColor = key.includes("Attack")
      ? "#2ecc71"
      : key.includes("Vitality")
        ? "#e74c3c"
        : key.includes("Armored")
          ? "#3498db"
          : "#f1c40f";
    bg = window.hexToRgba
      ? window.hexToRgba(pColor, 0.25)
      : "rgba(170, 170, 170, 0.25)";
    border = pColor;
    innerHtml = window.AssetCatalog.consumables.potion(uid, pColor);
  } else if (key.includes("Vitality")) {
    bg = "rgba(231, 76, 60, 0.25)";
    border = "#e74c3c";
    innerHtml = window.AssetCatalog.consumables.potion(uid, "#e74c3c");
  } else if (key.includes("Armored")) {
    bg = "rgba(52, 152, 219, 0.25)";
    border = "#3498db";
    innerHtml = window.AssetCatalog.consumables.potion(uid, "#3498db");
  } else if (key.includes("Haste")) {
    bg = "rgba(241, 196, 15, 0.25)";
    border = "#f1c40f";
    innerHtml = window.AssetCatalog.consumables.potion(uid, "#f1c40f");
  } else if (key.includes("XP") || key.includes("Double XP")) {
    bg = "rgba(168, 85, 247, 0.25)";
    border = "#a855f7";
    innerHtml = window.AssetCatalog.consumables.potion(uid, "#a855f7");
  } else if (
    key.includes("Drop Rate") ||
    key.includes("Double Drop") ||
    key.includes("Drop Elixir")
  ) {
    bg = "rgba(34, 197, 94, 0.25)";
    border = "#22c55e";
    innerHtml = window.AssetCatalog.consumables.potion(uid, "#22c55e");
  } else if (key.includes("Quality")) {
    bg = "rgba(236, 72, 153, 0.25)";
    border = "#ec4899";
    innerHtml = window.AssetCatalog.consumables.potion(uid, "#ec4899");
  }

  if (key === "Monster Card Sack") {
    bg = "rgba(168, 85, 247, 0.25)";
    border = "#a855f7";
    innerHtml = window.AssetCatalog.consumables.monster_card_sack(uid);
  }

  return window.AssetCatalog.compile(viewBox, innerHtml, size, bg, border);
};

window.getArtifactIconHtml = function (trait, size = 24) {
  let uid = Math.floor(Math.random() * 10000000);
  let innerHtml = "";

  if (window.AssetCatalog.artifacts[trait]) {
    innerHtml = window.AssetCatalog.artifacts[trait](uid);
  } else {
    innerHtml = `<circle cx="16" cy="16" r="10" fill="#7f8c8d" stroke="#111" stroke-width="1.5"/>`;
  }

  return window.AssetCatalog.compile(
    "0 0 32 32",
    innerHtml,
    size,
    "#111",
    "#444",
  );
};

window.getUniqueIconHtml = function (item, size = 32) {
  let uid = Math.floor(Math.random() * 10000000);
  let innerHtml = "";
  let sub = "";
  if (item.isUniqueStaff) sub = "staff";
  else if (item.isUniqueSword) sub = "sword";
  else if (item.isUniqueSingularity) sub = "singularity";
  else if (item.isUniqueMaelstrom) sub = "maelstrom";
  else if (item.isUniqueAegis) sub = "aegis";
  else if (item.isUniqueWatch) sub = "watch";
  else if (item.isUniqueChronicle) sub = "chronicle";
  else if (item.isUniqueWarpCore) sub = "warpcore";
  else if (item.isUniqueTempest) sub = "tempest";

  if (window.AssetCatalog.uniques[sub]) {
    innerHtml = window.AssetCatalog.uniques[sub](uid);
  } else {
    innerHtml = `<circle cx="16" cy="16" r="10" fill="#444" stroke="#888" stroke-width="1.5"/>`;
  }
  return window.AssetCatalog.compile(
    "0 0 32 32",
    innerHtml,
    size,
    "#111",
    "#444",
  );
};

window.draftAllocations = null;

window.draftAllocations = null;
window.draftSP = 0;
window.activeStatTooltip = null;

// Rigorous alphanumeric checks to prevent HTML element breaking, XSS, and SQL injection
window.validateNameInput = function (name) {
  return (
    /^[a-zA-Z0-9]([a-zA-Z0-9 ]*[a-zA-Z0-9])?$/.test(name) &&
    name.length >= 3 &&
    name.length <= 14
  );
};
window.validateGuildNameInput = function (name) {
  return (
    /^[a-zA-Z0-9]([a-zA-Z0-9 ]*[a-zA-Z0-9])?$/.test(name) &&
    name.length >= 3 &&
    name.length <= 16
  );
};

window.draftHoldTimeout = null;
window.didFastDump = false;

// Lightweight DOM Cache to avoid repetitive query lookups
window.uiCache = {};
window.getCachedEl = function (id) {
  if (!window.uiCache[id]) {
    window.uiCache[id] = document.getElementById(id);
  }
  return window.uiCache[id];
};

// Cached timezone formatter to prevent high-cost parsing during dynamic UI updates
window.ptFormatter = null;
window.getPacificTimeNow = function (ms) {
  if (!window.ptFormatter) {
    window.ptFormatter = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Los_Angeles",
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
      hour12: false,
    });
  }
  // Formats date parts into a parsable layout: MM/DD/YYYY, HH:MM:SS
  const parts = window.ptFormatter.formatToParts(ms);
  let map = {};
  for (let p of parts) {
    map[p.type] = p.value;
  }
  return new Date(
    map.year,
    map.month - 1,
    map.day,
    map.hour,
    map.minute,
    map.second,
  );
};

window.hexToRgba = function (hex, alpha) {
  if (!hex || hex.charAt(0) !== "#") return `rgba(155, 89, 182, ${alpha})`;
  let r = parseInt(hex.slice(1, 3), 16),
    g = parseInt(hex.slice(3, 5), 16),
    b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

// --- RIFT CONSOLE DATA & ENGINE ---
window.riftSlideIndex = 0;
window.riftSelectedLevel = 1;

window.riftBossesMetadata = [
  {
    type: "guardian",
    name: "Aegis Goliath",
    title: "The Iron Sentinel",
    avatar: "🛡️",
    desc: "Hyper-dense Event Horizon armor plates. Spikes reflect incoming raw kinetic impacts.",
    strategy:
      "Focus on unmitigated damage like Bleed or Rupture to bypass his massive defense pool.",
    artifacts: [
      { name: "Aegis Core", trait: "defense" },
      { name: "Phoenix Ankh", trait: "second_wind" },
      { name: "Golem's Core", trait: "golem_stance" },
      { name: "Titan's Shield Grip", trait: "titan_grip" },
      { name: "Blood-Soaked Chalice", trait: "vampirism" },
      { name: "Riposte Gauntlet", trait: "parry_strike" },
      { name: "Survivor's Adrenaline", trait: "dodge_buff" },
    ],
    hpMult: 10.0,
    dmgMult: 10.0,
    defMult: 8.0,
    speed: 100,
  },
  {
    type: "chronos",
    name: "Chronos Arbitrator",
    title: "The Timeless God",
    avatar: "⏳",
    desc: "Manipulates local clock speed, triggering time dilations that reduce player attack frequencies.",
    strategy:
      "Equip high Active/Idle Speed gear or utilize Haste Potions to resist time-dilation effects.",
    artifacts: [
      { name: "Chrono Hourglass", trait: "extend_buffs" },
      { name: "Sloth's Blessing", trait: "idle_spd" },
      { name: "Windwalker Boots", trait: "move_speed" },
      { name: "Philosopher's Anchor", trait: "gold_hoard" },
      { name: "Fairy Queen's Crown", trait: "fairy_wealth" },
      { name: "Alchemist's Alembic", trait: "alchemist_alembic" },
      { name: "Philosopher's Catalyst", trait: "philosopher_catalyst" },
    ],
    hpMult: 10.0,
    dmgMult: 10.0,
    defMult: 8.0,
    speed: 90,
  },
  {
    type: "nexus",
    name: "Nexus Overseer",
    title: "The Glitch Singularity",
    avatar: "👾",
    desc: "Infects the reality stream with glitch code, randomly shunting player multipliers and copying active buffs.",
    strategy:
      "Build consistent, flat attribute setups. Avoid relying on a single stacked stat line.",
    artifacts: [
      { name: "Berserker Stone", trait: "frenzy" },
      { name: "Gilded Scarab", trait: "magic_find" },
      { name: "Phantom Blade", trait: "echo_strike" },
      { name: "Void Core", trait: "void_pull" },
      { name: "Cauldron of Eternity", trait: "cauldron_eternity" },
      { name: "Zealot's Charm", trait: "active_spd" },
      { name: "Dimensional Pouch", trait: "bag_space" },
    ],
    hpMult: 10.0,
    dmgMult: 10.0,
    defMult: 8.0,
    speed: 80,
  },
];

window.getArtifactIcon = function (trait) {
  const icons = {
    frenzy: "🔥",
    vampirism: "🩸",
    gold_hoard: "🟡",
    magic_find: "🍀",
    move_speed: "👟",
    defense: "🛡️",
    parry_strike: "⚔️",
    echo_strike: "👻",
    idle_spd: "⏱️",
    active_spd: "⚡",
    dodge_buff: "👟",
    extend_buffs: "⏳",
    bag_space: "🎒",
    second_wind: "🏥",
    golem_stance: "🧱",
    fairy_wealth: "🧚",
    void_pull: "🌌",
    titan_grip: "🦾",
    alchemist_alembic: "🧪",
    philosopher_catalyst: "🧪",
    cauldron_eternity: "🍵",
  };
  return icons[trait] || "🔮";
};

window.openRiftConsole = function () {
  let modal = document.getElementById("rift-console-modal");
  if (!modal) return;

  let selectEl = document.getElementById("rift-hunt-select");
  let initialType = selectEl ? selectEl.value : "guardian";
  let initialIndex = window.riftBossesMetadata.findIndex(
    (b) => b.type === initialType,
  );
  if (initialIndex === -1) initialIndex = 0;

  window.riftSlideIndex = initialIndex;
  window.riftSelectedLevel = window.playerStats.activeRift
    ? window.playerStats.activeRiftLevel || 1
    : 1;

  window.renderRiftConsole();
  modal.style.display = "block";
  window.setPauseState(true);
};

window.renderRiftConsole = function () {
  let modal = document.getElementById("rift-console-modal");
  if (!modal) return;

  let isRiftActive = !!window.playerStats.activeRift;
  let activeLvl = window.playerStats.activeRiftLevel || 1;
  let selectedLvl = window.riftSelectedLevel;
  let maxLvl = (window.playerStats.highestRiftLevel || 0) + 5;
  let coresOwned = window.inventory.ETC["Ancient Core"] || 0;

  let headerTitle = isRiftActive
    ? `Reality Rift: Active Hunt`
    : `Rift Altar: Prepare Hunt`;

  let levelSelectorHtml = "";
  if (isRiftActive) {
    levelSelectorHtml = `
            <div style="background:rgba(231,76,60,0.1); border:1px dashed #e74c3c; border-radius:6px; padding:10px; margin-bottom:12px; text-align:center;">
                <strong style="color:#e74c3c; font-size:11.5px;">⚠️ RIFT ACTIVE (LEVEL ${activeLvl})</strong><br>
                <span style="font-size:10px; color:#aaa;">The Rift is locked. Slay or Collapse it to adjust level.</span>
            </div>
        `;
  } else {
    levelSelectorHtml = `
              <div style="background:rgba(155, 89, 182, 0.1); border:1px solid #4a154b; border-radius:6px; padding:10px; margin-bottom:12px; display:flex; justify-content:space-between; align-items:center; cursor:help;" onmouseenter="window.showRiftRewardBreakdownTooltip(event, ${selectedLvl})" onmouseleave="window.hideTooltip()" ontouchstart="window.showRiftRewardBreakdownTooltip(event, ${selectedLvl})">
                  <div>
                      <strong style="color:#df9ffb; font-size:11.5px; display:block;">CHOOSE RIFT TIER / LEVEL: ⓘ</strong>
                      <span style="font-size:10px; color:#aaa;">Max Unlocked: Level ${maxLvl}</span>
                  </div>
                  <div style="display:flex; align-items:center; gap:6px;" onclick="event.stopPropagation();">
                      <button class="btn-action" style="padding:4px 10px; background:#4a154b;" onclick="window.changeRiftLevel(-1)">-</button>
                      <strong style="font-size:14px; font-family:monospace; min-width:30px; text-align:center; color:#fff;" id="rift-console-level-val">${selectedLvl}</strong>
                      <button class="btn-action" style="padding:4px 10px; background:#4a154b;" onclick="window.changeRiftLevel(1)">+</button>
                  </div>
              </div>
          `;
  }

  let slidesHtml = window.riftBossesMetadata
    .map((boss, idx) => {
      let lvl = isRiftActive ? activeLvl : selectedLvl;
      let equivalentStage = 50 + lvl * 10;
      let gRate = 1.045 + (equivalentStage * 0.04) / (equivalentStage + 200);
      let rScale = Math.pow(gRate, equivalentStage);

      let defVal = Math.floor(boss.defMult * rScale);
      let hpVal = Math.floor(boss.hpMult * (60 * rScale) * (1 + defVal / 100)); // True Effective Health
      let dmgVal = Math.floor(20 * rScale * boss.dmgMult);

      let lootHtml = boss.artifacts
        .map((art) => {
          let artDetails = window.ARTIFACT_POOL.find(
            (a) => a.name === art.name,
          );
          let trait = artDetails ? artDetails.trait : art.trait;
          return `
                    <div class="rift-loot-icon" onmouseenter="window.showDummyArtifact(event, '${trait}')" ontouchstart="window.showDummyArtifact(event, '${trait}')" onmouseleave="window.hideTooltip()">
                        <span>${window.getArtifactIconHtml(trait, 28)}</span>
                    </div>
                `;
        })
        .join("");

      return `
                <div class="rift-slide">
                    <div style="text-align:center;">
                        <div style="margin: 8px 0;">${window.getBossIconHtml(boss.type)}</div>
                        <div class="rift-boss-badge">${boss.name}</div>
                        <div style="font-style:italic; font-size:10.5px; color:#aaa; margin-bottom:8px;">"${boss.title}"</div>
                    </div>
                <div style="font-size:11px; color:#ddd; line-height:1.4; text-align:center; padding: 0 10px; margin-bottom:10px; min-height:34px; white-space:normal;">
                    ${boss.desc}
                </div>
                <div class="rift-stats-display">
                    <div class="rift-stat-box"><span>❤️ Life</span><strong>${window.formatNumber(hpVal)}</strong></div>
                    <div class="rift-stat-box"><span>⚔️ Attack</span><strong>${window.formatNumber(dmgVal)}</strong></div>
                    <div class="rift-stat-box"><span>🛡️ Armor</span><strong>${window.formatNumber(defVal)}</strong></div>
                </div>
                <div style="background:rgba(0,0,0,0.45); border:1px dashed #4a154b; padding:8px 10px; border-radius:4px; font-size:10px; line-height:1.4; text-align:left; margin-bottom:10px; white-space:normal;">
                    <strong style="color:#e74c3c;">💡 STRATEGY:</strong> ${boss.strategy}
                </div>
                <div>
                    <div style="font-size:9.5px; font-weight:bold; color:#ff007f; text-transform:uppercase; text-align:center; margin-bottom:4px; letter-spacing:0.5px;">💎 Potential Artifact Drops</div>
                    <div class="rift-loot-preview">${lootHtml}</div>
                </div>
            </div>
        `;
    })
    .join("");

  let dotsHtml = window.riftBossesMetadata
    .map(
      (b, idx) => `
        <div class="rift-dot ${idx === window.riftSlideIndex ? "active" : ""}" onclick="window.setRiftSlide(${idx})"></div>
    `,
    )
    .join("");

  let actionBtnHtml = "";
  if (isRiftActive) {
    actionBtnHtml = `
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
                <button class="btn-action un" style="font-weight:bold; padding:12px; font-size:11.5px;" onclick="window.executeAbandonRiftConsole()">⚠️ Collapse Rift</button>
                <button class="btn-action" style="background:#e74c3c; font-weight:bold; padding:12px; font-size:11.5px;" onclick="window.executeRiftSummon(true)">⚔️ Re-enter Fight</button>
            </div>
        `;
  } else {
    let canAfford = coresOwned >= 1;
    let costColor = canAfford ? "#2ecc71" : "#e74c3c";
    actionBtnHtml = `
            <div style="display:flex; flex-direction:column; gap:8px;">
                <div style="display:flex; justify-content:space-between; font-size:11px; color:#aaa; font-family:monospace; padding:0 4px;">
                    <span>Cores Owned: <strong style="color:${coresOwned >= 1 ? "#2ecc71" : "#e74c3c"};">${coresOwned} / 1</strong></span>
                    <span>Summon Cost: <strong style="color:#ff007f;">1 Core</strong></span>
                </div>
                <button class="btn-action" style="background:#9b59b6; width:100%; font-weight:bold; padding:12px; font-size:11.5px; letter-spacing:0.5px;" ${canAfford ? "" : 'disabled style="opacity:0.5; cursor:not-allowed;"'} onclick="window.executeRiftSummon()">🔮 COMMENCE SUMMONING</button>
            </div>
        `;
  }

  modal.innerHTML = `
          <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #333; padding-bottom:10px; margin-bottom:10px;">
              <h3 style="margin:0; color:#9b59b6; font-size:14px; display:flex; align-items:center; gap:6px;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle;"><circle cx="12" cy="12" r="10" stroke-dasharray="3 3"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/></svg> ${headerTitle}</h3>
            <button onclick="document.getElementById('rift-console-modal').style.display='none'; window.setPauseState(false); window.hideTooltip();" style="background:#e74c3c; color:white; border:none; border-radius:4px; padding:6px 12px; font-weight:bold; cursor:pointer; font-size:11px;">Close</button>
        </div>

        ${levelSelectorHtml}

        <div class="rift-carousel-container">
                    ${
                      isRiftActive
                        ? ""
                        : `
                        <button class="carousel-arrow prev" onclick="window.changeRiftSlide(-1)">◀</button>
                        <button class="carousel-arrow next" onclick="window.changeRiftSlide(1)">▶</button>
                    `
                    }
                    <div class="rift-carousel-track" id="rift-carousel-track" style="transform: translate3d(-${window.riftSlideIndex * 33.333}%, 0, 0);">
                        ${slidesHtml}
                    </div>
                </div>

        ${isRiftActive ? "" : `<div class="rift-dots">${dotsHtml}</div>`}

        <div style="margin-top: 15px;">
            ${actionBtnHtml}
        </div>
    `;

  // Swipe handler setup
  let track = document.getElementById("rift-carousel-track");
  if (track && !isRiftActive) {
    let startX = 0,
      currentX = 0,
      isDragging = false;
    track.addEventListener(
      "touchstart",
      (e) => {
        startX = e.touches[0].clientX;
        isDragging = true;
      },
      { passive: true },
    );
    track.addEventListener(
      "touchmove",
      (e) => {
        if (!isDragging) return;
        currentX = e.touches[0].clientX;
      },
      { passive: true },
    );
    track.addEventListener("touchend", (e) => {
      if (!isDragging) return;
      isDragging = false;
      let diffX = startX - currentX;
      if (Math.abs(diffX) > 40) {
        if (diffX > 0) window.changeRiftSlide(1);
        else window.changeRiftSlide(-1);
      }
    });
  }
};

window.changeRiftLevel = function (direction) {
  let maxLvl = (window.playerStats.highestRiftLevel || 0) + 5;
  let newLvl = window.riftSelectedLevel + direction;
  let minLvl = Math.max(1, window.playerStats.highestRiftLevel || 1);
  if (newLvl < minLvl) newLvl = minLvl;
  if (newLvl > maxLvl) newLvl = maxLvl;
  window.riftSelectedLevel = newLvl;
  window.renderRiftConsole();

  let tt = document.getElementById("game-tooltip");
  if (tt && tt.style.display === "block") {
    window.showRiftRewardBreakdownTooltip(null, newLvl);
  }
};

window.changeRiftSlide = function (direction) {
  if (window.playerStats.activeRift) return;
  let newIndex = window.riftSlideIndex + direction;
  if (newIndex < 0) newIndex = window.riftBossesMetadata.length - 1;
  if (newIndex >= window.riftBossesMetadata.length) newIndex = 0;
  window.riftSlideIndex = newIndex;
  window.renderRiftConsole();
};

window.setRiftSlide = function (idx) {
  if (window.playerStats.activeRift) return;
  window.riftSlideIndex = idx;
  window.renderRiftConsole();
};

window.executeRiftSummon = function (isReentry = false) {
  if (
    !isReentry &&
    (window.playerStats.isDungeonMode ||
      window.playerStats.isCrucibleMode ||
      window.playerStats.isPrestigeBossMode ||
      window.playerStats.isUberBoss)
  ) {
    window.pushHeaderToast(
      "Cannot summon: already in another activity!",
      "#e74c3c",
    );
    return;
  }
  let cores = window.inventory.ETC["Ancient Core"] || 0;
  let boss = window.riftBossesMetadata[window.riftSlideIndex];
  let lvl = isReentry
    ? window.playerStats.activeRiftLevel || 1
    : window.riftSelectedLevel;

  if (!isReentry) {
    if (cores < 1) return;
    window.inventory.ETC["Ancient Core"]--;
    if (window.inventory.ETC["Ancient Core"] === 0)
      delete window.inventory.ETC["Ancient Core"];
    window.playerStats.activeRift = boss.type;
    window.playerStats.activeRiftLevel = lvl;
  }

  let actualBossType = isReentry ? window.playerStats.activeRift : boss.type;

  window.playerStats.isBossMode = true;
  window.playerStats.isUberBoss = true;
  window.playerStats.currentUberBoss = actualBossType;
  window.playerStats.killCount = 0;
  window.playerStats.targetsRequired = 1;
  window.mob = null;

  let p = window.resolvePlayerStats();
  window.playerStats.currentHp = p.maxHp;

  if (isReentry) {
    window.pushLog(
      `<span style='color:#9b59b6; font-weight:bold;'>[RIFT SUMMON] Re-entering Level ${lvl} Rift for ${boss.name}!</span>`,
    );
  } else {
    window.pushLog(
      `<span style='color:#9b59b6; font-weight:bold;'>[RIFT SUMMON] The Altar consumes 1 Ancient Core! A Level ${lvl} Rift for ${boss.name} forms...</span>`,
    );
  }

  document.getElementById("rift-console-modal").style.display = "none";
  window.setPauseState(false);
  window.updateUI();
  window.saveGame();
};

window.executeAbandonRiftConsole = function () {
  window.showCustomConfirm(
    "Abandon Reality Rift",
    "Are you sure you want to collapse the active Rift? The spent Ancient Core will be lost permanently.",
    "Collapse Rift",
    "Keep Attempting",
    "#e74c3c",
    function () {
      window.playerStats.activeRift = null;
      window.playerStats.activeRiftLevel = 1;
      window.playerStats.isUberBoss = false;
      window.playerStats.isBossMode = false;
      window.mob = null;
      window.pushLog(
        "<span style='color:#e74c3c;'>[RIFT] The Reality Rift collapsed.</span>",
      );
      document.getElementById("rift-console-modal").style.display = "none";
      window.setPauseState(false);
      window.updateUI();
      window.saveGame();
    },
  );
};

// Initialize the direct DOM, Tooltip and Viewport Manager namespace
window.UIManager = {
  // Helper to safely update text nodes using the element cache
  setText(id, text) {
    let el = window.getCachedEl(id);
    if (el) el.innerText = text;
  },
};

// Legacy Compatibility Aliases to protect cross-file references
window.setText = (id, text) => window.UIManager.setText(id, text);

// --- CORE UI REFRESHER ---

// Append updateScrollLock inside window.UIManager
window.UIManager.updateScrollLock = function () {
  const idsToCheck = [
    "menu-hub-overlay",
    "settings-modal",
    "achievements-modal",
    "mailbox-modal",
    "leaderboard-modal",
    "inspect-modal",
  ];
  const selectorsToCheck = [
    "#gacha-modal-overlay",
    "#supply-crate-overlay",
    "#sack-opening-overlay",
    "#sp-confirm-modal",
  ];

  let isAnyOpen = false;

  for (let id of idsToCheck) {
    let el = document.getElementById(id);
    if (el && el.style.display !== "none" && el.style.display !== "") {
      isAnyOpen = true;
      if (!el.dataset.hasTouchBlocker) {
        el.dataset.hasTouchBlocker = "true";
        el.addEventListener(
          "touchmove",
          (e) => {
            if (e.target === el) {
              e.preventDefault();
            }
          },
          { passive: false },
        );
      }
      break;
    }
  }

  if (!isAnyOpen) {
    for (let sel of selectorsToCheck) {
      let el = document.querySelector(sel);
      if (el) {
        isAnyOpen = true;
        if (!el.dataset.hasTouchBlocker) {
          el.dataset.hasTouchBlocker = "true";
          el.addEventListener(
            "touchmove",
            (e) => {
              if (e.target === el) {
                e.preventDefault();
              }
            },
            { passive: false },
          );
        }
        break;
      }
    }
  }

  if (isAnyOpen) {
    document.body.classList.add("scroll-lock");
  } else {
    document.body.classList.remove("scroll-lock");
  }
};

// Legacy Compatibility Aliases to protect references
window.updateScrollLock = () => window.UIManager.updateScrollLock();

// Bind high-performance delegated proxy method to window.UIManager
window.UIManager.updateUI = () => window.updateUI();

window.updateUI = function () {
  window.updateScrollLock();
  let hasDraftChanges = false;
  if (window.draftAllocations) {
    for (let k in window.draftAllocations) {
      if (window.draftAllocations[k] !== window.playerStats.spAllocations[k]) {
        hasDraftChanges = true;
        break;
      }
    }
  }

  let p = window.resolvePlayerStats(hasDraftChanges);

  // Dynamic Clan Hall Locked Overlay Rendering (Void-style Lock & Chains)
  let clanCard = document.getElementById("hub-card-clan");
  if (clanCard) {
    // Only lock out clan hall if the player is under level 25 AND has never prestige-ascended
    if (
      window.playerStats.level < 25 &&
      (window.playerStats.prestigeCount || 0) === 0
    ) {
      clanCard.classList.add("locked-void");
      clanCard.innerHTML = `
        <div class="hub-card-icon" style="border-color: #9b59b6 !important; background: rgba(155, 89, 182, 0.15) !important; position: relative; z-index: 2;">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ff007f" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="filter: drop-shadow(0 0 4px #ff007f);">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        </div>
        <div style="flex: 1; min-width: 0; position: relative; z-index: 2;">
          <strong style="color: #df9ffb !important; font-size: 11.5px; text-shadow: 0 0 4px rgba(155, 89, 182, 0.5);">Clan Hall [LOCKED]</strong>
          <div style="font-size: 9px; color: #a29bfe !important; margin-top: 2px;">
            Unlocks at Level 25 (Required: ${window.playerStats.level}/25)
          </div>
        </div>
        <!-- Chain Graphic Overlay -->
        <div style="position: absolute; top:0; left:0; width:100%; height:100%; pointer-events:none; z-index:1; opacity:0.65;">
          <svg width="100%" height="100%" viewBox="0 0 200 60" preserveAspectRatio="none">
            <path d="M0,5 L200,55" stroke="#8e44ad" stroke-width="3.5" stroke-dasharray="10 7" stroke-linecap="round" fill="none" style="filter: drop-shadow(0 0 3px #ff007f);" />
            <path d="M0,55 L200,5" stroke="#8e44ad" stroke-width="3.5" stroke-dasharray="10 7" stroke-linecap="round" fill="none" style="filter: drop-shadow(0 0 3px #ff007f);" />
          </svg>
        </div>
      `;
    } else {
      clanCard.classList.remove("locked-void");
      clanCard.innerHTML = `
        <div class="hub-card-icon" style="border-color: #8e44ad; background: rgba(142, 68, 173, 0.08);">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#8e44ad" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <path d="M12 8v8M9 11h6" />
          </svg>
        </div>
        <div style="flex: 1; min-width: 0">
          <strong style="color: #ffebcc; font-size: 11.5px">Clan Hall</strong>
          <div style="font-size: 9px; color: #c8b195; margin-top: 2px">
            Cooperate & Research Upgrades
          </div>
        </div>
        <span id="hub-card-clan-badge" class="hub-card-badge" style="display: none">!</span>
      `;
    }
  }

  // 1. Hud overlays (Dynamic Activities stage tracking)
  let displayTitleHtml = "";
  let activeStageVal = window.playerStats.stage;
  let stageSubText = `(${window.playerStats.killCount}/${window.playerStats.targetsRequired}) • Peak ${window.playerStats.maxStage || 1}`;

  if (window.playerStats.isDungeonMode) {
    let dType = window.playerStats.currentDungeon || "gold";
    let dNames = { equip: "Equip Floor", gold: "Gold Floor", mat: "Mat Floor" };
    let dIcons = {
      equip: `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#3498db" stroke-width="2.5" style="display:inline-block; vertical-align:middle; margin-right:3px;"><path d="M14.5 17.5L3 6V3h3l11.5 11.5M13 19l2 2M11 19l-2 2" /></svg>`,
      gold: `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#f1c40f" stroke-width="2.5" style="display:inline-block; vertical-align:middle; margin-right:3px;"><circle cx="12" cy="12" r="10" fill="#f1c40f" fill-opacity="0.15" /><path d="M12 8v8M9 10h6M9 13h6" /></svg>`,
      mat: `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#2ecc71" stroke-width="2.5" style="display:inline-block; vertical-align:middle; margin-right:3px;"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77" /></svg>`,
    };
    displayTitleHtml = `${dIcons[dType] || ""} ${dNames[dType] || "Floor"}`;
    activeStageVal = window.playerStats.currentDungeonStage[dType] || 1;
    stageSubText = `(${window.playerStats.killCount}/${window.playerStats.targetsRequired}) • Peak ${window.playerStats.dungeonPeaks[dType] || 1}`;
  } else if (window.playerStats.isCrucibleMode) {
    displayTitleHtml = `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#9b59b6" stroke-width="2.5" style="display:inline-block; vertical-align:middle; margin-right:3px;"><path d="M12 2L2 22h20L12 2z" fill="#9b59b6" fill-opacity="0.15" /></svg> Wave`;
    activeStageVal = window.playerStats.crucibleWave || 1;
    stageSubText = `(${window.playerStats.killCount}/${window.playerStats.targetsRequired}) • Peak ${window.playerStats.cruciblePeak || 1}`;
  } else {
    displayTitleHtml = `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#3498db" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle; margin-right:3px;"><circle cx="12" cy="12" r="10" fill="#3498db" fill-opacity="0.15" /><polygon points="16.24,7.76 14.12,14.12 7.76,16.24 9.88,9.88" /></svg> Stage`;
    stageSubText = `(${window.playerStats.killCount}/${window.playerStats.targetsRequired}) • Peak ${window.playerStats.lifetimePeakStage || window.playerStats.maxStage || 1}`;
  }

  let stageLabelEl = document.getElementById("hud-stage-label");
  if (stageLabelEl) stageLabelEl.innerHTML = displayTitleHtml;

  let stageSubEl = document.getElementById("hud-stage-sub");
  if (stageSubEl) stageSubEl.innerText = stageSubText;

  setText("hud-stage", activeStageVal);
  setText("hud-coins", window.formatNumber(window.playerStats.coins));

  // Update real-time DPS in the draggable overlay
  let actDps = window.calculateActiveDps ? window.calculateActiveDps() : "0.0";
  setText("dps-overlay-value", actDps);

  // Update player HP in HUD bar
  let maxHp = p.maxHp;
  let curHp = window.playerStats.currentHp;
  setText(
    "hud-hp",
    `${window.formatNumber(curHp)} / ${window.formatNumber(maxHp)}`,
  );

  let hpPercent = Math.max(0, (curHp / maxHp) * 100);
  let hpSubEl = document.getElementById("hud-hp-pct");
  if (hpSubEl) {
    hpSubEl.innerText = `${hpPercent.toFixed(1)}%`;
    hpSubEl.style.color =
      hpPercent < 35 ? "#e74c3c" : hpPercent < 75 ? "#f39c12" : "#2ecc71";
  }

  // Dynamically toggle Leave Activity button based on state
  let leaveBtn = document.getElementById("btn-leave-activity");
  if (leaveBtn) {
    if (window.playerStats.isDungeonMode || window.playerStats.isCrucibleMode) {
      leaveBtn.style.setProperty("display", "inline-flex", "important");
    } else {
      leaveBtn.style.setProperty("display", "none", "important");
    }
  }

  // Update Dungeon Peaks & Checkpoints in Activities Menu
  if (window.playerStats.dungeonPeaks) {
    let eqPeak = window.playerStats.dungeonPeaks.equip || 1;
    let goPeak = window.playerStats.dungeonPeaks.gold || 1;
    let maPeak = window.playerStats.dungeonPeaks.mat || 1;

    window.setText("dp-equip", eqPeak);
    window.setText("dp-gold", goPeak);
    window.setText("dp-mat", maPeak);

    window.setText("tab-dp-equip", eqPeak);
    window.setText("tab-dp-gold", goPeak);
    window.setText("tab-dp-mat", maPeak);

    let campaignStage = window.playerStats.stage || 1;
    let eqCheck = Math.max(
      1,
      Math.floor(eqPeak * 0.8),
      Math.floor(campaignStage * 0.7),
    );
    let goCheck = Math.max(
      1,
      Math.floor(goPeak * 0.8),
      Math.floor(campaignStage * 0.7),
    );
    let maCheck = Math.max(
      1,
      Math.floor(maPeak * 0.8),
      Math.floor(campaignStage * 0.7),
    );

    window.setText("dc-equip", eqCheck);
    window.setText("dc-gold", goCheck);
    window.setText("dc-mat", maCheck);

    window.setText("tab-dc-equip", eqCheck);
    window.setText("tab-dc-gold", goCheck);
    window.setText("tab-dc-mat", maCheck);
  }

  // Update Crucible Peak & Checkpoint in Activities Menu
  let cPeak = window.playerStats.cruciblePeak || 1;
  window.setText("crucible-peak-wave", cPeak);
  window.setText("tab-crucible-peak-wave", cPeak);

  let peakLvl = window.playerStats.lifetimePeakStage || 1;
  let startingStageOffset = Math.max(1, Math.floor(peakLvl * 0.75));
  window.setText("crucible-checkpoint-wave", `Stage ${startingStageOffset}`);
  window.setText(
    "tab-crucible-checkpoint-wave",
    `Stage ${startingStageOffset}`,
  );

  window.setText(
    "tab-etc-souls",
    (window.inventory.ETC["Monster Soul"] || 0).toLocaleString(),
  );

  let maxBag = window.getMaxBagSlots();
  let bagEl = document.getElementById("hud-bag");
  if (bagEl) {
    bagEl.innerText = `${window.inventory.EQUIP.length}/${maxBag} (A:${window.inventory.ARTIFACT.length})`;
    bagEl.style.color =
      window.inventory.EQUIP.length >= maxBag ||
      window.inventory.ARTIFACT.length >= maxBag
        ? "#e74c3c"
        : "#2ecc71";
  }

  // 2. Stats panel headers (Cleaned up: Name + Bold Title Pill)
  setText("char-level", window.playerStats.level);

  let nameEl = document.getElementById("header-player-name");
  if (nameEl) {
    let activeTitle = window.playerStats.equippedTitle;
    let tData = activeTitle ? window.TITLES_DATA[activeTitle] : null;
    // Bold, pill-styled Title Badge with Icon
    let titleHtml = tData
      ? `
          <span style="background:${tData.color || "#ff007f"}20; color:${tData.color || "#ff007f"}; border:1px solid ${tData.color || "#ff007f"}; padding: 1px 6px; border-radius: 10px; font-size: 9px; font-weight: 900; margin-left: 6px; display: inline-flex; align-items:center; gap:3px; text-transform: uppercase;">
            ${tData.icon || ""} ${tData.name}
          </span>`
      : "";
    nameEl.innerHTML = `<span>${window.playerStats.playerName || "Guest"}</span>${titleHtml}`;
  }

  // Status Tags Row (Guild Emblem + Name)
  let clanBadgeEl = document.getElementById("header-clan-badge");
  if (clanBadgeEl) {
    if (window.playerStats.clanId && window.playerStats.clanName) {
      let emblemHtml = window.getClanEmblemHtml(
        window.playerStats.clanEmblem || 0,
        12,
      );
      clanBadgeEl.innerHTML = `${emblemHtml} ${window.escapeHTML(window.playerStats.clanName)}`;
      clanBadgeEl.style.display = "flex";
    } else {
      clanBadgeEl.style.display = "none";
    }
  }

  // XP Bar (Stable tracking)
  let bXp = BigNum.from(window.playerStats.xp || 0);
  let bXpReq = BigNum.from(window.playerStats.xpReq || 100);
  let xpPct =
    Number(bXp.div(bXpReq).m * Math.pow(10, Math.min(15, bXp.div(bXpReq).e))) *
    100;

  setText(
    "char-xp-text",
    `${window.formatNumber(bXp)} / ${window.formatNumber(bXpReq)} (${xpPct.toFixed(1)}%)`,
  );

  const xpFill = document.getElementById("char-xp-fill");
  if (xpFill) {
    xpFill.style.width = Math.min(100, xpPct) + "%";
  }

  // 3. Core attributes matrix
  setText("stat-str", p.str);
  setText("stat-dex", p.dex);
  setText("stat-int", p.int);
  setText(
    "char-sp",
    window.draftAllocations !== null ? window.draftSP : window.playerStats.sp,
  );

  // 4. Multipliers & Avoidance
  setText("stat-atk", window.formatNumber(p.atk));
  setText("stat-mhp", window.formatNumber(p.maxHp));
  setText("stat-def", window.formatNumber(p.def));
  setText("stat-mov", p.moveSpeed.toFixed(1));
  setText("stat-ias", p.idleAttackSpeed + "f");
  setText("stat-aas", p.activeAttackSpeed + "f");
  setText("stat-crt", Math.floor(p.critChance * 100) + "%");
  setText("stat-crd", Math.floor(p.critDamage * 100) + "%");
  setText("stat-blk", Math.floor(p.block * 100) + "%");
  setText("stat-pry", Math.floor(p.parry * 100) + "%");
  setText("stat-rar", (p.rareSpawn * 100).toFixed(2) + "%");
  setText("stat-fai", Math.floor(p.fairySpawn * 100) + "%");
  setText("stat-drp", "+" + Math.floor((p.drop - 1) * 100) + "%");
  setText("stat-qly", "+" + Math.floor((p.qly - 1) * 100) + "%");
  setText("stat-gld", "x" + p.gold.toFixed(2));
  setText("stat-xpr", "x" + p.xpRate.toFixed(2));
  setText("stat-bar", Math.floor(p.arcaneBarrier * 100) + "%");

  let effMultiplier = 1 + p.critChance * (p.critDamage - 1);
  let idps = p.atk * effMultiplier * (60 / p.idleAttackSpeed);
  setText(
    "stat-idps",
    idps.toLocaleString(undefined, {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }),
  );

  // Real-time updates for Guild Missions Board if currently open
  let missionsWin = document.getElementById("missions-win-content");
  if (missionsWin) {
    window.renderMissionsWindow();
  }

  // Draft drawer visibility
  let draftBar = document.getElementById("draft-controls-container");
  if (draftBar) {
    draftBar.style.display = hasDraftChanges ? "block" : "none";
  }

  // Run unified roll-up alerts check
  window.updateHubAlerts();

  if (typeof window.renderCavernSigilConsole === "function") {
    window.renderCavernSigilConsole();
  }

  if (typeof window.renderCrucibleTab === "function") {
    window.renderCrucibleTab();
  }

  if (typeof window.updateEcoModeStyle === "function") {
    window.updateEcoModeStyle();
  }

  // Refresh core SP allocations button display
  const updateSPButtonStates = () => {
    let statsKeys = ["spStr", "spDex", "spInt"];
    let currentSp =
      window.draftAllocations !== null ? window.draftSP : window.playerStats.sp;
    let allocSource =
      window.draftAllocations || window.playerStats.spAllocations;

    statsKeys.forEach((allocKey) => {
      let plusBtn = document.getElementById("btn-plus-" + allocKey);
      let minusBtn = document.getElementById("btn-minus-" + allocKey);
      if (plusBtn)
        plusBtn.style.display = currentSp > 0 ? "inline-block" : "none";
      if (minusBtn) {
        let committedVal = window.playerStats.spAllocations[allocKey] || 0;
        let draftVal = allocSource[allocKey] || 0;
        minusBtn.style.display =
          draftVal > committedVal ? "inline-block" : "none";
      }
    });
  };
  updateSPButtonStates();

  // Challenge portal visibility
  let rechallengeBtn = document.getElementById("btn-rechallenge");
  if (rechallengeBtn) {
    rechallengeBtn.style.display = window.playerStats.isFarmingLoop
      ? "block"
      : "none";
  }

  // Set synergy hud lists
  let activeSetsHtml = [];
  let activeSetCounts = {};
  const checkSetSlots = [
    "weapon",
    "subweapon",
    "helmet",
    "chest",
    "leggings",
    "overall",
    "boots",
  ];
  checkSetSlots.forEach((slot) => {
    let item = window.equippedSlots[slot];
    if (item) {
      let sName = window.getItemSetName(item);
      if (sName)
        activeSetCounts[sName] =
          (activeSetCounts[sName] || 0) + (slot === "overall" ? 2 : 1);
    }
  });
  for (let sName in activeSetCounts) {
    let count = activeSetCounts[sName];
    let setDef = window.SET_DEFINITIONS[sName];
    if (setDef) {
      let activeBonuses = setDef.bonuses.filter((b) => count >= b.count);
      let displayCount = Math.min(3, count);
      if (activeBonuses.length > 0) {
        let bonusesText = activeBonuses.map((b) => b.desc).join(", ");
        activeSetsHtml.push(
          `<div style="margin-bottom: 5px;"><strong style="color: #2ecc71;">${sName} (${displayCount}/3):</strong> <span style="color:#fff;">${bonusesText}</span></div>`,
        );
      } else {
        activeSetsHtml.push(
          `<div style="margin-bottom: 5px; color: #7f8c8d;"><strong>${sName} (${displayCount}/3):</strong> No active bonus</div>`,
        );
      }
    }
  }
  let setsListEl = document.getElementById("active-sets-list");
  if (setsListEl) {
    setsListEl.innerHTML =
      activeSetsHtml.length > 0
        ? activeSetsHtml.join("")
        : "No active set synergies. Equip matching named gear (e.g. Colossus, Windrunner).";
  }

  // Live drop rates (safely mapped using setText to prevent element missing errors)
  let drp = p.drop * window.state.efficiency;
  setText("live-rate-mob", (4.5 * drp).toFixed(2) + "%");
  setText("live-rate-rare", (15.0 * drp).toFixed(2) + "%");
  setText("live-rate-boss", (25.0 * drp).toFixed(2) + "%");
  setText("live-rate-dmini", (30.0 * drp).toFixed(2) + "%");
  let elRateAcore = document.getElementById("live-rate-acore");
  if (elRateAcore) elRateAcore.innerText = (40.0 * drp).toFixed(2) + "%";

  let dropProbs = window.calculateRarityProbabilities(p.qly, false);

  setText(
    "star-rate-5",
    p.qly >= 2.0 ? dropProbs[5].toFixed(2) + "%" : "0.00% 🔒 (Req. 2.0x Qly)",
  );
  setText(
    "star-rate-4",
    p.qly >= 1.5 ? dropProbs[4].toFixed(2) + "%" : "0.00% 🔒 (Req. 1.5x Qly)",
  );
  setText("star-rate-3", dropProbs[3].toFixed(2) + "%");
  setText("star-rate-2", dropProbs[2].toFixed(2) + "%");
  setText("star-rate-1", dropProbs[1].toFixed(2) + "%");

  setText("live-qty-acore", window.inventory.ETC["Ancient Core"] || 0);
  setText(
    "live-qty-eshard",
    (window.inventory.ETC["Eridium Shard"] || 0).toLocaleString(),
  );

  let elAstral = document.getElementById("live-qty-astral");
  if (elAstral) {
    elAstral.innerText = `${(window.inventory.ETC["Astral Essence"] || 0).toLocaleString()} (Shared Shards: ${(window.playerStats.astralShards || 0).toLocaleString()})`;
  }

  setText(
    "live-qty-keys",
    `${(window.inventory.ETC["Gacha Key"] || 0).toLocaleString()} (E:${window.playerStats.equipKeys} G:${window.playerStats.goldKeys} M:${window.playerStats.matKeys})`,
  );

  let soulsTotal = window.inventory.ETC["Monster Soul"] || 0;
  setText(
    "live-qty-souls",
    `${(soulsTotal + (window.inventory.ETC["Luminous Soul"] || 0)).toLocaleString()} (Locked Cores: ${(window.inventory.ETC["Catalyst Core"] || 0).toLocaleString()})`,
  );

  let scrapsSum =
    (window.inventory.ETC["Mythic Scrap"] || 0) +
    (window.inventory.ETC["Legendary Scrap"] || 0) +
    (window.inventory.ETC["Epic Scrap"] || 0) +
    (window.inventory.ETC["Magic Scrap"] || 0) +
    (window.inventory.ETC["Rare Scrap"] || 0);
  setText("live-qty-scraps", scrapsSum.toLocaleString());

  // Update Altar UI Card dynamically if Runs tab is active
  let runsTab = document.getElementById("tab-activities");
  if (runsTab && runsTab.classList.contains("active")) {
    window.renderAltarTab();
  }

  // Update Vending Subtab variables if active
  let gachaSec = document.getElementById("market-sec-gacha");
  if (gachaSec && gachaSec.style.display !== "none") {
    window.setText(
      "gachapon-lvl-display",
      window.playerStats.vendingQLevel || 0,
    );
    window.setText(
      "gacha-key-count-lbl",
      window.inventory.ETC["Gacha Key"] || 0,
    );
    window.updateGachaRecentList();
    window.renderGachaShowcaseMarquee();

    // Update live vending rates board (Fully live with your stats!)
    let probs = window.calculateRarityProbabilities(p.qly, true);

    window.setText("vending-rate-5", probs[5].toFixed(2) + "%");
    window.setText("vending-rate-4", probs[4].toFixed(2) + "%");
    window.setText("vending-rate-3", probs[3].toFixed(1) + "%");
    window.setText("vending-rate-2", probs[2].toFixed(2) + "%");
    window.setText("vending-rate-1", probs[1].toFixed(2) + "%");
  }

  // Refresh Gacha Pity Elements if present
  let pityProgress = window.playerStats.vendingPity || 0;
  let pityTextBadge = document.getElementById("vending-pity-text");
  let pityBarFill = document.getElementById("vending-pity-fill");
  if (pityTextBadge)
    pityTextBadge.innerText = `Pity progress: ${pityProgress} / 50`;
  if (pityBarFill) pityBarFill.style.width = `${(pityProgress / 50) * 100}%`;

  // Buff trackers HUD
  let activeBuffs = [];
  if (window.playerStats.frenzyTimer > 0) activeBuffs.push("🔥 Frenzy");
  if (window.playerStats.adrenalineTimer > 0) activeBuffs.push("⚡ Adrenaline");
  if (window.playerStats.atkPotionTimer > 0) activeBuffs.push("⚔️ Potion");
  if (window.playerStats.hpPotionTimer > 0) activeBuffs.push("❤️ Potion");
  if (window.playerStats.defPotionTimer > 0) activeBuffs.push("🛡️ Potion");
  if (window.playerStats.hastePotionTimer > 0) activeBuffs.push("👟 Potion");

  let buffEl = document.getElementById("hud-buff");
  if (buffEl) {
    if (activeBuffs.length > 0) {
      buffEl.innerText = activeBuffs.join(", ");
      buffEl.style.color = "#2ecc71";
    } else {
      buffEl.innerText = "None";
      buffEl.style.color = "#aaa";
    }
  }

  // Cumulative trophies
  let sumSummaryEl = document.getElementById("trophy-bonuses-summary");
  if (sumSummaryEl) {
    if (!window.playerStats.cachedAchievementBonusTotals) {
      window.recalculateAchievementTotals();
    }
    let aT = window.playerStats.cachedAchievementBonusTotals;

    let unlockedCount = window.playerStats.unlockedAchievements
      ? window.playerStats.unlockedAchievements.length
      : 0;
    let totalCount = window.AchievementsData
      ? window.AchievementsData.length
      : 174;
    let lines = [
      `<div style="color:#f1c40f; font-weight:bold; margin-bottom:4px; text-align:center; border-bottom: 1px dashed #333; padding-bottom:2px;">Active Trophies: ${unlockedCount} / ${totalCount}</div>`,
    ];

    let combatStats = [];
    if (aT.atk > 0 || aT.atkPct > 0)
      combatStats.push(`Atk: +${aT.atk} (${(aT.atkPct * 100).toFixed(1)}%)`);
    if (aT.maxHp > 0 || aT.maxHpPct > 0)
      combatStats.push(`HP: +${aT.maxHp} (${(aT.maxHpPct * 100).toFixed(1)}%)`);
    if (aT.def > 0 || aT.defPct > 0)
      combatStats.push(`Def: +${aT.def} (${(aT.defPct * 100).toFixed(1)}%)`);
    if (aT.moveSpeed > 0 || aT.moveSpeedPct > 0)
      combatStats.push(
        `Spd: +${aT.moveSpeed.toFixed(1)} (${(aT.moveSpeedPct * 100).toFixed(1)}%)`,
      );
    if (combatStats.length > 0)
      lines.push(
        `<div style="color:#e74c3c; font-weight:bold; margin-top:4px;">⚔️ COMBAT MULTIPLIERS</div>` +
          combatStats.join("<br>"),
      );

    let attrStats = [];
    if (aT.str > 0 || aT.strPct > 0)
      attrStats.push(`STR: +${aT.str} (${(aT.strPct * 100).toFixed(1)}%)`);
    if (aT.dex > 0 || aT.dexPct > 0)
      attrStats.push(`DEX: +${aT.dex} (${(aT.dexPct * 100).toFixed(1)}%)`);
    if (aT.int > 0 || aT.intPct > 0)
      attrStats.push(`INT: +${aT.int} (${(aT.intPct * 100).toFixed(1)}%)`);
    if (aT.critChance > 0)
      attrStats.push(`Crit %: +${(aT.critChance * 100).toFixed(1)}%`);
    if (aT.critDamage > 0)
      attrStats.push(`Crit Dmg: +${(aT.critDamage * 100).toFixed(1)}%`);
    if (aT.block > 0)
      attrStats.push(`Block %: +${(aT.block * 100).toFixed(1)}%`);
    if (aT.parry > 0)
      attrStats.push(`Parry %: +${(aT.parry * 100).toFixed(1)}%`);
    if (attrStats.length > 0)
      lines.push(
        `<div style="color:#3498db; font-weight:bold; margin-top:4px;">💪 CORE ATTRIBUTES & CRITS</div>` +
          attrStats.join("<br>"),
      );

    let utilStats = [];
    if (aT.gold > 0)
      utilStats.push(`Gold Mult: +${(aT.gold * 100).toFixed(1)}%`);
    if (aT.drop > 0)
      utilStats.push(`Drop Rate: +${(aT.drop * 100).toFixed(1)}%`);
    if (aT.qly > 0)
      utilStats.push(`Drop Quality: +${(aT.qly * 100).toFixed(1)}%`);
    if (aT.fairySpawn > 0)
      utilStats.push(`Fairy Spawn: +${(aT.fairySpawn * 100).toFixed(1)}%`);
    if (aT.rareSpawn > 0)
      utilStats.push(`Rare Spawn: +${(aT.rareSpawn * 100).toFixed(2)}%`);
    if (aT.expPct > 0)
      utilStats.push(`EXP Rate: +${(aT.expPct * 100).toFixed(0)}%`);
    if (combatStats.length > 0 || attrStats.length > 0 || utilStats.length > 0)
      lines.push(
        `<div style="color:#2ecc71; font-weight:bold; margin-top:4px;">🍀 UTILITY MODS</div>` +
          utilStats.join("<br>"),
      );

    sumSummaryEl.innerHTML = lines.join("<br>");
  }

  // Real-time synchronization of custom Salvage Pad buttons
  if (typeof window.updateSalvagePadUI === "function") {
    window.updateSalvagePadUI();
  }

  // 5. Backpack details update
  let capCount = window.inventory.EQUIP.length;
  let capMax = window.getMaxBagSlots();
  let capBtn = document.getElementById("btn-bag-count");
  if (capBtn) capBtn.innerText = capCount;
  let capMaxBtn = document.getElementById("btn-bag-max");
  if (capMaxBtn) capMaxBtn.innerText = capMax;

  let artCount = window.inventory.ARTIFACT
    ? window.inventory.ARTIFACT.length
    : 0;
  let artBtn = document.getElementById("btn-art-count");
  if (artBtn) artBtn.innerText = artCount;
  let artMaxBtn = document.getElementById("btn-art-max");
  if (artMaxBtn) artMaxBtn.innerText = capMax;

  let sigilCount = window.inventory.SIGIL ? window.inventory.SIGIL.length : 0;
  let sigilBtn = document.getElementById("btn-sigil-count");
  if (sigilBtn) sigilBtn.innerText = sigilCount;
  let sigilMaxBtn = document.getElementById("btn-sigil-max");
  if (sigilMaxBtn) sigilMaxBtn.innerText = capMax;

  window.renderPaperDoll();
  window.renderInventory();

  // Invalidate the player stats cache on any UI update to force clean computations on state change
  window.invalidatePlayerStats();

  // Auto-refresh tooltip
  if (window.activeStatTooltip) {
    window.refreshActiveStatTooltip();
  }

  // Refreshes the medal banner on UI state changes instead of rendering inside a 60 FPS loop
  if (typeof window.updateMedalBanner === "function") {
    window.updateMedalBanner();
  }
  if (typeof window.updateSpectralReliquaryBanner === "function") {
    window.updateSpectralReliquaryBanner();
  }
  if (typeof window.renderActiveEffectsHudBar === "function") {
    window.renderActiveEffectsHudBar();
  }
};

// --- ATTRIBUTES MATRIX CONTROLS ---

window.startSPDraftHold = function (e, statKey, direction) {
  e.preventDefault();
  window.ensureDraftInitialized();
  if (window.draftSP <= 0 && direction > 0) return;

  window.adjustSPDraft(statKey, direction, 1);

  if (window.draftHoldTimeout) clearTimeout(window.draftHoldTimeout);

  let tickCount = 0;
  const tick = () => {
    tickCount++;
    // Gradually escalate chunk sizes for massive SP pools
    let amount = 1;
    if (tickCount > 35) amount = 25;
    else if (tickCount > 15) amount = 5;

    // Accelerate distribution frequency
    let delay = Math.max(30, 150 - tickCount * 8);

    let committed = window.playerStats.spAllocations[statKey] || 0;
    let limit =
      direction > 0
        ? window.draftSP
        : window.draftAllocations[statKey] - committed;

    let actualAmt = Math.min(amount, limit);
    if (actualAmt > 0) {
      window.adjustSPDraft(statKey, direction, actualAmt);
      window.draftHoldTimeout = setTimeout(tick, delay);
    } else {
      window.stopSPDraftHold();
    }
  };

  window.draftHoldTimeout = setTimeout(tick, 150);
};

window.stopSPDraftHold = function (e) {
  if (e) e.stopPropagation();
  if (window.draftHoldTimeout) {
    clearTimeout(window.draftHoldTimeout);
    window.draftHoldTimeout = null;
  }
};

window.adjustSPDraft = function (statKey, direction, amount = 1) {
  window.ensureDraftInitialized();
  if (direction > 0) {
    let actual = Math.min(amount, window.draftSP);
    if (actual > 0) {
      window.draftSP -= actual;
      window.draftAllocations[statKey] += actual;
    }
  } else {
    let committed = window.playerStats.spAllocations[statKey] || 0;
    let limit = window.draftAllocations[statKey] - committed;
    let actual = Math.min(amount, limit);
    if (actual > 0) {
      window.draftSP += actual;
      window.draftAllocations[statKey] -= actual;
    }
  }
  window.updateUI();
};

window.ensureDraftInitialized = function () {
  if (window.draftAllocations === null) {
    window.draftAllocations = { ...window.playerStats.spAllocations };
    window.draftSP = window.playerStats.sp;
  }
};

window.resetDraft = function () {
  window.showCustomConfirm(
    "Discard Changes",
    "Are you sure you want to discard your pending attribute changes?",
    "Discard",
    "Keep Drafting",
    "#e67e22",
    function () {
      window.draftAllocations = null;
      window.draftSP = 0;
      window.pushHeaderToast("🧹 Draft Discarded", "#aaa");
      window.updateUI();
    },
  );
};

window.showSPConfirmationModal = function () {
  if (!window.draftAllocations) return;
  let current = window.resolvePlayerStats(false);
  let preview = window.resolvePlayerStats(true);
  let totalInvested = window.playerStats.sp - window.draftSP;
  if (totalInvested <= 0) return;

  let modal = document.createElement("div");
  modal.id = "sp-confirm-modal";
  modal.style.position = "fixed";
  modal.style.top = "0";
  modal.style.left = "0";
  modal.style.width = "100%";
  modal.style.height = "100%";
  modal.style.backgroundColor = "rgba(0,0,0,0.85)";
  modal.style.display = "flex";
  modal.style.justifyContent = "center";
  modal.style.alignItems = "center";
  modal.style.zIndex = "30000";
  modal.style.padding = "15px";

  let diffs = [];
  let statsToCheck = [
    { key: "str", label: "💪 Strength", isPct: false },
    { key: "dex", label: "🎯 Dexterity", isPct: false },
    { key: "int", label: "🧠 Intelligence", isPct: false },
    { key: "atk", label: "⚔️ Attack", isPct: false },
    { key: "maxHp", label: "❤️ Max HP", isPct: false },
    { key: "def", label: "🛡️ Defense", isPct: false },
    { key: "moveSpeed", label: "👟 Move Speed", isPct: false },
    { key: "critChance", label: "✨ Crit Chance", isPct: true },
    { key: "critDamage", label: "💥 Crit Multiplier", isPct: true },
    { key: "block", label: "🛡️ Block Rate", isPct: true },
    { key: "parry", label: "⚡ Parry Rate", isPct: true },
  ];

  statsToCheck.forEach((s) => {
    let curVal = current[s.key] || 0;
    let newVal = preview[s.key] || 0;
    let diff = newVal - curVal;
    if (Math.abs(diff) > 0.0001) {
      let curStr = s.isPct
        ? Math.round(curVal * 100) + "%"
        : window.formatNumber(curVal);
      let newStr = s.isPct
        ? Math.round(newVal * 100) + "%"
        : window.formatNumber(newVal);
      let diffStr = s.isPct
        ? "+" + Math.round(diff * 100) + "%"
        : "+" + window.formatNumber(diff);
      diffs.push(`
                <div style="display:flex; justify-content:space-between; align-items:center; font-size:12px; margin-bottom:6px; font-family:monospace; background:rgba(255,255,255,0.02); padding:6px 10px; border-radius:4px; border:1px solid #222;">
                    <span style="color:#aaa; font-weight:bold;">${s.label}:</span>
                    <span>
                        <span style="color:#7f8c8d;">${curStr}</span> ➔
                        <strong style="color:#fff;">${newStr}</strong>
                        <span style="color:#2ecc71; font-weight:bold; margin-left:6px;">(${diffStr})</span>
                    </span>
                </div>
            `);
    }
  });

  modal.innerHTML = `
        <div style="background:#1a1a1a; border: 2px solid var(--accent-orange); border-radius: 8px; width:100%; max-width:380px; display:flex; flex-direction:column; box-shadow: 0 10px 30px rgba(0,0,0,0.95); animation: toastFadeIn 0.3s; overflow:hidden;">
            <div style="background:#0c0f12; border-bottom: 1px solid #333; padding:12px 15px; text-align:center;">
                <h3 style="margin:0; color:var(--accent-orange); font-size:15px; font-weight:bold; letter-spacing:1px; text-transform:uppercase;">Confirm Stat Allocations</h3>
            </div>
            <div style="padding:15px; max-height:60vh; overflow-y:auto; overscroll-behavior:contain;">
                <div style="text-align:center; font-size:13px; color:#aaa; margin-bottom:12px;">
                    You are about to invest <strong style="color:var(--text-gold); font-size:15px;">${totalInvested} Skill Points</strong>.
                    <div style="font-size: 10px; color: #888; margin-top: 4px;">(Each SP grants 3 points to the chosen attribute)</div>
                </div>
                <div style="display:flex; flex-direction:column; gap:4px;">${diffs.join("")}</div>
                <div style="margin-top:12px; font-size:10px; color:#7f8c8d; text-align:center; line-height:1.4;">
                    Once committed, resetting these stats will require spending an SP Reset Scroll.
                </div>
            </div>
            <div style="background:#0c0f12; border-top: 1px solid #333; padding:12px; display:flex; gap:10px; justify-content:center;">
                <button style="flex:1; background:#c0392b; color:white; border:none; padding:10px; font-weight:bold; border-radius:4px; cursor:pointer;" onclick="document.getElementById('sp-confirm-modal').remove()">Cancel</button>
                <button style="flex:1; background:#2ecc71; color:white; border:none; padding:10px; font-weight:bold; border-radius:4px; cursor:pointer;" onclick="window.commitSPDraft()">Confirm & Save</button>
            </div>
        </div>
    `;
  document.body.appendChild(modal);
};

window.commitSPDraft = function () {
  if (!window.draftAllocations) return;

  window.playerStats.spAllocations = { ...window.draftAllocations };
  window.playerStats.sp = window.draftSP;
  window.draftAllocations = null;
  window.draftSP = 0;

  let p = window.resolvePlayerStats();
  window.playerStats.currentHp = Math.min(
    window.playerStats.currentHp,
    p.maxHp,
  );

  let modal = document.getElementById("sp-confirm-modal");
  if (modal) modal.remove();

  window.pushHeaderToast("🎉 Attributes Committed & Saved!", "#2ecc71");
  window.pushLog(
    "<span style='color:#2ecc71; font-weight:bold;'>[STATS] Committed drafted attribute points permanently. Game Saved!</span>",
  );
  window.updateUI();
  window.saveGame();
};

window.showSPPreview = function (e, statKey) {
  e.stopPropagation();
  let tt = document.getElementById("stat-tooltip");
  if (!tt) return;

  let labelMap = {
    spStr: "💪 Strength",
    spDex: "🎯 Dexterity",
    spInt: "🧠 Intelligence",
  };
  let statAllocName = labelMap[statKey] || "Attribute";

  window.ensureDraftInitialized();
  window.draftAllocations[statKey]++;
  let preview = window.resolvePlayerStats(true);
  window.draftAllocations[statKey]--;
  let current = window.resolvePlayerStats(true);

  let html = `<div style="padding: 10px; width: 230px; box-sizing: border-box;">
        <div class="tt-title" style="color:var(--accent-orange); font-size:12px; margin-bottom:4px; border-bottom:1px solid #333; padding-bottom:2px;">SP Allocation Preview</div>
        <div class="tt-subtitle" style="color:#aaa; font-style:normal; margin-bottom: 8px;">Allocating 1 SP into <strong>${statAllocName}</strong>:</div>`;

  let diffs = [];
  let statsToCheck = [
    { key: "str", label: "💪 STR", isPct: false },
    { key: "dex", label: "🎯 DEX", isPct: false },
    { key: "int", label: "🧠 INT", isPct: false },
    { key: "atk", label: "⚔️ Attack", isPct: false },
    { key: "maxHp", label: "❤️ Max HP", isPct: false },
    { key: "def", label: "🛡️ Defense", isPct: false },
    { key: "moveSpeed", label: "👟 Move Speed", isPct: false },
    { key: "critChance", label: "✨ Crit Chance", isPct: true },
    { key: "critDamage", label: "💥 Crit Multi", isPct: true },
    { key: "block", label: "🛡️ Block Rate", isPct: true },
    { key: "parry", label: "⚡ Parry Rate", isPct: true },
  ];

  statsToCheck.forEach((s) => {
    let curVal = current[s.key] || 0;
    let newVal = preview[s.key] || 0;
    let diff = newVal - curVal;
    if (Math.abs(diff) > 0.0001) {
      let curStr = s.isPct
        ? Math.round(curVal * 100) + "%"
        : window.formatNumber(curVal);
      let newStr = s.isPct
        ? Math.round(newVal * 100) + "%"
        : window.formatNumber(newVal);
      let diffStr = s.isPct
        ? "+" + Math.round(diff * 100) + "%"
        : "+" + window.formatNumber(diff);
      diffs.push(`
                <div style="display:flex; justify-content:space-between; align-items:center; font-size:11px; margin-bottom:4px; font-family:monospace;">
                    <span style="color:#aaa;">${s.label}:</span>
                    <span>
                        <span style="color:#7f8c8d;">${curStr}</span> ➔
                        <strong style="color:#fff;">${newStr}</strong>
                        <span style="color:#2ecc71; font-weight:bold; margin-left:4px;">(${diffStr})</span>
                    </span>
                </div>
            `);
    }
  });

  html +=
    diffs.length === 0
      ? `<div style="color:#aaa; font-style:italic; font-size:11px; text-align:center;">No changes.</div>`
      : diffs.join("");
  html += `</div>`;
  tt.style.borderColor = "var(--accent-orange)";
  tt.innerHTML = html;
  tt.style.display = "block";
  window.positionTooltip(e, tt);
};

// --- LOG & TOAST SYSTEMS ---

// Lightweight cloner to replace expensive JSON parse/stringify operations
window.cloneItemForTooltip = function (item) {
  if (!item) return null;
  let clone = { ...item };
  if (item.buffs) clone.buffs = item.buffs.map((b) => ({ ...b }));
  if (item.debuffs) clone.debuffs = item.debuffs.map((d) => ({ ...d }));
  if (item.enchantments) clone.enchantments = { ...item.enchantments };
  return clone;
};

window.logDOMDirty = false;

window.pushLog = function (text, itemId = null) {
  if (itemId !== null) {
    let item =
      window.inventory.EQUIP.find((i) => i.id === itemId) ||
      (window.inventory.ARTIFACT &&
        window.inventory.ARTIFACT.find((i) => i.id === itemId));
    if (!item) {
      for (let k in window.equippedSlots) {
        if (window.equippedSlots[k] && window.equippedSlots[k].id === itemId)
          item = window.equippedSlots[k];
      }
    }
    if (item) {
      window.frozenItemDb[itemId] = window.cloneItemForTooltip(item);
      text = text.replace(
        item.name,
        `<span class="log-item-link" onmouseenter="window.showLogTooltip(event, ${itemId})" onmouseleave="window.hideTooltip()">${item.name}</span>`,
      );
    }
  }
  window.logsHistory.unshift(text);
  if (window.logsHistory.length > 50) window.logsHistory.pop();

  window.logDOMDirty = true;
};

// Batch log box updates at 10 FPS (100ms) to eliminate browser layout thrashing
setInterval(() => {
  if (window.logDOMDirty) {
    let box = document.getElementById("log-box");
    if (box) {
      box.innerHTML = window.logsHistory.join("<br><br>");
    }
    window.logDOMDirty = false;
  }
}, 100);

window.pushToast = function (
  name,
  stars,
  color,
  isEtc = false,
  quantity = 1,
  customText = null,
  clickAction = null,
  isMilestone = false,
  item = null,
) {
  let container = document.getElementById("toast-container");
  if (!container) return;

  let toast = document.createElement("div");
  toast.className = "premium-toast";
  toast.style.setProperty("--toast-rarity-color", color || "#7f8c8d");

  let rgb = "155, 89, 182";
  if (color && color.charAt(0) === "#" && window.hexToRgbValues) {
    rgb = window.hexToRgbValues(color);
  }
  toast.style.setProperty("--toast-glow-color", `rgba(${rgb}, 0.2)`);

  // Enable pointer-events on all toasts to support swipe-to-dismiss gestures
  toast.style.pointerEvents = "auto";
  if (clickAction) {
    toast.style.cursor = "pointer";
    toast.onclick = function (e) {
      e.stopPropagation();
      clickAction();
      toast.remove();
    };
  }

  function guessItemType(n) {
    let lowerName = n.toLowerCase();
    if (
      lowerName.includes("staff") ||
      lowerName.includes("sword") ||
      lowerName.includes("glaive") ||
      lowerName.includes("reaver") ||
      lowerName.includes("greatsword") ||
      lowerName.includes("halberd") ||
      lowerName.includes("axe") ||
      lowerName.includes("mace") ||
      lowerName.includes("hammer") ||
      lowerName.includes("blade")
    ) {
      return "weapon";
    }
    if (
      lowerName.includes("shield") ||
      lowerName.includes("buckler") ||
      lowerName.includes("aegis") ||
      lowerName.includes("bulwark") ||
      lowerName.includes("dagger") ||
      lowerName.includes("kris") ||
      lowerName.includes("stiletto") ||
      lowerName.includes("dirk") ||
      lowerName.includes("gauche") ||
      lowerName.includes("tome") ||
      lowerName.includes("book") ||
      lowerName.includes("codex") ||
      lowerName.includes("lexicon") ||
      lowerName.includes("chronicle") ||
      lowerName.includes("watch")
    ) {
      return "subweapon";
    }
    if (
      lowerName.includes("helm") ||
      lowerName.includes("visor") ||
      lowerName.includes("circlet") ||
      lowerName.includes("crown")
    )
      return "helmet";
    if (
      lowerName.includes("hauberk") ||
      lowerName.includes("cuirass") ||
      lowerName.includes("brigandine") ||
      lowerName.includes("plate") ||
      lowerName.includes("chest")
    )
      return "chest";
    if (
      lowerName.includes("greaves") ||
      lowerName.includes("leg") ||
      lowerName.includes("chausses") ||
      lowerName.includes("cui")
    )
      return "leggings";
    if (
      lowerName.includes("boot") ||
      lowerName.includes("sabatons") ||
      lowerName.includes("sollerets") ||
      lowerName.includes("treads")
    )
      return "boots";
    if (
      lowerName.includes("exosuit") ||
      lowerName.includes("robe") ||
      lowerName.includes("suit") ||
      lowerName.includes("trench") ||
      lowerName.includes("overall")
    )
      return "overall";
    return "weapon";
  }

  function guessItem(n, s) {
    if (s === "UNIQUE") {
      let lower = n.toLowerCase();
      let art = window.ARTIFACT_POOL
        ? window.ARTIFACT_POOL.find((a) => lower.includes(a.name.toLowerCase()))
        : null;
      return {
        type: "artifact",
        statsRolled: "UNIQUE",
        trait: art ? art.trait : "frenzy",
      };
    }
    let tType = guessItemType(n);
    let sType = null;
    if (tType === "subweapon") {
      let lower = n.toLowerCase();
      if (
        lower.includes("shield") ||
        lower.includes("buckler") ||
        lower.includes("aegis") ||
        lower.includes("bulwark")
      ) {
        sType = "shield";
      } else if (
        lower.includes("dagger") ||
        lower.includes("kris") ||
        lower.includes("stiletto") ||
        lower.includes("dirk") ||
        lower.includes("gauche")
      ) {
        sType = "dagger";
      } else {
        sType = "tome";
      }
    }

    // Dynamically extract the underlying noun from the name to populate custom icons on toasts
    let foundNoun = "";
    if (window.slotNouns) {
      let flatNouns = [];
      for (let k in window.slotNouns) {
        if (k === "subweapon") {
          for (let sk in window.slotNouns.subweapon) {
            flatNouns = flatNouns.concat(window.slotNouns.subweapon[sk]);
          }
        } else {
          flatNouns = flatNouns.concat(window.slotNouns[k]);
        }
      }
      for (let noun of flatNouns) {
        if (n.includes(noun)) {
          foundNoun = noun;
          break;
        }
      }
    }

    let mock = {
      id: Math.floor(Math.random() * 1000000),
      name: n,
      type: tType,
      subType: sType,
      statsRolled: s,
      noun: foundNoun,
    };
    let lower = n.toLowerCase();
    if (lower.includes("phoenix")) mock.isUniqueStaff = true;
    if (lower.includes("sanguine") || lower.includes("reaver"))
      mock.isUniqueSword = true;
    if (lower.includes("sovereign") || lower.includes("singularity"))
      mock.isUniqueSingularity = true;
    if (lower.includes("gale-glaive") || lower.includes("maelstrom"))
      mock.isUniqueMaelstrom = true;
    if (lower.includes("bulwark") || lower.includes("aegis"))
      mock.isUniqueAegis = true;
    if (lower.includes("pocket-watch") || lower.includes("watch"))
      mock.isUniqueWatch = true;
    if (lower.includes("chronicle")) mock.isUniqueChronicle = true;
    if (lower.includes("warp-core") || lower.includes("greaves"))
      mock.isUniqueWarpCore = true;
    if (lower.includes("tempests") || lower.includes("crown"))
      mock.isUniqueTempest = true;
    return mock;
  }

  let iconHtml = "";
  if (customText && !name) {
    iconHtml = `<div style="width: 32px; height: 32px; background: rgba(52, 152, 219, 0.1); border: 1px solid rgba(52, 152, 219, 0.3); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 16px;">🔔</div>`;
  } else if (isEtc) {
    iconHtml = window.getEtcIconHtml ? window.getEtcIconHtml(name, 32) : "";
  } else if (window.useDex && window.useDex[name]) {
    iconHtml = window.getUseIconHtml ? window.getUseIconHtml(name, 32) : "";
  } else if (name) {
    let itemObj = item || guessItem(name, stars);
    iconHtml = window.getEquipIconHtml
      ? window.getEquipIconHtml(itemObj, 32)
      : "";
  }

  let contentHtml = "";
  if (isMilestone) {
    let stageNum =
      typeof isMilestone === "number"
        ? isMilestone
        : window.playerStats.maxStage;
    toast.style.setProperty("--toast-rarity-color", "#f1c40f");
    toast.style.setProperty("--toast-glow-color", "rgba(241, 196, 15, 0.2)");
    let starsLabel = stars === "UNIQUE" ? "UNIQUE" : `${stars}★`;
    contentHtml = `
      <div style="flex:1; min-width:0; display:flex; flex-direction:column; gap:2px;">
        <span style="color: #f1c40f; font-size: 8px; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 900; text-shadow: 0 0 6px rgba(241, 196, 15, 0.35);">🏆 Milestone Decrypted</span>
        <span style="font-size: 12.5px; color: ${color}; font-weight: 900; text-shadow: 0 0 8px rgba(${rgb}, 0.2); overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${name}</span>
        <span style="font-size: 9px; color: #94a3b8; font-family: monospace;">Stage ${stageNum} Cleared • Quality ${starsLabel}</span>
      </div>
    `;
  } else if (customText) {
    contentHtml = `<div style="flex:1; min-width:0; line-height:1.4; font-size:11px; color:#f1f5f9; font-weight:600;">${customText}</div>`;
  } else {
    let label = isEtc
      ? `📦 +${quantity} Loot`
      : stars === "UNIQUE"
        ? "⭐ UNIQUE DETECTED!"
        : `⚔️ ITEM FOUND (${stars}★)`;
    contentHtml = `
      <div style="flex:1; min-width:0; display:flex; flex-direction:column; gap:2px;">
        <span style="font-size: 8px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; font-weight: 800;">${label}</span>
        <span style="font-size: 12px; color: ${color}; font-weight: 800; letter-spacing: 0.2px; text-shadow: 0 0 8px rgba(${rgb}, 0.25); overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${name}</span>
      </div>
    `;
  }

  toast.innerHTML = `
    <div class="premium-toast-shine"></div>
    ${iconHtml ? `<div style="flex-shrink:0; display:inline-flex; align-items:center; justify-content:center; position:relative; z-index:2;">${iconHtml}</div>` : ""}
    <div style="flex:1; min-width:0; position:relative; z-index:2;">${contentHtml}</div>
  `;

  container.prepend(toast);

  if (container.children.length > 5) {
    let oldest = container.lastElementChild;
    if (oldest) oldest.remove();
  }

  setTimeout(() => {
    toast.style.animation = "toastFadeOut 0.5s ease-in forwards";
    setTimeout(() => toast.remove(), 450);
  }, 3500);
};

window.pushHeaderToast = function (text, color, clickAction = null) {
  window.pushToast("", null, color, false, 0, text, clickAction);
};

// --- DIALOGS, DROPDOWNS, AND CONFIRMATIONS ---

window.toggleDungeonMenu = function () {
  let menu = document.getElementById("dungeon-menu");
  if (menu) {
    menu.style.display = menu.style.display === "none" ? "block" : "none";
  }
};

window.toggleAudioMenu = function () {
  let menu = document.getElementById("audio-menu");
  if (menu) {
    menu.style.display = menu.style.display === "none" ? "block" : "none";
    window.updateAudioUI();
  }
};

window.updateAudioUI = function () {
  let masterSlider = document.getElementById("slider-vol-master");
  let sfxSlider = document.getElementById("slider-vol-sfx");
  let masterLabel = document.getElementById("vol-master-label");
  let sfxLabel = document.getElementById("vol-sfx-label");
  let muteBtn = document.getElementById("btn-audio-mute");

  if (masterSlider) masterSlider.value = window.playerStats.volumeMaster;
  if (sfxSlider) sfxSlider.value = window.playerStats.volumeSFX;
  if (masterLabel)
    masterLabel.innerText =
      Math.round(window.playerStats.volumeMaster * 100) + "%";
  if (sfxLabel)
    sfxLabel.innerText = Math.round(window.playerStats.volumeSFX * 100) + "%";
  if (muteBtn) {
    if (window.playerStats.mute) {
      muteBtn.innerText = "Unmute Audio";
      muteBtn.style.background = "#2ecc71";
    } else {
      muteBtn.innerText = "Mute Audio";
      muteBtn.style.background = "#c0392b";
    }
  }
};

window.changeVolume = function (type, val) {
  let numVal = parseFloat(val);
  if (type === "master") {
    window.playerStats.volumeMaster = numVal;
    setText("vol-master-label", Math.round(numVal * 100) + "%");
  } else if (type === "sfx") {
    window.playerStats.volumeSFX = numVal;
    setText("vol-sfx-label", Math.round(numVal * 100) + "%");
  }
  window.SoundManager.updateVolumes();
  window.saveGame();
};

window.toggleMute = function () {
  window.playerStats.mute = !window.playerStats.mute;
  window.updateAudioUI();
  window.SoundManager.updateVolumes();
  window.saveGame();
};

window.showCustomConfirm = function (
  title,
  message,
  confirmText,
  cancelText,
  accentColor,
  onConfirm,
  onCancel,
) {
  let wasPaused = window.isGamePaused;
  window.setPauseState(true);

  let overlay = document.createElement("div");
  overlay.style.position = "fixed";
  overlay.style.top = "0";
  overlay.style.left = "0";
  overlay.style.width = "100%";
  overlay.style.height = "100%";
  overlay.style.backgroundColor = "rgba(8, 2, 2, 0.88)";
  overlay.style.display = "flex";
  overlay.style.justifyContent = "center";
  overlay.style.alignItems = "center";
  overlay.style.zIndex = "40000";
  overlay.style.backdropFilter = "blur(5px)";
  overlay.style.animation = "deathFadeIn 0.25s ease-out";

  let card = document.createElement("div");
  card.style.background = "linear-gradient(135deg, #151515, #0a0a0c)";
  card.style.border = `2px solid ${accentColor}`;
  card.style.borderRadius = "8px";
  card.style.padding = "20px";
  card.style.width = "90%";
  card.style.maxWidth = "400px";
  card.style.boxShadow = `0 10px 35px rgba(0,0,0,0.95), inset 0 0 15px ${accentColor}25`;
  card.style.textAlign = "center";
  card.style.animation =
    "deathCardPop 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.1)";

  card.innerHTML = `
        <div style="font-size: 16px; font-weight: bold; color: ${accentColor}; letter-spacing: 1.5px; margin-bottom: 8px; text-transform: uppercase;">${title}</div>
        <div style="height: 1px; background: linear-gradient(90deg, transparent, ${accentColor}, transparent); margin: 8px 0 15px 0;"></div>
        <div style="font-size: 11.5px; color: #cbd5e1; line-height: 1.55; margin-bottom: 20px; white-space: normal; text-align: center;">${message}</div>
        <div style="display: flex; gap: 10px;">
            <button id="cust-btn-cancel" class="nav-btn" style="flex: 1; justify-content: center; background: #222; border: 1px solid #444; color: #aaa; padding: 10px; font-size:11px; font-weight:bold; border-radius:4px; height: auto;">${cancelText || "Cancel"}</button>
            <button id="cust-btn-commit" class="nav-btn" style="flex: 1; justify-content: center; background: ${accentColor}; border: 1px solid ${accentColor}; color: white; padding: 10px; font-size:11px; font-weight:bold; border-radius:4px; height: auto;">${confirmText || "Confirm"}</button>
        </div>
    `;
  overlay.appendChild(card);
  document.body.appendChild(overlay);

  const cleanup = () => {
    overlay.style.animation = "toastFadeOut 0.18s ease-in forwards";
    setTimeout(() => {
      overlay.remove();
      if (!wasPaused) window.setPauseState(false);
    }, 170);
  };
  card.querySelector("#cust-btn-cancel").onclick = (e) => {
    e.stopPropagation();
    cleanup();
    if (onCancel) onCancel();
  };
  card.querySelector("#cust-btn-commit").onclick = (e) => {
    e.stopPropagation();
    cleanup();
    if (onConfirm) onConfirm();
  };
};

window.addEtcDrop = function (itemName, amount = 1) {
  if (!window.inventory.ETC[itemName]) {
    window.inventory.ETC[itemName] = 0;
  }
  window.inventory.ETC[itemName] += amount;
  if (typeof window.renderInventory === "function") window.renderInventory();
};

window.addUseDrop = function (itemName, amount = 1) {
  if (!window.inventory.USE[itemName]) {
    window.inventory.USE[itemName] = 0;
  }
  window.inventory.USE[itemName] += amount;
  if (typeof window.renderInventory === "function") window.renderInventory();
};

window.setPauseState = function (paused) {
  window.isGamePaused = paused;
};

window.togglePause = function () {
  // Deprecated and fully disabled
};

window.toggleAuto = function () {
  window.state.autoAttack = !window.state.autoAttack;
  let btn = document.getElementById("toggle-auto");
  if (btn) {
    btn.innerText = window.state.autoAttack ? "Auto: ON" : "Auto: OFF";
    btn.className = window.state.autoAttack
      ? "btn-toggle active"
      : "btn-toggle";
  }
  window.state.efficiency = window.state.autoAttack ? 1.0 : 1.05;
  if (typeof window.updateUI === "function") window.updateUI();
};

window.updateStickyCanvasStyle = function () {
  let active = window.playerStats.stickyCanvas !== false;
  let btn = document.getElementById("settings-toggle-sticky");
  let canvasContainer = document.getElementById("canvas-container");
  let canvasEl = document.getElementById("gameCanvas");
  let containerEl = document.getElementById("game-container");

  if (btn) {
    btn.innerText = active ? "Sticky Cam: ON" : "Sticky Cam: OFF";
    btn.className = active ? "btn-action" : "btn-action un";
  }

  if (canvasEl) {
    canvasEl.style.position = "static";
  }

  if (canvasContainer) {
    canvasContainer.style.position = active ? "sticky" : "relative";
    canvasContainer.style.top = active ? "0" : "";
    canvasContainer.style.zIndex = active ? "999" : "";
  }

  if (containerEl) {
    containerEl.style.overflow = active ? "visible" : "";
  }
};

window.toggleStickyCanvas = function () {
  window.playerStats.stickyCanvas = !window.playerStats.stickyCanvas;
  window.updateStickyCanvasStyle();

  if (window.HoorTutorial) {
    window.HoorTutorial.init();
  }
  if (typeof window.saveGame === "function") window.saveGame();
};

window.updateChatStyle = function () {
  let drawer = document.getElementById("premium-chat-drawer");
  if (!drawer) return;

  drawer.style.position = "fixed";
  drawer.style.zIndex = "1050";
  drawer.style.bottom = "auto";
  drawer.style.right = "auto";

  let x = window.playerStats.chatX;
  let y = window.playerStats.chatY;
  if (x !== null && y !== null) {
    drawer.style.left = x + "px";
    drawer.style.top = y + "px";
  } else {
    let defLeft = window.innerWidth - 320;
    let defTop = window.innerHeight - 280;
    if (defLeft < 10) defLeft = 10;
    if (defTop < 10) defTop = 10;
    drawer.style.left = defLeft + "px";
    drawer.style.top = defTop + "px";
    window.playerStats.chatX = defLeft;
    window.playerStats.chatY = defTop;
  }

  window.initChatDrag();
};

window.initChatDrag = function () {
  let drawer = document.getElementById("premium-chat-drawer");
  let header = document.getElementById("premium-chat-header");
  if (!drawer || !header) return;
  window.makeWindowDraggable(drawer, header);
};

window.toggleSettings = function () {
  let modal = document.getElementById("settings-modal");
  if (!modal) return;
  if (modal.style.display === "none" || modal.style.display === "") {
    window.hideTooltip();
    modal.style.display = "block";
    window.updateAudioUI();
    window.updateStickyCanvasStyle();
    window.updateChatStyle();
    window.updateEcoModeStyle();

    // Populate and display current character name
    let nameInput = document.getElementById("settings-player-name");
    if (nameInput) {
      nameInput.value = window.playerStats.playerName || "Guest";
    }
    let nameLabel = document.getElementById("current-name-label");
    if (nameLabel) {
      nameLabel.innerText = `(Current: ${window.playerStats.playerName || "Guest"})`;
    }
  } else {
    modal.style.display = "none";
    window.hideTooltip();
  }
};

window.leaveActivity = function () {
  if (!window.playerStats.isDungeonMode && !window.playerStats.isCrucibleMode) {
    if (typeof window.pushHeaderToast === "function")
      window.pushHeaderToast(
        "You are not currently in an activity!",
        "#e74c3c",
      );
    return;
  }
  window.showCustomConfirm(
    "Retreat to Campaign",
    "Are you sure you want to retreat to the Campaign? You will keep your current progress and earn prorated rewards.",
    "Retreat",
    "Stay",
    "#e74c3c",
    function () {
      let p = window.resolvePlayerStats();

      if (window.playerStats.isCrucibleMode) {
        let finalWave = window.playerStats.crucibleWave || 1;
        window.playerStats.cruciblePeak = Math.max(
          window.playerStats.cruciblePeak || 1,
          finalWave,
        );

        let shards = window.playerStats.crucibleAccumulatedShards || 0;
        let cores = window.playerStats.crucibleAccumulatedCores || 0;
        let gold = window.playerStats.crucibleAccumulatedGold || 0;
        let xp = window.playerStats.crucibleAccumulatedXp || 0;

        // Safe Retreat credits 100% of accumulated rewards
        window.playerStats.astralShards =
          (window.playerStats.astralShards || 0) + shards;
        if (cores > 0) window.addEtcDrop("Catalyst Core", cores);

        window.playerStats.coins += gold;
        window.playerStats.totalGoldEarned =
          (window.playerStats.totalGoldEarned || 0) + gold;
        window.gainXp(xp, true);

        window.playerStats.crucibleAccumulatedShards = 0;
        window.playerStats.crucibleAccumulatedCores = 0;
        window.playerStats.crucibleAccumulatedGold = 0;
        window.playerStats.crucibleAccumulatedXp = 0;
        window.playerStats.crucibleRunActive = false;
        window.playerStats.crucibleDraftDeck = [];

        if (typeof window.pushLog === "function")
          window.pushLog(
            `<span style='color:#9b59b6; font-weight:bold;'>[CRUCIBLE RETREAT] Safely left the Crucible at Wave ${finalWave}. Claimed: ${shards} Shards, ${cores} Cores, ${gold.toLocaleString()} Gold, and ${xp.toLocaleString()} XP!</span>`,
          );
        if (typeof window.pushHeaderToast === "function")
          window.pushHeaderToast(
            `🏃 Crucible Cleared! Wave ${finalWave}`,
            "#9b59b6",
          );

        if (typeof window.showCrucibleSummaryModal === "function")
          window.showCrucibleSummaryModal(
            finalWave,
            shards,
            cores,
            gold,
            xp,
            false,
          );
      } else if (window.playerStats.isDungeonMode) {
        let dType = window.playerStats.currentDungeon;
        let dStage = window.playerStats.currentDungeonStage[dType] || 1;
        window.playerStats.dungeonPeaks[dType] = Math.max(
          window.playerStats.dungeonPeaks[dType] || 1,
          dStage,
        );

        let gold = window.playerStats.dungeonAccumulatedGold || 0;
        let xp = window.playerStats.dungeonAccumulatedXp || 0;
        let loot = window.playerStats.dungeonAccumulatedLoot || [];

        if (typeof window.pushLog === "function")
          window.pushLog(
            `<span style='color:#8e44ad; font-weight:bold;'>[DUNGEON RETREAT] Safely retreated from ${dType.toUpperCase()} Dungeon at Stage ${dStage}.</span>`,
          );
        if (typeof window.pushHeaderToast === "function")
          window.pushHeaderToast(`🏃 Retreated! Stage ${dStage}`, "#8e44ad");

        window.playerStats.dungeonAccumulatedGold = 0;
        window.playerStats.dungeonAccumulatedXp = 0;
        window.playerStats.dungeonAccumulatedLoot = [];

        if (typeof window.showDungeonSummaryModal === "function") {
          window.showDungeonSummaryModal(dType, dStage, gold, xp, loot, false);
        }
      }

      window.playerStats.isDungeonMode = false;
      window.playerStats.isCrucibleMode = false;
      window.playerStats.currentDungeon = null;
      window.playerStats.activeDungeonSigil = null; // Clear active sigil
      window.mob = null;
      window.playerStats.usedSecondWind = false;
      window.hero.x = 40;

      window.playerStats.runKills = 0;
      window.playerStats.runGold = 0;
      window.playerStats.runXp = 0;
      window.playerStats.killedBy = "Unknown Foe";
      window.playerStats.killedByMob = null;

      window.playerStats.currentHp = p.maxHp;
      if (typeof window.checkAchievements === "function")
        window.checkAchievements();
      if (typeof window.updateUI === "function") window.updateUI();
      if (typeof window.renderInventory === "function")
        window.renderInventory();
      if (typeof window.saveGame === "function") window.saveGame();
    },
  );
};

// --- DYNAMIC ATTRIBUTE HOVER TOOLTIPS ---

/* --- ACTIVE EFFECTS ENGINE & RETRO VECTOR BADGES --- */

window.getActiveEffects = function () {
  let list = [];
  let p = window.resolvePlayerStats();

  // 1. Standard Buffs
  if (window.playerStats.frenzyTimer > 0) {
    list.push({
      id: "frenzy",
      type: "buff",
      name: "Frenzy Mode",
      timer: window.playerStats.frenzyTimer,
      max: window.checkArtifactTrait("extend_buffs") ? 900 : 600,
      desc: "Critical Strike chance is set to 100%. Moves, slashes, and recovery timers execute at maximum active speed limits.",
    });
  }
  if (window.playerStats.adrenalineTimer > 0) {
    list.push({
      id: "adrenaline",
      type: "buff",
      name: "Adrenaline",
      timer: window.playerStats.adrenalineTimer,
      max: window.checkArtifactTrait("extend_buffs") ? 900 : 600,
      desc: "Doubles all outgoing base slash and spell damage output.",
    });
  }

  // 2. Potions
  let potMax = 18000 * (1 + p.int * 0.001);
  if (window.playerStats.atkPotionTimer > 0) {
    list.push({
      id: "atk_potion",
      type: "potion",
      name: "Attack Elixir",
      timer: window.playerStats.atkPotionTimer,
      max: potMax,
      desc: `Increases total Attack Power by +${Math.round((window.playerStats.atkPotionStrength || 0.1) * 100)}%.`,
    });
  }
  if (window.playerStats.hpPotionTimer > 0) {
    list.push({
      id: "hp_potion",
      type: "potion",
      name: "Vitality Elixir",
      timer: window.playerStats.hpPotionTimer,
      max: potMax,
      desc: `Increases total Max HP by +${Math.round((window.playerStats.hpPotionStrength || 0.1) * 100)}%.`,
    });
  }
  if (window.playerStats.defPotionTimer > 0) {
    list.push({
      id: "def_potion",
      type: "potion",
      name: "Armored Elixir",
      timer: window.playerStats.defPotionTimer,
      max: potMax,
      desc: `Increases total Defense by +${Math.round((window.playerStats.defPotionStrength || 0.1) * 100)}%.`,
    });
  }
  if (window.playerStats.hastePotionTimer > 0) {
    list.push({
      id: "haste_potion",
      type: "potion",
      name: "Haste Elixir",
      timer: window.playerStats.hastePotionTimer,
      max: potMax,
      desc: `Increases Movement Speed and Active/Idle Attack Speed multipliers by +${(window.playerStats.hastePotionStrength || 1) * 10}%.`,
    });
  }
  if (window.playerStats.xpPotionTimer > 0) {
    list.push({
      id: "xp_potion",
      type: "potion",
      name: "Double XP Elixir",
      timer: window.playerStats.xpPotionTimer,
      max: potMax,
      desc: "Increases global experience gain rates by +100%.",
    });
  }
  if (window.playerStats.dropPotionTimer > 0) {
    list.push({
      id: "drop_potion",
      type: "potion",
      name: "Double Drop Elixir",
      timer: window.playerStats.dropPotionTimer,
      max: potMax,
      desc: "Increases global equipment drop frequency by +100%.",
    });
  }
  if (window.playerStats.qlyPotionTimer > 0) {
    list.push({
      id: "qly_potion",
      type: "potion",
      name: "Drop Quality Elixir",
      timer: window.playerStats.qlyPotionTimer,
      max: potMax,
      desc: "Improves roll quality check chances by +50%.",
    });
  }

  // 3. Cavern & Dungeon Sigil Modifiers (Dungeon Mode)
  if (
    window.playerStats.isDungeonMode &&
    window.playerStats.activeDungeonSigil
  ) {
    let sig = window.playerStats.activeDungeonSigil;
    if (sig.buffs) {
      sig.buffs.forEach((b) => {
        list.push({
          id: b.id,
          type: "cavern_buff",
          name: b.name,
          desc: b.desc,
          isPermanent: true,
        });
      });
    }
    if (!(window.playerStats.purifiedAegisTimer > 0) && sig.debuffs) {
      sig.debuffs.forEach((d) => {
        list.push({
          id: d.id,
          type: "cavern_debuff",
          name: d.name,
          desc: d.desc,
          isPermanent: true,
        });
      });
    }
  }

  // 4. Auxiliary Timed Effects
  if (window.playerStats.purifiedAegisTimer > 0) {
    list.push({
      id: "purified_aegis",
      type: "buff",
      name: "Purified Aegis",
      timer: window.playerStats.purifiedAegisTimer,
      max: 480,
      desc: "Absolute debuff immunity. Active sigil/crucible debuffs are completely neutralized.",
    });
  }
  if (window.playerStats.astralAwakeningTimer > 0) {
    list.push({
      id: "astral_awakening",
      type: "buff",
      name: "Astral Awakening",
      timer: window.playerStats.astralAwakeningTimer,
      max: 900,
      desc: "Astral Ascension: Grants +100% Total Damage and +15% Active & Idle Speed.",
    });
  }
  if (window.playerStats.apathyDecayStacks > 0) {
    list.push({
      id: "apathy_decay",
      type: "debuff",
      name: "Apathy Decay",
      timer: window.playerStats.apathyDecayTimer,
      max: 300,
      stacks: window.playerStats.apathyDecayStacks,
      desc: `Inflicts severe progressive damage drain of -${(window.playerStats.apathyDecayStacks * 1.5).toFixed(1)}% Max HP per second.`,
    });
  }

  // 5. Crucible Mode Structural Modifiers
  if (window.playerStats.isCrucibleMode) {
    if (window.playerStats.crucibleActiveBuff) {
      let b = window.playerStats.crucibleActiveBuff;
      list.push({
        id: b.id,
        type: "cavern_buff",
        name: b.name,
        desc: b.desc,
        isPermanent: true,
      });
    }
    if (
      !(window.playerStats.purifiedAegisTimer > 0) &&
      window.playerStats.crucibleActiveDebuff
    ) {
      let d = window.playerStats.crucibleActiveDebuff;
      list.push({
        id: d.id,
        type: "cavern_debuff",
        name: d.name,
        desc: d.desc,
        isPermanent: true,
      });
    }

    // Crucible Draft Deck Card Stacks
    if (
      window.playerStats.crucibleDraftDeck &&
      window.playerStats.crucibleDraftDeck.length > 0
    ) {
      let counts = {};
      window.playerStats.crucibleDraftDeck.forEach((cardId) => {
        counts[cardId] = (counts[cardId] || 0) + 1;
      });
      for (let cardId in counts) {
        let card = window.CRUCIBLE_DRAFT_POOL.find((c) => c.id === cardId);
        if (card) {
          let count = counts[cardId];
          let descText = card.desc;
          if (count > 1) {
            if (cardId === "overcharge") {
              descText = `+${20 * count}% Crit Multiplier, +${2.5 * count}% Crit Chance`;
            } else if (cardId === "sanguine_tide") {
              descText = `Heal ${(1.5 * count).toFixed(1)}% Max HP on every Critical Strike hit`;
            } else if (cardId === "phantom_echo") {
              descText = `+${15 * count}% chance to trigger secondary Phantom Strike (deals 35% damage)`;
            } else if (cardId === "titans_wall") {
              descText = `+${3 * count}% base armor and +${3 * count}% Block/Parry cap limits`;
            } else if (cardId === "temporal_accel") {
              descText = `+${15 * count}% Active & Idle Attack Speed multipliers`;
            } else if (cardId === "astral_attune") {
              descText = `Earn +${25 * count}% Astral Shards from this run`;
            } else if (cardId.startsWith("slot_")) {
              descText = `+${15 * count}% to all stats of the equipped slot for this run`;
            }
          }
          list.push({
            id: cardId,
            type: "crucible_card",
            name: card.name,
            desc: descText,
            stacks: count,
            isPermanent: true,
          });
        }
      }
    }
  }

  return list;
};

window.getActiveEffectIconSvg = function (id, color, size = 16) {
  let path = "";
  if (id === "frenzy") {
    path = `<path d="M12 2 C12 2, 7 8, 7 13 C7 18.5, 11 22, 12 22 C13 22, 17 18.5, 17 13 C17 8, 12 2, 12 2 Z" fill="${color}" stroke="#000" stroke-width="1.5"/><path d="M12 8 Q10 13, 10 16 Q12 19, 12 19 Q13 19, 14 16 Q14 13, 12 8 Z" fill="#fff" opacity="0.6"/>`;
  } else if (id === "adrenaline" || id === "overcharge") {
    path = `<polygon points="13,2 3,14 11,14 10,22 21,10 13,10" fill="${color}" stroke="#000" stroke-width="1.5"/>`;
  } else if (
    id.includes("potion") ||
    id.includes("elixir") ||
    id === "vital_fountain" ||
    id === "sanguine_feast" ||
    id === "sanguine_tide"
  ) {
    path = `<path d="M9 5 L15 5 L15 10 L21 19 C22.5 21.5, 21 23, 18 23 L6 23 C3 23, 1.5 21.5, 3 19 L9 10 Z" fill="${color}" stroke="#000" stroke-width="1.5"/><rect x="11" y="2" width="2" height="3" fill="#a0522d" stroke="#000" stroke-width="0.8"/>`;
  } else if (
    id === "purified_aegis" ||
    id === "iron_aegis" ||
    id === "titans_wall" ||
    id === "aegis_bastion" ||
    id === "shattered_armour" ||
    id === "iron_gaze" ||
    id === "defense"
  ) {
    path = `<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill="${color}" stroke="#000" stroke-width="1.8"/>`;
  } else if (
    id === "astral_awakening" ||
    id === "astral_attune" ||
    id === "aetheric_spark" ||
    id === "unstable_surge" ||
    id === "shatter_frenzy"
  ) {
    path = `<polygon points="12,2 15,9 22,9 17,14 19,21 12,17 5,21 7,14 2,9 9,9" fill="${color}" stroke="#000" stroke-width="1.5"/>`;
  } else if (
    id === "apathy_decay" ||
    id === "withering_decay" ||
    id === "volatile_sparks" ||
    id === "poison_tip"
  ) {
    path = `<circle cx="12" cy="10" r="6" fill="${color}" stroke="#000" stroke-width="1.5"/><rect x="10" y="16" width="4" height="6" rx="1" fill="${color}" stroke="#000" stroke-width="1.5"/><line x1="8" y1="10" x2="16" y2="10" stroke="#000" stroke-width="1.5"/>`;
  } else if (
    id === "swift_strikes" ||
    id === "temporal_accel" ||
    id === "idle_spd" ||
    id === "active_spd"
  ) {
    path = `<circle cx="12" cy="12" r="10" fill="none" stroke="${color}" stroke-width="2"/><line x1="12" y1="12" x2="12" y2="6" stroke="${color}" stroke-width="2" stroke-linecap="round"/><line x1="12" y1="12" x2="16" y2="12" stroke="${color}" stroke-width="2" stroke-linecap="round"/>`;
  } else if (
    id === "giant_might" ||
    id.startsWith("slot_") ||
    id === "phantom_echo" ||
    id === "catalyst_resonance"
  ) {
    path = `<path d="M18 10h-2V8c0-1.1-.9-2-2-2h-4c-1.1 0-2 .9-2 2v2H6c-1.1 0-2 .9-2 2v2c0 1.1.9 2 2 2h2v2c0 1.1.9 2 2 2h4c1.1 0 2-.9 2-2v-2h2c1.1 0 2-.9 2-2v-2c0-1.1-.9-2-2-2z" fill="${color}" stroke="#000" stroke-width="1.5"/>`;
  } else {
    path = `<polygon points="12,4 16,12 20,12 14,16 16,22 12,18 8,22 10,16 4,12 8,12" fill="${color}" stroke="#000" stroke-width="1.5"/>`;
  }

  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" style="display:inline-block; vertical-align:middle; filter:drop-shadow(0 1px 2px rgba(0,0,0,0.5));">${path}</svg>`;
};

window.showEffectTooltip = function (e, effectId, type) {
  if (window.isSimulatedMouseEvent && window.isSimulatedMouseEvent(e)) return;
  e.stopPropagation();
  let tt = document.getElementById("game-tooltip");
  if (!tt) return;

  let eff = window.getActiveEffects().find((x) => x.id === effectId);
  if (!eff) return;

  let color = "#3498db";
  if (eff.type === "cavern_debuff" || eff.type === "debuff") color = "#e74c3c";
  else if (eff.type === "cavern_buff") color = "#2ecc71";
  else if (eff.type === "potion") color = "#9b59b6";
  else if (eff.type === "crucible_card") color = "#df9ffb";
  else if (eff.id === "frenzy") color = "#e67e22";
  else if (eff.id === "adrenaline") color = "#f1c40f";

  let durationText = "";
  if (!eff.isPermanent && eff.timer) {
    let secs = Math.ceil(eff.timer / 60);
    durationText = `<div class="tt-stat-line" style="color:#aaa; font-family:monospace; margin-top:6px;">• Duration Left: <strong style="color:#fff;">${secs}s</strong></div>`;
  } else {
    durationText = `<div class="tt-stat-line" style="color:#aaa; font-family:monospace; margin-top:6px;">• Duration: <strong style="color:#2ecc71;">Infinite (Run-bound)</strong></div>`;
  }

  let stackText = "";
  if (eff.stacks && eff.stacks > 1) {
    stackText = `<div class="tt-stat-line" style="color:#aaa; font-family:monospace;">• Stacks: <strong style="color:#ffd700;">x${eff.stacks}</strong></div>`;
  }

  let iconHtml = window.getActiveEffectIconSvg(eff.id, color, 24);

  tt.innerHTML = `
    <div style="padding: 10px; width: 220px; box-sizing: border-box; font-family:sans-serif;">
      <div class="tt-title" style="color:${color}; display:flex; align-items:center; gap:6px;">
        ${iconHtml}
        <span>${eff.name}</span>
      </div>
      <div class="tt-subtitle" style="text-transform:uppercase; font-size:8px; font-weight:800; color:${color}; margin-top:2px;">${eff.type.replace("_", " ")}</div>
      <div style="color:#ddd; font-size:11px; white-space:normal; line-height:1.4; margin-top:8px;">
        ${eff.desc}
      </div>
      <div style="margin-top:8px; border-top:1px dashed #333; padding-top:6px;">
        ${stackText}
        ${durationText}
      </div>
    </div>
  `;
  tt.style.borderColor = color;
  tt.style.display = "block";
  window.positionTooltip(e, tt);
};

window.renderActiveEffectsHudBar = function () {
  let bar = document.getElementById("active-effects-hud-bar");
  if (!bar) return;

  let activeEffects = window.getActiveEffects ? window.getActiveEffects() : [];
  if (activeEffects.length === 0) {
    bar.innerHTML = "";
    return;
  }

  bar.innerHTML = activeEffects
    .map((eff) => {
      let color = "#3498db";
      if (eff.type === "cavern_debuff" || eff.type === "debuff")
        color = "#e74c3c";
      else if (eff.type === "cavern_buff") color = "#2ecc71";
      else if (eff.type === "potion") color = "#9b59b6";
      else if (eff.type === "crucible_card") color = "#df9ffb";
      else if (eff.id === "frenzy") color = "#e67e22";
      else if (eff.id === "adrenaline") color = "#f1c40f";

      let stackBadge = "";
      if (eff.stacks && eff.stacks > 1) {
        stackBadge = `
          <span style="
            position: absolute;
            bottom: -3px;
            right: -3px;
            background: #ffd700;
            color: #000;
            font-family: monospace;
            font-size: 8px;
            font-weight: 900;
            padding: 1px 3px;
            border-radius: 3px;
            line-height: 1;
            box-shadow: 0 1px 3px rgba(0,0,0,0.5);
          ">x${eff.stacks}</span>
        `;
      }

      let timerBarHtml = "";
      if (!eff.isPermanent && eff.timer && eff.max) {
        let pct = (eff.timer / eff.max) * 100;
        timerBarHtml = `
          <div style="
            position: absolute;
            bottom: -4px;
            left: 0;
            width: 100%;
            height: 3px;
            background: rgba(0,0,0,0.5);
            border-radius: 10px;
            overflow: hidden;
            border: 0.5px solid #111;
          ">
            <div style="width: ${pct}%; height: 100%; background: ${color};"></div>
          </div>
        `;
      }

      let iconHtml = window.getActiveEffectIconSvg(eff.id, color, 14);
      return `
        <div class="active-effect-badge"
             data-effect-id="${eff.id}"
             onmouseenter="window.showEffectTooltip(event, '${eff.id}', '${eff.type}')"
             onmouseleave="window.hideTooltip()"
             ontouchstart="window.showEffectTooltip(event, '${eff.id}', '${eff.type}')"
             style="
                 width: 28px;
                 height: 28px;
                 background: rgba(10, 14, 23, 0.95);
                 border: 1.5px solid ${color};
                 border-radius: 6px;
                 display: inline-flex;
                 align-items: center;
                 justify-content: center;
                 cursor: help;
                 position: relative;
                 box-shadow: 0 3px 8px rgba(0,0,0,0.6), inset 0 0 5px rgba(${window.hexToRgbValues ? window.hexToRgbValues(color) : "255,255,255"}, 0.15);
                 transition: transform 0.15s;
             "
             onpointerdown="event.stopPropagation();">
             ${iconHtml}
             ${stackBadge}
             ${timerBarHtml}
        </div>
      `;
    })
    .join("");
};

window.showStatBreakdown = function (e, statKey, isPct = false) {
  if (window.isSimulatedMouseEvent && window.isSimulatedMouseEvent(e)) return;
  e.stopPropagation();
  let tt = document.getElementById("stat-tooltip");
  if (!tt) return;

  let clientX =
    e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
  let clientY =
    e.clientY || (e.touches && e.touches[0] ? e.touches[0].clientY : 0);
  window.activeStatTooltip = {
    type: "breakdown",
    key: statKey,
    isPct: !!isPct,
    clientX: clientX,
    clientY: clientY,
    target: e.currentTarget || e.target,
  };

  let alloc = window.playerStats.spAllocations;
  let p = window.resolvePlayerStats();
  let effectiveStr = Math.max(0, p.str - 5);
  let effectiveDex = Math.max(0, p.dex - 5);
  let effectiveInt = Math.max(0, p.int - 5);

  let map = {
    str: {
      title: window.getUiIconSvg("str", 14) + " STR (Strength)",
      base: window.playerStats.baseStr,
      lvl: (alloc.spStr || 0) * 3,
      color: "#e74c3c",
    },
    dex: {
      title: window.getUiIconSvg("dex", 14) + " DEX (Dexterity)",
      base: window.playerStats.baseDex,
      lvl: (alloc.spDex || 0) * 3,
      color: "#e67e22",
    },
    int: {
      title: window.getUiIconSvg("int", 14) + " INT (Intelligence)",
      base: window.playerStats.baseInt,
      lvl: (alloc.spInt || 0) * 3,
      color: "#9b59b6",
    },
    atk: {
      title: window.getUiIconSvg("atk", 14) + " Total Attack",
      base: window.playerStats.baseAtk,
      lvl: alloc.spAtk * 6,
      color: "#e74c3c",
    },
    maxHp: {
      title: window.getUiIconSvg("maxHp", 14) + " Max Health",
      base: window.playerStats.baseMaxHp,
      lvl: alloc.spHp * 50,
      color: "#e74c3c",
    },
    def: {
      title: window.getUiIconSvg("def", 14) + " Total Defense",
      base: window.playerStats.baseDef,
      lvl: alloc.spDef * 5,
      color: "#3498db",
    },
    moveSpeed: {
      title: window.getUiIconSvg("moveSpeed", 14) + " Move Speed",
      base: window.playerStats.baseMoveSpeed,
      lvl: alloc.spSpd * 1,
      color: "#3498db",
    },
    critChance: {
      title: window.getUiIconSvg("critChance", 14) + " Crit Chance",
      base: window.playerStats.baseCritChance,
      lvl: alloc.spCrit * 0.005,
      color: "#f1c40f",
    },
    critDamage: {
      title: window.getUiIconSvg("critDamage", 14) + " Crit Multiplier",
      base: window.playerStats.baseCritDamage,
      lvl: alloc.spCritDmg * 0.02,
      color: "#e67e22",
    },
    block: {
      title: window.getUiIconSvg("block", 14) + " Block Rate",
      base: window.playerStats.baseBlock,
      lvl: alloc.spBlock * 0.005,
      color: "#3498db",
    },
    parry: {
      title: window.getUiIconSvg("parry", 14) + " Parry Rate",
      base: window.playerStats.baseParry,
      lvl: alloc.spParry * 0.005,
      color: "#9b59b6",
    },
    rareSpawn: {
      title: window.getUiIconSvg("rareSpawn", 14) + " Rare Enemy Spawn",
      base: window.playerStats.baseRareSpawn,
      lvl: 0,
      color: "#e67e22",
    },
    fairySpawn: {
      title: window.getUiIconSvg("fairySpawn", 14) + " Fairy Spawn Rate",
      base: window.playerStats.baseFairySpawn,
      lvl: 0,
      color: "#ffb6c1",
    },
    gold: {
      title: window.getUiIconSvg("goldMulti", 14) + " Gold Multiplier",
      base: window.playerStats.baseGold,
      lvl: 0,
      color: "#f1c40f",
    },
  };

  let data = map[statKey] || {
    title: statKey.toUpperCase(),
    base: 0,
    lvl: 0,
    color: "#fff",
  };
  let gearTotal = 0;
  let artTotal = 0;

  for (let key in window.equippedSlots) {
    let item = window.equippedSlots[key];
    if (item && item[statKey] !== undefined) {
      if (item.type === "artifact") artTotal += item[statKey];
      else gearTotal += item[statKey];
    }
  }

  let achTotal = 0;
  let achPctTotal = 0;
  if (window.playerStats.unlockedAchievements && window.AchievementsData) {
    window.playerStats.unlockedAchievements.forEach((id) => {
      let ach = window.AchievementsData.find((a) => a.id === id);
      if (ach && ach.stats) {
        if (ach.stats[statKey] !== undefined) achTotal += ach.stats[statKey];
        let pctKey = statKey + "Pct";
        if (ach.stats[pctKey] !== undefined) achPctTotal += ach.stats[pctKey];
      }
    });
  }

  let intScaleTotal = 0;
  let prestigeTotal = 0;
  if (statKey === "fairySpawn") {
    intScaleTotal = effectiveInt * 0.001;
    prestigeTotal = (window.playerStats.prestigeUpgrades?.fairy || 0) * 0.05;
  }

  // Calculate Set Bonuses for Tooltip Breakdown
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

  let setFlatBonus = 0;
  let setPctBonus = 0;

  if (statKey === "atk") {
    setFlatBonus = setCtx.atk;
    setPctBonus = setCtx.atkPctBonus;
  } else if (statKey === "maxHp") {
    setFlatBonus = setCtx.maxHp;
    setPctBonus = setCtx.maxHpPctBonus;
  } else if (statKey === "def") {
    setFlatBonus = setCtx.flatDefBonus;
    setPctBonus = setCtx.defPctBonus;
  } else if (statKey === "moveSpeed") {
    setFlatBonus = setCtx.moveSpeed;
  } else if (statKey === "str") {
    setFlatBonus = setCtx.str;
  } else if (statKey === "dex") {
    setFlatBonus = setCtx.dex;
  } else if (statKey === "int") {
    setFlatBonus = setCtx.int;
  } else if (statKey === "critChance") {
    setPctBonus = setCtx.critChance;
  } else if (statKey === "critDamage") {
    setPctBonus = setCtx.critDamage;
  } else if (statKey === "block") {
    setPctBonus = setCtx.block;
  } else if (statKey === "parry") {
    setPctBonus = setCtx.parry;
  } else if (statKey === "gold") {
    setPctBonus = setCtx.gold;
  } else if (statKey === "dropRate") {
    setPctBonus = setCtx.drop;
  } else if (statKey === "quality") {
    setPctBonus = setCtx.qly;
  } else if (statKey === "rareSpawn") {
    setPctBonus = setCtx.rareSpawn;
  }

  let formatVal = (v) =>
    isPct ? `+${Math.floor(v * 100)}%` : `+${window.formatNumber(v)}`;
  if (statKey === "gold")
    formatVal = (v) =>
      `+${v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  let html = `<div style="padding: 10px; width: 220px; box-sizing: border-box;">
                    <div class="tt-title" style="color:${data.color};">${data.title} Breakdown</div>
                    <div class="tt-stat-line" style="color:#aaa;">• Base Entity: ${formatVal(data.base).replace("+", "")}</div>`;

  if (data.lvl > 0)
    html += `<div class="tt-stat-line" style="color:#3498db;">• Level Stats (SP): ${formatVal(data.lvl)}</div>`;
  if (gearTotal > 0)
    html += `<div class="tt-stat-line" style="color:#2ecc71;">• Equipment / Elixirs: ${formatVal(gearTotal)}</div>`;
  if (artTotal > 0)
    html += `<div class="tt-stat-line" style="color:#9b59b6;">• Artifacts: ${formatVal(artTotal)}</div>`;
  if (achTotal > 0)
    html += `<div class="tt-stat-line" style="color:#f1c40f;">• Achievements (Flat): ${formatVal(achTotal)}</div>`;
  if (achPctTotal > 0)
    html += `<div class="tt-stat-line" style="color:#f1c40f;">• Achievements (Mult): +${Math.round(achPctTotal * 100)}%</div>`;
  if (setFlatBonus > 0)
    html += `<div class="tt-stat-line" style="color:#e67e22;">• Set Bonuses (Flat): ${formatVal(setFlatBonus)}</div>`;
  if (setPctBonus > 0)
    html += `<div class="tt-stat-line" style="color:#e67e22;">• Set Bonuses (Mult): +${Math.round(setPctBonus * 100)}%</div>`;
  if (prestigeTotal > 0)
    html += `<div class="tt-stat-line" style="color:#8e44ad;">• Prestige Upgrades: ${formatVal(prestigeTotal)}</div>`;
  if (intScaleTotal > 0)
    html += `<div class="tt-stat-line" style="color:#9b59b6;">• Intelligence Scaling (INT): ${formatVal(intScaleTotal)}</div>`;

  let totalVal =
    data.base +
    data.lvl +
    gearTotal +
    artTotal +
    achTotal +
    intScaleTotal +
    prestigeTotal +
    setFlatBonus;
  if (statKey === "atk" && effectiveStr > 0) {
    let actualDmgAdded = Math.floor(totalVal * (effectiveStr * 0.001));
    html += `<div class="tt-stat-line" style="color:#e67e22;">• ${window.getUiIconSvg("str", 11)} Strength Scaling (STR): +${window.formatNumber(actualDmgAdded)} Damage</div>`;
    html += `<div class="tt-stat-line" style="color:#e67e22; font-style:italic;">  (+${(effectiveStr * 0.1).toFixed(1)}% Multiplier)</div>`;
  }
  if (statKey === "maxHp" && effectiveStr > 0) {
    let hpBonus = Math.floor(totalVal * (effectiveStr * 0.001));
    html += `<div class="tt-stat-line" style="color:#e74c3c;">• ${window.getUiIconSvg("str", 11)} Strength Scaling (STR): +${window.formatNumber(hpBonus)} HP</div>`;
    html += `<div class="tt-stat-line" style="color:#e74c3c; font-style:italic;">  (+${(effectiveStr * 0.1).toFixed(1)}% Multiplier)</div>`;
  }
  // INT scaling defense has been removed from breakdown
  if (statKey === "moveSpeed" && effectiveDex > 0) {
    let scaleVal = (effectiveDex * 20) / (effectiveDex + 150);
    html += `<div class="tt-stat-line" style="color:#3498db;">• ${window.getUiIconSvg("dex", 11)} Dexterity Scaling (DEX): +${scaleVal.toFixed(1)} Speed</div>`;
  }
  if (statKey === "critChance" && effectiveDex > 0) {
    let scaleVal = (effectiveDex * 0.3) / (effectiveDex + 250);
    html += `<div class="tt-stat-line" style="color:#3498db;">• ${window.getUiIconSvg("dex", 11)} Dexterity Scaling (DEX): +${(scaleVal * 100).toFixed(1)}%</div>`;
  }
  if (statKey === "critDamage" && effectiveDex > 0) {
    let scaleVal = effectiveDex * 0.003;
    html += `<div class="tt-stat-line" style="color:#3498db;">• ${window.getUiIconSvg("dex", 11)} Dexterity Scaling (DEX): +${(scaleVal * 100).toFixed(1)}%</div>`;
  }
  if (statKey === "block" && effectiveInt > 0) {
    let scaleVal = (effectiveInt * 0.12) / (effectiveInt + 150);
    html += `<div class="tt-stat-line" style="color:#9b59b6;">• ${window.getUiIconSvg("int", 11)} Intelligence Scaling (INT): +${(scaleVal * 100).toFixed(1)}%</div>`;
  }
  if (statKey === "parry" && effectiveInt > 0) {
    let scaleVal = (effectiveInt * 0.12) / (effectiveInt + 150);
    html += `<div class="tt-stat-line" style="color:#9b59b6;">• ${window.getUiIconSvg("int", 11)} Intelligence Scaling (INT): +${(scaleVal * 100).toFixed(1)}%</div>`;
  }
  if (statKey === "critChance" || statKey === "critDamage") {
    if (window.playerStats.frenzyTimer > 0)
      html += `<div class="tt-stat-line" style="color:#e67e22; font-weight:bold; margin-top:5px;">• FRENZY BUFF ACTIVE!</div>`;
  }
  if (statKey === "block" || statKey === "parry") {
    let rawSum = statKey === "block" ? p.rawBlock : p.rawParry;
    html += `<div style="margin: 6px 0; border-top: 1px dashed #444; padding-top: 4px; color: #ffb6c1; font-weight: bold;">Asymptotic Diminishing Returns:</div>`;
    html += `<div class="tt-stat-line" style="color:#aaa;">• Raw Accumulated Sum: <strong style="color:#fff;">${Math.round(rawSum * 100)}%</strong></div>`;
    html += `<div class="tt-stat-line" style="color:#2ecc71;">• Effective Avoidance: <strong style="color:#2ecc71;">${Math.floor(p[statKey] * 100)}%</strong></div>`;
  }
  if (statKey === "str") {
    let effStr = Math.max(0, totalVal - 5);
    html += `<div style="margin: 6px 0; border-top: 1px dashed #444; padding-top: 4px; color: #ffb6c1; font-weight: bold;">Scaling Contributions:</div>`;
    html += `<div class="tt-stat-line" style="color:#2ecc71;">• Attack Multiplier: +${(effStr * 0.1).toFixed(1)}%</div>`;
    html += `<div class="tt-stat-line" style="color:#e74c3c;">• Max HP Multiplier: +${(effStr * 0.1).toFixed(1)}%</div>`;
  } else if (statKey === "dex") {
    let effDex = Math.max(0, totalVal - 5);
    let critChScale = (effDex * 0.1) / (effDex + 250);
    let moveSpdScale = (effDex * 5.0) / (effDex + 150);
    html += `<div style="margin: 6px 0; border-top: 1px dashed #444; padding-top: 4px; color: #ffb6c1; font-weight: bold;">Scaling Contributions:</div>`;
    html += `<div class="tt-stat-line" style="color:#e67e22;">• Crit Chance: +${(critChScale * 100).toFixed(1)}%</div>`;
    html += `<div class="tt-stat-line" style="color:#f1c40f;">• Crit Multiplier: +${(effDex * 0.1).toFixed(1)}%</div>`;
    html += `<div class="tt-stat-line" style="color:#3498db;">• Move Speed Boost: +${moveSpdScale.toFixed(1)}</div>`;
  } else if (statKey === "int") {
    let effInt = Math.max(0, totalVal - 5);
    let blockChScale = (effInt * 0.05) / (effInt + 150);
    let potDurScale = effInt * 0.0001;
    html += `<div style="margin: 6px 0; border-top: 1px dashed #444; padding-top: 4px; color: #ffb6c1; font-weight: bold;">Scaling Contributions:</div>`;
    html += `<div class="tt-stat-line" style="color:#3498db;">• Block Rate Boost: +${(blockChScale * 100).toFixed(1)}%</div>`;
    html += `<div class="tt-stat-line" style="color:#e74c3c;">• Parry Rate Boost: +${(blockChScale * 100).toFixed(1)}%</div>`;
    html += `<div class="tt-stat-line" style="color:#9b59b6;">• Fairy Multiplier: +${(effInt * 0.01).toFixed(1)}%</div>`;
    html += `<div class="tt-stat-line" style="color:#9b59b6;">• Potion Duration: +${potDurScale.toFixed(4)}%</div>`;
  }

  html += `</div>`;
  tt.style.borderColor = data.color;
  tt.innerHTML = html;
  tt.style.display = "block";
  window.positionTooltip(e, tt);
};

window.renderMarketShop = function () {
  let el = document.getElementById("gold-shop-list");
  if (!el) return;

  let iotdItem = window.playerStats.shopItems.find((item) => item.isIOTD);
  let standardItems = window.playerStats.shopItems.filter(
    (item) => !item.isIOTD,
  );

  let html = "";

  // Render Golden Spotlight Awning for Item of the Day
  if (iotdItem) {
    let nameColor = window.getTierColor(iotdItem.statsRolled);
    let costColor = BigNum.from(window.playerStats.coins).gte(iotdItem.cost)
      ? "#2ecc71"
      : "#e74c3c";
    let isSold = iotdItem.purchased;
    let btnStyle =
      isSold || BigNum.from(window.playerStats.coins).lt(iotdItem.cost)
        ? "background: #333; color: #666; cursor: not-allowed; border-color: #444;"
        : "background: linear-gradient(180deg, #f1c40f 0%, #d4af37 100%); color: #000; font-weight: 900; border-color: #fff; box-shadow: 0 0 10px rgba(241, 196, 15, 0.4);";

    let stampClass = "stamp-base";
    if (iotdItem.justPurchased) {
      stampClass += " stamp-slam";
      delete iotdItem.justPurchased;
    }
    let soldOverlay = isSold
      ? `<div style="position:absolute; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.8); backdrop-filter: blur(1.5px); display:flex; justify-content:center; align-items:center; border-radius:8px; z-index:5;"><span class="${stampClass}" style="--final-rot:-8deg; color:#e74c3c; font-size:18px; font-weight:900; border: 2.5px solid #e74c3c; padding: 6px 16px; border-radius:4px; font-family:'Arial Black',Impact,sans-serif; text-shadow: 0 2px 4px #000; letter-spacing:2px; box-shadow: 0 0 15px rgba(231,76,60,0.35);">PURCHASED</span></div>`
      : "";

    html += `
                    <div class="merchant-shelf-hero"
                         style="display:flex; flex-direction:column; justify-content:space-between; padding:15px; margin-bottom:14px;"
                         onmouseenter="window.showMarketTooltip(event, ${window.playerStats.shopItems.indexOf(iotdItem)})"
                         onmouseleave="window.hideTooltip()">
                        ${soldOverlay}
                        <div style="position:relative; z-index:2; display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:10px; padding:0 4px;">
                            <div style="background: linear-gradient(90deg, #f1c40f, #e67e22); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-size:9.5px; font-weight:900; letter-spacing:2px; text-transform:uppercase; text-shadow: 0 0 8px rgba(241, 196, 15, 0.2);">★ Item of the Day ★</div>
                            <div style="font-family:monospace; font-size:9.5px; color:#f1c40f; background:rgba(241, 196, 15, 0.08); padding:2px 6px; border-radius:3px; border:1px solid rgba(241, 196, 15, 0.3);">SPECIAL VALUE</div>
                        </div>
                        <div style="position:relative; z-index:2; display:flex; align-items:center; gap:12px; margin-bottom:12px; padding:0 4px; cursor:help;"
                             ontouchstart="window.showMarketTooltip(event, ${window.playerStats.shopItems.indexOf(iotdItem)}); event.stopPropagation();">
                            <div style="flex-shrink:0;">
                                ${window.getEquipIconHtml(iotdItem, 40)}
                            </div>
                            <div style="flex:1; min-width:0; text-align:left;">
                                <strong style="color:${nameColor}; font-size:14px; text-shadow:0 0 8px rgba(${window.hexToRgbValues(nameColor)},0.25); display:block; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; max-width:240px;">${iotdItem.name}</strong>
                                <span style="font-size:10px; color:#94a3b8; font-family:monospace;">${iotdItem.statsRolled === "UNIQUE" ? "UNIQUE" : iotdItem.statsRolled + "★"} Quality</span>
                            </div>
                        </div>
                        <div style="position:relative; z-index:4; display:flex; justify-content:space-between; align-items:center; border-top:1px dashed rgba(255,255,255,0.08); padding-top:10px; padding-left:4px; padding-right:4px;">
                                                    <div>
                                                        <span style="font-size:9.5px; color:#888; display:block; text-align:left;">MERCHANT COST</span>
                                                        <strong style="color:${costColor}; font-size:14px; font-family:monospace;">${window.formatNumber(iotdItem.cost)} Gold</strong>
                                                    </div>
                                                    <button class="btn-action" style="${btnStyle} padding:8px 16px; font-size:11px;" ontouchstart="event.stopPropagation();" onclick="window.buyShopItem(${window.playerStats.shopItems.indexOf(iotdItem)})">
                                                        ${isSold ? "SOLD" : "ACQUIRE"}
                                                    </button>
                                                </div>
                    </div>
                  `;
  }

  // Render Standard Items in a divided columns grid (The "Shelf")
  html += `
      <div style="font-size:9.5px; color:#888; font-weight:bold; letter-spacing:1px; text-transform:uppercase; text-align:left; margin-bottom:8px; border-bottom:1px solid #333; padding-bottom:4px;">🛒 Standard Stock</div>
      <div class="merchant-shelves-grid">
    `;

  standardItems.forEach((shopItem) => {
    let idx = window.playerStats.shopItems.indexOf(shopItem);
    let nameColor = window.getTierColor(shopItem.statsRolled);
    let costColor = BigNum.from(window.playerStats.coins).gte(shopItem.cost)
      ? "#2ecc71"
      : "#e74c3c";
    let isSold = shopItem.purchased;

    let stampClass = "stamp-base";
    if (shopItem.justPurchased) {
      stampClass += " stamp-slam";
      delete shopItem.justPurchased;
    }
    let soldOverlay = isSold
      ? `<div style="position:absolute; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.8); backdrop-filter: blur(1.5px); display:flex; justify-content:center; align-items:center; border-radius:8px; z-index:5;"><span class="${stampClass}" style="--final-rot:-8deg; color:#e74c3c; font-size:16px; font-weight:900; border: 2.5px solid #e74c3c; padding: 6px 16px; border-radius:4px; font-family:'Arial Black',Impact,sans-serif; text-shadow: 0 2px 4px #000; letter-spacing:2px; box-shadow: 0 0 15px rgba(231,76,60,0.35);">PURCHASED</span></div>`
      : "";

    let btnStyle =
      isSold || BigNum.from(window.playerStats.coins).lt(shopItem.cost)
        ? "background: #333; color: #666; cursor: not-allowed; border-color: #444;"
        : `background: transparent; color: #fff; border: 1.5px solid ${nameColor}; box-shadow: 0 0 6px rgba(${window.hexToRgbValues(nameColor)},0.15);`;

    // Apply rarity responsive visual background classes
    let glowClass = "merchant-shelf-row";
    if (shopItem.statsRolled === 4) glowClass += " rarity-glow-4";
    if (shopItem.statsRolled === 5) glowClass += " rarity-glow-5";

    html += `
            <div class="${glowClass}"
                 style="display:flex; flex-direction:column; justify-content:space-between; border-radius:6px; padding:10px; gap:8px;"
                 onmouseenter="window.showMarketTooltip(event, ${idx})"
                 onmouseleave="window.hideTooltip()">
                ${soldOverlay}
                <div style="display:flex; align-items:center; gap:10px; text-align:left; position:relative; z-index:2; cursor:help;"
                     ontouchstart="window.showMarketTooltip(event, ${idx}); event.stopPropagation();">
                    <div style="flex-shrink:0;">
                        ${window.getEquipIconHtml(shopItem, 32)}
                    </div>
                    <div style="flex:1; min-width:0;">
                        <strong style="color:${nameColor}; font-size:12px; display:block; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; max-width:240px;">${shopItem.name}</strong>
                        <span style="font-size:9.5px; color:#94a3b8; font-family:monospace;">${shopItem.statsRolled === "UNIQUE" ? "UNIQUE" : shopItem.statsRolled + "★"} Quality</span>
                    </div>
                </div>
                <div style="display:flex; justify-content:space-between; align-items:center; position:relative; z-index:4; border-top:1px dashed rgba(255,255,255,0.06); padding-top:6px; margin-top:2px;">
                                            <span style="color:${costColor}; font-weight:bold; font-size:11px; font-family:monospace;">${window.formatNumber(shopItem.cost)} Gold</span>
                                            <button class="btn-action" style="${btnStyle} font-size:10px; padding:4px 8px; border-radius:4px;" ontouchstart="event.stopPropagation();" onclick="window.buyShopItem(${idx})">
                                                ${isSold ? "SOLD" : "BUY"}
                                            </button>
                                        </div>
            </div>
          `;
  });

  html += `</div>`;
  el.innerHTML = html;
};

window.showAstralShopItemTooltip = function (e, index) {
  e.stopPropagation();
  let item = window.ASTRAL_SHOP_STOCK[index];
  if (!item) return;

  let ownedShards = window.playerStats.astralShards || 0;
  let ownedReagent = window.inventory.ETC[item.name] || 0;
  let canAfford = ownedShards >= item.cost;
  let costTextColor = canAfford ? "#2ecc71" : "#e74c3c";

  let iconHtml = window
    .getEtcIconHtml(item.name)
    .replace("margin-right: 12px;", "margin-right: 8px;");
  let tt = document.getElementById("game-tooltip");

  tt.innerHTML = `
    <div style="padding: 10px; width: 220px; box-sizing: border-box;">
        <div class="tt-title" style="color:${item.color}; display:flex; align-items:center; gap:8px;">${iconHtml}<span>${item.name}</span></div>
        <div style="color:#aaa; font-size:11px; white-space:normal; line-height:1.4; margin-top:8px;">
            ${item.desc}<br><br>
            • Cost: <strong style="color:${costTextColor};">${item.cost} Shards (Owned: ${ownedShards})</strong><br>
            • Owned Reagent: <strong style="color:#fff;">${ownedReagent.toLocaleString()}</strong>
        </div>
    </div>
  `;
  tt.style.borderColor = item.color;
  tt.style.display = "block";
  window.positionTooltip(e, tt);
};

window.renderGoldUpgrades = function () {
  let el = document.getElementById("gold-upgrades-list");
  if (!el) return;

  // Utilize the pre-configured fluid CSS Grid
  el.style.display = "grid";
  el.style.gridTemplateColumns = "repeat(auto-fit, minmax(280px, 1fr))";
  el.style.gap = "12px";

  let p = window.playerStats;

  let gachaIconSvg = `
    <svg width="100%" height="100%" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="gacha_dome" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#ffea75" />
          <stop offset="100%" stop-color="#f39c12" />
        </linearGradient>
        <linearGradient id="gacha_base" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#e67e22" />
          <stop offset="100%" stop-color="#d35400" />
        </linearGradient>
        <radialGradient id="gacha_glass" cx="50%" cy="40%" r="50%">
          <stop offset="0%" stop-color="#ffffff" stop-opacity="0.6" />
          <stop offset="60%" stop-color="#74b9ff" stop-opacity="0.15" />
          <stop offset="100%" stop-color="#0984e3" stop-opacity="0.3" />
        </radialGradient>
      </defs>
      <ellipse cx="32" cy="56" rx="20" ry="4" fill="rgba(0,0,0,0.5)" />
      <rect x="16" y="34" width="32" height="20" rx="3" fill="url(#gacha_base)" stroke="#000000" stroke-width="2.5" />
      <rect x="25" y="44" width="14" height="10" rx="2" fill="#2c3e50" stroke="#000000" stroke-width="1.8" />
      <path d="M25 44 L39 44 L35 54 L29 54 Z" fill="#111111" />
      <rect x="14" y="30" width="36" height="5" fill="#f1c40f" stroke="#000000" stroke-width="2.2" />
      <circle cx="32" cy="20" r="14" fill="url(#gacha_glass)" stroke="#000000" stroke-width="2.5" />
      <circle cx="26" cy="22" r="3.5" fill="#e74c3c" stroke="#000000" stroke-width="1" />
      <circle cx="26" cy="22" r="1.5" fill="#ffffff" opacity="0.6" />
      <circle cx="38" cy="22" r="3.5" fill="#3498db" stroke="#000000" stroke-width="1" />
      <circle cx="38" cy="22" r="1.5" fill="#ffffff" opacity="0.6" />
      <circle cx="32" cy="15" r="3.5" fill="#9b59b6" stroke="#000000" stroke-width="1" />
      <circle cx="32" cy="15" r="1.5" fill="#ffffff" opacity="0.6" />
      <circle cx="32" cy="25" r="3.5" fill="#2ecc71" stroke="#000000" stroke-width="1" />
      <circle cx="32" cy="25" r="1.5" fill="#ffffff" opacity="0.6" />
      <path d="M20 10 C20 4, 44 4, 44 10 Z" fill="url(#gacha_dome)" stroke="#000000" stroke-width="2.5" />
      <circle cx="32" cy="38" r="4" fill="#bdc3c7" stroke="#000000" stroke-width="1.8" />
      <line x1="32" y1="34" x2="32" y2="42" stroke="#000000" stroke-width="2" />
      <line x1="28" y1="38" x2="36" y2="38" stroke="#000000" stroke-width="2" />
      <circle cx="32" cy="38" r="1" fill="#111111" />
    </svg>
  `;

  let shopIconSvg = `
    <svg width="100%" height="100%" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="shop_wood" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#873600" />
          <stop offset="100%" stop-color="#5c2e16" />
        </linearGradient>
        <linearGradient id="shop_awning_blue" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#2980b9" />
          <stop offset="100%" stop-color="#3498db" />
        </linearGradient>
        <linearGradient id="shop_awning_white" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#bdc3c7" />
          <stop offset="100%" stop-color="#ffffff" />
        </linearGradient>
      </defs>
      <ellipse cx="32" cy="56" rx="22" ry="4" fill="rgba(0,0,0,0.5)" />
      <rect x="14" y="24" width="36" height="28" fill="#1b2631" stroke="#000000" stroke-width="2" />
      <rect x="10" y="34" width="44" height="20" rx="3" fill="url(#shop_wood)" stroke="#000000" stroke-width="2.5" />
      <rect x="14" y="38" width="10" height="12" fill="#5c2e16" stroke="#000000" stroke-width="1.5" />
      <rect x="40" y="38" width="10" height="12" fill="#5c2e16" stroke="#000000" stroke-width="1.5" />
      <circle cx="32" cy="44" r="5" fill="#f1c40f" stroke="#000000" stroke-width="1.5" />
      <path d="M32 41 v6 M29 43 h6" stroke="#000000" stroke-width="1.5" stroke-linecap="round" />
      <line x1="12" y1="18" x2="12" y2="34" stroke="#000" stroke-width="2.5" />
      <line x1="52" y1="18" x2="52" y2="34" stroke="#000" stroke-width="2.5" />
      <path d="M6 10 L58 10 L50 24 L14 24 Z" fill="url(#shop_awning_blue)" stroke="#000000" stroke-width="2.5" stroke-linejoin="round" />
      <path d="M12 10 L19 10 L19 24 L12 24 Z" fill="url(#shop_awning_white)" stroke="#000000" stroke-width="1.5" />
      <path d="M26 10 L33 10 L31 24 L24 24 Z" fill="url(#shop_awning_white)" stroke="#000000" stroke-width="1.5" />
      <path d="M40 10 L47 10 L43 24 L36 24 Z" fill="url(#shop_awning_white)" stroke="#000000" stroke-width="1.5" />
      <rect x="8" y="30" width="48" height="4" fill="#a04000" stroke="#000000" stroke-width="2" />
    </svg>
  `;

  let globalIconSvg = `
    <svg width="100%" height="100%" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="clover_leaf" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#a3fd83" />
          <stop offset="50%" stop-color="#2ecc71" />
          <stop offset="100%" stop-color="#27ae60" />
        </linearGradient>
        <linearGradient id="clover_pot" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#2c3e50" />
          <stop offset="100%" stop-color="#0f171e" />
        </linearGradient>
      </defs>
      <ellipse cx="32" cy="56" rx="20" ry="4" fill="rgba(0,0,0,0.5)" />
      <path d="M18 42 L46 42 L42 54 L22 54 Z" fill="url(#clover_pot)" stroke="#000000" stroke-width="2.5" stroke-linejoin="round" />
      <ellipse cx="32" cy="42" rx="14" ry="3.5" fill="#34495e" stroke="#000000" stroke-width="2.5" />
      <ellipse cx="32" cy="42" rx="12" ry="2.2" fill="#5c2e16" />
      <path d="M32 41 Q32 24, 27 18" fill="none" stroke="#27ae60" stroke-width="3.5" stroke-linecap="round" />
      <g transform="translate(25, 16)">
        <path d="M0,0 C-12,-12 -12,4 0,0" fill="url(#clover_leaf)" stroke="#000000" stroke-width="1.8" stroke-linejoin="round" />
        <path d="M0,0 C-12,-12 -12,4 0,0" fill="#a3fd83" opacity="0.3" />
        <path d="M0,0 C12,-12 12,4 0,0" fill="url(#clover_leaf)" stroke="#000000" stroke-width="1.8" stroke-linejoin="round" />
        <path d="M0,0 C12,-12 12,4 0,0" fill="#a3fd83" opacity="0.3" />
        <path d="M0,0 C-12,12 -12,-4 0,0" fill="url(#clover_leaf)" stroke="#000000" stroke-width="1.8" stroke-linejoin="round" />
        <path d="M0,0 C-12,12 -12,-4 0,0" fill="#a3fd83" opacity="0.3" />
        <path d="M0,0 C12,12 12,-4 0,0" fill="url(#clover_leaf)" stroke="#000000" stroke-width="1.8" stroke-linejoin="round" />
        <path d="M0,0 C12,12 12,-4 0,0" fill="#a3fd83" opacity="0.3" />
        <circle cx="0" cy="0" r="1.5" fill="#f1c40f" />
      </g>
      <g stroke="#f1c40f" stroke-width="1.2" stroke-linecap="round">
        <path d="M12 14 L12 8 M10 11 L14 12" />
        <path d="M52 18 L52 12 M50 15 L54 15" />
        <path d="M16 30 L16 26 M14 28 L18 28" />
      </g>
    </svg>
  `;

  let upgrades = [
    {
      id: "vending",
      name: "Gacha Calibration",
      level: p.vendingQLevel || 0,
      effectPerLevel: 1.0,
      cost: Math.floor(15000 * Math.pow(1.18, p.vendingQLevel || 0)),
      color: "#f1c40f",
      desc: "Calibrates the Gachapon vending machine, permanently increasing base roll quality multipliers by +1% per level.",
      accentClass: "sink-accent-vending",
      iconSvg: gachaIconSvg,
    },
    {
      id: "shop",
      name: "Merchant Investment",
      level: p.shopQLevel || 0,
      effectPerLevel: 1.0,
      cost: Math.floor(30000 * Math.pow(1.22, p.shopQLevel || 0)),
      color: "#3498db",
      desc: "Invests in the local merchant guild, permanently improving the base quality of restocked shop items by +1% per level.",
      accentClass: "sink-accent-shop",
      iconSvg: shopIconSvg,
    },
    {
      id: "global",
      name: "Aura of Fortune",
      level: p.globalQLevel || 0,
      effectPerLevel: 1.5,
      cost: Math.floor(100000 * Math.pow(1.28, p.globalQLevel || 0)),
      color: "#2ecc71",
      desc: "Projects a global aura of pure probability, permanently boosting world drop rates and quality parameters by +1% per level.",
      accentClass: "sink-accent-global",
      iconSvg: globalIconSvg,
    },
  ];

  el.innerHTML = upgrades
    .map((u) => {
      let canAfford = BigNum.from(p.coins).gte(u.cost);
      let costColor = canAfford ? "#2ecc71" : "#e74c3c";

      let btnHtml = "";
      if (canAfford) {
        btnHtml = `
                      <button class="btn-action"
                              style="background: ${u.color}; color: ${u.color === "#f1c40f" ? "#111" : "#fff"}; width: 100%; padding: 10px; font-size: 11px; border-radius: 6px; font-weight: bold; letter-spacing: 0.5px; text-transform: uppercase; border: 1px solid #fff; box-shadow: 0 0 10px ${u.color}44; cursor: pointer; transition: all 0.2s;"
                              onpointerdown="event.stopPropagation();"
                              ontouchstart="event.stopPropagation();"
                              onclick="event.stopPropagation(); window.buyGoldUpgrade('${u.id}')">
                          Upgrade Sink
                      </button>
                    `;
      } else {
        btnHtml = `
        <button class="btn-action"
                style="background: #242933; color: #5c6370; width: 100%; padding: 10px; font-size: 11px; border-radius: 6px; font-weight: bold; letter-spacing: 0.5px; text-transform: uppercase; border: 1px solid #2d3139; cursor: not-allowed; opacity: 0.8;"
                disabled>
            🔒 Lacking Gold
        </button>
      `;
      }

      // Segment milestone calculations
      let currentMilestoneProgress = u.level % 10;
      let nextMilestone = Math.ceil((u.level + 1) / 10) * 10;
      let progressPercent = (currentMilestoneProgress / 10) * 100;
      if (u.level > 0 && u.level % 10 === 0) {
        progressPercent = 100;
        currentMilestoneProgress = 10;
      }

      return `
      <div id="sink-card-${u.id}" class="sink-slate-panel ${u.accentClass}"
           style="display: flex; flex-direction: column; justify-content: space-between; border: 1.5px solid ${u.color}50; border-radius: 12px; padding: 16px; position: relative; overflow: hidden; background: linear-gradient(180deg, #161a23 0%, #0c0f17 100%); transition: all 0.25s ease-in-out; min-height: 290px; box-shadow: 0 4px 15px rgba(0,0,0,0.65), inset 0 0 10px rgba(${window.hexToRgbValues(u.color)}, 0.05);">

          <!-- Holographic sweep shine overlay -->
          <div class="sink-shimmer" style="position: absolute; top: -50%; left: -50%; width: 200%; height: 200%; background: linear-gradient(135deg, rgba(255,255,255,0) 45%, rgba(255,255,255,0.06) 50%, rgba(255,255,255,0) 55%); transform: rotate(-15deg); pointer-events: none; z-index: 1; transition: all 0.75s ease-in-out;"></div>

          <div>
              <!-- Top Row Header: Name & Cost Badge -->
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; gap: 8px; position: relative; z-index: 2;">
                  <strong style="color: ${u.color}; font-size: 14.5px; font-weight: bold; text-shadow: 0 0 10px ${u.color}35;">${u.name}</strong>
                  <span style="background: ${costColor}12; border: 1.5px solid ${costColor}80; color: ${costColor}; font-family: monospace; font-size: 11px; font-weight: bold; padding: 3px 8px; border-radius: 4px; box-shadow: 0 0 8px ${costColor}1a;">
                      ${window.formatNumber(u.cost)} G
                  </span>
              </div>

              <!-- Content Row: Vector Icon and Stat Block Matrix -->
              <div style="display: flex; gap: 14px; align-items: center; margin-bottom: 12px; position: relative; z-index: 2;">
                  <div class="sink-icon-container" style="width: 76px; height: 72px; display: flex; align-items: center; justify-content: center; background: rgba(0, 0, 0, 0.55); border: 2px solid ${u.color}; border-radius: 10px; flex-shrink: 0; box-shadow: inset 0 0 10px #000; transition: transform 0.2s ease;">
                      ${u.iconSvg}
                  </div>

                  <div style="flex: 1; display: grid; grid-template-columns: 1fr; gap: 4px; background: rgba(0,0,0,0.3); border: 1px solid #222; border-radius: 6px; padding: 6px 10px;">
                      <div style="display: flex; justify-content: space-between; font-size: 10px; color: #888; line-height:1;">
                          <span>RANK TIER:</span>
                          <span style="color: #fff; font-weight: bold; font-family: monospace;">Lv. ${u.level} ➔ <span style="color:#2ecc71;">${u.level + 1}</span></span>
                      </div>
                      <div style="display: flex; justify-content: space-between; font-size: 10px; color: #888; line-height:1;">
                          <span>EFFECTIVE:</span>
                          <span style="color: #fff; font-weight: bold; font-family: monospace;">
                              +${(u.level * u.effectPerLevel).toFixed(1)}% ➔ <span style="color:#2ecc71;">+${((u.level + 1) * u.effectPerLevel).toFixed(1)}%</span>
                          </span>
                      </div>
                  </div>
              </div>

              <!-- Description Block -->
              <div style="font-size: 11px; color: #cbd5e1; line-height: 1.45; text-align: left; white-space: normal; margin-bottom: 12px; position: relative; z-index: 2; min-height: 38px;">
                  ${u.desc}
              </div>
          </div>

          <!-- Bottom Area: Milestone segment bar & Button -->
          <div style="position: relative; z-index: 2; border-top: 1px dashed rgba(255,255,255,0.06); padding-top: 12px; margin-top: auto;">
              <div style="display: flex; justify-content: space-between; font-size: 9px; color: #aaa; font-family: monospace; margin-bottom: 4px; line-height: 1;">
                  <span>MILESTONE PROGRESS:</span>
                  <span style="color: #df9ffb; font-weight: bold;">${currentMilestoneProgress} / 10</span>
              </div>
              <div class="sink-prog-track" style="margin-top: 0; margin-bottom: 12px;">
                  <div class="sink-prog-fill ${u.id}" style="width: ${progressPercent}%; height: 100%; transition: width 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);"></div>
              </div>
              ${btnHtml}
          </div>
      </div>
    `;
    })
    .join("");
};

window.renderMysticalShop = function () {
  let el = document.getElementById("mystical-shop-list");
  if (!el) return;

  el.style.display = "flex";
  el.style.flexDirection = "column";
  el.style.gap = "16px";

  let stockHtml =
    `
    <div style="font-size:11px; color:#9b59b6; font-weight:bold; letter-spacing:1.5px; text-transform:uppercase; text-align:left; border-bottom:1px solid #333; padding-bottom:6px; width:100%; display:flex; align-items:center; gap:6px;">
        <span>🔮 Celestial Stock</span>
    </div>
    <div class="alchemy-workbench-panel">
        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap:10px; width:100%; position:relative; z-index:2;">
  ` +
    window.MYSTICAL_STOCK.map((item, index) => {
      let costColor = "#e74c3c";
      let currencyLabel = "Gold";
      let displayCost = item.cost;

      if (item.currency === "Luminous Soul") {
        let owned = window.inventory.ETC["Luminous Soul"] || 0;
        costColor = owned >= item.cost ? "#ffb6c1" : "#e74c3c";
        currencyLabel = "Souls";
      } else if (item.currency === "Astral Shards") {
        let owned = window.playerStats.astralShards || 0;
        costColor = owned >= item.cost ? "#9b59b6" : "#e74c3c";
        currencyLabel = "Shards";
      } else {
        displayCost = Math.ceil(
          item.cost * Math.pow(1.08, window.playerStats.stage),
        );
        costColor = BigNum.from(window.playerStats.coins).gte(displayCost)
          ? "#f1c40f"
          : "#e74c3c";
      }

      let iconHtml =
        item.name === "Gacha Key" ||
        item.name === "Astral Essence" ||
        item.name === "Catalyst Core"
          ? getEtcIconHtml(item.name)
          : getUseIconHtml(item.name);
      iconHtml = iconHtml.replace("margin-right: 12px;", "margin-right: 6px;");

      let btnStyle = `background: ${item.color}; color: ${item.color === "#f1c40f" ? "#111" : "#fff"}; font-weight: bold;`;

      return `
                <div class="shop-row" style="border: 1.5px solid ${item.color}50; background: linear-gradient(180deg, #161921 0%, #0d0f14 100%); box-shadow: 0 4px 15px rgba(0,0,0,0.85), inset 0 0 10px rgba(${window.hexToRgbValues ? window.hexToRgbValues(item.color) : "255,255,255"}, 0.05); flex-direction: column; align-items: stretch; text-align: left; gap: 4px; padding: 12px; height:100%; display:flex; justify-content:space-between; margin-bottom:0; transition: transform 0.18s, border-color 0.18s, box-shadow 0.18s;" onmouseenter="window.showMysticalShopTooltip(event, ${index})" onmouseleave="window.hideTooltip()">
                    <div>
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                                          <div style="display:flex; align-items:center; gap:8px; min-width:0; cursor:help;"
                                               ontouchstart="window.showMysticalShopTooltip(event, ${index}); event.stopPropagation();">
                                              ${iconHtml}
                                              <strong style="color:${item.color}; font-size:12.5px; display:block; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; text-shadow:0 0 8px ${item.color}35;">${item.name}</strong>
                                          </div>
                                      </div>
                                      <div style="font-size:10px; color:#94a3b8; margin-bottom:10px; line-height:1.4; white-space:normal;">${item.desc}</div>
                                  </div>
                                  <div style="border-top:1px dashed rgba(255,255,255,0.08); padding-top:8px; display:flex; justify-content:space-between; align-items:center; margin-top:auto;">
                                               <span style="color:${costColor}; font-weight:bold; font-size:11px; font-family:monospace;">${window.formatNumber(displayCost)} ${currencyLabel}</span>
                                               <button class="btn-action" style="${btnStyle} font-size:10.5px; padding:4px 12px; border-radius:4px; box-shadow:0 0 6px ${item.color}33;" onpointerdown="event.stopPropagation();" ontouchstart="event.stopPropagation();" onclick="event.stopPropagation(); window.buyMysticalItem(${index})">Purchase</button>
                                           </div>
                </div>
              `;
    }).join("") +
    `</div></div>`;

  let transHtml =
    `
    <div style="font-size:11px; color:#2ecc71; font-weight:bold; letter-spacing:1.5px; text-transform:uppercase; text-align:left; border-bottom:1px solid #333; padding-bottom:6px; width:100%;">🧪 Alchemical Transmutations</div>
    <div class="alchemy-workbench-panel" style="border-color:#2ecc71; background: linear-gradient(135deg, #0a110f 0%, #030605 100%);">
        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap:10px; width:100%; position:relative; z-index:2;">
  ` +
    window.POTION_TRANSMUTATIONS.map((recipe, index) => {
      let ownedCount = window.inventory.USE[recipe.req] || 0;
      let canAfford = ownedCount >= recipe.amount;
      let costColor = canAfford ? "#2ecc71" : "#e74c3c";

      let iconHtml = getUseIconHtml(recipe.result);
      iconHtml = iconHtml.replace("margin-right: 12px;", "margin-right: 6px;");

      let btnStyle = canAfford
        ? `background: ${recipe.color}; color: #fff; font-weight: bold; box-shadow:0 0 8px ${recipe.color}33;`
        : "background: #252830; color: #555; cursor: not-allowed; border: 1px solid #3c4454;";

      let indicatorClass = canAfford
        ? "reagent-indicator available"
        : "reagent-indicator missing";

      return `
                <div class="shop-row" style="border-color: ${recipe.color}; background: rgba(0,0,0,0.5); flex-direction: column; align-items: stretch; text-align: left; gap: 4px; padding: 12px; height:100%; display:flex; justify-content:space-between; margin-bottom:0; transition: transform 0.18s, border-color 0.18s, box-shadow 0.18s;" onmouseenter="window.showTransmuteTooltip(event, ${index})" onmouseleave="window.hideTooltip()">
                     <div>
                         <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                             <div style="display:flex; align-items:center; gap:8px; min-width:0; flex:1; cursor:help;"
                                  ontouchstart="window.showTransmuteTooltip(event, ${index}); event.stopPropagation();">
                                 ${iconHtml}
                                 <strong style="color:${recipe.color}; font-size:12.5px; display:block; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; flex:1; text-shadow:0 0 8px ${recipe.color}35;">Brew: ${recipe.result}</strong>
                             </div>
                         </div>
                         <div style="font-size:10px; color:#94a3b8; margin-bottom:6px; line-height:1.4; white-space:normal;">${recipe.desc} (Owned: ${ownedCount})</div>
                     </div>

                     <!-- Reagent Split Card Layout with Active Status indicators -->
                     <div class="split-reagent-card" style="border-color:${canAfford ? "rgba(46,204,113,0.3)" : "rgba(231,76,60,0.3)"};">
                         <div style="display:flex; align-items:center; gap:6px;">
                             <span class="${indicatorClass}"></span>
                             <span style="color:#888;">Need:</span>
                             <span style="color:${costColor}; font-weight:bold;">${recipe.amount}x ${recipe.req.replace(" Elixir", "")}</span>
                         </div>
                         <span style="color:#555;">➔</span>
                         <span style="color:#fff; font-weight:bold;">1x ${recipe.result.replace(" Elixir", "")}</span>
                     </div>

                     <div style="border-top:1px dashed rgba(255,255,255,0.08); padding-top:8px; display:flex; justify-content:space-between; align-items:center; margin-top:8px;">
                                                          <span style="color:${costColor}; font-weight:bold; font-size:11px; font-family:monospace;">${recipe.amount}x Ingredients</span>
                                                          <button class="btn-action" style="${btnStyle} font-size:10.5px; padding:4px 12px; border-radius:4px;" ${canAfford ? "" : "disabled"} onpointerdown="event.stopPropagation();" ontouchstart="event.stopPropagation();" onclick="event.stopPropagation(); window.transmutePotion(${index})">Transmute</button>
                                                      </div>
                 </div>
               `;
    }).join("") +
    `</div></div>`;

  el.innerHTML = stockHtml + transHtml;
};

window.renderAstralShop = function () {
  let el = document.getElementById("astral-shop-list");
  if (!el) return;

  let ownedShards = window.playerStats.astralShards || 0;
  let html = "";

  window.ASTRAL_SHOP_STOCK.forEach((item, index) => {
    let canAfford = ownedShards >= item.cost;
    let costColor = canAfford ? "#2ecc71" : "#e74c3c";
    let iconHtml = window
      .getEtcIconHtml(item.name)
      .replace("margin-right: 12px;", "margin-right: 6px;");

    let btnStyle = canAfford
      ? `background: ${item.color}; color: ${item.color === "#f1c40f" || item.color === "#ffb6c1" ? "#111" : "#fff"}; font-weight: bold;`
      : "";

    html += `
        <div class="runic-altar-card" style="flex-direction: column; align-items: stretch; text-align: left; gap: 4px; padding: 12px; height:100%; display:flex; justify-content:space-between; margin-bottom:0;" onmouseenter="window.showAstralShopItemTooltip(event, ${index})" onmouseleave="window.hideTooltip()">
            <!-- Animated rotating stars background -->
            <div class="starry-bg"></div>

            <!-- Floating glowing rune price tag -->
            <span class="rune-price-badge" style="color:${costColor};">${item.cost} Shards</span>

            <div style="position:relative; z-index:2;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                    <div style="display:flex; align-items:center; gap:6px; min-width:0; flex:1; cursor:help;"
                         ontouchstart="window.showAstralShopItemTooltip(event, ${index}); event.stopPropagation();">
                        ${iconHtml}
                        <strong style="font-size:11.5px; color:#fff; display:block; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${item.name}</strong>
                    </div>
                </div>
                <p style="font-size:10px; color:#94a3b8; margin-bottom:8px; line-height:1.35; white-space:normal;">${item.desc}</p>
            </div>

            <div style="position:relative; z-index:2; border-top: 1px dashed rgba(255,255,255,0.08); padding-top:8px; margin-top:6px;">
                                              <button class="btn-action btn-infuse-shards" style="width:100%; font-size:10.5px; padding:6px; border-radius:4px;" ${canAfford ? "" : "disabled"} onpointerdown="event.stopPropagation();" ontouchstart="event.stopPropagation();" onclick="event.stopPropagation(); window.buyAstralShopItem(${index})">Infuse Shards</button>
                                          </div>
        </div>
      `;
  });

  el.innerHTML = html;
};

window.getPrestigeUpgradeCost = function (type, currentLevel) {
  if (type === "bag") return 10; // Bag upgrade remains flat 10 PP
  return currentLevel + 1; // Uncapped linear cost progression (1 PP, 2 PP, 3 PP...)
};

window.calculateCumulativePP = function (stage) {
  if (stage < 80) return 0;
  return Math.floor(3 * Math.pow(stage / 80, 3.5));
};

window.executePrestigeAscension = function () {
  let currentStage = window.playerStats.maxStage || 1;
  let hwm = window.playerStats.highestPrestigeStageCleared || 80;
  if (hwm < 80) hwm = 80;

  let rCurrent = window.calculateCumulativePP(currentStage);
  let rHwm = window.calculateCumulativePP(hwm);
  let deltaPP = Math.max(0, rCurrent - rHwm);

  let message = `Are you sure you want to perform an Ascension? This will soft-reset your current run but award permanent multipliers!<br><br>
                 • Current Stage Reached: <strong style="color:#fff;">Stage ${currentStage}</strong><br>
                 • High-Water Mark Peak: <strong style="color:#bdc3c7;">Stage ${hwm}</strong><br>
                 • <strong>Prestige Points (PP) Awarded: <span style="color:#ffd700;">+${deltaPP} PP</span></strong>`;

  window.showCustomConfirm(
    "Ascend Soul",
    message,
    "Ascend Now",
    "Cancel",
    "#9b59b6",
    function () {
      // Perform Ascension Reset
      window.playerStats.prestigePoints = (window.playerStats.prestigePoints || 0) + deltaPP;
      window.playerStats.prestigeCount = (window.playerStats.prestigeCount || 0) + 1;
      window.playerStats.highestPrestigeStageCleared = Math.max(window.playerStats.highestPrestigeStageCleared || 80, currentStage);

      window.playerStats.level = 1;
      window.playerStats.xp = 0;
      window.playerStats.xpReq = 100;

      let peak = window.playerStats.lifetimePeakStage || 1;
      let advancedStart = Math.max(1, Math.floor(peak * 0.5));
      window.playerStats.stage = advancedStart;
      window.playerStats.maxStage = advancedStart;

      window.playerStats.crucibleWave = 1;
      window.playerStats.crucibleStartWave = 1;
      window.playerStats.isPrestigeBossMode = false;
      window.playerStats.prestigeApproachTimer = 0;
      window.mob = null;
      window.hero.x = 40;

      let p = window.resolvePlayerStats();
      window.playerStats.currentHp = p.maxHp;

      // Show congratulations modal
      let modal = document.createElement("div");
      modal.style.position = "fixed";
      modal.style.top = "0";
      modal.style.left = "0";
      modal.style.width = "100%";
      modal.style.height = "100%";
      modal.style.backgroundColor = "rgba(0,0,0,0.92)";
      modal.style.display = "flex";
      modal.style.justifyContent = "center";
      modal.style.alignItems = "center";
      modal.style.zIndex = "35000";
      modal.style.padding = "15px";

      modal.innerHTML = `
        <div style="background:#151515; border:3px solid #9b59b6; border-radius: 8px; width:100%; max-width:440px; display:flex; flex-direction:column; box-shadow: 0 10px 40px rgba(0,0,0,0.95); text-align:center; padding:20px; animation: toastFadeIn 0.3s;">
          <h2 style="margin:0 0 10px 0; color:#df9ffb; letter-spacing:3px; text-transform:uppercase; font-size:22px;">🌌 SOUL ASCENDED!</h2>
          <div style="height:2px; background:linear-gradient(90deg, transparent, #9b59b6, transparent); margin-bottom:15px;"></div>
          <p style="font-size:12px; color:#ddd; line-height:1.5; margin-bottom:20px;">
            Your soul has ascended to a higher plane of permanent power!
          </p>
          <div style="background:#0b0f12; border:1px solid #9b59b6; border-radius:6px; padding:15px; margin-bottom:20px;">
            <div style="font-size:11px; color:#aaa; margin-bottom:4px;">REWARDS EARNED:</div>
            <div style="font-size:20px; color:#ffd700; font-weight:bold; margin-bottom:6px;">✨ +${deltaPP} Prestige Points</div>
            <div style="font-size:11px; color:#9b59b6; font-weight:bold; border-top: 1px solid #333; padding-top:6px; margin-top:6px;">Total Ascensions: ${window.playerStats.prestigeCount}</div>
          </div>
          <button id="btn-prestige-ascend-confirm" style="background:linear-gradient(135deg, #9b59b6, #8e44ad); color:white; border:1px solid #fff; font-weight:bold; font-size:13px; text-transform:uppercase; letter-spacing:1px; padding:12px 24px; border-radius:4px; cursor:pointer; width:100%;">Continue Journey</button>
        </div>
      `;
      document.body.appendChild(modal);

      document.getElementById("btn-prestige-ascend-confirm").onclick = function () {
        modal.remove();
        window.isGamePaused = false;
        window.checkAchievements();
        window.updateUI();
        window.renderPrestigeTab();
        window.renderInventory();
        window.saveGame();
      };
    }
  );
};

window.renderPrestigeTab = function () {
  let el = document.getElementById("tab-prestige");
  if (!el) return;

  let p = window.playerStats;
  if (p.level < 25 && (p.prestigeCount || 0) === 0) {
    let progressPct = Math.min(100, (p.level / 25) * 100);
    el.innerHTML = `
        <div style="text-align:center; padding: 40px 20px; background: linear-gradient(135deg, #0e051d 0%, #030109 100%); border: 2px solid #8e44ad; border-radius: 8px; box-shadow: 0 8px 30px rgba(0,0,0,0.9), inset 0 0 20px rgba(142, 68, 173, 0.22); max-width: 440px; margin: 0 auto; animation: toastFadeIn 0.3s ease-out;">
            <div style="margin-bottom: 20px;">
                <svg width="72" height="72" viewBox="0 0 64 64" style="display:inline-block; filter: drop-shadow(0 0 10px #8e44ad);">
                    <circle cx="32" cy="32" r="28" fill="none" stroke="#9b59b6" stroke-width="2" stroke-dasharray="4 4" />
                    <path d="M20 28 L20 22 C20 15, 24 12, 32 12 C40 12, 44 15, 44 22 L44 28" fill="none" stroke="#9b59b6" stroke-width="3" stroke-linecap="round" />
                    <rect x="16" y="26" width="32" height="24" rx="4" fill="#0c0515" stroke="#9b59b6" stroke-width="3" />
                    <path d="M32 33 L32 40" stroke="#ff007f" stroke-width="3" stroke-linecap="round" />
                    <circle cx="32" cy="33" r="2" fill="#ff007f" />
                </svg>
            </div>
            <h3 style="margin:0 0 10px 0; color:#df9ffb; font-size:15px; font-weight:bold; letter-spacing:2px; text-transform:uppercase; text-shadow: 0 0 10px rgba(155, 89, 182, 0.55);">Celestial Seal Active</h3>
            <p style="font-size:11px; color:#a29bfe; max-width: 320px; margin: 0 auto 15px auto; line-height: 1.5; white-space:normal;">
                The Altar of Ascension is protected by an ancient cosmic seal. Reach <strong style="color:#ffd700;">Level 25</strong> to break the seal and unlock permanent multipliers!
            </p>
            <div style="width:100%; max-width:260px; margin: 0 auto 8px auto; background:#111; height:8px; border-radius:4px; overflow:hidden; border:1px solid #333; position:relative;">
                <div style="width:${progressPct}%; height:100%; background:linear-gradient(90deg, #9b59b6, #e84393); box-shadow:0 0 8px #9b59b6; transition: width 0.4s ease;"></div>
            </div>
            <div style="font-size: 11.5px; font-weight: bold; color: #f1f5f9; font-family: monospace;">
                Progress: <span style="color:#e74c3c;">Lv ${p.level}</span> / <span style="color:#2ecc71;">25</span> (${progressPct.toFixed(0)}%)
            </div>
        </div>
    `;
    return;
  }

  let upgrades = p.prestigeUpgrades || {
    bag: 0,
    gold: 0,
    exp: 0,
    drop: 0,
    atk: 0,
    fort: 0,
    fairy: 0,
  };
  let goldPts = upgrades.gold || 0;
  let expPts = upgrades.exp || 0;
  let dropPts = upgrades.drop || 0;
  let atkPts = upgrades.atk || 0;
  let fortPts = upgrades.fort || 0;
  let fairyPts = upgrades.fairy || 0;

  // Model 1 Calculations
  let hwm = p.highestPrestigeStageCleared || 80;
  if (hwm < 80) hwm = 80;
  let currentStage = p.maxStage || 1;

  let rCurrent = window.calculateCumulativePP(currentStage);
  let rHwm = window.calculateCumulativePP(hwm);
  let deltaPP = Math.max(0, rCurrent - rHwm);

  let minReqStage = Math.max(80, Math.floor(hwm * 0.8));
  let isEligible = currentStage >= minReqStage;

  let getUpgradeCardHtml = (
    type,
    label,
    icon,
    currentText,
    bonusDesc,
    pts,
    color,
  ) => {
    let cost = window.getPrestigeUpgradeCost(type, pts);
    let canAfford = p.prestigePoints >= cost;
    let costColor = canAfford ? "#2ecc71" : "#e74c3c";
    let bgStyle = window.hexToRgba(color, 0.04);
    let fontColor =
      color === "#f1c40f" || color === "#ffb6c1" ? "#111" : "#fff";

    return `
        <div class="shop-row" style="border-color:${color}; background:${bgStyle}; flex-direction:column; align-items:stretch; text-align:left; gap:4px; padding:10px; margin-bottom:0; cursor:help;">
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <strong style="color:${color}; font-size:11.5px;">${icon} ${label} <span style="color:#aaa;">(Lv. ${pts})</span></strong>
                <span style="color:${costColor}; font-weight:bold; font-size:11px;">${cost} PP</span>
            </div>
            <div style="font-size:9.5px; color:#aaa; line-height:1.35; margin-bottom:6px;">${bonusDesc} <br>Currently: <span style="color:#fff; font-weight:bold;">${currentText}</span></div>
            <button class="btn-action" style="background:${color}; color:${fontColor}; font-weight:bold; font-size:10px; padding:4px;" ${canAfford ? "" : 'disabled style="opacity:0.5; cursor:not-allowed;"'} onclick="window.buyPrestigeUpgrade('${type}')">Upgrade</button>
        </div>
      `;
  };

  // Paragon Cost
  let parLevel = p.paragonLevel || 0;
  let parGoldCost = Math.floor(1000000 * Math.pow(1.5, parLevel));
  let parMythicScrapCost = Math.floor(50 * Math.pow(1.3, parLevel));
  let parLegendaryScrapCost = Math.floor(150 * Math.pow(1.3, parLevel));
  let parEpicScrapCost = Math.floor(350 * Math.pow(1.3, parLevel));
  let parCoreCost = Math.floor(10 * Math.pow(1.15, parLevel));

  let goldOwned = window.playerStats.coins || 0;
  let mythicScrapsOwned = window.inventory.ETC["Mythic Scrap"] || 0;
  let legendaryScrapsOwned = window.inventory.ETC["Legendary Scrap"] || 0;
  let epicScrapsOwned = window.inventory.ETC["Epic Scrap"] || 0;
  let coresOwned = window.inventory.ETC["Catalyst Core"] || 0;

  let canAffordParagon =
    goldOwned >= parGoldCost &&
    mythicScrapsOwned >= parMythicScrapCost &&
    legendaryScrapsOwned >= parLegendaryScrapCost &&
    epicScrapsOwned >= parEpicScrapCost &&
    coresOwned >= parCoreCost;

  let parGoldColor = goldOwned >= parGoldCost ? "#2ecc71" : "#e74c3c";
  let parMythicColor =
    mythicScrapsOwned >= parMythicScrapCost ? "#2ecc71" : "#e74c3c";
  let parLegendaryColor =
    legendaryScrapsOwned >= parLegendaryScrapCost ? "#2ecc71" : "#e74c3c";
  let parEpicColor =
    epicScrapsOwned >= parEpicScrapCost ? "#2ecc71" : "#e74c3c";
  let parCoreColor = coresOwned >= parCoreCost ? "#2ecc71" : "#e74c3c";

  let paragonBonusText = `+${(parLevel * 0.5).toFixed(1)}% Base Attributes (STR/DEX/INT)`;

  let paragonInfusionCardHtml = `
      <div class="market-card" style="border-color:#ff007f; background:linear-gradient(135deg, #15000b 0%, #030003 100%); text-align:left; padding:12px; border-radius:8px; box-shadow: 0 4px 15px rgba(255, 0, 127, 0.15); margin-top:12px; display:flex; flex-direction:column; justify-content:space-between;">
          <div>
              <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #5a0a33; padding-bottom:6px; margin-bottom:8px;">
                  <h3 style="margin:0; color:#ff007f; font-size:13px; text-transform:uppercase; letter-spacing:1px; text-shadow:0 0 8px rgba(255,0,127,0.35); display:flex; align-items:center; gap:6px;">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ff007f" stroke-width="2.5"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg>
                      Paragon Infusion
                  </h3>
                  <span style="background:rgba(255,0,127,0.15); border:1px solid #ff007f; color:#ffb6c1; font-size:10px; font-weight:bold; padding:2px 10px; border-radius:10px; font-family:monospace;">Paragon Level: ${parLevel}</span>
              </div>
              <p style="font-size:10px; color:#aaa; margin-bottom:10px; line-height:1.4; white-space:normal;">
                  Sacrifice high-end materials and massive gold caches to fuse the permanent Paragon Matrix. Multiplies all base attributes permanently.
              </p>
              <div style="background:rgba(0,0,0,0.5); border:1px solid #222; border-radius:4px; padding:8px; margin-bottom:10px; font-size:10.5px;">
                  <div style="font-weight:bold; color:#ff007f; font-family:monospace; margin-bottom:4px;">🧬 ACTIVE MATRIX BONUS:</div>
                  <strong style="color:#fff; font-size:11.5px;">${paragonBonusText}</strong>
              </div>
              <div style="background:rgba(0,0,0,0.5); border:1px solid #222; border-radius:4px; padding:8px; font-family:monospace; font-size:9.5px;">
                  <div style="color:#aaa; font-weight:bold; border-bottom:1px solid #333; padding-bottom:2px; margin-bottom:4px; text-transform:uppercase; letter-spacing:0.5px;">📋 Next Level Requirements:</div>
                  <div style="display:flex; flex-direction:column; gap:3px;">
                      <div style="display:flex; justify-content:space-between;"><span>• Gold:</span><strong style="color:${parGoldColor};">${window.formatNumber(parGoldCost)} / ${window.formatNumber(goldOwned)}</strong></div>
                      <div style="display:flex; justify-content:space-between;"><span>• Mythic Scraps:</span><strong style="color:${parMythicColor};">${parMythicScrapCost} / ${mythicScrapsOwned}</strong></div>
                      <div style="display:flex; justify-content:space-between;"><span>• Legendary Scraps:</span><strong style="color:${parLegendaryColor};">${parLegendaryScrapCost} / ${legendaryScrapsOwned}</strong></div>
                      <div style="display:flex; justify-content:space-between;"><span>• Epic Scraps:</span><strong style="color:${parEpicColor};">${parEpicScrapCost} / ${epicScrapsOwned}</strong></div>
                      <div style="display:flex; justify-content:space-between;"><span>• Catalyst Cores:</span><strong style="color:${parCoreColor};">${parCoreCost} / ${coresOwned}</strong></div>
                  </div>
              </div>
          </div>
          <button class="btn-action" style="width:100%; margin-top:10px; padding:10px; font-weight:bold; font-size:11.5px; background:#ff007f; color:white; border:1px solid #fff; box-shadow:0 0 12px rgba(255, 0, 127, 0.35);" ${canAffordParagon ? "" : 'disabled style="opacity:0.5; cursor:not-allowed;"'} onclick="window.executeParagonUpgrade()">
              INFUSE MATRIX
          </button>
      </div>
    `;

  let challengeBtnHtml = "";
  if (isEligible) {
    challengeBtnHtml = `
      <button class="btn-action btn-pulse-teal" style="background:linear-gradient(135deg, #9b59b6, #8e44ad); color:white; width:100%; padding:12px; font-weight:bold; font-size:11.5px; border:1px solid #fff; box-shadow:0 0 12px rgba(155,89,182,0.45); text-transform:uppercase; letter-spacing:0.5px;" onclick="window.executePrestigeAscension()">
          Initiate Ascension
      </button>
    `;
  } else {
    challengeBtnHtml = `
      <button class="btn-action" style="background:#222; border:1px solid #444; color:#666; width:100%; padding:12px; font-weight:bold; font-size:10.5px; cursor:not-allowed; opacity:0.8;" disabled>
          Locked (Needs Stage ${minReqStage})
      </button>
    `;
  }

  el.innerHTML = `
    <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap:12px;">

        <!-- LEFT COLUMN: BOSS BATTLE CONSOLE -->
                <div class="market-card" style="border-color:#9b59b6; background:linear-gradient(135deg, #10081a 0%, #030005 100%); text-align:left; padding:12px; border-radius:8px; box-shadow:0 4px 15px rgba(0,0,0,0.7); display:flex; flex-direction:column; justify-content:space-between;">
                    <div>
                        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #4a154b; padding-bottom:6px; margin-bottom:8px;">
                            <h3 style="margin:0; color:#df9ffb; font-size:13px; text-transform:uppercase; letter-spacing:1px; text-shadow:0 0 10px rgba(155,89,182,0.35); text-align:center; width:100%;">🔮 Altar of Ascension</h3>
                        </div>

                        <!-- Ascension Portal graphic -->
                <div style="margin: 10px 0; text-align:center;">
                    <svg width="68" height="68" viewBox="0 0 64 64" style="display:inline-block; filter: drop-shadow(0 0 8px rgba(155, 89, 182, 0.55));">
                        <circle cx="32" cy="32" r="28" fill="none" stroke="#9b59b6" stroke-width="2" stroke-dasharray="3 3" />
                        <circle cx="32" cy="32" r="18" fill="rgba(155, 89, 182, 0.15)" stroke="#df9ffb" stroke-width="1.5" />
                        <polygon points="32,14 41,32 32,50 23,32" fill="#fff" opacity="0.8" style="filter: drop-shadow(0 0 4px #fff);" />
                    </svg>
                </div>

                <!-- Milestone tracking dashboard -->
                <div style="background:rgba(15,7,25,0.85); border:1px solid #4a154b; border-radius:6px; padding:10px; margin-bottom:12px; font-family:monospace; font-size:10px; display:flex; flex-direction:column; gap:4px;">
                    <div style="display:flex; justify-content:space-between;"><span>• High-Water Mark Stage:</span><strong style="color:#df9ffb;">Stage ${hwm}</strong></div>
                    <div style="display:flex; justify-content:space-between;"><span>• Current Run Peak:</span><strong style="color:#fff;">Stage ${currentStage}</strong></div>
                    <div style="display:flex; justify-content:space-between;"><span>• Min Stage Required:</span><strong style="color:${isEligible ? "#2ecc71" : "#e74c3c"};">Stage ${minReqStage}</strong></div>
                </div>

                <!-- Progression mathematics block -->
                                            <div style="background:rgba(0,0,0,0.5); border:1px solid #222; border-radius:4px; padding:8px; margin-bottom:12px; font-family:monospace; font-size:9.5px;">
                                                <div style="color:#aaa; font-weight:bold; border-bottom:1px solid #333; padding-bottom:2px; margin-bottom:4px; text-transform:uppercase; letter-spacing:0.5px;">📐 Projected Milestone Gains:</div>
                                                <div style="display:flex; flex-direction:column; gap:2px; padding:2px;">
                                                    <div style="display:flex; justify-content:space-between;"><span>• Cumulative PP (Peak):</span><strong style="color:#888;">${rHwm} PP</strong></div>
                                                    <div style="display:flex; justify-content:space-between;"><span>• Cumulative PP (Run):</span><strong style="color:#888;">${rCurrent} PP</strong></div>
                                                    <div style="display:flex; justify-content:space-between; margin-top:4px; border-top:1px dashed #333; padding-top:4px;"><span>• PP Awarded on Reset:</span><strong style="color:#ffd700; font-size:11px;">+${deltaPP} PP</strong></div>
                                                </div>
                                            </div>

                <p style="font-size:9.5px; color:#aaa; line-height:1.45; white-space:normal; margin-bottom:12px; padding:0 2px;">
                    💡 <strong>HWM Rule Active:</strong> You will only earn Prestige Points (PP) if your current run's peak stage exceeds your previous High-Water Mark. Repetitive low-stage resets yield 0 PP.
                </p>
                                        </div>

                                        <div style="margin-top:auto;">
                                            ${challengeBtnHtml}
                                        </div>
                                    </div>

                                    <!-- RIGHT COLUMN: UPGRADES & PARAGON -->
                                    <div style="display:flex; flex-direction:column; gap:12px;">
                                        <!-- Prestige points balance banner -->
                                        <div style="background:#111; border:1px solid #333; padding:8px; border-radius:6px; display:flex; justify-content:space-between; align-items:center; font-family:monospace; font-size:11px;">
                                            <span>Ascension Points:</span>
                                            <strong style="color:#9b59b6; font-size:13px;">${p.prestigePoints} PP</strong>
                                        </div>

                                        <div style="display:flex; flex-direction:column; gap:6px;">
                                            ${getUpgradeCardHtml("gold", "Midas' Legacy", "🟡", `+${(goldPts * 25).toFixed(0)}% Gold`, "Increases Gold gained from mobs/bosses by +25% per level.", goldPts, "#f1c40f")}
                                            ${getUpgradeCardHtml("exp", "Ancient Wisdom", "🧠", `+${(expPts * 10).toFixed(0)}% EXP`, "Increases EXP gained from all sources by +10% per level.", expPts, "#a855f7")}
                                            ${getUpgradeCardHtml("drop", "Cosmic Fortune", "🍀", `+${(dropPts * 5).toFixed(0)}% Drop`, "Increases global drop rate modifier by +5% per level.", dropPts, "#2ecc71")}
                                            ${getUpgradeCardHtml("atk", "Gladiator's Might", "⚔️", `+${(atkPts * 12).toFixed(0)}% Atk`, "Increases global attack power by +12% per level.", atkPts, "#e74c3c")}
                                            ${getUpgradeCardHtml("fort", "Colossal Fortitude", "🛡️", `+${(fortPts * 10).toFixed(0)}% HP / +${(fortPts * 5).toFixed(0)}% Def`, "Increases global Max HP by +10% and Defense by +5% per level.", fortPts, "#3498db")}
                                            ${getUpgradeCardHtml("fairy", "Aetheric Beacon", "🧚", `+${(fairyPts * 5).toFixed(0)}% Spawn`, "Increases wild fairy spawn rates by +5% per level.", fairyPts, "#ffb6c1")}
                                        </div>

                                        ${paragonInfusionCardHtml}
                                    </div>

                                </div>
                              `;
};

window.buyPrestigeUpgrade = function (type) {
  let currentLevel = window.playerStats.prestigeUpgrades[type] || 0;
  let cost = window.getPrestigeUpgradeCost(type, currentLevel);

  if (window.playerStats.prestigePoints < cost) {
    if (typeof window.pushHeaderToast === "function")
      window.pushHeaderToast("❌ Insufficient Prestige Points!", "#e74c3c");
    return;
  }

  let upgradeNames = {
    gold: "Midas' Legacy",
    exp: "Ancient Wisdom",
    drop: "Cosmic Fortune",
    atk: "Gladiator's Might",
    fort: "Colossal Fortitude",
    fairy: "Aetheric Beacon",
  };
  let upgradeLabel = upgradeNames[type] || type;

  window.showCustomConfirm(
    "Ascension Upgrade",
    `Are you sure you want to purchase <strong>${upgradeLabel}</strong> level ${currentLevel + 1} for <strong>${cost} PP</strong>?`,
    "Confirm Purchase",
    "Cancel",
    "#9b59b6",
    function () {
      window.playerStats.prestigePoints -= cost;
      window.playerStats.prestigeUpgrades[type] = currentLevel + 1;

      if (typeof window.pushHeaderToast === "function")
        window.pushHeaderToast("🎉 Permanent Upgrade Acquired!", "#9b59b6");

      let p = window.resolvePlayerStats();
      window.playerStats.currentHp = Math.min(
        window.playerStats.currentHp,
        p.maxHp,
      );

      if (typeof window.checkAchievements === "function") {
        window.checkAchievements();
      }
      window.updateUI();
      window.renderPrestigeTab();
      window.renderInventory();
      window.saveGame();
    },
  );
};

window.challengeHooktail = function () {
  if (window.playerStats.level < 25) {
    window.pushHeaderToast("Requires Level 25!", "#e74c3c");
    return;
  }

  // Hooktail Stage requirements - check current run's maxStage meets 90% of peak Stage (with 80 floor) [1]
  let peak = window.playerStats.lifetimePeakStage || 1;
  let requiredStage = Math.max(80, Math.floor(peak * 0.9));
  if (window.playerStats.maxStage < requiredStage) {
    window.pushHeaderToast(
      `Requires current run Max Stage ${requiredStage} (90% of Peak ${peak}) to challenge Hooktail!`,
      "#e74c3c",
    );
    return;
  }

  if (
    window.playerStats.isDungeonMode ||
    window.playerStats.isCrucibleMode ||
    window.playerStats.isPrestigeBossMode ||
    window.playerStats.isUberBoss
  ) {
    window.pushHeaderToast(
      "Cannot challenge while in another activity!",
      "#e74c3c",
    );
    return;
  }

  window.showCustomConfirm(
    "Challenge Hooktail",
    "Are you prepared to face the massive dragon Hooktail? Defeating her will reset campaign peak parameters but award 3 Prestige Points!",
    "Challenge",
    "Flee",
    "#e74c3c",
    function () {
      window.saveGame();
      window.setPauseState(false);
      window.playerStats.isPrestigeBossMode = true;
      window.playerStats.prestigeApproachTimer = 180;
      window.mob = null;
      let p = window.resolvePlayerStats();
      window.playerStats.currentHp = p.maxHp;

      window.pushLog(
        `<span style='color:#e74c3c; font-weight:bold;'>[ASCENSION] Challenged Hooktail! Sprinting toward her cavern at high speed...</span>`,
      );
      window.updateUI();
      window.switchTab("gear");
    },
  );
};

window.triggerPrestigeAscension = function () {
  window.isGamePaused = true;
  window.playerStats.historicalPeakLvl = Math.max(
    window.playerStats.historicalPeakLvl || 1,
    window.playerStats.level,
  );

  let activeStage = window.playerStats.selectedPrestigeStage || 80;
  let rewardMultiplier = activeStage / 80;

  // Rebalance: Award Eridium Shards and crafting materials instead of gear items (scaling proportionally to fight tier)
  let awardedShards = Math.round(window.randInt(12, 20) * rewardMultiplier); // Compensated from 8-15
  let awardedEpic = Math.round(window.randInt(12, 18) * rewardMultiplier); // Compensated from 10-15
  let awardedLeg = Math.round(window.randInt(6, 12) * rewardMultiplier); // Compensated from 5-10
  let awardedMythic = Math.round(window.randInt(3, 6) * rewardMultiplier); // Compensated from 2-5

  if (typeof window.addEtcDrop === "function") {
    window.addEtcDrop("Eridium Shard", awardedShards);
    window.addEtcDrop("Epic Scrap", awardedEpic);
    window.addEtcDrop("Legendary Scrap", awardedLeg);
    window.addEtcDrop("Mythic Scrap", awardedMythic);
  }

  // Calculate Points: Base, Prestige Level Bonus, and Uncapped Deep Push Bonus! (based on selected fight challenge stage)
  let basePoints = 3;
  let bonusPoints = Math.floor(window.playerStats.prestigeCount / 4);
  let pushBonus = Math.max(0, Math.floor((activeStage - 80) / 10));
  let totalAwarded = Math.min(10, basePoints + bonusPoints) + pushBonus;

  window.playerStats.prestigePoints += totalAwarded;
  window.playerStats.prestigeCount++;
  if (window.playerStats.pendingClanProgress) {
    window.playerStats.pendingClanProgress.prestige =
      (window.playerStats.pendingClanProgress.prestige || 0) + 1;
  }

  let nowTime = Date.now();
  if (
    window.playerStats.lastAscensionTime &&
    nowTime - window.playerStats.lastAscensionTime <= 900000
  )
    window.playerStats.hasTriggeredSpeedrun = true;
  window.playerStats.lastAscensionTime = nowTime;
  window.playerStats.highestPrestigeStageCleared = Math.max(
    window.playerStats.highestPrestigeStageCleared || 80,
    activeStage,
  );
  window.playerStats.selectedPrestigeStage =
    window.playerStats.highestPrestigeStageCleared;
  window.playerStats.lifetimePeakStage = Math.max(
    window.playerStats.lifetimePeakStage || 1,
    window.playerStats.maxStage || 1,
  );

  // Removed unequip loop: Gear now remains fully equipped across prestige resets as a quality-of-life improvement.

  window.playerStats.level = 1;
  window.playerStats.xp = 0;
  window.playerStats.xpReq = 100;

  // Advanced Start (50% of peak Stage, with floor of 1) [1]
  let peak = window.playerStats.lifetimePeakStage || 1;
  let advancedStart = Math.max(1, Math.floor(peak * 0.5));
  window.playerStats.stage = advancedStart;
  window.playerStats.maxStage = advancedStart;

  window.playerStats.crucibleWave = 1;
  window.playerStats.crucibleStartWave = 1;
  window.playerStats.isPrestigeBossMode = false;
  window.playerStats.prestigeApproachTimer = 0;
  window.mob = null;
  window.hero.x = 40;

  let p = window.resolvePlayerStats();
  window.playerStats.currentHp = p.maxHp;

  let modal = document.createElement("div");
  modal.style.position = "fixed";
  modal.style.top = "0";
  modal.style.left = "0";
  modal.style.width = "100%";
  modal.style.height = "100%";
  modal.style.backgroundColor = "rgba(0,0,0,0.92)";
  modal.style.display = "flex";
  modal.style.justifyContent = "center";
  modal.style.alignItems = "center";
  modal.style.zIndex = "35000";
  modal.style.padding = "15px";

  modal.innerHTML = `
                                                                                      <div style="background:#151515; border: 3px solid #e74c3c; border-radius: 8px; width:100%; max-width:440px; display:flex; flex-direction:column; box-shadow: 0 10px 40px rgba(0,0,0,0.95); text-align:center; padding:20px; animation: toastFadeIn 0.3s;">
                                                                                          <h2 style="margin:0 0 10px 0; color:#e74c3c; letter-spacing:3px; text-transform:uppercase; font-size:22px;">🐉 ASCENSION ACHIEVED!</h2>
                                                                                          <div style="height:2px; background:linear-gradient(90deg, transparent, #e74c3c, transparent); margin-bottom:15px;"></div>
                                                                                          <p style="font-size:12px; color:#ddd; line-height:1.5; margin-bottom:20px;">
                                                                                              You have slain **Hooktail** and shattered your mortal limits! Your soul ascends into a higher plane of legend.
                                                                                          </p>
                                                                                          <div style="background:#0b0f12; border:1px solid #e74c3c; border-radius:6px; padding:15px; margin-bottom:20px;">
                                                                                              <div style="font-size:11px; color:#aaa; margin-bottom:4px;">REWARDS EARNED:</div>
                                                                                              <div style="font-size:20px; color:#f1c40f; font-weight:bold; margin-bottom:6px;">✨ +${totalAwarded} Prestige Points</div>
                                                                                              <div style="font-size:9.5px; color:#aaa; font-family:monospace; margin-bottom:12px; line-height:1.3; text-align:left; background:rgba(0,0,0,0.35); padding:6px; border:1px dashed #333;">
                                                                                                  • Base & Rank Award: <strong style="color:#fff;">+${Math.min(10, basePoints + bonusPoints)} PP</strong><br>
                                                                                                  • Deep Push Bonus (Stage ${activeStage}): <strong style="color:#2ecc71;">+${pushBonus} PP</strong> (1 per 10 stages over 80)
                                                                                              </div>
                                                                                              <div style="font-size:11px; color:#8e44ad; font-weight:bold; margin-bottom:4px; text-align:left; padding-left:15px;">🔮 Eridium Shards: +${awardedShards}</div>
                                                                                              <div style="font-size:11px; color:#e67e22; font-weight:bold; margin-bottom:4px; text-align:left; padding-left:15px;">🟧 Epic Scraps: +${awardedEpic}</div>
                                                                                              <div style="font-size:11px; color:#f1c40f; font-weight:bold; margin-bottom:4px; text-align:left; padding-left:15px;">🟨 Legendary Scraps: +${awardedLeg}</div>
                                                                                              <div style="font-size:11px; color:#e74c3c; font-weight:bold; margin-bottom:8px; text-align:left; padding-left:15px;">🟥 Mythic Scraps: +${awardedMythic}</div>
                                                                                              <div style="font-size:11px; color:#9b59b6; font-weight:bold; border-top: 1px solid #333; padding-top:6px; margin-top:6px;">Total Ascensions: ${window.playerStats.prestigeCount}</div>
                                                                                          </div>
                                                                                          <p style="font-size:11px; color:#7f8c8d; line-height:1.4; margin-bottom:20px;">
                                                                                              Your raw levels and campaign stage are reset. However, spent Attribute Matrix points, materials, and achievements are **completely preserved**!
                                                                                          </p>
                                                                                          <button id="btn-prestige-ascend-confirm" style="background:linear-gradient(135deg, #e74c3c, #c0392b); color:white; border:1px solid #f1c40f; font-weight:bold; font-size:13px; text-transform:uppercase; letter-spacing:1px; padding:12px 24px; border-radius:4px; cursor:pointer; width:100%; box-shadow:0 4px 10px rgba(0,0,0,0.4);">Arise as an Ascended Hero</button>
                                                                                      </div>
                                                                                  `;
  document.body.appendChild(modal);

  document.getElementById("btn-prestige-ascend-confirm").onclick = function () {
    modal.remove();
    window.isGamePaused = false;
    window.checkAchievements();
    window.updateUI();
    window.renderPrestigeTab();
    window.renderInventory();
    window.saveGame();
    window.pushLog(
      `<span style='color:#e74c3c; font-weight:bold;'>[ASCENSION] Your legacy begins anew! Received upgrade materials and spent Attribute Matrix points are completely preserved. Sacks have expanded to hold your rewards.</span>`,
    );
  };
};

window.showMarketTooltip = function (e, index) {
  let item = window.playerStats.shopItems[index];
  if (!item || item.purchased) return;
  let tt = document.getElementById("game-tooltip");
  let baseHtml = window.buildGeneralTooltipHtml(item, true);

  let goldStr = window.formatNumber(window.playerStats.coins);
  let costStr = window.formatNumber(item.cost);
  let goldColor = BigNum.from(window.playerStats.coins).gte(item.cost)
    ? "#2ecc71"
    : "#e74c3c";

  let footer = `<div style="background:#0b0f12; border-top:1px solid #333; padding:8px 10px; font-size:10px; font-family:monospace; text-align:center; border-radius: 0 0 6px 6px;">
                                               <span style="color:#aaa;">Your Gold:</span> <strong style="color:${goldColor};">${goldStr}</strong> <span style="color:#666;">|</span> <span style="color:#aaa;">Cost:</span> <strong style="color:#f1c40f;">${costStr}</strong>
                                           </div>`;

  tt.innerHTML = `<div style="display:flex; flex-direction:column;">${baseHtml}${footer}</div>`;
  tt.style.borderColor = window.getTierColor(item.statsRolled);
  tt.style.display = "block";
  window.positionTooltip(e, tt);
};

window.showMysticalShopTooltip = function (e, index) {
  e.stopPropagation();
  let tt = document.getElementById("etc-tooltip");
  let item = window.MYSTICAL_STOCK[index];
  if (!item) return;

  let color = item.color || "#9b59b6";
  let ownedAmount = 0;
  if (
    item.name === "Gacha Key" ||
    item.name === "Astral Essence" ||
    item.name === "Catalyst Core"
  )
    ownedAmount = window.inventory.ETC[item.name] || 0;
  else ownedAmount = window.inventory.USE[item.name] || 0;

  let actualCost = item.cost;
  let currencyName = item.currency;
  let playerBalance = 0;

  if (item.currency === "Luminous Soul") {
    playerBalance = window.inventory.ETC["Luminous Soul"] || 0;
    currencyName = "Luminous Souls";
  } else if (item.currency === "Astral Shards") {
    playerBalance = window.playerStats.astralShards || 0;
    currencyName = "Astral Shards";
  } else {
    actualCost = Math.ceil(
      item.cost * Math.pow(1.08, window.playerStats.stage),
    );
    playerBalance = window.playerStats.coins || 0;
    currencyName = "Gold";
  }

  let canAfford = playerBalance >= actualCost;
  let costTextColor = canAfford ? "#2ecc71" : "#e74c3c";

  let iconHtml =
    item.name === "Gacha Key" ||
    item.name === "Astral Essence" ||
    item.name === "Catalyst Core"
      ? getEtcIconHtml(item.name)
      : getUseIconHtml(item.name);
  iconHtml = iconHtml.replace("margin-right: 12px;", "margin-right: 8px;");

  tt.innerHTML = `<div style="padding: 10px; width: 230px; box-sizing: border-box;">
                                                                                          <div class="tt-title" style="color:${color}; font-weight:bold; display:flex; align-items:center; gap:6px;">${iconHtml} <span>${item.name}</span></div>
                                                                                          <div style="font-size:11px; color:#aaa; margin-bottom:8px; line-height:1.4; white-space:normal;">${item.desc}</div>
                                                                                          <div style="font-size:11px; margin-bottom:6px; border-top:1px dashed #444; padding-top:6px;">
                                                                                              • <span style="color:#bdc3c7;">Currently Owned:</span> <strong style="color:${color};">${ownedAmount.toLocaleString()}</strong>
                                                                                          </div>
                                                                                          <div style="font-size:11px; margin-bottom:4px;">
                                                                                            • <span style="color:#bdc3c7;">Exchange Rate:</span> <strong style="color:${costTextColor};">${window.formatNumber(actualCost)} / ${window.formatNumber(playerBalance)} ${currencyName}</strong>
                                                                                             </div>
                                                                                              <div style="font-size:10px; color:${canAfford ? "#2ecc71" : "#e74c3c"}; font-weight:bold; margin-top:4px;">
                                                                                              ${canAfford ? "✓ Ready to Transmute" : "✗ Insufficient Materials"}
                                                                                          </div>
                                                                                      </div>`;

  tt.style.borderColor = color;
  tt.style.display = "block";
  window.positionTooltip(e, tt);
};

window.showTransmuteTooltip = function (e, index) {
  e.stopPropagation();
  let recipe = window.POTION_TRANSMUTATIONS[index];
  if (!recipe) return;

  let ownedResult = window.inventory.USE[recipe.result] || 0;
  let ownedReq = window.inventory.USE[recipe.req] || 0;
  let canAfford = ownedReq >= recipe.amount;
  let reqColor = canAfford ? "#2ecc71" : "#e74c3c";

  let iconHtml = getUseIconHtml(recipe.result);
  iconHtml = iconHtml.replace("margin-right: 12px;", "margin-right: 8px;");

  let tt = document.getElementById("game-tooltip");
  tt.innerHTML = `<div style="padding: 10px; width: 230px; box-sizing: border-box;">
                                                                                          <div class="tt-title" style="color:${recipe.color}; display:flex; align-items:center; gap:6px;">${iconHtml} <span>Transmute</span></div>
                                                                                          <div class="tt-subtitle">${recipe.result}</div>
                                                                                          <div style="color:#ddd; font-size:11px; margin-bottom:6px; white-space:normal; line-height:1.3;">${recipe.desc}</div>
                                                                                          <div style="margin-top:8px; border-top: 1px dashed #444; padding-top:6px; font-family:monospace; font-size:10px;">
                                                                                              <div class="tt-stat-line" style="color:#aaa;">Result Owned: <strong style="color:#fff;">${ownedResult}</strong></div>
                                                                                              <div class="tt-stat-line" style="color:#aaa;">Required Ingredients: <strong style="color:${reqColor};">${ownedReq} / ${recipe.amount} ${recipe.req}</strong></div>
                                                                                          </div>
                                                                                      </div>`;
  tt.style.borderColor = recipe.color;
  tt.style.display = "block";
  window.positionTooltip(e, tt);
};

window.showGoldUpgradeTooltip = function (e, upId) {
  e.stopPropagation();
  let p = window.playerStats;
  let up;
  if (upId === "vending") {
    up = {
      name: "🎰 Gacha Calibration",
      level: p.vendingQLevel || 0,
      cost: Math.floor(15000 * Math.pow(1.18, p.vendingQLevel || 0)),
      color: "#f1c40f",
    };
  } else if (upId === "shop") {
    up = {
      name: "🛒 Merchant Investment",
      level: p.shopQLevel || 0,
      cost: Math.floor(30000 * Math.pow(1.22, p.shopQLevel || 0)),
      color: "#3498db",
    };
  } else if (upId === "global") {
    up = {
      name: "🍀 Aura of Fortune",
      level: p.globalQLevel || 0,
      cost: Math.floor(100000 * Math.pow(1.28, p.globalQLevel || 0)),
      color: "#2ecc71",
    };
  }
  if (!up) return;

  let goldStr = window.formatNumber(p.coins);
  let costStr = window.formatNumber(up.cost);
  let goldColor = BigNum.from(p.coins).gte(up.cost) ? "#2ecc71" : "#e74c3c";

  let tt = document.getElementById("game-tooltip");
  tt.innerHTML = `<div style="padding: 10px; width: 230px; box-sizing: border-box;">
                                               <div class="tt-title" style="color:${up.color};">${up.name}</div>
                                               <div class="tt-subtitle">Upgrade Level: ${up.level}</div>
                                               <div style="margin-top:8px; border-top: 1px dashed #444; padding-top:6px; font-family:monospace; font-size:10px;">
                                                   <div class="tt-stat-line" style="color:#aaa;">Your Gold: <strong style="color:${goldColor};">${goldStr}</strong></div>
                                                   <div class="tt-stat-line" style="color:#aaa;">Upgrade Cost: <strong style="color:#f1c40f;">${costStr}</strong></div>
                                               </div>
                                           </div>`;
  tt.style.borderColor = up.color;
  tt.style.display = "block";
  window.positionTooltip(e, tt);
};

window.showAltarTooltip = function (e) {
  e.stopPropagation();
  let cores = window.inventory.ETC["Ancient Core"] || 0;
  let level = window.playerStats.level || 1;
  let tt = document.getElementById("game-tooltip");
  tt.innerHTML = `<div style="padding: 10px; width: 240px; box-sizing: border-box;">
                                                       <div class="tt-title" style="color:#9b59b6;">🔮 Ancient Altar Summoning</div>
                                                       <div class="tt-subtitle">Reality Rift Activation requirements</div>
                                                       <div class="tt-stat-line" style="color:#bdc3c7;">• Required Cores: <span style="color:#f1c40f; font-weight:bold;">1 Core</span></div>
                                                       <div class="tt-stat-line" style="color:#bdc3c7;">• Required Level: <span style="color:#2ecc71; font-weight:bold;">Lv 30+</span></div>
                                                       <div style="margin-top:8px; border-top: 1px dashed #444; padding-top:6px; font-family:monospace; font-size:10px;">
                                                           <div class="tt-stat-line" style="color:#fff;">Your Cores: <strong style="color:${cores >= 1 ? "#2ecc71" : "#e74c3c"};">${cores} / 1</strong></div>
                                                           <div class="tt-stat-line" style="color:#fff;">Your Level: <strong style="color:${level >= 30 ? "#2ecc71" : "#e74c3c"};">Lv ${level} / 30</strong></div>
                                                       </div>
                                                   </div>`;
  tt.style.borderColor = "#9b59b6";
  tt.style.display = "block";
  window.positionTooltip(e, tt);
};

window.showGachaTooltip = function (e) {
  e.stopPropagation();
  let p = window.resolvePlayerStats();
  let qly = p.qly; // Live Drop Quality stats!
  let mythic = 1.0 * qly;
  let leg = 5.0 * qly;
  let epic = 15.0 * qly;
  let magic = 25.0 * qly;
  let rare = Math.max(0, 100 - (mythic + leg + epic + magic));
  let keysHeld = window.inventory.ETC["Gacha Key"] || 0;

  let tt = document.getElementById("game-tooltip");
  tt.innerHTML = `<div style="padding: 10px; width: 250px; box-sizing: border-box;">
                                               <div class="tt-title" style="color:#f1c40f;">🎰 Vending Machine Rates</div>
                                               <div class="tt-subtitle">Gacha Rarity Distribution</div>
                                               <div class="tt-stat-line" style="color:#3498db;">• 1★ Rare: ${rare.toFixed(2)}%</div>
                                               <div class="tt-stat-line" style="color:#9b59b6;">• 2★ Magic: ${magic.toFixed(2)}%</div>
                                               <div class="tt-stat-line" style="color:#e67e22;">• 3★ Epic: ${epic.toFixed(2)}%</div>
                                               <div class="tt-stat-line" style="color:#f1c40f;">• 4★ Legendary: ${leg.toFixed(2)}%</div>
                                               <div class="tt-stat-line" style="color:#e74c3c;">• 5★ Mythic: ${mythic.toFixed(2)}%</div>
                                               <div class="tt-stat-line" style="color:#1abc9c; margin-top:4px;">• Bonus: 1% flat chance for Unique Artifact!</div>
                                               <div class="tt-subtitle" style="margin-top:6px; border-top:1px solid #333; padding-top:4px;">Guaranteed 1★ to 5★ gear. Influenced by Drop Quality.</div>
                                               <div style="margin-top:8px; border-top: 1px dashed #444; padding-top:6px; font-family:monospace; font-size:10px;">
                                                   <div class="tt-stat-line" style="color:#fff;">Your Keys: <strong style="color:${keysHeld >= 1 ? "#2ecc71" : "#e74c3c"};">${keysHeld.toLocaleString()} / 1</strong></div>
                                               </div>
                                           </div>`;
  tt.style.borderColor = "#f1c40f";
  tt.style.display = "block";
  window.positionTooltip(e, tt);
};

window.showDummyArtifact = function (e, traitId) {
  e.stopPropagation();
  document
    .querySelectorAll(".bag-item")
    .forEach((el) => el.classList.remove("active-tooltip"));
  let artDef = window.ARTIFACT_POOL.find((a) => a.trait === traitId);
  let dummy = {
    id: "dummy",
    name: artDef.name + " (Lv. 1)",
    type: "artifact",
    statsRolled: "UNIQUE",
    temperLevel: 0,
    stageLevel: 1,
    atk: 0,
    maxHp: 0,
    def: 0,
    moveSpeed: 0,
    critChance: 0,
    critDamage: 0,
    block: 0,
    parry: 0,
    dropRate: artDef.dropRate,
    quality: artDef.quality,
    goldMulti: artDef.goldMulti,
    activeAttackSpeed: 0,
    idleAttackSpeed: 0,
    trait: artDef.trait,
    desc: artDef.desc,
    breakdown: artDef.breakdown,
    str: 0,
    dex: 0,
    int: 0,
  };
  let tt = document.getElementById("game-tooltip");
  tt.innerHTML = `<div class="tooltip-flex-container"><div class="tooltip-card">${window.generateItemCardHtml(dummy, null, false)}</div></div>`;
  tt.style.borderColor = window.getTierColor("UNIQUE");
  tt.style.display = "block";
  window.positionTooltip(e, tt);
};

window.refreshActiveStatTooltip = function () {
  if (!window.activeStatTooltip) return;
  let mockEvent = {
    clientX: window.activeStatTooltip.clientX,
    clientY: window.activeStatTooltip.clientY,
    target: window.activeStatTooltip.target,
    currentTarget: window.activeStatTooltip.target,
    stopPropagation: function () {},
  };
  let cached = window.activeStatTooltip;
  window.activeStatTooltip = null;
  if (cached.type === "breakdown") {
    window.showStatBreakdown(mockEvent, cached.key, cached.isPct);
  } else if (cached.type === "hover") {
    window.showStatHoverTooltip(mockEvent, cached.key);
  }
};

window.showStatHoverTooltip = function (e, key) {
  e.stopPropagation();
  let tt = document.getElementById("stat-tooltip");
  if (!tt) return;

  let clientX =
    e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
  let clientY =
    e.clientY || (e.touches && e.touches[0] ? e.touches[0].clientY : 0);
  window.activeStatTooltip = {
    type: "hover",
    key: key,
    clientX: clientX,
    clientY: clientY,
    target: e.currentTarget || e.target,
  };

  let html = "";
  let p = window.resolvePlayerStats();
  if (key === "ias") {
    html = `<div style="padding: 10px; width: 220px; box-sizing: border-box;"><div class="tt-title" style="color:#3498db; display:flex; align-items:center; gap:6px;">${window.getUiIconSvg("idleAttackSpeed", 14)} Idle Attack Speed</div><div style="color:#aaa; font-size:11px;">The number of engine frames between automatic attacks (60 frames = 1 second).<br><br><b>Lower is faster!</b><br>Currently attacking automatically every ${(p.idleAttackSpeed / 60).toFixed(2)}s.</div></div>`;
    tt.style.borderColor = "#3498db";
  } else if (key === "aas") {
    html = `<div style="padding: 10px; width: 220px; box-sizing: border-box;"><div class="tt-title" style="color:#e74c3c; display:flex; align-items:center; gap:6px;">${window.getUiIconSvg("activeAttackSpeed", 14)} Active Attack Speed</div><div style="color:#aaa; font-size:11px;">The cooldown limit in frames between manual clicks or spacebar taps.<br><br><b>Lower is faster!</b><br>Currently capped at ${(60 / p.activeAttackSpeed).toFixed(1)} attacks per second.</div></div>`;
    tt.style.borderColor = "#e74c3c";
  } else if (key === "drp") {
    let eff = window.state.efficiency;
    html = `<div style="padding: 10px; width: 220px; box-sizing: border-box;"><div class="tt-title" style="color:#2ecc71; display:flex; align-items:center; gap:6px;">${window.getUiIconSvg("dropRate", 14)} Drop Rate Modifier</div><div style="color:#aaa; font-size:11px;">Current Multiplier: x${(p.drop * eff).toFixed(2)} ${eff > 1.0 ? "(Manual Play Bonus Active)" : ""}<br><br><b>Exact Chances:</b><br>• Standard Mob Drop: ${(4.5 * p.drop * eff).toFixed(2)}%<br>• Rare Mob Drop: ${(15.0 * p.drop * eff).toFixed(2)}%<br>• Boss Drop: ${(25.0 * p.drop * eff).toFixed(2)}%<br>• Dungeon Mob: ${(10.0 * p.drop * eff).toFixed(2)}%</div></div>`;
    tt.style.borderColor = "#2ecc71";
  } else if (key === "qly") {
    html = `<div style="padding: 10px; width: 220px; box-sizing: border-box;"><div class="tt-title" style="color:#9b59b6; display:flex; align-items:center; gap:6px;">${window.getUiIconSvg("quality", 14)} Drop Quality Modifier</div><div style="color:#aaa; font-size:11px;">Current Multiplier: x${p.qly.toFixed(2)}<br><br>Increases the probability that an item drop will roll with more bonus modifier lines (higher star rating).</div></div>`;
    tt.style.borderColor = "#9b59b6";
  } else if (key === "idps") {
    let effMultiplier = 1 + p.critChance * (p.critDamage - 1);
    let idps = p.atk * effMultiplier * (60 / p.idleAttackSpeed);
    html = `<div style="padding: 10px; width: 220px; box-sizing: border-box;"><div class="tt-title" style="color:#e67e22; display:flex; align-items:center; gap:6px;">${window.getUiIconSvg("atk", 14)} Idle DPS</div><div style="color:#aaa; font-size:11px;">Current Idle Damage/Sec: ${idps.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}<br><br>Represents your average damage output per second when idle (incorporates Attack, Attack Speed, Crit Chance, and Crit Multipliers).</div></div>`;
    tt.style.borderColor = "#e67e22";
  } else if (key === "xpr") {
    html = `<div style="padding: 10px; width: 220px; box-sizing: border-box;"><div class="tt-title" style="color:#a855f7; display:flex; align-items:center; gap:6px;">${window.getUiIconSvg("xpRate", 14)} XP Rate Multiplier</div><div style="color:#aaa; font-size:11px;">Current Multiplier: x${p.xpRate.toFixed(2)}<br><br>Multiplies all acquired experience from routing, bosses, and dungeons.<br><br><b>Boosted by:</b><br>• Prestige upgrades (+10% per level)<br>• Active XP potions / elixirs<br>• Chronicle of Past Lives Unique Tome<br>• Unlocked Achievements</div></div>`;
    tt.style.borderColor = "#a855f7";
  } else if (key === "bar") {
    html = `<div style="padding: 10px; width: 220px; box-sizing: border-box;"><div class="tt-title" style="color:#9b59b6; display:flex; align-items:center; gap:6px;">${window.getUiIconSvg("barrier", 14)} Arcane Barrier</div><div style="color:#aaa; font-size:11px;">Current Absorption: ${Math.floor(p.arcaneBarrier * 100)}%<br><br><b>Passive (Requires Tome):</b><br>Absorbs a percentage of all incoming damage before defense calculations.<br><br>Base 20%, scaling up to 35% based on your Intelligence (INT) stat. Currently absorbing ${Math.floor(p.arcaneBarrier * 100)}% of incoming damage.</div></div>`;
    tt.style.borderColor = "#9b59b6";
  }

  tt.innerHTML = html;
  tt.style.display = "block";
  window.positionTooltip(e, tt);
};

// --- PAPERDOLL & BAGS GRID RENDERERS ---

window.renderPaperDoll = function () {
  const slots = [
    "weapon",
    "subweapon",
    "helmet",
    "chest",
    "leggings",
    "overall",
    "boots",
    "art1",
    "art2",
    "art3",
  ];
  slots.forEach((slot) => {
    let el = document.getElementById(`slot-${slot}`);
    if (!el) return;
    let item = window.equippedSlots[slot];

    let lvl =
      (window.playerStats.slotUpgrades &&
        window.playerStats.slotUpgrades[slot]) ||
      0;
    let lvlBadge =
      lvl > 0
        ? `<span style="position: absolute; top: 4px; right: 4px; background: rgba(15,23,42,0.9); color: #ffd700; border: 1.5px solid #ffd700; border-radius: 4px; font-size: 8px; font-weight: 900; padding: 2px 4px; line-height: 1; z-index: 10; font-family: monospace; box-shadow: 0 0 6px rgba(241,196,15,0.25);">Lv.${lvl}</span>`
        : "";

    if (
      (slot === "chest" || slot === "leggings") &&
      window.equippedSlots.overall
    ) {
      el.className = "slots-card locked";
      el.innerHTML = `⚙️ LOCKED BY OVERALL`;
      el.style.background = "";
      el.style.borderColor = "";
      el.style.boxShadow = "";
      return;
    }
    if (
      slot === "overall" &&
      (window.equippedSlots.chest || window.equippedSlots.leggings)
    ) {
      el.className = "slots-card locked";
      el.innerHTML = `⚙️ LOCKED BY PIECE GEAR`;
      el.style.background = "";
      el.style.borderColor = "";
      el.style.boxShadow = "";
      return;
    }

    if (item) {
      let isArt = slot.startsWith("art");
      el.className = isArt
        ? "slots-card artifact-slot equipped"
        : "slots-card equipped";
      let color = window.getTierColor(item.statsRolled);
      el.style.borderColor = color;

      let uniqueStyle = window.getUniqueItemStyle(item);
      if (uniqueStyle) {
        el.style.background = uniqueStyle.bg;
        el.style.borderColor = uniqueStyle.border;
        el.style.boxShadow = `inset 0 0 8px ${uniqueStyle.shadow}, 0 0 10px ${uniqueStyle.glow}`;
      } else {
        el.style.background = "";
        el.style.boxShadow = "";
      }

      let tierLabel =
        item.statsRolled === "UNIQUE"
          ? "UNIQUE"
          : `${item.statsRolled}★ ${window.getTierName(item.statsRolled)}`;
      let temperTag =
        item.temperLevel > 0
          ? ` <span style="color:#2ecc71;">[+${item.temperLevel}]</span>`
          : "";
      let lockTag = item.locked ? " 🔒" : "";
      let isUnique =
        item.isUniqueStaff ||
        item.isUniqueSword ||
        item.isUniqueSingularity ||
        item.isUniqueMaelstrom ||
        item.isUniqueAegis ||
        item.isUniqueWatch ||
        item.isUniqueChronicle ||
        item.isUniqueWarpCore ||
        item.isUniqueTempest;

      let iconBox = `<div style="text-align:center; margin-bottom:4px;">${window.getEquipIconHtml(item, 32)}</div>`;
      if (isArt) {
        el.innerHTML = `${lvlBadge}${iconBox}<strong style="font-size:10px; color:#1abc9c;">${item.name}${lockTag}</strong><br><span style="font-size:8px;color:#aaa;line-height:1;">${item.desc}</span><button class="btn-action un" style="margin-top:2px;padding:1px 3px;" onpointerdown="event.stopPropagation();" ontouchstart="event.stopPropagation();" onclick="window.unequipItem('${slot}')">Remove</button>`;
      } else {
        let s = [];
        let sPlain = [];
        if (item.atk > 0) {
          s.push(
            `${window.getUiIconSvg("atk", 9.5)}${window.formatNumber(item.atk)}`,
          );
          sPlain.push(`Atk: ${window.formatNumber(item.atk)}`);
        }
        if (item.maxHp > 0) {
          s.push(
            `${window.getUiIconSvg("maxHp", 9.5)}${window.formatNumber(item.maxHp)}`,
          );
          sPlain.push(`HP: ${window.formatNumber(item.maxHp)}`);
        }
        if (item.def > 0) {
          s.push(
            `${window.getUiIconSvg("def", 9.5)}${window.formatNumber(item.def)}`,
          );
          sPlain.push(`Def: ${window.formatNumber(item.def)}`);
        }
        if (item.moveSpeed > 0) {
          s.push(
            `${window.getUiIconSvg("moveSpeed", 9.5)}${window.formatNumber(item.moveSpeed)}`,
          );
          sPlain.push(`Speed: ${window.formatNumber(item.moveSpeed)}`);
        }
        if (item.critChance > 0) {
          s.push(
            `${window.getUiIconSvg("critChance", 9.5)}${Math.floor(item.critChance * 100)}%`,
          );
          sPlain.push(`Crit: ${Math.floor(item.critChance * 100)}%`);
        }
        if (item.critDamage > 0) {
          s.push(
            `${window.getUiIconSvg("critDamage", 9.5)}${Math.floor(item.critDamage * 100)}%`,
          );
          sPlain.push(`CritDmg: ${Math.floor(item.critDamage * 100)}%`);
        }
        if (item.block > 0) {
          s.push(
            `${window.getUiIconSvg("block", 9.5)}${Math.floor(item.block * 100)}%`,
          );
          sPlain.push(`Block: ${Math.floor(item.block * 100)}%`);
        }
        if (item.parry > 0) {
          s.push(
            `${window.getUiIconSvg("parry", 9.5)}${Math.floor(item.parry * 100)}%`,
          );
          sPlain.push(`Parry: ${Math.floor(item.parry * 100)}%`);
        }
        if (item.str > 0) {
          s.push(`${window.getUiIconSvg("str", 9.5)}S:${item.str}`);
          sPlain.push(`STR: ${item.str}`);
        }
        if (item.dex > 0) {
          s.push(`${window.getUiIconSvg("dex", 9.5)}D:${item.dex}`);
          sPlain.push(`DEX: ${item.dex}`);
        }
        if (item.int > 0) {
          s.push(`${window.getUiIconSvg("int", 9.5)}I:${item.int}`);
          sPlain.push(`INT: ${item.int}`);
        }

        let setLabelHtml = "";
        let setName = window.getItemSetName(item);
        if (setName) {
          let matchingCount = 0;
          const setSlots = [
            "weapon",
            "subweapon",
            "helmet",
            "chest",
            "leggings",
            "overall",
            "boots",
          ];
          setSlots.forEach((sKey) => {
            let eqItem = window.equippedSlots[sKey];
            if (eqItem) {
              let eqSetName = window.getItemSetName(eqItem);
              if (eqSetName === setName)
                matchingCount += sKey === "overall" ? 2 : 1;
            }
          });
          if (matchingCount >= 2) {
            let displayCount = Math.min(3, matchingCount);
            setLabelHtml = `<div style="font-size:8px; color:#2ecc71; font-weight:bold; margin-top:2px; text-transform:uppercase; letter-spacing:0.5px;">✨ ${setName} Set (${displayCount}/3)</div>`;
          }
        }
        el.innerHTML = `${lvlBadge}${iconBox}<strong style="font-size:10px;">${item.name}${temperTag}${lockTag}</strong><div style="font-size:8px; color:${color}; font-weight:bold; margin:2px 0;">${tierLabel}</div>${setLabelHtml}<div style="font-size:9px;color:#bbb; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${sPlain.join(", ")}">${s.join(" ")}</div><button class="btn-action un" style="margin-top:2px;padding:1px 3px;" onpointerdown="event.stopPropagation();" ontouchstart="event.stopPropagation();" onclick="window.unequipItem('${slot}')">Remove</button>`;
      }
    } else {
      el.className = "slots-card";
      let displaySlotName = slot.toUpperCase();
      if (slot === "art1") displaySlotName = "ARTIFACT 1";
      else if (slot === "art2") displaySlotName = "ARTIFACT 2";
      else if (slot === "art3") displaySlotName = "ARTIFACT 3";
      el.innerHTML = `${lvlBadge}<i>[Empty ${displaySlotName}]</i>`;
      el.style.background = "";
      el.style.borderColor = "";
      el.style.boxShadow = "";
    }
  });
};

window.renderInventory = function () {
  let maxBag = window.getMaxBagSlots();
  let activeSubTab = window.state.currentSubTab || "EQUIP";

  // 1. Equip Sack
  let eqBox = document.getElementById("bag-equip");
  if (eqBox) {
    if (activeSubTab !== "EQUIP") {
      eqBox.innerHTML = "";
    } else {
      if (window.inventory.EQUIP.length === 0) {
        eqBox.innerHTML =
          "<div style='color:#666;text-align:center;padding-top:40px;'>No equipment in sack.</div>";
      } else {
        eqBox.innerHTML = window.inventory.EQUIP.map((item) => {
          let nameColor = window.getTierColor(item.statsRolled);
          let tierStr =
            item.statsRolled === "UNIQUE"
              ? "UNIQUE"
              : `${item.statsRolled}★ ${window.getTierName(item.statsRolled)}`;
          let temperTag =
            item.temperLevel > 0
              ? ` <span style="color:#2ecc71;">[+${item.temperLevel}]</span>`
              : "";
          let lockTag = item.locked ? " 🔒" : "";
          let lockBg = item.locked ? "#e74c3c" : "#7f8c8d";
          let lockIcon = item.locked ? "🔒" : "🔓";
          let typeText = item.type.toUpperCase();
          if (item.type === "subweapon" && item.subType) {
            typeText = `${item.type.toUpperCase()} (${item.subType.toUpperCase()})`;
          }
          let comparisonBadge = window.getComparisonDeltaBadge(item);

          let details = `<span style="font-size:10px;color:#aaa;">Slot: ${typeText} | <span style="color:${nameColor};font-weight:bold;">${tierStr}</span></span>`;
          let uniqueStyle = window.getUniqueItemStyle(item);
          let itemStyleStr = uniqueStyle
            ? `background: ${uniqueStyle.bg}; border: 1.5px solid ${uniqueStyle.border}; box-shadow: inset 0 0 6px ${uniqueStyle.shadow}, 0 0 8px ${uniqueStyle.glow};`
            : `border-left: 4.5px solid ${nameColor} !important; background: rgba(15, 17, 26, 0.65);`;

          let iconBox = `<div style="margin-right:8px; display:inline-flex; align-items:center; flex-shrink:0;">${window.getEquipIconHtml(item, 28)}</div>`;

          return `<div class="bag-item" style="display:flex; align-items:center; ${itemStyleStr}">
                                                                      <div style="flex:1; min-width:0; cursor:help; text-align:left; display:flex; align-items:center;" onmouseenter="window.showInventoryTooltip(event, ${item.id})" ontouchstart="window.showInventoryTooltip(event, ${item.id})" onmouseleave="window.hideTooltip()">
                                                                          ${iconBox}
                                                                          <div style="flex:1; min-width:0;">
                                                                              <div style="display:flex; align-items:center; gap:4px; margin-bottom:1px; flex-wrap:wrap;">
                                                                                  <strong style="color:${nameColor}; font-size:11.5px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; max-width:180px;">${item.name}${temperTag}${lockTag}</strong>
                                                                                  ${comparisonBadge}
                                                                              </div>
                                                                              ${details}
                                                                          </div>
                                                                      </div>
                                                      <div class="bag-item-actions" style="position:relative; z-index:10; display:inline-flex; gap:3px; margin-left: 8px; flex-shrink:0;">
                                                                                                    <button class="btn-action" style="padding:4px 8px; font-size:10px;" onclick="window.equipItem(${item.id})">Equip</button>
                                                                                                    <button class="btn-action" style="background:${lockBg}; padding:4px 6px; font-size:10px;" onclick="window.toggleLock(${item.id})">${lockIcon}</button>
                                                                                                    <button class="btn-action un" style="padding:4px 8px; font-size:10px;" onclick="window.salvageItem(${item.id})">Salvage</button>
                                                                                                </div>
                                                  </div>`;
        }).join("");
      }
    }
  }

  // 2. Artifact Sack
  let artBox = document.getElementById("bag-art");
  if (artBox) {
    if (activeSubTab !== "ART") {
      artBox.innerHTML = "";
    } else {
      if (window.inventory.ARTIFACT.length === 0) {
        artBox.innerHTML =
          "<div style='color:#666;text-align:center;padding-top:40px;'>No artifacts in sack.</div>";
      } else {
        artBox.innerHTML = window.inventory.ARTIFACT.map((item) => {
          let nameColor = window.getTierColor(item.statsRolled);
          let lockTag = item.locked ? " 🔒" : "";
          let lockBg = item.locked ? "#e74c3c" : "#7f8c8d";
          let lockIcon = item.locked ? "🔒" : "🔓";

          let details = `<span style="font-size:10px;color:#d2b4de;font-weight:bold;">Trait: ${item.desc}</span>`;
          let iconBox = `<div style="margin-right:8px; display:inline-flex; align-items:center;">${window.getArtifactIconHtml(item.trait, 28)}</div>`;

          return `<div class="bag-item">
                                                      <div style="flex:1; cursor:help; text-align:left; display:flex; align-items:center;" onmouseenter="window.showInventoryTooltip(event, ${item.id})" ontouchstart="window.showInventoryTooltip(event, ${item.id})" onmouseleave="window.hideTooltip()">
                                                          ${iconBox}
                                                          <div style="flex:1;">
                                                              <strong style="color:${nameColor};">${item.name}${lockTag}</strong><br>${details}
                                                          </div>
                                                      </div>
                                          <div style="position:relative; z-index:10; white-space:nowrap; margin-left: 10px;">
                                                                            <button class="btn-action" onclick="window.equipItem(${item.id})">Equip</button>
                                                                            <button class="btn-action" style="background:${lockBg}; margin-left:2px;" onclick="window.toggleLock(${item.id})">${lockIcon}</button>
                                                                            <button class="btn-action un" style="margin-left:12px;" onclick="window.salvageItem(${item.id})">Salvage</button>
                                                                          </div>
                                      </div>`;
        }).join("");
      }
    }
  }

  // 2.5. Sigils Sack
  let sigilBox = document.getElementById("bag-sigil");
  if (sigilBox) {
    if (activeSubTab !== "SIGIL") {
      sigilBox.innerHTML = "";
    } else {
      if (!window.inventory.SIGIL) window.inventory.SIGIL = [];
      if (window.inventory.SIGIL.length === 0) {
        sigilBox.innerHTML =
          "<div style='color:#666;text-align:center;padding-top:40px;'>No Cavern Sigils in sack. Explore Infinite Caverns to find them!</div>";
      } else {
        sigilBox.innerHTML = window.inventory.SIGIL.map((item) => {
          let nameColor = window.getTierColor(item.statsRolled);
          let starLabel = `${item.statsRolled}★`;
          let lockTag = item.locked ? " 🔒" : "";
          let lockBg = item.locked ? "#e74c3c" : "#7f8c8d";
          let lockIcon = item.locked ? "🔒" : "🔓";

          let buffsList = item.buffs.map((b) => `☀️ ${b.name}`).join(", ");
          let debuffsList = item.debuffs.map((d) => `🌑 ${d.name}`).join(", ");

          let details = `<span style="font-size:10px;color:#9b59b6;font-weight:bold;">${buffsList} | ${debuffsList}</span>`;
          let iconBox = `<div style="margin-right:8px; display:inline-flex; align-items:center;">${window.getEquipIconHtml(item, 28)}</div>`;

          return `<div class="bag-item" style="border-left: 4.5px solid ${nameColor} !important;">
                                <div style="flex:1; cursor:help; text-align:left; display:flex; align-items:center;" onmouseenter="window.showInventoryTooltip(event, ${item.id})" ontouchstart="window.showInventoryTooltip(event, ${item.id})" onmouseleave="window.hideTooltip()">
                                    ${iconBox}
                                    <div style="flex:1;">
                                        <strong style="color:${nameColor};">${item.name}${lockTag}</strong><br>${details}
                                    </div>
                                </div>
                                <div style="position:relative; z-index:10; white-space:nowrap; margin-left: 10px;">
                                                                              <button class="btn-action" style="background:${lockBg};" onclick="window.toggleLock(${item.id})">${lockIcon}</button>
                                                                              <button class="btn-action un" style="margin-left:12px;" onclick="window.salvageItem(${item.id})">Salvage</button>
                                                                          </div>
                            </div>`;
        }).join("");
      }
    }
  }

  // 3. Materials Sacks
  const getEtcIconHtml = window.getEtcIconHtml;
  const getUseIconHtml = window.getUseIconHtml;

  const ETC_SORT_ORDER = [
    "Ancient Core",
    "Gacha Key",
    "Eridium Shard",
    "Astral Essence",
    "Catalyst Core",
    "Overlord's Sigil",
    "Luminous Soul",
    "Monster Soul",
    "Mythic Scrap",
    "Legendary Scrap",
    "Epic Scrap",
    "Magic Scrap",
    "Rare Scrap",
  ];

  const USE_SORT_ORDER = [
    "SP Reset Scroll",
    "PP Reset Scroll",
    "Supernal Attack Elixir",
    "Greater Attack Elixir",
    "Attack Elixir",
    "Supernal Vitality Elixir",
    "Greater Vitality Elixir",
    "Vitality Elixir",
    "Supernal Armored Elixir",
    "Greater Armored Elixir",
    "Armored Elixir",
    "Supernal Haste Elixir",
    "Greater Haste Elixir",
    "Haste Elixir",
  ];

  let etcBox = document.getElementById("bag-etc");
  if (etcBox) {
    if (activeSubTab !== "ETC") {
      etcBox.innerHTML = "";
    } else {
      let etcKeys = Object.keys(window.inventory.ETC).filter(
        (k) => window.inventory.ETC[k] > 0,
      );
      if (etcKeys.length === 0) {
        etcBox.innerHTML =
          "<div style='color:#666;text-align:center;padding-top:40px;'>No materials collected.</div>";
      } else {
        // Apply priority structured ordering to materials
        etcKeys.sort((a, b) => {
          let idxA = ETC_SORT_ORDER.indexOf(a);
          let idxB = ETC_SORT_ORDER.indexOf(b);
          if (idxA === -1) idxA = 999;
          if (idxB === -1) idxB = 999;
          return idxA - idxB;
        });

        etcBox.innerHTML =
          `<div class="material-grid">` +
          etcKeys
            .map((key) => {
              let escapedKey = key.replace(/'/g, "\\'");
              return `
                    <div class="material-badge" onmouseenter="window.showEtcTooltip(event, '${escapedKey}')" ontouchstart="window.showEtcTooltip(event, '${escapedKey}')" onmouseleave="window.hideTooltip()">
                        ${getEtcIconHtml(key)}
                        <span style="font-size:11px; font-weight:bold; color:#f1f5f9; display:block; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; max-width:85px;">${key}</span>
                        <span class="material-count">x${window.inventory.ETC[key]}</span>
                    </div>
                    `;
            })
            .join("") +
          `</div>`;
      }
    }
  }

  // 4. Usable Potions Sack
  let useBox = document.getElementById("bag-use");
  if (useBox) {
    if (activeSubTab !== "USE") {
      useBox.innerHTML = "";
    } else {
      let useKeys = Object.keys(window.inventory.USE || {}).filter(
        (k) => window.inventory.USE[k] > 0,
      );
      if (useKeys.length === 0) {
        useBox.innerHTML =
          "<div style='color:#666;text-align:center;padding-top:40px;'>No usable items. Purchase potions/scrolls at the Market!</div>";
      } else {
        // Apply priority structured ordering to usable potions
        useKeys.sort((a, b) => {
          let idxA = USE_SORT_ORDER.indexOf(a);
          let idxB = USE_SORT_ORDER.indexOf(b);
          if (idxA === -1) idxA = 999;
          if (idxB === -1) idxB = 999;
          return idxA - idxB;
        });

        useBox.innerHTML =
          `<div class="consumable-grid">` +
          useKeys
            .map((key) => {
              let count = window.inventory.USE[key];
              return `
                          <div class="consumable-badge" onmouseenter="window.showUseTooltip(event, '${key}')" ontouchstart="window.showUseTooltip(event, '${key}')" onmouseleave="window.hideTooltip()">
                              <div style="display:flex; align-items:center; width:100%; gap:4px;">
                                  ${getUseIconHtml(key)}
                                  <div style="text-align:left; min-width:0; flex:1;">
                                      <strong style="font-size:11px; color:#fff; display:block; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${key}</strong>
                                      <span style="font-size:10px; color:#94a3b8;">Qty: ${count}</span>
                                  </div>
                              </div>
                              <button class="btn-action" style="background:#2ecc71; width:100%; padding:4px 0; font-size:10.5px; font-weight:bold; border-radius:4px; margin-top:2px;" onclick="window.useItem('${key}')">Consume</button>
                          </div>
                      `;
            })
            .join("") +
          `</div>`;
      }
    }
  }
};

window.tooltipHideTimeoutId = null;

// Append hideTooltip inside window.UIManager
Object.assign(window.UIManager, {
  hideTooltip() {
    if (window.tooltipHideTimeoutId) clearTimeout(window.tooltipHideTimeoutId);
    window.tooltipHideTimeoutId = setTimeout(() => {
      [
        "game-tooltip",
        "etc-tooltip",
        "stat-tooltip",
        "log-item-tooltip",
      ].forEach((id) => {
        let el = window.getCachedEl(id);
        if (el) el.style.display = "none";
      });
      window.activeStatTooltip = null;
    }, 150); // 150ms grace period to move mouse into tooltip on desktop
  },
});

// Legacy Compatibility Aliases to protect references
window.hideTooltip = () => window.UIManager.hideTooltip();

// Calculates optimal tooltip placement to prevent clipping off the visible browser viewport
// Append positionTooltip inside window.UIManager
Object.assign(window.UIManager, {
  positionTooltip(e, tt) {
    if (window.tooltipHideTimeoutId) {
      clearTimeout(window.tooltipHideTimeoutId);
      window.tooltipHideTimeoutId = null;
    }
    let container = document
      .getElementById("game-container")
      .getBoundingClientRect();
    let clientX =
      e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
    let clientY =
      e.clientY || (e.touches && e.touches[0] ? e.touches[0].clientY : 0);

    let ttWidth = tt.offsetWidth;
    let ttHeight = tt.offsetHeight;
    let padding = 10;

    let vx, vy;

    const isLandscapeMobile =
      window.innerHeight <= 550 && window.innerWidth > window.innerHeight;
    const isMobile = window.innerWidth <= 600 || isLandscapeMobile;

    if (isMobile) {
      // Check if displaying a comparison layout to shrink sizing safely on mobile
      let isComparison = tt.querySelector(".compare-border") !== null;
      if (isComparison) {
        tt.style.fontSize = "9.5px";
        tt.querySelectorAll(".tooltip-card").forEach((card) => {
          card.style.padding = "6px 8px";
        });
        tt.querySelectorAll(".tt-title").forEach((title) => {
          title.style.fontSize = "10.5px";
          title.style.marginBottom = "2px";
        });
        tt.querySelectorAll(".tt-subtitle").forEach((sub) => {
          sub.style.fontSize = "8.5px";
          sub.style.marginBottom = "2px";
        });
        tt.querySelectorAll(".tt-stat-line").forEach((line) => {
          line.style.fontSize = "9px";
          line.style.marginBottom = "1px";
        });
        // Hides descriptive lore on compact comparisons tooltips to save vertical viewport space
        tt.querySelectorAll('div[style*="lore"]').forEach((lore) => {
          lore.style.display = "none";
        });
        ttWidth = tt.offsetWidth;
        ttHeight = tt.offsetHeight;
      } else {
        tt.style.fontSize = "";
        tt.querySelectorAll(".tooltip-card").forEach(
          (card) => (card.style.padding = ""),
        );
        tt.querySelectorAll(".tt-title").forEach((title) => {
          title.style.fontSize = "";
          title.style.marginBottom = "";
        });
        tt.querySelectorAll(".tt-subtitle").forEach((sub) => {
          sub.style.fontSize = "";
          sub.style.marginBottom = "";
        });
        tt.querySelectorAll(".tt-stat-line").forEach((line) => {
          line.style.fontSize = "";
          line.style.marginBottom = "";
        });
        tt.querySelectorAll('div[style*="lore"]').forEach((lore) => {
          lore.style.display = "";
        });
      }

      // Centering alignment preventing layout cutting-off
      vx = (window.innerWidth - ttWidth) / 2;
      vy = clientY + 18;

      if (vy + ttHeight > window.innerHeight) {
        vy = clientY - ttHeight - 18;
      }
      if (vy < padding) {
        vy = padding;
      }

      let spaceAvailable = window.innerHeight - 2 * padding;
      if (ttHeight > spaceAvailable) {
        tt.style.maxHeight = spaceAvailable + "px";
        tt.style.overflowY = "auto";
        vy = padding;
      } else {
        tt.style.maxHeight = "";
        tt.style.overflowY = "";
      }
    } else {
      // Restore standard desktop layout sizes
      tt.style.fontSize = "";
      tt.style.maxHeight = "";
      tt.style.overflowY = "";
      tt.querySelectorAll(".tooltip-card").forEach(
        (card) => (card.style.padding = ""),
      );
      tt.querySelectorAll(".tt-title").forEach((title) => {
        title.style.fontSize = "";
        title.style.marginBottom = "";
      });
      tt.querySelectorAll(".tt-subtitle").forEach((sub) => {
        sub.style.fontSize = "";
        sub.style.marginBottom = "";
      });
      tt.querySelectorAll(".tt-stat-line").forEach((line) => {
        line.style.fontSize = "";
        line.style.marginBottom = "";
      });
      tt.querySelectorAll('div[style*="lore"]').forEach((lore) => {
        lore.style.display = "";
      });

      vx = clientX + 15;
      vy = clientY + 15;

      if (vx + ttWidth > window.innerWidth) {
        vx = clientX - ttWidth - 15;
      }
      if (vy + ttHeight > window.innerHeight) {
        vy = clientY - ttHeight - 15;
      }

      if (vx < 5) vx = 5;
      if (vy < 5) vy = 5;
    }

    let x = vx - container.left;
    let y = vy - container.top;

    tt.style.left = x + "px";
    tt.style.top = y + "px";
  },
});

// Legacy Compatibility Aliases to protect references
window.positionTooltip = (e, tt) => window.UIManager.positionTooltip(e, tt);

window.showInventoryTooltip = function (e, itemId) {
  if (window.isSimulatedMouseEvent && window.isSimulatedMouseEvent(e)) return;
  e.stopPropagation();
  let item =
    window.inventory.EQUIP.find((i) => i.id === itemId) ||
    (window.inventory.ARTIFACT &&
      window.inventory.ARTIFACT.find((i) => i.id === itemId)) ||
    (window.inventory.SIGIL &&
      window.inventory.SIGIL.find((i) => i.id === itemId)) ||
    window.frozenItemDb[itemId];
  if (!item) return;
  let tt = document.getElementById("game-tooltip");
  tt.innerHTML = window.buildGeneralTooltipHtml(item, true);
  tt.style.borderColor = window.getTierColor(item.statsRolled);
  tt.style.display = "block";
  window.positionTooltip(e, tt);
};

window.showLogTooltip = function (e, itemId) {
  window.showInventoryTooltip(e, itemId);
};

// Generates and positions item comparison tooltips inside the Blacksmith Forge interface
window.showForgeTooltip = function (e, itemId) {
  e.stopPropagation();
  let item =
    window.inventory.EQUIP.find((i) => i.id === itemId) ||
    (window.inventory.ARTIFACT &&
      window.inventory.ARTIFACT.find((i) => i.id === itemId));
  if (!item) {
    for (let k in window.equippedSlots) {
      if (window.equippedSlots[k] && window.equippedSlots[k].id === itemId) {
        item = window.equippedSlots[k];
        item.isEquippedSlot = k;
        break;
      }
    }
  }
  if (!item) return;
  let tt = document.getElementById("game-tooltip");
  tt.innerHTML = window.buildGeneralTooltipHtml(item, false);
  tt.style.borderColor = window.getTierColor(item.statsRolled);
  tt.style.display = "block";
  window.positionTooltip(e, tt);
};

window.showSlotTooltip = function (e, slot) {
  e.stopPropagation();
  let item = window.equippedSlots[slot];
  if (!item) return;
  item.isEquippedSlot = slot;
  let tt = document.getElementById("game-tooltip");
  tt.innerHTML = window.buildGeneralTooltipHtml(item, false);
  tt.style.borderColor = window.getTierColor(item.statsRolled);
  tt.style.display = "block";
  window.positionTooltip(e, tt);
};

window.buildGeneralTooltipHtml = function (item, isBagItem = false) {
  let eq = isBagItem ? getEquippedItemForComparison(item.type) : null;
  let html = "";
  if (eq && eq.id !== item.id) {
    html += `<div class="tooltip-card compare-border" style="box-shadow: 0 0 16px rgba(231, 76, 60, 0.4), inset 0 0 10px rgba(192, 57, 43, 0.2); border: 2px solid rgba(192, 57, 43, 0.7); border-radius: 6px; background: rgba(10, 2, 2, 0.95);">${window.generateItemCardHtml(eq, null, true)}</div>`;
    html += `<div class="tooltip-card" style="border: 2px solid transparent;">${window.generateItemCardHtml(item, eq, false)}</div>`;
  } else {
    let isEquipped = isBagItem ? false : item.isEquippedSlot != null;
    let activeStyle = isEquipped
      ? `style="box-shadow: 0 0 16px rgba(231, 76, 60, 0.4), inset 0 0 10px rgba(192, 57, 43, 0.2); border: 2px solid rgba(192, 57, 43, 0.7); border-radius: 6px; background: rgba(10, 2, 2, 0.95);"`
      : ``;
    html += `<div class="tooltip-card" ${activeStyle}>${window.generateItemCardHtml(item, null, isEquipped)}</div>`;
  }
  return `<div class="tooltip-flex-container">${html}</div>`;
};

window.generateItemCardHtml = function (
  item,
  compareItem = null,
  isEquipped = false,
) {
  if (!item) return "";
  let toggleId = `${item.id}_${isEquipped ? "eq" : "bag"}_${Math.floor(Math.random() * 100000)}`;
  let html = `
    <style>
      #attune-toggle-${toggleId}:checked ~ .base-stats-grid .attuned-val {
        display: none !important;
      }
      #attune-toggle-${toggleId}:checked ~ .base-stats-grid .raw-val {
        display: inline !important;
      }
      #attune-toggle-${toggleId}:checked ~ .attune-label {
        color: #7f8c8d !important;
        border-color: #334155 !important;
        background: rgba(255,255,255,0.02) !important;
      }
      #attune-toggle-${toggleId}:not(:checked) ~ .attune-label {
        color: #2ecc71 !important;
        border-color: #2ecc71 !important;
        background: rgba(46, 204, 113, 0.1) !important;
      }
    </style>
    <input type="checkbox" id="attune-toggle-${toggleId}" style="display:none;" />
  `;
  let specialtyHtml = ""; // Captured to move inside the collapsible advanced drawer at the bottom

  let slotMult = 1.0;
  if (item.isEquippedSlot && window.playerStats.slotUpgrades) {
    let slotLvl = window.playerStats.slotUpgrades[item.isEquippedSlot] || 0;
    let runBonus = 0;
    if (
      window.playerStats.isCrucibleMode &&
      window.cachedPlayerStats &&
      window.cachedPlayerStats.crucibleSlotBonuses
    ) {
      runBonus =
        window.cachedPlayerStats.crucibleSlotBonuses[item.isEquippedSlot] || 0;
    }
    slotMult = 1.0 + slotLvl * 0.01 + runBonus;
  }

  // Define local variables for the card's title section
  let temperTag =
    item.temperLevel > 0
      ? ` <span style="color:#2ecc71;">[+${item.temperLevel}]</span>`
      : "";
  let lockTag = item.locked ? " 🔒" : "";

  // Render Currently Equipped status as an absolute tab hugging the top-right card border
  if (isEquipped) {
    html += `
        <div style="
          position: absolute;
          top: 0;
          right: 12px;
          background: linear-gradient(180deg, #e74c3c, #c0392b);
          border: 1px solid #ff4d4d;
          border-top: none;
          border-radius: 0 0 4px 4px;
          color: #fff;
          font-size: 8px;
          font-weight: 800;
          padding: 2px 6px;
          text-transform: uppercase;
          letter-spacing: 1px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.35);
          text-shadow: 0 1px 1px rgba(0,0,0,0.5);
          z-index: 10;
          white-space: nowrap;
          line-height: 1;
        ">
          Equipped
        </div>
      `;
  }

  // Custom Cavern Sigil card renderer
  if (item.type === "sigil") {
    let color = window.getTierColor(item.statsRolled);
    let buffDescs = item.buffs
      .map(
        (b) =>
          `<div style="color:#2ecc71; font-size:10px; margin-bottom:2px; line-height:1.35;">• ☀️ <strong>${b.name}</strong>: ${b.desc}</div>`,
      )
      .join("");
    let debuffDescs = item.debuffs
      .map(
        (d) =>
          `<div style="color:#e74c3c; font-size:10px; margin-bottom:2px; line-height:1.35;">• 🌑 <strong>${d.name}</strong>: ${d.desc}</div>`,
      )
      .join("");
    let lockTag = item.locked ? " 🔒" : "";

    let sigHtml = `
        <div class="tt-title" style="color:${color}; white-space:normal;">${item.name}${lockTag}</div>
        <div style="text-align:center; margin: 10px 0;">${window.getEquipIconHtml(item, 56)}</div>
        <div class="tt-subtitle">CAVERN SIGIL | <span style="color:${color}; font-weight:bold;">${item.statsRolled}★ ${window.getTierName(item.statsRolled)}</span></div>
        <div style="background:#090b0e; border:1px solid #222; border-radius:6px; padding:8px 10px; margin-top:8px;">
          <strong style="color:#f1c40f; font-family:monospace; display:block; margin-bottom:4px; text-transform:uppercase; font-size:9.5px; letter-spacing:0.5px;">⚡ SIGIL MODIFIERS:</strong>
          ${buffDescs}
          ${debuffDescs}
          <div style="border-top:1px dashed #222; margin-top:6px; padding-top:6px; display:flex; flex-direction:column; gap:2px; font-family:monospace; font-size:9.5px;">
                      <span style="color:#3498db; font-weight:bold;">💎 Focus Rewards: +${(item.rewardMultiplier * 100).toFixed(0)}% Gold/Loot Multiplier</span>
                      ${item.qualityBoost > 0 ? `<span style="color:#ff007f; font-weight:bold; font-size:9.5px;">✨ Quality Boost: +${(item.qualityBoost * 100).toFixed(0)}% Drop Quality</span>` : ""}
                    </div>
        </div>
      `;
    return sigHtml;
  }

  let isUnique =
    item.isUniqueStaff ||
    item.isUniqueSword ||
    item.isUniqueSingularity ||
    item.isUniqueMaelstrom ||
    item.isUniqueAegis ||
    item.isUniqueWatch ||
    item.isUniqueChronicle ||
    item.isUniqueWarpCore ||
    item.isUniqueTempest;
  let uniqueStyle = window.getUniqueItemStyle(item);
  let runicBadge = isUnique
    ? `<div style="color: #f1c40f; font-family: monospace; font-weight: 800; font-size: 10px; margin-bottom: 6px; letter-spacing: 2px; text-transform: uppercase; text-shadow: 0 0 10px rgba(241, 196, 15, 0.5);">⚡ UBER UNIQUE ⚡</div>`
    : ``;

  let iconIllustration = "";
  if (item.type === "artifact") {
    iconIllustration = `<div style="text-align:center; margin: 10px 0;">${window.getArtifactIconHtml(item.trait, 56)}</div>`;
  } else if (isUnique) {
    iconIllustration = `<div style="text-align:center; margin: 10px 0;">${window.getUniqueIconHtml(item, 56)}</div>`;
  }

  let tierColor = window.getTierColor(item.statsRolled);
  let titleColor = item.type === "artifact" ? "#1abc9c" : tierColor;
  let labelDisplay = item.type.toUpperCase();
  if (item.type === "subweapon" && item.subType) {
    labelDisplay = `SUBWEAPON (${item.subType.toUpperCase()})`;
  }

  let subtitle =
    item.type === "artifact"
      ? "Unique Artifact"
      : `${labelDisplay} | <span style="color:${tierColor}; font-weight:bold;">${tierStrDisplay(item)}</span>`;

  html += `<div class="tt-title" style="color:${isUnique ? "#1abc9c" : titleColor}; white-space:normal;">${item.name}${temperTag}${lockTag}</div>`;
  html += runicBadge;
  html += iconIllustration;
  html += `<div class="tt-subtitle">${subtitle}</div>`;

  // Render Slot Attunement details inside the metadata section instead of a floating top badge
  if (slotMult > 1.0) {
    let pctBonus = Math.round((slotMult - 1.0) * 100);
    html += `
          <label for="attune-toggle-${toggleId}" class="attune-label" style="font-size: 10px; font-weight: bold; margin-top: 4px; text-align: center; display: flex; align-items: center; justify-content: center; gap: 4px; border: 1px solid #2ecc71; border-radius: 4px; padding: 2px 6px; cursor: pointer; user-select: none; width: fit-content; margin-left: auto; margin-right: auto; text-transform: uppercase;">
            ⚡ Slot Attunement: +${pctBonus}% Stats Applied (Tap to view Raw)
          </label>
        `;
  }

  if (item.type === "subweapon") {
    let rgbVals = "127, 140, 141";
    let color = window.getTierColor(item.statsRolled);
    if (color && color.charAt(0) === "#")
      rgbVals = window.hexToRgbValues(color);

    if (item.subType === "shield") {
      let noun = item.noun ? item.noun.toLowerCase() : "";
      let descText =
        "Blocks completely negate damage (Cap: 20% / 25% with Titan's Grip). Every Block triggers a Shield Bash scaling with Defense.";
      if (noun.includes("buckler")) {
        descText =
          "Grants +12% base Block Rate. Shield Bash is lightweight, dealing 100% Defense damage (+0.2% per Strength point).";
      } else if (noun.includes("tower")) {
        descText =
          "Grants +2% base Block Rate. Triggers a massive Shield Bash dealing 250% Defense damage (+0.2% per Strength point).";
      }

      specialtyHtml = `
                <div style="border: 1px solid ${color}44; border-radius:6px; background: rgba(${rgbVals}, 0.04); padding: 6px 10px; font-size: 10px; line-height: 1.4; text-align: left; white-space: normal;">
                  <div style="color:${color}; font-weight: 900; letter-spacing: 0.5px; font-size: 9.5px; margin-bottom: 4px; display: flex; align-items: center; gap: 4px;">
                    🛡️ <span>BULWARK SPECIALTY</span>
                  </div>
                  <div style="color: #cbd5e1;">
                    ${descText}
                  </div>
                </div>
              `;
    } else if (item.subType === "dagger") {
      let noun = item.noun ? item.noun.toLowerCase() : "";
      let descText =
        "Parries mitigate 60% of incoming damage (Cap: 25% / 30% with Titan's Grip). Parries trigger an automatic Riposte counter strike.";
      if (noun.includes("kris") || noun.includes("dirk")) {
        descText =
          "Low Multi-Strike chance (25% base) but deals a massive 55% Attack. Riposte parry counters deal 130% Attack.";
      } else if (noun.includes("stiletto") || noun.includes("baselard")) {
        descText =
          "High Multi-Strike chance (60% base) but deals a lighter 25% Attack. Riposte parry counters deal 80% Attack.";
      } else if (noun.includes("main-gauche")) {
        descText =
          "Natively grants +10% base Parry Rate. Cap increased to 30% (35% with Titan's Grip). Multi-Strike triggers at 40% base.";
      }

      specialtyHtml = `
                <div style="border: 1px solid ${color}44; border-radius:6px; background: rgba(${rgbVals}, 0.04); padding: 6px 10px; font-size: 10px; line-height: 1.4; text-align: left; white-space: normal;">
                  <div style="color:${color}; font-weight: 900; letter-spacing: 0.5px; font-size: 9.5px; margin-bottom: 4px; display: flex; align-items: center; gap: 4px;">
                    🗡️ <span>RIPOSTE SPECIALTY</span>
                  </div>
                  <div style="color: #cbd5e1;">
                    ${descText}
                  </div>
                </div>
              `;
    } else if (item.subType === "tome") {
      let noun = item.noun ? item.noun.toLowerCase() : "";
      let descText =
        "Absorbs 20% to 35% of damage (scales with INT) before Defense checks. Slashes trigger random elemental spells.";
      if (noun.includes("grimoire") || noun.includes("chronicle")) {
        descText =
          "Low spell trigger chance (10% base) but spells deal a cataclysmic 180% damage. Absorbs up to 35% of damage.";
      } else if (noun.includes("lexicon")) {
        descText =
          "High spell trigger chance (26% base) but spells deal a lighter 60% damage. Absorbs up to 35% of damage.";
      }

      specialtyHtml = `
                <div style="border: 1px solid ${color}44; border-radius:6px; background: rgba(${rgbVals}, 0.04); padding: 6px 10px; font-size: 10px; line-height: 1.4; text-align: left; white-space: normal;">
                  <div style="color:${color}; font-weight: 900; letter-spacing: 0.5px; font-size: 9.5px; margin-bottom: 4px; display: flex; align-items: center; gap: 4px;">
                    🔮 <span>ARCANE BARRIER SPECIALTY</span>
                  </div>
                  <div style="color: #cbd5e1;">
                    ${descText}
                  </div>
                </div>
              `;
    }
  }

  // --- BASE STATS SECTION ---
  if (item.id !== "dummy" && item.type !== "artifact") {
    let baseStats = [];

    if (item.baseAtk > 0) {
      let rawVal = window.formatNumber(item.baseAtk);
      let attunedVal =
        slotMult > 1.0
          ? window.formatNumber(Math.ceil(item.baseAtk * slotMult))
          : rawVal;
      baseStats.push({
        label: "Weapon Damage",
        raw: rawVal,
        attuned: attunedVal,
        icon: window.getUiIconSvg("atk", 14),
      });
    }
    if (item.baseDef > 0) {
      let rawVal = window.formatNumber(item.baseDef);
      let attunedVal =
        slotMult > 1.0
          ? window.formatNumber(Math.ceil(item.baseDef * slotMult))
          : rawVal;
      baseStats.push({
        label: "Armor",
        raw: rawVal,
        attuned: attunedVal,
        icon: window.getUiIconSvg("def", 14),
      });
    }
    if (item.baseMaxHp > 0) {
      let rawVal = window.formatNumber(item.baseMaxHp);
      let attunedVal =
        slotMult > 1.0
          ? window.formatNumber(Math.ceil(item.baseMaxHp * slotMult))
          : rawVal;
      baseStats.push({
        label: "Max Life",
        raw: rawVal,
        attuned: attunedVal,
        icon: window.getUiIconSvg("maxHp", 14),
      });
    }
    if (item.baseMoveSpeed > 0) {
      let rawVal = window.formatNumber(item.baseMoveSpeed);
      let attunedVal =
        slotMult > 1.0
          ? window.formatNumber(Math.ceil(item.baseMoveSpeed * slotMult))
          : rawVal;
      baseStats.push({
        label: "Speed",
        raw: rawVal,
        attuned: attunedVal,
        icon: window.getUiIconSvg("moveSpeed", 14),
      });
    }
    if (item.baseBlock > 0) {
      let rawVal = Math.round(item.baseBlock * 100) + "%";
      let attunedVal =
        slotMult > 1.0
          ? Math.round(item.baseBlock * slotMult * 100) + "%"
          : rawVal;
      baseStats.push({
        label: "Block Rate",
        raw: rawVal,
        attuned: attunedVal,
        icon: window.getUiIconSvg("block", 14),
      });
    }
    if (item.baseParry > 0) {
      let rawVal = Math.round(item.baseParry * 100) + "%";
      let attunedVal =
        slotMult > 1.0
          ? Math.round(item.baseParry * slotMult * 100) + "%"
          : rawVal;
      baseStats.push({
        label: "Parry Rate",
        raw: rawVal,
        attuned: attunedVal,
        icon: window.getUiIconSvg("parry", 14),
      });
    }
    if (item.baseInt > 0) {
      let rawVal = window.formatNumber(item.baseInt);
      let attunedVal =
        slotMult > 1.0
          ? window.formatNumber(Math.ceil(item.baseInt * slotMult))
          : rawVal;
      baseStats.push({
        label: "Intelligence",
        raw: rawVal,
        attuned: attunedVal,
        icon: window.getUiIconSvg("int", 14),
      });
    }

    // --- SUBWEAPON COMPASS STATS ---
    if (item.type === "subweapon") {
      let noun = item.noun ? item.noun.toLowerCase() : "";
      if (item.subType === "shield") {
        // Shield Bash Base Multiplier
        let bashMult = 160;
        if (item.isUniqueAegis) bashMult = 220;
        else if (noun.includes("buckler")) bashMult = 100;
        else if (noun.includes("tower")) bashMult = 250;

        baseStats.push({
          label: "Shield Bash Dmg",
          raw: `${bashMult}% Def`,
          attuned: `${bashMult}% Def`,
          icon: window.getUiIconSvg("block", 14),
        });
      } else if (item.subType === "dagger") {
        // Offhand Multi-Strike Chance
        let offhandChance = 40;
        if (noun.includes("kris") || noun.includes("dirk")) offhandChance = 25;
        else if (noun.includes("stiletto") || noun.includes("baselard"))
          offhandChance = 60;

        // Offhand Multi-Strike Damage Multiplier
        let offhandDmg = 35;
        if (noun.includes("kris") || noun.includes("dirk")) offhandDmg = 55;
        else if (noun.includes("stiletto") || noun.includes("baselard"))
          offhandDmg = 25;

        // Riposte Parry Counter Damage Multiplier
        let riposteDmg = 100;
        if (noun.includes("kris") || noun.includes("dirk")) riposteDmg = 130;
        else if (noun.includes("stiletto") || noun.includes("baselard"))
          riposteDmg = 80;

        baseStats.push({
          label: "Multi-Strike Rate",
          raw: `${offhandChance}%`,
          attuned: `${offhandChance}%`,
          icon: window.getUiIconSvg("dex", 14),
        });
        baseStats.push({
          label: "Multi-Strike Dmg",
          raw: `${offhandDmg}% Atk`,
          attuned: `${offhandDmg}% Atk`,
          icon: window.getUiIconSvg("atk", 14),
        });
        baseStats.push({
          label: "Riposte Dmg",
          raw: `${riposteDmg}% Atk`,
          attuned: `${riposteDmg}% Atk`,
          icon: window.getUiIconSvg("parry", 14),
        });
      } else if (item.subType === "tome") {
        // Spell Trigger Chance
        let spellChance = 15;
        if (item.isUniqueWatch) spellChance = 20;
        else if (item.isUniqueChronicle) spellChance = 15;
        else if (noun.includes("grimoire") || noun.includes("chronicle"))
          spellChance = 10;
        else if (noun.includes("spellbook") || noun.includes("codex"))
          spellChance = 18;
        else if (noun.includes("lexicon")) spellChance = 26;

        // Spell Damage Multiplier
        let spellDmg = 100;
        if (item.isUniqueWatch) spellDmg = 100;
        else if (item.isUniqueChronicle) spellDmg = 120;
        else if (noun.includes("grimoire") || noun.includes("chronicle"))
          spellDmg = 180;
        else if (noun.includes("spellbook") || noun.includes("codex"))
          spellDmg = 100;
        else if (noun.includes("lexicon")) spellDmg = 60;

        baseStats.push({
          label: "Spell Chance",
          raw: `${spellChance}%`,
          attuned: `${spellChance}%`,
          icon: window.getUiIconSvg("int", 14),
        });
        baseStats.push({
          label: "Spell Dmg",
          raw: `${spellDmg}% Atk`,
          attuned: `${spellDmg}% Atk`,
          icon: window.getUiIconSvg("atk", 14),
        });
      }
    }

    if (baseStats.length > 0) {
      html += `<div class="base-stats-grid" style="background: rgba(255, 255, 255, 0.015); border: 1px solid #222; border-radius: 6px; padding: 8px 6px; margin: 8px 0; display: flex; justify-content: space-around; align-items: center; gap: 4px;">`;
      baseStats.forEach((b, idx) => {
        if (idx > 0) {
          html += `<div style="width: 1px; height: 18px; background: rgba(255, 255, 255, 0.085);"></div>`;
        }
        // Shorten labels on the fly for horizontal layout fit
        let shortLabel = b.label;
        if (shortLabel === "Weapon Damage") shortLabel = "Damage";
        if (shortLabel === "Block Rate") shortLabel = "Block";
        if (shortLabel === "Parry Rate") shortLabel = "Parry";
        if (shortLabel === "Shield Bash Dmg") shortLabel = "Bash Dmg";
        if (shortLabel === "Multi-Strike Rate") shortLabel = "Multi %";
        if (shortLabel === "Multi-Strike Dmg") shortLabel = "Multi Dmg";
        if (shortLabel === "Riposte Dmg") shortLabel = "Riposte";
        if (shortLabel === "Spell Chance") shortLabel = "Spell %";
        if (shortLabel === "Spell Dmg") shortLabel = "Spell Dmg";
        if (shortLabel === "Max Life") shortLabel = "Max HP";
        if (shortLabel === "Intelligence") shortLabel = "INT";

        let attunedColor = b.raw !== b.attuned ? "#2ecc71" : "#f5f6fa";

        html += `
                      <div style="display: flex; flex-direction: column; align-items: center; text-align: center; flex: 1; min-width: 0;">
                        <span style="font-size: 7.5px; color: #888; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%;">${shortLabel}</span>
                        <div style="font-size: 11.5px; font-weight: bold; display: flex; align-items: center; gap: 3px; line-height: 1;">
                          ${b.icon}
                          <span class="attuned-val" style="color:${attunedColor}; white-space: nowrap;">${b.attuned}</span>
                          <span class="raw-val" style="color:#f5f6fa; white-space: nowrap; display:none;">${b.raw}</span>
                        </div>
                      </div>
                    `;
      });
      html += `</div>`;
    }
  }

  if (item.type === "artifact") {
    html += `<div class="tt-trait">${item.breakdown}</div>`;

    // Only display potential extra rolls on preview (dummy) items to prevent clutter on equipped items
    if (item.id === "dummy") {
      html += `<div style="margin-top:10px; border-top:1.5px dashed #1abc9c; padding-top:6px;">`;
      html += `<div style="font-weight:bold; color:#1abc9c; font-size:10px; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:4px;">🎰 Potential Extra Affixes (Rolls 3):</div>`;
      html += `<div style="font-size:9.5px; color:#aaa; line-height:1.45; white-space:normal; font-family:monospace;">`;
      html += `Can roll 3 extra random affixes: Drop Rate, Drop Quality, Gold Multiplier, Rare Spawn, Fairy Spawn, Strength, Dexterity, or Intelligence.`;
      html += `</div></div>`;
    }
  } else {
    if (isUnique && item.desc) {
      html += `<div class="tt-stat-line" style="color:#ffeaa7; margin-bottom: 10px; white-space:normal; line-height:1.4; padding:6px; border:1px dashed #1abc9c; background:rgba(0,0,0,0.4); border-radius:4px;"><strong>• Unique Effect:</strong> ${item.desc}</div>`;
    }
    if (item.totalEnchants > 0) {
      html += `<div style="color:#9b59b6; font-size:10px; font-weight:bold; margin-bottom:6px; letter-spacing:0.5px; border: 1px dashed #9b59b6; padding: 3px; border-radius: 3px; background: rgba(155, 89, 182, 0.05); text-align: center;">🔮 MYSTICAL ENCHANTS: ${item.totalEnchants} ACTIVE</div>`;
    }
    html += `<div style="font-weight:bold; color:#aaa; margin-bottom:4px; border-bottom: 1px solid #333; padding-bottom: 2px;">Affixes:</div>`;
  }

  // --- EXPLICIT AFFIXES SECTION ---
  if (item.id !== "dummy") {
    let affixes = [];
    let rangeLines = [];

    const statsKeys = [
      { key: "atk", label: "Attack", baseKey: "baseAtk" },
      { key: "maxHp", label: "Max HP", baseKey: "baseMaxHp" },
      { key: "def", label: "Defense", baseKey: "baseDef" },
      {
        key: "moveSpeed",
        label: "Move Speed",
        baseKey: "baseMoveSpeed",
      },
      { key: "str", label: "STR", baseKey: "baseStr" },
      { key: "dex", label: "DEX", baseKey: "baseDex" },
      { key: "int", label: "INT", baseKey: "baseInt" },
      { key: "critChance", label: "Crit Chance", isPct: true },
      { key: "critDamage", label: "Crit Multi", isPct: true },
      {
        key: "block",
        label: "Block Rate",
        isPct: true,
        baseKey: "baseBlock",
      },
      {
        key: "parry",
        label: "Parry Rate",
        isPct: true,
        baseKey: "baseParry",
      },
      {
        key: "activeAttackSpeed",
        label: "Active Atk Spd",
        isPct: true,
        baseKey: "baseActiveSpeed",
      },
      {
        key: "idleAttackSpeed",
        label: "Idle Atk Spd",
        isPct: true,
        baseKey: "baseIdleSpeed",
      },
      { key: "dropRate", label: "Drop Rate", isPct: true },
      { key: "quality", label: "Drop Quality", isPct: true },
      { key: "goldMulti", label: "Gold Multi", isPct: true },
      {
        key: "rareSpawn",
        label: "Rare Spawn",
        isPct: true,
        isDoublePct: true,
      },
      { key: "fairySpawn", label: "Fairy Spawn", isPct: true },
    ];

    statsKeys.forEach((s) => {
      let totalVal = item[s.key] || 0;
      let baseVal =
        item.type !== "artifact" && s.baseKey ? item[s.baseKey] || 0 : 0;
      let affixVal = totalVal - baseVal;

      if (
        affixVal > 0.0001 ||
        ((s.key === "activeAttackSpeed" || s.key === "idleAttackSpeed") &&
          affixVal > 0)
      ) {
        let displayVal = "";
        if (slotMult > 1.0) {
          let scaledVal = affixVal * slotMult;
          if (s.isDoublePct) {
            displayVal = `+${(affixVal * 100).toFixed(2)}% <span style="color:#2ecc71; font-size:10px; font-weight:bold;">(➔ +${(scaledVal * 100).toFixed(2)}%)</span>`;
          } else if (s.isPct) {
            displayVal = `+${Math.floor(affixVal * 100)}% <span style="color:#2ecc71; font-size:10px; font-weight:bold;">(➔ +${Math.floor(scaledVal * 100)}%)</span>`;
          } else {
            displayVal = `+${window.formatNumber(affixVal)} <span style="color:#2ecc71; font-size:10px; font-weight:bold;">(➔ +${window.formatNumber(scaledVal)})</span>`;
          }
        } else {
          if (s.isDoublePct) {
            displayVal = `+${(affixVal * 100).toFixed(2)}%`;
          } else if (s.isPct) {
            displayVal = `+${Math.floor(affixVal * 100)}%`;
          } else {
            displayVal = `+${window.formatNumber(affixVal)}`;
          }
        }

        let iconSvg = window.getUiIconSvg(s.key, 11);
        let rangeStr = window.formatStatRangeStr
          ? window.formatStatRangeStr(item, s.key, s.isPct || s.isDoublePct)
          : "";

        if (rangeStr) {
          rangeLines.push(`
              <div style="font-size: 9.5px; color: #aaa; display: flex; justify-content: space-between; align-items: center; font-family: monospace; background: rgba(0,0,0,0.22); padding: 4px 6px; border-radius: 4px; border: 1.5px solid #111;">
                <span style="color: #94a3b8; font-weight: bold; display: flex; align-items: center; gap: 4px;">${iconSvg} ${s.label} Range:</span>
                <span>${rangeStr}</span>
              </div>
            `);
        }

        affixes.push(
          `<div class="tt-stat-line" style="color:${s.key === "critChance" || s.key === "critDamage" ? "#e67e22" : "#ecf0f1"}; font-weight: bold;">• ${iconSvg} ${s.label}: ${displayVal}${window.getStatEnchantSuffix ? window.getStatEnchantSuffix(item, s.key) : ""}</div>`,
        );
      }
    });

    if (affixes.length > 0) {
      if (item.type === "artifact") {
        html += `<div style="font-weight:bold; color:#aaa; margin-top:8px; margin-bottom:4px; border-bottom: 1px solid #333; padding-bottom: 2px;">Bonus Parameters:</div>`;
      }
      html += affixes.join("");
    } else {
      if (item.type !== "artifact") {
        html += `<div class="tt-stat-line" style="color:#7f8c8d; font-style:italic;">No extra affixes.</div>`;
      }
    }

    let setName = window.getItemSetName ? window.getItemSetName(item) : null;
    if (setName && window.SET_DEFINITIONS[setName]) {
      let setDef = window.SET_DEFINITIONS[setName];
      let currentEquippedCount = 0;
      const eligibleSetSlots = [
        "weapon",
        "subweapon",
        "helmet",
        "chest",
        "leggings",
        "overall",
        "boots",
      ];

      eligibleSetSlots.forEach((slot) => {
        let eqItem = window.equippedSlots[slot];
        if (eqItem) {
          let eqSetName = window.getItemSetName(eqItem);
          if (eqSetName === setName)
            currentEquippedCount += slot === "overall" ? 2 : 1;
        }
      });

      html += `<div style="margin-top:10px; padding-top:6px; border-top:1px dashed #555;">`;
      let displayCount = Math.min(3, currentEquippedCount);
      html += `<div style="font-weight:bold; color:#f1c40f; font-size:10px;">🌟 SET: ${setDef.name} (${displayCount}/3 equipped)</div>`;
      setDef.bonuses.forEach((b) => {
        let activeColor =
          currentEquippedCount >= b.count ? "#2ecc71" : "#7f8c8d";
        let prefix = currentEquippedCount >= b.count ? "🟢" : "⚫";
        html += `<div style="font-size:9px; color:${activeColor}; margin-top:2px;">${prefix} (${b.count} pieces): ${b.desc}</div>`;
      });
      html += `</div>`;
    }
  }

  // --- COMPARISON PANEL NET CHANGE RESOLUTION ---
  if (compareItem) {
    html += `<div style="font-weight:bold; color:#3498db; margin-top:8px; margin-bottom:4px; border-bottom: 1px solid #333; padding-bottom: 2px;">Net Change:</div>`;
    let hasDiffs = false;
    let statsList = [
      { key: "atk", icon: "⚔️" },
      { key: "maxHp", icon: "❤️" },
      { key: "def", icon: "🛡️" },
      { key: "moveSpeed", icon: "👟" },
      { key: "str", icon: "💪" },
      { key: "dex", icon: "🎯" },
      { key: "int", icon: "🧠" },
      { key: "critChance", isPct: true, icon: "✨" },
      { key: "critDamage", isPct: true, icon: "💥" },
      { key: "block", isPct: true, icon: "🛡️" },
      { key: "parry", isPct: true, icon: "⚡" },
      { key: "activeAttackSpeed", icon: "⚡", isPct: true },
      { key: "idleAttackSpeed", icon: "⏱️", isPct: true },
    ];

    statsList.forEach((s) => {
      let val = item[s.key] || 0;
      let eqVal = compareItem[s.key] || 0;
      let diff = val - eqVal;
      if (Math.abs(diff) > 0.001) {
        hasDiffs = true;
        let isPct =
          s.isPct || ["activeAttackSpeed", "idleAttackSpeed"].includes(s.key);
        let isPositive = s.inverseGood ? diff < 0 : diff > 0;
        let color = isPositive ? "#2ecc71" : "#e74c3c";
        let sign = diff > 0 ? "+" : "";
        let diffStr = isPct
          ? sign + Math.round(diff * 100) + "%"
          : sign + window.formatNumber(diff);
        let emoji = s.icon ? s.icon + " " : "";
        let sLabel = window.getStatLabel(s.key);

        html += `<div class="tt-stat-line" style="color:${color}; font-weight:bold; white-space:nowrap;">• ${emoji}${sLabel}: ${diffStr}</div>`;
      }
    });
    if (!hasDiffs)
      html += `<div class="tt-stat-line" style="color:#7f8c8d; font-style:italic;">No net difference.</div>`;
  }

  // Build Collapsible Advanced Details Block (Ranges & Subweapon Specialty)
  if (
    specialtyHtml ||
    (typeof rangeLines !== "undefined" && rangeLines.length > 0)
  ) {
    let specialtySecHtml = specialtyHtml
      ? `<div style="margin-bottom: 8px;">
             ${specialtyHtml}
           </div>`
      : "";

    let rangeSecHtml =
      typeof rangeLines !== "undefined" && rangeLines.length > 0
        ? `<div>
             <strong style="color: #a855f7; display: block; font-size: 9.5px; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px;">🎲 Affix Roll Ranges:</strong>
             <div style="display: flex; flex-direction: column; gap: 4px;">
               ${rangeLines.join("")}
             </div>
           </div>`
        : "";

    html += `
        <style>
          .tooltip-advanced-details summary::-webkit-details-marker { display: none; }
          .tooltip-advanced-details summary { list-style: none; }
          .tooltip-advanced-details[open] summary { color: #df9ffb !important; }
        </style>
        <details class="tooltip-advanced-details" style="margin-top: 10px; border-top: 1px dashed rgba(255,255,255,0.08); padding-top: 8px;" onclick="event.stopPropagation();">
          <summary style="font-size: 9.5px; color: #a855f7; cursor: pointer; user-select: none; font-weight: bold; text-align: center; list-style: none; display: flex; align-items: center; justify-content: center; gap: 4px; outline: none; transition: color 0.15s;">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="transform:translateY(1px);"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
            Show Specialty & Roll Ranges
          </summary>
          <div style="margin-top: 8px; animation: toastFadeIn 0.2s ease-out; display: flex; flex-direction: column; gap: 8px;">
            ${specialtySecHtml}
            ${rangeSecHtml}
          </div>
        </details>
      `;
  }

  if (uniqueStyle) {
    if (uniqueStyle.lore) {
      html += `<div style="margin-top: 10px; padding-top: 8px; border-top: 1px dashed #555; color: #ffb6c1; font-size: 9.5px; line-height: 1.35; font-style: italic; white-space: normal;"><i>${uniqueStyle.lore}</i></div>`;
    }
    html = `<div style="position: relative; background: ${uniqueStyle.bg}; border: 2px solid ${uniqueStyle.border}; box-shadow: inset 0 0 20px ${uniqueStyle.shadow}, 0 0 15px ${uniqueStyle.glow}; padding: 16px 12px 12px 12px; border-radius: 4px; box-sizing: border-box; width: 100%;">
                            ${runicBadge}
                            ${html}
                        </div>`;
  }

  return html;
};

function tierStrDisplay(item) {
  return item.statsRolled === "UNIQUE"
    ? "UNIQUE"
    : `${item.statsRolled}★ ${window.getTierName(item.statsRolled)}`;
}

function getStatEnchantSuffix(item, statKey) {
  if (item.enchantments && item.enchantments[statKey]) {
    let count = item.enchantments[statKey];
    const symbols = ["", "✦", "✹", "❂", "🌌"];
    let sym = symbols[count] || "🌌";
    return ` <span style="color:#9b59b6; font-weight:bold;" title="Enchanted ${count} time(s)">${sym}</span>`;
  }
  return "";
}

function getEquippedItemForComparison(type) {
  let slotKey = type;
  if (type === "overall") {
    if (window.equippedSlots.overall) {
      window.equippedSlots.overall.isEquippedSlot = "overall";
      return window.equippedSlots.overall;
    }
    return getCombinedEquippedTorso();
  }
  if (type === "chest" || type === "leggings") {
    if (window.equippedSlots.overall) {
      window.equippedSlots.overall.isEquippedSlot = "overall";
      return window.equippedSlots.overall;
    }
    slotKey = type;
  }
  let item = window.equippedSlots[slotKey];
  if (item) {
    item.isEquippedSlot = slotKey;
  }
  return item;
}

function getCombinedEquippedTorso() {
  let chest = window.equippedSlots.chest;
  let leggings = window.equippedSlots.leggings;
  if (!chest && !leggings) return null;
  let maxStars = Math.max(
    chest ? (chest.statsRolled === "UNIQUE" ? 5 : chest.statsRolled || 0) : 0,
    leggings
      ? leggings.statsRolled === "UNIQUE"
        ? 5
        : leggings.statsRolled || 0
      : 0,
  );
  return {
    id: "virtual_combined",
    name: "Equipped Chest + Leggings",
    type: "overall",
    statsRolled: maxStars,
    temperLevel: 0,
    stageLevel: 1,
    atk: (chest?.atk || 0) + (leggings?.atk || 0),
    maxHp: (chest?.maxHp || 0) + (leggings?.maxHp || 0),
    def: (chest?.def || 0) + (leggings?.def || 0),
    moveSpeed: (chest?.moveSpeed || 0) + (leggings?.moveSpeed || 0),
    critChance: (chest?.critChance || 0) + (leggings?.critChance || 0),
    critDamage: (chest?.critDamage || 0) + (leggings?.critDamage || 0),
    block: (chest?.block || 0) + (leggings?.block || 0),
    parry: (chest?.parry || 0) + (leggings?.parry || 0),
    activeAttackSpeed:
      (chest?.activeAttackSpeed || 0) + (leggings?.activeAttackSpeed || 0),
    idleAttackSpeed:
      (chest?.idleAttackSpeed || 0) + (leggings?.idleAttackSpeed || 0),
    str: (chest?.str || 0) + (leggings?.str || 0),
    dex: (chest?.dex || 0) + (leggings?.dex || 0),
    int: (chest?.int || 0) + (leggings?.int || 0),
    baseAtk: (chest?.baseAtk || 0) + (leggings?.baseAtk || 0),
    baseMaxHp: (chest?.baseMaxHp || 0) + (leggings?.baseMaxHp || 0),
    baseDef: (chest?.baseDef || 0) + (leggings?.baseDef || 0),
    baseMoveSpeed: (chest?.baseMoveSpeed || 0) + (leggings?.baseMoveSpeed || 0),
    baseBlock: (chest?.baseBlock || 0) + (leggings?.baseBlock || 0),
    baseParry: (chest?.baseParry || 0) + (leggings?.baseParry || 0),
    baseInt: (chest?.baseInt || 0) + (leggings?.baseInt || 0),
  };
}

window.getComparisonDeltaBadge = function (item) {
  if (item.type === "artifact") return "";
  let eq = getEquippedItemForComparison(item.type);
  if (!eq)
    return ` <span style="color:#2ecc71; font-weight:bold; font-size:9px;">[▲ NEW]</span>`;
  return "";
};

window.showEtcTooltip = function (e, keyName) {
  e.stopPropagation();
  let tt = document.getElementById("etc-tooltip");
  let desc = window.etcDex[keyName] || "Unknown material.";

  let color = "#bdc3c7";
  if (keyName === "Eridium Shard") {
    color = "#8e44ad";
  } else if (keyName === "Glimmering Gachapon Key") {
    color = "#00d2ff";
  } else if (keyName === "Gacha Key") {
    color = "#f1c40f";
  } else if (keyName === "Ancient Core") {
    color = "#e74c3c";
  } else if (keyName === "Overlord's Sigil") {
    color = "#1abc9c";
  } else if (keyName === "Astral Essence") {
    color = "#8e44ad";
  } else if (keyName === "Mythic Scrap") {
    color = "#e74c3c";
  } else if (keyName === "Legendary Scrap") {
    color = "#f1c40f";
  } else if (keyName === "Epic Scrap") {
    color = "#e67e22";
  } else if (keyName === "Magic Scrap") {
    color = "#9b59b6";
  } else if (keyName === "Rare Scrap") {
    color = "#3498db";
  } else if (keyName === "Luminous Soul") {
    color = "#ffb6c1";
  } else if (keyName === "Monster Soul") {
    color = "#888888";
  } else if (keyName === "Catalyst Core") {
    color = "#2ecc71";
  }

  let iconHtml = getEtcIconHtml(keyName).replace(
    "margin-right: 12px;",
    "margin-right: 8px;",
  );

  tt.innerHTML = `<div style="padding: 10px; width: 220px; box-sizing: border-box;"><div class="tt-title" style="color:${color}; display:flex; align-items:center; gap:8px;">${iconHtml}<span>${keyName}</span></div><div style="color:#aaa; font-size:11px; white-space:normal; line-height:1.4; margin-top:8px;">${desc}</div></div>`;
  tt.style.borderColor = color;
  tt.style.display = "block";
  window.positionTooltip(e, tt);
};

// Procedurally refresh Gold Shop items at designated timestamps
window.refreshMarketShopIfNeeded = function () {
  let now = Date.now();
  if (
    now >= window.playerStats.shopRefreshTime ||
    window.playerStats.shopItems.length === 0
  ) {
    window.playerStats.shopRefreshTime = now + 30 * 60 * 1000;
    window.playerStats.shopItems = [];

    let peakRunStage = Math.max(
      window.playerStats.stage,
      window.playerStats.maxStage || 1,
    );
    let stageScale = Math.floor((peakRunStage - 1) / 10) + 1;
    let types = ["weapon", "subweapon", "helmet", "chest", "leggings", "boots"];

    for (let i = 0; i < 5; i++) {
      let isIOTD = i === 4;
      let p = window.resolvePlayerStats();
      // Incorporate Merchant Investment (+1% quality multiplier per level) for shop items
      let luckMultiplier = p.qly + (window.playerStats.shopQLevel || 0) * 0.01;
      let roll = Math.random() * 100;
      let statLinesCount = 0;

      if (isIOTD) {
        if (roll < 1.0 * luckMultiplier) statLinesCount = 5;
        else if (roll < 5.0 * luckMultiplier) statLinesCount = 4;
        else if (roll < 20.0 * luckMultiplier) statLinesCount = 3;
        else if (roll < 50.0 * luckMultiplier) statLinesCount = 2;
        else statLinesCount = 1;
      } else {
        if (roll < 0.01 * luckMultiplier) statLinesCount = 5;
        else if (roll < 0.1 * luckMultiplier) statLinesCount = 4;
        else if (roll < 0.5 * luckMultiplier) statLinesCount = 3;
        else if (roll < 2.0 * luckMultiplier) statLinesCount = 2;
        else if (roll < 10.0 * luckMultiplier) statLinesCount = 1;
        else statLinesCount = 0;
      }

      let chosenType = types[Math.floor(Math.random() * types.length)];

      // Resolve base boss gold drops matching this item's specific Level/Stage Scale
      let itemStage = stageScale * 10;
      let effStage = window.getEffectiveStage(itemStage);
      let growthRate = 1.045 + (effStage * 0.04) / (effStage + 200);
      let scale = Math.pow(growthRate, effStage);
      let baseBossGold = Math.floor(15 * scale);

      // Balanced Rarity Cost multipliers (expressed as equivalent boss kills of that item's level)
      const rarityCostMultipliers = [
        15, // 0★ Common
        35, // 1★ Rare
        90, // 2★ Magic
        250, // 3★ Epic
        800, // 4★ Legendary
        2500, // 5★ Mythic
      ];
      let itemRarityFactor = rarityCostMultipliers[statLinesCount] || 15;

      // Final Level-Anchored shop cost calculation
      let cost = Math.floor(baseBossGold * itemRarityFactor);

      let shopItemData = window.createItemObject(
        chosenType,
        statLinesCount,
        stageScale,
        isIOTD ? 1 : 0,
      );
      shopItemData.cost = cost;
      shopItemData.purchased = false;
      shopItemData.isIOTD = isIOTD;

      window.playerStats.shopItems.push(shopItemData);
    }
    if (typeof window.saveGame === "function") window.saveGame();
  }
  window.renderMarketShop();
};

window.showUseTooltip = function (e, keyName) {
  e.stopPropagation();
  let tt = document.getElementById("etc-tooltip");

  let desc = "Consumable item.";
  let color = "#bdc3c7";

  if (useDex[keyName]) {
    desc = useDex[keyName].desc;
    color = useDex[keyName].color;
  } else {
    let stockItem = window.MYSTICAL_STOCK.find((item) => item.name === keyName);
    if (stockItem) {
      desc = stockItem.desc;
      color = stockItem.color || "#bdc3c7";
    }
  }

  if (keyName === "SP Reset Scroll") {
    color = "#9b59b6";
  } else if (keyName === "PP Reset Scroll") {
    color = "#e67e22";
  } else if (keyName.includes("Attack")) {
    color = "#2ecc71";
  } else if (keyName.includes("Vitality")) {
    color = "#e74c3c";
  } else if (keyName.includes("Armored")) {
    color = "#3498db";
  } else if (keyName.includes("Haste")) {
    color = "#f1c40f";
  } else if (keyName.includes("XP") || keyName.includes("Double XP")) {
    color = "#a855f7";
  } else if (
    keyName.includes("Drop Rate") ||
    keyName.includes("Double Drop") ||
    keyName.includes("Drop Elixir")
  ) {
    color = "#22c55e";
  } else if (keyName.includes("Quality")) {
    color = "#ec4899";
  }

  let iconHtml = getUseIconHtml(keyName).replace(
    "margin-right: 12px;",
    "margin-right: 8px;",
  );

  tt.innerHTML = `<div style="padding: 10px; width: 220px; box-sizing: border-box;"><div class="tt-title" style="color:${color}; display:flex; align-items:center; gap:8px;">${iconHtml}<span>${keyName}</span></div><div style="color:#aaa; font-size:11px; white-space:normal; line-height:1.4; margin-top:8px;">${desc}</div></div>`;
  tt.style.borderColor = color;
  tt.style.display = "block";
  window.positionTooltip(e, tt);
};

// --- TAB TRANSITIONS ---

window.switchTab = function (tabId) {
  window.hideTooltip();
  // Keep backward-compatibility with code that tries to target 'gear' or 'stats'
  if (tabId === "gear" || tabId === "stats") tabId = "hero";

  // Record visited tabs to activate first-time tutorial dialogue checks
  if (window.playerStats && window.playerStats.visitedTabs) {
    if (!window.playerStats.visitedTabs.includes(tabId)) {
      window.playerStats.visitedTabs.push(tabId);
    }
  }

  // Evaluate triggers on every single tab transition
  setTimeout(() => {
    if (window.HoorTutorial) {
      window.HoorTutorial.checkTriggers();
    }
  }, 100);

  document
    .querySelectorAll(".tab-content")
    .forEach((c) => c.classList.remove("active"));
  document
    .querySelectorAll(".tab-btn")
    .forEach((b) => b.classList.remove("active"));

  let activeBtn = Array.from(document.querySelectorAll(".tab-btn")).find((b) =>
    b.getAttribute("onclick")?.includes(`'${tabId}'`),
  );
  if (activeBtn) activeBtn.classList.add("active");

  let contentEl = document.getElementById("tab-" + tabId);
  if (contentEl) contentEl.classList.add("active");

  if (tabId === "hero") {
    window.ensureDraftInitialized();
  }
  if (tabId === "forge") {
    if (typeof window.renderForgeTab === "function") window.renderForgeTab();
  }
  if (tabId === "activities") {
    let currentSub = window.state.currentActivitiesSubTab || "DUNGEONS";
    window.switchActivitiesSubTab(currentSub);
    if (typeof window.renderAltarTab === "function") {
      window.renderAltarTab();
    }
  }
  if (tabId === "market") {
    if (typeof window.refreshMarketShopIfNeeded === "function")
      window.refreshMarketShopIfNeeded();
    if (typeof window.renderMysticalShop === "function")
      window.renderMysticalShop();
    if (typeof window.renderGoldUpgrades === "function")
      window.renderGoldUpgrades();
    if (!document.querySelector("#tab-market .sub-tab-btn.active")) {
      window.switchMarketSubTab("GACHA");
    }
  }
  if (tabId === "prestige") {
    if (typeof window.renderPrestigeTab === "function")
      window.renderPrestigeTab();
  }
  window.updateUI();
};

window.switchSubTab = function (subTabId) {
  window.state.currentSubTab = subTabId;
  document
    .querySelectorAll(".sub-tabs:not(#tab-market .sub-tabs) .sub-tab-btn")
    .forEach((btn) => btn.classList.remove("active"));
  let activeBtn = document.getElementById("sub-tab-" + subTabId.toLowerCase());
  if (activeBtn) activeBtn.classList.add("active");

  document.getElementById("bag-equip").style.display =
    subTabId === "EQUIP" ? "block" : "none";
  document.getElementById("bag-art").style.display =
    subTabId === "ART" ? "block" : "none";
  document.getElementById("bag-sigil").style.display =
    subTabId === "SIGIL" ? "block" : "none";
  document.getElementById("bag-etc").style.display =
    subTabId === "ETC" ? "block" : "none";
  document.getElementById("bag-use").style.display =
    subTabId === "USE" ? "block" : "none";

  // Register visited sub-tab
    if (window.playerStats && window.playerStats.visitedSubTabs) {
      let subTabKey = "sub_" + subTabId.toLowerCase();
      if (!window.playerStats.visitedSubTabs.includes(subTabKey)) {
        window.playerStats.visitedSubTabs.push(subTabKey);
      }
    }

    // Evaluate triggers on every single sub-tab transition
    setTimeout(() => {
      if (window.HoorTutorial) {
        window.HoorTutorial.checkTriggers();
      }
    }, 100);

    window.updateUI();
  };

window.switchMarketSubTab = function (subTabId) {
  document
    .querySelectorAll("#tab-market .sub-tabs .sub-tab-btn")
    .forEach((btn) => btn.classList.remove("active"));
  document
    .querySelectorAll(".market-section-content")
    .forEach((sec) => (sec.style.display = "none"));

  let btnSuffix =
    subTabId === "ALTAR"
      ? "altar"
      : subTabId === "GACHA"
        ? "gacha"
        : subTabId === "SINKS"
          ? "sinks"
          : subTabId === "ALCHEMY"
            ? "alchemy"
            : subTabId === "BOUTIQUE"
              ? "boutique"
              : subTabId === "ASTRAL"
                ? "astral"
                : "shop";
  let activeBtn = document.getElementById("market-sub-tab-" + btnSuffix);
  if (activeBtn) activeBtn.classList.add("active");

  let secSuffix =
    subTabId === "ALTAR"
      ? "altar"
      : subTabId === "GACHA"
        ? "gacha"
        : subTabId === "SINKS"
          ? "sinks"
          : subTabId === "ALCHEMY"
            ? "alchemy"
            : subTabId === "BOUTIQUE"
              ? "boutique"
              : subTabId === "ASTRAL"
                ? "astral"
                : "shop";
  let activeSec = document.getElementById("market-sec-" + secSuffix);
  if (activeSec) activeSec.style.display = "block";

  if (subTabId === "ALTAR") {
    window.renderAltarTab();
  } else if (subTabId === "GACHA") {
    window.updateGachaRecentList();
    window.renderGachaShowcaseMarquee();
  } else if (subTabId === "BOUTIQUE") {
    window.renderBoutiqueSkins();
  } else if (subTabId === "ASTRAL") {
    window.renderAstralShop();
  }

  // Register visited sub-tab
    if (window.playerStats && window.playerStats.visitedSubTabs) {
      let subTabKey = "market_" + subTabId.toLowerCase();
      if (!window.playerStats.visitedSubTabs.includes(subTabKey)) {
        window.playerStats.visitedSubTabs.push(subTabKey);
      }
    }

    // Evaluate triggers on every single market sub-tab transition
    setTimeout(() => {
      if (window.HoorTutorial) {
        window.HoorTutorial.checkTriggers();
      }
    }, 100);

    if (typeof window.hideTooltip === "function") window.hideTooltip();
  };

window.switchActivitiesSubTab = function (subTabId) {
  window.state.currentActivitiesSubTab = subTabId;
  document
    .querySelectorAll("#tab-activities .sub-tabs .sub-tab-btn")
    .forEach((btn) => btn.classList.remove("active"));
  document
    .querySelectorAll(".activities-section-content")
    .forEach((sec) => (sec.style.display = "none"));

  let btnSuffix =
    subTabId === "DUNGEONS"
      ? "dungeons"
      : subTabId === "CRUCIBLE"
        ? "crucible"
        : "altar";
  let activeBtn = document.getElementById("activities-sub-tab-" + btnSuffix);
  if (activeBtn) activeBtn.classList.add("active");

  let activeSec = document.getElementById("activities-sec-" + btnSuffix);
  if (activeSec) activeSec.style.display = "block";

  if (subTabId === "ALTAR") {
    window.renderAltarTab();
  } else if (
    subTabId === "CRUCIBLE" &&
    typeof window.renderCrucibleTab === "function"
  ) {
    window.renderCrucibleTab();
  }

  // Register visited sub-tab
    if (window.playerStats && window.playerStats.visitedSubTabs) {
      let subTabKey = "activities_" + subTabId.toLowerCase();
      if (!window.playerStats.visitedSubTabs.includes(subTabKey)) {
        window.playerStats.visitedSubTabs.push(subTabKey);
      }
    }

    // Evaluate triggers on every single activities sub-tab transition
    setTimeout(() => {
      if (window.HoorTutorial) {
        window.HoorTutorial.checkTriggers();
      }
    }, 100);

    if (typeof window.hideTooltip === "function") window.hideTooltip();
  };

window.toggleFullscreen = function () {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch((err) => {
      console.log("Fullscreen activation failed", err);
    });
  } else {
    document.exitFullscreen();
  }
};

window.rerollDailyMission = function (missionId) {
  let mList = window.playerStats.dailyMissions;
  if (!mList) return;
  let mIndex = mList.findIndex((x) => x.id === missionId);
  if (mIndex === -1) return;
  let targetMission = mList[mIndex];

  if (targetMission.completed || targetMission.claimed) {
    window.pushHeaderToast("❌ Cannot re-roll a completed task!", "#e74c3c");
    return;
  }

  let rerollsDone = window.playerStats.dailyRerollsDone || 0;
  if (rerollsDone >= 2) {
    window.pushHeaderToast(
      "❌ Locked: Maximum daily re-rolls reached!",
      "#e74c3c",
    );
    return;
  }

  let soulsCost = rerollsDone === 0 ? 0 : 50;
  let ownedSouls = window.inventory.ETC["Monster Soul"] || 0;

  if (soulsCost > 0 && ownedSouls < soulsCost) {
    window.pushHeaderToast("❌ Requires 50 Monster Souls!", "#e74c3c");
    return;
  }

  // Full 10-piece daily catalog
  let pool = [
    {
      type: "kills",
      label: "Slay monsters",
      targetBase: 300,
      mult: 10,
      unit: "monsters",
      treat: "Monster Soul",
      treatQty: 80,
    },
    {
      type: "rares",
      label: "Slay rare spawns",
      targetBase: 5,
      mult: 1,
      unit: "rares",
      treat: "Luminous Soul",
      treatQty: 3,
    },
    {
      type: "gold",
      label: "Collect Gold",
      targetBase: 2500,
      stageScale: true,
      unit: "Gold",
      treat: "Rare Scrap",
      treatQty: 15,
    },
    {
      type: "fairies",
      label: "Catch wild fairies",
      targetBase: 8,
      mult: 1,
      unit: "fairies",
      treat: "Luminous Soul",
      treatQty: 3,
    },
    {
      type: "tempers",
      label: "Successfully temper gear",
      targetBase: 1,
      mult: 1,
      unit: "tempers",
      treat: "Magic Scrap",
      treatQty: 8,
    },
    {
      type: "reforges",
      label: "Reforge gear modifiers",
      targetBase: 2,
      mult: 1,
      unit: "reforges",
      treat: "Catalyst Core",
      treatQty: 1,
    },
    {
      type: "dungeons",
      label: "Clear Dungeon floors",
      targetBase: 5,
      mult: 1,
      unit: "floors",
      treat: "Epic Scrap",
      treatQty: 6,
    },
    {
      type: "salvage",
      label: "Salvage gear items",
      targetBase: 15,
      mult: 1,
      unit: "items",
      treat: "Rare Scrap",
      treatQty: 12,
    },
    {
      type: "elixirs",
      label: "Consume active elixirs",
      targetBase: 3,
      mult: 1,
      unit: "elixirs",
      treat: "Monster Soul",
      treatQty: 60,
    },
    {
      type: "active_clicks",
      label: "Manually click canvas",
      targetBase: 250,
      mult: 1,
      unit: "clicks",
      treat: "Luminous Soul",
      treatQty: 2,
    },
  ];

  // Filter out duplicate active tasks
  let activeTypes = mList.map((x) => x.type);
  let eligiblePool = pool.filter((p) => !activeTypes.includes(p.type));

  if (eligiblePool.length === 0) {
    window.pushHeaderToast("No alternate tasks available!", "#e74c3c");
    return;
  }

  let newSelect = eligiblePool[Math.floor(Math.random() * eligiblePool.length)];
  let stage = window.playerStats.stage || 1;
  let finalTarget = newSelect.targetBase;
  if (newSelect.stageScale) {
    finalTarget = Math.ceil(newSelect.targetBase * Math.pow(1.045, stage));
  }

  // Apply currency adjustments
  if (soulsCost > 0) {
    window.inventory.ETC["Monster Soul"] -= soulsCost;
    if (window.inventory.ETC["Monster Soul"] === 0)
      delete window.inventory.ETC["Monster Soul"];
  }

  window.playerStats.dailyRerollsDone++;

  // Replace inline parameters with the new selection while ensuring Daily Sacks are preserved
  mList[mIndex] = {
    id: targetMission.id,
    type: newSelect.type,
    desc: `${newSelect.label} (${finalTarget.toLocaleString()} ${newSelect.unit})`,
    current: 0,
    target: finalTarget,
    treat: "Daily Reward Sack",
    treatQty: 1,
    completed: false,
    claimed: false,
  };

  window.pushHeaderToast("🔄 Mission Re-rolled!", "#2ecc71");
  window.SoundManager.play("swing");

  window.updateUI();
  window.renderMissionsWindow();
  window.renderInventory();
  window.saveGame();
};

window.forceCacheClear = function () {
  if (typeof window.showCustomConfirm === "function") {
    window.showCustomConfirm(
      "🔄 Force Refresh?",
      "This will save your progress and force-refresh the game directly from the server. Use this to ensure you have loaded the latest features and visual styles.",
      "Save & Reload",
      "Cancel",
      "#e67e22",
      function () {
        if (typeof window.saveGame === "function") window.saveGame();
        // Strip existing parameters and force a unique query string reload
        let cleanUrl =
          window.location.protocol +
          "//" +
          window.location.host +
          window.location.pathname;
        window.location.href = cleanUrl + "?update=" + Date.now();
      },
    );
  } else {
    if (typeof window.saveGame === "function") window.saveGame();
    let cleanUrl =
      window.location.protocol +
      "//" +
      window.location.host +
      window.location.pathname;
    window.location.href = cleanUrl + "?update=" + Date.now();
  }
};

window.checkForUpdates = function () {
  // Check version.json with a cache buster parameter to guarantee live server data
  fetch("version.json?cb=" + Date.now(), { cache: "no-store" })
    .then((response) => {
      if (!response.ok) throw new Error("Could not reach update manifest");
      return response.json();
    })
    .then((data) => {
      if (data && data.version && data.version > window.GAME_VERSION) {
        window.showCustomConfirm(
          "🚀 Update Found!",
          `A new version of SAQ (v${data.version}) has been deployed! Would you like to update the game to download the latest features and styles? Your progress is saved automatically.`,
          "Update Now",
          "Later",
          "#2ecc71",
          function () {
            if (typeof window.saveGame === "function") window.saveGame();
            let cleanUrl =
              window.location.protocol +
              "//" +
              window.location.host +
              window.location.pathname;
            window.location.href = cleanUrl + "?update=" + Date.now();
          },
        );
      }
    })
    .catch((err) => {
      console.log("Update check bypassed (Offline or Manifest Missing):", err);
    });
};

// --- LOG SYSTEM BOX ---

window.toggleLogPanel = function () {
  let container = document.getElementById("log-panel-container");
  if (container) {
    container.style.display =
      container.style.display === "none" ? "block" : "none";
  }
};

// Keydown listener tracking the 'Enter' key inside the console input bar
window.handleConsoleInput = function (event) {
  if (event.key === "Enter") {
    window.submitConsoleCommand();
  }
};

// Executes string commands typed in the logs terminal
window.submitConsoleCommand = function () {
  let inputEl = document.getElementById("dev-console-input");
  if (!inputEl) return;
  let cmd = inputEl.value.trim();
  inputEl.value = "";
  if (!cmd) return;

  if (typeof window.pushLog === "function") {
    window.pushLog(
      `<span style="color:#e67e22; font-family:monospace;">> ${cmd}</span>`,
    );
  }

  if (cmd === "/dev" || cmd === "/debug" || cmd === "/cheat") {
    let devMod = document.getElementById("dev-modal");
    if (devMod) devMod.style.display = "block";
    if (typeof window.switchDevTab === "function")
      window.switchDevTab("dev-prog");
    if (typeof window.pushHeaderToast === "function")
      window.pushHeaderToast(
        "🛠️ Developer Testing Panel Opened!",
        "var(--accent-orange)",
      );
    return;
  }

  let args = cmd.split(" ");
  let mainCmd = args[0].toLowerCase();

  if (mainCmd === "/gold") {
    let amt = parseInt(args[1], 10) || 100000;
    window.playerStats.coins = BigNum.from(window.playerStats.coins).add(amt);
    window.playerStats.totalGoldEarned = BigNum.from(
      window.playerStats.totalGoldEarned || 0,
    ).add(amt);
    if (typeof window.pushLog === "function")
      window.pushLog(
        `<span style="color:#2ecc71;">[DEV] Granted ${amt.toLocaleString()} Gold!</span>`,
      );
    if (typeof window.updateUI === "function") window.updateUI();
    if (typeof window.saveGame === "function") window.saveGame();
  } else if (mainCmd === "/level") {
    let lvl = parseInt(args[1], 10);
    if (lvl > 0) {
      let oldLvl = window.playerStats.level || 1;
      let diff = lvl - oldLvl;
      window.playerStats.level = lvl;
      if (diff > 0) {
        window.playerStats.sp = (window.playerStats.sp || 0) + diff * 6;
      }
      window.playerStats.xp = 0;
      window.playerStats.xpReq = Math.floor(
        100 * Math.pow(1.2, window.playerStats.level - 1),
      );
      let p = window.resolvePlayerStats();
      window.playerStats.currentHp = p.maxHp;
      if (typeof window.pushLog === "function")
        window.pushLog(
          `<span style="color:#2ecc71;">[DEV] Set Level to ${lvl}! (+${diff > 0 ? diff * 6 : 0} SP)</span>`,
        );
      if (typeof window.updateUI === "function") window.updateUI();
      if (typeof window.saveGame === "function") window.saveGame();
    }
  } else if (mainCmd === "/sp") {
    let amt = parseInt(args[1], 10) || 10;
    window.playerStats.sp += amt;
    if (typeof window.pushLog === "function")
      window.pushLog(
        `<span style="color:#2ecc71;">[DEV] Granted ${amt} Skill Points (SP)!</span>`,
      );
    if (typeof window.updateUI === "function") window.updateUI();
    if (typeof window.saveGame === "function") window.saveGame();
  } else if (mainCmd === "/prestige") {
    let amt = parseInt(args[1], 10) || 1;
    window.playerStats.prestigeCount += amt;
    window.playerStats.prestigePoints += amt * 3;
    if (typeof window.pushLog === "function")
      window.pushLog(
        `<span style="color:#2ecc71;">[DEV] Added ${amt} Prestiges & ${amt * 3} PP!</span>`,
      );
    if (typeof window.updateUI === "function") window.updateUI();
    if (typeof window.renderPrestigeTab === "function")
      window.renderPrestigeTab();
    if (typeof window.saveGame === "function") window.saveGame();
  } else if (mainCmd === "/keys") {
    let amt = parseInt(args[1], 10) || 8;
    window.playerStats.equipKeys += amt;
    window.playerStats.goldKeys += amt;
    window.playerStats.matKeys += amt;
    if (typeof window.addEtcDrop === "function")
      window.addEtcDrop("Gacha Key", amt);
    if (typeof window.pushLog === "function")
      window.pushLog(
        `<span style="color:#2ecc71;">[DEV] Granted +${amt} Keys!</span>`,
      );
    if (typeof window.updateUI === "function") window.updateUI();
    if (typeof window.saveGame === "function") window.saveGame();
  } else if (mainCmd === "/tokens" || mainCmd === "/missiontokens") {
    let amt = parseInt(args[1], 10) || 10;
    window.playerStats.missionTokens =
      (window.playerStats.missionTokens || 0) + amt;
    if (typeof window.pushLog === "function")
      window.pushLog(
        `<span style="color:#2ecc71;">[DEV] Granted +${amt} Quest Points!</span>`,
      );
    if (typeof window.updateUI === "function") window.updateUI();
    if (typeof window.renderMissionsWindow === "function")
      window.renderMissionsWindow();
    if (typeof window.saveGame === "function") window.saveGame();
  } else if (mainCmd === "/mup") {
    let upType = args[1] ? args[1].toLowerCase() : null;
    let lvl = parseInt(args[2], 10);
    if (upType && !isNaN(lvl)) {
      window.playerStats.missionUpgrades = window.playerStats
        .missionUpgrades || { gold: 0, atk: 0, hp: 0, bag: 0 };
      if (window.playerStats.missionUpgrades[upType] !== undefined) {
        window.playerStats.missionUpgrades[upType] = lvl;
        if (typeof window.pushLog === "function")
          window.pushLog(
            `<span style="color:#2ecc71;">[DEV] Set Mission Upgrade ${upType.toUpperCase()} to Level ${lvl}!</span>`,
          );
        if (typeof window.updateUI === "function") window.updateUI();
        if (typeof window.renderMissionsWindow === "function")
          window.renderMissionsWindow();
        if (typeof window.saveGame === "function") window.saveGame();
      } else {
        if (typeof window.pushLog === "function")
          window.pushLog(
            `<span style="color:#e74c3c;">[DEV] Unknown upgrade type "${upType}". Eligible: bag, gold, atk, hp</span>`,
          );
      }
    } else {
      if (typeof window.pushLog === "function")
        window.pushLog(
          `<span style="color:#e74c3c;">Usage: /mup [bag|gold|atk|hp] [level]</span>`,
        );
    }
  } else if (mainCmd === "/sack" || mainCmd === "/sacks") {
    let type = args[1] ? args[1].toLowerCase() : "all";
    let amt = parseInt(args[2], 10) || 1;
    if (type === "daily") {
      window.addUseDrop("Daily Reward Sack", amt);
      window.pushLog(
        `<span style="color:#2ecc71;">[DEV] Added +${amt} Daily Reward Sack(s)!</span>`,
      );
    } else if (type === "weekly") {
      window.addUseDrop("Guild Weekly Sack", amt);
      window.pushLog(
        `<span style="color:#2ecc71;">[DEV] Added +${amt} Guild Weekly Sack(s)!</span>`,
      );
    } else {
      window.addUseDrop("Daily Reward Sack", amt);
      window.addUseDrop("Guild Weekly Sack", amt);
      window.pushLog(
        `<span style="color:#2ecc71;">[DEV] Added +${amt} of each Guild Sack!</span>`,
      );
    }
    window.updateUI();
  } else if (
    mainCmd === "/quests" ||
    mainCmd === "/refresh" ||
    mainCmd === "/resetquests"
  ) {
    window.devRefreshQuests();
  } else if (mainCmd === "/clear") {
    window.logsHistory = [];
    let logBox = document.getElementById("log-box");
    if (logBox) logBox.innerHTML = "";
    if (typeof window.pushLog === "function")
      window.pushLog("<span style='color:#aaa;'>Logs cleared.</span>");
  } else {
    if (typeof window.pushLog === "function") {
      window.pushLog(
        `<span style="color:#e74c3c;">Unknown command. Type /dev to open full Debug GUI panel, or try: /gold, /level, /sp, /prestige, /keys, /tokens, /mup, /clear</span>`,
      );
    }
  }
};

// --- TROPHY / ACHIEVEMENT NAVIGATION ---

window.toggleAchievements = function () {
  let modal = document.getElementById("achievements-modal");
  if (!modal) return;

  // Support empty string display evaluation from stylesheets
  if (modal.style.display === "none" || modal.style.display === "") {
    window.hideTooltip();
    window.buildAchievementsModal();
    modal.style.display = "block";
    window.recalculateAchievementTotals();

    // Smooth auto-scroll to the next unviewed achievement
    if (
      window.playerStats.unviewedAchievements &&
      window.playerStats.unviewedAchievements.length > 0
    ) {
      let firstUnviewedId = window.playerStats.unviewedAchievements[0];
      setTimeout(() => {
        let cardEl = document.getElementById(`ach-card-${firstUnviewedId}`);
        if (cardEl) {
          cardEl.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 180);
    }
  } else {
    modal.style.display = "none";
    window.hideTooltip();
  }
};

window.viewAchievement = function (achId) {
  if (window.playerStats.unviewedAchievements) {
    window.playerStats.unviewedAchievements =
      window.playerStats.unviewedAchievements.filter((id) => id !== achId);
    window.updateUI();
    // Redraw card immediately to remove gold highlight on view
    let card = document.getElementById(`ach-card-${achId}`);
    if (card) {
      card.style.animation = "";
      card.style.boxShadow = "";
      // Immediately strip away the "NEW" ribbon badge element
      let ribbon = card.querySelector(".badge-exclamation");
      if (ribbon) ribbon.remove();
    }
  }
};

window.buildAchievementsModal = function () {
  let listEl = document.getElementById("achievements-list");
  if (!listEl) return;

  listEl.innerHTML = window.AchievementsData.map((ach) => {
    let unlocked =
      window.playerStats.unlockedAchievements &&
      window.playerStats.unlockedAchievements.includes(ach.id);
    let isUnviewed =
      window.playerStats.unviewedAchievements &&
      window.playerStats.unviewedAchievements.includes(ach.id);

    let borderStyle = unlocked
      ? "border-color: #f1c40f; background: rgba(241, 196, 15, 0.05); color: #fff;"
      : "border-color: #333; opacity: 0.5; color: #7f8c8d;";
    let iconDisplay = window.getAchievementBadgeHtml(ach, unlocked, 36);

    let glowStyle = isUnviewed
      ? "animation: glowGold 1.5s infinite; border-color: #f1c40f !important; position: relative;"
      : "position: relative;";
    let newRibbon = isUnviewed
      ? `<span class="badge-exclamation" style="position: absolute; top: -1px; right: -1px; background: #f1c40f; color: #111; font-size: 8px; font-weight: 900; padding: 2px 6px; border-radius: 0 4px 0 4px; text-transform: uppercase; box-shadow: 0 0 8px #f1c40f; letter-spacing: 0.5px; z-index: 10;">NEW</span>`
      : "";

    return `<div id="ach-card-${ach.id}" class="bag-item" style="cursor:help; display:flex; flex-direction:row; justify-content:flex-start; align-items:center; gap:10px; ${borderStyle} ${glowStyle} padding:8px;"
            onmouseenter="window.showAchievementTooltip(event, '${ach.id}'); window.viewAchievement('${ach.id}');"
            ontouchstart="window.showAchievementTooltip(event, '${ach.id}'); window.viewAchievement('${ach.id}');"
            onmouseleave="window.hideTooltip()">
            ${newRibbon}
            ${iconDisplay}
            <div style="flex:1; text-align:left;">
                <strong style="color:${unlocked ? "#f1c40f" : "#666"}; font-size:12px;">${ach.name}</strong>
                <div style="font-size:9px; color:#aaa; margin-top:2px; line-height:1.2;">${ach.desc}</div>
            </div>
        </div>`;
  }).join("");
};

window.showAchievementTooltip = function (e, achId) {
  e.stopPropagation();
  let ach = window.AchievementsData.find((a) => a.id === achId);
  if (!ach) return;

  let unlocked =
    window.playerStats.unlockedAchievements &&
    window.playerStats.unlockedAchievements.includes(achId);
  let timestamp = window.playerStats.achievementTimestamps
    ? window.playerStats.achievementTimestamps[achId]
    : null;
  let timestampHtml = "";
  if (unlocked && timestamp) {
    let dateObj = new Date(timestamp);
    let dateStr = dateObj.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    timestampHtml = `<div class="tt-stat-line" style="color:#7f8c8d; font-size:9.5px; margin-top:2px;">📅 Completed: ${dateStr}</div>`;
  } else if (unlocked) {
    timestampHtml = `<div class="tt-stat-line" style="color:#7f8c8d; font-size:9.5px; margin-top:2px;">📅 Completed: Pre-Release Legacy</div>`;
  }

  let tt = document.getElementById("game-tooltip");

  let statsDesc = Object.keys(ach.stats)
    .map((k) => {
      let val = ach.stats[k];
      let isPct = [
        "critChance",
        "critDamage",
        "block",
        "parry",
        "drop",
        "qly",
        "gold",
        "fairySpawn",
        "rareSpawn",
        "atkPct",
        "maxHpPct",
        "defPct",
        "moveSpeedPct",
        "strPct",
        "dexPct",
        "intPct",
        "expPct",
        "potDurationPct",
        "potStrengthPct",
        "idleSpeedPct",
        "activeSpeedPct",
      ].includes(k);
      let labelMap = {
        atk: "⚔️ Attack",
        maxHp: "❤️ Max HP",
        def: "🛡️ Defense",
        moveSpeed: "👟 Move Speed",
        critChance: "✨ Crit Chance",
        critDamage: "💥 Crit Multiplier",
        block: "🛡️ Block Rate",
        parry: "⚡ Parry Rate",
        str: "💪 STR",
        dex: "🎯 DEX",
        int: "🧠 INT",
        drop: "🍀 Drop Rate Mod",
        qly: "💎 Drop Quality Mod",
        gold: "🟡 Gold Multiplier",
        fairySpawn: "🧚 Fairy Spawn Mod",
        rareSpawn: "✨ Rare Spawn Rate",
        atkPct: "⚔️ Attack Multiplier",
        maxHpPct: "❤️ Max HP Multiplier",
        defPct: "🛡️ Defense Multiplier",
        moveSpeedPct: "👟 Move Speed Multiplier",
        strPct: "💪 STR Multiplier",
        dexPct: "🎯 DEX Multiplier",
        intPct: "🧠 INT Multiplier",
        expPct: "🧠 EXP Multiplier",
        potDurationPct: "🧪 Potion Duration",
        potStrengthPct: "🧪 Potion Potency",
        idleSpeedPct: "⏱️ Idle Speed",
        activeSpeedPct: "⚡ Active Speed",
      };
      let cleanLabel = labelMap[k] || k.toUpperCase();
      let cleanVal = isPct ? `+${(val * 100).toFixed(0)}%` : `+${val}`;
      return `<div class="tt-stat-line" style="color:#2ecc71;">• ${cleanLabel}: ${cleanVal}</div>`;
    })
    .join("");
  let progressValue = window.getAchievementProgress(ach);
  let targetValue = ach.isSingleTier ? 1 : ach.reqValue;
  let percentDone = 0;
  if (progressValue instanceof BigNum) {
    let ratio = progressValue.div(targetValue);
    percentDone = Math.min(
      100,
      Number(ratio.m * Math.pow(10, Math.min(15, ratio.e))) * 100,
    );
  } else {
    percentDone = Math.min(100, (progressValue / targetValue) * 100);
  }

  let iconHtml = window.getAchievementBadgeHtml(ach, unlocked, 28);

  let displayProgressStr =
    progressValue instanceof BigNum
      ? window.formatNumber(progressValue)
      : progressValue.toLocaleString();

  let html = `<div style="padding: 10px; width: 230px; box-sizing: border-box;">
          <div class="tt-title" style="color:${unlocked ? "#f1c40f" : "#aaa"}; display:flex; align-items:center; gap:8px;">${iconHtml}<span>${ach.name}</span></div>
          <div class="tt-subtitle" style="color:${unlocked ? "#2ecc71" : "#e74c3c"}; font-weight:bold;">${unlocked ? "🔓 UNLOCKED" : "🔒 LOCKED"}</div>
          <div style="color:#ddd; font-size:11px; margin-bottom:6px; white-space:normal; line-height:1.4; margin-bottom:6px;">${ach.desc}</div>
          <div style="font-size:10px; color:#aaa; margin-bottom:4px; font-family:monospace;">Progress: ${displayProgressStr} / ${targetValue.toLocaleString()} (${percentDone.toFixed(1)}%)</div>
          ${timestampHtml}
        <div style="font-weight:bold; color:#aaa; margin-top:8px; margin-bottom:4px; border-bottom: 1px solid #333; padding-bottom: 2px;">Permanent Reward:</div>
        ${statsDesc}
    </div>`;

  tt.style.borderColor = unlocked ? "#f1c40f" : "#444";
  tt.innerHTML = html;
  tt.style.display = "block";
  window.positionTooltip(e, tt);
};

window.navigateToAchievement = function (id) {
  let modal = document.getElementById("achievements-modal");
  if (modal && modal.style.display !== "block") {
    window.toggleAchievements();
  }
  setTimeout(() => {
    let el = document.getElementById("ach-card-" + id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.style.transition = "all 0.35s ease";
      el.style.transform = "scale(1.06)";
      el.style.boxShadow = "0 0 15px #f1c40f";
      el.style.borderColor = "#f1c40f";

      setTimeout(() => {
        el.style.transform = "none";
        el.style.boxShadow = "none";
        el.style.borderColor = "var(--border-color)";
      }, 1200);
    }
  }, 150);
};

// --- DEV PANEL ARCHITECT SYSTEMS ---

window.switchDevTab = function (tabId) {
  document
    .querySelectorAll(".dev-tab-content")
    .forEach((el) => (el.style.display = "none"));
  document
    .querySelectorAll(".dev-tab-btn")
    .forEach((btn) => btn.classList.remove("active"));

  let targetEl = document.getElementById(tabId);
  if (targetEl) targetEl.style.display = "block";
  let targetBtn = document.getElementById("btn-" + tabId);
  if (targetBtn) targetBtn.classList.add("active");
};

window.buildDevArchitectUI = function () {
  let container = document.getElementById("dev-architect-lines");
  if (!container) return;
  let stats = [
    { v: "atk", l: "⚔️ Attack" },
    { v: "maxHp", l: "❤️ Max HP" },
    { v: "def", l: "🛡️ Defense" },
    { v: "moveSpeed", l: "👟 Move Spd" },
    { v: "critChance", l: "✨ Crit %" },
    { v: "critDamage", l: "💥 Crit Multi" },
    { v: "block", l: "🛡️ Block %" },
    { v: "parry", l: "⚡ Parry %" },
    { v: "str", l: "💪 STR" },
    { v: "dex", l: "🎯 DEX" },
    { v: "int", l: "🧠 INT" },
    { v: "activeAttackSpeed", l: "⚡ Active Frm" },
    { v: "idleAttackSpeed", l: "⏱️ Idle Frm" },
    { v: "dropRate", l: "🍀 Drop Rate" },
    { v: "quality", l: "💎 Quality" },
    { v: "goldMulti", l: "🟡 Gold Mult" },
    { v: "rareSpawn", l: "✨ Rare Rate" },
    { v: "fairySpawn", l: "🧚 Fairy Rate" },
  ];
  let html = "";
  for (let i = 0; i < 5; i++) {
    html += `<div style="background:#1a1d20; border:1px solid #333; padding:8px; border-radius:4px; margin-bottom:4px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                <select id="dev-arch-stat-${i}" style="flex:1; background:#111; color:#fff; border:1px solid #444; font-size:10px; padding:2px;" onchange="window.updateArchitectRanges()">
                    <option value="">- Empty Slot -</option>
                    ${stats.map((s) => `<option value="${s.v}">${s.l}</option>`).join("")}
                </select>
                <span id="dev-arch-range-label-${i}" style="font-size:9px; color:#aaa; margin-left:8px; font-family:monospace;">(0 ~ 0)</span>
            </div>
            <div style="display:flex; gap:8px; align-items:center;">
                <input type="range" id="dev-arch-slider-${i}" min="0" max="0" step="any" value="0" style="flex:1; height:4px;" oninput="document.getElementById('dev-arch-val-${i}').value = this.value">
                <input type="number" id="dev-arch-val-${i}" value="0" step="any" style="width:60px; background:#111; color:#fff; border:1px solid #444; font-size:10px; padding:2px;" oninput="document.getElementById('dev-arch-slider-${i}').value = this.value">
            </div>
        </div>`;
  }
  container.innerHTML = html;
  window.updateArchitectRanges();
};

window.updateArchitectRanges = function () {
  let type = document.getElementById("dev-item-type").value;
  let rarity = parseInt(document.getElementById("dev-item-rarity").value, 10);
  let lvl = parseInt(document.getElementById("dev-item-lvl").value, 10) || 1;

  let dummyItem = {
    type: type,
    statsRolled: rarity,
    stageLevel: lvl,
    bonusAtk: 1,
    bonusMaxHp: 1,
    bonusDef: 1,
    bonusMoveSpeed: 1,
    bonusCritChance: 1,
    bonusCritDamage: 1,
    bonusBlock: 1,
    bonusParry: 1,
    bonusActiveSpeed: 1,
    bonusIdleSpeed: 1,
    bonusStr: 1,
    bonusDex: 1,
    bonusInt: 1,
    rareSpawn: 1,
    dropRate: 1,
    quality: 1,
    goldMulti: 1,
    fairySpawn: 1,
    baseAtk: 0,
    baseMaxHp: 0,
    baseDef: 0,
    baseMoveSpeed: 0,
    baseBlock: 0,
    baseParry: 0,
    baseInt: 0,
    temperLevel: 0,
  };
  if (type === "subweapon") dummyItem.subType = "shield";

  for (let i = 0; i < 5; i++) {
    let stat = document.getElementById(`dev-arch-stat-${i}`).value;
    let slider = document.getElementById(`dev-arch-slider-${i}`);
    let valInput = document.getElementById(`dev-arch-val-${i}`);
    let rangeLabel = document.getElementById(`dev-arch-range-label-${i}`);

    if (!stat) {
      slider.disabled = true;
      slider.min = 0;
      slider.max = 0;
      slider.value = 0;
      valInput.disabled = true;
      valInput.value = 0;
      rangeLabel.innerText = "(0 ~ 0)";
      continue;
    }

    slider.disabled = false;
    valInput.disabled = false;
    let range = window.getStatBaseRange(dummyItem, stat);

    if (stat === "activeAttackSpeed" || stat === "idleAttackSpeed") {
      if (range.min === 0 && range.max === 0) {
        range.min = -10;
        range.max = -1;
      }
    }

    slider.min = range.min;
    slider.max = range.max;
    let curVal = parseFloat(valInput.value);
    if (curVal < range.min) {
      valInput.value = range.min;
      slider.value = range.min;
    } else if (curVal > range.max) {
      valInput.value = range.max;
      slider.value = range.max;
    } else {
      slider.value = curVal;
    }

    let isPct = [
      "critChance",
      "critDamage",
      "block",
      "parry",
      "dropRate",
      "quality",
      "goldMulti",
      "fairySpawn",
    ].includes(stat);
    let format = (v) =>
      isPct
        ? (v * 100).toFixed(1) + "%"
        : stat === "rareSpawn"
          ? (v * 100).toFixed(2) + "%"
          : Math.round(v);
    rangeLabel.innerText = `(${format(range.min)} ~ ${format(range.max)})`;
  }
};

// ==========================================================================
// --- DEVELOPER PANEL OPERATIONS (REMOVE IN PRODUCTION) ---
// ==========================================================================

window.devSetLevel = function () {
  let el = document.getElementById("dev-level-input");
  if (!el) return;
  let val = parseInt(el.value, 10);
  if (isNaN(val) || val < 1) return;
  window.playerStats.level = val;
  window.playerStats.xp = 0;
  window.playerStats.xpReq = Math.floor(250 * Math.pow(1.2, val - 1));
  let p = window.resolvePlayerStats();
  window.playerStats.currentHp = p.maxHp;
  window.pushLog(
    `<span style='color:#e67e22;'>[DEV] Set level to ${val}</span>`,
  );
  window.updateUI();
};

window.devSetSP = function () {
  let el = document.getElementById("dev-sp-input");
  if (!el) return;
  let val = parseInt(el.value, 10);
  if (isNaN(val) || val < 0) return;
  window.playerStats.sp = val;
  if (window.draftAllocations !== null) window.draftSP = val;
  window.pushLog(`<span style='color:#e67e22;'>[DEV] Set SP to ${val}</span>`);
  window.updateUI();
};

window.devSetStage = function () {
  let el = document.getElementById("dev-stage-input");
  if (!el) return;
  let val = parseInt(el.value, 10);
  if (isNaN(val) || val < 1) return;
  window.playerStats.stage = val;
  window.mob = null;
  window.pushLog(
    `<span style='color:#e67e22;'>[DEV] Set campaign stage to ${val}</span>`,
  );
  window.updateUI();
};

window.devSetMaxStage = function () {
  let el = document.getElementById("dev-maxstage-input");
  if (!el) return;
  let val = parseInt(el.value, 10);
  if (isNaN(val) || val < 1) return;
  window.playerStats.maxStage = val;
  window.playerStats.lifetimePeakStage = Math.max(
    window.playerStats.lifetimePeakStage || 1,
    val,
  );
  window.pushLog(
    `<span style='color:#e67e22;'>[DEV] Set max stage to ${val}</span>`,
  );
  window.updateUI();
};

window.devSetPrestige = function () {
  let el = document.getElementById("dev-prestige-input");
  if (!el) return;
  let val = parseInt(el.value, 10);
  if (isNaN(val) || val < 0) return;
  window.playerStats.prestigeCount = val;
  window.pushLog(
    `<span style='color:#e67e22;'>[DEV] Set total prestige count to ${val}</span>`,
  );
  window.updateUI();
};

window.devSetPP = function () {
  let el = document.getElementById("dev-pp-input");
  if (!el) return;
  let val = parseInt(el.value, 10);
  if (isNaN(val) || val < 0) return;
  window.playerStats.prestigePoints = val;
  window.pushLog(
    `<span style='color:#e67e22;'>[DEV] Set prestige points to ${val}</span>`,
  );
  window.updateUI();
  window.renderPrestigeTab();
};

window.devAddCurrency = function (type) {
  let val = 0;
  if (type === "gold") {
    val = parseInt(document.getElementById("dev-gold-val").value, 10) || 0;
    window.playerStats.coins += val;
    window.playerStats.totalGoldEarned += val;
    window.pushLog(
      `<span style='color:#e67e22;'>[DEV] Granted +${val.toLocaleString()} Gold</span>`,
    );
  } else if (type === "luminous") {
    val = parseInt(document.getElementById("dev-luminous-val").value, 10) || 0;
    window.addEtcDrop("Luminous Soul", val);
    window.pushLog(
      `<span style='color:#e67e22;'>[DEV] Granted +${val} Luminous Souls</span>`,
    );
  } else if (type === "monster") {
    val = parseInt(document.getElementById("dev-monster-val").value, 10) || 0;
    window.addEtcDrop("Monster Soul", val);
    window.pushLog(
      `<span style='color:#e67e22;'>[DEV] Granted +${val} Monster Souls</span>`,
    );
  } else if (type === "eridium") {
    val = parseInt(document.getElementById("dev-eridium-val").value, 10) || 0;
    window.addEtcDrop("Eridium Shard", val);
    window.pushLog(
      `<span style='color:#e67e22;'>[DEV] Granted +${val} Eridium Shards</span>`,
    );
  } else if (type === "astral") {
    val = parseInt(document.getElementById("dev-astral-val").value, 10) || 0;
    window.addEtcDrop("Astral Essence", val);
    window.pushLog(
      `<span style='color:#e67e22;'>[DEV] Granted +${val} Astral Essence</span>`,
    );
  } else if (type === "catalyst") {
    val = parseInt(document.getElementById("dev-catalyst-val").value, 10) || 0;
    window.addEtcDrop("Catalyst Core", val);
    window.pushLog(
      `<span style='color:#e67e22;'>[DEV] Granted +${val} Catalyst Cores</span>`,
    );
  } else if (type === "gachakeys") {
    val = parseInt(document.getElementById("dev-gachakeys-val").value, 10) || 0;
    window.addEtcDrop("Gacha Key", val);
    window.pushLog(
      `<span style='color:#e67e22;'>[DEV] Granted +${val} Gacha Keys</span>`,
    );
  } else if (type === "pp") {
    val = parseInt(document.getElementById("dev-pp-val").value, 10) || 0;
    window.playerStats.prestigePoints += val;
    window.pushLog(
      `<span style='color:#e67e22;'>[DEV] Granted +${val} Prestige Points (PP)</span>`,
    );
    window.renderPrestigeTab();
  } else if (type === "tokens") {
    val = parseInt(document.getElementById("dev-tokens-val").value, 10) || 0;
    window.playerStats.missionTokens =
      (window.playerStats.missionTokens || 0) + val;
    window.pushLog(
      `<span style='color:#e67e22;'>[DEV] Granted +${val} Mission Tokens</span>`,
    );
    if (typeof window.renderMissionsWindow === "function")
      window.renderMissionsWindow();
  }
  window.updateUI();
};

window.devQuickSpawn = function (stars) {
  let types = [
    "weapon",
    "subweapon",
    "helmet",
    "chest",
    "leggings",
    "overall",
    "boots",
  ];
  let chosenType =
    stars === "UNIQUE"
      ? "artifact"
      : types[Math.floor(Math.random() * types.length)];
  let stageScale = Math.floor((window.playerStats.stage - 1) / 10) + 1;
  let statLines = stars === "UNIQUE" ? 3 : stars;
  let newItem = window.createItemObject(
    chosenType,
    statLines,
    stageScale,
    stars === "UNIQUE" ? 0 : stars,
  );

  if (newItem.type === "artifact") {
    window.inventory.ARTIFACT.push(newItem);
  } else {
    window.inventory.EQUIP.push(newItem);
  }

  window.pushLog(
    `<span style='color:#e67e22;'>[DEV] Spawned: ${newItem.name}</span>`,
    newItem.id,
  );
  window.updateUI();
  window.renderInventory();
  if (typeof window.renderForgeTab === "function") window.renderForgeTab();
};

window.devSpawnGear = function () {
  let type = document.getElementById("dev-item-type").value;
  let rarity = parseInt(document.getElementById("dev-item-rarity").value, 10);
  let lvl = parseInt(document.getElementById("dev-item-lvl").value, 10) || 1;
  let setOverride = document.getElementById("dev-item-set").value;
  let prestigeCount =
    parseInt(document.getElementById("dev-item-prestige").value, 10) || 0;

  let originalPrestige = window.playerStats.prestigeCount || 0;
  window.playerStats.prestigeCount = prestigeCount;

  let newItem = window.createItemObject(type, rarity, lvl, rarity);
  window.playerStats.prestigeCount = originalPrestige;

  if (setOverride) {
    newItem.setName = setOverride;
    newItem.name = window.buildProceduralName(newItem);
  }

  window.inventory.EQUIP.push(newItem);
  window.pushLog(
    `<span style='color:#e67e22;'>[DEV] Crafted Custom Gear: ${newItem.name}</span>`,
    newItem.id,
  );

  window.updateUI();
  window.renderInventory();
  if (typeof window.renderForgeTab === "function") window.renderForgeTab();
};

window.devSpawnUnique = function () {
  let uniqueId = document.getElementById("dev-unique-sel").value;
  let lvl = parseInt(document.getElementById("dev-unique-lvl").value, 10) || 1;

  let parts = uniqueId.split("-");
  let category = parts[0];
  let sub = parts[1];

  let newItem;
  if (category === "art") {
    newItem = window.createItemObject("artifact", 3, lvl, 0, [sub]);
  } else {
    newItem = window.createItemObject(category, 5, lvl, 5);
    if (sub === "staff") {
      newItem.isUniqueStaff = true;
      newItem.noun = "Phoenix Staff";
      newItem.setName = null;
      newItem.name = `🔥 Phoenix Ignition Staff (Lv. ${lvl})`;
      newItem.desc =
        "Launches penetrating fireballs that deal 25% Attack damage (3s Cooldown).";
    } else if (sub === "sword") {
      newItem.isUniqueSword = true;
      newItem.noun = "Sanguine Reaver";
      newItem.setName = null;
      newItem.name = `🩸 Crimson Sanguine Reaver (Lv. ${lvl})`;
      newItem.desc =
        "Strikes apply stacking Bleed (Max 5). Strikes at max stacks triggers Rupture, dealing 300% weapon damage and siphoning 10% Max HP.";
    } else if (sub === "singularity") {
      newItem.isUniqueSingularity = true;
      newItem.noun = "Singularity Greatsword";
      newItem.setName = null;
      newItem.name = `🌌 Void-Sovereign Greatsword (Lv. ${lvl})`;
      newItem.desc =
        "Glows for 7s every 30s. Tap during window to enter 5s Storing state, then detonates spatial collapse.";
    } else if (sub === "maelstrom") {
      newItem.isUniqueMaelstrom = true;
      newItem.noun = "Maelstrom Glaive";
      newItem.name = `🌪️ Maelstrom Gale-Glaive (Lv. ${lvl})`;
      newItem.desc =
        "Critical strikes project piercing wind gales. Casting gales grants +10% Active & Idle Attack Speed for 6s (stacks up to 3x).";
    } else if (sub === "aegis") {
      newItem.subType = "shield";
      newItem.isUniqueAegis = true;
      newItem.noun = "Void-Warped Aegis";
      newItem.setName = null;
      newItem.name = `🛡️ Void-Warped Bulwark (Lv. ${lvl})`;
      newItem.desc =
        "Blocks trigger gravity blasts scaling with Defense. Can be absorbed into Singularity vortex.";
    } else if (sub === "watch") {
      newItem.subType = "tome";
      newItem.isUniqueWatch = true;
      newItem.noun = "Chronos Pocket-Watch";
      newItem.setName = null;
      newItem.name = `⏳ Chronos Dial-Watch (Lv. ${lvl})`;
      newItem.desc =
        "Triggers 4s Temporal Fracture every 20s. Accelerates attack speeds by 15% and slows enemies by 25%.";
    } else if (sub === "chronicle") {
      newItem.subType = "tome";
      newItem.isUniqueChronicle = true;
      newItem.noun = "Chronicle of the Ascended";
      newItem.setName = null;
      newItem.name = `📖 Chronicle of past Lives (Lv. ${lvl})`;
      newItem.desc =
        "Boosts XP gain by +200% and bypasses level locks while below 75% peak level.";
    } else if (sub === "warpcore") {
      newItem.isUniqueWarpCore = true;
      newItem.noun = "Warp-Core Greaves";
      newItem.name = `⚡ Warp-Core Greaves (Lv. ${lvl})`;
      newItem.desc =
        "Time Dilation: Attacks speed up by +1% for every 1% of target missing health (up to +99%). Boss kills grant 4s of Maximum Haste.";
    } else if (sub === "tempest") {
      newItem.isUniqueTempest = true;
      newItem.noun = "Crown of Tempests";
      newItem.setName = null;
      newItem.name = `👑 Crown of crackling Tempests (Lv. ${lvl})`;
      newItem.desc =
        "Taking damage has 15% chance to call thunderbolt dealing 150% Attack power and stuns.";
    }
  }

  window.recalculateItemStats(newItem);
  if (newItem.type === "artifact") window.inventory.ARTIFACT.push(newItem);
  else window.inventory.EQUIP.push(newItem);

  window.pushLog(
    `<span style='color:#e67e22;'>[DEV] Spawned Unique/Artifact: ${newItem.name}</span>`,
    newItem.id,
  );
  window.updateUI();
  window.renderInventory();
  if (typeof window.renderForgeTab === "function") window.renderForgeTab();
};

window.devSpawnArchitectGear = function () {
  let type = document.getElementById("dev-item-type").value;
  let rarity = parseInt(document.getElementById("dev-item-rarity").value, 10);
  let lvl = document.getElementById("dev-item-lvl").value || 1;
  let setOverride = document.getElementById("dev-item-set").value;

  let newItem = {
    id: window.idCounter++,
    name: "",
    type: type,
    statsRolled: rarity,
    temperLevel: 0,
    stageLevel: lvl,
    atk: 0,
    maxHp: 0,
    def: 0,
    moveSpeed: 0,
    critChance: 0,
    critDamage: 0,
    block: 0,
    parry: 0,
    dropRate: 0,
    quality: 0,
    goldMulti: 0,
    rareSpawn: 0,
    fairySpawn: 0,
    activeAttackSpeed: 0,
    idleAttackSpeed: 0,
    baseAtk: 0,
    baseMaxHp: 0,
    baseDef: 0,
    baseMoveSpeed: 0,
    baseBlock: 0,
    baseParry: 0,
    baseInt: 0,
    bonusAtk: 0,
    bonusMaxHp: 0,
    bonusDef: 0,
    bonusMoveSpeed: 0,
    bonusCritChance: 0,
    bonusCritDamage: 0,
    bonusBlock: 0,
    bonusParry: 0,
    bonusActiveSpeed: 0,
    bonusIdleSpeed: 0,
    bonusStr: 0,
    bonusDex: 0,
    bonusInt: 0,
    str: 0,
    dex: 0,
    int: 0,
    trait: null,
    desc: "",
    breakdown: "",
    noun: "Exo-Plate",
    setName: setOverride || null,
  };

  if (type === "subweapon") {
    newItem.subType = "shield";
  }

  let nounList = window.slotNouns[type];
  if (type === "subweapon") nounList = window.slotNouns.subweapon.shield;
  newItem.noun = nounList ? nounList[0] : "Exo-Plate";

  for (let i = 0; i < 5; i++) {
    let statKey = document.getElementById(`dev-arch-stat-${i}`).value;
    let val =
      parseFloat(document.getElementById(`dev-arch-val-${i}`).value) || 0;
    if (!statKey) continue;

    let bonusField =
      "bonus" + statKey.charAt(0).toUpperCase() + statKey.slice(1);
    if (
      statKey === "dropRate" ||
      statKey === "quality" ||
      statKey === "goldMulti" ||
      statKey === "rareSpawn" ||
      statKey === "fairySpawn"
    ) {
      newItem[statKey] = val;
    } else {
      newItem[bonusField] = val;
    }
  }

  window.recalculateItemStats(newItem);
  newItem.name = window.buildProceduralName(newItem);

  window.inventory.EQUIP.push(newItem);
  window.pushLog(
    `<span style='color:#e67e22;'>[DEV] Spawned Architect Gear: ${newItem.name}</span>`,
    newItem.id,
  );

  window.updateUI();
  window.renderInventory();
  if (typeof window.renderForgeTab === "function") window.renderForgeTab();
};

window.devTriggerBuff = function (type) {
  let duration = 36000; // 10 minutes (600 seconds * 60 frames)
  if (type === "frenzy") {
    window.playerStats.frenzyTimer = duration;
    window.pushLog(
      `<span style='color:#e67e22;'>[DEV] Triggered 10-Minute Frenzy</span>`,
    );
  } else if (type === "adrenaline") {
    window.playerStats.adrenalineTimer = duration;
    window.pushLog(
      `<span style='color:#e67e22;'>[DEV] Triggered 10-Minute Adrenaline</span>`,
    );
  } else if (type === "potions") {
    window.playerStats.atkPotionTimer = duration;
    window.playerStats.atkPotionStrength = 0.35;
    window.playerStats.hpPotionTimer = duration;
    window.playerStats.hpPotionStrength = 0.35;
    window.playerStats.defPotionTimer = duration;
    window.playerStats.defPotionStrength = 0.35;
    window.playerStats.hastePotionTimer = duration;
    window.playerStats.hastePotionStrength = 3;
    window.pushLog(
      `<span style='color:#e67e22;'>[DEV] Infused all 10-Minute Potions at Max Strength</span>`,
    );
  }
  window.updateUI();
};

window.devHealFull = function () {
  let p = window.resolvePlayerStats();
  window.playerStats.currentHp = p.maxHp;
  window.pushLog(
    `<span style='color:#2ecc71;'>[DEV] Full Healing applied. HP restored.</span>`,
  );
  window.updateUI();
};

window.devUnlockAllAchievements = function () {
  if (!window.playerStats.unlockedAchievements)
    window.playerStats.unlockedAchievements = [];
  window.AchievementsData.forEach((ach) => {
    if (!window.playerStats.unlockedAchievements.includes(ach.id)) {
      window.playerStats.unlockedAchievements.push(ach.id);
    }
  });
  window.recalculateAchievementTotals();
  let p = window.resolvePlayerStats();
  window.playerStats.currentHp = p.maxHp;
  window.pushLog(
    `<span style='color:#e67e22;'>[DEV] All achievements unlocked! Stat bonuses compounded.</span>`,
  );
  window.updateUI();
  window.renderInventory();
};

window.devToggleGodMode = function () {
  window.playerStats.godMode = !window.playerStats.godMode;
  let btn = document.getElementById("btn-dev-godmode");
  if (btn) {
    if (window.playerStats.godMode) {
      btn.innerText = "🛡️ God Mode (Invulnerability): ON";
      btn.style.background = "#2ecc71";
      btn.style.color = "#fff";
    } else {
      btn.innerText = "🛡️ God Mode (Invulnerability): OFF";
      btn.style.background = "#333";
      btn.style.color = "#aaa";
    }
  }
  window.pushLog(
    `<span style='color:#e67e22;'>[DEV] God Mode (Invulnerability) ${window.playerStats.godMode ? "ON" : "OFF"}</span>`,
  );
};

// ==========================================================================
// --- INTERACTIVE DRAGGABLE WINDOW SYSTEM ---
// ==========================================================================

window.openEquipSwapWindow = function (e, slotKey) {
  if (e) {
    e.stopPropagation();
    e.preventDefault();
  }

  // Check if slot is locked by overall suit to prevent UI conflicts
  if (
    (slotKey === "chest" || slotKey === "leggings") &&
    window.equippedSlots.overall
  ) {
    if (typeof window.pushHeaderToast === "function")
      window.pushHeaderToast("🔒 Locked by Overall Suit!", "#e74c3c");
    return;
  }
  if (
    slotKey === "overall" &&
    (window.equippedSlots.chest || window.equippedSlots.leggings)
  ) {
    if (typeof window.pushHeaderToast === "function")
      window.pushHeaderToast("🔒 Locked by equipped Piece gear!", "#e74c3c");
    return;
  }

  let existingWin = document.getElementById("equip-swap-window");
  let savedLeft = null;
  let savedTop = null;
  if (existingWin) {
    savedLeft = existingWin.style.left;
    savedTop = existingWin.style.top;
    existingWin.remove();
  }

  let isArt = slotKey.startsWith("art");
  let targetType = isArt ? "artifact" : slotKey;

  // Filter unequipped inventory items that fit this exact slot
  let eligibleItems = [];
  if (isArt) {
    eligibleItems = window.inventory.ARTIFACT.filter(
      (item) => item && item.type === "artifact",
    );
  } else {
    eligibleItems = window.inventory.EQUIP.filter(
      (item) => item && item.type === targetType,
    );
  }

  let win = document.createElement("div");
  win.id = "equip-swap-window";
  win.className = "draggable-window";

  if (savedLeft !== null && savedTop !== null) {
    win.style.left = savedLeft;
    win.style.top = savedTop;
  } else {
    let container = document
      .getElementById("game-container")
      .getBoundingClientRect();

    // Adaptive Centering: Calculates the current scroll depth and positions the modal in front of you
    let winWidth = 290;
    let leftOffset = (window.innerWidth - winWidth) / 2 - container.left;
    let topOffset =
      window.scrollY + window.innerHeight / 2 - 150 - container.top;

    // Clamp coordinates safely within the game-container boundary
    if (leftOffset < 5) leftOffset = 5;
    if (topOffset < 5) topOffset = 5;
    win.style.left = leftOffset + "px";
    win.style.top = topOffset + "px";
  }

  let headerTitle = `Swap: ${slotKey.charAt(0).toUpperCase() + slotKey.slice(1)}`;
  let contentHtml = "";

  if (eligibleItems.length === 0) {
    contentHtml = `<div style="color:#666; text-align:center; padding: 25px 0; font-size:11px; font-style:italic;">No unequipped ${targetType}s found.</div>`;
  } else {
    contentHtml = eligibleItems
      .map((item) => {
        let color = window.getTierColor(item.statsRolled);
        let rating =
          item.statsRolled === "UNIQUE" ? "UNIQUE" : `${item.statsRolled}★`;
        let comparisonBadge = window.getComparisonDeltaBadge(item);

        return `
                                  <div class="bag-item" style="padding:6px; margin-bottom:5px; background:#181c22; border:1px solid #333; display:flex; justify-content:space-between; align-items:center;"
                                       onmouseenter="window.showInventoryTooltip(event, ${item.id})"
                                       ontouchstart="window.showInventoryTooltip(event, ${item.id})"
                                       onmouseleave="window.hideTooltip()">
                                      <div style="text-align:left; max-width: 170px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
                                          <strong style="color:${color}; font-size:11px;">${item.name}</strong><br>
                                          <span style="font-size:9.5px; color:#aaa;">${rating} | Lv. ${item.stageLevel}</span>${comparisonBadge}
                                      </div>
                                      <button class="btn-action" style="padding:3px 8px; font-size:10px; font-weight:bold; background:var(--accent-green);" onclick="window.executeSwapItem('${slotKey}', ${item.id})">Equip</button>
                                  </div>
                              `;
      })
      .join("");
  }

  win.innerHTML = `
                        <div class="draggable-header" id="equip-win-handle" style="background: linear-gradient(180deg, #181d24 0%, #0d1117 100%);">
                            <span>${headerTitle}</span>
                            <button onclick="document.getElementById('equip-swap-window').remove(); window.hideTooltip();" style="background:transparent; border:none; color:#e74c3c; font-weight:bold; cursor:pointer; font-size:11px; padding:2px;">[X]</button>
                        </div>
                        <div class="draggable-content">
                            ${contentHtml}
                        </div>
                    `;

  document.getElementById("game-container").appendChild(win);
  window.makeWindowDraggable(win, document.getElementById("equip-win-handle"));
};

window.executeSwapItem = function (slotKey, itemId) {
  let isArt = slotKey.startsWith("art");
  if (isArt) {
    let idx = window.inventory.ARTIFACT.findIndex((i) => i.id === itemId);
    if (idx !== -1) {
      let item = window.inventory.ARTIFACT[idx];

      // Prevent equipping duplicate artifacts via manual slot selection
      let isAlreadyEquipped = ["art1", "art2", "art3"].some(
        (slot) =>
          slot !== slotKey &&
          window.equippedSlots[slot] &&
          window.equippedSlots[slot].trait === item.trait,
      );
      if (isAlreadyEquipped) {
        if (typeof window.pushHeaderToast === "function") {
          window.pushHeaderToast(
            "❌ You cannot equip duplicate artifacts!",
            "#e74c3c",
          );
        }
        return;
      }

      let oldMaxHp = 100;
      if (typeof window.resolvePlayerStats === "function")
        oldMaxHp = window.resolvePlayerStats().maxHp;

      // Swap the items, returning old item to inventory
      if (window.equippedSlots[slotKey]) {
        let oldItem = window.equippedSlots[slotKey];
        delete oldItem.isEquippedSlot;
        window.inventory.ARTIFACT.push(oldItem);
      }

      window.inventory.ARTIFACT.splice(idx, 1);
      window.equippedSlots[slotKey] = item;
      item.isEquippedSlot = slotKey;

      if (typeof window.resolvePlayerStats === "function") {
        let newMaxHp = window.resolvePlayerStats().maxHp;
        window.playerStats.currentHp = Math.max(
          1,
          Math.min(
            newMaxHp,
            Math.floor((window.playerStats.currentHp / oldMaxHp) * newMaxHp),
          ),
        );
      }
    }
  } else {
    window.equipItem(itemId);
  }

  let win = document.getElementById("equip-swap-window");
  if (win) win.remove();

  if (typeof window.checkAchievements === "function")
    window.checkAchievements();
  if (typeof window.updateUI === "function") window.updateUI();
  if (typeof window.renderInventory === "function") window.renderInventory();
  if (typeof window.renderForgeTab === "function") window.renderForgeTab();
  if (typeof window.saveGame === "function") window.saveGame();
};

window.showCurrentRatesModal = function () {
  let existingWin = document.getElementById("rates-draggable-window");
  let savedLeft = null;
  let savedTop = null;
  if (existingWin) {
    savedLeft = existingWin.style.left;
    savedTop = existingWin.style.top;
    existingWin.remove();
  }

  let win = document.createElement("div");
  win.id = "rates-draggable-window";
  win.className = "draggable-window";

  if (savedLeft !== null && savedTop !== null) {
    win.style.left = savedLeft;
    win.style.top = savedTop;
  } else {
    win.style.left = "100px";
    win.style.top = "50px";
  }

  let p = window.resolvePlayerStats();
  let nowStage = window.playerStats.stage || 1;
  let campDepthQ = window.getDepthQualityMultiplier(nowStage);
  let campShardChance = 0.005 * (campDepthQ - 1.0);
  let campKeyChance = nowStage >= 50 ? 0.0003 * (campDepthQ - 1.0) : 0.0;

  let goldFloor = window.playerStats.currentDungeonStage["gold"] || 1;
  let matFloor = window.playerStats.currentDungeonStage["mat"] || 1;

  let dDepthQ = window.getDepthQualityMultiplier(matFloor);
  let dCoreChance = 0.008 * (dDepthQ - 1.0);
  let dKeyChance = 0.0005 * (dDepthQ - 1.0);
  let dShardChance = 0.0016 * (dDepthQ - 1.0);

  let cruciblePeak = window.playerStats.cruciblePeak || 1;

  // Equipment Drop Chances (Chances of rolling each star quality based on active Drop Quality stats)
  let dropProbs = window.calculateRarityProbabilities(p.qly, false);
  let chance5 = p.qly >= 2.0 ? dropProbs[5] : 0;
  let chance4 = p.qly >= 1.5 ? dropProbs[4] : 0;
  let chance3 = dropProbs[3];
  let chance2 = dropProbs[2];
  let chance1 = dropProbs[1];
  let chance0 = dropProbs[0];

  win.innerHTML = `
                        <div class="draggable-header" id="rates-win-handle" style="background: linear-gradient(180deg, #181d24 0%, #0d1117 100%);">
                            <span>📊 Live Drop Analytics</span>
                            <button onclick="document.getElementById('rates-draggable-window').remove(); window.hideTooltip();" style="background:transparent; border:none; color:#e74c3c; font-weight:bold; cursor:pointer; font-size:11px; padding:2px;">[X]</button>
                        </div>
                        <div class="draggable-content" style="max-height: 380px;">
                            <p style="font-size:10px; color:#aaa; margin: 0 0 10px 0; line-height:1.4;">
                                Drag this window anywhere. Rates adapt to your current Campaign/Dungeon progression. Hover locks to view details.
                            </p>

                            <!-- LIVE QUALITY AFFIXES CHANCES -->
                            <div style="background:#111; border:1px solid #ff007f; border-radius:4px; padding:8px; margin-bottom:8px;">
                                <div style="color:#ff007f; font-weight:bold; font-size:11px; margin-bottom:4px; border-bottom:1px solid #222; padding-bottom:3px; display:flex; justify-content:space-between;">
                                    <span>⚙️ Active Drop Quality chances</span>
                                    <span style="color:#888; font-family:monospace;">Qly: ${p.qly.toFixed(2)}x</span>
                                </div>
                                <div style="font-family:monospace; font-size:10px; display:flex; flex-direction:column; gap:2px;">
                                    <div style="display:flex; justify-content:space-between;">
                                        <span>🟥 5★ Mythic Quality:</span>
                                        <strong style="color:${chance5 > 0 ? "#e74c3c" : "#7f8c8d"};">${chance5 > 0 ? chance5.toFixed(2) + "%" : "🔒 locked (Req. 2.00x Qly)"}</strong>
                                    </div>
                                    <div style="display:flex; justify-content:space-between;">
                                        <span>🟨 4★ Legendary Quality:</span>
                                        <strong style="color:${chance4 > 0 ? "#f1c40f" : "#7f8c8d"};">${chance4 > 0 ? chance4.toFixed(2) + "%" : "🔒 locked (Req. 1.50x Qly)"}</strong>
                                    </div>
                                    <div style="display:flex; justify-content:space-between;">
                                        <span>🟧 3★ Epic Quality:</span>
                                        <strong style="color:#e67e22;">${chance3.toFixed(2)}%</strong>
                                    </div>
                                    <div style="display:flex; justify-content:space-between;">
                                        <span>🟪 2★ Magic Quality:</span>
                                        <strong style="color:#9b59b6;">${chance2.toFixed(2)}%</strong>
                                    </div>
                                    <div style="display:flex; justify-content:space-between;">
                                        <span>🟦 1★ Rare Quality:</span>
                                        <strong style="color:#3498db;">${chance1.toFixed(2)}%</strong>
                                    </div>
                                    <div style="display:flex; justify-content:space-between;">
                                        <span>⬜ 0★ Common Quality:</span>
                                        <strong style="color:#fff;">${chance0.toFixed(2)}%</strong>
                                    </div>
                                </div>
                            </div>

                            <!-- CAMPAIGN -->
                            <div style="background:#111; border:1px solid #333; border-radius:4px; padding:8px; margin-bottom:8px;">
                                <div style="color:var(--text-gold); font-weight:bold; font-size:11px; margin-bottom:4px; border-bottom:1px solid #222; padding-bottom:3px; display:flex; justify-content:space-between;">
                                    <span>🗺️ Campaign (Stage ${nowStage})</span>
                                    <span style="color:#888; font-family:monospace;">Mult: ${campDepthQ.toFixed(2)}x</span>
                                </div>
                                <div style="font-family:monospace; font-size:10px; display:flex; flex-direction:column; gap:2px;">
                                    <div style="display:flex; justify-content:space-between;">
                                        <span>🔮 Shard (Boss):</span>
                                        <strong style="color:#8e44ad;">${(campShardChance * 100).toFixed(3)}%</strong>
                                    </div>
                                    <div style="display:flex; justify-content:space-between; cursor:help; border-bottom: 1px dotted rgba(255,255,255,0.05);" onmouseenter="window.showRatesLockTooltip(event, 'camp_key')" onmouseleave="window.hideTooltip()" ontouchstart="window.showRatesLockTooltip(event, 'camp_key')">
                                        <span>🔑 Key (Boss):</span>
                                        <strong style="color:${nowStage >= 50 ? "#f1c40f" : "#7f8c8d"};">${nowStage >= 50 ? (campKeyChance * 100).toFixed(3) + "%" : "🔒 locked (Stage 50)"}</strong>
                                    </div>
                                </div>
                            </div>

                            <!-- EQUIP DUNGEON -->
                            <div style="background:#111; border:1px solid #333; border-radius:4px; padding:8px; margin-bottom:8px;">
                                <div style="color:#3498db; font-weight:bold; font-size:11px; margin-bottom:4px; border-bottom:1px solid #222; padding-bottom:3px; display:flex; justify-content:space-between;">
                                    <span>🛡️ Equip Dungeon (Floor ${window.playerStats.currentDungeonStage["equip"] || 1})</span>
                                </div>
                                <div style="font-family:monospace; font-size:10px; display:flex; flex-direction:column; gap:2px;">
                                    <div style="display:flex; justify-content:space-between;">
                                        <span>🔱 Overlord's Sigil (Boss):</span>
                                        <strong style="color:#1abc9c;">5.000%</strong>
                                    </div>
                                    <div style="display:flex; justify-content:space-between;">
                                        <span>🛡️ High Tier Equip (Boss):</span>
                                        <strong style="color:#2ecc71;">25.000%</strong>
                                    </div>
                                </div>
                            </div>

                            <!-- GOLD DUNGEON -->
                                                        <div style="background:#111; border:1px solid #333; border-radius:4px; padding:8px; margin-bottom:8px;">
                                                            <div style="color:#f1c40f; font-weight:bold; font-size:11px; margin-bottom:4px; border-bottom:1px solid #222; padding-bottom:3px; display:flex; justify-content:space-between;">
                                                                <span>💰 Gold Mine (Floor ${goldFloor})</span>
                                                            </div>
                                                            <div style="font-family:monospace; font-size:10px; display:flex; flex-direction:column; gap:2px;">
                                                                <div style="display:flex; justify-content:space-between;">
                                                                    <span>🟡 Gold Multiplier (Floor):</span>
                                                                    <strong style="color:#f1c40f;">x${(10.0 + goldFloor / 5.0).toFixed(2)}</strong>
                                                                </div>
                                                                <div style="display:flex; justify-content:space-between;">
                                                                    <span>👑 Boss Gold Bonus:</span>
                                                                    <strong style="color:#f1c40f;">x${((10.0 + goldFloor / 5.0) * 5.0).toFixed(2)}</strong>
                                                                </div>
                                                            </div>
                                                        </div>

                            <!-- MATERIAL DUNGEON -->
                            <div style="background:#111; border:1px solid #333; border-radius:4px; padding:8px; margin-bottom:8px;">
                                <div style="color:#2ecc71; font-weight:bold; font-size:11px; margin-bottom:4px; border-bottom:1px solid #222; padding-bottom:3px; display:flex; justify-content:space-between;">
                                    <span>🧪 Material Pit (Floor ${matFloor})</span>
                                    <span style="color:#888; font-family:monospace;">Mult: ${dDepthQ.toFixed(2)}x</span>
                                </div>
                                <div style="font-family:monospace; font-size:10px; display:flex; flex-direction:column; gap:2px;">
                                    <div style="display:flex; justify-content:space-between; cursor:help; border-bottom: 1px dotted rgba(255,255,255,0.05);" onmouseenter="window.showRatesLockTooltip(event, 'core')" onmouseleave="window.hideTooltip()" ontouchstart="window.showRatesLockTooltip(event, 'core')">
                                        <span>🔴 Ancient Core (Boss):</span>
                                        <strong style="color:${matFloor >= 15 ? "#e74c3c" : "#7f8c8d"};">${matFloor >= 15 ? (dCoreChance * 100).toFixed(3) + "%" : "🔒 locked (Floor 15)"}</strong>
                                    </div>
                                    <div style="display:flex; justify-content:space-between; cursor:help; border-bottom: 1px dotted rgba(255,255,255,0.05);" onmouseenter="window.showRatesLockTooltip(event, 'key')" onmouseleave="window.hideTooltip()" ontouchstart="window.showRatesLockTooltip(event, 'key')">
                                        <span>🔑 Gacha Key (Boss):</span>
                                        <strong style="color:${matFloor >= 35 ? "#f1c40f" : "#7f8c8d"};">${matFloor >= 35 ? (dKeyChance * 100).toFixed(3) + "%" : "🔒 locked (Floor 35)"}</strong>
                                    </div>
                                    <div style="display:flex; justify-content:space-between; cursor:help; border-bottom: 1px dotted rgba(255,255,255,0.05);" onmouseenter="window.showRatesLockTooltip(event, 'shard')" onmouseleave="window.hideTooltip()" ontouchstart="window.showRatesLockTooltip(event, 'shard')">
                                        <span>🔮 Shard (Boss):</span>
                                        <strong style="color:${matFloor >= 60 ? "#8e44ad" : "#7f8c8d"};">${matFloor >= 60 ? (dShardChance * 100).toFixed(3) + "%" : "🔒 locked (Floor 60)"}</strong>
                                    </div>
                                </div>
                            </div>

                            <!-- CRUCIBLE -->
                            <div style="background:#111; border:1px solid #333; border-radius:4px; padding:8px; margin-bottom:8px;">
                                <div style="color:#9b59b6; font-weight:bold; font-size:11px; margin-bottom:4px; border-bottom:1px solid #222; padding-bottom:3px; display:flex; justify-content:space-between;">
                                    <span>🔮 Crucible (Peak Wave ${cruciblePeak})</span>
                                </div>
                                <div style="font-family:monospace; font-size:10px; display:flex; flex-direction:column; gap:2px;">
                                    <div style="display:flex; justify-content:space-between;">
                                        <span>🌌 Shards Per Wave (Base):</span>
                                        <strong style="color:#9b59b6;">1.50</strong>
                                    </div>
                                    <div style="display:flex; justify-content:space-between;">
                                        <span>💚 Catalyst Core Checkpoint:</span>
                                        <strong style="color:#2ecc71;">Every 10 Waves</strong>
                                    </div>
                                </div>
                            </div>

                            <!-- SPECIFIC ITEM DROP CODEX -->
                                                            <div style="background:#111; border:1px solid #333; border-radius:4px; padding:8px;">
                                                                <div style="color:#1abc9c; font-weight:bold; font-size:11px; margin-bottom:6px; border-bottom:1px solid #222; padding-bottom:3px;">
                                                                    <span>📋 Specific Item Drop Codex</span>
                                                                </div>
                                                                <div style="font-family:monospace; font-size:9px; display:flex; flex-direction:column; gap:4px; line-height: 1.35;">
                                                                    <div style="border-bottom:1px dashed #222; padding-bottom:3px;">
                                                                        <span style="color:#1abc9c; font-weight:bold;">🔱 Overlord's Sigil:</span><br>
                                                                        <span style="color:#aaa;">Source: Equip Dungeon Boss (Floor 1+)</span><br>
                                                                        <span style="color:#94a3b8;">Chance:</span> <strong style="color:#fff;">5.000%</strong>
                                                                    </div>
                                                                    <div style="border-bottom:1px dashed #222; padding-bottom:3px;">
                                                                                                                <span style="color:#e74c3c; font-weight:bold;">🔴 Ancient Core:</span><br>
                                                                                                                <span style="color:#aaa;">Source: Camp. Boss, Camp. Rare, or Mat Pit (15+)</span><br>

                                                                                                                <!-- Campaign Boss Chance -->
                                                                                                                <div style="display:flex; justify-content:space-between; cursor:help;"
                                                                                                                     onmouseenter="window.showRatesLockTooltip(event, 'camp_core_boss')"
                                                                                                                     onmouseleave="window.hideTooltip()"
                                                                                                                     ontouchstart="window.showRatesLockTooltip(event, 'camp_core_boss')">
                                                                                                                    <span style="color:#94a3b8;">Campaign Boss Chance:</span>
                                                                                                                    <strong style="color:#e74c3c;">${nowStage >= Math.floor((window.playerStats.lifetimePeakStage || 1) * 0.8) ? "1.000%" : "🔒 Locked (Low Stage)"}</strong>
                                                                                                                </div>

                                                                                                                <!-- Campaign Rare Chance -->
                                                                                                                <div style="display:flex; justify-content:space-between; cursor:help;"
                                                                                                                     onmouseenter="window.showRatesLockTooltip(event, 'camp_core_rare')"
                                                                                                                     onmouseleave="window.hideTooltip()"
                                                                                                                     ontouchstart="window.showRatesLockTooltip(event, 'camp_core_rare')">
                                                                                                                    <span style="color:#94a3b8;">Campaign Rare Chance:</span>
                                                                                                                    <strong style="color:#e74c3c;">${nowStage >= Math.floor((window.playerStats.lifetimePeakStage || 1) * 0.8) ? "0.500%" : "🔒 Locked (Low Stage)"}</strong>
                                                                                                                </div>

                                                                                                                <!-- Dungeon Chance -->
                                                                                                                <div style="display:flex; justify-content:space-between; cursor:help;"
                                                                                                                     onmouseenter="window.showRatesLockTooltip(event, 'core')"
                                                                                                                     onmouseleave="window.hideTooltip()"
                                                                                                                     ontouchstart="window.showRatesLockTooltip(event, 'core')">
                                                                                                                    <span style="color:#94a3b8;">Dungeon Boss Chance:</span>
                                                                                                                    <strong style="color:#e74c3c;">${matFloor >= 15 ? (dCoreChance * 100).toFixed(3) + "%" : "🔒 Locked (Floor 15)"}</strong>
                                                                                                                </div>
                                                                                                            </div>
                                                                    <div style="border-bottom:1px dashed #222; padding-bottom:3px;">
                                                                        <span style="color:#8e44ad; font-weight:bold;">🔮 Eridium Shard:</span><br>
                                                                        <span style="color:#aaa;">Source: Camp. Boss (18+) or Mat Pit (60+)</span><br>

                                                                        <!-- Campaign Chance Row -->
                                                                        <div style="display:flex; justify-content:space-between; cursor:help;"
                                                                             onmouseenter="window.showRatesLockTooltip(event, 'camp_shard')"
                                                                             onmouseleave="window.hideTooltip()"
                                                                             ontouchstart="window.showRatesLockTooltip(event, 'camp_shard')">
                                                                            <span style="color:#94a3b8;">Campaign Boss Chance:</span>
                                                                            <strong style="color:#8e44ad;">${nowStage >= 18 ? (campShardChance * 100).toFixed(3) + "%" : "🔒 Locked (Stage 18)"}</strong>
                                                                        </div>

                                                                        <!-- Dungeon Chance Row -->
                                                                        <div style="display:flex; justify-content:space-between; cursor:help;"
                                                                             onmouseenter="window.showRatesLockTooltip(event, 'shard')"
                                                                             onmouseleave="window.hideTooltip()"
                                                                             ontouchstart="window.showRatesLockTooltip(event, 'shard')">
                                                                            <span style="color:#94a3b8;">Dungeon Boss Chance:</span>
                                                                            <strong style="color:#8e44ad;">${matFloor >= 60 ? (dShardChance * 100).toFixed(3) + "%" : "🔒 Locked"}</strong>
                                                                        </div>
                                                                    </div>
                                                                    <div>
                                                                        <span style="color:#f1c40f; font-weight:bold;">🔑 Gacha Key:</span><br>
                                                                        <span style="color:#aaa;">Source: Camp. Boss (50+) or Mat Pit (35+)</span><br>

                                                                        <!-- Campaign Chance Row -->
                                                                        <div style="display:flex; justify-content:space-between; cursor:help;"
                                                                             onmouseenter="window.showRatesLockTooltip(event, 'camp_key')"
                                                                             onmouseleave="window.hideTooltip()"
                                                                             ontouchstart="window.showRatesLockTooltip(event, 'camp_key')">
                                                                            <span style="color:#94a3b8;">Campaign Boss Chance:</span>
                                                                            <strong style="color:#f1c40f;">${nowStage >= 50 ? (campKeyChance * 100).toFixed(3) + "%" : "🔒 Locked (Stage 50)"}</strong>
                                                                        </div>

                                                                        <!-- Dungeon Chance Row -->
                                                                        <div style="display:flex; justify-content:space-between; cursor:help;"
                                                                             onmouseenter="window.showRatesLockTooltip(event, 'key')"
                                                                             onmouseleave="window.hideTooltip()"
                                                                             ontouchstart="window.showRatesLockTooltip(event, 'key')">
                                                                            <span style="color:#94a3b8;">Dungeon Boss Chance:</span>
                                                                            <strong style="color:#f1c40f;">${matFloor >= 35 ? (dKeyChance * 100).toFixed(3) + "%" : "🔒 Locked"}</strong>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                        </div>
                    `;

  document.getElementById("game-container").appendChild(win);
  window.makeWindowDraggable(win, document.getElementById("rates-win-handle"));
};

window.showRatesLockTooltip = function (e, lockType) {
  e.stopPropagation();
  let tt = document.getElementById("game-tooltip");
  if (!tt) return;

  let title = "";
  let desc = "";
  let color = "#e74c3c";

  if (lockType === "core") {
    title = "🔴 Ancient Cores (Dungeon)";
    desc =
      "Currently locked behind <b>Material Pit Floor 15+</b>.<br><br>Once unlocked, Material Pit Bosses have a base drop chance scaled by your current dungeon depth multiplier.";
  } else if (lockType === "camp_core_boss") {
    title = "🔴 Ancient Cores (Campaign Boss)";
    let reqStage = Math.floor(
      (window.playerStats.lifetimePeakStage || 1) * 0.8,
    );
    desc = `Campaign Bosses have a flat <b>1.00%</b> chance to drop an Ancient Core.<br><br>⚠️ To prevent low-stage speed-grinding, drops are only active when farming at or above 80% of your peak stage (<b>Stage ${reqStage}+</b>).`;
  } else if (lockType === "camp_core_rare") {
    title = "🔴 Ancient Cores (Campaign Rare)";
    let reqStage = Math.floor(
      (window.playerStats.lifetimePeakStage || 1) * 0.8,
    );
    desc = `Campaign Rare Spawns have a flat <b>0.50%</b> chance to drop an Ancient Core.<br><br>⚠️ To prevent low-stage speed-grinding, drops are only active when farming at or above 80% of your peak stage (<b>Stage ${reqStage}+</b>).`;
  } else if (lockType === "camp_shard") {
    title = "🔮 Eridium Shards (Campaign)";
    desc =
      "Currently locked behind <b>Campaign Stage 18+</b>.<br><br>Once you reach Stage 18, Campaign Bosses gain a chance to drop Eridium Shards, scaling with your stage depth quality multiplier.";
  } else if (lockType === "key") {
    title = "🔑 Gacha Keys (Dungeon)";
    desc =
      "Currently locked behind <b>Material Pit Floor 35+</b>.<br><br>Allows Gacha Key drops from Material Pit Bosses to roll randomly.";
  } else if (lockType === "shard") {
    title = "🔮 Eridium Shards (Dungeon)";
    desc =
      "Currently locked behind <b>Material Pit Floor 60+</b>.<br><br>Awakens Eridium Shard drop capability from Material Pit Bosses.";
  } else if (lockType === "camp_key") {
    title = "🔑 Gacha Keys (Campaign)";
    desc =
      "Currently locked behind <b>Campaign Stage 50+</b>.<br><br>Once unlocked, Campaign Bosses have a slim chance to drop Gacha Keys, scaled by stage depth.";
  } else if (lockType === "star4") {
    title = "⭐ 4★ Quality (Legendary)";
    desc =
      "Locked behind reaching a minimum of <b>1.5x Drop Quality</b>.<br><br>Increase your Drop Quality via unique Artifacts, Prestige upgrades, or Gold upgrades.";
  } else if (lockType === "star5") {
    title = "⭐ 5★ Quality (Mythic)";
    desc =
      "Locked behind reaching a minimum of <b>2.0x Drop Quality</b>.<br><br>Awaken your character's Drop Quality stats to open access to mythic tiers.";
  }

  tt.innerHTML = `<div style="padding: 10px; width: 220px; box-sizing: border-box;">
                        <div class="tt-title" style="color:${color};">${title}</div>
                        <div style="color:#aaa; font-size:11px; white-space:normal; line-height:1.4; margin-top:6px;">${desc}</div>
                    </div>`;
  tt.style.borderColor = color;
  tt.style.display = "block";
  window.positionTooltip(e, tt);
};

window.showMissionTooltip = function (e, missionId, isWeekly) {
  if (e && e.stopPropagation) e.stopPropagation();
  let tt = document.getElementById("game-tooltip");
  if (!tt) return;

  let missions = isWeekly
    ? window.playerStats.weeklyMissions
    : window.playerStats.dailyMissions;
  if (!missions) return;
  let m = missions.find((x) => x.id === missionId);
  if (!m) return;

  let pct = (m.current / m.target) * 100;
  let color = isWeekly ? "#9b59b6" : "#2ecc71";
  let typeLabel = isWeekly ? "Weekly Board" : "Daily Board";

  let rewardText = `+${m.treatQty} ${m.treat}`;
  if (m.potionAward) {
    rewardText += ` & 3x ${m.potionAward.replace(" Elixir", "")}`;
  }

  let html = `
    <div style="padding: 10px; width: 230px; box-sizing: border-box;">
        <div class="tt-title" style="color:${color};">${typeLabel} Objective</div>
        <div style="color:#fff; font-size:11.5px; font-weight:bold; margin-bottom:6px; white-space:normal; line-height:1.45;">${m.desc}</div>
        <div style="margin-top:6px; border-top:1px dashed #444; padding-top:6px; font-family:monospace; font-size:10px; line-height:1.4;">
                    <div class="tt-stat-line" style="color:#aaa;">Progress: <strong style="color:#fff;">${m.current.toLocaleString()} / ${m.target.toLocaleString()} (${Math.min(100, pct).toFixed(1)}%)</strong></div>
                    <div class="tt-stat-line" style="color:#aaa;">Reward: <strong style="color:#f1c40f;">${rewardText}</strong> & <strong style="color:#2ecc71;">+1 QP</strong></div>
                </div>
    </div>
  `;

  tt.style.borderColor = color;
  tt.innerHTML = html;
  tt.style.display = "block";
  window.positionTooltip(e, tt);
};

window.showRiftRewardBreakdownTooltip = function (e, lvl) {
  if (e && e.stopPropagation) e.stopPropagation();
  let tt = document.getElementById("game-tooltip");
  if (!tt) return;

  // Track coordinates for seamless live updating
  if (e && e.clientX !== undefined) {
    window.lastRiftTooltipEvent = e;
  }

  let minStars = Math.min(5, Math.floor(lvl / 4));
  let keys = 1 + Math.floor(lvl / 10);
  let shards = 1 + Math.floor(lvl / 3);

  let coresMin = Math.floor(lvl / 5);
  let coresMax = coresMin;
  if (lvl % 5 > 0) coresMax++;

  let essenceMin = Math.floor(lvl / 6);
  let essenceMax = essenceMin;
  if (lvl % 6 > 0) essenceMax++;

  let legendary = Math.floor(lvl / 2);
  let mythic = Math.floor(lvl / 3);

  let starsName = window.getTierName(minStars);
  let starsColor = window.getTierColor(minStars);

  let html = `
    <div style="padding: 12px; width: 250px; box-sizing: border-box; font-family: sans-serif;">
        <div class="tt-title" style="color:#9b59b6; font-size:12px; font-weight:bold; margin-bottom:4px; border-bottom:1px solid #333; padding-bottom:4px;">🌌 Rift Level ${lvl} Payouts</div>
        <div class="tt-subtitle" style="margin-bottom:8px; color:#aaa; font-size:10px; font-style: italic;">Scaling reward projections for this Tier:</div>
        <div style="display:flex; flex-direction:column; gap:4px; font-size:11px; font-family: monospace;">
            <div class="tt-stat-line" style="color:#fff;">• 👑 Min Quality: <strong style="color:${starsColor};">${starsName} (${minStars}★)</strong></div>
            <div class="tt-stat-line" style="color:#fff;">• 🔑 Gacha Keys: <strong style="color:#f1c40f;">x${keys}</strong></div>
            <div class="tt-stat-line" style="color:#fff;">• 🔮 Eridium Shards: <strong style="color:#8e44ad;">x${shards}</strong></div>
            <div class="tt-stat-line" style="color:#fff;">• 🔋 Catalyst Cores: <strong style="color:#2ecc71;">x${coresMin === coresMax ? coresMin : coresMin + "-" + coresMax}</strong></div>
            <div class="tt-stat-line" style="color:#fff;">• 🌌 Astral Essence: <strong style="color:#9b59b6;">x${essenceMin === essenceMax ? essenceMin : essenceMin + "-" + essenceMax}</strong></div>
            <div class="tt-stat-line" style="color:#fff;">• 🟨 Legendary Scraps: <strong style="color:#f1c40f;">x${legendary}</strong></div>
            <div class="tt-stat-line" style="color:#fff;">• 🟥 Mythic Scraps: <strong style="color:#e74c3c;">x${mythic}</strong></div>
        </div>
        <div style="margin-top:8px; border-top:1px dashed #444; padding-top:6px; font-size:9.5px; color:#7f8c8d; line-height:1.35; white-space:normal; font-family:sans-serif;">
            Defeating this Rift Guardian guarantees equipment of the listed minimum quality or higher.
        </div>
    </div>
  `;
  tt.style.borderColor = "#9b59b6";
  tt.innerHTML = html;
  tt.style.display = "block";
  if (window.lastRiftTooltipEvent) {
    window.positionTooltip(window.lastRiftTooltipEvent, tt);
  }
};

window.makeWindowDraggable = function (el, handle) {
  if (!el || !handle) return;

  handle.style.touchAction = "none";
  el.style.touchAction = "none";

  let contentEl = el.querySelector(".draggable-content");
  if (contentEl) {
    contentEl.style.touchAction = "pan-y";
  }

  let isDragging = false;
  let startX = 0;
  let startY = 0;
  let initialLeft = 0;
  let initialTop = 0;

  const dragStart = (clientX, clientY) => {
    isDragging = true;
    startX = clientX;
    startY = clientY;
    initialLeft = el.offsetLeft;
    initialTop = el.offsetTop;
  };

  const dragMove = (clientX, clientY) => {
                  if (!isDragging) return;

                  let dx = clientX - startX;
                  let dy = clientY - startY;

                  let newLeft = initialLeft + dx;
                  let newTop = initialTop + dy;

                  let maxLeft = window.innerWidth - 40;
                  let maxTop = window.innerHeight - 40;
                  if (el.id === "premium-chat-drawer") {
                    maxLeft = window.innerWidth - el.offsetWidth - 10;
                    maxTop = window.innerHeight - el.offsetHeight - 10;
                  }

                  newLeft = Math.max(el.id === "premium-chat-drawer" ? 10 : -el.offsetWidth + 40, Math.min(maxLeft, newLeft));
                  newTop = Math.max(el.id === "premium-chat-drawer" ? 10 : 0, Math.min(maxTop, newTop));

                  el.style.left = newLeft + "px";
                  el.style.top = newTop + "px";
                };

                const dragEnd = () => {
                  isDragging = false;
                  if (el.id === "premium-chat-drawer") {
                    window.playerStats.chatX = el.offsetLeft;
                    window.playerStats.chatY = el.offsetTop;
                    if (typeof window.saveGame === "function") window.saveGame();
                  }
                };

  handle.addEventListener("pointerdown", function (e) {
                  if (e.pointerType === "mouse" && e.button !== 0) return; // Only process left click
    if (
      e.target.closest("button") ||
      e.target.closest("input") ||
      e.target.closest("select") ||
      e.target.closest("option")
    ) {
      return;
    }
    dragStart(e.clientX, e.clientY);
    try {
      handle.setPointerCapture(e.pointerId);
    } catch (err) {}
    e.stopPropagation();
    e.preventDefault();
  });

  handle.addEventListener("pointermove", function (e) {
    if (!isDragging) return;
    dragMove(e.clientX, e.clientY);
    e.stopPropagation();
    e.preventDefault();
  });

  const stopDrag = function (e) {
    if (isDragging) {
      dragEnd();
      try {
        handle.releasePointerCapture(e.pointerId);
      } catch (err) {}
      e.stopPropagation();
      e.preventDefault();
    }
  };

  handle.addEventListener("pointerup", stopDrag);
  handle.addEventListener("pointercancel", stopDrag);

  // Responsive Touch fallback handlers for flawless Android/iOS WebView dragging
  handle.addEventListener(
    "touchstart",
    function (e) {
      if (
        e.target.closest("button") ||
        e.target.closest("input") ||
        e.target.closest("select") ||
        e.target.closest("option")
      ) {
        return;
      }
      if (e.touches && e.touches[0]) {
        dragStart(e.touches[0].clientX, e.touches[0].clientY);
      }
      e.stopPropagation();
    },
    { passive: false },
  );

  handle.addEventListener(
    "touchmove",
    function (e) {
      if (!isDragging) return;
      if (e.touches && e.touches[0]) {
        dragMove(e.touches[0].clientX, e.touches[0].clientY);
      }
      e.stopPropagation();
      e.preventDefault();
    },
    { passive: false },
  );

  handle.addEventListener(
    "touchend",
    function (e) {
      if (isDragging) {
        dragEnd();
        e.stopPropagation();
      }
    },
    { passive: false },
  );
};

// --- ALTAR NATIVE CAROUSEL RENDER ENGINE ---
window.altarSlideIndex = 0;

window.renderCrucibleTab = function () {
  let sec = document.getElementById("activities-sec-crucible");
  if (!sec) return;

  let isCrucibleActive = window.playerStats.isCrucibleMode;

  if (isCrucibleActive) {
    let wave = window.playerStats.crucibleWave || 1;
    let deck = window.playerStats.crucibleDraftDeck || [];
    let gold = window.playerStats.crucibleAccumulatedGold || 0;
    let xp = window.playerStats.crucibleAccumulatedXp || 0;
    let shards = window.playerStats.crucibleAccumulatedShards || 0;
    let cores = window.playerStats.crucibleAccumulatedCores || 0;

    // Check if our active container is already rendered to prevent scroll snapping
    let activeContainer = document.getElementById("crucible-active-run-panel");
    if (activeContainer) {
      // Just update the dynamic values inside the existing DOM structure
      let waveEl = document.getElementById("crucible-run-wave-badge");
      if (waveEl) waveEl.innerText = `Wave ${wave}`;

      let shardsEl = document.getElementById("crucible-run-shards");
      if (shardsEl) shardsEl.innerText = `+${shards}`;

      let coresEl = document.getElementById("crucible-run-cores");
      if (coresEl) coresEl.innerText = `+${cores}`;

      let goldEl = document.getElementById("crucible-run-gold");
      if (goldEl) goldEl.innerText = `+${window.formatNumber(gold)}`;

      let xpEl = document.getElementById("crucible-run-xp");
      if (xpEl) xpEl.innerText = `+${window.formatNumber(xp)}`;

      // Update deck list only if count/structure changes to avoid rebuilding scroll areas
      let deckListEl = document.getElementById("crucible-run-deck-list");
      if (deckListEl) {
        // Group and count duplicate card draft picks
        let groupedDeck = {};
        deck.forEach((cardId) => {
          groupedDeck[cardId] = (groupedDeck[cardId] || 0) + 1;
        });
        let groupedKeys = Object.keys(groupedDeck);
        let currentChildCount = deckListEl.children.length;

        if (currentChildCount !== groupedKeys.length) {
          deckListEl.innerHTML = groupedKeys
            .map((cardId) => {
              let card = window.CRUCIBLE_DRAFT_POOL.find(
                (c) => c.id === cardId,
              );
              if (!card) return "";
              let count = groupedDeck[cardId];
              let countBadge =
                count > 1
                  ? ` <span style="color:#f1c40f; font-weight:bold;">x${count}</span>`
                  : "";

              // Calculate combined stats text for duplicates
              let descText = card.desc;
              if (count > 1) {
                if (cardId === "overcharge") {
                  descText = `+${20 * count}% Crit Multiplier, +${2.5 * count}% Crit Chance`;
                } else if (cardId === "sanguine_tide") {
                  descText = `Heal ${(1.5 * count).toFixed(1)}% Max HP on every Critical Strike hit`;
                } else if (cardId === "phantom_echo") {
                  descText = `+${15 * count}% chance to trigger secondary Phantom Strike (deals 35% damage)`;
                } else if (cardId === "titans_wall") {
                  descText = `+${3 * count}% base armor and +${3 * count}% Block/Parry cap limits`;
                } else if (cardId === "temporal_accel") {
                  descText = `+${15 * count}% Active & Idle Attack Speed multipliers`;
                } else if (cardId === "astral_attune") {
                  descText = `Earn +${25 * count}% Astral Shards from this run`;
                } else if (cardId.startsWith("slot_")) {
                  descText = `+${15 * count}% to all stats of the equipped slot for this run`;
                }
              }

              return `
              <div style="background:#110d1c; border:1px solid #9b59b6; border-radius:6px; padding:6px 10px; text-align:left; font-size:11px;">
                <strong style="color:#df9ffb; display:block; font-size:11px;">🛠️ ${card.name}${countBadge}</strong>
                <span style="font-size:9.5px; color:#ccc; display:block; margin-top:2px;">${descText}</span>
              </div>
            `;
            })
            .join("");
        }
      }
      return;
    }

    // If not rendered yet, build the base structure (runs only once upon entering)
    let groupedDeck = {};
    deck.forEach((cardId) => {
      groupedDeck[cardId] = (groupedDeck[cardId] || 0) + 1;
    });
    let deckHtml = Object.keys(groupedDeck)
      .map((cardId) => {
        let card = window.CRUCIBLE_DRAFT_POOL.find((c) => c.id === cardId);
        if (!card) return "";
        let count = groupedDeck[cardId];
        let countBadge =
          count > 1
            ? ` <span style="color:#f1c40f; font-weight:bold;">x${count}</span>`
            : "";

        let descText = card.desc;
        if (count > 1) {
          if (cardId === "overcharge") {
            descText = `+${20 * count}% Crit Multiplier, +${2.5 * count}% Crit Chance`;
          } else if (cardId === "sanguine_tide") {
            descText = `Heal ${(1.5 * count).toFixed(1)}% Max HP on every Critical Strike hit`;
          } else if (cardId === "phantom_echo") {
            descText = `+${15 * count}% chance to trigger secondary Phantom Strike (deals 35% damage)`;
          } else if (cardId === "titans_wall") {
            descText = `+${3 * count}% base armor and +${3 * count}% Block/Parry cap limits`;
          } else if (cardId === "temporal_accel") {
            descText = `+${15 * count}% Active & Idle Attack Speed multipliers`;
          } else if (cardId === "astral_attune") {
            descText = `Earn +${25 * count}% Astral Shards from this run`;
          } else if (cardId.startsWith("slot_")) {
            descText = `+${15 * count}% to all stats of the equipped slot for this run`;
          }
        }

        return `
        <div style="background:#110d1c; border:1px solid #9b59b6; border-radius:6px; padding:6px 10px; text-align:left; font-size:11px;">
          <strong style="color:#df9ffb; display:block; font-size:11px;">🛠️ ${card.name}${countBadge}</strong>
          <span style="font-size:9.5px; color:#ccc; display:block; margin-top:2px;">${descText}</span>
        </div>
      `;
      })
      .join("");

    sec.innerHTML = `
      <div id="crucible-active-run-panel" style="
        background: radial-gradient(
          circle at 50% 25%,
          rgba(155, 89, 182, 0.15) 0%,
          #0c0812 100%
        );
        border: 2px solid #9b59b6;
        border-radius: 12px;
        padding: 16px;
        text-align: center;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.8);
        position: relative;
        max-width: 580px;
        margin: 6px auto;
      ">
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1.5px solid #9b59b644; padding-bottom:6px; margin-bottom:10px;">
          <strong style="color:#df9ffb; font-size:13px; text-transform:uppercase; letter-spacing:0.5px;">🔮 Crucible Active Run</strong>
          <span id="crucible-run-wave-badge" style="background:rgba(155,89,182,0.15); border:1px solid #9b59b6; color:#df9ffb; font-size:10px; font-weight:bold; padding:2px 10px; border-radius:10px; font-family:monospace;">Wave ${wave}</span>
        </div>

        <!-- Run Rewards Accumulated Panel -->
        <div style="background: rgba(0,0,0,0.55); border: 1.5px solid #9b59b680; border-radius: 8px; padding: 10px; margin: 0 auto 12px auto; display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; font-family: monospace; font-size: 10px; text-align: center; box-shadow: inset 0 0 10px #000;">
          <div style="background:#07030b; padding:4px; border-radius:4px; border:1px solid #222;">
            <span style="color:#888; display:block; font-size:8px; text-transform:uppercase;">Shards</span>
            <strong id="crucible-run-shards" style="color:#df9ffb; font-size:11px;">+${shards}</strong>
          </div>
          <div style="background:#07030b; padding:4px; border-radius:4px; border:1px solid #222;">
            <span style="color:#888; display:block; font-size:8px; text-transform:uppercase;">Cores</span>
            <strong id="crucible-run-cores" style="color:#2ecc71; font-size:11px;">+${cores}</strong>
          </div>
          <div style="background:#07030b; padding:4px; border-radius:4px; border:1px solid #222;">
            <span style="color:#888; display:block; font-size:8px; text-transform:uppercase;">Gold</span>
            <strong id="crucible-run-gold" style="color:#f1c40f; font-size:11px;">+${window.formatNumber(gold)}</strong>
          </div>
          <div style="background:#07030b; padding:4px; border-radius:4px; border:1px solid #222;">
            <span style="color:#888; display:block; font-size:8px; text-transform:uppercase;">XP</span>
            <strong id="crucible-run-xp" style="color:#a855f7; font-size:11px;">+${window.formatNumber(xp)}</strong>
          </div>
        </div>

        <!-- Active Infusions Deck List -->
        <div style="text-align:left; margin-bottom:12px;">
          <strong style="color:#df9ffb; font-size:11px; display:block; margin-bottom:6px; text-transform:uppercase; letter-spacing:0.5px;">🎴 Active Infusions Deck:</strong>
          <div id="crucible-run-deck-list" style="display:flex; flex-direction:column; gap:6px; max-height:160px; overflow-y:auto; padding-right:4px;">
            ${deckHtml || `<div style="font-size:10px; color:#888; font-style:italic; padding: 10px; text-align:center; width:100%;">No active infusions drafted yet. Clear waves to pick cards!</div>`}
          </div>
        </div>

        <!-- Retreat / Safe Claim Control -->
        <div style="border-top: 1px dashed #4a154b; padding-top:12px; margin-top:6px;">
          <button class="btn-action un" style="width:100%; font-weight:bold; padding:10px; font-size:11.5px; letter-spacing:0.5px; background:linear-gradient(135deg, #c0392b, #962d22);" onclick="window.leaveActivity()">
              🛡️ Safe Retreat & Claim (100% Rewards)
          </button>
          <span style="font-size:9px; color:#aaa; display:block; margin-top:5px; line-height:1.3;">Retreating now secures 100% of all accumulated Shards, Cores, Gold, and XP. Suffer defeat and only 20% of Shards/Cores are salvaged!</span>
        </div>
      </div>
    `;
  } else {
    // Restore starting lobby display
    let peak = window.playerStats.cruciblePeak || 1;
    let soulsOwned = window.inventory.ETC["Monster Soul"] || 0;
    let peakLvl = window.playerStats.lifetimePeakStage || 1;
    let startingStageOffset = Math.max(1, Math.floor(peakLvl * 0.75));

    sec.innerHTML = `
      <div style="
        background: radial-gradient(
          circle at 50% 25%,
          rgba(155, 89, 182, 0.15) 0%,
          #0c0812 100%
        );
        border: 2px solid #9b59b6;
        border-radius: 12px;
        padding: 20px;
        text-align: center;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.8);
        position: relative;
        max-width: 580px;
        margin: 6px auto;
      ">
        <div style="margin-bottom: 10px; display: flex; justify-content: center; align-items: center;">
          <svg width="56" height="56" viewBox="0 0 32 32" style="filter: drop-shadow(0 0 8px #9b59b6)">
            <path d="M16 2 L2 22h28L16 2z" fill="rgba(155, 89, 182, 0.15)" stroke="#9b59b6" stroke-width="2.5" stroke-linejoin="round" />
            <circle cx="16" cy="15" r="4.5" fill="#fff" stroke="#8e44ad" stroke-width="1.5" />
          </svg>
        </div>
        <h3 style="margin: 0 0 4px 0; color: #df9ffb; font-size: 17px; font-weight: bold; letter-spacing: 1px; text-transform: uppercase;">
          Astral Survival Crucible
        </h3>
        <span style="font-size: 10px; color: #aaa; text-transform: uppercase; letter-spacing: 0.5px;">Endless Gladiatorial Wave Combat</span>

        <div style="font-size: 11.5px; color: #cbd5e1; max-width: 440px; margin: 14px auto; line-height: 1.55; white-space: normal;">
          Test your build against a limitless celestial onslaught. Surviving waves awards valuable <strong style="color: #9b59b6">Astral Shards</strong> and drops <strong style="color: #2ecc71">Catalyst Cores</strong> to re-roll equipment modifiers!
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; max-width: 360px; margin: 18px auto;">
          <div style="background: rgba(0, 0, 0, 0.55); border: 1px solid #4a154b; border-radius: 8px; padding: 10px;">
            <span style="font-size: 9.5px; color: #aaa; text-transform: uppercase; display: block; margin-bottom: 2px;">Starting Scale</span>
            <strong style="font-size: 16px; color: #df9ffb; font-family: monospace;" id="tab-crucible-checkpoint-wave">Stage ${startingStageOffset}</strong>
          </div>
          <div style="background: rgba(0, 0, 0, 0.55); border: 1px solid #4a154b; border-radius: 8px; padding: 10px;">
            <span style="font-size: 9.5px; color: #aaa; text-transform: uppercase; display: block; margin-bottom: 2px;">Peak Wave</span>
            <strong style="font-size: 16px; color: #df9ffb; font-family: monospace;" id="tab-crucible-peak-wave">${peak}</strong>
          </div>
        </div>

        <div style="border-top: 1px dashed #4a154b; max-width: 400px; margin: 0 auto; padding-top: 14px;">
          <div style="display: flex; justify-content: space-between; font-size: 11px; color: #bdc3c7; font-family: monospace; max-width: 280px; margin: 0 auto 12px auto;">
            <span>Monster Souls: <strong style="color: #9b59b6" id="tab-etc-souls">${soulsOwned.toLocaleString()}</strong></span>
            <span>Entry Cost: <strong style="color: #f1c40f">100 Souls</strong></span>
          </div>
          <button onclick="window.enterCrucible()" class="btn-action btn-pulse" style="background: linear-gradient(135deg, #9b59b6, #8e44ad); width: 100%; max-width: 280px; padding: 11px; font-size: 12px; font-weight: bold; border-radius: 8px; border: 1px solid #fff; box-shadow: 0 4px 15px rgba(155, 89, 182, 0.4); text-transform: uppercase; letter-spacing: 0.5px;">
            COMMENCE PURGE
          </button>
        </div>
      </div>
    `;
  }
};

window.renderAltarTab = function () {
  let sec = document.getElementById("runs-sec-altar");
  if (!sec) return;

  let isRiftActive = !!window.playerStats.activeRift;
  let activeLvl = window.playerStats.activeRiftLevel || 1;
  let selectedLvl = window.riftSelectedLevel;
  let maxLvl = (window.playerStats.highestRiftLevel || 0) + 5;
  let coresOwned = window.inventory.ETC["Ancient Core"] || 0;

  let lvlSelectorHtml = "";
  if (isRiftActive) {
    lvlSelectorHtml = `
                            <div style="background:rgba(231,76,60,0.1); border:1px dashed #e74c3c; border-radius:6px; padding:10px; margin-bottom:12px; text-align:center;">
                                <strong style="color:#e74c3c; font-size:11.5px;">⚠️ RIFT ACTIVE (LEVEL ${activeLvl})</strong><br>
                                <span style="font-size:10px; color:#aaa;">The Rift is locked. Slay or Collapse it to adjust level.</span>
                            </div>
                        `;
  } else {
    lvlSelectorHtml = `
                              <div style="background:rgba(155, 89, 182, 0.1); border:1px solid #4a154b; border-radius:6px; padding:10px; margin-bottom:12px; display:flex; justify-content:space-between; align-items:center; cursor:help;" onmouseenter="window.showRiftRewardBreakdownTooltip(event, ${selectedLvl})" onmouseleave="window.hideTooltip()" ontouchstart="window.showRiftRewardBreakdownTooltip(event, ${selectedLvl})">
                                  <div>
                                      <strong style="color:#df9ffb; font-size:11.5px; display:block;">CHOOSE RIFT TIER / LEVEL: ⓘ</strong>
                                      <span style="font-size:10px; color:#aaa;">Max Unlocked: Level ${maxLvl}</span>
                                  </div>
                                  <div style="display:flex; align-items:center; gap:6px;" onclick="event.stopPropagation();">
                                      <button class="btn-action" style="padding:4px 10px; background:#4a154b;" onclick="window.changeAltarRiftLevel(-1)">-</button>
                                      <strong style="font-size:14px; font-family:monospace; min-width:30px; text-align:center; color:#fff;">${selectedLvl}</strong>
                                      <button class="btn-action" style="padding:4px 10px; background:#4a154b;" onclick="window.changeAltarRiftLevel(1)">+</button>
                                  </div>
                              </div>
                          `;
  }

  let slidesHtml = window.riftBossesMetadata
    .map((boss, idx) => {
      let lvl = isRiftActive ? activeLvl : selectedLvl;
      let equivalentStage = 50 + lvl * 10;
      let effStage = window.getEffectiveStage(equivalentStage);
      let gRate = 1.045 + (effStage * 0.04) / (effStage + 200);
      let rScale = Math.pow(gRate, effStage);

      let defVal = Math.floor(boss.defMult * rScale);
      let hpVal = Math.floor(boss.hpMult * (60 * rScale) * (1 + defVal / 100)); // True Effective Health
      let dmgVal = Math.floor(20 * rScale * boss.dmgMult);

      let lootHtml = boss.artifacts
        .map((art) => {
          let artDetails = window.ARTIFACT_POOL.find(
            (a) => a.name === art.name,
          );
          let trait = artDetails ? artDetails.trait : art.trait;
          return `
                                                    <div class="rift-loot-icon" onmouseenter="window.showDummyArtifact(event, '${trait}')" ontouchstart="window.showDummyArtifact(event, '${trait}')" onmouseleave="window.hideTooltip()">
                                                        <span>${window.getArtifactIconHtml(trait, 28)}</span>
                                                    </div>
                                                `;
        })
        .join("");

      return `
                                                <div class="rift-slide">
                                                    <div style="text-align:center;">
                                                        <div style="margin: 8px 0;">${window.getBossIconHtml(boss.type)}</div>
                                                        <div class="rift-boss-badge" style="border-color:#9b59b6; background:rgba(155, 89, 182, 0.15); color:#df9ffb;">${boss.name}</div>
                                                        <div style="font-style:italic; font-size:10.5px; color:#aaa; margin-bottom:8px;">"${boss.title}"</div>
                                                    </div>
                                <div style="font-size:11px; color:#ddd; line-height:1.4; text-align:center; padding: 0 10px; margin-bottom:10px; min-height:34px; white-space:normal;">
                                    ${boss.desc}
                                </div>
                                <div class="rift-stats-display">
                                    <div class="rift-stat-box" style="background:rgba(15, 7, 25, 0.6); border:1px solid #4a154b;"><span>❤️ Life</span><strong>${window.formatNumber(hpVal)}</strong></div>
                                    <div class="rift-stat-box" style="background:rgba(15, 7, 25, 0.6); border:1px solid #4a154b;"><span>⚔️ Attack</span><strong>${window.formatNumber(dmgVal)}</strong></div>
                                    <div class="rift-stat-box" style="background:rgba(15, 7, 25, 0.6); border:1px solid #4a154b;"><span>🛡️ Armor</span><strong>${window.formatNumber(defVal)}</strong></div>
                                </div>
                                <div style="background:rgba(0,0,0,0.45); border:1px dashed #4a154b; padding:8px 10px; border-radius:4px; font-size:10px; line-height:1.4; text-align:left; margin-bottom:10px; white-space:normal;">
                                    <strong style="color:#e74c3c;">💡 STRATEGY:</strong> ${boss.strategy}
                                </div>
                                <div>
                                    <div style="font-size:9.5px; font-weight:bold; color:#ff007f; text-transform:uppercase; text-align:center; margin-bottom:4px; letter-spacing:0.5px;">💎 Potential Artifact Drops</div>
                                    <div class="rift-loot-preview">${lootHtml}</div>
                                </div>
                            </div>
                        `;
    })
    .join("");

  let dotsHtml = window.riftBossesMetadata
    .map(
      (b, idx) => `
                        <div class="rift-dot ${idx === window.altarSlideIndex ? "active" : ""}" onclick="window.setAltarSlide(${idx})"></div>
                    `,
    )
    .join("");

  let actionBtnHtml = "";
  if (isRiftActive) {
    let activeBossMeta =
      window.riftBossesMetadata.find(
        (b) => b.type === window.playerStats.activeRift,
      ) || window.riftBossesMetadata[0];
    actionBtnHtml = `
                            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
                                <button class="btn-action un" style="font-weight:bold; padding:12px; font-size:11.5px;" onclick="window.executeAbandonRiftConsole()">⚠️ Collapse Rift</button>
                                <button class="btn-action" style="background:#e74c3c; font-weight:bold; padding:12px; font-size:11.5px;" onclick="window.executeAltarSummon(true)">⚔️ Re-enter Fight</button>
                            </div>
                        `;
  } else {
    let canAfford = coresOwned >= 1;
    let costColor = canAfford ? "#2ecc71" : "#e74c3c";
    actionBtnHtml = `
                            <div style="display:flex; flex-direction:column; gap:8px;">
                                <div style="display:flex; justify-content:space-between; font-size:11px; color:#aaa; font-family:monospace; padding:0 4px;">
                                    <span>Cores Owned: <strong style="color:${coresOwned >= 1 ? "#2ecc71" : "#e74c3c"};">${coresOwned} / 1</strong></span>
                                    <span>Summon Cost: <strong style="color:#ff007f;">1 Core</strong></span>
                                </div>
                                <button class="btn-action" style="background:#9b59b6; width:100%; font-weight:bold; padding:12px; font-size:11.5px; letter-spacing:0.5px;" ${canAfford ? "" : 'disabled style="opacity:0.5; cursor:not-allowed;"'} onclick="window.executeAltarSummon()">🔮 COMMENCE SUMMONING</button>
                            </div>
                        `;
  }

  let highestRiftText = `🏆 Highest Rift Cleared: Level ${window.playerStats.highestRiftLevel || 0}`;

  sec.innerHTML = `
                          <div class="market-card" style="border-color: #9b59b6; background: #0d0615; text-align: left; padding: 15px; border-radius: 8px;">
                              <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #333; padding-bottom:8px; margin-bottom:10px;">
                                  <h3 style="margin:0; color:#9b59b6; font-size:14px; display:flex; align-items:center; gap:6px; width:100%; justify-content:center;">🔮 ANCIENT ALTAR</h3>
                              </div>

                              ${lvlSelectorHtml}

                            <div class="rift-carousel-container" style="margin-top: 10px; margin-bottom: 10px;">
                                            ${
                                              isRiftActive
                                                ? ""
                                                : `
                                                <button class="carousel-arrow prev" onclick="window.changeAltarSlide(-1)">◀</button>
                                                <button class="carousel-arrow next" onclick="window.changeAltarSlide(1)">▶</button>
                                            `
                                            }
                                            <div class="rift-carousel-track" id="altar-carousel-track" style="transform: translate3d(-${window.altarSlideIndex * 33.333}%, 0, 0); width: 300%;">
                                                ${slidesHtml}
                                            </div>
                                        </div>

                            ${isRiftActive ? "" : `<div class="rift-dots" style="margin-bottom: 10px;">${dotsHtml}</div>`}

                            <span id="highest-rift-cleared-text" style="display:block; font-size:10.5px; color:#f1c40f; font-weight:bold; text-align:center; margin-bottom:12px;">${highestRiftText}</span>

                            <div style="margin-top: 15px;">
                                ${actionBtnHtml}
                            </div>
                        </div>
                    `;

  // Configure Touch Drag Swipe handlers for the newly isolated Altar sub-tab
  let track = document.getElementById("altar-carousel-track");
  if (track && !isRiftActive) {
    let startX = 0,
      currentX = 0,
      isDragging = false;
    track.addEventListener(
      "touchstart",
      (e) => {
        startX = e.touches[0].clientX;
        isDragging = true;
      },
      { passive: true },
    );
    track.addEventListener(
      "touchmove",
      (e) => {
        if (!isDragging) return;
        currentX = e.touches[0].clientX;
      },
      { passive: true },
    );
    track.addEventListener("touchend", (e) => {
      if (!isDragging) return;
      isDragging = false;
      let diffX = startX - currentX;
      if (Math.abs(diffX) > 40) {
        if (diffX > 0) window.changeAltarSlide(1);
        else window.changeAltarSlide(-1);
      }
    });
  }
};

window.changeAltarRiftLevel = function (direction) {
  let maxLvl = (window.playerStats.highestRiftLevel || 0) + 5;
  let newLvl = window.riftSelectedLevel + direction;
  let minLvl = Math.max(1, window.playerStats.highestRiftLevel || 1);
  if (newLvl < minLvl) newLvl = minLvl;
  if (newLvl > maxLvl) newLvl = maxLvl;
  window.riftSelectedLevel = newLvl;
  window.renderAltarTab();

  let tt = document.getElementById("game-tooltip");
  if (tt && tt.style.display === "block") {
    window.showRiftRewardBreakdownTooltip(null, newLvl);
  }
};

window.changeAltarSlide = function (direction) {
  if (window.playerStats.activeRift) return;
  let newIndex = window.altarSlideIndex + direction;
  if (newIndex < 0) newIndex = window.riftBossesMetadata.length - 1;
  if (newIndex >= window.riftBossesMetadata.length) newIndex = 0;
  window.altarSlideIndex = newIndex;
  window.renderAltarTab();
};

window.setAltarSlide = function (idx) {
  if (window.playerStats.activeRift) return;
  window.altarSlideIndex = idx;
  window.renderAltarTab();
};

window.executeAltarSummon = function (isReentry = false) {
  if (
    !isReentry &&
    (window.playerStats.isDungeonMode ||
      window.playerStats.isCrucibleMode ||
      window.playerStats.isPrestigeBossMode ||
      window.playerStats.isUberBoss)
  ) {
    window.pushHeaderToast(
      "Cannot summon: already in another activity!",
      "#e74c3c",
    );
    return;
  }
  let cores = window.inventory.ETC["Ancient Core"] || 0;
  let boss = window.riftBossesMetadata[window.altarSlideIndex];
  let lvl = isReentry
    ? window.playerStats.activeRiftLevel || 1
    : window.riftSelectedLevel;

  if (!isReentry) {
    if (cores < 1) return;
    window.inventory.ETC["Ancient Core"]--;
    if (window.inventory.ETC["Ancient Core"] === 0)
      delete window.inventory.ETC["Ancient Core"];
    window.playerStats.activeRift = boss.type;
    window.playerStats.activeRiftLevel = lvl;
  }

  let actualBossType = isReentry ? window.playerStats.activeRift : boss.type;

  window.playerStats.isBossMode = true;
  window.playerStats.isUberBoss = true;
  window.playerStats.currentUberBoss = actualBossType;
  window.playerStats.killCount = 0;
  window.playerStats.targetsRequired = 1;
  window.mob = null;

  let p = window.resolvePlayerStats();
  window.playerStats.currentHp = p.maxHp;

  if (isReentry) {
    window.pushLog(
      `<span style='color:#9b59b6; font-weight:bold;'>[RIFT SUMMON] Re-entering Level ${lvl} Rift for ${boss.name}!</span>`,
    );
  } else {
    window.pushLog(
      `<span style='color:#9b59b6; font-weight:bold;'>[RIFT SUMMON] The Altar consumes 1 Ancient Core! A Level ${lvl} Rift for ${boss.name} forms...</span>`,
    );
  }

  window.setPauseState(false);
  window.updateUI();
  window.renderAltarTab();
  window.saveGame();
};

// --- INTERACTIVE RETRO GACHA CONTROLLER ---
window.gachaActiveState = "idle";

window.gachaSelectedMode = window.gachaSelectedMode || "standard"; // "standard" or "glimmering"

window.openGachaModal = function () {
  let overlay = document.getElementById("gacha-modal-overlay");
  if (overlay) overlay.remove();

  window.hideTooltip();
  window.setPauseState(true);

  overlay = document.createElement("div");
  overlay.id = "gacha-modal-overlay";
  document.body.appendChild(overlay);

  window.gachaActiveState = "idle";
  window.renderGachaModal();
};

window.renderGachaModal = function () {
  let overlay = document.getElementById("gacha-modal-overlay");
  if (!overlay) return;

  let mode = window.gachaSelectedMode;
  let isGlim = mode === "glimmering";

  let standardKeys = window.inventory.ETC["Gacha Key"] || 0;
  let glimmeringKeys = window.inventory.ETC["Glimmering Gachapon Key"] || 0;

  let pityProgress = isGlim
    ? window.playerStats.glimmeringPity || 0
    : window.playerStats.vendingPity || 0;
  let maxPity = isGlim ? 25 : 50;

  // Set up thematic capsule colors
  let ballsColors = isGlim
    ? ["#00d2ff", "#ff007f", "#9b59b6", "#a855f7", "#ffffff"]
    : ["#e74c3c", "#f1c40f", "#3498db", "#9b59b6", "#2ecc71", "#e67e22"];

  let ballsHtml = "";
  for (let i = 0; i < 22; i++) {
    let left = 20 + Math.random() * 240;
    let bottom = 5 + Math.random() * 30;
    let rot = Math.random() * 360;
    let col = ballsColors[Math.floor(Math.random() * ballsColors.length)];

    let tx1 = Math.random() * 240 + 20 - left;
    let ty1 = -(Math.random() * 80 + 40 - bottom);
    let tx2 = Math.random() * 240 + 20 - left;
    let ty2 = -(Math.random() * 110 + 20 - bottom);
    let tx3 = Math.random() * 240 + 20 - left;
    let ty3 = -(Math.random() * 80 + 40 - bottom);
    let tx4 = Math.random() * 240 + 20 - left;
    let ty4 = -(Math.random() * 110 + 20 - bottom);
    let tx5 = Math.random() * 240 + 20 - left;
    let ty5 = -(Math.random() * 60 + 5 - bottom);
    let tx6 = Math.random() * 240 + 20 - left;
    let ty6 = -(Math.random() * 20 + 0 - bottom);

    let animDelay = -(Math.random() * 0.8).toFixed(2);
    let animDuration = (0.7 + Math.random() * 0.4).toFixed(2);

    ballsHtml += `
        <div class="gacha-ball-pile" style="
            left: ${left}px; bottom: ${bottom}px;
            transform: rotate(${rot}deg);
            background: linear-gradient(180deg, ${col} 50%, #ffffff 50%);
            --tx1: ${tx1}px; --ty1: ${ty1}px;
            --tx2: ${tx2}px; --ty2: ${ty2}px;
            --tx3: ${tx3}px; --ty3: ${ty3}px;
            --tx4: ${tx4}px; --ty4: ${ty4}px;
            --tx5: ${tx5}px; --ty5: ${ty5}px;
            --tx6: ${tx6}px; --ty6: ${ty6}px;
            animation-delay: ${animDelay}s;
            animation-duration: ${animDuration}s;
        "></div>
    `;
  }

  // Calculate live rates for the LED screen
  let p = window.resolvePlayerStats();
  let probs = window.calculateRarityProbabilities(p.qly, true, isGlim);

  let ledContent = isGlim
    ? `
        <div class="gacha-led-readout glimmering">
            <div class="led-header">GLIMMERING BOOSTER TERMINAL</div>
            <div class="led-grid">
                <span style="color:#e74c3c; text-shadow: 0 0 4px rgba(231,76,60,0.55); font-weight:bold;">5★: ${probs[5].toFixed(1)}%</span>
                <span style="color:#f1c40f; text-shadow: 0 0 4px rgba(241,196,15,0.55); font-weight:bold;">4★: ${probs[4].toFixed(1)}%</span>
                <span style="color:#e67e22; text-shadow: 0 0 4px rgba(230,126,34,0.55); font-weight:bold;">3★: ${probs[3].toFixed(1)}%</span>
                <span style="color:#1abc9c; text-shadow: 0 0 4px rgba(26,188,156,0.55); font-weight:bold;">ART: 5.0%</span>
            </div>
        </div>`
    : `
        <div class="gacha-led-readout standard">
            <div class="led-header">STANDARD VENDING TERMINAL</div>
            <div class="led-grid">
                <span style="color:#e74c3c; text-shadow: 0 0 4px rgba(231,76,60,0.55); font-weight:bold;">5★: ${probs[5].toFixed(2)}%</span>
                <span style="color:#f1c40f; text-shadow: 0 0 4px rgba(241,196,15,0.55); font-weight:bold;">4★: ${probs[4].toFixed(2)}%</span>
                <span style="color:#e67e22; text-shadow: 0 0 4px rgba(230,126,34,0.55); font-weight:bold;">3★: ${probs[3].toFixed(1)}%</span>
                <span style="color:#9b59b6; text-shadow: 0 0 4px rgba(155,89,182,0.55); font-weight:bold;">2★: ${probs[2].toFixed(1)}%</span>
                <span style="color:#3498db; text-shadow: 0 0 4px rgba(52,152,219,0.55); font-weight:bold;">1★: ${probs[1].toFixed(1)}%</span>
            </div>
        </div>`;

  let cabinetClass = isGlim
    ? "gacha-cabinet glimmering-style"
    : "gacha-cabinet standard-style";
  let titleColor = isGlim ? "#00d2ff" : "#f1c40f";
  let switcherBtnHtml = `
    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:6px; width:100%; margin-bottom:8px;">
        <button onclick="window.gachaSelectedMode='standard'; window.renderGachaModal();" class="sub-tab-btn ${!isGlim ? "active" : ""}" style="font-size:9.5px; padding:4px;">Standard Machine</button>
        <button onclick="window.gachaSelectedMode='glimmering'; window.renderGachaModal();" class="sub-tab-btn ${isGlim ? "active" : ""}" style="font-size:9.5px; padding:4px;">Glimmering Machine</button>
    </div>
  `;

  let keyIcon = isGlim
    ? `<svg width="12" height="12" viewBox="0 0 32 32" style="display:inline-block; vertical-align:middle; filter: drop-shadow(0 0 3px #00d2ff);"><path d="M11 4 L14 11 L21 11 L15 15 L18 22 L11 17 L4 22 L7 15 L1 11 L8 11 Z" fill="url(#g_glim_key_modal)" /></svg>`
    : `<svg width="12" height="12" viewBox="0 0 32 32" style="display:inline-block; vertical-align:middle; fill:#f1c40f;"><circle cx="11" cy="21" r="6" /><path d="M15 17 L27 5 L30 8 L28 10 L26 8" stroke="#000" stroke-width="2" fill="none"/></svg>`;

  overlay.innerHTML = `
        <svg style="width:0; height:0; position:absolute;">
            <defs>
                <linearGradient id="g_glim_key_modal" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#00d2ff" />
                    <stop offset="50%" stop-color="#e84393" />
                    <stop offset="100%" stop-color="#9b59b6" />
                </linearGradient>
            </defs>
        </svg>
        <div class="${cabinetClass} gacha-cabinet-enter" onanimationend="this.classList.remove('gacha-cabinet-enter')">
            <div style="display:flex; justify-content:space-between; align-items:center; width:100%; border-bottom:1px solid ${titleColor}; padding-bottom:6px; margin-bottom:10px;">
                <h3 style="margin:0; color:${titleColor}; font-size:13px; letter-spacing:1px; display:flex; align-items:center; gap:6px;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle; margin-right:4px;"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="5" y1="12" x2="19" y2="12"/><line x1="12" y1="12" x2="12" y2="22"/><circle cx="12" cy="7" r="2"/></svg> ARCADE GACHAPON</h3>
                <button onclick="document.getElementById('gacha-modal-overlay').remove(); window.setPauseState(false); window.hideTooltip();" style="background:#222; border:1px solid #444; color:#aaa; font-weight:bold; cursor:pointer; font-size:10px; padding:3px 8px; border-radius:4px;">Close</button>
            </div>

            ${switcherBtnHtml}

            <!-- Capsule Globe -->
            <div class="gacha-globe" id="gacha-globe-element">
                ${ballsHtml}
            </div>

            <!-- LED Screen dynamic rate readouts inside the machine -->
            ${ledContent}

            <!-- PITY TRACKER PROGRESS -->
            <div style="width: 100%; margin: 8px 0; background:rgba(0,0,0,0.5); border:1px solid #333; padding:8px; border-radius:6px; text-align:center;">
                <div style="display:flex; justify-content:space-between; font-size:10px; color:#cbd5e1; font-weight:bold; margin-bottom:4px; font-family:monospace;">
                    <span id="vending-pity-text">Pity progress: ${pityProgress} / ${maxPity}</span>
                    <span style="color:#e74c3c;">Guaranteed 5★ on ${maxPity}</span>
                </div>
                <div style="width:100%; height:6px; background:#222; border-radius:3px; overflow:hidden; border:1px solid #444;">
                    <div id="vending-pity-fill" style="width:${(pityProgress / maxPity) * 100}%; height:100%; background:linear-gradient(90deg, #ff007f, #e74c3c); transition:width 0.3s ease;"></div>
                </div>
            </div>

            <!-- CONTROL PANEL & CRANK -->
            <div class="gacha-control-panel">
                <div style="font-size:10px; color:#aaa; margin-bottom:8px; text-transform:uppercase; letter-spacing:0.5px; font-family:monospace; display:flex; flex-direction:column; align-items:center; gap:4px; width:100%;">
                    <div style="display:flex; justify-content:space-between; width:100%; padding: 0 10px;">
                        <span>Standard Keys:</span>
                        <strong style="color:#f1c40f;">${standardKeys}</strong>
                    </div>
                    <div style="display:flex; justify-content:space-between; width:100%; padding: 0 10px;">
                        <span>Glimmering Keys:</span>
                        <strong style="color:#00d2ff;">${glimmeringKeys}</strong>
                    </div>
                </div>

                <div class="gacha-crank-handle" id="gacha-crank-element" onclick="window.crankGachaMachine()">
                    <div class="gacha-crank-cross"></div>
                    <div class="gacha-crank-cross vertical"></div>
                </div>

                <div style="font-size:9.5px; color:${titleColor}; margin-top:8px; text-align:center; font-weight:bold;">
                    CLICK CRANK TO SPIN!
                </div>
            </div>

            <!-- CHUTE SLOT -->
            <div class="gacha-chute" id="gacha-chute-element">
                <!-- Dispensed capsule drops here -->
            </div>

            <div id="gacha-reward-overlay" style="display:none; margin-top:10px; width:100%;"></div>
        </div>
    `;
};

window.crankGachaMachine = function (forceSpendStandard = false) {
  if (
    window.gachaActiveState === "spinning" ||
    window.gachaActiveState === "dispensed"
  )
    return;

  let crank = document.getElementById("gacha-crank-element");
  let globe = document.getElementById("gacha-globe-element");
  let chute = document.getElementById("gacha-chute-element");
  let cabinet = document.querySelector(".gacha-cabinet");

  let isGlim = window.gachaSelectedMode === "glimmering";

  // Intercept the crank click if it is Glimmering and they have no Glimmering Key, but have 10 standard keys
  if (isGlim && !forceSpendStandard) {
    let glimmeringKeys = window.inventory.ETC["Glimmering Gachapon Key"] || 0;
    let standardKeys = window.inventory.ETC["Gacha Key"] || 0;

    if (glimmeringKeys < 1) {
      if (standardKeys >= 10) {
        window.showCustomConfirm(
          "Spend 10 Standard Keys?",
          "You don't have a Glimmering Key. Would you like to spend 10 Standard Gacha Keys to spin the Glimmering Machine?",
          "Yes, spin!",
          "Cancel",
          "#00d2ff",
          function () {
            window.crankGachaMachine(true); // run again, forcing standard key spending
          },
        );
        return;
      } else {
        window.SoundManager.play("block");
        if (crank) {
          crank.classList.add("crank-jammed-animate");
          setTimeout(() => crank.classList.remove("crank-jammed-animate"), 600);
        }
        if (cabinet) {
          cabinet.classList.add("cabinet-rattle");
          setTimeout(() => cabinet.classList.remove("cabinet-rattle"), 450);
        }
        window.pushHeaderToast(
          "❌ Insufficient Glimmering Key or standard Gacha Keys!",
          "#e74c3c",
        );
        return;
      }
    }
  }

  // 1. Evaluate Gacha roll result first to coordinate the mechanical response
  let res = window.rollGachaCrateItem(isGlim, forceSpendStandard);
  if (res.error) {
    // Play jammed locking mechanical feedback sound
    window.SoundManager.play("block");

    // Trigger the partial "jammed struggle" wiggle on the dial
    if (crank) {
      crank.classList.add("crank-jammed-animate");
      setTimeout(() => {
        if (crank) crank.classList.remove("crank-jammed-animate");
      }, 600);
    }

    // Shake the entire retro cabinet container
    if (cabinet) {
      cabinet.classList.add("cabinet-rattle");
      setTimeout(() => {
        if (cabinet) cabinet.classList.remove("cabinet-rattle");
      }, 450);
    }

    window.pushHeaderToast("❌ " + res.error, "#e74c3c");
    return;
  }

  // 2. Success flow: Lock machine state and trigger full 360 spin
  let rolledItem = res.item;
  window.gachaActiveState = "spinning";

  if (crank) {
    crank.classList.add("crank-animate");
  }

  if (globe) {
    Array.from(globe.querySelectorAll(".gacha-ball-pile")).forEach((ball) => {
      ball.classList.add("ball-spinning"); // Switch on high-fidelity physics animation
    });
  }

  window.SoundManager.play("swing");

  setTimeout(() => {
    if (crank) crank.classList.remove("crank-animate");
    if (globe) {
      Array.from(globe.querySelectorAll(".gacha-ball-pile")).forEach((ball) => {
        ball.classList.remove("ball-spinning"); // Automatically let gravity settle them
      });
    }

    window.gachaActiveState = "dispensed";
    let color = window.getTierColor(rolledItem.statsRolled);

    // Render capsule drop
    if (chute) {
      chute.innerHTML = `
                                                <div class="dispensed-capsule capsule-glow" style="
                                                    background: linear-gradient(180deg, ${color} 50%, #ffffff 50%);
                                                    border: 1.5px solid #000;
                                                    color: ${color};
                                                " onclick="window.revealGachaReward(${JSON.stringify(rolledItem).replace(/"/g, "&quot;")})"></div>
                                            `;
      window.SoundManager.play("block");
    }
  }, 1000);
};

window.revealGachaReward = function (item) {
  let chute = document.getElementById("gacha-chute-element");
  let rewardOverlay = document.getElementById("gacha-reward-overlay");
  if (!rewardOverlay) return;

  if (chute) chute.innerHTML = ""; // Clear dispensed ball

  window.gachaActiveState = "idle";
  if (
    window.SoundManager &&
    typeof window.SoundManager.playLootDrop === "function"
  ) {
    window.SoundManager.playLootDrop(item.statsRolled);
  } else if (window.SoundManager) {
    window.SoundManager.play("revive");
  }

  let color = window.getTierColor(item.statsRolled);

  // Explode particles!
  if (window.spawnPurchaseCelebration) {
    window.spawnPurchaseCelebration("gacha", color, item.statsRolled);
  }

  // Direct items.js notifications
  window.pushLog(
    `<strong style='color:#f1c40f;'>[GACHA]</strong> Dispensed: <span style='color:${color};'>${item.name}</span>`,
    item.id,
  );
  window.pushToast(
    item.name,
    item.statsRolled,
    color,
    false,
    1,
    null,
    null,
    false,
    item,
  );

  let itemCardHtml = window.generateItemCardHtml(item, null, false);

  rewardOverlay.innerHTML = `
                            <div style="background:#111; border:2px solid ${color}; border-radius:6px; padding:10px; margin-top:10px; animation: toastFadeIn 0.3s ease-out; position:relative;">
                                <div style="max-height:220px; overflow-y:auto; overscroll-behavior:contain; margin-bottom:10px;">
                                    ${itemCardHtml}
                                </div>
                                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:6px;">
                                    <button class="btn-action" style="background:#555; font-size:10px; padding:6px;" onclick="document.getElementById('gacha-modal-overlay').remove(); window.setPauseState(false); window.hideTooltip();">Claim & Exit</button>
                                    <button class="btn-action" style="background:#2ecc71; font-size:10px; padding:6px;" onclick="window.renderGachaModal()">Spin Again</button>
                                </div>
                            </div>
                        `;
  rewardOverlay.style.display = "block";

  window.updateUI();
  window.renderInventory();
  if (typeof window.renderForgeTab === "function") window.renderForgeTab();
};

// --- MISSION CLAIM & DRAGGABLE WINDOW SYSTEM ---

window.switchMissionsTab = function (tabId) {
  window.state.missionsTab = tabId;
  window.renderMissionsWindow();
};

window.buyMissionUpgrade = function (type) {
  let p = window.playerStats;
  p.missionUpgrades = p.missionUpgrades || { gold: 0, atk: 0, hp: 0, bag: 0 };
  let curLevel = p.missionUpgrades[type] || 0;
  let cost = 5; // Flat cost of 5 for gold, atk, and hp
  if (type === "bag") {
    cost = 4 + curLevel * 3; // Scales: Lvl 0 costs 4, Lvl 1 costs 7, Lvl 2 costs 10...
  }

  if ((p.missionTokens || 0) < cost) {
    window.pushHeaderToast("❌ Insufficient Mission Tokens!", "#e74c3c");
    return;
  }

  p.missionTokens -= cost;
  p.missionUpgrades[type]++;

  let label = type === "bag" ? "Satchel" : type.toUpperCase();
  window.pushHeaderToast(
    `🎉 Upgraded Mission ${label} to Lv. ${p.missionUpgrades[type]}!`,
    "#2ecc71",
  );

  window.SoundManager.play("spell");
  if (typeof window.checkAchievements === "function") {
    window.checkAchievements();
  }
  window.updateUI();
  window.renderMissionsWindow();
  window.saveGame();
};

window.buyMissionItem = function (itemName, cost) {
  let p = window.playerStats;
  if ((p.missionTokens || 0) < cost) {
    window.pushHeaderToast(
      `❌ Insufficient Mission Points! Requires ${cost} MP.`,
      "#e74c3c",
    );
    return;
  }

  p.missionTokens -= cost;
  let normName = itemName.replace(/['\\’]/g, "").trim();
  if (normName === "Gacha Key") {
    window.addEtcDrop("Gacha Key", 1);
  } else if (normName === "Catalyst Core") {
    window.addEtcDrop("Catalyst Core", 1);
  } else if (normName === "Astral Essence") {
    window.addEtcDrop("Astral Essence", 1);
  } else if (normName === "Eridium Shard") {
    window.addEtcDrop("Eridium Shard", 1);
  } else if (normName === "Ancient Core") {
    window.addEtcDrop("Ancient Core", 1);
  } else if (normName === "Overlords Sigil") {
    window.addEtcDrop("Overlord's Sigil", 1);
  } else if (normName === "Double XP Elixir") {
    window.addUseDrop("Double XP Elixir", 1);
  } else if (normName === "Double Drop Elixir") {
    window.addUseDrop("Double Drop Elixir", 1);
  } else if (normName === "Drop Quality Elixir") {
    window.addUseDrop("Drop Quality Elixir", 1);
  }

  let finalName = itemName;
  if (normName === "Overlords Sigil") finalName = "Overlord's Sigil";

  window.pushHeaderToast(`🛒 Purchased ${finalName}!`, "#2ecc71");
  window.SoundManager.play("fairy");
  window.updateUI();
  window.renderMissionsWindow();
  window.saveGame();
};

window.showMissionShopUpgradeTooltip = function (e, upId) {
  e.stopPropagation();
  let tt = document.getElementById("game-tooltip");
  if (!tt) return;

  let title = "";
  let desc = "";
  let currentLevel = window.playerStats.missionUpgrades[upId] || 0;
  let color = "#2ecc71";

  if (upId === "bag") {
    title = "🎒 Dimensional Satchel";
    let cost = 4 + currentLevel * 3;
    desc = `Each upgrade level permanently expands your maximum equipment and artifact sack capacity by <strong style="color:#3498db;">+10 slots</strong>.<br><br>• Current Level: <strong style="color:#fff;">Lv. ${currentLevel} (+${currentLevel * 10} Slots)</strong><br>• Cost: <strong style="color:#f1c40f;">${cost} QP</strong>`;
    color = "#3498db";
  } else if (upId === "gold") {
    title = "💰 Midas Training";
    desc = `Permanently increases your Global Gold Multiplier by <strong style="color:#f1c40f;">+5%</strong>.<br><br>• Current Level: <strong style="color:#fff;">Lv. ${currentLevel} (+${currentLevel * 5}%)</strong><br>• Cost: <strong style="color:#f1c40f;">5 QP</strong>`;
    color = "#f1c40f";
  } else if (upId === "atk") {
    title = "⚔️ Gladiator Mastery";
    desc = `Permanently increases your Global Attack Power by <strong style="color:#e74c3c;">+2%</strong>.<br><br>• Current Level: <strong style="color:#fff;">Lv. ${currentLevel} (+${currentLevel * 2}%)</strong><br>• Cost: <strong style="color:#f1c40f;">5 QP</strong>`;
    color = "#e74c3c";
  } else if (upId === "hp") {
    title = "❤️ Iron Constitution";
    desc = `Permanently increases your Global Max HP by <strong style="color:#3498db;">+3%</strong>.<br><br>• Current Level: <strong style="color:#fff;">Lv. ${currentLevel} (+${currentLevel * 3}%)</strong><br>• Cost: <strong style="color:#f1c40f;">5 QP</strong>`;
    color = "#3498db";
  }

  tt.innerHTML = `
    <div style="padding: 10px; width: 220px; box-sizing: border-box;">
        <div class="tt-title" style="color:${color};">${title}</div>
        <div style="color:#aaa; font-size:11px; white-space:normal; line-height:1.4; margin-top:6px;">${desc}</div>
    </div>
  `;
  tt.style.borderColor = color;
  tt.style.display = "block";
  window.positionTooltip(e, tt);
};

window.showMissionShopItemTooltip = function (e, itemName) {
  e.stopPropagation();
  let tt = document.getElementById("game-tooltip");
  if (!tt) return;

  let desc = "";
  let color = "#bdc3c7";
  let cost = 0;

  // Immunize tooltip from quote-escaping browser quirks
  let normalizedName = itemName.replace(/['\\’]/g, "").trim();

  if (normalizedName === "Eridium Shard") {
    desc =
      "A glowing, alien fragment used in the Forge to Tier Up an item's Star Rarity.";
    color = "#8e44ad";
    cost = 3;
  } else if (normalizedName === "Ancient Core") {
    desc = "Sacrifice at the Altar to summon a Guardian.";
    color = "#e74c3c";
    cost = 3;
  } else if (normalizedName === "Overlords Sigil") {
    desc = "Spent at the Forge to lock and re-roll equipment modifiers.";
    color = "#1abc9c";
    cost = 3;
  } else if (normalizedName === "Gacha Key") {
    desc =
      "Used at the Vending Machine to dispense a guaranteed random equipment piece.";
    color = "#f1c40f";
    cost = 27;
  } else if (normalizedName === "Catalyst Core") {
    desc = "Spent at the Forge to temper Unique Artifacts.";
    color = "#2ecc71";
    cost = 3;
  } else if (normalizedName === "Astral Essence") {
    desc =
      "A pulsing, cosmic residue extracted by salvaging Unique Artifacts. Spent at the Forge to imbed powerful enchantments.";
    color = "#9b59b6";
    cost = 27;
  } else if (normalizedName === "Double XP Elixir") {
    desc =
      "Doubles all acquired experience gains (+100% EXP) for 5 minutes (scales with INT).";
    color = "#a855f7";
    cost = 10;
  } else if (normalizedName === "Double Drop Elixir") {
    desc =
      "Doubles current drop rate multiplier (+100%) for 5 minutes (scales with INT).";
    color = "#22c55e";
    cost = 12;
  } else if (normalizedName === "Drop Quality Elixir") {
    desc =
      "Boosts item drop quality checks by +50% for 5 minutes (scales with INT).";
    color = "#3b82f6";
    cost = 15;
  }

  // Preserve correct format strings for UI outputs
  let finalName = itemName;
  if (normalizedName === "Overlords Sigil") finalName = "Overlord's Sigil";

  let iconHtml = finalName.includes("Elixir")
    ? window.getUseIconHtml(finalName)
    : window.getEtcIconHtml(finalName);
  iconHtml = iconHtml.replace("margin-right: 12px;", "margin-right: 8px;");

  tt.innerHTML = `
      <div style="padding: 10px; width: 220px; box-sizing: border-box;">
          <div class="tt-title" style="color:${color}; display:flex; align-items:center; gap:8px;">${iconHtml}<span>${finalName}</span></div>
          <div style="color:#aaa; font-size:11px; white-space:normal; line-height:1.4; margin-top:8px;">
              ${desc}<br><br>
              • Cost: <strong style="color:#f1c40f;">${cost} QP</strong><br>
            • Owned: <strong style="color:#fff;">${(window.inventory.ETC[finalName] || window.inventory.USE[finalName] || 0).toLocaleString()}</strong>
        </div>
    </div>
  `;
  tt.style.borderColor = color;
  tt.style.display = "block";
  window.positionTooltip(e, tt);
};

window.claimMissionReward = function (missionId, isWeekly = false) {
  let missions = isWeekly
    ? window.playerStats.weeklyMissions
    : window.playerStats.dailyMissions;
  if (!missions) return;
  let m = missions.find((x) => x.id === missionId);
  if (!m || !m.completed || m.claimed) return;

  m.claimed = true;
  window.justClaimedMissionIds = window.justClaimedMissionIds || new Set();
  window.justClaimedMissionIds.add(missionId);

  if (typeof window.addEtcDrop === "function") {
    if (m.treat === "Gold") {
      window.playerStats.coins = BigNum.from(window.playerStats.coins).add(
        m.treatQty,
      );
      window.playerStats.totalGoldEarned = BigNum.from(
        window.playerStats.totalGoldEarned || 0,
      ).add(m.treatQty);
    } else if (m.treat === "Epic Gear Piece") {
      let activeStage = window.playerStats.stage || 1;
      let scale = Math.floor((activeStage - 1) / 10) + 1;
      let types = [
        "weapon",
        "subweapon",
        "helmet",
        "chest",
        "leggings",
        "overall",
        "boots",
      ];
      let chosenType = types[Math.floor(Math.random() * types.length)];
      let newItem = window.createItemObject(chosenType, 3, scale, 3);
      window.inventory.EQUIP.push(newItem);
      if (typeof window.pushLog === "function")
        window.pushLog(
          `<strong style="color:#e67e22;">[MISSION]</strong> Received guaranteed Epic reward: <span style="color:${window.getTierColor(3)};">${newItem.name}</span>!`,
        );
    } else if (window.useDex && window.useDex[m.treat]) {
      if (typeof window.addUseDrop === "function")
        window.addUseDrop(m.treat, m.treatQty);
    } else {
      window.addEtcDrop(m.treat, m.treatQty);
    }

    if (m.potionAward) {
      if (typeof window.addUseDrop === "function")
        window.addUseDrop(m.potionAward, 3);
      if (typeof window.pushLog === "function")
        window.pushLog(
          `<strong style="color:#2ecc71;">[MISSION]</strong> Received extra potion stash: 3x ${m.potionAward}!`,
        );
    }
  }

  if (typeof window.pushHeaderToast === "function") {
    let textLabel = m.potionAward
      ? `${m.treatQty}x ${m.treat} & 3x ${m.potionAward}`
      : `${m.treatQty}x ${m.treat}`;
    window.pushHeaderToast(
      `🎁 Claimed: ${textLabel} & +1 Quest Point!`,
      "#2ecc71",
    );
  }

  if (window.SoundManager) window.SoundManager.play("fairy");

  window.updateUI();
  window.renderMissionsWindow();
};

window.claimMasterMissionReward = function (isWeekly = false) {
  let missions = isWeekly
    ? window.playerStats.weeklyMissions
    : window.playerStats.dailyMissions;
  if (!missions) return;

  let alreadyClaimed = isWeekly
    ? window.playerStats.weeklyRewardClaimed
    : window.playerStats.dailyRewardClaimed;
  if (alreadyClaimed) return;

  let completedCount = missions.filter((m) => m.completed).length;
  let requiredCount = isWeekly ? 3 : 5; // 3/3 for Weekly board, 5/6 for Daily board

  if (completedCount < requiredCount) return;

  if (isWeekly) {
    window.playerStats.weeklyRewardClaimed = true;

    // Award 10 Mission Tokens for Weekly Board completion
    window.playerStats.missionTokens =
      (window.playerStats.missionTokens || 0) + 10;

    let scalingPP = 2 + Math.floor(window.playerStats.prestigeCount / 5);
    window.playerStats.prestigePoints += scalingPP;
    window.addEtcDrop("Gacha Key", 3);
    window.addEtcDrop("Catalyst Core", 1);

    let activeStage = window.playerStats.stage || 1;
    let scale = Math.floor((activeStage - 1) / 10) + 1;
    let types = [
      "weapon",
      "subweapon",
      "helmet",
      "chest",
      "leggings",
      "overall",
      "boots",
    ];
    let chosenType = types[Math.floor(Math.random() * types.length)];
    let minStars = Math.random() < 0.2 ? 5 : 4;
    let grandItem = window.createItemObject(
      chosenType,
      minStars,
      scale,
      minStars,
    );
    window.inventory.EQUIP.push(grandItem);

    // Award 1x guaranteed Monster Card Sack for completing the Weekly Board
    window.addUseDrop("Monster Card Sack", 1);

    if (typeof window.pushLog === "function")
      window.pushLog(
        `<strong style="color:#f1c40f;">🏆 [QUEST BOARD] Beaten Weekly Board! Earned +${scalingPP} PP, 1x Card Sack, Gacha Keys, 10x Quest Points, and ${grandItem.name}!</strong>`,
      );
  } else {
    window.playerStats.dailyRewardClaimed = true;

    // Award 3 Mission Tokens for Daily Board completion
    window.playerStats.missionTokens =
      (window.playerStats.missionTokens || 0) + 3;

    window.addEtcDrop("Gacha Key", 1);
    window.addEtcDrop("Catalyst Core", 1);
    window.addEtcDrop("Eridium Shard", 2);

    // Guaranteed 1x Card Sack for completing the Daily Board
    window.addUseDrop("Monster Card Sack", 1);
    if (typeof window.pushLog === "function") {
      window.pushLog(
        "<span style='color:#a855f7;'>[MISSION BOARD] Awarded 1x Monster Card Sack for completing the Daily Board!</span>",
      );
    }
  }

  if (window.SoundManager) window.SoundManager.play("revive");

  window.updateUI();
  window.renderMissionsWindow();
};

window.getMissionIconSvg = function (type, color) {
  const size = 20;
  let svgContent = "";
  if (type === "kills" || type === "rares" || type === "rifts") {
    // Hand-drawn crossed steel axes
    svgContent = `
      <g stroke="${color}" stroke-width="1.8" stroke-linecap="round" fill="none">
        <path d="M4 20 L20 4 M3 21 L5 19 M12 6 L18 12 M9 9 L11 11" />
        <path d="M20 20 L4 4 M21 21 L19 19 M12 18 L18 12 M9 15 L11 13" />
        <path d="M14 4 L18 2 L22 8 L18 10 Z" fill="${color}25" stroke="${color}" stroke-width="1.2" />
        <path d="M10 4 L6 2 L2 8 L6 10 Z" fill="${color}25" stroke="${color}" stroke-width="1.2" />
      </g>
    `;
  } else if (type === "gold") {
    // Hand-drawn rustic gold coin
    svgContent = `
      <g stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" fill="none">
        <circle cx="12" cy="12" r="9" fill="${color}12" />
        <path d="M12 6 V18 M10 9 H14 M9 12 H15 M10 15 H14" stroke-width="2" />
      </g>
    `;
  } else if (type === "fairies") {
    // Whimsical fairy wings jar
    svgContent = `
      <g stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" fill="none">
        <path d="M9 6 H15 M10 6 V9 M14 6 V9 M8 12 C8 8 16 8 16 12 C16 16 14 20 12 20 C10 20 8 16 8 12 Z" fill="${color}10" />
        <path d="M7 10 Q3 6, 4 12 Q8 14, 8 10 M17 10 Q21 6, 20 12 Q16 14, 16 10" stroke-width="1.2" />
      </g>
    `;
  } else if (type === "tempers") {
    // Heavy forging anvil
    svgContent = `
      <g stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" fill="none">
        <path d="M4 18 L20 18 L22 13 Q21 9, 16 9 L6 9 L4 13 Z" fill="${color}15" />
        <rect x="8" y="18" width="8" height="4" />
      </g>
    `;
  } else if (type === "reforges") {
    // Polished reforge starry compass
    svgContent = `
      <g stroke="${color}" stroke-width="1.8" stroke-linecap="round" fill="none">
        <circle cx="12" cy="12" r="5" />
        <path d="M12 2 L12 6 M12 18 L12 22 M2 12 L6 12 M18 12 L22 12" stroke-width="2" />
        <path d="M8 8 L16 16 M16 8 L8 16" stroke-width="1" />
      </g>
    `;
  } else if (type === "dungeons") {
    // Hand-drawn stone dungeon archway
    svgContent = `
      <g stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" fill="none">
        <path d="M4 21 V10 C4 5, 20 5, 20 10 V21 Z" fill="${color}10" />
        <path d="M9 13 H15 V21 H9 Z" />
        <line x1="4" y1="14" x2="9" y2="14" />
        <line x1="15" y1="14" x2="20" y2="14" />
      </g>
    `;
  } else if (type === "salvage") {
    // Deconstruction recycling container
    svgContent = `
      <g stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" fill="none">
        <rect x="6" y="8" width="12" height="13" rx="1.5" />
        <path d="M4 8 H20 M10 5 H14 M9 12 L12 9 L15 12" />
      </g>
    `;
  } else if (type === "elixirs") {
    // Hand-drawn alchemist vial
    svgContent = `
      <g stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" fill="none">
        <rect x="10" y="4" width="4" height="4" rx="0.5" />
        <path d="M7 16 C7 11, 10 10, 12 10 C14 10, 17 11, 17 16 C17 20, 15 21, 12 21 C9 21, 7 20, 7 16 Z" fill="${color}18" />
        <line x1="9" y1="16" x2="15" y2="16" stroke-width="1" opacity="0.5" />
      </g>
    `;
  } else {
    // Active clicks target
    svgContent = `
      <g stroke="${color}" stroke-width="1.8" stroke-linecap="round" fill="none">
        <circle cx="12" cy="12" r="8" stroke-dasharray="3 2" />
        <circle cx="12" cy="12" r="3" fill="${color}" />
      </g>
    `;
  }
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" style="display:inline-block; vertical-align:middle; flex-shrink:0;">${svgContent}</svg>`;
};

window.toggleMissions = function () {
  let modal = document.getElementById("missions-draggable-window");
  if (modal) {
    modal.remove();
    window.hideTooltip();
  } else {
    window.hideTooltip();
    window.checkAndResetMissions();
    window.state.missionsTab = "BOARD";

    let win = document.createElement("div");
    win.id = "missions-draggable-window";
    win.className = "draggable-window";
    win.style.left = "80px";
    win.style.top = "60px";

    win.innerHTML = `
          <div class="draggable-header" id="missions-win-handle" style="background: linear-gradient(180deg, #181d24 0%, #0d1117 100%);">
              <span>🎯 Quest Board & Shop</span>
              <button onclick="document.getElementById('missions-draggable-window').remove(); window.hideTooltip();" style="background:transparent; border:none; color:#e74c3c; font-weight:bold; cursor:pointer; font-size:11px; padding:2px;">[X]</button>
          </div>
      <div class="draggable-content" id="missions-win-content" style="max-height: 400px; padding: 12px; background:#07030b;">
          <!-- Live sub-tab content injected dynamically below -->
      </div>
    `;

    document.getElementById("game-container").appendChild(win);
      window.renderMissionsWindow();
      window.makeWindowDraggable(
        win,
        document.getElementById("missions-win-handle"),
      );

      // Evaluate Quest Board tutorial trigger upon opening
      setTimeout(() => {
        if (window.HoorTutorial) {
          window.HoorTutorial.checkTriggers();
        }
      }, 100);
    }
    };

window.renderMissionsWindow = function () {
  let contentEl = document.getElementById("missions-win-content");
  if (!contentEl) return;

  let currentTab = window.state.missionsTab || "BOARD";
  let tokenBalance = window.playerStats.missionTokens || 0;

  // Custom Inline SVG Vector Badges for Premium tab Headers
  let boardIconSvg = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle; margin-right:4px;"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="9" y1="9" x2="15" y2="9"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="13" y2="17"/></svg>`;
  let shopIconSvg = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle; margin-right:4px;"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>`;

  let tabHeaderHtml = `
      <div style="display:grid; grid-template-columns: 1fr 1fr; gap:6px; margin-bottom:12px; padding:0 2px;">
          <button onclick="window.switchMissionsTab('BOARD')" class="sub-tab-btn ${currentTab === "BOARD" ? "active" : ""}" style="padding:6px; font-weight:bold; font-size:10.5px;">${boardIconSvg}Quest Board</button>
          <button onclick="window.switchMissionsTab('SHOP')" class="sub-tab-btn ${currentTab === "SHOP" ? "active" : ""}" style="padding:6px; font-weight:bold; font-size:10.5px;">${shopIconSvg}Quest Shop</button>
      </div>
    `;

  let contentHtml = "";

  if (currentTab === "BOARD") {
    let dailies = window.playerStats.dailyMissions || [];
    let weeklies = window.playerStats.weeklyMissions || [];

    let dailyDoneCount = dailies.filter((m) => m.completed).length;
    let weeklyDoneCount = weeklies.filter((m) => m.completed).length;

    let dailyMasterClaimed = window.playerStats.dailyRewardClaimed;
    let weeklyMasterClaimed = window.playerStats.weeklyRewardClaimed;

    let getMissionRowHtml = (m, isWeekly) => {
      let pct = Math.min(100, (m.current / m.target) * 100);
      let color = isWeekly ? "#9b59b6" : "#2ecc71";
      let btnHtml = "";
      let rerollBtnHtml = "";

      if (m.claimed) {
        btnHtml = `<span style="color:#7f8c8d; font-size:10px; font-weight:bold;">Claimed ✓</span>`;
      } else if (m.completed) {
        btnHtml = `<button class="btn-action btn-pulse" style="padding:4px 10px; font-size:10px; background:${color}; color:white; border: 1px solid #fff; box-shadow:0 0 8px ${color}55;" onclick="window.claimMissionReward('${m.id}', ${isWeekly})">Claim</button>`;
      } else {
        btnHtml = `<span style="color:#fff; font-size:10.5px; font-family:monospace; font-weight:bold; background:rgba(0,0,0,0.4); border: 1px solid #222; padding:3px 8px; border-radius:4px;">${m.current.toLocaleString()}/${m.target.toLocaleString()}</span>`;

        // Dynamic single-mission Re-roll system
        if (!isWeekly) {
          let rerollsDone = window.playerStats.dailyRerollsDone || 0;
          if (rerollsDone < 2) {
            let costLabel = rerollsDone === 0 ? "🔄 Free" : "🔄 50 Souls";
            rerollBtnHtml = `<button onclick="window.rerollDailyMission('${m.id}')" class="btn-action" style="padding:3px 8px; font-size:9px; margin-left:6px; background:#2d3139; border: 1px solid #444; font-family:monospace; line-height:1;" title="Re-roll Daily Mission (${rerollsDone === 0 ? "Free" : "Costs 50 Monster Souls"})">${costLabel}</button>`;
          }
        }
      }

      let rewardText = `+${m.treatQty} ${m.treat}`;
      if (m.potionAward) {
        rewardText += ` & 3x ${m.potionAward.replace(" Elixir", "")}`;
      }

      window.justClaimedMissionIds = window.justClaimedMissionIds || new Set();
      let isJustClaimed = window.justClaimedMissionIds.has(m.id);
      let stampClass = "stamp-base";
      if (isJustClaimed) {
        stampClass += " stamp-slam";
        window.justClaimedMissionIds.delete(m.id);
      }
      let claimedOverlay = m.claimed
        ? `<div style="position:absolute; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.72); backdrop-filter: blur(1.5px); display:flex; justify-content:center; align-items:center; border-radius:6px; z-index:5;"><span class="${stampClass}" style="--final-rot:-4deg; color:#e74c3c; font-size:12px; font-weight:900; border: 1.5px solid #e74c3c; padding: 3px 12px; border-radius:3px; font-family:Impact,sans-serif; text-shadow: 0 1px 2px #000; letter-spacing:1px; box-shadow: 0 0 10px rgba(231,76,60,0.35);">CLAIMED</span></div>`
        : "";

      // High-Fidelity rewards icon resolver (Bypasses grey placeholder bug)
      let rewardIconHtml = "";
      if (
        window.getUseIconHtml &&
        (m.treat.includes("Sack") ||
          m.treat.includes("Crate") ||
          m.treat.includes("Elixir") ||
          m.treat.includes("Scroll"))
      ) {
        rewardIconHtml = window.getUseIconHtml(m.treat, 22);
      } else if (window.getEtcIconHtml) {
        rewardIconHtml = window.getEtcIconHtml(m.treat, 22);
      }
      if (rewardIconHtml) {
        rewardIconHtml = rewardIconHtml
          .replace("margin-right: 12px;", "margin-right: 4px;")
          .replace("margin-right: 8px;", "margin-right: 4px;");
      }

      return `
        <div style="position:relative; background:linear-gradient(180deg, #131720 0%, #0c0f16 100%); border:1px solid #2d3748; border-left: 4px solid ${color} !important; border-radius:6px; padding:10px; margin-bottom:6px; display:flex; flex-direction:column; gap:6px;">
            ${claimedOverlay}
            <div style="display:flex; justify-content:space-between; align-items:center; gap:8px;">
                <div style="display:flex; align-items:center; gap:6px; text-align:left; min-width:0; flex:1;">
                    ${window.getMissionIconSvg ? window.getMissionIconSvg(m.type, color) : ""}
                    <strong style="font-size:11.5px; color:#fff; display:block; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; cursor:help;" onmouseenter="window.showMissionTooltip(event, '${m.id}', ${isWeekly})" ontouchstart="window.showMissionTooltip(event, '${m.id}', ${isWeekly})" onmouseleave="window.hideTooltip()">${m.desc}</strong>
                </div>
                <div style="display:flex; align-items:center; flex-shrink:0;">${btnHtml}${rerollBtnHtml}</div>
            </div>

            <div style="display:flex; align-items:center; gap:6px; font-size:10px; color:#aaa; margin-top:1px;">
                ${rewardIconHtml}
                <span>Reward: <span style="color:#f1c40f; font-weight:bold;">${rewardText}</span></span>
            </div>

            <div class="sink-prog-track" style="margin-top:2px; margin-bottom:0;">
                <div style="width:${pct}%; height:100%; background:${color}; transition: width 0.4s ease;"></div>
            </div>
        </div>
      `;
    };

    let dailyMasterBtnHtml = "";
    if (dailyMasterClaimed) {
      dailyMasterBtnHtml = `<button class="btn-action" style="background:#222; color:#555; border:1px solid #333; width:100%; font-size:10.5px; cursor:not-allowed;" disabled>Grand Treat Claimed ✓</button>`;
    } else if (dailyDoneCount >= 5) {
      dailyMasterBtnHtml = `<button class="btn-action btn-pulse-teal" style="width:100%; font-size:11px; padding:10px;" onclick="window.claimMasterMissionReward(false)">🎁 Claim Daily Grand Treat!</button>`;
    } else {
      dailyMasterBtnHtml = `<button class="btn-action" style="background:#222; color:#555; border:1px solid #333; width:100%; font-size:10.5px; cursor:not-allowed;" disabled>Complete at least 5 (${dailyDoneCount}/5)</button>`;
    }

    let weeklyMasterBtnHtml = "";
    let scalingPP = 2 + Math.floor(window.playerStats.prestigeCount / 5);
    if (window.playerStats.prestigeCount === 0) {
      weeklyMasterBtnHtml = `
        <div style="background:rgba(231,76,60,0.08); border:1px dashed #e74c3c; border-radius:6px; padding:10px; text-align:center; color:#e74c3c; font-size:10.5px; font-weight:bold; width:100%;">
            🔒 Weekly Board unlocks after your first Ascension at the Altar of Ascension.
        </div>
      `;
    } else {
      if (weeklyMasterClaimed) {
        weeklyMasterBtnHtml = `<button class="btn-action" style="background:#222; color:#555; border:1px solid #333; width:100%; font-size:10.5px; cursor:not-allowed;" disabled>Grand Treat Claimed ✓</button>`;
      } else if (weeklyDoneCount === 3) {
        weeklyMasterBtnHtml = `<button class="btn-action btn-pulse" style="width:100%; font-size:11px; padding:10px; background:#9b59b6; border-color:#fff; box-shadow:0 0 10px rgba(155,89,182,0.4);" onclick="window.claimMasterMissionReward(true)">🎁 Claim Weekly Grand Treat!</button>`;
      } else {
        weeklyMasterBtnHtml = `<button class="btn-action" style="background:#222; color:#555; border:1px solid #333; width:100%; font-size:10.5px; cursor:not-allowed;" disabled>Complete all 3 (${weeklyDoneCount}/3)</button>`;
      }
    }

    let weekliesCardHtml = "";
    if (window.playerStats.prestigeCount === 0) {
      weekliesCardHtml = `
            <div style="border:1px solid #444; border-radius:6px; padding:12px; background:rgba(0,0,0,0.4); text-align:center; color:#aaa; font-size:11px; font-style:italic;">
                Weekly board locked until Ascension. Slay Hooktail to claim your destiny.
            </div>
          `;
    } else {
      weekliesCardHtml = `
                  <div style="border:1.5px solid #9b59b680; border-radius:8px; padding:12px; background:rgba(155, 89, 182, 0.03); box-shadow:0 4px 15px rgba(0,0,0,0.5);">
                      <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1.5px solid #9b59b644; padding-bottom:6px; margin-bottom:10px;">
                          <strong style="color:#df9ffb; font-size:12px; text-transform:uppercase; letter-spacing:0.5px;">📆 Weekly Quests</strong>
                          <span style="font-size:9.5px; color:#aaa; font-family:monospace;" id="weekly-timer-val">Refreshing...</span>
                      </div>
                <div>
                    ${weeklies.map((m) => getMissionRowHtml(m, true)).join("")}
                </div>
                <div style="margin-top:12px;">
                    ${weeklyMasterBtnHtml}
                    ${weeklyMasterClaimed ? "" : `<div style="font-size:9px; color:#aaa; text-align:center; margin-top:5px; line-height:1.35; white-space:normal;">Grand treat: +${scalingPP} PP (scales with prestiges), 3x Gacha Keys, 1x Catalyst Core, and a high-tier guaranteed Gear Drop!</div>`}
                </div>
            </div>
          `;
    }

    contentHtml = `
      <!-- DAILY MISSIONS PANEL -->
      <div style="border:1.5px solid #2ecc7180; border-radius:8px; padding:12px; background:rgba(46,204,113,0.03); margin-bottom:14px; box-shadow:0 4px 15px rgba(0,0,0,0.5);">
          <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1.5px solid #2ecc7144; padding-bottom:6px; margin-bottom:10px;">
              <strong style="color:#2ecc71; font-size:12px; text-transform:uppercase; letter-spacing:0.5px;">📅 Daily Objectives</strong>
              <span style="font-size:9.5px; color:#aaa; font-family:monospace;" id="daily-timer-val">Refreshing...</span>
          </div>
          <div>
              ${dailies.map((m) => getMissionRowHtml(m, false)).join("")}
          </div>
          <div style="margin-top:12px;">
                        ${dailyMasterBtnHtml}
                        ${dailyMasterClaimed ? "" : `<div style="font-size:9px; color:#aaa; text-align:center; margin-top:5px; line-height:1.35; white-space:normal;">Grand treat: 1x Gacha Key, 1x Catalyst Core, 1x Monster Card Sack, 2x Eridium Shards (Only requires 5/6 completed!)</div>`}
                    </div>
      </div>

      <!-- WEEKLY MISSIONS PANEL -->
      ${weekliesCardHtml}
    `;
  } else {
    // MISSION SHOP LAYOUT
    let p = window.playerStats;
    p.missionUpgrades = p.missionUpgrades || { gold: 0, atk: 0, hp: 0, bag: 0 };

    let lvlGold = p.missionUpgrades.gold || 0;
    let costGold = 5;
    let canAffordGold = tokenBalance >= costGold;

    let lvlAtk = p.missionUpgrades.atk || 0;
    let costAtk = 5;
    let canAffordAtk = tokenBalance >= costAtk;

    let lvlHp = p.missionUpgrades.hp || 0;
    let costHp = 5;
    let canAffordHp = tokenBalance >= costHp;

    let lvlBag = p.missionUpgrades.bag || 0;
    let costBag = 4 + lvlBag * 3;
    let canAffordBag = tokenBalance >= costBag;

    // Mini vector SVGs for Permanent Upgrade Icons
    let satchelSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3498db" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="filter:drop-shadow(0 0 4px #3498db);"><path d="M16 16v1a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2v-1"/><rect x="4" y="6" width="16" height="10" rx="2"/><path d="M9 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>`;
    let midasSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f1c40f" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="filter:drop-shadow(0 0 4px #f1c40f);"><circle cx="12" cy="12" r="10"/><path d="M12 6v12M9 9h6M9 13h6"/></svg>`;
    let gladiatorSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#e74c3c" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="filter:drop-shadow(0 0 4px #e74c3c);"><path d="M14.5 17.5L3 6V3h3l11.5 11.5M13 19l6-6M16 16l4 4M19 21l2-2"/></svg>`;
    let constitutionSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3498db" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="filter:drop-shadow(0 0 4px #3498db);"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`;

    let bagBtnHtml = canAffordBag
      ? `<button class="btn-action" style="background:#3498db; color:#fff; font-size:10px; padding:6px; width:100%; border-radius:4px; font-weight:bold; border: 1px solid #fff;" onpointerdown="event.stopPropagation();" ontouchstart="event.stopPropagation();" onclick="event.stopPropagation(); window.buyMissionUpgrade('bag')">Upgrade (${costBag} QP)</button>`
      : `<button class="btn-action" style="background:#242933; color:#5c6370; font-size:10px; padding:6px; width:100%; border-radius:4px; font-weight:bold; cursor:not-allowed; border: 1px solid #2d3139; opacity: 0.7;" disabled>Lacking QP (${costBag})</button>`;

    let goldBtnHtml = canAffordGold
      ? `<button class="btn-action" style="background:#f1c40f; color:#111; font-size:10px; padding:6px; width:100%; border-radius:4px; font-weight:bold; border: 1px solid #fff;" onpointerdown="event.stopPropagation();" ontouchstart="event.stopPropagation();" onclick="event.stopPropagation(); window.buyMissionUpgrade('gold')">Upgrade (5 QP)</button>`
      : `<button class="btn-action" style="background:#242933; color:#5c6370; font-size:10px; padding:6px; width:100%; border-radius:4px; font-weight:bold; cursor:not-allowed; border: 1px solid #2d3139; opacity: 0.7;" disabled>Lacking QP (5)</button>`;

    let atkBtnHtml = canAffordAtk
      ? `<button class="btn-action" style="background:#e74c3c; color:#fff; font-size:10px; padding:6px; width:100%; border-radius:4px; font-weight:bold; border: 1px solid #fff;" onpointerdown="event.stopPropagation();" ontouchstart="event.stopPropagation();" onclick="event.stopPropagation(); window.buyMissionUpgrade('atk')">Upgrade (5 QP)</button>`
      : `<button class="btn-action" style="background:#242933; color:#5c6370; font-size:10px; padding:6px; width:100%; border-radius:4px; font-weight:bold; cursor:not-allowed; border: 1px solid #2d3139; opacity: 0.7;" disabled>Lacking QP (5)</button>`;

    let hpBtnHtml = canAffordHp
      ? `<button class="btn-action" style="background:#3498db; color:#fff; font-size:10px; padding:6px; width:100%; border-radius:4px; font-weight:bold; border: 1px solid #fff;" onpointerdown="event.stopPropagation();" ontouchstart="event.stopPropagation();" onclick="event.stopPropagation(); window.buyMissionUpgrade('hp')">Upgrade (5 QP)</button>`
      : `<button class="btn-action" style="background:#242933; color:#5c6370; font-size:10px; padding:6px; width:100%; border-radius:4px; font-weight:bold; cursor:not-allowed; border: 1px solid #2d3139; opacity: 0.7;" disabled>Lacking QP (5)</button>`;

    let costColorBag = canAffordBag ? "#2ecc71" : "#e74c3c";
    let costColorGold = canAffordGold ? "#2ecc71" : "#e74c3c";
    let costColorAtk = canAffordAtk ? "#2ecc71" : "#e74c3c";
    let costColorHp = canAffordHp ? "#2ecc71" : "#e74c3c";

    let reagents = [
      {
        key: "Eridium Shard",
        cost: 3,
        color: "#8e44ad",
        desc: "Awaken equipment star ratings (rarities)",
      },
      {
        key: "Ancient Core",
        cost: 3,
        color: "#e74c3c",
        desc: "Activate the Altar of Rifts",
      },
      {
        key: "Overlord's Sigil",
        queryKey: "Overlords Sigil",
        cost: 3,
        color: "#1abc9c",
        desc: "Material required for unique artifact tempering",
      },
      {
        key: "Gacha Key",
        cost: 27,
        color: "#f1c40f",
        desc: "Roll standard vending crate",
      },
      {
        key: "Catalyst Core",
        cost: 3,
        color: "#2ecc71",
        desc: "Lock & re-roll item properties",
      },
      {
        key: "Astral Essence",
        cost: 27,
        color: "#9b59b6",
        desc: "Infuse powerful gear enchantments",
      },
      {
        key: "Double XP Elixir",
        cost: 10,
        color: "#a855f7",
        desc: "Doubles monster EXP gains (+100% EXP)",
      },
      {
        key: "Double Drop Elixir",
        cost: 12,
        color: "#22c55e",
        desc: "Doubles global drop rate multiplier (+100%)",
      },
      {
        key: "Drop Quality Elixir",
        cost: 15,
        color: "#3b82f6",
        desc: "Boosts drop quality checks (+50% Qly)",
      },
    ];

    let reagentsHtml = reagents
      .map((r) => {
        let isAfford = tokenBalance >= r.cost;
        let costColor = isAfford ? "#2ecc71" : "#e74c3c";
        let btnClass = isAfford ? "" : "disabled";

        let iconHtml = r.key.includes("Elixir")
          ? window.getUseIconHtml(r.key, 24)
          : window.getEtcIconHtml(r.key, 24);
        iconHtml = iconHtml
          .replace("margin-right: 12px;", "margin-right: 4px;")
          .replace("margin-right: 8px;", "margin-right: 4px;");

        let finalKey = r.queryKey || r.key;
        let ownedCount =
          window.inventory.ETC[r.key] || window.inventory.USE[r.key] || 0;

        return `
            <div class="merchant-shelf-row" style="display:flex; flex-direction:column; justify-content:space-between; border-radius:6px; padding:10px; gap:8px;"
                 onmouseenter="window.showMissionShopItemTooltip(event, '${finalKey}')"
                 ontouchstart="window.showMissionShopItemTooltip(event, '${finalKey}')"
                 onmouseleave="window.hideTooltip()">
                <div style="display:flex; align-items:center; gap:8px; text-align:left; position:relative; z-index:2;">
                    <div style="flex-shrink:0;">${iconHtml}</div>
                    <div style="min-width:0; flex:1;">
                        <strong style="color:${r.color}; font-size:11.5px; display:block; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; text-shadow:0 0 8px ${r.color}35;">${r.key}</strong>
                        <span style="font-size:9px; color:#aaa; font-family:monospace;">Owned: ${ownedCount}</span>
                    </div>
                </div>
                <div style="display:flex; justify-content:space-between; align-items:center; position:relative; z-index:4; border-top:1px dashed rgba(255,255,255,0.06); padding-top:6px; margin-top:2px;">
                                <span style="color:${costColor}; font-weight:bold; font-size:11px; font-family:monospace;">${r.cost} QP</span>
                    <button class="btn-action" style="font-size:9.5px; padding:4px 8px; border-radius:4px; ${isAfford ? "background:" + r.color + "; color:" + (r.color === "#f1c40f" ? "#111" : "#fff") + "; border: 1px solid #fff;" : "background:#222; color:#555; border:1px solid #333; cursor:not-allowed;"}" ${isAfford ? "" : "disabled"}
                            onpointerdown="event.stopPropagation();"
                            ontouchstart="event.stopPropagation();"
                            onclick="event.stopPropagation(); window.buyMissionItem('${finalKey}', ${r.cost})">
                        Buy
                    </button>
                </div>
            </div>
          `;
      })
      .join("");

    contentHtml = `
      <div style="display:flex; flex-direction:column; gap:12px;">
          <!-- UPGRADE GRID -->
                    <div style="background:#111; border:1.5px solid #2ecc7180; border-radius:8px; padding:12px; box-shadow:0 4px 15px rgba(0,0,0,0.5);">
                        <strong style="color:#2ecc71; font-size:12px; display:block; margin-bottom:4px; text-transform:uppercase; letter-spacing:0.5px;">🎖️ PERMANENT UPGRADES</strong>
                        <span style="font-size:9.5px; color:#aaa; display:block; margin-bottom:10px; line-height:1.4;">These bonuses persist permanently and are NOT reset upon Prestige Ascension.</span>

              <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap:8px;">
                                <!-- Satchel -->
                                <div class="sink-slate-panel" style="border: 1.5px solid #3498db50; border-radius:8px; padding:10px; background:linear-gradient(180deg, #131720 0%, #0b0e14 100%); display:flex; flex-direction:column; justify-content:space-between; min-height:175px; position:relative;">
                                    <!-- Price Badge -->
                                    <span style="position: absolute; top: 6px; right: 36px; background: rgba(52, 152, 219, 0.15); border: 1px solid #3498db80; color: ${costColorBag}; font-family: monospace; font-size: 9.5px; font-weight: bold; padding: 2px 6px; border-radius: 4px; box-shadow: 0 0 6px rgba(52, 152, 219, 0.2); z-index: 2;">${costBag} QP</span>
                                    <div>
                                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px; padding-right:45px;">
                                            <strong style="color:#3498db; font-size:11px;">Dimensional Satchel</strong>
                                            <div style="width:24px; height:24px; background:#000; border:1px solid #3498db; border-radius:4px; display:flex; align-items:center; justify-content:center; position:absolute; right:10px; top:10px; z-index:1;">
                                                ${satchelSvg}
                                            </div>
                                        </div>
                                        <div style="font-size:9px; color:#aaa; margin-bottom:6px; line-height:1.35; white-space:normal;">Expands unequipped bag limits by +10 slots per rank.</div>
                                        <div style="background:rgba(0,0,0,0.35); border:1px solid #222; border-radius:4px; padding:4px; font-size:9px; font-family:monospace; margin-bottom:8px; line-height:1.2; text-align:left;">
                                            <span style="color:#888;">CAPACITY:</span><br>
                                            ${lvlBag * 10} ➔ <span style="color:#2ecc71; font-weight:bold;">${(lvlBag + 1) * 10}</span>
                                        </div>
                                    </div>
                                    ${bagBtnHtml}
                                </div>

                                <!-- Midas -->
                                <div class="sink-slate-panel" style="border: 1.5px solid #f1c40f50; border-radius:8px; padding:10px; background:linear-gradient(180deg, #131720 0%, #0b0e14 100%); display:flex; flex-direction:column; justify-content:space-between; min-height:175px; position:relative;">
                                    <!-- Price Badge -->
                                    <span style="position: absolute; top: 6px; right: 36px; background: rgba(241, 196, 15, 0.15); border: 1px solid #f1c40f80; color: ${costColorGold}; font-family: monospace; font-size: 9.5px; font-weight: bold; padding: 2px 6px; border-radius: 4px; box-shadow: 0 0 6px rgba(241, 196, 15, 0.2); z-index: 2;">5 QP</span>
                                    <div>
                                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px; padding-right:45px;">
                                            <strong style="color:#f1c40f; font-size:11px;">Midas Training</strong>
                                            <div style="width:24px; height:24px; background:#000; border:1px solid #f1c40f; border-radius:4px; display:flex; align-items:center; justify-content:center; position:absolute; right:10px; top:10px; z-index:1;">
                                                ${midasSvg}
                                            </div>
                                        </div>
                                        <div style="font-size:9px; color:#aaa; margin-bottom:6px; line-height:1.35; white-space:normal;">Permanently increases global Gold drop multiplier.</div>
                                        <div style="background:rgba(0,0,0,0.35); border:1px solid #222; border-radius:4px; padding:4px; font-size:9px; font-family:monospace; margin-bottom:8px; line-height:1.2; text-align:left;">
                                            <span style="color:#888;">GOLD MULT:</span><br>
                                            +${lvlGold * 5}% ➔ <span style="color:#2ecc71; font-weight:bold;">+${(lvlGold + 1) * 5}%</span>
                                        </div>
                                    </div>
                                    ${goldBtnHtml}
                                </div>

                                <!-- Gladiator -->
                                <div class="sink-slate-panel" style="border: 1.5px solid #e74c3c50; border-radius:8px; padding:10px; background:linear-gradient(180deg, #131720 0%, #0b0e14 100%); display:flex; flex-direction:column; justify-content:space-between; min-height:175px; position:relative;">
                                    <!-- Price Badge -->
                                    <span style="position: absolute; top: 6px; right: 36px; background: rgba(231, 76, 60, 0.15); border: 1px solid #e74c3c80; color: ${costColorAtk}; font-family: monospace; font-size: 9.5px; font-weight: bold; padding: 2px 6px; border-radius: 4px; box-shadow: 0 0 6px rgba(231, 76, 60, 0.2); z-index: 2;">5 QP</span>
                                    <div>
                                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px; padding-right:45px;">
                                            <strong style="color:#e74c3c; font-size:11px;">Gladiator Mastery</strong>
                                            <div style="width:24px; height:24px; background:#000; border:1px solid #e74c3c; border-radius:4px; display:flex; align-items:center; justify-content:center; position:absolute; right:10px; top:10px; z-index:1;">
                                                ${gladiatorSvg}
                                            </div>
                                        </div>
                                        <div style="font-size:9px; color:#aaa; margin-bottom:6px; line-height:1.35; white-space:normal;">Permanently increases global raw Attack power.</div>
                                        <div style="background:rgba(0,0,0,0.35); border:1px solid #222; border-radius:4px; padding:4px; font-size:9px; font-family:monospace; margin-bottom:8px; line-height:1.2; text-align:left;">
                                            <span style="color:#888;">ATTACK:</span><br>
                                            +${lvlAtk * 2}% ➔ <span style="color:#2ecc71; font-weight:bold;">+${(lvlAtk + 1) * 2}%</span>
                                        </div>
                                    </div>
                                    ${atkBtnHtml}
                                </div>

                                <!-- HP / Constitution -->
                                <div class="sink-slate-panel" style="border: 1.5px solid #3498db50; border-radius:8px; padding:10px; background:linear-gradient(180deg, #131720 0%, #0b0e14 100%); display:flex; flex-direction:column; justify-content:space-between; min-height:175px; position:relative;">
                                    <!-- Price Badge -->
                                    <span style="position: absolute; top: 6px; right: 36px; background: rgba(52, 152, 219, 0.15); border: 1px solid #3498db80; color: ${costColorHp}; font-family: monospace; font-size: 9.5px; font-weight: bold; padding: 2px 6px; border-radius: 4px; box-shadow: 0 0 6px rgba(52, 152, 219, 0.2); z-index: 2;">5 QP</span>
                                    <div>
                                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px; padding-right:45px;">
                                            <strong style="color:#3498db; font-size:11px;">Iron Constitution</strong>
                                            <div style="width:24px; height:24px; background:#000; border:1px solid #3498db; border-radius:4px; display:flex; align-items:center; justify-content:center; position:absolute; right:10px; top:10px; z-index:1;">
                                                ${constitutionSvg}
                                            </div>
                                        </div>
                                        <div style="font-size:9px; color:#aaa; margin-bottom:6px; line-height:1.35; white-space:normal;">Permanently increases global raw Maximum HP.</div>
                                        <div style="background:rgba(0,0,0,0.35); border:1px solid #222; border-radius:4px; padding:4px; font-size:9px; font-family:monospace; margin-bottom:8px; line-height:1.2; text-align:left;">
                                            <span style="color:#888;">MAX HEALTH:</span><br>
                                            +${lvlHp * 3}% ➔ <span style="color:#2ecc71; font-weight:bold;">+${(lvlHp + 1) * 3}%</span>
                                        </div>
                                    </div>
                                    ${hpBtnHtml}
                                </div>
                            </div>
          </div>

          <!-- REAGENTS BOARD -->
          <div style="background:#111; border:1px solid #3498db80; border-radius:8px; padding:12px; box-shadow:0 4px 15px rgba(0,0,0,0.5);">
              <strong style="color:#3498db; font-size:12px; display:block; margin-bottom:8px; text-transform:uppercase; letter-spacing:0.5px;">💎 CONSUMABLES & REAGENTS</strong>
              <div class="merchant-shelves-grid">
                  ${reagentsHtml}
              </div>
          </div>
      </div>
    `;
  }

  contentEl.innerHTML = `
      ${tabHeaderHtml}

      <!-- Quest Points Balance Bar -->
      <div style="background:#111; border:1px solid #333; padding:8px; border-radius:6px; margin-bottom:12px; display:flex; justify-content:space-between; align-items:center; font-family:monospace; font-size:11px;">
          <span>Quest Points:</span>
          <strong style="color:#f1c40f; font-size:13px;" id="mission-point-lbl">${tokenBalance} QP</strong>
      </div>

      ${contentHtml}
    `;

  if (currentTab === "BOARD") {
    // Dynamic countdown timer calculations locked to Pacific Time (PST/PDT)
    let now = Date.now();
    let ptNow = window.getPacificTimeNow(now);

    // Next midnight in Pacific Time
    let nextMidnightPt = new Date(
      ptNow.getFullYear(),
      ptNow.getMonth(),
      ptNow.getDate() + 1,
      0,
      0,
      0,
      0,
    );
    let dailyLeftMs = nextMidnightPt.getTime() - ptNow.getTime();

    let dH = Math.floor(dailyLeftMs / 3600000);
    let dM = Math.floor((dailyLeftMs % 3600000) / 60000);
    let dTimerEl = document.getElementById("daily-timer-val");
    if (dTimerEl) dTimerEl.innerText = `${dH}h ${dM}m left`;

    // Next Monday 12:00 AM in Pacific Time
    let dayOfWeek = ptNow.getDay();
    let daysToMonday = (8 - dayOfWeek) % 7;
    if (daysToMonday === 0) daysToMonday = 7;
    let nextMondayPt = new Date(
      ptNow.getFullYear(),
      ptNow.getMonth(),
      ptNow.getDate() + daysToMonday,
      0,
      0,
      0,
      0,
    );
    let weeklyLeftMs = nextMondayPt.getTime() - ptNow.getTime();

    let wD = Math.floor(weeklyLeftMs / 86400000);
    let wH = Math.floor((weeklyLeftMs % 86400000) / 3600000);
    let wTimerEl = document.getElementById("weekly-timer-val");
    if (wTimerEl) wTimerEl.innerText = `${wD}d ${wH}h left`;
  }
};

// --- DYNAMIC RECENT LOGS & SHOWCASE SYSTEM ---
window.gachaShowcaseItems = [];

window.initGachaShowcase = function () {
  if (window.gachaShowcaseItems.length > 0) return;

  let stageScale =
    Math.floor(((window.playerStats.lifetimePeakStage || 1) - 1) / 10) + 1;
  if (stageScale < 6) stageScale = 6; // High levels to showcase cool stat-lines

  let types = [
    "weapon",
    "subweapon",
    "helmet",
    "chest",
    "leggings",
    "overall",
    "boots",
  ];

  for (let i = 0; i < 12; i++) {
    let rVal = Math.random();
    let item;

    if (rVal < 0.35) {
      // 35% chance to showcase a random Unique Relic or Weapon
      let subR = Math.random();
      if (subR < 0.4) {
        // Artifact Relic
        item = window.createItemObject("artifact", 3, stageScale, 0);
      } else {
        // Uber Unique Weapon/Armor/Sub-weapon
        let uniqueTypes = ["weapon", "subweapon", "boots", "helmet"];
        let chosenType =
          uniqueTypes[Math.floor(Math.random() * uniqueTypes.length)];
        item = window.createItemObject(chosenType, 5, stageScale, 5);

        if (chosenType === "weapon") {
          let weapons = ["staff", "sword", "singularity", "maelstrom"];
          let selected = weapons[Math.floor(Math.random() * weapons.length)];
          if (selected === "staff") {
            item.isUniqueStaff = true;
            item.noun = "Phoenix Staff";
            item.setName = null;
            item.name = `🔥 Phoenix Ignition Staff (Lv. ${stageScale})`;
            item.desc =
              "Launches penetrating fireballs that deal 25% Attack damage (3s Cooldown).";
          } else if (selected === "sword") {
            item.isUniqueSword = true;
            item.noun = "Sanguine Reaver";
            item.setName = null;
            item.name = `🩸 Crimson Sanguine Reaver (Lv. ${stageScale})`;
            item.desc =
              "Strikes apply stacking Bleed (Max 5). Strikes at max stacks triggers Rupture, siphoning 10% Max HP.";
          } else if (selected === "singularity") {
            item.isUniqueSingularity = true;
            item.noun = "Singularity Greatsword";
            item.setName = null;
            item.name = `🌌 Void-Sovereign Greatsword (Lv. ${stageScale})`;
            item.desc =
              "Glows for 7s every 30s. Tap during window to enter 5s Storing state, then detonates spatial collapse.";
          } else {
            item.isUniqueMaelstrom = true;
            item.noun = "Maelstrom Glaive";
            item.setName = null;
            item.name = `🌪️ Maelstrom Gale-Glaive (Lv. ${stageScale})`;
            item.desc =
              "Overkill damage cleaves on next spawn. Critical strikes have 25% chance to project piercing gales.";
          }
        } else if (chosenType === "subweapon") {
          let subs = ["aegis", "watch", "chronicle"];
          let selected = subs[Math.floor(Math.random() * subs.length)];
          if (selected === "aegis") {
            item.subType = "shield";
            item.isUniqueAegis = true;
            item.noun = "Void-Warped Aegis";
            item.setName = null;
            item.name = `🛡️ Void-Warped Bulwark (Lv. ${stageScale})`;
            item.desc =
              "Blocks trigger gravity blasts scaling with Defense. Can be absorbed into Singularity vortex.";
          } else if (selected === "watch") {
            item.subType = "tome";
            item.isUniqueWatch = true;
            item.noun = "Chronos Pocket-Watch";
            item.setName = null;
            item.name = `⏳ Chronos Dial-Watch (Lv. ${stageScale})`;
            item.desc =
              "Triggers 4s Temporal Fracture every 20s. Accelerates attack speeds by 15% and slows enemies by 25%.";
          } else {
            item.subType = "tome";
            item.isUniqueChronicle = true;
            item.noun = "Chronicle of the Ascended";
            item.setName = null;
            item.name = `📖 Chronicle of past Lives (Lv. ${stageScale})`;
            item.desc =
              "Boosts XP gain by +200% and bypasses level locks while below 75% peak level.";
          }
        } else if (chosenType === "boots") {
          item.isUniqueWarpCore = true;
          item.noun = "Warp-Core Greaves";
          item.setName = null;
          item.name = `⚡ Warp-Core Greaves (Lv. ${stageScale})`;
          item.desc =
            "While below 85% Peak Stage: +150% sprint speed, and kills count as 2.";
        } else {
          item.isUniqueTempest = true;
          item.noun = "Crown of Tempests";
          item.setName = null;
          item.name = `👑 Crown of crackling Tempests (Lv. ${stageScale})`;
          item.desc =
            "Taking damage has 15% chance to call thunderbolt dealing 150% Attack power and stuns.";
        }
      }
    } else if (rVal < 0.65) {
      // 30% chance for a 5★ Mythic Item
      let chosenType = types[Math.floor(Math.random() * types.length)];
      item = window.createItemObject(chosenType, 5, stageScale, 5);
    } else {
      // 35% chance for a 4★ Legendary Item
      let chosenType = types[Math.floor(Math.random() * types.length)];
      item = window.createItemObject(chosenType, 4, stageScale, 4);
    }

    item.id = 999000 + i;
    window.recalculateItemStats(item);
    window.frozenItemDb[item.id] = item;
    window.gachaShowcaseItems.push(item);
  }
};

window.renderGachaShowcaseMarquee = function (forceRefresh = false) {
  let track = document.getElementById("gacha-showcase-marquee");
  if (!track) return;

  let now = Date.now();
  if (!window.lastGachaShowcaseRotationTime) {
    window.lastGachaShowcaseRotationTime = now;
  }

  // Rotate batch every 75 seconds (matching the marquee crawl)
  let shouldRotate = now - window.lastGachaShowcaseRotationTime >= 75000;

  if (window.gachaShowcaseItems.length === 0 || shouldRotate || forceRefresh) {
    // Purge previous showcase IDs from frozenItemDb to prevent memory leakage
    if (window.gachaShowcaseItems.length > 0) {
      window.gachaShowcaseItems.forEach((item) => {
        delete window.frozenItemDb[item.id];
      });
      window.gachaShowcaseItems = [];
    }

    window.initGachaShowcase(); // Spawns a fresh batch of 12 items on IDs 999000-999011
    window.lastGachaShowcaseRotationTime = now;

    // Only write to DOM when items are actually regenerated (prevents stutter/flicker)
    let combinedItems = [
      ...window.gachaShowcaseItems,
      ...window.gachaShowcaseItems,
    ];
    track.innerHTML = combinedItems
      .map((item) => {
        let col = window.getTierColor(item.statsRolled);
        let shortName = item.name.replace(
          /⭐ UNIQUE |(Common|Rare|Magic|Epic|Legendary|Mythic) /g,
          "",
        );
        let iconHtml = window.getEquipIconHtml(item, 18);
        return `
            <span style="display:inline-flex; align-items:center; gap:4px; color:${col}; font-weight:bold; font-size:10px; cursor:help; margin: 0 8px; vertical-align:middle;"
                  onmouseenter="window.showInventoryTooltip(event, ${item.id})"
                  ontouchstart="window.showInventoryTooltip(event, ${item.id})"
                  onmouseleave="window.hideTooltip()">
                ${iconHtml}
                <span>${shortName}</span>
            </span>
        `;
      })
      .join("");
  }
};

window.updateGachaCustomScrollbar = function () {
  let list = document.getElementById("gacha-recent-list");
  let thumb = document.getElementById("gacha-custom-scrollbar-thumb");
  let track = document.getElementById("gacha-custom-scrollbar-track");
  if (!list || !thumb || !track) return;

  let scrollHeight = list.scrollHeight;
  let clientHeight = list.clientHeight;
  let scrollTop = list.scrollTop;

  if (scrollHeight <= clientHeight) {
    track.style.display = "none";
    return;
  } else {
    track.style.display = "block";
  }

  let trackHeight = track.clientHeight;
  let thumbHeight = Math.max(24, (clientHeight / scrollHeight) * trackHeight);
  thumb.style.height = thumbHeight + "px";

  let maxScrollTop = scrollHeight - clientHeight;
  let maxThumbTop = trackHeight - thumbHeight;
  let thumbTop = (scrollTop / maxScrollTop) * maxThumbTop;
  thumb.style.top = thumbTop + "px";
};

window.updateGachaRecentList = function () {
  let listEl = document.getElementById("gacha-recent-list");
  if (!listEl) return;

  // Render local history template
  let renderItemRow = (item, playerName = "You") => {
    let col = window.getTierColor(item.statsRolled);
    let starDisplay =
      item.statsRolled === "UNIQUE" ? "UNIQUE" : `${item.statsRolled}★`;
    let shortName = item.name.replace(
      /⭐ UNIQUE |(Common|Rare|Magic|Epic|Legendary|Mythic) /g,
      "",
    );

    // Distinguish players with dedicated name tag styling
    let isSelf =
      playerName === "You" ||
      playerName === (window.playerStats.playerName || "Guest");
    let nameCol = isSelf ? "#ffd700" : "#00d2ff"; // Gold for self, Bright Cyber Cyan for other players
    let displayName = isSelf ? "You" : window.escapeHTML(playerName);

    // Draw micro icon inside rows
    let iconHtml = window.getEquipIconHtml(item, 24);

    return `
        <div style="background:#07030b; border: 1px solid #222; border-left: 3.5px solid ${col} !important; border-radius:6px; padding:6px 8px; display:flex; justify-content:space-between; align-items:center; cursor:help; font-family:sans-serif; gap:8px; position:relative; box-shadow: 0 2px 4px rgba(0,0,0,0.5);"
             onmouseenter="window.showInventoryTooltip(event, ${item.id})"
             ontouchstart="window.showInventoryTooltip(event, ${item.id})"
             onmouseleave="window.hideTooltip()">
            <div style="display:flex; align-items:center; gap:6px; min-width:0; flex:1;">
                <div style="flex-shrink:0;">${iconHtml}</div>
                <div style="min-width:0; flex:1; text-align:left;">
                    <span style="color:#888; font-size:8px; display:block; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">[<span style="color:${nameCol}; font-weight:bold;">${displayName}</span>] rolled:</span>
                    <span style="color:${col}; font-weight:bold; font-size:10px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; display:block;">${shortName}</span>
                </div>
            </div>
            <span style="color:#666; font-size:9px; font-family:monospace; font-weight:bold; flex-shrink:0;">${starDisplay}</span>
        </div>
    `;
  };

  // Throttled fetch implementation: Only hit network once every 10 seconds to eliminate infinite-loop flickering!
  let now = Date.now();
  if (
    window.GAME_SERVER_URL &&
    (!window.lastGachaRecentFetchTime ||
      now - window.lastGachaRecentFetchTime >= 10000)
  ) {
    window.lastGachaRecentFetchTime = now;
    fetch(`${window.GAME_SERVER_URL}/api/gacha/global-pulls`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.pulls && data.pulls.length > 0) {
          window.lastGachaRecentPullsData = data.pulls; // Cache server pulls locally
          data.pulls.forEach((pull) => {
            if (pull.item) {
              window.frozenItemDb[pull.item.id] = pull.item;
            }
          });
          renderList();
        }
      })
      .catch((err) => {
        console.log(
          "Global pulls offline, falling back to local history:",
          err,
        );
        renderList();
      });
  } else {
    renderList();
  }

  function renderList() {
    if (
      window.lastGachaRecentPullsData &&
      window.lastGachaRecentPullsData.length > 0
    ) {
      let globalHtml = window.lastGachaRecentPullsData
        .map((pull) => renderItemRow(pull.item, pull.playerName || "Player"))
        .join("");
      listEl.innerHTML = globalHtml;
    } else {
      window.playerStats.gachaHistory = window.playerStats.gachaHistory || [];
      let localHtml = window.playerStats.gachaHistory
        .map((item) => renderItemRow(item, "You"))
        .join("");
      if (localHtml) {
        listEl.innerHTML = localHtml;
      } else {
        listEl.innerHTML = `<div style="color:#666; text-align:center; padding-top:40px; font-size:10px; font-style:italic; line-height: 1.4; white-space:normal;">No recent pulls.<br>Crank the handle inside the dispensary!</div>`;
      }
    }
    // Update custom scrollbar immediately
    setTimeout(() => {
      if (typeof window.updateGachaCustomScrollbar === "function") {
        window.updateGachaCustomScrollbar();
      }
    }, 50);
  }
};

// --- UNBOXING ANIMATIONS AND ENGAGING REWARD FLOWS ---

window.openDailyRewardSack = function (specificName) {
  let itemToConsume = specificName || "Clan Reward Sack";
  let owned = window.inventory.USE[itemToConsume] || 0;
  if (owned <= 0) return;

  let maxBag = window.getMaxBagSlots();
  if (window.inventory.EQUIP.length >= maxBag) {
    window.pushHeaderToast("❌ Equipment bag is full!", "#e74c3c");
    return;
  }

  // Consume 1
  window.inventory.USE[itemToConsume]--;
  if (window.inventory.USE[itemToConsume] === 0) {
    delete window.inventory.USE[itemToConsume];
  }

  window.setPauseState(true);

  // Determine rewards (Standardized Daily QP and randomized pool rolls)
  window.playerStats.missionTokens =
    (window.playerStats.missionTokens || 0) + 1;

  // Always give a piece of equipment at your lifetime peak stage
  let pCurrent = window.resolvePlayerStats();
  let types = [
    "weapon",
    "subweapon",
    "helmet",
    "chest",
    "leggings",
    "overall",
    "boots",
  ];
  let chosenType = types[Math.floor(Math.random() * types.length)];

  let statLinesCount = 0;
  let luckMultiplier = pCurrent.qly;
  let roll = Math.random() * 100;
  let chance5 = luckMultiplier >= 2.0 ? 0.02 * luckMultiplier : 0;
  let chance4 = luckMultiplier >= 1.5 ? 0.16 * luckMultiplier : 0;
  if (roll < chance5) statLinesCount = 5;
  else if (roll < chance5 + chance4) statLinesCount = 4;
  else if (roll < 0.8 * luckMultiplier) statLinesCount = 3;
  else if (roll < 4.0 * luckMultiplier) statLinesCount = 2;
  else if (roll < 15.0 * luckMultiplier) statLinesCount = 1;
  else statLinesCount = 0;

  let stageLvl = Math.max(
    1,
    Math.floor(((window.playerStats.lifetimePeakStage || 1) - 1) / 10) + 1,
  );
  let newEquip = window.createItemObject(
    chosenType,
    statLinesCount,
    stageLvl,
    0,
  );

  window.inventory.EQUIP.push(newEquip);
  window.frozenItemDb[newEquip.id] = JSON.parse(JSON.stringify(newEquip));

  // Play opening sound safely after the item is successfully initialized
  if (
    window.SoundManager &&
    typeof window.SoundManager.playLootDrop === "function"
  ) {
    window.SoundManager.playLootDrop(newEquip.statsRolled);
  } else if (window.SoundManager) {
    window.SoundManager.play("fairy");
  }

  const sackPool = [
    {
      name: "Monster Soul",
      qty: 75,
      weight: 30,
      color: "#888888",
      type: "etc",
    },
    {
      name: "Luminous Soul",
      qty: 2,
      weight: 15,
      color: "#ffb6c1",
      type: "etc",
    },
    { name: "Rare Scrap", qty: 10, weight: 15, color: "#3498db", type: "etc" },
    { name: "Magic Scrap", qty: 6, weight: 12, color: "#9b59b6", type: "etc" },
    { name: "Epic Scrap", qty: 3, weight: 8, color: "#e67e22", type: "etc" },
    { name: "Attack Elixir", qty: 1, weight: 6, color: "#2ecc71", type: "use" },
    {
      name: "Vitality Elixir",
      qty: 1,
      weight: 6,
      color: "#e74c3c",
      type: "use",
    },
    {
      name: "Armored Elixir",
      qty: 1,
      weight: 6,
      color: "#3498db",
      type: "use",
    },
    { name: "Haste Elixir", qty: 1, weight: 6, color: "#f1c40f", type: "use" },
    { name: "Ancient Core", qty: 1, weight: 2, color: "#e74c3c", type: "etc" },
    {
      name: "Overlord's Sigil",
      qty: 1,
      weight: 2,
      color: "#1abc9c",
      type: "etc",
    },
    { name: "Eridium Shard", qty: 1, weight: 2, color: "#8e44ad", type: "etc" },
  ];

  function rollFromPool() {
    let totalWeight = sackPool.reduce((sum, item) => sum + item.weight, 0);
    let r = Math.random() * totalWeight;
    let accumulated = 0;
    for (let item of sackPool) {
      accumulated += item.weight;
      if (r <= accumulated) return item;
    }
    return sackPool[0];
  }

  let receivedRewards = [];

  // Add the guaranteed equipment!
  receivedRewards.push({
    name: newEquip.name,
    qty: 1,
    color: window.getTierColor(newEquip.statsRolled),
    type: "equip",
    item: newEquip,
  });

  // Roll 1: 100% chance
  let reward1 = rollFromPool();
  receivedRewards.push(reward1);

  // 5% chance to find a Monster Card Sack in any Daily/Guild Reward Sack
  if (Math.random() < 0.05) {
    window.addUseDrop("Monster Card Sack", 1);
    receivedRewards.push({
      name: "Monster Card Sack",
      qty: 1,
      color: "#a855f7",
      type: "use",
    });
  }

  // Roll 2: 20% chance
  let hasRoll2 = Math.random() < 0.2;
  if (hasRoll2) {
    let reward2 = rollFromPool();
    receivedRewards.push(reward2);

    // Roll 3: 5% chance (only if Roll 2 succeeds)
    let hasRoll3 = Math.random() < 0.05;
    if (hasRoll3) {
      let reward3 = rollFromPool();
      receivedRewards.push(reward3);
    }
  }

  // Credit rewards
  receivedRewards.forEach((r) => {
    if (r.type === "use") {
      window.addUseDrop(r.name, r.qty, true);
    } else if (r.type === "etc") {
      window.addEtcDrop(r.name, r.qty, true);
    }
  });

  // Create cool opening overlay card
  let overlay = document.createElement("div");
  overlay.id = "sack-opening-overlay";
  overlay.style.position = "fixed";
  overlay.style.top = "0";
  overlay.style.left = "0";
  overlay.style.width = "100%";
  overlay.style.height = "100%";
  overlay.style.backgroundColor = "rgba(0,0,0,0.9)";
  overlay.style.display = "flex";
  overlay.style.justifyContent = "center";
  overlay.style.alignItems = "center";
  overlay.style.zIndex = "45000";
  overlay.style.backdropFilter = "blur(8px)";
  document.body.appendChild(overlay);

  // Spawn nice canvas particles on the screen
  let cvs = document.getElementById("gameCanvas");
  let w = cvs ? cvs.width : 750;
  let h = cvs ? cvs.height : 250;
  for (let i = 0; i < 40; i++) {
    let angle = Math.random() * Math.PI * 2;
    let vel = window.randFloat(3, 8);
    window.particles.push(
      window.ParticlePool.get(
        w / 2,
        h / 2,
        Math.cos(angle) * vel,
        Math.sin(angle) * vel - 2,
        window.randFloat(2, 5),
        window.getTierColor(newEquip.statsRolled),
        1,
        window.randInt(30, 50),
      ),
    );
  }

  overlay.innerHTML = `
          <style>
            .sack-anim-container {
              display: flex;
              justify-content: center;
              align-items: center;
              height: 180px;
              margin-bottom: 10px;
            }
            .sack-svg {
                        animation: sackShake 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
                        overflow: visible !important;
                      }
            .sack-string {
              animation: stringUntie 0.4s cubic-bezier(0.25, 0.8, 0.25, 1) forwards;
              animation-delay: 0.42s;
            }
            .sack-neck {
              animation: neckOpen 0.5s cubic-bezier(0.25, 0.8, 0.25, 1.25) forwards;
              animation-delay: 0.44s;
            }
            .sparkle {
              opacity: 0;
              animation: sparkleUp 0.8s cubic-bezier(0.25, 1, 0.5, 1) forwards;
              animation-delay: 0.5s;
              transform-origin: 50px 42px;
            }
            .s1 { --dx: 0px; --dy: -38px; --ds: 1.4; }
            .s2 { --dx: -28px; --dy: -28px; --ds: 1.2; }
            .s3 { --dx: 28px; --dy: -28px; --ds: 1.2; }
            .s4 { --dx: -14px; --dy: -42px; --ds: 1.1; }
            .s5 { --dx: 14px; --dy: -42px; --ds: 1.1; }

            @keyframes sackShake {
              0%, 100% { transform: rotate(0deg) scale(1); }
              15% { transform: rotate(-8deg) scale(1.08); }
              30% { transform: rotate(9deg) scale(1.08); }
              45% { transform: rotate(-9deg) scale(1.08); }
              60% { transform: rotate(6deg) scale(1.04); }
              75% { transform: rotate(-4deg) scale(1.02); }
              90% { transform: rotate(2deg) scale(1.01); }
            }
            @keyframes stringUntie {
              0% { transform: translateY(0) scale(1); opacity: 1; }
              100% { transform: translateY(14px) scale(0.5); opacity: 0; }
            }
            @keyframes neckOpen {
              0% { transform: scaleX(1) scaleY(1); }
              100% { transform: scaleX(1.4) scaleY(0.7) translateY(2px); }
            }
            @keyframes sparkleUp {
              0% { transform: translate(0, 15px) scale(0); opacity: 0; }
              40% { opacity: 1; }
              100% { transform: translate(var(--dx), var(--dy)) scale(var(--ds)); opacity: 0; }
            }
          </style>
          <div style="text-align:center; color:white; animation: toastFadeIn 0.3s ease-out;">
            <div class="sack-anim-container">
              <svg class="sack-svg" width="150" height="150" viewBox="0 0 100 100">
                <!-- Drop Shadow -->
                <ellipse cx="50" cy="92" rx="34" ry="5.5" fill="rgba(0,0,0,0.45)" />

                <!-- Sack Body -->
                <path class="sack-body" d="M30,42 C20,42 12,50 12,72 C12,88 25,92 50,92 C75,92 88,88 88,72 C88,50 80,42 70,42 Z" fill="#d35400" stroke="#000" stroke-width="2.5" />

                <!-- Sack Neck -->
                <g class="sack-neck" style="transform-origin: 50px 42px;">
                  <!-- Left Flap -->
                  <path d="M30,42 L24,25 C28,21 38,20 46,25 L46,42 Z" fill="#e67e22" stroke="#000" stroke-width="2.5" />
                  <!-- Right Flap -->
                  <path d="M70,42 L76,25 C72,21 62,20 54,25 L54,42 Z" fill="#e67e22" stroke="#000" stroke-width="2.5" />
                </g>

                <!-- Tied Cord -->
                <g class="sack-string" style="transform-origin: 50px 42px;">
                  <path d="M28,42 Q50,47 72,42" fill="none" stroke="#f1c40f" stroke-width="3" stroke-linecap="round" />
                  <!-- Bow Knot -->
                  <circle cx="50" cy="43.5" r="3.5" fill="#f1c40f" stroke="#000" stroke-width="1.5" />
                  <path d="M50,43.5 Q42,52 38,55 M50,43.5 Q58,52 62,55" fill="none" stroke="#f1c40f" stroke-width="2.5" stroke-linecap="round" />
                </g>

                <!-- Particle Burst -->
                <g>
                  <path class="sparkle s1" d="M50,25 L50,15 M45,20 L55,20" stroke="#fff" stroke-width="2" stroke-linecap="round" />
                  <path class="sparkle s2" d="M35,30 L31,22 M28,27 L38,25" stroke="#f1c40f" stroke-width="1.5" stroke-linecap="round" />
                  <path class="sparkle s3" d="M65,30 L69,22 M62,25 L72,27" stroke="#f1c40f" stroke-width="1.5" stroke-linecap="round" />
                  <circle class="sparkle s4" cx="42" cy="15" r="2.5" fill="#fff" />
                  <circle class="sparkle s5" cx="58" cy="15" r="2" fill="#fff" />
                </g>
              </svg>
            </div>
            <div style="font-size: 15px; font-weight: 900; color:#f1c40f; letter-spacing: 2px; text-shadow: 0 0 6px rgba(241,196,15,0.3);">UNTYING SACK...</div>
          </div>
        `;

  setTimeout(() => {
    let listHtml = receivedRewards
      .map((r) => {
        let icon = "";
        let hoverEvents = "";
        let escapedName = r.name.replace(/'/g, "\\'");

        if (r.type === "equip") {
          icon = window.getEquipIconHtml(r.item, 28);
          hoverEvents = `
                    onmouseenter="window.showInventoryTooltip(event, ${r.item.id})"
                    onmouseleave="window.hideTooltip()"
                    ontouchstart="window.showInventoryTooltip(event, ${r.item.id})"
                  `;
        } else if (r.type === "use") {
          icon = window.getUseIconHtml(r.name);
          hoverEvents = `
            onmouseenter="window.showUseTooltip(event, '${escapedName}')"
            onmouseleave="window.hideTooltip()"
            ontouchstart="window.showUseTooltip(event, '${escapedName}')"
          `;
        } else {
          icon = window.getEtcIconHtml(r.name);
          hoverEvents = `
            onmouseenter="window.showEtcTooltip(event, '${escapedName}')"
            onmouseleave="window.hideTooltip()"
            ontouchstart="window.showEtcTooltip(event, '${escapedName}')"
          `;
        }
        icon = icon.replace("margin-right: 12px;", "margin-right: 8px;");

        return `
        <div class="bag-item" style="cursor:help; background:#111; border:1px solid #333; border-left: 3px solid ${r.color}; border-radius:4px; padding:8px 12px; display:flex; align-items:center; justify-content:space-between; margin-bottom:6px;" ${hoverEvents}>
          <div style="display:flex; align-items:center; text-align:left;">
            ${icon}
            <div style="display:flex; flex-direction:column;">
              <strong style="color:${r.color}; font-size:12px;">${r.name}</strong>
              ${r.type === "equip" ? `<span style="font-size:9px; color:#888;">${r.item.statsRolled === "UNIQUE" ? "UNIQUE" : r.item.statsRolled + "★"} Equipment (Lv. ${r.item.stageLevel})</span>` : ""}
            </div>
          </div>
          <strong style="color:#fff; font-size:13px; font-family:monospace;">+${r.qty}</strong>
        </div>
      `;
      })
      .join("");

    overlay.innerHTML = `
          <div style="background:#1a1a1a; border:2px solid #f1c40f; border-radius:8px; width:95%; max-width:400px; box-shadow:0 10px 30px rgba(0,0,0,0.95); animation: toastFadeIn 0.3s ease-out; overflow:hidden;">
            <div style="background:#0b0f12; border-bottom:1px solid #333; padding:12px 15px; text-align:center;">
              <h3 style="margin:0; color:#f1c40f; font-size:15px; font-weight:bold; letter-spacing:1.5px; text-transform:uppercase;">🎒 CLAN SACK OPENED!</h3>
            </div>
            <div style="background:#111; border:1px solid #222; border-radius:6px; padding:8px; display:flex; align-items:center; justify-content:space-between; margin-bottom:12px;">
                                        <div style="display:flex; align-items:center;">
                                          <span style="background:rgba(241,196,15,0.1); border:1px solid #f1c40f; border-radius:4px; padding:4px; display:inline-flex; width:32px; height:32px; align-items:center; justify-content:center; font-size:16px;">
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#f1c40f" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
                                          </span>
                                          <strong style="color:#f1c40f; font-size:12.5px; margin-left:8px;">Quest Points</strong>
                                        </div>
                                        <strong style="color:#fff; font-size:13px; font-family:monospace;">+1 QP</strong>
                                      </div>

              <div style="font-size:10px; color:#aaa; font-weight:bold; text-transform:uppercase; margin-bottom:6px; letter-spacing:0.5px;">📦 Loot & Equipment Yield (Hover for Info):</div>
              <div>
                ${listHtml}
              </div>
            </div>
            <div style="background:#0b0f12; border-top:1px solid #333; padding:12px; text-align:center;">
              <button onclick="document.getElementById('sack-opening-overlay').remove(); window.setPauseState(false); window.updateUI(); window.renderInventory();" style="background:#f1c40f; color:#000; border:none; padding:10px; font-weight:bold; font-size:12px; border-radius:4px; cursor:pointer; width:100%;">Claim Loot</button>
            </div>
          </div>
        `;
  }, 1000);
};

window.openWeeklyRewardSack = function (specificName) {
  let itemToConsume = specificName || "Clan Weekly Sack";
  let owned = window.inventory.USE[itemToConsume] || 0;
  if (owned <= 0) return;

  let maxBag = window.getMaxBagSlots();
  if (window.inventory.ARTIFACT.length >= maxBag) {
    window.pushHeaderToast("❌ Cannot open: Artifact bag is full!", "#e74c3c");
    return;
  }

  // Consume 1
  window.inventory.USE[itemToConsume]--;
  if (window.inventory.USE[itemToConsume] === 0) {
    delete window.inventory.USE[itemToConsume];
  }

  // Play opening sound
  if (
    window.SoundManager &&
    typeof window.SoundManager.playLootDrop === "function"
  ) {
    window.SoundManager.playLootDrop(5); // Treats weekly grand chests as 5★ Mythic sound swells
  } else if (window.SoundManager) {
    window.SoundManager.play("revive");
  }
  window.setPauseState(true);

  // Determine rewards (Guaranteed high value MP, Core, Sigil, Shard, and Scraps!)
  window.playerStats.missionTokens =
    (window.playerStats.missionTokens || 0) + 3;

  let clanLvl = window.playerStats.clanLevel || 1;

  // Base quantities scale up dynamically based on Clan Level!
  let coreQty = 1 + Math.floor(clanLvl * 0.1);
  let sigilQty = 1 + Math.floor(clanLvl * 0.05);
  let shardQty = 1 + Math.floor(clanLvl * 0.2);
  let scrapQty = 3 + Math.floor(clanLvl * 0.5);

  let receivedRewards = [
    { name: "Ancient Core", qty: coreQty, color: "#e74c3c", type: "etc" },
    { name: "Overlord's Sigil", qty: sigilQty, color: "#1abc9c", type: "etc" },
    { name: "Eridium Shard", qty: shardQty, color: "#8e44ad", type: "etc" },
    { name: "Legendary Scrap", qty: scrapQty, color: "#f1c40f", type: "etc" },
  ];

  // 10% epic chance to find a Monster Card Sack in any Weekly/Guild Weekly Sack
  if (Math.random() < 0.1) {
    window.addUseDrop("Monster Card Sack", 1);
    receivedRewards.push({
      name: "Monster Card Sack",
      qty: 1,
      color: "#a855f7",
      type: "use",
    });
  }

  // Double XP Potion (Chance scales up with Clan level)
  let xpChance = Math.min(0.6, 0.1 + clanLvl * 0.04);
  if (Math.random() < xpChance) {
    receivedRewards.push({
      name: "Double XP Elixir",
      qty: 1 + Math.floor(clanLvl / 10),
      color: "#a855f7",
      type: "use",
    });
  }

  // Double Drop Potion (Chance scales up with Clan level)
  let dropChance = Math.min(0.5, 0.05 + clanLvl * 0.03);
  if (Math.random() < dropChance) {
    receivedRewards.push({
      name: "Double Drop Elixir",
      qty: 1 + Math.floor(clanLvl / 15),
      color: "#22c55e",
      type: "use",
    });
  }

  // Drop Quality Potion (Chance scales up with Clan level)
  let qlyChance = Math.min(0.4, 0.03 + clanLvl * 0.02);
  if (Math.random() < qlyChance) {
    receivedRewards.push({
      name: "Drop Quality Elixir",
      qty: 1,
      color: "#3b82f6",
      type: "use",
    });
  }

  // Advanced reagents unlocked inside Sacks for Clans Level 10+
  if (clanLvl >= 10) {
    let coreChance = Math.min(0.4, 0.05 + (clanLvl - 10) * 0.03);
    if (Math.random() < coreChance) {
      receivedRewards.push({
        name: "Catalyst Core",
        qty: 1,
        color: "#2ecc71",
        type: "etc",
      });
    }

    let essenceChance = Math.min(0.3, 0.03 + (clanLvl - 10) * 0.02);
    if (Math.random() < essenceChance) {
      receivedRewards.push({
        name: "Astral Essence",
        qty: 1,
        color: "#9b59b6",
        type: "etc",
      });
    }
  }

  // 5% chance for a random Artifact
  if (Math.random() < 0.05) {
    let peak = window.playerStats.lifetimePeakStage || 1;
    let stageLvl = Math.max(1, Math.floor((peak - 1) / 10) + 1);
    let art = window.createItemObject("artifact", 3, stageLvl, 0);
    window.inventory.ARTIFACT.push(art);
    window.frozenItemDb[art.id] = JSON.parse(JSON.stringify(art));
    receivedRewards.push({
      name: art.name,
      qty: 1,
      color: "#1abc9c",
      type: "equip",
      item: art,
    });
  }

  // Credit rewards safely once
  receivedRewards.forEach((r) => {
    if (r.type === "use") {
      window.addUseDrop(r.name, r.qty, true);
    } else if (r.type === "etc") {
      window.addEtcDrop(r.name, r.qty, true);
    }
  });

  // Create cool opening overlay card
  let overlay = document.createElement("div");
  overlay.id = "sack-opening-overlay";
  overlay.style.position = "fixed";
  overlay.style.top = "0";
  overlay.style.left = "0";
  overlay.style.width = "100%";
  overlay.style.height = "100%";
  overlay.style.backgroundColor = "rgba(0,0,0,0.9)";
  overlay.style.display = "flex";
  overlay.style.justifyContent = "center";
  overlay.style.alignItems = "center";
  overlay.style.zIndex = "45000";
  overlay.style.backdropFilter = "blur(8px)";
  document.body.appendChild(overlay);

  // Spawn nice canvas particles on the screen
  let cvs = document.getElementById("gameCanvas");
  let w = cvs ? cvs.width : 750;
  let h = cvs ? cvs.height : 250;
  for (let i = 0; i < 60; i++) {
    let angle = Math.random() * Math.PI * 2;
    let vel = window.randFloat(4, 10);
    window.particles.push(
      window.ParticlePool.get(
        w / 2,
        h / 2,
        Math.cos(angle) * vel,
        Math.sin(angle) * vel - 2,
        window.randFloat(2.5, 6),
        "#9b59b6",
        1,
        window.randInt(40, 60),
      ),
    );
  }

  // Draw the animation phase first
  overlay.innerHTML = `
    <style>
      .sack-anim-container {
        display: flex;
        justify-content: center;
        align-items: center;
        height: 180px;
        margin-bottom: 10px;
      }
      .sack-svg {
                  animation: sackShake 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
                  overflow: visible !important;
                }
      .sack-string {
        animation: stringUntie 0.4s cubic-bezier(0.25, 0.8, 0.25, 1) forwards;
        animation-delay: 0.42s;
      }
      .sack-neck {
        animation: neckOpen 0.5s cubic-bezier(0.25, 0.8, 0.25, 1.25) forwards;
        animation-delay: 0.44s;
      }
      .sparkle {
        opacity: 0;
        animation: sparkleUp 0.8s cubic-bezier(0.25, 1, 0.5, 1) forwards;
        animation-delay: 0.5s;
        transform-origin: 50px 42px;
      }
      .s1 { --dx: 0px; --dy: -38px; --ds: 1.4; }
      .s2 { --dx: -28px; --dy: -28px; --ds: 1.2; }
      .s3 { --dx: 28px; --dy: -28px; --ds: 1.2; }
      .s4 { --dx: -14px; --dy: -42px; --ds: 1.1; }
      .s5 { --dx: 14px; --dy: -42px; --ds: 1.1; }

      @keyframes sackShake {
        0%, 100% { transform: rotate(0deg) scale(1); }
        15% { transform: rotate(-8deg) scale(1.08); }
        30% { transform: rotate(9deg) scale(1.08); }
        45% { transform: rotate(-9deg) scale(1.08); }
        60% { transform: rotate(6deg) scale(1.04); }
        75% { transform: rotate(-4deg) scale(1.02); }
        90% { transform: rotate(2deg) scale(1.01); }
      }
      @keyframes stringUntie {
        0% { transform: translateY(0) scale(1); opacity: 1; }
        100% { transform: translateY(14px) scale(0.5); opacity: 0; }
      }
      @keyframes neckOpen {
        0% { transform: scaleX(1) scaleY(1); }
        100% { transform: scaleX(1.4) scaleY(0.7) translateY(2px); }
      }
      @keyframes sparkleUp {
        0% { transform: translate(0, 15px) scale(0); opacity: 0; }
        40% { opacity: 1; }
        100% { transform: translate(var(--dx), var(--dy)) scale(var(--ds)); opacity: 0; }
      }
    </style>
    <div style="text-align:center; color:white; animation: toastFadeIn 0.3s ease-out;">
      <div class="sack-anim-container">
        <svg class="sack-svg" width="150" height="150" viewBox="0 0 100 100">
          <!-- Drop Shadow -->
          <ellipse cx="50" cy="92" rx="34" ry="5.5" fill="rgba(0,0,0,0.45)" />

          <!-- Sack Body -->
          <path class="sack-body" d="M30,42 C20,42 12,50 12,72 C12,88 25,92 50,92 C75,92 88,88 88,72 C88,50 80,42 70,42 Z" fill="#6c5ce7" stroke="#000" stroke-width="2.5" />

          <!-- Sack Neck -->
          <g class="sack-neck" style="transform-origin: 50px 42px;">
            <!-- Left Flap -->
            <path d="M30,42 L24,25 C28,21 38,20 46,25 L46,42 Z" fill="#a29bfe" stroke="#000" stroke-width="2.5" />
            <!-- Right Flap -->
            <path d="M70,42 L76,25 C72,21 62,20 54,25 L54,42 Z" fill="#a29bfe" stroke="#000" stroke-width="2.5" />
          </g>

          <!-- Sealed Rope with Wax Seal -->
          <g class="sack-string" style="transform-origin: 50px 42px;">
            <path d="M28,42 Q50,47 72,42" fill="none" stroke="#ffd32a" stroke-width="3" stroke-linecap="round" />
            <!-- Imperial Wax Seal -->
            <circle cx="50" cy="43.5" r="5.5" fill="#ff5e57" stroke="#000" stroke-width="1.5" />
            <path d="M48,42.5 L52,45 M52,42.5 L48,45" stroke="#fff" stroke-width="1" />
          </g>

          <!-- Astral Particle Burst -->
          <g>
            <path class="sparkle s1" d="M50,25 L50,15 M45,20 L55,20" stroke="#fff" stroke-width="2" stroke-linecap="round" />
            <path class="sparkle s2" d="M35,30 L31,22 M28,27 L38,25" stroke="#a29bfe" stroke-width="1.5" stroke-linecap="round" />
            <path class="sparkle s3" d="M65,30 L69,22 M62,25 L72,27" stroke="#a29bfe" stroke-width="1.5" stroke-linecap="round" />
            <circle class="sparkle s4" cx="42" cy="15" r="2.5" fill="#fff" />
            <circle class="sparkle s5" cx="58" cy="15" r="2" fill="#fff" />
          </g>
        </svg>
      </div>
      <div style="font-size: 15px; font-weight: 900; color:#a29bfe; letter-spacing: 2px; text-shadow: 0 0 6px rgba(162,155,254,0.3);">BREAKING SEAL OF THE ASCENDED...</div>
    </div>
  `;

  setTimeout(() => {
    let listHtml = receivedRewards
      .map((r) => {
        let icon = "";
        let hoverEvents = "";
        let escapedName = r.name.replace(/'/g, "\\'");

        if (r.type === "equip") {
          icon = window.getArtifactIconHtml
            ? window.getArtifactIconHtml(r.item.trait, 28)
            : window.getUseIconHtml(r.name);
          hoverEvents = `
            onmouseenter="window.showInventoryTooltip(event, ${r.item.id})"
            onmouseleave="window.hideTooltip()"
            ontouchstart="window.showInventoryTooltip(event, ${r.item.id})"
          `;
        } else if (r.type === "use") {
          icon = window.getUseIconHtml(r.name);
          hoverEvents = `
            onmouseenter="window.showUseTooltip(event, '${escapedName}')"
            onmouseleave="window.hideTooltip()"
            ontouchstart="window.showUseTooltip(event, '${escapedName}')"
          `;
        } else {
          icon = window.getEtcIconHtml(r.name);
          hoverEvents = `
            onmouseenter="window.showEtcTooltip(event, '${escapedName}')"
            onmouseleave="window.hideTooltip()"
            ontouchstart="window.showEtcTooltip(event, '${escapedName}')"
          `;
        }
        icon = icon.replace("margin-right: 12px;", "margin-right: 8px;");

        return `
        <div class="bag-item" style="cursor:help; background:#111; border:1px solid #333; border-left: 3px solid ${r.color}; border-radius:4px; padding:8px 12px; display:flex; align-items:center; justify-content:space-between; margin-bottom:6px;" ${hoverEvents}>
          <div style="display:flex; align-items:center; text-align:left;">
            ${icon}
            <div style="display:flex; flex-direction:column;">
              <strong style="color:${r.color}; font-size:12px;">${r.name}</strong>
              ${r.type === "equip" ? `<span style="font-size:9px; color:#888;">Artifact Relic (Lv. ${r.item.stageLevel})</span>` : ""}
            </div>
          </div>
          <strong style="color:#fff; font-size:13px; font-family:monospace;">+${r.qty}</strong>
        </div>
      `;
      })
      .join("");

    overlay.innerHTML = `
          <div style="background:#1a1a1a; border:2px solid #9b59b6; border-radius:8px; width:95%; max-width:400px; box-shadow:0 10px 30px rgba(0,0,0,0.95); animation: toastFadeIn 0.3s ease-out; overflow:hidden;">
                        <div style="background:#0b0f12; border-top: 1px solid #333; padding:12px 15px; text-align:center;">
                          <h3 style="margin:0; color:#9b59b6; font-size:15px; font-weight:bold; letter-spacing:1.5px; text-transform:uppercase;">💼 CLAN WEEKLY SACK OPENED! (Lv. ${clanLvl})</h3>
                        </div>
            <div style="background:#111; border:1px solid #222; border-radius:6px; padding:8px; display:flex; align-items:center; justify-content:space-between; margin-bottom:12px;">
                                        <div style="display:flex; align-items:center;">
                                          <span style="background:rgba(155,89,182,0.1); border:1px solid #9b59b6; border-radius:4px; padding:4px; display:inline-flex; width:32px; height:32px; align-items:center; justify-content:center; font-size:16px;">
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9b59b6" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
                                          </span>
                                          <strong style="color:#9b59b6; font-size:12.5px; margin-left:8px;">Quest Points</strong>
                                        </div>
                                        <strong style="color:#fff; font-size:13px; font-family:monospace;">+3 QP</strong>
                                      </div>

              <div style="font-size:10px; color:#aaa; font-weight:bold; text-transform:uppercase; margin-bottom:6px; letter-spacing:0.5px;">📦 Guaranteed Relic Yields (Hover for Info):</div>
              <div>
                ${listHtml}
              </div>
            </div>
            <div style="background:#0b0f12; border-top:1px solid #333; padding:12px; text-align:center;">
              <button onclick="document.getElementById('sack-opening-overlay').remove(); window.setPauseState(false); window.updateUI(); window.renderInventory();" style="background:#9b59b6; color:#fff; border:none; padding:10px; font-weight:bold; font-size:12px; border-radius:4px; cursor:pointer; width:100%;">Claim Relics</button>
            </div>
          </div>
        `;
  }, 1000);
};

// ==========================================================================
// --- ROYAL MAILBOX CLIENT ENGINE ---
// ==========================================================================

window.toggleMailbox = function () {
  let modal = document.getElementById("mailbox-modal");
  if (!modal) return;

  if (modal.style.display === "none" || modal.style.display === "") {
    window.hideTooltip();
    modal.style.display = "block";
    window.fetchMailboxData();
  } else {
    modal.style.display = "none";
    window.hideTooltip();
  }
};

window.fetchMailboxData = function () {
  const listEl = document.getElementById("mailbox-list");
  if (!listEl) return;

  const userId = window.getGameUserId ? window.getGameUserId() : "guest_local";
  listEl.innerHTML = `<div style="color:#aaa; text-align:center; padding: 20px 0; font-size:11px;">Checking incoming transmissions...</div>`;

  const claimedMailIds = window.playerStats.claimedMailIds || [];

  if (!window.GAME_SERVER_URL) {
    // Local / Offline fallback allows players to still receive their Weekly Clan Supply Crate!
    let localMail =
      typeof window.getWeeklyClanMail === "function"
        ? window.getWeeklyClanMail()
        : null;
    if (localMail) {
      window.renderMailboxItems([localMail]);
      window.updateMailboxBadge(!localMail.claimed);
    } else {
      listEl.innerHTML = `<div style="color:#666; text-align:center; padding: 20px 0; font-size:11px; font-style:italic;">Mailbox empty (Offline mode).</div>`;
    }
    return;
  }

  fetch(`${window.GAME_SERVER_URL}/api/mailbox`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, claimedMailIds }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success && data.mailbox) {
        let mailList = [...data.mailbox];
        let localMail = window.getWeeklyClanMail();
        if (localMail) {
          if (!mailList.some((m) => m.id === localMail.id)) {
            mailList.unshift(localMail);
          }
        }
        window.renderMailboxItems(mailList);
        const hasUnclaimed = mailList.some((m) => !m.claimed);
        window.updateMailboxBadge(hasUnclaimed);
      } else {
        let localMail = window.getWeeklyClanMail();
        if (localMail) {
          window.renderMailboxItems([localMail]);
          window.updateMailboxBadge(!localMail.claimed);
        } else {
          listEl.innerHTML = `<div style="color:#e74c3c; text-align:center; padding: 20px 0; font-size:11px;">Error loading mailbox data.</div>`;
        }
      }
    })
    .catch((err) => {
      let localMail = window.getWeeklyClanMail();
      if (localMail) {
        window.renderMailboxItems([localMail]);
        window.updateMailboxBadge(!localMail.claimed);
      } else {
        listEl.innerHTML = `<div style="color:#e74c3c; text-align:center; padding: 20px 0; font-size:11px;">Could not connect to the mail server.</div>`;
      }
    });
};

window.renderMailboxItems = function (mailbox) {
  const listEl = document.getElementById("mailbox-list");
  if (!listEl) return;

  if (mailbox.length === 0) {
    listEl.innerHTML = `<div style="color:#666; text-align:center; padding: 20px 0; font-size:11px; font-style:italic;">Your mailbox is currently empty.</div>`;
    return;
  }

  listEl.innerHTML = mailbox
    .map((mail) => {
      let buttonHtml = "";
      if (mail.claimed) {
        buttonHtml = `<span style="color:#7f8c8d; font-weight:bold; font-size:11px;">Claimed ✓</span>`;
      } else {
        buttonHtml = `<button class="btn-action" style="background:#e74c3c; color:white; font-size:11px; padding:4px 10px;" onclick="window.claimMailReward('${mail.id}')">Claim</button>`;
      }

      window.justClaimedMailIds = window.justClaimedMailIds || new Set();
      let isJustClaimed = window.justClaimedMailIds.has(mail.id);
      let stampClass = "stamp-base";
      if (isJustClaimed) {
        stampClass += " stamp-slam";
        window.justClaimedMailIds.delete(mail.id);
      }
      let claimedOverlay = mail.claimed
        ? `<div style="position:absolute; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.68); backdrop-filter: blur(1px); display:flex; justify-content:center; align-items:center; border-radius:6px; z-index:5;"><span class="${stampClass}" style="--final-rot:-5deg; color:#e74c3c; font-size:16px; font-weight:900; border: 2.5px solid #e74c3c; padding: 4px 14px; border-radius:4px; font-family:Impact,sans-serif; text-shadow: 0 1px 2px #000; letter-spacing:1.5px; box-shadow: 0 0 12px rgba(231,76,60,0.35);">CLAIMED</span></div>`
        : "";

      // Build highly optimized, stylized HTML badges using native visual generators
      let rewardsHtml = "";

      if (mail.rewards.coins) {
        rewardsHtml += `
        <div style="display:inline-flex; align-items:center; background:rgba(241,196,15,0.06); border:1px solid #f1c40f; padding:3px 8px; border-radius:4px; font-family:monospace; font-size:10px; color:#fff; font-weight:bold;">
            <span style="background:rgba(241,196,15,0.18); border-radius:4px; width:22px; height:22px; display:inline-flex; align-items:center; justify-content:center; margin-right:6px; font-size:11px; border:1px solid #d4af37;">🟡</span>
            <span>+${mail.rewards.coins.toLocaleString()} Gold</span>
        </div>
      `;
      }

      if (mail.rewards.etc) {
        Object.keys(mail.rewards.etc).forEach((k) => {
          let iconHtml =
            typeof window.getEtcIconHtml === "function"
              ? window.getEtcIconHtml(k)
              : "📦";
          // Shrink the standard 32px inventory icon down to 22px to fit the compact mailbox layout cleanly
          iconHtml = iconHtml.replace(
            "width: 32px; height: 32px;",
            "width: 22px; height: 22px; padding: 2px; margin-right: 6px;",
          );
          iconHtml = iconHtml.replace(
            "margin-right: 12px;",
            "margin-right: 6px;",
          );

          rewardsHtml += `
          <div style="display:inline-flex; align-items:center; background:rgba(255,255,255,0.015); border:1px solid #374151; padding:3px 8px; border-radius:4px; font-family:monospace; font-size:10px; color:#fff; font-weight:bold;">
              ${iconHtml}
              <span>+${mail.rewards.etc[k]} ${k}</span>
          </div>
        `;
        });
      }

      if (mail.rewards.use) {
        Object.keys(mail.rewards.use).forEach((k) => {
          let iconHtml =
            typeof window.getUseIconHtml === "function"
              ? window.getUseIconHtml(k)
              : "🧪";
          iconHtml = iconHtml.replace(
            "width: 32px; height: 32px;",
            "width: 22px; height: 22px; padding: 2px; margin-right: 6px;",
          );
          iconHtml = iconHtml.replace(
            "margin-right: 12px;",
            "margin-right: 6px;",
          );

          rewardsHtml += `
              <div style="display:inline-flex; align-items:center; background:rgba(255,255,255,0.015); border:1px solid #374151; padding:3px 8px; border-radius:4px; font-family:monospace; font-size:10px; color:#fff; font-weight:bold;">
                  ${iconHtml}
                  <span>+${mail.rewards.use[k]} ${k}</span>
              </div>
            `;
        });
      }

      if (mail.rewards.title) {
        let tKey = mail.rewards.title;
        let tData = window.TITLES_DATA[tKey];
        if (tData) {
          let iconHtml = tData.icon || "";
          let inlineIcon = iconHtml
            .replace('width="14" height="14"', 'width="12" height="12"')
            .replace("margin-right: 3px;", "margin-right: 4px;");
          rewardsHtml += `
              <div style="display:inline-flex; align-items:center; background:rgba(255,0,127,0.06); border:1px solid #ff007f; padding:3px 8px; border-radius:4px; font-family:monospace; font-size:10px; color:#fff; font-weight:bold; box-shadow:0 0 6px rgba(255,0,127,0.15);">
                  ${inlineIcon}
                  <span style="color:#ffb6c1;">Title: [${tData.name}]</span>
              </div>
            `;
        }
      }

      return `
            <div class="bag-item" style="position:relative; border-left: 3px solid #e74c3c; background:#181c22; padding:8px 12px; margin-bottom:0; display:flex; flex-direction:column; gap:4px; text-align:left; cursor:default;">
                ${claimedOverlay}
                <div style="display:flex; justify-content:space-between; align-items:center; width:100%;">
                    <strong style="color:#e74c3c; font-size:12.5px;">${mail.title}</strong>
                    <div>${buttonHtml}</div>
                </div>
          <div style="font-size:11px; color:#ddd; white-space:normal; line-height:1.4; margin-bottom:4px;">${mail.message}</div>
          <div style="background:#0c0f12; border:1px solid #222; border-radius:4px; padding:8px 6px; display:flex; flex-wrap:wrap; gap:6px; align-items:center;">
              ${rewardsHtml}
          </div>
      </div>
    `;
    })
    .join("");
};

window.claimMailReward = function (mailId) {
  window.justClaimedMailIds = window.justClaimedMailIds || new Set();
  window.justClaimedMailIds.add(mailId);

  // Catch client-side weekly clan mail claim
  if (mailId.startsWith("clan_weekly_mail_")) {
    let localMail = window.getWeeklyClanMail();
    if (localMail && !localMail.claimed) {
      window.addUseDrop("Weekly Clan Supply Crate", 1);

      // Mark as claimed in playerStats
      window.playerStats.weeklyClanCrateClaimed = true;

      window.playerStats.claimedMailIds =
        window.playerStats.claimedMailIds || [];
      if (!window.playerStats.claimedMailIds.includes(mailId)) {
        window.playerStats.claimedMailIds.push(mailId);
      }
      if (typeof window.spawnPurchaseCelebration === "function") {
        window.spawnPurchaseCelebration("gacha", "#ffaa00", 5);
      }
      if (window.SoundManager) window.SoundManager.play("revive");
      window.pushHeaderToast("🎁 Weekly Clan Supply Crate Claimed!", "#2ecc71");
      window.updateUI();
      window.renderInventory();
      window.saveGame();
      window.fetchMailboxData();
    }
    return;
  }

  if (!window.GAME_SERVER_URL) return;
  const userId = window.getGameUserId();
  const claimedMailIds = window.playerStats.claimedMailIds || [];

  fetch(`${window.GAME_SERVER_URL}/api/claim-mail`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, mailId, claimedMailIds }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success && data.rewards) {
        const rewards = data.rewards;

        // 1. Claim Gold
        if (rewards.coins) {
          window.addCoins(rewards.coins);
        }

        // 2. Claim Materials
        if (rewards.etc) {
          Object.keys(rewards.etc).forEach((k) => {
            if (typeof window.addEtcDrop === "function") {
              window.addEtcDrop(k, rewards.etc[k]);
            }
          });
        }

        // 3. Claim Consumables
        if (rewards.use) {
          Object.keys(rewards.use).forEach((k) => {
            if (typeof window.addUseDrop === "function") {
              window.addUseDrop(k, rewards.use[k]);
            }
          });
        }

        // 4. Claim Custom Title
        if (rewards.title) {
          let tKey = rewards.title;
          window.playerStats.unlockedTitles =
            window.playerStats.unlockedTitles || [];
          if (!window.playerStats.unlockedTitles.includes(tKey)) {
            window.playerStats.unlockedTitles.push(tKey);
          }
          window.playerStats.equippedTitle = tKey; // Auto-equip it!
        }

        // Register the claimed ID locally on success to prevent double claims if the server restarts
        window.playerStats.claimedMailIds =
          window.playerStats.claimedMailIds || [];
        if (!window.playerStats.claimedMailIds.includes(mailId)) {
          window.playerStats.claimedMailIds.push(mailId);
        }

        // Visual / Audio Feedback
        if (typeof window.spawnPurchaseCelebration === "function") {
          window.spawnPurchaseCelebration("mail", "#e74c3c", 5); // Crimson celebration burst
        }
        if (window.SoundManager) window.SoundManager.play("revive");

        window.pushHeaderToast("🎁 Mailbox Rewards Claimed!", "#2ecc71");

        // Update UI & save the state immediately
        window.updateUI();
        window.renderInventory();
        window.saveGame();

        // Refresh current mailbox state
        window.fetchMailboxData();
      } else {
        window.pushHeaderToast(
          `❌ Error: ${data.error || "Could not claim."}`,
          "#e74c3c",
        );
      }
    })
    .catch((err) => {
      console.error("Mail claim failed:", err);
      window.pushHeaderToast("❌ Connection error claiming reward.", "#e74c3c");
    });
};

window.updateMailboxBadge = function (hasUnclaimed) {
  const badge = document.getElementById("hub-card-mailbox-badge");
  if (badge) {
    badge.style.display = hasUnclaimed ? "inline-block" : "none";
  }
  // Immediately bubble up changes to trigger the main menu indicator
  window.updateHubAlerts();
};

/* --- CUSTOM UI SELECTS & WARDROBE BOUTIQUE --- */
window.toggleCustomSelect = function (id) {
  let select = document.getElementById(id);
  if (!select) return;
  let isActive = select.classList.contains("active");

  document.querySelectorAll(".custom-select").forEach((el) => {
    if (el.id !== id) el.classList.remove("active");
  });

  if (isActive) {
    select.classList.remove("active");
  } else {
    select.classList.add("active");
  }
};

window.selectCustomForgeStation = function (val) {
  let select = document.getElementById("custom-forge-select");
  if (select) {
    select.classList.remove("active");
    let textSpan = document.getElementById("custom-forge-select-text");
    if (textSpan) {
      textSpan.innerText =
        val === "blacksmith"
          ? "🛡️ Blacksmith Station (Attune / Level / Tier)"
          : "🔮 Mystical Enchanter (Infuse / Purge)";
    }
    select.querySelectorAll(".custom-select-option").forEach((opt) => {
      if (opt.getAttribute("data-value") === val) {
        opt.classList.add("selected");
      } else {
        opt.classList.remove("selected");
      }
    });
  }
  window.switchForgeStation(val);
};

window.switchForgeStation = function (val) {
  let blacksmithModes = document.getElementById("blacksmith-modes");
  let enchanterModes = document.getElementById("enchanter-modes");
  if (val === "blacksmith") {
    if (blacksmithModes)
      blacksmithModes.style.setProperty("display", "flex", "important");
    if (enchanterModes)
      enchanterModes.style.setProperty("display", "none", "important");
    if (typeof window.setForgeMode === "function")
      window.setForgeMode("temper");
  } else if (val === "enchanter") {
    if (blacksmithModes)
      blacksmithModes.style.setProperty("display", "none", "important");
    if (enchanterModes)
      enchanterModes.style.setProperty("display", "flex", "important");
    if (typeof window.setForgeMode === "function")
      window.setForgeMode("enchant");
  }
};

window.selectedBoutiqueSkinKey =
  window.selectedBoutiqueSkinKey ||
  window.playerStats.cosmeticSkin ||
  "default";
window.selectedBoutiqueCostumeKey =
  window.selectedBoutiqueCostumeKey ||
  window.playerStats.equippedCostume ||
  "knight";

// Replace your existing switchBoutiqueCategory function in ui.js
window.switchBoutiqueCategory = function (cat) {
  window.state.boutiqueCategory = cat;

  // Force update button visual states
  document
    .querySelectorAll(".sub-tab-btn")
    .forEach((btn) => btn.classList.remove("active"));

  let btnCostumes = document.getElementById("btn-boutique-costumes");
  let btnDyes = document.getElementById("btn-boutique-dyes");

  if (cat === "costumes") {
    if (btnCostumes) btnCostumes.classList.add("active");
  } else {
    if (btnDyes) btnDyes.classList.add("active");
  }

  window.renderBoutiqueSkins();
};

window.renderBoutiqueSkins = function () {
  let el = document.getElementById("boutique-skins-list");
  let showcaseCanvas = document.getElementById("wardrobe-preview-canvas");
  let showcaseName = document.getElementById("showcase-skin-name");
  let showcaseDesc = document.getElementById("showcase-skin-desc");
  let showcasePrice = document.getElementById("showcase-skin-price");
  let showcaseBtn = document.getElementById("showcase-action-btn");
  if (
    !el ||
    !showcaseCanvas ||
    !showcaseName ||
    !showcaseDesc ||
    !showcasePrice ||
    !showcaseBtn
  )
    return;

  let p = window.playerStats;
  let cat = window.state.boutiqueCategory || "costumes";

  let selSkinKey = window.selectedBoutiqueSkinKey;
  let selCostumeKey = window.selectedBoutiqueCostumeKey;

  let isCostumesTab = cat === "costumes";
  let activeLabelEl = document.getElementById("boutique-list-header");
  if (activeLabelEl) {
    activeLabelEl.innerHTML = `
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display: inline-block; vertical-align: middle">
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 1 1-7.6-11.4 8.38 8.38 0 0 1 3.8.9L21 4.5z"/>
      </svg>
      Available ${isCostumesTab ? "Costumes style" : "Colors dye"}
    `;
  }

  let selItem = isCostumesTab
    ? window.COSMETIC_COSTUMES[selCostumeKey]
    : window.COSMETIC_SKINS[selSkinKey];

  // 1. Render the top Showcase Chamber details
  showcaseName.innerText = selItem.name;
  showcaseName.style.color = selItem.color;
  showcaseDesc.innerText = selItem.desc;

  let showcaseChamber = document.getElementById("boutique-showcase-chamber");
  let previewWrapper =
    document.getElementById("boutique-preview-wrapper") ||
    (showcaseChamber ? showcaseChamber.querySelector("div") : null);
  if (showcaseChamber) {
    showcaseChamber.style.border = `2px solid ${selItem.color}`;
    showcaseChamber.style.background = `radial-gradient(circle at 50% 50%, ${window.hexToRgba(selItem.color, 0.12)} 0%, #0c0e12 100%)`;
    showcaseChamber.style.boxShadow = `0 4px 15px ${window.hexToRgba(selItem.color, 0.15)}, inset 0 0 10px ${window.hexToRgba(selItem.color, 0.1)}`;
  }
  if (previewWrapper) {
    previewWrapper.style.border = `1.5px solid ${selItem.color}`;
    previewWrapper.style.boxShadow = `inset 0 0 8px #000, 0 0 8px ${window.hexToRgba(selItem.color, 0.2)}`;
  }

  // Draw showcase preview combining selected Costume & Color Dye
  let sCtx = showcaseCanvas.getContext("2d");
  sCtx.clearRect(0, 0, showcaseCanvas.width, showcaseCanvas.height);
  sCtx.imageSmoothingEnabled = false;
  window.drawSingleHero(
    sCtx,
    40,
    50,
    1.5,
    window.equippedSlots,
    {
      cosmeticSkin: selSkinKey,
      equippedCostume: selCostumeKey,
      frenzyTimer: 0,
    },
    0,
    {
      slashFrame: false,
      deathAnimationTimer: 0,
      isMainHero: false,
    },
  );

  // Handle showcase button state
  let unlocked = isCostumesTab
    ? p.unlockedCostumes || ["knight"]
    : p.unlockedSkins || ["default"];
  let activeKey = isCostumesTab
    ? p.equippedCostume || "knight"
    : p.cosmeticSkin || "default";
  let targetKey = isCostumesTab ? selCostumeKey : selSkinKey;

  let isUnlocked = unlocked.includes(targetKey);
  let isActive = activeKey === targetKey;

  if (isActive) {
    showcasePrice.innerText = "Active Outfit";
    showcasePrice.style.color = "#bdc3c7";
    showcaseBtn.innerText = "ACTIVE";
    showcaseBtn.disabled = true;
    showcaseBtn.style.background = "#334155";
    showcaseBtn.style.color = "#64748b";
    showcaseBtn.style.cursor = "not-allowed";
    showcaseBtn.style.boxShadow = "none";
  } else if (isUnlocked) {
    showcasePrice.innerText = "Unlocked";
    showcasePrice.style.color = "#2ecc71";
    showcaseBtn.innerText = isCostumesTab ? "EQUIP COSTUME" : "EQUIP COLOR";
    showcaseBtn.disabled = false;
    showcaseBtn.style.background = "#2ecc71";
    showcaseBtn.style.color = "#fff";
    showcaseBtn.style.cursor = "pointer";
    showcaseBtn.style.boxShadow = "0 0 10px rgba(46, 204, 113, 0.4)";
  } else {
    let currencyLabel = selItem.currency === "Luminous Soul" ? "Souls" : "Gold";
    let owned =
      selItem.currency === "Luminous Soul"
        ? window.inventory.ETC["Luminous Soul"] || 0
        : p.coins;

    let canAfford = false;
    if (selItem.currency === "Luminous Soul") {
      canAfford = owned >= selItem.cost;
    } else {
      canAfford = BigNum.from(owned).gte(selItem.cost);
    }

    showcasePrice.innerText = `${selItem.cost} ${currencyLabel}`;
    showcasePrice.style.color = canAfford ? "#f1c40f" : "#e74c3c";
    showcaseBtn.innerText = `UNLOCK`;
    showcaseBtn.disabled = false; // Always keep the button clickable so the error toast fires
    if (canAfford) {
      showcaseBtn.style.background = selItem.color;
      showcaseBtn.style.color = selItem.color === "#f1c40f" ? "#111" : "#fff";
      showcaseBtn.style.cursor = "pointer";
      showcaseBtn.style.boxShadow = `0 0 12px ${selItem.color}55`;
    } else {
      showcaseBtn.style.background = "#333";
      showcaseBtn.style.color = "#666";
      showcaseBtn.style.cursor = "not-allowed";
      showcaseBtn.style.boxShadow = "none";
    }
  }

  // 2. Render the grid below
  let html = "";
  let datasource = isCostumesTab
    ? window.COSMETIC_COSTUMES
    : window.COSMETIC_SKINS;

  Object.keys(datasource).forEach((key) => {
    let item = datasource[key];
    let cardUnlocked = unlocked.includes(key);
    let cardActive = activeKey === key;
    let isSelected = (isCostumesTab ? selCostumeKey : selSkinKey) === key;

    let borderGlowStyle = isSelected
      ? `border: 2px solid ${item.color}; box-shadow: 0 0 12px ${item.color}45;`
      : `border: 1px solid #333;`;

    let statusText = cardActive
      ? `<span style="color:#2ecc71; font-size:8px; font-weight:bold; display:block; margin-top:2px;">ACTIVE ✓</span>`
      : cardUnlocked
        ? `<span style="color:#aaa; font-size:8px; display:block; margin-top:2px;">UNLOCKED</span>`
        : `<span style="color:${item.color}; font-size:8px; font-weight:bold; display:block; margin-top:2px;">LOCKED</span>`;

    let canvasId = `boutique-item-canvas-${key}`;
    html += `
          <div class="market-card" style="background:#111; ${borderGlowStyle} padding:8px; text-align:center; display:flex; flex-direction:column; align-items:center; cursor:pointer;" onclick="window.selectBoutiqueItem('${key}')">
              <canvas id="${canvasId}" width="40" height="50" style="width:40px; height:50px; background:rgba(0,0,0,0.55); border:1px solid ${isSelected ? item.color : "#222"}; border-radius:4px; display:block; flex-shrink:0; pointer-events:none;"></canvas>
              <strong style="color:${item.color}; font-size:11px; margin-top:4px; display:block; width:100%; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; max-width:110px;">${item.name}</strong>
              ${statusText}
          </div>
        `;
  });

  el.innerHTML = html;

  // Draw previews for the grid cards
  Object.keys(datasource).forEach((key) => {
    let canvas = document.getElementById(`boutique-item-canvas-${key}`);
    if (canvas) {
      let ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.imageSmoothingEnabled = false;

      // When rendering preview cards: Blend that card with your currently active options on the other axis
      let testSkin = isCostumesTab ? selSkinKey : key;
      let testCostume = isCostumesTab ? key : selCostumeKey;

      window.drawSingleHero(
        ctx,
        20,
        21,
        0.7,
        window.equippedSlots,
        {
          cosmeticSkin: testSkin,
          equippedCostume: testCostume,
          frenzyTimer: 0,
        },
        0,
        {
          slashFrame: false,
          deathAnimationTimer: 0,
          isMainHero: false,
        },
      );
    }
  });
};

window.selectBoutiqueItem = function (key) {
  let cat = window.state.boutiqueCategory || "costumes";
  if (cat === "costumes") {
    window.selectedBoutiqueCostumeKey = key;
  } else {
    window.selectedBoutiqueSkinKey = key;
  }
  window.renderBoutiqueSkins();
};

// Map original selectBoutiqueSkin to selectBoutiqueItem for safety
window.selectBoutiqueSkin = function (key) {
  window.selectBoutiqueItem(key);
};

window.handleShowcaseAction = function () {
  let cat = window.state.boutiqueCategory || "costumes";
  if (cat === "costumes") {
    let key = window.selectedBoutiqueCostumeKey || "knight";
    let p = window.playerStats;
    let unlocked = p.unlockedCostumes || ["knight"];
    if (unlocked.includes(key)) {
      window.equipBoutiqueCostume(key);
    } else {
      window.buyBoutiqueCostume(key);
    }
  } else {
    let key = window.selectedBoutiqueSkinKey || "default";
    let p = window.playerStats;
    let unlocked = p.unlockedSkins || ["default"];
    if (unlocked.includes(key)) {
      window.equipBoutiqueSkin(key);
    } else {
      window.buyBoutiqueSkin(key);
    }
  }
};

window.buyBoutiqueCostume = function (costumeKey) {
  let skin = window.COSMETIC_COSTUMES[costumeKey];
  if (!skin) return;

  let p = window.playerStats;
  let unlocked = p.unlockedCostumes || ["knight"];
  if (unlocked.includes(costumeKey)) return;

  let canAfford = false;
  if (skin.currency === "Luminous Soul") {
    let owned = window.inventory.ETC["Luminous Soul"] || 0;
    if (owned >= skin.cost) {
      window.inventory.ETC["Luminous Soul"] -= skin.cost;
      if (window.inventory.ETC["Luminous Soul"] === 0) {
        delete window.inventory.ETC["Luminous Soul"];
      }
      canAfford = true;
    }
  } else {
    let coinsObj = BigNum.from(p.coins);
    if (coinsObj.gte(skin.cost)) {
      p.coins = coinsObj.sub(skin.cost);
      canAfford = true;
    }
  }

  if (!canAfford) {
    window.pushHeaderToast("❌ Cannot afford this costume!", "#e74c3c");
    return;
  }

  p.unlockedCostumes = unlocked;
  p.unlockedCostumes.push(costumeKey);
  p.equippedCostume = costumeKey; // Auto-equip
  window.selectedBoutiqueCostumeKey = costumeKey;

  window.pushHeaderToast(`🎭 Unlocked & Equipped: ${skin.name}!`, "#2ecc71");
  window.pushLog(
    `<span style='color:#ff007f;'>[BOUTIQUE]</span> Unlocked and equipped costume: <span style='color:${skin.color};'>${skin.name}</span>.`,
  );

  if (window.SoundManager) window.SoundManager.play("fairy");
  if (window.spawnPurchaseCelebration) {
    window.spawnPurchaseCelebration("alchemy", skin.color, 4);
  }

  window.updateUI();
  window.renderBoutiqueSkins();
  window.saveGame();
};

window.equipBoutiqueCostume = function (costumeKey) {
  let p = window.playerStats;
  let unlocked = p.unlockedCostumes || ["knight"];
  if (!unlocked.includes(costumeKey)) return;

  p.equippedCostume = costumeKey;
  window.selectedBoutiqueCostumeKey = costumeKey;
  window.pushHeaderToast(
    `🎭 Equipped: ${window.COSMETIC_COSTUMES[costumeKey].name}!`,
    "#2ecc71",
  );
  window.updateUI();
  window.renderBoutiqueSkins();
  window.saveGame();
};

window.buyBoutiqueSkin = function (skinKey) {
  let skin = window.COSMETIC_SKINS[skinKey];
  if (!skin) return;

  let p = window.playerStats;
  let unlocked = p.unlockedSkins || ["default"];
  if (unlocked.includes(skinKey)) return;

  let canAfford = false;
  if (skin.currency === "Luminous Soul") {
    let owned = window.inventory.ETC["Luminous Soul"] || 0;
    if (owned >= skin.cost) {
      window.inventory.ETC["Luminous Soul"] -= skin.cost;
      if (window.inventory.ETC["Luminous Soul"] === 0) {
        delete window.inventory.ETC["Luminous Soul"];
      }
      canAfford = true;
    }
  } else {
    let coinsObj = BigNum.from(p.coins);
    if (coinsObj.gte(skin.cost)) {
      p.coins = coinsObj.sub(skin.cost);
      canAfford = true;
    }
  }

  if (!canAfford) {
    window.pushHeaderToast("❌ Cannot afford this skin!", "#e74c3c");
    return;
  }

  p.unlockedSkins = unlocked;
  p.unlockedSkins.push(skinKey);
  p.cosmeticSkin = skinKey; // Auto-equip
  window.selectedBoutiqueSkinKey = skinKey;

  window.pushHeaderToast(`🎭 Unlocked & Equipped: ${skin.name}!`, "#2ecc71");
  window.pushLog(
    `<span style='color:#ff007f;'>[BOUTIQUE]</span> Unlocked and equipped skin: <span style='color:${skin.color};'>${skin.name}</span>.`,
  );

  if (window.SoundManager) window.SoundManager.play("fairy");
  if (window.spawnPurchaseCelebration) {
    window.spawnPurchaseCelebration("alchemy", skin.color, 4);
  }

  window.updateUI();
  window.renderBoutiqueSkins();
  window.saveGame();
};

window.equipBoutiqueSkin = function (skinKey) {
  let p = window.playerStats;
  let unlocked = p.unlockedSkins || ["default"];
  if (!unlocked.includes(skinKey)) return;

  p.cosmeticSkin = skinKey;
  window.selectedBoutiqueSkinKey = skinKey;
  window.pushHeaderToast(
    `🎭 Equipped: ${window.COSMETIC_SKINS[skinKey].name}!`,
    "#2ecc71",
  );
  window.updateUI();
  window.renderBoutiqueSkins();
  window.saveGame();
};

// Close custom selectors globally when clicking outside
document.addEventListener("pointerdown", function (e) {
  if (!e.target.closest(".custom-select")) {
    document.querySelectorAll(".custom-select").forEach((el) => {
      el.classList.remove("active");
    });
  }
});

window.DAILY_CALENDAR_REWARDS = [
  { day: 1, name: "Gacha Key", qty: 3, color: "#f1c40f", iconType: "etc" },
  {
    day: 2,
    name: "Supernal Attack Elixir",
    qty: 1,
    color: "#2ecc71",
    iconType: "use",
    extra: {
      name: "Supernal Haste Elixir",
      qty: 1,
      color: "#f1c40f",
      type: "use",
    },
  },
  {
    day: 3,
    name: "Catalyst Core",
    qty: 1,
    color: "#2ecc71",
    iconType: "etc",
    extra: { name: "Eridium Shard", qty: 10, color: "#8e44ad", type: "etc" },
  },
  {
    day: 4,
    name: "Daily Reward Sack",
    qty: 2,
    color: "#f1c40f",
    iconType: "use",
  },
  {
    day: 5,
    name: "Overlord's Sigil",
    qty: 1,
    color: "#1abc9c",
    iconType: "etc",
    extra: { name: "Gacha Key", qty: 1, color: "#f1c40f", type: "etc" },
  },
  {
    day: 6,
    name: "Monster Card Sack",
    qty: 2,
    color: "#a855f7",
    iconType: "use",
  },
  {
    day: 7,
    name: "Glimmering Gachapon Key",
    qty: 1,
    color: "#00d2ff",
    iconType: "etc",
    extra: {
      name: "Weekly Reward Sack",
      qty: 1,
      color: "#9b59b6",
      type: "use",
    },
    extraShards: 50,
  },
  {
    day: 8,
    name: "Gacha Key",
    qty: 2,
    color: "#f1c40f",
    iconType: "etc",
    extra: { name: "Eridium Shard", qty: 5, color: "#8e44ad", type: "etc" },
  },
  {
    day: 9,
    name: "Supernal Vitality Elixir",
    qty: 1,
    color: "#e74c3c",
    iconType: "use",
    extra: {
      name: "Supernal Armored Elixir",
      qty: 1,
      color: "#3498db",
      type: "use",
    },
  },
  {
    day: 10,
    name: "Catalyst Core",
    qty: 2,
    color: "#2ecc71",
    iconType: "etc",
    extra: { name: "Eridium Shard", qty: 20, color: "#8e44ad", type: "etc" },
  },
  {
    day: 11,
    name: "Daily Reward Sack",
    qty: 2,
    color: "#f1c40f",
    iconType: "use",
  },
  {
    day: 12,
    name: "Overlord's Sigil",
    qty: 2,
    color: "#1abc9c",
    iconType: "etc",
    extra: { name: "Astral Essence", qty: 5, color: "#9b59b6", type: "etc" },
  },
  {
    day: 13,
    name: "Monster Card Sack",
    qty: 3,
    color: "#a855f7",
    iconType: "use",
  },
  {
    day: 14,
    name: "Glimmering Gachapon Key",
    qty: 2,
    color: "#00d2ff",
    iconType: "etc",
    extra: {
      name: "Weekly Reward Sack",
      qty: 2,
      color: "#9b59b6",
      type: "use",
    },
    extraShards: 100,
  },
];

window.checkDailyCalendar = function () {
  let now = Date.now();
  let ptString = new Date(now).toLocaleString("en-US", {
    timeZone: "America/Los_Angeles",
  });
  let ptDate = new Date(ptString);
  let currentDayStr = ptDate.toLocaleDateString("en-US");

  if (window.playerStats.lastDailyLoginDayStr !== currentDayStr) {
    window.playerStats.loginClaimedToday = false;

    // Evaluate if the consecutive day streak was broken
    if (window.playerStats.lastDailyLoginDayStr) {
      let lastClaimDate = new Date(
        new Date(window.playerStats.lastDailyLoginDayStr).toLocaleString(
          "en-US",
          {
            timeZone: "America/Los_Angeles",
          },
        ),
      );
      lastClaimDate.setHours(0, 0, 0, 0);
      let todayMidnight = new Date(ptDate);
      todayMidnight.setHours(0, 0, 0, 0);

      let diffTime = todayMidnight.getTime() - lastClaimDate.getTime();
      let diffDays = Math.round(diffTime / 86400000);

      if (diffDays > 1) {
        window.playerStats.loginStreak = 0; // Missed a day: reset streak to Day 1
        if (typeof window.pushLog === "function") {
          window.pushLog(
            "<span style='color:#e74c3c;'>[SYSTEM] Day missed. Daily Calendar streak reset to Day 1.</span>",
          );
        }
      }
    }
  }

  let badge = document.getElementById("hub-card-calendar-badge");
  if (badge) {
    badge.style.display = window.playerStats.loginClaimedToday
      ? "none"
      : "inline-block";
  }
};

window.toggleDailyCalendar = function () {
  let modal = document.getElementById("calendar-draggable-window");
  if (modal) {
    modal.remove();
    window.hideTooltip();
    window.setPauseState(false);
  } else {
    window.hideTooltip();
    window.checkDailyCalendar();
    window.setPauseState(true);

    let win = document.createElement("div");
    win.id = "calendar-draggable-window";
    win.className = "draggable-window";
    win.style.width = "375px";

    // Position nicely in view
    let container = document
      .getElementById("game-container")
      .getBoundingClientRect();
    let leftOffset = (window.innerWidth - 375) / 2 - container.left;
    let topOffset =
      window.scrollY + window.innerHeight / 2 - 190 - container.top;
    win.style.left = Math.max(5, leftOffset) + "px";
    win.style.top = Math.max(5, topOffset) + "px";

    win.innerHTML = `
      <div class="draggable-header" id="calendar-win-handle" style="background: linear-gradient(180deg, #181d24 0%, #0d1117 100%);">
          <span>✦ Daily Calendar</span>
          <button onclick="document.getElementById('calendar-draggable-window').remove(); window.setPauseState(false); window.hideTooltip();" style="background:transparent; border:none; color:#e74c3c; font-weight:bold; cursor:pointer; font-size:11px; padding:2px;">[X]</button>
      </div>
      <div class="draggable-content" id="calendar-win-content" style="max-height: 440px; padding: 12px; background:#07030b;">
          <!-- Injected dynamically -->
      </div>
    `;

    document.getElementById("game-container").appendChild(win);
    window.renderDailyCalendar();
    window.makeWindowDraggable(
      win,
      document.getElementById("calendar-win-handle"),
    );
  }
};

window.renderDailyCalendar = function () {
  let contentEl = document.getElementById("calendar-win-content");
  if (!contentEl) return;

  let currentStreak = window.playerStats.loginStreak || 0;
  let claimedToday = window.playerStats.loginClaimedToday;

  let gridHtml = window.DAILY_CALENDAR_REWARDS.map((r, idx) => {
    let dayNum = idx + 1;
    let isCurrent = idx === currentStreak && !claimedToday;
    let isClaimed =
      idx < currentStreak || (idx === currentStreak && claimedToday);

    let borderCol = isCurrent ? r.color : isClaimed ? "#2ecc71" : "#2d3748";
    let opacity = isClaimed ? "opacity:0.4;" : "";
    let background = isCurrent
      ? `background: rgba(${window.hexToRgbValues(r.color)}, 0.1); box-shadow: 0 0 10px ${r.color}33;`
      : isClaimed
        ? `background: rgba(46,204,113,0.03);`
        : `background: #0f111a;`;

    let statusText = isClaimed
      ? `<span style="color:#2ecc71; font-weight:bold; font-size:8.5px; display:block; margin-top:2px;">Claimed ✓</span>`
      : isCurrent
        ? `<span style="color:${r.color}; font-weight:bold; font-size:8.5px; display:block; margin-top:2px; animation: pulseGlow 1.5s infinite;">Claim Now</span>`
        : `<span style="color:#7f8c8d; font-size:8.5px; display:block; margin-top:2px;">Locked</span>`;

    let iconHtml =
      r.iconType === "use"
        ? window.getUseIconHtml(r.name, 28)
        : window.getEtcIconHtml(r.name, 28);
    iconHtml = iconHtml.replace("margin-right: 12px;", "margin-right: 4px;");

    let isMilestone = dayNum === 7 || dayNum === 14;
    let gridSpan = isMilestone ? "grid-column: span 2;" : "";
    let cardHeight = isMilestone ? "height: 80px;" : "height: 105px;";

    // Milestone extra layouts
    let extraRewardsText = "";
    if (isMilestone && r.extra) {
      extraRewardsText = `
        <div style="font-size: 8px; color:#aaa; margin-top:1px;">
          • +${r.extra.qty}x ${r.extra.name.replace(" Reward Sack", " Sack")}<br>
          • +${r.extraShards}x Astral Shards
        </div>
      `;
    } else if (r.extra) {
      extraRewardsText = `
        <div style="font-size: 8px; color:#aaa; margin-top:1px;">
          • +${r.extra.qty}x ${r.extra.name.replace(" Gachapon Key", "").replace(" Elixir", "").replace(" Shard", "")}
        </div>
      `;
    }

    let escapedName = r.name.replace(/'/g, "\\'");
    let hoverEvents =
      r.iconType === "use"
        ? `onmouseenter="window.showUseTooltip(event, '${escapedName}')" ontouchstart="window.showUseTooltip(event, '${escapedName}'); event.stopPropagation();" onmouseleave="window.hideTooltip()"`
        : `onmouseenter="window.showEtcTooltip(event, '${escapedName}')" ontouchstart="window.showEtcTooltip(event, '${escapedName}'); event.stopPropagation();" onmouseleave="window.hideTooltip()"`;

    return `
      <div class="market-card" style="${gridSpan} ${cardHeight} ${background} border: 1.5px solid ${borderCol}; border-radius:8px; padding:6px; display:flex; flex-direction:column; justify-content:center; align-items:center; position:relative; ${opacity}" ${hoverEvents}>
        <span style="font-size:8px; color:#888; text-transform:uppercase; font-weight:900;">Day ${dayNum}</span>
        <div style="display:flex; align-items:center; gap:4px; margin-top:2px;">
          ${iconHtml}
          <div style="text-align:left; min-width: 0;">
            <strong style="color:${r.color}; font-size:10.5px; display:block;">+${r.qty}x ${r.name.replace(" Elixir", "").replace(" Gachapon", "")}</strong>
            ${extraRewardsText}
          </div>
        </div>
        ${statusText}
      </div>
    `;
  }).join("");

  let actionButtonHtml = "";
  if (claimedToday) {
    actionButtonHtml = `
      <button class="btn-action" style="background:#222; border:1px solid #333; color:#555; width:100%; padding:12px; font-weight:bold; cursor:not-allowed;" disabled>
          ✦ Claimed Today
      </button>
    `;
  } else {
    let nextReward = window.DAILY_CALENDAR_REWARDS[currentStreak];
    actionButtonHtml = `
      <button class="btn-action btn-pulse-teal" style="background:linear-gradient(135deg, ${nextReward.color}, #111); width:100%; padding:12px; font-weight:bold; border:1px solid #fff; box-shadow:0 0 10px ${nextReward.color}44;" onclick="window.claimDailyCalendarReward()">
          ✦ Claim Day ${currentStreak + 1}
      </button>
    `;
  }

  contentEl.innerHTML = `
    <div style="text-align:left; background:rgba(0,0,0,0.3); border:1px solid #333; border-radius:6px; padding:10px; margin-bottom:12px; font-size:11px; line-height:1.45;">
      <strong style="color:#df9ffb; display:inline-flex; align-items:center; gap:4px; margin-bottom:4px;">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle; filter: drop-shadow(0 0 2px rgba(155, 89, 182, 0.4));"><path d="M12 2c-.5 5-4 8-8 8 4 0 7.5 3 8 8 .5-5 4-8 8-8-4 0-7.5-3-8-8z"/></svg>
          Humble Sanctuary Calendar
      </strong>
      Login consecutively to claim premium items. Missing a day resets the calendar to Day 1. Day 14 claims loop back infinitely!
    </div>

    <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:6px; margin-bottom:12px; max-height: 240px; overflow-y: auto; padding-right: 4px;">
      ${gridHtml}
    </div>

    ${actionButtonHtml}
  `;
};

window.claimDailyCalendarReward = function () {
  if (window.playerStats.loginClaimedToday) return;

  let streak = window.playerStats.loginStreak || 0;
  let reward = window.DAILY_CALENDAR_REWARDS[streak];
  if (!reward) return;

  let now = Date.now();
  let ptString = new Date(now).toLocaleString("en-US", {
    timeZone: "America/Los_Angeles",
  });
  let ptDate = new Date(ptString);
  let currentDayStr = ptDate.toLocaleDateString("en-US");

  window.playerStats.lastDailyLoginDayStr = currentDayStr;
  window.playerStats.loginClaimedToday = true;

  // 1. Grant main reward
  if (reward.iconType === "use") {
    window.addUseDrop(reward.name, reward.qty);
  } else {
    window.addEtcDrop(reward.name, reward.qty);
  }

  // 2. Grant extra if present
  if (reward.extra) {
    if (reward.extra.type === "use") {
      window.addUseDrop(reward.extra.name, reward.extra.qty);
    } else {
      window.addEtcDrop(reward.extra.name, reward.extra.qty);
    }
  }

  // 3. Grant shards if present
  if (reward.extraShards) {
    window.playerStats.astralShards =
      (window.playerStats.astralShards || 0) + reward.extraShards;
  }

  // 4. Progress streak (consecutive increments, loops to 0 after 13)
  let oldStreak = window.playerStats.loginStreak;
  window.playerStats.loginStreak = (window.playerStats.loginStreak + 1) % 14;

  // Particle feedback burst
  if (window.SoundManager) window.SoundManager.play("revive");
  if (window.spawnPurchaseCelebration) {
    window.spawnPurchaseCelebration("gacha", reward.color, 5);
  }

  let rewardReport = `${reward.qty}x ${reward.name}`;
  if (reward.extra)
    rewardReport += ` and ${reward.extra.qty}x ${reward.extra.name}`;
  if (reward.extraShards)
    rewardReport += ` and ${reward.extraShards}x Astral Shards`;

  window.pushHeaderToast(
    `✦ Claimed Day ${oldStreak + 1}: ${rewardReport}!`,
    reward.color,
  );
  window.pushLog(
    `<strong style="color:${reward.color};">[CALENDAR]</strong> Claimed Day ${oldStreak + 1} rewards: ${rewardReport}.`,
  );

  let win = document.getElementById("calendar-draggable-window");
  if (win) win.remove();
  window.setPauseState(false); // RESUME GAME LOOP
  window.hideTooltip();

  window.updateUI();
  window.saveGame();
};

window.updateHubAlerts = function () {
  // 1. Evaluate Missions
  let dailies = window.playerStats.dailyMissions || [];
  let weeklies = window.playerStats.weeklyMissions || [];
  let dailyClaimable = dailies.some((m) => m.completed && !m.claimed);
  let weeklyClaimable = weeklies.some((m) => m.completed && !m.claimed);
  let dailyMasterClaimable =
    !window.playerStats.dailyRewardClaimed &&
    dailies.filter((m) => m.completed).length >= 5;
  let weeklyMasterClaimable =
    window.playerStats.prestigeCount > 0 &&
    !window.playerStats.weeklyRewardClaimed &&
    weeklies.filter((m) => m.completed).length === 3;
  let hasMissionsAlert =
    dailyClaimable ||
    weeklyClaimable ||
    dailyMasterClaimable ||
    weeklyMasterClaimable;

  let mBadge = document.getElementById("hub-card-missions-badge");
  if (mBadge) mBadge.style.display = hasMissionsAlert ? "inline-block" : "none";

  // 2. Evaluate Trophies
  let hasTrophiesAlert =
    window.playerStats.unviewedAchievements &&
    window.playerStats.unviewedAchievements.length > 0;
  let tBadge = document.getElementById("hub-card-trophies-badge");
  if (tBadge) tBadge.style.display = hasTrophiesAlert ? "inline-block" : "none";

  // 3. Evaluate Mailbox
  let mailBadge = document.getElementById("hub-card-mailbox-badge");
  let hasMailAlert = mailBadge && mailBadge.style.display === "inline-block";

  // 4. Evaluate Clan Hall
  let clanBadge = document.getElementById("hub-card-clan-badge");
  let hasClanAlert = clanBadge && clanBadge.style.display === "inline-block";

  // 5. Evaluate Settings / Name Setup Alert
  let hasSettingsAlert =
    window.playerStats && window.playerStats.playerName === "Guest";
  let sBadge = document.getElementById("hub-card-settings-badge");
  if (sBadge) sBadge.style.display = hasSettingsAlert ? "inline-block" : "none";

  // Evaluate Bestiary Card Upgrades Alert
  let hasBestiaryAlert =
    typeof window.checkBestiaryAlerts === "function"
      ? window.checkBestiaryAlerts()
      : false;
  let bBadge = document.getElementById("hub-card-bestiary-badge");
  if (bBadge) bBadge.style.display = hasBestiaryAlert ? "inline-block" : "none";

  let renameContainer = document.getElementById("settings-rename-container");
  if (renameContainer) {
    if (hasSettingsAlert) {
      renameContainer.style.borderColor = "#e74c3c";
      renameContainer.style.boxShadow = "0 0 12px rgba(231, 76, 60, 0.4)";
    } else {
      renameContainer.style.borderColor = "#333";
      renameContainer.style.boxShadow = "none";
    }
  }

  // Evaluate Daily Calendar alerts
  let hasCalendarAlert = !window.playerStats.loginClaimedToday;
  let cBadge = document.getElementById("hub-card-calendar-badge");
  if (cBadge) cBadge.style.display = hasCalendarAlert ? "inline-block" : "none";

  // 6. Update Main Top Bar Hub Button Dot
  let mainDot = document.getElementById("hub-menu-alert-dot");
  if (mainDot) {
    mainDot.style.display =
      hasMissionsAlert ||
      hasTrophiesAlert ||
      hasMailAlert ||
      hasClanAlert ||
      hasSettingsAlert ||
      hasBestiaryAlert ||
      hasCalendarAlert
        ? "inline-block"
        : "none";
  }
};

window.checkUnreadMail = function () {
  if (!window.GAME_SERVER_URL) return;
  const userId = window.getGameUserId ? window.getGameUserId() : null;
  if (!userId) return;

  const claimedMailIds = window.playerStats.claimedMailIds || [];

  fetch(`${window.GAME_SERVER_URL}/api/mailbox`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, claimedMailIds }),
  })
    .then((response) => response.json())
    .then((data) => {
      console.log("📨 Mailbox Server Response:", data); // Add this line
      if (data.success && data.mailbox) {
        const hasUnclaimed = data.mailbox.some((m) => !m.claimed);
        window.updateMailboxBadge(hasUnclaimed);
      }
    })
    .catch(() => {});
};

// --- DYNAMIC MEDAL BANNER PLATE RENDERER ---
window.updateMedalBanner = function () {
  let banner = document.getElementById("equipped-medal-banner");
  if (!banner) return;

  let activeTitle = window.playerStats.equippedTitle;
  if (activeTitle && window.TITLES_DATA[activeTitle]) {
    let tData = window.TITLES_DATA[activeTitle];
    let color = tData.color || "#ff007f";
    banner.style.display = "flex";
    banner.style.borderColor = color;
    banner.style.background = window.hexToRgba
      ? window.hexToRgba(color, 0.05)
      : "rgba(255, 0, 127, 0.05)";
    banner.style.boxShadow = `inset 0 0 10px ${window.hexToRgba ? window.hexToRgba(color, 0.08) : "rgba(0,0,0,0.5)"}, 0 0 6px ${window.hexToRgba ? window.hexToRgba(color, 0.15) : "rgba(255,0,127,0.1)"}`;

    banner.innerHTML = `
          <div style="flex-shrink:0; font-size: 18px; display: flex; align-items: center; justify-content: center; width:28px; height:28px; background:#111; border:1px solid #444; border-radius:4px; box-shadow:inset 0 0 4px #000;">
              ${tData.icon || "🏅"}
            </div>
            <div style="flex:1; min-width:0; text-align:left; margin-left: 8px;">
                <span style="font-size:9px; color:#888; text-transform:uppercase; letter-spacing:1px; display:block; line-height:1;">Active Medal</span>
                <strong style="color:${color}; font-size:11.5px; display:block; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; text-shadow:0 0 8px ${window.hexToRgba ? window.hexToRgba(color, 0.25) : "rgba(255,0,127,0.2)"}; margin-top:2px;">${tData.name}</strong>
            </div>
            <div style="flex-shrink:0;">
                <span style="font-size:9.5px; color:#cbd5e1; background:rgba(255,255,255,0.05); border:1px solid #333; padding:2px 6px; border-radius:3px; font-family:monospace; font-weight:bold;">SWAP</span>
            </div>
        `;

    banner.onmouseenter = (e) => window.showTitleMedalTooltip(e, activeTitle);
    banner.ontouchstart = (e) => window.showTitleMedalTooltip(e, activeTitle);
    banner.onmouseleave = () => window.hideTooltip();
  } else {
    banner.style.display = "flex";
    banner.style.borderColor = "#444";
    banner.style.background = "#151515";
    banner.style.boxShadow = "";
    banner.innerHTML = `
          <div style="flex-shrink:0; font-size: 18px; display: flex; align-items: center; justify-content: center; width:34px; height:34px; background:#111; border:1px dashed #444; border-radius:4px;">
              🏅
          </div>
          <div style="flex:1; min-width:0; text-align:left; margin-left: 8px;">
              <span style="font-size:9px; color:#666; text-transform:uppercase; letter-spacing:1px; display:block;">Active Medal</span>
              <strong style="color:#7f8c8d; font-size:12px; display:block; font-style:italic;">[No Title Equipped]</strong>
          </div>
          <div style="flex-shrink:0;">
              <span style="font-size:9.5px; color:#888; background:rgba(255,255,255,0.02); border:1px dashed #444; padding:2px 6px; border-radius:3px; font-family:monospace;">EQUIP</span>
            </div>
        `;
    banner.onmouseenter = null;
    banner.ontouchstart = null;
    banner.onmouseleave = null;
  }
};

window.openMedalSwapWindow = function (e) {
  if (e) {
    e.stopPropagation();
    e.preventDefault();
  }

  let existingWin = document.getElementById("medal-swap-window");
  let savedLeft = null;
  let savedTop = null;
  if (existingWin) {
    savedLeft = existingWin.style.left;
    savedTop = existingWin.style.top;
    existingWin.remove();
  }

  let win = document.createElement("div");
  win.id = "medal-swap-window";
  win.className = "draggable-window";

  if (savedLeft !== null && savedTop !== null) {
    win.style.left = savedLeft;
    win.style.top = savedTop;
  } else {
    win.style.left = "35px";
    win.style.top = "100px";
  }

  let unlocked = window.playerStats.unlockedTitles || [];
  let contentHtml = "";

  contentHtml += `
        <div class="bag-item" style="padding:6px; margin-bottom:5px; background:#181c22; border:1px solid #333; display:flex; justify-content:space-between; align-items:center;">
            <div style="text-align:left;">
                <strong style="color:#aaa; font-size:11px;">No Medal</strong><br>
                <span style="font-size:9.5px; color:#666;">Clear active equipped title</span>
            </div>
            <button class="btn-action" style="padding:3px 8px; font-size:10px; font-weight:bold; background:#e74c3c;" onclick="window.executeSwapMedal('')">Unequip</button>
        </div>
      `;

  if (unlocked.length > 0) {
    contentHtml += unlocked
      .map((tKey) => {
        let tData = window.TITLES_DATA[tKey];
        if (!tData) return "";
        let color = tData.color || "#ff007f";
        let activeLabel =
          window.playerStats.equippedTitle === tKey
            ? " <span style='color:#2ecc71;'>(Equipped)</span>"
            : "";

        let statText = [];
        if (tData.stats) {
          for (let sKey in tData.stats) {
            let isPct = [
              "drop",
              "qly",
              "critChance",
              "critDamage",
              "block",
              "parry",
              "gold",
              "fairySpawn",
              "rareSpawn",
            ].includes(sKey);
            let val = tData.stats[sKey];
            let valStr = isPct ? `+${(val * 100).toFixed(0)}%` : `+${val}`;
            statText.push(`${window.getStatLabel(sKey)} ${valStr}`);
          }
        }
        let statsDisplay =
          statText.length > 0 ? statText.join(", ") : "Cosmetic Only";

        return `
            <div class="bag-item" style="padding:6px; margin-bottom:5px; background:#181c22; border:1px solid #333; display:flex; justify-content:space-between; align-items:center;"
                 onmouseenter="window.showTitleMedalTooltip(event, '${tKey}')"
                 ontouchstart="window.showTitleMedalTooltip(event, '${tKey}')"
                 onmouseleave="window.hideTooltip()">
                <div style="text-align:left; max-width: 170px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; flex:1;">
                    <strong style="color:${color}; font-size:11px;">${tData.name}${activeLabel}</strong><br>
                    <span style="font-size:9.5px; color:#aaa;">${statsDisplay}</span>
                </div>
                <button class="btn-action" style="padding:3px 8px; font-size:10px; font-weight:bold; background:var(--accent-green); flex-shrink:0; margin-left:6px;" onclick="window.executeSwapMedal('${tKey}')">Equip</button>
            </div>
          `;
      })
      .join("");
  }

  win.innerHTML = `
        <div class="draggable-header" id="medal-win-handle" style="background: linear-gradient(180deg, #181d24 0%, #0d1117 100%);">
            <span>🏅 Swap Medal / Title</span>
            <button onclick="document.getElementById('medal-swap-window').remove(); window.hideTooltip();" style="background:transparent; border:none; color:#e74c3c; font-weight:bold; cursor:pointer; font-size:11px; padding:2px;">[X]</button>
          </div>
          <div class="draggable-content">
              ${contentHtml}
          </div>
        `;

  document.getElementById("game-container").appendChild(win);
  window.makeWindowDraggable(win, document.getElementById("medal-win-handle"));
};

window.executeSwapMedal = function (tKey) {
  if (tKey === "") {
    window.playerStats.equippedTitle = null;
    if (typeof window.pushHeaderToast === "function") {
      window.pushHeaderToast("Title Unequipped", "#7f8c8d");
    }
  } else {
    window.playerStats.equippedTitle = tKey;
    let tData = window.TITLES_DATA[tKey];
    if (typeof window.pushHeaderToast === "function") {
      window.pushHeaderToast(
        `Equipped Medal: [${tData.name}]`,
        tData.color || "#ff007f",
      );
    }
  }
  let win = document.getElementById("medal-swap-window");
  if (win) win.remove();
  window.hideTooltip();
  window.updateUI();
  window.saveGame();
};

window.showTitleMedalTooltip = function (e, tKey) {
  e.stopPropagation();
  let tt = document.getElementById("game-tooltip");
  if (!tt) return;

  let tData = window.TITLES_DATA[tKey];
  if (!tData) return;

  let statsHtml = [];
  if (tData.stats) {
    for (let sKey in tData.stats) {
      let label = window.getStatLabel(sKey);
      let val = tData.stats[sKey];
      let isPct = [
        "drop",
        "qly",
        "critChance",
        "critDamage",
        "block",
        "parry",
        "gold",
        "fairySpawn",
        "rareSpawn",
      ].includes(sKey);
      let valStr = isPct ? `+${(val * 100).toFixed(0)}%` : `+${val}`;
      statsHtml.push(
        `<div class="tt-stat-line" style="color:#2ecc71;">• ${label}: ${valStr}</div>`,
      );
    }
  }

  tt.innerHTML = `
        <div style="padding: 10px; width: 230px; box-sizing: border-box;">
            <div class="tt-title" style="color:${tData.color || "#ff007f"}; display:flex; align-items:center; gap:6px;">
                ${tData.icon || ""} <span>${tData.name}</span>
            </div>
            <div class="tt-subtitle">Unique Character Medal</div>
            <div style="color:#ddd; font-size:11px; margin-bottom:8px; white-space:normal; line-height:1.35; font-style:italic;">
                "${tData.desc}"
            </div>
            <div style="margin-bottom:8px; border-top:1px dashed #444; padding-top:6px;">
                <strong style="color:#f1c40f; font-size:10px; text-transform:uppercase; letter-spacing:0.5px;">🎁 Received:</strong>
                <div style="font-size:10.5px; color:#fff; line-height:1.35; white-space:normal;">${tData.received || "Unknown Achievement Reward"}</div>
            </div>
            <div style="font-weight:bold; color:#aaa; margin-bottom:4px; border-bottom:1px solid #333; padding-bottom:2px; font-size:10px; text-transform:uppercase;">Permanent Passive Bonus:</div>
            ${statsHtml.length > 0 ? statsHtml.join("") : '<div style="color:#7f8c8d; font-style:italic; font-size:10.5px;">Cosmetic Only</div>'}
            <div style="margin-top:6px; color:#888; font-size:9px; line-height:1.3; border-top:1px dashed #333; padding-top:4px;">
                (Passive bonuses are permanently active across your characters once unlocked, even if another medal is equipped!)
            </div>
          </div>
      `;
  tt.style.borderColor = tData.color || "#ff007f";
  tt.style.display = "block";
  window.positionTooltip(e, tt);
};

window.changeCosmeticSkin = function (skinKey) {
  window.playerStats.cosmeticSkin = skinKey;
  if (typeof window.pushHeaderToast === "function") {
    let colors = {
      default: "#7f8c8d",
      void: "#9b59b6",
      crimson: "#e74c3c",
      gilded: "#f1c40f",
    };
    window.pushHeaderToast(
      `🎭 Applied Cosmetic Skin!`,
      colors[skinKey] || "#fff",
    );
  }
  window.updateUI();
  window.saveGame();
};

window.toggleLeaderboard = function () {
  let modal = document.getElementById("leaderboard-modal");
  if (!modal) return;

  if (modal.style.display === "none" || modal.style.display === "") {
    window.hideTooltip();
    modal.style.display = "block";
    window.state.leaderboardTab = "campaign"; // Default view
    window.fetchLeaderboardData();
  } else {
    modal.style.display = "none";
    window.hideTooltip();
  }
};

window.switchLeaderboardTab = function (tabId) {
  window.state.leaderboardTab = tabId;
  window.fetchLeaderboardData();
};

window.fetchLeaderboardData = function () {
  const listEl = document.getElementById("leaderboard-list");
  if (!listEl) return;

  const tabsContainer = document.getElementById("leaderboard-tabs-container");
  if (tabsContainer) {
    const activeTab = window.state.leaderboardTab || "campaign";
    tabsContainer.innerHTML = `
      <div style="display:grid; grid-template-columns: 1fr 1fr; gap:6px;">
          <button onclick="window.switchLeaderboardTab('campaign')" class="sub-tab-btn ${activeTab === "campaign" ? "active" : ""}" style="padding:6px; font-weight:bold; font-size:10.5px; height:34px; display:inline-flex; align-items:center; justify-content:center;">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle; margin-right:4px;"><path d="M14.5 17.5L3 6V3h3l11.5 11.5M13 19l2 2M11 19l-2 2" /></svg>
              Campaign
          </button>
          <button onclick="window.switchLeaderboardTab('crucible')" class="sub-tab-btn ${activeTab === "crucible" ? "active" : ""}" style="padding:6px; font-weight:bold; font-size:10.5px; height:34px; display:inline-flex; align-items:center; justify-content:center;">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle; margin-right:4px;"><circle cx="12" cy="12" r="10" stroke-dasharray="3 3"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/></svg>
              Crucible
          </button>
      </div>
    `;
  }

  if (!window.GAME_SERVER_URL) {
    listEl.innerHTML = `<div style="color:#666; text-align:center; padding: 20px 0; font-size:11px; font-style:italic;">Leaderboard unavailable in offline/GitHub mode.</div>`;
    return;
  }

  if (!window.isCloudSynced) {
    listEl.innerHTML = `<div style="color:#e74c3c; text-align:center; padding: 20px 0; font-size:11px; font-style:italic;">📡 Leaderboard is offline. Establishing secure connection...</div>`;
    return;
  }

  listEl.innerHTML = `<div style="color:#aaa; text-align:center; padding: 20px 0; font-size:11px;">Gathering historical records of the realm...</div>`;

  const activeTab = window.state.leaderboardTab || "campaign";
  fetch(`${window.GAME_SERVER_URL}/api/leaderboard?type=${activeTab}`)
    .then((response) => response.json())
    .then((data) => {
      if (data.success && data.leaderboard) {
        window.renderLeaderboardItems(data.leaderboard);
      } else {
        listEl.innerHTML = `<div style="color:#e74c3c; text-align:center; padding: 20px 0; font-size:11px;">Error compiling rankings.</div>`;
      }
    })
    .catch((err) => {
      console.error("Leaderboard fetch failed:", err);
      listEl.innerHTML = `<div style="color:#e74c3c; text-align:center; padding: 20px 0; font-size:11px;">Could not connect to the rankings server.</div>`;
    });
};

window.renderLeaderboardItems = function (leaderboard) {
  const listEl = document.getElementById("leaderboard-list");
  if (!listEl) return;

  if (leaderboard.length === 0) {
    listEl.innerHTML = `<div style="color:#666; text-align:center; padding: 20px 0; font-size:11px; font-style:italic;">No legends have risen yet. Be the first!</div>`;
    return;
  }

  let localUserId = window.getGameUserId ? window.getGameUserId() : null;
  let activeTab = window.state.leaderboardTab || "campaign";

  listEl.innerHTML = leaderboard
    .map((player, index) => {
      let rank = index + 1;
      let badgeColor = "#7f8c8d";
      let badgeGlow = "";
      let rankIcon = rank;

      if (rank === 1) {
        badgeColor = "#f1c40f";
        badgeGlow =
          "box-shadow: 0 0 10px #f1c40f; text-shadow: 0 0 6px #f1c40f;";
        rankIcon = "I";
      } else if (rank === 2) {
        badgeColor = "#bdc3c7";
        badgeGlow =
          "box-shadow: 0 0 8px #bdc3c7; text-shadow: 0 0 4px #bdc3c7;";
        rankIcon = "II";
      } else if (rank === 3) {
        badgeColor = "#e67e22";
        badgeGlow =
          "box-shadow: 0 0 8px #e67e22; text-shadow: 0 0 4px #e67e22;";
        rankIcon = "III";
      }

      let titleTextHtml = "";
      if (player.equippedTitle && window.TITLES_DATA[player.equippedTitle]) {
        let tData = window.TITLES_DATA[player.equippedTitle];
        let tColor = tData.color || "#ff007f";
        titleTextHtml = `<span style="color:${tColor}; font-size:9px; font-weight:bold; margin-left:4px;">[${tData.name}]</span>`;
      }

      let isSelf = player.userId === localUserId;
      let cardStyle = isSelf
        ? `border: 1.5px solid #f1c40f; background: rgba(241, 196, 15, 0.05); box-shadow: inset 0 0 10px rgba(241, 196, 15, 0.05);`
        : `border: 1.5px solid #222; background: #161a22;`;

      let canvasId = `leaderboard-canvas-${player.userId}`;

      let guildBadgeHtml = "";
      if (player.guildName) {
        // Retrieve actual guild level from database parameters to draw correctly evolved emblems
        let emblem = window.getClanEmblemHtml(
          player.guildEmblem || 0,
          12,
          player.guildLevel || 1,
        );
        guildBadgeHtml = `
                                <div style="display: inline-flex; align-items: center; gap: 3px; background: rgba(142, 68, 173, 0.1); border: 1px solid #8e44ad; padding: 1px 4px; border-radius: 3px; font-size: 8.5px; color: #df9ffb; font-weight: bold; margin-left: 6px;">
                                  ${emblem} <span>${window.escapeHTML(player.guildName)}</span>
                                </div>
                              `;
      }

      // Relative Social Active Status Indicators
      let lastActiveMs = Number(player.lastActive) || 0;
      let isOnline = Date.now() - lastActiveMs < 300000; // 5 minute online window
      let statusDotHtml = isOnline
        ? `<span style="display:inline-block; width:6px; height:6px; background:#2ecc71; border-radius:50%; box-shadow: 0 0 6px #2ecc71; margin-right:5px; vertical-align:middle;" title="Online"></span>`
        : `<span style="display:inline-block; width:6px; height:6px; background:#7f8c8d; border-radius:50%; margin-right:5px; vertical-align:middle;" title="Offline"></span>`;

      // Dynamic Stat Contextual Sub-labels & High-Contrast Badges
      let statsSubText = `Prestige ${player.prestigeCount} • Lv. ${player.level}`;
      let metricBadgeHtml = "";

      if (activeTab === "crucible") {
        metricBadgeHtml = `<span style="background:rgba(155, 89, 182, 0.15); border:1.5px solid #9b59b6; color:#df9ffb; font-family:monospace; font-size:11px; font-weight:bold; padding:4px 8px; border-radius:4px; box-shadow:0 0 8px rgba(155,89,182,0.25); margin-right:8px; white-space:nowrap;">WAVE ${player.cruciblePeak || 1}</span>`;
      } else {
        metricBadgeHtml = `<span style="background:rgba(52, 152, 219, 0.15); border:1.5px solid #3498db; color:#3498db; font-family:monospace; font-size:11px; font-weight:bold; padding:4px 8px; border-radius:4px; box-shadow:0 0 8px rgba(52,152,219,0.25); margin-right:8px; white-space:nowrap;">STG ${player.lifetimePeakStage || 1}</span>`;
      }

      return `
              <div class="bag-item" style="display:flex; justify-content:space-between; align-items:center; padding:6px 12px; gap:8px; cursor:default; ${cardStyle}">
                  <div style="display:flex; align-items:center; gap:10px; flex:1; min-width:0; text-align:left;">
                      <span style="display:inline-flex; width:24px; height:24px; background:#111; border:1px solid ${badgeColor}; border-radius:50%; align-items:center; justify-content:center; font-size:10px; font-weight:bold; color:#fff; ${badgeGlow}">${rankIcon}</span>

                      <!-- Miniature Canvas for Cel-shaded character preview -->
                      <canvas id="${canvasId}" width="40" height="50" style="width:40px; height:50px; background:rgba(0,0,0,0.4); border:1px solid #333; border-radius:4px; display:block; flex-shrink:0; pointer-events:none;"></canvas>

                      <div style="flex:1; min-width:0;">
                          <div style="display:flex; align-items:center; flex-wrap:wrap;">
                              ${statusDotHtml}
                              <strong style="color:${isSelf ? "#f1c40f" : "#fff"}; font-size:12.5px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; max-width:140px;">${window.escapeHTML(player.playerName || "Unknown")}${isSelf ? " <span style='font-size:9px; color:#f1c40f;'> (You)</span>" : ""}</strong>
                              ${titleTextHtml}
                              ${guildBadgeHtml}
                          </div>
                          <div style="font-size:9.5px; color:#aaa; font-family:monospace; margin-top:2px;">${statsSubText}</div>
                      </div>
                  </div>
                  <div style="display:flex; align-items:center; flex-shrink:0;">
                      ${metricBadgeHtml}
                      <button class="btn-action" style="background:#3498db; color:white; font-size:11px; padding:4px 10px;" onclick="window.inspectPlayer('${player.userId}')">Inspect</button>
                  </div>
              </div>
            `;
    })
    .join("");

  // After writing rows to DOM, render each miniature hero on their respective canvases
  leaderboard.forEach((player) => {
    let canvas = document.getElementById(`leaderboard-canvas-${player.userId}`);
    if (canvas) {
      let ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.imageSmoothingEnabled = false;

      // Draw the mini hero centered nicely
      window.drawSingleHero(
        ctx,
        20,
        21,
        0.7,
        player.equippedSlots,
        {
          ...player,
          frenzyTimer: 0, // leaderboard previews are not frenzied
        },
        0,
        {
          slashFrame: false,
          deathAnimationTimer: 0,
          isMainHero: false,
        },
      );
    }
  });
};

window.inspectPlayer = function (targetUserId) {
  if (!window.GAME_SERVER_URL) return;

  fetch(`${window.GAME_SERVER_URL}/api/inspect`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ targetUserId }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success && data.profile) {
        window.renderInspectModal(data.profile);
      } else {
        window.pushHeaderToast("❌ Could not load player profile.", "#e74c3c");
      }
    })
    .catch((err) => {
      console.error("Inspect failed:", err);
      window.pushHeaderToast("❌ Network error inspecting legend.", "#e74c3c");
    });
};

// --- PAPER-DOLL PRESS & HOLD (LONG-PRESS) SYSTEMS ---
window.slotLongPressTimeout = null;
window.isSlotLongPressActive = false;

window.startSlotLongPress = function (e, slotKey) {
  if (e.pointerType === "mouse" && e.button !== 0) return; // Only process left click

  window.isSlotLongPressActive = false;
  if (window.slotLongPressTimeout) clearTimeout(window.slotLongPressTimeout);

  // Soft tactile shrink feedback on touch start
  let target = e.currentTarget;
  target.style.transform = "scale(0.95)";
  target.style.transition = "transform 0.1s";

  // Capture position coordinates safely
  let startX = e.clientX;
  let startY = e.clientY;

  // Handle move cancellation for scrolling
  const cancelOnMove = (moveEvent) => {
    let diffX = Math.abs(moveEvent.clientX - startX);
    let diffY = Math.abs(moveEvent.clientY - startY);
    if (diffX > 8 || diffY > 8) {
      if (window.slotLongPressTimeout) {
        clearTimeout(window.slotLongPressTimeout);
        window.slotLongPressTimeout = null;
      }
      target.style.transform = "none";
      target.removeEventListener("pointermove", cancelOnMove);
    }
  };
  target.addEventListener("pointermove", cancelOnMove);

  window.slotLongPressTimeout = setTimeout(() => {
    window.isSlotLongPressActive = true;
    target.style.transform = "none";
    target.removeEventListener("pointermove", cancelOnMove);

    // Build mock event to drive the aligned centering calculations
    let mockEvent = {
      clientX: startX,
      clientY: startY,
      stopPropagation: () => {},
      preventDefault: () => {},
    };

    window.openEquipSwapWindow(mockEvent, slotKey);

    // Haptic buzz vibration feedback on mobile
    if (navigator.vibrate) {
      navigator.vibrate(40);
    }
  }, 800); // 800ms holds represent the golden usability threshold for mobile long-presses
};

window.endSlotLongPress = function (e) {
  if (window.slotLongPressTimeout) {
    clearTimeout(window.slotLongPressTimeout);
    window.slotLongPressTimeout = null;
  }
  e.currentTarget.style.transform = "none";
};

window.renderInspectModal = function (profile) {
  let modal = document.getElementById("inspect-modal");
  let contentEl = document.getElementById("inspect-content");
  let titleEl = document.getElementById("inspect-title");
  if (!modal || !contentEl || !titleEl) return;

  let stats = profile.playerStats;
  let equipped = profile.equippedSlots;

  // Set the title of the Inspect Modal
  let titleBadgeHtml = "";
  if (stats.equippedTitle && window.TITLES_DATA[stats.equippedTitle]) {
    let tData = window.TITLES_DATA[stats.equippedTitle];
    titleBadgeHtml = ` <span style="color:${tData.color || "#ff007f"}; font-weight:bold;">[${tData.name}]</span>`;
  }
  titleEl.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle; margin-right:4px;"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg> Inspecting: ${stats.playerName || "Legend"}${titleBadgeHtml}`;

  // Store inspected slots globally in window so hover tooltips can resolve comparison
  window.inspectedSlots = equipped;

  // Build the inspected paper doll layout
  let slots = [
    "helmet",
    "weapon",
    "chest",
    "subweapon",
    "leggings",
    "overall",
    "boots",
    "art1",
    "art2",
    "art3",
  ];
  let paperDollHtml = slots
    .map((slot) => {
      let item = equipped[slot];

      // Check locked elements
      if ((slot === "chest" || slot === "leggings") && equipped.overall) {
        return `<div class="slots-card locked">⚙️ LOCKED BY OVERALL</div>`;
      }
      if (slot === "overall" && (equipped.chest || equipped.leggings)) {
        return `<div class="slots-card locked">⚙️ LOCKED BY PIECE GEAR</div>`;
      }

      if (item) {
        let isArt = slot.startsWith("art");
        let color = window.getTierColor(item.statsRolled);
        let uniqueStyle = window.getUniqueItemStyle(item);

        let styleStr = uniqueStyle
          ? `background: ${uniqueStyle.bg}; border: 1.5px solid ${uniqueStyle.border}; box-shadow: inset 0 0 6px ${uniqueStyle.shadow}, 0 0 8px ${uniqueStyle.glow};`
          : `border-color: ${color};`;

        let iconBox = `<div style="text-align:center; margin-bottom:4px;">${window.getEquipIconHtml(item, 28)}</div>`;
        let temperTag =
          item.temperLevel > 0
            ? ` <span style="color:#2ecc71;">[+${item.temperLevel}]</span>`
            : "";

        let attrs = [];
        if (item.atk > 0) attrs.push(`⚔️${item.atk}`);
        if (item.maxHp > 0) attrs.push(`❤️${item.maxHp}`);
        if (item.def > 0) attrs.push(`🛡️${item.def}`);
        if (item.moveSpeed > 0) attrs.push(`👟${item.moveSpeed}`);

        return `
          <div class="slots-card equipped" style="${styleStr} min-height:48px; padding:4px; font-size:10px;"
               onmouseenter="window.showInspectSlotTooltip(event, '${slot}')"
               onmouseleave="window.hideTooltip()"
               ontouchstart="window.showInspectSlotTooltip(event, '${slot}')">
              ${iconBox}
              <strong style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap; display:block;">${item.name}${temperTag}</strong>
              <span style="color:#aaa; font-size:8px;">${attrs.join(" ")}</span>
          </div>
        `;
      } else {
        return `<div class="slots-card" style="min-height:48px; font-size:9.5px;"><i>[Empty ${slot.toUpperCase()}]</i></div>`;
      }
    })
    .join("");

  // Solve the inspected stats list
  let resolvedStats = window.resolveInspectedPlayerStats(profile);

  let statsHtml = `
      <div style="background:#111; padding:10px; border-radius:6px; border:1px solid #333; font-size:11px; line-height:1.45; font-family:monospace; text-align:left;">
          <div style="font-weight:bold; color:#3498db; border-bottom:1px solid #222; padding-bottom:4px; margin-bottom:6px; text-transform:uppercase; letter-spacing:0.5px;">📊 Inspected Parameters</div>
          <div style="display:grid; grid-template-columns: 1fr 1fr; gap:2px 8px;">
              <div>⚔️ Attack: <strong style="color:#fff;">${window.formatNumber(resolvedStats.atk)}</strong></div>
              <div>🛡️ Defense: <strong style="color:#fff;">${window.formatNumber(resolvedStats.def)}</strong></div>
              <div>❤️ Max HP: <strong style="color:#fff;">${window.formatNumber(resolvedStats.maxHp)}</strong></div>
              <div>👟 Speed: <strong style="color:#fff;">${resolvedStats.moveSpeed.toFixed(1)}</strong></div>
              <div>✨ Crit %: <strong style="color:#fff;">${Math.round(resolvedStats.critChance * 100)}%</strong></div>
              <div>💥 Crit Multi: <strong style="color:#fff;">${Math.round(resolvedStats.critDamage * 100)}%</strong></div>
              <div>🛡️ Block Rate: <strong style="color:#fff;">${Math.round(resolvedStats.block * 100)}%</strong></div>
              <div>⚡ Parry Rate: <strong style="color:#fff;">${Math.round(resolvedStats.parry * 100)}%</strong></div>
              <div>💪 STR: <strong style="color:#fff;">${resolvedStats.str}</strong></div>
              <div>🎯 DEX: <strong style="color:#fff;">${resolvedStats.dex}</strong></div>
              <div>🧠 INT: <strong style="color:#fff;">${resolvedStats.int}</strong></div>
              <div>🍀 Drop Rate: <strong style="color:#fff;">+${Math.round((resolvedStats.drop - 1) * 100)}%</strong></div>
          </div>
      </div>
    `;

  // Render the inspected player's equipped medal banner
  let medalBannerHtml = "";
  let activeTitle = stats.equippedTitle;
  if (activeTitle && window.TITLES_DATA[activeTitle]) {
    let tData = window.TITLES_DATA[activeTitle];
    let color = tData.color || "#ff007f";
    let bgRgba = window.hexToRgba(color, 0.05);
    let borderGlow = `inset 0 0 10px ${window.hexToRgba(color, 0.08)}, 0 0 6px ${window.hexToRgba(color, 0.1)}`;

    medalBannerHtml = `
            <div id="inspected-medal-banner"
                 style="margin-top: 6px; border: 1.5px solid ${color}; background: ${bgRgba}; border-radius: 6px; padding: 10px; display: flex; align-items: center; gap: 10px; box-shadow: ${borderGlow}; cursor: help;"
                 onmouseenter="window.showTitleMedalTooltip(event, '${activeTitle}')"
                 ontouchstart="window.showTitleMedalTooltip(event, '${activeTitle}')"
                 onmouseleave="window.hideTooltip()">
                <div style="flex-shrink:0; font-size: 18px; display: flex; align-items: center; justify-content: center; width:28px; height:28px; background:#111; border:1px solid #444; border-radius:4px; box-shadow:inset 0 0 4px #000;">
                    ${tData.icon || "🏅"}
                </div>
                <div style="flex:1; min-width:0; text-align:left; margin-left: 8px;">
                                    <span style="font-size:9px; color:#888; text-transform:uppercase; letter-spacing:1px; display:block; line-height:1;">Equipped Medal</span>
                                    <strong style="color:${color}; font-size:11.5px; display:block; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; text-shadow:0 0 8px ${window.hexToRgba(color, 0.25)}; margin-top:2px;">${tData.name}</strong>
                                </div>
            </div>
          `;
  } else {
    medalBannerHtml = `
            <div id="inspected-medal-banner"
                 style="margin-top: 6px; border: 1.5px dashed #444; background: #151515; border-radius: 6px; padding: 10px; display: flex; align-items: center; gap: 10px; cursor: default;">
                <div style="flex-shrink:0; font-size: 18px; display: flex; align-items: center; justify-content: center; width:28px; height:28px; background:#111; border:1px dashed #444; border-radius:4px;">
                    🏅
                </div>
                <div style="flex:1; min-width:0; text-align:left; margin-left: 8px;">
                    <span style="font-size:9px; color:#666; text-transform:uppercase; letter-spacing:1px; display:block; line-height:1;">Equipped Medal</span>
                    <strong style="color:#7f8c8d; font-size:11.5px; display:block; font-style:italic;">[No Title Equipped]</strong>
                </div>
            </div>
          `;
  }

  contentEl.innerHTML = `
          <div style="display:grid; grid-template-columns: 1.15fr 0.85fr; gap:12px;">
              <div style="display:flex; flex-direction:column; gap:8px;">
                  <div style="display:grid; grid-template-columns: repeat(2, 1fr); gap:4px;">
                      ${paperDollHtml}
                  </div>
                  ${medalBannerHtml}
              </div>
              <div style="display:flex; flex-direction:column; gap:10px;">
              <!-- Miniature inspect canvas -->
              <div style="background:#090b0d; border: 1px solid #333; border-radius:6px; padding:15px; display:flex; justify-content:center; align-items:center;">
                  <canvas id="inspect-hero-canvas" width="80" height="100" style="background:rgba(0,0,0,0.5); border:1px solid #4a154b; border-radius:6px; display:block; filter: drop-shadow(0 0 10px rgba(52, 152, 219, 0.15));"></canvas>
              </div>
              <div style="background:#111; padding:8px; border-radius:6px; border:1px solid #333; text-align:left;">
                  <div style="font-size:9.5px; color:#888; text-transform:uppercase; letter-spacing:1px;">👑 Legend Progression</div>
                  <div style="font-size:12px; color:#fff; font-weight:bold; margin-top:2px;">Level ${stats.level} • Stage Peak ${stats.lifetimePeakStage || stats.maxStage || 1}</div>
                  <div style="font-size:11px; color:#aaa; margin-top:2px;">Ascensions: ${stats.prestigeCount || 0} • Slayed ${stats.totalLifetimeKills?.toLocaleString() || 0} Targets</div>
              </div>
              ${statsHtml}
          </div>
      </div>
    `;

  modal.style.display = "block";

  // Draw the miniature hero on the Inspect page
  let canvas = document.getElementById("inspect-hero-canvas");
  if (canvas) {
    let ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingEnabled = false;

    window.drawSingleHero(
      ctx,
      40,
      42,
      1.4,
      equipped,
      {
        ...stats,
        frenzyTimer: 0,
      },
      0,
      {
        slashFrame: false,
        deathAnimationTimer: 0,
        isMainHero: false,
      },
    );
  }
};

window.showInspectSlotTooltip = function (e, slotKey) {
  e.stopPropagation();
  if (!window.inspectedSlots) return;
  let item = window.inspectedSlots[slotKey];
  if (!item) return;

  let tt = document.getElementById("game-tooltip");
  tt.innerHTML = window.buildGeneralTooltipHtml(item, false);
  tt.style.borderColor = window.getTierColor(item.statsRolled);
  tt.style.display = "block";
  window.positionTooltip(e, tt);
};

// Procedural inspect stats solver
window.resolveInspectedPlayerStats = function (profile) {
  let stats = profile.playerStats;
  let equipped = profile.equippedSlots || {};

  let p = {
    atk: stats.baseAtk || 10,
    maxHp: stats.baseMaxHp || 100,
    def: stats.baseDef || 0,
    moveSpeed: stats.baseMoveSpeed || 10,
    idleAttackSpeed: stats.baseIdleSpeed || 60,
    activeAttackSpeed: stats.baseActiveSpeed || 15,
    drop: stats.baseDrop || 1.0,
    qly: stats.baseQuality || 1.0,
    gold: stats.baseGold || 1.0,
    critChance: stats.baseCritChance || 0.05,
    critDamage: stats.baseCritDamage || 1.5,
    block: stats.baseBlock || 0.0,
    parry: stats.baseParry || 0.0,
    rareSpawn: stats.baseRareSpawn || 0.01,
    str: stats.baseStr || 5,
    dex: stats.baseDex || 5,
    int: stats.baseInt || 5,
    fairySpawn: stats.baseFairySpawn || 1.0,
    arcaneBarrier: 0.0,
    xpRate: 1.0,
  };

  // Titles passive mapping
  if (stats.unlockedTitles) {
    stats.unlockedTitles.forEach((tKey) => {
      let tData = window.TITLES_DATA[tKey];
      if (tData && tData.stats) {
        for (let sKey in tData.stats) {
          if (p[sKey] !== undefined) p[sKey] += tData.stats[sKey];
        }
      }
    });
  }

  // SP Allocations
  let alloc = stats.spAllocations || {};
  p.str += (alloc.spStr || 0) * 3;
  p.dex += (alloc.spDex || 0) * 3;
  p.int += (alloc.spInt || 0) * 3;

  p.maxHp += (alloc.spHp || 0) * 50;
  p.atk += (alloc.spAtk || 0) * 6;
  p.def += (alloc.spDef || 0) * 5;
  p.critChance += (alloc.spCrit || 0) * 0.005;
  p.critDamage += (alloc.spCritDmg || 0) * 0.02;
  p.block += (alloc.spBlock || 0) * 0.005;
  p.parry += (alloc.spParry || 0) * 0.005;
  p.moveSpeed += (alloc.spSpd || 0) * 1;

  // Equipment sum
  let itemAtkPct = 0;
  let itemHpPct = 0;
  let itemDefPct = 0;
  let itemSpdPct = 0;

  for (let key in equipped) {
    let item = equipped[key];
    if (item) {
      p.atk += item.atk || 0;
      p.maxHp += item.maxHp || 0;
      p.moveSpeed += item.moveSpeed || 0;

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

  let effectiveStr = Math.max(0, p.str - 5);
  let effectiveDex = Math.max(0, p.dex - 5);
  let effectiveInt = Math.max(0, p.int - 5);

  itemAtkPct += effectiveStr * 0.003;
  itemHpPct += effectiveStr * 0.003;
  itemDefPct += Math.log10(effectiveInt + 1) * 0.15;
  p.critChance += parseFloat(
    ((effectiveDex * 0.1) / (effectiveDex + 250)).toFixed(4),
  );
  p.critDamage += effectiveDex * 0.001;
  p.moveSpeed += parseFloat(
    ((effectiveDex * 5.0) / (effectiveDex + 150)).toFixed(1),
  );
  p.block += parseFloat(
    ((effectiveInt * 0.05) / (effectiveInt + 150)).toFixed(4),
  );
  p.parry += parseFloat(
    ((effectiveInt * 0.05) / (effectiveInt + 150)).toFixed(4),
  );
  p.fairySpawn += parseFloat((effectiveInt * 0.0001).toFixed(4));

  let flatDef = (stats.baseDef || 0) + (alloc.spDef || 0) * 4;
  let defMultiplier = 1.0;

  for (let key in equipped) {
    let item = equipped[key];
    if (item) {
      flatDef += item.def || 0;
      if (["chest", "leggings", "overall", "helmet"].includes(item.type)) {
        let stars = item.statsRolled === "UNIQUE" ? 5 : item.statsRolled || 0;
        defMultiplier += stars * 0.03 + item.temperLevel * 0.01;
      }
    }
  }

  p.atk = Math.floor(p.atk * (1.0 + itemAtkPct));
  p.maxHp = Math.floor(p.maxHp * (1.0 + itemHpPct));
  p.def = Math.ceil(flatDef * (defMultiplier + itemDefPct));
  p.moveSpeed = p.moveSpeed * (1.0 + itemSpdPct);

  // Prestige multipliers
  let prestigeAtkMult = Math.pow(1.12, stats.prestigeUpgrades?.atk || 0);
  let prestigeHpMult = Math.pow(1.1, stats.prestigeUpgrades?.fort || 0);
  let prestigeDefMult = Math.pow(1.05, stats.prestigeUpgrades?.fort || 0);

  // Mission Upgrades
  let missionAtkMult = 1.0 + (stats.missionUpgrades?.atk || 0) * 0.02;
  let missionHpMult = 1.0 + (stats.missionUpgrades?.hp || 0) * 0.03;

  p.atk = Math.floor(p.atk * prestigeAtkMult * missionAtkMult);
  p.maxHp = Math.floor(p.maxHp * prestigeHpMult * missionHpMult);
  p.def = Math.floor(p.def * prestigeDefMult);

  return p;
};

// --- ACTIVITIES & RUNS CONTROLLER (CRUCIBLE, CAVERNS & AUTO-SALVAGE) ---

window.openCrucibleChooseTwoStartingDraftModal = function () {
  window.setPauseState(true);

  let pool = [...window.CRUCIBLE_DRAFT_POOL].sort(() => Math.random() - 0.5);
  let selectedCards = pool.slice(0, 4); // Draw 4 options for Choose-2 starting layout

  let overlay = document.createElement("div");
  overlay.id = "crucible-starting-draft-overlay";
  overlay.style.position = "fixed";
  overlay.style.top = "0";
  overlay.style.left = "0";
  overlay.style.width = "100%";
  overlay.style.height = "100%";
  overlay.style.backgroundColor = "rgba(0,0,0,0.95)";
  overlay.style.display = "flex";
  overlay.style.justifyContent = "center";
  overlay.style.alignItems = "center";
  overlay.style.zIndex = "45000";
  overlay.style.backdropFilter = "blur(10px)";
  document.body.appendChild(overlay);

  let tempSelectedIds = [];

  window.toggleStartingCardSelection = function (cardId) {
    let cardEl = document.getElementById(`starting-card-${cardId}`);
    if (!cardEl) return;

    if (tempSelectedIds.includes(cardId)) {
      tempSelectedIds = tempSelectedIds.filter((id) => id !== cardId);
      cardEl.style.borderColor = "#9b59b6";
      cardEl.style.background =
        "linear-gradient(135deg, #13111c 0%, #06040a 100%)";
      cardEl.style.transform = "none";
    } else {
      if (tempSelectedIds.length >= 2) {
        if (window.SoundManager) window.SoundManager.play("block");
        return;
      }
      tempSelectedIds.push(cardId);
      cardEl.style.borderColor = "#2ecc71";
      cardEl.style.background = "rgba(46, 204, 113, 0.1)";
      cardEl.style.transform = "translateY(-4px)";
      if (window.SoundManager) window.SoundManager.play("swing");
    }

    let btn = document.getElementById("btn-starting-draft-confirm");
    if (btn) {
      if (tempSelectedIds.length === 2) {
        btn.disabled = false;
        btn.style.background = "linear-gradient(135deg, #2ecc71, #27ae60)";
        btn.style.borderColor = "#fff";
        btn.style.boxShadow = "0 0 15px rgba(46, 204, 113, 0.6)";
        btn.innerText = "CONFIRM 2 SELECTIONS";
      } else {
        btn.disabled = true;
        btn.style.background = "#333";
        btn.style.borderColor = "#444";
        btn.style.boxShadow = "none";
        btn.innerText = `SELECT ${2 - tempSelectedIds.length} MORE CARD(S)`;
      }
    }
  };

  window.executeStartingDraftConfirm = function () {
    if (tempSelectedIds.length !== 2) return;

    window.playerStats.crucibleDraftDeck = [...tempSelectedIds];
    window.invalidatePlayerStats();
    let p = window.resolvePlayerStats();
    window.playerStats.currentHp = p.maxHp;

    overlay.remove();
    if (window.SoundManager) window.SoundManager.play("revive");
    window.pushHeaderToast("🚀 Starting modifiers infused!", "#2ecc71");

    window.setPauseState(false);
    window.updateUI();
    window.renderInventory();
    window.saveGame();
  };

  let cardsHtml = selectedCards
    .map((card) => {
      return `
      <div id="starting-card-${card.id}" class="market-card" style="
        background: linear-gradient(135deg, #13111c 0%, #06040a 100%);
        border: 2px solid #9b59b6;
        border-radius: 12px;
        padding: 12px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        align-items: center;
        cursor: pointer;
        width: 125px;
        height: 215px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.65);
        transition: transform 0.15s, border-color 0.15s;
      "
      onclick="window.toggleStartingCardSelection('${card.id}')">
        <div style="text-align:center; width:100%;">
          <strong style="color:#df9ffb; font-size:11.5px; display:block; margin-bottom:2px;">☀️ ${card.name}</strong>
          <span style="font-size:8px; color:#888; text-transform:uppercase; letter-spacing:0.5px;">INITIAL INFUSION</span>
        </div>
        <div style="font-size:24px; margin: 8px 0;">🔮</div>
        <div style="font-size:9.5px; color:#ccc; text-align:center; line-height:1.35; min-height:55px;">
          ${card.desc}
        </div>
        <span style="font-size:8.5px; color:#aaa; font-weight:bold;">Tap to Choose</span>
      </div>
    `;
    })
    .join("");

  overlay.innerHTML = `
    <div style="text-align:center; color:white; animation: toastFadeIn 0.3s ease-out; max-width:580px; width:95%;">
      <div style="font-size: 16px; font-weight: 950; color:#2ecc71; letter-spacing: 3px; text-transform: uppercase; text-shadow: 0 0 8px rgba(46,204,113,0.3); margin-bottom:4px;">✨ DRAFT 2 STARTING INFUSIONS ✨</div>
      <div style="font-size:10px; color:#aaa; margin-bottom:20px;">Prepare your baseline deck. Choose exactly 2 initial cards from the pool:</div>
      <div style="display:flex; gap:10px; justify-content:center; flex-wrap:wrap; margin-bottom:20px;">
        ${cardsHtml}
      </div>
      <button id="btn-starting-draft-confirm" class="btn-action" style="background:#333; border:1px solid #444; color:#777; font-weight:bold; font-size:11.5px; text-transform:uppercase; letter-spacing:1px; padding:12px 35px; border-radius:6px; cursor:pointer;" disabled onclick="window.executeStartingDraftConfirm()">SELECT 2 MORE CARDS</button>
    </div>
  `;
};

window.renderCavernSigilConsole = function () {
  let container = document.getElementById("cavern-sigil-slot-container");
  if (!container) return;

  let activeSig = window.playerStats.activeDungeonSigil;
  let slottedSig = window.state.slottedCavernSigil;

  if (window.playerStats.isDungeonMode && activeSig) {
    let col = window.getTierColor(activeSig.statsRolled);
    let buffDescs = activeSig.buffs
      .map(
        (b) =>
          `<span style="color:#2ecc71; display:block; font-size:9.5px;">• ☀️ ${b.name}: ${b.desc}</span>`,
      )
      .join("");
    let debuffDescs = activeSig.debuffs
      .map(
        (d) =>
          `<span style="color:#e74c3c; display:block; font-size:9.5px;">• 🌑 ${d.name}: ${d.desc}</span>`,
      )
      .join("");
    container.innerHTML = `
      <div style="display:flex; flex-direction:column; gap:4px;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <span style="font-size:9px; color:#aaa; text-transform:uppercase; font-weight:bold;">Active Cavern Sigil</span>
          <span style="color:${col}; font-weight:bold; font-size:10px;">${activeSig.statsRolled}★ Quality</span>
        </div>
        <strong style="color:${col}; font-size:12px; text-shadow:0 0 6px ${col}33;">${activeSig.name}</strong>
        <div style="background:#090b0e; border:1px solid #222; border-radius:4px; padding:6px; font-size:10px; line-height:1.4;">
                  <strong style="color:#f1c40f; font-family:monospace; display:block; margin-bottom:3px; text-transform:uppercase; font-size:9.5px;">⚡ ACTIVE MODIFIERS:</strong>
                  ${buffDescs}${debuffDescs}
                  <span style="color:#3498db; font-weight:bold; display:block; margin-top:3px; font-size:9.5px;">💎 Focus Rewards: +${(activeSig.rewardMultiplier * 100).toFixed(0)}% Gold/Loot Multiplier</span>
                  ${activeSig.qualityBoost > 0 ? `<span style="color:#ff007f; font-weight:bold; font-size:9.5px;">✨ Quality Boost: +${(activeSig.qualityBoost * 100).toFixed(0)}% Drop Quality</span>` : ""}
                </div>
        <div style="font-size:9px; color:#e74c3c; font-weight:bold; text-align:center; margin-top:1px;">⚠️ Sigil is consumed and locked to this active Dungeon run!</div>
      </div>
    `;
    return;
  }

  if (slottedSig) {
    let col = window.getTierColor(slottedSig.statsRolled);
    let buffDescs = slottedSig.buffs
      .map(
        (b) =>
          `<span style="color:#2ecc71; display:block; font-size:9.5px;">• ☀️ ${b.name}: ${b.desc}</span>`,
      )
      .join("");
    let debuffDescs = slottedSig.debuffs
      .map(
        (d) =>
          `<span style="color:#e74c3c; display:block; font-size:9.5px;">• 🌑 ${d.name}: ${d.desc}</span>`,
      )
      .join("");
    container.innerHTML = `
      <div style="display:flex; flex-direction:column; gap:4px;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <span style="font-size:9px; color:#aaa; text-transform:uppercase; font-weight:bold;">Slotted Cavern Sigil (Ready)</span>
          <button class="btn-action un" style="padding:1px 6px; font-size:9px;" onclick="window.unslotCavernSigil()">Remove</button>
        </div>
        <strong style="color:${col}; font-size:12px;">${slottedSig.name}</strong>
        <div style="background:#090b0e; border:1px solid #222; border-radius:4px; padding:6px; font-size:10px; line-height:1.4;">
                  <strong style="color:#f1c40f; font-family:monospace; display:block; margin-bottom:3px; text-transform:uppercase; font-size:9.5px;">⚡ TARGET MODIFIERS:</strong>
                  ${buffDescs}${debuffDescs}
                  <span style="color:#3498db; font-weight:bold; display:block; margin-top:3px; font-size:9.5px;">💎 Focus Rewards: +${(slottedSig.rewardMultiplier * 100).toFixed(0)}% Gold/Loot Multiplier</span>
                  ${slottedSig.qualityBoost > 0 ? `<span style="color:#ff007f; font-weight:bold; font-size:9.5px;">✨ Quality Boost: +${(slottedSig.qualityBoost * 100).toFixed(0)}% Drop Quality</span>` : ""}
                </div>
        <span style="font-size:8.5px; color:#888; text-align:center;">(Will be spent immediately upon launching any Infinite Dungeon)</span>
      </div>
    `;
    return;
  }

  // Search if any sigils exist
  let sigils = (window.inventory.SIGIL || []).filter(
    (item) => item && item.type === "sigil",
  );

  if (sigils.length === 0) {
    container.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; width:100%;">
          <div>
            <strong style="color:#9b59b6; font-size:11.5px; display:flex; align-items:center; gap:4px;">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle; filter: drop-shadow(0 0 2px rgba(155, 89, 182, 0.4));"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l1.5 1.5M17 6l2 2"/></svg>
              Optional Cavern Sigils
            </strong>
            <span style="font-size:9.5px; color:#aaa;">No Cavern Sigils owned. Slay Dungeon/Stage Bosses or Guardians to drop Sacks!</span>
          </div>
          <span style="font-size:9.5px; color:#666; font-style:italic;">0 owned</span>
        </div>
      `;
  } else {
    container.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; width:100%;">
          <div>
            <strong style="color:#9b59b6; font-size:11.5px; display:flex; align-items:center; gap:4px;">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle; filter: drop-shadow(0 0 2px rgba(155, 89, 182, 0.4));"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l1.5 1.5M17 6l2 2"/></svg>
              Slot Cavern Sigil Modifier
            </strong>
            <span style="font-size:9.5px; color:#aaa;">Equip a sigil to procedurally scale loot, shards, and quality!</span>
          </div>
          <button class="btn-action" style="background:#9b59b6; font-size:10px; padding:4px 10px;" onclick="window.openCavernSigilSelectorModal(event)">[ + ] Slot Sigil</button>
        </div>
      `;
  }
};

window.openCavernSigilSelectorModal = function (e) {
  if (e) e.stopPropagation();
  let existingWin = document.getElementById("sigil-swap-window");
  if (existingWin) existingWin.remove();

  let win = document.createElement("div");
  win.id = "sigil-swap-window";
  win.className = "draggable-window";
  win.style.left = "40px";
  win.style.top = "110px";

  let sigils = (window.inventory.SIGIL || []).filter(
    (item) => item && item.type === "sigil",
  );

  let contentHtml = sigils
    .map((item) => {
      let col = window.getTierColor(item.statsRolled);
      let bNames = item.buffs.map((b) => b.name).join(", ");
      let dNames = item.debuffs.map((d) => d.name).join(", ");

      return `
        <div class="bag-item" style="padding:6px; margin-bottom:5px; background:#181c22; border:1px solid #333; display:flex; justify-content:space-between; align-items:center; gap:6px;">
            <!-- Left side details: Tap safe for mobile tooltip (no auto-slotting) -->
            <div style="text-align:left; max-width: 170px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; flex:1; cursor:help; display:flex; align-items:center;"
                 onmouseenter="window.showInventoryTooltip(event, ${item.id})"
                 ontouchstart="window.showInventoryTooltip(event, ${item.id}); event.stopPropagation();"
                 onmouseleave="window.hideTooltip()">
                <div style="flex-shrink:0; margin-right:6px;">${window.getEquipIconHtml(item, 24)}</div>
                <div style="min-width:0; flex:1;">
                                    <strong style="color:${col}; font-size:11px; display:block; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${item.name}</strong>
                                    <span style="font-size:9.5px; color:#2ecc71; display:block; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">☀️ ${bNames}</span>
                                </div>
                            </div>
                            <!-- Right side: Explicit target button -->
                            <button class="btn-action" style="padding:3px 8px; font-size:10px; font-weight:bold; background:var(--accent-green); flex-shrink:0;" ontouchstart="event.stopPropagation();" onclick="window.executeSlotCavernSigil(${item.id})">Slot</button>
        </div>
      `;
    })
    .join("");

  win.innerHTML = `
      <div class="draggable-header" id="sigil-win-handle" style="background: linear-gradient(180deg, #181d24 0%, #0d1117 100%);">
          <span style="display:flex; align-items:center; gap:4px;">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle; filter: drop-shadow(0 0 2px rgba(241, 196, 15, 0.4));"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l1.5 1.5M17 6l2 2"/></svg>
              Slot Cavern Sigil
          </span>
          <button onclick="document.getElementById('sigil-swap-window').remove(); window.hideTooltip();" style="background:transparent; border:none; color:#e74c3c; font-weight:bold; cursor:pointer; font-size:11px; padding:2px;">[X]</button>
      </div>
      <div class="draggable-content">
          ${contentHtml}
      </div>
    `;

  document.getElementById("game-container").appendChild(win);
  window.makeWindowDraggable(win, document.getElementById("sigil-win-handle"));
};

window.unslotCavernSigil = function () {
  window.state.slottedCavernSigil = null;
  window.updateUI();
};

window.slotCavernSigilInline = function (sigilId) {
  if (!sigilId) return;
  let id = parseInt(sigilId, 10);
  let sigil = window.inventory.SIGIL.find((item) => item.id === id);
  if (sigil) {
    window.state.slottedCavernSigil = sigil;
    if (window.SoundManager) window.SoundManager.play("spell");
  }
  window.renderCavernsPrepUI();
};

window.unslotCavernSigilInline = function (event) {
  if (event) event.stopPropagation();
  window.state.slottedCavernSigil = null;
  if (window.SoundManager) window.SoundManager.play("swing");
  window.renderCavernsPrepUI();
};

window.updateSalvagePadUI = function () {
  let threshold =
    window.playerStats.autoSalvageThreshold !== undefined
      ? window.playerStats.autoSalvageThreshold
      : -1;
  let bulkTarget =
    window.state.bulkSalvageTarget !== undefined
      ? window.state.bulkSalvageTarget
      : 0;

  // Configuration matrix of colors, active styles, and fallback states
  let configs = {
    "-1": {
      bg: "#e74c3c",
      color: "#ffffff",
      border: "#ff6b6b",
      shadow: "rgba(231, 76, 60, 0.65)",
    },
    0: {
      bg: "#bdc3c7",
      color: "#111111",
      border: "#ffffff",
      shadow: "rgba(255, 255, 255, 0.5)",
    },
    1: {
      bg: "#3498db",
      color: "#ffffff",
      border: "#74b9ff",
      shadow: "rgba(52, 152, 219, 0.65)",
    },
    2: {
      bg: "#9b59b6",
      color: "#ffffff",
      border: "#a29bfe",
      shadow: "rgba(155, 89, 182, 0.65)",
    },
    3: {
      bg: "#e67e22",
      color: "#ffffff",
      border: "#ffbe76",
      shadow: "rgba(230, 126, 34, 0.65)",
    },
  };

  // 1. Auto-Salvage Buttons Styling
  let autoButtons = {
    "-1": "btn-auto-salvage-off",
    0: "btn-auto-salvage-0",
    1: "btn-auto-salvage-1",
    2: "btn-auto-salvage-2",
    3: "btn-auto-salvage-3",
  };

  for (let k in autoButtons) {
    let el = document.getElementById(autoButtons[k]);
    if (el) {
      if (parseInt(k, 10) === threshold) {
        el.classList.add("active");
        let cfg = configs[k];
        el.style.background = cfg.bg;
        el.style.color = cfg.color;
        el.style.borderColor = cfg.border;
        el.style.boxShadow = `0 0 12px ${cfg.shadow}`;
        el.style.opacity = "1";
        el.style.fontWeight = "bold";
      } else {
        el.classList.remove("active");
        el.style.background = "rgba(0,0,0,0.4)";
        el.style.color = "#7f8c8d";
        el.style.borderColor = "#2d3748";
        el.style.boxShadow = "";
        el.style.opacity = "0.45";
        el.style.fontWeight = "normal";
      }
    }
  }

  // 2. Bulk-Salvage Buttons Styling
  let bulkButtons = {
    0: "btn-bulk-salvage-0",
    1: "btn-bulk-salvage-1",
    2: "btn-bulk-salvage-2",
    3: "btn-bulk-salvage-3",
  };

  for (let k in bulkButtons) {
    let el = document.getElementById(bulkButtons[k]);
    if (el) {
      if (parseInt(k, 10) === bulkTarget) {
        el.classList.add("active");
        let cfg = configs[k];
        el.style.background = cfg.bg;
        el.style.color = cfg.color;
        el.style.borderColor = cfg.border;
        el.style.boxShadow = `0 0 12px ${cfg.shadow}`;
        el.style.opacity = "1";
        el.style.fontWeight = "bold";
      } else {
        el.classList.remove("active");
        el.style.background = "rgba(0,0,0,0.4)";
        el.style.color = "#7f8c8d";
        el.style.borderColor = "#2d3748";
        el.style.boxShadow = "";
        el.style.opacity = "0.45";
        el.style.fontWeight = "normal";
      }
    }
  }
};

// --- CAVERNS DESCENT PREPARATION PORTAL ---
window.openCavernsPreparationModal = function () {
  if (
    window.playerStats.isDungeonMode ||
    window.playerStats.isCrucibleMode ||
    window.playerStats.isPrestigeBossMode ||
    window.playerStats.isUberBoss
  ) {
    window.pushHeaderToast(
      "Cannot enter: already in another activity!",
      "#e74c3c",
    );
    return;
  }
  window.setPauseState(true);

  if (!window.state.selectedCavernsMode) {
    window.state.selectedCavernsMode = "equip";
  }

  let overlay = document.getElementById("caverns-prep-overlay");
  if (overlay) overlay.remove();

  overlay = document.createElement("div");
  overlay.id = "caverns-prep-overlay";
  overlay.style.position = "fixed";
  overlay.style.top = "0";
  overlay.style.left = "0";
  overlay.style.width = "100%";
  overlay.style.height = "100%";
  overlay.style.backgroundColor = "rgba(0,0,0,0.92)";
  overlay.style.display = "flex";
  overlay.style.justifyContent = "center";
  overlay.style.alignItems = "center";
  overlay.style.zIndex = "40000";
  overlay.style.backdropFilter = "blur(6px)";
  document.body.appendChild(overlay);

  window.renderCavernsPrepUI();
};

window.renderCavernsPrepUI = function () {
  let overlay = document.getElementById("caverns-prep-overlay");
  if (!overlay) return;

  let p = window.playerStats;
  let mode = window.state.selectedCavernsMode;
  let keys = p.dungeonKeys || 0;
  let slottedSig = window.state.slottedCavernSigil;

  let dNames = {
    equip: "Equipment Vault",
    gold: "Gold Mine Caverns",
    mat: "Toxic Material Pit",
  };
  let dColors = { equip: "#3498db", gold: "#f1c40f", mat: "#2ecc71" };

  let peak = p.dungeonPeaks[mode] || 1;
  let campaignStage = p.stage || 1;
  let checkpoint = Math.max(
    1,
    Math.floor(peak * 0.8),
    Math.floor(campaignStage * 0.7),
  );

  let modeDescs = {
    equip:
      "Ascend floor by floor to claim high-quality gear! Checkpoint resets keep you within striking range of high-rarity drops.",
    gold: "Amass massive piles of gold coins! Drops inside the caverns are multiplied heavily, bypassing regular routing curves.",
    mat: "Dredge the toxic sludges for crafting resources. Higher depths yield rare Epic, Legendary, and Mythic scraps.",
  };

  // Build Mode Select Tab Buttons
  let modeTabs = ["equip", "gold", "mat"]
    .map((mKey) => {
      let isActive = mode === mKey;
      let btnCol = dColors[mKey];
      let activeStyle = isActive
        ? `background: ${window.hexToRgba(btnCol, 0.15)}; border-color: ${btnCol}; color: #fff; box-shadow: 0 0 8px ${btnCol}55;`
        : `background: #090b0e; color: #7f8c8d; border-color: #1e293b;`;
      return `<button class="sub-tab-btn" style="padding: 8px 10px; font-size:10px; flex: 1; ${activeStyle}" onclick="window.selectCavernsMode('${mKey}')">${mKey === "equip" ? "Equipment" : mKey === "gold" ? "Gold" : "Materials"}</button>`;
    })
    .join("");

  // Build Cavern Sigil slot details
  let sigilSlotHtml = "";
  if (slottedSig) {
    let col = window.getTierColor(slottedSig.statsRolled);
    let buffDescs = slottedSig.buffs
      .map(
        (b) =>
          `<span style="color:#2ecc71; display:block; font-size:9.5px; line-height:1.4;">• ☀️ ${b.name}: ${b.desc}</span>`,
      )
      .join("");
    let debuffDescs = slottedSig.debuffs
      .map(
        (d) =>
          `<span style="color:#e74c3c; display:block; font-size:9.5px; line-height:1.4;">• 🌑 ${d.name}: ${d.desc}</span>`,
      )
      .join("");
    sigilSlotHtml = `
        <div style="background:rgba(${window.hexToRgbValues(col)}, 0.08); border: 2px solid ${col}; border-radius: 8px; padding: 12px; margin-bottom: 12px; text-align:left; position:relative; box-shadow: 0 4px 15px rgba(0,0,0,0.5), inset 0 0 10px rgba(${window.hexToRgbValues(col)}, 0.1); animation: toastFadeIn 0.25s;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
            <span style="font-size:9.5px; color:${col}; font-weight:bold; letter-spacing:1px; text-transform:uppercase;">⚡ ACTIVE CHAMBER MODIFIER</span>
            <button class="btn-action un" style="padding:2px 8px; font-size:9.5px; font-weight:bold;" onclick="window.unslotCavernSigilInline(event)">Unslot</button>
          </div>
          <div style="display:flex; align-items:center; gap:8px; margin-bottom:8px;">
            <div style="flex-shrink:0;">${window.getEquipIconHtml(slottedSig, 32)}</div>
            <div style="min-width:0; flex:1;">
              <strong style="color:${col}; font-size:13px; text-shadow:0 0 6px ${col}44; display:block; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; max-width:260px;">${slottedSig.name}</strong>
              <span style="font-size:9px; color:#aaa; font-family:monospace; display:block; margin-top:2px;">Rarity: ${slottedSig.statsRolled}★ ${window.getTierName(slottedSig.statsRolled)}</span>
            </div>
          </div>
          <div style="background:#090b0e; border:1px solid #222; border-radius:4px; padding:8px; font-size:10px; line-height:1.4;">
                      ${buffDescs}${debuffDescs}
                      <div style="border-top:1px dashed #222; margin-top:6px; padding-top:4px; display:flex; flex-direction:column; gap:1px; font-family:monospace; font-size:9.5px;">
                        <span style="color:#3498db; font-weight:bold;">💎 Focus Rewards: +${(slottedSig.rewardMultiplier * 100).toFixed(0)}% Gold/Loot Multiplier</span>
                        ${slottedSig.qualityBoost > 0 ? `<span style="color:#ff007f; font-weight:bold;">✨ Quality Boost: +${(slottedSig.qualityBoost * 100).toFixed(0)}% Drop Quality</span>` : ""}
                      </div>
                    </div>
        </div>
      `;
  } else {
    // Correctly search the specialized SIGIL pouch instead of the old EQUIP array
    let ownedSigils = window.inventory.SIGIL || [];

    if (ownedSigils.length === 0) {
      sigilSlotHtml = `
          <div style="background:#111; border: 1.5px dashed #333; border-radius: 8px; padding: 16px; margin-bottom: 12px; text-align:center; font-size:10.5px; color:#7f8c8d; line-height:1.45; white-space:normal;">
            No Cavern Sigils found in your pouch.<br>Slay standard Campaign Bosses, Rare Spawns, or Dungeon Bosses to drop **Cavern Sigil Sacks**!
          </div>
        `;
    } else {
      // Build an elegant grid for direct, one-click slotting
      let gridHtml = ownedSigils
        .map((sig) => {
          let col = window.getTierColor(sig.statsRolled);
          let shortName = sig.name.split(" (")[0];
          return `
                    <div style="background:#111; border: 1.5px solid ${col}44; border-radius:6px; padding:6px; display:flex; align-items:center; justify-content:space-between; gap:6px; transition: all 0.15s ease; position:relative;">
                      <!-- Left Details Area: Tap-safe for mobile tooltip (does not auto-slot) -->
                      <div style="display:flex; align-items:center; gap:8px; min-width:0; flex:1; cursor:help;"
                           onmouseenter="window.showInventoryTooltip(event, ${sig.id})"
                           ontouchstart="window.showInventoryTooltip(event, ${sig.id}); event.stopPropagation();"
                           onmouseleave="window.hideTooltip()">
                        <div style="flex-shrink:0;">${window.getEquipIconHtml(sig, 24)}</div>
                        <div style="min-width:0; flex:1; text-align:left;">
                                                  <strong style="color:${col}; font-size:10px; display:block; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; max-width:115px;">${shortName}</strong>
                                                  <span style="font-size:8.5px; color:#888; display:block; font-family:monospace; margin-top:1px;">Gold/Loot: +${(sig.rewardMultiplier * 100).toFixed(0)}%</span>
                                                </div>
                      </div>
                      <!-- Right Action Area: Explicit Target Button -->
                      <button class="btn-action" style="background:#2ecc71; color:#fff; font-size:9px; padding:4px 8px; border-radius:4px; font-weight:bold; height:24px; line-height:1; flex-shrink:0;"
                              ontouchstart="event.stopPropagation();"
                              onclick="window.slotCavernSigilInline('${sig.id}')">
                        Slot
                      </button>
                    </div>
                  `;
        })
        .join("");

      sigilSlotHtml = `
          <div style="margin-bottom: 12px; text-align:left;">
            <span style="font-size:10px; color:#9b59b6; font-weight:bold; text-transform:uppercase; letter-spacing:0.5px; display:block; margin-bottom:6px;">🎒 SELECT CAVERN MODIFIER (Click to Slot):</span>
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:6px; max-height:130px; overflow-y:auto; padding-right:4px;">
              ${gridHtml}
            </div>
          </div>
        `;
    }
  }

  let canStart = keys >= 1;
  let launchColor = dColors[mode];

  overlay.innerHTML = `
                  <div style="background:#1a1a1a; border:3px solid #9b59b6; border-radius:12px; width:95%; max-width:440px; box-shadow:0 15px 45px rgba(0,0,0,0.95); text-align:center; padding:15px; animation: toastFadeIn 0.3s; color:#f1f5f9; max-height:92vh; overflow-y:auto; overscroll-behavior:contain;">
                    <div style="display:flex; justify-content:space-between; align-items:center; width:100%; border-bottom:1px solid #9b59b6; padding-bottom:6px; margin-bottom:12px;">
                      <h3 style="margin:0; color:#df9ffb; font-size:13px; letter-spacing:1px; display:flex; align-items:center; gap:6px; text-transform:uppercase;">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#df9ffb" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle; filter: drop-shadow(0 0 4px #df9ffb);"><circle cx="12" cy="12" r="10" stroke-dasharray="3 3"/><circle cx="12" cy="12" r="5" stroke="#9b59b6" fill="#ff007f" fill-opacity="0.15"/><circle cx="12" cy="12" r="1.5" fill="#fff"/></svg>
                        Caverns Preparation Portal
                      </h3>
                      <button onclick="document.getElementById('caverns-prep-overlay').remove(); window.setPauseState(false); window.hideTooltip();" style="background:#222; border:1px solid #444; color:#aaa; font-weight:bold; cursor:pointer; font-size:10px; padding:3px 8px; border-radius:4px;">Close</button>
                    </div>

                    <!-- Step 1: Mode Select -->
                    <div style="display:flex; flex-direction:column; gap:6px; margin-bottom:12px;">
                      <strong style="color:${launchColor}; font-size:11px; display:block; text-align:left; text-transform:uppercase; letter-spacing:0.5px;">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle; transform: translateY(-1px); margin-right: 4px;"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/><line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/></svg>
                        CHOOSE DESCENT OBJECTIVE:
                      </strong>
                      <div style="display:flex; gap:6px; width:100%;">${modeTabs}</div>
                    </div>

                    <!-- Mode details card -->
                    <div style="background:#111; border:1px solid #222; border-radius:6px; padding:10px; margin-bottom:12px; text-align:left;">
                      <strong style="color:${launchColor}; font-size:12.5px; display:block; margin-bottom:4px;">${dNames[mode]}</strong>
                      <p style="font-size:10.5px; color:#aaa; line-height:1.45; margin:0 0 8px 0; white-space:normal;">${modeDescs[mode]}</p>
                      <div style="display:flex; gap:12px; font-size:10px; color:#cbd5e1; border-top:1px dashed #333; padding-top:6px; font-family:monospace;">
                        <span>Peak Reached: <strong style="color:${launchColor};">Floor ${peak}</strong></span>
                        <span>Checkpoint Start: <strong style="color:#2ecc71;">Floor ${checkpoint}</strong></span>
                      </div>
                    </div>

                    <!-- Step 2: Apply Cavern Sigil -->
                    <strong style="color:#df9ffb; font-size:11px; display:block; text-align:left; text-transform:uppercase; margin-bottom:6px; letter-spacing:0.5px;">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle; transform: translateY(-1.5px); margin-right: 4px;"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l1.5 1.5M17 6l2 2"/></svg>
                      APPLY CAVERN SIGIL MODIFIER:
                    </strong>
                    ${sigilSlotHtml}

            <!-- Entry Cost & Launch -->
            <div style="background:#090a0f; border:1px solid #2d3748; border-radius:6px; padding:10px; display:flex; justify-content:space-between; align-items:center; font-family:monospace; font-size:10px; margin-bottom:12px;">
              <span>Keys Held: <strong style="color:${canStart ? "#2ecc71" : "#e74c3c"};">${keys} / 5</strong></span>
              <span>Descent Cost: <strong style="color:#f1c40f;">1 Key</strong></span>
            </div>

            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
              <button class="btn-action" style="background:#334155; border-color:#475569;" onclick="document.getElementById('caverns-prep-overlay').remove(); window.setPauseState(false); window.hideTooltip();">Cancel</button>
              <button class="btn-action btn-pulse" style="background:${launchColor}; color:${launchColor === "#f1c40f" ? "#111" : "#fff"}; border-color:#fff; box-shadow:0 0 10px ${launchColor}55;" ${canStart ? "" : 'disabled style="opacity:0.5; cursor:not-allowed;"'} onclick="window.executeCavernsDescent()">Descend into the Deep</button>
            </div>
          </div>
        `;
};

window.selectCavernsMode = function (mode) {
  window.state.selectedCavernsMode = mode;
  window.renderCavernsPrepUI();
};

window.slotCavernSigilInline = function (sigilId) {
  if (!sigilId) return;
  let id = parseInt(sigilId, 10);
  let sigil = window.inventory.SIGIL.find((item) => item.id === id);
  if (sigil) {
    window.state.slottedCavernSigil = sigil;
  }
  window.renderCavernsPrepUI();
};

window.unslotCavernSigilInline = function (event) {
  if (event) event.stopPropagation();
  window.state.slottedCavernSigil = null;
  window.renderCavernsPrepUI();
};

window.executeCavernsDescent = function () {
  if (
    window.playerStats.isDungeonMode ||
    window.playerStats.isCrucibleMode ||
    window.playerStats.isPrestigeBossMode ||
    window.playerStats.isUberBoss
  ) {
    window.pushHeaderToast(
      "Cannot enter: already in another activity!",
      "#e74c3c",
    );
    return;
  }
  let mode = window.state.selectedCavernsMode || "equip";
  let keys = window.playerStats.dungeonKeys || 0;

  if (keys < 1) {
    window.pushHeaderToast("❌ Insufficient Dungeon Keys!", "#e74c3c");
    return;
  }

  // Consume key and launch!
  window.playerStats.dungeonKeys--;
  if (window.playerStats.dungeonKeys === 4) {
    window.playerStats.nextDungeonKeyTime = Date.now() + 14400000; // 4 Hours
  }

  // Consume and Lock Slotted Cavern Sigil if applied
  if (window.state.slottedCavernSigil) {
    let activeSig = window.state.slottedCavernSigil;
    window.playerStats.activeDungeonSigil = activeSig;
    window.state.slottedCavernSigil = null;

    // Properly remove sigil from the SIGIL pouch
    let sIdx = window.inventory.SIGIL.findIndex((i) => i.id === activeSig.id);
    if (sIdx !== -1) {
      window.inventory.SIGIL.splice(sIdx, 1);
    }
  } else {
    window.playerStats.activeDungeonSigil = null;
  }

  let peak = window.playerStats.dungeonPeaks[mode] || 1;
  let campaignStage = window.playerStats.stage || 1;
  let checkpoint = Math.max(
    1,
    Math.floor(peak * 0.8),
    Math.floor(campaignStage * 0.7),
  );

  window.playerStats.isDungeonMode = true;
  window.playerStats.dungeonAccumulatedGold = 0;
  window.playerStats.dungeonAccumulatedXp = 0;
  window.playerStats.dungeonAccumulatedLoot = [];
  window.playerStats.isCrucibleMode = false;
  window.playerStats.currentDungeon = mode;
  window.playerStats.currentDungeonStage[mode] = checkpoint;
  window.playerStats.dungeonWave = 1;
  window.playerStats.killCount = 0;
  window.playerStats.targetsRequired = 3; // Reduced from 5 to 3
  window.playerStats.isBossMode = false;
  window.playerStats.isUberBoss = false;
  window.mob = null;

  let p = window.resolvePlayerStats();
  window.playerStats.currentHp = p.maxHp;

  let dNames = {
    equip: "Equipment Vault",
    gold: "Gold Mine Caverns",
    mat: "Toxic Material Pit",
  };
  window.pushLog(
    `<span style='color:#9b59b6; font-weight:bold;'>[DUNGEON] Descended into ${dNames[mode]} at Floor ${checkpoint}!</span>`,
  );

  // Close preparation modal
  let prepOverlay = document.getElementById("caverns-prep-overlay");
  if (prepOverlay) prepOverlay.remove();

  window.setPauseState(false);
  window.updateUI();
  window.renderInventory();
  window.saveGame();
};

window.requestRename = function () {
  const inputEl = document.getElementById("settings-player-name");
  if (!inputEl) return;
  const newName = inputEl.value.trim();

  if (!window.validateNameInput(newName)) {
    window.pushHeaderToast(
      "❌ Invalid Name! 3-14 characters, letters/numbers and single spaces only.",
      "#e74c3c",
    );
    return;
  }

  if (!window.GAME_SERVER_URL) {
    // Offline / local fallback mode
    window.playerStats.playerName = newName;
    const currentLabel = document.getElementById("current-name-label");
    if (currentLabel) {
      currentLabel.innerText = `(Current: ${newName})`;
    }
    const headerName = document.getElementById("header-player-name");
    if (headerName) {
      headerName.innerHTML = `<span>${newName}</span>`;
    }
    window.pushHeaderToast(
      "👤 Name changed successfully (Offline)!",
      "#2ecc71",
    );
    window.updateUI();
    window.saveGame();
    return;
  }

  const userId = window.getGameUserId();
  fetch(`${window.GAME_SERVER_URL}/api/register-name`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, name: newName }),
  })
    .then((r) => r.json())
    .then((data) => {
      if (data.success) {
        window.playerStats.playerName = newName;
        const currentLabel = document.getElementById("current-name-label");
        if (currentLabel) {
          currentLabel.innerText = `(Current: ${newName})`;
        }
        window.pushHeaderToast(
          "👤 Character name registered successfully!",
          "#2ecc71",
        );
        window.updateUI();
        window.saveGame();
      } else {
        window.pushHeaderToast(`❌ ${data.error}`, "#e74c3c");
      }
    })
    .catch((err) => {
      console.error("Rename failed:", err);
      window.pushHeaderToast("❌ Network error registering name.", "#e74c3c");
    });
};

// ==========================================================================
// --- BESTIARY Album SYSTEM (BOOK INTERFACE) ---
// ==========================================================================

window.selectedBestiarySetKey =
  window.selectedBestiarySetKey ||
  (window.CARD_SETS_DATA
    ? Object.keys(window.CARD_SETS_DATA)[0]
    : "Whispering Woods");

window.toggleBestiaryAlbum = function () {
  let modal = document.getElementById("bestiary-modal");
  if (!modal) return;

  if (modal.style.display === "none" || modal.style.display === "") {
    window.hideTooltip();
    window.renderBestiaryAlbum();
    modal.style.display = "block";
    window.setPauseState(true);

    // Launch the live card breathing/animation loop
    if (typeof window.animateBestiaryCards === "function") {
      window.animateBestiaryCards();
    }
  } else {
    modal.style.display = "none";
    window.hideTooltip();
    window.setPauseState(false);

    // Stop the loop to conserve battery/CPU
    if (window.bestiaryAnimFrameId) {
      cancelAnimationFrame(window.bestiaryAnimFrameId);
      window.bestiaryAnimFrameId = null;
    }
  }
};

window.selectBestiarySet = function (setKey) {
  window.selectedBestiarySetKey = setKey;
  window.renderBestiaryAlbum();
  if (typeof window.hideTooltip === "function") window.hideTooltip();
};

window.getCardUpgradeCost = function (currentTier) {
  let mSouls = 0;
  let lSouls = 0;
  if (currentTier === -1) {
    mSouls = 50;
    lSouls = 0;
  } else if (currentTier === 0) {
    mSouls = 150;
    lSouls = 0;
  } else if (currentTier === 1) {
    mSouls = 300;
    lSouls = 0;
  } else if (currentTier === 2) {
    mSouls = 500;
    lSouls = 2;
  } else if (currentTier === 3) {
    mSouls = 1000;
    lSouls = 5;
  } else if (currentTier === 4) {
    mSouls = 2500;
    lSouls = 10;
  }
  return { mSouls, lSouls };
};

window.renderBestiaryAlbum = function () {
  if (window.CARD_SETS_DATA) {
    if (!window.CARD_SETS_DATA["Equipment Vault"]) {
      window.CARD_SETS_DATA["Equipment Vault"] = {
        name: "Equipment Vault",
        theme: "Armor Pierce",
        statKey: "atkPctBonus",
        cards: ["animated_armor", "cursed_blade", "mimic_shield"],
        isDungeon: true,
      };
    }
    if (!window.CARD_SETS_DATA["Material Cavern"]) {
      window.CARD_SETS_DATA["Material Cavern"] = {
        name: "Material Cavern",
        theme: "Vigor Synergy",
        statKey: "maxHpPctBonus",
        cards: ["slag_slime", "rust_nibbler", "corroded_golem"],
        isDungeon: true,
      };
    }
    if (!window.CARD_SETS_DATA["Gold Mine"]) {
      window.CARD_SETS_DATA["Gold Mine"] = {
        name: "Gold Mine",
        theme: "Midas Resonance",
        statKey: "gold",
        cards: ["coin_elemental", "hoard_mimic", "gilded_scuttler"],
        isDungeon: true,
      };
    }
  }
  if (window.MONSTER_CARDS_DATA) {
    if (!window.MONSTER_CARDS_DATA["animated_armor"]) {
      window.MONSTER_CARDS_DATA["animated_armor"] = {
        name: "Sentinel Suit",
        desc: "A spectral suit of runic armor animated by ancient kinetic forces.",
        baseStat: "def",
        baseVal: 6,
        isPct: false,
      };
    }
    if (!window.MONSTER_CARDS_DATA["cursed_blade"]) {
      window.MONSTER_CARDS_DATA["cursed_blade"] = {
        name: "Spectral Sword",
        desc: "An ancient obsidian blade wrapped in undying purple cursed flames.",
        baseStat: "atk",
        baseVal: 5,
        isPct: false,
      };
    }
    if (!window.MONSTER_CARDS_DATA["mimic_shield"]) {
      window.MONSTER_CARDS_DATA["mimic_shield"] = {
        name: "Aegis Mimic",
        desc: "A heavy shield that breathes, lined with sharp golden teeth.",
        baseStat: "block",
        baseVal: 0.005,
        isPct: true,
      };
    }
    if (!window.MONSTER_CARDS_DATA["slag_slime"]) {
      window.MONSTER_CARDS_DATA["slag_slime"] = {
        name: "Slag Sludge",
        desc: "A bubbling mass of corrosive alchemical run-off containing melted metallic waste.",
        baseStat: "maxHp",
        baseVal: 40,
        isPct: false,
      };
    }
    if (!window.MONSTER_CARDS_DATA["rust_nibbler"]) {
      window.MONSTER_CARDS_DATA["rust_nibbler"] = {
        name: "Rust Scuttler",
        desc: "A voracious scavenger that feeds on oxidized alloys, leaving corroded ruins in its wake.",
        baseStat: "dex",
        baseVal: 4,
        isPct: false,
      };
    }
    if (!window.MONSTER_CARDS_DATA["corroded_golem"]) {
      window.MONSTER_CARDS_DATA["corroded_golem"] = {
        name: "Alchemical Sentinel",
        desc: "A clay automaton powered by highly pressurized tubes of glowing toxic sludge.",
        baseStat: "def",
        baseVal: 8,
        isPct: false,
      };
    }
    if (!window.MONSTER_CARDS_DATA["coin_elemental"]) {
      window.MONSTER_CARDS_DATA["coin_elemental"] = {
        name: "Coin Elemental",
        desc: "A magnetic vortex of animated gold coins swirling around a highly concentrated nucleus.",
        baseStat: "gold",
        baseVal: 0.015,
        isPct: true,
      };
    }
    if (!window.MONSTER_CARDS_DATA["hoard_mimic"]) {
      window.MONSTER_CARDS_DATA["hoard_mimic"] = {
        name: "Hoard Mimic",
        desc: "A wooden chest masquerading as rich treasure, snapping its heavy lid on greedy hands.",
        baseStat: "critChance",
        baseVal: 0.005,
        isPct: true,
      };
    }
    if (!window.MONSTER_CARDS_DATA["gilded_scuttler"]) {
      window.MONSTER_CARDS_DATA["gilded_scuttler"] = {
        name: "Gilded Scuttler",
        desc: "A skittering gold-shelled scarab that absorbs metal ores to crystallize its carapace.",
        baseStat: "dropRate",
        baseVal: 0.01,
        isPct: true,
      };
    }
  }

  let contentEl = document.getElementById("bestiary-content");
  if (!contentEl) return;

  let activeSetKey = window.selectedBestiarySetKey;
  let pStats = window.playerStats;
  let cardsOwned = pStats.monsterCards || {};
  let thresholds = window.CARD_UPGRADE_THRESHOLDS || [
    25, 50, 150, 300, 750, 1800,
  ];

  // --- LEFT PAGE: SET SELECTOR (TABS) ----
  let leftPageHtml = `
    <div class="bestiary-page-left" style="flex: 1; border-right: 1px dashed #4a154b; padding-right: 12px; display:flex; flex-direction:column; gap:6px; min-height: 380px;">
      <h4 style="margin: 0 0 8px 0; color:#df9ffb; font-size:12px; text-transform:uppercase; letter-spacing:1px; text-align:left; border-bottom:1px solid #333; padding-bottom:4px;">📜 Album Directory</h4>
  `;

  let renderTabItem = (sKey, sData) => {
    let minTierInSet = 5;
    let anyLocked = false;
    let unlockedCount = 0;

    sData.cards.forEach((cKey) => {
      let count = cardsOwned[cKey] || 0;
      let t = window.getCardTier(count);
      if (t < 0) anyLocked = true;
      else {
        unlockedCount++;
        if (t < minTierInSet) minTierInSet = t;
      }
    });

    let setBadge = "";
    if (anyLocked) {
      setBadge = `<span style="font-size:9px; color:#888;">(${unlockedCount}/${sData.cards.length})</span>`;
    } else {
      const setLabels = [
        "Common",
        "Rare",
        "Magic",
        "Epic",
        "Legendary",
        "Mythic",
      ];
      let setLabelName = setLabels[minTierInSet] || "Unknown";
      let setCol = window.getTierColor(minTierInSet);
      setBadge = `<span style="background:${setCol}1a; border:1px solid ${setCol}; color:${setCol}; font-size:8.5px; padding:1px 5px; border-radius:10px; font-weight:bold;">${minTierInSet === 5 ? "AWAKENED 🔥" : setLabelName}</span>`;
    }

    let isSelected = activeSetKey === sKey;
    let tabBg = isSelected
      ? "background:rgba(168, 85, 247, 0.12); border-color:#a855f7;"
      : "background:#111; border-color:#333;";

    return `
      <div class="bag-item" style="${tabBg} padding:8px 10px; display:flex; justify-content:space-between; align-items:center; cursor:pointer; margin-bottom:0;" onclick="window.selectBestiarySet('${sKey}')">
        <span style="font-size:11.5px; font-weight:bold; color:${isSelected ? "#df9ffb" : "#ccc"};">${sData.name.replace(" Set", "")}</span>
        ${setBadge}
      </div>
    `;
  };

  leftPageHtml += `<div style="font-size:9px; color:#ffb6c1; font-weight:bold; text-transform:uppercase; letter-spacing:1px; margin-bottom:4px; text-align:left;">🗺️ Campaign Areas</div>`;
  for (let sKey in window.CARD_SETS_DATA) {
    let sData = window.CARD_SETS_DATA[sKey];
    if (sData.isDungeon) continue;
    leftPageHtml += renderTabItem(sKey, sData);
  }

  leftPageHtml += `<div style="font-size:9px; color:#00d2ff; font-weight:bold; text-transform:uppercase; letter-spacing:1px; margin-top:10px; margin-bottom:4px; text-align:left;">🏰 Instanced Dungeons</div>`;
  for (let sKey in window.CARD_SETS_DATA) {
    let sData = window.CARD_SETS_DATA[sKey];
    if (!sData.isDungeon) continue;
    leftPageHtml += renderTabItem(sKey, sData);
  }

  leftPageHtml += `</div>`;
  let dustOwned = pStats.astralDust || 0;

  // --- RIGHT PAGE: CARD DECK ALBUM ---
  let sData = window.CARD_SETS_DATA[activeSetKey];
  let minTierInSet = 5;
  let anyLocked = false;
  sData.cards.forEach((cKey) => {
    let count = cardsOwned[cKey] || 0;
    let t = window.getCardTier(count);
    if (t < 0) anyLocked = true;
    if (t < minTierInSet) minTierInSet = t;
  });

  let minCopiesInSet = 999999;
  sData.cards.forEach((cKey) => {
    let count = cardsOwned[cKey] || 0;
    if (count < minCopiesInSet) minCopiesInSet = count;
  });

  let setMultiplierLabel = "No Set Bonus (Requires 10+ copies of each card)";
  let setBonusCol = "#888";

  if (minCopiesInSet >= 10 && !anyLocked && minTierInSet >= 0) {
    const setMultipliers = [20, 35, 50, 65, 80, 100];
    let mult = setMultipliers[minTierInSet] || 20;
    setMultiplierLabel = `+${mult}% ${sData.theme} ${minTierInSet === 5 ? " Awakened! 🔥" : "Active"}`;
    setBonusCol = window.getTierColor(minTierInSet);
  } else if (!anyLocked && minTierInSet === 0) {
    setMultiplierLabel = `LOCKED: Need 10+ copies of each card (Min: ${minCopiesInSet}/10)`;
    setBonusCol = "#7f8c8d";
  }

  let rightPageHtml = `
    <div class="bestiary-page-right" style="flex: 1.25; padding-left: 12px; display:flex; flex-direction:column; justify-content:space-between; height:100%;">
      <div>
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #4a154b; padding-bottom:4px; margin-bottom:10px;">
          <strong style="color:#df9ffb; font-size:13px; text-transform:uppercase; letter-spacing:0.5px;">${sData.name}</strong>
        </div>
        <div style="background:rgba(0,0,0,0.45); border:1px solid ${setBonusCol}; padding:8px 10px; border-radius:6px; text-align:center; font-family:monospace; font-size:11px; margin-bottom:12px; box-shadow: inset 0 0 10px rgba(0,0,0,0.5);">
          <div style="font-size:8.5px; color:#aaa; text-transform:uppercase; margin-bottom:2px;">Set Passive Bonus Matrix:</div>
          <strong style="color:${setBonusCol}; font-size:12px; text-shadow:0 0 6px ${setBonusCol}33;">${setMultiplierLabel}</strong>
        </div>

        <div style="display:flex; flex-direction:column; gap:8px;">
  `;

  sData.cards.forEach((cKey) => {
    let cData = window.MONSTER_CARDS_DATA[cKey];
    let count = cardsOwned[cKey] || 0;
    let tier = window.getCardTier(count);

    let isLocked = tier < 0;
    let cardColor = isLocked ? "#444" : window.getTierColor(tier);

    let nextThresholdIndex = tier + 1;
    let nextThreshold = thresholds[nextThresholdIndex] || 600;
    let baseThreshold = thresholds[tier] || 0;

    let isMaxed = tier >= 5;

    let flatProgressText = "";
    let fillPct = 0;
    let firstThreshold = thresholds[0] || 25;
    if (isLocked) {
      flatProgressText = `${count} / ${firstThreshold}`;
      fillPct = (count / firstThreshold) * 100;
    } else if (isMaxed) {
      flatProgressText = `MAX TIER`;
      fillPct = 100;
    } else {
      flatProgressText = `${count} / ${nextThreshold}`;
      fillPct =
        ((count - baseThreshold) / (nextThreshold - baseThreshold)) * 100;
    }

    let costs = window.getCardUpgradeCost(tier);
    let soulsOwned = window.inventory.ETC["Monster Soul"] || 0;
    let luminousOwned = window.inventory.ETC["Luminous Soul"] || 0;

    let canAffordSouls =
      soulsOwned >= costs.mSouls && luminousOwned >= costs.lSouls;
    let canAffordDuplicates = isLocked ? count >= 5 : count >= nextThreshold;

    let canUpgrade = !isMaxed && canAffordDuplicates && canAffordSouls;

    let progressGlow = canUpgrade ? "animation: pulseGlow 1.2s infinite;" : "";
    let fillGrad = isLocked
      ? `background:#555;`
      : isMaxed
        ? `background:linear-gradient(90deg, #f1c40f, #e74c3c);`
        : `background:linear-gradient(90deg, #ffd700, #ff007f);`;

    let upgradeBtnHtml = "";
    if (isMaxed) {
      upgradeBtnHtml = `<span style="color:#2ecc71; font-weight:bold; font-size:8px; font-family:monospace;">MAX</span>`;
    } else if (canUpgrade) {
      upgradeBtnHtml = `<button class="btn-action btn-pulse-teal" style="padding:2px 6px; font-size:8px; font-weight:bold; height:18px; line-height:1;" ontouchstart="event.stopPropagation();" onclick="window.upgradeBestiaryCard('${cKey}')">UP</button>`;
    } else if (canAffordDuplicates) {
      let mColor = soulsOwned >= costs.mSouls ? "#2ecc71" : "#e74c3c";
      upgradeBtnHtml = `<span style="font-size:8px; color:#888; font-family:monospace; line-height:1; display:block;">Req: <span style="color:${mColor}">${costs.mSouls}</span></span>`;
    } else {
      upgradeBtnHtml = `<span style="font-size:8px; color:#666; font-family:monospace;">Locked</span>`;
    }

    let statsDisplayLabelShort = "";
    if (isLocked) {
      statsDisplayLabelShort = `<span style="color:#7f8c8d; font-style:italic; font-size:9.5px;">Sacks to unlock!</span>`;
    } else {
      let isUtility = [
        "critChance",
        "critDamage",
        "block",
        "parry",
        "dropRate",
        "quality",
        "goldMulti",
        "rareSpawn",
        "fairySpawn",
        "xpRate",
      ].includes(cData.baseStat);
      let val = isUtility
        ? window.getUtilityCardValue(tier)
        : window.getCardValue(cData.baseVal, tier);
      let formattedVal = cData.isPct
        ? `+${(val * 100).toFixed(1)}%`
        : `+${val.toFixed(1)}`;
      statsDisplayLabelShort = `<strong style="color:#2ecc71; font-size:10px;">${formattedVal} ${window.getStatLabel(cData.baseStat)}</strong>`;
    }

    let canvasId = `bestiary-card-canvas-${cKey}`;

    let cardClass = "bestiary-card-item";
    if (!isLocked && tier === 5) {
      cardClass += " bestiary-card-holo";
    }

    rightPageHtml += `
                <div class="${cardClass}" style="
                  background: linear-gradient(135deg, #110d1c 0%, #06040a 100%);
                  border: 2px solid ${cardColor};
                  border-radius: 10px;
                  padding: 8px 10px;
                  display: flex;
                  flex-direction: column;
                  justify-content: space-between;
                  align-items: center;
                  position: relative;
                  height: 235px;
                  box-shadow: 0 4px 15px rgba(0,0,0,0.65), inset 0 0 10px ${cardColor}15;
                  transition: transform 0.18s, box-shadow 0.18s;
                "
                onmouseenter="window.showCardTooltip(event, '${cKey}')"
                onmouseleave="window.hideTooltip()"
                ontouchstart="window.showCardTooltip(event, '${cKey}')">

            <!-- Header: Name & Tier -->
            <div style="width:100%; text-align:center;">
              <strong style="color:${cardColor}; font-size:11.5px; display:block; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-family:sans-serif;">${cData.name.replace(" Card", "")}</strong>
              <span style="font-size:8px; color:#888; text-transform:uppercase; letter-spacing:0.5px; display:block; margin-top:1px;">${isLocked ? "Locked" : window.getTierName(tier)}</span>
            </div>

            <!-- Card Art Canvas Frame -->
            <div style="background: rgba(0,0,0,0.6); border: 1.5px solid ${isLocked ? "#222" : cardColor}44; border-radius: 6px; width: 72px; height: 72px; display: flex; align-items: center; justify-content: center; overflow: hidden; margin: 6px 0; box-shadow: inset 0 0 8px #000;">
              <canvas id="${canvasId}" width="64" height="64" style="width:64px; height:64px; pointer-events:none; image-rendering:pixelated;"></canvas>
            </div>

            <!-- Body: Stats -->
            <div style="width:100%; text-align:center; min-height: 28px; display:flex; align-items:center; justify-content:center;">
              <span style="font-size:9.5px; color:#ccc; line-height:1.2; display:block; white-space:normal; overflow:hidden;">${statsDisplayLabelShort}</span>
            </div>

            <!-- Progress Bar & Upgrade Button -->
            <div style="width:100%; margin-top:4px;">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px; height:18px;">
                <span style="font-size:8px; color:#df9ffb; font-family:monospace; font-weight:bold;">${flatProgressText}</span>
                ${upgradeBtnHtml}
              </div>
              <div class="sink-prog-track" style="${progressGlow} margin:0; height:5px !important;">
                <div class="sink-prog-fill" style="width:${fillPct}%; height:100%; ${fillGrad}"></div>
              </div>
            </div>
          </div>
        `;
  });

  rightPageHtml += `</div></div></div>`;

  // Join pages together
  contentEl.innerHTML = `
      <div class="bestiary-book" style="display:flex; gap:12px; width:100%;">
          ${leftPageHtml}
          ${rightPageHtml}
      </div>

      <!-- Beautiful Separate Lower Section for the Astral Dust Recycling Shop -->
      ${window.renderAstralRecyclingShop(dustOwned)}
    `;

  // Render enemy canvas drawings
  setTimeout(() => {
    sData.cards.forEach((cKey) => {
      let canvas = document.getElementById(`bestiary-card-canvas-${cKey}`);
      if (canvas) {
        let count = cardsOwned[cKey] || 0;
        let isLocked = window.getCardTier(count) < 0;
        window.drawMonsterOnCanvas(canvas, cKey, isLocked);
      }
    });
  }, 40);
};

window.renderAstralRecyclingShop = function (dustOwned) {
  const items = [
    {
      key: "Catalyst Core",
      cost: 15,
      color: "#2ecc71",
      desc: "Spent at the Forge to lock and re-roll equipment modifiers.",
      icon: window.getEtcIconHtml
        ? window.getEtcIconHtml("Catalyst Core", 24)
        : "🟢",
    },
    {
      key: "Eridium Shard",
      cost: 20,
      color: "#8e44ad",
      desc: "Spent at the Forge to Tier Up an item's Star Rarity.",
      icon: window.getEtcIconHtml
        ? window.getEtcIconHtml("Eridium Shard", 24)
        : "🔮",
    },
    {
      key: "Ancient Core",
      cost: 25,
      color: "#e74c3c",
      desc: "Sacrifice at the Altar to summon a Rift Guardian.",
      icon: window.getEtcIconHtml
        ? window.getEtcIconHtml("Ancient Core", 24)
        : "🔴",
    },
    {
      key: "Luminous Soul",
      cost: 30,
      color: "#ffb6c1",
      desc: "A radiant, pure soul dropped by rare monsters, used for advanced trades.",
      icon: window.getEtcIconHtml
        ? window.getEtcIconHtml("Luminous Soul", 24)
        : "💖",
    },
    {
      key: "Wildcard",
      cost: 50,
      color: "#ff007f",
      label: "Fated Memory Wildcard",
      desc: "Dispenses 1 copy of a random monster card you haven't maxed out yet.",
      icon: `<span style="font-size: 20px;">🔮</span>`,
    },
  ];

  let itemsHtml = items
    .map((item) => {
      let canAfford = dustOwned >= item.cost;
      let costColor = canAfford ? "#2ecc71" : "#e74c3c";
      let btnStyle = canAfford
        ? `background: ${item.color}; color: ${item.color === "#f1c40f" || item.color === "#ffb6c1" ? "#111" : "#fff"}; font-weight: bold; cursor: pointer; border: 1px solid #fff; box-shadow: 0 0 8px ${item.color}44;`
        : `background: #222; color: #555; border: 1px solid #333; cursor: not-allowed;`;

      let cleanIcon = item.icon
        .replace("margin-right: 12px;", "margin-right: 4px;")
        .replace("margin-right: 8px;", "margin-right: 4px;");

      return `
          <div class="shop-row" style="border: 1.5px solid ${item.color}50; background: linear-gradient(135deg, #13111c 0%, #08060c 100%); border-radius: 8px; padding: 10px; display: flex; flex-direction: column; justify-content: space-between; gap: 6px; transition: transform 0.15s, border-color 0.15s; margin-bottom: 0;"
               onmouseenter="window.showAstralDustShopTooltip(event, '${item.key}')"
               onmouseleave="window.hideTooltip()">
            <div style="display:flex; align-items:center; gap:8px; cursor:help;"
                 ontouchstart="window.showAstralDustShopTooltip(event, '${item.key}'); event.stopPropagation();">
              <div style="flex-shrink:0;">${cleanIcon}</div>
              <div style="min-width:0; flex:1; text-align:left;">
                <strong style="color:${item.color}; font-size:12px; display:block; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${item.label || item.key}</strong>
                <span style="font-size:9.5px; color:#aaa; display:block; margin-top:2px; white-space:normal; line-height:1.3;">${item.desc}</span>
              </div>
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center; border-top: 1px dashed rgba(255,255,255,0.06); padding-top:6px; margin-top:4px;">
                        <span style="color:${costColor}; font-family:monospace; font-size:10.5px; font-weight:bold;">${item.cost} Dust</span>
                        <button class="btn-action" style="${btnStyle} font-size:9.5px; padding:4px 10px; border-radius:4px;" ${canAfford ? "" : "disabled"} ontouchstart="event.stopPropagation();" onclick="window.buyBestiaryExchangeItem('${item.key}')" onpointerdown="window.buyBestiaryExchangeItem('${item.key}')">Recycle</button>
                      </div>
          </div>
        `;
    })
    .join("");

  return `
      <!-- Astral Dust Recycling Shop lower section -->
      <div style="margin-top: 24px; border-top: 2px solid #a855f7; padding-top: 16px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
          <h3 style="margin:0; color: #df9ffb; font-size:13px; text-transform:uppercase; letter-spacing:1px; display:flex; align-items:center; gap:6px;">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle; filter: drop-shadow(0 0 4px #df9ffb);"><circle cx="12" cy="12" r="10" stroke-dasharray="3 3"/><path d="m15 9-6 6M9 9h6v6" stroke="#9b59b6"/></svg>
            Astral Dust Recycling Shop
          </h3>
          <span style="background:rgba(255, 0, 127, 0.1); border:1px solid #ff007f; color:#ffb6c1; font-family:monospace; font-size:10.5px; font-weight:bold; padding:2px 8px; border-radius:4px; box-shadow:0 0 6px rgba(255,0,127,0.25);">
            Balance: ${dustOwned} Astral Dust
          </span>
        </div>
        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap:8px;">
          ${itemsHtml}
        </div>
      </div>
    `;
};

window.showAstralDustShopTooltip = function (e, key) {
  if (window.isSimulatedMouseEvent && window.isSimulatedMouseEvent(e)) return;
  e.stopPropagation();
  let tt = document.getElementById("game-tooltip");
  if (!tt) return;

  let title = "";
  let desc = "";
  let color = "#ff007f";
  let cost = 0;
  let icon = "🔮";

  if (key === "Catalyst Core") {
    title = "Catalyst Core";
    desc = "Spent at the Forge to lock and re-roll equipment modifiers.";
    color = "#2ecc71";
    cost = 15;
    icon = window.getEtcIconHtml
      ? window.getEtcIconHtml("Catalyst Core", 24)
      : "🟢";
  } else if (key === "Eridium Shard") {
    title = "Eridium Shard";
    desc = "Spent at the Forge to Tier Up an item's Star Rarity.";
    color = "#8e44ad";
    cost = 20;
    icon = window.getEtcIconHtml
      ? window.getEtcIconHtml("Eridium Shard", 24)
      : "🔮";
  } else if (key === "Ancient Core") {
    title = "Ancient Core";
    desc = "Sacrifice at the Altar to summon a Rift Guardian.";
    color = "#e74c3c";
    cost = 25;
    icon = window.getEtcIconHtml
      ? window.getEtcIconHtml("Ancient Core", 24)
      : "🔴";
  } else if (key === "Luminous Soul") {
    title = "Luminous Soul";
    desc =
      "A radiant, pure soul dropped by rare monsters, used for advanced alchemy and trades.";
    color = "#ffb6c1";
    cost = 30;
    icon = window.getEtcIconHtml
      ? window.getEtcIconHtml("Luminous Soul", 24)
      : "💖";
  } else if (key === "Wildcard") {
    title = "Fated Memory Wildcard";
    desc =
      "Dispenses 1 copy of a random monster card you haven't maxed out yet (< 600 copies). Essential for targeted collection progression.";
    color = "#ff007f";
    cost = 50;
    icon = `<span style="font-size:20px;">🔮</span>`;
  }

  let cleanIcon = icon
    .replace("margin-right: 12px;", "margin-right: 8px;")
    .replace("margin-right: 8px;", "margin-right: 8px;");
  let dustOwned = window.playerStats.astralDust || 0;
  let canAfford = dustOwned >= cost;
  let costColor = canAfford ? "#2ecc71" : "#e74c3c";

  tt.innerHTML = `
      <div style="padding: 10px; width: 220px; box-sizing: border-box; font-family:sans-serif;">
        <div class="tt-title" style="color:${color}; display:flex; align-items:center; gap:8px;">${cleanIcon} <span>${title}</span></div>
        <div style="color:#aaa; font-size:11px; white-space:normal; line-height:1.4; margin-top:8px;">
          ${desc}<br><br>
          • Cost: <strong style="color:${costColor};">${cost} Astral Dust</strong><br>
          • Your Dust: <strong style="color:#fff;">${dustOwned} Dust</strong>
        </div>
      </div>
    `;
  tt.style.borderColor = color;
  tt.style.display = "block";
  window.positionTooltip(e, tt);
};

window.upgradeBestiaryCard = function (cardKey) {
  let pStats = window.playerStats;
  let cardsOwned = pStats.monsterCards || {};
  let count = cardsOwned[cardKey] || 0;
  let cData = window.MONSTER_CARDS_DATA[cardKey];
  let tier = window.getCardTier(count);

  let thresholds = window.CARD_UPGRADE_THRESHOLDS || [
    1, 50, 150, 300, 750, 1800,
  ];
  let isLocked = tier < 0;
  let nextThreshold = thresholds[tier + 1] || 600;

  // Double check duplicates requirements
  let meetsShards = isLocked ? count >= 5 : count >= nextThreshold;
  if (!meetsShards) return;

  // Double check soul currency requirements
  let costs = window.getCardUpgradeCost(tier);
  let soulsOwned = window.inventory.ETC["Monster Soul"] || 0;
  let luminousOwned = window.inventory.ETC["Luminous Soul"] || 0;

  if (soulsOwned < costs.mSouls || luminousOwned < costs.lSouls) {
    if (typeof window.pushHeaderToast === "function") {
      window.pushHeaderToast("❌ Lacking Monster/Luminous Souls!", "#e74c3c");
    }
    return;
  }

  // Deduct resources
  if (costs.mSouls > 0) {
    window.inventory.ETC["Monster Soul"] -= costs.mSouls;
    if (window.inventory.ETC["Monster Soul"] === 0)
      delete window.inventory.ETC["Monster Soul"];
  }
  if (costs.lSouls > 0) {
    window.inventory.ETC["Luminous Soul"] -= costs.lSouls;
    if (window.inventory.ETC["Luminous Soul"] === 0)
      delete window.inventory.ETC["Luminous Soul"];
  }

  // Set card counts directly to threshold boundaries to successfully register the upgrade
  if (isLocked) {
    window.playerStats.monsterCards[cardKey] = Math.max(5, count);
  } else {
    window.playerStats.monsterCards[cardKey] = Math.max(nextThreshold, count);
  }

  window.SoundManager.play("spell");

  // Custom successful upgrade feedback burst
  let cvs = document.getElementById("gameCanvas");
  let w = cvs ? cvs.width : 750;
  let h = cvs ? cvs.height : 250;
  let tColor = window.getTierColor(isLocked ? 0 : tier + 1);
  for (let i = 0; i < 40; i++) {
    let angle = Math.random() * Math.PI * 2;
    let vel = window.randFloat(3, 8);
    window.particles.push(
      window.ParticlePool.get(
        w / 2,
        h / 2,
        Math.cos(angle) * vel,
        Math.sin(angle) * vel,
        window.randFloat(2, 4),
        tColor,
        1,
        45,
      ),
    );
  }

  window.invalidatePlayerStats();
  window.updateUI();
  window.renderBestiaryAlbum();
  window.renderInventory();
  window.saveGame();

  let targetTierName = window.getTierName(isLocked ? 0 : tier + 1);
  window.pushHeaderToast(
    `🎉 Infused ${cData.name} to ${targetTierName}!`,
    tColor,
  );
  window.pushLog(
    `<strong style="color:${tColor};">[BESTIARY]</strong> Successfully infused and upgraded <span style="color:${tColor};">${cData.name}</span> to the ${targetTierName} tier!`,
  );
};

window.showCardTooltip = function (e, cardKey) {
  if (window.isSimulatedMouseEvent && window.isSimulatedMouseEvent(e)) return;
  e.stopPropagation();

  // Tooltip Inhibitor: Bypasses showing card details before they have been clicked to flip
  let cardInner = document.getElementById(`gacha-card-inner-${cardKey}`);
  if (cardInner && !cardInner.classList.contains("flipped")) {
    return;
  }

  let tt = document.getElementById("game-tooltip");
  if (!tt) return;

  let cData = window.MONSTER_CARDS_DATA[cardKey];
  let cardsOwned = window.playerStats.monsterCards || {};
  let count = cardsOwned[cardKey] || 0;
  let thresholds = window.CARD_UPGRADE_THRESHOLDS || [5, 15, 45, 100, 250, 600];

  let currentTier = -1;
  for (let idx = 0; idx < thresholds.length; idx++) {
    if (count >= thresholds[idx]) currentTier = idx;
    else break;
  }

  let color = currentTier < 0 ? "#7f8c8d" : window.getTierColor(currentTier);
  let tierLabel = currentTier < 0 ? "Locked" : window.getTierName(currentTier);

  let nextTierName = window.getTierName(currentTier + 1);
  let nextThreshold = thresholds[currentTier + 1] || 600;

  let isUtility = [
    "critChance",
    "critDamage",
    "block",
    "parry",
    "dropRate",
    "quality",
    "goldMulti",
    "rareSpawn",
    "fairySpawn",
    "xpRate",
  ].includes(cData.baseStat);
  let curVal = isUtility
    ? window.getUtilityCardValue(currentTier)
    : window.getCardValue(cData.baseVal, currentTier);
  let nextVal = isUtility
    ? window.getUtilityCardValue(currentTier + 1)
    : window.getCardValue(cData.baseVal, currentTier + 1);

  let format = (v) =>
    cData.isPct ? `+${(v * 100).toFixed(1)}%` : `+${v.toFixed(1)}`;

  let detailsHtml = "";
  if (currentTier === -1) {
    detailsHtml = `
      <div class="tt-stat-line" style="color:#e74c3c;">• Unlock Threshold: 5 Cards (Owned: ${count})</div>
      <div class="tt-stat-line" style="color:#2ecc71; margin-top:6px; font-weight:bold;">🎁 Unlock Reward: ${format(nextVal)} ${window.getStatLabel(cData.baseStat)}</div>
    `;
  } else if (currentTier >= 5) {
    detailsHtml = `
      <div class="tt-stat-line" style="color:#2ecc71;">• Current Bonus: ${format(curVal)} ${window.getStatLabel(cData.baseStat)}</div>
      <div class="tt-stat-line" style="color:#f1c40f; margin-top:4px; font-weight:bold;">🔥 MAX TIER ACHIEVED!</div>
    `;
  } else {
    detailsHtml = `
      <div class="tt-stat-line" style="color:#bdc3c7;">• Current Bonus: ${format(curVal)} ${window.getStatLabel(cData.baseStat)}</div>
      <div class="tt-stat-line" style="color:#9b59b6; margin-top:6px; font-weight:bold;">📈 Next Tier: ${nextTierName} (${format(nextVal)})</div>
      <div class="tt-stat-line" style="color:#7f8c8d;">(Requires ${nextThreshold} total card duplicates)</div>
    `;
  }

  let costs = window.getCardUpgradeCost(currentTier);
  let upgradeReqsHtml = "";
  if (currentTier < 5) {
    upgradeReqsHtml = `
      <div style="margin-top:8px; border-top:1px dashed #444; padding-top:6px; font-size:10px;">
        <span style="font-weight:bold; color:#ffb6c1; text-transform:uppercase; letter-spacing:0.5px;">🏥 Soul Infusion Requirements:</span>
        <div class="tt-stat-line" style="color:#bdc3c7; font-family:monospace; margin-top:2px;">• Monster Souls: ${costs.mSouls}</div>
        ${costs.lSouls > 0 ? `<div class="tt-stat-line" style="color:#ffb6c1; font-family:monospace;">• Luminous Souls: ${costs.lSouls}</div>` : ""}
      </div>
    `;
  }

  let iconHtml = window.getEquipIconHtml
    ? window.getEquipIconHtml(
        {
          type:
            cData.baseStat === "atk"
              ? "weapon"
              : cData.baseStat === "def"
                ? "shield"
                : "overall",
          statsRolled: currentTier < 0 ? 0 : currentTier,
        },
        28,
      )
    : "🃏";
  iconHtml = iconHtml.replace("margin-right: 12px;", "margin-right: 8px;");

  tt.innerHTML = `
    <div style="padding: 10px; width: 230px; box-sizing: border-box; font-family:sans-serif;">
        <div class="tt-title" style="color:${color}; display:flex; align-items:center; gap:8px;">${iconHtml}<span>${cData.name}</span></div>
        <div class="tt-subtitle" style="color:#9b59b6;">Tier: ${tierLabel} | Total Copies: ${count}</div>
        <div style="color:#aaa; font-size:10.5px; white-space:normal; line-height:1.4; margin-bottom:8px;">${cData.desc}</div>
        <div style="border-top:1px dashed #333; padding-top:6px; font-size:10.5px;">
            ${detailsHtml}
        </div>
        ${upgradeReqsHtml}
    </div>
  `;
  tt.style.borderColor = color;
  tt.style.display = "block";
  window.positionTooltip(e, tt);
};

window.buyBestiaryExchangeItem = function (itemKey) {
  let pStats = window.playerStats;
  let ownedDust = pStats.astralDust || 0;

  const dustCosts = {
    "Catalyst Core": 15,
    "Ancient Core": 25,
    "Eridium Shard": 20,
    "Luminous Soul": 30,
    Wildcard: 50,
  };

  let cost = dustCosts[itemKey];
  if (cost === undefined) return;

  if (ownedDust < cost) {
    window.pushHeaderToast("❌ Insufficient Astral Dust!", "#ff007f");
    return;
  }

  if (itemKey === "Wildcard") {
    // Wildcard gives a random card the player hasn't maxed out yet (< 600 total copies)
    let cardsRegistry = window.MONSTER_CARDS_DATA;
    let cardStats = pStats.monsterCards || {};
    let nonMaxedKeys = Object.keys(cardsRegistry).filter(
      (cKey) => (cardStats[cKey] || 0) < 600,
    );

    if (nonMaxedKeys.length === 0) {
      window.pushHeaderToast(
        "👑 Your collection is fully maxed! Astral Dust cannot be spent on Wildcards.",
        "#ff007f",
      );
      return;
    }

    let rolledKey =
      nonMaxedKeys[Math.floor(Math.random() * nonMaxedKeys.length)];
    let cData = cardsRegistry[rolledKey];

    // Deduct and grant card copy
    pStats.astralDust -= cost;
    pStats.monsterCards[rolledKey] = (cardStats[rolledKey] || 0) + 1;

    // Visual burst particles
    let cvs = document.getElementById("gameCanvas");
    let w = cvs ? cvs.width : 750;
    let h = cvs ? cvs.height : 250;
    for (let i = 0; i < 30; i++) {
      window.particles.push(
        window.ParticlePool.get(
          w / 2,
          h / 2,
          (Math.random() - 0.5) * 8,
          (Math.random() - 0.5) * 8,
          Math.random() * 2 + 1,
          "#ff007f",
          1,
          30,
        ),
      );
    }

    window.pushHeaderToast(
      `🔮 Fated Memory: Received 1x ${cData.name}!`,
      "#ff007f",
    );
    window.pushLog(
      `<strong style="color:#ff007f;">[BESTIARY]</strong> Traded 50 Astral Dust for a Fated Memory wildcard. Unboxed: <span style="color:#ff007f;">1x ${cData.name}</span>!`,
    );
  } else {
    // Standard material purchase
    pStats.astralDust -= cost;
    window.addEtcDrop(itemKey, 1);
    window.pushHeaderToast(`🛒 Purchased: 1x ${itemKey}!`, "#2ecc71");
    if (window.SoundManager) window.SoundManager.play("fairy");
  }

  window.updateUI();
  window.renderBestiaryAlbum();
  window.renderInventory();
  window.saveGame();
};

// Check if any card has enough duplicates/souls to trigger upgrade and hook alert indicator
window.checkBestiaryAlerts = function () {
  let cardsOwned = window.playerStats.monsterCards || {};
  let thresholds = window.CARD_UPGRADE_THRESHOLDS || [5, 15, 45, 100, 250, 600];
  let soulsOwned = window.inventory.ETC["Monster Soul"] || 0;
  let luminousOwned = window.inventory.ETC["Luminous Soul"] || 0;

  for (let cKey in window.MONSTER_CARDS_DATA) {
    let count = cardsOwned[cKey] || 0;

    // Determine active card tier
    let tier = -1;
    for (let idx = 0; idx < thresholds.length; idx++) {
      if (count >= thresholds[idx]) tier = idx;
      else break;
    }

    if (tier < 5) {
      let isLocked = tier < 0;
      let nextThreshold = thresholds[tier + 1] || 600;
      let canAffordDuplicates = isLocked ? count >= 5 : count >= nextThreshold;

      if (canAffordDuplicates) {
        let costs = window.getCardUpgradeCost(tier);
        if (soulsOwned >= costs.mSouls && luminousOwned >= costs.lSouls) {
          return true; // Found an upgradable card!
        }
      }
    }
  }
  return false;
};

window.drawMonsterOnCanvas = function (canvas, cKey, isLocked) {
  if (!canvas) return;
  let ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.imageSmoothingEnabled = false;

  let isBoss = [
    "aegis_goliath",
    "chronos_arbitrator",
    "nexus_overseer",
    "overlord_iron_vault",
    "gilded_vault_keeper",
    "corrosive_abomination",
    "hooktail",
  ].includes(cKey);

  // Set up mock mob properties
  let mockMob = {
    x: 12,
    y: 12,
    w: 40,
    h: 40,
    type: isBoss ? cKey : "mob",
    visualType: cKey,
    isRare: false,
    flashTimer: 0,
    isStopped: true,
    visualTier: 0,
    hp: 1,
    maxHp: 1,
  };

  ctx.save();

  // Custom offsets/scaffold scales inside the card frame
  if (cKey === "slime") {
    mockMob.y = 8;
  } else if (cKey === "sprout") {
    mockMob.y = 8;
  } else if (cKey === "thorn_wyrm") {
    mockMob.x = 4;
    mockMob.y = 4;
  } else if (cKey === "golem") {
    mockMob.y = 8;
  } else if (cKey === "magma_elemental") {
    mockMob.y = 10;
  } else if (cKey === "toxic_fly") {
    mockMob.y = 8;
  } else if (isBoss) {
    mockMob.x = -8;
    mockMob.y = -8;
    mockMob.w = 80;
    mockMob.h = 80;
  }

  // Draw monster directly onto the card's canvas
  if (window.drawSingleMob) {
    window.drawSingleMob(ctx, mockMob);
  }
  ctx.restore();

  // Apply high-quality locked grayscale silhouette filter if locked
  if (isLocked) {
    canvas.style.filter = "grayscale(100%) brightness(50%) opacity(0.5)";
  } else {
    canvas.style.filter = "";
  }
};

window.bestiaryAnimFrameId = null;

window.animateBestiaryCards = function () {
  let modal = document.getElementById("bestiary-modal");
  if (!modal || modal.style.display !== "block") {
    if (window.bestiaryAnimFrameId) {
      cancelAnimationFrame(window.bestiaryAnimFrameId);
      window.bestiaryAnimFrameId = null;
    }
    return;
  }

  let activeSetKey = window.selectedBestiarySetKey;
  let sData = window.CARD_SETS_DATA[activeSetKey];
  let cardsOwned = window.playerStats.monsterCards || {};

  if (sData) {
    sData.cards.forEach((cKey) => {
      let canvas = document.getElementById(`bestiary-card-canvas-${cKey}`);
      if (canvas) {
        let count = cardsOwned[cKey] || 0;
        let isLocked = window.getCardTier(count) < 0;
        if (!isLocked) {
          // Only animate unlocked cards to conserve CPU
          window.drawMonsterOnCanvas(canvas, cKey, false);
        }
      }
    });
  }

  window.bestiaryAnimFrameId = requestAnimationFrame(
    window.animateBestiaryCards,
  );
};

window.boosterAnimFrameId = null;
window.animateBoosterCards = function () {
  let overlay = document.getElementById("booster-opening-overlay");
  if (!overlay) {
    if (window.boosterAnimFrameId) {
      cancelAnimationFrame(window.boosterAnimFrameId);
      window.boosterAnimFrameId = null;
    }
    return;
  }

  let canvases = overlay.querySelectorAll("canvas[data-card-key]");
  canvases.forEach((canvas) => {
    let cKey = canvas.getAttribute("data-card-key");
    window.drawMonsterOnCanvas(canvas, cKey, false);
  });

  window.boosterAnimFrameId = requestAnimationFrame(window.animateBoosterCards);
};

window.SPECTRAL_METADATA = {
  weapon_staff: {
    name: "Phoenix Ignition Staff",
    desc: "Launches fireballs dealing 25% Atk damage (3s Cooldown).",
    color: "#e67e22",
    icon: "✦",
    type: "weapon",
  },
  weapon_sword: {
    name: "Sanguine Reaver",
    desc: "Strikes apply Bleed. Hits at 5 stacks trigger Rupture dealing 300% Dmg and lifesteals.",
    color: "#e74c3c",
    icon: "✦",
    type: "weapon",
  },
  weapon_singularity: {
    name: "Void-Sovereign Greatsword",
    desc: "Allows entering a Storing state that detonates a massive Void Explosion.",
    color: "#8e44ad",
    icon: "✦",
    type: "weapon",
  },
  weapon_maelstrom: {
    name: "Maelstrom Gale-Glaive",
    desc: "Critical strikes project wind gales, stacking up to +30% Attack Speed.",
    color: "#2ecc71",
    icon: "✦",
    type: "weapon",
  },
  shield_aegis: {
    name: "Void-Warped Bulwark",
    desc: "Blocks trigger gravity blasts scaling with Defense.",
    color: "#3498db",
    icon: "✦",
    type: "subweapon",
    subType: "shield",
  },
  tome_watch: {
    name: "Chronos Dial-Watch",
    desc: "Allows entering a Temporal Fracture state that dilates local speed.",
    color: "#f1c40f",
    icon: "✦",
    type: "subweapon",
    subType: "tome",
  },
  tome_chronicle: {
    name: "Chronicle of past Lives",
    desc: "Boosts XP gain by +200% while below 75% peak level.",
    color: "#f39c12",
    icon: "✦",
    type: "subweapon",
    subType: "tome",
  },
  boots_warpcore: {
    name: "Warp-Core Greaves",
    desc: "Attacks speed up by target missing health. Boss kills grant Max Haste.",
    color: "#1abc9c",
    icon: "✦",
    type: "boots",
  },
  helmet_tempest: {
    name: "Crown of Tempests",
    desc: "Taking damage has a 15% chance to trigger static lightning strikes.",
    color: "#00d2ff",
    icon: "✦",
    type: "helmet",
  },
};

window.updateSpectralReliquaryBanner = function () {
  let banner = document.getElementById("spectral-reliquary-banner");
  if (!banner) return;

  let activeKey = window.playerStats.activeSpectralResonance;
  let isProjecting = window.playerStats.projectSpectralCosmetic;

  if (activeKey && window.SPECTRAL_METADATA[activeKey]) {
    let meta = window.SPECTRAL_METADATA[activeKey];
    let color = meta.color || "#9b59b6";
    banner.style.display = "flex";
    banner.style.borderColor = color;
    banner.style.background = window.hexToRgba
      ? window.hexToRgba(color, 0.05)
      : "rgba(155, 89, 182, 0.05)";
    banner.style.boxShadow = `inset 0 0 10px ${window.hexToRgba ? window.hexToRgba(color, 0.08) : "rgba(0,0,0,0.5)"}, 0 0 6px ${window.hexToRgba ? window.hexToRgba(color, 0.15) : "rgba(155,89,182,0.1)"}`;

    let mockItem = {
      type: meta.type,
      subType: meta.subType,
      statsRolled: 5,
      name: meta.name,
    };
    if (activeKey === "weapon_staff") mockItem.isUniqueStaff = true;
    if (activeKey === "weapon_sword") mockItem.isUniqueSword = true;
    if (activeKey === "weapon_singularity") mockItem.isUniqueSingularity = true;
    if (activeKey === "weapon_maelstrom") mockItem.isUniqueMaelstrom = true;
    if (activeKey === "shield_aegis") mockItem.isUniqueAegis = true;
    if (activeKey === "tome_watch") mockItem.isUniqueWatch = true;
    if (activeKey === "tome_chronicle") mockItem.isUniqueChronicle = true;
    if (activeKey === "boots_warpcore") mockItem.isUniqueWarpCore = true;
    if (activeKey === "helmet_tempest") mockItem.isUniqueTempest = true;

    let iconHtml = window.getEquipIconHtml(mockItem, 28);

    banner.innerHTML = `
        <div style="flex-shrink:0; display: flex; align-items: center; justify-content: center;">
          ${iconHtml}
        </div>
        <div style="flex:1; min-width:0; text-align:left; margin-left: 8px;">
          <span style="font-size:9px; color:#888; text-transform:uppercase; letter-spacing:1px; display:block; line-height:1;">Resonating Passive</span>
          <strong style="color:${color}; font-size:11.5px; display:block; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; text-shadow:0 0 8px ${window.hexToRgba ? window.hexToRgba(color, 0.25) : "rgba(155,89,182,0.2)"}; margin-top:2px;">${meta.name}</strong>
        </div>
        <div style="flex-shrink:0; display:flex; gap:6px; align-items:center;" onclick="window.toggleSpectralCosmeticInline(event)">
          <span style="font-size:9.5px; color:${isProjecting ? "#2ecc71" : "#7f8c8d"}; background:rgba(0,0,0,0.45); border:1px solid ${isProjecting ? "#2ecc71" : "#444"}; padding:2px 6px; border-radius:3px; font-family:monospace; font-weight:bold;">
            ${isProjecting ? "PROJECT: ON" : "PROJECT: OFF"}
          </span>
        </div>
      `;
  } else {
    banner.style.display = "flex";
    banner.style.borderColor = "#444";
    banner.style.background = "#151515";
    banner.style.boxShadow = "";
    banner.innerHTML = `
        <div style="flex-shrink:0; font-size: 16px; display: flex; align-items: center; justify-content: center; width:28px; height:28px; background:#111; border:1px dashed #444; border-radius:4px; font-family:monospace; color:#666;">
          ✦
        </div>
        <div style="flex:1; min-width:0; text-align:left; margin-left: 8px;">
          <span style="font-size:9px; color:#666; text-transform:uppercase; letter-spacing:1px; display:block;">Resonating Passive</span>
          <strong style="color:#7f8c8d; font-size:11.5px; display:block; font-style:italic;">[Dormant Reliquary]</strong>
        </div>
        <div style="flex-shrink:0;">
          <span style="font-size:9.5px; color:#888; background:rgba(255,255,255,0.02); border:1px dashed #444; padding:2px 6px; border-radius:3px; font-family:monospace; font-weight:bold;">RESONATE</span>
        </div>
      `;
  }
};

window.toggleSpectralCosmeticInline = function (e) {
  if (e) {
    e.stopPropagation();
    e.preventDefault();
  }
  window.playerStats.projectSpectralCosmetic =
    !window.playerStats.projectSpectralCosmetic;
  if (window.SoundManager) window.SoundManager.play("swing");
  window.updateUI();
  window.saveGame();
};

window.openSpectralReliquaryWindow = function (e) {
  if (e) {
    e.stopPropagation();
    e.preventDefault();
  }

  let existingWin = document.getElementById("spectral-reliquary-window");
  let savedLeft = null;
  let savedTop = null;
  if (existingWin) {
    savedLeft = existingWin.style.left;
    savedTop = existingWin.style.top;
    existingWin.remove();
  }

  let win = document.createElement("div");
  win.id = "spectral-reliquary-window";
  win.className = "draggable-window";

  if (savedLeft !== null && savedTop !== null) {
    win.style.left = savedLeft;
    win.style.top = savedTop;
  } else {
    let container = document
      .getElementById("game-container")
      .getBoundingClientRect();
    let winWidth = 290;
    let leftOffset = (window.innerWidth - winWidth) / 2 - container.left;
    let topOffset =
      window.scrollY + window.innerHeight / 2 - 150 - container.top;
    if (leftOffset < 5) leftOffset = 5;
    if (topOffset < 5) topOffset = 5;
    win.style.left = leftOffset + "px";
    win.style.top = topOffset + "px";
  }

  let unlocked = window.playerStats.spectralCodex || [];
  let contentHtml = "";

  // Add Dormant option
  contentHtml += `
      <div class="bag-item" style="padding:6px; margin-bottom:5px; background:#181c22; border:1px solid #333; display:flex; justify-content:space-between; align-items:center;">
        <div style="text-align:left;">
          <strong style="color:#aaa; font-size:11px;">Dormant State</strong><br>
          <span style="font-size:9.5px; color:#666;">Clear active passive effect</span>
        </div>
        <button class="btn-action" style="padding:3px 8px; font-size:10px; font-weight:bold; background:#e74c3c;" onclick="window.executeEquipSpectralResonance('')">Clear</button>
      </div>
    `;

  if (unlocked.length > 0) {
    contentHtml += unlocked
      .map((tKey) => {
        let meta = window.SPECTRAL_METADATA[tKey];
        if (!meta) return "";
        let color = meta.color || "#ff007f";
        let activeLabel =
          window.playerStats.activeSpectralResonance === tKey
            ? " <span style='color:#2ecc71;'>(Resonating)</span>"
            : "";

        let mockItem = {
          type: meta.type,
          subType: meta.subType,
          statsRolled: 5,
          name: meta.name,
        };
        if (tKey === "weapon_staff") mockItem.isUniqueStaff = true;
        if (tKey === "weapon_sword") mockItem.isUniqueSword = true;
        if (tKey === "weapon_singularity") mockItem.isUniqueSingularity = true;
        if (tKey === "weapon_maelstrom") mockItem.isUniqueMaelstrom = true;
        if (tKey === "shield_aegis") mockItem.isUniqueAegis = true;
        if (tKey === "tome_watch") mockItem.isUniqueWatch = true;
        if (tKey === "tome_chronicle") mockItem.isUniqueChronicle = true;
        if (tKey === "boots_warpcore") mockItem.isUniqueWarpCore = true;
        if (tKey === "helmet_tempest") mockItem.isUniqueTempest = true;

        let iconHtml = window.getEquipIconHtml(mockItem, 24);

        return `
            <div class="bag-item" style="padding:6px; margin-bottom:5px; background:#181c22; border:1px solid #333; display:flex; justify-content:space-between; align-items:center; gap:8px;">
              <div style="text-align:left; flex:1; min-width:0; display:flex; align-items:center; gap:6px;">
                <div style="flex-shrink:0;">${iconHtml}</div>
                <div style="min-width:0; flex:1;">
                  <strong style="color:${color}; font-size:11px; display:block; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${meta.name}${activeLabel}</strong>
                  <span style="font-size:9.5px; color:#aaa; display:block; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${meta.desc}</span>
                </div>
              </div>
              <button class="btn-action" style="padding:3px 8px; font-size:10px; font-weight:bold; background:var(--accent-green); flex-shrink:0;" onclick="window.executeEquipSpectralResonance('${tKey}')">Resonate</button>
            </div>
          `;
      })
      .join("");
  } else {
    contentHtml += `
        <div style="color:#666; font-style:italic; font-size:11px; text-align:center; padding: 20px 0;">
          Spectral Codex is empty.<br>Shatter Unique Weapons or Armor in the Forge to register them!
        </div>
      `;
  }

  win.innerHTML = `
      <div class="draggable-header" id="spectral-win-handle" style="background: linear-gradient(180deg, #181d24 0%, #0d1117 100%);">
        <span>✦ Soul Reliquary Codex</span>
        <button onclick="document.getElementById('spectral-reliquary-window').remove(); window.hideTooltip();" style="background:transparent; border:none; color:#e74c3c; font-weight:bold; cursor:pointer; font-size:11px; padding:2px;">[X]</button>
      </div>
      <div class="draggable-content">
        ${contentHtml}
      </div>
    `;

  document.getElementById("game-container").appendChild(win);
  window.makeWindowDraggable(
    win,
    document.getElementById("spectral-win-handle"),
  );
};

window.executeEquipSpectralResonance = function (key) {
  if (key === "") {
    window.playerStats.activeSpectralResonance = null;
    if (typeof window.pushHeaderToast === "function") {
      window.pushHeaderToast("Resonance Deactivated", "#7f8c8d");
    }
  } else {
    window.playerStats.activeSpectralResonance = key;
    let meta = window.SPECTRAL_METADATA[key];
    if (typeof window.pushHeaderToast === "function") {
      window.pushHeaderToast(
        `Resonating Passive: [${meta.name}]`,
        meta.color || "#9b59b6",
      );
    }
  }
  let win = document.getElementById("spectral-reliquary-window");
  if (win) win.remove();
  window.hideTooltip();
  window.updateUI();
  window.saveGame();
};

// Onboarding: Stage 10 Choice Portal (Presents Bulwark, Riposte, or Arcane grimoire options)
window.openSubweaponOfChoiceModal = function () {
  window.setPauseState(true);

  // Generate three specialized sub-weapons at level 11 (StageScale 2) rolling their respective stats
  let shield = {
    id: window.idCounter++,
    name: `Kite Shield of Might (Lv. 11)`,
    type: "subweapon",
    subType: "shield",
    statsRolled: 1, // Rare (1★)
    temperLevel: 0,
    stageLevel: 2, // Map precisely to StageScale 2 (Levels 11-20)
    atk: 0,
    maxHp: 0,
    def: 0,
    moveSpeed: 0,
    critChance: 0,
    critDamage: 0,
    block: 0,
    parry: 0,
    baseAtk: 0,
    baseMaxHp: 0,
    baseDef: 6,
    baseMoveSpeed: 0,
    baseBlock: 0.05,
    baseParry: 0,
    baseInt: 0,
    bonusAtk: 0,
    bonusMaxHp: 0, // Cleared to adhere to standard 1★ Rare 2-affix limit
    bonusDef: 4, // Affix 1
    bonusMoveSpeed: 0,
    bonusCritChance: 0,
    bonusCritDamage: 0,
    bonusBlock: 0, // Cleared to adhere to standard 1★ Rare 2-affix limit
    bonusParry: 0,
    bonusActiveSpeed: 0,
    bonusIdleSpeed: 0,
    bonusStr: 4, // Affix 2
    bonusDex: 0,
    bonusInt: 0,
    noun: "Kite Shield",
    setName: "Vanguard",
  };
  window.recalculateItemStats(shield);
  window.frozenItemDb[shield.id] = window.cloneItemForTooltip(shield);

  let dagger = {
    id: window.idCounter++,
    name: `Kris of Swiftness (Lv. 11)`,
    type: "subweapon",
    subType: "dagger",
    statsRolled: 1, // Rare (1★)
    temperLevel: 0,
    stageLevel: 2, // Map precisely to StageScale 2 (Levels 11-20)
    atk: 0,
    maxHp: 0,
    def: 0,
    moveSpeed: 0,
    critChance: 0,
    critDamage: 0,
    block: 0,
    parry: 0,
    baseAtk: 5,
    baseMaxHp: 0,
    baseDef: 0,
    baseMoveSpeed: 0,
    baseBlock: 0,
    baseParry: 0.05,
    baseInt: 0,
    bonusAtk: 0, // Cleared to adhere to standard 1★ Rare 2-affix limit
    bonusMaxHp: 0,
    bonusDef: 0,
    bonusMoveSpeed: 2, // Affix 1
    bonusCritChance: 0, // Cleared to adhere to standard 1★ Rare 2-affix limit
    bonusCritDamage: 0,
    bonusBlock: 0,
    bonusParry: 0, // Cleared to adhere to standard 1★ Rare 2-affix limit
    bonusActiveSpeed: 0,
    bonusIdleSpeed: 0,
    bonusStr: 0,
    bonusDex: 4, // Affix 2
    bonusInt: 0,
    noun: "Kris",
    setName: "Windrunner",
  };
  window.recalculateItemStats(dagger);
  window.frozenItemDb[dagger.id] = window.cloneItemForTooltip(dagger);

  let tome = {
    id: window.idCounter++,
    name: `Grimoire of Wisdom (Lv. 11)`,
    type: "subweapon",
    subType: "tome",
    statsRolled: 1, // Rare (1★)
    temperLevel: 0,
    stageLevel: 2, // Map precisely to StageScale 2 (Levels 11-20)
    atk: 0,
    maxHp: 0,
    def: 0,
    moveSpeed: 0,
    critChance: 0,
    critDamage: 0,
    block: 0,
    parry: 0,
    baseAtk: 3,
    baseMaxHp: 0,
    baseDef: 0,
    baseMoveSpeed: 0,
    baseBlock: 0,
    baseParry: 0,
    baseInt: 8,
    bonusAtk: 0,
    bonusMaxHp: 0,
    bonusDef: 0,
    bonusMoveSpeed: 0,
    bonusCritChance: 0,
    bonusCritDamage: 0, // Cleared to adhere to standard 1★ Rare 2-affix limit
    bonusBlock: 0,
    bonusParry: 0,
    bonusActiveSpeed: 0.015, // Affix 1
    bonusIdleSpeed: 0,
    bonusStr: 0,
    bonusDex: 0,
    bonusInt: 4, // Affix 2
    noun: "Grimoire",
    setName: "Scholar",
  };
  window.recalculateItemStats(tome);
  window.frozenItemDb[tome.id] = window.cloneItemForTooltip(tome);

  let overlay = document.createElement("div");
  overlay.id = "subweapon-choice-overlay";
  overlay.style.position = "fixed";
  overlay.style.top = "0";
  overlay.style.left = "0";
  overlay.style.width = "100%";
  overlay.style.height = "100%";
  overlay.style.backgroundColor = "rgba(0,0,0,0.92)";
  overlay.style.display = "flex";
  overlay.style.justifyContent = "center";
  overlay.style.alignItems = "center";
  overlay.style.zIndex = "45000";
  overlay.style.backdropFilter = "blur(10px)";
  document.body.appendChild(overlay);

  let cardStyles = `
    background: linear-gradient(135deg, #13111c 0%, #06040a 100%);
    border-radius: 12px;
    padding: 12px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    align-items: center;
    width: 130px;
    height: 235px;
    box-shadow: 0 4px 15px rgba(0,0,0,0.65);
    transition: transform 0.15s, border-color 0.15s;
    cursor: pointer;
  `;

  let shieldCardHtml = `
                  <div id="choice-card-shield" class="market-card" style="${cardStyles} border: 2px solid #3498db;"
                       onclick="window.selectChoiceSubweapon('shield')"
                       onmouseenter="window.showInventoryTooltip(event, ${shield.id})"
                       ontouchstart="window.showInventoryTooltip(event, ${shield.id})"
                       onmouseleave="window.hideTooltip()">
                    <div style="text-align:center; width:100%;">
                      <strong style="color:#3498db; font-size:12px; display:block; margin-bottom:2px;">Bulwark</strong>
                      <span style="font-size:8px; color:#aaa; text-transform:uppercase; letter-spacing:0.5px;">Kite Shield</span>
                    </div>
                    <div style="margin: 8px 0; display:flex; align-items:center; justify-content:center; width:48px; height:48px; background:rgba(0,0,0,0.4); border-radius:6px; border:1px solid #3498db;">${window.getEquipIconHtml(shield, 32)}</div>
                    <div style="font-size:9.5px; color:#ccc; text-align:center; line-height:1.35; min-height:60px; white-space:normal;">
                      Focuses on <strong>STR & Defense</strong>. Unlocks Block Rate and Shield Bash counters.
                    </div>
                    <button class="btn-action" style="width:100%; font-size:10px; background:#3498db;" onpointerdown="event.stopPropagation();" ontouchstart="event.stopPropagation();" onclick="event.stopPropagation(); window.claimChoiceSubweapon(${JSON.stringify(shield).replace(/"/g, "&quot;")})">CLAIM SHIELD</button>
                  </div>
                `;

  let daggerCardHtml = `
                  <div id="choice-card-dagger" class="market-card" style="${cardStyles} border: 2px solid #e74c3c;"
                       onclick="window.selectChoiceSubweapon('dagger')"
                       onmouseenter="window.showInventoryTooltip(event, ${dagger.id})"
                       ontouchstart="window.showInventoryTooltip(event, ${dagger.id})"
                       onmouseleave="window.hideTooltip()">
                    <div style="text-align:center; width:100%;">
                      <strong style="color:#e74c3c; font-size:12px; display:block; margin-bottom:2px;">Riposte</strong>
                      <span style="font-size:8px; color:#aaa; text-transform:uppercase; letter-spacing:0.5px;">Kris Dagger</span>
                    </div>
                    <div style="margin: 8px 0; display:flex; align-items:center; justify-content:center; width:48px; height:48px; background:rgba(0,0,0,0.4); border-radius:6px; border:1px solid #e74c3c;">${window.getEquipIconHtml(dagger, 32)}</div>
                    <div style="font-size:9.5px; color:#ccc; text-align:center; line-height:1.35; min-height:60px; white-space:normal;">
                      Focuses on <strong>DEX & Speed</strong>. Unlocks Parry Rate and Riposte counter strikes.
                    </div>
                    <button class="btn-action" style="width:100%; font-size:10px; background:#e74c3c;" onpointerdown="event.stopPropagation();" ontouchstart="event.stopPropagation();" onclick="event.stopPropagation(); window.claimChoiceSubweapon(${JSON.stringify(dagger).replace(/"/g, "&quot;")})">CLAIM DAGGER</button>
                  </div>
                `;

  let tomeCardHtml = `
                  <div id="choice-card-tome" class="market-card" style="${cardStyles} border: 2px solid #9b59b6;"
                       onclick="window.selectChoiceSubweapon('tome')"
                       onmouseenter="window.showInventoryTooltip(event, ${tome.id})"
                       ontouchstart="window.showInventoryTooltip(event, ${tome.id})"
                       onmouseleave="window.hideTooltip()">
                    <div style="text-align:center; width:100%;">
                      <strong style="color:#9b59b6; font-size:12px; display:block; margin-bottom:2px;">Arcane</strong>
                      <span style="font-size:8px; color:#aaa; text-transform:uppercase; letter-spacing:0.5px;">Grimoire</span>
                    </div>
                    <div style="margin: 8px 0; display:flex; align-items:center; justify-content:center; width:48px; height:48px; background:rgba(0,0,0,0.4); border-radius:6px; border:1px solid #9b59b6;">${window.getEquipIconHtml(tome, 32)}</div>
                    <div style="font-size:9.5px; color:#ccc; text-align:center; line-height:1.35; min-height:60px; white-space:normal;">
                      Focuses on <strong>INT & Spells</strong>. Unlocks Arcane Barrier and Tome Spell triggers.
                    </div>
                    <button class="btn-action" style="width:100%; font-size:10px; background:#9b59b6;" onpointerdown="event.stopPropagation();" ontouchstart="event.stopPropagation();" onclick="event.stopPropagation(); window.claimChoiceSubweapon(${JSON.stringify(tome).replace(/"/g, "&quot;")})">CLAIM TOME</button>
                  </div>
                `;

  let medalHeaderSvg = window.getUiIconSvg("rareSpawn", 14);
  overlay.innerHTML = `
    <div style="text-align:center; color:white; animation: toastFadeIn 0.3s ease-out; max-width:580px; width:95%;">
      <div style="font-size: 16px; font-weight: 950; color:#f1c40f; letter-spacing: 2px; text-transform: uppercase; text-shadow: 0 0 8px rgba(241,196,15,0.3); margin-bottom:4px; display:flex; align-items:center; justify-content:center; gap:6px;">
        ${medalHeaderSvg} CHOOSE YOUR SUB-WEAPON (STAGE 10 REWARD) ${medalHeaderSvg}
      </div>
      <div style="font-size:10.5px; color:#aaa; margin-bottom:20px; white-space:normal; line-height:1.45;">
        You have beaten the Stage 10 Warden! Select your offhand specialization. Hover or hold any card to inspect its full stats.
      </div>
      <div style="display:flex; gap:10px; justify-content:center; flex-wrap:wrap; margin-bottom:20px;">
        ${shieldCardHtml}
        ${daggerCardHtml}
        ${tomeCardHtml}
      </div>
      <div style="font-size:9.5px; color:#888; font-family:monospace;">(Item will scale to Level 11 / StageScale 2 as a milestone bonus)</div>
    </div>
  `;

  window.selectChoiceSubweapon = function (type) {
    if (window.SoundManager) window.SoundManager.play("swing");
  };

  window.claimChoiceSubweapon = function (selectedItem) {
    let maxBag = window.getMaxBagSlots();

    // Auto-equips if the slot is currently empty, otherwise stores in Sack
    if (!window.equippedSlots.subweapon) {
      window.equippedSlots.subweapon = selectedItem;
      selectedItem.isEquippedSlot = "subweapon";
      window.pushHeaderToast(
        `Equipped ${selectedItem.name}!`,
        window.getTierColor(1),
      );
    } else {
      window.inventory.EQUIP.push(selectedItem);
      window.pushHeaderToast(
        `Stored ${selectedItem.name} in Sack!`,
        window.getTierColor(1),
      );
    }

    window.pushLog(
      `<strong style="color:#f1c40f;">[MILESTONE] Stage 10 Beaten! Claimed Sub-weapon of choice: <span style="color:${window.getTierColor(1)};">${selectedItem.name}</span></strong>`,
      selectedItem.id,
    );

    overlay.remove();
    if (window.SoundManager) window.SoundManager.play("revive");

    window.setPauseState(false);
    window.updateUI();
    window.renderInventory();
    window.saveGame();
  };
};

// --- RESILIENT CHAT FALLBACK ROUTINES ---
if (!window.ChatManager) {
  window.ChatManager = {
    channel: "GLOBAL",
    isExpanded: false,
    init() {
      console.log("💬 ChatManager Fallback Initialized.");
      this.renderWelcome();
    },
    toggleChat() {
      let drawer = document.getElementById("premium-chat-drawer");
      let btn = document.getElementById("btn-chat-toggle");
      if (!drawer) return;

      let isHidden = drawer.style.display === "none" || drawer.style.display === "";
      if (isHidden) {
        drawer.style.display = "flex";
        if (btn) btn.style.borderColor = "#ff007f";
        if (typeof window.updateChatStyle === "function") {
          window.updateChatStyle();
        }
      } else {
        drawer.style.display = "none";
        if (btn) btn.style.borderColor = "#a855f7";
      }
    },
    switchChannel(chan) {
      this.channel = chan;
      document
        .querySelectorAll(".chat-sub-tab")
        .forEach((btn) => btn.classList.remove("active"));
      let activeBtn = document.getElementById("chat-tab-" + chan.toLowerCase());
      if (activeBtn) {
        activeBtn.classList.add("active");
      }
    },
    handleInputKeydown(e) {
      if (e.key === "Enter") {
        this.sendCurrentMessage();
      }
    },
    sendCurrentMessage() {
      let input = document.getElementById("chat-message-input");
      if (!input) return;
      let msg = input.value.trim();
      if (!msg) return;

      input.value = "";
      let name =
        (window.playerStats && window.playerStats.playerName) || "Guest";
      let color =
        window.playerStats && window.playerStats.playerName === "Guest"
          ? "#7f8c8d"
          : "#ffd700";

      this.pushMessage(name, msg, color);
    },
    pushMessage(sender, text, color) {
      let container = document.getElementById("chat-messages-container");
      if (!container) return;

      let msgEl = document.createElement("div");
      msgEl.style.cssText =
        "margin-bottom: 6px; font-size: 11px; line-height: 1.35; text-align: left; font-family: monospace; border-bottom: 1px solid rgba(255,255,255,0.02); padding-bottom: 4px;";
      msgEl.innerHTML = `<strong style="color: ${color};">${sender}:</strong> <span style="color: #fff; white-space: normal; word-break: break-word;">${window.escapeHTML(text)}</span>`;

      container.appendChild(msgEl);
      container.scrollTop = container.scrollHeight;
    },
    renderWelcome() {
      this.pushMessage(
        "System",
        "Welcome to the real-time chat network! Synchronizing channels...",
        "#e67e22",
      );
    },
  };
}

// --- HIGH-FIDELITY FORGE LIVE PREVIEW GENERATOR ---
window.generateForgePreviewHtml = function (item, currentLvl, nextLvl) {
  if (!item)
    return `<div style="color:#666; font-style:italic; padding: 15px 0; text-align:center;">No item equipped in this slot.</div>`;

  let runBonus = 0;
  if (
    window.playerStats.isCrucibleMode &&
    window.cachedPlayerStats &&
    window.cachedPlayerStats.crucibleSlotBonuses &&
    item.isEquippedSlot
  ) {
    runBonus =
      window.cachedPlayerStats.crucibleSlotBonuses[item.isEquippedSlot] || 0;
  }

  let curMult = 1.0 + currentLvl * 0.01 + runBonus;
  let nextMult = 1.0 + nextLvl * 0.01 + runBonus;

  let baseStatsHtml = [];
  let affixesHtml = [];

  // Helper to format values cleanly
  let formatVal = (v, isPct) =>
    isPct ? Math.round(v * 100) + "%" : window.formatNumber(Math.ceil(v));

  // 1. Process Base Properties
  const baseStatsKeys = [
    { key: "baseAtk", label: "Weapon Damage", icon: "atk" },
    { key: "baseDef", label: "Armor", icon: "def" },
    { key: "baseMaxHp", label: "Max Life", icon: "maxHp" },
    { key: "baseMoveSpeed", label: "Speed", icon: "moveSpeed" },
    { key: "baseBlock", label: "Block Rate", icon: "block", isPct: true },
    { key: "baseParry", label: "Parry Rate", icon: "parry", isPct: true },
    { key: "baseInt", label: "Intelligence", icon: "int" },
  ];

  baseStatsKeys.forEach((s) => {
    let baseVal = item[s.key] || 0;
    if (baseVal > 0) {
      let curVal = baseVal * curMult;
      let newVal = baseVal * nextMult;
      let diff = newVal - curVal;
      let icon = window.getUiIconSvg(s.icon, 11);

      let diffStr = s.isPct
        ? `+${Math.round(diff * 100)}%`
        : `+${window.formatNumber(Math.ceil(diff))}`;

      baseStatsHtml.push(`
        <div style="display:flex; justify-content:space-between; align-items:center; font-family:monospace; font-size:11px; margin-bottom:4px; border-bottom:1px solid rgba(255,255,255,0.02); padding-bottom:3px;">
          <span style="color:#aaa; display:flex; align-items:center; gap:4px;">${icon} ${s.label}:</span>
          <span>
            <span style="color:#7f8c8d;">${formatVal(curVal, s.isPct)}</span> ➔
            <strong style="color:#fff;">${formatVal(newVal, s.isPct)}</strong>
            <span style="color:#2ecc71; font-weight:bold; margin-left:4px;">(${diffStr})</span>
          </span>
        </div>
      `);
    }
  });

  // 2. Process Extended Affixes (Custom rolled stats)
  const statsKeys = [
    { key: "atk", label: "Attack" },
    { key: "maxHp", label: "Max HP" },
    { key: "def", label: "Defense" },
    { key: "moveSpeed", label: "Move Speed" },
    { key: "str", label: "STR" },
    { key: "dex", label: "DEX" },
    { key: "int", label: "INT" },
    { key: "critChance", label: "Crit Chance", isPct: true },
    { key: "critDamage", label: "Crit Multi", isPct: true },
    { key: "block", label: "Block Rate", isPct: true, baseKey: "baseBlock" },
    { key: "parry", label: "Parry Rate", isPct: true, baseKey: "baseParry" },
    {
      key: "activeAttackSpeed",
      label: "Active Atk Spd",
      isPct: true,
      baseKey: "baseActiveSpeed",
    },
    {
      key: "idleAttackSpeed",
      label: "Idle Atk Spd",
      isPct: true,
      baseKey: "baseIdleSpeed",
    },
    { key: "dropRate", label: "Drop Rate", isPct: true },
    { key: "quality", label: "Drop Quality", isPct: true },
    { key: "goldMulti", label: "Gold Multi", isPct: true },
    { key: "rareSpawn", label: "Rare Spawn", isPct: true, isDoublePct: true },
    { key: "fairySpawn", label: "Fairy Spawn", isPct: true },
  ];

  statsKeys.forEach((s) => {
    let totalVal = item[s.key] || 0;
    let baseVal = s.baseKey ? item[s.baseKey] || 0 : 0;
    let affixVal = totalVal - baseVal;

    if (
      affixVal > 0.0001 ||
      ((s.key === "activeAttackSpeed" || s.key === "idleAttackSpeed") &&
        affixVal > 0)
    ) {
      let curVal = affixVal * curMult;
      let newVal = affixVal * nextMult;
      let diff = newVal - curVal;
      let icon = window.getUiIconSvg(s.key, 11);

      let diffStr = s.isDoublePct
        ? `+${(diff * 100).toFixed(2)}%`
        : s.isPct
          ? `+${Math.round(diff * 100)}%`
          : `+${window.formatNumber(Math.ceil(diff))}`;

      let curStr = s.isDoublePct
        ? `+${(curVal * 100).toFixed(2)}%`
        : formatVal(curVal, s.isPct);
      let newStr = s.isDoublePct
        ? `+${(newVal * 100).toFixed(2)}%`
        : formatVal(newVal, s.isPct);

      affixesHtml.push(`
        <div style="display:flex; justify-content:space-between; align-items:center; font-family:monospace; font-size:11px; margin-bottom:4px; border-bottom:1px solid rgba(255,255,255,0.02); padding-bottom:3px;">
          <span style="color:#aaa; display:flex; align-items:center; gap:4px;">${icon} ${s.label}:</span>
          <span>
            <span style="color:#7f8c8d;">+${curStr}</span> ➔
            <strong style="color:#fff;">+${newStr}</strong>
            <span style="color:#2ecc71; font-weight:bold; margin-left:4px;">(${diffStr})</span>
          </span>
        </div>
      `);
    }
  });

  let nameColor = window.getTierColor(item.statsRolled);
  let starsLabel =
    item.statsRolled === "UNIQUE"
      ? "UNIQUE"
      : `${item.statsRolled}★ ${window.getTierName(item.statsRolled)}`;

  let baseSectionHtml =
    baseStatsHtml.length > 0
      ? `<div style="margin-bottom:8px;">
         <strong style="color:#3498db; font-size:10px; display:block; border-bottom:1px solid #333; padding-bottom:2px; margin-bottom:4px; text-transform:uppercase;">📊 BASE PROPERTIES:</strong>
         ${baseStatsHtml.join("")}
       </div>`
      : "";

  let affixSectionHtml =
    affixesHtml.length > 0
      ? `<div style="margin-bottom:8px;">
         <strong style="color:#e67e22; font-size:10px; display:block; border-bottom:1px solid #333; padding-bottom:2px; margin-bottom:4px; text-transform:uppercase;">🎲 EXTENDED AFFIXES:</strong>
         ${affixesHtml.join("")}
       </div>`
      : "";

  let setSectionHtml = "";
  let setName = window.getItemSetName ? window.getItemSetName(item) : null;
  if (setName) {
    setSectionHtml = `
      <div style="margin-top:6px; border-top:1px dashed #444; padding-top:4px; text-align:left; font-size:10px; color:#2ecc71;">
        ✨ <strong>Set Affinity:</strong> ${setName}
      </div>
    `;
  }

  return `
    <div style="background:rgba(0,0,0,0.45); border: 1.5px solid ${nameColor}; border-radius:8px; padding:12px; box-shadow: inset 0 0 10px rgba(0,0,0,0.5);">
      <div style="display:flex; align-items:center; gap:8px; border-bottom:1px solid #333; padding-bottom:6px; margin-bottom:10px; text-align:left;">
        <div style="flex-shrink:0;">${window.getEquipIconHtml(item, 28)}</div>
        <div style="min-width:0; flex:1;">
          <strong style="color:${nameColor}; font-size:12.5px; text-shadow:0 0 8px ${window.hexToRgba(nameColor, 0.25)}; display:block; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${item.name}</strong>
          <span style="font-size:9px; color:#aaa; font-family:monospace; display:block; margin-top:2px;">Rarity: ${starsLabel}</span>
        </div>
      </div>

      ${baseSectionHtml}
      ${affixSectionHtml}
      ${setSectionHtml}
    </div>
  `;
};

/* ==========================================================================
   HOOR'S TUTORIAL & CHAIN-SHATTERING UNLOCK ENGINE
   ========================================================================= */

// Procedural vector avatar generator for Hoor (Hot Knight Chick)
window.getHoorAvatarHtml = function (size = 44) {
  return `
    <svg width="${size}" height="${size}" viewBox="0 0 64 64" style="display:block; overflow:visible; filter: drop-shadow(0 0 5px rgba(255, 0, 127, 0.5));">
      <!-- Deep void aura backing -->
      <circle cx="32" cy="32" r="28" fill="#0d0812" stroke="#ff007f" stroke-width="1.8" />

      <!-- Long flowing golden hair (back layer) -->
      <path d="M14 26 C8 32, 10 52, 14 58 C16 45, 12 36, 16 30 Z" fill="#e67e22" />
      <path d="M50 26 C56 32, 54 52, 50 58 C48 45, 52 36, 48 30 Z" fill="#e67e22" />

      <path d="M12 28 C6 35, 8 55, 16 60 C18 48, 14 38, 18 32 Z" fill="#f1c40f" />
      <path d="M52 28 C58 35, 56 55, 48 60 C46 48, 50 38, 46 32 Z" fill="#f1c40f" />

      <!-- Face plate -->
      <path d="M20 22 Q32 16, 44 22 Q48 32, 44 42 Q32 50, 20 42 Q16 32, 20 22 Z" fill="#ffddc5" stroke="#111" stroke-width="1.2" />

      <!-- Winking Cute Eyes & Eyebrows -->
      <!-- Left Eye (Open, focused, blue-eyed) -->
      <ellipse cx="26" cy="30" rx="3.5" ry="2.2" fill="#fff" stroke="#111" stroke-width="1" />
      <circle cx="26" cy="30" r="1.8" fill="#3498db" />
      <circle cx="27" cy="29" r="0.6" fill="#fff" />
      <path d="M22 26 Q26 23, 30 26" fill="none" stroke="#683d12" stroke-width="1.5" stroke-linecap="round" />

      <!-- Right Eye (Seductive wink/closed arc) -->
      <path d="M36 30 Q40 33, 44 29" fill="none" stroke="#111" stroke-width="2.2" stroke-linecap="round" />
      <path d="M35 25 Q39 23, 43 26" fill="none" stroke="#683d12" stroke-width="1.5" stroke-linecap="round" />

      <!-- Blushing cheeks -->
      <circle cx="21" cy="35" r="3.5" fill="#ff7675" opacity="0.65" />
      <circle cx="43" cy="34" r="3.5" fill="#ff7675" opacity="0.65" />

      <!-- Cute lips -->
      <path d="M29 41 Q32 44, 35 41 Q32 42, 29 41 Z" fill="#ff007f" stroke="#4d001a" stroke-width="1" />

      <!-- Front fringe/bangs hair -->
      <path d="M19 22 Q32 14, 45 22 Q36 21, 31 25 Q26 20, 19 22 Z" fill="#ffd700" />
      <path d="M20 22 Q23 27, 25 31 C24 26, 21 24, 20 22 Z" fill="#ffd700" />
      <path d="M44 22 Q41 27, 39 31 C40 26, 43 24, 44 22 Z" fill="#ffd700" />

      <!-- Shining Silver & Gold Crown/Circlet with Ruby Gem -->
      <path d="M18 19 Q32 13, 46 19 L48 16 Q32 9, 16 16 Z" fill="#d4af37" stroke="#000" stroke-width="1.2" />
      <path d="M24 16 L32 6 L40 16 Z" fill="#bdc3c7" stroke="#000" stroke-width="1.5" />
      <polygon points="32,7 35,11 32,15 29,11" fill="#ff007f" style="filter: drop-shadow(0 0 3px #ff007f);" />

      <!-- Steel Pauldrons / Neck Plate armor -->
      <path d="M14 43 L50 43 L48 58 L16 58 Z" fill="#7f8c8d" stroke="#000" stroke-width="1.5" />
      <!-- Rose-gold neck collar lining -->
      <path d="M18 43 Q32 47, 46 43 L44 47 Q32 51, 20 47 Z" fill="#e67e22" stroke="#000" stroke-width="1" />
    </svg>
  `;
};

window.HoorTutorial = {
  activeDialog: null,
  highlightedElements: [],
  originalStyles: null,

  getActiveTab() {
    let activeContent = document.querySelector(".tab-content.active");
    if (!activeContent) return "hero";
    return activeContent.id.replace("tab-", "");
  },

  // Short, punchy, classic retro-RPG dialogues with targeted focus selectors
  steps: {
    start: {
      title: "Hoor",
      avatar: "🏅",
      text: "Well, look who finally crawled out of the tavern. I'm Hoor. If you want to survive out here, you'd better start swinging. Tap the screen or hold Space to help your auto-attacks out.",
      trigger: () =>
        window.playerStats.totalLifetimeKills === 0 &&
        window.playerStats.stage === 1 &&
        window.HoorTutorial.getActiveTab() === "hero",
      highlightSelector: null,
    },
    level_up: {
      title: "Hoor",
      avatar: "🏅",
      text: "You leveled up! You've been awarded 6 Skill Points (SP). Click on the Hero tab to spend them in the Attribute Matrix and increase your combat power.",
      trigger: () =>
        window.playerStats.level > 1 && (window.playerStats.sp || 0) >= 6,
      highlightSelector: "button[onclick*='hero']",
    },
    tab_hero: {
      title: "Hoor",
      avatar: "🏅",
      text: "Your core attributes are here. Spend your Skill Points (SP) on the Attribute Matrix: STR increases your Attack and Max HP multipliers, DEX boosts Crit Chance/Damage and Movement Speed, while INT powers up your Block, Parry, and Fairy Spawn rates.",
      trigger: () =>
        window.playerStats.visitedTabs.includes("hero") &&
        window.HoorTutorial.getActiveTab() === "hero",
      highlightSelector: ".stats-panel-right",
    },
    tab_inv: {
      title: "Hoor",
      avatar: "🏅",
      text: "Your bag holds all your spoils. Don't worry about overflow—any new equipment picked up when your bag is full is automatically salvaged into Gold, Souls, and upgrade scraps based on your Auto-Salvage Threshold at the bottom of the tab! Locked items are always safe.",
      trigger: () =>
        window.playerStats.visitedTabs.includes("inv") &&
        window.HoorTutorial.getActiveTab() === "inv",
      highlightSelector: "#bulk-salvage-bar",
    },
    tab_forge: {
      title: "Hoor",
      avatar: "🏅",
      text: "This is the Forge. Instead of temporary individual item upgrades, we Attune the equipment slots themselves. Slot Attunement permanently multiplies the stats of any item you equip in that slot, and persists across item swaps and prestiges!",
      trigger: () =>
        window.playerStats.visitedTabs.includes("forge") &&
        window.HoorTutorial.getActiveTab() === "forge",
      highlightSelector: "#forge-station-container",
    },
    tab_altar: {
      title: "Hoor",
      avatar: "🏅",
      text: "The Altar of Rifts is where we summon Reality Rifts to hunt down Rift Guardians. Spend Ancient Cores to trigger Rift encounters. Slaying Rift Guardians yields valuable Eridium Shards, Gacha Keys, and legendary crafting scraps!",
      trigger: () =>
        window.playerStats.visitedTabs.includes("activities") &&
        window.HoorTutorial.getActiveTab() === "activities" &&
        window.state.currentActivitiesSubTab === "ALTAR" &&
        window.playerStats.level >= 25,
      highlightSelector: "#runs-sec-altar",
    },
    quests_board: {
      title: "Hoor",
      avatar: "🏅",
      text: "Ah, the Kingdom's Quest Board! Complete Daily and Weekly objectives to earn Quest Points (QP) and Reward Sacks. Spend your QP in the Quest Shop below to buy premium reagents!",
      trigger: () =>
        document.getElementById("missions-draggable-window") !== null,
      highlightSelector: "#missions-draggable-window",
    },
    dungeons_mode: {
      title: "Hoor",
      avatar: "🏅",
      text: "Welcome to the Infinite Caverns! Spend Dungeon Keys here to delve deep. You can find equipment, materials, and gold. Slot a Cavern Sigil below to scale your drops and gold multiplier!",
      trigger: () =>
        window.HoorTutorial.getActiveTab() === "activities" &&
        window.state.currentActivitiesSubTab === "DUNGEONS",
      highlightSelector: "#cavern-sigil-slot-container",
    },
    crucible_mode: {
      title: "Hoor",
      avatar: "🏅",
      text: "The Astral Crucible is an endless gladiatorial arena. Defeat waves of celestial monsters to earn Shards and Catalyst Cores. Each completed wave lets you draft powerful upgrade cards!",
      trigger: () =>
        window.HoorTutorial.getActiveTab() === "activities" &&
        window.state.currentActivitiesSubTab === "CRUCIBLE",
      highlightSelector: "#activities-sec-crucible",
    },
    prestige_tab: {
      title: "Hoor",
      avatar: "🏅",
      text: "This is the Altar of Ascension. Challenge the dragon Hooktail at the maximum stage you can survive. Slaying her lets you Ascend, granting permanent Prestige Points (PP) to invest in multipliers!",
      trigger: () => window.HoorTutorial.getActiveTab() === "prestige",
      highlightSelector: "#tab-prestige",
    },
    reforge_mode: {
      title: "Hoor",
      avatar: "🏅",
      text: "Reforging allows you to re-roll individual stats on your gear. Once you re-roll a stat line, all other lines on that item become locked! Reforging requires 1x Overlord's Sigil and Gold.",
      trigger: () =>
        window.HoorTutorial.getActiveTab() === "forge" &&
        window.forgeMode === "reforge",
      highlightSelector: "#forge-details",
    },
    tier_mode: {
      title: "Hoor",
      avatar: "🏅",
      text: "Rarity Awakening elevates your item's star rating (0★ to 5★). It permanently increases base parameters by +10% and immediately unlocks a brand new random stat line!",
      trigger: () =>
        window.HoorTutorial.getActiveTab() === "forge" &&
        window.forgeMode === "tier",
      highlightSelector: "#forge-details",
    },
    set_mode: {
      title: "Hoor",
      avatar: "🏅",
      text: "Set Re-Resonance lets you roll a different named set affiliation at random. Collect matching 2-piece and 3-piece sets to unlock massive passive combat bonuses!",
      trigger: () =>
        window.HoorTutorial.getActiveTab() === "forge" &&
        window.forgeMode === "set",
      highlightSelector: "#forge-details",
    },
    enchant_mode: {
      title: "Hoor",
      avatar: "🏅",
      text: "Celestial Enchanting targets an existing stat line at random and amplifies its value by a whopping +25%! Requires 1x Astral Essence and Slot Attunement Lv. 50.",
      trigger: () =>
        window.HoorTutorial.getActiveTab() === "forge" &&
        window.forgeMode === "enchant",
      highlightSelector: "#forge-details",
    },
    reset_enchant_mode: {
      title: "Hoor",
      avatar: "🏅",
      text: "Arcane Purge dispels all active enchantments from an item, restoring its stats to their original pre-enchanted baseline so you can re-enchant them.",
      trigger: () =>
        window.HoorTutorial.getActiveTab() === "forge" &&
        window.forgeMode === "reset_enchant",
      highlightSelector: "#forge-details",
    },
    shatter_mode: {
      title: "Hoor",
      avatar: "🏅",
      text: "Spectral Shatter permanently sacrifices an unequipped Unique weapon or armor piece to unlock its active passive effect inside your permanent Spectral Codex!",
      trigger: () =>
        window.HoorTutorial.getActiveTab() === "forge" &&
        window.forgeMode === "shatter",
      highlightSelector: "#forge-details",
    },
  },

  init() {
    window.playerStats.completedTutorialSteps =
      window.playerStats.completedTutorialSteps || [];
    window.playerStats.visitedTabs = window.playerStats.visitedTabs || [];
    this.checkTriggers();
  },

  checkTriggers() {
    if (window.isGamePaused && this.activeDialog) return;

    for (let key in this.steps) {
      if (window.playerStats.completedTutorialSteps.includes(key)) continue;

      let step = this.steps[key];
      if (step.trigger()) {
        this.showDialog(key, step);
        break;
      }
    }
  },

  init() {
    window.playerStats.completedTutorialSteps =
      window.playerStats.completedTutorialSteps || [];
    window.playerStats.visitedTabs = window.playerStats.visitedTabs || [];
    this.checkTriggers();
  },

  checkTriggers() {
    if (window.isGamePaused && this.activeDialog) return;

    for (let key in this.steps) {
      if (window.playerStats.completedTutorialSteps.includes(key)) continue;

      let step = this.steps[key];
      if (step.trigger()) {
        this.showDialog(key, step);
        break;
      }
    }
  },

  showDialog(key, step) {
    this.activeDialog = key;
    window.setPauseState(true);

    // 1. Run tab switch / menu setup before rendering the highlights
    if (step.setup) {
      step.setup();
    }

    // 2. Clear out any previous layout
    let overlay = document.getElementById("hoor-tutorial-overlay");
    if (overlay) overlay.remove();

    // 3. Spawns high-z-index background dimming backdrop
    let backdrop = document.getElementById("tutorial-backdrop");
    if (!backdrop) {
      backdrop = document.createElement("div");
      backdrop.id = "tutorial-backdrop";
      backdrop.style.cssText = `
            position: fixed;
            top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(8, 5, 15, 0.45);
            backdrop-filter: blur(1.5px);
            z-index: 44000;
            pointer-events: auto;
          `;
      document.body.appendChild(backdrop);
    }

    // 4. Anchor and pull targeted element z-index above the backdrop
    if (step.highlightSelector) {
      let el = document.querySelector(step.highlightSelector);
      if (el) {
        // Scroll the targeted element centered nicely on the viewport
        setTimeout(() => {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 50);

        this.originalStyles = {
          element: el,
          position: el.style.position,
          zIndex: el.style.zIndex,
          boxShadow: el.style.boxShadow,
          borderColor: el.style.borderColor,
          transition: el.style.transition,
        };

        el.style.position = "relative";
        el.style.zIndex = "44500";
        el.style.transition = "box-shadow 0.3s, border-color 0.3s";
        el.style.boxShadow =
          "0 0 15px #ffd700, inset 0 0 10px rgba(255, 215, 0, 0.5)";
        el.style.borderColor = "#ffd700";
        this.highlightedElements.push(el);
      }
    }

    overlay = document.createElement("div");
    overlay.id = "hoor-tutorial-overlay";
    overlay.style.zIndex = "45000";
    document.body.appendChild(overlay);

    let box = document.createElement("div");
    box.style.cssText = `
      background: linear-gradient(135deg, #131720 0%, #0c0f16 100%);
      border: 2px solid #ff007f;
      border-radius: 12px;
      width: 90%;
      max-width: 440px;
      padding: 16px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.95), inset 0 0 15px rgba(255, 0, 127, 0.1);
      display: flex;
      gap: 16px;
      align-items: flex-start;
    `;

    box.innerHTML = `
      <div style="flex-shrink:0;">
        ${window.getHoorAvatarHtml(44)}
      </div>
      <div style="flex: 1; text-align: left;">
        <strong style="color: #ff007f; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 4px;">
          ${step.title}
        </strong>
        <p style="font-size: 11px; color: #f1f5f9; line-height: 1.45; margin: 0 0 12px 0; white-space: normal;">
          ${step.text}
        </p>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <button onclick="window.HoorTutorial.skipAll()" style="background: transparent; border: none; color: #555; font-size: 9.5px; cursor: pointer;">
            Skip all tips
          </button>
          <button onclick="window.HoorTutorial.dismiss('${key}')" class="btn-action" style="background: #ff007f; color: #fff; padding: 4px 14px; font-size: 10px; border-radius: 4px;">
            Got it
          </button>
        </div>
      </div>
    `;

    overlay.appendChild(box);

    if (window.SoundManager) window.SoundManager.play("fairy");
  },

  clearHighlights() {
    if (this.originalStyles) {
      let el = this.originalStyles.element;
      if (el) {
        el.style.position = this.originalStyles.position;
        el.style.zIndex = this.originalStyles.zIndex;
        el.style.boxShadow = this.originalStyles.boxShadow;
        el.style.borderColor = this.originalStyles.borderColor;
        el.style.transition = this.originalStyles.transition;
      }
      this.originalStyles = null;
    }
    this.highlightedElements = [];

    let backdrop = document.getElementById("tutorial-backdrop");
    if (backdrop) backdrop.remove();
  },

  dismiss(key) {
    let overlay = document.getElementById("hoor-tutorial-overlay");
    if (overlay) overlay.remove();

    this.clearHighlights();

    window.playerStats.completedTutorialSteps.push(key);
    this.activeDialog = null;
    window.setPauseState(false);

    window.updateUI();
    window.saveGame();
  },

  skipAll() {
    if (typeof window.showCustomConfirm === "function") {
      window.showCustomConfirm(
        "Mute Hoor's Advice?",
        "Are you sure you want to skip all future tips? You can always consult the Guidebook manually.",
        "Mute Tips",
        "Keep Tips",
        "#e74c3c",
        () => {
          for (let key in this.steps) {
            if (!window.playerStats.completedTutorialSteps.includes(key)) {
              window.playerStats.completedTutorialSteps.push(key);
            }
          }
          let overlay = document.getElementById("hoor-tutorial-overlay");
          if (overlay) overlay.remove();
          this.clearHighlights();
          this.activeDialog = null;
          window.setPauseState(false);
          window.updateUI();
          window.saveGame();
        },
      );
    }
  },
};

/* --- FULL-SCREEN CHAINS SHATTERING UNLOCK ANIMATION ENGINE --- */
window.playGlobalUnlockAnimation = function (
  title,
  iconSymbol = "🔮",
  callback = null,
) {
  let overlay = document.getElementById("unlock-animation-overlay");
  if (overlay) overlay.remove();

  window.setPauseState(true);

  // 1. Redirect viewport first so the background changes behind our transparent lock
  if (callback) {
    callback();
  }

  // 2. Create the beautiful semi-transparent glassmorphic overlay over the active tab
  overlay = document.createElement("div");
  overlay.id = "unlock-animation-overlay";
  overlay.style.position = "fixed";
  overlay.style.top = "0";
  overlay.style.left = "0";
  overlay.style.width = "100%";
  overlay.style.height = "100%";
  overlay.style.backgroundColor = "rgba(8, 5, 15, 0.65)"; // High visibility transparent backing
  overlay.style.display = "flex";
  overlay.style.flexDirection = "column";
  overlay.style.justifyContent = "center";
  overlay.style.alignItems = "center";
  overlay.style.zIndex = "50000";
  overlay.style.backdropFilter = "blur(4px)"; // Modern glass blur
  overlay.style.color = "#fff";
  overlay.style.fontFamily = "sans-serif";
  overlay.style.userSelect = "none";
  overlay.style.webkitUserSelect = "none";

  document.body.appendChild(overlay);

  // Padlock SVG with separate shackle group to slide up
  let padlockSvg = `
    <svg width="100" height="120" viewBox="0 0 64 80" style="display:block;">
      <g class="padlock-shackle" style="transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.2); transform-origin: 32px 36px;">
        <path d="M18 36 V22 C18 13, 22 8, 32 8 C42 8, 46 13, 46 22 V36" fill="none" stroke="#d4af37" stroke-width="5" stroke-linecap="round" />
      </g>
      <rect x="12" y="32" width="40" height="34" rx="6" fill="linear-gradient(135deg, #ffd700, #b7950b)" stroke="#000" stroke-width="2.5" />
      <path d="M32 44 A3.5 3.5 0 0 0 30 47.5 L28 56 H36 L34 47.5 A3.5 3.5 0 0 0 32 44 Z" fill="#111" stroke="#444" stroke-width="1" />
    </svg>
  `;

  // Segmented Chain SVGs wrapped inside individual left/right coordinate spaces
  let chainLeftSvg = `
    <svg width="100" height="120" viewBox="0 0 50 80" style="display:block;">
      <rect x="25" y="10" width="8" height="16" rx="3.5" fill="none" stroke="#7f8c8d" stroke-width="4.5" transform="rotate(-15 29 18)" />
      <rect x="15" y="24" width="8" height="16" rx="3.5" fill="none" stroke="#7f8c8d" stroke-width="4.5" transform="rotate(15 19 32)" />
      <rect x="25" y="38" width="8" height="16" rx="3.5" fill="none" stroke="#7f8c8d" stroke-width="4.5" transform="rotate(-15 29 46)" />
      <rect x="15" y="52" width="8" height="16" rx="3.5" fill="none" stroke="#7f8c8d" stroke-width="4.5" transform="rotate(15 19 60)" />
    </svg>
  `;

  let chainRightSvg = `
    <svg width="100" height="120" viewBox="0 0 50 80" style="display:block;">
      <rect x="17" y="10" width="8" height="16" rx="3.5" fill="none" stroke="#7f8c8d" stroke-width="4.5" transform="rotate(15 21 18)" />
      <rect x="27" y="24" width="8" height="16" rx="3.5" fill="none" stroke="#7f8c8d" stroke-width="4.5" transform="rotate(-15 31 32)" />
      <rect x="17" y="38" width="8" height="16" rx="3.5" fill="none" stroke="#7f8c8d" stroke-width="4.5" transform="rotate(15 21 46)" />
      <rect x="27" y="52" width="8" height="16" rx="3.5" fill="none" stroke="#7f8c8d" stroke-width="4.5" transform="rotate(-15 31 60)" />
    </svg>
  `;

  overlay.innerHTML = `
    <div style="text-align:center; animation: toastFadeIn 0.3s ease-out;">
      <div class="unlock-container" id="unlock-container-element">
        <div class="unlock-chain-left">${chainLeftSvg}</div>
        <div class="unlock-chain-right">${chainRightSvg}</div>
        <div class="unlock-padlock shaking" id="unlock-padlock-element">${padlockSvg}</div>
      </div>
      <h2 style="margin:0 0 6px 0; color:#ffd700; letter-spacing:3px; text-transform:uppercase; font-size:18px; text-shadow: 0 0 10px rgba(241,196,15,0.45); font-family:sans-serif;">${iconSymbol} UNLOCKED!</h2>
      <div style="font-size:11.5px; color:#aaa; font-family:monospace; margin-bottom:20px;" id="unlock-title-element">${title}</div>
    </div>
  `;

  let container = document.getElementById("unlock-container-element");
  let lock = document.getElementById("unlock-padlock-element");

  setTimeout(() => {
    if (lock) {
      lock.classList.remove("shaking");
      lock.classList.add("open");
    }
    if (window.SoundManager) window.SoundManager.play("parry");

    let cvs = document.getElementById("gameCanvas");
    let w = cvs ? cvs.width : 750;
    let h = cvs ? cvs.height : 250;
    for (let i = 0; i < 45; i++) {
      let angle = Math.random() * Math.PI * 2;
      let vel = window.randFloat(4, 9);
      window.particles.push(
        window.ParticlePool.get(
          w / 2,
          h / 2,
          Math.cos(angle) * vel,
          Math.sin(angle) * vel - 1.5,
          window.randFloat(2, 5),
          Math.random() > 0.4 ? "#f1c40f" : "#fff",
          1,
          window.randInt(30, 50),
        ),
      );
    }

    setTimeout(() => {
      if (container) {
        container.classList.add("shattered");
      }
      if (window.SoundManager) window.SoundManager.play("death");

      setTimeout(() => {
        overlay.style.transition = "opacity 0.4s ease";
        overlay.style.opacity = "0";

        setTimeout(() => {
          overlay.remove();
          window.setPauseState(false);
          window.updateUI();
          window.saveGame();
        }, 400);
      }, 700);
    }, 450);
  }, 700);
};
