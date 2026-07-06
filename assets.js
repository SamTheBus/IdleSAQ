/* ==========================================================================
   PRIMARY PURPOSE: Centralized Declarative Vector Asset Catalog (AssetCatalog).
   Houses all procedural paths, gradients, and rendering blueprints.
   ========================================================================= */

window.AssetCatalog = {
  // Helper to compile inner SVG pathways into a unified, responsive HTML wrapper
  compile(
    viewBox,
    innerHtml,
    size = 32,
    bg = "rgba(170, 170, 170, 0.12)",
    border = "#444",
  ) {
    const shadow = "inset 0 0 6px rgba(0, 0, 0, 0.6)";
    return `
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
        box-shadow: ${shadow};
      ">
        <svg viewBox="${viewBox}" width="100%" height="100%" style="display:block;">
          ${innerHtml}
        </svg>
      </span>
    `;
  },

  uiIcons: {
    atk: {
      color: "#e74c3c",
      path: `<path d="M14.5 17.5L3 6V3h3l11.5 11.5 M13 19l6-6 M16 16l4 4 M19 21l2-2" />`,
      opacity: "0",
    },
    maxHp: {
      color: "#e74c3c",
      path: `<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />`,
      opacity: "0.15",
    },
    def: {
      color: "#3498db",
      path: `<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />`,
      opacity: "0.15",
    },
    moveSpeed: {
      color: "#3498db",
      path: `<path d="M6 5h5v6l8 4c2 1 2 4-1 4H6V5zm3 2h2M9 9h2" />`,
      opacity: "0",
    },
    critChance: {
      color: "#f1c40f",
      path: `<path d="M12 2 Q12 12, 2 12 Q12 12, 12 22 Q12 12, 22 12 Z" />`,
      opacity: "0",
    },
    critDamage: {
      color: "#e67e22",
      path: `<path d="M12 2l3 5.5 5.5-3-3 5.5 5.5 3-5.5 3 3 5.5-5.5-3-3 5.5-3-5.5-5.5 3 3-5.5-5.5-3 5.5-3-3-5.5 5.5 3z" />`,
      opacity: "0",
    },
    block: {
      color: "#3498db",
      path: `<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />`,
      opacity: "0.15",
    },
    parry: {
      color: "#9b59b6",
      path: `<path d="M4 20L20 4M4 20L2 22M5 15L9 19M20 20L4 4M20 20L22 22M15 19L19 15" />`,
      opacity: "0",
    },
    str: {
      color: "#e74c3c",
      path: `<path d="M18 10h-2V8c0-1.1-.9-2-2-2h-4c-1.1 0-2 .9-2 2v2H6c-1.1 0-2 .9-2 2v2c0 1.1.9 2 2 2h2v2c0 1.1.9 2 2 2h4c1.1 0 2-.9 2-2v-2h2c1.1 0 2-.9 2-2v-2c0-1.1-.9-2-2-2z" />`,
      opacity: "0.15",
    },
    dex: {
      color: "#e67e22",
      path: `<circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="3" /><path d="M12 1v4 M12 19v4 M1 12h4 M19 12h4" />`,
      opacity: "0.15",
    },
    int: {
      color: "#9b59b6",
      path: `<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" /><circle cx="12" cy="12" r="3" /><path d="M12 8v8 M8 12h8" />`,
      opacity: "0.15",
    },
    activeAttackSpeed: {
      color: "#e74c3c",
      path: `<path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />`,
      opacity: "0.15",
    },
    idleAttackSpeed: {
      color: "#3498db",
      path: `<circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />`,
      opacity: "0",
    },
    dropRate: {
      color: "#2ecc71",
      path: `<path d="M16 10c-1-1.5-2.5-2-4-2s-3 .5-4 2C6 12, 4 15, 4 19c0 4 3.5 6 8 6s8-2 8-6C20 15, 18 12, 16 10z M12 6a1.5 1.5 0 1 1 1.5-1.5A1.5 1.5 0 0 1 12 6z" />`,
      opacity: "0.15",
    },
    quality: {
      color: "#ec4899",
      path: `<path d="M6 3h12l4 6-10 12L2 9z" />`,
      opacity: "0.15",
    },
    goldMulti: {
      color: "#f1c40f",
      path: `<circle cx="12" cy="12" r="10" /><path d="M12 8v8M9 10h6M9 13h6" />`,
      opacity: "0.15",
    },
    gold: {
      color: "#f1c40f",
      path: `<circle cx="12" cy="12" r="10" /><path d="M12 8v8M9 10h6M9 13h6" />`,
      opacity: "0.15",
    },
    rareSpawn: {
      color: "#e67e22",
      path: `<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-5.82 2.15L7 14.14 2 9.27l6.91-1.01L12 2z" />`,
      opacity: "0.15",
    },
    fairySpawn: {
      color: "#ffb6c1",
      path: `<path d="M12 2c-.5 5-4 8-8 8 4 0 7.5 3 8 8 .5-5 4-8 8-8-4 0-7.5-3-8-8z" />`,
      opacity: "0.15",
    },
    barrier: {
      color: "#9b59b6",
      path: `<path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />`,
      opacity: "0.15",
    },
    xpRate: {
      color: "#a855f7",
      path: `<circle cx="12" cy="12" r="10" /><path d="M17 13l-5-5-5 5M17 17l-5-5-5 5" />`,
      opacity: "0.15",
    },
  },

  // Declarative database of custom multi-stop gradients
  gradients: {
    equip(id, color) {
      return `
        <defs>
          <linearGradient id="grad_eq_${id}" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#f8fafc"/>
            <stop offset="60%" stop-color="${color}"/>
            <stop offset="100%" stop-color="#475569"/>
          </linearGradient>
        </defs>
      `;
    },
    weapon(id, color) {
      return `
        <defs>
          <linearGradient id="grad_weap_${id}" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stop-color="#ffffff"/>
            <stop offset="50%" stop-color="${color}"/>
            <stop offset="100%" stop-color="#555555"/>
          </linearGradient>
        </defs>
      `;
    },
    shield(id, color) {
      return `
        <defs>
          <linearGradient id="grad_sh_${id}" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="${color}"/>
            <stop offset="100%" stop-color="#2c3e50"/>
          </linearGradient>
        </defs>
      `;
    },
    liquid(id, color) {
      return `
        <defs>
          <linearGradient id="grad_liq_${id}" x1="0" y1="100%" x2="0" y2="0%">
            <stop offset="0%" stop-color="rgba(0,0,0,0.3)"/>
            <stop offset="30%" stop-color="${color}"/>
            <stop offset="85%" stop-color="${color}"/>
            <stop offset="100%" stop-color="#ffffff"/>
          </linearGradient>
        </defs>
      `;
    },
  },

  // Blueprints for procedurally rendering generic equipment based on slots
    genericEquipment: {
      // --- SPECIALIZED NOUN Blueprints ---
      greatsword(id, color) {
        return `
          ${window.AssetCatalog.gradients.weapon(id, color)}
          <path d="M14 2 L18 2 L18 20 L14 20 Z" fill="url(#grad_weap_${id})" stroke="#000" stroke-width="1.8" />
          <path d="M9 20 L23 20 L16 23 Z" fill="${color}" stroke="#000" stroke-width="1.5" />
          <rect x="14.5" y="23" width="3" height="6" fill="#4d2f12" stroke="#000" stroke-width="1" />
          <circle cx="16" cy="29.5" r="1.5" fill="${color}" stroke="#000" stroke-width="1" />
        `;
      },
      warhammer(id, color) {
        return `
          <line x1="16" y1="12" x2="16" y2="30" stroke="#5c3a21" stroke-width="2.5" stroke-linecap="round" />
          <rect x="9" y="4" width="14" height="8" rx="2" fill="#7f8c8d" stroke="#000" stroke-width="1.8" />
          <path d="M7 6 L9 6 L9 10 L7 10 Z" fill="${color}" stroke="#000" stroke-width="1" />
          <path d="M23 6 L25 6 L25 10 L23 10 Z" fill="${color}" stroke="#000" stroke-width="1" />
          <polygon points="16,1 18,4 14,4" fill="${color}" stroke="#000" stroke-width="1" />
          <line x1="16" y1="12" x2="16" y2="20" stroke="${color}" stroke-width="1" />
        `;
      },
      battleaxe(id, color) {
        return `
          <line x1="16" y1="6" x2="16" y2="30" stroke="#4d2f12" stroke-width="2.5" stroke-linecap="round" />
          <path d="M16 8 Q7 4, 10 14 Q14 18, 16 16" fill="${color}" stroke="#000" stroke-width="1.8" />
          <path d="M16 8 Q25 4, 22 14 Q18 18, 16 16" fill="${color}" stroke="#000" stroke-width="1.8" />
          <circle cx="16" cy="12" r="2.5" fill="#f1c40f" stroke="#000" stroke-width="1.2" />
          <polygon points="16,3 18,6 14,3" fill="#bdc3c7" stroke="#000" stroke-width="1" />
        `;
      },
      broadsword(id, color) {
        return `
          ${window.AssetCatalog.gradients.weapon(id, color)}
          <path d="M13 3 L19 3 L18 20 L14 20 Z" fill="url(#grad_weap_${id})" stroke="#000" stroke-width="1.8" />
          <rect x="9" y="20" width="14" height="2.5" rx="0.5" fill="${color}" stroke="#000" stroke-width="1.2" />
          <rect x="14" y="22.5" width="4" height="6" fill="#3b3b3b" stroke="#000" stroke-width="1" />
          <circle cx="16" cy="29.5" r="1.5" fill="${color}" stroke="#000" stroke-width="1" />
        `;
      },
      kite_shield(id, color) {
            return `
              ${window.AssetCatalog.gradients.shield(id, color)}
              <path d="M7 5 Q16 3, 25 5 Q23 18, 16 29 Q9 18, 7 5 Z" fill="url(#grad_sh_${id})" stroke="#000" stroke-width="2" />
              <path d="M12 9 Q16 7, 20 9 L18 18 Q16 23, 16 23 L14 18 Z" fill="none" stroke="#fff" stroke-width="1" opacity="0.6" />
            `;
          },
          tower_shield(id, color) {
            return `
              ${window.AssetCatalog.gradients.shield(id, color)}
              <rect x="8" y="4" width="16" height="24" rx="2" fill="url(#grad_sh_${id})" stroke="#000" stroke-width="2" />
              <line x1="16" y1="4" x2="16" y2="28" stroke="#000" stroke-width="1.5" />
              <circle cx="11" cy="8" r="1" fill="#fff" /><circle cx="21" cy="8" r="1" fill="#fff" />
              <circle cx="11" cy="16" r="1" fill="#fff" /><circle cx="21" cy="16" r="1" fill="#fff" />
              <circle cx="11" cy="24" r="1" fill="#fff" /><circle cx="21" cy="24" r="1" fill="#fff" />
            `;
          },
          buckler(id, color) {
            return `
              <circle cx="16" cy="16" r="11" fill="${color}" stroke="#000" stroke-width="2" />
              <circle cx="16" cy="16" r="7" fill="#2c3e50" stroke="#000" stroke-width="1.5" />
              <circle cx="16" cy="16" r="3" fill="#ffffff" stroke="#000" stroke-width="1" />
              <line x1="16" y1="5" x2="16" y2="27" stroke="#111" stroke-dasharray="2 2" stroke-width="1" />
              <line x1="5" y1="16" x2="27" y2="16" stroke="#111" stroke-dasharray="2 2" stroke-width="1" />
            `;
          },
          heater_shield(id, color) {
            return `
              ${window.AssetCatalog.gradients.shield(id, color)}
              <path d="M6 5 H26 V14 C26 22, 16 29, 16 29 C16 29, 6 22, 6 14 Z" fill="url(#grad_sh_${id})" stroke="#000" stroke-width="2" stroke-linejoin="round" />
              <path d="M12 9 H20 M16 9 V23" stroke="${color}" stroke-width="2" stroke-linecap="round" fill="none" />
            `;
          },
          aegis(id, color) {
            return `
              ${window.AssetCatalog.gradients.shield(id, color)}
              <path d="M16 3 L27 8 L24 22 L16 29 L8 22 L5 8 Z" fill="url(#grad_sh_${id})" stroke="#000" stroke-width="2" stroke-linejoin="round" />
              <circle cx="16" cy="16" r="5" fill="none" stroke="#fff" stroke-dasharray="3 1.5" stroke-width="1.2" />
              <circle cx="16" cy="16" r="3.2" fill="${color}" stroke="#000" stroke-width="1" />
            `;
          },
          kris(id, color) {
            return `
              <!-- Wavy kris blade -->
              <path d="M16 4 Q19 7, 16 10 Q13 13, 16 16 L17 19 L15 19 L14 16 Q17 13, 14 10 Q11 7, 14 4 Z" fill="#bdc3c7" stroke="#000" stroke-width="1.5" stroke-linejoin="round" />
              <rect x="11" y="19" width="10" height="2.2" rx="0.5" fill="${color}" stroke="#000" stroke-width="1" />
              <path d="M14.5 21 L13 26 Q16 29, 19 26 L17.5 21 Z" fill="#4a2711" stroke="#000" stroke-width="1" />
            `;
          },
          stiletto(id, color) {
            return `
              <!-- Ultra thin piercing needle stiletto blade -->
              <path d="M15.5 3 H16.5 L17 19 H15 Z" fill="#bdc3c7" stroke="#000" stroke-width="1.5" />
              <rect x="11" y="19" width="10" height="2" rx="0.5" fill="${color}" stroke="#000" stroke-width="1" />
              <rect x="14.5" y="21" width="3" height="7" rx="0.5" fill="#111" stroke="#000" stroke-width="1" />
              <circle cx="16" cy="28.5" r="1.5" fill="${color}" stroke="#000" stroke-width="0.8" />
            `;
          },
          baselard(id, color) {
            return `
              <!-- Straight broad diamond blade -->
              <path d="M16 4 L18 8 L17 19 H15 L14 8 Z" fill="#95a5a6" stroke="#000" stroke-width="1.8" />
              <!-- H-shaped hilt guard -->
              <rect x="10" y="19" width="12" height="2.5" fill="${color}" stroke="#000" stroke-width="1" />
              <rect x="14.5" y="21.5" width="3" height="5" fill="#4a2306" stroke="#000" stroke-width="1" />
              <!-- H-shaped pommel -->
              <rect x="11" y="26.5" width="10" height="2.5" fill="${color}" stroke="#000" stroke-width="1" />
            `;
          },
          dirk(id, color) {
            return `
              <!-- Single edged heavy dirk blade -->
              <path d="M15 4 L17.5 7 L17.5 19 H14.5 Z" fill="#bdc3c7" stroke="#000" stroke-width="1.8" />
              <rect x="12" y="19" width="8" height="2" fill="${color}" stroke="#000" stroke-width="1" />
              <rect x="14" y="21" width="4" height="6.5" fill="#5c3a21" stroke="#000" stroke-width="1" />
              <circle cx="16" cy="28" r="1.8" fill="${color}" stroke="#000" stroke-width="0.8" />
            `;
          },
          main_gauche(id, color) {
            return `
              <!-- Main Gauche curved guard dagger -->
              <path d="M16 4 L17.8 8 L17 19 H15 L14.2 8 Z" fill="#bdc3c7" stroke="#000" stroke-width="1.8" />
              <!-- Ornate curved crossguard -->
              <path d="M9 19 Q16 16, 23 19" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" />
              <!-- Finger protection basket ring -->
              <path d="M13 19 C13 23, 19 23, 19 19" fill="none" stroke="${color}" stroke-width="1.5" />
              <rect x="14.5" y="21" width="3" height="6" fill="#111" stroke="#000" stroke-width="1" />
            `;
          },
      grimoire(id, color) {
            return `
              <!-- Deep Purple/Black Ritual Binding -->
              <rect x="5" y="4" width="22" height="24" rx="2" fill="#1b002a" stroke="#000" stroke-width="1.8" />
              <rect x="5" y="4" width="4.5" height="24" fill="#0d001a" stroke="#000" stroke-width="1" />
              <!-- Occult Golden Crescent Moon and Star -->
              <path d="M19 12 C19 16, 14 20, 14 20 C14 20, 18 18, 18 12 C18 6, 14 4, 14 4 C14 4, 19 8, 19 12 Z" fill="#f1c40f" stroke="#000" stroke-width="0.8" transform="translate(1, 0)" />
              <polygon points="15,10 16,12 14,12" fill="${color}" />
              <!-- Forbidden Seal Lock -->
              <rect x="25" y="13" width="3" height="6" rx="0.5" fill="#f1c40f" stroke="#000" stroke-width="1" />
            `;
          },
               codex(id, color) {
                 return `
                   <!-- Brass and Bronze Clad Cover -->
                   <rect x="6" y="4" width="20" height="24" rx="2" fill="#784212" stroke="#000" stroke-width="2" />
                   <rect x="6" y="4" width="4" height="24" fill="#4a2306" stroke="#000" stroke-width="1" />
                   <!-- Rotating Mechanical Gears -->
                   <circle cx="17" cy="16" r="6" fill="none" stroke="#bdc3c7" stroke-dasharray="2 1.5" stroke-width="1.8" />
                   <circle cx="17" cy="16" r="4" fill="${color}" stroke="#111" stroke-width="1" />
                   <circle cx="17" cy="16" r="1.5" fill="#fff" />
                 `;
               },
               lexicon(id, color) {
                 return `
                   <!-- Heavy Academic Blue Bound Cover -->
                   <rect x="6" y="4" width="20" height="24" rx="2" fill="#1b4f72" stroke="#000" stroke-width="2" />
                   <rect x="6" y="4" width="4.5" height="24" fill="#113047" stroke="#000" stroke-width="1" />
                   <!-- Gold spine Ribs -->
                   <line x1="6" y1="9" x2="10" y2="9" stroke="#f1c40f" stroke-width="1" />
                   <line x1="6" y1="16" x2="10" y2="16" stroke="#f1c40f" stroke-width="1" />
                   <line x1="6" y1="23" x2="10" y2="23" stroke="#f1c40f" stroke-width="1" />
                   <!-- Scholar's Glowing Eye of Knowledge -->
                   <path d="M11 16 Q17 10, 23 16 Q17 22, 11 16 Z" fill="none" stroke="#fff" stroke-width="1.5" />
                   <circle cx="17" cy="16" r="3" fill="${color}" stroke="#000" stroke-width="1" />
                 `;
               },
               chronicle(id, color) {
                 return `
                   <!-- Relic leather book of past lives -->
                   <rect x="6" y="4" width="20" height="24" rx="2" fill="#4d1a00" stroke="#000" stroke-width="2" />
                   <rect x="6" y="4" width="4" height="24" fill="#2d1000" stroke="#000" stroke-width="1" />
                   <!-- Golden Hourglass symbol -->
                   <path d="M13 10 L21 10 L17 16 L21 22 L13 22 Z" fill="none" stroke="#f1c40f" stroke-width="1.5" />
                   <!-- Sand hourglass vials inside -->
                   <polygon points="14,11 20,11 17,15" fill="${color}" />
                   <polygon points="17,17 19,21 15,21" fill="${color}" />
                 `;
               },
      greathelm(id, color) {
            return `
              <!-- Bucket Knight Helm -->
              <path d="M9 8 H23 V23 L16 29 L9 23 Z" fill="#7f8c8d" stroke="#000" stroke-width="1.8" />
              <!-- Crest plume on top matching quality tiers -->
              <path d="M16 8 Q12 1, 16 2 Q20 1, 16 8" fill="${color}" stroke="#000" stroke-width="1" />
              <!-- Golden T-shaped visor bar -->
              <path d="M12 12 H20 M16 12 V22" stroke="#f1c40f" stroke-width="2.5" stroke-linecap="round" fill="none" />
              <path d="M12 12 H20 M16 12 V22" stroke="#000" stroke-width="1" stroke-linecap="round" fill="none" />
              <!-- Breathing vents -->
              <circle cx="12" cy="17" r="0.8" fill="#111" /><circle cx="14" cy="17" r="0.8" fill="#111" />
              <circle cx="18" cy="17" r="0.8" fill="#111" /><circle cx="20" cy="17" r="0.8" fill="#111" />
              <circle cx="12" cy="20" r="0.8" fill="#111" /><circle cx="14" cy="20" r="0.8" fill="#111" />
              <circle cx="18" cy="20" r="0.8" fill="#111" /><circle cx="20" cy="20" r="0.8" fill="#111" />
            `;
          },
          armet(id, color) {
            return `
              <!-- Renaissance Armet Helm -->
              <path d="M9 10 C9 4, 23 4, 23 10 L24 23 L16 29 L8 23 Z" fill="#7f8c8d" stroke="#000" stroke-width="1.8" />
              <!-- Articulated Visor Plate with tier highlighted line -->
              <path d="M9 12 Q16 7, 23 12 L21 19 L11 19 Z" fill="#95a5a6" stroke="#000" stroke-width="1.2" />
              <!-- Eye slits -->
              <line x1="11" y1="13.5" x2="21" y2="13.5" stroke="#111" stroke-width="1.5" />
              <circle cx="16" cy="16" r="1.2" fill="${color}" stroke="#000" stroke-width="0.8" />
            `;
          },
          bascinet(id, color) {
            return `
              <!-- Pointed houndskull helmet -->
              <path d="M9 12 C9 5, 23 5, 23 12 L24 23 L16 29 L8 23 Z" fill="#7f8c8d" stroke="#000" stroke-width="1.8" stroke-linejoin="round" />
              <!-- Snout-like pointed visor -->
              <polygon points="10,11 16,15 22,11 20,20 16,24 12,20" fill="#95a5a6" stroke="#000" stroke-width="1.2" />
              <!-- Angled squint slits -->
              <line x1="11" y1="13" x2="15" y2="14" stroke="#111" stroke-width="1.8" stroke-linecap="round" />
              <line x1="21" y1="13" x2="17" y2="14" stroke="#111" stroke-width="1.8" stroke-linecap="round" />
              <!-- Breath ventilation dots on snout matching quality color -->
              <circle cx="15" cy="18" r="0.8" fill="${color}" />
              <circle cx="17" cy="18" r="0.8" fill="${color}" />
              <circle cx="14" cy="20" r="0.8" fill="${color}" />
              <circle cx="18" cy="20" r="0.8" fill="${color}" />
            `;
          },
          barbuta(id, color) {
            return `
              <!-- Classical Italian T-vent helmet -->
              <path d="M9 10 C9 4, 23 4, 23 10 L24 24 L16 29 L8 24 Z" fill="#7f8c8d" stroke="#000" stroke-width="1.8" stroke-linejoin="round" />
              <!-- Distinct T-shaped face opening -->
              <path d="M12 10 H20 V16 L17 16 V24 H15 V16 L12 16 Z" fill="#111" stroke="${color}" stroke-width="1.5" stroke-linejoin="round" />
              <!-- Center ridge line -->
              <path d="M16 4 V10" stroke="#000" stroke-width="2" />
            `;
          },
          circlet(id, color) {
            return `
              <path d="M6 18 Q16 11, 26 18 Q16 23, 6 18 Z" fill="none" stroke="${color}" stroke-width="2.5" />
              <polygon points="16,11 19,15 13,15" fill="${color}" stroke="#000" stroke-width="1" />
              <circle cx="16" cy="9.5" r="1.5" fill="#fff" stroke="#000" stroke-width="0.8" />
              <circle cx="10" cy="15.5" r="1.2" fill="#fff" stroke="#000" stroke-width="0.8" />
              <circle cx="22" cy="15.5" r="1.2" fill="#fff" stroke="#000" stroke-width="0.8" />
            `;
          },
          coif(id, color) {
            return `
              <path d="M9 10 C9 5, 23 5, 23 10 L24 22 L16 28 L8 22 Z" fill="#7f8c8d" stroke="#000" stroke-width="1.8" stroke-linejoin="round" />
              <path d="M12 15 Q16 13, 20 15 L18 22 Q16 24, 16 24 L14 22 Z" fill="#2c3e50" stroke="#000" stroke-width="1.2" />
              <circle cx="16" cy="16" r="6" fill="none" stroke="#ffffff" stroke-dasharray="2 2" stroke-width="1" opacity="0.6" />
            `;
          },
          visor(id, color) {
            return `
              <!-- Heavy helm with pivoting visor -->
              <path d="M9 10 C9 4, 23 4, 23 10 L24 24 L16 29 L8 24 Z" fill="#7f8c8d" stroke="#000" stroke-width="1.8" stroke-linejoin="round" />
              <!-- Visor plate with V-vent -->
              <path d="M9 10 L23 10 L21 21 L16 24 L11 21 Z" fill="#95a5a6" stroke="#000" stroke-width="1.2" />
              <rect x="11.5" y="12" width="9" height="1.8" fill="#111" />
              <!-- Pivot rivets on sides -->
              <circle cx="8" cy="12" r="1.5" fill="${color}" stroke="#000" stroke-width="0.8" />
              <circle cx="24" cy="12" r="1.5" fill="${color}" stroke="#000" stroke-width="0.8" />
              <!-- Slit breathers -->
              <line x1="14" y1="17" x2="18" y2="17" stroke="#111" stroke-width="1" />
              <line x1="13" y1="19" x2="19" y2="19" stroke="#111" stroke-width="1" />
            `;
          },
      cuirass(id, color) {
            return `
              <!-- heavy sculpted steel breastplate with tier pauldrons -->
              <path d="M8 8 L24 8 L22 22 L16 26 L10 22 Z" fill="#7f8c8d" stroke="#000" stroke-width="1.8" />
              <path d="M4 9 Q8 6, 9 12 L7 14 Z" fill="${color}" stroke="#000" stroke-width="1.2" />
              <path d="M28 9 Q20 6, 23 12 L25 14 Z" fill="${color}" stroke="#000" stroke-width="1.2" />
              <path d="M12 13 Q16 15, 20 13" fill="none" stroke="#333" stroke-width="1.5" />
              <path d="M11 18 Q16 20, 21 18" fill="none" stroke="#333" stroke-width="1.5" />
              <line x1="16" y1="8" x2="16" y2="24" stroke="#333" stroke-width="1.5" />
            `;
          },
          hauberk(id, color) {
            return `
              <!-- Chainmail vest -->
              <path d="M8 7 L24 7 L24 23 L16 28 L8 23 Z" fill="#95a5a6" stroke="#000" stroke-width="1.8" />
              <path d="M8 12 H24 M8 17 H24 M8 22 H24" stroke="rgba(0,0,0,0.25)" stroke-width="1.5" stroke-dasharray="2 2" />
              <rect x="11" y="5" width="10" height="4" fill="${color}" stroke="#000" stroke-width="1" />
            `;
          },
          brigandine(id, color) {
            return `
              <!-- Studded leather/velvet armor doublet -->
              <path d="M8 8 L24 8 L22 22 L16 26 L10 22 Z" fill="#2c3e50" stroke="#000" stroke-width="1.8" />
              <!-- Rivet studs (dots) matching Tier Color -->
              <circle cx="12" cy="11" r="1" fill="${color}" /><circle cx="16" cy="11" r="1" fill="${color}" /><circle cx="20" cy="11" r="1" fill="${color}" />
              <circle cx="10" cy="15" r="1" fill="${color}" /><circle cx="14" cy="15" r="1" fill="${color}" /><circle cx="18" cy="15" r="1" fill="${color}" /><circle cx="22" cy="15" r="1" fill="${color}" />
              <circle cx="12" cy="19" r="1" fill="${color}" /><circle cx="16" cy="19" r="1" fill="${color}" /><circle cx="20" cy="19" r="1" fill="${color}" />
              <!-- Neck guard -->
              <path d="M10 8 Q16 11, 22 8" fill="none" stroke="#5c3a21" stroke-width="1.5" />
            `;
          },
          plate_mail(id, color) {
            return `
              <!-- Heavy segmented horizontal plates -->
              <path d="M8 8 L24 8 L22 22 L16 26 L10 22 Z" fill="#7f8c8d" stroke="#000" stroke-width="1.8" />
              <!-- Segmented plate seams -->
              <path d="M9 12 C9 12, 16 14, 23 12" fill="none" stroke="#333" stroke-width="1.5" />
              <path d="M9.5 16 C9.5 16, 16 18, 22.5 16" fill="none" stroke="#333" stroke-width="1.5" />
              <path d="M10 20 C10 20, 16 22, 22 20" fill="none" stroke="#333" stroke-width="1.5" />
              <!-- Colored vertical bracing harness straps -->
              <line x1="12" y1="8" x2="12" y2="23" stroke="${color}" stroke-width="1.5" />
              <line x1="20" y1="8" x2="20" y2="23" stroke="${color}" stroke-width="1.5" />
            `;
          },
          doublet(id, color) {
            return `
              <!-- Fabric vest with white undershirt and gold buttons -->
              <path d="M8 8 L24 8 L22 22 L16 26 L10 22 Z" fill="${color}" stroke="#000" stroke-width="1.8" />
              <polygon points="12,8 16,13 20,8" fill="#fff" stroke="#000" stroke-width="1" />
              <line x1="16" y1="8" x2="16" y2="13" stroke="#000" stroke-width="1" />
              <path d="M8 8 L12 14 L10 16" fill="none" stroke="#111" stroke-width="1.5" />
              <path d="M24 8 L20 14 L22 16" fill="none" stroke="#111" stroke-width="1.5" />
              <circle cx="16" cy="15" r="1.2" fill="#f1c40f" stroke="#000" stroke-width="0.8" />
              <circle cx="16" cy="19" r="1.2" fill="#f1c40f" stroke="#000" stroke-width="0.8" />
            `;
          },
          inquisitor_robes(id, color) {
            return `
              <!-- Fabric draped robes with hood -->
              <path d="M6 14 L26 14 L23 29 L16 30 L9 29 Z" fill="#34495e" stroke="#000" stroke-width="1.8" />
              <path d="M8 12 Q16 16, 24 12 L22 18 Q16 22, 10 18 Z" fill="${color}" stroke="#000" stroke-width="1.5" />
              <path d="M11 12 C11 5, 21 5, 21 12 Z" fill="#2c3e50" stroke="#000" stroke-width="1.5" />
              <path d="M13 12 C13 8, 19 8, 19 12 Z" fill="#111" />
              <line x1="16" y1="18" x2="16" y2="29" stroke="#f1c40f" stroke-width="1.2" />
            `;
          },
          full_plate_armor(id, color) {
            return `
              <!-- Articulated full steel suit -->
              <path d="M8 6 L24 6 L22 20 L16 24 L10 20 Z" fill="#7f8c8d" stroke="#000" stroke-width="1.8" />
              <path d="M10 20 H22 L24 28 H8 Z" fill="#95a5a6" stroke="#000" stroke-width="1.5" />
              <!-- Rounded heavy pauldrons with tier color trims -->
              <path d="M4 10 C4 6, 10 7, 10 13 Z" fill="${color}" stroke="#000" stroke-width="1.2" />
              <path d="M28 10 C28 6, 22 7, 22 13 Z" fill="${color}" stroke="#000" stroke-width="1.2" />
              <!-- Fluted chest detailing -->
              <path d="M12 11 L16 16 L20 11 M12 15 L16 19 L20 15" fill="none" stroke="#333" stroke-width="1.2" />
              <!-- Heavy iron belt buckle -->
              <rect x="14" y="19" width="4" height="3" fill="#f1c40f" stroke="#000" stroke-width="1" />
            `;
          },
      exosuit(id, color) {
        return `
          <!-- Sci-fi mechanical armature with chest core -->
          <rect x="7" y="6" width="18" height="21" rx="3" fill="#2c3e50" stroke="#000" stroke-width="2" />
          <path d="M4 10 Q8 6, 9 12 Z M28 10 Q24 6, 23 12 Z" fill="#34495e" stroke="#000" stroke-width="1.2" />
          <path d="M12 12 L16 16 L20 12" fill="none" stroke="${color}" stroke-width="1.5" />
          <path d="M12 18 L16 16 L20 18" fill="none" stroke="${color}" stroke-width="1.5" />
          <circle cx="16" cy="16" r="3.5" fill="#fff" stroke="${color}" stroke-width="1.5" />
        `;
      },
      trenchcoat(id, color) {
        return `
          <!-- Sleek draped coat with popped collar -->
          <path d="M7 6 L25 6 L22 29 L16 30 L10 29 Z" fill="#2c3e50" stroke="#000" stroke-width="1.8" />
          <polygon points="7,6 12,14 10,6" fill="${color}" stroke="#000" stroke-width="1" />
          <polygon points="25,6 20,14 22,6" fill="${color}" stroke="#000" stroke-width="1" />
          <rect x="9.5" y="16" width="13" height="3" fill="#111" stroke="#000" stroke-width="1" />
          <rect x="15" y="15.5" width="2" height="4" fill="#f1c40f" stroke="#000" stroke-width="0.8" />
          <line x1="16" y1="19" x2="16" y2="29" stroke="#111" stroke-width="1.5" />
        `;
      },

      // --- GENERIC SLOT Blueprints ---
      weapon(id, color) {
        return `
          ${window.AssetCatalog.gradients.weapon(id, color)}
          <path d="M16 3 L19 8 L18 21 L14 21 L13 8 Z" fill="url(#grad_weap_${id})" stroke="#000" stroke-width="1.8" />
          <rect x="11" y="21" width="10" height="2.5" rx="0.5" fill="#f1c40f" stroke="#000" stroke-width="1.2" />
          <rect x="14.5" y="23.5" width="3" height="5" fill="#5c3a21" stroke="#000" stroke-width="1" />
          <circle cx="16" cy="29.5" r="1.5" fill="#f1c40f" stroke="#000" stroke-width="1" />
        `;
      },
    shield(id, color) {
      return `
        ${window.AssetCatalog.gradients.shield(id, color)}
        <path d="M6 6 Q16 4, 26 6 Q25 18, 16 28 Q7 18, 6 6 Z" fill="url(#grad_sh_${id})" stroke="#000" stroke-width="1.8" />
        <path d="M11 11 Q16 9, 21 11 L19 19 Q16 23, 16 23 Q16 23, 13 19 Z" fill="none" stroke="#ffffff" stroke-width="1.2" opacity="0.55" />
      `;
    },
    dagger(id, color) {
      return `
        <path d="M16 4 L18 9 L17 19 L15 19 L14 9 Z" fill="#bdc3c7" stroke="#000" stroke-width="1.8" />
        <rect x="12" y="19" width="8" height="2" fill="${color}" stroke="#000" stroke-width="1.2" />
        <rect x="14.5" y="21" width="3" height="4" fill="#3b2f2f" stroke="#000" stroke-width="1" />
      `;
    },
    tome(id, color) {
          return `
            <!-- Heavy Leather Bound Cover -->
            <rect x="6" y="4" width="20" height="24" rx="2" fill="#2d1a0d" stroke="#000" stroke-width="1.8" />
            <!-- Book Spine Binding -->
            <rect x="6" y="4" width="4" height="24" fill="#1c0f07" stroke="#000" stroke-width="1" />
            <!-- Gold Corner Brackets -->
            <polygon points="10,4 12,4 10,6" fill="#f1c40f" />
            <polygon points="26,4 24,4 26,6" fill="#f1c40f" />
            <polygon points="10,28 12,28 10,26" fill="#f1c40f" />
            <polygon points="26,28 24,28 26,26" fill="#f1c40f" />
            <!-- Inner Page Edge line details -->
            <line x1="25" y1="5" x2="25" y2="27" stroke="#eaeaea" stroke-width="1.2" />
            <!-- Central Mystical Sphere scaling with Tier Color -->
            <circle cx="17" cy="16" r="4.5" fill="${color}" stroke="#000" stroke-width="1.2" />
            <circle cx="15.5" cy="14.5" r="1" fill="#fff" opacity="0.6" />
          `;
        },
    helmet(id, color) {
      return `
        ${window.AssetCatalog.gradients.equip(id, color)}
        <path d="M8 12 C8 6, 24 6, 24 12 L25 24 L16 30 L7 24 Z" fill="url(#grad_eq_${id})" stroke="#000" stroke-width="1.8" stroke-linejoin="round" />
        <path d="M15 6 L17 6 L17 30 L15 30 Z" fill="${color}" stroke="#000" stroke-width="1" />
        <path d="M8 14 L24 14 L24 17 L8 17 Z" fill="${color}" stroke="#000" stroke-width="1" />
        <path d="M10 15 H14 V21 H10 Z M18 15 H22 V21 H18 Z" fill="#000" />
        <circle cx="11" cy="24" r="1" fill="#000" /><circle cx="13" cy="24" r="1" fill="#000" />
        <circle cx="11" cy="26" r="1" fill="#000" /><circle cx="13" cy="26" r="1" fill="#000" />
        <circle cx="19" cy="24" r="1" fill="#000" /><circle cx="21" cy="24" r="1" fill="#000" />
        <circle cx="19" cy="26" r="1" fill="#000" /><circle cx="21" cy="26" r="1" fill="#000" />
      `;
    },
    chest(id, color) {
          return `
            <!-- Left & Right Shoulder Pauldrons -->
            <path d="M4 11 C4 6, 11 8, 11 13 Z" fill="${color}" stroke="#000" stroke-width="1.2" />
            <path d="M28 11 C28 6, 21 8, 21 13 Z" fill="${color}" stroke="#000" stroke-width="1.2" />
            <!-- Main Chestplate Body with high-contrast steel shading -->
            <path d="M8 8 L24 8 L22 22 L16 26 L10 22 Z" fill="#7f8c8d" stroke="#000" stroke-width="1.8" />
            <!-- Dynamic Trim Accents matching quality tiers -->
            <path d="M11 14 H21" stroke="${color}" stroke-width="2.2" stroke-linecap="round" />
            <path d="M11 18 H21" stroke="${color}" stroke-width="2.2" stroke-linecap="round" />
          `;
        },
        leggings(id, color) {
              return `
                <rect x="7" y="6" width="18" height="5" rx="1.5" fill="${color}" stroke="#000" stroke-width="1.5" />
                <path d="M7 11 L13 11 L12 18 L7 17 Z M19 11 L25 11 L25 17 L20 18 Z" fill="#7f8c8d" stroke="#000" stroke-width="1.5" stroke-linejoin="round" />
                <path d="M9 18 L14 18 L13 28 L9 28 Z" fill="#95a5a6" stroke="#000" stroke-width="1.5" stroke-linejoin="round" />
                <circle cx="11.5" cy="20" r="2.2" fill="${color}" stroke="#000" stroke-width="1" />
                <path d="M18 18 L23 18 L23 28 L19 28 Z" fill="#95a5a6" stroke="#000" stroke-width="1.5" stroke-linejoin="round" />
                <circle cx="20.5" cy="20" r="2.2" fill="${color}" stroke="#000" stroke-width="1" />
              `;
            },
            greaves(id, color) {
                  return `
                    <!-- Leather back straps wrapping behind -->
                    <path d="M4 14 H14 M4 22 H14 M18 14 H28 M18 22 H28" stroke="#5c3a21" stroke-width="2.2" stroke-linecap="round" fill="none" />
                    <!-- Left Shin Guard: Curved/Tapered Plate -->
                    <path d="M5 10 L13 10 L12 28 H6 Z" fill="#7f8c8d" stroke="#000" stroke-width="1.8" stroke-linejoin="round" />
                    <!-- Left Highlight (Specular Reflection) -->
                    <path d="M9 10 L12 10 L11 27 H9 Z" fill="#ffffff" opacity="0.25" />
                    <!-- Left Knee Guard (Poleyn) -->
                    <path d="M4 8 Q9 5, 14 8 L13 12 H5 Z" fill="${color}" stroke="#000" stroke-width="1.2" />
                    <circle cx="9" cy="10" r="1.2" fill="#fff" />

                    <!-- Right Shin Guard: Curved/Tapered Plate -->
                    <path d="M19 8 L27 8 L26 28 H20 Z" fill="#7f8c8d" stroke="#000" stroke-width="1.8" stroke-linejoin="round" />
                    <circle cx="23" cy="12" r="1.5" fill="${color}" stroke="#000" stroke-width="0.8" />
                    <!-- Right Highlight (Specular Reflection) -->
                    <path d="M23 10 L26 10 L25 27 H23 Z" fill="#ffffff" opacity="0.25" />
                    <!-- Right Knee Guard (Poleyn) -->
                    <path d="M18 8 Q23 5, 28 8 L27 12 H19 Z" fill="${color}" stroke="#000" stroke-width="1.2" />
                    <circle cx="23" cy="10" r="1.2" fill="#fff" />
                  `;
                },
                legplates(id, color) {
                  return `
                    <!-- Heavy overlapping segmented plate guard -->
                    <rect x="7" y="6" width="18" height="5" rx="1.5" fill="${color}" stroke="#000" stroke-width="1.5" />
                    <!-- Left leg plate stack -->
                    <path d="M7 11 H13 V28 H7 Z" fill="#7f8c8d" stroke="#000" stroke-width="1.8" />
                    <path d="M7 16 H13 M7 21 H13 M7 25 H13" stroke="#333" stroke-width="1.5" />
                    <!-- Left Highlight -->
                    <path d="M10 11 L13 11 L13 27 H10 Z" fill="#fff" opacity="0.15" />
                    <!-- Right leg plate stack -->
                    <path d="M19 11 H25 V28 H19 Z" fill="#7f8c8d" stroke="#000" stroke-width="1.8" />
                    <path d="M19 16 H25 M19 21 H25 M19 25 H25" stroke="#333" stroke-width="1.5" />
                    <!-- Right Highlight -->
                    <path d="M22 11 L25 11 L25 27 H22 Z" fill="#fff" opacity="0.15" />
                  `;
                },
            chausses(id, color) {
              return `
                <!-- Chainmail leg wraps with colored leather belts -->
                <rect x="7" y="5" width="18" height="4" fill="${color}" stroke="#000" stroke-width="1.5" />
                <path d="M7 9 L13 9 L11 28 H7 Z" fill="#95a5a6" stroke="#000" stroke-width="1.8" />
                <path d="M19 9 L25 9 L25 28 H21 Z" fill="#95a5a6" stroke="#000" stroke-width="1.8" />
                <!-- Chain weave indicators -->
                <path d="M7 12 H13 M7 16 H13 M7 20 H13 M7 24 H13 M19 12 H25 M19 16 H25 M19 20 H25 M19 24 H25" stroke="rgba(0,0,0,0.3)" stroke-width="1" stroke-dasharray="2 1" />
              `;
            },
            cuisses(id, color) {
              return `
                <!-- Leather padded cuisses with color knee caps -->
                <path d="M7 8 L13 8 L11 24 H7 Z" fill="#5c3a21" stroke="#000" stroke-width="1.8" />
                <path d="M19 8 L25 8 L25 24 H21 Z" fill="#5c3a21" stroke="#000" stroke-width="1.8" />
                <!-- Padded stich details -->
                <path d="M7 12 L13 16 M7 16 L11 20 M19 12 L25 16 M19 16 L23 20" stroke="rgba(255,255,255,0.15)" stroke-width="1.2" />
                <!-- Knee caps -->
                <circle cx="9" cy="24" r="3.2" fill="${color}" stroke="#000" stroke-width="1.2" />
                <circle cx="23" cy="24" r="3.2" fill="${color}" stroke="#000" stroke-width="1.2" />
              `;
            },
            overall(id, color) {
          return `
            <!-- Full Suit Base Shading -->
            <path d="M8 6 L24 6 L22 20 L16 24 L10 20 Z" fill="#506272" stroke="#000" stroke-width="1.8" />
            <path d="M10 20 H22 L24 28 H8 Z" fill="#34495e" stroke="#000" stroke-width="1.5" />
            <!-- Shoulder Padding Trims -->
            <path d="M4 11 Q10 8, 10 14 Z" fill="${color}" stroke="#000" stroke-width="1.2" />
            <path d="M28 11 Q22 8, 22 14 Z" fill="${color}" stroke="#000" stroke-width="1.2" />
            <!-- Central Seam & Emblem Glimmer -->
            <line x1="16" y1="8" x2="16" y2="26" stroke="${color}" stroke-width="2.5" stroke-linecap="round" />
          `;
        },
    boots(id, color) {
          return `
            <!-- Left Leather Boot -->
            <!-- Flared cuff matching quality tier -->
            <path d="M3 11 L11 11 L10 15 H4 Z" fill="${color}" stroke="#000" stroke-width="1.5" />
            <path d="M4 14 L10 14 L12 22 L15 25 L13 28 L4 27 Z" fill="#5c3a21" stroke="#000" stroke-width="1.8" stroke-linejoin="round" />
            <!-- Specular Highlight -->
            <path d="M5 15 L10 15 L11 21 H5 Z" fill="#ffffff" opacity="0.15" />
            <path d="M4 27 L13 28" stroke="#111" stroke-width="2.2" />

            <!-- Right Leather Boot -->
            <!-- Flared cuff matching quality tier -->
            <path d="M17 11 L25 11 L24 15 H18 Z" fill="${color}" stroke="#000" stroke-width="1.5" />
            <path d="M18 14 L24 14 L26 22 L29 25 L27 28 L18 27 Z" fill="#5c3a21" stroke="#000" stroke-width="1.8" stroke-linejoin="round" />
            <!-- Specular Highlight -->
            <path d="M19 15 L24 15 L25 21 H19 Z" fill="#ffffff" opacity="0.15" />
            <path d="M18 27 L27 28" stroke="#111" stroke-width="2.2" />
          `;
        },
        sabatons(id, color) {
          return `
            <!-- Gothic Sabatons with spec highlights -->
            <path d="M3 15 L9 11 L12 21 L16 26 L13 29 L3 27 Z" fill="#7f8c8d" stroke="#000" stroke-width="1.8" stroke-linejoin="round" />
            <path d="M15 15 L21 11 L24 21 L28 26 L25 29 L15 27 Z" fill="#7f8c8d" stroke="#000" stroke-width="1.8" stroke-linejoin="round" />
            <polygon points="3,27 6,25 3,25" fill="${color}" stroke="#000" stroke-width="0.8" />
            <polygon points="15,27 18,25 15,25" fill="${color}" stroke="#000" stroke-width="0.8" />
            <!-- Specular reflections -->
            <path d="M4 16 L9 13 L10 21 H4 Z" fill="#ffffff" opacity="0.25" />
            <path d="M16 16 L21 13 L22 21 H16 Z" fill="#ffffff" opacity="0.25" />
          `;
        },
        sollerets(id, color) {
          return `
            <!-- Left Solleret scale plates -->
            <path d="M4 11 L10 8 L12 26 L4 25 Z" fill="#7f8c8d" stroke="#000" stroke-width="1.8" stroke-linejoin="round" />
            <!-- Overlapping lamination lines -->
            <path d="M4 15 H11 M4 19 H12 M4 23 H11" stroke="#333" stroke-width="1.5" />
            <!-- Left strap buckle -->
            <rect x="4" y="11" width="7" height="2.5" fill="${color}" stroke="#000" stroke-width="1" />

            <!-- Right Solleret scale plates -->
            <path d="M16 11 L22 8 L24 26 L16 25 Z" fill="#7f8c8d" stroke="#000" stroke-width="1.8" stroke-linejoin="round" />
            <!-- Overlapping lamination lines -->
            <path d="M16 15 H23 M16 19 H24 M16 23 H23" stroke="#333" stroke-width="1.5" />
            <!-- Right strap buckle -->
            <rect x="16" y="11" width="7" height="2.5" fill="${color}" stroke="#000" stroke-width="1" />
          `;
        },
        steel_boots(id, color) {
          return `
            <!-- Left Steel Boot -->
            <!-- Flared Ankle Collar -->
            <path d="M4 10 H14 L12 15 H6 Z" fill="${color}" stroke="#000" stroke-width="1.5" />
            <path d="M5 15 L13 15 L14 24 L12 27 L4 26 Z" fill="#7f8c8d" stroke="#000" stroke-width="1.8" stroke-linejoin="round" />
            <!-- Heavy Steel Toe Cap -->
            <path d="M4 23 L12 24 L11 27 H5 Z" fill="#bdc3c7" stroke="#000" stroke-width="1.2" />
            <!-- Reflection Highlight -->
            <path d="M5 16 L12 16 L13 22 H5 Z" fill="#ffffff" opacity="0.25" />

            <!-- Right Steel Boot -->
            <!-- Flared Ankle Collar -->
            <path d="M18 10 H28 L26 15 H20 Z" fill="${color}" stroke="#000" stroke-width="1.5" />
            <path d="M19 15 L27 15 L28 24 L26 27 L18 26 Z" fill="#7f8c8d" stroke="#000" stroke-width="1.8" stroke-linejoin="round" />
            <!-- Heavy Steel Toe Cap -->
            <path d="M18 23 L26 24 L25 27 H19 Z" fill="#bdc3c7" stroke="#000" stroke-width="1.2" />
            <!-- Reflection Highlight -->
            <path d="M19 16 L26 16 L27 22 H19 Z" fill="#ffffff" opacity="0.25" />
          `;
        },
        treads(id, color) {
          return `
            <!-- Leather boots with thick black rubber outsoles and laces -->
            <path d="M4 11 L10 8 L12 21 L16 24 L14 28 L4 27 Z" fill="#5c3a21" stroke="#000" stroke-width="1.8" stroke-linejoin="round" />
            <path d="M16 11 L22 7 L24 18 L28 23 L27 28 L16 27 Z" fill="#5c3a21" stroke="#000" stroke-width="1.8" stroke-linejoin="round" />
            <!-- Outsoles -->
            <path d="M4 26 L14 27 L14 28 L4 27 Z" fill="#111" stroke="#000" stroke-width="1" />
            <path d="M16 26 L26 27 L26 28 L16 27 Z" fill="#111" stroke="#000" stroke-width="1" />
            <!-- Color laces buckle highlights -->
            <rect x="6" y="13" width="4" height="2" fill="${color}" stroke="#000" stroke-width="0.8" />
            <rect x="18" y="13" width="4" height="2" fill="${color}" stroke="#000" stroke-width="0.8" />
            <rect x="5.5" y="18" width="4.5" height="2" fill="${color}" stroke="#000" stroke-width="0.8" />
            <rect x="17.5" y="18" width="4.5" height="2" fill="${color}" stroke="#000" stroke-width="0.8" />
          `;
        },
            sigil(id, color) {
              return `
                <defs>
                  <linearGradient id="g_sig_${id}" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stop-color="#ffffff"/>
                    <stop offset="45%" stop-color="${color}"/>
                    <stop offset="100%" stop-color="#110d1a"/>
                  </linearGradient>
                </defs>
                <path d="M16 2 L28 10 L28 22 L16 30 L4 22 L4 10 Z" fill="url(#g_sig_${id})" stroke="#000" stroke-width="1.8" stroke-linejoin="round" />
                <circle cx="16" cy="16" r="6.2" fill="none" stroke="#ffffff" stroke-dasharray="2 2" stroke-width="1" opacity="0.75" />
                <path d="M16 9 L16 23 M11 16 L21 16" stroke="#ffffff" stroke-width="1.8" stroke-linecap="round" />
              `;
            },
          },

  // Blueprints for procedurally rendering bosses on indicators or consoles
  bosses: {
    guardian(uid) {
      return `
        <defs>
          <linearGradient id="g_goliath_${uid}" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#34495e"/><stop offset="100%" stop-color="#1a252f"/></linearGradient>
          <radialGradient id="g_core_${uid}" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="#ffffff"/><stop offset="40%" stop-color="#00d2ff"/><stop offset="100%" stop-color="#003755"/></radialGradient>
        </defs>
        <path d="M32 4 L52 14 L46 44 L32 58 L18 44 L12 14 Z" fill="url(#g_goliath_${uid})" stroke="#00d2ff" stroke-width="2.5" stroke-linejoin="round" />
        <circle cx="32" cy="30" r="10" fill="url(#g_core_${uid})" stroke="#fff" stroke-width="1.5" />
        <polygon points="26,24 20,22 24,28" fill="#e74c3c" /><polygon points="38,24 44,22 40,28" fill="#e74c3c" />
      `;
    },
    chronos(uid) {
      return `
        <defs><linearGradient id="g_chron_${uid}" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#ffd700"/><stop offset="100%" stop-color="#b7950b"/></linearGradient></defs>
        <circle cx="32" cy="32" r="24" fill="none" stroke="url(#g_chron_${uid})" stroke-width="3" />
        <g stroke="url(#g_chron_${uid})" stroke-width="3" stroke-linecap="round"><line x1="32" y1="4" x2="32" y2="8" /><line x1="32" y1="56" x2="32" y2="60" /><line x1="4" y1="32" x2="8" y2="32" /><line x1="56" y1="32" x2="60" y2="32" /></g>
        <circle cx="32" cy="32" r="16" fill="#111" stroke="url(#g_chron_${uid})" stroke-width="1.5" />
        <line x1="32" y1="32" x2="32" y2="20" stroke="#fff" stroke-width="2" stroke-linecap="round" />
        <line x1="32" y1="32" x2="40" y2="32" stroke="#e67e22" stroke-width="1.5" stroke-linecap="round" />
      `;
    },
    nexus(uid) {
      return `
        <defs><linearGradient id="g_nex_${uid}" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#ff007f"/><stop offset="100%" stop-color="#00d2ff"/></linearGradient></defs>
        <rect x="14" y="14" width="36" height="36" fill="none" stroke="url(#g_nex_${uid})" stroke-width="2" />
        <rect x="20" y="20" width="24" height="24" fill="none" stroke="#00b894" stroke-width="1.5" />
        <circle cx="32" cy="32" r="4" fill="#fff" stroke="#ff007f" stroke-width="1" />
      `;
    },
  },

  // Centralized configurations of materials and generic items
  materials: {
    "Eridium Shard"(uid) {
      return `
        <defs><linearGradient id="g_es_${uid}" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#e84393" /><stop offset="100%" stop-color="#8e44ad" /></linearGradient></defs>
        <path d="M16 2 L26 16 L16 30 L6 16 Z" fill="url(#g_es_${uid})" stroke="#000" stroke-width="2" stroke-linejoin="round"/>
        <path d="M16 2 L16 30" stroke="rgba(255,255,255,0.4)" stroke-width="1.5"/><path d="M6 16 L26 16" stroke="rgba(0,0,0,0.25)" stroke-width="1.5"/>
      `;
    },
    "Glimmering Gachapon Key"(uid) {
      return `
        <defs><linearGradient id="g_gk_${uid}" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#00d2ff" /><stop offset="50%" stop-color="#e84393" /><stop offset="100%" stop-color="#9b59b6" /></linearGradient></defs>
        <path d="M11 4 L14 11 L21 11 L15 15 L18 22 L11 17 L4 22 L7 15 L1 11 L8 11 Z" fill="url(#g_gk_${uid})" stroke="#000" stroke-width="1.8" />
        <circle cx="11" cy="12" r="2.5" fill="#111" stroke="#000" stroke-width="1" />
        <path d="M15 15 L27 27 L25 29 L23 27" stroke="#000" stroke-width="2" stroke-linecap="round" fill="none" />
        <path d="M15.5 15.5 L26.5 26.5" stroke="url(#g_gk_${uid})" stroke-width="3" stroke-linecap="round" fill="none"/>
        <path d="M23.5 23.5 L21.5 25.5 M25.5 25.5 L23.5 27.5" stroke="url(#g_gk_${uid})" stroke-width="2" stroke-linecap="round"/>
      `;
    },
    "Gacha Key"(uid) {
      return `
        <defs><linearGradient id="g_gkey_${uid}" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#ffd700" /><stop offset="100%" stop-color="#b7950b" /></linearGradient></defs>
        <circle cx="11" cy="21" r="6" fill="url(#g_gkey_${uid})" stroke="#000" stroke-width="2" />
        <circle cx="11" cy="21" r="2.5" fill="#111" stroke="#000" stroke-width="1.5" />
        <path d="M15 17 L27 5 L30 8 L28 10 L26 8 L24 12 L22 10" stroke="#000" stroke-width="2" stroke-linejoin="round" fill="none" />
        <path d="M15.5 16.5 L26.5 5.5" stroke="url(#g_gkey_${uid})" stroke-width="3" stroke-linecap="round" fill="none"/>
        <path d="M26.5 5.5 L28.5 7.5 M24.5 7.5 L26.5 9.5" stroke="url(#g_gkey_${uid})" stroke-width="2" stroke-linecap="round"/>
      `;
    },
    "Ancient Core"(uid) {
      return `
        <defs><radialGradient id="g_ac_${uid}" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="#ffffff" /><stop offset="30%" stop-color="#e74c3c" /><stop offset="100%" stop-color="#960018" /></radialGradient></defs>
        <circle cx="16" cy="16" r="11" fill="url(#g_ac_${uid})" stroke="#000" stroke-width="2" />
        <path d="M5 16 L27 16" stroke="#000" stroke-width="2" /><path d="M16 5 L16 27" stroke="#000" stroke-width="2" />
        <circle cx="16" cy="16" r="4" fill="#fff" opacity="0.8" />
      `;
    },
    "Overlord's Sigil"(uid) {
      return `
        <defs><linearGradient id="g_os_${uid}" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#1abc9c" /><stop offset="100%" stop-color="#16a085" /></linearGradient></defs>
        <path d="M16 4 L19 14 L27 10 L24 20 L16 28 L8 20 L5 10 L13 14 Z" fill="url(#g_os_${uid})" stroke="#000" stroke-width="2" stroke-linejoin="round"/>
        <circle cx="16" cy="16" r="3.5" fill="#fff" stroke="#000" stroke-width="1.5" />
      `;
    },
    "Astral Essence"(uid) {
      return `
        <defs><linearGradient id="g_ae_${uid}" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#e84393" /><stop offset="50%" stop-color="#9b59b6" /><stop offset="100%" stop-color="#3498db" /></linearGradient></defs>
        <path d="M16 3 L19 13 L29 16 L19 19 L16 29 L13 19 L3 16 L13 13 Z" fill="url(#g_ae_${uid})" stroke="#000" stroke-width="2" stroke-linejoin="round" />
        <circle cx="16" cy="16" r="3" fill="#ffffff" opacity="0.9" />
      `;
    },
    Scrap(uid, stop1, stop2) {
      return `
        <defs><linearGradient id="g_sc_${uid}" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="${stop1}" /><stop offset="100%" stop-color="${stop2}" /></linearGradient></defs>
        <path d="M6 14 L16 4 L28 12 L22 26 L10 24 Z" fill="url(#g_sc_${uid})" stroke="#000" stroke-width="2" stroke-linejoin="round"/>
        <path d="M12 10 L18 20" stroke="rgba(255,255,255,0.4)" stroke-width="1.5" stroke-linecap="round"/>
      `;
    },
    "Luminous Soul"(uid) {
      return `
        <defs><linearGradient id="g_ls_${uid}" x1="0%" y1="100%" x2="0%" y2="0%"><stop offset="0%" stop-color="#fd79a8" /><stop offset="100%" stop-color="#ffb6c1" /></linearGradient></defs>
        <path d="M16 3 C16 3, 6 15, 6 22 C6 27, 10.5 30, 16 30 C21.5 30, 26 27, 26 22 C26 15, 16 3, 16 3 Z" fill="url(#g_ls_${uid})" stroke="#000" stroke-width="2" stroke-linejoin="round"/>
        <circle cx="13" cy="20" r="3" fill="#fff" opacity="0.6"/>
      `;
    },
    "Monster Soul"(uid) {
      return `
        <defs><linearGradient id="g_ms_${uid}" x1="0%" y1="100%" x2="0%" y2="0%"><stop offset="0%" stop-color="#2d3436" /><stop offset="100%" stop-color="#636e72" /></linearGradient></defs>
        <path d="M16 3 C16 3, 6 15, 6 22 C6 27, 10.5 30, 16 30 C21.5 30, 26 27, 26 22 C26 15, 16 3, 16 3 Z" fill="url(#g_ms_${uid})" stroke="#000" stroke-width="2" stroke-linejoin="round"/>
        <path d="M11 19 L14 17" stroke="#e74c3c" stroke-width="1.8" stroke-linecap="round"/><path d="M21 19 L18 17" stroke="#e74c3c" stroke-width="1.8" stroke-linecap="round"/>
      `;
    },
    "Catalyst Core"(uid) {
      return `
        <defs><linearGradient id="g_cc_${uid}" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="#2ecc71" /><stop offset="50%" stop-color="#a3fd83" /><stop offset="100%" stop-color="#27ae60" /></linearGradient></defs>
        <rect x="9" y="4" width="14" height="24" rx="3" fill="url(#g_cc_${uid})" stroke="#000" stroke-width="2"/>
        <line x1="9" y1="10" x2="23" y2="10" stroke="#000" stroke-width="2"/><line x1="9" y1="22" x2="23" y2="22" stroke="#000" stroke-width="2"/>
        <rect x="13" y="13" width="6" height="6" fill="#fff" opacity="0.9" rx="1"/>
      `;
    },
  },

  // Centralized configurations of consumables, scrolls, crates, and sacks
  consumables: {
    potion(uid, color) {
      return `
          ${window.AssetCatalog.gradients.liquid(uid, color)}
          <path d="M13 5 L19 5 L19 12 L26 23 C28 26, 26 29, 21 29 L11 29 C6 29, 4 26, 6 23 L13 12 Z" fill="#334155" stroke="#000" stroke-width="2" stroke-linejoin="round"/>
          <path d="M8.5 21 L23.5 21 L25 24 C26.2 26.2, 25 28, 21 28 L11 28 C7 28, 5.8 26.2, 7 24 Z" fill="url(#grad_liq_${uid})" stroke="#000" stroke-width="1.5"/>
          <rect x="13.5" y="2" width="5" height="4" fill="#a0522d" stroke="#000" stroke-width="1.5"/>
          <path d="M14.5 6 L14.5 11" stroke="rgba(255, 255, 255, 0.45)" stroke-width="1" stroke-linecap="round" fill="none" />
          <path d="M22 14 C23.5 17, 23.5 21, 22 24" stroke="rgba(255, 255, 255, 0.25)" stroke-width="1" stroke-linecap="round" fill="none" />
          <path d="M9 22 C8 24, 9 26, 11 27" stroke="#fff" stroke-width="1.5" stroke-linecap="round" fill="none" opacity="0.65"/>
        `;
    },
    scroll(uid, color) {
      return `
          <path d="M6 10 L26 6 L26 22 L6 26 Z" fill="#fdf6e2" stroke="#000" stroke-width="2" stroke-linejoin="round"/>
          <rect x="13" y="11" width="6" height="11" transform="rotate(-11 16 16)" fill="${color}" stroke="#000" stroke-width="1.5" />
          <path d="M6 10 C6 10, 4 12, 6 14" stroke="#000" stroke-width="2" fill="none" />
          <path d="M26 6 C26 6, 28 8, 26 10" stroke="#000" stroke-width="2" fill="none" />
        `;
    },
    sack(uid, stopCol) {
          return `
            <defs>
              <linearGradient id="g_sk_b_${uid}" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#ffd54f" />
                <stop offset="50%" stop-color="#f1c40f" />
                <stop offset="100%" stop-color="${stopCol}" />
              </linearGradient>
              <linearGradient id="g_sk_n_${uid}" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stop-color="#ffe082" />
                <stop offset="100%" stop-color="${stopCol}" />
              </linearGradient>
              <linearGradient id="g_sk_g_${uid}" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stop-color="#ffeaa7" />
                <stop offset="50%" stop-color="#f1c40f" />
                <stop offset="100%" stop-color="#9a7d0a" />
              </linearGradient>
            </defs>
            <ellipse cx="32" cy="58" rx="20" ry="3.5" fill="rgba(0,0,0,0.5)" />

            <!-- Flared Open Neck -->
            <path d="M24 22 L20 12 C24 9, 40 9, 44 12 L40 22 Z" fill="url(#g_sk_n_${uid})" stroke="#000" stroke-width="1.8" />

            <!-- Main Sack Body -->
            <path d="M32 22 C20 22, 10 25, 10 40 C10 52, 18 58, 32 58 C46 58, 54 52, 54 40 C54 25, 44 22, 32 22 Z" fill="url(#g_sk_b_${uid})" stroke="#000" stroke-width="2" stroke-linejoin="round" />

            <!-- Creases & Highlights -->
            <path d="M12 36 C18 40, 32 36, 42 36" fill="none" stroke="rgba(0,0,0,0.18)" stroke-width="1.8" />
            <path d="M32 22 V58" stroke="rgba(0,0,0,0.15)" stroke-width="1.5" />

            <!-- Cinch cord rope and Knot -->
            <path d="M22 22 Q32 26, 42 22" fill="none" stroke="url(#g_sk_g_${uid})" stroke-width="3" stroke-linecap="round" />
            <path d="M24 23 Q32 26.5, 40 23" fill="none" stroke="#000" stroke-width="1" stroke-linecap="round" />
            <circle cx="32" cy="23.2" r="3.2" fill="#ffd700" stroke="#000" stroke-width="1.5" />

            <!-- Dangling strings -->
            <path d="M30 24 Q24 38, 20 42" fill="none" stroke="url(#g_sk_g_${uid})" stroke-width="2.2" stroke-linecap="round" />
            <circle cx="20" cy="42" r="1.2" fill="url(#g_sk_g_${uid})" stroke="#000" stroke-width="0.8" />
            <path d="M34 24 Q40 38, 44 42" fill="none" stroke="url(#g_sk_g_${uid})" stroke-width="2.2" stroke-linecap="round" />
            <circle cx="44" cy="42" r="1.2" fill="url(#g_sk_g_${uid})" stroke="#000" stroke-width="0.8" />
          `;
        },
        crate(uid) {
          return `
            <defs>
              <linearGradient id="g_cr_w_${uid}" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#a0522d" />
                <stop offset="100%" stop-color="#5c2e16" />
              </linearGradient>
              <linearGradient id="g_cr_m_${uid}" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#ffd700" />
                <stop offset="100%" stop-color="#b7950b" />
              </linearGradient>
            </defs>
            <ellipse cx="32" cy="58" rx="24" ry="4" fill="rgba(0,0,0,0.55)" />
            <!-- Wooden Crate Chest Body -->
            <rect x="10" y="24" width="44" height="32" rx="4" fill="url(#g_cr_w_${uid})" stroke="#000" stroke-width="2.5" />
            <!-- Wood panels details -->
            <line x1="21" y1="24" x2="21" y2="56" stroke="#3d1d0b" stroke-width="1.5" />
            <line x1="32" y1="24" x2="32" y2="56" stroke="#3d1d0b" stroke-width="1.5" />
            <line x1="43" y1="24" x2="43" y2="56" stroke="#3d1d0b" stroke-width="1.5" />
            <!-- Diagonal crossbeam struts -->
            <line x1="12" y1="26" x2="52" y2="54" stroke="#3d1d0b" stroke-width="3" />
            <!-- Heavy corner brackets (Golden/Iron) -->
            <rect x="10" y="24" width="8" height="8" fill="url(#g_cr_m_${uid})" stroke="#000" stroke-width="1.2" />
            <rect x="46" y="24" width="8" height="8" fill="url(#g_cr_m_${uid})" stroke="#000" stroke-width="1.2" />
            <rect x="10" y="48" width="8" height="8" fill="url(#g_cr_m_${uid})" stroke="#000" stroke-width="1.2" />
            <rect x="46" y="48" width="8" height="8" fill="url(#g_cr_m_${uid})" stroke="#000" stroke-width="1.2" />
            <!-- Big Runic Lock in center -->
            <rect x="28" y="28" width="8" height="11" rx="1.5" fill="url(#g_cr_m_${uid})" stroke="#000" stroke-width="1.5" />
            <circle cx="32" cy="33" r="1.5" fill="#111" />
            <!-- Crate Lid -->
            <rect x="8" y="16" width="48" height="8" rx="1.5" fill="#a0522d" stroke="#000" stroke-width="2.5" />
            <line x1="16" y1="16" x2="16" y2="24" stroke="#3d1d0b" stroke-width="1.5" />
            <line x1="48" y1="16" x2="48" y2="24" stroke="#3d1d0b" stroke-width="1.5" />
          `;
        },
        cavern_sigil_sack(uid) {
          return `
            <defs>
              <linearGradient id="g_css_b_${uid}" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#7d3c98" />
                <stop offset="60%" stop-color="#4a154b" />
                <stop offset="100%" stop-color="#110521" />
              </linearGradient>
              <linearGradient id="g_css_n_${uid}" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stop-color="#e8a7fc" />
                <stop offset="100%" stop-color="#4a154b" />
              </linearGradient>
              <linearGradient id="g_css_g_${uid}" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stop-color="#ffeaa7" />
                <stop offset="50%" stop-color="#f1c40f" />
                <stop offset="100%" stop-color="#9a7d0a" />
              </linearGradient>
              <linearGradient id="g_css_m_${uid}" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stop-color="#00ffff" />
                <stop offset="100%" stop-color="#008b8b" />
              </linearGradient>
            </defs>
            <ellipse cx="32" cy="58" rx="20" ry="3.5" fill="rgba(0,0,0,0.55)" />

            <!-- Flared Open Neck -->
            <path d="M20 16 C25 9, 39 9, 44 16 C39 12, 25 12, 20 16 Z" fill="url(#g_css_m_${uid})" opacity="0.8" style="filter: drop-shadow(0 0 3px #00ffff);" />
            <path d="M24 28 L18 14 C22 10, 32 10, 32 16 L32 28 Z" fill="url(#g_css_b_${uid})" stroke="#000" stroke-width="1.8" />
            <path d="M40 28 L46 14 C42 10, 32 10, 32 16 L32 28 Z" fill="url(#g_css_b_${uid})" stroke="#000" stroke-width="1.8" />

            <!-- Main Velvet Pouch Body -->
            <path d="M32 18 C20 18, 11 21, 11 38 C11 51, 18 58, 32 58 C46 58, 53 51, 53 38 C53 21, 44 18, 32 18 Z" fill="url(#g_css_b_${uid})" stroke="#000" stroke-width="2.2" stroke-linejoin="round" />

            <!-- Crease Shadows -->
            <path d="M11 38 Q18 42, 32 38" fill="none" stroke="rgba(0,0,0,0.25)" stroke-width="2" />
            <path d="M32 18 Q23 35, 18 51" fill="none" stroke="rgba(0,0,0,0.4)" stroke-width="3" />
            <path d="M32 18 Q41 35, 46 51" fill="none" stroke="rgba(0,0,0,0.4)" stroke-width="3" transform="scale(-1, 1) translate(-64, 0)" />

            <!-- Glowing Cyber-Teal Runic Medallion -->
            <circle cx="32" cy="40" r="10" fill="none" stroke="#00ffff" stroke-dasharray="2.5 3" stroke-width="1.2" opacity="0.8" style="filter: drop-shadow(0 0 4px #00ffff);" />
            <circle cx="32" cy="40" r="7.5" fill="url(#g_css_g_${uid})" stroke="#000" stroke-width="1.5" />
            <polygon points="32,35.5 35.5,40 32,44.5 28.5,40" fill="#ffffff" stroke="#00ffff" stroke-width="1.2" style="filter: drop-shadow(0 0 3px #00ffff);" />

            <!-- Gold Cinch Band & Strings -->
            <path d="M22 28 Q32 31.5, 42 28" fill="none" stroke="url(#g_css_g_${uid})" stroke-width="3.5" stroke-linecap="round" />
            <path d="M24 29 Q32 32, 40 29" fill="none" stroke="#000" stroke-width="1.2" stroke-linecap="round" />
            <circle cx="32" cy="29.2" r="3.2" fill="#ffd700" stroke="#000" stroke-width="1.5" />
            <path d="M30 30 Q24 40, 18 43" fill="none" stroke="url(#g_css_g_${uid})" stroke-width="2.2" stroke-linecap="round" />
            <circle cx="18" cy="43" r="1.5" fill="url(#g_css_g_${uid})" stroke="#000" stroke-width="0.8" />
            <path d="M34 30 Q40 40, 46 43" fill="none" stroke="url(#g_css_g_${uid})" stroke-width="2.2" stroke-linecap="round" />
            <circle cx="46" cy="43" r="1.5" fill="url(#g_css_g_${uid})" stroke="#000" stroke-width="0.8" />
          `;
        },
        monster_card_sack(uid) {
          return `
            <defs>
              <linearGradient id="g_mcs_b_${uid}" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stop-color="#ff007f"/>
                <stop offset="50%" stop-color="#df9ffb" />
                <stop offset="100%" stop-color="#a855f7"/>
              </linearGradient>
              <linearGradient id="g_mcs_g_${uid}" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stop-color="#ffeaa7" />
                <stop offset="100%" stop-color="#f1c40f" />
              </linearGradient>
            </defs>
            <ellipse cx="32" cy="58" rx="20" ry="3.5" fill="rgba(0,0,0,0.55)" />
            <!-- Foil Pack Base -->
            <rect x="12" y="8" width="40" height="48" rx="7" fill="url(#g_mcs_b_${uid})" stroke="#000" stroke-width="2.2" />
            <!-- Serrated Crimp Top -->
            <path d="M12 8 L18 14 L24 8 L30 14 L36 8 L42 14 L48 8 L52 8 L52 14 L12 14 Z" fill="url(#g_mcs_g_${uid})" stroke="#000" stroke-width="1.2" />
            <!-- Serrated Crimp Bottom -->
            <path d="M12 56 L18 50 L24 56 L30 50 L36 56 L42 50 L48 56 L52 56 L52 50 L12 50 Z" fill="url(#g_mcs_g_${uid})" stroke="#000" stroke-width="1.2" />
            <!-- Holographic Card Frame overlay -->
            <rect x="17" y="18" width="30" height="28" fill="none" stroke="#fff" stroke-width="1.5" opacity="0.35" />
            <!-- Glowing central card symbol -->
            <circle cx="32" cy="32" r="9" fill="url(#g_mcs_g_${uid})" stroke="#000" stroke-width="1.5" style="filter: drop-shadow(0 0 4px #f1c40f);" />
            <path d="M32 27 L32 37 M27 32 L37 32" stroke="#111" stroke-width="2" stroke-linecap="round" />
            <path d="M17 18 L24 18 M17 18 L17 25" stroke="#00d2ff" stroke-width="2" opacity="0.8" />
            <path d="M47 46 L40 46 M47 46 L47 39" stroke="#00d2ff" stroke-width="2" opacity="0.8" />
          `;
        },
  },

  // Centralized configurations of unique artifacts
  artifacts: {
    frenzy(uid) {
      return `
        <defs><radialGradient id="g_fz_${uid}" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="#ff5555"/><stop offset="100%" stop-color="#4a0008"/></radialGradient></defs>
        <rect x="3" y="3" width="26" height="26" rx="6" fill="url(#g_fz_${uid})" stroke="#111" stroke-width="1.8"/>
        <path d="M16 6 L12 16 L20 18 L16 26" fill="none" stroke="#f1c40f" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" style="filter: drop-shadow(0 0 3px #ff3300);"/>
        <circle cx="16" cy="16" r="3" fill="#ffffff" stroke="#ff3333" stroke-width="1"/>
      `;
    },
    vampirism(uid) {
      return `
        <defs>
          <linearGradient id="g_vp_g_${uid}" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#fff59d"/><stop offset="50%" stop-color="#f1c40f"/><stop offset="100%" stop-color="#9a7d0a"/></linearGradient>
          <radialGradient id="g_vp_b_${uid}" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="#ff4d4d"/><stop offset="100%" stop-color="#7a0010"/></radialGradient>
        </defs>
        <path d="M8 6 L24 6 L22 16 C22 22, 16 24, 16 24 C16 24, 10 22, 10 16 Z" fill="url(#g_vp_g_${uid})" stroke="#111" stroke-width="2" stroke-linejoin="round"/>
        <path d="M9.5 8 L22.5 8 C21 13, 11 13, 9.5 8 Z" fill="url(#g_vp_b_${uid})" stroke="#111" stroke-width="1"/>
        <line x1="16" y1="24" x2="16" y2="28" stroke="url(#g_vp_g_${uid})" stroke-width="3" stroke-linecap="round"/>
        <path d="M9 28 L23 28 Q16 31, 9 28 Z" fill="url(#g_vp_g_${uid})" stroke="#111" stroke-width="1.5" stroke-linejoin="round"/>
      `;
    },
    gold_hoard(uid) {
      return `
        <defs><linearGradient id="g_gh_${uid}" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#ffd54f"/><stop offset="100%" stop-color="#a77c00"/></linearGradient></defs>
        <circle cx="16" cy="8" r="4.5" fill="none" stroke="url(#g_gh_${uid})" stroke-width="2.5"/>
        <line x1="16" y1="11" x2="16" y2="25" stroke="url(#g_gh_${uid})" stroke-width="3.5" stroke-linecap="round"/>
        <line x1="9" y1="15" x2="23" y2="15" stroke="url(#g_gh_${uid})" stroke-width="3" stroke-linecap="round"/>
        <path d="M7 20 C7 27, 25 27, 25 20" fill="none" stroke="url(#g_gh_${uid})" stroke-width="3.5" stroke-linecap="round"/>
        <polygon points="7,19 4,22 9,21" fill="url(#g_gh_${uid})" stroke="#111" stroke-width="1"/>
        <polygon points="25,19 28,22 23,21" fill="url(#g_gh_${uid})" stroke="#111" stroke-width="1"/>
      `;
    },
    magic_find(uid) {
      return `
        <defs>
          <linearGradient id="g_mf_gd_${uid}" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#fff1a8"/><stop offset="100%" stop-color="#d4af37"/></linearGradient>
          <linearGradient id="g_mf_em_${uid}" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#55efc4"/><stop offset="100%" stop-color="#00b894"/></linearGradient>
        </defs>
        <ellipse cx="16" cy="18" rx="8" ry="10" fill="url(#g_mf_gd_${uid})" stroke="#111" stroke-width="2"/>
        <circle cx="16" cy="10" r="4.2" fill="url(#g_mf_gd_${uid})" stroke="#111" stroke-width="1.8"/>
        <line x1="16" y1="10" x2="16" y2="28" stroke="#111" stroke-width="1.8"/>
        <rect x="13.2" y="13.5" width="5.6" height="8.5" rx="1.5" fill="url(#g_mf_em_${uid})" stroke="#111" stroke-width="1"/>
        <path d="M8 14 Q3 15, 6 9.5 M24 14 Q29 15, 26 9.5 M7 21 Q3 23, 5 27 M25 21 Q29 23, 27 27" fill="none" stroke="#111" stroke-width="2" stroke-linecap="round"/>
      `;
    },
    move_speed(uid) {
      return `
        <defs>
          <linearGradient id="g_ms_s_${uid}" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#ffffff"/><stop offset="100%" stop-color="#7f8c8d"/></linearGradient>
          <linearGradient id="g_ms_w_${uid}" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#81ecec"/><stop offset="100%" stop-color="#0984e3"/></linearGradient>
        </defs>
        <path d="M10 24 L15 9 L24 15 L19 26 Z" fill="url(#g_ms_s_${uid})" stroke="#111" stroke-width="1.8"/>
        <path d="M5 14 C5 10, 11 8, 14 15 C11 15, 7 13, 5 14 Z" fill="url(#g_ms_w_${uid})" stroke="#111" stroke-width="1.2"/>
        <path d="M3 18 C3 14, 9 12, 12 19 C9 19, 5 17, 3 18 Z" fill="url(#g_ms_w_${uid})" stroke="#111" stroke-width="1.2"/>
      `;
    },
    defense(uid) {
      return `
        <defs><linearGradient id="g_df_${uid}" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#4ba3e3"/><stop offset="100%" stop-color="#1c304a"/></linearGradient></defs>
        <path d="M16 3 L27 9 L23 23 L16 29 L9 23 L5 9 Z" fill="url(#g_df_${uid})" stroke="#111" stroke-width="2.2" stroke-linejoin="round"/>
        <path d="M16 7 L23 11 L20 20 L16 25 L12 20 L9 11 Z" fill="none" stroke="#fff" opacity="0.3" stroke-width="1.8"/>
        <circle cx="16" cy="15" r="3.2" fill="#fff" style="filter: drop-shadow(0 0 4px #fff);"/>
      `;
    },
    parry_strike(uid) {
      return `
        <defs><linearGradient id="g_ps_${uid}" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#ffffff"/><stop offset="100%" stop-color="#555555"/></linearGradient></defs>
        <path d="M7 10 L16 5 L25 10 L23 22 L16 28 L9 22 Z" fill="url(#g_ps_${uid})" stroke="#111" stroke-width="2" stroke-linejoin="round"/>
        <line x1="8" y1="14" x2="24" y2="14" stroke="#c0392b" stroke-width="3" stroke-linecap="round"/>
        <path d="M16 10 L16 22" stroke="#111" stroke-width="3" stroke-linecap="round"/><path d="M16 10 L16 22" stroke="#fff" stroke-width="1" stroke-linecap="round"/>
      `;
    },
    echo_strike(uid) {
      return `
        <defs><linearGradient id="g_es_b_${uid}" x1="0" y1="1" x2="0" y2="0"><stop offset="0%" stop-color="#020d1a"/><stop offset="100%" stop-color="#00ffcc"/></linearGradient></defs>
        <path d="M4 28 L24 8 L28 12 L8 32 Z" fill="url(#g_es_b_${uid})" stroke="rgba(0, 255, 204, 0.4)" stroke-width="1.5" style="opacity:0.45;"/>
        <path d="M8 24 L24 8 L28 12 L12 28 Z" fill="url(#g_es_b_${uid})" stroke="#111" stroke-width="1.8"/>
        <path d="M12 28 L28 12" stroke="#fff" stroke-width="1.5" stroke-linecap="round"/>
      `;
    },
    idle_spd(uid) {
      return `
        <defs><linearGradient id="g_is_${uid}" x1="0%" y1="0%" x2="1" y2="1"><stop offset="0%" stop-color="#2c3e50"/><stop offset="100%" stop-color="#07090c"/></linearGradient></defs>
        <circle cx="16" cy="16" r="11" fill="url(#g_is_${uid})" stroke="#ffd700" stroke-width="2.2"/>
        <circle cx="16" cy="16" r="8" fill="none" stroke="#e67e22" stroke-width="1" stroke-dasharray="3 3"/>
        <line x1="16" y1="16" x2="16" y2="9.5" stroke="#f1c40f" stroke-width="2.2" stroke-linecap="round"/>
        <line x1="16" y1="16" x2="21.5" y2="16" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/>
      `;
    },
    active_spd(uid) {
      return `
        <defs><linearGradient id="g_as_${uid}" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#fff9a6"/><stop offset="50%" stop-color="#f39c12"/><stop offset="100%" stop-color="#d35400"/></linearGradient></defs>
        <path d="M16 2 L20 10 L28 10 L22 16 L25 24 L16 19 L7 24 L10 16 L4 10 L12 10 Z" fill="url(#g_as_${uid})" stroke="#111" stroke-width="1.8" stroke-linejoin="round"/>
        <circle cx="16" cy="13.5" r="4.2" fill="#fff" opacity="0.3"/>
      `;
    },
    dodge_buff(uid) {
      return `
        <defs><linearGradient id="g_db_${uid}" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#2ecc71"/><stop offset="100%" stop-color="#145a32"/></linearGradient></defs>
        <rect x="11.5" y="4" width="9" height="22" rx="4.5" fill="url(#g_db_${uid})" stroke="#111" stroke-width="1.8"/>
        <rect x="13.5" y="7" width="5" height="16" fill="#fff" opacity="0.25"/>
        <line x1="10" y1="12" x2="22" y2="12" stroke="#111" stroke-width="2"/><line x1="10" y1="18" x2="22" y2="18" stroke="#111" stroke-width="2"/>
        <line x1="16" y1="26" x2="16" y2="29" stroke="#bdc3c7" stroke-width="2.5" stroke-linecap="round"/>
      `;
    },
    extend_buffs(uid) {
      return `
        <defs><linearGradient id="g_eb_${uid}" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#ffeaa7"/><stop offset="100%" stop-color="#d35400"/></linearGradient></defs>
        <path d="M7 6 L25 6 L16 16 Z" fill="url(#g_eb_${uid})" stroke="#111" stroke-width="1.8" stroke-linejoin="round"/>
        <path d="M16 16 L7 26 L25 26 Z" fill="url(#g_eb_${uid})" stroke="#111" stroke-width="1.8" stroke-linejoin="round"/>
        <circle cx="16" cy="11" r="2.2" fill="#fff" style="filter: drop-shadow(0 0 3px #fff);"/>
        <path d="M13 23 Q16 18, 19 23 Z" fill="#fff" opacity="0.8"/>
      `;
    },
    bag_space(uid) {
      return `
        <defs><linearGradient id="g_bs_${uid}" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#a29bfe"/><stop offset="100%" stop-color="#6c5ce7"/></linearGradient></defs>
        <rect x="6.5" y="11" width="19" height="15" rx="3.5" fill="url(#g_bs_${uid})" stroke="#111" stroke-width="1.8"/>
        <path d="M11.5 11 C11.5 6, 20.5 6, 20.5 11" fill="none" stroke="#111" stroke-width="2.2"/>
        <circle cx="16" cy="18.5" r="3" fill="#111" stroke="#fff" stroke-width="1.2"/>
      `;
    },
    second_wind(uid) {
      return `
        <defs><linearGradient id="g_sw_${uid}" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#ff7675"/><stop offset="100%" stop-color="#d63031"/></linearGradient></defs>
        <circle cx="16" cy="10" r="5" fill="none" stroke="url(#g_sw_${uid})" stroke-width="2.5" style="filter: drop-shadow(0 0 3px #ff3300);"/>
        <path d="M11 15.5 L21 15.5 L16 28.5 Z" fill="url(#g_sw_${uid})" stroke="#111" stroke-width="1.8" stroke-linejoin="round"/>
      `;
    },
    golem_stance(uid) {
      return `
        <defs><linearGradient id="g_gs_${uid}" x1="0%" y1="0%" x2="1" y2="1"><stop offset="0%" stop-color="#95a5a6"/><stop offset="100%" stop-color="#34495e"/></linearGradient></defs>
        <polygon points="16,3 27,10.5 27,23.5 16,29 5,23.5 5,10.5" fill="url(#g_gs_${uid})" stroke="#111" stroke-width="2" stroke-linejoin="round"/>
        <path d="M16 7 L23 11 L23 19 M9 19 L9 11 L16 7" fill="none" stroke="#e74c3c" stroke-width="1.8" style="filter: drop-shadow(0 0 2px #ff2200);"/>
      `;
    },
    fairy_wealth(uid) {
      return `
        <defs><linearGradient id="g_fw_${uid}" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#ff9ff3"/><stop offset="100%" stop-color="#f368e0"/></linearGradient></defs>
        <circle cx="16" cy="16" r="10" fill="none" stroke="url(#g_fw_${uid})" stroke-width="2.8"/>
        <path d="M12 9 Q16 3, 20 9 M9 16 Q16 23, 23 16" fill="none" stroke="#fff" opacity="0.65" stroke-width="1.8" stroke-linecap="round"/>
        <circle cx="16" cy="16" r="3.2" fill="#ffd700" stroke="#111" stroke-width="1.2"/>
      `;
    },
    void_pull(uid) {
      return `
        <circle cx="16" cy="16" r="11" fill="#0c001a" stroke="#8e44ad" stroke-width="2.2" style="filter: drop-shadow(0 0 5px #8e44ad);"/>
        <circle cx="16" cy="16" r="5" fill="#ff007f" style="filter: drop-shadow(0 0 4px #ff007f);"/>
      `;
    },
    titan_grip(uid) {
      return `
        <defs><linearGradient id="g_tg_${uid}" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#bdc3c7"/><stop offset="100%" stop-color="#2c3e50"/></linearGradient></defs>
        <rect x="8.5" y="11" width="15" height="11.5" rx="3" fill="url(#g_tg_${uid})" stroke="#111" stroke-width="1.8"/>
        <path d="M11 11 C11 5, 21 5, 21 11" fill="none" stroke="#ffd700" stroke-width="2.2"/>
        <circle cx="11.5" cy="16.5" r="1" fill="#fff"/><circle cx="20.5" cy="16.5" r="1" fill="#fff"/>
      `;
    },
    alchemist_alembic(uid) {
      return `
        <defs><linearGradient id="g_aa_${uid}" x1="0%" y1="100%" x2="0%" y2="0%"><stop offset="0%" stop-color="#1abc9c"/><stop offset="100%" stop-color="#a3fd83"/></linearGradient></defs>
        <circle cx="16" cy="19.5" r="8.2" fill="url(#g_aa_${uid})" stroke="#111" stroke-width="1.8"/>
        <rect x="14.5" y="6.5" width="3" height="6.5" fill="#bdc3c7" stroke="#111" stroke-width="1.2"/>
        <path d="M12 21 C12 21, 14 24, 16 24 C18 24, 20 21, 20 21" fill="none" stroke="#fff" opacity="0.4" stroke-width="1.2"/>
      `;
    },
    philosopher_catalyst(uid) {
      return `
        <defs><linearGradient id="g_pc_${uid}" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#2ecc71"/><stop offset="100%" stop-color="#27ae60"/></linearGradient></defs>
        <polygon points="16,3.5 27.5,25 4.5,25" fill="url(#g_pc_${uid})" stroke="#111" stroke-width="2" stroke-linejoin="round"/>
        <circle cx="16" cy="17.8" r="4.2" fill="#fff" stroke="#111" stroke-width="1.2" style="filter: drop-shadow(0 0 3px #fff);"/>
      `;
    },
    cauldron_eternity(uid) {
      return `
        <defs><linearGradient id="g_ce_${uid}" x1="0%" y1="100%" x2="0%" y2="0%"><stop offset="0%" stop-color="#3a045c"/><stop offset="100%" stop-color="#9b59b6"/></linearGradient></defs>
        <path d="M8 10.5 C8 10.5, 4 23, 16 25.5 C28 23, 24 10.5, 24 10.5 Z" fill="#1b212c" stroke="#111" stroke-width="1.8" stroke-linejoin="round"/>
        <ellipse cx="16" cy="10.5" rx="10" ry="2.8" fill="url(#g_ce_${uid})" stroke="#111" stroke-width="1.8"/>
        <circle cx="12" cy="10" r="1.2" fill="#fff" opacity="0.6"/><circle cx="18" cy="11" r="1.5" fill="#fff" opacity="0.8"/>
      `;
    },
  },

  // Centralized configurations of unique weapons
  uniques: {
    staff(uid) {
      return `
        <defs><linearGradient id="g_un_st_${uid}" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#ffd700"/><stop offset="100%" stop-color="#e67e22"/></linearGradient></defs>
        <line x1="6" y1="26" x2="26" y2="6" stroke="#853c00" stroke-width="3" stroke-linecap="round"/>
        <line x1="6" y1="26" x2="26" y2="6" stroke="url(#g_un_st_${uid})" stroke-width="1" stroke-linecap="round" style="opacity:0.4;"/>
        <circle cx="26" cy="6" r="5.2" fill="#e74c3c" stroke="#111" stroke-width="1.5" style="filter: drop-shadow(0 0 4px #e74c3c);"/><circle cx="25" cy="5" r="1.2" fill="#fff"/>
      `;
    },
    sword(uid) {
      return `
        <defs><linearGradient id="g_un_sw_${uid}" x1="0%" y1="100%" x2="0%" y2="0%"><stop offset="0%" stop-color="#3a0202"/><stop offset="100%" stop-color="#ff0000"/></linearGradient></defs>
        <path d="M5 27 L25 7 L27 9 L7 29 Z" fill="url(#g_un_sw_${uid})" stroke="#111" stroke-width="1.8"/>
        <line x1="8" y1="24" x2="24" y2="8" stroke="#ff3333" stroke-width="1"/>
        <rect x="3.5" y="25" width="7" height="3.5" rx="0.5" fill="#f1c40f" stroke="#111" stroke-width="1.2" transform="rotate(45 7 27)"/>
      `;
    },
    singularity(uid) {
      return `
        <defs><linearGradient id="g_un_sg_${uid}" x1="0" y1="1" x2="0" y2="0"><stop offset="0%" stop-color="#0b0116"/><stop offset="100%" stop-color="#8e44ad"/></linearGradient></defs>
        <path d="M5 27 L25 7 L27 9 L7 29 Z" fill="url(#g_un_sg_${uid})" stroke="#111" stroke-width="1.8"/>
        <circle cx="26" cy="6" r="4" fill="#ff007f" style="filter: drop-shadow(0 0 4px #ff007f);"/>
      `;
    },
    maelstrom(uid) {
      return `
        <defs><linearGradient id="g_un_ml_${uid}" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#55efc4"/><stop offset="100%" stop-color="#00b894"/></linearGradient></defs>
        <line x1="6" y1="26" x2="26" y2="6" stroke="#2c3e50" stroke-width="2.5" stroke-linecap="round"/>
        <path d="M22 10 Q28 6, 28 4 Q25 4, 18 8 Z" fill="url(#g_un_ml_${uid})" stroke="#111" stroke-width="1.5" stroke-linejoin="round"/>
      `;
    },
    aegis(uid) {
      return `
        <defs><linearGradient id="g_un_ag_${uid}" x1="0" y1="0" x2="0" y2="100%"><stop offset="0%" stop-color="#0984e3"/><stop offset="100%" stop-color="#1b1c1e"/></linearGradient></defs>
        <path d="M16 3 L27 9 L23 23 L16 29 L9 23 L5 9 Z" fill="url(#g_un_ag_${uid})" stroke="#3498db" stroke-width="2" stroke-linejoin="round" style="filter: drop-shadow(0 0 3px #3498db);"/>
        <circle cx="16" cy="16" r="3.2" fill="#fff" opacity="0.8"/>
      `;
    },
    watch(uid) {
      return `
        <defs><linearGradient id="g_un_wt_${uid}" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#ffffff"/><stop offset="100%" stop-color="#d5dbdb"/></linearGradient></defs>
        <circle cx="16" cy="16" r="10" fill="#221c03" stroke="#f1c40f" stroke-width="1.8"/>
        <circle cx="16" cy="16" r="7.5" fill="url(#g_un_wt_${uid})" stroke="#111" stroke-width="1"/>
        <line x1="16" y1="16" x2="16" y2="10.5" stroke="#111" stroke-width="1.8" stroke-linecap="round"/>
        <line x1="16" y1="16" x2="20" y2="16" stroke="#c0392b" stroke-width="1.2" stroke-linecap="round"/>
      `;
    },
    chronicle(uid) {
      return `
        <defs><linearGradient id="g_un_ch_${uid}" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#fdf6e2"/><stop offset="100%" stop-color="#d5dbdb"/></linearGradient></defs>
        <rect x="7.5" y="5" width="17" height="22" rx="2.5" fill="#2c1d11" stroke="#ffd700" stroke-width="1.8" style="filter: drop-shadow(0 0 3px #f1c40f);"/>
        <rect x="11.5" y="8" width="9" height="16" fill="url(#g_un_ch_${uid})" stroke="#111" stroke-width="1"/>
      `;
    },
    warpcore(uid) {
      return `
        <defs><linearGradient id="g_un_wc_${uid}" x1="0" y1="1" x2="0" y2="0"><stop offset="0%" stop-color="#002b2b"/><stop offset="100%" stop-color="#1abc9c"/></linearGradient></defs>
        <path d="M8 23 L14 8 L22 14 L16 27 Z" fill="url(#g_un_wc_${uid})" stroke="#111" stroke-width="1.8"/>
        <rect x="10" y="16" width="3" height="5" rx="0.5" fill="#fff" style="filter: drop-shadow(0 0 3px #00ffcc);"/>
      `;
    },
    tempest(uid) {
      return `
            <defs><linearGradient id="g_un_tp_${uid}" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#a0f0ff"/><stop offset="100%" stop-color="#0080b0"/></linearGradient></defs>
            <path d="M6 21 L10 7 L14 15 L16 4 L18 15 L22 7 L26 21 Z" fill="url(#g_un_tp_${uid})" stroke="#111" stroke-width="1.8" stroke-linejoin="round" style="filter: drop-shadow(0 0 4px #00d2ff);"/>
            <rect x="6" y="21" width="20" height="4" fill="url(#g_un_tp_${uid})" stroke="#111" stroke-width="1.8"/>
          `;
    },
  },
};

