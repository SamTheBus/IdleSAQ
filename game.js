/* ==========================================================================
   PRIMARY PURPOSE: Core Engine, Game Loop, Offline Progress, Save Integrity,
   and Developer Panel Command Routing.
   ========================================================================= */

let canvas, ctx;

// --- SYSTEM FUNCTIONS ---

window.saveGame = function() {
    let saveData = { playerStats: window.playerStats, equippedSlots: window.equippedSlots, inventory: window.inventory, idCounter: window.idCounter, logsHistory: window.logsHistory, frozenItemDb: window.frozenItemDb, lastSaveTime: window.lastUpdateTime };
    localStorage.setItem('idle_game_v11', JSON.stringify(saveData));
};

setInterval(() => { window.saveGame(); }, 60000);
window.addEventListener('beforeunload', window.saveGame);

window.hardResetGame = function() {
    if (typeof window.showCustomConfirm === "function") {
        window.showCustomConfirm(
            "🚨 Delete Save File?",
            "WARNING: This will permanently delete your entire save file and progress! Are you absolutely sure you want to start over?",
            "Proceed", "Cancel", "#e74c3c",
            function() {
                window.showCustomConfirm(
                    "🚨 Confirm Wipe",
                    "THIS CANNOT BE UNDONE! Are you 100% sure you want to delete everything?",
                    "Wipe Everything", "Cancel", "#e74c3c",
                    function() {
                        window.removeEventListener('beforeunload', window.saveGame);
                        localStorage.removeItem('idle_game_v11');
                        window.location.reload();
                    }
                );
            }
        );
    }
};

window.gainXp = function(amount, silent = false) {
    let expBonusMult = 1.0 + ((window.playerStats.prestigeUpgrades?.exp || 0) * 0.10);

    if (window.equippedSlots.subweapon && window.equippedSlots.subweapon.isUniqueChronicle && !window.playerStats.isDungeonMode && !window.playerStats.isCrucibleMode) {
        let historicalPeakLvl = window.playerStats.historicalPeakLvl || window.playerStats.level;
        if (window.playerStats.level < Math.floor(historicalPeakLvl * 0.75)) {
            expBonusMult += 2.0;
        }
    }
    if (window.playerStats.unlockedAchievements && window.AchievementsData) {
        window.playerStats.unlockedAchievements.forEach(id => {
            let ach = window.AchievementsData.find(a => a.id === id);
            if (ach && ach.stats && ach.stats.expPct) {
                expBonusMult += ach.stats.expPct;
            }
        });
    }
    amount = Math.ceil(amount * expBonusMult);

    window.playerStats.xp += amount;
    if (window.playerStats.runXp !== undefined) window.playerStats.runXp += amount; else window.playerStats.runXp = amount;

    let leveledUp = false;
    while (window.playerStats.xp >= window.playerStats.xpReq) {
        window.playerStats.xp -= window.playerStats.xpReq;
        window.playerStats.level++;
        window.playerStats.sp += 3;
        if (window.draftAllocations !== null) window.draftSP += 3;
        window.playerStats.xpReq = Math.floor(window.playerStats.xpReq * 1.2);
        leveledUp = true;
    }
    if (leveledUp && !silent) {
        if(typeof window.pushLog === "function") window.pushLog(`<span style='color:#f1c40f; font-weight:bold;'>⭐ LEVEL UP! You are now Level ${window.playerStats.level}! +3 SP</span>`);
        if(typeof window.pushHeaderToast === "function") window.pushHeaderToast(`⭐ LEVEL UP! Level ${window.playerStats.level}`, "#f1c40f");
        let p = window.resolvePlayerStats();
        window.playerStats.currentHp = p.maxHp;
        if (typeof window.checkAchievements === "function") window.checkAchievements();
    }
    if (typeof window.updateUI === "function") window.updateUI();
};

