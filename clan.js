/* ==========================================================================
   PRIMARY PURPOSE: Manages all Clan/Guild mechanics, database interaction,
   DOM renders, upgrades, and invitations.
   ========================================================================= */

window.clanActiveTab = "OVERVIEW";

window.getClanEmblemHtml = function (seed, size = 32) {
  // Use seed to determine colors and icons procedurally
  const primaryColors = [
    "#3498db",
    "#e74c3c",
    "#2ecc71",
    "#f1c40f",
    "#9b59b6",
    "#e67e22",
    "#1abc9c",
    "#e84393",
  ];
  const secondaryColors = [
    "#2c3e50",
    "#c0392b",
    "#27ae60",
    "#d35400",
    "#8e44ad",
    "#d35400",
    "#16a085",
    "#960018",
  ];

  const shapes = [
    // Shield
    `<path d="M4,4 Q12,2, 20,4 Q19,14, 12,21 Q5,14, 4,4 Z" fill="url(#em_bg_${seed})" stroke="url(#em_border_${seed})" stroke-width="1.5" />`,
    // Diamond
    `<path d="M12,2 L21,12 L12,21 L3,12 Z" fill="url(#em_bg_${seed})" stroke="url(#em_border_${seed})" stroke-width="1.5" />`,
    // Circle/Crest
    `<circle cx="12" cy="12" r="9.5" fill="url(#em_bg_${seed})" stroke="url(#em_border_${seed})" stroke-width="1.5" />`,
    // Rounded Hexagon
    `<path d="M12,2 L20,6 L20,17 L12,21 L4,17 L4,6 Z" fill="url(#em_bg_${seed})" stroke="url(#em_border_${seed})" stroke-width="1.5" />`,
  ];

  const symbols = [
    // Sword
    `<path d="M12,5 L13.5,8 L13,16 L11,16 L10.5,8 Z" fill="#fff" stroke="#000" stroke-width="0.8" /><rect x="9" y="16" width="6" height="1.5" rx="0.5" fill="#f1c40f" stroke="#000" stroke-width="0.8" /><rect x="11.2" y="17.5" width="1.6" height="3" fill="#5c3a21" />`,
    // Star
    `<polygon points="12,5 14,10 19,10 15,13 17,18 12,15 7,18 9,13 5,10 10,10" fill="#fff" stroke="#000" stroke-width="0.8" />`,
    // Cross
    `<path d="M10,6 H14 V10 H18 V14 H14 V19 H10 V14 H6 V10 H10 Z" fill="#fff" stroke="#000" stroke-width="0.8" />`,
    // Crown
    `<path d="M6,16 L8,10 L12,14 L16,10 L18,16 Z" fill="#fff" stroke="#000" stroke-width="0.8" /><rect x="6" y="16" width="12" height="2" fill="#f1c40f" stroke="#000" stroke-width="0.8" />`,
    // Wings/V
    `<path d="M5,8 Q12,12, 19,8 L17,14 Q12,18, 7,14 Z" fill="#fff" stroke="#000" stroke-width="0.8" />`,
    // Shield inside shield
    `<path d="M8,8 Q12,7, 16,8 Q15,14, 12,18 Q9,14, 8,8 Z" fill="#fff" stroke="#000" stroke-width="0.8" />`,
  ];

  let pCol = primaryColors[seed % primaryColors.length];
  let sCol = secondaryColors[(seed + 3) % secondaryColors.length];
  let shape = shapes[seed % shapes.length];
  let symbol = symbols[(seed + 1) % symbols.length];

  let bg = "rgba(170, 170, 170, 0.12)";
  let border = "#444";

  let innerHtml = `
    <defs>
      <linearGradient id="em_bg_${seed}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${pCol}" />
        <stop offset="100%" stop-color="${sCol}" />
      </linearGradient>
      <linearGradient id="em_border_${seed}" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#ffffff" />
        <stop offset="100%" stop-color="#555555" />
      </linearGradient>
    </defs>
    ${shape}
    ${symbol}
  `;

  return window.AssetCatalog.compile("0 0 24 24", innerHtml, size, bg, border);
};

window.toggleClanHall = function () {
  if (window.playerStats.level < 25) {
    window.pushHeaderToast("🔒 Clan Hall unlocks at Level 25!", "#e74c3c");
    return;
  }
  let modal = document.getElementById("clan-draggable-window");
  if (modal) {
    modal.remove();
    window.hideTooltip();
  } else {
    window.hideTooltip();
    window.clanActiveTab = "OVERVIEW";

    let win = document.createElement("div");
    win.id = "clan-draggable-window";
    win.className = "draggable-window";
    win.style.left = "80px";
    win.style.top = "60px";
    win.style.width = "390px";

    win.innerHTML = `
      <div class="draggable-header" id="clan-win-handle" style="background: linear-gradient(180deg, #181d24 0%, #0d1117 100%);">
          <span style="display:flex; align-items:center; gap:6px;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  <path d="M12 8v8M9 11h6"/>
              </svg>
              Clan Hall
          </span>
          <button onclick="document.getElementById('clan-draggable-window').remove(); window.hideTooltip();" style="background:transparent; border:none; color:#e74c3c; font-weight:bold; cursor:pointer; font-size:11px; padding:2px;">[X]</button>
      </div>
      <div class="draggable-content" id="clan-win-content" style="max-height: 440px; padding: 12px; background:#07030b;">
          <!-- Injected dynamically -->
      </div>
    `;

    document.getElementById("game-container").appendChild(win);
    window.fetchClanData();
    window.makeWindowDraggable(win, document.getElementById("clan-win-handle"));
  }
};

window.fetchClanData = function () {
  const contentEl = document.getElementById("clan-win-content");
  if (!contentEl) return;

  if (!window.GAME_SERVER_URL) {
    contentEl.innerHTML = `<div style="color:#666; text-align:center; padding: 20px 0; font-size:11px; font-style:italic;">Clan Hall is offline in offline/GitHub mode.</div>`;
    return;
  }

  const userId = window.getGameUserId();
  contentEl.innerHTML = `<div style="color:#aaa; text-align:center; padding: 20px 0; font-size:11px;">Connecting to Clan Sanctum...</div>`;

  fetch(`${window.GAME_SERVER_URL}/api/clan/info`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId }),
  })
    .then((r) => r.json())
    .then((data) => {
      if (data.success) {
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
          window.renderClanDashboard(
            data.clan,
            data.members,
            data.invitations || [],
          );
        } else {
          window.playerStats.clanId = null;
          window.playerStats.clanName = null;
          window.renderClanCreation(
            data.clansList || [],
            data.invitations || [],
          );
        }
      } else {
        contentEl.innerHTML = `<div style="color:#e74c3c; text-align:center; padding: 20px 0; font-size:11px;">Error loading clan matrix.</div>`;
      }
    })
    .catch((err) => {
      console.error("Clan fetch failed:", err);
      contentEl.innerHTML = `<div style="color:#e74c3c; text-align:center; padding: 20px 0; font-size:11px;">Could not connect to the Clan Sanctum server.</div>`;
    });
};

