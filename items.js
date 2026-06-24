/* ==========================================================================
   PRIMARY PURPOSE: Procedural Item Generation, Unique Styling,
   Sack Management, Forge/Crafting, and Shop Transaction Logic.
   ========================================================================= */

window.forgeSelectedItem = null;
window.forgeMode = 'temper';

// Universal Set generation roller with targeted theme biases for Dungeons and Rift hunts
window.rollSetForItem = function(isBoss, isRare, isDungeon, currentDungeon) {
    let setChance = 0.15; // 15% base rate
    if (isDungeon) setChance = 0.40;
    else if (isBoss) setChance = 0.30;
    else if (isRare) setChance = 0.25;

    if (Math.random() > setChance) return null;

    let setKeys = ["Vanguard", "Colossus", "Bastion", "Windrunner", "Wraith", "Reaver", "Dreadnought", "Duellist", "Scholar", "Berserker", "Scout", "Fortune", "Mystic", "Alchemist", "Midas", "Biohazard", "Warlord", "VoidTouched"];

    // 70% chance to respect regional theme layout
    if (Math.random() < 0.70) {
        if (isDungeon && currentDungeon) {
            let themes = { 'equip': 'Warlord', 'gold': 'Midas', 'mat': 'Biohazard' };
            if (themes[currentDungeon]) return themes[currentDungeon];
        }
        if (window.playerStats.isUberBoss) {
            return "VoidTouched";
        }
    }

    return setKeys[Math.floor(Math.random() * setKeys.length)];
};

// Calculates gold expenses for set re-resonating
window.getSetRerollGoldCost = function(item) {
    let pCount = window.playerStats.prestigeCount || 0;
    let itemLvlMultiplier = Math.pow(1.08, Math.max(0, (item.stageLevel - 1) * 5));
    let prestigeMultiplier = Math.pow(1.15, pCount);
    return Math.floor(100 * itemLvlMultiplier * Math.pow(1.5, item.statsRolled) * prestigeMultiplier);
};

// Renders the entire Blacksmith and Enchanter selection pane with custom comparison values
window.renderForgeTab = function() {
    let listEl = document.getElementById('forge-list');
    let detailEl = document.getElementById('forge-details');
    if (!listEl || !detailEl) return;

    let allValidItems = [...window.inventory.EQUIP, ...(window.inventory.ARTIFACT || [])];
    for (let key in window.equippedSlots) {
        if (window.equippedSlots[key]) {
            let eqClone = {...window.equippedSlots[key], isEquippedSlot: key};
            allValidItems.push(eqClone);
        }
    }

    if (allValidItems.length === 0) {
        listEl.innerHTML = "<div style='color:#666;text-align:center;padding-top:40px;'>No gear.</div>";
    } else {
        listEl.innerHTML = allValidItems.map(item => {
            let isArt = item.type === "artifact";
            if ((window.forgeMode === 'reforge' || window.forgeMode === 'tier' || window.forgeMode === 'enchant' || window.forgeMode === 'reset_enchant' || window.forgeMode === 'set') && isArt) return "";

            let nameColor = window.getTierColor(item.statsRolled);
            let temperTag = item.temperLevel > 0 ? ` [+${item.temperLevel}]` : "";
            let lockTag = item.locked ? " 🔒" : "";
            let bgStyle = window.forgeSelectedItem && window.forgeSelectedItem.id === item.id ? "background:#1e2a38; border: 1px solid #1abc9c;" : "";

            // Set Diablo Uber Unique visual profiles in Forge Selection Lists
            let uniqueStyleStr = "";
            let uniqueStyle = window.getUniqueItemStyle(item);
            if (uniqueStyle) {
                uniqueStyleStr = `background: ${uniqueStyle.bg}; border: 1px solid ${uniqueStyle.border}; box-shadow: inset 0 0 6px ${uniqueStyle.shadow}, 0 0 8px ${uniqueStyle.glow};`;
            }
            let finalStyle = bgStyle ? `${bgStyle} ${uniqueStyleStr}` : uniqueStyleStr;
            let inlineStyle = finalStyle ? `style="${finalStyle}"` : "";

            let eqBadge = item.isEquippedSlot ? `<span style="background:#c0392b; color:white; padding:1px 3px; border-radius:2px; font-size:8px;">[EQUIPPED]</span> ` : "";
            let rarityLabel = isArt ? "UNIQUE" : `${item.statsRolled}★`;
            return `<div class="bag-item" ${inlineStyle} onclick="window.selectForgeItem(${item.id})" onmouseenter="window.showForgeTooltip(event, ${item.id})" onmouseleave="window.hideTooltip()" ontouchstart="window.showForgeTooltip(event, ${item.id})">
                <div>${eqBadge}<strong style="color:${nameColor};">${item.name}${temperTag}${lockTag}</strong><br><span style="font-size:10px;color:#aaa;">${item.type.toUpperCase()} | ${rarityLabel}</span></div>
            </div>`;
        }).join("");
    }

    if (!window.forgeSelectedItem || ((window.forgeMode === 'reforge' || window.forgeMode === 'tier' || window.forgeMode === 'enchant' || window.forgeMode === 'reset_enchant' || window.forgeMode === 'set') && window.forgeSelectedItem.type === "artifact")) {
            detailEl.innerHTML = `<div style='color:#aaa; text-align:center; padding-top:10px;'>
                <div style='color:#e67e22; font-weight:bold; font-size:14px; margin-bottom:10px;'>🔨 Mystical Anvil</div>
                <div style='font-size:11px; line-height:1.8; background:#111; padding:10px; border-radius:4px; border:1px solid #333; text-align:left;'>
                    Select an eligible item from your list.<br><br>
                    <b>TEMPER:</b> Refines stats with tier-appropriate material scraps. Failure consumes raw items.<br><br>
                    <b>REFORGE STAT:</b> Spend **Catalyst Cores** to lock and roll a modifier line of your choice. All other slots lock permanently once selection is active!<br><br>
                    <b>TIER UP:</b> Infuses Eridium Shards to permanently elevate stars and unlock 1 additional random stat modifier!<br><br>
                    <b>ENCHANT:</b> Infuse powerful magic using salvaged <b>Astral Essence</b>. Boosts 1 random stat line by 25%. Slots scale with rarity.<br><br>
                    <b>RE-ROLL SET:</b> Infuse **Monster Souls** and gold to alter set resonances. Handy for completing Vanguard/Colossus layout chains!
                </div>
            </div>`;
            return;
        }

    let item = window.forgeSelectedItem;
    let titleColor = window.getTierColor(item.statsRolled);
    let temperTag = item.temperLevel > 0 ? ` <span style="color:#2ecc71;">[+${item.temperLevel}]</span>` : "";
    let html = `<div style="font-weight:bold; font-size:13px; color:${titleColor}; border-bottom:1px solid #333; padding-bottom:4px; margin-bottom:10px;">${item.name}${temperTag}</div>`;

    let previewHtml = "";
    let previewItem = JSON.parse(JSON.stringify(item));

    if (window.forgeMode === 'temper') {
        let maxT = window.getMaxTemper(item.statsRolled, item.type);
        if (item.temperLevel >= maxT) {
            html += `<div style="color:#e74c3c; font-weight:bold; text-align:center; padding: 20px 0;">MAXIMUM TEMPER LIMIT REACHED</div>`;
        } else {
            let costGold = window.getTemperGoldCost(item);
            let scrapReqAmount = window.getRequiredScrapAmountForTemper(item.temperLevel + 1, item.type === "artifact");
            let scrapReq = window.getRequiredScrapForTemper(item.temperLevel + 1, item.type === "artifact");
            let playerScrap = window.inventory.ETC[scrapReq] || 0;
            let failChance = item.temperLevel * 5;
            let goldColor = window.playerStats.coins >= costGold ? "#f1c40f" : "#e74c3c";
            let scrapColor = playerScrap >= scrapReqAmount ? "#bdc3c7" : "#e74c3c";

            previewItem.temperLevel++;
            window.recalculateItemStats(previewItem);

            html += `<div style="font-size:11px; margin-bottom:10px; color:#aaa;">Temper Cap: <span style="color:#fff;">${item.temperLevel} / ${maxT}</span></div>`;
            let pct = (item.temperLevel / maxT) * 100;
            html += `<div class="forge-progress-bg"><div class="forge-progress-fill" style="width:${pct}%"></div></div>`;
            html += `<div style="font-size:11px; color:${goldColor}; margin-bottom:3px;">• ${window.formatNumber(costGold)} Gold Required</div>`;
            html += `<div style="font-size:11px; color:${scrapColor}; margin-bottom:10px;">• ${scrapReqAmount.toLocaleString()}x ${scrapReq} (Owned: ${playerScrap.toLocaleString()})</div>`;
            html += `<div style="font-size:11px; color:#e74c3c; font-weight:bold; margin-bottom:15px;">⚠️ ${failChance}% Chance to Fail</div>`;
            html += `<button class="forge-anvil-button" style="width:100%;" ${(window.playerStats.coins >= costGold) && (playerScrap >= scrapReqAmount) ? '' : 'disabled'} onclick="window.temperItem()">Harness Heat</button>`;
        }
    } else if (window.forgeMode === 'reforge') {
        let bonusKeys = ["bonusAtk", "bonusMaxHp", "bonusDef", "bonusMoveSpeed", "bonusCritChance", "bonusCritDamage", "bonusBlock", "bonusParry", "bonusActiveSpeed", "bonusIdleSpeed", "bonusStr", "bonusDex", "bonusInt"];
        let activeBonuses = bonusKeys.filter(k => item[k] !== 0);

        if (activeBonuses.length === 0) {
            html += `<div style="color:#7f8c8d; font-size:11px; text-align:center; padding:15px 0;">This item has no stat modifiers to reforge!</div>`;
        } else {
            let costGold = Math.floor(150 * item.stageLevel * Math.pow(2, item.statsRolled));
            let ownedCores = window.inventory.ETC["Catalyst Core"] || 0;

            let goldColor = window.playerStats.coins >= costGold ? "#f1c40f" : "#e74c3c";
            let coresColor = ownedCores >= 1 ? "#9b59b6" : "#e74c3c";

            if (!item.reforgedProperty) {
                html += `<div style="font-size:11px; color:#aaa; margin-bottom:8px;">Select a modifier line below to prepare for reforging:</div>`;
                activeBonuses.forEach(bKey => {
                    let valText = item[bKey] > 0 ? `+${item[bKey]}` : `${item[bKey]}`;
                    let isSelected = item.tempReforgeProp === bKey;
                    let borderStyle = isSelected ? "border-color:#2ecc71; background:#1b2a1e;" : "border-color:#555; background:#111;";
                    let icon = isSelected ? "🟢" : "⚫";
                    html += `<button class="forge-anvil-button" style="width:100%; margin-bottom:5px; text-transform:none; padding:6px; ${borderStyle}" onclick="window.selectReforgeStat('${bKey}')">${icon} ${window.getStatLabel(bKey)} (${valText})</button>`;
                });

                if (item.tempReforgeProp) {
                    let rProp = item.tempReforgeProp;
                    let valText = item[rProp] > 0 ? `+${item[rProp]}` : `${item[rProp]}`;
                    html += `<div style="margin-top:10px; background:#111; padding:8px; border-radius:4px; border:1px dashed #2ecc71; font-size:11px; margin-bottom:12px; text-align:center;">
                        <span style="color:#2ecc71; font-weight:bold;">SELECTED TO RE-ROLL:</span><br>
                        <strong>${window.getStatLabel(rProp)} (${valText})</strong><br>
                        <span style="font-size:9px; color:#aaa;">(Clicking Execute Reforge will lock this as the only reforgible line!)</span>
                    </div>`;

                    html += `<div style="font-size:11px; color:${goldColor}; margin-bottom:3px;">• ${window.formatNumber(costGold)} Gold Required</div>`;
                    html += `<div style="font-size:11px; color:${coresColor}; margin-bottom:12px;">• 1x Catalyst Core (Owned: ${ownedCores.toLocaleString()})</div>`;
                    html += `<button class="forge-anvil-button" style="width:100%; border-color:#2ecc71; background: linear-gradient(135deg, #1b2a1e, #111);" ${(window.playerStats.coins >= costGold) && (ownedCores >= 1) ? '' : 'disabled'} onclick="window.reforgeItemStat()">Execute Reforge</button>`;
                }
            } else {
                let rProp = item.reforgedProperty;
                let valText = item[rProp] > 0 ? `+${item[rProp]}` : `${item[rProp]}`;

                html += `<div style="background:#111; padding:8px; border-radius:4px; border:1px solid #9b59b6; font-size:11px; margin-bottom:12px; text-align:center;">
                    <span style="color:#9b59b6; font-weight:bold;">REFORGIBLE SLOT (LOCKED):</span><br>
                    <strong style="color:#2ecc71; font-size:12px;">${window.getStatLabel(rProp)} (${valText})</strong><br>
                    <span style="font-size:9px; color:#aaa;">(All other stat lines on this item are permanently locked!)</span>
                </div>`;

                html += `<div style="font-size:11px; color:${goldColor}; margin-bottom:3px;">• ${window.formatNumber(costGold)} Gold Required</div>`;
                html += `<div style="font-size:11px; color:${coresColor}; margin-bottom:12px;">• 1x Catalyst Core (Owned: ${ownedCores.toLocaleString()})</div>`;
                html += `<button class="forge-anvil-button" style="width:100%; border-color:#9b59b6; background: linear-gradient(135deg, #4a154b, #111);" ${(window.playerStats.coins >= costGold) && (ownedCores >= 1) ? '' : 'disabled'} onclick="window.reforgeItemStat()">Re-Roll Locked Modifier</button>`;
            }
        }
    } else if (window.forgeMode === 'tier') {
        if (item.statsRolled >= 5) {
            html += `<div style="color:#e74c3c; font-weight:bold; text-align:center; padding: 20px 0;">MAXIMUM RARITY REACHED</div>`;
        } else {
            let currentStars = item.statsRolled;
            let costGold = (currentStars + 1) * 2500;
            let scrapReqAmount = currentStars + 1;
            let playerScrap = window.inventory.ETC["Eridium Shard"] || 0;

            let goldColor = window.playerStats.coins >= costGold ? "#f1c40f" : "#e74c3c";
            let scrapColor = playerScrap >= scrapReqAmount ? "#8e44ad" : "#e74c3c";

            previewItem.statsRolled++;

            html += `<div style="font-size:11px; margin-bottom:15px; color:#aaa;">Rarity Transition: <span style="color:#fff;">${currentStars}★</span> ➔ <span style="color:#f1c40f;">${currentStars+1}★</span></div>`;
            html += `<div style="font-size:11px; color:${goldColor}; margin-bottom:3px;">• ${window.formatNumber(costGold)} Gold Required</div>`;
            html += `<div style="font-size:11px; color:${scrapColor}; margin-bottom:10px;">• ${scrapReqAmount.toLocaleString()}x Eridium Shard (Owned: ${playerScrap.toLocaleString()})</div>`;
            html += `<div style="font-size:11px; color:#2ecc71; font-weight:bold; margin-bottom:15px;">✨ 100% Awakening Guaranteed</div>`;
            html += `<button class="forge-anvil-button" style="width:100%; border-color:#e67e22;" ${(window.playerStats.coins >= costGold) && (playerScrap >= scrapReqAmount) ? '' : 'disabled'} onclick="window.temperItem()">Awaken Rarity</button>`;
        }
    } else if (window.forgeMode === 'enchant') {
        let maxEnchants = window.getMaxEnchants(item);
        let currentEnchants = item.totalEnchants || 0;
        let maxT = window.getMaxTemper(item.statsRolled, item.type);
        let isFullyTempered = item.temperLevel >= maxT;

        if (maxEnchants === 0) {
            html += `<div style="color:#e74c3c; font-weight:bold; text-align:center; padding: 20px 0; font-size:11px;">THIS ITEM QUALITY CANNOT HOLD ENCHANTMENTS.<br><br><span style="color:#aaa; font-weight:normal;">Only Magic (2★), Epic (3★), Legendary (4★), and Mythic (5★) items can hold enchantments.</span></div>`;
        } else if (!isFullyTempered) {
            html += `<div style="color:#e74c3c; font-weight:bold; text-align:center; padding: 20px 0; font-size:11px;">ITEM MUST BE FULLY TEMPERED FIRST<br><br><span style="color:#aaa; font-weight:normal;">Current Temper: [+${item.temperLevel}/${maxT}]. Temper this item to its absolute limit before infusing cosmic enchantments.</span></div>`;
        } else if (currentEnchants >= maxEnchants) {
            html += `<div style="color:#e74c3c; font-weight:bold; text-align:center; padding: 20px 0; font-size:11px;">MAXIMUM ENCHANTMENT LIMIT REACHED (${maxEnchants}/${maxEnchants})<br><br><span style="color:#aaa; font-weight:normal;">Reset this item's enchantments in "Reset Enchants" mode to enchant again.</span></div>`;
        } else {
            let playerEssence = window.inventory.ETC["Astral Essence"] || 0;
            let essenceColor = playerEssence >= 1 ? "#2ecc71" : "#e74c3c";

            html += `<div style="font-size:11px; margin-bottom:10px; color:#aaa;">Enchantment Slots: <span style="color:#fff; font-weight:bold;">${currentEnchants} / ${maxEnchants}</span></div>`;
            let pct = (currentEnchants / maxEnchants) * 100;
            html += `<div class="forge-progress-bg"><div class="forge-progress-fill" style="width:${pct}%; background: linear-gradient(90deg, #9b59b6, #e84393);"></div></div>`;
            html += `<div style="font-size:11px; color:${essenceColor}; margin-bottom:15px;">• 1x Astral Essence Required (Owned: ${playerEssence})</div>`;
            html += `<div style="font-size:11px; color:#9b59b6; font-weight:bold; margin-bottom:15px;">🔮 Randomly boosts one active parameter by +25%!</div>`;
            html += `<button class="forge-anvil-button" style="width:100%; border-color:#9b59b6; background: linear-gradient(135deg, #4a154b, #1a0221);" ${playerEssence >= 1 ? '' : 'disabled'} onclick="window.enchantItem()">Infuse Enchantment</button>`;
        }
    } else if (window.forgeMode === 'reset_enchant') {
            let currentEnchants = item.totalEnchants || 0;
            if (currentEnchants === 0) {
                html += `<div style="color:#7f8c8d; font-weight:bold; text-align:center; padding: 20px 0; font-size:11px;">THIS ITEM HAS NO ACTIVE ENCHANTMENTS</div>`;
            } else {
                let resetGoldCost = 1000 * item.stageLevel * (item.statsRolled || 1);
                let goldColor = window.playerStats.coins >= resetGoldCost ? "#f1c40f" : "#e74c3c";

                html += `<div style="font-size:11px; margin-bottom:10px; color:#aaa;">Active Enchantments to Purge: <span style="color:#9b59b6; font-weight:bold;">${currentEnchants}</span></div>`;
                html += `<div style="font-size:11px; color:${goldColor}; margin-bottom:15px;">• ${resetGoldCost.toLocaleString()} Gold Required (Owned: ${Math.floor(window.playerStats.coins).toLocaleString()})</div>`;
                html += `<div style="font-size:11px; color:#e74c3c; font-weight:bold; margin-bottom:15px;">⚠️ Restores all enchanted parameters to their original pre-enchanted values. Material scraps are non-refundable.</div>`;
                html += `<button class="forge-anvil-button" style="width:100%; border-color:#e74c3c; background: linear-gradient(135deg, #c0392b, #111);" ${window.playerStats.coins >= resetGoldCost ? '' : 'disabled'} onclick="window.resetItemEnchants()">Purge Enchantments</button>`;
            }
        } else if (window.forgeMode === 'set') {
            let costGold = window.getSetRerollGoldCost(item);
            let soulCost = 25 + (item.statsRolled * 25);
            let ownedSouls = window.inventory.ETC["Monster Soul"] || 0;

            let goldColor = window.playerStats.coins >= costGold ? "#f1c40f" : "#e74c3c";
            let soulsColor = ownedSouls >= soulCost ? "#bdc3c7" : "#e74c3c";

            html += `<div style="font-size:11px; margin-bottom:10px; color:#aaa;">Current Set Resonance: <span style="color:#2ecc71; font-weight:bold;">${item.setName || "None"}</span></div>`;
            html += `<div style="font-size:11px; color:${goldColor}; margin-bottom:3px;">• ${window.formatNumber(costGold)} Gold Required</div>`;
            html += `<div style="font-size:11px; color:${soulsColor}; margin-bottom:10px;">• ${soulCost}x Monster Soul (Owned: ${ownedSouls.toLocaleString()})</div>`;
            html += `<div style="font-size:11px; color:#2ecc71; font-weight:bold; margin-bottom:15px;">✨ Randomly rolls a different Set bonus!</div>`;
            html += `<button class="forge-anvil-button" style="width:100%; border-color:#2ecc71; background: linear-gradient(135deg, #1b2a1e, #111);" ${(window.playerStats.coins >= costGold) && (ownedSouls >= soulCost) ? '' : 'disabled'} onclick="window.rerollItemSet()">Re-Resonate Set</button>`;
        }

        if (window.forgeMode === 'tier' && item.statsRolled < 5) {
        previewHtml = `<div style="margin-top:15px; padding:10px; background:#111; border:1px dashed #f1c40f; border-radius:4px; font-size:11px; color:#ccc; text-align:center;">
            * Star Tier UP preserves current modifiers, increases base multipliers, and unlocks <b>1 completely new random attribute parameter</b>!
        </div>`;
    } else if (window.forgeMode === 'enchant' && item.temperLevel >= window.getMaxTemper(item.statsRolled, item.type) && item.totalEnchants < window.getMaxEnchants(item) && window.getMaxEnchants(item) > 0) {
        previewHtml = `<div style="margin-top:15px; padding:10px; background:#111; border:1px dashed #9b59b6; border-radius:4px; font-size:11px; color:#ccc; text-align:center;">
            * Enchanting will permanently snapshot pre-enchant stats, then select 1 parameter at random to scale by <b>+25%</b>.
        </div>`;
    } else if (window.forgeMode === 'temper' && item.temperLevel < window.getMaxTemper(item.statsRolled, item.type)) {
        let statsToCompare = [
            { key: "atk", icon: "⚔️", label: "Attack", isPct: false },
            { key: "maxHp", icon: "❤️", label: "Max HP", isPct: false },
            { key: "def", icon: "🛡️", label: "Defense", isPct: false },
            { key: "moveSpeed", icon: "👟", label: "Move Speed", isPct: false },
            { key: "str", icon: "💪", label: "STR", isPct: false },
            { key: "dex", icon: "🎯", label: "DEX", isPct: false },
            { key: "int", icon: "🧠", label: "INT", isPct: false },
            { key: "critChance", icon: "✨", label: "Crit Chance", isPct: true },
            { key: "critDamage", icon: "💥", label: "Crit Multi", isPct: true },
            { key: "block", icon: "🛡️", label: "Block Rate", isPct: true },
            { key: "parry", icon: "⚡", label: "Parry Rate", isPct: true },
            { key: "dropRate", icon: "🍀", label: "Drop Rate", isPct: true },
            { key: "quality", icon: "💎", label: "Drop Quality", isPct: true },
            { key: "goldMulti", icon: "🟡", label: "Gold Multi", isPct: true },
            { key: "rareSpawn", icon: "✨", label: "Rare Spawn", isPct: true, isDoublePct: true },
            { key: "fairySpawn", icon: "🧚", label: "Fairy Spawn", isPct: true }
        ];

        let diffLines = "";
        statsToCompare.forEach(s => {
            let curVal = item[s.key] || 0;
            let newVal = previewItem[s.key] || 0;
            let diff = newVal - curVal;
            if (Math.abs(diff) > 0.0001) {
                let curValStr = s.isPct ? (s.isDoublePct ? (curVal * 100).toFixed(2) + "%" : Math.round(curVal * 100) + "%") : Math.round(curVal).toLocaleString();
                let newValStr = s.isPct ? (s.isDoublePct ? (newVal * 100).toFixed(2) + "%" : Math.round(newVal * 100) + "%") : Math.round(newVal).toLocaleString();
                let diffStr = s.isPct ? (s.isDoublePct ? (diff * 100).toFixed(2) + "%" : Math.round(diff * 100) + "%") : Math.round(diff).toLocaleString();

                diffLines += `
                    <div style="display:flex; justify-content:space-between; align-items:center; font-size:11px; background:rgba(0,0,0,0.4); padding:6px 8px; border-radius:3px; margin-bottom:4px; border:1px solid #333;">
                        <span style="color:#aaa;">${s.icon} ${s.label}</span>
                        <span style="font-family:monospace;">
                            <span style="color:#7f8c8d;">+${curValStr}</span> ➔
                            <strong style="color:#fff;">+${newValStr}</strong>
                            <span style="color:#2ecc71; font-weight:bold; margin-left:4px;">(+${diffStr})</span>
                        </span>
                    </div>
                `;
            }
        });

        previewHtml = `
            <div style="margin-top:15px; padding:12px; background:#111; border:1px solid #3498db; border-radius:6px; box-shadow: 0 4px 10px rgba(0,0,0,0.5);">
                <div style="color:#3498db; font-weight:bold; font-size:11.5px; margin-bottom:8px; border-bottom:1px solid #222; padding-bottom:6px; text-transform:uppercase; letter-spacing:0.5px;">📈 Tempering Preview ([+${item.temperLevel}] ➔ [+${previewItem.temperLevel}])</div>
                <div style="display:flex; flex-direction:column;">
                    ${diffLines || '<div style="color:#7f8c8d; font-style:italic; text-align:center; padding:10px;">No stat modifications.</div>'}
                </div>
            </div>
        `;
    }

    detailEl.innerHTML = html + previewHtml;
};