window.applyOfflineGains = function(offlineMs) {
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

    let totalGold = 0; let totalXp = 0; let totalKills = 0;
    let stagesGained = 0; let diedOffline = false; let deathStage = 0;
    let itemsDropped = []; let scrapsGainedMap = {};

    function recordScrapGained(name, amount) {
        if (!scrapsGainedMap[name]) scrapsGainedMap[name] = 0;
        scrapsGainedMap[name] += amount;
        const useItems = ["Attack Elixir", "Greater Attack Elixir", "Supernal Attack Elixir", "Vitality Elixir", "Greater Vitality Elixir", "Supernal Vitality Elixir", "Armored Elixir", "Greater Armored Elixir", "Supernal Armored Elixir", "Haste Elixir", "Greater Haste Elixir", "Supernal Haste Elixir", "SP Reset Scroll", "PP Reset Scroll"];
        if (useItems.includes(name)) {
            if (!window.inventory.USE[name]) window.inventory.USE[name] = 0;
            window.inventory.USE[name] += amount;
        } else {
            if (!window.inventory.ETC[name]) window.inventory.ETC[name] = 0;
            window.inventory.ETC[name] += amount;
        }
    }

    let maxBag = window.getMaxBagSlots();
    let initialEquipIds = new Set(window.inventory.EQUIP.map(item => item.id));
    let initialArtifactIds = new Set(window.inventory.ARTIFACT.map(item => item.id));
    let equipTypesList = ["weapon", "subweapon", "helmet", "chest", "leggings", "overall", "boots"];

    let originalBuffs = {
            atk: window.playerStats.atkPotionTimer, hp: window.playerStats.hpPotionTimer, def: window.playerStats.defPotionTimer,
            haste: window.playerStats.hastePotionTimer, frenzy: window.playerStats.frenzyTimer, adrenaline: window.playerStats.adrenalineTimer
        };

        let maxStagesToAdvance = 100;
        let stagesAdvancedCount = 0;

        while (remainingSeconds > 0) {
            let elapsedFrames = elapsedSeconds * 60;
            window.playerStats.atkPotionTimer = Math.max(0, originalBuffs.atk - elapsedFrames);
            window.playerStats.hpPotionTimer = Math.max(0, originalBuffs.hp - elapsedFrames);
            window.playerStats.defPotionTimer = Math.max(0, originalBuffs.def - elapsedFrames);
            window.playerStats.hastePotionTimer = Math.max(0, originalBuffs.haste - elapsedFrames);
            window.playerStats.frenzyTimer = Math.max(0, originalBuffs.frenzy - elapsedFrames);
            window.playerStats.adrenalineTimer = Math.max(0, originalBuffs.adrenaline - elapsedFrames);

            let p = window.resolvePlayerStats();
            let effMultiplier = 1 + (p.critChance * (p.critDamage - 1));
            let playerDps = Math.max(1, p.atk * effMultiplier * (60 / p.idleAttackSpeed));

            let killsNeededForStage = 5 - window.playerStats.killCount;

            // Dynamically scale growth rates to form an escalating plateau soft wall
            let growthRate = 1.06 + (currentStage * 0.00015);
            let expScale = Math.pow(growthRate, currentStage);

            let mobHp = 15 * expScale;
            let bossHp = 60 * expScale;
            let mobDef = Math.floor(1.2 * expScale);
            let bossDef = Math.floor(6.0 * expScale);

            let blendedMobHp = (1 - p.rareSpawn) * mobHp + p.rareSpawn * (2.5 * mobHp);
            let blendedMobDef = (1 - p.rareSpawn) * mobDef + p.rareSpawn * (1.5 * mobDef);

            // Mitigate player offline DPS curves smoothly against average mob/boss defenses
            let playerDpsMitigatedMob = playerDps * (100 / (100 + blendedMobDef));
            let playerDpsMitigatedBoss = playerDps * (100 / (100 + bossDef));

            let ttkMob = blendedMobHp / Math.max(1, playerDpsMitigatedMob);
            let ttkBoss = bossHp / Math.max(1, playerDpsMitigatedBoss);
            let cycleTime = Math.max(0.5, Math.min(300, ((5 * ttkMob + ttkBoss) / 6) + 10.0));

            let mobDmg = 5.2 * expScale;
            let netMobDmg = Math.max(1, Math.ceil(mobDmg * (100 / (100 + p.def))));
            let bossTtk = bossHp / Math.max(1, playerDpsMitigatedBoss);
            let bossHits = Math.floor(bossTtk / 2);
        let bossDmg = 20 * expScale;
        let bossNetDmg = Math.max(1, Math.ceil(bossDmg * (100 / (100 + p.def))));
        let bossDmgTaken = bossHits * bossNetDmg;
        let bossVampHeal = window.checkArtifactTrait("vampirism") ? Math.min(Math.floor((playerDps * bossTtk) * 0.03), Math.ceil(p.maxHp * 0.05 * (bossTtk * (60 / p.idleAttackSpeed)))) : 0;
        let bossNetDmgTaken = Math.max(0, bossDmgTaken - bossVampHeal);

        let cumulativeStageDamage = (netMobDmg * killsNeededForStage) + bossNetDmgTaken;
        if (cumulativeStageDamage > p.maxHp && !window.checkArtifactTrait("second_wind")) {
            diedOffline = true; deathStage = currentStage; stagesAdvancedCount = maxStagesToAdvance;
        }

        let timeNeededForStage = (killsNeededForStage + 1) * cycleTime;
        let hitStageCap = currentStage >= (window.playerStats.maxStage || 1);

        if (timeNeededForStage <= remainingSeconds && stagesAdvancedCount < maxStagesToAdvance && !diedOffline && !window.playerStats.isFarmingLoop && !hitStageCap) {
            remainingSeconds -= timeNeededForStage; elapsedSeconds += timeNeededForStage; totalKills += (killsNeededForStage + 1);

            for (let k = 0; k < killsNeededForStage; k++) {
                let isRare = Math.random() < p.rareSpawn;
                totalGold += Math.ceil(Math.floor(2 * expScale * (isRare ? 4 : 1)) * p.gold);
                totalXp += Math.floor(5 * expScale * (isRare ? 3 : 1));
                let dropR = isRare ? 0.005 : 0.001;
                if (Math.random() < (dropR * p.drop * window.state.efficiency)) rollOfflineItem(false, currentStage, isRare);
                if (typeof window.rollPotionDrop === "function") {
                    let rolledPot = window.rollPotionDrop(false, isRare, true);
                    if (rolledPot) recordScrapGained(rolledPot, 1);
                }
            }

            totalGold += Math.ceil(Math.floor(15 * expScale) * p.gold);
                        totalXp += Math.floor(25 * expScale);
                        if (Math.random() < (0.01 * p.drop * window.state.efficiency)) { if (typeof window.rollEquipmentDrop === "function") window.rollEquipmentDrop(true, currentStage, false); }
                        if (typeof window.rollPotionDrop === "function") {
                            let rolledBossPot = window.rollPotionDrop(true, false, true);
                            if (rolledBossPot) recordScrapGained(rolledBossPot, 1);
                        }

                        // Gated, highly restricted key and shard parameters in offline progress simulation
                        if (currentStage >= 600 && Math.random() < 0.01) recordScrapGained("Eridium Shard", 1);
                        if (currentStage >= 200 && Math.random() < 0.002) recordScrapGained("Gacha Key", 1);

                        currentStage++; stagesGained++; stagesAdvancedCount++; window.playerStats.killCount = 0;
                    } else {
            let partialKills = Math.floor(remainingSeconds / cycleTime);
            if (partialKills > 0) {
                totalKills += partialKills; let elapsedForKills = partialKills * cycleTime;
                elapsedSeconds += elapsedForKills; remainingSeconds -= elapsedForKills;

                for (let k = 0; k < partialKills; k++) {
                    let isRare = Math.random() < p.rareSpawn;
                    totalGold += Math.ceil(Math.floor(2 * expScale * (isRare ? 4 : 1)) * p.gold);
                    totalXp += Math.floor(5 * expScale * (isRare ? 3 : 1));
                    let dropR = isRare ? 0.005 : 0.001;
                    if (Math.random() < (dropR * p.drop * window.state.efficiency)) rollOfflineItem(false, currentStage, isRare);
                    if (typeof window.rollPotionDrop === "function") {
                        let rolledPartialPot = window.rollPotionDrop(false, isRare, true);
                        if (rolledPartialPot) recordScrapGained(rolledPartialPot, 1);
                    }
                }
            }
            remainingSeconds = 0;
        }
    }

    let totalElapsedFrames = offlineSeconds * 60;
    window.playerStats.atkPotionTimer = Math.max(0, originalBuffs.atk - totalElapsedFrames);
    window.playerStats.hpPotionTimer = Math.max(0, originalBuffs.hp - totalElapsedFrames);
    window.playerStats.defPotionTimer = Math.max(0, originalBuffs.def - totalElapsedFrames);
    window.playerStats.hastePotionTimer = Math.max(0, originalBuffs.haste - totalElapsedFrames);
    window.playerStats.frenzyTimer = Math.max(0, originalBuffs.frenzy - totalElapsedFrames);
    window.playerStats.adrenalineTimer = Math.max(0, originalBuffs.adrenaline - totalElapsedFrames);

    function rollOfflineItem(isBossKill, stageNum, isRareMob) {
        let pCurrent = window.resolvePlayerStats();
        let chosenType = equipTypesList[Math.floor(Math.random() * equipTypesList.length)];
        let statLinesCount = 0; let luckMultiplier = pCurrent.qly; let rollVal = Math.random() * 100;

        let chance5 = (luckMultiplier >= 2.0) ? (0.02 * luckMultiplier) : 0;
        let chance4 = (luckMultiplier >= 1.5) ? (0.16 * luckMultiplier) : 0;

        if (rollVal < chance5) statLinesCount = 5;
        else if (rollVal < (chance5 + chance4)) statLinesCount = 4;
        else if (rollVal < (0.80 * luckMultiplier)) statLinesCount = 3;
        else if (rollVal < (4.00 * luckMultiplier)) statLinesCount = 2;
        else if (rollVal < (15.00 * luckMultiplier)) statLinesCount = 1;

        let stageScale = Math.floor((stageNum - 1) / 10) + 1;
        let newItem = window.createItemObject(chosenType, statLinesCount, stageScale, 0);

        if (newItem.type !== "artifact" && window.playerStats.autoSalvageThreshold !== undefined && window.playerStats.autoSalvageThreshold >= 0) {
            if (newItem.statsRolled <= window.playerStats.autoSalvageThreshold) {
                let rolledTier = newItem.statsRolled; let scrapName = window.getScrapYieldName(rolledTier);
                let yieldAmount = Math.floor(Math.random() * 3) + 1; recordScrapGained(scrapName, yieldAmount);
                window.playerStats.itemsSalvaged = (window.playerStats.itemsSalvaged || 0) + 1;

                for (let t = rolledTier - 1; t >= 0; t--) {
                    if (Math.random() < 0.60) {
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
                window.inventory.ARTIFACT.push(newItem); itemsDropped.push(newItem);
            } else {
                let newlyAddedArts = window.inventory.ARTIFACT.filter(item => !initialArtifactIds.has(item.id) && !item.locked);
                if (newlyAddedArts.length > 0) {
                    newlyAddedArts.sort((a, b) => a.stageLevel - b.stageLevel);
                    let worstArt = newlyAddedArts[0];
                    if (newItem.stageLevel > worstArt.stageLevel) {
                        recordScrapGained("Astral Essence", Math.floor(Math.random() * 2) + 1);
                        let wIndex = window.inventory.ARTIFACT.findIndex(item => item.id === worstArt.id);
                        if (wIndex !== -1) window.inventory.ARTIFACT.splice(wIndex, 1);
                        window.inventory.ARTIFACT.push(newItem); itemsDropped.push(newItem);
                        let droppedIdx = itemsDropped.findIndex(x => x.id === worstArt.id);
                        if (droppedIdx !== -1) itemsDropped.splice(droppedIdx, 1);
                    } else { recordScrapGained("Astral Essence", Math.floor(Math.random() * 2) + 1); }
                } else { recordScrapGained("Astral Essence", Math.floor(Math.random() * 2) + 1); }
            }
        } else {
            if (window.inventory.EQUIP.length < maxBag) {
                window.inventory.EQUIP.push(newItem); itemsDropped.push(newItem);
            } else {
                let newlyAddedEquip = window.inventory.EQUIP.filter(item => !initialEquipIds.has(item.id) && !item.locked);
                if (newlyAddedEquip.length > 0) {
                    newlyAddedEquip.sort((a, b) => {
                        if (a.statsRolled !== b.statsRolled) return a.statsRolled - b.statsRolled;
                        return a.stageLevel - b.stageLevel;
                    });
                    let worstEquip = newlyAddedEquip[0];
                    if (newItem.statsRolled > worstEquip.statsRolled || (newItem.statsRolled === worstEquip.statsRolled && newItem.stageLevel > worstEquip.stageLevel)) {
                        let rolledTier = worstEquip.statsRolled; let scrapName = window.getScrapYieldName(rolledTier);
                        let yieldAmount = Math.floor(Math.random() * 3) + 1; recordScrapGained(scrapName, yieldAmount);
                        for (let t = rolledTier - 1; t >= 0; t--) {
                            if (Math.random() < 0.60) recordScrapGained(window.getScrapYieldName(t), Math.floor(Math.random() * 2) + 1);
                        }
                        let wIndex = window.inventory.EQUIP.findIndex(item => item.id === worstEquip.id);
                        if (wIndex !== -1) window.inventory.EQUIP.splice(wIndex, 1);
                        window.inventory.EQUIP.push(newItem); itemsDropped.push(newItem);
                        let droppedIdx = itemsDropped.findIndex(x => x.id === worstEquip.id);
                        if (droppedIdx !== -1) itemsDropped.splice(droppedIdx, 1);
                    } else {
                        let rolledTier = newItem.statsRolled; let scrapName = window.getScrapYieldName(rolledTier);
                        let yieldAmount = Math.floor(Math.random() * 3) + 1; recordScrapGained(scrapName, yieldAmount);
                        for (let t = rolledTier - 1; t >= 0; t--) {
                            if (Math.random() < 0.60) recordScrapGained(window.getScrapYieldName(t), Math.floor(Math.random() * 2) + 1);
                        }
                    }
                } else {
                    let rolledTier = newItem.statsRolled; let scrapName = window.getScrapYieldName(rolledTier);
                    let yieldAmount = Math.floor(Math.random() * 3) + 1; recordScrapGained(scrapName, yieldAmount);
                    for (let t = rolledTier - 1; t >= 0; t--) {
                        if (Math.random() < 0.60) recordScrapGained(window.getScrapYieldName(t), Math.floor(Math.random() * 2) + 1);
                    }
                }
            }
        }
    }

    window.playerStats.coins += totalGold;
    window.playerStats.totalGoldEarned = (window.playerStats.totalGoldEarned || 0) + totalGold;
    window.playerStats.totalLifetimeKills = (window.playerStats.totalLifetimeKills || 0) + totalKills;
    window.playerStats.stage = currentStage;
    window.playerStats.maxStage = Math.max(window.playerStats.maxStage || 1, window.playerStats.stage);
    window.playerStats.lifetimePeakStage = Math.max(window.playerStats.lifetimePeakStage || 1, window.playerStats.maxStage);
    window.gainXp(totalXp, true);

    if (typeof window.showOfflineSummaryModal === "function") {
        window.showOfflineSummaryModal(offlineSeconds, originalStage, currentStage, totalGold, totalXp, totalKills, itemsDropped, scrapsGainedMap, diedOffline, deathStage);
    }
    return offlineSeconds * 1000;
};

window.loadGame = function() {
    let data = localStorage.getItem('idle_game_v11');
    if (data) {
        try {
            let parsed = JSON.parse(data);
            window.playerStats = { ...window.playerStats, ...parsed.playerStats };
            window.equippedSlots = parsed.equippedSlots || window.equippedSlots;

            if (window.playerStats.autoSalvageThreshold === undefined) {
                window.playerStats.autoSalvageThreshold = -1;
            }
            window.inventory = parsed.inventory || { EQUIP: [], ARTIFACT: [], ETC: {}, USE: {} };
            if (!window.inventory.ARTIFACT) { window.inventory.ARTIFACT = []; }
            if (!window.inventory.ETC) { window.inventory.ETC = {}; }
            if (!window.inventory.USE) { window.inventory.USE = {}; }

            const useItemsList = [
                "Attack Elixir", "Greater Attack Elixir", "Supernal Attack Elixir",
                "Vitality Elixir", "Greater Vitality Elixir", "Supernal Vitality Elixir",
                "Armored Elixir", "Greater Armored Elixir", "Supernal Armored Elixir",
                "Haste Elixir", "Greater Haste Elixir", "Supernal Haste Elixir",
                "SP Reset Scroll", "PP Reset Scroll"
            ];
            useItemsList.forEach(item => {
                if (window.inventory.ETC && window.inventory.ETC[item]) {
                    if (!window.inventory.USE) window.inventory.USE = {};
                    window.inventory.USE[item] = (window.inventory.USE[item] || 0) + window.inventory.ETC[item];
                    delete window.inventory.ETC[item];
                }
            });

            if (window.inventory.EQUIP) {
                for (let i = window.inventory.EQUIP.length - 1; i >= 0; i--) {
                    if (window.inventory.EQUIP[i] && window.inventory.EQUIP[i].type === "artifact") {
                        window.inventory.ARTIFACT.push(window.inventory.EQUIP[i]);
                        window.inventory.EQUIP.splice(i, 1);
                    }
                }
            }

            window.idCounter = parsed.idCounter || window.idCounter;
            window.logsHistory = parsed.logsHistory || window.logsHistory;
            window.frozenItemDb = parsed.frozenItemDb || window.frozenItemDb;

            if (window.playerStats.runKills === undefined) window.playerStats.runKills = 0;
            if (window.playerStats.runGold === undefined) window.playerStats.runGold = 0;
            if (window.playerStats.runXp === undefined) window.playerStats.runXp = 0;
            if (window.playerStats.killedBy === undefined) window.playerStats.killedBy = "Unknown Foe";
            if (window.playerStats.killedByMob === undefined) window.playerStats.killedByMob = null;

            if (window.playerStats.dungeonPeaks === undefined) window.playerStats.dungeonPeaks = { equip: 1, gold: 1, mat: 1 };
            if (window.playerStats.currentDungeonStage === undefined) window.playerStats.currentDungeonStage = { equip: 1, gold: 1, mat: 1 };
            if (window.playerStats.astralShards === undefined) window.playerStats.astralShards = 0;
            if (window.playerStats.crucibleWave === undefined) window.playerStats.crucibleWave = 1;
            if (window.playerStats.cruciblePeak === undefined) window.playerStats.cruciblePeak = 1;
            if (window.playerStats.crucibleStartWave === undefined) window.playerStats.crucibleStartWave = 1;
            if (window.playerStats.isCrucibleMode === undefined) window.playerStats.isCrucibleMode = false;
            if (window.playerStats.crucibleKills === undefined) window.playerStats.crucibleKills = 0;

            if (!window.playerStats.level) {
                window.playerStats.level = 1; window.playerStats.xp = 0; window.playerStats.sp = 0;
            }

            if (window.playerStats.spAllocations) {
                let legacyAllocKeys = ['spHp', 'spAtk', 'spDef', 'spCrit', 'spCritDmg', 'spBlock', 'spParry', 'spSpd'];
                let refundedSp = 0;
                legacyAllocKeys.forEach(k => {
                    if (window.playerStats.spAllocations[k] > 0) {
                        refundedSp += window.playerStats.spAllocations[k];
                        window.playerStats.spAllocations[k] = 0;
                    }
                });
                if (refundedSp > 0) {
                    window.playerStats.sp += refundedSp;
                    setTimeout(() => {
                        if(typeof window.pushLog === "function") window.pushLog(`<strong style="color:#2ecc71;">[MIGRATION] Secondary attribute direct spend is discontinued. Refunded ${refundedSp} Skill Points to spend on STR, DEX, or INT!</strong>`);
                    }, 1000);
                }
            }

            window.playerStats.xpReq = Math.floor(250 * Math.pow(1.2, window.playerStats.level - 1));
            if (!window.playerStats.spAllocations) {
                window.playerStats.spAllocations = { spHp: 0, spAtk: 0, spDef: 0, spCrit: 0, spCritDmg: 0, spBlock: 0, spParry: 0, spSpd: 0, spStr: 0, spDex: 0, spInt: 0 };
            }
            if (window.playerStats.spAllocations.spStr === undefined) {
                window.playerStats.spAllocations.spStr = 0; window.playerStats.spAllocations.spDex = 0; window.playerStats.spAllocations.spInt = 0;
                window.playerStats.baseStr = 5; window.playerStats.baseDex = 5; window.playerStats.baseInt = 5; window.playerStats.baseFairySpawn = 1.0;
            }
            if (!window.playerStats.baseRareSpawn) window.playerStats.baseRareSpawn = 0.01;
            if (!window.playerStats.baseFairySpawn) window.playerStats.baseFairySpawn = 1.0;
            if (!window.playerStats.maxStage) window.playerStats.maxStage = window.playerStats.stage || 1;
            if (!window.playerStats.targetsRequired || window.playerStats.targetsRequired === 7) window.playerStats.targetsRequired = 5;
            if (!window.playerStats.shopItems || (window.playerStats.shopItems.length > 0 && window.playerStats.shopItems[0].atk === undefined)) {
                window.playerStats.shopItems = []; window.playerStats.shopRefreshTime = 0;
            }
            if (window.playerStats.frenzyKillCount === undefined) window.playerStats.frenzyKillCount = 0;

            if (typeof window.recalculateItemStats === "function") {
                for (let key in window.equippedSlots) {
                    if (window.equippedSlots[key]) window.recalculateItemStats(window.equippedSlots[key]);
                }
                if (window.inventory.EQUIP) {
                    window.inventory.EQUIP.forEach(item => {
                        if (item) window.recalculateItemStats(item);
                    });
                }
                if (window.inventory.ARTIFACT) {
                    window.inventory.ARTIFACT.forEach(item => {
                        if (item) window.recalculateItemStats(item);
                    });
                }
            }
            if (window.playerStats.atkPotionTimer === undefined) window.playerStats.atkPotionTimer = 0;
            if (window.playerStats.hpPotionTimer === undefined) window.playerStats.hpPotionTimer = 0;
            if (window.playerStats.defPotionTimer === undefined) window.playerStats.defPotionTimer = 0;
            if (window.playerStats.hastePotionTimer === undefined) window.playerStats.hastePotionTimer = 0;

            if (window.playerStats.unlockedAchievements === undefined) window.playerStats.unlockedAchievements = [];
            if (window.playerStats.totalGoldEarned === undefined) window.playerStats.totalGoldEarned = window.playerStats.coins || 0;
            if (window.playerStats.totalTempers === undefined) window.playerStats.totalTempers = 0;
            if (window.playerStats.totalEnchants === undefined) window.playerStats.totalEnchants = 0;
            if (window.playerStats.riftGuardiansSlain === undefined) window.playerStats.riftGuardiansSlain = 0;
            if (window.playerStats.elixirsConsumed === undefined) window.playerStats.elixirsConsumed = 0;
            if (window.playerStats.itemsSalvaged === undefined) window.playerStats.itemsSalvaged = 0;
            if (window.playerStats.volumeMaster === undefined) window.playerStats.volumeMaster = 0.5;
            if (window.playerStats.volumeSFX === undefined) window.playerStats.volumeSFX = 0.8;
            if (window.playerStats.mute === undefined) window.playerStats.mute = false;

            if (window.playerStats.prestigePoints === undefined) window.playerStats.prestigePoints = 0;
            if (window.playerStats.prestigeUpgrades === undefined) {
                window.playerStats.prestigeUpgrades = { bag: 0, gold: 0, exp: 0, drop: 0, atk: 0, fort: 0, fairy: 0 };
            } else {
                window.playerStats.prestigeUpgrades.atk = window.playerStats.prestigeUpgrades.atk || 0;
                window.playerStats.prestigeUpgrades.fort = window.playerStats.prestigeUpgrades.fort || 0;
                window.playerStats.prestigeUpgrades.fairy = window.playerStats.prestigeUpgrades.fairy || 0;
            }
            if (window.playerStats.prestigeCount === undefined) window.playerStats.prestigeCount = 0;
            if (window.playerStats.lifetimePeakStage === undefined) window.playerStats.lifetimePeakStage = window.playerStats.maxStage || 1;

            window.playerStats.isPrestigeBossMode = false;
            window.playerStats.prestigeApproachTimer = 0;

            if (window.playerStats.vendingQLevel === undefined) window.playerStats.vendingQLevel = 0;
            if (window.playerStats.shopQLevel === undefined) window.playerStats.shopQLevel = 0;
            if (window.playerStats.globalQLevel === undefined) window.playerStats.globalQLevel = 0;
            if (window.playerStats.fairiesClicked === undefined) window.playerStats.fairiesClicked = 0;
            if (window.playerStats.deathCount === undefined) window.playerStats.deathCount = 0;
            if (window.playerStats.stickyCanvas === undefined) window.playerStats.stickyCanvas = true;

            if (window.playerStats.peakSingleHit === undefined) window.playerStats.peakSingleHit = 0;
            if (window.playerStats.maxFairyClicksInWindow === undefined) window.playerStats.maxFairyClicksInWindow = 0;
            if (window.playerStats.totalDeflections === undefined) window.playerStats.totalDeflections = 0;
            if (window.playerStats.peakSimultaneousBuffs === undefined) window.playerStats.peakSimultaneousBuffs = 0;
            if (window.playerStats.totalReforges === undefined) window.playerStats.totalReforges = 0;
            if (window.playerStats.peakSingleGoldDrop === undefined) window.playerStats.peakSingleGoldDrop = 0;
            if (window.playerStats.rareSpawnsSlain === undefined) window.playerStats.rareSpawnsSlain = 0;
            if (window.playerStats.maxCanvasClicksInWindow === undefined) window.playerStats.maxCanvasClicksInWindow = 0;
            if (window.playerStats.sessionPlaytime === undefined) window.playerStats.sessionPlaytime = 0;
            if (window.playerStats.activityTimer === undefined) window.playerStats.activityTimer = 0;

            window.playerStats.fairyClicksWindow = window.playerStats.fairyClicksWindow || [];
                        window.playerStats.canvasClicksWindow = window.playerStats.canvasClicksWindow || [];
                        window.playerStats.recentHeals = window.playerStats.recentHeals || []; // Safe back-compatibility initialization

                        if (window.inventory.ETC["Iron Scrap"]) { if(typeof window.addEtcDrop === "function") window.addEtcDrop("Monster Soul", window.inventory.ETC["Iron Scrap"]); delete window.inventory.ETC["Iron Scrap"]; }
            if (window.inventory.ETC["Sticky Gel"]) { if(typeof window.addEtcDrop === "function") window.addEtcDrop("Monster Soul", window.inventory.ETC["Sticky Gel"]); delete window.inventory.ETC["Sticky Gel"]; }

            let box = document.getElementById('log-box');
            if (box) box.innerHTML = window.logsHistory.join("<br><br>");

            if (typeof window.recalculateAchievementTotals === "function") window.recalculateAchievementTotals();
            if (typeof window.checkAchievements === "function") window.checkAchievements();
            if (typeof window.updateAudioUI === "function") window.updateAudioUI();
            if (window.SoundManager && window.SoundManager.ctx) window.SoundManager.updateVolumes();

            if (parsed.lastSaveTime) {
                let now = Date.now();
                let offlineMs = now - parsed.lastSaveTime;

                let keyTypes = ['equip', 'gold', 'mat'];
                keyTypes.forEach(k => {
                    let count = k + 'Keys';
                    let time = 'next' + k.charAt(0).toUpperCase() + k.slice(1) + 'KeyTime';
                    if (window.playerStats[count] < 3) {
                        let keyTime = window.playerStats[time] || now;
                        let msSinceNextKey = now - keyTime;
                        if (msSinceNextKey >= 0) {
                            let keysEarned = 1 + Math.floor(msSinceNextKey / 3600000);
                            window.playerStats[count] = Math.min(3, window.playerStats[count] + keysEarned);
                            window.playerStats[time] = now + (3600000 - (msSinceNextKey % 3600000));
                        }
                    }
                });
                if (typeof window.applyOfflineGains === "function") window.applyOfflineGains(offlineMs);
            }
            setTimeout(() => { if(typeof window.pushLog === "function") window.pushLog(`<span style='color:#3498db; font-weight:bold;'>[SYSTEM] Local save loaded successfully.</span>`); }, 500);
        } catch(e) { console.error("Save load failed", e); }
    }
    let autoSalvageSelect = document.getElementById('auto-salvage-setting');
    if (autoSalvageSelect && window.playerStats.autoSalvageThreshold !== undefined) {
        autoSalvageSelect.value = window.playerStats.autoSalvageThreshold;
    }
    if (typeof window.refreshMarketShopIfNeeded === "function") window.refreshMarketShopIfNeeded();
};

window.onload = function() {
    canvas = document.getElementById('gameCanvas');
    if (!canvas) return;
    ctx = canvas.getContext('2d', { alpha: false });

    // EXPOSE TO GLOBAL WINDOW SO ENTITIES.JS CAN DRAW TO IT
    window.canvas = canvas;
    window.ctx = ctx;

    // Set correct responsive canvas size
    const isMobile = window.innerWidth <= 600;
    if (isMobile) {
        canvas.width = 420;
        canvas.height = 320;
    } else {
        canvas.width = 750;
        canvas.height = 320;
    }

    window.loadGame();
    window.updateStickyCanvasStyle();

    // Warm user gesture activation for Web Audio Context
    const initAudio = () => {
        window.SoundManager.init();
        window.removeEventListener('mousedown', initAudio);
        window.removeEventListener('touchstart', initAudio);
        window.removeEventListener('keydown', initAudio);
    };
    window.addEventListener('mousedown', initAudio);
    window.addEventListener('touchstart', initAudio);
    window.addEventListener('keydown', initAudio);

    // Seed procedural foliage if not populated
    const flowerColors = ["#e74c3c", "#9b59b6", "#f1c40f", "#3498db", "#e67e22", "#e84393"];
    if (window.bgScenery.length === 0) {
        for (let i = 0; i < 12; i++) {
            window.bgScenery.push({
                x: Math.random() * canvas.width, y: 230,
                type: Math.random() > 0.5 ? 'tree' : 'bush',
                size: Math.random() * 0.5 + 0.5, seed: Math.random()
            });
        }
    }
    if (window.fgScenery.length === 0) {
        for (let i = 0; i < 25; i++) {
            let fgType = Math.random();
            window.fgScenery.push({
                x: Math.random() * canvas.width, y: 240 + Math.random() * 60,
                type: fgType > 0.8 ? 'bush' : (fgType > 0.5 ? 'flower' : 'grass'),
                size: Math.random() * 0.7 + 0.5,
                color: flowerColors[Math.floor(Math.random() * flowerColors.length)],
                seed: Math.random()
            });
        }
    }

    // Input Listeners
    window.addEventListener('keydown', function(e) { if (e.code === 'Space' && !window.spacePressed) { e.preventDefault(); window.spacePressed = true; window.triggerPlayerSlash(); } });
    window.addEventListener('keyup', function(e) { if (e.code === 'Space') { window.spacePressed = false; } });

    window.isCanvasPressed = false;
    canvas.addEventListener('pointerdown', function(e) {
        e.preventDefault();
        let gameTooltip = document.getElementById('game-tooltip');
        let etcTooltip = document.getElementById('etc-tooltip');
        if (gameTooltip.style.display === "block" || etcTooltip.style.display === "block") {
            window.hideTooltip(); return;
        }

        window.playerStats.hasClickedThisBattle = true;
        window.playerStats.canvasClicksWindow = window.playerStats.canvasClicksWindow || [];
        let clickNow = Date.now();
        window.playerStats.canvasClicksWindow.push(clickNow);
        window.playerStats.canvasClicksWindow = window.playerStats.canvasClicksWindow.filter(t => clickNow - t <= 10000);
        window.playerStats.maxCanvasClicksInWindow = Math.max(window.playerStats.maxCanvasClicksInWindow || 0, window.playerStats.canvasClicksWindow.length);

        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width; const scaleY = canvas.height / rect.height;
        let clientX = e.clientX; let clientY = e.clientY;
        if (e.touches && e.touches.length > 0) { clientX = e.touches[0].clientX; clientY = e.touches[0].clientY; }
        else if (e.changedTouches && e.changedTouches.length > 0) { clientX = e.changedTouches[0].clientX; clientY = e.changedTouches[0].clientY; }

        const clickX = (clientX !== undefined ? (clientX - rect.left) * scaleX : 0);
        const clickY = (clientY !== undefined ? (clientY - rect.top) * scaleY : 0);

        if (window.equippedSlots.weapon && window.equippedSlots.weapon.isUniqueSingularity && window.playerStats.singularityState === "pulsing") {
            let sigilX = window.hero.x + 12; let sigilY = window.hero.y + 15 - 35;
            let dist = Math.hypot(clickX - sigilX, clickY - sigilY);
            if (dist < 30) {
                window.playerStats.singularityState = "storing"; window.playerStats.singularityTimer = 300; window.playerStats.singularityStoredDmg = 0;
                window.pushLog("<span style='color:#e84393; font-weight:bold;'>[SINGULARITY] Gravitational collapse active! Attack with everything you have! All damage is stored and multiplied!</span>");
                for (let i = 0; i < 20; i++) {
                    let angle = (i * Math.PI) / 10;
                    window.particles.push({ x: sigilX, y: sigilY, vx: Math.cos(angle) * 3, vy: Math.sin(angle) * 3, radius: 2, color: "#e84393", alpha: 1, life: 30 });
                }
                window.updateUI(); return;
            }
        }

        let clickedFairy = window.activeFairies.find(f => {
            let hover = Math.sin(Date.now() / 200 + f.offset) * 10;
            return Math.hypot(clickX - f.x, clickY - (f.y + hover)) < 40;
        });
        if (clickedFairy) { window.triggerFairyLoot(clickedFairy); return; }

        window.isCanvasPressed = true;
        window.triggerPlayerSlash();
    });

    canvas.addEventListener('pointerup', () => { window.isCanvasPressed = false; });
    canvas.addEventListener('pointerleave', () => { window.isCanvasPressed = false; });
    canvas.addEventListener('pointercancel', () => { window.isCanvasPressed = false; });

    document.addEventListener('pointerdown', (e) => {
        if (!e.target.closest('#game-tooltip') && !e.target.closest('.bag-item') && !e.target.closest('.slots-card') && !e.target.closest('.stat-hover') && !e.target.closest('.shop-row') && !e.target.closest('#hud-buff')) {
            window.hideTooltip();
        }
        let achModal = document.getElementById('achievements-modal');
        if (achModal && achModal.style.display === 'block') {
            if (!e.target.closest('#achievements-modal') && !e.target.closest('#btn-achievements')) { achModal.style.display = 'none'; window.hideTooltip(); }
        }
    });

    requestAnimationFrame(engineCycle);
    window.updateUI();
};

function engineCycle() {
    try {
        update();
        window.draw(); // <-- Add window. prefix here
        requestAnimationFrame(engineCycle);
    } catch (err) {
        console.error("Engine Crash:", err);
        if (window.ctx) {
            window.ctx.fillStyle = "#c0392b"; window.ctx.fillRect(0, 0, window.canvas.width, window.canvas.height);
            window.ctx.fillStyle = "#ffffff"; window.ctx.font = "bold 14px monospace";
            window.ctx.fillText("⚠️ ENGINE CRASH DETECTED", 20, 30);
            window.ctx.font = "12px monospace"; window.ctx.fillText("Error: " + err.message, 20, 60);
        }
    }
}

// --- DYNAMIC LOOP PHYSICAL AUDIT ---

window.flowerColors = ["#e74c3c", "#9b59b6", "#f1c40f", "#3498db", "#e67e22", "#e84393"];

window.scrollScenery = function(scrollSpeed) {
    window.groundScroll = (window.groundScroll + scrollSpeed) % canvas.width;
    window.bgScenery.forEach(s => {
        s.x -= scrollSpeed * 0.6;
        if (s.x < -50) {
            s.x = canvas.width + Math.random() * 50;
            s.seed = Math.random();
            s.size = Math.random() * 0.5 + 0.5;
            s.type = Math.random() > 0.5 ? 'tree' : 'bush';
        }
    });
    window.fgScenery.forEach(s => {
        s.x -= scrollSpeed;
        if (s.x < -60) {
            s.x = canvas.width + Math.random() * 50;
            s.seed = Math.random();
            s.size = Math.random() * 0.7 + 0.5;
            let fgType = Math.random();
            s.type = fgType > 0.8 ? 'bush' : (fgType > 0.5 ? 'flower' : 'grass');
            s.color = window.flowerColors[Math.floor(Math.random() * window.flowerColors.length)];
        }
    });
};

function update() {
    let now = Date.now();
    let gapMs = now - window.lastUpdateTime;

    if (window.equippedSlots.subweapon && window.equippedSlots.subweapon.isUniqueWatch && !window.isGamePaused) {
        window.playerStats.watchTick = (window.playerStats.watchTick || 0) + 1;
        if (window.playerStats.watchActiveTimer > 0) {
            window.playerStats.watchActiveTimer--;
            if (window.playerStats.watchActiveTimer === 0) {
                window.pushLog("<span style='color:#f1c40f;'>[CHRONOS WATCH] Temporal Fracture collapsed! Speeds normalized.</span>");
                window.updateUI();
            }
        } else {
            if (window.playerStats.watchTick >= 1200) {
                window.playerStats.watchTick = 0;
                window.playerStats.watchActiveTimer = 240;
                window.pushLog("<span style='color:#f1c40f; font-weight:bold;'>[CHRONOS WATCH] A Temporal Fracture opened! speeds dilated (+15% speed, -25% enemy speed).</span>");
                window.updateUI();
            }
        }
    }

    for (let i = window.effects.length - 1; i >= 0; i--) { let eff = window.effects[i]; eff.y -= 0.4; eff.life--; if (eff.life <= 0) window.effects.splice(i, 1); }
    for (let i = window.particles.length - 1; i >= 0; i--) {
        let pt = window.particles[i];
        pt.x += pt.vx; pt.y += pt.vy;
        pt.vy += (pt.gravity !== undefined ? pt.gravity : 0.25);
        if (pt.growth !== undefined) pt.radius += pt.growth;
        if (pt.maxLife && pt.fade) pt.alpha = pt.life / pt.maxLife;
        pt.life--;
        if (pt.life <= 0) window.particles.splice(i, 1);
    }
    for (let i = window.beams.length - 1; i >= 0; i--) { let bm = window.beams[i]; bm.life--; if (bm.life <= 0) window.beams.splice(i, 1); }

    if (window.deathAnimationTimer > 0) {
        window.deathAnimationTimer--;
        let p = window.resolvePlayerStats();
        let speedFactor = window.deathAnimationTimer / window.deathMaxFrames;
        let scrollSpeed = (2 + (p.moveSpeed * 0.05)) * speedFactor;
        scrollScenery(scrollSpeed);

        if (Math.random() < 0.7) {
            window.particles.push({
                x: window.hero.x + 12 + window.randFloat(-10, 10), y: window.hero.y + 15 + window.randFloat(-15, 15),
                vx: window.randFloat(-2, 2), vy: window.randFloat(-3, -0.5),
                radius: window.randFloat(1.5, 3), color: Math.random() > 0.4 ? "#c0392b" : "#2c3e50", alpha: 1, life: window.randInt(20, 40)
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

    if (window.getStageTier() === 1 && !window.playerStats.isDungeonMode && !window.playerStats.isCrucibleMode) {
        if (Math.random() < 0.40) {
            window.snowflakes.push({
                x: Math.random() * canvas.width, y: -10, r: Math.random() * 1.8 + 0.8, speed: Math.random() * 0.8 + 0.4, swingSpeed: Math.random() * 0.02 + 0.01, swingRange: Math.random() * 1.5 + 0.5
            });
        }
    } else { window.snowflakes = []; }
    for (let i = window.snowflakes.length - 1; i >= 0; i--) {
        let sf = window.snowflakes[i];
        sf.y += sf.speed; sf.x += Math.sin(window.logicClock * sf.swingSpeed) * sf.swingRange * 0.4;
        if (sf.y > canvas.height + 10 || sf.x < -10 || sf.x > canvas.width + 10) window.snowflakes.splice(i, 1);
    }

    let keyTypes = ['equip', 'gold', 'mat'];
    keyTypes.forEach(k => {
        let count = k + 'Keys'; let time = 'next' + k.charAt(0).toUpperCase() + k.slice(1) + 'KeyTime';
        if (window.playerStats[count] < 3) {
            if (!window.playerStats[time]) {
                window.playerStats[time] = now + 3600000;
            } else if (now >= window.playerStats[time]) {
                let msOver = now - window.playerStats[time];
                let keysEarned = 1 + Math.floor(msOver / 3600000);
                window.playerStats[count] = Math.min(3, window.playerStats[count] + keysEarned);
                window.playerStats[time] = window.playerStats[count] < 3 ? now + (3600000 - (msOver % 3600000)) : 0;
            }
        }
    });

    if (document.getElementById('dungeon-menu') && document.getElementById('dungeon-menu').style.display === 'block') {
        keyTypes.forEach(k => {
            let count = k + 'Keys'; let time = 'next' + k.charAt(0).toUpperCase() + k.slice(1) + 'KeyTime';
            let timerEl = document.getElementById('dt-' + k); let keysEl = document.getElementById('dk-' + k);
            if (window.playerStats[count] < 3) {
                let msLeft = Math.max(0, window.playerStats[time] - now);
                let mins = Math.floor(msLeft / 60000); let secs = Math.floor((msLeft % 60000) / 1000);
                if (timerEl) timerEl.innerText = `(${mins}m ${secs}s)`;
            } else { if (timerEl) timerEl.innerText = "(Full)"; }
            if (keysEl) keysEl.innerText = window.playerStats[count];
        });
    }

    if (document.getElementById('tab-market') && document.getElementById('tab-market').classList.contains('active')) {
        if (now >= window.playerStats.shopRefreshTime) { window.refreshMarketShopIfNeeded(); }
        else {
            let msLeft = window.playerStats.shopRefreshTime - now;
            let mins = Math.floor((msLeft % 3600000) / 60000).toString().padStart(2, '0');
            let secs = Math.floor((msLeft % 60000) / 1000).toString().padStart(2, '0');
            let timerEl = document.getElementById('market-timer');
            if (timerEl) timerEl.innerText = `Refreshes in: ${mins}:${secs}`;
        }
    }

    let p = window.resolvePlayerStats();
    let scrollSpeed = 2 + (p.moveSpeed * 0.05);

    if (window.spacePressed || window.isCanvasPressed) { window.triggerPlayerSlash(); }
    if (window.mob && window.mob.hp <= 0) window.handleMobDeath();
    if (window.mob && window.mob.flashTimer > 0) window.mob.flashTimer--;
    if (window.mob && window.mob.funnyTextTimer > 0) window.mob.funnyTextTimer--;

    if (window.mob && window.mob.hp > 0) {
        if (window.mob.trailingHp === undefined) window.mob.trailingHp = window.mob.hp;
        if (window.mob.trailingHp > window.mob.hp) {
            window.mob.trailingHp = Math.max(window.mob.hp, window.mob.trailingHp - (window.mob.maxHp * 0.005) - (window.mob.trailingHp - window.mob.hp) * 0.08);
        }
        if (window.mob.bleedTimer && window.mob.bleedTimer > 0) {
            window.mob.bleedTimer--;
            window.mob.bleedTickCounter = (window.mob.bleedTickCounter || 0) + 1;
            if (window.mob.bleedTickCounter >= 15) {
                window.mob.bleedTickCounter = 0;
                let stacks = window.mob.bleedStacks || 1;
                let bleedDmg = Math.max(1, Math.ceil(((window.mob.bleedDmgPerSecond || 1) * stacks) / 4));
                window.mob.hp -= bleedDmg; window.mob.flashTimer = 5;
                for (let i = 0; i < 3; i++) {
                    window.particles.push({
                        x: window.mob.x + window.mob.w / 2 + window.randFloat(-10, 10), y: window.mob.y + window.mob.h / 2 + window.randFloat(-10, 10),
                        vx: window.randFloat(-1.0, 1.0), vy: window.randFloat(-2.5, -0.5), radius: window.randFloat(1.2, 2.5), color: "#960018", alpha: 1, life: window.randInt(10, 18)
                    });
                }
                window.spawnDamageEffect(bleedDmg, 'bleed', false);
                window.damageHistory.push({ time: Date.now(), amount: bleedDmg });
                if (window.mob.hp <= 0) window.handleMobDeath();
            }
        }
    }

    if (window.playerStats.frenzyTimer > 0) window.playerStats.frenzyTimer--;
    if (window.playerStats.adrenalineTimer > 0) window.playerStats.adrenalineTimer--;
    if (window.playerStats.tempestCooldown > 0) window.playerStats.tempestCooldown--;
    if (window.playerStats.atkPotionTimer > 0) window.playerStats.atkPotionTimer--;
    if (window.playerStats.hpPotionTimer > 0) window.playerStats.hpPotionTimer--;
    if (window.playerStats.defPotionTimer > 0) window.playerStats.defPotionTimer--;
    if (window.playerStats.hastePotionTimer > 0) window.playerStats.hastePotionTimer--;

    if (window.hero.attackTimer > 0) {
        window.hero.attackTimer--;
        let cooldownCap = window.playerStats.frenzyTimer > 0 ? 4 : p.activeAttackSpeed;
        window.hero.slashFrame = window.hero.attackTimer > (cooldownCap - 6);
    }

    window.playerStats.sessionPlaytime = (window.playerStats.sessionPlaytime || 0) + (1000 / 60);
    if (window.playerStats.isDungeonMode || window.playerStats.isCrucibleMode) {
        window.playerStats.activityTimer = (window.playerStats.activityTimer || 0) + (1000 / 60);
        if (window.playerStats.activityTimer >= 600000) window.playerStats.hasTriggeredAethericRecharge = true;
    } else { window.playerStats.activityTimer = 0; }

    window.logicClock++;

    if (window.equippedSlots.weapon && window.equippedSlots.weapon.isUniqueSingularity) {
        if (window.playerStats.singularityTimer === undefined) window.playerStats.singularityTimer = 1800;
        if (window.playerStats.singularityState === undefined) window.playerStats.singularityState = "dormant";

        if (window.playerStats.singularityState === "dormant") {
            window.playerStats.singularityTimer--;
            if (window.playerStats.singularityTimer <= 0) {
                window.playerStats.singularityState = "pulsing"; window.playerStats.singularityTimer = 420;
                window.pushLog("<span style='color:#8e44ad; font-weight:bold;'>[SINGULARITY] Your weapon is pulsating! Tap the Sigil to enter Storing mode!</span>");
                window.updateUI();
            }
        } else if (window.playerStats.singularityState === "pulsing") {
            window.playerStats.singularityTimer--;
            if (window.playerStats.singularityTimer <= 0) { window.playerStats.singularityState = "dormant"; window.playerStats.singularityTimer = 1800; window.updateUI(); }
        } else if (window.playerStats.singularityState === "storing") {
            window.playerStats.singularityTimer--;
            if (window.mob && Math.random() < 0.6) {
                let angle = Math.random() * Math.PI * 2; let rad = 35 + Math.random() * 20;
                window.particles.push({
                    x: window.mob.x + window.mob.w / 2 + Math.cos(angle) * rad, y: window.mob.y + window.mob.h / 2 + Math.sin(angle) * rad,
                    vx: -Math.cos(angle) * 2.5, vy: -Math.sin(angle) * 2.5, radius: window.randFloat(1.5, 3.0), color: "#8e44ad", alpha: 1, gravity: 0, life: 20
                });
            }
            if (window.playerStats.singularityTimer <= 0 || !window.mob) {
                window.playerStats.singularityState = "dormant"; window.playerStats.singularityTimer = 1800;
                if (window.mob) {
                    let finalStored = window.playerStats.singularityStoredDmg || 0;
                    let shieldLvl = window.equippedSlots.weapon.stageLevel || 1;
                    let mult = 1.4 + (shieldLvl * 0.015); if (mult > 2.25) mult = 2.25;

                    let finalDetonationDmg = Math.ceil(finalStored * mult);
                    let maxCap = Math.ceil(window.mob.maxHp * 1.5);
                    if (finalDetonationDmg > maxCap) {
                        finalDetonationDmg = maxCap;
                        window.pushLog("<span style='color:#e74c3c;'>[SINGULARITY] Detonation capped at 150% of monster maximum health.</span>");
                    }
                    window.mob.hp -= finalDetonationDmg; window.mob.flashTimer = 10;
                    window.spawnDamageEffect(finalDetonationDmg, 'lightning', true);
                    window.damageHistory.push({ time: Date.now(), amount: finalDetonationDmg });
                    window.effects.push({ x: window.mob.x, y: window.mob.y - 15, text: "🌌 VOID EXPLOSION!", color: "#e84393", life: 60 });
                    canvas.classList.add('shake'); setTimeout(() => canvas.classList.remove('shake'), 400);
                    window.SoundManager.play('death');

                    window.beams.push({ x: window.mob.x + window.mob.w / 2, color: "#e84393", life: 45, maxLife: 45 });
                    for (let i = 0; i < 40; i++) {
                        let angle = Math.random() * Math.PI * 2; let vel = window.randFloat(4, 9);
                        window.particles.push({
                            x: window.mob.x + window.mob.w / 2, y: window.mob.y + window.mob.h / 2,
                            vx: Math.cos(angle) * vel, vy: Math.sin(angle) * vel - 1.0,
                            radius: window.randFloat(2.5, 5.5), color: i % 2 === 0 ? "#e84393" : "#8e44ad", alpha: 1, life: window.randInt(20, 40)
                        });
                    }
                    if (window.mob.hp <= 0) window.handleMobDeath();
                }
                window.updateUI();
            }
        }
    } else {
        window.playerStats.singularityState = "dormant"; window.playerStats.singularityTimer = 1800;
    }

    if (window.equippedSlots.weapon && window.equippedSlots.weapon.isUniqueStaff) {
        if (window.playerStats.fireballCooldown === undefined) window.playerStats.fireballCooldown = 0;
        if (window.playerStats.fireballCooldown > 0) window.playerStats.fireballCooldown--;
        if (window.playerStats.fireballCooldown <= 0 && window.mob && window.mob.hp > 0) {
            window.projectiles.push({ x: window.hero.x + 35, y: window.hero.y + 10, r: 10, hitMobs: [], pulseOffset: Math.random() * 10 });
            window.playerStats.fireballCooldown = 180; window.SoundManager.play('spell');
            for (let i = 0; i < 8; i++) {
                window.particles.push({
                    x: window.hero.x + 35, y: window.hero.y + 10, vx: window.randFloat(1, 3), vy: window.randFloat(-2, 2),
                    radius: window.randFloat(1.5, 3), color: "#e67e22", alpha: 1, life: window.randInt(15, 25)
                });
            }
        }
    }

    for (let i = window.projectiles.length - 1; i >= 0; i--) {
        let proj = window.projectiles[i]; let projSpeed = scrollSpeed + 4.5; proj.x += projSpeed;
        if (Math.random() < 0.4) {
            window.particles.push({
                x: proj.x - 5, y: proj.y + Math.sin(window.logicClock * 0.2) * 5,
                vx: -window.randFloat(0.5, 1.5), vy: window.randFloat(-1, 1),
                radius: window.randFloat(2, 4), color: Math.random() > 0.4 ? "#e74c3c" : "#f1c40f", alpha: 1, life: window.randInt(10, 20)
            });
        }
        if (window.mob && window.mob.hp > 0 && !proj.hitMobs.includes(window.mob.id)) {
            if (proj.x + proj.r > window.mob.x && proj.x - proj.r < window.mob.x + window.mob.w) {
                proj.hitMobs.push(window.mob.id);
                let mobDef = window.mob.def || 0;
                                if (proj.isMaelstromCrescent) {
                                    let windDmg = Math.max(1, Math.ceil(p.atk * 0.50));
                                    windDmg = Math.max(1, Math.ceil(windDmg * (100 / (100 + mobDef))));

                                    if (window.playerStats.singularityState === "storing") {
                                        window.playerStats.singularityStoredDmg += windDmg;
                                        window.effects.push({ x: window.mob.x + window.mob.w / 2, y: window.mob.y - 10, text: `+${window.formatNumber(windDmg)} [STORED]`, color: "#8e44ad", life: 45 });
                                    } else {
                                        window.mob.hp -= windDmg; window.mob.flashTimer = 5;
                                        window.spawnDamageEffect(windDmg, 'echo', false);
                                        window.damageHistory.push({ time: Date.now(), amount: windDmg });
                                        if (!window.playerStats.isDungeonMode && !window.playerStats.isCrucibleMode && !window.playerStats.isBossMode && !window.playerStats.isFarmingLoop) {
                                            window.playerStats.killCount = Math.min(window.playerStats.targetsRequired, window.playerStats.killCount + 1);
                                            window.effects.push({ x: window.hero.x + 12, y: window.hero.y - 12, text: "⏩ PROGRESS SKIP!", color: "#2ecc71", life: 55 });
                                            if (window.playerStats.killCount >= window.playerStats.targetsRequired) window.playerStats.isBossMode = true;
                                        }
                                    }
                                } else {
                                    let flameDmg = Math.max(1, Math.ceil(p.atk * 0.25));
                                    flameDmg = Math.max(1, Math.ceil(flameDmg * (100 / (100 + mobDef))));

                                    if (window.playerStats.singularityState === "storing") {
                                        window.playerStats.singularityStoredDmg += flameDmg;
                                        window.effects.push({ x: window.mob.x + window.mob.w / 2, y: window.mob.y - 10, text: `+${window.formatNumber(flameDmg)} [STORED]`, color: "#8e44ad", life: 45 });
                                    } else {
                                        window.mob.hp -= flameDmg; window.mob.flashTimer = 5;
                                        window.spawnDamageEffect(flameDmg, 'fire', false);
                                        window.damageHistory.push({ time: Date.now(), amount: flameDmg });
                                    }
                                }
                for (let pIdx = 0; pIdx < 6; pIdx++) {
                    window.particles.push({
                        x: proj.x, y: proj.y, vx: window.randFloat(-2, 3), vy: window.randFloat(-2, 2),
                        radius: window.randFloat(1.5, 3), color: "#f1c40f", alpha: 1, life: window.randInt(10, 18)
                    });
                }
                if (window.mob && window.mob.hp <= 0) window.handleMobDeath();
            }
        }
        if (proj.x > canvas.width + 50) window.projectiles.splice(i, 1);
    }

    if (window.activeFairies.length === 0 && Math.random() < 0.00005) {
        let val = p.fairySpawn; let numToSpawn = 0;
        if (val < 1.0) { if (Math.random() < val) numToSpawn = 1; }
        else { numToSpawn = Math.floor(val); if (Math.random() < (val - numToSpawn)) numToSpawn++; }
        for (let i = 0; i < numToSpawn; i++) {
            window.activeFairies.push({
                id: window.idCounter++, x: -50 - (i * 35), y: 80 + Math.random() * 60,
                offset: i * 2, speed: window.randFloat(1.0, 1.4), color: i === 0 ? "#ffb6c1" : (i === 1 ? "#74b9ff" : (i === 2 ? "#55efc4" : "#ffeaa7"))
            });
        }
    }
    for (let i = window.activeFairies.length - 1; i >= 0; i--) {
        let f = window.activeFairies[i]; f.x += f.speed;
        if (f.x > canvas.width + 50) window.activeFairies.splice(i, 1);
    }

    if (window.playerStats.isPrestigeBossMode && window.playerStats.prestigeApproachTimer > 0) {
            window.playerStats.prestigeApproachTimer--;
            let chargeScrollSpeed = (2 + (p.moveSpeed * 0.05)) * 3;
            scrollScenery(chargeScrollSpeed);
            let targetHeroX = canvas.width - 180;
            window.hero.x += (targetHeroX - window.hero.x) / (window.playerStats.prestigeApproachTimer + 1);

            if (Math.random() < 0.5) {
                window.particles.push({
                    x: canvas.width + 10, y: 50 + Math.random() * 120, vx: -window.randFloat(8, 14), vy: 0,
                    radius: window.randFloat(1, 2), color: "rgba(255, 255, 255, 0.25)", alpha: 1, life: 60
                });
            }
            if (window.playerStats.prestigeApproachTimer === 0) {
                let scaleVal = window.playerStats.prestigeCount || 0;

                // Tuned Hooktail curves to coordinate with new active defense mitigation mechanics
                let hp = 20000 * Math.pow(1.62, scaleVal);
                let dmg = 450 * Math.pow(1.25, scaleVal);
                let def = 40 + 35 * scaleVal;

                window.mob = {
                    x: canvas.width - 230, y: 65, w: 180, h: 160, type: "prestige_boss", isRare: false,
                    hp: Math.floor(hp), maxHp: Math.floor(hp), damage: Math.floor(dmg), def: Math.floor(def),
                    flashTimer: 0, isStopped: false, attackCooldown: 75, attackTimer: 75
                };
                window.pushLog(`<span style='color:#e74c3c; font-weight:bold;'>[ASCENSION] HOOKTAIL APPEARS! Slay her to Ascend!</span>`);
            }
            window.logicClock++; return;
        }

    if (!window.mob) {
        window.processEnemySpawn(); scrollScenery(scrollSpeed);
    } else {
        if (window.mob.isRare && Math.random() < 0.1 && window.particles.length < 200) {
            window.particles.push({ x: window.mob.x + Math.random()*window.mob.w, y: window.mob.y + Math.random()*window.mob.h, vx: (Math.random()-0.5)*2, vy: -Math.random()*3, radius: Math.random()*2+1, color: "#f1c40f", alpha: 1, life: 20 });
        }
        let isHooktail = (window.mob.type === "prestige_boss");
        if (isHooktail) { window.mob.x = canvas.width - 230; window.mob.isStopped = true; }

        if (!isHooktail && window.mob.x > (window.hero.x + window.hero.w + 30)) {
            window.mob.x -= (4 + scrollSpeed); window.mob.isStopped = false; scrollScenery(scrollSpeed);
        } else {
            window.mob.isStopped = true;
            if (window.logicClock % p.idleAttackSpeed === 0 && window.state.autoAttack) { window.triggerPlayerSlash(); }
            if (!window.mob) return;

            if (isHooktail && Math.random() < 0.20 && window.particles.length < 200) {
                let hoverY = Math.sin(Date.now() / 150) * 6;
                window.particles.push({
                    x: window.mob.x - 35, y: window.mob.y + 55 + hoverY, vx: window.randFloat(-0.4, 0.2), vy: -window.randFloat(1.2, 2.2),
                    gravity: -0.06, radius: window.randFloat(3.0, 5.0), growth: 0.15,
                    color: Math.random() > 0.5 ? "rgba(60, 60, 65, 0.65)" : "rgba(30, 30, 35, 0.65)", alpha: 0.75, fade: true, maxLife: 80, life: window.randInt(60, 80)
                });
            }

            if (window.mob.attackTimer === undefined) window.mob.attackTimer = window.mob.attackCooldown || 120;
            if (!window.isGamePaused) window.mob.attackTimer--;

            if (window.mob.attackTimer <= 0 && window.mob && window.mob.hp > 0) {
                window.mob.attackTimer = window.mob.attackCooldown || 120;

                let isBlocked = Math.random() < p.block;
                let isParried = !isBlocked && Math.random() < p.parry;

                if (isParried) {
                    window.effects.push({ x: window.hero.x, y: window.hero.y - 15, text: "⚡ PARRY COUNTER!", color: "#9b59b6", life: 50 });
                    window.SoundManager.play('parry');
                    window.playerStats.totalDeflections = (window.playerStats.totalDeflections || 0) + 1;
                    window.playerStats.recentParryTime = Date.now();
                    window.playerStats.consecutiveParries = (window.playerStats.consecutiveParries || 0) + 1;
                    if (window.playerStats.consecutiveParries >= 3) window.playerStats.hasTriggeredPerfectDeflection = true;

                    if (window.playerStats.recentCritTime && window.playerStats.recentBlockTime && window.playerStats.recentParryTime) {
                        let times = [window.playerStats.recentCritTime, window.playerStats.recentBlockTime, window.playerStats.recentParryTime];
                        if (Math.max(...times) - Math.min(...times) <= 1000) window.playerStats.hasTriggeredLuckySeven = true;
                    }
                    if (window.equippedSlots.subweapon && window.equippedSlots.subweapon.subType === "dagger") window.playerStats.daggerParryStagger = true;
                    if (window.checkArtifactTrait("dodge_buff")) window.playerStats.adrenalineTimer = window.checkArtifactTrait("extend_buffs") ? 900 : 600;

                    if (window.checkArtifactTrait("parry_strike")) {
                        let counterDmg = p.atk * (window.playerStats.adrenalineTimer > 0 ? 2 : 1); window.mob.hp -= counterDmg;
                        window.spawnDamageEffect(counterDmg, 'counter', false);
                        window.damageHistory.push({ time: Date.now(), amount: counterDmg });
                        if (window.mob.hp <= 0) { window.handleMobDeath(); return; }
                    }
                } else if (isBlocked) {
                    window.effects.push({ x: window.hero.x, y: window.hero.y, text: "🛡️ BLOCKED", color: "#3498db", life: 40 });
                    window.SoundManager.play('block');

                    if (window.equippedSlots.subweapon && window.equippedSlots.subweapon.isUniqueAegis && window.mob && window.mob.hp > 0) {
                        let shieldLvl = window.equippedSlots.subweapon.stageLevel || 1;
                        let blastDmg = Math.ceil(p.def * (1.5 + (shieldLvl * 0.05)));
                        if (window.playerStats.singularityState === "storing") {
                            window.playerStats.singularityStoredDmg += blastDmg;
                            window.effects.push({ x: window.mob.x + window.mob.w / 2, y: window.mob.y - 10, text: `+${window.formatNumber(blastDmg)} [STORED]`, color: "#8e44ad", life: 45 });
                        } else {
                            window.mob.hp -= blastDmg; window.mob.flashTimer = 5;
                            window.spawnDamageEffect(blastDmg, 'counter', false);
                            window.damageHistory.push({ time: Date.now(), amount: blastDmg });
                            if (window.mob.hp <= 0) { window.handleMobDeath(); return; }
                        }
                        for (let i = 0; i < 8; i++) {
                            window.particles.push({
                                x: window.mob.x + window.mob.w / 2, y: window.mob.y + window.mob.h / 2,
                                vx: window.randFloat(-3, 3), vy: window.randFloat(-3, 3), radius: window.randFloat(1.5, 3.5), color: "#8e44ad", alpha: 1, life: window.randInt(15, 25)
                            });
                        }
                    }

                    window.playerStats.totalDeflections = (window.playerStats.totalDeflections || 0) + 1;
                    window.playerStats.recentBlockTime = Date.now();
                    window.playerStats.consecutiveParries = 0;
                    if (window.playerStats.recentCritTime && window.playerStats.recentBlockTime && window.playerStats.recentParryTime) {
                        let times = [window.playerStats.recentCritTime, window.playerStats.recentBlockTime, window.playerStats.recentParryTime];
                        if (Math.max(...times) - Math.min(...times) <= 1000) window.playerStats.hasTriggeredLuckySeven = true;
                    }
                    if (window.checkArtifactTrait("dodge_buff")) window.playerStats.adrenalineTimer = window.checkArtifactTrait("extend_buffs") ? 900 : 600;
                } else {
                    window.playerStats.consecutiveParries = 0;
                    let netDamage = Math.max(1, Math.ceil(window.mob.damage * (100 / (100 + p.def))));
                    const subType = window.equippedSlots.subweapon ? window.equippedSlots.subweapon.subType : null;

                    if (window.playerStats.daggerParryStagger && subType === "dagger") {
                        netDamage = Math.max(1, Math.ceil(netDamage * 0.5));
                        window.playerStats.daggerParryStagger = false;
                        window.effects.push({ x: window.hero.x, y: window.hero.y - 18, text: "🛡️ PARRIED (-50%)", color: "#e74c3c", life: 55 });
                    }
                    if (p.arcaneBarrier && subType === "tome") {
                        let absorbed = Math.ceil(netDamage * p.arcaneBarrier);
                        netDamage = Math.max(1, netDamage - absorbed);
                        window.effects.push({ x: window.hero.x, y: window.hero.y - 18, text: `🛡️ BARRIER (-${Math.round(p.arcaneBarrier*100)}%)`, color: "#9b59b6", life: 55 });
                    }

                    if (window.playerStats.godMode) netDamage = 0;

                    window.playerStats.currentHp -= netDamage;
                    window.playerStats.damageTakenThisBattle = (window.playerStats.damageTakenThisBattle || 0) + netDamage;
                    window.effects.push({ x: window.hero.x, y: window.hero.y, text: "-" + window.formatNumber(netDamage), color: "#e74c3c", life: 40 });

                    if (window.equippedSlots.helmet && window.equippedSlots.helmet.isUniqueTempest && window.mob && window.mob.hp > 0) {
                        if (window.playerStats.tempestCooldown === undefined) window.playerStats.tempestCooldown = 0;
                        if (window.playerStats.tempestCooldown <= 0) {
                            window.playerStats.tempestCooldown = 60;
                            if (Math.random() < 0.15) {
                                let boltDmg = Math.ceil(p.atk * 1.50);
                                if (window.playerStats.singularityState === "storing") {
                                    window.playerStats.singularityStoredDmg += boltDmg;
                                    window.effects.push({ x: window.mob.x + window.mob.w / 2, y: window.mob.y - 10, text: `+${window.formatNumber(boltDmg)} [STORED]`, color: "#8e44ad", life: 45 });
                                } else {
                                    window.mob.hp -= boltDmg; window.mob.flashTimer = 5;
                                    window.spawnDamageEffect(boltDmg, 'lightning', false);
                                    window.damageHistory.push({ time: Date.now(), amount: boltDmg });

                                    let isBossType = (window.mob.type === "boss" || window.mob.type === "dungeon_boss" || window.mob.type === "prestige_boss" || window.mob.type === "rift_guardian" || window.mob.type === "aegis_goliath" || window.mob.type === "chronos_arbitrator" || window.mob.type === "nexus_overseer");
                                    if (!isBossType) {
                                        window.mob.attackTimer = window.mob.attackCooldown;
                                        window.effects.push({ x: window.mob.x, y: window.mob.y - 18, text: "⚡ STUNNED!", color: "#00d2ff", life: 40 });
                                    }
                                    if (window.mob.hp <= 0) { window.handleMobDeath(); return; }
                                }
                                window.SoundManager.play('parry');
                                for (let i = 0; i < 15; i++) {
                                    window.particles.push({
                                        x: window.mob.x + window.mob.w / 2 + window.randFloat(-5, 5), y: window.mob.y - 40 + (i * (window.mob.h + 40) / 15),
                                        vx: window.randFloat(-1.5, 1.5), vy: window.randFloat(-0.5, 0.5), radius: window.randFloat(1.5, 3.5), color: "#00d2ff", alpha: 1, life: window.randInt(12, 22)
                                    });
                                }
                            }
                        }
                    }
                    if (window.playerStats.currentHp <= 0) {
                        if (window.checkArtifactTrait("second_wind") && !window.playerStats.usedSecondWind) {
                            window.playerStats.usedSecondWind = true; window.playerStats.currentHp = Math.floor(p.maxHp * 0.5);
                            window.playerStats.ankhTriggeredThisBattle = true;
                            window.effects.push({ x: window.hero.x, y: window.hero.y - 20, text: "🔥 SECOND WIND!", color: "#e67e22", life: 80 });
                        } else {
                            if (window.playerStats.isPrestigeBossMode) window.playerStats.killedBy = "Hooktail (Prestige Boss)";
                            else if (window.playerStats.isDungeonMode) window.playerStats.killedBy = window.mob.type === "dungeon_boss" ? "Dungeon Boss" : (window.mob.type === "dungeon_miniboss" ? "Dungeon Miniboss" : "Dungeon Minion");
                            else if (window.playerStats.isUberBoss) window.playerStats.killedBy = "Rift Guardian";
                            else if (window.playerStats.isBossMode) window.playerStats.killedBy = "Stage Boss";
                            else window.playerStats.killedBy = window.mob.isRare ? "Rare Monster" : "Standard Monster";

                            window.playerStats.killedByMob = JSON.parse(JSON.stringify(window.mob));
                            window.playerStats.currentHp = 0; window.deathAnimationTimer = window.deathMaxFrames; return;
                        }
                    }
                }
                window.updateUI();
            }
        }
    }
}

// --- GAMEPLAY TRIGGERS & HOOKS ---

window.triggerPlayerSlash = function() {
    if (window.isGamePaused) return;
    let p = window.resolvePlayerStats(); let cooldownCap = window.playerStats.frenzyTimer > 0 ? 4 : p.activeAttackSpeed;
    if (window.hero.attackTimer > 0) return;

    window.SoundManager.play('swing');
    window.hero.attackTimer = cooldownCap;

    if (window.equippedSlots.weapon && window.equippedSlots.weapon.isUniqueStaff) {
        window.projectiles.push({
            x: window.hero.x + 35, y: window.hero.y + 10, r: 10, hitMobs: [], pulseOffset: Math.random() * 10
        });
        for (let i = 0; i < 4; i++) {
            window.particles.push({
                x: window.hero.x + 35, y: window.hero.y + 10, vx: window.randFloat(1, 3), vy: window.randFloat(-2, 2),
                radius: window.randFloat(1.5, 3), color: "#e67e22", alpha: 1, life: window.randInt(15, 25)
            });
        }
    }
    window.executeHitCalculations();
};

window.executeHitCalculations = function() {
    if (window.mob && window.mob.x < window.hero.x + 65) {
        let p = window.resolvePlayerStats();
        let finalDamage = p.atk;
        if (window.playerStats.adrenalineTimer > 0) finalDamage *= 2;

        let isCrit = Math.random() < p.critChance;
        if (isCrit) finalDamage = Math.ceil(finalDamage * p.critDamage);

        // Core mitigation layer filtering final base slash damage against active mob defense
        let mobDef = window.mob.def || 0;
        finalDamage = Math.max(1, Math.ceil(finalDamage * (100 / (100 + mobDef))));

        // Peak single-hit check
        window.playerStats.peakSingleHit = Math.max(window.playerStats.peakSingleHit || 0, finalDamage);
        if (isCrit) {
            window.playerStats.recentCritTime = Date.now();
            // Overkill check (deals critical hit exceeding mob's remaining HP by 1000%+)
            if (finalDamage > window.mob.hp * 11) {
                window.playerStats.hasTriggeredOverkill = true;
            }
        }

        if (window.playerStats.singularityState === "storing") {
            window.playerStats.singularityStoredDmg += finalDamage;
            window.mob.flashTimer = 3;
            window.effects.push({ x: window.mob.x + window.mob.w / 2, y: window.mob.y - 10, text: `+${window.formatNumber(finalDamage)} [STORED]`, color: "#8e44ad", life: 45 });
        } else {
            window.mob.hp -= finalDamage; window.mob.flashTimer = 5;
            window.spawnDamageEffect(finalDamage, 'slash', isCrit);
            window.damageHistory.push({ time: Date.now(), amount: finalDamage });
        }

        // UNIQUE: Maelstrom Glaive Wind Crescent projectile on critical hit (25% chance)
        if (window.equippedSlots.weapon && window.equippedSlots.weapon.isUniqueMaelstrom && isCrit && Math.random() < 0.25 && window.mob && window.mob.hp > 0) {
            window.projectiles.push({
                x: window.hero.x + 35,
                y: window.hero.y + 10,
                r: 12,
                isMaelstromCrescent: true,
                hitMobs: [],
                pulseOffset: Math.random() * 5
            });
            window.SoundManager.play('swing'); // Swoosh sound
        }

        // Stacking Bleed & Sanguine Rupture on hit
        if (window.equippedSlots.weapon && window.equippedSlots.weapon.isUniqueSword) {
            window.mob.bleedStacks = (window.mob.bleedStacks || 0) + 1;
            window.mob.bleedTimer = 300; // 5-second hold
            window.mob.bleedDmgPerSecond = Math.max(1, Math.ceil(p.atk * 0.15)); // 15% weapon scaling per stack

            if (window.mob.bleedStacks >= 5) {
                // HEMORRHAGIC RUPTURE (300% critical physical burst + 3% Max HP Life-Siphon)
                let ruptureDmg = Math.ceil(p.atk * 3.0);
                let isRuptureCrit = Math.random() < p.critChance;
                if (isRuptureCrit) ruptureDmg = Math.ceil(ruptureDmg * p.critDamage);

                // Apply active defense mitigation to hemorrhagic rupture
                ruptureDmg = Math.max(1, Math.ceil(ruptureDmg * (100 / (100 + mobDef))));

                window.mob.hp -= ruptureDmg;
                window.mob.flashTimer = 8;

                let healAmount = Math.ceil(p.maxHp * 0.03);
                window.playerStats.currentHp = Math.min(p.maxHp, window.playerStats.currentHp + healAmount);

                window.effects.push({ x: window.mob.x, y: window.mob.y - 20, text: "💥 RUPTURE! +" + window.formatNumber(healAmount) + " HP", color: "#e74c3c", life: 65 });
                window.spawnDamageEffect(ruptureDmg, 'bleed', isRuptureCrit);
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
                        life: window.randInt(22, 38)
                    });
                }

                window.SoundManager.play('death'); // Play heavy impact sound

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
                        life: window.randInt(10, 20)
                    });
                }
            }
        }

        // Offhand Dagger Multi-Strike (Deals 50% of your total Attack as an extra hit)
        const hasDagger = window.equippedSlots.subweapon && window.equippedSlots.subweapon.subType === "dagger";
        if (hasDagger) {
            let daggerDmg = Math.max(1, Math.ceil((p.atk * (window.playerStats.adrenalineTimer > 0 ? 2 : 1)) * 0.5));
            let isDaggerCrit = Math.random() < p.critChance;
            if (isDaggerCrit) daggerDmg = Math.ceil(daggerDmg * p.critDamage);

            // Apply active defense mitigation to offhand dagger strikes
            daggerDmg = Math.max(1, Math.ceil(daggerDmg * (100 / (100 + mobDef))));

            if (window.playerStats.singularityState === "storing") {
                window.playerStats.singularityStoredDmg += daggerDmg;
                window.effects.push({ x: window.mob.x + window.mob.w / 2, y: window.mob.y - 10, text: `+${window.formatNumber(daggerDmg)} [STORED]`, color: "#8e44ad", life: 45 });
            } else {
                window.mob.hp -= daggerDmg;
                window.spawnDamageEffect(daggerDmg, 'dagger', isDaggerCrit);
                window.damageHistory.push({ time: Date.now(), amount: daggerDmg });
            }
        }

        // Elemental Tome Spells (20% independent chance each for Lightning, Fire, and Frost)
        const hasTome = window.equippedSlots.subweapon && window.equippedSlots.subweapon.subType === "tome";
        if (hasTome) {
            let spellDmgBase = Math.max(1, Math.ceil((p.atk * (window.playerStats.adrenalineTimer > 0 ? 2 : 1)) * 0.5));
            let triggeredSpell = false;
            let lightProc = false, fireProc = false, frostProc = false;

            // 1. Lightning Spell Roll
            if (Math.random() < 0.20) {
                lightProc = true;
                triggeredSpell = true;
                let lightningDmg = spellDmgBase;
                let isSpellCrit = Math.random() < p.critChance;
                if (isSpellCrit) lightningDmg = Math.ceil(lightningDmg * p.critDamage);

                // Apply active defense mitigation to lightning spells
                lightningDmg = Math.max(1, Math.ceil(lightningDmg * (100 / (100 + mobDef))));

                if (window.playerStats.singularityState === "storing") {
                    window.playerStats.singularityStoredDmg += lightningDmg;
                    window.effects.push({ x: window.mob.x + window.mob.w / 2, y: window.mob.y - 10, text: `+${window.formatNumber(lightningDmg)} [STORED]`, color: "#8e44ad", life: 45 });
                } else {
                    window.mob.hp -= lightningDmg;
                    window.spawnDamageEffect(lightningDmg, 'lightning', isSpellCrit);
                    window.damageHistory.push({ time: Date.now(), amount: lightningDmg });
                }

                // Descending crackling lightning bolt particles
                for (let i = 0; i < 15; i++) {
                    window.particles.push({
                        x: window.mob.x + window.mob.w / 2 + window.randFloat(-6, 6),
                        y: window.mob.y - 40 + (i * (window.mob.h + 40) / 15),
                        vx: window.randFloat(-2.5, 2.5),
                        vy: window.randFloat(-1, 1),
                        radius: window.randFloat(1.5, 3),
                        color: Math.random() > 0.3 ? "#f1c40f" : "#fff",
                        alpha: 1,
                        life: window.randInt(10, 18)
                    });
                }
            }

            // 2. Fire Spell Roll
            if (Math.random() < 0.20) {
                fireProc = true;
                triggeredSpell = true;
                let fireDmg = spellDmgBase;
                let isSpellCrit = Math.random() < p.critChance;
                if (isSpellCrit) fireDmg = Math.ceil(fireDmg * p.critDamage);

                // Apply active defense mitigation to fire spells
                fireDmg = Math.max(1, Math.ceil(fireDmg * (100 / (100 + mobDef))));

                if (window.playerStats.singularityState === "storing") {
                    window.playerStats.singularityStoredDmg += fireDmg;
                    window.effects.push({ x: window.mob.x + window.mob.w / 2, y: window.mob.y - 10, text: `+${window.formatNumber(fireDmg)} [STORED]`, color: "#8e44ad", life: 45 });
                } else {
                    window.mob.hp -= fireDmg;
                    window.spawnDamageEffect(fireDmg, 'fire', isSpellCrit);
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
                        life: window.randInt(18, 32)
                    });
                }
            }

            // 3. Frost Spell Roll
            if (Math.random() < 0.20) {
                frostProc = true;
                triggeredSpell = true;
                let frostDmg = spellDmgBase;
                let isSpellCrit = Math.random() < p.critChance;
                if (isSpellCrit) frostDmg = Math.ceil(frostDmg * p.critDamage);

                // Apply active defense mitigation to frost spells
                frostDmg = Math.max(1, Math.ceil(frostDmg * (100 / (100 + mobDef))));

                if (window.playerStats.singularityState === "storing") {
                    window.playerStats.singularityStoredDmg += frostDmg;
                    window.effects.push({ x: window.mob.x + window.mob.w / 2, y: window.mob.y - 10, text: `+${window.formatNumber(frostDmg)} [STORED]`, color: "#8e44ad", life: 45 });
                } else {
                    window.mob.hp -= frostDmg;
                    window.spawnDamageEffect(frostDmg, 'frost', isSpellCrit);
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
                        life: window.randInt(15, 28)
                    });
                }
            }

            if (triggeredSpell) {
                window.SoundManager.play('spell');
                if (lightProc && fireProc && frostProc) {
                    window.playerStats.hasTriggeredElementalConvergence = true;
                }
            }
        }

        if (window.checkArtifactTrait("echo_strike") && Math.random() < 0.50) {
                    let echoDmg = Math.max(1, Math.ceil(finalDamage * 0.40)); window.mob.hp -= echoDmg;
                    window.spawnDamageEffect(echoDmg, 'echo', false);
                    window.damageHistory.push({ time: Date.now(), amount: echoDmg });
                }
                if (window.checkArtifactTrait("vampirism")) {
                    let now = Date.now();
                    // Purge healing siphons older than 1,000ms
                    window.playerStats.recentHeals = (window.playerStats.recentHeals || []).filter(h => now - h.time < 1000);
                    let totalRecentHealed = window.playerStats.recentHeals.reduce((sum, h) => sum + h.amount, 0);

                    // Restrict healing from Vampirism to a global ceiling of 3% Max HP per second
                    let maxHealSec = p.maxHp * 0.03;
                    let allowedHeal = Math.max(0, maxHealSec - totalRecentHealed);

                    let rawHeal = Math.max(1, Math.floor(finalDamage * 0.005));
                    let heal = Math.min(allowedHeal, rawHeal);

                    if (heal > 0) {
                        window.playerStats.currentHp = Math.min(p.maxHp, window.playerStats.currentHp + heal);
                        window.playerStats.recentHeals.push({ time: now, amount: heal });
                        window.effects.push({ x: window.hero.x - 25, y: window.hero.y - 10, text: "❤️ +" + window.formatNumber(heal), color: "#2ecc71", life: 60 });
                    }
                }
                if (typeof window.updateUI === "function") window.updateUI();
        if (window.mob.hp <= 0) {
            if (typeof window.handleMobDeath === "function") window.handleMobDeath();
        }
    }
};