window.joinOpenClan = function (clanId) {
  const userId = window.getGameUserId();
  fetch(`${window.GAME_SERVER_URL}/api/clan/join-open`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, clanId }),
  })
    .then((r) => r.json())
    .then((data) => {
      if (data.success) {
        window.pushHeaderToast("🎉 Welcome to your new Clan!", "#2ecc71");
        window.fetchClanData();
        window.updateUI();
        window.saveGame();
      } else {
        window.pushHeaderToast(`❌ ${data.error}`, "#e74c3c");
      }
    })
    .catch(() => {
      window.pushHeaderToast("❌ Connection error joining clan.", "#e74c3c");
    });
};

window.renderClanCreation = function (clansList, invitations) {
  const contentEl = document.getElementById("clan-win-content");
  if (!contentEl) return;

  let inviteHtml = "";
  if (invitations.length > 0) {
    inviteHtml = `
      <div style="border: 1px solid #9b59b6; border-radius: 6px; padding: 10px; background: rgba(155, 89, 182, 0.05); margin-bottom: 12px; text-align:left;">
          <strong style="color:#df9ffb; font-size:11.5px; display:flex; align-items:center; gap:6px; margin-bottom:6px;">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
              Pending Clan Invitations:
          </strong>
          ${invitations
            .map(
              (inv) => `
              <div style="display:flex; justify-content:space-between; align-items:center; background:#111; padding:6px; border-radius:4px; margin-bottom:4px; border:1px solid #333;">
                  <span style="font-size:11px; color:#fff; font-weight:bold;">${window.escapeHTML(inv.clanName)}</span>
                  <button class="btn-action" style="padding:2px 8px; font-size:10px; background:#2ecc71;" onclick="window.acceptClanInvitation(${inv.id})">Join</button>
              </div>
          `,
            )
            .join("")}
      </div>
    `;
  }

  contentEl.innerHTML = `
    ${inviteHtml}
    <div style="border:1px solid #333; border-radius:6px; padding:10px; background:rgba(0,0,0,0.5); text-align:center; margin-bottom:12px;">
        <strong style="color:#f1c40f; font-size:12.5px; display:inline-flex; align-items:center; gap:4px; margin-bottom:4px;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M12 8v8M9 11h6"/></svg>
            Found a New Clan
        </strong>
        <p style="font-size:10px; color:#aaa; margin-bottom:10px; line-height:1.45;">Establish a cooperative Clan. Costs <span style="color:#f1c40f; font-weight:bold;">100,000 Gold</span>. Name length limited to 3-16 chars, alphanumeric characters only.</p>
        <div style="display:flex; gap:6px;">
            <input type="text" id="clan-create-name" placeholder="Clan Name" maxlength="16" style="flex:1; background:#111; color:#fff; border:1px solid #444; padding:4px; font-size:11px; border-radius:4px;">
            <button class="btn-action" style="background:#f1c40f; color:#111;" onclick="window.executeCreateClan()">Found Clan</button>
        </div>
    </div>

    <strong style="color:#df9ffb; font-size:11px; display:inline-flex; align-items:center; gap:4px; margin-bottom:6px; text-align:left; text-transform:uppercase; letter-spacing:0.5px;">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M12 8v8M9 11h6"/></svg>
        Available Clans (${clansList.length})
    </strong>
    <div style="max-height:160px; overflow-y:auto; display:flex; flex-direction:column; gap:4px;">
        ${
          clansList.length === 0
            ? `<div style="font-size:10.5px; color:#666; font-style:italic; padding:15px; text-align:center;">No open clans found. Try founding one!</div>`
            : clansList
                .map((g) => {
                  let emblem = window.getClanEmblemHtml(
                    g.leader_id.charCodeAt(0) || 0,
                    14,
                  );
                  let btnHtml = "";
                  let pLvl = window.playerStats.level || 1;
                  if (g.join_policy === "open") {
                    let canJoin = pLvl >= g.min_level;
                    btnHtml = `<button class="btn-action" style="padding:2px 8px; font-size:10px; background:#2ecc71;" ${canJoin ? "" : "disabled style='opacity:0.5; cursor:not-allowed;' title='Requires Level " + g.min_level + "'"} onclick="window.joinOpenClan(${g.id})">Join</button>`;
                  } else {
                    btnHtml = `<span style="font-size:9.5px; color:#666;" title="This clan requires an explicit invitation from the founder.">Invite-Only</span>`;
                  }
                  return `
            <div style="display:flex; justify-content:space-between; align-items:center; background:#111; border:1px solid #222; padding:6px 10px; border-radius:4px; gap:8px;">
                <div style="display:flex; align-items:center; gap:6px; text-align:left; min-width:0; flex:1;">
                    ${emblem}
                    <div style="min-width:0; flex:1;">
                        <strong style="font-size:11.5px; color:#fff; display:block; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${window.escapeHTML(g.name)}</strong>
                        <span style="font-size:9px; color:#aaa; display:block; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">Level ${g.level} ${g.min_level > 1 ? "• Min Lv. " + g.min_level : ""}</span>
                    </div>
                </div>
                ${btnHtml}
            </div>
          `;
                })
                .join("")
        }
    </div>
  `;
};

