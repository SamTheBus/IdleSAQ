/* ==========================================================================
   PRIMARY PURPOSE: Core Engine, Game Loop, Offline Progress, Save Integrity,
   and Developer Panel Command Routing.
   ========================================================================= */

let canvas, ctx;

// --- ECO MODE PROTOTYPE SHADOW INTERCEPTOR ---
(function () {
  const originalShadowBlurDescriptor = Object.getOwnPropertyDescriptor(
    CanvasRenderingContext2D.prototype,
    "shadowBlur",
  );
  if (originalShadowBlurDescriptor && originalShadowBlurDescriptor.set) {
    const originalSet = originalShadowBlurDescriptor.set;
    Object.defineProperty(CanvasRenderingContext2D.prototype, "shadowBlur", {
      set: function (value) {
        if (window.playerStats && window.playerStats.ecoMode) {
          originalSet.call(this, 0); // Forces shadow renders to 0 (disabled)
        } else {
          originalSet.call(this, value);
        }
      },
      get: originalShadowBlurDescriptor.get,
      configurable: true,
    });
  }
})();

// --- SCREEN WAKE LOCK API ---
window.wakeLockSentinel = null;
window.requestWakeLock = async function () {
  if ("wakeLock" in navigator) {
    try {
      window.wakeLockSentinel = await navigator.wakeLock.request("screen");
      console.log("🔋 Screen Wake Lock Active (Preventing Sleep)");
    } catch (err) {
      console.warn("Wake Lock request rejected or failed:", err);
    }
  }
};
window.releaseWakeLock = function () {
  if (window.wakeLockSentinel) {
    window.wakeLockSentinel.release().then(() => {
      window.wakeLockSentinel = null;
      console.log("🔋 Screen Wake Lock Released");
    });
  }
};

// Re-acquire lock dynamically when returning to focus tab
document.addEventListener("visibilitychange", async () => {
  if (document.visibilityState === "visible") {
    if (window.playerStats && !window.wakeLockSentinel) {
      await window.requestWakeLock();
    }
  } else {
    window.releaseWakeLock();
  }
});

// --- SYSTEM FUNCTIONS ---