// --- UNIQUE STYLE SYSTEM ---

window.getUniqueItemStyle = function(item) {
    if (!item) return null;
    let isUnique = item.isUniqueStaff || item.isUniqueSword || item.isUniqueSingularity || item.isUniqueMaelstrom || item.isUniqueAegis || item.isUniqueWatch || item.isUniqueChronicle || item.isUniqueWarpCore || item.isUniqueTempest;
    if (!isUnique) return null;

    let bg = ""; let border = ""; let shadow = ""; let glow = ""; let lore = "";

    if (item.isUniqueSword) {
        bg = "linear-gradient(135deg, #1f0303, #070000)"; border = "#960018"; shadow = "#5c000c"; glow = "rgba(150,0,24,0.4)";
        lore = `"Forged in the veins of the first red dragon, this blade sings a silent, thirsty song. It does not merely cut flesh; it harvests the soul's very current."`;
    } else if (item.isUniqueStaff) {
        bg = "linear-gradient(135deg, #1c0e00, #070200)"; border = "#e67e22"; shadow = "#853c00"; glow = "rgba(230,126,34,0.4)";
        lore = `"Born of a feather plucked from the solar phoenix, its core burns with the warmth of a thousand dying suns. Even in the deepest cold of the void, its fire never falters."`;
    } else if (item.isUniqueSingularity) {
        bg = "linear-gradient(135deg, #150326, #030008)"; border = "#8e44ad"; shadow = "#510a74"; glow = "rgba(142,68,173,0.4)";
        lore = `"This colossal blade harbors the core of a collapsed dying star, pulling the surrounding space into a constant state of gravitational collapse."`;
    } else if (item.isUniqueMaelstrom) {
        bg = "linear-gradient(135deg, #031d0d, #010803)"; border = "#2ecc71"; shadow = "#145a32"; glow = "rgba(46,204,113,0.4)";
        lore = `"Whispers of forgotten gales dance along its razor edge, gathering strength with every swing until the wind itself becomes a solid, cutting force."`;
    } else if (item.isUniqueAegis) {
        bg = "linear-gradient(135deg, #021a2c, #00080f)"; border = "#3498db"; shadow = "#1a5276"; glow = "rgba(52,152,219,0.4)";
        lore = `"A shield constructed of hyper-dense matter harvested from the Event Horizon. It bends local gravity fields to completely arrest kinetic impacts."`;
    } else if (item.isUniqueWatch) {
        bg = "linear-gradient(135deg, #221c03, #0a0800)"; border = "#f1c40f"; shadow = "#7d6608"; glow = "rgba(241,196,15,0.4)";
        lore = `"A complex clockwork matrix that acts as a localized anchor in time. It beats in harmony with your lifeline, stretching fractions of seconds."`;
    } else if (item.isUniqueChronicle) {
        bg = "linear-gradient(135deg, #1f1b0a, #0b0903)"; border = "#f39c12"; shadow = "#7e5109"; glow = "rgba(243,156,18,0.4)";
        lore = `"An ancient, soul-bound lexicon recording every rise and fall of your past incarnations. To read its pages is to remember power long forgotten."`;
    } else if (item.isUniqueWarpCore) {
        bg = "linear-gradient(135deg, #001a1a, #000707)"; border = "#1abc9c"; shadow = "#0e6251"; glow = "rgba(26,188,156,0.4)";
        lore = `"Fitted with micro-singularity thrusters that distort spatial geometry directly ahead of your stride, allowing you to cross landscapes in a single heartbeat."`;
    } else if (item.isUniqueTempest) {
        bg = "linear-gradient(135deg, #03212c, #000c0f)"; border = "#00d2ff"; shadow = "#005077"; glow = "rgba(0,210,255,0.4)";
        lore = `"Stolen from the peaks of the Storm-Warden's spire, this circlet channels wild static friction, responding to bodily trauma with localized lightning strikes."`;
    }
    return { bg, border, shadow, glow, lore };
};

// --- PROCEDURAL GENERATOR ENGINE ---

