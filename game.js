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
window.hasBoundWakeLockGesture = false;

window.requestWakeLock = async function () {
  if (!navigator.wakeLock) return;
  try {
    if (window.wakeLockSentinel) {
      await window.wakeLockSentinel.release();
      window.wakeLockSentinel = null;
    }
    window.wakeLockSentinel = await navigator.wakeLock.request("screen");
    console.log("[WAKE LOCK] Screen Wake Lock Active (Preventing Sleep)");
    window.removeWakeLockGestureListeners();
  } catch (err) {
    // iOS Safari strictly blocks wake lock requests until the first active touch on the screen.
    // Bind a one-time fallback listener to grab the wake lock on the first user interaction.
    window.bindWakeLockGestureListener();
  }
};

window.releaseWakeLock = function () {
  if (window.wakeLockSentinel) {
    window.wakeLockSentinel.release().then(() => {
      window.wakeLockSentinel = null;
      console.log("[WAKE LOCK] Screen Wake Lock Released");
    });
  }
};

window.wakeLockGestureHandler = async function () {
  if (!window.wakeLockSentinel) {
    await window.requestWakeLock();
  }
};

window.bindWakeLockGestureListener = function () {
  if (window.hasBoundWakeLockGesture) return;
  window.hasBoundWakeLockGesture = true;
  window.addEventListener("pointerdown", window.wakeLockGestureHandler, {
    once: true,
    passive: true,
  });
  window.addEventListener("click", window.wakeLockGestureHandler, {
    once: true,
    passive: true,
  });
  window.addEventListener("keydown", window.wakeLockGestureHandler, {
    once: true,
    passive: true,
  });
};

window.removeWakeLockGestureListeners = function () {
  window.hasBoundWakeLockGesture = false;
  window.removeEventListener("pointerdown", window.wakeLockGestureHandler);
  window.removeEventListener("click", window.wakeLockGestureHandler);
  window.removeEventListener("keydown", window.wakeLockGestureHandler);
};