window.handleMobDeath = function() {
    window.effects = window.effects.filter(e => !e.isCumulative);
    let p = window.resolvePlayerStats();

    // UNIQUE: Maelstrom Glaive Overkill Cleave damage carry-over calculation
    if (window.equippedSlots.weapon && window.equippedSlots.weapon.isUniqueMaelstrom && window.mob) {
        let overkill = Math.abs(window.mob.hp); // excess damage below 0
        if (overkill > 0) {
            window.playerStats.maelstromCleavePool = overkill;
            if (typeof window.pushLog === "function") window.pushLog(`<strong style='color:#2ecc71;'>[MAELSTROM CLEAVE]</strong> Stored <span style='color:#2ecc71;'>${window.formatNumber(overkill)} overkill damage</span> to unleash on next spawn!`);
        }
    }
    let isBoss = (window.mob.type === "boss" || window.mob.type === "dungeon_boss" || window.mob.type === "dungeon_miniboss" || window.mob.type === "rift_guardian" || window.mob.type === "prestige_boss" || window.mob.type === "aegis_goliath" || window.mob.type === "chronos_arbitrator" || window.mob.type === "nexus_overseer");

    if (window.mob && window.mob.isRare) {
        window.playerStats.rareSpawnsSlain = (window.playerStats.rareSpawnsSlain || 0) + 1;
    }

    // Trigger potion drop rolls
    if (typeof window.rollPotionDrop === "function") window.rollPotionDrop(isBoss, window.mob && window.mob.isRare);

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
    if (window.mob && window.mob.isRare && window.checkArtifactTrait("void_pull")) {
        let healAmount = Math.ceil(p.maxHp * 0.30);
        window.playerStats.currentHp = Math.min(p.maxHp, window.playerStats.currentHp + healAmount);
        window.effects.push({ x: window.mob.x, y: window.mob.y - 15, text: `❤️ +${healAmount.toLocaleString()} VOID SIPHON`, color: "#9b59b6", life: 75 });
        if (typeof window.pushLog === "function") window.pushLog(`<strong style='color:#9b59b6;'>[VOID CORE]</strong> Syphoned <span style='color:#2ecc71;'>${healAmount.toLocaleString()} HP</span> from the fallen rare.`);
    }

    if (window.SoundManager) window.SoundManager.play('death');

    let xpYield = 0;
    let scaleVal = window.playerStats.isDungeonMode ? (window.playerStats.currentDungeonStage[window.playerStats.currentDungeon] || 1) : window.playerStats.stage;
    if (window.playerStats.isCrucibleMode) scaleVal = window.playerStats.crucibleWave;

    let expScale = Math.pow(1.06, scaleVal);

    if (window.playerStats.isCrucibleMode) {
        xpYield = Math.floor(10 * expScale);
    } else if (window.playerStats.isDungeonMode) {
        xpYield = Math.floor((window.mob.type === "dungeon_boss" ? 25 : 5) * expScale);
    } else {
        let baseExp = Math.floor(5 * expScale);
        xpYield = isBoss ? baseExp * 5 : (window.mob.isRare ? baseExp * 3 : baseExp);
    }
    if (typeof window.gainXp === "function") window.gainXp(xpYield);

    let baseCoin = isBoss ? Math.floor(15 * expScale) : Math.floor(2 * expScale);
    if (window.playerStats.isCrucibleMode) baseCoin = 0; // Crucible awards survival stats on death summary

    if (window.playerStats.isDungeonMode && window.playerStats.currentDungeon === 'gold') {
        baseCoin *= 5; if (window.mob.type === "dungeon_boss") baseCoin *= 4;
    }
    if (window.mob.isRare) baseCoin *= 4;

    let coinYield = Math.ceil(baseCoin * p.gold);
    window.playerStats.coins += coinYield;
    window.playerStats.totalGoldEarned = (window.playerStats.totalGoldEarned || 0) + coinYield;

    // Peak single gold drop check
    window.playerStats.peakSingleGoldDrop = Math.max(window.playerStats.peakSingleGoldDrop || 0, coinYield);

    if (window.playerStats.runGold !== undefined) {
        window.playerStats.runGold += coinYield;
    }

    if (typeof window.spawnDeathParticles === "function") window.spawnDeathParticles(window.mob.x + (window.mob.w / 2), window.mob.y + (window.mob.h / 2), window.mob.type);
    if (coinYield > 0) {
        window.effects.push({ x: window.mob.x + 35, y: window.mob.y + 25, text: "+" + coinYield.toLocaleString() + "g", color: "#f1c40f", life: 50 });
    }

    if (window.playerStats.isCrucibleMode) {
        if (window.mob.type === "dungeon_boss") {
            window.playerStats.crucibleWave++;
            window.playerStats.cruciblePeak = Math.max(window.playerStats.cruciblePeak || 1, window.playerStats.crucibleWave);
            window.playerStats.killCount = 0;
            if (typeof window.pushLog === "function") window.pushLog(`<span style='color:#9b59b6; font-weight:bold;'>[CRUCIBLE] Advanced to Wave ${window.playerStats.crucibleWave}!</span>`);
        } else {
            window.playerStats.killCount++;
        }
        window.mob = null;
        if (typeof window.updateUI === "function") window.updateUI();
        return;
    }

    if (window.playerStats.isDungeonMode) {
            if (window.playerStats.currentDungeon === 'equip') {
                if (window.mob.type === "dungeon_boss") {
                    if (Math.random() < 0.05) { if (typeof window.rollEquipmentDrop === "function") window.rollEquipmentDrop(true, false, 1, false); } else if (Math.random() < 0.20) { if (typeof window.rollEquipmentDrop === "function") window.rollEquipmentDrop(true, false, 0, false); }
                    // Balanced unique artifact tempering speed by adjusting Overlord's Sigil rate to 20%
                    if (Math.random() < 0.20) { if (typeof window.addEtcDrop === "function") window.addEtcDrop("Overlord's Sigil", 1); if (typeof window.pushToast === "function") window.pushToast("Overlord's Sigil", null, "#1abc9c", true, 1); }
                } else {
                    if (Math.random() < 0.01) { if (typeof window.rollEquipmentDrop === "function") window.rollEquipmentDrop(false, false, 0, false); }
                }
            } else if (window.playerStats.currentDungeon === 'mat') {
                let dStage = window.playerStats.currentDungeonStage['mat'] || 1;
                if (window.mob.type === "dungeon_boss") {
                    // Ancient Core: gated behind Floor 150+
                    if (dStage >= 150 && Math.random() < 0.03) {
                        if (typeof window.addEtcDrop === "function") window.addEtcDrop("Ancient Core", 1);
                        if (typeof window.pushToast === "function") window.pushToast("Ancient Core", null, "#9b59b6", true, 1);
                    }
                    // Gacha Key: extremely rare, gated behind Floor 350+
                    if (dStage >= 350 && Math.random() < 0.0025) {
                        if (typeof window.addEtcDrop === "function") window.addEtcDrop("Gacha Key", 1);
                        if (typeof window.pushToast === "function") window.pushToast("Gacha Key", null, "#f1c40f", true, 1);
                    }
                    // Eridium Shards: gated behind Floor 600+
                    if (dStage >= 600 && Math.random() < 0.01) {
                        if (typeof window.addEtcDrop === "function") window.addEtcDrop("Eridium Shard", 1);
                        if (typeof window.pushToast === "function") window.pushToast("Eridium Shard", null, "#8e44ad", true, 1);
                    }

                    // Gated progression scrap drops for Material Cavern Bosses
                    if (dStage < 150) {
                        if (typeof window.addEtcDrop === "function") window.addEtcDrop("Rare Scrap", window.randInt(1, 3));
                    } else if (dStage < 350) {
                        if (Math.random() < 0.30) { if (typeof window.addEtcDrop === "function") window.addEtcDrop("Magic Scrap", 1); }
                        else { if (typeof window.addEtcDrop === "function") window.addEtcDrop("Rare Scrap", 1); }
                    } else if (dStage < 600) {
                        let rRoll = Math.random();
                        if (rRoll < 0.10) { if (typeof window.addEtcDrop === "function") window.addEtcDrop("Legendary Scrap", 1); }
                        else if (rRoll < 0.50) { if (typeof window.addEtcDrop === "function") window.addEtcDrop("Epic Scrap", 1); }
                        else { if (typeof window.addEtcDrop === "function") window.addEtcDrop("Magic Scrap", 1); }
                    } else if (dStage < 850) {
                        let rRoll = Math.random();
                        if (rRoll < 0.20) { if (typeof window.addEtcDrop === "function") window.addEtcDrop("Mythic Scrap", 1); }
                        else if (rRoll < 0.60) { if (typeof window.addEtcDrop === "function") window.addEtcDrop("Legendary Scrap", 1); }
                        else { if (typeof window.addEtcDrop === "function") window.addEtcDrop("Epic Scrap", 1); }
                    } else {
                        if (Math.random() < 0.70) { if (typeof window.addEtcDrop === "function") window.addEtcDrop("Mythic Scrap", 1); }
                        else { if (typeof window.addEtcDrop === "function") window.addEtcDrop("Legendary Scrap", 1); }
                    }
                } else {
                    // Normal minion drops inside the Material Pit
                    let r = Math.random();
                    if (dStage < 150) {
                        if (typeof window.addEtcDrop === "function") window.addEtcDrop("Monster Soul", 1);
                    } else if (dStage < 350) {
                        if (r < 0.25) { if (typeof window.addEtcDrop === "function") window.addEtcDrop("Rare Scrap", 1); }
                        else { if (typeof window.addEtcDrop === "function") window.addEtcDrop("Monster Soul", 1); }
                    } else if (dStage < 600) {
                        if (r < 0.20) { if (typeof window.addEtcDrop === "function") window.addEtcDrop("Magic Scrap", 1); }
                        else if (r < 0.60) { if (typeof window.addEtcDrop === "function") window.addEtcDrop("Rare Scrap", 1); }
                        else { if (typeof window.addEtcDrop === "function") window.addEtcDrop("Monster Soul", 1); }
                    } else if (dStage < 850) {
                        if (r < 0.20) { if (typeof window.addEtcDrop === "function") window.addEtcDrop("Epic Scrap", 1); }
                        else if (r < 0.60) { if (typeof window.addEtcDrop === "function") window.addEtcDrop("Magic Scrap", 1); }
                        else { if (typeof window.addEtcDrop === "function") window.addEtcDrop("Rare Scrap", 1); }
                    } else {
                        if (r < 0.20) { if (typeof window.addEtcDrop === "function") window.addEtcDrop("Legendary Scrap", 1); }
                        else if (r < 0.70) { if (typeof window.addEtcDrop === "function") window.addEtcDrop("Epic Scrap", 1); }
                        else { if (typeof window.addEtcDrop === "function") window.addEtcDrop("Magic Scrap", 1); }
                    }
                }
            }
        } else {
            let baseDropRate = window.playerStats.isUberBoss ? 1.0 : (isBoss ? 0.01 : (window.mob.isRare ? 0.005 : 0.001));
            if (Math.random() < (baseDropRate * p.drop * window.state.efficiency)) { if (typeof window.rollEquipmentDrop === "function") window.rollEquipmentDrop(isBoss, false, 0, window.mob.isRare); }
        }

        if (window.playerStats.isUberBoss) {
            let bossType = window.playerStats.currentUberBoss || 'guardian';
            if (bossType === 'chronos') {
                if (Math.random() < 0.10) { if (typeof window.addEtcDrop === "function") window.addEtcDrop("Gacha Key", 1); }
                if (Math.random() < 0.10) { if (typeof window.addEtcDrop === "function") window.addEtcDrop("Eridium Shard", 1); }
                if (Math.random() < 0.15) { if (typeof window.addEtcDrop === "function") window.addEtcDrop("Legendary Scrap", 1); }
                if (typeof window.pushLog === "function") window.pushLog("<span style='color:#f1c40f; font-weight:bold;'>[VICTORY] Chronos Arbitrator defeated! Salvaged temporal components.</span>");
                if (typeof window.pushHeaderToast === "function") window.pushHeaderToast("⏳ Chronos Hunt Successful!", "#f1c40f");
            } else if (bossType === 'nexus') {
                if (Math.random() < 0.10) { if (typeof window.addEtcDrop === "function") window.addEtcDrop("Gacha Key", 1); }
                if (Math.random() < 0.05) { if (typeof window.addEtcDrop === "function") window.addEtcDrop("Catalyst Core", 1); }
                if (Math.random() < 0.15) { if (typeof window.addEtcDrop === "function") window.addEtcDrop("Mythic Scrap", 1); }
                if (typeof window.pushLog === "function") window.pushLog("<span style='color:#ff007f; font-weight:bold;'>[VICTORY] Nexus Overseer purged! Harvested raw components.</span>");
                if (typeof window.pushHeaderToast === "function") window.pushHeaderToast("👾 Nexus Purge Successful!", "#ff007f");
            } else {
                if (Math.random() < 0.10) { if (typeof window.addEtcDrop === "function") window.addEtcDrop("Gacha Key", 1); }
                if (Math.random() < 0.10) { if (typeof window.addEtcDrop === "function") window.addEtcDrop("Eridium Shard", 1); }
                if (Math.random() < 0.15) { if (typeof window.addEtcDrop === "function") window.addEtcDrop("Legendary Scrap", 1); }
                if (typeof window.pushLog === "function") window.pushLog("<span style='color:#3498db; font-weight:bold;'>[VICTORY] Aegis Goliath defeated! Obtained protective plates.</span>");
                if (typeof window.pushHeaderToast === "function") window.pushHeaderToast("🛡️ Aegis Hunt Successful!", "#3498db");
            }
            window.playerStats.riftGuardiansSlain = (window.playerStats.riftGuardiansSlain || 0) + 1;
        } else if (window.mob.type === "boss") {
            if (Math.random() < 0.01) { if (typeof window.addEtcDrop === "function") window.addEtcDrop("Eridium Shard", 1); if (typeof window.pushToast === "function") window.pushToast("Eridium Shard", null, "#8e44ad", true, 1); }
            // Gacha Key is extremely rare on normal campaign bosses, gated behind Stage 200+
            if (window.playerStats.stage >= 200 && Math.random() < 0.002) {
                if (typeof window.addEtcDrop === "function") window.addEtcDrop("Gacha Key", 1);
                if (typeof window.pushToast === "function") window.pushToast("Gacha Key", null, "#f1c40f", true, 1);
            }
        } else if (!isBoss && !window.playerStats.isDungeonMode) {
        if (Math.random() < (window.mob.isRare ? 0.08 : 0.03)) {
            let etcItemName = window.mob.isRare ? "Luminous Soul" : "Monster Soul";
            if (typeof window.addEtcDrop === "function") window.addEtcDrop(etcItemName);
            window.effects.push({ x: window.mob.x + 10, y: window.mob.y + 10, text: "+1 " + etcItemName, color: window.mob.isRare ? "#f1c40f" : "#bdc3c7", life: 70 });
        }
    }

    window.playerStats.totalLifetimeKills++;
    if (window.playerStats.runKills !== undefined) window.playerStats.runKills++;

    // Handle Prestige Boss death checks and skip normal campaign rewards
    if (window.mob && window.mob.type === "prestige_boss") {
        if (typeof window.triggerPrestigeAscension === "function") window.triggerPrestigeAscension();
        return;
    }

    if (window.checkArtifactTrait("frenzy")) {
        if (window.playerStats.frenzyTimer <= 0) {
            window.playerStats.frenzyKillCount++;
            if (window.playerStats.frenzyKillCount >= 8) {
                window.playerStats.frenzyTimer = window.checkArtifactTrait("extend_buffs") ? 900 : 600;
                window.playerStats.frenzyKillCount = 0;
                if (typeof window.pushLog === "function") window.pushLog(`<strong style='color:#e67e22;'>[BERSERKER RAGE]</strong> 100% Critical Frenzy Unleashed!`);
            }
        }
    }

    if (window.playerStats.isDungeonMode) {
        if (window.mob.type === "dungeon_boss") {
            let dType = window.playerStats.currentDungeon;
            window.playerStats.currentDungeonStage[dType]++;
            let nextStg = window.playerStats.currentDungeonStage[dType];
            window.playerStats.dungeonPeaks[dType] = Math.max(window.playerStats.dungeonPeaks[dType] || 1, nextStg);
            window.playerStats.killCount = 0;

            if (typeof window.pushLog === "function") window.pushLog(`<span style='color:#2ecc71; font-weight:bold;'>[DUNGEON STAGE CLEAR] Advanced to Dungeon Stage ${nextStg}!</span>`);
        } else {
            window.playerStats.killCount++;
        }
    } else if (isBoss) {
        if (!window.playerStats.isUberBoss) {
            let oldMax = window.playerStats.maxStage;
            window.playerStats.stage++;
            window.playerStats.maxStage = Math.max(window.playerStats.maxStage || 1, window.playerStats.stage);
            window.playerStats.lifetimePeakStage = Math.max(window.playerStats.lifetimePeakStage || 1, window.playerStats.maxStage);
            if (typeof window.pushLog === "function") window.pushLog(`<span style='color:#2ecc71; font-weight:bold;'>[AREA CLEARED] Advancing to Stage ${window.playerStats.stage}.</span>`);

            // First-time milestone clear reward (Stage 10, 20, 30...)
            if (window.playerStats.maxStage > oldMax && oldMax % 10 === 0) {
                if (typeof window.pushLog === "function") window.pushLog(`<strong style="color:#f1c40f;">🏆 [MILESTONE] Stage ${oldMax} Beaten! Guaranteed random equip dropped!</strong>`);
                if (typeof window.pushHeaderToast === "function") window.pushHeaderToast(`🏆 Milestone Drop: Stage ${oldMax} Cleared!`, "#f1c40f");
                if (typeof window.rollEquipmentDrop === "function") window.rollEquipmentDrop(true, false, 0, false);
            }
        }
        window.playerStats.killCount = 0; window.playerStats.isBossMode = false; window.playerStats.isFarmingLoop = false; window.playerStats.isUberBoss = false;
        window.playerStats.currentHp = p.maxHp; if (typeof window.saveGame === "function") window.saveGame();
    } else {
        if (!window.playerStats.isFarmingLoop) {
            window.playerStats.killCount++;
            if (window.playerStats.killCount >= window.playerStats.targetsRequired) window.playerStats.isBossMode = true;
        }
    }
    window.mob = null;
    if (typeof window.checkAchievements === "function") window.checkAchievements();
    if (typeof window.updateUI === "function") window.updateUI();
};