window.createItemObject = function(chosenType, statLinesCount, stageScale, minStars = 0, allowedTraits = null) {
    let isArt = (chosenType === "artifact");
    if (!isArt && statLinesCount < minStars) { statLinesCount = minStars; }

    let item = {
        id: window.idCounter++, name: "", type: chosenType, statsRolled: isArt ? "UNIQUE" : statLinesCount, temperLevel: 0, stageLevel: stageScale,
        atk: 0, maxHp: 0, def: 0, moveSpeed: 0, critChance: 0, critDamage: 0, block: 0, parry: 0, dropRate: 0, quality: 0, goldMulti: 0, rareSpawn: 0, fairySpawn: 0,
        activeAttackSpeed: 0, idleAttackSpeed: 0,
        baseAtk: 0, baseMaxHp: 0, baseDef: 0, baseMoveSpeed: 0, baseBlock: 0, baseParry: 0,
        bonusAtk: 0, bonusMaxHp: 0, bonusDef: 0, bonusMoveSpeed: 0, bonusCritChance: 0, bonusCritDamage: 0, bonusBlock: 0, bonusParry: 0,
        bonusActiveSpeed: 0, bonusIdleSpeed: 0,
        bonusStr: 0, bonusDex: 0, bonusInt: 0, str: 0, dex: 0, int: 0,
        trait: null, desc: "", breakdown: "", noun: "", setName: null
    };

    if (chosenType === "subweapon") {
        const subTypes = ["shield", "dagger", "tome"];
        item.subType = subTypes[Math.floor(Math.random() * subTypes.length)];
    }

    if (!isArt) {
        let nounList = window.slotNouns[chosenType];
        if (chosenType === "subweapon") { nounList = window.slotNouns.subweapon[item.subType]; }
        item.noun = nounList ? nounList[Math.floor(Math.random() * nounList.length)] : chosenType.toUpperCase();
    }

    let prestigeMult = Math.pow(1.08, window.playerStats.prestigeCount || 0);
    let expScale = Math.pow(1.06, stageScale * 10);

    // Apply baseline attribute values matching slot configurations (Slot-Specific Base Stats)
    if (!isArt) {
        if (chosenType === "weapon") {
            item.baseAtk = Math.ceil(1.5 * expScale * prestigeMult);
        } else if (chosenType === "chest" || chosenType === "overall") {
            item.baseDef = Math.ceil(2.0 * expScale * prestigeMult);
            item.baseMaxHp = Math.ceil(10.0 * expScale * prestigeMult);
        } else if (chosenType === "helmet" || chosenType === "leggings") {
            item.baseDef = Math.ceil(1.0 * expScale * prestigeMult);
            item.baseMaxHp = Math.ceil(5.0 * expScale * prestigeMult);
        } else if (chosenType === "boots") {
            item.baseDef = Math.ceil(0.5 * expScale * prestigeMult);
            item.baseMoveSpeed = Math.ceil(1.0 * stageScale * prestigeMult);
        } else if (chosenType === "subweapon") {
            if (item.subType === "shield") {
                item.baseDef = Math.ceil(1.5 * expScale * prestigeMult);
            } else if (item.subType === "dagger") {
                item.baseAtk = Math.ceil(0.8 * expScale * prestigeMult);
            } else if (item.subType === "tome") {
                item.baseInt = Math.ceil(1.5 * stageScale * prestigeMult);
            }
        }
    }

    if (isArt) {
        let filterPool = window.ARTIFACT_POOL;
        if (allowedTraits && allowedTraits.length > 0) {
            filterPool = window.ARTIFACT_POOL.filter(a => allowedTraits.includes(a.trait));
            if (filterPool.length === 0) filterPool = window.ARTIFACT_POOL;
        }
        let chosenArt = filterPool[Math.floor(Math.random() * filterPool.length)];
        item.name = `⭐ UNIQUE ${chosenArt.name} (Lv. ${stageScale})`;
        item.trait = chosenArt.trait; item.desc = chosenArt.desc; item.breakdown = chosenArt.breakdown;
        item.statsRolled = "UNIQUE";
        item.baseAtk = chosenArt.atk || 0; item.baseMaxHp = chosenArt.maxHp || 0; item.baseDef = chosenArt.def || 0;
        item.baseMoveSpeed = chosenArt.moveSpeed || 0; item.baseCritChance = chosenArt.critChance || 0; item.bonusCritDamage = chosenArt.critDamage || 0;
        item.baseBlock = chosenArt.block || 0; item.baseParry = chosenArt.parry || 0;
        item.bonusActiveSpeed = chosenArt.activeAttackSpeed || 0; item.bonusIdleSpeed = chosenArt.idleAttackSpeed || 0;
        item.dropRate = chosenArt.dropRate || 0; item.quality = chosenArt.quality || 0; item.goldMulti = chosenArt.goldMulti || 0;
        item.rareSpawn = chosenArt.rareSpawn || 0; item.fairySpawn = chosenArt.fairySpawn || 0;
        item.baseStr = chosenArt.str || 0; item.baseDex = chosenArt.dex || 0; item.baseInt = chosenArt.int || 0;
        statLinesCount = 3;
    }

    // Determine target pool configuration matching this slot type (Slot-Specific Pools)
    let pool = [];
    if (isArt) {
        pool = ["dropRate", "quality", "goldMulti", "rareSpawn", "fairySpawn", "str", "dex", "int"];
    } else if (chosenType === "weapon") {
        pool = ["atk", "critChance", "critDamage", "str", "dex", "activeSpd", "idleSpd"];
    } else if (chosenType === "chest" || chosenType === "overall") {
        pool = ["def", "maxHp", "str", "int", "block", "parry"];
    } else if (chosenType === "helmet") {
        pool = ["def", "maxHp", "int", "dex", "critChance", "activeSpd", "idleSpd"];
    } else if (chosenType === "leggings") {
        pool = ["def", "maxHp", "str", "dex", "block", "parry"];
    } else if (chosenType === "boots") {
        pool = ["moveSpeed", "def", "maxHp", "dex", "idleSpd", "activeSpd"];
    } else if (chosenType === "subweapon") {
        if (item.subType === "shield") pool = ["block", "atk", "maxHp", "def", "str", "moveSpeed", "dex"];
        else if (item.subType === "dagger") pool = ["parry", "atk", "critChance", "dex", "moveSpeed", "str"];
        else if (item.subType === "tome") pool = ["critDamage", "int", "activeSpd", "idleSpd", "maxHp", "critChance"];
    }

    pool.sort(() => Math.random() - 0.5);
    let rarityMult = isArt ? 1.45 : (1 + (statLinesCount * 0.15));
    if (chosenType === "overall") rarityMult *= 1.8;
    let actualStatLines = isArt ? 3 : (statLinesCount + 1);

    for (let i = 0; i < actualStatLines; i++) {
        if (pool.length === 0) break;
        let selectedStat = pool.pop();
        if (selectedStat === "atk") item.bonusAtk += Math.ceil(window.randInt(1, 2) * expScale * rarityMult * prestigeMult);
        else if (selectedStat === "maxHp") item.bonusMaxHp += Math.ceil(window.randInt(3, 8) * expScale * rarityMult * prestigeMult);
        else if (selectedStat === "def") item.bonusDef += Math.ceil(window.randInt(1, 2) * expScale * rarityMult * prestigeMult);
        else if (selectedStat === "moveSpeed") item.bonusMoveSpeed += Math.ceil(window.randInt(1, 2) * stageScale * rarityMult * prestigeMult);
        else if (selectedStat === "critChance") {
            let rolled = window.randFloat(0.01, 0.025) * Math.sqrt(stageScale) * rarityMult * prestigeMult;
            item.bonusCritChance += parseFloat(Math.min(0.20, rolled).toFixed(4));
        }
        else if (selectedStat === "critDamage") {
            let rolled = window.randFloat(0.03, 0.06) * Math.sqrt(stageScale) * rarityMult * prestigeMult;
            item.bonusCritDamage += parseFloat(rolled.toFixed(4));
        }
        else if (selectedStat === "block") {
            let rolled = window.randFloat(0.005, 0.015) * Math.sqrt(stageScale) * rarityMult * prestigeMult;
            item.bonusBlock += parseFloat(Math.min(0.15, rolled).toFixed(4));
        }
        else if (selectedStat === "parry") {
            let rolled = window.randFloat(0.005, 0.015) * Math.sqrt(stageScale) * rarityMult * prestigeMult;
            item.bonusParry += parseFloat(Math.min(0.15, rolled).toFixed(4));
        }
        else if (selectedStat === "activeSpd") {
            let sScale = Math.pow(stageScale, 0.3); let rMult = 1 + (statLinesCount * 0.08); let pMult = Math.pow(1.02, window.playerStats.prestigeCount || 0);
            item.bonusActiveSpeed += parseFloat((window.randFloat(0.01, 0.03) * sScale * rMult * pMult).toFixed(4));
        }
        else if (selectedStat === "idleSpd") {
            let sScale = Math.pow(stageScale, 0.3); let rMult = 1 + (statLinesCount * 0.08); let pMult = Math.pow(1.02, window.playerStats.prestigeCount || 0);
            item.bonusIdleSpeed += parseFloat((window.randFloat(0.01, 0.03) * sScale * rMult * pMult).toFixed(4));
        }
        else if (selectedStat === "str") item.bonusStr += Math.ceil(window.randInt(1, 3) * stageScale * rarityMult * prestigeMult);
        else if (selectedStat === "dex") item.bonusDex += Math.ceil(window.randInt(1, 3) * stageScale * rarityMult * prestigeMult);
        else if (selectedStat === "int") item.bonusInt += Math.ceil(window.randInt(1, 3) * stageScale * rarityMult * prestigeMult);
        else if (selectedStat === "dropRate") item.dropRate += parseFloat((window.randFloat(0.02, 0.05) * rarityMult * prestigeMult).toFixed(4));
        else if (selectedStat === "quality") item.quality += parseFloat((window.randFloat(0.01, 0.03) * rarityMult * prestigeMult).toFixed(4));
        else if (selectedStat === "goldMulti") item.goldMulti += parseFloat((window.randFloat(0.02, 0.05) * rarityMult * prestigeMult).toFixed(4));
        else if (selectedStat === "rareSpawn") item.rareSpawn += parseFloat((window.randFloat(0.002, 0.006) * rarityMult * prestigeMult).toFixed(4));
        else if (selectedStat === "fairySpawn") item.fairySpawn += parseFloat((window.randFloat(0.02, 0.06) * rarityMult * prestigeMult).toFixed(4));
    }

    item.atk = (item.baseAtk || 0) + item.bonusAtk; item.maxHp = (item.baseMaxHp || 0) + item.bonusMaxHp; item.def = (item.baseDef || 0) + item.bonusDef;
            item.moveSpeed = (item.baseMoveSpeed || 0) + item.bonusMoveSpeed; item.critChance = (item.baseCritChance || 0) + item.bonusCritChance;
            item.critDamage = item.bonusCritDamage; item.block = (item.baseBlock || 0) + item.bonusBlock; item.parry = (item.baseParry || 0) + item.bonusParry;
            item.str = (item.baseStr || 0) + item.bonusStr; item.dex = (item.baseDex || 0) + item.bonusDex; item.int = (item.baseInt || 0) + item.bonusInt;
        item.activeAttackSpeed = item.bonusActiveSpeed; item.idleAttackSpeed = item.bonusIdleSpeed;

        if (!isArt) {
            let isDungeon = window.playerStats.isDungeonMode;
            let isBoss = window.playerStats.isBossMode || window.playerStats.isUberBoss;
            let isRare = window.mob ? !!window.mob.isRare : false;
            item.setName = window.rollSetForItem(isBoss, isRare, isDungeon, window.playerStats.currentDungeon);
        }

        if (statLinesCount === 5 && !isArt) {
        if (Math.random() < 0.005) {
            if (chosenType === "weapon") {
                let weapons = ["staff", "sword", "singularity", "maelstrom"];
                let selected = weapons[Math.floor(Math.random() * weapons.length)];
                item.setName = null;
                if (selected === "staff") { item.isUniqueStaff = true; item.noun = "Phoenix Staff"; item.name = `🔥 Phoenix Ignition Staff (Lv. ${stageScale})`; item.desc = "Launches penetrating fireballs that deal 25% Attack damage (3s Cooldown)."; }
                else if (selected === "sword") { item.isUniqueSword = true; item.noun = "Sanguine Reaver"; item.name = `🩸 Crimson Sanguine Reaver (Lv. ${stageScale})`; item.desc = "Strikes apply stacking Bleed (Max 5). Strikes at max stacks triggers Rupture, dealing 300% weapon damage and siphoning 10% Max HP."; }
                else if (selected === "singularity") { item.isUniqueSingularity = true; item.noun = "Singularity Greatsword"; item.name = `🌌 Void-Sovereign Greatsword (Lv. ${stageScale})`; item.desc = "Glows for 7s every 30s. Tap during window to enter 5s Storing state, then detonates spatial collapse."; }
                else if (selected === "maelstrom") { item.isUniqueMaelstrom = true; item.noun = "Maelstrom Glaive"; item.name = `🌪️ Maelstrom Gale-Glaive (Lv. ${stageScale})`; item.desc = "Excess overkill damage cleaves onto next spawn. Critical strikes have 25% chance to project piercing gales."; }
            } else if (chosenType === "subweapon") {
                let subOptions = ["aegis", "watch", "chronicle"];
                let selected = subOptions[Math.floor(Math.random() * subOptions.length)];
                item.setName = null;
                if (selected === "aegis") { item.subType = "shield"; item.isUniqueAegis = true; item.noun = "Void-Warped Aegis"; item.name = `🛡️ Void-Warped Bulwark (Lv. ${stageScale})`; item.desc = "Blocks trigger gravity blasts scaling with Defense. Can be absorbed into Singularity vortex."; }
                else if (selected === "watch") { item.subType = "tome"; item.isUniqueWatch = true; item.noun = "Chronos Pocket-Watch"; item.name = `⏳ Chronos Dial-Watch (Lv. ${stageScale})`; item.desc = "Triggers 4s Temporal Fracture every 20s. Accelerates attack speeds by 15% and slows enemies by 25%."; }
                else if (selected === "chronicle") { item.subType = "tome"; item.isUniqueChronicle = true; item.noun = "Chronicle of the Ascended"; item.name = `📖 Chronicle of past Lives (Lv. ${stageScale})`; item.desc = "Boosts XP gain by +200% and bypasses level locks while below 75% peak level."; }
            } else if (chosenType === "boots") { item.isUniqueWarpCore = true; item.noun = "Warp-Core Greaves"; item.name = `⚡ Warp-Core Greaves (Lv. ${stageScale})`; item.desc = "While below 85% Peak Stage: +150% sprint speed, and kills count as 2."; }
            else if (chosenType === "helmet") { item.isUniqueTempest = true; item.noun = "Crown of Tempests"; item.name = `👑 Crown of crackling Tempests (Lv. ${stageScale})`; item.desc = "Taking damage has 15% chance to call thunderbolt dealing 150% Attack power and stuns."; }
        }
    }

    if (!item.isUniqueStaff && !item.isUniqueSword && !item.isUniqueSingularity && !item.isUniqueMaelstrom && !item.isUniqueAegis && !item.isUniqueWatch && !item.isUniqueChronicle && !item.isUniqueWarpCore && !item.isUniqueTempest) {
        item.name = window.buildProceduralName(item);
    }
    return item;
};

window.buildProceduralName = function(item) {
    if (item.statsRolled === "UNIQUE") return item.name;
    let stars = item.statsRolled;
    let prefix = window.getTierName(stars);

    const nomenclature = {
        bonusAtk: "Vanguard", bonusMaxHp: "Colossus", bonusDef: "Bastion", bonusMoveSpeed: "Windrunner",
        bonusCritChance: "Wraith", bonusCritDamage: "Reaver", bonusBlock: "Dreadnought", bonusParry: "Duellist",
        bonusStr: "Berserker", bonusDex: "Scout", bonusInt: "Scholar"
    };

    let themeName = "Standard";
    if (stars > 0) {
        let highestKey = null; let maxVal = -1;
        Object.keys(nomenclature).forEach(k => { if (item[k] > maxVal) { maxVal = item[k]; highestKey = k; } });
        if (highestKey) themeName = nomenclature[highestKey];
    }

    return `${prefix} ${themeName} ${item.noun} (Lv. ${item.stageLevel})`;
};