window.getAchievementBadgeHtml = function (ach, unlocked, size = 32) {
  let id = ach.id;
  let isSingle = !!ach.isSingleTier;

  let category = "";
  let tierNum = 0;

  if (isSingle) {
    category = "sing";
  } else {
    let lastUnderscore = id.lastIndexOf("_");
    if (lastUnderscore !== -1) {
      category = id.substring(0, lastUnderscore);
      tierNum = parseInt(id.substring(lastUnderscore + 1), 10);
    } else {
      category = id;
    }
  }

  let iconSvg = "";
  let glowColor = unlocked ? "#f1c40f" : "#444";
  let bgGradient = unlocked
    ? "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)"
    : "linear-gradient(135deg, #151515 0%, #0d0d0d 100%)";

  switch (category) {
    case "slayer":
      iconSvg = `
            <g stroke="${glowColor}" stroke-width="2" stroke-linecap="round" fill="none">
              <path d="M6 26 L26 6" />
              <path d="M26 26 L6 6" />
              <path d="M12 9 L23 20" />
              <path d="M20 9 L9 20" />
            </g>
          `;
      break;
    case "hoarder":
    case "drop_g":
      iconSvg = `
            <g stroke="${glowColor}" stroke-width="2" stroke-linejoin="round" fill="none">
              <ellipse cx="16" cy="22" rx="8" ry="3" />
              <ellipse cx="16" cy="16" rx="8" ry="3" />
              <ellipse cx="16" cy="10" rx="8" ry="3" />
              <path d="M8 10 V22 M24 10 V22" />
            </g>
          `;
      break;
    case "stage":
      iconSvg = `
            <g stroke="${glowColor}" stroke-width="2" fill="none">
              <circle cx="16" cy="16" r="10" />
              <path d="M16 6 V26 M6 16 H26" stroke-dasharray="2 2" />
              <polygon points="16,10 19,16 16,14 13,16" fill="${unlocked ? glowColor : "none"}" />
            </g>
          `;
      break;
    case "level":
      iconSvg = `
            <g stroke="${glowColor}" stroke-width="2" stroke-linejoin="round" fill="none">
              <path d="M6 24 L10 10 L16 16 L22 10 L26 24 Z" />
              <circle cx="16" cy="24" r="1.5" fill="${unlocked ? glowColor : "none"}" />
            </g>
          `;
      break;
    case "forge":
    case "refo":
      iconSvg = `
            <g stroke="${glowColor}" stroke-width="2" stroke-linejoin="round" fill="none">
              <path d="M10 20 L22 10" />
              <path d="M6 24 L10 20 L12 22 Z" fill="${unlocked ? glowColor : "none"}" />
              <rect x="18" y="4" width="8" height="8" rx="1.5" transform="rotate(45 22 8)" fill="${unlocked ? glowColor : "none"}" />
            </g>
          `;
      break;
    case "enchant":
      iconSvg = `
            <g stroke="${glowColor}" stroke-width="2" stroke-linejoin="round" fill="none">
              <rect x="8" y="6" width="16" height="20" rx="1" />
              <line x1="12" y1="12" x2="20" y2="12" />
              <line x1="12" y1="16" x2="18" y2="16" />
              <circle cx="16" cy="16" r="2" stroke-dasharray="2 2" />
            </g>
          `;
      break;
    case "rift":
      iconSvg = `
            <g stroke="${glowColor}" stroke-width="2" fill="none">
              <circle cx="16" cy="16" r="10" stroke-dasharray="4 2" />
              <circle cx="16" cy="16" r="5" fill="${unlocked ? glowColor : "none"}" />
            </g>
          `;
      break;
    case "prestige":
      iconSvg = `
            <g stroke="${glowColor}" stroke-width="2" stroke-linejoin="round" fill="none">
              <path d="M16 28 C10 28, 6 22, 16 12 C26 22, 22 28, 16 28 Z" fill="${unlocked ? glowColor : "none"}" fill-opacity="0.15" />
              <path d="M10 18 Q16 12, 22 18" />
            </g>
          `;
      break;
    case "d_eq":
      iconSvg = `
            <g stroke="${glowColor}" stroke-width="1.8" stroke-linejoin="round" fill="none">
              <path d="M8 8 Q16 6, 24 8 Q23 18, 16 25 Q9 18, 8 8 Z" fill="${unlocked ? glowColor : "none"}" fill-opacity="0.15" />
              <path d="M16 5 L16 25" />
            </g>
          `;
      break;
    case "d_go":
      iconSvg = `
            <g stroke="${glowColor}" stroke-width="2" stroke-linejoin="round" fill="none">
              <rect x="6" y="10" width="20" height="16" rx="2" />
              <path d="M6 16 H26" />
              <circle cx="16" cy="13" r="1.5" />
            </g>
          `;
      break;
    case "d_ma":
    case "buff":
      iconSvg = `
            <g stroke="${glowColor}" stroke-width="2" stroke-linejoin="round" fill="none">
              <path d="M12 6 H18 M13 6 V12 L8 22 A2 2 0 0 0 10 25 H22 A2 2 0 0 0 24 22 L19 12 V6" fill="${unlocked ? glowColor : "none"}" fill-opacity="0.15" />
            </g>
          `;
      break;
    case "d_cr":
      iconSvg = `
            <g stroke="${glowColor}" stroke-width="2" stroke-linejoin="round" fill="none">
              <polygon points="6,24 9,14 16,19 23,14 26,24" />
              <line x1="6" y1="24" x2="26" y2="24" />
            </g>
          `;
      break;
    case "hit":
      iconSvg = `
            <g stroke="${glowColor}" stroke-width="1.8" stroke-linejoin="round" fill="none">
              <path d="M16 4 L19 12 L27 10 L21 16 L26 24 L16 19 L6 24 L11 16 L5 10 L13 12 Z" fill="${unlocked ? glowColor : "none"}" fill-opacity="0.15" />
            </g>
          `;
      break;
    case "fairy":
      iconSvg = `
            <g stroke="${glowColor}" stroke-width="1.8" stroke-linejoin="round" fill="none">
              <path d="M16 16 C10 16, 6 12, 11 8 C16 4, 16 16, 16 16 Z" />
              <path d="M16 16 C22 16, 26 12, 21 8 C16 4, 16 16, 16 16 Z" />
              <circle cx="16" cy="16" r="2.5" fill="${unlocked ? glowColor : "none"}" />
            </g>
          `;
      break;
    case "death":
      iconSvg = `
            <g stroke="${glowColor}" stroke-width="2" stroke-linejoin="round" fill="none">
              <rect x="10" y="8" width="12" height="12" rx="4" />
              <rect x="12" y="18" width="8" height="6" rx="1" />
              <circle cx="13" cy="12" r="1.5" />
              <circle cx="19" cy="12" r="1.5" />
            </g>
          `;
      break;
    case "salvage":
      iconSvg = `
            <g stroke="${glowColor}" stroke-width="2" stroke-linejoin="round" fill="none">
              <circle cx="16" cy="16" r="8" />
              <path d="M12 12 H20 M12 20 H20 M16 12 V20" />
            </g>
          `;
      break;
    case "f_spd":
      iconSvg = `
            <g stroke="${glowColor}" stroke-width="2" stroke-linejoin="round" fill="none">
              <path d="M19 4 L9 14 H16 L13 22 L23 12 H16 Z" />
            </g>
          `;
      break;
    case "defl":
      iconSvg = `
            <g stroke="${glowColor}" stroke-width="2" stroke-linejoin="round" fill="none">
              <path d="M8 6 H24 L21 21 L16 26 L11 21 Z" />
            </g>
          `;
      break;
    case "g_up":
      iconSvg = `
            <g stroke="${glowColor}" stroke-width="1.8" stroke-linejoin="round" fill="none">
              <path d="M6 10 H26 V24 H6 Z M11 16 H15 V24 H11 Z" />
              <path d="M9 10 V6 M23 10 V6" />
            </g>
          `;
      break;
    case "rare_s":
      iconSvg = `
            <g stroke="${glowColor}" stroke-width="1.8" fill="none">
              <circle cx="16" cy="16" r="9" />
              <circle cx="16" cy="16" r="5" />
              <circle cx="16" cy="16" r="1.5" fill="${unlocked ? glowColor : "none"}" />
            </g>
          `;
      break;
    case "sing":
    default:
      iconSvg = `
            <g stroke="${glowColor}" stroke-width="1.8" stroke-linejoin="round" fill="none">
              <polygon points="16,3 27,10.5 27,23.5 16,29 5,23.5 5,10.5" fill="${unlocked ? glowColor : "none"}" fill-opacity="0.1" />
              <circle cx="16" cy="16" r="5.5" />
            </g>
          `;
      break;
  }

  let romanNum = "";
  if (tierNum > 0) {
    const rom = [
      "",
      "I",
      "II",
      "III",
      "IV",
      "V",
      "VI",
      "VII",
      "VIII",
      "IX",
      "X",
    ];
    romanNum = rom[tierNum] || tierNum.toString();
  }

  let romanOverlay = romanNum
    ? `<span style="
            position: absolute;
            bottom: -2px;
            right: -2px;
            background: ${unlocked ? "#f1c40f" : "#222"};
            color: ${unlocked ? "#000" : "#888"};
            font-family: monospace;
            font-size: 8px;
            font-weight: 900;
            padding: 1px 3.5px;
            border-radius: 3px;
            border: 1px solid ${unlocked ? "#fff" : "#444"};
            box-shadow: ${unlocked ? "0 0 6px rgba(241,196,15,0.4)" : "none"};
            line-height: 1;
            z-index: 2;
          ">${romanNum}</span>`
    : "";

  return `
        <span style="
          background: ${bgGradient};
          border: 1.5px solid ${unlocked ? "#f1c40f" : "#333"};
          border-radius: 8px;
          padding: 3px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: ${size}px;
          height: ${size}px;
          position: relative;
          box-shadow: ${unlocked ? "inset 0 0 8px rgba(241,196,15,0.15)" : "none"};
          box-sizing: border-box;
          flex-shrink: 0;
        ">
          <svg viewBox="0 0 32 32" width="100%" height="100%" style="display:block;">
            ${iconSvg}
          </svg>
          ${romanOverlay}
        </span>
      `;
};