window.processEnemySpawn = function() {    // 2. BACKGROUND SCENERY & VEGETATION (Every element outlined)

    let p = window.resolvePlayerStats();

    if (window.playerStats.isCrucibleMode) {
        let cWave = window.playerStats.crucibleWave || 1;
        let growthRate = 1.06 + (cWave * 0.00015);
        let scale = Math.pow(growthRate, cWave);
        if (window.playerStats.killCount >= window.playerStats.targetsRequired) {
            let hp = Math.floor(60 * scale);
            window.mob = { x: 750, y: 140, w: 45, h: 75, type: "dungeon_boss", isCrucible: true, isRare: false, hp: hp, maxHp: hp, damage: Math.floor(20 * scale), def: Math.floor(6.0 * scale), flashTimer: 0, isStopped: false, attackCooldown: 100, attackTimer: 100 };
        } else {
            let cruciblePool = ["rift_drifter", "star_weaver", "void_wraith"];
            let chosenVisual = cruciblePool[Math.floor(Math.random() * cruciblePool.length)];
            let isFlying = ["rift_drifter", "void_wraith"].includes(chosenVisual);

            let hp = Math.floor(15 * scale);
            window.mob = { x: 750, y: isFlying ? 145 : 195, w: 25, h: 30, type: "mob", visualType: chosenVisual, isCrucible: true, isRare: false, hp: hp, maxHp: hp, damage: Math.floor(5.2 * scale), def: Math.floor(1.2 * scale), flashTimer: 0, isStopped: false, attackCooldown: 90, attackTimer: 90 };
        }
        return;
    }

    let scale;
        if (window.playerStats.isDungeonMode) {
            window.playerStats.currentDungeonStage = window.playerStats.currentDungeonStage || { equip: 1, gold: 1, mat: 1 };
            let dStage = window.playerStats.currentDungeonStage[window.playerStats.currentDungeon] || 1;

            // Steep exponential growth scaling specifically configured for Dungeons to serve as a progression check
            let growthRate = 1.08 + (dStage * 0.00025);
            scale = Math.pow(growthRate, dStage);
        } else {
            let activeStage = window.playerStats.stage;
            if (window.playerStats.isUberBoss) {
                let runPeak = Math.max(window.playerStats.stage, window.playerStats.maxStage || 1);
                let allTime90 = Math.floor((window.playerStats.lifetimePeakStage || 1) * 0.90);
                activeStage = Math.max(runPeak, allTime90);
            }
            let growthRate = 1.06 + (activeStage * 0.00015);
            scale = Math.pow(growthRate, activeStage);
        }

    if (window.playerStats.isDungeonMode) {
        let hpScale = window.playerStats.currentDungeon === 'gold' ? 1.5 : 1;

        if (window.playerStats.killCount >= window.playerStats.targetsRequired) {
            let hp = 60 * scale * hpScale;
            window.mob = { x: 750, y: 140, w: 50, h: 90, type: "dungeon_boss", isRare: false, hp: Math.floor(hp), maxHp: Math.floor(hp), damage: Math.floor(20 * scale), def: Math.floor(6.0 * scale), flashTimer: 0, isStopped: false, attackCooldown: 100, attackTimer: 100 };
            window.playerStats.hasClickedThisBattle = false; window.playerStats.damageTakenThisBattle = 0; window.playerStats.ankhTriggeredThisBattle = false;
        } else {
            let dType = window.playerStats.currentDungeon || 'gold';
            let dPool = [];
            if (dType === 'equip') dPool = ["golem", "gargoyle", "wyrmling"];
            else if (dType === 'gold') dPool = ["gold_slime", "gold_golem", "gilded_wyrmling"];
            else dPool = ["swamp_basilisk", "toxic_fly", "marsh_ghost"];

            let chosenVisual = dPool[Math.floor(Math.random() * dPool.length)];
            let isFlying = ["gargoyle", "toxic_fly", "marsh_ghost", "gilded_wyrmling", "wyrmling"].includes(chosenVisual);

            window.mob = {
                x: 750, y: isFlying ? 150 : 195, w: 25, h: 40, type: "mob", visualType: chosenVisual, isRare: false,
                hp: Math.floor(15 * scale * hpScale), maxHp: Math.floor(15 * scale * hpScale), damage: Math.floor(5.2 * scale), def: Math.floor(1.2 * scale),
                flashTimer: 0, isStopped: false, attackCooldown: 90, attackTimer: 90
            };
        }
    } else {
        let tier = window.getStageTier();
        if (window.playerStats.isBossMode) {
            if (window.playerStats.isUberBoss) {
                let bossType = window.playerStats.currentUberBoss || 'guardian';
                let hpMult = 10.0; let dmgMult = 10.0; let speedMult = 100;
                let mType = "aegis_goliath"; let logText = "**Aegis Goliath, The Iron Sentinel** has materialized from the cracked Aether!";

                if (bossType === 'chronos') { speedMult = 90; mType = "chronos_arbitrator"; logText = "**Chronos Arbitrator** has stepped from the temporal flow!"; }
                else if (bossType === 'nexus') { speedMult = 80; mType = "nexus_overseer"; logText = "**Nexus Overseer** has infected the reality stream!"; }

                let hp = Math.floor(hpMult * (60 * scale)); let dmg = Math.floor(20 * scale * dmgMult);
                window.mob = {
                    x: 750, y: 115, w: 60, h: 100, type: mType, isRare: false,
                    hp: hp, maxHp: hp, damage: dmg, def: Math.floor(8.0 * scale), flashTimer: 0, isStopped: false, attackCooldown: speedMult, attackTimer: speedMult
                };
                window.pushLog(`<span style='color:#9b59b6; font-weight:bold;'>[RIFT HUNT]</span> ${logText}`);
            } else {
                let baseBossHp = 60 * scale;
                window.mob = { x: 750, y: 150, w: 40, h: 80, type: "boss", isRare: false, visualTier: tier, hp: Math.floor(baseBossHp), maxHp: Math.floor(baseBossHp), damage: Math.floor(20 * scale), def: Math.floor(6.0 * scale), flashTimer: 0, isStopped: false, attackCooldown: 100, attackTimer: 100 };
                window.pushLog(`<span style='color:#e74c3c; font-weight:bold;'>[STAGE BOSS]</span> blocked your transit route!`);
            }
            window.playerStats.hasClickedThisBattle = false; window.playerStats.damageTakenThisBattle = 0; window.playerStats.ankhTriggeredThisBattle = false;
        } else {
            let isMelee = Math.random() > 0.5; let isRare = Math.random() < p.rareSpawn;
            let hpMult = isRare ? 2.5 : 1; let dmgMult = isRare ? 1.5 : 1;

            let visualPool = {
                0: ["slime", "sprout", "thorn_wyrm"], 1: ["golem", "wyrmling", "gargoyle"],
                2: ["magma_elemental", "lava_serpent", "hell_bat"], 3: ["marsh_ghost", "swamp_basilisk", "toxic_fly"],
                4: ["void_orb", "void_crawler", "void_spectre"], 5: ["clockwork_scarab", "temporal_watcher", "clockwork_drone"],
                6: ["neon_spider", "cyber_wraith", "wireframe_orb"]
            };
            let choices = visualPool[tier] || ["slime"];
            let visualType = choices[Math.floor(Math.random() * choices.length)];

            let baseSpd = 90;
            if (window.equippedSlots.subweapon && window.equippedSlots.subweapon.isUniqueWatch && window.playerStats.watchActiveTimer > 0) baseSpd = Math.round(baseSpd * 1.33);

            window.mob = { x: 750, y: isMelee ? 195 : 210, w: isMelee ? 25 : 30, h: isMelee ? 40 : 25, type: "mob", visualType: visualType, isRare: isRare, isMelee: isMelee, visualTier: tier, hp: Math.floor(15 * scale * hpMult), maxHp: Math.floor(15 * scale * hpMult), damage: Math.floor(5.2 * scale * dmgMult), def: Math.floor(1.2 * scale * (isRare ? 1.5 : 1)), flashTimer: 0, isStopped: false, attackCooldown: baseSpd, attackTimer: baseSpd };

            if (isRare) {
                window.pushLog(`<span style='color:#ffb6c1; font-weight:bold;'>✨ A glowing Rare enemy appears!</span>`);
                if (p.hasSingularitySet) {
                    window.playerStats.frenzyTimer = window.checkArtifactTrait("extend_buffs") ? 600 : 300;
                    window.pushLog(`<span style='color:#9b59b6;'>[SINGULARITY] Instantly triggered Frenzy Mode!</span>`);
                }
            }
        }
    }
    if (window.mob) window.mob.id = window.idCounter++;

    if (window.mob && window.playerStats.maelstromCleavePool && window.playerStats.maelstromCleavePool > 0) {
        let cleave = window.playerStats.maelstromCleavePool;
        window.playerStats.maelstromCleavePool = 0;
        window.mob.hp -= cleave; window.mob.flashTimer = 5;
        window.spawnDamageEffect(cleave, 'echo', false);
        window.effects.push({ x: window.mob.x, y: window.mob.y - 12, text: "🌪️ CLEAVED!", color: "#2ecc71", life: 55 });
        if (window.mob.hp <= 0) setTimeout(() => window.handleMobDeath(), 50);
    }
};

