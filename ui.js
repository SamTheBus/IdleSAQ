/* ==========================================================================
   PRIMARY PURPOSE: Manages all UI interactions, DOM updates, menus,
   tooltips, and modal displays.
   ========================================================================= */

window.draftAllocations = null;
window.draftSP = 0;
window.activeStatTooltip = null;
window.draftHoldTimeout = null;
window.didFastDump = false;

// Helper to safely update text nodes
window.setText = function(id, text) {
    let el = document.getElementById(id);
    if (el) el.innerText = text;
};

// --- CORE UI REFRESHER ---

window.updateUI = function() {
    let hasDraftChanges = false;
    if (window.draftAllocations) {
        for (let k in window.draftAllocations) {
            if (window.draftAllocations[k] !== window.playerStats.spAllocations[k]) {
                hasDraftChanges = true; break;
            }
        }
    }

    let p = window.resolvePlayerStats(hasDraftChanges);

    // 1. Hud overlays
    setText('hud-stage', window.playerStats.stage);
    setText('hud-progress', `${window.playerStats.killCount}/${window.playerStats.targetsRequired}`);
    setText('hud-hp', `${window.formatNumber(window.playerStats.currentHp)}/${window.formatNumber(p.maxHp)}`);
    setText('hud-coins', window.formatNumber(window.playerStats.coins));

    let maxBag = window.getMaxBagSlots();
    let bagEl = document.getElementById('hud-bag');
    if (bagEl) {
        bagEl.innerText = `${window.inventory.EQUIP.length}/${maxBag} (A:${window.inventory.ARTIFACT.length})`;
        bagEl.style.color = (window.inventory.EQUIP.length >= maxBag || window.inventory.ARTIFACT.length >= maxBag) ? "#e74c3c" : "#2ecc71";
    }

    // 2. Stats panel headers
    setText('char-level', window.playerStats.level);
    setText('char-sp', (window.draftAllocations !== null ? window.draftSP : window.playerStats.sp));
    setText('char-maxstage', window.playerStats.maxStage);
    setText('char-prestige-count', window.playerStats.prestigeCount || 0);
    setText('char-lifetime-peak', window.playerStats.lifetimePeakStage || window.playerStats.maxStage || 1);
    setText('char-xp-text', `${window.formatNumber(window.playerStats.xp)} / ${window.formatNumber(window.playerStats.xpReq)}`);

    const xpFill = document.getElementById('char-xp-fill');
    if (xpFill) xpFill.style.width = Math.min(100, (window.playerStats.xp / window.playerStats.xpReq) * 100) + "%";

    // 3. Core attributes matrix
    setText('stat-str', p.str);
    setText('stat-dex', p.dex);
    setText('stat-int', p.int);

    // 4. Multipliers & Avoidance
    setText('stat-atk', window.formatNumber(p.atk));
    setText('stat-mhp', window.formatNumber(p.maxHp));
    setText('stat-def', window.formatNumber(p.def));
    setText('stat-mov', p.moveSpeed.toFixed(1));
    setText('stat-ias', p.idleAttackSpeed + "f");
    setText('stat-aas', p.activeAttackSpeed + "f");
    setText('stat-crt', Math.floor(p.critChance * 100) + "%");
    setText('stat-crd', Math.floor(p.critDamage * 100) + "%");
    setText('stat-blk', Math.floor(p.block * 100) + "%");
    setText('stat-pry', Math.floor(p.parry * 100) + "%");
    setText('stat-rar', (p.rareSpawn * 100).toFixed(2) + "%");
    setText('stat-fai', Math.floor(p.fairySpawn * 100) + "%");
    setText('stat-drp', "+" + Math.floor((p.drop - 1) * 100) + "%");
    setText('stat-qly', "+" + Math.floor((p.qly - 1) * 100) + "%");
    setText('stat-gld', "x" + p.gold.toFixed(2));

    let effMultiplier = 1 + (p.critChance * (p.critDamage - 1));
    let idps = (p.atk * effMultiplier) * (60 / p.idleAttackSpeed);
    setText('stat-idps', idps.toLocaleString(undefined, {minimumFractionDigits: 1, maximumFractionDigits: 1}));

    // Draft drawer visibility
    let draftBar = document.getElementById('draft-controls-container');
    if (draftBar) {
        draftBar.style.display = hasDraftChanges ? "block" : "none";
    }

    // Refresh core SP allocations button display
    const updateSPButtonStates = () => {
        let statsKeys = ['spStr', 'spDex', 'spInt'];
        let currentSp = window.draftAllocations !== null ? window.draftSP : window.playerStats.sp;
        let allocSource = window.draftAllocations || window.playerStats.spAllocations;

        statsKeys.forEach(allocKey => {
            let plusBtn = document.getElementById('btn-plus-' + allocKey);
            let minusBtn = document.getElementById('btn-minus-' + allocKey);
            if (plusBtn) plusBtn.style.display = (currentSp > 0) ? "inline-block" : "none";
            if (minusBtn) {
                let committedVal = window.playerStats.spAllocations[allocKey] || 0;
                let draftVal = allocSource[allocKey] || 0;
                minusBtn.style.display = (draftVal > committedVal) ? "inline-block" : "none";
            }
        });
    };
    updateSPButtonStates();

    // Challenge portal visibility
    let rechallengeBtn = document.getElementById('btn-rechallenge');
    if (rechallengeBtn) {
        rechallengeBtn.style.display = window.playerStats.isFarmingLoop ? "block" : "none";
    }

    // Set synergy hud lists
    let activeSetsHtml = [];
    let activeSetCounts = {};
    const checkSetSlots = ["weapon", "subweapon", "helmet", "chest", "leggings", "overall", "boots"];
    let overallAdoptedSet = null;
    if (window.equippedSlots.overall) {
        overallAdoptedSet = (window.equippedSlots.helmet && window.getItemSetName(window.equippedSlots.helmet)) ||
                            (window.equippedSlots.boots && window.getItemSetName(window.equippedSlots.boots)) ||
                            (window.equippedSlots.weapon && window.getItemSetName(window.equippedSlots.weapon)) ||
                            null;
    }
    checkSetSlots.forEach(slot => {
        let item = window.equippedSlots[slot];
        if (item) {
            let sName = window.getItemSetName(item);
            if (slot === "overall" && overallAdoptedSet) sName = overallAdoptedSet;
            if (sName) activeSetCounts[sName] = (activeSetCounts[sName] || 0) + (slot === "overall" ? 2 : 1);
        }
    });
    for (let sName in activeSetCounts) {
        let count = activeSetCounts[sName];
        let setDef = window.SET_DEFINITIONS[sName];
        if (setDef) {
            let activeBonuses = setDef.bonuses.filter(b => count >= b.count);
            let displayCount = Math.min(3, count);
            if (activeBonuses.length > 0) {
                let bonusesText = activeBonuses.map(b => b.desc).join(", ");
                activeSetsHtml.push(`<div style="margin-bottom: 5px;"><strong style="color: #2ecc71;">${sName} (${displayCount}/3):</strong> <span style="color:#fff;">${bonusesText}</span></div>`);
            } else {
                activeSetsHtml.push(`<div style="margin-bottom: 5px; color: #7f8c8d;"><strong>${sName} (${displayCount}/3):</strong> No active bonus</div>`);
            }
        }
    }
    let setsListEl = document.getElementById('active-sets-list');
    if (setsListEl) {
        setsListEl.innerHTML = activeSetsHtml.length > 0 ? activeSetsHtml.join("") : "No active set synergies. Equip matching named gear (e.g. Colossus, Windrunner).";
    }

    // Live drop rates
    let drp = p.drop * window.state.efficiency;
    setText('live-rate-mob', (4.5 * drp).toFixed(2) + "%");
    setText('live-rate-rare', (15.0 * drp).toFixed(2) + "%");
    document.getElementById('live-rate-boss').innerText = (25.0 * drp).toFixed(2) + "%";
    document.getElementById('live-rate-dmini').innerText = (30.0 * drp).toFixed(2) + "%";
    let elRateAcore = document.getElementById('live-rate-acore');
    if (elRateAcore) elRateAcore.innerText = (40.0 * drp).toFixed(2) + "%";

    let chance5 = (p.qly >= 2.0) ? (0.02 * p.qly) : 0;
    let chance4 = (p.qly >= 1.5) ? (0.16 * p.qly) : 0;
    setText('star-rate-5', chance5 > 0 ? (chance5).toFixed(2) + "%" : "0.00% 🔒 (Req. 2.0x Qly)");
    setText('star-rate-4', chance4 > 0 ? (chance4).toFixed(2) + "%" : "0.00% 🔒 (Req. 1.5x Qly)");
    setText('star-rate-3', (0.80 * p.qly - (chance5 + chance4)).toFixed(2) + "%");
    setText('star-rate-2', (3.20 * p.qly).toFixed(2) + "%");
    setText('star-rate-1', (11.00 * p.qly).toFixed(2) + "%");

    setText('live-qty-acore', window.inventory.ETC["Ancient Core"] || 0);
    setText('live-qty-eshard', (window.inventory.ETC["Eridium Shard"] || 0).toLocaleString());

    let elAstral = document.getElementById('live-qty-astral');
    if (elAstral) {
        elAstral.innerText = `${(window.inventory.ETC["Astral Essence"] || 0).toLocaleString()} (Shared Shards: ${(window.playerStats.astralShards || 0).toLocaleString()})`;
    }

    setText('live-qty-keys', `${(window.inventory.ETC["Gacha Key"] || 0).toLocaleString()} (E:${window.playerStats.equipKeys} G:${window.playerStats.goldKeys} M:${window.playerStats.matKeys})`);

    let soulsTotal = (window.inventory.ETC["Monster Soul"] || 0);
    setText('live-qty-souls', `${(soulsTotal + (window.inventory.ETC["Luminous Soul"] || 0)).toLocaleString()} (Locked Cores: ${(window.inventory.ETC["Catalyst Core"] || 0).toLocaleString()})`);

    let scrapsSum = (window.inventory.ETC["Mythic Scrap"] || 0) + (window.inventory.ETC["Legendary Scrap"] || 0) + (window.inventory.ETC["Epic Scrap"] || 0) + (window.inventory.ETC["Magic Scrap"] || 0) + (window.inventory.ETC["Rare Scrap"] || 0);
    setText('live-qty-scraps', scrapsSum.toLocaleString());

    // Buff trackers HUD
    let activeBuffs = [];
    if (window.playerStats.frenzyTimer > 0) activeBuffs.push("🔥 Frenzy");
    if (window.playerStats.adrenalineTimer > 0) activeBuffs.push("⚡ Adrenaline");
    if (window.playerStats.atkPotionTimer > 0) activeBuffs.push("⚔️ Potion");
    if (window.playerStats.hpPotionTimer > 0) activeBuffs.push("❤️ Potion");
    if (window.playerStats.defPotionTimer > 0) activeBuffs.push("🛡️ Potion");
    if (window.playerStats.hastePotionTimer > 0) activeBuffs.push("👟 Potion");

    let buffEl = document.getElementById('hud-buff');
    if (buffEl) {
        if (activeBuffs.length > 0) { buffEl.innerText = activeBuffs.join(", "); buffEl.style.color = "#2ecc71"; }
        else { buffEl.innerText = "None"; buffEl.style.color = "#aaa"; }
    }

    // Cumulative trophies
        let sumSummaryEl = document.getElementById('trophy-bonuses-summary');
        if (sumSummaryEl) {
            if (!window.playerStats.cachedAchievementBonusTotals) {
                window.recalculateAchievementTotals();
            }
            let aT = window.playerStats.cachedAchievementBonusTotals;

            let unlockedCount = window.playerStats.unlockedAchievements ? window.playerStats.unlockedAchievements.length : 0;
        let totalCount = window.AchievementsData ? window.AchievementsData.length : 174;
        let lines = [`<div style="color:#f1c40f; font-weight:bold; margin-bottom:4px; text-align:center; border-bottom: 1px dashed #333; padding-bottom:2px;">Active Trophies: ${unlockedCount} / ${totalCount}</div>`];

        let combatStats = [];
        if (aT.atk > 0 || aT.atkPct > 0) combatStats.push(`Atk: +${aT.atk} (${(aT.atkPct * 100).toFixed(1)}%)`);
        if (aT.maxHp > 0 || aT.maxHpPct > 0) combatStats.push(`HP: +${aT.maxHp} (${(aT.maxHpPct * 100).toFixed(1)}%)`);
        if (aT.def > 0 || aT.defPct > 0) combatStats.push(`Def: +${aT.def} (${(aT.defPct * 100).toFixed(1)}%)`);
        if (aT.moveSpeed > 0 || aT.moveSpeedPct > 0) combatStats.push(`Spd: +${aT.moveSpeed.toFixed(1)} (${(aT.moveSpeedPct * 100).toFixed(1)}%)`);
        if (combatStats.length > 0) lines.push(`<div style="color:#e74c3c; font-weight:bold; margin-top:4px;">⚔️ COMBAT MULTIPLIERS</div>` + combatStats.join("<br>"));

        let attrStats = [];
        if (aT.str > 0 || aT.strPct > 0) attrStats.push(`STR: +${aT.str} (${(aT.strPct * 100).toFixed(1)}%)`);
        if (aT.dex > 0 || aT.dexPct > 0) attrStats.push(`DEX: +${aT.dex} (${(aT.dexPct * 100).toFixed(1)}%)`);
        if (aT.int > 0 || aT.intPct > 0) attrStats.push(`INT: +${aT.int} (${(aT.intPct * 100).toFixed(1)}%)`);
        if (aT.critChance > 0) attrStats.push(`Crit %: +${(aT.critChance * 100).toFixed(1)}%`);
        if (aT.critDamage > 0) attrStats.push(`Crit Dmg: +${(aT.critDamage * 100).toFixed(1)}%`);
        if (aT.block > 0) attrStats.push(`Block %: +${(aT.block * 100).toFixed(1)}%`);
        if (aT.parry > 0) attrStats.push(`Parry %: +${(aT.parry * 100).toFixed(1)}%`);
        if (attrStats.length > 0) lines.push(`<div style="color:#3498db; font-weight:bold; margin-top:4px;">💪 CORE ATTRIBUTES & CRITS</div>` + attrStats.join("<br>"));

        let utilStats = [];
        if (aT.gold > 0) utilStats.push(`Gold Mult: +${(aT.gold * 100).toFixed(1)}%`);
        if (aT.drop > 0) utilStats.push(`Drop Rate: +${(aT.drop * 100).toFixed(1)}%`);
        if (aT.qly > 0) utilStats.push(`Drop Quality: +${(aT.qly * 100).toFixed(1)}%`);
        if (aT.fairySpawn > 0) utilStats.push(`Fairy Spawn: +${(aT.fairySpawn * 100).toFixed(1)}%`);
        if (aT.rareSpawn > 0) utilStats.push(`Rare Spawn: +${(aT.rareSpawn * 100).toFixed(2)}%`);
        if (aT.expPct > 0) utilStats.push(`EXP Rate: +${(aT.expPct * 100).toFixed(0)}%`);
        if (combatStats.length > 0 || attrStats.length > 0 || utilStats.length > 0) lines.push(`<div style="color:#2ecc71; font-weight:bold; margin-top:4px;">🍀 UTILITY MODS</div>` + utilStats.join("<br>"));

        sumSummaryEl.innerHTML = lines.join("<br>");
    }

    // 5. Backpack details update
    let capCount = window.inventory.EQUIP.length;
    let capMax = window.getMaxBagSlots();
    let capBtn = document.getElementById('btn-bag-count');
    if (capBtn) capBtn.innerText = capCount;
    let capMaxBtn = document.getElementById('btn-bag-max');
    if (capMaxBtn) capMaxBtn.innerText = capMax;

    let artCount = window.inventory.ARTIFACT ? window.inventory.ARTIFACT.length : 0;
    let artBtn = document.getElementById('btn-art-count');
    if (artBtn) artBtn.innerText = artCount;
    let artMaxBtn = document.getElementById('btn-art-max');
    if (artMaxBtn) artMaxBtn.innerText = capMax;

    window.renderPaperDoll();
    window.renderInventory();

    // Auto-refresh tooltip
    if (window.activeStatTooltip) {
        window.refreshActiveStatTooltip();
    }
};

// --- ATTRIBUTES MATRIX CONTROLS ---

window.startSPDraftHold = function(e, statKey, direction) {
    e.preventDefault();
    if (window.playerStats.sp <= 0 && direction > 0) return;
    window.adjustSPDraft(statKey, direction);

    if (window.draftHoldTimeout) clearInterval(window.draftHoldTimeout);
    window.draftHoldTimeout = setInterval(() => {
        if (window.playerStats.sp <= 0 && direction > 0) {
            clearInterval(window.draftHoldTimeout);
            return;
        }
        if (direction < 0 && window.draftAllocations[statKey] <= window.playerStats.spAllocations[statKey]) {
            clearInterval(window.draftHoldTimeout);
            return;
        }
        window.adjustSPDraft(statKey, direction);
    }, 120);
};

window.stopSPDraftHold = function(e) {
    if (e) e.stopPropagation();
    if (window.draftHoldTimeout) { clearInterval(window.draftHoldTimeout); window.draftHoldTimeout = null; }
};

window.adjustSPDraft = function(statKey, direction) {
    window.ensureDraftInitialized();
    if (direction > 0) {
        if (window.draftSP > 0) { window.draftSP--; window.draftAllocations[statKey]++; }
    } else {
        let committed = window.playerStats.spAllocations[statKey] || 0;
        if (window.draftAllocations[statKey] > committed) { window.draftSP++; window.draftAllocations[statKey]--; }
    }
    window.updateUI();
};

window.ensureDraftInitialized = function() {
    if (window.draftAllocations === null) {
        window.draftAllocations = { ...window.playerStats.spAllocations };
        window.draftSP = window.playerStats.sp;
    }
};

window.resetDraft = function() {
    window.showCustomConfirm(
        "Discard Changes", "Are you sure you want to discard your pending attribute changes?",
        "Discard", "Keep Drafting", "#e67e22",
        function() { window.draftAllocations = null; window.draftSP = 0; window.pushHeaderToast("🧹 Draft Discarded", "#aaa"); window.updateUI(); }
    );
};