window.executeCreateClan = function () {
  let nameInput = document.getElementById("clan-create-name");
  if (!nameInput) return;
  let name = nameInput.value.trim();

  if (!window.validateGuildNameInput(name)) {
    window.pushHeaderToast(
      "❌ Invalid Clan Name! 3-16 chars, letters/numbers and single spaces only.",
      "#e74c3c",
    );
    return;
  }

  if (window.playerStats.coins < 100000) {
    window.pushHeaderToast(
      "❌ Insufficient Gold! Foundation requires 100,000 Gold.",
      "#e74c3c",
    );
    return;
  }

  const userId = window.getGameUserId();
  fetch(`${window.GAME_SERVER_URL}/api/clan/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, name }),
  })
    .then((r) => r.json())
    .then((data) => {
      if (data.success) {
        window.playerStats.coins -= 100000;
        window.pushHeaderToast(
          `🏰 Clan ${name} successfully founded!`,
          "#2ecc71",
        );
        window.fetchClanData();
        window.updateUI();
        window.saveGame();
      } else {
        window.pushHeaderToast(`❌ ${data.error}`, "#e74c3c");
      }
    })
    .catch(() => {
      window.pushHeaderToast("❌ Network error founding clan.", "#e74c3c");
    });
};

window.acceptClanInvitation = function (inviteId) {
  const userId = window.getGameUserId();
  fetch(`${window.GAME_SERVER_URL}/api/clan/join`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, inviteId }),
  })
    .then((r) => r.json())
    .then((data) => {
      if (data.success) {
        window.pushHeaderToast("🎉 Welcome to your new Clan!", "#2ecc71");
        window.fetchClanData();
        window.updateUI();
        window.saveGame();
      } else {
        window.pushHeaderToast(`❌ ${data.error}`, "#e74c3c");
      }
    })
    .catch(() => {
      window.pushHeaderToast("❌ Network error joining clan.", "#e74c3c");
    });
};

window.renderClanDashboard = function (clan, members, invitations) {
  const contentEl = document.getElementById("clan-win-content");
  if (!contentEl) return;

  const currentTab = window.clanActiveTab || "OVERVIEW";
  const userId = window.getGameUserId();
  const isLeader = clan.leader_id === userId;

  let unclaimedQuestsCount = 0;
  if (clan.quests && clan.quests.activeList) {
    clan.quests.activeList.forEach((q) => {
      if (
        q.completed &&
        q.claimedUserIds &&
        !q.claimedUserIds.includes(userId)
      ) {
        unclaimedQuestsCount++;
      }
    });
  }
  window.playerStats.pendingClanQuestsCompletedCount = unclaimedQuestsCount;

  let tabHeaderHtml = `
    <div style="display:grid; grid-template-columns: repeat(6, 1fr); gap:2px; margin-bottom:12px;">
        <button onclick="window.switchClanTab('OVERVIEW')" class="sub-tab-btn ${currentTab === "OVERVIEW" ? "active" : ""}" style="padding:4px 1px; font-size:8.5px; display:inline-flex; flex-direction:column; align-items:center; justify-content:center; gap:2px; height:34px;">
            Overview
        </button>
        <button onclick="window.switchClanTab('MEMBERS')" class="sub-tab-btn ${currentTab === "MEMBERS" ? "active" : ""}" style="padding:4px 1px; font-size:8.5px; display:inline-flex; flex-direction:column; align-items:center; justify-content:center; gap:2px; height:34px;">
            Members
        </button>
        <button onclick="window.switchClanTab('QUESTS')" class="sub-tab-btn ${currentTab === "QUESTS" ? "active" : ""}" style="padding:4px 1px; font-size:8.5px; display:inline-flex; flex-direction:column; align-items:center; justify-content:center; gap:2px; height:34px; position:relative;">
            Quests
            ${unclaimedQuestsCount > 0 ? `<span style="position:absolute; top:-1px; right:-1px; width:6px; height:6px; background:#e74c3c; border-radius:50%; box-shadow:0 0 4px #e74c3c;"></span>` : ""}
        </button>
        <button onclick="window.switchClanTab('DONATE')" class="sub-tab-btn ${currentTab === "DONATE" ? "active" : ""}" style="padding:4px 1px; font-size:8.5px; display:inline-flex; flex-direction:column; align-items:center; justify-content:center; gap:2px; height:34px;">
            Donation
        </button>
        <button onclick="window.switchClanTab('RESEARCH')" class="sub-tab-btn ${currentTab === "RESEARCH" ? "active" : ""}" style="padding:4px 1px; font-size:8.5px; display:inline-flex; flex-direction:column; align-items:center; justify-content:center; gap:2px; height:34px;">
            Research
        </button>
        <button onclick="window.switchClanTab('SETTINGS')" class="sub-tab-btn ${currentTab === "SETTINGS" ? "active" : ""}" style="padding:4px 1px; font-size:8.5px; display:inline-flex; flex-direction:column; align-items:center; justify-content:center; gap:2px; height:34px;">
            Settings
        </button>
    </div>
  `;

  let tabContentHtml = "";

  if (currentTab === "OVERVIEW") {
    let nextXp = Math.floor(100 * Math.pow(clan.level, 1.8));
    let xpPct = Math.min(100, (clan.xp / nextXp) * 100);
    let emblem = window.getClanEmblemHtml(
      clan.leader_id.charCodeAt(0) || 0,
      32,
    );

    tabContentHtml = `
      <div style="background:rgba(0,0,0,0.4); border:1px solid #333; border-radius:6px; padding:10px; margin-bottom:12px; display:flex; align-items:center; gap:12px; text-align:left;">
          ${emblem}
          <div style="flex:1; min-width:0;">
              <strong style="font-size:14px; color:#df9ffb; text-shadow: 0 0 6px rgba(142,68,173,0.3);">${window.escapeHTML(clan.name)}</strong>
                  <div style="font-size:10px; color:#aaa; margin-top:2px; font-family:monospace;">Clan Level ${clan.level} (${clan.xp}/${nextXp} XP)</div>
              <div style="width:100%; height:4px; background:#222; border-radius:2px; overflow:hidden; border:1px solid #333; margin-top:4px;">
                  <div style="width:${xpPct}%; height:100%; background:#9b59b6;"></div>
              </div>
          </div>
      </div>

      <div style="background:#111; border:1px solid #222; border-radius:6px; padding:8px 10px; margin-bottom:12px; font-size:11px; text-align:left; line-height:1.4; color:#ddd; white-space:normal;">
          <span style="color:#888; font-size:9px; font-weight:bold; display:block; margin-bottom:2px; text-transform:uppercase;">📜 CLAN ANNOUNCEMENT:</span>
          "${window.escapeHTML(clan.description || "Welcome to our Clan!")}"
      </div>

      <div style="background:rgba(0,0,0,0.5); border:1px solid #222; border-radius:6px; padding:8px; margin-bottom:12px; font-size:10.5px; text-align:left;">
          <div style="color:#aaa; font-weight:bold; border-bottom:1px solid #333; padding-bottom:3px; margin-bottom:6px; text-transform:uppercase; letter-spacing:0.5px; font-family:monospace;">🏛️ Clan Vault Balances:</div>
          <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:4px; text-align:center; font-family:monospace;">
              <div style="background:#111; padding:4px; border-radius:3px; border:1px solid #333;"><span style="color:#888; font-size:8px;">GOLD</span><strong style="color:#f1c40f; display:block; margin-top:2px;">${window.formatNumber(clan.gold_bank)}</strong></div>
              <div style="background:#111; padding:4px; border-radius:3px; border:1px solid #333;"><span style="color:#888; font-size:8px;">SOULS</span><strong style="color:#ffb6c1; display:block; margin-top:2px;">${window.formatNumber(clan.souls_bank)}</strong></div>
              <div style="background:#111; padding:4px; border-radius:3px; border:1px solid #333;"><span style="color:#888; font-size:8px;">LUMINOUS</span><strong style="color:#ffb6c1; display:block; margin-top:1px;">${window.formatNumber(clan.luminous_bank)}</strong></div>
          </div>
      </div>

      <div style="background:#111; border:1px solid #222; border-radius:6px; padding:10px; font-size:11px; text-align:left; line-height:1.45; white-space:normal; color:#aaa;">
          <strong style="color:#df9ffb;">💡 CLAN INFO:</strong><br>
          • Join Policy: <span style="color:#fff; font-weight:bold;">${clan.join_policy === "open" ? "Open (Join Instantly)" : "Invite Only"}</span><br>
          • Minimum Level Requirement: <span style="color:#fff; font-weight:bold;">Lv. ${clan.min_level}</span><br>
          • Members Enrolled: <span style="color:#fff; font-weight:bold;">${members.length} / 20</span>
      </div>
    `;
  } else if (currentTab === "DONATE") {
    let goldOwned = window.playerStats.coins || 0;
    let soulsOwned = window.inventory.ETC["Monster Soul"] || 0;
    let luminousOwned = window.inventory.ETC["Luminous Soul"] || 0;

    tabContentHtml = `
      <div style="text-align:left; background:rgba(0,0,0,0.3); border:1px solid #333; border-radius:6px; padding:10px; margin-bottom:12px; font-size:11px; line-height:1.45;">
          <strong style="color:#f1c40f; display:inline-flex; align-items:center; gap:4px; margin-bottom:4px;">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><path d="M12 8v8M9 10h6M9 13h6"/></svg>
              Contribution Chamber
          </strong>
          Donating resources grows the shared **Clan Vault treasury**, enabling the Clan Founder to initiate powerful skill passive research. (Clan XP is earned through weekly cooperative quests).
      </div>

      <div style="display:flex; flex-direction:column; gap:6px; text-align:left;">
          <!-- Gold Donation -->
          <div style="background:#111; border:1px solid #222; padding:8px; border-radius:6px; display:flex; justify-content:space-between; align-items:center;">
              <div>
                  <strong style="color:#f1c40f; font-size:11px; display:inline-flex; align-items:center; gap:4px;">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><path d="M12 8v8M9 10h6M9 13h6"/></svg>
                      Donate Gold
                  </strong>
                  <div style="font-size:9.5px; color:#aaa;">Owned: ${window.formatNumber(goldOwned)} Gold</div>
              </div>
              <div style="display:flex; gap:4px;">
                  <button class="btn-action" style="background:#f1c40f; color:#111; font-size:9.5px; padding:4px 8px;" ${goldOwned >= 10000 ? "" : "disabled"} onclick="window.executeClanDonate('gold', 10000)">10K</button>
                  <button class="btn-action" style="background:#f1c40f; color:#111; font-size:9.5px; padding:4px 8px;" ${goldOwned >= 100000 ? "" : "disabled"} onclick="window.executeClanDonate('gold', 100000)">100K</button>
              </div>
          </div>

          <!-- Monster Souls Donation -->
          <div style="background:#111; border:1px solid #222; padding:8px; border-radius:6px; display:flex; justify-content:space-between; align-items:center;">
              <div>
                  <strong style="color:#bdc3c7; font-size:11px; display:inline-flex; align-items:center; gap:4px;">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/></svg>
                      Donate Monster Souls
                  </strong>
                  <div style="font-size:9.5px; color:#aaa;">Owned: ${soulsOwned.toLocaleString()} Souls</div>
              </div>
              <div style="display:flex; gap:4px;">
                  <button class="btn-action" style="background:#bdc3c7; color:#111; font-size:9.5px; padding:4px 8px;" ${soulsOwned >= 50 ? "" : "disabled"} onclick="window.executeClanDonate('souls', 50)">50</button>
                  <button class="btn-action" style="background:#bdc3c7; color:#111; font-size:9.5px; padding:4px 8px;" ${soulsOwned >= 250 ? "" : "disabled"} onclick="window.executeClanDonate('souls', 250)">250</button>
              </div>
          </div>

          <!-- Luminous Souls Donation -->
          <div style="background:#111; border:1px solid #222; padding:8px; border-radius:6px; display:flex; justify-content:space-between; align-items:center;">
              <div>
                  <strong style="color:#ffb6c1; font-size:11px; display:inline-flex; align-items:center; gap:4px;">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/></svg>
                      Donate Luminous Souls
                  </strong>
                  <div style="font-size:9.5px; color:#aaa;">Owned: ${luminousOwned.toLocaleString()} Souls</div>
              </div>
              <div style="display:flex; gap:4px;">
                  <button class="btn-action" style="background:#ffb6c1; color:#111; font-size:9.5px; padding:4px 8px;" ${luminousOwned >= 5 ? "" : "disabled"} onclick="window.executeClanDonate('luminous', 5)">5</button>
                  <button class="btn-action" style="background:#ffb6c1; color:#111; font-size:9.5px; padding:4px 8px;" ${luminousOwned >= 25 ? "" : "disabled"} onclick="window.executeClanDonate('luminous', 25)">25</button>
              </div>
          </div>
      </div>
    `;
  } else if (currentTab === "MEMBERS") {
    function formatRelativeTime(timestamp) {
      let diff = Date.now() - timestamp;
      if (diff < 15000) return "Active now";
      let secs = Math.floor(diff / 1000);
      if (secs < 60) return `${secs}s ago`;
      let mins = Math.floor(secs / 60);
      if (mins < 60) return `${mins}m ago`;
      let hours = Math.floor(mins / 60);
      if (hours < 24) return `${hours}h ago`;
      let days = Math.floor(hours / 24);
      return `${days}d ago`;
    }

    tabContentHtml = `
      <div style="display:flex; flex-direction:column; gap:4px; max-height: 280px; overflow-y:auto; padding-right:4px;">
          ${members
            .map((m, idx) => {
              let isLeaderRow = m.userId === clan.leader_id;
              let rankTag = isLeaderRow
                ? `<span style="color:#f1c40f; font-weight:bold;">Founder</span>`
                : `<span style="color:#888;">Member</span>`;
              let canvasId = `clan-member-canvas-${m.userId}`;

              let titleTextHtml = "";
              if (m.equippedTitle && window.TITLES_DATA[m.equippedTitle]) {
                let tData = window.TITLES_DATA[m.equippedTitle];
                titleTextHtml = `<span style="color:${tData.color || "#ff007f"}; font-size:8px; font-weight:bold; margin-left:4px;">[${tData.name}]</span>`;
              }

              let showKickBtn = isLeader && !isLeaderRow;
              return `
              <div style="background:#111; border:1px solid #222; border-radius:6px; padding:6px 10px; display:flex; justify-content:space-between; align-items:center; gap:8px;">
                  <div style="display:flex; align-items:center; gap:8px; min-width:0; flex:1; text-align:left;">
                      <canvas id="${canvasId}" width="30" height="40" style="width:30px; height:40px; background:rgba(0,0,0,0.4); border:1px solid #333; border-radius:4px; flex-shrink:0; pointer-events:none;"></canvas>
                      <div style="min-width:0; flex:1;">
                          <div style="display:flex; align-items:center; flex-wrap:wrap; line-height:1.1;">
                              <strong style="font-size:11.5px; color:#fff; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; max-width:110px;">${window.escapeHTML(m.name)}</strong>
                              ${titleTextHtml}
                          </div>
                          <span style="font-size:9px; color:#aaa; font-family:monospace; display:block; margin-top:2px;">Lv. ${m.level} • Peak Stg ${m.lifetimePeakStage} • Contribution: <span style="color:#2ecc71;">${window.formatNumber(m.clanContribution)}</span></span>
                          <span style="font-size:8px; color:#7f8c8d; font-family:monospace;">${formatRelativeTime(Number(m.lastActive))}</span>
                      </div>
                  </div>
                  <div style="display:flex; align-items:center; gap:4px;">
                      <button class="btn-action" style="background:#3498db; font-size:9.5px; padding:3px 6px;" onclick="window.inspectPlayer('${m.userId}')">Inspect</button>
                      ${showKickBtn ? `<button class="btn-action un" style="background:#c0392b; font-size:9.5px; padding:3px 6px;" onclick="window.executeKickMember('${m.userId}', '${window.escapeHTML(m.name)}')">Kick</button>` : ""}
                  </div>
              </div>
            `;
            })
            .join("")}
      </div>
    `;

    setTimeout(() => {
      members.forEach((m) => {
        let canvas = document.getElementById(`clan-member-canvas-${m.userId}`);
        if (canvas) {
          let ctx = canvas.getContext("2d");
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.imageSmoothingEnabled = false;
          window.drawSingleHero(ctx, 15, 14, 0.55, m.equippedSlots, m, 0, {
            slashFrame: false,
            deathAnimationTimer: 0,
            isMainHero: false,
          });
        }
      });
    }, 50);
  } else if (currentTab === "QUESTS") {
    let questsData = clan.quests;
    let listHtml = "";

    if (
      !questsData ||
      !questsData.activeList ||
      questsData.activeList.length === 0
    ) {
      listHtml = `<div style="font-size:11px; color:#666; font-style:italic; text-align:center; padding:35px 0;">No active weekly quests. Check back shortly!</div>`;
    } else {
      let stgScale = Math.max(
        1,
        Math.floor(((window.playerStats.lifetimePeakStage || 1) - 1) / 10) + 1,
      );
      let calculatedGoldMult = Math.pow(1.8, stgScale);

      listHtml = questsData.activeList
        .map((q) => {
          let pct = Math.min(100, (q.current / q.target) * 100);
          let hasClaimed =
            q.claimedUserIds && q.claimedUserIds.includes(userId);

          let claimBtnHtml = "";
          if (hasClaimed) {
            claimBtnHtml = `<span style="color:#7f8c8d; font-size:10px; font-weight:bold;">Claimed ✓</span>`;
          } else if (q.completed) {
            claimBtnHtml = `<button class="btn-action btn-pulse" style="padding:4px 10px; font-size:10px; background:#2ecc71; border-color:#fff;" onclick="window.executeClaimClanQuestReward('${q.id}')">Claim</button>`;
          } else {
            claimBtnHtml = `<span style="color:#aaa; font-size:10px; font-family:monospace;">${q.current.toLocaleString()} / ${q.target.toLocaleString()}</span>`;
          }

          let rewardItems = [];
          if (q.rewards.keys > 0)
            rewardItems.push(
              `<span style="color:#f1c40f;">+${q.rewards.keys} Keys</span>`,
            );
          if (q.rewards.cores > 0)
            rewardItems.push(
              `<span style="color:#2ecc71;">+${q.rewards.cores} Cores</span>`,
            );
          if (q.rewards.essence > 0)
            rewardItems.push(
              `<span style="color:#9b59b6;">+${q.rewards.essence} Essence</span>`,
            );
          if (q.rewards.shards > 0)
            rewardItems.push(
              `<span style="color:#8e44ad;">+${q.rewards.shards} Shards</span>`,
            );
          if (q.rewards.souls > 0)
            rewardItems.push(
              `<span style="color:#ffb6c1;">+${q.rewards.souls} Souls</span>`,
            );
          if (q.rewards.pp > 0)
            rewardItems.push(
              `<span style="color:#ff007f;">+${q.rewards.pp} PP</span>`,
            );
          if (q.rewards.sacks > 0)
            rewardItems.push(
              `<span style="color:#f1c40f;">+${q.rewards.sacks}x Clan Sack</span>`,
            );

          if (q.rewards.goldBase > 0) {
            let actualGoldReward = Math.ceil(
              q.rewards.goldBase * calculatedGoldMult,
            );
            rewardItems.push(
              `<span style="color:#ffd700;">+${window.formatNumber(actualGoldReward)} Gold</span>`,
            );
          }

          let completedOverlay = q.completed
            ? `<div style="position:absolute; top:2px; right:8px; width:12px; height:12px; background:#2ecc71; border-radius:50%; box-shadow:0 0 6px #2ecc71; display:flex; align-items:center; justify-content:center; color:#fff; font-size:8px; font-weight:bold;">✓</div>`
            : "";

          return `
          <div style="position:relative; background:#111; border:1.5px solid ${q.completed ? "#2ecc71" : "#2d3748"}; border-radius:6px; padding:10px; margin-bottom:8px; text-align:left;">
              ${completedOverlay}
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px; gap:8px;">
                  <strong style="font-size:12.5px; color:#fff; display:block;">${q.label}</strong>
                  ${claimBtnHtml}
              </div>
              <p style="font-size:10px; color:#aaa; margin-bottom:8px; line-height:1.35; white-space:normal;">${q.desc}</p>

              <div style="background:#090a0f; border:1px solid #222; border-radius:4px; padding:6px; font-size:9.5px; margin-bottom:8px; display:flex; flex-wrap:wrap; gap:4px 8px; font-family:monospace; line-height:1.2;">
                  <div style="width:100%; color:#9b59b6; font-weight:bold; margin-bottom:2px;">🎁 Quest Rewards (Completed):</div>
                  <div style="color:#df9ffb; font-weight:bold;">+${q.xpReward} Clan XP</div>
                  ${rewardItems.map((item) => `<div>${item}</div>`).join("")}
              </div>

              <div style="width:100%; height:6px; background:#222; border-radius:3px; overflow:hidden; border:1px solid #333; margin-top:2px;">
                  <div style="width:${pct}%; height:100%; background:${q.completed ? "#2ecc71" : "#9b59b6"};"></div>
              </div>
          </div>
        `;
        })
        .join("");
    }

    tabContentHtml = `
              <div style="text-align:left; background:rgba(0,0,0,0.3); border:1px solid #333; border-radius:6px; padding:10px; margin-bottom:12px; font-size:11px; line-height:1.4;">
                  <strong style="color:#df9ffb; display:inline-flex; align-items:center; gap:4px; margin-bottom:4px;">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle; filter: drop-shadow(0 0 2px rgba(155, 89, 182, 0.4));"><path d="M12 2c-.5 5-4 8-8 8 4 0 7.5 3 8 8 .5-5 4-8 8-8-4 0-7.5-3-8-8z"/></svg>
                      Weekly Clan Quests
                  </strong>
                  Cooperate with your Clan to achieve these weekly active goals. Completing quests is the <strong style="color:#df9ffb;">only way</strong> to gain Clan XP and level up! Each completed quest yields massive rewards like **Gacha Keys, Catalyst Cores, Astral Essence, Eridium Shards, or PP** for every single member!
              </div>
              <div style="max-height: 280px; overflow-y:auto; padding-right:4px;">
                  ${listHtml}
              </div>
            `;
  } else if (currentTab === "SETTINGS") {
    let isJoinOpen = clan.join_policy === "open";
    tabContentHtml = `
      <div style="text-align:left; background:rgba(0,0,0,0.3); border:1px solid #333; border-radius:6px; padding:10px; margin-bottom:12px; font-size:11px; line-height:1.45;">
          <strong style="color:#f1c40f; display:inline-flex; align-items:center; gap:4px; margin-bottom:4px;">
              ⚙️ Clan Settings
          </strong>
          Founder control board to customize description, toggle entry policy, edit emblem seeds, promote members, or disband.
      </div>

      ${
        isLeader
          ? `
          <div style="display:flex; flex-direction:column; gap:8px; text-align:left; max-height:280px; overflow-y:auto; padding-right:4px;">
              <!-- Description -->
              <div style="background:#111; border:1px solid #222; padding:8px; border-radius:6px;">
                  <label for="settings-clan-desc" style="font-size:10px; font-weight:bold; color:#f1c40f; display:block; margin-bottom:4px; text-transform:uppercase;">Custom Announcement / Desc:</label>
                  <textarea id="settings-clan-desc" style="width:100%; height:45px; background:#07030b; color:#fff; border:1px solid #444; border-radius:4px; padding:4px; font-size:10.5px; font-family:sans-serif; resize:none;" maxlength="120">${window.escapeHTML(clan.description || "")}</textarea>
              </div>

              <!-- Join Policy & Min Lvl -->
              <div style="display:grid; grid-template-columns: 1fr 1fr; gap:6px; background:#111; border:1px solid #222; padding:8px; border-radius:6px;">
                  <div>
                      <label for="settings-clan-policy" style="font-size:10px; font-weight:bold; color:#f1c40f; display:block; margin-bottom:4px; text-transform:uppercase;">Join Policy:</label>
                      <select id="settings-clan-policy" style="width:100%; background:#07030b; color:#fff; border:1px solid #444; border-radius:4px; padding:4px; font-size:10.5px;">
                          <option value="invite_only" ${!isJoinOpen ? "selected" : ""}>Invite Only</option>
                          <option value="open" ${isJoinOpen ? "selected" : ""}>Open Join</option>
                      </select>
                  </div>
                  <div>
                      <label for="settings-clan-minlevel" style="font-size:10px; font-weight:bold; color:#f1c40f; display:block; margin-bottom:4px; text-transform:uppercase;">Min Level:</label>
                      <input type="number" id="settings-clan-minlevel" value="${clan.min_level || 1}" min="1" max="1000" style="width:100%; background:#07030b; color:#fff; border:1px solid #444; border-radius:4px; padding:4px; font-size:10.5px; font-family:monospace;">
                  </div>
              </div>

              <button class="btn-action" style="width:100%; margin-bottom: 10px; background:#2ecc71; padding:10px 0; font-weight:bold; font-size:11px;" onclick="window.executeSaveClanSettings()">Save Clan Customizations</button>

              <button class="btn-action un" style="width:100%; padding:10px 0; font-weight:bold; font-size:11px;" onclick="window.executeDisbandClan()">Disband Clan</button>
          </div>
      `
          : `
          <div style="border:1px solid #222; border-radius:6px; padding:15px; text-align:center; color:#888; font-style:italic; font-size:11px; white-space:normal; line-height:1.45;">
              🔐 Founder lock enabled. Only the Founder/Leader can modify settings, change description, or set join policy limitations.
          </div>
      `
      }
    `;
  } else if (currentTab === "RESEARCH") {
    let getSkillUpgradeCardHtml = (
      key,
      label,
      bonusText,
      currentL,
      maxL,
      col,
    ) => {
      let costGold = 0;
      let costSoul = 0;
      let soulName = "";

      if (key === "steel_phalanx" || key === "vitality_well") {
        costGold = Math.floor(
          (key === "steel_phalanx" ? 25000 : 20000) * Math.pow(1.35, currentL),
        );
        costSoul = Math.floor(200 * Math.pow(1.25, currentL));
        soulName = "Monster Souls";
      } else {
        let baseG =
          key === "prosperity_accord"
            ? 40000
            : key === "voyagers_guidance"
              ? 50000
              : key === "clan_supply_depot"
                ? 55000
                : 45000;
        let baseS =
          key === "aetheric_wisdom" ? 6 : key === "clan_supply_depot" ? 8 : 5;
        let scaleG = key === "clan_supply_depot" ? 1.45 : 1.4;
        let scaleS = key === "clan_supply_depot" ? 1.35 : 1.3;
        costGold = Math.floor(baseG * Math.pow(scaleG, currentL));
        costSoul = Math.floor(baseS * Math.pow(scaleS, currentL));
        soulName = "Luminous Souls";
      }

      let isMaxed = currentL >= maxL;
      let clanLevel = clan.level || 1;
      let isGated = currentL >= clanLevel * 2;
      let canAffordGold = clan.gold_bank >= costGold;
      let canAffordSoul =
        key === "steel_phalanx" || key === "vitality_well"
          ? clan.souls_bank >= costSoul
          : clan.luminous_bank >= costSoul;

      let canUpgrade =
        isLeader && !isMaxed && !isGated && canAffordGold && canAffordSoul;
      let bgStyle = window.hexToRgba
        ? window.hexToRgba(col, 0.04)
        : "rgba(255,255,255,0.02)";
      let btnTextColor =
        col === "#f1c40f" || col === "#ffb6c1" ? "#111" : "#fff";

      let icon = "";
      if (key === "steel_phalanx")
        icon =
          window.getUiIconSvg("atk", 13) + " " + window.getUiIconSvg("def", 13);
      else if (key === "vitality_well") icon = window.getUiIconSvg("maxHp", 13);
      else if (key === "prosperity_accord")
        icon = window.getUiIconSvg("gold", 13);
      else if (key === "voyagers_guidance")
        icon = window.getUiIconSvg("dropRate", 13);
      else if (key === "aetheric_wisdom")
        icon = window.getUiIconSvg("xpRate", 13);

      let gateText = "";
      if (isGated && !isMaxed) {
        gateText = `<br><span style="color:#e74c3c; font-weight:bold;">🔒 BLOCKED: Level up Clan to ${Math.ceil((currentL + 1) / 2)} to upgrade further!</span>`;
      }

      return `
        <div class="shop-row" style="border-color:${col}; background:${bgStyle}; flex-direction:column; align-items:stretch; text-align:left; gap:4px; padding:10px; margin-bottom:6px; cursor:help;">
                          <div style="display:flex; justify-content:space-between; align-items:center;">
                              <strong style="color:${col}; font-size:11.5px; display:inline-flex; align-items:center; gap:4px;">${icon} ${label} <span style="color:#aaa;">(Lv. ${currentL}/${maxL})</span></strong>
                              <span style="color:#aaa; font-size:9px; font-family:monospace;">${isMaxed ? "MAXED" : "RESEARCH"}</span>
                          </div>
                          <div style="font-size:9.5px; color:#aaa; line-height:1.35; margin-bottom:6px;">
                              Current active bonus: <strong style="color:#fff;">${bonusText}</strong>${gateText}<br>
                              ${
                                isMaxed
                                  ? `<span style="color:#2ecc71; font-weight:bold;">Shared research cap reached!</span>`
                                  : `
                              Cost: <span style="${canAffordGold ? "color:#2ecc71;" : "color:#e74c3c;"}">${window.formatNumber(costGold)} Gold</span> &
                              <span style="${canAffordSoul ? "color:#2ecc71;" : "color:#e74c3c;"}">${window.formatNumber(costSoul)} ${soulName}</span>`
                              }
                          </div>
            ${
              isLeader
                ? `
                <button class="btn-action" style="background:${col}; color:${btnTextColor}; font-weight:bold; font-size:10px; padding:4px;" ${canUpgrade ? "" : 'disabled style="opacity:0.5; cursor:not-allowed;"'} onclick="window.executeUpgradeClanSkill('${key}')">Upgrade Research</button>
            `
                : `<div style="font-size:8.5px; color:#888; font-style:italic; text-align:center;">* Only the Clan Founder can initiate research upgrades.</div>`
            }
        </div>
      `;
    };

    tabContentHtml = `
                                  <div style="display:flex; flex-direction:column; gap:4px;">
                                      ${getSkillUpgradeCardHtml("steel_phalanx", "Steel Phalanx", "+" + ((clan.skill_steel_phalanx || 0) * 0.5).toFixed(1) + "% Attack & Defense", clan.skill_steel_phalanx || 0, 50, "#e74c3c")}
                                      ${getSkillUpgradeCardHtml("vitality_well", "Vitality Well", "+" + ((clan.skill_vitality_well || 0) * 0.8).toFixed(1) + "% Max HP", clan.skill_vitality_well || 0, 50, "#3498db")}
                                      ${getSkillUpgradeCardHtml("prosperity_accord", "Prosperity Accord", "+" + ((clan.skill_prosperity_accord || 0) * 1.0).toFixed(1) + "% Gold Multiplier", clan.skill_prosperity_accord || 0, 30, "#f1c40f")}
                                      ${getSkillUpgradeCardHtml("voyagers_guidance", "Voyager's Guidance", "+" + ((clan.skill_voyagers_guidance || 0) * 0.5).toFixed(1) + "% Drop Rate & Quality", clan.skill_voyagers_guidance || 0, 30, "#2ecc71")}
                                      ${getSkillUpgradeCardHtml("aetheric_wisdom", "Aetheric Wisdom", "+" + ((clan.skill_aetheric_wisdom || 0) * 1.0).toFixed(1) + "% XP Rate", clan.skill_aetheric_wisdom || 0, 30, "#9b59b6")}
                                      ${getSkillUpgradeCardHtml("clan_supply_depot", "Supply Depot", "Crate yields: " + (clan.skill_clan_supply_depot || 0) * 20 + "% Gold & " + (clan.skill_clan_supply_depot || 0) * 10 + "% Souls", clan.skill_clan_supply_depot || 0, 30, "#ffaa00")}
                                  </div>
                                `;
  }

  contentEl.innerHTML = `
    ${tabHeaderHtml}
    ${tabContentHtml}
  `;
};

window.switchClanTab = function (tabId) {
  window.clanActiveTab = tabId;
  window.fetchClanData();
};

window.executeClaimClanQuestReward = function (questId) {
  const userId = window.getGameUserId();
  fetch(`${window.GAME_SERVER_URL}/api/clan/quests-claim`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, questId }),
  })
    .then((r) => r.json())
    .then((data) => {
      if (data.success && data.rewards) {
        let r = data.rewards;
        let claimsReport = [];

        if (r.keys > 0) {
          window.addEtcDrop("Gacha Key", r.keys);
          claimsReport.push(`+${r.keys} Gacha Keys`);
        }
        if (r.cores > 0) {
          window.addEtcDrop("Catalyst Core", r.cores);
          claimsReport.push(`+${r.cores} Catalyst Cores`);
        }
        if (r.essence > 0) {
          window.addEtcDrop("Astral Essence", r.essence);
          claimsReport.push(`+${r.essence} Astral Essence`);
        }
        if (r.shards > 0) {
          window.addEtcDrop("Eridium Shard", r.shards);
          claimsReport.push(`+${r.shards} Eridium Shards`);
        }
        if (r.souls > 0) {
          window.addEtcDrop("Monster Soul", r.souls);
          claimsReport.push(`+${r.souls} Monster Souls`);
        }
        if (r.pp > 0) {
          window.playerStats.prestigePoints =
            (window.playerStats.prestigePoints || 0) + r.pp;
          claimsReport.push(`+${r.pp} Prestige Points (PP)`);
        }
        if (r.sacks > 0) {
          window.addUseDrop("Clan Reward Sack", r.sacks);
          claimsReport.push(`+${r.sacks}x Clan Sacks`);
        }
        if (r.goldBase > 0) {
          let stgScale = Math.max(
            1,
            Math.floor(((window.playerStats.lifetimePeakStage || 1) - 1) / 10) +
              1,
          );
          let calculatedGold = Math.ceil(r.goldBase * Math.pow(1.8, stgScale));
          window.playerStats.coins += calculatedGold;
          window.playerStats.totalGoldEarned =
            (window.playerStats.totalGoldEarned || 0) + calculatedGold;
          claimsReport.push(`+${window.formatNumber(calculatedGold)} Gold`);
        }

        window.pushHeaderToast(
          `🎁 Quest Claimed: ${claimsReport.join(", ")}!`,
          "#2ecc71",
        );
        if (window.SoundManager) window.SoundManager.play("revive");

        // Particle burst
        let cvs = document.getElementById("gameCanvas");
        let w = cvs ? cvs.width : 750;
        let h = cvs ? cvs.height : 250;
        for (let i = 0; i < 30; i++) {
          window.particles.push({
            x: w / 2,
            y: h / 2,
            vx: (Math.random() - 0.5) * 10,
            vy: (Math.random() - 0.5) * 10,
            radius: Math.random() * 3 + 1,
            color: "#f1c40f",
            alpha: 1,
            life: 30,
          });
        }

        window.fetchClanData();
        window.updateUI();
        window.renderInventory();
        window.saveGame();
      } else {
        window.pushHeaderToast(`❌ ${data.error}`, "#e74c3c");
      }
    })
    .catch(() => {
      window.pushHeaderToast(
        "❌ Network error claiming quest reward.",
        "#e74c3c",
      );
    });
};

window.executeSaveClanSettings = function () {
  let descInput = document.getElementById("settings-clan-desc");
  let policySelect = document.getElementById("settings-clan-policy");
  let minLvlInput = document.getElementById("settings-clan-minlevel");

  if (!descInput || !policySelect || !minLvlInput) return;

  const userId = window.getGameUserId();
  const description = descInput.value.trim();
  const joinPolicy = policySelect.value;
  const minLevel = parseInt(minLvlInput.value, 10) || 1;

  fetch(`${window.GAME_SERVER_URL}/api/clan/update-settings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, description, joinPolicy, minLevel }),
  })
    .then((r) => r.json())
    .then((data) => {
      if (data.success) {
        window.pushHeaderToast(`✓ Clan settings customized!`, "#2ecc71");
        window.fetchClanData();
        window.saveGame();
      } else {
        window.pushHeaderToast(`❌ ${data.error}`, "#e74c3c");
      }
    })
    .catch(() => {
      window.pushHeaderToast(
        "❌ Network error customizing settings.",
        "#e74c3c",
      );
    });
};