window.SaveManager = {
  serverUrl: null,
  cloudSaveTimeoutId: null,

  init() {
    this.serverUrl = this.detectServer();
    window.GAME_SERVER_URL = this.serverUrl;
  },

  detectServer() {
    const isLocalHost =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";

    const useLiveCloudInLocalhost = true;

    if (isLocalHost && !useLiveCloudInLocalhost) {
      return "http://localhost:3000";
    }

    return "https://idlesaq-backend.onrender.com";
  },

  getUserId() {
    let uId = localStorage.getItem("idle_game_user_id");
    if (!uId) {
      uId =
        "guest_" +
        Math.random().toString(36).substring(2, 9) +
        Date.now().toString(36).substring(4);
      localStorage.setItem("idle_game_user_id", uId);
    }
    return uId;
  },

  save() {
    // 1. Log-Safe Garbage Collection: Prune unreferenced item details from frozenItemDb
    if (window.inventory && window.equippedSlots) {
      let activeIds = new Set();

      // Scan equipped slots
      for (let key in window.equippedSlots) {
        if (window.equippedSlots[key]) {
          activeIds.add(window.equippedSlots[key].id);
        }
      }
      // Scan backpack inventories
      if (window.inventory.EQUIP) {
        window.inventory.EQUIP.forEach((item) => {
          if (item) activeIds.add(item.id);
        });
      }
      if (window.inventory.ARTIFACT) {
        window.inventory.ARTIFACT.forEach((item) => {
          if (item) activeIds.add(item.id);
        });
      }
      // Scan gacha rolls history
      if (window.playerStats && window.playerStats.gachaHistory) {
        window.playerStats.gachaHistory.forEach((item) => {
          if (item) activeIds.add(item.id);
        });
      }
      // Scan active gacha showcase items to prevent garbage collection
      if (window.gachaShowcaseItems) {
        window.gachaShowcaseItems.forEach((item) => {
          if (item) activeIds.add(item.id);
        });
      }
      // Scan global recent pulls to protect their item IDs from garbage collection
      if (window.lastGachaRecentPullsData) {
        window.lastGachaRecentPullsData.forEach((pull) => {
          if (pull && pull.item) activeIds.add(pull.item.id);
        });
      }
      // Scan inspected player slots to prevent garbage collection while inspecting
      if (window.inspectedSlots) {
        for (let k in window.inspectedSlots) {
          if (window.inspectedSlots[k])
            activeIds.add(window.inspectedSlots[k].id);
        }
      }
      // Scan logs history to preserve tooltips for item links in chat/logs
      if (window.logsHistory) {
        window.logsHistory.forEach((logLine) => {
          let match;
          let regex = /showLogTooltip\(event,\s*(\d+)\)/g;
          while ((match = regex.exec(logLine)) !== null) {
            activeIds.add(parseInt(match[1], 10));
          }
          let regexInv = /showInventoryTooltip\(event,\s*(\d+)\)/g;
          while ((match = regexInv.exec(logLine)) !== null) {
            activeIds.add(parseInt(match[1], 10));
          }
        });
      }

      // Purge orphaned items
      if (window.frozenItemDb) {
        for (let id in window.frozenItemDb) {
          let numId = parseInt(id, 10);
          if (!activeIds.has(numId)) {
            delete window.frozenItemDb[id];
          }
        }
      }
    }

    let saveData = {
      playerStats: window.playerStats,
      equippedSlots: window.equippedSlots,
      inventory: window.inventory,
      idCounter: window.idCounter,
      logsHistory: window.logsHistory,
      frozenItemDb: window.frozenItemDb,
      lastSaveTime: window.lastUpdateTime,
    };

    const serializedData = JSON.stringify(saveData);

    // Save locally instantly using the new unified baseline key
    localStorage.setItem("idle_saq_save", serializedData);

    // Non-blocking 10s debounced cloud save backup to prevent server spam
    if (!this.serverUrl) return;

    if (this.cloudSaveTimeoutId) {
      clearTimeout(this.cloudSaveTimeoutId);
    }

    this.cloudSaveTimeoutId = setTimeout(() => {
      const userId = window.SaveManager.getUserId();
      if (typeof window.updateSyncStatus === "function") {
        window.updateSyncStatus("syncing");
      }
      fetch(`${window.SaveManager.serverUrl}/api/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, saveData }),
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.success) {
            console.log("☁️ Cloud Backup Successful!");
            if (data.clearPending && window.playerStats.pendingClanProgress) {
              for (let k in window.playerStats.pendingClanProgress) {
                window.playerStats.pendingClanProgress[k] = 0;
              }
            }
            if (typeof window.updateSyncStatus === "function") {
              window.updateSyncStatus("connected");
            }
          } else {
            console.warn("⚠️ Cloud Sync Warning:", data.error);
            if (typeof window.updateSyncStatus === "function") {
              window.updateSyncStatus("offline");
            }
          }
        })
        .catch((err) => {
          console.log(
            "📡 Server offline or unreachable. Local save preserved.",
          );
          if (typeof window.updateSyncStatus === "function") {
            window.updateSyncStatus("offline");
          }
        });
    }, 10000);
  },

  load() {
    window.isCloudSynced = false;

    // 1. Resolve unified save key or run safe self-healing migration
    let migrationDone = localStorage.getItem("idle_saq_migrated_v11_to_v96");
    if (migrationDone !== "true") {
      let legacyDataRaw = localStorage.getItem("idle_game_v11");
      if (legacyDataRaw) {
        try {
          let legacyParsed = JSON.parse(legacyDataRaw);
          if (legacyParsed && legacyParsed.playerStats) {
            console.log(
              "🚀 Migrating legacy save to unified idle_saq_save baseline.",
            );
            localStorage.setItem("idle_saq_save", legacyDataRaw);
            localStorage.setItem("idle_saq_migrated_v11_to_v96", "true");
            localStorage.setItem("idle_game_v11_backup", legacyDataRaw);
            localStorage.removeItem("idle_game_v11");
          }
        } catch (e) {
          console.error("Legacy save migration check failed", e);
        }
      } else {
        localStorage.setItem("idle_saq_migrated_v11_to_v96", "true");
      }
    }

    let localDataRaw = localStorage.getItem("idle_saq_save");
    let localParsed = null;
    let offlineMsToApply = 0;
    let now = Date.now();

    if (localDataRaw) {
      try {
        localParsed = JSON.parse(localDataRaw);
        this.applyPayload(localParsed, true);
        if (localParsed.lastSaveTime) {
          offlineMsToApply = now - localParsed.lastSaveTime;
        }
      } catch (e) {
        console.error("Local save load failed", e);
      }
    }

    if (!this.serverUrl) {
      if (offlineMsToApply > 0) {
        this.applyOfflineGains(offlineMsToApply);
      }
      return;
    }

    const userId = this.getUserId();
    if (typeof window.updateSyncStatus === "function") {
      window.updateSyncStatus("syncing");
    }
    fetch(`${this.serverUrl}/api/load`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    })
      .then((response) => response.json())
      .then((data) => {
        let resolvedOfflineMs = offlineMsToApply;

        if (data.success && data.saveData) {
          let cloudTime = data.timestamp || 0;
          let localTime = (localParsed && localParsed.lastSaveTime) || 0;

          if (cloudTime > localTime) {
            console.log("☁️ Newer Cloud Save found! Syncing state...");
            window.SaveManager.applyPayload(data.saveData, true);
            resolvedOfflineMs = now - cloudTime;
            localStorage.setItem(
              "idle_saq_save",
              JSON.stringify(data.saveData),
            );
          } else {
            console.log("📱 Local progress is up to date.");
          }

          if (data.clan) {
            window.playerStats.clanId = data.clan.id;
            window.playerStats.clanName = data.clan.name;
            window.playerStats.clanEmblem =
              data.clan.leader_id.charCodeAt(0) || 0;
            window.playerStats.clanLevel = data.clan.level || 1;
            window.playerStats.clanSkills = {
              steel_phalanx: data.clan.skill_steel_phalanx,
              vitality_well: data.clan.skill_vitality_well,
              prosperity_accord: data.clan.skill_prosperity_accord,
              voyagers_guidance: data.clan.skill_voyagers_guidance,
              aetheric_wisdom: data.clan.skill_aetheric_wisdom || 0,
            };
          } else {
            window.playerStats.clanId = null;
            window.playerStats.clanName = null;
          }

          window.isCloudSynced = true;
          if (typeof window.updateSyncStatus === "function") {
            window.updateSyncStatus("connected");
          }
        } else {
          if (typeof window.updateSyncStatus === "function") {
            window.updateSyncStatus("offline");
          }
        }

        if (resolvedOfflineMs > 0) {
          window.SaveManager.applyOfflineGains(resolvedOfflineMs);
        }
        if (typeof window.updateUI === "function") window.updateUI();
        if (typeof window.renderInventory === "function")
          window.renderInventory();
      })
      .catch((err) => {
        console.log(
          "📡 Could not reach Cloud server for sync check. Running off local cache.",
        );
        if (typeof window.updateSyncStatus === "function") {
          window.updateSyncStatus("offline");
        }
        if (offlineMsToApply > 0) {
          window.SaveManager.applyOfflineGains(offlineMsToApply);
        }
        if (typeof window.updateUI === "function") window.updateUI();
        if (typeof window.renderInventory === "function")
          window.renderInventory();
      });

    let autoSalvageSelect = document.getElementById("auto-salvage-setting");
    if (
      autoSalvageSelect &&
      window.playerStats.autoSalvageThreshold !== undefined
    ) {
      autoSalvageSelect.value = window.playerStats.autoSalvageThreshold;
    }
    if (typeof window.refreshMarketShopIfNeeded === "function")
      window.refreshMarketShopIfNeeded();

    if (typeof window.checkUnreadMail === "function") window.checkUnreadMail();
  },

  applyPayload(parsed, skipOffline = false) {
    try {
      const isObject = (item) =>
        item && typeof item === "object" && !Array.isArray(item);

      const deepSanitize = (defaultObj, savedObj) => {
        if (savedObj === undefined || savedObj === null) {
          return JSON.parse(JSON.stringify(defaultObj));
        }
        if (!isObject(defaultObj)) {
          if (typeof defaultObj === "number") {
            let parsedNum = Number(savedObj);
            return isNaN(parsedNum) || savedObj === null
              ? defaultObj
              : parsedNum;
          }
          return savedObj;
        }
        let result = {};
        for (let key in defaultObj) {
          if (Object.prototype.hasOwnProperty.call(defaultObj, key)) {
            result[key] = deepSanitize(defaultObj[key], savedObj[key]);
          }
        }
        for (let key in savedObj) {
          if (
            Object.prototype.hasOwnProperty.call(savedObj, key) &&
            result[key] === undefined
          ) {
            let val = savedObj[key];
            if (typeof val === "number") {
              result[key] = isNaN(val) ? 0 : val;
            } else {
              result[key] = val;
            }
          }
        }
        return result;
      };

      const sanitizeItem = (item) => {
        if (!item || typeof item !== "object") return null;
        const numericKeys = [
          "id",
          "atk",
          "maxHp",
          "def",
          "moveSpeed",
          "critChance",
          "critDamage",
          "block",
          "parry",
          "dropRate",
          "quality",
          "goldMulti",
          "rareSpawn",
          "fairySpawn",
          "activeAttackSpeed",
          "idleAttackSpeed",
          "baseAtk",
          "baseMaxHp",
          "baseDef",
          "baseMoveSpeed",
          "baseBlock",
          "baseParry",
          "baseInt",
          "bonusAtk",
          "bonusMaxHp",
          "bonusDef",
          "bonusMoveSpeed",
          "bonusCritChance",
          "bonusCritDamage",
          "bonusBlock",
          "bonusParry",
          "bonusActiveSpeed",
          "bonusIdleSpeed",
          "bonusStr",
          "bonusDex",
          "bonusInt",
          "str",
          "dex",
          "int",
          "temperLevel",
          "stageLevel",
        ];
        numericKeys.forEach((k) => {
          if (item[k] !== undefined) {
            let parsedVal = Number(item[k]);
            item[k] = isNaN(parsedVal) ? 0 : parsedVal;
          }
        });
        if (item.enchantments && typeof item.enchantments === "object") {
          for (let k in item.enchantments) {
            if (Object.prototype.hasOwnProperty.call(item.enchantments, k)) {
              let val = Number(item.enchantments[k]);
              item.enchantments[k] = isNaN(val) ? 0 : val;
            }
          }
        }
        return item;
      };

      const defaultStats = JSON.parse(JSON.stringify(window.playerStats || {}));
      window.playerStats = deepSanitize(defaultStats, parsed.playerStats);

      let savedEquipped = parsed.equippedSlots || {};
      for (let slot in window.equippedSlots) {
        if (savedEquipped[slot]) {
          window.equippedSlots[slot] = sanitizeItem(savedEquipped[slot]);
        } else {
          window.equippedSlots[slot] = null;
        }
      }

      if (window.playerStats.autoSalvageThreshold === undefined) {
        window.playerStats.autoSalvageThreshold = -1;
      }

      let savedInventory = parsed.inventory || {};
      window.inventory = {
        EQUIP: Array.isArray(savedInventory.EQUIP)
          ? savedInventory.EQUIP.map(sanitizeItem).filter(Boolean)
          : [],
        ARTIFACT: Array.isArray(savedInventory.ARTIFACT)
          ? savedInventory.ARTIFACT.map(sanitizeItem).filter(Boolean)
          : [],
        SIGIL: Array.isArray(savedInventory.SIGIL)
          ? savedInventory.SIGIL.map(sanitizeItem).filter(Boolean)
          : [],
        ETC: {},
        USE: {},
      };

      // Safe Save-State Migration: Move any legacy sigils from EQUIP to SIGIL
      if (window.inventory.EQUIP) {
        for (let i = window.inventory.EQUIP.length - 1; i >= 0; i--) {
          if (
            window.inventory.EQUIP[i] &&
            window.inventory.EQUIP[i].type === "sigil"
          ) {
            if (!window.inventory.SIGIL) window.inventory.SIGIL = [];
            window.inventory.SIGIL.push(window.inventory.EQUIP[i]);
            window.inventory.EQUIP.splice(i, 1);
          }
        }
      }

      if (savedInventory.ETC && typeof savedInventory.ETC === "object") {
        for (let k in savedInventory.ETC) {
          let num = Number(savedInventory.ETC[k]);
          window.inventory.ETC[k] = isNaN(num) ? 0 : num;
        }
      }
      if (savedInventory.USE && typeof savedInventory.USE === "object") {
        for (let k in savedInventory.USE) {
          let num = Number(savedInventory.USE[k]);
          window.inventory.USE[k] = isNaN(num) ? 0 : num;
        }
      }

      const useItemsList = [
        "Attack Elixir",
        "Greater Attack Elixir",
        "Supernal Attack Elixir",
        "Vitality Elixir",
        "Greater Vitality Elixir",
        "Supernal Vitality Elixir",
        "Armored Elixir",
        "Greater Armored Elixir",
        "Supernal Armored Elixir",
        "Haste Elixir",
        "Greater Haste Elixir",
        "Supernal Haste Elixir",
        "SP Reset Scroll",
        "PP Reset Scroll",
        "Daily Reward Sack",
        "Guild Reward Sack",
        "Guild Weekly Sack",
      ];
      useItemsList.forEach((item) => {
        if (window.inventory.ETC && window.inventory.ETC[item]) {
          if (!window.inventory.USE) window.inventory.USE = {};
          window.inventory.USE[item] =
            (window.inventory.USE[item] || 0) + window.inventory.ETC[item];
          delete window.inventory.ETC[item];
        }
      });

      if (window.inventory.EQUIP) {
        for (let i = window.inventory.EQUIP.length - 1; i >= 0; i--) {
          if (
            window.inventory.EQUIP[i] &&
            window.inventory.EQUIP[i].type === "artifact"
          ) {
            window.inventory.ARTIFACT.push(window.inventory.EQUIP[i]);
            window.inventory.EQUIP.splice(i, 1);
          }
        }
      }

      window.idCounter = parsed.idCounter || window.idCounter;
      window.logsHistory = parsed.logsHistory || window.logsHistory;
      window.frozenItemDb = parsed.frozenItemDb || window.frozenItemDb;

      if (window.playerStats.runKills === undefined)
        window.playerStats.runKills = 0;
      if (window.playerStats.runGold === undefined)
        window.playerStats.runGold = 0;
      if (window.playerStats.runXp === undefined) window.playerStats.runXp = 0;
      if (window.playerStats.killedBy === undefined)
        window.playerStats.killedBy = "Unknown Foe";
      if (window.playerStats.killedByMob === undefined)
        window.playerStats.killedByMob = null;

      if (window.playerStats.dungeonKeys === undefined) {
        let legacyKeys =
          (window.playerStats.equipKeys || 0) +
          (window.playerStats.goldKeys || 0) +
          (window.playerStats.matKeys || 0);
        window.playerStats.dungeonKeys = Math.min(5, Math.max(3, legacyKeys));
        window.playerStats.nextDungeonKeyTime =
          window.playerStats.nextEquipKeyTime ||
          window.playerStats.nextGoldKeyTime ||
          window.playerStats.nextMatKeyTime ||
          0;

        delete window.playerStats.equipKeys;
        delete window.playerStats.goldKeys;
        delete window.playerStats.matKeys;
        delete window.playerStats.nextEquipKeyTime;
        delete window.playerStats.nextGoldKeyTime;
        delete window.playerStats.nextMatKeyTime;
      }

      let campaignPeak =
        window.playerStats.lifetimePeakStage ||
        window.playerStats.maxStage ||
        1;
      let targetCheck = Math.floor(campaignPeak * 0.5);

      if (window.playerStats.dungeonPeaks === undefined) {
        window.playerStats.dungeonPeaks = {
          equip: targetCheck,
          gold: targetCheck,
          mat: targetCheck,
        };
      } else {
        window.playerStats.dungeonPeaks.equip = Math.max(
          window.playerStats.dungeonPeaks.equip || 1,
          targetCheck,
        );
        window.playerStats.dungeonPeaks.gold = Math.max(
          window.playerStats.dungeonPeaks.gold || 1,
          targetCheck,
        );
        window.playerStats.dungeonPeaks.mat = Math.max(
          window.playerStats.dungeonPeaks.mat || 1,
          targetCheck,
        );
      }

      if (window.playerStats.currentDungeonStage === undefined) {
        window.playerStats.currentDungeonStage = {
          equip: targetCheck,
          gold: targetCheck,
          mat: targetCheck,
        };
      } else {
        window.playerStats.currentDungeonStage.equip = Math.max(
          window.playerStats.currentDungeonStage.equip || 1,
          targetCheck,
        );
        window.playerStats.currentDungeonStage.gold = Math.max(
          window.playerStats.currentDungeonStage.gold || 1,
          targetCheck,
        );
        window.playerStats.currentDungeonStage.mat = Math.max(
          window.playerStats.currentDungeonStage.mat || 1,
          targetCheck,
        );
      }

      if (window.playerStats.astralShards === undefined)
        window.playerStats.astralShards = 0;
      if (window.playerStats.crucibleWave === undefined)
        window.playerStats.crucibleWave = 1;
      if (window.playerStats.cruciblePeak === undefined)
        window.playerStats.cruciblePeak = 1;
      if (window.playerStats.crucibleStartWave === undefined)
        window.playerStats.crucibleStartWave = 1;
      if (window.playerStats.isCrucibleMode === undefined)
        window.playerStats.isCrucibleMode = false;
      if (window.playerStats.crucibleKills === undefined)
        window.playerStats.crucibleKills = 0;

      if (!window.playerStats.level) {
        window.playerStats.level = 1;
        window.playerStats.xp = 0;
        window.playerStats.sp = 0;
      }

      if (window.playerStats.achievementTimestamps === undefined) {
        window.playerStats.achievementTimestamps = {};
      }

      if (window.playerStats.spAllocations) {
        let legacyAllocKeys = [
          "spHp",
          "spAtk",
          "spDef",
          "spCrit",
          "spCritDmg",
          "spBlock",
          "spParry",
          "spSpd",
        ];
        let refundedSp = 0;
        legacyAllocKeys.forEach((k) => {
          if (window.playerStats.spAllocations[k] > 0) {
            refundedSp += window.playerStats.spAllocations[k];
            window.playerStats.spAllocations[k] = 0;
          }
        });
        if (refundedSp > 0) {
          window.playerStats.sp += refundedSp;
          setTimeout(() => {
            if (typeof window.pushLog === "function")
              window.pushLog(
                `<strong style="color:#2ecc71;">[MIGRATION] Secondary attribute direct spend is discontinued. Refunded ${refundedSp} Skill Points to spend on STR, DEX, or INT!</strong>`,
              );
          }, 1000);
        }
      }

      window.playerStats.xpReq = Math.floor(
        250 * Math.pow(1.2, window.playerStats.level - 1),
      );

      if (window.playerStats.unlockedAchievements) {
        window.playerStats.achievementTimestamps =
          window.playerStats.achievementTimestamps || {};
        window.playerStats.unlockedAchievements.forEach((id) => {
          if (!window.playerStats.achievementTimestamps[id]) {
            window.playerStats.achievementTimestamps[id] = Date.now();
          }
        });
      }
      if (!window.playerStats.spAllocations) {
        window.playerStats.spAllocations = {
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
        };
      }
      if (window.playerStats.spAllocations.spStr === undefined) {
        window.playerStats.spAllocations.spStr = 0;
        window.playerStats.spAllocations.spDex = 0;
        window.playerStats.spAllocations.spInt = 0;
        window.playerStats.baseStr = 5;
        window.playerStats.baseDex = 5;
        window.playerStats.baseInt = 5;
        window.playerStats.baseFairySpawn = 1.0;
      }
      if (!window.playerStats.baseRareSpawn)
        window.playerStats.baseRareSpawn = 0.01;
      if (!window.playerStats.baseFairySpawn)
        window.playerStats.baseFairySpawn = 1.0;
      if (!window.playerStats.maxStage)
        window.playerStats.maxStage = window.playerStats.stage || 1;
      if (
        !window.playerStats.targetsRequired ||
        window.playerStats.targetsRequired === 7
      )
        window.playerStats.targetsRequired = 5;
      if (
        !window.playerStats.shopItems ||
        (window.playerStats.shopItems.length > 0 &&
          window.playerStats.shopItems[0].atk === undefined)
      ) {
        window.playerStats.shopItems = [];
        window.playerStats.shopRefreshTime = 0;
      }
      if (window.playerStats.frenzyKillCount === undefined)
        window.playerStats.frenzyKillCount = 0;

      if (typeof window.recalculateItemStats === "function") {
        for (let key in window.equippedSlots) {
          if (window.equippedSlots[key])
            window.recalculateItemStats(window.equippedSlots[key]);
        }
        if (window.inventory.EQUIP) {
          window.inventory.EQUIP.forEach((item) => {
            if (item) window.recalculateItemStats(item);
          });
        }
        if (window.inventory.ARTIFACT) {
          window.inventory.ARTIFACT.forEach((item) => {
            if (item) window.recalculateItemStats(item);
          });
        }
      }
      if (window.playerStats.atkPotionTimer === undefined)
        window.playerStats.atkPotionTimer = 0;
      if (window.playerStats.hpPotionTimer === undefined)
        window.playerStats.hpPotionTimer = 0;
      if (window.playerStats.defPotionTimer === undefined)
        window.playerStats.defPotionTimer = 0;
      if (window.playerStats.hastePotionTimer === undefined)
        window.playerStats.hastePotionTimer = 0;
      if (window.playerStats.atkPotionStrength === undefined)
        window.playerStats.atkPotionStrength = 0.1;
      if (window.playerStats.hpPotionStrength === undefined)
        window.playerStats.hpPotionStrength = 0.1;
      if (window.playerStats.defPotionStrength === undefined)
        window.playerStats.defPotionStrength = 0.1;
      if (window.playerStats.hastePotionStrength === undefined)
        window.playerStats.hastePotionStrength = 1;
      if (window.playerStats.xpPotionTimer === undefined)
        window.playerStats.xpPotionTimer = 0;
      if (window.playerStats.xpPotionStrength === undefined)
        window.playerStats.xpPotionStrength = 1.0;
      if (window.playerStats.dropPotionTimer === undefined)
        window.playerStats.dropPotionTimer = 0;
      if (window.playerStats.dropPotionStrength === undefined)
        window.playerStats.dropPotionStrength = 1.0;
      if (window.playerStats.qlyPotionTimer === undefined)
        window.playerStats.qlyPotionTimer = 0;
      if (window.playerStats.qlyPotionStrength === undefined)
        window.playerStats.qlyPotionStrength = 0.5;

      if (window.playerStats.unlockedAchievements === undefined)
        window.playerStats.unlockedAchievements = [];
      if (window.playerStats.unviewedAchievements === undefined)
        window.playerStats.unviewedAchievements = [];
      if (window.playerStats.totalGoldEarned === undefined)
        window.playerStats.totalGoldEarned = window.playerStats.coins || 0;
      if (window.playerStats.totalTempers === undefined)
        window.playerStats.totalTempers = 0;
      if (window.playerStats.totalEnchants === undefined)
        window.playerStats.totalEnchants = 0;
      if (window.playerStats.riftGuardiansSlain === undefined)
        window.playerStats.riftGuardiansSlain = 0;
      if (window.playerStats.elixirsConsumed === undefined)
        window.playerStats.elixirsConsumed = 0;
      if (window.playerStats.itemsSalvaged === undefined)
        window.playerStats.itemsSalvaged = 0;
      if (window.playerStats.volumeMaster === undefined)
        window.playerStats.volumeMaster = 0.5;
      if (window.playerStats.volumeSFX === undefined)
        window.playerStats.volumeSFX = 0.8;
      if (window.playerStats.mute === undefined)
        window.playerStats.mute = false;

      if (
        window.playerStats.prestigeUpgrades &&
        window.playerStats.prestigeUpgrades.bag > 0
      ) {
        let refundedPP = window.playerStats.prestigeUpgrades.bag * 10;
        window.playerStats.prestigePoints =
          (window.playerStats.prestigePoints || 0) + refundedPP;

        window.playerStats.missionUpgrades = window.playerStats
          .missionUpgrades || { gold: 0, atk: 0, hp: 0, bag: 0 };
        window.playerStats.missionUpgrades.bag =
          (window.playerStats.missionUpgrades.bag || 0) +
          window.playerStats.prestigeUpgrades.bag;

        window.playerStats.prestigeUpgrades.bag = 0;
      }

      if (window.playerStats.gachaHistory) {
        window.playerStats.gachaHistory.forEach((item) => {
          if (item) window.frozenItemDb[item.id] = item;
        });
      }

      if (window.playerStats.prestigePoints === undefined)
        window.playerStats.prestigePoints = 0;
      if (window.playerStats.prestigeUpgrades === undefined) {
        window.playerStats.prestigeUpgrades = {
          bag: 0,
          gold: 0,
          exp: 0,
          drop: 0,
          atk: 0,
          fort: 0,
          fairy: 0,
        };
      } else {
        window.playerStats.prestigeUpgrades.atk =
          window.playerStats.prestigeUpgrades.atk || 0;
        window.playerStats.prestigeUpgrades.fort =
          window.playerStats.prestigeUpgrades.fort || 0;
        window.playerStats.prestigeUpgrades.fairy =
          window.playerStats.prestigeUpgrades.fairy || 0;
      }
      if (window.playerStats.missionTokens === undefined)
        window.playerStats.missionTokens = 0;
      if (window.playerStats.missionUpgrades === undefined) {
        window.playerStats.missionUpgrades = { gold: 0, atk: 0, hp: 0, bag: 0 };
      } else {
        window.playerStats.missionUpgrades.gold =
          window.playerStats.missionUpgrades.gold || 0;
        window.playerStats.missionUpgrades.atk =
          window.playerStats.missionUpgrades.atk || 0;
        window.playerStats.missionUpgrades.hp =
          window.playerStats.missionUpgrades.hp || 0;
        window.playerStats.missionUpgrades.bag =
          window.playerStats.missionUpgrades.bag || 0;
      }
      if (window.playerStats.prestigeCount === undefined)
        window.playerStats.prestigeCount = 0;
      if (window.playerStats.lifetimePeakStage === undefined)
        window.playerStats.lifetimePeakStage = window.playerStats.maxStage || 1;
      if (window.playerStats.highestRiftLevel === undefined)
        window.playerStats.highestRiftLevel = 0;
      if (window.playerStats.activeRift === undefined)
        window.playerStats.activeRift = null;
      if (window.playerStats.activeRiftLevel === undefined)
        window.playerStats.activeRiftLevel = 1;

      if (window.playerStats.selectedPrestigeStage === undefined)
        window.playerStats.selectedPrestigeStage = Math.max(
          80,
          window.playerStats.maxStage || 80,
        );

      if (window.playerStats.unlockedTitles === undefined)
        window.playerStats.unlockedTitles = [];
      if (window.playerStats.cosmeticSkin === undefined)
        window.playerStats.cosmeticSkin = "default";
      if (window.playerStats.unlockedSkins === undefined) {
        window.playerStats.unlockedSkins = ["default"];
        if (
          window.playerStats.cosmeticSkin !== "default" &&
          !window.playerStats.unlockedSkins.includes(
            window.playerStats.cosmeticSkin,
          )
        ) {
          window.playerStats.unlockedSkins.push(
            window.playerStats.cosmeticSkin,
          );
        }
      }
      if (window.playerStats.unlockedSkins.length === 0)
        window.playerStats.unlockedSkins = ["default"];
      if (window.playerStats.equippedTitle === undefined)
        window.playerStats.equippedTitle = null;
      if (window.playerStats.claimedMailIds === undefined)
        window.playerStats.claimedMailIds = [];

      window.playerStats.isPrestigeBossMode = false;
      window.playerStats.prestigeApproachTimer = 0;

      if (window.playerStats.crucibleRunActive) {
        let penalizeRewards = () => {
          let shards = window.playerStats.crucibleAccumulatedShards || 0;
          let cores = window.playerStats.crucibleAccumulatedCores || 0;

          let keptShards = Math.floor(shards * 0.2);
          let keptCores = Math.floor(cores * 0.2);

          window.playerStats.astralShards =
            (window.playerStats.astralShards || 0) + keptShards;
          if (keptCores > 0) window.addEtcDrop("Catalyst Core", keptCores);

          setTimeout(() => {
            if (typeof window.showCustomConfirm === "function") {
              window.showCustomConfirm(
                "🚨 Aetheric Desynchronization Detected",
                `Your previous Crucible run was terminated abruptly. Anti-cheat measures have been enforced:<br><br>• Initial Shards: <strong>${shards}</strong> ➔ Kept: <strong>${keptShards}</strong> (20%)<br>• Initial Cores: <strong>${cores}</strong> ➔ Kept: <strong>${keptCores}</strong> (20%)<br><br>The remaining 80% was lost to the void.`,
                "Reclaim & Reset",
                "",
                "#e74c3c",
                () => {},
              );
            }
          }, 1500);

          window.playerStats.crucibleAccumulatedShards = 0;
          window.playerStats.crucibleAccumulatedCores = 0;
          window.playerStats.crucibleRunActive = false;

          window.playerStats.isCrucibleMode = false;
          window.playerStats.isDungeonMode = false;
          window.playerStats.isPrestigeBossMode = false;
          window.mob = null;
          window.hero.x = 40;
        };
        penalizeRewards();
      }

      if (window.playerStats.vendingQLevel === undefined)
        window.playerStats.vendingQLevel = 0;
      if (window.playerStats.vendingPity === undefined)
        window.playerStats.vendingPity = 0;
      if (window.playerStats.glimmeringPity === undefined)
        window.playerStats.glimmeringPity = 0;
      if (window.playerStats.shopQLevel === undefined)
        window.playerStats.shopQLevel = 0;
      if (window.playerStats.globalQLevel === undefined)
        window.playerStats.globalQLevel = 0;
      if (window.playerStats.dailyRerollsDone === undefined)
        window.playerStats.dailyRerollsDone = 0;
      if (window.playerStats.fairiesClicked === undefined)
        window.playerStats.fairiesClicked = 0;
      if (window.playerStats.deathCount === undefined)
        window.playerStats.deathCount = 0;
      if (window.playerStats.stickyCanvas === undefined)
        window.playerStats.stickyCanvas = true;

      if (window.playerStats.peakSingleHit === undefined)
        window.playerStats.peakSingleHit = 0;
      if (window.playerStats.maxFairyClicksInWindow === undefined)
        window.playerStats.maxFairyClicksInWindow = 0;
      if (window.playerStats.totalDeflections === undefined)
        window.playerStats.totalDeflections = 0;
      if (window.playerStats.peakSimultaneousBuffs === undefined)
        window.playerStats.peakSimultaneousBuffs = 0;
      if (window.playerStats.totalReforges === undefined)
        window.playerStats.totalReforges = 0;
      if (window.playerStats.peakSingleGoldDrop === undefined)
        window.playerStats.peakSingleGoldDrop = 0;
      if (window.playerStats.rareSpawnsSlain === undefined)
        window.playerStats.rareSpawnsSlain = 0;
      if (window.playerStats.maxCanvasClicksInWindow === undefined)
        window.playerStats.maxCanvasClicksInWindow = 0;
      if (window.playerStats.sessionPlaytime === undefined)
        window.playerStats.sessionPlaytime = 0;
      if (window.playerStats.activityTimer === undefined)
        window.playerStats.activityTimer = 0;

      window.playerStats.fairyClicksWindow =
        window.playerStats.fairyClicksWindow || [];
      window.playerStats.canvasClicksWindow =
        window.playerStats.canvasClicksWindow || [];
      window.playerStats.recentHeals = window.playerStats.recentHeals || [];

      if (window.playerStats.dailyMissions === undefined)
        window.playerStats.dailyMissions = [];
      if (window.playerStats.weeklyMissions === undefined)
        window.playerStats.weeklyMissions = [];

      if (window.playerStats.dailyMissions) {
        window.playerStats.dailyMissions.forEach((m) => {
          if (m.treat === "Clan Reward Sack") m.treat = "Daily Reward Sack";
        });
      }
      if (window.playerStats.weeklyMissions) {
        window.playerStats.weeklyMissions.forEach((m) => {
          if (m.treat === "Clan Weekly Sack") m.treat = "Weekly Reward Sack";
        });
      }

      if (window.playerStats.lastDailyResetTime === undefined)
        window.playerStats.lastDailyResetTime = 0;
      if (window.playerStats.lastWeeklyResetTime === undefined)
        window.playerStats.lastWeeklyResetTime = 0;
      if (window.playerStats.dailyRewardClaimed === undefined)
        window.playerStats.dailyRewardClaimed = false;
      if (window.playerStats.weeklyRewardClaimed === undefined)
        window.playerStats.weeklyRewardClaimed = false;
      if (typeof window.checkAndResetMissions === "function")
        window.checkAndResetMissions();

      if (window.inventory.ETC["Iron Scrap"]) {
        if (typeof window.addEtcDrop === "function")
          window.addEtcDrop("Monster Soul", window.inventory.ETC["Iron Scrap"]);
        delete window.inventory.ETC["Iron Scrap"];
      }
      if (window.inventory.ETC["Sticky Gel"]) {
        if (typeof window.addEtcDrop === "function")
          window.addEtcDrop("Monster Soul", window.inventory.ETC["Sticky Gel"]);
        delete window.inventory.ETC["Sticky Gel"];
      }

      let box = document.getElementById("log-box");
      if (box) box.innerHTML = window.logsHistory.join("<br><br>");

      if (typeof window.recalculateAchievementTotals === "function")
        window.recalculateAchievementTotals();
      if (typeof window.checkAchievements === "function")
        window.checkAchievements();
      if (typeof window.updateAudioUI === "function") window.updateAudioUI();
      if (window.SoundManager && window.SoundManager.ctx)
        window.SoundManager.updateVolumes();

      if (typeof window.checkForUpdates === "function")
        setTimeout(window.checkForUpdates, 1500);

      if (parsed.lastSaveTime) {
        let now = Date.now();
        let offlineMs = now - parsed.lastSaveTime;

        if (window.playerStats.dungeonKeys < 5) {
          let keyTime = window.playerStats.nextDungeonKeyTime || now;
          let msSinceNextKey = now - keyTime;
          if (msSinceNextKey >= 0) {
            let keysEarned = 1 + Math.floor(msSinceNextKey / 21600000);
            window.playerStats.dungeonKeys = Math.min(
              5,
              window.playerStats.dungeonKeys + keysEarned,
            );
            window.playerStats.nextDungeonKeyTime =
              window.playerStats.dungeonKeys < 5
                ? now + (21600000 - (msSinceNextKey % 21600000))
                : 0;
          }
        }
        if (
          !skipOffline &&
          typeof window.SaveManager.applyOfflineGains === "function"
        )
          window.SaveManager.applyOfflineGains(offlineMs);
      }
      setTimeout(() => {
        if (typeof window.pushLog === "function")
          window.pushLog(
            `<span style='color:#3498db; font-weight:bold;'>[SYSTEM] Save loaded successfully.</span>`,
          );
      }, 500);

      if (typeof window.refreshMarketShopIfNeeded === "function")
        window.refreshMarketShopIfNeeded();
    } catch (e) {
      console.error("Save load failed", e);
    }
  },

  applyOfflineGains(offlineMs) {
    if (offlineMs <= 60000) return 0;

    let offlineSeconds = Math.floor(offlineMs / 1000);
    if (offlineSeconds >= 28800) {
      window.playerStats.hasTriggeredTimeCapsule = true;
      offlineSeconds = 28800;
    }

    window.isGamePaused = true;
    let currentStage = window.playerStats.stage;
    let originalStage = currentStage;
    let remainingSeconds = offlineSeconds;
    let elapsedSeconds = 0;

    let totalGold = 0;
    let totalXp = 0;
    let totalKills = 0;
    let stagesGained = 0;
    let diedOffline = false;
    let deathStage = 0;
    let itemsDropped = [];
    let scrapsGainedMap = {};

    function recordScrapGained(name, amount) {
      if (!scrapsGainedMap[name]) scrapsGainedMap[name] = 0;
      scrapsGainedMap[name] += amount;
      const useItems = [
        "Attack Elixir",
        "Greater Attack Elixir",
        "Supernal Attack Elixir",
        "Vitality Elixir",
        "Greater Vitality Elixir",
        "Supernal Vitality Elixir",
        "Armored Elixir",
        "Greater Armored Elixir",
        "Supernal Armored Elixir",
        "Haste Elixir",
        "Greater Haste Elixir",
        "Supernal Haste Elixir",
        "SP Reset Scroll",
        "PP Reset Scroll",
      ];
      if (useItems.includes(name)) {
        if (!window.inventory.USE[name]) window.inventory.USE[name] = 0;
        window.inventory.USE[name] += amount;
      } else {
        if (!window.inventory.ETC[name]) window.inventory.ETC[name] = 0;
        window.inventory.ETC[name] += amount;
      }
    }

    let maxBag = window.getMaxBagSlots();
    let initialEquipIds = new Set(
      window.inventory.EQUIP.map((item) => item.id),
    );
    let initialArtifactIds = new Set(
      window.inventory.ARTIFACT.map((item) => item.id),
    );
    let equipTypesList = [
      "weapon",
      "subweapon",
      "helmet",
      "chest",
      "leggings",
      "overall",
      "boots",
    ];

    function rollOfflineItem(isBossKill, stageNum, isRareMob) {
      let pCurrent = window.resolvePlayerStats();
      let chosenType =
        equipTypesList[Math.floor(Math.random() * equipTypesList.length)];
      let statLinesCount = 0;
      let luckMultiplier = pCurrent.qly;
      let rollVal = Math.random() * 100;

      let chance5 = luckMultiplier >= 2.0 ? 0.02 * luckMultiplier : 0;
      let chance4 = luckMultiplier >= 1.5 ? 0.16 * luckMultiplier : 0;

      if (rollVal < chance5) statLinesCount = 5;
      else if (rollVal < chance5 + chance4) statLinesCount = 4;
      else if (rollVal < 0.8 * luckMultiplier) statLinesCount = 3;
      else if (rollVal < 4.0 * luckMultiplier) statLinesCount = 2;
      else if (rollVal < 15.0 * luckMultiplier) statLinesCount = 1;

      let stageScale = Math.floor((stageNum - 1) / 10) + 1;
      let newItem = window.createItemObject(
        chosenType,
        statLinesCount,
        stageScale,
        0,
      );

      if (
        newItem.type !== "artifact" &&
        window.playerStats.autoSalvageThreshold !== undefined &&
        window.playerStats.autoSalvageThreshold >= 0
      ) {
        if (newItem.statsRolled <= window.playerStats.autoSalvageThreshold) {
          let rolledTier = newItem.statsRolled;
          let scrapName = window.getScrapYieldName(rolledTier);
          let yieldAmount = Math.floor(Math.random() * 3) + 1;
          recordScrapGained(scrapName, yieldAmount);
          window.playerStats.itemsSalvaged =
            (window.playerStats.itemsSalvaged || 0) + 1;

          for (let t = rolledTier - 1; t >= 0; t--) {
            if (Math.random() < 0.6) {
              let lowerYield = Math.floor(Math.random() * 2) + 1;
              let lowerName = window.getScrapYieldName(t);
              recordScrapGained(lowerName, lowerYield);
            }
          }
          return;
        }
      }

      if (newItem.type === "artifact") {
        if (window.inventory.ARTIFACT.length < maxBag) {
          window.inventory.ARTIFACT.push(newItem);
          itemsDropped.push(newItem);
        } else {
          let newlyAddedArts = window.inventory.ARTIFACT.filter(
            (item) => !initialArtifactIds.has(item.id) && !item.locked,
          );
          if (newlyAddedArts.length > 0) {
            newlyAddedArts.sort((a, b) => a.stageLevel - b.stageLevel);
            let worstArt = newlyAddedArts[0];
            if (newItem.stageLevel > worstArt.stageLevel) {
              recordScrapGained(
                "Astral Essence",
                Math.floor(Math.random() * 2) + 1,
              );
              let wIndex = window.inventory.ARTIFACT.findIndex(
                (item) => item.id === worstArt.id,
              );
              if (wIndex !== -1) window.inventory.ARTIFACT.splice(wIndex, 1);
              window.inventory.ARTIFACT.push(newItem);
              itemsDropped.push(newItem);
              let droppedIdx = itemsDropped.findIndex(
                (x) => x.id === worstArt.id,
              );
              if (droppedIdx !== -1) itemsDropped.splice(droppedIdx, 1);
            } else {
              recordScrapGained(
                "Astral Essence",
                Math.floor(Math.random() * 2) + 1,
              );
            }
          } else {
            recordScrapGained(
              "Astral Essence",
              Math.floor(Math.random() * 2) + 1,
            );
          }
        }
      } else {
        if (window.inventory.EQUIP.length < maxBag) {
          window.inventory.EQUIP.push(newItem);
          itemsDropped.push(newItem);
        } else {
          let newlyAddedEquip = window.inventory.EQUIP.filter(
            (item) => !initialEquipIds.has(item.id) && !item.locked,
          );
          if (newlyAddedEquip.length > 0) {
            newlyAddedEquip.sort((a, b) => {
              if (a.statsRolled !== b.statsRolled)
                return a.statsRolled - b.statsRolled;
              return a.stageLevel - b.stageLevel;
            });
            let worstEquip = newlyAddedEquip[0];
            if (
              newItem.statsRolled > worstEquip.statsRolled ||
              (newItem.statsRolled === worstEquip.statsRolled &&
                newItem.stageLevel > worstEquip.stageLevel)
            ) {
              let rolledTier = worstEquip.statsRolled;
              let scrapName = window.getScrapYieldName(rolledTier);
              let yieldAmount = Math.floor(Math.random() * 3) + 1;
              recordScrapGained(scrapName, yieldAmount);
              for (let t = rolledTier - 1; t >= 0; t--) {
                if (Math.random() < 0.6)
                  recordScrapGained(
                    window.getScrapYieldName(t),
                    Math.floor(Math.random() * 2) + 1,
                  );
              }
              let wIndex = window.inventory.EQUIP.findIndex(
                (item) => item.id === worstEquip.id,
              );
              if (wIndex !== -1) window.inventory.EQUIP.splice(wIndex, 1);
              window.inventory.EQUIP.push(newItem);
              itemsDropped.push(newItem);
              let droppedIdx = itemsDropped.findIndex(
                (x) => x.id === worstEquip.id,
              );
              if (droppedIdx !== -1) itemsDropped.splice(droppedIdx, 1);
            } else {
              let rolledTier = newItem.statsRolled;
              let scrapName = window.getScrapYieldName(rolledTier);
              let yieldAmount = Math.floor(Math.random() * 3) + 1;
              recordScrapGained(scrapName, yieldAmount);
              for (let t = rolledTier - 1; t >= 0; t--) {
                if (Math.random() < 0.6)
                  recordScrapGained(
                    window.getScrapYieldName(t),
                    Math.floor(Math.random() * 2) + 1,
                  );
              }
            }
          } else {
            let rolledTier = newItem.statsRolled;
            let scrapName = window.getScrapYieldName(rolledTier);
            let yieldAmount = Math.floor(Math.random() * 3) + 1;
            recordScrapGained(scrapName, yieldAmount);
            for (let t = rolledTier - 1; t >= 0; t--) {
              if (Math.random() < 0.6)
                recordScrapGained(
                  window.getScrapYieldName(t),
                  Math.floor(Math.random() * 2) + 1,
                );
            }
          }
        }
      }
    }

    let isFarming = window.playerStats.isFarmingLoop || false;
    let timersList = [
      "atkPotionTimer",
      "hpPotionTimer",
      "defPotionTimer",
      "hastePotionTimer",
      "xpPotionTimer",
      "dropPotionTimer",
      "qlyPotionTimer",
      "frenzyTimer",
      "adrenalineTimer",
    ];

    while (remainingSeconds > 0) {
      let chunkSeconds = Math.min(remainingSeconds, 600);
      let nextExpirySec = chunkSeconds;
      timersList.forEach((tName) => {
        let tVal = window.playerStats[tName];
        if (tVal > 0) {
          let tSec = tVal / 60;
          if (tSec < nextExpirySec) nextExpirySec = tSec;
        }
      });

      let stepSeconds = nextExpirySec;
      let segmentTimeLeft = stepSeconds;

      while (segmentTimeLeft > 0) {
        let p = window.resolvePlayerStats();
        let effMultiplier = 1 + p.critChance * (p.critDamage - 1);
        let playerDps = Math.max(
          1,
          p.atk * effMultiplier * (60 / p.idleAttackSpeed),
        );

        let growthRate = 1.045 + (currentStage * 0.04) / (currentStage + 200);
        let expScale = Math.pow(growthRate, currentStage);

        let mobHp = Math.floor(25 * expScale * (1 + currentStage * 0.06));
        let bossHp = Math.floor(120 * expScale * (1 + currentStage * 0.06));
        let blendedMobHp =
          (1 - p.rareSpawn) * mobHp + p.rareSpawn * (2.5 * mobHp);

        let playerDpsMitigatedMob = playerDps * (100 / (100 + 0));
        let playerDpsMitigatedBoss = playerDps * (100 / (100 + 0));

        let ttkMob = blendedMobHp / Math.max(1, playerDpsMitigatedMob);
        let ttkBoss = bossHp / Math.max(1, playerDpsMitigatedBoss);
        let cycleTime = Math.max(
          0.5,
          Math.min(300, (5 * ttkMob + ttkBoss) / 6 + 10.0),
        );

        let targetsRequired = window.playerStats.targetsRequired || 5;
        let killsNeededForStage =
          targetsRequired - window.playerStats.killCount;

        if (isFarming) {
          let killsInThisSub = Math.floor(segmentTimeLeft / cycleTime);
          if (killsInThisSub <= 0) {
            elapsedSeconds += segmentTimeLeft;
            segmentTimeLeft = 0;
            break;
          }
          let elapsed = killsInThisSub * cycleTime;
          segmentTimeLeft -= elapsed;
          elapsedSeconds += elapsed;
          totalKills += killsInThisSub;

          for (let k = 0; k < killsInThisSub; k++) {
            let isRare = Math.random() < p.rareSpawn;
            totalGold += Math.ceil(
              Math.floor(2 * expScale * (isRare ? 4 : 1)) * p.gold,
            );
            totalXp += Math.floor(5 * expScale * (isRare ? 3 : 1));
            let dropR = isRare ? 0.005 : 0.001;
            if (Math.random() < dropR * p.drop * window.state.efficiency) {
              rollOfflineItem(false, currentStage, isRare);
            }
            if (typeof window.rollPotionDrop === "function") {
              let rolledPot = window.rollPotionDrop(false, isRare, true);
              if (rolledPot) recordScrapGained(rolledPot, 1);
            }
          }
        } else {
          let mobDmg = 5.2 * expScale;
          let netMobDmg = Math.max(
            1,
            Math.ceil(mobDmg * (100 / (100 + p.def))),
          );
          let bossDmg = 20 * expScale;
          let bossNetDmg = Math.max(
            1,
            Math.ceil(bossDmg * (100 / (100 + p.def))),
          );
          let bossHits = Math.floor(ttkBoss / 2);
          let bossDmgTaken = bossHits * bossNetDmg;
          let bossVampHeal = window.checkArtifactTrait("vampirism")
            ? Math.min(
                Math.floor(playerDps * ttkBoss * 0.03),
                Math.ceil(
                  p.maxHp * 0.05 * (ttkBoss * (60 / p.idleAttackSpeed)),
                ),
              )
            : 0;
          let bossNetDmgTaken = Math.max(0, bossDmgTaken - bossVampHeal);
          let cumulativeStageDamage =
            netMobDmg * killsNeededForStage + bossNetDmgTaken;

          if (
            cumulativeStageDamage > p.maxHp &&
            !window.checkArtifactTrait("second_wind")
          ) {
            diedOffline = true;
            deathStage = currentStage;
            let prestigeCount = window.playerStats.prestigeCount || 0;
            let rollbackPercent = 0.8;
            if (prestigeCount >= 1)
              rollbackPercent = Math.min(
                0.95,
                0.9 + (prestigeCount - 1) * 0.01,
              );
            currentStage = Math.max(
              1,
              Math.floor(deathStage * rollbackPercent),
            );
            isFarming = true;
            continue;
          }

          let timeNeededForStage = (killsNeededForStage + 1) * cycleTime;
          let hitStageCap = currentStage >= (window.playerStats.maxStage || 1);

          if (timeNeededForStage <= segmentTimeLeft && !hitStageCap) {
            segmentTimeLeft -= timeNeededForStage;
            elapsedSeconds += timeNeededForStage;
            totalKills += killsNeededForStage + 1;

            for (let k = 0; k < killsNeededForStage; k++) {
              let isRare = Math.random() < p.rareSpawn;
              totalGold += Math.ceil(
                Math.floor(2 * expScale * (isRare ? 4 : 1)) * p.gold,
              );
              totalXp += Math.floor(5 * expScale * (isRare ? 3 : 1));
              let dropR = isRare ? 0.005 : 0.001;
              if (Math.random() < dropR * p.drop * window.state.efficiency) {
                rollOfflineItem(false, currentStage, isRare);
              }
              if (typeof window.rollPotionDrop === "function") {
                let rolledPot = window.rollPotionDrop(false, isRare, true);
                if (rolledPot) recordScrapGained(rolledPot, 1);
              }
            }

            totalGold += Math.ceil(Math.floor(15 * expScale) * p.gold);
            totalXp += Math.floor(25 * expScale);
            if (Math.random() < 0.01 * p.drop * window.state.efficiency) {
              if (typeof window.rollEquipmentDrop === "function")
                window.rollEquipmentDrop(true, currentStage, false);
            }
            if (typeof window.rollPotionDrop === "function") {
              let rolledBossPot = window.rollPotionDrop(true, false, true);
              if (rolledBossPot) recordScrapGained(rolledBossPot, 1);
            }

            let offlineDepthQ = window.getDepthQualityMultiplier(currentStage);
            if (offlineDepthQ > 1.0) {
              if (Math.random() < 0.0005) recordScrapGained("Ancient Core", 1);
              if (Math.random() < 0.0004)
                recordScrapGained("Overlord's Sigil", 1);
              if (Math.random() < 0.0004) recordScrapGained("Eridium Shard", 1);
              if (Math.random() < 0.0003) recordScrapGained("Gacha Key", 1);
            }

            currentStage++;
            stagesGained++;
            window.playerStats.killCount = 0;
          } else {
            let partialKills = Math.floor(segmentTimeLeft / cycleTime);
            if (partialKills > 0) {
              totalKills += partialKills;
              let elapsedForKills = partialKills * cycleTime;
              elapsedSeconds += elapsedForKills;
              segmentTimeLeft -= elapsedForKills;

              for (let k = 0; k < partialKills; k++) {
                let isRare = Math.random() < p.rareSpawn;
                totalGold += Math.ceil(
                  Math.floor(2 * expScale * (isRare ? 4 : 1)) * p.gold,
                );
                totalXp += Math.floor(5 * expScale * (isRare ? 3 : 1));
                let dropR = isRare ? 0.005 : 0.001;
                if (Math.random() < dropR * p.drop * window.state.efficiency) {
                  rollOfflineItem(false, currentStage, isRare);
                }
                if (typeof window.rollPotionDrop === "function") {
                  let rolledPartialPot = window.rollPotionDrop(
                    false,
                    isRare,
                    true,
                  );
                  if (rolledPartialPot) recordScrapGained(rolledPartialPot, 1);
                }
              }
            } else {
              elapsedSeconds += segmentTimeLeft;
            }
            segmentTimeLeft = 0;
          }
        }
      }

      timersList.forEach((tName) => {
        if (
          window.playerStats[tName] !== undefined &&
          window.playerStats[tName] > 0
        ) {
          window.playerStats[tName] = Math.max(
            0,
            window.playerStats[tName] - stepSeconds * 60,
          );
        }
      });
      window.invalidatePlayerStats();

      remainingSeconds -= stepSeconds;
    }

    window.playerStats.coins += totalGold;
    window.playerStats.totalGoldEarned =
      (window.playerStats.totalGoldEarned || 0) + totalGold;
    window.playerStats.totalLifetimeKills =
      (window.playerStats.totalLifetimeKills || 0) + totalKills;
    window.playerStats.stage = currentStage;
    window.playerStats.maxStage = Math.max(
      window.playerStats.maxStage || 1,
      window.playerStats.stage,
    );
    window.playerStats.lifetimePeakStage = Math.max(
      window.playerStats.lifetimePeakStage || 1,
      window.playerStats.maxStage,
    );

    window.gainXp(totalXp, true);
    window.invalidatePlayerStats();

    if (typeof window.showOfflineSummaryModal === "function") {
      window.showOfflineSummaryModal(
        offlineSeconds,
        originalStage,
        currentStage,
        totalGold,
        totalXp,
        totalKills,
        itemsDropped,
        scrapsGainedMap,
        diedOffline,
        deathStage,
      );
    }
    return offlineSeconds * 1000;
  },

  hardReset() {
    if (typeof window.showCustomConfirm === "function") {
      window.showCustomConfirm(
        "🚨 Hard Reset Progress?",
        "WARNING: This will permanently delete your entire save, remove your name from the leaderboards, and purge your cloud backup! Are you absolutely sure?",
        "Wipe Everything",
        "Cancel",
        "#e74c3c",
        () => {
          window.showCustomConfirm(
            "🚨 Final Confirmation",
            "THIS CANNOT BE UNDONE! Confirm to delete your local and cloud saves permanently?",
            "Wipe & Start Over",
            "Cancel",
            "#e74c3c",
            () => {
              const userId = window.SaveManager.getUserId();

              const performLocalWipe = () => {
                window.removeEventListener(
                  "beforeunload",
                  window.SaveManager.save,
                );
                localStorage.removeItem("idle_saq_save");
                localStorage.removeItem("idle_game_v11");
                localStorage.removeItem("idle_game_v11_backup");
                localStorage.removeItem("idle_saq_migrated_v11_to_v96");
                localStorage.removeItem("idle_game_user_id");
                window.location.reload();
              };

              if (!window.SaveManager.serverUrl) {
                performLocalWipe();
                return;
              }

              fetch(`${window.SaveManager.serverUrl}/api/wipe-save`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId }),
              })
                .then(() => performLocalWipe())
                .catch((err) => {
                  console.error(
                    "Cloud wipe request failed; falling back to local wipe:",
                    err,
                  );
                  performLocalWipe();
                });
            },
          );
        },
      );
    }
  },
};

// Initialize SaveManager immediately
window.SaveManager.init();

// Strangler Fig backward compatibility aliases
window.detectGameServer = () => window.SaveManager.detectServer();
window.getGameUserId = () => window.SaveManager.getUserId();
window.saveGame = () => window.SaveManager.save();
window.loadGame = () => window.SaveManager.load();
window.applyOfflineGains = (ms) => window.SaveManager.applyOfflineGains(ms);
window.applySaveStatePayload = (parsed, skip) =>
  window.SaveManager.applyPayload(parsed, skip);
window.hardResetGame = () => window.SaveManager.hardReset();

window.loadGameAndSyncCloud = function () {
  window.isCloudSynced = false;

  // 1. Resolve unified save key or run safe self-healing migration
  let migrationDone = localStorage.getItem("idle_saq_migrated_v11_to_v96");
  if (migrationDone !== "true") {
    let legacyDataRaw = localStorage.getItem("idle_game_v11");
    if (legacyDataRaw) {
      try {
        let legacyParsed = JSON.parse(legacyDataRaw);
        // Guarantee copy is valid and populated before overwriting
        if (legacyParsed && legacyParsed.playerStats) {
          console.log(
            "🚀 Migrating legacy save to unified idle_saq_save baseline.",
          );
          localStorage.setItem("idle_saq_save", legacyDataRaw);
          localStorage.setItem("idle_saq_migrated_v11_to_v96", "true");
          // Keep old save under backup key for complete safety
          localStorage.setItem("idle_game_v11_backup", legacyDataRaw);
          localStorage.removeItem("idle_game_v11");
        }
      } catch (e) {
        console.error("Legacy save migration check failed", e);
      }
    } else {
      localStorage.setItem("idle_saq_migrated_v11_to_v96", "true");
    }
  }

  let localDataRaw = localStorage.getItem("idle_saq_save");
  let localParsed = null;
  let offlineMsToApply = 0;
  let now = Date.now();

  if (localDataRaw) {
    try {
      localParsed = JSON.parse(localDataRaw);
      // Skip offline gains during initial payload load
      window.applySaveStatePayload(localParsed, true);
      if (localParsed.lastSaveTime) {
        offlineMsToApply = now - localParsed.lastSaveTime;
      }
    } catch (e) {
      console.error("Local save load failed", e);
    }
  }

  if (!window.GAME_SERVER_URL) {
    // Offline / GitHub Pages local-only mode
    if (offlineMsToApply > 0) {
      window.applyOfflineGains(offlineMsToApply);
    }
    return;
  }

  const userId = window.getGameUserId();
  if (typeof window.updateSyncStatus === "function") {
    window.updateSyncStatus("syncing");
  }
  fetch(`${window.GAME_SERVER_URL}/api/load`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId }),
  })
    .then((response) => response.json())
    .then((data) => {
      let resolvedOfflineMs = offlineMsToApply;

      if (data.success && data.saveData) {
        let cloudTime = data.timestamp || 0;
        let localTime = (localParsed && localParsed.lastSaveTime) || 0;

        if (cloudTime > localTime) {
          console.log("☁️ Newer Cloud Save found! Syncing state...");
          window.applySaveStatePayload(data.saveData, true);
          resolvedOfflineMs = now - cloudTime;
          localStorage.setItem("idle_saq_save", JSON.stringify(data.saveData));
        } else {
          console.log("📱 Local progress is up to date.");
        }

        // Sync and cache current Guild attributes
        if (data.clan) {
          window.playerStats.clanId = data.clan.id;
          window.playerStats.clanName = data.clan.name;
          window.playerStats.clanEmblem =
            data.clan.leader_id.charCodeAt(0) || 0;
          window.playerStats.clanLevel = data.clan.level || 1;
          window.playerStats.clanSkills = {
            steel_phalanx: data.clan.skill_steel_phalanx,
            vitality_well: data.clan.skill_vitality_well,
            prosperity_accord: data.clan.skill_prosperity_accord,
            voyagers_guidance: data.clan.skill_voyagers_guidance,
            aetheric_wisdom: data.clan.skill_aetheric_wisdom || 0,
          };
        } else {
          window.playerStats.clanId = null;
          window.playerStats.clanName = null;
        }

        window.isCloudSynced = true;
        if (typeof window.updateSyncStatus === "function") {
          window.updateSyncStatus("connected");
        }
      } else {
        if (typeof window.updateSyncStatus === "function") {
          window.updateSyncStatus("offline");
        }
      }

      // Apply offline progress EXACTLY once after final source resolution
      if (resolvedOfflineMs > 0) {
        window.applyOfflineGains(resolvedOfflineMs);
      }
      if (typeof window.updateUI === "function") window.updateUI();
      if (typeof window.renderInventory === "function")
        window.renderInventory();
    })
    .catch((err) => {
      console.log(
        "📡 Could not reach Cloud server for sync check. Running off local cache.",
      );
      if (typeof window.updateSyncStatus === "function") {
        window.updateSyncStatus("offline");
      }
      // Apply offline gains using local cache if server is unreachable
      if (offlineMsToApply > 0) {
        window.applyOfflineGains(offlineMsToApply);
      }
      if (typeof window.updateUI === "function") window.updateUI();
      if (typeof window.renderInventory === "function")
        window.renderInventory();
    });

  let autoSalvageSelect = document.getElementById("auto-salvage-setting");
  if (
    autoSalvageSelect &&
    window.playerStats.autoSalvageThreshold !== undefined
  ) {
    autoSalvageSelect.value = window.playerStats.autoSalvageThreshold;
  }
  if (typeof window.refreshMarketShopIfNeeded === "function")
    window.refreshMarketShopIfNeeded();

  if (typeof window.checkUnreadMail === "function") window.checkUnreadMail();
};

window.adjustCanvasDimensions = function () {
  let cvs = window.canvas || document.getElementById("gameCanvas");
  if (!cvs) return;
  const isLandscapeMobile =
    window.innerHeight <= 550 && window.innerWidth > window.innerHeight;
  const isMobile = window.innerWidth <= 580; // Lowered breakpoint to prevent scrollbar layout toggling

  if (isLandscapeMobile) {
    cvs.width = 480;
    cvs.height = 280;
  } else if (isMobile) {
    cvs.width = 420;
    cvs.height = 320;
  } else {
    cvs.width = 750;
    cvs.height = 320;
  }
};

window.onload = function () {
  canvas = document.getElementById("gameCanvas");
  if (!canvas) return;
  ctx = canvas.getContext("2d", { alpha: false });

  // EXPOSE TO GLOBAL WINDOW SO ENTITIES.JS CAN DRAW TO IT
  window.canvas = canvas;
  window.ctx = ctx;

  window.adjustCanvasDimensions();
  // Allow dynamic mobile chrome (address bar / viewport height) to settle
  setTimeout(() => {
    window.adjustCanvasDimensions();
    if (typeof window.updateUI === "function") window.updateUI();
  }, 50);

  window.addEventListener("resize", () => {
    window.adjustCanvasDimensions();
    if (typeof window.updateUI === "function") window.updateUI();
  });
  window.addEventListener("orientationchange", () => {
    window.adjustCanvasDimensions();
    if (typeof window.updateUI === "function") window.updateUI();
  });

  window.loadGame();
  window.updateStickyCanvasStyle();
  if (typeof window.requestWakeLock === "function") {
    window.requestWakeLock();
  }

  // Block pointer event leaks and click-through propagation on tooltips
  const preventTooltipLeaks = (id) => {
    let el = document.getElementById(id);
    if (el) {
      el.addEventListener("pointerdown", (e) => {
        e.stopPropagation();
        e.preventDefault();
        window.hideTooltip();
      });
      el.addEventListener("touchstart", (e) => {
        e.stopPropagation();
        e.preventDefault();
        window.hideTooltip();
      });
    }
  };
  preventTooltipLeaks("game-tooltip");
  preventTooltipLeaks("etc-tooltip");
  preventTooltipLeaks("stat-tooltip");

  // Warm user gesture activation for Web Audio Context
  const initAudio = () => {
    window.SoundManager.init();
    window.removeEventListener("mousedown", initAudio);
    window.removeEventListener("touchstart", initAudio);
    window.removeEventListener("keydown", initAudio);
  };
  window.addEventListener("mousedown", initAudio);
  window.addEventListener("touchstart", initAudio);
  window.addEventListener("keydown", initAudio);

  // Seed procedural foliage if not populated
  const flowerColors = [
    "#e74c3c",
    "#9b59b6",
    "#f1c40f",
    "#3498db",
    "#e67e22",
    "#e84393",
  ];
  if (window.bgScenery.length === 0) {
    for (let i = 0; i < 12; i++) {
      window.bgScenery.push({
        x: Math.random() * canvas.width,
        y: 230,
        type: Math.random() > 0.5 ? "tree" : "bush",
        size: Math.random() * 0.5 + 0.5,
        seed: Math.random(),
      });
    }
  }
  if (window.fgScenery.length === 0) {
    for (let i = 0; i < 25; i++) {
      let fgType = Math.random();
      window.fgScenery.push({
        x: Math.random() * canvas.width,
        y: 240 + Math.random() * 60,
        type: fgType > 0.8 ? "bush" : fgType > 0.5 ? "flower" : "grass",
        size: Math.random() * 0.7 + 0.5,
        color: flowerColors[Math.floor(Math.random() * flowerColors.length)],
        seed: Math.random(),
      });
    }
  }

  // Input Listeners
  window.addEventListener("keydown", function (e) {
    if (e.code === "Space" && !window.spacePressed) {
      e.preventDefault();
      window.spacePressed = true;
      window.registerMaelstromTap();
      window.triggerPlayerSlash();
    }
  });
  window.addEventListener("keyup", function (e) {
    if (e.code === "Space") {
      window.spacePressed = false;
    }
  });

  // Lock Tooltip Listeners (Star Quality locks)
  const attachRatesListeners = (id, lockType) => {
    let el = document.getElementById(id);
    if (el) {
      el.style.cursor = "help";
      el.addEventListener("mouseenter", (e) =>
        window.showRatesLockTooltip(e, lockType),
      );
      el.addEventListener("mouseleave", () => window.hideTooltip());
      el.addEventListener("touchstart", (e) =>
        window.showRatesLockTooltip(e, lockType),
      );
    }
  };
  attachRatesListeners("star-rate-4", "star4");
  attachRatesListeners("star-rate-5", "star5");

  window.activeCanvasPointers = window.activeCanvasPointers || new Set();
  window.isCanvasPressed = false;
  canvas.addEventListener("pointerdown", function (e) {
    let gameTooltip = document.getElementById("game-tooltip");
    let etcTooltip = document.getElementById("etc-tooltip");
    if (
      gameTooltip.style.display === "block" ||
      etcTooltip.style.display === "block"
    ) {
      window.hideTooltip();
      return;
    }

    window.playerStats.hasClickedThisBattle = true;

    // Active Debuff: Static Feedback (Click self-damage)
    if (
      window.playerStats.isDungeonMode &&
      window.playerStats.activeDungeonSigil?.debuffs.some(
        (d) => d.id === "static_feedback",
      )
    ) {
      let p = window.resolvePlayerStats();
      let selfDmg = Math.ceil(p.maxHp * 0.02);
      window.playerStats.currentHp = Math.max(
        1,
        window.playerStats.currentHp - selfDmg,
      );
      window.effects.push({
        x: window.hero.x,
        y: window.hero.y,
        text: "-" + selfDmg + " [STATIC]",
        color: "#e74c3c",
        life: 30,
      });
      if (window.playerStats.currentHp <= 1) {
        window.playerStats.currentHp = 0;
        window.deathAnimationTimer = window.deathMaxFrames;
      }
      window.updateUI();
    }
    window.playerStats.canvasClicksWindow =
      window.playerStats.canvasClicksWindow || [];
    let clickNow = Date.now();
    window.playerStats.canvasClicksWindow.push(clickNow);
    window.playerStats.canvasClicksWindow =
      window.playerStats.canvasClicksWindow.filter(
        (t) => clickNow - t <= 10000,
      );
    window.playerStats.maxCanvasClicksInWindow = Math.max(
      window.playerStats.maxCanvasClicksInWindow || 0,
      window.playerStats.canvasClicksWindow.length,
    );

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    let clientX = e.clientX;
    let clientY = e.clientY;
    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if (e.changedTouches && e.changedTouches.length > 0) {
      clientX = e.changedTouches[0].clientX;
      clientY = e.changedTouches[0].clientY;
    }

    const clickX = clientX !== undefined ? (clientX - rect.left) * scaleX : 0;
    const clickY = clientY !== undefined ? (clientY - rect.top) * scaleY : 0;

    if (
      window.equippedSlots.weapon &&
      window.equippedSlots.weapon.isUniqueSingularity &&
      window.playerStats.singularityState === "pulsing"
    ) {
      let sigilX = window.hero.x + 12;
      let sigilY = window.hero.y + 15 - 35;
      let dist = Math.hypot(clickX - sigilX, clickY - sigilY);
      if (dist < 30) {
        window.playerStats.singularityState = "storing";
        window.playerStats.singularityTimer = 300;
        window.playerStats.singularityStoredDmg = 0;
        window.pushLog(
          "<span style='color:#e84393; font-weight:bold;'>[SINGULARITY] Gravitational collapse active! Attack with everything you have! All damage is stored and multiplied!</span>",
        );
        for (let i = 0; i < 20; i++) {
          let angle = (i * Math.PI) / 10;
          window.particles.push({
            x: sigilX,
            y: sigilY,
            vx: Math.cos(angle) * 3,
            vy: Math.sin(angle) * 3,
            radius: 2,
            color: "#e84393",
            alpha: 1,
            life: 30,
          });
        }
        window.updateUI();
        return;
      }
    }

    let clickedFairy = window.activeFairies.find((f) => {
      let hover = Math.sin(Date.now() / 200 + f.offset) * 10;
      return Math.hypot(clickX - f.x, clickY - (f.y + hover)) < 40;
    });
    if (clickedFairy) {
      window.triggerFairyLoot(clickedFairy);
      return;
    }

    window.activeCanvasPointers.add(e.pointerId);
    window.isCanvasPressed = true;
    window.registerMaelstromTap();
    window.triggerPlayerSlash();
    if (typeof window.progressMission === "function") {
      window.progressMission("active_clicks", 1);
    }

    // Active Debuff: Static Feedback (Click self-damage)
    if (
      window.playerStats.isCrucibleMode &&
      window.playerStats.crucibleActiveDebuff?.id === "static_feedback"
    ) {
      let p = window.resolvePlayerStats();
      let debuffStrength =
        window.playerStats.crucibleInfusedType === "debuff" ? 1.5 : 1.0;
      let selfDmg = Math.ceil(p.maxHp * (0.02 * debuffStrength));
      window.playerStats.currentHp = Math.max(
        1,
        window.playerStats.currentHp - selfDmg,
      );
      window.effects.push({
        x: window.hero.x,
        y: window.hero.y,
        text: "-" + selfDmg + " [STATIC]",
        color: "#e74c3c",
        life: 30,
      });
      if (window.playerStats.currentHp <= 1) {
        window.playerStats.currentHp = 0;
        window.deathAnimationTimer = window.deathMaxFrames;
      }
      window.updateUI();
    }
  });

  window.addEventListener("pointerup", (e) => {
    try {
      canvas.releasePointerCapture(e.pointerId);
    } catch (err) {}
    window.activeCanvasPointers.delete(e.pointerId);
    if (window.activeCanvasPointers.size === 0) {
      window.isCanvasPressed = false;
    }
  });
  window.addEventListener("pointercancel", (e) => {
    try {
      canvas.releasePointerCapture(e.pointerId);
    } catch (err) {}
    window.activeCanvasPointers.delete(e.pointerId);
    if (window.activeCanvasPointers.size === 0) {
      window.isCanvasPressed = false;
    }
  });
  window.addEventListener("blur", () => {
    window.activeCanvasPointers.clear();
    window.isCanvasPressed = false;
  });

  document.addEventListener("pointerdown", (e) => {
    if (
      !e.target.closest("#game-tooltip") &&
      !e.target.closest(".bag-item") &&
      !e.target.closest(".slots-card") &&
      !e.target.closest(".stat-hover") &&
      !e.target.closest(".shop-row") &&
      !e.target.closest("#hud-buff")
    ) {
      window.hideTooltip();
    }
    let achModal = document.getElementById("achievements-modal");
    if (achModal && achModal.style.display === "block") {
      if (
        !e.target.closest("#achievements-modal") &&
        !e.target.closest("#btn-achievements")
      ) {
        achModal.style.display = "none";
        window.hideTooltip();
      }
    }

    // Auto-close Activities dropdown menu if clicking outside of it
    let dungMenu = document.getElementById("dungeon-menu");
    if (dungMenu && dungMenu.style.display === "block") {
      if (
        !e.target.closest("#dungeon-menu") &&
        !e.target.closest('button[onclick*="toggleDungeonMenu"]')
      ) {
        dungMenu.style.display = "none";
      }
    }

    // Auto-close Settings menu if clicking outside of it
    let settingsModal = document.getElementById("settings-modal");
    if (settingsModal && settingsModal.style.display === "block") {
      if (
        !e.target.closest("#settings-modal") &&
        !e.target.closest('button[onclick*="toggleSettings"]')
      ) {
        settingsModal.style.display = "none";
        window.hideTooltip();
      }
    }
  });

  requestAnimationFrame(engineCycle);
  window.updateUI();
};

let lastRenderTime = 0;
function engineCycle() {
  try {
    update(); // State ticks still execute at a liquid 60 ticks per second

    let now = Date.now();
    let limit =
      window.playerStats && window.playerStats.ecoMode ? 1000 / 30 : 0;

    if (now - lastRenderTime >= limit) {
      window.draw(); // Draws at 30 FPS if Eco Mode is enabled, saving massive thermal output
      lastRenderTime = now;
    }

    requestAnimationFrame(engineCycle);
  } catch (err) {
    console.error("Engine Crash:", err);
    if (window.ctx) {
      window.ctx.fillStyle = "#c0392b";
      window.ctx.fillRect(0, 0, window.canvas.width, window.canvas.height);
      window.ctx.fillStyle = "#ffffff";
      window.ctx.font = "bold 14px monospace";
      window.ctx.fillText("⚠️ ENGINE CRASH DETECTED", 20, 30);
      window.ctx.font = "12px monospace";
      window.ctx.fillText("Error: " + err.message, 20, 60);
    }
  }
}

// --- DYNAMIC LOOP PHYSICAL AUDIT ---

window.flowerColors = [
  "#e74c3c",
  "#9b59b6",
  "#f1c40f",
  "#3498db",
  "#e67e22",
  "#e84393",
];

window.scrollScenery = function (scrollSpeed) {
  window.groundScroll = (window.groundScroll + scrollSpeed) % canvas.width;
  window.bgScenery.forEach((s) => {
    s.x -= scrollSpeed * 0.6;
    if (s.x < -50) {
      s.x = canvas.width + Math.random() * 50;
      s.seed = Math.random();
      s.size = Math.random() * 0.5 + 0.5;
      s.type = Math.random() > 0.5 ? "tree" : "bush";
    }
  });
  window.fgScenery.forEach((s) => {
    s.x -= scrollSpeed;
    if (s.x < -60) {
      s.x = canvas.width + Math.random() * 50;
      s.seed = Math.random();
      s.size = Math.random() * 0.7 + 0.5;
      let fgType = Math.random();
      s.type = fgType > 0.8 ? "bush" : fgType > 0.5 ? "flower" : "grass";
      s.color =
        window.flowerColors[
          Math.floor(Math.random() * window.flowerColors.length)
        ];
    }
  });
};

function update() {
  let now = Date.now();
  let gapMs = now - window.lastUpdateTime;

  let stateBefore =
    (window.playerStats.frenzyTimer > 0) |
    ((window.playerStats.adrenalineTimer > 0) << 1) |
    ((window.playerStats.atkPotionTimer > 0) << 2) |
    ((window.playerStats.hpPotionTimer > 0) << 3) |
    ((window.playerStats.defPotionTimer > 0) << 4) |
    ((window.playerStats.hastePotionTimer > 0) << 5) |
    ((window.playerStats.xpPotionTimer > 0) << 6) |
    ((window.playerStats.dropPotionTimer > 0) << 7) |
    ((window.playerStats.qlyPotionTimer > 0) << 8);

  if (
    window.equippedSlots.subweapon &&
    window.equippedSlots.subweapon.isUniqueWatch &&
    !window.isGamePaused
  ) {
    window.playerStats.watchTick = (window.playerStats.watchTick || 0) + 1;
    if (window.playerStats.watchActiveTimer > 0) {
      window.playerStats.watchActiveTimer--;
      if (window.playerStats.watchActiveTimer === 0) {
        window.pushLog(
          "<span style='color:#f1c40f;'>[CHRONOS WATCH] Temporal Fracture collapsed! Speeds normalized.</span>",
        );
        window.updateUI();
      }
    } else {
      if (window.playerStats.watchTick >= 1200) {
        window.playerStats.watchTick = 0;
        window.playerStats.watchActiveTimer = 240;
        window.pushLog(
          "<span style='color:#f1c40f; font-weight:bold;'>[CHRONOS WATCH] A Temporal Fracture opened! speeds dilated (+15% speed, -25% enemy speed).</span>",
        );
        window.updateUI();
      }
    }
  }

  for (let i = window.effects.length - 1; i >= 0; i--) {
    let eff = window.effects[i];
    eff.x += eff.vx !== undefined ? eff.vx : 0;
    eff.y += eff.vy !== undefined ? eff.vy : -0.4;
    eff.life--;
    if (eff.life <= 0) window.effects.splice(i, 1);
  }
  // High-Performance Zero-Allocation In-Place Compaction Pass for Mobile Hardware
  let ptActiveCount = 0;
  for (let i = 0; i < window.particles.length; i++) {
    let pt = window.particles[i];
    pt.life--;
    if (pt.life > 0) {
      pt.x += pt.vx;
      pt.y += pt.vy;
      pt.vy += pt.gravity !== undefined ? pt.gravity : 0.25;
      if (pt.growth !== undefined) pt.radius += pt.growth;
      if (pt.maxLife && pt.fade) pt.alpha = pt.life / pt.maxLife;
      window.particles[ptActiveCount++] = pt; // Compact array in-place (no splices!)
    }
  }
  window.particles.length = ptActiveCount;
  for (let i = window.beams.length - 1; i >= 0; i--) {
    let bm = window.beams[i];
    bm.life--;
    if (bm.life <= 0) window.beams.splice(i, 1);
  }

  if (window.deathAnimationTimer > 0) {
    window.deathAnimationTimer--;
    let p = window.resolvePlayerStats();
    let speedFactor = window.deathAnimationTimer / window.deathMaxFrames;
    let scrollSpeed = (2 + p.moveSpeed * 0.05) * speedFactor;
    scrollScenery(scrollSpeed);

    if (Math.random() < 0.7) {
      window.particles.push({
        x: window.hero.x + 12 + window.randFloat(-10, 10),
        y: window.hero.y + 15 + window.randFloat(-15, 15),
        vx: window.randFloat(-2, 2),
        vy: window.randFloat(-3, -0.5),
        radius: window.randFloat(1.5, 3),
        color: Math.random() > 0.4 ? "#c0392b" : "#2c3e50",
        alpha: 1,
        life: window.randInt(20, 40),
      });
    }
    if (window.deathAnimationTimer === 0) {
      window.handlePlayerDefeat();
    }
    window.lastUpdateTime = now;
    return;
  }

  if (window.isGamePaused) {
    window.lastUpdateTime = now;
    return;
  }

  let maxOfflineMs = 28800 * 1000;
  if (gapMs > maxOfflineMs) {
    window.applyOfflineGains(maxOfflineMs);
    window.lastUpdateTime = now;
  } else if (gapMs > 60000) {
    let consumedMs = window.applyOfflineGains(gapMs);
    window.lastUpdateTime += consumedMs;
  } else {
    window.lastUpdateTime = now;
  }

  if (window.getStageTier() === 1 && !window.playerStats.isDungeonMode) {
    if (Math.random() < 0.4) {
      window.snowflakes.push({
        x: Math.random() * canvas.width,
        y: -10,
        r: Math.random() * 1.8 + 0.8,
        speed: Math.random() * 0.8 + 0.4,
        swingSpeed: Math.random() * 0.02 + 0.01,
        swingRange: Math.random() * 1.5 + 0.5,
      });
    }
  } else {
    window.snowflakes = [];
  }

  // Spawn floating swamp spores in the Forest environment (Tier 0)
  if (
    window.getStageTier() === 0 &&
    !window.playerStats.isDungeonMode &&
    !window.playerStats.isCrucibleMode &&
    !window.playerStats.isPrestigeBossMode &&
    !window.isGamePaused
  ) {
    if (Math.random() < 0.08 && window.particles.length < 250) {
      window.particles.push({
        x: Math.random() * canvas.width,
        y: 220 + Math.random() * 80,
        vx: (Math.random() - 0.5) * 0.4,
        vy: -window.randFloat(0.25, 0.65),
        radius: window.randFloat(0.8, 1.8),
        color:
          Math.random() > 0.5
            ? "rgba(46, 204, 113, 0.55)"
            : "rgba(0, 255, 136, 0.4)",
        alpha: 1.0,
        gravity: -0.01, // Float upward slowly
        life: window.randInt(60, 110),
      });
    }
  }
  for (let i = window.snowflakes.length - 1; i >= 0; i--) {
    let sf = window.snowflakes[i];
    sf.y += sf.speed;
    sf.x += Math.sin(window.logicClock * sf.swingSpeed) * sf.swingRange * 0.4;
    if (sf.y > canvas.height + 10 || sf.x < -10 || sf.x > canvas.width + 10)
      window.snowflakes.splice(i, 1);
  }

  // Unified Dungeon Keys real-time regeneration (max 5 keys, 6-hour rate)
  if (window.playerStats.dungeonKeys < 5) {
    if (!window.playerStats.nextDungeonKeyTime) {
      window.playerStats.nextDungeonKeyTime = now + 21600000; // 6 Hours
    } else if (now >= window.playerStats.nextDungeonKeyTime) {
      let msOver = now - window.playerStats.nextDungeonKeyTime;
      let keysEarned = 1 + Math.floor(msOver / 21600000);
      window.playerStats.dungeonKeys = Math.min(
        5,
        window.playerStats.dungeonKeys + keysEarned,
      );
      window.playerStats.nextDungeonKeyTime =
        window.playerStats.dungeonKeys < 5
          ? now + (21600000 - (msOver % 21600000))
          : 0;
    }
  }

  // Synchronize dynamic keys, timers, and shop refreshes at a throttled interval (twice a second) to prevent layout thrashing
  if (window.logicClock % 30 === 0) {
    let textKeys = window.playerStats.dungeonKeys;
    let timerText = "";
    if (window.playerStats.dungeonKeys < 5) {
      let msLeft = Math.max(0, window.playerStats.nextDungeonKeyTime - now);
      let hours = Math.floor(msLeft / 3600000);
      let mins = Math.floor((msLeft % 3600000) / 60000);
      let secs = Math.floor((msLeft % 60000) / 1000);
      timerText = hours > 0 ? `(${hours}h ${mins}m)` : `(${mins}m ${secs}s)`;
    }

    // List of key IDs for the three dungeons in popups and tabs
    let keyIds = ["equip", "gold", "mat", "generic"];
    keyIds.forEach((k) => {
      let pTimer = document.getElementById("dt-" + k);
      let pKeys = document.getElementById("dk-" + k);
      if (pTimer) pTimer.innerText = timerText;
      if (pKeys) pKeys.innerText = textKeys;

      let tTimer = document.getElementById("tab-dt-" + k);
      let tKeys = document.getElementById("tab-dk-" + k);
      if (tTimer) tTimer.innerText = timerText;
      if (tKeys) tKeys.innerText = textKeys;
    });

    if (
      document.getElementById("tab-market") &&
      document.getElementById("tab-market").classList.contains("active")
    ) {
      if (now >= window.playerStats.shopRefreshTime) {
        window.refreshMarketShopIfNeeded();
      } else {
        let msLeft = window.playerStats.shopRefreshTime - now;
        let mins = Math.floor((msLeft % 3600000) / 60000)
          .toString()
          .padStart(2, "0");
        let secs = Math.floor((msLeft % 60000) / 1000)
          .toString()
          .padStart(2, "0");
        let timerEl = document.getElementById("market-timer");
        if (timerEl) timerEl.innerText = `Refreshes in: ${mins}:${secs}`;
      }
    }
  }

  let p = window.resolvePlayerStats();
  let scrollSpeed = 2 + p.moveSpeed * 0.05;

  if (window.spacePressed || window.isCanvasPressed) {
    window.triggerPlayerSlash();
  }
  if (window.mob && window.mob.hp <= 0) window.handleMobDeath();
  if (window.mob && window.mob.flashTimer > 0) window.mob.flashTimer--;
  if (window.mob && window.mob.funnyTextTimer > 0) window.mob.funnyTextTimer--;

  if (window.mob && window.mob.hp > 0) {
    if (window.mob.trailingHp === undefined)
      window.mob.trailingHp = window.mob.hp;
    if (window.mob.trailingHp > window.mob.hp) {
      window.mob.trailingHp = Math.max(
        window.mob.hp,
        window.mob.trailingHp -
          window.mob.maxHp * 0.005 -
          (window.mob.trailingHp - window.mob.hp) * 0.08,
      );
    }
    if (window.mob.bleedTimer && window.mob.bleedTimer > 0) {
      window.mob.bleedTimer--;
      window.mob.bleedTickCounter = (window.mob.bleedTickCounter || 0) + 1;
      if (window.mob.bleedTickCounter >= 15) {
        window.mob.bleedTickCounter = 0;
        let stacks = window.mob.bleedStacks || 1;
        let bleedDmg = Math.max(
          1,
          Math.ceil(((window.mob.bleedDmgPerSecond || 1) * stacks) / 4),
        );
        window.mob.hp -= bleedDmg;
        window.mob.flashTimer = 5;
        for (let i = 0; i < 3; i++) {
          window.particles.push({
            x: window.mob.x + window.mob.w / 2 + window.randFloat(-10, 10),
            y: window.mob.y + window.mob.h / 2 + window.randFloat(-10, 10),
            vx: window.randFloat(-1.0, 1.0),
            vy: window.randFloat(-2.5, -0.5),
            radius: window.randFloat(1.2, 2.5),
            color: "#960018",
            alpha: 1,
            life: window.randInt(10, 18),
          });
        }
        window.spawnDamageEffect(bleedDmg, "bleed", false);
        window.damageHistory.push({ time: Date.now(), amount: bleedDmg });
        if (window.mob.hp <= 0) window.handleMobDeath();
      }
    }
  }

  if (window.playerStats.frenzyTimer > 0) window.playerStats.frenzyTimer--;
  if (window.playerStats.adrenalineTimer > 0)
    window.playerStats.adrenalineTimer--;
  if (window.playerStats.galeCooldown > 0) window.playerStats.galeCooldown--;
  if (window.playerStats.warpCoreSprintTimer > 0) {
    window.playerStats.warpCoreSprintTimer--;
    if (window.playerStats.warpCoreSprintTimer <= 0) {
      window.invalidatePlayerStats();
    }
  }

  if (window.playerStats.galeResonanceTimer > 0) {
    window.playerStats.galeResonanceTimer--;
    if (window.playerStats.galeResonanceTimer <= 0) {
      window.detonateGaleFlurry();
    }
  }

  if (window.playerStats.atkPotionTimer > 0)
    window.playerStats.atkPotionTimer--;
  if (window.playerStats.hpPotionTimer > 0) window.playerStats.hpPotionTimer--;
  if (window.playerStats.defPotionTimer > 0)
    window.playerStats.defPotionTimer--;
  if (window.playerStats.hastePotionTimer > 0)
    window.playerStats.hastePotionTimer--;
  if (window.playerStats.xpPotionTimer > 0) window.playerStats.xpPotionTimer--;
  if (window.playerStats.dropPotionTimer > 0)
    window.playerStats.dropPotionTimer--;
  if (window.playerStats.qlyPotionTimer > 0)
    window.playerStats.qlyPotionTimer--;
  if (window.playerStats.xpPotionTimer > 0) window.playerStats.xpPotionTimer--;
  if (window.playerStats.dropPotionTimer > 0)
    window.playerStats.dropPotionTimer--;
  if (window.playerStats.qlyPotionTimer > 0)
    window.playerStats.qlyPotionTimer--;

  if (window.hero.attackTimer > 0) {
    window.hero.attackTimer--;
    let cooldownCap =
      window.playerStats.frenzyTimer > 0 ? 4 : p.activeAttackSpeed;
    window.hero.slashFrame = window.hero.attackTimer > cooldownCap - 6;
  }

  window.playerStats.sessionPlaytime =
    (window.playerStats.sessionPlaytime || 0) + 1000 / 60;
  if (window.playerStats.isDungeonMode || window.playerStats.isCrucibleMode) {
    window.playerStats.activityTimer =
      (window.playerStats.activityTimer || 0) + 1000 / 60;
    if (window.playerStats.activityTimer >= 600000)
      window.playerStats.hasTriggeredAethericRecharge = true;
  } else {
    window.playerStats.activityTimer = 0;
  }

  window.logicClock++;
  if (window.logicClock % 60 === 0) {
    if (typeof window.checkAndResetMissions === "function")
      window.checkAndResetMissions();
    if (typeof window.checkAchievements === "function")
      window.checkAchievements();

    // Active Debuff: Withering Decay (Periodic combat damage drain)
    if (
      window.playerStats.isCrucibleMode &&
      window.playerStats.crucibleActiveDebuff?.id === "withering_decay" &&
      window.mob &&
      window.mob.hp > 0
    ) {
      let debuffStrength =
        window.playerStats.crucibleInfusedType === "debuff" ? 1.5 : 1.0;
      let decayAmt = Math.ceil(
        window.playerStats.currentHp * (0.015 * debuffStrength),
      );
      window.playerStats.currentHp = Math.max(
        1,
        window.playerStats.currentHp - decayAmt,
      );
      window.effects.push({
        x: window.hero.x,
        y: window.hero.y,
        text: "-" + decayAmt + " [DECAY]",
        color: "#e74c3c",
        life: 30,
      });
      window.updateUI();
    }
  }

  if (
    window.equippedSlots.weapon &&
    window.equippedSlots.weapon.isUniqueSingularity
  ) {
    if (window.playerStats.singularityTimer === undefined)
      window.playerStats.singularityTimer = 1800;
    if (window.playerStats.singularityState === undefined)
      window.playerStats.singularityState = "dormant";

    if (window.playerStats.singularityState === "dormant") {
      window.playerStats.singularityTimer--;
      if (window.playerStats.singularityTimer <= 0) {
        window.playerStats.singularityState = "pulsing";
        window.playerStats.singularityTimer = 420;
        window.pushLog(
          "<span style='color:#8e44ad; font-weight:bold;'>[SINGULARITY] Your weapon is pulsating! Tap the Sigil to enter Storing mode!</span>",
        );
        window.updateUI();
      }
    } else if (window.playerStats.singularityState === "pulsing") {
      window.playerStats.singularityTimer--;
      if (window.playerStats.singularityTimer <= 0) {
        window.playerStats.singularityState = "dormant";
        window.playerStats.singularityTimer = 1800;
        window.updateUI();
      }
    } else if (window.playerStats.singularityState === "storing") {
      window.playerStats.singularityTimer--;
      if (window.mob && Math.random() < 0.6) {
        let angle = Math.random() * Math.PI * 2;
        let rad = 35 + Math.random() * 20;
        window.particles.push({
          x: window.mob.x + window.mob.w / 2 + Math.cos(angle) * rad,
          y: window.mob.y + window.mob.h / 2 + Math.sin(angle) * rad,
          vx: -Math.cos(angle) * 2.5,
          vy: -Math.sin(angle) * 2.5,
          radius: window.randFloat(1.5, 3.0),
          color: "#8e44ad",
          alpha: 1,
          gravity: 0,
          life: 20,
        });
      }
      if (window.playerStats.singularityTimer <= 0 || !window.mob) {
        window.playerStats.singularityState = "dormant";
        window.playerStats.singularityTimer = 1800;
        if (window.mob) {
          let finalStored = window.playerStats.singularityStoredDmg || 0;
          let shieldLvl = window.equippedSlots.weapon.stageLevel || 1;
          let mult = 1.4 + shieldLvl * 0.015;
          if (mult > 2.25) mult = 2.25;

          let finalDetonationDmg = Math.ceil(finalStored * mult);
          let maxCap = Math.ceil(window.mob.maxHp * 1.5);
          if (finalDetonationDmg > maxCap) {
            finalDetonationDmg = maxCap;
            window.pushLog(
              "<span style='color:#e74c3c;'>[SINGULARITY] Detonation capped at 150% of monster maximum health.</span>",
            );
          }
          window.mob.hp -= finalDetonationDmg;
          window.mob.flashTimer = 10;
          window.spawnDamageEffect(finalDetonationDmg, "lightning", true);
          window.damageHistory.push({
            time: Date.now(),
            amount: finalDetonationDmg,
          });
          window.effects.push({
            x: window.mob.x,
            y: window.mob.y - 15,
            text: "🌌 VOID EXPLOSION!",
            color: "#e84393",
            life: 60,
          });
          canvas.classList.add("shake");
          setTimeout(() => canvas.classList.remove("shake"), 400);
          window.SoundManager.play("death");

          window.beams.push({
            x: window.mob.x + window.mob.w / 2,
            color: "#e84393",
            life: 45,
            maxLife: 45,
          });
          for (let i = 0; i < 40; i++) {
            let angle = Math.random() * Math.PI * 2;
            let vel = window.randFloat(4, 9);
            window.particles.push({
              x: window.mob.x + window.mob.w / 2,
              y: window.mob.y + window.mob.h / 2,
              vx: Math.cos(angle) * vel,
              vy: Math.sin(angle) * vel - 1.0,
              radius: window.randFloat(2.5, 5.5),
              color: i % 2 === 0 ? "#e84393" : "#8e44ad",
              alpha: 1,
              life: window.randInt(20, 40),
            });
          }
          if (window.mob.hp <= 0) window.handleMobDeath();
        }
        window.updateUI();
      }
    }
  } else {
    window.playerStats.singularityState = "dormant";
    window.playerStats.singularityTimer = 1800;
  }

  if (
    window.equippedSlots.weapon &&
    window.equippedSlots.weapon.isUniqueStaff
  ) {
    if (window.playerStats.fireballCooldown === undefined)
      window.playerStats.fireballCooldown = 0;
    if (window.playerStats.fireballCooldown > 0)
      window.playerStats.fireballCooldown--;
    if (
      window.playerStats.fireballCooldown <= 0 &&
      window.mob &&
      window.mob.hp > 0
    ) {
      window.projectiles.push({
        x: window.hero.x + 35,
        y: window.hero.y + 10,
        r: 10,
        hitMobs: [],
        pulseOffset: Math.random() * 10,
      });
      window.playerStats.fireballCooldown = 180;
      window.SoundManager.play("spell");
      for (let i = 0; i < 8; i++) {
        window.particles.push({
          x: window.hero.x + 35,
          y: window.hero.y + 10,
          vx: window.randFloat(1, 3),
          vy: window.randFloat(-2, 2),
          radius: window.randFloat(1.5, 3),
          color: "#e67e22",
          alpha: 1,
          life: window.randInt(15, 25),
        });
      }
    }
  }

  for (let i = window.projectiles.length - 1; i >= 0; i--) {
    let proj = window.projectiles[i];
    let projSpeed = scrollSpeed + 4.5;
    proj.x += projSpeed;
    if (Math.random() < 0.4) {
      window.particles.push({
        x: proj.x - 5,
        y: proj.y + Math.sin(window.logicClock * 0.2) * 5,
        vx: -window.randFloat(0.5, 1.5),
        vy: window.randFloat(-1, 1),
        radius: window.randFloat(2, 4),
        color: Math.random() > 0.4 ? "#e74c3c" : "#f1c40f",
        alpha: 1,
        life: window.randInt(10, 20),
      });
    }
    if (
      window.mob &&
      window.mob.hp > 0 &&
      !proj.hitMobs.includes(window.mob.id)
    ) {
      if (
        proj.x + proj.r > window.mob.x &&
        proj.x - proj.r < window.mob.x + window.mob.w
      ) {
        proj.hitMobs.push(window.mob.id);
        let mobDef = window.mob.def || 0;
        if (proj.isMaelstromCrescent) {
          let windDmg = Math.max(1, Math.ceil(p.atk * 0.5));
          windDmg = Math.max(1, Math.ceil(windDmg * (100 / (100 + mobDef))));

          if (window.playerStats.singularityState === "storing") {
            window.playerStats.singularityStoredDmg += windDmg;
            window.effects.push({
              x: window.mob.x + window.mob.w / 2,
              y: window.mob.y - 10,
              text: `+${window.formatNumber(windDmg)} [STORED]`,
              color: "#8e44ad",
              life: 45,
            });
          } else {
            window.mob.hp -= windDmg;
            window.mob.flashTimer = 5;
            window.spawnDamageEffect(windDmg, "echo", false);
            window.damageHistory.push({ time: Date.now(), amount: windDmg });
            if (
              !window.playerStats.isDungeonMode &&
              !window.playerStats.isCrucibleMode &&
              !window.playerStats.isBossMode &&
              !window.playerStats.isFarmingLoop
            ) {
              window.playerStats.killCount = Math.min(
                window.playerStats.targetsRequired,
                window.playerStats.killCount + 1,
              );
              window.effects.push({
                x: window.hero.x + 12,
                y: window.hero.y - 12,
                text: "⏩ PROGRESS SKIP!",
                color: "#2ecc71",
                life: 55,
              });
              if (
                window.playerStats.killCount >=
                window.playerStats.targetsRequired
              )
                window.playerStats.isBossMode = true;
            }
          }
        } else {
          let flameDmg = Math.max(1, Math.ceil(p.atk * 0.25));
          flameDmg = Math.max(1, Math.ceil(flameDmg * (100 / (100 + mobDef))));

          if (window.playerStats.singularityState === "storing") {
            window.playerStats.singularityStoredDmg += flameDmg;
            window.effects.push({
              x: window.mob.x + window.mob.w / 2,
              y: window.mob.y - 10,
              text: `+${window.formatNumber(flameDmg)} [STORED]`,
              color: "#8e44ad",
              life: 45,
            });
          } else {
            window.mob.hp -= flameDmg;
            window.mob.flashTimer = 5;
            window.spawnDamageEffect(flameDmg, "fire", false);
            window.damageHistory.push({ time: Date.now(), amount: flameDmg });
          }
        }
        for (let pIdx = 0; pIdx < 6; pIdx++) {
          window.particles.push({
            x: proj.x,
            y: proj.y,
            vx: window.randFloat(-2, 3),
            vy: window.randFloat(-2, 2),
            radius: window.randFloat(1.5, 3),
            color: "#f1c40f",
            alpha: 1,
            life: window.randInt(10, 18),
          });
        }
        if (window.mob && window.mob.hp <= 0) window.handleMobDeath();
      }
    }
    if (proj.x > canvas.width + 50) window.projectiles.splice(i, 1);
  }

  if (window.activeFairies.length === 0 && Math.random() < 0.00005) {
    let val = p.fairySpawn;
    let numToSpawn = 0;
    if (val < 1.0) {
      if (Math.random() < val) numToSpawn = 1;
    } else {
      numToSpawn = Math.floor(val);
      if (Math.random() < val - numToSpawn) numToSpawn++;
    }
    for (let i = 0; i < numToSpawn; i++) {
      window.activeFairies.push({
        id: window.idCounter++,
        x: -50 - i * 35,
        y: 80 + Math.random() * 60,
        offset: i * 2,
        speed: window.randFloat(1.0, 1.4),
        color:
          i === 0
            ? "#ffb6c1"
            : i === 1
              ? "#74b9ff"
              : i === 2
                ? "#55efc4"
                : "#ffeaa7",
      });
    }
  }
  for (let i = window.activeFairies.length - 1; i >= 0; i--) {
    let f = window.activeFairies[i];
    f.x += f.speed;
    if (f.x > canvas.width + 50) window.activeFairies.splice(i, 1);
  }

  if (
    window.playerStats.isPrestigeBossMode &&
    window.playerStats.prestigeApproachTimer > 0
  ) {
    window.playerStats.prestigeApproachTimer--;
    let chargeScrollSpeed = (2 + p.moveSpeed * 0.05) * 3;
    scrollScenery(chargeScrollSpeed);
    let targetHeroX = canvas.width - 180;
    window.hero.x +=
      (targetHeroX - window.hero.x) /
      (window.playerStats.prestigeApproachTimer + 1);

    if (Math.random() < 0.5) {
      window.particles.push({
        x: canvas.width + 10,
        y: 50 + Math.random() * 120,
        vx: -window.randFloat(8, 14),
        vy: 0,
        radius: window.randFloat(1, 2),
        color: "rgba(255, 255, 255, 0.25)",
        alpha: 1,
        life: 60,
      });
    }
    if (window.playerStats.prestigeApproachTimer === 0) {
      let activeStage = window.playerStats.selectedPrestigeStage || 80; // Scales to selector stage
      let growthRate = 1.045 + (activeStage * 0.04) / (activeStage + 200);
      let scale = Math.pow(growthRate, activeStage);

      // Hooktail scales dynamically based on the selected Stage level, creating a high-risk high-reward choice
      let hp = 600 * scale;
      let dmg = 6 * scale;
      let def = 80 + (activeStage - 80) * 1.5;

      window.mob = {
        x: canvas.width - 230,
        y: 65,
        w: 180,
        h: 160,
        type: "prestige_boss",
        isRare: false,
        hp: Math.floor(hp),
        maxHp: Math.floor(hp),
        damage: Math.floor(dmg),
        def: Math.floor(def),
        flashTimer: 0,
        isStopped: false,
        attackCooldown: 75,
        attackTimer: 75,
      };
      window.pushLog(
        `<span style='color:#e74c3c; font-weight:bold;'>[ASCENSION] HOOKTAIL APPEARS! (Current Stage: ${activeStage} • Power Scale: ${scale.toFixed(1)}x) Slay her to Ascend!</span>`,
      );
    }
    window.logicClock++;
    return;
  }

  if (!window.mob) {
    window.processEnemySpawn();
    scrollScenery(scrollSpeed);
  } else {
    if (
      window.mob.isRare &&
      Math.random() < 0.1 &&
      window.particles.length < 200
    ) {
      window.particles.push({
        x: window.mob.x + Math.random() * window.mob.w,
        y: window.mob.y + Math.random() * window.mob.h,
        vx: (Math.random() - 0.5) * 2,
        vy: -Math.random() * 3,
        radius: Math.random() * 2 + 1,
        color: "#f1c40f",
        alpha: 1,
        life: 20,
      });
    }
    let isHooktail = window.mob.type === "prestige_boss";
    if (isHooktail) {
      window.mob.x = canvas.width - 230;
      window.mob.isStopped = true;
    }

    if (!isHooktail && window.mob.x > window.hero.x + window.hero.w + 30) {
      window.mob.x -= 4 + scrollSpeed;
      window.mob.isStopped = false;
      scrollScenery(scrollSpeed);
    } else {
      window.mob.isStopped = true;
      if (
        window.logicClock % p.idleAttackSpeed === 0 &&
        window.state.autoAttack
      ) {
        window.triggerPlayerSlash();
      }
      if (!window.mob) return;

      if (isHooktail && Math.random() < 0.2 && window.particles.length < 200) {
        let hoverY = Math.sin(Date.now() / 150) * 6;
        window.particles.push({
          x: window.mob.x - 35,
          y: window.mob.y + 55 + hoverY,
          vx: window.randFloat(-0.4, 0.2),
          vy: -window.randFloat(1.2, 2.2),
          gravity: -0.06,
          radius: window.randFloat(3.0, 5.0),
          growth: 0.15,
          color:
            Math.random() > 0.5
              ? "rgba(60, 60, 65, 0.65)"
              : "rgba(30, 30, 35, 0.65)",
          alpha: 0.75,
          fade: true,
          maxLife: 80,
          life: window.randInt(60, 80),
        });
      }

      if (window.mob.attackTimer === undefined)
        window.mob.attackTimer = window.mob.attackCooldown || 120;
      if (!window.isGamePaused) window.mob.attackTimer--;

      if (window.mob.attackTimer <= 0 && window.mob && window.mob.hp > 0) {
        window.mob.attackTimer = window.mob.attackCooldown || 120;

        let isBlocked = Math.random() < p.block;
        let isParried = !isBlocked && Math.random() < p.parry;

        if (isParried) {
          window.effects.push({
            x: window.hero.x,
            y: window.hero.y - 15,
            text: "⚡ PARRY COUNTER!",
            color: "#9b59b6",
            life: 50,
          });
          window.SoundManager.play("parry");

          // Active Buff: Echoing Step (Counter strike scaling on parry)
          if (
            window.playerStats.isCrucibleMode &&
            window.playerStats.crucibleActiveBuff?.id === "echoing_step"
          ) {
            let buffStrength =
              window.playerStats.crucibleInfusedType === "buff" ? 1.5 : 1.0;
            let counterDmg = Math.ceil(p.atk * (1.0 * buffStrength));
            window.mob.hp -= counterDmg;
            window.spawnDamageEffect(counterDmg, "counter", false);
            window.damageHistory.push({ time: Date.now(), amount: counterDmg });
            if (window.mob.hp <= 0) {
              window.handleMobDeath();
              return;
            }
          }
          window.playerStats.totalDeflections =
            (window.playerStats.totalDeflections || 0) + 1;
          window.playerStats.recentParryTime = Date.now();
          window.playerStats.consecutiveParries =
            (window.playerStats.consecutiveParries || 0) + 1;
          if (window.playerStats.consecutiveParries >= 3)
            window.playerStats.hasTriggeredPerfectDeflection = true;

          if (
            window.playerStats.recentCritTime &&
            window.playerStats.recentBlockTime &&
            window.playerStats.recentParryTime
          ) {
            let times = [
              window.playerStats.recentCritTime,
              window.playerStats.recentBlockTime,
              window.playerStats.recentParryTime,
            ];
            if (Math.max(...times) - Math.min(...times) <= 1000)
              window.playerStats.hasTriggeredLuckySeven = true;
          }
          if (
            window.equippedSlots.subweapon &&
            window.equippedSlots.subweapon.subType === "dagger"
          )
            window.playerStats.daggerParryStagger = true;
          if (window.checkArtifactTrait("dodge_buff"))
            window.playerStats.adrenalineTimer = window.checkArtifactTrait(
              "extend_buffs",
            )
              ? 900
              : 600;

          if (window.checkArtifactTrait("parry_strike")) {
            let counterDmg =
              p.atk * (window.playerStats.adrenalineTimer > 0 ? 2 : 1);
            window.mob.hp -= counterDmg;
            window.spawnDamageEffect(counterDmg, "counter", false);
            window.damageHistory.push({ time: Date.now(), amount: counterDmg });
            if (window.mob.hp <= 0) {
              window.handleMobDeath();
              return;
            }
          }
        } else if (isBlocked) {
          window.effects.push({
            x: window.hero.x,
            y: window.hero.y,
            text: "🛡️ BLOCKED",
            color: "#3498db",
            life: 40,
          });
          window.SoundManager.play("block");

          if (
            window.equippedSlots.subweapon &&
            window.equippedSlots.subweapon.isUniqueAegis &&
            window.mob &&
            window.mob.hp > 0
          ) {
            let shieldLvl = window.equippedSlots.subweapon.stageLevel || 1;
            let blastDmg = Math.ceil(p.def * (1.5 + shieldLvl * 0.05));
            if (window.playerStats.singularityState === "storing") {
              window.playerStats.singularityStoredDmg += blastDmg;
              window.effects.push({
                x: window.mob.x + window.mob.w / 2,
                y: window.mob.y - 10,
                text: `+${window.formatNumber(blastDmg)} [STORED]`,
                color: "#8e44ad",
                life: 45,
              });
            } else {
              window.mob.hp -= blastDmg;
              window.mob.flashTimer = 5;
              window.spawnDamageEffect(blastDmg, "counter", false);
              window.damageHistory.push({ time: Date.now(), amount: blastDmg });
              if (window.mob.hp <= 0) {
                window.handleMobDeath();
                return;
              }
            }
            for (let i = 0; i < 8; i++) {
              window.particles.push({
                x: window.mob.x + window.mob.w / 2,
                y: window.mob.y + window.mob.h / 2,
                vx: window.randFloat(-3, 3),
                vy: window.randFloat(-3, 3),
                radius: window.randFloat(1.5, 3.5),
                color: "#8e44ad",
                alpha: 1,
                life: window.randInt(15, 25),
              });
            }
          }

          window.playerStats.totalDeflections =
            (window.playerStats.totalDeflections || 0) + 1;
          window.playerStats.recentBlockTime = Date.now();
          window.playerStats.consecutiveParries = 0;
          if (
            window.playerStats.recentCritTime &&
            window.playerStats.recentBlockTime &&
            window.playerStats.recentParryTime
          ) {
            let times = [
              window.playerStats.recentCritTime,
              window.playerStats.recentBlockTime,
              window.playerStats.recentParryTime,
            ];
            if (Math.max(...times) - Math.min(...times) <= 1000)
              window.playerStats.hasTriggeredLuckySeven = true;
          }
          if (window.checkArtifactTrait("dodge_buff"))
            window.playerStats.adrenalineTimer = window.checkArtifactTrait(
              "extend_buffs",
            )
              ? 900
              : 600;
        } else {
          window.playerStats.consecutiveParries = 0;
          let netDamage = Math.max(
            1,
            Math.ceil(window.mob.damage * (100 / (100 + p.def))),
          );
          const subType = window.equippedSlots.subweapon
            ? window.equippedSlots.subweapon.subType
            : null;

          if (window.playerStats.daggerParryStagger && subType === "dagger") {
            netDamage = Math.max(1, Math.ceil(netDamage * 0.5));
            window.playerStats.daggerParryStagger = false;
            window.effects.push({
              x: window.hero.x,
              y: window.hero.y - 18,
              text: "🛡️ PARRIED (-50%)",
              color: "#e74c3c",
              life: 55,
            });
          }
          if (p.arcaneBarrier && subType === "tome") {
            let absorbed = Math.ceil(netDamage * p.arcaneBarrier);
            netDamage = Math.max(1, netDamage - absorbed);
            window.effects.push({
              x: window.hero.x,
              y: window.hero.y - 18,
              text: `🛡️ BARRIER (-${Math.round(p.arcaneBarrier * 100)}%)`,
              color: "#9b59b6",
              life: 55,
            });
          }

          if (window.playerStats.godMode) netDamage = 0;

          window.playerStats.currentHp -= netDamage;
          window.playerStats.damageTakenThisBattle =
            (window.playerStats.damageTakenThisBattle || 0) + netDamage;
          window.effects.push({
            x: window.hero.x,
            y: window.hero.y,
            text: "-" + window.formatNumber(netDamage),
            color: "#e74c3c",
            life: 40,
          });

          if (
            window.equippedSlots.helmet &&
            window.equippedSlots.helmet.isUniqueTempest &&
            window.mob &&
            window.mob.hp > 0
          ) {
            if (window.playerStats.tempestCooldown === undefined)
              window.playerStats.tempestCooldown = 0;
            if (window.playerStats.tempestCooldown <= 0) {
              window.playerStats.tempestCooldown = 60;
              if (Math.random() < 0.15) {
                let boltDmg = Math.ceil(p.atk * 1.5);
                if (window.playerStats.singularityState === "storing") {
                  window.playerStats.singularityStoredDmg += boltDmg;
                  window.effects.push({
                    x: window.mob.x + window.mob.w / 2,
                    y: window.mob.y - 10,
                    text: `+${window.formatNumber(boltDmg)} [STORED]`,
                    color: "#8e44ad",
                    life: 45,
                  });
                } else {
                  window.mob.hp -= boltDmg;
                  window.mob.flashTimer = 5;
                  window.spawnDamageEffect(boltDmg, "lightning", false);
                  window.damageHistory.push({
                    time: Date.now(),
                    amount: boltDmg,
                  });

                  let isBossType =
                    window.mob.type === "boss" ||
                    window.mob.type === "dungeon_boss" ||
                    window.mob.type === "prestige_boss" ||
                    window.mob.type === "rift_guardian" ||
                    window.mob.type === "aegis_goliath" ||
                    window.mob.type === "chronos_arbitrator" ||
                    window.mob.type === "nexus_overseer";
                  if (!isBossType) {
                    window.mob.attackTimer = window.mob.attackCooldown;
                    window.effects.push({
                      x: window.mob.x,
                      y: window.mob.y - 18,
                      text: "⚡ STUNNED!",
                      color: "#00d2ff",
                      life: 40,
                    });
                  }
                  if (window.mob.hp <= 0) {
                    window.handleMobDeath();
                    return;
                  }
                }
                window.SoundManager.play("parry");
                for (let i = 0; i < 15; i++) {
                  window.particles.push({
                    x:
                      window.mob.x + window.mob.w / 2 + window.randFloat(-5, 5),
                    y: window.mob.y - 40 + (i * (window.mob.h + 40)) / 15,
                    vx: window.randFloat(-1.5, 1.5),
                    vy: window.randFloat(-0.5, 0.5),
                    radius: window.randFloat(1.5, 3.5),
                    color: "#00d2ff",
                    alpha: 1,
                    life: window.randInt(12, 22),
                  });
                }
              }
            }
          }
          if (window.playerStats.currentHp <= 0) {
            if (
              window.checkArtifactTrait("second_wind") &&
              !window.playerStats.usedSecondWind
            ) {
              window.playerStats.usedSecondWind = true;
              window.playerStats.currentHp = Math.floor(p.maxHp * 0.5);
              window.playerStats.ankhTriggeredThisBattle = true;
              window.effects.push({
                x: window.hero.x,
                y: window.hero.y - 20,
                text: "🔥 SECOND WIND!",
                color: "#e67e22",
                life: 80,
              });
            } else {
              if (window.playerStats.isPrestigeBossMode)
                window.playerStats.killedBy = "Hooktail (Prestige Boss)";
              else if (window.playerStats.isDungeonMode)
                window.playerStats.killedBy =
                  window.mob.type === "dungeon_boss"
                    ? "Dungeon Boss"
                    : window.mob.type === "dungeon_miniboss"
                      ? "Dungeon Miniboss"
                      : "Dungeon Minion";
              else if (window.playerStats.isUberBoss)
                window.playerStats.killedBy = "Rift Guardian";
              else if (window.playerStats.isBossMode)
                window.playerStats.killedBy = "Stage Boss";
              else
                window.playerStats.killedBy = window.mob.isRare
                  ? "Rare Monster"
                  : "Standard Monster";

              window.playerStats.killedByMob = JSON.parse(
                JSON.stringify(window.mob),
              );
              window.playerStats.currentHp = 0;
              window.deathAnimationTimer = window.deathMaxFrames;
              return;
            }
          }
        }
        window.updateUI();
      }
    }
  }

  let stateAfter =
    (window.playerStats.frenzyTimer > 0) |
    ((window.playerStats.adrenalineTimer > 0) << 1) |
    ((window.playerStats.atkPotionTimer > 0) << 2) |
    ((window.playerStats.hpPotionTimer > 0) << 3) |
    ((window.playerStats.defPotionTimer > 0) << 4) |
    ((window.playerStats.hastePotionTimer > 0) << 5) |
    ((window.playerStats.xpPotionTimer > 0) << 6) |
    ((window.playerStats.dropPotionTimer > 0) << 7) |
    ((window.playerStats.qlyPotionTimer > 0) << 8);

  if (stateBefore !== stateAfter) {
    window.invalidatePlayerStats();
  }
}

// --- GAMEPLAY TRIGGERS & HOOKS ---

window.registerMaelstromTap = function () {
  if (
    window.equippedSlots.weapon &&
    window.equippedSlots.weapon.isUniqueMaelstrom &&
    window.playerStats.galeResonanceTimer > 0
  ) {
    let now = Date.now();
    // Anti-macro: 80ms throttle to prevent macro tools from exploiting speed caps
    if (
      !window.playerStats.lastGaleTapTime ||
      now - window.playerStats.lastGaleTapTime >= 80
    ) {
      window.playerStats.lastGaleTapTime = now;
      window.playerStats.galeCharges = Math.min(
        20,
        (window.playerStats.galeCharges || 0) + 1,
      );
      window.effects.push({
        x: window.hero.x,
        y: window.hero.y - 30,
        text: `⚡ COMBO: ${window.playerStats.galeCharges}/20`,
        color: "#00ffcc",
        life: 30,
      });

      // Stack Tornado Alley speed stacking on tap!
      window.playerStats.maelstromSpeedStacks = Math.min(
        3,
        (window.playerStats.maelstromSpeedStacks || 0) + 1,
      );
      window.playerStats.maelstromSpeedTimer = 360; // 6 seconds
      window.invalidatePlayerStats();
      window.updateUI();
    }
  }
};

window.detonateGaleFlurry = function () {
  if (!window.mob || window.mob.hp <= 0) {
    window.playerStats.galeCharges = 0;
    return;
  }
  let charges = window.playerStats.galeCharges || 0;
  if (charges <= 0) return;

  window.playerStats.galeCharges = 0;
  let p = window.resolvePlayerStats();
  let mobDef = window.mob.def || 0;
  let flurryDmgPerCharge = Math.ceil(p.atk * 0.15); // 15% weapon scaling per charge
  flurryDmgPerCharge = Math.max(
    1,
    Math.ceil(flurryDmgPerCharge * (100 / (100 + mobDef))),
  );
  let totalFlurryDmg = flurryDmgPerCharge * charges;

  window.mob.hp -= totalFlurryDmg;
  window.mob.flashTimer = 10;
  window.spawnDamageEffect(totalFlurryDmg, "frost", true); // Wind uses frost ice color/icon
  window.damageHistory.push({ time: Date.now(), amount: totalFlurryDmg });

  window.effects.push({
    x: window.mob.x + window.mob.w / 2,
    y: window.mob.y - 15,
    text: `🌪️ GALE FLURRY! (${charges}x)`,
    color: "#00ffcc",
    life: 60,
  });

  // Draw the physical wind crescents flying!
  for (let i = 0; i < charges; i++) {
    setTimeout(() => {
      if (window.mob && window.mob.hp > 0) {
        window.particles.push({
          x: window.hero.x + 35,
          y: window.hero.y + 10,
          vx: window.randFloat(4, 7),
          vy: window.randFloat(-1.5, 1.5),
          radius: window.randFloat(1.5, 3.5),
          color: "#00ffcc",
          alpha: 1,
          life: 25,
        });
      }
    }, i * 40); // 40ms staggering between crescent sprays
  }

  if (window.mob.hp <= 0) window.handleMobDeath();
  window.updateUI();
};

window.CombatEngine = {
  triggerPlayerSlash() {
    if (window.isGamePaused) return;
    let p = window.resolvePlayerStats();
    let cooldownCap =
      window.playerStats.frenzyTimer > 0 ? 4 : p.activeAttackSpeed;
    if (window.hero.attackTimer > 0) return;

    window.SoundManager.play("swing");
    window.hero.attackTimer = cooldownCap;

    if (
      window.equippedSlots.weapon &&
      window.equippedSlots.weapon.isUniqueStaff
    ) {
      window.projectiles.push({
        x: window.hero.x + 35,
        y: window.hero.y + 10,
        r: 10,
        hitMobs: [],
        pulseOffset: Math.random() * 10,
      });
      for (let i = 0; i < 4; i++) {
        window.particles.push({
          x: window.hero.x + 35,
          y: window.hero.y + 10,
          vx: window.randFloat(1, 3),
          vy: window.randFloat(-2, 2),
          radius: window.randFloat(1.5, 3),
          color: "#e67e22",
          alpha: 1,
          life: window.randInt(15, 25),
        });
      }
    }
    window.executeHitCalculations();
  },

  executeHitCalculations() {
    if (window.mob && window.mob.x < window.hero.x + 65) {
      let p = window.resolvePlayerStats();
      let finalDamage = p.atk;
      if (window.playerStats.adrenalineTimer > 0) finalDamage *= 2;

      let isCrit = Math.random() < p.critChance;
      if (isCrit) {
        finalDamage = Math.ceil(finalDamage * p.critDamage);
        if (window.playerStats.pendingClanProgress) {
          window.playerStats.pendingClanProgress.crits =
            (window.playerStats.pendingClanProgress.crits || 0) + 1;
        }
      }

      // Core mitigation layer filtering final base slash damage against active mob defense
      let mobDef = window.mob.def || 0;
      finalDamage = Math.max(
        1,
        Math.ceil(finalDamage * (100 / (100 + mobDef))),
      );

      // Peak single-hit check
      window.playerStats.peakSingleHit = Math.max(
        window.playerStats.peakSingleHit || 0,
        finalDamage,
      );
      if (isCrit) {
        window.playerStats.recentCritTime = Date.now();
        // Overkill check (deals critical hit exceeding mob's maximum HP by 1,000,000%)
        if (finalDamage >= window.mob.maxHp * 10000) {
          window.playerStats.hasTriggeredOverkill = true;
        }

        // Active Buff: Sanguine Feast (Critical strike health siphons)
        if (
          window.playerStats.isCrucibleMode &&
          window.playerStats.crucibleActiveBuff?.id === "sanguine_feast"
        ) {
          let buffStrength =
            window.playerStats.crucibleInfusedType === "buff" ? 1.5 : 1.0;
          let healAmt = Math.ceil(p.maxHp * (0.02 * buffStrength));
          window.playerStats.currentHp = Math.min(
            p.maxHp,
            window.playerStats.currentHp + healAmt,
          );
          window.effects.push({
            x: window.hero.x - 20,
            y: window.hero.y - 15,
            text: "+" + healAmt + " [FEAST]",
            color: "#2ecc71",
            life: 30,
          });
        }

        // Active Debuff: Blood Tax (Critical strike recoil damage)
        if (
          window.playerStats.isCrucibleMode &&
          window.playerStats.crucibleActiveDebuff?.id === "blood_tax"
        ) {
          let debuffStrength =
            window.playerStats.crucibleInfusedType === "debuff" ? 1.5 : 1.0;
          let selfDmg = Math.ceil(p.maxHp * (0.05 * debuffStrength));
          window.playerStats.currentHp = Math.max(
            1,
            window.playerStats.currentHp - selfDmg,
          );
          window.effects.push({
            x: window.hero.x,
            y: window.hero.y,
            text: "-" + selfDmg + " [TAX]",
            color: "#e74c3c",
            life: 30,
          });
          if (window.playerStats.currentHp <= 1) {
            window.playerStats.currentHp = 0;
            window.deathAnimationTimer = window.deathMaxFrames;
          }
          window.updateUI();
        }
      }
      if (typeof window.checkAchievements === "function") {
        window.checkAchievements();
      }

      // Active Debuff: Kinetic Recoil (Self damage on damage output reflection)
      if (
        window.playerStats.isCrucibleMode &&
        window.playerStats.crucibleActiveDebuff?.id === "kinetic_recoil" &&
        finalDamage > 0
      ) {
        let debuffStrength =
          window.playerStats.crucibleInfusedType === "debuff" ? 1.5 : 1.0;
        let selfDmg = Math.ceil(finalDamage * (0.15 * debuffStrength));
        window.playerStats.currentHp = Math.max(
          1,
          window.playerStats.currentHp - selfDmg,
        );
        window.effects.push({
          x: window.hero.x,
          y: window.hero.y,
          text: "-" + selfDmg + " [RECOIL]",
          color: "#e74c3c",
          life: 30,
        });
        if (window.playerStats.currentHp <= 1) {
          window.playerStats.currentHp = 0;
          window.deathAnimationTimer = window.deathMaxFrames;
        }
        window.updateUI();
      }

      if (window.playerStats.singularityState === "storing") {
        window.playerStats.singularityStoredDmg += finalDamage;
        window.mob.flashTimer = 3;
        window.effects.push({
          x: window.mob.x + window.mob.w / 2,
          y: window.mob.y - 10,
          text: `+${window.formatNumber(finalDamage)} [STORED]`,
          color: "#8e44ad",
          life: 45,
        });
      } else {
        window.mob.hp -= finalDamage;
        window.mob.flashTimer = 5;
        window.spawnDamageEffect(finalDamage, "slash", isCrit);
        window.damageHistory.push({ time: Date.now(), amount: finalDamage });
      }

      // UNIQUE: Maelstrom Glaive Wind Crescent projectile on critical hit and Resonance trigger
      if (
        window.equippedSlots.weapon &&
        window.equippedSlots.weapon.isUniqueMaelstrom &&
        isCrit &&
        window.mob &&
        window.mob.hp > 0
      ) {
        // Fire wind crescent gale projectile
        window.projectiles.push({
          x: window.hero.x + 35,
          y: window.hero.y + 10,
          r: 12,
          isMaelstromCrescent: true,
          hitMobs: [],
          pulseOffset: Math.random() * 5,
        });
        window.SoundManager.play("swing");

        // 30% chance to trigger Gale Resonance (Combo active state) on critical strikes
        if (
          Math.random() < 0.3 &&
          (!window.playerStats.galeCooldown ||
            window.playerStats.galeCooldown <= 0)
        ) {
          window.playerStats.galeResonanceTimer = 300; // 5 seconds combo window
          window.playerStats.galeCharges = 0;
          window.playerStats.galeCooldown = 900; // 15 seconds cooldown
          window.effects.push({
            x: window.hero.x + 12,
            y: window.hero.y - 20,
            text: "🌪️ GALE RESONANCE!",
            color: "#00ffcc",
            life: 65,
          });
        }
      }

      // Stacking Bleed & Sanguine Rupture on hit
      if (
        window.equippedSlots.weapon &&
        window.equippedSlots.weapon.isUniqueSword
      ) {
        window.mob.bleedStacks = (window.mob.bleedStacks || 0) + 1;
        window.mob.bleedTimer = 300; // 5-second hold
        window.mob.bleedDmgPerSecond = Math.max(1, Math.ceil(p.atk * 0.15)); // 15% weapon scaling per stack

        if (window.mob.bleedStacks >= 5) {
          // HEMORRHAGIC RUPTURE (300% critical physical burst + 3% Max HP Life-Siphon)
          let ruptureDmg = Math.ceil(p.atk * 3.0);
          let isRuptureCrit = Math.random() < p.critChance;
          if (isRuptureCrit) ruptureDmg = Math.ceil(ruptureDmg * p.critDamage);

          // Apply active defense mitigation to hemorrhagic rupture
          ruptureDmg = Math.max(
            1,
            Math.ceil(ruptureDmg * (100 / (100 + mobDef))),
          );

          window.mob.hp -= ruptureDmg;
          window.mob.flashTimer = 8;

          let healAmount = Math.ceil(p.maxHp * 0.03);
          window.playerStats.currentHp = Math.min(
            p.maxHp,
            window.playerStats.currentHp + healAmount,
          );

          window.effects.push({
            x: window.mob.x,
            y: window.mob.y - 20,
            text: "💥 RUPTURE! +" + window.formatNumber(healAmount) + " HP",
            color: "#e74c3c",
            life: 65,
          });
          window.spawnDamageEffect(ruptureDmg, "bleed", isRuptureCrit);
          window.damageHistory.push({ time: Date.now(), amount: ruptureDmg });

          // Trigger custom blood explosion physics particles
          for (let i = 0; i < 25; i++) {
            let angle = Math.random() * Math.PI * 2;
            let vel = window.randFloat(3, 7);
            window.particles.push({
              x: window.mob.x + window.mob.w / 2,
              y: window.mob.y + window.mob.h / 2,
              vx: Math.cos(angle) * vel,
              vy: Math.sin(angle) * vel - 1.5,
              radius: window.randFloat(2.0, 5.0),
              color: "#960018",
              alpha: 1,
              life: window.randInt(22, 38),
            });
          }

          window.SoundManager.play("death"); // Play heavy impact sound

          // Reset stacks on Rupture explosion
          window.mob.bleedStacks = 0;
          window.mob.bleedTimer = 0;
          window.mob.bleedTickCounter = 0;
        } else {
          // Regular strike spray
          for (let i = 0; i < 6; i++) {
            window.particles.push({
              x: window.mob.x + window.mob.w / 2,
              y: window.mob.y + window.mob.h / 2,
              vx: window.randFloat(-3, 3),
              vy: window.randFloat(-4, -1),
              radius: window.randFloat(1.5, 3.5),
              color: "#c0392b",
              alpha: 1,
              life: window.randInt(10, 20),
            });
          }
        }
      }

      // Offhand Dagger Multi-Strike (Deals 50% of your total Attack as an extra hit)
      const hasDagger =
        window.equippedSlots.subweapon &&
        window.equippedSlots.subweapon.subType === "dagger";
      if (hasDagger) {
        let daggerDmg = Math.max(
          1,
          Math.ceil(
            p.atk * (window.playerStats.adrenalineTimer > 0 ? 2 : 1) * 0.5,
          ),
        );
        let isDaggerCrit = Math.random() < p.critChance;
        if (isDaggerCrit) daggerDmg = Math.ceil(daggerDmg * p.critDamage);

        // Apply active defense mitigation to offhand dagger strikes
        daggerDmg = Math.max(1, Math.ceil(daggerDmg * (100 / (100 + mobDef))));

        if (window.playerStats.singularityState === "storing") {
          window.playerStats.singularityStoredDmg += daggerDmg;
          window.effects.push({
            x: window.mob.x + window.mob.w / 2,
            y: window.mob.y - 10,
            text: `+${window.formatNumber(daggerDmg)} [STORED]`,
            color: "#8e44ad",
            life: 45,
          });
        } else {
          window.mob.hp -= daggerDmg;
          window.spawnDamageEffect(daggerDmg, "dagger", isDaggerCrit);
          window.damageHistory.push({ time: Date.now(), amount: daggerDmg });
        }
      }

      // Elemental Tome Spells (20% independent chance each for Lightning, Fire, and Frost)
      const hasTome =
        window.equippedSlots.subweapon &&
        window.equippedSlots.subweapon.subType === "tome";
      if (hasTome) {
        let spellDmgBase = Math.max(
          1,
          Math.ceil(
            p.atk * (window.playerStats.adrenalineTimer > 0 ? 2 : 1) * 0.5,
          ),
        );
        let triggeredSpell = false;
        let lightProc = false,
          fireProc = false,
          frostProc = false;

        // 1. Lightning Spell Roll
        if (Math.random() < 0.2) {
          lightProc = true;
          triggeredSpell = true;
          let lightningDmg = spellDmgBase;
          let isSpellCrit = Math.random() < p.critChance;
          if (isSpellCrit)
            lightningDmg = Math.ceil(lightningDmg * p.critDamage);

          // Apply active defense mitigation to lightning spells
          lightningDmg = Math.max(
            1,
            Math.ceil(lightningDmg * (100 / (100 + mobDef))),
          );

          if (window.playerStats.singularityState === "storing") {
            window.playerStats.singularityStoredDmg += lightningDmg;
            window.effects.push({
              x: window.mob.x + window.mob.w / 2,
              y: window.mob.y - 10,
              text: `+${window.formatNumber(lightningDmg)} [STORED]`,
              color: "#8e44ad",
              life: 45,
            });
          } else {
            window.mob.hp -= lightningDmg;
            window.spawnDamageEffect(lightningDmg, "lightning", isSpellCrit);
            window.damageHistory.push({
              time: Date.now(),
              amount: lightningDmg,
            });
          }

          // Descending crackling lightning bolt particles
          for (let i = 0; i < 15; i++) {
            window.particles.push({
              x: window.mob.x + window.mob.w / 2 + window.randFloat(-6, 6),
              y: window.mob.y - 40 + (i * (window.mob.h + 40)) / 15,
              vx: window.randFloat(-2.5, 2.5),
              vy: window.randFloat(-1, 1),
              radius: window.randFloat(1.5, 3),
              color: Math.random() > 0.3 ? "#f1c40f" : "#fff",
              alpha: 1,
              life: window.randInt(10, 18),
            });
          }
        }

        // 2. Fire Spell Roll
        if (Math.random() < 0.2) {
          fireProc = true;
          triggeredSpell = true;
          let fireDmg = spellDmgBase;
          let isSpellCrit = Math.random() < p.critChance;
          if (isSpellCrit) fireDmg = Math.ceil(fireDmg * p.critDamage);

          // Apply active defense mitigation to fire spells
          fireDmg = Math.max(1, Math.ceil(fireDmg * (100 / (100 + mobDef))));

          if (window.playerStats.singularityState === "storing") {
            window.playerStats.singularityStoredDmg += fireDmg;
            window.effects.push({
              x: window.mob.x + window.mob.w / 2,
              y: window.mob.y - 10,
              text: `+${window.formatNumber(fireDmg)} [STORED]`,
              color: "#8e44ad",
              life: 45,
            });
          } else {
            window.mob.hp -= fireDmg;
            window.spawnDamageEffect(fireDmg, "fire", isSpellCrit);
            window.damageHistory.push({ time: Date.now(), amount: fireDmg });
          }

          // Rising flame embers
          for (let i = 0; i < 15; i++) {
            window.particles.push({
              x: window.mob.x + window.randFloat(0, window.mob.w),
              y: window.mob.y + window.mob.h - 5,
              vx: window.randFloat(-1.2, 1.2),
              vy: window.randFloat(-4.5, -2),
              radius: window.randFloat(2, 4),
              color: Math.random() > 0.4 ? "#e67e22" : "#e74c3c",
              alpha: 1,
              life: window.randInt(18, 32),
            });
          }
        }

        // 3. Frost Spell Roll
        if (Math.random() < 0.2) {
          frostProc = true;
          triggeredSpell = true;
          let frostDmg = spellDmgBase;
          let isSpellCrit = Math.random() < p.critChance;
          if (isSpellCrit) frostDmg = Math.ceil(frostDmg * p.critDamage);

          // Apply active defense mitigation to frost spells
          frostDmg = Math.max(1, Math.ceil(frostDmg * (100 / (100 + mobDef))));

          if (window.playerStats.singularityState === "storing") {
            window.playerStats.singularityStoredDmg += frostDmg;
            window.effects.push({
              x: window.mob.x + window.mob.w / 2,
              y: window.mob.y - 10,
              text: `+${window.formatNumber(frostDmg)} [STORED]`,
              color: "#8e44ad",
              life: 45,
            });
          } else {
            window.mob.hp -= frostDmg;
            window.spawnDamageEffect(frostDmg, "frost", isSpellCrit);
            window.damageHistory.push({ time: Date.now(), amount: frostDmg });
          }

          // Radial ice shard burst
          for (let i = 0; i < 15; i++) {
            window.particles.push({
              x: window.mob.x + window.mob.w / 2,
              y: window.mob.y + window.mob.h / 2,
              vx: window.randFloat(-3.5, 3.5),
              vy: window.randFloat(-2.5, 2.5),
              radius: window.randFloat(1.5, 3),
              color: Math.random() > 0.5 ? "#3498db" : "#ffffff",
              alpha: 1,
              life: window.randInt(15, 28),
            });
          }
        }

        if (triggeredSpell) {
          window.SoundManager.play("spell");
          if (lightProc && fireProc && frostProc) {
            window.playerStats.hasTriggeredElementalConvergence = true;
          }
        }
      }

      if (window.checkArtifactTrait("echo_strike") && Math.random() < 0.5) {
        let echoDmg = Math.max(1, Math.ceil(finalDamage * 0.4));
        window.mob.hp -= echoDmg;
        window.spawnDamageEffect(echoDmg, "echo", false);
        window.damageHistory.push({ time: Date.now(), amount: echoDmg });
      }
      if (window.checkArtifactTrait("vampirism")) {
        let now = Date.now();
        // Purge healing siphons older than 1,000ms
        window.playerStats.recentHeals = (
          window.playerStats.recentHeals || []
        ).filter((h) => now - h.time < 1000);
        let totalRecentHealed = window.playerStats.recentHeals.reduce(
          (sum, h) => sum + h.amount,
          0,
        );

        // Restrict healing from Vampirism to a global ceiling of 3% Max HP per second
        let maxHealSec = p.maxHp * 0.03;
        let allowedHeal = Math.max(0, maxHealSec - totalRecentHealed);

        let rawHeal = Math.max(1, Math.floor(finalDamage * 0.005));
        let heal = Math.min(allowedHeal, rawHeal);

        if (heal > 0) {
          window.playerStats.currentHp = Math.min(
            p.maxHp,
            window.playerStats.currentHp + heal,
          );
          window.playerStats.recentHeals.push({ time: now, amount: heal });
          window.effects.push({
            x: window.hero.x - 25,
            y: window.hero.y - 10,
            text: "❤️ +" + window.formatNumber(heal),
            color: "#2ecc71",
            life: 60,
          });
        }
      }
      if (typeof window.updateUI === "function") window.updateUI();
      if (window.mob.hp <= 0) {
        if (typeof window.handleMobDeath === "function")
          window.handleMobDeath();
      }
    }
  },

  handleMobDeath() {
    window.effects = window.effects.filter((e) => !e.isCumulative);
    let p = window.resolvePlayerStats();

    // Universal Overkill Splash / Stage-Skip Mechanic
    if (
      window.mob &&
      window.mob.hp < 0 &&
      !window.playerStats.isDungeonMode &&
      !window.playerStats.isCrucibleMode &&
      !window.playerStats.isBossMode &&
      !window.playerStats.isFarmingLoop
    ) {
      let overkillRatio = Math.abs(window.mob.hp) / window.mob.maxHp;
      if (overkillRatio >= 2.0) {
        // Overkilled by at least 200% of mob Max HP
        let extraKills = Math.min(3, Math.floor(overkillRatio)); // Cap at 3 extra progress kills
        window.playerStats.killCount = Math.min(
          window.playerStats.targetsRequired,
          window.playerStats.killCount + extraKills,
        );
        window.effects.push({
          x: window.hero.x + 12,
          y: window.hero.y - 25,
          text: `💥 OVERKILL SPLASH (+${extraKills})`,
          color: "#2ecc71",
          life: 55,
        });
        if (
          window.playerStats.killCount >= window.playerStats.targetsRequired
        ) {
          window.playerStats.isBossMode = true;
        }
      }
    }

    let isBoss =
      window.mob.type === "boss" ||
      window.mob.type === "dungeon_boss" ||
      window.mob.type === "dungeon_miniboss" ||
      window.mob.type === "rift_guardian" ||
      window.mob.type === "prestige_boss" ||
      window.mob.type === "aegis_goliath" ||
      window.mob.type === "chronos_arbitrator" ||
      window.mob.type === "nexus_overseer";

    // UNIQUE: Warp-Core Greaves "Time Dilation" Boss Kill Haste trigger
    if (
      isBoss &&
      window.equippedSlots.boots &&
      window.equippedSlots.boots.isUniqueWarpCore &&
      !window.playerStats.isDungeonMode &&
      !window.playerStats.isCrucibleMode
    ) {
      window.playerStats.warpCoreSprintTimer = 240; // 4 seconds of Max Haste (4-frame cap)
      window.invalidatePlayerStats();
      window.effects.push({
        x: window.hero.x + 12,
        y: window.hero.y - 12,
        text: "⚡ MAX HASTE ACTIVE!",
        color: "#00d2ff",
        life: 55,
      });
    }

    if (window.mob && window.mob.isRare) {
      window.playerStats.rareSpawnsSlain =
        (window.playerStats.rareSpawnsSlain || 0) + 1;
    }

    // Trigger potion drop rolls
    if (typeof window.rollPotionDrop === "function")
      window.rollPotionDrop(isBoss, window.mob && window.mob.isRare);

    // Cavern Sigil Sack drop rolls
    let sackChance = 0;
    if (
      window.playerStats.isDungeonMode &&
      window.mob.type === "dungeon_boss"
    ) {
      sackChance = 0.05;
    } else if (
      window.playerStats.isUberBoss &&
      (window.mob.type === "rift_guardian" ||
        window.mob.type === "aegis_goliath" ||
        window.mob.type === "chronos_arbitrator" ||
        window.mob.type === "nexus_overseer")
    ) {
      sackChance = 0.15;
    } else if (window.mob.type === "boss") {
      sackChance = 0.015;
    }

    if (sackChance > 0 && Math.random() < sackChance) {
      window.addUseDrop("Cavern Sigil Sack", 1);
      window.effects.push({
        x: window.mob.x + window.mob.w / 2,
        y: window.mob.y - 10,
        text: "🎒 SIGIL SACK!",
        color: "#9b59b6",
        life: 55,
      });
      if (typeof window.pushLog === "function") {
        window.pushLog(
          `<strong style="color:#9b59b6;">[DROP]</strong> Recovered a rare <span style="color:#9b59b6;">Cavern Sigil Sack</span>!`,
        );
      }
    }

    // Single-tier feats check conditions
    if (isBoss) {
      // Look Ma No Hands Check
      if (!window.playerStats.hasClickedThisBattle) {
        window.playerStats.hasTriggeredLookMaNoHands = true;
      }
      // Untouchable Check
      if (window.playerStats.damageTakenThisBattle === 0) {
        window.playerStats.hasTriggeredUntouchable = true;
      }
      // Back From The Brink Check
      if (window.playerStats.ankhTriggeredThisBattle) {
        window.playerStats.hasTriggeredBackFromBrink = true;
        window.playerStats.ankhTriggeredThisBattle = false;
      }
      // Bare Fists Check
      if (!window.equippedSlots.weapon) {
        window.playerStats.hasTriggeredBareFists = true;
      }
      // High Noon Check (12:00 PM to 1:00 PM)
      let hr = new Date().getHours();
      if (hr === 12) {
        window.playerStats.hasTriggeredHighNoon = true;
      }
      // Witching Hour Check (Rift Guardian defeated between 3:00 AM and 4:00 AM)
      if (window.mob.type === "rift_guardian" && hr === 3) {
        window.playerStats.hasTriggeredWitchingHour = true;
      }
    }

    // Void Core Siphon-Heal Check on Rare Defeat
    if (
      window.mob &&
      window.mob.isRare &&
      window.checkArtifactTrait("void_pull")
    ) {
      let healAmount = Math.ceil(p.maxHp * 0.3);
      window.playerStats.currentHp = Math.min(
        p.maxHp,
        window.playerStats.currentHp + healAmount,
      );
      window.effects.push({
        x: window.mob.x,
        y: window.mob.y - 15,
        text: `❤️ +${healAmount.toLocaleString()} VOID SIPHON`,
        color: "#9b59b6",
        life: 75,
      });
      if (typeof window.pushLog === "function")
        window.pushLog(
          `<strong style='color:#9b59b6;'>[VOID CORE]</strong> Syphoned <span style='color:#2ecc71;'>${healAmount.toLocaleString()} HP</span> from the fallen rare.`,
        );
    }

    if (window.SoundManager) window.SoundManager.play("death");

    let xpYield = 0;
    let scaleVal = window.playerStats.isDungeonMode
      ? window.playerStats.currentDungeonStage[
          window.playerStats.currentDungeon
        ] || 1
      : window.playerStats.stage;
    if (window.playerStats.isCrucibleMode) {
      scaleVal = window.playerStats.crucibleWave;
    }
    // Decouple Rift Guardian rewards completely from the Campaign Stage
    if (window.playerStats.isUberBoss) {
      let riftLvl = window.playerStats.activeRiftLevel || 1;
      scaleVal = 50 + riftLvl * 10;
    }

    let expScale = Math.pow(1.045, scaleVal);

    if (window.playerStats.isCrucibleMode) {
      xpYield = Math.floor(10 * expScale);
    } else if (window.playerStats.isDungeonMode) {
      xpYield = Math.floor(
        (window.mob.type === "dungeon_boss" ? 25 : 5) * expScale,
      );
    } else {
      let baseExp = Math.floor(5 * expScale);
      xpYield = isBoss
        ? baseExp * 5
        : window.mob.isRare
          ? baseExp * 3
          : baseExp;
    }
    if (typeof window.gainXp === "function") window.gainXp(xpYield);

    let baseCoin = isBoss
      ? Math.floor(15 * expScale)
      : Math.floor(2 * expScale);
    if (window.playerStats.isCrucibleMode) baseCoin = 0; // Crucible awards survival stats on death summary

    if (
      window.playerStats.isDungeonMode &&
      window.playerStats.currentDungeon === "gold"
    ) {
      baseCoin *= 5;
      if (window.mob.type === "dungeon_boss") baseCoin *= 4;
    }
    if (window.mob.isRare) baseCoin *= 4;

    let coinYield = Math.ceil(baseCoin * p.gold);
    if (
      window.playerStats.isDungeonMode &&
      window.playerStats.activeDungeonSigil
    ) {
      coinYield = Math.ceil(
        coinYield *
          (1.0 + (window.playerStats.activeDungeonSigil.rewardMultiplier || 0)),
      );
    }
    window.playerStats.coins += coinYield;
    window.playerStats.totalGoldEarned =
      (window.playerStats.totalGoldEarned || 0) + coinYield;
    if (typeof window.progressMission === "function")
      window.progressMission("gold", coinYield);

    // Peak single gold drop check
    window.playerStats.peakSingleGoldDrop = Math.max(
      window.playerStats.peakSingleGoldDrop || 0,
      coinYield,
    );

    if (window.playerStats.runGold !== undefined) {
      window.playerStats.runGold += coinYield;
    }

    if (typeof window.spawnDeathParticles === "function")
      window.spawnDeathParticles(
        window.mob.x + window.mob.w / 2,
        window.mob.y + window.mob.h / 2,
        window.mob.type,
      );
    if (coinYield > 0) {
      window.effects.push({
        x: window.mob.x + 35,
        y: window.mob.y + 25,
        text: "+" + coinYield.toLocaleString() + "g",
        color: "#f1c40f",
        life: 50,
      });
    }

    if (window.playerStats.isCrucibleMode) {
      // Active Debuff: Volatile Sparks (On-death mitigatable explosions)
      if (window.playerStats.crucibleActiveDebuff?.id === "volatile_sparks") {
        let debuffStrength =
          window.playerStats.crucibleInfusedType === "debuff" ? 1.5 : 1.0;
        let isBlocked = Math.random() < p.block;
        let isParried = !isBlocked && Math.random() < p.parry;

        if (isBlocked || isParried) {
          window.effects.push({
            x: window.hero.x,
            y: window.hero.y - 15,
            text: isBlocked ? "🛡️ BLOCKED EXPLOSION!" : "⚡ PARRIED EXPLOSION!",
            color: isBlocked ? "#3498db" : "#9b59b6",
            life: 40,
          });
          window.SoundManager.play(isBlocked ? "block" : "parry");
        } else {
          let dmg = Math.ceil(p.maxHp * (0.18 * debuffStrength));
          window.playerStats.currentHp = Math.max(
            1,
            window.playerStats.currentHp - dmg,
          );
          window.effects.push({
            x: window.hero.x,
            y: window.hero.y,
            text: "-" + dmg + " [EXPLOSION]",
            color: "#e74c3c",
            life: 40,
          });
          window.SoundManager.play("death");
          if (window.playerStats.currentHp <= 1) {
            window.playerStats.currentHp = 0;
            window.deathAnimationTimer = window.deathMaxFrames;
            window.mob = null;
            window.updateUI();
            return;
          }
        }
      }

      if (window.mob.type === "dungeon_boss") {
        let w = window.playerStats.crucibleWave || 1;

        // Logarithmic reward calculation
        let waveLog = Math.log(Math.max(1, w)) / Math.log(1.5);
        let shardsForWave = Math.ceil(1.0 + waveLog * 0.5);

        // Core drops check
        let coresForWave = 0;
        if (w % 10 === 0) {
          coresForWave = 1;
        } else if (w > 20 && Math.random() < Math.min(0.05, w * 0.0001)) {
          coresForWave = 1;
        }

        // Apply active infusion multiplier if chosen
        let lootMult = window.playerStats.crucibleLootMult || 1.0;
        let finalShards = Math.ceil(shardsForWave * lootMult);
        let finalCores = Math.ceil(coresForWave * lootMult);

        window.playerStats.crucibleAccumulatedShards =
          (window.playerStats.crucibleAccumulatedShards || 0) + finalShards;
        window.playerStats.crucibleAccumulatedCores =
          (window.playerStats.crucibleAccumulatedCores || 0) + finalCores;

        window.playerStats.crucibleWave++;
        window.playerStats.cruciblePeak = Math.max(
          window.playerStats.cruciblePeak || 1,
          window.playerStats.crucibleWave,
        );
        window.playerStats.killCount = 0;
        if (typeof window.pushLog === "function")
          window.pushLog(
            `<span style='color:#9b59b6; font-weight:bold;'>[CRUCIBLE] Advanced to Wave ${window.playerStats.crucibleWave}! (+${finalShards} Shards, +${finalCores} Cores accumulated)</span>`,
          );
      } else {
        window.playerStats.killCount++;
      }
      window.mob = null;
      if (typeof window.updateUI === "function") window.updateUI();
      return;
    }

    if (window.playerStats.isDungeonMode) {
      if (window.playerStats.currentDungeon === "equip") {
        if (window.mob.type === "dungeon_boss") {
          if (Math.random() < 0.05) {
            if (typeof window.rollEquipmentDrop === "function")
              window.rollEquipmentDrop(true, false, 1, false);
          } else if (Math.random() < 0.2) {
            if (typeof window.rollEquipmentDrop === "function")
              window.rollEquipmentDrop(true, false, 0, false);
          }
          // Balanced unique artifact tempering speed by adjusting Overlord's Sigil rate to 20%
          if (Math.random() < 0.05) {
            if (typeof window.addEtcDrop === "function")
              window.addEtcDrop("Overlord's Sigil", 1);
            if (typeof window.pushToast === "function")
              window.pushToast("Overlord's Sigil", null, "#1abc9c", true, 1);
          }
        } else {
          if (Math.random() < 0.01) {
            if (typeof window.rollEquipmentDrop === "function")
              window.rollEquipmentDrop(false, false, 0, false);
          }
        }
      } else if (window.playerStats.currentDungeon === "mat") {
        let dStage = window.playerStats.currentDungeonStage["mat"] || 1;
        if (window.mob.type === "dungeon_boss") {
          // Soft progression depth-based calculations replacing hard dungeon floor gates
          let dDepthQ = window.getDepthQualityMultiplier(dStage);
          let dCoreChance = 0.008 * (dDepthQ - 1.0);
          let dKeyChance = 0.0005 * (dDepthQ - 1.0);
          let dShardChance = 0.0016 * (dDepthQ - 1.0);

          if (dDepthQ > 1.0 && Math.random() < dCoreChance) {
            if (typeof window.addEtcDrop === "function")
              window.addEtcDrop("Ancient Core", 1);
            if (typeof window.pushToast === "function")
              window.pushToast("Ancient Core", null, "#9b59b6", true, 1);
          }
          if (dDepthQ > 1.0 && Math.random() < dKeyChance) {
            if (typeof window.addEtcDrop === "function")
              window.addEtcDrop("Gacha Key", 1);
            if (typeof window.pushToast === "function")
              window.pushToast("Gacha Key", null, "#f1c40f", true, 1);
          }
          if (dDepthQ > 1.0 && Math.random() < dShardChance) {
            if (typeof window.addEtcDrop === "function")
              window.addEtcDrop("Eridium Shard", 1);
            if (typeof window.pushToast === "function")
              window.pushToast("Eridium Shard", null, "#8e44ad", true, 1);
          }

          // Gated progression scrap drops for Material Cavern Bosses
          let sigMult = 1.0;
          if (
            window.playerStats.isDungeonMode &&
            window.playerStats.activeDungeonSigil
          ) {
            sigMult +=
              window.playerStats.activeDungeonSigil.rewardMultiplier || 0;
          }
          if (dStage < 150) {
            if (typeof window.addEtcDrop === "function")
              window.addEtcDrop(
                "Rare Scrap",
                Math.ceil(window.randInt(1, 3) * sigMult),
              );
          } else if (dStage < 350) {
            if (Math.random() < 0.3) {
              if (typeof window.addEtcDrop === "function")
                window.addEtcDrop("Magic Scrap", 1);
            } else {
              if (typeof window.addEtcDrop === "function")
                window.addEtcDrop("Rare Scrap", 1);
            }
          } else if (dStage < 600) {
            let rRoll = Math.random();
            if (rRoll < 0.1) {
              if (typeof window.addEtcDrop === "function")
                window.addEtcDrop("Legendary Scrap", 1);
            } else if (rRoll < 0.5) {
              if (typeof window.addEtcDrop === "function")
                window.addEtcDrop("Epic Scrap", 1);
            } else {
              if (typeof window.addEtcDrop === "function")
                window.addEtcDrop("Magic Scrap", 1);
            }
          } else if (dStage < 850) {
            let rRoll = Math.random();
            if (rRoll < 0.2) {
              if (typeof window.addEtcDrop === "function")
                window.addEtcDrop("Mythic Scrap", 1);
            } else if (rRoll < 0.6) {
              if (typeof window.addEtcDrop === "function")
                window.addEtcDrop("Legendary Scrap", 1);
            } else {
              if (typeof window.addEtcDrop === "function")
                window.addEtcDrop("Epic Scrap", 1);
            }
          } else {
            let yieldAmt = Math.ceil(1 * sigMult);
            if (Math.random() < 0.7) {
              if (typeof window.addEtcDrop === "function")
                window.addEtcDrop("Mythic Scrap", yieldAmt);
            } else {
              if (typeof window.addEtcDrop === "function")
                window.addEtcDrop("Legendary Scrap", yieldAmt);
            }
          }
        } else {
          // Normal minion drops inside the Material Pit
          let r = Math.random();
          if (dStage < 150) {
            if (typeof window.addEtcDrop === "function")
              window.addEtcDrop("Monster Soul", 1);
          } else if (dStage < 350) {
            if (r < 0.25) {
              if (typeof window.addEtcDrop === "function")
                window.addEtcDrop("Rare Scrap", 1);
            } else {
              if (typeof window.addEtcDrop === "function")
                window.addEtcDrop("Monster Soul", 1);
            }
          } else if (dStage < 600) {
            if (r < 0.2) {
              if (typeof window.addEtcDrop === "function")
                window.addEtcDrop("Magic Scrap", 1);
            } else if (r < 0.6) {
              if (typeof window.addEtcDrop === "function")
                window.addEtcDrop("Rare Scrap", 1);
            } else {
              if (typeof window.addEtcDrop === "function")
                window.addEtcDrop("Monster Soul", 1);
            }
          } else if (dStage < 850) {
            if (r < 0.2) {
              if (typeof window.addEtcDrop === "function")
                window.addEtcDrop("Epic Scrap", 1);
            } else if (r < 0.6) {
              if (typeof window.addEtcDrop === "function")
                window.addEtcDrop("Magic Scrap", 1);
            } else {
              if (typeof window.addEtcDrop === "function")
                window.addEtcDrop("Rare Scrap", 1);
            }
          } else {
            if (r < 0.2) {
              if (typeof window.addEtcDrop === "function")
                window.addEtcDrop("Legendary Scrap", 1);
            } else if (r < 0.7) {
              if (typeof window.addEtcDrop === "function")
                window.addEtcDrop("Epic Scrap", 1);
            } else {
              if (typeof window.addEtcDrop === "function")
                window.addEtcDrop("Magic Scrap", 1);
            }
          }
        }
      }
    } else {
      let baseDropRate = window.playerStats.isUberBoss
        ? 1.0
        : isBoss
          ? 0.01
          : window.mob.isRare
            ? 0.005
            : 0.001;
      if (Math.random() < baseDropRate * p.drop * window.state.efficiency) {
        if (typeof window.rollEquipmentDrop === "function")
          window.rollEquipmentDrop(isBoss, false, 0, window.mob.isRare);
      }
    }

    if (window.playerStats.isUberBoss) {
      let bossType = window.playerStats.currentUberBoss || "guardian";
      let riftLvl = window.playerStats.activeRiftLevel || 1;

      window.playerStats.highestRiftLevel = Math.max(
        window.playerStats.highestRiftLevel || 0,
        riftLvl,
      );
      window.playerStats.activeRift = null;
      window.playerStats.activeRiftLevel = 1;
      if (window.playerStats.pendingClanProgress) {
        window.playerStats.pendingClanProgress.rifts =
          (window.playerStats.pendingClanProgress.rifts || 0) + 1;
      }

      // Highly Scaled & Rewarding Loot Matrix for challenging higher Level Reality Rifts
      let keysEarned = 1 + Math.floor(riftLvl / 10);
      let shardsEarned = 1 + Math.floor(riftLvl / 3);

      let coreEarned = Math.floor(riftLvl / 5);
      if (Math.random() < (riftLvl % 5) * 0.2) coreEarned++;

      let essenceEarned = Math.floor(riftLvl / 6);
      if (Math.random() < (riftLvl % 6) * 0.15) essenceEarned++;

      let mythicScrapsEarned = Math.floor(riftLvl / 3);
      let legendaryScrapsEarned = Math.floor(riftLvl / 2);

      if (typeof window.addEtcDrop === "function") {
        if (keysEarned > 0) window.addEtcDrop("Gacha Key", keysEarned);
        if (shardsEarned > 0) window.addEtcDrop("Eridium Shard", shardsEarned);
        if (coreEarned > 0) window.addEtcDrop("Catalyst Core", coreEarned);
        if (essenceEarned > 0)
          window.addEtcDrop("Astral Essence", essenceEarned);
        if (mythicScrapsEarned > 0)
          window.addEtcDrop("Mythic Scrap", mythicScrapsEarned);
        if (legendaryScrapsEarned > 0)
          window.addEtcDrop("Legendary Scrap", legendaryScrapsEarned);
      }

      // Pushing high Rift Tiers guarantees high-rarity loot
      let minStars = Math.min(5, Math.floor(riftLvl / 4));
      if (typeof window.rollEquipmentDrop === "function") {
        window.rollEquipmentDrop(true, false, minStars, false);
      }

      let nameLabel =
        bossType === "chronos"
          ? "Chronos Arbitrator"
          : bossType === "nexus"
            ? "Nexus Overseer"
            : "Aegis Goliath";
      let colorLabel =
        bossType === "chronos"
          ? "#f1c40f"
          : bossType === "nexus"
            ? "#ff007f"
            : "#3498db";
      let iconLabel =
        bossType === "chronos" ? "⏳" : bossType === "nexus" ? "👾" : "🛡️";

      let reportText = `${keysEarned}x Key, ${shardsEarned}x Eridium Shard`;
      if (coreEarned > 0) reportText += `, ${coreEarned}x Catalyst Core`;
      if (essenceEarned > 0) reportText += `, ${essenceEarned}x Astral Essence`;

      if (typeof window.pushLog === "function") {
        window.pushLog(
          `<span style='color:${colorLabel}; font-weight:bold;'>[VICTORY] Slayed Level ${riftLvl} ${nameLabel}! Salvaged temporal matrix components: ${reportText}.</span>`,
        );
      }
      if (typeof window.pushHeaderToast === "function") {
        window.pushHeaderToast(
          `${iconLabel} Level ${riftLvl} Hunt Successful!`,
          colorLabel,
        );
      }

      window.playerStats.riftGuardiansSlain =
        (window.playerStats.riftGuardiansSlain || 0) + 1;
      if (typeof window.progressMission === "function")
        window.progressMission("rifts", 1);
    } else if (window.mob.type === "boss") {
      let activeStage = window.playerStats.stage;
      let peakLimit = Math.floor(
        (window.playerStats.lifetimePeakStage || 1) * 0.8,
      );

      // Standardized flat drop rates (keeps Sigils/Cores/Shards rare and consistent)
      if (activeStage >= peakLimit) {
        if (Math.random() < 0.01) {
          window.addEtcDrop("Ancient Core", 1);
          window.pushToast("Ancient Core", null, "#e74c3c", true, 1);
        }
        if (Math.random() < 0.005) {
          window.addEtcDrop("Overlord's Sigil", 1);
          window.pushToast("Overlord's Sigil", null, "#1abc9c", true, 1);
        }
      }
      if (activeStage >= 18 && Math.random() < 0.005) {
        window.addEtcDrop("Eridium Shard", 1);
        window.pushToast("Eridium Shard", null, "#8e44ad", true, 1);
      }
      if (
        activeStage >= 50 &&
        Math.random() <
          0.0003 * (window.getDepthQualityMultiplier(activeStage) - 1.0)
      ) {
        window.addEtcDrop("Gacha Key", 1);
        window.pushToast("Gacha Key", null, "#f1c40f", true, 1);
      }
    } else if (
      window.playerStats.isDungeonMode &&
      window.mob.type === "dungeon_boss"
    ) {
      // Standardized flat drops for Dungeon Bosses
      if (Math.random() < 0.02) {
        window.addEtcDrop("Ancient Core", 1);
        window.pushToast("Ancient Core", null, "#e74c3c", true, 1);
      }
      if (Math.random() < 0.015) {
        window.addEtcDrop("Overlord's Sigil", 1);
        window.pushToast("Overlord's Sigil", null, "#1abc9c", true, 1);
      }
      if (Math.random() < 0.015) {
        window.addEtcDrop("Eridium Shard", 1);
        window.pushToast("Eridium Shard", null, "#8e44ad", true, 1);
      }
    } else if (!isBoss && !window.playerStats.isDungeonMode) {
      if (Math.random() < (window.mob.isRare ? 0.08 : 0.03)) {
        let etcItemName = window.mob.isRare ? "Luminous Soul" : "Monster Soul";
        if (typeof window.addEtcDrop === "function")
          window.addEtcDrop(etcItemName);
        window.effects.push({
          x: window.mob.x + 10,
          y: window.mob.y + 10,
          text: "+1 " + etcItemName,
          color: window.mob.isRare ? "#f1c40f" : "#bdc3c7",
          life: 70,
        });
      }
      // Progression-Locked Campaign Rare Spawn Ancient Core / Sigil / Shard drops (Flat rare)
      if (window.mob && window.mob.isRare) {
        let activeStage = window.playerStats.stage;
        let peakLimit = Math.floor(
          (window.playerStats.lifetimePeakStage || 1) * 0.8,
        );
        if (activeStage >= peakLimit) {
          if (Math.random() < 0.005) {
            window.addEtcDrop("Ancient Core", 1);
            window.pushToast("Ancient Core", null, "#e74c3c", true, 1);
          }
          if (Math.random() < 0.0025) {
            window.addEtcDrop("Overlord's Sigil", 1);
            window.pushToast("Overlord's Sigil", null, "#1abc9c", true, 1);
          }
        }
        if (activeStage >= 18 && Math.random() < 0.0025) {
          window.addEtcDrop("Eridium Shard", 1);
          window.pushToast("Eridium Shard", null, "#8e44ad", true, 1);
        }
      }
    }

    window.playerStats.totalLifetimeKills++;
    if (window.playerStats.runKills !== undefined)
      window.playerStats.runKills++;

    if (window.mob && window.mob.type !== "prestige_boss") {
      if (typeof window.progressMission === "function") {
        window.progressMission("kills", 1);
        if (window.mob.isRare) {
          window.progressMission("rares", 1);
        }
      }
      if (
        !window.playerStats.isDungeonMode &&
        !window.playerStats.isCrucibleMode &&
        !window.playerStats.isUberBoss
      ) {
        if (window.playerStats.pendingClanProgress) {
          window.playerStats.pendingClanProgress.kills =
            (window.playerStats.pendingClanProgress.kills || 0) + 1;
        }
      }
    }

    // Handle Prestige Boss death checks and skip normal campaign rewards
    if (window.mob && window.mob.type === "prestige_boss") {
      if (typeof window.triggerPrestigeAscension === "function")
        window.triggerPrestigeAscension();
      return;
    }

    if (window.checkArtifactTrait("frenzy")) {
      if (window.playerStats.frenzyTimer <= 0) {
        window.playerStats.frenzyKillCount++;
        if (window.playerStats.frenzyKillCount >= 8) {
          window.playerStats.frenzyTimer = window.checkArtifactTrait(
            "extend_buffs",
          )
            ? 900
            : 600;
          window.playerStats.frenzyKillCount = 0;
          if (typeof window.pushLog === "function")
            window.pushLog(
              `<strong style='color:#e67e22;'>[BERSERKER RAGE]</strong> 100% Critical Frenzy Unleashed!`,
            );
        }
      }
    }

    if (window.playerStats.isDungeonMode) {
      // Active Debuff: Volatile Sparks (On-death mitigatable explosions)
      if (
        window.playerStats.activeDungeonSigil?.debuffs.some(
          (d) => d.id === "volatile_sparks",
        )
      ) {
        let isBlocked = Math.random() < p.block;
        let isParried = !isBlocked && Math.random() < p.parry;

        if (isBlocked || isParried) {
          window.effects.push({
            x: window.hero.x,
            y: window.hero.y - 15,
            text: isBlocked ? "🛡️ BLOCKED EXPLOSION!" : "⚡ PARRIED EXPLOSION!",
            color: isBlocked ? "#3498db" : "#9b59b6",
            life: 40,
          });
          window.SoundManager.play(isBlocked ? "block" : "parry");
        } else {
          let dmg = Math.ceil(p.maxHp * 0.18);
          window.playerStats.currentHp = Math.max(
            1,
            window.playerStats.currentHp - dmg,
          );
          window.effects.push({
            x: window.hero.x,
            y: window.hero.y,
            text: "-" + dmg + " [EXPLOSION]",
            color: "#e74c3c",
            life: 40,
          });
          window.SoundManager.play("death");
          if (window.playerStats.currentHp <= 1) {
            window.playerStats.currentHp = 0;
            window.deathAnimationTimer = window.deathMaxFrames;
            window.mob = null;
            window.updateUI();
            return;
          }
        }
      }

      if (window.mob.type === "dungeon_boss") {
        let dType = window.playerStats.currentDungeon;
        window.playerStats.currentDungeonStage[dType]++;
        let nextStg = window.playerStats.currentDungeonStage[dType];
        if (window.playerStats.pendingClanProgress) {
          window.playerStats.pendingClanProgress.dungeons =
            (window.playerStats.pendingClanProgress.dungeons || 0) + 1;
        }
        window.playerStats.dungeonPeaks[dType] = Math.max(
          window.playerStats.dungeonPeaks[dType] || 1,
          nextStg,
        );
        window.playerStats.killCount = 0;

        if (typeof window.progressMission === "function")
          window.progressMission("dungeons", 1);

        if (typeof window.pushLog === "function")
          window.pushLog(
            `<span style='color:#2ecc71; font-weight:bold;'>[DUNGEON STAGE CLEAR] Advanced to Dungeon Stage ${nextStg}!</span>`,
          );
      } else {
        window.playerStats.killCount++;
      }
    } else if (isBoss) {
      if (!window.playerStats.isUberBoss) {
        let oldMax = window.playerStats.maxStage;
        let oldPeak = window.playerStats.lifetimePeakStage || 1; // Capture original all-time peak stage before increments
        window.playerStats.stage++;
        window.playerStats.maxStage = Math.max(
          window.playerStats.maxStage || 1,
          window.playerStats.stage,
        );
        window.playerStats.lifetimePeakStage = Math.max(
          window.playerStats.lifetimePeakStage || 1,
          window.playerStats.maxStage,
        );
        if (typeof window.pushLog === "function")
          window.pushLog(
            `<span style='color:#2ecc71; font-weight:bold;'>[AREA CLEARED] Advancing to Stage ${window.playerStats.stage}.</span>`,
          );

        // First-time milestone clear reward (Stage 10, 20, 30...)
        // Enforce peak checking to prevent players from farming milestone drops repeatedly after prestiging
        if (
          window.playerStats.maxStage > oldMax &&
          oldMax % 10 === 0 &&
          window.playerStats.maxStage > oldPeak
        ) {
          if (typeof window.pushLog === "function")
            window.pushLog(
              `<strong style="color:#f1c40f;">🏆 [MILESTONE] Stage ${oldMax} Beaten! Guaranteed random equip dropped!</strong>`,
            );
          if (typeof window.rollEquipmentDrop === "function")
            window.rollEquipmentDrop(true, false, 0, false, oldMax);
        }
      }
      window.playerStats.killCount = 0;
      window.playerStats.isBossMode = false;
      window.playerStats.isFarmingLoop = false;
      window.playerStats.isUberBoss = false;
      window.playerStats.currentHp = p.maxHp;
      if (typeof window.saveGame === "function") window.saveGame();
    } else {
      if (!window.playerStats.isFarmingLoop) {
        window.playerStats.killCount++;
        if (window.playerStats.killCount >= window.playerStats.targetsRequired)
          window.playerStats.isBossMode = true;
      }
    }
    window.mob = null;
    if (typeof window.checkAchievements === "function")
      window.checkAchievements();
    if (typeof window.updateUI === "function") window.updateUI();
  },

  processEnemySpawn() {
    let p = window.resolvePlayerStats();

    // Define activeStage at the top of the function so all sub-blocks can access it
    let activeStage = window.playerStats.stage;
    if (window.playerStats.isUberBoss) {
      let runPeak = Math.max(
        window.playerStats.stage,
        window.playerStats.maxStage || 1,
      );
      let allTime90 = Math.floor(
        (window.playerStats.lifetimePeakStage || 1) * 0.9,
      );
      activeStage = Math.max(runPeak, allTime90);
    }

    if (window.playerStats.isCrucibleMode) {
      let cWave = window.playerStats.crucibleWave || 1;
      let growthRate = 1.06 + cWave * 0.00015;
      let scale = Math.pow(growthRate, cWave);
      if (window.playerStats.killCount >= window.playerStats.targetsRequired) {
        let hp = Math.floor(120 * scale * (1 + cWave * 0.06));
        window.mob = {
          x: 750,
          y: 140,
          w: 45,
          h: 75,
          type: "dungeon_boss",
          isCrucible: true,
          isRare: false,
          hp: hp,
          maxHp: hp,
          damage: Math.floor(20 * scale),
          def: 0,
          flashTimer: 0,
          isStopped: false,
          attackCooldown: 100,
          attackTimer: 100,
        };
      } else {
        let cruciblePool = ["rift_drifter", "star_weaver", "void_wraith"];
        let chosenVisual =
          cruciblePool[Math.floor(Math.random() * cruciblePool.length)];
        let isFlying = ["rift_drifter", "void_wraith"].includes(chosenVisual);

        let hp = Math.floor(25 * scale * (1 + cWave * 0.06));
        window.mob = {
          x: 750,
          y: isFlying ? 145 : 195,
          w: 25,
          h: 30,
          type: "mob",
          visualType: chosenVisual,
          isCrucible: true,
          isRare: false,
          hp: hp,
          maxHp: hp,
          damage: Math.floor(5.2 * scale),
          def: 0,
          flashTimer: 0,
          isStopped: false,
          attackCooldown: 90,
          attackTimer: 90,
        };
      }
      return;
    }

    let scale;
    if (window.playerStats.isDungeonMode) {
      window.playerStats.currentDungeonStage = window.playerStats
        .currentDungeonStage || { equip: 1, gold: 1, mat: 1 };
      let dStage =
        window.playerStats.currentDungeonStage[
          window.playerStats.currentDungeon
        ] || 1;

      // Smooth, campaign-aligned exponential scaling formula avoiding arithmetic overflow at high levels
      let baseRate = 1.045 + (dStage * 0.015) / (dStage + 300);
      scale = Math.pow(baseRate, dStage) * (1 + dStage * 0.05);
    } else {
      // Smooth out post-wall base acceleration to prevent runaway super-exponential cliffs
      let growthRate = 1.045 + (activeStage * 0.04) / (activeStage + 200);
      scale = Math.pow(growthRate, activeStage);
    }

    if (window.playerStats.isDungeonMode) {
      let hpScale = window.playerStats.currentDungeon === "gold" ? 1.5 : 1;
      let dStage =
        window.playerStats.currentDungeonStage[
          window.playerStats.currentDungeon
        ] || 1;

      if (window.playerStats.killCount >= window.playerStats.targetsRequired) {
        let hp = Math.floor(100 * scale * hpScale * (1 + dStage * 0.06));
        window.mob = {
          x: 750,
          y: 140,
          w: 50,
          h: 90,
          type: "dungeon_boss",
          isRare: false,
          hp: Math.floor(hp),
          maxHp: Math.floor(hp),
          damage: Math.floor(20 * scale),
          def: 0,
          flashTimer: 0,
          isStopped: false,
          attackCooldown: 100,
          attackTimer: 100,
        };
        window.playerStats.hasClickedThisBattle = false;
        window.playerStats.damageTakenThisBattle = 0;
        window.playerStats.ankhTriggeredThisBattle = false;
      } else {
        let dType = window.playerStats.currentDungeon || "gold";
        let dPool = [];
        if (dType === "equip") dPool = ["golem", "gargoyle", "wyrmling"];
        else if (dType === "gold")
          dPool = ["coin_elemental", "hoard_mimic", "gilded_scuttler"];
        else dPool = ["swamp_basilisk", "toxic_fly", "marsh_ghost"];

        let chosenVisual = dPool[Math.floor(Math.random() * dPool.length)];
        let isFlying = [
          "gargoyle",
          "toxic_fly",
          "marsh_ghost",
          "gilded_wyrmling",
          "wyrmling",
        ].includes(chosenVisual);

        let hp = Math.floor(25 * scale * hpScale * (1 + dStage * 0.06));
        window.mob = {
          x: 750,
          y: isFlying ? 150 : 195,
          w: 25,
          h: 40,
          type: "mob",
          visualType: chosenVisual,
          isRare: false,
          hp: hp,
          maxHp: Math.floor(hp),
          damage: Math.floor(5.2 * scale),
          def: 0,
          flashTimer: 0,
          isStopped: false,
          attackCooldown: 90,
          attackTimer: 90,
        };
      }
    } else {
      let tier = window.getStageTier();
      if (window.playerStats.isBossMode) {
        if (window.playerStats.isUberBoss) {
          let bossType = window.playerStats.currentUberBoss || "guardian";
          let hpMult = 10.0;
          let dmgMult = 10.0;
          let speedMult = 100;
          let mType = "aegis_goliath";
          let logText =
            "<strong style='color:#3498db;'>Aegis Goliath, The Iron Sentinel</strong> has materialized from the cracked Aether!";

          if (bossType === "chronos") {
            speedMult = 90;
            mType = "chronos_arbitrator";
            logText =
              "<strong style='color:#f1c40f;'>Chronos Arbitrator</strong> has stepped from the temporal flow!";
          } else if (bossType === "nexus") {
            speedMult = 80;
            mType = "nexus_overseer";
            logText =
              "<strong style='color:#ff007f;'>Nexus Overseer</strong> has infected the reality stream!";
          }

          let riftLvl = window.playerStats.activeRiftLevel || 1;
          let equivalentStage = 50 + riftLvl * 10;
          let riftGrowthRate =
            1.045 + (equivalentStage * 0.04) / (equivalentStage + 200);
          let riftScale = Math.pow(riftGrowthRate, equivalentStage);

          let hp = Math.floor(
            hpMult * (100 * riftScale) * (1 + equivalentStage * 0.06),
          );
          let dmg = Math.floor(20 * riftScale * dmgMult);
          window.mob = {
            x: 750,
            y: 115,
            w: 60,
            h: 100,
            type: mType,
            isRare: false,
            hp: hp,
            maxHp: hp,
            damage: dmg,
            def: 0,
            flashTimer: 0,
            isStopped: false,
            attackCooldown: speedMult,
            attackTimer: speedMult,
          };
          window.pushLog(
            `<span style='color:#9b59b6; font-weight:bold;'>[RIFT HUNT]</span> ${logText}`,
          );
        } else {
          let baseBossHp = Math.floor(120 * scale * (1 + activeStage * 0.06));
          window.mob = {
            x: 750,
            y: 150,
            w: 40,
            h: 80,
            type: "boss",
            isRare: false,
            visualTier: tier,
            hp: Math.floor(baseBossHp),
            maxHp: Math.floor(baseBossHp),
            damage: Math.floor(20 * scale),
            def: 0,
            flashTimer: 0,
            isStopped: false,
            attackCooldown: 100,
            attackTimer: 100,
          };
          window.pushLog(
            `<span style='color:#e74c3c; font-weight:bold;'>[STAGE BOSS]</span> blocked your transit route!`,
          );
        }
        window.playerStats.hasClickedThisBattle = false;
        window.playerStats.damageTakenThisBattle = 0;
        window.playerStats.ankhTriggeredThisBattle = false;
      } else {
        let isMelee = Math.random() > 0.5;
        let isRare = Math.random() < p.rareSpawn;
        let hpMult = isRare ? 2.5 : 1;
        let dmgMult = isRare ? 1.5 : 1;

        let visualPool = {
          0: ["slime", "sprout", "thorn_wyrm"],
          1: ["golem", "wyrmling", "gargoyle"],
          2: ["magma_elemental", "lava_serpent", "hell_bat"],
          3: ["marsh_ghost", "swamp_basilisk", "toxic_fly"],
          4: ["void_orb", "void_crawler", "void_spectre"],
          5: ["clockwork_scarab", "temporal_watcher", "clockwork_drone"],
          6: ["neon_spider", "cyber_wraith", "wireframe_orb"],
        };
        let choices = visualPool[tier] || ["slime"];
        let visualType = choices[Math.floor(Math.random() * choices.length)];

        let baseSpd = 90;
        if (
          window.equippedSlots.subweapon &&
          window.equippedSlots.subweapon.isUniqueWatch &&
          window.playerStats.watchActiveTimer > 0
        )
          baseSpd = Math.round(baseSpd * 1.33);

        let hp = Math.floor(25 * scale * hpMult * (1 + activeStage * 0.06));
        window.mob = {
          x: 750,
          y: isMelee ? 195 : 210,
          w: isMelee ? 25 : 30,
          h: isMelee ? 40 : 25,
          type: "mob",
          visualType: visualType,
          isRare: isRare,
          isMelee: isMelee,
          visualTier: tier,
          hp: hp,
          maxHp: hp,
          damage: Math.floor(5.2 * scale * dmgMult),
          def: 0,
          flashTimer: 0,
          isStopped: false,
          attackCooldown: baseSpd,
          attackTimer: baseSpd,
        };

        if (isRare) {
          window.pushLog(
            `<span style='color:#ffb6c1; font-weight:bold;'>✨ A glowing Rare enemy appears!</span>`,
          );
          if (p.hasSingularitySet) {
            window.playerStats.frenzyTimer = window.checkArtifactTrait(
              "extend_buffs",
            )
              ? 600
              : 300;
            window.pushLog(
              `<span style='color:#9b59b6;'>[SINGULARITY] Instantly triggered Frenzy Mode!</span>`,
            );
          }
        }
      }
    }
    if (window.mob) window.mob.id = window.idCounter++;

    if (
      window.mob &&
      window.playerStats.maelstromCleavePool &&
      window.playerStats.maelstromCleavePool > 0
    ) {
      let cleave = window.playerStats.maelstromCleavePool;
      window.playerStats.maelstromCleavePool = 0;
      window.mob.hp -= cleave;
      window.mob.flashTimer = 5;
      window.spawnDamageEffect(cleave, "echo", false);
      window.effects.push({
        x: window.mob.x,
        y: window.mob.y - 12,
        text: "🌪️ CLEAVED!",
        color: "#2ecc71",
        life: 55,
      });
      if (window.mob.hp <= 0) setTimeout(() => window.handleMobDeath(), 50);
    }
  },

  handlePlayerDefeat() {
    window.effects = window.effects.filter((e) => !e.isCumulative);
    window.isGamePaused = true;
    window.deathAnimationTimer = 0;
    window.playerStats.deathCount = (window.playerStats.deathCount || 0) + 1;

    let wasCrucible = window.playerStats.isCrucibleMode;
    let wasDungeon = window.playerStats.isDungeonMode;
    let wasUber = window.playerStats.isUberBoss;
    let wasPrestige = window.playerStats.isPrestigeBossMode;

    let activeDungeon = window.playerStats.currentDungeon;
    let dungeonFloor =
      wasDungeon && activeDungeon
        ? window.playerStats.currentDungeonStage[activeDungeon] || 1
        : 1;
    let finalWave = window.playerStats.crucibleWave || 1;

    window.playerStats.isBossMode = false;
    window.playerStats.isFarmingLoop = false;
    window.playerStats.isUberBoss = false;
    window.playerStats.isDungeonMode = false;
    window.playerStats.isCrucibleMode = false;
    window.playerStats.isPrestigeBossMode = false;
    window.playerStats.activeDungeonSigil = null; // Clear on death
    window.playerStats.prestigeApproachTimer = 0;
    window.mob = null;
    window.playerStats.usedSecondWind = false;
    window.hero.x = 40;

    window.SoundManager.play("defeat");

    if (wasCrucible) {
      let shards = window.playerStats.crucibleAccumulatedShards || 0;
      let cores = window.playerStats.crucibleAccumulatedCores || 0;

      let keptShards = Math.floor(shards * 0.2);
      let keptCores = Math.floor(cores * 0.2);

      window.playerStats.astralShards =
        (window.playerStats.astralShards || 0) + keptShards;
      if (keptCores > 0) {
        window.addEtcDrop("Catalyst Core", keptCores);
      }

      window.playerStats.crucibleAccumulatedShards = 0;
      window.playerStats.crucibleAccumulatedCores = 0;
      window.playerStats.crucibleRunActive = false;

      window.showCrucibleSummaryModal(finalWave, keptShards, keptCores, true); // Died
      return;
    }

    let prestigeCount = window.playerStats.prestigeCount || 0;
    let rollbackPercent = 0.8;
    if (prestigeCount >= 1)
      rollbackPercent = Math.min(0.95, 0.9 + (prestigeCount - 1) * 0.01);

    let restartStage;
    if (wasDungeon) {
      restartStage = window.playerStats.stage;
      let dNames = {
        equip: "Equipment Dungeon",
        gold: "Gold Mine",
        mat: "Material Cavern",
      };
      let dName = dNames[activeDungeon] || "Dungeon";
      document.getElementById("death-stat-peak").innerText =
        `${dName} Floor ${dungeonFloor}`;
      document.getElementById("death-stat-retreat").innerText =
        `Campaign Stage ${restartStage}`;
    } else {
      // Campaign only rollback condition (Dungeons, Crucible, Altar Uber Bosses, and Prestige Bosses bypass rollback)
      let isOutsideCampaign = wasUber || wasPrestige || wasCrucible;
      if (isOutsideCampaign) {
        restartStage = window.playerStats.stage;
        document.getElementById("death-stat-peak").innerText = wasUber
          ? "Rift Guardian"
          : "Prestige Boss";
        document.getElementById("death-stat-retreat").innerText =
          `Campaign Stage ${restartStage}`;
      } else {
        // Standard campaign death (mobs or stage bosses) -> Rollback applied
        restartStage = Math.max(
          1,
          Math.floor((window.playerStats.maxStage || 1) * rollbackPercent),
        );
        window.playerStats.stage = restartStage;
        document.getElementById("death-stat-peak").innerText =
          `Stage ${window.playerStats.maxStage || 1}`;
        document.getElementById("death-stat-retreat").innerText =
          `Stage ${restartStage}`;
      }
    }

    document.getElementById("death-stat-kills").innerText = window.formatNumber(
      window.playerStats.runKills || 0,
    );
    document.getElementById("death-stat-run-gold").innerText =
      `+` + window.formatNumber(window.playerStats.runGold || 0);
    document.getElementById("death-stat-run-xp").innerText =
      `+` + window.formatNumber(window.playerStats.runXp || 0);
    document.getElementById("death-tip-text").innerText =
      "Reforging modifiers with Catalyst Cores and tempering weapon components significantly increases battle survivability.";

    window.updateUI();

    if (wasDungeon)
      window.pushLog(
        `<span style='color:#e74c3c; font-weight:bold;'>[DUNGEON STAGE FAILIURE] Died on Dungeon Floor. Safely returned to Campaign Stage ${restartStage}.</span>`,
      );
    else
      window.pushLog(
        `<span style='color:#e74c3c; font-weight:bold;'>[DEFEATED] Returned to Stage ${restartStage} (${Math.round(rollbackPercent * 100)}% of Max Stage). No equipment lost!</span>`,
      );

    document.getElementById("death-overlay").style.display = "flex";
    window.saveGame();

    let timeLeft = 10;
    const spinner = document.getElementById("death-respawn-spinner");
    const timerText = document.getElementById("death-respawn-timer-text");
    const secondsLabel = document.getElementById("death-timer-seconds");

    if (spinner) spinner.style.strokeDashoffset = "0";
    if (timerText) timerText.innerText = timeLeft;
    if (secondsLabel) secondsLabel.innerText = timeLeft;
    if (window.respawnIntervalId) clearInterval(window.respawnIntervalId);

    let tickCount = 0;
    const tickRate = 100;
    const totalTicks = 10 * (1000 / tickRate);

    window.respawnIntervalId = setInterval(() => {
      if (window.isGamePaused) {
        tickCount++;
        let progress = tickCount / totalTicks;
        let remainingSeconds = Math.ceil(10 - (tickCount * tickRate) / 1000);
        if (spinner)
          spinner.style.strokeDashoffset = (progress * 113.1).toFixed(2);
        if (timerText) timerText.innerText = remainingSeconds;
        if (secondsLabel) secondsLabel.innerText = remainingSeconds;
        if (tickCount >= totalTicks) {
          clearInterval(window.respawnIntervalId);
          window.respawnIntervalId = null;
          window.respawnHero();
        }
      } else {
        clearInterval(window.respawnIntervalId);
        window.respawnIntervalId = null;
      }
    }, tickRate);
  },

  respawnHero() {
    if (window.respawnIntervalId) {
      clearInterval(window.respawnIntervalId);
      window.respawnIntervalId = null;
    }
    document.getElementById("death-overlay").style.display = "none";
    let p = window.resolvePlayerStats();
    window.playerStats.currentHp = p.maxHp;

    window.mob = null;
    window.projectiles = [];
    window.hero.x = 40;
    window.playerStats.runKills = 0;
    window.playerStats.runGold = 0;
    window.playerStats.runXp = 0;
    window.playerStats.killedBy = "Unknown Foe";
    window.playerStats.killedByMob = null;

    window.deathAnimationTimer = 0;
    window.SoundManager.play("revive");
    window.updateUI();
    window.reviveTimer = 90;
    window.setPauseState(false);
  },
};

window.triggerPlayerSlash = () => window.CombatEngine.triggerPlayerSlash();
window.executeHitCalculations = () =>
  window.CombatEngine.executeHitCalculations();
window.handleMobDeath = () => window.CombatEngine.handleMobDeath();
window.processEnemySpawn = () => window.CombatEngine.processEnemySpawn();
window.handlePlayerDefeat = () => window.CombatEngine.handlePlayerDefeat();
window.respawnHero = () => window.CombatEngine.respawnHero();

window.useItem = function (itemName) {
  if (!window.inventory.USE[itemName] || window.inventory.USE[itemName] <= 0)
    return;

  // Handle Weekly Clan Supply Crate locally
  if (itemName === "Weekly Clan Supply Crate") {
    window.inventory.USE[itemName]--;
    if (window.inventory.USE[itemName] === 0) {
      delete window.inventory.USE[itemName];
    }

    window.SoundManager.play("revive");
    window.setPauseState(true);

    let depotLevel =
      (window.playerStats.clanSkills &&
        window.playerStats.clanSkills.clan_supply_depot) ||
      0;
    let stage = window.playerStats.stage || 1;
    let stgScale = Math.max(1, Math.floor((stage - 1) / 10) + 1);
    let itemLvlMultiplier = Math.pow(1.08, stage);

    // Scaling yields based on Depot Level research
    let baseGold = Math.floor(
      50000 * itemLvlMultiplier * (1 + depotLevel * 0.2),
    );
    let baseSouls = Math.floor(100 * (1 + depotLevel * 0.1));
    let baseKeys = 1;

    window.playerStats.coins += baseGold;
    window.playerStats.totalGoldEarned =
      (window.playerStats.totalGoldEarned || 0) + baseGold;
    window.addEtcDrop("Monster Soul", baseSouls);
    window.addEtcDrop("Gacha Key", baseKeys);

    let premiumDrops = [];
    if (depotLevel >= 5) {
      window.addEtcDrop("Catalyst Core", 1);
      premiumDrops.push(`<span style="color:#2ecc71;">+1 Catalyst Core</span>`);
    }
    if (depotLevel >= 10) {
      window.addEtcDrop("Ancient Core", 1);
      premiumDrops.push(`<span style="color:#e74c3c;">+1 Ancient Core</span>`);
    }
    if (depotLevel >= 15) {
      window.addEtcDrop("Astral Essence", 1);
      premiumDrops.push(
        `<span style="color:#9b59b6;">+1 Astral Essence</span>`,
      );
    }
    if (depotLevel >= 20) {
      window.addEtcDrop("Eridium Shard", 2);
      premiumDrops.push(
        `<span style="color:#8e44ad;">+2 Eridium Shards</span>`,
      );
    }
    if (depotLevel >= 25) {
      window.addEtcDrop("Glimmering Gachapon Key", 1);
      premiumDrops.push(
        `<span style="color:#00d2ff;">+1 Glimmering Key</span>`,
      );
    }
    if (depotLevel >= 30) {
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
      let rolledStars = Math.random() < 0.25 ? 5 : 4;
      let rewardItem = window.createItemObject(
        chosenType,
        rolledStars,
        stgScale,
        rolledStars,
      );
      window.inventory.EQUIP.push(rewardItem);
      window.frozenItemDb[rewardItem.id] = JSON.parse(
        JSON.stringify(rewardItem),
      );
      premiumDrops.push(
        `<span style="color:${window.getTierColor(rolledStars)}; font-weight:bold;">+${rewardItem.name} (${rolledStars}★)</span>`,
      );
    }

    let overlay = document.createElement("div");
    overlay.id = "supply-crate-overlay";
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

    overlay.innerHTML = `
        <style>
          .crate-anim-container {
            display: flex;
            justify-content: center;
            align-items: center;
            height: 180px;
            margin-bottom: 10px;
          }
          .crate-svg {
            animation: crateShake 0.6s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
            overflow: visible !important;
          }
          .crate-lid {
            animation: lidPopoff 0.5s cubic-bezier(0.25, 0.8, 0.25, 1.25) forwards;
            animation-delay: 0.5s;
            transform-origin: 50px 30px;
          }
          .crate-sparkle {
            opacity: 0;
            animation: crateSparkleUp 0.8s cubic-bezier(0.25, 1, 0.5, 1) forwards;
            animation-delay: 0.55s;
          }
          .cs1 { --dx: 0px; --dy: -42px; --ds: 1.5; }
          .cs2 { --dx: -32px; --dy: -32px; --ds: 1.3; }
          .cs3 { --dx: 32px; --dy: -32px; --ds: 1.3; }
          .cs4 { --dx: -16px; --dy: -46px; --ds: 1.2; }
          .cs5 { --dx: 16px; --dy: -46px; --ds: 1.2; }

          @keyframes crateShake {
            0%, 100% { transform: rotate(0deg) scale(1); }
            15% { transform: rotate(-6deg) scale(1.05); }
            30% { transform: rotate(7deg) scale(1.05); }
            45% { transform: rotate(-7deg) scale(1.05); }
            60% { transform: rotate(5deg) scale(1.02); }
            75% { transform: rotate(-3deg) scale(1.01); }
            90% { transform: rotate(1deg) scale(1.0); }
          }
          @keyframes lidPopoff {
            0% { transform: translateY(0) rotate(0deg); opacity: 1; }
            100% { transform: translateY(-30px) rotate(-15deg); opacity: 0; }
          }
          @keyframes crateSparkleUp {
            0% { transform: translate(0, 15px) scale(0); opacity: 0; }
            40% { opacity: 1; }
            100% { transform: translate(var(--dx), var(--dy)) scale(var(--ds)); opacity: 0; }
          }
        </style>
        <div style="text-align:center; color:white; animation: toastFadeIn 0.3s ease-out;">
          <div class="crate-anim-container">
            <svg class="crate-svg" width="150" height="150" viewBox="0 0 100 100">
              <!-- Drop Shadow -->
              <ellipse cx="50" cy="90" rx="36" ry="6" fill="rgba(0,0,0,0.5)" />
              <!-- Crate Body -->
              <rect x="20" y="38" width="60" height="48" rx="2" fill="#873600" stroke="#000" stroke-width="2.5" />
              <!-- Inner Wood Planks lines -->
              <line x1="32" y1="38" x2="32" y2="86" stroke="#5c2e16" stroke-width="1.5" />
              <line x1="44" y1="38" x2="44" y2="86" stroke="#5c2e16" stroke-width="1.5" />
              <line x1="56" y1="38" x2="56" y2="86" stroke="#5c2e16" stroke-width="1.5" />
              <line x1="68" y1="38" x2="68" y2="86" stroke="#5c2e16" stroke-width="1.5" />
              <!-- Diagonal Crossbeams -->
              <line x1="22" y1="40" x2="78" y2="84" stroke="#5c2e16" stroke-width="3" />
              <!-- Iron Corner Brackets -->
              <rect x="20" y="38" width="10" height="10" fill="#7f8c8d" stroke="#000" stroke-width="1.5" />
              <rect x="70" y="38" width="10" height="10" fill="#7f8c8d" stroke="#000" stroke-width="1.5" />
              <rect x="20" y="76" width="10" height="10" fill="#7f8c8d" stroke="#000" stroke-width="1.5" />
              <rect x="70" y="76" width="10" height="10" fill="#7f8c8d" stroke="#000" stroke-width="1.5" />
              <!-- Lock Bracket -->
              <rect x="44" y="44" width="12" height="15" rx="1.5" fill="#f1c40f" stroke="#000" stroke-width="1.5" />
              <circle cx="50" cy="51" r="2.2" fill="#111" />

              <!-- Crate Lid (Pops Off!) -->
              <g class="crate-lid">
                <rect x="16" y="28" width="68" height="11" rx="1" fill="#a0522d" stroke="#000" stroke-width="2.5" />
                <line x1="24" y1="28" x2="24" y2="39" stroke="#5c2e16" stroke-width="1.5" />
                <line x1="76" y1="28" x2="76" y2="39" stroke="#5c2e16" stroke-width="1.5" />
              </g>

              <!-- Sparkling treasures bursting -->
              <g>
                <polygon class="crate-sparkle cs1" points="50,22 53,28 60,28 55,32 57,38 50,34 43,38 45,32 40,28 47,28" fill="#f1c40f" stroke="#000" stroke-width="0.8" />
                <circle class="crate-sparkle cs2" cx="35" cy="25" r="3" fill="#00d2ff" />
                <circle class="crate-sparkle cs3" cx="65" cy="25" r="3" fill="#2ecc71" />
                <polygon class="crate-sparkle cs4" points="40,20 42,24 46,24 43,26 44,30 40,28 36,30 37,26 34,24 38,24" fill="#9b59b6" stroke="#000" stroke-width="0.8" />
                <circle class="crate-sparkle cs5" cx="60" cy="18" r="2.5" fill="#ffb6c1" />
              </g>
            </svg>
          </div>
          <div style="font-size: 15px; font-weight: 900; color:#ffaa00; letter-spacing: 2px; text-shadow: 0 0 6px rgba(255,170,0,0.3);">UNBOXING SUPPLY CRATE...</div>
        </div>
      `;

    setTimeout(() => {
      let premiumHtml =
        premiumDrops.length > 0
          ? `<div style="margin-top:12px; border-top:1px dashed #444; padding-top:10px; font-family:monospace; font-size:10px; text-align:left;">
                <div style="color:#00d2ff; font-weight:bold; margin-bottom:4px; text-transform:uppercase; letter-spacing:0.5px;">🏢 SUPPLY DEPOT BONUS CHECKS:</div>
                ${premiumDrops.join("<br>")}
             </div>`
          : "";

      overlay.innerHTML = `
          <div style="background:#151515; border:3px solid #ffaa00; border-radius:12px; width:95%; max-width:420px; box-shadow:0 15px 45px rgba(0,0,0,0.95); text-align:center; padding:20px; animation: toastFadeIn 0.3s; overflow:hidden;">
              <h2 style="margin:0 0 10px 0; color:#ffaa00; letter-spacing:2px; text-transform:uppercase; font-size:18px;">🎁 SUPPLY CRATE UNBOXED!</h2>
              <div style="height:2px; background:linear-gradient(90deg, transparent, #ffaa00, transparent); margin-bottom:15px;"></div>
              <p style="font-size:11px; color:#aaa; line-height:1.45; margin-bottom:15px; white-space:normal; text-align:center;">
                  You cracked open the **Weekly Supply Crate**! Depot level **Lv. ${depotLevel}** has granted the following yields:
              </p>
              <div style="background:#0c0f12; border:1px solid #ffaa00; border-radius:6px; padding:15px; margin-bottom:15px; text-align:left;">
                  <div style="font-size:11px; color:#aaa; margin-bottom:4px; text-transform:uppercase; letter-spacing:0.5px;">📦 Loot Yields:</div>
                  <div style="font-size:13px; color:#f1c40f; font-weight:bold; margin-bottom:3px; font-family:monospace;">🟡 +${baseGold.toLocaleString()} Gold</div>
                  <div style="font-size:13px; color:#ffb6c1; font-weight:bold; margin-bottom:3px; font-family:monospace;">💀 +${baseSouls.toLocaleString()} Monster Souls</div>
                  <div style="font-size:13px; color:#f1c40f; font-weight:bold; font-family:monospace;">🔑 +${baseKeys} Gacha Key</div>
                  ${premiumHtml}
              </div>
              <button id="btn-supply-crate-confirm" style="background:linear-gradient(135deg, #ffaa00, #e67e22); color:#000; border:1px solid #fff; font-weight:bold; font-size:12px; text-transform:uppercase; letter-spacing:1px; padding:12px; border-radius:6px; cursor:pointer; width:100%; box-shadow:0 4px 15px rgba(255,170,0,0.3);">Claim Supplies</button>
          </div>
        `;

      document.getElementById("btn-supply-crate-confirm").onclick =
        function () {
          overlay.remove();
          window.isGamePaused = false;
          window.updateUI();
          window.renderInventory();
        };
    }, 1100);
    return;
  }

  const dailySacks = [
    "Daily Reward Sack",
    "Guild Reward Sack",
    "Daily Guild Reward Sack",
    "Clan Reward Sack",
  ];
  const weeklySacks = [
    "Weekly Reward Sack",
    "Guild Weekly Sack",
    "Clan Weekly Sack",
  ];
  if (dailySacks.includes(itemName)) {
    if (typeof window.openDailyRewardSack === "function") {
      window.openDailyRewardSack(itemName);
    }
    return;
  }

  if (weeklySacks.includes(itemName)) {
    if (typeof window.openWeeklyRewardSack === "function") {
      window.openWeeklyRewardSack(itemName);
    }
    return;
  }
  if (itemName === "Guild Weekly Sack") {
    if (typeof window.openGuildWeeklySack === "function") {
      window.openGuildWeeklySack();
    }
    return;
  }

  let pBefore = window.resolvePlayerStats();
  let baseBonusDuration = 18000;
  let effectiveInt = Math.max(0, pBefore.int - 5);
  let intBonusMultiplier = 1 + effectiveInt * 0.000001; // +0.0001% duration per point of INT
  let achDurationBonus = 1.0;
  if (window.playerStats.unlockedAchievements && window.AchievementsData) {
    window.playerStats.unlockedAchievements.forEach((id) => {
      let ach = window.AchievementsData.find((a) => a.id === id);
      if (ach && ach.stats && ach.stats.potDurationPct)
        achDurationBonus += ach.stats.potDurationPct;
    });
  }
  let finalDuration = Math.floor(
    baseBonusDuration * intBonusMultiplier * achDurationBonus,
  );

  function consumeUseItem(name) {
    if (
      window.checkArtifactTrait("philosopher_catalyst") &&
      Math.random() < 0.25
    ) {
      window.pushHeaderToast("✨ Elixir Sparing Effect Triggered!", "#2ecc71");
      window.pushLog(
        `<strong style='color:#9b59b6;'>[PHILOSOPHER'S CATALYST]</strong> Sparing check passed! Your ${name} was not consumed.`,
      );
    } else {
      window.inventory.USE[name]--;
      if (window.inventory.USE[name] === 0) delete window.inventory.USE[name];
    }
    window.playerStats.elixirsConsumed =
      (window.playerStats.elixirsConsumed || 0) + 1;
    if (name.includes("Elixir") && window.playerStats.pendingClanProgress) {
      window.playerStats.pendingClanProgress.potions =
        (window.playerStats.pendingClanProgress.potions || 0) + 1;
    }
    window.checkAchievements();
    window.pushHeaderToast(`Consumed ${name}!`, "#2ecc71");
  }

  if (itemName === "SP Reset Scroll") {
    let totalRefund = 0;
    for (let key in window.playerStats.spAllocations) {
      totalRefund += window.playerStats.spAllocations[key];
      window.playerStats.spAllocations[key] = 0;
    }
    if (totalRefund === 0) {
      window.pushHeaderToast("No SP allocated to reset!", "#e74c3c");
      return;
    }
    window.playerStats.sp += totalRefund;
    window.inventory.USE[itemName]--;
    if (window.inventory.USE[itemName] === 0)
      delete window.inventory.USE[itemName];
    window.pushLog(
      "<span style='color:#3498db; font-weight:bold;'>[USE] Used SP Reset Scroll. All Attribute Matrix SP refunded!</span>",
    );
    window.pushHeaderToast("🔮 Attribute SP Reset Successfully!", "#3498db");
  } else if (itemName === "PP Reset Scroll") {
    let upgrades = window.playerStats.prestigeUpgrades || {
      bag: 0,
      gold: 0,
      exp: 0,
      drop: 0,
    };
    let totalRefund = 0;
    for (let key in upgrades) {
      totalRefund += upgrades[key];
      upgrades[key] = 0;
    }
    if (totalRefund === 0) {
      window.pushHeaderToast("No PP allocated to reset!", "#e74c3c");
      return;
    }
    window.playerStats.prestigePoints += totalRefund;
    window.inventory.USE[itemName]--;
    if (window.inventory.USE[itemName] === 0)
      delete window.inventory.USE[itemName];
    window.pushLog(
      "<span style='color:#e67e22; font-weight:bold;'>[USE] Used PP Reset Scroll. All Ascension upgrades refunded!</span>",
    );
    window.pushHeaderToast("🔮 Prestige Points Reset Successfully!", "#e67e22");
    if (typeof window.renderPrestigeTab === "function")
      window.renderPrestigeTab();
  } else if (itemName === "Double XP Elixir") {
    window.playerStats.xpPotionTimer =
      (window.playerStats.xpPotionTimer || 0) + finalDuration;
    window.playerStats.xpPotionStrength = 1.0;
    consumeUseItem(itemName);
    window.pushLog(
      `<span style='color:#a855f7; font-weight:bold;'>[USE] Consumed ${itemName}! EXP gain rates boosted by +${Math.floor(finalDuration / 60)}s.</span>`,
    );
  } else if (itemName === "Double Drop Elixir") {
    window.playerStats.dropPotionTimer =
      (window.playerStats.dropPotionTimer || 0) + finalDuration;
    window.playerStats.dropPotionStrength = 1.0;
    consumeUseItem(itemName);
    window.pushLog(
      `<span style='color:#2ecc71; font-weight:bold;'>[USE] Consumed ${itemName}! Drop rate boosted by +${Math.floor(finalDuration / 60)}s.</span>`,
    );
  } else if (itemName === "Drop Quality Elixir") {
    window.playerStats.qlyPotionTimer =
      (window.playerStats.qlyPotionTimer || 0) + finalDuration;
    window.playerStats.qlyPotionStrength = 0.5;
    consumeUseItem(itemName);
    window.pushLog(
      `<span style='color:#3b82f6; font-weight:bold;'>[USE] Consumed ${itemName}! Drop Quality boosted by +${Math.floor(finalDuration / 60)}s.</span>`,
    );
  } else if (itemName.includes("Attack Elixir")) {
    if (
      window.playerStats.atkPotionTimer > 0 &&
      window.playerStats.atkPotionStrength <
        (itemName.includes("Supernal")
          ? 0.35
          : itemName.includes("Greater")
            ? 0.2
            : 0.1)
    )
      window.playerStats.hasTriggeredAlchemicalSynthesis = true;
    window.playerStats.atkPotionTimer =
      (window.playerStats.atkPotionTimer || 0) + finalDuration;
    window.playerStats.atkPotionStrength = itemName.includes("Supernal")
      ? 0.35
      : itemName.includes("Greater")
        ? 0.2
        : 0.1;
    consumeUseItem(itemName);
    window.pushLog(
      `<span style='color:#2ecc71; font-weight:bold;'>[USE] Consumed ${itemName}! Attack boosted by +${Math.floor(finalDuration / 60)}s.</span>`,
    );
  } else if (itemName.includes("Vitality Elixir")) {
    window.playerStats.hpPotionTimer =
      (window.playerStats.hpPotionTimer || 0) + finalDuration;
    window.playerStats.hpPotionStrength = itemName.includes("Supernal")
      ? 0.35
      : itemName.includes("Greater")
        ? 0.2
        : 0.1;
    consumeUseItem(itemName);
    window.pushLog(
      `<span style='color:#e74c3c; font-weight:bold;'>[USE] Consumed ${itemName}! Max HP boosted by +${Math.floor(finalDuration / 60)}s.</span>`,
    );
  } else if (itemName.includes("Armored Elixir")) {
    window.playerStats.defPotionTimer =
      (window.playerStats.defPotionTimer || 0) + finalDuration;
    window.playerStats.defPotionStrength = itemName.includes("Supernal")
      ? 0.35
      : itemName.includes("Greater")
        ? 0.2
        : 0.1;
    consumeUseItem(itemName);
    window.pushLog(
      `<span style='color:#3498db; font-weight:bold;'>[USE] Consumed ${itemName}! Defense boosted by +${Math.floor(finalDuration / 60)}s.</span>`,
    );
  } else if (itemName.includes("Haste Elixir")) {
    window.playerStats.hastePotionTimer =
      (window.playerStats.hastePotionTimer || 0) + finalDuration;
    window.playerStats.hastePotionStrength = itemName.includes("Supernal")
      ? 3
      : itemName.includes("Greater")
        ? 2
        : 1;
    consumeUseItem(itemName);
    window.pushLog(
      `<span style='color:#f1c40f; font-weight:bold;'>[USE] Consumed ${itemName}! Speed boosted by +${Math.floor(finalDuration / 60)}s.</span>`,
    );
  } else if (itemName === "Cavern Sigil Sack") {
    let maxBag = window.getMaxBagSlots();
    if (window.inventory.SIGIL.length >= maxBag) {
      window.pushHeaderToast("❌ Sigil pouch is full!", "#e74c3c");
      return;
    }

    window.inventory.USE[itemName]--;
    if (window.inventory.USE[itemName] === 0) {
      delete window.inventory.USE[itemName];
    }

    // Roll Rarity
    let roll = Math.random() * 100;
    let stars = 1;
    if (roll < 3.0)
      stars = 5; // Legendary
    else if (roll < 12.0)
      stars = 4; // Epic
    else if (roll < 30.0)
      stars = 3; // Magic
    else if (roll < 60.0)
      stars = 2; // Rare
    else stars = 1; // Common

    // Draw Buffs & Debuffs
    let bPool = [...window.CAVERN_BUFFS].sort(() => Math.random() - 0.5);
    let dPool = [...window.CAVERN_DEBUFFS].sort(() => Math.random() - 0.5);

    let count = stars >= 5 ? 3 : stars >= 3 ? 2 : 1;
    let chosenBuffs = bPool.slice(0, count);
    let chosenDebuffs = dPool.slice(0, count);

    // Reward Mult & Quality Boost
    let rewardMult = 0;
    let qlyBoost = 0;
    if (stars === 1 || stars === 2) {
      rewardMult = parseFloat(window.randFloat(0.15, 0.35).toFixed(4));
    } else if (stars === 3 || stars === 4) {
      rewardMult = parseFloat(window.randFloat(0.45, 0.75).toFixed(4));
      qlyBoost = 0.15;
    } else {
      rewardMult = parseFloat(window.randFloat(1.0, 1.5).toFixed(4));
      qlyBoost = 0.35;
    }

    // Procedural Name (Swift Strikes prefix + Withering Decay suffix)
    let buffPrefix = chosenBuffs[0].name;
    let debuffSuffix = chosenDebuffs[0].name.split(" ").pop();
    let name = `${buffPrefix} Cavern Sigil of ${debuffSuffix} (${stars}★)`;

    let newSigil = {
      id: window.idCounter++,
      name: name,
      type: "sigil",
      statsRolled: stars,
      buffs: chosenBuffs,
      debuffs: chosenDebuffs,
      rewardMultiplier: rewardMult,
      qualityBoost: qlyBoost,
      temperLevel: 0,
      stageLevel: 1,
      locked: false,
    };

    window.inventory.SIGIL.push(newSigil);
    window.frozenItemDb[newSigil.id] = JSON.parse(JSON.stringify(newSigil));

    if (window.SoundManager) window.SoundManager.play("fairy");
    if (typeof window.openCavernSigilSackAnimation === "function") {
      window.openCavernSigilSackAnimation(newSigil);
    } else {
      window.pushHeaderToast(`Found: ${name}!`, window.getTierColor(stars));
    }

    window.pushLog(
      `<strong style='color:#9b59b6;'>[UNBOX]</strong> Unboxed <span style='color:${window.getTierColor(stars)};'>${name}</span> from the Cavern Sigil Sack!`,
    );
  }

  if (
    typeof window.progressMission === "function" &&
    itemName.includes("Elixir")
  ) {
    window.progressMission("elixirs", 1);
  }

  let pAfter = window.resolvePlayerStats();
  window.playerStats.currentHp = Math.min(
    window.playerStats.currentHp,
    pAfter.maxHp,
  );
  setTimeout(() => {
    window.updateUI();
    window.renderInventory();
    window.saveGame();
  }, 50);
};

window.triggerFairyLoot = function (targetFairy) {
  let p = window.resolvePlayerStats();
  let maxBag = window.getMaxBagSlots();
  let spawnX = targetFairy.x;
  let spawnY =
    targetFairy.y + Math.sin(Date.now() / 200 + targetFairy.offset) * 10;

  if (window.activeFairies.length >= 2) {
    window.playerStats.fairyClicksWindow =
      window.playerStats.fairyClicksWindow || [];
    let clickNow = Date.now();
    window.playerStats.fairyClicksWindow.push(clickNow);
    window.playerStats.fairyClicksWindow =
      window.playerStats.fairyClicksWindow.filter((t) => clickNow - t <= 2000);
    if (window.playerStats.fairyClicksWindow.length >= 3)
      window.playerStats.hasTriggeredPatientShepherd = true;
  }

  window.playerStats.fairyClicksWindowLong =
    window.playerStats.fairyClicksWindowLong || [];
  let longNow = Date.now();
  window.playerStats.fairyClicksWindowLong.push(longNow);
  window.playerStats.fairyClicksWindowLong =
    window.playerStats.fairyClicksWindowLong.filter(
      (t) => longNow - t <= 10000,
    );
  window.playerStats.maxFairyClicksInWindow = Math.max(
    window.playerStats.maxFairyClicksInWindow || 0,
    window.playerStats.fairyClicksWindowLong.length,
  );

  window.activeFairies = window.activeFairies.filter(
    (f) => f.id !== targetFairy.id,
  );
  window.SoundManager.play("fairy");
  window.playerStats.fairiesClicked =
    (window.playerStats.fairiesClicked || 0) + 1;
  if (window.playerStats.pendingClanProgress) {
    window.playerStats.pendingClanProgress.fairies =
      (window.playerStats.pendingClanProgress.fairies || 0) + 1;
  }
  if (typeof window.progressMission === "function")
    window.progressMission("fairies", 1);

  for (let i = 0; i < 15; i++) {
    window.particles.push({
      x: spawnX,
      y: spawnY,
      vx: window.randFloat(-4, 4),
      vy: window.randFloat(-6, -1),
      radius: window.randFloat(2, 4),
      color: targetFairy.color || "#f1c40f",
      alpha: 1,
      life: window.randInt(25, 45),
    });
  }

  if (window.checkArtifactTrait("fairy_wealth") && Math.random() < 0.15) {
    window.addEtcDrop("Luminous Soul", 1);
    window.effects.push({
      x: spawnX,
      y: spawnY - 10,
      text: `💖 +1 Luminous Soul!`,
      color: "#ffb6c1",
      life: 80,
    });
    window.pushLog(
      `<strong style='color:#ffb6c1;'>[FAIRY QUEEN'S CROWN]</strong> Extracted 1 Luminous Soul from the fairy magic!`,
    );
    return;
  }

  if (Math.random() < 0.2) {
    let goldYield = Math.floor((100 + window.playerStats.stage * 35) * p.gold);
    window.playerStats.coins += goldYield;
    if (window.playerStats.runGold !== undefined)
      window.playerStats.runGold += goldYield;
    else window.playerStats.runGold = goldYield;
    if (typeof window.progressMission === "function")
      window.progressMission("gold", goldYield);
    window.effects.push({
      x: spawnX,
      y: spawnY - 10,
      text: `+${goldYield} Gold!`,
      color: "#f1c40f",
      life: 80,
    });
    return;
  }

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
  let luckMultiplier = p.qly;
  let roll = Math.random() * 100;

  if (roll < 0.01 * luckMultiplier) statLinesCount = 5;
  else if (roll < 0.05 * luckMultiplier) statLinesCount = 4;
  else if (roll < 0.5 * luckMultiplier) statLinesCount = 3;
  else if (roll < 2.5 * luckMultiplier) statLinesCount = 2;
  else if (roll < 10.0 * luckMultiplier) statLinesCount = 1;
  else statLinesCount = 0;

  let activeStage =
    window.playerStats.lifetimePeakStage || window.playerStats.stage || 1;
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
  let newItem = window.createItemObject(
    chosenType,
    statLinesCount,
    stageScale,
    0,
  );

  if (window.checkAutoSalvage(newItem, false)) {
    window.beams.push({
      x: spawnX,
      color: window.getTierColor(newItem.statsRolled),
      life: 35,
      maxLife: 35,
    });
    window.checkAchievements();
    window.updateUI();
    return;
  }

  if (window.inventory.EQUIP.length >= maxBag) {
    window.pushHeaderToast(`Sacks Full! Soul gathered.`, "#e74c3c");
    window.addEtcDrop("Monster Soul", 5);
    return;
  }

  window.inventory.EQUIP.push(newItem);
  window.pushLog(
    `<strong style='color:#ffb6c1;'>[FAIRY]</strong> Dropped: <span style='color:${window.getTierColor(newItem.statsRolled)};'>${newItem.name}</span>`,
    newItem.id,
  );

  let color = window.getTierColor(newItem.statsRolled);
  window.beams.push({ x: spawnX, color: color, life: 35, maxLife: 35 });

  window.pushToast(newItem.name, newItem.statsRolled, color);
  window.checkAchievements();
  window.updateUI();
  window.renderInventory();
  if (typeof window.renderForgeTab === "function") window.renderForgeTab();
};

window.saveCurrentActivityPeak = function () {
  if (window.playerStats.isCrucibleMode) {
    let finalWave = window.playerStats.crucibleWave || 1;
    window.playerStats.cruciblePeak = Math.max(
      window.playerStats.cruciblePeak || 1,
      finalWave,
    );
  } else if (
    window.playerStats.isDungeonMode &&
    window.playerStats.currentDungeon
  ) {
    let dType = window.playerStats.currentDungeon;
    let dStage = window.playerStats.currentDungeonStage[dType] || 1;
    window.playerStats.dungeonPeaks[dType] = Math.max(
      window.playerStats.dungeonPeaks[dType] || 1,
      dStage,
    );
  }
};

window.enterDungeon = function (type) {
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
  if (window.playerStats.dungeonKeys < 1) {
    window.pushHeaderToast("Not enough keys!", "#e74c3c");
    return;
  }

  let dNames = {
    equip: "Equipment Dungeon",
    gold: "Gold Mine",
    mat: "Material Cavern",
  };
  window.playerStats.dungeonPeaks = window.playerStats.dungeonPeaks || {
    equip: 1,
    gold: 1,
    mat: 1,
  };
  window.playerStats.currentDungeonStage = window.playerStats
    .currentDungeonStage || { equip: 1, gold: 1, mat: 1 };
  let checkpoint = Math.max(
    1,
    Math.floor((window.playerStats.dungeonPeaks[type] || 1) * 0.9),
  );

  window.showCustomConfirm(
    "Enter Infinite Dungeon",
    `Spend 1 Key to enter the Infinite ${dNames[type]}? Starting checkpoint: Stage ${checkpoint}`,
    "Enter Dungeon",
    "Cancel",
    "#8e44ad",
    function () {
      window.saveCurrentActivityPeak();
      window.playerStats.dungeonKeys--;
      if (window.playerStats.dungeonKeys === 4)
        window.playerStats.nextDungeonKeyTime = Date.now() + 21600000; // 6 Hours

      window.playerStats.isDungeonMode = true;

      // Consume and Lock Slotted Cavern Sigil
      if (window.state.slottedCavernSigil) {
        let activeSig = window.state.slottedCavernSigil;
        window.playerStats.activeDungeonSigil = activeSig;
        window.state.slottedCavernSigil = null;

        // Remove sigil from EQUIP bag
        let sIdx = window.inventory.EQUIP.findIndex(
          (i) => i.id === activeSig.id,
        );
        if (sIdx !== -1) {
          window.inventory.EQUIP.splice(sIdx, 1);
        }
      } else {
        window.playerStats.activeDungeonSigil = null;
      }
      window.playerStats.isCrucibleMode = false;
      window.playerStats.currentDungeon = type;
      window.playerStats.currentDungeonStage[type] = checkpoint;
      window.playerStats.dungeonWave = 1;
      window.playerStats.killCount = 0;
      window.playerStats.targetsRequired = 5;
      window.playerStats.isBossMode = false;
      window.playerStats.isUberBoss = false;
      window.mob = null;

      let p = window.resolvePlayerStats();
      window.playerStats.currentHp = p.maxHp;
      window.pushLog(
        `<span style='color:#8e44ad; font-weight:bold;'>[DUNGEON] Descended into the Infinite ${dNames[type]} at Stage ${checkpoint}!</span>`,
      );
      let menu = document.getElementById("dungeon-menu");
      if (menu) menu.style.display = "none";
      window.updateUI();
      window.saveGame();
    },
  );
};

window.enterCrucible = function () {
  window.openCrucibleDraftModal();
};

window.rollEquipmentDrop = function (
  isBossKill,
  silent = false,
  minStars = 0,
  isRareMob = false,
  isMilestone = false,
) {
  let p = window.resolvePlayerStats();
  let maxBag = window.getMaxBagSlots();
  let allowArtifact = window.playerStats.isUberBoss && Math.random() < 0.05;

  let types = [
    "weapon",
    "subweapon",
    "helmet",
    "chest",
    "leggings",
    "overall",
    "boots",
  ];
  let allowedTraits = null;

  if (window.playerStats.isUberBoss) {
    let bossType = window.playerStats.currentUberBoss || "guardian";
    if (bossType === "guardian") {
      types = ["chest", "leggings", "overall"];
      allowedTraits = [
        "vampirism",
        "defense",
        "parry_strike",
        "second_wind",
        "golem_stance",
        "titan_grip",
        "dodge_buff",
      ];
    } else if (bossType === "chronos") {
      types = ["boots", "helmet"];
      allowedTraits = [
        "gold_hoard",
        "move_speed",
        "idle_spd",
        "extend_buffs",
        "fairy_wealth",
        "alchemist_alembic",
        "philosopher_catalyst",
      ];
    } else if (bossType === "nexus") {
      types = ["weapon", "subweapon"];
      allowedTraits = [
        "frenzy",
        "magic_find",
        "echo_strike",
        "active_spd",
        "bag_space",
        "void_pull",
        "cauldron_eternity",
      ];
    }
  }

  let chosenType = allowArtifact
    ? "artifact"
    : types[Math.floor(Math.random() * types.length)];
  let statLinesCount = 0;

  let probs = window.calculateRarityProbabilities(p.qly, false);

  if (minStars > 0) {
    // Slice the distribution and re-normalize the remainder
    let subset = Array(6).fill(0);
    for (let i = minStars; i <= 5; i++) {
      subset[i] = probs[i];
    }
    let subSum = subset.reduce((sum, w) => sum + w, 0);
    if (subSum > 0) {
      probs = subset.map((w) => (w / subSum) * 100);
    } else {
      probs = Array(6).fill(0);
      probs[minStars] = 100; // Hard fallback guarantee
    }
  }

  let roll = Math.random() * 100;
  let cumulative = 0;

  if (roll < (cumulative += probs[5])) statLinesCount = 5;
  else if (roll < (cumulative += probs[4])) statLinesCount = 4;
  else if (roll < (cumulative += probs[3])) statLinesCount = 3;
  else if (roll < (cumulative += probs[2])) statLinesCount = 2;
  else if (roll < (cumulative += probs[1])) statLinesCount = 1;
  else statLinesCount = 0;

  let activeStage = window.playerStats.stage;
  if (window.playerStats.isDungeonMode && window.playerStats.currentDungeon) {
    activeStage =
      window.playerStats.currentDungeonStage[
        window.playerStats.currentDungeon
      ] || 1;
  } else if (window.playerStats.isUberBoss) {
    let runPeak = Math.max(
      window.playerStats.stage,
      window.playerStats.maxStage || 1,
    );
    let allTime90 = Math.floor(
      (window.playerStats.lifetimePeakStage || 1) * 0.9,
    );
    activeStage = Math.max(runPeak, allTime90);
  }
  let stageScale = Math.floor((activeStage - 1) / 10) + 1;
  let sourceName = isBossKill ? "Boss" : isRareMob ? "Rare" : "Route";

  if (
    !isBossKill &&
    !isRareMob &&
    !window.playerStats.isDungeonMode &&
    !window.playerStats.isCrucibleMode &&
    statLinesCount === 5
  ) {
    window.playerStats.hasTriggeredAgainstOdds = true;
  }

  let newItem = window.createItemObject(
    chosenType,
    statLinesCount,
    stageScale,
    minStars,
    allowedTraits,
  );
  if (window.checkAutoSalvage(newItem, silent)) return;

  if (newItem.type === "artifact") {
    if (window.inventory.ARTIFACT.length >= maxBag) {
      if (!silent) {
        window.pushHeaderToast(
          `Artifact Sack Full! Astral Essence gained.`,
          "#e74c3c",
        );
        window.addEtcDrop("Astral Essence", 1);
      }
      return;
    }
  } else {
    if (window.inventory.EQUIP.length >= maxBag) {
      if (!silent) {
        window.pushHeaderToast(`Bag Full! Soul gained.`, "#e74c3c");
        window.addEtcDrop(
          isBossKill
            ? "Ancient Core"
            : isRareMob
              ? "Luminous Soul"
              : "Monster Soul",
          1,
        );
      }
      return;
    }
  }

  if (!silent) {
    if (newItem.type === "artifact")
      window.pushLog(
        `<strong style='color:#1abc9c;'>⭐ UNIQUE ARTIFACT DROPPED!</strong> Extracted: <span style='color:#1abc9c;'>${newItem.name}</span>!`,
        newItem.id,
      );
    else if (sourceName === "Gacha")
      window.pushLog(
        `<strong style='color:#f1c40f;'>[GACHA]</strong> Dispensed: <span style='color:${window.getTierColor(newItem.statsRolled)};'>${newItem.name}</span>`,
        newItem.id,
      );
    else if (sourceName === "Rare")
      window.pushLog(
        `<strong style='color:#ffb6c1;'>RARE ENEMY KILLED!</strong> Found: <span style='color:${window.getTierColor(newItem.statsRolled)};'>${newItem.name}</span>`,
        newItem.id,
      );
    else
      window.pushLog(
        `<strong style='color:#ff9f43;'>BOSS KILLED!</strong> Found: <span style='color:${window.getTierColor(newItem.statsRolled)};'>${newItem.name}</span>`,
        newItem.id,
      );
  }

  if (!silent)
    window.pushToast(
      newItem.name,
      newItem.statsRolled,
      window.getTierColor(newItem.statsRolled),
      false,
      1,
      null,
      null,
      isMilestone,
    );
  if (newItem.type === "artifact") window.inventory.ARTIFACT.push(newItem);
  else window.inventory.EQUIP.push(newItem);

  if (
    sourceName === "Gacha" &&
    !silent &&
    typeof window.spawnPurchaseCelebration === "function"
  )
    window.spawnPurchaseCelebration(
      "gacha",
      window.getTierColor(newItem.statsRolled),
      newItem.statsRolled,
    );
  if (!silent) {
    window.checkAchievements();
    window.renderInventory();
    if (typeof window.renderForgeTab === "function") window.renderForgeTab();
    window.updateUI();
  }
};

window.generateEquipment = function (
  chosenType,
  statLinesCount,
  stageScale,
  sourceName,
  silent = false,
  minStars = 0,
) {
  let item = window.createItemObject(
    chosenType,
    statLinesCount,
    stageScale,
    minStars,
  );
  if (window.checkAutoSalvage(item, silent)) return;

  if (!silent) {
    if (item.type === "artifact")
      window.pushLog(
        `<strong style='color:#1abc9c;'>⭐ UNIQUE ARTIFACT DROPPED!</strong> Extracted: <span style='color:#1abc9c;'>${item.name}</span>!`,
        item.id,
      );
    else if (sourceName === "Gacha")
      window.pushLog(
        `<strong style='color:#f1c40f;'>[GACHA]</strong> Dispensed: <span style='color:${window.getTierColor(item.statsRolled)};'>${item.name}</span>`,
        item.id,
      );
    else if (sourceName === "Rare")
      window.pushLog(
        `<strong style='color:#ffb6c1;'>RARE ENEMY KILLED!</strong> Found: <span style='color:${window.getTierColor(item.statsRolled)};'>${item.name}</span>`,
        item.id,
      );
    else
      window.pushLog(
        `<strong style='color:#ff9f43;'>BOSS KILLED!</strong> Found: <span style='color:${window.getTierColor(item.statsRolled)};'>${item.name}</span>`,
        item.id,
      );
  }

  if (!silent)
    window.pushToast(
      item.name,
      item.statsRolled,
      window.getTierColor(item.statsRolled),
    );
  if (item.type === "artifact") window.inventory.ARTIFACT.push(item);
  else window.inventory.EQUIP.push(item);

  if (
    sourceName === "Gacha" &&
    !silent &&
    typeof window.spawnPurchaseCelebration === "function"
  )
    window.spawnPurchaseCelebration(
      "gacha",
      window.getTierColor(item.statsRolled),
      item.statsRolled,
    );
  if (!silent) {
    window.checkAchievements();
    window.renderInventory();
    if (typeof window.renderForgeTab === "function") window.renderForgeTab();
    window.updateUI();
  }
};

window.rollGachaDrop = function () {
  let p = window.resolvePlayerStats();
  let allowArtifact = Math.random() < 0.0005;
  let types = [
    "weapon",
    "subweapon",
    "helmet",
    "chest",
    "leggings",
    "overall",
    "boots",
  ];
  let chosenType = allowArtifact
    ? "artifact"
    : types[Math.floor(Math.random() * types.length)];

  let maxBag = window.getMaxBagSlots();
  if (chosenType === "artifact") {
    if (window.inventory.ARTIFACT.length >= maxBag) {
      window.pushHeaderToast(`Artifact Sack Full!`, "#e74c3c");
      return;
    }
  } else {
    if (window.inventory.EQUIP.length >= maxBag) {
      window.pushHeaderToast(`Inventory Full!`, "#e74c3c");
      return;
    }
  }

  let statLinesCount = 1;
  let luckMultiplier = p.qly + (window.playerStats.vendingQLevel || 0) * 0.01;
  let roll = Math.random() * 100;

  // Upgraded rates: 1.0% Mythic (5★), 5.0% Legendary (4★), 15.0% Epic (3★), 25.0% Magic (2★)
  if (roll < 1.0 * luckMultiplier) statLinesCount = 5;
  else if (roll < 6.0 * luckMultiplier) statLinesCount = 4;
  else if (roll < 21.0 * luckMultiplier) statLinesCount = 3;
  else if (roll < 46.0 * luckMultiplier) statLinesCount = 2;
  else statLinesCount = 1;

  let peakRunStage = window.playerStats.lifetimePeakStage || 1;
  let stageScale = Math.floor((peakRunStage - 1) / 10) + 1;
  window.generateEquipment(chosenType, statLinesCount, stageScale, "Gacha");
};

window.rollPotionDrop = function (isBoss, isRare, silent = false) {
  let dropChance = 0.0004;
  if (isRare) dropChance = 0.003;
  if (isBoss) dropChance = 0.025;

  if (Math.random() >= dropChance) return null;

  // Wild targets only drop basic (lowest tier) elixirs
  let tierPrefix = "";

  const types = [
    "Attack Elixir",
    "Vitality Elixir",
    "Armored Elixir",
    "Haste Elixir",
  ];
  let chosenType = tierPrefix + types[Math.floor(Math.random() * types.length)];

  if (!window.inventory.USE[chosenType]) window.inventory.USE[chosenType] = 0;
  window.inventory.USE[chosenType]++;

  if (!silent) {
    window.pushLog(
      `<span style='color:#2ecc71; font-weight:bold;'>[DROP]</span> Defeated target and found a rare <span style='color:#2ecc71;'>${chosenType}</span>! Added to Use sack.`,
    );
    window.pushToast(
      chosenType,
      null,
      "#2ecc71",
      true,
      1,
      `🧪 Found: <span style="color:#2ecc71;">${chosenType}</span>`,
    );
    window.renderInventory();
  }
  return chosenType;
};

window.showOfflineSummaryModal = function (
  seconds,
  fromStage,
  toStage,
  gold,
  xp,
  kills,
  items,
  scraps,
  died,
  dStage,
) {
  let modal = document.createElement("div");
  modal.id = "offline-summary-modal";
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

  let hours = Math.floor(seconds / 3600);
  let mins = Math.floor((seconds % 3600) / 60);
  let timeStr = `${hours > 0 ? hours + "h " : ""}${mins}m`;
  if (hours === 0 && mins === 0) timeStr = `${seconds}s`;

  let stageDiffText =
    toStage > fromStage
      ? `<span style="color:#2ecc71; font-weight:bold;">Stage ${toStage}</span>`
      : `<span style="color:#94a3b8; font-weight:bold;">Stage ${toStage} (Farming)</span>`;

  let deathAlert = died
    ? `<div style="background: rgba(231, 76, 60, 0.04); border: 1.5px dashed rgba(231, 76, 60, 0.45); border-radius: 8px; padding: 12px; margin-bottom: 15px; font-size: 11.5px; text-align: left; line-height: 1.45; display: flex; align-items: flex-start; gap: 8px; color: #fff; box-shadow: 0 4px 15px rgba(231, 76, 60, 0.1);">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#e74c3c" stroke-width="2.5" style="flex-shrink: 0;"><path d="m10.29 3.86 7.98 13.8a2 2 0 0 1-1.73 3H3.1a2 2 0 0 1-1.73-3l7.98-13.8a2 2 0 0 1 3.44 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        <div>
            <strong style="color: #e74c3c; display:block; margin-bottom: 2px; text-transform:uppercase; letter-spacing:0.5px;">⚠️ PROGRESSION STALLED:</strong>
            Hit a survival bottleneck at Stage ${dStage}. Progression halted, hero farmed Stage ${toStage}.
        </div>
       </div>`
    : "";

  let itemsListHtml =
    items.length > 0
      ? items
          .map((item) => {
            let color = window.getTierColor(item.statsRolled);
            let stars =
              item.statsRolled === "UNIQUE" ? "UNIQUE" : `${item.statsRolled}★`;
            return `<div style="background:#13151c; border:1px solid #232833; border-left: 4px solid ${color} !important; padding: 8px 12px; border-radius: 6px; font-size: 11px; margin-bottom: 6px; text-align:left; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 2px 6px rgba(0,0,0,0.3);"><span style="color:${color}; font-weight:bold;">${item.name}</span><span style="color:#888; font-size: 10px; font-family:monospace; font-weight:bold; letter-spacing:0.5px;">${stars}</span></div>`;
          })
          .join("")
      : `<div style="color:#666; font-style:italic; font-size:11px; padding: 15px 0; text-align:center;">No new high-quality gear kept.</div>`;

  let scrapKeys = Object.keys(scraps);
  let scrapsListHtml =
    scrapKeys.length > 0
      ? scrapKeys
          .map((key) => {
            let color = key.includes("Scrap")
              ? "#3498db"
              : key.includes("Soul")
                ? "#ffb6c1"
                : "#9b59b6";
            if (key === "Eridium Shard") color = "#8e44ad";
            if (key.includes("Attack Elixir")) color = "#2ecc71";
            else if (key.includes("Vitality Elixir")) color = "#e74c3c";
            else if (key.includes("Armored Elixir")) color = "#3498db";
            else if (key.includes("Haste Elixir")) color = "#f1c40f";
            else if (key === "PP Reset Scroll") color = "#e67e22";
            return `<div class="bag-item" style="background:#090a0f; border: 1px solid #222; padding: 6px 10px; border-radius: 4px; font-size: 11px; display:inline-flex; align-items:center; margin: 3px; font-family:monospace;"><span style="color:#aaa; margin-right:4px;">${key}:</span> <strong style="color:${color};">+${window.formatNumber(scraps[key])}</strong></div>`;
          })
          .join("")
      : `<div style="color:#666; font-style:italic; font-size:11px; padding: 5px 0; text-align:center; width:100%;">No materials salvaged.</div>`;

  modal.innerHTML = `
        <div style="background:#1a1a1a; border: 2px solid var(--accent-blue); border-radius: 8px; width:100%; max-width:460px; max-height: 88vh; display:flex; flex-direction:column; overflow:hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.95); animation: toastFadeIn 0.3s ease-out; border-bottom-width: 5px;">
            <div style="background: linear-gradient(180deg, #181d24 0%, #0d1117 100%); border-bottom: 1px solid #20262e; padding:12px 15px; display:flex; justify-content:space-between; align-items:center;">
                <h3 style="margin:0; color:var(--accent-blue); font-size:14px; font-weight:bold; letter-spacing:1.5px; text-transform:uppercase; text-shadow:0 0 10px rgba(52, 152, 219, 0.35); display: flex; align-items: center; gap: 6px;">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm1 14h-2v-2h2v2zm0-4h-2V7h2v5z"/></svg>
                    Offline Progress
                </h3>
                <span style="background:rgba(52, 152, 219, 0.15); color:var(--accent-blue); padding:4px 12px; border-radius:20px; font-size:10.5px; font-weight:bold; border: 1px solid var(--accent-blue);">${timeStr}</span>
            </div>
            <div style="padding:15px; overflow-y:auto; flex: 1; overscroll-behavior: contain;">
                ${deathAlert}
                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; margin-bottom:12px;">
                    <div style="background:rgba(0,0,0,0.55); padding:10px; border-radius:6px; border:1px solid #222; text-align:center; box-shadow: inset 0 0 8px #000;">
                                            <div style="font-size:9px; color:#aaa; margin-bottom:4px; letter-spacing:0.8px; font-weight:bold; text-transform:uppercase; display:flex; align-items:center; justify-content:center; gap:4px;">
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#f1c40f" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><path d="M12 8v8M9 10h6M9 13h6"/></svg>
                                                Gold Accumulated
                                            </div>
                                            <div style="font-size:18px; color:#f1c40f; font-weight:900; font-family:monospace; text-shadow:0 0 10px rgba(241, 196, 15, 0.25);">+${window.formatNumber(gold)}</div>
                                        </div>
                                        <div style="background:rgba(0,0,0,0.55); padding:10px; border-radius:6px; border:1px solid #222; text-align:center; box-shadow: inset 0 0 8px #000;">
                                            <div style="font-size:9px; color:#aaa; margin-bottom:4px; letter-spacing:0.8px; font-weight:bold; text-transform:uppercase; display:flex; align-items:center; justify-content:center; gap:4px;">
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9b59b6" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><path d="m17 13-5-5-5 5M17 17l-5-5-5 5"/></svg>
                                                Exp Harvested
                                            </div>
                                            <div style="font-size:18px; color:#9b59b6; font-weight:900; font-family:monospace; text-shadow:0 0 10px rgba(155, 89, 182, 0.25);">+${window.formatNumber(xp)}</div>
                                        </div>
                </div>
                <div style="background:rgba(0,0,0,0.35); padding:10px; border-radius:6px; margin-bottom:15px; font-size:11.5px; display:flex; justify-content:space-between; border:1px solid #2d3748; align-items:center;">
                    <span style="display:flex; align-items:center; gap:4px;">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#bdc3c7" stroke-width="2.5"><path d="M14.5 17.5L3 6V3h3l11.5 11.5M13 19l6-6M16 16l4 4M19 21l2-2" /></svg>
                        Simulated Kills: <strong style="color:#fff; font-family:monospace; font-size:12.5px;">${kills}</strong>
                    </span>
                    <span style="display:flex; align-items:center; gap:4px;">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#bdc3c7" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><path d="m16.24 7.76-2.12 6.36-6.36 2.12 2.12-6.36z"/></svg>
                        Stage Reached: ${stageDiffText}
                    </span>
                </div>
                <h4 style="margin: 0 0 8px 0; font-size:10.5px; color:#fff; text-align:left; text-transform:uppercase; letter-spacing:1px; border-bottom: 1px solid #333; padding-bottom:5px; font-weight:bold; display:flex; align-items:center; gap:4px;">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#2ecc71" stroke-width="2.5"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
                    Kept Drops
                </h4>
                <div style="max-height:140px; overflow-y:auto; margin-bottom:15px; padding-right:4px;">${itemsListHtml}</div>
                <h4 style="margin: 0 0 8px 0; font-size:10.5px; color:#fff; text-align:left; text-transform:uppercase; letter-spacing:1px; border-bottom: 1px solid #333; padding-bottom:5px; font-weight:bold; display:flex; align-items:center; gap:4px;">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#e67e22" stroke-width="2.5"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
                    Auto-Salvage Yield
                </h4>
                <div style="text-align:left; margin-bottom:10px; max-height:120px; overflow-y:auto; display:flex; flex-wrap:wrap; justify-content:flex-start;">${scrapsListHtml}</div>
            </div>
            <div style="background:#0b0f12; border-top: 1px solid #20262e; padding:12px; display:flex; justify-content:center;">
                <button id="close-offline-summary" style="background:linear-gradient(180deg, var(--accent-blue) 0%, #1d4ed8 100%); color:white; border:1px solid #60a5fa; padding:12px 24px; font-weight:bold; font-size:12.5px; border-radius:6px; cursor:pointer; width:100%; transition: all 0.2s ease-in-out; text-transform:uppercase; letter-spacing:1px; text-shadow:0 1px 2px rgba(0,0,0,0.5); box-shadow: 0 4px 15px rgba(59, 130, 246, 0.35);">Claim Loot & Continue</button>
            </div>
        </div>
    `;
  document.body.appendChild(modal);
  document.getElementById("close-offline-summary").onclick = function () {
    modal.style.animation = "toastFadeOut 0.25s ease-in forwards";
    setTimeout(() => {
      modal.remove();
      window.setPauseState(false);
      window.updateUI();
      window.renderInventory();
    }, 230);
  };
};

window.showCrucibleSummaryModal = function (
  waves,
  shards,
  cores,
  died = false,
) {
  let modal = document.createElement("div");
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

  let headerText = died
    ? "💀 CRUCIBLE DEFEAT (20% Kept)"
    : "🔮 CRUCIBLE RETREAT (100% Kept)";
  let colorText = died ? "#e74c3c" : "#9b59b6";
  let footerTip = died
    ? "You fell in battle! You only escaped with 20% of your accumulated rewards. Retreat safely next time to keep 100%!"
    : "You retreated safely! You kept 100% of your accumulated shards and cores.";

  modal.innerHTML = `
        <div style="background:#1a1a1a; border: 2px solid ${colorText}; border-radius: 8px; width:100%; max-width:400px; display:flex; flex-direction:column; box-shadow: 0 10px 30px rgba(0,0,0,0.95); animation: toastFadeIn 0.3s;">
            <div style="background:#0b0f12; border-bottom: 1px solid #333; padding:12px 15px; text-align:center;">
                <h3 style="margin:0; color:${colorText}; font-size:16px; font-weight:bold; letter-spacing:1.5px;">${headerText}</h3>
            </div>
            <div style="padding:20px; text-align:center; color:#fff;">
                <div style="font-size:12px; color:#aaa; margin-bottom:5px;">Waves Reached:</div>
                <div style="font-size:28px; color:#f1c40f; font-weight:bold; margin-bottom:20px;">${waves} Floors</div>
                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; margin-bottom:15px;">
                    <div style="background:#111; padding:10px; border-radius:5px; border:1px solid #222;"><div style="font-size:10px; color:#aaa; margin-bottom:4px;">ASTRAL SHARDS</div><div style="font-size:16px; color:#9b59b6; font-weight:bold;">+${shards}</div></div>
                    <div style="background:#111; padding:10px; border-radius:5px; border:1px solid #222;"><div style="font-size:10px; color:#aaa; margin-bottom:4px;">CATALYST CORES</div><div style="font-size:16px; color:#2ecc71; font-weight:bold;">+${cores}</div></div>
                </div>
                <p style="font-size:11px; color:#7f8c8d; line-height:1.4;">${footerTip}</p>
            </div>
            <div style="background:#0b0f12; border-top: 1px solid #333; padding:12px; display:flex; justify-content:center;">
                <button id="close-crucible-summary" style="background:${colorText}; color:white; border:none; padding:10px 24px; font-weight:bold; font-size:12px; border-radius:4px; cursor:pointer; width:100%;">Return to Surface</button>
            </div>
        </div>
    `;
  document.body.appendChild(modal);
  document.getElementById("close-crucible-summary").onclick = function () {
    modal.remove();
    window.isGamePaused = false;
    let p = window.resolvePlayerStats();
    window.playerStats.currentHp = p.maxHp;
    window.updateUI();
    window.renderInventory();
  };
};
