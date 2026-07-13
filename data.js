/* ==========================================================================
   PRIMARY PURPOSE: Stores global game state, constant dictionaries,
   initial global state, and system utility functions.
   ========================================================================= */

window.GAME_VERSION = 0.99; // Pre-release Alpha 0.9.9 // Increment this whenever you push a new release

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

window.uiIconSvgCache = window.uiIconSvgCache || {};

window.getUiIconSvg = function (key, size = 12) {
  let cacheKey = `${key}_${size}`;
  if (window.uiIconSvgCache[cacheKey] !== undefined) {
    return window.uiIconSvgCache[cacheKey];
  }
  let icon = window.AssetCatalog.uiIcons[key];
  if (!icon) {
    window.uiIconSvgCache[cacheKey] = "";
    return "";
  }
  let svg = `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="${icon.color}" fill-opacity="${icon.opacity}" stroke="${icon.color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle; transform: translateY(-1.5px); line-height: 1; margin-right: 3px;">${icon.path}</svg>`;
  window.uiIconSvgCache[cacheKey] = svg;
  return svg;
};

// --- SYSTEM UTILS ---

window.getEffectiveStage = function (stage) {
  let s = Number(stage);
  if (isNaN(s) || s < 1) s = 1;
  // Smoothed, continuously dampening sub-exponential transition post-100 to avoid sudden cliffs
  return s <= 100 ? s : 100 + Math.pow(s - 100, 0.7) * 1.5;
};

function getCardTier(count) {
  let thresholds = window.CARD_UPGRADE_THRESHOLDS || [1, 25, 50, 150, 300, 750];
  let t = -1;
  for (let idx = 0; idx < thresholds.length; idx++) {
    if (count >= thresholds[idx]) t = idx;
    else break;
  }
  return t;
}
window.getCardTier = getCardTier;

function getCardValue(base, tier) {
  if (tier < 0) return 0;
  return base * (1 + 0.6 * tier);
}
window.getCardValue = getCardValue;

function getUtilityCardValue(tier) {
  if (tier < 0) return 0;
  const rates = [0.02, 0.04, 0.06, 0.08, 0.11, 0.15];
  return rates[tier] || 0;
}
window.getUtilityCardValue = getUtilityCardValue;

// High-performance arbitrary-precision scientific notation library for infinite scalability
class BigNum {
  constructor(m = 0, e = 0) {
    this.m = m;
    this.e = e;
    this.normalize();
  }

  normalize() {
    if (this.m === 0) {
      this.e = 0;
      return this;
    }
    let absM = Math.abs(this.m);
    if (absM >= 10) {
      let shift = Math.floor(Math.log10(absM));
      this.m /= Math.pow(10, shift);
      this.e += shift;
    } else if (absM < 1) {
      let shift = Math.floor(Math.log10(absM));
      this.m /= Math.pow(10, shift);
      this.e += shift;
    }
    // Prevent floating-point precision drift
    this.m = Math.round(this.m * 1e12) / 1e12;
    if (this.m === 0) this.e = 0;
    return this;
  }

  static from(val) {
    if (val instanceof BigNum) return val;
    if (
      val &&
      typeof val === "object" &&
      val.m !== undefined &&
      val.e !== undefined
    ) {
      return new BigNum(val.m, val.e);
    }
    if (typeof val === "number") return BigNum.fromNumber(val);
    if (typeof val === "string") {
      let parts = val.toLowerCase().split("e");
      if (parts.length === 2) {
        return new BigNum(parseFloat(parts[0]), parseInt(parts[1], 10));
      }
      return BigNum.fromNumber(parseFloat(val));
    }
    return new BigNum(0, 0);
  }

  static fromNumber(num) {
    if (num === 0 || isNaN(num) || !isFinite(num)) return new BigNum(0, 0);
    let e = Math.floor(Math.log10(Math.abs(num)));
    let m = num / Math.pow(10, e);
    return new BigNum(m, e);
  }

  add(other) {
    let b = BigNum.from(other);
    if (this.m === 0) return b;
    if (b.m === 0) return this;

    let diff = this.e - b.e;
    if (diff >= 15) return this; // Other is too small to affect this
    if (diff <= -15) return b; // This is too small to affect other

    let newM = this.m + b.m * Math.pow(10, -diff);
    return new BigNum(newM, this.e);
  }