// --- STAT RANGES & PREVIEWS ---

window.getStatBaseRange = function(item, statKey) {
    let stageLevel = item.stageLevel || 1;
    let isArt = item.type === "artifact";
    let rarityMult = isArt ? 1.45 : (1 + ((item.statsRolled || 0) * 0.15));
    let expScale = Math.pow(1.06, stageLevel * 10);

    let min = 0; let max = 0;

    if (statKey === "atk" && (item.bonusAtk > 0 || item.type === "weapon" || isArt)) {
        min += Math.ceil(1 * expScale * rarityMult); max += Math.ceil(2 * expScale * rarityMult);
    } else if (statKey === "maxHp" && (item.bonusMaxHp > 0 || isArt)) {
        min += Math.ceil(3 * expScale * rarityMult); max += Math.ceil(8 * expScale * rarityMult);
    } else if (statKey === "def" && (item.bonusDef > 0 || isArt)) {
        min += Math.ceil(1 * expScale * rarityMult); max += Math.ceil(2 * expScale * rarityMult);
    } else if (statKey === "moveSpeed" && item.bonusMoveSpeed > 0) {
        min += Math.ceil(1 * stageLevel * rarityMult); max += Math.ceil(2 * stageLevel * rarityMult);
    } else if (statKey === "str" && (item.bonusStr > 0 || isArt)) {
        min += Math.ceil(1 * stageLevel * rarityMult); max += Math.ceil(3 * stageLevel * rarityMult);
    } else if (statKey === "dex" && (item.bonusDex > 0 || isArt)) {
        min += Math.ceil(1 * stageLevel * rarityMult); max += Math.ceil(3 * stageLevel * rarityMult);
    } else if (statKey === "int" && (item.bonusInt > 0 || isArt)) {
        min += Math.ceil(1 * stageLevel * rarityMult); max += Math.ceil(3 * stageLevel * rarityMult);
    } else if (statKey === "critChance" && item.bonusCritChance > 0) {
        min += 0.01 * Math.sqrt(stageLevel) * rarityMult; max += 0.025 * Math.sqrt(stageLevel) * rarityMult;
    } else if (statKey === "critDamage" && item.bonusCritDamage > 0) {
        min += 0.03 * Math.sqrt(stageLevel) * rarityMult; max += 0.06 * Math.sqrt(stageLevel) * rarityMult;
    } else if (statKey === "block" && item.bonusBlock > 0) {
        min += 0.005 * Math.sqrt(stageLevel) * rarityMult; max += 0.015 * Math.sqrt(stageLevel) * rarityMult;
    } else if (statKey === "parry" && item.bonusParry > 0) {
        min += 0.005 * Math.sqrt(stageLevel) * rarityMult; max += 0.015 * Math.sqrt(stageLevel) * rarityMult;
    } else if (statKey === "activeAttackSpeed" && item.bonusActiveSpeed > 0) {
        let sScale = Math.pow(stageLevel, 0.3); let rMult = 1 + (item.statsRolled * 0.08);
        min += 0.01 * sScale * rMult; max += 0.03 * sScale * rMult;
    } else if (statKey === "idleAttackSpeed" && item.bonusIdleSpeed > 0) {
        let sScale = Math.pow(stageLevel, 0.3); let rMult = 1 + (item.statsRolled * 0.08);
        min += 0.01 * sScale * rMult; max += 0.03 * sScale * rMult;
    } else if (statKey === "rareSpawn" && item.rareSpawn > 0) {
        min += 0.002 * rarityMult; max += 0.006 * rarityMult;
    } else if (statKey === "dropRate" && item.dropRate > 0) {
        min += 0.02 * rarityMult; max += 0.05 * rarityMult;
    } else if (statKey === "quality" && item.quality > 0) {
        min += 0.01 * rarityMult; max += 0.03 * rarityMult;
    } else if (statKey === "goldMulti" && item.goldMulti > 0) {
        min += 0.02 * rarityMult; max += 0.05 * rarityMult;
    } else if (statKey === "fairySpawn" && item.fairySpawn > 0) {
        min += 0.02 * rarityMult; max += 0.06 * rarityMult;
    }

    const unscaledStats = ["activeAttackSpeed", "idleAttackSpeed"];
    if (!unscaledStats.includes(statKey)) {
        let prestigeMult = Math.pow(1.08, window.playerStats.prestigeCount || 0);
        min *= prestigeMult; max *= prestigeMult;
    }

    let tempers = item.temperLevel || 0;
    if (tempers > 0) {
        if (isArt) {
            if (statKey === "atk") { min += tempers * 5; max += tempers * 5; }
            else if (statKey === "maxHp") { min += tempers * 30; max += tempers * 30; }
            else if (statKey === "def") { min += tempers * 3; max += tempers * 3; }
        } else {
            if (["atk", "maxHp", "def", "str", "dex", "int", "activeAttackSpeed", "idleAttackSpeed"].includes(statKey)) {
                let multiplier = 1 + (tempers * 0.04);
                min *= multiplier; max *= multiplier;
            }
            if (statKey === "moveSpeed") { min += tempers; max += tempers; }
            else if (statKey === "str" || statKey === "dex" || statKey === "int") { min += tempers; max += tempers; }
            else if (statKey === "critChance") { min += tempers * 0.005; max += tempers * 0.005; }
            else if (statKey === "critDamage") { min += tempers * 0.015; max += tempers * 0.015; }
            else if (statKey === "block") { min += tempers * 0.005; max += tempers * 0.005; }
            else if (statKey === "parry") { min += tempers * 0.005; max += tempers * 0.005; }
            else if (statKey === "dropRate") { min += tempers * 0.01; max += tempers * 0.01; }
            else if (statKey === "quality") { min += tempers * 0.005; max += tempers * 0.005; }
            else if (statKey === "goldMulti") { min += tempers * 0.01; max += tempers * 0.01; }
            else if (statKey === "fairySpawn") { min += tempers * 0.01; max += tempers * 0.01; }
        }
    }

    if (item.enchantments && item.enchantments[statKey]) {
        let count = item.enchantments[statKey];
        let multiplier = Math.pow(1.25, count);
        min *= multiplier; max *= multiplier;
    }

    return { min, max };
};

window.formatStatRangeStr = function(item, statKey, isPct = false) {
    let range = window.getStatBaseRange(item, statKey);
    if (range.min === 0 && range.max === 0) return "";

    let minStr, maxStr;
    if (statKey === "rareSpawn") {
        minStr = (range.min * 100).toFixed(2) + "%";
        maxStr = (range.max * 100).toFixed(2) + "%";
    } else if (isPct) {
        minStr = Math.floor(range.min * 100) + "%";
        maxStr = Math.floor(range.max * 100) + "%";
    } else if (statKey === "activeAttackSpeed" || statKey === "idleAttackSpeed") {
        minStr = Math.round(range.min * 100) + "%";
        maxStr = Math.round(range.max * 100) + "%";
    } else if (["dropRate", "quality", "goldMulti", "fairySpawn"].includes(statKey)) {
        minStr = Math.floor(range.min * 100) + "%";
        maxStr = Math.floor(range.max * 100) + "%";
    } else {
        minStr = Math.round(range.min).toLocaleString();
        maxStr = Math.round(range.max).toLocaleString();
    }

    if (minStr === maxStr) {
        return ` <span style="color:#7f8c8d; font-size:9px;">[${minStr}]</span>`;
    }

    return ` <span style="color:#7f8c8d; font-size:9px;">[${minStr} - ${maxStr}]</span>`;
};

window.scaleItemBonusStats = function(item, oldStars, newStars) {
    if (item.type === "artifact" || oldStars === "UNIQUE" || newStars === "UNIQUE") return;
    let oldMult = 1 + (oldStars * 0.15);
    let newMult = 1 + (newStars * 0.15);
    let ratio = newMult / oldMult;

    const scaleKeys = [
        "bonusAtk", "bonusMaxHp", "bonusDef", "bonusMoveSpeed",
        "bonusCritChance", "bonusCritDamage", "bonusBlock", "bonusParry",
        "bonusStr", "bonusDex", "bonusInt", "bonusActiveSpeed", "bonusIdleSpeed"
    ];

    scaleKeys.forEach(k => {
        if (item[k]) {
            if (["bonusCritChance", "bonusCritDamage", "bonusBlock", "bonusParry"].includes(k)) {
                item[k] = parseFloat((item[k] * ratio).toFixed(4));
            } else if (["bonusActiveSpeed", "bonusIdleSpeed"].includes(k)) {
                item[k] = Math.floor(item[k] * ratio);
            } else {
                item[k] = Math.ceil(item[k] * ratio);
            }
        }
    });
};

window.recalculateItemStats = function(item) {
    item.bonusAtk = item.bonusAtk || 0;
    item.bonusMaxHp = item.bonusMaxHp || 0;
    item.bonusDef = item.bonusDef || 0;
    item.bonusMoveSpeed = item.bonusMoveSpeed || 0;
    item.bonusCritChance = item.bonusCritChance || 0;
    item.bonusCritDamage = item.bonusCritDamage || 0;
    item.bonusBlock = item.bonusBlock || 0;
    item.bonusParry = item.bonusParry || 0;
    item.bonusActiveSpeed = item.bonusActiveSpeed || 0;
    item.bonusIdleSpeed = item.bonusIdleSpeed || 0;
    item.bonusStr = item.bonusStr || 0;
    item.bonusDex = item.bonusDex || 0;
    item.bonusInt = item.bonusInt || 0;

    let expScale = Math.pow(1.06, (item.stageLevel || 1) * 10);
    let prestigeCount = window.playerStats.prestigeCount || 0;
    let prestigeMult = Math.pow(1.08, prestigeCount);

    // Dynamic base scaling transitions for standard slot configurations
    if (item.type !== "artifact" && item.statsRolled !== "UNIQUE") {
        if (item.type === "weapon" && !item.isUniqueStaff && !item.isUniqueSword && !item.isUniqueSingularity && !item.isUniqueMaelstrom) {
            item.baseAtk = Math.ceil(1.5 * expScale * prestigeMult);
        } else if (item.type === "chest" || item.type === "overall") {
            item.baseDef = Math.ceil(2.0 * expScale * prestigeMult);
            item.baseMaxHp = Math.ceil(10.0 * expScale * prestigeMult);
        } else if (item.type === "helmet" && !item.isUniqueTempest) {
            item.baseDef = Math.ceil(1.0 * expScale * prestigeMult);
            item.baseMaxHp = Math.ceil(5.0 * expScale * prestigeMult);
        } else if (item.type === "leggings") {
            item.baseDef = Math.ceil(1.0 * expScale * prestigeMult);
            item.baseMaxHp = Math.ceil(5.0 * expScale * prestigeMult);
        } else if (item.type === "boots" && !item.isUniqueWarpCore) {
            item.baseDef = Math.ceil(0.5 * expScale * prestigeMult);
            item.baseMoveSpeed = Math.ceil(1.0 * (item.stageLevel || 1) * prestigeMult);
        } else if (item.type === "subweapon" && !item.isUniqueAegis && !item.isUniqueWatch && !item.isUniqueChronicle) {
            if (item.subType === "shield") {
                item.baseDef = Math.ceil(1.5 * expScale * prestigeMult);
            } else if (item.subType === "dagger") {
                item.baseAtk = Math.ceil(0.8 * expScale * prestigeMult);
            } else if (item.subType === "tome") {
                item.baseInt = Math.ceil(1.5 * (item.stageLevel || 1) * prestigeMult);
            }
        }
    } else if (item.type === "artifact") {
        // Artifact parameters are managed statically on drop; preserve them as is
    } else {
        // Recalculate unique item specific base structures
        if (item.isUniqueSingularity || item.isUniqueMaelstrom) {
            item.baseAtk = Math.ceil(3.5 * expScale * Math.pow(1.08, prestigeCount));
        } else if (item.isUniqueAegis) {
            item.baseDef = Math.ceil(14 * expScale * Math.pow(1.08, prestigeCount));
            item.baseBlock = 0.05 * (item.stageLevel || 1);
        } else if (item.isUniqueWatch || item.isUniqueChronicle) {
            item.baseInt = Math.ceil(2.5 * (item.stageLevel || 1) * Math.pow(1.08, prestigeCount));
        } else if (item.isUniqueWarpCore) {
            item.baseMoveSpeed = Math.ceil(3 * (item.stageLevel || 1) * Math.pow(1.08, prestigeCount));
        } else if (item.isUniqueTempest) {
            item.baseMaxHp = Math.ceil(20 * expScale * Math.pow(1.08, prestigeCount));
            item.baseDef = Math.ceil(6 * expScale * Math.pow(1.08, prestigeCount));
        }
    }

    item.atk = (item.baseAtk || 0) + item.bonusAtk;
    item.maxHp = (item.baseMaxHp || 0) + item.bonusMaxHp;
    item.def = (item.baseDef || 0) + item.bonusDef;
    item.moveSpeed = (item.baseMoveSpeed || 0) + item.bonusMoveSpeed;
    item.critChance = (item.baseCritChance || 0) + item.bonusCritChance;
    item.critDamage = (item.baseCritDamage || 0) + item.bonusCritDamage;
    item.block = (item.baseBlock || 0) + item.bonusBlock;
    item.parry = (item.baseParry || 0) + item.bonusParry;
    item.activeAttackSpeed = (item.baseActiveSpeed || 0) + item.bonusActiveSpeed;
    item.idleAttackSpeed = (item.baseIdleSpeed || 0) + item.bonusIdleSpeed;
    item.str = (item.baseStr || 0) + item.bonusStr;
    item.dex = (item.baseDex || 0) + item.bonusDex;
    item.int = (item.baseInt || 0) + item.bonusInt;

    let tempers = item.temperLevel || 0;
    if (tempers > 0) {
        let isArt = item.type === "artifact";
        if (isArt) {
            item.atk += tempers * 5; item.maxHp += tempers * 30; item.def += tempers * 3;
            item.str += tempers; item.dex += tempers; item.int += tempers;
        } else {
            let multiplier = 1 + (tempers * 0.04);
            if (item.atk > 0 || item.type === "weapon") item.atk = Math.round(item.atk * multiplier);
            if (item.maxHp > 0) item.maxHp = Math.round(item.maxHp * multiplier);
            if (item.def > 0) item.def = Math.round(item.def * multiplier);
            if (item.str > 0) item.str = Math.round(item.str * multiplier);
            if (item.dex > 0) item.dex = Math.round(item.dex * multiplier);
            if (item.int > 0) item.int = Math.round(item.int * multiplier);
        }

        if (item.moveSpeed > 0) item.moveSpeed += tempers;
        if (item.critChance > 0) item.critChance = parseFloat((item.critChance + tempers * 0.005).toFixed(4));
        if (item.critDamage > 0) item.critDamage = parseFloat((item.critDamage + tempers * 0.015).toFixed(4));
        if (item.block > 0) item.block = parseFloat((item.block + tempers * 0.005).toFixed(4));
        if (item.parry > 0) item.parry = parseFloat((item.parry + tempers * 0.005).toFixed(4));
        if (item.dropRate > 0) item.dropRate = parseFloat((item.dropRate + tempers * 0.01).toFixed(4));
        if (item.quality > 0) item.quality = parseFloat((item.quality + tempers * 0.005).toFixed(4));
        if (item.goldMulti > 0) item.goldMulti = parseFloat((item.goldMulti + tempers * 0.01).toFixed(4));
        if (item.rareSpawn > 0) item.rareSpawn = parseFloat((item.rareSpawn + tempers * 0.001).toFixed(4));
        if (item.fairySpawn > 0) item.fairySpawn = parseFloat((item.fairySpawn + tempers * 0.01).toFixed(4));
        if (item.activeAttackSpeed > 0) item.activeAttackSpeed = parseFloat((item.bonusActiveSpeed * (1 + tempers * 0.04)).toFixed(4));
        if (item.idleAttackSpeed > 0) item.idleAttackSpeed = parseFloat((item.bonusIdleSpeed * (1 + tempers * 0.04)).toFixed(4));
    }

    if (item.enchantments) {
        for (let statKey in item.enchantments) {
            let count = item.enchantments[statKey];
            let multiplier = Math.pow(1.25, count);
            const integerStats = ["atk", "maxHp", "def", "str", "dex", "int"];
            if (integerStats.includes(statKey)) {
                item[statKey] = Math.ceil(item[statKey] * multiplier);
            } else if (statKey === "activeAttackSpeed" || statKey === "idleAttackSpeed") {
                item[statKey] = Math.floor(item[statKey] * multiplier);
            } else {
                item[statKey] = parseFloat((item[statKey] * multiplier).toFixed(4));
            }
        }
    }
};