window.handlePlayerDefeat = function() {
    window.effects = window.effects.filter(e => !e.isCumulative);
    window.isGamePaused = true;
    window.deathAnimationTimer = 0;
    window.playerStats.deathCount = (window.playerStats.deathCount || 0) + 1;

    let wasCrucible = window.playerStats.isCrucibleMode;
    let wasDungeon = window.playerStats.isDungeonMode;
    let activeDungeon = window.playerStats.currentDungeon;
    let dungeonFloor = wasDungeon && activeDungeon ? (window.playerStats.currentDungeonStage[activeDungeon] || 1) : 1;
    let finalWave = window.playerStats.crucibleWave || 1;

    window.playerStats.isBossMode = false; window.playerStats.isFarmingLoop = false; window.playerStats.isUberBoss = false;
    window.playerStats.isDungeonMode = false; window.playerStats.isCrucibleMode = false; window.playerStats.isPrestigeBossMode = false;
    window.playerStats.prestigeApproachTimer = 0; window.mob = null; window.playerStats.usedSecondWind = false; window.hero.x = 40;

    window.SoundManager.play('defeat');

    if (wasCrucible) {
            let startW = window.playerStats.crucibleStartWave || 1; let gainedShards = 0; let gainedCores = 0;
            for (let w = startW; w < finalWave; w++) {
                gainedShards += Math.ceil(1.5 * (1 + (w * 0.03)));

                // Highly gated and scaled Catalyst Core drop rates over 1,000 waves
                if (w > 20) {
                    if (w <= 50) {
                        if (w % 10 === 0 && Math.random() < 0.20) gainedCores++;
                    } else if (w <= 150) {
                        if (w % 10 === 0) gainedCores++;
                    } else if (w <= 350) {
                        if (w % 10 === 0) gainedCores++;
                        else if (Math.random() < 0.01) gainedCores++;
                    } else if (w <= 700) {
                        if (w % 10 === 0) gainedCores++;
                        else if (Math.random() < 0.025) gainedCores++;
                    } else {
                        if (w % 10 === 0) gainedCores++;
                        else if (Math.random() < 0.05) gainedCores++;
                    }
                }
            }
            window.playerStats.astralShards = (window.playerStats.astralShards || 0) + gainedShards;
            if (gainedCores > 0) window.addEtcDrop("Catalyst Core", gainedCores);
            window.showCrucibleSummaryModal(finalWave, gainedShards, gainedCores);
            return;
        }

    let prestigeCount = window.playerStats.prestigeCount || 0;
    let rollbackPercent = 0.80;
    if (prestigeCount >= 1) rollbackPercent = Math.min(0.95, 0.90 + (prestigeCount - 1) * 0.01);

    let restartStage;
    if (wasDungeon) {
        restartStage = window.playerStats.stage;
        let dNames = { 'equip': 'Equipment Dungeon', 'gold': 'Gold Mine', 'mat': 'Material Cavern' };
        let dName = dNames[activeDungeon] || "Dungeon";
        document.getElementById('death-stat-peak').innerText = `${dName} Floor ${dungeonFloor}`;
        document.getElementById('death-stat-retreat').innerText = `Campaign Stage ${restartStage}`;
    } else {
        restartStage = Math.max(1, Math.floor((window.playerStats.maxStage || 1) * rollbackPercent));
        window.playerStats.stage = restartStage;
        document.getElementById('death-stat-peak').innerText = `Stage ${window.playerStats.maxStage || 1}`;
        document.getElementById('death-stat-retreat').innerText = `Stage ${restartStage}`;
    }

    document.getElementById('death-stat-kills').innerText = (window.playerStats.runKills || 0).toLocaleString();
    document.getElementById('death-stat-run-gold').innerText = `+` + (window.playerStats.runGold || 0).toLocaleString();
    document.getElementById('death-stat-run-xp').innerText = `+` + (window.playerStats.runXp || 0).toLocaleString();
    document.getElementById('death-tip-text').innerText = "Reforging modifiers with Catalyst Cores and tempering weapon components significantly increases battle survivability.";

    window.updateUI();

    if (wasDungeon) window.pushLog(`<span style='color:#e74c3c; font-weight:bold;'>[DUNGEON STAGE FAILIURE] Died on Dungeon Floor. Safely returned to Campaign Stage ${restartStage}.</span>`);
    else window.pushLog(`<span style='color:#e74c3c; font-weight:bold;'>[DEFEATED] Returned to Stage ${restartStage} (${Math.round(rollbackPercent * 100)}% of Max Stage). No equipment lost!</span>`);

    document.getElementById('death-overlay').style.display = "flex"; window.saveGame();

    let timeLeft = 10;
    const spinner = document.getElementById('death-respawn-spinner');
    const timerText = document.getElementById('death-respawn-timer-text');
    const secondsLabel = document.getElementById('death-timer-seconds');

    if (spinner) spinner.style.strokeDashoffset = "0";
    if (timerText) timerText.innerText = timeLeft;
    if (secondsLabel) secondsLabel.innerText = timeLeft;
    if (window.respawnIntervalId) clearInterval(window.respawnIntervalId);

    let tickCount = 0;
    const tickRate = 100;
    const totalTicks = 10 * (1000 / tickRate);

    window.respawnIntervalId = setInterval(() => {
        if (window.isGamePaused) {
            tickCount++; let progress = tickCount / totalTicks; let remainingSeconds = Math.ceil(10 - (tickCount * tickRate / 1000));
            if (spinner) spinner.style.strokeDashoffset = (progress * 113.1).toFixed(2);
            if (timerText) timerText.innerText = remainingSeconds;
            if (secondsLabel) secondsLabel.innerText = remainingSeconds;
            if (tickCount >= totalTicks) { clearInterval(window.respawnIntervalId); window.respawnIntervalId = null; window.respawnHero(); }
        } else { clearInterval(window.respawnIntervalId); window.respawnIntervalId = null; }
    }, tickRate);
};