// Handle tab visibility changes to pause audio and release wake locks when minimized
document.addEventListener("visibilitychange", async () => {
  if (document.visibilityState === "visible") {
    // Resume BGM and Web Audio context only if the player hasn't muted the game
    if (
      window.MusicManager &&
      window.MusicManager.audio &&
      (!window.playerStats || !window.playerStats.mute)
    ) {
      window.MusicManager.audio.play().catch(() => {});
    }
    if (window.SoundManager && window.SoundManager.ctx) {
      window.SoundManager.ctx.resume().catch(() => {});
    }

    // iOS blocks immediate visibilitychange wake lock requests with NotAllowedError.
    setTimeout(async () => {
      if (window.playerStats && !window.wakeLockSentinel) {
        await window.requestWakeLock();
      }
    }, 1000);
  } else {
    // Pause BGM and suspend Web Audio context to completely halt background audio and conserve resource/battery
    if (window.MusicManager && window.MusicManager.audio) {
      window.MusicManager.audio.pause();
    }
    if (window.SoundManager && window.SoundManager.ctx) {
      window.SoundManager.ctx.suspend().catch(() => {});
    }
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

    // Enrich equippedSlots with cosmetic data during serialization to allow seamless leaderboard & clan roster syncs
    let enrichedEquippedSlots = {
      ...window.equippedSlots,
      equippedCostume: window.playerStats.equippedCostume,
      cosmeticSkin: window.playerStats.cosmeticSkin,
    };

    let saveData = {
          saveVersion: window.GAME_VERSION,
          playerStats: window.playerStats,
          equippedSlots: enrichedEquippedSlots,
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
            if (!localParsed.saveVersion || localParsed.saveVersion < window.MIN_COMPATIBLE_VERSION) {
              console.warn("[WIPE] Outdated local save version detected in SaveManager. Purging state.");
              localStorage.removeItem("idle_saq_save");
              localParsed = null;
            } else {
              this.applyPayload(localParsed, true);
              if (localParsed.lastSaveTime) {
                offlineMsToApply = now - localParsed.lastSaveTime;
              }
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
              if (!data.saveData.saveVersion || data.saveData.saveVersion < window.MIN_COMPATIBLE_VERSION) {
                console.warn("[WIPE] Outdated cloud save detected in SaveManager. Discarding.");
                data.saveData = null;
              }

              if (data.saveData) {
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
              } else {
                console.log("☁️ No compatible cloud save available. Staying on local progress.");
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
          window.isCloudSynced = true;
          if (typeof window.updateSyncStatus === "function") {
            window.updateSyncStatus("connected");
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

    // Trigger automated 100% loss-free legacy materials refund
    if (typeof window.migrateLegacyTempersToRefund === "function") {
      window.migrateLegacyTempersToRefund();
    }
  },

  applyPayload(parsed, skipOffline = false) {
    try {
      const isObject = (item) =>
        item && typeof item === "object" && !Array.isArray(item);

      const deepSanitize = (defaultObj, savedObj) => {
        if (savedObj === undefined || savedObj === null) {
          return JSON.parse(JSON.stringify(defaultObj));
        }
        // Protect BigNum objects (m & e) from getting wiped by primitive default values
        if (
          savedObj &&
          typeof savedObj === "object" &&
          savedObj.m !== undefined &&
          savedObj.e !== undefined
        ) {
          return savedObj;
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
        if (
          item.type === "shield" ||
          item.type === "dagger" ||
          item.type === "tome"
        ) {
          item.subType = item.type;
          item.type = "subweapon";
        }
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

      if (window.playerStats.monsterCards === undefined) {
        window.playerStats.monsterCards = {};
      }
      if (window.playerStats.astralDust === undefined) {
        window.playerStats.astralDust = 0;
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

      if (window.playerStats.dungeonPeaks === undefined) {
        window.playerStats.dungeonPeaks = {
          equip: 1,
          gold: 1,
          mat: 1,
        };
      }

      if (window.playerStats.dungeonAccumulatedGold === undefined)
        window.playerStats.dungeonAccumulatedGold = 0;
      if (window.playerStats.dungeonAccumulatedXp === undefined)
        window.playerStats.dungeonAccumulatedXp = 0;
      if (window.playerStats.dungeonAccumulatedLoot === undefined)
        window.playerStats.dungeonAccumulatedLoot = [];
      if (window.playerStats.crucibleAccumulatedLoot === undefined)
        window.playerStats.crucibleAccumulatedLoot = [];

      if (window.playerStats.currentDungeonStage === undefined) {
        window.playerStats.currentDungeonStage = {
          equip: 1,
          gold: 1,
          mat: 1,
        };
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
        window.playerStats.xp = new BigNum(0, 0);
        window.playerStats.sp = 0;
      }
      window.playerStats.maxLevel = Math.max(
        window.playerStats.maxLevel || 1,
        window.playerStats.level || 1,
      );

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

      window.playerStats.xpReq = BigNum.from(1000).mul(
              BigNum.from(1.45).pow(window.playerStats.level - 1),
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
        if (window.playerStats.gachaHistory) {
          window.playerStats.gachaHistory.forEach((item) => {
            if (item) window.recalculateItemStats(item);
          });
        }
        if (window.playerStats.shopItems) {
          window.playerStats.shopItems.forEach((item) => {
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

      // Re-inflate serialized gold structures back into BigNum objects
      window.playerStats.coins = BigNum.from(window.playerStats.coins);
      window.playerStats.totalGoldEarned = BigNum.from(
        window.playerStats.totalGoldEarned || 0,
      );
      window.playerStats.xp = BigNum.from(window.playerStats.xp || 0);
      window.playerStats.xpReq = BigNum.from(window.playerStats.xpReq || 100);

      // Sanitize stage parameters to primitive integers to prevent mathematical NaN/Infinity loops
      const forcePrimitiveNumber = (val) => {
        if (val === undefined || val === null) return 1;
        if (typeof val === "object" && val.m !== undefined) {
          return Number(val.m * Math.pow(10, val.e));
        }
        let num = Number(val);
        return isNaN(num) ? 1 : num;
      };
      window.playerStats.stage = forcePrimitiveNumber(window.playerStats.stage);
      window.playerStats.maxStage = forcePrimitiveNumber(
        window.playerStats.maxStage,
      );
      window.playerStats.lifetimePeakStage = forcePrimitiveNumber(
        window.playerStats.lifetimePeakStage,
      );
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
      if (window.playerStats.visitedSubTabs === undefined)
        window.playerStats.visitedSubTabs = [];
      if (window.playerStats.chatFloatingMode === undefined)
        window.playerStats.chatFloatingMode = false;
      if (window.playerStats.chatX === undefined)
        window.playerStats.chatX = null;
      if (window.playerStats.chatY === undefined)
        window.playerStats.chatY = null;
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
      if (window.playerStats.volumeMusic === undefined)
        window.playerStats.volumeMusic = 0.5;
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

      if (window.playerStats.equippedCostume === undefined) {
        window.playerStats.equippedCostume = "knight";
      }
      if (
        window.playerStats.unlockedCostumes === undefined ||
        window.playerStats.unlockedCostumes.length === 0
      ) {
        window.playerStats.unlockedCostumes = ["knight"];
      }

      if (window.playerStats.equippedTitle === undefined)
        window.playerStats.equippedTitle = null;
      if (window.playerStats.claimedMailIds === undefined)
        window.playerStats.claimedMailIds = [];

      window.playerStats.isPrestigeBossMode = false;
      window.playerStats.prestigeApproachTimer = 0;

      if (!window.playerStats.slotUpgrades) {
                    window.playerStats.slotUpgrades = {
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
                    };
                  }
                  if (window.playerStats.slotUpgrades.ring1 === undefined) {
                    window.playerStats.slotUpgrades.ring1 = 0;
                    window.playerStats.slotUpgrades.ring2 = 0;
                  }
      if (window.playerStats.slotUpgrades.art1 === undefined) {
        window.playerStats.slotUpgrades.art1 = 0;
        window.playerStats.slotUpgrades.art2 = 0;
        window.playerStats.slotUpgrades.art3 = 0;
      }

      // --- ACCUMULATIVE INSTANCED RESUME SYSTEM ---
      // Allows players to seamlessly return to active runs after browser tab suspensions
      if (
        window.playerStats.isCrucibleMode ||
        window.playerStats.isDungeonMode
      ) {
        window.mob = null; // Clear active monster to spawn a fresh, scaled threat
        window.hero.x = 40; // Reset hero to starting coordinate
        window.setPauseState(true); // Soft-pause so the player can prepare before the battle resumes

        setTimeout(() => {
          let runLabel = window.playerStats.isCrucibleMode
            ? "Crucible Wave"
            : "Dungeon Floor";
          let color = window.playerStats.isCrucibleMode ? "#9b59b6" : "#8e44ad";
          if (typeof window.pushHeaderToast === "function") {
            window.pushHeaderToast(
              `🛡️ Resumed active run: ${runLabel}!`,
              color,
            );
          }
          if (typeof window.showCustomConfirm === "function") {
            window.showCustomConfirm(
              "🛡️ Run Resumed",
              `Your active <strong>${runLabel}</strong> was saved and has been successfully restored. Pick up your weapons and prepare to continue the battle!`,
              "Resume Battle",
              "",
              color,
              () => {
                window.setPauseState(false);
              },
            );
          } else {
            window.setPauseState(false);
          }
        }, 1500);
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
      if (window.playerStats.spectralCodex === undefined)
        window.playerStats.spectralCodex = [];
      if (window.playerStats.activeSpectralResonance === undefined)
        window.playerStats.activeSpectralResonance = null;
      if (window.playerStats.projectSpectralCosmetic === undefined)
        window.playerStats.projectSpectralCosmetic = true;

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
      if (window.playerStats.showDpsOverlay === undefined)
        window.playerStats.showDpsOverlay = true;

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

      let bossCardKeys = [
        "aegis_goliath",
        "chronos_arbitrator",
        "nexus_overseer",
        "overlord_iron_vault",
        "gilded_vault_keeper",
        "corrosive_abomination",
        "hooktail",
      ];

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
            let keysEarned = 1 + Math.floor(msSinceNextKey / 14400000);
            window.playerStats.dungeonKeys = Math.min(
              5,
              window.playerStats.dungeonKeys + keysEarned,
            );
            window.playerStats.nextDungeonKeyTime =
              window.playerStats.dungeonKeys < 5
                ? now + (14400000 - (msSinceNextKey % 14400000))
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
    let farmKills = 0;
    let cardSacksGained = 0;

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
        "Monster Card Sack",
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

      let stageScale = Math.floor((stageNum - 1) / 5) + 1;
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

    let p = window.resolvePlayerStats();
    let effMultiplier = 1 + p.critChance * (p.critDamage - 1);
    let playerDps = Math.max(
      1,
      p.atk * effMultiplier * (60 / p.idleAttackSpeed),
    );
    let targetsRequired = window.playerStats.targetsRequired || 5;

    // Tap Titans 2 Inactive Progression (Silent March) Cap: 99% of Max Stage reached
    let maxProgressStage = Math.max(
      1,
      Math.floor(
        (window.playerStats.lifetimePeakStage ||
          window.playerStats.maxStage ||
          1) * 0.99,
      ),
    );

    let b_totalGold = BigNum.from(0);
    let b_totalXp = BigNum.from(0);

    let b_playerDps = BigNum.from(playerDps);

    // Stage Progression Loop
    while (remainingSeconds > 0 && currentStage < maxProgressStage) {
      let effStage = window.getEffectiveStage(currentStage);
      let growthRate = 1.045 + (effStage * 0.04) / (effStage + 200);
      let b_expScale = BigNum.from(growthRate).pow(effStage);
      let b_mobHp = BigNum.from(25)
        .mul(b_expScale)
        .mul(1 + effStage * 0.06);

      // DPS Check: If player's effective damage cannot clear the HP barrier, progress halts
      if (b_playerDps.lt(b_mobHp.div(10))) {
        break; // Halted at this "wall" stage
      }

      // Calculate time to clear 1 full stage (mobs + boss)
      let swingTime = p.idleAttackSpeed / 60;
      let ratioMob = b_mobHp.div(b_playerDps);
      let ttkMob = Math.max(
        swingTime,
        ratioMob.m * Math.pow(10, Math.min(15, ratioMob.e)),
      );
      let ratioBoss = b_mobHp.mul(5).div(b_playerDps);
      let ttkBoss = Math.max(
        swingTime,
        ratioBoss.m * Math.pow(10, Math.min(15, ratioBoss.e)),
      );

      let stageClearTime = targetsRequired * ttkMob + ttkBoss + 1.5; // +1.5s transitions
      stageClearTime = Math.max(2.5, Math.min(60, stageClearTime)); // Enforce reasonable boundaries

      if (remainingSeconds >= stageClearTime) {
        remainingSeconds -= stageClearTime;
        elapsedSeconds += stageClearTime;
        currentStage++;
        stagesGained++;

        // Award resources for clear
        totalKills += targetsRequired + 1;
        let stageGoldReward = BigNum.from(2)
          .mul(b_expScale)
          .mul(targetsRequired + 5)
          .mul(p.gold);
        b_totalGold = b_totalGold.add(stageGoldReward);
        let stageXpReward = BigNum.from(5)
          .mul(b_expScale)
          .mul(targetsRequired + 5);
        b_totalXp = b_totalXp.add(stageXpReward);

        // Roll item drops for stage completion (Offline: Manual Play Bonus disabled)
        let dropR = 0.0015;
        if (Math.random() < dropR * p.drop * 1.0) {
          rollOfflineItem(true, currentStage, false);
        }

        // Roll for Monster Card Sack from stage boss clears
        if (cardSacksGained < 2) {
          let stageFactor = Math.min(
            1.0,
            Math.pow((window.playerStats.lifetimePeakStage || 1) / 100000, 0.5),
          );
          let cardChance = 0.01 * p.drop * stageFactor;
          if (Math.random() < cardChance) {
            recordScrapGained("Monster Card Sack", 1);
            cardSacksGained++;
          }
        }
      } else {
        break; // Time ran out for this stage advancement
      }
    }

    // Remaining seconds are spent FARMING on the final reached stage
    if (remainingSeconds > 0) {
      let effStage = window.getEffectiveStage(currentStage);
      let growthRate = 1.045 + (effStage * 0.04) / (effStage + 200);
      let b_expScale = BigNum.from(growthRate).pow(effStage);
      let b_mobHp = BigNum.from(25)
        .mul(b_expScale)
        .mul(1 + effStage * 0.06);

      let swingTime = p.idleAttackSpeed / 60;
      let ratioMob = b_mobHp.div(b_playerDps);
      let ttkMob = Math.max(
        swingTime,
        ratioMob.m * Math.pow(10, Math.min(15, ratioMob.e)),
      );
      let farmCycleTime = Math.max(0.5, ttkMob + swingTime);
      farmKills = Math.floor(remainingSeconds / farmCycleTime);

      totalKills += farmKills;
      let goldFarmed = BigNum.from(2)
        .mul(b_expScale)
        .mul(farmKills)
        .mul(p.gold);
      b_totalGold = b_totalGold.add(goldFarmed);
      let xpFarmed = BigNum.from(5).mul(b_expScale).mul(farmKills);
      b_totalXp = b_totalXp.add(xpFarmed);

      // Roll item and potion drops for farmed kills (Offline: Manual Play Bonus disabled)
      let dropR = 0.001;
      for (let k = 0; k < farmKills; k++) {
        if (Math.random() < dropR * p.drop * 1.0) {
          rollOfflineItem(false, currentStage, false);
        }
      }

      // Potion and Card Sack drop rolls
      if (farmKills > 0) {
        let stageFactor = Math.min(
          1.0,
          Math.pow((window.playerStats.lifetimePeakStage || 1) / 100000, 0.5),
        );
        let pCurrent = window.resolvePlayerStats();

        // 1. Potion Roll Engine
        let rollChance = 0.0004 * pCurrent.drop * stageFactor;
        let maxPotionsLimit = Math.min(
          40,
          Math.max(5, Math.floor(40 * (offlineSeconds / 28800) * stageFactor)),
        );

        let potionsGained = 0;
        const types = [
          "Attack Elixir",
          "Vitality Elixir",
          "Armored Elixir",
          "Haste Elixir",
        ];

        for (let k = 0; k < farmKills; k++) {
          if (potionsGained >= maxPotionsLimit) break;
          if (Math.random() < rollChance) {
            let rolledPot = types[Math.floor(Math.random() * types.length)];
            recordScrapGained(rolledPot, 1);
            potionsGained++;
          }
        }

        // 2. Card Sack Roll Engine from Farming
        if (cardSacksGained < 3) {
          // Combined cap (2 from pushing + 1 from farming = max 3)
          let maxFarmSacksLimit = cardSacksGained < 2 ? 1 : 0; // Can only get max 1 from farming itself
          let farmSacksGained = 0;
          let cardChance = 0.00002 * pCurrent.drop * stageFactor;

          for (let k = 0; k < farmKills; k++) {
            if (farmSacksGained >= maxFarmSacksLimit || cardSacksGained >= 3)
              break;
            if (Math.random() < cardChance) {
              recordScrapGained("Monster Card Sack", 1);
              cardSacksGained++;
              farmSacksGained++;
            }
          }
        }
      }

      elapsedSeconds += remainingSeconds;
      remainingSeconds = 0;
    }

    // Calculate offline soul gains to match online campaign rates
    let offlineMonsterSouls = 0;

    // 1. Expected Souls from cleared progression stages
    if (stagesGained > 0) {
      for (let stg = originalStage; stg < currentStage; stg++) {
        // Simulated Boss-Scale Monster Soul drop (30% chance per progression stage cleared)
        if (Math.random() < 0.3) {
          let baseQty = window.randInt(2, 6);
          let scaleMultiplier = 1 + Math.log10(stg);
          let finalQty = Math.round(
            baseQty * scaleMultiplier * Math.sqrt(p.qly || 1.0),
          );
          offlineMonsterSouls += finalQty;
        }

        // Normal mobs: targetsRequired * 12% drop chance * (1 + Math.floor(Math.sqrt(stg / 10)))
        let progNormalSoulExpected = targetsRequired * (0.12 * p.drop);
        let progNormalSoulQty = 1 + Math.floor(Math.sqrt(stg / 10));
        offlineMonsterSouls += Math.round(
          progNormalSoulExpected * progNormalSoulQty,
        );
      }
    }

    // 2. Expected Souls from idle farming kills on the final stage
    if (farmKills > 0) {
      let rareSpawnChance = p.rareSpawn || 0.01;
      let expectedRares = farmKills * rareSpawnChance;
      let expectedNormals = farmKills - expectedRares;

      // Normal mob Monster Souls: 12% chance * (1 + Math.floor(Math.sqrt(currentStage / 10)))
      let normalSoulExpected = expectedNormals * (0.12 * p.drop);
      let normalSoulQty = 1 + Math.floor(Math.sqrt(currentStage / 10));
      offlineMonsterSouls += Math.round(normalSoulExpected * normalSoulQty);
    }

    // Apply and record to the summary card
    if (offlineMonsterSouls > 0) {
      recordScrapGained("Monster Soul", offlineMonsterSouls);
    }

    // Update active player statistics on return
    window.playerStats.coins = BigNum.from(window.playerStats.coins).add(
      b_totalGold,
    );
    window.playerStats.totalGoldEarned = BigNum.from(
      window.playerStats.totalGoldEarned || 0,
    ).add(b_totalGold);
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

    // Reconstruct flat values to display on the offline progress card
    totalGold = b_totalGold;
    totalXp = b_totalXp;

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
        diedOffline, // Always false
        deathStage, // 0
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

              // Show a brief wiping indicator
              if (typeof window.pushHeaderToast === "function") {
                window.pushHeaderToast(
                  "Purging server database, please wait...",
                  "#ffd700",
                );
              }

              // Force the page reload to wait until the cloud wipe resolves or fails
              fetch(`${window.SaveManager.serverUrl}/api/wipe-save`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId }),
              })
                .then((response) => response.json())
                .then((data) => {
                  if (data.success) {
                    console.log("Database wiped successfully on the server.");
                  } else {
                    console.warn(
                      "Server database wipe returned false:",
                      data.error,
                    );
                  }
                  performLocalWipe();
                })
                .catch((err) => {
                  console.error("Cloud wipe request failed or timed out:", err);
                  performLocalWipe(); // Proceed with local wipe even if the server is unreachable
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
window.loadGame = () => window.loadGameAndSyncCloud();
window.applyOfflineGains = (ms) => window.SaveManager.applyOfflineGains(ms);
window.applySaveStatePayload = (parsed, skip) =>
  window.SaveManager.applyPayload(parsed, skip);
window.hardResetGame = () => window.SaveManager.hardReset();
window.getWeeklyClanMail = () => null; // Graceful stub

// Global Abort Controller references for manual play offline bypass
window.cloudSyncAbortController = null;
window.offlineGraceTimeoutId = null;

window.hideLoadingScreen = function () {
  let screen = document.getElementById("loading-screen");
  if (screen) {
    screen.style.opacity = "0";
    setTimeout(() => {
      screen.style.display = "none";
      window.updateScrollLock();
    }, 500);
  }
};

window.abortCloudSyncAndPlayOffline = function () {
  if (window.cloudSyncAbortController) {
    window.cloudSyncAbortController.abort();
    window.cloudSyncAbortController = null;
  }
  if (window.offlineGraceTimeoutId) {
    clearTimeout(window.offlineGraceTimeoutId);
    window.offlineGraceTimeoutId = null;
  }

  console.log("📱 User opted to bypass cloud sync. Resolving local save...");
  let localDataRaw = localStorage.getItem("idle_saq_save");
  let localParsed = null;
  let offlineMsToApply = 0;
  let now = Date.now();

  if (localDataRaw) {
    try {
      localParsed = JSON.parse(localDataRaw);
      if (!localParsed.saveVersion || localParsed.saveVersion < window.MIN_COMPATIBLE_VERSION) {
        console.warn("[WIPE] Outdated local save version on offline bypass. Purging state.");
        localStorage.removeItem("idle_saq_save");
        localParsed = null;
      } else {
        window.applySaveStatePayload(localParsed, true);
        window.recalculateXpRequirement();
        if (localParsed.lastSaveTime) {
          offlineMsToApply = now - localParsed.lastSaveTime;
        }
      }
    } catch (e) {
      console.error("Local save load failed", e);
    }
  }

  window.hideLoadingScreen();

  if (offlineMsToApply > 60000) {
    window.applyOfflineGains(offlineMsToApply);
  } else {
    window.setPauseState(false);
    window.updateUI();
    window.renderInventory();
  }

  // Warm real-time chat handshakes
  if (window.ChatManager) {
    window.ChatManager.init();
  }
};

window.loadGameAndSyncCloud = function () {
  window.isCloudSynced = false;
  window.isGamePaused = true; // Keep loop paused during gateway negotiation

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
      if (!localParsed.saveVersion || localParsed.saveVersion < window.MIN_COMPATIBLE_VERSION) {
        console.warn("[WIPE] Outdated local save version detected in sync gateway. Purging state.");
        localStorage.removeItem("idle_saq_save");
        localParsed = null;
      } else {
        window.applySaveStatePayload(localParsed, true);
        window.recalculateXpRequirement();
        if (localParsed.lastSaveTime) {
          offlineMsToApply = now - localParsed.lastSaveTime;
        }
      }
    } catch (e) {
      console.error("Local save load failed", e);
    }
  }

  // Fade in the manual bypass button if the server takes longer than 4.5 seconds to wake up
  let btnOffline = document.getElementById("btn-play-offline");
  let statusText = document.getElementById("loading-status-text");
  let subText = document.getElementById("loading-sub-text");

  if (window.offlineGraceTimeoutId) clearTimeout(window.offlineGraceTimeoutId);
  window.offlineGraceTimeoutId = setTimeout(() => {
    if (btnOffline) btnOffline.style.display = "block";
    if (statusText) statusText.innerText = "Cloud Sanctum is Sleeping...";
    if (subText)
      subText.innerText =
        "Server is waking up (Render free spin-up takes ~30s). You may wait or play offline.";
  }, 4500);

  if (!window.GAME_SERVER_URL) {
    if (window.offlineGraceTimeoutId)
      clearTimeout(window.offlineGraceTimeoutId);
    window.hideLoadingScreen();
    if (offlineMsToApply > 60000) {
      window.applyOfflineGains(offlineMsToApply);
    } else {
      window.setPauseState(false);
      window.updateUI();
      window.renderInventory();
    }
    return;
  }

  const userId = window.getGameUserId();
  if (typeof window.updateSyncStatus === "function") {
    window.updateSyncStatus("syncing");
  }

  window.cloudSyncAbortController = new AbortController();

  fetch(`${window.GAME_SERVER_URL}/api/load`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
      signal: window.cloudSyncAbortController.signal,
    })
      .then((response) => response.json())
      .then((data) => {
        if (window.offlineGraceTimeoutId)
          clearTimeout(window.offlineGraceTimeoutId);
        window.cloudSyncAbortController = null;

        let resolvedOfflineMs = offlineMsToApply;

        if (data.success && data.saveData) {
          if (!data.saveData.saveVersion || data.saveData.saveVersion < window.MIN_COMPATIBLE_VERSION) {
            console.warn("[WIPE] Outdated cloud save detected. Discarding.");
            data.saveData = null;
          }

          if (data.saveData) {
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
          } else {
            console.log("☁️ No compatible cloud save available. Staying on local progress.");
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
            clan_supply_depot: data.clan.skill_clan_supply_depot || 0,
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
        window.isCloudSynced = true;
        if (typeof window.updateSyncStatus === "function") {
          window.updateSyncStatus("connected");
        }
      }

      window.hideLoadingScreen();

      if (typeof window.checkDailyCalendar === "function") {
        window.checkDailyCalendar();
      }

      if (resolvedOfflineMs > 60000) {
        window.applyOfflineGains(resolvedOfflineMs);
      } else {
        window.setPauseState(false);
        window.updateUI();
        window.renderInventory();
      }

      // Warm real-time chat handshakes
      if (window.ChatManager) {
        window.ChatManager.init();
      }
    })
    .catch((err) => {
      // Ignore abort errors from manual play-offline clicks
      if (err.name === "AbortError") return;

      if (window.offlineGraceTimeoutId)
        clearTimeout(window.offlineGraceTimeoutId);
      window.cloudSyncAbortController = null;

      console.log(
        "📡 Could not reach Cloud server for sync check. Running off local cache.",
      );
      if (typeof window.updateSyncStatus === "function") {
        window.updateSyncStatus("offline");
      }

      window.hideLoadingScreen();

      if (offlineMsToApply > 60000) {
        window.applyOfflineGains(offlineMsToApply);
      } else {
        window.setPauseState(false);
        window.updateUI();
        window.renderInventory();
      }
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

  if (typeof window.updateDpsOverlayPosition === "function") {
    window.updateDpsOverlayPosition();
  }
};

window.onload = function () {
  // Intercept and wrap pushToast, addEtcDrop, and addUseDrop for aggregation & swipe gestures
  (function () {
    const originalPushToast = window.pushToast;
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
      const isMaterial =
        isEtc ||
        [
          "Monster Soul",
          "Luminous Soul",
          "Rare Scrap",
          "Magic Scrap",
          "Epic Scrap",
          "Legendary Scrap",
          "Mythic Scrap",
          "Ancient Core",
          "Eridium Shard",
          "Catalyst Core",
          "Overlord's Sigil",
          "Gacha Key",
          "Glimmering Gachapon Key",
        ].includes(name);

      const container = document.getElementById("toast-container");
      if (isMaterial && container) {
        const existing = Array.from(container.children).find(
          (el) =>
            el.getAttribute("data-etc-name") === name &&
            !el.classList.contains("fading-out"),
        );

        if (existing) {
          let curQty = parseInt(existing.getAttribute("data-qty") || "1", 10);
          let newQty = curQty + (quantity || 1);
          existing.setAttribute("data-qty", newQty);

          const nameSpans = existing.querySelectorAll("span");
          nameSpans.forEach((span) => {
            if (span.innerText.includes(name)) {
              span.innerHTML = `${name} <span style="color: #ffd700; font-family: monospace; font-weight: 900; margin-left: 4px;">x${newQty}</span>`;
            }
          });

          if (existing.timeoutId) clearTimeout(existing.timeoutId);
          if (existing.fadeTimeoutId) clearTimeout(existing.fadeTimeoutId);

          existing.timeoutId = setTimeout(() => {
            existing.classList.add("fading-out");
            existing.style.animation = "toastFadeOut 0.5s ease-in forwards";
            existing.fadeTimeoutId = setTimeout(() => existing.remove(), 450);
          }, 3500);

          return;
        }
      }

      if (typeof originalPushToast === "function") {
        originalPushToast(
          name,
          stars,
          color,
          isEtc,
          quantity,
          customText,
          clickAction,
          isMilestone,
          item,
        );

        if (container && container.firstElementChild) {
          const newToast = container.firstElementChild;
          if (isMaterial) {
            newToast.setAttribute("data-etc-name", name);
            newToast.setAttribute("data-qty", quantity || 1);

            if ((quantity || 1) > 1) {
              const nameSpans = newToast.querySelectorAll("span");
              nameSpans.forEach((span) => {
                if (span.innerText.includes(name)) {
                  span.innerHTML = `${name} <span style="color: #ffd700; font-family: monospace; font-weight: 900; margin-left: 4px;">x${quantity}</span>`;
                }
              });
            }
          }

          let isSwiping = false;
          let startX = 0;
          let startY = 0;
          let hasMoved = false;

          newToast.style.touchAction = "none";

          // Intercept clicks during active swiping gestures
          newToast.addEventListener(
            "click",
            (e) => {
              if (hasMoved) {
                e.stopPropagation();
                e.preventDefault();
              }
            },
            true,
          );

          newToast.addEventListener("pointerdown", (e) => {
            if (e.button !== 0) return; // Only process left click or single touch

            isSwiping = true;
            startX = e.clientX;
            startY = e.clientY;
            hasMoved = false;
            newToast.style.transition = "none";

            if (newToast.timeoutId) clearTimeout(newToast.timeoutId);
            if (newToast.fadeTimeoutId) clearTimeout(newToast.fadeTimeoutId);

            try {
              newToast.setPointerCapture(e.pointerId);
            } catch (err) {}
            e.stopPropagation();
          });

          newToast.addEventListener("pointermove", (e) => {
            if (!isSwiping) return;

            let diffX = e.clientX - startX;
            let diffY = e.clientY - startY;

            if (Math.abs(diffX) > 6 || Math.abs(diffY) > 6) {
              hasMoved = true;
            }

            let displayY = diffY < 0 ? diffY : diffY * 0.2; // Resist pulling downwards
            newToast.style.transform = `translate(${diffX}px, ${displayY}px)`;

            let maxDist = 180;
            let currentDist = Math.max(
              Math.abs(diffX),
              diffY < 0 ? Math.abs(diffY) : 0,
            );
            newToast.style.opacity = Math.max(0, 1 - currentDist / maxDist);

            e.stopPropagation();
          });

          const handleSwipeEnd = (e) => {
            if (!isSwiping) return;
            isSwiping = false;

            try {
              newToast.releasePointerCapture(e.pointerId);
            } catch (err) {}

            let diffX = e.clientX - startX;
            let diffY = e.clientY - startY;

            let threshold = 60;
            let isDismissed = false;
            let transitionStyle = "";
            let transformStyle = "";

            if (diffY < -threshold) {
              isDismissed = true;
              transitionStyle =
                "transform 0.2s ease-out, opacity 0.2s ease-out";
              transformStyle = `translate(${diffX}px, -150%)`;
            } else if (Math.abs(diffX) > threshold) {
              isDismissed = true;
              transitionStyle =
                "transform 0.2s ease-out, opacity 0.2s ease-out";
              transformStyle = `translate(${diffX > 0 ? "150%" : "-150%"}, ${diffY < 0 ? diffY : 0}px)`;
            }

            if (isDismissed) {
              newToast.style.transition = transitionStyle;
              newToast.style.transform = transformStyle;
              newToast.style.opacity = "0";
              if (newToast.timeoutId) clearTimeout(newToast.timeoutId);
              if (newToast.fadeTimeoutId) clearTimeout(newToast.fadeTimeoutId);
              setTimeout(() => newToast.remove(), 200);
            } else {
              newToast.style.transition =
                "transform 0.2s ease, opacity 0.2s ease";
              newToast.style.transform = "translate(0, 0)";
              newToast.style.opacity = "1";

              // Reschedule auto-dismiss timer
              newToast.timeoutId = setTimeout(() => {
                newToast.classList.add("fading-out");
                newToast.style.animation = "toastFadeOut 0.5s ease-in forwards";
                newToast.fadeTimeoutId = setTimeout(
                  () => newToast.remove(),
                  450,
                );
              }, 3500);
            }
            e.stopPropagation();
          };

          newToast.addEventListener("pointerup", handleSwipeEnd);
          newToast.addEventListener("pointercancel", handleSwipeEnd);

          if (newToast.timeoutId) clearTimeout(newToast.timeoutId);
          if (newToast.fadeTimeoutId) clearTimeout(newToast.fadeTimeoutId);

          newToast.timeoutId = setTimeout(() => {
            newToast.classList.add("fading-out");
            newToast.style.animation = "toastFadeOut 0.5s ease-in forwards";
            newToast.fadeTimeoutId = setTimeout(() => newToast.remove(), 450);
          }, 3500);
        }
      }
    };
  })();

  if (typeof window.addEtcDrop === "function") {
    const originalAddEtcDrop = window.addEtcDrop;
    window.addEtcDrop = function (itemName, amount = 1, silent = false) {
      originalAddEtcDrop(itemName, amount);
      if (!silent && typeof window.recordRunLoot === "function") {
        window.recordRunLoot(itemName, amount, "etc");
      }
      if (!silent) {
        let color = "#bdc3c7";
        if (itemName === "Eridium Shard") color = "#8e44ad";
        else if (itemName === "Gacha Key") color = "#f1c40f";
        else if (itemName === "Ancient Core") color = "#e74c3c";
        else if (itemName === "Overlord's Sigil") color = "#1abc9c";
        else if (itemName === "Astral Essence") color = "#8e44ad";
        else if (itemName === "Luminous Soul") color = "#ffb6c1";
        else if (itemName === "Monster Soul") color = "#888888";
        else if (itemName === "Catalyst Core") color = "#2ecc71";
        else if (itemName.includes("Mythic")) color = "#e74c3c";
        else if (itemName.includes("Legendary")) color = "#f1c40f";
        else if (itemName.includes("Epic")) color = "#e67e22";
        else if (itemName.includes("Magic")) color = "#9b59b6";
        else if (itemName.includes("Rare")) color = "#3498db";

        window.pushToast(itemName, null, color, true, amount);
      }
    };
  }

  if (typeof window.addUseDrop === "function") {
    const originalAddUseDrop = window.addUseDrop;
    window.addUseDrop = function (itemName, amount = 1, silent = false) {
      originalAddUseDrop(itemName, amount);
      if (!silent && typeof window.recordRunLoot === "function") {
        window.recordRunLoot(itemName, amount, "use");
      }
      if (!silent) {
        let color = "#bdc3c7";
        if (window.useDex && window.useDex[itemName]) {
          color = window.useDex[itemName].color || "#2ecc71";
        }
        window.pushToast(itemName, null, color, false, amount);
      }
    };
  }

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

  // Onboarding: Grants a full set of 0★ Common Level 1 starting gear (except subweapon) to fresh Level 1 players to smooth the early campaign pacing
  if (
    window.playerStats.level === 1 &&
    !window.equippedSlots.weapon &&
    window.inventory.EQUIP.length === 0
  ) {
    const startingSlots = ["weapon", "helmet", "chest", "leggings", "boots"];
    startingSlots.forEach((slot) => {
      let item = window.createItemObject(slot, 0, 1, 0);
      window.equippedSlots[slot] = item;
      window.recalculateItemStats(item);
    });
    window.invalidatePlayerStats();
  }

  // Setup non-blocking background auto-save loop every 60 seconds
  setInterval(() => {
    if (!window.isGamePaused && typeof window.saveGame === "function") {
      window.saveGame();
    }
  }, 60000);

  window.updateStickyCanvasStyle();
  if (typeof window.updateChatStyle === "function") {
    window.updateChatStyle();
  }
  if (typeof window.updateDpsOverlayStyle === "function") {
    window.updateDpsOverlayStyle();
  }
  if (typeof window.initDpsOverlayDrag === "function") {
    window.initDpsOverlayDrag();
  }
  if (typeof window.requestWakeLock === "function") {
    window.requestWakeLock();
  }

  // Prompt fresh players to register their unique name
  setTimeout(() => {
    if (window.playerStats && window.playerStats.playerName === "Guest") {
      if (typeof window.pushHeaderToast === "function") {
        window.pushHeaderToast(
          "👤 Set your character name to secure your spot on the Leaderboard! Click here.",
          "#f1c40f",
          function () {
            if (typeof window.toggleSettings === "function") {
              window.toggleSettings();
            }
          },
        );
      }
    }
  }, 4000);

  // Block pointer event leaks and click-through propagation on tooltips (Gesture-Detecting Redesign)
  const preventTooltipLeaks = (id) => {
    let el = document.getElementById(id);
    if (!el) return;

    let startY = 0;
    let startX = 0;
    let isScrolling = false;

    // Desktop Keep-Alive Hover Listeners
    el.addEventListener("mouseenter", () => {
      if (window.tooltipHideTimeoutId) {
        clearTimeout(window.tooltipHideTimeoutId);
        window.tooltipHideTimeoutId = null;
      }
    });
    el.addEventListener("mouseleave", () => {
      window.hideTooltip();
    });

    const handleStart = (clientX, clientY) => {
      startY = clientY;
      startX = clientX;
      isScrolling = false;
    };

    const handleMove = (clientX, clientY) => {
      let diffY = Math.abs(clientY - startY);
      let diffX = Math.abs(clientX - startX);
      if (diffY > 8 || diffX > 8) {
        isScrolling = true;
      }
    };

    const handleEnd = (e) => {
      if (isScrolling) {
        return; // Stop dismissal if they swiped or scrolled the card
      }

      // Tapped on an interactive element inside the tooltip
      if (
        e.target.closest("summary") ||
        e.target.closest("details") ||
        e.target.closest("button") ||
        e.target.closest("select") ||
        e.target.closest("option") ||
        e.target.closest(".custom-select") ||
        e.target.closest("label") ||
        e.target.closest("input")
      ) {
        return;
      }

      e.preventDefault();
      window.hideTooltip();
    };

    // Modern Pointer Events
    el.addEventListener(
      "pointerdown",
      (e) => {
        e.stopPropagation();
        handleStart(e.clientX, e.clientY);
      },
      { passive: false },
    );

    el.addEventListener(
      "pointermove",
      (e) => {
        e.stopPropagation();
        handleMove(e.clientX, e.clientY);
      },
      { passive: true },
    );

    el.addEventListener(
      "pointerup",
      (e) => {
        e.stopPropagation();
        handleEnd(e);
      },
      { passive: false },
    );

    // Touch Fallbacks for Legacy WebViews
    el.addEventListener(
      "touchstart",
      (e) => {
        e.stopPropagation();
        if (e.touches && e.touches[0]) {
          handleStart(e.touches[0].clientX, e.touches[0].clientY);
        }
      },
      { passive: true },
    );

    el.addEventListener(
      "touchmove",
      (e) => {
        e.stopPropagation();
        if (e.touches && e.touches[0]) {
          handleMove(e.touches[0].clientX, e.touches[0].clientY);
        }
      },
      { passive: true },
    );

    el.addEventListener(
      "touchend",
      (e) => {
        e.stopPropagation();
        handleEnd(e);
      },
      { passive: false },
    );
  };
  preventTooltipLeaks("game-tooltip");
  preventTooltipLeaks("etc-tooltip");
  preventTooltipLeaks("stat-tooltip");

  // Warm user gesture activation for Web Audio Context & BGM
  const initAudio = () => {
    window.SoundManager.init();
    if (window.MusicManager) {
      window.MusicManager.init(); // Starts and loops your BGM adaptively on first click
    }

    // Force-unlock all mobile Web Audio context threads on touch/tap events
    const forceUnlockMobileAudio = () => {
      let sfxCtx = window.SoundManager.ctx || window.SoundManager.audioCtx;
      if (sfxCtx && sfxCtx.state === "suspended") {
        sfxCtx.resume().catch(() => {});
      }
      if (
        window.MusicManager &&
        window.MusicManager.ctx &&
        window.MusicManager.ctx.state === "suspended"
      ) {
        window.MusicManager.ctx.resume().catch(() => {});
      }
    };
    document.addEventListener("touchend", forceUnlockMobileAudio, {
      passive: true,
    });
    document.addEventListener("click", forceUnlockMobileAudio, {
      passive: true,
    });

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
    // Avoid fighting input focus states so players can type spaces normally
    const active = document.activeElement;
    if (
      active &&
      (active.tagName === "INPUT" ||
        active.tagName === "TEXTAREA" ||
        active.isContentEditable)
    ) {
      return;
    }
    if (e.code === "Space" && !window.spacePressed) {
      e.preventDefault();
      window.spacePressed = true;
      window.registerMaelstromTap();
      window.triggerPlayerSlash(true);
    }
  });
  window.addEventListener("keyup", function (e) {
    if (e.code === "Space") {
      window.spacePressed = false;
    }
  });

  // Prevent viewport scrolling when dragging/holding on the canvas without blocking multi-touch inputs
  canvas.addEventListener(
    "touchmove",
    function (e) {
      if (e.cancelable) e.preventDefault();
    },
    { passive: false },
  );

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

    // Mobile-friendly generous hitbox touch collision check
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

    let clickedOrbIndex = window.activeRiftOrbs.findIndex((orb) => {
      return Math.hypot(clickX - orb.x, clickY - orb.y) < orb.hitRadius;
    });

    if (clickedOrbIndex !== -1) {
      let clickedOrb = window.activeRiftOrbs[clickedOrbIndex];

      // Shield against starting swipe gestures unless clicking on the START crystal
      if (clickedOrb.type === "aetheric_conduit") {
        let distToStart = Math.hypot(
          clickX - clickedOrb.x,
          clickY - clickedOrb.y,
        );
        if (distToStart < clickedOrb.hitRadius) {
          window.activeConduitDrag = { orbId: clickedOrb.id, started: true };
          window.SoundManager.play("spell");
        }
        return; // Intercept click
      }

      window.handleOrbClick(clickedOrb, clickedOrbIndex);
      return; // Intercept click to process popping mechanics
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
    window.triggerPlayerSlash(true);
    if (typeof window.progressMission === "function") {
      window.progressMission("active_clicks", 1);
    }
  });

  // Track active swiping/dragging along the Conduit path
  canvas.addEventListener(
    "pointermove",
    function (e) {
      if (!window.activeConduitDrag) return;

      let orb = window.activeRiftOrbs.find(
        (o) => o.id === window.activeConduitDrag.orbId,
      );
      if (!orb) {
        window.activeConduitDrag = null;
        return;
      }

      if (e.cancelable) e.preventDefault();

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
      const px = clientX !== undefined ? (clientX - rect.left) * scaleX : 0;
      const py = clientY !== undefined ? (clientY - rect.top) * scaleY : 0;

      // Calculate distance to segment vector
      let dx = orb.endX - orb.x;
      let dy = orb.endY - orb.y;
      let segLenSq = dx * dx + dy * dy;
      if (segLenSq === 0) return;

      // Project player coordinates on the path
      let t = ((px - orb.x) * dx + (py - orb.y) * dy) / segLenSq;
      t = Math.max(0, Math.min(1, t));

      let projX = orb.x + t * dx;
      let projY = orb.y + t * dy;

      let dist = Math.hypot(px - projX, py - projY);

      if (dist > 45) {
        // Highly generous 45px corridor threshold for mobile players
        // Connection broke
        window.activeConduitDrag = null;
        orb.progress = 0;
        orb.connected = false;
        window.SoundManager.play("block");
        return;
      }

      // Lock progression forward to prevent sliding backwards
      orb.progress = Math.max(orb.progress, t);
      if (orb.progress > 0.9) {
        orb.connected = true;
      }
    },
    { passive: false },
  );

  window.addEventListener("pointerup", (e) => {
    try {
      canvas.releasePointerCapture(e.pointerId);
    } catch (err) {}
    window.activeCanvasPointers.delete(e.pointerId);
    if (window.activeCanvasPointers.size === 0) {
      window.isCanvasPressed = false;
    }

    // Complete active Conduit connection on release
    if (window.activeConduitDrag) {
      let drag = window.activeConduitDrag;
      window.activeConduitDrag = null;
      let orbIdx = window.activeRiftOrbs.findIndex((o) => o.id === drag.orbId);
      if (orbIdx !== -1) {
        let orb = window.activeRiftOrbs[orbIdx];
        if (orb.connected) {
          window.executeConduitDischarge(orb, orbIdx);
        } else {
          orb.progress = 0;
          orb.connected = false;
          window.SoundManager.play("swing");
        }
      }
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

    // Auto-close Bestiary Modal if clicking outside of it
    let bestiaryModal = document.getElementById("bestiary-modal");
    if (bestiaryModal && bestiaryModal.style.display === "block") {
      if (
        !e.target.closest("#bestiary-modal") &&
        !e.target.closest('div[onclick*="toggleBestiaryAlbum"]')
      ) {
        bestiaryModal.style.display = "none";
        window.hideTooltip();
        window.updateUI();
      }
    }
  });

  requestAnimationFrame(engineCycle);
  window.updateUI();
};

let lastUpdateTime = Date.now();
let lastRenderTime = 0;
let accumTime = 0;
const logicTimeStep = 1000 / 60; // Target exactly 60 ticks per second (~16.67ms)

function engineCycle() {
  try {
    let now = Date.now();
    let elapsed = now - lastUpdateTime;

    // Prevent "spiral of death" during lag spikes or tab suspensions
    if (elapsed > 250) elapsed = 250;
    lastUpdateTime = now;

    accumTime += elapsed;

    // Execute as many fixed updates as needed to match real-time
    while (accumTime >= logicTimeStep) {
      update();
      accumTime -= logicTimeStep;
    }

    // Limit render cycles to save CPU/GPU resources on mobile or Eco Mode
    let renderLimit =
      window.playerStats && window.playerStats.ecoMode ? 1000 / 45 : 0; // Perfectly preserves your 45 FPS Eco Mode target

    if (now - lastRenderTime >= renderLimit) {
      window.draw();
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

  if (window.hasUniquePassive("tome_watch") && !window.isGamePaused) {
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
        let pResolved = window.resolvePlayerStats();
        let extraFrames = Math.floor(pResolved.int * 0.05);
        window.playerStats.watchActiveTimer = Math.min(480, 240 + extraFrames);
        window.pushLog(
          "<span style='color:#f1c40f; font-weight:bold;'>[CHRONOS WATCH] A Temporal Fracture opened! speeds dilated (+15% speed, -25% enemy speed).</span>",
        );
        window.updateUI();
      }
    }
  }

  let effActiveCount = 0;
  for (let i = 0; i < window.effects.length; i++) {
    let eff = window.effects[i];
    eff.life--;
    if (eff.life > 0) {
      eff.x += eff.vx !== undefined ? eff.vx : 0;
      eff.y += eff.vy !== undefined ? eff.vy : -0.4;
      window.effects[effActiveCount++] = eff;
    }
  }
  window.effects.length = effActiveCount;
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

  // Update Gold Homing Particles with audio-visual collection feedback
  if (window.goldParticles) {
    let gpActiveCount = 0;
    let targetX = window.canvas ? window.canvas.width * 0.75 : 560;
    let targetY = -15;
    for (let i = 0; i < window.goldParticles.length; i++) {
      let gp = window.goldParticles[i];
      gp.life--;
      if (gp.life > 0) {
        if (gp.delay > 0) {
          gp.delay--;
          gp.x += gp.vx;
          gp.y += gp.vy;
          gp.vy += 0.25; // Apply standard gravity in spew phase
        } else {
          let dx = targetX - gp.x;
          let dy = targetY - gp.y;
          let dist = Math.hypot(dx, dy);
          if (dist < 15 || gp.y < -5) {
            if (typeof window.triggerGoldPanelReaction === "function") {
              window.triggerGoldPanelReaction();
            }
            if (
              window.SoundManager &&
              typeof window.SoundManager.playCoinCollect === "function"
            ) {
              window.SoundManager.playCoinCollect();
            }
            if (
              typeof window.absorbGoldParticle === "function" &&
              gp.amount !== undefined
            ) {
              window.absorbGoldParticle(gp.amount, gp.isDungeon, gp.isCrucible);
            }
            continue; // Reached target, let it die
          }
          let pull = 0.85;
          gp.vx += (dx / dist) * pull;
          gp.vy += (dy / dist) * pull;

          let speed = Math.hypot(gp.vx, gp.vy);
          let maxSpeed = 16;
          if (speed > maxSpeed) {
            gp.vx = (gp.vx / speed) * maxSpeed;
            gp.vy = (gp.vy / speed) * maxSpeed;
          }
          gp.x += gp.vx;
          gp.y += gp.vy;
        }
        window.goldParticles[gpActiveCount++] = gp;
      }
    }
    window.goldParticles.length = gpActiveCount;
  }

  for (let i = window.beams.length - 1; i >= 0; i--) {
    let bm = window.beams[i];
    bm.life--;
    if (bm.life <= 0) window.beams.splice(i, 1);
  }

  if (window.deathAnimationTimer > 0) {
    window.deathAnimationTimer--;
    let p = window.resolvePlayerStats();
    let speedFactor = window.deathAnimationTimer / window.deathMaxFrames;
    let scalingFactor = (canvas.width - 80) / 670;
    let scrollSpeed = (2 + p.moveSpeed * 0.05) * speedFactor * scalingFactor;
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

  // Unified Dungeon Keys real-time regeneration (max 5 keys, 4-hour rate)
  if (window.playerStats.dungeonKeys < 5) {
    if (!window.playerStats.nextDungeonKeyTime) {
      window.playerStats.nextDungeonKeyTime = now + 14400000; // 4 Hours
    } else if (now >= window.playerStats.nextDungeonKeyTime) {
      let msOver = now - window.playerStats.nextDungeonKeyTime;
      let keysEarned = 1 + Math.floor(msOver / 14400000);
      window.playerStats.dungeonKeys = Math.min(
        5,
        window.playerStats.dungeonKeys + keysEarned,
      );
      window.playerStats.nextDungeonKeyTime =
        window.playerStats.dungeonKeys < 5
          ? now + (14400000 - (msOver % 14400000))
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
    window.triggerPlayerSlash(false);
  }
  if (window.mob && window.mob.hp.lte(0)) window.handleMobDeath();
  if (window.mob && window.mob.flashTimer > 0) window.mob.flashTimer--;
  if (window.mob && window.mob.funnyTextTimer > 0) window.mob.funnyTextTimer--;

  if (window.mob && window.mob.hp.gt(0)) {
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
        window.mob.hp = window.mob.hp.sub(bleedDmg);
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

        // Sanguine Reaver: Ticks lifesteal with the active bleed damage instead of granting instant flat burst heals!
        if (window.hasUniquePassive("weapon_sword")) {
          let bleedHeal = Math.max(1, Math.ceil(bleedDmg * 0.15));
          window.playerStats.currentHp = Math.min(
            p.maxHp,
            window.playerStats.currentHp + bleedHeal,
          );
          window.effects.push({
            type: "regen",
            x: window.hero.x - 20,
            y: window.hero.y - 12,
            amount: bleedHeal,
            color: "#e74c3c",
            life: 30,
          });
        }

        if (window.mob.hp.lte(0)) window.handleMobDeath();
      }
    }
  }

  // --- BIOHAZARD POISON DOT & LIFE-STEAL ---
  if (window.mob && window.mob.hp.gt(0)) {
    if (window.mob.poisonTimer && window.mob.poisonTimer > 0) {
      window.mob.poisonTimer--;
      window.mob.poisonTickCounter = (window.mob.poisonTickCounter || 0) + 1;
      if (window.mob.poisonTickCounter >= 15) {
        window.mob.poisonTickCounter = 0;
        let pStacks = window.mob.poisonStacks || 1;
        let poisonDmg = Math.max(
          1,
          Math.ceil(((window.mob.poisonDmgPerSecond || 1) * pStacks) / 4),
        );

        window.mob.hp = window.mob.hp.sub(poisonDmg);
        window.mob.flashTimer = 5;

        // Spawn toxic green gas particles
        for (let i = 0; i < 3; i++) {
          window.particles.push({
            x: window.mob.x + window.mob.w / 2 + window.randFloat(-10, 10),
            y: window.mob.y + window.mob.h / 2 + window.randFloat(-10, 10),
            vx: window.randFloat(-1.0, 1.0),
            vy: window.randFloat(-2.0, -0.5),
            radius: window.randFloat(1.2, 2.5),
            color: "#2ecc71",
            alpha: 1,
            life: window.randInt(10, 18),
          });
        }

        window.spawnDamageEffect(poisonDmg, "poison", false); // Trigger custom green toxic spore text
        window.damageHistory.push({ time: Date.now(), amount: poisonDmg });

        // Life-stealing effect: Heals player for 100% of Poison DoT dealt!
        let healAmt = poisonDmg;
        window.playerStats.currentHp = Math.min(
          p.maxHp,
          window.playerStats.currentHp + healAmt,
        );
        window.effects.push({
          type: "regen",
          x: window.hero.x - 20,
          y: window.hero.y - 12,
          amount: healAmt,
          color: "#2ecc71",
          life: 30,
        });

        if (window.mob.hp.lte(0)) window.handleMobDeath();
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

  let freezePotions =
    window.playerStats.isCrucibleMode &&
    window.playerStats.crucibleDraftDeck &&
    window.playerStats.crucibleDraftDeck.includes("freeze_frame");
  if (!freezePotions) {
    if (window.playerStats.atkPotionTimer > 0)
      window.playerStats.atkPotionTimer--;
    if (window.playerStats.hpPotionTimer > 0)
      window.playerStats.hpPotionTimer--;
    if (window.playerStats.defPotionTimer > 0)
      window.playerStats.defPotionTimer--;
    if (window.playerStats.hastePotionTimer > 0)
      window.playerStats.hastePotionTimer--;
    if (window.playerStats.xpPotionTimer > 0)
      window.playerStats.xpPotionTimer--;
    if (window.playerStats.dropPotionTimer > 0)
      window.playerStats.dropPotionTimer--;
    if (window.playerStats.qlyPotionTimer > 0)
      window.playerStats.qlyPotionTimer--;
  }

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

  // Time-Independent Dungeon Passive: 1% HP Regeneration per Second
  if (window.playerStats.isDungeonMode && window.playerStats.currentHp > 0) {
    if (!window.playerStats.lastRegenTime) {
      window.playerStats.lastRegenTime = now;
    }
    if (now - window.playerStats.lastRegenTime >= 1000) {
      window.playerStats.lastRegenTime = now;
      let pCurrent = window.resolvePlayerStats();
      if (window.playerStats.currentHp < pCurrent.maxHp) {
        let regenAmt = Math.floor(pCurrent.maxHp * 0.01);
        if (regenAmt > 0) {
          window.playerStats.currentHp = Math.min(
            pCurrent.maxHp,
            window.playerStats.currentHp + regenAmt,
          );
          window.effects.push({
            type: "regen",
            x: window.hero.x - 5,
            y: window.hero.y - 12,
            amount: regenAmt,
            color: "#2ecc71",
            life: 35,
          });
        }
      }
    }
  } else {
    window.playerStats.lastRegenTime = 0; // Reset anchor outside dungeons
  }

  window.logicClock++;
  if (window.logicClock % 60 === 0) {
    if (typeof window.checkAndResetMissions === "function")
      window.checkAndResetMissions();
    if (typeof window.checkAchievements === "function")
      window.checkAchievements();

    // Dynamic Active-Sigil Spawn Pity Accumulator
    if (window.activeRiftOrbs && window.activeRiftOrbs.length === 0) {
      window.secondsSinceLastRiftSpawn =
        (window.secondsSinceLastRiftSpawn || 0) + 1;
    }
    let spawnMult = 1 + (window.secondsSinceLastRiftSpawn || 0) * 0.1; // +10% relative chance per second

    // Stacking Apathy Decay Damage ticks
    if (
      window.playerStats.apathyDecayStacks > 0 &&
      window.playerStats.currentHp > 0 &&
      !window.isGamePaused
    ) {
      let stacks = window.playerStats.apathyDecayStacks;
      if (window.playerStats.purifiedAegisTimer > 0) {
        // Protected by Aegis
      } else {
        let pCurrent = window.resolvePlayerStats();
        let decayDmg = Math.ceil(pCurrent.maxHp * 0.015 * stacks);
        window.playerStats.currentHp = Math.max(
          1,
          window.playerStats.currentHp - decayDmg,
        );
        window.effects.push({
          x: window.hero.x,
          y: window.hero.y,
          text: `-${decayDmg} [DECAY]`,
          color: "#ff007f",
          life: 30,
        });
        if (window.playerStats.currentHp <= 1) {
          window.playerStats.currentHp = 0;
          window.deathAnimationTimer = window.deathMaxFrames;
        }
        window.updateUI();
      }

      window.playerStats.apathyDecayTimer -= 60;
      if (window.playerStats.apathyDecayTimer <= 0) {
        window.playerStats.apathyDecayStacks = 0;
        if (typeof window.pushLog === "function") {
          window.pushLog(
            "<span style='color:#7f8c8d;'>[SYSTEM] Apathy Decay has faded.</span>",
          );
        }
        window.updateUI();
      }
    }

    // Roll for Void Rift Rupture (12% chance per second if Void Rupture is active)
    if (
      window.isCavernEffectActive("void_rupture") &&
      window.activeRiftOrbs.length === 0 &&
      Math.random() < 0.12 * spawnMult &&
      !(window.playerStats.purifiedAegisTimer > 0) &&
      !window.isGamePaused
    ) {
      window.spawnVoidSuppressionOrbs();
      window.secondsSinceLastRiftSpawn = 0;
    }

    // Stacking Apathy Distortion HP drain (0.5% Max HP per active shard)
    let activeShards = window.activeRiftOrbs.filter(
      (orb) => orb.type === "anomalous_shard",
    );
    if (
      activeShards.length > 0 &&
      window.playerStats.currentHp > 0 &&
      !window.isGamePaused
    ) {
      if (window.playerStats.purifiedAegisTimer > 0) {
        // Shielded by Purified Aegis
      } else {
        let pCurrent = window.resolvePlayerStats();
        let totalDrain = Math.ceil(
          pCurrent.maxHp * 0.005 * activeShards.length,
        );
        window.playerStats.currentHp = Math.max(
          1,
          window.playerStats.currentHp - totalDrain,
        );
        window.effects.push({
          x: window.hero.x,
          y: window.hero.y,
          text: `-${totalDrain} [DISTORTION]`,
          color: "#ff2200",
          life: 30,
        });
        if (window.playerStats.currentHp <= 1) {
          window.playerStats.currentHp = 0;
          window.deathAnimationTimer = window.deathMaxFrames;
        }
        window.updateUI();
      }
    }

    // Roll for Anomalous Shard spawn (8% chance per second when idle and no active rifts if rolled on Sigil/Crucible)
    if (
      window.isCavernEffectActive("anomalous_shards") &&
      window.activeRiftOrbs.length === 0 &&
      Math.random() < 0.08 * spawnMult &&
      !window.isGamePaused
    ) {
      window.spawnAnomalousShard();
      window.secondsSinceLastRiftSpawn = 0;
    }

    // Roll for Perfect Strike Reticle (5% chance per second when combat is active, no active orbs, and rolled on Sigil/Crucible)
    if (
      window.isCavernEffectActive("perfect_strike") &&
      window.mob &&
      window.mob.hp.gt(0) &&
      window.activeRiftOrbs.length === 0 &&
      Math.random() < 0.05 * spawnMult &&
      !window.isGamePaused
    ) {
      window.spawnPerfectStrikeReticle();
      window.secondsSinceLastRiftSpawn = 0;
    }

    // Roll for Aetheric Conduit spawn (4% chance per second when no active orbs if rolled on Sigil/Crucible)
    if (
      window.isCavernEffectActive("aetheric_conduit") &&
      window.activeRiftOrbs.length === 0 &&
      Math.random() < 0.04 * spawnMult &&
      !window.isGamePaused
    ) {
      window.spawnAethericConduit();
      window.secondsSinceLastRiftSpawn = 0;
    }

    // Roll for Aetheric Spark (6% chance per second when no active orbs and not awakened if rolled on Sigil/Crucible)
    if (
      window.isCavernEffectActive("aetheric_spark") &&
      window.activeRiftOrbs.length === 0 &&
      Math.random() < 0.06 * spawnMult &&
      !(window.playerStats.astralAwakeningTimer > 0) &&
      !window.isGamePaused
    ) {
      window.spawnAethericSpark(0); // Commences the chain at Index 0
      window.secondsSinceLastRiftSpawn = 0;
    }

    // Roll for Glimmering Pixie (5% chance per second when no active orbs if rolled on Sigil/Crucible)
    if (
      window.isCavernEffectActive("glimmering_pixie") &&
      window.activeRiftOrbs.length === 0 &&
      Math.random() < 0.05 * spawnMult &&
      !window.isGamePaused
    ) {
      window.spawnGlimmeringPixie();
      window.secondsSinceLastRiftSpawn = 0;
    }

    // Active Debuff: Withering Decay (Periodic combat damage drain)
    if (
      window.playerStats.isCrucibleMode &&
      window.playerStats.crucibleActiveDebuff?.id === "withering_decay" &&
      window.mob &&
      window.mob.hp.gt(0)
    ) {
      let debuffStrength =
        window.playerStats.crucibleInfusedType === "debuff" ? 1.5 : 1.0;
      let reduction =
        window.playerStats.crucibleSelfDmgReduction !== undefined
          ? window.playerStats.crucibleSelfDmgReduction
          : 1.0;
      let decayAmt = Math.ceil(
        window.playerStats.currentHp * (0.015 * debuffStrength * reduction),
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

  if (window.hasUniquePassive("weapon_singularity")) {
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
          let shieldLvl = window.equippedSlots.weapon
            ? window.equippedSlots.weapon.stageLevel || 1
            : 1;
          let mult = 1.4 + shieldLvl * 0.015 + p.str * 0.0001;
          if (mult > 2.5) mult = 2.5;

          let finalDetonationDmg = Math.ceil(finalStored * mult);
          let maxCapBig = BigNum.from(window.mob.maxHp).mul(1.5);
          let maxCap = Number(
            maxCapBig.m * Math.pow(10, Math.min(15, maxCapBig.e)),
          );
          if (finalDetonationDmg > maxCap) {
            finalDetonationDmg = maxCap;
            window.pushLog(
              "<span style='color:#e74c3c;'>[SINGULARITY] Detonation capped at 150% of monster maximum health.</span>",
            );
          }
          window.mob.hp = window.mob.hp.sub(finalDetonationDmg);
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
          if (window.mob.hp.lte(0)) window.handleMobDeath();
        }
        window.updateUI();
      }
    }
  } else {
    window.playerStats.singularityState = "dormant";
    window.playerStats.singularityTimer = 1800;
  }

  if (window.hasUniquePassive("weapon_staff")) {
    if (window.playerStats.fireballCooldown === undefined)
      window.playerStats.fireballCooldown = 0;
    if (window.playerStats.fireballCooldown > 0)
      window.playerStats.fireballCooldown--;
    if (
      window.playerStats.fireballCooldown <= 0 &&
      window.mob &&
      window.mob.hp.gt(0)
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
      window.mob.hp.gt(0) &&
      !proj.hitMobs.includes(window.mob.id)
    ) {
      if (
        proj.x + proj.r > window.mob.x &&
        proj.x - proj.r < window.mob.x + window.mob.w
      ) {
        proj.hitMobs.push(window.mob.id);
        let mobDef = window.mob.def || 0;
        if (proj.isMaelstromCrescent) {
          let windDmg = Math.max(
            1,
            Math.ceil(p.atk * 0.5 * (1.0 + p.dex * 0.0015)),
          );
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
            window.mob.hp = window.mob.hp.sub(windDmg);
            window.mob.flashTimer = 5;
            window.spawnDamageEffect(windDmg, "echo", false);
            window.damageHistory.push({ time: Date.now(), amount: windDmg });
            window.SoundManager.play("spell_frost");
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
          let flameDmg = Math.max(
            1,
            Math.ceil(p.atk * 0.25 * (1.0 + p.int * 0.002)),
          );
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
            window.mob.hp = window.mob.hp.sub(flameDmg);
            window.mob.flashTimer = 5;
            window.spawnDamageEffect(flameDmg, "fire", false);
            window.damageHistory.push({ time: Date.now(), amount: flameDmg });
            window.SoundManager.play("spell_fire");
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
        if (window.mob && window.mob.hp.lte(0)) window.handleMobDeath();
      }
    }
    if (proj.x > canvas.width + 50) window.projectiles.splice(i, 1);
  }

  if (
      window.activeFairies.length === 0 &&
      !window.playerStats.isCrucibleMode &&
      Math.random() < 0.00005
    ) {
      window.playerStats.fairiesClickedInSet = 0;
      window.playerStats.fairiesEquipDroppedInSet = 0;
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

  // Update Void Suppression Orbs
  let activeOrbsCount = 0;
  let expiredOrbs = [];
  for (let i = 0; i < window.activeRiftOrbs.length; i++) {
    let orb = window.activeRiftOrbs[i];
    if (!window.isGamePaused) orb.timer--;

    // Dynamic target-tracking to anchor the reticle over the active mob's center
    if (orb.type === "perfect_strike" && window.mob) {
      orb.x = window.mob.x + window.mob.w / 2;
      orb.y = window.mob.y + window.mob.h / 2;
    }

    // Zig-zag motion math for the Glimmering Pixie flight paths
    if (orb.type === "glimmering_pixie") {
      if (!window.isGamePaused) {
        if (orb.pauseTimer > 0) {
          orb.pauseTimer--;
        } else {
          let dx = orb.targetX - orb.x;
          let dy = orb.targetY - orb.y;
          let dist = Math.hypot(dx, dy);

          if (dist < 8) {
            // Reached turning point, pause briefly to give mobile players a clean shot!
            orb.pauseTimer = 18;
            let padX = 60;
            let padY = 60;
            let cvs = document.getElementById("gameCanvas");
            let w = cvs ? cvs.width : 750;
            let h = cvs ? cvs.height : 320;
            orb.targetX = window.randFloat(padX, w - padX);
            orb.targetY = window.randFloat(padY, h - padY - 90);
          } else {
            orb.x += (dx / dist) * orb.speed;
            orb.y += (dy / dist) * orb.speed;
          }
        }
      }
    }

    if (orb.timer > 0) {
      window.activeRiftOrbs[activeOrbsCount++] = orb;
    } else {
      expiredOrbs.push(orb);
    }
  }
  window.activeRiftOrbs.length = activeOrbsCount;

  // Process collapsed unpopped orbs
  expiredOrbs.forEach((orb) => {
    window.handleOrbExpiry(orb);
  });

  // Tick down debuff immunity Purified Aegis
  if (window.playerStats.purifiedAegisTimer > 0) {
    if (!window.isGamePaused) window.playerStats.purifiedAegisTimer--;
    if (window.playerStats.purifiedAegisTimer === 0) {
      window.invalidatePlayerStats();
      if (typeof window.pushLog === "function") {
        window.pushLog(
          "<span style='color:#7f8c8d;'>[SYSTEM] Purified Aegis has expired.</span>",
        );
      }
      window.updateUI();
    }
  }

  // Tick down combat surge Astral Awakening
  if (window.playerStats.astralAwakeningTimer > 0) {
    if (!window.isGamePaused) window.playerStats.astralAwakeningTimer--;
    if (window.playerStats.astralAwakeningTimer === 0) {
      window.invalidatePlayerStats();
      if (typeof window.pushLog === "function") {
        window.pushLog(
          "<span style='color:#7f8c8d;'>[SYSTEM] Astral Awakening has faded. Cooldowns normalized.</span>",
        );
      }
      window.updateUI();
    }
  }

  if (
    window.playerStats.isPrestigeBossMode &&
    window.playerStats.prestigeApproachTimer > 0
  ) {
    window.playerStats.prestigeApproachTimer--;
    let scalingFactor = (canvas.width - 80) / 670;
    let chargeScrollSpeed = (2 + p.moveSpeed * 0.05) * 3 * scalingFactor;
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
      let hp = BigNum.from(Math.floor(600 * scale));
      let dmg = BigNum.from(Math.floor(6 * scale));
      let def = 80 + (activeStage - 80) * 1.5;

      window.mob = {
        x: canvas.width - 230,
        y: 65,
        w: 180,
        h: 160,
        type: "prestige_boss",
        isRare: false,
        hp: hp,
        maxHp: hp,
        damage: dmg,
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
    let scalingFactor = (canvas.width - 80) / 670;
    scrollScenery(scrollSpeed * scalingFactor);
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
      let scalingFactor = (canvas.width - 80) / 670;
      // Dampened square-root curve ensures smooth progressive approach speeds without teleportation
      let mobSpeed = (6.5 + Math.sqrt(scrollSpeed) * 1.6) * scalingFactor;
      window.mob.x -= mobSpeed;
      window.mob.isStopped = false;
      scrollScenery(scrollSpeed * scalingFactor);
    } else {
      window.mob.isStopped = true;
    }

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

    if (window.mob.attackTimer <= 0 && window.mob && window.mob.hp.gt(0)) {
      window.mob.attackTimer = window.mob.attackCooldown || 120;

      let isBlocked = Math.random() < p.block;

      if (isBlocked) {
        window.SoundManager.play("block");

        // High-Powered Shield Bash Counter-Attack for all Shields!
        if (window.mob && window.mob.hp.gt(0)) {
          let sub = window.equippedSlots.subweapon;
          let noun = sub && sub.noun ? sub.noun.toLowerCase() : "";
          let bashMult = 1.5;

          if (noun.includes("buckler")) {
            bashMult = 1.0;
          } else if (noun.includes("tower")) {
            bashMult = 2.5;
          } else {
            bashMult = 1.6;
          }

          let bashDmg = Math.ceil(p.def * bashMult * (1.0 + p.str * 0.002));
          let isAegis = window.hasUniquePassive("shield_aegis");

          if (isAegis) {
            let shieldLvl = window.equippedSlots.subweapon.stageLevel || 1;
            bashDmg = Math.ceil(
              p.def * (2.2 + shieldLvl * 0.05) * (1.0 + p.str * 0.003),
            );
          }

          if (window.playerStats.singularityState === "storing") {
            window.playerStats.singularityStoredDmg += bashDmg;
            window.effects.push({
              x: window.mob.x + window.mob.w / 2,
              y: window.mob.y - 10,
              text: `+${window.formatNumber(bashDmg)} [STORED]`,
              color: "#8e44ad",
              life: 45,
            });
          } else {
            window.mob.hp = window.mob.hp.sub(bashDmg);
            window.mob.flashTimer = 5;
            window.spawnDamageEffect(
              bashDmg,
              isAegis ? "aegis_counter" : "counter",
              false,
            );
            window.damageHistory.push({ time: Date.now(), amount: bashDmg });

            // Shield slam visual impact particles
            for (let i = 0; i < 8; i++) {
              window.particles.push({
                x: window.mob.x + window.mob.w / 2,
                y: window.mob.y + window.mob.h / 2,
                vx: window.randFloat(-3, 3),
                vy: window.randFloat(-3, 3),
                radius: window.randFloat(1.5, 3.5),
                color: isAegis ? "#8e44ad" : "#3498db",
                alpha: 1,
                life: window.randInt(15, 25),
              });
            }

            if (window.mob.hp <= 0) {
              window.handleMobDeath();
              return;
            }
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
        // If not blocked, calculate net damage, which can still be parried or mitigated!
        // Calculate dynamic armor constant based on active stage scale to prevent flatlocked high-tier defenses
        let actStg = window.playerStats.stage;
        if (
          window.playerStats.isDungeonMode &&
          window.playerStats.currentDungeon
        ) {
          actStg =
            window.playerStats.currentDungeonStage[
              window.playerStats.currentDungeon
            ] || 1;
        } else if (window.playerStats.isUberBoss) {
          let rLvl = window.playerStats.activeRiftLevel || 1;
          actStg = 50 + rLvl * 10;
        }
        let dEffStage = window.getEffectiveStage(actStg);
        let dGrowthRate = 1.045 + (dEffStage * 0.04) / (dEffStage + 200);
        let dScaleBig = BigNum.from(dGrowthRate).pow(dEffStage);
        let dScale = Number(
          dScaleBig.m * Math.pow(10, Math.min(15, dScaleBig.e)),
        );

        let armorConstant = Math.max(100, 5.0 * dScale);
        let netDamageBig = BigNum.from(window.mob.damage).mul(
          armorConstant / (armorConstant + p.def),
        );
        let netDamage = 0;
        if (netDamageBig.e > 15) {
          netDamage = p.maxHp * 2; // Instant death without numeric overflow
        } else {
          netDamage = Math.max(
            1,
            Math.ceil(Number(netDamageBig.m * Math.pow(10, netDamageBig.e))),
          );
        }

        const subType = window.equippedSlots.subweapon
          ? window.equippedSlots.subweapon.subType
          : null;

        let isParried = Math.random() < p.parry;

        if (isParried) {
          // Mitigate incoming damage by 60% (takes 40% damage)
          netDamage = Math.max(1, Math.ceil(netDamage * 0.4));
          window.SoundManager.play("parry");

          // Instant offensive Riposte counter-attack scaling with DEX & ATK!
          let sub = window.equippedSlots.subweapon;
          let noun = sub && sub.noun ? sub.noun.toLowerCase() : "";
          let riposteMult = 1.0;

          if (noun.includes("kris") || noun.includes("dirk")) {
            riposteMult = 1.3;
          } else if (noun.includes("stiletto") || noun.includes("baselard")) {
            riposteMult = 0.8;
          } else {
            riposteMult = 1.0;
          }

          let riposteDmg = Math.ceil(
            p.atk * riposteMult * (1.0 + p.dex * 0.003),
          );

          // Active Buff: Echoing Step (Counter strike scaling on parry)
          if (
            window.playerStats.isCrucibleMode &&
            window.playerStats.crucibleActiveBuff?.id === "echoing_step"
          ) {
            let buffStrength =
              window.playerStats.crucibleInfusedType === "buff" ? 1.5 : 1.0;
            riposteDmg += Math.ceil(p.atk * (1.0 * buffStrength));
          }

          if (window.checkArtifactTrait("parry_strike")) {
            let T = window.getArtifactTemperLevel("parry_strike");
            let mult = 0.5 + T * 0.15; // 50% base + 15% per level (max 140%)
            riposteDmg += Math.ceil(p.atk * mult);
          }

          if (window.playerStats.adrenalineTimer > 0) riposteDmg *= 2;

          // Apply active defense mitigation to offhand dagger strikes
          let mobDef = window.mob.def || 0;
          riposteDmg = Math.max(
            1,
            Math.ceil(riposteDmg * (100 / (100 + mobDef))),
          );

          if (window.playerStats.singularityState === "storing") {
            window.playerStats.singularityStoredDmg += riposteDmg;
            window.effects.push({
              x: window.mob.x + window.mob.w / 2,
              y: window.mob.y - 10,
              text: `+${window.formatNumber(riposteDmg)} [STORED]`,
              color: "#8e44ad",
              life: 45,
            });
          } else if (window.mob && window.mob.hp.gt(0)) {
            window.mob.hp = window.mob.hp.sub(riposteDmg);
            window.mob.flashTimer = 5; // Flashes the monster on counter-attack connection!
            window.spawnDamageEffect(riposteDmg, "parry_counter", false);
            window.damageHistory.push({
              time: Date.now(),
              amount: riposteDmg,
            });

            // Apply Poison Tip (Dagger-specific parry card) bleed stacks
            if (p.crucibleDaggerBleed && window.mob && window.mob.hp.gt(0)) {
              window.mob.bleedStacks = Math.min(
                5,
                (window.mob.bleedStacks || 0) + p.crucibleDaggerBleed,
              );
              window.mob.bleedTimer = 300;
              window.mob.bleedDmgPerSecond = Math.max(
                1,
                Math.ceil(p.atk * 0.15),
              );
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

          if (window.checkArtifactTrait("dodge_buff")) {
            let ext = window.checkArtifactTrait("extend_buffs")
              ? 180 + window.getArtifactTemperLevel("extend_buffs") * 30
              : 0;
            window.playerStats.adrenalineTimer = 360 + ext; // 6s base + extension
          }

          if (window.mob && window.mob.hp <= 0) {
            window.handleMobDeath();
            return;
          }
        } else {
          window.playerStats.consecutiveParries = 0;
        }

        if (p.arcaneBarrier && subType === "tome") {
          let absorbed = Math.ceil(netDamage * p.arcaneBarrier);
          netDamage = Math.max(1, netDamage - absorbed);
          window.effects.push({
            type: "barrier",
            x: window.hero.x - 5,
            y: window.hero.y - 18,
            amount: Math.round(p.arcaneBarrier * 100),
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
          window.hasUniquePassive("helmet_tempest") &&
          window.mob &&
          window.mob.hp.gt(0)
        ) {
          if (window.playerStats.tempestCooldown === undefined)
            window.playerStats.tempestCooldown = 0;
          if (window.playerStats.tempestCooldown <= 0) {
            window.playerStats.tempestCooldown = 60;
            if (Math.random() < 0.15) {
              let boltDmg = Math.ceil(p.atk * 1.5 * (1.0 + p.int * 0.002));
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
                window.mob.hp = window.mob.hp.sub(boltDmg);
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
                  x: window.mob.x + window.mob.w / 2 + window.randFloat(-5, 5),
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
            let T = window.getArtifactTemperLevel("second_wind");
            let healPct = 0.4 + T * 0.05; // 40% base + 5% per level (max 70%)
            window.playerStats.currentHp = Math.floor(p.maxHp * healPct);
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

            window.playerStats.killedByMob = { ...window.mob };
            window.playerStats.currentHp = 0;
            window.deathAnimationTimer = window.deathMaxFrames;
            return;
          }
        }
      }
      window.updateUI();
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
    window.hasUniquePassive("weapon_maelstrom") &&
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
  if (!window.mob || window.mob.hp.lte(0)) {
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

  window.mob.hp = window.mob.hp.sub(totalFlurryDmg);
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
  triggerPlayerSlash(isManual = false) {
    if (window.isGamePaused) return;
    let p = window.resolvePlayerStats();
    let cooldownCap =
      window.playerStats.frenzyTimer > 0 ? 4 : p.activeAttackSpeed;

    // Manual Click Cooldown Acceleration:
    // Physical tapping actively reduces the remaining cooldown, giving active players
    // an early-game advantage over lazy holding.
    if (isManual && window.hero.attackTimer > 0) {
      let reduction = Math.max(2, Math.round(cooldownCap * 0.25));
      window.hero.attackTimer = Math.max(
        0,
        window.hero.attackTimer - reduction,
      );

      if (window.hero.attackTimer > 0) {
        // Spawn subtle wind swipe particles around the hero to indicate active acceleration
        for (let i = 0; i < 3; i++) {
          window.particles.push({
            x: window.hero.x + 25,
            y: window.hero.y + 15 + window.randFloat(-10, 10),
            vx: window.randFloat(2, 4),
            vy: window.randFloat(-1, 1),
            radius: window.randFloat(1, 2),
            color: "rgba(255, 255, 255, 0.45)",
            alpha: 1,
            life: 15,
          });
        }
        return;
      }
    }

    if (window.hero.attackTimer > 0) return;

    // Anti-Cheese Check: Apply Static Feedback debuff on any active attack (including held inputs)
    let isActivelyAttacking = window.spacePressed || window.isCanvasPressed;
    if (isActivelyAttacking) {
      // Dungeon Mode check
      if (
        window.playerStats.isDungeonMode &&
        window.playerStats.activeDungeonSigil?.debuffs.some(
          (d) => d.id === "static_feedback",
        )
      ) {
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
      // Crucible Mode check
      if (
        window.playerStats.isCrucibleMode &&
        window.playerStats.crucibleActiveDebuff?.id === "static_feedback"
      ) {
        let debuffStrength =
          window.playerStats.crucibleInfusedType === "debuff" ? 1.5 : 1.0;
        let reduction =
          window.playerStats.crucibleSelfDmgReduction !== undefined
            ? window.playerStats.crucibleSelfDmgReduction
            : 1.0;
        let selfDmg = Math.ceil(p.maxHp * (0.02 * debuffStrength * reduction));
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
    }

    window.SoundManager.play("swing");
    window.hero.attackTimer = cooldownCap;

    if (window.hasUniquePassive("weapon_staff")) {
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

        // --- WARLORD SET: SHATTERING BLOWS ---
        if (
          p.hasShatterSet &&
          Math.random() < 0.25 &&
          window.mob &&
          window.mob.hp.gt(0)
        ) {
          let shatterDmg = Math.ceil(finalDamage * 0.5); // 50% of Crit Damage
          // Bypasses enemy defense (Armor Pierce / unblockable)
          window.mob.hp = window.mob.hp.sub(shatterDmg);
          window.mob.flashTimer = 4;
          window.spawnDamageEffect(shatterDmg, "lightning", true); // Trigger unblockable lightning/shatter spark
          window.effects.push({
            x: window.mob.x + window.mob.w / 2 - 20,
            y: window.mob.y - 15,
            text: "💥 SHATTER!",
            color: "#e67e22",
            life: 45,
          });
          for (let i = 0; i < 8; i++) {
            window.particles.push({
              x: window.mob.x + window.mob.w / 2,
              y: window.mob.y + window.mob.h / 2,
              vx: window.randFloat(-4, 4),
              vy: window.randFloat(-4, 4),
              radius: window.randFloat(1, 2.5),
              color: "#e67e22",
              alpha: 1,
              life: window.randInt(15, 25),
            });
          }
        }
      }

      // --- BIOHAZARD SET: CORROSIVE SPORES ---
      if (
        p.hasCorrosiveSet &&
        Math.random() < 0.2 &&
        window.mob &&
        window.mob.hp.gt(0)
      ) {
        window.mob.poisonStacks = Math.min(
          5,
          (window.mob.poisonStacks || 0) + 1,
        );
        window.mob.poisonTimer = 300; // 5-second duration
        window.mob.poisonDmgPerSecond = Math.max(1, Math.ceil(p.atk * 0.12)); // 12% Attack power per stack per second
        for (let i = 0; i < 5; i++) {
          window.particles.push({
            x: window.mob.x + window.mob.w / 2,
            y: window.mob.y + window.mob.h / 2,
            vx: window.randFloat(-2, 2),
            vy: window.randFloat(-2, 2),
            radius: window.randFloat(1, 2),
            color: "#2ecc71",
            alpha: 1,
            life: window.randInt(10, 20),
          });
        }
        window.effects.push({
          x: window.mob.x + window.mob.w / 2 - 25,
          y: window.mob.y - 15,
          text: `🧪 SPORES! [${window.mob.poisonStacks}/5]`,
          color: "#2ecc71",
          life: 35,
        });
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
          let b = window.playerStats.crucibleActiveBuff;
          let d = window.playerStats.crucibleActiveDebuff;
          let isBuffInfused = window.playerStats.crucibleInfusedType === "buff";
          let isDebuffInfused =
            window.playerStats.crucibleInfusedType === "debuff";

          let buffStrength = isBuffInfused ? 1.5 : 1.0;
          let debuffStrength = isDebuffInfused ? 1.5 : 1.0;

          let healAmt = Math.ceil(p.maxHp * (0.02 * buffStrength));
          window.playerStats.currentHp = Math.min(
            p.maxHp,
            window.playerStats.currentHp + healAmt,
          );
          window.effects.push({
            type: "regen",
            x: window.hero.x - 20,
            y: window.hero.y - 15,
            amount: healAmt,
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
          let reduction =
            window.playerStats.crucibleSelfDmgReduction !== undefined
              ? window.playerStats.crucibleSelfDmgReduction
              : 1.0;
          let selfDmg = Math.ceil(
            p.maxHp * (0.05 * debuffStrength * reduction),
          );
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
        window.mob.hp = window.mob.hp.sub(finalDamage);
        window.mob.flashTimer = 5;
        window.spawnDamageEffect(finalDamage, "slash", isCrit);
        window.damageHistory.push({ time: Date.now(), amount: finalDamage });
      }

      // Rogue-lite: Claim active in-run card triggers
      if (window.playerStats.isCrucibleMode) {
        // 1. Sanguine Tide Critical strike heal siphon
        if (isCrit && p.crucibleCritHeal) {
          let healAmt = Math.ceil(p.maxHp * p.crucibleCritHeal);
          window.playerStats.currentHp = Math.min(
            p.maxHp,
            window.playerStats.currentHp + healAmt,
          );
          window.effects.push({
            type: "regen",
            x: window.hero.x - 20,
            y: window.hero.y - 15,
            amount: healAmt,
            color: "#2ecc71",
            life: 30,
          });
        }
        // 2. Phantom Echo secondary phantom hits
        if (p.crucibleEchoChance && Math.random() < p.crucibleEchoChance) {
          let echoDmg = Math.max(1, Math.ceil(finalDamage * 0.35));
          window.mob.hp = window.mob.hp.sub(echoDmg);
          window.spawnDamageEffect(echoDmg, "echo", false);
          window.damageHistory.push({ time: Date.now(), amount: echoDmg });
        }
      }

      // UNIQUE: Maelstrom Glaive Wind Crescent projectile on critical hit and Resonance trigger
      if (
        window.hasUniquePassive("weapon_maelstrom") &&
        isCrit &&
        window.mob &&
        window.mob.hp.gt(0)
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
      if (window.hasUniquePassive("weapon_sword")) {
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

          window.mob.hp = window.mob.hp.sub(ruptureDmg);
          window.mob.flashTimer = 8;

          window.effects.push({
            x: window.mob.x,
            y: window.mob.y - 20,
            text: "💥 RUPTURE!",
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

      // Offhand Dagger Multi-Strike (Noun-varying trigger chance and damage scale)
      const hasDagger =
        window.equippedSlots.subweapon &&
        window.equippedSlots.subweapon.subType === "dagger";
      if (hasDagger) {
        let sub = window.equippedSlots.subweapon;
        let noun = sub && sub.noun ? sub.noun.toLowerCase() : "";
        let offhandChance = 1.0;
        let offhandDmgMult = 0.35;

        if (noun.includes("kris") || noun.includes("dirk")) {
          offhandChance = 0.25 + p.dex * 0.0005; // 25% base + 0.05% per DEX
          offhandChance = Math.min(0.75, offhandChance);
          offhandDmgMult = 0.55;
        } else if (noun.includes("stiletto") || noun.includes("baselard")) {
          offhandChance = 0.6 + p.dex * 0.0005; // 60% base + 0.05% per DEX
          offhandChance = Math.min(0.95, offhandChance);
          offhandDmgMult = 0.25;
        } else {
          offhandChance = 0.4 + p.dex * 0.0005; // 40% base + 0.05% per DEX
          offhandChance = Math.min(0.85, offhandChance);
          offhandDmgMult = 0.35;
        }

        if (Math.random() < offhandChance) {
          let baseDagger = p.atk * offhandDmgMult * (1.0 + p.dex * 0.002);
          if (window.playerStats.adrenalineTimer > 0) baseDagger *= 2;
          let daggerDmg = Math.max(1, Math.ceil(baseDagger));

          let isDaggerCrit = Math.random() < p.critChance;
          if (isDaggerCrit) daggerDmg = Math.ceil(daggerDmg * p.critDamage);

          // Apply active defense mitigation to offhand dagger strikes
          let mobDef = window.mob.def || 0;
          daggerDmg = Math.max(
            1,
            Math.ceil(daggerDmg * (100 / (100 + mobDef))),
          );

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
            window.mob.hp = window.mob.hp.sub(daggerDmg);
            window.spawnDamageEffect(daggerDmg, "dagger", isDaggerCrit);
            window.damageHistory.push({ time: Date.now(), amount: daggerDmg });
          }
        }
      }

      // Elemental Tome Spells (Noun-varying trigger chance and damage scale)
      const hasTome =
        window.equippedSlots.subweapon &&
        window.equippedSlots.subweapon.subType === "tome";
      if (hasTome) {
        let sub = window.equippedSlots.subweapon;
        let noun = sub && sub.noun ? sub.noun.toLowerCase() : "";
        let spellChance = 0.15;
        let spellDmgMult = 1.0;

        if (sub.isUniqueWatch) {
          spellChance = 0.2;
          spellDmgMult = 1.0;
        } else if (sub.isUniqueChronicle) {
          spellChance = 0.15;
          spellDmgMult = 1.2;
        } else if (noun.includes("grimoire") || noun.includes("chronicle")) {
          spellChance = 0.1 + p.int * 0.00015; // 10% base + 0.015% per INT
          spellChance = Math.min(0.3, spellChance);
          spellDmgMult = 1.8;
        } else if (noun.includes("spellbook") || noun.includes("codex")) {
          spellChance = 0.18 + p.int * 0.00015; // 18% base + 0.015% per INT
          spellChance = Math.min(0.35, spellChance);
          spellDmgMult = 1.0;
        } else if (noun.includes("lexicon")) {
          spellChance = 0.26 + p.int * 0.00015; // 26% base + 0.015% per INT
          spellChance = Math.min(0.45, spellChance);
          spellDmgMult = 0.6;
        }

        spellChance += p.crucibleSpellChanceBonus || 0.0;

        let baseSpell = p.atk * 0.25 * (1.0 + p.int * 0.01) * spellDmgMult;
        if (window.playerStats.adrenalineTimer > 0) baseSpell *= 2;
        let spellDmgBase = Math.max(1, Math.ceil(baseSpell));

        let triggeredSpell = false;
        let lightProc = false,
          fireProc = false,
          frostProc = false;

        // 1. Lightning Spell Roll
        if (Math.random() < spellChance) {
          lightProc = true;
          triggeredSpell = true;
          let lightningDmg = spellDmgBase;
          let isSpellCrit = Math.random() < p.critChance;
          if (isSpellCrit)
            lightningDmg = Math.ceil(lightningDmg * p.critDamage);

          // Apply active defense mitigation to lightning spells
          let mobDef = window.mob.def || 0;
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
            window.mob.hp = window.mob.hp.sub(lightningDmg);
            window.spawnDamageEffect(lightningDmg, "lightning", isSpellCrit);
            window.damageHistory.push({
              time: Date.now(),
              amount: lightningDmg,
            });
            window.SoundManager.play("spell_lightning");
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
        if (Math.random() < spellChance) {
          fireProc = true;
          triggeredSpell = true;
          let fireDmg = spellDmgBase;
          let isSpellCrit = Math.random() < p.critChance;
          if (isSpellCrit) fireDmg = Math.ceil(fireDmg * p.critDamage);

          // Apply active defense mitigation to fire spells
          let mobDef = window.mob.def || 0;
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
            window.mob.hp = window.mob.hp.sub(fireDmg);
            window.spawnDamageEffect(fireDmg, "fire", isSpellCrit);
            window.damageHistory.push({ time: Date.now(), amount: fireDmg });
            window.SoundManager.play("spell_fire");
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
        if (Math.random() < spellChance) {
          frostProc = true;
          triggeredSpell = true;
          let frostDmg = spellDmgBase;
          let isSpellCrit = Math.random() < p.critChance;
          if (isSpellCrit) frostDmg = Math.ceil(frostDmg * p.critDamage);

          // Apply active defense mitigation to frost spells
          let mobDef = window.mob.def || 0;
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
            window.mob.hp = window.mob.hp.sub(frostDmg);
            window.spawnDamageEffect(frostDmg, "frost", isSpellCrit);
            window.damageHistory.push({ time: Date.now(), amount: frostDmg });
            window.SoundManager.play("spell_frost");
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
          if (lightProc && fireProc && frostProc) {
            window.playerStats.hasTriggeredElementalConvergence = true;
          }
        }
      }

      if (window.checkArtifactTrait("echo_strike") && Math.random() < 0.3) {
        let T = window.getArtifactTemperLevel("echo_strike");
        let mult = 0.25 + T * 0.05; // 25% base + 5% per level (max 55%)
        let echoDmg = Math.max(1, Math.ceil(finalDamage * mult));
        window.mob.hp = window.mob.hp.sub(echoDmg);
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

        let T = window.getArtifactTemperLevel("vampirism");
        let healPct = 0.005 + T * 0.001; // 0.5% base + 0.1% per level (max 1.1%)
        let capPct = 0.03 + T * 0.005; // 3% base + 0.5% Max HP/sec per level (max 6%)

        // Restrict healing from Vampirism to a global ceiling of Max HP per second
        let maxHealSec = p.maxHp * capPct;
        let allowedHeal = Math.max(0, maxHealSec - totalRecentHealed);

        let rawHeal = Math.max(1, Math.floor(finalDamage * healPct));
        let heal = Math.min(allowedHeal, rawHeal);

        if (heal > 0) {
          window.playerStats.currentHp = Math.min(
            p.maxHp,
            window.playerStats.currentHp + heal,
          );
          window.playerStats.recentHeals.push({ time: now, amount: heal });
          window.effects.push({
            type: "regen",
            x: window.hero.x - 25,
            y: window.hero.y - 10,
            amount: heal,
            color: "#2ecc71",
            life: 60,
          });
        }
      }
      if (typeof window.updateUI === "function") window.updateUI();
      if (window.mob.hp.lte(0)) {
        if (typeof window.handleMobDeath === "function")
          window.handleMobDeath();
      }
    }
  },

  handleMobDeath() {
    window.effects.forEach((e) => {
      if (e.isCumulative) e.life = 0;
    });
    window.effects = window.effects.filter((e) => !e.isCumulative);
    let p = window.resolvePlayerStats();

    // Trigger time-based and environmental achievements on active mob slay
    let hr = new Date().getHours();
    let day = new Date().getDay();

    if (hr >= 0 && hr < 4) {
      window.playerStats.hasTriggeredNightOwl = true;
    }
    if (hr >= 5 && hr < 8) {
      window.playerStats.hasTriggeredEarlyBird = true;
    }
    if (
      (day === 0 || day === 6) &&
      (window.playerStats.isDungeonMode || window.playerStats.isCrucibleMode)
    ) {
      window.playerStats.hasTriggeredWeekendWarrior = true;
    }

    // Universal Overkill Splash / Stage-Skip Mechanic (Now available in Dungeons!)
        if (
          window.mob &&
          window.mob.hp.lt(0) &&
          !window.playerStats.isCrucibleMode &&
          !window.playerStats.isBossMode &&
          !window.playerStats.isFarmingLoop &&
          window.playerStats.stage < window.playerStats.maxStage
        ) {
      let b_absHp = new BigNum(Math.abs(window.mob.hp.m), window.mob.hp.e);
      let b_maxHp = BigNum.from(window.mob.maxHp);
      let ratioNum = b_absHp.div(b_maxHp);
      let overkillRatio = Number(
        ratioNum.m * Math.pow(10, Math.min(15, ratioNum.e)),
      );
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

    // Phoenix Rising: Slay any boss while sitting at or below 1% of Max HP!
    if (
      isBoss &&
      window.playerStats.currentHp > 0 &&
      window.playerStats.currentHp / p.maxHp <= 0.01
    ) {
      window.playerStats.hasTriggeredPhoenixRising = true;
    }

    // UNIQUE: Warp-Core Greaves "Time Dilation" Boss Kill Max Haste trigger
    if (
      isBoss &&
      window.hasUniquePassive("boots_warpcore") &&
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

    // Trigger potion drop rolls (Campaign & Dungeons only)
    if (
      typeof window.rollPotionDrop === "function" &&
      !window.playerStats.isCrucibleMode
    ) {
      window.rollPotionDrop(isBoss, window.mob && window.mob.isRare);
    }

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

    // Highly restricted Monster Card Sack drop rolls
    let cardSackChance = 0;
    if (
      window.playerStats.isDungeonMode &&
      window.mob.type === "dungeon_boss"
    ) {
      cardSackChance = 0.03;
    } else if (window.playerStats.isUberBoss) {
      cardSackChance = 0.08;
    } else if (window.mob.type === "boss") {
      cardSackChance = 0.01; // Increased to 1.0% to match player pacing expectations
    }

    if (cardSackChance > 0 && Math.random() < cardSackChance) {
      window.addUseDrop("Monster Card Sack", 1);
      window.effects.push({
        x: window.mob.x + window.mob.w / 2,
        y: window.mob.y + 10,
        text: "🃏 CARD BOOSTER PACK!",
        color: "#a855f7",
        life: 60,
      });
      if (typeof window.pushLog === "function") {
        window.pushLog(
          `<strong style="color:#a855f7;">[DROP]</strong> Discovered an elite <span style="color:#a855f7;">Monster Card Sack</span> booster pack!`,
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
      let T = window.getArtifactTemperLevel("void_pull");
      let healPct = 0.2 + T * 0.02; // 20% base + 2% per level (max 32%)
      let healAmount = Math.ceil(p.maxHp * healPct);
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
      let cWave = window.playerStats.crucibleWave || 1;
      let peak = window.playerStats.lifetimePeakStage || 1;
      let startingStageOffset = Math.max(1, Math.floor(peak * 0.75));
      scaleVal = startingStageOffset + cWave - 1;
    }
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

    let baseCoin = isBoss
      ? Math.floor(15 * expScale)
      : Math.floor(2 * expScale);
    if (window.playerStats.isCrucibleMode) {
      // Scale standard currency values up smoothly for post-run claim
      baseCoin = Math.floor(10 * expScale);
    }

    if (
      window.playerStats.isDungeonMode &&
      window.playerStats.currentDungeon === "gold"
    ) {
      let goldFloor = window.playerStats.currentDungeonStage["gold"] || 1;
      let dungeonMult = 10.0 + goldFloor / 5.0;
      baseCoin *= dungeonMult;
      if (window.mob.type === "dungeon_boss") baseCoin *= 5.0;
    }
    if (window.mob.isRare) baseCoin *= 4;

    // Natively multiplied through p.gold in resolvePlayerStats
    let coinYield = Math.ceil(baseCoin * p.gold);

    // REDIRECT AND ACCUMULATE INSIDE CRUCIBLE POOLS (XP IS STILL IMMEDIATE, GOLD IS DEFERRED TO PARTICLE ABSORPTION)
    if (window.playerStats.isCrucibleMode) {
      window.playerStats.crucibleAccumulatedXp =
        (window.playerStats.crucibleAccumulatedXp || 0) + xpYield;
    } else {
      if (window.playerStats.isDungeonMode) {
        window.playerStats.dungeonAccumulatedXp =
          (window.playerStats.dungeonAccumulatedXp || 0) + xpYield;
      }
      if (typeof window.gainXp === "function") window.gainXp(xpYield);
    }

    // Peak single gold drop check
    window.playerStats.peakSingleGoldDrop = Math.max(
      window.playerStats.peakSingleGoldDrop || 0,
      coinYield,
    );

    if (typeof window.spawnDeathParticles === "function") {
      window.spawnDeathParticles(
        window.mob.x + window.mob.w / 2,
        window.mob.y + window.mob.h / 2,
        window.mob.type,
      );
    }

    // Only render campaign coin visual splashes outside the Crucible
    if (coinYield > 0 && !window.playerStats.isCrucibleMode) {
      window.effects.push({
        x: window.mob.x + 35,
        y: window.mob.y + 25,
        text: "+" + coinYield.toLocaleString() + "g",
        color: "#f1c40f",
        life: 50,
      });
    }

    // Spawn homing gold coin particles to fly to top-right HUD panel (Larger bursts on Bosses)
    if (coinYield > 0 && window.goldParticles && window.mob) {
      let startX = window.mob.x + window.mob.w / 2;
      let startY = window.mob.y + window.mob.h / 2;
      let isBossType = [
        "boss",
        "dungeon_boss",
        "prestige_boss",
        "rift_guardian",
        "aegis_goliath",
        "chronos_arbitrator",
        "nexus_overseer",
      ].includes(window.mob.type);

      let particleCount = isBossType
        ? Math.min(
            30,
            Math.max(16, Math.floor(Math.log10(coinYield + 1) * 6.5)),
          )
        : Math.min(12, Math.max(4, Math.floor(Math.log10(coinYield + 1) * 3)));

      let baseAmt = Math.floor(coinYield / particleCount);
      let remainder = coinYield % particleCount;

      for (let i = 0; i < particleCount; i++) {
        let pAmt = baseAmt + (i < remainder ? 1 : 0);
        window.goldParticles.push({
          x: startX,
          y: startY,
          vx: window.randFloat(-4, 4),
          vy: window.randFloat(-7, -3),
          life: 120,
          delay: i * 2, // Staggered delays create a beautiful serpent-style stream
          amount: pAmt,
          isDungeon: window.playerStats.isDungeonMode,
          isCrucible: window.playerStats.isCrucibleMode,
        });
      }
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
            type: isBlocked ? "block" : "parry",
            x: window.hero.x - 5,
            y: window.hero.y - 20,
            color: isBlocked ? "#3498db" : "#9b59b6",
            life: 45,
          });
          window.SoundManager.play(isBlocked ? "block" : "parry");
        } else {
          let reduction =
            window.playerStats.crucibleSelfDmgReduction !== undefined
              ? window.playerStats.crucibleSelfDmgReduction
              : 1.0;
          let dmg = Math.ceil(p.maxHp * (0.18 * debuffStrength * reduction));
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

        let oldWave = window.playerStats.crucibleWave || 1;
        window.playerStats.crucibleWave++;

        // Dynamically roll a debuff on every 10th wave; normal waves have no active cavern buff
        let nextWave = window.playerStats.crucibleWave;
        let isDebuff = nextWave % 10 === 0;

        if (isDebuff) {
          window.playerStats.crucibleActiveDebuff =
            window.CAVERN_DEBUFFS[
              Math.floor(Math.random() * window.CAVERN_DEBUFFS.length)
            ];
          window.playerStats.crucibleActiveBuff = null;
          let debuff = window.playerStats.crucibleActiveDebuff;
          let titleText = debuff ? debuff.name : "Anomaly";
          let descText = debuff ? debuff.desc : "";

          // Trigger Elegant On-Screen Cinematic Wave Splash ONLY on debuff waves
          window.crucibleTransitionSplash = {
            title: `WAVE ${nextWave}: ${titleText.toUpperCase()}`,
            sub: descText,
            color: "#e74c3c",
            timer: 150,
            maxTimer: 150,
          };
        } else {
          window.playerStats.crucibleActiveBuff = null;
          window.playerStats.crucibleActiveDebuff = null;
          window.crucibleTransitionSplash = null;
        }

        window.playerStats.crucibleWavesClearedThisRun =
          (window.playerStats.crucibleWavesClearedThisRun || 0) + 1;
        window.playerStats.cruciblePeak = Math.max(
          window.playerStats.cruciblePeak || 1,
          window.playerStats.crucibleWave,
        );
        window.playerStats.killCount = 0;

        // Reward 1x Card Sack every 50 waves in the Crucible
        if (oldWave > 0 && oldWave % 50 === 0) {
          window.addUseDrop("Monster Card Sack", 1);
          if (typeof window.pushLog === "function") {
            window.pushLog(
              `<strong style="color:#a855f7;">[CRUCIBLE MILESTONE]</strong> Wave ${oldWave} reached! Awarded 1x <span style="color:#a855f7;">Monster Card Sack</span>!`,
            );
          }
        }
        if (typeof window.pushLog === "function")
          window.pushLog(
            `<span style='color:#9b59b6; font-weight:bold;'>[CRUCIBLE] Advanced to Wave ${window.playerStats.crucibleWave}! (+${finalShards} Shards, +${finalCores} Cores accumulated)</span>`,
          );

        // TRIGGER ROGUE-LITE INFUSION CARD DRAFT (Every 5 waves cleared relative to current start wave)
        if (
          window.playerStats.crucibleWavesClearedThisRun > 0 &&
          window.playerStats.crucibleWavesClearedThisRun % 5 === 0
        ) {
          setTimeout(() => {
            if (typeof window.openCrucibleMidRunDraftModal === "function") {
              window.openCrucibleMidRunDraftModal();
            }
          }, 150);
        }
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
          // Guaranteed Equipment Drop for defeating the Floor Boss
          if (typeof window.rollEquipmentDrop === "function") {
            let minStarsRoll = Math.random() < 0.2 ? 1 : 0; // 20% chance to guarantee 1★+ minimum
            window.rollEquipmentDrop(true, false, minStarsRoll, false, true); // isMilestone = true bypasses rng check
          }
          // Balanced unique artifact tempering speed by adjusting Overlord's Sigil rate to 20%
          if (Math.random() < 0.05) {
            if (typeof window.addEtcDrop === "function")
              window.addEtcDrop("Overlord's Sigil", 1);
            if (typeof window.pushToast === "function")
              window.pushToast("Overlord's Sigil", null, "#1abc9c", true, 1);
          }
        } else {
          // Let the single-roll loot and Pity system handle minion kills cleanly
          if (typeof window.rollEquipmentDrop === "function") {
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

          // Active Dungeon Boss Soul Jackpot scaling with depth, drop rate, and sigils (Fixed double-dipping and sub-linearized)
          let baseSouls = 30 + Math.floor(Math.pow(dStage, 0.6) * 6);
          let bossSoulAmt = Math.round(baseSouls * p.drop);
          window.addEtcDrop("Monster Soul", bossSoulAmt);

          if (dStage < 150) {
            if (typeof window.addEtcDrop === "function") {
              let scrapAmt = Math.ceil(window.randInt(1, 3) * sigMult);
              window.addEtcDrop("Rare Scrap", scrapAmt);
            }
          } else if (dStage < 350) {
            if (Math.random() < 0.3) {
              if (typeof window.addEtcDrop === "function") {
                window.addEtcDrop("Magic Scrap", 1);
              }
            } else {
              if (typeof window.addEtcDrop === "function") {
                window.addEtcDrop("Rare Scrap", 1);
              }
            }
          } else if (dStage < 600) {
            let rRoll = Math.random();
            if (rRoll < 0.1) {
              if (typeof window.addEtcDrop === "function") {
                window.addEtcDrop("Legendary Scrap", 1);
              }
            } else if (rRoll < 0.5) {
              if (typeof window.addEtcDrop === "function") {
                window.addEtcDrop("Epic Scrap", 1);
              }
            } else {
              if (typeof window.addEtcDrop === "function") {
                window.addEtcDrop("Magic Scrap", 1);
              }
            }
          } else if (dStage < 850) {
            let rRoll = Math.random();
            if (rRoll < 0.2) {
              if (typeof window.addEtcDrop === "function") {
                window.addEtcDrop("Mythic Scrap", 1);
              }
            } else if (rRoll < 0.6) {
              if (typeof window.addEtcDrop === "function") {
                window.addEtcDrop("Legendary Scrap", 1);
              }
            } else {
              if (typeof window.addEtcDrop === "function") {
                window.addEtcDrop("Epic Scrap", 1);
              }
            }
          } else {
            let yieldAmt = Math.ceil(1 * sigMult);
            if (Math.random() < 0.7) {
              if (typeof window.addEtcDrop === "function") {
                window.addEtcDrop("Mythic Scrap", yieldAmt);
              }
            } else {
              if (typeof window.addEtcDrop === "function") {
                window.addEtcDrop("Legendary Scrap", yieldAmt);
              }
            }
          }
        } else {
          // Normal minion drops inside the Material Pit (Additive Redesign)
          // 1. Every minion kill guarantees scaled Monster Souls multiplying with Magic Find and active Sigils
          let sigMult = 1.0;
          if (
            window.playerStats.isDungeonMode &&
            window.playerStats.activeDungeonSigil
          ) {
            sigMult +=
              window.playerStats.activeDungeonSigil.rewardMultiplier || 0;
          }
          // Fixed double-dipping and sub-linearized minion soul drops
          let baseMinionSouls = 2 + Math.floor(Math.pow(dStage, 0.4));
          let soulAmt = Math.round(baseMinionSouls * p.drop);
          window.addEtcDrop("Monster Soul", soulAmt);
          // 2. Independent, non-exclusive rolls for material scraps
          let r = Math.random();
          if (dStage < 150) {
            // 15% bonus chance for an early-game Rare Scrap
            if (r < 0.15) {
              let scrapAmt = 1 + Math.floor(Math.sqrt(dStage / 150));
              window.addEtcDrop("Rare Scrap", scrapAmt);
            }
          } else if (dStage < 350) {
            // 25% independent chance for Rare Scrap
            if (r < 0.25) {
              let scrapAmt = 1 + Math.floor(Math.sqrt((dStage - 150) / 100));
              window.addEtcDrop("Rare Scrap", scrapAmt);
            }
          } else if (dStage < 600) {
            // 20% Magic, 40% Rare
            if (r < 0.2) {
              let magicAmt = 1 + Math.floor(Math.sqrt((dStage - 350) / 120));
              window.addEtcDrop("Magic Scrap", magicAmt);
            } else if (r < 0.6) {
              let rareAmt = 1 + Math.floor(Math.sqrt((dStage - 150) / 100));
              window.addEtcDrop("Rare Scrap", rareAmt);
            }
          } else if (dStage < 850) {
            // 20% Epic, 40% Magic
            if (r < 0.2) {
              let epicAmt = 1 + Math.floor(Math.sqrt((dStage - 600) / 150));
              window.addEtcDrop("Epic Scrap", epicAmt);
            } else if (r < 0.6) {
              let magicAmt = 1 + Math.floor(Math.sqrt((dStage - 350) / 120));
              window.addEtcDrop("Magic Scrap", magicAmt);
            }
          } else {
            // 20% Legendary, 50% Epic, 30% Magic (ReferenceError crash repaired)
            if (r < 0.2) {
              let legAmt = 1 + Math.floor(Math.sqrt((dStage - 850) / 200));
              window.addEtcDrop("Legendary Scrap", legAmt);
            } else if (r < 0.7) {
              let epicAmt = 1 + Math.floor(Math.sqrt((dStage - 600) / 150));
              window.addEtcDrop("Epic Scrap", epicAmt);
            } else {
              let magicAmt = 1 + Math.floor(Math.sqrt((dStage - 350) / 120));
              window.addEtcDrop("Magic Scrap", magicAmt);
            }
          }
        }
      }
    } else {
      // Let the single-roll loot function evaluate rates and progress pity natively
      if (
        typeof window.rollEquipmentDrop === "function" &&
        !window.playerStats.isCrucibleMode
      ) {
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
    } else if (isBoss) {
      let activeStage = window.playerStats.stage;

      // Overhauled Boss-Scale Monster Soul drop: 30% chance with sub-linear logarithmic & Drop Quality scaling
      if (Math.random() < 0.3) {
        let baseQty = window.randInt(2, 6);
        let scaleMultiplier = 1 + Math.log10(activeStage);
        let finalQty = Math.round(
          baseQty * scaleMultiplier * Math.sqrt(p.qly || 1.0),
        );

        if (typeof window.addEtcDrop === "function") {
          window.addEtcDrop("Monster Soul", finalQty, false); // False triggers the active popup toast
        }
      }

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
      // Dynamic scaled drop rates matching player Drop Rate (p.drop) attributes
      let soulDropChance = window.mob.isRare ? 0.25 : 0.12; // 25% for Rare, 12% for Normal
      if (Math.random() < soulDropChance * p.drop) {
        let etcItemName = window.mob.isRare ? "Luminous Soul" : "Monster Soul";

        let qty = 1;
        if (!window.mob.isRare) {
          // Normal monster drop quantities scale with a square-root curve to prevent late-game hyper-inflation
          qty += Math.floor(Math.sqrt((window.playerStats.stage || 1) / 10));
        }

        if (typeof window.addEtcDrop === "function")
          window.addEtcDrop(etcItemName, qty);
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
          let T_fz = window.getArtifactTemperLevel("frenzy");
          let baseDuration = 300; // 5 seconds in frames
          let ext = window.checkArtifactTrait("extend_buffs")
            ? 180 + window.getArtifactTemperLevel("extend_buffs") * 30
            : 0;

          window.playerStats.frenzyTimer = baseDuration + T_fz * 30 + ext; // +0.5s per level
          window.playerStats.frenzyKillCount = 0;
          if (typeof window.pushLog === "function")
            window.pushLog(
              `<strong style='color:#e67e22;'>[BERSERKER RAGE]</strong> 100% Critical Frenzy Unleashed!`,
            );
        }
      }
    }

    if (window.playerStats.isDungeonMode) {
      // VAMPIRIC CHECKPOINT: Heal 20% Max HP on Boss kill
      if (window.mob.type === "dungeon_boss") {
        let p = window.resolvePlayerStats();
        let healAmount = Math.floor(p.maxHp * 0.2);
        window.playerStats.currentHp = Math.min(
          p.maxHp,
          window.playerStats.currentHp + healAmount,
        );
        window.effects.push({
          type: "regen",
          x: window.hero.x,
          y: window.hero.y - 20,
          amount: healAmount,
          color: "#2ecc71",
          life: 60,
        });
        if (window.SoundManager) window.SoundManager.play("revive");
      }

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
            type: isBlocked ? "block" : "parry",
            x: window.hero.x - 5,
            y: window.hero.y - 20,
            color: isBlocked ? "#3498db" : "#9b59b6",
            life: 45,
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

        // First-Time 25-Stage Milestone Key Allocation
        let currentMax = window.playerStats.maxStage;
        let old25s = Math.floor(oldMax / 25);
        let new25s = Math.floor(currentMax / 25);
        if (new25s > old25s && currentMax > oldPeak) {
          let keysEarned = new25s - old25s;
          window.addEtcDrop("Gacha Key", keysEarned);
          if (typeof window.pushLog === "function") {
            window.pushLog(
              `<strong style="color:#f1c40f;">🏆 [MILESTONE] Reached Stage ${currentMax}! Awarded ${keysEarned}x Gacha Key(s)!</strong>`,
            );
          }
          if (typeof window.pushHeaderToast === "function") {
            window.pushHeaderToast(
              `🏆 Milestone! Reached Stage ${currentMax}! (+${keysEarned} Gacha Key)`,
              "#f1c40f",
            );
          }
          if (typeof window.spawnPurchaseCelebration === "function") {
            window.spawnPurchaseCelebration("gacha", "#f1c40f", 4);
          }
        }

        // First-time milestone clear reward (Stage 10, 20, 30...)
        // Enforce peak checking to prevent players from farming milestone drops repeatedly after prestiging
        if (
          window.playerStats.maxStage > oldMax &&
          oldMax % 10 === 0 &&
          window.playerStats.maxStage > oldPeak
        ) {
          if (oldMax === 10) {
            // Onboarding: Trigger Sub-weapon of Choice Modal at Stage 10
            setTimeout(() => {
              if (typeof window.openSubweaponOfChoiceModal === "function") {
                window.openSubweaponOfChoiceModal();
              }
            }, 500);
          } else if (oldMax === 20) {
            // Onboarding: Guaranteed Rare (1★) Weapon dropped at Stage 20
            let newItem = window.createItemObject("weapon", 1, 2, 1); // Level 11-20 (StageScale 2)
            window.inventory.EQUIP.push(newItem);
            window.frozenItemDb[newItem.id] =
              window.cloneItemForTooltip(newItem);
            window.pushToast(
              newItem.name,
              newItem.statsRolled,
              window.getTierColor(newItem.statsRolled),
              false,
              1,
              null,
              null,
              true,
              newItem,
            );
            window.pushLog(
              `<strong style="color:#f1c40f;">[MILESTONE] Stage 20 Beaten! Guaranteed Weapon dropped: <span style="color:${window.getTierColor(1)};">${newItem.name}</span></strong>`,
              newItem.id,
            );
            window.renderInventory();
            window.updateUI();
          } else {
            if (typeof window.pushLog === "function")
              window.pushLog(
                `<strong style="color:#f1c40f;">🏆 [MILESTONE] Stage ${oldMax} Beaten! Guaranteed random equip dropped!</strong>`,
              );
            if (typeof window.rollEquipmentDrop === "function")
              window.rollEquipmentDrop(true, false, 0, false, true); // IS MILESTONE = true
          }
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
    // Fixed spawning offset relative to player coordinates guarantees uniform combat pacing across all screen widths
    let spawnX = window.hero.x + 155;

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
      let peak = window.playerStats.lifetimePeakStage || 1;
      let startingStageOffset = Math.max(1, Math.floor(peak * 0.75));
      let effectiveStage = startingStageOffset + cWave - 1;

      // Absolute exponential wave scaling matching standard campaign progression
      let scale = Math.pow(1.045, effectiveStage);

      if (window.playerStats.killCount >= window.playerStats.targetsRequired) {
        let hp = BigNum.from(
          Math.floor(120 * scale * (1 + effectiveStage * 0.06)),
        );
        window.mob = {
          x: spawnX,
          y: 140,
          w: 45,
          h: 75,
          type: "dungeon_boss",
          isCrucible: true,
          isRare: false,
          hp: hp,
          maxHp: hp,
          damage: BigNum.from(Math.floor(15 * scale)),
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

        let hp = BigNum.from(
          Math.floor(25 * scale * (1 + effectiveStage * 0.06)),
        );
        window.mob = {
          x: spawnX,
          y: isFlying ? 145 : 195,
          w: 25,
          h: 30,
          type: "mob",
          visualType: chosenVisual,
          isCrucible: true,
          isRare: false,
          hp: hp,
          maxHp: hp,
          damage: BigNum.from(Math.floor(4.5 * scale)),
          def: 0,
          flashTimer: 0,
          isStopped: false,
          attackCooldown: 90,
          attackTimer: 90,
        };
      }
      return;
    }

    let b_scale;
    if (window.playerStats.isDungeonMode) {
      window.playerStats.currentDungeonStage = window.playerStats
        .currentDungeonStage || { equip: 1, gold: 1, mat: 1 };
      let dStage =
        window.playerStats.currentDungeonStage[
          window.playerStats.currentDungeon
        ] || 1;

      let effStage = window.getEffectiveStage(dStage);
      let baseRate = 1.045 + (effStage * 0.015) / (effStage + 300);
      b_scale = BigNum.from(baseRate)
        .pow(effStage)
        .mul(1 + effStage * 0.05);
    } else {
      let effStage = window.getEffectiveStage(activeStage);
      let growthRate = 1.045 + (effStage * 0.04) / (effStage + 200);
      b_scale = BigNum.from(growthRate).pow(effStage);
    }

    let spawnEdgeX = (window.canvas ? window.canvas.width : 750) + 10; // Dynamic spawn directly at visible screen edge

    if (window.playerStats.isDungeonMode) {
      let hpScale = window.playerStats.currentDungeon === "gold" ? 1.5 : 1;
      let dStage =
        window.playerStats.currentDungeonStage[
          window.playerStats.currentDungeon
        ] || 1;

      if (window.playerStats.killCount >= window.playerStats.targetsRequired) {
        let hp = BigNum.from(100)
          .mul(b_scale)
          .mul(hpScale)
          .mul(1 + dStage * 0.06);
        window.mob = {
          x: spawnEdgeX,
          y: 140,
          w: 50,
          h: 90,
          type: "dungeon_boss",
          isRare: false,
          hp: hp,
          maxHp: hp,
          damage: BigNum.from(20).mul(b_scale),
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
        if (dType === "equip")
          dPool = ["animated_armor", "cursed_blade", "mimic_shield"];
        else if (dType === "gold")
          dPool = ["coin_elemental", "hoard_mimic", "gilded_scuttler"];
        else dPool = ["slag_slime", "rust_nibbler", "corroded_golem"];

        let chosenVisual = dPool[Math.floor(Math.random() * dPool.length)];
        let isFlying = [
          "gargoyle",
          "toxic_fly",
          "marsh_ghost",
          "gilded_wyrmling",
          "wyrmling",
          "animated_armor",
          "cursed_blade",
        ].includes(chosenVisual);

        let hp = BigNum.from(25)
          .mul(b_scale)
          .mul(hpScale)
          .mul(1 + dStage * 0.06);
        window.mob = {
          x: spawnEdgeX,
          y: isFlying ? 150 : 195,
          w: 25,
          h: 40,
          type: "mob",
          visualType: chosenVisual,
          isRare: false,
          hp: hp,
          maxHp: hp,
          damage: BigNum.from(5.2).mul(b_scale),
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
          let b_riftScale = BigNum.from(riftGrowthRate).pow(equivalentStage);

          let hp = BigNum.from(hpMult)
            .mul(100)
            .mul(b_riftScale)
            .mul(1 + equivalentStage * 0.06);
          let dmg = BigNum.from(20).mul(b_riftScale).mul(dmgMult);
          window.mob = {
            x: spawnEdgeX,
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
          let baseBossHp = BigNum.from(120)
            .mul(b_scale)
            .mul(1 + activeStage * 0.06);
          window.mob = {
            x: spawnEdgeX,
            y: 150,
            w: 40,
            h: 80,
            type: "boss",
            isRare: false,
            visualTier: tier,
            hp: baseBossHp,
            maxHp: baseBossHp,
            damage: BigNum.from(20).mul(b_scale),
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

        let hp = BigNum.from(25)
          .mul(b_scale)
          .mul(hpMult)
          .mul(1 + activeStage * 0.06);
        window.mob = {
          x: spawnEdgeX,
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
          damage: BigNum.from(5.2).mul(b_scale).mul(dmgMult),
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
      window.mob.hp = window.mob.hp.sub(cleave);
      window.mob.flashTimer = 5;
      window.spawnDamageEffect(cleave, "echo", false);
      window.effects.push({
        x: window.mob.x,
        y: window.mob.y - 12,
        text: "🌪️ CLEAVED!",
        color: "#2ecc71",
        life: 55,
      });
      if (window.mob.hp.lte(0)) setTimeout(() => window.handleMobDeath(), 50);
    }
  },

  handlePlayerDefeat() {
    window.effects.forEach((e) => {
      if (e.isCumulative) e.life = 0;
    });
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
      let gold = window.playerStats.crucibleAccumulatedGold || 0;
      let xp = window.playerStats.crucibleAccumulatedXp || 0;

      // No defeat penalty; full rewards are preserved!
      let keptShards = shards;
      let keptCores = cores;

      // Gold & XP are always kept at 100% since those targets were successfully slayed!
      window.playerStats.coins = BigNum.from(window.playerStats.coins).add(
        gold,
      );
      window.playerStats.totalGoldEarned = BigNum.from(
        window.playerStats.totalGoldEarned || 0,
      ).add(gold);
      window.gainXp(xp, true);

      window.playerStats.astralShards =
        (window.playerStats.astralShards || 0) + keptShards;
      if (keptCores > 0) {
        window.addEtcDrop("Catalyst Core", keptCores);
      }

      // Reset temporary run fields
      window.playerStats.crucibleAccumulatedShards = 0;
      window.playerStats.crucibleAccumulatedCores = 0;
      window.playerStats.crucibleAccumulatedGold = 0;
      window.playerStats.crucibleAccumulatedXp = 0;
      window.playerStats.crucibleDraftDeck = [];
      window.playerStats.crucibleRunActive = false;

      window.showCrucibleSummaryModal(
        finalWave,
        keptShards,
        keptCores,
        gold,
        xp,
        true,
      ); // Died
      return;
    }

    if (wasDungeon) {
      let gold = window.playerStats.dungeonAccumulatedGold || 0;
      let xp = window.playerStats.dungeonAccumulatedXp || 0;
      let loot = window.playerStats.dungeonAccumulatedLoot || [];

      window.playerStats.dungeonAccumulatedGold = 0;
      window.playerStats.dungeonAccumulatedXp = 0;
      window.playerStats.dungeonAccumulatedLoot = [];

      // Trigger the gorgeous summary modal!
      if (typeof window.showDungeonSummaryModal === "function") {
        window.showDungeonSummaryModal(
          activeDungeon,
          dungeonFloor,
          gold,
          xp,
          loot,
          false,
        );
      }

      window.playerStats.runKills = 0;
      window.playerStats.runGold = 0;
      window.playerStats.runXp = 0;
      window.playerStats.killedBy = "Unknown Foe";
      window.playerStats.killedByMob = null;

      if (typeof window.updateUI === "function") window.updateUI();
      if (typeof window.renderInventory === "function")
        window.renderInventory();
      if (typeof window.saveGame === "function") window.saveGame();
      return;
    }

    let prestigeCount = window.playerStats.prestigeCount || 0;
    let rollbackPercent = 0.8;
    if (prestigeCount >= 1)
      rollbackPercent = Math.min(0.95, 0.9 + (prestigeCount - 1) * 0.01);

    let restartStage;
    const peakEl = document.getElementById("death-stat-peak");
    const retreatEl = document.getElementById("death-stat-retreat");
    const killsEl = document.getElementById("death-stat-kills");
    const goldEl = document.getElementById("death-stat-run-gold");
    const xpEl = document.getElementById("death-stat-run-xp");
    const tipEl = document.getElementById("death-tip-text");

    if (wasDungeon) {
      restartStage = window.playerStats.stage;
      let dNames = {
        equip: "Equipment Dungeon",
        gold: "Gold Mine",
        mat: "Material Cavern",
      };
      let dName = dNames[activeDungeon] || "Dungeon";
      if (peakEl) peakEl.innerText = `${dName} Floor ${dungeonFloor}`;
      if (retreatEl) retreatEl.innerText = `Campaign Stage ${restartStage}`;
    } else {
            // Campaign only rollback condition (Dungeons, Crucible, Altar Uber Bosses, and Prestige Bosses bypass rollback)
            let isOutsideCampaign = wasUber || wasPrestige || wasCrucible;
            if (isOutsideCampaign) {
              restartStage = window.playerStats.stage;
              if (peakEl)
                peakEl.innerText = wasUber ? "Rift Guardian" : "Prestige Boss";
              if (retreatEl) retreatEl.innerText = `Campaign Stage ${restartStage}`;
            } else {
              // Standard campaign death (mobs or stage bosses) -> No rollback, stay on current stage
              restartStage = window.playerStats.stage;
              window.playerStats.stage = restartStage;
              if (peakEl)
                peakEl.innerText = `Stage ${window.playerStats.maxStage || 1}`;
              if (retreatEl) retreatEl.innerText = `Stage ${restartStage}`;
            }
          }

    if (killsEl)
      killsEl.innerText = window.formatNumber(window.playerStats.runKills || 0);
    if (goldEl)
      goldEl.innerText =
        `+` + window.formatNumber(window.playerStats.runGold || 0);
    if (xpEl)
      xpEl.innerText = `+` + window.formatNumber(window.playerStats.runXp || 0);
    if (tipEl) {
      tipEl.innerText =
        "Reforging modifiers with Catalyst Cores and tempering weapon components significantly increases battle survivability.";
    }

    // Update Nemesis name & specific battle loop damage metrics
    const nemesisEl = document.getElementById("death-stat-nemesis");
    const dmgTakenEl = document.getElementById("death-stat-dmg-taken");
    if (nemesisEl) {
      nemesisEl.innerText = window.playerStats.killedBy || "Unknown Foe";
    }
    if (dmgTakenEl) {
      dmgTakenEl.innerText = window.formatNumber(
        window.playerStats.damageTakenThisBattle || 0,
      );
    }

    // Compile and render tactical actionable advice for unspent points, empty gear, or low defense values
    const alertsEl = document.getElementById("death-alerts-container");
    const tipContainerEl = document.getElementById("death-tip-container");

    if (alertsEl) {
      let adviceText = "";
      let buttonText = "";
      let actionCode = "";
      let accentColor = "#a855f7"; // Sleek purple default

      let unallocatedSp = window.playerStats.sp || 0;
      let missingEquipSlots = [];
      const keySlots = ["weapon", "subweapon", "helmet", "boots"];
      keySlots.forEach((slotKey) => {
        if (!window.equippedSlots[slotKey]) {
          missingEquipSlots.push(slotKey.toUpperCase());
        }
      });

      // Smart Body Armor Checks (Chestplate + Leggings OR Overall)
      if (!window.equippedSlots.overall) {
        if (!window.equippedSlots.chest) {
          missingEquipSlots.push("CHESTPLATE");
        }
        if (!window.equippedSlots.leggings) {
          missingEquipSlots.push("LEGGINGS");
        }
      }

      let currentLvlStage = window.playerStats.stage || 1;
      let recommendedDefense = currentLvlStage * 8;
      let activeD = window.resolvePlayerStats();

      // Priority 1: Missing crucial gear
      if (missingEquipSlots.length > 0) {
        adviceText = `⚠️ <strong style="color:#ff7675;">Missing Gear:</strong> You are entering battle with empty equipment slots (<strong>${missingEquipSlots.join(", ")}</strong>). Equipping gear is the fastest way to survive.`;
        buttonText = "Open Sack & Equip ➔";
        actionCode = "window.respawnHero(); window.switchTab('inv');";
        accentColor = "#e74c3c"; // Crimson warning
      }
      // Priority 2: Unspent Skill Points
      else if (unallocatedSp > 0) {
        adviceText = `⚡ <strong style="color:#f1c40f;">Unspent SP:</strong> You have <strong>${unallocatedSp} unspent Skill Points</strong>! Allocating them to STR, DEX, or INT will massively boost your attributes.`;
        buttonText = "Allocate Skill Points ➔";
        actionCode = "window.respawnHero(); window.switchTab('hero');";
        accentColor = "#f39c12"; // Gold advice
      }
      // Priority 3: Low Defense
      else if (activeD.def < recommendedDefense) {
        adviceText = `⚒️ <strong style="color:#3498db;">Low Defense:</strong> Your defense (<strong>${window.formatNumber(activeD.def)}</strong>) is below target (<strong>${window.formatNumber(recommendedDefense)}</strong>). Go to the Blacksmith to attune and level up your armor!`;
        buttonText = "Go to Blacksmith ➔";
        actionCode =
          "window.respawnHero(); window.switchTab('forge'); window.selectCustomForgeStation('blacksmith'); window.setForgeMode('temper');";
        accentColor = "#3498db"; // Cyber blue advice
      }
      // Priority 4: Default forge/enchanter tip
      else {
        adviceText = `🔮 <strong style="color:#a855f7;">Optimize Stats:</strong> Your basic stats are looking solid! To break through further barriers, visit the Mystical Enchanter to infuse modifiers or re-roll your item properties.`;
        buttonText = "Go to Enchanter ➔";
        actionCode =
          "window.respawnHero(); window.switchTab('forge'); window.selectCustomForgeStation('enchanter');";
        accentColor = "#a855f7"; // Royal purple advice
      }

      alertsEl.innerHTML = `
                        <div style="background: rgba(0, 0, 0, 0.4); border: 1.5px solid ${accentColor}; border-radius: 8px; padding: 12px; text-align: left; display: flex; flex-direction: column; gap: 8px; box-shadow: 0 4px 15px ${window.hexToRgba ? window.hexToRgba(accentColor, 0.1) : "rgba(0,0,0,0.5)"};">
                          <span style="color:${accentColor}; font-size:9.5px; font-weight:900; letter-spacing:1px; text-transform:uppercase; display:flex; align-items:center; gap:4px;">
                            🏅 Hoor's Advice
                          </span>
              <span style="font-size:10.5px; color:#f1f5f9; line-height:1.45; white-space:normal;">${adviceText}</span>
              <button onclick="${actionCode}" class="btn-action" style="background:${accentColor}; color:#fff; border:1px solid #fff; font-weight:bold; font-size:10.5px; padding:8px; border-radius:4px; text-transform:uppercase; letter-spacing:0.5px; cursor:pointer; width:100%; box-shadow: 0 0 10px ${window.hexToRgba ? window.hexToRgba(accentColor, 0.25) : "rgba(0,0,0,0.1)"}; text-align:center; height:32px; line-height:1;">
                ${buttonText}
              </button>
            </div>
          `;
      alertsEl.style.display = "block";

      if (tipContainerEl) tipContainerEl.style.display = "none";
    }

    window.updateUI();

    if (wasDungeon)
          window.pushLog(
            `<span style='color:#e74c3c; font-weight:bold;'>[DUNGEON STAGE FAILIURE] Died on Dungeon Floor. Safely returned to Campaign Stage ${restartStage}.</span>`,
          );
        else
          window.pushLog(
            `<span style='color:#e74c3c; font-weight:bold;'>[DEFEATED] Returned to the start of Stage ${restartStage}. No equipment or stage progress lost!</span>`,
          );

    const overlayEl = document.getElementById("death-overlay");
    const canvasContainer = document.getElementById("canvas-container");
    if (overlayEl) overlayEl.style.display = "flex";

    // Preserve active sticky camera viewport alignment rather than forcing relative resets
    if (typeof window.updateStickyCanvasStyle === "function") {
      window.updateStickyCanvasStyle();
    }
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
    const overlayEl = document.getElementById("death-overlay");
    if (overlayEl) overlayEl.style.display = "none";

    // Restore sticky/relative settings based on user preference
    if (typeof window.updateStickyCanvasStyle === "function") {
      window.updateStickyCanvasStyle();
    }

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

window.triggerPlayerSlash = (isManual) =>
  window.CombatEngine.triggerPlayerSlash(isManual);
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
    let depotLevel =
      (window.playerStats.clanSkills &&
        window.playerStats.clanSkills.clan_supply_depot) ||
      0;
    let maxBag = window.getMaxBagSlots();
    if (depotLevel >= 30 && window.inventory.EQUIP.length >= maxBag) {
      window.pushHeaderToast(
        "❌ Cannot open: Equipment bag is full!",
        "#e74c3c",
      );
      return;
    }

    window.inventory.USE[itemName]--;
    if (window.inventory.USE[itemName] === 0) {
      delete window.inventory.USE[itemName];
    }

    window.SoundManager.play("revive");
    window.setPauseState(true);
    (window.playerStats.clanSkills &&
      window.playerStats.clanSkills.clan_supply_depot) ||
      0;
    let stage = window.playerStats.stage || 1;
    let stgScale = Math.max(1, Math.floor((stage - 1) / 5) + 1);
    let itemLvlMultiplier = Math.pow(1.08, stage);

    // Scaling yields based on Depot Level research
    let baseGold = Math.floor(
      50000 * itemLvlMultiplier * (1 + depotLevel * 0.2),
    );
    let baseSouls = Math.floor(100 * (1 + depotLevel * 0.1));
    let baseKeys = 1;

    window.playerStats.coins = BigNum.from(window.playerStats.coins).add(
      baseGold,
    );
    window.playerStats.totalGoldEarned = BigNum.from(
      window.playerStats.totalGoldEarned || 0,
    ).add(baseGold);
    window.addEtcDrop("Monster Soul", baseSouls);
    window.addEtcDrop("Gacha Key", baseKeys);

    // Dynamic Sacks scaling with Clan Supply Depot research level
    let cardSacksToAward = 1;
    if (depotLevel >= 10) cardSacksToAward++;
    if (depotLevel >= 20) cardSacksToAward++;
    if (depotLevel >= 30) cardSacksToAward++;
    window.addUseDrop("Monster Card Sack", cardSacksToAward);

    let premiumDrops = [];
    premiumDrops.push(
      `<span style="color:#a855f7;">+${cardSacksToAward}x Monster Card Sack(s)</span>`,
    );
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
      window.frozenItemDb[rewardItem.id] =
        window.cloneItemForTooltip(rewardItem);
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
  let effectiveInt = Math.max(0, pBefore.int - 5);
  let achDurationBonus = 1.0;
  if (window.playerStats.unlockedAchievements && window.AchievementsData) {
    window.playerStats.unlockedAchievements.forEach((id) => {
      let ach = window.AchievementsData.find((a) => a.id === id);
      if (ach && ach.stats && ach.stats.potDurationPct)
        achDurationBonus += ach.stats.potDurationPct;
    });
  }
  // S-Curve: Cubic Log scaling ensures early INT grants less than a second, while scaling infinitely towards 30 minutes (108000 frames)
  let logInt = Math.log10(effectiveInt + 1);
  let bonusFraction = 1 - 1 / (1 + 0.00005 * Math.pow(logInt, 3));
  let baseBonusDuration = 18000; // 5 minutes base
  let maxBonus = 90000; // 25 minutes of potential bonus
  let finalDuration = Math.floor(
    (baseBonusDuration + maxBonus * bonusFraction) * achDurationBonus,
  );

  function consumeUseItem(name) {
    let spareChance = 0.12;
    if (window.checkArtifactTrait("philosopher_catalyst")) {
      let T = window.getArtifactTemperLevel("philosopher_catalyst");
      spareChance = 0.12 + T * 0.03; // 12% base + 3% per level (max 30%)
    }
    if (
      window.checkArtifactTrait("philosopher_catalyst") &&
      Math.random() < spareChance
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
    window.playerStats.xpPotionTimer = Math.max(
      window.playerStats.xpPotionTimer || 0,
      finalDuration,
    );
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
    let nextStr = itemName.includes("Supernal")
      ? 0.35
      : itemName.includes("Greater")
        ? 0.2
        : 0.1;
    if (
      window.playerStats.atkPotionTimer > 0 &&
      window.playerStats.atkPotionStrength < nextStr
    ) {
      window.playerStats.hasTriggeredAlchemicalSynthesis = true;
    }
    window.playerStats.atkPotionTimer = Math.max(
      window.playerStats.atkPotionTimer || 0,
      finalDuration,
    );
    window.playerStats.atkPotionStrength = Math.max(
      window.playerStats.atkPotionStrength || 0,
      nextStr,
    );
    consumeUseItem(itemName);
    window.pushLog(
      `<span style='color:#2ecc71; font-weight:bold;'>[USE] Consumed ${itemName}! Attack boosted by +${Math.floor(finalDuration / 60)}s.</span>`,
    );
  } else if (itemName.includes("Vitality Elixir")) {
    let nextStr = itemName.includes("Supernal")
      ? 0.35
      : itemName.includes("Greater")
        ? 0.2
        : 0.1;
    window.playerStats.hpPotionTimer = Math.max(
      window.playerStats.hpPotionTimer || 0,
      finalDuration,
    );
    window.playerStats.hpPotionStrength = Math.max(
      window.playerStats.hpPotionStrength || 0,
      nextStr,
    );
    consumeUseItem(itemName);
    window.pushLog(
      `<span style='color:#e74c3c; font-weight:bold;'>[USE] Consumed ${itemName}! Max HP boosted by +${Math.floor(finalDuration / 60)}s.</span>`,
    );
  } else if (itemName.includes("Armored Elixir")) {
    let nextStr = itemName.includes("Supernal")
      ? 0.35
      : itemName.includes("Greater")
        ? 0.2
        : 0.1;
    window.playerStats.defPotionTimer = Math.max(
      window.playerStats.defPotionTimer || 0,
      finalDuration,
    );
    window.playerStats.defPotionStrength = Math.max(
      window.playerStats.defPotionStrength || 0,
      nextStr,
    );
    consumeUseItem(itemName);
    window.pushLog(
      `<span style='color:#3498db; font-weight:bold;'>[USE] Consumed ${itemName}! Defense boosted by +${Math.floor(finalDuration / 60)}s.</span>`,
    );
  } else if (itemName.includes("Haste Elixir")) {
    let nextStr = itemName.includes("Supernal")
      ? 3
      : itemName.includes("Greater")
        ? 2
        : 1;
    window.playerStats.hastePotionTimer = Math.max(
      window.playerStats.hastePotionTimer || 0,
      finalDuration,
    );
    window.playerStats.hastePotionStrength = Math.max(
      window.playerStats.hastePotionStrength || 0,
      nextStr,
    );
    consumeUseItem(itemName);
    window.pushLog(
      `<span style='color:#f1c40f; font-weight:bold;'>[USE] Consumed ${itemName}! Speed boosted by +${Math.floor(finalDuration / 60)}s.</span>`,
    );

    // Trigger Coffee Run achievement if consumed between 7:00 AM and 9:00 AM local time
    let hr = new Date().getHours();
    if (hr >= 7 && hr < 9) {
      window.playerStats.hasTriggeredCoffeeRun = true;
    }
  } else if (itemName === "Monster Card Sack") {
    window.inventory.USE[itemName]--;
    if (window.inventory.USE[itemName] === 0) {
      delete window.inventory.USE[itemName];
    }

    let bossCardKeys = [
      "aegis_goliath",
      "chronos_arbitrator",
      "nexus_overseer",
      "overlord_iron_vault",
      "gilded_vault_keeper",
      "corrosive_abomination",
      "hooktail",
    ];
    let normalCardKeys = Object.keys(window.MONSTER_CARDS_DATA).filter(
      (k) => !bossCardKeys.includes(k),
    );

    let rolledKeys = [];
    // Draw exactly 5 cards
    for (let i = 0; i < 5; i++) {
      let rolledKey;
      if (Math.random() < 0.05) {
        rolledKey =
          bossCardKeys[Math.floor(Math.random() * bossCardKeys.length)];
      } else {
        rolledKey =
          normalCardKeys[Math.floor(Math.random() * normalCardKeys.length)];
      }
      rolledKeys.push(rolledKey);
    }

    // Consolidated duplicate stacking
    let aggregatedPulls = {};
    rolledKeys.forEach((cKey) => {
      if (!aggregatedPulls[cKey]) {
        let currentOwned = window.playerStats.monsterCards[cKey] || 0;
        aggregatedPulls[cKey] = {
          key: cKey,
          qty: 0,
          startCount: currentOwned,
          endCount: currentOwned,
          recycledDust: 0,
        };
      }
      let entry = aggregatedPulls[cKey];
      entry.qty++;
      if (entry.endCount >= 600) {
        entry.recycledDust++;
      } else {
        entry.endCount++;
      }
    });

    let totalRecycledDust = 0;
    for (let cKey in aggregatedPulls) {
      let entry = aggregatedPulls[cKey];
      window.playerStats.monsterCards[cKey] = entry.endCount;
      totalRecycledDust += entry.recycledDust;
    }
    if (totalRecycledDust > 0) {
      window.playerStats.astralDust =
        (window.playerStats.astralDust || 0) + totalRecycledDust;
    }

    let overlay = document.createElement("div");
    overlay.id = "booster-opening-overlay";
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

    window.setPauseState(true);

    let pulledArray = Object.values(aggregatedPulls);
    let thresholds = window.CARD_UPGRADE_THRESHOLDS || [
      1, 50, 150, 300, 750, 1800,
    ];

    let cardsHtml = pulledArray
      .map((entry, idx) => {
        let cData = window.MONSTER_CARDS_DATA[entry.key];
        let setDef = window.CARD_SETS_DATA[cData.set];
        let isBoss = bossCardKeys.includes(entry.key);
        let tier = window.getCardTier(entry.endCount);
        let isLocked = tier < 0;
        let cardColor = isBoss ? "#ff007f" : window.getTierColor(tier);

        let cardCanvasId = `booster-card-canvas-${idx}`;
        let isHoloClass = isBoss ? "boss-card-glow" : "";

        let labelText = isBoss ? "BOSS CARD" : "MONSTER";
        let dustHtml =
          entry.recycledDust > 0
            ? `<div style="font-size:9.5px; color:#ff007f; font-family:monospace; font-weight:bold; margin-top:2px;">Recycled (+${entry.recycledDust} Dust)</div>`
            : `<span style="font-size:9.5px; color:#2ecc71; font-weight:bold;">Copies added: +${entry.qty}</span>`;

        // Calculate card progression stats to prevent reference errors
        let nextThreshold = thresholds[tier + 1] || 1800;
        let baseThreshold = thresholds[tier] || 0;
        let isMaxed = tier >= 5;

        // Custom Newly Unlocked Visual state logic
        let isNewUnlock = entry.startCount === 0;

        let flatProgressText = "";
        let fillPct = 0;
        let firstThreshold = thresholds[0] || 1;

        let displayCount = entry.endCount;
        if (isNewUnlock) {
          flatProgressText = "✨ UNLOCKED!";
          fillPct = 100; // Render progress bar fully glowing to denote unlock
        } else if (isMaxed) {
          flatProgressText = "MAX TIER";
          fillPct = 100;
        } else {
          flatProgressText = `${displayCount} / ${nextThreshold}`;
          fillPct =
            ((displayCount - baseThreshold) / (nextThreshold - baseThreshold)) *
            100;
        }

        return `
              <div class="market-card ${isHoloClass}" style="
                background: linear-gradient(135deg, #110d1c 0%, #06040a 100%);
                border: 2px solid ${cardColor};
                border-radius: 10px;
                padding: 8px 10px;
                display: flex;
                flex-direction: column;
                justify-content: space-between;
                align-items: center;
                position: relative;
                width: 130px;
                height: 220px;
                box-shadow: 0 4px 15px rgba(0,0,0,0.65), inset 0 0 10px ${cardColor}15;
                transition: transform 0.18s, box-shadow 0.18s;
              "
              onmouseenter="window.showCardTooltip(event, '${entry.key}')"
              onmouseleave="window.hideTooltip()"
              ontouchstart="window.showCardTooltip(event, '${entry.key}')">

                <!-- Overlap Duplicate Multiplier Badge -->
                <span style="position: absolute; top: -6px; right: -6px; background: ${cardColor}; color: ${isBoss ? "#fff" : "#111"}; border: 1.5px solid #fff; border-radius: 50%; font-size: 10px; font-weight: 900; width: 22px; height: 22px; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(0,0,0,0.5); z-index: 10;">
                  x${entry.qty}
                </span>

                <div style="width:100%; text-align:center;">
                  <strong style="color:${cardColor}; font-size:11.5px; display:block; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-family:sans-serif;">${cData.name.replace(" Card", "")}</strong>
                  <span style="font-size:8px; color:#888; text-transform:uppercase; letter-spacing:0.5px; display:block; margin-top:1px;">${isLocked ? "Locked" : window.getTierName(tier)}</span>
                </div>

                <!-- Card Art Canvas Frame (Restored missing data-card-key attribute to enable live portraits) -->
                <div style="background: rgba(0,0,0,0.6); border: 1.5px solid ${isLocked ? "#222" : cardColor}44; border-radius: 6px; width: 64px; height: 64px; display: flex; align-items: center; justify-content: center; overflow: hidden; margin: 4px 0; box-shadow: inset 0 0 8px #000;">
                  <canvas id="${cardCanvasId}" data-card-key="${entry.key}" width="64" height="64" style="width:64px; height:64px; pointer-events:none; image-rendering:pixelated;"></canvas>
                </div>

                <div style="width:100%; text-align:center; min-height: 28px;">
                  ${dustHtml}
                </div>

                <!-- Progress Bar Track -->
                <div style="width:100%; margin-top:4px;">
                  <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px; height:18px;">
                    <span style="font-size:8px; color:#df9ffb; font-family:monospace; font-weight:bold;">${flatProgressText}</span>
                  </div>
                  <div class="sink-prog-track" style="margin:0; height:5px !important;">
                    <div id="progress-fill-${idx}" style="width: 0%; height:100%; transition: width 1.2s cubic-bezier(0.25, 0.8, 0.25, 1); background: ${cardColor};"></div>
                  </div>
                </div>
              </div>
            `;
      })
      .join("");

    overlay.innerHTML = `
                <style>
                  .pack-wrapper {
                    position: relative;
                    width: 220px;
                    height: 310px;
                    cursor: pointer;
                    perspective: 1000px;
                    animation: floatingPack 3s ease-in-out infinite;
                  }
                  .pack-foil {
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(135deg, #180a2b 0%, #3e125c 50%, #10061d 100%);
                    border: 2.5px solid #a855f7;
                    border-radius: 12px;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.85), inset 0 0 15px rgba(168,85,247,0.3);
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                    align-items: center;
                    padding: 15px;
                    box-sizing: border-box;
                    position: relative;
                    overflow: hidden;
                  }
                  .pack-foil::before {
                    content: "";
                    position: absolute;
                    top: -150%; left: -50%; width: 200%; height: 200%;
                    background: linear-gradient(135deg, rgba(255,255,255,0) 45%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0) 55%);
                    transform: rotate(-15deg);
                    animation: foilShine 4s linear infinite;
                  }
                  .pack-seal-frame {
                    width: 55px;
                    height: 55px;
                    background: #ff007f;
                    border: 2.5px solid #fff;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 0 15px #ff007f, inset -3px -3px 6px rgba(0,0,0,0.5);
                    animation: sealGlow 1.5s infinite;
                  }

                  /* Consolidated Grid Sizing */
                  .booster-grid {
                    display: flex;
                    gap: 12px;
                    justify-content: center;
                    flex-wrap: wrap;
                  }

                  @keyframes pulseGlowBoss {
                    0%, 100% { box-shadow: 0 0 10px #ff007f, inset 0 0 8px rgba(255, 0, 127, 0.15); border-color: #ff007f; }
                    50% { box-shadow: 0 0 25px #ff007f, inset 0 0 15px rgba(255, 0, 127, 0.35); border-color: #ff007f; }
                  }
                  .boss-card-glow {
                    animation: pulseGlowBoss 1.5s infinite !important;
                  }

                  @keyframes floatingPack {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-10px); }
                  }
                  @keyframes foilShine {
                    0% { transform: translate(-30%, -30%) rotate(-15deg); }
                    100% { transform: translate(130%, 130%) rotate(-15deg); }
                  }
                  @keyframes sealGlow {
                    0%, 100% { box-shadow: 0 0 10px #ff007f; }
                    50% { box-shadow: 0 0 25px #ff007f; }
                  }
                  @keyframes ripFoil {
                    0% { transform: translateY(0) scaleY(1); opacity: 1; }
                    100% { transform: translateY(-120px) scaleY(0); opacity: 0; }
                  }
                </style>

                <div id="booster-pack-stage" style="text-align:center;">
                  <div class="pack-wrapper" onclick="window.ripBoosterPack()">
                    <div class="pack-foil" id="pack-foil-element">
                      <div style="font-size:10px; color:#df9ffb; font-weight:bold; letter-spacing:2px; font-family:monospace;">BOOSTER CONSOLE</div>
                      <div class="pack-seal-frame">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" style="filter: drop-shadow(0 0 3px #fff);"><circle cx="12" cy="12" r="10" stroke-dasharray="3 3"/><circle cx="12" cy="12" r="5" stroke="#fff" fill="#ff007f" fill-opacity="0.15"/><circle cx="12" cy="12" r="1.5" fill="#fff"/></svg>
                      </div>
                      <div style="font-size:10px; color:#ff007f; font-weight:bold; letter-spacing:1px; text-transform:uppercase; font-family:monospace;">Tear open booster</div>
                    </div>
                  </div>
                  <div style="font-size:12px; color:#df9ffb; font-weight:bold; margin-top:15px; letter-spacing:1px; font-family:monospace;">CLICK PACK TO TEAR OPEN</div>
                </div>

                <div id="booster-cards-stage" style="display:none; text-align:center; width: 100%; max-width:800px; padding:0 20px;">
                  <div style="font-size:13px; font-weight:bold; color:#df9ffb; margin-bottom:12px; letter-spacing:1px; font-family:monospace;" id="booster-status-text">UNBOXED CARDS SUMMARY</div>
                  <div class="booster-grid" id="booster-grid-element"></div>
                  <button id="btn-booster-claim" class="btn-action" style="display:none; background:linear-gradient(135deg, #a855f7, #6c5ce7); border:1px solid #fff; font-weight:bold; font-size:12px; text-transform:uppercase; letter-spacing:1px; padding:12px 35px; border-radius:6px; cursor:pointer; margin-top:20px; box-shadow:0 4px 15px rgba(168,85,247,0.4); animation: pulseGlow 1.5s infinite;">Claim Cards</button>
                </div>
              `;

    window.ripBoosterPack = function () {
      let pack = document.getElementById("booster-pack-stage");
      let cardsStage = document.getElementById("booster-cards-stage");
      let grid = document.getElementById("booster-grid-element");
      if (!pack || !cardsStage || !grid) return;

      if (window.SoundManager) {
        let hasBossCard = pulledArray.some((entry) =>
          bossCardKeys.includes(entry.key),
        );
        window.SoundManager.play(hasBossCard ? "revive" : "death");
      }

      let foil = document.getElementById("pack-foil-element");
      if (foil) {
        foil.style.animation =
          "ripFoil 0.5s cubic-bezier(0.25, 0.8, 0.25, 1) forwards";
      }

      setTimeout(() => {
        pack.style.display = "none";
        cardsStage.style.display = "block";

        // Secure Card Drawing Injection: Populate the unboxed card items into the grid dynamically as it is revealed
        grid.innerHTML = cardsHtml;

        // Trigger progress bar filling animations smoothly
        setTimeout(() => {
          pulledArray.forEach((entry, idx) => {
            let fill = document.getElementById(`progress-fill-${idx}`);
            if (fill) {
              let isNewUnlock = entry.startCount === 0;
              if (isNewUnlock) {
                // If it is a new unlock, transition from 0% to 100% to represent the unlock event
                fill.style.width = "0%";
                setTimeout(() => {
                  fill.style.width = "100%";
                }, 100);
              } else {
                // Normal duplicate progress bar transitions
                let t = window.getCardTier(entry.startCount);
                let baseVal = t < 0 ? 0 : thresholds[t] || 0;
                let nextVal = thresholds[t + 1] || 1800;
                let startPct =
                  ((entry.startCount - baseVal) / (nextVal - baseVal)) * 100;
                let endPct =
                  ((entry.endCount - baseVal) / (nextVal - baseVal)) * 100;

                fill.style.width = Math.min(100, Math.max(0, startPct)) + "%";
                setTimeout(() => {
                  fill.style.width = Math.min(100, Math.max(0, endPct)) + "%";
                }, 100);
              }
            }
          });
        }, 150);

        let claimBtn = document.getElementById("btn-booster-claim");
        if (claimBtn) {
          claimBtn.style.display = "inline-block";
          claimBtn.style.opacity = "0";
          setTimeout(() => {
            claimBtn.style.transition = "opacity 0.4s ease";
            claimBtn.style.opacity = "1";
          }, 400);
        }

        // Initiate the unboxed cards live-drawing loop
        if (typeof window.animateBoosterCards === "function") {
          window.animateBoosterCards();
        }
      }, 550);
    };

    // Safely register local click handler to avoid element race conditions
    let claimBtn = overlay.querySelector("#btn-booster-claim");
    if (claimBtn) {
      claimBtn.onclick = function () {
        overlay.remove();
        window.isGamePaused = false;
        window.updateUI();
        window.renderInventory();
      };
    }
  } else if (itemName === "Cavern Sigil Sack") {
    // Uncapped specialised pouch; not bound by bag space limits
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
    window.frozenItemDb[newSigil.id] = window.cloneItemForTooltip(newSigil);

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

  if (window.checkArtifactTrait("fairy_wealth")) {
    let T = window.getArtifactTemperLevel("fairy_wealth");
    let lSoulChance = 0.08 + T * 0.01; // 8% base + 1% per level (max 14%)
    if (Math.random() < lSoulChance) {
      window.addEtcDrop("Luminous Soul", 1);
      window.pushLog(
        `<strong style='color:#ffb6c1;'>[FAIRY QUEEN'S CROWN]</strong> Extracted 1 Luminous Soul from the fairy magic!`,
      );
      return;
    }
  }

  window.playerStats.fairiesClickedInSet = (window.playerStats.fairiesClickedInSet || 0) + 1;

      let rollEquip = false;
      let equipChance = 0.10; // Base 10% chance
      if (p.fairySpawn > 1.0 && window.playerStats.fairiesClickedInSet > 1) {
        equipChance = 0.01; // 1% chance for subsequent fairies if spawn rate is > 100%
      }
      if ((window.playerStats.fairiesEquipDroppedInSet || 0) >= 2) {
        equipChance = 0.0; // Max of 2 Equipment per set
      }

      if (Math.random() < equipChance) {
        rollEquip = true;
        window.playerStats.fairiesEquipDroppedInSet = (window.playerStats.fairiesEquipDroppedInSet || 0) + 1;
      }

      if (rollEquip) {
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
        let stageScale = Math.floor((activeStage - 1) / 5) + 1;
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
          window.pushHeaderToast(`Bag Full! Soul gained.`, "#e74c3c");
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
      } else {
        // Fallback gold drop when equipment rolls fail or are capped
        let goldYield = Math.floor((100 + window.playerStats.stage * 35) * p.gold);
        if (goldYield > 0 && window.goldParticles) {
          let particleCount = Math.min(
            12,
            Math.max(4, Math.floor(Math.log10(goldYield + 1) * 3)),
          );
          let baseAmt = Math.floor(goldYield / particleCount);
          let remainder = goldYield % particleCount;

          for (let i = 0; i < particleCount; i++) {
            let pAmt = baseAmt + (i < remainder ? 1 : 0);
            window.goldParticles.push({
              x: spawnX,
              y: spawnY,
              vx: window.randFloat(-4, 4),
              vy: window.randFloat(-6, -2),
              life: 120,
              delay: i * 2,
              amount: pAmt,
              isDungeon: window.playerStats.isDungeonMode,
              isCrucible: window.playerStats.isCrucibleMode,
            });
          }
        }
        window.effects.push({
          x: spawnX,
          y: spawnY - 10,
          text: `+${goldYield} Gold!`,
          color: "#f1c40f",
          life: 80,
        });
      }
    if (typeof window.saveGame === "function") {
      window.saveGame();
    }
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

  let peak = window.playerStats.dungeonPeaks[type] || 1;
  let campaignStage = window.playerStats.stage || 1;
  let checkpoint = Math.max(
    1,
    Math.floor(peak * 0.8),
    Math.floor(campaignStage * 0.7),
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
        window.playerStats.nextDungeonKeyTime = Date.now() + 14400000; // 4 Hours

      window.playerStats.isDungeonMode = true;
      window.secondsSinceLastRiftSpawn = 0;
      window.playerStats.dungeonAccumulatedGold = 0;
      window.playerStats.dungeonAccumulatedXp = 0;
      window.playerStats.dungeonAccumulatedLoot = [];
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
      window.playerStats.targetsRequired = 3; // Reduced from 5 to 3
      window.playerStats.isBossMode = false;
      window.playerStats.isUberBoss = false;
      window.mob = null;

      window.invalidatePlayerStats();
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
  let peak =
    window.playerStats.lifetimePeakStage || window.playerStats.stage || 1;
  let entryCost = 100 + Math.floor(peak * 0.5);
  let souls = window.inventory.ETC["Monster Soul"] || 0;
  if (souls < entryCost) {
    window.pushHeaderToast(
      `Requires ${entryCost.toLocaleString()} Monster Souls!`,
      "#e74c3c",
    );
    return;
  }

  let startingStageOffset = Math.max(1, Math.floor(peak * 0.75));

  window.showCustomConfirm(
    "Enter Astral Crucible",
    `Spend ${entryCost.toLocaleString()} Monster Souls to enter the Astral Crucible? (Starts at Wave 1 with enemy stats scaled to Stage ${startingStageOffset})`,
    "Enter Crucible",
    "Cancel",
    "#9b59b6",
    function () {
      window.saveCurrentActivityPeak();
      window.inventory.ETC["Monster Soul"] -= entryCost;
      if (window.inventory.ETC["Monster Soul"] === 0) {
        delete window.inventory.ETC["Monster Soul"];
      }

      // Initialize clean run accumulators
      window.secondsSinceLastRiftSpawn = 0;
      window.playerStats.crucibleAccumulatedGold = 0;
      window.playerStats.crucibleAccumulatedXp = 0;
      window.playerStats.crucibleDraftDeck = [];
      window.playerStats.crucibleWavesClearedThisRun = 0; // Local run wave clear tracker
      window.playerStats.crucibleSelfDmgReduction = 1.0;
      window.playerStats.crucibleSlotBonuses = {
        weapon: 0,
        subweapon: 0,
        helmet: 0,
        chest: 0,
        leggings: 0,
        overall: 0,
        boots: 0,
      };

      window.playerStats.isCrucibleMode = true;
      window.playerStats.isDungeonMode = false;
      window.playerStats.crucibleWave = 1;
      window.playerStats.crucibleStartWave = 1;
      window.playerStats.killCount = 0;
      window.playerStats.targetsRequired = 5;
      window.playerStats.isBossMode = false;
      window.playerStats.isUberBoss = false;
      window.mob = null;

      window.playerStats.crucibleActiveBuff = null;
      window.playerStats.crucibleActiveDebuff = null;
      window.playerStats.crucibleInfusedType = "none";
      window.playerStats.crucibleLootMult = 1.0;

      window.playerStats.crucibleRunActive = true;
      window.playerStats.crucibleAccumulatedShards = 0;
      window.playerStats.crucibleAccumulatedCores = 0;
      window.playerStats.crucibleAccumulatedLoot = [];

      window.invalidatePlayerStats();
      let p = window.resolvePlayerStats();
      window.playerStats.currentHp = p.maxHp;

      window.pushLog(
        `<span style='color:#9b59b6; font-weight:bold;'>[CRUCIBLE] Commenced Astral Crucible run!</span>`,
      );

      let menu = document.getElementById("dungeon-menu");
      if (menu) menu.style.display = "none";

      window.updateUI();
      window.renderInventory();
      window.saveGame();

      // Open starting Choose-2 cards starting draft
      setTimeout(() => {
        window.openCrucibleChooseTwoStartingDraftModal();
      }, 150);
    },
  );
};

window.rollEquipmentDrop = function (
  isBossKill,
  silent = false,
  minStars = 0,
  isRareMob = false,
  isMilestone = false,
  dungeonStageScale = null,
) {
  let p = window.resolvePlayerStats();
  let maxBag = window.getMaxBagSlots();

  // Milestone drops are 100% guaranteed and bypass the standard probability/pity checks
  if (!isMilestone) {
    let baseDropRate = window.playerStats.isUberBoss
      ? 1.0
      : isBossKill
        ? 0.01
        : isRareMob
          ? 0.005
          : 0.001;
    let effectiveRate = window.PitySystem.getEffectiveRate(
      baseDropRate * p.drop * window.state.efficiency,
    );

    // Roll Logic
    if (Math.random() >= effectiveRate) {
      if (window.playerStats.isDungeonMode) {
        window.PitySystem.increment();
      }
      return;
    }

    // SUCCESS: Reset Pity
    window.PitySystem.reset();
  }

  // Setup logic moved outside the if block or placed correctly
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
    // Scales gear towards the highest floor reached (Peak) to prevent low-level gear spam
    let peakFloor =
      window.playerStats.dungeonPeaks[window.playerStats.currentDungeon] || 1;
    activeStage = peakFloor;
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
  let stageScale = Math.floor((activeStage - 1) / 5) + 1;
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

  let color = window.getTierColor(newItem.statsRolled);
  if (!silent) {
    if (newItem.type === "artifact")
      window.pushLog(
        `<strong style='color:#1abc9c;'>⭐ UNIQUE ARTIFACT DROPPED!</strong> Extracted: <span style='color:#1abc9c;'>${newItem.name}</span>!`,
        newItem.id,
      );
    else if (sourceName === "Gacha")
      window.pushLog(
        `<strong style='color:#f1c40f;'>[GACHA]</strong> Dispensed: <span style='color:${color};'>${newItem.name}</span>`,
        newItem.id,
      );
    else if (sourceName === "Rare")
      window.pushLog(
        `<strong style='color:#ffb6c1;'>RARE ENEMY KILLED!</strong> Found: <span style='color:${color};'>${newItem.name}</span>`,
        newItem.id,
      );
    else
      window.pushLog(
        `<strong style='color:#ff9f43;'>BOSS KILLED!</strong> Found: <span style='color:${color};'>${newItem.name}</span>`,
        newItem.id,
      );
  }

  if (!silent)
    window.pushToast(
      newItem.name,
      newItem.statsRolled,
      color,
      false,
      1,
      null,
      null,
      isMilestone && !window.playerStats.isDungeonMode,
      newItem,
    );
  if (newItem.type === "artifact") {
    window.inventory.ARTIFACT.push(newItem);
    if (typeof window.recordRunLoot === "function") {
      window.recordRunLoot(newItem.name, 1, "artifact", newItem);
    }
  } else {
    window.inventory.EQUIP.push(newItem);
    if (typeof window.recordRunLoot === "function") {
      window.recordRunLoot(newItem.name, 1, "equip", newItem);
    }
  }

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
    if (typeof window.saveGame === "function") {
      window.saveGame();
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
  if (item.type === "artifact") {
    window.inventory.ARTIFACT.push(item);
    if (typeof window.recordRunLoot === "function") {
      window.recordRunLoot(item.name, 1, "artifact", item);
    }
  } else {
    window.inventory.EQUIP.push(item);
    if (typeof window.recordRunLoot === "function") {
      window.recordRunLoot(item.name, 1, "equip", item);
    }
  }

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
    if (typeof window.saveGame === "function") {
      window.saveGame();
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
  let stageScale = Math.floor((peakRunStage - 1) / 5) + 1;
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
  gold,
  xp,
  died = false,
) {
  let modal = document.createElement("div");
  modal.id = "crucible-summary-modal";
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

  let headerText = died ? "💀 CRUCIBLE OVERWHELMED" : "🔮 CRUCIBLE RECOVERY";
  let colorText = died ? "#e74c3c" : "#9b59b6";
  let footerTip = died
    ? "The onslaught overwhelmed your barriers, but your soul's anchor held! You escaped back to the mortal realm with all accumulated rewards."
    : "You chose to close the breach and step back into sanity! All accumulated dimensional artifacts have been safely claimed.";

  // Group and count duplicate card draft picks
  let deck = window.playerStats.crucibleDraftDeck || [];
  let groupedDeck = {};
  deck.forEach((cardId) => {
    groupedDeck[cardId] = (groupedDeck[cardId] || 0) + 1;
  });
  let groupedKeys = Object.keys(groupedDeck);

  let deckHtml = "";
  if (groupedKeys.length > 0) {
    deckHtml = groupedKeys
      .map((cardId) => {
        let card = window.CRUCIBLE_DRAFT_POOL.find((c) => c.id === cardId);
        if (!card) return "";
        let count = groupedDeck[cardId];
        let countBadge =
          count > 1
            ? ` <span style="color:#ffd700; font-family:monospace; font-weight:900;">x${count}</span>`
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
        <div style="background:#090610; border:1px solid #9b59b660; border-radius:6px; padding:6px 10px; font-size:10.5px; text-align:left; font-family:sans-serif;">
          <strong style="color:#df9ffb; display:block;">🛠️ ${card.name}${countBadge}</strong>
          <span style="font-size:9.5px; color:#aaa; display:block; margin-top:1px;">${descText}</span>
        </div>
      `;
      })
      .join("");
  } else {
    deckHtml = `<div style="color:#666; font-style:italic; font-size:11px; padding: 15px 0; text-align:center; width:100%;">No infusions drafted during this run.</div>`;
  }

  // Retrieve any extra items accumulated during the Crucible run (e.g. Card Sacks, etc.)
  let extraLoot = window.playerStats.crucibleAccumulatedLoot || [];
  let extraLootHtml = "";
  if (extraLoot.length > 0) {
    extraLootHtml = `
      <h4 style="margin:12px 0 8px 0; font-size:10.5px; color:#fff; text-align:left; text-transform:uppercase; letter-spacing:1px; border-bottom: 1px solid #3d1c5a; padding-bottom:5px; font-weight:bold; display:flex; align-items:center; gap:4px;">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#2ecc71" stroke-width="2.5"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
          Extra Loot Found:
      </h4>
      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px; text-align:left; margin-bottom:12px;">
        ${extraLoot
          .map((l) => {
            let color = l.name.includes("Scrap")
              ? "#3498db"
              : l.name.includes("Soul")
                ? "#ffb6c1"
                : "#9b59b6";
            if (l.name === "Eridium Shard") color = "#8e44ad";
            if (l.name.includes("Elixir")) color = "#2ecc71";

            let iconHtml =
              l.type === "use"
                ? window.getUseIconHtml(l.name, 28)
                : window.getEtcIconHtml(l.name, 28);
            iconHtml = iconHtml.replace(
              "margin-right: 12px;",
              "margin-right: 4px;",
            );

            let escapedName = l.name.replace(/'/g, "\\'");
            let hoverEvents =
              l.type === "use"
                ? `onmouseenter="window.showUseTooltip(event, '${escapedName}')" ontouchstart="window.showUseTooltip(event, '${escapedName}'); event.stopPropagation();" onmouseleave="window.hideTooltip()"`
                : `onmouseenter="window.showEtcTooltip(event, '${escapedName}')" ontouchstart="window.showEtcTooltip(event, '${escapedName}'); event.stopPropagation();" onmouseleave="window.hideTooltip()"`;

            return `
            <div style="background:#090a0f; border: 1px solid #222; border-left: 3.5px solid ${color} !important; padding: 6px 10px; border-radius: 4px; font-size: 11px; display:flex; align-items:center; justify-content:space-between; gap:6px; cursor:help; font-family:monospace;" ${hoverEvents}>
              <div style="display:flex; align-items:center; gap:6px; min-width:0; flex:1;">
                <div style="flex-shrink:0;">${iconHtml}</div>
                <span style="color:#aaa; font-size:10px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; flex:1;">${l.name}</span>
              </div>
              <strong style="color:${color}; font-size:11px; flex-shrink:0; margin-left:4px;">+${l.qty}</strong>
            </div>
          `;
          })
          .join("")}
      </div>
    `;
  }

  modal.innerHTML = `
    <style>
      @keyframes rotateSummaryConstellation {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      .summary-constellation-track {
        position: absolute;
        top: -50%; left: -50%; width: 200%; height: 200%;
        background: radial-gradient(circle at center, transparent 30%, rgba(155, 89, 182, 0.05) 70%),
                    radial-gradient(1.5px 1.5px at 20px 40px, #fff, rgba(0, 0, 0, 0)),
                    radial-gradient(1.5px 1.5px at 120px 180px, #df9ffb, rgba(0, 0, 0, 0)),
                    radial-gradient(1px 1.2px at 240px 90px, #fff, rgba(0, 0, 0, 0));
        background-repeat: repeat;
        background-size: 200px 200px;
        opacity: 0.15;
        animation: rotateSummaryConstellation 150s linear infinite;
        pointer-events: none;
        z-index: 0;
      }
    </style>
    <div style="background:#130d1e; border: 2.5px solid ${colorText}; border-radius: 12px; width:100%; max-width:440px; max-height: 88vh; display:flex; flex-direction:column; overflow:hidden; box-shadow: 0 15px 45px rgba(0,0,0,0.95); animation: toastFadeIn 0.3s; border-bottom-width: 5px; position:relative; z-index:1;">
        <div class="summary-constellation-track"></div>

        <div style="background:#090510; border-bottom: 1px solid #3d1c5a; padding:15px; text-align:center; position:relative; z-index:2;">
            <h3 style="margin:0; color:${colorText}; font-size:15px; font-weight:bold; letter-spacing:1.5px; text-transform:uppercase; text-shadow:0 0 10px rgba(155,89,182,0.45);">${headerText}</h3>
        </div>

        <div style="padding:20px; overflow-y:auto; flex:1; color:#fff; overscroll-behavior: contain; position:relative; z-index:2;">
            <div style="font-size:11px; color:#aaa; margin-bottom:3px; text-transform:uppercase; letter-spacing:0.5px; text-align:center;">MAX WAVE COMPLETED:</div>
            <div style="font-size:24px; color:#ffd700; font-weight:bold; margin-bottom:15px; font-family:monospace; text-align:center; text-shadow:0 0 8px rgba(255,215,0,0.35);">Wave ${waves}</div>

            <!-- Rewards Grid with custom SVGs -->
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:8px; margin-bottom:15px;">
                <div style="background:#08040d; padding:10px; border-radius:6px; border:1px solid #9b59b660; text-align:center; box-shadow: inset 0 0 8px #000;">
                    <span style="font-size:9px; color:#aaa; display:flex; align-items:center; justify-content:center; gap:4px; text-transform:uppercase; letter-spacing:0.5px;">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9b59b6" stroke-width="2.5" style="transform:translateY(-0.5px);"><polygon points="12 2 22 12 12 22 2 12"/></svg>
                        Astral Shards
                    </span>
                    <strong style="color:#df9ffb; font-size:16px; font-family:monospace;">+${shards}</strong>
                </div>
                <div style="background:#08040d; padding:10px; border-radius:6px; border:1px solid #2ecc7160; text-align:center; box-shadow: inset 0 0 8px #000;">
                    <span style="font-size:9px; color:#aaa; display:flex; align-items:center; justify-content:center; gap:4px; text-transform:uppercase; letter-spacing:0.5px;">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#2ecc71" stroke-width="2.5" style="transform:translateY(-0.5px);"><rect x="4" y="4" width="16" height="16" rx="2"/><circle cx="12" cy="12" r="4"/></svg>
                        Catalyst Cores
                    </span>
                    <strong style="color:#2ecc71; font-size:16px; font-family:monospace;">+${cores}</strong>
                </div>
                <div style="background:#08040d; padding:10px; border-radius:6px; border:1px solid #f1c40f60; text-align:center; box-shadow: inset 0 0 8px #000;">
                    <span style="font-size:9px; color:#aaa; display:flex; align-items:center; justify-content:center; gap:4px; text-transform:uppercase; letter-spacing:0.5px;">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#f1c40f" stroke-width="2.5" style="transform:translateY(-0.5px);"><circle cx="12" cy="12" r="10"/><path d="M12 8v8M9 10h6"/></svg>
                        Gold Claimed
                    </span>
                    <strong style="color:#f1c40f; font-size:16px; font-family:monospace;">+${window.formatNumber(gold)}</strong>
                </div>
                <div style="background:#08040d; padding:10px; border-radius:6px; border:1px solid #e67e2260; text-align:center; box-shadow: inset 0 0 8px #000;">
                    <span style="font-size:9px; color:#aaa; display:flex; align-items:center; justify-content:center; gap:4px; text-transform:uppercase; letter-spacing:0.5px;">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#e67e22" stroke-width="2.5" style="transform:translateY(-0.5px);"><circle cx="12" cy="12" r="10"/><path d="M17 13l-5-5-5 5"/></svg>
                        XP Harvested
                    </span>
                    <strong style="color:#e67e22; font-size:16px; font-family:monospace;">+${window.formatNumber(xp)}</strong>
                </div>
            </div>

            <!-- Extra Loot found during run -->
            ${extraLootHtml}

            <!-- Deck build list from run -->
            <h4 style="margin:12px 0 8px 0; font-size:10.5px; color:#fff; text-align:left; text-transform:uppercase; letter-spacing:1px; border-bottom: 1px solid #3d1c5a; padding-bottom:5px; font-weight:bold; display:flex; align-items:center; gap:4px;">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9b59b6" stroke-width="2.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="9" y1="9" x2="15" y2="9"/><line x1="9" y1="13" x2="15" y2="13"/></svg>
                Run Infusion Deck:
            </h4>
            <div style="max-height:130px; overflow-y:auto; margin-bottom:15px; padding-right:4px; display:flex; flex-direction:column; gap:6px;">
                ${deckHtml}
            </div>

            <div style="background:rgba(231,76,60,0.03); border:1px dashed rgba(155, 89, 182, 0.45); border-radius:8px; padding:10px 12px; font-size:10.5px; line-height:1.45; color:#e2e8f0; text-align:left; white-space:normal;">
                ${footerTip}
            </div>
        </div>
        <div style="background:#090510; border-top:1px solid #3d1c5a; padding:12px; display:flex; justify-content:center; position:relative; z-index:2;">
            <button id="close-crucible-summary" style="background:${colorText}; color:#fff; border:none; padding:12px; font-weight:bold; font-size:12px; border-radius:6px; cursor:pointer; width:100%; text-transform:uppercase; letter-spacing:1px; text-shadow:0 1px 2px rgba(0,0,0,0.5);">Claim Loot & Surface</button>
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

window.recordRunLoot = function (name, qty, type, itemObj = null) {
  let isDungeon = window.playerStats.isDungeonMode;
  let isCrucible = window.playerStats.isCrucibleMode;
  if (!isDungeon && !isCrucible) return;

  let targetArray = isDungeon
    ? window.playerStats.dungeonAccumulatedLoot
    : window.playerStats.crucibleAccumulatedLoot;

  if (!targetArray) return;

  if (type === "etc" || type === "use") {
    let existing = targetArray.find((l) => l.name === name && l.type === type);
    if (existing) {
      existing.qty += qty;
    } else {
      targetArray.push({
        name: name,
        qty: qty,
        type: type,
      });
    }
  } else {
    targetArray.push({
      name: name,
      qty: qty,
      type: type,
      item: itemObj,
    });
  }
};

window.showDungeonSummaryModal = function (
  dungeonType,
  floorReached,
  gold,
  xp,
  loot,
  died = false,
) {
  let modal = document.createElement("div");
  modal.id = "dungeon-summary-modal";
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

  let dNames = {
    equip: "Equipment Vault",
    gold: "Gold Mine Caverns",
    mat: "Toxic Material Pit",
  };
  let dColors = {
    equip: "#3498db",
    gold: "#f1c40f",
    mat: "#2ecc71",
  };
  let dName = dNames[dungeonType] || "Infinite Dungeon";
  let accentColor = dColors[dungeonType] || "#9b59b6";

  let headerText = died
    ? `💀 ${dName.toUpperCase()} DEFEAT`
    : `🏰 ${dName.toUpperCase()} SUMMARY`;

  let equipLoot = loot.filter(
    (l) => l.type === "equip" || l.type === "artifact" || l.type === "sigil",
  );
  let matLoot = loot.filter((l) => l.type === "etc" || l.type === "use");

  let equipListHtml = "";
  if (equipLoot.length > 0) {
    equipListHtml = equipLoot
      .map((l) => {
        let item = l.item;
        if (!item) return "";
        let color = window.getTierColor(item.statsRolled);
        let stars =
          item.statsRolled === "UNIQUE" ? "UNIQUE" : `${item.statsRolled}★`;
        return `
                  <div style="background:#13151c; border:1px solid #232833; border-left: 4px solid ${color} !important; padding: 8px 12px; border-radius: 6px; font-size: 11px; margin-bottom: 6px; text-align:left; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 2px 6px rgba(0,0,0,0.3); cursor:help;"
                       onmouseenter="window.showInventoryTooltip(event, ${item.id})"
                       ontouchstart="window.showInventoryTooltip(event, ${item.id}); event.stopPropagation();"
                       onmouseleave="window.hideTooltip()">
                    <span style="color:${color}; font-weight:bold; display:flex; align-items:center; gap:8px;">
                      ${window.getEquipIconHtml(item, 28)} ${item.name}
                    </span>
                    <span style="color:#888; font-size: 10px; font-family:monospace; font-weight:bold;">${stars}</span>
                  </div>
                `;
      })
      .join("");
  } else {
    equipListHtml = `<div style="color:#666; font-style:italic; font-size:11px; padding: 15px 0; text-align:center;">No equipment found in these depths.</div>`;
  }

  let matsListHtml = "";
  if (matLoot.length > 0) {
    matsListHtml = matLoot
      .map((l) => {
        let color = l.name.includes("Scrap")
          ? "#3498db"
          : l.name.includes("Soul")
            ? "#ffb6c1"
            : "#9b59b6";
        if (l.name === "Eridium Shard") color = "#8e44ad";
        if (l.name.includes("Elixir")) color = "#2ecc71";

        let iconHtml =
          l.type === "use"
            ? window.getUseIconHtml(l.name, 28)
            : window.getEtcIconHtml(l.name, 28);
        iconHtml = iconHtml.replace(
          "margin-right: 12px;",
          "margin-right: 4px;",
        );

        let escapedName = l.name.replace(/'/g, "\\'");
        let hoverEvents =
          l.type === "use"
            ? `onmouseenter="window.showUseTooltip(event, '${escapedName}')" ontouchstart="window.showUseTooltip(event, '${escapedName}'); event.stopPropagation();" onmouseleave="window.hideTooltip()"`
            : `onmouseenter="window.showEtcTooltip(event, '${escapedName}')" ontouchstart="window.showEtcTooltip(event, '${escapedName}'); event.stopPropagation();" onmouseleave="window.hideTooltip()"`;

        return `
                  <div style="background:#090a0f; border: 1.5px solid #222; border-left: 3.5px solid ${color} !important; padding: 6px 10px; border-radius: 6px; font-size: 11px; display:flex; align-items:center; justify-content:space-between; gap:6px; cursor:help; font-family:monospace;" ${hoverEvents}>
                    <div style="display:flex; align-items:center; gap:6px; min-width:0; flex:1;">
                      <div style="flex-shrink:0;">${iconHtml}</div>
                      <span style="color:#aaa; font-size:10px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; flex:1;">${l.name}</span>
                    </div>
                    <strong style="color:${color}; font-size:11px; flex-shrink:0; margin-left:4px;">+${l.qty}</strong>
                  </div>
                `;
      })
      .join("");
  } else {
    matsListHtml = `<div style="color:#666; font-style:italic; font-size:11px; padding: 5px 0; text-align:center; width:100%;">No materials recovered.</div>`;
  }

  modal.innerHTML = `
              <div style="background:#1a1a1a; border: 2.5px solid ${accentColor}; border-radius: 12px; width:100%; max-width:440px; max-height: 88vh; display:flex; flex-direction:column; overflow:hidden; box-shadow: 0 15px 45px rgba(0,0,0,0.95); animation: toastFadeIn 0.3s; border-bottom-width: 5px;">
                  <div style="background:#0b0f12; border-bottom: 1px solid #333; padding:15px; text-align:center;">
                      <h3 style="margin:0; color:${accentColor}; font-size:15px; font-weight:bold; letter-spacing:1.5px; text-transform:uppercase;">${headerText}</h3>
                  </div>
                  <div style="padding:20px; overflow-y:auto; flex:1; color:#fff; overscroll-behavior: contain;">
                      <div style="font-size:11px; color:#aaa; margin-bottom:3px; text-transform:uppercase; letter-spacing:0.5px; text-align:center;">DEEPEST FLOOR CLEARED:</div>
                      <div style="font-size:24px; color:${accentColor}; font-weight:bold; margin-bottom:15px; font-family:monospace; text-align:center;">Floor ${floorReached}</div>

                      <div style="display:grid; grid-template-columns: 1fr 1fr; gap:8px; margin-bottom:15px;">
                          <div style="background:#111; padding:10px; border-radius:6px; border:1px solid #222; text-align:center; box-shadow: inset 0 0 8px #000;">
                              <span style="font-size:9px; color:#aaa; display:block; margin-bottom:4px; text-transform:uppercase; letter-spacing:0.5px;">🟡 Gold Earned</span>
                              <strong style="color:#f1c40f; font-size:16px; font-family:monospace;">+${window.formatNumber(gold)}</strong>
                          </div>
                          <div style="background:#111; padding:10px; border-radius:6px; border:1px solid #222; text-align:center; box-shadow: inset 0 0 8px #000;">
                              <span style="font-size:9px; color:#aaa; display:block; margin-bottom:4px; text-transform:uppercase; letter-spacing:0.5px;">🧠 XP Harvested</span>
                              <strong style="color:#9b59b6; font-size:16px; font-family:monospace;">+${window.formatNumber(xp)}</strong>
                          </div>
                      </div>

                      <h4 style="margin:0 0 8px 0; font-size:10.5px; color:#fff; text-align:left; text-transform:uppercase; letter-spacing:1px; border-bottom: 1px solid #333; padding-bottom:5px; font-weight:bold; display:flex; align-items:center; gap:4px;">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#2ecc71" stroke-width="2.5"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
                          Equipment Found
                      </h4>
                      <div style="max-height:140px; overflow-y:auto; margin-bottom:15px; padding-right:4px;">${equipListHtml}</div>

                      <h4 style="margin:0 0 8px 0; font-size:10.5px; color:#fff; text-align:left; text-transform:uppercase; letter-spacing:1px; border-bottom: 1px solid #333; padding-bottom:5px; font-weight:bold; display:flex; align-items:center; gap:4px;">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#e67e22" stroke-width="2.5"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
                          Materials & Consumables
                      </h4>
                      <div style="display:grid; grid-template-columns: repeat(2, 1fr); gap:6px; text-align:left; margin-bottom:10px; max-height:120px; overflow-y:auto; padding-right:4px;">${matsListHtml}</div>
                  </div>
                  <div style="background:#0b0f12; border-top:1px solid #333; padding:12px; display:flex; justify-content:center;">
                      <button id="close-dungeon-summary" style="background:${accentColor}; color:#fff; border:none; padding:12px; font-weight:bold; font-size:12px; border-radius:6px; cursor:pointer; width:100%; text-transform:uppercase; letter-spacing:1px; text-shadow:0 1px 2px rgba(0,0,0,0.5);">Claim Loot & Surface</button>
                  </div>
              </div>
            `;
  document.body.appendChild(modal);

  document.getElementById("close-dungeon-summary").onclick = function () {
    modal.remove();
    window.isGamePaused = false;
    let p = window.resolvePlayerStats();
    window.playerStats.currentHp = p.maxHp;
    window.updateUI();
    window.renderInventory();
  };
};

// 5-Wave Mid-Run draft Choice portal overlay generator
window.openCrucibleMidRunDraftModal = function () {
  window.setPauseState(true);

  // Pauses and display 3 random distinct options from window.CRUCIBLE_DRAFT_POOL
  let pool = [...window.CRUCIBLE_DRAFT_POOL].sort(() => Math.random() - 0.5);
  let selectedCards = pool.slice(0, 3);

  let overlay = document.createElement("div");
  overlay.id = "crucible-midrun-draft-overlay";
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
  overlay.style.backdropFilter = "blur(8px)";
  document.body.appendChild(overlay);

  let cardsHtml = selectedCards
    .map((card, idx) => {
      return `
        <div class="market-card" style="
          background: linear-gradient(135deg, #13111c 0%, #06040a 100%);
          border: 2px solid #9b59b6;
          border-radius: 12px;
          padding: 15px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          align-items: center;
          cursor: pointer;
          width: 130px;
          height: 220px;
          box-shadow: 0 4px 15px rgba(0,0,0,0.65), inset 0 0 10px rgba(155,89,182,0.1);
          transition: transform 0.18s, border-color 0.18s;
        "
        onclick="window.executeMidRunCardSelection('${card.id}')"
        onmouseenter="this.style.transform='translateY(-6px)'; this.style.borderColor='#df9ffb';"
        onmouseleave="this.style.transform='none'; this.style.borderColor='#9b59b6';">
          <div style="text-align:center; width:100%;">
            <strong style="color:#df9ffb; font-size:12px; display:block; margin-bottom:2px;">☀️ ${card.name}</strong>
            <span style="font-size:8px; color:#888; text-transform:uppercase; letter-spacing:0.5px;">AETHER INFUSION</span>
          </div>
          <div style="font-size:28px; margin: 10px 0;">🔮</div>
          <div style="font-size:9.5px; color:#ccc; text-align:center; line-height:1.35; min-height:55px;">
            ${card.desc}
          </div>
          <button class="btn-action" style="width:100%; font-size:10px; padding:4px 0; background:#9b59b6; font-weight:bold;" onpointerdown="event.stopPropagation();" ontouchstart="event.stopPropagation();" onclick="event.stopPropagation(); window.executeMidRunCardSelection('${card.id}')">DRAFT</button>
        </div>
      `;
    })
    .join("");

  let accShards = window.playerStats.crucibleAccumulatedShards || 0;
  let accCores = window.playerStats.crucibleAccumulatedCores || 0;
  let accGold = window.playerStats.crucibleAccumulatedGold || 0;
  let accXp = window.playerStats.crucibleAccumulatedXp || 0;

  let accumulatedPanelHtml = `
      <div style="background: rgba(0,0,0,0.55); border: 1.5px solid #9b59b680; border-radius: 8px; padding: 10px; margin: 0 auto 16px auto; display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; font-family: monospace; font-size: 10px; text-align: center; max-width: 420px; box-shadow: inset 0 0 10px #000;">
        <div style="background:#07030b; padding:4px; border-radius:4px; border:1px solid #222;">
          <span style="color:#aaa; display:block; font-size:8px; text-transform:uppercase;">Shards</span>
          <strong style="color:#df9ffb; font-size:12px;">+${accShards}</strong>
        </div>
        <div style="background:#07030b; padding:4px; border-radius:4px; border:1px solid #222;">
          <span style="color:#aaa; display:block; font-size:8px; text-transform:uppercase;">Cores</span>
          <strong style="color:#2ecc71; font-size:12px;">+${accCores}</strong>
        </div>
        <div style="background:#07030b; padding:4px; border-radius:4px; border:1px solid #222;">
          <span style="color:#aaa; display:block; font-size:8px; text-transform:uppercase;">Gold</span>
          <strong style="color:#f1c40f; font-size:12px;">+${window.formatNumber(accGold)}</strong>
        </div>
        <div style="background:#07030b; padding:4px; border-radius:4px; border:1px solid #222;">
          <span style="color:#aaa; display:block; font-size:8px; text-transform:uppercase;">XP</span>
          <strong style="color:#a855f7; font-size:12px;">+${window.formatNumber(accXp)}</strong>
        </div>
      </div>
    `;

  let canReroll = accShards >= 5;
  let rerollBtnHtml = canReroll
    ? `<button class="btn-action" style="background:#8e44ad; border-color:#fff; font-size:10px; padding:6px 16px; margin-bottom:15px; font-weight:bold; box-shadow:0 0 10px rgba(142,68,173,0.3);" onclick="window.rerollCrucibleMidRunDraft()">🔄 Reroll Options (Cost: 5 Shards)</button>`
    : `<button class="btn-action" style="background:#222; border-color:#333; color:#555; font-size:10px; padding:6px 12px; margin-bottom:15px; cursor:not-allowed;" disabled>🔄 Reroll Options (Requires 5 Shards)</button>`;

  overlay.innerHTML = `
        <div style="text-align:center; color:white; animation: toastFadeIn 0.3s ease-out; max-width:580px; width:95%;">
          <div style="font-size: 16px; font-weight: 950; color:#df9ffb; letter-spacing: 3px; text-transform: uppercase; text-shadow: 0 0 8px rgba(155,89,182,0.5); margin-bottom:4px;">✨ SELECT AN AETHER INFUSION ✨</div>
          <div style="font-size:10px; color:#aaa; margin-bottom:12px;">Wave ${window.playerStats.crucibleWave - 1} Clear! Choose a temporary card modifier to empower your run.</div>
          ${accumulatedPanelHtml}
          <div style="display:flex; gap:12px; justify-content:center; flex-wrap:wrap; margin-bottom:12px;">
            ${cardsHtml}
          </div>
          ${rerollBtnHtml}
        </div>
      `;
};

window.executeMidRunCardSelection = function (cardId) {
  let oldMaxHp = window.resolvePlayerStats().maxHp;

  window.playerStats.crucibleDraftDeck =
    window.playerStats.crucibleDraftDeck || [];
  window.playerStats.crucibleDraftDeck.push(cardId);

  // Invalidate character stat cache to capture modifications instantly
  window.invalidatePlayerStats();

  let newMaxHp = window.resolvePlayerStats().maxHp;
  window.playerStats.currentHp = Math.max(
    1,
    Math.min(
      newMaxHp,
      Math.floor((window.playerStats.currentHp / oldMaxHp) * newMaxHp),
    ),
  );

  let overlay = document.getElementById("crucible-midrun-draft-overlay");
  if (overlay) overlay.remove();

  if (window.SoundManager) window.SoundManager.play("spell");

  let card = window.CRUCIBLE_DRAFT_POOL.find((c) => c.id === cardId);
  window.pushHeaderToast(`⚡ Drafted: ${card.name}!`, "#9b59b6");
  window.pushLog(
    `<strong style="color:#df9ffb;">[CRUCIBLE DRAFT]</strong> Successfully added <strong style="color:#df9ffb;">${card.name}</strong> to your run's deck!`,
  );

  window.setPauseState(false);
  window.updateUI();
  window.saveGame();
};

window.rerollCrucibleMidRunDraft = function () {
  if ((window.playerStats.crucibleAccumulatedShards || 0) < 5) return;
  window.playerStats.crucibleAccumulatedShards -= 5;
  if (window.SoundManager) window.SoundManager.play("swing");
  window.openCrucibleMidRunDraftModal();
};

window.migrateLegacyTempersToRefund = function () {
  window.playerStats.slotUpgrades = window.playerStats.slotUpgrades || {
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
  };

  if (window.playerStats.hasRefundedLegacyTempers) return;

  let totalGoldRefund = 0;
  let materialsRefunded = {};

  let refundItem = (item) => {
    if (
      !item ||
      item.type === "artifact" ||
      !item.temperLevel ||
      item.temperLevel <= 0
    )
      return;

    let tempers = item.temperLevel;
    let baseCost = 100;
    let itemLvlMultiplier = Math.pow(
      1.045,
      Math.max(0, ((item.stageLevel || 1) - 1) * 2.5),
    );

    for (let t = 0; t < tempers; t++) {
      let stepGold = Math.floor(
        baseCost * Math.pow(1.5, t) * itemLvlMultiplier,
      );
      totalGoldRefund += stepGold;

      let stars = item.statsRolled === "UNIQUE" ? 5 : item.statsRolled || 0;
      let scrapName = window.getScrapYieldName
        ? window.getScrapYieldName(stars)
        : "Monster Soul";
      let stepScrapQty = (t + 1) * 2;

      materialsRefunded[scrapName] =
        (materialsRefunded[scrapName] || 0) + stepScrapQty;
    }
    item.temperLevel = 0; // Reset item temper Level to prevent duplicate scaling
  };

  // 1. Scan equipped items
  for (let k in window.equippedSlots) {
    if (window.equippedSlots[k]) refundItem(window.equippedSlots[k]);
  }

  // 2. Scan bag inventories
  if (window.inventory && window.inventory.EQUIP) {
    window.inventory.EQUIP.forEach(refundItem);
  }

  // Apply complete refunds
  if (totalGoldRefund > 0) {
    window.playerStats.coins =
      (window.playerStats.coins || 0) + totalGoldRefund;
    window.playerStats.totalGoldEarned =
      (window.playerStats.totalGoldEarned || 0) + totalGoldRefund;
  }
  for (let mat in materialsRefunded) {
    window.addEtcDrop(mat, materialsRefunded[mat]);
  }

  window.playerStats.hasRefundedLegacyTempers = true;

  if (totalGoldRefund > 0) {
    setTimeout(() => {
      let report = Object.keys(materialsRefunded)
        .map((k) => `${materialsRefunded[k]}x ${k}`)
        .join(", ");
      window.pushLog(
        `<strong style="color:#2ecc71;">[SYSTEM OVERHAUL] Individual item tempering has been discontinued. Refunded ${window.formatNumber(totalGoldRefund)} Gold and ${report} back to your sacks!</strong>`,
      );
      window.pushHeaderToast(
        "🛡️ Attunement Overhaul: Spent resources fully refunded!",
        "#2ecc71",
      );
      window.updateUI();
    }, 1500);
  } else {
    window.playerStats.hasRefundedLegacyTempers = true;
  }
};

window.spawnVoidSuppressionOrbs = function () {
  window.activeRiftOrbs = [];
  let maxOrbs = 3;
  let padX = 60;
  let padY = 60;
  let cvs = document.getElementById("gameCanvas");
  let w = cvs ? cvs.width : 750;
  let h = cvs ? cvs.height : 320;

  for (let i = 0; i < maxOrbs; i++) {
    let rx = window.randFloat(padX, w - padX);
    let ry = window.randFloat(padY, h - padY - 90); // Avoid overlapping bottom HUD/floor
    window.activeRiftOrbs.push({
      id: window.idCounter++,
      type: "void_suppression",
      x: rx,
      y: ry,
      radius: 14,
      hitRadius: 34, // Mobile-friendly hitbox target
      timer: 210, // 3.5 seconds
      maxTimer: 210,
    });
  }

  if (typeof window.pushLog === "function") {
    window.pushLog(
      "<span style='color:#ff007f; font-weight:bold;'>🌌 [RIFT RUPTURE] Void Suppression Orbs have emerged! Tap them quickly before they collapse!</span>",
    );
  }
  if (typeof window.pushHeaderToast === "function") {
    window.pushHeaderToast("🌌 Rift Rupture: Clear the Void Orbs!", "#ff007f");
  }
  window.SoundManager.play("spell");
};

window.handleOrbClick = function (orb, index) {
  if (orb.type === "anomalous_shard") {
    orb.hp--;

    // Spawn subtle rock chipping sparks on hit
    let colors = ["#2c3e50", "#7f8c8d", "#bdc3c7"];
    for (let i = 0; i < 5; i++) {
      let angle = Math.random() * Math.PI * 2;
      let vel = window.randFloat(1.5, 3.5);
      window.particles.push(
        window.ParticlePool.get(
          orb.x,
          orb.y - 10,
          Math.cos(angle) * vel,
          Math.sin(angle) * vel - 1,
          window.randFloat(1, 2.5),
          colors[Math.floor(Math.random() * colors.length)],
          1,
          window.randInt(15, 25),
        ),
      );
    }
    window.SoundManager.play("swing");

    if (orb.hp <= 0) {
      window.activeRiftOrbs.splice(index, 1);

      // Giant stone shattering explosion
      let shatterColors = ["#1a252f", "#34495e", "#ff2200", "#ffd700"];
      for (let i = 0; i < 20; i++) {
        let angle = Math.random() * Math.PI * 2;
        let vel = window.randFloat(3, 7);
        window.particles.push(
          window.ParticlePool.get(
            orb.x,
            orb.y - 12,
            Math.cos(angle) * vel,
            Math.sin(angle) * vel - 2,
            window.randFloat(2, 4.5),
            shatterColors[Math.floor(Math.random() * shatterColors.length)],
            1,
            window.randInt(25, 45),
          ),
        );
      }

      // Award progressive Stage-Scaled Gold payout
      let pCurrent = window.resolvePlayerStats();
      let goldReward = Math.ceil(
        (25 + window.playerStats.stage * 4) * pCurrent.gold,
      );
      window.playerStats.coins = BigNum.from(window.playerStats.coins).add(
        goldReward,
      );
      window.playerStats.totalGoldEarned = BigNum.from(
        window.playerStats.totalGoldEarned || 0,
      ).add(goldReward);

      window.effects.push({
        x: orb.x,
        y: orb.y - 20,
        text: `+${goldReward.toLocaleString()}g [SHATTERED]`,
        color: "#f1c40f",
        life: 55,
      });

      if (typeof window.pushLog === "function") {
        window.pushLog(
          "<span style='color:#2ecc71;'>✨ [SHATTERED] You successfully shattered the Anomalous Shard and salvaged its gold core!</span>",
        );
      }
      window.SoundManager.play("death");
      window.invalidatePlayerStats();
      window.updateUI();
    }
    return;
  }

  if (orb.type === "perfect_strike") {
    window.activeRiftOrbs.splice(index, 1);
    let p = window.resolvePlayerStats();
    let mobDef = window.mob ? window.mob.def || 0 : 0;

    // Rhythm Timing Sweet-Spot Assessment (10-25 frames remaining)
    let isPerfect = orb.timer >= 10 && orb.timer <= 25;
    let finalDmg = p.atk;

    if (isPerfect && window.mob) {
      // 1. Perfect Strike: Deals 5.0x raw damage, entirely bypassing defense (Armor Pierce)
      finalDmg = Math.ceil(finalDmg * 5.0);

      // Inflict 5 Sanguine Bleed stacks
      window.mob.bleedStacks = 5;
      window.mob.bleedTimer = 300;
      window.mob.bleedDmgPerSecond = Math.max(1, Math.ceil(p.atk * 0.15));

      // Spawn massive golden spark fireworks
      let colors = ["#ffd700", "#f1c40f", "#ffffff"];
      for (let i = 0; i < 25; i++) {
        let angle = Math.random() * Math.PI * 2;
        let vel = window.randFloat(3, 8);
        window.particles.push(
          window.ParticlePool.get(
            orb.x,
            orb.y,
            Math.cos(angle) * vel,
            Math.sin(angle) * vel - 1,
            window.randFloat(2, 4.5),
            colors[Math.floor(Math.random() * colors.length)],
            1,
            window.randInt(25, 45),
          ),
        );
      }

      window.effects.push({
        x: orb.x - 20,
        y: orb.y - 25,
        text: "⚡ PERFECT STRIKE!",
        color: "#ffd700",
        life: 60,
      });
      window.SoundManager.play("parry");

      if (window.playerStats.singularityState === "storing") {
        window.playerStats.singularityStoredDmg += finalDmg;
      } else {
        window.mob.hp = window.mob.hp.sub(finalDmg);
        window.mob.flashTimer = 8;
        window.spawnDamageEffect(finalDmg, "slash", true);
        window.damageHistory.push({ time: Date.now(), amount: finalDmg });
      }
    } else if (window.mob) {
      // 2. Early/Late Hit: Normal 1.0x damage, mitigated by armor
      finalDmg = Math.max(1, Math.ceil(finalDmg * (100 / (100 + mobDef))));

      // Standard sparks
      let colors = ["#bdc3c7", "#7f8c8d"];
      for (let i = 0; i < 8; i++) {
        let angle = Math.random() * Math.PI * 2;
        let vel = window.randFloat(1.5, 3.5);
        window.particles.push(
          window.ParticlePool.get(
            orb.x,
            orb.y,
            Math.cos(angle) * vel,
            Math.sin(angle) * vel - 1,
            window.randFloat(1, 2.5),
            colors[Math.floor(Math.random() * colors.length)],
            1,
            window.randInt(15, 25),
          ),
        );
      }

      window.effects.push({
        x: orb.x - 15,
        y: orb.y - 25,
        text: "GOOD HIT!",
        color: "#cbd5e1",
        life: 45,
      });
      window.SoundManager.play("swing");

      if (window.playerStats.singularityState === "storing") {
        window.playerStats.singularityStoredDmg += finalDmg;
      } else {
        window.mob.hp = window.mob.hp.sub(finalDmg);
        window.mob.flashTimer = 4;
        window.spawnDamageEffect(finalDmg, "slash", false);
        window.damageHistory.push({ time: Date.now(), amount: finalDmg });
      }
    }

    if (window.mob && window.mob.hp.lte(0)) window.handleMobDeath();
    window.invalidatePlayerStats();
    window.updateUI();
    return;
  }

  if (orb.type === "aetheric_spark") {
    let colors = ["#ffd700", "#ffffff", "#ffeaa7"];
    for (let i = 0; i < 10; i++) {
      let angle = Math.random() * Math.PI * 2;
      let vel = window.randFloat(1.5, 4);
      window.particles.push(
        window.ParticlePool.get(
          orb.x,
          orb.y,
          Math.cos(angle) * vel,
          Math.sin(angle) * vel,
          window.randFloat(1, 2.5),
          colors[Math.floor(Math.random() * colors.length)],
          1,
          window.randInt(15, 25),
        ),
      );
    }

    let curChain = orb.chainIndex;
    if (curChain < 4) {
      // Spawn next sequential combo link in the teleport chain
      window.spawnAethericSpark(curChain + 1);
      window.effects.push({
        x: orb.x,
        y: orb.y - 15,
        text: `✨ COMBO ${curChain + 1}!`,
        color: "#ffd700",
        life: 40,
      });
    } else {
      // 5th Spark popped! Trigger full Astral Awakening
      window.activeRiftOrbs = [];
      window.playerStats.sparkChainCount = 0;
      window.playerStats.astralAwakeningTimer = 900; // 15 seconds at 60 FPS

      // Explode huge golden rings
      for (let i = 0; i < 35; i++) {
        let angle = Math.random() * Math.PI * 2;
        let vel = window.randFloat(4, 9);
        window.particles.push(
          window.ParticlePool.get(
            orb.x,
            orb.y,
            Math.cos(angle) * vel,
            Math.sin(angle) * vel - 1,
            window.randFloat(2, 4.5),
            "#ffd700",
            1,
            window.randInt(30, 55),
          ),
        );
      }

      window.effects.push({
        x: window.hero.x + 12,
        y: window.hero.y - 20,
        text: "☀️ ASTRAL AWAKENING!",
        color: "#f1c40f",
        life: 75,
      });

      if (typeof window.pushLog === "function") {
        window.pushLog(
          "<span style='color:#f1c40f; font-weight:bold;'>☀️ [ASTRAL AWAKENING] You completed the Spark Chain! Grants +100% Total Damage and +15% Speed for 15 seconds!</span>",
        );
      }
      if (typeof window.pushHeaderToast === "function") {
        window.pushHeaderToast("☀️ Astral Awakening: Pure Power!", "#f1c40f");
      }
      window.SoundManager.play("revive");
      window.invalidatePlayerStats();
      window.updateUI();
    }
    return;
  }

  if (orb.type === "glimmering_pixie") {
    window.activeRiftOrbs.splice(index, 1);

    // Nature green forest burst sparkles on capture
    let colors = ["#2ecc71", "#a3fd83", "#ffffff", "#55efc4"];
    for (let i = 0; i < 20; i++) {
      let angle = Math.random() * Math.PI * 2;
      let vel = window.randFloat(2, 6);
      window.particles.push(
        window.ParticlePool.get(
          orb.x,
          orb.y,
          Math.cos(angle) * vel,
          Math.sin(angle) * vel - 1,
          window.randFloat(1.5, 3.5),
          colors[Math.floor(Math.random() * colors.length)],
          1,
          window.randInt(25, 45),
        ),
      );
    }

    window.SoundManager.play("fairy");

    // Dual-Reward Matrix: 40% chance of random +50% duration Elixir, 60% chance of progressive materials
    let rRoll = Math.random();
    if (rRoll < 0.4) {
      let pList = [
        "Attack Elixir",
        "Vitality Elixir",
        "Armored Elixir",
        "Haste Elixir",
      ];
      let chosenPot = pList[Math.floor(Math.random() * pList.length)];

      let p = window.resolvePlayerStats();
      let baseDuration = 18000; // 5 minutes base
      let extBonus = window.checkArtifactTrait("extend_buffs")
        ? 180 + window.getArtifactTemperLevel("extend_buffs") * 30
        : 0;
      let finalDuration = Math.floor((baseDuration + extBonus) * 1.5); // +50% duration bonus!

      if (chosenPot === "Attack Elixir") {
        window.playerStats.atkPotionTimer = Math.max(
          window.playerStats.atkPotionTimer || 0,
          finalDuration,
        );
        window.playerStats.atkPotionStrength = Math.max(
          window.playerStats.atkPotionStrength || 0,
          0.1,
        );
      } else if (chosenPot === "Vitality Elixir") {
        window.playerStats.hpPotionTimer = Math.max(
          window.playerStats.hpPotionTimer || 0,
          finalDuration,
        );
        window.playerStats.hpPotionStrength = Math.max(
          window.playerStats.hpPotionStrength || 0,
          0.1,
        );
      } else if (chosenPot === "Armored Elixir") {
        window.playerStats.defPotionTimer = Math.max(
          window.playerStats.defPotionTimer || 0,
          finalDuration,
        );
        window.playerStats.defPotionStrength = Math.max(
          window.playerStats.defPotionStrength || 0,
          0.1,
        );
      } else {
        window.playerStats.hastePotionTimer = Math.max(
          window.playerStats.hastePotionTimer || 0,
          finalDuration,
        );
        window.playerStats.hastePotionStrength = Math.max(
          window.playerStats.hastePotionStrength || 0,
          1,
        );
      }

      window.effects.push({
        x: orb.x - 15,
        y: orb.y - 20,
        text: `🧪 ${chosenPot.toUpperCase()} INFUSED (+50% Duration)!`,
        color: "#2ecc71",
        life: 65,
      });
      if (typeof window.pushLog === "function") {
        window.pushLog(
          `<span style='color:#2ecc71; font-weight:bold;'>🧚 [PIXIE] You caught the Glimmering Pixie! She infused you with a ${chosenPot} (+50% duration bonus)!</span>`,
        );
      }
    } else {
      let activeStage = window.playerStats.stage || 1;
      let scale = Math.max(1, Math.floor((activeStage - 1) / 10) + 1);
      let scrapName = window.getScrapYieldName(window.randInt(1, 4)); // Rolls Magic, Epic, or Legendary scrap
      let qty = window.randInt(1, 3);
      window.addEtcDrop(scrapName, qty);

      window.effects.push({
        x: orb.x - 10,
        y: orb.y - 20,
        text: `+${qty}x ${scrapName}!`,
        color: "#f1c40f",
        life: 55,
      });
      if (typeof window.pushLog === "function") {
        window.pushLog(
          `<span style='color:#2ecc71;'>🧚 [PIXIE] You caught the Glimmering Pixie! She gifted you ${qty}x ${scrapName}!</span>`,
        );
      }
    }
    window.invalidatePlayerStats();
    window.updateUI();
    return;
  }

  window.activeRiftOrbs.splice(index, 1);

  // Spawn visual burst particles
  let colors = ["#ff007f", "#8e44ad", "#e84393", "#ffffff"];
  for (let i = 0; i < 15; i++) {
    let angle = Math.random() * Math.PI * 2;
    let vel = window.randFloat(2, 5);
    window.particles.push(
      window.ParticlePool.get(
        orb.x,
        orb.y,
        Math.cos(angle) * vel,
        Math.sin(angle) * vel - 1,
        window.randFloat(1.5, 3.5),
        colors[Math.floor(Math.random() * colors.length)],
        1,
        window.randInt(20, 35),
      ),
    );
  }
  window.SoundManager.play("parry");

  // Check if all orbs have been successfully popped
  if (window.activeRiftOrbs.length === 0) {
    // Success: Cleanse debuffs & grant Purified Aegis
    if (window.playerStats.isCrucibleMode) {
      window.playerStats.crucibleActiveDebuff = null;
    }

    window.playerStats.purifiedAegisTimer = 480; // 8 seconds of absolute immunity
    window.playerStats.apathyDecayStacks = 0;
    window.playerStats.apathyDecayTimer = 0;
    window.invalidatePlayerStats();

    window.effects.push({
      x: window.hero.x + 12,
      y: window.hero.y - 15,
      text: "🛡️ PURIFIED AEGIS!",
      color: "#00ffff",
      life: 75,
    });

    if (typeof window.pushLog === "function") {
      window.pushLog(
        "<span style='color:#00ffff; font-weight:bold;'>✨ [PURIFIED AEGIS] All Void Orbs cleared! You are immune to all debuffs for 8 seconds!</span>",
      );
    }
    if (typeof window.pushHeaderToast === "function") {
      window.pushHeaderToast("🛡️ Purified Aegis: Debuff Immunity!", "#00ffff");
    }
    window.SoundManager.play("revive");
    window.updateUI();
  }
};

window.handleOrbExpiry = function (orb) {
  if (orb.type === "anomalous_shard") {
    let p = window.resolvePlayerStats();
    let dmg = Math.ceil(p.maxHp * 0.1); // 10% Max HP feedback penalty
    window.playerStats.currentHp = Math.max(
      1,
      window.playerStats.currentHp - dmg,
    );

    window.effects.push({
      x: orb.x,
      y: orb.y - 20,
      text: `-${dmg} [SHARD COLLAPSE]`,
      color: "#e74c3c",
      life: 45,
    });

    if (window.playerStats.currentHp <= 1) {
      window.playerStats.currentHp = 0;
      window.deathAnimationTimer = window.deathMaxFrames;
    }

    if (typeof window.pushLog === "function") {
      window.pushLog(
        `<span style='color:#e74c3c;'>🌌 [COLLAPSE] An Anomalous Shard collapsed, triggering an energy backfire of ${dmg} damage!</span>`,
      );
    }
    window.SoundManager.play("defeat");
    window.invalidatePlayerStats();
    window.updateUI();
    return;
  }

  if (orb.type === "aetheric_spark") {
    window.playerStats.sparkChainCount = 0;
    if (typeof window.pushLog === "function") {
      window.pushLog(
        "<span style='color:#7f8c8d;'>[SPARK] The Aetheric Spark decayed. Combo chain broken!</span>",
      );
    }
    window.SoundManager.play("swing");
    window.invalidatePlayerStats();
    window.updateUI();
    return;
  }

  if (orb.type === "glimmering_pixie") {
    let p = window.resolvePlayerStats();
    let stingDmg = Math.ceil(window.playerStats.currentHp * 0.1); // Drains 10% current HP
    window.playerStats.currentHp = Math.max(
      1,
      window.playerStats.currentHp - stingDmg,
    );

    window.effects.push({
      x: window.hero.x,
      y: window.hero.y - 20,
      text: `-${stingDmg} [AETHERIC WASP STING]`,
      color: "#e74c3c",
      life: 55,
    });

    if (window.playerStats.currentHp <= 1) {
      window.playerStats.currentHp = 0;
      window.deathAnimationTimer = window.deathMaxFrames;
    }

    if (typeof window.pushLog === "function") {
      window.pushLog(
        `<span style='color:#e74c3c;'>🐝 [STUNG] The Glimmering Pixie morphed and stung you, draining ${stingDmg} HP!</span>`,
      );
    }
    window.SoundManager.play("death");
    window.updateUI();
    return;
  }

  let p = window.resolvePlayerStats();
  let dmg = Math.ceil(p.maxHp * 0.06); // 6% Max HP damage
  window.playerStats.currentHp = Math.max(
    1,
    window.playerStats.currentHp - dmg,
  );

  // Stacking decay penalty
  window.playerStats.apathyDecayStacks = Math.min(
    3,
    (window.playerStats.apathyDecayStacks || 0) + 1,
  );
  window.playerStats.apathyDecayTimer = 300; // 5 seconds of decay

  window.effects.push({
    x: orb.x,
    y: orb.y - 20,
    text: `-${dmg} [VOID COLLAPSE]`,
    color: "#e74c3c",
    life: 45,
  });

  if (window.playerStats.currentHp <= 1) {
    window.playerStats.currentHp = 0;
    window.deathAnimationTimer = window.deathMaxFrames;
  }

  if (typeof window.pushLog === "function") {
    window.pushLog(
      `<span style='color:#e74c3c;'>🌌 [VOID COLLAPSE] An orb collapsed, inflicting ${dmg} damage and applying a stack of Apathy Decay!</span>`,
    );
  }
  window.SoundManager.play("death");
  window.updateUI();
};

window.spawnAnomalousShard = function () {
  let padX = 80;
  let cvs = document.getElementById("gameCanvas");
  let w = cvs ? cvs.width : 750;

  let activeStage = window.playerStats.stage || 1;
  if (window.playerStats.isDungeonMode && window.playerStats.currentDungeon) {
    let dType = window.playerStats.currentDungeon;
    activeStage = window.playerStats.currentDungeonStage[dType] || 1;
  }

  // Progressive tap scaling relative to stage depth
  let shardHP = 1 + Math.max(0, Math.min(7, Math.floor(activeStage / 150)));

  window.activeRiftOrbs.push({
    id: window.idCounter++,
    type: "anomalous_shard",
    x: window.randFloat(padX, w - padX),
    y: 226, // Aligned to ground floor line
    radius: 16,
    hitRadius: 36, // Mobile target area padding
    hp: shardHP,
    maxHp: shardHP,
    timer: 480, // Lasts 8 seconds
    maxTimer: 480,
  });

  if (typeof window.pushLog === "function") {
    window.pushLog(
      `<span style='color:#ff2200; font-weight:bold;'>🌋 [ANOMALY] An Anomalous Shard has erupted from the ground! Shatter it before it drains your speed! (Taps: ${shardHP})</span>`,
    );
  }
  window.SoundManager.play("block");
  window.invalidatePlayerStats();
  window.updateUI();
};

window.spawnPerfectStrikeReticle = function () {
  if (!window.mob || window.mob.hp.lte(0)) return;

  let mx = window.mob.x + window.mob.w / 2;
  let my = window.mob.y + window.mob.h / 2;

  window.activeRiftOrbs.push({
    id: window.idCounter++,
    type: "perfect_strike",
    x: mx,
    y: my,
    radius: 12,
    hitRadius: 36, // Generous mobile touch zone padding
    timer: 120, // 2 seconds
    maxTimer: 120,
  });

  window.SoundManager.play("swing");
};

window.spawnAethericConduit = function () {
  let padX = 100;
  let padY = 60;
  let cvs = document.getElementById("gameCanvas");
  let w = cvs ? cvs.width : 750;
  let h = cvs ? cvs.height : 320;

  // Generate start/end vectors on opposite sides of canvas play space
  let side = Math.random() > 0.5;
  let startX = side
    ? window.randFloat(padX, w / 2 - 60)
    : window.randFloat(w / 2 + 60, w - padX);
  let endX = !side
    ? window.randFloat(padX, w / 2 - 60)
    : window.randFloat(w / 2 + 60, w - padX);

  let startY = window.randFloat(padY, h - padY - 90);
  let endY = window.randFloat(padY, h - padY - 90);

  window.activeRiftOrbs.push({
    id: window.idCounter++,
    type: "aetheric_conduit",
    x: startX,
    y: startY,
    endX: endX,
    endY: endY,
    radius: 12,
    hitRadius: 36, // Mobile touch target padding
    timer: 300, // 5 seconds
    maxTimer: 300,
    progress: 0,
    connected: false,
  });

  if (typeof window.pushLog === "function") {
    window.pushLog(
      "<span style='color:#00d2ff; font-weight:bold;'>⚡ [CONDUIT] An Aetheric Conduit has emerged! Swipe from the start crystal to the end crystal to discharge it!</span>",
    );
  }
  window.SoundManager.play("fairy");
};

window.spawnAethericSpark = function (chainIndex) {
  let padX = 60;
  let padY = 60;
  let cvs = document.getElementById("gameCanvas");
  let w = cvs ? cvs.width : 750;
  let h = cvs ? cvs.height : 320;

  window.playerStats.sparkChainCount = chainIndex;

  // We replace active orbs list for sparks since it represents a sequential teleport chain
  window.activeRiftOrbs = [
    {
      id: window.idCounter++,
      type: "aetheric_spark",
      x: window.randFloat(padX, w - padX),
      y: window.randFloat(padY, h - padY - 90),
      radius: 12,
      hitRadius: 36, // Generous hitbox zone for mobile players
      timer: 180, // 3 seconds per chain link
      maxTimer: 180,
      chainIndex: chainIndex,
    },
  ];

  if (chainIndex === 0) {
    if (typeof window.pushLog === "function") {
      window.pushLog(
        "<span style='color:#ffd700; font-weight:bold;'>✨ [SPARK] An Aetheric Spark has appeared! Tap it to start a combo chain!</span>",
      );
    }
    window.SoundManager.play("fairy");
  } else {
    window.SoundManager.play("spell");
  }
  window.invalidatePlayerStats();
  window.updateUI();
};

window.spawnGlimmeringPixie = function () {
  let padX = 60;
  let padY = 60;
  let cvs = document.getElementById("gameCanvas");
  let w = cvs ? cvs.width : 750;
  let h = cvs ? cvs.height : 320;

  let startX = window.randFloat(padX, w - padX);
  let startY = window.randFloat(padY, h - padY - 90);

  window.activeRiftOrbs.push({
    id: window.idCounter++,
    type: "glimmering_pixie",
    x: startX,
    y: startY,
    targetX: window.randFloat(padX, w - padX),
    targetY: window.randFloat(padY, h - padY - 90),
    speed: window.randFloat(2.4, 3.8),
    pauseTimer: 0,
    radius: 10,
    hitRadius: 36, // Expanded touch target
    timer: 240, // 4 seconds
    maxTimer: 240,
  });

  if (typeof window.pushLog === "function") {
    window.pushLog(
      "<span style='color:#2ecc71; font-weight:bold;'>🧚 [PIXIE] A mischievous Glimmering Pixie is darting across the screen! Catch her before she stings you!</span>",
    );
  }
  window.SoundManager.play("fairy");
  window.updateUI();
};

window.executeConduitDischarge = function (orb, index) {
  window.activeRiftOrbs.splice(index, 1);

  let p = window.resolvePlayerStats();
  let baseSpell = p.atk * 0.25 * (1.0 + p.int * 0.01);
  if (window.playerStats.adrenalineTimer > 0) baseSpell *= 2;
  let spellDmg = Math.max(1, Math.ceil(baseSpell * 1.5)); // +50% Spell Damage multiplier

  if (window.mob && window.mob.hp.gt(0)) {
    let mobDef = window.mob.def || 0;
    let finalSpellDmg = Math.max(
      1,
      Math.ceil(spellDmg * (100 / (100 + mobDef))),
    );

    // 1. Detonate FIRE Tome Spell
    window.mob.hp = window.mob.hp.sub(finalSpellDmg);
    window.spawnDamageEffect(finalSpellDmg, "fire", false);
    window.damageHistory.push({ time: Date.now(), amount: finalSpellDmg });
    window.SoundManager.play("spell_fire");

    // 2. Detonate LIGHTNING Tome Spell
    window.mob.hp = window.mob.hp.sub(finalSpellDmg);
    window.spawnDamageEffect(finalSpellDmg, "lightning", false);
    window.damageHistory.push({ time: Date.now(), amount: finalSpellDmg });
    window.SoundManager.play("spell_lightning");

    // 3. Detonate FROST Tome Spell
    window.mob.hp = window.mob.hp.sub(finalSpellDmg);
    window.spawnDamageEffect(finalSpellDmg, "frost", false);
    window.damageHistory.push({ time: Date.now(), amount: finalSpellDmg });
    window.SoundManager.play("spell_frost");

    // Spawn rich tri-color elements particles
    let colors = ["#f1c40f", "#e67e22", "#3498db", "#ffffff"];
    for (let i = 0; i < 30; i++) {
      let angle = Math.random() * Math.PI * 2;
      let vel = window.randFloat(3, 9);
      window.particles.push(
        window.ParticlePool.get(
          window.mob.x + window.mob.w / 2,
          window.mob.y + window.mob.h / 2,
          Math.cos(angle) * vel,
          Math.sin(angle) * vel - 1,
          window.randFloat(2, 4.5),
          colors[Math.floor(Math.random() * colors.length)],
          1,
          window.randInt(25, 45),
        ),
      );
    }

    // Completely Reset Weapon swing timer delay
    window.hero.attackTimer = 0;
    if (window.playerStats.galeResonanceTimer > 0) {
      window.playerStats.galeCharges = 20; // Instant max charges for Gale Glaive
    }

    window.effects.push({
      x: orb.endX - 25,
      y: orb.endY - 20,
      text: "⚡ CONDUIT DISCHARGE!",
      color: "#00d2ff",
      life: 65,
    });

    if (typeof window.pushLog === "function") {
      window.pushLog(
        "<span style='color:#00d2ff; font-weight:bold;'>⚡ [CONDUIT] Pathway connected! Discharged Aetheric energy, launching triple spells and resetting active cooldowns!</span>",
      );
    }
    window.SoundManager.play("revive");
    if (window.mob.hp.lte(0)) window.handleMobDeath();
    window.updateUI();
  }
};
