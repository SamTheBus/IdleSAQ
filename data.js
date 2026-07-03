/* ==========================================================================
   PRIMARY PURPOSE: Stores global game state, constant dictionaries,
   initial global state, and system utility functions.
   ========================================================================= */

window.GAME_VERSION = 0.98; // Pre-release Alpha 0.9.8 // Increment this whenever you push a new release

// Core Security: HTML Sanitizer to prevent XSS injection in user lists
window.escapeHTML = function (str) {
  if (!str) return "";
  return str.replace(
    /[&<>'"]/g,
    (tag) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[
        tag
      ] || tag,
  );
};

window.getUiIconSvg = function (key, size = 12) {
  let icon = window.AssetCatalog.uiIcons[key];
  if (!icon) return "";
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="${icon.color}" fill-opacity="${icon.opacity}" stroke="${icon.color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle; transform: translateY(-1.5px); line-height: 1; margin-right: 3px;">${icon.path}</svg>`;
};

// --- SYSTEM UTILS ---

window.formatNumber = function (num) {
  if (num === null || num === undefined) return "0";
  num = Number(num);
  if (isNaN(num)) return "0";
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

// Universal Normalized Weight-Based Rarity Probability Solver
window.calculateRarityProbabilities = function (qly, isGacha = false) {
  let weights = [0, 0, 0, 0, 0, 0]; // Index maps to stars quality (0 to 5)

  if (isGacha) {
    // Intrinsic Base Weights for Gacha Vending Machine at Q=1.0:
    // 0★: 0 (Guarantees 1★+) | 1★: 54 | 2★: 25 | 3★: 15 | 4★: 5 | 5★: 1
    weights[0] = 0;
    weights[1] = 54 / Math.pow(qly, 0.5); // Lowers as quality grows
    weights[2] = 25 * Math.pow(qly, 0.4);
    weights[3] = 15 * Math.pow(qly, 0.8);
    weights[4] = 5 * Math.pow(qly, 1.2);
    weights[5] = 1 * Math.pow(qly, 1.6);
  } else {
    // Intrinsic Base Weights for Campaign & Dungeon Drops at Q=1.0:
    // 0★: 84.82 | 1★: 11.0 | 2★: 3.2 | 3★: 0.8 | 4★: 0.16 | 5★: 0.02
    weights[0] = 84.82 / Math.pow(qly, 0.6); // Shrinks as quality grows
    weights[1] = 11.0 / Math.pow(qly, 0.1); // Slightly scales down relative to upper tiers
    weights[2] = 3.2 * Math.pow(qly, 0.4);
    weights[3] = 0.8 * Math.pow(qly, 0.8);
    // Preserves native quality gating checks
    weights[4] = qly >= 1.5 ? 0.16 * Math.pow(qly, 1.2) : 0;
    weights[5] = qly >= 2.0 ? 0.02 * Math.pow(qly, 1.6) : 0;
  }

  let totalWeight = weights.reduce((sum, w) => sum + w, 0);
  if (totalWeight <= 0) return [100, 0, 0, 0, 0, 0]; // Fallback sanity check

  // Return normalized percentage list (0.0% to 100.0%)
  return weights.map((w) => (w / totalWeight) * 100);
};

window.getDepthQualityMultiplier = function (stage) {
  let s = Number(stage);
  if (isNaN(s) || s < 1) s = 1;
  // Asymptotic scaling: smoothly scales from 1.0 up to a hard cap of 2.0
  // Half-height of the maximum bonus is reached at stage 150
  return 1.0 + (s - 1) / (s + 150);
};

// Initialize transaction-safe GameState manager
window.GameState = {
  gainXp(amount, isOffline = false) {
    if (isNaN(amount) || amount <= 0) return;

    window.playerStats.xp += amount;
    let leveledUp = false;

    // Process potential consecutive level-ups via a loop (important for offline catch-up)
    while (window.playerStats.xp >= window.playerStats.xpReq) {
      window.playerStats.xp -= window.playerStats.xpReq;
      window.playerStats.level++;
            window.playerStats.sp += 6; // Award 6 Skill Points per level up

      // Exponential scaling thresholds prevent runaway level inflation
      window.playerStats.xpReq = Math.floor(
        250 * Math.pow(1.2, window.playerStats.level - 1),
      );
      leveledUp = true;

      // Keep active UI Attribute Matrix draft allocations in sync
      if (window.draftAllocations !== null) {
        window.draftSP++;
      }
    }

window.triggerLevelUpEffect = function() {
    let heroX = window.hero.x + 12;
    let heroY = window.hero.y + 15;
    // Explode 60 golden particles in a ring
    for(let i = 0; i < 60; i++) {
        let angle = (i / 60) * Math.PI * 2;
        window.particles.push({
            x: heroX,
            y: heroY,
            vx: Math.cos(angle) * 8,
            vy: Math.sin(angle) * 8,
            radius: window.randFloat(2, 5),
            color: "#f1c40f",
            alpha: 1,
            life: 60,
            gravity: 0.1
        });
    }
};

    if (leveledUp) {
          window.triggerLevelUpEffect();

                window.invalidatePlayerStats();
          let p = window.resolvePlayerStats();
      window.playerStats.currentHp = p.maxHp; // Fully heal to new Max HP

      if (!isOffline) {
        if (window.SoundManager) window.SoundManager.play("revive");
        if (typeof window.pushLog === "function") {
          window.pushLog(
            `<strong style="color:#d946ef;">🎉 LEVEL UP! Reached Level ${window.playerStats.level}! (+1 SP)</strong>`,
          );
        }
        if (typeof window.pushHeaderToast === "function") {
          window.pushHeaderToast(
            `🎉 Level Up! Reached Level ${window.playerStats.level}!`,
            "#d946ef",
          );
        }
      }
      if (typeof window.checkAchievements === "function") {
        window.checkAchievements();
      }
    }

    if (typeof window.updateUI === "function") {
      window.updateUI();
    }
  },

  addCoins(amount) {
    if (isNaN(amount) || amount <= 0) return;
    window.playerStats.coins += amount;
    window.playerStats.totalGoldEarned =
      (window.playerStats.totalGoldEarned || 0) + amount;
    if (typeof window.updateUI === "function") window.updateUI();
  },

  spendCoins(amount) {
    if (isNaN(amount) || amount <= 0) return false;
    if (window.playerStats.coins < amount) return false;
    window.playerStats.coins -= amount;
    if (window.playerStats.coins === 0) {
      window.playerStats.hasTriggeredExactChange = true;
    }
    if (typeof window.updateUI === "function") window.updateUI();
    return true;
  },
};

// Legacy Compatibility Aliases to protect references
window.gainXp = (amount, isOffline) =>
  window.GameState.gainXp(amount, isOffline);
window.addCoins = (amount) => window.GameState.addCoins(amount);
window.spendCoins = (amount) => window.GameState.spendCoins(amount);

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
  if (!window.playerStats.achievementTimestamps)
    window.playerStats.achievementTimestamps = {};

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
      window.playerStats.achievementTimestamps =
        window.playerStats.achievementTimestamps || {};
      window.playerStats.achievementTimestamps[ach.id] = Date.now();
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

// --- CORE STATS RESOLVER WITH CACHING ---
window.cachedPlayerStats = null;
window.playerStatsDirty = true;

window.invalidatePlayerStats = function () {
  window.playerStatsDirty = true;
};

window.resolvePlayerStats = function (useDraft = false) {
  if (!useDraft && !window.playerStatsDirty && window.cachedPlayerStats) {
    return window.cachedPlayerStats;
  }

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
    arcaneBarrier: 0.0,
    xpRate: 1.0,
  };

  // Passive cumulative title multipliers applied prior to other calculations
  if (window.playerStats.unlockedTitles) {
    window.playerStats.unlockedTitles.forEach((tKey) => {
      let tData = window.TITLES_DATA[tKey];
      if (tData && tData.stats) {
        for (let sKey in tData.stats) {
          if (p[sKey] !== undefined) {
            p[sKey] += tData.stats[sKey];
          }
        }
      }
    });
  }

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

  let paragonLevel = window.playerStats.paragonLevel || 0;
  let paragonMult = 1.0 + paragonLevel * 0.005; // Compounding +0.5% attributes per Paragon Level

  achStrPct *= paragonMult;
  achDexPct *= paragonMult;
  achIntPct *= paragonMult;

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
  eligibleSetSlots.forEach((slot) => {
    let item = window.equippedSlots[slot];
    if (item) {
      let setName = window.getItemSetName(item);
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

  p.atk = Math.floor(p.atk * (1.0 + itemAtkPct));
  p.maxHp = Math.floor(p.maxHp * (1.0 + itemHpPct));
  p.def = Math.ceil(flatDef * (defMultiplier + itemDefPct) * achDefPct);
  p.moveSpeed = p.moveSpeed * (achMoveSpeedPct + itemSpdPct);

  // Apply Cavern Sigil Active Modifiers (Dungeon Mode)
  if (
    window.playerStats.isDungeonMode &&
    window.playerStats.activeDungeonSigil
  ) {
    let activeSig = window.playerStats.activeDungeonSigil;
    p.qly += activeSig.qualityBoost || 0;

    // Loop and apply the sigil's buffs and debuffs
    activeSig.buffs.forEach((b) => {
      if (b.id === "swift_strikes") {
        p.idleAttackSpeed = Math.max(10, Math.round(p.idleAttackSpeed / 1.25));
        p.activeAttackSpeed = Math.max(
          4,
          Math.round(p.activeAttackSpeed / 1.25),
        );
      } else if (b.id === "giant_might") {
        p.atk = Math.floor(p.atk * 1.3);
      } else if (b.id === "iron_aegis") {
        p.def = Math.floor(p.def * 1.35);
      } else if (b.id === "vital_fountain") {
        p.maxHp = Math.floor(p.maxHp * 1.4);
      } else if (b.id === "unstable_surge") {
        p.critChance += 0.15;
      } else if (b.id === "shatter_frenzy") {
        p.critDamage += 0.5;
      } else if (b.id === "deflection_vortex") {
        p.block += 0.1;
        p.parry += 0.1;
      } else if (b.id === "arcane_infusion") {
        p.arcaneBarrier = Math.min(0.5, p.arcaneBarrier + 0.15);
      } else if (b.id === "treasure_finder") {
        p.gold += 0.5;
      } else if (b.id === "lucky_winds") {
        p.fairySpawn += 0.4;
      } else if (b.id === "void_call") {
        p.rareSpawn += 0.5;
      } else if (b.id === "scavenger_insight") {
        p.drop += 0.5;
      } else if (b.id === "artisan_luck") {
        p.qly += 0.25;
      }
    });

    activeSig.debuffs.forEach((d) => {
      if (d.id === "iron_gaze") {
        p.idleAttackSpeed = Math.round(p.idleAttackSpeed * 1.2);
        p.activeAttackSpeed = Math.round(p.activeAttackSpeed * 1.2);
      } else if (d.id === "shattered_armour") {
        p.def = Math.floor(p.def * 0.75);
      } else if (d.id === "frail_vessel") {
        p.maxHp = Math.floor(p.maxHp * 0.8);
      } else if (d.id === "dull_blades") {
        p.atk = Math.floor(p.atk * 0.8);
      } else if (d.id === "heavy_mist") {
        p.moveSpeed = Math.max(1.0, p.moveSpeed * 0.7);
      } else if (d.id === "blind_spot") {
        p.critChance = Math.max(0.0, p.critChance - 0.1);
      } else if (d.id === "feeble_mind") {
        p.arcaneBarrier = 0.0;
      } else if (d.id === "curse_greed") {
        p.gold = Math.max(0.1, p.gold - 0.4);
      } else if (d.id === "lead_boots") {
        p.block = Math.max(0.0, p.block - 0.08);
        p.parry = Math.max(0.0, p.parry - 0.08);
      }
    });
  }

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

  // UNIQUE: Warp-Core Greaves "Time Dilation" Boss Kill Max Haste trigger
  if (
    window.equippedSlots.boots &&
    window.equippedSlots.boots.isUniqueWarpCore &&
    window.playerStats.warpCoreSprintTimer > 0
  ) {
    p.idleAttackSpeed = 10;
    p.activeAttackSpeed = 4;
  }

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

  // Apply diminishing returns to raw accumulated Rare Spawn rates to prevent key hyper-inflation
  let rawRare = p.rareSpawn;
  let limit = window.checkArtifactTrait("void_pull") ? 0.1 : 0.075; // 7.5% base cap, 10.0% elevated with Void Core
  let excessRare = Math.max(0, rawRare - 0.01);
  let scale = limit - 0.01;
  p.rareSpawn = 0.01 + (excessRare * scale) / (excessRare + scale);

  p.atk = Math.floor(p.atk);
  p.maxHp = Math.floor(p.maxHp);
  p.def = Math.floor(p.def);
  p.moveSpeed = parseFloat(p.moveSpeed.toFixed(1));

  // Set default targets required
  window.playerStats.targetsRequired = 5;

  // UNIQUE: Warp-Core Greaves "Time Dilation" missing health attack speed scaling
  if (
    window.equippedSlots.boots &&
    window.equippedSlots.boots.isUniqueWarpCore &&
    window.mob &&
    window.mob.hp > 0
  ) {
    let hpPct = window.mob.hp / window.mob.maxHp;
    let missingHpPct = 1.0 - hpPct;
    let speedBonus = Math.min(0.99, missingHpPct); // up to +99% speed
    idleSpeedPct += speedBonus;
    activeSpeedPct += speedBonus;
  }

  // UNIQUE: Maelstrom Gale-Glaive "Tornado Alley" speed stacking
  if (window.playerStats.maelstromSpeedTimer > 0) {
    window.playerStats.maelstromSpeedTimer--;
    if (window.playerStats.maelstromSpeedTimer <= 0) {
      window.playerStats.maelstromSpeedStacks = 0;
    }
  }
  if (window.playerStats.maelstromSpeedStacks > 0) {
    idleSpeedPct += window.playerStats.maelstromSpeedStacks * 0.1;
    activeSpeedPct += window.playerStats.maelstromSpeedStacks * 0.1;
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

  let prestigeExpBonus = (window.playerStats.prestigeUpgrades?.exp || 0) * 0.1;
  p.xpRate += prestigeExpBonus;

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

  // Centralized real-time XP rate multiplier calculation
  let expBonusMult =
    1.0 + (window.playerStats.prestigeUpgrades?.exp || 0) * 0.1;

  // Add Aetheric Wisdom Clan Skill passive XP rate multiplier
  let wisdom = Math.min(
    30,
    window.playerStats.clanSkills?.aetheric_wisdom || 0,
  );
  expBonusMult += wisdom * 0.01;

  if (
    window.equippedSlots.subweapon &&
    window.equippedSlots.subweapon.isUniqueChronicle &&
    !window.playerStats.isDungeonMode &&
    !window.playerStats.isCrucibleMode
  ) {
    let historicalPeakLvl =
      window.playerStats.historicalPeakLvl || window.playerStats.level;
    if (window.playerStats.level < Math.floor(historicalPeakLvl * 0.75)) {
      expBonusMult += 2.0;
    }
  }
  if (window.playerStats.unlockedAchievements && window.AchievementsData) {
    window.playerStats.unlockedAchievements.forEach((id) => {
      let ach = window.AchievementsData.find((a) => a.id === id);
      if (ach && ach.stats && ach.stats.expPct) {
        expBonusMult += ach.stats.expPct;
      }
    });
  }
  if (window.playerStats.xpPotionTimer > 0) {
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

    expBonusMult +=
      (window.playerStats.xpPotionStrength || 1.0) * potStrengthMultiplier;
  }
  p.xpRate = parseFloat(expBonusMult.toFixed(2));

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
  let missionHpMult =
    1.0 + (window.playerStats.missionUpgrades?.hp || 0) * 0.03;

  p.atk = Math.floor(p.atk * prestigeAtkMult * missionAtkMult);
  p.maxHp = Math.floor(p.maxHp * prestigeHpMult * missionHpMult);
  p.def = Math.floor(p.def * prestigeDefMult);

  // Apply Crucible Active Run Modifiers
  if (
    window.playerStats.isCrucibleMode &&
    window.playerStats.crucibleActiveBuff
  ) {
    let b = window.playerStats.crucibleActiveBuff;
    let d = window.playerStats.crucibleActiveDebuff;
    let isBuffInfused = window.playerStats.crucibleInfusedType === "buff";
    let isDebuffInfused = window.playerStats.crucibleInfusedType === "debuff";

    let buffStrength = isBuffInfused ? 1.5 : 1.0;
    let debuffStrength = isDebuffInfused ? 1.5 : 1.0;

    // 1. Apply Buffs
    if (b.id === "swift_strikes") {
      p.idleAttackSpeed = Math.max(
        10,
        Math.round(p.idleAttackSpeed / (1.0 + 0.25 * buffStrength)),
      );
      p.activeAttackSpeed = Math.max(
        4,
        Math.round(p.activeAttackSpeed / (1.0 + 0.25 * buffStrength)),
      );
    } else if (b.id === "giant_might") {
      p.atk = Math.floor(p.atk * (1.0 + 0.3 * buffStrength));
    } else if (b.id === "iron_aegis") {
      p.def = Math.floor(p.def * (1.0 + 0.35 * buffStrength));
    } else if (b.id === "vital_fountain") {
      p.maxHp = Math.floor(p.maxHp * (1.0 + 0.4 * buffStrength));
    } else if (b.id === "unstable_surge") {
      p.critChance += 0.15 * buffStrength;
    } else if (b.id === "shatter_frenzy") {
      p.critDamage += 0.5 * buffStrength;
    } else if (b.id === "deflection_vortex") {
      p.block += 0.1 * buffStrength;
      p.parry += 0.1 * buffStrength;
    } else if (b.id === "arcane_infusion") {
      p.arcaneBarrier = Math.min(0.5, p.arcaneBarrier + 0.15 * buffStrength);
    } else if (b.id === "treasure_finder") {
      p.gold += 0.5 * buffStrength;
    } else if (b.id === "lucky_winds") {
      p.fairySpawn += 0.4 * buffStrength;
    } else if (b.id === "void_call") {
      p.rareSpawn += 0.5 * buffStrength;
    } else if (b.id === "scavenger_insight") {
      p.drop += 0.5 * buffStrength;
    } else if (b.id === "artisan_luck") {
      p.qly += 0.25 * buffStrength;
    }

    // 2. Apply Debuffs
    if (d.id === "iron_gaze") {
      p.idleAttackSpeed = Math.round(
        p.idleAttackSpeed * (1.0 + 0.2 * debuffStrength),
      );
      p.activeAttackSpeed = Math.round(
        p.activeAttackSpeed * (1.0 + 0.2 * debuffStrength),
      );
    } else if (d.id === "shattered_armour") {
      p.def = Math.floor(p.def * Math.max(0.1, 1.0 - 0.25 * debuffStrength));
    } else if (d.id === "frail_vessel") {
      p.maxHp = Math.floor(p.maxHp * Math.max(0.1, 1.0 - 0.2 * debuffStrength));
    } else if (d.id === "dull_blades") {
      p.atk = Math.floor(p.atk * Math.max(0.1, 1.0 - 0.2 * debuffStrength));
    } else if (d.id === "heavy_mist") {
      p.moveSpeed = Math.max(
        1.0,
        p.moveSpeed * Math.max(0.1, 1.0 - 0.3 * debuffStrength),
      );
    } else if (d.id === "blind_spot") {
      p.critChance = Math.max(0.0, p.critChance - 0.1 * debuffStrength);
    } else if (d.id === "feeble_mind") {
      p.arcaneBarrier = 0.0;
    } else if (d.id === "curse_greed") {
      p.gold = Math.max(0.1, p.gold - 0.4 * debuffStrength);
    } else if (d.id === "lead_boots") {
      p.block = Math.max(0.0, p.block - 0.08 * debuffStrength);
      p.parry = Math.max(0.0, p.parry - 0.08 * debuffStrength);
    }
  }

  // Apply Shared Cooperative Clan Skill Multipliers
  let phalanx = Math.min(50, window.playerStats.clanSkills?.steel_phalanx || 0);
  let well = Math.min(50, window.playerStats.clanSkills?.vitality_well || 0);
  let accord = Math.min(
    30,
    window.playerStats.clanSkills?.prosperity_accord || 0,
  );
  let guidance = Math.min(
    30,
    window.playerStats.clanSkills?.voyagers_guidance || 0,
  );

  p.atk = Math.floor(p.atk * (1.0 + phalanx * 0.005));
  p.def = Math.floor(p.def * (1.0 + phalanx * 0.005));
  p.maxHp = Math.floor(p.maxHp * (1.0 + well * 0.008));
  p.gold += accord * 0.01;
  p.drop += guidance * 0.005;
  p.qly += guidance * 0.005;

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

  if (!useDraft) {
    window.cachedPlayerStats = p;
    window.playerStatsDirty = false;
  }

  return p;
};

// --- INITIAL GLOBAL STATE ---

window.playerStats = {
  level: 1,
  xp: 0,
  xpReq: 100,
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
  dungeonKeys: 5,
  nextDungeonKeyTime: 0,
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
  ecoMode:
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent,
    ),
  fairiesClicked: 0,
  deathCount: 0,
  lootPityCounter: 0,
  dungeonPeaks: { equip: 1, gold: 1, mat: 1 },
  currentDungeonStage: { equip: 1, gold: 1, mat: 1 },
  astralShards: 0,
  crucibleWave: 1,
  cruciblePeak: 1,
  crucibleRunActive: false,
  crucibleAccumulatedShards: 0,
  crucibleAccumulatedCores: 0,
  crucibleActiveBuff: null,
  crucibleActiveDebuff: null,
  crucibleInfusedType: "none",
  crucibleLootMult: 1.0,
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
  pendingClanProgress: {
    kills: 0,
    rifts: 0,
    prestige: 0,
    dungeons: 0,
    fairies: 0,
    tempers: 0,
    reforges: 0,
    potions: 0,
    salvage: 0,
    crits: 0,
  },

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
  selectedPrestigeStage: 80,
  unlockedTitles: [],
  equippedTitle: null,
  achievementTimestamps: {},
  claimedMailIds: [],
  unlockedSkins: ["default"],
    equippedCostume: "knight",
    unlockedCostumes: ["knight"],
  playerName: "Guest",
  clanId: null,
  clanName: null,
  clanEmblem: null,
  clanSkills: {
    steel_phalanx: 0,
    vitality_well: 0,
    prosperity_accord: 0,
    voyagers_guidance: 0,
    aetheric_wisdom: 0,
    clan_supply_depot: 0,
  },
  clanContribution: 0,
  paragonLevel: 0,
};

// Initialize the QuestSystem namespace and define generateDailyMissions
window.QuestSystem = {
  generateDailyMissions() {
    let pool = [
      {
        type: "kills",
        label: "Slay monsters",
        targetBase: 300,
        unit: "monsters",
      },
      {
        type: "rares",
        label: "Slay rare spawns",
        targetBase: 5,
        unit: "rares",
      },
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
        treat: "Daily Reward Sack",
        treatQty: 1,
        completed: false,
        claimed: false,
      };
    });
  },
};

// Legacy Compatibility Aliases to protect cross-file references
window.generateDailyMissions = () => window.QuestSystem.generateDailyMissions();

// Append generateWeeklyMissions inside window.QuestSystem
Object.assign(window.QuestSystem, {
  generateWeeklyMissions() {
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
        treat: "Weekly Reward Sack",
        treatQty: 1,
        completed: false,
        claimed: false,
      };
    });
  },
});

// Legacy Compatibility Aliases to protect references
window.generateWeeklyMissions = () =>
  window.QuestSystem.generateWeeklyMissions();

// Append checkAndResetMissions inside window.QuestSystem
Object.assign(window.QuestSystem, {
  checkAndResetMissions() {
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
      this.generateDailyMissions();
      window.playerStats.lastDailyResetDayStr = currentDayStr;
      window.playerStats.lastDailyResetTime = now;
      window.playerStats.dailyRewardClaimed = false;
      window.playerStats.dailyRerollsDone = 0; // Reset active re-roll tracker daily
      if (typeof window.pushLog === "function")
        window.pushLog(
          "<span style='color:#2ecc71; font-weight:bold;'>📅 [SYSTEM] Clan Daily Board refreshed! Reset at 12:00 AM PST/PDT. Complete at least 5 for a grand treat!</span>",
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
              this.generateWeeklyMissions();
              window.playerStats.lastWeeklyResetMondayStr = lastMondayStr;
              window.playerStats.lastWeeklyResetTime = now;
              window.playerStats.weeklyRewardClaimed = false;

              // Add this line below:
              window.playerStats.weeklyClanCrateClaimed = false;

              if (typeof window.pushLog === "function")
                window.pushLog(
                  "<span style='color:#9b59b6; font-weight:bold;'>📅 [SYSTEM] Clan Weekly Board refreshed!</span>",
                );
            }
    } else {
      window.playerStats.weeklyMissions = [];
    }
  },
});

// Legacy Compatibility Aliases to protect references
window.checkAndResetMissions = () => window.QuestSystem.checkAndResetMissions();

// Append progressMission inside window.QuestSystem
Object.assign(window.QuestSystem, {
  progressMission(type, amount) {
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
  },
});

// Legacy Compatibility Aliases to protect references
window.progressMission = (type, amount) =>
  window.QuestSystem.progressMission(type, amount);

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
window.state = {
  autoAttack: true,
  efficiency: 1.0,
  currentSubTab: "EQUIP",
  currentActivitiesSubTab: "DUNGEONS",
};
window.isGamePaused = false;
window.isCloudSynced = false;
window.reviveTimer = 0;
window.deathAnimationTimer = 0;
window.deathMaxFrames = 90;
window.lastUpdateTime = Date.now();
window.sessionStartTime = Date.now();
window.respawnIntervalId = null;
window.recalculateXpRequirement = function() {
    window.playerStats.xpReq = Math.floor(
        100 * Math.pow(1.2, window.playerStats.level - 1)
    );
};