window.respawnHero = function() {
    if (window.respawnIntervalId) { clearInterval(window.respawnIntervalId); window.respawnIntervalId = null; }
    document.getElementById('death-overlay').style.display = "none";
    let p = window.resolvePlayerStats(); window.playerStats.currentHp = p.maxHp;

    window.mob = null; window.projectiles = []; window.hero.x = 40;
    window.playerStats.runKills = 0; window.playerStats.runGold = 0; window.playerStats.runXp = 0;
    window.playerStats.killedBy = "Unknown Foe"; window.playerStats.killedByMob = null;

    window.deathAnimationTimer = 0; window.SoundManager.play('revive');
    window.updateUI(); window.reviveTimer = 90; window.setPauseState(false);
};

window.useItem = function(itemName) {
    if (!window.inventory.USE[itemName] || window.inventory.USE[itemName] <= 0) return;
    let pBefore = window.resolvePlayerStats();
    let baseBonusDuration = 18000;
    let effectiveInt = Math.max(0, pBefore.int - 5);
    let intBonusMultiplier = 1 + (effectiveInt * 1.5 / (effectiveInt + 500));
    let achDurationBonus = 1.0;
    if (window.playerStats.unlockedAchievements && window.AchievementsData) {
        window.playerStats.unlockedAchievements.forEach(id => {
            let ach = window.AchievementsData.find(a => a.id === id);
            if (ach && ach.stats && ach.stats.potDurationPct) achDurationBonus += ach.stats.potDurationPct;
        });
    }
    let finalDuration = Math.floor(baseBonusDuration * intBonusMultiplier * achDurationBonus);

    function consumeUseItem(name) {
        if (window.checkArtifactTrait("philosopher_catalyst") && Math.random() < 0.25) {
            window.pushHeaderToast("✨ Elixir Sparing Effect Triggered!", "#2ecc71");
            window.pushLog(`<strong style='color:#9b59b6;'>[PHILOSOPHER'S CATALYST]</strong> Sparing check passed! Your ${name} was not consumed.`);
        } else {
            window.inventory.USE[name]--;
            if (window.inventory.USE[name] === 0) delete window.inventory.USE[name];
        }
        window.playerStats.elixirsConsumed = (window.playerStats.elixirsConsumed || 0) + 1;
        window.checkAchievements(); window.pushHeaderToast(`Consumed ${name}!`, "#2ecc71");
    }

    if (itemName === "SP Reset Scroll") {
        let totalRefund = 0;
        for (let key in window.playerStats.spAllocations) { totalRefund += window.playerStats.spAllocations[key]; window.playerStats.spAllocations[key] = 0; }
        if (totalRefund === 0) { window.pushHeaderToast("No SP allocated to reset!", "#e74c3c"); return; }
        window.playerStats.sp += totalRefund; window.inventory.USE[itemName]--; if (window.inventory.USE[itemName] === 0) delete window.inventory.USE[itemName];
        window.pushLog("<span style='color:#3498db; font-weight:bold;'>[USE] Used SP Reset Scroll. All Attribute Matrix SP refunded!</span>"); window.pushHeaderToast("🔮 Attribute SP Reset Successfully!", "#3498db");
    } else if (itemName === "PP Reset Scroll") {
        let upgrades = window.playerStats.prestigeUpgrades || { bag: 0, gold: 0, exp: 0, drop: 0 };
        let totalRefund = 0;
        for (let key in upgrades) { totalRefund += upgrades[key]; upgrades[key] = 0; }
        if (totalRefund === 0) { window.pushHeaderToast("No PP allocated to reset!", "#e74c3c"); return; }
        window.playerStats.prestigePoints += totalRefund; window.inventory.USE[itemName]--; if (window.inventory.USE[itemName] === 0) delete window.inventory.USE[itemName];
        window.pushLog("<span style='color:#e67e22; font-weight:bold;'>[USE] Used PP Reset Scroll. All Ascension upgrades refunded!</span>"); window.pushHeaderToast("🔮 Prestige Points Reset Successfully!", "#e67e22");
        if(typeof window.renderPrestigeTab === "function") window.renderPrestigeTab();
    } else if (itemName.includes("Attack Elixir")) {
        if (window.playerStats.atkPotionTimer > 0 && window.playerStats.atkPotionStrength < (itemName.includes("Supernal") ? 0.35 : (itemName.includes("Greater") ? 0.20 : 0.10))) window.playerStats.hasTriggeredAlchemicalSynthesis = true;
        window.playerStats.atkPotionTimer = finalDuration; window.playerStats.atkPotionStrength = itemName.includes("Supernal") ? 0.35 : (itemName.includes("Greater") ? 0.20 : 0.10);
        consumeUseItem(itemName); window.pushLog(`<span style='color:#2ecc71; font-weight:bold;'>[USE] Consumed ${itemName}! Attack boosted for ${Math.floor(finalDuration/60)}s.</span>`);
    } else if (itemName.includes("Vitality Elixir")) {
        window.playerStats.hpPotionTimer = finalDuration; window.playerStats.hpPotionStrength = itemName.includes("Supernal") ? 0.35 : (itemName.includes("Greater") ? 0.20 : 0.10);
        consumeUseItem(itemName); window.pushLog(`<span style='color:#e74c3c; font-weight:bold;'>[USE] Consumed ${itemName}! Max HP boosted for ${Math.floor(finalDuration/60)}s.</span>`);
    } else if (itemName.includes("Armored Elixir")) {
        window.playerStats.defPotionTimer = finalDuration; window.playerStats.defPotionStrength = itemName.includes("Supernal") ? 0.35 : (itemName.includes("Greater") ? 0.20 : 0.10);
        consumeUseItem(itemName); window.pushLog(`<span style='color:#3498db; font-weight:bold;'>[USE] Consumed ${itemName}! Defense boosted for ${Math.floor(finalDuration/60)}s.</span>`);
    } else if (itemName.includes("Haste Elixir")) {
        window.playerStats.hastePotionTimer = finalDuration; window.playerStats.hastePotionStrength = itemName.includes("Supernal") ? 3 : (itemName.includes("Greater") ? 2 : 1);
        consumeUseItem(itemName); window.pushLog(`<span style='color:#f1c40f; font-weight:bold;'>[USE] Consumed ${itemName}! Speed boosted for ${Math.floor(finalDuration/60)}s.</span>`);
    }

    let pAfter = window.resolvePlayerStats();
    window.playerStats.currentHp = Math.max(1, Math.min(pAfter.maxHp, Math.floor((window.playerStats.currentHp / pBefore.maxHp) * pAfter.maxHp)));
    setTimeout(() => { window.updateUI(); window.renderInventory(); window.saveGame(); }, 50);
};

