/* ==========================================================================
   PRIMARY PURPOSE: Manages all UI interactions, DOM updates, menus,
   tooltips, and modal displays.
   ========================================================================= */

window.getEquipIconHtml = function (item, size = 32) {
  if (!item) return "";
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

  if (item.type === "artifact" || item.statsRolled === "UNIQUE") {
    return window.getArtifactIconHtml(item.trait, size);
  }
  if (isUnique) {
    return window.getUniqueIconHtml(item, size);
  }

  // Draw custom procedural generic equipment icons based on slot!
  let color = window.getTierColor(item.statsRolled);
  let id = item.id || Math.floor(Math.random() * 100000);
  let svg = "";

  if (item.type === "weapon") {
    svg = `<svg viewBox="0 0 32 32" width="100%" height="100%">
                <defs>
                    <linearGradient id="gen_w_blade_${id}" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stop-color="#ffffff"/>
                        <stop offset="50%" stop-color="${color}"/>
                        <stop offset="100%" stop-color="#555555"/>
                    </linearGradient>
                </defs>
                <path d="M16 3 L19 8 L18 21 L14 21 L13 8 Z" fill="url(#gen_w_blade_${id})" stroke="#000" stroke-width="1.8" />
                <rect x="11" y="21" width="10" height="2.5" rx="0.5" fill="#f1c40f" stroke="#000" stroke-width="1.2" />
                <rect x="14.5" y="23.5" width="3" height="5" fill="#5c3a21" stroke="#000" stroke-width="1" />
                <circle cx="16" cy="29.5" r="1.5" fill="#f1c40f" stroke="#000" stroke-width="1" />
            </svg>`;
  } else if (item.type === "subweapon") {
    if (item.subType === "shield") {
      svg = `<svg viewBox="0 0 32 32" width="100%" height="100%">
                    <defs>
                        <linearGradient id="gen_w_sh_${id}" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stop-color="${color}"/>
                            <stop offset="100%" stop-color="#2c3e50"/>
                        </linearGradient>
                    </defs>
                    <path d="M6 6 Q16 4, 26 6 Q25 18, 16 28 Q7 18, 6 6 Z" fill="url(#gen_w_sh_${id})" stroke="#000" stroke-width="1.8" />
                    <path d="M11 11 Q16 9, 21 11 L19 19 Q16 23, 16 23 Q16 23, 13 19 Z" fill="none" stroke="#ffffff" stroke-width="1.2" opacity="0.55" />
                </svg>`;
    } else if (item.subType === "dagger") {
      svg = `<svg viewBox="0 0 32 32" width="100%" height="100%">
                    <path d="M16 4 L18 9 L17 19 L15 19 L14 9 Z" fill="#bdc3c7" stroke="#000" stroke-width="1.8" />
                    <rect x="12" y="19" width="8" height="2" fill="${color}" stroke="#000" stroke-width="1.2" />
                    <rect x="14.5" y="21" width="3" height="4" fill="#3b2f2f" stroke="#000" stroke-width="1" />
                </svg>`;
    } else {
      // tome
      svg = `<svg viewBox="0 0 32 32" width="100%" height="100%">
                    <rect x="8" y="6" width="16" height="20" rx="1.5" fill="${color}" stroke="#000" stroke-width="2" />
                    <rect x="10" y="8" width="12" height="16" fill="#ffffff" opacity="0.9" rx="1" />
                    <line x1="12" y1="12" x2="20" y2="12" stroke="#444444" stroke-width="1.2" />
                    <line x1="12" y1="16" x2="18" y2="16" stroke="#444444" stroke-width="1.2" />
                </svg>`;
    }
  } else if (item.type === "helmet") {
    svg = `<svg viewBox="0 0 32 32" width="100%" height="100%">
                <defs>
                    <linearGradient id="gen_w_helm_${id}" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stop-color="#bdc3c7"/>
                        <stop offset="100%" stop-color="#34495e"/>
                    </linearGradient>
                </defs>
                <path d="M16 4 C10 4, 6 10, 6 18 L26 18 C26 10, 22 4, 16 4 Z" fill="url(#gen_w_helm_${id})" stroke="#000" stroke-width="1.8" />
                <path d="M7 18 L10 26 L22 26 L25 18 Z" fill="#2c3e50" stroke="#000" stroke-width="1.8" />
                <rect x="9" y="12" width="14" height="4" fill="${color}" stroke="#000" stroke-width="1" />
            </svg>`;
  } else if (item.type === "chest") {
    svg = `<svg viewBox="0 0 32 32" width="100%" height="100%">
                <path d="M6 7 L26 7 L24 22 C22 26, 10 26, 8 22 Z" fill="#7f8c8d" stroke="#000" stroke-width="1.8" />
                <path d="M12 7 Q16 12, 20 7" fill="#111111" stroke="#000" stroke-width="1.2" />
                <rect x="10" y="13" width="12" height="4" fill="${color}" opacity="0.85" rx="1" stroke="#000" stroke-width="1" />
            </svg>`;
  } else if (item.type === "leggings") {
    svg = `<svg viewBox="0 0 32 32" width="100%" height="100%">
                <path d="M7 6 L25 6 L23 16 L20 28 L17 28 L18 16 L14 16 L15 28 L12 28 L9 16 Z" fill="#7f8c8d" stroke="#000" stroke-width="1.8" stroke-linejoin="round" />
                <rect x="9" y="10" width="14" height="3" fill="${color}" stroke="#000" stroke-width="1" />
            </svg>`;
  } else if (item.type === "overall") {
    svg = `<svg viewBox="0 0 32 32" width="100%" height="100%">
                <path d="M10 6 L22 6 L27 28 L5 28 Z" fill="${color}" stroke="#000" stroke-width="2" />
                <path d="M8 8 L13 6 L12 12 Z M24 8 L19 6 L20 12 Z" fill="#bdc3c7" stroke="#000" stroke-width="1.5" />
            </svg>`;
  } else if (item.type === "boots") {
    svg = `<svg viewBox="0 0 32 32" width="100%" height="100%">
                <path d="M4 10 L10 6 L11 18 L16 24 L16 27 L4 27 Z" fill="#7f8c8d" stroke="#000" stroke-width="1.8" stroke-linejoin="round" />
                <path d="M16 10 L22 6 L23 18 L28 24 L28 27 L16 27 Z" fill="#7f8c8d" stroke="#000" stroke-width="1.8" stroke-linejoin="round" />
                <rect x="4" y="14" width="6" height="2.5" fill="${color}" stroke="#000" stroke-width="1" />
                <rect x="16" y="14" width="6" height="2.5" fill="${color}" stroke="#000" stroke-width="1" />
            </svg>`;
  } else {
    svg = `<svg width="100%" height="100%" viewBox="0 0 32 32">
                <circle cx="16" cy="16" r="10" fill="${color}" stroke="#000000" stroke-width="1.5"/>
            </svg>`;
  }

  let bg = "rgba(170, 170, 170, 0.12)";
  let border = "#444";
  return `<span style="background: ${bg}; border: 1px solid ${border}; border-radius: 4px; padding: 4px; display: inline-flex; align-items: center; justify-content: center; width: ${size}px; height: ${size}px; box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.6);">${svg}</span>`;
};

window.getBossIconHtml = function (bossType) {
  let uid = Math.floor(Math.random() * 10000000);
  if (bossType === "guardian") {
    return `
            <svg width="56" height="56" viewBox="0 0 64 64" style="display:block; margin: 0 auto; filter: drop-shadow(0 0 6px rgba(52, 152, 219, 0.45));">
                <defs>
                    <linearGradient id="g_goliath_${uid}" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#34495e"/><stop offset="100%" stop-color="#1a252f"/></linearGradient>
                    <radialGradient id="g_core_${uid}" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="#ffffff"/><stop offset="40%" stop-color="#00d2ff"/><stop offset="100%" stop-color="#003755"/></radialGradient>
                </defs>
                <path d="M32 4 L52 14 L46 44 L32 58 L18 44 L12 14 Z" fill="url(#g_goliath_${uid})" stroke="#00d2ff" stroke-width="2.5" stroke-linejoin="round" />
                <circle cx="32" cy="30" r="10" fill="url(#g_core_${uid})" stroke="#fff" stroke-width="1.5" />
                <polygon points="26,24 20,22 24,28" fill="#e74c3c" />
                <polygon points="38,24 44,22 40,28" fill="#e74c3c" />
            </svg>`;
  } else if (bossType === "chronos") {
    return `
            <svg width="56" height="56" viewBox="0 0 64 64" style="display:block; margin: 0 auto; filter: drop-shadow(0 0 6px rgba(241, 196, 15, 0.45));">
                <defs><linearGradient id="g_chron_${uid}" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#ffd700"/><stop offset="100%" stop-color="#b7950b"/></linearGradient></defs>
                <circle cx="32" cy="32" r="24" fill="none" stroke="url(#g_chron_${uid})" stroke-width="3" />
                <g stroke="url(#g_chron_${uid})" stroke-width="3" stroke-linecap="round"><line x1="32" y1="4" x2="32" y2="8" /><line x1="32" y1="56" x2="32" y2="60" /><line x1="4" y1="32" x2="8" y2="32" /><line x1="56" y1="32" x2="60" y2="32" /></g>
                <circle cx="32" cy="32" r="16" fill="#111" stroke="url(#g_chron_${uid})" stroke-width="1.5" />
                <line x1="32" y1="32" x2="32" y2="20" stroke="#fff" stroke-width="2" stroke-linecap="round" />
                <line x1="32" y1="32" x2="40" y2="32" stroke="#e67e22" stroke-width="1.5" stroke-linecap="round" />
            </svg>`;
  } else if (bossType === "nexus") {
    return `
            <svg width="56" height="56" viewBox="0 0 64 64" style="display:block; margin: 0 auto; filter: drop-shadow(0 0 6px rgba(255, 0, 127, 0.45));">
                <defs><linearGradient id="g_nex_${uid}" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#ff007f"/><stop offset="100%" stop-color="#00d2ff"/></linearGradient></defs>
                <rect x="14" y="14" width="36" height="36" fill="none" stroke="url(#g_nex_${uid})" stroke-width="2" />
                <rect x="20" y="20" width="24" height="24" fill="none" stroke="#00b894" stroke-width="1.5" />
                <circle cx="32" cy="32" r="4" fill="#fff" stroke="#ff007f" stroke-width="1" />
            </svg>`;
  }
  return `🔮`;
};

window.getEtcIconHtml = function (key) {
  let uid = Math.floor(Math.random() * 10000000);
  let bg = "rgba(170, 170, 170, 0.12)";
  let border = "#444";
  let svgContent = "";

  if (key === "Eridium Shard") {
    bg = "rgba(155, 89, 182, 0.25)";
    border = "#9b59b6";
    svgContent = `
        <svg width="24" height="24" viewBox="0 0 32 32" style="display:block;">
            <defs>
                <linearGradient id="grad_EridiumShard_${uid}" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stop-color="#e84393" />
                    <stop offset="100%" stop-color="#8e44ad" />
                </linearGradient>
            </defs>
            <path d="M16 2 L26 16 L16 30 L6 16 Z" fill="url(#grad_EridiumShard_${uid})" stroke="#000" stroke-width="2" stroke-linejoin="round"/>
            <path d="M16 2 L16 30" stroke="rgba(255,255,255,0.4)" stroke-width="1.5"/>
            <path d="M6 16 L26 16" stroke="rgba(0,0,0,0.25)" stroke-width="1.5"/>
        </svg>`;
  } else if (key === "Gacha Key") {
    bg = "rgba(241, 196, 15, 0.25)";
    border = "#f1c40f";
    svgContent = `
        <svg width="24" height="24" viewBox="0 0 32 32" style="display:block;">
            <defs>
                <linearGradient id="grad_GachaKey_${uid}" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#ffd700" />
                    <stop offset="100%" stop-color="#b7950b" />
                </linearGradient>
            </defs>
            <circle cx="11" cy="21" r="6" fill="url(#grad_GachaKey_${uid})" stroke="#000" stroke-width="2" />
            <circle cx="11" cy="21" r="2.5" fill="#111" stroke="#000" stroke-width="1.5" />
            <path d="M15 17 L27 5 L30 8 L28 10 L26 8 L24 12 L22 10" stroke="#000" stroke-width="2" stroke-linejoin="round" fill="none" />
            <path d="M15.5 16.5 L26.5 5.5" stroke="url(#grad_GachaKey_${uid})" stroke-width="3" stroke-linecap="round" fill="none"/>
            <path d="M26.5 5.5 L28.5 7.5 M24.5 7.5 L26.5 9.5" stroke="url(#grad_GachaKey_${uid})" stroke-width="2" stroke-linecap="round"/>
        </svg>`;
  } else if (key === "Ancient Core") {
    bg = "rgba(231, 76, 60, 0.25)";
    border = "#e74c3c";
    svgContent = `
        <svg width="24" height="24" viewBox="0 0 32 32" style="display:block;">
            <defs>
                <radialGradient id="grad_AncientCore_${uid}" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stop-color="#ffffff" />
                    <stop offset="30%" stop-color="#e74c3c" />
                    <stop offset="100%" stop-color="#960018" />
                </radialGradient>
            </defs>
            <circle cx="16" cy="16" r="11" fill="url(#grad_AncientCore_${uid})" stroke="#000" stroke-width="2" />
            <path d="M5 16 L27 16" stroke="#000" stroke-width="2" />
            <path d="M16 5 L16 27" stroke="#000" stroke-width="2" />
            <circle cx="16" cy="16" r="4" fill="#fff" opacity="0.8" />
        </svg>`;
  } else if (key === "Overlord's Sigil") {
    bg = "rgba(26, 188, 156, 0.25)";
    border = "#1abc9c";
    svgContent = `
        <svg width="24" height="24" viewBox="0 0 32 32" style="display:block;">
            <defs>
                <linearGradient id="grad_OverlordsSigil_${uid}" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stop-color="#1abc9c" />
                    <stop offset="100%" stop-color="#16a085" />
                </linearGradient>
            </defs>
            <path d="M16 4 L19 14 L27 10 L24 20 L16 28 L8 20 L5 10 L13 14 Z" fill="url(#grad_OverlordsSigil_${uid})" stroke="#000" stroke-width="2" stroke-linejoin="round"/>
            <circle cx="16" cy="16" r="3.5" fill="#fff" stroke="#000" stroke-width="1.5" />
        </svg>`;
  } else if (key === "Astral Essence") {
    bg = "rgba(142, 68, 173, 0.25)";
    border = "#8e44ad";
    svgContent = `
        <svg width="24" height="24" viewBox="0 0 32 32" style="display:block;">
            <defs>
                <linearGradient id="grad_AstralEssence_${uid}" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#e84393" />
                    <stop offset="50%" stop-color="#9b59b6" />
                    <stop offset="100%" stop-color="#3498db" />
                </linearGradient>
            </defs>
            <path d="M16 3 L19 13 L29 16 L19 19 L16 29 L13 19 L3 16 L13 13 Z" fill="url(#grad_AstralEssence_${uid})" stroke="#000" stroke-width="2" stroke-linejoin="round" />
            <circle cx="16" cy="16" r="3" fill="#ffffff" opacity="0.9" />
        </svg>`;
  } else if (key === "Mythic Scrap") {
    bg = "rgba(231, 76, 60, 0.25)";
    border = "#e74c3c";
    svgContent = `
        <svg width="24" height="24" viewBox="0 0 32 32" style="display:block;">
            <defs>
                <linearGradient id="grad_MythicScrap_${uid}" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#ff7675" />
                    <stop offset="100%" stop-color="#d63031" />
                </linearGradient>
            </defs>
            <path d="M6 10 L18 4 L28 14 L24 26 L10 28 L4 18 Z" fill="url(#grad_MythicScrap_${uid})" stroke="#000" stroke-width="2" stroke-linejoin="round"/>
            <path d="M14 8 L24 16 M10 18 L20 22" stroke="rgba(255,255,255,0.3)" stroke-width="1.5" stroke-linecap="round"/>
        </svg>`;
  } else if (key === "Legendary Scrap") {
    bg = "rgba(241, 196, 15, 0.25)";
    border = "#f1c40f";
    svgContent = `
        <svg width="24" height="24" viewBox="0 0 32 32" style="display:block;">
            <defs>
                <linearGradient id="grad_LegendaryScrap_${uid}" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#ffeaa7" />
                    <stop offset="100%" stop-color="#fdcb6e" />
                </linearGradient>
            </defs>
            <path d="M8 6 L22 8 L26 22 L14 28 L4 16 Z" fill="url(#grad_LegendaryScrap_${uid})" stroke="#000" stroke-width="2" stroke-linejoin="round"/>
            <path d="M12 10 L20 18" stroke="rgba(255,255,255,0.4)" stroke-width="1.5" stroke-linecap="round"/>
        </svg>`;
  } else if (key === "Epic Scrap") {
    bg = "rgba(230, 126, 34, 0.25)";
    border = "#e67e22";
    svgContent = `
        <svg width="24" height="24" viewBox="0 0 32 32" style="display:block;">
            <defs>
                <linearGradient id="grad_EpicScrap_${uid}" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#ffbe76" />
                    <stop offset="100%" stop-color="#e67e22" />
                </linearGradient>
            </defs>
            <path d="M10 4 L26 8 L22 24 L8 26 Z" fill="url(#grad_EpicScrap_${uid})" stroke="#000" stroke-width="2" stroke-linejoin="round"/>
            <path d="M12 12 L20 16" stroke="rgba(255,255,255,0.3)" stroke-width="1.5" stroke-linecap="round"/>
        </svg>`;
  } else if (key === "Magic Scrap") {
    bg = "rgba(155, 89, 182, 0.25)";
    border = "#9b59b6";
    svgContent = `
        <svg width="24" height="24" viewBox="0 0 32 32" style="display:block;">
            <defs>
                <linearGradient id="grad_MagicScrap_${uid}" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#a29bfe" />
                    <stop offset="100%" stop-color="#6c5ce7" />
                </linearGradient>
            </defs>
            <path d="M6 14 L16 4 L28 12 L22 26 L10 24 Z" fill="url(#grad_MagicScrap_${uid})" stroke="#000" stroke-width="2" stroke-linejoin="round"/>
            <path d="M12 10 L18 20" stroke="rgba(255,255,255,0.4)" stroke-width="1.5" stroke-linecap="round"/>
        </svg>`;
  } else if (key === "Rare Scrap") {
    bg = "rgba(52, 152, 219, 0.25)";
    border = "#3498db";
    svgContent = `
        <svg width="24" height="24" viewBox="0 0 32 32" style="display:block;">
            <defs>
                <linearGradient id="grad_RareScrap_${uid}" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#74b9ff" />
                    <stop offset="100%" stop-color="#0984e3" />
                </linearGradient>
            </defs>
            <path d="M4 8 L18 6 L28 16 L16 28 L6 20 Z" fill="url(#grad_RareScrap_${uid})" stroke="#000" stroke-width="2" stroke-linejoin="round"/>
            <path d="M10 12 L20 18" stroke="rgba(255,255,255,0.4)" stroke-width="1.5" stroke-linecap="round"/>
        </svg>`;
  } else if (key === "Luminous Soul") {
    bg = "rgba(255, 182, 193, 0.25)";
    border = "#ffb6c1";
    svgContent = `
        <svg width="24" height="24" viewBox="0 0 32 32" style="display:block;">
            <defs>
                <linearGradient id="grad_LuminousSoul_${uid}" x1="0%" y1="100%" x2="0%" y2="0%">
                    <stop offset="0%" stop-color="#fd79a8" />
                    <stop offset="100%" stop-color="#ffb6c1" />
                </linearGradient>
            </defs>
            <path d="M16 3 C16 3, 6 15, 6 22 C6 27, 10.5 30, 16 30 C21.5 30, 26 27, 26 22 C26 15, 16 3, 16 3 Z" fill="url(#grad_LuminousSoul_${uid})" stroke="#000" stroke-width="2" stroke-linejoin="round"/>
            <circle cx="13" cy="20" r="3" fill="#fff" opacity="0.6"/>
        </svg>`;
  } else if (key === "Monster Soul") {
    bg = "rgba(170, 170, 170, 0.25)";
    border = "#888";
    svgContent = `
        <svg width="24" height="24" viewBox="0 0 32 32" style="display:block;">
            <defs>
                <linearGradient id="grad_MonsterSoul_${uid}" x1="0%" y1="100%" x2="0%" y2="0%">
                    <stop offset="0%" stop-color="#2d3436" />
                    <stop offset="100%" stop-color="#636e72" />
                </linearGradient>
            </defs>
            <path d="M16 3 C16 3, 6 15, 6 22 C6 27, 10.5 30, 16 30 C21.5 30, 26 27, 26 22 C26 15, 16 3, 16 3 Z" fill="url(#grad_MonsterSoul_${uid})" stroke="#000" stroke-width="2" stroke-linejoin="round"/>
            <path d="M11 19 L14 17" stroke="#e74c3c" stroke-width="1.8" stroke-linecap="round"/>
            <path d="M21 19 L18 17" stroke="#e74c3c" stroke-width="1.8" stroke-linecap="round"/>
        </svg>`;
  } else if (key === "Catalyst Core") {
    bg = "rgba(46, 204, 113, 0.25)";
    border = "#2ecc71";
    svgContent = `
        <svg width="24" height="24" viewBox="0 0 32 32" style="display:block;">
            <defs>
                <linearGradient id="grad_CatalystCore_${uid}" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stop-color="#2ecc71" />
                    <stop offset="50%" stop-color="#a3fd83" />
                    <stop offset="100%" stop-color="#27ae60" />
                </linearGradient>
            </defs>
            <rect x="9" y="4" width="14" height="24" rx="3" fill="url(#grad_CatalystCore_${uid})" stroke="#000" stroke-width="2"/>
            <line x1="9" y1="10" x2="23" y2="10" stroke="#000" stroke-width="2"/>
            <line x1="9" y1="22" x2="23" y2="22" stroke="#000" stroke-width="2"/>
            <rect x="13" y="13" width="6" height="6" fill="#fff" opacity="0.9" rx="1"/>
        </svg>`;
  } else {
    svgContent = `
        <svg width="24" height="24" viewBox="0 0 32 32" style="display:block;">
            <rect x="6" y="8" width="20" height="18" rx="2" fill="#7f8c8d" stroke="#000" stroke-width="2"/>
            <path d="M6 14 L26 14" stroke="#000" stroke-width="2"/>
            <rect x="13" y="10" width="6" height="8" fill="#d5dbdb" stroke="#000" stroke-width="1.5" />
        </svg>`;
  }

  return `<span style="background: ${bg}; border: 1px solid ${border}; border-radius: 4px; padding: 4px; margin-right: 12px; font-size: 14px; display: inline-flex; align-items: center; justify-content: center; width: 32px; height: 32px; box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.6);">${svgContent}</span>`;
};

window.getUseIconHtml = function (key) {
  let bg = "rgba(170, 170, 170, 0.12)";
  let border = "#444";
  let svgContent = "";

  const getPotionSvg = (liquidColor) => {
      let uid = Math.floor(Math.random() * 10000000);
      let uniqueId = "liq_" + liquidColor.replace("#", "") + "_" + uid;
      let glassId = "glass_base_" + uid;
      return `
          <svg width="24" height="24" viewBox="0 0 32 32" style="display:block;">
              <defs>
                  <linearGradient id="${glassId}" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stop-color="#475569" />
                      <stop offset="50%" stop-color="#334155" />
                      <stop offset="100%" stop-color="#1e293b" />
                  </linearGradient>
                  <linearGradient id="${uniqueId}" x1="0%" y1="100%" x2="0%" y2="0%">
                      <stop offset="0%" stop-color="rgba(0,0,0,0.3)" />
                      <stop offset="30%" stop-color="${liquidColor}" />
                      <stop offset="85%" stop-color="${liquidColor}" />
                      <stop offset="100%" stop-color="#ffffff" />
                  </linearGradient>
              </defs>
              <!-- Bottle Glass Body with Solid Glass Gradient -->
              <path d="M13 5 L19 5 L19 12 L26 23 C28 26, 26 29, 21 29 L11 29 C6 29, 4 26, 6 23 L13 12 Z" fill="url(#${glassId})" stroke="#000" stroke-width="2" stroke-linejoin="round"/>
              <!-- Liquid Fill -->
              <path d="M8.5 21 L23.5 21 L25 24 C26.2 26.2, 25 28, 21 28 L11 28 C7 28, 5.8 26.2, 7 24 Z" fill="url(#${uniqueId})" stroke="#000" stroke-width="1.5"/>
              <!-- Cork Stopper -->
              <rect x="13.5" y="2" width="5" height="4" fill="#a0522d" stroke="#000" stroke-width="1.5"/>
              <!-- Left Neck Specular Highlight -->
              <path d="M14.5 6 L14.5 11" stroke="rgba(255, 255, 255, 0.45)" stroke-width="1" stroke-linecap="round" fill="none" />
              <!-- Right Shoulder Specular Highlight -->
              <path d="M22 14 C23.5 17, 23.5 21, 22 24" stroke="rgba(255, 255, 255, 0.25)" stroke-width="1" stroke-linecap="round" fill="none" />
              <!-- Bottom Liquid Glow Highlight -->
              <path d="M9 22 C8 24, 9 26, 11 27" stroke="#fff" stroke-width="1.5" stroke-linecap="round" fill="none" opacity="0.65"/>
          </svg>`;
    };

  if (key === "SP Reset Scroll") {
    bg = "rgba(155, 89, 182, 0.25)";
    border = "#9b59b6";
    svgContent = `
          <svg width="24" height="24" viewBox="0 0 32 32" style="display:block;">
              <defs>
                  <linearGradient id="grad_Scroll_SP" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stop-color="#fdf6e2" />
                      <stop offset="100%" stop-color="#d5dbdb" />
                  </linearGradient>
              </defs>
              <path d="M6 10 L26 6 L26 22 L6 26 Z" fill="url(#grad_Scroll_SP)" stroke="#000" stroke-width="2" stroke-linejoin="round"/>
              <rect x="13" y="11" width="6" height="11" transform="rotate(-11 16 16)" fill="#9b59b6" stroke="#000" stroke-width="1.5" />
              <path d="M6 10 C6 10, 4 12, 6 14" stroke="#000" stroke-width="2" fill="none" />
              <path d="M26 6 C26 6, 28 8, 26 10" stroke="#000" stroke-width="2" fill="none" />
          </svg>`;
  } else if (key === "Guild Reward Sack" || key === "Daily Reward Sack") {
      bg = "rgba(241, 196, 15, 0.25)";
      border = "#f1c40f";
      svgContent = `
            <svg width="24" height="24" viewBox="0 0 32 32" style="display:block;">
              <defs>
                  <linearGradient id="grad_RewardSack" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stop-color="#f1c40f" />
                      <stop offset="100%" stop-color="#d35400" />
                  </linearGradient>
              </defs>
              <path d="M16 8 C10 8, 6 11, 6 18 C6 25, 10 29, 16 29 C22 29, 26 25, 26 18 C26 11, 22 8, 16 8 Z" fill="url(#grad_RewardSack)" stroke="#000" stroke-width="2" stroke-linejoin="round"/>
              <ellipse cx="16" cy="10" rx="5" ry="1.8" fill="#d35400" stroke="#000" stroke-width="1.5" />
              <path d="M14 10 L10 14 M18 10 L22 14" stroke="#f1c40f" stroke-width="2.5" stroke-linecap="round"/>
              <polygon points="16,13 18,17 22,17 19,20 20,24 16,22 12,24 13,20 10,17 14,17" fill="#fff" opacity="0.9" stroke="#000" stroke-width="0.8"/>
          </svg>`;
  } else if (key === "Guild Weekly Sack") {
    bg = "rgba(155, 89, 182, 0.25)";
    border = "#9b59b6";
    svgContent = `
          <svg width="24" height="24" viewBox="0 0 32 32" style="display:block;">
              <defs>
                  <linearGradient id="grad_WeeklySack" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stop-color="#9b59b6" />
                      <stop offset="100%" stop-color="#3a045c" />
                  </linearGradient>
              </defs>
              <path d="M16 8 C10 8, 6 11, 6 18 C6 25, 10 29, 16 29 C22 29, 26 25, 26 18 C26 11, 22 8, 16 8 Z" fill="url(#grad_WeeklySack)" stroke="#000" stroke-width="2" stroke-linejoin="round"/>
              <ellipse cx="16" cy="10" rx="5" ry="1.8" fill="#3a045c" stroke="#000" stroke-width="1.5" />
              <path d="M14 10 L10 14 M18 10 L22 14" stroke="#f1c40f" stroke-width="2.5" stroke-linecap="round"/>
              <circle cx="16" cy="18" r="4.5" fill="#f1c40f" stroke="#000" stroke-width="1"/>
              <path d="M16 15.5 L16 20.5 M13.5 18 L18.5 18" stroke="#3a045c" stroke-width="1" stroke-linecap="round"/>
          </svg>`;
  } else if (key === "PP Reset Scroll") {
    bg = "rgba(230, 126, 34, 0.25)";
    border = "#e67e22";
    svgContent = `
        <svg width="24" height="24" viewBox="0 0 32 32" style="display:block;">
            <defs>
                <linearGradient id="grad_Scroll_PP" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#fdf6e2" />
                    <stop offset="100%" stop-color="#d5dbdb" />
                </linearGradient>
            </defs>
            <path d="M6 10 L26 6 L26 22 L6 26 Z" fill="url(#grad_Scroll_PP)" stroke="#000" stroke-width="2" stroke-linejoin="round"/>
            <rect x="13" y="11" width="6" height="11" transform="rotate(-11 16 16)" fill="#e67e22" stroke="#000" stroke-width="1.5" />
            <path d="M6 10 C6 10, 4 12, 6 14" stroke="#000" stroke-width="2" fill="none" />
            <path d="M26 6 C26 6, 28 8, 26 10" stroke="#000" stroke-width="2" fill="none" />
        </svg>`;
  } else if (key.includes("Attack")) {
    bg = "rgba(46, 204, 113, 0.25)";
    border = "#2ecc71";
    svgContent = getPotionSvg("#2ecc71");
  } else if (key.includes("Vitality")) {
    bg = "rgba(231, 76, 60, 0.25)";
    border = "#e74c3c";
    svgContent = getPotionSvg("#e74c3c");
  } else if (key.includes("Armored")) {
    bg = "rgba(52, 152, 219, 0.25)";
    border = "#3498db";
    svgContent = getPotionSvg("#3498db");
  } else if (key.includes("Haste")) {
    bg = "rgba(241, 196, 15, 0.25)";
    border = "#f1c40f";
    svgContent = getPotionSvg("#f1c40f");
  } else if (key.includes("XP") || key.includes("Double XP")) {
    bg = "rgba(168, 85, 247, 0.25)";
    border = "#a855f7";
    svgContent = getPotionSvg("#a855f7");
  } else if (
    key.includes("Drop Rate") ||
    key.includes("Double Drop") ||
    key.includes("Drop Elixir")
  ) {
    bg = "rgba(34, 197, 94, 0.25)";
    border = "#22c55e";
    svgContent = getPotionSvg("#22c55e");
  } else if (key.includes("Quality")) {
    bg = "rgba(236, 72, 153, 0.25)";
    border = "#ec4899";
    svgContent = getPotionSvg("#ec4899");
  } else {
    svgContent = getPotionSvg("#bdc3c7");
  }

  return `<span style="background: ${bg}; border: 1px solid ${border}; border-radius: 4px; padding: 4px; margin-right: 12px; font-size: 14px; display: inline-flex; align-items: center; justify-content: center; width: 32px; height: 32px; box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.6);">${svgContent}</span>`;
};

window.getBossIconHtml = function (bossType) {
  if (bossType === "guardian") {
    return `
            <svg width="56" height="56" viewBox="0 0 64 64" style="display:block; margin: 0 auto; filter: drop-shadow(0 0 6px rgba(52, 152, 219, 0.45));">
                <defs>
                    <linearGradient id="goliath_shield" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stop-color="#34495e" />
                        <stop offset="100%" stop-color="#1a252f" />
                    </linearGradient>
                    <radialGradient id="goliath_core" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stop-color="#ffffff" />
                        <stop offset="40%" stop-color="#00d2ff" />
                        <stop offset="100%" stop-color="#003755" />
                    </radialGradient>
                </defs>
                <path d="M32 4 L52 14 L46 44 L32 58 L18 44 L12 14 Z" fill="url(#goliath_shield)" stroke="#00d2ff" stroke-width="2.5" stroke-linejoin="round" />
                <path d="M32 4 L32 58" stroke="#111" stroke-width="2" />
                <path d="M12 14 L32 20 L52 14" fill="none" stroke="#111" stroke-width="2" />
                <circle cx="32" cy="30" r="10" fill="url(#goliath_core)" stroke="#fff" stroke-width="1.5" />
                <polygon points="26,24 20,22 24,28" fill="#e74c3c" />
                <polygon points="38,24 44,22 40,28" fill="#e74c3c" />
            </svg>`;
  } else if (bossType === "chronos") {
    return `
            <svg width="56" height="56" viewBox="0 0 64 64" style="display:block; margin: 0 auto; filter: drop-shadow(0 0 6px rgba(241, 196, 15, 0.45));">
                <defs>
                    <linearGradient id="chronos_gold" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stop-color="#ffd700" />
                        <stop offset="50%" stop-color="#fdcb6e" />
                        <stop offset="100%" stop-color="#b7950b" />
                    </linearGradient>
                </defs>
                <circle cx="32" cy="32" r="24" fill="none" stroke="url(#chronos_gold)" stroke-width="3" />
                <g stroke="url(#chronos_gold)" stroke-width="3" stroke-linecap="round">
                    <line x1="32" y1="4" x2="32" y2="8" />
                    <line x1="32" y1="56" x2="32" y2="60" />
                    <line x1="4" y1="32" x2="8" y2="32" />
                    <line x1="56" y1="32" x2="60" y2="32" />
                </g>
                <circle cx="32" cy="32" r="16" fill="#111" stroke="url(#chronos_gold)" stroke-width="1.5" />
                <path d="M27 22 L37 22 L27 42 L37 42 Z" fill="none" stroke="#f1c40f" stroke-width="1" />
                <path d="M29 23 L35 23 L32 32 Z" fill="#ffeaa7" />
                <path d="M32 32 L29 41 L35 41 Z" fill="#ffeaa7" />
                <line x1="32" y1="32" x2="32" y2="20" stroke="#fff" stroke-width="2" stroke-linecap="round" />
                <line x1="32" y1="32" x2="40" y2="32" stroke="#e67e22" stroke-width="1.5" stroke-linecap="round" />
            </svg>`;
  } else if (bossType === "nexus") {
    return `
            <svg width="56" height="56" viewBox="0 0 64 64" style="display:block; margin: 0 auto; filter: drop-shadow(0 0 6px rgba(255, 0, 127, 0.45));">
                <defs>
                    <linearGradient id="nexus_neon" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stop-color="#ff007f" />
                        <stop offset="100%" stop-color="#00d2ff" />
                    </linearGradient>
                </defs>
                <rect x="14" y="14" width="36" height="36" fill="none" stroke="url(#nexus_neon)" stroke-width="2" />
                <rect x="20" y="20" width="24" height="24" fill="none" stroke="#00b894" stroke-width="1.5" />
                <line x1="14" y1="14" x2="20" y2="20" stroke="url(#nexus_neon)" stroke-width="1.5" />
                <line x1="50" y1="14" x2="44" y2="20" stroke="url(#nexus_neon)" stroke-width="1.5" />
                <line x1="14" y1="50" x2="20" y2="44" stroke="url(#nexus_neon)" stroke-width="1.5" />
                <line x1="50" y1="50" x2="44" y2="44" stroke="url(#nexus_neon)" stroke-width="1.5" />
                <circle cx="32" cy="32" r="5" fill="#fff" stroke="#ff007f" stroke-width="1" />
                <circle cx="32" cy="32" r="2" fill="#000" />
            </svg>`;
  }
  return `🔮`;
};

window.getArtifactIconHtml = function (trait, size = 24) {
  let uid = Math.floor(Math.random() * 10000000);
  let svg = "";
  if (trait === "frenzy") {
    svg = `<svg width="100%" height="100%" viewBox="0 0 32 32">
                <defs><radialGradient id="g_frenzy_${uid}" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="#ff5555"/><stop offset="100%" stop-color="#4a0008"/></radialGradient></defs>
                <rect x="3" y="3" width="26" height="26" rx="6" fill="url(#g_frenzy_${uid})" stroke="#111" stroke-width="1.8"/>
                <path d="M16 6 L12 16 L20 18 L16 26" fill="none" stroke="#f1c40f" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" style="filter: drop-shadow(0 0 3px #ff3300);"/>
                <circle cx="16" cy="16" r="3" fill="#ffffff" stroke="#ff3333" stroke-width="1"/>
            </svg>`;
  } else if (trait === "vampirism") {
    svg = `<svg width="100%" height="100%" viewBox="0 0 32 32">
                <defs>
                    <linearGradient id="g_gold_${uid}" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#fff59d"/><stop offset="50%" stop-color="#f1c40f"/><stop offset="100%" stop-color="#9a7d0a"/></linearGradient>
                    <radialGradient id="g_blood_${uid}" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="#ff4d4d"/><stop offset="100%" stop-color="#7a0010"/></radialGradient>
                </defs>
                <path d="M8 6 L24 6 L22 16 C22 22, 16 24, 16 24 C16 24, 10 22, 10 16 Z" fill="url(#g_gold_${uid})" stroke="#111" stroke-width="2" stroke-linejoin="round"/>
                <path d="M9.5 8 L22.5 8 C21 13, 11 13, 9.5 8 Z" fill="url(#g_blood_${uid})" stroke="#111" stroke-width="1"/>
                <line x1="16" y1="24" x2="16" y2="28" stroke="url(#g_gold_${uid})" stroke-width="3" stroke-linecap="round"/>
                <path d="M9 28 L23 28 Q16 31, 9 28 Z" fill="url(#g_gold_${uid})" stroke="#111" stroke-width="1.5" stroke-linejoin="round"/>
            </svg>`;
  } else if (trait === "gold_hoard") {
    svg = `<svg width="100%" height="100%" viewBox="0 0 32 32">
                <defs><linearGradient id="g_bronze_${uid}" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#ffd54f"/><stop offset="100%" stop-color="#a77c00"/></linearGradient></defs>
                <circle cx="16" cy="8" r="4.5" fill="none" stroke="url(#g_bronze_${uid})" stroke-width="2.5"/>
                <line x1="16" y1="11" x2="16" y2="25" stroke="url(#g_bronze_${uid})" stroke-width="3.5" stroke-linecap="round"/>
                <line x1="9" y1="15" x2="23" y2="15" stroke="url(#g_bronze_${uid})" stroke-width="3" stroke-linecap="round"/>
                <path d="M7 20 C7 27, 25 27, 25 20" fill="none" stroke="url(#g_bronze_${uid})" stroke-width="3.5" stroke-linecap="round"/>
                <polygon points="7,19 4,22 9,21" fill="url(#g_bronze_${uid})" stroke="#111" stroke-width="1"/>
                <polygon points="25,19 28,22 23,21" fill="url(#g_bronze_${uid})" stroke="#111" stroke-width="1"/>
            </svg>`;
  } else if (trait === "magic_find") {
    svg = `<svg width="100%" height="100%" viewBox="0 0 32 32">
                <defs>
                    <linearGradient id="g_sc_gold_${uid}" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#fff1a8"/><stop offset="100%" stop-color="#d4af37"/></linearGradient>
                    <linearGradient id="g_sc_emerald_${uid}" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#55efc4"/><stop offset="100%" stop-color="#00b894"/></linearGradient>
                </defs>
                <ellipse cx="16" cy="18" rx="8" ry="10" fill="url(#g_sc_gold_${uid})" stroke="#111" stroke-width="2"/>
                <circle cx="16" cy="10" r="4.2" fill="url(#g_sc_gold_${uid})" stroke="#111" stroke-width="1.8"/>
                <line x1="16" y1="10" x2="16" y2="28" stroke="#111" stroke-width="1.8"/>
                <rect x="13.2" y="13.5" width="5.6" height="8.5" rx="1.5" fill="url(#g_sc_emerald_${uid})" stroke="#111" stroke-width="1"/>
                <path d="M8 14 Q3 15, 6 9.5 M24 14 Q29 15, 26 9.5 M7 21 Q3 23, 5 27 M25 21 Q29 23, 27 27" fill="none" stroke="#111" stroke-width="2" stroke-linecap="round"/>
            </svg>`;
  } else if (trait === "move_speed") {
    svg = `<svg width="100%" height="100%" viewBox="0 0 32 32">
                <defs>
                    <linearGradient id="g_silver_metal_${uid}" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#ffffff"/><stop offset="100%" stop-color="#7f8c8d"/></linearGradient>
                    <linearGradient id="g_sky_wings_${uid}" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#81ecec"/><stop offset="100%" stop-color="#0984e3"/></linearGradient>
                </defs>
                <!-- Heavy metallic winged greave -->
                <path d="M10 24 L15 9 L24 15 L19 26 Z" fill="url(#g_silver_metal_${uid})" stroke="#111" stroke-width="1.8"/>
                <path d="M5 14 C5 10, 11 8, 14 15 C11 15, 7 13, 5 14 Z" fill="url(#g_sky_wings_${uid})" stroke="#111" stroke-width="1.2"/>
                <path d="M3 18 C3 14, 9 12, 12 19 C9 19, 5 17, 3 18 Z" fill="url(#g_sky_wings_${uid})" stroke="#111" stroke-width="1.2"/>
            </svg>`;
  } else if (trait === "defense") {
    svg = `<svg width="100%" height="100%" viewBox="0 0 32 32">
                <defs>
                    <linearGradient id="g_cob_inner_${uid}" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#4ba3e3"/><stop offset="100%" stop-color="#1c304a"/></linearGradient>
                </defs>
                <!-- Cobalt shield matrix -->
                <path d="M16 3 L27 9 L23 23 L16 29 L9 23 L5 9 Z" fill="url(#g_cob_inner_${uid})" stroke="#111" stroke-width="2.2" stroke-linejoin="round"/>
                <path d="M16 7 L23 11 L20 20 L16 25 L12 20 L9 11 Z" fill="none" stroke="#fff" opacity="0.3" stroke-width="1.8"/>
                <circle cx="16" cy="15" r="3.2" fill="#fff" style="filter: drop-shadow(0 0 4px #fff);"/>
            </svg>`;
  } else if (trait === "parry_strike") {
    svg = `<svg width="100%" height="100%" viewBox="0 0 32 32">
                <defs><linearGradient id="g_riposte_${uid}" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#ffffff"/><stop offset="100%" stop-color="#555555"/></linearGradient></defs>
                <!-- Heavy counter gauntlet -->
                <path d="M7 10 L16 5 L25 10 L23 22 L16 28 L9 22 Z" fill="url(#g_riposte_${uid})" stroke="#111" stroke-width="2" stroke-linejoin="round"/>
                <line x1="8" y1="14" x2="24" y2="14" stroke="#c0392b" stroke-width="3" stroke-linecap="round"/>
                <path d="M16 10 L16 22" stroke="#111" stroke-width="3" stroke-linecap="round"/>
                <path d="M16 10 L16 22" stroke="#fff" stroke-width="1" stroke-linecap="round"/>
            </svg>`;
  } else if (trait === "echo_strike") {
    svg = `<svg width="100%" height="100%" viewBox="0 0 32 32">
                <defs>
                    <linearGradient id="g_blue_echo_${uid}" x1="0" y1="1" x2="0" y2="0"><stop offset="0%" stop-color="#020d1a"/><stop offset="100%" stop-color="#00ffcc"/></linearGradient>
                </defs>
                <!-- Translucent phantom twin blades -->
                <path d="M4 28 L24 8 L28 12 L8 32 Z" fill="url(#g_blue_echo_${uid})" stroke="rgba(0, 255, 204, 0.4)" stroke-width="1.5" style="opacity:0.45;"/>
                <path d="M8 24 L24 8 L28 12 L12 28 Z" fill="url(#g_blue_echo_${uid})" stroke="#111" stroke-width="1.8"/>
                <path d="M12 28 L28 12" stroke="#fff" stroke-width="1.5" stroke-linecap="round"/>
            </svg>`;
  } else if (trait === "idle_spd") {
    svg = `<svg width="100%" height="100%" viewBox="0 0 32 32">
                <defs><linearGradient id="g_obsid_${uid}" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#2c3e50"/><stop offset="100%" stop-color="#07090c"/></linearGradient></defs>
                <!-- Clockwork suspended inside obsidian ring -->
                <circle cx="16" cy="16" r="11" fill="url(#g_obsid_${uid})" stroke="#ffd700" stroke-width="2.2"/>
                <circle cx="16" cy="16" r="8" fill="none" stroke="#e67e22" stroke-width="1" stroke-dasharray="3 3"/>
                <line x1="16" y1="16" x2="16" y2="9.5" stroke="#f1c40f" stroke-width="2.2" stroke-linecap="round"/>
                <line x1="16" y1="16" x2="21.5" y2="16" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/>
            </svg>`;
  } else if (trait === "active_spd") {
    svg = `<svg width="100%" height="100%" viewBox="0 0 32 32">
                <defs>
                    <linearGradient id="g_fever_flare_${uid}" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#fff9a6"/><stop offset="50%" stop-color="#f39c12"/><stop offset="100%" stop-color="#d35400"/></linearGradient>
                </defs>
                <!-- Sun-spiked active crest -->
                <path d="M16 2 L20 10 L28 10 L22 16 L25 24 L16 19 L7 24 L10 16 L4 10 L12 10 Z" fill="url(#g_fever_flare_${uid})" stroke="#111" stroke-width="1.8" stroke-linejoin="round"/>
                <circle cx="16" cy="13.5" r="4.2" fill="#fff" opacity="0.3"/>
            </svg>`;
  } else if (trait === "dodge_buff") {
    svg = `<svg width="100%" height="100%" viewBox="0 0 32 32">
                <defs>
                    <linearGradient id="g_adrenaline_core_${uid}" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#2ecc71"/><stop offset="100%" stop-color="#145a32"/></linearGradient>
                </defs>
                <!-- Emerald adrenaline injector -->
                <rect x="11.5" y="4" width="9" height="22" rx="4.5" fill="url(#g_adrenaline_core_${uid})" stroke="#111" stroke-width="1.8"/>
                <rect x="13.5" y="7" width="5" height="16" fill="#fff" opacity="0.25"/>
                <line x1="10" y1="12" x2="22" y2="12" stroke="#111" stroke-width="2"/>
                <line x1="10" y1="18" x2="22" y2="18" stroke="#111" stroke-width="2"/>
                <line x1="16" y1="26" x2="16" y2="29" stroke="#bdc3c7" stroke-width="2.5" stroke-linecap="round"/>
            </svg>`;
  } else if (trait === "extend_buffs") {
    svg = `<svg width="100%" height="100%" viewBox="0 0 32 32">
                <defs>
                    <linearGradient id="g_chrono_glass_${uid}" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#ffeaa7"/><stop offset="100%" stop-color="#d35400"/></linearGradient>
                </defs>
                <!-- Glowing starry hourglass -->
                <path d="M7 6 L25 6 L16 16 Z" fill="url(#g_chrono_glass_${uid})" stroke="#111" stroke-width="1.8" stroke-linejoin="round"/>
                <path d="M16 16 L7 26 L25 26 Z" fill="url(#g_chrono_glass_${uid})" stroke="#111" stroke-width="1.8" stroke-linejoin="round"/>
                <circle cx="16" cy="11" r="2.2" fill="#fff" style="filter: drop-shadow(0 0 3px #fff);"/>
                <path d="M13 23 Q16 18, 19 23 Z" fill="#fff" opacity="0.8"/>
            </svg>`;
  } else if (trait === "bag_space") {
    svg = `<svg width="100%" height="100%" viewBox="0 0 32 32">
                <defs><linearGradient id="g_dim_bag_${uid}" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#a29bfe"/><stop offset="100%" stop-color="#6c5ce7"/></linearGradient></defs>
                <!-- Violet runic satchel -->
                <rect x="6.5" y="11" width="19" height="15" rx="3.5" fill="url(#g_dim_bag_${uid})" stroke="#111" stroke-width="1.8"/>
                <path d="M11.5 11 C11.5 6, 20.5 6, 20.5 11" fill="none" stroke="#111" stroke-width="2.2"/>
                <circle cx="16" cy="18.5" r="3" fill="#111" stroke="#fff" stroke-width="1.2"/>
            </svg>`;
  } else if (trait === "second_wind") {
    svg = `<svg width="100%" height="100%" viewBox="0 0 32 32">
                <defs><linearGradient id="g_solar_ankh_${uid}" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#ff7675"/><stop offset="100%" stop-color="#d63031"/></linearGradient></defs>
                <!-- Radiant solar sun-ankh -->
                <circle cx="16" cy="10" r="5" fill="none" stroke="url(#g_solar_ankh_${uid})" stroke-width="2.5" style="filter: drop-shadow(0 0 3px #ff3300);"/>
                <path d="M11 15.5 L21 15.5 L16 28.5 Z" fill="url(#g_solar_ankh_${uid})" stroke="#111" stroke-width="1.8" stroke-linejoin="round"/>
            </svg>`;
  } else if (trait === "golem_stance") {
    svg = `<svg width="100%" height="100%" viewBox="0 0 32 32">
                <defs><linearGradient id="g_granite_${uid}" x1="0%" y1="0%" x2="1" y2="1"><stop offset="0%" stop-color="#95a5a6"/><stop offset="100%" stop-color="#34495e"/></linearGradient></defs>
                <!-- Runic stone core -->
                <polygon points="16,3 27,10.5 27,23.5 16,29 5,23.5 5,10.5" fill="url(#g_granite_${uid})" stroke="#111" stroke-width="2" stroke-linejoin="round"/>
                <path d="M16 7 L23 11 L23 19 M9 19 L9 11 L16 7" fill="none" stroke="#e74c3c" stroke-width="1.8" style="filter: drop-shadow(0 0 2px #ff2200);"/>
            </svg>`;
  } else if (trait === "fairy_wealth") {
    svg = `<svg width="100%" height="100%" viewBox="0 0 32 32">
                <defs><linearGradient id="g_pixie_${uid}" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#ff9ff3"/><stop offset="100%" stop-color="#f368e0"/></linearGradient></defs>
                <!-- Flower Crown with gems -->
                <circle cx="16" cy="16" r="10" fill="none" stroke="url(#g_pixie_${uid})" stroke-width="2.8"/>
                <path d="M12 9 Q16 3, 20 9 M9 16 Q16 23, 23 16" fill="none" stroke="#fff" opacity="0.65" stroke-width="1.8" stroke-linecap="round"/>
                <circle cx="16" cy="16" r="3.2" fill="#ffd700" stroke="#111" stroke-width="1.2"/>
            </svg>`;
  } else if (trait === "void_pull") {
    svg = `<svg width="100%" height="100%" viewBox="0 0 32 32">
                <!-- Space singularity pulling light -->
                <circle cx="16" cy="16" r="11" fill="#0c001a" stroke="#8e44ad" stroke-width="2.2" style="filter: drop-shadow(0 0 5px #8e44ad);"/>
                <circle cx="16" cy="16" r="5" fill="#ff007f" style="filter: drop-shadow(0 0 4px #ff007f);"/>
            </svg>`;
  } else if (trait === "titan_grip") {
    svg = `<svg width="100%" height="100%" viewBox="0 0 32 32">
                <defs><linearGradient id="g_rivets_${uid}" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#bdc3c7"/><stop offset="100%" stop-color="#2c3e50"/></linearGradient></defs>
                <!-- Heavy gauntlet built with rivets -->
                <rect x="8.5" y="11" width="15" height="11.5" rx="3" fill="url(#g_rivets_${uid})" stroke="#111" stroke-width="1.8"/>
                <path d="M11 11 C11 5, 21 5, 21 11" fill="none" stroke="#ffd700" stroke-width="2.2"/>
                <circle cx="11.5" cy="16.5" r="1" fill="#fff"/><circle cx="20.5" cy="16.5" r="1" fill="#fff"/>
            </svg>`;
  } else if (trait === "alchemist_alembic") {
    svg = `<svg width="100%" height="100%" viewBox="0 0 32 32">
                <defs><linearGradient id="g_chem_${uid}" x1="0%" y1="100%" x2="0%" y2="0%"><stop offset="0%" stop-color="#1abc9c"/><stop offset="100%" stop-color="#a3fd83"/></linearGradient></defs>
                <!-- Copper distillation beaker with heat glows -->
                <circle cx="16" cy="19.5" r="8.2" fill="url(#g_chem_${uid})" stroke="#111" stroke-width="1.8"/>
                <rect x="14.5" y="6.5" width="3" height="6.5" fill="#bdc3c7" stroke="#111" stroke-width="1.2"/>
                <path d="M12 21 C12 21, 14 24, 16 24 C18 24, 20 21, 20 21" fill="none" stroke="#fff" opacity="0.4" stroke-width="1.2"/>
            </svg>`;
  } else if (trait === "philosopher_catalyst") {
    svg = `<svg width="100%" height="100%" viewBox="0 0 32 32">
                <defs><linearGradient id="g_catalyst_${uid}" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#2ecc71"/><stop offset="100%" stop-color="#27ae60"/></linearGradient></defs>
                <!-- Jade triangular talisman -->
                <polygon points="16,3.5 27.5,25 4.5,25" fill="url(#g_catalyst_${uid})" stroke="#111" stroke-width="2" stroke-linejoin="round"/>
                <circle cx="16" cy="17.8" r="4.2" fill="#fff" stroke="#111" stroke-width="1.2" style="filter: drop-shadow(0 0 3px #fff);"/>
            </svg>`;
  } else if (trait === "cauldron_eternity") {
    svg = `<svg width="100%" height="100%" viewBox="0 0 32 32">
                <defs><linearGradient id="g_cauld_purple_${uid}" x1="0%" y1="100%" x2="0%" y2="0%"><stop offset="0%" stop-color="#3a045c"/><stop offset="100%" stop-color="#9b59b6"/></linearGradient></defs>
                <!-- Boiling iron cauldron of starlight broth -->
                <path d="M8 10.5 C8 10.5, 4 23, 16 25.5 C28 23, 24 10.5, 24 10.5 Z" fill="#1b212c" stroke="#111" stroke-width="1.8" stroke-linejoin="round"/>
                <ellipse cx="16" cy="10.5" rx="10" ry="2.8" fill="url(#g_cauld_purple_${uid})" stroke="#111" stroke-width="1.8"/>
                <circle cx="12" cy="10" r="1.2" fill="#fff" opacity="0.6"/><circle cx="18" cy="11" r="1.5" fill="#fff" opacity="0.8"/>
            </svg>`;
  } else {
    svg = `<svg width="100%" height="100%" viewBox="0 0 32 32">
                <circle cx="16" cy="16" r="10" fill="#7f8c8d" stroke="#111" stroke-width="1.5"/>
            </svg>`;
  }
  return `<span style="display:inline-flex; align-items:center; justify-content:center; width:${size}px; height:${size}px; background:#111; border:1px solid #444; border-radius:4px; padding:2px; box-shadow:inset 0 0 4px #000;">${svg}</span>`;
};

window.getUniqueIconHtml = function (item, size = 32) {
  let uid = Math.floor(Math.random() * 10000000);
  let svg = "";
  if (item.isUniqueStaff) {
    svg = `<svg width="100%" height="100%" viewBox="0 0 32 32">
                <defs><linearGradient id="u_staff_ruby_${uid}" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#ffd700"/><stop offset="100%" stop-color="#e67e22"/></linearGradient></defs>
                <!-- Gold-coiled staff with ruby solar gem -->
                <line x1="6" y1="26" x2="26" y2="6" stroke="#853c00" stroke-width="3" stroke-linecap="round"/>
                <line x1="6" y1="26" x2="26" y2="6" stroke="url(#u_staff_ruby_${uid})" stroke-width="1" stroke-linecap="round" style="opacity:0.4;"/>
                <circle cx="26" cy="6" r="5.2" fill="#e74c3c" stroke="#111" stroke-width="1.5" style="filter: drop-shadow(0 0 4px #e74c3c);"/>
                <circle cx="25" cy="5" r="1.2" fill="#fff"/>
            </svg>`;
  } else if (item.isUniqueSword) {
    svg = `<svg width="100%" height="100%" viewBox="0 0 32 32">
                <defs><linearGradient id="u_reaver_${uid}" x1="0%" y1="100%" x2="0%" y2="0%"><stop offset="0%" stop-color="#3a0202"/><stop offset="100%" stop-color="#ff0000"/></linearGradient></defs>
                <!-- Red Damascus blade with bleeding runs -->
                <path d="M5 27 L25 7 L27 9 L7 29 Z" fill="url(#u_reaver_${uid})" stroke="#111" stroke-width="1.8"/>
                <line x1="8" y1="24" x2="24" y2="8" stroke="#ff3333" stroke-width="1"/>
                <rect x="3.5" y="25" width="7" height="3.5" rx="0.5" fill="#f1c40f" stroke="#111" stroke-width="1.2" transform="rotate(45 7 27)"/>
            </svg>`;
  } else if (item.isUniqueSingularity) {
    svg = `<svg width="100%" height="100%" viewBox="0 0 32 32">
                <defs><linearGradient id="u_sing_purple_${uid}" x1="0" y1="1" x2="0" y2="0"><stop offset="0%" stop-color="#0b0116"/><stop offset="100%" stop-color="#8e44ad"/></linearGradient></defs>
                <!-- Star Core sword -->
                <path d="M5 27 L25 7 L27 9 L7 29 Z" fill="url(#u_sing_purple_${uid})" stroke="#111" stroke-width="1.8"/>
                <circle cx="26" cy="6" r="4" fill="#ff007f" style="filter: drop-shadow(0 0 4px #ff007f);"/>
            </svg>`;
  } else if (item.isUniqueMaelstrom) {
    svg = `<svg width="100%" height="100%" viewBox="0 0 32 32">
                <defs><linearGradient id="u_mael_${uid}" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#55efc4"/><stop offset="100%" stop-color="#00b894"/></linearGradient></defs>
                <!-- Curved tempest polearm -->
                <line x1="6" y1="26" x2="26" y2="6" stroke="#2c3e50" stroke-width="2.5" stroke-linecap="round"/>
                <path d="M22 10 Q28 6, 28 4 Q25 4, 18 8 Z" fill="url(#u_mael_${uid})" stroke="#111" stroke-width="1.5" stroke-linejoin="round"/>
            </svg>`;
  } else if (item.isUniqueAegis) {
    svg = `<svg width="100%" height="100%" viewBox="0 0 32 32">
                <defs><linearGradient id="u_aegis_blue_${uid}" x1="0" y1="0" x2="0" y2="100%"><stop offset="0%" stop-color="#0984e3"/><stop offset="100%" stop-color="#1b1c1e"/></linearGradient></defs>
                <!-- Heavy event horizon barrier shield -->
                <path d="M16 3 L27 9 L23 23 L16 29 L9 23 L5 9 Z" fill="url(#u_aegis_blue_${uid})" stroke="#3498db" stroke-width="2" stroke-linejoin="round" style="filter: drop-shadow(0 0 3px #3498db);"/>
                <circle cx="16" cy="16" r="3.2" fill="#fff" opacity="0.8"/>
            </svg>`;
  } else if (item.isUniqueWatch) {
    svg = `<svg width="100%" height="100%" viewBox="0 0 32 32">
                <defs><linearGradient id="u_watch_dial_${uid}" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#ffffff"/><stop offset="100%" stop-color="#d5dbdb"/></linearGradient></defs>
                <!-- Temporal dial pocket-watch -->
                <circle cx="16" cy="16" r="10" fill="#221c03" stroke="#f1c40f" stroke-width="1.8"/>
                <circle cx="16" cy="16" r="7.5" fill="url(#u_watch_dial_${uid})" stroke="#111" stroke-width="1"/>
                <line x1="16" y1="16" x2="16" y2="10.5" stroke="#111" stroke-width="1.8" stroke-linecap="round"/>
                <line x1="16" y1="16" x2="20" y2="16" stroke="#c0392b" stroke-width="1.2" stroke-linecap="round"/>
            </svg>`;
  } else if (item.isUniqueChronicle) {
    svg = `<svg width="100%" height="100%" viewBox="0 0 32 32">
                <defs><linearGradient id="u_chron_${uid}" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#fdf6e2"/><stop offset="100%" stop-color="#d5dbdb"/></linearGradient></defs>
                <!-- Leather bound lexicon with gold inlays -->
                <rect x="7.5" y="5" width="17" height="22" rx="2.5" fill="#2c1d11" stroke="#ffd700" stroke-width="1.8" style="filter: drop-shadow(0 0 3px #f1c40f);"/>
                <rect x="11.5" y="8" width="9" height="16" fill="url(#u_chron_${uid})" stroke="#111" stroke-width="1"/>
            </svg>`;
  } else if (item.isUniqueWarpCore) {
    svg = `<svg width="100%" height="100%" viewBox="0 0 32 32">
                <defs><linearGradient id="u_core_teal_${uid}" x1="0" y1="1" x2="0" y2="0"><stop offset="0%" stop-color="#002b2b"/><stop offset="100%" stop-color="#1abc9c"/></linearGradient></defs>
                <!-- High tech spatial thruster boots -->
                <path d="M8 23 L14 8 L22 14 L16 27 Z" fill="url(#u_core_teal_${uid})" stroke="#111" stroke-width="1.8"/>
                <rect x="10" y="16" width="3" height="5" rx="0.5" fill="#fff" style="filter: drop-shadow(0 0 3px #00ffcc);"/>
            </svg>`;
  } else if (item.isUniqueTempest) {
    svg = `<svg width="100%" height="100%" viewBox="0 0 32 32">
                <defs><linearGradient id="u_tempest_crown_${uid}" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#a0f0ff"/><stop offset="100%" stop-color="#0080b0"/></linearGradient></defs>
                <!-- Spiked lightning thunder crown -->
                <path d="M6 21 L10 7 L14 15 L16 4 L18 15 L22 7 L26 21 Z" fill="url(#u_tempest_crown_${uid})" stroke="#111" stroke-width="1.8" stroke-linejoin="round" style="filter: drop-shadow(0 0 4px #00d2ff);"/>
                <rect x="6" y="21" width="20" height="4" fill="url(#u_tempest_crown_${uid})" stroke="#111" stroke-width="1.8"/>
            </svg>`;
  } else {
    svg = `<svg width="100%" height="100%" viewBox="0 0 32 32">
                <circle cx="16" cy="16" r="10" fill="#444" stroke="#888" stroke-width="1.5"/>
            </svg>`;
  }
  return `<span style="display:inline-flex; align-items:center; justify-content:center; width:${size}px; height:${size}px; background:#111; border:1px solid #444; border-radius:4px; padding:3px; box-shadow:inset 0 0 6px #000;">${svg}</span>`;
};

window.draftAllocations = null;

window.hexToRgba = function (hex, alpha) {
  if (!hex || hex.charAt(0) !== "#") return `rgba(155, 89, 182, ${alpha})`;
  let r = parseInt(hex.slice(1, 3), 16),
    g = parseInt(hex.slice(3, 5), 16),
    b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

window.draftAllocations = null;
window.draftSP = 0;
window.activeStatTooltip = null;
window.activeStatTooltip = null;
window.draftHoldTimeout = null;
window.didFastDump = false;

// --- RIFT CONSOLE DATA & ENGINE ---
window.riftSlideIndex = 0;
window.riftSelectedLevel = 1;

window.riftBossesMetadata = [
  {
    type: "guardian",
    name: "Aegis Goliath",
    title: "The Iron Sentinel",
    avatar: "🛡️",
    desc: "Hyper-dense Event Horizon armor plates. Spikes reflect incoming raw kinetic impacts.",
    strategy:
      "Focus on unmitigated damage like Bleed or Rupture to bypass his massive defense pool.",
    artifacts: [
      { name: "Aegis Core", trait: "defense" },
      { name: "Phoenix Ankh", trait: "second_wind" },
      { name: "Golem's Core", trait: "golem_stance" },
      { name: "Titan's Shield Grip", trait: "titan_grip" },
      { name: "Blood-Soaked Chalice", trait: "vampirism" },
      { name: "Riposte Gauntlet", trait: "parry_strike" },
      { name: "Survivor's Adrenaline", trait: "dodge_buff" },
    ],
    hpMult: 10.0,
    dmgMult: 10.0,
    defMult: 8.0,
    speed: 100,
  },
  {
    type: "chronos",
    name: "Chronos Arbitrator",
    title: "The Timeless God",
    avatar: "⏳",
    desc: "Manipulates local clock speed, triggering time dilations that reduce player attack frequencies.",
    strategy:
      "Equip high Active/Idle Speed gear or utilize Haste Potions to resist time-dilation effects.",
    artifacts: [
      { name: "Chrono Hourglass", trait: "extend_buffs" },
      { name: "Sloth's Blessing", trait: "idle_spd" },
      { name: "Windwalker Boots", trait: "move_speed" },
      { name: "Philosopher's Anchor", trait: "gold_hoard" },
      { name: "Fairy Queen's Crown", trait: "fairy_wealth" },
      { name: "Alchemist's Alembic", trait: "alchemist_alembic" },
      { name: "Philosopher's Catalyst", trait: "philosopher_catalyst" },
    ],
    hpMult: 10.0,
    dmgMult: 10.0,
    defMult: 8.0,
    speed: 90,
  },
  {
    type: "nexus",
    name: "Nexus Overseer",
    title: "The Glitch Singularity",
    avatar: "👾",
    desc: "Infects the reality stream with glitch code, randomly shunting player multipliers and copying active buffs.",
    strategy:
      "Build consistent, flat attribute setups. Avoid relying on a single stacked stat line.",
    artifacts: [
      { name: "Berserker Stone", trait: "frenzy" },
      { name: "Gilded Scarab", trait: "magic_find" },
      { name: "Phantom Blade", trait: "echo_strike" },
      { name: "Void Core", trait: "void_pull" },
      { name: "Cauldron of Eternity", trait: "cauldron_eternity" },
      { name: "Zealot's Charm", trait: "active_spd" },
      { name: "Dimensional Pouch", trait: "bag_space" },
    ],
    hpMult: 10.0,
    dmgMult: 10.0,
    defMult: 8.0,
    speed: 80,
  },
];

window.getArtifactIcon = function (trait) {
  const icons = {
    frenzy: "🔥",
    vampirism: "🩸",
    gold_hoard: "🟡",
    magic_find: "🍀",
    move_speed: "👟",
    defense: "🛡️",
    parry_strike: "⚔️",
    echo_strike: "👻",
    idle_spd: "⏱️",
    active_spd: "⚡",
    dodge_buff: "👟",
    extend_buffs: "⏳",
    bag_space: "🎒",
    second_wind: "🏥",
    golem_stance: "🧱",
    fairy_wealth: "🧚",
    void_pull: "🌌",
    titan_grip: "🦾",
    alchemist_alembic: "🧪",
    philosopher_catalyst: "🧪",
    cauldron_eternity: "🍵",
  };
  return icons[trait] || "🔮";
};

window.openRiftConsole = function () {
  let modal = document.getElementById("rift-console-modal");
  if (!modal) return;

  let selectEl = document.getElementById("rift-hunt-select");
  let initialType = selectEl ? selectEl.value : "guardian";
  let initialIndex = window.riftBossesMetadata.findIndex(
    (b) => b.type === initialType,
  );
  if (initialIndex === -1) initialIndex = 0;

  window.riftSlideIndex = initialIndex;
  window.riftSelectedLevel = window.playerStats.activeRift
    ? window.playerStats.activeRiftLevel || 1
    : 1;

  window.renderRiftConsole();
  modal.style.display = "block";
  window.setPauseState(true);
};

window.renderRiftConsole = function () {
  let modal = document.getElementById("rift-console-modal");
  if (!modal) return;

  let isRiftActive = !!window.playerStats.activeRift;
  let activeLvl = window.playerStats.activeRiftLevel || 1;
  let selectedLvl = window.riftSelectedLevel;
  let maxLvl = (window.playerStats.highestRiftLevel || 0) + 5;
  let coresOwned = window.inventory.ETC["Ancient Core"] || 0;

  let targetBoss = window.playerStats.activeRift;
  if (isRiftActive && targetBoss) {
    let activeIndex = window.riftBossesMetadata.findIndex(
      (item) => item.type === targetBoss,
    );
    if (activeIndex !== -1) window.riftSlideIndex = activeIndex;
  } else {
    let selectedType =
      window.riftBossesMetadata[window.altarSlideIndex || 0].type;
    let foundIdx = window.riftBossesMetadata.findIndex(
      (item) => item.type === selectedType,
    );
    if (foundIdx !== -1) window.riftSlideIndex = foundIdx;
  }

  let headerTitle = isRiftActive
    ? `🌌 Reality Rift: Active Hunt`
    : `🔮 Rift Altar: Prepare Hunt`;

  let levelSelectorHtml = "";
  if (isRiftActive) {
    levelSelectorHtml = `
            <div style="background:rgba(231,76,60,0.1); border:1px dashed #e74c3c; border-radius:6px; padding:10px; margin-bottom:12px; text-align:center;">
                <strong style="color:#e74c3c; font-size:11.5px;">⚠️ RIFT ACTIVE (LEVEL ${activeLvl})</strong><br>
                <span style="font-size:10px; color:#aaa;">The Rift is locked. Slay or Collapse it to adjust level.</span>
            </div>
        `;
  } else {
    levelSelectorHtml = `
              <div style="background:rgba(155, 89, 182, 0.1); border:1px solid #4a154b; border-radius:6px; padding:10px; margin-bottom:12px; display:flex; justify-content:space-between; align-items:center; cursor:help;" onmouseenter="window.showRiftRewardBreakdownTooltip(event, ${selectedLvl})" onmouseleave="window.hideTooltip()" ontouchstart="window.showRiftRewardBreakdownTooltip(event, ${selectedLvl})">
                  <div>
                      <strong style="color:#df9ffb; font-size:11.5px; display:block;">CHOOSE RIFT TIER / LEVEL: ⓘ</strong>
                      <span style="font-size:10px; color:#aaa;">Max Unlocked: Level ${maxLvl}</span>
                  </div>
                  <div style="display:flex; align-items:center; gap:6px;" onclick="event.stopPropagation();">
                      <button class="btn-action" style="padding:4px 10px; background:#4a154b;" onclick="window.changeRiftLevel(-1)">-</button>
                      <strong style="font-size:14px; font-family:monospace; min-width:30px; text-align:center; color:#fff;" id="rift-console-level-val">${selectedLvl}</strong>
                      <button class="btn-action" style="padding:4px 10px; background:#4a154b;" onclick="window.changeRiftLevel(1)">+</button>
                  </div>
              </div>
          `;
  }

  let slidesHtml = window.riftBossesMetadata
    .map((boss, idx) => {
      let lvl = isRiftActive ? activeLvl : selectedLvl;
      let equivalentStage = 50 + lvl * 10;
      let gRate = 1.045 + (equivalentStage * 0.04) / (equivalentStage + 200);
      let rScale = Math.pow(gRate, equivalentStage);

      let hpVal = Math.floor(boss.hpMult * (60 * rScale));
      let dmgVal = Math.floor(20 * rScale * boss.dmgMult);
      let defVal = Math.floor(boss.defMult * rScale);

      let lootHtml = boss.artifacts
        .map((art) => {
          let artDetails = window.ARTIFACT_POOL.find(
            (a) => a.name === art.name,
          );
          let trait = artDetails ? artDetails.trait : art.trait;
          return `
                    <div class="rift-loot-icon" onmouseenter="window.showDummyArtifact(event, '${trait}')" ontouchstart="window.showDummyArtifact(event, '${trait}')" onmouseleave="window.hideTooltip()">
                        <span>${window.getArtifactIconHtml(trait, 28)}</span>
                    </div>
                `;
        })
        .join("");

      return `
                <div class="rift-slide">
                    <div style="text-align:center;">
                        <div style="margin: 8px 0;">${window.getBossIconHtml(boss.type)}</div>
                        <div class="rift-boss-badge">${boss.name}</div>
                        <div style="font-style:italic; font-size:10.5px; color:#aaa; margin-bottom:8px;">"${boss.title}"</div>
                    </div>
                <div style="font-size:11px; color:#ddd; line-height:1.4; text-align:center; padding: 0 10px; margin-bottom:10px; min-height:34px; white-space:normal;">
                    ${boss.desc}
                </div>
                <div class="rift-stats-display">
                    <div class="rift-stat-box"><span>❤️ Life</span><strong>${window.formatNumber(hpVal)}</strong></div>
                    <div class="rift-stat-box"><span>⚔️ Attack</span><strong>${window.formatNumber(dmgVal)}</strong></div>
                    <div class="rift-stat-box"><span>🛡️ Armor</span><strong>${window.formatNumber(defVal)}</strong></div>
                </div>
                <div style="background:rgba(0,0,0,0.45); border:1px dashed #4a154b; padding:8px 10px; border-radius:4px; font-size:10px; line-height:1.4; text-align:left; margin-bottom:10px; white-space:normal;">
                    <strong style="color:#e74c3c;">💡 STRATEGY:</strong> ${boss.strategy}
                </div>
                <div>
                    <div style="font-size:9.5px; font-weight:bold; color:#ff007f; text-transform:uppercase; text-align:center; margin-bottom:4px; letter-spacing:0.5px;">💎 Potential Artifact Drops</div>
                    <div class="rift-loot-preview">${lootHtml}</div>
                </div>
            </div>
        `;
    })
    .join("");

  let dotsHtml = window.riftBossesMetadata
    .map(
      (b, idx) => `
        <div class="rift-dot ${idx === window.riftSlideIndex ? "active" : ""}" onclick="window.setRiftSlide(${idx})"></div>
    `,
    )
    .join("");

  let actionBtnHtml = "";
  if (isRiftActive) {
    actionBtnHtml = `
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
                <button class="btn-action un" style="font-weight:bold; padding:12px; font-size:11.5px;" onclick="window.executeAbandonRiftConsole()">⚠️ Collapse Rift</button>
                <button class="btn-action" style="background:#e74c3c; font-weight:bold; padding:12px; font-size:11.5px;" onclick="window.executeRiftSummon(true)">⚔️ Re-enter Fight</button>
            </div>
        `;
  } else {
    let canAfford = coresOwned >= 1;
    let costColor = canAfford ? "#2ecc71" : "#e74c3c";
    actionBtnHtml = `
            <div style="display:flex; flex-direction:column; gap:8px;">
                <div style="display:flex; justify-content:space-between; font-size:11px; color:#aaa; font-family:monospace; padding:0 4px;">
                    <span>Cores Owned: <strong style="color:${coresOwned >= 1 ? "#2ecc71" : "#e74c3c"};">${coresOwned} / 1</strong></span>
                    <span>Summon Cost: <strong style="color:#ff007f;">1 Core</strong></span>
                </div>
                <button class="btn-action" style="background:#9b59b6; width:100%; font-weight:bold; padding:12px; font-size:11.5px; letter-spacing:0.5px;" ${canAfford ? "" : 'disabled style="opacity:0.5; cursor:not-allowed;"'} onclick="window.executeRiftSummon()">🔮 COMMENCE SUMMONING</button>
            </div>
        `;
  }

  modal.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #333; padding-bottom:10px; margin-bottom:10px;">
            <h3 style="margin:0; color:#9b59b6; font-size:14px; display:flex; align-items:center; gap:6px;">🔮 ${headerTitle}</h3>
            <button onclick="document.getElementById('rift-console-modal').style.display='none'; window.setPauseState(false); window.hideTooltip();" style="background:#e74c3c; color:white; border:none; border-radius:4px; padding:6px 12px; font-weight:bold; cursor:pointer; font-size:11px;">Close</button>
        </div>

        ${levelSelectorHtml}

        <div class="rift-carousel-container">
                    ${
                      isRiftActive
                        ? ""
                        : `
                        <button class="carousel-arrow prev" onclick="window.changeRiftSlide(-1)">◀</button>
                        <button class="carousel-arrow next" onclick="window.changeRiftSlide(1)">▶</button>
                    `
                    }
                    <div class="rift-carousel-track" id="rift-carousel-track" style="transform: translate3d(-${window.riftSlideIndex * 33.333}%, 0, 0);">
                        ${slidesHtml}
                    </div>
                </div>

        ${isRiftActive ? "" : `<div class="rift-dots">${dotsHtml}</div>`}

        <div style="margin-top: 15px;">
            ${actionBtnHtml}
        </div>
    `;

  // Swipe handler setup
  let track = document.getElementById("rift-carousel-track");
  if (track && !isRiftActive) {
    let startX = 0,
      currentX = 0,
      isDragging = false;
    track.addEventListener(
      "touchstart",
      (e) => {
        startX = e.touches[0].clientX;
        isDragging = true;
      },
      { passive: true },
    );
    track.addEventListener(
      "touchmove",
      (e) => {
        if (!isDragging) return;
        currentX = e.touches[0].clientX;
      },
      { passive: true },
    );
    track.addEventListener("touchend", (e) => {
      if (!isDragging) return;
      isDragging = false;
      let diffX = startX - currentX;
      if (Math.abs(diffX) > 40) {
        if (diffX > 0) window.changeRiftSlide(1);
        else window.changeRiftSlide(-1);
      }
    });
  }
};

window.changeRiftLevel = function (direction) {
  let maxLvl = (window.playerStats.highestRiftLevel || 0) + 5;
  let newLvl = window.riftSelectedLevel + direction;
  if (newLvl < 1) newLvl = 1;
  if (newLvl > maxLvl) newLvl = maxLvl;
  window.riftSelectedLevel = newLvl;
  window.renderRiftConsole();

  let tt = document.getElementById("game-tooltip");
  if (tt && tt.style.display === "block") {
    window.showRiftRewardBreakdownTooltip(null, newLvl);
  }
};

window.changeRiftSlide = function (direction) {
  if (window.playerStats.activeRift) return;
  let newIndex = window.riftSlideIndex + direction;
  if (newIndex < 0) newIndex = window.riftBossesMetadata.length - 1;
  if (newIndex >= window.riftBossesMetadata.length) newIndex = 0;
  window.riftSlideIndex = newIndex;
  window.renderRiftConsole();
};

window.setRiftSlide = function (idx) {
  if (window.playerStats.activeRift) return;
  window.riftSlideIndex = idx;
  window.renderRiftConsole();
};

window.executeRiftSummon = function (isReentry = false) {
  let cores = window.inventory.ETC["Ancient Core"] || 0;
  let boss = window.riftBossesMetadata[window.riftSlideIndex];
  let lvl = isReentry
    ? window.playerStats.activeRiftLevel || 1
    : window.riftSelectedLevel;

  if (!isReentry) {
    if (cores < 1) return;
    window.inventory.ETC["Ancient Core"]--;
    if (window.inventory.ETC["Ancient Core"] === 0)
      delete window.inventory.ETC["Ancient Core"];
    window.playerStats.activeRift = boss.type;
    window.playerStats.activeRiftLevel = lvl;
  }

  let actualBossType = isReentry ? window.playerStats.activeRift : boss.type;

  window.playerStats.isBossMode = true;
  window.playerStats.isUberBoss = true;
  window.playerStats.currentUberBoss = actualBossType;
  window.playerStats.killCount = 0;
  window.playerStats.targetsRequired = 1;
  window.mob = null;

  let p = window.resolvePlayerStats();
  window.playerStats.currentHp = p.maxHp;

  if (isReentry) {
    window.pushLog(
      `<span style='color:#9b59b6; font-weight:bold;'>[RIFT SUMMON] Re-entering Level ${lvl} Rift for ${boss.name}!</span>`,
    );
  } else {
    window.pushLog(
      `<span style='color:#9b59b6; font-weight:bold;'>[RIFT SUMMON] The Altar consumes 1 Ancient Core! A Level ${lvl} Rift for ${boss.name} forms...</span>`,
    );
  }

  document.getElementById("rift-console-modal").style.display = "none";
  window.setPauseState(false);
  window.updateUI();
  window.saveGame();
};

window.executeAbandonRiftConsole = function () {
  window.showCustomConfirm(
    "Abandon Reality Rift",
    "Are you sure you want to collapse the active Rift? The spent Ancient Core will be lost permanently.",
    "Collapse Rift",
    "Keep Attempting",
    "#e74c3c",
    function () {
      window.playerStats.activeRift = null;
      window.playerStats.activeRiftLevel = 1;
      window.playerStats.isUberBoss = false;
      window.playerStats.isBossMode = false;
      window.mob = null;
      window.pushLog(
        "<span style='color:#e74c3c;'>[RIFT] The Reality Rift collapsed.</span>",
      );
      document.getElementById("rift-console-modal").style.display = "none";
      window.setPauseState(false);
      window.updateUI();
      window.saveGame();
    },
  );
};

// Helper to safely update text nodes
window.setText = function (id, text) {
  let el = document.getElementById(id);
  if (el) el.innerText = text;
};

// --- CORE UI REFRESHER ---

window.updateUI = function () {
  let hasDraftChanges = false;
  if (window.draftAllocations) {
    for (let k in window.draftAllocations) {
      if (window.draftAllocations[k] !== window.playerStats.spAllocations[k]) {
        hasDraftChanges = true;
        break;
      }
    }
  }

  let p = window.resolvePlayerStats(hasDraftChanges);

  // 1. Hud overlays (Dynamic Activities stage tracking)
  let displayTitle = "🗺️ Stage";
  let activeStageVal = window.playerStats.stage;
  let stageSubText = `(${window.playerStats.killCount}/${window.playerStats.targetsRequired}) • Peak ${window.playerStats.maxStage || 1}`;

  if (window.playerStats.isDungeonMode) {
    let dType = window.playerStats.currentDungeon || "gold";
    let dNames = { equip: "Equip Floor", gold: "Gold Floor", mat: "Mat Floor" };
    displayTitle = `🏰 ${dNames[dType] || "Floor"}`;
    activeStageVal = window.playerStats.currentDungeonStage[dType] || 1;
    stageSubText = `(${window.playerStats.killCount}/${window.playerStats.targetsRequired}) • Peak ${window.playerStats.dungeonPeaks[dType] || 1}`;
  } else if (window.playerStats.isCrucibleMode) {
    displayTitle = "🔮 Wave";
    activeStageVal = window.playerStats.crucibleWave || 1;
    stageSubText = `(${window.playerStats.killCount}/${window.playerStats.targetsRequired}) • Peak ${window.playerStats.cruciblePeak || 1}`;
  }

  let stageLabelEl = document.getElementById("hud-stage-label");
  if (stageLabelEl) stageLabelEl.innerText = displayTitle;

  let stageSubEl = document.getElementById("hud-stage-sub");
  if (stageSubEl) stageSubEl.innerText = stageSubText;

  setText("hud-stage", activeStageVal);
  setText("hud-coins", window.formatNumber(window.playerStats.coins));

  // Update real-time DPS in bottom HUD bar
  let actDps = window.calculateActiveDps ? window.calculateActiveDps() : "0.0";
  setText("hud-dps", actDps);

  // Update player HP in HUD bar
  let maxHp = p.maxHp;
  let curHp = window.playerStats.currentHp;
  setText(
    "hud-hp",
    `${window.formatNumber(curHp)} / ${window.formatNumber(maxHp)}`,
  );

  let hpPercent = Math.max(0, (curHp / maxHp) * 100);
  let hpSubEl = document.getElementById("hud-hp-pct");
  if (hpSubEl) {
    hpSubEl.innerText = `${hpPercent.toFixed(1)}%`;
    hpSubEl.style.color =
      hpPercent < 35 ? "#e74c3c" : hpPercent < 75 ? "#f39c12" : "#2ecc71";
  }

  // Dynamically toggle Leave Activity button based on state
  let leaveBtn = document.getElementById("btn-leave-activity");
  if (leaveBtn) {
    if (window.playerStats.isDungeonMode || window.playerStats.isCrucibleMode) {
      leaveBtn.style.display = "inline-block";
    } else {
      leaveBtn.style.display = "none";
    }
  }

  // Update Dungeon Peaks & Checkpoints in Activities Menu
  if (window.playerStats.dungeonPeaks) {
    let eqPeak = window.playerStats.dungeonPeaks.equip || 1;
    let goPeak = window.playerStats.dungeonPeaks.gold || 1;
    let maPeak = window.playerStats.dungeonPeaks.mat || 1;

    window.setText("dp-equip", eqPeak);
    window.setText("dp-gold", goPeak);
    window.setText("dp-mat", maPeak);

    window.setText("dc-equip", Math.max(1, Math.floor(eqPeak * 0.9)));
    window.setText("dc-gold", Math.max(1, Math.floor(goPeak * 0.9)));
    window.setText("dc-mat", Math.max(1, Math.floor(maPeak * 0.9)));
  }

  // Update Crucible Peak & Checkpoint in Activities Menu
  let cPeak = window.playerStats.cruciblePeak || 1;
  window.setText("crucible-peak-wave", cPeak);
  window.setText(
    "crucible-checkpoint-wave",
    Math.max(1, Math.floor(cPeak * 0.8)),
  );

  let maxBag = window.getMaxBagSlots();
  let bagEl = document.getElementById("hud-bag");
  if (bagEl) {
    bagEl.innerText = `${window.inventory.EQUIP.length}/${maxBag} (A:${window.inventory.ARTIFACT.length})`;
    bagEl.style.color =
      window.inventory.EQUIP.length >= maxBag ||
      window.inventory.ARTIFACT.length >= maxBag
        ? "#e74c3c"
        : "#2ecc71";
  }

  // 2. Stats panel headers (re-routed to unified selectors)
    setText("char-level", window.playerStats.level);

    let titleEl = document.getElementById("equipped-title");
          if (titleEl) {
            let activeTitle = window.playerStats.equippedTitle;
            if (activeTitle && window.TITLES_DATA[activeTitle]) {
              let tData = window.TITLES_DATA[activeTitle];
              let iconHtml = tData.icon || "";
              titleEl.innerHTML = ` ${iconHtml}<span style="color: ${tData.color || '#ff007f'};">[${tData.name}]</span>`;
            } else {
              titleEl.innerHTML = "";
            }
          }

        let nameLabel = document.getElementById("current-name-label");
        if (nameLabel) {
          nameLabel.innerText = `(Current: ${window.playerStats.playerName || "Guest"})`;
        }

        setText(
          "char-sp",
          window.draftAllocations !== null ? window.draftSP : window.playerStats.sp,
        );

  let xpPct = (window.playerStats.xp / window.playerStats.xpReq) * 100;
  setText(
    "char-xp-text",
    `${window.formatNumber(window.playerStats.xp)} / ${window.formatNumber(window.playerStats.xpReq)} (${xpPct.toFixed(1)}%)`,
  );

  const xpFill = document.getElementById("char-xp-fill");
  if (xpFill) {
    xpFill.style.width = Math.min(100, xpPct) + "%";
    // Dynamically pulse the bar's glow once the user crosses the 90% threshold
    if (xpPct >= 90) {
      xpFill.style.boxShadow = "0 0 12px #d946ef, 0 0 4px #8b5cf6";
    } else {
      xpFill.style.boxShadow = "0 0 8px rgba(139, 92, 246, 0.45)";
    }
  }

  // 3. Core attributes matrix
  setText("stat-str", p.str);
  setText("stat-dex", p.dex);
  setText("stat-int", p.int);

  // 4. Multipliers & Avoidance
  setText("stat-atk", window.formatNumber(p.atk));
  setText("stat-mhp", window.formatNumber(p.maxHp));
  setText("stat-def", window.formatNumber(p.def));
  setText("stat-mov", p.moveSpeed.toFixed(1));
  setText("stat-ias", p.idleAttackSpeed + "f");
  setText("stat-aas", p.activeAttackSpeed + "f");
  setText("stat-crt", Math.floor(p.critChance * 100) + "%");
  setText("stat-crd", Math.floor(p.critDamage * 100) + "%");
  setText("stat-blk", Math.floor(p.block * 100) + "%");
  setText("stat-pry", Math.floor(p.parry * 100) + "%");
  setText("stat-rar", (p.rareSpawn * 100).toFixed(2) + "%");
  setText("stat-fai", Math.floor(p.fairySpawn * 100) + "%");
  setText("stat-drp", "+" + Math.floor((p.drop - 1) * 100) + "%");
  setText("stat-qly", "+" + Math.floor((p.qly - 1) * 100) + "%");
  setText("stat-gld", "x" + p.gold.toFixed(2));
  setText("stat-xpr", "x" + p.xpRate.toFixed(2));
  setText("stat-bar", Math.floor(p.arcaneBarrier * 100) + "%");

  let effMultiplier = 1 + p.critChance * (p.critDamage - 1);
  let idps = p.atk * effMultiplier * (60 / p.idleAttackSpeed);
  setText(
    "stat-idps",
    idps.toLocaleString(undefined, {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }),
  );

  // Real-time updates for Guild Missions Board if currently open
  let missionsWin = document.getElementById("missions-win-content");
  if (missionsWin) {
    window.renderMissionsWindow();
  }

  // Draft drawer visibility
  let draftBar = document.getElementById("draft-controls-container");
  if (draftBar) {
    draftBar.style.display = hasDraftChanges ? "block" : "none";
  }

  // Dynamic Top Missions Pulsing Alert Trigger
  let missionsBtn = document.getElementById("btn-missions-top");
  if (missionsBtn) {
    let dailies = window.playerStats.dailyMissions || [];
    let weeklies = window.playerStats.weeklyMissions || [];
    let dailyClaimable = dailies.some((m) => m.completed && !m.claimed);
    let weeklyClaimable = weeklies.some((m) => m.completed && !m.claimed);
    let dailyMasterClaimable =
      !window.playerStats.dailyRewardClaimed &&
      dailies.filter((m) => m.completed).length >= 5;
    let weeklyMasterClaimable =
      window.playerStats.prestigeCount > 0 &&
      !window.playerStats.weeklyRewardClaimed &&
      weeklies.filter((m) => m.completed).length === 3;

    if (
      dailyClaimable ||
      weeklyClaimable ||
      dailyMasterClaimable ||
      weeklyMasterClaimable
    ) {
      missionsBtn.style.animation = "glowGreen 1.8s infinite";
      missionsBtn.style.borderColor = "#2ecc71";
      if (!missionsBtn.querySelector(".badge-exclamation")) {
        missionsBtn.insertAdjacentHTML(
          "beforeend",
          ' <span class="badge-exclamation" style="color:#2ecc71; font-weight:bold; margin-left:3px;">!</span>',
        );
      }
    } else {
      missionsBtn.style.animation = "";
      missionsBtn.style.borderColor = "";
      let b = missionsBtn.querySelector(".badge-exclamation");
      if (b) b.remove();
    }
  }

  // Dynamic Top Trophies Pulsing Alert Trigger
  let trophiesBtn = document.getElementById("btn-achievements-top");
  if (trophiesBtn) {
    let hasUnviewed =
      window.playerStats.unviewedAchievements &&
      window.playerStats.unviewedAchievements.length > 0;
    if (hasUnviewed) {
      trophiesBtn.style.animation = "glowGold 1.8s infinite";
      trophiesBtn.style.borderColor = "#f1c40f";
      if (!trophiesBtn.querySelector(".badge-exclamation")) {
        trophiesBtn.insertAdjacentHTML(
          "beforeend",
          ' <span class="badge-exclamation" style="color:#f1c40f; font-weight:bold; margin-left:3px;">!</span>',
        );
      }
    } else {
      trophiesBtn.style.animation = "";
      trophiesBtn.style.borderColor = "";
      let b = trophiesBtn.querySelector(".badge-exclamation");
      if (b) b.remove();
    }
  }

  // Refresh core SP allocations button display
  const updateSPButtonStates = () => {
    let statsKeys = ["spStr", "spDex", "spInt"];
    let currentSp =
      window.draftAllocations !== null ? window.draftSP : window.playerStats.sp;
    let allocSource =
      window.draftAllocations || window.playerStats.spAllocations;

    statsKeys.forEach((allocKey) => {
      let plusBtn = document.getElementById("btn-plus-" + allocKey);
      let minusBtn = document.getElementById("btn-minus-" + allocKey);
      if (plusBtn)
        plusBtn.style.display = currentSp > 0 ? "inline-block" : "none";
      if (minusBtn) {
        let committedVal = window.playerStats.spAllocations[allocKey] || 0;
        let draftVal = allocSource[allocKey] || 0;
        minusBtn.style.display =
          draftVal > committedVal ? "inline-block" : "none";
      }
    });
  };
  updateSPButtonStates();

  // Challenge portal visibility
  let rechallengeBtn = document.getElementById("btn-rechallenge");
  if (rechallengeBtn) {
    rechallengeBtn.style.display = window.playerStats.isFarmingLoop
      ? "block"
      : "none";
  }

  // Set synergy hud lists
  let activeSetsHtml = [];
  let activeSetCounts = {};
  const checkSetSlots = [
    "weapon",
    "subweapon",
    "helmet",
    "chest",
    "leggings",
    "overall",
    "boots",
  ];
  checkSetSlots.forEach((slot) => {
    let item = window.equippedSlots[slot];
    if (item) {
      let sName = window.getItemSetName(item);
      if (sName)
        activeSetCounts[sName] =
          (activeSetCounts[sName] || 0) + (slot === "overall" ? 2 : 1);
    }
  });
  for (let sName in activeSetCounts) {
    let count = activeSetCounts[sName];
    let setDef = window.SET_DEFINITIONS[sName];
    if (setDef) {
      let activeBonuses = setDef.bonuses.filter((b) => count >= b.count);
      let displayCount = Math.min(3, count);
      if (activeBonuses.length > 0) {
        let bonusesText = activeBonuses.map((b) => b.desc).join(", ");
        activeSetsHtml.push(
          `<div style="margin-bottom: 5px;"><strong style="color: #2ecc71;">${sName} (${displayCount}/3):</strong> <span style="color:#fff;">${bonusesText}</span></div>`,
        );
      } else {
        activeSetsHtml.push(
          `<div style="margin-bottom: 5px; color: #7f8c8d;"><strong>${sName} (${displayCount}/3):</strong> No active bonus</div>`,
        );
      }
    }
  }
  let setsListEl = document.getElementById("active-sets-list");
  if (setsListEl) {
    setsListEl.innerHTML =
      activeSetsHtml.length > 0
        ? activeSetsHtml.join("")
        : "No active set synergies. Equip matching named gear (e.g. Colossus, Windrunner).";
  }

  // Live drop rates (safely mapped using setText to prevent element missing errors)
  let drp = p.drop * window.state.efficiency;
  setText("live-rate-mob", (4.5 * drp).toFixed(2) + "%");
  setText("live-rate-rare", (15.0 * drp).toFixed(2) + "%");
  setText("live-rate-boss", (25.0 * drp).toFixed(2) + "%");
  setText("live-rate-dmini", (30.0 * drp).toFixed(2) + "%");
  let elRateAcore = document.getElementById("live-rate-acore");
  if (elRateAcore) elRateAcore.innerText = (40.0 * drp).toFixed(2) + "%";

  let chance5 = p.qly >= 2.0 ? 0.02 * p.qly : 0;
  let chance4 = p.qly >= 1.5 ? 0.16 * p.qly : 0;
  setText(
    "star-rate-5",
    chance5 > 0 ? chance5.toFixed(2) + "%" : "0.00% 🔒 (Req. 2.0x Qly)",
  );
  setText(
    "star-rate-4",
    chance4 > 0 ? chance4.toFixed(2) + "%" : "0.00% 🔒 (Req. 1.5x Qly)",
  );
  setText("star-rate-3", (0.8 * p.qly - (chance5 + chance4)).toFixed(2) + "%");
  setText("star-rate-2", (3.2 * p.qly).toFixed(2) + "%");
  setText("star-rate-1", (11.0 * p.qly).toFixed(2) + "%");

  setText("live-qty-acore", window.inventory.ETC["Ancient Core"] || 0);
  setText(
    "live-qty-eshard",
    (window.inventory.ETC["Eridium Shard"] || 0).toLocaleString(),
  );

  let elAstral = document.getElementById("live-qty-astral");
  if (elAstral) {
    elAstral.innerText = `${(window.inventory.ETC["Astral Essence"] || 0).toLocaleString()} (Shared Shards: ${(window.playerStats.astralShards || 0).toLocaleString()})`;
  }

  setText(
    "live-qty-keys",
    `${(window.inventory.ETC["Gacha Key"] || 0).toLocaleString()} (E:${window.playerStats.equipKeys} G:${window.playerStats.goldKeys} M:${window.playerStats.matKeys})`,
  );

  let soulsTotal = window.inventory.ETC["Monster Soul"] || 0;
  setText(
    "live-qty-souls",
    `${(soulsTotal + (window.inventory.ETC["Luminous Soul"] || 0)).toLocaleString()} (Locked Cores: ${(window.inventory.ETC["Catalyst Core"] || 0).toLocaleString()})`,
  );

  let scrapsSum =
    (window.inventory.ETC["Mythic Scrap"] || 0) +
    (window.inventory.ETC["Legendary Scrap"] || 0) +
    (window.inventory.ETC["Epic Scrap"] || 0) +
    (window.inventory.ETC["Magic Scrap"] || 0) +
    (window.inventory.ETC["Rare Scrap"] || 0);
  setText("live-qty-scraps", scrapsSum.toLocaleString());

  // Update Altar UI Card dynamically if active
  let altarSec = document.getElementById("market-sec-altar");
  if (altarSec && altarSec.style.display !== "none") {
    window.renderAltarTab();
  }

  // Update Vending Subtab variables if active
  let gachaSec = document.getElementById("market-sec-gacha");
  if (gachaSec && gachaSec.style.display !== "none") {
    window.setText(
      "gachapon-lvl-display",
      window.playerStats.vendingQLevel || 0,
    );
    window.setText(
      "gacha-key-count-lbl",
      window.inventory.ETC["Gacha Key"] || 0,
    );
    window.updateGachaRecentList();
    window.renderGachaShowcaseMarquee();

    // Update live vending rates board (Decoupled from active equip Qly)
        let luckMultiplier = 1.0 + (window.playerStats.vendingQLevel || 0) * 0.025;
        let chance5 = 1.0 * luckMultiplier;
        let chance4 = 5.0 * luckMultiplier;
        let chance3 = 15.0 * luckMultiplier;
        let chance2 = 25.0 * luckMultiplier;
        let chance1 = Math.max(0, 100 - (chance5 + chance4 + chance3 + chance2));

        window.setText("vending-rate-5", chance5.toFixed(2) + "%");
        window.setText("vending-rate-4", chance4.toFixed(2) + "%");
        window.setText("vending-rate-3", chance3.toFixed(2) + "%");
        window.setText("vending-rate-2", chance2.toFixed(2) + "%");
        window.setText("vending-rate-1", chance1.toFixed(2) + "%");
  }

  // Refresh Gacha Pity Elements if present
    let pityProgress = window.playerStats.vendingPity || 0;
    let pityTextBadge = document.getElementById("vending-pity-text");
    let pityBarFill = document.getElementById("vending-pity-fill");
    if (pityTextBadge)
      pityTextBadge.innerText = `Pity progress: ${pityProgress} / 50`;
    if (pityBarFill) pityBarFill.style.width = `${(pityProgress / 50) * 100}%`;

  // Buff trackers HUD
  let activeBuffs = [];
  if (window.playerStats.frenzyTimer > 0) activeBuffs.push("🔥 Frenzy");
  if (window.playerStats.adrenalineTimer > 0) activeBuffs.push("⚡ Adrenaline");
  if (window.playerStats.atkPotionTimer > 0) activeBuffs.push("⚔️ Potion");
  if (window.playerStats.hpPotionTimer > 0) activeBuffs.push("❤️ Potion");
  if (window.playerStats.defPotionTimer > 0) activeBuffs.push("🛡️ Potion");
  if (window.playerStats.hastePotionTimer > 0) activeBuffs.push("👟 Potion");

  let buffEl = document.getElementById("hud-buff");
  if (buffEl) {
    if (activeBuffs.length > 0) {
      buffEl.innerText = activeBuffs.join(", ");
      buffEl.style.color = "#2ecc71";
    } else {
      buffEl.innerText = "None";
      buffEl.style.color = "#aaa";
    }
  }

  // Cumulative trophies
  let sumSummaryEl = document.getElementById("trophy-bonuses-summary");
  if (sumSummaryEl) {
    if (!window.playerStats.cachedAchievementBonusTotals) {
      window.recalculateAchievementTotals();
    }
    let aT = window.playerStats.cachedAchievementBonusTotals;

    let unlockedCount = window.playerStats.unlockedAchievements
      ? window.playerStats.unlockedAchievements.length
      : 0;
    let totalCount = window.AchievementsData
      ? window.AchievementsData.length
      : 174;
    let lines = [
      `<div style="color:#f1c40f; font-weight:bold; margin-bottom:4px; text-align:center; border-bottom: 1px dashed #333; padding-bottom:2px;">Active Trophies: ${unlockedCount} / ${totalCount}</div>`,
    ];

    let combatStats = [];
    if (aT.atk > 0 || aT.atkPct > 0)
      combatStats.push(`Atk: +${aT.atk} (${(aT.atkPct * 100).toFixed(1)}%)`);
    if (aT.maxHp > 0 || aT.maxHpPct > 0)
      combatStats.push(`HP: +${aT.maxHp} (${(aT.maxHpPct * 100).toFixed(1)}%)`);
    if (aT.def > 0 || aT.defPct > 0)
      combatStats.push(`Def: +${aT.def} (${(aT.defPct * 100).toFixed(1)}%)`);
    if (aT.moveSpeed > 0 || aT.moveSpeedPct > 0)
      combatStats.push(
        `Spd: +${aT.moveSpeed.toFixed(1)} (${(aT.moveSpeedPct * 100).toFixed(1)}%)`,
      );
    if (combatStats.length > 0)
      lines.push(
        `<div style="color:#e74c3c; font-weight:bold; margin-top:4px;">⚔️ COMBAT MULTIPLIERS</div>` +
          combatStats.join("<br>"),
      );

    let attrStats = [];
    if (aT.str > 0 || aT.strPct > 0)
      attrStats.push(`STR: +${aT.str} (${(aT.strPct * 100).toFixed(1)}%)`);
    if (aT.dex > 0 || aT.dexPct > 0)
      attrStats.push(`DEX: +${aT.dex} (${(aT.dexPct * 100).toFixed(1)}%)`);
    if (aT.int > 0 || aT.intPct > 0)
      attrStats.push(`INT: +${aT.int} (${(aT.intPct * 100).toFixed(1)}%)`);
    if (aT.critChance > 0)
      attrStats.push(`Crit %: +${(aT.critChance * 100).toFixed(1)}%`);
    if (aT.critDamage > 0)
      attrStats.push(`Crit Dmg: +${(aT.critDamage * 100).toFixed(1)}%`);
    if (aT.block > 0)
      attrStats.push(`Block %: +${(aT.block * 100).toFixed(1)}%`);
    if (aT.parry > 0)
      attrStats.push(`Parry %: +${(aT.parry * 100).toFixed(1)}%`);
    if (attrStats.length > 0)
      lines.push(
        `<div style="color:#3498db; font-weight:bold; margin-top:4px;">💪 CORE ATTRIBUTES & CRITS</div>` +
          attrStats.join("<br>"),
      );

    let utilStats = [];
    if (aT.gold > 0)
      utilStats.push(`Gold Mult: +${(aT.gold * 100).toFixed(1)}%`);
    if (aT.drop > 0)
      utilStats.push(`Drop Rate: +${(aT.drop * 100).toFixed(1)}%`);
    if (aT.qly > 0)
      utilStats.push(`Drop Quality: +${(aT.qly * 100).toFixed(1)}%`);
    if (aT.fairySpawn > 0)
      utilStats.push(`Fairy Spawn: +${(aT.fairySpawn * 100).toFixed(1)}%`);
    if (aT.rareSpawn > 0)
      utilStats.push(`Rare Spawn: +${(aT.rareSpawn * 100).toFixed(2)}%`);
    if (aT.expPct > 0)
      utilStats.push(`EXP Rate: +${(aT.expPct * 100).toFixed(0)}%`);
    if (combatStats.length > 0 || attrStats.length > 0 || utilStats.length > 0)
      lines.push(
        `<div style="color:#2ecc71; font-weight:bold; margin-top:4px;">🍀 UTILITY MODS</div>` +
          utilStats.join("<br>"),
      );

    sumSummaryEl.innerHTML = lines.join("<br>");
  }

  // 5. Backpack details update
  let capCount = window.inventory.EQUIP.length;
  let capMax = window.getMaxBagSlots();
  let capBtn = document.getElementById("btn-bag-count");
  if (capBtn) capBtn.innerText = capCount;
  let capMaxBtn = document.getElementById("btn-bag-max");
  if (capMaxBtn) capMaxBtn.innerText = capMax;

  let artCount = window.inventory.ARTIFACT
    ? window.inventory.ARTIFACT.length
    : 0;
  let artBtn = document.getElementById("btn-art-count");
  if (artBtn) artBtn.innerText = artCount;
  let artMaxBtn = document.getElementById("btn-art-max");
  if (artMaxBtn) artMaxBtn.innerText = capMax;

  window.renderPaperDoll();
  window.renderInventory();

  // Auto-refresh tooltip
  if (window.activeStatTooltip) {
    window.refreshActiveStatTooltip();
  }
};

// --- ATTRIBUTES MATRIX CONTROLS ---

window.startSPDraftHold = function (e, statKey, direction) {
  e.preventDefault();
  if (window.playerStats.sp <= 0 && direction > 0) return;
  window.adjustSPDraft(statKey, direction);

  if (window.draftHoldTimeout) clearInterval(window.draftHoldTimeout);
  window.draftHoldTimeout = setInterval(() => {
    if (window.playerStats.sp <= 0 && direction > 0) {
      clearInterval(window.draftHoldTimeout);
      return;
    }
    if (
      direction < 0 &&
      window.draftAllocations[statKey] <=
        window.playerStats.spAllocations[statKey]
    ) {
      clearInterval(window.draftHoldTimeout);
      return;
    }
    window.adjustSPDraft(statKey, direction);
  }, 120);
};

window.stopSPDraftHold = function (e) {
  if (e) e.stopPropagation();
  if (window.draftHoldTimeout) {
    clearInterval(window.draftHoldTimeout);
    window.draftHoldTimeout = null;
  }
};

window.adjustSPDraft = function (statKey, direction) {
  window.ensureDraftInitialized();
  if (direction > 0) {
    if (window.draftSP > 0) {
      window.draftSP--;
      window.draftAllocations[statKey]++;
    }
  } else {
    let committed = window.playerStats.spAllocations[statKey] || 0;
    if (window.draftAllocations[statKey] > committed) {
      window.draftSP++;
      window.draftAllocations[statKey]--;
    }
  }
  window.updateUI();
};

window.ensureDraftInitialized = function () {
  if (window.draftAllocations === null) {
    window.draftAllocations = { ...window.playerStats.spAllocations };
    window.draftSP = window.playerStats.sp;
  }
};

window.resetDraft = function () {
  window.showCustomConfirm(
    "Discard Changes",
    "Are you sure you want to discard your pending attribute changes?",
    "Discard",
    "Keep Drafting",
    "#e67e22",
    function () {
      window.draftAllocations = null;
      window.draftSP = 0;
      window.pushHeaderToast("🧹 Draft Discarded", "#aaa");
      window.updateUI();
    },
  );
};

window.showSPConfirmationModal = function () {
  if (!window.draftAllocations) return;
  let current = window.resolvePlayerStats(false);
  let preview = window.resolvePlayerStats(true);
  let totalInvested = window.playerStats.sp - window.draftSP;
  if (totalInvested <= 0) return;

  let modal = document.createElement("div");
  modal.id = "sp-confirm-modal";
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

  let diffs = [];
  let statsToCheck = [
    { key: "str", label: "💪 Strength", isPct: false },
    { key: "dex", label: "🎯 Dexterity", isPct: false },
    { key: "int", label: "🧠 Intelligence", isPct: false },
    { key: "atk", label: "⚔️ Attack", isPct: false },
    { key: "maxHp", label: "❤️ Max HP", isPct: false },
    { key: "def", label: "🛡️ Defense", isPct: false },
    { key: "moveSpeed", label: "👟 Move Speed", isPct: false },
    { key: "critChance", label: "✨ Crit Chance", isPct: true },
    { key: "critDamage", label: "💥 Crit Multiplier", isPct: true },
    { key: "block", label: "🛡️ Block Rate", isPct: true },
    { key: "parry", label: "⚡ Parry Rate", isPct: true },
  ];

  statsToCheck.forEach((s) => {
    let curVal = current[s.key] || 0;
    let newVal = preview[s.key] || 0;
    let diff = newVal - curVal;
    if (Math.abs(diff) > 0.0001) {
      let curStr = s.isPct
        ? Math.round(curVal * 100) + "%"
        : Math.round(curVal).toLocaleString();
      let newStr = s.isPct
        ? Math.round(newVal * 100) + "%"
        : Math.round(newVal).toLocaleString();
      let diffStr = s.isPct
        ? "+" + Math.round(diff * 100) + "%"
        : "+" + Math.round(diff).toLocaleString();
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

window.commitSPDraft = function () {
  if (!window.draftAllocations) return;

  window.playerStats.spAllocations = { ...window.draftAllocations };
  window.playerStats.sp = window.draftSP;
  window.draftAllocations = null;
  window.draftSP = 0;

  let p = window.resolvePlayerStats();
  window.playerStats.currentHp = Math.min(
    window.playerStats.currentHp,
    p.maxHp,
  );

  let modal = document.getElementById("sp-confirm-modal");
  if (modal) modal.remove();

  window.pushHeaderToast("🎉 Attributes Committed & Saved!", "#2ecc71");
  window.pushLog(
    "<span style='color:#2ecc71; font-weight:bold;'>[STATS] Committed drafted attribute points permanently. Game Saved!</span>",
  );
  window.updateUI();
  window.saveGame();
};

window.showSPPreview = function (e, statKey) {
  e.stopPropagation();
  let tt = document.getElementById("stat-tooltip");
  if (!tt) return;

  let labelMap = {
    spStr: "💪 Strength",
    spDex: "🎯 Dexterity",
    spInt: "🧠 Intelligence",
  };
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
    { key: "str", label: "💪 STR", isPct: false },
    { key: "dex", label: "🎯 DEX", isPct: false },
    { key: "int", label: "🧠 INT", isPct: false },
    { key: "atk", label: "⚔️ Attack", isPct: false },
    { key: "maxHp", label: "❤️ Max HP", isPct: false },
    { key: "def", label: "🛡️ Defense", isPct: false },
    { key: "moveSpeed", label: "👟 Move Speed", isPct: false },
    { key: "critChance", label: "✨ Crit Chance", isPct: true },
    { key: "critDamage", label: "💥 Crit Multi", isPct: true },
    { key: "block", label: "🛡️ Block Rate", isPct: true },
    { key: "parry", label: "⚡ Parry Rate", isPct: true },
  ];

  statsToCheck.forEach((s) => {
    let curVal = current[s.key] || 0;
    let newVal = preview[s.key] || 0;
    let diff = newVal - curVal;
    if (Math.abs(diff) > 0.0001) {
      let curStr = s.isPct
        ? Math.round(curVal * 100) + "%"
        : Math.round(curVal).toLocaleString();
      let newStr = s.isPct
        ? Math.round(newVal * 100) + "%"
        : Math.round(newVal).toLocaleString();
      let diffStr = s.isPct
        ? "+" + Math.round(diff * 100) + "%"
        : "+" + Math.round(diff).toLocaleString();
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

  html +=
    diffs.length === 0
      ? `<div style="color:#aaa; font-style:italic; font-size:11px; text-align:center;">No changes.</div>`
      : diffs.join("");
  html += `</div>`;
  tt.style.borderColor = "var(--accent-orange)";
  tt.innerHTML = html;
  tt.style.display = "block";
  window.positionTooltip(e, tt);
};

// --- LOG & TOAST SYSTEMS ---

window.pushLog = function (text, itemId = null) {
  if (itemId !== null) {
    let item =
      window.inventory.EQUIP.find((i) => i.id === itemId) ||
      (window.inventory.ARTIFACT &&
        window.inventory.ARTIFACT.find((i) => i.id === itemId));
    if (!item) {
      for (let k in window.equippedSlots) {
        if (window.equippedSlots[k] && window.equippedSlots[k].id === itemId)
          item = window.equippedSlots[k];
      }
    }
    if (item) {
      window.frozenItemDb[itemId] = JSON.parse(JSON.stringify(item));
      text = text.replace(
        item.name,
        `<span class="log-item-link" onmouseenter="window.showLogTooltip(event, ${itemId})" onmouseleave="window.hideTooltip()">${item.name}</span>`,
      );
    }
  }
  window.logsHistory.unshift(text);
  if (window.logsHistory.length > 50) window.logsHistory.pop();
  let box = document.getElementById("log-box");
  if (box) box.innerHTML = window.logsHistory.join("<br><br>");
};

window.pushToast = function (
  name,
  stars,
  color,
  isEtc = false,
  quantity = 1,
  customText = null,
  clickAction = null,
  isMilestone = false,
) {
  let container = document.getElementById("toast-container");
  if (!container) return;

  let toast = document.createElement("div");
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
    toast.onclick = function (e) {
      e.stopPropagation();
      clickAction();
      toast.remove();
    };
  } else {
    toast.style.pointerEvents = "none";
  }

  if (isMilestone) {
    let stageNum =
      typeof isMilestone === "number"
        ? isMilestone
        : window.playerStats.maxStage;
    toast.style.border = `2px solid #f1c40f`;
    let starsLabel = stars === "UNIQUE" ? "UNIQUE" : `${stars}★`;
    toast.innerHTML = `
      <div style="color: #f1c40f; font-size: 10px; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 5px; font-weight: 900; text-shadow: 0 0 4px rgba(241, 196, 15, 0.4);">
        🏆 MILESTONE DROP (Stage ${stageNum} Cleared!)
      </div>
      <div style="font-size: 12px; color: ${color}; font-weight: bold; margin-bottom: 3px;">
        ${name}
      </div>
      <div style="font-size: 9px; color: #aaa;">
        Quality: ${starsLabel} • Level ${Math.floor(((stageNum || 1) - 1) / 10) + 1}
      </div>
    `;
  } else if (customText) {
    toast.innerHTML = customText;
  } else {
    let label = isEtc
      ? `📦 +${quantity} Loot`
      : stars === "UNIQUE"
        ? "⭐ UNIQUE DETECTED!"
        : `⚔️ ITEM FOUND (${stars}★)`;
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

window.pushHeaderToast = function (text, color, clickAction = null) {
  window.pushToast("", null, color, false, 0, text, clickAction);
};

// --- DIALOGS, DROPDOWNS, AND CONFIRMATIONS ---

window.toggleDungeonMenu = function () {
  let menu = document.getElementById("dungeon-menu");
  if (menu) {
    menu.style.display = menu.style.display === "none" ? "block" : "none";
  }
};

window.toggleAudioMenu = function () {
  let menu = document.getElementById("audio-menu");
  if (menu) {
    menu.style.display = menu.style.display === "none" ? "block" : "none";
    window.updateAudioUI();
  }
};

window.updateAudioUI = function () {
  let masterSlider = document.getElementById("slider-vol-master");
  let sfxSlider = document.getElementById("slider-vol-sfx");
  let masterLabel = document.getElementById("vol-master-label");
  let sfxLabel = document.getElementById("vol-sfx-label");
  let muteBtn = document.getElementById("btn-audio-mute");

  if (masterSlider) masterSlider.value = window.playerStats.volumeMaster;
  if (sfxSlider) sfxSlider.value = window.playerStats.volumeSFX;
  if (masterLabel)
    masterLabel.innerText =
      Math.round(window.playerStats.volumeMaster * 100) + "%";
  if (sfxLabel)
    sfxLabel.innerText = Math.round(window.playerStats.volumeSFX * 100) + "%";
  if (muteBtn) {
    if (window.playerStats.mute) {
      muteBtn.innerText = "Unmute Audio";
      muteBtn.style.background = "#2ecc71";
    } else {
      muteBtn.innerText = "Mute Audio";
      muteBtn.style.background = "#c0392b";
    }
  }
};

window.changeVolume = function (type, val) {
  let numVal = parseFloat(val);
  if (type === "master") {
    window.playerStats.volumeMaster = numVal;
    setText("vol-master-label", Math.round(numVal * 100) + "%");
  } else if (type === "sfx") {
    window.playerStats.volumeSFX = numVal;
    setText("vol-sfx-label", Math.round(numVal * 100) + "%");
  }
  window.SoundManager.updateVolumes();
  window.saveGame();
};

window.toggleMute = function () {
  window.playerStats.mute = !window.playerStats.mute;
  window.updateAudioUI();
  window.SoundManager.updateVolumes();
  window.saveGame();
};

window.showCustomConfirm = function (
  title,
  message,
  confirmText,
  cancelText,
  accentColor,
  onConfirm,
  onCancel,
) {
  let wasPaused = window.isGamePaused;
  window.setPauseState(true);

  let overlay = document.createElement("div");
  overlay.style.position = "fixed";
  overlay.style.top = "0";
  overlay.style.left = "0";
  overlay.style.width = "100%";
  overlay.style.height = "100%";
  overlay.style.backgroundColor = "rgba(8, 2, 2, 0.88)";
  overlay.style.display = "flex";
  overlay.style.justifyContent = "center";
  overlay.style.alignItems = "center";
  overlay.style.zIndex = "40000";
  overlay.style.backdropFilter = "blur(5px)";
  overlay.style.animation = "deathFadeIn 0.25s ease-out";

  let card = document.createElement("div");
  card.style.background = "linear-gradient(135deg, #151515, #0a0a0c)";
  card.style.border = `2px solid ${accentColor}`;
  card.style.borderRadius = "8px";
  card.style.padding = "20px";
  card.style.width = "90%";
  card.style.maxWidth = "400px";
  card.style.boxShadow = `0 10px 35px rgba(0,0,0,0.95), inset 0 0 15px ${accentColor}25`;
  card.style.textAlign = "center";
  card.style.animation =
    "deathCardPop 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.1)";

  card.innerHTML = `
        <div style="font-size: 16px; font-weight: bold; color: ${accentColor}; letter-spacing: 1.5px; margin-bottom: 8px; text-transform: uppercase;">${title}</div>
        <div style="height: 1px; background: linear-gradient(90deg, transparent, ${accentColor}, transparent); margin: 8px 0 15px 0;"></div>
        <div style="font-size: 11.5px; color: #cbd5e1; line-height: 1.55; margin-bottom: 20px; white-space: normal; text-align: center;">${message}</div>
        <div style="display: flex; gap: 10px;">
            <button id="cust-btn-cancel" class="nav-btn" style="flex: 1; justify-content: center; background: #222; border: 1px solid #444; color: #aaa; padding: 10px; font-size:11px; font-weight:bold; border-radius:4px; height: auto;">${cancelText || "Cancel"}</button>
            <button id="cust-btn-commit" class="nav-btn" style="flex: 1; justify-content: center; background: ${accentColor}; border: 1px solid ${accentColor}; color: white; padding: 10px; font-size:11px; font-weight:bold; border-radius:4px; height: auto;">${confirmText || "Confirm"}</button>
        </div>
    `;
  overlay.appendChild(card);
  document.body.appendChild(overlay);

  const cleanup = () => {
    overlay.style.animation = "toastFadeOut 0.18s ease-in forwards";
    setTimeout(() => {
      overlay.remove();
      if (!wasPaused) window.setPauseState(false);
    }, 170);
  };
  card.querySelector("#cust-btn-cancel").onclick = (e) => {
    e.stopPropagation();
    cleanup();
    if (onCancel) onCancel();
  };
  card.querySelector("#cust-btn-commit").onclick = (e) => {
    e.stopPropagation();
    cleanup();
    if (onConfirm) onConfirm();
  };
};

window.addEtcDrop = function (itemName, amount = 1) {
  if (!window.inventory.ETC[itemName]) {
    window.inventory.ETC[itemName] = 0;
  }
  window.inventory.ETC[itemName] += amount;
  if (typeof window.renderInventory === "function") window.renderInventory();
};

window.addUseDrop = function (itemName, amount = 1) {
  if (!window.inventory.USE[itemName]) {
    window.inventory.USE[itemName] = 0;
  }
  window.inventory.USE[itemName] += amount;
  if (typeof window.renderInventory === "function") window.renderInventory();
};

window.setPauseState = function (paused) {
  window.isGamePaused = paused;
  let btn = document.getElementById("btn-pause");
  if (btn) {
    if (window.isGamePaused) {
      btn.innerText = "⏸️ PAUSED";
      btn.classList.add("active");
      btn.style.background = "#e74c3c";
    } else {
      btn.innerText = "▶️ Pause";
      btn.classList.remove("active");
      btn.style.background = "#34495e";
    }
  }
};

window.togglePause = function () {
  let deathOverlay = document.getElementById("death-overlay");
  let offlineModal = document.getElementById("offline-summary-modal");
  if ((deathOverlay && deathOverlay.style.display === "flex") || offlineModal) {
    return;
  }
  window.setPauseState(!window.isGamePaused);
  if (typeof window.pushHeaderToast === "function") {
    window.pushHeaderToast(
      window.isGamePaused ? "⏸️ Game Paused!" : "▶️ Game Resumed!",
      window.isGamePaused ? "#e74c3c" : "#2ecc71",
    );
  }
};

window.toggleAuto = function () {
  window.state.autoAttack = !window.state.autoAttack;
  let btn = document.getElementById("toggle-auto");
  if (btn) {
    btn.innerText = window.state.autoAttack ? "Auto: ON" : "Auto: OFF";
    btn.className = window.state.autoAttack
      ? "btn-toggle active"
      : "btn-toggle";
  }
  window.state.efficiency = window.state.autoAttack ? 1.0 : 1.15;
  if (typeof window.updateUI === "function") window.updateUI();
};

window.updateStickyCanvasStyle = function () {
  let active = window.playerStats.stickyCanvas !== false;
  let btn = document.getElementById("settings-toggle-sticky");
  if (btn) {
    btn.innerText = active ? "Sticky Cam: ON" : "Sticky Cam: OFF";
    btn.className = active ? "btn-action" : "btn-action un";
  }
  let canvasEl = document.getElementById("gameCanvas");
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

window.toggleStickyCanvas = function () {
  window.playerStats.stickyCanvas = !window.playerStats.stickyCanvas;
  window.updateStickyCanvasStyle();
  if (typeof window.saveGame === "function") window.saveGame();
};

window.toggleSettings = function () {
  let modal = document.getElementById("settings-modal");
  if (!modal) return;
  if (modal.style.display === "none" || modal.style.display === "") {
    window.hideTooltip();
    modal.style.display = "block";
    window.updateAudioUI();
    window.updateStickyCanvasStyle();

    // Populate and display current character name
    let nameInput = document.getElementById("settings-player-name");
    if (nameInput) {
      nameInput.value = window.playerStats.playerName || "Guest";
    }
    let nameLabel = document.getElementById("current-name-label");
    if (nameLabel) {
      nameLabel.innerText = `(Current: ${window.playerStats.playerName || "Guest"})`;
    }
  } else {
    modal.style.display = "none";
    window.hideTooltip();
  }
};

window.leaveActivity = function () {
  if (!window.playerStats.isDungeonMode && !window.playerStats.isCrucibleMode) {
    if (typeof window.pushHeaderToast === "function")
      window.pushHeaderToast(
        "You are not currently in an activity!",
        "#e74c3c",
      );
    return;
  }
  window.showCustomConfirm(
    "Retreat to Campaign",
    "Are you sure you want to retreat to the Campaign? You will keep your current progress and earn prorated rewards.",
    "Retreat",
    "Stay",
    "#e74c3c",
    function () {
      let p = window.resolvePlayerStats();

      if (window.playerStats.isCrucibleMode) {
        let finalWave = window.playerStats.crucibleWave || 1;
        window.playerStats.cruciblePeak = Math.max(
          window.playerStats.cruciblePeak || 1,
          finalWave,
        );

        let startW = window.playerStats.crucibleStartWave || 1;
        let gainedShards = 0;
        let gainedCores = 0;

        for (let w = startW; w < finalWave; w++) {
          gainedShards += Math.ceil(1.5 * (1 + w * 0.03));

          // Mirrored progression gates for Catalyst Core retreat payouts
          if (w > 20) {
            if (w <= 50) {
              if (w % 10 === 0 && Math.random() < 0.2) gainedCores++;
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

        window.playerStats.astralShards =
          (window.playerStats.astralShards || 0) + gainedShards;
        if (gainedCores > 0) window.addEtcDrop("Catalyst Core", gainedCores);

        if (typeof window.pushLog === "function")
          window.pushLog(
            `<span style='color:#9b59b6; font-weight:bold;'>[CRUCIBLE RETREAT] Safely left the Crucible at Wave ${finalWave}. Earned ${gainedShards} Shards and ${gainedCores} Catalyst Cores!</span>`,
          );
        if (typeof window.pushHeaderToast === "function")
          window.pushHeaderToast(
            `🏃 Crucible Cleared! Wave ${finalWave}`,
            "#9b59b6",
          );

        if (typeof window.showCrucibleSummaryModal === "function")
          window.showCrucibleSummaryModal(finalWave, gainedShards, gainedCores);
      } else if (window.playerStats.isDungeonMode) {
        let dType = window.playerStats.currentDungeon;
        let dStage = window.playerStats.currentDungeonStage[dType] || 1;
        window.playerStats.dungeonPeaks[dType] = Math.max(
          window.playerStats.dungeonPeaks[dType] || 1,
          dStage,
        );

        if (typeof window.pushLog === "function")
          window.pushLog(
            `<span style='color:#8e44ad; font-weight:bold;'>[DUNGEON RETREAT] Safely retreated from ${dType.toUpperCase()} Dungeon at Stage ${dStage}.</span>`,
          );
        if (typeof window.pushHeaderToast === "function")
          window.pushHeaderToast(`🏃 Retreated! Stage ${dStage}`, "#8e44ad");
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
      if (typeof window.checkAchievements === "function")
        window.checkAchievements();
      if (typeof window.updateUI === "function") window.updateUI();
      if (typeof window.renderInventory === "function")
        window.renderInventory();
      if (typeof window.saveGame === "function") window.saveGame();
    },
  );
};

// --- DYNAMIC ATTRIBUTE HOVER TOOLTIPS ---

window.showStatBreakdown = function (e, statKey, isPct = false) {
  e.stopPropagation();
  let tt = document.getElementById("stat-tooltip");
  if (!tt) return;

  let clientX =
    e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
  let clientY =
    e.clientY || (e.touches && e.touches[0] ? e.touches[0].clientY : 0);
  window.activeStatTooltip = {
    type: "breakdown",
    key: statKey,
    isPct: !!isPct,
    clientX: clientX,
    clientY: clientY,
    target: e.currentTarget || e.target,
  };

  let alloc = window.playerStats.spAllocations;
  let p = window.resolvePlayerStats();
  let effectiveStr = Math.max(0, p.str - 5);
  let effectiveDex = Math.max(0, p.dex - 5);
  let effectiveInt = Math.max(0, p.int - 5);

  let map = {
    str: {
      title: "💪 STR (Strength)",
      base: window.playerStats.baseStr,
      lvl: (alloc.spStr || 0) * 3,
      color: "#fff",
    },
    dex: {
      title: "🎯 DEX (Dexterity)",
      base: window.playerStats.baseDex,
      lvl: (alloc.spDex || 0) * 3,
      color: "#fff",
    },
    int: {
      title: "🧠 INT (Intelligence)",
      base: window.playerStats.baseInt,
      lvl: (alloc.spInt || 0) * 3,
      color: "#fff",
    },
    atk: {
      title: "⚔️ Total Attack",
      base: window.playerStats.baseAtk,
      lvl: alloc.spAtk * 6,
      color: "#fff",
    },
    maxHp: {
      title: "❤️ Max Health",
      base: window.playerStats.baseMaxHp,
      lvl: alloc.spHp * 50,
      color: "#fff",
    },
    def: {
      title: "🛡️ Total Defense",
      base: window.playerStats.baseDef,
      lvl: alloc.spDef * 5,
      color: "#fff",
    },
    moveSpeed: {
      title: "👟 Move Speed",
      base: window.playerStats.baseMoveSpeed,
      lvl: alloc.spSpd * 1,
      color: "#fff",
    },
    critChance: {
      title: "✨ Crit Chance",
      base: window.playerStats.baseCritChance,
      lvl: alloc.spCrit * 0.005,
      color: "#e67e22",
    },
    critDamage: {
      title: "💥 Crit Multiplier",
      base: window.playerStats.baseCritDamage,
      lvl: alloc.spCritDmg * 0.02,
      color: "#f1c40f",
    },
    block: {
      title: "🛡️ Block Rate",
      base: window.playerStats.baseBlock,
      lvl: alloc.spBlock * 0.005,
      color: "#3498db",
    },
    parry: {
      title: "⚡ Parry Rate",
      base: window.playerStats.baseParry,
      lvl: alloc.spParry * 0.005,
      color: "#e74c3c",
    },
    rareSpawn: {
      title: "✨ Rare Enemy Spawn",
      base: window.playerStats.baseRareSpawn,
      lvl: 0,
      color: "#ffb6c1",
    },
    fairySpawn: {
      title: "🧚 Fairy Spawn Rate",
      base: window.playerStats.baseFairySpawn,
      lvl: 0,
      color: "#ffb6c1",
    },
    gold: {
      title: "🟡 Gold Multiplier",
      base: window.playerStats.baseGold,
      lvl: 0,
      color: "#f1c40f",
    },
  };

  let data = map[statKey] || {
    title: statKey.toUpperCase(),
    base: 0,
    lvl: 0,
    color: "#fff",
  };
  let gearTotal = 0;
  let artTotal = 0;

  for (let key in window.equippedSlots) {
    let item = window.equippedSlots[key];
    if (item && item[statKey] !== undefined) {
      if (item.type === "artifact") artTotal += item[statKey];
      else gearTotal += item[statKey];
    }
  }

  let achTotal = 0;
  let achPctTotal = 0;
  if (window.playerStats.unlockedAchievements && window.AchievementsData) {
    window.playerStats.unlockedAchievements.forEach((id) => {
      let ach = window.AchievementsData.find((a) => a.id === id);
      if (ach && ach.stats) {
        if (ach.stats[statKey] !== undefined) achTotal += ach.stats[statKey];
        let pctKey = statKey + "Pct";
        if (ach.stats[pctKey] !== undefined) achPctTotal += ach.stats[pctKey];
      }
    });
  }

  let intScaleTotal = 0;
  let prestigeTotal = 0;
  if (statKey === "fairySpawn") {
    intScaleTotal = effectiveInt * 0.001;
    prestigeTotal = (window.playerStats.prestigeUpgrades?.fairy || 0) * 0.05;
  }

  // Calculate Set Bonuses for Tooltip Breakdown
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
  let overallAdoptedSet = null;
  if (window.equippedSlots.overall) {
    overallAdoptedSet =
      (window.equippedSlots.helmet &&
        window.getItemSetName(window.equippedSlots.helmet)) ||
      (window.equippedSlots.boots &&
        window.getItemSetName(window.equippedSlots.boots)) ||
      (window.equippedSlots.weapon &&
        window.getItemSetName(window.equippedSlots.weapon)) ||
      null;
  }
  eligibleSetSlots.forEach((slot) => {
    let item = window.equippedSlots[slot];
    if (item) {
      let setName = window.getItemSetName(item);
      if (slot === "overall" && overallAdoptedSet) setName = overallAdoptedSet;
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

  let setFlatBonus = 0;
  let setPctBonus = 0;

  if (statKey === "atk") {
    setFlatBonus = setCtx.atk;
    setPctBonus = setCtx.atkPctBonus;
  } else if (statKey === "maxHp") {
    setFlatBonus = setCtx.maxHp;
    setPctBonus = setCtx.maxHpPctBonus;
  } else if (statKey === "def") {
    setFlatBonus = setCtx.flatDefBonus;
    setPctBonus = setCtx.defPctBonus;
  } else if (statKey === "moveSpeed") {
    setFlatBonus = setCtx.moveSpeed;
  } else if (statKey === "str") {
    setFlatBonus = setCtx.str;
  } else if (statKey === "dex") {
    setFlatBonus = setCtx.dex;
  } else if (statKey === "int") {
    setFlatBonus = setCtx.int;
  } else if (statKey === "critChance") {
    setPctBonus = setCtx.critChance;
  } else if (statKey === "critDamage") {
    setPctBonus = setCtx.critDamage;
  } else if (statKey === "block") {
    setPctBonus = setCtx.block;
  } else if (statKey === "parry") {
    setPctBonus = setCtx.parry;
  } else if (statKey === "gold") {
    setPctBonus = setCtx.gold;
  } else if (statKey === "dropRate") {
    setPctBonus = setCtx.drop;
  } else if (statKey === "quality") {
    setPctBonus = setCtx.qly;
  } else if (statKey === "rareSpawn") {
    setPctBonus = setCtx.rareSpawn;
  }

  let formatVal = (v) =>
    isPct ? `+${Math.floor(v * 100)}%` : `+${v.toLocaleString()}`;
  if (statKey === "gold")
    formatVal = (v) =>
      `+${v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  let html = `<div style="padding: 10px; width: 220px; box-sizing: border-box;">
                    <div class="tt-title" style="color:${data.color};">${data.title} Breakdown</div>
                    <div class="tt-stat-line" style="color:#aaa;">• Base Entity: ${formatVal(data.base).replace("+", "")}</div>`;

  if (data.lvl > 0)
    html += `<div class="tt-stat-line" style="color:#3498db;">• Level Stats (SP): ${formatVal(data.lvl)}</div>`;
  if (gearTotal > 0)
    html += `<div class="tt-stat-line" style="color:#2ecc71;">• Equipment / Elixirs: ${formatVal(gearTotal)}</div>`;
  if (artTotal > 0)
    html += `<div class="tt-stat-line" style="color:#9b59b6;">• Artifacts: ${formatVal(artTotal)}</div>`;
  if (achTotal > 0)
    html += `<div class="tt-stat-line" style="color:#f1c40f;">• Achievements (Flat): ${formatVal(achTotal)}</div>`;
  if (achPctTotal > 0)
    html += `<div class="tt-stat-line" style="color:#f1c40f;">• Achievements (Mult): +${Math.round(achPctTotal * 100)}%</div>`;
  if (setFlatBonus > 0)
    html += `<div class="tt-stat-line" style="color:#e67e22;">• Set Bonuses (Flat): ${formatVal(setFlatBonus)}</div>`;
  if (setPctBonus > 0)
    html += `<div class="tt-stat-line" style="color:#e67e22;">• Set Bonuses (Mult): +${Math.round(setPctBonus * 100)}%</div>`;
  if (prestigeTotal > 0)
    html += `<div class="tt-stat-line" style="color:#8e44ad;">• Prestige Upgrades: ${formatVal(prestigeTotal)}</div>`;
  if (intScaleTotal > 0)
    html += `<div class="tt-stat-line" style="color:#9b59b6;">• Intelligence Scaling (INT): ${formatVal(intScaleTotal)}</div>`;

  let totalVal =
    data.base +
    data.lvl +
    gearTotal +
    artTotal +
    achTotal +
    intScaleTotal +
    prestigeTotal +
    setFlatBonus;
  if (statKey === "atk" && effectiveStr > 0) {
    let actualDmgAdded = Math.floor(totalVal * (effectiveStr * 0.003));
    html += `<div class="tt-stat-line" style="color:#e67e22;">• Strength Scaling (STR): +${actualDmgAdded} Damage</div>`;
    html += `<div class="tt-stat-line" style="color:#e67e22; font-style:italic;">  (+${(effectiveStr * 0.3).toFixed(1)}% Multiplier)</div>`;
  }
  if (statKey === "maxHp" && effectiveStr > 0) {
    let hpBonus = Math.floor(totalVal * (effectiveStr * 0.003));
    html += `<div class="tt-stat-line" style="color:#e74c3c;">• Strength Scaling (STR): +${hpBonus.toLocaleString()} HP</div>`;
    html += `<div class="tt-stat-line" style="color:#e74c3c; font-style:italic;">  (+${(effectiveStr * 0.3).toFixed(1)}% Multiplier)</div>`;
  }
  if (statKey === "def" && effectiveInt > 0) {
    let logarithmicIntPct = Math.log10(effectiveInt + 1) * 0.15;
    html += `<div class="tt-stat-line" style="color:#9b59b6;">• Intelligence Scaling (INT): +${Math.floor(totalVal * logarithmicIntPct)} Defense</div>`;
    html += `<div class="tt-stat-line" style="color:#9b59b6; font-style:italic;">  (+${(logarithmicIntPct * 100).toFixed(1)}% Multiplier)</div>`;
  }
  if (statKey === "moveSpeed" && effectiveDex > 0) {
    let scaleVal = (effectiveDex * 20) / (effectiveDex + 150);
    html += `<div class="tt-stat-line" style="color:#3498db;">• Dexterity Scaling (DEX): +${scaleVal.toFixed(1)} Speed</div>`;
  }
  if (statKey === "critChance" && effectiveDex > 0) {
    let scaleVal = (effectiveDex * 0.3) / (effectiveDex + 250);
    html += `<div class="tt-stat-line" style="color:#3498db;">• Dexterity Scaling (DEX): +${(scaleVal * 100).toFixed(1)}%</div>`;
  }
  if (statKey === "critDamage" && effectiveDex > 0) {
    let scaleVal = effectiveDex * 0.003;
    html += `<div class="tt-stat-line" style="color:#3498db;">• Dexterity Scaling (DEX): +${(scaleVal * 100).toFixed(1)}%</div>`;
  }
  if (statKey === "block" && effectiveInt > 0) {
    let scaleVal = (effectiveInt * 0.12) / (effectiveInt + 150);
    html += `<div class="tt-stat-line" style="color:#9b59b6;">• Intelligence Scaling (INT): +${(scaleVal * 100).toFixed(1)}%</div>`;
  }
  if (statKey === "parry" && effectiveInt > 0) {
    let scaleVal = (effectiveInt * 0.12) / (effectiveInt + 150);
    html += `<div class="tt-stat-line" style="color:#9b59b6;">• Intelligence Scaling (INT): +${(scaleVal * 100).toFixed(1)}%</div>`;
  }
  if (statKey === "critChance" || statKey === "critDamage") {
    if (window.playerStats.frenzyTimer > 0)
      html += `<div class="tt-stat-line" style="color:#e67e22; font-weight:bold; margin-top:5px;">• FRENZY BUFF ACTIVE!</div>`;
  }
  if (statKey === "block" || statKey === "parry") {
    let rawSum = statKey === "block" ? p.rawBlock : p.rawParry;
    html += `<div style="margin: 6px 0; border-top: 1px dashed #444; padding-top: 4px; color: #ffb6c1; font-weight: bold;">Asymptotic Diminishing Returns:</div>`;
    html += `<div class="tt-stat-line" style="color:#aaa;">• Raw Accumulated Sum: <strong style="color:#fff;">${Math.round(rawSum * 100)}%</strong></div>`;
    html += `<div class="tt-stat-line" style="color:#2ecc71;">• Effective Avoidance: <strong style="color:#2ecc71;">${Math.floor(p[statKey] * 100)}%</strong></div>`;
  }
  if (statKey === "str") {
    let effStr = Math.max(0, totalVal - 5);
    html += `<div style="margin: 6px 0; border-top: 1px dashed #444; padding-top: 4px; color: #ffb6c1; font-weight: bold;">Scaling Contributions:</div>`;
    html += `<div class="tt-stat-line" style="color:#2ecc71;">• Attack Multiplier: +${(effStr * 0.3).toFixed(1)}%</div>`;
    html += `<div class="tt-stat-line" style="color:#e74c3c;">• Max HP Multiplier: +${(effStr * 0.3).toFixed(1)}%</div>`;
  } else if (statKey === "dex") {
    let effDex = Math.max(0, totalVal - 5);
    let critChScale = (effDex * 0.3) / (effDex + 250);
    let moveSpdScale = (effDex * 20) / (effDex + 150);
    html += `<div style="margin: 6px 0; border-top: 1px dashed #444; padding-top: 4px; color: #ffb6c1; font-weight: bold;">Scaling Contributions:</div>`;
    html += `<div class="tt-stat-line" style="color:#e67e22;">• Crit Chance: +${(critChScale * 100).toFixed(1)}%</div>`;
    html += `<div class="tt-stat-line" style="color:#f1c40f;">• Crit Multiplier: +${(effDex * 0.3).toFixed(1)}%</div>`;
    html += `<div class="tt-stat-line" style="color:#3498db;">• Move Speed Boost: +${moveSpdScale.toFixed(1)}</div>`;
  } else if (statKey === "int") {
    let effInt = Math.max(0, totalVal - 5);
    let blockChScale = (effInt * 0.12) / (effInt + 150);
    let intDefPct = Math.log10(effInt + 1) * 0.15;
    let potDurScale = effInt * 0.0001;
    html += `<div style="margin: 6px 0; border-top: 1px dashed #444; padding-top: 4px; color: #ffb6c1; font-weight: bold;">Scaling Contributions:</div>`;
    html += `<div class="tt-stat-line" style="color:#3498db;">• Block Rate Boost: +${(blockChScale * 100).toFixed(1)}%</div>`;
    html += `<div class="tt-stat-line" style="color:#e74c3c;">• Parry Rate Boost: +${(blockChScale * 100).toFixed(1)}%</div>`;
    html += `<div class="tt-stat-line" style="color:#2ecc71;">• Defense Multiplier: +${(intDefPct * 100).toFixed(1)}%</div>`;
    html += `<div class="tt-stat-line" style="color:#9b59b6;">• Potion Duration: +${potDurScale.toFixed(4)}%</div>`;
  }

  html += `</div>`;
  tt.style.borderColor = data.color;
  tt.innerHTML = html;
  tt.style.display = "block";
  window.positionTooltip(e, tt);
};

window.renderMarketShop = function () {
  let el = document.getElementById("gold-shop-list");
  if (!el) return;
  el.innerHTML = window.playerStats.shopItems
    .map((shopItem, index) => {
      let nameColor = window.getTierColor(shopItem.statsRolled);
      let costColor =
        window.playerStats.coins >= shopItem.cost ? "#2ecc71" : "#e74c3c";
      return `<div class="shop-row ${shopItem.isIOTD ? "iotd" : ""}" onmouseenter="window.showMarketTooltip(event, ${index})" onmouseleave="window.hideTooltip()" ontouchstart="window.showMarketTooltip(event, ${index})">
                                                       <div>${shopItem.isIOTD ? '<span style="background:#f1c40f; color:#000; font-size:9px; font-weight:bold; padding:1px 3px; border-radius:2px;">ITEM OF THE DAY</span><br>' : ""}<strong style="color:${nameColor}; font-size:12px;">${shopItem.name}</strong><br><span style="font-size:10px; color:#aaa;">${shopItem.statsRolled}★ Quality</span></div>
                                                       <div style="text-align:right; position:relative; z-index:10;"><div style="color:${costColor}; font-weight:bold; font-size:11px; margin-bottom:4px;">${window.formatNumber(shopItem.cost)} Gold</div><button class="btn-action" style="${shopItem.purchased || window.playerStats.coins < shopItem.cost ? "opacity:0.5; cursor:not-allowed; background:#444;" : "background:#f1c40f; color:#000;"}" onclick="window.buyShopItem(${index})">${shopItem.purchased ? "SOLD" : "BUY"}</button></div>
                                                   </div>`;
    })
    .join("");
};

window.renderMysticalShop = function () {
  let el = document.getElementById("mystical-shop-list");
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
      displayCost = Math.ceil(
        item.cost * Math.pow(1.08, window.playerStats.stage),
      );
      costColor =
        window.playerStats.coins >= displayCost ? "#f1c40f" : "#e74c3c";
    }

    let iconHtml =
      item.name === "Gacha Key" ||
      item.name === "Astral Essence" ||
      item.name === "Catalyst Core"
        ? getEtcIconHtml(item.name)
        : getUseIconHtml(item.name);
    iconHtml = iconHtml.replace("margin-right: 12px;", "margin-right: 8px;");
    let bgStyle = window.hexToRgba(item.color, 0.05);

    return `<div class="shop-row" style="border-color: ${item.color}; background: ${bgStyle}; flex-direction: column; align-items: stretch; text-align: left; gap: 4px; padding: 8px; cursor: help;" onmouseenter="window.showMysticalShopTooltip(event, ${index})" ontouchstart="window.showMysticalShopTooltip(event, ${index})" onmouseleave="window.hideTooltip()">
                                                                                                                                                <div style="display:flex; justify-content:space-between; align-items:center;">
                                                                                                                                                    <div style="display:flex; align-items:center;">
                                                                                                                                                        ${iconHtml}
                                                                                                                                                        <strong style="color:${item.color}; font-size:12px;">${item.name}</strong>
                                                                                                                                                    </div>
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

    let iconHtml = getUseIconHtml(recipe.result);
    iconHtml = iconHtml.replace("margin-right: 12px;", "margin-right: 8px;");
    let bgStyle = window.hexToRgba(recipe.color, 0.03);

    return `<div class="shop-row" style="border-color: ${recipe.color}; background: ${bgStyle}; flex-direction: column; align-items: stretch; text-align: left; gap: 4px; padding: 8px; cursor: help;" onmouseenter="window.showTransmuteTooltip(event, ${index})" ontouchstart="window.showTransmuteTooltip(event, ${index})" onmouseleave="window.hideTooltip()">
                                                                                                                                                <div style="display:flex; justify-content:space-between; align-items:center;">
                                                                                                                                                    <div style="display:flex; align-items:center;">
                                                                                                                                                        ${iconHtml}
                                                                                                                                                        <strong style="color:${recipe.color}; font-size:12px;">Transmute: ${recipe.result}</strong>
                                                                                                                                                    </div>
                                                                                                                                                    <span style="color:${costColor}; font-weight:bold; font-size:11px;">${recipe.amount}x ${recipe.req}</span>
                                                                                                                                                </div>
                                                                                                                                                <div style="font-size:10px; color:#aaa; margin-bottom:6px;">${recipe.desc} (Owned: ${ownedCount})</div>
                                                                                                                                                <button class="btn-action" style="background:${recipe.color}; color:#fff;" ${canAfford ? "" : 'disabled style="opacity:0.5; cursor:not-allowed;"'} onclick="window.transmutePotion(${index})">Transmute</button>
                                                                                                                                            </div>`;
  }).join("");

  el.innerHTML = stockHtml + transHtml;
};

window.renderGoldUpgrades = function () {
  let el = document.getElementById("gold-upgrades-list");
  if (!el) return;
  let p = window.playerStats;

  let upgrades = [
    {
      id: "vending",
      name: "🎰 Gacha Calibration",
      level: p.vendingQLevel || 0,
      cost: Math.floor(15000 * Math.pow(1.18, p.vendingQLevel || 0)),
      desc: "Increases Vending Machine loot quality by +1% per level.",
      color: "#f1c40f",
    },
    {
      id: "shop",
      name: "🛒 Merchant Investment",
      level: p.shopQLevel || 0,
      cost: Math.floor(30000 * Math.pow(1.22, p.shopQLevel || 0)),
      desc: "Increases Gold Shop stock quality by +1% per level.",
      color: "#3498db",
    },
    {
      id: "global",
      name: "🍀 Aura of Fortune",
      level: p.globalQLevel || 0,
      cost: Math.floor(100000 * Math.pow(1.28, p.globalQLevel || 0)),
      desc: "Increases all global and dungeon drop quality by +1.5% per level.",
      color: "#2ecc71",
    },
  ];

  const hexToRgba = (hex, alpha) => {
    let r = parseInt(hex.slice(1, 3), 16),
      g = parseInt(hex.slice(3, 5), 16),
      b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  el.innerHTML = upgrades
    .map((up) => {
      let costColor = p.coins >= up.cost ? "#f1c40f" : "#e74c3c";
      let bgStyle = hexToRgba(up.color, 0.04);
      let bonusPct = up.level * (up.id === "global" ? 1.5 : 1);
      return `<div class="shop-row" style="border-color: ${up.color}; background: ${bgStyle}; flex-direction: column; align-items: stretch; text-align: left; gap: 4px; padding: 8px; cursor: help;" onmouseenter="window.showGoldUpgradeTooltip(event, '${up.id}')" onmouseleave="window.hideTooltip()" ontouchstart="window.showGoldUpgradeTooltip(event, '${up.id}')">
                                                   <div style="display:flex; justify-content:space-between; align-items:center;">
                                                       <strong style="color:${up.color}; font-size:12px;">${up.name} <span style="color:#aaa;">(Lv. ${up.level})</span></strong>
                                                       <span style="color:${costColor}; font-weight:bold; font-size:11px;">${window.formatNumber(up.cost)} Gold</span>
                                                   </div>
                                                   <div style="font-size:10px; color:#aaa; margin-bottom:6px;">${up.desc} Currently: <span style="color:#fff; font-weight:bold;">+${bonusPct.toFixed(1)}% Quality</span></div>
                                                   <button class="btn-action" style="background:${up.color}; color:#111; font-weight:bold;" onclick="window.buyGoldUpgrade('${up.id}')">Upgrade</button>
                                               </div>`;
    })
    .join("");
};

window.getPrestigeUpgradeCost = function (type, currentLevel) {
  if (type === "bag") return 10; // Bag upgrade remains flat 10 PP
  return currentLevel + 1; // Uncapped linear cost progression (1 PP, 2 PP, 3 PP...)
};

window.changePrestigeBossStage = function (direction) {
  let p = window.playerStats;
  let maxS = p.maxStage || 80;
  if (maxS < 80) maxS = 80;

  let newStage = (p.selectedPrestigeStage || 80) + direction;
  if (newStage < 80) newStage = 80;
  if (newStage > maxS) newStage = maxS;

  p.selectedPrestigeStage = newStage;
  window.renderPrestigeTab();
};

window.renderPrestigeTab = function () {
  let el = document.getElementById("tab-prestige");
  if (!el) return;

  let p = window.playerStats;
  if (p.level < 25 && (p.prestigeCount || 0) === 0) {
    let progressPct = Math.min(100, (p.level / 25) * 100);
    el.innerHTML = `
        <div style="text-align:center; padding: 40px 20px; background: linear-gradient(135deg, #0e051d 0%, #030109 100%); border: 2px solid #8e44ad; border-radius: 8px; box-shadow: 0 8px 30px rgba(0,0,0,0.9), inset 0 0 20px rgba(142, 68, 173, 0.22); max-width: 440px; margin: 0 auto; animation: toastFadeIn 0.3s ease-out;">
            <div style="margin-bottom: 20px;">
                <svg width="72" height="72" viewBox="0 0 64 64" style="display:inline-block; filter: drop-shadow(0 0 10px #8e44ad);">
                    <circle cx="32" cy="32" r="28" fill="none" stroke="#9b59b6" stroke-width="2" stroke-dasharray="4 4" />
                    <path d="M20 28 L20 22 C20 15, 24 12, 32 12 C40 12, 44 15, 44 22 L44 28" fill="none" stroke="#9b59b6" stroke-width="3" stroke-linecap="round" />
                    <rect x="16" y="26" width="32" height="24" rx="4" fill="#0c0515" stroke="#9b59b6" stroke-width="3" />
                    <path d="M32 33 L32 40" stroke="#ff007f" stroke-width="3" stroke-linecap="round" />
                    <circle cx="32" cy="33" r="2" fill="#ff007f" />
                </svg>
            </div>
            <h3 style="margin:0 0 10px 0; color:#df9ffb; font-size:15px; font-weight:bold; letter-spacing:2px; text-transform:uppercase; text-shadow: 0 0 10px rgba(155, 89, 182, 0.55);">Celestial Seal Active</h3>
            <p style="font-size:11px; color:#a29bfe; max-width: 320px; margin: 0 auto 15px auto; line-height: 1.5; white-space:normal;">
                The Altar of Ascension is protected by an ancient cosmic seal. Reach <strong style="color:#ffd700;">Level 25</strong> to break the seal and unlock permanent multipliers!
            </p>
            <div style="width:100%; max-width:260px; margin: 0 auto 8px auto; background:#111; height:8px; border-radius:4px; overflow:hidden; border:1px solid #333; position:relative;">
                <div style="width:${progressPct}%; height:100%; background:linear-gradient(90deg, #9b59b6, #e84393); box-shadow:0 0 8px #9b59b6; transition: width 0.4s ease;"></div>
            </div>
            <div style="font-size: 11.5px; font-weight: bold; color: #f1f5f9; font-family: monospace;">
                Progress: <span style="color:#e74c3c;">Lv ${p.level}</span> / <span style="color:#2ecc71;">25</span> (${progressPct.toFixed(0)}%)
            </div>
        </div>
    `;
    return;
  }

  let upgrades = p.prestigeUpgrades || {
    bag: 0,
    gold: 0,
    exp: 0,
    drop: 0,
    atk: 0,
    fort: 0,
    fairy: 0,
  };
  let goldPts = upgrades.gold || 0;
  let expPts = upgrades.exp || 0;
  let dropPts = upgrades.drop || 0;
  let atkPts = upgrades.atk || 0;
  let fortPts = upgrades.fort || 0;
  let fairyPts = upgrades.fairy || 0;

  // Render Left Column: Hooktail Battle Console with Level Selector
  let maxS = p.maxStage || 80;
  if (maxS < 80) maxS = 80;
  if (p.selectedPrestigeStage === undefined) p.selectedPrestigeStage = maxS;
  p.selectedPrestigeStage = Math.max(
    80,
    Math.min(maxS, p.selectedPrestigeStage),
  );

  let activeStage = p.selectedPrestigeStage;
  let growthRate = 1.045 + (activeStage * 0.04) / (activeStage + 200);
  let scale = Math.pow(growthRate, activeStage);

  let hpVal = Math.floor(600 * scale);
  let dmgVal = Math.floor(6 * scale);
  let defVal = Math.floor(80 + (activeStage - 80) * 1.5);

  // Projected Victory Rewards (Prorated scaling based on selected challenge tier)
  let basePoints = 3;
  let bonusPoints = Math.floor(p.prestigeCount / 4);
  let pushBonus = Math.max(0, Math.floor((activeStage - 80) / 10));
  let totalPP = Math.min(10, basePoints + bonusPoints) + pushBonus;

  let rewardMultiplier = activeStage / 80;
  let estCores = Math.round(4 * rewardMultiplier);
  let estShards = Math.round(11 * rewardMultiplier);

  let challengeBtnHtml = "";
  if (p.level < 25) {
    challengeBtnHtml = `<button class="btn-action" style="background:#333; color:#777; width:100%; padding:12px; font-weight:bold; font-size:11px; border:1px solid #444; cursor:not-allowed;" disabled>🔒 Level 25 Required</button>`;
  } else if (p.maxStage < 80) {
    challengeBtnHtml = `<button class="btn-action" style="background:#2c1a1a; color:#e74c3c; width:100%; padding:12px; font-weight:bold; font-size:11px; border:1px solid #781c1c; cursor:not-allowed;" disabled>🔒 Reach Stage 80 (Peak: ${p.maxStage})</button>`;
  } else {
    challengeBtnHtml = `
      <button class="btn-action btn-pulse" style="background:#e74c3c; color:white; width:100%; padding:12px; font-weight:bold; font-size:11.5px; border:1px solid #f1c40f; text-shadow:0 1px 2px #000; box-shadow:0 4px 12px rgba(231,76,60,0.35); text-transform:uppercase; letter-spacing:0.5px;" onclick="window.challengeHooktail()">
          Challenge Hooktail
      </button>
    `;
  }

  let getUpgradeCardHtml = (
    type,
    label,
    icon,
    currentText,
    bonusDesc,
    pts,
    color,
  ) => {
    let cost = window.getPrestigeUpgradeCost(type, pts);
    let canAfford = p.prestigePoints >= cost;
    let costColor = canAfford ? "#2ecc71" : "#e74c3c";
    let bgStyle = window.hexToRgba(color, 0.04);
    let fontColor =
      color === "#f1c40f" || color === "#ffb6c1" ? "#111" : "#fff";

    return `
      <div class="shop-row" style="border-color:${color}; background:${bgStyle}; flex-direction:column; align-items:stretch; text-align:left; gap:4px; padding:10px; margin-bottom:0; cursor:help;">
          <div style="display:flex; justify-content:space-between; align-items:center;">
              <strong style="color:${color}; font-size:11.5px;">${icon} ${label} <span style="color:#aaa;">(Lv. ${pts})</span></strong>
              <span style="color:${costColor}; font-weight:bold; font-size:11px;">${cost} PP</span>
          </div>
          <div style="font-size:9.5px; color:#aaa; line-height:1.35; margin-bottom:6px;">${bonusDesc} <br>Currently: <span style="color:#fff; font-weight:bold;">${currentText}</span></div>
          <button class="btn-action" style="background:${color}; color:${fontColor}; font-weight:bold; font-size:10px; padding:4px;" ${canAfford ? "" : 'disabled style="opacity:0.5; cursor:not-allowed;"'} onclick="window.buyPrestigeUpgrade('${type}')">Upgrade</button>
      </div>
    `;
  };

  el.innerHTML = `
    <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap:12px;">

        <!-- LEFT COLUMN: BOSS BATTLE CONSOLE -->
                <div class="market-card" style="border-color:#e74c3c; background:linear-gradient(135deg, #180505 0%, #050000 100%); text-align:left; padding:12px; border-radius:8px; box-shadow:0 4px 15px rgba(0,0,0,0.7); display:flex; flex-direction:column; justify-content:space-between;">
                    <div>
                        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #4a1111; padding-bottom:6px; margin-bottom:8px;">
                            <h3 style="margin:0; color:#e74c3c; font-size:13px; text-transform:uppercase; letter-spacing:1px; text-shadow:0 0 10px rgba(231,76,60,0.35); text-align:center; width:100%;">🐉 The Scarlet Summons</h3>
                        </div>

                        <!-- Menacing Hooktail Emblem -->
                <div style="margin: 10px 0; text-align:center;">
                    <svg width="68" height="68" viewBox="0 0 64 64" style="display:inline-block; filter: drop-shadow(0 0 8px rgba(231, 76, 60, 0.55));">
                        <defs>
                            <linearGradient id="hooktail_emblem_grad" x1="0" y1="0" x2="1" y2="1">
                                <stop offset="0%" stop-color="#ff7675" />
                                <stop offset="100%" stop-color="#5a0e0e" />
                            </linearGradient>
                        </defs>
                        <!-- Dragon Skull Horn Shape -->
                        <path d="M32 6 L44 26 L52 14 L42 35 L32 54 L22 35 L12 14 L20 26 Z" fill="url(#hooktail_emblem_grad)" stroke="#000000" stroke-width="2" stroke-linejoin="round" />
                        <circle cx="23" cy="28" r="3.2" fill="#fff" style="filter: drop-shadow(0 0 4px #ff0000);" />
                        <circle cx="41" cy="28" r="3.2" fill="#fff" style="filter: drop-shadow(0 0 4px #ff0000);" />
                    </svg>
                </div>

                <!-- Challenge Tier Selector Slider -->
                <div style="background:rgba(15,7,7,0.85); border:1px solid #5a0e0e; border-radius:6px; padding:10px; margin-bottom:12px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                        <div>
                            <strong style="color:#ff7675; font-size:11px; text-transform:uppercase;">Challenge Tier Level:</strong>
                            <span style="font-size:9.5px; color:#aaa; display:block;">Limits: Stage 80 to Peak ${maxS}</span>
                        </div>
                        <div style="display:flex; align-items:center; gap:4px;">
                            <button class="btn-action" style="padding:2px 8px; background:#5a0e0e;" ${p.maxStage < 80 ? "disabled" : ""} onclick="window.changePrestigeBossStage(-1)">-</button>
                            <strong style="font-size:13px; font-family:monospace; color:#fff; min-width:28px; text-align:center;">${activeStage}</strong>
                            <button class="btn-action" style="padding:2px 8px; background:#5a0e0e;" ${p.maxStage < 80 ? "disabled" : ""} onclick="window.changePrestigeBossStage(1)">+</button>
                        </div>
                    </div>
                    <!-- Slider Control -->
                    <input type="range" min="80" max="${maxS}" value="${activeStage}" step="1" ${p.maxStage < 80 ? "disabled" : ""} oninput="window.changePrestigeBossStage(parseInt(this.value, 10) - window.playerStats.selectedPrestigeStage)" style="width:100%; height:4px; accent-color:#e74c3c; cursor:pointer;" />
                </div>

                <!-- Forecasted Boss Stats -->
                <div style="background:rgba(0,0,0,0.5); border:1px solid #222; border-radius:4px; padding:8px; margin-bottom:10px; font-family:monospace; font-size:9.5px;">
                    <div style="color:#aaa; font-weight:bold; border-bottom:1px solid #333; padding-bottom:2px; margin-bottom:4px; text-transform:uppercase; letter-spacing:0.5px;">📊 Forecasted Boss Parameters:</div>
                    <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:6px; text-align:center;">
                        <div style="background:#111; padding:4px; border-radius:3px; border:1px solid #4a1111;"><span>Life</span><strong style="color:#ff7675; display:block; margin-top:2px;">${window.formatNumber(hpVal)}</strong></div>
                        <div style="background:#111; padding:4px; border-radius:3px; border:1px solid #4a1111;"><span>Attack</span><strong style="color:#ff7675; display:block; margin-top:2px;">${window.formatNumber(dmgVal)}</strong></div>
                        <div style="background:#111; padding:4px; border-radius:3px; border:1px solid #4a1111;"><span>Armor</span><strong style="color:#ff7675; display:block; margin-top:2px;">${window.formatNumber(defVal)}</strong></div>
                    </div>
                </div>

                <!-- Projected Victory Loot Payouts -->
                <div style="background:rgba(0,0,0,0.5); border:1px solid #222; border-radius:4px; padding:8px; margin-bottom:12px; font-family:monospace; font-size:9.5px;">
                    <div style="color:#aaa; font-weight:bold; border-bottom:1px solid #333; padding-bottom:2px; margin-bottom:4px; text-transform:uppercase; letter-spacing:0.5px;">💎 Projected Ascension Loot:</div>
                    <div style="display:flex; flex-direction:column; gap:2px; padding:2px;">
                        <div style="display:flex; justify-content:space-between;"><span>✨ Prestige Points (PP):</span><strong style="color:#f1c40f;">+${totalPP} PP</strong></div>
                        <div style="display:flex; justify-content:space-between;"><span>🔋 Catalyst Cores:</span><strong style="color:#2ecc71;">~ ${estCores}</strong></div>
                        <div style="display:flex; justify-content:space-between;"><span>🔮 Eridium Shards:</span><strong style="color:#8e44ad;">~ ${estShards}</strong></div>
                    </div>
                </div>
            </div>

            <div style="margin-top:auto;">
                ${challengeBtnHtml}
            </div>
        </div>

        <!-- RIGHT COLUMN: ASCENSION ALTAR CARDS -->
                <div class="market-card" style="border-color:#9b59b6; background:#111; text-align:left; padding:12px; border-radius:8px; box-shadow:0 4px 15px rgba(0,0,0,0.7); display:flex; flex-direction:column;">
                    <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #333; padding-bottom:6px; margin-bottom:10px;">
                        <h3 style="margin:0; color:#9b59b6; font-size:13px; text-transform:uppercase; letter-spacing:1px; text-shadow:0 0 10px rgba(155, 89, 182, 0.35);">✨ Altar of Ascension</h3>
                        <span style="background:rgba(155, 89, 182, 0.15); border:1px solid #9b59b6; color:#df9ffb; font-size:10px; font-weight:bold; padding:2px 10px; border-radius:10px; font-family:monospace;" id="prestige-points-qty">PP: ${p.prestigePoints.toLocaleString()}</span>
                    </div>

                    <!-- Scroll box replaced with elegant, space-filling responsive dual-column grid -->
                    <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap:6px; flex:1; align-content:start;" onscroll="window.hideTooltip()">
                        ${getUpgradeCardHtml("gold", "Midas' Legacy", "🟡", `+${(goldPts * 25).toLocaleString()}%`, "Increases campaign gold drops by +25% per level.", goldPts, "#f1c40f")}
                        ${getUpgradeCardHtml("exp", "Ancient Wisdom", "🧠", `+${(expPts * 10).toLocaleString()}%`, "Increases all experience gained by +10% per level.", expPts, "#9b59b6")}
                        ${getUpgradeCardHtml("drop", "Cosmic Fortune", "🍀", `+${(dropPts * 5).toLocaleString()}%`, "Increases global item drop rates by +5% per level.", dropPts, "#2ecc71")}
                        ${getUpgradeCardHtml("atk", "Gladiator's Might", "🔱", `x${Math.pow(1.12, atkPts).toFixed(2)}`, "Compounding multiplier to all hero Attack power (+12% per level).", atkPts, "#e74c3c")}
                        ${getUpgradeCardHtml("fort", "Colossal Fortitude", "🛡️", `x${Math.pow(1.1, fortPts).toFixed(2)} HP / x${Math.pow(1.05, fortPts).toFixed(2)} Def`, "Compounding +10% HP and +5% Defense multiplier per level.", fortPts, "#1abc9c")}
                        ${getUpgradeCardHtml("fairy", "Aetheric Beacon", "🧚", `+${(fairyPts * 5).toLocaleString()}%`, "Adds a compounding +5% multi-fairy wild spawn rate.", fairyPts, "#ffb6c1")}
                    </div>
                </div>

    </div>
  `;
};

window.buyPrestigeUpgrade = function (type) {
  let currentLevel = window.playerStats.prestigeUpgrades[type] || 0;
  let cost = window.getPrestigeUpgradeCost(type, currentLevel);

  if (window.playerStats.prestigePoints < cost) {
    if (typeof window.pushHeaderToast === "function")
      window.pushHeaderToast("❌ Insufficient Prestige Points!", "#e74c3c");
    return;
  }

  let upgradeNames = {
    gold: "Midas' Legacy",
    exp: "Ancient Wisdom",
    drop: "Cosmic Fortune",
    atk: "Gladiator's Might",
    fort: "Colossal Fortitude",
    fairy: "Aetheric Beacon",
  };
  let upgradeLabel = upgradeNames[type] || type;

  window.showCustomConfirm(
    "Ascension Upgrade",
    `Are you sure you want to purchase <strong>${upgradeLabel}</strong> level ${currentLevel + 1} for <strong>${cost} PP</strong>?`,
    "Confirm Purchase",
    "Cancel",
    "#9b59b6",
    function () {
      window.playerStats.prestigePoints -= cost;
      window.playerStats.prestigeUpgrades[type] = currentLevel + 1;

      if (typeof window.pushHeaderToast === "function")
        window.pushHeaderToast("🎉 Permanent Upgrade Acquired!", "#9b59b6");

      let p = window.resolvePlayerStats();
      window.playerStats.currentHp = Math.min(
        window.playerStats.currentHp,
        p.maxHp,
      );

      window.updateUI();
      window.renderPrestigeTab();
      window.renderInventory();
      window.saveGame();
    },
  );
};

window.challengeHooktail = function () {
  if (window.playerStats.level < 25) {
    window.pushHeaderToast("Requires Level 25!", "#e74c3c");
    return;
  }

  // Hooktail Stage requirements - check peak run stage (maxStage) instead of current stage
  let requiredStage = window.playerStats.prestigeCount === 0 ? 80 : 1;
  if (window.playerStats.maxStage < requiredStage) {
    window.pushHeaderToast(
      `Requires Campaign Peak Stage ${requiredStage} to challenge Hooktail!`,
      "#e74c3c",
    );
    return;
  }

  if (
    window.playerStats.isDungeonMode ||
    window.playerStats.isCrucibleMode ||
    window.playerStats.isPrestigeBossMode
  ) {
    window.pushHeaderToast(
      "Cannot challenge while in another activity!",
      "#e74c3c",
    );
    return;
  }

  window.showCustomConfirm(
    "Challenge Hooktail",
    "Are you prepared to face the massive dragon Hooktail? Defeating her will reset campaign peak parameters but award 3 Prestige Points!",
    "Challenge",
    "Flee",
    "#e74c3c",
    function () {
      window.saveGame();
      window.setPauseState(false);
      window.playerStats.isPrestigeBossMode = true;
      window.playerStats.prestigeApproachTimer = 180;
      window.mob = null;
      let p = window.resolvePlayerStats();
      window.playerStats.currentHp = p.maxHp;

      window.pushLog(
        `<span style='color:#e74c3c; font-weight:bold;'>[ASCENSION] Challenged Hooktail! Sprinting toward her cavern at high speed...</span>`,
      );
      window.updateUI();
      window.switchTab("gear");
    },
  );
};

window.triggerPrestigeAscension = function () {
  window.isGamePaused = true;
  window.playerStats.historicalPeakLvl = Math.max(
    window.playerStats.historicalPeakLvl || 1,
    window.playerStats.level,
  );

  let activeStage = window.playerStats.selectedPrestigeStage || 80;
  let rewardMultiplier = activeStage / 80;

  // Rebalance: Award Catalyst Cores, Eridium Shards, and crafting materials instead of gear items (scaling proportionally to fight tier)
  let awardedCores = Math.round(window.randInt(3, 5) * rewardMultiplier);
  let awardedShards = Math.round(window.randInt(8, 15) * rewardMultiplier);
  let awardedEpic = Math.round(window.randInt(10, 15) * rewardMultiplier);
  let awardedLeg = Math.round(window.randInt(5, 10) * rewardMultiplier);
  let awardedMythic = Math.round(window.randInt(2, 5) * rewardMultiplier);

  if (typeof window.addEtcDrop === "function") {
    window.addEtcDrop("Catalyst Core", awardedCores);
    window.addEtcDrop("Eridium Shard", awardedShards);
    window.addEtcDrop("Epic Scrap", awardedEpic);
    window.addEtcDrop("Legendary Scrap", awardedLeg);
    window.addEtcDrop("Mythic Scrap", awardedMythic);
  }

  // Calculate Points: Base, Prestige Level Bonus, and Uncapped Deep Push Bonus! (based on selected fight challenge stage)
  let basePoints = 3;
  let bonusPoints = Math.floor(window.playerStats.prestigeCount / 4);
  let pushBonus = Math.max(0, Math.floor((activeStage - 80) / 10));
  let totalAwarded = Math.min(10, basePoints + bonusPoints) + pushBonus;

  window.playerStats.prestigePoints += totalAwarded;
  window.playerStats.prestigeCount++;

  let nowTime = Date.now();
  if (
    window.playerStats.lastAscensionTime &&
    nowTime - window.playerStats.lastAscensionTime <= 900000
  )
    window.playerStats.hasTriggeredSpeedrun = true;
  window.playerStats.lastAscensionTime = nowTime;
  window.playerStats.lifetimePeakStage = Math.max(
    window.playerStats.lifetimePeakStage || 1,
    window.playerStats.maxStage || 1,
  );

  for (let slot in window.equippedSlots) {
    if (window.equippedSlots[slot]) {
      let item = window.equippedSlots[slot];
      delete item.isEquippedSlot;
      if (item.type === "artifact") window.inventory.ARTIFACT.push(item);
      else window.inventory.EQUIP.push(item);
      window.equippedSlots[slot] = null;
    }
  }

  window.playerStats.level = 1;
  window.playerStats.xp = 0;
  window.playerStats.xpReq = 100;
  window.playerStats.stage = 1;
  window.playerStats.maxStage = 1;
  window.playerStats.crucibleWave = 1;
  window.playerStats.crucibleStartWave = 1;
  window.playerStats.isPrestigeBossMode = false;
  window.playerStats.prestigeApproachTimer = 0;
  window.mob = null;
  window.hero.x = 40;

  let p = window.resolvePlayerStats();
  window.playerStats.currentHp = p.maxHp;

  let modal = document.createElement("div");
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
                                                                                              <div style="font-size:9.5px; color:#aaa; font-family:monospace; margin-bottom:12px; line-height:1.3; text-align:left; background:rgba(0,0,0,0.35); padding:6px; border:1px dashed #333;">
                                                                                                  • Base & Rank Award: <strong style="color:#fff;">+${Math.min(10, basePoints + bonusPoints)} PP</strong><br>
                                                                                                  • Deep Push Bonus (Stage ${currentStage}): <strong style="color:#2ecc71;">+${pushBonus} PP</strong> (1 per 10 stages over 80)
                                                                                              </div>
                                                                                              <div style="font-size:11px; color:#2ecc71; font-weight:bold; margin-bottom:4px; text-align:left; padding-left:15px;">🔋 Catalyst Cores: +${awardedCores}</div>
                                                                                              <div style="font-size:11px; color:#8e44ad; font-weight:bold; margin-bottom:4px; text-align:left; padding-left:15px;">🔮 Eridium Shards: +${awardedShards}</div>
                                                                                              <div style="font-size:11px; color:#e67e22; font-weight:bold; margin-bottom:4px; text-align:left; padding-left:15px;">🟧 Epic Scraps: +${awardedEpic}</div>
                                                                                              <div style="font-size:11px; color:#f1c40f; font-weight:bold; margin-bottom:4px; text-align:left; padding-left:15px;">🟨 Legendary Scraps: +${awardedLeg}</div>
                                                                                              <div style="font-size:11px; color:#e74c3c; font-weight:bold; margin-bottom:8px; text-align:left; padding-left:15px;">🟥 Mythic Scraps: +${awardedMythic}</div>
                                                                                              <div style="font-size:11px; color:#9b59b6; font-weight:bold; border-top: 1px solid #333; padding-top:6px; margin-top:6px;">Total Ascensions: ${window.playerStats.prestigeCount}</div>
                                                                                          </div>
                                                                                          <p style="font-size:11px; color:#7f8c8d; line-height:1.4; margin-bottom:20px;">
                                                                                              Your raw levels and campaign stage are reset. However, spent Attribute Matrix points, materials, and achievements are **completely preserved**!
                                                                                          </p>
                                                                                          <button id="btn-prestige-ascend-confirm" style="background:linear-gradient(135deg, #e74c3c, #c0392b); color:white; border:1px solid #f1c40f; font-weight:bold; font-size:13px; text-transform:uppercase; letter-spacing:1px; padding:12px 24px; border-radius:4px; cursor:pointer; width:100%; box-shadow:0 4px 10px rgba(0,0,0,0.4);">Arise as an Ascended Hero</button>
                                                                                      </div>
                                                                                  `;
  document.body.appendChild(modal);

  document.getElementById("btn-prestige-ascend-confirm").onclick = function () {
    modal.remove();
    window.isGamePaused = false;
    window.checkAchievements();
    window.updateUI();
    window.renderPrestigeTab();
    window.renderInventory();
    window.saveGame();
    window.pushLog(
      `<span style='color:#e74c3c; font-weight:bold;'>[ASCENSION] Your legacy begins anew! Received upgrade materials and spent Attribute Matrix points are completely preserved. Sacks have expanded to hold your rewards.</span>`,
    );
  };
};

window.showMarketTooltip = function (e, index) {
  let item = window.playerStats.shopItems[index];
  if (!item || item.purchased) return;
  let tt = document.getElementById("game-tooltip");
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

window.showMysticalShopTooltip = function (e, index) {
  e.stopPropagation();
  let tt = document.getElementById("etc-tooltip");
  let item = window.MYSTICAL_STOCK[index];
  if (!item) return;

  let color = item.color || "#9b59b6";
  let ownedAmount = 0;
  if (
    item.name === "Gacha Key" ||
    item.name === "Astral Essence" ||
    item.name === "Catalyst Core"
  )
    ownedAmount = window.inventory.ETC[item.name] || 0;
  else ownedAmount = window.inventory.USE[item.name] || 0;

  let actualCost = item.cost;
  let currencyName = item.currency;
  let playerBalance = 0;

  if (item.currency === "Luminous Soul") {
    playerBalance = window.inventory.ETC["Luminous Soul"] || 0;
    currencyName = "Luminous Souls";
  } else if (item.currency === "Astral Shards") {
    playerBalance = window.playerStats.astralShards || 0;
    currencyName = "Astral Shards";
  } else {
    actualCost = Math.ceil(
      item.cost * Math.pow(1.08, window.playerStats.stage),
    );
    playerBalance = window.playerStats.coins || 0;
    currencyName = "Gold";
  }

  let canAfford = playerBalance >= actualCost;
  let costTextColor = canAfford ? "#2ecc71" : "#e74c3c";

  let iconHtml =
    item.name === "Gacha Key" ||
    item.name === "Astral Essence" ||
    item.name === "Catalyst Core"
      ? getEtcIconHtml(item.name)
      : getUseIconHtml(item.name);
  iconHtml = iconHtml.replace("margin-right: 12px;", "margin-right: 8px;");

  tt.innerHTML = `<div style="padding: 10px; width: 230px; box-sizing: border-box;">
                                                                                          <div class="tt-title" style="color:${color}; font-weight:bold; display:flex; align-items:center; gap:6px;">${iconHtml} <span>${item.name}</span></div>
                                                                                          <div style="font-size:11px; color:#aaa; margin-bottom:8px; line-height:1.4; white-space:normal;">${item.desc}</div>
                                                                                          <div style="font-size:11px; margin-bottom:6px; border-top:1px dashed #444; padding-top:6px;">
                                                                                              • <span style="color:#bdc3c7;">Currently Owned:</span> <strong style="color:${color};">${ownedAmount.toLocaleString()}</strong>
                                                                                          </div>
                                                                                          <div style="font-size:11px; margin-bottom:4px;">
                                                                                            • <span style="color:#bdc3c7;">Exchange Rate:</span> <strong style="color:${costTextColor};">${window.formatNumber(actualCost)} / ${window.formatNumber(playerBalance)} ${currencyName}</strong>
                                                                                             </div>
                                                                                              <div style="font-size:10px; color:${canAfford ? "#2ecc71" : "#e74c3c"}; font-weight:bold; margin-top:4px;">
                                                                                              ${canAfford ? "✓ Ready to Transmute" : "✗ Insufficient Materials"}
                                                                                          </div>
                                                                                      </div>`;

  tt.style.borderColor = color;
  tt.style.display = "block";
  window.positionTooltip(e, tt);
};

window.showTransmuteTooltip = function (e, index) {
  e.stopPropagation();
  let recipe = window.POTION_TRANSMUTATIONS[index];
  if (!recipe) return;

  let ownedResult = window.inventory.USE[recipe.result] || 0;
  let ownedReq = window.inventory.USE[recipe.req] || 0;
  let canAfford = ownedReq >= recipe.amount;
  let reqColor = canAfford ? "#2ecc71" : "#e74c3c";

  let iconHtml = getUseIconHtml(recipe.result);
  iconHtml = iconHtml.replace("margin-right: 12px;", "margin-right: 8px;");

  let tt = document.getElementById("game-tooltip");
  tt.innerHTML = `<div style="padding: 10px; width: 230px; box-sizing: border-box;">
                                                                                          <div class="tt-title" style="color:${recipe.color}; display:flex; align-items:center; gap:6px;">${iconHtml} <span>Transmute</span></div>
                                                                                          <div class="tt-subtitle">${recipe.result}</div>
                                                                                          <div style="color:#ddd; font-size:11px; margin-bottom:6px; white-space:normal; line-height:1.3;">${recipe.desc}</div>
                                                                                          <div style="margin-top:8px; border-top: 1px dashed #444; padding-top:6px; font-family:monospace; font-size:10px;">
                                                                                              <div class="tt-stat-line" style="color:#aaa;">Result Owned: <strong style="color:#fff;">${ownedResult}</strong></div>
                                                                                              <div class="tt-stat-line" style="color:#aaa;">Required Ingredients: <strong style="color:${reqColor};">${ownedReq} / ${recipe.amount} ${recipe.req}</strong></div>
                                                                                          </div>
                                                                                      </div>`;
  tt.style.borderColor = recipe.color;
  tt.style.display = "block";
  window.positionTooltip(e, tt);
};

window.showGoldUpgradeTooltip = function (e, upId) {
  e.stopPropagation();
  let p = window.playerStats;
  let up;
  if (upId === "vending") {
    up = {
      name: "🎰 Gacha Calibration",
      level: p.vendingQLevel || 0,
      cost: Math.floor(15000 * Math.pow(1.18, p.vendingQLevel || 0)),
      color: "#f1c40f",
    };
  } else if (upId === "shop") {
    up = {
      name: "🛒 Merchant Investment",
      level: p.shopQLevel || 0,
      cost: Math.floor(30000 * Math.pow(1.22, p.shopQLevel || 0)),
      color: "#3498db",
    };
  } else if (upId === "global") {
    up = {
      name: "🍀 Aura of Fortune",
      level: p.globalQLevel || 0,
      cost: Math.floor(100000 * Math.pow(1.28, p.globalQLevel || 0)),
      color: "#2ecc71",
    };
  }
  if (!up) return;

  let goldStr = window.formatNumber(p.coins);
  let costStr = window.formatNumber(up.cost);
  let goldColor = p.coins >= up.cost ? "#2ecc71" : "#e74c3c";

  let tt = document.getElementById("game-tooltip");
  tt.innerHTML = `<div style="padding: 10px; width: 230px; box-sizing: border-box;">
                                               <div class="tt-title" style="color:${up.color};">${up.name}</div>
                                               <div class="tt-subtitle">Upgrade Level: ${up.level}</div>
                                               <div style="margin-top:8px; border-top: 1px dashed #444; padding-top:6px; font-family:monospace; font-size:10px;">
                                                   <div class="tt-stat-line" style="color:#aaa;">Your Gold: <strong style="color:${goldColor};">${goldStr}</strong></div>
                                                   <div class="tt-stat-line" style="color:#aaa;">Upgrade Cost: <strong style="color:#f1c40f;">${costStr}</strong></div>
                                               </div>
                                           </div>`;
  tt.style.borderColor = up.color;
  tt.style.display = "block";
  window.positionTooltip(e, tt);
};

window.showAltarTooltip = function (e) {
  e.stopPropagation();
  let cores = window.inventory.ETC["Ancient Core"] || 0;
  let level = window.playerStats.level || 1;
  let tt = document.getElementById("game-tooltip");
  tt.innerHTML = `<div style="padding: 10px; width: 240px; box-sizing: border-box;">
                                                       <div class="tt-title" style="color:#9b59b6;">🔮 Ancient Altar Summoning</div>
                                                       <div class="tt-subtitle">Reality Rift Activation requirements</div>
                                                       <div class="tt-stat-line" style="color:#bdc3c7;">• Required Cores: <span style="color:#f1c40f; font-weight:bold;">1 Core</span></div>
                                                       <div class="tt-stat-line" style="color:#bdc3c7;">• Required Level: <span style="color:#2ecc71; font-weight:bold;">Lv 30+</span></div>
                                                       <div style="margin-top:8px; border-top: 1px dashed #444; padding-top:6px; font-family:monospace; font-size:10px;">
                                                           <div class="tt-stat-line" style="color:#fff;">Your Cores: <strong style="color:${cores >= 1 ? "#2ecc71" : "#e74c3c"};">${cores} / 1</strong></div>
                                                           <div class="tt-stat-line" style="color:#fff;">Your Level: <strong style="color:${level >= 30 ? "#2ecc71" : "#e74c3c"};">Lv ${level} / 30</strong></div>
                                                       </div>
                                                   </div>`;
  tt.style.borderColor = "#9b59b6";
  tt.style.display = "block";
  window.positionTooltip(e, tt);
};

window.showGachaTooltip = function (e) {
  e.stopPropagation();
  let p = window.resolvePlayerStats();
  let qly = 1.0 + (window.playerStats.vendingQLevel || 0) * 0.025;
  let mythic = 1.0 * qly;
  let leg = 5.0 * qly;
  let epic = 15.0 * qly;
  let magic = 25.0 * qly;
  let rare = Math.max(0, 100 - (mythic + leg + epic + magic));
  let keysHeld = window.inventory.ETC["Gacha Key"] || 0;

  let tt = document.getElementById("game-tooltip");
  tt.innerHTML = `<div style="padding: 10px; width: 250px; box-sizing: border-box;">
                                               <div class="tt-title" style="color:#f1c40f;">🎰 Vending Machine Rates</div>
                                               <div class="tt-subtitle">Gacha Rarity Distribution</div>
                                               <div class="tt-stat-line" style="color:#3498db;">• 1★ Rare: ${rare.toFixed(2)}%</div>
                                               <div class="tt-stat-line" style="color:#9b59b6;">• 2★ Magic: ${magic.toFixed(2)}%</div>
                                               <div class="tt-stat-line" style="color:#e67e22;">• 3★ Epic: ${epic.toFixed(2)}%</div>
                                               <div class="tt-stat-line" style="color:#f1c40f;">• 4★ Legendary: ${leg.toFixed(2)}%</div>
                                               <div class="tt-stat-line" style="color:#e74c3c;">• 5★ Mythic: ${mythic.toFixed(2)}%</div>
                                               <div class="tt-stat-line" style="color:#1abc9c; margin-top:4px;">• Bonus: 1% flat chance for Unique Artifact!</div>
                                               <div class="tt-subtitle" style="margin-top:6px; border-top:1px solid #333; padding-top:4px;">Guaranteed 1★ to 5★ gear. Influenced by Drop Quality.</div>
                                               <div style="margin-top:8px; border-top: 1px dashed #444; padding-top:6px; font-family:monospace; font-size:10px;">
                                                   <div class="tt-stat-line" style="color:#fff;">Your Keys: <strong style="color:${keysHeld >= 1 ? "#2ecc71" : "#e74c3c"};">${keysHeld.toLocaleString()} / 1</strong></div>
                                               </div>
                                           </div>`;
  tt.style.borderColor = "#f1c40f";
  tt.style.display = "block";
  window.positionTooltip(e, tt);
};

window.showDummyArtifact = function (e, traitId) {
  e.stopPropagation();
  document
    .querySelectorAll(".bag-item")
    .forEach((el) => el.classList.remove("active-tooltip"));
  let artDef = window.ARTIFACT_POOL.find((a) => a.trait === traitId);
  let dummy = {
    id: "dummy",
    name: artDef.name + " (Lv. 1)",
    type: "artifact",
    statsRolled: "UNIQUE",
    temperLevel: 0,
    stageLevel: 1,
    atk: 0,
    maxHp: 0,
    def: 0,
    moveSpeed: 0,
    critChance: 0,
    critDamage: 0,
    block: 0,
    parry: 0,
    dropRate: artDef.dropRate,
    quality: artDef.quality,
    goldMulti: artDef.goldMulti,
    activeAttackSpeed: 0,
    idleAttackSpeed: 0,
    trait: artDef.trait,
    desc: artDef.desc,
    breakdown: artDef.breakdown,
    str: 0,
    dex: 0,
    int: 0,
  };
  let tt = document.getElementById("game-tooltip");
  tt.innerHTML = `<div class="tooltip-flex-container"><div class="tooltip-card">${window.generateItemCardHtml(dummy, null, false)}</div></div>`;
  tt.style.borderColor = window.getTierColor("UNIQUE");
  tt.style.display = "block";
  window.positionTooltip(e, tt);
};

window.refreshActiveStatTooltip = function () {
  if (!window.activeStatTooltip) return;
  let mockEvent = {
    clientX: window.activeStatTooltip.clientX,
    clientY: window.activeStatTooltip.clientY,
    target: window.activeStatTooltip.target,
    currentTarget: window.activeStatTooltip.target,
    stopPropagation: function () {},
  };
  let cached = window.activeStatTooltip;
  window.activeStatTooltip = null;
  if (cached.type === "breakdown") {
    window.showStatBreakdown(mockEvent, cached.key, cached.isPct);
  } else if (cached.type === "hover") {
    window.showStatHoverTooltip(mockEvent, cached.key);
  }
};

window.showStatHoverTooltip = function (e, key) {
  e.stopPropagation();
  let tt = document.getElementById("stat-tooltip");
  if (!tt) return;

  let clientX =
    e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
  let clientY =
    e.clientY || (e.touches && e.touches[0] ? e.touches[0].clientY : 0);
  window.activeStatTooltip = {
    type: "hover",
    key: key,
    clientX: clientX,
    clientY: clientY,
    target: e.currentTarget || e.target,
  };

  let html = "";
  let p = window.resolvePlayerStats();
  if (key === "ias") {
    html = `<div style="padding: 10px; width: 220px; box-sizing: border-box;"><div class="tt-title" style="color:#3498db;">⏱️ Idle Attack Speed</div><div style="color:#aaa; font-size:11px;">The number of engine frames between automatic attacks (60 frames = 1 second).<br><br><b>Lower is faster!</b><br>Currently attacking automatically every ${(p.idleAttackSpeed / 60).toFixed(2)}s.</div></div>`;
    tt.style.borderColor = "#3498db";
  } else if (key === "aas") {
    html = `<div style="padding: 10px; width: 220px; box-sizing: border-box;"><div class="tt-title" style="color:#e74c3c;">⚡ Active Attack Speed</div><div style="color:#aaa; font-size:11px;">The cooldown limit in frames between manual clicks or spacebar taps.<br><br><b>Lower is faster!</b><br>Currently capped at ${(60 / p.activeAttackSpeed).toFixed(1)} attacks per second.</div></div>`;
    tt.style.borderColor = "#e74c3c";
  } else if (key === "drp") {
    let eff = window.state.efficiency;
    html = `<div style="padding: 10px; width: 220px; box-sizing: border-box;"><div class="tt-title" style="color:#2ecc71;">🍀 Drop Rate Modifier</div><div style="color:#aaa; font-size:11px;">Current Multiplier: x${(p.drop * eff).toFixed(2)} ${eff > 1.0 ? "(Manual Play Bonus Active)" : ""}<br><br><b>Exact Chances:</b><br>• Standard Mob Drop: ${(4.5 * p.drop * eff).toFixed(2)}%<br>• Rare Mob Drop: ${(15.0 * p.drop * eff).toFixed(2)}%<br>• Boss Drop: ${(25.0 * p.drop * eff).toFixed(2)}%<br>• Dungeon Mob: ${(10.0 * p.drop * eff).toFixed(2)}%</div></div>`;
    tt.style.borderColor = "#2ecc71";
  } else if (key === "qly") {
    html = `<div style="padding: 10px; width: 220px; box-sizing: border-box;"><div class="tt-title" style="color:#9b59b6;">💎 Drop Quality Modifier</div><div style="color:#aaa; font-size:11px;">Current Multiplier: x${p.qly.toFixed(2)}<br><br>Increases the probability that an item drop will roll with more bonus modifier lines (higher star rating).</div></div>`;
    tt.style.borderColor = "#9b59b6";
  } else if (key === "idps") {
    let effMultiplier = 1 + p.critChance * (p.critDamage - 1);
    let idps = p.atk * effMultiplier * (60 / p.idleAttackSpeed);
    html = `<div style="padding: 10px; width: 220px; box-sizing: border-box;"><div class="tt-title" style="color:#e67e22;">🔄 Idle DPS</div><div style="color:#aaa; font-size:11px;">Current Idle Damage/Sec: ${idps.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}<br><br>Represents your average damage output per second when idle (incorporates Attack, Attack Speed, Crit Chance, and Crit Multipliers).</div></div>`;
    tt.style.borderColor = "#e67e22";
  } else if (key === "xpr") {
    html = `<div style="padding: 10px; width: 220px; box-sizing: border-box;"><div class="tt-title" style="color:#a855f7;">🧠 XP Rate Multiplier</div><div style="color:#aaa; font-size:11px;">Current Multiplier: x${p.xpRate.toFixed(2)}<br><br>Multiplies all acquired experience from routing, bosses, and dungeons.<br><br><b>Boosted by:</b><br>• Prestige upgrades (+10% per level)<br>• Active XP potions / elixirs<br>• Chronicle of Past Lives Unique Tome<br>• Unlocked Achievements</div></div>`;
    tt.style.borderColor = "#a855f7";
  } else if (key === "bar") {
    html = `<div style="padding: 10px; width: 220px; box-sizing: border-box;"><div class="tt-title" style="color:#9b59b6;">🔮 Arcane Barrier</div><div style="color:#aaa; font-size:11px;">Current Absorption: ${Math.floor(p.arcaneBarrier * 100)}%<br><br><b>Passive (Requires Tome):</b><br>Absorbs a percentage of all incoming damage before defense calculations.<br><br>Base 20%, scaling up to 35% based on your Intelligence (INT) stat. Currently absorbing ${Math.floor(p.arcaneBarrier * 100)}% of incoming damage.</div></div>`;
    tt.style.borderColor = "#9b59b6";
  }

  tt.innerHTML = html;
  tt.style.display = "block";
  window.positionTooltip(e, tt);
};

// --- PAPERDOLL & BAGS GRID RENDERERS ---

window.renderPaperDoll = function () {
  const slots = [
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
  slots.forEach((slot) => {
    let el = document.getElementById(`slot-${slot}`);
    if (!el) return;
    let item = window.equippedSlots[slot];

    if (
      (slot === "chest" || slot === "leggings") &&
      window.equippedSlots.overall
    ) {
      el.className = "slots-card locked";
      el.innerHTML = `⚙️ LOCKED BY OVERALL`;
      el.style.background = "";
      el.style.borderColor = "";
      el.style.boxShadow = "";
      return;
    }
    if (
      slot === "overall" &&
      (window.equippedSlots.chest || window.equippedSlots.leggings)
    ) {
      el.className = "slots-card locked";
      el.innerHTML = `⚙️ LOCKED BY PIECE GEAR`;
      el.style.background = "";
      el.style.borderColor = "";
      el.style.boxShadow = "";
      return;
    }

    if (item) {
      let isArt = slot.startsWith("art");
      el.className = isArt
        ? "slots-card artifact-slot equipped"
        : "slots-card equipped";
      let color = window.getTierColor(item.statsRolled);
      el.style.borderColor = color;

      let uniqueStyle = window.getUniqueItemStyle(item);
      if (uniqueStyle) {
        el.style.background = uniqueStyle.bg;
        el.style.borderColor = uniqueStyle.border;
        el.style.boxShadow = `inset 0 0 8px ${uniqueStyle.shadow}, 0 0 10px ${uniqueStyle.glow}`;
      } else {
        el.style.background = "";
        el.style.boxShadow = "";
      }

      let tierLabel =
        item.statsRolled === "UNIQUE"
          ? "UNIQUE"
          : `${item.statsRolled}★ ${window.getTierName(item.statsRolled)}`;
      let temperTag =
        item.temperLevel > 0
          ? ` <span style="color:#2ecc71;">[+${item.temperLevel}]</span>`
          : "";
      let lockTag = item.locked ? " 🔒" : "";
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

      let iconBox = `<div style="text-align:center; margin-bottom:4px;">${window.getEquipIconHtml(item, 32)}</div>`;
      if (isArt) {
        el.innerHTML = `${iconBox}<strong style="font-size:10px; color:#1abc9c;">${item.name}${lockTag}</strong><br><span style="font-size:8px;color:#aaa;line-height:1;">${item.desc}</span><button class="btn-action un" style="margin-top:2px;padding:1px 3px;" onclick="window.unequipItem('${slot}')">Remove</button>`;
      } else {
        let s = [];
        if (item.atk > 0) s.push(`⚔️${item.atk}`);
        if (item.maxHp > 0) s.push(`❤️${item.maxHp}`);
        if (item.def > 0) s.push(`🛡️${item.def}`);
        if (item.moveSpeed > 0) s.push(`👟${item.moveSpeed}`);
        if (item.critChance > 0)
          s.push(`✨${Math.floor(item.critChance * 100)}%`);
        if (item.critDamage > 0)
          s.push(`💥${Math.floor(item.critDamage * 100)}%`);
        if (item.block > 0) s.push(`🛡️${Math.floor(item.block * 100)}%`);
        if (item.parry > 0) s.push(`⚡${Math.floor(item.parry * 100)}%`);
        if (item.str > 0) s.push(`💪S:${item.str}`);
        if (item.dex > 0) s.push(`🎯D:${item.dex}`);
        if (item.int > 0) s.push(`🧠I:${item.int}`);

        let setLabelHtml = "";
        let setName = window.getItemSetName(item);
        if (setName) {
          let matchingCount = 0;
          const setSlots = [
            "weapon",
            "subweapon",
            "helmet",
            "chest",
            "leggings",
            "overall",
            "boots",
          ];
          setSlots.forEach((sKey) => {
            let eqItem = window.equippedSlots[sKey];
            if (eqItem) {
              let eqSetName = window.getItemSetName(eqItem);
              if (eqSetName === setName)
                matchingCount += sKey === "overall" ? 2 : 1;
            }
          });
          if (matchingCount >= 2) {
            let displayCount = Math.min(3, matchingCount);
            setLabelHtml = `<div style="font-size:8px; color:#2ecc71; font-weight:bold; margin-top:2px; text-transform:uppercase; letter-spacing:0.5px;">✨ ${setName} Set (${displayCount}/3)</div>`;
          }
        }
        el.innerHTML = `${iconBox}<strong style="font-size:10px;">${item.name}${temperTag}${lockTag}</strong><div style="font-size:8px; color:${color}; font-weight:bold; margin:2px 0;">${tierLabel}</div>${setLabelHtml}<div style="font-size:9px;color:#bbb; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${s.join(" ")}">${s.join(" ")}</div><button class="btn-action un" style="margin-top:2px;padding:1px 3px;" onclick="window.unequipItem('${slot}')">Remove</button>`;
      }
    } else {
      el.className = "slots-card";
      let displaySlotName = slot.toUpperCase();
      if (slot === "art1") displaySlotName = "ARTIFACT 1";
      else if (slot === "art2") displaySlotName = "ARTIFACT 2";
      else if (slot === "art3") displaySlotName = "ARTIFACT 3";
      el.innerHTML = `<i>[Empty ${displaySlotName}]</i>`;
      el.style.background = "";
      el.style.borderColor = "";
      el.style.boxShadow = "";
    }
  });
};

window.renderInventory = function () {
  let maxBag = window.getMaxBagSlots();

  // 1. Equip Sack
  let eqBox = document.getElementById("bag-equip");
  if (eqBox) {
    if (window.inventory.EQUIP.length === 0) {
      eqBox.innerHTML =
        "<div style='color:#666;text-align:center;padding-top:40px;'>No equipment in sack.</div>";
    } else {
      eqBox.innerHTML = window.inventory.EQUIP.map((item) => {
        let nameColor = window.getTierColor(item.statsRolled);
        let tierStr =
          item.statsRolled === "UNIQUE"
            ? "UNIQUE"
            : `${item.statsRolled}★ ${window.getTierName(item.statsRolled)}`;
        let temperTag =
          item.temperLevel > 0
            ? ` <span style="color:#2ecc71;">[+${item.temperLevel}]</span>`
            : "";
        let lockTag = item.locked ? " 🔒" : "";
        let lockBg = item.locked ? "#e74c3c" : "#7f8c8d";
        let lockIcon = item.locked ? "🔒" : "🔓";
        let typeText = item.type.toUpperCase();
        if (item.type === "subweapon" && item.subType) {
          typeText = `${item.type.toUpperCase()} (${item.subType.toUpperCase()})`;
        }
        let comparisonBadge = window.getComparisonDeltaBadge(item);
        let reqLvl = 1;
        if ((item.stageLevel || 1) >= 3) {
          reqLvl = Math.max(
            1,
            ((item.stageLevel || 1) - 2) * 5 -
              (window.playerStats.prestigeCount || 0) * 5,
          );
        }
        let lockWarning = "";
        let disabledAttr = "";
        if (window.playerStats.level < reqLvl) {
          lockWarning = ` <span style="color:#e74c3c; font-weight:bold; font-size:10px;">[Req. Lv ${reqLvl}]</span>`;
          disabledAttr = "disabled style='opacity:0.5; cursor:not-allowed;'";
        }
        let details = `<span style="font-size:10px;color:#aaa;">Slot: ${typeText} | <span style="color:${nameColor};font-weight:bold;">${tierStr}</span></span>${lockWarning}`;
        let uniqueStyle = window.getUniqueItemStyle(item);
        let itemStyleStr = uniqueStyle
          ? `background: ${uniqueStyle.bg}; border: 1.5px solid ${uniqueStyle.border}; box-shadow: inset 0 0 6px ${uniqueStyle.shadow}, 0 0 8px ${uniqueStyle.glow};`
          : `border-left: 4.5px solid ${nameColor} !important; background: rgba(15, 17, 26, 0.65);`;

        let iconBox = `<div style="margin-right:8px; display:inline-flex; align-items:center; flex-shrink:0;">${window.getEquipIconHtml(item, 28)}</div>`;

        return `<div class="bag-item" style="display:flex; align-items:center; ${itemStyleStr}">
                                      <div style="flex:1; min-width:0; cursor:help; text-align:left; display:flex; align-items:center;" onmouseenter="window.showInventoryTooltip(event, ${item.id})" ontouchstart="window.showInventoryTooltip(event, ${item.id})" onmouseleave="window.hideTooltip()">
                                          ${iconBox}
                                          <div style="flex:1; min-width:0;">
                                              <div style="display:flex; align-items:center; gap:4px; margin-bottom:1px; flex-wrap:wrap;">
                                                  <strong style="color:${nameColor}; font-size:11.5px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; max-width:180px;">${item.name}${temperTag}${lockTag}</strong>
                                                  ${comparisonBadge}
                                              </div>
                                              ${details}
                                          </div>
                                      </div>
                      <div class="bag-item-actions" style="position:relative; z-index:10; display:inline-flex; gap:3px; margin-left: 8px; flex-shrink:0;">
                          <button class="btn-action" ${disabledAttr} style="padding:4px 8px; font-size:10px;" onclick="window.equipItem(${item.id})">Equip</button>
                          <button class="btn-action" style="background:${lockBg}; padding:4px 6px; font-size:10px;" onclick="window.toggleLock(${item.id})">${lockIcon}</button>
                          <button class="btn-action un" style="padding:4px 8px; font-size:10px;" onclick="window.salvageItem(${item.id})">Salvage</button>
                      </div>
                  </div>`;
      }).join("");
    }
  }

  // 2. Artifact Sack
  let artBox = document.getElementById("bag-art");
  if (artBox) {
    if (window.inventory.ARTIFACT.length === 0) {
      artBox.innerHTML =
        "<div style='color:#666;text-align:center;padding-top:40px;'>No artifacts in sack.</div>";
    } else {
      artBox.innerHTML = window.inventory.ARTIFACT.map((item) => {
        let nameColor = window.getTierColor(item.statsRolled);
        let lockTag = item.locked ? " 🔒" : "";
        let lockBg = item.locked ? "#e74c3c" : "#7f8c8d";
        let lockIcon = item.locked ? "🔒" : "🔓";
        let reqLvl = 1;
        if ((item.stageLevel || 1) >= 3) {
          reqLvl = Math.max(
            1,
            ((item.stageLevel || 1) - 2) * 5 -
              (window.playerStats.prestigeCount || 0) * 5,
          );
        }
        let lockWarning = "";
        let disabledAttr = "";
        if (window.playerStats.level < reqLvl) {
          lockWarning = ` <span style="color:#e74c3c; font-weight:bold; font-size:10px;">[Req. Lv ${reqLvl}]</span>`;
          disabledAttr = "disabled style='opacity:0.5; cursor:not-allowed;'";
        }
        let details = `<span style="font-size:10px;color:#d2b4de;font-weight:bold;">Trait: ${item.desc}</span>${lockWarning}`;
        let iconBox = `<div style="margin-right:8px; display:inline-flex; align-items:center;">${window.getArtifactIconHtml(item.trait, 28)}</div>`;

        return `<div class="bag-item">
                                <div style="flex:1; cursor:help; text-align:left; display:flex; align-items:center;" onmouseenter="window.showInventoryTooltip(event, ${item.id})" ontouchstart="window.showInventoryTooltip(event, ${item.id})" onmouseleave="window.hideTooltip()">
                                    ${iconBox}
                                    <div style="flex:1;">
                                        <strong style="color:${nameColor};">${item.name}${lockTag}</strong><br>${details}
                                    </div>
                                </div>
                    <div style="position:relative; z-index:10; white-space:nowrap; margin-left: 10px;">
                        <button class="btn-action" ${disabledAttr} onclick="window.equipItem(${item.id})">Equip</button>
                        <button class="btn-action" style="background:${lockBg}; margin-left:2px;" onclick="window.toggleLock(${item.id})">${lockIcon}</button>
                        <button class="btn-action un" style="margin-left:12px;" onclick="window.salvageItem(${item.id})">Salvage</button>
                    </div>
                </div>`;
      }).join("");
    }
  }

  // 3. Materials Sacks
  const getEtcIconHtml = window.getEtcIconHtml;
  const getUseIconHtml = window.getUseIconHtml;

  const ETC_SORT_ORDER = [
    "Ancient Core",
    "Gacha Key",
    "Eridium Shard",
    "Astral Essence",
    "Catalyst Core",
    "Overlord's Sigil",
    "Luminous Soul",
    "Monster Soul",
    "Mythic Scrap",
    "Legendary Scrap",
    "Epic Scrap",
    "Magic Scrap",
    "Rare Scrap",
  ];

  const USE_SORT_ORDER = [
    "SP Reset Scroll",
    "PP Reset Scroll",
    "Supernal Attack Elixir",
    "Greater Attack Elixir",
    "Attack Elixir",
    "Supernal Vitality Elixir",
    "Greater Vitality Elixir",
    "Vitality Elixir",
    "Supernal Armored Elixir",
    "Greater Armored Elixir",
    "Armored Elixir",
    "Supernal Haste Elixir",
    "Greater Haste Elixir",
    "Haste Elixir",
  ];

  let etcBox = document.getElementById("bag-etc");
  let etcKeys = Object.keys(window.inventory.ETC).filter(
    (k) => window.inventory.ETC[k] > 0,
  );
  if (etcKeys.length === 0) {
    etcBox.innerHTML =
      "<div style='color:#666;text-align:center;padding-top:40px;'>No materials collected.</div>";
  } else {
    // Apply priority structured ordering to materials
    etcKeys.sort((a, b) => {
      let idxA = ETC_SORT_ORDER.indexOf(a);
      let idxB = ETC_SORT_ORDER.indexOf(b);
      if (idxA === -1) idxA = 999;
      if (idxB === -1) idxB = 999;
      return idxA - idxB;
    });

    etcBox.innerHTML =
      `<div class="material-grid">` +
      etcKeys
        .map((key) => {
          let escapedKey = key.replace(/'/g, "\\'");
          return `
                <div class="material-badge" onmouseenter="window.showEtcTooltip(event, '${escapedKey}')" ontouchstart="window.showEtcTooltip(event, '${escapedKey}')" onmouseleave="window.hideTooltip()">
                    ${getEtcIconHtml(key)}
                    <span style="font-size:11px; font-weight:bold; color:#f1f5f9; display:block; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; max-width:85px;">${key}</span>
                    <span class="material-count">x${window.inventory.ETC[key]}</span>
                </div>
                `;
        })
        .join("") +
      `</div>`;
  }

  // 4. Usable Potions Sack
  let useBox = document.getElementById("bag-use");
  if (useBox) {
    let useKeys = Object.keys(window.inventory.USE || {}).filter(
      (k) => window.inventory.USE[k] > 0,
    );
    if (useKeys.length === 0) {
      useBox.innerHTML =
        "<div style='color:#666;text-align:center;padding-top:40px;'>No usable items. Purchase potions/scrolls at the Market!</div>";
    } else {
      // Apply priority structured ordering to usable potions
      useKeys.sort((a, b) => {
        let idxA = USE_SORT_ORDER.indexOf(a);
        let idxB = USE_SORT_ORDER.indexOf(b);
        if (idxA === -1) idxA = 999;
        if (idxB === -1) idxB = 999;
        return idxA - idxB;
      });

      useBox.innerHTML =
        `<div class="consumable-grid">` +
        useKeys
          .map((key) => {
            let count = window.inventory.USE[key];
            return `
                        <div class="consumable-badge" onmouseenter="window.showUseTooltip(event, '${key}')" ontouchstart="window.showUseTooltip(event, '${key}')" onmouseleave="window.hideTooltip()">
                            <div style="display:flex; align-items:center; width:100%; gap:4px;">
                                ${getUseIconHtml(key)}
                                <div style="text-align:left; min-width:0; flex:1;">
                                    <strong style="font-size:11px; color:#fff; display:block; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${key}</strong>
                                    <span style="font-size:10px; color:#94a3b8;">Qty: ${count}</span>
                                </div>
                            </div>
                            <button class="btn-action" style="background:#2ecc71; width:100%; padding:4px 0; font-size:10.5px; font-weight:bold; border-radius:4px; margin-top:2px;" onclick="window.useItem('${key}')">Consume</button>
                        </div>
                    `;
          })
          .join("") +
        `</div>`;
    }
  }
};

window.hideTooltip = function () {
  ["game-tooltip", "etc-tooltip", "stat-tooltip", "log-item-tooltip"].forEach(
    (id) => {
      let el = document.getElementById(id);
      if (el) el.style.display = "none";
    },
  );
  window.activeStatTooltip = null;
};

// Calculates optimal tooltip placement to prevent clipping off the visible browser viewport
window.positionTooltip = function (e, tt) {
  let container = document
    .getElementById("game-container")
    .getBoundingClientRect();
  let clientX =
    e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
  let clientY =
    e.clientY || (e.touches && e.touches[0] ? e.touches[0].clientY : 0);

  let ttWidth = tt.offsetWidth;
  let ttHeight = tt.offsetHeight;
  let padding = 10;

  let vx, vy;

  const isLandscapeMobile =
    window.innerHeight <= 550 && window.innerWidth > window.innerHeight;
  const isMobile = window.innerWidth <= 600 || isLandscapeMobile;

  if (isMobile) {
    // Check if displaying a comparison layout to shrink sizing safely on mobile
    let isComparison = tt.querySelector(".compare-border") !== null;
    if (isComparison) {
      tt.style.fontSize = "9.5px";
      tt.querySelectorAll(".tooltip-card").forEach((card) => {
        card.style.padding = "6px 8px";
      });
      tt.querySelectorAll(".tt-title").forEach((title) => {
        title.style.fontSize = "10.5px";
        title.style.marginBottom = "2px";
      });
      tt.querySelectorAll(".tt-subtitle").forEach((sub) => {
        sub.style.fontSize = "8.5px";
        sub.style.marginBottom = "2px";
      });
      tt.querySelectorAll(".tt-stat-line").forEach((line) => {
        line.style.fontSize = "9px";
        line.style.marginBottom = "1px";
      });
      // Hides descriptive lore on compact comparisons tooltips to save vertical viewport space
      tt.querySelectorAll('div[style*="lore"]').forEach((lore) => {
        lore.style.display = "none";
      });
      ttWidth = tt.offsetWidth;
      ttHeight = tt.offsetHeight;
    } else {
      tt.style.fontSize = "";
      tt.querySelectorAll(".tooltip-card").forEach(
        (card) => (card.style.padding = ""),
      );
      tt.querySelectorAll(".tt-title").forEach((title) => {
        title.style.fontSize = "";
        title.style.marginBottom = "";
      });
      tt.querySelectorAll(".tt-subtitle").forEach((sub) => {
        sub.style.fontSize = "";
        sub.style.marginBottom = "";
      });
      tt.querySelectorAll(".tt-stat-line").forEach((line) => {
        line.style.fontSize = "";
        line.style.marginBottom = "";
      });
      tt.querySelectorAll('div[style*="lore"]').forEach((lore) => {
        lore.style.display = "";
      });
    }

    // Centering alignment preventing layout cutting-off
    vx = (window.innerWidth - ttWidth) / 2;
    vy = clientY + 18;

    if (vy + ttHeight > window.innerHeight) {
      vy = clientY - ttHeight - 18;
    }
    if (vy < padding) {
      vy = padding;
    }

    let spaceAvailable = window.innerHeight - 2 * padding;
    if (ttHeight > spaceAvailable) {
      tt.style.maxHeight = spaceAvailable + "px";
      tt.style.overflowY = "auto";
      vy = padding;
    } else {
      tt.style.maxHeight = "";
      tt.style.overflowY = "";
    }
  } else {
    // Restore standard desktop layout sizes
    tt.style.fontSize = "";
    tt.style.maxHeight = "";
    tt.style.overflowY = "";
    tt.querySelectorAll(".tooltip-card").forEach(
      (card) => (card.style.padding = ""),
    );
    tt.querySelectorAll(".tt-title").forEach((title) => {
      title.style.fontSize = "";
      title.style.marginBottom = "";
    });
    tt.querySelectorAll(".tt-subtitle").forEach((sub) => {
      sub.style.fontSize = "";
      sub.style.marginBottom = "";
    });
    tt.querySelectorAll(".tt-stat-line").forEach((line) => {
      line.style.fontSize = "";
      line.style.marginBottom = "";
    });
    tt.querySelectorAll('div[style*="lore"]').forEach((lore) => {
      lore.style.display = "";
    });

    vx = clientX + 15;
    vy = clientY + 15;

    if (vx + ttWidth > window.innerWidth) {
      vx = clientX - ttWidth - 15;
    }
    if (vy + ttHeight > window.innerHeight) {
      vy = clientY - ttHeight - 15;
    }

    if (vx < 5) vx = 5;
    if (vy < 5) vy = 5;
  }

  let x = vx - container.left;
  let y = vy - container.top;

  tt.style.left = x + "px";
  tt.style.top = y + "px";
};

window.showInventoryTooltip = function (e, itemId) {
  e.stopPropagation();
  let item =
    window.inventory.EQUIP.find((i) => i.id === itemId) ||
    (window.inventory.ARTIFACT &&
      window.inventory.ARTIFACT.find((i) => i.id === itemId)) ||
    window.frozenItemDb[itemId];
  if (!item) return;
  let tt = document.getElementById("game-tooltip");
  tt.innerHTML = window.buildGeneralTooltipHtml(item, true);
  tt.style.borderColor = window.getTierColor(item.statsRolled);
  tt.style.display = "block";
  window.positionTooltip(e, tt);
};

window.showLogTooltip = function (e, itemId) {
  window.showInventoryTooltip(e, itemId);
};

// Generates and positions item comparison tooltips inside the Blacksmith Forge interface
window.showForgeTooltip = function (e, itemId) {
  e.stopPropagation();
  let item =
    window.inventory.EQUIP.find((i) => i.id === itemId) ||
    (window.inventory.ARTIFACT &&
      window.inventory.ARTIFACT.find((i) => i.id === itemId));
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
  let tt = document.getElementById("game-tooltip");
  tt.innerHTML = window.buildGeneralTooltipHtml(item, false);
  tt.style.borderColor = window.getTierColor(item.statsRolled);
  tt.style.display = "block";
  window.positionTooltip(e, tt);
};

window.showSlotTooltip = function (e, slot) {
  e.stopPropagation();
  let item = window.equippedSlots[slot];
  if (!item) return;
  item.isEquippedSlot = slot;
  let tt = document.getElementById("game-tooltip");
  tt.innerHTML = window.buildGeneralTooltipHtml(item, false);
  tt.style.borderColor = window.getTierColor(item.statsRolled);
  tt.style.display = "block";
  window.positionTooltip(e, tt);
};

window.buildGeneralTooltipHtml = function (item, isBagItem = false) {
  let eq = isBagItem ? getEquippedItemForComparison(item.type) : null;
  let html = "";
  if (eq && eq.id !== item.id) {
    html += `<div class="tooltip-card compare-border" style="box-shadow: 0 0 16px rgba(231, 76, 60, 0.4), inset 0 0 10px rgba(192, 57, 43, 0.2); border: 2px solid rgba(192, 57, 43, 0.7); border-radius: 6px; background: rgba(10, 2, 2, 0.95);">${window.generateItemCardHtml(eq, null, true)}</div>`;
    html += `<div class="tooltip-card" style="border: 2px solid transparent;">${window.generateItemCardHtml(item, eq, false)}</div>`;
  } else {
    let isEquipped = isBagItem ? false : item.isEquippedSlot != null;
    let activeStyle = isEquipped
      ? `style="box-shadow: 0 0 16px rgba(231, 76, 60, 0.4), inset 0 0 10px rgba(192, 57, 43, 0.2); border: 2px solid rgba(192, 57, 43, 0.7); border-radius: 6px; background: rgba(10, 2, 2, 0.95);"`
      : ``;
    html += `<div class="tooltip-card" ${activeStyle}>${window.generateItemCardHtml(item, null, isEquipped)}</div>`;
  }
  return `<div class="tooltip-flex-container">${html}</div>`;
};

window.generateItemCardHtml = function (
  item,
  compareItem = null,
  isEquipped = false,
) {
  if (!item) return "";
  let html = "";
  let badge = isEquipped
    ? `
        <div style="
            background: linear-gradient(135deg, #e74c3c, #c0392b);
            color: #fff;
            font-size: 9px;
            font-weight: 800;
            padding: 4px;
            border-radius: 4px;
            text-transform: uppercase;
            letter-spacing: 1.5px;
            box-shadow: 0 0 10px rgba(231, 76, 60, 0.6);
            border: 1px solid #ff4d4d;
            text-shadow: 0 1px 2px rgba(0,0,0,0.5);
            text-align: center;
            margin-bottom: 8px;
            white-space: nowrap;
        ">
            Currently Equipped
        </div>
    `
    : ``;
  html += badge;

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
  let uniqueStyle = window.getUniqueItemStyle(item);
  let runicBadge = isUnique
    ? `<div style="color: #f1c40f; font-family: monospace; font-weight: 800; font-size: 10px; margin-bottom: 6px; letter-spacing: 2px; text-transform: uppercase; text-shadow: 0 0 10px rgba(241, 196, 15, 0.5);">⚡ UBER UNIQUE ⚡</div>`
    : ``;

  let iconIllustration = "";
  if (item.type === "artifact") {
    iconIllustration = `<div style="text-align:center; margin: 10px 0;">${window.getArtifactIconHtml(item.trait, 56)}</div>`;
  } else if (isUnique) {
    iconIllustration = `<div style="text-align:center; margin: 10px 0;">${window.getUniqueIconHtml(item, 56)}</div>`;
  }

  let tierColor = window.getTierColor(item.statsRolled);
  let titleColor = item.type === "artifact" ? "#1abc9c" : tierColor;
  let labelDisplay = item.type.toUpperCase();
  if (item.type === "subweapon" && item.subType) {
    labelDisplay = `SUBWEAPON (${item.subType.toUpperCase()})`;
  }
  let reqLvl = 1;
  if ((item.stageLevel || 1) >= 3) {
    reqLvl = Math.max(
      1,
      ((item.stageLevel || 1) - 2) * 5 -
        (window.playerStats.prestigeCount || 0) * 5,
    );
  }
  let subtitle =
      item.type === "artifact"
        ? "Unique Artifact"
        : `${labelDisplay} | <span style="color:${tierColor}; font-weight:bold;">${tierStrDisplay(item)}</span>`;
  if (reqLvl > 1) {
    let reqColor = window.playerStats.level >= reqLvl ? "#2ecc71" : "#e74c3c";
    subtitle += `<br><span style="color:${reqColor}; font-weight:bold;">Required Level: ${reqLvl}</span>`;
  }
  let temperTag =
    item.temperLevel > 0
      ? ` <span style="color:#2ecc71;">[+${item.temperLevel}]</span>`
      : "";
  let lockTag = item.locked ? " 🔒" : "";

  html += `<div class="tt-title" style="color:${isUnique ? "#1abc9c" : titleColor}; white-space:normal;">${item.name}${temperTag}${lockTag}</div>`;
  html += runicBadge;
  html += iconIllustration;
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
    let baseStats = [];

    if (item.baseAtk > 0) {
      baseStats.push({
        label: "Weapon Damage",
        val: Math.round(item.baseAtk),
        icon: "⚔️",
      });
    }
    if (item.baseDef > 0) {
      baseStats.push({
        label: "Armor",
        val: Math.round(item.baseDef),
        icon: "🛡️",
      });
    }
    if (item.baseMaxHp > 0) {
      baseStats.push({
        label: "Max Life",
        val: Math.round(item.baseMaxHp),
        icon: "❤️",
      });
    }
    if (item.baseMoveSpeed > 0) {
      baseStats.push({
        label: "Speed",
        val: Math.round(item.baseMoveSpeed),
        icon: "👟",
      });
    }
    if (item.baseBlock > 0) {
      baseStats.push({
        label: "Block Rate",
        val: Math.round(item.baseBlock * 100) + "%",
        icon: "🛡️",
      });
    }
    if (item.baseParry > 0) {
      baseStats.push({
        label: "Parry Rate",
        val: Math.round(item.baseParry * 100) + "%",
        icon: "⚡",
      });
    }
    if (item.baseInt > 0) {
      baseStats.push({
        label: "Intelligence",
        val: Math.round(item.baseInt),
        icon: "🧠",
      });
    }

    if (baseStats.length > 0) {
      html += `<div style="background: rgba(255, 255, 255, 0.02); border: 1px solid #222; border-radius: 4px; padding: 6px; margin: 8px 0; text-align: center;">`;
      html += `<div style="font-size: 9px; color: #888; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 4px; font-weight: bold;">Base Stats</div>`;
      baseStats.forEach((b) => {
        html += `<div style="font-size: 13px; font-weight: bold; color: #f5f6fa; margin: 1px 0;">${b.icon} ${b.val} ${b.label}</div>`;
      });
      html += `</div>`;
    }
  }

  if (item.type === "artifact") {
      html += `<div class="tt-trait">${item.breakdown}</div>`;

      // Only display potential extra rolls on preview (dummy) items to prevent clutter on equipped items
      if (item.id === "dummy") {
        html += `<div style="margin-top:10px; border-top:1.5px dashed #1abc9c; padding-top:6px;">`;
        html += `<div style="font-weight:bold; color:#1abc9c; font-size:10px; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:4px;">🎰 Potential Extra Affixes (Rolls 3):</div>`;
        html += `<div style="font-size:9.5px; color:#aaa; line-height:1.45; white-space:normal; font-family:monospace;">`;
        html += `Can roll 3 extra random affixes: Drop Rate, Drop Quality, Gold Multiplier, Rare Spawn, Fairy Spawn, Strength, Dexterity, or Intelligence.`;
        html += `</div></div>`;
      }
    } else {
    if (isUnique && item.desc) {
      html += `<div class="tt-stat-line" style="color:#ffeaa7; margin-bottom: 10px; white-space:normal; line-height:1.4; padding:6px; border:1px dashed #1abc9c; background:rgba(0,0,0,0.4); border-radius:4px;"><strong>• Unique Effect:</strong> ${item.desc}</div>`;
    }
    if (item.totalEnchants > 0) {
      html += `<div style="color:#9b59b6; font-size:10px; font-weight:bold; margin-bottom:6px; letter-spacing:0.5px; border: 1px dashed #9b59b6; padding: 3px; border-radius: 3px; background: rgba(155, 89, 182, 0.05); text-align: center;">🔮 MYSTICAL ENCHANTS: ${item.totalEnchants} ACTIVE</div>`;
    }
    html += `<div style="font-weight:bold; color:#aaa; margin-bottom:4px; border-bottom: 1px solid #333; padding-bottom: 2px;">Affixes:</div>`;
  }

  // --- EXPLICIT AFFIXES SECTION ---
    if (item.id !== "dummy") {
      let affixes = [];

      const statsKeys = [
        { key: "atk", icon: "⚔️", label: "Attack", baseKey: "baseAtk" },
        { key: "maxHp", icon: "❤️", label: "Max HP", baseKey: "baseMaxHp" },
        { key: "def", icon: "🛡️", label: "Defense", baseKey: "baseDef" },
        {
          key: "moveSpeed",
          icon: "👟",
          label: "Move Speed",
          baseKey: "baseMoveSpeed",
        },
        { key: "str", icon: "💪", label: "STR", baseKey: "baseStr" },
        { key: "dex", icon: "🎯", label: "DEX", baseKey: "baseDex" },
        { key: "int", icon: "🧠", label: "INT", baseKey: "baseInt" },
        { key: "critChance", icon: "✨", label: "Crit Chance", isPct: true },
        { key: "critDamage", icon: "💥", label: "Crit Multi", isPct: true },
        {
          key: "block",
          icon: "🛡️",
          label: "Block Rate",
          isPct: true,
          baseKey: "baseBlock",
        },
        {
          key: "parry",
          icon: "⚡",
          label: "Parry Rate",
          isPct: true,
          baseKey: "baseParry",
        },
        {
          key: "activeAttackSpeed",
          icon: "⚡",
          label: "Active Atk Spd",
          isPct: true,
          baseKey: "baseActiveSpeed",
        },
        {
          key: "idleAttackSpeed",
          icon: "⏱️",
          label: "Idle Atk Spd",
          isPct: true,
          baseKey: "baseIdleSpeed",
        },
        { key: "dropRate", icon: "🍀", label: "Drop Rate", isPct: true },
        { key: "quality", icon: "💎", label: "Drop Quality", isPct: true },
        { key: "goldMulti", icon: "🟡", label: "Gold Multi", isPct: true },
        {
          key: "rareSpawn",
          icon: "✨",
          label: "Rare Spawn",
          isPct: true,
          isDoublePct: true,
        },
        { key: "fairySpawn", icon: "🧚", label: "Fairy Spawn", isPct: true },
      ];

      statsKeys.forEach((s) => {
        let totalVal = item[s.key] || 0;
        let baseVal =
          item.type !== "artifact" && s.baseKey ? item[s.baseKey] || 0 : 0;
        let affixVal = totalVal - baseVal;

        if (
          affixVal > 0.0001 ||
          ((s.key === "activeAttackSpeed" || s.key === "idleAttackSpeed") &&
            affixVal > 0)
        ) {
          let displayVal = "";
          if (s.isDoublePct) {
            displayVal = `+${(affixVal * 100).toFixed(2)}%`;
          } else if (s.isPct) {
            displayVal = `+${Math.floor(affixVal * 100)}%`;
          } else {
            displayVal = `+${Math.round(affixVal).toLocaleString()}`;
          }

          let rangeStr = window.formatStatRangeStr
            ? window.formatStatRangeStr(item, s.key, s.isPct || s.isDoublePct)
            : "";
          affixes.push(
            `<div class="tt-stat-line" style="color:${s.key === "critChance" || s.key === "critDamage" ? "#e67e22" : "#ecf0f1"};">• ${s.icon} ${s.label}: ${displayVal}${window.getStatEnchantSuffix ? window.getStatEnchantSuffix(item, s.key) : ""}${rangeStr}</div>`,
          );
        }
      });

      if (affixes.length > 0) {
        if (item.type === "artifact") {
          html += `<div style="font-weight:bold; color:#aaa; margin-top:8px; margin-bottom:4px; border-bottom: 1px solid #333; padding-bottom: 2px;">Bonus Parameters:</div>`;
        }
        html += affixes.join("");
      } else {
        if (item.type !== "artifact") {
          html += `<div class="tt-stat-line" style="color:#7f8c8d; font-style:italic;">No extra affixes.</div>`;
        }
      }

    let setName = window.getItemSetName ? window.getItemSetName(item) : null;
    if (setName && window.SET_DEFINITIONS[setName]) {
      let setDef = window.SET_DEFINITIONS[setName];
      let currentEquippedCount = 0;
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
        let eqItem = window.equippedSlots[slot];
        if (eqItem) {
          let eqSetName = window.getItemSetName(eqItem);
          if (eqSetName === setName)
            currentEquippedCount += slot === "overall" ? 2 : 1;
        }
      });

      html += `<div style="margin-top:10px; padding-top:6px; border-top:1px dashed #555;">`;
      let displayCount = Math.min(3, currentEquippedCount);
      html += `<div style="font-weight:bold; color:#f1c40f; font-size:10px;">🌟 SET: ${setDef.name} (${displayCount}/3 equipped)</div>`;
      setDef.bonuses.forEach((b) => {
        let activeColor =
          currentEquippedCount >= b.count ? "#2ecc71" : "#7f8c8d";
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
      { key: "atk", icon: "⚔️" },
      { key: "maxHp", icon: "❤️" },
      { key: "def", icon: "🛡️" },
      { key: "moveSpeed", icon: "👟" },
      { key: "str", icon: "💪" },
      { key: "dex", icon: "🎯" },
      { key: "int", icon: "🧠" },
      { key: "critChance", isPct: true, icon: "✨" },
      { key: "critDamage", isPct: true, icon: "💥" },
      { key: "block", isPct: true, icon: "🛡️" },
      { key: "parry", isPct: true, icon: "⚡" },
      { key: "activeAttackSpeed", icon: "⚡", isPct: true },
      { key: "idleAttackSpeed", icon: "⏱️", isPct: true },
    ];

    statsList.forEach((s) => {
      let val = item[s.key] || 0;
      let eqVal = compareItem[s.key] || 0;
      let diff = val - eqVal;
      if (Math.abs(diff) > 0.001) {
        hasDiffs = true;
        let isPct =
          s.isPct || ["activeAttackSpeed", "idleAttackSpeed"].includes(s.key);
        let isPositive = s.inverseGood ? diff < 0 : diff > 0;
        let color = isPositive ? "#2ecc71" : "#e74c3c";
        let sign = diff > 0 ? "+" : "";
        let diffStr = isPct
          ? sign + Math.round(diff * 100) + "%"
          : sign + Math.round(diff).toLocaleString();
        let emoji = s.icon ? s.icon + " " : "";
        let sLabel = window.getStatLabel(s.key);

        html += `<div class="tt-stat-line" style="color:${color}; font-weight:bold; white-space:nowrap;">• ${emoji}${sLabel}: ${diffStr}</div>`;
      }
    });
    if (!hasDiffs)
      html += `<div class="tt-stat-line" style="color:#7f8c8d; font-style:italic;">No net difference.</div>`;
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
  return item.statsRolled === "UNIQUE"
    ? "UNIQUE"
    : `${item.statsRolled}★ ${window.getTierName(item.statsRolled)}`;
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
  let chest = window.equippedSlots.chest;
  let leggings = window.equippedSlots.leggings;
  if (!chest && !leggings) return null;
  let maxStars = Math.max(
    chest ? (chest.statsRolled === "UNIQUE" ? 5 : chest.statsRolled || 0) : 0,
    leggings
      ? leggings.statsRolled === "UNIQUE"
        ? 5
        : leggings.statsRolled || 0
      : 0,
  );
  return {
    id: "virtual_combined",
    name: "Equipped Chest + Leggings",
    type: "overall",
    statsRolled: maxStars,
    temperLevel: 0,
    stageLevel: 1,
    atk: (chest?.atk || 0) + (leggings?.atk || 0),
    maxHp: (chest?.maxHp || 0) + (leggings?.maxHp || 0),
    def: (chest?.def || 0) + (leggings?.def || 0),
    moveSpeed: (chest?.moveSpeed || 0) + (leggings?.moveSpeed || 0),
    critChance: (chest?.critChance || 0) + (leggings?.critChance || 0),
    critDamage: (chest?.critDamage || 0) + (leggings?.critDamage || 0),
    block: (chest?.block || 0) + (leggings?.block || 0),
    parry: (chest?.parry || 0) + (leggings?.parry || 0),
    activeAttackSpeed:
      (chest?.activeAttackSpeed || 0) + (leggings?.activeAttackSpeed || 0),
    idleAttackSpeed:
      (chest?.idleAttackSpeed || 0) + (leggings?.idleAttackSpeed || 0),
    str: (chest?.str || 0) + (leggings?.str || 0),
    dex: (chest?.dex || 0) + (leggings?.dex || 0),
    int: (chest?.int || 0) + (leggings?.int || 0),
    baseAtk: (chest?.baseAtk || 0) + (leggings?.baseAtk || 0),
    baseMaxHp: (chest?.baseMaxHp || 0) + (leggings?.baseMaxHp || 0),
    baseDef: (chest?.baseDef || 0) + (leggings?.baseDef || 0),
    baseMoveSpeed: (chest?.baseMoveSpeed || 0) + (leggings?.baseMoveSpeed || 0),
    baseBlock: (chest?.baseBlock || 0) + (leggings?.baseBlock || 0),
    baseParry: (chest?.baseParry || 0) + (leggings?.baseParry || 0),
    baseInt: (chest?.baseInt || 0) + (leggings?.baseInt || 0),
  };
}

window.getComparisonDeltaBadge = function (item) {
  if (item.type === "artifact") return "";
  let eq = getEquippedItemForComparison(item.type);
  if (!eq)
    return ` <span style="color:#2ecc71; font-weight:bold; font-size:9px;">[▲ NEW]</span>`;

  let primaryStat = "atk";
  if (["chest", "leggings", "helmet", "overall"].includes(item.type))
    primaryStat = "def";
  else if (item.type === "boots") primaryStat = "moveSpeed";
  else if (item.type === "subweapon")
    primaryStat = item.subType === "shield" ? "def" : "atk";

  let val = item[primaryStat] || 0;
  let eqVal = eq[primaryStat] || 0;
  let diff = val - eqVal;
  if (diff > 0.1) {
    let label =
      primaryStat === "moveSpeed" ? diff.toFixed(1) : Math.round(diff);
    return ` <span style="color:#2ecc71; font-weight:bold; font-size:9px;">[▲ +${label}]</span>`;
  } else if (diff < -0.1) {
    let label =
      primaryStat === "moveSpeed"
        ? Math.abs(diff).toFixed(1)
        : Math.round(Math.abs(diff));
    return ` <span style="color:#e74c3c; font-weight:bold; font-size:9px;">[▼ -${label}]</span>`;
  }
  return "";
};

window.showEtcTooltip = function (e, keyName) {
  e.stopPropagation();
  let tt = document.getElementById("etc-tooltip");
  let desc = window.etcDex[keyName] || "Unknown material.";

  let color = "#bdc3c7";
  if (keyName === "Eridium Shard") {
    color = "#8e44ad";
  } else if (keyName === "Gacha Key") {
    color = "#f1c40f";
  } else if (keyName === "Ancient Core") {
    color = "#e74c3c";
  } else if (keyName === "Overlord's Sigil") {
    color = "#1abc9c";
  } else if (keyName === "Astral Essence") {
    color = "#8e44ad";
  } else if (keyName === "Mythic Scrap") {
    color = "#e74c3c";
  } else if (keyName === "Legendary Scrap") {
    color = "#f1c40f";
  } else if (keyName === "Epic Scrap") {
    color = "#e67e22";
  } else if (keyName === "Magic Scrap") {
    color = "#9b59b6";
  } else if (keyName === "Rare Scrap") {
    color = "#3498db";
  } else if (keyName === "Luminous Soul") {
    color = "#ffb6c1";
  } else if (keyName === "Monster Soul") {
    color = "#888888";
  } else if (keyName === "Catalyst Core") {
    color = "#2ecc71";
  }

  let iconHtml = getEtcIconHtml(keyName).replace(
    "margin-right: 12px;",
    "margin-right: 8px;",
  );

  tt.innerHTML = `<div style="padding: 10px; width: 220px; box-sizing: border-box;"><div class="tt-title" style="color:${color}; display:flex; align-items:center; gap:8px;">${iconHtml}<span>${keyName}</span></div><div style="color:#aaa; font-size:11px; white-space:normal; line-height:1.4; margin-top:8px;">${desc}</div></div>`;
  tt.style.borderColor = color;
  tt.style.display = "block";
  window.positionTooltip(e, tt);
};

// Procedurally refresh Gold Shop items at designated timestamps
window.refreshMarketShopIfNeeded = function () {
  let now = Date.now();
  if (
    now >= window.playerStats.shopRefreshTime ||
    window.playerStats.shopItems.length === 0
  ) {
    window.playerStats.shopRefreshTime = now + 30 * 60 * 1000;
    window.playerStats.shopItems = [];

    let peakRunStage = Math.max(
      window.playerStats.stage,
      window.playerStats.maxStage || 1,
    );
    let stageScale = Math.floor((peakRunStage - 1) / 10) + 1;
    let types = ["weapon", "subweapon", "helmet", "chest", "leggings", "boots"];

    for (let i = 0; i < 5; i++) {
      let isIOTD = i === 4;
      let p = window.resolvePlayerStats();
      // Incorporate Merchant Investment (+1% quality multiplier per level) for shop items
      let luckMultiplier = p.qly + (window.playerStats.shopQLevel || 0) * 0.01;
      let roll = Math.random() * 100;
      let statLinesCount = 0;

      if (isIOTD) {
        if (roll < 1.0 * luckMultiplier) statLinesCount = 5;
        else if (roll < 5.0 * luckMultiplier) statLinesCount = 4;
        else if (roll < 20.0 * luckMultiplier) statLinesCount = 3;
        else if (roll < 50.0 * luckMultiplier) statLinesCount = 2;
        else statLinesCount = 1;
      } else {
        if (roll < 0.01 * luckMultiplier) statLinesCount = 5;
        else if (roll < 0.1 * luckMultiplier) statLinesCount = 4;
        else if (roll < 0.5 * luckMultiplier) statLinesCount = 3;
        else if (roll < 2.0 * luckMultiplier) statLinesCount = 2;
        else if (roll < 10.0 * luckMultiplier) statLinesCount = 1;
        else statLinesCount = 0;
      }

      let chosenType = types[Math.floor(Math.random() * types.length)];
      let cost = Math.floor(
        500 * Math.pow(2.15, stageScale - 1) * Math.pow(2.5, statLinesCount),
      );

      let shopItemData = window.createItemObject(
        chosenType,
        statLinesCount,
        stageScale,
        isIOTD ? 1 : 0,
      );
      shopItemData.cost = cost;
      shopItemData.purchased = false;
      shopItemData.isIOTD = isIOTD;

      window.playerStats.shopItems.push(shopItemData);
    }
    if (typeof window.saveGame === "function") window.saveGame();
  }
  window.renderMarketShop();
};

window.showUseTooltip = function (e, keyName) {
  e.stopPropagation();
  let tt = document.getElementById("etc-tooltip");

  let desc = "Consumable item.";
  let color = "#bdc3c7";

  if (useDex[keyName]) {
    desc = useDex[keyName].desc;
    color = useDex[keyName].color;
  } else {
    let stockItem = window.MYSTICAL_STOCK.find((item) => item.name === keyName);
    if (stockItem) {
      desc = stockItem.desc;
      color = stockItem.color || "#bdc3c7";
    }
  }

  if (keyName === "SP Reset Scroll") {
    color = "#9b59b6";
  } else if (keyName === "PP Reset Scroll") {
    color = "#e67e22";
  } else if (keyName.includes("Attack")) {
    color = "#2ecc71";
  } else if (keyName.includes("Vitality")) {
    color = "#e74c3c";
  } else if (keyName.includes("Armored")) {
    color = "#3498db";
  } else if (keyName.includes("Haste")) {
    color = "#f1c40f";
  } else if (keyName.includes("XP") || keyName.includes("Double XP")) {
    color = "#a855f7";
  } else if (
    keyName.includes("Drop Rate") ||
    keyName.includes("Double Drop") ||
    keyName.includes("Drop Elixir")
  ) {
    color = "#22c55e";
  } else if (keyName.includes("Quality")) {
    color = "#ec4899";
  }

  let iconHtml = getUseIconHtml(keyName).replace(
    "margin-right: 12px;",
    "margin-right: 8px;",
  );

  tt.innerHTML = `<div style="padding: 10px; width: 220px; box-sizing: border-box;"><div class="tt-title" style="color:${color}; display:flex; align-items:center; gap:8px;">${iconHtml}<span>${keyName}</span></div><div style="color:#aaa; font-size:11px; white-space:normal; line-height:1.4; margin-top:8px;">${desc}</div></div>`;
  tt.style.borderColor = color;
  tt.style.display = "block";
  window.positionTooltip(e, tt);
};

// --- TAB TRANSITIONS ---

window.switchTab = function (tabId) {
  window.hideTooltip();
  // Keep backward-compatibility with code that tries to target 'gear' or 'stats'
  if (tabId === "gear" || tabId === "stats") tabId = "hero";

  document
    .querySelectorAll(".tab-content")
    .forEach((c) => c.classList.remove("active"));
  document
    .querySelectorAll(".tab-btn")
    .forEach((b) => b.classList.remove("active"));

  let activeBtn = Array.from(document.querySelectorAll(".tab-btn")).find((b) =>
    b.getAttribute("onclick")?.includes(`'${tabId}'`),
  );
  if (activeBtn) activeBtn.classList.add("active");

  let contentEl = document.getElementById("tab-" + tabId);
  if (contentEl) contentEl.classList.add("active");

  if (tabId === "hero") {
    window.ensureDraftInitialized();
  }
  if (tabId === "forge") {
    if (typeof window.renderForgeTab === "function") window.renderForgeTab();
  }
  if (tabId === "market") {
    if (typeof window.refreshMarketShopIfNeeded === "function")
      window.refreshMarketShopIfNeeded();
    if (typeof window.renderMysticalShop === "function")
      window.renderMysticalShop();
    if (typeof window.renderGoldUpgrades === "function")
      window.renderGoldUpgrades();
    if (!document.querySelector("#tab-market .sub-tab-btn.active")) {
      window.switchMarketSubTab("ALTAR");
    } else {
      let activeBtn = document.querySelector("#tab-market .sub-tab-btn.active");
      if (activeBtn && activeBtn.id === "market-sub-tab-altar") {
        window.renderAltarTab();
      }
    }
  }
  if (tabId === "prestige") {
    if (typeof window.renderPrestigeTab === "function")
      window.renderPrestigeTab();
  }
  window.updateUI();
};

window.switchSubTab = function (subTabId) {
  window.state.currentSubTab = subTabId;
  document
    .querySelectorAll(".sub-tabs:not(#tab-market .sub-tabs) .sub-tab-btn")
    .forEach((btn) => btn.classList.remove("active"));
  let activeBtn = document.getElementById("sub-tab-" + subTabId.toLowerCase());
  if (activeBtn) activeBtn.classList.add("active");

  document.getElementById("bag-equip").style.display =
    subTabId === "EQUIP" ? "block" : "none";
  document.getElementById("bag-art").style.display =
    subTabId === "ART" ? "block" : "none";
  document.getElementById("bag-etc").style.display =
    subTabId === "ETC" ? "block" : "none";
  document.getElementById("bag-use").style.display =
    subTabId === "USE" ? "block" : "none";
  window.updateUI();
};

window.switchMarketSubTab = function (subTabId) {
  document
    .querySelectorAll("#tab-market .sub-tabs .sub-tab-btn")
    .forEach((btn) => btn.classList.remove("active"));
  document
    .querySelectorAll(".market-section-content")
    .forEach((sec) => (sec.style.display = "none"));

  let btnSuffix =
    subTabId === "ALTAR"
      ? "altar"
      : subTabId === "GACHA"
        ? "gacha"
        : subTabId === "SINKS"
          ? "sinks"
          : subTabId === "ALCHEMY"
            ? "alchemy"
            : "shop";
  let activeBtn = document.getElementById("market-sub-tab-" + btnSuffix);
  if (activeBtn) activeBtn.classList.add("active");

  let secSuffix =
    subTabId === "ALTAR"
      ? "altar"
      : subTabId === "GACHA"
        ? "gacha"
        : subTabId === "SINKS"
          ? "sinks"
          : subTabId === "ALCHEMY"
            ? "alchemy"
            : "shop";
  let activeSec = document.getElementById("market-sec-" + secSuffix);
  if (activeSec) activeSec.style.display = "block";

  if (subTabId === "ALTAR") {
    window.renderAltarTab();
  } else if (subTabId === "GACHA") {
    window.updateGachaRecentList();
    window.renderGachaShowcaseMarquee();
  }

  if (typeof window.hideTooltip === "function") window.hideTooltip();
};

window.toggleFullscreen = function () {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch((err) => {
      console.log("Fullscreen activation failed", err);
    });
  } else {
    document.exitFullscreen();
  }
};

window.rerollDailyMission = function (missionId) {
  let mList = window.playerStats.dailyMissions;
  if (!mList) return;
  let mIndex = mList.findIndex((x) => x.id === missionId);
  if (mIndex === -1) return;
  let targetMission = mList[mIndex];

  if (targetMission.completed || targetMission.claimed) {
    window.pushHeaderToast("❌ Cannot re-roll a completed task!", "#e74c3c");
    return;
  }

  let rerollsDone = window.playerStats.dailyRerollsDone || 0;
  if (rerollsDone >= 2) {
    window.pushHeaderToast(
      "❌ Locked: Maximum daily re-rolls reached!",
      "#e74c3c",
    );
    return;
  }

  let soulsCost = rerollsDone === 0 ? 0 : 50;
  let ownedSouls = window.inventory.ETC["Monster Soul"] || 0;

  if (soulsCost > 0 && ownedSouls < soulsCost) {
    window.pushHeaderToast("❌ Requires 50 Monster Souls!", "#e74c3c");
    return;
  }

  // Full 10-piece daily catalog
  let pool = [
    {
      type: "kills",
      label: "Slay monsters",
      targetBase: 300,
      mult: 10,
      unit: "monsters",
      treat: "Monster Soul",
      treatQty: 80,
    },
    {
      type: "rares",
      label: "Slay rare spawns",
      targetBase: 5,
      mult: 1,
      unit: "rares",
      treat: "Luminous Soul",
      treatQty: 3,
    },
    {
      type: "gold",
      label: "Collect Gold",
      targetBase: 2500,
      stageScale: true,
      unit: "Gold",
      treat: "Rare Scrap",
      treatQty: 15,
    },
    {
      type: "fairies",
      label: "Catch wild fairies",
      targetBase: 8,
      mult: 1,
      unit: "fairies",
      treat: "Luminous Soul",
      treatQty: 3,
    },
    {
      type: "tempers",
      label: "Successfully temper gear",
      targetBase: 1,
      mult: 1,
      unit: "tempers",
      treat: "Magic Scrap",
      treatQty: 8,
    },
    {
      type: "reforges",
      label: "Reforge gear modifiers",
      targetBase: 2,
      mult: 1,
      unit: "reforges",
      treat: "Catalyst Core",
      treatQty: 1,
    },
    {
      type: "dungeons",
      label: "Clear Dungeon floors",
      targetBase: 5,
      mult: 1,
      unit: "floors",
      treat: "Epic Scrap",
      treatQty: 6,
    },
    {
      type: "salvage",
      label: "Salvage gear items",
      targetBase: 15,
      mult: 1,
      unit: "items",
      treat: "Rare Scrap",
      treatQty: 12,
    },
    {
      type: "elixirs",
      label: "Consume active elixirs",
      targetBase: 3,
      mult: 1,
      unit: "elixirs",
      treat: "Monster Soul",
      treatQty: 60,
    },
    {
      type: "active_clicks",
      label: "Manually click canvas",
      targetBase: 250,
      mult: 1,
      unit: "clicks",
      treat: "Luminous Soul",
      treatQty: 2,
    },
  ];

  // Filter out duplicate active tasks
  let activeTypes = mList.map((x) => x.type);
  let eligiblePool = pool.filter((p) => !activeTypes.includes(p.type));

  if (eligiblePool.length === 0) {
    window.pushHeaderToast("No alternate tasks available!", "#e74c3c");
    return;
  }

  let newSelect = eligiblePool[Math.floor(Math.random() * eligiblePool.length)];
  let stage = window.playerStats.stage || 1;
  let finalTarget = newSelect.targetBase;
  if (newSelect.stageScale) {
    finalTarget = Math.ceil(newSelect.targetBase * Math.pow(1.045, stage));
  }

  // Apply currency adjustments
  if (soulsCost > 0) {
    window.inventory.ETC["Monster Soul"] -= soulsCost;
    if (window.inventory.ETC["Monster Soul"] === 0)
      delete window.inventory.ETC["Monster Soul"];
  }

  window.playerStats.dailyRerollsDone++;

  // Replace inline parameters with the new selection while ensuring Daily Sacks are preserved
  mList[mIndex] = {
    id: targetMission.id,
    type: newSelect.type,
    desc: `${newSelect.label} (${finalTarget.toLocaleString()} ${newSelect.unit})`,
    current: 0,
    target: finalTarget,
    treat: "Guild Reward Sack",
    treatQty: 1,
    completed: false,
    claimed: false,
  };

  window.pushHeaderToast("🔄 Mission Re-rolled!", "#2ecc71");
  window.SoundManager.play("swing");

  window.updateUI();
  window.renderMissionsWindow();
  window.renderInventory();
  window.saveGame();
};

window.forceCacheClear = function () {
  if (typeof window.showCustomConfirm === "function") {
    window.showCustomConfirm(
      "🔄 Force Refresh?",
      "This will save your progress and force-refresh the game directly from the server. Use this to ensure you have loaded the latest features and visual styles.",
      "Save & Reload",
      "Cancel",
      "#e67e22",
      function () {
        if (typeof window.saveGame === "function") window.saveGame();
        // Strip existing parameters and force a unique query string reload
        let cleanUrl =
          window.location.protocol +
          "//" +
          window.location.host +
          window.location.pathname;
        window.location.href = cleanUrl + "?update=" + Date.now();
      },
    );
  } else {
    if (typeof window.saveGame === "function") window.saveGame();
    let cleanUrl =
      window.location.protocol +
      "//" +
      window.location.host +
      window.location.pathname;
    window.location.href = cleanUrl + "?update=" + Date.now();
  }
};

window.checkForUpdates = function () {
  // Check version.json with a cache buster parameter to guarantee live server data
  fetch("version.json?cb=" + Date.now(), { cache: "no-store" })
    .then((response) => {
      if (!response.ok) throw new Error("Could not reach update manifest");
      return response.json();
    })
    .then((data) => {
      if (data && data.version && data.version > window.GAME_VERSION) {
        window.showCustomConfirm(
          "🚀 Update Found!",
          `A new version of SAQ (v${data.version}) has been deployed! Would you like to update the game to download the latest features and styles? Your progress is saved automatically.`,
          "Update Now",
          "Later",
          "#2ecc71",
          function () {
            if (typeof window.saveGame === "function") window.saveGame();
            let cleanUrl =
              window.location.protocol +
              "//" +
              window.location.host +
              window.location.pathname;
            window.location.href = cleanUrl + "?update=" + Date.now();
          },
        );
      }
    })
    .catch((err) => {
      console.log("Update check bypassed (Offline or Manifest Missing):", err);
    });
};

// --- LOG SYSTEM BOX ---

window.toggleLogPanel = function () {
  let container = document.getElementById("log-panel-container");
  if (container) {
    container.style.display =
      container.style.display === "none" ? "block" : "none";
  }
};

// Keydown listener tracking the 'Enter' key inside the console input bar
window.handleConsoleInput = function (event) {
  if (event.key === "Enter") {
    window.submitConsoleCommand();
  }
};

// Executes string commands typed in the logs terminal
window.submitConsoleCommand = function () {
  let inputEl = document.getElementById("dev-console-input");
  if (!inputEl) return;
  let cmd = inputEl.value.trim();
  inputEl.value = "";
  if (!cmd) return;

  if (typeof window.pushLog === "function") {
    window.pushLog(
      `<span style="color:#e67e22; font-family:monospace;">> ${cmd}</span>`,
    );
  }

  if (cmd === "/dev" || cmd === "/debug" || cmd === "/cheat") {
    let devMod = document.getElementById("dev-modal");
    if (devMod) devMod.style.display = "block";
    if (typeof window.switchDevTab === "function")
      window.switchDevTab("dev-prog");
    if (typeof window.pushHeaderToast === "function")
      window.pushHeaderToast(
        "🛠️ Developer Testing Panel Opened!",
        "var(--accent-orange)",
      );
    return;
  }

  let args = cmd.split(" ");
  let mainCmd = args[0].toLowerCase();

  if (mainCmd === "/gold") {
    let amt = parseInt(args[1], 10) || 100000;
    window.playerStats.coins += amt;
    window.playerStats.totalGoldEarned =
      (window.playerStats.totalGoldEarned || 0) + amt;
    if (typeof window.pushLog === "function")
      window.pushLog(
        `<span style="color:#2ecc71;">[DEV] Granted ${amt.toLocaleString()} Gold!</span>`,
      );
    if (typeof window.updateUI === "function") window.updateUI();
    if (typeof window.saveGame === "function") window.saveGame();
  } else if (mainCmd === "/level") {
    let lvl = parseInt(args[1], 10);
    if (lvl > 0) {
      window.playerStats.level = lvl;
      window.playerStats.sp = (window.playerStats.sp || 0) + 1;
      window.playerStats.xp = 0;
      window.playerStats.xpReq = Math.floor(
        250 * Math.pow(1.2, window.playerStats.level - 1),
      );
      let p = window.resolvePlayerStats();
      window.playerStats.currentHp = p.maxHp;
      if (typeof window.pushLog === "function")
        window.pushLog(
          `<span style="color:#2ecc71;">[DEV] Set Level to ${lvl}!</span>`,
        );
      if (typeof window.updateUI === "function") window.updateUI();
      if (typeof window.saveGame === "function") window.saveGame();
    }
  } else if (mainCmd === "/sp") {
    let amt = parseInt(args[1], 10) || 10;
    window.playerStats.sp += amt;
    if (typeof window.pushLog === "function")
      window.pushLog(
        `<span style="color:#2ecc71;">[DEV] Granted ${amt} Skill Points (SP)!</span>`,
      );
    if (typeof window.updateUI === "function") window.updateUI();
    if (typeof window.saveGame === "function") window.saveGame();
  } else if (mainCmd === "/prestige") {
    let amt = parseInt(args[1], 10) || 1;
    window.playerStats.prestigeCount += amt;
    window.playerStats.prestigePoints += amt * 3;
    if (typeof window.pushLog === "function")
      window.pushLog(
        `<span style="color:#2ecc71;">[DEV] Added ${amt} Prestiges & ${amt * 3} PP!</span>`,
      );
    if (typeof window.updateUI === "function") window.updateUI();
    if (typeof window.renderPrestigeTab === "function")
      window.renderPrestigeTab();
    if (typeof window.saveGame === "function") window.saveGame();
  } else if (mainCmd === "/keys") {
    let amt = parseInt(args[1], 10) || 8;
    window.playerStats.equipKeys += amt;
    window.playerStats.goldKeys += amt;
    window.playerStats.matKeys += amt;
    if (typeof window.addEtcDrop === "function")
      window.addEtcDrop("Gacha Key", amt);
    if (typeof window.pushLog === "function")
      window.pushLog(
        `<span style="color:#2ecc71;">[DEV] Granted +${amt} Keys!</span>`,
      );
    if (typeof window.updateUI === "function") window.updateUI();
    if (typeof window.saveGame === "function") window.saveGame();
  } else if (mainCmd === "/tokens" || mainCmd === "/missiontokens") {
    let amt = parseInt(args[1], 10) || 10;
    window.playerStats.missionTokens =
      (window.playerStats.missionTokens || 0) + amt;
    if (typeof window.pushLog === "function")
      window.pushLog(
        `<span style="color:#2ecc71;">[DEV] Granted +${amt} Mission Tokens!</span>`,
      );
    if (typeof window.updateUI === "function") window.updateUI();
    if (typeof window.renderMissionsWindow === "function")
      window.renderMissionsWindow();
    if (typeof window.saveGame === "function") window.saveGame();
  } else if (mainCmd === "/mup") {
    let upType = args[1] ? args[1].toLowerCase() : null;
    let lvl = parseInt(args[2], 10);
    if (upType && !isNaN(lvl)) {
      window.playerStats.missionUpgrades = window.playerStats
        .missionUpgrades || { gold: 0, atk: 0, hp: 0, bag: 0 };
      if (window.playerStats.missionUpgrades[upType] !== undefined) {
        window.playerStats.missionUpgrades[upType] = lvl;
        if (typeof window.pushLog === "function")
          window.pushLog(
            `<span style="color:#2ecc71;">[DEV] Set Mission Upgrade ${upType.toUpperCase()} to Level ${lvl}!</span>`,
          );
        if (typeof window.updateUI === "function") window.updateUI();
        if (typeof window.renderMissionsWindow === "function")
          window.renderMissionsWindow();
        if (typeof window.saveGame === "function") window.saveGame();
      } else {
        if (typeof window.pushLog === "function")
          window.pushLog(
            `<span style="color:#e74c3c;">[DEV] Unknown upgrade type "${upType}". Eligible: bag, gold, atk, hp</span>`,
          );
      }
    } else {
      if (typeof window.pushLog === "function")
        window.pushLog(
          `<span style="color:#e74c3c;">Usage: /mup [bag|gold|atk|hp] [level]</span>`,
        );
    }
  } else if (mainCmd === "/sack" || mainCmd === "/sacks") {
    let type = args[1] ? args[1].toLowerCase() : "all";
    let amt = parseInt(args[2], 10) || 1;
    if (type === "daily") {
      window.addUseDrop("Daily Reward Sack", amt);
      window.pushLog(
        `<span style="color:#2ecc71;">[DEV] Added +${amt} Daily Reward Sack(s)!</span>`,
      );
    } else if (type === "weekly") {
      window.addUseDrop("Guild Weekly Sack", amt);
      window.pushLog(
        `<span style="color:#2ecc71;">[DEV] Added +${amt} Guild Weekly Sack(s)!</span>`,
      );
    } else {
      window.addUseDrop("Daily Reward Sack", amt);
      window.addUseDrop("Guild Weekly Sack", amt);
      window.pushLog(
        `<span style="color:#2ecc71;">[DEV] Added +${amt} of each Guild Sack!</span>`,
      );
    }
    window.updateUI();
  } else if (
    mainCmd === "/quests" ||
    mainCmd === "/refresh" ||
    mainCmd === "/resetquests"
  ) {
    window.devRefreshQuests();
  } else if (mainCmd === "/clear") {
    window.logsHistory = [];
    let logBox = document.getElementById("log-box");
    if (logBox) logBox.innerHTML = "";
    if (typeof window.pushLog === "function")
      window.pushLog("<span style='color:#aaa;'>Logs cleared.</span>");
  } else {
    if (typeof window.pushLog === "function") {
      window.pushLog(
        `<span style="color:#e74c3c;">Unknown command. Type /dev to open full Debug GUI panel, or try: /gold, /level, /sp, /prestige, /keys, /tokens, /mup, /clear</span>`,
      );
    }
  }
};

// --- TROPHY / ACHIEVEMENT NAVIGATION ---

window.toggleAchievements = function () {
  let modal = document.getElementById("achievements-modal");
  if (!modal) return;

  // Support empty string display evaluation from stylesheets
  if (modal.style.display === "none" || modal.style.display === "") {
    window.hideTooltip();
    window.buildAchievementsModal();
    modal.style.display = "block";
    window.recalculateAchievementTotals();

    // Smooth auto-scroll to the next unviewed achievement
    if (
      window.playerStats.unviewedAchievements &&
      window.playerStats.unviewedAchievements.length > 0
    ) {
      let firstUnviewedId = window.playerStats.unviewedAchievements[0];
      setTimeout(() => {
        let cardEl = document.getElementById(`ach-card-${firstUnviewedId}`);
        if (cardEl) {
          cardEl.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 180);
    }
  } else {
    modal.style.display = "none";
    window.hideTooltip();
  }
};

window.viewAchievement = function (achId) {
  if (window.playerStats.unviewedAchievements) {
    window.playerStats.unviewedAchievements =
      window.playerStats.unviewedAchievements.filter((id) => id !== achId);
    window.updateUI();
    // Redraw card immediately to remove gold highlight on view
    let card = document.getElementById(`ach-card-${achId}`);
    if (card) {
      card.style.animation = "";
      card.style.boxShadow = "";
    }
  }
};

window.buildAchievementsModal = function () {
  let listEl = document.getElementById("achievements-list");
  if (!listEl) return;

  listEl.innerHTML = window.AchievementsData.map((ach) => {
    let unlocked =
      window.playerStats.unlockedAchievements &&
      window.playerStats.unlockedAchievements.includes(ach.id);
    let isUnviewed =
      window.playerStats.unviewedAchievements &&
      window.playerStats.unviewedAchievements.includes(ach.id);

    let borderStyle = unlocked
      ? "border-color: #f1c40f; background: rgba(241, 196, 15, 0.05); color: #fff;"
      : "border-color: #333; opacity: 0.5; filter: grayscale(100%); color: #7f8c8d;";
    let iconDisplay = unlocked ? ach.icon : "🔒";

    let glowStyle = isUnviewed
      ? "animation: glowGold 1.5s infinite; border-color: #f1c40f !important; position: relative;"
      : "position: relative;";
    let newRibbon = isUnviewed
      ? `<span class="badge-exclamation" style="position: absolute; top: -1px; right: -1px; background: #f1c40f; color: #111; font-size: 8px; font-weight: 900; padding: 2px 6px; border-radius: 0 4px 0 4px; text-transform: uppercase; box-shadow: 0 0 8px #f1c40f; letter-spacing: 0.5px;">NEW</span>`
      : "";

    return `<div id="ach-card-${ach.id}" class="bag-item" style="cursor:help; display:flex; flex-direction:row; justify-content:flex-start; align-items:center; gap:10px; ${borderStyle} ${glowStyle} padding:8px;"
            onmouseenter="window.showAchievementTooltip(event, '${ach.id}'); window.viewAchievement('${ach.id}');"
            ontouchstart="window.showAchievementTooltip(event, '${ach.id}'); window.viewAchievement('${ach.id}');"
            onmouseleave="window.hideTooltip()">
            ${newRibbon}
            <span style="font-size:22px; width:30px; text-align:center;">${iconDisplay}</span>
            <div style="flex:1; text-align:left;">
                <strong style="color:${unlocked ? "#f1c40f" : "#666"}; font-size:12px;">${ach.name}</strong>
                <div style="font-size:9px; color:#aaa; margin-top:2px; line-height:1.2;">${ach.desc}</div>
            </div>
        </div>`;
  }).join("");
};

window.showAchievementTooltip = function (e, achId) {
  e.stopPropagation();
  let ach = window.AchievementsData.find((a) => a.id === achId);
  if (!ach) return;

  let unlocked =
    window.playerStats.unlockedAchievements &&
    window.playerStats.unlockedAchievements.includes(achId);
  let tt = document.getElementById("game-tooltip");

  let statsDesc = Object.keys(ach.stats)
    .map((k) => {
      let val = ach.stats[k];
      let isPct = [
        "critChance",
        "critDamage",
        "block",
        "parry",
        "drop",
        "qly",
        "gold",
        "fairySpawn",
        "rareSpawn",
        "atkPct",
        "maxHpPct",
        "defPct",
        "moveSpeedPct",
        "strPct",
        "dexPct",
        "intPct",
        "expPct",
        "potDurationPct",
        "potStrengthPct",
        "idleSpeedPct",
        "activeSpeedPct",
      ].includes(k);
      let labelMap = {
        atk: "⚔️ Attack",
        maxHp: "❤️ Max HP",
        def: "🛡️ Defense",
        moveSpeed: "👟 Move Speed",
        critChance: "✨ Crit Chance",
        critDamage: "💥 Crit Multiplier",
        block: "🛡️ Block Rate",
        parry: "⚡ Parry Rate",
        str: "💪 STR",
        dex: "🎯 DEX",
        int: "🧠 INT",
        drop: "🍀 Drop Rate Mod",
        qly: "💎 Drop Quality Mod",
        gold: "🟡 Gold Multiplier",
        fairySpawn: "🧚 Fairy Spawn Mod",
        rareSpawn: "✨ Rare Spawn Rate",
        atkPct: "⚔️ Attack Multiplier",
        maxHpPct: "❤️ Max HP Multiplier",
        defPct: "🛡️ Defense Multiplier",
        moveSpeedPct: "👟 Move Speed Multiplier",
        strPct: "💪 STR Multiplier",
        dexPct: "🎯 DEX Multiplier",
        intPct: "🧠 INT Multiplier",
        expPct: "🧠 EXP Multiplier",
        potDurationPct: "🧪 Potion Duration",
        potStrengthPct: "🧪 Potion Potency",
        idleSpeedPct: "⏱️ Idle Speed",
        activeSpeedPct: "⚡ Active Speed",
      };
      let cleanLabel = labelMap[k] || k.toUpperCase();
      let cleanVal = isPct ? `+${(val * 100).toFixed(0)}%` : `+${val}`;
      return `<div class="tt-stat-line" style="color:#2ecc71;">• ${cleanLabel}: ${cleanVal}</div>`;
    })
    .join("");
  let progressValue = window.getAchievementProgress(ach);
  let targetValue = ach.isSingleTier ? 1 : ach.reqValue;
  let percentDone = Math.min(100, (progressValue / targetValue) * 100);

  let html = `<div style="padding: 10px; width: 230px; box-sizing: border-box;">
        <div class="tt-title" style="color:${unlocked ? "#f1c40f" : "#aaa"};">${ach.icon} ${ach.name}</div>
        <div class="tt-subtitle" style="color:${unlocked ? "#2ecc71" : "#e74c3c"}; font-weight:bold;">${unlocked ? "🔓 UNLOCKED" : "🔒 LOCKED"}</div>
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

window.navigateToAchievement = function (id) {
  let modal = document.getElementById("achievements-modal");
  if (modal && modal.style.display !== "block") {
    window.toggleAchievements();
  }
  setTimeout(() => {
    let el = document.getElementById("ach-card-" + id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
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

window.switchDevTab = function (tabId) {
  document
    .querySelectorAll(".dev-tab-content")
    .forEach((el) => (el.style.display = "none"));
  document
    .querySelectorAll(".dev-tab-btn")
    .forEach((btn) => btn.classList.remove("active"));

  let targetEl = document.getElementById(tabId);
  if (targetEl) targetEl.style.display = "block";
  let targetBtn = document.getElementById("btn-" + tabId);
  if (targetBtn) targetBtn.classList.add("active");
};

window.buildDevArchitectUI = function () {
  let container = document.getElementById("dev-architect-lines");
  if (!container) return;
  let stats = [
    { v: "atk", l: "⚔️ Attack" },
    { v: "maxHp", l: "❤️ Max HP" },
    { v: "def", l: "🛡️ Defense" },
    { v: "moveSpeed", l: "👟 Move Spd" },
    { v: "critChance", l: "✨ Crit %" },
    { v: "critDamage", l: "💥 Crit Multi" },
    { v: "block", l: "🛡️ Block %" },
    { v: "parry", l: "⚡ Parry %" },
    { v: "str", l: "💪 STR" },
    { v: "dex", l: "🎯 DEX" },
    { v: "int", l: "🧠 INT" },
    { v: "activeAttackSpeed", l: "⚡ Active Frm" },
    { v: "idleAttackSpeed", l: "⏱️ Idle Frm" },
    { v: "dropRate", l: "🍀 Drop Rate" },
    { v: "quality", l: "💎 Quality" },
    { v: "goldMulti", l: "🟡 Gold Mult" },
    { v: "rareSpawn", l: "✨ Rare Rate" },
    { v: "fairySpawn", l: "🧚 Fairy Rate" },
  ];
  let html = "";
  for (let i = 0; i < 5; i++) {
    html += `<div style="background:#1a1d20; border:1px solid #333; padding:8px; border-radius:4px; margin-bottom:4px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                <select id="dev-arch-stat-${i}" style="flex:1; background:#111; color:#fff; border:1px solid #444; font-size:10px; padding:2px;" onchange="window.updateArchitectRanges()">
                    <option value="">- Empty Slot -</option>
                    ${stats.map((s) => `<option value="${s.v}">${s.l}</option>`).join("")}
                </select>
                <span id="dev-arch-range-label-${i}" style="font-size:9px; color:#aaa; margin-left:8px; font-family:monospace;">(0 ~ 0)</span>
            </div>
            <div style="display:flex; gap:8px; align-items:center;">
                <input type="range" id="dev-arch-slider-${i}" min="0" max="0" step="any" value="0" style="flex:1; height:4px;" oninput="document.getElementById('dev-arch-val-${i}').value = this.value">
                <input type="number" id="dev-arch-val-${i}" value="0" step="any" style="width:60px; background:#111; color:#fff; border:1px solid #444; font-size:10px; padding:2px;" oninput="document.getElementById('dev-arch-slider-${i}').value = this.value">
            </div>
        </div>`;
  }
  container.innerHTML = html;
  window.updateArchitectRanges();
};

window.updateArchitectRanges = function () {
  let type = document.getElementById("dev-item-type").value;
  let rarity = parseInt(document.getElementById("dev-item-rarity").value, 10);
  let lvl = parseInt(document.getElementById("dev-item-lvl").value, 10) || 1;

  let dummyItem = {
    type: type,
    statsRolled: rarity,
    stageLevel: lvl,
    bonusAtk: 1,
    bonusMaxHp: 1,
    bonusDef: 1,
    bonusMoveSpeed: 1,
    bonusCritChance: 1,
    bonusCritDamage: 1,
    bonusBlock: 1,
    bonusParry: 1,
    bonusActiveSpeed: 1,
    bonusIdleSpeed: 1,
    bonusStr: 1,
    bonusDex: 1,
    bonusInt: 1,
    rareSpawn: 1,
    dropRate: 1,
    quality: 1,
    goldMulti: 1,
    fairySpawn: 1,
    baseAtk: 0,
    baseMaxHp: 0,
    baseDef: 0,
    baseMoveSpeed: 0,
    baseBlock: 0,
    baseParry: 0,
    baseInt: 0,
    temperLevel: 0,
  };
  if (type === "subweapon") dummyItem.subType = "shield";

  for (let i = 0; i < 5; i++) {
    let stat = document.getElementById(`dev-arch-stat-${i}`).value;
    let slider = document.getElementById(`dev-arch-slider-${i}`);
    let valInput = document.getElementById(`dev-arch-val-${i}`);
    let rangeLabel = document.getElementById(`dev-arch-range-label-${i}`);

    if (!stat) {
      slider.disabled = true;
      slider.min = 0;
      slider.max = 0;
      slider.value = 0;
      valInput.disabled = true;
      valInput.value = 0;
      rangeLabel.innerText = "(0 ~ 0)";
      continue;
    }

    slider.disabled = false;
    valInput.disabled = false;
    let range = window.getStatBaseRange(dummyItem, stat);

    if (stat === "activeAttackSpeed" || stat === "idleAttackSpeed") {
      if (range.min === 0 && range.max === 0) {
        range.min = -10;
        range.max = -1;
      }
    }

    slider.min = range.min;
    slider.max = range.max;
    let curVal = parseFloat(valInput.value);
    if (curVal < range.min) {
      valInput.value = range.min;
      slider.value = range.min;
    } else if (curVal > range.max) {
      valInput.value = range.max;
      slider.value = range.max;
    } else {
      slider.value = curVal;
    }

    let isPct = [
      "critChance",
      "critDamage",
      "block",
      "parry",
      "dropRate",
      "quality",
      "goldMulti",
      "fairySpawn",
    ].includes(stat);
    let format = (v) =>
      isPct
        ? (v * 100).toFixed(1) + "%"
        : stat === "rareSpawn"
          ? (v * 100).toFixed(2) + "%"
          : Math.round(v);
    rangeLabel.innerText = `(${format(range.min)} ~ ${format(range.max)})`;
  }
};

// ==========================================================================
// --- DEVELOPER PANEL OPERATIONS (REMOVE IN PRODUCTION) ---
// ==========================================================================

window.devSetLevel = function () {
  let el = document.getElementById("dev-level-input");
  if (!el) return;
  let val = parseInt(el.value, 10);
  if (isNaN(val) || val < 1) return;
  window.playerStats.level = val;
  window.playerStats.xp = 0;
  window.playerStats.xpReq = Math.floor(250 * Math.pow(1.2, val - 1));
  let p = window.resolvePlayerStats();
  window.playerStats.currentHp = p.maxHp;
  window.pushLog(
    `<span style='color:#e67e22;'>[DEV] Set level to ${val}</span>`,
  );
  window.updateUI();
};

window.devSetSP = function () {
  let el = document.getElementById("dev-sp-input");
  if (!el) return;
  let val = parseInt(el.value, 10);
  if (isNaN(val) || val < 0) return;
  window.playerStats.sp = val;
  if (window.draftAllocations !== null) window.draftSP = val;
  window.pushLog(`<span style='color:#e67e22;'>[DEV] Set SP to ${val}</span>`);
  window.updateUI();
};

window.devSetStage = function () {
  let el = document.getElementById("dev-stage-input");
  if (!el) return;
  let val = parseInt(el.value, 10);
  if (isNaN(val) || val < 1) return;
  window.playerStats.stage = val;
  window.mob = null;
  window.pushLog(
    `<span style='color:#e67e22;'>[DEV] Set campaign stage to ${val}</span>`,
  );
  window.updateUI();
};

window.devSetMaxStage = function () {
  let el = document.getElementById("dev-maxstage-input");
  if (!el) return;
  let val = parseInt(el.value, 10);
  if (isNaN(val) || val < 1) return;
  window.playerStats.maxStage = val;
  window.playerStats.lifetimePeakStage = Math.max(
    window.playerStats.lifetimePeakStage || 1,
    val,
  );
  window.pushLog(
    `<span style='color:#e67e22;'>[DEV] Set max stage to ${val}</span>`,
  );
  window.updateUI();
};

window.devSetPrestige = function () {
  let el = document.getElementById("dev-prestige-input");
  if (!el) return;
  let val = parseInt(el.value, 10);
  if (isNaN(val) || val < 0) return;
  window.playerStats.prestigeCount = val;
  window.pushLog(
    `<span style='color:#e67e22;'>[DEV] Set total prestige count to ${val}</span>`,
  );
  window.updateUI();
};

window.devSetPP = function () {
  let el = document.getElementById("dev-pp-input");
  if (!el) return;
  let val = parseInt(el.value, 10);
  if (isNaN(val) || val < 0) return;
  window.playerStats.prestigePoints = val;
  window.pushLog(
    `<span style='color:#e67e22;'>[DEV] Set prestige points to ${val}</span>`,
  );
  window.updateUI();
  window.renderPrestigeTab();
};

window.devAddCurrency = function (type) {
  let val = 0;
  if (type === "gold") {
    val = parseInt(document.getElementById("dev-gold-val").value, 10) || 0;
    window.playerStats.coins += val;
    window.playerStats.totalGoldEarned += val;
    window.pushLog(
      `<span style='color:#e67e22;'>[DEV] Granted +${val.toLocaleString()} Gold</span>`,
    );
  } else if (type === "luminous") {
    val = parseInt(document.getElementById("dev-luminous-val").value, 10) || 0;
    window.addEtcDrop("Luminous Soul", val);
    window.pushLog(
      `<span style='color:#e67e22;'>[DEV] Granted +${val} Luminous Souls</span>`,
    );
  } else if (type === "monster") {
    val = parseInt(document.getElementById("dev-monster-val").value, 10) || 0;
    window.addEtcDrop("Monster Soul", val);
    window.pushLog(
      `<span style='color:#e67e22;'>[DEV] Granted +${val} Monster Souls</span>`,
    );
  } else if (type === "eridium") {
    val = parseInt(document.getElementById("dev-eridium-val").value, 10) || 0;
    window.addEtcDrop("Eridium Shard", val);
    window.pushLog(
      `<span style='color:#e67e22;'>[DEV] Granted +${val} Eridium Shards</span>`,
    );
  } else if (type === "astral") {
    val = parseInt(document.getElementById("dev-astral-val").value, 10) || 0;
    window.addEtcDrop("Astral Essence", val);
    window.pushLog(
      `<span style='color:#e67e22;'>[DEV] Granted +${val} Astral Essence</span>`,
    );
  } else if (type === "catalyst") {
    val = parseInt(document.getElementById("dev-catalyst-val").value, 10) || 0;
    window.addEtcDrop("Catalyst Core", val);
    window.pushLog(
      `<span style='color:#e67e22;'>[DEV] Granted +${val} Catalyst Cores</span>`,
    );
  } else if (type === "gachakeys") {
    val = parseInt(document.getElementById("dev-gachakeys-val").value, 10) || 0;
    window.addEtcDrop("Gacha Key", val);
    window.pushLog(
      `<span style='color:#e67e22;'>[DEV] Granted +${val} Gacha Keys</span>`,
    );
  } else if (type === "pp") {
    val = parseInt(document.getElementById("dev-pp-val").value, 10) || 0;
    window.playerStats.prestigePoints += val;
    window.pushLog(
      `<span style='color:#e67e22;'>[DEV] Granted +${val} Prestige Points (PP)</span>`,
    );
    window.renderPrestigeTab();
  } else if (type === "tokens") {
    val = parseInt(document.getElementById("dev-tokens-val").value, 10) || 0;
    window.playerStats.missionTokens =
      (window.playerStats.missionTokens || 0) + val;
    window.pushLog(
      `<span style='color:#e67e22;'>[DEV] Granted +${val} Mission Tokens</span>`,
    );
    if (typeof window.renderMissionsWindow === "function")
      window.renderMissionsWindow();
  }
  window.updateUI();
};

window.devQuickSpawn = function (stars) {
  let types = [
    "weapon",
    "subweapon",
    "helmet",
    "chest",
    "leggings",
    "overall",
    "boots",
  ];
  let chosenType =
    stars === "UNIQUE"
      ? "artifact"
      : types[Math.floor(Math.random() * types.length)];
  let stageScale = Math.floor((window.playerStats.stage - 1) / 10) + 1;
  let statLines = stars === "UNIQUE" ? 3 : stars;
  let newItem = window.createItemObject(
    chosenType,
    statLines,
    stageScale,
    stars === "UNIQUE" ? 0 : stars,
  );

  if (newItem.type === "artifact") {
    window.inventory.ARTIFACT.push(newItem);
  } else {
    window.inventory.EQUIP.push(newItem);
  }

  window.pushLog(
    `<span style='color:#e67e22;'>[DEV] Spawned: ${newItem.name}</span>`,
    newItem.id,
  );
  window.updateUI();
  window.renderInventory();
  if (typeof window.renderForgeTab === "function") window.renderForgeTab();
};

window.devSpawnGear = function () {
  let type = document.getElementById("dev-item-type").value;
  let rarity = parseInt(document.getElementById("dev-item-rarity").value, 10);
  let lvl = parseInt(document.getElementById("dev-item-lvl").value, 10) || 1;
  let setOverride = document.getElementById("dev-item-set").value;
  let prestigeCount =
    parseInt(document.getElementById("dev-item-prestige").value, 10) || 0;

  let originalPrestige = window.playerStats.prestigeCount || 0;
  window.playerStats.prestigeCount = prestigeCount;

  let newItem = window.createItemObject(type, rarity, lvl, rarity);
  window.playerStats.prestigeCount = originalPrestige;

  if (setOverride) {
    newItem.setName = setOverride;
    newItem.name = window.buildProceduralName(newItem);
  }

  window.inventory.EQUIP.push(newItem);
  window.pushLog(
    `<span style='color:#e67e22;'>[DEV] Crafted Custom Gear: ${newItem.name}</span>`,
    newItem.id,
  );

  window.updateUI();
  window.renderInventory();
  if (typeof window.renderForgeTab === "function") window.renderForgeTab();
};

window.devSpawnUnique = function () {
  let uniqueId = document.getElementById("dev-unique-sel").value;
  let lvl = parseInt(document.getElementById("dev-unique-lvl").value, 10) || 1;

  let parts = uniqueId.split("-");
  let category = parts[0];
  let sub = parts[1];

  let newItem;
  if (category === "art") {
    newItem = window.createItemObject("artifact", 3, lvl, 0, [sub]);
  } else {
    newItem = window.createItemObject(category, 5, lvl, 5);
    if (sub === "staff") {
      newItem.isUniqueStaff = true;
      newItem.noun = "Phoenix Staff";
      newItem.setName = null;
      newItem.name = `🔥 Phoenix Ignition Staff (Lv. ${lvl})`;
      newItem.desc =
        "Launches penetrating fireballs that deal 25% Attack damage (3s Cooldown).";
    } else if (sub === "sword") {
      newItem.isUniqueSword = true;
      newItem.noun = "Sanguine Reaver";
      newItem.setName = null;
      newItem.name = `🩸 Crimson Sanguine Reaver (Lv. ${lvl})`;
      newItem.desc =
        "Strikes apply stacking Bleed (Max 5). Strikes at max stacks triggers Rupture, dealing 300% weapon damage and siphoning 10% Max HP.";
    } else if (sub === "singularity") {
      newItem.isUniqueSingularity = true;
      newItem.noun = "Singularity Greatsword";
      newItem.setName = null;
      newItem.name = `🌌 Void-Sovereign Greatsword (Lv. ${lvl})`;
      newItem.desc =
        "Glows for 7s every 30s. Tap during window to enter 5s Storing state, then detonates spatial collapse.";
    } else if (sub === "maelstrom") {
      newItem.isUniqueMaelstrom = true;
      newItem.noun = "Maelstrom Glaive";
      newItem.setName = null;
      newItem.name = `🌪️ Maelstrom Gale-Glaive (Lv. ${lvl})`;
      newItem.desc =
        "Overkill damage cleaves on next spawn. Critical strikes have 25% chance to project piercing gales.";
    } else if (sub === "aegis") {
      newItem.subType = "shield";
      newItem.isUniqueAegis = true;
      newItem.noun = "Void-Warped Aegis";
      newItem.setName = null;
      newItem.name = `🛡️ Void-Warped Bulwark (Lv. ${lvl})`;
      newItem.desc =
        "Blocks trigger gravity blasts scaling with Defense. Can be absorbed into Singularity vortex.";
    } else if (sub === "watch") {
      newItem.subType = "tome";
      newItem.isUniqueWatch = true;
      newItem.noun = "Chronos Pocket-Watch";
      newItem.setName = null;
      newItem.name = `⏳ Chronos Dial-Watch (Lv. ${lvl})`;
      newItem.desc =
        "Triggers 4s Temporal Fracture every 20s. Accelerates attack speeds by 15% and slows enemies by 25%.";
    } else if (sub === "chronicle") {
      newItem.subType = "tome";
      newItem.isUniqueChronicle = true;
      newItem.noun = "Chronicle of the Ascended";
      newItem.setName = null;
      newItem.name = `📖 Chronicle of past Lives (Lv. ${lvl})`;
      newItem.desc =
        "Boosts XP gain by +200% and bypasses level locks while below 75% peak level.";
    } else if (sub === "warpcore") {
      newItem.isUniqueWarpCore = true;
      newItem.noun = "Warp-Core Greaves";
      newItem.setName = null;
      newItem.name = `⚡ Warp-Core Greaves (Lv. ${lvl})`;
      newItem.desc =
        "While below 85% Peak Stage: +150% sprint speed, and kills count as 2.";
    } else if (sub === "tempest") {
      newItem.isUniqueTempest = true;
      newItem.noun = "Crown of Tempests";
      newItem.setName = null;
      newItem.name = `👑 Crown of crackling Tempests (Lv. ${lvl})`;
      newItem.desc =
        "Taking damage has 15% chance to call thunderbolt dealing 150% Attack power and stuns.";
    }
  }

  window.recalculateItemStats(newItem);
  if (newItem.type === "artifact") window.inventory.ARTIFACT.push(newItem);
  else window.inventory.EQUIP.push(newItem);

  window.pushLog(
    `<span style='color:#e67e22;'>[DEV] Spawned Unique/Artifact: ${newItem.name}</span>`,
    newItem.id,
  );
  window.updateUI();
  window.renderInventory();
  if (typeof window.renderForgeTab === "function") window.renderForgeTab();
};

window.devSpawnArchitectGear = function () {
  let type = document.getElementById("dev-item-type").value;
  let rarity = parseInt(document.getElementById("dev-item-rarity").value, 10);
  let lvl = document.getElementById("dev-item-lvl").value || 1;
  let setOverride = document.getElementById("dev-item-set").value;

  let newItem = {
    id: window.idCounter++,
    name: "",
    type: type,
    statsRolled: rarity,
    temperLevel: 0,
    stageLevel: lvl,
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
    noun: "Exo-Plate",
    setName: setOverride || null,
  };

  if (type === "subweapon") {
    newItem.subType = "shield";
  }

  let nounList = window.slotNouns[type];
  if (type === "subweapon") nounList = window.slotNouns.subweapon.shield;
  newItem.noun = nounList ? nounList[0] : "Exo-Plate";

  for (let i = 0; i < 5; i++) {
    let statKey = document.getElementById(`dev-arch-stat-${i}`).value;
    let val =
      parseFloat(document.getElementById(`dev-arch-val-${i}`).value) || 0;
    if (!statKey) continue;

    let bonusField =
      "bonus" + statKey.charAt(0).toUpperCase() + statKey.slice(1);
    if (
      statKey === "dropRate" ||
      statKey === "quality" ||
      statKey === "goldMulti" ||
      statKey === "rareSpawn" ||
      statKey === "fairySpawn"
    ) {
      newItem[statKey] = val;
    } else {
      newItem[bonusField] = val;
    }
  }

  window.recalculateItemStats(newItem);
  newItem.name = window.buildProceduralName(newItem);

  window.inventory.EQUIP.push(newItem);
  window.pushLog(
    `<span style='color:#e67e22;'>[DEV] Spawned Architect Gear: ${newItem.name}</span>`,
    newItem.id,
  );

  window.updateUI();
  window.renderInventory();
  if (typeof window.renderForgeTab === "function") window.renderForgeTab();
};

window.devTriggerBuff = function (type) {
  let duration = 36000; // 10 minutes (600 seconds * 60 frames)
  if (type === "frenzy") {
    window.playerStats.frenzyTimer = duration;
    window.pushLog(
      `<span style='color:#e67e22;'>[DEV] Triggered 10-Minute Frenzy</span>`,
    );
  } else if (type === "adrenaline") {
    window.playerStats.adrenalineTimer = duration;
    window.pushLog(
      `<span style='color:#e67e22;'>[DEV] Triggered 10-Minute Adrenaline</span>`,
    );
  } else if (type === "potions") {
    window.playerStats.atkPotionTimer = duration;
    window.playerStats.atkPotionStrength = 0.35;
    window.playerStats.hpPotionTimer = duration;
    window.playerStats.hpPotionStrength = 0.35;
    window.playerStats.defPotionTimer = duration;
    window.playerStats.defPotionStrength = 0.35;
    window.playerStats.hastePotionTimer = duration;
    window.playerStats.hastePotionStrength = 3;
    window.pushLog(
      `<span style='color:#e67e22;'>[DEV] Infused all 10-Minute Potions at Max Strength</span>`,
    );
  }
  window.updateUI();
};

window.devHealFull = function () {
  let p = window.resolvePlayerStats();
  window.playerStats.currentHp = p.maxHp;
  window.pushLog(
    `<span style='color:#2ecc71;'>[DEV] Full Healing applied. HP restored.</span>`,
  );
  window.updateUI();
};

window.devUnlockAllAchievements = function () {
  if (!window.playerStats.unlockedAchievements)
    window.playerStats.unlockedAchievements = [];
  window.AchievementsData.forEach((ach) => {
    if (!window.playerStats.unlockedAchievements.includes(ach.id)) {
      window.playerStats.unlockedAchievements.push(ach.id);
    }
  });
  window.recalculateAchievementTotals();
  let p = window.resolvePlayerStats();
  window.playerStats.currentHp = p.maxHp;
  window.pushLog(
    `<span style='color:#e67e22;'>[DEV] All achievements unlocked! Stat bonuses compounded.</span>`,
  );
  window.updateUI();
  window.renderInventory();
};

window.devToggleGodMode = function () {
  window.playerStats.godMode = !window.playerStats.godMode;
  let btn = document.getElementById("btn-dev-godmode");
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
  window.pushLog(
    `<span style='color:#e67e22;'>[DEV] God Mode (Invulnerability) ${window.playerStats.godMode ? "ON" : "OFF"}</span>`,
  );
};

// ==========================================================================
// --- INTERACTIVE DRAGGABLE WINDOW SYSTEM ---
// ==========================================================================

window.openEquipSwapWindow = function (e, slotKey) {
  if (e) {
    e.stopPropagation();
    e.preventDefault();
  }

  // Check if slot is locked by overall suit to prevent UI conflicts
  if (
    (slotKey === "chest" || slotKey === "leggings") &&
    window.equippedSlots.overall
  ) {
    if (typeof window.pushHeaderToast === "function")
      window.pushHeaderToast("🔒 Locked by Overall Suit!", "#e74c3c");
    return;
  }
  if (
    slotKey === "overall" &&
    (window.equippedSlots.chest || window.equippedSlots.leggings)
  ) {
    if (typeof window.pushHeaderToast === "function")
      window.pushHeaderToast("🔒 Locked by equipped Piece gear!", "#e74c3c");
    return;
  }

  let existingWin = document.getElementById("equip-swap-window");
  let savedLeft = null;
  let savedTop = null;
  if (existingWin) {
    savedLeft = existingWin.style.left;
    savedTop = existingWin.style.top;
    existingWin.remove();
  }

  let isArt = slotKey.startsWith("art");
  let targetType = isArt ? "artifact" : slotKey;

  // Filter unequipped inventory items that fit this exact slot
  let eligibleItems = [];
  if (isArt) {
    eligibleItems = window.inventory.ARTIFACT.filter(
      (item) => item && item.type === "artifact",
    );
  } else {
    eligibleItems = window.inventory.EQUIP.filter(
      (item) => item && item.type === targetType,
    );
  }

  let win = document.createElement("div");
  win.id = "equip-swap-window";
  win.className = "draggable-window";

  if (savedLeft !== null && savedTop !== null) {
    win.style.left = savedLeft;
    win.style.top = savedTop;
  } else {
    // Position window nicely to the left of the live stats panel
    let container = document
      .getElementById("game-container")
      .getBoundingClientRect();
    let leftOffset = e && e.clientX ? e.clientX - container.left - 145 : 35;
    let topOffset = e && e.clientY ? e.clientY - container.top - 80 : 100;

    // Clamp coordinates safely within the game-container
    if (leftOffset < 5) leftOffset = 5;
    if (topOffset < 5) topOffset = 5;
    win.style.left = leftOffset + "px";
    win.style.top = topOffset + "px";
  }

  let headerTitle = `Swap: ${slotKey.charAt(0).toUpperCase() + slotKey.slice(1)}`;
  let contentHtml = "";

  if (eligibleItems.length === 0) {
    contentHtml = `<div style="color:#666; text-align:center; padding: 25px 0; font-size:11px; font-style:italic;">No unequipped ${targetType}s found.</div>`;
  } else {
    contentHtml = eligibleItems
      .map((item) => {
        let color = window.getTierColor(item.statsRolled);
        let rating =
          item.statsRolled === "UNIQUE" ? "UNIQUE" : `${item.statsRolled}★`;
        let comparisonBadge = window.getComparisonDeltaBadge(item);

        return `
                                <div class="bag-item" style="padding:6px; margin-bottom:5px; background:#181c22; border:1px solid #333; display:flex; justify-content:space-between; align-items:center;"
                                     onmouseenter="window.showInventoryTooltip(event, ${item.id})"
                                     ontouchstart="window.showInventoryTooltip(event, ${item.id})"
                                     onmouseleave="window.hideTooltip()">
                                    <div style="text-align:left; max-width: 170px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
                                        <strong style="color:${color}; font-size:11px;">${item.name}</strong><br>
                                        <span style="font-size:9.5px; color:#aaa;">${rating} | Lv. ${item.stageLevel}</span>${comparisonBadge}
                                    </div>
                                    <button class="btn-action" style="padding:3px 8px; font-size:10px; font-weight:bold; background:var(--accent-green);" onclick="window.executeSwapItem('${slotKey}', ${item.id})">Equip</button>
                                </div>
                            `;
      })
      .join("");
  }

  win.innerHTML = `
                        <div class="draggable-header" id="equip-win-handle" style="background: linear-gradient(180deg, #181d24 0%, #0d1117 100%);">
                            <span>${headerTitle}</span>
                            <button onclick="document.getElementById('equip-swap-window').remove(); window.hideTooltip();" style="background:transparent; border:none; color:#e74c3c; font-weight:bold; cursor:pointer; font-size:11px; padding:2px;">[X]</button>
                        </div>
                        <div class="draggable-content">
                            ${contentHtml}
                        </div>
                    `;

  document.getElementById("game-container").appendChild(win);
  window.makeWindowDraggable(win, document.getElementById("equip-win-handle"));
};

window.executeSwapItem = function (slotKey, itemId) {
  let isArt = slotKey.startsWith("art");
  if (isArt) {
    let idx = window.inventory.ARTIFACT.findIndex((i) => i.id === itemId);
    if (idx !== -1) {
      let item = window.inventory.ARTIFACT[idx];
      let oldMaxHp = 100;
      if (typeof window.resolvePlayerStats === "function")
        oldMaxHp = window.resolvePlayerStats().maxHp;

      // Swap the items, returning old item to inventory
      if (window.equippedSlots[slotKey]) {
        let oldItem = window.equippedSlots[slotKey];
        delete oldItem.isEquippedSlot;
        window.inventory.ARTIFACT.push(oldItem);
      }

      window.inventory.ARTIFACT.splice(idx, 1);
      window.equippedSlots[slotKey] = item;
      item.isEquippedSlot = slotKey;

      if (typeof window.resolvePlayerStats === "function") {
        let newMaxHp = window.resolvePlayerStats().maxHp;
        window.playerStats.currentHp = Math.max(
          1,
          Math.min(
            newMaxHp,
            Math.floor((window.playerStats.currentHp / oldMaxHp) * newMaxHp),
          ),
        );
      }
    }
  } else {
    window.equipItem(itemId);
  }

  let win = document.getElementById("equip-swap-window");
  if (win) win.remove();

  if (typeof window.checkAchievements === "function")
    window.checkAchievements();
  if (typeof window.updateUI === "function") window.updateUI();
  if (typeof window.renderInventory === "function") window.renderInventory();
  if (typeof window.renderForgeTab === "function") window.renderForgeTab();
  if (typeof window.saveGame === "function") window.saveGame();
};

window.showCurrentRatesModal = function () {
  let existingWin = document.getElementById("rates-draggable-window");
  let savedLeft = null;
  let savedTop = null;
  if (existingWin) {
    savedLeft = existingWin.style.left;
    savedTop = existingWin.style.top;
    existingWin.remove();
  }

  let win = document.createElement("div");
  win.id = "rates-draggable-window";
  win.className = "draggable-window";

  if (savedLeft !== null && savedTop !== null) {
    win.style.left = savedLeft;
    win.style.top = savedTop;
  } else {
    win.style.left = "100px";
    win.style.top = "50px";
  }

  let p = window.resolvePlayerStats();
  let nowStage = window.playerStats.stage || 1;
  let campDepthQ = window.getDepthQualityMultiplier(nowStage);
  let campShardChance = 0.005 * (campDepthQ - 1.0);
  let campKeyChance = nowStage >= 50 ? 0.0003 * (campDepthQ - 1.0) : 0.0;

  let goldFloor = window.playerStats.currentDungeonStage["gold"] || 1;
  let matFloor = window.playerStats.currentDungeonStage["mat"] || 1;

  let dDepthQ = window.getDepthQualityMultiplier(matFloor);
  let dCoreChance = 0.008 * (dDepthQ - 1.0);
  let dKeyChance = 0.0005 * (dDepthQ - 1.0);
  let dShardChance = 0.0016 * (dDepthQ - 1.0);

  let cruciblePeak = window.playerStats.cruciblePeak || 1;

  // Equipment Drop Chances (Chances of rolling each star quality based on active Drop Quality stats)
  let luckMultiplier = p.qly;
  let chance5 = luckMultiplier >= 2.0 ? 0.02 * luckMultiplier : 0;
  let chance4 = luckMultiplier >= 1.5 ? 0.16 * luckMultiplier : 0;
  let chance3 = 0.8 * luckMultiplier - (chance5 + chance4);
  let chance2 = 3.2 * luckMultiplier;
  let chance1 = 11.0 * luckMultiplier;
  let chance0 = Math.max(
    0,
    100 - (chance5 + chance4 + chance3 + chance2 + chance1),
  );

  win.innerHTML = `
                        <div class="draggable-header" id="rates-win-handle" style="background: linear-gradient(180deg, #181d24 0%, #0d1117 100%);">
                            <span>📊 Live Drop Analytics</span>
                            <button onclick="document.getElementById('rates-draggable-window').remove(); window.hideTooltip();" style="background:transparent; border:none; color:#e74c3c; font-weight:bold; cursor:pointer; font-size:11px; padding:2px;">[X]</button>
                        </div>
                        <div class="draggable-content" style="max-height: 380px;">
                            <p style="font-size:10px; color:#aaa; margin: 0 0 10px 0; line-height:1.4;">
                                Drag this window anywhere. Rates adapt to your current Campaign/Dungeon progression. Hover locks to view details.
                            </p>

                            <!-- LIVE QUALITY AFFIXES CHANCES -->
                            <div style="background:#111; border:1px solid #ff007f; border-radius:4px; padding:8px; margin-bottom:8px;">
                                <div style="color:#ff007f; font-weight:bold; font-size:11px; margin-bottom:4px; border-bottom:1px solid #222; padding-bottom:3px; display:flex; justify-content:space-between;">
                                    <span>⚙️ Active Drop Quality chances</span>
                                    <span style="color:#888; font-family:monospace;">Qly: ${p.qly.toFixed(2)}x</span>
                                </div>
                                <div style="font-family:monospace; font-size:10px; display:flex; flex-direction:column; gap:2px;">
                                    <div style="display:flex; justify-content:space-between;">
                                        <span>🟥 5★ Mythic Quality:</span>
                                        <strong style="color:${chance5 > 0 ? "#e74c3c" : "#7f8c8d"};">${chance5 > 0 ? chance5.toFixed(2) + "%" : "🔒 locked (Req. 2.00x Qly)"}</strong>
                                    </div>
                                    <div style="display:flex; justify-content:space-between;">
                                        <span>🟨 4★ Legendary Quality:</span>
                                        <strong style="color:${chance4 > 0 ? "#f1c40f" : "#7f8c8d"};">${chance4 > 0 ? chance4.toFixed(2) + "%" : "🔒 locked (Req. 1.50x Qly)"}</strong>
                                    </div>
                                    <div style="display:flex; justify-content:space-between;">
                                        <span>🟧 3★ Epic Quality:</span>
                                        <strong style="color:#e67e22;">${chance3.toFixed(2)}%</strong>
                                    </div>
                                    <div style="display:flex; justify-content:space-between;">
                                        <span>🟪 2★ Magic Quality:</span>
                                        <strong style="color:#9b59b6;">${chance2.toFixed(2)}%</strong>
                                    </div>
                                    <div style="display:flex; justify-content:space-between;">
                                        <span>🟦 1★ Rare Quality:</span>
                                        <strong style="color:#3498db;">${chance1.toFixed(2)}%</strong>
                                    </div>
                                    <div style="display:flex; justify-content:space-between;">
                                        <span>⬜ 0★ Common Quality:</span>
                                        <strong style="color:#fff;">${chance0.toFixed(2)}%</strong>
                                    </div>
                                </div>
                            </div>

                            <!-- CAMPAIGN -->
                            <div style="background:#111; border:1px solid #333; border-radius:4px; padding:8px; margin-bottom:8px;">
                                <div style="color:var(--text-gold); font-weight:bold; font-size:11px; margin-bottom:4px; border-bottom:1px solid #222; padding-bottom:3px; display:flex; justify-content:space-between;">
                                    <span>🗺️ Campaign (Stage ${nowStage})</span>
                                    <span style="color:#888; font-family:monospace;">Mult: ${campDepthQ.toFixed(2)}x</span>
                                </div>
                                <div style="font-family:monospace; font-size:10px; display:flex; flex-direction:column; gap:2px;">
                                    <div style="display:flex; justify-content:space-between;">
                                        <span>🔮 Shard (Boss):</span>
                                        <strong style="color:#8e44ad;">${(campShardChance * 100).toFixed(3)}%</strong>
                                    </div>
                                    <div style="display:flex; justify-content:space-between; cursor:help; border-bottom: 1px dotted rgba(255,255,255,0.05);" onmouseenter="window.showRatesLockTooltip(event, 'camp_key')" onmouseleave="window.hideTooltip()" ontouchstart="window.showRatesLockTooltip(event, 'camp_key')">
                                        <span>🔑 Key (Boss):</span>
                                        <strong style="color:${nowStage >= 50 ? "#f1c40f" : "#7f8c8d"};">${nowStage >= 50 ? (campKeyChance * 100).toFixed(3) + "%" : "🔒 locked (Stage 50)"}</strong>
                                    </div>
                                </div>
                            </div>

                            <!-- EQUIP DUNGEON -->
                            <div style="background:#111; border:1px solid #333; border-radius:4px; padding:8px; margin-bottom:8px;">
                                <div style="color:#3498db; font-weight:bold; font-size:11px; margin-bottom:4px; border-bottom:1px solid #222; padding-bottom:3px; display:flex; justify-content:space-between;">
                                    <span>🛡️ Equip Dungeon (Floor ${window.playerStats.currentDungeonStage["equip"] || 1})</span>
                                </div>
                                <div style="font-family:monospace; font-size:10px; display:flex; flex-direction:column; gap:2px;">
                                    <div style="display:flex; justify-content:space-between;">
                                        <span>🔱 Overlord's Sigil (Boss):</span>
                                        <strong style="color:#1abc9c;">5.000%</strong>
                                    </div>
                                    <div style="display:flex; justify-content:space-between;">
                                        <span>🛡️ High Tier Equip (Boss):</span>
                                        <strong style="color:#2ecc71;">25.000%</strong>
                                    </div>
                                </div>
                            </div>

                            <!-- GOLD DUNGEON -->
                            <div style="background:#111; border:1px solid #333; border-radius:4px; padding:8px; margin-bottom:8px;">
                                <div style="color:#f1c40f; font-weight:bold; font-size:11px; margin-bottom:4px; border-bottom:1px solid #222; padding-bottom:3px; display:flex; justify-content:space-between;">
                                    <span>💰 Gold Mine (Floor ${goldFloor})</span>
                                </div>
                                <div style="font-family:monospace; font-size:10px; display:flex; flex-direction:column; gap:2px;">
                                    <div style="display:flex; justify-content:space-between;">
                                        <span>🟡 Gold Multiplier (Floor):</span>
                                        <strong style="color:#f1c40f;">x5.00</strong>
                                    </div>
                                    <div style="display:flex; justify-content:space-between;">
                                        <span>👑 Boss Gold Bonus:</span>
                                        <strong style="color:#f1c40f;">x20.00</strong>
                                    </div>
                                </div>
                            </div>

                            <!-- MATERIAL DUNGEON -->
                            <div style="background:#111; border:1px solid #333; border-radius:4px; padding:8px; margin-bottom:8px;">
                                <div style="color:#2ecc71; font-weight:bold; font-size:11px; margin-bottom:4px; border-bottom:1px solid #222; padding-bottom:3px; display:flex; justify-content:space-between;">
                                    <span>🧪 Material Pit (Floor ${matFloor})</span>
                                    <span style="color:#888; font-family:monospace;">Mult: ${dDepthQ.toFixed(2)}x</span>
                                </div>
                                <div style="font-family:monospace; font-size:10px; display:flex; flex-direction:column; gap:2px;">
                                    <div style="display:flex; justify-content:space-between; cursor:help; border-bottom: 1px dotted rgba(255,255,255,0.05);" onmouseenter="window.showRatesLockTooltip(event, 'core')" onmouseleave="window.hideTooltip()" ontouchstart="window.showRatesLockTooltip(event, 'core')">
                                        <span>🔴 Ancient Core (Boss):</span>
                                        <strong style="color:${matFloor >= 15 ? "#e74c3c" : "#7f8c8d"};">${matFloor >= 15 ? (dCoreChance * 100).toFixed(3) + "%" : "🔒 locked (Floor 15)"}</strong>
                                    </div>
                                    <div style="display:flex; justify-content:space-between; cursor:help; border-bottom: 1px dotted rgba(255,255,255,0.05);" onmouseenter="window.showRatesLockTooltip(event, 'key')" onmouseleave="window.hideTooltip()" ontouchstart="window.showRatesLockTooltip(event, 'key')">
                                        <span>🔑 Gacha Key (Boss):</span>
                                        <strong style="color:${matFloor >= 35 ? "#f1c40f" : "#7f8c8d"};">${matFloor >= 35 ? (dKeyChance * 100).toFixed(3) + "%" : "🔒 locked (Floor 35)"}</strong>
                                    </div>
                                    <div style="display:flex; justify-content:space-between; cursor:help; border-bottom: 1px dotted rgba(255,255,255,0.05);" onmouseenter="window.showRatesLockTooltip(event, 'shard')" onmouseleave="window.hideTooltip()" ontouchstart="window.showRatesLockTooltip(event, 'shard')">
                                        <span>🔮 Shard (Boss):</span>
                                        <strong style="color:${matFloor >= 60 ? "#8e44ad" : "#7f8c8d"};">${matFloor >= 60 ? (dShardChance * 100).toFixed(3) + "%" : "🔒 locked (Floor 60)"}</strong>
                                    </div>
                                </div>
                            </div>

                            <!-- CRUCIBLE -->
                            <div style="background:#111; border:1px solid #333; border-radius:4px; padding:8px; margin-bottom:8px;">
                                <div style="color:#9b59b6; font-weight:bold; font-size:11px; margin-bottom:4px; border-bottom:1px solid #222; padding-bottom:3px; display:flex; justify-content:space-between;">
                                    <span>🔮 Crucible (Peak Wave ${cruciblePeak})</span>
                                </div>
                                <div style="font-family:monospace; font-size:10px; display:flex; flex-direction:column; gap:2px;">
                                    <div style="display:flex; justify-content:space-between;">
                                        <span>🌌 Shards Per Wave (Base):</span>
                                        <strong style="color:#9b59b6;">1.50</strong>
                                    </div>
                                    <div style="display:flex; justify-content:space-between;">
                                        <span>💚 Catalyst Core Checkpoint:</span>
                                        <strong style="color:#2ecc71;">Every 10 Waves</strong>
                                    </div>
                                </div>
                            </div>

                            <!-- SPECIFIC ITEM DROP CODEX -->
                                                            <div style="background:#111; border:1px solid #333; border-radius:4px; padding:8px;">
                                                                <div style="color:#1abc9c; font-weight:bold; font-size:11px; margin-bottom:6px; border-bottom:1px solid #222; padding-bottom:3px;">
                                                                    <span>📋 Specific Item Drop Codex</span>
                                                                </div>
                                                                <div style="font-family:monospace; font-size:9px; display:flex; flex-direction:column; gap:4px; line-height: 1.35;">
                                                                    <div style="border-bottom:1px dashed #222; padding-bottom:3px;">
                                                                        <span style="color:#1abc9c; font-weight:bold;">🔱 Overlord's Sigil:</span><br>
                                                                        <span style="color:#aaa;">Source: Equip Dungeon Boss (Floor 1+)</span><br>
                                                                        <span style="color:#94a3b8;">Chance:</span> <strong style="color:#fff;">5.000%</strong>
                                                                    </div>
                                                                    <div style="border-bottom:1px dashed #222; padding-bottom:3px;">
                                                                                                                <span style="color:#e74c3c; font-weight:bold;">🔴 Ancient Core:</span><br>
                                                                                                                <span style="color:#aaa;">Source: Camp. Boss, Camp. Rare, or Mat Pit (15+)</span><br>

                                                                                                                <!-- Campaign Boss Chance -->
                                                                                                                <div style="display:flex; justify-content:space-between; cursor:help;"
                                                                                                                     onmouseenter="window.showRatesLockTooltip(event, 'camp_core_boss')"
                                                                                                                     onmouseleave="window.hideTooltip()"
                                                                                                                     ontouchstart="window.showRatesLockTooltip(event, 'camp_core_boss')">
                                                                                                                    <span style="color:#94a3b8;">Campaign Boss Chance:</span>
                                                                                                                    <strong style="color:#e74c3c;">${nowStage >= Math.floor((window.playerStats.lifetimePeakStage || 1) * 0.8) ? "1.000%" : "🔒 Locked (Low Stage)"}</strong>
                                                                                                                </div>

                                                                                                                <!-- Campaign Rare Chance -->
                                                                                                                <div style="display:flex; justify-content:space-between; cursor:help;"
                                                                                                                     onmouseenter="window.showRatesLockTooltip(event, 'camp_core_rare')"
                                                                                                                     onmouseleave="window.hideTooltip()"
                                                                                                                     ontouchstart="window.showRatesLockTooltip(event, 'camp_core_rare')">
                                                                                                                    <span style="color:#94a3b8;">Campaign Rare Chance:</span>
                                                                                                                    <strong style="color:#e74c3c;">${nowStage >= Math.floor((window.playerStats.lifetimePeakStage || 1) * 0.8) ? "0.500%" : "🔒 Locked (Low Stage)"}</strong>
                                                                                                                </div>

                                                                                                                <!-- Dungeon Chance -->
                                                                                                                <div style="display:flex; justify-content:space-between; cursor:help;"
                                                                                                                     onmouseenter="window.showRatesLockTooltip(event, 'core')"
                                                                                                                     onmouseleave="window.hideTooltip()"
                                                                                                                     ontouchstart="window.showRatesLockTooltip(event, 'core')">
                                                                                                                    <span style="color:#94a3b8;">Dungeon Boss Chance:</span>
                                                                                                                    <strong style="color:#e74c3c;">${matFloor >= 15 ? (dCoreChance * 100).toFixed(3) + "%" : "🔒 Locked (Floor 15)"}</strong>
                                                                                                                </div>
                                                                                                            </div>
                                                                    <div style="border-bottom:1px dashed #222; padding-bottom:3px;">
                                                                        <span style="color:#8e44ad; font-weight:bold;">🔮 Eridium Shard:</span><br>
                                                                        <span style="color:#aaa;">Source: Camp. Boss (18+) or Mat Pit (60+)</span><br>

                                                                        <!-- Campaign Chance Row -->
                                                                        <div style="display:flex; justify-content:space-between; cursor:help;"
                                                                             onmouseenter="window.showRatesLockTooltip(event, 'camp_shard')"
                                                                             onmouseleave="window.hideTooltip()"
                                                                             ontouchstart="window.showRatesLockTooltip(event, 'camp_shard')">
                                                                            <span style="color:#94a3b8;">Campaign Boss Chance:</span>
                                                                            <strong style="color:#8e44ad;">${nowStage >= 18 ? (campShardChance * 100).toFixed(3) + "%" : "🔒 Locked (Stage 18)"}</strong>
                                                                        </div>

                                                                        <!-- Dungeon Chance Row -->
                                                                        <div style="display:flex; justify-content:space-between; cursor:help;"
                                                                             onmouseenter="window.showRatesLockTooltip(event, 'shard')"
                                                                             onmouseleave="window.hideTooltip()"
                                                                             ontouchstart="window.showRatesLockTooltip(event, 'shard')">
                                                                            <span style="color:#94a3b8;">Dungeon Boss Chance:</span>
                                                                            <strong style="color:#8e44ad;">${matFloor >= 60 ? (dShardChance * 100).toFixed(3) + "%" : "🔒 Locked"}</strong>
                                                                        </div>
                                                                    </div>
                                                                    <div>
                                                                        <span style="color:#f1c40f; font-weight:bold;">🔑 Gacha Key:</span><br>
                                                                        <span style="color:#aaa;">Source: Camp. Boss (50+) or Mat Pit (35+)</span><br>

                                                                        <!-- Campaign Chance Row -->
                                                                        <div style="display:flex; justify-content:space-between; cursor:help;"
                                                                             onmouseenter="window.showRatesLockTooltip(event, 'camp_key')"
                                                                             onmouseleave="window.hideTooltip()"
                                                                             ontouchstart="window.showRatesLockTooltip(event, 'camp_key')">
                                                                            <span style="color:#94a3b8;">Campaign Boss Chance:</span>
                                                                            <strong style="color:#f1c40f;">${nowStage >= 50 ? (campKeyChance * 100).toFixed(3) + "%" : "🔒 Locked (Stage 50)"}</strong>
                                                                        </div>

                                                                        <!-- Dungeon Chance Row -->
                                                                        <div style="display:flex; justify-content:space-between; cursor:help;"
                                                                             onmouseenter="window.showRatesLockTooltip(event, 'key')"
                                                                             onmouseleave="window.hideTooltip()"
                                                                             ontouchstart="window.showRatesLockTooltip(event, 'key')">
                                                                            <span style="color:#94a3b8;">Dungeon Boss Chance:</span>
                                                                            <strong style="color:#f1c40f;">${matFloor >= 35 ? (dKeyChance * 100).toFixed(3) + "%" : "🔒 Locked"}</strong>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                        </div>
                    `;

  document.getElementById("game-container").appendChild(win);
  window.makeWindowDraggable(win, document.getElementById("rates-win-handle"));
};

window.showRatesLockTooltip = function (e, lockType) {
  e.stopPropagation();
  let tt = document.getElementById("game-tooltip");
  if (!tt) return;

  let title = "";
  let desc = "";
  let color = "#e74c3c";

  if (lockType === "core") {
    title = "🔴 Ancient Cores (Dungeon)";
    desc =
      "Currently locked behind <b>Material Pit Floor 15+</b>.<br><br>Once unlocked, Material Pit Bosses have a base drop chance scaled by your current dungeon depth multiplier.";
  } else if (lockType === "camp_core_boss") {
    title = "🔴 Ancient Cores (Campaign Boss)";
    let reqStage = Math.floor(
      (window.playerStats.lifetimePeakStage || 1) * 0.8,
    );
    desc = `Campaign Bosses have a flat <b>1.00%</b> chance to drop an Ancient Core.<br><br>⚠️ To prevent low-stage speed-grinding, drops are only active when farming at or above 80% of your peak stage (<b>Stage ${reqStage}+</b>).`;
  } else if (lockType === "camp_core_rare") {
    title = "🔴 Ancient Cores (Campaign Rare)";
    let reqStage = Math.floor(
      (window.playerStats.lifetimePeakStage || 1) * 0.8,
    );
    desc = `Campaign Rare Spawns have a flat <b>0.50%</b> chance to drop an Ancient Core.<br><br>⚠️ To prevent low-stage speed-grinding, drops are only active when farming at or above 80% of your peak stage (<b>Stage ${reqStage}+</b>).`;
  } else if (lockType === "camp_shard") {
    title = "🔮 Eridium Shards (Campaign)";
    desc =
      "Currently locked behind <b>Campaign Stage 18+</b>.<br><br>Once you reach Stage 18, Campaign Bosses gain a chance to drop Eridium Shards, scaling with your stage depth quality multiplier.";
  } else if (lockType === "key") {
    title = "🔑 Gacha Keys (Dungeon)";
    desc =
      "Currently locked behind <b>Material Pit Floor 35+</b>.<br><br>Allows Gacha Key drops from Material Pit Bosses to roll randomly.";
  } else if (lockType === "shard") {
    title = "🔮 Eridium Shards (Dungeon)";
    desc =
      "Currently locked behind <b>Material Pit Floor 60+</b>.<br><br>Awakens Eridium Shard drop capability from Material Pit Bosses.";
  } else if (lockType === "camp_key") {
    title = "🔑 Gacha Keys (Campaign)";
    desc =
      "Currently locked behind <b>Campaign Stage 50+</b>.<br><br>Once unlocked, Campaign Bosses have a slim chance to drop Gacha Keys, scaled by stage depth.";
  } else if (lockType === "star4") {
    title = "⭐ 4★ Quality (Legendary)";
    desc =
      "Locked behind reaching a minimum of <b>1.5x Drop Quality</b>.<br><br>Increase your Drop Quality via unique Artifacts, Prestige upgrades, or Gold upgrades.";
  } else if (lockType === "star5") {
    title = "⭐ 5★ Quality (Mythic)";
    desc =
      "Locked behind reaching a minimum of <b>2.0x Drop Quality</b>.<br><br>Awaken your character's Drop Quality stats to open access to mythic tiers.";
  }

  tt.innerHTML = `<div style="padding: 10px; width: 220px; box-sizing: border-box;">
                        <div class="tt-title" style="color:${color};">${title}</div>
                        <div style="color:#aaa; font-size:11px; white-space:normal; line-height:1.4; margin-top:6px;">${desc}</div>
                    </div>`;
  tt.style.borderColor = color;
  tt.style.display = "block";
  window.positionTooltip(e, tt);
};

window.showMissionTooltip = function (e, missionId, isWeekly) {
  if (e && e.stopPropagation) e.stopPropagation();
  let tt = document.getElementById("game-tooltip");
  if (!tt) return;

  let missions = isWeekly
    ? window.playerStats.weeklyMissions
    : window.playerStats.dailyMissions;
  if (!missions) return;
  let m = missions.find((x) => x.id === missionId);
  if (!m) return;

  let pct = (m.current / m.target) * 100;
  let color = isWeekly ? "#9b59b6" : "#2ecc71";
  let typeLabel = isWeekly ? "Weekly Board" : "Daily Board";

  let rewardText = `+${m.treatQty} ${m.treat}`;
  if (m.potionAward) {
    rewardText += ` & 3x ${m.potionAward.replace(" Elixir", "")}`;
  }

  let html = `
    <div style="padding: 10px; width: 230px; box-sizing: border-box;">
        <div class="tt-title" style="color:${color};">${typeLabel} Objective</div>
        <div style="color:#fff; font-size:11.5px; font-weight:bold; margin-bottom:6px; white-space:normal; line-height:1.45;">${m.desc}</div>
        <div style="margin-top:6px; border-top:1px dashed #444; padding-top:6px; font-family:monospace; font-size:10px; line-height:1.4;">
            <div class="tt-stat-line" style="color:#aaa;">Progress: <strong style="color:#fff;">${m.current.toLocaleString()} / ${m.target.toLocaleString()} (${Math.min(100, pct).toFixed(1)}%)</strong></div>
            <div class="tt-stat-line" style="color:#aaa;">Reward: <strong style="color:#f1c40f;">${rewardText}</strong> & <strong style="color:#2ecc71;">+1 MP</strong></div>
        </div>
    </div>
  `;

  tt.style.borderColor = color;
  tt.innerHTML = html;
  tt.style.display = "block";
  window.positionTooltip(e, tt);
};

window.showRiftRewardBreakdownTooltip = function (e, lvl) {
  if (e && e.stopPropagation) e.stopPropagation();
  let tt = document.getElementById("game-tooltip");
  if (!tt) return;

  // Track coordinates for seamless live updating
  if (e && e.clientX !== undefined) {
    window.lastRiftTooltipEvent = e;
  }

  let minStars = Math.min(5, Math.floor(lvl / 4));
  let keys = 1 + Math.floor(lvl / 10);
  let shards = 1 + Math.floor(lvl / 3);

  let coresMin = Math.floor(lvl / 5);
  let coresMax = coresMin;
  if (lvl % 5 > 0) coresMax++;

  let essenceMin = Math.floor(lvl / 6);
  let essenceMax = essenceMin;
  if (lvl % 6 > 0) essenceMax++;

  let legendary = Math.floor(lvl / 2);
  let mythic = Math.floor(lvl / 3);

  let starsName = window.getTierName(minStars);
  let starsColor = window.getTierColor(minStars);

  let html = `
    <div style="padding: 12px; width: 250px; box-sizing: border-box; font-family: sans-serif;">
        <div class="tt-title" style="color:#9b59b6; font-size:12px; font-weight:bold; margin-bottom:4px; border-bottom:1px solid #333; padding-bottom:4px;">🌌 Rift Level ${lvl} Payouts</div>
        <div class="tt-subtitle" style="margin-bottom:8px; color:#aaa; font-size:10px; font-style: italic;">Scaling reward projections for this Tier:</div>
        <div style="display:flex; flex-direction:column; gap:4px; font-size:11px; font-family: monospace;">
            <div class="tt-stat-line" style="color:#fff;">• 👑 Min Quality: <strong style="color:${starsColor};">${starsName} (${minStars}★)</strong></div>
            <div class="tt-stat-line" style="color:#fff;">• 🔑 Gacha Keys: <strong style="color:#f1c40f;">x${keys}</strong></div>
            <div class="tt-stat-line" style="color:#fff;">• 🔮 Eridium Shards: <strong style="color:#8e44ad;">x${shards}</strong></div>
            <div class="tt-stat-line" style="color:#fff;">• 🔋 Catalyst Cores: <strong style="color:#2ecc71;">x${coresMin === coresMax ? coresMin : coresMin + "-" + coresMax}</strong></div>
            <div class="tt-stat-line" style="color:#fff;">• 🌌 Astral Essence: <strong style="color:#9b59b6;">x${essenceMin === essenceMax ? essenceMin : essenceMin + "-" + essenceMax}</strong></div>
            <div class="tt-stat-line" style="color:#fff;">• 🟨 Legendary Scraps: <strong style="color:#f1c40f;">x${legendary}</strong></div>
            <div class="tt-stat-line" style="color:#fff;">• 🟥 Mythic Scraps: <strong style="color:#e74c3c;">x${mythic}</strong></div>
        </div>
        <div style="margin-top:8px; border-top:1px dashed #444; padding-top:6px; font-size:9.5px; color:#7f8c8d; line-height:1.35; white-space:normal; font-family:sans-serif;">
            Defeating this Rift Guardian guarantees equipment of the listed minimum quality or higher.
        </div>
    </div>
  `;
  tt.style.borderColor = "#9b59b6";
  tt.innerHTML = html;
  tt.style.display = "block";
  if (window.lastRiftTooltipEvent) {
    window.positionTooltip(window.lastRiftTooltipEvent, tt);
  }
};

window.makeWindowDraggable = function (el, handle) {
  let pos1 = 0,
    pos2 = 0,
    pos3 = 0,
    pos4 = 0;
  handle.onmousedown = dragMouseDown;
  handle.ontouchstart = dragTouchStart;

  function dragMouseDown(e) {
    e = e || window.event;
    e.preventDefault();
    pos3 = e.clientX;
    pos4 = e.clientY;
    document.onmouseup = closeDragElement;
    document.onmousemove = elementDrag;
  }

  function dragTouchStart(e) {
    if (e.touches.length > 0) {
      pos3 = e.touches[0].clientX;
      pos4 = e.touches[0].clientY;
      document.ontouchend = closeDragElement;
      document.ontouchmove = elementTouchDrag;
    }
  }

  function elementDrag(e) {
    e = e || window.event;
    e.preventDefault();
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;

    el.style.top = el.offsetTop - pos2 + "px";
    el.style.left = el.offsetLeft - pos1 + "px";
  }

  function elementTouchDrag(e) {
    if (e.touches.length > 0) {
      pos1 = pos3 - e.touches[0].clientX;
      pos2 = pos4 - e.touches[0].clientY;
      pos3 = e.touches[0].clientX;
      pos4 = e.touches[0].clientY;

      el.style.top = el.offsetTop - pos2 + "px";
      el.style.left = el.offsetLeft - pos1 + "px";
    }
  }

  function closeDragElement() {
    document.onmouseup = null;
    document.onmousemove = null;
    document.ontouchend = null;
    document.ontouchmove = null;
  }
};

// --- ALTAR NATIVE CAROUSEL RENDER ENGINE ---
window.altarSlideIndex = 0;

window.renderAltarTab = function () {
  let sec = document.getElementById("market-sec-altar");
  if (!sec) return;

  let isRiftActive = !!window.playerStats.activeRift;
  let activeLvl = window.playerStats.activeRiftLevel || 1;
  let selectedLvl = window.riftSelectedLevel;
  let maxLvl = (window.playerStats.highestRiftLevel || 0) + 5;
  let coresOwned = window.inventory.ETC["Ancient Core"] || 0;

  let lvlSelectorHtml = "";
  if (isRiftActive) {
    lvlSelectorHtml = `
                            <div style="background:rgba(231,76,60,0.1); border:1px dashed #e74c3c; border-radius:6px; padding:10px; margin-bottom:12px; text-align:center;">
                                <strong style="color:#e74c3c; font-size:11.5px;">⚠️ RIFT ACTIVE (LEVEL ${activeLvl})</strong><br>
                                <span style="font-size:10px; color:#aaa;">The Rift is locked. Slay or Collapse it to adjust level.</span>
                            </div>
                        `;
  } else {
    lvlSelectorHtml = `
                              <div style="background:rgba(155, 89, 182, 0.1); border:1px solid #4a154b; border-radius:6px; padding:10px; margin-bottom:12px; display:flex; justify-content:space-between; align-items:center; cursor:help;" onmouseenter="window.showRiftRewardBreakdownTooltip(event, ${selectedLvl})" onmouseleave="window.hideTooltip()" ontouchstart="window.showRiftRewardBreakdownTooltip(event, ${selectedLvl})">
                                  <div>
                                      <strong style="color:#df9ffb; font-size:11.5px; display:block;">CHOOSE RIFT TIER / LEVEL: ⓘ</strong>
                                      <span style="font-size:10px; color:#aaa;">Max Unlocked: Level ${maxLvl}</span>
                                  </div>
                                  <div style="display:flex; align-items:center; gap:6px;" onclick="event.stopPropagation();">
                                      <button class="btn-action" style="padding:4px 10px; background:#4a154b;" onclick="window.changeAltarRiftLevel(-1)">-</button>
                                      <strong style="font-size:14px; font-family:monospace; min-width:30px; text-align:center; color:#fff;">${selectedLvl}</strong>
                                      <button class="btn-action" style="padding:4px 10px; background:#4a154b;" onclick="window.changeAltarRiftLevel(1)">+</button>
                                  </div>
                              </div>
                          `;
  }

  let slidesHtml = window.riftBossesMetadata
    .map((boss, idx) => {
      let lvl = isRiftActive ? activeLvl : selectedLvl;
      let equivalentStage = 50 + lvl * 10;
      let gRate = 1.045 + (equivalentStage * 0.04) / (equivalentStage + 200);
      let rScale = Math.pow(gRate, equivalentStage);

      let hpVal = Math.floor(boss.hpMult * (60 * rScale));
      let dmgVal = Math.floor(20 * rScale * boss.dmgMult);
      let defVal = Math.floor(boss.defMult * rScale);

      let lootHtml = boss.artifacts
        .map((art) => {
          let artDetails = window.ARTIFACT_POOL.find(
            (a) => a.name === art.name,
          );
          let trait = artDetails ? artDetails.trait : art.trait;
          return `
                                                    <div class="rift-loot-icon" onmouseenter="window.showDummyArtifact(event, '${trait}')" ontouchstart="window.showDummyArtifact(event, '${trait}')" onmouseleave="window.hideTooltip()">
                                                        <span>${window.getArtifactIconHtml(trait, 28)}</span>
                                                    </div>
                                                `;
        })
        .join("");

      return `
                                                <div class="rift-slide">
                                                    <div style="text-align:center;">
                                                        <div style="margin: 8px 0;">${window.getBossIconHtml(boss.type)}</div>
                                                        <div class="rift-boss-badge" style="border-color:#9b59b6; background:rgba(155, 89, 182, 0.15); color:#df9ffb;">${boss.name}</div>
                                                        <div style="font-style:italic; font-size:10.5px; color:#aaa; margin-bottom:8px;">"${boss.title}"</div>
                                                    </div>
                                <div style="font-size:11px; color:#ddd; line-height:1.4; text-align:center; padding: 0 10px; margin-bottom:10px; min-height:34px; white-space:normal;">
                                    ${boss.desc}
                                </div>
                                <div class="rift-stats-display">
                                    <div class="rift-stat-box" style="background:rgba(15, 7, 25, 0.6); border:1px solid #4a154b;"><span>❤️ Life</span><strong>${window.formatNumber(hpVal)}</strong></div>
                                    <div class="rift-stat-box" style="background:rgba(15, 7, 25, 0.6); border:1px solid #4a154b;"><span>⚔️ Attack</span><strong>${window.formatNumber(dmgVal)}</strong></div>
                                    <div class="rift-stat-box" style="background:rgba(15, 7, 25, 0.6); border:1px solid #4a154b;"><span>🛡️ Armor</span><strong>${window.formatNumber(defVal)}</strong></div>
                                </div>
                                <div style="background:rgba(0,0,0,0.45); border:1px dashed #4a154b; padding:8px 10px; border-radius:4px; font-size:10px; line-height:1.4; text-align:left; margin-bottom:10px; white-space:normal;">
                                    <strong style="color:#e74c3c;">💡 STRATEGY:</strong> ${boss.strategy}
                                </div>
                                <div>
                                    <div style="font-size:9.5px; font-weight:bold; color:#ff007f; text-transform:uppercase; text-align:center; margin-bottom:4px; letter-spacing:0.5px;">💎 Potential Artifact Drops</div>
                                    <div class="rift-loot-preview">${lootHtml}</div>
                                </div>
                            </div>
                        `;
    })
    .join("");

  let dotsHtml = window.riftBossesMetadata
    .map(
      (b, idx) => `
                        <div class="rift-dot ${idx === window.altarSlideIndex ? "active" : ""}" onclick="window.setAltarSlide(${idx})"></div>
                    `,
    )
    .join("");

  let actionBtnHtml = "";
  if (isRiftActive) {
    let activeBossMeta =
      window.riftBossesMetadata.find(
        (b) => b.type === window.playerStats.activeRift,
      ) || window.riftBossesMetadata[0];
    actionBtnHtml = `
                            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
                                <button class="btn-action un" style="font-weight:bold; padding:12px; font-size:11.5px;" onclick="window.executeAbandonRiftConsole()">⚠️ Collapse Rift</button>
                                <button class="btn-action" style="background:#e74c3c; font-weight:bold; padding:12px; font-size:11.5px;" onclick="window.executeAltarSummon(true)">⚔️ Re-enter Fight</button>
                            </div>
                        `;
  } else {
    let canAfford = coresOwned >= 1;
    let costColor = canAfford ? "#2ecc71" : "#e74c3c";
    actionBtnHtml = `
                            <div style="display:flex; flex-direction:column; gap:8px;">
                                <div style="display:flex; justify-content:space-between; font-size:11px; color:#aaa; font-family:monospace; padding:0 4px;">
                                    <span>Cores Owned: <strong style="color:${coresOwned >= 1 ? "#2ecc71" : "#e74c3c"};">${coresOwned} / 1</strong></span>
                                    <span>Summon Cost: <strong style="color:#ff007f;">1 Core</strong></span>
                                </div>
                                <button class="btn-action" style="background:#9b59b6; width:100%; font-weight:bold; padding:12px; font-size:11.5px; letter-spacing:0.5px;" ${canAfford ? "" : 'disabled style="opacity:0.5; cursor:not-allowed;"'} onclick="window.executeAltarSummon()">🔮 COMMENCE SUMMONING</button>
                            </div>
                        `;
  }

  let highestRiftText = `🏆 Highest Rift Cleared: Level ${window.playerStats.highestRiftLevel || 0}`;

  sec.innerHTML = `
                          <div class="market-card" style="border-color: #9b59b6; background: #0d0615; text-align: left; padding: 15px; border-radius: 8px;">
                              <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #333; padding-bottom:8px; margin-bottom:10px;">
                                  <h3 style="margin:0; color:#9b59b6; font-size:14px; display:flex; align-items:center; gap:6px; width:100%; justify-content:center;">🔮 ANCIENT ALTAR</h3>
                              </div>

                              ${lvlSelectorHtml}

                            <div class="rift-carousel-container" style="margin-top: 10px; margin-bottom: 10px;">
                                            ${
                                              isRiftActive
                                                ? ""
                                                : `
                                                <button class="carousel-arrow prev" onclick="window.changeAltarSlide(-1)">◀</button>
                                                <button class="carousel-arrow next" onclick="window.changeAltarSlide(1)">▶</button>
                                            `
                                            }
                                            <div class="rift-carousel-track" id="altar-carousel-track" style="transform: translate3d(-${window.altarSlideIndex * 33.333}%, 0, 0); width: 300%;">
                                                ${slidesHtml}
                                            </div>
                                        </div>

                            ${isRiftActive ? "" : `<div class="rift-dots" style="margin-bottom: 10px;">${dotsHtml}</div>`}

                            <span id="highest-rift-cleared-text" style="display:block; font-size:10.5px; color:#f1c40f; font-weight:bold; text-align:center; margin-bottom:12px;">${highestRiftText}</span>

                            <div style="margin-top: 15px;">
                                ${actionBtnHtml}
                            </div>
                        </div>
                    `;

  // Configure Touch Drag Swipe handlers for the newly isolated Altar sub-tab
  let track = document.getElementById("altar-carousel-track");
  if (track && !isRiftActive) {
    let startX = 0,
      currentX = 0,
      isDragging = false;
    track.addEventListener(
      "touchstart",
      (e) => {
        startX = e.touches[0].clientX;
        isDragging = true;
      },
      { passive: true },
    );
    track.addEventListener(
      "touchmove",
      (e) => {
        if (!isDragging) return;
        currentX = e.touches[0].clientX;
      },
      { passive: true },
    );
    track.addEventListener("touchend", (e) => {
      if (!isDragging) return;
      isDragging = false;
      let diffX = startX - currentX;
      if (Math.abs(diffX) > 40) {
        if (diffX > 0) window.changeAltarSlide(1);
        else window.changeAltarSlide(-1);
      }
    });
  }
};

window.changeAltarRiftLevel = function (direction) {
  let maxLvl = (window.playerStats.highestRiftLevel || 0) + 5;
  let newLvl = window.riftSelectedLevel + direction;
  if (newLvl < 1) newLvl = 1;
  if (newLvl > maxLvl) newLvl = maxLvl;
  window.riftSelectedLevel = newLvl;
  window.renderAltarTab();

  let tt = document.getElementById("game-tooltip");
  if (tt && tt.style.display === "block") {
    window.showRiftRewardBreakdownTooltip(null, newLvl);
  }
};

window.changeAltarSlide = function (direction) {
  if (window.playerStats.activeRift) return;
  let newIndex = window.altarSlideIndex + direction;
  if (newIndex < 0) newIndex = window.riftBossesMetadata.length - 1;
  if (newIndex >= window.riftBossesMetadata.length) newIndex = 0;
  window.altarSlideIndex = newIndex;
  window.renderAltarTab();
};

window.setAltarSlide = function (idx) {
  if (window.playerStats.activeRift) return;
  window.altarSlideIndex = idx;
  window.renderAltarTab();
};

window.executeAltarSummon = function (isReentry = false) {
  let cores = window.inventory.ETC["Ancient Core"] || 0;
  let boss = window.riftBossesMetadata[window.altarSlideIndex];
  let lvl = isReentry
    ? window.playerStats.activeRiftLevel || 1
    : window.riftSelectedLevel;

  if (!isReentry) {
    if (cores < 1) return;
    window.inventory.ETC["Ancient Core"]--;
    if (window.inventory.ETC["Ancient Core"] === 0)
      delete window.inventory.ETC["Ancient Core"];
    window.playerStats.activeRift = boss.type;
    window.playerStats.activeRiftLevel = lvl;
  }

  let actualBossType = isReentry ? window.playerStats.activeRift : boss.type;

  window.playerStats.isBossMode = true;
  window.playerStats.isUberBoss = true;
  window.playerStats.currentUberBoss = actualBossType;
  window.playerStats.killCount = 0;
  window.playerStats.targetsRequired = 1;
  window.mob = null;

  let p = window.resolvePlayerStats();
  window.playerStats.currentHp = p.maxHp;

  if (isReentry) {
    window.pushLog(
      `<span style='color:#9b59b6; font-weight:bold;'>[RIFT SUMMON] Re-entering Level ${lvl} Rift for ${boss.name}!</span>`,
    );
  } else {
    window.pushLog(
      `<span style='color:#9b59b6; font-weight:bold;'>[RIFT SUMMON] The Altar consumes 1 Ancient Core! A Level ${lvl} Rift for ${boss.name} forms...</span>`,
    );
  }

  window.setPauseState(false);
  window.updateUI();
  window.renderAltarTab();
  window.saveGame();
};

// --- INTERACTIVE RETRO GACHA CONTROLLER ---
window.gachaActiveState = "idle";

window.openGachaModal = function () {
  let overlay = document.getElementById("gacha-modal-overlay");
  if (overlay) overlay.remove();

  window.hideTooltip();
  window.setPauseState(true);

  overlay = document.createElement("div");
  overlay.id = "gacha-modal-overlay";
  document.body.appendChild(overlay);

  window.gachaActiveState = "idle";
  window.renderGachaModal();
};

window.renderGachaModal = function () {
  let overlay = document.getElementById("gacha-modal-overlay");
  if (!overlay) return;

  let keysOwned = window.inventory.ETC["Gacha Key"] || 0;
  let pityProgress = window.playerStats.vendingPity || 0;
  let ballsColors = [
    "#e74c3c",
    "#f1c40f",
    "#3498db",
    "#9b59b6",
    "#2ecc71",
    "#e67e22",
  ];

  // Generate a realistic pile of colorful capsule balls with 6 keyframe targets for centrifugal swirl
  let ballsHtml = "";
  for (let i = 0; i < 22; i++) {
    let left = 20 + Math.random() * 240;
    let bottom = 5 + Math.random() * 30;
    let rot = Math.random() * 360;
    let col = ballsColors[Math.floor(Math.random() * ballsColors.length)];

    // Generate 6 random steps representing physical collision coordinates inside the sphere
    let tx1 = Math.random() * 240 + 20 - left;
    let ty1 = -(Math.random() * 80 + 40 - bottom);

    let tx2 = Math.random() * 240 + 20 - left;
    let ty2 = -(Math.random() * 110 + 20 - bottom);

    let tx3 = Math.random() * 240 + 20 - left;
    let ty3 = -(Math.random() * 80 + 40 - bottom);

    let tx4 = Math.random() * 240 + 20 - left;
    let ty4 = -(Math.random() * 110 + 20 - bottom);

    let tx5 = Math.random() * 240 + 20 - left;
    let ty5 = -(Math.random() * 60 + 5 - bottom);

    let tx6 = Math.random() * 240 + 20 - left;
    let ty6 = -(Math.random() * 20 + 0 - bottom);

    let animDelay = -(Math.random() * 0.8).toFixed(2);
    let animDuration = (0.7 + Math.random() * 0.4).toFixed(2);

    ballsHtml += `
                                            <div class="gacha-ball-pile" style="
                                                left: ${left}px; bottom: ${bottom}px;
                                                transform: rotate(${rot}deg);
                                                background: linear-gradient(180deg, ${col} 50%, #ffffff 50%);
                                                --tx1: ${tx1}px; --ty1: ${ty1}px;
                                                --tx2: ${tx2}px; --ty2: ${ty2}px;
                                                --tx3: ${tx3}px; --ty3: ${ty3}px;
                                                --tx4: ${tx4}px; --ty4: ${ty4}px;
                                                --tx5: ${tx5}px; --ty5: ${ty5}px;
                                                --tx6: ${tx6}px; --ty6: ${ty6}px;
                                                animation-delay: ${animDelay}s;
                                                animation-duration: ${animDuration}s;
                                            "></div>
                                        `;
  }

  overlay.innerHTML = `
                                        <div class="gacha-cabinet gacha-cabinet-enter" onanimationend="this.classList.remove('gacha-cabinet-enter')">
                                            <div style="display:flex; justify-content:space-between; align-items:center; width:100%; border-bottom:1px solid #f1c40f; padding-bottom:6px; margin-bottom:10px;">
                                                <h3 style="margin:0; color:#f1c40f; font-size:13px; letter-spacing:1px; display:flex; align-items:center; gap:6px;">🎰 ARCADE GACHAPON</h3>
                                                <button onclick="document.getElementById('gacha-modal-overlay').remove(); window.setPauseState(false); window.hideTooltip();" style="background:#222; border:1px solid #444; color:#aaa; font-weight:bold; cursor:pointer; font-size:10px; padding:3px 8px; border-radius:4px;">Close</button>
                                            </div>

                                            <!-- Capsule Globe -->
                                            <div class="gacha-globe" id="gacha-globe-element">
                                                ${ballsHtml}
                                            </div>

                                            <!-- PITY TRACKER PROGRESS -->
                                                                                        <div style="width: 100%; margin: 8px 0; background:rgba(0,0,0,0.5); border:1px solid #333; padding:8px; border-radius:6px; text-align:center;">
                                                                                            <div style="display:flex; justify-content:space-between; font-size:10px; color:#cbd5e1; font-weight:bold; margin-bottom:4px; font-family:monospace;">
                                                                                                <span id="vending-pity-text">Pity progress: ${pityProgress} / 50</span>
                                                                                                <span style="color:#e74c3c;">Guaranteed 5★ on 50</span>
                                                                                            </div>
                                                                                            <div style="width:100%; height:6px; background:#222; border-radius:3px; overflow:hidden; border:1px solid #444;">
                                                                                                <div id="vending-pity-fill" style="width:${(pityProgress / 50) * 100}%; height:100%; background:linear-gradient(90deg, #ff007f, #e74c3c); transition:width 0.3s ease;"></div>
                                                                                            </div>
                                                                                        </div>

                                            <!-- CONTROL PANEL & CRANK -->
                                            <div class="gacha-control-panel">
                                                <div style="font-size:10px; color:#aaa; margin-bottom:8px; text-transform:uppercase; letter-spacing:0.5px; font-family:monospace;">
                                                    🔑 Gacha Keys: <strong style="color:#2ecc71; font-size:12px;" id="gacha-key-count-lbl">${keysOwned}</strong>
                                                </div>

                                                <div class="gacha-crank-handle" id="gacha-crank-element" onclick="window.crankGachaMachine()">
                                                    <div class="gacha-crank-cross"></div>
                                                    <div class="gacha-crank-cross vertical"></div>
                                                </div>

                                                <div style="font-size:9.5px; color:#f1c40f; margin-top:8px; text-align:center; font-weight:bold;">
                                                    CLICK CRANK TO SPIN!
                                                </div>
                                            </div>

                                            <!-- CHUTE SLOT -->
                                            <div class="gacha-chute" id="gacha-chute-element">
                                                <!-- Dispensed capsule drops here -->
                                            </div>

                                            <div id="gacha-reward-overlay" style="display:none; margin-top:10px; width:100%;"></div>
                                        </div>
                                    `;
};

window.crankGachaMachine = function () {
  if (
    window.gachaActiveState === "spinning" ||
    window.gachaActiveState === "dispensed"
  )
    return;

  let crank = document.getElementById("gacha-crank-element");
  let globe = document.getElementById("gacha-globe-element");
  let chute = document.getElementById("gacha-chute-element");
  let cabinet = document.querySelector(".gacha-cabinet");

  // 1. Evaluate Gacha roll result first to coordinate the mechanical response
  let res = window.rollGachaCrateItem();
  if (res.error) {
    // Play jammed locking mechanical feedback sound
    window.SoundManager.play("block");

    // Trigger the partial "jammed struggle" wiggle on the dial
    if (crank) {
      crank.classList.add("crank-jammed-animate");
      setTimeout(() => {
        if (crank) crank.classList.remove("crank-jammed-animate");
      }, 600);
    }

    // Shake the entire retro cabinet container
    if (cabinet) {
      cabinet.classList.add("cabinet-rattle");
      setTimeout(() => {
        if (cabinet) cabinet.classList.remove("cabinet-rattle");
      }, 450);
    }

    window.pushHeaderToast("❌ " + res.error, "#e74c3c");
    return;
  }

  // 2. Success flow: Lock machine state and trigger full 360 spin
  let rolledItem = res.item;
  window.gachaActiveState = "spinning";

  if (crank) {
    crank.classList.add("crank-animate");
  }

  if (globe) {
    Array.from(globe.querySelectorAll(".gacha-ball-pile")).forEach((ball) => {
      ball.classList.add("ball-spinning"); // Switch on high-fidelity physics animation
    });
  }

  window.SoundManager.play("swing");

  setTimeout(() => {
    if (crank) crank.classList.remove("crank-animate");
    if (globe) {
      Array.from(globe.querySelectorAll(".gacha-ball-pile")).forEach((ball) => {
        ball.classList.remove("ball-spinning"); // Automatically let gravity settle them
      });
    }

    window.gachaActiveState = "dispensed";
    let color = window.getTierColor(rolledItem.statsRolled);

    // Render capsule drop
    if (chute) {
      chute.innerHTML = `
                                                <div class="dispensed-capsule capsule-glow" style="
                                                    background: linear-gradient(180deg, ${color} 50%, #ffffff 50%);
                                                    border: 1.5px solid #000;
                                                    color: ${color};
                                                " onclick="window.revealGachaReward(${JSON.stringify(rolledItem).replace(/"/g, "&quot;")})"></div>
                                            `;
      window.SoundManager.play("block");
    }
  }, 1000);
};

window.revealGachaReward = function (item) {
  let chute = document.getElementById("gacha-chute-element");
  let rewardOverlay = document.getElementById("gacha-reward-overlay");
  if (!rewardOverlay) return;

  if (chute) chute.innerHTML = ""; // Clear dispensed ball

  window.gachaActiveState = "idle";
  window.SoundManager.play("revive");

  let color = window.getTierColor(item.statsRolled);

  // Explode particles!
  if (window.spawnPurchaseCelebration) {
    window.spawnPurchaseCelebration("gacha", color, item.statsRolled);
  }

  // Direct items.js notifications
  window.pushLog(
    `<strong style='color:#f1c40f;'>[GACHA]</strong> Dispensed: <span style='color:${color};'>${item.name}</span>`,
    item.id,
  );
  window.pushToast(item.name, item.statsRolled, color);

  let itemCardHtml = window.generateItemCardHtml(item, null, false);

  rewardOverlay.innerHTML = `
                        <div style="background:#111; border:2px solid ${color}; border-radius:6px; padding:10px; margin-top:10px; animation: toastFadeIn 0.3s ease-out; position:relative;">
                            <div style="max-height:220px; overflow-y:auto; overscroll-behavior:contain; margin-bottom:10px;">
                                ${itemCardHtml}
                            </div>
                            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:6px;">
                                <button class="btn-action" style="background:#555; font-size:10px; padding:6px;" onclick="document.getElementById('gacha-modal-overlay').remove(); window.setPauseState(false); window.hideTooltip();">Claim & Exit</button>
                                <button class="btn-action" style="background:#2ecc71; font-size:10px; padding:6px;" onclick="window.renderGachaModal()">Spin Again</button>
                            </div>
                        </div>
                    `;
  rewardOverlay.style.display = "block";

  window.updateUI();
  window.renderInventory();
  if (typeof window.renderForgeTab === "function") window.renderForgeTab();
};

// --- MISSION CLAIM & DRAGGABLE WINDOW SYSTEM ---

window.switchMissionsTab = function (tabId) {
  window.state.missionsTab = tabId;
  window.renderMissionsWindow();
};

window.buyMissionUpgrade = function (type) {
  let p = window.playerStats;
  p.missionUpgrades = p.missionUpgrades || { gold: 0, atk: 0, hp: 0, bag: 0 };
  let curLevel = p.missionUpgrades[type] || 0;
  let cost = 5; // Flat cost of 5 for gold, atk, and hp
  if (type === "bag") {
    cost = 4 + curLevel * 3; // Scales: Lvl 0 costs 4, Lvl 1 costs 7, Lvl 2 costs 10...
  }

  if ((p.missionTokens || 0) < cost) {
    window.pushHeaderToast("❌ Insufficient Mission Tokens!", "#e74c3c");
    return;
  }

  p.missionTokens -= cost;
  p.missionUpgrades[type]++;

  let label = type === "bag" ? "Satchel" : type.toUpperCase();
  window.pushHeaderToast(
    `🎉 Upgraded Mission ${label} to Lv. ${p.missionUpgrades[type]}!`,
    "#2ecc71",
  );

  window.SoundManager.play("spell");
  window.updateUI();
  window.renderMissionsWindow();
  window.saveGame();
};

window.buyMissionItem = function (itemName, cost) {
  let p = window.playerStats;
  if ((p.missionTokens || 0) < cost) {
    window.pushHeaderToast(
      `❌ Insufficient Mission Points! Requires ${cost} MP.`,
      "#e74c3c",
    );
    return;
  }

  p.missionTokens -= cost;
  let normName = itemName.replace(/['\\’]/g, "").trim();
  if (normName === "Gacha Key") {
    window.addEtcDrop("Gacha Key", 1);
  } else if (normName === "Catalyst Core") {
    window.addEtcDrop("Catalyst Core", 1);
  } else if (normName === "Astral Essence") {
    window.addEtcDrop("Astral Essence", 1);
  } else if (normName === "Eridium Shard") {
    window.addEtcDrop("Eridium Shard", 1);
  } else if (normName === "Ancient Core") {
    window.addEtcDrop("Ancient Core", 1);
  } else if (normName === "Overlords Sigil") {
    window.addEtcDrop("Overlord's Sigil", 1);
  } else if (normName === "Double XP Elixir") {
    window.addUseDrop("Double XP Elixir", 1);
  } else if (normName === "Double Drop Elixir") {
    window.addUseDrop("Double Drop Elixir", 1);
  } else if (normName === "Drop Quality Elixir") {
    window.addUseDrop("Drop Quality Elixir", 1);
  }

  let finalName = itemName;
  if (normName === "Overlords Sigil") finalName = "Overlord's Sigil";

  window.pushHeaderToast(`🛒 Purchased ${finalName}!`, "#2ecc71");
  window.SoundManager.play("fairy");
  window.updateUI();
  window.renderMissionsWindow();
  window.saveGame();
};

window.showMissionShopUpgradeTooltip = function (e, upId) {
  e.stopPropagation();
  let tt = document.getElementById("game-tooltip");
  if (!tt) return;

  let title = "";
  let desc = "";
  let currentLevel = window.playerStats.missionUpgrades[upId] || 0;
  let color = "#2ecc71";

  if (upId === "bag") {
    title = "🎒 Dimensional Satchel";
    let cost = 4 + currentLevel * 3;
    desc = `Each upgrade level permanently expands your maximum equipment and artifact sack capacity by <strong style="color:#3498db;">+10 slots</strong>.<br><br>• Current Level: <strong style="color:#fff;">Lv. ${currentLevel} (+${currentLevel * 10} Slots)</strong><br>• Cost: <strong style="color:#f1c40f;">${cost} MP</strong>`;
    color = "#3498db";
  } else if (upId === "gold") {
    title = "💰 Midas Training";
    desc = `Permanently increases your Global Gold Multiplier by <strong style="color:#f1c40f;">+5%</strong>.<br><br>• Current Level: <strong style="color:#fff;">Lv. ${currentLevel} (+${currentLevel * 5}%)</strong><br>• Cost: <strong style="color:#f1c40f;">5 MP</strong>`;
    color = "#f1c40f";
  } else if (upId === "atk") {
    title = "⚔️ Gladiator Mastery";
    desc = `Permanently increases your Global Attack Power by <strong style="color:#e74c3c;">+2%</strong>.<br><br>• Current Level: <strong style="color:#fff;">Lv. ${currentLevel} (+${currentLevel * 2}%)</strong><br>• Cost: <strong style="color:#f1c40f;">5 MP</strong>`;
    color = "#e74c3c";
  } else if (upId === "hp") {
    title = "❤️ Iron Constitution";
    desc = `Permanently increases your Global Max HP by <strong style="color:#3498db;">+3%</strong>.<br><br>• Current Level: <strong style="color:#fff;">Lv. ${currentLevel} (+${currentLevel * 3}%)</strong><br>• Cost: <strong style="color:#f1c40f;">5 MP</strong>`;
    color = "#3498db";
  }

  tt.innerHTML = `
    <div style="padding: 10px; width: 220px; box-sizing: border-box;">
        <div class="tt-title" style="color:${color};">${title}</div>
        <div style="color:#aaa; font-size:11px; white-space:normal; line-height:1.4; margin-top:6px;">${desc}</div>
    </div>
  `;
  tt.style.borderColor = color;
  tt.style.display = "block";
  window.positionTooltip(e, tt);
};

window.showMissionShopItemTooltip = function (e, itemName) {
  e.stopPropagation();
  let tt = document.getElementById("game-tooltip");
  if (!tt) return;

  let desc = "";
  let color = "#bdc3c7";
  let cost = 0;

  // Immunize tooltip from quote-escaping browser quirks
  let normalizedName = itemName.replace(/['\\’]/g, "").trim();

  if (normalizedName === "Eridium Shard") {
    desc =
      "A glowing, alien fragment used in the Forge to Tier Up an item's Star Rarity.";
    color = "#8e44ad";
    cost = 4;
  } else if (normalizedName === "Ancient Core") {
    desc = "Sacrifice at the Altar to summon a Guardian.";
    color = "#e74c3c";
    cost = 2;
  } else if (normalizedName === "Overlords Sigil") {
    desc = "Material required to temper Unique Artifacts at the Forge.";
    color = "#1abc9c";
    cost = 6;
  } else if (normalizedName === "Gacha Key") {
    desc =
      "Used at the Vending Machine to dispense a guaranteed random equipment piece.";
    color = "#f1c40f";
    cost = 4;
  } else if (normalizedName === "Catalyst Core") {
    desc =
      "Spent at the Forge to re-roll and lock select weapon and armor attributes.";
    color = "#2ecc71";
    cost = 3;
  } else if (normalizedName === "Astral Essence") {
    desc =
      "A pulsing, cosmic residue extracted by salvaging Unique Artifacts. Spent at the Forge to imbed powerful enchantments.";
    color = "#9b59b6";
    cost = 4;
  } else if (normalizedName === "Double XP Elixir") {
    desc =
      "Doubles all acquired experience gains (+100% EXP) for 5 minutes (scales with INT).";
    color = "#a855f7";
    cost = 3;
  } else if (normalizedName === "Double Drop Elixir") {
    desc =
      "Doubles current drop rate multiplier (+100%) for 5 minutes (scales with INT).";
    color = "#2ecc71";
    cost = 4;
  } else if (normalizedName === "Drop Quality Elixir") {
    desc =
      "Boosts item drop quality checks by +50% for 5 minutes (scales with INT).";
    color = "#3b82f6";
    cost = 5;
  }

  // Preserve correct format strings for UI outputs
  let finalName = itemName;
  if (normalizedName === "Overlords Sigil") finalName = "Overlord's Sigil";

  let iconHtml = finalName.includes("Elixir")
    ? window.getUseIconHtml(finalName)
    : window.getEtcIconHtml(finalName);
  iconHtml = iconHtml.replace("margin-right: 12px;", "margin-right: 8px;");

  tt.innerHTML = `
    <div style="padding: 10px; width: 220px; box-sizing: border-box;">
        <div class="tt-title" style="color:${color}; display:flex; align-items:center; gap:8px;">${iconHtml}<span>${finalName}</span></div>
        <div style="color:#aaa; font-size:11px; white-space:normal; line-height:1.4; margin-top:8px;">
            ${desc}<br><br>
            • Cost: <strong style="color:#f1c40f;">${cost} MP</strong><br>
            • Owned: <strong style="color:#fff;">${(window.inventory.ETC[finalName] || window.inventory.USE[finalName] || 0).toLocaleString()}</strong>
        </div>
    </div>
  `;
  tt.style.borderColor = color;
  tt.style.display = "block";
  window.positionTooltip(e, tt);
};

window.claimMissionReward = function (missionId, isWeekly = false) {
  let missions = isWeekly
    ? window.playerStats.weeklyMissions
    : window.playerStats.dailyMissions;
  if (!missions) return;
  let m = missions.find((x) => x.id === missionId);
  if (!m || !m.completed || m.claimed) return;

  m.claimed = true;

  if (typeof window.addEtcDrop === "function") {
    if (m.treat === "Gold") {
      window.playerStats.coins += m.treatQty;
    } else if (m.treat === "Epic Gear Piece") {
      let activeStage = window.playerStats.stage || 1;
      let scale = Math.floor((activeStage - 1) / 10) + 1;
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
      let newItem = window.createItemObject(chosenType, 3, scale, 3);
      window.inventory.EQUIP.push(newItem);
      if (typeof window.pushLog === "function")
        window.pushLog(
          `<strong style="color:#e67e22;">[MISSION]</strong> Received guaranteed Epic reward: <span style="color:${window.getTierColor(3)};">${newItem.name}</span>!`,
        );
    } else if (window.useDex && window.useDex[m.treat]) {
      if (typeof window.addUseDrop === "function")
        window.addUseDrop(m.treat, m.treatQty);
    } else {
      window.addEtcDrop(m.treat, m.treatQty);
    }

    if (m.potionAward) {
      if (typeof window.addUseDrop === "function")
        window.addUseDrop(m.potionAward, 3);
      if (typeof window.pushLog === "function")
        window.pushLog(
          `<strong style="color:#2ecc71;">[MISSION]</strong> Received extra potion stash: 3x ${m.potionAward}!`,
        );
    }
  }

  if (typeof window.pushHeaderToast === "function") {
    let textLabel = m.potionAward
      ? `${m.treatQty}x ${m.treat} & 3x ${m.potionAward}`
      : `${m.treatQty}x ${m.treat}`;
    window.pushHeaderToast(
      `🎁 Claimed: ${textLabel} & +1 Mission Token!`,
      "#2ecc71",
    );
  }

  if (window.SoundManager) window.SoundManager.play("fairy");

  window.updateUI();
  window.renderMissionsWindow();
};

window.claimMasterMissionReward = function (isWeekly = false) {
  let missions = isWeekly
    ? window.playerStats.weeklyMissions
    : window.playerStats.dailyMissions;
  if (!missions) return;

  let alreadyClaimed = isWeekly
    ? window.playerStats.weeklyRewardClaimed
    : window.playerStats.dailyRewardClaimed;
  if (alreadyClaimed) return;

  let completedCount = missions.filter((m) => m.completed).length;
  let requiredCount = isWeekly ? 3 : 5; // 3/3 for Weekly board, 5/6 for Daily board

  if (completedCount < requiredCount) return;

  if (isWeekly) {
    window.playerStats.weeklyRewardClaimed = true;

    // Award 10 Mission Tokens for Weekly Board completion
    window.playerStats.missionTokens =
      (window.playerStats.missionTokens || 0) + 10;

    let scalingPP = 2 + Math.floor(window.playerStats.prestigeCount / 5);
    window.playerStats.prestigePoints += scalingPP;
    window.addEtcDrop("Gacha Key", 3);
    window.addEtcDrop("Catalyst Core", 1);

    let activeStage = window.playerStats.stage || 1;
    let scale = Math.floor((activeStage - 1) / 10) + 1;
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
    let minStars = Math.random() < 0.2 ? 5 : 4;
    let grandItem = window.createItemObject(
      chosenType,
      minStars,
      scale,
      minStars,
    );
    window.inventory.EQUIP.push(grandItem);

    if (typeof window.pushLog === "function")
      window.pushLog(
        `<strong style="color:#f1c40f;">🏆 [MISSION BOARD] Beaten Weekly Board! Earned +${scalingPP} PP, Gacha Keys, 10x Mission Tokens, and ${grandItem.name}!</strong>`,
      );
  } else {
    window.playerStats.dailyRewardClaimed = true;

    // Award 3 Mission Tokens for Daily Board completion
    window.playerStats.missionTokens =
      (window.playerStats.missionTokens || 0) + 3;

    window.addEtcDrop("Gacha Key", 1);
    window.addEtcDrop("Catalyst Core", 1);
    window.addEtcDrop("Eridium Shard", 2);
  }

  if (window.SoundManager) window.SoundManager.play("revive");

  window.updateUI();
  window.renderMissionsWindow();
};

window.toggleMissions = function () {
  let modal = document.getElementById("missions-draggable-window");
  if (modal) {
    modal.remove();
    window.hideTooltip();
  } else {
    window.hideTooltip();
    window.checkAndResetMissions();
    window.state.missionsTab = "BOARD";

    let win = document.createElement("div");
    win.id = "missions-draggable-window";
    win.className = "draggable-window";
    win.style.left = "80px";
    win.style.top = "60px";

    // Structural division keeping drag handles completely separate from live content
    win.innerHTML = `
      <div class="draggable-header" id="missions-win-handle" style="background: linear-gradient(180deg, #181d24 0%, #0d1117 100%);">
          <span> Guild Board & Shop</span>
          <button onclick="document.getElementById('missions-draggable-window').remove(); window.hideTooltip();" style="background:transparent; border:none; color:#e74c3c; font-weight:bold; cursor:pointer; font-size:11px; padding:2px;">[X]</button>
      </div>
      <div class="draggable-content" id="missions-win-content" style="max-height: 400px; padding: 12px; background:#07030b;">
          <!-- Live sub-tab content injected dynamically below -->
      </div>
    `;

    document.getElementById("game-container").appendChild(win);
    window.renderMissionsWindow();
    window.makeWindowDraggable(
      win,
      document.getElementById("missions-win-handle"),
    );
  }
};

window.renderMissionsWindow = function () {
  let contentEl = document.getElementById("missions-win-content");
  if (!contentEl) return;

  let currentTab = window.state.missionsTab || "BOARD";
  let tokenBalance = window.playerStats.missionTokens || 0;

  let tabHeaderHtml = `
                                        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:6px; margin-bottom:12px; padding:0 2px;">
                                            <button onclick="window.switchMissionsTab('BOARD')" class="sub-tab-btn ${currentTab === "BOARD" ? "active" : ""}" style="padding:6px; font-weight:bold; font-size:10.5px;">📋 Guild Board</button>
                                            <button onclick="window.switchMissionsTab('SHOP')" class="sub-tab-btn ${currentTab === "SHOP" ? "active" : ""}" style="padding:6px; font-weight:bold; font-size:10.5px;">🏪 Mission Shop</button>
                                        </div>
                                    `;

  let contentHtml = "";

  if (currentTab === "BOARD") {
    let dailies = window.playerStats.dailyMissions || [];
    let weeklies = window.playerStats.weeklyMissions || [];

    let dailyDoneCount = dailies.filter((m) => m.completed).length;
    let weeklyDoneCount = weeklies.filter((m) => m.completed).length;

    let dailyMasterClaimed = window.playerStats.dailyRewardClaimed;
    let weeklyMasterClaimed = window.playerStats.weeklyRewardClaimed;

    let getMissionRowHtml = (m, isWeekly) => {
      let pct = (m.current / m.target) * 100;
      let btnHtml = "";
      let rerollBtnHtml = "";

      if (m.claimed) {
        btnHtml = `<span style="color:#7f8c8d; font-size:10px; font-weight:bold;">Claimed ✓</span>`;
      } else if (m.completed) {
        btnHtml = `<button class="btn-action" style="padding:2px 8px; font-size:10px; background:#2ecc71; color:white;" onclick="window.claimMissionReward('${m.id}', ${isWeekly})">Claim</button>`;
      } else {
        btnHtml = `<span style="color:#888; font-size:10px; font-family:monospace;">${m.current.toLocaleString()}/${m.target.toLocaleString()}</span>`;

        // Dynamic single-mission Re-roll system
        if (!isWeekly) {
          let rerollsDone = window.playerStats.dailyRerollsDone || 0;
          if (rerollsDone < 2) {
            let costLabel = rerollsDone === 0 ? "🔄 Free" : "🔄 50 Souls";
            rerollBtnHtml = `<button onclick="window.rerollDailyMission('${m.id}')" class="btn-action" style="padding:2px 5px; font-size:8.5px; margin-left:6px; background:#4b5563; font-family:monospace; line-height:1;" title="Re-roll Daily Mission (${rerollsDone === 0 ? "Free" : "Costs 50 Monster Souls"})">${costLabel}</button>`;
          }
        }
      }

      let rewardText = `+${m.treatQty} ${m.treat}`;
      if (m.potionAward) {
        rewardText += ` & 3x ${m.potionAward.replace(" Elixir", "")}`;
      }

      return `
                                                                                            <div style="background:#111; border:1px solid #2d3748; border-radius:6px; padding:8px; margin-bottom:6px; display:flex; flex-direction:column; gap:4px;">
                                                                                                <div style="display:flex; justify-content:space-between; align-items:center;">
                                                                                                    <strong style="font-size:11px; color:#fff; display:block; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; max-width:160px; cursor:help;" onmouseenter="window.showMissionTooltip(event, '${m.id}', ${isWeekly})" ontouchstart="window.showMissionTooltip(event, '${m.id}', ${isWeekly})" onmouseleave="window.hideTooltip()">${m.desc}</strong>
                                                                                                    <div style="display:flex; align-items:center;">${btnHtml}${rerollBtnHtml}</div>
                                                                                                </div>
                                                                                                <div style="display:flex; justify-content:space-between; align-items:center; font-size:9.5px; color:#aaa; margin-top:2px;">
                                                                                                    <span>Reward: <span style="color:#f1c40f;">${rewardText}</span></span>
                                                                                                </div>
                                                                                                <div style="width:100%; height:4px; background:#222; border-radius:2px; overflow:hidden; border:1px solid #333; margin-top:2px;">
                                                                                                    <div style="width:${pct}%; height:100%; background:${isWeekly ? "#9b59b6" : "#2ecc71"};"></div>
                                                                                                </div>
                                                                                            </div>
                                                                                        `;
    };

    let dailyMasterBtnHtml = "";
    if (dailyMasterClaimed) {
      dailyMasterBtnHtml = `<button class="btn-action" style="background:#333; color:#777; width:100%; font-size:10.5px; cursor:not-allowed;" disabled>Grand Treat Claimed ✓</button>`;
    } else if (dailyDoneCount >= 5) {
      dailyMasterBtnHtml = `<button class="btn-action btn-pulse" style="width:100%; font-size:10.5px;" onclick="window.claimMasterMissionReward(false)">🎁 Claim Daily Grand Treat!</button>`;
    } else {
      dailyMasterBtnHtml = `<button class="btn-action" style="background:#222; color:#555; border:1px solid #333; width:100%; font-size:10.5px; cursor:not-allowed;" disabled>Complete at least 5 (${dailyDoneCount}/5)</button>`;
    }

    let weeklyMasterBtnHtml = "";
    let scalingPPText = 2 + Math.floor(window.playerStats.prestigeCount / 5);
    if (window.playerStats.prestigeCount === 0) {
      weeklyMasterBtnHtml = `
                                                <div style="background:rgba(231,76,60,0.08); border:1px dashed #e74c3c; border-radius:6px; padding:10px; text-align:center; color:#e74c3c; font-size:10.5px; font-weight:bold; width:100%;">
                                                    🔒 Weekly Board unlocks after your first Ascension at the Altar of Ascension.
                                                </div>
                                            `;
    } else {
      if (weeklyMasterClaimed) {
        weeklyMasterBtnHtml = `<button class="btn-action" style="background:#333; color:#777; width:100%; font-size:10.5px; cursor:not-allowed;" disabled>Grand Treat Claimed ✓</button>`;
      } else if (weeklyDoneCount === 3) {
        weeklyMasterBtnHtml = `<button class="btn-action btn-pulse" style="width:100%; font-size:10.5px; background:#9b59b6; border-color:#8e44ad;" onclick="window.claimMasterMissionReward(true)">🎁 Claim Weekly Grand Treat!</button>`;
      } else {
        weeklyMasterBtnHtml = `<button class="btn-action" style="background:#222; color:#555; border:1px solid #333; width:100%; font-size:10.5px; cursor:not-allowed;" disabled>Complete all 3 (${weeklyDoneCount}/3)</button>`;
      }
    }

    let weekliesCardHtml = "";
    if (window.playerStats.prestigeCount === 0) {
      weekliesCardHtml = `
                                                <div style="border:1px solid #444; border-radius:6px; padding:12px; background:rgba(0,0,0,0.4); text-align:center; color:#aaa; font-size:11px; font-style:italic;">
                                                    Weekly board locked until Ascension. Slay Hooktail to claim your destiny.
                                                </div>
                                            `;
    } else {
      weekliesCardHtml = `
                                                <div style="border:1px solid #9b59b6; border-radius:6px; padding:10px; background:rgba(155,89,182,0.03);">
                                                    <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #9b59b6; padding-bottom:4px; margin-bottom:8px;">
                                                        <strong style="color:#9b59b6; font-size:12px; text-transform:uppercase;">📆 Weekly Objectives</strong>
                                                        <span style="font-size:9.5px; color:#aaa; font-family:monospace;" id="weekly-timer-val">Refreshing...</span>
                                                    </div>
                                                    <div>
                                                        ${weeklies.map((m) => getMissionRowHtml(m, true)).join("")}
                                                    </div>
                                                    <div style="margin-top:10px;">
                                                        ${weeklyMasterBtnHtml}
                                                        ${weeklyMasterClaimed ? "" : `<div style="font-size:9px; color:#aaa; text-align:center; margin-top:4px;">Grand treat: +${scalingPPText} PP (scales with prestiges), 3x Gacha Keys, 1x Catalyst Core, and a high-tier guaranteed Gear Drop!</div>`}
                                                    </div>
                                                </div>
                                            `;
    }

    contentHtml = `
                                            <!-- DAILY MISSIONS PANEL -->
                                            <div style="border:1px solid #2ecc71; border-radius:6px; padding:10px; background:rgba(46,204,113,0.03); margin-bottom:12px;">
                                                <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #2ecc71; padding-bottom:4px; margin-bottom:8px;">
                                                    <strong style="color:#2ecc71; font-size:12px; text-transform:uppercase;">📅 Daily Objectives</strong>
                                                    <span style="font-size:9.5px; color:#aaa; font-family:monospace;" id="daily-timer-val">Refreshing...</span>
                                                </div>
                                                <div>
                                                    ${dailies.map((m) => getMissionRowHtml(m, false)).join("")}
                                                </div>
                                                <div style="margin-top:10px;">
                                                                                                    ${dailyMasterBtnHtml}
                                                                                                    ${dailyMasterClaimed ? "" : `<div style="font-size:9px; color:#aaa; text-align:center; margin-top:4px;">Grand treat: 1x Gacha Key, 1x Catalyst Core, 2x Eridium Shards (Only requires 5/6 completed!)</div>`}
                                                                                                </div>
                                                                                            </div>

                                            <!-- WEEKLY MISSIONS PANEL -->
                                            ${weekliesCardHtml}
                                        `;
  } else {
    // MISSION SHOP LAYOUT
    let p = window.playerStats;
    p.missionUpgrades = p.missionUpgrades || { gold: 0, atk: 0, hp: 0 };

    let lvlGold = p.missionUpgrades.gold || 0;
    let costGold = 5; // Flat cost
    let canAffordGold = tokenBalance >= costGold;

    let lvlAtk = p.missionUpgrades.atk || 0;
    let costAtk = 5; // Flat cost (down from 8)
    let canAffordAtk = tokenBalance >= costAtk;

    let lvlHp = p.missionUpgrades.hp || 0;
    let costHp = 5; // Flat cost (down from 8)
    let canAffordHp = tokenBalance >= costHp;

    let lvlBag = p.missionUpgrades.bag || 0;
    let costBag = 4 + lvlBag * 3; // Scaling cost: 4, 7, 10, 13...
    let canAffordBag = tokenBalance >= costBag;

    contentHtml = `
                                                                                <div style="display:flex; flex-direction:column; gap:8px;">
                                                                                    <div style="background:#111; border:1px solid #2ecc71; border-radius:6px; padding:10px;">
                                                                                        <strong style="color:#2ecc71; font-size:12px; display:block; margin-bottom:4px;">🎖️ PERMANENT GUILD UPGRADES</strong>
                                                                                        <span style="font-size:9.5px; color:#aaa; display:block; margin-bottom:8px; line-height:1.4;">These bonuses persist permanently and are NOT reset upon Prestige Ascension.</span>

                                                                                        <!-- Bag Space Upgrade -->
                                                                                                                                                                                <div class="shop-row" style="background:#07030b; border:1px solid #333; padding:8px; border-radius:4px; margin-bottom:6px; display:flex; justify-content:space-between; align-items:center; cursor:help;"
                                                                                                                                                                                     onmouseenter="window.showMissionShopUpgradeTooltip(event, 'bag')"
                                                                                                                                                                                     ontouchstart="window.showMissionShopUpgradeTooltip(event, 'bag')"
                                                                                                                                                                                     onmouseleave="window.hideTooltip()">
                                                                                                                                                                                    <div>
                                                                                                                                                                                        <strong style="color:#3498db; font-size:11px;">Dimensional Satchel</strong>
                                                                                                                                                                                        <div style="font-size:9px; color:#aaa;">+10 permanent equipment and artifact slots</div>
                                                                                                                                                                                        <span style="font-size:9.5px; color:#2ecc71; font-weight:bold;">Lv. ${lvlBag} (Current: +${lvlBag * 10} slots)</span>
                                                                                                                                                                                    </div>
                                                                                                                                                                                    <button class="btn-action" style="background:#3498db; color:#fff; font-size:10px; padding:4px 8px;" ${canAffordBag ? "" : 'disabled style="opacity:0.5;"'} onclick="window.buyMissionUpgrade('bag')">
                                                                                                                                                                                        Cost: ${costBag}
                                                                                                                                                                                    </button>
                                                                                                                                                                                </div>

                                                                                                                                                                                <!-- Gold % Upgrade -->
                                                                                                                                                                                <div class="shop-row" style="background:#07030b; border:1px solid #333; padding:8px; border-radius:4px; margin-bottom:6px; display:flex; justify-content:space-between; align-items:center; cursor:help;"
                                                                                                                                                                                     onmouseenter="window.showMissionShopUpgradeTooltip(event, 'gold')"
                                                                                                                                                                                     ontouchstart="window.showMissionShopUpgradeTooltip(event, 'gold')"
                                                                                                                                                                                     onmouseleave="window.hideTooltip()">
                                                                                                                                                                                    <div>
                                                                                                                                                                                        <strong style="color:#f1c40f; font-size:11px;">Midas Training</strong>
                                                                                                                                                                                        <div style="font-size:9px; color:#aaa;">+5% permanent Gold Multiplier</div>
                                                                                                                                                                                        <span style="font-size:9.5px; color:#2ecc71; font-weight:bold;">Lv. ${lvlGold} (Current: +${lvlGold * 5}%)</span>
                                                                                                                                                                                    </div>
                                                                                                                                                                                    <button class="btn-action" style="background:#f1c40f; color:#000; font-size:10px; padding:4px 8px;" ${canAffordGold ? "" : 'disabled style="opacity:0.5;"'} onclick="window.buyMissionUpgrade('gold')">
                                                                                                                                                                                        Cost: ${costGold}
                                                                                                                                                                                    </button>
                                                                                                                                                                                </div>

                                                                                                                                            <!-- Attack % Upgrade -->
                                                                                                                                            <div class="shop-row" style="background:#07030b; border:1px solid #333; padding:8px; border-radius:4px; margin-bottom:6px; display:flex; justify-content:space-between; align-items:center; cursor:help;"
                                                                                                                                                 onmouseenter="window.showMissionShopUpgradeTooltip(event, 'atk')"
                                                                                                                                                 ontouchstart="window.showMissionShopUpgradeTooltip(event, 'atk')"
                                                                                                                                                 onmouseleave="window.hideTooltip()">
                                                                                                                                                <div>
                                                                                                                                                    <strong style="color:#e74c3c; font-size:11px;">Gladiator Mastery</strong>
                                                                                                                                                    <div style="font-size:9px; color:#aaa;">+2% permanent Attack power</div>
                                                                                                                                                    <span style="font-size:9.5px; color:#2ecc71; font-weight:bold;">Lv. ${lvlAtk} (Current: +${lvlAtk * 2}%)</span>
                                                                                                                                                </div>
                                                                                                                                                <button class="btn-action" style="background:#e74c3c; color:#fff; font-size:10px; padding:4px 8px;" ${canAffordAtk ? "" : 'disabled style="opacity:0.5;"'} onclick="window.buyMissionUpgrade('atk')">
                                                                                                                                                    Cost: ${costAtk}
                                                                                                                                                </button>
                                                                                                                                            </div>

                                                                                                                                            <!-- HP % Upgrade -->
                                                                                                                                            <div class="shop-row" style="background:#07030b; border:1px solid #333; padding:8px; border-radius:4px; display:flex; justify-content:space-between; align-items:center; cursor:help;"
                                                                                                                                                 onmouseenter="window.showMissionShopUpgradeTooltip(event, 'hp')"
                                                                                                                                                 ontouchstart="window.showMissionShopUpgradeTooltip(event, 'hp')"
                                                                                                                                                 onmouseleave="window.hideTooltip()">
                                                                                                                                                <div>
                                                                                                                                                    <strong style="color:#3498db; font-size:11px;">Iron Constitution</strong>
                                                                                                                                                    <div style="font-size:9px; color:#aaa;">+3% permanent Max HP</div>
                                                                                                                                                    <span style="font-size:9.5px; color:#2ecc71; font-weight:bold;">Lv. ${lvlHp} (Current: +${lvlHp * 3}%)</span>
                                                                                                                                                </div>
                                                                                                                                                <button class="btn-action" style="background:#3498db; color:#fff; font-size:10px; padding:4px 8px;" ${canAffordHp ? "" : 'disabled style="opacity:0.5;"'} onclick="window.buyMissionUpgrade('hp')">
                                                                                                                                                    Cost: ${costHp}
                                                                                                                                                </button>
                                                                                                                                            </div>
                                                                                                                                        </div>

                                                                                                                                        <div style="background:#111; border:1px solid #3498db; border-radius:6px; padding:10px;">
                                                                                                                                                                                            <strong style="color:#3498db; font-size:12px; display:block; margin-bottom:8px;">💎 CONSUMABLES & REAGENTS</strong>

                                                                                                                                                                                            <!-- Eridium Shard -->
                                                                                                                                                                                            <div class="shop-row" style="background:#07030b; border: 1px solid #222; padding:6px 8px; border-radius:4px; display:flex; justify-content:space-between; align-items:center; margin-bottom:5px; cursor:help;"
                                                                                                                                                                                                 onmouseenter="window.showMissionShopItemTooltip(event, 'Eridium Shard')"
                                                                                                                                                                                                 ontouchstart="window.showMissionShopItemTooltip(event, 'Eridium Shard')"
                                                                                                                                                                                                 onmouseleave="window.hideTooltip()">
                                                                                                                                                                                                <div>
                                                                                                                                                                                                    <strong style="color:#8e44ad; font-size:10.5px;">🔮 Eridium Shard</strong>
                                                                                                                                                                                                    <div style="font-size:9px; color:#aaa;">Awaken equipment star ratings (rarities)</div>
                                                                                                                                                                                                </div>
                                                                                                                                                                                                <button class="btn-action" style="background:#bdc3c7; color:#111; padding:3px 8px; font-size:9.5px;" ${tokenBalance >= 4 ? "" : "disabled"} onclick="window.buyMissionItem('Eridium Shard', 4)">Buy (4 MP)</button>
                                                                                                                                                                                            </div>

                                                                                                                                                                                            <!-- Ancient Core -->
                                                                                                                                                                                            <div class="shop-row" style="background:#07030b; border: 1px solid #222; padding:6px 8px; border-radius:4px; display:flex; justify-content:space-between; align-items:center; margin-bottom:5px; cursor:help;"
                                                                                                                                                                                                 onmouseenter="window.showMissionShopItemTooltip(event, 'Ancient Core')"
                                                                                                                                                                                                 ontouchstart="window.showMissionShopItemTooltip(event, 'Ancient Core')"
                                                                                                                                                                                                 onmouseleave="window.hideTooltip()">
                                                                                                                                                                                                <div>
                                                                                                                                                                                                    <strong style="color:#e74c3c; font-size:10.5px;">🔴 Ancient Core</strong>
                                                                                                                                                                                                    <div style="font-size:9px; color:#aaa;">Activate the Altar of Rifts</div>
                                                                                                                                                                                                </div>
                                                                                                                                                                                                <button class="btn-action" style="background:#bdc3c7; color:#111; padding:3px 8px; font-size:9.5px;" ${tokenBalance >= 2 ? "" : "disabled"} onclick="window.buyMissionItem('Ancient Core', 2)">Buy (2 MP)</button>
                                                                                                                                                                                            </div>

                                                                                                                                                                                            <!-- Overlord's Sigil -->
                                                                                                                                                                                                                                                                                            <div class="shop-row" style="background:#07030b; border: 1px solid #222; padding:6px 8px; border-radius:4px; display:flex; justify-content:space-between; align-items:center; margin-bottom:5px; cursor:help;"
                                                                                                                                                                                                                                                                                                 onmouseenter="window.showMissionShopItemTooltip(event, 'Overlords Sigil')"
                                                                                                                                                                                                                                                                                                 ontouchstart="window.showMissionShopItemTooltip(event, 'Overlords Sigil')"
                                                                                                                                                                                                                                                                                                 onmouseleave="window.hideTooltip()">
                                                                                                                                                                                                                                                                                                <div>
                                                                                                                                                                                                                                                                                                    <strong style="color:#1abc9c; font-size:10.5px;">🔱 Overlord's Sigil</strong>
                                                                                                                                                                                                                                                                                                    <div style="font-size:9px; color:#aaa;">Material required for unique artifact tempering</div>
                                                                                                                                                                                                                                                                                                </div>
                                                                                                                                                                                                                                                                                                <button class="btn-action" style="background:#bdc3c7; color:#111; padding:3px 8px; font-size:9.5px;" ${tokenBalance >= 6 ? "" : "disabled"} onclick="window.buyMissionItem('Overlords Sigil', 6)">Buy (6 MP)</button>
                                                                                                                                                                                                                                                                                            </div>

                                                                                                                                                                                            <!-- Gacha Key -->
                                                                                                                                                                                            <div class="shop-row" style="background:#07030b; border:1px solid #222; padding:6px 8px; border-radius:4px; display:flex; justify-content:space-between; align-items:center; margin-bottom:5px; cursor:help;"
                                                                                                                                                                                                 onmouseenter="window.showMissionShopItemTooltip(event, 'Gacha Key')"
                                                                                                                                                                                                 ontouchstart="window.showMissionShopItemTooltip(event, 'Gacha Key')"
                                                                                                                                                                                                 onmouseleave="window.hideTooltip()">
                                                                                                                                                                                    <div>
                                                                                                                                                                                        <strong style="color:#f1c40f; font-size:10.5px;">🔑 Gacha Key</strong>
                                                                                                                                                                                        <div style="font-size:9px; color:#aaa;">Roll standard vending crate</div>
                                                                                                                                                                                    </div>
                                                                                                                                                                                    <button class="btn-action" style="background:#bdc3c7; color:#111; padding:3px 8px; font-size:9.5px;" ${tokenBalance >= 4 ? "" : "disabled"} onclick="window.buyMissionItem('Gacha Key', 4)">Buy (4 MP)</button>
                                                                                                                                                                                </div>

                                                                                                                                                                                <!-- Catalyst Core -->
                                                                                                                                                                                <div class="shop-row" style="background:#07030b; border: 1px solid #222; padding:6px 8px; border-radius:4px; display:flex; justify-content:space-between; align-items:center; margin-bottom:5px; cursor:help;"
                                                                                                                                                                                     onmouseenter="window.showMissionShopItemTooltip(event, 'Catalyst Core')"
                                                                                                                                                                                     ontouchstart="window.showMissionShopItemTooltip(event, 'Catalyst Core')"
                                                                                                                                                                                     onmouseleave="window.hideTooltip()">
                                                                                                                                                                                    <div>
                                                                                                                                                                                        <strong style="color:#2ecc71; font-size:10.5px;">🔋 Catalyst Core</strong>
                                                                                                                                                                                        <div style="font-size:9px; color:#aaa;">Lock & re-roll item properties</div>
                                                                                                                                                                                    </div>
                                                                                                                                                                                    <button class="btn-action" style="background:#bdc3c7; color:#111; padding:3px 8px; font-size:9.5px;" ${tokenBalance >= 3 ? "" : "disabled"} onclick="window.buyMissionItem('Catalyst Core', 3)">Buy (3 MP)</button>
                                                                                                                                                                                </div>

                                                                                                                                                                                <!-- Astral Essence -->
                                                                                                                                                                                <div class="shop-row" style="background:#07030b; border: 1px solid #222; padding:6px 8px; border-radius:4px; display:flex; justify-content:space-between; align-items:center; margin-bottom:5px; cursor:help;"
                                                                                                                                                                                     onmouseenter="window.showMissionShopItemTooltip(event, 'Astral Essence')"
                                                                                                                                                                                     ontouchstart="window.showMissionShopItemTooltip(event, 'Astral Essence')"
                                                                                                                                                                                     onmouseleave="window.hideTooltip()">
                                                                                                                                                                                    <div>
                                                                                                                                                                                        <strong style="color:#9b59b6; font-size:10.5px;">🌌 Astral Essence</strong>
                                                                                                                                                                                        <div style="font-size:9px; color:#aaa;">Infuse powerful gear enchantments</div>
                                                                                                                                                                                    </div>
                                                                                                                                                                                    <button class="btn-action" style="background:#bdc3c7; color:#111; padding:3px 8px; font-size:9.5px;" ${tokenBalance >= 4 ? "" : "disabled"} onclick="window.buyMissionItem('Astral Essence', 4)">Buy (4 MP)</button>
                                                                                                                                                                                </div>

                                                                                                                                                                                <!-- Double XP Elixir -->
                                                                                                                                                                                <div class="shop-row" style="background:#07030b; border:1px solid #222; padding:6px 8px; border-radius:4px; display:flex; justify-content:space-between; align-items:center; margin-bottom:5px; cursor:help;"
                                                                                                                                                                                     onmouseenter="window.showMissionShopItemTooltip(event, 'Double XP Elixir')"
                                                                                                                                                                                     ontouchstart="window.showMissionShopItemTooltip(event, 'Double XP Elixir')"
                                                                                                                                                                                     onmouseleave="window.hideTooltip()">
                                                                                                                                                                                    <div>
                                                                                                                                                                                        <strong style="color:#a855f7; font-size:10.5px;">🧪 Double XP Elixir</strong>
                                                                                                                                                                                        <div style="font-size:9px; color:#aaa;">Doubles monster EXP gains (+100% EXP)</div>
                                                                                                                                                                                    </div>
                                                                                                                                                                                    <button class="btn-action" style="background:#bdc3c7; color:#111; padding:3px 8px; font-size:9.5px;" ${tokenBalance >= 3 ? "" : "disabled"} onclick="window.buyMissionItem('Double XP Elixir', 3)">Buy (3 MP)</button>
                                                                                                                                                                                </div>

                                                                                                                                                                                <!-- Double Drop Elixir -->
                                                                                                                                                                                <div class="shop-row" style="background:#07030b; border:1px solid #222; padding:6px 8px; border-radius:4px; display:flex; justify-content:space-between; align-items:center; margin-bottom:5px; cursor:help;"
                                                                                                                                                                                     onmouseenter="window.showMissionShopItemTooltip(event, 'Double Drop Elixir')"
                                                                                                                                                                                     ontouchstart="window.showMissionShopItemTooltip(event, 'Double Drop Elixir')"
                                                                                                                                                                                     onmouseleave="window.hideTooltip()">
                                                                                                                                                                                    <div>
                                                                                                                                                                                        <strong style="color:#22c55e; font-size:10.5px;">🧪 Double Drop Elixir</strong>
                                                                                                                                                                                        <div style="font-size:9px; color:#aaa;">Doubles global drop rate modifier (+100%)</div>
                                                                                                                                                                                    </div>
                                                                                                                                                                                    <button class="btn-action" style="background:#bdc3c7; color:#111; padding:3px 8px; font-size:9.5px;" ${tokenBalance >= 4 ? "" : "disabled"} onclick="window.buyMissionItem('Double Drop Elixir', 4)">Buy (4 MP)</button>
                                                                                                                                                                                </div>

                                                                                                                                                                                <!-- Drop Quality Elixir -->
                                                                                                                                                                                <div class="shop-row" style="background:#07030b; border:1px solid #222; padding:6px 8px; border-radius:4px; display:flex; justify-content:space-between; align-items:center; cursor:help;"
                                                                                                                                                                                     onmouseenter="window.showMissionShopItemTooltip(event, 'Drop Quality Elixir')"
                                                                                                                                                                                     ontouchstart="window.showMissionShopItemTooltip(event, 'Drop Quality Elixir')"
                                                                                                                                                                                     onmouseleave="window.hideTooltip()">
                                                                                                                                                                                    <div>
                                                                                                                                                                                        <strong style="color:#3b82f6; font-size:10.5px;">🧪 Drop Quality Elixir</strong>
                                                                                                                                                                                        <div style="font-size:9px; color:#aaa;">Boosts drop quality checks (+50% Qly)</div>
                                                                                                                                                                                    </div>
                                                                                                                                                                                    <button class="btn-action" style="background:#bdc3c7; color:#111; padding:3px 8px; font-size:9.5px;" ${tokenBalance >= 5 ? "" : "disabled"} onclick="window.buyMissionItem('Drop Quality Elixir', 5)">Buy (5 MP)</button>
                                                                                                                                                                                </div>
                                                                                                                                                                            </div>
                                                                                                                                                                        </div>
                                                                            `;
  }

  contentEl.innerHTML = `
                                              ${tabHeaderHtml}

                                              <!-- Mission Points Balance Bar -->
                                              <div style="background:#111; border:1px solid #333; padding:8px; border-radius:6px; margin-bottom:12px; display:flex; justify-content:space-between; align-items:center; font-family:monospace; font-size:11px;">
                                                  <span>Mission Points:</span>
                                                  <strong style="color:#f1c40f; font-size:13px;" id="mission-point-lbl">${tokenBalance} MP</strong>
                                              </div>

                                              ${contentHtml}
                                      `;

  if (currentTab === "BOARD") {
    // Dynamic countdown timer calculations locked to Pacific Time (PST/PDT)
    let now = Date.now();
    let ptNowStr = new Date(now).toLocaleString("en-US", {
      timeZone: "America/Los_Angeles",
    });
    let ptNow = new Date(ptNowStr);

    // Next midnight in Pacific Time
    let nextMidnightPt = new Date(
      ptNow.getFullYear(),
      ptNow.getMonth(),
      ptNow.getDate() + 1,
      0,
      0,
      0,
      0,
    );
    let dailyLeftMs = nextMidnightPt.getTime() - ptNow.getTime();

    let dH = Math.floor(dailyLeftMs / 3600000);
    let dM = Math.floor((dailyLeftMs % 3600000) / 60000);
    let dTimerEl = document.getElementById("daily-timer-val");
    if (dTimerEl) dTimerEl.innerText = `${dH}h ${dM}m left`;

    // Next Monday 12:00 AM in Pacific Time
    let dayOfWeek = ptNow.getDay();
    let daysToMonday = (8 - dayOfWeek) % 7;
    if (daysToMonday === 0) daysToMonday = 7;
    let nextMondayPt = new Date(
      ptNow.getFullYear(),
      ptNow.getMonth(),
      ptNow.getDate() + daysToMonday,
      0,
      0,
      0,
      0,
    );
    let weeklyLeftMs = nextMondayPt.getTime() - ptNow.getTime();

    let wD = Math.floor(weeklyLeftMs / 86400000);
    let wH = Math.floor((weeklyLeftMs % 86400000) / 3600000);
    let wTimerEl = document.getElementById("weekly-timer-val");
    if (wTimerEl) wTimerEl.innerText = `${wD}d ${wH}h left`;
  }
};

// --- DYNAMIC RECENT LOGS & SHOWCASE SYSTEM ---
window.gachaShowcaseItems = [];

window.initGachaShowcase = function () {
  if (window.gachaShowcaseItems.length > 0) return;

  let stageScale =
    Math.floor(((window.playerStats.lifetimePeakStage || 1) - 1) / 10) + 1;
  if (stageScale < 6) stageScale = 6; // High levels to showcase cool stat-lines

  let types = [
    "weapon",
    "subweapon",
    "helmet",
    "chest",
    "leggings",
    "overall",
    "boots",
  ];

  for (let i = 0; i < 12; i++) {
    let rVal = Math.random();
    let item;

    if (rVal < 0.35) {
      // 35% chance to showcase a random Unique Relic or Weapon
      let subR = Math.random();
      if (subR < 0.4) {
        // Artifact Relic
        item = window.createItemObject("artifact", 3, stageScale, 0);
      } else {
        // Uber Unique Weapon/Armor/Sub-weapon
        let uniqueTypes = ["weapon", "subweapon", "boots", "helmet"];
        let chosenType =
          uniqueTypes[Math.floor(Math.random() * uniqueTypes.length)];
        item = window.createItemObject(chosenType, 5, stageScale, 5);

        if (chosenType === "weapon") {
          let weapons = ["staff", "sword", "singularity", "maelstrom"];
          let selected = weapons[Math.floor(Math.random() * weapons.length)];
          if (selected === "staff") {
            item.isUniqueStaff = true;
            item.noun = "Phoenix Staff";
            item.setName = null;
            item.name = `🔥 Phoenix Ignition Staff (Lv. ${stageScale})`;
            item.desc =
              "Launches penetrating fireballs that deal 25% Attack damage (3s Cooldown).";
          } else if (selected === "sword") {
            item.isUniqueSword = true;
            item.noun = "Sanguine Reaver";
            item.setName = null;
            item.name = `🩸 Crimson Sanguine Reaver (Lv. ${stageScale})`;
            item.desc =
              "Strikes apply stacking Bleed (Max 5). Strikes at max stacks triggers Rupture, siphoning 10% Max HP.";
          } else if (selected === "singularity") {
            item.isUniqueSingularity = true;
            item.noun = "Singularity Greatsword";
            item.setName = null;
            item.name = `🌌 Void-Sovereign Greatsword (Lv. ${stageScale})`;
            item.desc =
              "Glows for 7s every 30s. Tap during window to enter 5s Storing state, then detonates spatial collapse.";
          } else {
            item.isUniqueMaelstrom = true;
            item.noun = "Maelstrom Glaive";
            item.setName = null;
            item.name = `🌪️ Maelstrom Gale-Glaive (Lv. ${stageScale})`;
            item.desc =
              "Overkill damage cleaves on next spawn. Critical strikes have 25% chance to project piercing gales.";
          }
        } else if (chosenType === "subweapon") {
          let subs = ["aegis", "watch", "chronicle"];
          let selected = subs[Math.floor(Math.random() * subs.length)];
          if (selected === "aegis") {
            item.subType = "shield";
            item.isUniqueAegis = true;
            item.noun = "Void-Warped Aegis";
            item.setName = null;
            item.name = `🛡️ Void-Warped Bulwark (Lv. ${stageScale})`;
            item.desc =
              "Blocks trigger gravity blasts scaling with Defense. Can be absorbed into Singularity vortex.";
          } else if (selected === "watch") {
            item.subType = "tome";
            item.isUniqueWatch = true;
            item.noun = "Chronos Pocket-Watch";
            item.setName = null;
            item.name = `⏳ Chronos Dial-Watch (Lv. ${stageScale})`;
            item.desc =
              "Triggers 4s Temporal Fracture every 20s. Accelerates attack speeds by 15% and slows enemies by 25%.";
          } else {
            item.subType = "tome";
            item.isUniqueChronicle = true;
            item.noun = "Chronicle of the Ascended";
            item.setName = null;
            item.name = `📖 Chronicle of past Lives (Lv. ${stageScale})`;
            item.desc =
              "Boosts XP gain by +200% and bypasses level locks while below 75% peak level.";
          }
        } else if (chosenType === "boots") {
          item.isUniqueWarpCore = true;
          item.noun = "Warp-Core Greaves";
          item.setName = null;
          item.name = `⚡ Warp-Core Greaves (Lv. ${stageScale})`;
          item.desc =
            "While below 85% Peak Stage: +150% sprint speed, and kills count as 2.";
        } else {
          item.isUniqueTempest = true;
          item.noun = "Crown of Tempests";
          item.setName = null;
          item.name = `👑 Crown of crackling Tempests (Lv. ${stageScale})`;
          item.desc =
            "Taking damage has 15% chance to call thunderbolt dealing 150% Attack power and stuns.";
        }
      }
    } else if (rVal < 0.65) {
      // 30% chance for a 5★ Mythic Item
      let chosenType = types[Math.floor(Math.random() * types.length)];
      item = window.createItemObject(chosenType, 5, stageScale, 5);
    } else {
      // 35% chance for a 4★ Legendary Item
      let chosenType = types[Math.floor(Math.random() * types.length)];
      item = window.createItemObject(chosenType, 4, stageScale, 4);
    }

    item.id = 999000 + i;
    window.recalculateItemStats(item);
    window.frozenItemDb[item.id] = item;
    window.gachaShowcaseItems.push(item);
  }
};

window.renderGachaShowcaseMarquee = function (forceRefresh = false) {
  let track = document.getElementById("gacha-showcase-marquee");
  if (!track) return;

  let now = Date.now();
  if (!window.lastGachaShowcaseRotationTime) {
    window.lastGachaShowcaseRotationTime = now;
  }

  // Rotate batch every 75 seconds (matching the marquee crawl)
  let shouldRotate = now - window.lastGachaShowcaseRotationTime >= 75000;

  if (window.gachaShowcaseItems.length === 0 || shouldRotate || forceRefresh) {
    // Purge previous showcase IDs from frozenItemDb to prevent memory leakage
    if (window.gachaShowcaseItems.length > 0) {
      window.gachaShowcaseItems.forEach((item) => {
        delete window.frozenItemDb[item.id];
      });
      window.gachaShowcaseItems = [];
    }

    window.initGachaShowcase(); // Spawns a fresh batch of 12 items on IDs 999000-999011
    window.lastGachaShowcaseRotationTime = now;

    // Only write to DOM when items are actually regenerated (prevents stutter/flicker)
    let combinedItems = [
      ...window.gachaShowcaseItems,
      ...window.gachaShowcaseItems,
    ];
    track.innerHTML = combinedItems
      .map((item) => {
        let col = window.getTierColor(item.statsRolled);
        let shortName = item.name.replace(
          /⭐ UNIQUE |(Common|Rare|Magic|Epic|Legendary|Mythic) /g,
          "",
        );
        return `
                                                <span style="color:${col}; font-weight:bold; font-size:10px; cursor:help; text-decoration: underline; text-decoration-style: dotted; margin: 0 4px;"
                                                      onmouseenter="window.showInventoryTooltip(event, ${item.id})"
                                                      ontouchstart="window.showInventoryTooltip(event, ${item.id})"
                                                      onmouseleave="window.hideTooltip()">
                                                    ${shortName}
                                                </span>
                                            `;
      })
      .join("");
  }
};

window.updateGachaRecentList = function () {
  let listEl = document.getElementById("gacha-recent-list");
  if (!listEl) return;

  // 1. Immediately render local history as an instant fallback
  window.playerStats.gachaHistory = window.playerStats.gachaHistory || [];
  let renderItemRow = (item, playerName = "You") => {
    let col = window.getTierColor(item.statsRolled);
    let starDisplay = item.statsRolled === "UNIQUE" ? "★" : `${item.statsRolled}★`;
    let shortName = item.name.replace(/⭐ UNIQUE |(Common|Rare|Magic|Epic|Legendary|Mythic) /g, "");
    return `
        <div style="background:#07030b; border: 1px solid #222; border-left: 3.5px solid ${col}; border-radius:3px; padding:4px 6px; display:flex; justify-content:space-between; align-items:center; cursor:help; font-family:sans-serif; gap:6px;"
             onmouseenter="window.showInventoryTooltip(event, ${item.id})"
             ontouchstart="window.showInventoryTooltip(event, ${item.id})"
             onmouseleave="window.hideTooltip()">
            <div style="text-align:left; min-width:0; flex:1;">
                <span style="color:#888; font-size:8.5px; display:block; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">[${playerName}] rolled:</span>
                <span style="color:${col}; font-weight:bold; font-size:10px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; display:block;">${shortName}</span>
            </div>
            <span style="color:#666; font-size:9px; font-family:monospace; align-self:flex-end;">${starDisplay}</span>
        </div>
    `;
  };

  let localHtml = window.playerStats.gachaHistory
    .map((item) => renderItemRow(item, "You"))
    .join("");

  if (localHtml) {
    listEl.innerHTML = localHtml;
  } else {
    listEl.innerHTML = `<div style="color:#666; text-align:center; padding-top:40px; font-size:10px; font-style:italic; line-height: 1.4; white-space:normal;">No recent pulls.<br>Crank the handle inside the dispensary!</div>`;
  }

  // 2. Fetch the global pulls to overlay them
  if (!window.GAME_SERVER_URL) return;

  fetch(`${window.GAME_SERVER_URL}/api/gacha/global-pulls`)
    .then((r) => r.json())
    .then((data) => {
      if (data.success && data.pulls && data.pulls.length > 0) {
        // Cache global items in client DB so standard tooltips resolve on hover
        data.pulls.forEach((pull) => {
          if (pull.item) {
            window.frozenItemDb[pull.item.id] = pull.item;
          }
        });

        // Map global pulls
        let globalHtml = data.pulls
          .map((pull) => renderItemRow(pull.item, pull.playerName || "Player"))
          .join("");

        listEl.innerHTML = globalHtml;
      }
    })
    .catch((err) => {
      console.log("Global pulls offline, displaying local history fallback:", err);
    });
};

// --- UNBOXING ANIMATIONS AND ENGAGING REWARD FLOWS ---

window.openDailyRewardSack = function () {
  let ownedDaily = window.inventory.USE["Daily Reward Sack"] || 0;
  let ownedGuild = window.inventory.USE["Guild Reward Sack"] || 0;
  let owned = ownedDaily + ownedGuild;
  if (owned <= 0) return;

  let maxBag = window.getMaxBagSlots();
  if (window.inventory.EQUIP.length >= maxBag) {
    window.pushHeaderToast("❌ Equipment bag is full!", "#e74c3c");
    return;
  }

  // Consume 1
  if (ownedDaily > 0) {
    window.inventory.USE["Daily Reward Sack"]--;
    if (window.inventory.USE["Daily Reward Sack"] === 0) {
      delete window.inventory.USE["Daily Reward Sack"];
    }
  } else {
    window.inventory.USE["Guild Reward Sack"]--;
    if (window.inventory.USE["Guild Reward Sack"] === 0) {
      delete window.inventory.USE["Guild Reward Sack"];
    }
  }

  // Play opening sound
  window.SoundManager.play("fairy");
  window.setPauseState(true);

  // Determine rewards (Standardized Daily MP and randomized pool rolls)
  window.playerStats.missionTokens =
    (window.playerStats.missionTokens || 0) + 1;

  // Always give a piece of equipment at your lifetime peak stage
  let pCurrent = window.resolvePlayerStats();
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
  let luckMultiplier = pCurrent.qly;
  let roll = Math.random() * 100;
  let chance5 = luckMultiplier >= 2.0 ? 0.02 * luckMultiplier : 0;
  let chance4 = luckMultiplier >= 1.5 ? 0.16 * luckMultiplier : 0;
  if (roll < chance5) statLinesCount = 5;
  else if (roll < chance5 + chance4) statLinesCount = 4;
  else if (roll < 0.8 * luckMultiplier) statLinesCount = 3;
  else if (roll < 4.0 * luckMultiplier) statLinesCount = 2;
  else if (roll < 15.0 * luckMultiplier) statLinesCount = 1;
  else statLinesCount = 0;

  let stageLvl = Math.max(
    1,
    Math.floor(((window.playerStats.lifetimePeakStage || 1) - 1) / 10) + 1,
  );
  let newEquip = window.createItemObject(
    chosenType,
    statLinesCount,
    stageLvl,
    0,
  );

  window.inventory.EQUIP.push(newEquip);
  window.frozenItemDb[newEquip.id] = JSON.parse(JSON.stringify(newEquip));

  const sackPool = [
    {
      name: "Monster Soul",
      qty: 75,
      weight: 30,
      color: "#888888",
      type: "etc",
    },
    {
      name: "Luminous Soul",
      qty: 2,
      weight: 15,
      color: "#ffb6c1",
      type: "etc",
    },
    { name: "Rare Scrap", qty: 10, weight: 15, color: "#3498db", type: "etc" },
    { name: "Magic Scrap", qty: 6, weight: 12, color: "#9b59b6", type: "etc" },
    { name: "Epic Scrap", qty: 3, weight: 8, color: "#e67e22", type: "etc" },
    { name: "Attack Elixir", qty: 1, weight: 6, color: "#2ecc71", type: "use" },
    {
      name: "Vitality Elixir",
      qty: 1,
      weight: 6,
      color: "#e74c3c",
      type: "use",
    },
    {
      name: "Armored Elixir",
      qty: 1,
      weight: 6,
      color: "#3498db",
      type: "use",
    },
    { name: "Haste Elixir", qty: 1, weight: 6, color: "#f1c40f", type: "use" },
    { name: "Ancient Core", qty: 1, weight: 2, color: "#e74c3c", type: "etc" },
    {
      name: "Overlord's Sigil",
      qty: 1,
      weight: 2,
      color: "#1abc9c",
      type: "etc",
    },
    { name: "Eridium Shard", qty: 1, weight: 2, color: "#8e44ad", type: "etc" },
  ];

  function rollFromPool() {
    let totalWeight = sackPool.reduce((sum, item) => sum + item.weight, 0);
    let r = Math.random() * totalWeight;
    let accumulated = 0;
    for (let item of sackPool) {
      accumulated += item.weight;
      if (r <= accumulated) return item;
    }
    return sackPool[0];
  }

  let receivedRewards = [];

  // Add the guaranteed equipment!
  receivedRewards.push({
    name: newEquip.name,
    qty: 1,
    color: window.getTierColor(newEquip.statsRolled),
    type: "equip",
    item: newEquip,
  });

  // Roll 1: 100% chance
  let reward1 = rollFromPool();
  receivedRewards.push(reward1);

  // Roll 2: 20% chance
  let hasRoll2 = Math.random() < 0.2;
  if (hasRoll2) {
    let reward2 = rollFromPool();
    receivedRewards.push(reward2);

    // Roll 3: 5% chance (only if Roll 2 succeeds)
    let hasRoll3 = Math.random() < 0.05;
    if (hasRoll3) {
      let reward3 = rollFromPool();
      receivedRewards.push(reward3);
    }
  }

  // Credit rewards
  receivedRewards.forEach((r) => {
    if (r.type === "use") {
      window.addUseDrop(r.name, r.qty);
    } else if (r.type === "etc") {
      window.addEtcDrop(r.name, r.qty);
    }
  });

  // Create cool opening overlay card
  let overlay = document.createElement("div");
  overlay.id = "sack-opening-overlay";
  overlay.style.position = "fixed";
  overlay.style.top = "0";
  overlay.style.left = "0";
  overlay.style.width = "100%";
  overlay.style.height = "100%";
  overlay.style.backgroundColor = "rgba(0,0,0,0.9)";
  overlay.style.display = "flex";
  overlay.style.justifyContent = "center";
  overlay.style.alignItems = "center";
  overlay.style.zIndex = "45000";
  overlay.style.backdropFilter = "blur(8px)";
  document.body.appendChild(overlay);

  // Spawn nice canvas particles on the screen
  let cvs = document.getElementById("gameCanvas");
  let w = cvs ? cvs.width : 750;
  let h = cvs ? cvs.height : 250;
  for (let i = 0; i < 40; i++) {
    let angle = Math.random() * Math.PI * 2;
    let vel = window.randFloat(3, 8);
    window.particles.push({
      x: w / 2,
      y: h / 2,
      vx: Math.cos(angle) * vel,
      vy: Math.sin(angle) * vel - 2,
      radius: window.randFloat(2, 5),
      color: window.getTierColor(newEquip.statsRolled),
      alpha: 1,
      life: window.randInt(30, 50),
    });
  }

  overlay.innerHTML = `
          <style>
            .sack-anim-container {
              display: flex;
              justify-content: center;
              align-items: center;
              height: 180px;
              margin-bottom: 10px;
            }
            .sack-svg {
                        animation: sackShake 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
                        overflow: visible !important;
                      }
            .sack-string {
              animation: stringUntie 0.4s cubic-bezier(0.25, 0.8, 0.25, 1) forwards;
              animation-delay: 0.42s;
            }
            .sack-neck {
              animation: neckOpen 0.5s cubic-bezier(0.25, 0.8, 0.25, 1.25) forwards;
              animation-delay: 0.44s;
            }
            .sparkle {
              opacity: 0;
              animation: sparkleUp 0.8s cubic-bezier(0.25, 1, 0.5, 1) forwards;
              animation-delay: 0.5s;
              transform-origin: 50px 42px;
            }
            .s1 { --dx: 0px; --dy: -38px; --ds: 1.4; }
            .s2 { --dx: -28px; --dy: -28px; --ds: 1.2; }
            .s3 { --dx: 28px; --dy: -28px; --ds: 1.2; }
            .s4 { --dx: -14px; --dy: -42px; --ds: 1.1; }
            .s5 { --dx: 14px; --dy: -42px; --ds: 1.1; }

            @keyframes sackShake {
              0%, 100% { transform: rotate(0deg) scale(1); }
              15% { transform: rotate(-8deg) scale(1.08); }
              30% { transform: rotate(9deg) scale(1.08); }
              45% { transform: rotate(-9deg) scale(1.08); }
              60% { transform: rotate(6deg) scale(1.04); }
              75% { transform: rotate(-4deg) scale(1.02); }
              90% { transform: rotate(2deg) scale(1.01); }
            }
            @keyframes stringUntie {
              0% { transform: translateY(0) scale(1); opacity: 1; }
              100% { transform: translateY(14px) scale(0.5); opacity: 0; }
            }
            @keyframes neckOpen {
              0% { transform: scaleX(1) scaleY(1); }
              100% { transform: scaleX(1.4) scaleY(0.7) translateY(2px); }
            }
            @keyframes sparkleUp {
              0% { transform: translate(0, 15px) scale(0); opacity: 0; }
              40% { opacity: 1; }
              100% { transform: translate(var(--dx), var(--dy)) scale(var(--ds)); opacity: 0; }
            }
          </style>
          <div style="text-align:center; color:white; animation: toastFadeIn 0.3s ease-out;">
            <div class="sack-anim-container">
              <svg class="sack-svg" width="150" height="150" viewBox="0 0 100 100">
                <!-- Drop Shadow -->
                <ellipse cx="50" cy="92" rx="34" ry="5.5" fill="rgba(0,0,0,0.45)" />

                <!-- Sack Body -->
                <path class="sack-body" d="M30,42 C20,42 12,50 12,72 C12,88 25,92 50,92 C75,92 88,88 88,72 C88,50 80,42 70,42 Z" fill="#d35400" stroke="#000" stroke-width="2.5" />

                <!-- Sack Neck -->
                <g class="sack-neck" style="transform-origin: 50px 42px;">
                  <!-- Left Flap -->
                  <path d="M30,42 L24,25 C28,21 38,20 46,25 L46,42 Z" fill="#e67e22" stroke="#000" stroke-width="2.5" />
                  <!-- Right Flap -->
                  <path d="M70,42 L76,25 C72,21 62,20 54,25 L54,42 Z" fill="#e67e22" stroke="#000" stroke-width="2.5" />
                </g>

                <!-- Tied Cord -->
                <g class="sack-string" style="transform-origin: 50px 42px;">
                  <path d="M28,42 Q50,47 72,42" fill="none" stroke="#f1c40f" stroke-width="3" stroke-linecap="round" />
                  <!-- Bow Knot -->
                  <circle cx="50" cy="43.5" r="3.5" fill="#f1c40f" stroke="#000" stroke-width="1.5" />
                  <path d="M50,43.5 Q42,52 38,55 M50,43.5 Q58,52 62,55" fill="none" stroke="#f1c40f" stroke-width="2.5" stroke-linecap="round" />
                </g>

                <!-- Particle Burst -->
                <g>
                  <path class="sparkle s1" d="M50,25 L50,15 M45,20 L55,20" stroke="#fff" stroke-width="2" stroke-linecap="round" />
                  <path class="sparkle s2" d="M35,30 L31,22 M28,27 L38,25" stroke="#f1c40f" stroke-width="1.5" stroke-linecap="round" />
                  <path class="sparkle s3" d="M65,30 L69,22 M62,25 L72,27" stroke="#f1c40f" stroke-width="1.5" stroke-linecap="round" />
                  <circle class="sparkle s4" cx="42" cy="15" r="2.5" fill="#fff" />
                  <circle class="sparkle s5" cx="58" cy="15" r="2" fill="#fff" />
                </g>
              </svg>
            </div>
            <div style="font-size: 15px; font-weight: 900; color:#f1c40f; letter-spacing: 2px; text-shadow: 0 0 6px rgba(241,196,15,0.3);">UNTYING SACK...</div>
          </div>
        `;

  setTimeout(() => {
    let listHtml = receivedRewards
      .map((r) => {
        let icon = "";
        let hoverEvents = "";
        let escapedName = r.name.replace(/'/g, "\\'");

        if (r.type === "equip") {
          icon = window.getEquipIconHtml(r.item, 28);
          hoverEvents = `
                    onmouseenter="window.showInventoryTooltip(event, ${r.item.id})"
                    onmouseleave="window.hideTooltip()"
                    ontouchstart="window.showInventoryTooltip(event, ${r.item.id})"
                  `;
        } else if (r.type === "use") {
          icon = window.getUseIconHtml(r.name);
          hoverEvents = `
            onmouseenter="window.showUseTooltip(event, '${escapedName}')"
            onmouseleave="window.hideTooltip()"
            ontouchstart="window.showUseTooltip(event, '${escapedName}')"
          `;
        } else {
          icon = window.getEtcIconHtml(r.name);
          hoverEvents = `
            onmouseenter="window.showEtcTooltip(event, '${escapedName}')"
            onmouseleave="window.hideTooltip()"
            ontouchstart="window.showEtcTooltip(event, '${escapedName}')"
          `;
        }
        icon = icon.replace("margin-right: 12px;", "margin-right: 8px;");

        return `
        <div class="bag-item" style="cursor:help; background:#111; border:1px solid #333; border-left: 3px solid ${r.color}; border-radius:4px; padding:8px 12px; display:flex; align-items:center; justify-content:space-between; margin-bottom:6px;" ${hoverEvents}>
          <div style="display:flex; align-items:center; text-align:left;">
            ${icon}
            <div style="display:flex; flex-direction:column;">
              <strong style="color:${r.color}; font-size:12px;">${r.name}</strong>
              ${r.type === "equip" ? `<span style="font-size:9px; color:#888;">${r.item.statsRolled === "UNIQUE" ? "UNIQUE" : r.item.statsRolled + "★"} Equipment (Lv. ${r.item.stageLevel})</span>` : ""}
            </div>
          </div>
          <strong style="color:#fff; font-size:13px; font-family:monospace;">+${r.qty}</strong>
        </div>
      `;
      })
      .join("");

    overlay.innerHTML = `
      <div style="background:#1a1a1a; border:2px solid #f1c40f; border-radius:8px; width:95%; max-width:400px; box-shadow:0 10px 30px rgba(0,0,0,0.95); animation: toastFadeIn 0.3s ease-out; overflow:hidden;">
        <div style="background:#0b0f12; border-bottom:1px solid #333; padding:12px 15px; text-align:center;">
          <h3 style="margin:0; color:#f1c40f; font-size:15px; font-weight:bold; letter-spacing:1.5px; text-transform:uppercase;">🎒 SACK OPENED!</h3>
        </div>
        <div style="background:#111; border:1px solid #222; border-radius:6px; padding:8px; display:flex; align-items:center; justify-content:space-between; margin-bottom:12px;">
                        <div style="display:flex; align-items:center;">
                          <span style="background:rgba(241,196,15,0.1); border:1px solid #f1c40f; border-radius:4px; padding:4px; display:inline-flex; width:32px; height:32px; align-items:center; justify-content:center; font-size:16px;">🎖️</span>
                          <strong style="color:#f1c40f; font-size:12.5px; margin-left:8px;">Mission Points</strong>
                        </div>
                        <strong style="color:#fff; font-size:13px; font-family:monospace;">+1 MP</strong>
                      </div>

          <div style="font-size:10px; color:#aaa; font-weight:bold; text-transform:uppercase; margin-bottom:6px; letter-spacing:0.5px;">📦 Loot & Equipment Yield (Hover for Info):</div>
          <div>
            ${listHtml}
          </div>
        </div>
        <div style="background:#0b0f12; border-top:1px solid #333; padding:12px; text-align:center;">
          <button onclick="document.getElementById('sack-opening-overlay').remove(); window.setPauseState(false); window.updateUI(); window.renderInventory();" style="background:#f1c40f; color:#000; border:none; padding:10px; font-weight:bold; font-size:12px; border-radius:4px; cursor:pointer; width:100%;">Claim Loot</button>
        </div>
      </div>
    `;
  }, 1000);
};

window.openGuildWeeklySack = function () {
  let owned = window.inventory.USE["Guild Weekly Sack"] || 0;
  if (owned <= 0) return;

  // Consume 1 Guild Weekly Sack
  window.inventory.USE["Guild Weekly Sack"]--;
  if (window.inventory.USE["Guild Weekly Sack"] === 0) {
    delete window.inventory.USE["Guild Weekly Sack"];
  }

  // Play opening sound
  window.SoundManager.play("revive");
  window.setPauseState(true);

  // Determine rewards (Guaranteed high value MP, Core, Sigil, Shard, and Scraps!)
  window.playerStats.missionTokens =
    (window.playerStats.missionTokens || 0) + 3;

  let receivedRewards = [
    { name: "Ancient Core", qty: 1, color: "#e74c3c", type: "etc" },
    { name: "Overlord's Sigil", qty: 1, color: "#1abc9c", type: "etc" },
    { name: "Eridium Shard", qty: 1, color: "#8e44ad", type: "etc" },
    { name: "Legendary Scrap", qty: 3, color: "#f1c40f", type: "etc" },
  ];

  // 5% chance for a random Artifact
  if (Math.random() < 0.05) {
    let art = window.createItemObject(
      "artifact",
      3,
      window.playerStats.lifetimePeakStage || 1,
      0,
    );
    window.inventory.ARTIFACT.push(art);
    window.frozenItemDb[art.id] = JSON.parse(JSON.stringify(art));
    receivedRewards.push({
      name: art.name,
      qty: 1,
      color: "#1abc9c",
      type: "equip",
      item: art,
    });
  }

  // Credit rewards safely once
  receivedRewards.forEach((r) => {
    if (r.type === "use") {
      window.addUseDrop(r.name, r.qty);
    } else if (r.type === "etc") {
      window.addEtcDrop(r.name, r.qty);
    }
  });

  // Create cool opening overlay card
  let overlay = document.createElement("div");
  overlay.id = "sack-opening-overlay";
  overlay.style.position = "fixed";
  overlay.style.top = "0";
  overlay.style.left = "0";
  overlay.style.width = "100%";
  overlay.style.height = "100%";
  overlay.style.backgroundColor = "rgba(0,0,0,0.9)";
  overlay.style.display = "flex";
  overlay.style.justifyContent = "center";
  overlay.style.alignItems = "center";
  overlay.style.zIndex = "45000";
  overlay.style.backdropFilter = "blur(8px)";
  document.body.appendChild(overlay);

  // Spawn nice canvas particles on the screen
  let cvs = document.getElementById("gameCanvas");
  let w = cvs ? cvs.width : 750;
  let h = cvs ? cvs.height : 250;
  for (let i = 0; i < 60; i++) {
    let angle = Math.random() * Math.PI * 2;
    let vel = window.randFloat(4, 10);
    window.particles.push({
      x: w / 2,
      y: h / 2,
      vx: Math.cos(angle) * vel,
      vy: Math.sin(angle) * vel - 2,
      radius: window.randFloat(2.5, 6),
      color: "#9b59b6",
      alpha: 1,
      life: window.randInt(40, 60),
    });
  }

  // Draw the animation phase first
  overlay.innerHTML = `
    <style>
      .sack-anim-container {
        display: flex;
        justify-content: center;
        align-items: center;
        height: 180px;
        margin-bottom: 10px;
      }
      .sack-svg {
                  animation: sackShake 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
                  overflow: visible !important;
                }
      .sack-string {
        animation: stringUntie 0.4s cubic-bezier(0.25, 0.8, 0.25, 1) forwards;
        animation-delay: 0.42s;
      }
      .sack-neck {
        animation: neckOpen 0.5s cubic-bezier(0.25, 0.8, 0.25, 1.25) forwards;
        animation-delay: 0.44s;
      }
      .sparkle {
        opacity: 0;
        animation: sparkleUp 0.8s cubic-bezier(0.25, 1, 0.5, 1) forwards;
        animation-delay: 0.5s;
        transform-origin: 50px 42px;
      }
      .s1 { --dx: 0px; --dy: -38px; --ds: 1.4; }
      .s2 { --dx: -28px; --dy: -28px; --ds: 1.2; }
      .s3 { --dx: 28px; --dy: -28px; --ds: 1.2; }
      .s4 { --dx: -14px; --dy: -42px; --ds: 1.1; }
      .s5 { --dx: 14px; --dy: -42px; --ds: 1.1; }

      @keyframes sackShake {
        0%, 100% { transform: rotate(0deg) scale(1); }
        15% { transform: rotate(-8deg) scale(1.08); }
        30% { transform: rotate(9deg) scale(1.08); }
        45% { transform: rotate(-9deg) scale(1.08); }
        60% { transform: rotate(6deg) scale(1.04); }
        75% { transform: rotate(-4deg) scale(1.02); }
        90% { transform: rotate(2deg) scale(1.01); }
      }
      @keyframes stringUntie {
        0% { transform: translateY(0) scale(1); opacity: 1; }
        100% { transform: translateY(14px) scale(0.5); opacity: 0; }
      }
      @keyframes neckOpen {
        0% { transform: scaleX(1) scaleY(1); }
        100% { transform: scaleX(1.4) scaleY(0.7) translateY(2px); }
      }
      @keyframes sparkleUp {
        0% { transform: translate(0, 15px) scale(0); opacity: 0; }
        40% { opacity: 1; }
        100% { transform: translate(var(--dx), var(--dy)) scale(var(--ds)); opacity: 0; }
      }
    </style>
    <div style="text-align:center; color:white; animation: toastFadeIn 0.3s ease-out;">
      <div class="sack-anim-container">
        <svg class="sack-svg" width="150" height="150" viewBox="0 0 100 100">
          <!-- Drop Shadow -->
          <ellipse cx="50" cy="92" rx="34" ry="5.5" fill="rgba(0,0,0,0.45)" />

          <!-- Sack Body -->
          <path class="sack-body" d="M30,42 C20,42 12,50 12,72 C12,88 25,92 50,92 C75,92 88,88 88,72 C88,50 80,42 70,42 Z" fill="#6c5ce7" stroke="#000" stroke-width="2.5" />

          <!-- Sack Neck -->
          <g class="sack-neck" style="transform-origin: 50px 42px;">
            <!-- Left Flap -->
            <path d="M30,42 L24,25 C28,21 38,20 46,25 L46,42 Z" fill="#a29bfe" stroke="#000" stroke-width="2.5" />
            <!-- Right Flap -->
            <path d="M70,42 L76,25 C72,21 62,20 54,25 L54,42 Z" fill="#a29bfe" stroke="#000" stroke-width="2.5" />
          </g>

          <!-- Sealed Rope with Wax Seal -->
          <g class="sack-string" style="transform-origin: 50px 42px;">
            <path d="M28,42 Q50,47 72,42" fill="none" stroke="#ffd32a" stroke-width="3" stroke-linecap="round" />
            <!-- Imperial Wax Seal -->
            <circle cx="50" cy="43.5" r="5.5" fill="#ff5e57" stroke="#000" stroke-width="1.5" />
            <path d="M48,42.5 L52,45 M52,42.5 L48,45" stroke="#fff" stroke-width="1" />
          </g>

          <!-- Astral Particle Burst -->
          <g>
            <path class="sparkle s1" d="M50,25 L50,15 M45,20 L55,20" stroke="#fff" stroke-width="2" stroke-linecap="round" />
            <path class="sparkle s2" d="M35,30 L31,22 M28,27 L38,25" stroke="#a29bfe" stroke-width="1.5" stroke-linecap="round" />
            <path class="sparkle s3" d="M65,30 L69,22 M62,25 L72,27" stroke="#a29bfe" stroke-width="1.5" stroke-linecap="round" />
            <circle class="sparkle s4" cx="42" cy="15" r="2.5" fill="#fff" />
            <circle class="sparkle s5" cx="58" cy="15" r="2" fill="#fff" />
          </g>
        </svg>
      </div>
      <div style="font-size: 15px; font-weight: 900; color:#a29bfe; letter-spacing: 2px; text-shadow: 0 0 6px rgba(162,155,254,0.3);">BREAKING SEAL OF THE ASCENDED...</div>
    </div>
  `;

  setTimeout(() => {
    let listHtml = receivedRewards
      .map((r) => {
        let icon = "";
        let hoverEvents = "";
        let escapedName = r.name.replace(/'/g, "\\'");

        if (r.type === "equip") {
          icon = window.getArtifactIconHtml
            ? window.getArtifactIconHtml(r.item.trait, 28)
            : window.getUseIconHtml(r.name);
          hoverEvents = `
            onmouseenter="window.showInventoryTooltip(event, ${r.item.id})"
            onmouseleave="window.hideTooltip()"
            ontouchstart="window.showInventoryTooltip(event, ${r.item.id})"
          `;
        } else if (r.type === "use") {
          icon = window.getUseIconHtml(r.name);
          hoverEvents = `
            onmouseenter="window.showUseTooltip(event, '${escapedName}')"
            onmouseleave="window.hideTooltip()"
            ontouchstart="window.showUseTooltip(event, '${escapedName}')"
          `;
        } else {
          icon = window.getEtcIconHtml(r.name);
          hoverEvents = `
            onmouseenter="window.showEtcTooltip(event, '${escapedName}')"
            onmouseleave="window.hideTooltip()"
            ontouchstart="window.showEtcTooltip(event, '${escapedName}')"
          `;
        }
        icon = icon.replace("margin-right: 12px;", "margin-right: 8px;");

        return `
        <div class="bag-item" style="cursor:help; background:#111; border:1px solid #333; border-left: 3px solid ${r.color}; border-radius:4px; padding:8px 12px; display:flex; align-items:center; justify-content:space-between; margin-bottom:6px;" ${hoverEvents}>
          <div style="display:flex; align-items:center; text-align:left;">
            ${icon}
            <div style="display:flex; flex-direction:column;">
              <strong style="color:${r.color}; font-size:12px;">${r.name}</strong>
              ${r.type === "equip" ? `<span style="font-size:9px; color:#888;">Artifact Relic (Lv. ${r.item.stageLevel})</span>` : ""}
            </div>
          </div>
          <strong style="color:#fff; font-size:13px; font-family:monospace;">+${r.qty}</strong>
        </div>
      `;
      })
      .join("");

    overlay.innerHTML = `
      <div style="background:#1a1a1a; border:2px solid #9b59b6; border-radius:8px; width:95%; max-width:400px; box-shadow:0 10px 30px rgba(0,0,0,0.95); animation: toastFadeIn 0.3s ease-out; overflow:hidden;">
        <div style="background:#0b0f12; border-top: 1px solid #333; padding:12px 15px; text-align:center;">
          <h3 style="margin:0; color:#9b59b6; font-size:15px; font-weight:bold; letter-spacing:1.5px; text-transform:uppercase;">💼 WEEKLY SACK OPENED!</h3>
        </div>
        <div style="background:#111; border:1px solid #222; border-radius:6px; padding:8px; display:flex; align-items:center; justify-content:space-between; margin-bottom:12px;">
                        <div style="display:flex; align-items:center;">
                          <span style="background:rgba(155,89,182,0.1); border:1px solid #9b59b6; border-radius:4px; padding:4px; display:inline-flex; width:32px; height:32px; align-items:center; justify-content:center; font-size:16px;">🎖️</span>
                          <strong style="color:#9b59b6; font-size:12.5px; margin-left:8px;">Mission Points</strong>
                        </div>
                        <strong style="color:#fff; font-size:13px; font-family:monospace;">+3 MP</strong>
                      </div>

          <div style="font-size:10px; color:#aaa; font-weight:bold; text-transform:uppercase; margin-bottom:6px; letter-spacing:0.5px;">📦 Guaranteed Relic Yields (Hover for Info):</div>
          <div>
            ${listHtml}
          </div>
        </div>
        <div style="background:#0b0f12; border-top:1px solid #333; padding:12px; text-align:center;">
          <button onclick="document.getElementById('sack-opening-overlay').remove(); window.setPauseState(false); window.updateUI(); window.renderInventory();" style="background:#9b59b6; color:#fff; border:none; padding:10px; font-weight:bold; font-size:12px; border-radius:4px; cursor:pointer; width:100%;">Claim Relics</button>
        </div>
      </div>
    `;
  }, 1000);
};

// ==========================================================================
// --- ROYAL MAILBOX CLIENT ENGINE ---
// ==========================================================================

window.toggleMailbox = function () {
  let modal = document.getElementById("mailbox-modal");
  if (!modal) return;

  if (modal.style.display === "none" || modal.style.display === "") {
    window.hideTooltip();
    modal.style.display = "block";
    window.fetchMailboxData();
  } else {
    modal.style.display = "none";
    window.hideTooltip();
  }
};

window.fetchMailboxData = function () {
  const listEl = document.getElementById("mailbox-list");
  if (!listEl) return;

  if (!window.GAME_SERVER_URL) {
    listEl.innerHTML = `<div style="color:#666; text-align:center; padding: 20px 0; font-size:11px; font-style:italic;">Mailbox unavailable in offline/GitHub mode.</div>`;
    return;
  }

  const userId = window.getGameUserId ? window.getGameUserId() : "guest_local";
  listEl.innerHTML = `<div style="color:#aaa; text-align:center; padding: 20px 0; font-size:11px;">Checking incoming transmissions...</div>`;

  const claimedMailIds = window.playerStats.claimedMailIds || [];
  fetch(`${window.GAME_SERVER_URL}/api/mailbox`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, claimedMailIds })
  })
  .then(response => response.json())
  .then(data => {
    if (data.success && data.mailbox) {
      window.renderMailboxItems(data.mailbox);
      const hasUnclaimed = data.mailbox.some(m => !m.claimed);
      window.updateMailboxBadge(hasUnclaimed);
    } else {
      listEl.innerHTML = `<div style="color:#e74c3c; text-align:center; padding: 20px 0; font-size:11px;">Error loading mailbox data.</div>`;
    }
  })
  .catch(err => {
    console.error("Mailbox fetch failed:", err);
    listEl.innerHTML = `<div style="color:#e74c3c; text-align:center; padding: 20px 0; font-size:11px;">Could not connect to the mail server.</div>`;
  });
};

window.renderMailboxItems = function (mailbox) {
  const listEl = document.getElementById("mailbox-list");
  if (!listEl) return;

  if (mailbox.length === 0) {
    listEl.innerHTML = `<div style="color:#666; text-align:center; padding: 20px 0; font-size:11px; font-style:italic;">Your mailbox is currently empty.</div>`;
    return;
  }

  listEl.innerHTML = mailbox.map(mail => {
    let buttonHtml = "";
    if (mail.claimed) {
      buttonHtml = `<span style="color:#7f8c8d; font-weight:bold; font-size:11px;">Claimed ✓</span>`;
    } else {
      buttonHtml = `<button class="btn-action" style="background:#e74c3c; color:white; font-size:11px; padding:4px 10px;" onclick="window.claimMailReward('${mail.id}')">Claim</button>`;
    }

    // Build highly optimized, stylized HTML badges using native visual generators
    let rewardsHtml = "";

    if (mail.rewards.coins) {
      rewardsHtml += `
        <div style="display:inline-flex; align-items:center; background:rgba(241,196,15,0.06); border:1px solid #f1c40f; padding:3px 8px; border-radius:4px; font-family:monospace; font-size:10px; color:#fff; font-weight:bold;">
            <span style="background:rgba(241,196,15,0.18); border-radius:4px; width:22px; height:22px; display:inline-flex; align-items:center; justify-content:center; margin-right:6px; font-size:11px; border:1px solid #d4af37;">🟡</span>
            <span>+${mail.rewards.coins.toLocaleString()} Gold</span>
        </div>
      `;
    }

    if (mail.rewards.etc) {
      Object.keys(mail.rewards.etc).forEach(k => {
        let iconHtml = typeof window.getEtcIconHtml === "function" ? window.getEtcIconHtml(k) : "📦";
        // Shrink the standard 32px inventory icon down to 22px to fit the compact mailbox layout cleanly
        iconHtml = iconHtml.replace('width: 32px; height: 32px;', 'width: 22px; height: 22px; padding: 2px; margin-right: 6px;');
        iconHtml = iconHtml.replace('margin-right: 12px;', 'margin-right: 6px;');

        rewardsHtml += `
          <div style="display:inline-flex; align-items:center; background:rgba(255,255,255,0.015); border:1px solid #374151; padding:3px 8px; border-radius:4px; font-family:monospace; font-size:10px; color:#fff; font-weight:bold;">
              ${iconHtml}
              <span>+${mail.rewards.etc[k]} ${k}</span>
          </div>
        `;
      });
    }

    if (mail.rewards.use) {
          Object.keys(mail.rewards.use).forEach(k => {
            let iconHtml = typeof window.getUseIconHtml === "function" ? window.getUseIconHtml(k) : "🧪";
            iconHtml = iconHtml.replace('width: 32px; height: 32px;', 'width: 22px; height: 22px; padding: 2px; margin-right: 6px;');
            iconHtml = iconHtml.replace('margin-right: 12px;', 'margin-right: 6px;');

            rewardsHtml += `
              <div style="display:inline-flex; align-items:center; background:rgba(255,255,255,0.015); border:1px solid #374151; padding:3px 8px; border-radius:4px; font-family:monospace; font-size:10px; color:#fff; font-weight:bold;">
                  ${iconHtml}
                  <span>+${mail.rewards.use[k]} ${k}</span>
              </div>
            `;
          });
        }

        if (mail.rewards.title) {
          let tKey = mail.rewards.title;
          let tData = window.TITLES_DATA[tKey];
          if (tData) {
            let iconHtml = tData.icon || "";
            let inlineIcon = iconHtml.replace('width="14" height="14"', 'width="12" height="12"').replace('margin-right: 3px;', 'margin-right: 4px;');
            rewardsHtml += `
              <div style="display:inline-flex; align-items:center; background:rgba(255,0,127,0.06); border:1px solid #ff007f; padding:3px 8px; border-radius:4px; font-family:monospace; font-size:10px; color:#fff; font-weight:bold; box-shadow:0 0 6px rgba(255,0,127,0.15);">
                  ${inlineIcon}
                  <span style="color:#ffb6c1;">Title: [${tData.name}]</span>
              </div>
            `;
          }
        }

    return `
      <div class="bag-item" style="border-left: 3px solid #e74c3c; background:#181c22; padding:8px 12px; margin-bottom:0; display:flex; flex-direction:column; gap:4px; text-align:left; cursor:default;">
          <div style="display:flex; justify-content:space-between; align-items:center; width:100%;">
              <strong style="color:#e74c3c; font-size:12.5px;">${mail.title}</strong>
              <div>${buttonHtml}</div>
          </div>
          <div style="font-size:11px; color:#ddd; white-space:normal; line-height:1.4; margin-bottom:4px;">${mail.message}</div>
          <div style="background:#0c0f12; border:1px solid #222; border-radius:4px; padding:8px 6px; display:flex; flex-wrap:wrap; gap:6px; align-items:center;">
              ${rewardsHtml}
          </div>
      </div>
    `;
  }).join("");
};

window.claimMailReward = function (mailId) {
  if (!window.GAME_SERVER_URL) return;
  const userId = window.getGameUserId();
  const claimedMailIds = window.playerStats.claimedMailIds || [];

  fetch(`${window.GAME_SERVER_URL}/api/claim-mail`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, mailId, claimedMailIds })
  })
  .then(response => response.json())
  .then(data => {
    if (data.success && data.rewards) {
      const rewards = data.rewards;

      // 1. Claim Gold
      if (rewards.coins) {
        window.playerStats.coins += rewards.coins;
        window.playerStats.totalGoldEarned = (window.playerStats.totalGoldEarned || 0) + rewards.coins;
      }

      // 2. Claim Materials
      if (rewards.etc) {
        Object.keys(rewards.etc).forEach(k => {
          if (typeof window.addEtcDrop === "function") {
            window.addEtcDrop(k, rewards.etc[k]);
          }
        });
      }

      // 3. Claim Consumables
            if (rewards.use) {
              Object.keys(rewards.use).forEach(k => {
                if (typeof window.addUseDrop === "function") {
                  window.addUseDrop(k, rewards.use[k]);
                }
              });
            }

            // 4. Claim Custom Title
            if (rewards.title) {
              let tKey = rewards.title;
              window.playerStats.unlockedTitles = window.playerStats.unlockedTitles || [];
              if (!window.playerStats.unlockedTitles.includes(tKey)) {
                window.playerStats.unlockedTitles.push(tKey);
              }
              window.playerStats.equippedTitle = tKey; // Auto-equip it!
            }

      // Register the claimed ID locally on success to prevent double claims if the server restarts
            window.playerStats.claimedMailIds = window.playerStats.claimedMailIds || [];
            if (!window.playerStats.claimedMailIds.includes(mailId)) {
              window.playerStats.claimedMailIds.push(mailId);
            }

            // Visual / Audio Feedback
            if (typeof window.spawnPurchaseCelebration === "function") {
              window.spawnPurchaseCelebration("gacha", "#e74c3c", 5); // Crimson celebration burst
            }
            if (window.SoundManager) window.SoundManager.play("revive");

            window.pushHeaderToast("🎁 Mailbox Rewards Claimed!", "#2ecc71");

            // Update UI & save the state immediately
            window.updateUI();
            window.renderInventory();
            window.saveGame();

            // Refresh current mailbox state
            window.fetchMailboxData();
    } else {
      window.pushHeaderToast(`❌ Error: ${data.error || 'Could not claim.'}`, "#e74c3c");
    }
  })
  .catch(err => {
    console.error("Mail claim failed:", err);
    window.pushHeaderToast("❌ Connection error claiming reward.", "#e74c3c");
  });
};

window.updateMailboxBadge = function (hasUnclaimed) {
  const btn = document.getElementById("btn-mailbox-top");
  if (!btn) return;

  if (hasUnclaimed) {
    btn.style.animation = "glowRed 1.8s infinite";
    btn.style.borderColor = "#e74c3c";
    if (!btn.querySelector(".badge-exclamation")) {
      btn.insertAdjacentHTML("beforeend", ' <span class="badge-exclamation" style="color:#e74c3c; font-weight:bold; margin-left:3px;">!</span>');
    }
  } else {
    btn.style.animation = "";
    btn.style.borderColor = "";
    const b = btn.querySelector(".badge-exclamation");
    if (b) b.remove();
  }
};

window.checkUnreadMail = function () {
  if (!window.GAME_SERVER_URL) return;
  const userId = window.getGameUserId ? window.getGameUserId() : null;
  if (!userId) return;

  fetch(`${window.GAME_SERVER_URL}/api/mailbox`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId })
  })
  .then(response => response.json())
  .then(data => {
    if (data.success && data.mailbox) {
      const hasUnclaimed = data.mailbox.some(m => !m.claimed);
      window.updateMailboxBadge(hasUnclaimed);
    }
  })
  .catch(() => {});
};