window.addRandomStatLineToItem = function(item) {
    let pool = ["critChance", "critDamage", "block", "parry", "atk", "maxHp", "def", "moveSpeed", "activeSpd", "idleSpd", "str", "dex", "int"];
    if (item.type === "subweapon") {
        if (item.subType === "shield") pool = ["block", "atk", "maxHp", "def", "str"];
        else if (item.subType === "dagger") pool = ["parry", "atk", "critChance", "dex"];
        else if (item.subType === "tome") pool = ["critDamage", "int", "activeSpd", "idleSpd"];
    }

    pool = pool.filter(stat => {
        if (stat === "atk" && item.bonusAtk > 0) return false;
        if (stat === "maxHp" && item.bonusMaxHp > 0) return false;
        if (stat === "def" && item.bonusDef > 0) return false;
        if (stat === "moveSpeed" && item.bonusMoveSpeed > 0) return false;
        if (stat === "critChance" && item.bonusCritChance > 0) return false;
        if (stat === "critDamage" && item.bonusCritDamage > 0) return false;
        if (stat === "block" && item.bonusBlock > 0) return false;
        if (stat === "parry" && item.bonusParry > 0) return false;
        if (stat === "activeSpd" && item.bonusActiveSpeed > 0) return false;
        if (stat === "idleSpd" && item.bonusIdleSpeed > 0) return false;
        if (stat === "str" && item.bonusStr > 0) return false;
        if (stat === "dex" && item.bonusDex > 0) return false;
        if (stat === "int" && item.bonusInt > 0) return false;
        return true;
    });

    if (pool.length === 0) {
        pool = ["critChance", "critDamage", "block", "parry", "atk", "maxHp", "def", "moveSpeed", "activeSpd", "idleSpd", "str", "dex", "int"];
    }

    let selectedStat = pool[Math.floor(Math.random() * pool.length)];
    let stageScale = item.stageLevel || 1;
    let expScale = Math.pow(1.06, stageScale * 10);
    let rarityMult = 1 + (item.statsRolled * 0.15);
    let prestigeMult = Math.pow(1.08, window.playerStats.prestigeCount || 0);

    if (selectedStat === "atk") item.bonusAtk += Math.ceil(window.randInt(1, 2) * expScale * rarityMult * prestigeMult);
    else if (selectedStat === "maxHp") item.bonusMaxHp += Math.ceil(window.randInt(3, 8) * expScale * rarityMult * prestigeMult);
    else if (selectedStat === "def") item.bonusDef += Math.ceil(window.randInt(1, 2) * expScale * rarityMult * prestigeMult);
    else if (selectedStat === "moveSpeed") item.bonusMoveSpeed += Math.ceil(window.randInt(1, 2) * stageScale * rarityMult * prestigeMult);
    else if (selectedStat === "critChance") {
        let rolled = window.randFloat(0.01, 0.025) * Math.sqrt(stageScale) * rarityMult * prestigeMult;
        item.bonusCritChance += parseFloat(Math.min(0.20, rolled).toFixed(4));
    } else if (selectedStat === "critDamage") {
        let rolled = window.randFloat(0.03, 0.06) * Math.sqrt(stageScale) * rarityMult * prestigeMult;
        item.bonusCritDamage += parseFloat(rolled.toFixed(4));
    } else if (selectedStat === "block") {
        let rolled = window.randFloat(0.005, 0.015) * Math.sqrt(stageScale) * rarityMult * prestigeMult;
        item.bonusBlock += parseFloat(Math.min(0.15, rolled).toFixed(4));
    } else if (selectedStat === "parry") {
        let rolled = window.randFloat(0.005, 0.015) * Math.sqrt(stageScale) * rarityMult * prestigeMult;
        item.bonusParry += parseFloat(Math.min(0.15, rolled).toFixed(4));
    } else if (selectedStat === "activeSpd") {
        item.bonusActiveSpeed += parseFloat((window.randFloat(0.04, 0.10) * Math.sqrt(stageScale) * rarityMult * prestigeMult).toFixed(4));
    } else if (selectedStat === "idleSpd") {
        item.bonusIdleSpeed += parseFloat((window.randFloat(0.04, 0.10) * Math.sqrt(stageScale) * rarityMult * prestigeMult).toFixed(4));
    } else if (selectedStat === "str") item.bonusStr += Math.ceil(window.randInt(1, 3) * stageScale * rarityMult * prestigeMult);
    else if (selectedStat === "dex") item.bonusDex += Math.ceil(window.randInt(1, 3) * stageScale * rarityMult * prestigeMult);
    else if (selectedStat === "int") item.bonusInt += Math.ceil(window.randInt(1, 3) * stageScale * rarityMult * prestigeMult);

    window.recalculateItemStats(item);
};

// --- INVENTORY LOCKS & EQUIP ACTIONS ---

window.toggleLock = function(id) {
    let item = window.inventory.EQUIP.find(i => i.id === id) || (window.inventory.ARTIFACT && window.inventory.ARTIFACT.find(i => i.id === id));
    if (!item) {
        for (let k in window.equippedSlots) {
            if (window.equippedSlots[k] && window.equippedSlots[k].id === id) { item = window.equippedSlots[k]; break; }
        }
    }
    if (item) {
        item.locked = !item.locked;
        if (typeof window.pushHeaderToast === "function") window.pushHeaderToast(item.locked ? "🔒 Item Locked!" : "🔓 Item Unlocked!", item.locked ? "#e74c3c" : "#2ecc71");
        if (typeof window.renderInventory === "function") window.renderInventory();
        if (typeof window.renderForgeTab === "function") window.renderForgeTab();
        if (typeof window.updateUI === "function") window.updateUI();
        if (typeof window.saveGame === "function") window.saveGame();
    }
};

window.equipItem = function(id) {
    if (typeof window.hideTooltip === "function") window.hideTooltip();
    let isArtifactSack = false;
    let index = window.inventory.EQUIP.findIndex(i => i.id === id);
    if (index === -1 && window.inventory.ARTIFACT) {
        index = window.inventory.ARTIFACT.findIndex(i => i.id === id);
        if (index !== -1) isArtifactSack = true;
    }
    if (index === -1) return;
    let item = isArtifactSack ? window.inventory.ARTIFACT[index] : window.inventory.EQUIP[index];

    let reqLvl = Math.max(1, ((item.stageLevel || 1) - 1) * 5 - (window.playerStats.prestigeCount || 0) * 2);
    if (window.playerStats.level < reqLvl && !window.playerStats.bypassGearLockActive) {
        if (typeof window.pushHeaderToast === "function") window.pushHeaderToast(`🔒 Requires Level ${reqLvl} to equip!`, "#e74c3c");
        return;
    }

    let oldMaxHp = 100;
    if (typeof window.resolvePlayerStats === "function") oldMaxHp = window.resolvePlayerStats().maxHp;

    if (item.type === "overall") {
        if (window.equippedSlots.chest) {
            delete window.equippedSlots.chest.isEquippedSlot;
            window.inventory.EQUIP.push(window.equippedSlots.chest); window.equippedSlots.chest = null;
        }
        if (window.equippedSlots.leggings) {
            delete window.equippedSlots.leggings.isEquippedSlot;
            window.inventory.EQUIP.push(window.equippedSlots.leggings); window.equippedSlots.leggings = null;
        }
        if (window.equippedSlots.overall) {
            delete window.equippedSlots.overall.isEquippedSlot;
            window.inventory.EQUIP.push(window.equippedSlots.overall);
        }
        window.equippedSlots.overall = item;
    } else if (item.type === "chest" || item.type === "leggings") {
        if (window.equippedSlots.overall) {
            delete window.equippedSlots.overall.isEquippedSlot;
            window.inventory.EQUIP.push(window.equippedSlots.overall); window.equippedSlots.overall = null;
        }
        if (window.equippedSlots[item.type]) {
            delete window.equippedSlots[item.type].isEquippedSlot;
            window.inventory.EQUIP.push(window.equippedSlots[item.type]);
        }
        window.equippedSlots[item.type] = item;
    } else if (item.type === "artifact") {
        if (!window.equippedSlots.art1) window.equippedSlots.art1 = item;
        else if (!window.equippedSlots.art2) window.equippedSlots.art2 = item;
        else {
            if (window.equippedSlots.art3) {
                delete window.equippedSlots.art3.isEquippedSlot;
                window.inventory.ARTIFACT.push(window.equippedSlots.art3);
            }
            window.equippedSlots.art3 = item;
        }
    } else {
        if (window.equippedSlots[item.type]) {
            delete window.equippedSlots[item.type].isEquippedSlot;
            window.inventory.EQUIP.push(window.equippedSlots[item.type]);
        }
        window.equippedSlots[item.type] = item;
    }

    if (isArtifactSack) {
        window.inventory.ARTIFACT.splice(index, 1);
    } else {
        window.inventory.EQUIP.splice(index, 1);
    }

    if (typeof window.resolvePlayerStats === "function") {
        let newMaxHp = window.resolvePlayerStats().maxHp;
        window.playerStats.currentHp = Math.max(1, Math.min(newMaxHp, Math.floor((window.playerStats.currentHp / oldMaxHp) * newMaxHp)));
    }

    if (typeof window.checkAchievements === "function") window.checkAchievements();
    if (typeof window.updateUI === "function") window.updateUI();
    if (typeof window.renderInventory === "function") window.renderInventory();
    if (typeof window.renderForgeTab === "function") window.renderForgeTab();
    if (typeof window.saveGame === "function") window.saveGame();
};

window.unequipItem = function(slotKey) {
    let maxBag = window.getMaxBagSlots ? window.getMaxBagSlots() : 20;
    if (typeof window.hideTooltip === "function") window.hideTooltip();
    let item = window.equippedSlots[slotKey];
    if (!item) return;

    delete item.isEquippedSlot;
    let oldMaxHp = 100;
    if (typeof window.resolvePlayerStats === "function") oldMaxHp = window.resolvePlayerStats().maxHp;

    if (item.type === "artifact") {
        if (window.inventory.ARTIFACT.length >= maxBag) {
            if (typeof window.pushHeaderToast === "function") window.pushHeaderToast(`Artifact Sack Full!`, "#e74c3c");
            return;
        }
        window.equippedSlots[slotKey] = null;
        window.inventory.ARTIFACT.push(item);
    } else {
        if (window.inventory.EQUIP.length >= maxBag) {
            if (typeof window.pushHeaderToast === "function") window.pushHeaderToast(`Inventory Full!`, "#e74c3c");
            return;
        }
        window.equippedSlots[slotKey] = null;
        window.inventory.EQUIP.push(item);
    }

    if (typeof window.resolvePlayerStats === "function") {
        let newMaxHp = window.resolvePlayerStats().maxHp;
        window.playerStats.currentHp = Math.max(1, Math.min(newMaxHp, Math.floor((window.playerStats.currentHp / oldMaxHp) * newMaxHp)));
    }

    if (typeof window.checkAchievements === "function") window.checkAchievements();
    if (typeof window.updateUI === "function") window.updateUI();
    if (typeof window.renderInventory === "function") window.renderInventory();
    if (typeof window.renderForgeTab === "function") window.renderForgeTab();
    if (typeof window.saveGame === "function") window.saveGame();
};

window.salvageItem = function(id) {
    if (typeof window.hideTooltip === "function") window.hideTooltip();
    let item = window.inventory.EQUIP.find(i => i.id === id);
    let isEquipped = false;
    let slotToClear = null;
    let isArtifactSack = false;

    if (!item && window.inventory.ARTIFACT) {
        item = window.inventory.ARTIFACT.find(i => i.id === id);
        if (item) isArtifactSack = true;
    }
    if (!item) {
        for (let k in window.equippedSlots) {
            if (window.equippedSlots[k] && window.equippedSlots[k].id === id) {
                item = window.equippedSlots[k];
                isEquipped = true;
                slotToClear = k;
                break;
            }
        }
    }
    if (!item) return;

    if (item.locked) {
        if (typeof window.pushHeaderToast === "function") window.pushHeaderToast("🔒 Cannot salvage a Locked item!", "#e74c3c");
        return;
    }

    if (isEquipped) {
        window.equippedSlots[slotToClear] = null;
    } else if (isArtifactSack) {
        window.inventory.ARTIFACT.splice(window.inventory.ARTIFACT.indexOf(item), 1);
    } else {
        window.inventory.EQUIP.splice(window.inventory.EQUIP.indexOf(item), 1);
    }
    window.playerStats.itemsSalvaged = (window.playerStats.itemsSalvaged || 0) + 1;

    let rolledTier = item.statsRolled;
    let scrapsGained = [];
    let isArt = item.type === "artifact";
    let scrapName = isArt ? "Astral Essence" : window.getScrapYieldName(rolledTier);
    let yieldAmount = isArt ? Math.floor(Math.random() * 2) + 1 : Math.floor(Math.random() * 3) + 1;

    if (typeof window.addEtcDrop === "function") window.addEtcDrop(scrapName, yieldAmount);
    scrapsGained.push(`x${yieldAmount} ${scrapName}`);

    if (!isArt) {
        for (let t = rolledTier - 1; t >= 0; t--) {
            if (Math.random() < 0.60) {
                let lowerYield = Math.floor(Math.random() * 2) + 1;
                let lowerName = window.getScrapYieldName(t);
                if (typeof window.addEtcDrop === "function") window.addEtcDrop(lowerName, lowerYield);
                scrapsGained.push(`x${lowerYield} ${lowerName}`);
            }
        }
    }

    let cvs = document.getElementById('gameCanvas');
    let w = cvs ? cvs.width : 750;
    let h = cvs ? cvs.height : 250;
    for(let i=0; i<30; i++) {
        if (window.particles) {
            window.particles.push({
                x: w / 2, y: h / 2,
                vx: (Math.random() - 0.5) * 12, vy: (Math.random() - 0.5) * 12,
                radius: Math.random() * 3 + 1.5,
                color: isArt ? "#9b59b6" : (Math.random() > 0.5 ? "#bdc3c7" : "#e74c3c"),
                alpha: 1, life: 35
            });
        }
    }

    if (typeof window.pushLog === "function") window.pushLog(`<span style='color:#e74c3c;'>[SALVAGE]</span> Dismantled ${item.name} yielding: ${scrapsGained.join(", ")}`);
    if (typeof window.pushHeaderToast === "function") window.pushHeaderToast(`♻️ Salvaged: ${scrapsGained.join(", ")}`, "#e74c3c");
    if (window.forgeSelectedItem && window.forgeSelectedItem.id === id) {
        window.forgeSelectedItem = null;
        if (typeof window.renderForgeTab === "function") window.renderForgeTab();
    }

    if (typeof window.resolvePlayerStats === "function") {
        let newMaxHp = window.resolvePlayerStats().maxHp;
        window.playerStats.currentHp = Math.min(window.playerStats.currentHp, newMaxHp);
    }
    if (typeof window.checkAchievements === "function") window.checkAchievements();
    if (typeof window.updateUI === "function") window.updateUI();
    if (typeof window.renderInventory === "function") window.renderInventory();
    if (typeof window.saveGame === "function") window.saveGame();
};

