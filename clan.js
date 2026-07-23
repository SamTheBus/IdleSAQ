/* ==========================================================================
   PRIMARY PURPOSE: Manages all Clan/Guild mechanics, database interaction,
   DOM renders, upgrades, and invitations.
   ========================================================================= */

window.clanActiveTab = "OVERVIEW";

// Contextual rank shield icons (Custom Vector SVGs replacing emojis)
window.getRankShieldSvg = function (rank, size = 16) {
  let mainCol = "#7f8c8d";
  let symbolPath = "";
  if (rank === "founder") {
    mainCol = "#ffd700";
    // Founder: Radiant Cross Star
    symbolPath = `<path d="M12,7 L13.5,11.5 L17.5,12 L13.5,12.5 L12,17 L10.5,12.5 L6.5,12 L10.5,11.5 Z" fill="#fff" stroke="#111" stroke-width="0.8"/>`;
  } else if (rank === "officer") {
    mainCol = "#c0392b";
    // Officer: Single Star
    symbolPath = `<polygon points="12,7 13.5,11 17.5,11 14,13.5 15.5,17.5 12,15 8.5,17.5 10,13.5 6.5,11 10.5,11" fill="#fff" stroke="#111" stroke-width="0.8"/>`;
  } else if (rank === "vanguard") {
    mainCol = "#3498db";
    // Vanguard: Concentric targeting reticle
    symbolPath = `<circle cx="12" cy="12" r="4.5" stroke="#fff" stroke-width="1.2" fill="none"/><circle cx="12" cy="12" r="1.5" fill="#fff"/>`;
  } else {
    // Recruit: Basic banner knot
    symbolPath = `<path d="M9,8 H15 V13 L12,11.5 L9,13 Z" fill="#fff" stroke="#111" stroke-width="0.8"/>`;
  }

  return `
    <svg width="${size}" height="${size}" viewBox="0 0 24 24" style="display:inline-block; vertical-align:middle; filter:drop-shadow(0 1px 3px rgba(0,0,0,0.5));">
      <path d="M4,4 Q12,2, 20,4 Q19,14, 12,21 Q5,14, 4,4 Z" fill="${mainCol}" stroke="#111" stroke-width="1.8" stroke-linejoin="round" />
      <path d="M6,6 Q12,4.5, 18,6 L17,14 L12,18 L7,14 Z" fill="rgba(255,255,255,0.06)" />
      ${symbolPath}
    </svg>
  `;
};

window.clanEmblemCache = window.clanEmblemCache || {};