window.executeKickMember = function (targetUserId, targetName) {
  window.showCustomConfirm(
    "Expel Member",
    `Are you sure you want to expel **${targetName}** from the Clan? Their contribution stats will be lost permanently.`,
    "Expel Member",
    "Cancel",
    "#c0392b",
    function () {
      const userId = window.getGameUserId();
      fetch(`${window.GAME_SERVER_URL}/api/clan/kick`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, targetUserId }),
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.success) {
            window.pushHeaderToast(
              `🏃 Expelled member: ${targetName}.`,
              "#e67e22",
            );
            window.fetchClanData();
          } else {
            window.pushHeaderToast(`❌ ${data.error}`, "#e74c3c");
          }
        })
        .catch(() => {
          window.pushHeaderToast(
            "❌ Network error expelling member.",
            "#e74c3c",
          );
        });
    },
  );
};

window.executeUpgradeClanSkill = function (skillKey) {
  if (!window.GAME_SERVER_URL) {
    let currentL = window.playerStats.clanSkills[skillKey] || 0;
    window.playerStats.clanSkills[skillKey] = currentL + 1;
    window.pushHeaderToast(`✓ Research upgraded! (Offline)`, "#2ecc71");
    window.updateUI();
    window.saveGame();
    return;
  }

  const userId = window.getGameUserId();
  fetch(`${window.GAME_SERVER_URL}/api/clan/upgrade-skill`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, skillKey }),
  })
    .then((r) => r.json())
    .then((data) => {
      if (data.success) {
        window.pushHeaderToast(`✓ Research upgraded!`, "#2ecc71");
        if (window.playerStats.clanSkills) {
          window.playerStats.clanSkills[skillKey] =
            (window.playerStats.clanSkills[skillKey] || 0) + 1;
        }
        window.fetchClanData();
        window.updateUI();
        window.saveGame();
      } else {
        window.pushHeaderToast(`❌ ${data.error}`, "#e74c3c");
      }
    })
    .catch(() => {
      let currentL = window.playerStats.clanSkills[skillKey] || 0;
      window.playerStats.clanSkills[skillKey] = currentL + 1;
      window.pushHeaderToast(`✓ Research upgraded! (Offline)`, "#2ecc71");
      window.updateUI();
      window.saveGame();
    });
};