  sub(other) {
    let b = BigNum.from(other);
    if (this.m === 0) return new BigNum(-b.m, b.e);
    if (b.m === 0) return this;

    let diff = this.e - b.e;
    if (diff >= 15) return this;
    if (diff <= -15) return new BigNum(-b.m, b.e);

    let newM = this.m - b.m * Math.pow(10, -diff);
    return new BigNum(newM, this.e);
  }

  mul(other) {
    let b = BigNum.from(other);
    return new BigNum(this.m * b.m, this.e + b.e);
  }

  div(other) {
    let b = BigNum.from(other);
    if (b.m === 0) throw new Error("Division by zero in BigNum");
    return new BigNum(this.m / b.m, this.e - b.e);
  }

  // Fast binary exponentiation for infinite scale exponents
  pow(power) {
    let p = Math.floor(power);
    if (p < 0)
      throw new Error("Negative powers not supported in lightweight BigNum");
    let result = new BigNum(1, 0);
    let base = this;
    while (p > 0) {
      if (p % 2 === 1) result = result.mul(base);
      base = base.mul(base);
      p = Math.floor(p / 2);
    }
    return result;
  }

  compareTo(other) {
    let b = BigNum.from(other);
    // Both are zero
    if (this.m === 0 && b.m === 0) return 0;
    // Signs are different
    if (this.m > 0 && b.m <= 0) return 1;
    if (this.m < 0 && b.m >= 0) return -1;
    if (this.m === 0) {
      return b.m > 0 ? -1 : 1;
    }
    if (b.m === 0) {
      return this.m > 0 ? 1 : -1;
    }

    // Both are positive
    if (this.m > 0 && b.m > 0) {
      if (this.e !== b.e) return this.e > b.e ? 1 : -1;
      if (this.m !== b.m) return this.m > b.m ? 1 : -1;
      return 0;
    }

    // Both are negative (larger exponent means more negative, hence smaller)
    if (this.m < 0 && b.m < 0) {
      if (this.e !== b.e) return this.e > b.e ? -1 : 1;
      if (this.m !== b.m) return this.m > b.m ? 1 : -1;
      return 0;
    }
    return 0;
  }

  gt(other) {
    return this.compareTo(other) > 0;
  }
  gte(other) {
    return this.compareTo(other) >= 0;
  }
  lt(other) {
    return this.compareTo(other) < 0;
  }
  lte(other) {
    return this.compareTo(other) <= 0;
  }
  eq(other) {
    return this.compareTo(other) === 0;
  }
}

window.BigNum = BigNum;

