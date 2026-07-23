/* ==========================================================================
   PRIMARY PURPOSE: Stores global game state, constant dictionaries,
   initial global state, and system utility functions.
   ========================================================================= */

window.GAME_VERSION = 1.0; // Release Version 1.0.00
window.MIN_COMPATIBLE_VERSION = 1.0; // Hard reset epoch threshold

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

window.getMilestoneMultiplier = function (level) {
  let milestones = Math.floor(level / 10);
  // Asymptotic square-root scaling dampens late-game stat inflation while preserving milestone achievements
  return 1.0 + Math.sqrt(milestones) * 0.25;
};

window.calculateRenownForStageRange = function (fromStage, toStage) {
  if (toStage <= fromStage) return 0;
  let start = Math.max(0, fromStage);
  let end = toStage;
  let delta = end - start;
  if (delta > 2000) {
    const F = (s) => 5 * s + 1.25 * Math.pow(s, 1.6);
    return Math.max(1, Math.floor(F(end) - F(start)));
  } else {
    let total = 0;
    for (let s = start + 1; s <= end; s++) {
      total += Math.max(1, Math.floor(5 + 2 * Math.pow(s, 0.6)));
    }
    return total;
  }
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

  valueOf() {
    return this.m * Math.pow(10, this.e);
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
    return `${displayVal.toFixed(2)}${standardSuffixes[i]}`;
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

  return `${displayVal.toFixed(2)}${suffix}`;
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
window.GameState = window.GameState || {};
Object.assign(window.GameState, {
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

      // Initialize maxLevel safety fallback
      window.playerStats.maxLevel = Math.max(
        window.playerStats.maxLevel || 1,
        window.playerStats.level - 1,
      );

      if (window.playerStats.level > window.playerStats.maxLevel) {
        window.playerStats.maxLevel = window.playerStats.level;
        window.playerStats.sp += 6; // Only award SP if we exceed our lifetime peak level!

        // Keep active UI Attribute Matrix draft allocations in sync with each consecutive level-up
        if (window.draftAllocations !== null) {
          window.draftSP += 6;
        }
      }

      // Calculate next xpReq safely using BigNum exponential power scaling
      xpReq = BigNum.from(350).mul(
        BigNum.from(1.45).pow(window.playerStats.level - 1),
      );
      leveledUp = true;
    }

    if (leveledUp) {
      window.playerStats.xp = xp;
      window.playerStats.xpReq = xpReq;
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

      // Check if they reached Level 13 for the first time to trigger Clan Hall Unlock
      if (
        window.playerStats.level >= 13 &&
        !window.playerStats.hasTriggeredLevel13Unlock
      ) {
        window.playerStats.hasTriggeredLevel13Unlock = true;
        setTimeout(() => {
          if (typeof window.playGlobalUnlockAnimation === "function") {
            window.playGlobalUnlockAnimation("CLAN HALL UNLOCKED", "🏛️", () => {
              if (typeof window.toggleMenuHub === "function") {
                window.toggleMenuHub(); // Pop open the Hub so the padlock shatters right over the locked button!
              }
            });
          }
        }, 1500);
      }

      // Check if they reached Level 25 for the first time to trigger Rift Altar Unlock
      if (
        window.playerStats.level >= 25 &&
        !window.playerStats.hasTriggeredLevel25Unlock
      ) {
        window.playerStats.hasTriggeredLevel25Unlock = true;
        setTimeout(() => {
          if (typeof window.playGlobalUnlockAnimation === "function") {
            window.playGlobalUnlockAnimation(
              "RIFT ALTAR UNLOCKED",
              "🔮",
              () => {
                if (typeof window.switchTab === "function") {
                  window.switchTab("activities");
                }
              },
            );
          }
        }, 1500); // Trigger shortly after the level-up flash settles
      }

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
      // Evaluate tutorial triggers immediately after level-up animations/sounds settle
      setTimeout(() => {
        if (window.HoorTutorial) {
          window.HoorTutorial.checkTriggers();
        }
      }, 1000);
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
});

// Legacy Compatibility Aliases to protect references
window.gainXp = (amount, isOffline) =>
  window.GameState.gainXp(amount, isOffline);
window.addCoins = (amount) => window.GameState.addCoins(amount);
window.spendCoins = (amount) => window.GameState.spendCoins(amount);

window.absorbGoldParticle = function (amount, isDungeon, isCrucible) {
  let amt = BigNum.from(amount);
  if (amt.lte(0)) return;

  if (isCrucible) {
    window.playerStats.crucibleAccumulatedGold =
      (window.playerStats.crucibleAccumulatedGold || 0) + amount;
  } else {
    window.playerStats.coins = BigNum.from(window.playerStats.coins).add(amt);
    window.playerStats.totalGoldEarned = BigNum.from(
      window.playerStats.totalGoldEarned || 0,
    ).add(amt);

    if (isDungeon) {
      window.playerStats.dungeonAccumulatedGold =
        (window.playerStats.dungeonAccumulatedGold || 0) + amount;
    }

    if (window.playerStats.runGold !== undefined) {
      window.playerStats.runGold += amount;
    }

    if (typeof window.progressMission === "function") {
      window.progressMission("gold", amount);
    }
  }

  if (typeof window.updateUI === "function") {
    window.updateUI();
  }
};

window.getAchievementProgress = function (ach) {
  if (ach.reqType === "kills")
    return window.playerStats.totalLifetimeKills || 0;
  if (ach.reqType === "gold") return window.playerStats.coins || 0;
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
    if (ach.id === "sing_murphys_law") {
      let slots = Object.values(window.playerStats.slotUpgrades || {});
      return slots.some((lvl) => lvl >= 50) ? 1 : 0;
    }
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
    if (ach.id === "sing_unfortunate_soul") {
      let slots = Object.values(window.playerStats.slotUpgrades || {});
      return slots.length >= 10 && slots.every((lvl) => lvl >= 15) ? 1 : 0;
    }
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
      window.playerStats.currentHp = window.playerStats.currentHp.gt(p.maxHp)
        ? p.maxHp
        : window.playerStats.currentHp;
      window.updateUI();
      if (typeof window.renderInventory === "function")
        window.renderInventory();
      if (typeof window.saveGame === "function") window.saveGame();
    }
  }
};