window.executeDisbandClan = function () {
  let modal = document.getElementById("clan-draggable-window");
  let label = window.playerStats.clanName || "Clan";

  window.showCustomConfirm(
    "Leave Clan",
    `Are you sure you want to exit ${label}? If you are the founder and sole member, this action will completely dissolve the Clan. Contribution ranks will be lost.`,
    "Leave Clan",
    "Cancel",
    "#e74c3c",
    function () {
      const userId = window.getGameUserId();
      fetch(`${window.GAME_SERVER_URL}/api/clan/leave`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.success) {
            window.playerStats.clanId = null;
            window.playerStats.clanName = null;
            window.playerStats.clanSkills = {
              steel_phalanx: 0,
              vitality_well: 0,
              prosperity_accord: 0,
              voyagers_guidance: 0,
            };
            window.pushHeaderToast("🏃 You have departed the Clan.", "#7f8c8d");
            if (modal) modal.remove();
            window.hideTooltip();
            window.setPauseState(false);
            window.updateUI();
            window.saveGame();
          } else {
            window.pushHeaderToast(`❌ ${data.error}`, "#e74c3c");
          }
        })
        .catch(() => {
          window.pushHeaderToast("❌ Network error exiting clan.", "#e74c3c");
        });
    },
  );
};

window.executeClanDonate = function (type, amount) {
  const userId = window.getGameUserId();
  let balance = 0;

  if (type === "gold") {
    balance = window.playerStats.coins || 0;
  } else if (type === "souls") {
    balance = window.inventory.ETC["Monster Soul"] || 0;
  } else if (type === "luminous") {
    balance = window.inventory.ETC["Luminous Soul"] || 0;
  }

  if (balance < amount) {
    window.pushHeaderToast("❌ Insufficient funds for donation!", "#e74c3c");
    return;
  }

  // Deduct locally first
  if (type === "gold") {
    window.playerStats.coins -= amount;
    if (window.playerStats.coins === 0) {
      window.playerStats.hasTriggeredExactChange = true;
    }
  } else if (type === "souls") {
    window.inventory.ETC["Monster Soul"] -= amount;
    if (window.inventory.ETC["Monster Soul"] === 0) {
      delete window.inventory.ETC["Monster Soul"];
    }
  } else if (type === "luminous") {
    window.inventory.ETC["Luminous Soul"] -= amount;
    if (window.inventory.ETC["Luminous Soul"] === 0) {
      delete window.inventory.ETC["Luminous Soul"];
    }
  }

  // Hit network endpoint
  fetch(`${window.GAME_SERVER_URL}/api/clan/donate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, type, amount }),
  })
    .then((r) => r.json())
    .then((data) => {
      if (data.success) {
        window.pushHeaderToast(
          `🙏 Contribution Recorded! +${amount.toLocaleString()}`,
          "#2ecc71",
        );
        window.fetchClanData();
        window.updateUI();
        window.saveGame();
      } else {
        // Rollback local deduction
        if (type === "gold") {
          window.playerStats.coins += amount;
        } else if (type === "souls") {
          window.inventory.ETC["Monster Soul"] =
            (window.inventory.ETC["Monster Soul"] || 0) + amount;
        } else if (type === "luminous") {
          window.inventory.ETC["Luminous Soul"] =
            (window.inventory.ETC["Luminous Soul"] || 0) + amount;
        }
        window.pushHeaderToast(`❌ ${data.error}`, "#e74c3c");
      }
    })
    .catch(() => {
      // Keep local change if we want it to work offline, but warn user
      window.pushHeaderToast(`🙏 Contribution Recorded Offline!`, "#2ecc71");
      window.updateUI();
      window.saveGame();
    });
};

window.getWeeklyClanMail = function () {
  // 1. Must be in a clan to receive the crate
  if (!window.playerStats.clanId) return null;

  // 2. Must not have already claimed this week's crate
  if (window.playerStats.weeklyClanCrateClaimed) return null;

  // 3. Ensure we have a valid weekly reset identifier or initialize it
    const ptNow = new Date();
    const dayOfWeek = ptNow.getDay();
    const daysToMonday = (dayOfWeek + 6) % 7;
    const lastMondayDate = new Date(ptNow);
    lastMondayDate.setDate(ptNow.getDate() - daysToMonday);
    const mondayStr = lastMondayDate.toLocaleDateString("en-US");

    if (!window.playerStats.lastWeeklyResetMondayStr) {
      window.playerStats.lastWeeklyResetMondayStr = mondayStr;
      window.saveGame();
    }

    return {
      id: "clan_weekly_mail_" + mondayStr,
    title: "Weekly Clan Supply Crate",
    message: "Your weekly contribution has been processed. Here is your supply crate based on current Clan level.",
    claimed: false,
    rewards: { use: { "Weekly Clan Supply Crate": 1 } }
  };
};