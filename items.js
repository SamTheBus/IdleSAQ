/* ==========================================================================
   PRIMARY PURPOSE: Procedural Item Generation, Unique Styling,
   Sack Management, Forge/Crafting, and Shop Transaction Logic.
   ========================================================================= */
window.getRarityMultiplier = function (stars) {
  if (stars === "UNIQUE" || stars === "unique") return 22.0;
  const multipliers = [1.0, 1.8, 3.2, 5.5, 10.0, 18.0];
  return multipliers[stars] || 1.0;
};

window.isItemUnique = function (item) {
  if (!item) return false;
  return !!(
    item.isUniqueStaff ||
    item.isUniqueSword ||
    item.isUniqueSingularity ||
    item.isUniqueMaelstrom ||
    item.isUniqueAegis ||
    item.isUniqueWatch ||
    item.isUniqueChronicle ||
    item.isUniqueWarpCore ||
    item.isUniqueTempest ||
    item.isUniqueViper ||
    item.isUniqueConduit ||
    item.type === "artifact" ||
    item.statsRolled === "UNIQUE"
  );
};

window.getUniqueKey = function (item) {
  if (!item) return null;
  if (item.type === "artifact" || item.statsRolled === "UNIQUE") {
    return "art_" + item.trait;
  }
  if (item.isUniqueStaff) return "weapon_staff";
  if (item.isUniqueSword) return "weapon_sword";
  if (item.isUniqueSingularity) return "weapon_singularity";
  if (item.isUniqueMaelstrom) return "weapon_maelstrom";
  if (item.isUniqueAegis) return "shield_aegis";
  if (item.isUniqueWatch) return "tome_watch";
  if (item.isUniqueChronicle) return "tome_chronicle";
  if (item.isUniqueWarpCore) return "boots_warpcore";
  if (item.isUniqueTempest) return "helmet_tempest";
  return null;
};

window.executeSpectralShatter = function (id) {
  if (typeof window.hideTooltip === "function") window.hideTooltip();
  let item =
    window.inventory.EQUIP.find((i) => i.id === id) ||
    (window.inventory.ARTIFACT &&
      window.inventory.ARTIFACT.find((i) => i.id === id));
  if (!item) return;

  let uniqueKey = window.getUniqueKey(item);
  if (!uniqueKey) return;

  let isUnlocked = window.playerStats.spectralCodex.includes(uniqueKey);
  if (isUnlocked) return;

  let costGold = 1000000000; // 1 Billion Gold
  let costShards = 250;
  let costCores = 5;
  let costEridium = 5;

  let playerShards = window.playerStats.astralShards || 0;
  let playerCores = window.inventory.ETC["Catalyst Core"] || 0;
  let playerEridium = window.inventory.ETC["Eridium Shard"] || 0;
  let playerGold = BigNum.from(window.playerStats.coins);

  if (
    playerGold.lt(costGold) ||
    playerShards < costShards ||
    playerCores < costCores ||
    playerEridium < costEridium
  ) {
    window.pushHeaderToast(
      "❌ Insufficient resources for Spectral Shatter!",
      "#e74c3c",
    );
    return;
  }

  window.showCustomConfirm(
    "Spectral Shatter",
    `Are you sure you want to sacrifice <strong>1,000,000,000 Gold</strong> and your premium materials to shatter <strong>${item.name}</strong> and permanently secure its passive into your Codex?`,
    "Shatter Essence",
    "Cancel",
    "#e74c3c",
    function () {
      // Deduct gold
      window.playerStats.coins = playerGold.sub(costGold);
      if (window.playerStats.coins.eq(0)) {
        window.playerStats.hasTriggeredExactChange = true;
      }

      // Deduct materials
      window.playerStats.astralShards -= costShards;

      window.inventory.ETC["Catalyst Core"] -= costCores;
      if (window.inventory.ETC["Catalyst Core"] === 0)
        delete window.inventory.ETC["Catalyst Core"];

      window.inventory.ETC["Eridium Shard"] -= costEridium;
      if (window.inventory.ETC["Eridium Shard"] === 0)
        delete window.inventory.ETC["Eridium Shard"];

      // Perform standard salvage yield of 1 to 2x Astral Essence
      let yieldAmount = Math.floor(Math.random() * 2) + 1;
      window.addEtcDrop("Astral Essence", yieldAmount);

      // Add to codex
      window.playerStats.spectralCodex.push(uniqueKey);

      // Remove the item from inventory
      let eqIndex = window.inventory.EQUIP.findIndex((i) => i.id === id);
      if (eqIndex !== -1) {
        window.inventory.EQUIP.splice(eqIndex, 1);
      } else {
        let artIndex = window.inventory.ARTIFACT.findIndex((i) => i.id === id);
        if (artIndex !== -1) {
          window.inventory.ARTIFACT.splice(artIndex, 1);
        }
      }

      // Clear selected item
      window.forgeSelectedItem = null;

      // Play audio and show animations
      if (window.SoundManager) window.SoundManager.play("death");
      if (window.spawnTemperParticles) window.spawnTemperParticles(true);

      window.pushHeaderToast(`✦ Codex Unlocked: ${item.name}!`, "#e74c3c");
      window.pushLog(
        `<strong style='color:#e74c3c;'>[CODEX]</strong> Shattered <span style='color:${window.getTierColor(item.statsRolled)};'>${item.name}</span>! Passive unlocked permanently. Gained +${yieldAmount}x Astral Essence as salvage.`,
      );

      window.updateUI();
      window.renderInventory();
      window.renderForgeTab();
      window.saveGame();
    },
  );
};

window.PitySystem = {
  increment() {
    window.playerStats.lootPityCounter =
      (window.playerStats.lootPityCounter || 0) + 1;
  },
  reset() {
    window.playerStats.lootPityCounter = 0;
  },
  getEffectiveRate(baseRate) {
    // Only apply in Dungeons to preserve Campaign balance
    if (!window.playerStats.isDungeonMode) return baseRate;
    let counter = window.playerStats.lootPityCounter || 0;
    return baseRate * (1 + counter * 0.05); // Each failed kill adds +5% base rate
  },
};

window.getSlotUpgradeCost = function (slotKey, currentLevel) {
  let targetLevel = currentLevel + 1; // 1 to 100
  let gold = BigNum.from(0);
  if (targetLevel <= 10) {
    gold = BigNum.from(2500).mul(BigNum.from(1.35).pow(targetLevel));
  } else if (targetLevel <= 30) {
    let costAt10 = BigNum.from(2500).mul(BigNum.from(1.35).pow(10));
    gold = costAt10.mul(BigNum.from(3.55).pow(targetLevel - 10));
  } else {
    let costAt30 = BigNum.from(100000).mul(BigNum.from(2.25).pow(30));
    gold = costAt30.mul(BigNum.from(3.0).pow(targetLevel - 30));
  }

  let materials = [];
  if (targetLevel <= 10) {
    // Copper Attunement (Lv. 1 - 10)
    materials.push({
      name: "Monster Soul",
      qty: Math.floor(15 * Math.pow(1.25, targetLevel)),
    });
  } else if (targetLevel <= 25) {
    // Iron Attunement (Lv. 11 - 25)
    materials.push({
      name: "Monster Soul",
      qty: Math.floor(1000 * Math.pow(1.2, targetLevel - 10)),
    });
    materials.push({
      name: "Rare Scrap",
      qty: Math.floor(15 * Math.pow(1.25, targetLevel - 10)),
    });
  } else if (targetLevel <= 45) {
    // Steel Attunement (Lv. 26 - 45)
    materials.push({
      name: "Luminous Soul",
      qty: Math.floor(5 * Math.pow(1.18, targetLevel - 25)),
    });
    materials.push({
      name: "Magic Scrap",
      qty: Math.floor(25 * Math.pow(1.22, targetLevel - 25)),
    });
  } else if (targetLevel <= 70) {
    // Mythril Attunement (Lv. 46 - 70)
    materials.push({
      name: "Epic Scrap",
      qty: Math.floor(50 * Math.pow(1.16, targetLevel - 45)),
    });
    materials.push({
      name: "Astral Shards",
      qty: Math.floor(1 * Math.pow(1.15, targetLevel - 45)),
    });
  } else if (targetLevel <= 90) {
    // Celestial Attunement (Lv. 71 - 90)
    materials.push({
      name: "Legendary Scrap",
      qty: Math.floor(250 * Math.pow(1.15, targetLevel - 70)),
    });
    materials.push({
      name: "Astral Shards",
      qty: Math.floor(5 * Math.pow(1.16, targetLevel - 70)),
    });
  } else if (targetLevel <= 100) {
    // Void Singularity Attunement (Lv. 91 - 100)
    materials.push({
      name: "Mythic Scrap",
      qty: Math.floor(500 * Math.pow(1.15, targetLevel - 90)),
    });
    materials.push({
      name: "Astral Shards",
      qty: Math.floor(15 * Math.pow(1.16, targetLevel - 90)),
    });
  }

  return { gold, materials };
};

window.forgeSelectedItem = null;
window.forgeMode = "temper";

window.hexToRgbCache = window.hexToRgbCache || {};

window.hexToRgbValues = function (hex) {
  if (!hex || hex.charAt(0) !== "#") return "30, 41, 59";
  if (!window.hexToRgbCache[hex]) {
    let r = parseInt(hex.slice(1, 3), 16);
    let g = parseInt(hex.slice(3, 5), 16);
    let b = parseInt(hex.slice(5, 7), 16);
    window.hexToRgbCache[hex] = `${r}, ${g}, ${b}`;
  }
  return window.hexToRgbCache[hex];
};

// Initialize window.ItemFactory Namespace to encapsulate item math and properties
window.ItemFactory = {
  // Universal Set generation roller with targeted theme biases for Dungeons and Rift hunts
  rollSetForItem(isBoss, isRare, isDungeon, currentDungeon) {
    let setChance = 0.15; // 15% base rate
    if (isDungeon) setChance = 0.4;
    else if (isBoss) setChance = 0.3;
    else if (isRare) setChance = 0.25;

    if (Math.random() > setChance) return null;

    let setKeys = [
      "Vanguard",
      "Colossus",
      "Bastion",
      "Windrunner",
      "Wraith",
      "Reaver",
      "Dreadnought",
      "Duellist",
      "Scholar",
      "Berserker",
      "Scout",
      "Fortune",
      "Mystic",
      "Alchemist",
      "Midas",
      "Biohazard",
      "Warlord",
      "VoidTouched",
    ];

    // 70% chance to respect regional theme layout
    if (Math.random() < 0.7) {
      if (isDungeon && currentDungeon) {
        let themes = { equip: "Warlord", gold: "Midas", mat: "Biohazard" };
        if (themes[currentDungeon]) return themes[currentDungeon];
      }
      if (window.playerStats.isUberBoss) {
        return "VoidTouched";
      }
    }

    return setKeys[Math.floor(Math.random() * setKeys.length)];
  },
};

// Legacy Compatibility Aliases to protect existing cross-file references
window.rollSetForItem = (isBoss, isRare, isDungeon, currentDungeon) =>
  window.ItemFactory.rollSetForItem(isBoss, isRare, isDungeon, currentDungeon);

// Calculates gold expenses for set re-resonating
window.getSetRerollGoldCost = function (item) {
  let itemLvlMultiplier = BigNum.from(1.045).pow(
    Math.max(0, (item.stageLevel - 1) * 5),
  );
  return BigNum.from(100)
    .mul(itemLvlMultiplier)
    .mul(BigNum.from(1.5).pow(item.statsRolled));
};

// Generates highly detailed comparison layouts for Temper and Tier Up forge previews
window.getForgeDiffLines = function (item, previewItem) {
  let diffLines = "";

  // 1. Render Base parameters comparative
  let baseStatsToCompare = [
    {
      key: "baseAtk",
      icon: window.getUiIconSvg("atk", 11),
      label: "Base Weapon Damage",
    },
    {
      key: "baseDef",
      icon: window.getUiIconSvg("def", 11),
      label: "Base Defense",
    },
    {
      key: "baseMaxHp",
      icon: window.getUiIconSvg("maxHp", 11),
      label: "Base Max Life",
    },
    {
      key: "baseInt",
      icon: window.getUiIconSvg("int", 11),
      label: "Base Intelligence",
    },
  ];
  baseStatsToCompare.forEach((s) => {
    let curVal = item[s.key] || 0;
    let newVal = previewItem[s.key] || 0;
    let diff = newVal - curVal;
    if (diff > 0.001) {
      diffLines += `
                  <div style="display:flex; justify-content:space-between; align-items:center; font-size:11px; background:rgba(26,188,156,0.06); padding:6px 8px; border-radius:3px; margin-bottom:4px; border:1px solid #1abc9c;">
                      <span style="color:#1abc9c; font-weight:bold;">${s.icon} ${s.label}</span>
                      <span style="font-family:monospace;">
                          <span style="color:#7f8c8d;">${window.formatNumber(curVal)}</span> ➔
                          <strong style="color:#fff;">${window.formatNumber(newVal)}</strong>
                          <span style="color:#2ecc71; font-weight:bold; margin-left:4px;">(+${window.formatNumber(diff)})</span>
                      </span>
                  </div>
              `;
    }
  });

  // 2. Render combined total / affix parameters comparative
  let statsToCompare = [
    {
      key: "atk",
      icon: window.getUiIconSvg("atk", 11),
      label: "Attack Total",
      isPct: false,
    },
    {
      key: "maxHp",
      icon: window.getUiIconSvg("maxHp", 11),
      label: "Max HP Total",
      isPct: false,
    },
    {
      key: "def",
      icon: window.getUiIconSvg("def", 11),
      label: "Defense Total",
      isPct: false,
    },
    {
      key: "moveSpeed",
      icon: window.getUiIconSvg("moveSpeed", 11),
      label: "Move Speed",
      isPct: false,
    },
    {
      key: "str",
      icon: window.getUiIconSvg("str", 11),
      label: "STR",
      isPct: false,
    },
    {
      key: "dex",
      icon: window.getUiIconSvg("dex", 11),
      label: "DEX",
      isPct: false,
    },
    {
      key: "int",
      icon: window.getUiIconSvg("int", 11),
      label: "INT",
      isPct: false,
    },
    {
      key: "critChance",
      icon: window.getUiIconSvg("critChance", 11),
      label: "Crit Chance",
      isPct: true,
    },
    {
      key: "critDamage",
      icon: window.getUiIconSvg("critDamage", 11),
      label: "Crit Multi",
      isPct: true,
    },
    {
      key: "block",
      icon: window.getUiIconSvg("block", 11),
      label: "Block Rate",
      isPct: true,
    },
    {
      key: "parry",
      icon: window.getUiIconSvg("parry", 11),
      label: "Parry Rate",
      isPct: true,
    },
    {
      key: "dropRate",
      icon: window.getUiIconSvg("dropRate", 11),
      label: "Drop Rate",
      isPct: true,
    },
    {
      key: "quality",
      icon: window.getUiIconSvg("quality", 11),
      label: "Drop Quality",
      isPct: true,
    },
    {
      key: "goldMulti",
      icon: window.getUiIconSvg("goldMulti", 11),
      label: "Gold Multi",
      isPct: true,
    },
    {
      key: "rareSpawn",
      icon: window.getUiIconSvg("rareSpawn", 11),
      label: "Rare Spawn",
      isPct: true,
      isDoublePct: true,
    },
    {
      key: "fairySpawn",
      icon: window.getUiIconSvg("fairySpawn", 11),
      label: "Fairy Spawn",
      isPct: true,
    },
    {
      key: "activeAttackSpeed",
      icon: window.getUiIconSvg("activeAttackSpeed", 11),
      label: "Active Atk Spd",
      isPct: true,
    },
    {
      key: "idleAttackSpeed",
      icon: window.getUiIconSvg("idleAttackSpeed", 11),
      label: "Idle Atk Spd",
      isPct: true,
    },
  ];
  statsToCompare.forEach((s) => {
    let curVal = item[s.key] || 0;
    let newVal = previewItem[s.key] || 0;
    let diff = newVal - curVal;
    if (Math.abs(diff) > 0.0001) {
      let curValStr = s.isPct
        ? s.isDoublePct
          ? (curVal * 100).toFixed(2) + "%"
          : Math.round(curVal * 100) + "%"
        : window.formatNumber(curVal);
      let newValStr = s.isPct
        ? s.isDoublePct
          ? (newVal * 100).toFixed(2) + "%"
          : Math.round(newVal * 100) + "%"
        : window.formatNumber(newVal);
      let diffStr = s.isPct
        ? s.isDoublePct
          ? (diff * 100).toFixed(2) + "%"
          : Math.round(diff * 100) + "%"
        : window.formatNumber(diff);

      diffLines += `
                <div style="display:flex; justify-content:space-between; align-items:center; font-size:11px; background:rgba(0,0,0,0.4); padding:6px 8px; border-radius:3px; margin-bottom:4px; border:1px solid #333;">
                    <span style="color:#aaa;">${s.icon} ${s.label}</span>
                    <span style="font-family:monospace;">
                        <span style="color:#7f8c8d;">${curValStr}</span> ➔
                        <strong style="color:#fff;">${newValStr}</strong>
                        <span style="color:#2ecc71; font-weight:bold; margin-left:4px;">(+${diffStr})</span>
                    </span>
                </div>
            `;
    }
  });

  return diffLines;
};