window.checkAutoSalvage = function(item, silent = false) {
    if (!item || item.type === "artifact" || item.statsRolled === "UNIQUE") return false;
    if (window.playerStats.autoSalvageThreshold === undefined || window.playerStats.autoSalvageThreshold < 0) return false;

    if (item.statsRolled <= window.playerStats.autoSalvageThreshold) {
        let rolledTier = item.statsRolled;
        let scrapName = window.getScrapYieldName(rolledTier);
        let yieldAmount = Math.floor(Math.random() * 3) + 1;
        let activeHarvest = [];

        if (typeof window.addEtcDrop === "function") window.addEtcDrop(scrapName, yieldAmount);
        activeHarvest.push(`x${yieldAmount} ${scrapName}`);

        for (let t = rolledTier - 1; t >= 0; t--) {
            if (Math.random() < 0.60) {
                let lowerYield = Math.floor(Math.random() * 2) + 1;
                let lowerName = window.getScrapYieldName(t);
                if (typeof window.addEtcDrop === "function") window.addEtcDrop(lowerName, lowerYield);
                activeHarvest.push(`x${lowerYield} ${lowerName}`);
            }
        }

        window.playerStats.itemsSalvaged = (window.playerStats.itemsSalvaged || 0) + 1;

        if (!silent) {
            if (typeof window.pushLog === "function") window.pushLog(`<span style='color:#e74c3c;'>[AUTO-SALVAGE]</span> Automatically deconstructed ${item.name} into: ${activeHarvest.join(", ")}`);
            if (typeof window.pushToast === "function") window.pushToast(item.name, item.statsRolled, window.getTierColor(item.statsRolled), true, 1, `⚡ Auto-Salvaged: <span style="color:#e74c3c;">${item.name}</span>`);
        }
        return true;
    }
    return false;
};

// --- FORGE ENGINE ACTIONS & CRAFTING MATH ---

window.getMaxTemper = function(stars, type = "") {
    let base = 3;
    if (stars === "UNIQUE") base = 5;
    else if (stars === 5) base = 15;
    else if (stars === 4) base = 12;
    else if (stars === 3) base = 9;
    else if (stars === 2) base = 7;
    else if (stars === 1) base = 5;

    if (type === "overall") {
        if (stars === 5) return base + 5;
        if (stars === 4) return base + 4;
        if (stars === 3) return base + 3;
        if (stars === 2) return base + 2;
        if (stars === 1) return base + 2;
        return base + 1;
    }
    return base;
};

window.getRequiredScrapForTemper = function(targetLevel, isArtifact) {
    if (isArtifact) return "Overlord's Sigil";
    if (targetLevel <= 3) return "Monster Soul";
    if (targetLevel <= 5) return "Rare Scrap";
    if (targetLevel <= 7) return "Magic Scrap";
    if (targetLevel <= 9) return "Epic Scrap";
    if (targetLevel <= 12) return "Legendary Scrap";
    return "Mythic Scrap";
};

window.getRequiredScrapAmountForTemper = function(targetLevel, isArtifact) {
    if (isArtifact) {
        if (targetLevel <= 2) return 1;
        if (targetLevel <= 4) return 2;
        return 3;
    }
    if (targetLevel <= 1) return 10;
    if (targetLevel <= 2) return 25;
    if (targetLevel <= 3) return 50;
    if (targetLevel <= 4) return 5;
    if (targetLevel <= 5) return 10;
    if (targetLevel <= 6) return 4;
    if (targetLevel <= 7) return 8;
    if (targetLevel <= 8) return 3;
    if (targetLevel <= 9) return 6;
    if (targetLevel <= 10) return 2;
    if (targetLevel <= 11) return 3;
    if (targetLevel <= 12) return 4;
    if (targetLevel <= 13) return 1;
    if (targetLevel <= 14) return 2;
    if (targetLevel <= 15) return 3;
    if (targetLevel === 16) return 4;
    if (targetLevel === 17) return 5;
    if (targetLevel === 18) return 6;
    if (targetLevel === 19) return 8;
    return 10;
};

window.getTemperGoldCost = function(item) {
    let baseCost = item.type === "artifact" ? 1000 : 100;
    let pCount = window.playerStats.prestigeCount || 0;
    let itemLvlMultiplier = Math.pow(1.08, Math.max(0, (item.stageLevel - 1) * 5));
    let prestigeMultiplier = Math.pow(1.15, pCount);
    return Math.floor(baseCost * Math.pow(1.5, item.temperLevel) * itemLvlMultiplier * prestigeMultiplier);
};

window.getTierUpScrapName = function(stars) {
    if (stars === 5) return "Mythic Scrap";
    if (stars === 4) return "Legendary Scrap";
    if (stars === 3) return "Epic Scrap";
    if (stars === 2) return "Magic Scrap";
    if (stars === 1) return "Rare Scrap";
    return "Monster Soul";
};

window.getMaxEnchants = function(item) {
    if (item.statsRolled === "UNIQUE" || !item.statsRolled) return 0;
    if (item.statsRolled === 2) return 1;
    if (item.statsRolled === 3) return 2;
    if (item.statsRolled === 4) return 3;
    if (item.statsRolled === 5) return 4;
    return 0;
};

window.getEnchantmentSymbol = function(count) {
    if (!count || count <= 0) return "";
    if (count === 1) return "✦";
    if (count === 2) return "✹";
    if (count === 3) return "❂";
    return "🌌";
};

window.getStatEnchantSuffix = function(item, statKey) {
    if (item.enchantments && item.enchantments[statKey]) {
        let count = item.enchantments[statKey];
        let symbol = window.getEnchantmentSymbol(count);
        return ` <span style="color:#9b59b6; font-weight:bold;" title="Enchanted ${count} time(s)">${symbol}</span>`;
    }
    return "";
};

window.getStatIcon = function(stat) {
    const icons = {
        atk: "⚔️", maxHp: "❤️", def: "🛡️", moveSpeed: "👟",
        critChance: "✨", critDamage: "💥", block: "🛡️", parry: "⚡",
        str: "💪", dex: "🎯", int: "🧠",
        activeAttackSpeed: "⚡", idleAttackSpeed: "⏱️"
    };
    return icons[stat] || "❖";
};

// --- FORGE UI INTERACTIONS ---

window.selectForgeItem = function(id) {
    let item = window.inventory.EQUIP.find(i => i.id === id) || (window.inventory.ARTIFACT && window.inventory.ARTIFACT.find(i => i.id === id));
    if (!item) { for (let k in window.equippedSlots) { if (window.equippedSlots[k] && window.equippedSlots[k].id === id) { item = window.equippedSlots[k]; break; } } }
    window.forgeSelectedItem = item;
    if (typeof window.renderForgeTab === "function") window.renderForgeTab();
};

window.setForgeMode = function(mode) {
    window.forgeMode = mode;
    const modes = ['temper', 'reforge', 'tier', 'enchant', 'reset_enchant', 'set'];
    modes.forEach(m => {
        let el = document.getElementById('btn-mode-' + (m === 'reset_enchant' ? 'reset-enchant' : m));
        if (el) { el.className = "btn-toggle"; el.style.background = "transparent"; }
    });

    let activeEl = document.getElementById('btn-mode-' + (mode === 'reset_enchant' ? 'reset-enchant' : mode));
    if (activeEl) {
        activeEl.className = "btn-toggle active";
        if (mode === 'temper') activeEl.style.background = "#2980b9";
        if (mode === 'reforge') activeEl.style.background = "#8e44ad";
        if (mode === 'tier') activeEl.style.background = "#e67e22";
        if (mode === 'enchant') activeEl.style.background = "#9b59b6";
        if (mode === 'reset_enchant') activeEl.style.background = "#c0392b";
        if (mode === 'set') activeEl.style.background = "#2ecc71";
    }
    if (typeof window.renderForgeTab === "function") window.renderForgeTab();
};

window.switchForgeStation = function(station) {
    let bm = document.getElementById('blacksmith-modes');
    let em = document.getElementById('enchanter-modes');
    if (station === 'blacksmith') {
        if (bm) bm.style.display = 'flex';
        if (em) em.style.display = 'none';
        window.setForgeMode('temper');
    } else {
        if (bm) bm.style.display = 'none';
        if (em) em.style.display = 'flex';
        window.setForgeMode('enchant');
    }
};

window.changeAutoSalvage = function(val) {
    window.playerStats.autoSalvageThreshold = parseInt(val, 10);
    if (typeof window.saveGame === "function") window.saveGame();
    if (typeof window.pushHeaderToast === "function") window.pushHeaderToast("⚡ Auto-Salvage Filter updated!", "#2ecc71");
};

window.triggerBulkSalvage = function() {
    if (typeof window.hideTooltip === "function") window.hideTooltip();
    let raritySelect = document.getElementById('bulk-salvage-rarity');
    if (!raritySelect) return;
    let maxStars = parseInt(raritySelect.value, 10);

    let targetItems = window.inventory.EQUIP.filter(item => !item.locked && item.statsRolled !== "UNIQUE" && item.statsRolled <= maxStars);
    if (targetItems.length === 0) {
        if (typeof window.pushHeaderToast === "function") window.pushHeaderToast("No eligible unlocked items found under this rarity!", "#e74c3c");
        return;
    }

    let label = maxStars === 0 ? "Common Gear (0★)" : window.getTierName(maxStars) + " & Under";

    if (typeof window.showCustomConfirm === "function") {
        window.showCustomConfirm(
            "Bulk Deconstruct",
            `Are you sure you want to bulk salvage ${targetItems.length} unlocked items (${label})?`,
            "Deconstruct", "Cancel", "#e74c3c",
            function() {
                let bulkScrapsHarvested = {};
                function incrementScrap(name, amount) {
                    if (!bulkScrapsHarvested[name]) bulkScrapsHarvested[name] = 0;
                    bulkScrapsHarvested[name] += amount;
                    if (typeof window.addEtcDrop === "function") window.addEtcDrop(name, amount);
                }

                targetItems.forEach(item => {
                    let rolledTier = item.statsRolled;
                    let scrapName = window.getScrapYieldName(rolledTier);
                    let yieldAmount = Math.floor(Math.random() * 3) + 1;

                    incrementScrap(scrapName, yieldAmount);

                    for (let t = rolledTier - 1; t >= 0; t--) {
                        if (Math.random() < 0.60) {
                            let lowerYield = Math.floor(Math.random() * 2) + 1;
                            let lowerName = window.getScrapYieldName(t);
                            incrementScrap(lowerName, lowerYield);
                        }
                    }

                    if (window.forgeSelectedItem && window.forgeSelectedItem.id === item.id) {
                        window.forgeSelectedItem = null;
                    }
                });

                window.playerStats.itemsSalvaged = (window.playerStats.itemsSalvaged || 0) + targetItems.length;

                let targetIds = new Set(targetItems.map(item => item.id));
                window.inventory.EQUIP = window.inventory.EQUIP.filter(item => !targetIds.has(item.id));

                let cvs = document.getElementById('gameCanvas');
                let w = cvs ? cvs.width : 750;
                let h = cvs ? cvs.height : 250;
                for (let i = 0; i < 45; i++) {
                    if (window.particles) {
                        window.particles.push({
                            x: w / 2 + (Math.random() - 0.5) * 120,
                            y: h / 2 + (Math.random() - 0.5) * 40,
                            vx: (Math.random() - 0.5) * 12,
                            vy: (Math.random() - 0.7) * 9,
                            radius: Math.random() * 3.5 + 1.5,
                            color: Math.random() > 0.5 ? "#7f8c8d" : "#e74c3c",
                            alpha: 1,
                            life: Math.random() * 30 + 15
                        });
                    }
                }

                let outputReport = Object.keys(bulkScrapsHarvested).map(k => `x${bulkScrapsHarvested[k]} ${k}`).join(", ");

                if (typeof window.pushLog === "function") window.pushLog(`<span style='color:#e74c3c;'>[BULK SALVAGE]</span> Dismantled ${targetItems.length} items. Harvested: ${outputReport}`);
                if (typeof window.pushHeaderToast === "function") window.pushHeaderToast("♻️ Bulk Salvaged " + targetItems.length + " Items!", "#e74c3c");

                if (typeof window.resolvePlayerStats === "function") {
                    let newMaxHp = window.resolvePlayerStats().maxHp;
                    window.playerStats.currentHp = Math.min(window.playerStats.currentHp, newMaxHp);
                }

                if (typeof window.checkAchievements === "function") window.checkAchievements();
                if (typeof window.updateUI === "function") window.updateUI();
                if (typeof window.renderInventory === "function") window.renderInventory();
                if (typeof window.renderForgeTab === "function") window.renderForgeTab();
                if (typeof window.saveGame === "function") window.saveGame();
            }
        );
    }
};

// --- FORGE CRAFTING PROCESSES ---