window.showSPConfirmationModal = function() {
    if (!window.draftAllocations) return;
    let current = window.resolvePlayerStats(false);
    let preview = window.resolvePlayerStats(true);
    let totalInvested = window.playerStats.sp - window.draftSP;
    if (totalInvested <= 0) return;

    let modal = document.createElement('div');
    modal.id = 'sp-confirm-modal';
    modal.style.position = 'fixed'; modal.style.top = '0'; modal.style.left = '0';
    modal.style.width = '100%'; modal.style.height = '100%'; modal.style.backgroundColor = 'rgba(0,0,0,0.85)';
    modal.style.display = 'flex'; modal.style.justifyContent = 'center'; modal.style.alignItems = 'center';
    modal.style.zIndex = '30000'; modal.style.padding = '15px';

    let diffs = [];
    let statsToCheck = [
        { key: "str", label: "💪 Strength", isPct: false }, { key: "dex", label: "🎯 Dexterity", isPct: false }, { key: "int", label: "🧠 Intelligence", isPct: false },
        { key: "atk", label: "⚔️ Attack", isPct: false }, { key: "maxHp", label: "❤️ Max HP", isPct: false }, { key: "def", label: "🛡️ Defense", isPct: false },
        { key: "moveSpeed", label: "👟 Move Speed", isPct: false }, { key: "critChance", label: "✨ Crit Chance", isPct: true },
        { key: "critDamage", label: "💥 Crit Multiplier", isPct: true }, { key: "block", label: "🛡️ Block Rate", isPct: true }, { key: "parry", label: "⚡ Parry Rate", isPct: true }
    ];

    statsToCheck.forEach(s => {
        let curVal = current[s.key] || 0; let newVal = preview[s.key] || 0; let diff = newVal - curVal;
        if (Math.abs(diff) > 0.0001) {
            let curStr = s.isPct ? Math.round(curVal * 100) + "%" : Math.round(curVal).toLocaleString();
            let newStr = s.isPct ? Math.round(newVal * 100) + "%" : Math.round(newVal).toLocaleString();
            let diffStr = s.isPct ? "+" + Math.round(diff * 100) + "%" : "+" + Math.round(diff).toLocaleString();
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

window.commitSPDraft = function() {
    if (!window.draftAllocations) return;
    let oldMaxHp = window.resolvePlayerStats(false).maxHp;

    window.playerStats.spAllocations = { ...window.draftAllocations };
    window.playerStats.sp = window.draftSP;
    window.draftAllocations = null; window.draftSP = 0;

    let p = window.resolvePlayerStats();
    let hpDiff = p.maxHp - oldMaxHp;
    if (hpDiff > 0) window.playerStats.currentHp += hpDiff;
    window.playerStats.currentHp = Math.min(window.playerStats.currentHp, p.maxHp);

    let modal = document.getElementById('sp-confirm-modal');
    if (modal) modal.remove();

    window.pushHeaderToast("🎉 Attributes Committed & Saved!", "#2ecc71");
    window.pushLog("<span style='color:#2ecc71; font-weight:bold;'>[STATS] Committed drafted attribute points permanently. Game Saved!</span>");
    window.updateUI(); window.saveGame();
};

window.showSPPreview = function(e, statKey) {
    e.stopPropagation();
    let tt = document.getElementById('stat-tooltip');
    if (!tt) return;

    let labelMap = { spStr: "💪 Strength", spDex: "🎯 Dexterity", spInt: "🧠 Intelligence" };
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
        { key: "str", label: "💪 STR", isPct: false }, { key: "dex", label: "🎯 DEX", isPct: false }, { key: "int", label: "🧠 INT", isPct: false },
        { key: "atk", label: "⚔️ Attack", isPct: false }, { key: "maxHp", label: "❤️ Max HP", isPct: false }, { key: "def", label: "🛡️ Defense", isPct: false },
        { key: "moveSpeed", label: "👟 Move Speed", isPct: false }, { key: "critChance", label: "✨ Crit Chance", isPct: true },
        { key: "critDamage", label: "💥 Crit Multi", isPct: true }, { key: "block", label: "🛡️ Block Rate", isPct: true }, { key: "parry", label: "⚡ Parry Rate", isPct: true }
    ];

    statsToCheck.forEach(s => {
        let curVal = current[s.key] || 0; let newVal = preview[s.key] || 0; let diff = newVal - curVal;
        if (Math.abs(diff) > 0.0001) {
            let curStr = s.isPct ? Math.round(curVal * 100) + "%" : Math.round(curVal).toLocaleString();
            let newStr = s.isPct ? Math.round(newVal * 100) + "%" : Math.round(newVal).toLocaleString();
            let diffStr = s.isPct ? "+" + Math.round(diff * 100) + "%" : "+" + Math.round(diff).toLocaleString();
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

    html += diffs.length === 0 ? `<div style="color:#aaa; font-style:italic; font-size:11px; text-align:center;">No changes.</div>` : diffs.join("");
        html += `</div>`;
        tt.style.borderColor = "var(--accent-orange)"; tt.innerHTML = html; tt.style.display = "block";
        window.positionTooltip(e, tt);
    };

    // --- LOG & TOAST SYSTEMS ---

    window.pushLog = function(text, itemId = null) {
        if (itemId !== null) {
            let item = window.inventory.EQUIP.find(i => i.id === itemId) || (window.inventory.ARTIFACT && window.inventory.ARTIFACT.find(i => i.id === itemId));
            if (!item) { for (let k in window.equippedSlots) { if (window.equippedSlots[k] && window.equippedSlots[k].id === itemId) item = window.equippedSlots[k]; } }
            if (item) {
                window.frozenItemDb[itemId] = JSON.parse(JSON.stringify(item));
                text = text.replace(item.name, `<span class="log-item-link" onmouseenter="window.showLogTooltip(event, ${itemId})" onmouseleave="window.hideTooltip()">${item.name}</span>`);
            }
        }
        window.logsHistory.unshift(text); if (window.logsHistory.length > 50) window.logsHistory.pop();
        let box = document.getElementById('log-box');
        if (box) box.innerHTML = window.logsHistory.join("<br><br>");
    };

    window.pushToast = function(name, stars, color, isEtc = false, quantity = 1, customText = null, clickAction = null) {
        let container = document.getElementById('toast-container');
        if (!container) return;

        let toast = document.createElement('div');
        toast.style.background = "rgba(11, 15, 18, 0.95)";
        toast.style.border = `2px solid ${color}`;
        toast.style.color = "#fff";
        toast.style.padding = "8px 16px";
        toast.style.borderRadius = "6px";
        toast.style.fontSize = "11px";
        toast.style.fontWeight = "bold";
        toast.style.textAlign = "center";
        toast.style.boxShadow = "0 4px 15px rgba(0,0,0,0.6)";
        toast.style.animation = "toastFadeIn 0.3s ease-out";
        toast.style.maxWidth = "100%";

        if (clickAction) {
            toast.style.pointerEvents = "auto";
            toast.style.cursor = "pointer";
            toast.onclick = function(e) {
                e.stopPropagation();
                clickAction();
                toast.remove();
            };
        } else {
            toast.style.pointerEvents = "none";
        }

        if (customText) {
            toast.innerHTML = customText;
        } else {
            let label = isEtc ? `📦 +${quantity} Loot` : (stars === "UNIQUE" ? "⭐ UNIQUE DETECTED!" : `⚔️ ITEM FOUND (${stars}★)`);
            toast.innerHTML = `${label} : <span style="color:${color}">${name}</span>`;
        }

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

    window.pushHeaderToast = function(text, color, clickAction = null) {
            window.pushToast("", null, color, false, 0, text, clickAction);
        };

    // --- DIALOGS, DROPDOWNS, AND CONFIRMATIONS ---

window.toggleDungeonMenu = function() {
    let menu = document.getElementById('dungeon-menu');
    if (menu) {
        menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
    }
};

window.toggleAudioMenu = function() {
    let menu = document.getElementById('audio-menu');
    if (menu) {
        menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
        window.updateAudioUI();
    }
};

window.updateAudioUI = function() {
    let masterSlider = document.getElementById('slider-vol-master');
    let sfxSlider = document.getElementById('slider-vol-sfx');
    let masterLabel = document.getElementById('vol-master-label');
    let sfxLabel = document.getElementById('vol-sfx-label');
    let muteBtn = document.getElementById('btn-audio-mute');

    if (masterSlider) masterSlider.value = window.playerStats.volumeMaster;
    if (sfxSlider) sfxSlider.value = window.playerStats.volumeSFX;
    if (masterLabel) masterLabel.innerText = Math.round(window.playerStats.volumeMaster * 100) + "%";
    if (sfxLabel) sfxLabel.innerText = Math.round(window.playerStats.volumeSFX * 100) + "%";
    if (muteBtn) {
        if (window.playerStats.mute) { muteBtn.innerText = "Unmute Audio"; muteBtn.style.background = "#2ecc71"; }
        else { muteBtn.innerText = "Mute Audio"; muteBtn.style.background = "#c0392b"; }
    }
};

window.changeVolume = function(type, val) {
    let numVal = parseFloat(val);
    if (type === 'master') {
        window.playerStats.volumeMaster = numVal;
        setText('vol-master-label', Math.round(numVal * 100) + "%");
    } else if (type === 'sfx') {
        window.playerStats.volumeSFX = numVal;
        setText('vol-sfx-label', Math.round(numVal * 100) + "%");
    }
    window.SoundManager.updateVolumes(); window.saveGame();
};

window.toggleMute = function() {
    window.playerStats.mute = !window.playerStats.mute;
    window.updateAudioUI(); window.SoundManager.updateVolumes(); window.saveGame();
};

window.showCustomConfirm = function(title, message, confirmText, cancelText, accentColor, onConfirm, onCancel) {
    let wasPaused = window.isGamePaused;
    window.setPauseState(true);

    let overlay = document.createElement('div');
    overlay.style.position = 'fixed'; overlay.style.top = '0'; overlay.style.left = '0';
    overlay.style.width = '100%'; overlay.style.height = '100%'; overlay.style.backgroundColor = 'rgba(8, 2, 2, 0.88)';
    overlay.style.display = 'flex'; overlay.style.justifyContent = 'center'; overlay.style.alignItems = 'center';
    overlay.style.zIndex = '40000'; overlay.style.backdropFilter = 'blur(5px)';
    overlay.style.animation = 'deathFadeIn 0.25s ease-out';

    let card = document.createElement('div');
    card.style.background = 'linear-gradient(135deg, #151515, #0a0a0c)';
    card.style.border = `2px solid ${accentColor}`; card.style.borderRadius = '8px'; card.style.padding = '20px';
    card.style.width = '90%'; card.style.maxWidth = '400px';
    card.style.boxShadow = `0 10px 35px rgba(0,0,0,0.95), inset 0 0 15px ${accentColor}25`;
    card.style.textAlign = 'center'; card.style.animation = 'deathCardPop 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.1)';

    card.innerHTML = `
        <div style="font-size: 16px; font-weight: bold; color: ${accentColor}; letter-spacing: 1.5px; margin-bottom: 8px; text-transform: uppercase;">${title}</div>
        <div style="height: 1px; background: linear-gradient(90deg, transparent, ${accentColor}, transparent); margin: 8px 0 15px 0;"></div>
        <div style="font-size: 11.5px; color: #cbd5e1; line-height: 1.55; margin-bottom: 20px; white-space: normal; text-align: center;">${message}</div>
        <div style="display: flex; gap: 10px;">
            <button id="cust-btn-cancel" class="nav-btn" style="flex: 1; justify-content: center; background: #222; border: 1px solid #444; color: #aaa; padding: 10px; font-size:11px; font-weight:bold; border-radius:4px; height: auto;">${cancelText || 'Cancel'}</button>
            <button id="cust-btn-commit" class="nav-btn" style="flex: 1; justify-content: center; background: ${accentColor}; border: 1px solid ${accentColor}; color: white; padding: 10px; font-size:11px; font-weight:bold; border-radius:4px; height: auto;">${confirmText || 'Confirm'}</button>
        </div>
    `;
    overlay.appendChild(card); document.body.appendChild(overlay);

    const cleanup = () => {
        overlay.style.animation = "toastFadeOut 0.18s ease-in forwards";
        setTimeout(() => { overlay.remove(); if (!wasPaused) window.setPauseState(false); }, 170);
    };
    card.querySelector('#cust-btn-cancel').onclick = (e) => { e.stopPropagation(); cleanup(); if (onCancel) onCancel(); };
        card.querySelector('#cust-btn-commit').onclick = (e) => { e.stopPropagation(); cleanup(); if (onConfirm) onConfirm(); };
    };

    window.addEtcDrop = function(itemName, amount = 1) {
        if (!window.inventory.ETC[itemName]) { window.inventory.ETC[itemName] = 0; }
        window.inventory.ETC[itemName] += amount;
        if (typeof window.renderInventory === "function") window.renderInventory();
    };

    window.addUseDrop = function(itemName, amount = 1) {
        if (!window.inventory.USE[itemName]) { window.inventory.USE[itemName] = 0; }
        window.inventory.USE[itemName] += amount;
        if (typeof window.renderInventory === "function") window.renderInventory();
    };

    window.setPauseState = function(paused) {
        window.isGamePaused = paused;
        let btn = document.getElementById('btn-pause');
        if (btn) {
            if (window.isGamePaused) {
                btn.innerText = "⏸️ PAUSED";
                btn.classList.add('active');
                btn.style.background = "#e74c3c";
            } else {
                btn.innerText = "▶️ Pause";
                btn.classList.remove('active');
                btn.style.background = "#34495e";
            }
        }
    };

    window.togglePause = function() {
        let deathOverlay = document.getElementById('death-overlay');
        let offlineModal = document.getElementById('offline-summary-modal');
        if ((deathOverlay && deathOverlay.style.display === "flex") || offlineModal) {
            return;
        }
        window.setPauseState(!window.isGamePaused);
        if (typeof window.pushHeaderToast === "function") {
            window.pushHeaderToast(window.isGamePaused ? "⏸️ Game Paused!" : "▶️ Game Resumed!", window.isGamePaused ? "#e74c3c" : "#2ecc71");
        }
    };

    window.toggleAuto = function() {
        window.state.autoAttack = !window.state.autoAttack;
        let btn = document.getElementById('toggle-auto');
        if (btn) {
            btn.innerText = window.state.autoAttack ? "Auto: ON" : "Auto: OFF";
            btn.className = window.state.autoAttack ? "btn-toggle active" : "btn-toggle";
        }
        window.state.efficiency = window.state.autoAttack ? 1.0 : 1.15;
        if (typeof window.updateUI === "function") window.updateUI();
    };

    window.updateStickyCanvasStyle = function() {
        let active = window.playerStats.stickyCanvas !== false;
        let btn = document.getElementById('toggle-sticky');
        if (btn) {
            btn.innerText = active ? "Sticky Cam: ON" : "Sticky Cam: OFF";
            btn.className = active ? "btn-toggle active" : "btn-toggle";
        }
        let canvasEl = document.getElementById('gameCanvas');
        if (canvasEl) {
            if (active) {
                canvasEl.style.position = "sticky";
                canvasEl.style.top = "0";
                canvasEl.style.zIndex = "999";
            } else {
                canvasEl.style.position = "static";
                canvasEl.style.top = "";
                canvasEl.style.zIndex = "";
            }
        }
    };

    window.toggleStickyCanvas = function() {
        window.playerStats.stickyCanvas = !window.playerStats.stickyCanvas;
        window.updateStickyCanvasStyle();
        if (typeof window.saveGame === "function") window.saveGame();
    };

    window.leaveActivity = function() {
        if (!window.playerStats.isDungeonMode && !window.playerStats.isCrucibleMode) {
            if (typeof window.pushHeaderToast === "function") window.pushHeaderToast("You are not currently in an activity!", "#e74c3c");
            return;
        }
        window.showCustomConfirm(
            "Retreat to Campaign",
            "Are you sure you want to retreat to the Campaign? You will keep your current progress and earn prorated rewards.",
            "Retreat", "Stay", "#e74c3c",
            function() {
                let p = window.resolvePlayerStats();

                if (window.playerStats.isCrucibleMode) {
                                    let finalWave = window.playerStats.crucibleWave || 1;
                                    window.playerStats.cruciblePeak = Math.max(window.playerStats.cruciblePeak || 1, finalWave);

                                    let startW = window.playerStats.crucibleStartWave || 1;
                                    let gainedShards = 0;
                                    let gainedCores = 0;

                                    for (let w = startW; w < finalWave; w++) {
                                        gainedShards += Math.ceil(1.5 * (1 + (w * 0.03)));

                                        // Mirrored progression gates for Catalyst Core retreat payouts
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

                    if (typeof window.pushLog === "function") window.pushLog(`<span style='color:#9b59b6; font-weight:bold;'>[CRUCIBLE RETREAT] Safely left the Crucible at Wave ${finalWave}. Earned ${gainedShards} Shards and ${gainedCores} Catalyst Cores!</span>`);
                    if (typeof window.pushHeaderToast === "function") window.pushHeaderToast(`🏃 Crucible Cleared! Wave ${finalWave}`, "#9b59b6");

                    if (typeof window.showCrucibleSummaryModal === "function") window.showCrucibleSummaryModal(finalWave, gainedShards, gainedCores);
                } else if (window.playerStats.isDungeonMode) {
                    let dType = window.playerStats.currentDungeon;
                    let dStage = window.playerStats.currentDungeonStage[dType] || 1;
                    window.playerStats.dungeonPeaks[dType] = Math.max(window.playerStats.dungeonPeaks[dType] || 1, dStage);

                    if (typeof window.pushLog === "function") window.pushLog(`<span style='color:#8e44ad; font-weight:bold;'>[DUNGEON RETREAT] Safely retreated from ${dType.toUpperCase()} Dungeon at Stage ${dStage}.</span>`);
                    if (typeof window.pushHeaderToast === "function") window.pushHeaderToast(`🏃 Retreated! Stage ${dStage}`, "#8e44ad");
                }

                window.playerStats.isDungeonMode = false;
                window.playerStats.isCrucibleMode = false;
                window.playerStats.currentDungeon = null;
                window.mob = null;
                window.playerStats.usedSecondWind = false;
                window.hero.x = 40;

                window.playerStats.runKills = 0;
                window.playerStats.runGold = 0;
                window.playerStats.runXp = 0;
                window.playerStats.killedBy = "Unknown Foe";
                window.playerStats.killedByMob = null;

                window.playerStats.currentHp = p.maxHp;
                if (typeof window.checkAchievements === "function") window.checkAchievements();
                if (typeof window.updateUI === "function") window.updateUI();
                if (typeof window.renderInventory === "function") window.renderInventory();
                if (typeof window.saveGame === "function") window.saveGame();
            }
        );
    };

    // --- DYNAMIC ATTRIBUTE HOVER TOOLTIPS ---

window.showStatBreakdown = function(e, statKey, isPct = false) {
    e.stopPropagation();
    let tt = document.getElementById('stat-tooltip');
    if (!tt) return;

    let clientX = e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
    let clientY = e.clientY || (e.touches && e.touches[0] ? e.touches[0].clientY : 0);
    window.activeStatTooltip = { type: 'breakdown', key: statKey, isPct: !!isPct, clientX: clientX, clientY: clientY, target: e.currentTarget || e.target };

    let alloc = window.playerStats.spAllocations;
    let p = window.resolvePlayerStats();
    let effectiveStr = Math.max(0, p.str - 5);
    let effectiveDex = Math.max(0, p.dex - 5);
    let effectiveInt = Math.max(0, p.int - 5);

    let map = {
        'str': { title: "💪 STR (Strength)", base: window.playerStats.baseStr, lvl: (alloc.spStr || 0), color: "#fff" },
        'dex': { title: "🎯 DEX (Dexterity)", base: window.playerStats.baseDex, lvl: (alloc.spDex || 0), color: "#fff" },
        'int': { title: "🧠 INT (Intelligence)", base: window.playerStats.baseInt, lvl: (alloc.spInt || 0), color: "#fff" },
        'atk': { title: "⚔️ Total Attack", base: window.playerStats.baseAtk, lvl: alloc.spAtk * 6, color: "#fff" },
        'maxHp': { title: "❤️ Max Health", base: window.playerStats.baseMaxHp, lvl: alloc.spHp * 45, color: "#fff" },
        'def': { title: "🛡️ Total Defense", base: window.playerStats.baseDef, lvl: alloc.spDef * 4, color: "#fff" },
        'moveSpeed': { title: "👟 Move Speed", base: window.playerStats.baseMoveSpeed, lvl: alloc.spSpd * 1, color: "#fff" },
        'critChance': { title: "✨ Crit Chance", base: window.playerStats.baseCritChance, lvl: alloc.spCrit * 0.005, color: "#e67e22" },
        'critDamage': { title: "💥 Crit Multiplier", base: window.playerStats.baseCritDamage, lvl: alloc.spCritDmg * 0.02, color: "#f1c40f" },
        'block': { title: "🛡️ Block Rate", base: window.playerStats.baseBlock, lvl: alloc.spBlock * 0.005, color: "#3498db" },
        'parry': { title: "⚡ Parry Rate", base: window.playerStats.baseParry, lvl: alloc.spParry * 0.005, color: "#e74c3c" },
        'rareSpawn': { title: "✨ Rare Enemy Spawn", base: window.playerStats.baseRareSpawn, lvl: 0, color: "#ffb6c1" },
        'fairySpawn': { title: "🧚 Fairy Spawn Rate", base: window.playerStats.baseFairySpawn, lvl: 0, color: "#ffb6c1" },
        'gold': { title: "🟡 Gold Multiplier", base: window.playerStats.baseGold, lvl: 0, color: "#f1c40f" }
    };

    let data = map[statKey] || { title: statKey.toUpperCase(), base: 0, lvl: 0, color: "#fff" };
    let gearTotal = 0; let artTotal = 0;

    for (let key in window.equippedSlots) {
        let item = window.equippedSlots[key];
        if (item && item[statKey] !== undefined) {
            if (item.type === "artifact") artTotal += item[statKey];
            else gearTotal += item[statKey];
        }
    }

    let achTotal = 0; let achPctTotal = 0;
    if (window.playerStats.unlockedAchievements && window.AchievementsData) {
        window.playerStats.unlockedAchievements.forEach(id => {
            let ach = window.AchievementsData.find(a => a.id === id);
            if (ach && ach.stats) {
                if (ach.stats[statKey] !== undefined) achTotal += ach.stats[statKey];
                let pctKey = statKey + "Pct";
                if (ach.stats[pctKey] !== undefined) achPctTotal += ach.stats[pctKey];
            }
        });
    }

    if (statKey === 'atk' && window.playerStats.atkPotionTimer > 0) gearTotal += Math.ceil((window.playerStats.baseAtk + alloc.spAtk * 6 + gearTotal + artTotal + achTotal) * 0.10);
    if (statKey === 'maxHp' && window.playerStats.hpPotionTimer > 0) gearTotal += Math.ceil((window.playerStats.baseMaxHp + alloc.spHp * 45 + gearTotal + artTotal) * 0.10);
    if (statKey === 'def' && window.playerStats.defPotionTimer > 0) gearTotal += Math.ceil((window.playerStats.baseDef + alloc.spDef * 4 + gearTotal + artTotal) * 0.10);
    if (statKey === 'moveSpeed' && window.playerStats.hastePotionTimer > 0) gearTotal += 3;

    if (statKey === 'moveSpeed' && window.checkArtifactTrait("move_speed")) artTotal += 10;
    if (statKey === 'def' && window.checkArtifactTrait("defense")) artTotal += 15;
    if (statKey === 'gold' && window.checkArtifactTrait("gold_hoard")) artTotal += 0.50;

    let formatVal = (v) => isPct ? `+${Math.floor(v*100)}%` : `+${v.toLocaleString()}`;
    if (statKey === 'gold') formatVal = (v) => `+${v.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;

    let html = `<div style="padding: 10px; width: 220px; box-sizing: border-box;">
        <div class="tt-title" style="color:${data.color};">${data.title} Breakdown</div>
        <div class="tt-stat-line" style="color:#aaa;">• Base Entity: ${formatVal(data.base).replace('+','')}</div>`;

    if (data.lvl > 0) html += `<div class="tt-stat-line" style="color:#3498db;">• Level Stats (SP): ${formatVal(data.lvl)}</div>`;
    if (gearTotal > 0) html += `<div class="tt-stat-line" style="color:#2ecc71;">• Equipment / Elixirs: ${formatVal(gearTotal)}</div>`;
    if (artTotal > 0) html += `<div class="tt-stat-line" style="color:#9b59b6;">• Artifacts: ${formatVal(artTotal)}</div>`;
    if (achTotal > 0) html += `<div class="tt-stat-line" style="color:#f1c40f;">• Achievements (Flat): ${formatVal(achTotal)}</div>`;
    if (achPctTotal > 0) html += `<div class="tt-stat-line" style="color:#f1c40f;">• Achievements (Mult): +${Math.round(achPctTotal * 100)}%</div>`;

    let totalVal = data.base + data.lvl + gearTotal + artTotal;
    if (statKey === 'atk' && effectiveStr > 0) {
        html += `<div class="tt-stat-line" style="color:#e67e22;">• Strength Scaling (STR): +${Math.floor(totalVal * (effectiveStr * 0.01))}</div>`;
        html += `<div class="tt-stat-line" style="color:#e67e22; font-style:italic;">  (+${effectiveStr}% Multiplier)</div>`;
    }
    if (statKey === 'maxHp' && effectiveStr > 0) {
        html += `<div class="tt-stat-line" style="color:#e67e22;">• Strength Scaling (STR): +${Math.floor(totalVal * (effectiveStr * 0.01))}</div>`;
        html += `<div class="tt-stat-line" style="color:#e67e22; font-style:italic;">  (+${effectiveStr}% Multiplier)</div>`;
    }
    if (statKey === 'def' && effectiveInt > 0) {
        html += `<div class="tt-stat-line" style="color:#9b59b6;">• Intelligence Scaling (INT): +${Math.floor(totalVal * (effectiveInt * 0.01))}</div>`;
        html += `<div class="tt-stat-line" style="color:#9b59b6; font-style:italic;">  (+${effectiveInt}% Multiplier)</div>`;
    }
    if (statKey === 'moveSpeed' && effectiveDex > 0) {
        html += `<div class="tt-stat-line" style="color:#3498db;">• Dexterity Scaling (DEX): +${(effectiveDex * 0.25).toFixed(1)}</div>`;
    }
    if (statKey === 'critChance' && effectiveDex > 0) {
        let scaleVal = ((effectiveDex * 0.30) / (effectiveDex + 250));
        html += `<div class="tt-stat-line" style="color:#3498db;">• Dexterity Scaling (DEX): +${Math.floor(scaleVal * 100)}%</div>`;
    }
    if (statKey === 'critDamage' && effectiveDex > 0) {
        html += `<div class="tt-stat-line" style="color:#3498db;">• Dexterity Scaling (DEX): +${Math.floor(effectiveDex * 1)}%</div>`;
    }
    if (statKey === 'block' && effectiveInt > 0) {
        let scaleVal = ((effectiveInt * 0.12) / (effectiveInt + 150));
        html += `<div class="tt-stat-line" style="color:#9b59b6;">• Intelligence Scaling (INT): +${Math.floor(scaleVal * 100)}%</div>`;
    }
    if (statKey === 'parry' && effectiveInt > 0) {
        let scaleVal = ((effectiveInt * 0.12) / (effectiveInt + 150));
        html += `<div class="tt-stat-line" style="color:#9b59b6;">• Intelligence Scaling (INT): +${Math.floor(scaleVal * 100)}%</div>`;
    }
    if (statKey === 'critChance' || statKey === 'critDamage') {
            if (window.playerStats.frenzyTimer > 0) html += `<div class="tt-stat-line" style="color:#e67e22; font-weight:bold; margin-top:5px;">• FRENZY BUFF ACTIVE!</div>`;
        }
        if (statKey === 'block' || statKey === 'parry') {
            let rawSum = statKey === 'block' ? p.rawBlock : p.rawParry;
            html += `<div style="margin: 6px 0; border-top: 1px dashed #444; padding-top: 4px; color: #ffb6c1; font-weight: bold;">Asymptotic Diminishing Returns:</div>`;
            html += `<div class="tt-stat-line" style="color:#aaa;">• Raw Accumulated Sum: <strong style="color:#fff;">${Math.round(rawSum * 100)}%</strong></div>`;
            html += `<div class="tt-stat-line" style="color:#2ecc71;">• Effective Avoidance: <strong style="color:#2ecc71;">${Math.floor(p[statKey] * 100)}%</strong></div>`;
        }
    if (statKey === 'str') {
        html += `<div style="margin: 6px 0; border-top: 1px dashed #444; padding-top: 4px; color: #ffb6c1; font-weight: bold;">Scaling Contributions:</div>`;
        html += `<div class="tt-stat-line" style="color:#2ecc71;">• Attack: +${Math.max(0, totalVal - 5)}% Multiplier</div>`;
        html += `<div class="tt-stat-line" style="color:#e74c3c;">• Max HP: +${Math.max(0, totalVal - 5)}% Multiplier</div>`;
    } else if (statKey === 'dex') {
        html += `<div style="margin: 6px 0; border-top: 1px dashed #444; padding-top: 4px; color: #ffb6c1; font-weight: bold;">Scaling Contributions:</div>`;
        html += `<div class="tt-stat-line" style="color:#e67e22;">• Crit Chance: +${(totalVal * 0.2).toFixed(1)}%</div>`;
        html += `<div class="tt-stat-line" style="color:#f1c40f;">• Crit Multi: +${(totalVal * 1.0).toFixed(1)}%</div>`;
        html += `<div class="tt-stat-line" style="color:#3498db;">• Move Speed: +${(totalVal * 0.25).toFixed(1)}</div>`;
    } else if (statKey === 'int') {
        html += `<div style="margin: 6px 0; border-top: 1px dashed #444; padding-top: 4px; color: #ffb6c1; font-weight: bold;">Scaling Contributions:</div>`;
        html += `<div class="tt-stat-line" style="color:#3498db;">• Block Rate: +${(totalVal * 0.2).toFixed(1)}%</div>`;
        html += `<div class="tt-stat-line" style="color:#e74c3c;">• Parry Rate: +${(totalVal * 0.2).toFixed(1)}%</div>`;
        html += `<div class="tt-stat-line" style="color:#2ecc71;">• Defense: +${Math.max(0, totalVal - 5)}% Multiplier</div>`;
        html += `<div class="tt-stat-line" style="color:#9b59b6;">• Potion Dur: +${Math.floor(totalVal)}%</div>`;
    }

    html += `</div>`;
    tt.style.borderColor = data.color; tt.innerHTML = html; tt.style.display = "block";
                                           window.positionTooltip(e, tt);
                                       };

                                       window.renderMarketShop = function() {
                                           let el = document.getElementById('gold-shop-list');
                                           if (!el) return;
                                           el.innerHTML = window.playerStats.shopItems.map((shopItem, index) => {
                                               let nameColor = window.getTierColor(shopItem.statsRolled);
                                               let costColor = window.playerStats.coins >= shopItem.cost ? "#2ecc71" : "#e74c3c";
                                               return `<div class="shop-row ${shopItem.isIOTD ? 'iotd' : ''}" onmouseenter="window.showMarketTooltip(event, ${index})" onmouseleave="window.hideTooltip()" ontouchstart="window.showMarketTooltip(event, ${index})">
                                                       <div>${shopItem.isIOTD ? '<span style="background:#f1c40f; color:#000; font-size:9px; font-weight:bold; padding:1px 3px; border-radius:2px;">ITEM OF THE DAY</span><br>' : ''}<strong style="color:${nameColor}; font-size:12px;">${shopItem.name}</strong><br><span style="font-size:10px; color:#aaa;">${shopItem.statsRolled}★ Quality</span></div>
                                                       <div style="text-align:right; position:relative; z-index:10;"><div style="color:${costColor}; font-weight:bold; font-size:11px; margin-bottom:4px;">${window.formatNumber(shopItem.cost)} Gold</div><button class="btn-action" style="${shopItem.purchased || window.playerStats.coins < shopItem.cost ? 'opacity:0.5; cursor:not-allowed; background:#444;' : 'background:#f1c40f; color:#000;'}" onclick="window.buyShopItem(${index})">${shopItem.purchased ? 'SOLD' : 'BUY'}</button></div>
                                                   </div>`;
                                           }).join("");
                                       };

                                       window.renderMysticalShop = function() {
                                           let el = document.getElementById('mystical-shop-list');
                                           if (!el) return;

                                           let stockHtml = window.MYSTICAL_STOCK.map((item, index) => {
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
                                                   displayCost = Math.ceil(item.cost * Math.pow(1.08, window.playerStats.stage));
                                                   costColor = window.playerStats.coins >= displayCost ? "#f1c40f" : "#e74c3c";
                                               }

                                               return `<div class="shop-row" style="border-color: ${item.color}; background: rgba(155, 89, 182, 0.05); flex-direction: column; align-items: stretch; text-align: left; gap: 4px; padding: 8px; cursor: help;" onmouseenter="window.showMysticalShopTooltip(event, ${index})" ontouchstart="window.showMysticalShopTooltip(event, ${index})" onmouseleave="window.hideTooltip()">
                                                   <div style="display:flex; justify-content:space-between; align-items:center;">
                                                       <strong style="color:${item.color}; font-size:12px;">${item.name}</strong>
                                                       <span style="color:${costColor}; font-weight:bold; font-size:11px;">${window.formatNumber(displayCost)} ${currencyLabel}</span>
                                                   </div>
                                                   <div style="font-size:10px; color:#aaa; margin-bottom:6px;">${item.desc}</div>
                                                   <button class="btn-action" style="background:#9b59b6; color:#fff;" onclick="window.buyMysticalItem(${index})">Purchase</button>
                                               </div>`;
                                           }).join("");

                                           let transHtml = window.POTION_TRANSMUTATIONS.map((recipe, index) => {
                                               let ownedCount = window.inventory.USE[recipe.req] || 0;
                                               let canAfford = ownedCount >= recipe.amount;
                                               let costColor = canAfford ? "#2ecc71" : "#e74c3c";

                                               return `<div class="shop-row" style="border-color: ${recipe.color}; background: rgba(155, 89, 182, 0.02); flex-direction: column; align-items: stretch; text-align: left; gap: 4px; padding: 8px; cursor: help;" onmouseenter="window.showTransmuteTooltip(event, ${index})" ontouchstart="window.showTransmuteTooltip(event, ${index})" onmouseleave="window.hideTooltip()">
                                                   <div style="display:flex; justify-content:space-between; align-items:center;">
                                                       <strong style="color:${recipe.color}; font-size:12px;">🧪 Transmute: ${recipe.result}</strong>
                                                       <span style="color:${costColor}; font-weight:bold; font-size:11px;">${recipe.amount}x ${recipe.req}</span>
                                                   </div>
                                                   <div style="font-size:10px; color:#aaa; margin-bottom:6px;">${recipe.desc} (Owned: ${ownedCount})</div>
                                                   <button class="btn-action" style="background:${recipe.color}; color:#fff;" ${canAfford ? '' : 'disabled style="opacity:0.5; cursor:not-allowed;"'} onclick="window.transmutePotion(${index})">Transmute</button>
                                               </div>`;
                                           }).join("");

                                           el.innerHTML = stockHtml + transHtml;
                                       };

                                       window.renderGoldUpgrades = function() {
                                           let el = document.getElementById('gold-upgrades-list');
                                           if (!el) return;
                                           let p = window.playerStats;

                                           let upgrades = [
                                               { id: 'vending', name: "🎰 Gacha Calibration", level: p.vendingQLevel || 0, cost: Math.floor(15000 * Math.pow(1.18, p.vendingQLevel || 0)), desc: "Increases Vending Machine loot quality by +1% per level.", color: "#f1c40f" },
                                               { id: 'shop', name: "🛒 Merchant Investment", level: p.shopQLevel || 0, cost: Math.floor(30000 * Math.pow(1.22, p.shopQLevel || 0)), desc: "Increases Gold Shop stock quality by +1% per level.", color: "#3498db" },
                                               { id: 'global', name: "🍀 Aura of Fortune", level: p.globalQLevel || 0, cost: Math.floor(100000 * Math.pow(1.28, p.globalQLevel || 0)), desc: "Increases all global and dungeon drop quality by +1.5% per level.", color: "#2ecc71" }
                                           ];

                                           const hexToRgba = (hex, alpha) => {
                                               let r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
                                               return `rgba(${r}, ${g}, ${b}, ${alpha})`;
                                           };

                                           el.innerHTML = upgrades.map(up => {
                                               let costColor = p.coins >= up.cost ? "#f1c40f" : "#e74c3c";
                                               let bgStyle = hexToRgba(up.color, 0.04);
                                               let bonusPct = (up.level * (up.id === 'global' ? 1.5 : 1));
                                               return `<div class="shop-row" style="border-color: ${up.color}; background: ${bgStyle}; flex-direction: column; align-items: stretch; text-align: left; gap: 4px; padding: 8px; cursor: help;" onmouseenter="window.showGoldUpgradeTooltip(event, '${up.id}')" onmouseleave="window.hideTooltip()" ontouchstart="window.showGoldUpgradeTooltip(event, '${up.id}')">
                                                   <div style="display:flex; justify-content:space-between; align-items:center;">
                                                       <strong style="color:${up.color}; font-size:12px;">${up.name} <span style="color:#aaa;">(Lv. ${up.level})</span></strong>
                                                       <span style="color:${costColor}; font-weight:bold; font-size:11px;">${window.formatNumber(up.cost)} Gold</span>
                                                   </div>
                                                   <div style="font-size:10px; color:#aaa; margin-bottom:6px;">${up.desc} Currently: <span style="color:#fff; font-weight:bold;">+${bonusPct.toFixed(1)}% Quality</span></div>
                                                   <button class="btn-action" style="background:${up.color}; color:#111; font-weight:bold;" onclick="window.buyGoldUpgrade('${up.id}')">Upgrade</button>
                                               </div>`;
                                           }).join("");
                                       };

                                       window.renderPrestigeTab = function() {
                                           let el = document.getElementById('tab-prestige');
                                           if (!el) return;

                                           let p = window.playerStats;
                                           if (p.level < 25 && (p.prestigeCount || 0) === 0) {
                                               el.innerHTML = `
                                                   <div style="text-align:center; padding: 40px 15px; background: #151515; border: 2px dashed #8e44ad; border-radius: 6px; box-shadow: inset 0 0 15px rgba(0,0,0,0.8);">
                                                       <div style="font-size: 40px; margin-bottom: 15px;">🔒</div>
                                                       <h3 style="margin:0 0 10px 0; color:#9b59b6; letter-spacing:1px; text-transform:uppercase;">Altar of Ascension</h3>
                                                       <p style="font-size:11px; color:#aaa; max-width: 320px; margin: 0 auto 15px auto; line-height: 1.5;">
                                                           Only legendary heroes of Level 25 or above may unlock the secrets of permanent Ascension. Keep questing to awaken your true potential!
                                                       </p>
                                                       <div style="font-size: 13px; font-weight: bold; color: #fff;">
                                                           Current Level: <span style="color:#e74c3c;">${p.level}</span> / <span style="color:#2ecc71;">25</span>
                                                       </div>
                                                   </div>
                                               `;
                                               return;
                                           }

                                           let upgrades = p.prestigeUpgrades || { bag: 0, gold: 0, exp: 0, drop: 0, atk: 0, fort: 0, fairy: 0 };
                                           let bagPts = upgrades.bag || 0; let goldPts = upgrades.gold || 0; let expPts = upgrades.exp || 0;
                                           let dropPts = upgrades.drop || 0; let atkPts = upgrades.atk || 0; let fortPts = upgrades.fort || 0; let fairyPts = upgrades.fairy || 0;

                                           let dAttr = p.prestigePoints < 1 ? "disabled style='opacity:0.5; cursor:not-allowed;'" : "";

                                           let requiredStage = Math.max(25, Math.floor((p.lifetimePeakStage || 1) * 0.85));
                                           let challengeBtnHtml = "";
                                           if (p.level < 25) challengeBtnHtml = `<button class="btn-action" style="background:#333; color:#777; border: 1px solid #444; font-weight:bold; font-size:12px; padding:8px 24px; border-radius:4px; cursor:not-allowed;" disabled>🔒 Requires Level 25 to Re-Challenge</button>`;
                                           else if (p.stage < requiredStage) challengeBtnHtml = `<button class="btn-action" style="background:#2c1a1a; color:#e74c3c; border: 1px solid #781c1c; font-weight:bold; font-size:11px; padding:8px 16px; border-radius:4px; cursor:not-allowed;" disabled>🔒 Push to Stage ${requiredStage} (Current: ${p.stage})</button>`;
                                           else challengeBtnHtml = `<button class="btn-action" style="background:#e74c3c; color:white; font-weight:bold; font-size:12px; padding:8px 24px; border-radius:4px; cursor:pointer;" onclick="window.challengeHooktail()">Challenge Prestige Boss</button>`;

                                           el.innerHTML = `
                                               <div style="display:flex; flex-direction:column; gap:12px;">
                                                   <div style="background: linear-gradient(135deg, #1f0505, #050000); border: 2px solid #e74c3c; border-radius: 6px; padding: 15px; text-align: center; box-shadow: 0 4px 10px rgba(0,0,0,0.5);">
                                                       <h3 style="margin: 0 0 6px 0; color: #e74c3c; font-size:15px; letter-spacing:1px; text-transform:uppercase; text-shadow: 0 0 10px rgba(231, 76, 60, 0.4);">🔥 CHALLENGE HOOKTAIL</h3>
                                                       <p style="font-size: 11px; color: #aaa; margin: 0 auto 12px auto; max-width: 440px; line-height: 1.45;">
                                                           Sacrifice your campaign peaks. Enter the dragon's lair! Defeating **Hooktail** soft-wipes your level and campaign progress, but rewards you with <span style="color:#f1c40f; font-weight:bold;">3 Prestige Points</span> to purchase massive permanent upgrades.
                                                       </p>
                                                       ${challengeBtnHtml}
                                                   </div>

                                                   <div style="background:#151515; border: 1px solid #333; border-radius:6px; padding:12px;">
                                                       <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #333; padding-bottom:8px; margin-bottom:10px;">
                                                           <h4 style="margin:0; color:#f1c40f; font-size:13px; text-transform:uppercase;">✨ PERMANENT ASCENSION ALTAR</h4>
                                                           <span style="background:#9b59b6; color:#fff; font-weight:bold; font-size:11px; padding:3px 10px; border-radius:10px; box-shadow: 0 0 8px rgba(155, 89, 182, 0.3);">PP Available: <span id="prestige-points-qty">${p.prestigePoints.toLocaleString()}</span></span>
                                                       </div>
                                                       <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
                                                           <div style="background:#111; border:1px solid #333; border-radius:4px; padding:10px; display:flex; flex-direction:column; justify-content:space-between;">
                                                               <div>
                                                                   <strong style="color:#3498db; font-size:12px;">🎒 Dimensional Satchel</strong>
                                                                   <div style="font-size:10px; color:#aaa; margin:3px 0 6px 0;">Adds +10 permanent backpack slots to carry more gear.</div>
                                                                   <div style="font-size:11px; font-weight:bold; color:#fff;">Current: <span style="color:#2ecc71;">+${(bagPts * 10).toLocaleString()} slots</span></div>
                                                               </div>
                                                               <button class="btn-action" style="margin-top:8px; background:#3498db;" ${dAttr} onclick="window.buyPrestigeUpgrade('bag')">Upgrade (1 PP)</button>
                                                           </div>
                                                           <div style="background:#111; border:1px solid #333; border-radius:4px; padding:10px; display:flex; flex-direction:column; justify-content:space-between;">
                                                               <div>
                                                                   <strong style="color:#f1c40f; font-size:12px;">🟡 Midas' Legacy</strong>
                                                                   <div style="font-size:10px; color:#aaa; margin:3px 0 6px 0;">Adds +25% Global Gold multiplier.</div>
                                                                   <div style="font-size:11px; font-weight:bold; color:#fff;">Current: <span style="color:#2ecc71;">+${(goldPts * 25).toLocaleString()}% Gold</span></div>
                                                               </div>
                                                               <button class="btn-action" style="margin-top:8px; background:#f1c40f; color:#000;" ${dAttr} onclick="window.buyPrestigeUpgrade('gold')">Upgrade (1 PP)</button>
                                                           </div>
                                                           <div style="background:#111; border:1px solid #333; border-radius:4px; padding:10px; display:flex; flex-direction:column; justify-content:space-between;">
                                                               <div>
                                                                   <strong style="color:#9b59b6; font-size:12px;">🧠 Ancient Wisdom</strong>
                                                                   <div style="font-size:10px; color:#aaa; margin:3px 0 6px 0;">Adds +10% Global EXP rate to level back up faster.</div>
                                                                   <div style="font-size:11px; font-weight:bold; color:#fff;">Current: <span style="color:#2ecc71;">+${(expPts * 10).toLocaleString()}% EXP</span></div>
                                                               </div>
                                                               <button class="btn-action" style="margin-top:8px; background:#9b59b6;" ${dAttr} onclick="window.buyPrestigeUpgrade('exp')">Upgrade (1 PP)</button>
                                                           </div>
                                                           <div style="background:#111; border:1px solid #333; border-radius:4px; padding:10px; display:flex; flex-direction:column; justify-content:space-between;">
                                                               <div>
                                                                   <strong style="color:#2ecc71; font-size:12px;">🍀 Cosmic Fortune</strong>
                                                                   <div style="font-size:10px; color:#aaa; margin:3px 0 6px 0;">Adds +5% Global Drop Rate.</div>
                                                                   <div style="font-size:11px; font-weight:bold; color:#fff;">Current: <span style="color:#2ecc71;">+${(dropPts * 5).toLocaleString()}% Drop</span></div>
                                                               </div>
                                                               <button class="btn-action" style="margin-top:8px; background:#2ecc71;" ${dAttr} onclick="window.buyPrestigeUpgrade('drop')">Upgrade (1 PP)</button>
                                                           </div>
                                                           <div style="background:#111; border:1px solid #333; border-radius:4px; padding:10px; display:flex; flex-direction:column; justify-content:space-between;">
                                                               <div>
                                                                   <strong style="color:#e74c3c; font-size:12px;">🔱 Gladiator's Might</strong>
                                                                   <div style="font-size:10px; color:#aaa; margin:3px 0 6px 0;">Adds +12% Compounding Global Attack power.</div>
                                                                   <div style="font-size:11px; font-weight:bold; color:#fff;">Current: <span style="color:#2ecc71;">x${Math.pow(1.12, atkPts).toFixed(2)} Mult</span></div>
                                                               </div>
                                                               <button class="btn-action" style="margin-top:8px; background:#e74c3c;" ${dAttr} onclick="window.buyPrestigeUpgrade('atk')">Upgrade (1 PP)</button>
                                                           </div>
                                                           <div style="background:#111; border:1px solid #333; border-radius:4px; padding:10px; display:flex; flex-direction:column; justify-content:space-between;">
                                                               <div>
                                                                   <strong style="color:#1abc9c; font-size:12px;">🛡️ Colossal Fortitude</strong>
                                                                   <div style="font-size:10px; color:#aaa; margin:3px 0 6px 0;">Adds +10% Global HP and +5% Defense (Compounding).</div>
                                                                   <div style="font-size:11px; font-weight:bold; color:#fff;">Current: <span style="color:#2ecc71;">x${Math.pow(1.10, fortPts).toFixed(2)} HP, x${Math.pow(1.05, fortPts).toFixed(2)} Def</span></div>
                                                               </div>
                                                               <button class="btn-action" style="margin-top:8px; background:#1abc9c;" ${dAttr} onclick="window.buyPrestigeUpgrade('fort')">Upgrade (1 PP)</button>
                                                           </div>
                                                           <div style="background:#111; border:1px solid #333; border-radius:4px; padding:10px; display:flex; flex-direction:column; justify-content:space-between;">
                                                               <div>
                                                                   <strong style="color:#ffb6c1; font-size:12px;">🧚 Aetheric Beacon</strong>
                                                                   <div style="font-size:10px; color:#aaa; margin:3px 0 6px 0;">Adds +5% Multi-Fairy Spawn chance per level.</div>
                                                                   <div style="font-size:11px; font-weight:bold; color:#fff;">Current: <span style="color:#2ecc71;">+${(fairyPts * 5).toLocaleString()}% Spawn</span></div>
                                                               </div>
                                                               <button class="btn-action" style="margin-top:8px; background:#ffb6c1; color:#000;" ${dAttr} onclick="window.buyPrestigeUpgrade('fairy')">Upgrade (1 PP)</button>
                                                           </div>
                                                       </div>
                                                   </div>
                                               </div>
                                           `;
                                       };

                                       window.buyPrestigeUpgrade = function(type) {
                                           if (window.playerStats.prestigePoints < 1) return;
                                           window.playerStats.prestigePoints--;
                                           window.playerStats.prestigeUpgrades[type] = (window.playerStats.prestigeUpgrades[type] || 0) + 1;

                                           window.pushHeaderToast("🎉 Permanent Upgrade Acquired!", "#9b59b6");

                                           let p = window.resolvePlayerStats();
                                           window.playerStats.currentHp = Math.min(window.playerStats.currentHp, p.maxHp);

                                           window.updateUI(); window.renderPrestigeTab(); window.renderInventory(); window.saveGame();
                                       };

                                       window.challengeHooktail = function() {
                                           if (window.playerStats.level < 25) { window.pushHeaderToast("Requires Level 25!", "#e74c3c"); return; }

                                           let requiredStage = Math.max(25, Math.floor((window.playerStats.lifetimePeakStage || 1) * 0.85));
                                           if (window.playerStats.stage < requiredStage) { window.pushHeaderToast(`Requires Campaign Stage ${requiredStage} to challenge Hooktail!`, "#e74c3c"); return; }

                                           if (window.playerStats.isDungeonMode || window.playerStats.isCrucibleMode || window.playerStats.isPrestigeBossMode) {
                                               window.pushHeaderToast("Cannot challenge while in another activity!", "#e74c3c"); return;
                                           }

                                           window.showCustomConfirm(
                                               "Challenge Hooktail",
                                               "Are you prepared to face the massive dragon Hooktail? Defeating her will reset campaign peak parameters but award 3 Prestige Points!",
                                               "Challenge", "Flee", "#e74c3c",
                                               function() {
                                                   window.saveGame(); window.setPauseState(false);
                                                   window.playerStats.isPrestigeBossMode = true; window.playerStats.prestigeApproachTimer = 180; window.mob = null;
                                                   let p = window.resolvePlayerStats(); window.playerStats.currentHp = p.maxHp;

                                                   window.pushLog(`<span style='color:#e74c3c; font-weight:bold;'>[ASCENSION] Challenged Hooktail! Sprinting toward her cavern at high speed...</span>`);
                                                   window.updateUI(); window.switchTab('gear');
                                               }
                                           );
                                       };

                                       window.triggerPrestigeAscension = function() {
                                           window.isGamePaused = true;
                                           window.playerStats.historicalPeakLvl = Math.max(window.playerStats.historicalPeakLvl || 1, window.playerStats.level);

                                           let stageScale = Math.floor((window.playerStats.stage - 1) / 10) + 1;
                                           let mythicItem;

                                           if (Math.random() < 0.10) {
                                               mythicItem = window.createItemObject("weapon", 5, stageScale, 5);
                                               if (!mythicItem.isUniqueStaff && !mythicItem.isUniqueSword) {
                                                   if (Math.random() < 0.5) {
                                                       mythicItem.isUniqueStaff = true; mythicItem.noun = "Phoenix Staff"; mythicItem.setName = null;
                                                       mythicItem.name = `🔥 Phoenix Ignition Staff (Lv. ${stageScale})`;
                                                       mythicItem.desc = "Launches penetrating fireballs that deal 25% Attack damage (3s Cooldown).";
                                                   } else {
                                                       mythicItem.isUniqueSword = true; mythicItem.noun = "Sanguine Reaver"; mythicItem.setName = null;
                                                       mythicItem.name = `🩸 Crimson Sanguine Reaver (Lv. ${stageScale})`;
                                                       mythicItem.desc = "Strikes apply stacking Bleed (Max 5). Strikes at max stacks triggers Rupture, dealing 300% weapon damage and siphoning 10% Max HP.";
                                                   }
                                               }
                                           } else {
                                               let types = ["weapon", "subweapon", "helmet", "chest", "leggings", "overall", "boots"];
                                               let chosenType = types[Math.floor(Math.random() * types.length)];
                                               mythicItem = window.createItemObject(chosenType, 5, stageScale, 5);
                                           }

                                           let prestigeArtifact = window.createItemObject("artifact", 3, stageScale, 0);

                                           mythicItem.locked = true; prestigeArtifact.locked = true;
                                           window.inventory.EQUIP.push(mythicItem); window.inventory.ARTIFACT.push(prestigeArtifact);

                                           let basePoints = 3; let bonusPoints = Math.floor(window.playerStats.prestigeCount / 4);
                                           let totalAwarded = Math.min(10, basePoints + bonusPoints);
                                           window.playerStats.prestigePoints += totalAwarded; window.playerStats.prestigeCount++;

                                           let nowTime = Date.now();
                                           if (window.playerStats.lastAscensionTime && (nowTime - window.playerStats.lastAscensionTime <= 900000)) window.playerStats.hasTriggeredSpeedrun = true;
                                           window.playerStats.lastAscensionTime = nowTime;
                                           window.playerStats.lifetimePeakStage = Math.max(window.playerStats.lifetimePeakStage || 1, window.playerStats.maxStage || 1);

                                           for (let slot in window.equippedSlots) {
                                               if (window.equippedSlots[slot]) {
                                                   let item = window.equippedSlots[slot]; delete item.isEquippedSlot;
                                                   if (item.type === "artifact") window.inventory.ARTIFACT.push(item); else window.inventory.EQUIP.push(item);
                                                   window.equippedSlots[slot] = null;
                                               }
                                           }

                                           window.playerStats.level = 1; window.playerStats.xp = 0; window.playerStats.xpReq = 100;
                                           window.playerStats.stage = 1; window.playerStats.maxStage = 1;
                                           window.playerStats.crucibleWave = 1; window.playerStats.crucibleStartWave = 1;
                                           window.playerStats.isPrestigeBossMode = false; window.playerStats.prestigeApproachTimer = 0;
                                           window.mob = null; window.hero.x = 40;

                                           let p = window.resolvePlayerStats(); window.playerStats.currentHp = p.maxHp;

                                           let modal = document.createElement('div');
                                           modal.style.position = 'fixed'; modal.style.top = '0'; modal.style.left = '0';
                                           modal.style.width = '100%'; modal.style.height = '100%'; modal.style.backgroundColor = 'rgba(0,0,0,0.92)';
                                           modal.style.display = 'flex'; modal.style.justifyContent = 'center'; modal.style.alignItems = 'center';
                                           modal.style.zIndex = '35000'; modal.style.padding = '15px';

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
                                                       <div style="font-size:11.5px; color:#e74c3c; font-weight:bold; margin-bottom:4px;">🎁 Souvenir: 5★ Mythic ${mythicItem.name}</div>
                                                       <div style="font-size:11.5px; color:#1abc9c; font-weight:bold; margin-bottom:8px;">🔮 Artifact: ${prestigeArtifact.name}</div>
                                                       <div style="font-size:11px; color:#9b59b6; font-weight:bold;">Total Ascensions: ${window.playerStats.prestigeCount}</div>
                                                   </div>
                                                   <p style="font-size:11px; color:#7f8c8d; line-height:1.4; margin-bottom:20px;">
                                                       Your raw levels and campaign stage are reset. However, spent Attribute Matrix points, materials, and achievements are **completely preserved**!
                                                   </p>
                                                   <button id="btn-prestige-ascend-confirm" style="background:linear-gradient(135deg, #e74c3c, #c0392b); color:white; border:1px solid #f1c40f; font-weight:bold; font-size:13px; text-transform:uppercase; letter-spacing:1px; padding:12px 24px; border-radius:4px; cursor:pointer; width:100%; box-shadow:0 4px 10px rgba(0,0,0,0.4);">Arise as an Ascended Hero</button>
                                               </div>
                                           `;
                                           document.body.appendChild(modal);

                                           document.getElementById('btn-prestige-ascend-confirm').onclick = function() {
                                               modal.remove(); window.isGamePaused = false;
                                               window.checkAchievements(); window.updateUI(); window.renderPrestigeTab(); window.renderInventory(); window.saveGame();
                                               window.pushLog(`<span style='color:#e74c3c; font-weight:bold;'>[ASCENSION] Your legacy begins anew! Discovered pristine ${mythicItem.name} and ${prestigeArtifact.name}! Sacks have expanded to hold your rewards.</span>`);
                                           };
                                       };

                                       window.showMarketTooltip = function(e, index) {
                                           let item = window.playerStats.shopItems[index]; if (!item || item.purchased) return;
                                           let tt = document.getElementById('game-tooltip');
                                           let baseHtml = window.buildGeneralTooltipHtml(item, true);

                                           let goldStr = window.formatNumber(window.playerStats.coins);
                                           let costStr = window.formatNumber(item.cost);
                                           let goldColor = window.playerStats.coins >= item.cost ? "#2ecc71" : "#e74c3c";

                                           let footer = `<div style="background:#0b0f12; border-top:1px solid #333; padding:8px 10px; font-size:10px; font-family:monospace; text-align:center; border-radius: 0 0 6px 6px;">
                                               <span style="color:#aaa;">Your Gold:</span> <strong style="color:${goldColor};">${goldStr}</strong> <span style="color:#666;">|</span> <span style="color:#aaa;">Cost:</span> <strong style="color:#f1c40f;">${costStr}</strong>
                                           </div>`;

                                           tt.innerHTML = `<div style="display:flex; flex-direction:column;">${baseHtml}${footer}</div>`;
                                           tt.style.borderColor = window.getTierColor(item.statsRolled);
                                           tt.style.display = "block";
                                           window.positionTooltip(e, tt);
                                       };

                                       window.showMysticalShopTooltip = function(e, index) {
                                           e.stopPropagation();
                                           let tt = document.getElementById('etc-tooltip');
                                           let item = window.MYSTICAL_STOCK[index];
                                           if (!item) return;

                                           let color = item.color || "#9b59b6";
                                           let ownedAmount = 0;
                                           if (item.name === "Gacha Key" || item.name === "Astral Essence" || item.name === "Catalyst Core") ownedAmount = window.inventory.ETC[item.name] || 0;
                                           else ownedAmount = window.inventory.USE[item.name] || 0;

                                           let actualCost = item.cost; let currencyName = item.currency; let playerBalance = 0;

                                           if (item.currency === "Luminous Soul") {
                                               playerBalance = window.inventory.ETC["Luminous Soul"] || 0; currencyName = "Luminous Souls";
                                           } else if (item.currency === "Astral Shards") {
                                               playerBalance = window.playerStats.astralShards || 0; currencyName = "Astral Shards";
                                           } else {
                                               actualCost = Math.ceil(item.cost * Math.pow(1.08, window.playerStats.stage));
                                               playerBalance = window.playerStats.coins || 0; currencyName = "Gold";
                                           }

                                           let canAfford = playerBalance >= actualCost;
                                           let costTextColor = canAfford ? "#2ecc71" : "#e74c3c";

                                           tt.innerHTML = `<div style="padding: 10px; width: 230px; box-sizing: border-box;">
                                               <div class="tt-title" style="color:${color}; font-weight:bold;">🔮 ${item.name}</div>
                                               <div style="font-size:11px; color:#aaa; margin-bottom:8px; line-height:1.4; white-space:normal;">${item.desc}</div>
                                               <div style="font-size:11px; margin-bottom:6px; border-top:1px dashed #444; padding-top:6px;">
                                                   • <span style="color:#bdc3c7;">Currently Owned:</span> <strong style="color:${color};">${ownedAmount.toLocaleString()}</strong>
                                               </div>
                                               <div style="font-size:11px; margin-bottom:4px;">
                                                 • <span style="color:#bdc3c7;">Exchange Rate:</span> <strong style="color:${costTextColor};">${window.formatNumber(actualCost)} / ${window.formatNumber(playerBalance)} ${currencyName}</strong>
                                                  </div>
                                                   <div style="font-size:10px; color:${canAfford ? '#2ecc71' : '#e74c3c'}; font-weight:bold; margin-top:4px;">
                                                   ${canAfford ? '✓ Ready to Transmute' : '✗ Insufficient Materials'}
                                               </div>
                                           </div>`;

                                           tt.style.borderColor = color; tt.style.display = "block"; window.positionTooltip(e, tt);
                                       };

                                       window.showTransmuteTooltip = function(e, index) {
                                           e.stopPropagation(); let recipe = window.POTION_TRANSMUTATIONS[index]; if (!recipe) return;

                                           let ownedResult = window.inventory.USE[recipe.result] || 0; let ownedReq = window.inventory.USE[recipe.req] || 0;
                                           let canAfford = ownedReq >= recipe.amount; let reqColor = canAfford ? "#2ecc71" : "#e74c3c";

                                           let tt = document.getElementById('game-tooltip');
                                           tt.innerHTML = `<div style="padding: 10px; width: 230px; box-sizing: border-box;">
                                               <div class="tt-title" style="color:${recipe.color};">🧪 Transmutation Recipe</div>
                                               <div class="tt-subtitle">${recipe.result}</div>
                                               <div style="color:#ddd; font-size:11px; margin-bottom:6px; white-space:normal; line-height:1.3;">${recipe.desc}</div>
                                               <div style="margin-top:8px; border-top: 1px dashed #444; padding-top:6px; font-family:monospace; font-size:10px;">
                                                   <div class="tt-stat-line" style="color:#aaa;">Result Owned: <strong style="color:#fff;">${ownedResult}</strong></div>
                                                   <div class="tt-stat-line" style="color:#aaa;">Required Ingredients: <strong style="color:${reqColor};">${ownedReq} / ${recipe.amount} ${recipe.req}</strong></div>
                                               </div>
                                           </div>`;
                                           tt.style.borderColor = recipe.color; tt.style.display = "block"; window.positionTooltip(e, tt);
                                       };

                                       window.showGoldUpgradeTooltip = function(e, upId) {
                                           e.stopPropagation(); let p = window.playerStats; let up;
                                           if (upId === 'vending') { up = { name: "🎰 Gacha Calibration", level: p.vendingQLevel || 0, cost: Math.floor(15000 * Math.pow(1.18, p.vendingQLevel || 0)), color: "#f1c40f" }; }
                                           else if (upId === 'shop') { up = { name: "🛒 Merchant Investment", level: p.shopQLevel || 0, cost: Math.floor(30000 * Math.pow(1.22, p.shopQLevel || 0)), color: "#3498db" }; }
                                           else if (upId === 'global') { up = { name: "🍀 Aura of Fortune", level: p.globalQLevel || 0, cost: Math.floor(100000 * Math.pow(1.28, p.globalQLevel || 0)), color: "#2ecc71" }; }
                                           if (!up) return;

                                           let goldStr = window.formatNumber(p.coins); let costStr = window.formatNumber(up.cost);
                                           let goldColor = p.coins >= up.cost ? "#2ecc71" : "#e74c3c";

                                           let tt = document.getElementById('game-tooltip');
                                           tt.innerHTML = `<div style="padding: 10px; width: 230px; box-sizing: border-box;">
                                               <div class="tt-title" style="color:${up.color};">${up.name}</div>
                                               <div class="tt-subtitle">Upgrade Level: ${up.level}</div>
                                               <div style="margin-top:8px; border-top: 1px dashed #444; padding-top:6px; font-family:monospace; font-size:10px;">
                                                   <div class="tt-stat-line" style="color:#aaa;">Your Gold: <strong style="color:${goldColor};">${goldStr}</strong></div>
                                                   <div class="tt-stat-line" style="color:#aaa;">Upgrade Cost: <strong style="color:#f1c40f;">${costStr}</strong></div>
                                               </div>
                                           </div>`;
                                           tt.style.borderColor = up.color; tt.style.display = "block"; window.positionTooltip(e, tt);
                                       };

                                       window.buildAltarModal = function() {
                                           let listEl = document.getElementById('altar-list');
                                           let aegisArts = ["Blood-Soaked Chalice", "Aegis Core", "Riposte Gauntlet", "Phoenix Ankh", "Golem's Core", "Titan's Shield Grip", "Survivor's Adrenaline"];
                                           let chronoArts = ["Philosopher's Anchor", "Windwalker Boots", "Sloth's Blessing", "Chrono Hourglass", "Fairy Queen's Crown", "Alchemist's Alembic", "Philosopher's Catalyst"];
                                           let cyberArts = ["Berserker Stone", "Gilded Scarab", "Phantom Blade", "Zealot's Charm", "Dimensional Pouch", "Void Core", "Cauldron of Eternity"];

                                           let renderGroup = (title, bossName, itemsType, allowedList, color) => {
                                               let filtered = window.ARTIFACT_POOL.filter(a => allowedList.includes(a.name));
                                               let html = `
                                                   <div style="border: 1px solid ${color}; border-radius:6px; padding:10px; background: rgba(0,0,0,0.4); margin-bottom:12px;">
                                                       <div style="color:${color}; font-weight:bold; font-size:13px; margin-bottom:4px; text-transform:uppercase; display:flex; justify-content:space-between; flex-wrap:wrap; gap:4px;">
                                                           <span>🛡️ ${title}</span><span style="font-size:10px; color:#aaa; font-weight:normal;">Equip: ${itemsType}</span>
                                                       </div>
                                                       <div style="font-size:10px; color:#888; font-style:italic; margin-bottom:8px;">Boss Target: ${bossName}</div>
                                                       <div style="display:flex; flex-direction:column; gap:6px;">
                                               `;
                                               html += filtered.map(art => `
                                                   <div class="bag-item" style="cursor:help; border-left: 3px solid ${color}; margin-bottom:0; background:#18181c; padding:6px 10px;" onmouseenter="window.showDummyArtifact(event, '${art.trait}')" ontouchstart="window.showDummyArtifact(event, '${art.trait}')" onmouseleave="window.hideTooltip()">
                                                       <div><strong style="color:${color};">${art.name}</strong><br><span style="font-size:9.5px;color:#aaa;">${art.desc}</span></div>
                                                   </div>
                                               `).join("");
                                               html += `</div></div>`;
                                               return html;
                                           };

                                           listEl.innerHTML = `
                                               ${renderGroup("Aegis Rift Vault", "Aegis Goliath", "Overall / Chest / Leggings", aegisArts, "#3498db")}
                                               ${renderGroup("Chrono Rift Vault", "Chronos Arbitrator", "Boots / Helmet", chronoArts, "#f1c40f")}
                                               ${renderGroup("Cyber Rift Vault", "Nexus Overseer", "Weapon / Sub-weapon", cyberArts, "#ff007f")}
                                           `;
                                       };

                                       window.showAltarTooltip = function(e) {
                                           e.stopPropagation();
                                           let cores = window.inventory.ETC["Ancient Core"] || 0; let level = window.playerStats.level || 1;
                                           let tt = document.getElementById('game-tooltip');
                                           tt.innerHTML = `<div style="padding: 10px; width: 240px; box-sizing: border-box;">
                                               <div class="tt-title" style="color:#9b59b6;">🔮 Ancient Altar Summoning</div>
                                               <div class="tt-subtitle">Reality Rift Activation requirements</div>
                                               <div class="tt-stat-line" style="color:#bdc3c7;">• Required Cores: <span style="color:#f1c40f; font-weight:bold;">10 Cores</span></div>
                                               <div class="tt-stat-line" style="color:#bdc3c7;">• Required Level: <span style="color:#2ecc71; font-weight:bold;">Lv 30+</span></div>
                                               <div style="margin-top:8px; border-top: 1px dashed #444; padding-top:6px; font-family:monospace; font-size:10px;">
                                                   <div class="tt-stat-line" style="color:#fff;">Your Cores: <strong style="color:${cores >= 10 ? '#2ecc71' : '#e74c3c'};">${cores} / 10</strong></div>
                                                   <div class="tt-stat-line" style="color:#fff;">Your Level: <strong style="color:${level >= 30 ? '#2ecc71' : '#e74c3c'};">Lv ${level} / 30</strong></div>
                                               </div>
                                           </div>`;
                                           tt.style.borderColor = "#9b59b6"; tt.style.display = "block"; window.positionTooltip(e, tt);
                                       };

                                       window.showGachaTooltip = function(e) {
                                           e.stopPropagation(); let p = window.resolvePlayerStats();
                                           let qly = p.qly + ((window.playerStats.vendingQLevel || 0) * 0.01);
                                           let mythic = (0.5 * qly); let leg = (2.0 * qly) - mythic; let epic = (10.0 * qly) - (2.0 * qly); let magic = (30.0 * qly) - (10.0 * qly); let rare = 100 - (30.0 * qly);
                                           let keysHeld = window.inventory.ETC["Gacha Key"] || 0;

                                           let tt = document.getElementById('game-tooltip');
                                           tt.innerHTML = `<div style="padding: 10px; width: 250px; box-sizing: border-box;">
                                               <div class="tt-title" style="color:#f1c40f;">🎰 Vending Machine Rates</div>
                                               <div class="tt-subtitle">Gacha Rarity Distribution</div>
                                               <div class="tt-stat-line" style="color:#3498db;">• 1★ Rare: ${Math.max(0, rare).toFixed(2)}%</div>
                                               <div class="tt-stat-line" style="color:#9b59b6;">• 2★ Magic: ${Math.max(0, magic).toFixed(2)}%</div>
                                               <div class="tt-stat-line" style="color:#e67e22;">• 3★ Epic: ${Math.max(0, epic).toFixed(2)}%</div>
                                               <div class="tt-stat-line" style="color:#f1c40f;">• 4★ Legendary: ${Math.max(0, leg).toFixed(2)}%</div>
                                               <div class="tt-stat-line" style="color:#e74c3c;">• 5★ Mythic: ${Math.max(0, mythic).toFixed(2)}%</div>
                                               <div class="tt-stat-line" style="color:#1abc9c; margin-top:4px;">• Bonus: 1% flat chance for Unique Artifact!</div>
                                               <div class="tt-subtitle" style="margin-top:6px; border-top:1px solid #333; padding-top:4px;">Guaranteed 1★ to 5★ gear. Influenced by Drop Quality.</div>
                                               <div style="margin-top:8px; border-top: 1px dashed #444; padding-top:6px; font-family:monospace; font-size:10px;">
                                                   <div class="tt-stat-line" style="color:#fff;">Your Keys: <strong style="color:${keysHeld >= 1 ? '#2ecc71' : '#e74c3c'};">${keysHeld.toLocaleString()} / 1</strong></div>
                                               </div>
                                           </div>`;
                                           tt.style.borderColor = "#f1c40f"; tt.style.display = "block"; window.positionTooltip(e, tt);
                                       };

                                       window.showDummyArtifact = function(e, traitId) {
                                           e.stopPropagation(); document.querySelectorAll('.bag-item').forEach(el => el.classList.remove('active-tooltip'));
                                           let artDef = window.ARTIFACT_POOL.find(a => a.trait === traitId);
                                           let dummy = {
                                               id: "dummy", name: "⭐ UNIQUE " + artDef.name + " (Lv. 1)", type: "artifact", statsRolled: "UNIQUE", temperLevel: 0, stageLevel: 1,
                                               atk: 0, maxHp: 0, def: 0, moveSpeed: 0, critChance: 0, critDamage: 0, block: 0, parry: 0, dropRate: artDef.dropRate, quality: artDef.quality, goldMulti: artDef.goldMulti,
                                               activeAttackSpeed: 0, idleAttackSpeed: 0, trait: artDef.trait, desc: artDef.desc, breakdown: artDef.breakdown, str: 0, dex: 0, int: 0
                                           };
                                           let tt = document.getElementById('game-tooltip');
                                           tt.innerHTML = `<div class="tooltip-flex-container"><div class="tooltip-card">${window.generateItemCardHtml(dummy, null, false)}</div></div>`;
                                           tt.style.borderColor = window.getTierColor("UNIQUE"); tt.style.display = "block"; window.positionTooltip(e, tt);
                                       };

window.refreshActiveStatTooltip = function() {
    if (!window.activeStatTooltip) return;
    let mockEvent = {
        clientX: window.activeStatTooltip.clientX, clientY: window.activeStatTooltip.clientY,
        target: window.activeStatTooltip.target, currentTarget: window.activeStatTooltip.target,
        stopPropagation: function() {}
    };
    let cached = window.activeStatTooltip;
    window.activeStatTooltip = null;
    if (cached.type === 'breakdown') { window.showStatBreakdown(mockEvent, cached.key, cached.isPct); }
    else if (cached.type === 'hover') { window.showStatHoverTooltip(mockEvent, cached.key); }
};

window.showStatHoverTooltip = function(e, key) {
    e.stopPropagation();
    let tt = document.getElementById('stat-tooltip');
    if (!tt) return;

    let clientX = e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
    let clientY = e.clientY || (e.touches && e.touches[0] ? e.touches[0].clientY : 0);
    window.activeStatTooltip = { type: 'hover', key: key, clientX: clientX, clientY: clientY, target: e.currentTarget || e.target };

    let html = ""; let p = window.resolvePlayerStats();
    if (key === 'ias') {
        html = `<div style="padding: 10px; width: 220px; box-sizing: border-box;"><div class="tt-title" style="color:#3498db;">⏱️ Idle Attack Speed</div><div style="color:#aaa; font-size:11px;">The number of engine frames between automatic attacks (60 frames = 1 second).<br><br><b>Lower is faster!</b><br>Currently attacking automatically every ${(p.idleAttackSpeed/60).toFixed(2)}s.</div></div>`;
        tt.style.borderColor = "#3498db";
    } else if (key === 'aas') {
        html = `<div style="padding: 10px; width: 220px; box-sizing: border-box;"><div class="tt-title" style="color:#e74c3c;">⚡ Active Attack Speed</div><div style="color:#aaa; font-size:11px;">The cooldown limit in frames between manual clicks or spacebar taps.<br><br><b>Lower is faster!</b><br>Currently capped at ${(60/p.activeAttackSpeed).toFixed(1)} attacks per second.</div></div>`;
        tt.style.borderColor = "#e74c3c";
    } else if (key === 'drp') {
        let eff = window.state.efficiency;
        html = `<div style="padding: 10px; width: 220px; box-sizing: border-box;"><div class="tt-title" style="color:#2ecc71;">🍀 Drop Rate Modifier</div><div style="color:#aaa; font-size:11px;">Current Multiplier: x${(p.drop * eff).toFixed(2)} ${eff > 1.0 ? "(Manual Play Bonus Active)" : ""}<br><br><b>Exact Chances:</b><br>• Standard Mob Drop: ${(4.5 * p.drop * eff).toFixed(2)}%<br>• Rare Mob Drop: ${(15.0 * p.drop * eff).toFixed(2)}%<br>• Boss Drop: ${(25.0 * p.drop * eff).toFixed(2)}%<br>• Dungeon Mob: ${(10.0 * p.drop * eff).toFixed(2)}%</div></div>`;
        tt.style.borderColor = "#2ecc71";
    } else if (key === 'qly') {
        html = `<div style="padding: 10px; width: 220px; box-sizing: border-box;"><div class="tt-title" style="color:#9b59b6;">💎 Drop Quality Modifier</div><div style="color:#aaa; font-size:11px;">Current Multiplier: x${p.qly.toFixed(2)}<br><br>Increases the probability that an item drop will roll with more bonus modifier lines (higher star rating).</div></div>`;
        tt.style.borderColor = "#9b59b6";
    } else if (key === 'idps') {
        html = `<div style="padding: 10px; width: 220px; box-sizing: border-box;"><div class="tt-title" style="color:#9b59b6;">🔄 Idle DPS</div><div style="color:#aaa; font-size:11px;">Your calculated Damage Per Second when attacking automatically or offline.<br><br>Factors in Attack, Crit Chance, Crit Multiplier, and Idle Atk Spd. Does not account for active clicking or Adrenaline buffs.</div></div>`;
        tt.style.borderColor = "#9b59b6";
    }

    tt.innerHTML = html; tt.style.display = "block";
    window.positionTooltip(e, tt);
};

// --- PAPERDOLL & BAGS GRID RENDERERS ---

window.renderPaperDoll = function() {
    const slots = ['weapon', 'subweapon', 'helmet', 'chest', 'leggings', 'overall', 'boots', 'art1', 'art2', 'art3'];
    slots.forEach(slot => {
        let el = document.getElementById(`slot-${slot}`);
        if (!el) return;
        let item = window.equippedSlots[slot];

        if ((slot === 'chest' || slot === 'leggings') && window.equippedSlots.overall) {
            el.className = "slots-card locked"; el.innerHTML = `⚙️ LOCKED BY OVERALL`; el.style.background = ""; el.style.borderColor = ""; el.style.boxShadow = "";
            return;
        }
        if (slot === 'overall' && (window.equippedSlots.chest || window.equippedSlots.leggings)) {
            el.className = "slots-card locked"; el.innerHTML = `⚙️ LOCKED BY PIECE GEAR`; el.style.background = ""; el.style.borderColor = ""; el.style.boxShadow = "";
            return;
        }

        if (item) {
            let isArt = slot.startsWith("art"); el.className = isArt ? "slots-card artifact-slot equipped" : "slots-card equipped";
            let color = window.getTierColor(item.statsRolled); el.style.borderColor = color;

            let uniqueStyle = window.getUniqueItemStyle(item);
            if (uniqueStyle) {
                el.style.background = uniqueStyle.bg; el.style.borderColor = uniqueStyle.border;
                el.style.boxShadow = `inset 0 0 8px ${uniqueStyle.shadow}, 0 0 10px ${uniqueStyle.glow}`;
            } else {
                el.style.background = ""; el.style.boxShadow = "";
            }

            let tierLabel = item.statsRolled === "UNIQUE" ? "UNIQUE" : `${item.statsRolled}★ ${window.getTierName(item.statsRolled)}`;
            let temperTag = item.temperLevel > 0 ? ` <span style="color:#2ecc71;">[+${item.temperLevel}]</span>` : "";
            let lockTag = item.locked ? " 🔒" : "";

            if (isArt) {
                el.innerHTML = `<strong style="font-size:10px; color:#1abc9c;">${item.name}${lockTag}</strong><br><span style="font-size:8px;color:#aaa;line-height:1;">${item.desc}</span><button class="btn-action un" style="margin-top:2px;padding:1px 3px;" onclick="window.unequipItem('${slot}')">Remove</button>`;
            } else {
                let s = [];
                if (item.atk > 0) s.push(`⚔️${item.atk}`); if (item.maxHp > 0) s.push(`❤️${item.maxHp}`); if (item.def > 0) s.push(`🛡️${item.def}`);
                if (item.moveSpeed > 0) s.push(`👟${item.moveSpeed}`); if (item.critChance > 0) s.push(`✨${Math.floor(item.critChance*100)}%`);
                if (item.critDamage > 0) s.push(`💥${Math.floor(item.critDamage*100)}%`); if (item.block > 0) s.push(`🛡️${Math.floor(item.block*100)}%`);
                if (item.parry > 0) s.push(`⚡${Math.floor(item.parry*100)}%`);
                if (item.str > 0) s.push(`💪S:${item.str}`); if (item.dex > 0) s.push(`🎯D:${item.dex}`); if (item.int > 0) s.push(`🧠I:${item.int}`);

                let setLabelHtml = "";
                let setName = window.getItemSetName(item);
                if (setName) {
                    let matchingCount = 0; const setSlots = ["weapon", "subweapon", "helmet", "chest", "leggings", "overall", "boots"];
                    let overallAdoptedSet = null;
                    if (window.equippedSlots.overall) {
                        overallAdoptedSet = (window.equippedSlots.helmet && window.getItemSetName(window.equippedSlots.helmet)) ||
                                            (window.equippedSlots.boots && window.getItemSetName(window.equippedSlots.boots)) ||
                                            (window.equippedSlots.weapon && window.getItemSetName(window.equippedSlots.weapon)) || null;
                    }
                    setSlots.forEach(sKey => {
                        let eqItem = window.equippedSlots[sKey];
                        if (eqItem) {
                            let eqSetName = window.getItemSetName(eqItem);
                            if (sKey === "overall" && overallAdoptedSet) eqSetName = overallAdoptedSet;
                            if (eqSetName === setName) matchingCount += (sKey === "overall" ? 2 : 1);
                        }
                    });
                    if (matchingCount >= 2) {
                        let displayCount = Math.min(3, matchingCount);
                        setLabelHtml = `<div style="font-size:8px; color:#2ecc71; font-weight:bold; margin-top:2px; text-transform:uppercase; letter-spacing:0.5px;">✨ ${setName} Set (${displayCount}/3)</div>`;
                    }
                }
                el.innerHTML = `<strong style="font-size:10px;">${item.name}${temperTag}${lockTag}</strong><div style="font-size:8px; color:${color}; font-weight:bold; margin:2px 0;">${tierLabel}</div>${setLabelHtml}<div style="font-size:9px;color:#bbb; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${s.join(" ")}">${s.join(" ")}</div><button class="btn-action un" style="margin-top:2px;padding:1px 3px;" onclick="window.unequipItem('${slot}')">Remove</button>`;
            }
        } else {
            el.className = "slots-card"; el.innerHTML = `<i>[Empty ${slot.toUpperCase()}]</i>`; el.style.background = ""; el.style.borderColor = ""; el.style.boxShadow = "";
        }
    });
};

window.renderInventory = function() {
    let maxBag = window.getMaxBagSlots();

    // 1. Equip Sack
    let eqBox = document.getElementById('bag-equip');
    if (eqBox) {
        if (window.inventory.EQUIP.length === 0) { eqBox.innerHTML = "<div style='color:#666;text-align:center;padding-top:40px;'>No equipment in sack.</div>"; }
        else {
            eqBox.innerHTML = window.inventory.EQUIP.map(item => {
                let nameColor = window.getTierColor(item.statsRolled); let tierStr = item.statsRolled === "UNIQUE" ? "UNIQUE" : `${item.statsRolled}★ ${window.getTierName(item.statsRolled)}`;
                let temperTag = item.temperLevel > 0 ? ` <span style="color:#2ecc71;">[+${item.temperLevel}]</span>` : "";
                let lockTag = item.locked ? " 🔒" : "";
                let lockBg = item.locked ? "#e74c3c" : "#7f8c8d";
                let lockIcon = item.locked ? "🔒" : "🔓";
                let typeText = item.type.toUpperCase();
                if (item.type === "subweapon" && item.subType) { typeText = `${item.type.toUpperCase()} (${item.subType.toUpperCase()})`; }
                let comparisonBadge = window.getComparisonDeltaBadge(item);
                let reqLvl = Math.max(1, ((item.stageLevel || 1) - 1) * 5 - (window.playerStats.prestigeCount || 0) * 2);
                let lockWarning = ""; let disabledAttr = "";
                if (window.playerStats.level < reqLvl) {
                    lockWarning = ` <span style="color:#e74c3c; font-weight:bold; font-size:10px;">[Req. Lv ${reqLvl}]</span>`;
                    disabledAttr = "disabled style='opacity:0.5; cursor:not-allowed;'";
                }
                let details = `<span style="font-size:10px;color:#aaa;">Slot: ${typeText} | <span style="color:${nameColor};font-weight:bold;">${tierStr}</span></span>${lockWarning}`;
                let uniqueStyle = window.getUniqueItemStyle(item);
                let uniqueStyleStr = uniqueStyle ? `style="background: ${uniqueStyle.bg}; border: 1px solid ${uniqueStyle.border}; box-shadow: inset 0 0 6px ${uniqueStyle.shadow}, 0 0 8px ${uniqueStyle.glow};"` : "";

                return `<div class="bag-item" ${uniqueStyleStr} onmouseenter="window.showInventoryTooltip(event, ${item.id})" ontouchstart="window.showInventoryTooltip(event, ${item.id})" onmouseleave="window.hideTooltip()">
                    <div><strong style="color:${nameColor};">${item.name}${temperTag}${lockTag}</strong>${comparisonBadge}<br>${details}</div>
                    <div style="position:relative; z-index:10; white-space:nowrap;">
                        <button class="btn-action" ${disabledAttr} onclick="window.equipItem(${item.id})">Equip</button>
                        <button class="btn-action" style="background:${lockBg}; margin-left:2px;" onclick="window.toggleLock(${item.id})">${lockIcon}</button>
                        <button class="btn-action un" style="margin-left:12px;" onclick="window.salvageItem(${item.id})">Salvage</button>
                    </div>
                </div>`;
            }).join("");
        }
    }

    // 2. Artifact Sack
    let artBox = document.getElementById('bag-art');
    if (artBox) {
        if (window.inventory.ARTIFACT.length === 0) { artBox.innerHTML = "<div style='color:#666;text-align:center;padding-top:40px;'>No artifacts in sack.</div>"; }
        else {
            artBox.innerHTML = window.inventory.ARTIFACT.map(item => {
                let nameColor = window.getTierColor(item.statsRolled);
                let lockTag = item.locked ? " 🔒" : "";
                let lockBg = item.locked ? "#e74c3c" : "#7f8c8d";
                let lockIcon = item.locked ? "🔒" : "🔓";
                let reqLvl = Math.max(1, ((item.stageLevel || 1) - 1) * 5 - (window.playerStats.prestigeCount || 0) * 2);
                let lockWarning = ""; let disabledAttr = "";
                if (window.playerStats.level < reqLvl) {
                    lockWarning = ` <span style="color:#e74c3c; font-weight:bold; font-size:10px;">[Req. Lv ${reqLvl}]</span>`;
                    disabledAttr = "disabled style='opacity:0.5; cursor:not-allowed;'";
                }
                let details = `<span style="font-size:10px;color:#d2b4de;font-weight:bold;">Trait: ${item.desc}</span>${lockWarning}`;
                return `<div class="bag-item" onmouseenter="window.showInventoryTooltip(event, ${item.id})" ontouchstart="window.showInventoryTooltip(event, ${item.id})" onmouseleave="window.hideTooltip()">
                    <div><strong style="color:${nameColor};">${item.name}${lockTag}</strong><br>${details}</div>
                    <div style="position:relative; z-index:10; white-space:nowrap;">
                        <button class="btn-action" ${disabledAttr} onclick="window.equipItem(${item.id})">Equip</button>
                        <button class="btn-action" style="background:${lockBg}; margin-left:2px;" onclick="window.toggleLock(${item.id})">${lockIcon}</button>
                        <button class="btn-action un" style="margin-left:12px;" onclick="window.salvageItem(${item.id})">Salvage</button>
                    </div>
                </div>`;
            }).join("");
        }
    }

    // 3. Materials Sacks
        const getEtcIconHtml = (key) => {
            let bg = "rgba(170, 170, 170, 0.12)";
            let border = "#444";
            let icon = "📦";

            if (key === "Eridium Shard") { bg = "rgba(155, 89, 182, 0.25)"; border = "#9b59b6"; icon = "🔮"; }
            else if (key === "Gacha Key") { bg = "rgba(241, 196, 15, 0.25)"; border = "#f1c40f"; icon = "🔑"; }
            else if (key === "Ancient Core") { bg = "rgba(231, 76, 60, 0.25)"; border = "#e74c3c"; icon = "🔴"; }
            else if (key === "Overlord's Sigil") { bg = "rgba(26, 188, 156, 0.25)"; border = "#1abc9c"; icon = "🔱"; }
            else if (key === "Astral Essence") { bg = "rgba(142, 68, 173, 0.25)"; border = "#8e44ad"; icon = "🌌"; }
            else if (key === "Mythic Scrap") { bg = "rgba(231, 76, 60, 0.25)"; border = "#e74c3c"; icon = "🟥"; }
            else if (key === "Legendary Scrap") { bg = "rgba(241, 196, 15, 0.25)"; border = "#f1c40f"; icon = "🟨"; }
            else if (key === "Epic Scrap") { bg = "rgba(230, 126, 34, 0.25)"; border = "#e67e22"; icon = "🟧"; }
            else if (key === "Magic Scrap") { bg = "rgba(155, 89, 182, 0.25)"; border = "#9b59b6"; icon = "🟪"; }
            else if (key === "Rare Scrap") { bg = "rgba(52, 152, 219, 0.25)"; border = "#3498db"; icon = "🟦"; }
            else if (key === "Luminous Soul") { bg = "rgba(255, 182, 193, 0.25)"; border = "#ffb6c1"; icon = "💖"; }
            else if (key === "Monster Soul") { bg = "rgba(170, 170, 170, 0.25)"; border = "#888"; icon = "💀"; }
            else if (key === "Catalyst Core") { bg = "rgba(46, 204, 113, 0.25)"; border = "#2ecc71"; icon = "💚"; }

            return `<span style="background: ${bg}; border: 1px solid ${border}; border-radius: 4px; padding: 4px; margin-right: 12px; font-size: 14px; display: inline-flex; align-items: center; justify-content: center; width: 32px; height: 32px; box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.6);">${icon}</span>`;
        };

        const getUseIconHtml = (key) => {
            let bg = "rgba(170, 170, 170, 0.12)";
            let border = "#444";
            let icon = "🍶";

            if (key === "SP Reset Scroll") { bg = "rgba(155, 89, 182, 0.25)"; border = "#9b59b6"; icon = "📜"; }
            else if (key === "PP Reset Scroll") { bg = "rgba(230, 126, 34, 0.25)"; border = "#e67e22"; icon = "📜"; }
            else if (key.includes("Attack")) { bg = "rgba(46, 204, 113, 0.25)"; border = "#2ecc71"; icon = "🧪"; }
            else if (key.includes("Vitality")) { bg = "rgba(231, 76, 60, 0.25)"; border = "#e74c3c"; icon = "🧪"; }
            else if (key.includes("Armored")) { bg = "rgba(52, 152, 219, 0.25)"; border = "#3498db"; icon = "🧪"; }
            else if (key.includes("Haste")) { bg = "rgba(241, 196, 15, 0.25)"; border = "#f1c40f"; icon = "🧪"; }

            return `<span style="background: ${bg}; border: 1px solid ${border}; border-radius: 4px; padding: 4px; margin-right: 12px; font-size: 14px; display: inline-flex; align-items: center; justify-content: center; width: 32px; height: 32px; box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.6);">${icon}</span>`;
        };

        let etcBox = document.getElementById('bag-etc');
                let etcKeys = Object.keys(window.inventory.ETC).filter(k => window.inventory.ETC[k] > 0);
                if (etcKeys.length === 0) { etcBox.innerHTML = "<div style='color:#666;text-align:center;padding-top:40px;'>No materials collected.</div>"; }
                else {
                    etcBox.innerHTML = etcKeys.map(key => {
                        let escapedKey = key.replace(/'/g, "\\'");
                        return `
                        <div class="bag-item" style="cursor:help; display:flex; align-items:center; justify-content:space-between; padding:6px 12px;" onmouseenter="window.showEtcTooltip(event, '${escapedKey}')" ontouchstart="window.showEtcTooltip(event, '${escapedKey}')" onmouseleave="window.hideTooltip()">
                            <div style="display:flex; align-items:center;">
                                ${getEtcIconHtml(key)}
                                <span>${key}</span>
                            </div>
                            <strong>x${window.inventory.ETC[key]}</strong>
                        </div>
                        `;
                    }).join("");
                }

        // 4. Usable Potions Sack
        let useBox = document.getElementById('bag-use');
        if (useBox) {
            let useKeys = Object.keys(window.inventory.USE || {}).filter(k => window.inventory.USE[k] > 0);
            if (useKeys.length === 0) { useBox.innerHTML = "<div style='color:#666;text-align:center;padding-top:40px;'>No usable items. Purchase potions/scrolls at the Market!</div>"; }
            else {
                useBox.innerHTML = useKeys.map(key => {
                    let count = window.inventory.USE[key];
                    return `
                        <div class="bag-item" style="cursor:help; display:flex; align-items:center; justify-content:space-between; padding:6px 12px;" onmouseenter="window.showUseTooltip(event, '${key}')" ontouchstart="window.showUseTooltip(event, '${key}')" onmouseleave="window.hideTooltip()">
                            <div style="display:flex; align-items:center;">
                                ${getUseIconHtml(key)}
                                <div><strong>${key}</strong><br><span style="font-size:10px; color:#aaa;">Qty: ${count}</span></div>
                            </div>
                            <div style="position:relative; z-index:10;"><button class="btn-action" style="background:#2ecc71;" onclick="window.useItem('${key}')">Consume</button></div>
                        </div>
                    `;
                }).join("");
            }
        }
    };

window.hideTooltip = function() {
    ['game-tooltip', 'etc-tooltip', 'stat-tooltip', 'log-item-tooltip'].forEach(id => {
        let el = document.getElementById(id); if (el) el.style.display = 'none';
    });
    window.activeStatTooltip = null;
};

// Calculates optimal tooltip placement to prevent clipping off the visible browser viewport
window.positionTooltip = function(e, tt) {
    let container = document.getElementById('game-container').getBoundingClientRect();
    let clientX = e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
    let clientY = e.clientY || (e.touches && e.touches[0] ? e.touches[0].clientY : 0);

    let ttWidth = tt.offsetWidth;
    let ttHeight = tt.offsetHeight;

    // Initialize placement 15px down and right of the cursor (relative to the viewport)
    let vx = clientX + 15;
    let vy = clientY + 15;

    // Shift to the left of the cursor if spilling past the visible right edge of the viewport
    if (vx + ttWidth > window.innerWidth) {
        vx = clientX - ttWidth - 15;
    }
    // Shift above the cursor if spilling past the visible bottom edge of the viewport
    if (vy + ttHeight > window.innerHeight) {
        vy = clientY - ttHeight - 15;
    }

    // Clamp values so they never go negative past top or left edges of the screen
    if (vx < 5) vx = 5;
    if (vy < 5) vy = 5;

    // Convert viewport-relative coordinates to game-container absolute styles
    let x = vx - container.left;
    let y = vy - container.top;

    tt.style.left = x + "px";
    tt.style.top = y + "px";
};

window.showInventoryTooltip = function(e, itemId) {
    e.stopPropagation();
    let item = window.inventory.EQUIP.find(i => i.id === itemId) || (window.inventory.ARTIFACT && window.inventory.ARTIFACT.find(i => i.id === itemId));
    if (!item) return;
    let tt = document.getElementById('game-tooltip'); tt.innerHTML = window.buildGeneralTooltipHtml(item, true);
    tt.style.borderColor = window.getTierColor(item.statsRolled); tt.style.display = "block";
    window.positionTooltip(e, tt);
};

// Generates and positions item comparison tooltips inside the Blacksmith Forge interface
window.showForgeTooltip = function(e, itemId) {
    e.stopPropagation();
    let item = window.inventory.EQUIP.find(i => i.id === itemId) || (window.inventory.ARTIFACT && window.inventory.ARTIFACT.find(i => i.id === itemId));
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
    let tt = document.getElementById('game-tooltip');
    tt.innerHTML = window.buildGeneralTooltipHtml(item, false);
    tt.style.borderColor = window.getTierColor(item.statsRolled);
    tt.style.display = "block";
    window.positionTooltip(e, tt);
};

window.showSlotTooltip = function(e, slot) {
    e.stopPropagation();
    let item = window.equippedSlots[slot];
    if (!item) return;
    item.isEquippedSlot = slot;
    let tt = document.getElementById('game-tooltip'); tt.innerHTML = window.buildGeneralTooltipHtml(item, false);
    tt.style.borderColor = window.getTierColor(item.statsRolled); tt.style.display = "block";
    window.positionTooltip(e, tt);
};

window.buildGeneralTooltipHtml = function(item, isBagItem = false) {
    let eq = isBagItem ? getEquippedItemForComparison(item.type) : null;
    let html = "";
    if (eq && eq.id !== item.id) {
        html += `<div class="tooltip-card compare-border">${window.generateItemCardHtml(eq, null, true)}</div>`;
        html += `<div class="tooltip-card">${window.generateItemCardHtml(item, eq, false)}</div>`;
    } else {
        let isEquipped = isBagItem ? false : (item.isEquippedSlot != null);
        html += `<div class="tooltip-card">${window.generateItemCardHtml(item, null, isEquipped)}</div>`;
    }
    return `<div class="tooltip-flex-container">${html}</div>`;
};

window.generateItemCardHtml = function(item, compareItem = null, isEquipped = false) {
    if (!item) return "";
    let html = "";
    let badge = isEquipped ? `<div style="background:#c0392b; color:white; text-align:center; font-weight:bold; padding:3px; margin-bottom:8px; border-radius:3px; font-size:10px; letter-spacing: 1px;">CURRENTLY EQUIPPED</div>` : ``;
    html += badge;

    let isUnique = item.isUniqueStaff || item.isUniqueSword || item.isUniqueSingularity || item.isUniqueMaelstrom || item.isUniqueAegis || item.isUniqueWatch || item.isUniqueChronicle || item.isUniqueWarpCore || item.isUniqueTempest;
    let uniqueStyle = window.getUniqueItemStyle(item);
    let runicBadge = isUnique ? `<div style="color: #f1c40f; font-family: monospace; font-weight: 800; font-size: 10px; margin-bottom: 6px; letter-spacing: 2px; text-transform: uppercase; text-shadow: 0 0 10px rgba(241, 196, 15, 0.5);">⚡ UBER UNIQUE ⚡</div>` : ``;

    let tierColor = window.getTierColor(item.statsRolled);
    let titleColor = item.type === "artifact" ? "#1abc9c" : tierColor;
    let labelDisplay = item.type.toUpperCase();
    if (item.type === "subweapon" && item.subType) {
        labelDisplay = `SUBWEAPON (${item.subType.toUpperCase()})`;
    }
    let reqLvl = Math.max(1, ((item.stageLevel || 1) - 1) * 5 - (window.playerStats.prestigeCount || 0) * 2);
    let subtitle = item.type === "artifact" ? "Unique Boss Trophy Slot" : `${labelDisplay} | <span style="color:${tierColor}; font-weight:bold;">${tierStrDisplay(item)}</span>`;
    if (reqLvl > 1) {
        let reqColor = window.playerStats.level >= reqLvl ? "#2ecc71" : "#e74c3c";
        subtitle += `<br><span style="color:${reqColor}; font-weight:bold;">Required Level: ${reqLvl}</span>`;
    }
    let temperTag = item.temperLevel > 0 ? ` <span style="color:#2ecc71;">[+${item.temperLevel}]</span>` : "";
    let lockTag = item.locked ? " 🔒" : "";

    html += `<div class="tt-title" style="color:${isUnique ? '#1abc9c' : titleColor}; white-space:normal;">${item.name}${temperTag}${lockTag}</div>`;
    html += `<div class="tt-subtitle">${subtitle}</div>`;

    if (item.id !== "dummy" && item.type === "subweapon") {
        if (item.subType === "shield") {
            html += `<div style="color:#3498db; font-size:10px; font-weight:bold; margin-bottom:8px; border: 1px dashed #3498db; padding: 4px; border-radius:3px; background: rgba(52, 152, 219, 0.05); text-align: center; white-space:normal; line-height:1.3;">🛡️ BULWARK PASSIVE:<br>Grants +12% Defense multiplier and raises Block Rate Cap to 30% (+40% if Titan's Grip equipped).</div>`;
        } else if (item.subType === "dagger") {
            html += `<div style="color:#e74c3c; font-size:10px; font-weight:bold; margin-bottom:8px; border: 1px dashed #e74c3c; padding: 4px; border-radius:3px; background: rgba(231, 76, 60, 0.05); text-align: center; white-space:normal; line-height:1.3;">🗡️ ELUSIVE PARRIES PASSIVE:<br>Raises Parry Cap to 35% (+45% if Titan's Grip equipped). Successful parries slash the enemy's next hit by 50%.</div>`;
        } else if (item.subType === "tome") {
            html += `<div style="color:#9b59b6; font-size:10px; font-weight:bold; margin-bottom:8px; border: 1px dashed #9b59b6; padding: 4px; border-radius:3px; background: rgba(155, 89, 182, 0.05); text-align: center; white-space:normal; line-height:1.3;">🔮 ARCANE SHIELD PASSIVE:<br>Absorbs 20% of all incoming damage before defense calculations. Scales with INT up to a 35% absorption cap.</div>`;
        }
    }

    // --- DIABLO 4 STYLE BASE STATS SECTION ---
    if (item.id !== "dummy" && item.type !== "artifact") {
        let tempers = item.temperLevel || 0;
        let multiplier = 1 + (tempers * 0.04);
        let baseStats = [];

        if (item.baseAtk > 0) {
            let baseAtkVal = Math.round(item.baseAtk * multiplier);
            baseStats.push({ label: "Weapon Damage", val: baseAtkVal, icon: "⚔️" });
        }
        if (item.baseDef > 0) {
            let baseDefVal = Math.round(item.baseDef * multiplier);
            baseStats.push({ label: "Armor", val: baseDefVal, icon: "🛡️" });
        }
        if (item.baseMaxHp > 0) {
            let baseMaxHpVal = Math.round(item.baseMaxHp * multiplier);
            baseStats.push({ label: "Max Life", val: baseMaxHpVal, icon: "❤️" });
        }
        if (item.baseMoveSpeed > 0) {
            let baseMoveSpeedVal = Math.round(item.baseMoveSpeed * multiplier);
            baseStats.push({ label: "Speed", val: baseMoveSpeedVal, icon: "👟" });
        }
        if (item.baseBlock > 0) {
            let baseBlockVal = Math.round(item.baseBlock * multiplier * 100);
            baseStats.push({ label: "Block Rate", val: baseBlockVal + "%", icon: "🛡️" });
        }
        if (item.baseParry > 0) {
            let baseParryVal = Math.round(item.baseParry * multiplier * 100);
            baseStats.push({ label: "Parry Rate", val: baseParryVal + "%", icon: "⚡" });
        }
        if (item.baseInt > 0) {
            let baseIntVal = Math.round(item.baseInt * multiplier);
            baseStats.push({ label: "Intelligence", val: baseIntVal, icon: "🧠" });
        }

        if (baseStats.length > 0) {
            html += `<div style="background: rgba(255, 255, 255, 0.02); border: 1px solid #222; border-radius: 4px; padding: 6px; margin: 8px 0; text-align: center;">`;
            html += `<div style="font-size: 9px; color: #888; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 4px; font-weight: bold;">Base Stats</div>`;
            baseStats.forEach(b => {
                html += `<div style="font-size: 13px; font-weight: bold; color: #f5f6fa; margin: 1px 0;">${b.icon} ${b.val} ${b.label}</div>`;
            });
            html += `</div>`;
        }
    }

    if (item.id !== "dummy" && item.type === "artifact") {
        html += `<div class="tt-stat-line" style="color:#d2b4de; margin-bottom: 6px; white-space:normal;">• Effect: ${item.desc}</div>`;
        html += `<div class="tt-trait">${item.breakdown}</div>`;
        html += `<div style="font-weight:bold; color:#aaa; margin-top:8px; margin-bottom:4px; border-bottom: 1px solid #333; padding-bottom: 2px;">Bonus Parameters:</div>`;
    } else if (item.id !== "dummy") {
        if (isUnique && item.desc) {
            html += `<div class="tt-stat-line" style="color:#ffeaa7; margin-bottom: 10px; white-space:normal; line-height:1.4; padding:6px; border:1px dashed #1abc9c; background:rgba(0,0,0,0.4); border-radius:4px;"><strong>• Unique Effect:</strong> ${item.desc}</div>`;
        }
        if (item.totalEnchants > 0) {
            html += `<div style="color:#9b59b6; font-size:10px; font-weight:bold; margin-bottom:6px; letter-spacing:0.5px; border: 1px dashed #9b59b6; padding: 3px; border-radius: 3px; background: rgba(155, 89, 182, 0.05); text-align: center;">🔮 MYSTICAL ENCHANTS: ${item.totalEnchants} ACTIVE</div>`;
        }
        html += `<div style="font-weight:bold; color:#aaa; margin-bottom:4px; border-bottom: 1px solid #333; padding-bottom: 2px;">Affixes:</div>`;
    }

    // --- DIABLO 4 STYLE EXPLICIT AFFIXES SECTION ---
    if (item.id !== "dummy") {
        let affixes = [];
        let tempers = item.temperLevel || 0;
        let multiplier = 1 + (tempers * 0.04);

        const statsKeys = [
            { key: "atk", icon: "⚔️", label: "Attack", baseKey: "baseAtk" },
            { key: "maxHp", icon: "❤️", label: "Max HP", baseKey: "baseMaxHp" },
            { key: "def", icon: "🛡️", label: "Defense", baseKey: "baseDef" },
            { key: "moveSpeed", icon: "👟", label: "Move Speed", baseKey: "baseMoveSpeed" },
            { key: "str", icon: "💪", label: "STR", baseKey: "baseStr" },
            { key: "dex", icon: "🎯", label: "DEX", baseKey: "baseDex" },
            { key: "int", icon: "🧠", label: "INT", baseKey: "baseInt" },
            { key: "critChance", icon: "✨", label: "Crit Chance", isPct: true },
            { key: "critDamage", icon: "💥", label: "Crit Multi", isPct: true },
            { key: "block", icon: "🛡️", label: "Block Rate", isPct: true, baseKey: "baseBlock" },
            { key: "parry", icon: "⚡", label: "Parry Rate", isPct: true, baseKey: "baseParry" },
            { key: "activeAttackSpeed", icon: "⚡", label: "Active Atk Spd", isPct: true, baseKey: "baseActiveSpeed" },
            { key: "idleAttackSpeed", icon: "⏱️", label: "Idle Atk Spd", isPct: true, baseKey: "baseIdleSpeed" },
            { key: "dropRate", icon: "🍀", label: "Drop Rate", isPct: true },
            { key: "quality", icon: "💎", label: "Drop Quality", isPct: true },
            { key: "goldMulti", icon: "🟡", label: "Gold Multi", isPct: true },
            { key: "rareSpawn", icon: "✨", label: "Rare Spawn", isPct: true, isDoublePct: true },
            { key: "fairySpawn", icon: "🧚", label: "Fairy Spawn", isPct: true }
        ];

        statsKeys.forEach(s => {
            let totalVal = item[s.key] || 0;
            let baseVal = (item.type !== "artifact" && s.baseKey) ? (item[s.baseKey] || 0) : 0;
            let baseScaled = s.isPct ? (baseVal * multiplier) : Math.round(baseVal * multiplier);
            let affixVal = totalVal - baseScaled;

            if (affixVal > 0.0001 || (s.key === "activeAttackSpeed" || s.key === "idleAttackSpeed") && affixVal > 0) {
                let displayVal = "";
                if (s.isDoublePct) {
                    displayVal = `+${(affixVal * 100).toFixed(2)}%`;
                } else if (s.isPct) {
                    displayVal = `+${Math.floor(affixVal * 100)}%`;
                } else {
                    displayVal = `+${Math.round(affixVal).toLocaleString()}`;
                }

                let rangeStr = window.formatStatRangeStr ? window.formatStatRangeStr(item, s.key, s.isPct || s.isDoublePct) : "";
                affixes.push(`<div class="tt-stat-line" style="color:${s.key === "critChance" || s.key === "critDamage" ? '#e67e22' : '#ecf0f1'};">• ${s.icon} ${s.label}: ${displayVal}${window.getStatEnchantSuffix ? window.getStatEnchantSuffix(item, s.key) : ""}${rangeStr}</div>`);
            }
        });

        if (affixes.length > 0) {
            html += affixes.join("");
        } else {
            html += `<div class="tt-stat-line" style="color:#7f8c8d; font-style:italic;">No extra affixes.</div>`;
        }

        let setName = window.getItemSetName ? window.getItemSetName(item) : null;
        if (setName && window.SET_DEFINITIONS[setName]) {
            let setDef = window.SET_DEFINITIONS[setName];
            let currentEquippedCount = 0;
            const eligibleSetSlots = ["weapon", "subweapon", "helmet", "chest", "leggings", "overall", "boots"];

            let overallAdoptedSet = null;
            if (window.equippedSlots.overall) {
                overallAdoptedSet = (window.equippedSlots.helmet && window.getItemSetName(window.equippedSlots.helmet)) ||
                                    (window.equippedSlots.boots && window.getItemSetName(window.equippedSlots.boots)) ||
                                    (window.equippedSlots.weapon && window.getItemSetName(window.equippedSlots.weapon)) || null;
            }

            eligibleSetSlots.forEach(slot => {
                let eqItem = window.equippedSlots[slot];
                if (eqItem) {
                    let eqSetName = window.getItemSetName(eqItem);
                    if (slot === "overall" && overallAdoptedSet) eqSetName = overallAdoptedSet;
                    if (eqSetName === setName) currentEquippedCount += (slot === "overall" ? 2 : 1);
                }
            });

            html += `<div style="margin-top:10px; padding-top:6px; border-top:1px dashed #555;">`;
            let displayCount = Math.min(3, currentEquippedCount);
            html += `<div style="font-weight:bold; color:#f1c40f; font-size:10px;">🌟 SET: ${setDef.name} (${displayCount}/3 equipped)</div>`;
            setDef.bonuses.forEach(b => {
                let activeColor = currentEquippedCount >= b.count ? "#2ecc71" : "#7f8c8d";
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
            { key: "atk", icon: "⚔️" }, { key: "maxHp", icon: "❤️" }, { key: "def", icon: "🛡️" }, { key: "moveSpeed", icon: "👟" },
            { key: "str", icon: "💪" }, { key: "dex", icon: "🎯" }, { key: "int", icon: "🧠" },
            { key: "critChance", isPct: true, icon: "✨" }, { key: "critDamage", isPct: true, icon: "💥" },
            { key: "block", isPct: true, icon: "🛡️" }, { key: "parry", isPct: true, icon: "⚡" },
            { key: "activeAttackSpeed", icon: "⚡", inverseGood: true }, { key: "idleAttackSpeed", icon: "⏱️", inverseGood: true }
        ];

        statsList.forEach(s => {
            let val = item[s.key] || 0;
            let eqVal = compareItem[s.key] || 0;
            let diff = val - eqVal;
            if (Math.abs(diff) > 0.001) {
                hasDiffs = true;
                let isPct = s.isPct || ["activeAttackSpeed", "idleAttackSpeed"].includes(s.key);
                let isPositive = s.inverseGood ? diff < 0 : diff > 0;
                let color = isPositive ? "#2ecc71" : "#e74c3c";
                let sign = diff > 0 ? "+" : "";
                let diffStr = isPct ? sign + Math.round(diff * 100) + "%" : sign + Math.round(diff).toLocaleString();
                let emoji = s.icon ? s.icon + " " : "";
                let sLabel = window.getStatLabel(s.key);

                html += `<div class="tt-stat-line" style="color:${color}; font-weight:bold; white-space:nowrap;">• ${emoji}${sLabel}: ${diffStr}</div>`;
            }
        });
        if (!hasDiffs) html += `<div class="tt-stat-line" style="color:#7f8c8d; font-style:italic;">No net difference.</div>`;
    }

    if (uniqueStyle) {
        if (uniqueStyle.lore) {
            html += `<div style="margin-top: 10px; padding-top: 8px; border-top: 1px dashed #555; color: #ffb6c1; font-size: 9.5px; line-height: 1.35; font-style: italic; white-space: normal;"><i>${uniqueStyle.lore}</i></div>`;
        }
        html = `<div style="background: ${uniqueStyle.bg}; border: 2px solid ${uniqueStyle.border}; box-shadow: inset 0 0 20px ${uniqueStyle.shadow}, 0 0 15px ${uniqueStyle.glow}; padding: 12px; margin: -10px; border-radius: 4px; box-sizing: border-box; min-width: 250px;">
            ${runicBadge}
            ${html}
        </div>`;
    }

    return html;
};

function tierStrDisplay(item) {
    return item.statsRolled === "UNIQUE" ? "UNIQUE" : `${item.statsRolled}★ ${window.getTierName(item.statsRolled)}`;
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
    if (type === "overall") {
        if (window.equippedSlots.overall) return window.equippedSlots.overall;
        return getCombinedEquippedTorso();
    }
    if (type === "chest" || type === "leggings") {
        if (window.equippedSlots.overall) return window.equippedSlots.overall;
        return window.equippedSlots[type];
    }
    return window.equippedSlots[type];
}

function getCombinedEquippedTorso() {
    let chest = window.equippedSlots.chest; let leggings = window.equippedSlots.leggings;
    if (!chest && !leggings) return null;
    let maxStars = Math.max(chest ? (chest.statsRolled === "UNIQUE" ? 5 : (chest.statsRolled || 0)) : 0, leggings ? (leggings.statsRolled === "UNIQUE" ? 5 : (leggings.statsRolled || 0)) : 0);
    return {
        id: "virtual_combined", name: "Equipped Chest + Leggings", type: "overall", statsRolled: maxStars, temperLevel: 0, stageLevel: 1,
        atk: (chest?.atk || 0) + (leggings?.atk || 0), maxHp: (chest?.maxHp || 0) + (leggings?.maxHp || 0), def: (chest?.def || 0) + (leggings?.def || 0),
        moveSpeed: (chest?.moveSpeed || 0) + (leggings?.moveSpeed || 0), critChance: (chest?.critChance || 0) + (leggings?.critChance || 0),
        critDamage: (chest?.critDamage || 0) + (leggings?.critDamage || 0), block: (chest?.block || 0) + (leggings?.block || 0), parry: (chest?.parry || 0) + (leggings?.parry || 0),
        activeAttackSpeed: (chest?.activeAttackSpeed || 0) + (leggings?.activeAttackSpeed || 0), idleAttackSpeed: (chest?.idleAttackSpeed || 0) + (leggings?.idleAttackSpeed || 0),
        str: (chest?.str || 0) + (leggings?.str || 0), dex: (chest?.dex || 0) + (leggings?.dex || 0), int: (chest?.int || 0) + (leggings?.int || 0)
    };
}

window.getComparisonDeltaBadge = function(item) {
    if (item.type === "artifact") return "";
    let eq = getEquippedItemForComparison(item.type);
    if (!eq) return ` <span style="color:#2ecc71; font-weight:bold; font-size:9px;">[▲ NEW]</span>`;

    let primaryStat = "atk";
    if (["chest", "leggings", "helmet", "overall"].includes(item.type)) primaryStat = "def";
    else if (item.type === "boots") primaryStat = "moveSpeed";
    else if (item.type === "subweapon") primaryStat = item.subType === "shield" ? "def" : "atk";

    let val = item[primaryStat] || 0; let eqVal = eq[primaryStat] || 0; let diff = val - eqVal;
    if (diff > 0.1) {
        let label = primaryStat === "moveSpeed" ? diff.toFixed(1) : Math.round(diff);
        return ` <span style="color:#2ecc71; font-weight:bold; font-size:9px;">[▲ +${label}]</span>`;
    } else if (diff < -0.1) {
        let label = primaryStat === "moveSpeed" ? Math.abs(diff).toFixed(1) : Math.round(Math.abs(diff));
        return ` <span style="color:#e74c3c; font-weight:bold; font-size:9px;">[▼ -${label}]</span>`;
    }
    return "";
};

window.showEtcTooltip = function(e, keyName) {
    e.stopPropagation();
    let tt = document.getElementById('etc-tooltip');
    let desc = window.etcDex[keyName] || "Unknown material.";

    let color = "#bdc3c7";
    let icon = "📦";

    if (keyName === "Eridium Shard") { color = "#8e44ad"; icon = "🔮"; }
    else if (keyName === "Gacha Key") { color = "#f1c40f"; icon = "🔑"; }
    else if (keyName === "Ancient Core") { color = "#e74c3c"; icon = "🔴"; }
    else if (keyName === "Overlord's Sigil") { color = "#1abc9c"; icon = "🔱"; }
    else if (keyName === "Astral Essence") { color = "#8e44ad"; icon = "🌌"; }
    else if (keyName === "Mythic Scrap") { color = "#e74c3c"; icon = "🟥"; }
    else if (keyName === "Legendary Scrap") { color = "#f1c40f"; icon = "🟨"; }
    else if (keyName === "Epic Scrap") { color = "#e67e22"; icon = "🟧"; }
    else if (keyName === "Magic Scrap") { color = "#9b59b6"; icon = "🟪"; }
    else if (keyName === "Rare Scrap") { color = "#3498db"; icon = "🟦"; }
    else if (keyName === "Luminous Soul") { color = "#ffb6c1"; icon = "💖"; }
    else if (keyName === "Monster Soul") { color = "#888888"; icon = "💀"; }
    else if (keyName === "Catalyst Core") { color = "#2ecc71"; icon = "💚"; }

    tt.innerHTML = `<div style="padding: 10px; width: 220px; box-sizing: border-box;"><div class="tt-title" style="color:${color};">${icon} ${keyName}</div><div style="color:#aaa; font-size:11px; white-space:normal; line-height:1.4;">${desc}</div></div>`;
        tt.style.borderColor = color;
        tt.style.display = "block";
        window.positionTooltip(e, tt);
    };

    // Procedurally refresh Gold Shop items at designated timestamps
    window.refreshMarketShopIfNeeded = function() {
        let now = Date.now();
        if (now >= window.playerStats.shopRefreshTime || window.playerStats.shopItems.length === 0) {
            window.playerStats.shopRefreshTime = now + (30 * 60 * 1000);
            window.playerStats.shopItems = [];

            let peakRunStage = Math.max(window.playerStats.stage, window.playerStats.maxStage || 1);
            let stageScale = Math.floor((peakRunStage - 1) / 10) + 1;
            let types = ["weapon", "subweapon", "helmet", "chest", "leggings", "boots"];

            for (let i = 0; i < 5; i++) {
                let isIOTD = (i === 4);
                let p = window.resolvePlayerStats();
                // Incorporate Merchant Investment (+1% quality multiplier per level) for shop items
                let luckMultiplier = p.qly + ((window.playerStats.shopQLevel || 0) * 0.01);
                let roll = Math.random() * 100;
                let statLinesCount = 0;

                if (isIOTD) {
                    if (roll < (1.0 * luckMultiplier)) statLinesCount = 5;
                    else if (roll < (5.0 * luckMultiplier)) statLinesCount = 4;
                    else if (roll < (20.0 * luckMultiplier)) statLinesCount = 3;
                    else if (roll < (50.0 * luckMultiplier)) statLinesCount = 2;
                    else statLinesCount = 1;
                } else {
                    if (roll < (0.01 * luckMultiplier)) statLinesCount = 5;
                    else if (roll < (0.10 * luckMultiplier)) statLinesCount = 4;
                    else if (roll < (0.50 * luckMultiplier)) statLinesCount = 3;
                    else if (roll < (2.00 * luckMultiplier)) statLinesCount = 2;
                    else if (roll < (10.00 * luckMultiplier)) statLinesCount = 1;
                    else statLinesCount = 0;
                }

                let chosenType = types[Math.floor(Math.random() * types.length)];
                let cost = Math.floor(500 * Math.pow(2.15, stageScale - 1) * Math.pow(2.5, statLinesCount));

                let shopItemData = window.createItemObject(chosenType, statLinesCount, stageScale, isIOTD ? 1 : 0);
                shopItemData.cost = cost;
                shopItemData.purchased = false;
                shopItemData.isIOTD = isIOTD;

                window.playerStats.shopItems.push(shopItemData);
            }
            if (typeof window.saveGame === "function") window.saveGame();
        }
        window.renderMarketShop();
    };

window.showUseTooltip = function(e, keyName) {
    e.stopPropagation();
    let tt = document.getElementById('etc-tooltip');

    let desc = "Consumable item.";
    let color = "#bdc3c7";
    let icon = "🍶";

    if (useDex[keyName]) {
        desc = useDex[keyName].desc;
        color = useDex[keyName].color;
    } else {
        let stockItem = window.MYSTICAL_STOCK.find(item => item.name === keyName);
        if (stockItem) {
            desc = stockItem.desc;
            color = stockItem.color || "#bdc3c7";
        }
    }

    if (keyName === "SP Reset Scroll") { color = "#9b59b6"; icon = "📜"; }
        else if (keyName === "PP Reset Scroll") { color = "#e67e22"; icon = "📜"; }
        else if (keyName.includes("Attack")) { color = "#2ecc71"; icon = "🧪"; }
        else if (keyName.includes("Vitality")) { color = "#e74c3c"; icon = "🧪"; }
        else if (keyName.includes("Armored")) { color = "#3498db"; icon = "🧪"; }
        else if (keyName.includes("Haste")) { color = "#f1c40f"; icon = "🧪"; }

        tt.innerHTML = `<div style="padding: 10px; width: 220px; box-sizing: border-box;"><div class="tt-title" style="color:${color};">${icon} ${keyName}</div><div style="color:#aaa; font-size:11px; white-space:normal; line-height:1.4;">${desc}</div></div>`;
        tt.style.borderColor = color;
        tt.style.display = "block";
        window.positionTooltip(e, tt);
    };

    // --- TAB TRANSITIONS ---

window.switchTab = function(tabId) {
    window.hideTooltip();
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));

    let activeBtn = Array.from(document.querySelectorAll('.tab-btn')).find(b => b.getAttribute('onclick')?.includes(`'${tabId}'`));
    if (activeBtn) activeBtn.classList.add('active');

    let contentEl = document.getElementById('tab-' + tabId);
    if (contentEl) contentEl.classList.add('active');

    if (tabId === 'stats') {
        window.ensureDraftInitialized();
    }
    if (tabId === 'forge') {
        if (typeof window.renderForgeTab === "function") window.renderForgeTab();
    }
    if (tabId === 'market') {
        if (typeof window.refreshMarketShopIfNeeded === "function") window.refreshMarketShopIfNeeded();
        if (typeof window.renderMysticalShop === "function") window.renderMysticalShop();
        if (typeof window.renderGoldUpgrades === "function") window.renderGoldUpgrades();
    }
    if (tabId === 'prestige') {
        if (typeof window.renderPrestigeTab === "function") window.renderPrestigeTab();
    }
    window.updateUI();
};

window.switchSubTab = function(subTabId) {
    window.state.currentSubTab = subTabId;
    document.querySelectorAll('.sub-tab-btn').forEach(btn => btn.classList.remove('active'));
    let activeBtn = document.getElementById('sub-tab-' + subTabId.toLowerCase());
    if (activeBtn) activeBtn.classList.add('active');

    document.getElementById('bag-equip').style.display = subTabId === 'EQUIP' ? 'block' : 'none';
    document.getElementById('bag-art').style.display = subTabId === 'ART' ? 'block' : 'none';
    document.getElementById('bag-etc').style.display = subTabId === 'ETC' ? 'block' : 'none';
    document.getElementById('bag-use').style.display = subTabId === 'USE' ? 'block' : 'none';
    window.updateUI();
};

// --- LOG SYSTEM BOX ---

window.toggleLogPanel = function() {
    let container = document.getElementById('log-panel-container');
    if (container) {
        container.style.display = container.style.display === 'none' ? 'block' : 'none';
    }
};

// Keydown listener tracking the 'Enter' key inside the console input bar
window.handleConsoleInput = function(event) {
    if (event.key === 'Enter') {
        window.submitConsoleCommand();
    }
};

// Executes string commands typed in the logs terminal
window.submitConsoleCommand = function() {
    let inputEl = document.getElementById('dev-console-input');
    if (!inputEl) return;
    let cmd = inputEl.value.trim();
    inputEl.value = "";
    if (!cmd) return;

    if (typeof window.pushLog === "function") {
        window.pushLog(`<span style="color:#e67e22; font-family:monospace;">> ${cmd}</span>`);
    }

    if (cmd === "/dev" || cmd === "/debug" || cmd === "/cheat") {
        let devMod = document.getElementById('dev-modal');
        if (devMod) devMod.style.display = 'block';
        if (typeof window.switchDevTab === "function") window.switchDevTab('dev-prog');
        if (typeof window.pushHeaderToast === "function") window.pushHeaderToast("🛠️ Developer Testing Panel Opened!", "var(--accent-orange)");
        return;
    }

    let args = cmd.split(" ");
    let mainCmd = args[0].toLowerCase();

    if (mainCmd === "/gold") {
        let amt = parseInt(args[1], 10) || 100000;
        window.playerStats.coins += amt;
        window.playerStats.totalGoldEarned = (window.playerStats.totalGoldEarned || 0) + amt;
        if (typeof window.pushLog === "function") window.pushLog(`<span style="color:#2ecc71;">[DEV] Granted ${amt.toLocaleString()} Gold!</span>`);
        if (typeof window.updateUI === "function") window.updateUI();
        if (typeof window.saveGame === "function") window.saveGame();
    } else if (mainCmd === "/level") {
        let lvl = parseInt(args[1], 10);
        if (lvl > 0) {
            window.playerStats.level = lvl;
            window.playerStats.sp = (window.playerStats.sp || 0) + 1;
            window.playerStats.xp = 0;
            window.playerStats.xpReq = Math.floor(250 * Math.pow(1.2, window.playerStats.level - 1));
            let p = window.resolvePlayerStats();
            window.playerStats.currentHp = p.maxHp;
            if (typeof window.pushLog === "function") window.pushLog(`<span style="color:#2ecc71;">[DEV] Set Level to ${lvl}!</span>`);
            if (typeof window.updateUI === "function") window.updateUI();
            if (typeof window.saveGame === "function") window.saveGame();
        }
    } else if (mainCmd === "/sp") {
        let amt = parseInt(args[1], 10) || 10;
        window.playerStats.sp += amt;
        if (typeof window.pushLog === "function") window.pushLog(`<span style="color:#2ecc71;">[DEV] Granted ${amt} Skill Points (SP)!</span>`);
        if (typeof window.updateUI === "function") window.updateUI();
        if (typeof window.saveGame === "function") window.saveGame();
    } else if (mainCmd === "/prestige") {
        let amt = parseInt(args[1], 10) || 1;
        window.playerStats.prestigeCount += amt;
        window.playerStats.prestigePoints += amt * 3;
        if (typeof window.pushLog === "function") window.pushLog(`<span style="color:#2ecc71;">[DEV] Added ${amt} Prestiges & ${amt*3} PP!</span>`);
        if (typeof window.updateUI === "function") window.updateUI();
        if (typeof window.renderPrestigeTab === "function") window.renderPrestigeTab();
        if (typeof window.saveGame === "function") window.saveGame();
    } else if (mainCmd === "/keys") {
        let amt = parseInt(args[1], 10) || 8;
        window.playerStats.equipKeys += amt;
        window.playerStats.goldKeys += amt;
        window.playerStats.matKeys += amt;
        if (typeof window.addEtcDrop === "function") window.addEtcDrop("Gacha Key", amt);
        if (typeof window.pushLog === "function") window.pushLog(`<span style="color:#2ecc71;">[DEV] Granted +${amt} Keys!</span>`);
        if (typeof window.updateUI === "function") window.updateUI();
        if (typeof window.saveGame === "function") window.saveGame();
    } else if (mainCmd === "/clear") {
        window.logsHistory = [];
        let logBox = document.getElementById('log-box');
        if (logBox) logBox.innerHTML = "";
        if (typeof window.pushLog === "function") window.pushLog("<span style='color:#aaa;'>Logs cleared.</span>");
    } else {
        if (typeof window.pushLog === "function") window.pushLog(`<span style="color:#e74c3c;">Unknown command. Type /dev to open full Debug GUI panel, or try: /gold, /level, /sp, /prestige, /keys, /clear</span>`);
    }
};

// --- TROPHY / ACHIEVEMENT NAVIGATION ---

window.toggleAchievements = function() {
    let modal = document.getElementById('achievements-modal');
    if (!modal) return;

    // Support empty string display evaluation from stylesheets
    if (modal.style.display === 'none' || modal.style.display === '') {
        window.hideTooltip();
        window.buildAchievementsModal();
        modal.style.display = 'block';
        window.recalculateAchievementTotals();
    } else {
        modal.style.display = 'none';
        window.hideTooltip();
    }
};

window.buildAchievementsModal = function() {
    let listEl = document.getElementById('achievements-list');
    if (!listEl) return;

    listEl.innerHTML = window.AchievementsData.map(ach => {
        let unlocked = window.playerStats.unlockedAchievements && window.playerStats.unlockedAchievements.includes(ach.id);
        let borderStyle = unlocked
            ? "border-color: #f1c40f; background: rgba(241, 196, 15, 0.05); color: #fff;"
            : "border-color: #333; opacity: 0.5; filter: grayscale(100%); color: #7f8c8d;";
        let iconDisplay = unlocked ? ach.icon : "🔒";

        return `<div id="ach-card-${ach.id}" class="bag-item" style="cursor:help; display:flex; flex-direction:row; justify-content:flex-start; align-items:center; gap:10px; ${borderStyle}; padding:8px;"
            onmouseenter="window.showAchievementTooltip(event, '${ach.id}')"
            ontouchstart="window.showAchievementTooltip(event, '${ach.id}')"
            onmouseleave="window.hideTooltip()">
            <span style="font-size:22px; width:30px; text-align:center;">${iconDisplay}</span>
            <div style="flex:1; text-align:left;">
                <strong style="color:${unlocked ? '#f1c40f' : '#666'}; font-size:12px;">${ach.name}</strong>
                <div style="font-size:9px; color:#aaa; margin-top:2px; line-height:1.2;">${ach.desc}</div>
            </div>
        </div>`;
    }).join("");
};

window.showAchievementTooltip = function(e, achId) {
    e.stopPropagation();
    let ach = window.AchievementsData.find(a => a.id === achId);
    if (!ach) return;

    let unlocked = window.playerStats.unlockedAchievements && window.playerStats.unlockedAchievements.includes(achId);
    let tt = document.getElementById('game-tooltip');

    let statsDesc = Object.keys(ach.stats).map(k => {
        let val = ach.stats[k];
        let isPct = ["critChance", "critDamage", "block", "parry", "drop", "qly", "gold", "fairySpawn", "rareSpawn", "atkPct", "maxHpPct", "defPct", "moveSpeedPct", "strPct", "dexPct", "intPct", "expPct", "potDurationPct", "potStrengthPct", "idleSpeedPct", "activeSpeedPct"].includes(k);
        let labelMap = {
            atk: "⚔️ Attack", maxHp: "❤️ Max HP", def: "🛡️ Defense", moveSpeed: "👟 Move Speed",
            critChance: "✨ Crit Chance", critDamage: "💥 Crit Multiplier", block: "🛡️ Block Rate", parry: "⚡ Parry Rate",
            str: "💪 STR", dex: "🎯 DEX", int: "🧠 INT",
            drop: "🍀 Drop Rate Mod", qly: "💎 Drop Quality Mod", gold: "🟡 Gold Multiplier",
            fairySpawn: "🧚 Fairy Spawn Mod", rareSpawn: "✨ Rare Spawn Rate",
            atkPct: "⚔️ Attack Multiplier", maxHpPct: "❤️ Max HP Multiplier", defPct: "🛡️ Defense Multiplier",
            moveSpeedPct: "👟 Move Speed Multiplier", strPct: "💪 STR Multiplier", dexPct: "🎯 DEX Multiplier", intPct: "🧠 INT Multiplier",
            expPct: "🧠 EXP Multiplier", potDurationPct: "🧪 Potion Duration", potStrengthPct: "🧪 Potion Potency",
            idleSpeedPct: "⏱️ Idle Speed", activeSpeedPct: "⚡ Active Speed"
        };
        let cleanLabel = labelMap[k] || k.toUpperCase();
        let cleanVal = isPct ? `+${(val * 100).toFixed(0)}%` : `+${val}`;
        return `<div class="tt-stat-line" style="color:#2ecc71;">• ${cleanLabel}: ${cleanVal}</div>`;
    }).join("");
    let progressValue = window.getAchievementProgress(ach);
    let targetValue = ach.isSingleTier ? 1 : ach.reqValue;
    let percentDone = Math.min(100, (progressValue / targetValue) * 100);

    let html = `<div style="padding: 10px; width: 230px; box-sizing: border-box;">
        <div class="tt-title" style="color:${unlocked ? '#f1c40f' : '#aaa'};">${ach.icon} ${ach.name}</div>
        <div class="tt-subtitle" style="color:${unlocked ? '#2ecc71' : '#e74c3c'}; font-weight:bold;">${unlocked ? '🔓 UNLOCKED' : '🔒 LOCKED'}</div>
        <div style="color:#ddd; font-size:11px; margin-bottom:6px; white-space:normal; line-height:1.3;">${ach.desc}</div>
        <div style="font-size:10px; color:#aaa; margin-bottom:6px; font-family:monospace;">Progress: ${progressValue.toLocaleString()} / ${targetValue.toLocaleString()} (${percentDone.toFixed(1)}%)</div>
        <div style="font-weight:bold; color:#aaa; margin-bottom:4px; border-bottom: 1px solid #333; padding-bottom: 2px;">Permanent Reward:</div>
        ${statsDesc}
    </div>`;

    tt.style.borderColor = unlocked ? "#f1c40f" : "#444";
    tt.innerHTML = html;
    tt.style.display = "block";
    window.positionTooltip(e, tt);
};

window.navigateToAchievement = function(id) {
    let modal = document.getElementById('achievements-modal');
    if (modal && modal.style.display !== 'block') {
        window.toggleAchievements();
    }
    setTimeout(() => {
        let el = document.getElementById('ach-card-' + id);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
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

window.switchDevTab = function(tabId) {
    document.querySelectorAll('.dev-tab-content').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.dev-tab-btn').forEach(btn => btn.classList.remove('active'));
    
    let targetEl = document.getElementById(tabId);
    if (targetEl) targetEl.style.display = 'block';
    let targetBtn = document.getElementById('btn-' + tabId);
    if (targetBtn) targetBtn.classList.add('active');
};

window.buildDevArchitectUI = function() {
    let container = document.getElementById('dev-architect-lines'); if (!container) return;
    let stats = [
        {v: "atk", l: "⚔️ Attack"}, {v: "maxHp", l: "❤️ Max HP"}, {v: "def", l: "🛡️ Defense"},
        {v: "moveSpeed", l: "👟 Move Spd"}, {v: "critChance", l: "✨ Crit %"}, {v: "critDamage", l: "💥 Crit Multi"},
        {v: "block", l: "🛡️ Block %"}, {v: "parry", l: "⚡ Parry %"}, {v: "str", l: "💪 STR"},
        {v: "dex", l: "🎯 DEX"}, {v: "int", l: "🧠 INT"}, {v: "activeAttackSpeed", l: "⚡ Active Frm"},
        {v: "idleAttackSpeed", l: "⏱️ Idle Frm"}, {v: "dropRate", l: "🍀 Drop Rate"}, {v: "quality", l: "💎 Quality"},
        {v: "goldMulti", l: "🟡 Gold Mult"}, {v: "rareSpawn", l: "✨ Rare Rate"}, {v: "fairySpawn", l: "🧚 Fairy Rate"}
    ];
    let html = "";
    for (let i = 0; i < 5; i++) {
        html += `<div style="background:#1a1d20; border:1px solid #333; padding:8px; border-radius:4px; margin-bottom:4px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                <select id="dev-arch-stat-${i}" style="flex:1; background:#111; color:#fff; border:1px solid #444; font-size:10px; padding:2px;" onchange="window.updateArchitectRanges()">
                    <option value="">- Empty Slot -</option>
                    ${stats.map(s => `<option value="${s.v}">${s.l}</option>`).join("")}
                </select>
                <span id="dev-arch-range-label-${i}" style="font-size:9px; color:#aaa; margin-left:8px; font-family:monospace;">(0 ~ 0)</span>
            </div>
            <div style="display:flex; gap:8px; align-items:center;">
                <input type="range" id="dev-arch-slider-${i}" min="0" max="0" step="any" value="0" style="flex:1; height:4px;" oninput="document.getElementById('dev-arch-val-${i}').value = this.value">
                <input type="number" id="dev-arch-val-${i}" value="0" step="any" style="width:60px; background:#111; color:#fff; border:1px solid #444; font-size:10px; padding:2px;" oninput="document.getElementById('dev-arch-slider-${i}').value = this.value">
            </div>
        </div>`;
    }
    container.innerHTML = html; window.updateArchitectRanges();
};

window.updateArchitectRanges = function() {
    let type = document.getElementById('dev-item-type').value;
    let rarity = parseInt(document.getElementById('dev-item-rarity').value, 10);
    let lvl = parseInt(document.getElementById('dev-item-lvl').value, 10) || 1;

    let dummyItem = {
        type: type, statsRolled: rarity, stageLevel: lvl,
        bonusAtk: 1, bonusMaxHp: 1, bonusDef: 1, bonusMoveSpeed: 1,
        bonusCritChance: 1, bonusCritDamage: 1, bonusBlock: 1, bonusParry: 1,
        bonusActiveSpeed: 1, bonusIdleSpeed: 1, bonusStr: 1, bonusDex: 1, bonusInt: 1,
        rareSpawn: 1, dropRate: 1, quality: 1, goldMulti: 1, fairySpawn: 1,
        baseAtk: 0, baseMaxHp: 0, baseDef: 0, baseMoveSpeed: 0, baseBlock: 0, baseParry: 0, baseInt: 0,
        temperLevel: 0
    };
    if (type === "subweapon") dummyItem.subType = "shield";

    for (let i = 0; i < 5; i++) {
        let stat = document.getElementById(`dev-arch-stat-${i}`).value;
        let slider = document.getElementById(`dev-arch-slider-${i}`);
        let valInput = document.getElementById(`dev-arch-val-${i}`);
        let rangeLabel = document.getElementById(`dev-arch-range-label-${i}`);

        if (!stat) {
            slider.disabled = true; slider.min = 0; slider.max = 0; slider.value = 0;
            valInput.disabled = true; valInput.value = 0; rangeLabel.innerText = "(0 ~ 0)";
            continue;
        }

        slider.disabled = false; valInput.disabled = false;
        let range = window.getStatBaseRange(dummyItem, stat);

        if (stat === "activeAttackSpeed" || stat === "idleAttackSpeed") {
            if (range.min === 0 && range.max === 0) { range.min = -10; range.max = -1; }
        }

        slider.min = range.min; slider.max = range.max;
        let curVal = parseFloat(valInput.value);
        if (curVal < range.min) { valInput.value = range.min; slider.value = range.min; }
        else if (curVal > range.max) { valInput.value = range.max; slider.value = range.max; }
        else { slider.value = curVal; }

        let isPct = ["critChance", "critDamage", "block", "parry", "dropRate", "quality", "goldMulti", "fairySpawn"].includes(stat);
                let format = (v) => isPct ? (v * 100).toFixed(1) + "%" : (stat === "rareSpawn" ? (v * 100).toFixed(2) + "%" : Math.round(v));
                rangeLabel.innerText = `(${format(range.min)} ~ ${format(range.max)})`;
            }
        };

        // ==========================================================================
        // --- DEVELOPER PANEL OPERATIONS (REMOVE IN PRODUCTION) ---
        // ==========================================================================

        window.devSetLevel = function() {
            let el = document.getElementById('dev-level-input');
            if (!el) return;
            let val = parseInt(el.value, 10);
            if (isNaN(val) || val < 1) return;
            window.playerStats.level = val;
            window.playerStats.xp = 0;
            window.playerStats.xpReq = Math.floor(250 * Math.pow(1.2, val - 1));
            let p = window.resolvePlayerStats();
            window.playerStats.currentHp = p.maxHp;
            window.pushLog(`<span style='color:#e67e22;'>[DEV] Set level to ${val}</span>`);
            window.updateUI();
        };

        window.devSetSP = function() {
            let el = document.getElementById('dev-sp-input');
            if (!el) return;
            let val = parseInt(el.value, 10);
            if (isNaN(val) || val < 0) return;
            window.playerStats.sp = val;
            if (window.draftAllocations !== null) window.draftSP = val;
            window.pushLog(`<span style='color:#e67e22;'>[DEV] Set SP to ${val}</span>`);
            window.updateUI();
        };

        window.devSetStage = function() {
            let el = document.getElementById('dev-stage-input');
            if (!el) return;
            let val = parseInt(el.value, 10);
            if (isNaN(val) || val < 1) return;
            window.playerStats.stage = val;
            window.mob = null;
            window.pushLog(`<span style='color:#e67e22;'>[DEV] Set campaign stage to ${val}</span>`);
            window.updateUI();
        };

        window.devSetMaxStage = function() {
            let el = document.getElementById('dev-maxstage-input');
            if (!el) return;
            let val = parseInt(el.value, 10);
            if (isNaN(val) || val < 1) return;
            window.playerStats.maxStage = val;
            window.playerStats.lifetimePeakStage = Math.max(window.playerStats.lifetimePeakStage || 1, val);
            window.pushLog(`<span style='color:#e67e22;'>[DEV] Set max stage to ${val}</span>`);
            window.updateUI();
        };

        window.devSetPrestige = function() {
            let el = document.getElementById('dev-prestige-input');
            if (!el) return;
            let val = parseInt(el.value, 10);
            if (isNaN(val) || val < 0) return;
            window.playerStats.prestigeCount = val;
            window.pushLog(`<span style='color:#e67e22;'>[DEV] Set total prestige count to ${val}</span>`);
            window.updateUI();
        };

        window.devSetPP = function() {
            let el = document.getElementById('dev-pp-input');
            if (!el) return;
            let val = parseInt(el.value, 10);
            if (isNaN(val) || val < 0) return;
            window.playerStats.prestigePoints = val;
            window.pushLog(`<span style='color:#e67e22;'>[DEV] Set prestige points to ${val}</span>`);
            window.updateUI();
            window.renderPrestigeTab();
        };

        window.devAddCurrency = function(type) {
            let val = 0;
            if (type === 'gold') {
                val = parseInt(document.getElementById('dev-gold-val').value, 10) || 0;
                window.playerStats.coins += val;
                window.playerStats.totalGoldEarned += val;
                window.pushLog(`<span style='color:#e67e22;'>[DEV] Granted +${val.toLocaleString()} Gold</span>`);
            } else if (type === 'luminous') {
                val = parseInt(document.getElementById('dev-luminous-val').value, 10) || 0;
                window.addEtcDrop("Luminous Soul", val);
                window.pushLog(`<span style='color:#e67e22;'>[DEV] Granted +${val} Luminous Souls</span>`);
            } else if (type === 'monster') {
                val = parseInt(document.getElementById('dev-monster-val').value, 10) || 0;
                window.addEtcDrop("Monster Soul", val);
                window.pushLog(`<span style='color:#e67e22;'>[DEV] Granted +${val} Monster Souls</span>`);
            } else if (type === 'eridium') {
                val = parseInt(document.getElementById('dev-eridium-val').value, 10) || 0;
                window.addEtcDrop("Eridium Shard", val);
                window.pushLog(`<span style='color:#e67e22;'>[DEV] Granted +${val} Eridium Shards</span>`);
            } else if (type === 'astral') {
                val = parseInt(document.getElementById('dev-astral-val').value, 10) || 0;
                window.addEtcDrop("Astral Essence", val);
                window.pushLog(`<span style='color:#e67e22;'>[DEV] Granted +${val} Astral Essence</span>`);
            } else if (type === 'catalyst') {
                val = parseInt(document.getElementById('dev-catalyst-val').value, 10) || 0;
                window.addEtcDrop("Catalyst Core", val);
                window.pushLog(`<span style='color:#e67e22;'>[DEV] Granted +${val} Catalyst Cores</span>`);
            } else if (type === 'gachakeys') {
                val = parseInt(document.getElementById('dev-gachakeys-val').value, 10) || 0;
                window.addEtcDrop("Gacha Key", val);
                window.pushLog(`<span style='color:#e67e22;'>[DEV] Granted +${val} Gacha Keys</span>`);
            } else if (type === 'pp') {
                val = parseInt(document.getElementById('dev-pp-val').value, 10) || 0;
                window.playerStats.prestigePoints += val;
                window.pushLog(`<span style='color:#e67e22;'>[DEV] Granted +${val} Prestige Points (PP)</span>`);
                window.renderPrestigeTab();
            }
            window.updateUI();
        };

        window.devQuickSpawn = function(stars) {
            let types = ["weapon", "subweapon", "helmet", "chest", "leggings", "overall", "boots"];
            let chosenType = stars === "UNIQUE" ? "artifact" : types[Math.floor(Math.random() * types.length)];
            let stageScale = Math.floor((window.playerStats.stage - 1) / 10) + 1;
            let statLines = stars === "UNIQUE" ? 3 : stars;
            let newItem = window.createItemObject(chosenType, statLines, stageScale, stars === "UNIQUE" ? 0 : stars);

            if (newItem.type === "artifact") {
                window.inventory.ARTIFACT.push(newItem);
            } else {
                window.inventory.EQUIP.push(newItem);
            }

            window.pushLog(`<span style='color:#e67e22;'>[DEV] Spawned: ${newItem.name}</span>`, newItem.id);
            window.updateUI();
            window.renderInventory();
            if (typeof window.renderForgeTab === "function") window.renderForgeTab();
        };

        window.devSpawnGear = function() {
            let type = document.getElementById('dev-item-type').value;
            let rarity = parseInt(document.getElementById('dev-item-rarity').value, 10);
            let lvl = parseInt(document.getElementById('dev-item-lvl').value, 10) || 1;
            let setOverride = document.getElementById('dev-item-set').value;
            let prestigeCount = parseInt(document.getElementById('dev-item-prestige').value, 10) || 0;

            let originalPrestige = window.playerStats.prestigeCount || 0;
            window.playerStats.prestigeCount = prestigeCount;

            let newItem = window.createItemObject(type, rarity, lvl, rarity);
            window.playerStats.prestigeCount = originalPrestige;

            if (setOverride) {
                newItem.setName = setOverride;
                newItem.name = window.buildProceduralName(newItem);
            }

            window.inventory.EQUIP.push(newItem);
            window.pushLog(`<span style='color:#e67e22;'>[DEV] Crafted Custom Gear: ${newItem.name}</span>`, newItem.id);

            window.updateUI();
            window.renderInventory();
            if (typeof window.renderForgeTab === "function") window.renderForgeTab();
        };

        window.devSpawnUnique = function() {
            let uniqueId = document.getElementById('dev-unique-sel').value;
            let lvl = parseInt(document.getElementById('dev-unique-lvl').value, 10) || 1;

            let parts = uniqueId.split("-");
            let category = parts[0];
            let sub = parts[1];

            let newItem;
            if (category === "art") {
                newItem = window.createItemObject("artifact", 3, lvl, 0, [sub]);
            } else {
                newItem = window.createItemObject(category, 5, lvl, 5);
                if (sub === "staff") {
                    newItem.isUniqueStaff = true; newItem.noun = "Phoenix Staff"; newItem.setName = null;
                    newItem.name = `🔥 Phoenix Ignition Staff (Lv. ${lvl})`;
                    newItem.desc = "Launches penetrating fireballs that deal 25% Attack damage (3s Cooldown).";
                } else if (sub === "sword") {
                    newItem.isUniqueSword = true; newItem.noun = "Sanguine Reaver"; newItem.setName = null;
                    newItem.name = `🩸 Crimson Sanguine Reaver (Lv. ${lvl})`;
                    newItem.desc = "Strikes apply stacking Bleed (Max 5). Strikes at max stacks triggers Rupture, dealing 300% weapon damage and siphoning 10% Max HP.";
                } else if (sub === "singularity") {
                    newItem.isUniqueSingularity = true; newItem.noun = "Singularity Greatsword"; newItem.setName = null;
                    newItem.name = `🌌 Void-Sovereign Greatsword (Lv. ${lvl})`;
                    newItem.desc = "Glows for 7s every 30s. Tap during window to enter 5s Storing state, then detonates spatial collapse.";
                } else if (sub === "maelstrom") {
                    newItem.isUniqueMaelstrom = true; newItem.noun = "Maelstrom Glaive"; newItem.setName = null;
                    newItem.name = `🌪️ Maelstrom Gale-Glaive (Lv. ${lvl})`;
                    newItem.desc = "Overkill damage cleaves on next spawn. Critical strikes have 25% chance to project piercing gales.";
                } else if (sub === "aegis") {
                    newItem.subType = "shield"; newItem.isUniqueAegis = true; newItem.noun = "Void-Warped Aegis"; newItem.setName = null;
                    newItem.name = `🛡️ Void-Warped Bulwark (Lv. ${lvl})`;
                    newItem.desc = "Blocks trigger gravity blasts scaling with Defense. Can be absorbed into Singularity vortex.";
                } else if (sub === "watch") {
                    newItem.subType = "tome"; newItem.isUniqueWatch = true; newItem.noun = "Chronos Pocket-Watch"; newItem.setName = null;
                    newItem.name = `⏳ Chronos Dial-Watch (Lv. ${lvl})`;
                    newItem.desc = "Triggers 4s Temporal Fracture every 20s. Accelerates attack speeds by 15% and slows enemies by 25%.";
                } else if (sub === "chronicle") {
                    newItem.subType = "tome"; newItem.isUniqueChronicle = true; newItem.noun = "Chronicle of the Ascended"; newItem.setName = null;
                    newItem.name = `📖 Chronicle of past Lives (Lv. ${lvl})`;
                    newItem.desc = "Boosts XP gain by +200% and bypasses level locks while below 75% peak level.";
                } else if (sub === "warpcore") {
                    newItem.isUniqueWarpCore = true; newItem.noun = "Warp-Core Greaves"; newItem.setName = null;
                    newItem.name = `⚡ Warp-Core Greaves (Lv. ${lvl})`;
                    newItem.desc = "While below 85% Peak Stage: +150% sprint speed, and kills count as 2.";
                } else if (sub === "tempest") {
                    newItem.isUniqueTempest = true; newItem.noun = "Crown of Tempests"; newItem.setName = null;
                    newItem.name = `👑 Crown of crackling Tempests (Lv. ${lvl})`;
                    newItem.desc = "Taking damage has 15% chance to call thunderbolt dealing 150% Attack power and stuns.";
                }
            }

            window.recalculateItemStats(newItem);
            if (newItem.type === "artifact") window.inventory.ARTIFACT.push(newItem);
            else window.inventory.EQUIP.push(newItem);

            window.pushLog(`<span style='color:#e67e22;'>[DEV] Spawned Unique/Artifact: ${newItem.name}</span>`, newItem.id);
            window.updateUI();
            window.renderInventory();
            if (typeof window.renderForgeTab === "function") window.renderForgeTab();
        };

        window.devSpawnArchitectGear = function() {
            let type = document.getElementById('dev-item-type').value;
            let rarity = parseInt(document.getElementById('dev-item-rarity').value, 10);
            let lvl = document.getElementById('dev-item-lvl').value || 1;
            let setOverride = document.getElementById('dev-item-set').value;

            let newItem = {
                id: window.idCounter++, name: "", type: type, statsRolled: rarity, temperLevel: 0, stageLevel: lvl,
                atk: 0, maxHp: 0, def: 0, moveSpeed: 0, critChance: 0, critDamage: 0, block: 0, parry: 0, dropRate: 0, quality: 0, goldMulti: 0, rareSpawn: 0, fairySpawn: 0,
                activeAttackSpeed: 0, idleAttackSpeed: 0,
                baseAtk: 0, baseMaxHp: 0, baseDef: 0, baseMoveSpeed: 0, baseBlock: 0, baseParry: 0, baseInt: 0,
                bonusAtk: 0, bonusMaxHp: 0, bonusDef: 0, bonusMoveSpeed: 0, bonusCritChance: 0, bonusCritDamage: 0, bonusBlock: 0, bonusParry: 0,
                bonusActiveSpeed: 0, bonusIdleSpeed: 0,
                bonusStr: 0, bonusDex: 0, bonusInt: 0, str: 0, dex: 0, int: 0,
                trait: null, desc: "", breakdown: "", noun: "Exo-Plate", setName: setOverride || null
            };

            if (type === "subweapon") {
                newItem.subType = "shield";
            }

            let nounList = window.slotNouns[type];
            if (type === "subweapon") nounList = window.slotNouns.subweapon.shield;
            newItem.noun = nounList ? nounList[0] : "Exo-Plate";

            for (let i = 0; i < 5; i++) {
                let statKey = document.getElementById(`dev-arch-stat-${i}`).value;
                let val = parseFloat(document.getElementById(`dev-arch-val-${i}`).value) || 0;
                if (!statKey) continue;

                let bonusField = "bonus" + statKey.charAt(0).toUpperCase() + statKey.slice(1);
                if (statKey === "dropRate" || statKey === "quality" || statKey === "goldMulti" || statKey === "rareSpawn" || statKey === "fairySpawn") {
                    newItem[statKey] = val;
                } else {
                    newItem[bonusField] = val;
                }
            }

            window.recalculateItemStats(newItem);
            newItem.name = window.buildProceduralName(newItem);

            window.inventory.EQUIP.push(newItem);
            window.pushLog(`<span style='color:#e67e22;'>[DEV] Spawned Architect Gear: ${newItem.name}</span>`, newItem.id);

            window.updateUI();
            window.renderInventory();
            if (typeof window.renderForgeTab === "function") window.renderForgeTab();
        };

        window.devTriggerBuff = function(type) {
            let duration = 36000; // 10 minutes (600 seconds * 60 frames)
            if (type === 'frenzy') {
                window.playerStats.frenzyTimer = duration;
                window.pushLog(`<span style='color:#e67e22;'>[DEV] Triggered 10-Minute Frenzy</span>`);
            } else if (type === 'adrenaline') {
                window.playerStats.adrenalineTimer = duration;
                window.pushLog(`<span style='color:#e67e22;'>[DEV] Triggered 10-Minute Adrenaline</span>`);
            } else if (type === 'potions') {
                window.playerStats.atkPotionTimer = duration; window.playerStats.atkPotionStrength = 0.35;
                window.playerStats.hpPotionTimer = duration; window.playerStats.hpPotionStrength = 0.35;
                window.playerStats.defPotionTimer = duration; window.playerStats.defPotionStrength = 0.35;
                window.playerStats.hastePotionTimer = duration; window.playerStats.hastePotionStrength = 3;
                window.pushLog(`<span style='color:#e67e22;'>[DEV] Infused all 10-Minute Potions at Max Strength</span>`);
            }
            window.updateUI();
        };

        window.devHealFull = function() {
            let p = window.resolvePlayerStats();
            window.playerStats.currentHp = p.maxHp;
            window.pushLog(`<span style='color:#2ecc71;'>[DEV] Full Healing applied. HP restored.</span>`);
            window.updateUI();
        };

        window.devUnlockAllAchievements = function() {
            if (!window.playerStats.unlockedAchievements) window.playerStats.unlockedAchievements = [];
            window.AchievementsData.forEach(ach => {
                if (!window.playerStats.unlockedAchievements.includes(ach.id)) {
                    window.playerStats.unlockedAchievements.push(ach.id);
                }
            });
            window.recalculateAchievementTotals();
            let p = window.resolvePlayerStats();
            window.playerStats.currentHp = p.maxHp;
            window.pushLog(`<span style='color:#e67e22;'>[DEV] All achievements unlocked! Stat bonuses compounded.</span>`);
            window.updateUI();
            window.renderInventory();
        };

        window.devToggleGodMode = function() {
            window.playerStats.godMode = !window.playerStats.godMode;
            let btn = document.getElementById('btn-dev-godmode');
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
            window.pushLog(`<span style='color:#e67e22;'>[DEV] God Mode (Invulnerability) ${window.playerStats.godMode ? 'ON' : 'OFF'}</span>`);
        };