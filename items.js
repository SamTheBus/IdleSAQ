/* ==========================================================================
   PRIMARY PURPOSE: Procedural Item Generation, Unique Styling,
   Sack Management, Forge/Crafting, and Shop Transaction Logic.
   ========================================================================= */

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
  let gold = 0;
  if (targetLevel <= 10) {
    gold = Math.floor(2500 * Math.pow(1.35, targetLevel));
  } else if (targetLevel <= 30) {
    let costAt10 = Math.floor(2500 * Math.pow(1.35, 10)); // ~50,253
    gold = Math.floor(costAt10 * Math.pow(3.55, targetLevel - 10));
  } else {
    let costAt30 = 100000 * Math.pow(2.25, 30);
    gold = Math.floor(costAt30 * Math.pow(3.0, targetLevel - 30));
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
  let itemLvlMultiplier = Math.pow(
    1.045,
    Math.max(0, (item.stageLevel - 1) * 5),
  );
  return Math.floor(100 * itemLvlMultiplier * Math.pow(1.5, item.statsRolled));
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
      label: "Base Armor",
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
    if (eqItem) {
      let curMult = 1.0 + lvl * 0.01;
      let nextMult = 1.0 + (lvl + 1) * 0.01;

      if (eqItem.type === "artifact") {
        liveComparisonHtml = `
              <div style="margin-top:12px; padding:10px; background:#111; border:1px solid #9b59b6; border-radius:6px; font-family:monospace; font-size:10.5px; text-align:left;">
                <div style="color:#9b59b6; font-weight:bold; margin-bottom:4px; text-transform:uppercase;">📊 Artifact Attunement:</div>
                <div style="color:#fff;">${eqItem.name}</div>
                <div style="font-size:10px; color:#aaa; margin-top:4px; line-height:1.4; white-space:normal;">
                  Attuning this slot multiplies all base and bonus attributes (including Drop Rate, Gold Multipliers, Crit stats, and flat Attributes) on this artifact by <strong style="color:#2ecc71; font-size:11px;">+1%</strong> per Level!
                </div>
              </div>
            `;
      } else {
        let primaryStatKey =
          eqItem.type === "weapon"
            ? "atk"
            : eqItem.type === "subweapon"
              ? eqItem.subType === "shield"
                ? "def"
                : eqItem.subType === "dagger"
                  ? "atk"
                  : "int"
              : "def";
        let labelStat = primaryStatKey.toUpperCase();
        let baseItemVal = eqItem[primaryStatKey] || 10;

        let curEffective = Math.ceil(baseItemVal * curMult);
        let nextEffective = Math.ceil(baseItemVal * nextMult);
        let diff = nextEffective - curEffective;

        liveComparisonHtml = `
              <div style="margin-top:12px; padding:10px; background:#111; border:1px solid #3498db; border-radius:6px; font-family:monospace; font-size:10.5px; text-align:left;">
                <div style="color:#3498db; font-weight:bold; margin-bottom:4px; text-transform:uppercase;">📊 Equipped Item Live Preview:</div>
                <div style="color:#fff;">${eqItem.name}</div>
                <div style="display:flex; justify-content:space-between; margin-top:4px;">
                  <span>Effective ${labelStat}:</span>
                  <span><span style="color:#aaa;">${curEffective}</span> ➔ <strong style="color:#fff;">${nextEffective}</strong> <span style="color:#2ecc71;">(+${diff})</span></span>
                </div>
              </div>
            `;
      }
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

      <button class="forge-anvil-button" style="width:100%; margin-top:15px; border-color:#9b59b6; background:linear-gradient(135deg, #4a154b, #0c0812);" ${canAfford ? "" : "disabled"} onclick="window.temperItem()" onpointerdown="window.temperItem()">Harness Heat</button>
    `;
    return;
  }

  // Draw standard item explorers for the remaining modes
  let allValidItems = [
    ...window.inventory.EQUIP.filter((item) => item.type !== "sigil"),
    ...(window.inventory.ARTIFACT || []),
  ];
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

        return `<div class="bag-item-forge" ${inlineStyle} onclick="window.selectForgeItem(${item.id})" onmouseenter="window.showForgeTooltip(event, ${item.id})" onmouseleave="window.hideTooltip()" ontouchstart="window.showForgeTooltip(event, ${item.id})">
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

  if (
    !window.forgeSelectedItem ||
    ((window.forgeMode === "reforge" ||
      window.forgeMode === "tier" ||
      window.forgeMode === "enchant" ||
      window.forgeMode === "reset_enchant" ||
      window.forgeMode === "set") &&
      window.forgeSelectedItem.type === "artifact")
  ) {
    detailEl.innerHTML = `<div style='color:#aaa; text-align:center; padding-top:10px;'>
                  <div style='color:#e67e22; font-weight:bold; font-size:14px; margin-bottom:10px;'>🔨 Mystical Anvil</div>
                  <div style='font-size:11px; line-height:1.8; background:#111; padding:10px; border-radius:4px; border:1px solid #333; text-align:left;'>
                      Select an eligible item from your list.<br><br>
                      <b>TEMPER:</b> Refines stats with tier-appropriate material scraps. Failure consumes raw items.<br><br>
                      <b>REFORGE STAT:</b> Spend <strong style="color:#1abc9c;">Overlord's Sigils</strong> to lock and roll a modifier line of your choice. All other slots lock permanently once selection is active!<br><br>
                                            <b>TIER UP:</b> Infuses Eridium Shards to permanently elevate stars and unlock 1 additional random stat modifier!<br><br>
                                            <b>ENCHANT:</b> Infuse powerful magic using salvaged <b>Astral Essences</b>. Boosts 1 random stat line by 25%. Slots scale with rarity.<br><br>
                      <b>RE-ROLL SET:</b> Infuse <strong style="color:#bdc3c7;">Monster Souls</strong> and gold to alter set resonances. Handy for completing Vanguard/Colossus layout chains!
                  </div>
              </div>`;
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

  if (window.forgeMode === "temper") {
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

      let goldColor =
        window.playerStats.coins >= costGold ? "#f1c40f" : "#e74c3c";
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
          html += `<button class="forge-anvil-button" style="width:100%; border-color:#2ecc71; background: linear-gradient(135deg, #1b2a1e, #111);" ${window.playerStats.coins >= costGold && ownedSigils >= 1 ? "" : "disabled"} onclick="window.reforgeItemStat()" onpointerdown="window.reforgeItemStat()">Execute Reforge</button>`;
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
        html += `<button class="forge-anvil-button" style="width:100%; border-color:#9b59b6; background: linear-gradient(135deg, #4a154b, #111);" ${window.playerStats.coins >= costGold && ownedSigils >= 1 ? "" : "disabled"} onclick="window.reforgeItemStat()" onpointerdown="window.reforgeItemStat()">Re-Roll Locked Modifier</button>`;
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

      let goldColor =
        window.playerStats.coins >= costGold ? "#f1c40f" : "#e74c3c";
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
      html += `<button class="forge-anvil-button" style="width:100%; border-color:#e67e22;" ${window.playerStats.coins >= costGold && playerShards >= shardReq && playerScraps >= scrapReqAmount ? "" : "disabled"} onclick="window.temperItem()" onpointerdown="window.temperItem()">Awaken Rarity</button>`;

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
      html += `<button class="forge-anvil-button" style="width:100%; border-color:#9b59b6; background: linear-gradient(135deg, #4a154b, #1a0221);" ${playerSigil >= 1 ? "" : "disabled"} onclick="window.enchantItem()" onpointerdown="window.enchantItem()">Infuse Enchantment</button>`;
    }
  } else if (window.forgeMode === "reset_enchant") {
    let currentEnchants = item.totalEnchants || 0;
    if (currentEnchants === 0) {
      html += `<div style="color:#7f8c8d; font-weight:bold; text-align:center; padding: 20px 0; font-size:11px;">THIS ITEM HAS NO ACTIVE ENCHANTMENTS</div>`;
    } else {
      let resetGoldCost = 1000 * item.stageLevel * (item.statsRolled || 1);
      let goldColor =
        window.playerStats.coins >= resetGoldCost ? "#f1c40f" : "#e74c3c";

      html += `<div style="font-size:11px; margin-bottom:10px; color:#aaa;">Active Enchantments to Purge: <span style="color:#9b59b6; font-weight:bold;">${currentEnchants}</span></div>`;
      html += `<div style="font-size:11px; color:${goldColor}; margin-bottom:15px;">• ${resetGoldCost.toLocaleString()} Gold Required (Owned: ${Math.floor(window.playerStats.coins).toLocaleString()})</div>`;
      html += `<div style="font-size:11px; color:#e74c3c; font-weight:bold; margin-bottom:15px;">⚠️ Restores all enchanted parameters to their original pre-enchanted values. Material scraps are non-refundable.</div>`;
      html += `<button class="forge-anvil-button" style="width:100%; border-color:#e74c3c; background: linear-gradient(135deg, #c0392b, #111);" ${window.playerStats.coins >= resetGoldCost ? "" : "disabled"} onclick="window.resetItemEnchants()" onpointerdown="window.resetItemEnchants()">Purge Enchantments</button>`;
    }
  } else if (window.forgeMode === "set") {
    let costGold = window.getSetRerollGoldCost(item);
    let soulCost = 25 + item.statsRolled * 25;
    let ownedSouls = window.inventory.ETC["Monster Soul"] || 0;

    let goldColor =
      window.playerStats.coins >= costGold ? "#f1c40f" : "#e74c3c";
    let soulsColor = ownedSouls >= soulCost ? "#bdc3c7" : "#e74c3c";

    html += `<div style="font-size:11px; margin-bottom:10px; color:#aaa;">Current Set Resonance: <span style="color:#2ecc71; font-weight:bold;">${item.setName || "None"}</span></div>`;
    html += `<div style="font-size:11px; color:${goldColor}; margin-bottom:3px;">• ${window.formatNumber(costGold)} Gold Required</div>`;
    html += `<div style="font-size:11px; color:${soulsColor}; margin-bottom:10px;">• ${soulCost}x Monster Soul (Owned: ${ownedSouls.toLocaleString()})</div>`;
    html += `<div style="font-size:11px; color:#2ecc71; font-weight:bold; margin-bottom:15px;">✨ Randomly rolls a different Set bonus!</div>`;
    html += `<button class="forge-anvil-button" style="width:100%; border-color:#2ecc71; background: linear-gradient(135deg, #1b2a1e, #111);" ${window.playerStats.coins >= costGold && ownedSouls >= soulCost ? "" : "disabled"} onclick="window.rerollItemSet()" onpointerdown="window.rerollItemSet()">Re-Resonate Set</button>`;

    previewHtml = `
                    <div style="margin-top:15px; padding:12px; background:#111; border:1px dashed #2ecc71; border-radius:6px;">
                        <div style="color:#2ecc71; font-weight:bold; font-size:11px; margin-bottom:6px; text-transform:uppercase;">✨ Set re-resonance Pool:</div>
                        <p style="font-size:10px; color:#aaa; margin-bottom:8px; line-height:1.4;">
                            Your item will abandon its current set affiliation and attune to one of these legendary set matrices at random:
                        </p>
                        <div style="font-size:9.5px; color:#fff; display:grid; grid-template-columns: 1fr 1fr; gap:4px; font-family:monospace; background:rgba(0,0,0,0.3); padding:8px; border-radius:4px;">
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
      bg = "linear-gradient(135deg, #150326, #030008)";
      border = "#8e44ad";
      shadow = "#510a74";
      glow = "rgba(142,68,173,0.4)";
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

    let prestigeMult = 1.0;

    // Direct-Alignment Scaling Model: Maps item creation baselines exactly to enemy exponential scale curves
    let repStage = window.getEffectiveStage(stageScale * 10);
    let repGrowth = 1.045 + (repStage * 0.04) / (repStage + 200);
    let repScale = Math.pow(repGrowth, repStage);

    let expScale = repScale;
    let hpDefExpScale = repScale;

    // Apply baseline attribute values matching slot configurations (Slot-Specific Base Stats)
    if (chosenType !== "artifact") {
      let baseRarityMult = 1.0 + statLinesCount * 0.3; // Apply same base rarity multiplier immediately on drop
      if (chosenType === "weapon") {
        item.baseAtk = Math.ceil(
          1.5 * expScale * prestigeMult * baseRarityMult,
        );
      } else if (chosenType === "chest" || chosenType === "overall") {
        let overallMult = chosenType === "overall" ? 1.8 : 1.0;
        item.baseDef = Math.ceil(
          1.5 * hpDefExpScale * prestigeMult * baseRarityMult * overallMult,
        );
        item.baseMaxHp = Math.ceil(
          6.0 * hpDefExpScale * prestigeMult * baseRarityMult * overallMult,
        );
      } else if (chosenType === "helmet" || chosenType === "leggings") {
        item.baseDef = Math.ceil(
          0.7 * hpDefExpScale * prestigeMult * baseRarityMult,
        );
        item.baseMaxHp = Math.ceil(
          3.0 * hpDefExpScale * prestigeMult * baseRarityMult,
        );
      } else if (chosenType === "boots") {
        item.baseDef = Math.ceil(
          0.35 * hpDefExpScale * prestigeMult * baseRarityMult,
        );
        item.baseMoveSpeed = Math.ceil(1.0 * stageScale * prestigeMult);
      } else if (chosenType === "subweapon") {
        if (item.subType === "shield") {
          item.baseDef = Math.ceil(
            1.0 * hpDefExpScale * prestigeMult * baseRarityMult,
          );
        } else if (item.subType === "dagger") {
          item.baseAtk = Math.ceil(
            0.8 * expScale * prestigeMult * baseRarityMult,
          );
        } else if (item.subType === "tome") {
          item.baseInt = Math.ceil(
            1.5 * expScale * prestigeMult * baseRarityMult,
          );
          item.baseAtk = Math.ceil(
            0.4 * expScale * prestigeMult * baseRarityMult,
          );
        }
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
      pool = [
        "atk",
        "critChance",
        "critDamage",
        "str",
        "dex",
        "activeSpd",
        "idleSpd",
      ];
    } else if (chosenType === "chest" || chosenType === "overall") {
      pool = ["def", "maxHp", "str", "int", "block", "parry"];
    } else if (chosenType === "helmet") {
      pool = [
        "def",
        "maxHp",
        "int",
        "dex",
        "critChance",
        "activeSpd",
        "idleSpd",
      ];
    } else if (chosenType === "leggings") {
      pool = ["def", "maxHp", "str", "dex", "block", "parry"];
    } else if (chosenType === "boots") {
      pool = ["moveSpeed", "def", "maxHp", "dex", "idleSpd", "activeSpd"];
    } else if (chosenType === "subweapon") {
      if (item.subType === "shield")
        pool = ["block", "atk", "maxHp", "def", "str", "moveSpeed", "dex"];
      else if (item.subType === "dagger")
        pool = ["parry", "atk", "critChance", "dex", "moveSpeed", "str"];
      else if (item.subType === "tome")
        pool = [
          "critDamage",
          "int",
          "activeSpd",
          "idleSpd",
          "maxHp",
          "critChance",
        ];
    }

    pool.sort(() => Math.random() - 0.5);
    let rarityMult =
      chosenType === "artifact" ? 1.45 : 1 + statLinesCount * 0.15;
    if (chosenType === "overall") rarityMult *= 1.8;
    let actualStatLines = chosenType === "artifact" ? 3 : statLinesCount + 1;

    for (let i = 0; i < actualStatLines; i++) {
      if (pool.length === 0) break;
      let selectedStat = pool.pop();
      if (selectedStat === "atk")
        item.bonusAtk += Math.ceil(
          window.randFloat(0.15, 0.35) * expScale * rarityMult * prestigeMult,
        );
      else if (selectedStat === "maxHp")
        item.bonusMaxHp += Math.ceil(
          window.randFloat(0.4, 1.2) *
            hpDefExpScale *
            rarityMult *
            prestigeMult,
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
      } else if (selectedStat === "str")
        item.bonusStr += Math.ceil(
          window.randInt(1, 3) *
            Math.pow(stageScale, 1.8) *
            rarityMult *
            prestigeMult,
        );
      else if (selectedStat === "dex")
        item.bonusDex += Math.ceil(
          window.randInt(1, 3) *
            Math.pow(stageScale, 1.8) *
            rarityMult *
            prestigeMult,
        );
      else if (selectedStat === "int")
        item.bonusInt += Math.ceil(
          window.randInt(1, 3) *
            Math.pow(stageScale, 1.8) *
            rarityMult *
            prestigeMult,
        );
      else if (selectedStat === "dropRate") {
        let utilityScale = 1.0 + Math.sqrt(Math.max(1, stageScale) - 1) * 0.12;
        item.dropRate += parseFloat(
          (
            window.randFloat(0.02, 0.05) *
            rarityMult *
            prestigeMult *
            utilityScale
          ).toFixed(4),
        );
      } else if (selectedStat === "quality") {
        let utilityScale = 1.0 + Math.sqrt(Math.max(1, stageScale) - 1) * 0.12;
        item.quality += parseFloat(
          (
            window.randFloat(0.01, 0.03) *
            rarityMult *
            prestigeMult *
            utilityScale
          ).toFixed(4),
        );
      } else if (selectedStat === "goldMulti") {
        let utilityScale = 1.0 + Math.sqrt(Math.max(1, stageScale) - 1) * 0.12;
        item.goldMulti += parseFloat(
          (
            window.randFloat(0.02, 0.05) *
            rarityMult *
            prestigeMult *
            utilityScale
          ).toFixed(4),
        );
      } else if (selectedStat === "rareSpawn") {
        let utilityScale = 1.0 + Math.sqrt(Math.max(1, stageScale) - 1) * 0.12;
        item.rareSpawn += parseFloat(
          (
            window.randFloat(0.002, 0.006) *
            rarityMult *
            prestigeMult *
            utilityScale
          ).toFixed(4),
        );
      } else if (selectedStat === "fairySpawn") {
        let utilityScale = 1.0 + Math.sqrt(Math.max(1, stageScale) - 1) * 0.12;
        item.fairySpawn += parseFloat(
          (
            window.randFloat(0.02, 0.06) *
            rarityMult *
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
    item.critDamage = item.bonusCritDamage;
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
    return item;
  },

  buildProceduralName(item) {
    if (item.statsRolled === "UNIQUE") return item.name;
    let stars = item.statsRolled;

    // Prioritize the Set Name as the theme prefix if it exists!
    let themeName = item.setName || "Standard";

    if (!item.setName && stars > 0) {
      const nomenclature = {
        bonusAtk: "Vanguard",
        bonusMaxHp: "Colossus",
        bonusDef: "Bastion",
        bonusMoveSpeed: "Windrunner",
        bonusCritChance: "Wraith",
        bonusCritDamage: "Reaver",
        bonusBlock: "Dreadnought",
        bonusParry: "Duellist",
        bonusStr: "Berserker",
        bonusDex: "Scout",
        bonusInt: "Scholar",
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
// --- STAT RANGES & PREVIEWS ---

// Encapsulate getStatBaseRange directly inside window.ItemFactory
Object.assign(window.ItemFactory, {
  getStatBaseRange(item, statKey) {
    let stageLevel = item.stageLevel || 1;
    let isArt = item.type === "artifact";
    let rarityMult = isArt ? 1.45 : 1 + (item.statsRolled || 0) * 0.15;

    // Direct-Alignment Scaling Model: Maps base card ranges exactly to enemy exponential scale curves
    let repStage = stageLevel * 10;
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
      min += Math.ceil(1 * Math.pow(stageLevel, 1.8) * rarityMult);
      max += Math.ceil(3 * Math.pow(stageLevel, 1.8) * rarityMult);
    } else if (statKey === "dex" && (item.bonusDex > 0 || isArt)) {
      min += Math.ceil(1 * Math.pow(stageLevel, 1.8) * rarityMult);
      max += Math.ceil(3 * Math.pow(stageLevel, 1.8) * rarityMult);
    } else if (statKey === "int" && (item.bonusInt > 0 || isArt)) {
      min += Math.ceil(1 * Math.pow(stageLevel, 1.8) * rarityMult);
      max += Math.ceil(3 * Math.pow(stageLevel, 1.8) * rarityMult);
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
    let oldMult = 1 + oldStars * 0.15;
    let newMult = 1 + newStars * 0.15;
    let ratio = newMult / oldMult;

    const scaleKeys = [
      "bonusAtk",
      "bonusMaxHp",
      "bonusDef",
      "bonusMoveSpeed",
      "bonusCritChance",
      "bonusCritDamage",
      "bonusBlock",
      "bonusParry",
      "bonusStr",
      "bonusDex",
      "bonusInt",
      "bonusActiveSpeed",
      "bonusIdleSpeed",
    ];

    scaleKeys.forEach((k) => {
      if (item[k]) {
        if (
          [
            "bonusCritChance",
            "bonusCritDamage",
            "bonusBlock",
            "bonusParry",
          ].includes(k)
        ) {
          item[k] = parseFloat((item[k] * ratio).toFixed(4));
        } else if (["bonusActiveSpeed", "bonusIdleSpeed"].includes(k)) {
          item[k] = Math.floor(item[k] * ratio);
        } else {
          item[k] = Math.ceil(item[k] * ratio);
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

    // Direct-Alignment Scaling Model: Maps recalculations exactly to enemy exponential scale curves
    let repStage = window.getEffectiveStage((item.stageLevel || 1) * 10);
    let repGrowth = 1.045 + (repStage * 0.04) / (repStage + 200);
    let repScale = Math.pow(repGrowth, repStage);

    let expScale = repScale;
    let hpDefExpScale = repScale;

    let prestigeCount = window.playerStats.prestigeCount || 0;
    let prestigeMult = 1.0;

    // Dynamic base scaling transitions for standard slot configurations
    if (item.type !== "artifact" && item.statsRolled !== "UNIQUE") {
      let stars = item.statsRolled || 0;
      let baseRarityMult = 1.0 + stars * 0.3; // Base stats scale up by 30% per star rarity tier!

      if (
        item.type === "weapon" &&
        !item.isUniqueStaff &&
        !item.isUniqueSword &&
        !item.isUniqueSingularity &&
        !item.isUniqueMaelstrom
      ) {
        item.baseAtk = Math.ceil(
          1.5 * expScale * prestigeMult * baseRarityMult,
        );
      } else if (item.type === "chest" || item.type === "overall") {
        let overallMult = item.type === "overall" ? 1.8 : 1.0;
        item.baseDef = Math.ceil(
          1.5 * hpDefExpScale * prestigeMult * baseRarityMult * overallMult,
        );
        item.baseMaxHp = Math.ceil(
          6.0 * hpDefExpScale * prestigeMult * baseRarityMult * overallMult,
        );
      } else if (item.type === "helmet" && !item.isUniqueTempest) {
        item.baseDef = Math.ceil(
          0.7 * hpDefExpScale * prestigeMult * baseRarityMult,
        );
        item.baseMaxHp = Math.ceil(
          3.0 * hpDefExpScale * prestigeMult * baseRarityMult,
        );
      } else if (item.type === "leggings") {
        item.baseDef = Math.ceil(
          0.7 * hpDefExpScale * prestigeMult * baseRarityMult,
        );
        item.baseMaxHp = Math.ceil(
          3.0 * hpDefExpScale * prestigeMult * baseRarityMult,
        );
      } else if (item.type === "boots" && !item.isUniqueWarpCore) {
        item.baseDef = Math.ceil(
          0.35 * hpDefExpScale * prestigeMult * baseRarityMult,
        );
        item.baseMoveSpeed = Math.ceil(
          1.0 * (item.stageLevel || 1) * prestigeMult,
        );
      } else if (
        item.type === "subweapon" &&
        !item.isUniqueAegis &&
        !item.isUniqueWatch &&
        !item.isUniqueChronicle
      ) {
        if (item.subType === "shield") {
          item.baseDef = Math.ceil(
            1.0 * hpDefExpScale * prestigeMult * baseRarityMult,
          );
        } else if (item.subType === "dagger") {
          item.baseAtk = Math.ceil(
            0.8 * expScale * prestigeMult * baseRarityMult,
          );
        } else if (item.subType === "tome") {
          item.baseInt = Math.ceil(
            1.5 * expScale * prestigeMult * baseRarityMult,
          );
          item.baseAtk = Math.ceil(
            0.4 * expScale * prestigeMult * baseRarityMult,
          );
        }
      }
    } else if (item.type === "artifact") {
      // Artifact parameters are managed statically on drop; preserve them as is
    } else {
      // Recalculate unique item specific base structures
      if (item.isUniqueSingularity || item.isUniqueMaelstrom) {
        item.baseAtk = Math.ceil(3.5 * expScale * prestigeMult);
      } else if (item.isUniqueAegis) {
        item.baseDef = Math.ceil(10 * hpDefExpScale * prestigeMult);
        item.baseBlock = 0.05 * (item.stageLevel || 1);
      } else if (item.isUniqueWatch || item.isUniqueChronicle) {
        item.baseInt = Math.ceil(2.5 * (item.stageLevel || 1) * prestigeMult);
      } else if (item.isUniqueWarpCore) {
        item.baseMoveSpeed = Math.ceil(
          3 * (item.stageLevel || 1) * prestigeMult,
        );
      } else if (item.isUniqueTempest) {
        item.baseMaxHp = Math.ceil(12 * hpDefExpScale * prestigeMult);
        item.baseDef = Math.ceil(4 * hpDefExpScale * prestigeMult);
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

  let tempers = item.temperLevel || 0;

  // Self-Healing Save Migration: Reconstruct unmutated raw properties for legacy items
  if (item.rawBaseAtk === undefined) {
    if (tempers > 0 && item.type !== "artifact") {
      let multiplier = 1 + tempers * 0.08;
      item.rawBaseAtk = Math.round((item.baseAtk || 0) / multiplier);
      item.rawBaseDef = Math.round((item.baseDef || 0) / multiplier);
      item.rawBaseMaxHp = Math.round((item.baseMaxHp || 0) / multiplier);
      item.rawBaseInt = Math.round((item.baseInt || 0) / multiplier);
    } else {
      item.rawBaseAtk = item.baseAtk || 0;
      item.rawBaseDef = item.baseDef || 0;
      item.rawBaseMaxHp = item.baseMaxHp || 0;
      item.rawBaseInt = item.baseInt || 0;
    }
    item.rawBaseMoveSpeed = item.baseMoveSpeed || 0;
    item.rawBaseBlock = item.baseBlock || 0;
    item.rawBaseParry = item.baseParry || 0;
  }

  if (item.type === "artifact") {
    if (item.baseGoldMulti === undefined)
      item.baseGoldMulti = Math.max(0, item.goldMulti - tempers * 0.05);
    if (item.baseDropRate === undefined)
      item.baseDropRate = Math.max(0, item.dropRate - tempers * 0.03);
    if (item.baseQuality === undefined)
      item.baseQuality = Math.max(0, item.quality - tempers * 0.02);
    if (item.baseFairySpawn === undefined)
      item.baseFairySpawn = Math.max(0, item.fairySpawn - tempers * 0.02);
    if (item.baseRareSpawn === undefined)
      item.baseRareSpawn = Math.max(0, item.rareSpawn - tempers * 0.01);
  }

  if (
    item.type === "subweapon" &&
    item.subType === "tome" &&
    !item.isUniqueWatch &&
    !item.isUniqueChronicle
  ) {
    let stars = item.statsRolled || 0;
    let baseRarityMult = 1.0 + stars * 0.3;
    let repStage = window.getEffectiveStage((item.stageLevel || 1) * 10);
    let repGrowth = 1.045 + (repStage * 0.04) / (repStage + 200);
    let repScale = Math.pow(repGrowth, repStage);
    let expScale = repScale;
    let prestigeMult = 1.0;

    item.rawBaseInt = Math.ceil(1.5 * expScale * prestigeMult * baseRarityMult);
    item.rawBaseAtk = Math.ceil(0.4 * expScale * prestigeMult * baseRarityMult);
  }

  // Restore pristine unmutated baseline stats to ensure clean idempotency
  item.baseAtk = item.rawBaseAtk;
  item.baseDef = item.rawBaseDef;
  item.baseMaxHp = item.rawBaseMaxHp;
  item.baseInt = item.rawBaseInt;
  item.baseMoveSpeed = item.rawBaseMoveSpeed;
  item.baseBlock = item.rawBaseBlock;
  item.baseParry = item.rawBaseParry;

  if (item.type === "artifact") {
    item.goldMulti = item.baseGoldMulti;
    item.dropRate = item.baseDropRate;
    item.quality = item.baseQuality;
    item.fairySpawn = item.baseFairySpawn;
    item.rareSpawn = item.baseRareSpawn;
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
        item.dropRate = parseFloat((item.dropRate + tempers * 0.03).toFixed(4));
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
      item.baseAtk = Math.round(item.baseAtk * multiplier);
      item.baseDef = Math.round(item.baseDef * multiplier);
      item.baseMaxHp = Math.round(item.baseMaxHp * multiplier);
      item.baseInt = Math.round(item.baseInt * multiplier);

      item.atk = Math.round(item.atk * multiplier);
      item.maxHp = Math.round(item.maxHp * multiplier);
      item.def = Math.round(item.def * multiplier);
      item.str = Math.round(item.str * multiplier);
      item.dex = Math.round(item.dex * multiplier);
      item.int = Math.round(item.int * multiplier);

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
        item.dropRate = parseFloat((item.dropRate + tempers * 0.01).toFixed(4));
      if (item.quality > 0)
        item.quality = parseFloat((item.quality + tempers * 0.005).toFixed(4));
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
};

// Append Item Upgrade Logic directly inside ItemFactory
Object.assign(window.ItemFactory, {
  addRandomStatLineToItem(item) {
    let pool = [
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
    let effStageScale = window.getEffectiveStage(stageScale * 10) / 10;
    // Re-balanced from polynomial to exponential curves to match exponential enemy scaling
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
          Math.pow(stageScale, 1.8) *
          rarityMult *
          prestigeMult,
      );
    else if (selectedStat === "dex")
      item.bonusDex += Math.ceil(
        window.randInt(1, 3) *
          Math.pow(stageScale, 1.8) *
          rarityMult *
          prestigeMult,
      );
    else if (selectedStat === "int")
      item.bonusInt += Math.ceil(
        window.randInt(1, 3) *
          Math.pow(stageScale, 1.8) *
          rarityMult *
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
      window.playerStats.currentHp = Math.min(
        window.playerStats.currentHp,
        newMaxHp,
      );
    }

    if (typeof window.checkAchievements === "function")
      window.checkAchievements();
    if (typeof window.updateUI === "function") window.updateUI();
    if (typeof window.renderInventory === "function") window.renderInventory();
    if (typeof window.renderForgeTab === "function") window.renderForgeTab();
    if (typeof window.saveGame === "function") window.saveGame();
  },
});

// Legacy Compatibility Aliases to protect references
window.equipItem = (id) => window.GameState.equipItem(id);

// Append unequipItem inside window.GameState namespace
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
      window.playerStats.currentHp = Math.min(
        window.playerStats.currentHp,
        newMaxHp,
      );
    }

    if (typeof window.checkAchievements === "function")
      window.checkAchievements();
    if (typeof window.updateUI === "function") window.updateUI();
    if (typeof window.renderInventory === "function") window.renderInventory();
    if (typeof window.renderForgeTab === "function") window.renderForgeTab();
    if (typeof window.saveGame === "function") window.saveGame();
  },
});

// Legacy Compatibility Aliases to protect references
window.unequipItem = (slotKey) => window.GameState.unequipItem(slotKey);

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
    window.playerStats.currentHp = Math.min(
      window.playerStats.currentHp,
      newMaxHp,
    );
  }
  if (typeof window.checkAchievements === "function")
    window.checkAchievements();
  if (typeof window.updateUI === "function") window.updateUI();
  if (typeof window.renderInventory === "function") window.renderInventory();
  if (typeof window.saveGame === "function") window.saveGame();
};

// Append checkAutoSalvage inside window.GameState namespace
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
    let itemLvlMultiplier = Math.pow(
      1.045,
      Math.max(0, (item.stageLevel - 1) * 5),
    );
    return Math.floor(
      baseCost * Math.pow(1.5, item.temperLevel) * itemLvlMultiplier,
    );
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
    }
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
    if (station === "blacksmith") {
      if (bm) bm.style.display = "flex";
      if (em) em.style.display = "none";
      window.setForgeMode("temper");
    } else {
      if (bm) bm.style.display = "none";
      if (em) em.style.display = "flex";
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

    let slotKey = item.type === "subweapon" ? "subweapon" : item.type;
    let slotLevel =
      (window.playerStats.slotUpgrades &&
        window.playerStats.slotUpgrades[slotKey]) ||
      0;
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
    let effStageScale = window.getEffectiveStage(stageScale * 10) / 10;
    // Re-balanced from polynomial to exponential curves to match exponential enemy scaling
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
    let probs = window.calculateRarityProbabilities(p.qly, true, isGlimmering);
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
  let stageScale = Math.floor((peakRunStage - 1) / 10) + 1;

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
  window.SoundManager.play("fairy");

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
    cost = Math.ceil(item.cost * Math.pow(1.08, window.playerStats.stage));
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
    cost = Math.floor(15000 * Math.pow(1.18, p.vendingQLevel || 0));
  } else if (type === "shop") {
    levelField = "shopQLevel";
    cost = Math.floor(30000 * Math.pow(1.22, p.shopQLevel || 0));
  } else if (type === "global") {
    levelField = "globalQLevel";
    cost = Math.floor(100000 * Math.pow(1.28, p.globalQLevel || 0));
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
    window.spawnPurchaseCelebration("alchemy", "#f1c40f", 4);
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

  window.playerStats.astralShards -= item.cost;
  window.addEtcDrop(item.name, 1);

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
  let costGold = Math.floor(1000000 * Math.pow(1.5, parLevel));
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
        window.spawnPurchaseCelebration("alchemy", "#ff007f", 5);
      }
      window.invalidatePlayerStats();
      window.updateUI();
      window.renderPrestigeTab();
      window.renderInventory();
      window.saveGame();
    },
  );
};