window.temperItem = function() {
    if (!window.forgeSelectedItem) return;
    let isArt = window.forgeSelectedItem.type === "artifact";

    if (window.forgeMode === 'temper') {
        let maxT = window.getMaxTemper(window.forgeSelectedItem.statsRolled, window.forgeSelectedItem.type);
        if (window.forgeSelectedItem.temperLevel >= maxT) return;
        let costGold = window.getTemperGoldCost(window.forgeSelectedItem);
        let scrapReqAmount = window.getRequiredScrapAmountForTemper(window.forgeSelectedItem.temperLevel + 1, isArt);
        let scrapReq = window.getRequiredScrapForTemper(window.forgeSelectedItem.temperLevel + 1, isArt);

        if (window.playerStats.coins < costGold) { if(typeof window.pushLog==="function") window.pushLog(`<span style='color:#e74c3c;'>Not enough Gold to temper!</span>`); return; }
        if (!window.inventory.ETC[scrapReq] || window.inventory.ETC[scrapReq] < scrapReqAmount) { if(typeof window.pushLog==="function") window.pushLog(`<span style='color:#e74c3c;'>Not enough ${scrapReq} to temper!</span>`); return; }

        let failChance = window.forgeSelectedItem.temperLevel * 5;
        let isSuccess = Math.random() >= (failChance / 100);

        window.playerStats.coins -= costGold;
        window.inventory.ETC[scrapReq] -= scrapReqAmount;
        if (window.inventory.ETC[scrapReq] === 0) delete window.inventory.ETC[scrapReq];

        if (window.playerStats.coins === 0) {
            window.playerStats.hasTriggeredExactChange = true;
        }

        if (isSuccess) {
            window.forgeSelectedItem.temperLevel++;
            window.forgeSelectedItem.consecutiveFailures = 0;
            window.recalculateItemStats(window.forgeSelectedItem);
            window.playerStats.totalTempers = (window.playerStats.totalTempers || 0) + 1;
            if (typeof window.pushLog === "function") window.pushLog(`<span style='color:#e67e22;'>[FORGE]</span> Successfully tempered ${window.forgeSelectedItem.name} to [+${window.forgeSelectedItem.temperLevel}]!`);
            if (typeof window.pushHeaderToast === "function") window.pushHeaderToast("🔨 Success! [+" + window.forgeSelectedItem.temperLevel + "]", "#2ecc71");
            if (typeof window.spawnTemperParticles === "function") window.spawnTemperParticles(true);
            if (typeof window.checkAchievements === "function") window.checkAchievements();
        } else {
            if (failChance <= 10) window.playerStats.hasTriggeredMurphysLaw = true;
            if (window.forgeSelectedItem.temperLevel < 9) {
                window.forgeSelectedItem.consecutiveFailures = (window.forgeSelectedItem.consecutiveFailures || 0) + 1;
                if (window.forgeSelectedItem.consecutiveFailures >= 3) window.playerStats.hasTriggeredUnfortunateSoul = true;
            }
            if (typeof window.pushLog === "function") window.pushLog(`<span style='color:#e74c3c;'>[FORGE]</span> Temper failed on ${window.forgeSelectedItem.name}! Materials lost.`);
            if (typeof window.pushHeaderToast === "function") window.pushHeaderToast(`💥 Temper Failed!`, "#e74c3c");
            if (typeof window.spawnTemperParticles === "function") window.spawnTemperParticles(false);
        }
    } else if (window.forgeMode === 'tier') {
        if (window.forgeSelectedItem.statsRolled >= 5) return;
        let currentStars = window.forgeSelectedItem.statsRolled;
        let costGold = (currentStars + 1) * 2500;
        let scrapReqAmount = currentStars + 1;
        let playerScrap = window.inventory.ETC["Eridium Shard"] || 0;

        if (window.playerStats.coins < costGold) { if(typeof window.pushLog==="function") window.pushLog(`<span style='color:#e74c3c;'>Not enough Gold to Tier Up!</span>`); return; }
        if (playerScrap < scrapReqAmount) { if(typeof window.pushLog==="function") window.pushLog(`<span style='color:#e74c3c;'>Not enough Eridium Shards!</span>`); return; }

        window.playerStats.coins -= costGold;
        window.inventory.ETC["Eridium Shard"] -= scrapReqAmount;
        if (window.inventory.ETC["Eridium Shard"] === 0) delete window.inventory.ETC["Eridium Shard"];

        window.scaleItemBonusStats(window.forgeSelectedItem, currentStars, currentStars + 1);

        window.forgeSelectedItem.statsRolled++;
        window.addRandomStatLineToItem(window.forgeSelectedItem);
        window.forgeSelectedItem.name = window.buildProceduralName(window.forgeSelectedItem);

        if (typeof window.pushLog === "function") window.pushLog(`<span style='color:#e67e22;'>[FORGE]</span> Successfully Tiered Up ${window.forgeSelectedItem.name} to ${window.forgeSelectedItem.statsRolled}★!`);
        if (typeof window.pushHeaderToast === "function") window.pushHeaderToast("⭐ Tier Up! " + window.forgeSelectedItem.statsRolled + "★", "#e67e22");
        if (typeof window.spawnTemperParticles === "function") window.spawnTemperParticles(true);
    }

    if (typeof window.updateUI === "function") window.updateUI();
    if (typeof window.renderInventory === "function") window.renderInventory();
    if (typeof window.renderForgeTab === "function") window.renderForgeTab();
    if (typeof window.saveGame === "function") window.saveGame();
};

window.enchantItem = function() {
    if (!window.forgeSelectedItem) return;
    let item = window.forgeSelectedItem;

    let maxT = window.getMaxTemper(item.statsRolled, item.type);
    if (item.temperLevel < maxT) {
        if (typeof window.pushHeaderToast === "function") window.pushHeaderToast(`Item must be fully Tempered first! (+${maxT})`, "#e74c3c");
        return;
    }

    let maxEnchants = window.getMaxEnchants(item);
    let currentEnchants = item.totalEnchants || 0;
    if (currentEnchants >= maxEnchants) {
        if (typeof window.pushHeaderToast === "function") window.pushHeaderToast("Max Enchantments Reached!", "#e74c3c");
        return;
    }

    let playerEssence = window.inventory.ETC["Astral Essence"] || 0;
    if (playerEssence < 1) {
        if (typeof window.pushHeaderToast === "function") window.pushHeaderToast("Requires 1 Astral Essence!", "#e74c3c");
        return;
    }

    let validStats = [];
    const ENCHANTABLE_STATS = ["atk", "maxHp", "def", "moveSpeed", "critChance", "critDamage", "block", "parry", "str", "dex", "int", "activeAttackSpeed", "idleAttackSpeed"];
    ENCHANTABLE_STATS.forEach(stat => {
        if (stat === "activeAttackSpeed" || stat === "idleAttackSpeed") {
            if (item[stat] < 0) validStats.push(stat);
        } else {
            if (item[stat] > 0) validStats.push(stat);
        }
    });

    if (validStats.length === 0) {
        if (typeof window.pushHeaderToast === "function") window.pushHeaderToast("This item has no stat lines to enchant!", "#e74c3c");
        return;
    }

    window.inventory.ETC["Astral Essence"]--;
    if (window.inventory.ETC["Astral Essence"] === 0) delete window.inventory.ETC["Astral Essence"];

    if (!item.originalStats) {
        item.originalStats = {
            atk: item.atk, maxHp: item.maxHp, def: item.def, moveSpeed: item.moveSpeed,
            critChance: item.critChance, critDamage: item.critDamage, block: item.block, parry: item.parry,
            activeAttackSpeed: item.activeAttackSpeed, idleAttackSpeed: item.idleAttackSpeed,
            str: item.str, dex: item.dex, int: item.int
        };
    }

    let selectedStat = validStats[Math.floor(Math.random() * validStats.length)];

    item.enchantments = item.enchantments || {};
    item.enchantments[selectedStat] = (item.enchantments[selectedStat] || 0) + 1;
    item.totalEnchants = (item.totalEnchants || 0) + 1;
    window.playerStats.totalEnchants = (window.playerStats.totalEnchants || 0) + 1;
    if (typeof window.checkAchievements === "function") window.checkAchievements();

    const integerStats = ["atk", "maxHp", "def", "str", "dex", "int"];
    if (integerStats.includes(selectedStat)) {
        item[selectedStat] = Math.ceil(item[selectedStat] * 1.25);
    } else if (selectedStat === "activeAttackSpeed" || selectedStat === "idleAttackSpeed") {
        item[selectedStat] = Math.floor(item[selectedStat] * 1.25);
    } else {
        item[selectedStat] = parseFloat((item[selectedStat] * 1.25).toFixed(4));
    }

    if (typeof window.pushLog === "function") window.pushLog(`<span style='color:#9b59b6;'>[ENCHANTER]</span> Successfully infused <strong style='color:#9b59b6;'>${window.getStatIcon(selectedStat)} ${selectedStat.toUpperCase()}</strong> by 25% on ${item.name}!`);
    if (typeof window.pushHeaderToast === "function") window.pushHeaderToast(`🔮 Enchanted: +25% ${selectedStat.toUpperCase()}!`, "#9b59b6");

    let cvs = document.getElementById('gameCanvas');
    let w = cvs ? cvs.width : 750;
    let h = cvs ? cvs.height : 250;
    for(let i=0; i<35; i++) {
        if (window.particles) {
            window.particles.push({
                x: w / 2, y: h / 2,
                vx: (Math.random() - 0.5) * 10, vy: (Math.random() - 0.5) * 10,
                radius: Math.random() * 3 + 1, color: "#9b59b6", alpha: 1, life: 40
            });
        }
    }

    if (typeof window.resolvePlayerStats === "function") {
        let newMaxHp = window.resolvePlayerStats().maxHp;
        window.playerStats.currentHp = Math.min(window.playerStats.currentHp, newMaxHp);
    }

    if (typeof window.updateUI === "function") window.updateUI();
    if (typeof window.renderInventory === "function") window.renderInventory();
    if (typeof window.renderForgeTab === "function") window.renderForgeTab();
    if (typeof window.saveGame === "function") window.saveGame();
};

window.resetItemEnchants = function() {
    if (!window.forgeSelectedItem) return;
    let item = window.forgeSelectedItem;
    if (!item.totalEnchants || item.totalEnchants === 0) {
        if (typeof window.pushHeaderToast === "function") window.pushHeaderToast("No enchants to reset!", "#e74c3c");
        return;
    }

    let resetGoldCost = 1000 * item.stageLevel * (item.statsRolled || 1);
    if (window.playerStats.coins < resetGoldCost) {
        if (typeof window.pushHeaderToast === "function") window.pushHeaderToast("Not enough Gold to reset!", "#e74c3c");
        return;
    }

    window.playerStats.coins -= resetGoldCost;

    if (item.originalStats) {
        for (let key in item.originalStats) {
            item[key] = item.originalStats[key];
        }
        delete item.originalStats;
    }
    delete item.enchantments;
    item.totalEnchants = 0;

    if (typeof window.pushLog === "function") window.pushLog(`<span style='color:#e74c3c;'>[ENCHANTER]</span> Purged all enchantments from ${item.name}!`);
    if (typeof window.pushHeaderToast === "function") window.pushHeaderToast(`🧹 Purged Enchantments!`, "#e74c3c");

    let cvs = document.getElementById('gameCanvas');
    let w = cvs ? cvs.width : 750;
    let h = cvs ? cvs.height : 250;
    for(let i=0; i<35; i++) {
        if (window.particles) {
            window.particles.push({
                x: w / 2, y: h / 2,
                vx: (Math.random() - 0.5) * 8, vy: (Math.random() - 0.5) * 8,
                radius: Math.random() * 2 + 1, color: "#7f8c8d", alpha: 1, life: 30
            });
        }
    }

    if (typeof window.resolvePlayerStats === "function") {
        let newMaxHp = window.resolvePlayerStats().maxHp;
        window.playerStats.currentHp = Math.min(window.playerStats.currentHp, newMaxHp);
    }

    if (typeof window.updateUI === "function") window.updateUI();
    if (typeof window.renderInventory === "function") window.renderInventory();
    if (typeof window.renderForgeTab === "function") window.renderForgeTab();
    if (typeof window.saveGame === "function") window.saveGame();
};

window.getStatLabel = function(propKey) {
    const labels = {
        bonusAtk: "Attack",
        bonusMaxHp: "Max HP",
        bonusDef: "Defense",
        bonusMoveSpeed: "Move Speed",
        bonusCritChance: "Crit Chance",
        bonusCritDamage: "Crit Multi",
        bonusBlock: "Block Rate",
        bonusParry: "Parry Rate",
        bonusActiveSpeed: "Active Atk Spd",
        bonusIdleSpeed: "Idle Atk Spd",
        bonusStr: "Strength",
        bonusDex: "Dexterity",
        bonusInt: "Intelligence",

        atk: "Attack",
        maxHp: "Max HP",
        def: "Defense",
        moveSpeed: "Move Speed",
        critChance: "Crit Chance",
        critDamage: "Crit Multi",
        block: "Block Rate",
        parry: "Parry Rate",
        activeAttackSpeed: "Active Atk Spd",
        idleAttackSpeed: "Idle Atk Spd",
        str: "Strength",
        dex: "Dexterity",
        int: "Intelligence"
    };
    return labels[propKey] || propKey;
};

window.lockForgeStat = function(propKey) {
    if (!window.forgeSelectedItem) return;
    window.forgeSelectedItem.reforgedProperty = propKey;
    if (typeof window.pushHeaderToast === "function") window.pushHeaderToast("Stat line locked for Reforging!", "#f1c40f");
    if (typeof window.renderForgeTab === "function") window.renderForgeTab();
};

window.selectReforgeStat = function(propKey) {
    if (!window.forgeSelectedItem) return;
    window.forgeSelectedItem.tempReforgeProp = propKey;
    if (typeof window.renderForgeTab === "function") window.renderForgeTab();
};