window.triggerFairyLoot = function(targetFairy) {
    let p = window.resolvePlayerStats();
    let maxBag = window.getMaxBagSlots();
    let spawnX = targetFairy.x;
    let spawnY = targetFairy.y + Math.sin(Date.now() / 200 + targetFairy.offset) * 10;

    if (window.activeFairies.length >= 2) {
        window.playerStats.fairyClicksWindow = window.playerStats.fairyClicksWindow || [];
        let clickNow = Date.now(); window.playerStats.fairyClicksWindow.push(clickNow);
        window.playerStats.fairyClicksWindow = window.playerStats.fairyClicksWindow.filter(t => clickNow - t <= 2000);
        if (window.playerStats.fairyClicksWindow.length >= 3) window.playerStats.hasTriggeredPatientShepherd = true;
    }

    window.playerStats.fairyClicksWindowLong = window.playerStats.fairyClicksWindowLong || [];
    let longNow = Date.now(); window.playerStats.fairyClicksWindowLong.push(longNow);
    window.playerStats.fairyClicksWindowLong = window.playerStats.fairyClicksWindowLong.filter(t => longNow - t <= 10000);
    window.playerStats.maxFairyClicksInWindow = Math.max(window.playerStats.maxFairyClicksInWindow || 0, window.playerStats.fairyClicksWindowLong.length);

    window.activeFairies = window.activeFairies.filter(f => f.id !== targetFairy.id);
    window.SoundManager.play('fairy');
    window.playerStats.fairiesClicked = (window.playerStats.fairiesClicked || 0) + 1;

    for (let i = 0; i < 15; i++) {
        window.particles.push({
            x: spawnX, y: spawnY, vx: window.randFloat(-4, 4), vy: window.randFloat(-6, -1),
            radius: window.randFloat(2, 4), color: targetFairy.color || "#f1c40f", alpha: 1, life: window.randInt(25, 45)
        });
    }

    if (window.checkArtifactTrait("fairy_wealth") && Math.random() < 0.15) {
            window.addEtcDrop("Luminous Soul", 1);
            window.effects.push({ x: spawnX, y: spawnY - 10, text: `💖 +1 Luminous Soul!`, color: "#ffb6c1", life: 80 });
            window.pushLog(`<strong style='color:#ffb6c1;'>[FAIRY QUEEN'S CROWN]</strong> Extracted 1 Luminous Soul from the fairy magic!`);
            return;
        }

    if (Math.random() < 0.20) {
        let goldYield = Math.floor((100 + (window.playerStats.stage * 35)) * p.gold);
        window.playerStats.coins += goldYield;
        if (window.playerStats.runGold !== undefined) window.playerStats.runGold += goldYield; else window.playerStats.runGold = goldYield;
        window.effects.push({ x: spawnX, y: spawnY - 10, text: `+${goldYield} Gold!`, color: "#f1c40f", life: 80 });
        return;
    }

    let types = ["weapon", "subweapon", "helmet", "chest", "leggings", "overall", "boots"];
    let chosenType = types[Math.floor(Math.random() * types.length)];
    let statLinesCount = 0; let luckMultiplier = p.qly; let roll = Math.random() * 100;

    if (roll < (0.01 * luckMultiplier)) statLinesCount = 5;
    else if (roll < (0.05 * luckMultiplier)) statLinesCount = 4;
    else if (roll < (0.50 * luckMultiplier)) statLinesCount = 3;
    else if (roll < (2.50 * luckMultiplier)) statLinesCount = 2;
    else if (roll < (10.00 * luckMultiplier)) statLinesCount = 1;
    else statLinesCount = 0;

    let activeStage = window.playerStats.stage;
    if (window.playerStats.isDungeonMode && window.playerStats.currentDungeon) {
        activeStage = window.playerStats.currentDungeonStage[window.playerStats.currentDungeon] || 1;
    }
    let stageScale = Math.floor((activeStage - 1) / 10) + 1;
    let newItem = window.createItemObject(chosenType, statLinesCount, stageScale, 0);

    if (window.checkAutoSalvage(newItem, false)) {
        window.beams.push({ x: spawnX, color: window.getTierColor(newItem.statsRolled), life: 35, maxLife: 35 });
        window.checkAchievements(); window.updateUI(); return;
    }

    if (window.inventory.EQUIP.length >= maxBag) {
        window.pushHeaderToast(`Sacks Full! Soul gathered.`, "#e74c3c"); window.addEtcDrop("Monster Soul", 5); return;
    }

    window.inventory.EQUIP.push(newItem);
    window.pushLog(`<strong style='color:#ffb6c1;'>[FAIRY]</strong> Dropped: <span style='color:${window.getTierColor(newItem.statsRolled)};'>${newItem.name}</span>`, newItem.id);

    let color = window.getTierColor(newItem.statsRolled);
    window.beams.push({ x: spawnX, color: color, life: 35, maxLife: 35 });

    window.pushToast(newItem.name, newItem.statsRolled, color);
    window.checkAchievements(); window.updateUI(); window.renderInventory(); if(typeof window.renderForgeTab==="function")window.renderForgeTab();
};

window.saveCurrentActivityPeak = function() {
    if (window.playerStats.isCrucibleMode) {
        let finalWave = window.playerStats.crucibleWave || 1;
        window.playerStats.cruciblePeak = Math.max(window.playerStats.cruciblePeak || 1, finalWave);
    } else if (window.playerStats.isDungeonMode && window.playerStats.currentDungeon) {
        let dType = window.playerStats.currentDungeon;
        let dStage = window.playerStats.currentDungeonStage[dType] || 1;
        window.playerStats.dungeonPeaks[dType] = Math.max(window.playerStats.dungeonPeaks[dType] || 1, dStage);
    }
};

window.enterDungeon = function(type) {
    if (window.playerStats.isDungeonMode || window.playerStats.isCrucibleMode || window.playerStats.isPrestigeBossMode) {
        window.pushHeaderToast("Cannot enter: already in another activity!", "#e74c3c"); return;
    }
    let countField = type + 'Keys'; let timeField = 'next' + type.charAt(0).toUpperCase() + type.slice(1) + 'KeyTime';
    if (window.playerStats[countField] < 1) { window.pushHeaderToast("Not enough keys!", "#e74c3c"); return; }

    let dNames = { 'equip': 'Equipment Dungeon', 'gold': 'Gold Mine', 'mat': 'Material Cavern' };
    window.playerStats.dungeonPeaks = window.playerStats.dungeonPeaks || { equip: 1, gold: 1, mat: 1 };
    window.playerStats.currentDungeonStage = window.playerStats.currentDungeonStage || { equip: 1, gold: 1, mat: 1 };
    let checkpoint = Math.max(1, Math.floor((window.playerStats.dungeonPeaks[type] || 1) * 0.90));

    window.showCustomConfirm(
        "Enter Infinite Dungeon",
        `Spend 1 Key to enter the Infinite ${dNames[type]}? Starting checkpoint: Stage ${checkpoint}`,
        "Enter Dungeon", "Cancel", "#8e44ad",
        function() {
            window.saveCurrentActivityPeak();
            window.playerStats[countField]--;
            if (window.playerStats[countField] === 2) window.playerStats[timeField] = Date.now() + 3600000;

            window.playerStats.isDungeonMode = true; window.playerStats.isCrucibleMode = false;
            window.playerStats.currentDungeon = type; window.playerStats.currentDungeonStage[type] = checkpoint;
            window.playerStats.dungeonWave = 1; window.playerStats.killCount = 0; window.playerStats.targetsRequired = 5;
            window.playerStats.isBossMode = false; window.playerStats.isUberBoss = false; window.mob = null;

            let p = window.resolvePlayerStats(); window.playerStats.currentHp = p.maxHp;
            window.pushLog(`<span style='color:#8e44ad; font-weight:bold;'>[DUNGEON] Descended into the Infinite ${dNames[type]} at Stage ${checkpoint}!</span>`);
            let menu = document.getElementById('dungeon-menu'); if (menu) menu.style.display = 'none';
            window.updateUI(); window.saveGame();
        }
    );
};

window.enterCrucible = function() {
    if (window.playerStats.isDungeonMode || window.playerStats.isCrucibleMode || window.playerStats.isPrestigeBossMode) {
        window.pushHeaderToast("Cannot enter: already in another activity!", "#e74c3c"); return;
    }
    let souls = window.inventory.ETC["Monster Soul"] || 0;
    if (souls < 100) { window.pushHeaderToast("Requires 100 Monster Souls!", "#e74c3c"); return; }

    let checkpoint = Math.max(1, Math.floor((window.playerStats.cruciblePeak || 1) * 0.80));

    window.showCustomConfirm(
        "Enter Astral Crucible",
        `Burn 100 Monster Souls to enter the Astral Crucible? Starting checkpoint: Wave ${checkpoint}`,
        "Enter Crucible", "Cancel", "#9b59b6",
        function() {
            window.saveCurrentActivityPeak();
            window.inventory.ETC["Monster Soul"] -= 100;
            if (window.inventory.ETC["Monster Soul"] === 0) delete window.inventory.ETC["Monster Soul"];

            window.playerStats.isCrucibleMode = true; window.playerStats.isDungeonMode = false;
            window.playerStats.crucibleWave = checkpoint; window.playerStats.crucibleStartWave = checkpoint;
            window.playerStats.killCount = 0; window.playerStats.targetsRequired = 5;
            window.playerStats.isBossMode = false; window.playerStats.isUberBoss = false; window.mob = null;

            let p = window.resolvePlayerStats(); window.playerStats.currentHp = p.maxHp;
            window.pushLog(`<span style='color:#9b59b6; font-weight:bold;'>[CRUCIBLE] Entered the Astral Crucible at Wave ${checkpoint}! Stand your ground!</span>`);
            let menu = document.getElementById('dungeon-menu'); if (menu) menu.style.display = 'none';
            window.updateUI(); window.saveGame();
        }
    );
};