window.getClanEmblemHtml = function (seed, size = 32, clanLevel = 1) {
  let cacheKey = `${seed}_${size}_${clanLevel}`;
  if (window.clanEmblemCache[cacheKey] !== undefined) {
    return window.clanEmblemCache[cacheKey];
  }

  const lvl = Number(clanLevel) || 1;
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

  let pCol = primaryColors[seed % primaryColors.length];
  let sCol = secondaryColors[(seed + 3) % secondaryColors.length];

  // Determine visual complexity standard tier based on Clan Level
  let tier = "novice";
  if (lvl >= 20) tier = "celestial";
  else if (lvl >= 10) tier = "elite";
  else if (lvl >= 5) tier = "sturdy";

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
  ];

  let shape = shapes[seed % shapes.length];
  let symbol = symbols[(seed + 1) % symbols.length];

  let bg = "rgba(170, 170, 170, 0.12)";
  let border = "#444";
  let inlineStyle = "";

  // Render tier additions dynamically to support visual standard growth
  let tierAdditions = "";
  if (tier === "sturdy") {
    border = "#7f8c8d"; // Polished steel
    tierAdditions = `
      <!-- Standard hanging rod -->
      <rect x="2" y="0" width="20" height="1.5" fill="#5c3a21" stroke="#000" stroke-width="0.5" />
      <!-- Lower Tassel -->
      <path d="M10,21 L12,24 L14,21" stroke="#7f8c8d" stroke-width="1" fill="none" />
    `;
  } else if (tier === "elite") {
    border = "#d4af37"; // Polished gold
    inlineStyle = "filter: drop-shadow(0 0 4px rgba(212,175,55,0.45));";
    tierAdditions = `
      <!-- Gold hanging rod with brackets -->
      <rect x="1" y="0" width="22" height="1.8" fill="#d4af37" stroke="#000" stroke-width="0.6" />
      <circle cx="2" cy="0.9" r="1.2" fill="#fff" />
      <circle cx="22" cy="0.9" r="1.2" fill="#fff" />
      <!-- Double pointed tapestry standard tails -->
      <path d="M8,21 L8,24 L12,21 L16,24 L16,21" stroke="#d4af37" stroke-width="1.2" fill="none" />
    `;
  } else if (tier === "celestial") {
    border = "#9b59b6"; // Astral purple
    inlineStyle = "filter: drop-shadow(0 0 6px rgba(155,89,182,0.6));";
    tierAdditions = `
      <!-- Rotating celestial runic lines behind crest -->
      <circle cx="12" cy="12" r="11" fill="none" stroke="#9b59b6" stroke-dasharray="2 1.5" stroke-width="0.8" class="portal-spiral" style="transform-origin: 12px 12px; transform: scale(1.05);" />
      <!-- Triple-pointed royal standard tapestry tail -->
      <path d="M6,21 L6,25 L10,21 L12,26 L14,21 L18,25 L18,21" stroke="#9b59b6" stroke-width="1.5" fill="none" />
      <!-- Miniature space spark particles -->
      <circle cx="6" cy="8" r="0.4" fill="#fff" />
      <circle cx="18" cy="15" r="0.4" fill="#fff" />
      <circle cx="8" cy="16" r="0.4" fill="#fff" />
    `;
  }

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
    ${tierAdditions}
    ${shape}
    ${symbol}
  `;

  const shadowStyle = "inset 0 0 6px rgba(0, 0, 0, 0.6)";
  let result = `
    <span style="
      background: ${bg};
      border: 1px solid ${border};
      border-radius: 4px;
      padding: 4px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: ${size}px;
      height: ${size}px;
      box-shadow: ${shadowStyle};
      ${inlineStyle}
    ">
      <svg viewBox="0 0 24 24" width="100%" height="100%" style="display:block;">
        ${innerHtml}
      </svg>
    </span>
  `;
  window.clanEmblemCache[cacheKey] = result;
  return result;
};

window.toggleClanHall = function () {
  // Allow all ascended players to bypass the level 13 requirement check
  if (
    window.playerStats.level < 13 &&
    (window.playerStats.prestigeCount || 0) === 0
  ) {
    window.pushHeaderToast("🔒 Clan Hall unlocks at Level 13!", "#e74c3c");
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
    win.style.width = "550px";

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
            data.clan.emblem !== undefined
              ? data.clan.emblem
              : data.clan.leader_id.charCodeAt(0) || 0;
          window.playerStats.clanLevel = data.clan.level || 1;
          window.playerStats.clanSkills = {
            steel_phalanx: data.clan.skill_steel_phalanx,
            vitality_well: data.clan.skill_vitality_well,
            prosperity_accord: data.clan.skill_prosperity_accord,
            voyagers_guidance: data.clan.skill_voyagers_guidance,
            aetheric_wisdom: data.clan.skill_aetheric_wisdom || 0,
            clan_supply_depot: data.clan.skill_clan_supply_depot || 0,
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
                                  <div style="display:flex; gap:4px; align-items:center;">
                                      <button class="btn-action" style="padding:2px 8px; font-size:10px; background:#3498db;" onclick="window.inspectClan(${g.id})">Inspect</button>
                                      ${btnHtml}
                                  </div>
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

  let coins = BigNum.from(window.playerStats.coins);
  if (coins.lt(100000)) {
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
        window.playerStats.coins = coins.sub(100000);
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

window.canPlayerInvite = function (clan, myRank) {
  if (myRank === "founder") return true;
  let clanPermissions = window.playerStats.clanPermissions || {
    officer_invite: true,
    vanguard_invite: false,
  };
  if (myRank === "officer" && clanPermissions.officer_invite !== false)
    return true;
  if (myRank === "vanguard" && clanPermissions.vanguard_invite === true)
    return true;
  return false;
};

window.executeClanInvite = function () {
  let input = document.getElementById("clan-invite-name");
  if (!input) return;
  let name = input.value.trim();

  if (!window.validateNameInput(name)) {
    window.pushHeaderToast("❌ Invalid Name format!", "#e74c3c");
    return;
  }

  const userId = window.getGameUserId();
  fetch(`${window.GAME_SERVER_URL}/api/clan/invite`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, charName: name }),
  })
    .then((r) => r.json())
    .then((data) => {
      if (data.success) {
        window.pushHeaderToast(`✉️ Invitation sent to ${name}!`, "#2ecc71");
        input.value = "";
        window.fetchClanData();
      } else {
        window.pushHeaderToast(`❌ ${data.error}`, "#e74c3c");
      }
    })
    .catch(() => {
      window.pushHeaderToast("❌ Network error sending invite.", "#e74c3c");
    });
};

window.renderClanDashboard = function (clan, members, invitations) {
  const contentEl = document.getElementById("clan-win-content");
  if (!contentEl) return;

  // Cache latest database payload to support modular deficit actions
  window.lastFetchedClanData = clan;

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

  // --- INLINE VECTOR HEADER SVGS (NO EMOJIS) ---
  const svgs = {
    overview: `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`,
    members: `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
    quests: `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>`,
    donate: `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/><path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3"/></svg>`,
    research: `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2zM22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>`,
    settings: `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,
  };

  let tabHeaderHtml = `
      <div style="display:grid; grid-template-columns: repeat(6, 1fr); gap:4px; margin-bottom:12px;" class="chiseled-stone-tab-container">
          <button onclick="window.switchClanTab('OVERVIEW')" class="sub-tab-btn clan-chiseled-tab ${currentTab === "OVERVIEW" ? "active" : ""}" style="padding:4px 1px; font-size:8px; display:inline-flex; flex-direction:column; align-items:center; justify-content:center; gap:3px; height:36px; text-transform:uppercase; letter-spacing:0.3px;">
              ${svgs.overview} Overview
          </button>
          <button onclick="window.switchClanTab('MEMBERS')" class="sub-tab-btn clan-chiseled-tab ${currentTab === "MEMBERS" ? "active" : ""}" style="padding:4px 1px; font-size:8px; display:inline-flex; flex-direction:column; align-items:center; justify-content:center; gap:3px; height:36px; text-transform:uppercase; letter-spacing:0.3px;">
              ${svgs.members} Members
          </button>
          <button onclick="window.switchClanTab('QUESTS')" class="sub-tab-btn clan-chiseled-tab ${currentTab === "QUESTS" ? "active" : ""}" style="padding:4px 1px; font-size:8px; display:inline-flex; flex-direction:column; align-items:center; justify-content:center; gap:3px; height:36px; text-transform:uppercase; letter-spacing:0.3px; position:relative;">
              ${svgs.quests} Quests
              ${unclaimedQuestsCount > 0 ? `<span style="position:absolute; top:-1px; right:-1px; width:6px; height:6px; background:#e74c3c; border-radius:50%; box-shadow:0 0 4px #e74c3c;"></span>` : ""}
          </button>
          <button onclick="window.switchClanTab('DONATE')" class="sub-tab-btn clan-chiseled-tab ${currentTab === "DONATE" ? "active" : ""}" style="padding:4px 1px; font-size:8px; display:inline-flex; flex-direction:column; align-items:center; justify-content:center; gap:3px; height:36px; text-transform:uppercase; letter-spacing:0.3px;">
              ${svgs.donate} Vault
          </button>
          <button onclick="window.switchClanTab('RESEARCH')" class="sub-tab-btn clan-chiseled-tab ${currentTab === "RESEARCH" ? "active" : ""}" style="padding:4px 1px; font-size:8px; display:inline-flex; flex-direction:column; align-items:center; justify-content:center; gap:3px; height:36px; text-transform:uppercase; letter-spacing:0.3px;">
              ${svgs.research} Research
          </button>
          <button onclick="window.switchClanTab('SETTINGS')" class="sub-tab-btn clan-chiseled-tab ${currentTab === "SETTINGS" ? "active" : ""}" style="padding:4px 1px; font-size:8px; display:inline-flex; flex-direction:column; align-items:center; justify-content:center; gap:3px; height:36px; text-transform:uppercase; letter-spacing:0.3px;">
              ${svgs.settings} Settings
          </button>
      </div>
    `;

  let tabContentHtml = "";

  if (currentTab === "OVERVIEW") {
    let nextXp = Math.floor(100 * Math.pow(clan.level, 1.8));
    let xpPct = Math.min(100, (clan.xp / nextXp) * 100);
    let emblemSeed =
      clan.emblem !== undefined
        ? clan.emblem
        : clan.leader_id.charCodeAt(0) || 0;
    let emblem = window.getClanEmblemHtml(emblemSeed, 32, clan.level);

    // --- COOPERATIVE CLAN WEEKLY CRATE CLAIMS SEGMENT ---
    let crateSectionHtml = "";
    let lastClaimedWeek =
      (window.playerStats && window.playerStats.lastClaimedCrateWeek) || "";
    let currentWeek = clan.currentWeekId || "";

    // Calculate weekly countdown timer (resets next Monday 12:00 AM Pacific Time)
    let now = Date.now();
    let ptDate = window.getPacificTimeNow
      ? window.getPacificTimeNow(now)
      : new Date();
    let dayOfWeek = ptDate.getDay();
    let daysToMonday = (8 - dayOfWeek) % 7;
    if (daysToMonday === 0) daysToMonday = 7;
    let nextMondayPt = new Date(
      ptDate.getFullYear(),
      ptDate.getMonth(),
      ptDate.getDate() + daysToMonday,
      0,
      0,
      0,
      0,
    );
    let weeklyLeftMs = nextMondayPt.getTime() - ptDate.getTime();

    let wD = Math.floor(weeklyLeftMs / 86400000);
    let wH = Math.floor((weeklyLeftMs % 86400000) / 3600000);
    let wM = Math.floor((weeklyLeftMs % 3600000) / 60000);
    let timerText = `${wD}d ${wH}h ${wM}m remaining`;

    if (lastClaimedWeek === currentWeek) {
      crateSectionHtml = `
                              <div style="background:rgba(0,0,0,0.45); border:1.5px solid #2d3748; border-radius:6px; padding:10px; margin-bottom:12px; text-align:left; display:flex; justify-content:space-between; align-items:center;">
                                <div>
                                  <strong style="color:#7f8c8d; font-size:11px; text-transform:uppercase; letter-spacing:0.5px;">Weekly Clan Crate</strong>
                                  <span style="font-size:9.5px; color:#666; display:block; margin-top:2px;">Crate already claimed for this week. Next refresh in: <b>${timerText}</b></span>
                                </div>
                                <span style="color:#7f8c8d; font-weight:bold; font-size:11px;">Claimed [✓]</span>
                              </div>
                            `;
    } else {
      crateSectionHtml = `
                              <div style="background:rgba(46,204,113,0.03); border:1.5px solid #2ecc71; border-radius:6px; padding:10px; margin-bottom:12px; text-align:left; display:flex; justify-content:space-between; align-items:center; animation: pulseGlow 1.8s infinite;">
                                <div>
                                  <strong style="color:#2ecc71; font-size:11.5px; text-transform:uppercase; letter-spacing:0.5px;">Weekly Clan Crate Ready!</strong>
                                  <span style="font-size:9.5px; color:#fff; display:block; margin-top:2px;">Your weekly clan supplies are waiting. Refresh in: <b>${timerText}</b></span>
                                </div>
                                <button class="btn-action btn-pulse-teal" style="background:#2ecc71; color:#fff; font-size:11px; padding:6px 12px;" onclick="window.claimWeeklyClanCrate(event)">Claim Crate</button>
                              </div>
                            `;
    }

    // Guild Hearth Vectors (Flame changes color based on Level thresholds)
    let hearthGlow = "#ff5500";
    let hearthLabel = "Warm Embers";
    if (clan.level >= 30) {
      hearthGlow = "#00d2ff";
      hearthLabel = "Celestial Portal Flame";
    } else if (clan.level >= 20) {
      hearthGlow = "#9b59b6";
      hearthLabel = "Arcane Void Hearth";
    } else if (clan.level >= 10) {
      hearthGlow = "#ffd700";
      hearthLabel = "Vibrant Sunfire Hearth";
    }

    let pulseDuration = Math.max(0.5, 3.2 - clan.level * 0.08) + "s";
    let hearthSvg = `
              <svg width="100%" height="75" viewBox="0 0 200 75" style="display:block; margin: 8px auto; overflow:visible; --hearth-glow-color:${hearthGlow};">
                <ellipse cx="100" cy="62" rx="42" ry="10" fill="none" stroke="#2d3748" stroke-width="1.2" stroke-dasharray="3 3.5" class="portal-spiral" style="transform-origin: 100px 62px; animation: portalSpiralRotate 7s linear infinite;" />
                <ellipse cx="100" cy="62" rx="28" ry="6.5" fill="rgba(0,0,0,0.4)" stroke="#4a5568" stroke-width="1.5" />
                <polygon points="86,58 114,58 109,24 91,14" fill="#2d3748" stroke="#1a202c" stroke-width="2.2" />
                <path d="M 96,24 L 104,24 M 95,33 L 100,38 L 105,33 M 96,48 L 104,48" fill="none" stroke="${hearthGlow}" stroke-width="2.2" stroke-linecap="round" style="animation: runicHearthPulse ${pulseDuration} ease-in-out infinite;" />
                <line x1="87" y1="50" x2="113" y2="50" stroke="#d4af37" stroke-width="1.2" />
              </svg>
            `;

    let logs = clan.activity_log || [
      "No active records available in treasury catalogs.",
    ];
    let ledgerHtml = logs
      .slice()
      .reverse()
      .map(
        (log) => `
              <div style="font-family:monospace; font-size:10px; color:#c8b195; border-bottom:1px solid #1a202c; padding:5px 0; display:flex; justify-content:space-between; gap:10px; text-align:left;">
                <span style="flex:1; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">✦ ${window.escapeHTML(log)}</span>
                <span style="color:#4a5568; font-size:8px; font-weight:bold;">LOG</span>
              </div>
            `,
      )
      .join("");

    tabContentHtml = `
              <div class="clan-scroll-frame">
                  <!-- Dangling Crest Tapestry Frame -->
                  <div style="background:rgba(0,0,0,0.5); border: 2px solid #5c4033; border-top-width:6px; border-bottom-width:4px; border-radius:8px; padding:12px; margin-bottom:12px; display:flex; align-items:center; gap:12px; text-align:left; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.7); position:relative;">
                      ${emblem}
                      <div style="flex:1; min-width:0;">
                          <strong style="font-size:14.5px; color:#df9ffb; text-shadow: 0 0 8px rgba(155,89,182,0.4);">${window.escapeHTML(clan.name)}</strong>
                          <div style="font-size:10.5px; color:#aaa; font-family:monospace;">Clan Level ${clan.level} (${clan.xp}/${nextXp} XP)</div>
                          <div style="width:100%; height:5px; background:#0f1115; border-radius:3px; overflow:hidden; border:1px solid #222; margin-top:6px;">
                              <div style="width:${xpPct}%; height:100%; background:linear-gradient(90deg, #9b59b6, #e84393); box-shadow:0 0 6px #9b59b6;"></div>
                          </div>
                      </div>
                  </div>

                  <div style="display:grid; grid-template-columns: 1.15fr 0.85fr; gap:12px; margin-bottom:12px;">
                      <div style="display:flex; flex-direction:column; gap:10px; min-width:0;">
                          <div style="background:#0c0f12; border:1px solid #222; border-radius:6px; padding:8px 10px; font-size:11px; text-align:left; line-height:1.45; color:#c8b195; font-style:italic;">
                              <span style="color:#7f8c8d; font-size:8px; font-weight:bold; display:block; margin-bottom:2px; text-transform:uppercase; font-style:normal;">✦ ANNOUNCEMENT:</span>
                              "${window.escapeHTML(clan.description || "Founders are preparing instructions.")}"
                          </div>

                          <div style="background:#090b0e; border:1px solid #222; border-radius:6px; padding:8px 10px; display:flex; flex-direction:column; justify-content:flex-start; min-height:115px;">
                              <span style="color:#9b59b6; font-size:8.5px; font-weight:bold; display:block; margin-bottom:4px; text-transform:uppercase; text-align:left;">✦ CLAN LEDGER FEED:</span>
                              <div style="overflow-y:auto; max-height:85px; padding-right:4px;">
                                  ${ledgerHtml}
                              </div>
                          </div>
                      </div>

                      <!-- Guild Hearth Panel -->
                      <div class="chiseled-stone-panel" style="display:flex; flex-direction:column; align-items:center; justify-content:center;">
                          <span style="color:#df9ffb; font-size:8.5px; font-weight:bold; display:block; text-transform:uppercase; letter-spacing:0.5px;">✦ ${hearthLabel}</span>
                          ${hearthSvg}
                          <span style="font-size:8.5px; color:#555; font-family:monospace; margin-top:2px;">Runic Intensity: Lv. ${clan.level}</span>
                      </div>
                  </div>

                  <!-- Crate claims trigger injected right above Vault assets -->
                  ${crateSectionHtml}

                  <!-- Mini Vault Overview -->
                  <div style="background:rgba(0,0,0,0.55); border:1.5px solid #2d3748; border-radius:6px; padding:10px; margin-bottom:12px; text-align:left; box-shadow: inset 0 0 10px #000;">
                      <div style="color:#f1c40f; font-weight:bold; border-bottom:1px dashed #222; padding-bottom:4px; margin-bottom:6px; text-transform:uppercase; letter-spacing:0.5px; font-family:monospace; font-size:10px;">✦ Shared Vault Assets:</div>
                      <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:6px; text-align:center; font-family:monospace; font-size:11px;">
                          <div style="background:#0f1115; padding:8px; border-radius:4px; border:1px solid #222;"><span style="color:#888; font-size:8.5px; display:block; margin-bottom:4px;">GOLD</span><strong style="color:#f1c40f; display:block;">${window.formatNumber(clan.gold_bank)}</strong></div>
                          <div style="background:#0f1115; padding:8px; border-radius:4px; border:1px solid #222;"><span style="color:#888; font-size:8.5px; display:block; margin-bottom:4px;">SOULS</span><strong style="color:#ffb6c1; display:block;">${window.formatNumber(clan.souls_bank)}</strong></div>
                          <div style="background:#0f1115; padding:8px; border-radius:4px; border:1px solid #222;"><span style="color:#888; font-size:8.5px; display:block; margin-bottom:4px;">LUMINOUS</span><strong style="color:#ffb6c1; display:block;">${window.formatNumber(clan.luminous_bank)}</strong></div>
                      </div>
                  </div>
              </div>
            `;
  } else if (currentTab === "MEMBERS") {
    // Segregate members list into structured rank groupings
    let groups = { founder: [], officer: [], vanguard: [], recruit: [] };
    members.forEach((m) => {
      let r = m.clan_rank || "recruit";
      if (groups[r]) groups[r].push(m);
      else groups["recruit"].push(m);
    });

    let groupLabels = {
      founder: "Founder ✦",
      officer: "Officers ★",
      vanguard: "Vanguard ⌖",
      recruit: "Recruits ⚑",
    };

    let myMember = members.find((x) => (x.userId || x.user_id) === userId);
    let myRank = myMember ? myMember.clan_rank : "recruit";
    let inviteFormHtml = "";

    if (window.canPlayerInvite(clan, myRank)) {
      inviteFormHtml = `
          <div style="border: 1px solid #3498db; border-radius: 6px; padding: 10px; background: rgba(52, 152, 219, 0.05); margin-bottom: 12px; text-align:left;">
              <strong style="color:#60a5fa; font-size:11.5px; display:flex; align-items:center; gap:6px; margin-bottom:6px;">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="16" y1="11" x2="22" y2="11"/></svg>
                  Invite Player to Clan:
              </strong>
              <div style="display:flex; gap:6px;">
                  <input type="text" id="clan-invite-name" placeholder="Character Name" maxlength="14" style="flex:1; background:#111; color:#fff; border:1px solid #444; padding:4px; font-size:11px; border-radius:4px;">
                  <button class="btn-action" style="background:#3498db; color:#fff;" onclick="window.executeClanInvite()">Send Invite</button>
              </div>
          </div>
        `;
    }

    // Construct the Weekly Contribution Leaderboard Top 3 podiums
    let sortedContrib = [...members].sort((a, b) => {
      let contribA =
        a.weekly_contribution || a.weekly_renown || a.weeklyContribution || 0;
      let contribB =
        b.weekly_contribution || b.weekly_renown || b.weeklyContribution || 0;
      return contribB - contribA;
    });
    let leaderboardHtml = "";
    if (sortedContrib.length > 0) {
      let podiumMarkers = ["✦", "★", "⌖"];
      let podiumColors = ["#ffd700", "#bdc3c7", "#e67e22"];

      leaderboardHtml = `
            <div class="chiseled-stone-panel" style="margin-bottom:12px; padding:10px; border-color:#9b59b650;">
                <div style="font-size:10px; font-weight:bold; color:#df9ffb; text-transform:uppercase; letter-spacing:1.5px; text-align:center; border-bottom:1px solid #4a154b; padding-bottom:4px; margin-bottom:8px; display:flex; align-items:center; justify-content:center; gap:4px;">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                    Weekly Contribution Leaderboard
                </div>
                <div style="display:flex; flex-direction:column; gap:4px;">
          `;

      sortedContrib.slice(0, 5).forEach((m, idx) => {
        let mId = m.userId || m.user_id;
        let nameCol = mId === userId ? "#ffd700" : "#fff";
        let rankLabel =
          idx < 3
            ? `<strong style="color:${podiumColors[idx]}; font-family:monospace; margin-right:4px;">${podiumMarkers[idx]}</strong>`
            : `<span style="color:#aaa; font-family:monospace; margin-right:4px;">#${idx + 1}</span>`;
        let contributionVal =
          m.weekly_contribution || m.weekly_renown || m.weeklyContribution || 0;
        leaderboardHtml += `
                    <div style="display:flex; justify-content:space-between; align-items:center; font-family:monospace; font-size:10px; background:rgba(0,0,0,0.3); padding:4px 8px; border-radius:4px; border:1px solid #222;">
                      <span style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap; max-width:180px; text-align:left;">
                          ${rankLabel} <strong style="color:${nameCol};">${window.escapeHTML(m.name)}</strong>
                      </span>
                      <span style="color:#2ecc71; font-weight:bold;">+${contributionVal.toLocaleString()} Renown</span>
                    </div>
                  `;
      });

      leaderboardHtml += `</div></div>`;
    }

    // Process Roster Group headers
    let rosterHtml = "";
    ["founder", "officer", "vanguard", "recruit"].forEach((rKey) => {
      let rMembers = groups[rKey];
      if (rMembers.length === 0) return;

      let sectionHeader = `
            <div style="font-size:10px; font-weight:bold; color:#7f8c8d; text-transform:uppercase; letter-spacing:1px; margin-top:12px; margin-bottom:6px; border-bottom:1.5px solid #2d3748; padding-bottom:3px; display:flex; justify-content:space-between; align-items:center;">
              <span>${groupLabels[rKey]} [${rMembers.length}]</span>
            </div>
          `;

      let cardsHtml = rMembers
        .map((m) => {
          let mId = m.userId || m.user_id;
          let isLeaderRow = mId === clan.leader_id;
          let isMe = mId === userId;
          let canvasId = `clan-member-canvas-${mId}`;

          let titleTextHtml = "";
          if (m.equippedTitle && window.TITLES_DATA[m.equippedTitle]) {
            let tData = window.TITLES_DATA[m.equippedTitle];
            titleTextHtml = `<span style="color:${tData.color || "#ff007f"}; font-size:8px; font-weight:bold; margin-left:4px;">[${tData.name}]</span>`;
          }

          // Inline admin choices dropdown selector
          let adminSelectHtml = "";
          let clanPermissions = window.playerStats.clanPermissions || {
            officer_kick: true,
            officer_vault: true,
          };

          if (isLeader && !isMe) {
            adminSelectHtml = `
                <select class="rank-action-select" onchange="window.handleInlineAdminAction(this, '${mId}', '${window.escapeHTML(m.name)}')">
                  <option value="">Actions...</option>
                  ${m.clan_rank === "recruit" ? `<option value="promote">Promote to Vanguard</option>` : ""}
                  ${m.clan_rank === "vanguard" ? `<option value="promote">Promote to Officer</option><option value="demote">Demote to Recruit</option>` : ""}
                  ${m.clan_rank === "officer" ? `<option value="demote">Demote to Vanguard</option>` : ""}
                  <option value="founder">Transfer Ownership</option>
                  <option value="kick">Expel Member</option>
                </select>
              `;
          } else if (isLeader && isMe) {
            adminSelectHtml = `<span style="font-size:8px; color:#f1c40f; font-weight:bold; font-family:monospace;">Leader</span>`;
          } else if (clan.leader_id !== userId && isLeaderRow) {
            adminSelectHtml = `<span style="font-size:8px; color:#f1c40f; font-weight:bold; font-family:monospace;">Founder</span>`;
          } else if (clan.leader_id !== userId && !isLeaderRow && !isMe) {
            // Check if viewer is Officer and target is a Recruit/Vanguard
            let myRankRes = members.find(
              (x) => (x.userId || x.user_id) === userId,
            );
            let myRank = myRankRes ? myRankRes.clan_rank : "recruit";
            let canOfficerKick = clanPermissions.officer_kick !== false;

            if (
              myRank === "officer" &&
              canOfficerKick &&
              (m.clan_rank === "recruit" || m.clan_rank === "vanguard")
            ) {
              adminSelectHtml = `
                  <select class="rank-action-select" onchange="window.handleInlineAdminAction(this, '${mId}', '${window.escapeHTML(m.name)}')">
                    <option value="">Actions...</option>
                    ${m.clan_rank === "recruit" ? `<option value="promote">Promote to Vanguard</option>` : ""}
                    ${m.clan_rank === "vanguard" ? `<option value="demote">Demote to Recruit</option>` : ""}
                    <option value="kick">Expel Member</option>
                  </select>
                `;
            }
          }

          let weeklyRenownVal =
            m.weekly_contribution ||
            m.weekly_renown ||
            m.weeklyContribution ||
            0;
          let clanContributionVal =
            m.clanContribution || m.clan_contribution || 0;

          return `
              <div style="background:#111; border:1px solid #222; border-radius:6px; padding:6px 10px; display:flex; justify-content:space-between; align-items:center; gap:8px;">
                  <div style="display:flex; align-items:center; gap:8px; min-width:0; flex:1; text-align:left;">
                      <div style="position:relative; flex-shrink:0;">
                        <canvas id="${canvasId}" width="30" height="40" style="width:30px; height:40px; background:rgba(0,0,0,0.4); border:1px solid #333; border-radius:4px; display:block; pointer-events:none;"></canvas>
                        <div style="position:absolute; bottom:-3px; right:-3px; z-index:4;">${window.getRankShieldSvg(m.clan_rank || "recruit", 14)}</div>
                      </div>
                      <div style="min-width:0; flex:1;">
                          <div style="display:flex; align-items:center; flex-wrap:wrap; line-height:1.1;">
                              <strong style="font-size:11.5px; color:${isMe ? "#f1c40f" : "#fff"}; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; max-width:110px;">${window.escapeHTML(m.name)}</strong>
                              ${titleTextHtml}
                          </div>
                          <span style="font-size:9px; color:#aaa; font-family:monospace; display:block; margin-top:2px;">Lv. ${m.level} • Peak Stg ${m.lifetimePeakStage} • Weekly Renown: <span style="color:#2ecc71; font-weight:bold;">${weeklyRenownVal.toLocaleString()}</span></span>
                          <span style="font-size:8px; color:#7f8c8d; font-family:monospace;">Contribution: ${window.formatNumber(clanContributionVal)}</span>
                      </div>
                  </div>
                  <div style="display:flex; align-items:center; gap:4px;">
                      <button class="btn-action" style="background:#3498db; font-size:9.5px; padding:3px 6px; height:24px; line-height:1;" onclick="window.inspectPlayer('${mId}')">Inspect</button>
                      ${adminSelectHtml}
                  </div>
              </div>
            `;
        })
        .join("");

      rosterHtml +=
        sectionHeader +
        `<div style="display:flex; flex-direction:column; gap:4px;">${cardsHtml}</div>`;
    });

    tabContentHtml = `
                  ${inviteFormHtml}
                  ${leaderboardHtml}
                  <div style="display:flex; flex-direction:column; gap:4px;">
                      ${rosterHtml}
                  </div>
                `;

    setTimeout(() => {
      members.forEach((m) => {
        let mId = m.userId || m.user_id;
        let canvas = document.getElementById(`clan-member-canvas-${mId}`);
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
      let peakLvl =
        window.playerStats.lifetimePeakStage || window.playerStats.stage || 1;
      let effStage = window.getEffectiveStage(peakLvl);
      let growthRate = 1.045 + (effStage * 0.04) / (effStage + 200);
      let scaleVal = Math.pow(growthRate, effStage);

      // Define inline micro vector icons to completely eradicate emojis
      const keyIcon =
        '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="display:inline-block; vertical-align:middle; margin-right:3px; transform:translateY(-1px);"><circle cx="7.5" cy="15.5" r="5.5"/><path d="M12 11l9-9M16 4h4v4h-2V6"/></svg>';
      const coreIcon =
        '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="display:inline-block; vertical-align:middle; margin-right:3px; transform:translateY(-1px);"><rect x="4" y="4" width="16" height="16" rx="2"/><circle cx="12" cy="12" r="4"/></svg>';
      const essenceIcon =
        '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="display:inline-block; vertical-align:middle; margin-right:3px; transform:translateY(-1px);"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-5.82 2.15L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>';
      const shardIcon =
        '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="display:inline-block; vertical-align:middle; margin-right:3px; transform:translateY(-1px);"><polygon points="12 2 22 12 12 22 2 12"/></svg>';
      const soulIcon =
        '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="display:inline-block; vertical-align:middle; margin-right:3px; transform:translateY(-1px);"><path d="M12 2c-.5 5-4 8-8 8 4 0 7.5 3 8 8 .5-5 4-8 8-8-4 0-7.5-3-8-8z"/></svg>';
      const ppIcon =
        '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="display:inline-block; vertical-align:middle; margin-right:3px; transform:translateY(-1px);"><polygon points="12 2 15 8.5 22 9 17 14 18.5 21 12 17.5 5.5 21 7 14 2 9 9 8.5"/></svg>';
      const sackIcon =
        '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="display:inline-block; vertical-align:middle; margin-right:3px; transform:translateY(-1px);"><path d="M6 18c0-4 4-6 6-6s6 2 6 6M12 2a4 4 0 0 0-4 4v6M12 12h.01"/></svg>';
      const goldIcon =
        '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="display:inline-block; vertical-align:middle; margin-right:3px; transform:translateY(-1px);"><circle cx="12" cy="12" r="10"/><path d="M12 6v12M9 10h6"/></svg>';

      listHtml = questsData.activeList
        .map((q) => {
          let pct = Math.min(100, (q.current / q.target) * 100);
          let hasClaimed =
            q.claimedUserIds && q.claimedUserIds.includes(userId);

          let claimBtnHtml = "";
          if (hasClaimed) {
            claimBtnHtml = `<span style="color:#7f8c8d; font-size:10px; font-weight:bold;">Claimed ✓</span>`;
          } else if (q.completed) {
            // Completed quests pulse with an overlay trigger
            claimBtnHtml = `<button class="btn-action btn-pulse-teal" style="padding:4px 10px; font-size:10px;" onclick="window.executeClaimClanQuestReward('${q.id}')">Claim</button>`;
          } else {
            claimBtnHtml = `<span style="color:#fff; font-size:10.5px; font-family:monospace; font-weight:bold; background:rgba(0,0,0,0.45); border: 1.5px solid #5c4033; padding:3px 8px; border-radius:4px;">${q.current.toLocaleString()} / ${q.target.toLocaleString()}</span>`;
          }

          let rewardItems = [];
          if (q.rewards.keys > 0)
            rewardItems.push(
              `<span style="color:#5c4033; font-weight:bold; display:inline-flex; align-items:center; gap:3px;">${keyIcon}+${q.rewards.keys} Keys</span>`,
            );
          if (q.rewards.cores > 0)
            rewardItems.push(
              `<span style="color:#5c4033; font-weight:bold; display:inline-flex; align-items:center; gap:3px;">${coreIcon}+${q.rewards.cores} Cores</span>`,
            );
          if (q.rewards.essence > 0)
            rewardItems.push(
              `<span style="color:#5c4033; font-weight:bold; display:inline-flex; align-items:center; gap:3px;">${essenceIcon}+${q.rewards.essence} Essence</span>`,
            );
          if (q.rewards.shards > 0)
            rewardItems.push(
              `<span style="color:#5c4033; font-weight:bold; display:inline-flex; align-items:center; gap:3px;">${shardIcon}+${q.rewards.shards} Shards</span>`,
            );
          if (q.rewards.souls > 0)
            rewardItems.push(
              `<span style="color:#5c4033; font-weight:bold; display:inline-flex; align-items:center; gap:3px;">${soulIcon}+${q.rewards.souls} Souls</span>`,
            );
          if (q.rewards.pp > 0)
            rewardItems.push(
              `<span style="color:#5c4033; font-weight:bold; display:inline-flex; align-items:center; gap:3px;">${ppIcon}+${q.rewards.pp} PP</span>`,
            );
          if (q.rewards.sacks > 0)
            rewardItems.push(
              `<span style="color:#5c4033; font-weight:bold; display:inline-flex; align-items:center; gap:3px;">${sackIcon}+${q.rewards.sacks}x Clan Sack</span>`,
            );

          if (q.rewards.goldBase > 0) {
            // Normalize the server-provided goldBase and scale with campaign progress curve
            let baseRatio = (q.rewards.goldBase || 150000) / 150000;
            let actualGoldReward = Math.ceil(scaleVal * 1200 * baseRatio);
            rewardItems.push(
              `<span style="color:#5c4033; font-weight:bold; display:inline-flex; align-items:center; gap:3px;">${goldIcon}+${window.formatNumber(actualGoldReward)} Gold</span>`,
            );
          }

          // Completed bounty cards receive a 3D Wax Seal Stamp overlay!
          let completedOverlay = q.completed
            ? `
                <div class="wax-seal-stamp" style="--final-rot:-15deg;">
                    <div class="wax-seal-inner">
                        <span style="color:#fff; font-size:8px; font-family:sans-serif; font-weight:900; letter-spacing:0.5px;">DONE</span>
                    </div>
                </div>`
            : "";

          let completedButUnclaimed = q.completed && !hasClaimed;
          let cardClass = "clan-bounty-card";
          let particleOverlayHtml = "";
          if (completedButUnclaimed) {
            cardClass += " claim-pulse-aura";
            particleOverlayHtml = `<div class="quest-particle-overlay"></div>`;
          }

          return `
            <div class="${cardClass}" style="border: 2.2px solid ${q.completed ? "#1e824c" : "#5c4033"}; padding: 12px; margin-bottom: 8px;">
                ${completedOverlay}
                ${particleOverlayHtml}
                <div style="position: relative; z-index: 2;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px; gap:8px;">
                        <strong style="font-size:12.5px; font-family:sans-serif; text-transform:uppercase; letter-spacing:0.5px;">${q.label}</strong>
                        ${claimBtnHtml}
                    </div>
                    <p style="font-size:10px; margin:0 0 8px 0; line-height:1.35; white-space:normal;">${q.desc}</p>

                    <div style="background:rgba(255, 255, 255, 0.22); border:1.2px solid #5c4033; border-radius:4px; padding:6px; font-size:9.5px; margin-bottom:8px; display:flex; flex-wrap:wrap; gap:4px 8px; font-family:monospace; line-height:1.2;">
                        <div style="width:100%; color:#5c4033; font-weight:bold; margin-bottom:2px; display:inline-flex; align-items:center; gap:4px;">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="display:inline-block; vertical-align:middle; transform:translateY(-0.5px);"><rect x="3" y="8" width="18" height="13" rx="2"/><path d="M12 2v6M7 5h10"/></svg>
                            QUEST REWARDS:
                        </div>
                        <div style="color:#5c4033; font-weight:bold; display:inline-flex; align-items:center; gap:3px;">
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="display:inline-block; vertical-align:middle; transform:translateY(-1px);"><polygon points="12 2 15 8.5 22 9 17 14 18.5 21 12 17.5 5.5 21 7 14 2 9 9 8.5"/></svg>
                            +${q.xpReward} Clan XP
                        </div>
                        ${rewardItems.map((item) => `<div>${item}</div>`).join("")}
                    </div>

                    <!-- Styled progress line -->
                    <div style="width:100%; height:5px; background:rgba(0,0,0,0.15); border-radius:3px; overflow:hidden; border:1px solid #5c4033; margin-top:2px;">
                        <div style="width:${pct}%; height:100%; background:${q.completed ? "#1e824c" : "#8a6d3b"};"></div>
                    </div>
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
                                      Cooperate with your Clan to achieve these weekly active goals. Each completed quest yields massive rewards like **Gacha Keys, Catalyst Cores, Astral Essence, Eridium Shards, or PP** for every single member!
                                  </div>
                                  <div style="display:flex; flex-direction:column; gap:6px;">
                                      ${listHtml}
                                  </div>
                                `;
  } else if (currentTab === "DONATE") {
    let personalCP = 0;
    let meMember = members.find((x) => (x.userId || x.user_id) === userId);
    if (meMember) {
      personalCP =
        meMember.weekly_contribution ||
        meMember.weekly_renown ||
        meMember.weeklyContribution ||
        0;
    }

    // Track weekly cooperative points to render Cooperative Vault Chest Bar (Scaled up 25x)
    let vaultPoints = clan.vault_points || 0;
    let currentChestTier = "common";
    if (vaultPoints >= 750000) currentChestTier = "mythic";
    else if (vaultPoints >= 300000) currentChestTier = "legendary";
    else if (vaultPoints >= 120000) currentChestTier = "epic";
    else if (vaultPoints >= 50000) currentChestTier = "magic";
    else if (vaultPoints >= 15000) currentChestTier = "rare";

    // Progress percentage mapping
    let maxThreshold = 750000;
    let chestPct = Math.min(100, (vaultPoints / maxThreshold) * 100);

    let nextThresholdLabel = "";
    let nextThresholdVal = 0;
    if (currentChestTier === "common") {
      nextThresholdLabel = "Rare";
      nextThresholdVal = 15000;
    } else if (currentChestTier === "rare") {
      nextThresholdLabel = "Magic";
      nextThresholdVal = 50000;
    } else if (currentChestTier === "magic") {
      nextThresholdLabel = "Epic";
      nextThresholdVal = 120000;
    } else if (currentChestTier === "epic") {
      nextThresholdLabel = "Legendary";
      nextThresholdVal = 300000;
    } else if (currentChestTier === "legendary") {
      nextThresholdLabel = "Mythic";
      nextThresholdVal = 750000;
    } else {
      nextThresholdLabel = "Maxed";
      nextThresholdVal = 750000;
    }

    tabContentHtml = `
                  <!-- Cooperative Vault Chest Progression Card -->
                  <div class="chiseled-stone-panel" style="margin-bottom:12px; padding:12px; border-color:#d4af3780;">
                      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                          <strong style="color:#ffd700; font-size:12px; display:inline-flex; align-items:center; gap:4px; text-transform:uppercase;">
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M12 2v5M17 5H7"/></svg>
                              Cooperative Vault Chest
                          </strong>
                          <span style="font-family:monospace; font-size:10px; color:#ffd700; background:rgba(241,196,15,0.08); padding:2px 6px; border-radius:3px; border:1px solid rgba(241,196,15,0.3); font-weight:bold;">
                              ${currentChestTier.toUpperCase()} CHEST
                          </span>
                      </div>
                      <div style="font-size:10.5px; color:#aaa; line-height:1.45; text-align:left; margin-bottom:8px;">
                          Weekly Group Score: <strong style="color:#fff;">${vaultPoints.toLocaleString()} / 750,000</strong>. Resets every Monday. All active members who contributed at least <strong style="color:#2ecc71;">100 Renown</strong> will receive a Vault reward sack!
                      </div>

                      <!-- Progress track -->
                      <div class="cooperative-vault-track">
                          <!-- Threshold marker notches at 15,000 (2.0%), 50,000 (6.6%), 120,000 (16%), 300,000 (40%) -->
                          <div class="vault-threshold-marker" style="left:2%;"></div>
                          <div class="vault-threshold-marker" style="left:6.6%;"></div>
                          <div class="vault-threshold-marker" style="left:16%;"></div>
                          <div class="vault-threshold-marker" style="left:40%;"></div>
                          <div class="cooperative-vault-fill ${currentChestTier}" style="width: ${chestPct}%;"></div>
                      </div>
                      <div style="display:flex; justify-content:space-between; font-size:9px; color:#888; margin-top:4px; font-family:monospace; line-height:1;">
                          <span>Current: ${currentChestTier.toUpperCase()}</span>
                          <span>Next Milestone: <strong style="color:#ffd700;">${nextThresholdLabel} (${vaultPoints.toLocaleString()}/${nextThresholdVal.toLocaleString()})</strong></span>
                      </div>

                      <div style="margin-top:10px; background:rgba(0,0,0,0.4); border:1px solid #222; padding:6px; border-radius:4px; text-align:left; font-size:10px; line-height:1.35;">
                          👤 <strong style="color:#2ecc71;">YOUR INVOLVEMENT:</strong><br>
                          You have contributed <strong style="color:#fff;">${personalCP.toLocaleString()} Renown</strong> this week.<br>
                          Status: ${personalCP >= 100 ? `<span style="color:#2ecc71; font-weight:bold;">QUALIFIED ✓ (Weekly rewards active!)</span>` : `<span style="color:#e74c3c; font-weight:bold;">INELIGIBLE ✗ (Requires 100 Renown. Contribute to Research upgrades or fund the Aetheric Hearth to qualify!)</span>`}
                      </div>
                  </div>

                  <!-- Shared Vault Treasury Bank -->
                  <div style="background:rgba(0,0,0,0.55); border:1.5px solid #2d3748; border-radius:8px; padding:12px; box-shadow: inset 0 0 10px #000; text-align:left;">
                      <div style="color:#f1c40f; font-weight:bold; border-bottom:1px dashed #222; padding-bottom:6px; margin-bottom:10px; text-transform:uppercase; letter-spacing:0.5px; font-family:monospace; font-size:11px; display:flex; align-items:center; gap:6px;">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="9" y1="9" x2="15" y2="9"/><line x1="9" y1="13" x2="15" y2="13"/></svg>
                        Shared Vault Treasury Assets
                      </div>
                      <div style="font-size:10px; color:#aaa; line-height:1.45; margin-bottom:10px; white-space:normal;">
                        This represents the shared resources accumulated from auto-tithes (vault taxes set by the leader). Officers and Leaders can allocate these assets directly to fund and upgrade research card tiers.
                      </div>
                      <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:6px; text-align:center; font-family:monospace; font-size:11px;">
                          <div style="background:#0f1115; padding:8px; border-radius:4px; border:1px solid #222;"><span style="color:#888; font-size:8.5px; display:block; margin-bottom:4px;">GOLD</span><strong style="color:#f1c40f; display:block;">${window.formatNumber(clan.gold_bank)}</strong></div>
                          <div style="background:#0f1115; padding:8px; border-radius:4px; border:1px solid #222;"><span style="color:#888; font-size:8.5px; display:block; margin-bottom:4px;">SOULS</span><strong style="color:#ffb6c1; display:block;">${window.formatNumber(clan.souls_bank)}</strong></div>
                          <div style="background:#0f1115; padding:8px; border-radius:4px; border:1px solid #222;"><span style="color:#888; font-size:8.5px; display:block; margin-bottom:4px;">LUMINOUS</span><strong style="color:#ffb6c1; display:block;">${window.formatNumber(clan.luminous_bank)}</strong></div>
                      </div>
                  </div>
                `;
  } else if (currentTab === "SETTINGS") {
    let isJoinOpen = clan.join_policy === "open";
    let activeEmblemSeed =
      clan.emblem !== undefined
        ? clan.emblem
        : clan.leader_id.charCodeAt(0) || 0;
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
                    <div style="display:flex; flex-direction:column; gap:8px; text-align:left;">
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

                        <!-- Emblem Customizer & Tithe Rate -->
                                                <div style="display:grid; grid-template-columns: 1fr 1.3fr; gap:6px; background:#111; border:1px solid #222; padding:8px; border-radius:6px; align-items:center;">
                                                    <div style="display:flex; align-items:center; gap:8px;">
                                                        <div id="settings-emblem-live-indicator" style="flex-shrink:0;">
                                                            ${window.getClanEmblemHtml(activeEmblemSeed, 32, clan.level)}
                                                        </div>
                                                        <div style="flex:1;">
                                                            <label for="settings-clan-emblem" style="font-size:10px; font-weight:bold; color:#f1c40f; display:block; margin-bottom:4px; text-transform:uppercase;">Emblem Pattern:</label>
                                                            <div style="display:flex; align-items:center; gap:6px;">
                                                                <input type="range" id="settings-clan-emblem" min="0" max="100" value="${activeEmblemSeed}" style="flex:1; height:4px; accent-color:#f1c40f; cursor:pointer;" oninput="window.previewClanEmblem(this.value, ${clan.level})">
                                                                <span id="settings-emblem-preview-val" style="font-family:monospace; font-size:10px; width:22px; text-align:right;">${activeEmblemSeed}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label for="settings-clan-tithe" style="font-size:10px; font-weight:bold; color:#f1c40f; display:block; margin-bottom:4px; text-transform:uppercase;">Auto-Tithe (Vault Tax):</label>
                                                        <select id="settings-clan-tithe" style="width:100%; background:#07030b; color:#fff; border:1px solid #444; border-radius:4px; padding:4px; font-size:10.5px;">
                                                            <option value="0" ${clan.tithe_rate === 0 ? "selected" : ""}>0% (Disabled)</option>
                                                            <option value="1" ${clan.tithe_rate === 1 ? "selected" : ""}>1% Auto-Tax</option>
                                                            <option value="2" ${clan.tithe_rate === 2 ? "selected" : ""}>2% Auto-Tax</option>
                                                            <option value="3" ${clan.tithe_rate === 3 ? "selected" : ""}>3% Auto-Tax</option>
                                                            <option value="5" ${clan.tithe_rate === 5 ? "selected" : ""}>5% Auto-Tax (Max)</option>
                                                        </select>
                                                    </div>
                                                </div>

                                                <!-- Rank Authority Matrix -->
                                                <div style="background:#111; border:1px solid #222; padding:10px; border-radius:6px; text-align:left; margin-bottom:8px;">
                                                    <strong style="color:#ffd700; font-size:10px; display:block; margin-bottom:4px; text-transform:uppercase; letter-spacing:0.5px;">⚔️ Rank Authority Matrix</strong>
                                                    <p style="font-size:9.5px; color:#aaa; margin:0 0 8px 0; line-height:1.45;">Configure the administrative rights for each clan rank. Leaders have absolute control, while Officers can be delegated specific permissions:</p>
                                                    <div style="display:flex; flex-direction:column; gap:4px; font-family:monospace; font-size:10px; color:#fff;">
                                                        <div style="display:flex; justify-content:space-between; align-items:center; background:#07030b; padding:4px 8px; border-radius:4px; border:1px solid #222;">
                                                            <span>• Officers can invite members:</span>
                                                            <select id="settings-perm-officer-invite" style="background:#111; color:#2ecc71; border:1px solid #444; font-size:9.5px; padding:2px; font-weight:bold;">
                                                                <option value="allow" ${window.playerStats.clanPermissions?.officer_invite !== false ? "selected" : ""}>ALLOWED ✓</option>
                                                                <option value="block" ${window.playerStats.clanPermissions?.officer_invite === false ? "selected" : ""}>DENIED ✗</option>
                                                            </select>
                                                        </div>
                                                        <div style="display:flex; justify-content:space-between; align-items:center; background:#07030b; padding:4px 8px; border-radius:4px; border:1px solid #222;">
                                                            <span>• Officers can expel Recruits:</span>
                                                            <select id="settings-perm-officer-kick" style="background:#111; color:#2ecc71; border:1px solid #444; font-size:9.5px; padding:2px; font-weight:bold;">
                                                                <option value="allow" ${window.playerStats.clanPermissions?.officer_kick !== false ? "selected" : ""}>ALLOWED ✓</option>
                                                                <option value="block" ${window.playerStats.clanPermissions?.officer_kick === false ? "selected" : ""}>DENIED ✗</option>
                                                            </select>
                                                        </div>
                                                        <div style="display:flex; justify-content:space-between; align-items:center; background:#07030b; padding:4px 8px; border-radius:4px; border:1px solid #222;">
                                                            <span>• Officers can spend Vault Funds:</span>
                                                            <select id="settings-perm-officer-vault" style="background:#111; color:#2ecc71; border:1px solid #444; font-size:9.5px; padding:2px; font-weight:bold;">
                                                                <option value="allow" ${window.playerStats.clanPermissions?.officer_vault !== false ? "selected" : ""}>ALLOWED ✓</option>
                                                                <option value="block" ${window.playerStats.clanPermissions?.officer_vault === false ? "selected" : ""}>DENIED ✗</option>
                                                            </select>
                                                        </div>
                                                        <div style="display:flex; justify-content:space-between; align-items:center; background:#07030b; padding:4px 8px; border-radius:4px; border:1px solid #222;">
                                                            <span>• Vanguards can invite recruits:</span>
                                                            <select id="settings-perm-vanguard-invite" style="background:#111; color:#e74c3c; border:1px solid #444; font-size:9.5px; padding:2px; font-weight:bold;">
                                                                <option value="allow" ${window.playerStats.clanPermissions?.vanguard_invite === true ? "selected" : ""}>ALLOWED ✓</option>
                                                                <option value="block" ${window.playerStats.clanPermissions?.vanguard_invite !== true ? "selected" : ""}>DENIED ✗</option>
                                                            </select>
                                                        </div>
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
    let myMember = members.find((x) => (x.userId || x.user_id) === userId);
    let myRank = myMember ? myMember.clan_rank : "recruit";
    let clanPermissions = window.playerStats.clanPermissions || {
      officer_vault: true,
    };
    let canManageVault =
      myRank === "founder" ||
      isLeader ||
      (myRank === "officer" && clanPermissions.officer_vault !== false);

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
      let rawSoulName = "";

      if (key === "steel_phalanx" || key === "vitality_well") {
        costGold = Math.floor(
          (key === "steel_phalanx" ? 25000 : 20000) * Math.pow(1.35, currentL),
        );
        costSoul = Math.floor(200 * Math.pow(1.25, currentL));
        soulName = "Monster Souls";
        rawSoulName = "Monster Soul";
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
        rawSoulName = "Luminous Soul";
      }

      // Group Cooperative Model: Scale costs purely based on Clan Level and Research Level
      // This ensures all clan members see the exact same unified target and progress bar!
      let clanLvl = clan.level || 1;
      costGold = Math.floor(costGold * (1.0 + clanLvl * 0.15) * 20);

      let isMaxed = currentL >= maxL;
      let clanLevel = clan.level || 1;
      let isGated = currentL >= clanLevel * 2;

      let progress = clan.research_progress || {};
      let skillProgress = progress[key] || { gold: 0, souls: 0 };

      let currentGoldProgress = skillProgress.gold || 0;
      let currentSoulsProgress = skillProgress.souls || 0;

      let goldPct = isMaxed
        ? 100
        : Math.min(100, (currentGoldProgress / costGold) * 100);
      let soulsPct = isMaxed
        ? 100
        : Math.min(100, (currentSoulsProgress / costSoul) * 100);

      let personalGold = window.playerStats.coins || 0;
      let personalSouls = window.inventory.ETC[rawSoulName] || 0;

      let bgStyle = window.hexToRgba
        ? window.hexToRgba(col, 0.04)
        : "rgba(255,255,255,0.02)";

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
      else if (key === "clan_supply_depot")
        icon = window.getUiIconSvg("gold", 13);

      let statusBadge = `<span style="background:rgba(255,255,255,0.04); border:1px solid #333; color:#aaa; font-size:8px; padding:2px 6px; border-radius:4px; font-weight:bold; font-family:monospace;">ACTIVE</span>`;
      if (isMaxed) {
        statusBadge = `<span style="background:rgba(46,204,113,0.15); border:1px solid #2ecc71; color:#2ecc71; font-size:8px; padding:2px 6px; border-radius:4px; font-weight:bold; font-family:monospace;">MAX RANK</span>`;
      } else if (isGated) {
        statusBadge = `<span style="background:rgba(231,76,60,0.15); border:1px solid #e74c3c; color:#e74c3c; font-size:8px; padding:2px 6px; border-radius:4px; font-weight:bold; font-family:monospace;">GATED</span>`;
      }

      let gateWarningText = "";
      if (isGated && !isMaxed) {
        gateWarningText = `<div style="margin-top:6px; background:rgba(231,76,60,0.06); border:1px dashed #e74c3c; padding:5px; border-radius:4px; font-size:8.5px; color:#ff7675; text-align:center; font-weight:bold; line-height:1.2;">🔒 RESEARCH BLOCKED: Level up your Clan to Level ${Math.ceil((currentL + 1) / 2)} to expand the caps!</div>`;
      }

      return `
            <div class="shop-row" style="border:1.5px solid ${col}44; border-left: 4.5px solid ${col} !important; background:${bgStyle}; flex-direction:column; align-items:stretch; text-align:left; gap:8px; padding:12px; margin-bottom:0; cursor:default; position:relative; z-index:1;">
              <div style="display:flex; justify-content:space-between; align-items:center; width:100%;">
                <strong style="color:${col}; font-size:12px; display:inline-flex; align-items:center; gap:6px;">${icon} ${label}</strong>
                ${statusBadge}
              </div>

              <div style="font-size:10px; color:#cbd5e1; line-height:1.4;">
                Current Active Bonus: <strong style="color:#fff;">${bonusText}</strong>
              </div>

              <!-- Progress Bar through cap limit -->
              <div style="display:flex; justify-content:space-between; align-items:center; font-size:8.5px; color:#aaa; font-family:monospace; margin-top:2px;">
                <span>RESEARCH INTENSITY:</span>
                <span style="color:#df9ffb; font-weight:bold;">Lv. ${currentL} / ${maxL}</span>
              </div>

              ${
                !isMaxed && !isGated
                  ? `
              <!-- Gold Progress Track -->
              <div style="margin-top:6px; background:rgba(0,0,0,0.22); padding:8px; border:1px solid #222; border-radius:6px; position:relative; z-index:5;">
                <div style="display:flex; justify-content:space-between; font-size:9.5px; font-family:monospace; margin-bottom:4px; color:#aaa;">
                  <span>🟡 Gold Progress:</span>
                  <strong style="color:#fff;">${window.formatNumber(currentGoldProgress)} / ${window.formatNumber(costGold)}</strong>
                </div>
                <div class="sink-prog-track" style="margin:0 0 6px 0; height:5px !important;">
                  <div class="sink-prog-fill" style="width:${goldPct}%; height:100%; background:#f1c40f;"></div>
                </div>
                <div style="display:grid; grid-template-columns: ${canManageVault ? "repeat(3, 1fr)" : "1fr 1fr"}; gap:6px; margin-top:6px;">
                                  <button class="btn-action" style="padding:4px 0; font-size:9.5px; background:#2c3e50; border:1px solid #34495e;" onclick="window.openResearchDonateModal('${key}', 'gold', ${costGold}, ${currentGoldProgress})">Donate</button>
                                  <button class="btn-action" style="padding:4px 0; font-size:9.5px; background:#f1c40f; color:#111;" onclick="window.confirmResearchDonateMax('${key}', 'gold', ${costGold}, ${currentGoldProgress})">Donate Max</button>
                                  ${canManageVault ? `<button class="btn-action" style="padding:4px 0; font-size:9.5px; background:#3498db; color:#fff;" onclick="window.openVaultAllocationModal('${key}', 'gold', ${costGold}, ${currentGoldProgress})">Vault Fund</button>` : ""}
                                </div>
                              </div>

                              <!-- Souls Progress Track -->
                              <div style="margin-top:6px; background:rgba(0,0,0,0.22); padding:8px; border:1px solid #222; border-radius:6px; position:relative; z-index:5;">
                                <div style="display:flex; justify-content:space-between; font-size:9.5px; font-family:monospace; margin-bottom:4px; color:#aaa;">
                                  <span>💀 ${soulName} Progress:</span>
                                  <strong style="color:#fff;">${currentSoulsProgress.toLocaleString()} / ${costSoul.toLocaleString()}</strong>
                                </div>
                                <div class="sink-prog-track" style="margin:0 0 6px 0; height:5px !important;">
                                  <div class="sink-prog-fill" style="width:${soulsPct}%; height:100%; background:#9b59b6;"></div>
                                </div>
                                <div style="display:grid; grid-template-columns: ${canManageVault ? "repeat(3, 1fr)" : "1fr 1fr"}; gap:6px; margin-top:6px;">
                                  <button class="btn-action" style="padding:4px 0; font-size:9.5px; background:#2c3e50; border:1px solid #34495e;" onclick="window.openResearchDonateModal('${key}', 'souls', ${costSoul}, ${currentSoulsProgress})">Donate</button>
                                  <button class="btn-action" style="padding:4px 0; font-size:9.5px; background:#9b59b6; color:#fff;" onclick="window.confirmResearchDonateMax('${key}', 'souls', ${costSoul}, ${currentSoulsProgress})">Donate Max</button>
                                  ${canManageVault ? `<button class="btn-action" style="padding:4px 0; font-size:9.5px; background:#9b59b6; color:#fff;" onclick="window.openVaultAllocationModal('${key}', 'souls', ${costSoul}, ${currentSoulsProgress})">Vault Fund</button>` : ""}
                                </div>
                              </div>
              `
                  : ""
              }

              ${gateWarningText}
            </div>
          `;
    };

    // Include the infinite Aetheric Hearth repeatable contribution portal at the bottom of the list
    let hearthHtml = `
        <div class="shop-row" style="border:1.5px solid #ff007f44; border-left:4.5px solid #ff007f !important; background:rgba(255, 0, 127, 0.04); flex-direction:column; align-items:stretch; text-align:left; gap:6px; padding:12px; margin-bottom:0; cursor:default; position:relative; z-index:1;">
          <div style="display:flex; justify-content:space-between; align-items:center; width:100%;">
            <strong style="color:#ff007f; font-size:12px; display:inline-flex; align-items:center; gap:6px;">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="display:inline-block; vertical-align:middle; filter:drop-shadow(0 0 3px #ff007f);"><circle cx="12" cy="12" r="10" stroke-dasharray="3 3"/><path d="m15 9-6 6M9 9h6v6" stroke="#ff007f"/></svg>
              Aetheric Hearth
            </strong>
            <span style="background:rgba(255, 0, 127, 0.15); border:1px solid #ff007f; color:#ffb6c1; font-size:8px; padding:2px 6px; border-radius:4px; font-weight:bold; font-family:monospace;">INFINITE</span>
          </div>
          <div style="font-size:10px; color:#cbd5e1; line-height:1.45;">
            A repeatable contribution channel for maxed clans. Inject extra resources directly into the hearth, raising your personal contribution and generating **Renown** directly to progress the weekly chest!
          </div>
          <div style="display:grid; grid-template-columns: 1fr 1fr; gap:6px; margin-top:4px; position:relative; z-index:5;">
            <button class="btn-action" style="padding:6px 0; font-size:10px; background:#ffd700; color:#111; font-weight:bold; border:1px solid #fff;" onclick="window.openHearthDonateModal('gold')">🟡 Donate Gold</button>
            <button class="btn-action" style="padding:6px 0; font-size:10px; background:#9b59b6; color:#fff; font-weight:bold; border:1px solid #fff;" onclick="window.openHearthDonateModal('souls')">💀 Donate Souls</button>
          </div>
        </div>
      `;

    tabContentHtml = `
              <div style="display:flex; flex-direction:column; gap:10px;">
                  ${getSkillUpgradeCardHtml("steel_phalanx", "Steel Phalanx", "+" + ((clan.skill_steel_phalanx || 0) * 0.5).toFixed(1) + "% Attack & Defense", clan.skill_steel_phalanx || 0, 50, "#e74c3c")}
              ${getSkillUpgradeCardHtml("vitality_well", "Vitality Well", "+" + ((clan.skill_vitality_well || 0) * 0.8).toFixed(1) + "% Max HP", clan.skill_vitality_well || 0, 50, "#3498db")}
              ${getSkillUpgradeCardHtml("prosperity_accord", "Prosperity Accord", "+" + ((clan.skill_prosperity_accord || 0) * 1.0).toFixed(1) + "% Gold Multiplier", clan.skill_prosperity_accord || 0, 30, "#f1c40f")}
              ${getSkillUpgradeCardHtml("voyagers_guidance", "Voyager's Guidance", "+" + ((clan.skill_voyagers_guidance || 0) * 0.5).toFixed(1) + "% Drop Rate & Quality", clan.skill_voyagers_guidance || 0, 30, "#2ecc71")}
              ${getSkillUpgradeCardHtml("aetheric_wisdom", "Aetheric Wisdom", "+" + ((clan.skill_aetheric_wisdom || 0) * 1.0).toFixed(1) + "% XP Rate", clan.skill_aetheric_wisdom || 0, 30, "#9b59b6")}
              ${getSkillUpgradeCardHtml("clan_supply_depot", "Supply Depot", "Crate yields: +" + (clan.skill_clan_supply_depot || 0) * 20 + "% Gold & +" + (clan.skill_clan_supply_depot || 0) * 10 + "% Souls", clan.skill_clan_supply_depot || 0, 30, "#ffaa00")}
              ${hearthHtml}
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
        } else if (r.goldBase > 0) {
          let peakLvl =
            window.playerStats.lifetimePeakStage ||
            window.playerStats.stage ||
            1;
          let effStage = window.getEffectiveStage(peakLvl);
          let growthRate = 1.045 + (effStage * 0.04) / (effStage + 200);
          let scaleVal = Math.pow(growthRate, effStage);

          let baseRatio = (r.goldBase || 150000) / 150000;
          let calculatedGold = Math.ceil(scaleVal * 1200 * baseRatio);

          window.addCoins(calculatedGold);
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
  let emblemInput = document.getElementById("settings-clan-emblem");
  let titheSelect = document.getElementById("settings-clan-tithe");

  // Read rank permissions dropdowns if they exist
  let permOfficerInvite = document.getElementById(
    "settings-perm-officer-invite",
  );
  let permOfficerKick = document.getElementById("settings-perm-officer-kick");
  let permOfficerVault = document.getElementById("settings-perm-officer-vault");
  let permVanguardInvite = document.getElementById(
    "settings-perm-vanguard-invite",
  );

  if (
    !descInput ||
    !policySelect ||
    !minLvlInput ||
    !emblemInput ||
    !titheSelect
  )
    return;

  const userId = window.getGameUserId();
  const description = descInput.value.trim();
  const joinPolicy = policySelect.value;
  const minLevel = parseInt(minLvlInput.value, 10) || 1;
  const emblem = parseInt(emblemInput.value, 10) || 0;
  const titheRate = parseInt(titheSelect.value, 10) || 0;

  let permissions = {
    officer_invite: permOfficerInvite
      ? permOfficerInvite.value === "allow"
      : true,
    officer_kick: permOfficerKick ? permOfficerKick.value === "allow" : true,
    officer_vault: permOfficerVault ? permOfficerVault.value === "allow" : true,
    vanguard_invite: permVanguardInvite
      ? permVanguardInvite.value === "allow"
      : false,
  };

  fetch(`${window.GAME_SERVER_URL}/api/clan/update-settings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId,
      description,
      joinPolicy,
      minLevel,
      emblem,
      titheRate,
      permissions,
    }),
  })
    .then((r) => r.json())
    .then((data) => {
      if (data.success) {
        window.playerStats.clanEmblem = emblem;
        window.playerStats.clanPermissions = permissions;
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

// --- PILLAR 2: INLINE ADMINISTRATIVE RANK MANAGEMENT CONTROLLER ---
window.handleInlineAdminAction = function (selectEl, targetUserId, targetName) {
  const action = selectEl.value;
  if (!action) return;

  // Reset selected state to prompt actions cleanly
  selectEl.value = "";

  if (action === "kick") {
    window.executeKickMember(targetUserId, targetName);
    return;
  }

  let popupTitle = "";
  let popupMessage = "";
  let confirmText = "";
  let accentColor = "#9b59b6";

  if (action === "promote") {
    popupTitle = "Promote Member";
    popupMessage = `Are you sure you want to promote **${targetName}**? This elevates their rank, unlocking higher administrative privileges within the Clan hierarchy.`;
    confirmText = "Promote";
    accentColor = "#2ecc71";
  } else if (action === "demote") {
    popupTitle = "Demote Member";
    popupMessage = `Are you sure you want to demote **${targetName}**? This reduces their active rank and restricts access to previously held administrative actions.`;
    confirmText = "Demote";
    accentColor = "#e67e22";
  } else if (action === "founder") {
    popupTitle = "Transfer Clan Leadership";
    popupMessage = `⚠️ <strong style="color:#e74c3c;">CRITICAL ACTION:</strong> Are you sure you want to transfer ownership of the Clan to **${targetName}**?<br><br>This will demote your rank to Officer and hand full control over settings, upgrades, and disband actions to them. This cannot be undone!`;
    confirmText = "Transfer Ownership";
    accentColor = "#ff007f";
  }

  window.showCustomConfirm(
    popupTitle,
    popupMessage,
    confirmText,
    "Cancel",
    accentColor,
    function () {
      const userId = window.getGameUserId();
      fetch(`${window.GAME_SERVER_URL}/api/clan/promote-demote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, targetUserId, action }),
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.success) {
            window.pushHeaderToast(
              `✓ Successfully modified rank of ${targetName}!`,
              accentColor,
            );
            window.fetchClanData();
            window.updateUI();
            window.saveGame();
          } else {
            window.pushHeaderToast(`❌ ${data.error}`, "#e74c3c");
          }
        })
        .catch(() => {
          window.pushHeaderToast(
            "❌ Network error updating member rank.",
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
              aetheric_wisdom: 0,
              clan_supply_depot: 0,
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
  let balance = BigNum.from(0);

  if (type === "gold") {
    balance = BigNum.from(window.playerStats.coins || 0);
  } else if (type === "souls") {
    balance = BigNum.from(window.inventory.ETC["Monster Soul"] || 0);
  } else if (type === "luminous") {
    balance = BigNum.from(window.inventory.ETC["Luminous Soul"] || 0);
  }

  let amountBig = BigNum.from(amount);

  if (balance.lt(amountBig)) {
    window.pushHeaderToast("❌ Insufficient funds for donation!", "#e74c3c");
    return;
  }

  // Deduct locally first
  if (type === "gold") {
    window.playerStats.coins = balance.sub(amountBig);
    if (window.playerStats.coins.eq(0)) {
      window.playerStats.hasTriggeredExactChange = true;
    }
  } else if (type === "souls") {
    let amtNum = amountBig.m * Math.pow(10, amountBig.e);
    window.inventory.ETC["Monster Soul"] -= amtNum;
    if (window.inventory.ETC["Monster Soul"] === 0) {
      delete window.inventory.ETC["Monster Soul"];
    }
  } else if (type === "luminous") {
    let amtNum = amountBig.m * Math.pow(10, amountBig.e);
    window.inventory.ETC["Luminous Soul"] -= amtNum;
    if (window.inventory.ETC["Luminous Soul"] === 0) {
      delete window.inventory.ETC["Luminous Soul"];
    }
  }

  // Hit network endpoint
  fetch(`${window.GAME_SERVER_URL}/api/clan/donate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId,
      resType: type,
      amount: amountBig.m * Math.pow(10, amountBig.e),
    }),
  })
    .then((r) => r.json())
    .then((data) => {
      if (data.success) {
        let calculatedRenown = 0;
        if (type === "gold") {
          let peakStage =
            window.playerStats.lifetimePeakStage ||
            window.playerStats.stage ||
            1;
          if (peakStage && typeof peakStage === "object") {
            peakStage = Number(peakStage.m * Math.pow(10, peakStage.e)) || 1;
          }
          peakStage = Number(peakStage);
          if (isNaN(peakStage) || peakStage < 1) peakStage = 1;
          let costGoldLargeBig = BigNum.from(50000).mul(
            BigNum.from(1.045).pow(peakStage),
          );
          calculatedRenown = amountBig.gte(costGoldLargeBig) ? 300 : 50;
        } else if (type === "souls") {
          calculatedRenown = amountBig.gte(250) ? 1250 : 250;
        } else if (type === "luminous") {
          calculatedRenown = amountBig.gte(25) ? 3750 : 750;
        }

        window.pushHeaderToast(
          `🙏 Contribution Recorded! +${window.formatNumber(amountBig)} (+${calculatedRenown.toLocaleString()} Renown)`,
          "#2ecc71",
        );
        window.fetchClanData();
        window.updateUI();
        window.saveGame();
      } else {
        // Rollback local deduction
        if (type === "gold") {
          window.playerStats.coins = BigNum.from(window.playerStats.coins).add(
            amountBig,
          );
        } else if (type === "souls") {
          let amtNum = amountBig.m * Math.pow(10, amountBig.e);
          window.inventory.ETC["Monster Soul"] =
            (window.inventory.ETC["Monster Soul"] || 0) + amtNum;
        } else if (type === "luminous") {
          let amtNum = amountBig.m * Math.pow(10, amountBig.e);
          window.inventory.ETC["Luminous Soul"] =
            (window.inventory.ETC["Luminous Soul"] || 0) + amtNum;
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

// Granular Auto-Deposit Bridge Controller to reduce guild screen friction
window.executeDeficitContributeAndUpgrade = function (
  skillKey,
  costGold,
  costSoul,
  bankField,
) {
  let clan = window.lastFetchedClanData;
  if (!clan) return;

  let goldDeficit = Math.max(0, costGold - clan.gold_bank);
  let soulsDeficit = Math.max(0, costSoul - clan[bankField]);

  let personalGold = BigNum.from(window.playerStats.coins || 0);
  let rawSoulName =
    bankField === "souls_bank" ? "Monster Soul" : "Luminous Soul";
  let personalSouls = window.inventory.ETC[rawSoulName] || 0;

  if (personalGold.lt(goldDeficit)) {
    window.pushHeaderToast(
      "❌ Insufficient personal Gold to cover the research deficit!",
      "#e74c3c",
    );
    return;
  }
  if (personalSouls < soulsDeficit) {
    window.pushHeaderToast(
      `❌ Insufficient personal ${rawSoulName}s to cover the research deficit!`,
      "#e74c3c",
    );
    return;
  }

  let popupMessage = `Are you sure you want to donate the deficit missing from your personal inventory to the Clan Vault and instantly trigger the Research Upgrade?<br><br>
                      💸 <strong style="color:#f1c40f;">Auto-Deposited:</strong><br>
                      • ${goldDeficit > 0 ? `+${goldDeficit.toLocaleString()} Gold` : "0 Gold"}<br>
                      • ${soulsDeficit > 0 ? `+${soulsDeficit.toLocaleString()} ${rawSoulName}s` : `0 ${rawSoulName}s`}`;

  window.showCustomConfirm(
    "Cooperative Fusion",
    popupMessage,
    "Fund & Research",
    "Cancel",
    "#9b59b6",
    async function () {
      try {
        const userId = window.getGameUserId();

        // 1. Bridges Gold Deficit
        if (goldDeficit > 0) {
          window.playerStats.coins = personalGold.sub(goldDeficit);
          if (window.playerStats.coins.eq(0))
            window.playerStats.hasTriggeredExactChange = true;

          await fetch(`${window.GAME_SERVER_URL}/api/clan/donate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId,
              resType: "gold",
              amount: goldDeficit,
            }),
          });
        }

        // 2. Bridges Souls Deficit
        if (soulsDeficit > 0) {
          window.inventory.ETC[rawSoulName] -= soulsDeficit;
          if (window.inventory.ETC[rawSoulName] === 0)
            delete window.inventory.ETC[rawSoulName];

          await fetch(`${window.GAME_SERVER_URL}/api/clan/donate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId,
              resType: bankField === "souls_bank" ? "souls" : "luminous",
              amount: soulsDeficit,
            }),
          });
        }

        // 3. Directly triggers the upgrade
        await window.executeUpgradeClanSkill(skillKey);
      } catch (err) {
        console.error("Auto contribution upgrade chain failed:", err);
      }
    },
  );
};

window.openResearchDonateModal = function (
  skillKey,
  resType,
  requiredAmt,
  currentAmt,
) {
  let needed = requiredAmt - currentAmt;
  if (needed <= 0) return;

  let labelMap = {
    steel_phalanx: "Steel Phalanx",
    vitality_well: "Vitality Well",
    prosperity_accord: "Prosperity Accord",
    voyagers_guidance: "Voyager's Guidance",
    aetheric_wisdom: "Aetheric Wisdom",
    clan_supply_depot: "Supply Depot",
  };

  let skillName = labelMap[skillKey] || "Research";
  let personalBalance = 0;
  let rawName = "";
  let accentColor = resType === "gold" ? "#f1c40f" : "#9b59b6";

  if (resType === "gold") {
    let coins = BigNum.from(window.playerStats.coins);
    personalBalance = Number(coins.m * Math.pow(10, Math.min(15, coins.e))); // Safely downscale for HTML5 slider limits
    rawName = "Gold";
  } else {
    let rawSoulName =
      skillKey === "steel_phalanx" || skillKey === "vitality_well"
        ? "Monster Soul"
        : "Luminous Soul";
    personalBalance = window.inventory.ETC[rawSoulName] || 0;
    rawName = rawSoulName + "s";
  }

  let limit = Math.min(personalBalance, needed);
  if (limit <= 0) {
    window.pushHeaderToast(
      `❌ You have no ${rawName} available to donate!`,
      "#e74c3c",
    );
    return;
  }

  // Create Custom slider modal
  let overlay = document.createElement("div");
  overlay.id = "research-donation-modal-overlay";
  overlay.style.position = "fixed";
  overlay.style.top = "0";
  overlay.style.left = "0";
  overlay.style.width = "100%";
  overlay.style.height = "100%";
  overlay.style.backgroundColor = "rgba(0,0,0,0.85)";
  overlay.style.display = "flex";
  overlay.style.justifyContent = "center";
  overlay.style.alignItems = "center";
  overlay.style.zIndex = "40000";
  overlay.style.backdropFilter = "blur(4px)";
  document.body.appendChild(overlay);

  overlay.innerHTML = `
    <div style="background:#151515; border: 2px solid ${accentColor}; border-radius: 8px; width:90%; max-width:380px; padding:20px; box-shadow:0 10px 30px rgba(0,0,0,0.95); text-align:center;">
        <h3 style="margin:0 0 6px 0; color:${accentColor}; text-transform:uppercase; letter-spacing:1px; font-size:14px;">🎯 Research Contribution</h3>
        <p style="font-size:10.5px; color:#aaa; margin:0 0 12px 0;">Donating to <strong>${skillName}</strong></p>
        <div style="height:1px; background:linear-gradient(90deg, transparent, ${accentColor}, transparent); margin-bottom:15px;"></div>

        <div style="background:#0c0f12; border:1px solid #222; padding:10px; border-radius:4px; font-family:monospace; font-size:11px; text-align:left; margin-bottom:15px; display:flex; flex-direction:column; gap:4px;">
            <div style="display:flex; justify-content:space-between;"><span>• Balance:</span><strong style="color:#fff;">${personalBalance.toLocaleString()} ${rawName}</strong></div>
            <div style="display:flex; justify-content:space-between;"><span>• Required to Max:</span><strong style="color:${accentColor};">${needed.toLocaleString()} ${rawName}</strong></div>
            <div style="display:flex; justify-content:space-between;"><span>• Earned Renown:</span><strong id="re-renown-calc" style="color:#2ecc71;">+0 Renown</strong></div>
        </div>

        <!-- Custom Input & Slider controls -->
        <div style="margin-bottom:15px;">
            <input type="range" id="re-donate-slider" min="1" max="${limit}" value="${limit}" style="width:100%; height:4px; accent-color:${accentColor}; cursor:pointer;" oninput="window.updateResearchDonateModal(${limit}, '${resType}', '${rawName}')" />
            <div style="display:flex; gap:6px; justify-content:center; align-items:center; margin-top:8px;">
                <input type="number" id="re-donate-num-input" min="1" max="${limit}" value="${limit}" style="width:90px; background:#111; color:#fff; border:1px solid #444; border-radius:3px; padding:4px; text-align:center; font-family:monospace; font-size:11px;" oninput="window.updateResearchDonateModalNum(${limit}, '${resType}', '${rawName}')" />
                <span style="font-size:11px; color:#666;">/ ${limit.toLocaleString()}</span>
            </div>
        </div>

        <div style="display:grid; grid-template-columns: repeat(4, 1fr); gap:4px; margin-bottom:20px;">
            <button class="sub-tab-btn" style="padding:4px; font-size:9px; height:24px;" onclick="window.setResearchDonatePercent(0.25, ${limit}, '${resType}', '${rawName}')">25%</button>
            <button class="sub-tab-btn" style="padding:4px; font-size:9px; height:24px;" onclick="window.setResearchDonatePercent(0.50, ${limit}, '${resType}', '${rawName}')">50%</button>
            <button class="sub-tab-btn" style="padding:4px; font-size:9px; height:24px;" onclick="window.setResearchDonatePercent(0.75, ${limit}, '${resType}', '${rawName}')">75%</button>
            <button class="sub-tab-btn" style="padding:4px; font-size:9px; height:24px;" onclick="window.setResearchDonatePercent(1.0, ${limit}, '${resType}', '${rawName}')">MAX</button>
        </div>

        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
                        <button class="btn-action" style="background:#222; border:1px solid #444; color:#aaa; font-weight:bold; padding:10px; font-size:11px;" onclick="document.getElementById('research-donation-modal-overlay').remove()">Cancel</button>
                        <button class="btn-action" style="background:${accentColor}; color:${resType === "gold" ? "#111" : "#fff"}; font-weight:bold; padding:10px; font-size:11px; border:1px solid #fff;" onclick="window.submitResearchDonation('${skillKey}', '${resType}', ${requiredAmt})">Confirm</button>
                    </div>
    </div>
  `;

  window.updateResearchDonateModal(limit, resType, rawName);
};

window.updateResearchDonateModal = function (limit, resType, rawName) {
  let slider = document.getElementById("re-donate-slider");
  let input = document.getElementById("re-donate-num-input");
  let renownText = document.getElementById("re-renown-calc");
  if (!slider || !input || !renownText) return;

  let val = parseInt(slider.value, 10) || 1;
  input.value = val;

  let earned = 0;
  if (resType === "gold") {
    // Uses the formula of costGold
    let sliderMax = parseInt(slider.max, 10) || 1;
    earned = Math.floor((val / sliderMax) * 300);
    if (earned < 1 && val > 0) earned = 1;
  } else {
    earned = rawName.includes("Monster") ? val * 5 : val * 150;
  }
  renownText.innerText = `+${earned.toLocaleString()} Renown`;
};

window.updateResearchDonateModalNum = function (limit, resType, rawName) {
  let slider = document.getElementById("re-donate-slider");
  let input = document.getElementById("re-donate-num-input");
  let renownText = document.getElementById("re-renown-calc");
  if (!slider || !input || !renownText) return;

  let val = parseInt(input.value, 10) || 1;
  if (val < 1) val = 1;
  if (val > limit) val = limit;
  slider.value = val;

  let earned = 0;
  if (resType === "gold") {
    let sliderMax = parseInt(slider.max, 10) || 1;
    earned = Math.floor((val / sliderMax) * 300);
    if (earned < 1 && val > 0) earned = 1;
  } else {
    earned = rawName.includes("Monster") ? val * 5 : val * 150;
  }
  renownText.innerText = `+${earned.toLocaleString()} Renown`;
};

window.setResearchDonatePercent = function (pct, limit, resType, rawName) {
  let slider = document.getElementById("re-donate-slider");
  if (!slider) return;
  slider.value = Math.max(1, Math.floor(limit * pct));
  window.updateResearchDonateModal(limit, resType, rawName);
};

window.submitResearchDonation = function (skillKey, resType, costGold) {
  let input = document.getElementById("re-donate-num-input");
  if (!input) return;

  let val = parseInt(input.value, 10) || 0;
  if (val <= 0) return;

  document.getElementById("research-donation-modal-overlay").remove();
  window.executeClanResearchDonate(skillKey, resType, val);
};

window.confirmResearchDonateMax = function (
  skillKey,
  resType,
  requiredAmt,
  currentAmt,
) {
  let needed = requiredAmt - currentAmt;
  if (needed <= 0) return;

  let personalBalance = 0;
  let rawName = "";
  let accentColor = resType === "gold" ? "#f1c40f" : "#9b59b6";

  if (resType === "gold") {
    let coins = BigNum.from(window.playerStats.coins);
    personalBalance =
      Number(coins.m * Math.pow(10, Math.min(15, coins.e))) || 0;
    rawName = "Gold";
  } else {
    let rawSoulName =
      skillKey === "steel_phalanx" || skillKey === "vitality_well"
        ? "Monster Soul"
        : "Luminous Soul";
    personalBalance = window.inventory.ETC[rawSoulName] || 0;
    rawName = rawSoulName + "s";
  }

  let limit = Math.min(personalBalance, needed);
  if (limit <= 0) {
    window.pushHeaderToast(
      `❌ You have no ${rawName} available to donate!`,
      "#e74c3c",
    );
    return;
  }

  window.showCustomConfirm(
    "Confirm Max Donation",
    `Are you sure you want to sacrifice <strong>${limit.toLocaleString()} ${rawName}</strong> to fund this research?`,
    "Donate Max",
    "Cancel",
    accentColor,
    function () {
      window.executeClanResearchDonate(skillKey, resType, limit);
    },
  );
};

window.executeClanResearchDonate = function (skillKey, resType, amount) {
  const userId = window.getGameUserId();
  fetch(`${window.GAME_SERVER_URL}/api/clan/research-donate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, skillKey, resType, amount }),
  })
    .then((r) => r.json())
    .then((data) => {
      if (data.success) {
        let label = resType === "gold" ? "Gold" : "Souls";
        window.pushHeaderToast(
          `✓ Contributed +${data.addedAmount.toLocaleString()} ${label}! (+${data.renownEarned} Renown)`,
          "#2ecc71",
        );
        if (window.SoundManager) window.SoundManager.play("fairy");

        // Award resources locally to stay responsive before reload
        if (resType === "gold") {
          window.playerStats.coins = BigNum.from(window.playerStats.coins).sub(
            data.addedAmount,
          );
        } else {
          let rawSoulName =
            skillKey === "steel_phalanx" || skillKey === "vitality_well"
              ? "Monster Soul"
              : "Luminous Soul";
          window.inventory.ETC[rawSoulName] -= data.addedAmount;
          if (window.inventory.ETC[rawSoulName] === 0)
            delete window.inventory.ETC[rawSoulName];
        }

        if (data.leveledUp) {
          window.playerStats.clanSkills = window.playerStats.clanSkills || {};
          window.playerStats.clanSkills[skillKey] = data.newLevel;
          window.pushHeaderToast(
            `🎉 Research Upgraded to Lv. ${data.newLevel}!`,
            "#ffd700",
          );
          if (window.SoundManager) window.SoundManager.play("revive");
          if (window.spawnPurchaseCelebration) {
            window.spawnPurchaseCelebration("alchemy", "#f1c40f", 5);
          }
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
      // Local-Only Simulation Fallback for seamless offline gameplay
      let clan = window.lastFetchedClanData || {
        level: window.playerStats.clanLevel || 1,
        research_progress: {},
        members: [],
      };
      window.lastFetchedClanData = clan;

      let isGold = resType === "gold";
      let progress = (clan.research_progress = clan.research_progress || {});
      let skillProgress = (progress[skillKey] = progress[skillKey] || {
        gold: 0,
        souls: 0,
      });

      let currentL = window.playerStats.clanSkills[skillKey] || 0;
      let costGold = 0;
      let costSoul = 0;

      if (skillKey === "steel_phalanx" || skillKey === "vitality_well") {
        costGold = Math.floor(
          (skillKey === "steel_phalanx" ? 25000 : 20000) *
            Math.pow(1.35, currentL),
        );
        costSoul = Math.floor(200 * Math.pow(1.25, currentL));
      } else {
        let baseG =
          skillKey === "prosperity_accord"
            ? 40000
            : skillKey === "voyagers_guidance"
              ? 50000
              : skillKey === "clan_supply_depot"
                ? 55000
                : 45000;
        let baseS =
          skillKey === "aetheric_wisdom"
            ? 6
            : skillKey === "clan_supply_depot"
              ? 8
              : 5;
        let scaleG = skillKey === "clan_supply_depot" ? 1.45 : 1.4;
        let scaleS = skillKey === "clan_supply_depot" ? 1.35 : 1.3;
        costGold = Math.floor(baseG * Math.pow(scaleG, currentL));
        costSoul = Math.floor(baseS * Math.pow(scaleS, currentL));
      }
      let clanLvl = clan.level || 1;
      costGold = Math.floor(costGold * (1.0 + clanLvl * 0.15) * 20);

      let addedAmount = amount;
      let leveledUp = false;

      if (isGold) {
        let availableToMax = costGold - (skillProgress.gold || 0);
        addedAmount = Math.min(amount, availableToMax);
        skillProgress.gold = (skillProgress.gold || 0) + addedAmount;
        window.playerStats.coins = BigNum.from(window.playerStats.coins).sub(
          addedAmount,
        );
        if (window.playerStats.coins.eq(0))
          window.playerStats.hasTriggeredExactChange = true;
      } else {
        let availableToMax = costSoul - (skillProgress.souls || 0);
        addedAmount = Math.min(amount, availableToMax);
        skillProgress.souls = (skillProgress.souls || 0) + addedAmount;
        let rawSoulName =
          skillKey === "steel_phalanx" || skillKey === "vitality_well"
            ? "Monster Soul"
            : "Luminous Soul";
        window.inventory.ETC[rawSoulName] -= addedAmount;
        if (window.inventory.ETC[rawSoulName] === 0)
          delete window.inventory.ETC[rawSoulName];
      }

      let renownEarned = 0;
      if (isGold) {
        renownEarned = Math.floor(addedAmount / 1000);
        if (renownEarned < 1 && addedAmount > 0) renownEarned = 1;
      } else {
        let isMonster =
          skillKey === "steel_phalanx" || skillKey === "vitality_well";
        renownEarned = isMonster ? addedAmount * 2 : addedAmount * 40;
      }

      clan.vault_points = (clan.vault_points || 0) + renownEarned;
      let membersList = clan.members || [];
      let meMember = membersList.find(
        (x) => (x.userId || x.user_id) === userId,
      );
      if (meMember) {
        let currentContrib =
          meMember.weekly_contribution ||
          meMember.weekly_renown ||
          meMember.weeklyContribution ||
          0;
        meMember.weekly_contribution = currentContrib + renownEarned;
      }

      window.pushHeaderToast(
        `✓ Contributed +${addedAmount.toLocaleString()} ${isGold ? "Gold" : "Souls"} (Offline)! (+${renownEarned} Renown)`,
        "#2ecc71",
      );

      if (skillProgress.gold >= costGold && skillProgress.souls >= costSoul) {
        leveledUp = true;
        skillProgress.gold = 0;
        skillProgress.souls = 0;
        window.playerStats.clanSkills[skillKey] = currentL + 1;
        window.pushHeaderToast(
          `🎉 Research Upgraded to Lv. ${currentL + 1}!`,
          "#ffd700",
        );
        if (window.SoundManager) window.SoundManager.play("revive");
        if (window.spawnPurchaseCelebration) {
          window.spawnPurchaseCelebration("alchemy", "#f1c40f", 5);
        }
      }

      window.renderClanDashboard(clan, membersList, []);
      window.updateUI();
      window.renderInventory();
      window.saveGame();
    });
};

// --- REPEATABLE ENDGAME HEARTH MODAL SYSTEM ---

window.openHearthDonateModal = function (resType) {
  let personalBalance = 0;
  let rawName = "";
  let accentColor = resType === "gold" ? "#f1c40f" : "#9b59b6";

  if (resType === "gold") {
    let coins = BigNum.from(window.playerStats.coins);
    personalBalance =
      Number(coins.m * Math.pow(10, Math.min(15, coins.e))) || 0;
    rawName = "Gold";
  } else {
    // Prompt choice of Monster or Luminous Souls
    window.showCustomConfirm(
      "Infuse Hearth Souls",
      "Which soul matrix would you like to fuse into the Hearth?",
      "Monster Souls",
      "Luminous Souls",
      "#ff007f",
      function () {
        window.launchHearthResourceModal(
          "Monster Soul",
          window.inventory.ETC["Monster Soul"] || 0,
        );
      },
      function () {
        window.launchHearthResourceModal(
          "Luminous Soul",
          window.inventory.ETC["Luminous Soul"] || 0,
        );
      },
    );
    return;
  }

  window.launchHearthResourceModal("Gold", personalBalance);
};

window.launchHearthResourceModal = function (resName, balance) {
  if (balance <= 0) {
    window.pushHeaderToast(
      `❌ You have no ${resName}s available to donate!`,
      "#e74c3c",
    );
    return;
  }

  let accentColor =
    resName === "Gold"
      ? "#f1c40f"
      : resName.includes("Monster")
        ? "#bdc3c7"
        : "#ffb6c1";

  let overlay = document.createElement("div");
  overlay.id = "hearth-donation-modal-overlay";
  overlay.style.position = "fixed";
  overlay.style.top = "0";
  overlay.style.left = "0";
  overlay.style.width = "100%";
  overlay.style.height = "100%";
  overlay.style.backgroundColor = "rgba(0,0,0,0.85)";
  overlay.style.display = "flex";
  overlay.style.justifyContent = "center";
  overlay.style.alignItems = "center";
  overlay.style.zIndex = "40000";
  overlay.style.backdropFilter = "blur(4px)";
  document.body.appendChild(overlay);

  overlay.innerHTML = `
    <div style="background:#151515; border: 2px solid ${accentColor}; border-radius: 8px; width:90%; max-width:380px; padding:20px; box-shadow:0 10px 30px rgba(0,0,0,0.95); text-align:center;">
        <h3 style="margin:0 0 6px 0; color:${accentColor}; text-transform:uppercase; letter-spacing:1px; font-size:14px;">🔥 Hearth Infusion</h3>
        <p style="font-size:10.5px; color:#aaa; margin:0 0 12px 0;">Infusing resources into the Aetheric Hearth</p>
        <div style="height:1px; background:linear-gradient(90deg, transparent, ${accentColor}, transparent); margin-bottom:15px;"></div>

        <div style="background:#0c0f12; border:1px solid #222; padding:10px; border-radius:4px; font-family:monospace; font-size:11px; text-align:left; margin-bottom:15px; display:flex; flex-direction:column; gap:4px;">
            <div style="display:flex; justify-content:space-between;"><span>• Balance:</span><strong style="color:#fff;">${balance.toLocaleString()} ${resName}</strong></div>
            <div style="display:flex; justify-content:space-between;"><span>• Earned Renown:</span><strong id="he-renown-calc" style="color:#2ecc71;">+0 Renown</strong></div>
        </div>

        <div style="margin-bottom:15px;">
            <input type="range" id="he-donate-slider" min="1" max="${balance}" value="${balance}" style="width:100%; height:4px; accent-color:${accentColor}; cursor:pointer;" oninput="window.updateHearthDonateModal(${balance}, '${resName}')" />
            <div style="display:flex; gap:6px; justify-content:center; align-items:center; margin-top:8px;">
                <input type="number" id="he-donate-num-input" min="1" max="${balance}" value="${balance}" style="width:90px; background:#111; color:#fff; border:1px solid #444; border-radius:3px; padding:4px; text-align:center; font-family:monospace; font-size:11px;" oninput="window.updateHearthDonateModalNum(${balance}, '${resName}')" />
                <span style="font-size:11px; color:#666;">/ ${balance.toLocaleString()}</span>
            </div>
        </div>

        <div style="display:grid; grid-template-columns: repeat(4, 1fr); gap:4px; margin-bottom:20px;">
            <button class="sub-tab-btn" style="padding:4px; font-size:9px; height:24px;" onclick="window.setHearthDonatePercent(0.25, ${balance}, '${resName}')">25%</button>
            <button class="sub-tab-btn" style="padding:4px; font-size:9px; height:24px;" onclick="window.setHearthDonatePercent(0.50, ${balance}, '${resName}')">50%</button>
            <button class="sub-tab-btn" style="padding:4px; font-size:9px; height:24px;" onclick="window.setHearthDonatePercent(0.75, ${balance}, '${resName}')">75%</button>
            <button class="sub-tab-btn" style="padding:4px; font-size:9px; height:24px;" onclick="window.setHearthDonatePercent(1.0, ${balance}, '${resName}')">MAX</button>
        </div>

        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
            <button class="btn-action" style="background:#222; border:1px solid #444; color:#aaa; font-weight:bold; padding:10px; font-size:11px;" onclick="document.getElementById('hearth-donation-modal-overlay').remove()">Cancel</button>
            <button class="btn-action" style="background:${accentColor}; color:#111; font-weight:bold; padding:10px; font-size:11px; border:1px solid #fff;" onclick="window.submitHearthDonation('${resName}')">Confirm</button>
        </div>
    </div>
  `;

  window.updateHearthDonateModal(balance, resName);
};

window.updateHearthDonateModal = function (limit, resName) {
  let slider = document.getElementById("he-donate-slider");
  let input = document.getElementById("he-donate-num-input");
  let renownText = document.getElementById("he-renown-calc");
  if (!slider || !input || !renownText) return;

  let val = parseInt(slider.value, 10) || 1;
  input.value = val;

  let earned = 0;
  if (resName === "Gold") {
    // Standard static scale: 1 Renown per 10k Gold
    earned = Math.floor(val / 10000);
    if (earned < 1 && val > 0) earned = 1;
  } else {
    earned = resName.includes("Monster") ? val * 5 : val * 150;
  }
  renownText.innerText = `+${earned.toLocaleString()} Renown`;
};

window.updateHearthDonateModalNum = function (limit, resName) {
  let slider = document.getElementById("he-donate-slider");
  let input = document.getElementById("he-donate-num-input");
  let renownText = document.getElementById("he-renown-calc");
  if (!slider || !input || !renownText) return;

  let val = parseInt(input.value, 10) || 1;
  if (val < 1) val = 1;
  if (val > limit) val = limit;
  slider.value = val;

  let earned = 0;
  if (resName === "Gold") {
    earned = Math.floor(val / 10000);
    if (earned < 1 && val > 0) earned = 1;
  } else {
    earned = resName.includes("Monster") ? val * 5 : val * 150;
  }
  renownText.innerText = `+${earned.toLocaleString()} Renown`;
};

window.setHearthDonatePercent = function (pct, limit, resName) {
  let slider = document.getElementById("he-donate-slider");
  if (!slider) return;
  slider.value = Math.max(1, Math.floor(limit * pct));
  window.updateHearthDonateModal(limit, resName);
};

window.submitHearthDonation = function (resName) {
  let input = document.getElementById("he-donate-num-input");
  if (!input) return;

  let val = parseInt(input.value, 10) || 0;
  if (val <= 0) return;

  document.getElementById("hearth-donation-modal-overlay").remove();

  // Call the same backend route, passing "Aetheric Hearth" key triggers
  let skillKey = "hearth_infusion";
  let resType =
    resName === "Gold"
      ? "gold"
      : resName.includes("Monster")
        ? "souls"
        : "luminous";

  window.executeClanResearchDonate(skillKey, resType, val);
};

window.previewClanEmblem = function (seed, level) {
  let valSpan = document.getElementById("settings-emblem-preview-val");
  if (valSpan) valSpan.innerText = seed;

  let liveIconBox = document.getElementById("settings-emblem-live-indicator");
  if (liveIconBox) {
    liveIconBox.innerHTML = window.getClanEmblemHtml(
      parseInt(seed, 10),
      32,
      level,
    );
  }
};

window.openVaultAllocationModal = function (
  skillKey,
  resType,
  requiredAmt,
  currentAmt,
) {
  let needed = requiredAmt - currentAmt;
  if (needed <= 0) return;

  let clan = window.lastFetchedClanData;
  if (!clan) return;

  let labelMap = {
    steel_phalanx: "Steel Phalanx",
    vitality_well: "Vitality Well",
    prosperity_accord: "Prosperity Accord",
    voyagers_guidance: "Voyager's Guidance",
    aetheric_wisdom: "Aetheric Wisdom",
    clan_supply_depot: "Supply Depot",
  };

  let skillName = labelMap[skillKey] || "Research";
  let vaultBalance = 0;
  let rawName = "";
  let accentColor = "#ff007f"; // Royal pink for administrative fund actions

  if (resType === "gold") {
    vaultBalance = clan.gold_bank || 0;
    rawName = "Gold";
  } else {
    let rawSoulName =
      skillKey === "steel_phalanx" || skillKey === "vitality_well"
        ? "souls_bank"
        : "luminous_bank";
    vaultBalance = clan[rawSoulName] || 0;
    rawName = rawSoulName === "souls_bank" ? "Monster Souls" : "Luminous Souls";
  }

  let limit = Math.min(vaultBalance, needed);
  if (limit <= 0) {
    window.pushHeaderToast(
      `❌ General Vault lacks sufficient ${rawName} reserves!`,
      "#e74c3c",
    );
    return;
  }

  let overlay = document.createElement("div");
  overlay.id = "vault-allocation-modal-overlay";
  overlay.style.position = "fixed";
  overlay.style.top = "0";
  overlay.style.left = "0";
  overlay.style.width = "100%";
  overlay.style.height = "100%";
  overlay.style.backgroundColor = "rgba(0,0,0,0.85)";
  overlay.style.display = "flex";
  overlay.style.justifyContent = "center";
  overlay.style.alignItems = "center";
  overlay.style.zIndex = "40000";
  overlay.style.backdropFilter = "blur(4px)";
  document.body.appendChild(overlay);

  overlay.innerHTML = `
    <div style="background:#151515; border: 2px solid ${accentColor}; border-radius: 8px; width:90%; max-width:380px; padding:20px; box-shadow:0 10px 30px rgba(0,0,0,0.95); text-align:center;">
        <h3 style="margin:0 0 6px 0; color:${accentColor}; text-transform:uppercase; letter-spacing:1px; font-size:14px;">🏛️ Vault Fund Allocation</h3>
        <p style="font-size:10.5px; color:#aaa; margin:0 0 12px 0;">Funding <strong>${skillName}</strong> from General Vault</p>
        <div style="height:1px; background:linear-gradient(90deg, transparent, ${accentColor}, transparent); margin-bottom:15px;"></div>

        <div style="background:#0c0f12; border:1px solid #222; padding:10px; border-radius:4px; font-family:monospace; font-size:11px; text-align:left; margin-bottom:15px; display:flex; flex-direction:column; gap:4px;">
            <div style="display:flex; justify-content:space-between;"><span>• Vault Reserves:</span><strong style="color:#fff;">${vaultBalance.toLocaleString()} ${rawName}</strong></div>
            <div style="display:flex; justify-content:space-between;"><span>• Required to Max:</span><strong style="color:${accentColor};">${needed.toLocaleString()} ${rawName}</strong></div>
        </div>

        <div style="margin-bottom:15px;">
            <input type="range" id="va-donate-slider" min="1" max="${limit}" value="${limit}" style="width:100%; height:4px; accent-color:${accentColor}; cursor:pointer;" oninput="window.updateVaultAllocationModal(${limit})" />
            <div style="display:flex; gap:6px; justify-content:center; align-items:center; margin-top:8px;">
                <input type="number" id="va-donate-num-input" min="1" max="${limit}" value="${limit}" style="width:90px; background:#111; color:#fff; border:1px solid #444; border-radius:3px; padding:4px; text-align:center; font-family:monospace; font-size:11px;" oninput="window.updateVaultAllocationModalNum(${limit})" />
                <span style="font-size:11px; color:#666;">/ ${limit.toLocaleString()}</span>
            </div>
        </div>

        <div style="display:grid; grid-template-columns: repeat(4, 1fr); gap:4px; margin-bottom:20px;">
            <button class="sub-tab-btn" style="padding:4px; font-size:9px; height:24px;" onclick="window.setVaultAllocationPercent(0.25, ${limit})">25%</button>
            <button class="sub-tab-btn" style="padding:4px; font-size:9px; height:24px;" onclick="window.setVaultAllocationPercent(0.50, ${limit})">50%</button>
            <button class="sub-tab-btn" style="padding:4px; font-size:9px; height:24px;" onclick="window.setVaultAllocationPercent(0.75, ${limit})">75%</button>
            <button class="sub-tab-btn" style="padding:4px; font-size:9px; height:24px;" onclick="window.setVaultAllocationPercent(1.0, ${limit})">MAX</button>
        </div>

        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
            <button class="btn-action" style="background:#222; border:1px solid #444; color:#aaa; font-weight:bold; padding:10px; font-size:11px;" onclick="document.getElementById('vault-allocation-modal-overlay').remove()">Cancel</button>
            <button class="btn-action" style="background:${accentColor}; color:#fff; font-weight:bold; padding:10px; font-size:11px; border:1px solid #fff;" onclick="window.submitVaultAllocation('${skillKey}', '${resType}')">Confirm Allocation</button>
        </div>
    </div>
  `;

  window.updateVaultAllocationModal(limit);
};

window.updateVaultAllocationModal = function (limit) {
  let slider = document.getElementById("va-donate-slider");
  let input = document.getElementById("va-donate-num-input");
  if (!slider || !input) return;

  input.value = parseInt(slider.value, 10) || 1;
};

window.updateVaultAllocationModalNum = function (limit) {
  let slider = document.getElementById("va-donate-slider");
  let input = document.getElementById("va-donate-num-input");
  if (!slider || !input) return;

  let val = parseInt(input.value, 10) || 1;
  if (val < 1) val = 1;
  if (val > limit) val = limit;
  slider.value = val;
};

window.setVaultAllocationPercent = function (pct, limit) {
  let slider = document.getElementById("va-donate-slider");
  if (!slider) return;
  slider.value = Math.max(1, Math.floor(limit * pct));
  window.updateVaultAllocationModal(limit);
};

window.submitVaultAllocation = function (skillKey, resType) {
  let input = document.getElementById("va-donate-num-input");
  if (!input) return;

  let val = parseInt(input.value, 10) || 0;
  if (val <= 0) return;

  document.getElementById("vault-allocation-modal-overlay").remove();
  window.executeClanVaultAllocate(skillKey, resType, val);
};

window.executeClanVaultAllocate = function (skillKey, resType, amount) {
  const clan = window.lastFetchedClanData;
  if (!clan) return;

  // Local-Only Simulation Fallback to allow immediate testing without backend redeploys
  const runLocalSimulation = () => {
    let isGold = resType === "gold";
    let bankField = isGold
      ? "gold_bank"
      : skillKey === "steel_phalanx" || skillKey === "vitality_well"
        ? "souls_bank"
        : "luminous_bank";

    clan[bankField] = Math.max(0, (clan[bankField] || 0) - amount);

    let progress = (clan.research_progress = clan.research_progress || {});
    let skillProgress = (progress[skillKey] = progress[skillKey] || {
      gold: 0,
      souls: 0,
    });

    let currentL = window.playerStats.clanSkills[skillKey] || 0;
    let costGold = 0;
    let costSoul = 0;
    if (skillKey === "steel_phalanx" || skillKey === "vitality_well") {
      costGold = Math.floor(
        (skillKey === "steel_phalanx" ? 25000 : 20000) *
          Math.pow(1.35, currentL),
      );
      costSoul = Math.floor(200 * Math.pow(1.25, currentL));
    } else {
      let baseG =
        skillKey === "prosperity_accord"
          ? 40000
          : skillKey === "voyagers_guidance"
            ? 50000
            : skillKey === "clan_supply_depot"
              ? 55000
              : 45000;
      let baseS =
        skillKey === "aetheric_wisdom"
          ? 6
          : skillKey === "clan_supply_depot"
            ? 8
            : 5; // Resolved ReferenceError crash
      let scaleG = skillKey === "clan_supply_depot" ? 1.45 : 1.4;
      let scaleS = skillKey === "clan_supply_depot" ? 1.35 : 1.3;
      costGold = Math.floor(baseG * Math.pow(scaleG, currentL));
      costSoul = Math.floor(baseS * Math.pow(scaleS, currentL));
    }
    // Group Cooperative Model: Scale costs purely based on Clan Level and Research Level
    let clanLvl = clan.level || 1;
    costGold = Math.floor(costGold * (1.0 + clanLvl * 0.15) * 20);

    let leveledUp = false;
    if (isGold) {
      skillProgress.gold = Math.min(
        costGold,
        (skillProgress.gold || 0) + amount,
      );
    } else {
      skillProgress.souls = Math.min(
        costSoul,
        (skillProgress.souls || 0) + amount,
      );
    }

    if (skillProgress.gold >= costGold && skillProgress.souls >= costSoul) {
      leveledUp = true;
      skillProgress.gold = 0;
      skillProgress.souls = 0;
      window.playerStats.clanSkills[skillKey] = currentL + 1;
      clan.level = (clan.level || 1) + 1;
    }

    let label = isGold ? "Gold" : "Souls";
    window.pushHeaderToast(
      `✓ Allocated +${amount.toLocaleString()} ${label} from Vault (Simulated)!`,
      "#2ecc71",
    );
    if (window.SoundManager) window.SoundManager.play("revive");

    if (leveledUp) {
      window.pushHeaderToast(
        `🎉 Research Upgraded to Lv. ${currentL + 1}!`,
        "#ffd700",
      );
      if (window.spawnPurchaseCelebration) {
        window.spawnPurchaseCelebration("alchemy", "#ff007f", 5);
      }
    }
    window.renderClanDashboard(clan, clan.members || [], []);
    window.updateUI();
    window.saveGame();
  };

  if (!window.GAME_SERVER_URL) {
    runLocalSimulation();
    return;
  }

  const userId = window.getGameUserId();
  fetch(`${window.GAME_SERVER_URL}/api/clan/vault-allocate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, skillKey, resType, amount }),
  })
    .then((r) => {
      if (!r.ok) {
        throw new Error(`Status ${r.status}`);
      }
      return r.json();
    })
    .then((data) => {
      if (data.success) {
        let label = resType === "gold" ? "Gold" : "Souls";
        window.pushHeaderToast(
          `✓ Allocated +${amount.toLocaleString()} ${label} from General Vault reserves!`,
          "#2ecc71",
        );
        if (window.SoundManager) window.SoundManager.play("revive");

        if (data.leveledUp) {
          window.pushHeaderToast(
            `🎉 Research Upgraded to Lv. ${data.newLevel}!`,
            "#ffd700",
          );
          if (window.spawnPurchaseCelebration) {
            window.spawnPurchaseCelebration("alchemy", "#ff007f", 5);
          }
        }

        window.fetchClanData();
        window.updateUI();
        window.saveGame();
      } else {
        window.pushHeaderToast(`❌ ${data.error}`, "#e74c3c");
      }
    })
    .catch((err) => {
      console.warn(
        "Server route not found or unreachable. Falling back to local simulation.",
        err,
      );
      runLocalSimulation();
    });
};

// Claim weekly clan crate & trigger instant high-fidelity unboxing animation
window.claimWeeklyClanCrate = function (e) {
  if (e) {
    e.stopPropagation();
    e.preventDefault();
  }

  if (!window.GAME_SERVER_URL) return;

  const userId = window.getGameUserId();
  fetch(`${window.GAME_SERVER_URL}/api/clan/claim-crate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success && data.weekId) {
        window.playerStats.lastClaimedCrateWeek = data.weekId;
        window.playerStats.weeklyClanCrateClaimed = true; // Sync legacy variable

        // Auto-opens the Weekly Clan Supply Crate on the client instantly!
        if (typeof window.openWeeklyRewardSack === "function") {
          window.openWeeklyRewardSack("Weekly Clan Supply Crate");
        }

        window.fetchClanData();
        window.updateUI();
        window.saveGame();
      } else {
        window.pushHeaderToast(
          `[ERROR] ${data.error || "Could not claim."}`,
          "#e74c3c",
        );
      }
    })
    .catch((err) => {
      console.error("Crate claim failed:", err);
      window.pushHeaderToast(
        "[ERROR] Connection error claiming rewards.",
        "#e74c3c",
      );
    });
};

window.inspectClan = function (clanId) {
  if (!window.GAME_SERVER_URL) {
    window.pushHeaderToast("🔒 Offline mode. Cannot inspect clan.", "#e74c3c");
    return;
  }

  window.hideTooltip();
  let existing = document.getElementById("clan-inspect-draggable-window");
  if (existing) existing.remove();

  let win = document.createElement("div");
  win.id = "clan-inspect-draggable-window";
  win.className = "draggable-window";
  win.style.left = "110px";
  win.style.top = "90px";
  win.style.width = "500px";
  win.style.zIndex = "42000";

  win.innerHTML = `
            <div class="draggable-header" id="clan-inspect-win-handle" style="background: linear-gradient(180deg, #181d24 0%, #0d1117 100%);">
                <span style="display:flex; align-items:center; gap:6px;">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                        <path d="M12 8v8M9 11h6"/>
                    </svg>
                    Inspecting Clan...
                </span>
                <button onclick="document.getElementById('clan-inspect-draggable-window').remove(); window.hideTooltip();" style="background:transparent; border:none; color:#e74c3c; font-weight:bold; cursor:pointer; font-size:11px; padding:2px;">[X]</button>
            </div>
            <div class="draggable-content" id="clan-inspect-win-content" style="max-height: 400px; padding: 12px; background:#07030b; overflow-y:auto;">
                <div style="color:#aaa; text-align:center; padding: 20px 0; font-size:11px;">Connecting to Clan Sanctum...</div>
            </div>
          `;

  document.getElementById("game-container").appendChild(win);
  window.makeWindowDraggable(
    win,
    document.getElementById("clan-inspect-win-handle"),
  );

  fetch(`${window.GAME_SERVER_URL}/api/clan/inspect`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ clanId }),
  })
    .then((r) => r.json())
    .then((data) => {
      if (data.success && data.clan) {
        window.renderClanInspectContent(data.clan, data.members);
      } else {
        document.getElementById("clan-inspect-win-content").innerHTML = `
                                <div style="color:#e74c3c; text-align:center; padding: 20px 0; font-size:11px;">Error loading clan records: ${data.error || "Unknown error"}</div>
                              `;
      }
    })
    .catch((err) => {
      console.error("Clan inspect fetch failed:", err);
      document.getElementById("clan-inspect-win-content").innerHTML = `
                              <div style="color:#e74c3c; text-align:center; padding: 20px 0; font-size:11px;">Could not connect to the Clan Sanctum server.</div>
                            `;
    });
};

window.renderClanInspectContent = function (clan, members) {
  const contentEl = document.getElementById("clan-inspect-win-content");
  if (!contentEl) return;

  let emblemSeed =
    clan.emblem !== undefined ? clan.emblem : clan.leader_id.charCodeAt(0) || 0;
  let emblem = window.getClanEmblemHtml(emblemSeed, 32, clan.level);
  let nextXp = Math.floor(100 * Math.pow(clan.level, 1.8));
  let xpPct = Math.min(100, (clan.xp / nextXp) * 100);

  let skills = [
    {
      label: "Steel Phalanx",
      val: clan.skill_steel_phalanx || 0,
      color: "#e74c3c",
      desc: "Attack & Defense bonus",
    },
    {
      label: "Vitality Well",
      val: clan.skill_vitality_well || 0,
      color: "#3498db",
      desc: "Max HP bonus",
    },
    {
      label: "Prosperity Accord",
      val: clan.skill_prosperity_accord || 0,
      color: "#f1c40f",
      desc: "Gold Multiplier",
    },
    {
      label: "Voyager's Guidance",
      val: clan.skill_voyagers_guidance || 0,
      color: "#2ecc71",
      desc: "Drop Rate & Quality",
    },
    {
      label: "Aetheric Wisdom",
      val: clan.skill_aetheric_wisdom || 0,
      color: "#9b59b6",
      desc: "XP Rate",
    },
    {
      label: "Supply Depot",
      val: clan.skill_clan_supply_depot || 0,
      color: "#ffaa00",
      desc: "Crate yields",
    },
  ];

  let skillsHtml = skills
    .map(
      (s) => `
                      <div style="background:#0f1115; border:1px solid #222; border-left:3.5px solid ${s.color} !important; padding:6px; border-radius:4px; text-align:left;">
                        <div style="display:flex; justify-content:space-between; align-items:center;">
                          <strong style="color:${s.color}; font-size:10.5px;">${s.label}</strong>
                          <span style="color:#fff; font-family:monospace; font-size:10.5px;">Lv. ${s.val}</span>
                        </div>
                        <span style="font-size:8.5px; color:#aaa; display:block; margin-top:2px;">${s.desc}</span>
                      </div>
                    `,
    )
    .join("");

  let rosterHtml = members
    .map((m) => {
      let mId = m.userId || m.user_id;
      let canvasId = `clan-inspect-member-canvas-${mId}`;

      let titleTextHtml = "";
      if (m.equippedTitle && window.TITLES_DATA[m.equippedTitle]) {
        let tData = window.TITLES_DATA[m.equippedTitle];
        titleTextHtml = `<span style="color:${tData.color || "#ff007f"}; font-size:8px; font-weight:bold; margin-left:4px;">[${tData.name}]</span>`;
      }

      return `
                        <div style="background:#111; border:1px solid #222; border-radius:6px; padding:6px 10px; display:flex; justify-content:space-between; align-items:center; gap:8px;">
                            <div style="display:flex; align-items:center; gap:8px; min-width:0; flex:1; text-align:left;">
                                <div style="position:relative; flex-shrink:0;">
                                  <canvas id="${canvasId}" width="30" height="40" style="width:30px; height:40px; background:rgba(0,0,0,0.4); border:1px solid #333; border-radius:4px; display:block; pointer-events:none;"></canvas>
                                  <div style="position:absolute; bottom:-3px; right:-3px; z-index:4;">${window.getRankShieldSvg(m.clan_rank || "recruit", 14)}</div>
                                </div>
                                <div style="min-width:0; flex:1;">
                                    <div style="display:flex; align-items:center; flex-wrap:wrap; line-height:1.1;">
                                        <strong style="font-size:11.5px; color:#fff; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; max-width:110px;">${window.escapeHTML(m.playerName || m.name)}</strong>
                                        ${titleTextHtml}
                                    </div>
                                    <span style="font-size:9px; color:#aaa; font-family:monospace; display:block; margin-top:2px;">Lv. ${m.level} • Peak Stg ${m.lifetimePeakStage} • Contribution: ${window.formatNumber(m.clanContribution || 0)}</span>
                                </div>
                            </div>
                            <button class="btn-action" style="background:#3498db; font-size:9.5px; padding:3px 6px; height:24px; line-height:1;" onclick="window.inspectPlayer('${mId}')">Inspect</button>
                        </div>
                      `;
    })
    .join("");

  contentEl.innerHTML = `
                    <!-- Header banner -->
                    <div style="background:rgba(0,0,0,0.5); border: 2px solid #5c4033; border-top-width:6px; border-bottom-width:4px; border-radius:8px; padding:12px; margin-bottom:12px; display:flex; align-items:center; gap:12px; text-align:left; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.7); position:relative;">
                        ${emblem}
                        <div style="flex:1; min-width:0;">
                            <strong style="font-size:14.5px; color:#df9ffb; text-shadow: 0 0 8px rgba(155,89,182,0.4);">${window.escapeHTML(clan.name)}</strong>
                            <div style="font-size:10.5px; color:#aaa; font-family:monospace;">Clan Level ${clan.level} (${clan.xp} / ${nextXp} XP)</div>
                            <div style="width:100%; height:5px; background:#0f1115; border-radius:3px; overflow:hidden; border:1px solid #222; margin-top:6px;">
                                <div style="width:${xpPct}%; height:100%; background:linear-gradient(90deg, #9b59b6, #e84393); box-shadow:0 0 6px #9b59b6;"></div>
                            </div>
                        </div>
                    </div>

                    <!-- Custom Announcement -->
                    <div style="background:#0c0f12; border:1px solid #222; border-radius:6px; padding:8px 10px; font-size:11px; text-align:left; line-height:1.45; color:#c8b195; font-style:italic; margin-bottom:12px;">
                        <span style="color:#7f8c8d; font-size:8px; font-weight:bold; display:block; margin-bottom:2px; text-transform:uppercase; font-style:normal;">✦ ANNOUNCEMENT:</span>
                        "${window.escapeHTML(clan.description || "Founders are preparing instructions.")}"
                    </div>

                    <!-- Upgraded Skill Matrices -->
                    <strong style="color:#df9ffb; font-size:11px; display:block; margin-bottom:6px; text-transform:uppercase; letter-spacing:0.5px; text-align:left;">⚔️ Clan Research Matrix:</strong>
                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:6px; margin-bottom:12px;">
                      ${skillsHtml}
                    </div>

                    <!-- Member Roster -->
                                        <strong style="color:#df9ffb; font-size:11px; display:block; margin-bottom:6px; text-transform:uppercase; letter-spacing:0.5px; text-align:left;">👥 Member Roster (${members.length}):</strong>
                                        <div style="display:flex; flex-direction:column; gap:4px; max-height:150px; overflow-y:auto; padding-right:4px;">
                                          ${rosterHtml}
                                        </div>
                                      `;

  // Draw heroes for the inspect roster
  setTimeout(() => {
    members.forEach((m) => {
      let mId = m.userId || m.user_id;
      let canvas = document.getElementById(`clan-inspect-member-canvas-${mId}`);
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
};