window.reforgeItemStat = function() {
    if (!window.forgeSelectedItem) return;
    let item = window.forgeSelectedItem;

    if (!item.reforgedProperty) {
        if (!item.tempReforgeProp) {
            if (typeof window.pushHeaderToast === "function") window.pushHeaderToast("Select a stat line to re-roll first!", "#e74c3c");
            return;
        }
        item.reforgedProperty = item.tempReforgeProp;
    }

    let rProp = item.reforgedProperty;
    let pCount = window.playerStats.prestigeCount || 0;
    let itemLvlMultiplier = Math.pow(1.08, Math.max(0, (item.stageLevel - 1) * 5));
    let prestigeMultiplier = Math.pow(1.15, pCount);
    let costGold = Math.floor(150 * itemLvlMultiplier * Math.pow(2, item.statsRolled) * prestigeMultiplier);

    let ownedCores = window.inventory.ETC["Catalyst Core"] || 0;

    if (window.playerStats.coins < costGold) {
        if (typeof window.pushHeaderToast === "function") window.pushHeaderToast("Not enough Gold!", "#e74c3c");
        return;
    }
    if (ownedCores < 1) {
        if (typeof window.pushHeaderToast === "function") window.pushHeaderToast("Requires 1 Catalyst Core!", "#e74c3c");
        return;
    }

    window.playerStats.coins -= costGold;
    window.inventory.ETC["Catalyst Core"]--;
    if (window.inventory.ETC["Catalyst Core"] === 0) delete window.inventory.ETC["Catalyst Core"];

    item[rProp] = 0;

    let mapping = {
        bonusAtk: "atk", bonusMaxHp: "maxHp", bonusDef: "def", bonusMoveSpeed: "moveSpeed",
        bonusCritChance: "critChance", bonusCritDamage: "critDamage", bonusBlock: "block", bonusParry: "parry",
        bonusActiveSpeed: "activeAttackSpeed", bonusIdleSpeed: "idleAttackSpeed",
        bonusStr: "str", bonusDex: "dex", bonusInt: "int"
    };

    let possiblePool = Object.keys(mapping);
    if (item.type === "subweapon") {
        if (item.subType === "shield") possiblePool = ["bonusBlock", "bonusAtk", "bonusMaxHp", "bonusDef", "bonusStr"];
        else if (item.subType === "dagger") possiblePool = ["bonusParry", "bonusAtk", "bonusCritChance", "bonusDex"];
        else if (item.subType === "tome") possiblePool = ["bonusCritDamage", "bonusInt", "bonusActiveSpeed", "bonusIdleSpeed"];
    }

    let activeBonuses = possiblePool.filter(k => k !== rProp && item[k] !== 0 && item[k] !== undefined && item[k] !== null);
    let eligiblePool = possiblePool.filter(k => !activeBonuses.includes(k));
    if (eligiblePool.length === 0) eligiblePool = possiblePool;

    let newProp = eligiblePool[Math.floor(Math.random() * eligiblePool.length)];
    let stageScale = item.stageLevel || 1;
    let expScale = Math.pow(1.06, stageScale * 10);
    let rarityMult = 1 + (item.statsRolled * 0.15);
    let rolledValue = 0;

    if (newProp === "bonusAtk") rolledValue = Math.ceil(window.randInt(1, 2) * expScale * rarityMult);
    else if (newProp === "bonusMaxHp") rolledValue = Math.ceil(window.randInt(3, 8) * expScale * rarityMult);
    else if (newProp === "bonusDef") rolledValue = Math.ceil(window.randInt(1, 2) * expScale * rarityMult);
    else if (newProp === "bonusMoveSpeed") rolledValue = Math.ceil(window.randInt(1, 2) * stageScale * rarityMult);
    else if (newProp === "bonusCritChance") rolledValue = parseFloat(Math.min(0.20, window.randFloat(0.01, 0.025) * Math.sqrt(stageScale) * rarityMult).toFixed(4));
    else if (newProp === "bonusCritDamage") rolledValue = parseFloat((window.randFloat(0.03, 0.06) * Math.sqrt(stageScale) * rarityMult).toFixed(4));
    else if (newProp === "bonusBlock") rolledValue = parseFloat(Math.min(0.15, window.randFloat(0.005, 0.015) * Math.sqrt(stageScale) * rarityMult).toFixed(4));
    else if (newProp === "bonusParry") rolledValue = parseFloat(Math.min(0.15, window.randFloat(0.005, 0.015) * Math.sqrt(stageScale) * rarityMult).toFixed(4));
    else if (newProp === "bonusActiveSpeed") {
        let sScale = Math.pow(stageScale, 0.3); let rMult = 1 + (item.statsRolled * 0.08); let pMult = Math.pow(1.02, window.playerStats.prestigeCount || 0);
        rolledValue = parseFloat((window.randFloat(0.01, 0.03) * sScale * rMult * pMult).toFixed(4));
    }
    else if (newProp === "bonusIdleSpeed") {
        let sScale = Math.pow(stageScale, 0.3); let rMult = 1 + (item.statsRolled * 0.08); let pMult = Math.pow(1.02, window.playerStats.prestigeCount || 0);
        rolledValue = parseFloat((window.randFloat(0.01, 0.03) * sScale * rMult * pMult).toFixed(4));
    }
    else if (newProp === "bonusStr") rolledValue = Math.ceil(window.randInt(1, 3) * stageScale * rarityMult);
    else if (newProp === "bonusDex") rolledValue = Math.ceil(window.randInt(1, 3) * stageScale * rarityMult);
    else if (newProp === "bonusInt") rolledValue = Math.ceil(window.randInt(1, 3) * stageScale * rarityMult);

    item[newProp] = rolledValue;
    item.reforgedProperty = newProp;

    window.recalculateItemStats(item);
    item.name = window.buildProceduralName(item);
    window.playerStats.totalReforges = (window.playerStats.totalReforges || 0) + 1;

    if (typeof window.pushLog === "function") window.pushLog(`<span style='color:#e67e22;'>[FORGE]</span> Reforged modifier into <strong style='color:#2ecc71;'>${window.getStatLabel(newProp)} (+${rolledValue})</strong> on ${item.name}!`);
    if (typeof window.pushHeaderToast === "function") window.pushHeaderToast("🔨 Stat Reforged!", "#2ecc71");

    if (typeof window.spawnTemperParticles === "function") window.spawnTemperParticles(true);
        if (typeof window.updateUI === "function") window.updateUI();
        if (typeof window.renderInventory === "function") window.renderInventory();
        if (typeof window.renderForgeTab === "function") window.renderForgeTab();
        if (typeof window.saveGame === "function") window.saveGame();
    };

    // ==========================================================================
    // --- MARKET & SHOP TRANSACTION LOGIC ---
    // ==========================================================================

    window.buyGachaCrate = function() {
        let keys = window.inventory.ETC["Gacha Key"] || 0;
        if (keys < 1) {
            window.pushHeaderToast("❌ Insufficient Gacha Keys!", "#e74c3c");
            return;
        }
        window.inventory.ETC["Gacha Key"]--;
        if (window.inventory.ETC["Gacha Key"] === 0) delete window.inventory.ETC["Gacha Key"];

        window.rollGachaDrop();
        window.SoundManager.play('spell');
        window.updateUI();
    };

    window.summonUberBossFromSelect = function() {
        if (window.playerStats.isDungeonMode || window.playerStats.isCrucibleMode || window.playerStats.isPrestigeBossMode) {
            window.pushHeaderToast("❌ Cannot summon: already in another activity!", "#e74c3c");
            return;
        }
        let cores = window.inventory.ETC["Ancient Core"] || 0;
        if (cores < 10) {
            window.pushHeaderToast("❌ Requires 10 Ancient Cores!", "#e74c3c");
            return;
        }
        if (window.playerStats.level < 30) {
            window.pushHeaderToast("❌ Requires Level 30+ to activate the Rift Altar!", "#e74c3c");
            return;
        }

        let selectEl = document.getElementById('rift-hunt-select');
        let bossType = selectEl ? selectEl.value : 'guardian';

        window.showCustomConfirm(
            "Activate Altar of Rifts",
            `Sacrifice 10 Ancient Cores to tear open a Reality Rift and face the Uber Boss?`,
            "Open Rift", "Cancel", "#9b59b6",
            function() {
                window.inventory.ETC["Ancient Core"] -= 10;
                if (window.inventory.ETC["Ancient Core"] === 0) delete window.inventory.ETC["Ancient Core"];

                window.playerStats.isBossMode = true;
                window.playerStats.isUberBoss = true;
                window.playerStats.currentUberBoss = bossType;
                window.playerStats.killCount = 0;
                window.playerStats.targetsRequired = 1;
                window.mob = null;

                let p = window.resolvePlayerStats();
                window.playerStats.currentHp = p.maxHp;

                window.pushLog(`<span style='color:#9b59b6; font-weight:bold;'>[RIFT SUMMON] The Altar consumes your cores! A rift forms...</span>`);
                let menu = document.getElementById('dungeon-menu');
                if (menu) menu.style.display = 'none';

                window.updateUI();
                window.saveGame();
            }
        );
    };

    window.buyGoldUpgrade = function(upId) {
        let p = window.playerStats;
        let cost = 0;
        let name = "";

        if (upId === 'vending') {
            cost = Math.floor(15000 * Math.pow(1.18, p.vendingQLevel || 0));
            name = "Gacha Calibration";
        } else if (upId === 'shop') {
            cost = Math.floor(30000 * Math.pow(1.22, p.shopQLevel || 0));
            name = "Merchant Investment";
        } else if (upId === 'global') {
            cost = Math.floor(100000 * Math.pow(1.28, p.globalQLevel || 0));
            name = "Aura of Fortune";
        }

        if (p.coins < cost) {
            window.pushHeaderToast("❌ Insufficient Gold!", "#e74c3c");
            return;
        }

        p.coins -= cost;
        if (p.coins === 0) p.hasTriggeredExactChange = true;

        if (upId === 'vending') p.vendingQLevel = (p.vendingQLevel || 0) + 1;
        else if (upId === 'shop') p.shopQLevel = (p.shopQLevel || 0) + 1;
        else if (upId === 'global') p.globalQLevel = (p.globalQLevel || 0) + 1;

        window.pushHeaderToast(`🎉 Upgraded ${name} to Lv. ${p[upId + 'QLevel']}!`, "#2ecc71");
        window.pushLog(`<span style='color:#2ecc71; font-weight:bold;'>[UPGRADE] Purchased ${name} Upgrade (Lv. ${p[upId + 'QLevel']})</span>`);

        window.SoundManager.play('spell');
        if (typeof window.spawnPurchaseCelebration === "function") {
            window.spawnPurchaseCelebration('alchemy', "#2ecc71", 0);
        }

        window.checkAchievements();
        window.updateUI();
        window.renderGoldUpgrades();
        window.saveGame();
    };

    window.buyMysticalItem = function(index) {
        let item = window.MYSTICAL_STOCK[index];
        if (!item) return;

        let actualCost = item.cost;
        let hasCurrency = false;

        if (item.currency === "Luminous Soul") {
            let owned = window.inventory.ETC["Luminous Soul"] || 0;
            if (owned >= item.cost) {
                window.inventory.ETC["Luminous Soul"] -= item.cost;
                if (window.inventory.ETC["Luminous Soul"] === 0) delete window.inventory.ETC["Luminous Soul"];
                hasCurrency = true;
            }
        } else if (item.currency === "Astral Shards") {
            let owned = window.playerStats.astralShards || 0;
            if (owned >= item.cost) {
                window.playerStats.astralShards -= item.cost;
                hasCurrency = true;
            }
        } else {
            actualCost = Math.ceil(item.cost * Math.pow(1.08, window.playerStats.stage));
            if (window.playerStats.coins >= actualCost) {
                window.playerStats.coins -= actualCost;
                if (window.playerStats.coins === 0) window.playerStats.hasTriggeredExactChange = true;
                hasCurrency = true;
            }
        }

        if (!hasCurrency) {
            window.pushHeaderToast(`❌ Cannot afford ${item.name}!`, "#e74c3c");
            return;
        }

        const useItems = ["Attack Elixir", "Greater Attack Elixir", "Supernal Attack Elixir", "Vitality Elixir", "Greater Vitality Elixir", "Supernal Vitality Elixir", "Armored Elixir", "Greater Armored Elixir", "Supernal Armored Elixir", "Haste Elixir", "Greater Haste Elixir", "Supernal Haste Elixir", "SP Reset Scroll", "PP Reset Scroll"];

        if (useItems.includes(item.name)) {
            window.inventory.USE[item.name] = (window.inventory.USE[item.name] || 0) + 1;
        } else {
            window.inventory.ETC[item.name] = (window.inventory.ETC[item.name] || 0) + 1;
        }

        window.pushHeaderToast(`🛒 Bought 1x ${item.name}!`, "#9b59b6");
        window.pushLog(`<span style='color:#9b59b6;'>[MYSTICAL SHOP] Exchanged currency for 1x ${item.name}</span>`);

        window.SoundManager.play('fairy');
        if (typeof window.spawnPurchaseCelebration === "function") {
            window.spawnPurchaseCelebration('alchemy', item.color, 0);
        }

        window.updateUI();
        window.renderMysticalShop();
        window.renderInventory();
        window.saveGame();
    };

    window.transmutePotion = function(index) {
        let recipe = window.POTION_TRANSMUTATIONS[index];
        if (!recipe) return;

        let owned = window.inventory.USE[recipe.req] || 0;
        if (owned < recipe.amount) {
            window.pushHeaderToast(`❌ Requires ${recipe.amount}x ${recipe.req}!`, "#e74c3c");
            return;
        }

        window.inventory.USE[recipe.req] -= recipe.amount;
        if (window.inventory.USE[recipe.req] === 0) delete window.inventory.USE[recipe.req];

        window.inventory.USE[recipe.result] = (window.inventory.USE[recipe.result] || 0) + 1;

        window.pushHeaderToast(`🧪 Transmuted into 1x ${recipe.result}!`, "#2ecc71");
        window.pushLog(`<span style='color:#2ecc71;'>[ALCHEMY] Transmuted ${recipe.amount}x ${recipe.req} ➔ 1x ${recipe.result}</span>`);

        window.SoundManager.play('spell');
        if (typeof window.spawnPurchaseCelebration === "function") {
            window.spawnPurchaseCelebration('alchemy', recipe.color, 0);
        }

        window.updateUI();
        window.renderMysticalShop();
        window.renderInventory();
        window.saveGame();
    };

    window.buyShopItem = function(index) {
        let item = window.playerStats.shopItems[index];
        if (!item || item.purchased) return;

        let maxBag = window.getMaxBagSlots();
        if (window.inventory.EQUIP.length >= maxBag) {
            window.pushHeaderToast("❌ Equipment bag is completely full!", "#e74c3c");
            return;
        }

        if (window.playerStats.coins < item.cost) {
            window.pushHeaderToast("❌ Insufficient Gold!", "#e74c3c");
            return;
        }

        window.playerStats.coins -= item.cost;
        if (window.playerStats.coins === 0) window.playerStats.hasTriggeredExactChange = true;

        item.purchased = true;
        let addedItem = JSON.parse(JSON.stringify(item));
        delete addedItem.cost;
        delete addedItem.purchased;
        delete addedItem.isIOTD;

        window.inventory.EQUIP.push(addedItem);

        window.pushHeaderToast(`🛒 Bought ${item.name}!`, "#f1c40f");
        window.pushLog(`<span style='color:#f1c40f;'>[MERCHANT] Purchased ${item.name} from the Gold Shop</span>`, addedItem.id);

        window.SoundManager.play('fairy');
        if (typeof window.spawnPurchaseCelebration === "function") {
            window.spawnPurchaseCelebration('gacha', window.getTierColor(addedItem.statsRolled), addedItem.statsRolled);
        }

        window.updateUI();
                window.renderMarketShop();
                window.renderInventory();
                window.saveGame();
            };

            // Re-rolls set names on standard equipment at the Blacksmith Station
            window.rerollItemSet = function() {
                if (!window.forgeSelectedItem) return;
                let item = window.forgeSelectedItem;
                if (item.type === "artifact") return;

                let costGold = window.getSetRerollGoldCost(item);
                let soulCost = 25 + (item.statsRolled * 25);
                let ownedSouls = window.inventory.ETC["Monster Soul"] || 0;

                if (window.playerStats.coins < costGold) {
                    window.pushHeaderToast("❌ Insufficient Gold!", "#e74c3c");
                    return;
                }
                if (ownedSouls < soulCost) {
                    window.pushHeaderToast("❌ Insufficient Monster Souls!", "#e74c3c");
                    return;
                }

                window.playerStats.coins -= costGold;
                window.inventory.ETC["Monster Soul"] -= soulCost;
                if (window.inventory.ETC["Monster Soul"] === 0) delete window.inventory.ETC["Monster Soul"];

                let setKeys = ["Vanguard", "Colossus", "Bastion", "Windrunner", "Wraith", "Reaver", "Dreadnought", "Duellist", "Scholar", "Berserker", "Scout", "Fortune", "Mystic", "Alchemist", "Midas", "Biohazard", "Warlord", "VoidTouched"];

                // Ensure the roll shifts to a different set name
                let availableSets = setKeys.filter(k => k !== item.setName);
                let newSet = availableSets[Math.floor(Math.random() * availableSets.length)];

                item.setName = newSet;
                item.name = window.buildProceduralName(item);

                window.pushLog(`<span style='color:#e67e22;'>[FORGE]</span> Reforged the set resonance of ${item.name} to <strong style='color:#2ecc71;'>${newSet}</strong>!`);
                window.pushHeaderToast(`✨ Set Changed to ${newSet}!`, "#2ecc71");

                if (typeof window.spawnTemperParticles === "function") window.spawnTemperParticles(true);
                window.updateUI();
                window.renderInventory();
                window.renderForgeTab();
                window.saveGame();
            };