window.formatNumber = function (val) {
  if (val === null || val === undefined) return "0";
  let b = BigNum.from(val);
  if (b.m === 0) return "0";

  // Format small values directly
  if (b.e < 3) {
    let num = b.m * Math.pow(10, b.e);
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

  let i = Math.floor(b.e / 3);
  let rem = b.e % 3;
  let displayVal = b.m * Math.pow(10, rem);

  if (i < standardSuffixes.length) {
    return `${displayVal.toFixed(2)} ${standardSuffixes[i]}`;
  }

  // Alphabetical suffix generator (aa - zz, then aaa - zzz)
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
  suffix = suffix.toUpperCase();

  return `${displayVal.toFixed(2)} ${suffix}`;
};

window.randInt = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min;
window.randFloat = (min, max) => Math.random() * (max - min) + min;

window.rarityProbCache = window.rarityProbCache || {};

// Universal Normalized Weight-Based Rarity Probability Solver
window.calculateRarityProbabilities = function (qly, isGacha = false) {
  let cacheKey = `${qly}_${isGacha}`;
  if (window.rarityProbCache[cacheKey]) {
    return window.rarityProbCache[cacheKey];
  }

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
  let result = weights.map((w) => (w / totalWeight) * 100);
  window.rarityProbCache[cacheKey] = result;
  return result;
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
    let amt = BigNum.from(amount);
    if (amt.lte(0)) return;

    let p = window.resolvePlayerStats();
    let finalAmount = amt.mul(p.xpRate || 1.0);
    window.playerStats.xp = BigNum.from(window.playerStats.xp || 0).add(
      finalAmount,
    );
    let leveledUp = false;

    let xp = BigNum.from(window.playerStats.xp);
    let xpReq = BigNum.from(window.playerStats.xpReq || 100);

    // Process potential consecutive level-ups via a loop (important for offline catch-up)
    while (xp.gte(xpReq)) {
      xp = xp.sub(xpReq);
      window.playerStats.level++;
      window.playerStats.sp += 6; // Award 6 Skill Points per level up

      // Calculate next xpReq safely using BigNum exponential power scaling
      xpReq = BigNum.from(100).mul(
        BigNum.from(1.2).pow(window.playerStats.level - 1),
      );
      leveledUp = true;
    }

    if (leveledUp) {
      window.playerStats.xp = xp;
      window.playerStats.xpReq = xpReq;

      // Keep active UI Attribute Matrix draft allocations in sync
      if (window.draftAllocations !== null) {
        window.draftSP += 6; // Keep draft in sync with the 6 SP per level up
      }
    }

    window.triggerLevelUpEffect = function () {
      let heroX = window.hero.x + 12;
      let heroY = window.hero.y + 15;
      // Explode 60 golden particles in a ring
      for (let i = 0; i < 60; i++) {
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
          gravity: 0.1,
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
            `<strong style="color:#d946ef;">🎉 LEVEL UP! Reached Level ${window.playerStats.level}! (+6 SP)</strong>`,
          );
        }
        if (typeof window.pushHeaderToast === "function") {
          window.pushHeaderToast(
            `🎉 Level Up! Reached Level ${window.playerStats.level}! (+6 SP)`,
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
    let amt = BigNum.from(amount);
    if (amt.lte(0)) return;
    window.playerStats.coins = BigNum.from(window.playerStats.coins).add(amt);
    window.playerStats.totalGoldEarned = BigNum.from(
      window.playerStats.totalGoldEarned || 0,
    ).add(amt);
    if (typeof window.updateUI === "function") window.updateUI();
  },

  spendCoins(amount) {
    let amt = BigNum.from(amount);
    if (amt.lte(0)) return false;
    let coins = BigNum.from(window.playerStats.coins);
    if (coins.lt(amt)) return false;
    window.playerStats.coins = coins.sub(amt);
    if (window.playerStats.coins.eq(0)) {
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
    if (ach.id === "sing_phoenix_rising")
      return window.playerStats.hasTriggeredPhoenixRising ? 1 : 0;
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
    if (ach.id === "sing_night_owl")
      return window.playerStats.hasTriggeredNightOwl ? 1 : 0;
    if (ach.id === "sing_early_bird")
      return window.playerStats.hasTriggeredEarlyBird ? 1 : 0;
    if (ach.id === "sing_coffee_run")
      return window.playerStats.hasTriggeredCoffeeRun ? 1 : 0;
    if (ach.id === "sing_high_noon") {
      let hr = new Date().getHours();
      return hr >= 12 && hr < 13 && window.playerStats.hasTriggeredHighNoon
        ? 1
        : 0;
    }
    if (ach.id === "sing_witching_hour") {
      let hr = new Date().getHours();
      return hr >= 3 && hr < 4 && window.playerStats.hasTriggeredWitchingHour
        ? 1
        : 0;
    }
    if (ach.id === "sing_weekend_warrior")
      return window.playerStats.hasTriggeredWeekendWarrior ? 1 : 0;
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
    let isUnlocked = false;
    if (progress instanceof BigNum) {
      isUnlocked = progress.gte(targetValue);
    } else {
      isUnlocked = progress >= targetValue;
    }
    if (isUnlocked) {
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

window.isCavernEffectActive = function (id) {
  if (window.playerStats.isDungeonMode && window.playerStats.activeDungeonSigil) {
    let sig = window.playerStats.activeDungeonSigil;
    if (sig.buffs && sig.buffs.some(b => b.id === id)) return true;
    if (sig.debuffs && sig.debuffs.some(d => d.id === id)) return true;
  }
  if (window.playerStats.isCrucibleMode) {
    if (window.playerStats.crucibleActiveBuff && window.playerStats.crucibleActiveBuff.id === id) return true;
    if (window.playerStats.crucibleActiveDebuff && window.playerStats.crucibleActiveDebuff.id === id) return true;
  }
  return false;
};

window.checkArtifactTrait = function (trait) {
  if (!window.equippedSlots) return false;
  return (
    (window.equippedSlots.art1 && window.equippedSlots.art1.trait === trait) ||
    (window.equippedSlots.art2 && window.equippedSlots.art2.trait === trait) ||
    (window.equippedSlots.art3 && window.equippedSlots.art3.trait === trait)
  );
};

window.getArtifactTemperLevel = function (trait) {
  if (!window.equippedSlots) return 0;
  if (window.equippedSlots.art1 && window.equippedSlots.art1.trait === trait)
    return window.equippedSlots.art1.temperLevel || 0;
  if (window.equippedSlots.art2 && window.equippedSlots.art2.trait === trait)
    return window.equippedSlots.art2.temperLevel || 0;
  if (window.equippedSlots.art3 && window.equippedSlots.art3.trait === trait)
    return window.equippedSlots.art3.temperLevel || 0;
  return 0;
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
    crucibleSelfDmgReduction: 1.0,
    crucibleCritHeal: 0.0,
    crucibleEchoChance: 0.0,
    crucibleCapBonus: 0.0,
    crucibleShardMult: 1.0,
    crucibleSpellChanceBonus: 0.0,
    crucibleDaggerBleed: 0,
  };

  // Secure Local Slot Bonus Matrix to prevent runaway persistent state compounding
  p.crucibleSlotBonuses = {
    weapon: 0,
    subweapon: 0,
    helmet: 0,
    chest: 0,
    leggings: 0,
    overall: 0,
    boots: 0,
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

  // Apply active run-only Crucible Draft deck modifiers
  if (
    window.playerStats.isCrucibleMode &&
    window.playerStats.crucibleDraftDeck
  ) {
    window.playerStats.crucibleDraftDeck.forEach((cardId) => {
      let card = window.CRUCIBLE_DRAFT_POOL.find((c) => c.id === cardId);
      if (card) card.apply(p);
    });
  }

  for (let key in window.equippedSlots) {
    let item = window.equippedSlots[key];
    if (item) {
      let slotLvl =
        (window.playerStats.slotUpgrades &&
          window.playerStats.slotUpgrades[key]) ||
        0;
      let runBonus =
        (window.playerStats.isCrucibleMode &&
          p.crucibleSlotBonuses &&
          p.crucibleSlotBonuses[key]) ||
        0;
      let slotMult = 1.0 + slotLvl * 0.01 + runBonus;

      p.atk += (item.atk || 0) * slotMult;
      p.maxHp += (item.maxHp || 0) * slotMult;
      p.moveSpeed += (item.moveSpeed || 0) * slotMult;

      let itemIdleSpeed = item.idleAttackSpeed || 0;
      if (itemIdleSpeed < 0) itemIdleSpeed = Math.abs(itemIdleSpeed) * 0.05;
      idleSpeedPct += itemIdleSpeed * slotMult;

      let itemActiveSpeed = item.activeAttackSpeed || 0;
      if (itemActiveSpeed < 0)
        itemActiveSpeed = Math.abs(itemActiveSpeed) * 0.05;
      activeSpeedPct += itemActiveSpeed * slotMult;

      p.drop += (item.dropRate || 0) * slotMult;
      p.qly += (item.quality || 0) * slotMult;
      p.gold += (item.goldMulti || 0) * slotMult;
      p.critChance += (item.critChance || 0) * slotMult;
      p.critDamage += (item.critDamage || 0) * slotMult;
      p.block += (item.block || 0) * slotMult;
      p.parry += (item.parry || 0) * slotMult;
      p.str += (item.str || 0) * slotMult;
      p.dex += (item.dex || 0) * slotMult;
      p.int += (item.int || 0) * slotMult;
      p.rareSpawn += (item.rareSpawn || 0) * slotMult;
      p.fairySpawn += (item.fairySpawn || 0) * slotMult;

      if (item.atkPct) itemAtkPct += item.atkPct * slotMult;
      if (item.maxHpPct) itemHpPct += item.maxHpPct * slotMult;
      if (item.defPct) itemDefPct += item.defPct * slotMult;
      if (item.moveSpeedPct) itemSpdPct += item.moveSpeedPct * slotMult;
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

  // --- BESTIARY Album SYSTEM RESOLUTION ---
  let cardsOwned = window.playerStats.monsterCards || {};

  // 1. Process Individual Card Stat Additions
  let activeCardsCounts = {};
  for (let cKey in window.MONSTER_CARDS_DATA) {
    let cData = window.MONSTER_CARDS_DATA[cKey];
    let count = cardsOwned[cKey] || 0;
    let tier = window.getCardTier(count);
    activeCardsCounts[cKey] = tier; // Cache for set checks

    if (tier >= 0) {
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

      if (cData.baseStat === "atk")
        p.atk += Math.floor(val * p.atk); // Scaled attack add
      else if (cData.baseStat === "maxHp") p.maxHp += Math.floor(val * p.maxHp);
      else if (cData.baseStat === "def") p.def += Math.floor(val * p.def);
      else if (cData.baseStat === "moveSpeed") p.moveSpeed += val;
      else if (cData.baseStat === "critChance") p.critChance += val;
      else if (cData.baseStat === "critDamage") p.critDamage += val;
      else if (cData.baseStat === "block") p.block += val;
      else if (cData.baseStat === "parry") p.parry += val;
      else if (cData.baseStat === "dropRate") p.drop += val;
      else if (cData.baseStat === "quality") p.qly += val;
      else if (cData.baseStat === "goldMulti") p.gold += val;
      else if (cData.baseStat === "rareSpawn") p.rareSpawn += val;
      else if (cData.baseStat === "int") p.int += Math.floor(val);
      else if (cData.baseStat === "xpRate") p.xpRate += val;
    }
  }

  // 2. Process Progressive Set Multipliers
  let attributesMult = 1.0;
  for (let sKey in window.CARD_SETS_DATA) {
    let sData = window.CARD_SETS_DATA[sKey];
    let minTierInSet = 5;
    let anyLocked = false;
    let minCopiesInSet = 999999;

    sData.cards.forEach((cKey) => {
      let count = cardsOwned[cKey] || 0;
      if (count < minCopiesInSet) minCopiesInSet = count;

      let tier =
        activeCardsCounts[cKey] !== undefined ? activeCardsCounts[cKey] : -1;
      if (tier < 0) anyLocked = true;
      if (tier < minTierInSet) minTierInSet = tier;
    });

    // Set Bonus requires at least 10 copies of each card in the set to activate
    if (minCopiesInSet >= 10 && !anyLocked && minTierInSet >= 0) {
      // Set Level Progression: Unlocked = 20%, Rare = 35%, Magic = 50%, Epic = 65%, Legendary = 80%, Mythic = 100%
      const setMultipliers = [0.2, 0.35, 0.5, 0.65, 0.8, 1.0];
      let bonusPct = setMultipliers[minTierInSet] || 0.2;

      if (sData.statKey === "xpRate") p.xpRate += bonusPct;
      else if (sData.statKey === "atkPctBonus") achAtkPct += bonusPct;
      else if (sData.statKey === "defPctBonus") achDefPct += bonusPct;
      else if (sData.statKey === "maxHpPctBonus") achMaxHpPct += bonusPct;
      else if (sData.statKey === "qly") p.qly += bonusPct;
      else if (sData.statKey === "attributesMult") attributesMult += bonusPct;
    }
  }

  // Apply Core Attributes Set Multiplier
  if (attributesMult > 1.0) {
    p.str = Math.floor(p.str * attributesMult);
    p.dex = Math.floor(p.dex * attributesMult);
    p.int = Math.floor(p.int * attributesMult);
  }

  p.atk = Math.floor(p.atk);
  p.maxHp = Math.floor(p.maxHp);
  p.def = Math.floor(p.def);
  p.moveSpeed = parseFloat(p.moveSpeed.toFixed(1));

  p.str = Math.floor(p.str * achStrPct);
  p.dex = Math.floor(p.dex * achDexPct);
  p.int = Math.floor(p.int * achIntPct);

  let effectiveStr = Math.max(0, p.str - 5);
  let effectiveDex = Math.max(0, p.dex - 5);
  let effectiveInt = Math.max(0, p.int - 5);

  // Nerfed to 0.1% per point (Option A)
  itemAtkPct += effectiveStr * 0.001;
  itemHpPct += effectiveStr * 0.001;
  // INT scaling defense has been removed

  // DEX scaling curves brought in line (Crit Chance capped at +10% from stats, Crit damage at 0.1% per point, Speed capped at +5.0)
  p.critChance += parseFloat(
    ((effectiveDex * 0.1) / (effectiveDex + 250)).toFixed(4),
  );
  p.critDamage += effectiveDex * 0.001;
  p.moveSpeed += parseFloat(
    ((effectiveDex * 5.0) / (effectiveDex + 150)).toFixed(1),
  );

  // INT scaling curves brought in line (Avoidance capped at +5%, Fairy spawn at 0.01% per point)
  let logInt = Math.log10(effectiveInt + 1);
  p.block += parseFloat((0.05 * (1 - 1 / (1 + 0.15 * logInt))).toFixed(4));
  p.parry += parseFloat((0.05 * (1 - 1 / (1 + 0.15 * logInt))).toFixed(4));
  p.fairySpawn += parseFloat((effectiveInt * 0.0001).toFixed(4));

  let flatDef =
    window.playerStats.baseDef + alloc.spDef * 4 + aT.def + setCtx.flatDefBonus;
  let defMultiplier = 1.0 + setCtx.defPctBonus;

  for (let key in window.equippedSlots) {
    let item = window.equippedSlots[key];
    if (item) {
      let slotLvl =
        (window.playerStats.slotUpgrades &&
          window.playerStats.slotUpgrades[key]) ||
        0;
      let slotMult = 1.0 + slotLvl * 0.01;
      flatDef += (item.def || 0) * slotMult;
      if (["chest", "leggings", "overall", "helmet"].includes(item.type)) {
        let stars = item.statsRolled === "UNIQUE" ? 5 : item.statsRolled || 0;
        defMultiplier += stars * 0.03 + slotLvl * 0.01;
      }
    }
  }

  const hasSubweapon = !!window.equippedSlots.subweapon;
  const subType = window.equippedSlots.subweapon
    ? window.equippedSlots.subweapon.subType
    : null;
  let maxBlockCap = 0.0;
  let maxParryCap = window.checkArtifactTrait("titan_grip") ? 0.18 : 0.15;

  // Apply run-only Block/Parry cap expansions
  if (p.crucibleCapBonus) {
    maxParryCap += p.crucibleCapBonus;
  }

  if (hasSubweapon) {
          if (subType === "shield") {
            let shield = window.equippedSlots.subweapon;
            let shieldStars =
              shield.statsRolled === "UNIQUE" ? 5 : shield.statsRolled || 0;
            let subLvl =
              (window.playerStats.slotUpgrades &&
                window.playerStats.slotUpgrades.subweapon) ||
              0;
            defMultiplier += 0.12 + shieldStars * 0.02 + subLvl * 0.01;
            maxBlockCap = window.checkArtifactTrait("titan_grip") ? 0.25 : 0.2;
            if (p.crucibleCapBonus) maxBlockCap += p.crucibleCapBonus;
            p.block += 0.05; // Base 5% block rate for equipping a Shield
            p.parry = 0.0; // STRICT: Can't parry with a shield
          } else if (subType === "tome") {
            let intScale = Math.max(0, p.int - 5);
            let logIntScale = Math.log10(intScale + 1);
            // Caps the Arcane Barrier at 25% max (20% base + 5% scaling limit)
            p.arcaneBarrier = parseFloat(
              (0.2 + 0.05 * (1 - 1 / (1 + 0.15 * logIntScale))).toFixed(4),
            );
            p.block = 0.0; // STRICT: Can't block with a tome
            p.parry = 0.0; // STRICT: Can't parry with a tome
          } else if (subType === "dagger") {
            maxParryCap = window.checkArtifactTrait("titan_grip") ? 0.3 : 0.25;
            if (p.crucibleCapBonus) maxParryCap += p.crucibleCapBonus;
            p.parry += 0.05; // Base 5% parry rate for equipping a Dagger
            p.block = 0.0; // STRICT: Can't block with a dagger
          }
        } else {
    p.block = 0.0; // STRICT: Can't block without subweapon
    p.parry = 0.0; // STRICT: Can't parry without subweapon
  }

  p.atk = Math.floor(p.atk * (1.0 + itemAtkPct) * achAtkPct);
  p.maxHp = Math.floor(p.maxHp * (1.0 + itemHpPct) * achMaxHpPct);
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

    // Skip debuffs if protected by Purified Aegis
    if (!(window.playerStats.purifiedAegisTimer > 0)) {
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

  // Apply compounding Aetheric Spark modifiers / Astral Awakening state multiplier
    if (window.playerStats.astralAwakeningTimer > 0) {
      p.atk = Math.floor(p.atk * 2.0); // +100% Total Damage
      activeSpeedPct += 0.15; // +15% Active Atk Spd
      idleSpeedPct += 0.15; // +15% Idle Atk Spd
    } else if (window.playerStats.sparkChainCount > 0) {
      p.atk = Math.floor(p.atk * (1.0 + window.playerStats.sparkChainCount * 0.10)); // +10% damage per chain link
    }

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

  // Addive Double Drop and Drop Quality checks
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

  // Set default targets required based on current active gameplay mode
  if (!window.playerStats.isCrucibleMode && !window.playerStats.isDungeonMode) {
    window.playerStats.targetsRequired = 5;
  } else if (window.playerStats.isCrucibleMode) {
    window.playerStats.targetsRequired = 3; // Exactly 3 enemies per wave in the Crucible!
  } else if (window.playerStats.isDungeonMode) {
    window.playerStats.targetsRequired = 5; // Standard 5 for Infinite Caverns
  }

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

  // Deduct active attack speed per active Anomalous Shard (Apathy Distortion)
  let activeShardsList = window.activeRiftOrbs
    ? window.activeRiftOrbs.filter((orb) => orb.type === "anomalous_shard")
    : [];
  if (activeShardsList.length > 0) {
    activeSpeedPct -= activeShardsList.length * 0.1;
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
    let d =
      window.playerStats.purifiedAegisTimer > 0
        ? null
        : window.playerStats.crucibleActiveDebuff;
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
    if (d) {
      if (d.id === "iron_gaze") {
        p.idleAttackSpeed = Math.round(
          p.idleAttackSpeed * (1.0 + 0.2 * debuffStrength),
        );
      } else if (d.id === "shattered_armour") {
        p.def = Math.floor(p.def * Math.max(0.1, 1.0 - 0.25 * debuffStrength));
      } else if (d.id === "frail_vessel") {
        p.maxHp = Math.floor(
          p.maxHp * Math.max(0.1, 1.0 - 0.2 * debuffStrength),
        );
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

  // Hyperbolic soft cap on the Drop Rate bonus to prevent infinite late-game inventory overflow
  let rawDropBonus = p.drop - 1.0;
  if (rawDropBonus > 1.0) {
    let softCapLimit = 4.0; // Absolute maximum bonus is +400% (5.0x drop multiplier)
    p.drop =
      1.0 +
      1.0 +
      ((rawDropBonus - 1.0) * softCapLimit) /
        (rawDropBonus - 1.0 + softCapLimit);
  }

  window.playerStats.crucibleSelfDmgReduction = p.crucibleSelfDmgReduction;

  if (!useDraft) {
    window.cachedPlayerStats = p;
    window.playerStatsDirty = false;
  }

  return p;
};

// --- INITIAL GLOBAL STATE ---

window.CRUCIBLE_DRAFT_POOL = [
  {
    id: "overcharge",
    name: "Overcharge",
    desc: "+20% Crit Multiplier, +2.5% Crit Chance",
    apply: (p) => {
      p.critDamage = (p.critDamage || 0) + 0.2;
      p.critChance = (p.critChance || 0) + 0.025;
    },
  },
  {
    id: "sanguine_tide",
    name: "Sanguine Tide",
    desc: "Heal 1.5% Max HP on every Critical Strike hit",
    apply: (p) => {
      p.crucibleCritHeal = (p.crucibleCritHeal || 0) + 0.015;
    },
  },
  {
    id: "phantom_echo",
    name: "Phantom Echo",
    desc: "+15% chance to trigger secondary Phantom Strike (deals 35% damage)",
    apply: (p) => {
      p.crucibleEchoChance = (p.crucibleEchoChance || 0) + 0.15;
    },
  },
  {
    id: "titans_wall",
    name: "Titan's Wall",
    desc: "+8% base armor and +3% Block/Parry cap limits",
    apply: (p) => {
      p.defPctBonus = (p.defPctBonus || 0) + 0.08;
      p.crucibleCapBonus = (p.crucibleCapBonus || 0) + 0.03;
    },
  },
  {
    id: "temporal_accel",
    name: "Temporal Acceleration",
    desc: "+15% Active & Idle Attack Speed multipliers",
    apply: (p) => {
      p.activeSpeedPct = (p.activeSpeedPct || 0) + 0.15;
      p.idleSpeedPct = (p.idleSpeedPct || 0) + 0.15;
    },
  },
  {
    id: "astral_attune",
    name: "Astral Attunement",
    desc: "Earn +25% Astral Shards from this run",
    apply: (p) => {
      p.crucibleShardMult = (p.crucibleShardMult || 1.0) + 0.25;
    },
  },
  {
    id: "slot_weapon",
    name: "Bladesmith's Touch",
    desc: "+15% to all stats of the equipped Weapon slot for this run",
    apply: (p) => {
      p.crucibleSlotBonuses.weapon = (p.crucibleSlotBonuses.weapon || 0) + 0.15;
    },
  },
  {
    id: "slot_subweapon",
    name: "Aegis Convergence",
    desc: "+15% to all stats of the equipped Subweapon (Offhand) slot for this run",
    apply: (p) => {
      p.crucibleSlotBonuses.subweapon =
        (p.crucibleSlotBonuses.subweapon || 0) + 0.15;
    },
  },
  {
    id: "slot_helmet",
    name: "Crown Alignment",
    desc: "+15% to all stats of the equipped Helmet slot for this run",
    apply: (p) => {
      p.crucibleSlotBonuses.helmet = (p.crucibleSlotBonuses.helmet || 0) + 0.15;
    },
  },
  {
    id: "slot_torso",
    name: "Fortress Plate",
    desc: "+15% to all stats of equipped Chest and Overall slots for this run",
    apply: (p) => {
      p.crucibleSlotBonuses.chest = (p.crucibleSlotBonuses.chest || 0) + 0.15;
      p.crucibleSlotBonuses.overall =
        (p.crucibleSlotBonuses.overall || 0) + 0.15;
    },
  },
  {
    id: "slot_leggings",
    name: "Reinforced Chausses",
    desc: "+15% to all stats of the equipped Leggings slot for this run",
    apply: (p) => {
      p.crucibleSlotBonuses.leggings =
        (p.crucibleSlotBonuses.leggings || 0) + 0.15;
    },
  },
  {
    id: "slot_boots",
    name: "Mercury Wings",
    desc: "+15% to all stats of the equipped Boots slot for this run",
    apply: (p) => {
      p.crucibleSlotBonuses.boots = (p.crucibleSlotBonuses.boots || 0) + 0.15;
    },
  },
  {
    id: "aegis_bastion",
    name: "Stalwart Bastion",
    desc: "+3% Block & Parry Rate, and +5% Max HP. HP bonus is doubled (+10% total) if wielding a Shield.",
    apply: (p) => {
      p.block = (p.block || 0) + 0.03;
      p.parry = (p.parry || 0) + 0.03;
      let hpBonus =
        window.equippedSlots.subweapon?.subType === "shield" ? 0.1 : 0.05;
      p.maxHpPctBonus = (p.maxHpPctBonus || 0) + hpBonus;
    },
  },
  {
    id: "poison_tip",
    name: "Viper's Precision",
    desc: "+4% Crit Chance. Your critical hits apply 1 stack of Sanguine Bleed. Applied stacks are doubled to 2 if wielding a Dagger.",
    apply: (p) => {
      p.critChance = (p.critChance || 0) + 0.04;
      let bleedAmt =
        window.equippedSlots.subweapon?.subType === "dagger" ? 2 : 1;
      p.crucibleDaggerBleed = (p.crucibleDaggerBleed || 0) + bleedAmt;
    },
  },
  {
    id: "catalyst_resonance",
    name: "Aetheric Focus",
    desc: "+8% Spell & Tome damage. Wielding a Tome also increases Arcane Barrier absorption by +5% and extends barrier caps.",
    apply: (p) => {
      p.crucibleSpellChanceBonus = (p.crucibleSpellChanceBonus || 0) + 0.08;
      if (window.equippedSlots.subweapon?.subType === "tome") {
        p.arcaneBarrier = (p.arcaneBarrier || 0) + 0.05;
      }
    },
  },
];

window.playerStats = {
  slotUpgrades: {
    weapon: 0,
    subweapon: 0,
    helmet: 0,
    chest: 0,
    leggings: 0,
    overall: 0,
    boots: 0,
    art1: 0,
    art2: 0,
    art3: 0,
  },
  crucibleAccumulatedGold: 0,
  crucibleAccumulatedXp: 0,
  crucibleDraftDeck: [],
  hasRefundedLegacyTempers: false,
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
  coins: new BigNum(0, 0),
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
  hasTriggeredNightOwl: false,
  hasTriggeredEarlyBird: false,
  hasTriggeredCoffeeRun: false,
  hasTriggeredWeekendWarrior: false,
  hasTriggeredPhoenixRising: false,
  hasTriggeredPerfectDeflection: false,
  hasTriggeredWitchingHour: false,
  hasTriggeredTimeCapsule: false,
  hasTriggeredAethericRecharge: false,
  hasClickedThisBattle: false,
  damageTakenThisBattle: 0,
  ankhTriggeredThisBattle: false,
  purifiedAegisTimer: 0,
              apathyDecayStacks: 0,
              apathyDecayTimer: 0,
              astralAwakeningTimer: 0,
              sparkChainCount: 0,
              dailyMissions: [],
              weeklyMissions: [],
  monsterCards: {},
  astralDust: 0,
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
  totalGoldEarned: new BigNum(0, 0),
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
window.inventory = { EQUIP: [], ARTIFACT: [], SIGIL: [], ETC: {}, USE: {} };
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
window.activeRiftOrbs = [];
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
window.recalculateXpRequirement = function () {
  window.playerStats.xpReq = BigNum.from(100).mul(
    BigNum.from(1.2).pow(window.playerStats.level - 1),
  );
};