window.rollEquipmentDrop = function(isBossKill, silent = false, minStars = 0, isRareMob = false) {
    let p = window.resolvePlayerStats();
    let maxBag = window.getMaxBagSlots();
    let allowArtifact = window.playerStats.isUberBoss && (Math.random() < 0.05);

    let types = ["weapon", "subweapon", "helmet", "chest", "leggings", "overall", "boots"];
    let allowedTraits = null;

    if (window.playerStats.isUberBoss) {
        let bossType = window.playerStats.currentUberBoss || 'guardian';
        if (bossType === 'guardian') {
            types = ["chest", "leggings", "overall"];
            allowedTraits = ["vampirism", "defense", "parry_strike", "second_wind", "golem_stance", "titan_grip", "dodge_buff"];
        } else if (bossType === 'chronos') {
            types = ["boots", "helmet"];
            allowedTraits = ["gold_hoard", "move_speed", "idle_spd", "extend_buffs", "fairy_wealth", "alchemist_alembic", "philosopher_catalyst"];
        } else if (bossType === 'nexus') {
            types = ["weapon", "subweapon"];
            allowedTraits = ["frenzy", "magic_find", "echo_strike", "active_spd", "bag_space", "void_pull", "cauldron_eternity"];
        }
    }

    let chosenType = allowArtifact ? "artifact" : types[Math.floor(Math.random() * types.length)];
    let statLinesCount = 0; let luckMultiplier = p.qly; let roll = Math.random() * 100;

    let chance5 = (luckMultiplier >= 2.0) ? (0.02 * luckMultiplier) : 0;
    let chance4 = (luckMultiplier >= 1.5) ? (0.16 * luckMultiplier) : 0;

    if (minStars === 1) {
        if (roll < chance5) statLinesCount = 5;
        else if (roll < (chance5 + chance4)) statLinesCount = 4;
        else if (roll < (0.80 * luckMultiplier)) statLinesCount = 3;
        else if (roll < (4.00 * luckMultiplier)) statLinesCount = 2;
        else statLinesCount = 1;
    } else {
        if (roll < chance5) statLinesCount = 5;
        else if (roll < (chance5 + chance4)) statLinesCount = 4;
        else if (roll < (0.80 * luckMultiplier)) statLinesCount = 3;
        else if (roll < (4.00 * luckMultiplier)) statLinesCount = 2;
        else if (roll < (15.00 * luckMultiplier)) statLinesCount = 1;
        else statLinesCount = 0;
    }

    let activeStage = window.playerStats.stage;
    if (window.playerStats.isDungeonMode && window.playerStats.currentDungeon) {
        activeStage = window.playerStats.currentDungeonStage[window.playerStats.currentDungeon] || 1;
    } else if (window.playerStats.isUberBoss) {
        let runPeak = Math.max(window.playerStats.stage, window.playerStats.maxStage || 1);
        let allTime90 = Math.floor((window.playerStats.lifetimePeakStage || 1) * 0.90);
        activeStage = Math.max(runPeak, allTime90);
    }
    let stageScale = Math.floor((activeStage - 1) / 10) + 1;
    let sourceName = isBossKill ? "Boss" : (isRareMob ? "Rare" : "Route");

    if (!isBossKill && !isRareMob && !window.playerStats.isDungeonMode && !window.playerStats.isCrucibleMode && statLinesCount === 5) {
        window.playerStats.hasTriggeredAgainstOdds = true;
    }

    let newItem = window.createItemObject(chosenType, statLinesCount, stageScale, minStars, allowedTraits);
    if (window.checkAutoSalvage(newItem, silent)) return;

    if (newItem.type === "artifact") {
        if (window.inventory.ARTIFACT.length >= maxBag) {
            if(!silent) { window.pushHeaderToast(`Artifact Sack Full! Astral Essence gained.`, "#e74c3c"); window.addEtcDrop("Astral Essence", 1); }
            return;
        }
    } else {
        if (window.inventory.EQUIP.length >= maxBag) {
            if(!silent) { window.pushHeaderToast(`Bag Full! Soul gained.`, "#e74c3c"); window.addEtcDrop(isBossKill ? "Ancient Core" : (isRareMob ? "Luminous Soul" : "Monster Soul"), 1); }
            return;
        }
    }

    if (!silent) {
        if (newItem.type === "artifact") window.pushLog(`<strong style='color:#1abc9c;'>⭐ UNIQUE ARTIFACT DROPPED!</strong> Extracted: <span style='color:#1abc9c;'>${newItem.name}</span>!`, newItem.id);
        else if (sourceName === "Gacha") window.pushLog(`<strong style='color:#f1c40f;'>[GACHA]</strong> Dispensed: <span style='color:${window.getTierColor(newItem.statsRolled)};'>${newItem.name}</span>`, newItem.id);
        else if (sourceName === "Rare") window.pushLog(`<strong style='color:#ffb6c1;'>RARE ENEMY KILLED!</strong> Found: <span style='color:${window.getTierColor(newItem.statsRolled)};'>${newItem.name}</span>`, newItem.id);
        else window.pushLog(`<strong style='color:#ff9f43;'>BOSS KILLED!</strong> Found: <span style='color:${window.getTierColor(newItem.statsRolled)};'>${newItem.name}</span>`, newItem.id);
    }

    if(!silent) window.pushToast(newItem.name, newItem.statsRolled, window.getTierColor(newItem.statsRolled));
    if (newItem.type === "artifact") window.inventory.ARTIFACT.push(newItem); else window.inventory.EQUIP.push(newItem);

    if (sourceName === "Gacha" && !silent && typeof window.spawnPurchaseCelebration === "function") window.spawnPurchaseCelebration('gacha', window.getTierColor(newItem.statsRolled), newItem.statsRolled);
    if(!silent) { window.checkAchievements(); window.renderInventory(); if(typeof window.renderForgeTab==="function")window.renderForgeTab(); window.updateUI(); }
};

window.generateEquipment = function(chosenType, statLinesCount, stageScale, sourceName, silent = false, minStars = 0) {
    let item = window.createItemObject(chosenType, statLinesCount, stageScale, minStars);
    if (window.checkAutoSalvage(item, silent)) return;

    if (!silent) {
        if (item.type === "artifact") window.pushLog(`<strong style='color:#1abc9c;'>⭐ UNIQUE ARTIFACT DROPPED!</strong> Extracted: <span style='color:#1abc9c;'>${item.name}</span>!`, item.id);
        else if (sourceName === "Gacha") window.pushLog(`<strong style='color:#f1c40f;'>[GACHA]</strong> Dispensed: <span style='color:${window.getTierColor(item.statsRolled)};'>${item.name}</span>`, item.id);
        else if (sourceName === "Rare") window.pushLog(`<strong style='color:#ffb6c1;'>RARE ENEMY KILLED!</strong> Found: <span style='color:${window.getTierColor(item.statsRolled)};'>${item.name}</span>`, item.id);
        else window.pushLog(`<strong style='color:#ff9f43;'>BOSS KILLED!</strong> Found: <span style='color:${window.getTierColor(item.statsRolled)};'>${item.name}</span>`, item.id);
    }

    if(!silent) window.pushToast(item.name, item.statsRolled, window.getTierColor(item.statsRolled));
    if (item.type === "artifact") window.inventory.ARTIFACT.push(item); else window.inventory.EQUIP.push(item);

    if (sourceName === "Gacha" && !silent && typeof window.spawnPurchaseCelebration === "function") window.spawnPurchaseCelebration('gacha', window.getTierColor(item.statsRolled), item.statsRolled);
    if(!silent) { window.checkAchievements(); window.renderInventory(); if(typeof window.renderForgeTab==="function")window.renderForgeTab(); window.updateUI(); }
};

window.rollGachaDrop = function() {
    let p = window.resolvePlayerStats();
    let allowArtifact = (Math.random() < 0.0005);
    let types = ["weapon", "subweapon", "helmet", "chest", "leggings", "overall", "boots"];
    let chosenType = allowArtifact ? "artifact" : types[Math.floor(Math.random() * types.length)];

    let maxBag = window.getMaxBagSlots();
    if (chosenType === "artifact") {
        if (window.inventory.ARTIFACT.length >= maxBag) { window.pushHeaderToast(`Artifact Sack Full!`, "#e74c3c"); return; }
    } else {
        if (window.inventory.EQUIP.length >= maxBag) { window.pushHeaderToast(`Inventory Full!`, "#e74c3c"); return; }
    }

    let statLinesCount = 1;
    let luckMultiplier = p.qly + ((window.playerStats.vendingQLevel || 0) * 0.01);
    let roll = Math.random() * 100;

    if (roll < (0.02 * luckMultiplier)) statLinesCount = 5;
    else if (roll < (0.18 * luckMultiplier)) statLinesCount = 4;
    else if (roll < (0.80 * luckMultiplier)) statLinesCount = 3;
    else if (roll < (4.00 * luckMultiplier)) statLinesCount = 2;
    else statLinesCount = 1;

    let peakRunStage = Math.max(window.playerStats.stage, window.playerStats.maxStage || 1);
    let stageScale = Math.floor((peakRunStage - 1) / 10) + 1;
    window.generateEquipment(chosenType, statLinesCount, stageScale, "Gacha");
};

window.rollPotionDrop = function(isBoss, isRare, silent = false) {
    let dropChance = 0.0004;
    if (isRare) dropChance = 0.003;
    if (isBoss) dropChance = 0.025;

    if (Math.random() >= dropChance) return null;

    let tierRoll = Math.random() * 100;
    let tierPrefix = "";
    if (tierRoll < 2) tierPrefix = "Supernal ";
    else if (tierRoll < 15) tierPrefix = "Greater ";

    const types = ["Attack Elixir", "Vitality Elixir", "Armored Elixir", "Haste Elixir"];
    let chosenType = tierPrefix + types[Math.floor(Math.random() * types.length)];

    if (!window.inventory.USE[chosenType]) window.inventory.USE[chosenType] = 0;
    window.inventory.USE[chosenType]++;

    if (!silent) {
        window.pushLog(`<span style='color:#2ecc71; font-weight:bold;'>[DROP]</span> Defeated target and found a rare <span style='color:#2ecc71;'>${chosenType}</span>! Added to Use sack.`);
        window.pushToast(chosenType, null, "#2ecc71", true, 1, `🧪 Found: <span style="color:#2ecc71;">${chosenType}</span>`);
        window.renderInventory();
    }
    return chosenType;
};

window.showOfflineSummaryModal = function(seconds, fromStage, toStage, gold, xp, kills, items, scraps, died, dStage) {
    let modal = document.createElement('div'); modal.id = 'offline-summary-modal';
    modal.style.position = 'fixed'; modal.style.top = '0'; modal.style.left = '0'; modal.style.width = '100%'; modal.style.height = '100%'; modal.style.backgroundColor = 'rgba(0,0,0,0.85)';
    modal.style.display = 'flex'; modal.style.justifyContent = 'center'; modal.style.alignItems = 'center'; modal.style.zIndex = '30000'; modal.style.padding = '15px';

    let hours = Math.floor(seconds / 3600); let mins = Math.floor((seconds % 3600) / 60);
    let timeStr = `${hours > 0 ? hours + 'h ' : ''}${mins}m`;
    if (hours === 0 && mins === 0) timeStr = `${seconds}s`;

    let stageDiffText = toStage > fromStage ? `<span style="color:#2ecc71;">Stage ${fromStage} ➔ Stage ${toStage} (+${toStage - fromStage})</span>` : `<span style="color:#aaa;">Stage ${toStage} (Farming)</span>`;
    let deathAlert = died ? `<div style="background: rgba(192, 57, 43, 0.2); border: 1px solid #c0392b; border-radius: 4px; padding: 10px; margin-bottom: 15px; font-size: 11px; text-align: left; line-height: 1.4;"><strong style="color: #e74c3c;">⚠️ PROGRESSION STALLED:</strong> Hit a survival bottleneck at Stage ${dStage}. Progression halted, hero farmed Stage ${toStage}.</div>` : "";

    let itemsListHtml = items.length > 0 ? items.map(item => {
        let color = window.getTierColor(item.statsRolled); let stars = item.statsRolled === "UNIQUE" ? "UNIQUE" : `${item.statsRolled}★`;
        return `<div style="background:#1a1d20; border-left: 3px solid ${color}; padding: 6px 10px; border-radius: 3px; font-size: 11px; margin-bottom: 5px; text-align:left; display: flex; justify-content: space-between; align-items: center;"><span style="color:${color}; font-weight:bold;">${item.name}</span><span style="color:#888; font-size: 10px;">${stars}</span></div>`;
    }).join("") : `<div style="color:#666; font-style:italic; font-size:11px; padding: 15px 0;">No new high-quality gear kept.</div>`;

    let scrapKeys = Object.keys(scraps);
    let scrapsListHtml = scrapKeys.length > 0 ? scrapKeys.map(key => {
        let color = key.includes("Scrap") ? "#3498db" : (key.includes("Soul") ? "#ffb6c1" : "#9b59b6");
        if (key === "Eridium Shard") color = "#8e44ad";
        if (key.includes("Attack Elixir")) color = "#2ecc71"; else if (key.includes("Vitality Elixir")) color = "#e74c3c"; else if (key.includes("Armored Elixir")) color = "#3498db"; else if (key.includes("Haste Elixir")) color = "#f1c40f"; else if (key === "PP Reset Scroll") color = "#e67e22";
        return `<div class="bag-item" style="background:#111; border: 1px solid #222; padding: 5px 10px; border-radius: 3px; font-size: 11px; display:inline-block; margin: 3px;"><span style="color:#aaa;">${key}:</span> <strong style="color:${color};">+${scraps[key].toLocaleString()}</strong></div>`;
    }).join("") : `<div style="color:#666; font-style:italic; font-size:11px; padding: 5px 0;">No materials salvaged.</div>`;

    modal.innerHTML = `
        <div style="background:#1a1a1a; border: 2px solid var(--accent-blue); border-radius: 8px; width:100%; max-width:460px; max-height: 85vh; display:flex; flex-direction:column; overflow:hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.95); animation: toastFadeIn 0.3s ease-out;">
            <div style="background:#0b0f12; border-bottom: 1px solid #333; padding:12px 15px; display:flex; justify-content:space-between; align-items:center;">
                <h3 style="margin:0; color:var(--accent-blue); font-size:15px; font-weight:bold; letter-spacing:1px;">💤 OFFLINE PROGRESS</h3>
                <span style="background:rgba(52, 152, 219, 0.2); color:var(--accent-blue); padding:3px 10px; border-radius:10px; font-size:10px; font-weight:bold;">${timeStr}</span>
            </div>
            <div style="padding:15px; overflow-y:auto; flex: 1; text-align:center; overscroll-behavior: contain;">
                ${deathAlert}
                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; margin-bottom:15px;">
                    <div style="background:#111; padding:10px; border-radius:5px; border:1px solid #222;"><div style="font-size:10px; color:#aaa; margin-bottom:4px; letter-spacing:0.5px;">💰 GOLD ACCUMULATED</div><div style="font-size:16px; color:#f1c40f; font-weight:bold;">+${gold.toLocaleString()}</div></div>
                    <div style="background:#111; padding:10px; border-radius:5px; border:1px solid #222;"><div style="font-size:10px; color:#aaa; margin-bottom:4px; letter-spacing:0.5px;">⭐ EXPERIENCE HARVESTED</div><div style="font-size:16px; color:#9b59b6; font-weight:bold;">+${xp.toLocaleString()}</div></div>
                </div>
                <div style="background:#111; padding:10px; border-radius:5px; margin-bottom:15px; font-size:11px; display:flex; justify-content:space-between; border:1px solid #222;">
                    <span>⚔️ Simulated Kills: <strong style="color:#fff;">${kills}</strong></span><span>🏰 Stage Reached: ${stageDiffText}</span>
                </div>
                <h4 style="margin: 0 0 8px 0; font-size:11px; color:#fff; text-align:left; text-transform:uppercase; letter-spacing:0.5px; border-bottom: 1px solid #333; padding-bottom:4px;">💼 Kept Drops</h4>
                <div style="max-height:140px; overflow-y:auto; margin-bottom:15px; padding-right:4px;">${itemsListHtml}</div>
                <h4 style="margin: 0 0 8px 0; font-size:11px; color:#fff; text-align:left; text-transform:uppercase; letter-spacing:0.5px; border-bottom: 1px solid #333; padding-bottom:4px;">♻️ Auto-Salvage Yield</h4>
                <div style="text-align:left; margin-bottom:10px; max-height:100px; overflow-y:auto;">${scrapsListHtml}</div>
            </div>
            <div style="background:#0b0f12; border-top: 1px solid #333; padding:12px; display:flex; justify-content:center;">
                <button id="close-offline-summary" style="background:var(--accent-blue); color:white; border:none; padding:10px 24px; font-weight:bold; font-size:12px; border-radius:4px; cursor:pointer; width:100%; transition: background 0.2s;">Claim Loot & Continue</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    document.getElementById('close-offline-summary').onclick = function() {
        modal.style.animation = "toastFadeOut 0.25s ease-in forwards";
        setTimeout(() => { modal.remove(); window.setPauseState(false); window.updateUI(); window.renderInventory(); }, 230);
    };
};

window.showCrucibleSummaryModal = function(waves, shards, cores) {
    let modal = document.createElement('div');
    modal.style.position = 'fixed'; modal.style.top = '0'; modal.style.left = '0'; modal.style.width = '100%'; modal.style.height = '100%'; modal.style.backgroundColor = 'rgba(0,0,0,0.85)';
    modal.style.display = 'flex'; modal.style.justifyContent = 'center'; modal.style.alignItems = 'center'; modal.style.zIndex = '30000'; modal.style.padding = '15px';

    modal.innerHTML = `
        <div style="background:#1a1a1a; border: 2px solid var(--accent-purple); border-radius: 8px; width:100%; max-width:400px; display:flex; flex-direction:column; box-shadow: 0 10px 30px rgba(0,0,0,0.95); animation: toastFadeIn 0.3s;">
            <div style="background:#0b0f12; border-bottom: 1px solid #333; padding:12px 15px; text-align:center;">
                <h3 style="margin:0; color:#9b59b6; font-size:16px; font-weight:bold; letter-spacing:1.5px;">🔮 CRUCIBLE OVER</h3>
            </div>
            <div style="padding:20px; text-align:center; color:#fff;">
                <div style="font-size:12px; color:#aaa; margin-bottom:5px;">Waves Cleared:</div>
                <div style="font-size:28px; color:#f1c40f; font-weight:bold; margin-bottom:20px;">${waves} Floors</div>
                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; margin-bottom:15px;">
                    <div style="background:#111; padding:10px; border-radius:5px; border:1px solid #222;"><div style="font-size:10px; color:#aaa; margin-bottom:4px;">ASTRAL SHARDS</div><div style="font-size:16px; color:#9b59b6; font-weight:bold;">+${shards}</div></div>
                    <div style="background:#111; padding:10px; border-radius:5px; border:1px solid #222;"><div style="font-size:10px; color:#aaa; margin-bottom:4px;">CATALYST CORES</div><div style="font-size:16px; color:#2ecc71; font-weight:bold;">+${cores}</div></div>
                </div>
                <p style="font-size:11px; color:#7f8c8d; line-height:1.4;">Use Catalyst Cores at the Blacksmith Forge to lock and re-roll equipment modifiers!</p>
            </div>
            <div style="background:#0b0f12; border-top: 1px solid #333; padding:12px; display:flex; justify-content:center;">
                <button id="close-crucible-summary" style="background:#9b59b6; color:white; border:none; padding:10px 24px; font-weight:bold; font-size:12px; border-radius:4px; cursor:pointer; width:100%;">Return to Surface</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    document.getElementById('close-crucible-summary').onclick = function() {
        modal.remove(); window.isGamePaused = false;
        let p = window.resolvePlayerStats(); window.playerStats.currentHp = p.maxHp;
        window.updateUI(); window.renderInventory();
    };
};