window.isCavernEffectActive = function (id) {
  if (
    window.playerStats.isDungeonMode &&
    window.playerStats.activeDungeonSigil
  ) {
    let sig = window.playerStats.activeDungeonSigil;
    if (sig.buffs && sig.buffs.some((b) => b.id === id)) return true;
    if (sig.debuffs && sig.debuffs.some((d) => d.id === id)) return true;
  }
  if (window.playerStats.isCrucibleMode) {
    if (
      window.playerStats.crucibleActiveBuff &&
      window.playerStats.crucibleActiveBuff.id === id
    )
      return true;
    if (
      window.playerStats.crucibleActiveDebuff &&
      window.playerStats.crucibleActiveDebuff.id === id
    )
      return true;
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

window.hasUniquePassive = function (uniqueKey) {
  if (
    window.playerStats &&
    window.playerStats.activeSpectralResonance === uniqueKey
  )
    return true;
  if (!window.equippedSlots) return false;

  switch (uniqueKey) {
    case "weapon_staff":
      return !!(
        window.equippedSlots.weapon && window.equippedSlots.weapon.isUniqueStaff
      );
    case "weapon_sword":
      return !!(
        window.equippedSlots.weapon && window.equippedSlots.weapon.isUniqueSword
      );
    case "weapon_singularity":
      return !!(
        window.equippedSlots.weapon &&
        window.equippedSlots.weapon.isUniqueSingularity
      );
    case "weapon_maelstrom":
      return !!(
        window.equippedSlots.weapon &&
        window.equippedSlots.weapon.isUniqueMaelstrom
      );
    case "shield_aegis":
      return !!(
        window.equippedSlots.subweapon &&
        window.equippedSlots.subweapon.isUniqueAegis
      );
    case "tome_watch":
      return !!(
        window.equippedSlots.subweapon &&
        window.equippedSlots.subweapon.isUniqueWatch
      );
    case "tome_chronicle":
      return !!(
        window.equippedSlots.subweapon &&
        window.equippedSlots.subweapon.isUniqueChronicle
      );
    case "boots_warpcore":
      return !!(
        window.equippedSlots.boots &&
        window.equippedSlots.boots.isUniqueWarpCore
      );
    case "helmet_tempest":
      return !!(
        window.equippedSlots.helmet &&
        window.equippedSlots.helmet.isUniqueTempest
      );
    case "dagger_viper":
      return !!(
        window.equippedSlots.subweapon &&
        window.equippedSlots.subweapon.isUniqueViper
      );
    case "tome_conduit":
      return !!(
        window.equippedSlots.subweapon &&
        window.equippedSlots.subweapon.isUniqueConduit
      );
    default:
      return false;
  }
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
  if (stars === "UNIQUE") return "Astral Essence";
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
      atk: BigNum.from(0),
      maxHp: BigNum.from(0),
      def: BigNum.from(0),
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
      activeSpeedPct: 0,
      idleSpeedPct: 0,
      atkPct: 0,
      maxHpPct: 0,
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
    ring1: 0,
    ring2: 0,
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

  p.def = BigNum.from(p.def).add(aT.def);
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

  let flatGearAtk = BigNum.from(0);
    let flatGearHp = BigNum.from(0);
    let flatGearDef = BigNum.from(0);
    let itemAtkPct = 0;
    let itemHpPct = 0;
    let itemDefPct = 0;
    let itemSpdPct = 0;
    let itemStrPct = 0;
    let itemDexPct = 0;
    let itemIntPct = 0;
    let idleSpeedPct = 0.0 + (aT.idleSpeedPct || 0) + (p.idleSpeedPct || 0);
    let activeSpeedPct = 0.0 + (aT.activeSpeedPct || 0) + (p.activeSpeedPct || 0);

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

      // Flat base additions from Forge Slot Attunements (completely level-independent!)
      if (key === "weapon") flatGearAtk = flatGearAtk.add(slotLvl * 15);
      if (key === "chest" || key === "leggings" || key === "overall") {
        flatGearHp = flatGearHp.add(slotLvl * 50);
        flatGearDef = flatGearDef.add(slotLvl * 10);
      }
      if (key === "ring1" || key === "ring2") {
        flatGearAtk = flatGearAtk.add(slotLvl * 10);
        flatGearHp = flatGearHp.add(slotLvl * 30);
      }
      if (key === "boots") {
        p.moveSpeed += slotLvl * 2;
      }

      // Flat item stats (safely handled regardless of source type)
      flatGearAtk = flatGearAtk.add(BigNum.from(item.atk || 0).mul(slotMult));
      flatGearHp = flatGearHp.add(BigNum.from(item.maxHp || 0).mul(slotMult));
      flatGearDef = flatGearDef.add(BigNum.from(item.def || 0).mul(slotMult));
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
      if (item.strPct) itemStrPct += item.strPct * slotMult;
      if (item.dexPct) itemDexPct += item.dexPct * slotMult;
      if (item.intPct) itemIntPct += item.intPct * slotMult;

      // Commented out to prevent flat-to-percentage double-dipping in late game
      // itemAtkPct += (BigNum.from(item.bonusAtk || 0).div(100).mul(slotMult).valueOf());
      // itemHpPct += (BigNum.from(item.bonusMaxHp || 0).div(100).mul(slotMult).valueOf());
      // itemDefPct += (BigNum.from(item.bonusDef || 0).div(100).mul(slotMult).valueOf());
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

  p.atk = p.atk.add(BigNum.from(setCtx.atk));
  p.maxHp = p.maxHp.add(BigNum.from(setCtx.maxHp));
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
  achDefPct += setCtx.defPctBonus;

  p.str = Math.floor(p.str * achStrPct);
  p.dex = Math.floor(p.dex * achDexPct);
  p.int = Math.floor(p.int * achIntPct);

  let effectiveStr = Math.max(0, p.str - 5);
  let effectiveDex = Math.max(0, p.dex - 5);
  let effectiveInt = Math.max(0, p.int - 5);

  // --- CALCULATE SECURE EXPONENTIAL CHARACTER-BOUND BASE STATS ---
  let levelScale = BigNum.from(1.025).pow(window.playerStats.level - 1);
  let baseCharAtk = BigNum.from(10 + window.playerStats.level * 2)
    .mul(levelScale)
    .add(p.str * 5 + p.dex * 2 + p.int * 1);
  let baseCharHp = BigNum.from(100 + window.playerStats.level * 8)
    .mul(levelScale)
    .add(p.str * 15);
  let baseCharDef = BigNum.from(5 + window.playerStats.level * 1)
    .mul(levelScale)
    .add(p.int * 3);

  p.atk = baseCharAtk.add(flatGearAtk);
  p.maxHp = baseCharHp.add(flatGearHp);
  let flatTotalDef = baseCharDef
    .add(flatGearDef)
    .add(BigNum.from(setCtx.flatDefBonus));

  // Suffixes multipliers applied on total flat base
  p.atk = p.atk.mul(1.0 + itemAtkPct).mul(achAtkPct);
  p.maxHp = p.maxHp.mul(1.0 + itemHpPct).mul(achMaxHpPct);
  p.moveSpeed =
    p.moveSpeed *
    (achMoveSpeedPct + itemSpdPct + (setCtx.moveSpeedPctBonus || 0));

  // Calculate Arcane Barrier for Inspected Player holding a Tome
  let insSub = window.equippedSlots.subweapon;
  if (insSub && insSub.subType === "tome") {
    let insEffInt = Math.max(0, p.int - 5);
    let insIntBonus = Math.min(0.15, (insEffInt * 0.15) / (insEffInt + 150));
    p.arcaneBarrier = 0.2 + insIntBonus;
  }

  let defMultiplier = 1.0 + setCtx.defPctBonus;
  for (let key in window.equippedSlots) {
    let item = window.equippedSlots[key];
    if (
      item &&
      ["chest", "leggings", "overall", "helmet"].includes(item.type)
    ) {
      let slotLvl =
        (window.playerStats.slotUpgrades &&
          window.playerStats.slotUpgrades[key]) ||
        0;
      let stars = item.statsRolled === "UNIQUE" ? 5 : item.statsRolled || 0;
      defMultiplier += stars * 0.03 + slotLvl * 0.01;
    }
  }
  p.def = flatTotalDef.mul(defMultiplier + itemDefPct).mul(achDefPct);

  // Apply Cavern Sigil Active Modifiers (Dungeon Mode)
  if (
    window.playerStats.isDungeonMode &&
    window.playerStats.activeDungeonSigil
  ) {
    let activeSig = window.playerStats.activeDungeonSigil;
    p.qly += activeSig.qualityBoost || 0;
    p.gold += activeSig.rewardMultiplier || 0;
    p.drop += activeSig.rewardMultiplier || 0;

    activeSig.buffs.forEach((b) => {
      if (b.id === "swift_strikes") {
        p.idleAttackSpeed = Math.max(10, Math.round(p.idleAttackSpeed / 1.25));
        p.activeAttackSpeed = Math.max(
          4,
          Math.round(p.activeAttackSpeed / 1.25),
        );
      } else if (b.id === "giant_might") {
        p.atk = p.atk.mul(1.3);
      } else if (b.id === "iron_aegis") {
        p.def = p.def.mul(1.35);
      } else if (b.id === "vital_fountain") {
        p.maxHp = p.maxHp.mul(1.4);
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

    if (!(window.playerStats.purifiedAegisTimer > 0)) {
      activeSig.debuffs.forEach((d) => {
        if (d.id === "iron_gaze") {
          p.idleAttackSpeed = Math.round(p.idleAttackSpeed * 1.2);
          p.activeAttackSpeed = Math.round(p.activeAttackSpeed * 1.2);
        } else if (d.id === "shattered_armour") {
          p.def = p.def.mul(0.75);
        } else if (d.id === "frail_vessel") {
          p.maxHp = p.maxHp.mul(0.8);
        } else if (d.id === "dull_blades") {
          p.atk = p.atk.mul(0.8);
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

  if (window.playerStats.astralAwakeningTimer > 0) {
    p.atk = p.atk.mul(2.0);
    activeSpeedPct += 0.15;
    idleSpeedPct += 0.15;
  } else if (window.playerStats.sparkChainCount > 0) {
    p.atk = p.atk.mul(1.0 + window.playerStats.sparkChainCount * 0.1);
  }

  if (window.playerStats.atkPotionTimer > 0)
    p.atk = p.atk.mul(
      1 + (window.playerStats.atkPotionStrength || 0.1) * potStrengthMultiplier,
    );
  if (window.playerStats.hpPotionTimer > 0)
    p.maxHp = p.maxHp.mul(
      1 + (window.playerStats.hpPotionStrength || 0.1) * potStrengthMultiplier,
    );
  if (window.playerStats.defPotionTimer > 0)
    p.def = p.def.mul(
      1 + (window.playerStats.defPotionStrength || 0.1) * potStrengthMultiplier,
    );

  if (window.playerStats.hastePotionTimer > 0) {
    let tier = window.playerStats.hastePotionStrength || 1;
    p.moveSpeed += Math.ceil(3 * tier * potStrengthMultiplier);
    activeSpeedPct += 0.1 * tier * potStrengthMultiplier;
    idleSpeedPct += 0.1 * tier * potStrengthMultiplier;
  }

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
    window.hasUniquePassive("tome_watch") &&
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

  if (
    window.hasUniquePassive("boots_warpcore") &&
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

  let maxBlockCap = 0.2;
  let maxParryCap = 0.15;

  let subItem = window.equippedSlots ? window.equippedSlots.subweapon : null;
  let hasShield = subItem && subItem.subType === "shield";
  let hasDagger = subItem && subItem.subType === "dagger";
  let hasTitanGrip =
    window.checkArtifactTrait && window.checkArtifactTrait("titan_grip");

  if (hasShield) {
    maxBlockCap = hasTitanGrip ? 0.25 : 0.2;
  } else if (hasTitanGrip) {
    maxBlockCap = 0.1;
  } else {
    p.block = 0.0;
  }

  if (hasDagger) {
    let noun = subItem.noun ? subItem.noun.toLowerCase() : "";
    if (noun.includes("main-gauche")) {
      maxParryCap = hasTitanGrip ? 0.35 : 0.3;
    } else {
      maxParryCap = hasTitanGrip ? 0.3 : 0.15;
    }
  } else if (hasTitanGrip) {
    maxParryCap = 0.08;
  } else {
    p.parry = 0.0;
  }

  maxBlockCap += p.crucibleCapBonus || 0;
  maxParryCap += p.crucibleCapBonus || 0;

  p.rawBlock = p.block;
  p.rawParry = p.parry;

  if (p.block > maxBlockCap) p.block = maxBlockCap;
  if (p.parry > maxParryCap) p.parry = maxParryCap;

  // Calculate Tome passive Arcane Barrier
  let hasTome = subItem && subItem.subType === "tome";
  if (hasTome) {
    // Base 20% absorption, scaling up to 35% with INT
    let intBonus = Math.min(0.15, (effectiveInt * 0.15) / (effectiveInt + 150));
    p.arcaneBarrier = 0.2 + intBonus;
  } else {
    p.arcaneBarrier = 0.0;
  }

  let rawRare = p.rareSpawn;
  let limit = window.checkArtifactTrait("void_pull") ? 0.1 : 0.075;
  let excessRare = Math.max(0, rawRare - 0.01);
  let scale = limit - 0.01;
  p.rareSpawn = 0.01 + (excessRare * scale) / (excessRare + scale);

  if (!window.playerStats.isCrucibleMode && !window.playerStats.isDungeonMode) {
    window.playerStats.targetsRequired = 3;
  } else if (window.playerStats.isCrucibleMode) {
    window.playerStats.targetsRequired = 3;
  } else if (window.playerStats.isDungeonMode) {
    window.playerStats.targetsRequired = 3;
  }

  if (
    window.hasUniquePassive("boots_warpcore") &&
    window.mob &&
    window.mob.hp > 0
  ) {
    let hpPct = window.mob.hp / window.mob.maxHp;
    let missingHpPct = 1.0 - hpPct;
    let speedBonus = Math.min(0.99, missingHpPct);
    idleSpeedPct += speedBonus;
    activeSpeedPct += speedBonus;
  }

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

  let activeShardsList = window.activeRiftOrbs
    ? window.activeRiftOrbs.filter((orb) => orb.type === "anomalous_shard")
    : [];
  if (activeShardsList.length > 0) {
    activeSpeedPct -= activeShardsList.length * 0.1;
  }

  if (
    window.hasUniquePassive("tome_chronicle") &&
    !window.playerStats.isDungeonMode &&
    !window.playerStats.isCrucibleMode
  ) {
    window.playerStats.bypassGearLockActive = true;
  } else {
    window.playerStats.bypassGearLockActive = false;
  }

  // Space Upgrades scaled with compounding milestones
  let globalLvl = window.playerStats.globalQLevel || 0;
  let effectiveGlobalLvl = globalLvl * window.getMilestoneMultiplier(globalLvl);
  p.drop += effectiveGlobalLvl * 0.01;
  p.qly += effectiveGlobalLvl * 0.01;

  let goldLvl = window.playerStats.prestigeUpgrades?.gold || 0;
  let prestigeGoldBonus =
    goldLvl * 0.25 * window.getMilestoneMultiplier(goldLvl);
  p.gold += prestigeGoldBonus;

  let dropLvl = window.playerStats.prestigeUpgrades?.drop || 0;
  let prestigeDropBonus =
    dropLvl * 0.05 * window.getMilestoneMultiplier(dropLvl);
  p.drop += prestigeDropBonus;

  let expLvl = window.playerStats.prestigeUpgrades?.exp || 0;
  let prestigeExpBonus = expLvl * 0.1 * window.getMilestoneMultiplier(expLvl);
  p.xpRate += prestigeExpBonus;

  let fairyLvl = window.playerStats.prestigeUpgrades?.fairy || 0;
  let prestigeFairyBonus =
    fairyLvl * 0.05 * window.getMilestoneMultiplier(fairyLvl);
  p.fairySpawn += prestigeFairyBonus;

  let missionGoldBonus = (window.playerStats.missionUpgrades?.gold || 0) * 0.05;
  p.gold += missionGoldBonus;

  if (window.playerStats.dropPotionTimer > 0) {
    p.drop += window.playerStats.dropPotionStrength || 1.0;
  }
  if (window.playerStats.qlyPotionTimer > 0) {
    p.qly += window.playerStats.qlyPotionStrength || 0.5;
  }

  let expBonusMult =
    1.0 + (window.playerStats.prestigeUpgrades?.exp || 0) * 0.1;

  let wisdom = Math.min(
    30,
    window.playerStats.clanSkills?.aetheric_wisdom || 0,
  );
  expBonusMult += wisdom * 0.01;

  if (
    window.hasUniquePassive("tome_chronicle") &&
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

  let attkLvl = window.playerStats.prestigeUpgrades?.atk || 0;
    let effectiveAtkLvl = attkLvl * window.getMilestoneMultiplier(attkLvl);
    let prestigeAtkMult = Math.pow(1.12, effectiveAtkLvl);

    let fortLvl = window.playerStats.prestigeUpgrades?.fort || 0;
    let effectiveFortLvl = fortLvl * window.getMilestoneMultiplier(fortLvl);
    let prestigeHpMult = Math.pow(1.1, effectiveFortLvl);
    let prestigeDefMult = Math.pow(1.05, effectiveFortLvl);

    let missionAtkMult =
      1.0 + (window.playerStats.missionUpgrades?.atk || 0) * 0.02;
    let missionHpMult =
      1.0 + (window.playerStats.missionUpgrades?.hp || 0) * 0.03;

    p.atk = p.atk.mul(prestigeAtkMult).mul(missionAtkMult).mul(1.0 + (p.atkPct || 0));
    p.maxHp = p.maxHp.mul(prestigeHpMult).mul(missionHpMult).mul(1.0 + (p.maxHpPct || 0));
  p.def = p.def.mul(prestigeDefMult);

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
      p.atk = p.atk.mul(1.0 + 0.3 * buffStrength);
    } else if (b.id === "iron_aegis") {
      p.def = p.def.mul(1.0 + 0.35 * buffStrength);
    } else if (b.id === "vital_fountain") {
      p.maxHp = p.maxHp.mul(1.0 + 0.4 * buffStrength);
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

    if (d) {
      if (d.id === "iron_gaze") {
        p.idleAttackSpeed = Math.round(
          p.idleAttackSpeed * (1.0 + 0.2 * debuffStrength),
        );
      } else if (d.id === "shattered_armour") {
        p.def = p.def.mul(Math.max(0.1, 1.0 - 0.25 * debuffStrength));
      } else if (d.id === "frail_vessel") {
        p.maxHp = p.maxHp.mul(Math.max(0.1, 1.0 - 0.2 * debuffStrength));
      } else if (d.id === "dull_blades") {
        p.atk = p.atk.mul(Math.max(0.1, 1.0 - 0.2 * debuffStrength));
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

  p.atk = p.atk.mul(1.0 + phalanx * 0.005);
  p.def = p.def.mul(1.0 + phalanx * 0.005);
  p.maxHp = p.maxHp.mul(1.0 + well * 0.008);
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

  let rawDropBonus = p.drop - 1.0;
  if (rawDropBonus > 1.0) {
    let softCapLimit = 4.0;
    p.drop =
      1.0 +
      1.0 +
      ((rawDropBonus - 1.0) * softCapLimit) /
        (rawDropBonus - 1.0 + softCapLimit);
  }

  let rawGoldBonus = p.gold - 1.0;
  if (rawGoldBonus > 4.0) {
    let softCapLimit = 12.0;
    p.gold =
      1.0 +
      4.0 +
      ((rawGoldBonus - 4.0) * softCapLimit) /
        (rawGoldBonus - 4.0 + softCapLimit);
  }

  let rawQlyBonus = p.qly - 1.0;
  if (rawQlyBonus > 2.0) {
    let softCapLimit = 3.0;
    p.qly =
      1.0 +
      2.0 +
      ((rawQlyBonus - 2.0) * softCapLimit) / (rawQlyBonus - 2.0 + softCapLimit);
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
  maxLevel: 1,
  lastDailyLoginDayStr: "",
  loginStreak: 0,
  loginClaimedToday: false,
  renown: 0,
  slotUpgrades: {
    weapon: 0,
    subweapon: 0,
    helmet: 0,
    chest: 0,
    leggings: 0,
    overall: 0,
    boots: 0,
    ring1: 0,
    ring2: 0,
    art1: 0,
    art2: 0,
    art3: 0,
  },
  crucibleAccumulatedGold: 0,
  crucibleAccumulatedXp: 0,
  crucibleDraftDeck: [],
  crucibleAccumulatedLoot: [],
  dungeonAccumulatedGold: 0,
  dungeonAccumulatedXp: 0,
  dungeonAccumulatedLoot: [],
  hasRefundedLegacyTempers: false,
  level: 1,
  xp: new BigNum(0, 0),
  xpReq: new BigNum(350, 0),
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
  currentHp: new BigNum(100, 0),
  coins: new BigNum(0, 0),
  stage: 1,
  maxStage: 1,
  killCount: 0,
  totalLifetimeKills: 0,
  targetsRequired: 3, // Reduced from 5 to 3 for snappier stage runs
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
  volumeMusic: 0.5,
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
    renown: 0,
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
  tutorialStep: 0,
  completedTutorialSteps: [],
  visitedTabs: [],
  visitedSubTabs: [],
  hasTriggeredLevel13Unlock: false,
  hasTriggeredLevel25Unlock: false,
  hasTriggeredPrestigeUnlock: false,
  equippedTitle: null,
  achievementTimestamps: {},
  claimedMailIds: [],
  unlockedSkins: ["default"],
  equippedCostume: "knight",
  unlockedCostumes: ["knight"],
  playerName: "Guest",
  clanId: null,
  audioSessionMode: "ambient",
  clanName: null,
  clanEmblem: null,
  clanLevel: 1,
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
  spectralCodex: [],
  activeSpectralResonance: null,
  projectSpectralCosmetic: true,
  totalGoldEarned: new BigNum(0, 0),
  showDpsOverlay: true,
  dpsOverlayX: null,
  dpsOverlayY: null,
  chatFloatingMode: false,
  chatX: null,
  chatY: null,
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
        label: "Attune equipment slots",
        targetBase: 1,
        unit: "slots",
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
        targetBase: 10, // Increased from 3
        unit: "guardians",
      },
      {
        type: "dungeons",
        label: "Ascend Dungeon floors",
        targetBase: 50, // Increased from 15
        unit: "floors",
      },
      {
        type: "gold",
        label: "Amass extreme wealth",
        targetBase: 150000, // Increased from 15000
        stageScale: true,
        unit: "Gold",
      },
      {
        type: "kills",
        label: "Execute massive purges",
        targetBase: 15000, // Increased from 1500
        unit: "enemies",
      },
      {
        type: "tempers",
        label: "Master slot attunement",
        targetBase: 40, // Increased from 15
        unit: "slots",
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
  ring1: null,
  ring2: null,
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
window.goldParticles = [];
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
  window.playerStats.xpReq = BigNum.from(350).mul(
    BigNum.from(1.45).pow(window.playerStats.level - 1),
  );
};
// Expose the manual boss rechallenge actuator to the DOM window
window.rechallengeBoss = function () {
  let p = window.resolvePlayerStats();
  window.playerStats.currentHp = p.maxHp;
  window.playerStats.isFarmingLoop = false;
  window.playerStats.isBossMode = false;
  window.playerStats.killCount = 0;
  window.mob = null;
  window.projectiles = [];
  window.hero.x = 40;
  if (typeof window.updateUI === "function") window.updateUI();
};