// Renders the entire Blacksmith and Enchanter selection pane with custom comparison values
window.renderForgeTab = function () {
  let listEl = document.getElementById("forge-list");
  let detailEl = document.getElementById("forge-details");
  if (!listEl || !detailEl) return;

  window.playerStats.slotUpgrades = window.playerStats.slotUpgrades || {
    weapon: 0,
    subweapon: 0,
    helmet: 0,
    chest: 0,
    leggings: 0,
    overall: 0,
    boots: 0,
  };

  if (window.forgeMode === "temper") {
    let slotsKeys = [
      "weapon",
      "subweapon",
      "helmet",
      "chest",
      "leggings",
      "overall",
      "boots",
      "ring1",
      "ring2",
      "art1",
      "art2",
      "art3",
    ];
    let slotsLabels = {
      weapon: "Weapon Slot",
      subweapon: "Offhand Slot",
      helmet: "Helmet Slot",
      chest: "Chest Slot",
      leggings: "Leggings Slot",
      overall: "Overall Slot",
      boots: "Boots Slot",
      ring1: "Ring Slot 1",
      ring2: "Ring Slot 2",
      art1: "Artifact Slot 1",
      art2: "Artifact Slot 2",
      art3: "Artifact Slot 3",
    };

    listEl.innerHTML = slotsKeys
      .map((key) => {
        let lvl = window.playerStats.slotUpgrades[key] || 0;
        let isSelected = window.state.selectedForgeSlot === key;
        let equippedItem = window.equippedSlots[key];
        let itemNameHtml = equippedItem
          ? `<span style="color:${window.getTierColor(equippedItem.statsRolled)}; font-weight:bold;">${equippedItem.name}</span>`
          : `<span style="color:#666; font-style:italic;">[Empty Slot]</span>`;

        let borderCol = isSelected ? "#a855f7" : "#202632";
        let bg = isSelected
          ? "background: rgba(168, 85, 247, 0.15);"
          : "background: rgba(15, 17, 26, 0.65);";

        return `
        <div class="bag-item-forge" style="border: 1.5px solid ${borderCol}; border-left: 4.5px solid #a855f7 !important; ${bg} display: flex; align-items: center; padding: 8px 10px; margin-bottom: 6px; border-radius: 6px; cursor: pointer; transition: all 0.15s;" onclick="window.selectForgeSlot('${key}')">
          <div style="flex:1; text-align:left;">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <strong style="color:#df9ffb; font-size:12px;">${slotsLabels[key]}</strong>
              <span style="font-family:monospace; font-size:10px; color:#fff; font-weight:bold;">Lv. ${lvl} / 100</span>
            </div>
            <div style="font-size:9.5px; color:#aaa; margin-top:2px;">Equipped: ${itemNameHtml}</div>
          </div>
        </div>
      `;
      })
      .join("");

    let slotKey = window.state.selectedForgeSlot || "weapon";
    let lvl = window.playerStats.slotUpgrades[slotKey] || 0;
    let displayLabel = slotsLabels[slotKey];

    if (lvl >= 100) {
      detailEl.innerHTML = `
        <div style="font-weight:bold; font-size:13px; color:#f1c40f; border-bottom:1px solid #333; padding-bottom:4px; margin-bottom:10px;">${displayLabel}</div>
        <div style="color:#2ecc71; font-weight:bold; text-align:center; padding: 25px 0; font-size:12px;">🏆 MAXIMUM ATTUNEMENT REACHED (Lv. 100)<br><br><span style="color:#aaa; font-weight:normal;">This slot's equipped items now receive an absolute +100% (2.0x) stat multiplier!</span></div>
      `;
      return;
    }

    let cost = window.getSlotUpgradeCost(slotKey, lvl);
    let goldCost = cost.gold;
    let goldOwned = BigNum.from(window.playerStats.coins || 0);
    let goldColor = goldOwned.gte(goldCost) ? "#2ecc71" : "#e74c3c";

    let materialsHtml = cost.materials
      .map((mat) => {
        let owned =
          window.inventory.ETC[mat.name] || window.inventory.USE[mat.name] || 0;
        let isAfford = owned >= mat.qty;
        let color = isAfford ? "#bdc3c7" : "#e74c3c";
        return `<div style="font-size:11px; color:${color}; margin-bottom:3px;">• ${mat.qty}x ${mat.name} (Owned: ${owned.toLocaleString()})</div>`;
      })
      .join("");

    let canAfford =
      goldOwned.gte(goldCost) &&
      cost.materials.every(
        (m) =>
          (window.inventory.ETC[m.name] || window.inventory.USE[m.name] || 0) *
            1 >=
          m.qty,
      );

    let eqItem = window.equippedSlots[slotKey];
    let liveComparisonHtml = "";
    if (typeof window.generateForgePreviewHtml === "function") {
      liveComparisonHtml = window.generateForgePreviewHtml(
        eqItem,
        lvl,
        lvl + 1,
      );
    } else {
      liveComparisonHtml = `
            <div style="margin-top:12px; padding:10px; background:#111; border:1px dashed #444; border-radius:6px; font-size:10.5px; color:#aaa; text-align:center;">
              No item currently equipped in this slot.<br>Attunement multiplier (+${lvl}%) is fully prepared and waiting.
            </div>
          `;
    }

    detailEl.innerHTML = `
      <div style="font-weight:bold; font-size:13px; color:#df9ffb; border-bottom:1px solid #333; padding-bottom:4px; margin-bottom:10px; text-align:left;">${displayLabel}</div>
      <div style="font-size:11px; margin-bottom:10px; color:#aaa; text-align:left;">Attunement multiplier: <span style="color:#fff; font-weight:bold;">+${lvl}% ➔ <span style="color:#2ecc71;">+${lvl + 1}%</span></span></div>
      <div class="forge-progress-bg"><div class="forge-progress-fill" style="width:${lvl}%; background:linear-gradient(90deg, #9b59b6, #e84393);"></div></div>

      <div style="margin-top:10px; text-align:left;">
        <div style="font-size:11px; color:${goldColor}; margin-bottom:3px;">• ${window.formatNumber(goldCost)} Gold Required (Owned: ${window.formatNumber(goldOwned)})</div>
        ${materialsHtml}
      </div>

      ${liveComparisonHtml}

      <button class="forge-anvil-button" style="width:100%; margin-top:15px; border-color:#9b59b6; background:linear-gradient(135deg, #4a154b, #0c0812);" ${canAfford ? "" : "disabled"} onclick="window.temperItem()" onpointerdown="window.temperItem()">Attune Slot</button>
          `;
    return;
  }

  // Draw displays for the remaining modes
  let allValidItems = [];
  if (window.forgeMode === "shatter") {
    // Filter: Only show unequipped items that are uniques
    allValidItems = [
      ...window.inventory.EQUIP.filter(
        (item) => item.type !== "sigil" && window.isItemUnique(item),
      ),
      ...(window.inventory.ARTIFACT || []).filter(window.isItemUnique),
    ];
  } else {
    allValidItems = [
      ...window.inventory.EQUIP.filter((item) => item.type !== "sigil"),
      ...(window.inventory.ARTIFACT || []),
    ];
  }
  for (let key in window.equippedSlots) {
    if (window.equippedSlots[key]) {
      let eqClone = { ...window.equippedSlots[key], isEquippedSlot: key };
      allValidItems.push(eqClone);
    }
  }

  if (allValidItems.length === 0) {
    listEl.innerHTML =
      "<div style='color:#666;text-align:center;padding-top:40px;'>No gear.</div>";
  } else {
    listEl.innerHTML = allValidItems
      .map((item) => {
        let isArt = item.type === "artifact";
        if (
          (window.forgeMode === "reforge" ||
            window.forgeMode === "tier" ||
            window.forgeMode === "enchant" ||
            window.forgeMode === "reset_enchant" ||
            window.forgeMode === "set") &&
          isArt
        )
          return "";

        let nameColor = window.getTierColor(item.statsRolled);
        let temperTag = item.temperLevel > 0 ? ` [+${item.temperLevel}]` : "";
        let lockTag = item.locked ? " 🔒" : "";

        let isSelected =
          window.forgeSelectedItem && window.forgeSelectedItem.id === item.id;
        let itemBorderColor = isSelected ? nameColor : "#202632";
        let itemBg = isSelected
          ? `background: rgba(${window.hexToRgbValues(nameColor)}, 0.15); box-shadow: inset 0 0 10px rgba(${window.hexToRgbValues(nameColor)}, 0.22), 0 0 12px rgba(${window.hexToRgbValues(nameColor)}, 0.15);`
          : "background: rgba(15, 17, 26, 0.65);";

        let uniqueStyleStr = "";
        let uniqueStyle = window.getUniqueItemStyle(item);
        if (uniqueStyle) {
          uniqueStyleStr = isSelected
            ? `background: ${uniqueStyle.bg}; border: 1.5px solid ${nameColor}; box-shadow: inset 0 0 10px ${nameColor}55, 0 0 14px ${nameColor}33;`
            : `background: ${uniqueStyle.bg}; border: 1.5px solid ${uniqueStyle.border}; box-shadow: inset 0 0 6px ${uniqueStyle.shadow}, 0 0 8px ${uniqueStyle.glow};`;
        }
        let finalStyle = uniqueStyleStr
          ? uniqueStyleStr
          : `border: 1.5px solid ${itemBorderColor}; border-left: 4px solid ${nameColor} !important; ${itemBg}`;
        let inlineStyle = `style="${finalStyle} display: flex; align-items: center; padding: 6px 10px; margin-bottom: 6px; border-radius: 6px; cursor: pointer; transition: all 0.18s ease-in-out;"`;

        let eqBadge = item.isEquippedSlot
          ? `<span style="background:#c0392b; color:white; padding:1px 3px; border-radius:2px; font-size:8px; font-weight:bold; margin-right:4px;">EQ</span> `
          : "";
        let rarityLabel = isArt ? "UNIQUE" : `${item.statsRolled}★`;
        let iconBox = `<div style="margin-right:8px; display:inline-flex; align-items:center; flex-shrink:0;">${window.getEquipIconHtml(item, 28)}</div>`;

        // Configured onpointerdown as the primary selector to bypass mobile click-swallows
        return `<div class="bag-item-forge" ${inlineStyle} onpointerdown="window.selectForgeItem(${item.id}); window.showForgeTooltip(event, ${item.id});" onmouseenter="window.showForgeTooltip(event, ${item.id})" onmouseleave="window.hideTooltip()" onclick="window.selectForgeItem(${item.id})">
                            ${iconBox}
                            <div style="flex:1; min-width:0; text-align:left;">
                    <div style="display:flex; justify-content:space-between; align-items:center; gap:4px; margin-bottom:1px;">
                        <span style="font-weight:bold; color:${nameColor}; font-size:11.5px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; max-width:180px;">${item.name}${temperTag}</span>
                        ${lockTag ? `<span style="font-size:9.5px;">${lockTag}</span>` : ""}
                    </div>
                    <div style="font-size:9.5px; color:#aaa; display:flex; align-items:center; gap:4px; font-family:monospace; line-height:1;">
                        ${eqBadge}
                        <span>${item.type.toUpperCase()} • ${rarityLabel}</span>
                    </div>
                </div>
            </div>`;
      })
      .join("");
  }

  // Context-Aware Instructions Revamp
  if (
    !window.forgeSelectedItem ||
    ((window.forgeMode === "reforge" ||
      window.forgeMode === "tier" ||
      window.forgeMode === "enchant" ||
      window.forgeMode === "reset_enchant" ||
      window.forgeMode === "set") &&
      window.forgeSelectedItem.type === "artifact") ||
    (window.forgeMode === "shatter" &&
      !window.isItemUnique(window.forgeSelectedItem))
  ) {
    let mode = window.forgeMode || "temper";

    // 1. Hand-Drawn Warning Vector Icon (No emojis)
    let warningIconSvg = `
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#e74c3c" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle; margin-right:4px; transform:translateY(-1px);">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      `;

    // 2. Build Ineligible Item Warning Banners
    let warningHtml = "";
    if (window.forgeSelectedItem) {
      if (window.forgeSelectedItem.type === "artifact") {
        warningHtml = `
            <div style="background:rgba(231,76,60,0.06); border:1.5px dashed #e74c3c; border-radius:6px; padding:10px; margin-bottom:12px; font-size:11px; text-align:center; color:#ff7675; line-height:1.4; white-space:normal; display:flex; align-items:center; justify-content:center; gap:4px;">
              <div>
                ${warningIconSvg} <b>INELIGIBLE ITEM:</b> Unique Artifacts cannot be modified in <b>${mode.toUpperCase().replace("_", " ")}</b> mode! Select a standard weapon or armor piece.
              </div>
            </div>
          `;
      } else if (
        mode === "shatter" &&
        !window.isItemUnique(window.forgeSelectedItem)
      ) {
        warningHtml = `
            <div style="background:rgba(231,76,60,0.06); border:1.5px dashed #e74c3c; border-radius:6px; padding:10px; margin-bottom:12px; font-size:11px; text-align:center; color:#ff7675; line-height:1.4; white-space:normal; display:flex; align-items:center; justify-content:center; gap:4px;">
              <div>
                ${warningIconSvg} <b>INELIGIBLE ITEM:</b> Only Unique equipment can be shattered into the Codex! Select a Unique Weapon, Subweapon, or Armor piece.
              </div>
            </div>
          `;
      }
    }

    // 3. Mini Vector Icons for Mode Headers (No emojis)
    let attunementHeaderSvg = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9b59b6" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle; margin-right:4px; transform:translateY(-1px);"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>`;
    let reforgeHeaderSvg = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8e44ad" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle; margin-right:4px; transform:translateY(-1px);"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>`;
    let tierHeaderSvg = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#e67e22" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle; margin-right:4px; transform:translateY(-1px);"><polygon points="12,2 15,9 22,9 17,14 19,21 12,17 5,21 7,14 2,9 9,9" /></svg>`;
    let setHeaderSvg = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2ecc71" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle; margin-right:4px; transform:translateY(-1px);"><rect x="3" y="3" width="18" height="18" rx="2" /></svg>`;
    let enchantHeaderSvg = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9b59b6" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle; margin-right:4px; transform:translateY(-1px);"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>`;
    let resetHeaderSvg = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#c0392b" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle; margin-right:4px; transform:translateY(-1px);"><path d="M12 2v20M17 5l-5-5-5 5" /></svg>`;
    let shatterHeaderSvg = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#e74c3c" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle; margin-right:4px; transform:translateY(-1px);"><polygon points="12,2 22,12 12,22 2,12" /></svg>`;

    // 4. Map Dynamic Tutorial Metadata per active mode
    let tutorials = {
      temper: {
        title: "Slot Attunement",
        desc: "Attuning a gear slot permanently multiplies the stats of any item equipped in that slot. This multiplier is bound to the slot itself and persists across item swaps and prestige resets!",
        icon: attunementHeaderSvg,
        color: "#9b59b6",
        steps: [
          "Select a target equipment slot from the list on the right.",
          "Check the Gold and Material requirements below.",
          "Click 'Harness Heat' to upgrade the slot level (+1% stats per level).",
        ],
        tip: "Highly attuned slots (e.g. Lv. 50+) make even common items extremely powerful!",
      },
      reforge: {
        title: "Attribute Reforger",
        desc: "Re-roll individual affix modifiers on your equipment to customize your stats. Perfect for tuning Crit, Block, or Speed.",
        icon: reforgeHeaderSvg,
        color: "#8e44ad",
        steps: [
          "Select a piece of equipment from the list on the right.",
          "Choose the specific modifier line you wish to re-roll.",
          "Click 'Execute Reforge' to spin for a new random modifier.",
        ],
        tip: "Once you reforge a line, all other lines on that item become permanently locked! Reforging requires 1x <b>Overlord's Sigil</b> and Gold.",
      },
      tier: {
        title: "Star Quality Awakening",
        desc: "Ascend the star quality (0★ to 5★) of your weapons and armor. Increasing rarity unlocks new slots for random bonus modifiers.",
        icon: tierHeaderSvg,
        color: "#e67e22",
        steps: [
          "Select an under-5★ item from the list on the right.",
          "Gather the required Eridium Shards and tier-matching scraps.",
          "Click 'Awaken Rarity' to elevate its tier and unlock a new random stat line!",
        ],
        tip: "In addition to a new modifier, Tiering Up increases the item's base parameters by +10%!",
      },
      set: {
        title: "Set Resonance Matrix",
        desc: "Shift the named set affiliation (e.g. Vanguard, Colossus) on your gear to complete matching 2-piece and 3-piece set bonuses.",
        icon: setHeaderSvg,
        color: "#2ecc71",
        steps: [
          "Select any set-affinity equipment piece from the right.",
          "Ensure you have enough Monster Souls and Gold.",
          "Click 'Re-Resonate Set' to roll a different set bonus at random.",
        ],
        tip: "Equipping matching sets provides massive multipliers to Attack, Health, Defense, and Crit stats!",
      },
      enchant: {
        title: "Celestial Enchantment",
        desc: "Infuse powerful magical runes into high-tier attuned equipment. Enchanting targets an existing stat line at random and amplifies its value by a whopping +25%!",
        icon: enchantHeaderSvg,
        color: "#9b59b6",
        steps: [
          "Select a 2★+ item equipped in a slot attuned to at least Level 50.",
          "Ensure you have 1x <b>Overlord's Sigil</b> available.",
          "Click 'Infuse Enchantment' to roll a +25% boost on one of its stats.",
        ],
        tip: "Magic (2★) holds 1, Epic (3★) holds 2, Legendary (4★) holds 3, and Mythic (5★) holds 4 maximum enchantments.",
      },
      reset_enchant: {
        title: "Arcane Purge",
        desc: "Dispel and clear active enchantments from an item, restoring its stats to their original pre-enchanted baseline so you can re-enchant.",
        icon: resetHeaderSvg,
        color: "#c0392b",
        steps: [
          "Select an enchanted item from the list on the right.",
          "Review the Gold cost required to purge the magical seals.",
          "Click 'Purge Enchantments' to safely wipe the runes.",
        ],
        tip: "Resetting enchantments frees up all slots, but spent materials are non-refundable.",
      },
      shatter: {
        title: "Spectral Shatter",
        desc: "Sacrifice unequipped Unique weapons or armor to permanently unlock their active passive effects inside your Spectral Codex!",
        icon: shatterHeaderSvg,
        color: "#e74c3c",
        steps: [
          "Select an unequipped Unique item from the list on the right.",
          "Check the high-end material and Gold costs below.",
          "Click 'Shatter Unique Essence' to extract its passive into your permanent Codex.",
        ],
        tip: "Unlocking a passive inside the Codex allows you to activate its unique modifiers without needing to equip the item!",
      },
    };

    let tut = tutorials[mode] || tutorials.temper;

    // 5. Retrieve Live Crafting Material Balances
    let goldOwned = window.playerStats.coins || 0;
    let mSouls = window.inventory.ETC["Monster Soul"] || 0;
    let lSouls = window.inventory.ETC["Luminous Soul"] || 0;
    let eridium = window.inventory.ETC["Eridium Shard"] || 0;
    let essence = window.inventory.ETC["Astral Essence"] || 0;
    let sigils = window.inventory.ETC["Overlord's Sigil"] || 0;
    let cores = window.inventory.ETC["Catalyst Core"] || 0;

    let rareScrap = window.inventory.ETC["Rare Scrap"] || 0;
    let magicScrap = window.inventory.ETC["Magic Scrap"] || 0;
    let epicScrap = window.inventory.ETC["Epic Scrap"] || 0;
    let legendaryScrap = window.inventory.ETC["Legendary Scrap"] || 0;
    let mythicScrap = window.inventory.ETC["Mythic Scrap"] || 0;

    // 6. Draw Crisp 12px Miniature Vector Icons for Materials Grid (No emojis)
    let goldSvg = `<svg width="12" height="12" viewBox="0 0 12 12" style="display:inline-block; vertical-align:middle; flex-shrink:0;"><circle cx="6" cy="6" r="5" fill="#f1c40f" stroke="#000" stroke-width="0.8"/><circle cx="6" cy="6" r="2.5" fill="none" stroke="#b7950b" stroke-width="0.6"/></svg>`;
    let mSoulsSvg = `<svg width="12" height="12" viewBox="0 0 12 12" style="display:inline-block; vertical-align:middle; flex-shrink:0;"><path d="M6 1.5 C6 1.5, 2 6, 2 9 C2 11, 3.8 11.5, 6 11.5 C8.2 11.5, 10 11, 10 9 C10 6, 6 1.5, 6 1.5 Z" fill="#a0aec0" stroke="#000" stroke-width="0.8"/></svg>`;
    let lSoulsSvg = `<svg width="12" height="12" viewBox="0 0 12 12" style="display:inline-block; vertical-align:middle; flex-shrink:0;"><path d="M6 1.5 C6 1.5, 2 6, 2 9 C2 11, 3.8 11.5, 6 11.5 C8.2 11.5, 10 11, 10 9 C10 6, 6 1.5, 6 1.5 Z" fill="#ffb6c1" stroke="#000" stroke-width="0.8"/></svg>`;
    let eridiumSvg = `<svg width="12" height="12" viewBox="0 0 12 12" style="display:inline-block; vertical-align:middle; flex-shrink:0;"><polygon points="6,1 11,6 6,11 1,6" fill="#8e44ad" stroke="#000" stroke-width="0.8"/></svg>`;
    let essenceSvg = `<svg width="12" height="12" viewBox="0 0 12 12" style="display:inline-block; vertical-align:middle; flex-shrink:0;"><polygon points="6,1 8,4.5 11,5 8.5,7.5 9,11 6,9.5 3,11 3.5,7.5 1,5 4,4.5" fill="#9b59b6" stroke="#000" stroke-width="0.8"/></svg>`;
    let sigilsSvg = `<svg width="12" height="12" viewBox="0 0 12 12" style="display:inline-block; vertical-align:middle; flex-shrink:0;"><path d="M6 1.5 L9.5 5 L8 9 L6 11.5 L4 9 L2.5 5 Z" fill="#1abc9c" stroke="#000" stroke-width="0.8"/></svg>`;
    let coresSvg = `<svg width="12" height="12" viewBox="0 0 12 12" style="display:inline-block; vertical-align:middle; flex-shrink:0;"><rect x="2.2" y="2.2" width="7.6" height="7.6" rx="1" fill="#2ecc71" stroke="#000" stroke-width="0.8"/><rect x="4.5" y="4.5" width="3" height="3" fill="#fff" stroke="#111" stroke-width="0.5"/></svg>`;
    let rareScrapSvg = `<svg width="12" height="12" viewBox="0 0 12 12" style="display:inline-block; vertical-align:middle; flex-shrink:0;"><polygon points="2,5 5,1 10,3 8,10 3,9" fill="#3498db" stroke="#000" stroke-width="0.8"/></svg>`;
    let magicScrapSvg = `<svg width="12" height="12" viewBox="0 0 12 12" style="display:inline-block; vertical-align:middle; flex-shrink:0;"><polygon points="2,5 5,1 10,3 8,10 3,9" fill="#9b59b6" stroke="#000" stroke-width="0.8"/></svg>`;
    let epicScrapSvg = `<svg width="12" height="12" viewBox="0 0 12 12" style="display:inline-block; vertical-align:middle; flex-shrink:0;"><polygon points="2,5 5,1 10,3 8,10 3,9" fill="#e67e22" stroke="#000" stroke-width="0.8"/></svg>`;
    let legendaryScrapSvg = `<svg width="12" height="12" viewBox="0 0 12 12" style="display:inline-block; vertical-align:middle; flex-shrink:0;"><polygon points="2,5 5,1 10,3 8,10 3,9" fill="#f1c40f" stroke="#000" stroke-width="0.8"/></svg>`;
    let mythicScrapSvg = `<svg width="12" height="12" viewBox="0 0 12 12" style="display:inline-block; vertical-align:middle; flex-shrink:0;"><polygon points="2,5 5,1 10,3 8,10 3,9" fill="#e74c3c" stroke="#000" stroke-width="0.8"/></svg>`;

    let materialsList = [
      {
        name: "Gold Coins",
        qty: goldOwned,
        color: "#f1c40f",
        isBigNum: true,
        svg: goldSvg,
      },
      { name: "Monster Souls", qty: mSouls, color: "#a0aec0", svg: mSoulsSvg },
      { name: "Luminous Souls", qty: lSouls, color: "#ffb6c1", svg: lSoulsSvg },
      {
        name: "Eridium Shards",
        qty: eridium,
        color: "#8e44ad",
        svg: eridiumSvg,
      },
      {
        name: "Astral Essence",
        qty: essence,
        color: "#9b59b6",
        svg: essenceSvg,
      },
      {
        name: "Overlord Sigils",
        qty: sigils,
        color: "#1abc9c",
        svg: sigilsSvg,
      },
      { name: "Catalyst Cores", qty: cores, color: "#2ecc71", svg: coresSvg },
      {
        name: "Rare Scraps",
        qty: rareScrap,
        color: "#3498db",
        svg: rareScrapSvg,
      },
      {
        name: "Magic Scraps",
        qty: magicScrap,
        color: "#9b59b6",
        svg: magicScrapSvg,
      },
      {
        name: "Epic Scraps",
        qty: epicScrap,
        color: "#e67e22",
        svg: epicScrapSvg,
      },
      {
        name: "Legendary Scraps",
        qty: legendaryScrap,
        color: "#f1c40f",
        svg: legendaryScrapSvg,
      },
      {
        name: "Mythic Scraps",
        qty: mythicScrap,
        color: "#e74c3c",
        svg: mythicScrapSvg,
      },
    ];

    // Build the non-wrapping responsive inventory grid (fading unowned slots to opacity 0.35)
    let matGridHtml = `<div style="display:grid; grid-template-columns: repeat(2, 1fr); gap:6px; font-family:monospace; font-size:10px; text-align:left;">`;
    materialsList.forEach((m) => {
      let countText = m.isBigNum
        ? window.formatNumber(m.qty)
        : m.qty.toLocaleString();
      let hasItem = m.isBigNum ? BigNum.from(m.qty).gt(0) : m.qty > 0;
      let textColor = hasItem ? "#f1f5f9" : "#444";
      let qtyColor = hasItem ? m.color : "#444";
      let opacity = hasItem ? "1.0" : "0.35";

      matGridHtml += `
          <div style="background:rgba(0,0,0,0.45); border:1px solid #222; border-radius:4px; padding:3px 6px; display:flex; justify-content:space-between; align-items:center; opacity:${opacity}; min-width:0; box-sizing:border-box;">
            <div style="display:flex; align-items:center; gap:4px; min-width:0; flex:1;">
              ${m.svg}
              <span style="color:${textColor}; font-size:8.5px; font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; min-width:0; flex:1;">${m.name}</span>
            </div>
            <strong style="color:${qtyColor}; font-size:9px; font-family:monospace; margin-left:4px; flex-shrink:0;">${countText}</strong>
          </div>
        `;
    });
    matGridHtml += `</div>`;

    // Mini Tag / Label Vector for the Materials Header (No emojis)
    let headerIconSvg = `
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ffd700" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle; margin-right:4px; transform:translateY(-1px);">
          <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
          <line x1="7" y1="7" x2="7.01" y2="7" />
        </svg>
      `;

    // 7. Assemble the Revamped Left Info Panel
    detailEl.innerHTML = `
        <div style="display:flex; flex-direction:column; text-align:left; gap:10px; animation: toastFadeIn 0.25s ease-out;">
            ${warningHtml}

            <div>
                <div style="font-weight:bold; font-size:14px; color:${tut.color}; border-bottom:1.5px solid #222; padding-bottom:6px; margin-bottom:8px; display:flex; align-items:center; gap:6px; text-transform:uppercase; letter-spacing:0.5px;">
                    <span>${tut.icon} ${tut.title}</span>
                </div>
                <p style="font-size:11px; color:#cbd5e1; line-height:1.45; margin:0 0 10px 0; white-space:normal;">
                    ${tut.desc}
                </p>
            </div>

            <!-- Dynamic Step-by-Step Instructions -->
            <div style="background:rgba(0,0,0,0.22); border:1px solid #222; border-radius:6px; padding:10px;">
                <strong style="color:#df9ffb; font-size:9.5px; display:block; margin-bottom:6px; text-transform:uppercase; letter-spacing:0.5px;">📋 Forging Instructions:</strong>
                <div style="display:flex; flex-direction:column; gap:4px; font-size:10.5px; color:#aaa; line-height:1.35;">
                    ${tut.steps.map((step, idx) => `<div>${idx + 1}. ${step}</div>`).join("")}
                </div>
            </div>

            <!-- Mode Highlight Tip -->
            <div style="border-left:3px solid ${tut.color}; background:rgba(255,255,255,0.01); padding:6px 10px; border-radius:0 4px 4px 0; font-size:10.5px; color:#e2e8f0; line-height:1.4; white-space:normal; margin-bottom:4px;">
                <b>TIP:</b> ${tut.tip}
            </div>

            <!-- Materials Inventory -->
            <div style="border-top:1px dashed #333; padding-top:10px; margin-top:4px;">
                <strong style="color:#ffd700; font-size:9.5px; display:block; margin-bottom:6px; text-transform:uppercase; letter-spacing:0.5px;">${headerIconSvg} MATERIALS INVENTORY:</strong>
                ${matGridHtml}
            </div>
        </div>
      `;
    return;
  }

  let item = window.forgeSelectedItem;
  let titleColor = window.getTierColor(item.statsRolled);
  let temperTag =
    item.temperLevel > 0
      ? ` <span style="color:#2ecc71;">[+${item.temperLevel}]</span>`
      : "";
  let html = `<div style="font-weight:bold; font-size:13px; color:${titleColor}; border-bottom:1px solid #333; padding-bottom:4px; margin-bottom:10px;">${item.name}${temperTag}</div>`;

  let previewHtml = "";
  let previewItem = JSON.parse(JSON.stringify(item));

  if (window.forgeMode === "shatter") {
    let uniqueKey = window.getUniqueKey(item);
    let isUnlocked = window.playerStats.spectralCodex.includes(uniqueKey);

    let costGold = 1000000000; // 1 Billion Gold
    let costShards = 250;
    let costCores = 5;
    let costEridium = 5;

    let playerShards = window.playerStats.astralShards || 0;
    let playerCores = window.inventory.ETC["Catalyst Core"] || 0;
    let playerEridium = window.inventory.ETC["Eridium Shard"] || 0;
    let playerGold = BigNum.from(window.playerStats.coins);

    let goldColor = playerGold.gte(costGold) ? "#2ecc71" : "#e74c3c";
    let shardsColor = playerShards >= costShards ? "#9b59b6" : "#e74c3c";
    let coresColor = playerCores >= costCores ? "#2ecc71" : "#e74c3c";
    let eridiumColor = playerEridium >= costEridium ? "#8e44ad" : "#e74c3c";

    let canAfford =
      playerGold.gte(costGold) &&
      playerShards >= costShards &&
      playerCores >= costCores &&
      playerEridium >= costEridium;

    html += `<div style="font-size:11px; margin-bottom:10px; color:#aaa; text-align:left;">Codex Status: ${isUnlocked ? `<span style="color:#2ecc71; font-weight:bold;">UNLOCKED ✓</span>` : `<span style="color:#e74c3c; font-weight:bold;">LOCKED 🔒</span>`}</div>`;

    html += `<div style="margin-top:10px; text-align:left; background:rgba(0,0,0,0.3); border:1px solid #222; padding:8px; border-radius:6px; font-size:11px; line-height:1.45; margin-bottom:12px;">
        <strong style="color:#f1c40f; font-family:monospace; display:block; margin-bottom:4px; text-transform:uppercase; font-size:9.5px;">⚡ SPECTRAL SHATTER RECIPE:</strong>
        <div style="color:${goldColor};">• ${window.formatNumber(costGold)} Gold (Owned: ${window.formatNumber(playerGold)})</div>
        <div style="color:${shardsColor};">• ${costShards}x Astral Shards (Owned: ${playerShards})</div>
        <div style="color:${coresColor};">• ${costCores}x Catalyst Core (Owned: ${playerCores})</div>
        <div style="color:${eridiumColor};">• ${costEridium}x Eridium Shard (Owned: ${playerEridium})</div>
      </div>`;

    if (isUnlocked) {
      html += `<div style="color:#2ecc71; font-weight:bold; text-align:center; padding:10px; font-size:11px; border:1px dashed #2ecc71; background:rgba(46,204,113,0.05); border-radius:4px; margin-bottom:12px;">✓ This Unique's passive effect is already active inside your permanent Spectral Codex!</div>`;
      html += `<button class="forge-anvil-button" style="width:100%; border-color:#222; background:#333; color:#666;" disabled>Already Unlocked</button>`;
    } else {
      html += `<div style="color:#f1c40f; font-size:10px; line-height:1.4; text-align:left; background:rgba(241,196,15,0.05); border:1px dashed #f1c40f; padding:8px; border-radius:4px; margin-bottom:12px;">
          💡 <strong>ASTRAL EXTRACTION ACTIVE:</strong><br>
          This process permanently shatters and destroys the physical item to unlock its passive. You will receive its standard salvage payload of <b>1 to 2x Astral Essences</b> as a bonus!
        </div>`;
      html += `<button class="forge-anvil-button" style="width:100%; border-color:#e74c3c; background:linear-gradient(135deg, #c0392b, #4a154b);" ${canAfford ? "" : "disabled"} onclick="window.executeSpectralShatter(${item.id})">✦ Shatter Unique Essence</button>`;
    }
  } else if (window.forgeMode === "temper") {
    let maxT = window.getMaxTemper(
      window.forgeSelectedItem.statsRolled,
      window.forgeSelectedItem.type,
    );
    if (item.temperLevel >= maxT) {
      html += `<div style="color:#e74c3c; font-weight:bold; text-align:center; padding: 20px 0;">MAXIMUM TEMPER LIMIT REACHED</div>`;
    } else {
      let costGold = window.getTemperGoldCost(item);
      let scrapReqAmount = window.getRequiredScrapAmountForTemper(item);
      let scrapReq = window.getRequiredScrapForTemper(item);
      let failChance = item.temperLevel * 5;
      let playerScrap = window.inventory.ETC[scrapReq] || 0;
      let goldColor =
        window.playerStats.coins >= costGold ? "#f1c40f" : "#e74c3c";
      let scrapColor = playerScrap >= scrapReqAmount ? "#bdc3c7" : "#e74c3c";

      previewItem.temperLevel++;
      window.recalculateItemStats(previewItem);

      // Fetch correctly generated item property comparative differences
      let diffLines = window.getForgeDiffLines(item, previewItem);

      html += `<div style="font-size:11px; margin-bottom:10px; color:#aaa;">Temper Cap: <span style="color:#fff;">${item.temperLevel} / ${maxT}</span></div>`;
      let pct = (item.temperLevel / maxT) * 100;
      html += `<div class="forge-progress-bg"><div class="forge-progress-fill" style="width:${pct}%"></div></div>`;
      html += `<div style="font-size:11px; color:${goldColor}; margin-bottom:3px;">• ${window.formatNumber(costGold)} Gold Required</div>`;
      html += `<div style="font-size:11px; color:${scrapColor}; margin-bottom:10px;">• ${scrapReqAmount.toLocaleString()}x ${scrapReq} (Owned: ${playerScrap.toLocaleString()})</div>`;
      html += `<div style="font-size:11px; color:#e74c3c; font-weight:bold; margin-bottom:15px;">⚠️ ${failChance}% Chance to Fail</div>`;
      html += `<button class="forge-anvil-button" style="width:100%;" ${window.playerStats.coins >= costGold && playerScrap >= scrapReqAmount ? "" : "disabled"} onclick="window.temperItem()">Harness Heat</button>`;

      previewHtml = `
                    <div style="margin-top:15px; padding:12px; background:#111; border:1px solid #3498db; border-radius:6px; box-shadow: 0 4px 10px rgba(0,0,0,0.5);">
                        <div style="color:#3498db; font-weight:bold; font-size:11.5px; margin-bottom:8px; border-bottom:1px solid #222; padding-bottom:6px; text-transform:uppercase; letter-spacing:0.5px;">📈 Tempering Preview ([+${item.temperLevel}] ➔ [+${previewItem.temperLevel}])</div>
                        <div style="display:flex; flex-direction:column; gap:4px;">
                            ${diffLines || '<div style="color:#7f8c8d; font-style:italic; text-align:center; padding:10px;">No stat modifications.</div>'}
                        </div>
                    </div>
                `;
    }
  } else if (window.forgeMode === "reforge") {
    let bonusKeys = [
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
    ];
    let activeBonuses = bonusKeys.filter((k) => item[k] !== 0);

    if (activeBonuses.length === 0) {
      html += `<div style="color:#7f8c8d; font-size:11px; text-align:center; padding:15px 0;">This item has no stat modifiers to reforge!</div>`;
    } else {
      let costGold = Math.floor(
        150 * item.stageLevel * Math.pow(2, item.statsRolled),
      );
      let ownedSigils = window.inventory.ETC["Overlord's Sigil"] || 0;

      let goldColor = BigNum.from(window.playerStats.coins).gte(costGold)
        ? "#f1c40f"
        : "#e74c3c";
      let sigilColor = ownedSigils >= 1 ? "#2ecc71" : "#e74c3c";

      if (!item.reforgedProperty) {
        html += `<div style="font-size:11px; color:#aaa; margin-bottom:8px;">Select a modifier line below to prepare for reforging:</div>`;
        activeBonuses.forEach((bKey) => {
          let valText = item[bKey] > 0 ? `+${item[bKey]}` : `${item[bKey]}`;
          let isSelected = item.tempReforgeProp === bKey;
          let borderStyle = isSelected
            ? "border-color:#2ecc71; background:#1b2a1e;"
            : "border-color:#555; background:#111;";
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
          html += `<div style="font-size:11px; color:${sigilColor}; margin-bottom:12px;">• 1x Overlord's Sigil (Owned: ${ownedSigils.toLocaleString()})</div>`;
          html += `<button class="forge-anvil-button" style="width:100%; border-color:#2ecc71; background: linear-gradient(135deg, #1b2a1e, #111);" ${BigNum.from(window.playerStats.coins).gte(costGold) && ownedSigils >= 1 ? "" : "disabled"} onclick="window.reforgeItemStat()">Execute Reforge</button>`;
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
        html += `<div style="font-size:11px; color:${sigilColor}; margin-bottom:12px;">• 1x Overlord's Sigil (Owned: ${ownedSigils.toLocaleString()})</div>`;
        html += `<button class="forge-anvil-button" style="width:100%; border-color:#9b59b6; background: linear-gradient(135deg, #4a154b, #111);" ${BigNum.from(window.playerStats.coins).gte(costGold) && ownedSigils >= 1 ? "" : "disabled"} onclick="window.reforgeItemStat()">Re-Roll Locked Modifier</button>`;
      }
    }
  } else if (window.forgeMode === "tier") {
    if (item.statsRolled >= 5) {
      html += `<div style="color:#e74c3c; font-weight:bold; text-align:center; padding: 20px 0;">MAXIMUM RARITY REACHED</div>`;
    } else {
      let currentStars = item.statsRolled;
      let targetStars = currentStars + 1;
      let costGold = targetStars * 2500;
      let shardReq = targetStars;
      let scrapReqAmount = targetStars * 5; // e.g. 5 for Rare, 10 for Magic, 15 for Epic, 20 for Leg, 25 for Mythic
      let targetScrapName = window.getScrapYieldName(targetStars);

      let playerShards = window.inventory.ETC["Eridium Shard"] || 0;
      let playerScraps = window.inventory.ETC[targetScrapName] || 0;

      let goldColor = BigNum.from(window.playerStats.coins).gte(costGold)
        ? "#f1c40f"
        : "#e74c3c";
      let shardColor = playerShards >= shardReq ? "#8e44ad" : "#e74c3c";
      let scrapColor = playerScraps >= scrapReqAmount ? "#3498db" : "#e74c3c";

      previewItem.statsRolled++;
      window.scaleItemBonusStats(
        previewItem,
        currentStars,
        previewItem.statsRolled,
      );
      window.recalculateItemStats(previewItem);

      // Fetch correctly generated item property comparative differences for Tier Up
      let diffLines = window.getForgeDiffLines(item, previewItem);

      html += `<div style="font-size:11px; margin-bottom:15px; color:#aaa;">Rarity Transition: <span style="color:#fff;">${currentStars}★</span> ➔ <span style="color:#f1c40f;">${targetStars}★</span></div>`;
      html += `<div style="font-size:11px; color:${goldColor}; margin-bottom:3px;">• ${window.formatNumber(costGold)} Gold Required</div>`;
      html += `<div style="font-size:11px; color:${shardColor}; margin-bottom:3px;">• ${shardReq}x Eridium Shard (Owned: ${playerShards})</div>`;
      html += `<div style="font-size:11px; color:${scrapColor}; margin-bottom:10px;">• ${scrapReqAmount}x ${targetScrapName} (Owned: ${playerScraps})</div>`;
      html += `<div style="font-size:11px; color:#2ecc71; font-weight:bold; margin-bottom:15px;">✨ 100% Awakening Guaranteed</div>`;
      html += `<button class="forge-anvil-button" style="width:100%; border-color:#e67e22;" ${BigNum.from(window.playerStats.coins).gte(costGold) && playerShards >= shardReq && playerScraps >= scrapReqAmount ? "" : "disabled"} onclick="window.temperItem()">Awaken Rarity</button>`;

      previewHtml = `
                    <div style="margin-top:15px; padding:12px; background:#111; border:1px solid #e67e22; border-radius:6px; box-shadow: 0 4px 10px rgba(0,0,0,0.5);">
                        <div style="color:#e67e22; font-weight:bold; font-size:11.5px; margin-bottom:8px; border-bottom:1px solid #222; padding-bottom:6px; text-transform:uppercase; letter-spacing:0.5px;">⭐ Awakening Preview (${currentStars}★ ➔ ${previewItem.statsRolled}★)</div>
                        <div style="display:flex; flex-direction:column; gap:4px;">
                            ${diffLines || '<div style="color:#7f8c8d; font-style:italic; text-align:center; padding:10px;">No stat modifications.</div>'}
                            <div style="margin-top:8px; padding:8px; background:rgba(230,126,34,0.1); border:1px dashed #e67e22; border-radius:4px; font-size:10px; color:#ccc; text-align:center;">
                                * This awakening will permanently increase base parameters by 10% and immediately unlock <b>one new random affix modifier</b>!
                            </div>
                        </div>
                    </div>
                `;
    }
  } else if (window.forgeMode === "enchant") {
    let maxEnchants = window.getMaxEnchants(item);
    let currentEnchants = item.totalEnchants || 0;

    let slotKey = item.type === "subweapon" ? "subweapon" : item.type;
    let slotLevel =
      (window.playerStats.slotUpgrades &&
        window.playerStats.slotUpgrades[slotKey]) ||
      0;
    let isFullyTempered = slotLevel >= 50;

    if (maxEnchants === 0) {
      html += `<div style="color:#e74c3c; font-weight:bold; text-align:center; padding: 20px 0; font-size:11px;">THIS ITEM QUALITY CANNOT HOLD ENCHANTMENTS.<br><br><span style="color:#aaa; font-weight:normal;">Only Magic (2★), Epic (3★), Legendary (4★), and Mythic (5★) items can hold enchantments.</span></div>`;
    } else if (!isFullyTempered) {
      html += `<div style="color:#e74c3c; font-weight:bold; text-align:center; padding: 20px 0; font-size:11px;">SLOT ATTUNEMENT LEVEL 50 REQUIRED<br><br><span style="color:#aaa; font-weight:normal;">Current Slot Attunement Level: [${slotLevel}/100]. Attune this slot to at least Level 50 before infusing cosmic enchantments.</span></div>`;
    } else if (currentEnchants >= maxEnchants) {
      html += `<div style="color:#e74c3c; font-weight:bold; text-align:center; padding: 20px 0; font-size:11px;">MAXIMUM ENCHANTMENT LIMIT REACHED (${maxEnchants}/${maxEnchants})<br><br><span style="color:#aaa; font-weight:normal;">Reset this item's enchantments in "Reset Enchants" mode to enchant again.</span></div>`;
    } else {
      let playerSigil = window.inventory.ETC["Overlord's Sigil"] || 0;
      let sigilColor = playerSigil >= 1 ? "#2ecc71" : "#e74c3c";

      html += `<div style="font-size:11px; margin-bottom:10px; color:#aaa;">Enchantment Slots: <span style="color:#fff; font-weight:bold;">${currentEnchants} / ${maxEnchants}</span></div>`;
      let pct = (currentEnchants / maxEnchants) * 100;
      html += `<div class="forge-progress-bg"><div class="forge-progress-fill" style="width:${pct}%; background: linear-gradient(90deg, #9b59b6, #e84393);"></div></div>`;
      html += `<div style="font-size:11px; color:${sigilColor}; margin-bottom:15px;">• 1x Overlord's Sigil Required (Owned: ${playerSigil})</div>`;
      html += `<div style="font-size:11px; color:#9b59b6; font-weight:bold; margin-bottom:15px;">🔮 Randomly boosts one active parameter by +25%!</div>`;
      html += `<button class="forge-anvil-button" style="width:100%; border-color:#9b59b6; background: linear-gradient(135deg, #4a154b, #1a0221);" ${playerSigil >= 1 ? "" : "disabled"} onclick="window.enchantItem()">Infuse Enchantment</button>`;
    }
  } else if (window.forgeMode === "reset_enchant") {
    let currentEnchants = item.totalEnchants || 0;
    if (currentEnchants === 0) {
      html += `<div style="color:#7f8c8d; font-weight:bold; text-align:center; padding: 20px 0; font-size:11px;">THIS ITEM HAS NO ACTIVE ENCHANTMENTS</div>`;
    } else {
      let resetGoldCost = 1000 * item.stageLevel * (item.statsRolled || 1);
      let goldColor = BigNum.from(window.playerStats.coins).gte(resetGoldCost)
        ? "#f1c40f"
        : "#e74c3c";

      html += `<div style="font-size:11px; margin-bottom:10px; color:#aaa;">Active Enchantments to Purge: <span style="color:#9b59b6; font-weight:bold;">${currentEnchants}</span></div>`;
      html += `<div style="font-size:11px; color:${goldColor}; margin-bottom:15px;">• ${resetGoldCost.toLocaleString()} Gold Required (Owned: ${window.formatNumber(window.playerStats.coins)})</div>`;
      html += `<div style="font-size:11px; color:#e74c3c; font-weight:bold; margin-bottom:15px;">⚠️ Restores all enchanted parameters to their original pre-enchanted values. Material scraps are non-refundable.</div>`;
      html += `<button class="forge-anvil-button" style="width:100%; border-color:#e74c3c; background: linear-gradient(135deg, #c0392b, #111);" ${BigNum.from(window.playerStats.coins).gte(resetGoldCost) ? "" : "disabled"} onclick="window.resetItemEnchants()">Purge Enchantments</button>`;
    }
  } else if (window.forgeMode === "set") {
    let costGold = window.getSetRerollGoldCost(item);
    let soulCost = 25 + item.statsRolled * 25;
    let ownedSouls = window.inventory.ETC["Monster Soul"] || 0;

    let goldColor = BigNum.from(window.playerStats.coins).gte(costGold)
      ? "#f1c40f"
      : "#e74c3c";
    let soulsColor = ownedSouls >= soulCost ? "#bdc3c7" : "#e74c3c";

    html += `<div style="font-size:11px; margin-bottom:10px; color:#aaa;">Current Set Resonance: <span style="color:#2ecc71; font-weight:bold;">${item.setName || "None"}</span></div>`;
    html += `<div style="font-size:11px; color:${goldColor}; margin-bottom:3px;">• ${window.formatNumber(costGold)} Gold Required</div>`;
    html += `<div style="font-size:11px; color:${soulsColor}; margin-bottom:10px;">• ${soulCost}x Monster Soul (Owned: ${ownedSouls.toLocaleString()})</div>`;
    html += `<div style="font-size:11px; color:#2ecc71; font-weight:bold; margin-bottom:15px;">✨ Randomly rolls a different Set bonus!</div>`;
    html += `<button class="forge-anvil-button" style="width:100%; border-color:#2ecc71; background: linear-gradient(135deg, #1b2a1e, #111);" ${BigNum.from(window.playerStats.coins).gte(costGold) && ownedSouls >= soulCost ? "" : "disabled"} onclick="window.rerollItemSet()">Re-Resonate Set</button>`;

    previewHtml = `
                        <div style="margin-top:15px; padding:12px; background:#111; border:1px dashed #2ecc71; border-radius:6px;">
                            <div style="color:#2ecc71; font-weight:bold; font-size:11px; margin-bottom:6px; text-transform:uppercase;">✨ Set re-resonance Pool:</div>
                            <p style="font-size:10px; color:#aaa; margin-bottom:8px; line-height:1.4;">
                                Your item will abandon its current set affiliation and attune to one of these legendary set matrices at random:
                            </p>
                            <div style="font-size:9.5px; color:#fff; display:grid; grid-template-columns: 1fr 1fr; gap:4px; font-family:monospace; background:rgba(0,0,0,0.3); padding:8px; border-radius:4px; max-height:110px; overflow-y:auto;">
                                <div>🛡️ Vanguard (+Atk)</div>
                                <div>💖 Colossus (+HP)</div>
                                <div>🛡️ Bastion (+Def)</div>
                                <div>👟 Windrunner (+Spd)</div>
                                <div>✨ Wraith (+Crit%)</div>
                                <div>💥 Reaver (+CritDmg)</div>
                                <div>🧱 Dreadnought (+Block)</div>
                                <div>⚡ Duellist (+Parry)</div>
                                <div>🧠 Scholar (+INT)</div>
                                <div>💪 Berserker (+STR)</div>
                                <div>🎯 Scout (+DEX)</div>
                                <div>🍀 Fortune (+Gold/Drop)</div>
                                <div>🔮 Mystic (+Qly/INT)</div>
                                <div>🧪 Alchemist (+HP/Atk)</div>
                                <div>👑 Midas' Legacy (+Gold)</div>
                                <div>🧪 Biohazard (Poison)</div>
                                <div>⚔️ Warlord (Shatter)</div>
                                <div>🌌 Void-Touched (Frenzy)</div>
                            </div>
                        </div>
                    `;
  }

  if (
    window.forgeMode === "enchant" &&
    item.temperLevel >= window.getMaxTemper(item.statsRolled, item.type) &&
    item.totalEnchants < window.getMaxEnchants(item) &&
    window.getMaxEnchants(item) > 0
  ) {
    previewHtml = `<div style="margin-top:15px; padding:10px; background:#111; border:1px dashed #9b59b6; border-radius:4px; font-size:11px; color:#ccc; text-align:center;">
                    * Enchanting will permanently snapshot pre-enchant stats, then select 1 parameter at random to scale by <b>+25%</b>.
                </div>`;
  }

  detailEl.innerHTML = html + previewHtml;
};

// --- UNIQUE STYLE SYSTEM ---

// Append Unique Style System directly inside the ItemFactory namespace
Object.assign(window.ItemFactory, {
  getUniqueItemStyle(item) {
    if (!item) return null;
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
    if (!isUnique) return null;

    let bg = "";
    let border = "";
    let shadow = "";
    let glow = "";
    let lore = "";

    if (item.isUniqueSword) {
      bg = "linear-gradient(135deg, #1f0303, #070000)";
      border = "#960018";
      shadow = "#5c000c";
      glow = "rgba(150,0,24,0.4)";
      lore = `"Forged in the veins of the first red dragon, this blade sings a silent, thirsty song. It does not merely cut flesh; it harvests the soul's very current."`;
    } else if (item.isUniqueStaff) {
      bg = "linear-gradient(135deg, #1c0e00, #070200)";
      border = "#e67e22";
      shadow = "#853c00";
      glow = "rgba(230,126,34,0.4)";
      lore = `"Born of a feather plucked from the solar phoenix, its core burns with the warmth of a thousand dying suns. Even in the deepest cold of the void, its fire never falters."`;
    } else if (item.isUniqueSingularity) {
      bg = "linear-gradient(135deg, #0d011a 0%, #1c0529 50%, #030008 100%)";
      border = "#8e44ad";
      shadow = "inset 0 0 12px #510a74, 0 0 15px rgba(232, 67, 147, 0.25)";
      glow = "rgba(142, 68, 173, 0.5)";
      lore = `"This colossal blade harbors the core of a collapsed dying star, pulling the surrounding space into a constant state of gravitational collapse."`;
    } else if (item.isUniqueMaelstrom) {
      bg = "linear-gradient(135deg, #031d0d, #010803)";
      border = "#2ecc71";
      shadow = "#145a32";
      glow = "rgba(46,204,113,0.4)";
      lore = `"Whispers of forgotten gales dance along its razor edge, gathering strength with every swing until the wind itself becomes a solid, cutting force."`;
    } else if (item.isUniqueAegis) {
      bg = "linear-gradient(135deg, #021a2c, #00080f)";
      border = "#3498db";
      shadow = "#1a5276";
      glow = "rgba(52,152,219,0.4)";
      lore = `"A shield constructed of hyper-dense matter harvested from the Event Horizon. It bends local gravity fields to completely arrest kinetic impacts."`;
    } else if (item.isUniqueWatch) {
      bg = "linear-gradient(135deg, #221c03, #0a0800)";
      border = "#f1c40f";
      shadow = "#7d6608";
      glow = "rgba(241,196,15,0.4)";
      lore = `"A complex clockwork matrix that acts as a localized anchor in time. It beats in harmony with your lifeline, stretching fractions of seconds."`;
    } else if (item.isUniqueChronicle) {
      bg = "linear-gradient(135deg, #1f1b0a, #0b0903)";
      border = "#f39c12";
      shadow = "#7e5109";
      glow = "rgba(243,156,18,0.4)";
      lore = `"An ancient, soul-bound lexicon recording every rise and fall of your past incarnations. To read its pages is to remember power long forgotten."`;
    } else if (item.isUniqueWarpCore) {
      bg = "linear-gradient(135deg, #001a1a, #000707)";
      border = "#1abc9c";
      shadow = "#0e6251";
      glow = "rgba(26,188,156,0.4)";
      lore = `"Fitted with micro-singularity thrusters that distort spatial geometry directly ahead of your stride, allowing you to cross landscapes in a single heartbeat."`;
    } else if (item.isUniqueTempest) {
      bg = "linear-gradient(135deg, #03212c, #000c0f)";
      border = "#00d2ff";
      shadow = "#005077";
      glow = "rgba(0,210,255,0.4)";
      lore = `"Stolen from the peaks of the Storm-Warden's spire, this circlet channels wild static friction, responding to bodily trauma with localized lightning strikes."`;
    }
    return { bg, border, shadow, glow, lore };
  },
});

// Legacy Compatibility Aliases to protect references
window.getUniqueItemStyle = (item) =>
  window.ItemFactory.getUniqueItemStyle(item);

// Append Item Generation and Procedural Naming inside ItemFactory
Object.assign(window.ItemFactory, {
  createItemObject(
    chosenType,
    statLinesCount,
    stageScale,
    minStars = 0,
    allowedTraits = null,
  ) {
    let originalType = chosenType;
    if (
      chosenType === "shield" ||
      chosenType === "dagger" ||
      chosenType === "tome"
    ) {
      chosenType = "subweapon";
    }

    let item = {
      id: window.idCounter++,
      name: "",
      type: chosenType,
      statsRolled: statLinesCount,
      temperLevel: 0,
      stageLevel: stageScale,
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
      strPct: 0,
      dexPct: 0,
      intPct: 0,
      trait: null,
      desc: "",
      breakdown: "",
      noun: "",
      setName: null,
    };

    if (chosenType === "subweapon") {
      const subTypes = ["shield", "dagger", "tome"];
      item.subType =
        originalType === "subweapon"
          ? subTypes[Math.floor(Math.random() * subTypes.length)]
          : originalType;
    }

    if (chosenType !== "artifact") {
      let nounList = window.slotNouns[chosenType];
      if (chosenType === "subweapon") {
        nounList = window.slotNouns.subweapon[item.subType];
      }
      item.noun = nounList
        ? nounList[Math.floor(Math.random() * nounList.length)]
        : chosenType.toUpperCase();
    }

    if (chosenType === "ring") {
      // Procedurally assign a wildcard ring type based on its slot noun
      if (item.noun.includes("Signet")) item.subType = "signet";
      else if (item.noun.includes("Loop")) item.subType = "loop";
      else if (item.noun.includes("Band")) item.subType = "band";
      else item.subType = "seal";
    }

    let prestigeMult = 1.0;

    // Direct-Alignment Scaling Model: Mapped on 5-stage increments
    let repStage = window.getEffectiveStage(stageScale * 5);
    let repGrowth = 1.045 + (repStage * 0.04) / (repStage + 200);
    // Mapped on 5-stage scale to align with the standard campaign progression curve
    let repScale = Math.pow(repGrowth, repStage * 0.95);

    let expScale = repScale;
    let hpDefExpScale = repScale;

    // Apply baseline attribute values matching slot configurations (Slot-Specific Base Stats)
    if (chosenType !== "artifact") {
      let baseRarityMult = window.getRarityMultiplier(statLinesCount);
      if (chosenType === "weapon") {
        item.baseAtk = Math.ceil(2.5 * repScale * baseRarityMult);
      } else if (chosenType === "chest" || chosenType === "overall") {
        let overallMult = chosenType === "overall" ? 1.8 : 1.0;
        item.baseDef = Math.ceil(1.5 * repScale * baseRarityMult * overallMult);
        item.baseMaxHp = Math.ceil(
          6.0 * repScale * baseRarityMult * overallMult,
        );
      } else if (chosenType === "helmet" || chosenType === "leggings") {
        item.baseDef = Math.ceil(0.7 * repScale * baseRarityMult);
        item.baseMaxHp = Math.ceil(3.0 * repScale * baseRarityMult);
      } else if (item.type === "boots") {
        item.baseDef = Math.ceil(0.35 * repScale * baseRarityMult);
        item.baseMoveSpeed = Math.ceil(1.0 * stageScale);
      } else if (item.type === "ring") {
        // Decoupled Wildcard Implicit Ring Generation - Supplemental, balanced linear scaling
        let flatRoll = Math.random();
        if (flatRoll < 0.33) {
          item.implicitType = "atk";
          item.baseAtk = Math.ceil(0.6 * repScale * baseRarityMult);
        } else if (flatRoll < 0.66) {
          item.implicitType = "maxHp";
          item.baseMaxHp = Math.ceil(1.5 * repScale * baseRarityMult);
        } else {
          item.implicitType = "def";
          item.baseDef = Math.ceil(0.35 * repScale * baseRarityMult);
        }

        let pctRoll = Math.random();
        let scaleFactor = Math.pow(stageScale, 0.8);
        if (pctRoll < 0.16) {
          item.atkPct = parseFloat((0.04 * scaleFactor).toFixed(4));
        } else if (pctRoll < 0.32) {
          item.maxHpPct = parseFloat((0.04 * scaleFactor).toFixed(4));
        } else if (pctRoll < 0.48) {
          item.defPct = parseFloat((0.04 * scaleFactor).toFixed(4));
        } else if (pctRoll < 0.64) {
          item.strPct = parseFloat((0.04 * scaleFactor).toFixed(4));
        } else if (pctRoll < 0.8) {
          item.dexPct = parseFloat((0.04 * scaleFactor).toFixed(4));
        } else {
          item.intPct = parseFloat((0.04 * scaleFactor).toFixed(4));
        }
      } else if (item.type === "subweapon") {
        // Standard subweapon base stats are computed dynamically during recalculation.
      }
    }

    if (chosenType === "artifact") {
      let filterPool = window.ARTIFACT_POOL;
      if (allowedTraits && allowedTraits.length > 0) {
        filterPool = window.ARTIFACT_POOL.filter((a) =>
          allowedTraits.includes(a.trait),
        );
        if (filterPool.length === 0) filterPool = window.ARTIFACT_POOL;
      }
      let chosenArt = filterPool[Math.floor(Math.random() * filterPool.length)];
      item.name = `${chosenArt.name} (Lv. ${stageScale})`;
      item.trait = chosenArt.trait;
      item.desc = chosenArt.desc;
      item.breakdown = chosenArt.breakdown;
      item.statsRolled = "UNIQUE";
      item.baseAtk = chosenArt.atk || 0;
      item.baseMaxHp = chosenArt.maxHp || 0;
      item.baseDef = chosenArt.def || 0;
      item.baseMoveSpeed = chosenArt.moveSpeed || 0;
      item.baseCritChance = chosenArt.critChance || 0;
      item.bonusCritDamage = chosenArt.critDamage || 0;
      item.baseBlock = chosenArt.block || 0;
      item.baseParry = chosenArt.parry || 0;
      item.bonusActiveSpeed = chosenArt.activeAttackSpeed || 0;
      item.bonusIdleSpeed = chosenArt.idleAttackSpeed || 0;
      item.dropRate = chosenArt.dropRate || 0;
      item.quality = chosenArt.quality || 0;
      item.goldMulti = chosenArt.goldMulti || 0;
      item.rareSpawn = chosenArt.rareSpawn || 0;
      item.fairySpawn = chosenArt.fairySpawn || 0;
      item.baseStr = chosenArt.str || 0;
      item.baseDex = chosenArt.dex || 0;
      item.baseInt = chosenArt.int || 0;
      statLinesCount = 3;
    }

    // Determine target pool configuration matching this slot type (Slot-Specific Pools)
    let pool = [];
    if (chosenType === "artifact") {
      pool = [
        "dropRate",
        "quality",
        "goldMulti",
        "rareSpawn",
        "fairySpawn",
        "str",
        "dex",
        "int",
      ];
    } else if (chosenType === "weapon") {
      pool = ["critChance", "critDamage", "activeSpd", "idleSpd"];
    } else if (chosenType === "chest" || chosenType === "overall") {
      pool = ["maxHp", "def", "str", "dex", "int"];
    } else if (chosenType === "helmet") {
      pool = ["critChance", "activeSpd", "idleSpd"];
    } else if (chosenType === "leggings") {
      pool = ["maxHp", "def", "str", "dex", "int"];
    } else if (chosenType === "boots") {
      pool = ["moveSpeed", "idleSpd", "activeSpd"];
    } else if (chosenType === "ring") {
      // Rings act as the dedicated Flat Base Suffix Engine (restricted strictly to flat rolls)
      pool = ["atk", "maxHp", "def", "str", "dex", "int"];
    } else if (chosenType === "subweapon") {
      if (item.subType === "shield") pool = ["block", "moveSpeed"];
      else if (item.subType === "dagger")
        pool = ["parry", "critChance", "moveSpeed"];
      else if (item.subType === "tome")
        pool = ["critDamage", "activeSpd", "idleSpd", "critChance"];
    }

    pool.sort(() => Math.random() - 0.5);
    // Differentiate flat stats (exponentially scaled) from percentage stats (mildly scaled) to prevent breaking caps
    let rarityMult =
      chosenType === "artifact"
        ? 1.45
        : window.getRarityMultiplier(statLinesCount);
    let pctRarityMult =
      chosenType === "artifact" ? 1.45 : 1 + statLinesCount * 0.15;
    if (chosenType === "overall") {
      rarityMult *= 1.8;
      pctRarityMult *= 1.8;
    }
    let actualStatLines = chosenType === "artifact" ? 3 : statLinesCount + 1;

    for (let i = 0; i < actualStatLines; i++) {
      if (pool.length === 0) break;
      let selectedStat = pool.pop();
      let expBase = expScale; // Controlled exponential base aligned with stage scale * 5

      if (selectedStat === "atk") {
        item.bonusAtk += Math.ceil(
          window.randFloat(0.04, 0.08) * expBase * rarityMult,
        );
      } else if (selectedStat === "maxHp") {
        item.bonusMaxHp += Math.ceil(
          window.randFloat(0.12, 0.24) * expBase * rarityMult,
        );
      } else if (selectedStat === "def") {
        item.bonusDef += Math.ceil(
          window.randFloat(0.04, 0.08) * expBase * rarityMult,
        );
      } else if (selectedStat === "moveSpeed") {
        item.bonusMoveSpeed += Math.ceil(
          window.randInt(1, 2) * stageScale * pctRarityMult * prestigeMult,
        );
      } else if (selectedStat === "critChance") {
        let rolled =
          window.randFloat(0.01, 0.025) *
          Math.sqrt(stageScale) *
          pctRarityMult *
          prestigeMult;
        item.bonusCritChance += parseFloat(Math.min(0.2, rolled).toFixed(4));
      } else if (selectedStat === "critDamage") {
        let rolled =
          window.randFloat(0.03, 0.06) *
          Math.sqrt(stageScale) *
          pctRarityMult *
          prestigeMult;
        item.bonusCritDamage += parseFloat(rolled.toFixed(4));
      } else if (selectedStat === "block") {
        let rolled =
          window.randFloat(0.005, 0.015) *
          Math.sqrt(stageScale) *
          pctRarityMult *
          prestigeMult;
        item.bonusBlock += parseFloat(Math.min(0.15, rolled).toFixed(4));
      } else if (selectedStat === "parry") {
        let rolled =
          window.randFloat(0.005, 0.015) *
          Math.sqrt(stageScale) *
          pctRarityMult *
          prestigeMult;
        item.bonusParry += parseFloat(Math.min(0.15, rolled).toFixed(4));
      } else if (selectedStat === "activeSpd") {
        let sScale = Math.pow(stageScale, 0.3);
        let rMult = 1 + statLinesCount * 0.08;
        let pMult = Math.pow(1.02, window.playerStats.prestigeCount || 0);
        item.bonusActiveSpeed += parseFloat(
          (window.randFloat(0.01, 0.03) * sScale * rMult * pMult).toFixed(4),
        );
      } else if (selectedStat === "idleSpd") {
        let sScale = Math.pow(stageScale, 0.3);
        let rMult = 1 + statLinesCount * 0.08;
        let pMult = Math.pow(1.02, window.playerStats.prestigeCount || 0);
        item.bonusIdleSpeed += parseFloat(
          (window.randFloat(0.01, 0.03) * sScale * rMult * pMult).toFixed(4),
        );
      } else if (selectedStat === "str") {
        let flatStatRarityMult = 1 + statLinesCount * 0.25;
        item.bonusStr += Math.ceil(
          window.randInt(1, 3) *
            Math.pow(stageScale, 1.1) *
            flatStatRarityMult *
            prestigeMult,
        );
      } else if (selectedStat === "dex") {
        let flatStatRarityMult = 1 + statLinesCount * 0.25;
        item.bonusDex += Math.ceil(
          window.randInt(1, 3) *
            Math.pow(stageScale, 1.1) *
            flatStatRarityMult *
            prestigeMult,
        );
      } else if (selectedStat === "int") {
        let flatStatRarityMult = 1 + statLinesCount * 0.25;
        item.bonusInt += Math.ceil(
          window.randInt(1, 3) *
            Math.pow(stageScale, 1.1) *
            flatStatRarityMult *
            prestigeMult,
        );
      } else if (selectedStat === "dropRate") {
        let utilityScale = 1.0 + Math.sqrt(Math.max(1, stageScale) - 1) * 0.12;
        item.dropRate += parseFloat(
          (
            window.randFloat(0.02, 0.05) *
            pctRarityMult *
            prestigeMult *
            utilityScale
          ).toFixed(4),
        );
      } else if (selectedStat === "quality") {
        let utilityScale = 1.0 + Math.sqrt(Math.max(1, stageScale) - 1) * 0.12;
        item.quality += parseFloat(
          (
            window.randFloat(0.01, 0.03) *
            pctRarityMult *
            prestigeMult *
            utilityScale
          ).toFixed(4),
        );
      } else if (selectedStat === "goldMulti") {
        let utilityScale = 1.0 + Math.sqrt(Math.max(1, stageScale) - 1) * 0.12;
        item.goldMulti += parseFloat(
          (
            window.randFloat(0.02, 0.05) *
            pctRarityMult *
            prestigeMult *
            utilityScale
          ).toFixed(4),
        );
      } else if (selectedStat === "rareSpawn") {
        let utilityScale = 1.0 + Math.sqrt(Math.max(1, stageScale) - 1) * 0.12;
        item.rareSpawn += parseFloat(
          (
            window.randFloat(0.002, 0.006) *
            pctRarityMult *
            prestigeMult *
            utilityScale
          ).toFixed(4),
        );
      } else if (selectedStat === "fairySpawn") {
        let utilityScale = 1.0 + Math.sqrt(Math.max(1, stageScale) - 1) * 0.12;
        item.fairySpawn += parseFloat(
          (
            window.randFloat(0.02, 0.06) *
            pctRarityMult *
            prestigeMult *
            utilityScale
          ).toFixed(4),
        );
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
    item.str = (item.baseStr || 0) + item.bonusStr;
    item.dex = (item.baseDex || 0) + item.bonusDex;
    item.int = (item.baseInt || 0) + item.bonusInt;
    item.activeAttackSpeed = item.bonusActiveSpeed;
    item.idleAttackSpeed = item.bonusIdleSpeed;

    // Initialize pristine unmutated baseline values for exact scaling
    item.rawBaseAtk = item.baseAtk || 0;
    item.rawBaseDef = item.baseDef || 0;
    item.rawBaseMaxHp = item.baseMaxHp || 0;
    item.rawBaseInt = item.baseInt || 0;
    item.rawBaseMoveSpeed = item.baseMoveSpeed || 0;
    item.rawBaseBlock = item.baseBlock || 0;
    item.rawBaseParry = item.baseParry || 0;

    item.baseGoldMulti = item.goldMulti || 0;
    item.baseDropRate = item.dropRate || 0;
    item.baseQuality = item.quality || 0;
    item.baseRareSpawn = item.rareSpawn || 0;
    item.baseFairySpawn = item.fairySpawn || 0;

    if (chosenType !== "artifact") {
      let isDungeon = window.playerStats.isDungeonMode;
      let isBoss =
        window.playerStats.isBossMode || window.playerStats.isUberBoss;
      let isRare = window.mob ? !!window.mob.isRare : false;
      item.setName = window.rollSetForItem(
        isBoss,
        isRare,
        isDungeon,
        window.playerStats.currentDungeon,
      );
    }

    if (statLinesCount === 5 && chosenType !== "artifact") {
      if (Math.random() < 0.005) {
        if (chosenType === "weapon") {
          let weapons = ["staff", "sword", "singularity", "maelstrom"];
          let selected = weapons[Math.floor(Math.random() * weapons.length)];
          item.setName = null;
          if (selected === "staff") {
            item.isUniqueStaff = true;
            item.noun = "Phoenix Staff";
            item.name = `🔥 Phoenix Ignition Staff (Lv. ${stageScale})`;
            item.desc =
              "Launches penetrating fireballs that deal 25% Attack damage (3s Cooldown).";
          } else if (selected === "sword") {
            item.isUniqueSword = true;
            item.noun = "Sanguine Reaver";
            item.name = `🩸 Crimson Sanguine Reaver (Lv. ${stageScale})`;
            item.desc =
              "Strikes apply stacking Bleed (Max 5). Strikes at max stacks triggers Rupture, dealing 300% weapon damage and siphoning 10% Max HP.";
          } else if (selected === "singularity") {
            item.isUniqueSingularity = true;
            item.noun = "Singularity Greatsword";
            item.name = `🌌 Void-Sovereign Greatsword (Lv. ${stageScale})`;
            item.desc =
              "Glows for 7s every 30s. Tap during window to enter 5s Storing state, then detonates spatial collapse.";
          } else if (selected === "maelstrom") {
            item.isUniqueMaelstrom = true;
            item.noun = "Maelstrom Glaive";
            item.name = `🌪️ Maelstrom Gale-Glaive (Lv. ${stageScale})`;
            item.desc =
              "Critical strikes project piercing wind gales. Casting gales grants +10% Active & Idle Attack Speed for 6s (stacks up to 3x).";
          }
        } else if (chosenType === "subweapon") {
          let subOptions = ["aegis", "watch", "chronicle"];
          if (item.subType === "dagger") {
            subOptions = ["viper"];
          } else if (item.subType === "shield") {
            subOptions = ["aegis"];
          } else if (item.subType === "tome") {
            subOptions = ["watch", "chronicle", "conduit"];
          }
          let selected =
            subOptions[Math.floor(Math.random() * subOptions.length)];
          item.setName = null;
          if (selected === "aegis") {
            item.subType = "shield";
            item.isUniqueAegis = true;
            item.noun = "Void-Warped Aegis";
            item.name = `🛡️ Void-Warped Bulwark (Lv. ${stageScale})`;
            item.desc =
              "Blocks trigger gravity blasts scaling with Defense. Can be absorbed into Singularity vortex.";
          } else if (selected === "watch") {
            item.subType = "tome";
            item.isUniqueWatch = true;
            item.noun = "Chronos Pocket-Watch";
            item.name = `⏳ Chronos Dial-Watch (Lv. ${stageScale})`;
            item.desc =
              "Triggers 4s Temporal Fracture every 20s. Accelerates attack speeds by 15% and slows enemies by 25%.";
          } else if (selected === "chronicle") {
            item.subType = "tome";
            item.isUniqueChronicle = true;
            item.noun = "Chronicle of the Ascended";
            item.name = `📖 Chronicle of past Lives (Lv. ${stageScale})`;
            item.desc =
              "Boosts XP gain by +200% and bypasses level locks while below 75% peak level.";
          } else if (selected === "conduit") {
            item.subType = "tome";
            item.isUniqueConduit = true;
            item.noun = "Conduit Lexicon";
            item.name = `📖 Conduit of the Lexicon (Lv. ${stageScale})`;
            item.desc =
              "Periodically projects an Aetheric Conduit on the field (15s Cooldown). Discharging it casts triple elemental spells & resets cooldowns.";
          } else if (selected === "viper") {
            item.subType = "dagger";
            item.isUniqueViper = true;
            item.noun = "Perfect Stiletto";
            item.name = `✦ Viper's Perfect Stiletto (Lv. ${stageScale})`;
            item.desc =
              "Critical strikes have a 25% chance to trigger a Perfect Strike reticle. Tapping it within 2s deals 5x defense-bypassing damage and inflicts a toxic poison sting.";
          }
        } else if (chosenType === "boots") {
          item.isUniqueWarpCore = true;
          item.noun = "Warp-Core Greaves";
          item.name = `⚡ Warp-Core Greaves (Lv. ${stageScale})`;
          item.desc =
            "Time Dilation: Attacks speed up by +1% for every 1% of target missing health (up to +99%). Boss kills grant 4s of Maximum Haste.";
        } else if (chosenType === "helmet") {
          item.isUniqueTempest = true;
          item.noun = "Crown of Tempests";
          item.name = `👑 Crown of crackling Tempests (Lv. ${stageScale})`;
          item.desc =
            "Taking damage has 15% chance to call thunderbolt dealing 150% Attack power and stuns.";
        }
      }
    }

    if (
      !item.isUniqueStaff &&
      !item.isUniqueSword &&
      !item.isUniqueSingularity &&
      !item.isUniqueMaelstrom &&
      !item.isUniqueAegis &&
      !item.isUniqueWatch &&
      !item.isUniqueChronicle &&
      !item.isUniqueWarpCore &&
      !item.isUniqueTempest
    ) {
      item.name = this.buildProceduralName(item);
    }
    window.recalculateItemStats(item); // Run full calculations and initialize raw base stats before return
    return item;
  },

  buildProceduralName(item) {
    if (item.statsRolled === "UNIQUE") return item.name;
    let stars = item.statsRolled;

    // Prioritize the Set Name as the theme prefix if it exists!
    let themeName = item.setName || "Standard";

    if (!item.setName && stars > 0) {
      const nomenclature = {
        bonusAtk: "Fierce",
        bonusMaxHp: "Grizzled",
        bonusDef: "Hardened",
        bonusMoveSpeed: "Fleet",
        bonusCritChance: "Precise",
        bonusCritDamage: "Savage",
        bonusBlock: "Stalwart",
        bonusParry: "Nimble",
        bonusStr: "Heavy",
        bonusDex: "Swift",
        bonusInt: "Erudite",
      };

      let highestKey = null;
      let maxVal = -1;
      Object.keys(nomenclature).forEach((k) => {
        if (item[k] > maxVal) {
          maxVal = item[k];
          highestKey = k;
        }
      });
      if (highestKey) themeName = nomenclature[highestKey];
    }

    return `${themeName} ${item.noun} (Lv. ${item.stageLevel})`;
  },
});

// Legacy Compatibility Aliases to protect references
window.createItemObject = (
  chosenType,
  statLinesCount,
  stageScale,
  minStars = 0,
  allowedTraits = null,
) =>
  window.ItemFactory.createItemObject(
    chosenType,
    statLinesCount,
    stageScale,
    minStars,
    allowedTraits,
  );
window.buildProceduralName = (item) =>
  window.ItemFactory.buildProceduralName(item);

// --- STAT RANGES & PREVIEWS ---

// Encapsulate getStatBaseRange directly inside window.ItemFactory
Object.assign(window.ItemFactory, {
  getStatBaseRange(item, statKey) {
    let stageLevel = item.stageLevel || 1;
    let isArt = item.type === "artifact";
    let rarityMult = isArt ? 1.45 : 1 + (item.statsRolled || 0) * 0.15;

    // Direct-Alignment Scaling Model: Mapped on 5-stage increments
    let repStage = stageLevel * 5;
    let repGrowth = 1.045 + (repStage * 0.04) / (repStage + 200);
    let repScale = Math.pow(repGrowth, repStage);

    let expScale = repScale;
    let hpDefExpScale = repScale;

    let min = 0;
    let max = 0;

    // Aligned with core roll ranges (Atk: 0.15~0.35, HP: 0.4~1.2, Def: 0.15~0.35) to prevent out-of-bounds rendering
    if (
      statKey === "atk" &&
      (item.bonusAtk > 0 || item.type === "weapon" || isArt)
    ) {
      min += Math.ceil(0.15 * expScale * rarityMult);
      max += Math.ceil(0.35 * expScale * rarityMult);
    } else if (statKey === "maxHp" && (item.bonusMaxHp > 0 || isArt)) {
      min += Math.ceil(0.4 * hpDefExpScale * rarityMult);
      max += Math.ceil(1.2 * hpDefExpScale * rarityMult);
    } else if (statKey === "def" && (item.bonusDef > 0 || isArt)) {
      min += Math.ceil(0.15 * hpDefExpScale * rarityMult);
      max += Math.ceil(0.35 * hpDefExpScale * rarityMult);
    } else if (statKey === "moveSpeed" && item.bonusMoveSpeed > 0) {
      min += Math.ceil(1 * stageLevel * rarityMult);
      max += Math.ceil(2 * stageLevel * rarityMult);
    } else if (statKey === "str" && (item.bonusStr > 0 || isArt)) {
      min += Math.ceil(1 * Math.pow(stageLevel, 1.2) * rarityMult);
      max += Math.ceil(3 * Math.pow(stageLevel, 1.2) * rarityMult);
    } else if (statKey === "dex" && (item.bonusDex > 0 || isArt)) {
      min += Math.ceil(1 * Math.pow(stageLevel, 1.2) * rarityMult);
      max += Math.ceil(3 * Math.pow(stageLevel, 1.2) * rarityMult);
    } else if (statKey === "int" && (item.bonusInt > 0 || isArt)) {
      min += Math.ceil(1 * Math.pow(stageLevel, 1.2) * rarityMult);
      max += Math.ceil(3 * Math.pow(stageLevel, 1.2) * rarityMult);
    } else if (statKey === "critChance" && item.bonusCritChance > 0) {
      min += 0.01 * Math.sqrt(stageLevel) * rarityMult;
      max += 0.025 * Math.sqrt(stageLevel) * rarityMult;
    } else if (statKey === "critDamage" && item.bonusCritDamage > 0) {
      min += 0.03 * Math.sqrt(stageLevel) * rarityMult;
      max += 0.06 * Math.sqrt(stageLevel) * rarityMult;
    } else if (statKey === "block" && item.bonusBlock > 0) {
      min += 0.005 * Math.sqrt(stageLevel) * rarityMult;
      max += 0.015 * Math.sqrt(stageLevel) * rarityMult;
    } else if (statKey === "parry" && item.bonusParry > 0) {
      min += 0.005 * Math.sqrt(stageLevel) * rarityMult;
      max += 0.015 * Math.sqrt(stageLevel) * rarityMult;
    } else if (statKey === "activeAttackSpeed" && item.bonusActiveSpeed > 0) {
      let sScale = Math.pow(stageLevel, 0.3);
      let rMult = 1 + item.statsRolled * 0.08;
      min += 0.01 * sScale * rMult;
      max += 0.03 * sScale * rMult;
    } else if (statKey === "idleAttackSpeed" && item.bonusIdleSpeed > 0) {
      let sScale = Math.pow(stageLevel, 0.3);
      let rMult = 1 + item.statsRolled * 0.08;
      min += 0.01 * sScale * rMult;
      max += 0.03 * sScale * rMult;
    } else if (statKey === "rareSpawn" && item.rareSpawn > 0) {
      let utilityScale = 1.0 + Math.sqrt(Math.max(1, stageLevel) - 1) * 0.12;
      min += 0.002 * rarityMult * utilityScale;
      max += 0.006 * rarityMult * utilityScale;
    } else if (statKey === "dropRate" && item.dropRate > 0) {
      let utilityScale = 1.0 + Math.sqrt(Math.max(1, stageLevel) - 1) * 0.12;
      min += 0.02 * rarityMult * utilityScale;
      max += 0.05 * rarityMult * utilityScale;
    } else if (statKey === "quality" && item.quality > 0) {
      let utilityScale = 1.0 + Math.sqrt(Math.max(1, stageLevel) - 1) * 0.12;
      min += 0.01 * rarityMult * utilityScale;
      max += 0.03 * rarityMult * utilityScale;
    } else if (statKey === "goldMulti" && item.goldMulti > 0) {
      let utilityScale = 1.0 + Math.sqrt(Math.max(1, stageLevel) - 1) * 0.12;
      min += 0.02 * rarityMult * utilityScale;
      max += 0.05 * rarityMult * utilityScale;
    } else if (statKey === "fairySpawn" && item.fairySpawn > 0) {
      let utilityScale = 1.0 + Math.sqrt(Math.max(1, stageLevel) - 1) * 0.12;
      min += 0.02 * rarityMult * utilityScale;
      max += 0.06 * rarityMult * utilityScale;
    }

    const unscaledStats = ["activeAttackSpeed", "idleAttackSpeed"];
    if (!unscaledStats.includes(statKey)) {
      let prestigeMult = 1.0;
      min *= prestigeMult;
      max *= prestigeMult;
    }

    let tempers = item.temperLevel || 0;
    if (tempers > 0) {
      if (isArt) {
        let artMultiplier = Math.pow(1.15, tempers);
        min *= artMultiplier;
        max *= artMultiplier;

        if (statKey === "atk") {
          min += tempers * 15;
          max += tempers * 15;
        } else if (statKey === "maxHp") {
          min += tempers * 100;
          max += tempers * 100;
        } else if (statKey === "def") {
          min += tempers * 10;
          max += tempers * 10;
        } else if (["str", "dex", "int"].includes(statKey)) {
          min += tempers * 3;
          max += tempers * 3;
        } else if (statKey === "goldMulti") {
          min += tempers * 0.05;
          max += tempers * 0.05;
        } else if (statKey === "dropRate") {
          min += tempers * 0.03;
          max += tempers * 0.03;
        } else if (statKey === "quality") {
          min += tempers * 0.02;
          max += tempers * 0.02;
        } else if (statKey === "fairySpawn") {
          min += tempers * 0.02;
          max += tempers * 0.02;
        } else if (statKey === "rareSpawn") {
          min += tempers * 0.01;
          max += tempers * 0.01;
        } else if (statKey === "critChance") {
          min += tempers * 0.01;
          max += tempers * 0.01;
        } else if (["parry", "block"].includes(statKey)) {
          min += tempers * 0.005;
          max += tempers * 0.005;
        } else if (["idleAttackSpeed", "activeAttackSpeed"].includes(statKey)) {
          min += tempers * 0.03;
          max += tempers * 0.03;
        } else if (statKey === "moveSpeed") {
          min += tempers;
          max += tempers;
        } else if (statKey === "critDamage") {
          min += tempers * 0.025;
          max += tempers * 0.025;
        }
      } else {
        if (
          [
            "atk",
            "maxHp",
            "def",
            "str",
            "dex",
            "int",
            "activeAttackSpeed",
            "idleAttackSpeed",
          ].includes(statKey)
        ) {
          let multiplier = 1 + tempers * 0.08;
          min *= multiplier;
          max *= multiplier;
        }
        if (statKey === "moveSpeed") {
          min += tempers;
          max += tempers;
        } else if (statKey === "critChance") {
          min += tempers * 0.005;
          max += tempers * 0.005;
        } else if (statKey === "critDamage") {
          min += tempers * 0.015;
          max += tempers * 0.015;
        } else if (statKey === "block") {
          min += tempers * 0.005;
          max += tempers * 0.005;
        } else if (statKey === "parry") {
          min += tempers * 0.005;
          max += tempers * 0.005;
        } else if (statKey === "dropRate") {
          min += tempers * 0.01;
          max += tempers * 0.01;
        } else if (statKey === "quality") {
          min += tempers * 0.005;
          max += tempers * 0.005;
        } else if (statKey === "goldMulti") {
          min += tempers * 0.01;
          max += tempers * 0.01;
        } else if (statKey === "rareSpawn") {
          min += tempers * 0.001;
          max += tempers * 0.001;
        } else if (statKey === "fairySpawn") {
          min += tempers * 0.01;
          max += tempers * 0.01;
        }
      }
    }

    if (item.enchantments && item.enchantments[statKey]) {
      let count = item.enchantments[statKey];
      let multiplier = Math.pow(1.25, count);
      const integerStats = ["atk", "maxHp", "def", "str", "dex", "int"];
      if (integerStats.includes(statKey)) {
        min = Math.ceil(min * multiplier);
        max = Math.ceil(max * multiplier);
      } else {
        min = parseFloat((min * multiplier).toFixed(4));
        max = parseFloat((max * multiplier).toFixed(4));
      }
    }

    return { min, max };
  },
});

// Legacy Compatibility Aliases to protect references
window.getStatBaseRange = (item, statKey) =>
  window.ItemFactory.getStatBaseRange(item, statKey);
// Encapsulate formatStatRangeStr directly inside window.ItemFactory
Object.assign(window.ItemFactory, {
  formatStatRangeStr(item, statKey, isPct = false) {
    let range = this.getStatBaseRange(item, statKey);
    if (range.min === 0 && range.max === 0) return "";

    let minStr, maxStr;
    if (statKey === "rareSpawn") {
      minStr = (range.min * 100).toFixed(2) + "%";
      maxStr = (range.max * 100).toFixed(2) + "%";
    } else if (isPct) {
      minStr = Math.floor(range.min * 100) + "%";
      maxStr = Math.floor(range.max * 100) + "%";
    } else if (
      statKey === "activeAttackSpeed" ||
      statKey === "idleAttackSpeed"
    ) {
      minStr = Math.round(range.min * 100) + "%";
      maxStr = Math.round(range.max * 100) + "%";
    } else if (
      ["dropRate", "quality", "goldMulti", "fairySpawn"].includes(statKey)
    ) {
      minStr = Math.floor(range.min * 100) + "%";
      maxStr = Math.floor(range.max * 100) + "%";
    } else {
      minStr = window.formatNumber(range.min);
      maxStr = window.formatNumber(range.max);
    }

    if (minStr === maxStr) {
      return ` <span style="color:#7f8c8d; font-size:9px;">[${minStr}]</span>`;
    }

    return ` <span style="color:#7f8c8d; font-size:9px;">[${minStr} - ${maxStr}]</span>`;
  },
});

// Legacy Compatibility Aliases to protect references
window.formatStatRangeStr = (item, statKey, isPct) =>
  window.ItemFactory.formatStatRangeStr(item, statKey, isPct);

// Append Math Scaling Directly inside window.ItemFactory
Object.assign(window.ItemFactory, {
  scaleItemBonusStats(item, oldStars, newStars) {
    if (
      item.type === "artifact" ||
      oldStars === "UNIQUE" ||
      newStars === "UNIQUE"
    )
      return;
    let oldFlatMult = window.getRarityMultiplier(oldStars);
    let newFlatMult = window.getRarityMultiplier(newStars);
    let flatRatio = newFlatMult / oldFlatMult;

    let oldPctMult = 1 + oldStars * 0.15;
    let newPctMult = 1 + newStars * 0.15;
    let pctRatio = newPctMult / oldPctMult;

    const flatKeys = [
      "bonusAtk",
      "bonusMaxHp",
      "bonusDef",
      "bonusStr",
      "bonusDex",
      "bonusInt",
    ];

    const pctKeys = [
      "bonusMoveSpeed",
      "bonusCritChance",
      "bonusCritDamage",
      "bonusBlock",
      "bonusParry",
      "bonusActiveSpeed",
      "bonusIdleSpeed",
    ];

    flatKeys.forEach((k) => {
      if (item[k]) {
        item[k] = Math.ceil(item[k] * flatRatio);
      }
    });

    pctKeys.forEach((k) => {
      if (item[k]) {
        if (
          [
            "bonusCritChance",
            "bonusCritDamage",
            "bonusBlock",
            "bonusParry",
          ].includes(k)
        ) {
          item[k] = parseFloat((item[k] * pctRatio).toFixed(4));
        } else if (["bonusActiveSpeed", "bonusIdleSpeed"].includes(k)) {
          item[k] = Math.floor(item[k] * pctRatio);
        } else {
          item[k] = Math.ceil(item[k] * pctRatio);
        }
      }
    });
  },
});

// Legacy Compatibility Aliases to protect references
window.scaleItemBonusStats = (item, oldStars, newStars) =>
  window.ItemFactory.scaleItemBonusStats(item, oldStars, newStars);

// Append Stat Recalculation directly inside ItemFactory
Object.assign(window.ItemFactory, {
  recalculateItemStats(item) {
    let stageScale = item.stageLevel || 1;
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

    // Direct-Alignment Scaling Model: Mapped on 5-stage increments
    let repStage = window.getEffectiveStage((item.stageLevel || 1) * 5);
    let repGrowth = 1.045 + (repStage * 0.04) / (repStage + 200);
    // Mapped on 5-stage scale to align with the standard campaign progression curve
    let repScale = Math.pow(repGrowth, repStage * 0.95);

    let expScale = repScale;
    let hpDefExpScale = repScale;

    let prestigeCount = window.playerStats.prestigeCount || 0;
    let prestigeMult = 1.0;

    // Dynamic base scaling transitions for standard slot configurations
    if (item.type !== "artifact" && !window.isItemUnique(item)) {
      // Reset base stats first to avoid double-compounding
      item.baseAtk = 0;
      item.baseMaxHp = 0;
      item.baseDef = 0;
      item.baseMoveSpeed = 0;
      item.baseBlock = 0;
      item.baseParry = 0;
      item.baseInt = 0;
      item.baseStr = 0;
      item.baseDex = 0;
      item.atkPct = 0;
      item.maxHpPct = 0;
      item.defPct = 0;
      item.moveSpeedPct = 0;
      item.strPct = 0;
      item.dexPct = 0;
      item.intPct = 0;
      item.baseCritChance = 0;
      item.baseCritDamage = 0;

      let stars = item.statsRolled || 0;
      let baseRarityMult = window.getRarityMultiplier(stars); // Apply new non-linear rarity multiplier on recalculation
      let noun = item.noun ? item.noun.toLowerCase() : "";

      if (
        item.type === "weapon" &&
        !item.isUniqueStaff &&
        !item.isUniqueSword &&
        !item.isUniqueSingularity &&
        !item.isUniqueMaelstrom
      ) {
        let baseVal = Math.ceil(2.5 * repScale * baseRarityMult);
        if (noun.includes("greatsword") || noun.includes("claymore")) {
          item.baseAtk = Math.ceil(baseVal * 1.15);
          item.baseCritDamage = 0.15;
        } else if (noun.includes("longsword") || noun.includes("broadsword")) {
          item.baseAtk = Math.ceil(baseVal * 0.95);
          item.baseCritChance = 0.04;
        } else if (noun.includes("halberd") || noun.includes("battleaxe")) {
          item.baseAtk = Math.ceil(baseVal * 1.2);
          item.atkPct = 0.05;
        } else if (noun.includes("warhammer") || noun.includes("mace")) {
          item.baseAtk = Math.ceil(baseVal * 1.1);
          item.baseStr = Math.ceil(0.8 * stageScale * baseRarityMult);
        } else {
          item.baseAtk = baseVal;
        }
      } else if (item.type === "chest" || item.type === "overall") {
        let overallMult = item.type === "overall" ? 1.8 : 1.0;
        let baseDefVal = Math.ceil(
          1.5 * repScale * baseRarityMult * overallMult,
        );
        let baseHpVal = Math.ceil(
          6.0 * repScale * baseRarityMult * overallMult,
        );

        if (
          noun.includes("cuirass") ||
          noun.includes("plate_mail") ||
          noun.includes("full_plate")
        ) {
          item.baseDef = Math.ceil(baseDefVal * 1.3);
          item.baseMaxHp = Math.ceil(baseHpVal * 0.8);
          item.defPct = 0.04;
        } else if (noun.includes("hauberk") || noun.includes("chain_mail")) {
          item.baseDef = baseDefVal;
          item.baseMaxHp = baseHpVal;
          item.baseBlock = 0.02;
        } else if (
          noun.includes("brigandine") ||
          noun.includes("doublet") ||
          noun.includes("trenchcoat")
        ) {
          item.baseDef = Math.ceil(baseDefVal * 0.7);
          item.baseMaxHp = Math.ceil(baseHpVal * 1.4);
          item.maxHpPct = 0.05;
        } else if (noun.includes("exosuit")) {
          item.baseDef = baseDefVal;
          item.baseMaxHp = baseHpVal;
          item.maxHpPct = 0.06;
        } else if (noun.includes("robes")) {
          item.baseDef = Math.ceil(baseDefVal * 0.6);
          item.baseMaxHp = Math.ceil(baseHpVal * 1.4);
          item.baseInt = Math.ceil(2.0 * stageScale * baseRarityMult);
        } else {
          item.baseDef = baseDefVal;
          item.baseMaxHp = baseHpVal;
        }
      } else if (item.type === "helmet" && !item.isUniqueTempest) {
        let baseDefVal = Math.ceil(0.7 * repScale * baseRarityMult);
        let baseHpVal = Math.ceil(3.0 * repScale * baseRarityMult);

        if (noun.includes("greathelm") || noun.includes("visor")) {
          item.baseDef = Math.ceil(baseDefVal * 1.25);
          item.baseMaxHp = Math.ceil(baseHpVal * 0.85);
          item.defPct = 0.03;
        } else if (
          noun.includes("armet") ||
          noun.includes("bascinet") ||
          noun.includes("barbuta")
        ) {
          item.baseDef = baseDefVal;
          item.baseMaxHp = baseHpVal;
          item.baseParry = 0.02;
        } else if (noun.includes("circlet") || noun.includes("coif")) {
          item.baseDef = Math.ceil(baseDefVal * 0.65);
          item.baseMaxHp = Math.ceil(baseHpVal * 1.35);
          item.baseCritChance = 0.03;
        } else {
          item.baseDef = baseDefVal;
          item.baseMaxHp = baseHpVal;
        }
      } else if (item.type === "leggings") {
        let baseDefVal = Math.ceil(0.7 * repScale * baseRarityMult);
        let baseHpVal = Math.ceil(3.0 * repScale * baseRarityMult);

        if (noun.includes("legplates")) {
          item.baseDef = Math.ceil(baseDefVal * 1.2);
          item.baseMaxHp = Math.ceil(baseHpVal * 0.8);
          item.defPct = 0.03;
        } else if (noun.includes("greaves")) {
          item.baseDef = baseDefVal;
          item.baseMaxHp = baseHpVal;
          item.baseBlock = 0.02;
        } else if (noun.includes("chausses") || noun.includes("cuisses")) {
          item.baseDef = Math.ceil(baseDefVal * 0.7);
          item.baseMaxHp = Math.ceil(baseHpVal * 1.3);
          item.baseParry = 0.03;
        } else {
          item.baseDef = baseDefVal;
          item.baseMaxHp = baseHpVal;
        }
      } else if (item.type === "boots" && !item.isUniqueWarpCore) {
        let baseDefVal = Math.ceil(0.35 * repScale * baseRarityMult);
        let baseSpdVal = Math.ceil(1.0 * stageScale);

        if (
          noun.includes("sabatons") ||
          noun.includes("steel_boots") ||
          noun.includes("steel")
        ) {
          item.baseDef = Math.ceil(baseDefVal * 1.4);
          item.baseMoveSpeed = Math.ceil(baseSpdVal * 0.8);
          item.defPct = 0.03;
        } else if (noun.includes("sollerets")) {
          item.baseDef = baseDefVal;
          item.baseMoveSpeed = baseSpdVal;
          item.baseParry = 0.02;
        } else if (noun.includes("treads")) {
          item.baseDef = Math.ceil(baseDefVal * 0.6);
          item.baseMoveSpeed = Math.ceil(baseSpdVal * 1.35);
          item.moveSpeedPct = 0.04;
        } else {
          item.baseDef = baseDefVal;
          item.baseMoveSpeed = baseSpdVal;
        }
      } else if (item.type === "ring") {
        if (item.implicitType === undefined) {
          if (item.baseAtk > 0) item.implicitType = "atk";
          else if (item.baseMaxHp > 0) item.implicitType = "maxHp";
          else item.implicitType = "def";
        }
        if (item.implicitType === "atk")
          item.baseAtk = Math.ceil(0.6 * repScale * baseRarityMult);
        else if (item.implicitType === "maxHp")
          item.baseMaxHp = Math.ceil(1.5 * repScale * baseRarityMult);
        else if (item.implicitType === "def")
          item.baseDef = Math.ceil(0.35 * repScale * baseRarityMult);

        let scaleFactor = Math.pow(stageScale, 0.8);
        if (item.atkPct > 0)
          item.atkPct = parseFloat((0.04 * scaleFactor).toFixed(4));
        if (item.maxHpPct > 0)
          item.maxHpPct = parseFloat((0.04 * scaleFactor).toFixed(4));
        if (item.defPct > 0)
          item.defPct = parseFloat((0.04 * scaleFactor).toFixed(4));
        if (item.strPct > 0)
          item.strPct = parseFloat((0.04 * scaleFactor).toFixed(4));
        if (item.dexPct > 0)
          item.dexPct = parseFloat((0.04 * scaleFactor).toFixed(4));
        if (item.intPct > 0)
          item.intPct = parseFloat((0.04 * scaleFactor).toFixed(4));
      } else if (
        item.type === "subweapon" &&
        !item.isUniqueAegis &&
        !item.isUniqueWatch &&
        !item.isUniqueChronicle &&
        !item.isUniqueConduit &&
        !item.isUniqueViper
      ) {
        if (item.subType === "shield") {
          item.baseDef = Math.ceil(1.0 * repScale * baseRarityMult);
          if (noun.includes("buckler")) {
            item.baseBlock = 0.12;
          } else if (noun.includes("tower")) {
            item.baseBlock = 0.02;
          } else {
            item.baseBlock = 0.05;
          }
        } else if (item.subType === "dagger") {
          item.baseAtk = Math.ceil(0.8 * repScale * baseRarityMult);
          if (noun.includes("main-gauche")) {
            item.baseParry = 0.1;
          } else {
            item.baseParry = 0.05;
          }
        } else if (item.subType === "tome") {
          item.baseInt = Math.ceil(1.5 * stageScale * baseRarityMult);
          item.baseAtk = Math.ceil(0.4 * repScale * baseRarityMult);
        }
      }
    } else if (item.type === "artifact") {
      // Artifact parameters are managed statically on drop; preserve them as is
    } else {
      // Reset all stats to build deterministic static unique profiles
      item.baseAtk = 0;
      item.baseMaxHp = 0;
      item.baseDef = 0;
      item.baseMoveSpeed = 0;
      item.baseBlock = 0;
      item.baseParry = 0;
      item.baseInt = 0;
      item.baseStr = 0;
      item.baseDex = 0;
      item.atkPct = 0;
      item.maxHpPct = 0;
      item.defPct = 0;
      item.moveSpeedPct = 0;
      item.strPct = 0;
      item.dexPct = 0;
      item.intPct = 0;
      item.baseCritChance = 0;
      item.baseCritDamage = 0;

      item.bonusAtk = 0;
      item.bonusMaxHp = 0;
      item.bonusDef = 0;
      item.bonusMoveSpeed = 0;
      item.bonusCritChance = 0;
      item.bonusCritDamage = 0;
      item.bonusBlock = 0;
      item.bonusParry = 0;
      item.bonusActiveSpeed = 0;
      item.bonusIdleSpeed = 0;
      item.bonusStr = 0;
      item.bonusDex = 0;
      item.bonusInt = 0;

      if (item.isUniqueStaff) {
        item.baseInt = Math.ceil(20 * stageScale * 18.0);
        item.baseAtk = Math.ceil(8 * stageScale * 18.0);
        item.intPct = 0.15;
        item.bonusAtk = Math.ceil(0.3 * expScale * 18.0);
        item.bonusInt = Math.ceil(2 * Math.pow(stageScale, 1.2) * 2.25);
        item.bonusCritChance = parseFloat(
          (0.02 * Math.sqrt(stageScale) * 1.75).toFixed(4),
        );
        item.bonusCritDamage = parseFloat(
          (0.05 * Math.sqrt(stageScale) * 1.75).toFixed(4),
        );
        item.bonusActiveSpeed = parseFloat(
          (0.02 * Math.pow(stageScale, 0.3) * 1.4).toFixed(4),
        );
      } else if (item.isUniqueSword) {
        item.baseAtk = Math.ceil(30 * stageScale * 18.0);
        item.baseCritChance = 0.08;
        item.bonusAtk = Math.ceil(0.35 * expScale * 18.0);
        item.bonusStr = Math.ceil(3 * Math.pow(stageScale, 1.2) * 2.25);
        item.bonusCritChance = parseFloat(
          (0.025 * Math.sqrt(stageScale) * 1.75).toFixed(4),
        );
        item.bonusCritDamage = parseFloat(
          (0.06 * Math.sqrt(stageScale) * 1.75).toFixed(4),
        );
        item.bonusIdleSpeed = parseFloat(
          (0.025 * Math.pow(stageScale, 0.3) * 1.4).toFixed(4),
        );
      } else if (item.isUniqueSingularity) {
        item.baseAtk = Math.ceil(40 * stageScale * 18.0);
        item.baseCritDamage = 0.3;
        item.bonusAtk = Math.ceil(0.4 * expScale * 18.0);
        item.bonusStr = Math.ceil(4 * Math.pow(stageScale, 1.2) * 2.25);
        item.bonusCritDamage = parseFloat(
          (0.08 * Math.sqrt(stageScale) * 1.75).toFixed(4),
        );
        item.bonusDef = Math.ceil(0.2 * hpDefExpScale * 18.0);
        item.bonusMaxHp = Math.ceil(0.6 * hpDefExpScale * 18.0);
      } else if (item.isUniqueMaelstrom) {
        item.baseAtk = Math.ceil(25 * stageScale * 18.0);
        item.moveSpeedPct = 0.12;
        item.bonusAtk = Math.ceil(0.3 * expScale * 18.0);
        item.bonusDex = Math.ceil(3 * Math.pow(stageScale, 1.2) * 2.25);
        item.bonusActiveSpeed = parseFloat(
          (0.03 * Math.pow(stageScale, 0.3) * 1.4).toFixed(4),
        );
        item.bonusIdleSpeed = parseFloat(
          (0.03 * Math.pow(stageScale, 0.3) * 1.4).toFixed(4),
        );
        item.bonusMoveSpeed = Math.ceil(1.5 * stageScale * 1.75);
      } else if (item.isUniqueAegis) {
        item.baseDef = Math.ceil(15 * stageScale * 18.0);
        item.baseBlock = 0.1;
        item.bonusDef = Math.ceil(0.25 * hpDefExpScale * 18.0);
        item.bonusMaxHp = Math.ceil(0.8 * hpDefExpScale * 18.0);
        item.bonusBlock = parseFloat(
          (0.015 * Math.sqrt(stageScale) * 1.75).toFixed(4),
        );
        item.bonusStr = Math.ceil(3 * Math.pow(stageScale, 1.2) * 2.25);
      } else if (item.isUniqueWatch) {
        item.baseInt = Math.ceil(15 * stageScale * 18.0);
        item.baseAtk = Math.ceil(5 * stageScale * 18.0);
        item.bonusInt = Math.ceil(3 * Math.pow(stageScale, 1.2) * 2.25);
        item.bonusActiveSpeed = parseFloat(
          (0.02 * Math.pow(stageScale, 0.3) * 1.4).toFixed(4),
        );
        item.bonusIdleSpeed = parseFloat(
          (0.02 * Math.pow(stageScale, 0.3) * 1.4).toFixed(4),
        );
        item.bonusMoveSpeed = Math.ceil(1.2 * stageScale * 1.75);
        item.bonusDex = Math.ceil(2 * Math.pow(stageScale, 1.2) * 2.25);
      } else if (item.isUniqueChronicle) {
        item.baseInt = Math.ceil(15 * stageScale * 18.0);
        item.baseAtk = Math.ceil(5 * stageScale * 18.0);
        item.bonusInt = Math.ceil(3 * Math.pow(stageScale, 1.2) * 2.25);
        item.bonusMaxHp = Math.ceil(0.5 * hpDefExpScale * 18.0);
        item.bonusDef = Math.ceil(0.15 * hpDefExpScale * 18.0);
        item.bonusStr = Math.ceil(2 * Math.pow(stageScale, 1.2) * 2.25);
        item.bonusDex = Math.ceil(2 * Math.pow(stageScale, 1.2) * 2.25);
      } else if (item.isUniqueConduit) {
        item.baseInt = Math.ceil(20 * stageScale * 18.0);
        item.baseAtk = Math.ceil(6 * stageScale * 18.0);
        item.bonusInt = Math.ceil(4 * Math.pow(stageScale, 1.2) * 2.25);
        item.bonusActiveSpeed = parseFloat(
          (0.025 * Math.pow(stageScale, 0.3) * 1.4).toFixed(4),
        );
        item.bonusCritChance = parseFloat(
          (0.015 * Math.sqrt(stageScale) * 1.75).toFixed(4),
        );
        item.bonusCritDamage = parseFloat(
          (0.04 * Math.sqrt(stageScale) * 1.75).toFixed(4),
        );
        item.bonusDex = Math.ceil(2 * Math.pow(stageScale, 1.2) * 2.25);
      } else if (item.isUniqueViper) {
        item.baseAtk = Math.ceil(12 * stageScale * 18.0);
        item.baseParry = 0.08;
        item.bonusAtk = Math.ceil(0.25 * expScale * 18.0);
        item.bonusDex = Math.ceil(3 * Math.pow(stageScale, 1.2) * 2.25);
        item.bonusCritChance = parseFloat(
          (0.02 * Math.sqrt(stageScale) * 1.75).toFixed(4),
        );
        item.bonusCritDamage = parseFloat(
          (0.05 * Math.sqrt(stageScale) * 1.75).toFixed(4),
        );
        item.bonusParry = parseFloat(
          (0.015 * Math.sqrt(stageScale) * 1.75).toFixed(4),
        );
      } else if (item.isUniqueWarpCore) {
        item.baseDef = Math.ceil(3.5 * stageScale * 18.0);
        item.baseMoveSpeed = Math.ceil(3.0 * stageScale);
        item.bonusMoveSpeed = Math.ceil(2.0 * stageScale * 1.75);
        item.bonusActiveSpeed = parseFloat(
          (0.02 * Math.pow(stageScale, 0.3) * 1.4).toFixed(4),
        );
        item.bonusIdleSpeed = parseFloat(
          (0.02 * Math.pow(stageScale, 0.3) * 1.4).toFixed(4),
        );
        item.bonusDex = Math.ceil(3 * Math.pow(stageScale, 1.2) * 2.25);
        item.bonusMaxHp = Math.ceil(0.3 * hpDefExpScale * 18.0);
      } else if (item.isUniqueTempest) {
        item.baseDef = Math.ceil(7.0 * stageScale * 18.0);
        item.baseMaxHp = Math.ceil(30.0 * stageScale * 18.0);
        item.bonusMaxHp = Math.ceil(0.5 * hpDefExpScale * 18.0);
        item.bonusDef = Math.ceil(0.15 * hpDefExpScale * 18.0);
        item.bonusInt = Math.ceil(3 * Math.pow(stageScale, 1.2) * 2.25);
        item.bonusParry = parseFloat(
          (0.015 * Math.sqrt(stageScale) * 1.75).toFixed(4),
        );
        item.bonusBlock = parseFloat(
          (0.015 * Math.sqrt(stageScale) * 1.75).toFixed(4),
        );
      }
    }

    // Sum combined totals using standard base values
    item.atk = (item.baseAtk || 0) + item.bonusAtk;
    item.maxHp = (item.baseMaxHp || 0) + item.bonusMaxHp;
    item.def = (item.baseDef || 0) + item.bonusDef;
    item.moveSpeed = (item.baseMoveSpeed || 0) + item.bonusMoveSpeed;
    item.critChance = (item.baseCritChance || 0) + item.bonusCritChance;
    item.critDamage = (item.baseCritDamage || 0) + item.bonusCritDamage;
    item.block = (item.baseBlock || 0) + item.bonusBlock;
    item.parry = (item.baseParry || 0) + item.bonusParry;
    item.activeAttackSpeed =
      (item.baseActiveSpeed || 0) + item.bonusActiveSpeed;
    item.idleAttackSpeed = (item.baseIdleSpeed || 0) + item.bonusIdleSpeed;
    item.str = (item.baseStr || 0) + item.bonusStr;
    item.dex = (item.baseDex || 0) + item.bonusDex;
    item.int = (item.baseInt || 0) + item.bonusInt;

    let tempers = item.temperLevel || 0;
    if (tempers > 0) {
      let isArt = item.type === "artifact";
      if (isArt) {
        let artMultiplier = Math.pow(1.15, tempers);
        item.atk = Math.round(item.atk * artMultiplier) + tempers * 15;
        item.maxHp = Math.round(item.maxHp * artMultiplier) + tempers * 100;
        item.def = Math.round(item.def * artMultiplier) + tempers * 10;
        item.str = Math.round(item.str * artMultiplier) + tempers * 3;
        item.dex = Math.round(item.dex * artMultiplier) + tempers * 3;
        item.int = Math.round(item.int * artMultiplier) + tempers * 3;

        if (item.goldMulti > 0)
          item.goldMulti = parseFloat(
            (item.goldMulti + tempers * 0.05).toFixed(4),
          );
        if (item.dropRate > 0)
          item.dropRate = parseFloat(
            (item.dropRate + tempers * 0.03).toFixed(4),
          );
        if (item.quality > 0)
          item.quality = parseFloat((item.quality + tempers * 0.02).toFixed(4));
        if (item.fairySpawn > 0)
          item.fairySpawn = parseFloat(
            (item.fairySpawn + tempers * 0.02).toFixed(4),
          );
        if (item.rareSpawn > 0)
          item.rareSpawn = parseFloat(
            (item.rareSpawn + tempers * 0.01).toFixed(4),
          );
        if (item.critChance > 0)
          item.critChance = parseFloat(
            (item.critChance + tempers * 0.01).toFixed(4),
          );
        if (item.parry > 0)
          item.parry = parseFloat((item.parry + tempers * 0.005).toFixed(4));
        if (item.block > 0)
          item.block = parseFloat((item.block + tempers * 0.005).toFixed(4));
        if (item.idleAttackSpeed > 0)
          item.idleAttackSpeed = parseFloat(
            (item.idleAttackSpeed + tempers * 0.03).toFixed(4),
          );
        if (item.activeAttackSpeed > 0)
          item.activeAttackSpeed = parseFloat(
            (item.activeAttackSpeed + tempers * 0.03).toFixed(4),
          );
        if (item.moveSpeed > 0) item.moveSpeed += tempers;
        if (item.critDamage > 0)
          item.critDamage = parseFloat(
            (item.critDamage + tempers * 0.025).toFixed(4),
          );
      } else {
        let multiplier = 1 + tempers * 0.08;
        // Scale internal base parameter properties once (no double-scaling!)
        if (item.baseAtk > 0)
          item.baseAtk = Math.round(item.baseAtk * multiplier);
        if (item.baseDef > 0)
          item.baseDef = Math.round(item.baseDef * multiplier);
        if (item.baseMaxHp > 0)
          item.baseMaxHp = Math.round(item.baseMaxHp * multiplier);
        if (item.baseInt > 0)
          item.baseInt = Math.round(item.baseInt * multiplier);

        // Scale combined totals once (including bonus components)
        if (item.atk > 0 || item.type === "weapon")
          item.atk = Math.round(item.atk * multiplier);
        if (item.maxHp > 0) item.maxHp = Math.round(item.maxHp * multiplier);
        if (item.def > 0) item.def = Math.round(item.def * multiplier);
        if (item.str > 0) item.str = Math.round(item.str * multiplier);
        if (item.dex > 0) item.dex = Math.round(item.dex * multiplier);
        if (item.int > 0) item.int = Math.round(item.int * multiplier);

        if (item.moveSpeed > 0) item.moveSpeed += tempers;
        if (item.critChance > 0)
          item.critChance = parseFloat(
            (item.critChance + tempers * 0.005).toFixed(4),
          );
        if (item.critDamage > 0)
          item.critDamage = parseFloat(
            (item.critDamage + tempers * 0.015).toFixed(4),
          );
        if (item.block > 0)
          item.block = parseFloat((item.block + tempers * 0.005).toFixed(4));
        if (item.parry > 0)
          item.parry = parseFloat((item.parry + tempers * 0.005).toFixed(4));
        if (item.dropRate > 0)
          item.dropRate = parseFloat(
            (item.dropRate + tempers * 0.01).toFixed(4),
          );
        if (item.quality > 0)
          item.quality = parseFloat(
            (item.quality + tempers * 0.005).toFixed(4),
          );
        if (item.goldMulti > 0)
          item.goldMulti = parseFloat(
            (item.goldMulti + tempers * 0.01).toFixed(4),
          );
        if (item.rareSpawn > 0)
          item.rareSpawn = parseFloat(
            (item.rareSpawn + tempers * 0.001).toFixed(4),
          );
        if (item.fairySpawn > 0)
          item.fairySpawn = parseFloat(
            (item.fairySpawn + tempers * 0.01).toFixed(4),
          );
        if (item.activeAttackSpeed > 0)
          item.activeAttackSpeed = parseFloat(
            (item.bonusActiveSpeed * (1 + tempers * 0.08)).toFixed(4),
          );
        if (item.idleAttackSpeed > 0)
          item.idleAttackSpeed = parseFloat(
            (item.bonusIdleSpeed * (1 + tempers * 0.08)).toFixed(4),
          );
      }
    }

    if (item.enchantments) {
      for (let statKey in item.enchantments) {
        let count = item.enchantments[statKey];
        let multiplier = Math.pow(1.25, count);
        const integerStats = ["atk", "maxHp", "def", "str", "dex", "int"];
        if (integerStats.includes(statKey)) {
          item[statKey] = Math.ceil(item[statKey] * multiplier);
        } else {
          item[statKey] = parseFloat((item[statKey] * multiplier).toFixed(4));
        }
      }
    }
  },
});

// Legacy Compatibility Aliases to protect references
window.recalculateItemStats = function (item) {
  // Directly routing to the main dynamic recalculator solves a legacy bug where upgraded item base stats remained permanently flat
  window.ItemFactory.recalculateItemStats(item);
};

// Append Item Upgrade Logic directly inside ItemFactory
Object.assign(window.ItemFactory, {
  addRandomStatLineToItem(item) {
    let pool = [];
    if (item.type === "ring") {
      pool = ["atk", "maxHp", "def", "str", "dex", "int"];
    } else if (item.type === "artifact") {
      pool = [
        "critChance",
        "critDamage",
        "block",
        "parry",
        "moveSpeed",
        "activeSpd",
        "idleSpd",
        "str",
        "dex",
        "int",
      ];
    } else {
      pool = [
        "critChance",
        "critDamage",
        "block",
        "parry",
        "moveSpeed",
        "activeSpd",
        "idleSpd",
      ];
    }
    if (item.type === "subweapon") {
      if (item.subType === "shield")
        pool = ["block", "atk", "maxHp", "def", "str"];
      else if (item.subType === "dagger")
        pool = ["parry", "atk", "critChance", "dex"];
      else if (item.subType === "tome")
        pool = ["critDamage", "int", "activeSpd", "idleSpd"];
    }

    pool = pool.filter((stat) => {
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
      pool = [
        "critChance",
        "critDamage",
        "block",
        "parry",
        "atk",
        "maxHp",
        "def",
        "moveSpeed",
        "activeSpd",
        "idleSpd",
        "str",
        "dex",
        "int",
      ];
    }

    let selectedStat = pool[Math.floor(Math.random() * pool.length)];
    let stageScale = item.stageLevel || 1;
    let effStageScale = window.getEffectiveStage(stageScale * 5) / 10;
    // Mapped on 5-stage scale to align with the standard campaign progression curve
    let expScale = Math.pow(1.18, effStageScale) * Math.pow(effStageScale, 2.2);
    let hpDefExpScale =
      Math.pow(1.16, effStageScale) * Math.pow(effStageScale, 2.2);
    let rarityMult = 1 + item.statsRolled * 0.15;
    let prestigeMult = Math.pow(1.08, window.playerStats.prestigeCount || 0);

    if (selectedStat === "atk")
      item.bonusAtk += Math.ceil(
        window.randFloat(0.15, 0.35) * expScale * rarityMult * prestigeMult,
      );
    else if (selectedStat === "maxHp")
      item.bonusMaxHp += Math.ceil(
        window.randFloat(0.4, 1.2) * hpDefExpScale * rarityMult * prestigeMult,
      );
    else if (selectedStat === "def")
      item.bonusDef += Math.ceil(
        window.randFloat(0.15, 0.35) *
          hpDefExpScale *
          rarityMult *
          prestigeMult,
      );
    else if (selectedStat === "moveSpeed")
      item.bonusMoveSpeed += Math.ceil(
        window.randInt(1, 2) * stageScale * rarityMult * prestigeMult,
      );
    else if (selectedStat === "critChance") {
      let rolled =
        window.randFloat(0.01, 0.025) *
        Math.sqrt(stageScale) *
        rarityMult *
        prestigeMult;
      item.bonusCritChance += parseFloat(Math.min(0.2, rolled).toFixed(4));
    } else if (selectedStat === "critDamage") {
      let rolled =
        window.randFloat(0.03, 0.06) *
        Math.sqrt(stageScale) *
        rarityMult *
        prestigeMult;
      item.bonusCritDamage += parseFloat(rolled.toFixed(4));
    } else if (selectedStat === "block") {
      let rolled =
        window.randFloat(0.005, 0.015) *
        Math.sqrt(stageScale) *
        rarityMult *
        prestigeMult;
      item.bonusBlock += parseFloat(Math.min(0.15, rolled).toFixed(4));
    } else if (selectedStat === "parry") {
      let rolled =
        window.randFloat(0.005, 0.015) *
        Math.sqrt(stageScale) *
        rarityMult *
        prestigeMult;
      item.bonusParry += parseFloat(Math.min(0.15, rolled).toFixed(4));
    } else if (selectedStat === "activeSpd") {
      item.bonusActiveSpeed += parseFloat(
        (
          window.randFloat(0.04, 0.1) *
          Math.sqrt(stageScale) *
          rarityMult *
          prestigeMult
        ).toFixed(4),
      );
    } else if (selectedStat === "idleSpd") {
      item.bonusIdleSpeed += parseFloat(
        (
          window.randFloat(0.04, 0.1) *
          Math.sqrt(stageScale) *
          rarityMult *
          prestigeMult
        ).toFixed(4),
      );
    } else if (selectedStat === "str")
      item.bonusStr += Math.ceil(
        window.randInt(1, 3) *
          Math.pow(stageScale, 1.2) *
          pctRarityMult *
          prestigeMult,
      );
    else if (selectedStat === "dex")
      item.bonusDex += Math.ceil(
        window.randInt(1, 3) *
          Math.pow(stageScale, 1.2) *
          pctRarityMult *
          prestigeMult,
      );
    else if (selectedStat === "int")
      item.bonusInt += Math.ceil(
        window.randInt(1, 3) *
          Math.pow(stageScale, 1.2) *
          pctRarityMult *
          prestigeMult,
      );

    window.recalculateItemStats(item);
  },
});

// Legacy Compatibility Aliases to protect references
window.addRandomStatLineToItem = (item) =>
  window.ItemFactory.addRandomStatLineToItem(item);

// --- INVENTORY LOCKS & EQUIP ACTIONS ---

window.toggleLock = function (id) {
  let item =
    window.inventory.EQUIP.find((i) => i.id === id) ||
    (window.inventory.ARTIFACT &&
      window.inventory.ARTIFACT.find((i) => i.id === id)) ||
    (window.inventory.SIGIL && window.inventory.SIGIL.find((i) => i.id === id));
  if (!item) {
    for (let k in window.equippedSlots) {
      if (window.equippedSlots[k] && window.equippedSlots[k].id === id) {
        item = window.equippedSlots[k];
        break;
      }
    }
  }
  if (item) {
    item.locked = !item.locked;
    if (typeof window.pushHeaderToast === "function")
      window.pushHeaderToast(
        item.locked ? "🔒 Item Locked!" : "🔓 Item Unlocked!",
        item.locked ? "#e74c3c" : "#2ecc71",
      );
    if (typeof window.renderInventory === "function") window.renderInventory();
    if (typeof window.renderForgeTab === "function") window.renderForgeTab();
    if (typeof window.updateUI === "function") window.updateUI();
    if (typeof window.saveGame === "function") window.saveGame();
  }
};

// Append equipItem inside window.GameState namespace
window.GameState = window.GameState || {};
Object.assign(window.GameState, {
  equipItem(id) {
    if (typeof window.hideTooltip === "function") window.hideTooltip();
    let isArtifactSack = false;
    let index = window.inventory.EQUIP.findIndex((i) => i.id === id);
    if (index === -1 && window.inventory.ARTIFACT) {
      index = window.inventory.ARTIFACT.findIndex((i) => i.id === id);
      if (index !== -1) isArtifactSack = true;
    }
    if (index === -1) return;
    let item = isArtifactSack
      ? window.inventory.ARTIFACT[index]
      : window.inventory.EQUIP[index];

    // Level requirements removed

    let oldMaxHp = 100;
    if (typeof window.resolvePlayerStats === "function")
      oldMaxHp = window.resolvePlayerStats().maxHp;

    if (item.type === "overall") {
      if (window.equippedSlots.chest) {
        delete window.equippedSlots.chest.isEquippedSlot;
        window.inventory.EQUIP.push(window.equippedSlots.chest);
        window.equippedSlots.chest = null;
      }
      if (window.equippedSlots.leggings) {
        delete window.equippedSlots.leggings.isEquippedSlot;
        window.inventory.EQUIP.push(window.equippedSlots.leggings);
        window.equippedSlots.leggings = null;
      }
      if (window.equippedSlots.overall) {
        delete window.equippedSlots.overall.isEquippedSlot;
        window.inventory.EQUIP.push(window.equippedSlots.overall);
      }
      window.equippedSlots.overall = item;
      item.isEquippedSlot = "overall";
    } else if (item.type === "chest" || item.type === "leggings") {
      if (window.equippedSlots.overall) {
        delete window.equippedSlots.overall.isEquippedSlot;
        window.inventory.EQUIP.push(window.equippedSlots.overall);
        window.equippedSlots.overall = null;
      }
      if (window.equippedSlots[item.type]) {
        delete window.equippedSlots[item.type].isEquippedSlot;
        window.inventory.EQUIP.push(window.equippedSlots[item.type]);
      }
      window.equippedSlots[item.type] = item;
      item.isEquippedSlot = item.type;
    } else if (item.type === "artifact") {
      // Prevent equipping duplicate artifacts in core bag slot clicking
      let isAlreadyEquipped = ["art1", "art2", "art3"].some(
        (slot) =>
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

      if (!window.equippedSlots.art1) {
        window.equippedSlots.art1 = item;
        item.isEquippedSlot = "art1";
      } else if (!window.equippedSlots.art2) {
        window.equippedSlots.art2 = item;
        item.isEquippedSlot = "art2";
      } else {
        if (window.equippedSlots.art3) {
          delete window.equippedSlots.art3.isEquippedSlot;
          window.inventory.ARTIFACT.push(window.equippedSlots.art3);
        }
        window.equippedSlots.art3 = item;
        item.isEquippedSlot = "art3";
      }
    } else if (item.type === "ring") {
      let slotKey = !window.equippedSlots.ring1
        ? "ring1"
        : !window.equippedSlots.ring2
          ? "ring2"
          : "ring1";
      if (window.equippedSlots[slotKey]) {
        delete window.equippedSlots[slotKey].isEquippedSlot;
        window.inventory.EQUIP.push(window.equippedSlots[slotKey]);
      }
      window.equippedSlots[slotKey] = item;
      item.isEquippedSlot = slotKey;
    } else {
      if (window.equippedSlots[item.type]) {
        delete window.equippedSlots[item.type].isEquippedSlot;
        window.inventory.EQUIP.push(window.equippedSlots[item.type]);
      }
      window.equippedSlots[item.type] = item;
      item.isEquippedSlot = item.type;
    }

    if (isArtifactSack) {
      window.inventory.ARTIFACT.splice(index, 1);
    } else {
      window.inventory.EQUIP.splice(index, 1);
    }

    if (typeof window.resolvePlayerStats === "function") {
      let newMaxHp = window.resolvePlayerStats().maxHp;
      window.playerStats.currentHp = window.BigNumMin(
        window.playerStats.currentHp,
        newMaxHp,
      );
    }

    if (typeof window.checkAchievements === "function")
      window.checkAchievements();
    window.state.paperDollDirty = true;
    window.state.inventoryDirty = true;
    if (typeof window.updateUI === "function") window.updateUI();
    if (typeof window.renderInventory === "function") window.renderInventory();
    if (typeof window.renderForgeTab === "function") window.renderForgeTab();
    if (typeof window.saveGame === "function") window.saveGame();
  },
});

// Legacy Compatibility Aliases to protect references
window.equipItem = (id) => window.GameState.equipItem(id);

// Append unequipItem inside window.GameState namespace
window.GameState = window.GameState || {};
Object.assign(window.GameState, {
  unequipItem(slotKey) {
    let maxBag = window.getMaxBagSlots ? window.getMaxBagSlots() : 20;
    if (typeof window.hideTooltip === "function") window.hideTooltip();
    let item = window.equippedSlots[slotKey];
    if (!item) return;

    delete item.isEquippedSlot;
    let oldMaxHp = 100;
    if (typeof window.resolvePlayerStats === "function")
      oldMaxHp = window.resolvePlayerStats().maxHp;

    if (item.type === "artifact") {
      if (window.inventory.ARTIFACT.length >= maxBag) {
        if (typeof window.pushHeaderToast === "function")
          window.pushHeaderToast(`Artifact Sack Full!`, "#e74c3c");
        return;
      }
      window.equippedSlots[slotKey] = null;
      window.inventory.ARTIFACT.push(item);
    } else {
      if (window.inventory.EQUIP.length >= maxBag) {
        if (typeof window.pushHeaderToast === "function")
          window.pushHeaderToast(`Inventory Full!`, "#e74c3c");
        return;
      }
      window.equippedSlots[slotKey] = null;
      window.inventory.EQUIP.push(item);
    }

    if (typeof window.resolvePlayerStats === "function") {
      let newMaxHp = window.resolvePlayerStats().maxHp;
      window.playerStats.currentHp = window.BigNumMin(
        window.playerStats.currentHp,
        newMaxHp,
      );
    }

    if (typeof window.checkAchievements === "function")
      window.checkAchievements();
    window.state.paperDollDirty = true;
    window.state.inventoryDirty = true;
    if (typeof window.updateUI === "function") window.updateUI();
    if (typeof window.renderInventory === "function") window.renderInventory();
    if (typeof window.renderForgeTab === "function") window.renderForgeTab();
    if (typeof window.saveGame === "function") window.saveGame();
  },
});

// Legacy Compatibility Aliases to protect references
window.unequipItem = (slotKey) => window.GameState.unequipItem(slotKey);

window.executeSalvageItemLogic = function (
  item,
  id,
  isEquipped,
  slotToClear,
  isArtifactSack,
  isSigilSack,
) {
  if (window.playerStats.pendingClanProgress) {
    window.playerStats.pendingClanProgress.salvage =
      (window.playerStats.pendingClanProgress.salvage || 0) + 1;
  }

  if (isEquipped) {
    window.equippedSlots[slotToClear] = null;
  } else if (isArtifactSack) {
    window.inventory.ARTIFACT.splice(
      window.inventory.ARTIFACT.indexOf(item),
      1,
    );
  } else if (isSigilSack) {
    window.inventory.SIGIL.splice(window.inventory.SIGIL.indexOf(item), 1);
  } else {
    window.inventory.EQUIP.splice(window.inventory.EQUIP.indexOf(item), 1);
  }
  window.playerStats.itemsSalvaged =
    (window.playerStats.itemsSalvaged || 0) + 1;

  if (typeof window.progressMission === "function") {
    window.progressMission("salvage", 1);
  }

  let rolledTier = item.statsRolled;
  let scrapsGained = [];
  let isArt = item.type === "artifact";
  let scrapName = isArt
    ? "Astral Essence"
    : window.getScrapYieldName(rolledTier);
  let yieldAmount = isArt
    ? Math.floor(Math.random() * 2) + 1
    : Math.floor(Math.random() * 3) + 1;

  if (typeof window.addEtcDrop === "function")
    window.addEtcDrop(scrapName, yieldAmount, true);
  scrapsGained.push(`x${yieldAmount} ${scrapName}`);

  if (!isArt) {
    for (let t = rolledTier - 1; t >= 0; t--) {
      if (Math.random() < 0.6) {
        let lowerYield = Math.floor(Math.random() * 2) + 1;
        let lowerName = window.getScrapYieldName(t);
        if (typeof window.addEtcDrop === "function")
          window.addEtcDrop(lowerName, lowerYield, true);
        scrapsGained.push(`x${lowerYield} ${lowerName}`);
      }
    }
  }

  let cvs = document.getElementById("gameCanvas");
  let w = cvs ? cvs.width : 750;
  let h = cvs ? cvs.height : 250;
  for (let i = 0; i < 30; i++) {
    if (window.particles) {
      window.particles.push({
        x: w / 2,
        y: h / 2,
        vx: (Math.random() - 0.5) * 12,
        vy: (Math.random() - 0.5) * 12,
        radius: Math.random() * 3 + 1.5,
        color: isArt ? "#9b59b6" : Math.random() > 0.5 ? "#bdc3c7" : "#e74c3c",
        alpha: 1,
        life: 35,
      });
    }
  }

  if (typeof window.pushLog === "function")
    window.pushLog(
      `<span style='color:#e74c3c;'>[SALVAGE]</span> Dismantled ${item.name} yielding: ${scrapsGained.join(", ")}`,
    );
  if (typeof window.pushHeaderToast === "function")
    window.pushHeaderToast(
      `♻️ Salvaged: ${scrapsGained.join(", ")}`,
      "#e74c3c",
    );
  if (window.forgeSelectedItem && window.forgeSelectedItem.id === id) {
    window.forgeSelectedItem = null;
    if (typeof window.renderForgeTab === "function") window.renderForgeTab();
  }

  if (typeof window.resolvePlayerStats === "function") {
    let newMaxHp = window.resolvePlayerStats().maxHp;
    window.playerStats.currentHp = window.BigNumMin(
      window.playerStats.currentHp,
      newMaxHp,
    );
  }
  if (typeof window.checkAchievements === "function")
    window.checkAchievements();
  window.state.paperDollDirty = true;
  window.state.inventoryDirty = true;
  if (typeof window.updateUI === "function") window.updateUI();
  if (typeof window.renderInventory === "function") window.renderInventory();
  if (typeof window.saveGame === "function") window.saveGame();
};

window.salvageItem = function (id) {
  if (typeof window.hideTooltip === "function") window.hideTooltip();
  let item = window.inventory.EQUIP.find((i) => i.id === id);
  let isEquipped = false;
  let slotToClear = null;
  let isArtifactSack = false;
  let isSigilSack = false;

  if (!item && window.inventory.ARTIFACT) {
    item = window.inventory.ARTIFACT.find((i) => i.id === id);
    if (item) isArtifactSack = true;
  }
  if (!item && window.inventory.SIGIL) {
    item = window.inventory.SIGIL.find((i) => i.id === id);
    if (item) isSigilSack = true;
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
    if (typeof window.pushHeaderToast === "function")
      window.pushHeaderToast("🔒 Cannot salvage a Locked item!", "#e74c3c");
    return;
  }

  // Check if item is Unique and not yet unlocked in Spectral Codex
  if (typeof window.isItemUnique === "function" && window.isItemUnique(item)) {
    let uniqueKey = window.getUniqueKey(item);
    let isUnlocked =
      window.playerStats.spectralCodex &&
      window.playerStats.spectralCodex.includes(uniqueKey);

    if (!isUnlocked && typeof window.showCustomConfirm === "function") {
      window.showCustomConfirm(
        "⚠️ Unique Not in Codex",
        `This Unique item (<strong>${item.name}</strong>) is not yet unlocked in your Spectral Codex.<br><br>Salvaging it now will forfeit its active passive in your Codex. Are you sure you want to salvage it for materials instead?`,
        "Yes, Salvage",
        "Cancel",
        "#e74c3c",
        () => {
          window.executeSalvageItemLogic(
            item,
            id,
            isEquipped,
            slotToClear,
            isArtifactSack,
            isSigilSack,
          );
        },
      );
      return;
    }
  }

  window.executeSalvageItemLogic(
    item,
    id,
    isEquipped,
    slotToClear,
    isArtifactSack,
    isSigilSack,
  );
};

// Append checkAutoSalvage inside window.GameState namespace
window.GameState = window.GameState || {};
Object.assign(window.GameState, {
  checkAutoSalvage(item, silent = false) {
    if (!item || item.type === "artifact" || item.statsRolled === "UNIQUE")
      return false;
    if (
      window.playerStats.autoSalvageThreshold === undefined ||
      window.playerStats.autoSalvageThreshold < 0
    )
      return false;

    if (item.statsRolled <= window.playerStats.autoSalvageThreshold) {
      let rolledTier = item.statsRolled;
      let scrapName = window.getScrapYieldName(rolledTier);
      let yieldAmount = Math.floor(Math.random() * 3) + 1;
      let activeHarvest = [];

      if (typeof window.addEtcDrop === "function")
        window.addEtcDrop(scrapName, yieldAmount);
      activeHarvest.push(`x${yieldAmount} ${scrapName}`);

      for (let t = rolledTier - 1; t >= 0; t--) {
        if (Math.random() < 0.6) {
          let lowerYield = Math.floor(Math.random() * 2) + 1;
          let lowerName = window.getScrapYieldName(t);
          if (typeof window.addEtcDrop === "function")
            window.addEtcDrop(lowerName, lowerYield);
          activeHarvest.push(`x${lowerYield} ${lowerName}`);
        }
      }

      window.playerStats.itemsSalvaged =
        (window.playerStats.itemsSalvaged || 0) + 1;

      if (!silent) {
        if (typeof window.pushLog === "function")
          window.pushLog(
            `<span style='color:#e74c3c;'>[AUTO-SALVAGE]</span> Automatically deconstructed ${item.name} into: ${activeHarvest.join(", ")}`,
          );
        if (typeof window.pushToast === "function")
          window.pushToast(
            item.name,
            item.statsRolled,
            window.getTierColor(item.statsRolled),
            true,
            1,
            `⚡ Auto-Salvaged: <span style="color:#e74c3c;">${item.name}</span>`,
            null,
            false,
            item,
          );
      }
      return true;
    }
    return false;
  },
});

// Legacy Compatibility Aliases to protect references
window.checkAutoSalvage = (item, silent) =>
  window.GameState.checkAutoSalvage(item, silent);

// --- FORGE ENGINE ACTIONS & CRAFTING MATH ---

// Initialize the ForgeManager namespace and define getMaxTemper
window.ForgeManager = {
  getMaxTemper(stars, type = "") {
    if (stars === "UNIQUE") return 6;
    // Shifted design restriction: maximum temper matches stars rating tier + 1
    return stars + 1;
  },
};

// Legacy Compatibility Aliases to protect references
window.getMaxTemper = (stars, type = "") =>
  window.ForgeManager.getMaxTemper(stars, type);

// Append getRequiredScrapForTemper inside ForgeManager
Object.assign(window.ForgeManager, {
  getRequiredScrapForTemper(item) {
    if (!item) return "Monster Soul";
    if (item.type === "artifact" || item.statsRolled === "UNIQUE")
      return "Catalyst Core";

    const scraps = [
      "Monster Soul",
      "Rare Scrap",
      "Magic Scrap",
      "Epic Scrap",
      "Legendary Scrap",
      "Mythic Scrap",
    ];
    let tierIndex = item.temperLevel || 0;
    return scraps[tierIndex] || "Mythic Scrap";
  },
});

// Legacy Compatibility Aliases to protect references
window.getRequiredScrapForTemper = (item) =>
  window.ForgeManager.getRequiredScrapForTemper(item);

// Append getRequiredScrapAmountForTemper inside ForgeManager
Object.assign(window.ForgeManager, {
  getRequiredScrapAmountForTemper(item) {
    if (!item) return 1;
    let isArtifact = item.type === "artifact" || item.statsRolled === "UNIQUE";
    let targetLevel = (item.temperLevel || 0) + 1;

    if (isArtifact) {
      if (targetLevel <= 2) return 1;
      if (targetLevel <= 4) return 2;
      return 3;
    }

    let stageScaleFactor = 1 + Math.floor((item.stageLevel || 1) / 15);
    const baseAmounts = [50, 20, 10, 5, 3, 1];
    let baseAmount = baseAmounts[item.temperLevel] || 1;
    return baseAmount * stageScaleFactor;
  },
});

// Legacy Compatibility Aliases to protect references
window.getRequiredScrapAmountForTemper = (item) =>
  window.ForgeManager.getRequiredScrapAmountForTemper(item);

// Append getTemperGoldCost inside ForgeManager
Object.assign(window.ForgeManager, {
  getTemperGoldCost(item) {
    let baseCost = item.type === "artifact" ? 1000 : 100;
    let itemLvlMultiplier = BigNum.from(1.045).pow(
      Math.max(0, (item.stageLevel - 1) * 5),
    );
    return BigNum.from(baseCost)
      .mul(BigNum.from(1.5).pow(item.temperLevel))
      .mul(itemLvlMultiplier);
  },
});

// Legacy Compatibility Aliases to protect references
window.getTemperGoldCost = (item) =>
  window.ForgeManager.getTemperGoldCost(item);

// Append getTierUpScrapName inside ForgeManager
Object.assign(window.ForgeManager, {
  getTierUpScrapName(stars) {
    if (stars === 5) return "Mythic Scrap";
    if (stars === 4) return "Legendary Scrap";
    if (stars === 3) return "Epic Scrap";
    if (stars === 2) return "Magic Scrap";
    if (stars === 1) return "Rare Scrap";
    return "Monster Soul";
  },
});

// Legacy Compatibility Aliases to protect references
window.getTierUpScrapName = (stars) =>
  window.ForgeManager.getTierUpScrapName(stars);

// Append getMaxEnchants inside ForgeManager
Object.assign(window.ForgeManager, {
  getMaxEnchants(item) {
    if (item.statsRolled === "UNIQUE" || !item.statsRolled) return 0;
    if (item.statsRolled === 2) return 1;
    if (item.statsRolled === 3) return 2;
    if (item.statsRolled === 4) return 3;
    if (item.statsRolled === 5) return 4;
    return 0;
  },
});

// Legacy Compatibility Aliases to protect references
window.getMaxEnchants = (item) => window.ForgeManager.getMaxEnchants(item);

// Append Enchantment Helpers inside ForgeManager
Object.assign(window.ForgeManager, {
  getEnchantmentSymbol(count) {
    if (!count || count <= 0) return "";
    if (count === 1) return "✦";
    if (count === 2) return "✹";
    if (count === 3) return "❂";
    return "🌌";
  },

  getStatEnchantSuffix(item, statKey) {
    if (item.enchantments && item.enchantments[statKey]) {
      let count = item.enchantments[statKey];
      let symbol = this.getEnchantmentSymbol(count);
      return ` <span style="color:#9b59b6; font-weight:bold;" title="Enchanted ${count} time(s)">${symbol}</span>`;
    }
    return "";
  },
});

// Legacy Compatibility Aliases to protect references
window.getEnchantmentSymbol = (count) =>
  window.ForgeManager.getEnchantmentSymbol(count);
window.getStatEnchantSuffix = (item, statKey) =>
  window.ForgeManager.getStatEnchantSuffix(item, statKey);

// Append getStatIcon inside ForgeManager
Object.assign(window.ForgeManager, {
  getStatIcon(stat) {
    return window.getUiIconSvg(stat, 12) || "❖";
  },
});

// Legacy Compatibility Aliases to protect references
window.getStatIcon = (stat) => window.ForgeManager.getStatIcon(stat);

// --- FORGE UI INTERACTIONS ---

// Append selectForgeItem inside ForgeManager
Object.assign(window.ForgeManager, {
  selectForgeItem(id) {
    let item =
      window.inventory.EQUIP.find((i) => i.id === id) ||
      (window.inventory.ARTIFACT &&
        window.inventory.ARTIFACT.find((i) => i.id === id));
    if (!item) {
      for (let k in window.equippedSlots) {
        if (window.equippedSlots[k] && window.equippedSlots[k].id === id) {
          item = window.equippedSlots[k];
          break;
        }
      }
    }
    window.forgeSelectedItem = item;
    if (typeof window.renderForgeTab === "function") window.renderForgeTab();
  },
  selectForgeSlot(slotKey) {
    window.state.selectedForgeSlot = slotKey;
    if (typeof window.renderForgeTab === "function") window.renderForgeTab();
  },
});

// Legacy Compatibility Aliases to protect references
window.selectForgeItem = (id) => window.ForgeManager.selectForgeItem(id);
window.selectForgeSlot = (slotKey) =>
  window.ForgeManager.selectForgeSlot(slotKey);

// Append setForgeMode inside ForgeManager
Object.assign(window.ForgeManager, {
  setForgeMode(mode) {
    window.forgeMode = mode;
    const modes = [
      "temper",
      "reforge",
      "tier",
      "enchant",
      "reset_enchant",
      "set",
      "shatter",
    ];
    modes.forEach((m) => {
      let el = document.getElementById(
        "btn-mode-" + (m === "reset_enchant" ? "reset-enchant" : m),
      );
      if (el) {
        el.className = "btn-toggle";
        el.style.background = "transparent";
      }
    });

    let activeEl = document.getElementById(
      "btn-mode-" + (mode === "reset_enchant" ? "reset-enchant" : mode),
    );
    if (activeEl) {
      activeEl.className = "btn-toggle active";
      if (mode === "temper") activeEl.style.background = "#2980b9";
      if (mode === "reforge") activeEl.style.background = "#8e44ad";
      if (mode === "tier") activeEl.style.background = "#e67e22";
      if (mode === "enchant") activeEl.style.background = "#9b59b6";
      if (mode === "reset_enchant") activeEl.style.background = "#c0392b";
      if (mode === "set") activeEl.style.background = "#2ecc71";
      if (mode === "shatter") activeEl.style.background = "#c0392b";
    }

    // Register visited sub-tab
    if (window.playerStats && window.playerStats.visitedSubTabs) {
      let subTabKey = "forge_" + mode;
      if (!window.playerStats.visitedSubTabs.includes(subTabKey)) {
        window.playerStats.visitedSubTabs.push(subTabKey);
      }
    }

    // Evaluate triggers on every single forge mode change
    setTimeout(() => {
      if (window.HoorTutorial) {
        window.HoorTutorial.checkTriggers();
      }
    }, 100);

    if (typeof window.renderForgeTab === "function") window.renderForgeTab();
  },
});

// Legacy Compatibility Aliases to protect references
window.setForgeMode = (mode) => window.ForgeManager.setForgeMode(mode);

// Append switchForgeStation inside ForgeManager
Object.assign(window.ForgeManager, {
  switchForgeStation(station) {
    let bm = document.getElementById("blacksmith-modes");
    let em = document.getElementById("enchanter-modes");

    let btnBlacksmith = document.getElementById("btn-forge-station-blacksmith");
    let btnEnchanter = document.getElementById("btn-forge-station-enchanter");

    if (station === "blacksmith") {
      if (btnBlacksmith) btnBlacksmith.classList.add("active");
      if (btnEnchanter) btnEnchanter.classList.remove("active");

      if (bm) {
        bm.classList.remove("hidden");
        bm.style.removeProperty("display");
      }
      if (em) {
        em.classList.add("hidden");
        em.style.removeProperty("display");
      }
      window.setForgeMode("temper");
    } else {
      if (btnBlacksmith) btnBlacksmith.classList.remove("active");
      if (btnEnchanter) btnEnchanter.classList.add("active");

      if (bm) {
        bm.classList.add("hidden");
        bm.style.removeProperty("display");
      }
      if (em) {
        em.classList.remove("hidden");
        em.style.removeProperty("display");
      }
      window.setForgeMode("enchant");
    }
  },
});

// Legacy Compatibility Aliases to protect references
window.switchForgeStation = (station) =>
  window.ForgeManager.switchForgeStation(station);

// Append changeAutoSalvage inside ForgeManager
Object.assign(window.ForgeManager, {
  changeAutoSalvage(val) {
    window.playerStats.autoSalvageThreshold = parseInt(val, 10);
    if (typeof window.saveGame === "function") window.saveGame();
    if (typeof window.updateSalvagePadUI === "function")
      window.updateSalvagePadUI();
    if (typeof window.pushHeaderToast === "function") {
      let tierText = val == -1 ? "Disabled" : `${val}★ and under`;
      window.pushHeaderToast(
        `Auto-Salvage Threshold set to: ${tierText}`,
        "#2ecc71",
      );
    }
  },
});

// Legacy Compatibility Aliases to protect references
window.changeAutoSalvage = (val) => window.ForgeManager.changeAutoSalvage(val);

// Append selectBulkSalvageRarity inside ForgeManager
Object.assign(window.ForgeManager, {
  selectBulkSalvageRarity(val) {
    window.state.bulkSalvageTarget = parseInt(val, 10);
    if (typeof window.updateSalvagePadUI === "function")
      window.updateSalvagePadUI();
  },
});

// Legacy Compatibility Aliases to protect references
window.selectBulkSalvageRarity = (val) =>
  window.ForgeManager.selectBulkSalvageRarity(val);

// Append triggerBulkSalvage inside ForgeManager
Object.assign(window.ForgeManager, {
  triggerBulkSalvage() {
    if (typeof window.hideTooltip === "function") window.hideTooltip();
    let maxStars =
      window.state.bulkSalvageTarget !== undefined
        ? window.state.bulkSalvageTarget
        : 0;

    let targetItems = window.inventory.EQUIP.filter(
      (item) =>
        !item.locked &&
        item.statsRolled !== "UNIQUE" &&
        item.statsRolled <= maxStars,
    );
    if (targetItems.length === 0) {
      if (typeof window.pushHeaderToast === "function")
        window.pushHeaderToast(
          "No eligible unlocked items found under this rarity!",
          "#e74c3c",
        );
      return;
    }

    let label =
      maxStars === 0
        ? "Common Gear (0★)"
        : window.getTierName(maxStars) + " & Under";

    if (typeof window.showCustomConfirm === "function") {
      window.showCustomConfirm(
        "Bulk Deconstruct",
        `Are you sure you want to bulk salvage ${targetItems.length} unlocked items (${label})?`,
        "Deconstruct",
        "Cancel",
        "#e74c3c",
        () => {
          let bulkScrapsHarvested = {};
          function incrementScrap(name, amount) {
            if (!bulkScrapsHarvested[name]) bulkScrapsHarvested[name] = 0;
            bulkScrapsHarvested[name] += amount;
            if (typeof window.addEtcDrop === "function")
              window.addEtcDrop(name, amount, true);
          }

          targetItems.forEach((item) => {
            let rolledTier = item.statsRolled;
            let scrapName = window.getScrapYieldName(rolledTier);
            let yieldAmount = Math.floor(Math.random() * 3) + 1;

            incrementScrap(scrapName, yieldAmount);

            for (let t = rolledTier - 1; t >= 0; t--) {
              if (Math.random() < 0.6) {
                let lowerYield = Math.floor(Math.random() * 2) + 1;
                let lowerName = window.getScrapYieldName(t);
                incrementScrap(lowerName, lowerYield);
              }
            }

            if (
              window.forgeSelectedItem &&
              window.forgeSelectedItem.id === item.id
            ) {
              window.forgeSelectedItem = null;
            }
          });

          window.playerStats.itemsSalvaged =
            (window.playerStats.itemsSalvaged || 0) + targetItems.length;

          if (typeof window.progressMission === "function") {
            window.progressMission("salvage", targetItems.length);
          }
          if (window.playerStats.pendingClanProgress) {
            window.playerStats.pendingClanProgress.salvage =
              (window.playerStats.pendingClanProgress.salvage || 0) +
              targetItems.length;
          }

          let targetIds = new Set(targetItems.map((item) => item.id));
          window.inventory.EQUIP = window.inventory.EQUIP.filter(
            (item) => !targetIds.has(item.id),
          );

          let cvs = document.getElementById("gameCanvas");
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
                life: Math.random() * 30 + 15,
              });
            }
          }

          let outputReport = Object.keys(bulkScrapsHarvested)
            .map((k) => `x${bulkScrapsHarvested[k]} ${k}`)
            .join(", ");

          if (typeof window.pushLog === "function")
            window.pushLog(
              `<span style='color:#e74c3c;'>[BULK SALVAGE]</span> Dismantled ${targetItems.length} items. Harvested: ${outputReport}`,
            );
          if (typeof window.pushHeaderToast === "function")
            window.pushHeaderToast(
              "♻️ Bulk Salvaged " + targetItems.length + " Items!",
              "#e74c3c",
            );

          if (typeof window.resolvePlayerStats === "function") {
            let newMaxHp = window.resolvePlayerStats().maxHp;
            window.playerStats.currentHp = Math.max(
              1,
              Math.min(
                newMaxHp,
                Math.floor(
                  (window.playerStats.currentHp / oldMaxHp) * newMaxHp,
                ),
              ),
            );
          }

          if (typeof window.checkAchievements === "function")
            window.checkAchievements();
          if (typeof window.updateUI === "function") window.updateUI();
          if (typeof window.renderInventory === "function")
            window.renderInventory();
          if (typeof window.renderForgeTab === "function")
            window.renderForgeTab();
          if (typeof window.saveGame === "function") window.saveGame();
        },
      );
    }
  },
});

// Legacy Compatibility Aliases to protect references
window.triggerBulkSalvage = () => window.ForgeManager.triggerBulkSalvage();

// --- FORGE CRAFTING PROCESSES ---

// Append temperItem inside ForgeManager
Object.assign(window.ForgeManager, {
  temperItem() {
    if (window.forgeMode === "temper") {
      let slotKey = window.state.selectedForgeSlot || "weapon";
      window.playerStats.slotUpgrades = window.playerStats.slotUpgrades || {
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
      let curLvl = window.playerStats.slotUpgrades[slotKey] || 0;
      if (curLvl >= 100) return;

      let cost = window.getSlotUpgradeCost(slotKey, curLvl);
      let coins = BigNum.from(window.playerStats.coins);
      if (coins.lt(cost.gold)) {
        if (typeof window.pushHeaderToast === "function")
          window.pushHeaderToast(
            "❌ Not enough Gold to attune slot!",
            "#e74c3c",
          );
        return;
      }

      for (let mat of cost.materials) {
        let owned =
          window.inventory.ETC[mat.name] || window.inventory.USE[mat.name] || 0;
        if (owned < mat.qty) {
          if (typeof window.pushHeaderToast === "function")
            window.pushHeaderToast(
              `❌ Lacking required ${mat.name}!`,
              "#e74c3c",
            );
          return;
        }
      }

      // Deduct resources
      window.playerStats.coins = BigNum.from(window.playerStats.coins).sub(
        cost.gold,
      );
      if (window.playerStats.coins.eq(0)) {
        window.playerStats.hasTriggeredExactChange = true;
      }

      for (let mat of cost.materials) {
        if (window.inventory.ETC[mat.name] !== undefined) {
          window.inventory.ETC[mat.name] -= mat.qty;
          if (window.inventory.ETC[mat.name] === 0)
            delete window.inventory.ETC[mat.name];
        } else if (window.inventory.USE[mat.name] !== undefined) {
          window.inventory.USE[mat.name] -= mat.qty;
          if (window.inventory.USE[mat.name] === 0)
            delete window.inventory.USE[mat.name];
        }
      }

      window.playerStats.slotUpgrades[slotKey]++;

      // Recalculate statistics for the equipped item on the fly and trigger redraw flags
      let eqItem = window.equippedSlots[slotKey];
      if (eqItem) {
        window.recalculateItemStats(eqItem);
      }
      window.state.paperDollDirty = true;
      window.invalidatePlayerStats();

      window.playerStats.totalTempers =
        (window.playerStats.totalTempers || 0) + 1;

      if (window.playerStats.pendingClanProgress) {
        window.playerStats.pendingClanProgress.tempers =
          (window.playerStats.pendingClanProgress.tempers || 0) + 1;
      }
      if (typeof window.progressMission === "function") {
        window.progressMission("tempers", 1);
      }

      let displayKey = slotKey.toUpperCase();
      if (typeof window.pushLog === "function")
        window.pushLog(
          `<span style='color:#e67e22;'>[FORGE]</span> Successfully attuned the <strong style='color:#f1c40f;'>${displayKey} SLOT</strong> to Level ${window.playerStats.slotUpgrades[slotKey]}!`,
        );
      if (typeof window.pushHeaderToast === "function")
        window.pushHeaderToast(
          `🔨 Attuned ${displayKey} to Lv. ${window.playerStats.slotUpgrades[slotKey]}!`,
          "#2ecc71",
        );
      if (typeof window.spawnTemperParticles === "function")
        window.spawnTemperParticles(true);
      if (typeof window.checkAchievements === "function")
        window.checkAchievements();
    } else if (window.forgeMode === "tier") {
      if (window.forgeSelectedItem.statsRolled >= 5) return;
      let currentStars = window.forgeSelectedItem.statsRolled;
      let targetStars = currentStars + 1;
      let costGold = targetStars * 2500;
      let shardReq = targetStars;
      let scrapReqAmount = targetStars * 5;
      let targetScrapName = window.getScrapYieldName(targetStars);

      let playerShards = window.inventory.ETC["Eridium Shard"] || 0;
      let playerScraps = window.inventory.ETC[targetScrapName] || 0;
      let coins = BigNum.from(window.playerStats.coins);

      if (coins.lt(costGold)) {
        if (typeof window.pushLog === "function")
          window.pushLog(
            `<span style='color:#e74c3c;'>Not enough Gold to Tier Up!</span>`,
          );
        return;
      }
      if (playerShards < shardReq) {
        if (typeof window.pushLog === "function")
          window.pushLog(
            `<span style='color:#e74c3c;'>Not enough Eridium Shards!</span>`,
          );
        return;
      }
      if (playerScraps < scrapReqAmount) {
        if (typeof window.pushLog === "function")
          window.pushLog(
            `<span style='color:#e74c3c;'>Not enough ${targetScrapName}!</span>`,
          );
        return;
      }

      window.playerStats.coins = BigNum.from(window.playerStats.coins).sub(
        costGold,
      );
      window.inventory.ETC["Eridium Shard"] -= shardReq;
      if (window.inventory.ETC["Eridium Shard"] === 0)
        delete window.inventory.ETC["Eridium Shard"];

      window.inventory.ETC[targetScrapName] -= scrapReqAmount;
      if (window.inventory.ETC[targetScrapName] === 0)
        delete window.inventory.ETC[targetScrapName];

      window.scaleItemBonusStats(
        window.forgeSelectedItem,
        currentStars,
        targetStars,
      );

      window.forgeSelectedItem.statsRolled++;
      window.addRandomStatLineToItem(window.forgeSelectedItem);
      window.forgeSelectedItem.name = window.buildProceduralName(
        window.forgeSelectedItem,
      );

      if (typeof window.pushLog === "function")
        window.pushLog(
          `<span style='color:#e67e22;'>[FORGE]</span> Successfully Tiered Up ${window.forgeSelectedItem.name} to ${window.forgeSelectedItem.statsRolled}★!`,
        );
      if (typeof window.pushHeaderToast === "function")
        window.pushHeaderToast(
          "⭐ Tier Up! " + window.forgeSelectedItem.statsRolled + "★",
          "#e67e22",
        );
      if (typeof window.spawnTemperParticles === "function")
        window.spawnTemperParticles(true);
    }

    if (typeof window.updateUI === "function") window.updateUI();
    if (typeof window.renderInventory === "function") window.renderInventory();
    if (typeof window.renderForgeTab === "function") window.renderForgeTab();
    if (typeof window.saveGame === "function") window.saveGame();
  },
});

// Legacy Compatibility Aliases to protect references
window.temperItem = () => window.ForgeManager.temperItem();

// Append enchantItem inside ForgeManager
Object.assign(window.ForgeManager, {
  enchantItem() {
    if (!window.forgeSelectedItem) return;
    let item = window.forgeSelectedItem;

    let slotKey =
      item.isEquippedSlot ||
      (item.type === "subweapon" ? "subweapon" : item.type);
    let slotLevel = 0;

    if (item.type === "ring" && !item.isEquippedSlot) {
      // Check the highest of your two ring slots for unequipped inventory rings
      slotLevel = Math.max(
        window.playerStats.slotUpgrades.ring1 || 0,
        window.playerStats.slotUpgrades.ring2 || 0,
      );
    } else {
      slotLevel =
        (window.playerStats.slotUpgrades &&
          window.playerStats.slotUpgrades[slotKey]) ||
        0;
    }

    if (slotLevel < 50) {
      if (typeof window.pushHeaderToast === "function")
        window.pushHeaderToast(
          `Slot Attunement Level 50 Required! (${slotLevel}/50)`,
          "#e74c3c",
        );
      return;
    }

    let maxEnchants = this.getMaxEnchants(item);
    let currentEnchants = item.totalEnchants || 0;
    if (currentEnchants >= maxEnchants) {
      if (typeof window.pushHeaderToast === "function")
        window.pushHeaderToast("Max Enchantments Reached!", "#e74c3c");
      return;
    }

    let playerEssence = window.inventory.ETC["Astral Essence"] || 0;
    if (playerEssence < 1) {
      if (typeof window.pushHeaderToast === "function")
        window.pushHeaderToast("Requires 1 Astral Essence!", "#e74c3c");
      return;
    }

    let validStats = [];
    const ENCHANTABLE_STATS = [
      "atk",
      "maxHp",
      "def",
      "moveSpeed",
      "critChance",
      "critDamage",
      "block",
      "parry",
      "str",
      "dex",
      "int",
      "activeAttackSpeed",
      "idleAttackSpeed",
    ];
    ENCHANTABLE_STATS.forEach((stat) => {
      if (stat === "activeAttackSpeed" || stat === "idleAttackSpeed") {
        if (item[stat] < 0) validStats.push(stat);
      } else {
        if (item[stat] > 0) validStats.push(stat);
      }
    });

    if (validStats.length === 0) {
      if (typeof window.pushHeaderToast === "function")
        window.pushHeaderToast(
          "This item has no stat lines to enchant!",
          "#e74c3c",
        );
      return;
    }

    window.inventory.ETC["Astral Essence"]--;
    if (window.inventory.ETC["Astral Essence"] === 0)
      delete window.inventory.ETC["Astral Essence"];

    if (!item.originalStats) {
      item.originalStats = {
        atk: item.atk,
        maxHp: item.maxHp,
        def: item.def,
        moveSpeed: item.moveSpeed,
        critChance: item.critChance,
        critDamage: item.critDamage,
        block: item.block,
        parry: item.parry,
        activeAttackSpeed: item.activeAttackSpeed,
        idleAttackSpeed: item.idleAttackSpeed,
        str: item.str,
        dex: item.dex,
        int: item.int,
      };
    }

    let selectedStat =
      validStats[Math.floor(Math.random() * validStats.length)];

    item.enchantments = item.enchantments || {};
    item.enchantments[selectedStat] =
      (item.enchantments[selectedStat] || 0) + 1;
    item.totalEnchants = (item.totalEnchants || 0) + 1;
    window.playerStats.totalEnchants =
      (window.playerStats.totalEnchants || 0) + 1;
    if (typeof window.checkAchievements === "function")
      window.checkAchievements();

    const integerStats = ["atk", "maxHp", "def", "str", "dex", "int"];
    if (integerStats.includes(selectedStat)) {
      item[selectedStat] = Math.ceil(item[selectedStat] * 1.25);
    } else {
      item[selectedStat] = parseFloat((item[selectedStat] * 1.25).toFixed(4));
    }

    if (typeof window.pushLog === "function")
      window.pushLog(
        `<span style='color:#9b59b6;'>[ENCHANTER]</span> Successfully infused <strong style='color:#9b59b6;'>${this.getStatIcon(selectedStat)} ${selectedStat.toUpperCase()}</strong> by 25% on ${item.name}!`,
      );
    if (typeof window.pushHeaderToast === "function")
      window.pushHeaderToast(
        `🔮 Enchanted: +25% ${selectedStat.toUpperCase()}!`,
        "#9b59b6",
      );

    let cvs = document.getElementById("gameCanvas");
    let w = cvs ? cvs.width : 750;
    let h = cvs ? cvs.height : 250;
    for (let i = 0; i < 35; i++) {
      if (window.particles) {
        window.particles.push({
          x: w / 2,
          y: h / 2,
          vx: (Math.random() - 0.5) * 10,
          vy: (Math.random() - 0.5) * 10,
          radius: Math.random() * 3 + 1,
          color: "#9b59b6",
          alpha: 1,
          life: 40,
        });
      }
    }

    if (typeof window.resolvePlayerStats === "function") {
      let newMaxHp = window.resolvePlayerStats().maxHp;
      window.playerStats.currentHp = Math.min(
        window.playerStats.currentHp,
        newMaxHp,
      );
    }

    if (typeof window.updateUI === "function") window.updateUI();
    if (typeof window.renderInventory === "function") window.renderInventory();
    if (typeof window.renderForgeTab === "function") window.renderForgeTab();
    if (typeof window.saveGame === "function") window.saveGame();
  },
});

// Legacy Compatibility Aliases to protect references
window.enchantItem = () => window.ForgeManager.enchantItem();

// Append resetItemEnchants inside ForgeManager
Object.assign(window.ForgeManager, {
  resetItemEnchants() {
    if (!window.forgeSelectedItem) return;
    let item = window.forgeSelectedItem;
    if (!item.totalEnchants || item.totalEnchants === 0) {
      if (typeof window.pushHeaderToast === "function")
        window.pushHeaderToast("No enchants to reset!", "#e74c3c");
      return;
    }

    let resetGoldCost = 1000 * item.stageLevel * (item.statsRolled || 1);
    let coins = BigNum.from(window.playerStats.coins);
    if (coins.lt(resetGoldCost)) {
      if (typeof window.pushHeaderToast === "function")
        window.pushHeaderToast("Not enough Gold to reset!", "#e74c3c");
      return;
    }

    window.playerStats.coins = coins.sub(resetGoldCost);

    if (item.originalStats) {
      for (let key in item.originalStats) {
        item[key] = item.originalStats[key];
      }
      delete item.originalStats;
    }
    delete item.enchantments;
    item.totalEnchants = 0;

    if (typeof window.pushLog === "function")
      window.pushLog(
        `<span style='color:#e74c3c;'>[ENCHANTER]</span> Purged all enchantments from ${item.name}!`,
      );
    if (typeof window.pushHeaderToast === "function")
      window.pushHeaderToast(`🧹 Purged Enchantments!`, "#e74c3c");

    let cvs = document.getElementById("gameCanvas");
    let w = cvs ? cvs.width : 750;
    let h = cvs ? cvs.height : 250;
    for (let i = 0; i < 35; i++) {
      if (window.particles) {
        window.particles.push({
          x: w / 2,
          y: h / 2,
          vx: (Math.random() - 0.5) * 8,
          vy: (Math.random() - 0.5) * 8,
          radius: Math.random() * 2 + 1,
          color: "#7f8c8d",
          alpha: 1,
          life: 30,
        });
      }
    }

    if (typeof window.resolvePlayerStats === "function") {
      let newMaxHp = window.resolvePlayerStats().maxHp;
      window.playerStats.currentHp = Math.min(
        window.playerStats.currentHp,
        newMaxHp,
      );
    }

    if (typeof window.updateUI === "function") window.updateUI();
    if (typeof window.renderInventory === "function") window.renderInventory();
    if (typeof window.renderForgeTab === "function") window.renderForgeTab();
    if (typeof window.saveGame === "function") window.saveGame();
  },
});

// Legacy Compatibility Aliases to protect references
window.resetItemEnchants = () => window.ForgeManager.resetItemEnchants();

// Append getStatLabel inside ForgeManager
Object.assign(window.ForgeManager, {
  getStatLabel(propKey) {
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
      int: "Intelligence",

      // Medal/Title stats mapping
      drop: "Drop Rate",
      qly: "Drop Quality",
      gold: "Gold Multiplier",
      xpRate: "XP Rate",
      fairySpawn: "Fairy Spawn Rate",
      rareSpawn: "Rare Spawn Rate",
    };
    return labels[propKey] || propKey;
  },
});

// Legacy Compatibility Aliases to protect references
window.getStatLabel = (propKey) => window.ForgeManager.getStatLabel(propKey);

// Append lockForgeStat inside ForgeManager
Object.assign(window.ForgeManager, {
  lockForgeStat(propKey) {
    if (!window.forgeSelectedItem) return;
    window.forgeSelectedItem.reforgedProperty = propKey;
    if (typeof window.pushHeaderToast === "function")
      window.pushHeaderToast("Stat line locked for Reforging!", "#f1c40f");
    if (typeof window.renderForgeTab === "function") window.renderForgeTab();
  },
});

// Legacy Compatibility Aliases to protect references
window.lockForgeStat = (propKey) => window.ForgeManager.lockForgeStat(propKey);

// Append selectReforgeStat inside ForgeManager
Object.assign(window.ForgeManager, {
  selectReforgeStat(propKey) {
    if (!window.forgeSelectedItem) return;
    window.forgeSelectedItem.tempReforgeProp = propKey;
    if (typeof window.renderForgeTab === "function") window.renderForgeTab();
  },
});

// Legacy Compatibility Aliases to protect references
window.selectReforgeStat = (propKey) =>
  window.ForgeManager.selectReforgeStat(propKey);

// Append reforgeItemStat inside ForgeManager
Object.assign(window.ForgeManager, {
  reforgeItemStat() {
    if (!window.forgeSelectedItem) return;
    let item = window.forgeSelectedItem;
    if (window.playerStats.pendingClanProgress) {
      window.playerStats.pendingClanProgress.reforges =
        (window.playerStats.pendingClanProgress.reforges || 0) + 1;
    }

    if (!item.reforgedProperty) {
      if (!item.tempReforgeProp) {
        if (typeof window.pushHeaderToast === "function")
          window.pushHeaderToast(
            "Select a stat line to re-roll first!",
            "#e74c3c",
          );
        return;
      }
      item.reforgedProperty = item.tempReforgeProp;
    }

    let rProp = item.reforgedProperty;
    let itemLvlMultiplier = Math.pow(
      1.045,
      Math.max(0, (item.stageLevel - 1) * 5),
    );
    let costGold = Math.floor(
      150 * itemLvlMultiplier * Math.pow(2, item.statsRolled),
    );

    let ownedSigil = window.inventory.ETC["Overlord's Sigil"] || 0;
    let coins = BigNum.from(window.playerStats.coins);

    if (coins.lt(costGold)) {
      if (typeof window.pushHeaderToast === "function")
        window.pushHeaderToast("Not enough Gold!", "#e74c3c");
      return;
    }
    if (ownedSigil < 1) {
      if (typeof window.pushHeaderToast === "function")
        window.pushHeaderToast("Requires 1 Overlord's Sigil!", "#e74c3c");
      return;
    }

    window.playerStats.coins = BigNum.from(window.playerStats.coins).sub(
      costGold,
    );
    window.inventory.ETC["Overlord's Sigil"]--;
    if (window.inventory.ETC["Overlord's Sigil"] === 0)
      delete window.inventory.ETC["Overlord's Sigil"];

    item[rProp] = 0;

    let mapping = {
      bonusAtk: "atk",
      bonusMaxHp: "maxHp",
      bonusDef: "def",
      bonusMoveSpeed: "moveSpeed",
      bonusCritChance: "critChance",
      bonusCritDamage: "critDamage",
      bonusBlock: "block",
      bonusParry: "parry",
      bonusActiveSpeed: "activeAttackSpeed",
      bonusIdleSpeed: "idleAttackSpeed",
      bonusStr: "str",
      bonusDex: "dex",
      bonusInt: "int",
    };

    let possiblePool = Object.keys(mapping);
    if (item.type === "subweapon") {
      if (item.subType === "shield")
        possiblePool = [
          "bonusBlock",
          "bonusAtk",
          "bonusMaxHp",
          "bonusDef",
          "bonusStr",
        ];
      else if (item.subType === "dagger")
        possiblePool = [
          "bonusParry",
          "bonusAtk",
          "bonusCritChance",
          "bonusDex",
        ];
      else if (item.subType === "tome")
        possiblePool = [
          "bonusCritDamage",
          "bonusInt",
          "bonusActiveSpeed",
          "bonusIdleSpeed",
        ];
    }

    let activeBonuses = possiblePool.filter(
      (k) =>
        k !== rProp &&
        item[k] !== 0 &&
        item[k] !== undefined &&
        item[k] !== null,
    );
    let eligiblePool = possiblePool.filter((k) => !activeBonuses.includes(k));
    if (eligiblePool.length === 0) eligiblePool = possiblePool;

    let newProp = eligiblePool[Math.floor(Math.random() * eligiblePool.length)];
    let stageScale = item.stageLevel || 1;
    let effStageScale = window.getEffectiveStage(stageScale * 5) / 10;
    // Mapped on 5-stage scale to align with the standard campaign progression curve
    let expScale = Math.pow(1.58, effStageScale);
    let hpDefExpScale = Math.pow(1.56, effStageScale);
    let rarityMult = 1 + item.statsRolled * 0.15;
    let rolledValue = 0;

    if (newProp === "bonusAtk")
      rolledValue = Math.ceil(
        window.randFloat(0.15, 0.35) * expScale * rarityMult,
      );
    else if (newProp === "bonusMaxHp")
      rolledValue = Math.ceil(
        window.randFloat(0.4, 1.2) * hpDefExpScale * rarityMult,
      );
    else if (newProp === "bonusDef")
      rolledValue = Math.ceil(
        window.randFloat(0.15, 0.35) * hpDefExpScale * rarityMult,
      );
    else if (newProp === "bonusMoveSpeed")
      rolledValue = Math.ceil(window.randInt(1, 2) * stageScale * rarityMult);
    else if (newProp === "bonusCritChance")
      rolledValue = parseFloat(
        Math.min(
          0.2,
          window.randFloat(0.01, 0.025) * Math.sqrt(stageScale) * rarityMult,
        ).toFixed(4),
      );
    else if (newProp === "bonusCritDamage")
      rolledValue = parseFloat(
        (
          window.randFloat(0.03, 0.06) *
          Math.sqrt(stageScale) *
          rarityMult
        ).toFixed(4),
      );
    else if (newProp === "bonusBlock")
      rolledValue = parseFloat(
        Math.min(
          0.15,
          window.randFloat(0.005, 0.015) * Math.sqrt(stageScale) * rarityMult,
        ).toFixed(4),
      );
    else if (newProp === "bonusParry")
      rolledValue = parseFloat(
        Math.min(
          0.15,
          window.randFloat(0.005, 0.015) * Math.sqrt(stageScale) * rarityMult,
        ).toFixed(4),
      );
    else if (newProp === "bonusActiveSpeed") {
      let sScale = Math.pow(stageScale, 0.3);
      let rMult = 1 + item.statsRolled * 0.08;
      let pMult = Math.pow(1.02, window.playerStats.prestigeCount || 0);
      rolledValue = parseFloat(
        (window.randFloat(0.01, 0.03) * sScale * rMult * pMult).toFixed(4),
      );
    } else if (newProp === "bonusIdleSpeed") {
      let sScale = Math.pow(stageScale, 0.3);
      let rMult = 1 + item.statsRolled * 0.08;
      let pMult = Math.pow(1.02, window.playerStats.prestigeCount || 0);
      rolledValue = parseFloat(
        (window.randFloat(0.01, 0.03) * sScale * rMult * pMult).toFixed(4),
      );
    } else if (newProp === "bonusStr")
      rolledValue = Math.ceil(window.randInt(1, 3) * stageScale * rarityMult);
    else if (newProp === "bonusDex")
      rolledValue = Math.ceil(window.randInt(1, 3) * stageScale * rarityMult);
    else if (newProp === "bonusInt")
      rolledValue = Math.ceil(window.randInt(1, 3) * stageScale * rarityMult);

    item[newProp] = rolledValue;
    item.reforgedProperty = newProp;

    window.recalculateItemStats(item);
    item.name = window.buildProceduralName(item);
    window.playerStats.totalReforges =
      (window.playerStats.totalReforges || 0) + 1;
    if (typeof window.progressMission === "function")
      window.progressMission("reforges", 1);

    if (typeof window.pushLog === "function")
      window.pushLog(
        `<span style='color:#e67e22;'>[FORGE]</span> Reforged modifier into <strong style='color:#2ecc71;'>${this.getStatLabel(newProp)} (+${rolledValue})</strong> on ${item.name}!`,
      );
    if (typeof window.pushHeaderToast === "function")
      window.pushHeaderToast("🔨 Stat Reforged!", "#2ecc71");

    if (typeof window.spawnTemperParticles === "function")
      window.spawnTemperParticles(true);
    if (typeof window.updateUI === "function") window.updateUI();
    if (typeof window.renderInventory === "function") window.renderInventory();
    if (typeof window.renderForgeTab === "function") window.renderForgeTab();
    if (typeof window.saveGame === "function") window.saveGame();
  },
});

// Legacy Compatibility Aliases to protect references
window.reforgeItemStat = () => window.ForgeManager.reforgeItemStat();

// ==========================================================================
// --- MARKET & SHOP TRANSACTION LOGIC ---
// ==========================================================================

window.buyGachaCrate = function () {
  window.openGachaModal();
};

window.rollGachaCrateItem = function (
  isGlimmering = false,
  useStandardForGlimmering = false,
) {
  let p = window.resolvePlayerStats();
  let maxBag = window.getMaxBagSlots();

  let keyName = isGlimmering
    ? useStandardForGlimmering
      ? "Gacha Key"
      : "Glimmering Gachapon Key"
    : "Gacha Key";
  let keysNeeded = isGlimmering && useStandardForGlimmering ? 10 : 1;
  let keys = window.inventory.ETC[keyName] || 0;
  if (keys < keysNeeded) {
    return { error: `Insufficient ${keyName}s!` };
  }

  let allowArtifact = Math.random() < (isGlimmering ? 0.05 : 0.01);
  let types = [
    "weapon",
    "subweapon",
    "helmet",
    "chest",
    "leggings",
    "overall",
    "boots",
    "ring",
  ];
  let chosenType = allowArtifact
    ? "artifact"
    : types[Math.floor(Math.random() * types.length)];

  if (chosenType === "artifact") {
    if (window.inventory.ARTIFACT.length >= maxBag) {
      return { error: "Artifact Sack Full!" };
    }
  } else {
    if (window.inventory.EQUIP.length >= maxBag) {
      return { error: "Inventory Full!" };
    }
  }

  // Deduct key & save state
  window.inventory.ETC[keyName] -= keysNeeded;
  if (window.inventory.ETC[keyName] === 0) delete window.inventory.ETC[keyName];

  // --- PITY COUNTER ENGINE ---
  let isPityTriggered = false;
  if (isGlimmering) {
    window.playerStats.glimmeringPity =
      (window.playerStats.glimmeringPity || 0) + 1;
    if (window.playerStats.glimmeringPity >= 25) {
      isPityTriggered = true;
      window.playerStats.glimmeringPity = 0;
    }
  } else {
    window.playerStats.vendingPity = (window.playerStats.vendingPity || 0) + 1;
    if (window.playerStats.vendingPity >= 50) {
      isPityTriggered = true;
      window.playerStats.vendingPity = 0; // Reset pity
    }
  }

  let statLinesCount = 1;
  if (isPityTriggered) {
    statLinesCount = 5; // Guaranteed Mythic
  } else {
    let vendingLvl = window.playerStats.vendingQLevel || 0;
    let effectiveVendingLvl =
      vendingLvl * window.getMilestoneMultiplier(vendingLvl);
    let probs = window.calculateRarityProbabilities(
      p.qly + effectiveVendingLvl * 0.01,
      true,
      isGlimmering,
    );
    let roll = Math.random() * 100;
    let cumulative = 0;

    if (roll < (cumulative += probs[5])) {
      statLinesCount = 5;
      if (isGlimmering) {
        window.playerStats.glimmeringPity = 0;
      } else {
        window.playerStats.vendingPity = 0; // Natural pull resets pity
      }
    } else if (roll < (cumulative += probs[4])) {
      statLinesCount = 4;
    } else if (roll < (cumulative += probs[3])) {
      statLinesCount = 3;
    } else if (roll < (cumulative += probs[2])) {
      statLinesCount = 2;
    } else {
      statLinesCount = 1;
    }
  }

  let peakRunStage = window.playerStats.lifetimePeakStage || 1;
  let stageScale = Math.floor((peakRunStage - 1) / 5) + 1;
  let newItem = window.createItemObject(
    chosenType,
    statLinesCount,
    stageScale,
    0,
  );

  if (newItem.type === "artifact") {
    window.inventory.ARTIFACT.push(newItem);
  } else {
    window.inventory.EQUIP.push(newItem);
  }

  // Store inside active pull history log
  window.playerStats.gachaHistory = window.playerStats.gachaHistory || [];
  window.playerStats.gachaHistory.unshift(newItem);
  if (window.playerStats.gachaHistory.length > 5) {
    window.playerStats.gachaHistory.pop();
  }
  window.frozenItemDb[newItem.id] = window.cloneItemForTooltip(newItem);

  if (typeof window.logHighTierPull === "function") {
    window.logHighTierPull(newItem);
  }

  window.checkAchievements();
  window.saveGame();
  return { item: newItem };
};

// --- MERCHANT & TRANSACTION OPERATIONS ---

window.buyShopItem = function (index) {
  let item = window.playerStats.shopItems[index];
  if (!item || item.purchased) return;

  let coins = BigNum.from(window.playerStats.coins);
  let cost = BigNum.from(item.cost);
  if (coins.lt(cost)) {
    window.pushHeaderToast("❌ Insufficient Gold!", "#e74c3c");
    return;
  }

  let maxBag = window.getMaxBagSlots();
  if (window.inventory.EQUIP.length >= maxBag) {
    window.pushHeaderToast("❌ Inventory Full!", "#e74c3c");
    return;
  }

  window.playerStats.coins = coins.sub(cost);
  item.purchased = true;
  item.justPurchased = true;

  if (window.playerStats.coins.eq(0)) {
    window.playerStats.hasTriggeredExactChange = true;
  }

  window.inventory.EQUIP.push(item);
  window.frozenItemDb[item.id] = window.cloneItemForTooltip(item);

  window.pushHeaderToast(`🛒 Purchased ${item.name}!`, "#2ecc71");
  if (
    window.SoundManager &&
    typeof window.SoundManager.playLootDrop === "function"
  ) {
    window.SoundManager.playLootDrop(item.statsRolled);
  } else if (window.SoundManager) {
    window.SoundManager.play("fairy");
  }

  if (window.spawnPurchaseCelebration) {
    window.spawnPurchaseCelebration(
      "alchemy",
      window.getTierColor(item.statsRolled),
      item.statsRolled,
    );
  }

  window.updateUI();
  if (typeof window.renderMarketShop === "function") window.renderMarketShop();
  window.renderInventory();
  window.saveGame();
};

window.buyMysticalItem = function (index) {
  let item = window.MYSTICAL_STOCK[index];
  let cost = item.cost;
  let currency = item.currency;

  if (currency === "Gold") {
    // Modified scaling from exponential to a balanced linear level scaling (item.cost * player level)
    cost = BigNum.from(item.cost).mul(window.playerStats.level || 1);
    let coins = BigNum.from(window.playerStats.coins);
    if (coins.lt(cost)) {
      window.pushHeaderToast("❌ Insufficient Gold!", "#e74c3c");
      return;
    }
    window.playerStats.coins = coins.sub(cost);
    if (window.playerStats.coins.eq(0)) {
      window.playerStats.hasTriggeredExactChange = true;
    }
  } else if (currency === "Luminous Soul") {
    let owned = window.inventory.ETC["Luminous Soul"] || 0;
    if (owned < cost) {
      window.pushHeaderToast("❌ Insufficient Luminous Souls!", "#e74c3c");
      return;
    }
    window.inventory.ETC["Luminous Soul"] -= cost;
    if (window.inventory.ETC["Luminous Soul"] === 0) {
      delete window.inventory.ETC["Luminous Soul"];
    }
  } else if (currency === "Astral Shards") {
    let owned = window.playerStats.astralShards || 0;
    if (owned < cost) {
      window.pushHeaderToast("❌ Insufficient Astral Shards!", "#e74c3c");
      return;
    }
    window.playerStats.astralShards -= cost;
  }

  // Grant item
  if (
    item.name === "Gacha Key" ||
    item.name === "Astral Essence" ||
    item.name === "Catalyst Core"
  ) {
    window.addEtcDrop(item.name, 1);
  } else {
    window.addUseDrop(item.name, 1);
  }

  window.pushHeaderToast(`🛒 Purchased ${item.name}!`, "#2ecc71");
  window.SoundManager.play("fairy");

  if (window.spawnPurchaseCelebration) {
    window.spawnPurchaseCelebration("alchemy", item.color || "#9b59b6", 3);
  }

  window.updateUI();
  if (typeof window.renderMysticalShop === "function")
    window.renderMysticalShop();
  window.renderInventory();
  window.saveGame();
};

window.buyGoldUpgrade = function (type) {
  let p = window.playerStats;
  let cost = 0;
  let levelField = "";

  if (type === "vending") {
    levelField = "vendingQLevel";
    // Elevated cost scaling exponent (1.5 -> 1.75) to prevent trivialization during deep stage progression
    cost = BigNum.from(15000).mul(BigNum.from(1.75).pow(p.vendingQLevel || 0));
  } else if (type === "shop") {
    levelField = "shopQLevel";
    // Elevated cost scaling exponent (1.65 -> 1.95) to prevent trivialization during deep stage progression
    cost = BigNum.from(30000).mul(BigNum.from(1.95).pow(p.shopQLevel || 0));
  } else if (type === "global") {
    levelField = "globalQLevel";
    // Elevated cost scaling exponent (1.85 -> 2.25) to prevent trivialization during deep stage progression
    cost = BigNum.from(100000).mul(BigNum.from(2.25).pow(p.globalQLevel || 0));
  }

  let coins = BigNum.from(p.coins);
  let costBig = BigNum.from(cost);
  if (coins.lt(costBig)) {
    window.pushHeaderToast("❌ Insufficient Gold!", "#e74c3c");
    return;
  }

  p.coins = coins.sub(costBig);
  p[levelField] = (p[levelField] || 0) + 1;

  if (p.coins.eq(0)) {
    p.hasTriggeredExactChange = true;
  }

  window.pushHeaderToast("🎉 Upgrade Acquired!", "#2ecc71");
  window.SoundManager.play("spell");

  if (window.spawnPurchaseCelebration) {
    window.spawnPurchaseCelebration("upgrade", "#f1c40f", 4);
  }

  window.updateUI();
  window.renderGoldUpgrades();

  // Find newly rendered card and trigger physical purchase slam flash!
  let cardEl = document.getElementById(`sink-card-${type}`);
  if (cardEl) {
    cardEl.classList.add("sink-upgraded-flash");
    setTimeout(() => {
      let checkEl = document.getElementById(`sink-card-${type}`);
      if (checkEl) checkEl.classList.remove("sink-upgraded-flash");
    }, 600);
  }

  if (typeof window.checkAchievements === "function") {
    window.checkAchievements();
  }
  window.saveGame();
};

window.transmutePotion = function (index) {
  let recipe = window.POTION_TRANSMUTATIONS[index];
  if (!recipe) return;

  let ownedCount = window.inventory.USE[recipe.req] || 0;
  if (ownedCount < recipe.amount) {
    window.pushHeaderToast("❌ Insufficient ingredients!", "#e74c3c");
    return;
  }

  window.inventory.USE[recipe.req] -= recipe.amount;
  if (window.inventory.USE[recipe.req] === 0) {
    delete window.inventory.USE[recipe.req];
  }

  window.addUseDrop(recipe.result, 1);

  window.pushHeaderToast(`🧪 Brewed ${recipe.result}!`, "#2ecc71");
  window.SoundManager.play("spell");

  if (window.spawnPurchaseCelebration) {
    window.spawnPurchaseCelebration("alchemy", recipe.color || "#2ecc71", 3);
  }

  window.updateUI();
  window.renderInventory();
  window.renderMysticalShop();
  window.saveGame();
};

// Append rerollItemSet inside ForgeManager
Object.assign(window.ForgeManager, {
  rerollItemSet() {
    if (!window.forgeSelectedItem) return;
    let item = window.forgeSelectedItem;
    if (item.type === "artifact" || item.statsRolled === "UNIQUE") return;

    let costGold = window.getSetRerollGoldCost(item);
    let soulCost = 25 + item.statsRolled * 25;
    let ownedSouls = window.inventory.ETC["Monster Soul"] || 0;
    let coins = BigNum.from(window.playerStats.coins);

    if (coins.lt(costGold)) {
      if (typeof window.pushHeaderToast === "function")
        window.pushHeaderToast("❌ Not enough Gold!", "#e74c3c");
      return;
    }
    if (ownedSouls < soulCost) {
      if (typeof window.pushHeaderToast === "function")
        window.pushHeaderToast("❌ Not enough Monster Souls!", "#e74c3c");
      return;
    }

    window.playerStats.coins = BigNum.from(window.playerStats.coins).sub(
      costGold,
    );
    window.inventory.ETC["Monster Soul"] -= soulCost;
    if (window.inventory.ETC["Monster Soul"] === 0) {
      delete window.inventory.ETC["Monster Soul"];
    }

    let setKeys = [
      "Vanguard",
      "Colossus",
      "Bastion",
      "Windrunner",
      "Wraith",
      "Reaver",
      "Dreadnought",
      "Duellist",
      "Scholar",
      "Berserker",
      "Scout",
      "Fortune",
      "Mystic",
      "Alchemist",
      "Midas",
      "Biohazard",
      "Warlord",
      "VoidTouched",
    ];

    // Roll a set that is different from the current one
    let filtered = setKeys.filter((k) => k !== item.setName);
    if (filtered.length === 0) filtered = setKeys;
    let newSet = filtered[Math.floor(Math.random() * filtered.length)];

    item.setName = newSet;
    item.name = window.buildProceduralName(item);

    if (typeof window.pushLog === "function")
      window.pushLog(
        `<span style='color:#2ecc71;'>[FORGE]</span> Successfully re-rolled set resonance of ${item.noun} to <strong style='color:#2ecc71;'>${newSet} Set</strong>!`,
      );
    if (typeof window.pushHeaderToast === "function")
      window.pushHeaderToast(`✨ Set Resonated: ${newSet}!`, "#2ecc71");

    if (typeof window.spawnTemperParticles === "function")
      window.spawnTemperParticles(true);
    if (window.SoundManager) window.SoundManager.play("spell");

    window.updateUI();
    window.renderInventory();
    window.renderForgeTab();
    window.saveGame();
  },
});

// Legacy Compatibility Aliases to protect references
window.rerollItemSet = () => window.ForgeManager.rerollItemSet();

window.buyAstralShopItem = function (index) {
  let item = window.ASTRAL_SHOP_STOCK[index];
  if (!item) return;

  let ownedShards = window.playerStats.astralShards || 0;
  if (ownedShards < item.cost) {
    window.pushHeaderToast("❌ Insufficient Astral Shards!", "#e74c3c");
    return;
  }

  if (item.isTitle) {
    let unlocked = window.playerStats.unlockedTitles || [];
    if (unlocked.includes("astral_conqueror")) {
      window.pushHeaderToast("❌ Already unlocked this title!", "#e74c3c");
      return;
    }
    window.playerStats.astralShards -= item.cost;
    window.playerStats.unlockedTitles = window.playerStats.unlockedTitles || [];
    window.playerStats.unlockedTitles.push("astral_conqueror");
    window.playerStats.equippedTitle = "astral_conqueror"; // Auto-equip title
  } else {
    window.playerStats.astralShards -= item.cost;
    const useItems = [
      "Double Drop Elixir",
      "Drop Quality Elixir",
      "Monster Card Sack",
    ];
    if (useItems.includes(item.name)) {
      window.addUseDrop(item.name, 1);
    } else {
      window.addEtcDrop(item.name, 1);
    }
  }

  window.pushHeaderToast(`🛒 Purchased ${item.name}!`, "#2ecc71");
  if (window.SoundManager) window.SoundManager.play("fairy");

  if (window.spawnPurchaseCelebration) {
    window.spawnPurchaseCelebration("alchemy", item.color, 3);
  }

  window.updateUI();
  window.renderInventory();
  window.renderAstralShop();
  window.saveGame();
};

// --- PROC-GEN CAVERN SIGIL APPLICATION SLOTTER ---
window.executeSlotCavernSigil = function (id) {
  let sigil = window.inventory.SIGIL.find((item) => item.id === id);
  if (!sigil) return;

  window.state.slottedCavernSigil = sigil;
  let win = document.getElementById("sigil-swap-window");
  if (win) win.remove();

  if (typeof window.hideTooltip === "function") window.hideTooltip();
  if (typeof window.updateUI === "function") window.updateUI();
};

// --- ENDGAME PARAGON INFUSION MATRIX SYSTEM ---
window.executeParagonUpgrade = function () {
  let p = window.playerStats;
  let parLevel = p.paragonLevel || 0;

  // Exponential scaling requirements matching endgame curves
  let costGold = BigNum.from(1000000).mul(BigNum.from(1.5).pow(parLevel));
  let costMythic = Math.floor(50 * Math.pow(1.3, parLevel));
  let costLegendary = Math.floor(150 * Math.pow(1.3, parLevel));
  let costEpic = Math.floor(350 * Math.pow(1.3, parLevel));
  let costCores = Math.floor(10 * Math.pow(1.15, parLevel));

  let goldOwned = BigNum.from(p.coins || 0);
  let mythicScrapsOwned = window.inventory.ETC["Mythic Scrap"] || 0;
  let legendaryScrapsOwned = window.inventory.ETC["Legendary Scrap"] || 0;
  let epicScrapsOwned = window.inventory.ETC["Epic Scrap"] || 0;
  let coresOwned = window.inventory.ETC["Catalyst Core"] || 0;

  if (
    goldOwned.lt(costGold) ||
    mythicScrapsOwned < costMythic ||
    legendaryScrapsOwned < costLegendary ||
    epicScrapsOwned < costEpic ||
    coresOwned < costCores
  ) {
    window.pushHeaderToast(
      "❌ Insufficient resources for Paragon Infusion!",
      "#e74c3c",
    );
    return;
  }

  window.showCustomConfirm(
    "🧬 Paragon Infusion Matrix",
    `Are you sure you want to sacrifice these resources to fuse Paragon Level ${parLevel + 1}?`,
    "Infuse Matrix",
    "Cancel",
    "#ff007f",
    function () {
      p.coins = goldOwned.sub(costGold);

      window.inventory.ETC["Mythic Scrap"] -= costMythic;
      if (window.inventory.ETC["Mythic Scrap"] === 0)
        delete window.inventory.ETC["Mythic Scrap"];

      window.inventory.ETC["Legendary Scrap"] -= costLegendary;
      if (window.inventory.ETC["Legendary Scrap"] === 0)
        delete window.inventory.ETC["Legendary Scrap"];

      window.inventory.ETC["Epic Scrap"] -= costEpic;
      if (window.inventory.ETC["Epic Scrap"] === 0)
        delete window.inventory.ETC["Epic Scrap"];

      window.inventory.ETC["Catalyst Core"] -= costCores;
      if (window.inventory.ETC["Catalyst Core"] === 0)
        delete window.inventory.ETC["Catalyst Core"];

      p.paragonLevel = parLevel + 1;

      window.pushHeaderToast(
        `🧬 Paragon Infused to Level ${p.paragonLevel}!`,
        "#ff007f",
      );
      if (window.SoundManager) window.SoundManager.play("revive");
      if (window.spawnPurchaseCelebration) {
        window.spawnPurchaseCelebration("paragon", "#ff007f", 5);
      }
      window.invalidatePlayerStats();
      window.updateUI();
      window.renderPrestigeTab();
      window.renderInventory();
      window.saveGame();
    },
  );
};
