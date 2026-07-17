(function () {
  // Scoped Date wrapper referencing window.Date to bypass local temporal dead zone checks
  const ScopedDate = class extends window.Date {
    static now() {
      return window.Date.now();
    }
  };
  const Date = ScopedDate;

  // Static particle themes to avoid runtime array allocations on entity death
  window.PARTICLE_THEMES = {
    slag_slime: ["#2ecc71", "#27ae60", "#a3fd83", "#111116"],
    rust_nibbler: ["#d35400", "#e67e22", "#7f8c8d", "#5c3a21"],
    corroded_golem: ["#2ecc71", "#34495e", "#1abc9c", "#111116"],
    animated_armor: ["#34495e", "#5d6d7e", "#00d2ff", "#1a252f"],
    cursed_blade: ["#9b59b6", "#8e44ad", "#e84393", "#111116"],
    mimic_shield: ["#2c3e50", "#7f8c8d", "#f1c40f", "#e74c3c"],
    gold_dungeon: ["#ffd700", "#f1c40f", "#b7950b", "#ffffff"],
    coin_elemental: ["#ffd700", "#f1c40f", "#b7950b", "#ffffff"],
    hoard_mimic: ["#ffd700", "#f1c40f", "#b7950b", "#ffffff"],
    gilded_scuttler: ["#ffd700", "#f1c40f", "#b7950b", "#ffffff"],
    mat_dungeon: ["#2ecc71", "#27ae60", "#9b59b6", "#1abc9c"],
    swamp_basilisk: ["#2ecc71", "#27ae60", "#9b59b6", "#1abc9c"],
    toxic_fly: ["#2ecc71", "#27ae60", "#9b59b6", "#1abc9c"],
    marsh_ghost: ["#2ecc71", "#27ae60", "#9b59b6", "#1abc9c"],
    equip_dungeon: ["#34495e", "#5d6d7e", "#7f8c8d", "#1a252f"],
    golem: ["#34495e", "#5d6d7e", "#7f8c8d", "#1a252f"],
    gargoyle: ["#34495e", "#5d6d7e", "#7f8c8d", "#1a252f"],
    wyrmling: ["#34495e", "#5d6d7e", "#7f8c8d", "#1a252f"],
    magma_elemental: ["#ff5500", "#d35400", "#e74c3c", "#2c0e08"],
    lava_serpent: ["#ff5500", "#d35400", "#e74c3c", "#2c0e08"],
    hell_bat: ["#ff5500", "#d35400", "#e74c3c", "#2c0e08"],
    void_orb: ["#9b59b6", "#8e44ad", "#e84393", "#110221"],
    void_crawler: ["#9b59b6", "#8e44ad", "#e84393", "#110221"],
    void_spectre: ["#9b59b6", "#8e44ad", "#e84393", "#110221"],
    void_wraith: ["#9b59b6", "#8e44ad", "#e84393", "#110221"],
    rift_drifter: ["#9b59b6", "#8e44ad", "#e84393", "#110221"],
    clockwork_scarab: ["#dca04c", "#f1c40f", "#b7950b", "#7f8c8d"],
    temporal_watcher: ["#dca04c", "#f1c40f", "#b7950b", "#7f8c8d"],
    clockwork_drone: ["#dca04c", "#f1c40f", "#b7950b", "#7f8c8d"],
    star_weaver: ["#dca04c", "#f1c40f", "#b7950b", "#7f8c8d"],
    neon_spider: ["#00d2ff", "#ff007f", "#3498db", "#ffffff"],
    cyber_wraith: ["#00d2ff", "#ff007f", "#3498db", "#ffffff"],
    wireframe_orb: ["#00d2ff", "#ff007f", "#3498db", "#ffffff"],
    prestige_boss: ["#d35400", "#ff3300", "#111116", "#ffeaa7"],
    aegis_goliath: ["#3498db", "#2980b9", "#7f8c8d", "#ffffff"],
    chronos_arbitrator: ["#f1c40f", "#dca04c", "#7f8c8d", "#111116"],
    nexus_overseer: ["#ff007f", "#e84393", "#00b894", "#111111"],
    default_slime: ["#2ecc71", "#27ae60", "#a3fd83"],
    tier1: ["#3498db", "#ecf0f1", "#bdc3c7"],
    tier2: ["#e74c3c", "#e67e22", "#2c0e08"],
    tier3: ["#27ae60", "#1b4f30", "#9b59b6"],
    tier4: ["#8e44ad", "#e84393", "#0d011a"],
  };

  /* ==========================================================================
     PRIMARY PURPOSE: High-Fidelity Cel-Shaded Entity Rendering,
     Advanced Combat Resolution Visuals, and Particle Spawners.
     ========================================================================= */

  // --- RENDERING CONSTANTS (DEPTH HIERARCHY) ---
  window.penSky = 1.0;
  window.penFar = 1.3;
  window.penBgScenery = 1.3;
  window.penFgScenery = 1.5;
  window.penHero = 1.8;
  window.penBoss = 2.4;

  // Initialize central RenderEngine Namespace
  window.RenderEngine = {
    getStageTier() {
      let st = window.playerStats.stage;
      if (st <= 100) return 0; // Forest (Stages 1-100)
      if (st <= 200) return 1; // Peaks/Ruins (Stages 101-200)
      if (st <= 300) return 2; // Inferno (Stages 201-300)
      if (st <= 400) return 3; // Swamp (Stages 301-400)
      if (st <= 500) return 4; // Void (Stages 401-500)
      if (st <= 600) return 5; // Temporal Sanctorum (Stages 501-600)
      return 6; // Cyberspace Nexus (Stages 601+)
    },
  };

  // Legacy Compatibility Aliases to protect references
  window.getStageTier = () => window.RenderEngine.getStageTier();

  // --- VISUAL EFFECT & PARTICLE SPAWNERS ---

  // Append spawnDeathParticles inside window.RenderEngine
  Object.assign(window.RenderEngine, {
    spawnDeathParticles(x, y, mobType) {
      if (window.particles.length > 250) return;
      let count = 15;
      let colors = ["#2ecc71", "#27ae60", "#a3fd83"]; // Default Slime Green
      let speed = 4;

      // Dynamically match debris colors to the exact monster type / theme
      if (window.mob) {
        let vType = window.mob.visualType;
        let isGoldDungeon =
          window.playerStats.currentDungeon === "gold" &&
          window.playerStats.isDungeonMode;
        let isMatDungeon =
          window.playerStats.currentDungeon === "mat" &&
          window.playerStats.isDungeonMode;
        let isEquipDungeon =
          window.playerStats.currentDungeon === "equip" &&
          window.playerStats.isDungeonMode;

        if (isGoldDungeon) {
          colors = window.PARTICLE_THEMES.gold_dungeon;
        } else if (isMatDungeon) {
          colors = window.PARTICLE_THEMES.mat_dungeon;
        } else if (isEquipDungeon) {
          colors = window.PARTICLE_THEMES.equip_dungeon;
        } else if (vType && window.PARTICLE_THEMES[vType]) {
          colors = window.PARTICLE_THEMES[vType];
        } else if (window.mob.type && window.PARTICLE_THEMES[window.mob.type]) {
          colors = window.PARTICLE_THEMES[window.mob.type];
        } else if (
          mobType === "rift_guardian" ||
          mobType === "void_spectre" ||
          mobType === "void_crawler" ||
          mobType === "void_orb"
        ) {
          count = 45;
          colors = window.PARTICLE_THEMES.void_orb;
          speed = 6;
        } else if (mobType === "boss" || mobType === "dungeon_boss") {
          count = 40;
          colors = ["#e74c3c", "#e67e22", "#f1c40f", "#ffffff"];
          speed = 7;
        } else if (mobType === "prestige_boss") {
          count = 60;
          colors = window.PARTICLE_THEMES.prestige_boss;
          speed = 8;
        } else if (mobType === "dungeon_miniboss") {
          count = 25;
          colors = ["#1abc9c", "#16a085", "#34495e"];
          speed = 5;
        } else {
          let tier = window.getStageTier();
          if (tier === 1) colors = window.PARTICLE_THEMES.tier1;
          else if (tier === 2) colors = window.PARTICLE_THEMES.tier2;
          else if (tier === 3) colors = window.PARTICLE_THEMES.tier3;
          else if (tier === 4) colors = window.PARTICLE_THEMES.tier4;
        }
      }

      for (let i = 0; i < count; i++) {
        let angle = Math.random() * Math.PI * 2;
        let velocity = window.randFloat(1, speed);
        let randLife = window.randInt(25, 45);
        window.particles.push(
          window.ParticlePool.get(
            x,
            y,
            Math.cos(angle) * velocity,
            Math.sin(angle) * velocity - window.randFloat(1, 3),
            window.randFloat(1.5, 4.5),
            colors[Math.floor(Math.random() * colors.length)],
            1,
            randLife,
            randLife,
            undefined,
            true,
          ),
        );
      }
    },
  });

  // Legacy Compatibility Aliases to protect references
  window.spawnDeathParticles = (x, y, mobType) =>
    window.RenderEngine.spawnDeathParticles(x, y, mobType);

  // Append spawnTemperParticles inside window.RenderEngine
  Object.assign(window.RenderEngine, {
    spawnTemperParticles(isSuccess) {
      let cvs = document.getElementById("gameCanvas");
      let w = cvs ? cvs.width : 750;
      let h = cvs ? cvs.height : 250;
      let colors = isSuccess
        ? ["#f1c40f", "#2ecc71", "#ffffff"]
        : ["#7f8c8d", "#c0392b", "#2c3e50"];

      for (let i = 0; i < 50; i++) {
        window.particles.push(
          window.ParticlePool.get(
            w / 2,
            h / 2,
            (Math.random() - 0.5) * 16,
            (Math.random() - 0.5) * 16,
            Math.random() * 4 + 1.5,
            colors[Math.floor(Math.random() * colors.length)],
            1,
            isSuccess ? 45 : 30,
          ),
        );
      }
    },
  });

  // Legacy Compatibility Aliases to protect references
  window.spawnTemperParticles = (isSuccess) =>
    window.RenderEngine.spawnTemperParticles(isSuccess);

  // Append spawnPurchaseCelebration inside window.RenderEngine
  Object.assign(window.RenderEngine, {
    spawnPurchaseCelebration(theme, color, rarity) {
      if (window.particles.length > 300) return;
      let cvs = document.getElementById("gameCanvas");
      let spawnX = cvs ? cvs.width / 2 : 375;
      let spawnY = cvs ? cvs.height / 2 : 125;

      let count = 25;
      let speed = 5;
      let text = "✦ PURCHASED! ✦";

      if (theme === "gacha") {
        count = 55;
        speed = 8;
        text = "✦ DISPENSED! ✦";
      } else if (theme === "altar") {
        count = 65;
        speed = 11;
        text = "✦ RIFT OPENED! ✦";
      } else if (theme === "alchemy") {
        count = 20;
        speed = 4;
        text = "✦ BREWED! ✦";
      } else if (theme === "mail") {
        count = 35;
        speed = 6;
        text = "✦ GIFT CLAIMED! ✦";
      } else if (theme === "paragon") {
        count = 75;
        speed = 12;
        text = "✦ MATRIX INFUSED! ✦";
      } else if (theme === "upgrade") {
        count = 45;
        speed = 7;
        text = "✦ ATTUNEMENT AWAKENED! ✦";
      }

      if (rarity === 5 || rarity === "UNIQUE") {
        count = Math.floor(count * 2.5);
        speed *= 1.4;
        text =
          rarity === "UNIQUE" ? "✨ UNIQUE TROPHY! ✨" : "🔥 MYTHIC PULL! 🔥";
      } else if (rarity === 4) {
        count = Math.floor(count * 1.8);
        speed *= 1.2;
        text = "🌟 LEGENDARY PULL! 🌟";
      }

      for (let i = 0; i < count; i++) {
        window.particles.push(
          window.ParticlePool.get(
            spawnX + window.randFloat(-15, 15),
            spawnY + window.randFloat(-10, 10),
            (Math.random() - 0.5) * speed,
            (Math.random() - 0.7) * speed - 2.5,
            window.randFloat(
              1.5,
              rarity === 5 || rarity === "UNIQUE" ? 5.0 : 3.5,
            ),
            color || "#f1c40f",
            1,
            window.randInt(25, 60),
          ),
        );
      }

      window.effects.push({
        x: spawnX - 70,
        y: spawnY - 15,
        text: text,
        color: color || "#f1c40f",
        life: 80,
      });

      if (
        rarity === 5 ||
        rarity === 4 ||
        rarity === "UNIQUE" ||
        theme === "altar"
      ) {
        window.beams.push({
          x: spawnX,
          color: color || "#f1c40f",
          life: 50,
          maxLife: 50,
        });
        if (cvs) {
          cvs.classList.add("shake");
          setTimeout(() => cvs.classList.remove("shake"), 400);
        }
      }
    },
  });

  // Legacy Compatibility Aliases to protect references
  window.spawnPurchaseCelebration = (theme, color, rarity) =>
    window.RenderEngine.spawnPurchaseCelebration(theme, color, rarity);

  // Append spawnDamageEffect inside window.RenderEngine
  Object.assign(window.RenderEngine, {
    spawnDamageEffect(amount, type, isCrit) {
      if (!window.mob) return;

      const isBoss =
        window.mob.type === "boss" ||
        window.mob.type === "dungeon_boss" ||
        window.mob.type === "prestige_boss" ||
        window.mob.type === "rift_guardian" ||
        window.mob.type === "aegis_goliath" ||
        window.mob.type === "chronos_arbitrator" ||
        window.mob.type === "nexus_overseer";
      if (
        isBoss &&
        BigNum.from(amount).gte(BigNum.from(window.mob.maxHp).mul(0.6))
      ) {
        const funnyPhrases = [
          "OUCH!!",
          "OW!!!",
          "OWWY!!",
          "OOF",
          "MY SPINE!!",
          "NOT THE FACE!!",
          "STOP IT!!",
          "BRUH!!!",
          "REALLY?!",
          "HELP!!",
          "BOB SAGET!!",
          "WTF?!",
          "RUDE!!",
          "EMOTIONAL DAMAGE",
          "MY LEG!",
          "STOP HITTING ME",
        ];
        window.mob.funnyText =
          funnyPhrases[Math.floor(Math.random() * funnyPhrases.length)];
        window.mob.funnyTextTimer = 60;
      }

      let hitColor = "#ecf0f1";
      let hitText = window.formatNumber(amount);
      const icons = {
        slash: "⚔️",
        dagger: "🗡️",
        lightning: "⚡",
        fire: "🔥",
        frost: "❄️",
        echo: "👻",
        counter: "🛡️",
        bleed: "🩸",
      };

      if (isCrit) {
        hitColor = "#e74c3c";
        hitText = "💥 " + window.formatNumber(amount);
      } else {
        if (type === "lightning") hitColor = "#f1c40f";
        else if (type === "fire") hitColor = "#e67e22";
        else if (type === "frost") hitColor = "#3498db";
        else if (type === "echo") hitColor = "#9b59b6";
        else if (type === "counter") hitColor = "#f1c40f";
        else if (type === "aegis_counter") hitColor = "#9b59b6";
        else if (type === "parry_counter") hitColor = "#a855f7";
        else if (type === "bleed") hitColor = "#960018";
        else if (type === "poison")
          hitColor = "#2ecc71"; // Vibrant toxic green
        else if (type === "dagger") hitColor = "#a5b1c2"; // Elegant steel-grey
      }

      // Add "poison" to the icon index
      const iconsWithPoison = {
        ...icons,
        poison: "🧪",
      };

      if (type !== "slash")
        hitText = `${iconsWithPoison[type] || "❖"} ${hitText}`;

      let offsetX = window.randFloat(-40, 40);
      let offsetY = window.randFloat(-50, 15);

      if (isCrit) {
        window.effects.push(
          window.CombatEffectPool.get(
            "crit",
            window.mob.x + window.mob.w / 2 + offsetX,
            window.mob.y + offsetY,
            window.randFloat(-1.2, 1.2),
            window.randFloat(-2.0, -1.0),
            amount,
            undefined,
            45,
          ),
        );
      } else {
        // Enforce cel-shaded vector rendering for every single combat damage source!
        window.effects.push(
          window.CombatEffectPool.get(
            type,
            window.mob.x + window.mob.w / 2 + offsetX,
            window.mob.y + offsetY,
            window.randFloat(-1.2, 1.2),
            window.randFloat(-1.5, -0.6),
            amount,
            hitColor,
            40,
          ),
        );
      }

      let existingTotal = window.effects.find(
        (e) => e.isCumulative && e.life > 0,
      );
      if (existingTotal) {
        existingTotal.amount += amount;
        existingTotal.text = `TOTAL: ${window.formatNumber(existingTotal.amount)}`;
        existingTotal.life = 55;
        existingTotal.x = window.mob.x + window.mob.w / 2 - 25;
        existingTotal.y = window.mob.y - 25;
      } else {
        window.effects.push(
          window.CombatEffectPool.get(
            undefined,
            window.mob.x + window.mob.w / 2 - 25,
            window.mob.y - 25,
            0,
            -0.4,
            amount,
            "#f1c40f",
            55,
            0,
            `TOTAL: ${window.formatNumber(amount)}`,
            true,
          ),
        );
      }
    },
  });

  // Legacy Compatibility Aliases to protect references
  window.spawnDamageEffect = (amount, type, isCrit) =>
    window.RenderEngine.spawnDamageEffect(amount, type, isCrit);

  // Append renderNemesisPreview inside window.RenderEngine
  Object.assign(window.RenderEngine, {
    renderNemesisPreview(mobData) {
      const dCanvas = document.getElementById("death-enemy-canvas");
      if (!dCanvas) return;
      const dCtx = dCanvas.getContext("2d");
      dCtx.clearRect(0, 0, dCanvas.width, dCanvas.height);

      if (!mobData) {
        dCtx.fillStyle = "#c0392b";
        dCtx.font = "bold 20px sans-serif";
        dCtx.textAlign = "center";
        dCtx.textBaseline = "middle";
        dCtx.fillText("💀", dCanvas.width / 2, dCanvas.height / 2);
        return;
      }

      let renderMob = { ...mobData };
      renderMob.flashTimer = 0;

      // Calculate containing scale to keep the sprite within 80% of canvas bounds
      let maxDim = Math.max(renderMob.w, renderMob.h);
      let scale = maxDim > 0 ? (dCanvas.width * 0.8) / maxDim : 1.0;

      dCtx.save();
      // Dynamically target the exact center point of the active canvas dimensions
      dCtx.translate(dCanvas.width / 2, dCanvas.height / 2);
      dCtx.scale(scale, scale);
      dCtx.translate(
        -(renderMob.x + renderMob.w / 2),
        -(renderMob.y + renderMob.h / 2),
      );
      window.RenderEngine.drawSingleMob(dCtx, renderMob);
      dCtx.restore();
    },
  });

  // Legacy Compatibility Aliases to protect references
  window.renderNemesisPreview = (mobData) =>
    window.RenderEngine.renderNemesisPreview(mobData);

  // --- CORE MOB DRAWING ENGINE ---

  // Bind high-performance delegated proxy method to window.RenderEngine
  window.RenderEngine.drawSingleMob = (c, m) => window.drawSingleMob(c, m);

  window.drawSingleMob = function (c, m) {
    if (!m) return;
    let t = m.visualTier;
    c.save();

    let penWidth =
      m.type === "boss" ||
      m.type === "dungeon_boss" ||
      m.type === "prestige_boss" ||
      m.type === "rift_guardian" ||
      m.type === "aegis_goliath" ||
      m.type === "chronos_arbitrator" ||
      m.type === "nexus_overseer"
        ? 2.4
        : 1.8;
    c.strokeStyle = "#000000";
    c.lineWidth = penWidth;
    c.lineJoin = "round";

    if (m.flashTimer > 0) {
      c.fillStyle = "#ffffff";
    } else {
      c.fillStyle =
        m.type === "boss" ||
        m.type === "dungeon_boss" ||
        m.type === "dungeon_miniboss"
          ? "#34495e"
          : "#555";
    }

    if (m.type === "mob") {
      if (m.isRare) {
        c.save();
        let auraPulse = 1 + Math.sin(Date.now() / 150) * 0.12;
        let auraGrad = c.createRadialGradient(
          m.x + m.w / 2,
          m.y + m.h / 2,
          2,
          m.x + m.w / 2,
          m.y + m.h / 2,
          Math.max(m.w, m.h) * 1.15 * auraPulse,
        );
        auraGrad.addColorStop(0, "rgba(241, 196, 15, 0.45)");
        auraGrad.addColorStop(0.6, "rgba(230, 126, 34, 0.18)");
        auraGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
        c.fillStyle = auraGrad;
        c.beginPath();
        c.arc(
          m.x + m.w / 2,
          m.y + m.h / 2,
          Math.max(m.w, m.h) * 1.15 * auraPulse,
          0,
          Math.PI * 2,
        );
        c.fill();
        c.restore();
      }

      let vType = m.visualType;
      if (!vType) {
        let fallbacks = {
          0: "slime",
          1: "golem",
          2: "magma_elemental",
          3: "marsh_ghost",
          4: "void_orb",
        };
        vType = fallbacks[t] || "slime";
      }

      if (vType === "slime") {
        let squish = Math.sin(Date.now() / 100) * 3.5;
        let wScale = m.w / 2 + squish;
        let hScale = m.h / 2 - squish;
        let cx = m.x + m.w / 2;
        let cy = m.y + m.h - 10 + squish / 2;

        let slimeGrad = c.createRadialGradient(
          cx - 3,
          cy - 5,
          2,
          cx,
          cy,
          m.w * 0.75,
        );
        if (m.flashTimer > 0) {
          slimeGrad.addColorStop(0, "#ffffff");
          slimeGrad.addColorStop(1, "#ffffff");
        } else if (m.isRare) {
          slimeGrad.addColorStop(0, "#ffeaa7");
          slimeGrad.addColorStop(1, "#f1c40f");
        } else {
          slimeGrad.addColorStop(0, "#a3fd83");
          slimeGrad.addColorStop(1, "#2ecc71");
        }

        c.fillStyle = slimeGrad;
        c.beginPath();
        c.ellipse(cx, cy, wScale * 1.15, hScale * 0.95, 0, 0, Math.PI * 2);
        c.fill();
        c.stroke();

        if (m.flashTimer === 0) {
          c.fillStyle = "rgba(255, 255, 255, 0.6)";
          c.beginPath();
          c.ellipse(
            cx - wScale * 0.4,
            cy - hScale * 0.4,
            wScale * 0.25,
            hScale * 0.2,
            Math.PI / 4,
            0,
            Math.PI * 2,
          );
          c.fill();

          c.save();
          c.strokeStyle = "#4d2e1a";
          c.lineWidth = 2.5;
          c.beginPath();
          let stemTopY = cy - hScale * 0.95;
          c.moveTo(cx, stemTopY);
          c.quadraticCurveTo(cx - 2, stemTopY - 8, cx + 4, stemTopY - 12);
          c.stroke();

          c.fillStyle = "#2ecc71";
          c.beginPath();
          c.ellipse(
            cx + 4,
            stemTopY - 12,
            5,
            2.5,
            -Math.PI / 6,
            0,
            Math.PI * 2,
          );
          c.fill();
          c.strokeStyle = "#000000";
          c.lineWidth = 1.2;
          c.stroke();
          c.restore();

          c.fillStyle = "#1e272e";
          let eyeOffsetX = wScale * 0.3;
          let eyeOffsetY = hScale * 0.1;
          let eyeRadius = Math.max(1, hScale * 0.12);
          c.beginPath();
          c.arc(cx - eyeOffsetX, cy - eyeOffsetY, eyeRadius, 0, Math.PI * 2);
          c.arc(cx + eyeOffsetX, cy - eyeOffsetY, eyeRadius, 0, Math.PI * 2);
          c.fill();

          c.fillStyle = "#ffffff";
          c.beginPath();
          c.arc(
            cx - eyeOffsetX - eyeRadius * 0.2,
            cy - eyeOffsetY - eyeRadius * 0.2,
            eyeRadius * 0.3,
            0,
            Math.PI * 2,
          );
          c.arc(
            cx + eyeOffsetX - eyeRadius * 0.2,
            cy - eyeOffsetY - eyeRadius * 0.2,
            eyeRadius * 0.3,
            0,
            Math.PI * 2,
          );
          c.fill();

          c.strokeStyle = "#1e272e";
          c.lineWidth = 2;
          c.beginPath();
          c.arc(cx, cy + hScale * 0.05, wScale * 0.12, 0, Math.PI);
          c.stroke();

          c.fillStyle = "rgba(231, 76, 60, 0.4)";
          c.beginPath();
          c.ellipse(
            cx - eyeOffsetX - 2,
            cy - eyeOffsetY + 3,
            2.5,
            1.2,
            0,
            0,
            Math.PI * 2,
          );
          c.ellipse(
            cx + eyeOffsetX + 2,
            cy - eyeOffsetY + 3,
            2.5,
            1.2,
            0,
            0,
            Math.PI * 2,
          );
          c.fill();
        }
      } else if (vType === "coin_elemental") {
        let cx = m.x + m.w / 2;
        let cy = m.y + m.h / 2 + Math.sin(Date.now() / 150) * 3;

        // Precompute coordinates and depth state for the 6 orbiting gold coins
        let coinsList = [];
        for (let i = 0; i < 6; i++) {
          let angle = Date.now() / 600 + (i * Math.PI * 2) / 6;
          let dist = 18 + Math.sin(Date.now() / 150 + i) * 3;
          let ox = cx + Math.cos(angle) * dist * 1.3;
          let oy = cy + Math.sin(angle) * dist * 0.5;
          let isBehind = Math.sin(angle) < 0; // True if positioned behind core

          let rot = angle * 2;
          let cw = 6 * Math.abs(Math.sin(rot));
          let ch = 6;

          coinsList.push({ ox, oy, cw, ch, isBehind });
        }

        let drawCoinPiece = (cn) => {
          c.save();
          c.translate(cn.ox, cn.oy);
          c.rotate(Math.PI / 12);

          c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#b7950b";
          c.beginPath();
          c.ellipse(0, 0, cn.cw + 1.2, cn.ch + 1.2, 0, 0, Math.PI * 2);
          c.fill();
          c.stroke();

          if (m.flashTimer === 0) {
            c.fillStyle = "#ffd700";
            c.beginPath();
            c.ellipse(0, 0, cn.cw, cn.ch, 0, 0, Math.PI * 2);
            c.fill();
            c.strokeStyle = "#b7950b";
            c.lineWidth = 0.8;
            c.beginPath();
            c.ellipse(0, 0, cn.cw * 0.8, cn.ch * 0.8, 0, 0, Math.PI * 2);
            c.stroke();
            c.fillStyle = "rgba(255,255,255,0.75)";
            c.beginPath();
            c.ellipse(
              -cn.cw * 0.3,
              -cn.ch * 0.3,
              cn.cw * 0.25,
              cn.ch * 0.2,
              Math.PI / 4,
              0,
              Math.PI * 2,
            );
            c.fill();
          }
          c.restore();
        };

        // 1. Draw BACK half of orbiting rings first (Math.PI to 2*Math.PI)
        c.save();
        c.translate(cx, cy);
        c.strokeStyle = "rgba(241, 196, 15, 0.35)";
        c.lineWidth = 1;

        c.save();
        c.rotate(Math.PI / 6);
        c.beginPath();
        c.ellipse(0, 0, 22, 7, 0, Math.PI, 0); // Upper arc (behind)
        c.stroke();
        c.restore();

        c.save();
        c.rotate(-Math.PI / 4);
        c.beginPath();
        c.ellipse(0, 0, 26, 8, 0, Math.PI, 0); // Upper arc (behind)
        c.stroke();
        c.restore();
        c.restore();

        // 2. Draw BACK coins
        coinsList.forEach((cn) => {
          if (cn.isBehind) drawCoinPiece(cn);
        });

        // 3. Draw central glowing nucleus core
        let coreGrad = c.createRadialGradient(cx, cy, 1, cx, cy, 10);
        coreGrad.addColorStop(0, "#ffffff");
        coreGrad.addColorStop(0.5, "#ffd700");
        coreGrad.addColorStop(1, "rgba(255, 215, 0, 0)");
        c.fillStyle = coreGrad;
        c.beginPath();
        c.arc(cx, cy, 12, 0, Math.PI * 2);
        c.fill();

        // 4. Draw FRONT half of orbiting rings (0 to Math.PI)
        c.save();
        c.translate(cx, cy);
        c.strokeStyle = "rgba(241, 196, 15, 0.35)";
        c.lineWidth = 1;

        c.save();
        c.rotate(Math.PI / 6);
        c.beginPath();
        c.ellipse(0, 0, 22, 7, 0, 0, Math.PI); // Lower arc (in front of body)
        c.stroke();
        c.restore();

        c.save();
        c.rotate(-Math.PI / 4);
        c.beginPath();
        c.ellipse(0, 0, 26, 8, 0, 0, Math.PI); // Lower arc (in front of body)
        c.stroke();
        c.restore();
        c.restore();

        // 5. Draw FRONT coins
        coinsList.forEach((cn) => {
          if (!cn.isBehind) drawCoinPiece(cn);
        });
      } else if (vType === "hoard_mimic") {
        let cx = m.x + m.w / 2;
        let cy = m.y + m.h - 15;
        let time = Date.now();
        let snap = Math.abs(Math.sin(time / 200));
        let lidAngle = -snap * 0.45;

        c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#4a2d18";
        c.beginPath();
        c.rect(cx - 15, cy - 8, 30, 16);
        c.fill();
        c.stroke();

        c.fillStyle = "#ffd700";
        c.beginPath();
        c.ellipse(cx, cy - 8, 12, 3, 0, 0, Math.PI * 2);
        c.fill();
        c.stroke();

        c.fillStyle = "#ffd700";
        c.strokeStyle = "#4d2e1a";
        c.lineWidth = 1;
        for (let i = -12; i <= 12; i += 6) {
          c.beginPath();
          c.moveTo(cx + i - 2, cy - 8 - lidAngle * 10);
          c.lineTo(cx + i, cy - 4 - lidAngle * 10);
          c.lineTo(cx + i + 2, cy - 8 - lidAngle * 10);
          c.closePath();
          c.fill();
          c.stroke();

          c.beginPath();
          c.moveTo(cx + i - 2, cy - 8);
          c.lineTo(cx + i, cy - 11);
          c.lineTo(cx + i + 2, cy - 8);
          c.closePath();
          c.fill();
          c.stroke();
        }

        if (m.flashTimer === 0) {
          let tSway = Math.sin(time / 80) * 6;
          c.strokeStyle = "#8e44ad";
          c.lineWidth = 3.5;
          c.lineCap = "round";
          c.beginPath();
          c.moveTo(cx, cy - 8);
          c.quadraticCurveTo(
            cx - 6 + tSway / 2,
            cy - 12,
            cx - 12 + tSway,
            cy - 16,
          );
          c.stroke();
          c.fillStyle = "#8e44ad";
          c.beginPath();
          c.arc(cx - 12 + tSway, cy - 16, 2, 0, Math.PI * 2);
          c.fill();
        }

        c.save();
        c.translate(cx + 15, cy - 8);
        c.rotate(lidAngle);
        c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#5c3a21";
        c.beginPath();
        c.rect(-30, -10, 30, 10);
        c.fill();
        c.stroke();
        c.fillStyle = "#7f8c8d";
        c.fillRect(-17, -10, 4, 10);
        c.strokeRect(-17, -10, 4, 10);
        c.fillStyle = "#ffd700";
        c.fillRect(-16, -2, 2, 5);
        c.strokeRect(-16, -2, 2, 5);
        c.restore();

        if (
          snap > 0.6 &&
          Math.random() < 0.1 &&
          window.particles.length < 250 &&
          !window.isGamePaused
        ) {
          window.particles.push({
            x: cx + window.randFloat(-8, 8),
            y: cy - 9,
            vx: window.randFloat(-1, 1),
            vy: -window.randFloat(1, 2.5),
            radius: window.randFloat(1, 2),
            color: "#ffd700",
            alpha: 0.9,
            life: window.randInt(15, 30),
          });
        }
      } else if (vType === "gilded_scuttler") {
        let cx = m.x + m.w / 2;
        let cy = m.y + m.h - 15;
        let time = Date.now();
        let legWalk = Math.sin(time / 60) * 3;

        c.strokeStyle = m.flashTimer > 0 ? "#ffffff" : "#b7950b";
        c.lineWidth = 2.4;
        for (let i = -1; i <= 1; i += 2) {
          let legX = cx + i * 12;
          c.beginPath();
          c.moveTo(legX, cy + 4);
          c.lineTo(legX + i * 6 + legWalk * i, cy + 12);
          c.stroke();

          c.beginPath();
          c.moveTo(legX - i * 4, cy + 4);
          c.lineTo(legX - i * 10 - legWalk * i, cy + 12);
          c.stroke();
        }

        c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#ffd700";
        c.beginPath();
        c.ellipse(cx - 10, cy - 2, 4, 3, 0, 0, Math.PI * 2);
        c.fill();
        c.stroke();
        c.beginPath();
        c.moveTo(cx - 12, cy - 2);
        c.quadraticCurveTo(cx - 18, cy - 8 + legWalk, cx - 22, cy - 4);
        c.quadraticCurveTo(cx - 16, cy, cx - 12, cy - 2);
        c.fill();
        c.stroke();

        let sAngle = Math.PI / 12 + Math.sin(time / 150) * 0.05;
        c.save();
        c.translate(cx + 2, cy - 2);
        c.rotate(sAngle);

        c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#967507";
        c.beginPath();
        c.arc(0, 0, 13.5, 0, Math.PI * 2);
        c.fill();
        c.stroke();

        c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#ffd700";
        c.beginPath();
        c.arc(0, 0, 12, 0, Math.PI * 2);
        c.fill();
        c.stroke();

        if (m.flashTimer === 0) {
          c.strokeStyle = "#b7950b";
          c.lineWidth = 1.2;
          c.beginPath();
          c.arc(0, 0, 10, 0, Math.PI * 2);
          c.stroke();

          c.strokeStyle = "#4d2e1a";
          c.lineWidth = 1.5;
          c.beginPath();
          c.moveTo(-4, -4);
          c.lineTo(4, 4);
          c.moveTo(4, -4);
          c.lineTo(-4, 4);
          c.moveTo(0, -5);
          c.lineTo(0, 5);
          c.stroke();

          c.fillStyle = "rgba(255, 255, 255, 0.8)";
          c.beginPath();
          c.arc(-5, -5, 2, 0, Math.PI * 2);
          c.fill();
        }
        c.restore();

        if (m.flashTimer === 0) {
          c.fillStyle = "#ff0055";
          c.beginPath();
          c.arc(cx - 12, cy - 3, 1.2, 0, Math.PI * 2);
          c.fill();
        }
      } else if (vType === "golem") {
        let hover = Math.sin(Date.now() / 120) * 2.5;
        let bodyColor = m.flashTimer > 0 ? "#ffffff" : "#7f8c8d"; // Granite grey
        let trimColor = m.flashTimer > 0 ? "#ffffff" : "#95a5a6"; // Light stone
        let runeColor = m.isRare ? "#ff007f" : "#00d2ff"; // Glowing sapphire

        // Levitating Stone Shoulders
        c.fillStyle = trimColor;
        c.beginPath();
        c.roundRect(m.x + 2, m.y + 2 + hover, 6, 8, [1]);
        c.roundRect(m.x + m.w - 8, m.y + 2 + hover, 6, 8, [1]);
        c.fill();
        c.stroke();

        // Main Granite Torso
        c.fillStyle = bodyColor;
        c.beginPath();
        c.roundRect(m.x + 3, m.y + 12 + hover, m.w - 6, m.h - 14, [6]);
        c.fill();
        c.stroke();

        // Chiseled Head
        c.fillStyle = trimColor;
        c.beginPath();
        c.roundRect(m.x + 6, m.y + 4 + hover, m.w - 12, 10, [2]);
        c.fill();
        c.stroke();

        // Glowing Core Eye
        if (m.flashTimer === 0) {
          c.fillStyle = runeColor;
          c.shadowBlur = 8;
          c.shadowColor = runeColor;
          c.beginPath();
          c.rect(m.x + 9, m.y + 8 + hover, m.w - 18, 2.5);
          c.fill();
          c.shadowBlur = 0;
        }

        // Giant Fists
        c.fillStyle = bodyColor;
        c.beginPath();
        c.roundRect(m.x - 5, m.y + 14 + hover, 8, 12, [3]);
        c.roundRect(m.x + m.w - 3, m.y + 14 + hover, 8, 12, [3]);
        c.fill();
        c.stroke();

        // Crystals on Fists
        c.fillStyle = runeColor;
        c.beginPath();
        c.arc(m.x - 1, m.y + 18 + hover, 1.5, 0, Math.PI * 2);
        c.arc(m.x + m.w + 1, m.y + 18 + hover, 1.5, 0, Math.PI * 2);
        c.fill();
        c.stroke();

        // Crystal geode core fissure
        if (m.flashTimer === 0) {
          c.strokeStyle = runeColor;
          c.lineWidth = 2;
          c.beginPath();
          c.moveTo(m.x + m.w / 2, m.y + 15 + hover);
          c.lineTo(m.x + m.w / 2, m.y + m.h - 11 + hover);
          c.moveTo(m.x + m.w / 2 - 3, m.y + 21 + hover);
          c.lineTo(m.x + m.w / 2 + 3, m.y + 21 + hover);
          c.stroke();
        }
      } else if (vType === "wyrmling") {
        let cx = m.x + m.w / 2;
        let cy = m.y + m.h / 2 + Math.sin(Date.now() / 100) * 3;
        let bodyColor =
          m.flashTimer > 0 ? "#ffffff" : m.isRare ? "#8e44ad" : "#3498db"; // Sky blue scale
        let ringColor = m.isRare ? "#ff007f" : "rgba(255, 255, 255, 0.55)"; // Swirling frost

        // Segmented winged body drakes
        for (let i = 3; i >= 0; i--) {
          let segX = cx + i * 8;
          let segY = cy + Math.sin(Date.now() / 150 - i) * 5;

          // Swirling icy particles orbiting the segmented tail
          if (m.flashTimer === 0) {
            c.strokeStyle = ringColor;
            c.lineWidth = 1.2;
            c.save();
            c.translate(segX, segY);
            c.rotate(Date.now() / 250 + i);
            c.beginPath();
            c.ellipse(0, 0, 11 - i * 1.5, 4 - i * 0.5, 0, 0, Math.PI * 2);
            c.stroke();
            c.restore();
          }

          c.fillStyle = bodyColor;
          c.beginPath();
          c.arc(segX, segY, 8.5 - i * 1.3, 0, Math.PI * 2);
          c.fill();
          c.stroke();
        }

        // Feathered Drake Head
        c.fillStyle = bodyColor;
        c.beginPath();
        c.arc(cx, cy - 13, 8.5, 0, Math.PI * 2);
        c.fill();
        c.stroke();

        // White beak/horns
        c.fillStyle = "#ffffff";
        c.beginPath();
        c.moveTo(cx - 3, cy - 20);
        c.lineTo(cx, cy - 26);
        c.lineTo(cx + 3, cy - 20);
        c.closePath();
        c.fill();
        c.stroke();

        // Sub-zero frost vapors
        if (m.flashTimer === 0) {
          c.fillStyle = "#81ecec";
          c.shadowBlur = 6;
          c.shadowColor = "#81ecec";
          c.beginPath();
          c.arc(cx - 3, cy - 14, 1.5, 0, Math.PI * 2);
          c.arc(cx + 3, cy - 14, 1.5, 0, Math.PI * 2);
          c.fill();
          c.shadowBlur = 0;

          if (Math.random() < 0.15 && !window.isGamePaused) {
            window.particles.push({
              x: cx + window.randFloat(-5, 5),
              y: cy - 14,
              vx: -window.randFloat(1, 3),
              vy: window.randFloat(-1, 1),
              radius: window.randFloat(1, 2.2),
              color: m.isRare ? "#ff007f" : "#ffffff",
              alpha: 0.85,
              life: window.randInt(12, 22),
            });
          }
        }
      } else if (vType === "rift_drifter") {
        let hover = Math.sin(Date.now() / 110) * 6;
        let cx = m.x + m.w / 2;
        let cy = m.y + m.h / 2 + hover;
        let coreGrad = c.createRadialGradient(cx, cy, 1, cx, cy, 12);
        coreGrad.addColorStop(0, "#ffffff");
        coreGrad.addColorStop(0.4, "#e84393");
        coreGrad.addColorStop(1, "rgba(142, 68, 173, 0)");
        c.fillStyle = coreGrad;
        c.beginPath();
        c.arc(cx, cy, 12, 0, Math.PI * 2);
        c.fill();
        c.fillStyle = "#8e44ad";
        c.strokeStyle = "#000000";
        c.lineWidth = 1.5;
        for (let i = 0; i < 3; i++) {
          let angle = Date.now() / 180 + (i * Math.PI * 2) / 3;
          let sx = cx + Math.cos(angle) * 16;
          let sy = cy + Math.sin(angle) * 8;
          c.beginPath();
          c.moveTo(sx, sy - 4);
          c.lineTo(sx + 3, sy);
          c.lineTo(sx, sy + 4);
          c.lineTo(sx - 3, sy);
          c.closePath();
          c.fill();
          c.stroke();
        }
      } else if (vType === "star_weaver") {
        let cx = m.x + m.w / 2;
        let cy = m.y + m.h / 2 + Math.sin(Date.now() / 130) * 4;
        c.save();
        c.strokeStyle = "#3498db";
        c.lineWidth = 1.8;
        c.shadowBlur = 10;
        c.shadowColor = "#3498db";
        c.beginPath();
        c.moveTo(cx, cy - 12);
        c.lineTo(cx + 10, cy);
        c.lineTo(cx + 6, cy + 10);
        c.lineTo(cx - 6, cy + 10);
        c.lineTo(cx - 10, cy);
        c.closePath();
        c.stroke();
        c.fillStyle = "#ffffff";
        let joints = [
          [cx, cy - 12],
          [cx + 10, cy],
          [cx + 6, cy + 10],
          [cx - 6, cy + 10],
          [cx - 10, cy],
        ];
        joints.forEach((j) => {
          c.beginPath();
          c.arc(j[0], j[1], 2.5, 0, Math.PI * 2);
          c.fill();
          c.stroke();
        });
        c.strokeStyle = "#ffffff";
        c.lineWidth = 1.5;
        for (let i = 0; i < 4; i++) {
          let side = i % 2 === 0 ? -1 : 1;
          let legYOffset = i < 2 ? -4 : 4;
          let swing = Math.sin(Date.now() / 80 + i) * 6;
          c.beginPath();
          c.moveTo(cx + 10 * side, cy + legYOffset);
          c.lineTo(cx + 22 * side + swing, cy + legYOffset - 4);
          c.lineTo(cx + 26 * side + swing, cy + legYOffset + 14);
          c.stroke();
        }
        c.restore();
      } else if (vType === "void_wraith") {
        let hover = Math.sin(Date.now() / 150) * 6;
        let cx = m.x + m.w / 2;
        let cy = m.y + m.h / 2 - 2 + hover;
        c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#1b0a2a";
        c.strokeStyle = "#000000";
        c.lineWidth = 1.8;
        c.beginPath();
        c.moveTo(cx, cy - 16);
        c.quadraticCurveTo(cx - 12, cy - 6, cx - 10, cy + 14);
        c.lineTo(cx - 4, cy + 8);
        c.lineTo(cx, cy + 18);
        c.lineTo(cx + 4, cy + 8);
        c.lineTo(cx + 10, cy + 14);
        c.quadraticCurveTo(cx + 13, cy - 6, cx, cy - 16);
        c.closePath();
        c.fill();
        c.stroke();
        if (m.flashTimer === 0) {
          c.strokeStyle = "#8e44ad";
          c.lineWidth = 2.0;
          let clawSwing = Math.sin(Date.now() / 100) * 3;
          c.beginPath();
          c.moveTo(cx - 8, cy + 2);
          c.lineTo(cx - 16 + clawSwing, cy + 4);
          c.lineTo(cx - 20 + clawSwing, cy + 1);
          c.moveTo(cx - 8, cy + 2);
          c.lineTo(cx - 17 + clawSwing, cy + 7);
          c.stroke();
          c.fillStyle = "#e84393";
          c.shadowBlur = 6;
          c.shadowColor = "#e84393";
          c.beginPath();
          c.ellipse(cx - 3, cy - 5, 1.2, 3, Math.PI / 12, 0, Math.PI * 2);
          c.ellipse(cx + 1, cy - 5, 1.2, 3, -Math.PI / 12, 0, Math.PI * 2);
          c.fill();
          c.shadowBlur = 0;
        }
      } else if (vType === "sprout") {
        let squish = Math.sin(Date.now() / 110) * 2.5;
        let wScale = m.w / 2 + squish;
        let hScale = m.h / 2 - squish;
        let cx = m.x + m.w / 2;
        let cy = m.y + m.h;
        c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#fdf6e2";
        c.beginPath();
        c.ellipse(
          cx,
          cy - hScale * 0.4,
          wScale * 0.65,
          hScale * 0.45,
          0,
          0,
          Math.PI * 2,
        );
        c.fill();
        c.stroke();
        if (m.flashTimer === 0) {
          c.fillStyle = "#1e272e";
          let eyeOffsetX = wScale * 0.22;
          let eyeY = cy - hScale * 0.45;
          let eyeSize = Math.max(1, hScale * 0.12);
          c.beginPath();
          c.arc(cx - eyeOffsetX, eyeY, eyeSize, 0, Math.PI * 2);
          c.arc(cx + eyeOffsetX, eyeY, eyeSize, 0, Math.PI * 2);
          c.fill();
          c.fillStyle = "rgba(231, 76, 60, 0.45)";
          c.beginPath();
          c.ellipse(cx - eyeOffsetX - 3, eyeY + 3, 3, 1.5, 0, 0, Math.PI * 2);
          c.ellipse(cx + eyeOffsetX + 3, eyeY + 3, 3, 1.5, 0, 0, Math.PI * 2);
          c.fill();
        }
        let capY = cy - hScale * 1.05;
        c.fillStyle =
          m.flashTimer > 0 ? "#ffffff" : m.isRare ? "#f1c40f" : "#ff6b1a";
        c.beginPath();
        c.ellipse(cx, capY, wScale * 1.25, hScale * 0.85, 0, Math.PI, 0);
        c.lineTo(cx + wScale * 1.25, capY + hScale * 0.1);
        c.quadraticCurveTo(
          cx,
          capY + hScale * 0.4,
          cx - wScale * 1.25,
          capY + hScale * 0.1,
        );
        c.closePath();
        c.fill();
        c.stroke();
        if (m.flashTimer === 0) {
          c.fillStyle = "rgba(255, 255, 255, 0.5)";
          c.beginPath();
          c.ellipse(
            cx - wScale * 0.5,
            capY - hScale * 0.35,
            wScale * 0.3,
            hScale * 0.15,
            -Math.PI / 6,
            0,
            Math.PI * 2,
          );
          c.fill();
        }
      } else if (vType === "thorn_wyrm") {
        let cx = m.x + m.w / 2;
        let cy = m.y + m.h / 2 + 10;
        let time = Date.now() / 130;
        c.strokeStyle = "#000000";
        c.lineWidth = 2;
        for (let i = 0; i < 5; i++) {
          let segX = cx + i * 9;
          let segY = cy + Math.sin(time - i * 0.8) * 5;
          c.beginPath();
          c.moveTo(segX, segY + 4);
          c.lineTo(segX - 3, segY + 12 + Math.sin(time * 2 + i) * 3);
          c.stroke();
        }
        for (let i = 4; i >= 0; i--) {
          let segX = cx + i * 9;
          let segY = cy + Math.sin(time - i * 0.8) * 5;
          let radius = 10 - i * 1.1;
          c.fillStyle =
            m.flashTimer > 0 ? "#ffffff" : m.isRare ? "#e67e22" : "#27ae60";
          c.beginPath();
          c.arc(segX, segY, radius, 0, Math.PI * 2);
          c.fill();
          c.stroke();
          if (m.flashTimer === 0) {
            c.fillStyle = m.isRare ? "#f1c40f" : "#1e8449";
            c.beginPath();
            c.moveTo(segX + 2, segY - radius);
            c.quadraticCurveTo(
              segX + 5,
              segY - radius - 6,
              segX,
              segY - radius - 8,
            );
            c.quadraticCurveTo(
              segX - 3,
              segY - radius - 4,
              segX - 2,
              segY - radius,
            );
            c.closePath();
            c.fill();
            c.stroke();
          }
        }
        c.fillStyle =
          m.flashTimer > 0 ? "#ffffff" : m.isRare ? "#f39c12" : "#2ecc71";
        let hX = cx - 8;
        let hY = cy + Math.sin(time) * 5;
        c.beginPath();
        c.arc(hX, hY, 11, 0, Math.PI * 2);
        c.fill();
        c.stroke();
        if (m.flashTimer === 0) {
          c.fillStyle = m.isRare ? "#ffea75" : "#2ecc71";
          c.beginPath();
          c.moveTo(hX - 4, hY - 8);
          c.quadraticCurveTo(hX - 12, hY - 16, hX - 15, hY - 14);
          c.quadraticCurveTo(hX - 8, hY - 6, hX - 2, hY - 6);
          c.closePath();
          c.fill();
          c.stroke();
          c.fillStyle = "#ffffff";
          c.beginPath();
          c.arc(hX - 4, hY - 2, 2.5, 0, Math.PI * 2);
          c.fill();
          c.stroke();
          c.fillStyle = "#1e272e";
          c.beginPath();
          c.arc(hX - 5, hY - 2, 1.2, 0, Math.PI * 2);
          c.fill();
        }
      } else if (vType === "gargoyle") {
        let cx = m.x + m.w / 2;
        let cy = m.y + m.h / 2;
        let wings = Math.sin(Date.now() / 90) * 11;
        let skinColor = m.flashTimer > 0 ? "#ffffff" : "#4a5568"; // Moss-gray ruins stone
        let wingColor = m.flashTimer > 0 ? "#ffffff" : "#2f3640"; // Weathered slate
        let eyeColor = m.isRare ? "#00ffff" : "#f39c12"; // Glowing amber

        // Weathered chiseled ruin wings
        c.fillStyle = wingColor;
        c.beginPath();
        c.moveTo(cx - 3, cy);
        c.lineTo(cx - 24, cy - 14 + wings);
        c.lineTo(cx - 18, cy + 4);
        c.lineTo(cx - 22, cy + 12);
        c.lineTo(cx - 8, cy + 5);
        c.closePath();
        c.moveTo(cx + 3, cy);
        c.lineTo(cx + 24, cy - 14 + wings);
        c.lineTo(cx + 18, cy + 4);
        c.lineTo(cx + 22, cy + 12);
        c.lineTo(cx + 8, cy + 5);
        c.closePath();
        c.fill();
        c.stroke();

        // Main moss-grown stone torso
        c.fillStyle = skinColor;
        c.beginPath();
        c.ellipse(cx, cy + 6, 8.5, 11.5, 0, 0, Math.PI * 2);
        c.fill();
        c.stroke();

        // Mossy patches
        if (m.flashTimer === 0) {
          c.fillStyle = "#164d1f";
          c.beginPath();
          c.ellipse(cx - 3, cy + 3, 3, 4, Math.PI / 4, 0, Math.PI * 2);
          c.ellipse(cx + 4, cy + 8, 2.5, 3, -Math.PI / 4, 0, Math.PI * 2);
          c.fill();
        }

        // Masonry Head
        c.fillStyle = skinColor;
        c.beginPath();
        c.arc(cx, cy - 10, 7.8, 0, Math.PI * 2);
        c.fill();
        c.stroke();

        // Chiseled horns
        c.fillStyle = wingColor;
        c.beginPath();
        c.moveTo(cx - 6, cy - 14);
        c.quadraticCurveTo(cx - 12, cy - 22, cx - 14, cy - 20);
        c.lineTo(cx - 2, cy - 12);
        c.closePath();
        c.moveTo(cx + 6, cy - 14);
        c.quadraticCurveTo(cx + 12, cy - 22, cx + 14, cy - 20);
        c.lineTo(cx + 2, cy - 12);
        c.closePath();
        c.fill();
        c.stroke();

        // Glowing Amber Eyes
        if (m.flashTimer === 0) {
          c.fillStyle = eyeColor;
          c.shadowBlur = 6;
          c.shadowColor = eyeColor;
          c.beginPath();
          c.arc(cx - 2.5, cy - 11, 1.6, 0, Math.PI * 2);
          c.arc(cx + 2.5, cy - 11, 1.6, 0, Math.PI * 2);
          c.fill();
          c.shadowBlur = 0;
        }

        // Wields a tiny weathered stone relic greatsword
        c.fillStyle = "#95a5a6";
        c.beginPath();
        c.moveTo(cx - 10, cy + 2);
        c.lineTo(cx - 22, cy + 12);
        c.lineTo(cx - 19, cy + 15);
        c.lineTo(cx - 7, cy + 5);
        c.closePath();
        c.fill();
        c.stroke();

        // Weathered hilt inscription
        if (m.flashTimer === 0) {
          c.strokeStyle = "#ffd700";
          c.lineWidth = 1;
          c.beginPath();
          c.moveTo(cx - 13, cy + 5);
          c.lineTo(cx - 18, cy + 10);
          c.stroke();
        }
      } else if (vType === "magma_elemental") {
        let flicker = Math.sin(Date.now() / 60) * 3;
        let cx = m.x + m.w / 2;
        let cy = m.y + m.h / 2;
        c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#1a0805";
        c.beginPath();
        c.roundRect(cx - 14, cy - 6, 28, 22, [4]);
        c.fill();
        c.stroke();
        if (m.flashTimer === 0) {
          c.strokeStyle = "#ff5500";
          c.lineWidth = 2;
          c.beginPath();
          c.moveTo(cx - 6, cy);
          c.stroke();
        }
        c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#d35400";
        c.beginPath();
        c.moveTo(cx - 14, cy);
        c.quadraticCurveTo(cx - 24 - flicker, cy + 4, cx - 20, cy + 12);
        c.lineTo(cx - 11, cy + 6);
        c.moveTo(cx + 14, cy);
        c.quadraticCurveTo(cx + 24 + flicker, cy + 4, cx + 20, cy + 12);
        c.lineTo(cx + 11, cy + 6);
        c.closePath();
        c.fill();
        c.stroke();
        c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#2d110b";
        c.beginPath();
        c.arc(cx, cy - 12, 8, 0, Math.PI * 2);
        c.fill();
        c.stroke();
        c.fillStyle = "#e67e22";
        c.beginPath();
        c.moveTo(cx - 6, cy - 18);
        c.quadraticCurveTo(cx, cy - 28 - flicker, cx + 6, cy - 18);
        c.quadraticCurveTo(cx + 3, cy - 12, cx - 3, cy - 12);
        c.closePath();
        c.fill();
        c.stroke();
        if (m.flashTimer === 0) {
          c.fillStyle = "#f1c40f";
          c.beginPath();
          c.arc(cx - 3, cy - 12, 1.5, 0, Math.PI * 2);
          c.arc(cx + 3, cy - 12, 1.5, 0, Math.PI * 2);
          c.fill();
        }
      } else if (vType === "lava_serpent") {
        let cx = m.x + m.w / 2;
        let cy = m.y + m.h / 2 + 5;
        let time = Date.now() / 140;
        if (
          Math.random() < 0.15 &&
          window.particles.length < 200 &&
          !window.isGamePaused
        ) {
          window.particles.push({
            x: cx + window.randFloat(0, 30),
            y: cy - 10,
            vx: -window.randFloat(0.5, 1.5),
            vy: -window.randFloat(1, 2.5),
            radius: window.randFloat(1, 3),
            color: "rgba(230, 126, 34, 0.4)",
            alpha: 0.8,
            life: window.randInt(15, 30),
          });
        }
        for (let i = 5; i >= 0; i--) {
          let segX = cx + i * 10;
          let segY = cy + Math.sin(time - i * 0.8) * 6;
          let radius = 10.5 - i * 1.1;
          c.fillStyle =
            m.flashTimer > 0 ? "#ffffff" : m.isRare ? "#ff8c00" : "#1c0905";
          c.beginPath();
          c.arc(segX, segY, radius, 0, Math.PI * 2);
          c.fill();
          c.stroke();
          if (m.flashTimer === 0) {
            c.fillStyle = m.isRare ? "#ffffff" : "#ff3300";
            c.beginPath();
            c.arc(segX, segY, radius * 0.45, 0, Math.PI * 2);
            c.fill();
            c.fillStyle = "#2c110c";
            c.beginPath();
            c.moveTo(segX + 1, segY - radius);
            c.lineTo(segX - 3, segY - radius - 5);
            c.lineTo(segX - 4, segY - radius);
            c.closePath();
            c.fill();
            c.stroke();
          }
        }
        c.fillStyle =
          m.flashTimer > 0 ? "#ffffff" : m.isRare ? "#ff4500" : "#110200";
        let hX = cx - 8;
        let hY = cy + Math.sin(time) * 6;
        c.beginPath();
        c.moveTo(hX + 10, hY - 10);
        c.lineTo(hX - 12, hY - 8);
        c.lineTo(hX - 14, hY + 2);
        c.lineTo(hX + 10, hY + 11);
        c.closePath();
        c.fill();
        c.stroke();
        if (m.flashTimer === 0) {
          c.fillStyle = "#e67e22";
          c.beginPath();
          c.moveTo(hX + 4, hY - 9);
          c.quadraticCurveTo(hX + 12, hY - 18, hX + 16, hY - 16);
          c.lineTo(hX + 6, hY - 4);
          c.closePath();
          c.fill();
          c.stroke();
          c.fillStyle = "#f1c40f";
          c.beginPath();
          c.arc(hX - 3, hY - 2, 2, 0, Math.PI * 2);
          c.fill();
        }
      } else if (vType === "hell_bat") {
        let cx = m.x + m.w / 2;
        let cy = m.y + m.h / 2 + Math.sin(Date.now() / 110) * 3;
        let batWing = Math.sin(Date.now() / 70) * 11;
        c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#1e1f26";
        c.beginPath();
        c.ellipse(cx, cy, 7, 11, 0, 0, Math.PI * 2);
        c.fill();
        c.stroke();
        c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#962d22";
        c.beginPath();
        c.moveTo(cx - 5, cy - 2);
        c.quadraticCurveTo(
          cx - 18,
          cy - 12 - batWing,
          cx - 22,
          cy - 5 - batWing,
        );
        c.quadraticCurveTo(cx - 12, cy, cx - 5, cy - 2);
        c.moveTo(cx + 5, cy - 2);
        c.quadraticCurveTo(
          cx + 18,
          cy - 12 - batWing,
          cx + 22,
          cy - 5 - batWing,
        );
        c.quadraticCurveTo(cx + 12, cy, cx + 5, cy - 2);
        c.closePath();
        c.fill();
        c.stroke();
        if (m.flashTimer === 0) {
          c.fillStyle = "#ff6b6b";
          c.beginPath();
          c.arc(cx - 2, cy - 4, 1.5, 0, Math.PI * 2);
          c.arc(cx + 2, cy - 4, 1.5, 0, Math.PI * 2);
          c.fill();
        }
      } else if (vType === "swamp_basilisk") {
        let cx = m.x + m.w / 2;
        let cy = m.y + m.h / 2 + 5;
        let time = Date.now() / 150;
        for (let i = 5; i >= 0; i--) {
          let segX = cx + i * 10;
          let segY = cy + Math.sin(time - i * 0.8) * 6;
          let radius = 10.5 - i * 1.1;
          c.fillStyle =
            m.flashTimer > 0 ? "#ffffff" : m.isRare ? "#00b894" : "#1a3a22";
          c.beginPath();
          c.arc(segX, segY, radius, 0, Math.PI * 2);
          c.fill();
          c.stroke();
          if (m.flashTimer === 0) {
            c.fillStyle = m.isRare ? "#ff007f" : "#9b59b6";
            c.beginPath();
            c.moveTo(segX + 2, segY - radius);
            c.lineTo(segX - 2, segY - radius - 6);
            c.lineTo(segX - 4, segY - radius);
            c.closePath();
            c.fill();
            c.stroke();
          }
        }
        c.fillStyle =
          m.flashTimer > 0 ? "#ffffff" : m.isRare ? "#00b894" : "#122c19";
        let hX = cx - 8;
        let hY = cy + Math.sin(time) * 6;
        c.beginPath();
        c.moveTo(hX + 11, hY - 11);
        c.lineTo(hX - 13, hY - 5);
        c.lineTo(hX - 11, hY + 6);
        c.lineTo(hX + 11, hY + 11);
        c.closePath();
        c.fill();
        c.stroke();
        if (m.flashTimer === 0) {
          c.fillStyle = "#ffffff";
          c.beginPath();
          c.moveTo(hX - 10, hY - 1);
          c.lineTo(hX - 13, hY + 4);
          c.lineTo(hX - 7, hY + 2);
          c.closePath();
          c.fill();
          c.fillStyle = "#f1c40f";
          c.beginPath();
          c.arc(hX - 3, hY - 3, 2, 0, Math.PI * 2);
          c.fill();
        }
      } else if (vType === "toxic_fly") {
        let cx = m.x + m.w / 2;
        let cy = m.y + m.h / 2 + Math.sin(Date.now() / 110) * 4;
        let wing = Math.sin(Date.now() / 60) * 11;
        c.fillStyle = "rgba(46, 204, 113, 0.4)";
        c.beginPath();
        c.ellipse(cx - 7, cy - 4, 5, 12 + wing, -Math.PI / 4, 0, Math.PI * 2);
        c.ellipse(cx + 7, cy - 4, 5, 12 + wing, Math.PI / 4, 0, Math.PI * 2);
        c.fill();
        c.stroke();
        c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#2c3e50";
        c.beginPath();
        c.arc(cx, cy, 6, 0, Math.PI * 2);
        c.fill();
        c.stroke();
        c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#2ecc71";
        c.beginPath();
        c.ellipse(cx, cy + 9, 5, 7, 0, 0, Math.PI * 2);
        c.fill();
        c.stroke();
      } else if (vType === "marsh_ghost") {
        // Render a wispy, translucent, floating swamp phantom
        let hover = Math.sin(Date.now() / 140) * 6;
        let cx = m.x + m.w / 2;
        let cy = m.y + m.h / 2 + hover;

        c.save();
        // Translucent glowing trail
        let glowTime = Date.now() / 200;
        let trailGrad = c.createLinearGradient(cx, cy - 10, cx, cy + 22);
        if (m.flashTimer > 0) {
          trailGrad.addColorStop(0, "#ffffff");
          trailGrad.addColorStop(1, "rgba(255,255,255,0)");
        } else {
          trailGrad.addColorStop(0, "rgba(46, 204, 113, 0.7)");
          trailGrad.addColorStop(0.5, "rgba(155, 89, 182, 0.4)");
          trailGrad.addColorStop(1, "rgba(0,0,0,0)");
        }

        c.fillStyle = trailGrad;
        c.beginPath();
        c.moveTo(cx - 12, cy - 4);
        c.quadraticCurveTo(cx - 16, cy + 8, cx - 4, cy + 22);
        c.lineTo(cx + 4, cy + 22);
        c.quadraticCurveTo(cx + 16, cy + 8, cx + 12, cy - 4);
        c.closePath();
        c.fill();

        // Wispy spirit head
        c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#111a14";
        c.strokeStyle = "#000";
        c.lineWidth = 1.8;
        c.beginPath();
        c.arc(cx, cy - 10, 9, Math.PI, 0);
        c.lineTo(cx + 9, cy + 2);
        c.quadraticCurveTo(cx + 6, cy + 8, cx, cy + 12);
        c.quadraticCurveTo(cx - 6, cy + 8, cx - 9, cy + 2);
        c.closePath();
        c.fill();
        c.stroke();

        if (m.flashTimer === 0) {
          // Glowing swamp eyes
          c.fillStyle = "#55efc4";
          c.shadowBlur = 6;
          c.shadowColor = "#55efc4";
          c.beginPath();
          c.arc(cx - 3, cy - 10, 1.8, 0, Math.PI * 2);
          c.arc(cx + 3, cy - 10, 1.8, 0, Math.PI * 2);
          c.fill();
          c.shadowBlur = 0;
        }
        c.restore();
      } else if (vType === "void_orb") {
        let hover = Math.sin(Date.now() / 150) * 4;
        let cx = m.x + m.w / 2;
        let cy = m.y + m.h / 2 + hover;
        let rot = Date.now() / 800;

        // 1. Draw BACK segment of the gravity ring first (Math.PI to 2*Math.PI)
        if (m.flashTimer === 0) {
          c.strokeStyle = "#8e44ad";
          c.lineWidth = 1.8;
          c.save();
          c.translate(cx, cy);
          c.rotate(rot);
          c.beginPath();
          c.ellipse(0, 0, 22, 6, 0, Math.PI, 0); // Upper arc (behind core)
          c.stroke();
          c.restore();
        }

        // 2. Draw Void Orb core sphere
        c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#0d011a";
        c.beginPath();
        c.arc(cx, cy, 14, 0, Math.PI * 2);
        c.fill();
        c.stroke();

        // 3. Draw FRONT segment of the gravity ring last (0 to Math.PI)
        if (m.flashTimer === 0) {
          c.strokeStyle = "#8e44ad";
          c.lineWidth = 1.8;
          c.save();
          c.translate(cx, cy);
          c.rotate(rot);
          c.beginPath();
          c.ellipse(0, 0, 22, 6, 0, 0, Math.PI); // Lower arc (in front of core)
          c.stroke();
          c.restore();
        }
      } else if (vType === "void_crawler") {
        let cx = m.x + m.w / 2;
        let cy = m.y + m.h / 2 + 5;
        let time = Date.now() / 150;
        c.strokeStyle = "#000000";
        c.lineWidth = 1.8;
        for (let i = 0; i < 6; i++) {
          let segX = cx + i * 9;
          let segY = cy + Math.sin(time - i * 0.7) * 5.5;
          c.beginPath();
          c.moveTo(segX, segY + 2);
          c.lineTo(segX - 5, segY + 14 + Math.sin(time * 3.5 + i) * 4);
          c.stroke();
        }
        for (let i = 6; i >= 0; i--) {
          let segX = cx + i * 9;
          let segY = cy + Math.sin(time - i * 0.7) * 5.5;
          let radius = 10 - i * 1.1;
          c.fillStyle =
            m.flashTimer > 0 ? "#ffffff" : m.isRare ? "#ff007f" : "#1a022b";
          c.beginPath();
          c.arc(segX, segY, radius, 0, Math.PI * 2);
          c.fill();
          c.stroke();
          if (m.flashTimer === 0) {
            c.strokeStyle = "#8e44ad";
            c.lineWidth = 1.5;
            c.beginPath();
            c.moveTo(segX - 2, segY - radius + 3);
            c.lineTo(segX + 2, segY - radius + 3);
            c.stroke();
          }
        }
        c.fillStyle =
          m.flashTimer > 0 ? "#ffffff" : m.isRare ? "#ff007f" : "#11001c";
        let hX = cx - 8;
        let hY = cy + Math.sin(time) * 5.5;
        c.beginPath();
        c.arc(hX, hY, 10.5, 0, Math.PI * 2);
        c.fill();
        c.stroke();
        if (m.flashTimer === 0) {
          c.strokeStyle = "#8e44ad";
          c.lineWidth = 1.8;
          c.beginPath();
          c.moveTo(hX - 4, hY - 6);
          c.quadraticCurveTo(
            hX - 15,
            hY - 14 + Math.sin(time * 3) * 4,
            hX - 22,
            hY - 10 + Math.sin(time * 3) * 4,
          );
          c.stroke();
          c.fillStyle = "#ff007f";
          c.beginPath();
          c.arc(hX - 5, hY - 3, 1.5, 0, Math.PI * 2);
          c.arc(hX - 2, hY - 1, 1.2, 0, Math.PI * 2);
          c.arc(hX - 5, hY + 1, 1.2, 0, Math.PI * 2);
          c.fill();
        }
      } else if (vType === "clockwork_scarab") {
        let cx = m.x + m.w / 2;
        let cy = m.y + m.h / 2 + Math.sin(Date.now() / 100) * 3;
        c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#dca04c";
        c.beginPath();
        c.ellipse(cx, cy, 12, 9, 0, 0, Math.PI * 2);
        c.fill();
        c.stroke();
        if (m.flashTimer === 0) {
          c.strokeStyle = "#4d2e1a";
          c.lineWidth = 1.2;
          c.beginPath();
          c.moveTo(cx, cy - 9);
          c.lineTo(cx, cy + 9);
          c.stroke();
          c.save();
          c.translate(cx, cy);
          c.rotate((Date.now() / 1500) % (Math.PI * 2));
          c.fillStyle = "#f1c40f";
          c.beginPath();
          c.arc(0, 0, 4, 0, Math.PI * 2);
          c.fill();
          c.stroke();
          c.restore();
        }
        c.strokeStyle = "#7a5c1f";
        c.lineWidth = 1.8;
        for (let i = -1; i <= 1; i += 2) {
          let legSwing = Math.sin(Date.now() / 80 + i) * 3;
          c.beginPath();
          c.moveTo(cx + 6 * i, cy);
          c.lineTo(cx + 14 * i + legSwing, cy + 6);
          c.stroke();
          c.beginPath();
          c.moveTo(cx + 6 * i, cy - 4);
          c.lineTo(cx + 15 * i + legSwing, cy - 6);
          c.stroke();
        }
      } else if (vType === "neon_spider") {
        let cx = m.x + m.w / 2;
        let cy = m.y + m.h / 2;
        c.strokeStyle = m.flashTimer > 0 ? "#ffffff" : "#ff007f";
        c.lineWidth = 2.0;
        c.beginPath();
        c.arc(cx, cy, 6, 0, Math.PI * 2);
        c.stroke();
        for (let i = 0; i < 4; i++) {
          let side = i % 2 === 0 ? -1 : 1;
          let yDir = i < 2 ? -1 : 1;
          c.beginPath();
          c.moveTo(cx, cy);
          c.lineTo(cx + 12 * side, cy + 4 * yDir);
          c.lineTo(cx + 16 * side, cy + 14 * yDir);
          c.stroke();
        }
      } else if (vType === "wireframe_orb") {
        let cx = m.x + m.w / 2;
        let cy = m.y + m.h / 2;
        c.strokeStyle = m.flashTimer > 0 ? "#ffffff" : "#3498db";
        c.lineWidth = 1.5;
        c.save();
        c.translate(cx, cy);
        c.rotate(Date.now() / 600);
        c.strokeRect(-10, -10, 20, 20);
        c.restore();
      } else if (vType === "animated_armor") {
        let hover = Math.sin(Date.now() / 150) * 4;
        let cx = m.x + m.w / 2;
        let cy = m.y + m.h / 2 + hover;

        if (m.flashTimer === 0) {
          c.save();
          c.strokeStyle = "rgba(0, 210, 255, 0.4)";
          c.lineWidth = 4;
          c.shadowBlur = 10;
          c.shadowColor = "#00d2ff";
          c.beginPath();
          c.roundRect(cx - 14, cy - 14, 28, 30, [4]);
          c.stroke();
          c.restore();
        }

        c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#2c3e50";
        c.beginPath();
        c.ellipse(cx - 18, cy - 8, 7, 5, -Math.PI / 6, 0, Math.PI * 2);
        c.ellipse(cx + 18, cy - 8, 7, 5, Math.PI / 6, 0, Math.PI * 2);
        c.fill();
        c.stroke();

        c.beginPath();
        c.moveTo(cx - 12, cy - 12);
        c.lineTo(cx + 12, cy - 12);
        c.lineTo(cx + 9, cy + 12);
        c.lineTo(cx - 9, cy + 12);
        c.closePath();
        c.fill();
        c.stroke();

        if (m.flashTimer === 0) {
          c.strokeStyle = "#00d2ff";
          c.lineWidth = 2;
          c.beginPath();
          c.moveTo(cx, cy - 8);
          c.lineTo(cx, cy + 8);
          c.moveTo(cx - 4, cy);
          c.lineTo(cx + 4, cy);
          c.stroke();
        }

        c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#1a252f";
        c.beginPath();
        c.roundRect(cx - 8, cy - 28, 16, 14, [4]);
        c.fill();
        c.stroke();

        if (m.flashTimer === 0) {
          c.fillStyle = "#ff0055";
          c.fillRect(cx - 5, cy - 22, 10, 2.5);
        }

        c.save();
        c.translate(cx + 12, cy + 6);
        c.rotate(Math.PI / 12 + Math.sin(Date.now() / 120) * 0.05);
        c.fillStyle = "rgba(0, 210, 255, 0.25)";
        c.strokeStyle = "#00d2ff";
        c.lineWidth = 1.5;
        c.beginPath();
        c.moveTo(-2, 0);
        c.lineTo(2, 0);
        c.lineTo(1.5, -24);
        c.lineTo(-1.5, -24);
        c.closePath();
        c.fill();
        c.stroke();
        c.restore();
      } else if (vType === "cursed_blade") {
        let hover = Math.sin(Date.now() / 110) * 5;
        let cx = m.x + m.w / 2;
        let cy = m.y + m.h / 2 + hover;
        let rot = Date.now() / 500;

        c.save();
        c.translate(cx, cy);
        c.rotate(rot);

        if (
          m.flashTimer === 0 &&
          !window.isGamePaused &&
          Math.random() < 0.2 &&
          window.particles.length < 250
        ) {
          window.particles.push(
            window.ParticlePool.get(
              cx + window.randFloat(-15, 15),
              cy + window.randFloat(-15, 15),
              window.randFloat(-0.5, 0.5),
              -window.randFloat(1, 2),
              window.randFloat(1.5, 3),
              "#9b59b6",
              0.8,
              window.randInt(15, 30),
            ),
          );
        }

        if (m.flashTimer === 0) {
          c.save();
          c.shadowBlur = 12;
          c.shadowColor = "#9b59b6";
          c.strokeStyle = "rgba(155, 89, 182, 0.3)";
          c.lineWidth = 3;
          c.beginPath();
          c.moveTo(-3, -22);
          c.lineTo(3, -22);
          c.lineTo(4, 12);
          c.lineTo(-4, 12);
          c.closePath();
          c.stroke();
          c.restore();
        }

        c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#111116";
        c.beginPath();
        c.moveTo(-4, -16);
        c.lineTo(0, -22);
        c.lineTo(4, -14);
        c.lineTo(3.5, 12);
        c.lineTo(-3.5, 12);
        c.closePath();
        c.fill();
        c.stroke();

        if (m.flashTimer === 0) {
          c.strokeStyle = "#e84393";
          c.lineWidth = 1.2;
          c.beginPath();
          c.moveTo(-2, -6);
          c.lineTo(2, -2);
          c.lineTo(-1, 4);
          c.stroke();
        }

        c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#7f8c8d";
        c.beginPath();
        c.roundRect(-8, 12, 16, 4, [1]);
        c.fill();
        c.stroke();

        c.fillStyle = "#4a154b";
        c.fillRect(-2, 16, 4, 10);
        c.strokeRect(-2, 16, 4, 10);

        c.fillStyle = "#9b59b6";
        c.beginPath();
        c.arc(0, 27, 2.5, 0, Math.PI * 2);
        c.fill();
        c.stroke();

        c.restore();
      } else if (vType === "mimic_shield") {
        let cx = m.x + m.w / 2;
        let cy = m.y + m.h / 2;
        let time = Date.now();
        let breathe = Math.sin(time / 140) * 2;
        let eyeBlink = Math.sin(time / 800);

        c.save();
        c.translate(cx, cy);

        c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#2c3e50";
        c.beginPath();
        c.moveTo(-16, -16);
        c.lineTo(16, -16);
        c.lineTo(18, 2);
        c.lineTo(0, 22);
        c.lineTo(-18, 2);
        c.closePath();
        c.fill();
        c.stroke();

        c.strokeStyle = m.flashTimer > 0 ? "#ffffff" : "#7f8c8d";
        c.lineWidth = 1.8;
        c.beginPath();
        c.moveTo(-13, -13);
        c.lineTo(13, -13);
        c.lineTo(15, 1);
        c.lineTo(0, 18);
        c.lineTo(-15, 1);
        c.closePath();
        c.stroke();

        let mouthOpen = Math.max(1, 3.5 + breathe);
        c.fillStyle = "#110202";
        c.beginPath();
        c.ellipse(0, 2, 8, mouthOpen, 0, 0, Math.PI * 2);
        c.fill();
        c.stroke();

        c.fillStyle = "#f1c40f";
        c.strokeStyle = "#000000";
        c.lineWidth = 1;
        let tOffsets = [-5, -2, 2, 5];
        tOffsets.forEach((dx) => {
          c.beginPath();
          c.moveTo(dx - 1.2, 2 - mouthOpen);
          c.lineTo(dx, 2 - mouthOpen + 3);
          c.lineTo(dx + 1.2, 2 - mouthOpen);
          c.closePath();
          c.fill();
          c.stroke();

          c.beginPath();
          c.moveTo(dx - 1.2, 2 + mouthOpen);
          c.lineTo(dx, 2 + mouthOpen - 3);
          c.lineTo(dx + 1.2, 2 + mouthOpen);
          c.closePath();
          c.fill();
          c.stroke();
        });

        if (m.flashTimer === 0) {
          c.fillStyle = "#ffffff";
          c.beginPath();
          c.ellipse(0, -7, 6, 4, 0, 0, Math.PI * 2);
          c.fill();
          c.stroke();

          if (eyeBlink > -0.85) {
            c.fillStyle = "#e74c3c";
            c.beginPath();
            c.arc(0, -7, 2.5, 0, Math.PI * 2);
            c.fill();

            c.fillStyle = "#000000";
            c.beginPath();
            c.ellipse(0, -7, 0.8, 2.2, 0, 0, Math.PI * 2);
            c.fill();
          } else {
            c.strokeStyle = "#000";
            c.lineWidth = 2;
            c.beginPath();
            c.moveTo(-6, -7);
            c.lineTo(6, -7);
            c.stroke();
          }
        }

        c.restore();
      } else if (vType === "slag_slime") {
        let squish = Math.sin(Date.now() / 100) * 3.5;
        let wScale = m.w / 2 + squish;
        let hScale = m.h / 2 - squish;
        let cx = m.x + m.w / 2;
        let cy = m.y + m.h - 10 + squish / 2;

        let slimeGrad = c.createRadialGradient(
          cx - 3,
          cy - 5,
          2,
          cx,
          cy,
          m.w * 0.75,
        );
        if (m.flashTimer > 0) {
          slimeGrad.addColorStop(0, "#ffffff");
          slimeGrad.addColorStop(1, "#ffffff");
        } else {
          slimeGrad.addColorStop(0, "#a3fd83");
          slimeGrad.addColorStop(1, "#27ae60");
        }

        c.fillStyle = slimeGrad;
        c.beginPath();
        c.ellipse(cx, cy, wScale * 1.2, hScale * 0.9, 0, 0, Math.PI * 2);
        c.fill();
        c.stroke();

        if (
          m.flashTimer === 0 &&
          !window.isGamePaused &&
          Math.random() < 0.25
        ) {
          let bY = cy - hScale * 0.7;
          let bX = cx + window.randFloat(-wScale * 0.5, wScale * 0.5);
          c.fillStyle = "rgba(46, 204, 113, 0.6)";
          c.beginPath();
          c.arc(bX, bY, window.randFloat(2, 4), 0, Math.PI * 2);
          c.fill();
          c.stroke();
        }

        if (m.flashTimer === 0) {
          c.fillStyle = "#7f8c8d";
          c.beginPath();
          c.moveTo(cx - 4, cy - 2);
          c.lineTo(cx + 4, cy - 5);
          c.lineTo(cx + 2, cy + 3);
          c.closePath();
          c.fill();
          c.stroke();

          c.fillStyle = "#110202";
          let eyeOffsetX = wScale * 0.35;
          let eyeOffsetY = hScale * 0.1;
          c.beginPath();
          c.arc(cx - eyeOffsetX + 3, cy - eyeOffsetY, 1.8, 0, Math.PI * 2);
          c.arc(cx + eyeOffsetX + 3, cy - eyeOffsetY, 1.8, 0, Math.PI * 2);
          c.fill();

          c.fillStyle = "#1e272e";
          c.fillRect(cx - 8, cy + hScale * 0.3, 3, 5);
          c.fillRect(cx + 4, cy + hScale * 0.2, 2, 4);
        }
      } else if (vType === "rust_nibbler") {
        let cx = m.x + m.w / 2;
        let cy = m.y + m.h - 15;
        let time = Date.now();
        let legSway = Math.sin(time / 80) * 4;

        c.strokeStyle = m.flashTimer > 0 ? "#ffffff" : "#5c3a21";
        c.lineWidth = 2.2;
        for (let i = -1; i <= 1; i += 2) {
          let legX = cx + i * 10;
          c.beginPath();
          c.moveTo(legX, cy + 2);
          c.lineTo(legX + i * 8 + legSway * i, cy + 12);
          c.stroke();
          c.beginPath();
          c.moveTo(legX, cy + 2);
          c.lineTo(legX - i * 8 - legSway * i, cy + 12);
          c.stroke();
        }

        c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#d35400";
        c.beginPath();
        c.ellipse(cx, cy, 14, 8, 0, 0, Math.PI * 2);
        c.fill();
        c.stroke();

        c.strokeStyle = "#000";
        c.lineWidth = 1.2;
        c.beginPath();
        c.moveTo(cx - 6, cy - 7);
        c.lineTo(cx - 6, cy + 7);
        c.moveTo(cx, cy - 8);
        c.lineTo(cx, cy + 8);
        c.moveTo(cx + 6, cy - 7);
        c.lineTo(cx + 6, cy + 7);
        c.stroke();

        c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#5c3a21";
        c.beginPath();
        c.arc(cx + 12, cy - 1, 5, 0, Math.PI * 2);
        c.fill();
        c.stroke();

        c.strokeStyle = m.flashTimer > 0 ? "#ffffff" : "#e67e22";
        c.lineWidth = 1.5;
        let antSway = Math.sin(time / 100) * 3;
        c.beginPath();
        c.moveTo(cx + 15, cy - 3);
        c.quadraticCurveTo(
          cx + 20,
          cy - 10 + antSway,
          cx + 24,
          cy - 8 + antSway,
        );
        c.stroke();

        if (m.flashTimer === 0) {
          c.fillStyle = "#f1c40f";
          c.beginPath();
          c.arc(cx + 14, cy - 2, 1.2, 0, Math.PI * 2);
          c.fill();
        }
      } else if (vType === "corroded_golem") {
        let hover = Math.sin(Date.now() / 130) * 2;
        let cx = m.x + m.w / 2;
        let cy = m.y + m.h / 2 + hover;

        c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#2c3e50";
        c.beginPath();
        c.roundRect(cx - 15, cy - 10, 30, 20, [3]);
        c.fill();
        c.stroke();

        if (m.flashTimer === 0) {
          c.strokeStyle = "#2ecc71";
          c.lineWidth = 1.8;
          c.beginPath();
          c.moveTo(cx - 8, cy - 4);
          c.lineTo(cx - 2, cy + 2);
          c.lineTo(cx + 6, cy - 6);
          c.stroke();
        }

        c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#5d6d7e";
        c.beginPath();
        c.arc(cx - 18, cy - 6, 6, 0, Math.PI * 2);
        c.arc(cx + 18, cy - 6, 6, 0, Math.PI * 2);
        c.fill();
        c.stroke();

        if (m.flashTimer === 0) {
          c.strokeStyle = "#2ecc71";
          c.lineWidth = 2.5;
          c.beginPath();
          c.moveTo(cx - 15, cy + 2);
          c.quadraticCurveTo(cx - 22, cy + 12, cx - 18, cy + 18);
          c.moveTo(cx + 15, cy + 2);
          c.quadraticCurveTo(cx + 22, cy + 12, cx + 18, cy + 18);
          c.stroke();
        }

        c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#2c3e50";
        c.beginPath();
        c.roundRect(cx - 22, cy + 14, 8, 8, [2]);
        c.roundRect(cx + 14, cy + 14, 8, 8, [2]);
        c.fill();
        c.stroke();

        c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#2c3e50";
        c.beginPath();
        c.roundRect(cx - 8, cy - 24, 16, 14, [4]);
        c.fill();
        c.stroke();

        if (m.flashTimer === 0) {
          c.fillStyle = "#2ecc71";
          c.shadowBlur = 8;
          c.shadowColor = "#2ecc71";
          c.fillRect(cx - 6, cy - 18, 12, 3);
          c.shadowBlur = 0;
        }
      }

      if (m.isRare) {
        c.save();
        let glowTime = Date.now() / 200;
        let hx = m.x + m.w / 2;
        let hy = m.y - 10 + Math.sin(glowTime) * 2.5;
        c.strokeStyle = "#f1c40f";
        c.lineWidth = 1.8;
        c.beginPath();
        c.ellipse(hx, hy, 11, 3.2, 0, 0, Math.PI * 2);
        c.stroke();
        c.fillStyle = "#ffffff";
        for (let i = 0; i < 3; i++) {
          let sparkAngle = glowTime + i * ((Math.PI * 2) / 3);
          let sx = hx + Math.cos(sparkAngle) * 11;
          let sy = hy + Math.sin(sparkAngle) * 3.2;
          c.fillRect(sx - 1.2, sy - 1.2, 2.4, 2.4);
        }
        c.restore();
      }
    } else if (m.type === "rift_guardian" || m.type === "aegis_goliath") {
      let hover = Math.sin(Date.now() / 150) * 8;
      let cx = m.x + m.w / 2;
      let cy = m.y + m.h / 2 + hover;
      c.save();
      c.translate(cx, cy);
      for (let i = 0; i < 3; i++) {
        let pulseScale = 1.0 + Math.sin(Date.now() / 250 + i * 2) * 0.12;
        let rot = Date.now() / 1200 + (i * Math.PI) / 3;
        let size = 45 * pulseScale;
        c.save();
        c.rotate(rot);
        c.strokeStyle =
          m.flashTimer > 0 ? "#ffffff" : "rgba(52, 152, 219, 0.45)";
        c.lineWidth = 1.5;
        c.beginPath();
        for (let side = 0; side < 6; side++) {
          let angle = (side * Math.PI) / 3;
          c.lineTo(Math.cos(angle) * size, Math.sin(angle) * size);
        }
        c.closePath();
        c.stroke();
        c.restore();
      }
      c.save();
      c.strokeStyle = "#2c3e50";
      c.lineWidth = 2.5;
      for (let i = -1; i <= 1; i += 2) {
        let chainSway = Math.sin(Date.now() / 300 + i * 1.5) * 4;
        c.beginPath();
        c.moveTo(i * 20, -50);
        c.quadraticCurveTo(i * 25, 0, i * 15 + chainSway, 30);
        c.stroke();
      }
      c.restore();
      c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#1a1c23";
      c.strokeStyle = "#000000";
      c.lineWidth = 2.4;
      c.beginPath();
      c.moveTo(0, -18);
      c.lineTo(16, -18);
      c.lineTo(22, -4);
      c.lineTo(0, 24);
      c.lineTo(-22, -4);
      c.lineTo(-16, -18);
      c.closePath();
      c.fill();
      c.stroke();
      if (m.flashTimer === 0) {
        let pulseRad = 6 + Math.sin(Date.now() / 100) * 1.5;
        let runicGlow = c.createRadialGradient(0, -2, 1, 0, -2, pulseRad + 8);
        runicGlow.addColorStop(0, "#ffffff");
        runicGlow.addColorStop(0.3, "#2ecc71");
        runicGlow.addColorStop(0.8, "#3498db");
        runicGlow.addColorStop(1, "rgba(0,0,0,0)");
        c.fillStyle = runicGlow;
        c.beginPath();
        c.arc(0, -2, pulseRad + 8, 0, Math.PI * 2);
        c.fill();
        c.strokeStyle = "#ffffff";
        c.lineWidth = 2;
        c.beginPath();
        c.moveTo(0, -10);
        c.lineTo(0, 6);
        c.moveTo(-7, -2);
        c.lineTo(7, -2);
        c.stroke();
      }
      for (let i = 0; i < 3; i++) {
        let angle = Date.now() / 300 + (i * Math.PI * 2) / 3;
        let px = Math.cos(angle) * 35;
        let py = Math.sin(angle) * 12;
        c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#34495e";
        c.strokeStyle = "#000000";
        c.lineWidth = 1.5;
        c.beginPath();
        c.roundRect(px - 5, py - 7, 10, 14, [2]);
        c.fill();
        c.stroke();
        if (m.flashTimer === 0) {
          c.fillStyle = "#2ecc71";
          c.beginPath();
          c.arc(px, py, 1.8, 0, Math.PI * 2);
          c.fill();
        }
      }
      c.restore();
    } else if (m.type === "chronos_arbitrator") {
      let hover = Math.sin(Date.now() / 200) * 8;
      let cx = m.x + m.w / 2;
      let cy = m.y + m.h / 2 + hover;
      c.save();
      c.translate(cx, cy);
      let drawVectorGear = (ctx, x, y, radius, teeth, rot, color) => {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rot);
        ctx.fillStyle = m.flashTimer > 0 ? "#ffffff" : color;
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        ctx.arc(0, 0, radius - 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        for (let i = 0; i < teeth; i++) {
          let teethAngle = (i * Math.PI * 2) / teeth;
          ctx.save();
          ctx.rotate(teethAngle);
          ctx.beginPath();
          ctx.rect(-3, -radius - 3, 6, 8);
          ctx.fill();
          ctx.stroke();
          ctx.restore();
        }
        ctx.fillStyle = "#111116";
        ctx.beginPath();
        ctx.arc(0, 0, radius * 0.35, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#f1c40f";
        for (let i = 0; i < 4; i++) {
          let angle = (i * Math.PI) / 2;
          ctx.beginPath();
          ctx.arc(
            Math.cos(angle) * (radius * 0.6),
            Math.sin(angle) * (radius * 0.6),
            2,
            0,
            Math.PI * 2,
          );
          ctx.fill();
          ctx.stroke();
        }
        ctx.restore();
      };
      drawVectorGear(
        c,
        -35,
        -28,
        22,
        10,
        -((Date.now() / 400) % (Math.PI * 2)),
        "#7f8c8d",
      );
      drawVectorGear(
        c,
        38,
        24,
        25,
        12,
        ((Date.now() / 500) % (Math.PI * 2)) + 0.5,
        "#d35400",
      );
      drawVectorGear(
        c,
        0,
        0,
        44,
        16,
        (Date.now() / 1500) % (Math.PI * 2),
        "#f1c40f",
      );
      c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#fdf6e2";
      c.strokeStyle = "#000000";
      c.lineWidth = 2.4;
      c.beginPath();
      c.moveTo(0, -25);
      c.quadraticCurveTo(-20, -20, -20, 0);
      c.lineTo(-12, 28);
      c.lineTo(12, 28);
      c.lineTo(20, 0);
      c.quadraticCurveTo(20, -20, 0, -25);
      c.closePath();
      c.fill();
      c.stroke();
      if (m.flashTimer === 0) {
        c.strokeStyle = "#1a0f02";
        c.lineWidth = 1.5;
        c.beginPath();
        c.moveTo(-10, -10);
        c.lineTo(-4, -4);
        c.lineTo(-8, 2);
        c.moveTo(10, -8);
        c.lineTo(6, -2);
        c.stroke();
        c.fillStyle = "#ffffff";
        c.shadowBlur = 8;
        c.shadowColor = "#f1c40f";
        c.beginPath();
        c.arc(-6, -5, 3, 0, Math.PI * 2);
        c.arc(6, -5, 3, 0, Math.PI * 2);
        c.fill();
        c.shadowBlur = 0;
      }
      c.strokeStyle = "#111116";
      c.lineWidth = 2.5;
      c.lineCap = "round";
      let hrAngle = Date.now() / 10000;
      c.beginPath();
      c.moveTo(0, 0);
      c.lineTo(Math.cos(hrAngle) * 15, Math.sin(hrAngle) * 15);
      c.stroke();
      let minAngle = Date.now() / 1800;
      c.strokeStyle = "#d35400";
      c.lineWidth = 1.8;
      c.beginPath();
      c.moveTo(0, 0);
      c.lineTo(Math.cos(minAngle) * 24, Math.sin(minAngle) * 24);
      c.stroke();
      c.restore();
    } else if (m.type === "nexus_overseer") {
      let cx = m.x + m.w / 2;
      let cy = m.y + m.h / 2;
      let isGlitchedFrame = Math.sin(Date.now() / 10) > 0.85;
      let px = cx + (isGlitchedFrame ? window.randFloat(-4, 4) : 0);
      let py = cy + (isGlitchedFrame ? window.randFloat(-3, 3) : 0);
      c.save();
      c.translate(px, py);
      c.rotate(Date.now() / 800);
      c.strokeStyle = m.flashTimer > 0 ? "#ffffff" : "#ff007f";
      c.lineWidth = 2.0;
      let cycle = Math.floor(Date.now() / 5000) % 3;
      if (cycle === 0) {
        c.strokeRect(-18, -18, 36, 36);
        c.strokeRect(-12, -12, 24, 24);
        c.beginPath();
        c.moveTo(-18, -18);
        c.lineTo(-12, -12);
        c.moveTo(18, -18);
        c.lineTo(12, -12);
        c.moveTo(-18, 18);
        c.lineTo(-12, 12);
        c.moveTo(18, 18);
        c.lineTo(12, 12);
        c.stroke();
      } else if (cycle === 1) {
        c.beginPath();
        c.moveTo(0, -22);
        c.lineTo(-18, 14);
        c.lineTo(18, 14);
        c.closePath();
        c.moveTo(0, -22);
        c.lineTo(0, 18);
        c.lineTo(-18, 14);
        c.moveTo(0, 18);
        c.lineTo(18, 14);
        c.stroke();
      } else {
        c.beginPath();
        for (let i = 0; i < 5; i++) {
          let angle = (i * Math.PI * 2) / 5;
          c.lineTo(Math.cos(angle) * 22, Math.sin(angle) * 22);
        }
        c.closePath();
        c.stroke();
      }
      if (m.flashTimer === 0) {
        let eyePulse = 6 + Math.sin(Date.now() / 150) * 1.5;
        c.fillStyle = "#00b894";
        c.beginPath();
        c.arc(0, 0, eyePulse, 0, Math.PI * 2);
        c.fill();
        c.strokeStyle = "#000000";
        c.lineWidth = 1.5;
        c.stroke();
        c.fillStyle = "#ff007f";
        c.fillRect(-1.2, -4, 2.4, 8);
      }
      c.restore();
    } else if (
      m.type === "dungeon_boss" ||
      m.type === "gilded_vault_keeper" ||
      m.type === "corrosive_abomination" ||
      m.type === "overlord_iron_vault" ||
      m.visualType === "gilded_vault_keeper" ||
      m.visualType === "corrosive_abomination" ||
      m.visualType === "overlord_iron_vault"
    ) {
      let bounce = 0;
      let coreColor = "#9b59b6";
      let glowColor = "#e84393";
      let shadowColor = "#1a052e";
      if (m.isCrucible) {
        bounce = Math.sin(Date.now() / 150) * 4;
        coreColor = m.flashTimer > 0 ? "#ffffff" : "#9b59b6";
        let rot1 = Date.now() / 700;
        let rot2 = -Date.now() / 500;

        // 1. Draw BACK segment of the core orbital rings first (angles Math.PI to 2*Math.PI)
        c.save();
        c.translate(m.x + m.w / 2, m.y + m.h / 2 + bounce);

        // Ring 1 Back segment
        c.strokeStyle = glowColor;
        c.lineWidth = 1.8;
        c.save();
        c.rotate(rot1);
        c.beginPath();
        c.ellipse(0, 0, m.w * 0.8, m.h * 0.18, 0, Math.PI, 0); // Upper arc (behind)
        c.stroke();
        c.restore();

        // Ring 2 Back segment
        c.strokeStyle = "#9b59b6";
        c.save();
        c.rotate(rot2);
        c.beginPath();
        c.ellipse(0, 0, m.w * 0.6, m.h * 0.22, 0, Math.PI, 0); // Upper arc (behind)
        c.stroke();
        c.restore();

        c.restore();

        // 2. Draw Main Boss Torso
        c.fillStyle = shadowColor;
        c.beginPath();
        c.moveTo(m.x + m.w / 2, m.y + bounce);
        c.lineTo(m.x + m.w, m.y + m.h * 0.4 + bounce);
        c.lineTo(m.x + m.w * 0.8, m.y + m.h * 0.95 + bounce);
        c.lineTo(m.x + m.w * 0.2, m.y + m.h * 0.95 + bounce);
        c.lineTo(m.x, m.y + m.h * 0.4 + bounce);
        c.closePath();
        c.fill();
        c.strokeStyle = "#000000";
        c.lineWidth = 2.4;
        c.stroke();

        if (m.flashTimer === 0) {
          let coreRadius = 8 + Math.sin(Date.now() / 100) * 3;
          c.fillStyle = coreColor;
          c.shadowBlur = 12;
          c.shadowColor = coreColor;
          c.beginPath();
          c.arc(
            m.x + m.w / 2,
            m.y + m.h / 2 - 10 + bounce,
            coreRadius,
            0,
            Math.PI * 2,
          );
          c.fill();
          c.stroke();
          c.shadowBlur = 0;
          c.fillStyle = "#ffffff";
          c.beginPath();
          c.arc(m.x + m.w / 2, m.y + m.h / 2 - 10 + bounce, 3, 0, Math.PI * 2);
          c.fill();
        }
        c.fillStyle = "#2c3e50";
        c.beginPath();
        c.moveTo(m.x + m.w * 0.3, m.y + bounce);
        c.quadraticCurveTo(
          m.x + m.w * 0.1,
          m.y - 15 + bounce,
          m.x + m.w * 0.05,
          m.y - 20 + bounce,
        );
        c.lineTo(m.x + m.w * 0.4, m.y - 5 + bounce);
        c.closePath();
        c.fill();
        c.stroke();
        c.beginPath();
        c.moveTo(m.x + m.w * 0.7, m.y + bounce);
        c.quadraticCurveTo(
          m.x + m.w * 0.9,
          m.y - 15 + bounce,
          m.x + m.w * 0.95,
          m.y - 20 + bounce,
        );
        c.lineTo(m.x + m.w * 0.6, m.y - 5 + bounce);
        c.closePath();
        c.fill();
        c.stroke();

        // 3. Draw FRONT segment of the core orbital rings last (angles 0 to Math.PI)
        c.save();
        c.translate(m.x + m.w / 2, m.y + m.h / 2 + bounce);

        // Ring 1 Front segment
        c.strokeStyle = glowColor;
        c.lineWidth = 1.8;
        c.save();
        c.rotate(rot1);
        c.beginPath();
        c.ellipse(0, 0, m.w * 0.8, m.h * 0.18, 0, 0, Math.PI); // Lower arc (in front of body)
        c.stroke();
        c.restore();

        // Ring 2 Front segment
        c.strokeStyle = "#9b59b6";
        c.save();
        c.rotate(rot2);
        c.beginPath();
        c.ellipse(0, 0, m.w * 0.6, m.h * 0.22, 0, 0, Math.PI); // Lower arc (in front of body)
        c.stroke();
        c.restore();

        c.restore();
      } else {
        let dType = window.playerStats.currentDungeon || "gold";
        if (dType === "gold") {
          let bx = m.x;
          let by = m.y;
          let bw = m.w;
          let bh = m.h;
          let cy = by + bh - 5;

          let coinRows = [
            { y: cy, count: 9, size: 10, shift: 0 },
            { y: cy - 5, count: 7, size: 9, shift: 6 },
            { y: cy - 10, count: 5, size: 9, shift: 12 },
            { y: cy - 15, count: 3, size: 8, shift: 18 },
          ];

          coinRows.forEach((row) => {
            let startX = bx + row.shift;
            let spacing = (bw - row.shift * 2) / (row.count + 1);
            for (let i = 1; i <= row.count; i++) {
              let coinX = startX + i * spacing + Math.sin(row.y + i * 2) * 2;
              let coinY = row.y;
              let scaleW = row.size;
              let scaleH = row.size * 0.45;
              let angle = Math.sin(coinX * 0.05) * 0.25;

              c.save();
              c.translate(coinX, coinY);
              c.rotate(angle);

              c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#916900";
              c.beginPath();
              c.ellipse(0, 0, scaleW + 0.8, scaleH + 0.8, 0, 0, Math.PI * 2);
              c.fill();
              c.stroke();

              if (m.flashTimer === 0) {
                let goldGrad = c.createLinearGradient(
                  -scaleW,
                  -scaleH,
                  scaleW,
                  scaleH,
                );
                goldGrad.addColorStop(0, "#fff1a8");
                goldGrad.addColorStop(0.5, "#ffd700");
                goldGrad.addColorStop(1, "#b58700");
                c.fillStyle = goldGrad;
                c.beginPath();
                c.ellipse(0, 0, scaleW, scaleH, 0, 0, Math.PI * 2);
                c.fill();

                c.strokeStyle = "#805c00";
                c.lineWidth = 0.8;
                c.beginPath();
                c.ellipse(
                  0,
                  0,
                  scaleW * 0.78,
                  scaleH * 0.78,
                  0,
                  0,
                  Math.PI * 2,
                );
                c.stroke();

                c.fillStyle = "rgba(255, 255, 255, 0.85)";
                c.beginPath();
                c.ellipse(
                  -scaleW * 0.35,
                  -scaleH * 0.35,
                  scaleW * 0.22,
                  scaleH * 0.18,
                  Math.PI / 4,
                  0,
                  Math.PI * 2,
                );
                c.fill();
              }
              c.restore();
            }
          });

          let hover = Math.sin(Date.now() / 150) * 4;
          let idolX = bx + bw / 2;
          let idolY = cy - 28 + hover;
          let time = Date.now();

          // 1. DRAW GIANT SHIELD/SWORD WINGS BEHIND
          let wingFlap = Math.sin(time / 120) * 0.12;
          c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#b7950b"; // Golden/Bronze shields
          c.strokeStyle = "#000000";
          c.lineWidth = 2.4;

          for (let side = -1; side <= 1; side += 2) {
            c.save();
            c.translate(idolX + side * 12, idolY - 4);
            c.rotate(side * (Math.PI / 6 + wingFlap));

            // Draw shield wing
            c.beginPath();
            c.moveTo(0, 0);
            c.lineTo(side * 36, -15);
            c.lineTo(side * 28, 12);
            c.lineTo(side * 32, 25);
            c.lineTo(side * 8, 15);
            c.closePath();
            c.fill();
            c.stroke();

            // Shiny inner plate on shield
            c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#ffd700";
            c.beginPath();
            c.moveTo(side * 4, -2);
            c.lineTo(side * 32, -13);
            c.lineTo(side * 25, 10);
            c.closePath();
            c.fill();
            c.stroke();

            c.restore();
          }

          // 2. DRAW THE ANCIENT TREASURY CHEST BODY (Golem Torso)
          let lidAngle = -Math.abs(Math.sin(time / 240)) * 0.35; // Chest snapping open/close

          // Draw Lower Chest Box
          c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#4a2d18"; // Mahogany wood
          c.beginPath();
          c.roundRect(idolX - 16, idolY - 4, 32, 18, [3]);
          c.fill();
          c.stroke();

          // Iron Corner Bands on the box
          c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#333339";
          c.fillRect(idolX - 16, idolY - 4, 4, 18);
          c.strokeRect(
            m.flashTimer > 0 ? idolX - 16 : idolX - 16,
            idolY - 4,
            4,
            18,
          );
          c.fillRect(idolX + 12, idolY - 4, 4, 18);
          c.strokeRect(
            m.flashTimer > 0 ? idolX + 12 : idolX + 12,
            idolY - 4,
            4,
            18,
          );

          // 3. DRAW GLOWING RUBY SOUL-CORE (Inside Mouth / Chest Opening)
          if (m.flashTimer === 0) {
            let corePulse = 6 + Math.sin(time / 90) * 2;
            let coreGrad = c.createRadialGradient(
              idolX,
              idolY - 4,
              1,
              idolX,
              idolY - 4,
              corePulse,
            );
            coreGrad.addColorStop(0, "#ffffff");
            coreGrad.addColorStop(0.3, "#ff0055"); // Ruby Core
            coreGrad.addColorStop(1, "rgba(142, 68, 173, 0)");
            c.fillStyle = coreGrad;
            c.beginPath();
            c.arc(idolX, idolY - 4, corePulse + 6, 0, Math.PI * 2);
            c.fill();

            // Draw jagged golden teeth lining the chest rims
            c.fillStyle = "#f1c40f";
            let teethX = [-12, -6, 0, 6, 12];
            teethX.forEach((dx) => {
              // Upper hanging teeth (on the lid, rotates with it)
              c.save();
              c.translate(idolX, idolY - 4);
              c.rotate(lidAngle);
              c.beginPath();
              c.moveTo(dx - 1.8, 0);
              c.lineTo(dx, 4);
              c.lineTo(dx + 1.8, 0);
              c.closePath();
              c.fill();
              c.stroke();
              c.restore();

              // Lower teeth (static)
              c.beginPath();
              c.moveTo(idolX + dx - 1.8, idolY - 4);
              c.lineTo(idolX + dx, idolY - 7);
              c.lineTo(idolX + dx + 1.8, idolY - 4);
              c.closePath();
              c.fill();
              c.stroke();
            });
          }

          // 4. DRAW CHEST LID (Pivoting Head)
          c.save();
          c.translate(idolX, idolY - 4);
          c.rotate(lidAngle);

          c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#5c3a21"; // Bright mahogany
          c.beginPath();
          c.roundRect(-16, -11, 32, 11, [4, 4, 1, 1]);
          c.fill();
          c.stroke();

          // Gilded decorative bands on lid
          c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#ffd700";
          c.fillRect(-15, -11, 3, 11);
          c.strokeRect(-15, -11, 3, 11);
          c.fillRect(12, -11, 3, 11);
          c.strokeRect(12, -11, 3, 11);

          // Giant Gold lock latch
          c.fillRect(-2, -3, 4, 6);
          c.strokeRect(-2, -3, 4, 6);
          c.fillStyle = "#111";
          c.beginPath();
          c.arc(0, 0, 1.2, 0, Math.PI * 2);
          c.fill();

          // Floating Crown of Gold bars above the lid
          if (m.flashTimer === 0) {
            c.fillStyle = "#ffd700";
            c.shadowBlur = 8;
            c.shadowColor = "#ffd700";
            c.beginPath();
            c.moveTo(-8, -15);
            c.lineTo(-12, -21);
            c.lineTo(-6, -18);
            c.lineTo(0, -26); // Tall center point
            c.lineTo(6, -18);
            c.lineTo(12, -21);
            c.lineTo(8, -15);
            c.closePath();
            c.fill();
            c.stroke();
            c.shadowBlur = 0;
          }

          c.restore();

          // 5. GIANT CLAW ARMS (Made of fused gold bars)
          c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#b7950b";
          let armSwing = Math.sin(time / 100) * 4;

          // Left Arm
          c.beginPath();
          c.roundRect(idolX - 26 + armSwing, idolY + 1, 7, 12, [2]);
          c.fill();
          c.stroke();
          // Left Claws
          c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#ffd700";
          c.beginPath();
          c.moveTo(idolX - 26 + armSwing, idolY + 13);
          c.lineTo(idolX - 29 + armSwing, 18 + idolY);
          c.lineTo(idolX - 23 + armSwing, idolY + 13);
          c.closePath();
          c.fill();
          c.stroke();

          // Right Arm
          c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#b7950b";
          c.beginPath();
          c.roundRect(idolX + 19 - armSwing, idolY + 1, 7, 12, [2]);
          c.fill();
          c.stroke();
          // Right Claws
          c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#ffd700";
          c.beginPath();
          c.moveTo(idolX + 19 - armSwing, idolY + 13);
          c.lineTo(idolX + 22 - armSwing, 18 + idolY);
          c.lineTo(idolX + 26 - armSwing, idolY + 13);
          c.closePath();
          c.fill();
          c.stroke();

          // 6. REAL-TIME EMBER AND SPARK EMISSION
          if (
            !window.isGamePaused &&
            Math.random() < 0.22 &&
            window.particles.length < 250
          ) {
            window.particles.push({
              x: idolX + window.randFloat(-10, 10),
              y: idolY + 4,
              vx: window.randFloat(-1.8, 1.8),
              vy: -window.randFloat(1.2, 3.2),
              radius: window.randFloat(2, 4.2),
              color: Math.random() > 0.4 ? "#f1c40f" : "#ff5500", // Gold and lava sparks
              alpha: 0.95,
              life: window.randInt(25, 45),
            });
          }
        } else if (dType === "mat") {
          let bx = m.x;
          let by = m.y;
          let bw = m.w;
          let bh = m.h;
          let cx = bx + bw / 2;
          let cy = by + bh - 10;
          let time = Date.now();

          c.save();
          c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "rgba(39, 174, 96, 0.4)";
          c.beginPath();
          c.ellipse(cx, cy, bw * 0.75, 12, 0, 0, Math.PI * 2);
          c.fill();
          c.stroke();

          let wpRot = (time / 180) % (Math.PI * 2);
          c.strokeStyle = "rgba(46, 204, 113, 0.8)";
          c.lineWidth = 1.8;
          c.save();
          c.translate(cx, cy);
          c.rotate(wpRot);
          c.beginPath();
          c.ellipse(0, 0, bw * 0.6, 6, 0, 0, Math.PI * 2);
          c.stroke();
          c.restore();
          c.save();
          c.translate(cx, cy);
          c.rotate(-wpRot * 1.5);
          c.beginPath();
          c.ellipse(0, 0, bw * 0.4, 4, 0, 0, Math.PI * 2);
          c.stroke();
          c.restore();
          c.restore();

          let pulseHeight = Math.sin(time / 120) * 5;
          let vortexTopY = by + 20 + pulseHeight;
          let vortexWidth = bw * 0.6;

          let vortexGrad = c.createLinearGradient(
            cx - vortexWidth / 2,
            by,
            cx + vortexWidth / 2,
            cy,
          );
          if (m.flashTimer > 0) {
            vortexGrad.addColorStop(0, "#ffffff");
            vortexGrad.addColorStop(1, "#ffffff");
          } else {
            vortexGrad.addColorStop(0, "#2ecc71");
            vortexGrad.addColorStop(0.5, "#27ae60");
            vortexGrad.addColorStop(1, "#1e8449");
          }

          c.fillStyle = vortexGrad;
          c.beginPath();
          c.moveTo(cx - vortexWidth * 0.4, cy);
          c.quadraticCurveTo(
            cx - vortexWidth * 0.75,
            (cy + vortexTopY) / 2,
            cx - vortexWidth * 0.5,
            vortexTopY,
          );
          c.bezierCurveTo(
            cx - vortexWidth * 0.2,
            vortexTopY - 12,
            cx + vortexWidth * 0.2,
            vortexTopY - 12,
            cx + vortexWidth * 0.5,
            vortexTopY,
          );
          c.quadraticCurveTo(
            cx + vortexWidth * 0.75,
            (cy + vortexTopY) / 2,
            cx + vortexWidth * 0.4,
            cy,
          );
          c.closePath();
          c.fill();
          c.stroke();

          c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#27ae60";
          for (let i = -1; i <= 1; i += 2) {
            let sway = Math.sin(time / 140 + i * 2) * 8;
            let pX = cx + i * vortexWidth * 0.4;
            let pY = cy - 22;

            c.beginPath();
            c.moveTo(pX, pY);
            c.quadraticCurveTo(
              pX + i * 22 + sway,
              pY - 15 + sway / 2,
              pX + i * 35 + sway,
              pY + 4 + sway,
            );
            c.quadraticCurveTo(
              pX + i * 22 + sway,
              pY - 5 + sway / 2,
              pX,
              pY + 8,
            );
            c.closePath();
            c.fill();
            c.stroke();
          }

          if (m.flashTimer === 0) {
            c.fillStyle = "#ffffff";
            c.beginPath();
            c.arc(cx, vortexTopY + 14, 8, 0, Math.PI * 2);
            c.fill();
            c.stroke();
            c.fillStyle = "#9b59b6";
            c.beginPath();
            c.arc(cx, vortexTopY + 14, 3.5, 0, Math.PI * 2);
            c.fill();
            c.stroke();
            c.fillStyle = "#000000";
            c.beginPath();
            c.arc(cx - 0.5, vortexTopY + 14, 1.5, 0, Math.PI * 2);
            c.fill();

            let eyeOffsets = [
              { dx: -12, dy: 30, r: 4, color: "#e74c3c" },
              { dx: 14, dy: 24, r: 5, color: "#f1c40f" },
              { dx: -6, dy: 44, r: 3, color: "#3498db" },
            ];
            eyeOffsets.forEach((eye) => {
              let ex = cx + eye.dx;
              let ey = vortexTopY + eye.dy;
              c.fillStyle = "#ffffff";
              c.beginPath();
              c.arc(ex, ey, eye.r, 0, Math.PI * 2);
              c.fill();
              c.stroke();
              c.fillStyle = eye.color;
              c.beginPath();
              c.arc(ex, ey, eye.r * 0.5, 0, Math.PI * 2);
              c.fill();
              c.stroke();
            });

            c.fillStyle = "rgba(46, 204, 113, 0.6)";
            c.beginPath();
            c.arc(cx - 10, vortexTopY + 2, 4, 0, Math.PI * 2);
            c.arc(cx + 8, vortexTopY + 6, 5, 0, Math.PI * 2);
            c.fill();
          }

          if (m.flashTimer === 0) {
            let dropProgress = (time / 6) % 35;
            c.fillStyle = "#2ecc71";
            c.beginPath();
            c.ellipse(
              cx - 8,
              vortexTopY + 15 + dropProgress,
              1.5,
              3,
              0,
              0,
              Math.PI * 2,
            );
            c.fill();
            let dropProgress2 = (time / 8 + 15) % 40;
            c.fillStyle = "#7bed9f";
            c.beginPath();
            c.ellipse(
              cx + 10,
              vortexTopY + 10 + dropProgress2,
              1.2,
              2.5,
              0,
              0,
              Math.PI * 2,
            );
            c.fill();
          }
        } else if (dType === "equip") {
          let bx = m.x;
          let by = m.y;
          let bw = m.w;
          let bh = m.h;
          let cx = bx + bw / 2;
          let cy = by + bh / 2;
          let time = Date.now();
          let hover = Math.sin(time / 200) * 5;

          c.save();
          let shardOrbitAngle = time / 600;
          let shardCount = 5;
          c.translate(cx, cy + hover);
          for (let i = 0; i < shardCount; i++) {
            let angle = shardOrbitAngle + (i * Math.PI * 2) / shardCount;
            let sx = Math.cos(angle) * (bw * 0.78);
            let sy = Math.sin(angle) * 12;

            c.save();
            c.translate(sx, sy);
            c.rotate(angle * 1.5);

            c.strokeStyle = "rgba(52, 152, 219, 0.65)";
            c.fillStyle = "rgba(52, 152, 219, 0.18)";
            c.lineWidth = 1.2;

            if (i % 2 === 0) {
              c.beginPath();
              c.moveTo(0, -10);
              c.lineTo(2.5, 2);
              c.lineTo(1, 10);
              c.lineTo(-1, 10);
              c.lineTo(-2.5, 2);
              c.closePath();
              c.fill();
              c.stroke();
            } else {
              c.beginPath();
              c.moveTo(-5, -6);
              c.lineTo(5, -6);
              c.lineTo(4, 2);
              c.lineTo(0, 8);
              c.lineTo(-4, 2);
              c.closePath();
              c.fill();
              c.stroke();
            }
            c.restore();
          }
          c.restore();

          let suitY = cy - 8 + hover;
          c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#2c3e50";
          c.strokeStyle = "#000000";
          c.lineWidth = 2.4;

          c.beginPath();
          c.roundRect(cx - 26, suitY - 14, 11, 11, [3]);
          c.roundRect(cx + 15, suitY - 14, 11, 11, [3]);
          c.fill();
          c.stroke();

          c.beginPath();
          c.moveTo(cx - 15, suitY - 8);
          c.lineTo(cx + 15, suitY - 8);
          c.lineTo(cx + 12, suitY + 18);
          c.lineTo(cx, suitY + 28);
          c.lineTo(cx - 12, suitY + 18);
          c.closePath();
          c.fill();
          c.stroke();

          if (m.flashTimer === 0) {
            let corePulse = 4 + Math.sin(time / 80) * 1.5;
            let furnaceGrad = c.createRadialGradient(
              cx,
              suitY + 4,
              1,
              cx,
              suitY + 4,
              corePulse + 6,
            );
            furnaceGrad.addColorStop(0, "#ffffff");
            furnaceGrad.addColorStop(0.4, "#e67e22");
            furnaceGrad.addColorStop(1, "rgba(211, 84, 0, 0)");
            c.fillStyle = furnaceGrad;
            c.beginPath();
            c.arc(cx, suitY + 4, corePulse + 6, 0, Math.PI * 2);
            c.fill();

            c.strokeStyle = "#1a252f";
            c.lineWidth = 2.0;
            c.beginPath();
            c.moveTo(cx - 6, suitY + 4);
            c.lineTo(cx + 6, suitY + 4);
            c.moveTo(cx, suitY - 2);
            c.lineTo(cx, suitY + 10);
            c.stroke();
          }

          c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#1a252f";
          c.beginPath();
          c.roundRect(cx - 9, suitY - 32, 18, 16, [4]);
          c.fill();
          c.stroke();
          if (m.flashTimer === 0) {
            c.fillStyle = "#ff5500";
            c.beginPath();
            c.rect(cx - 6, suitY - 25, 12, 2.5);
            c.fill();
          }

          c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#2c3e50";
          c.beginPath();
          c.ellipse(cx - 22, suitY + 12, 4.5, 4.5, 0, 0, Math.PI * 2);
          c.fill();
          c.stroke();

          c.strokeStyle = "#5d6d7e";
          c.lineWidth = 3.0;
          c.beginPath();
          c.moveTo(cx - 22, suitY + 12);
          c.lineTo(cx - 18, cy + 32 + hover);
          c.stroke();

          let ax = cx - 18;
          let ay = cy + 32 + hover;
          c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#1b1d22";
          c.beginPath();
          c.moveTo(ax - 18, ay - 8);
          c.lineTo(ax + 18, ay - 8);
          c.quadraticCurveTo(ax + 10, ay, ax + 14, ay + 14);
          c.lineTo(ax - 14, ay + 14);
          c.quadraticCurveTo(ax - 10, ay, ax - 18, ay - 8);
          c.closePath();
          c.fill();
          c.stroke();

          c.beginPath();
          c.moveTo(ax - 18, ay - 8);
          c.quadraticCurveTo(ax - 28, ay - 11, ax - 30, ay - 5);
          c.quadraticCurveTo(ax - 18, ay, ax - 18, ay + 2);
          c.closePath();
          c.fill();
          c.stroke();

          if (m.flashTimer === 0) {
            let heatGrad = c.createLinearGradient(
              ax - 20,
              ay - 7,
              ax + 15,
              ay - 2,
            );
            heatGrad.addColorStop(0, "#ffeaa7");
            heatGrad.addColorStop(0.5, "#d35400");
            heatGrad.addColorStop(1, "rgba(27, 29, 34, 0)");
            c.fillStyle = heatGrad;
            c.beginPath();
            c.rect(ax - 15, ay - 7, 28, 4);
            c.fill();
          }
        }
      }
    } else if (
      m.type === "prestige_boss" ||
      m.type === "hooktail" ||
      m.visualType === "hooktail"
    ) {
      let hoverY = Math.sin(Date.now() / 150) * 6;
      let jawOpen = Math.abs(Math.sin(Date.now() / 400)) * 12;
      c.save();
      c.translate(m.x, m.y + hoverY);
      let baseW = 70;
      let baseH = 80;
      let scaleX = m.w / baseW;
      let scaleY = m.h / baseH;
      c.scale(scaleX, scaleY);

      let auraGlow = c.createRadialGradient(
        baseW / 2,
        baseH / 2,
        10,
        baseW / 2,
        baseH / 2,
        100,
      );
      auraGlow.addColorStop(0, "rgba(231, 76, 60, 0.45)");
      auraGlow.addColorStop(0.5, "rgba(142, 68, 173, 0.15)");
      auraGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
      c.fillStyle = auraGlow;
      c.beginPath();
      c.arc(baseW / 2 + 30, baseH / 2, 80, 0, Math.PI * 2);
      c.fill();

      for (let i = 6; i >= 1; i--) {
        let segX = baseW / 2 + i * 18;
        let segY = baseH / 2 + Math.sin(Date.now() / 180 + i * 0.7) * 8;
        c.save();
        c.fillStyle = i % 2 === 0 ? "#111116" : "#5a0e0e";
        c.strokeStyle = "#000000";
        c.lineWidth = 2.4 / Math.max(scaleX, scaleY);
        c.beginPath();
        c.arc(segX, segY, 26 - i * 2.2, 0, Math.PI * 2);
        c.fill();
        c.stroke();
        c.restore();

        if (
          !window.isGamePaused &&
          Math.random() < 0.2 &&
          window.particles.length < 200
        ) {
          window.particles.push({
            x: m.x + segX * scaleX,
            y: m.y + hoverY + segY * scaleY - 30,
            vx: window.randFloat(-0.4, 0.2),
            vy: -window.randFloat(1.2, 2.2),
            gravity: -0.06,
            radius: window.randFloat(3.0, 5.0),
            growth: 0.15,
            color: "rgba(30, 30, 35, 0.65)",
            alpha: 0.75,
            fade: true,
            maxLife: 80,
            life: window.randInt(60, 80),
          });
        }
      }

      c.save();
      c.fillStyle = "#d35400";
      c.strokeStyle = "#000000";
      c.lineWidth = 2.4 / Math.max(scaleX, scaleY);
      c.lineJoin = "round";
      c.beginPath();
      c.moveTo(baseW - 25, -20);
      c.quadraticCurveTo(baseW + 5, -50, baseW + 22, -45);
      c.quadraticCurveTo(baseW - 3, -25, baseW - 30, -5);
      c.closePath();
      c.fill();
      c.stroke();
      c.restore();

      c.save();
      c.fillStyle = "#110202";
      c.strokeStyle = "#e74c3c";
      c.lineWidth = 3 / Math.max(scaleX, scaleY);
      c.lineJoin = "round";
      let wingFlap = Math.sin(Date.now() / 100) * 12;
      c.translate(baseW / 2 + 50, baseH / 2 + 10);
      c.rotate((wingFlap * Math.PI) / 180);
      c.beginPath();
      c.moveTo(0, 0);
      c.lineTo(50, -30);
      c.lineTo(60, 5);
      c.lineTo(40, 15);
      c.lineTo(55, 35);
      c.lineTo(5, 22);
      c.closePath();
      c.fill();
      c.stroke();
      c.restore();

      c.save();
      c.strokeStyle = "#000000";
      c.lineWidth = 2.4 / Math.max(scaleX, scaleY);
      c.lineJoin = "round";
      c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#111115";
      c.beginPath();
      c.moveTo(baseW - 5, -15);
      c.lineTo(baseW - 20, 10);
      c.lineTo(baseW - 15, -25);
      c.lineTo(baseW - 35, 12);
      c.lineTo(5, 5);
      c.lineTo(-10, 18);
      c.lineTo(-15, 30);
      c.lineTo(5, 38);
      c.lineTo(baseW - 10, 38);
      c.lineTo(baseW, 15);
      c.closePath();
      c.fill();
      c.stroke();

      if (m.flashTimer === 0) {
        c.fillStyle = "#ff0000";
        c.beginPath();
        c.ellipse(22, 18, 8, 6, Math.PI / 12, 0, Math.PI * 2);
        c.fill();
        c.fillStyle = "#f1c40f";
        c.beginPath();
        c.ellipse(22, 18, 2, 5, Math.PI / 12, 0, Math.PI * 2);
        c.fill();
      }

      c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#1c2833";
      c.beginPath();
      c.moveTo(-10, 18);
      c.lineTo(-26, 23);
      c.lineTo(-10, 28);
      c.closePath();
      c.fill();
      c.stroke();
      c.save();
      c.translate(15, 38);
      c.rotate((-jawOpen * Math.PI) / 180);
      c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#631c15";
      c.beginPath();
      c.moveTo(0, 0);
      c.lineTo(-25, 4);
      c.lineTo(5, 15);
      c.lineTo(baseW - 15, 10);
      c.closePath();
      c.fill();
      c.stroke();
      c.fillStyle = "#ffeaa7";
      c.beginPath();
      c.moveTo(-15, 2);
      c.lineTo(-12, 9);
      c.lineTo(-9, 2);
      c.fill();
      c.restore();
      c.restore();

      c.save();
      c.strokeStyle = "#000000";
      c.lineWidth = 2.4 / Math.max(scaleX, scaleY);
      c.lineJoin = "round";
      let tailSwayTime = Date.now() / 150;
      for (let i = 1; i <= 6; i++) {
        let segmentSway = Math.sin(tailSwayTime - i * 0.4) * (i * 2.0);
        let segX = 100 + i * 12 + segmentSway;
        let segY = 48 - i * 4 + i * i * 0.5;
        let r = 18 - i * 2.0;
        c.fillStyle = i % 2 === 0 ? "#111116" : "#4a0a0a";
        c.beginPath();
        c.arc(segX, segY, r, 0, Math.PI * 2);
        c.fill();
        c.stroke();
      }
      let tipSway = Math.sin(tailSwayTime - 6 * 0.4) * 12;
      let tipX = 100 + 72 + tipSway;
      let tipY = 48 - 24 + 18;
      c.fillStyle = "#d35400";
      c.beginPath();
      c.moveTo(tipX, tipY);
      c.quadraticCurveTo(tipX + 18, tipY - 8, tipX + 28, tipY - 22);
      c.quadraticCurveTo(tipX + 12, tipY - 14, tipX + 2, tipY - 4);
      c.closePath();
      c.fill();
      c.stroke();
      c.restore();
      c.restore();
    } else {
      let currentTier = t !== undefined ? t : window.getStageTier();
      let bounce = 0;

      if (currentTier === 0) {
        // Background glow layer for Rare targets to immediately signify high-tier spawns
        if (m.isRare) {
          c.save();
          let auraPulse = 1 + Math.sin(Date.now() / 150) * 0.12;
          let auraGrad = c.createRadialGradient(
            m.x + m.w / 2,
            m.y + m.h / 2,
            2,
            m.x + m.w / 2,
            m.y + m.h / 2,
            Math.max(m.w, m.h) * 1.15 * auraPulse,
          );
          auraGrad.addColorStop(0, "rgba(241, 196, 15, 0.45)");
          auraGrad.addColorStop(0.6, "rgba(230, 126, 34, 0.18)");
          auraGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
          c.fillStyle = auraGrad;
          c.beginPath();
          c.arc(
            m.x + m.w / 2,
            m.y + m.h / 2,
            Math.max(m.w, m.h) * 1.15 * auraPulse,
            0,
            Math.PI * 2,
          );
          c.fill();
          c.restore();
        }

        // Wrap with a pivot coordinate space to organic-sway and breathe from the root base
        c.save();
        let ox = m.x + m.w / 2;
        let oy = m.y + m.h;
        let sway = Math.sin(Date.now() / 240) * 0.035;
        let breatheW = 1 + Math.sin(Date.now() / 150) * 0.015;
        let breatheH = 1 + Math.cos(Date.now() / 150) * 0.008;

        c.translate(ox, oy);
        c.rotate(sway);
        c.scale(breatheW, breatheH);
        c.translate(-ox, -oy);

        // ==========================================
        // 1. HORRIFIC JAGGED ARACHNOID TREANT LEGS (ROOT OVERHAUL)
        // ==========================================
        let legColorDark = m.flashTimer > 0 ? "#ffffff" : "#221105";
        let legColorMid = m.flashTimer > 0 ? "#ffffff" : "#3b1e0a";
        let legColorHighlight = m.flashTimer > 0 ? "#ffffff" : "#512c14";

        c.strokeStyle = "#000000";
        c.lineWidth = 2.4;

        let legYBase = m.y + m.h - 10;
        let legOffsets = [
          { dx: -12, stretchX: -36, kneeY: -15, tipY: 10, col: legColorDark },
          { dx: -6, stretchX: -26, kneeY: -25, tipY: 10, col: legColorMid },
          { dx: 6, stretchX: 26, kneeY: -25, tipY: 10, col: legColorHighlight },
          { dx: 12, stretchX: 36, kneeY: -15, tipY: 10, col: legColorDark },
          { dx: -16, stretchX: -46, kneeY: -5, tipY: 10, col: legColorDark },
          { dx: 16, stretchX: 46, kneeY: -5, tipY: 10, col: legColorDark },
        ];

        legOffsets.forEach((leg, index) => {
          let legRootX = m.x + m.w / 2 + leg.dx;
          let kneeX = legRootX + leg.stretchX * 0.6;
          let kneeY =
            legYBase + leg.kneeY + Math.sin(Date.now() / 120 + index) * 3;
          let tipX = legRootX + leg.stretchX;
          let tipY = m.y + m.h + leg.tipY;

          c.fillStyle = leg.col;
          c.beginPath();
          c.moveTo(legRootX, legYBase);
          c.quadraticCurveTo(
            kneeX - 4 * Math.sign(leg.stretchX),
            kneeY - 4,
            kneeX,
            kneeY,
          );
          c.lineTo(tipX, tipY);
          c.lineTo(tipX - 5 * Math.sign(leg.stretchX), tipY);
          c.lineTo(kneeX - 4 * Math.sign(leg.stretchX), kneeY + 4);
          c.lineTo(legRootX, legYBase + 8);
          c.closePath();
          c.fill();
          c.stroke();
        });

        // Dangling silk cocoon swaying beneath the lower canopy
        if (m.flashTimer === 0) {
          c.save();
          let cocoonSway = Math.sin(Date.now() / 180) * 0.12;
          c.translate(m.x + m.w * 0.25, m.y + m.h * 0.25);
          c.rotate(cocoonSway);

          c.strokeStyle = "rgba(255, 255, 255, 0.45)";
          c.lineWidth = 1.2;
          c.beginPath();
          c.moveTo(0, 0);
          c.lineTo(0, 18);
          c.stroke();

          c.fillStyle = "rgba(235, 235, 240, 0.9)";
          c.strokeStyle = "#222";
          c.lineWidth = 1;
          c.beginPath();
          c.ellipse(0, 26, 6, 10, 0, 0, Math.PI * 2);
          c.fill();
          c.stroke();

          c.strokeStyle = "rgba(255, 255, 255, 0.75)";
          c.beginPath();
          c.moveTo(-4, 20);
          c.lineTo(4, 32);
          c.moveTo(4, 20);
          c.lineTo(-4, 32);
          c.stroke();
          c.restore();
        }

        // ==========================================
        // 2. TWISTED ANCIENT TRUNK & STRIATIONS
        // ==========================================
        c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#462810";
        c.beginPath();
        c.moveTo(m.x + m.w * 0.32, m.y + m.h * 0.3); // Left shoulder
        c.quadraticCurveTo(
          m.x + m.w * 0.2,
          m.y + m.h * 0.6,
          m.x + m.w * 0.12,
          m.y + m.h - 12,
        ); // Left flare
        c.lineTo(m.x + m.w * 0.88, m.y + m.h - 12); // Right base flare
        c.quadraticCurveTo(
          m.x + m.w * 0.8,
          m.y + m.h * 0.6,
          m.x + m.w * 0.68,
          m.y + m.h * 0.3,
        ); // Right shoulder
        c.closePath();
        c.fill();
        c.stroke();

        if (m.flashTimer === 0) {
          c.fillStyle = "#5d381b"; // Midtone wood plates
          c.beginPath();
          c.moveTo(m.x + m.w * 0.35, m.y + m.h * 0.35);
          c.bezierCurveTo(
            m.x + m.w * 0.25,
            m.y + m.h * 0.6,
            m.x + m.w * 0.3,
            m.y + m.h * 0.75,
            m.x + m.w * 0.22,
            m.y + m.h - 13,
          );
          c.lineTo(m.x + m.w * 0.78, m.y + m.h - 13);
          c.bezierCurveTo(
            m.x + m.w * 0.7,
            m.y + m.h * 0.75,
            m.x + m.w * 0.75,
            m.y + m.h * 0.6,
            m.x + m.w * 0.65,
            m.y + m.h * 0.32,
          );
          c.closePath();
          c.fill();
          c.stroke();

          c.strokeStyle = "#251205";
          c.lineWidth = 2.4;
          c.beginPath();
          c.moveTo(m.x + m.w * 0.44, m.y + m.h * 0.32);
          c.quadraticCurveTo(
            m.x + m.w * 0.38,
            m.y + m.h * 0.55,
            m.x + m.w * 0.42,
            m.y + m.h - 14,
          );
          c.moveTo(m.x + m.w * 0.56, m.y + m.h * 0.32);
          c.quadraticCurveTo(
            m.x + m.w * 0.62,
            m.y + m.h * 0.58,
            m.x + m.w * 0.58,
            m.y + m.h - 14,
          );
          c.moveTo(m.x + m.w * 0.25, m.y + m.h * 0.52);
          c.quadraticCurveTo(
            m.x + m.w * 0.18,
            m.y + m.h * 0.75,
            m.x + m.w * 0.26,
            m.y + m.h - 14,
          );
          c.stroke();

          c.strokeStyle = "#1b7a43";
          c.lineWidth = 1.8;
          c.beginPath();
          c.moveTo(m.x + m.w * 0.28, m.y + m.h * 0.75);
          c.quadraticCurveTo(
            m.x + m.w * 0.5,
            m.y + m.h * 0.68,
            m.x + m.w * 0.72,
            m.y + m.h * 0.72,
          );
          c.stroke();
        }

        // ==========================================
        // 3. GLOWING GREEN RIFT RUNES & COBWEBS
        // ==========================================
        if (m.flashTimer === 0) {
          let runeGlow = Math.abs(Math.sin(Date.now() / 250)) * 0.7 + 0.3;
          c.save();
          c.strokeStyle = `rgba(0, 255, 136, ${runeGlow})`;
          c.lineWidth = 2.2;
          c.shadowBlur = 10;
          c.shadowColor = "#00ff88";
          c.beginPath();
          c.moveTo(m.x + m.w * 0.25, m.y + m.h * 0.65);
          c.lineTo(m.x + m.w * 0.2, m.y + m.h * 0.72);
          c.lineTo(m.x + m.w * 0.27, m.y + m.h * 0.77);
          c.moveTo(m.x + m.w * 0.75, m.y + m.h * 0.65);
          c.lineTo(m.x + m.w * 0.8, m.y + m.h * 0.72);
          c.lineTo(m.x + m.w * 0.73, m.y + m.h * 0.77);
          c.stroke();
          c.restore();

          // Webbing strands around the trunk body
          c.strokeStyle = "rgba(255, 255, 255, 0.12)";
          c.lineWidth = 1.5;
          c.beginPath();
          c.moveTo(m.x + m.w * 0.18, m.y + m.h * 0.45);
          c.quadraticCurveTo(
            m.x + m.w * 0.3,
            m.y + m.h * 0.48,
            m.x + m.w * 0.24,
            m.y + m.h * 0.6,
          );
          c.moveTo(m.x + m.w * 0.82, m.y + m.h * 0.45);
          c.quadraticCurveTo(
            m.x + m.w * 0.7,
            m.y + m.h * 0.48,
            m.x + m.w * 0.76,
            m.y + m.h * 0.6,
          );
          c.stroke();
        }

        // ==========================================
        // 4. CLAW BRACKETS (ARMS)
        // ==========================================
        let armColor = m.flashTimer > 0 ? "#ffffff" : "#462810";

        c.fillStyle = armColor;
        c.beginPath();
        c.moveTo(m.x + m.w * 0.28, m.y + m.h * 0.32);
        c.quadraticCurveTo(
          m.x - 22,
          m.y + m.h * 0.28,
          m.x - 28,
          m.y + m.h * 0.5,
        ); // Elbow joint
        c.lineTo(m.x - 18, m.y + m.h * 0.52);
        c.quadraticCurveTo(
          m.x - 8,
          m.y + m.h * 0.34,
          m.x + m.w * 0.28,
          m.y + m.h * 0.38,
        );
        c.closePath();
        c.fill();
        c.stroke();

        c.beginPath();
        c.moveTo(m.x - 28, m.y + m.h * 0.5);
        c.lineTo(m.x - 34, m.y + m.h * 0.64);
        c.lineTo(m.x - 24, m.y + m.h * 0.52);
        c.lineTo(m.x - 18, m.y + m.h * 0.67);
        c.lineTo(m.x - 15, m.y + m.h * 0.51);
        c.closePath();
        c.fill();
        c.stroke();

        c.beginPath();
        c.moveTo(m.x + m.w * 0.72, m.y + m.h * 0.32);
        c.quadraticCurveTo(
          m.x + m.w + 22,
          m.y + m.h * 0.24,
          m.x + m.w + 28,
          m.y + m.h * 0.15,
        ); // Elbow joint
        c.lineTo(m.x + m.w + 19, m.y + m.h * 0.12);
        c.quadraticCurveTo(
          m.x + m.w + 10,
          m.y + m.h * 0.28,
          m.x + m.w * 0.72,
          m.y + m.h * 0.38,
        );
        c.closePath();
        c.fill();
        c.stroke();

        c.beginPath();
        c.moveTo(m.x + m.w + 28, m.y + m.h * 0.15);
        c.lineTo(m.x + m.w + 36, m.y + m.h * 0.08);
        c.lineTo(m.x + m.w + 24, m.y + m.h * 0.12);
        c.lineTo(m.x + m.w + 30, m.y + m.h * 0.2);
        c.lineTo(m.x + m.w + 19, m.y + m.h * 0.14);
        c.closePath();
        c.fill();
        c.stroke();

        // ==========================================
        // 5. SPIDER-TREANT VISAGE (8 GLOWING Crimson EYES & DRIFTING VENOM)
        // ==========================================
        let eyeCenterY = m.y + m.h * 0.38;
        let mouthCenterY = m.y + m.h * 0.52;

        // 8 Glowing Crimson Spider Eyes in an arachnid cluster layout
        if (m.flashTimer === 0) {
          c.save();
          c.fillStyle = "#ff0055"; // Arachnid crimson glow
          c.shadowBlur = 10;
          c.shadowColor = "#ff0055";

          let eyeCluster = [
            { dx: -10, dy: -2, rx: 4, ry: 4, rot: 0 },
            { dx: 10, dy: -2, rx: 4, ry: 4, rot: 0 },
            { dx: -4, dy: -6, rx: 2.2, ry: 2.2, rot: 0 },
            { dx: 4, dy: -6, rx: 2.2, ry: 2.2, rot: 0 },
            { dx: -15, dy: 3, rx: 1.8, ry: 1.8, rot: 0 },
            { dx: 15, dy: 3, rx: 1.8, ry: 1.8, rot: 0 },
            { dx: -6, dy: 1, rx: 1.5, ry: 1.5, rot: 0 },
            { dx: 6, dy: 1, rx: 1.5, ry: 1.5, rot: 0 },
          ];

          eyeCluster.forEach((eye) => {
            c.beginPath();
            c.ellipse(
              m.x + m.w * 0.5 + eye.dx,
              eyeCenterY + eye.dy,
              eye.rx,
              eye.ry,
              eye.rot,
              0,
              Math.PI * 2,
            );
            c.fill();
          });
          c.restore();

          c.strokeStyle = "#150802";
          c.lineWidth = 3.0;
          c.beginPath();
          c.moveTo(m.x + m.w * 0.32, eyeCenterY - 10);
          c.quadraticCurveTo(
            m.x + m.w * 0.5,
            eyeCenterY - 4,
            m.x + m.w * 0.68,
            eyeCenterY - 10,
          );
          c.stroke();
        }

        // Gaping Jagged Mouth Hollow (Glowing Green Rift Core)
        c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#1a0802"; // Void interior
        c.beginPath();
        c.ellipse(
          m.x + m.w * 0.5,
          mouthCenterY,
          m.w * 0.22,
          m.h * 0.09,
          0,
          0,
          Math.PI * 2,
        );
        c.fill();
        c.stroke();

        if (m.flashTimer === 0) {
          c.save();
          let mouthPulse = 1.0 + Math.sin(Date.now() / 100) * 0.08;
          let mouthGrad = c.createRadialGradient(
            m.x + m.w * 0.5,
            mouthCenterY,
            2,
            m.x + m.w * 0.5,
            mouthCenterY,
            m.w * 0.22 * mouthPulse,
          );
          mouthGrad.addColorStop(0, "#ffffff");
          mouthGrad.addColorStop(0.4, "#00ff88");
          mouthGrad.addColorStop(0.8, "#2ecc71");
          mouthGrad.addColorStop(1, "rgba(46, 204, 113, 0)");
          c.fillStyle = mouthGrad;
          c.shadowBlur = 15;
          c.shadowColor = "#00ff88";

          c.beginPath();
          c.ellipse(
            m.x + m.w * 0.5,
            mouthCenterY,
            m.w * 0.22,
            m.h * 0.09,
            0,
            0,
            Math.PI * 2,
          );
          c.fill();
          c.restore();

          // Broken trunk teeth
          c.fillStyle = "#2d1607";
          c.strokeStyle = "#000000";
          c.lineWidth = 1.5;

          let tX = m.x + m.w * 0.5;
          let tY = mouthCenterY;
          let mW = m.w * 0.22;
          let mH = m.h * 0.09;

          let upperTeeth = [
            { ox: -mW * 0.7, oy: -mH * 0.3, len: 6 },
            { ox: -mW * 0.3, oy: -mH * 0.6, len: 10 },
            { ox: 0, oy: -mH * 0.8, len: 11 },
            { ox: mW * 0.3, oy: -mH * 0.6, len: 10 },
            { ox: mW * 0.7, oy: -mH * 0.3, len: 6 },
          ];
          upperTeeth.forEach((tooth) => {
            c.beginPath();
            c.moveTo(tX + tooth.ox - 3, tY + tooth.oy);
            c.lineTo(tX + tooth.ox, tY + tooth.oy + tooth.len);
            c.lineTo(tX + tooth.ox + 3, tY + tooth.oy);
            c.closePath();
            c.fill();
            c.stroke();
          });

          let lowerTeeth = [
            { ox: -mW * 0.5, oy: mH * 0.4, len: 8 },
            { ox: -mW * 0.15, oy: mH * 0.7, len: 10 },
            { ox: mW * 0.15, oy: mH * 0.7, len: 10 },
            { ox: mW * 0.5, oy: mH * 0.4, len: 8 },
          ];
          lowerTeeth.forEach((tooth) => {
            c.beginPath();
            c.moveTo(tX + tooth.ox - 3, tY + tooth.oy);
            c.lineTo(tX + tooth.ox, tY + tooth.oy - tooth.len);
            c.lineTo(tX + tooth.ox + 3, tY + tooth.oy);
            c.closePath();
            c.fill();
            c.stroke();
          });

          // Dripping Green Slime/Venom droplets
          let venomOffset = (Date.now() / 8) % 35;
          c.fillStyle = "#00ff88";
          c.beginPath();
          c.ellipse(tX - 8, tY + 4 + venomOffset, 1.2, 3, 0, 0, Math.PI * 2);
          c.ellipse(
            tX + 10,
            tY + 2 + venomOffset * 0.8,
            1.0,
            2.5,
            0,
            0,
            Math.PI * 2,
          );
          c.fill();
        }

        // 6. Multi-Layer Foliage Canopy (Isolated sub-paths to prevent intersecting connecting lines)
        let cx = m.x + m.w / 2;
        let cy = m.y + m.h * 0.08;
        let r = m.w * 0.9;

        let drawCleanClump = (x, y, radius, color) => {
          c.fillStyle = m.flashTimer > 0 ? "#ffffff" : color;
          c.beginPath();
          c.arc(x, y, radius, 0, Math.PI * 2);
          c.fill();
          c.stroke();
        };

        // Layer 1: Base Deep Forest Green
        let color1 = "#1a461e";
        drawCleanClump(cx, cy, r, color1);
        drawCleanClump(cx - r * 0.5, cy - r * 0.2, r * 0.75, color1);
        drawCleanClump(cx + r * 0.5, cy - r * 0.2, r * 0.75, color1);
        drawCleanClump(cx, cy - r * 0.5, r * 0.85, color1);

        // Layer 2: Vibrant Mid-Green
        let color2 = "#2ecc71";
        drawCleanClump(cx, cy, r * 0.8, color2);
        drawCleanClump(cx - r * 0.4, cy - r * 0.5, r * 0.6, color2);
        drawCleanClump(cx + r * 0.4, cy - r * 0.5, r * 0.6, color2);

        // Layer 3: Highlighted vibrant light-green (Adds foliage depth)
        let color3 = "#52be80";
        drawCleanClump(cx - r * 0.2, cy - r * 0.3, r * 0.4, color3);
        drawCleanClump(cx + r * 0.2, cy - r * 0.3, r * 0.4, color3);

        // 7. Hanging moss/ivy strands swaying dynamically
        if (m.flashTimer === 0) {
          c.fillStyle = "#164d1f";
          for (let i = 0; i < 5; i++) {
            let ivyOffset = -r * 0.6 + i * r * 0.3;
            let ivyX = cx + ivyOffset;
            let ivyY = cy + r * 0.3;
            let ivySway = Math.sin(Date.now() / 200 + i) * 4;
            c.beginPath();
            c.moveTo(ivyX - 3.5, ivyY);
            c.quadraticCurveTo(
              ivyX + ivySway,
              ivyY + 16,
              ivyX + ivySway + 1,
              ivyY + 24,
            );
            c.quadraticCurveTo(
              ivyX + 4.5 + ivySway,
              ivyY + 16,
              ivyX + 3.5,
              ivyY,
            );
            c.closePath();
            c.fill();
            c.stroke();
          }
        }

        // 8. Glowing Eldritch "Forest-Eye" Fruits (Pulsing glowing eyes peering from leaves)
        if (m.flashTimer === 0) {
          if (!m.appleOffsets) {
            m.appleOffsets = [];
            let count = window.randInt(4, 7);
            for (let i = 0; i < count; i++) {
              let angle = window.randFloat(0, Math.PI * 2);
              let dist = window.randFloat(0, r * 0.8);
              m.appleOffsets.push({
                dx: Math.cos(angle) * dist,
                dy: Math.sin(angle) * dist - r * 0.1,
                sizeMod: window.randFloat(0.9, 1.25),
                eyeRot: window.randFloat(-Math.PI / 10, Math.PI / 10),
              });
            }
          }
          c.save();
          c.shadowBlur = 12;
          c.shadowColor = "#ff2200";

          let eyePulse = 1 + Math.sin(Date.now() / 150) * 0.08;

          m.appleOffsets.forEach((ap) => {
            let appleX = cx + ap.dx;
            let appleY = cy + ap.dy;
            let rRadius = m.w * 0.11 * ap.sizeMod * eyePulse;

            c.save();
            c.translate(appleX, appleY);
            c.rotate(ap.eyeRot);

            // Dual-color Eldritch Eye radial gradient (Glow center to crimson edge)
            let fruitGrad = c.createRadialGradient(0, 0, 1, 0, 0, rRadius);
            fruitGrad.addColorStop(0, "#ffffff");
            fruitGrad.addColorStop(0.3, "#f1c40f"); // Yellow iris ring
            fruitGrad.addColorStop(0.7, "#d35400"); // Rich orange boundary
            fruitGrad.addColorStop(1, "#c0392b"); // Crimson base
            c.fillStyle = fruitGrad;

            c.beginPath();
            c.arc(0, 0, rRadius, 0, Math.PI * 2);
            c.fill();
            c.stroke();

            // Menacing black reptilian slit pupil right in the center!
            c.fillStyle = "#000000";
            c.beginPath();
            c.ellipse(0, 0, rRadius * 0.2, rRadius * 0.7, 0, 0, Math.PI * 2);
            c.fill();

            // Micro white specular highlight reflecting light
            c.fillStyle = "#ffffff";
            c.beginPath();
            c.arc(
              -rRadius * 0.25,
              -rRadius * 0.25,
              rRadius * 0.15,
              0,
              Math.PI * 2,
            );
            c.fill();

            c.restore();
          });
          c.restore();
        }
        c.restore();
      } else if (currentTier === 1) {
        let bounceOffset = Math.sin(Date.now() / 200) * 3;
        let blockColor = m.flashTimer > 0 ? "#ffffff" : "#3b3f46";
        let shadowColor = m.flashTimer > 0 ? "#ffffff" : "#1f2126";
        let lavaColor = "#ff2200";

        c.fillStyle = shadowColor;
        c.beginPath();
        c.rect(m.x + 4, m.y + m.h - 16, m.w - 8, 16);
        c.fill();
        c.stroke();
        c.fillStyle = blockColor;
        c.beginPath();
        c.rect(m.x + 8, m.y + m.h - 14, 12, 14);
        c.fill();
        c.stroke();
        c.beginPath();
        c.rect(m.x + m.w - 20, m.y + m.h - 14, 12, 14);
        c.fill();
        c.stroke();

        c.fillStyle = shadowColor;
        c.beginPath();
        c.roundRect(m.x - 2, m.y + 24 + bounceOffset, m.w + 4, m.h - 40, [10]);
        c.fill();
        c.stroke();

        c.fillStyle = blockColor;
        c.beginPath();
        c.roundRect(m.x, m.y + 26 + bounceOffset, m.w, m.h - 44, [8]);
        c.fill();
        c.stroke();

        c.fillStyle = "#121316";
        c.beginPath();
        c.roundRect(m.x - 10, m.y + 20 + bounceOffset, 14, 16, [4]);
        c.roundRect(m.x + m.w - 4, m.y + 20 + bounceOffset, 14, 16, [4]);
        c.fill();
        c.stroke();

        c.fillStyle = shadowColor;
        c.beginPath();
        c.roundRect(m.x + 8, m.y + 4 + bounceOffset, m.w - 16, 22, [6]);
        c.fill();
        c.stroke();

        c.fillStyle = blockColor;
        c.beginPath();
        c.roundRect(m.x + 10, m.y + 6 + bounceOffset, m.w - 20, 18, [4]);
        c.fill();
        c.stroke();

        if (m.flashTimer === 0) {
          c.fillStyle = lavaColor;
          c.shadowBlur = 15;
          c.shadowColor = lavaColor;

          c.beginPath();
          c.moveTo(m.x + 14, m.y + 11 + bounceOffset);
          c.lineTo(m.x + 22, m.y + 16 + bounceOffset);
          c.lineTo(m.x + 14, m.y + 18 + bounceOffset);
          c.closePath();

          c.moveTo(m.x + m.w - 14, m.y + m.h - 14 + bounceOffset);
          c.lineTo(m.x + m.w - 22, m.y + m.h - 16 + bounceOffset);
          c.lineTo(m.x + m.w - 14, m.y + m.h - 18 + bounceOffset);
          c.closePath();
          c.fill();
          c.stroke();

          c.shadowBlur = 0;
        }

        if (m.flashTimer === 0) {
          c.strokeStyle = lavaColor;
          c.shadowBlur = 10;
          c.shadowColor = lavaColor;
          c.lineWidth = 2.5;

          c.beginPath();
          c.moveTo(m.x + m.w / 2, m.y + m.h / 2 + 5 + bounceOffset);
          c.lineTo(m.x + 10, m.y + 35 + bounceOffset);
          c.moveTo(m.x + m.w / 2, m.y + m.h / 2 + 5 + bounceOffset);
          c.lineTo(m.x + m.w - 10, m.y + 35 + bounceOffset);
          c.moveTo(m.x + m.w / 2, m.y + m.h / 2 + 5 + bounceOffset);
          c.lineTo(m.x + m.w / 2, m.y + m.h - 22 + bounceOffset);
          c.stroke();

          let coreGrad = c.createRadialGradient(
            m.x + m.w / 2,
            m.y + m.h / 2 + 5 + bounceOffset,
            1,
            m.x + m.w / 2,
            m.y + m.h / 2 + 5 + bounceOffset,
            8,
          );
          coreGrad.addColorStop(0, "#ffffff");
          coreGrad.addColorStop(0.3, "#ff3b30");
          coreGrad.addColorStop(1, "rgba(255, 0, 0, 0)");
          c.fillStyle = coreGrad;
          c.beginPath();
          c.arc(
            m.x + m.w / 2,
            m.y + m.h / 2 + 5 + bounceOffset,
            8,
            0,
            Math.PI * 2,
          );
          c.fill();
          c.stroke();

          c.shadowBlur = 0;
        }
      } else {
        if (currentTier === 2) {
          // TIER 2: Revamped Inferno Boss (Brimstone Colossus - Ignis)
          let bounce = Math.sin(Date.now() / 150) * 3.5;
          let cx = m.x + m.w / 2;
          let cy = m.y + m.h / 2 + bounce;

          // Heavy Jagged Charcoal Obsidian shoulders (curved pauldrons)
          c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#1c1c1f"; // deep charcoal
          c.beginPath();
          c.moveTo(cx - 28, cy + 30);
          c.lineTo(cx - 22, cy - 5);
          c.lineTo(cx - 32, cy - 14); // shoulder point
          c.lineTo(cx - 10, cy - 10);
          c.lineTo(cx, cy); // neck joint
          c.lineTo(cx + 10, cy - 10);
          c.lineTo(cx + 32, cy - 14); // shoulder point
          c.lineTo(cx + 22, cy - 5);
          c.lineTo(cx + 28, cy + 30);
          c.closePath();
          c.fill();
          c.stroke();

          // Glowing magma fissures running down the armor plates
          if (m.flashTimer === 0) {
            c.strokeStyle = "#d35400";
            c.lineWidth = 2;
            c.beginPath();
            c.moveTo(cx - 20, cy + 10);
            c.lineTo(cx - 8, cy + 22);
            c.lineTo(cx - 14, cy + 26);
            c.moveTo(cx + 20, cy + 10);
            c.lineTo(cx + 8, cy + 22);
            c.lineTo(cx + 14, cy + 26);
            c.stroke();
          }

          // Molten core in the center flaring
          if (m.flashTimer === 0) {
            let corePulse = 10 + Math.sin(Date.now() / 80) * 3;
            let coreGrad = c.createRadialGradient(
              cx,
              cy + 16,
              2,
              cx,
              cy + 16,
              corePulse,
            );
            coreGrad.addColorStop(0, "#ffffff");
            coreGrad.addColorStop(0.4, "#f39c12");
            coreGrad.addColorStop(1, "rgba(231, 76, 60, 0)");
            c.fillStyle = coreGrad;
            c.beginPath();
            c.arc(cx, cy + 16, corePulse, 0, Math.PI * 2);
            c.fill();
          }

          // Giant sulfur-horned helmet
          c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#2f3238";
          c.beginPath();
          c.roundRect(cx - 12, cy - 26, 24, 20, [3]);
          c.fill();
          c.stroke();

          // Massive curved horns curling up from helmet
          c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#e67e22";
          c.beginPath();
          // Left
          c.moveTo(cx - 11, cy - 20);
          c.quadraticCurveTo(cx - 25, cy - 40, cx - 28, cy - 35);
          c.lineTo(cx - 8, cy - 14);
          c.closePath();
          // Right
          c.moveTo(cx + 11, cy - 20);
          c.quadraticCurveTo(cx + 25, cy - 40, cx + 28, cy - 35);
          c.lineTo(cx + 8, cy - 14);
          c.closePath();
          c.fill();
          c.stroke();

          // Molten iron visor slit
          if (m.flashTimer === 0) {
            c.fillStyle = "#ff3b30";
            c.beginPath();
            c.rect(cx - 8, cy - 18, 16, 3);
            c.fill();
          }
        } else if (currentTier === 3) {
          // TIER 3: Swamp Bog-Colossus Boss (Root-entangled swamp elemental)
          let bounce = Math.sin(Date.now() / 170) * 3;
          let cx = m.x + m.w / 2;
          let cy = m.y + m.h / 2 + bounce;

          // Tangled wooden root body
          c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#2d1e12";
          c.beginPath();
          c.roundRect(cx - 22, cy - 10, 44, 50, [10]);
          c.fill();
          c.stroke();

          // Mossy/Leafy swamp shoulders
          c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#143d1f";
          c.beginPath();
          c.ellipse(cx - 20, cy - 10, 12, 12, 0, 0, Math.PI * 2);
          c.ellipse(cx + 20, cy - 10, 12, 12, 0, 0, Math.PI * 2);
          c.fill();
          c.stroke();

          // Bog face
          c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#1a120a";
          c.beginPath();
          c.arc(cx, cy - 22, 12, 0, Math.PI * 2);
          c.fill();
          c.stroke();

          if (m.flashTimer === 0) {
            // Glowing toxic green swamp eyes
            c.fillStyle = "#2ecc71";
            c.beginPath();
            c.arc(cx - 4, cy - 22, 2.2, 0, Math.PI * 2);
            c.arc(cx + 4, cy - 22, 2.2, 0, Math.PI * 2);
            c.fill();
          }
        } else if (currentTier === 4) {
          // TIER 4: Void Overseer Boss (Levitating levitational multi-eyed space singularity)
          let hover = Math.sin(Date.now() / 140) * 6;
          let cx = m.x + m.w / 2;
          let cy = m.y + m.h / 2 - 10 + hover;

          // Swirling cosmic aura backplate
          if (m.flashTimer === 0) {
            let coreGrad = c.createRadialGradient(cx, cy, 2, cx, cy, 28);
            coreGrad.addColorStop(0, "#ffffff");
            coreGrad.addColorStop(0.4, "#9b59b6");
            coreGrad.addColorStop(1, "rgba(0,0,0,0)");
            c.fillStyle = coreGrad;
            c.beginPath();
            c.arc(cx, cy, 28, 0, Math.PI * 2);
            c.fill();
          }

          // Central obsidian core plate
          c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#0d011a";
          c.beginPath();
          c.moveTo(cx, cy - 20);
          c.lineTo(cx + 18, cy);
          c.lineTo(cx, cy + 20);
          c.lineTo(cx - 18, cy);
          c.closePath();
          c.fill();
          c.stroke();

          if (m.flashTimer === 0) {
            // Blinking pink void watch eyes
            c.fillStyle = "#ff007f";
            c.beginPath();
            c.arc(cx, cy, 3.5, 0, Math.PI * 2);
            c.arc(cx - 8, cy - 8, 1.8, 0, Math.PI * 2);
            c.arc(cx + 8, cy - 8, 1.8, 0, Math.PI * 2);
            c.arc(cx - 8, cy + 8, 1.8, 0, Math.PI * 2);
            c.arc(cx + 8, cy + 8, 1.8, 0, Math.PI * 2);
            c.fill();
          }
        } else if (currentTier === 5) {
          // TIER 5: Gilded Clockwork Sphinx (Temporal Sanctorum Campaign Warden)
          let bounce = Math.sin(Date.now() / 150) * 4;
          let cx = m.x + m.w / 2;
          let cy = m.y + m.h / 2 + bounce;

          // Sphinx lion torso & sand wings
          c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#dca04c";
          c.beginPath();
          c.ellipse(cx, cy + 15, 18, 22, 0, 0, Math.PI * 2);
          c.fill();
          c.stroke();

          // Golden Pharaoh Headdress
          c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#f1c40f";
          c.beginPath();
          c.moveTo(cx, cy - 28);
          c.lineTo(cx - 18, cy - 10);
          c.lineTo(cx - 12, cy + 6);
          c.lineTo(cx, cy - 2);
          c.lineTo(cx + 12, cy + 6);
          c.lineTo(cx + 18, cy - 10);
          c.closePath();
          c.fill();
          c.stroke();

          // Sphinx Face
          c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#e5c185";
          c.beginPath();
          c.roundRect(cx - 8, cy - 18, 16, 18, [3]);
          c.fill();
          c.stroke();

          if (m.flashTimer === 0) {
            // Blank white glowing eyes
            c.fillStyle = "#ffffff";
            c.shadowBlur = 6;
            c.shadowColor = "#ffffff";
            c.beginPath();
            c.arc(cx - 3.5, cy - 10, 1.8, 0, Math.PI * 2);
            c.arc(cx + 3.5, cy - 10, 1.8, 0, Math.PI * 2);
            c.fill();
            c.shadowBlur = 0;
          }
        } else if (currentTier === 6) {
          // TIER 6: Grid Centurion (Cyberspace Nexus Campaign Warden)
          let hover = Math.sin(Date.now() / 120) * 6;
          let cx = m.x + m.w / 2;
          let cy = m.y + m.h / 2 + hover;

          // Floating neon vector shield
          c.strokeStyle = m.flashTimer > 0 ? "#ffffff" : "#3498db";
          c.lineWidth = 1.5;
          c.save();
          c.translate(cx - 24, cy + 4);
          c.rotate(Date.now() / 500);
          c.strokeRect(-8, -8, 16, 16);
          c.restore();

          // Visor helmet
          c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#1a1c23";
          c.beginPath();
          c.roundRect(cx - 12, cy - 18, 24, 22, [4]);
          c.fill();
          c.stroke();

          if (m.flashTimer === 0) {
            // Visor
            c.fillStyle = "#00d2ff";
            c.beginPath();
            c.rect(cx - 8, cy - 11, 16, 4);
            c.fill();

            // Falling green matrix cape code blocks
            c.fillStyle = "rgba(46, 204, 113, 0.65)";
            for (let i = 0; i < 3; i++) {
              let offset = (i - 1) * 8;
              let yProgress = (Date.now() / 6 + i * 20) % 20;
              c.fillRect(cx + offset - 1, cy + 4 + yProgress, 2, 8);
            }
          }
        } else if (currentTier === 7) {
          // TIER 7: Chronos Arbitrator (The Clockwork God - exclusive T2 Altar Summon)
          let hover = Math.sin(Date.now() / 200) * 8;
          let cx = m.x + m.w / 2;
          let cy = m.y + m.h / 2 + hover;

          // Glowing brass gear halo
          let gearAngle = (Date.now() / 4000) % (Math.PI * 2);
          c.save();
          c.translate(cx, cy);
          c.rotate(gearAngle);
          c.strokeStyle = "#f1c40f";
          c.lineWidth = 2.0;
          c.fillStyle =
            m.flashTimer > 0 ? "#ffffff" : "rgba(241, 196, 15, 0.08)";
          c.beginPath();
          c.arc(0, 0, 42, 0, Math.PI * 2);
          c.fill();
          c.stroke();
          for (let i = 0; i < 8; i++) {
            c.rotate(Math.PI / 4);
            c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#dca04c";
            c.beginPath();
            c.rect(-5, -50, 10, 10);
            c.fill();
            c.stroke();
          }
          c.restore();

          // Cracked Ivory Mask Plate
          c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#fdf6e2";
          c.strokeStyle = "#000000";
          c.lineWidth = 2.4;
          c.beginPath();
          c.moveTo(cx, cy - 25);
          c.quadraticCurveTo(cx - 20, cy - 20, cx - 20, cy);
          c.lineTo(cx - 12, cy + 28);
          c.lineTo(cx + 12, cy + 28);
          c.lineTo(cx + 20, cy);
          c.quadraticCurveTo(cx + 20, cy - 20, cx, cy - 25);
          c.closePath();
          c.fill();
          c.stroke();

          if (m.flashTimer === 0) {
            // Shimmering cracks
            c.strokeStyle = "#1a0f02";
            c.lineWidth = 1.5;
            c.beginPath();
            c.moveTo(cx - 10, cy - 10);
            c.lineTo(cx - 4, cy - 4);
            c.lineTo(cx - 8, cy + 2);
            c.moveTo(cx + 10, cy - 8);
            c.lineTo(cx + 6, cy - 2);
            c.stroke();

            // White glowing eyes
            c.fillStyle = "#ffffff";
            c.shadowBlur = 8;
            c.shadowColor = "#ffffff";
            c.beginPath();
            c.arc(cx - 6, cy - 5, 3, 0, Math.PI * 2);
            c.arc(cx + 6, cy - 5, 3, 0, Math.PI * 2);
            c.fill();
            c.shadowBlur = 0;
          }

          c.strokeStyle = "#111116";
          c.lineWidth = 2.5;
          c.lineCap = "round";
          let hrAngle = Date.now() / 10000;
          c.beginPath();
          c.moveTo(0, 0);
          c.lineTo(Math.cos(hrAngle) * 15, Math.sin(hrAngle) * 15);
          c.stroke();
          let minAngle = Date.now() / 1800;
          c.strokeStyle = "#d35400";
          c.lineWidth = 1.8;
          c.beginPath();
          c.moveTo(0, 0);
          c.lineTo(Math.cos(minAngle) * 22, Math.sin(minAngle) * 22);
          c.stroke();
          c.restore();
        } else {
          // TIER 8+: Nexus Overseer (The Glitch Singularity - exclusive T3 Altar Summon)
          let cx = m.x + m.w / 2;
          let cy = m.y + m.h / 2;
          let isGlitchedFrame = Math.sin(Date.now() / 10) > 0.85;
          let px = cx + (isGlitchedFrame ? window.randFloat(-4, 4) : 0);
          let py = cy + (isGlitchedFrame ? window.randFloat(-3, 3) : 0);
          c.save();
          c.translate(px, py);
          c.rotate(Date.now() / 800);
          c.strokeStyle = m.flashTimer > 0 ? "#ffffff" : "#ff007f";
          c.lineWidth = 2.0;
          let cycle = Math.floor(Date.now() / 5000) % 3;
          if (cycle === 0) {
            c.strokeRect(-18, -18, 36, 36);
            c.strokeRect(-12, -12, 24, 24);
            c.beginPath();
            c.moveTo(-18, -18);
            c.lineTo(-12, -12);
            c.moveTo(18, -18);
            c.lineTo(12, -12);
            c.moveTo(-18, 18);
            c.lineTo(-12, 12);
            c.moveTo(18, 18);
            c.lineTo(12, 12);
            c.stroke();
          } else if (cycle === 1) {
            c.beginPath();
            c.moveTo(0, -22);
            c.lineTo(-18, 14);
            c.lineTo(18, 14);
            c.closePath();
            c.moveTo(0, -22);
            c.lineTo(0, 18);
            c.lineTo(-18, 14);
            c.moveTo(0, 18);
            c.lineTo(18, 14);
            c.stroke();
          } else {
            c.beginPath();
            for (let i = 0; i < 5; i++) {
              let angle = (i * Math.PI * 2) / 5;
              c.lineTo(Math.cos(angle) * 22, Math.sin(angle) * 22);
            }
            c.closePath();
            c.stroke();
            c.beginPath();
            for (let i = 0; i < 5; i++) {
              let angle = (i * Math.PI * 2) / 5;
              c.moveTo(0, 0);
              c.lineTo(Math.cos(angle) * 22, Math.sin(angle) * 22);
            }
            c.stroke();
          }
          c.restore();
          if (m.flashTimer === 0) {
            let eyePulse = 6 + Math.sin(Date.now() / 150) * 1.5;
            c.fillStyle = "#00b894";
            c.beginPath();
            c.arc(px, py, eyePulse, 0, Math.PI * 2);
            c.fill();
            c.strokeStyle = "#000000";
            c.lineWidth = 1.5;
            c.stroke();
            c.fillStyle = "#ff007f";
            c.fillRect(px - 1.2, py - 4, 2.4, 8);
          }
        }
      }
    }
    c.restore();
  };
  // --- MISSING DPS CALCULATOR ---
  window.calculateActiveDps = function () {
    const now = window.nowMs || Date.now();
    let startIdx = 0;
    // Scan forward in-place to calculate expired record counts
    while (
      startIdx < window.damageHistory.length &&
      now - window.damageHistory[startIdx].time > 3000
    ) {
      startIdx++;
    }
    if (startIdx > 0) {
      window.damageHistory.splice(0, startIdx);
    }
    if (window.damageHistory.length === 0) return "0.0";
    let totalDamage = 0;
    for (let i = 0; i < window.damageHistory.length; i++) {
      totalDamage += window.damageHistory[i].amount;
    }
    let avgDps = totalDamage / 3;
    return window.formatNumber(avgDps);
  };

  window.drawSingleHero = function (
    ctx,
    x,
    y,
    scale,
    equippedSlots,
    playerStats,
    bounce,
    options = {},
  ) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    const penHero = 1.8;
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = penHero;
    ctx.lineJoin = "round";

    let equipped = equippedSlots ? { ...equippedSlots } : {};
    let stats = playerStats || {};

    // Phase 4: Spectral Cosmetic Projection Interceptor
    if (stats.projectSpectralCosmetic && stats.activeSpectralResonance) {
      let resonance = stats.activeSpectralResonance;
      if (resonance === "weapon_staff") {
        equipped.weapon = {
          isUniqueStaff: true,
          type: "weapon",
          name: "Phoenix Ignition Staff",
        };
      } else if (resonance === "weapon_sword") {
        equipped.weapon = {
          isUniqueSword: true,
          type: "weapon",
          name: "Sanguine Reaver",
        };
      } else if (resonance === "weapon_singularity") {
        equipped.weapon = {
          isUniqueSingularity: true,
          type: "weapon",
          name: "Void-Sovereign Greatsword",
        };
      } else if (resonance === "weapon_maelstrom") {
        equipped.weapon = {
          isUniqueMaelstrom: true,
          type: "weapon",
          name: "Maelstrom Gale-Glaive",
        };
      } else if (resonance === "shield_aegis") {
        equipped.subweapon = {
          isUniqueAegis: true,
          type: "subweapon",
          subType: "shield",
          name: "Void-Warped Bulwark",
        };
      } else if (resonance === "tome_watch") {
        equipped.subweapon = {
          isUniqueWatch: true,
          type: "subweapon",
          subType: "tome",
          name: "Chronos Pocket-Watch",
        };
      } else if (resonance === "tome_chronicle") {
        equipped.subweapon = {
          isUniqueChronicle: true,
          type: "subweapon",
          subType: "tome",
          name: "Chronicle of past Lives",
        };
      } else if (resonance === "boots_warpcore") {
        equipped.boots = {
          isUniqueWarpCore: true,
          type: "boots",
          name: "Warp-Core Greaves",
        };
      } else if (resonance === "helmet_tempest") {
        equipped.helmet = {
          isUniqueTempest: true,
          type: "helmet",
          name: "Crown of Tempests",
        };
      }
    }

    // Custom visual skin color profiles for future cosmetic extensibility
    let skin = stats.cosmeticSkin || "default";
    let bodyColor = "#95a5a6";
    let armorColor = "#bdc3c7";
    let capeColor = "#c0392b";
    let eyeColor = stats.frenzyTimer > 0 ? "#f1c40f" : "#e74c3c";

    if (skin === "void") {
      bodyColor = "#2c1130";
      armorColor = "#510a74";
      capeColor = "#8e44ad";
    } else if (skin === "crimson") {
      bodyColor = "#1a0202";
      armorColor = "#960018";
      capeColor = "#111116";
    } else if (skin === "gilded") {
      bodyColor = "#ffd700";
      armorColor = "#b7950b";
      capeColor = "#111111";
    } else if (skin === "celestial") {
      bodyColor = "#0f172a";
      armorColor = "#00d2ff";
      capeColor = "#ffffff";
      eyeColor = "#00d2ff";
    }

    // Draw Subweapon
    if (equipped.subweapon) {
      const subType = equipped.subweapon.subType;
      let isAegis = equipped.subweapon.isUniqueAegis;
      let isWatch = equipped.subweapon.isUniqueWatch;
      let isChronicle = equipped.subweapon.isUniqueChronicle;

      if (subType === "shield") {
        ctx.save();
        ctx.translate(8, 4 + bounce);

        let shieldItem = equipped.subweapon;
        let noun =
          shieldItem && shieldItem.noun ? shieldItem.noun.toLowerCase() : "";
        let tierColor = window.getTierColor(
          shieldItem ? shieldItem.statsRolled : 0,
        );

        if (isAegis) {
          // --- UNIQUE: VOID-WARPED BULWARK ---
          ctx.fillStyle = "#25033c";
          ctx.beginPath();
          ctx.moveTo(-6, -8);
          ctx.lineTo(6, -8);
          ctx.lineTo(8, 0);
          ctx.lineTo(0, 10);
          ctx.lineTo(-8, 0);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = "#8e44ad";
          ctx.lineWidth = penHero + 0.5;
          ctx.stroke();

          ctx.strokeStyle = "#e84393";
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.moveTo(0, -6);
          ctx.lineTo(0, 6);
          ctx.moveTo(-5, 0);
          ctx.lineTo(5, 0);
          ctx.stroke();
        } else if (noun.includes("kite")) {
          // --- KITE SHIELD (Tall & Rounded Taper) ---
          ctx.fillStyle = "#7f8c8d";
          ctx.beginPath();
          ctx.moveTo(-5.5, -9);
          ctx.quadraticCurveTo(0, -11, 5.5, -9); // Curved top
          ctx.lineTo(7, -1);
          ctx.lineTo(0, 11); // Long pointer
          ctx.lineTo(-7, -1);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = "#000000";
          ctx.lineWidth = penHero + 0.5;
          ctx.stroke();

          // Central heraldry cross matching quality tier
          ctx.strokeStyle = tierColor;
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(0, -8.5);
          ctx.lineTo(0, 8);
          ctx.moveTo(-4.5, -1.5);
          ctx.lineTo(4.5, -1.5);
          ctx.stroke();
        } else if (noun.includes("tower")) {
          // --- TOWER SHIELD (Heavy Protective Rectangle) ---
          ctx.fillStyle = "#7f8c8d";
          ctx.beginPath();
          ctx.roundRect(-7, -9.5, 14, 19, [1.5]);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = "#000000";
          ctx.lineWidth = penHero + 0.5;
          ctx.stroke();

          // Inward border frame matching quality tier
          ctx.strokeStyle = tierColor;
          ctx.lineWidth = 1.0;
          ctx.beginPath();
          ctx.roundRect(-5, -7.5, 10, 15, [1]);
          ctx.stroke();

          // Central horizontal reinforcing band
          ctx.strokeStyle = "#1c1c1f";
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(-7, 0);
          ctx.lineTo(7, 0);
          ctx.stroke();
        } else if (noun.includes("buckler")) {
          // --- BUCKLER (Small Circular Shield) ---
          ctx.fillStyle = "#7f8c8d";
          ctx.beginPath();
          ctx.arc(0, 1, 9.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = "#000000";
          ctx.lineWidth = penHero + 0.5;
          ctx.stroke();

          // Quality indicator ring
          ctx.strokeStyle = tierColor;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(0, 1, 6.5, 0, Math.PI * 2);
          ctx.stroke();

          // Core steel boss center rivet
          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.arc(0, 1, 2.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = "#000000";
          ctx.lineWidth = 0.8;
          ctx.stroke();
        } else {
          // --- DEFAULT / HEATER SHIELD (The exact shape you love) ---
          ctx.fillStyle = "#7f8c8d";
          ctx.beginPath();
          ctx.moveTo(-6, -8);
          ctx.lineTo(6, -8);
          ctx.lineTo(8, 0);
          ctx.lineTo(0, 10);
          ctx.lineTo(-8, 0);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = "#000000";
          ctx.lineWidth = penHero + 0.5;
          ctx.stroke();

          // Draw inner quality-aligned framing border
          ctx.beginPath();
          ctx.moveTo(-4, -6.5);
          ctx.lineTo(4, -6.5);
          ctx.lineTo(5.5, -0.5);
          ctx.lineTo(0, 7.5);
          ctx.lineTo(-5.5, -0.5);
          ctx.closePath();
          ctx.strokeStyle = tierColor;
          ctx.lineWidth = 1.2;
          ctx.stroke();
        }

        ctx.restore();
        if (
          isAegis &&
          (!options.deathAnimationTimer || options.deathAnimationTimer === 0)
        ) {
          ctx.save();
          ctx.translate(8, 4 + bounce);
          let orbitTime = Date.now() / 250;
          ctx.fillStyle = "#110221";
          ctx.strokeStyle = "#8e44ad";
          ctx.lineWidth = 1.0;
          for (let i = 0; i < 2; i++) {
            let angle = orbitTime + i * Math.PI;
            let ox = Math.cos(angle) * 14;
            let oy = Math.sin(angle) * 6;
            ctx.beginPath();
            ctx.arc(ox, oy, 2.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
          }
          ctx.restore();
        }
      } else if (subType === "tome") {
        ctx.save();
        let tomeFloat = Math.sin(Date.now() / 200) * 5;
        ctx.translate(24, -6 + bounce + tomeFloat);
        ctx.rotate(-Math.PI / 12);
        if (isWatch) {
          ctx.fillStyle = "#d4af37";
          ctx.strokeStyle = "#000000";
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.arc(0, 0, 8, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = "#fdf6e2";
          ctx.beginPath();
          ctx.arc(0, 0, 5.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.strokeStyle = "#111";
          ctx.lineWidth = 1.2;
          let clockTime = Date.now() / 300;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(Math.cos(clockTime) * 4.5, Math.sin(clockTime) * 4.5);
          ctx.stroke();
        } else if (isChronicle) {
          ctx.fillStyle = "#111116";
          ctx.strokeStyle = "#f1c40f";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.roundRect(-5, -7, 10, 14, [1.5]);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = "#fff";
          ctx.fillRect(3.5, -6, 1.5, 12);
          let pulseRad = 12 + Math.sin(Date.now() / 150) * 2;
          ctx.strokeStyle = "rgba(241, 196, 15, 0.25)";
          ctx.lineWidth = 1.0;
          ctx.beginPath();
          ctx.arc(0, 0, pulseRad, 0, Math.PI * 2);
          ctx.stroke();
        } else {
          let tomeItem = equipped.subweapon;
          let noun =
            tomeItem && tomeItem.noun ? tomeItem.noun.toLowerCase() : "";
          let tierColor = window.getTierColor(
            tomeItem ? tomeItem.statsRolled : 0,
          );
          let rgbVals = window.hexToRgbValues
            ? window.hexToRgbValues(tierColor)
            : "155, 89, 182";

          // 1. Magical Rarity Glow Aura (Behind-the-book baseline)
          let auraRadius = 14 + Math.sin(Date.now() / 150) * 4;
          let auraGrad = ctx.createRadialGradient(0, -1, 1, 0, -1, auraRadius);
          auraGrad.addColorStop(0, `rgba(${rgbVals}, 0.65)`);
          auraGrad.addColorStop(0.5, `rgba(${rgbVals}, 0.2)`);
          auraGrad.addColorStop(1, `rgba(${rgbVals}, 0)`);
          ctx.fillStyle = auraGrad;
          ctx.beginPath();
          ctx.arc(0, -1, auraRadius, 0, Math.PI * 2);
          ctx.fill();

          // 1b. Locally scoped spark drawer helper
          let drawSingleSpark = (angle) => {
            let ox = Math.cos(angle) * 11;
            let oy = Math.sin(angle) * 4.5 - 1;
            ctx.fillStyle = "#ffffff";
            ctx.beginPath();
            ctx.arc(ox, oy, 1.0, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = tierColor;
            ctx.beginPath();
            ctx.arc(ox, oy, 2.5, 0, Math.PI * 2);
            ctx.fill();
          };

          // 1c. Orbiting Sparks PASS 1: DRAW BEHIND THE BOOK (Y Offset / sin(angle) < 0)
          let orbitTime = Date.now() / 350;
          for (let i = 0; i < 2; i++) {
            let angle = orbitTime + i * Math.PI;
            if (Math.sin(angle) < 0) {
              drawSingleSpark(angle);
            }
          }

          // 2. Resolve custom Book Cover styles
          let coverColor = "#8e44ad"; // Default magic purple
          if (noun.includes("grimoire"))
            coverColor = "#1b002a"; // Deep occult black
          else if (noun.includes("codex"))
            coverColor = "#784212"; // Antique brass/bronze
          else if (noun.includes("lexicon"))
            coverColor = "#1b4f72"; // Scholar blue
          else if (noun.includes("chronicle")) coverColor = "#4d1a00"; // Rustic relic leather

          ctx.fillStyle = coverColor;
          ctx.beginPath();
          ctx.roundRect(-6, -8, 12, 14, [1.5]);
          ctx.fill();
          ctx.strokeStyle = "#000000";
          ctx.lineWidth = penHero;
          ctx.stroke();

          // Draw book spine on left binding edge
          ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
          ctx.fillRect(-6, -8, 3, 14);

          // Draw paper edges on the right
          ctx.fillStyle = "#f5f5dc";
          ctx.beginPath();
          ctx.rect(4, -7, 1.5, 12);
          ctx.fill();
          ctx.stroke();

          // 3. Render detailed central cover glyphs
          ctx.save();
          if (noun.includes("grimoire")) {
            ctx.fillStyle = "#f1c40f";
            ctx.beginPath();
            ctx.arc(1, -1, 2.2, -Math.PI / 2, Math.PI / 2, false);
            ctx.quadraticCurveTo(2.0, -1, 1, -3.2);
            ctx.closePath();
            ctx.fill();
          } else if (noun.includes("codex")) {
            ctx.strokeStyle = "#bdc3c7";
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.arc(1, -1, 2, 0, Math.PI * 2);
            ctx.stroke();
            ctx.fillStyle = tierColor;
            ctx.beginPath();
            ctx.arc(1, -1, 1, 0, Math.PI * 2);
            ctx.fill();
          } else if (noun.includes("lexicon")) {
            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = 0.7;
            ctx.beginPath();
            ctx.ellipse(1, -1, 2.5, 1.3, 0, 0, Math.PI * 2);
            ctx.stroke();
            ctx.fillStyle = tierColor;
            ctx.beginPath();
            ctx.arc(1, -1, 0.8, 0, Math.PI * 2);
            ctx.fill();
          } else if (noun.includes("chronicle")) {
            ctx.fillStyle = "#f1c40f";
            ctx.beginPath();
            ctx.moveTo(-1, -3);
            ctx.lineTo(3, -3);
            ctx.lineTo(1, -1);
            ctx.lineTo(3, 1);
            ctx.lineTo(-1, 1);
            ctx.closePath();
            ctx.fill();
          } else {
            ctx.fillStyle = tierColor;
            ctx.beginPath();
            ctx.arc(1, -1, 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = "#000000";
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
          ctx.restore();

          // 1d. Orbiting Sparks PASS 2: DRAW IN FRONT OF THE BOOK (Y Offset / sin(angle) >= 0)
          for (let i = 0; i < 2; i++) {
            let angle = orbitTime + i * Math.PI;
            if (Math.sin(angle) >= 0) {
              drawSingleSpark(angle);
            }
          }
        }

        ctx.restore();
      } else if (subType === "dagger") {
        ctx.save();
        ctx.translate(8, 8 + bounce);
        ctx.rotate(Math.PI / 4);

        let dItem = equipped.subweapon;
        let noun = dItem && dItem.noun ? dItem.noun.toLowerCase() : "";
        let tierColor = window.getTierColor(dItem ? dItem.statsRolled : 0);

        // 1. Draw Hilt Grip & Core Pommel
        ctx.fillStyle = "#1c1c1f"; // Dark metallic hilt core
        ctx.beginPath();
        ctx.arc(0, 10, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 1.2;
        ctx.stroke();

        // Custom pommel core gem matching active tier color
        ctx.fillStyle = tierColor;
        ctx.beginPath();
        ctx.arc(0, 10, 1.2, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#5c3a21"; // Padded wood hilt
        ctx.beginPath();
        ctx.rect(-1.5, 3, 3, 7);
        ctx.fill();
        ctx.stroke();

        // 2. Resolve Custom Guards & Blades based on specific Dagger sub-class
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = penHero;

        if (noun.includes("kris")) {
          // Wavy Kris Flared Guard
          ctx.fillStyle = tierColor;
          ctx.beginPath();
          ctx.moveTo(-6, 3);
          ctx.lineTo(6, 3);
          ctx.lineTo(4, 5);
          ctx.lineTo(-4, 5);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Wavy/Serpentine Kris Blade
          ctx.fillStyle = "#7f8c8d";
          ctx.beginPath();
          ctx.moveTo(-2.5, 3);
          ctx.lineTo(-1.2, -1);
          ctx.lineTo(-2.2, -4.5);
          ctx.lineTo(-1.2, -8);
          ctx.lineTo(0, -13); // Sharp wavy tip
          ctx.lineTo(1.2, -8);
          ctx.lineTo(2.2, -4.5);
          ctx.lineTo(1.2, -1);
          ctx.lineTo(2.5, 3);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Light reflection highlight
          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.moveTo(0, 3);
          ctx.lineTo(0, -13);
          ctx.lineTo(1.2, -8);
          ctx.lineTo(2.2, -4.5);
          ctx.lineTo(1.2, -1);
          ctx.lineTo(2.5, 3);
          ctx.closePath();
          ctx.fill();
        } else if (noun.includes("baselard")) {
          // Broad cross H-guard
          ctx.fillStyle = tierColor;
          ctx.fillRect(-6, 1.5, 12, 2);
          ctx.strokeRect(-6, 1.5, 12, 2);
          // Secondary matching H-pommel
          ctx.fillRect(-5, 9, 10, 2);
          ctx.strokeRect(-5, 9, 10, 2);

          // Broad diamond-point blade
          ctx.fillStyle = "#7f8c8d";
          ctx.beginPath();
          ctx.moveTo(-3, 1.5);
          ctx.lineTo(0, -12); // tip
          ctx.lineTo(3, 1.5);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.moveTo(0, 1.5);
          ctx.lineTo(0, -12);
          ctx.lineTo(3, 1.5);
          ctx.closePath();
          ctx.fill();
        } else if (noun.includes("dirk")) {
          // Standard wide iron guard disc
          ctx.fillStyle = "#343a40";
          ctx.beginPath();
          ctx.ellipse(0, 3, 5, 1.5, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // Heavy single-edged wedge blade
          ctx.fillStyle = "#7f8c8d";
          ctx.beginPath();
          ctx.moveTo(-2.2, 3);
          ctx.lineTo(-2.2, -8); // Flat blunt back edge
          ctx.lineTo(0, -12); // Blade point
          ctx.lineTo(2.2, 3); // Curved cutting slope front
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.moveTo(0, 3);
          ctx.lineTo(0, -12);
          ctx.lineTo(2.2, 3);
          ctx.closePath();
          ctx.fill();
        } else if (noun.includes("main")) {
          // Main-Gauche Curved Parrying Guard
          ctx.strokeStyle = tierColor;
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(-7, 3);
          ctx.quadraticCurveTo(0, -1.5, 7, 3);
          ctx.stroke();
          // Finger protective basket loop
          ctx.beginPath();
          ctx.arc(0, 5.5, 3.5, 0, Math.PI);
          ctx.stroke();

          ctx.strokeStyle = "#000000";
          ctx.lineWidth = penHero;

          // Narrow stiletto needle blade
          ctx.fillStyle = "#7f8c8d";
          ctx.beginPath();
          ctx.moveTo(-1.8, 1.5);
          ctx.lineTo(0, -13);
          ctx.lineTo(1.8, 1.5);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.moveTo(0, 1.5);
          ctx.lineTo(0, -13);
          ctx.lineTo(1.8, 1.5);
          ctx.closePath();
          ctx.fill();
        } else {
          // Default Stiletto Needle structure
          ctx.fillStyle = tierColor; // Guard matching quality tier
          ctx.beginPath();
          ctx.moveTo(-8, 3);
          ctx.quadraticCurveTo(0, -2, 8, 3);
          ctx.quadraticCurveTo(0, 2, -8, 3);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Straight thin piercing blade
          ctx.fillStyle = "#7f8c8d";
          ctx.beginPath();
          ctx.moveTo(-2.2, 2.5);
          ctx.lineTo(0, -12);
          ctx.lineTo(2.2, 2.5);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.moveTo(0, 2.5);
          ctx.lineTo(0, -12);
          ctx.lineTo(2.2, 2.5);
          ctx.closePath();
          ctx.fill();
        }

        // 3. Emit dripping elemental particles from sheathed blade
        if (Math.random() < 0.2 && !window.isGamePaused && options.isMainHero) {
          let dRgb = window.hexToRgbValues
            ? window.hexToRgbValues(tierColor)
            : "142, 68, 173";
          window.particles.push({
            x: window.hero.x + 20,
            y: window.hero.y + 18 + bounce,
            vx: -window.randFloat(0.3, 0.8),
            vy: -window.randFloat(0.5, 1.2),
            radius: window.randFloat(1, 2.2),
            color: `rgba(${dRgb}, 0.65)`,
            alpha: 0.8,
            life: window.randInt(15, 30),
          });
        }

        ctx.restore();

        // 4. Rising elemental vapor matching equipped quality color!
        let dRgb = window.hexToRgbValues
          ? window.hexToRgbValues(tierColor)
          : "46, 204, 113";
        let mistCycle = (Date.now() / 150) % 6;
        ctx.fillStyle = `rgba(${dRgb}, ${0.55 - mistCycle / 12})`;
        ctx.beginPath();
        ctx.arc(0, -16 - mistCycle, 1.2 + mistCycle / 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    let costume = stats.equippedCostume || "knight";

    // Decoupled Multi-Axis Visual Render Matrix
    switch (costume) {
      case "shinobi":
        {
          let shinobiGiColor = skin === "default" ? "#15151c" : bodyColor;
          let shinobiMaskColor = skin === "default" ? "#0d0d10" : armorColor;
          let shinobiSashColor = skin === "default" ? "#3498db" : armorColor;
          let shinobiScarfColor = capeColor;
          let shinobiEyeColor = eyeColor;

          // 1. Single angled Katana Sheath on the Back (Classic 3/4 profile)
          ctx.save();
          ctx.strokeStyle = "#000000";
          ctx.lineWidth = penHero;
          ctx.lineJoin = "round";

          ctx.save();
          ctx.translate(-5, 2 + bounce);
          ctx.rotate(-Math.PI / 3.5); // Angled back-left
          ctx.fillStyle = "#111115"; // Black sheath
          ctx.fillRect(-2, -14, 4, 18);
          ctx.strokeRect(-2, -14, 4, 18);

          // Guard & Hilt
          ctx.fillStyle = "#d4af37"; // Golden guard
          ctx.fillRect(-4, -16, 8, 2.5);
          ctx.strokeRect(-4, -16, 8, 2.5);

          ctx.fillStyle = shinobiSashColor; // Wrapped hilt matching color accents
          ctx.fillRect(-2, -23, 4, 7);
          ctx.strokeRect(-2, -23, 4, 7);
          ctx.fillStyle = "#111";
          // Diamond wraps on hilt
          ctx.fillRect(-1, -21, 2, 2);
          ctx.fillRect(-1, -18, 2, 2);
          ctx.restore();
          ctx.restore();

          // 2. Flowing Scarf / Shinobi Ribbons (Procedural Inertia & Wind-Drag Lerping)
          ctx.save();
          ctx.strokeStyle = "#000000";
          ctx.lineWidth = penHero;
          ctx.fillStyle = shinobiScarfColor;
          ctx.lineJoin = "round";

          let isMoving =
            options.isMainHero && (!window.mob || !window.mob.isStopped);

          // Initialize or update persistent procedural weight on the character state object
          if (playerStats.scarfWeight === undefined) {
            try {
              playerStats.scarfWeight = 0.0;
            } catch (e) {
              playerStats = { ...playerStats, scarfWeight: 0.0 };
            }
          }

          let targetWeight = isMoving ? 1.0 : 0.0;
          try {
            playerStats.scarfWeight +=
              (targetWeight - playerStats.scarfWeight) * 0.12;
          } catch (e) {}
          let w = playerStats.scarfWeight || 0.0;

          // Query fully resolved movement speed dynamically (checking fast cache first)
          let resolvedSpeed = 10;
          if (window.cachedPlayerStats && window.cachedPlayerStats.moveSpeed) {
            resolvedSpeed = window.cachedPlayerStats.moveSpeed;
          } else if (typeof window.resolvePlayerStats === "function") {
            let rp = window.resolvePlayerStats();
            if (rp && rp.moveSpeed) resolvedSpeed = rp.moveSpeed;
          }

          // Dynamic wind-drag velocity ratio capped comfortably above target max
          let speedRatio = Math.min(1.2, resolvedSpeed / 500.0);

          // Variable wave frequency and tighter, rapid flutters at high speeds
          let waveFreq = 0.1 + speedRatio * 0.16;
          let ampY = Math.max(1.5, 4.0 - 2.5 * speedRatio);
          let ampX = 1.0 + 2.0 * speedRatio;

          let waveCycle = Date.now() * waveFreq;
          let flutterY1 = Math.sin(waveCycle / 12) * ampY;
          let flutterY2 = Math.cos(waveCycle / 15) * (ampY * 0.85);
          let flutterX = Math.cos(waveCycle / 12) * ampX;

          // Idle breathing waves (low-frequency, slow sag)
          let idleSway1 = Math.sin(Date.now() / 800) * 1.5;
          let idleSway2 = Math.cos(Date.now() / 1000) * 1.0;

          // --- TOP RIBBON TAIL INTERPOLATION ---
          let cpX1_idle = -12 + idleSway1;
          let cpY1_idle = 4 + bounce;
          let cpX1_run = -12 - 18 * speedRatio + flutterX;
          let cpY1_run = 4 - 6 * speedRatio + flutterY1 + bounce;

          let epX1_idle = -14 + idleSway1;
          let epY1_idle = 12 + idleSway2 + bounce;
          let epX1_run = -16 - 36 * speedRatio + flutterX * 1.5;
          let epY1_run = 8 - 10 * speedRatio + flutterY2 + bounce;

          // Blended control/end points
          let cpX1 = cpX1_idle + (cpX1_run - cpX1_idle) * w;
          let cpY1 = cpY1_idle + (cpY1_run - cpY1_idle) * w;
          let epX1 = epX1_idle + (epX1_run - epX1_idle) * w;
          let epY1 = epY1_idle + (epY1_run - epY1_idle) * w;

          // Draw Top Ribbon
          ctx.beginPath();
          ctx.moveTo(-6, -2 + bounce);
          ctx.quadraticCurveTo(cpX1, cpY1, epX1, epY1);
          ctx.lineTo(epX1 + 4 * (1 - w), epY1 + 2 * w);
          ctx.quadraticCurveTo(cpX1 + 4, cpY1 + 4, -6, 2 + bounce);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // --- BOTTOM RIBBON TAIL INTERPOLATION ---
          let cpX2_idle = -10 + idleSway2;
          let cpY2_idle = 10 + bounce;
          let cpX2_run = -10 - 16 * speedRatio - flutterX;
          let cpY2_run = 10 - 8 * speedRatio - flutterY1 + bounce;

          let epX2_idle = -11 + idleSway2;
          let epY2_idle = 24 + idleSway1 + bounce;
          let epX2_run = -14 - 34 * speedRatio - flutterX * 1.5;
          let epY2_run = 18 - 16 * speedRatio - flutterY2 + bounce;

          // Blended control/end points
          let cpX2 = cpX2_idle + (cpX2_run - cpX2_idle) * w;
          let cpY2 = cpY2_idle + (cpY2_run - cpY2_idle) * w;
          let epX2 = epX2_idle + (epX2_run - epX2_idle) * w;
          let epY2 = epY2_idle + (epY2_run - epY2_idle) * w;

          // Draw Bottom Ribbon
          ctx.beginPath();
          ctx.moveTo(-6, 2 + bounce);
          ctx.quadraticCurveTo(cpX2, cpY2, epX2, epY2);
          ctx.lineTo(epX2 + 4 * (1 - w), epY2 + 2 * w);
          ctx.quadraticCurveTo(cpX2 + 4, cpY2 + 4, -6, 5 + bounce);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          ctx.restore();

          // 3. Side-Profile Stealth Gi (Body)
          ctx.fillStyle = shinobiGiColor;
          ctx.beginPath();
          ctx.rect(-8, bounce, 14, 16); // Centered body box
          ctx.fill();
          ctx.stroke();

          // Crossed Gi collar lapels (facing right, so front overlap slopes from left down to right)
          ctx.strokeStyle = "#000000";
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.moveTo(-8, bounce);
          ctx.lineTo(2, 9 + bounce);
          ctx.moveTo(3, bounce);
          ctx.lineTo(-3, 11 + bounce);
          ctx.stroke();

          // 4. Sash Belt with Back-Flowing Ties
          ctx.fillStyle = shinobiSashColor;
          ctx.strokeStyle = "#000000";
          ctx.lineWidth = penHero;
          ctx.beginPath();
          ctx.rect(-9, 7 + bounce, 15, 3.5);
          ctx.fill();
          ctx.stroke();

          // Belt ribbons flowing back-left
          ctx.save();
          ctx.fillStyle = shinobiSashColor;
          ctx.translate(-8, 9 + bounce);
          ctx.rotate(-Math.PI / 6 + Math.sin(Date.now() / 100) * 0.12);
          ctx.beginPath();
          ctx.rect(-1.5, 0, 3, 11);
          ctx.fill();
          ctx.stroke();
          ctx.restore();

          // 5. Right-Facing Masked Hood (Head)
          ctx.fillStyle = shinobiGiColor;
          ctx.beginPath();
          // Left-weighted round hood representing head looking right
          ctx.roundRect(-10, -14 + bounce, 18, 16, [6, 4, 4, 6]);
          ctx.fill();
          ctx.stroke();

          // Face Opening (Slit offset to the right, showing right-facing orientation)
          ctx.fillStyle = shinobiMaskColor;
          ctx.beginPath();
          ctx.roundRect(-2, -11 + bounce, 9, 6, [2]);
          ctx.fill();
          ctx.stroke();

          // Forehead Protector Plate (Headband / Hitai-ate tilted right)
          ctx.fillStyle = "#7f8c8d";
          ctx.beginPath();
          ctx.rect(-7, -14 + bounce, 12, 3);
          ctx.fill();
          ctx.stroke();

          // Headband ties blowing back-left
          ctx.save();
          ctx.strokeStyle = "#000000";
          ctx.lineWidth = 1.5;
          ctx.fillStyle = shinobiGiColor;
          ctx.translate(-10, -12 + bounce);
          ctx.rotate(-Math.PI / 4 + Math.sin(Date.now() / 90) * 0.15);
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(-8, -2);
          ctx.lineTo(-6, 2);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          ctx.restore();

          // 6. Single Focused, Intense Glowing Eye looking right
          ctx.fillStyle = shinobiEyeColor;
          ctx.shadowBlur = 8;
          ctx.shadowColor = shinobiEyeColor;
          ctx.beginPath();
          // Tilted focused single ninja eye slot
          ctx.moveTo(1, -9 + bounce);
          ctx.lineTo(5, -9 + bounce);
          ctx.lineTo(4, -7.5 + bounce);
          ctx.lineTo(1.5, -8 + bounce);
          ctx.closePath();
          ctx.fill();
          ctx.shadowBlur = 0;
        }
        break;

      case "archmage":
        {
          // Recolor default skin robes to a gorgeous high-fantasy purple/gold/crimson theme
          let robeColor = skin === "default" ? "#34225c" : bodyColor;
          let trimColor = skin === "default" ? "#f1c40f" : armorColor;
          let sashColor = skin === "default" ? "#e74c3c" : capeColor;

          // 1. High Sorcerer Collar (frames the back of the neck)
          ctx.fillStyle = sashColor;
          ctx.beginPath();
          ctx.moveTo(-10, bounce - 4);
          ctx.quadraticCurveTo(-14, bounce - 18, -11, bounce - 14); // collar peak back-left
          ctx.lineTo(-4, bounce - 10);
          ctx.lineTo(2, bounce - 4);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Flowing Back Cape (sweeps back-left with motion drag)
          ctx.fillStyle = robeColor;
          ctx.beginPath();
          ctx.moveTo(-6, bounce);
          ctx.quadraticCurveTo(-16, 10 + bounce, -18, 16 + bounce);
          ctx.lineTo(-6, 16 + bounce);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // 2. Main Robe Torso (canted for a right-facing posture)
          ctx.fillStyle = robeColor;
          ctx.beginPath();
          ctx.moveTo(-8, bounce);
          ctx.lineTo(-12, 16 + bounce);
          ctx.lineTo(6, 16 + bounce);
          ctx.lineTo(5, bounce);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Flared casting sleeves
          ctx.fillStyle = robeColor;
          ctx.beginPath();
          ctx.moveTo(-7, bounce);
          ctx.lineTo(-13, 8 + bounce);
          ctx.lineTo(-7, 10 + bounce);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          ctx.beginPath();
          ctx.moveTo(5, bounce);
          ctx.lineTo(11, 8 + bounce);
          ctx.lineTo(5, 10 + bounce);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Crossed Robe Lapels & Gold Trim down front overlap
          ctx.strokeStyle = "#000000";
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.moveTo(-8, bounce);
          ctx.lineTo(4, 9 + bounce);
          ctx.stroke();

          ctx.fillStyle = trimColor;
          ctx.beginPath();
          ctx.moveTo(-2, bounce);
          ctx.lineTo(4, 9 + bounce);
          ctx.lineTo(1, 11 + bounce);
          ctx.lineTo(-5, bounce);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          ctx.lineWidth = penHero;

          // 3. Ornate Sash Belt & Back-flowing ribbon (wind-drag)
          ctx.fillStyle = sashColor;
          ctx.beginPath();
          ctx.rect(-9, 8 + bounce, 15, 3.5);
          ctx.fill();
          ctx.stroke();

          ctx.save();
          ctx.fillStyle = sashColor;
          ctx.translate(-9, 10 + bounce);
          ctx.rotate(Math.PI / 12 + Math.sin(Date.now() / 120) * 0.1); // sweeps back-left
          ctx.beginPath();
          ctx.rect(-2, 0, 4, 11);
          ctx.fill();
          ctx.stroke();
          ctx.restore();

          // Glowing chest crystal amulet
          ctx.fillStyle = "#00d2ff";
          ctx.shadowBlur = 8;
          ctx.shadowColor = "#00d2ff";
          ctx.beginPath();
          ctx.moveTo(-1, 2 + bounce);
          ctx.lineTo(1.5, 4 + bounce);
          ctx.lineTo(-1, 6 + bounce);
          ctx.lineTo(-3.5, 4 + bounce);
          ctx.closePath();
          ctx.fill();
          ctx.shadowBlur = 0;
          ctx.strokeStyle = "#000000";
          ctx.lineWidth = 1;
          ctx.stroke();

          ctx.strokeStyle = "#000000";
          ctx.lineWidth = penHero;

          // 4. Majestic Flowing White Beard (Blowing backwards/left from right-facing chin)
          ctx.fillStyle = "#f8fafc";
          ctx.beginPath();
          ctx.moveTo(3, -4 + bounce); // originates at chin
          ctx.bezierCurveTo(-1, 2 + bounce, -12, 1 + bounce, -14, 8 + bounce); // flows left
          ctx.quadraticCurveTo(-15, 12 + bounce, -12, 13 + bounce); // tail curl
          ctx.bezierCurveTo(-9, 10 + bounce, -2, 6 + bounce, 2, 2 + bounce); // returns
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Beard combed texture highlights
          ctx.strokeStyle = "#cbd5e1";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(1, -2 + bounce);
          ctx.quadraticCurveTo(-3, 3 + bounce, -10, 8 + bounce);
          ctx.moveTo(2, 0 + bounce);
          ctx.quadraticCurveTo(-1, 5 + bounce, -6, 9 + bounce);
          ctx.stroke();

          ctx.strokeStyle = "#000000";
          ctx.lineWidth = penHero;

          // 5. Hood Cowl Base (Open to the right, rounded to the back-left)
          ctx.fillStyle = robeColor;
          ctx.beginPath();
          ctx.roundRect(-9, -15 + bounce, 16, 16, [8, 2, 2, 8]);
          ctx.fill();
          ctx.stroke();

          // Cowl Interior Deep Arcane Shadow
          ctx.fillStyle = "#111116";
          ctx.beginPath();
          ctx.roundRect(-2, -13 + bounce, 8, 12, [2, 6, 6, 2]);
          ctx.fill();
          ctx.stroke();

          // 6. Angled Ornate Wizard Hat Brim
          ctx.save();
          ctx.translate(-1, -15 + bounce);
          ctx.rotate(Math.PI / 18); // Tilted forward slightly
          ctx.fillStyle = robeColor;
          ctx.beginPath();
          ctx.ellipse(0, 0, 13, 2.5, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.restore();

          // Curved Pointy Hat Cone (Curving backwards/left)
          ctx.fillStyle = robeColor;
          ctx.beginPath();
          ctx.moveTo(-10, -15 + bounce);
          ctx.bezierCurveTo(
            -15,
            -24 + bounce,
            -16,
            -30 + bounce,
            -14,
            -36 + bounce,
          ); // curved slouch tip
          ctx.quadraticCurveTo(-10, -32 + bounce, 7, -15 + bounce); // right side slant down
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Gilded Hat Band
          ctx.fillStyle = sashColor;
          ctx.beginPath();
          ctx.moveTo(-10, -15 + bounce);
          ctx.lineTo(-12, -18 + bounce);
          ctx.lineTo(6, -17 + bounce);
          ctx.lineTo(7, -15 + bounce);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Golden Hat Buckle
          ctx.fillStyle = trimColor;
          ctx.beginPath();
          ctx.rect(-3, -19 + bounce, 5, 4);
          ctx.fill();
          ctx.stroke();

          // 7. Arcane Glowing Eye (Peering right from deep shadow)
          ctx.fillStyle = "#00e5ff";
          ctx.shadowBlur = 8;
          ctx.shadowColor = "#00e5ff";
          ctx.beginPath();
          ctx.moveTo(1, -9 + bounce);
          ctx.lineTo(4.5, -9 + bounce);
          ctx.lineTo(3.5, -7.5 + bounce);
          ctx.lineTo(1.5, -8 + bounce);
          ctx.closePath();
          ctx.fill();

          // 8. Floating Orb/Runic Sparks (Orbiting behind shoulders)
          let cycle = Date.now() / 250;
          let runeX = -16 + Math.sin(cycle) * 2;
          let runeY = -4 + Math.cos(cycle) * 3 + bounce;
          ctx.fillStyle = "#00e5ff";
          ctx.shadowColor = "#00e5ff";
          ctx.beginPath();
          ctx.moveTo(runeX, runeY - 3);
          ctx.lineTo(runeX + 2, runeY);
          ctx.lineTo(runeX, runeY + 3);
          ctx.lineTo(runeX - 2, runeY);
          ctx.closePath();
          ctx.fill();

          let runeX2 = -12 + Math.cos(cycle + 2) * 1.5;
          let runeY2 = -12 + Math.sin(cycle + 2) * 2 + bounce;
          ctx.fillStyle = "#9b59b6";
          ctx.shadowColor = "#9b59b6";
          ctx.beginPath();
          ctx.moveTo(runeX2, runeY2 - 2);
          ctx.lineTo(runeX2 + 1.5, runeY2);
          ctx.lineTo(runeX2, runeY2 + 2);
          ctx.lineTo(runeX2 - 1.5, runeY2);
          ctx.closePath();
          ctx.fill();

          ctx.shadowBlur = 0; // reset
        }
        break;

      case "cyber":
        {
          // Localized color mapping for sleek cybernetic default elements
          let suitColor = skin === "default" ? "#0f172a" : bodyColor; // Sleek carbon slate-black
          let plateColor = skin === "default" ? "#1e293b" : armorColor; // Steel panel grey
          let neonColor = skin === "default" ? "#00f0ff" : eyeColor; // Luminescent neon cyan

          // 1. Active Jetpack Thruster & Exhaust Plume (Streams back-left)
          ctx.fillStyle = plateColor;
          ctx.beginPath();
          ctx.roundRect(-12, 1 + bounce, 5, 10, [2]);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = "#111827";
          ctx.save();
          ctx.translate(-11, 6 + bounce);
          ctx.rotate(Math.PI / 6); // Angled down-left
          ctx.beginPath();
          ctx.moveTo(0, -3.5);
          ctx.lineTo(-4, -5);
          ctx.lineTo(-4, 5);
          ctx.lineTo(0, 3.5);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Pulsating glowing plasma plume
          let plumeCycle = Date.now() / 60;
          let plumeLength = 12 + Math.sin(plumeCycle) * 3;
          ctx.fillStyle = neonColor;
          ctx.shadowBlur = 10;
          ctx.shadowColor = neonColor;
          ctx.beginPath();
          ctx.moveTo(-4, -3);
          ctx.quadraticCurveTo(
            -4 - plumeLength * 0.6,
            -1 + Math.cos(plumeCycle) * 1.5,
            -4 - plumeLength,
            0,
          );
          ctx.quadraticCurveTo(
            -4 - plumeLength * 0.6,
            1 + Math.cos(plumeCycle) * 1.5,
            -4,
            3,
          );
          ctx.closePath();
          ctx.fill();
          ctx.shadowBlur = 0; // reset
          ctx.restore();

          // 2. Sleek Carbon Torso & Limb Plating
          ctx.fillStyle = suitColor;
          ctx.beginPath();
          ctx.rect(-8, bounce, 14, 16);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = plateColor;
          ctx.beginPath();
          ctx.moveTo(-7, bounce);
          ctx.lineTo(-9, 14 + bounce);
          ctx.lineTo(5, 14 + bounce);
          ctx.lineTo(5, bounce);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // High-tech shoulder guard pauldrons
          ctx.fillStyle = suitColor;
          ctx.beginPath();
          ctx.roundRect(-9, bounce - 2, 4, 6, [1.5]);
          ctx.roundRect(4, bounce - 2, 4, 6, [1.5]);
          ctx.fill();
          ctx.stroke();

          // 3. Neon Grid Circuit Pipes
          ctx.strokeStyle = neonColor;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(-4, 2 + bounce);
          ctx.lineTo(-4, 11 + bounce);
          ctx.lineTo(2, 11 + bounce);
          ctx.moveTo(0, 5 + bounce);
          ctx.lineTo(4, 5 + bounce);
          ctx.stroke();

          ctx.strokeStyle = "#000000";
          ctx.lineWidth = penHero;

          // 4. Pulsating Chest Arc Reactor Core
          let corePulse = 2.4 + Math.sin(Date.now() / 150) * 0.8;
          ctx.fillStyle = "#ffffff"; // pure white core
          ctx.strokeStyle = neonColor;
          ctx.lineWidth = 1.5;
          ctx.shadowBlur = 8;
          ctx.shadowColor = neonColor;
          ctx.beginPath();
          ctx.arc(2, 6 + bounce, corePulse, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.shadowBlur = 0; // reset

          ctx.strokeStyle = "#000000";
          ctx.lineWidth = penHero;

          // 5. Sleek Right-Facing Aerodynamic Helmet
          ctx.fillStyle = suitColor;
          ctx.beginPath();
          ctx.moveTo(-10, -14 + bounce);
          ctx.quadraticCurveTo(-11, -16 + bounce, -8, -16 + bounce); // round back
          ctx.lineTo(4, -14 + bounce); // sleek top
          ctx.quadraticCurveTo(8, -12 + bounce, 7, -5 + bounce); // front jaw curve
          ctx.lineTo(3, 1 + bounce); // chin
          ctx.lineTo(-7, 1 + bounce); // neck seal
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Ear-Com Node & Antenna on the back-left
          ctx.fillStyle = plateColor;
          ctx.beginPath();
          ctx.arc(-8, -7 + bounce, 3, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          ctx.strokeStyle = neonColor;
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(-8, -7 + bounce);
          ctx.lineTo(-12, -15 + bounce); // angled antenna
          ctx.stroke();

          ctx.fillStyle = neonColor;
          ctx.beginPath();
          ctx.arc(-12, -15 + bounce, 1, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = "#000000";
          ctx.lineWidth = penHero;

          // 6. Streamlined Glowing Visor (Facing Right)
          ctx.fillStyle = neonColor;
          ctx.shadowBlur = 10;
          ctx.shadowColor = neonColor;
          ctx.beginPath();
          ctx.moveTo(-2, -11 + bounce);
          ctx.lineTo(4, -11 + bounce);
          ctx.quadraticCurveTo(7.5, -9 + bounce, 6.5, -5 + bounce); // sleek curved visor front
          ctx.lineTo(2, -5 + bounce);
          ctx.closePath();
          ctx.fill();
          ctx.shadowBlur = 0; // reset
          ctx.strokeStyle = "#000000";
          ctx.lineWidth = 1;
          ctx.stroke();

          ctx.strokeStyle = "#000000";
          ctx.lineWidth = penHero;

          // 7. Floating Holographic HUD target reticle in front of visor
          let hudTime = Date.now() / 500;
          let hudX = 13;
          let hudY = -7 + bounce;
          ctx.strokeStyle = "rgba(0, 240, 255, 0.45)"; // Translucent holographic cyan
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(hudX, hudY, 5, 0, Math.PI * 2);
          ctx.stroke();

          // Crosshair ticks
          ctx.beginPath();
          ctx.moveTo(hudX - 7, hudY);
          ctx.lineTo(hudX - 5, hudY);
          ctx.moveTo(hudX + 5, hudY);
          ctx.lineTo(hudX + 7, hudY);
          ctx.moveTo(hudX, hudY - 7);
          ctx.lineTo(hudX, hudY - 5);
          ctx.moveTo(hudX, hudY + 5);
          ctx.lineTo(hudX, hudY + 7);
          ctx.stroke();
        }
        break;

      case "jackolantern":
        {
          // Localized color mapping for organic seasonal elements
          let pumpkinColor = skin === "default" ? "#e67e22" : bodyColor; // Pumpkin Orange
          let leafColor1 = skin === "default" ? "#c0392b" : capeColor; // Maple Red
          let leafColor2 = skin === "default" ? "#d35400" : armorColor; // Oak Orange
          let stemColor = skin === "default" ? "#27ae60" : capeColor; // Mossy green stem
          let glowColor = skin === "default" ? "#ff9f43" : eyeColor; // Inside candle flame glow (flame tint)

          // Dynamic wind/motion billow values
          let capeSway = Math.sin(Date.now() / 150) * 3;

          // 1. Layered Back-flowing Autumn Leaf Cape (sweeps and billows left)
          ctx.fillStyle = leafColor1;
          ctx.beginPath();
          ctx.moveTo(-6, bounce);
          ctx.quadraticCurveTo(
            -15 + capeSway * 0.5,
            6 + bounce,
            -17 + capeSway,
            16 + bounce,
          );
          ctx.lineTo(-4, 16 + bounce);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Overlapping secondary leaf layer
          ctx.fillStyle = leafColor2;
          ctx.beginPath();
          ctx.moveTo(-4, bounce + 2);
          ctx.quadraticCurveTo(
            -11 + capeSway * 0.4,
            10 + bounce,
            -13 + capeSway * 0.8,
            16 + bounce,
          );
          ctx.lineTo(-2, 16 + bounce);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Leaf vein serrations waving in the wind
          ctx.strokeStyle = "#000000";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(-17 + capeSway, 16 + bounce);
          ctx.lineTo(-14 + capeSway * 0.7, 13 + bounce);
          ctx.lineTo(-13 + capeSway * 0.8, 16 + bounce);
          ctx.lineTo(-9 + capeSway * 0.5, 12 + bounce);
          ctx.stroke();

          ctx.strokeStyle = "#000000";
          ctx.lineWidth = penHero;

          // 2. Vine-Woven Spooky Chestplate & Pauldrons
          ctx.fillStyle = "#1e130c"; // Dark earthy under-girth
          ctx.beginPath();
          ctx.rect(-8, bounce, 14, 16);
          ctx.fill();
          ctx.stroke();

          // Intersecting thorny branches
          ctx.strokeStyle = "#5c3a21";
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(-6, 2 + bounce);
          ctx.lineTo(4, 14 + bounce);
          ctx.moveTo(4, 2 + bounce);
          ctx.lineTo(-6, 14 + bounce);
          ctx.moveTo(-7, 8 + bounce);
          ctx.lineTo(5, 8 + bounce);
          ctx.stroke();

          // Internal Magma cracks
          ctx.strokeStyle = glowColor;
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(-4, 4 + bounce);
          ctx.lineTo(2, 10 + bounce);
          ctx.stroke();

          ctx.strokeStyle = "#000000";
          ctx.lineWidth = penHero;

          // Leaf tattered shoulder guards
          ctx.fillStyle = leafColor2;
          ctx.beginPath();
          ctx.roundRect(-10, bounce - 2, 4, 5, [1]);
          ctx.roundRect(4, bounce - 2, 4, 5, [1]);
          ctx.fill();
          ctx.stroke();

          // 3. Swirling Autumn Leaf Orbit (Swirls around feet in 3D perspective!)
          for (let i = 0; i < 3; i++) {
            let leafT =
              (Date.now() / 1000 + i * ((Math.PI * 2) / 3)) % (Math.PI * 2);
            let lx = Math.cos(leafT) * 12;
            let ly = 16 + Math.sin(leafT) * 3 + bounce;
            ctx.fillStyle = i % 2 === 0 ? leafColor1 : leafColor2;
            ctx.save();
            ctx.translate(lx, ly);
            ctx.rotate(leafT * 2.5);
            ctx.beginPath();
            ctx.ellipse(0, 0, 3, 1.3, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            ctx.restore();
          }

          // 4. Ribbed Pumpkin Head with Rotational Breathing Wobble
          let pX = -1;
          let pY = -7 + bounce;
          let pRad = 11.0; // Slightly scaled up for a more epic "pumpkin head" presence!

          let headWobble = Math.sin(Date.now() / 180) * 0.05;

          ctx.save();
          ctx.translate(pX, pY);
          ctx.rotate(headWobble);

          // Base Pumpkin sphere
          ctx.fillStyle = pumpkinColor;
          ctx.beginPath();
          ctx.arc(0, 0, pRad, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // Spherical ribs wrap (creates 3D volume facing right)
          ctx.strokeStyle = "rgba(0, 0, 0, 0.22)";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.ellipse(0, 0, pRad * 0.7, pRad, 0, 0, Math.PI * 2);
          ctx.stroke();
          ctx.beginPath();
          ctx.ellipse(0, 0, pRad * 0.35, pRad, 0, 0, Math.PI * 2);
          ctx.stroke();

          ctx.strokeStyle = "#000000";
          ctx.lineWidth = penHero;

          // Curly Green Stem (Sways back-left based on head rotation)
          let stemSway = Math.sin(Date.now() / 140) * 0.15;
          ctx.save();
          ctx.translate(0, -pRad);
          ctx.rotate(stemSway - Math.PI / 8);
          ctx.strokeStyle = stemColor;
          ctx.lineWidth = 2.8;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.quadraticCurveTo(-3, -6, -5, -4);
          ctx.stroke();
          ctx.restore();

          ctx.strokeStyle = "#000000";
          ctx.lineWidth = penHero;

          // 5. Carved Face with Real-Time Candle Flicker
          let candleFlicker = 0.85 + Math.sin(Date.now() / 60) * 0.15;
          ctx.fillStyle = glowColor;
          ctx.shadowBlur = 10 * candleFlicker;
          ctx.shadowColor = glowColor;

          // Slanted sinister single eye
          ctx.beginPath();
          ctx.moveTo(2, -3);
          ctx.lineTo(7, -3);
          ctx.lineTo(5, 0.5);
          ctx.closePath();
          ctx.fill();

          // Toothy grin curving upwards to the right
          ctx.beginPath();
          ctx.moveTo(-2, 2.5);
          ctx.lineTo(1, 5.5);
          ctx.lineTo(3, 3.5);
          ctx.lineTo(6, 6.5);
          ctx.lineTo(8, 1.5); // smile tip curves up
          ctx.lineTo(5, 3.5);
          ctx.lineTo(3, 1.5);
          ctx.lineTo(1, 3.5);
          ctx.closePath();
          ctx.fill();
          ctx.shadowBlur = 0; // reset

          // Deep black bevel outlines inside carved sections for high contrast
          ctx.strokeStyle = "#000000";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(2, -3);
          ctx.lineTo(7, -3);
          ctx.lineTo(5, 0.5);
          ctx.closePath();
          ctx.stroke();

          ctx.beginPath();
          ctx.moveTo(-2, 2.5);
          ctx.lineTo(1, 5.5);
          ctx.lineTo(3, 3.5);
          ctx.lineTo(6, 6.5);
          ctx.lineTo(8, 1.5);
          ctx.lineTo(5, 3.5);
          ctx.lineTo(3, 1.5);
          ctx.lineTo(1, 3.5);
          ctx.closePath();
          ctx.stroke();

          ctx.restore(); // Restore head transform matrix

          ctx.strokeStyle = "#000000";
          ctx.lineWidth = penHero;

          // 6. Zero-Allocation Deterministic Drifting Embers (drifts back-left and rises!)
          for (let i = 0; i < 4; i++) {
            let seed = Math.sin(i * 123.45);
            let t = (Date.now() / 1100 + seed * 5) % 1.0; // normalised 0 to 1 loop over 1.1s
            let sparkX = pX - 2 - t * 18 + Math.sin(t * Math.PI * 2) * 2;
            let sparkY = pY - pRad + 2 - t * 22 + bounce;
            let alpha = 1.0 - t;
            ctx.fillStyle = `rgba(230, 126, 34, ${alpha * 0.85})`;
            ctx.fillRect(sparkX, sparkY, 1.5, 1.5);
          }
        }
        break;

      case "santashelper":
        {
          let coatColor = skin === "default" ? "#d63031" : capeColor;
          let coatShadow = skin === "default" ? "#962d22" : bodyColor;
          let trimColor = "#ffffff"; // Fluffy white fur trim stays snow-white
          let goldColor = skin === "default" ? "#f1c40f" : armorColor;
          let leatherColor = "#2d3436"; // Charcoal leather belt
          let skinColor = "#ffddca"; // Healthy holiday skin
          let beardColor = "#ffffff"; // Pure white beard
          let beardShadow = "#cbd5e1"; // Beard shading depth

          // --- MOVEMENT & DIRECTION LERPING ---
          let isMoving =
            options.isMainHero && (!window.mob || !window.mob.isStopped);
          let stats = playerStats || window.playerStats || {};

          if (stats.santaSackSway === undefined) {
            stats.santaSackSway = 0;
          }
          let targetSway = isMoving ? 1.0 : 0.0;
          stats.santaSackSway += (targetSway - stats.santaSackSway) * 0.1;
          let swayWeight = stats.santaSackSway || 0;

          let time = Date.now();
          let capeSway = Math.sin(time / 130) * (1.8 + swayWeight * 2.5);
          let windFlutter = Math.sin(time / 90) * (0.5 + swayWeight * 1.5);

          // 1. ROYAL VELVET CLOAK (OVERLAPPING LAYERS & PROCEDURAL FLUTTER)
          ctx.save();
          ctx.strokeStyle = "#000000";
          ctx.lineWidth = penHero;
          ctx.lineJoin = "round";

          // Back shadow cape layer
          ctx.fillStyle = coatShadow;
          ctx.beginPath();
          ctx.moveTo(-7, bounce);
          ctx.quadraticCurveTo(
            -15 + capeSway * 0.5,
            6 + bounce,
            -20 + capeSway + windFlutter,
            16 + bounce,
          );
          ctx.lineTo(-4, 16 + bounce);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Main bright velvet cape layer
          ctx.fillStyle = coatColor;
          ctx.beginPath();
          ctx.moveTo(-6, bounce);
          ctx.quadraticCurveTo(
            -12 + capeSway * 0.4,
            7 + bounce,
            -17 + capeSway,
            15.5 + bounce,
          );
          ctx.lineTo(-2, 15.5 + bounce);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Shimmering golden border
          ctx.strokeStyle = goldColor;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(-5, 1 + bounce);
          ctx.quadraticCurveTo(
            -11 + capeSway * 0.4,
            7.5 + bounce,
            -15.5 + capeSway,
            14.5 + bounce,
          );
          ctx.stroke();

          // Reset line width
          ctx.strokeStyle = "#000000";
          ctx.lineWidth = penHero;

          // Soft fluffy white trim on Cape Bottom
          ctx.fillStyle = trimColor;
          ctx.beginPath();
          let hemX = -17 + capeSway;
          let hemY = 15.5 + bounce;
          ctx.ellipse(hemX, hemY, 4, 2, 0, 0, Math.PI * 2);
          ctx.ellipse(hemX + 3, hemY + 0.5, 3.5, 1.8, 0, 0, Math.PI * 2);
          ctx.ellipse(hemX + 6.5, hemY + 0.8, 3.2, 1.5, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.restore();

          // 2. GIANT BURLAP TOY/SOUL SACK (SLUNG BACK-LEFT)
          ctx.save();
          ctx.strokeStyle = "#000000";
          ctx.lineWidth = penHero;
          ctx.lineJoin = "round";

          let sackX = -12 - swayWeight * 2;
          let sackY = 5 + bounce;
          ctx.translate(sackX, sackY);
          ctx.rotate(-Math.PI / 10 + Math.sin(time / 200) * 0.05);

          // Draw Sack Shadow Backing
          ctx.fillStyle = "#6f4e37"; // Deep burlap brown shadow
          ctx.beginPath();
          ctx.ellipse(0, 0, 9, 8, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // Main Sack Body
          let sackGrad = ctx.createRadialGradient(-3, -3, 1, 0, 0, 8.5);
          sackGrad.addColorStop(0, "#a05a2c");
          sackGrad.addColorStop(1, "#7d471b");
          ctx.fillStyle = sackGrad;
          ctx.beginPath();
          ctx.ellipse(0, 0, 8.5, 7.5, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // Green holiday patch with tiny stitches
          ctx.fillStyle = "#27ae60";
          ctx.beginPath();
          ctx.rect(-3, -5, 4.5, 4.5);
          ctx.fill();
          ctx.stroke();
          ctx.strokeStyle = "#000";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(-3, -5);
          ctx.lineTo(-3, -0.5);
          ctx.moveTo(1.5, -5);
          ctx.lineTo(1.5, -0.5);
          ctx.moveTo(-3, -5);
          ctx.lineTo(1.5, -5);
          ctx.moveTo(-3, -0.5);
          ctx.lineTo(1.5, -0.5);
          ctx.stroke();

          // Golden ropes binding the sack mouth
          ctx.strokeStyle = goldColor;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(4, -3, 4, Math.PI * 0.6, Math.PI * 1.5);
          ctx.stroke();

          // Golden tie knot
          ctx.fillStyle = goldColor;
          ctx.strokeStyle = "#000";
          ctx.lineWidth = penHero;
          ctx.beginPath();
          ctx.ellipse(4.5, -3, 2, 1.2, Math.PI / 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.restore();

          // 3. COZY CRIMSON SANTA COAT & BELT (BODY)
          ctx.save();
          ctx.strokeStyle = "#000000";
          ctx.lineWidth = penHero;
          ctx.lineJoin = "round";

          // Main coat block
          ctx.fillStyle = coatColor;
          ctx.beginPath();
          ctx.rect(-8, bounce, 14, 16);
          ctx.fill();
          ctx.stroke();

          // Shaded coat contours
          ctx.fillStyle = coatShadow;
          ctx.beginPath();
          ctx.rect(-8, bounce, 4, 16);
          ctx.fill();

          // Center fluffy white fur lining down the front
          ctx.fillStyle = trimColor;
          ctx.beginPath();
          ctx.roundRect(-2.5, bounce, 5, 16, [1.5]);
          ctx.fill();
          ctx.stroke();

          // Gold buttons flanking center line
          ctx.fillStyle = goldColor;
          ctx.beginPath();
          ctx.arc(-4.5, 4 + bounce, 1.2, 0, Math.PI * 2);
          ctx.arc(-4.5, 12 + bounce, 1.2, 0, Math.PI * 2);
          ctx.arc(3.5, 4 + bounce, 1.2, 0, Math.PI * 2);
          ctx.arc(3.5, 12 + bounce, 1.2, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // Leather Charcoal Belt
          ctx.fillStyle = leatherColor;
          ctx.beginPath();
          ctx.rect(-8.5, 7.5 + bounce, 15, 4);
          ctx.fill();
          ctx.stroke();

          // Giant Gold Buckle with cutout frame
          ctx.fillStyle = goldColor;
          ctx.beginPath();
          ctx.rect(-3.5, 6 + bounce, 7, 7);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = leatherColor;
          ctx.beginPath();
          ctx.rect(-1.5, 8 + bounce, 3, 3);
          ctx.fill();
          ctx.stroke();

          ctx.restore();

          // 4. SANTA'S CHEERFUL HEAD BASE (PEEKING SKIN, EYES, & FLUFFY BEARD)
          ctx.save();

          // Fill head skin
          ctx.fillStyle = skinColor;
          ctx.beginPath();
          ctx.roundRect(-8, -14 + bounce, 16, 14, [4]);
          ctx.fill();

          // Fluffy White Back Hair (behind ears/brim)
          ctx.fillStyle = beardColor;
          ctx.strokeStyle = "#000000";
          ctx.lineWidth = penHero;
          ctx.beginPath();
          ctx.arc(-8, -9 + bounce, 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(-7, -4 + bounce, 4.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // 4b. THE MAJESTIC FLOATING BEARD (Drawn with individual path calls to prevent intersecting line bugs)
          ctx.fillStyle = beardColor;
          ctx.strokeStyle = "#000000";
          ctx.lineWidth = penHero;
          ctx.lineJoin = "round";

          let beardCircles = [
            { x: 6, y: -3, r: 3.5 }, // Right cheek
            { x: 8.5, y: 1.5, r: 4.5 }, // Right mid
            { x: 7.5, y: 6.5, r: 5 }, // Right lower
            { x: 3, y: 9.5, r: 5.5 }, // Bottom center
            { x: -3, y: 8.5, r: 5 }, // Left lower
            { x: -6.5, y: 4, r: 4.5 }, // Left mid
            { x: -6, y: -1, r: 3.5 }, // Left cheek
          ];

          beardCircles.forEach((bc) => {
            ctx.beginPath();
            ctx.arc(bc.x, bc.y + bounce, bc.r, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
          });

          // Draw central mustache (overlaps the beard base)
          ctx.beginPath();
          ctx.ellipse(
            0.5,
            -4.5 + bounce,
            4,
            2.2,
            -Math.PI / 10,
            0,
            Math.PI * 2,
          );
          ctx.fill();
          ctx.stroke();
          ctx.beginPath();
          ctx.ellipse(5.5, -4.5 + bounce, 4, 2.2, Math.PI / 10, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // 4c. EYES & EYEBROWS (Rendered over the top of the beard to guarantee 100% absolute visibility)
          ctx.fillStyle = "#1c1c1e"; // Solid black friendly eyes
          ctx.beginPath();
          ctx.arc(-2, -9 + bounce, 1.6, 0, Math.PI * 2);
          ctx.arc(3.5, -9 + bounce, 1.6, 0, Math.PI * 2);
          ctx.fill();

          // Sparkly white eye glints
          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.arc(-2.4, -9.4 + bounce, 0.5, 0, Math.PI * 2);
          ctx.arc(3.1, -9.4 + bounce, 0.5, 0, Math.PI * 2);
          ctx.fill();

          // White eyebrows
          ctx.fillStyle = beardColor;
          ctx.strokeStyle = "#000000";
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.roundRect(-4.5, -13 + bounce, 4, 2, [1]);
          ctx.fill();
          ctx.stroke();
          ctx.beginPath();
          ctx.roundRect(1.5, -13 + bounce, 4, 2, [1]);
          ctx.fill();
          ctx.stroke();

          // Soft red cheek blush
          ctx.fillStyle = "rgba(231, 76, 60, 0.35)";
          ctx.beginPath();
          ctx.ellipse(-3.5, -6.5 + bounce, 2, 1, 0, 0, Math.PI * 2);
          ctx.ellipse(5, -6.5 + bounce, 2, 1, 0, 0, Math.PI * 2);
          ctx.fill();

          // Rosy Button Nose
          ctx.fillStyle = "#ff8a80";
          ctx.strokeStyle = "#000000";
          ctx.lineWidth = penHero;
          ctx.beginPath();
          ctx.arc(3, -5.5 + bounce, 2.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          ctx.restore();

          // 5. RED VELVET FLOPPY SANTA CAP WITH INTEGRATED SWAY
          ctx.save();
          ctx.strokeStyle = "#000000";
          ctx.lineWidth = penHero;
          ctx.lineJoin = "round";

          // Fluffy white cap brim sitting right at the crown
          ctx.fillStyle = trimColor;
          ctx.beginPath();
          ctx.roundRect(-10.5, -16.5 + bounce, 18.5, 4.5, [2]);
          ctx.fill();
          ctx.stroke();

          // Draw the main red cap dome (solid bean-hat backing structure)
          ctx.fillStyle = coatColor;
          ctx.beginPath();
          ctx.moveTo(-10, -16 + bounce);
          ctx.quadraticCurveTo(-8, -25 + bounce, -1, -25 + bounce);
          ctx.quadraticCurveTo(5, -25 + bounce, 7, -16 + bounce);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Draw the floppy crimson fold draping over the back-left
          let capSway = Math.sin(time / 160) * (1.8 + swayWeight * 2.2);
          let foldTipX = -13 + capSway;
          let foldTipY = -12 + bounce;

          ctx.fillStyle = coatColor;
          ctx.beginPath();
          ctx.moveTo(-3, -25 + bounce);
          ctx.quadraticCurveTo(-11, -22 + bounce, foldTipX, foldTipY);
          ctx.lineTo(foldTipX + 3, foldTipY - 1);
          ctx.quadraticCurveTo(-6, -24 + bounce, 2, -25 + bounce);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // White pom-pom dangling directly from the fold tip
          ctx.fillStyle = trimColor;
          ctx.beginPath();
          ctx.arc(foldTipX, foldTipY, 3.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          ctx.restore();

          // 7. ACTIVE WINTER AURORA (SPARKLING SNOW EMBER SPARKS)
          if (options.isMainHero && !window.isGamePaused) {
            ctx.save();
            ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
            for (let i = 0; i < 4; i++) {
              let seed = Math.sin(i * 45.67);
              let t = (time / 1000 + seed * 6) % 1.0;
              let sparkX = -4 - t * 24 + Math.sin(t * Math.PI * 2) * 4;
              let sparkY = -15 - t * 16 + bounce;
              let size = 1.2 * (1.0 - t);
              ctx.fillRect(sparkX, sparkY, size, size);
            }
            ctx.restore();
          }
        }
        break;

      case "midsummer": {
        let leafGreen = skin === "default" ? "#2ecc71" : armorColor;
        let darkLeafGreen = skin === "default" ? "#1e824c" : bodyColor;
        let strapColor = "#5c3a21"; // Earthy leather straps
        let sunGold =
          skin === "default"
            ? "#f1c40f"
            : skin === "void"
              ? "#e84393"
              : "#f1c40f";
        let time = Date.now();
        let windSway = Math.sin(time / 140) * 1.8;

        // UNIQUE ORGANIC LEAF DRAWING ENGINE (Self-contained helper)
        let drawLeaf = (cx, cy, r, angle, color) => {
          ctx.save();
          ctx.translate(cx, cy + bounce);
          ctx.rotate(angle);
          ctx.fillStyle = color;
          ctx.strokeStyle = "#000000";
          ctx.lineWidth = penHero;
          ctx.lineJoin = "round";

          ctx.beginPath();
          ctx.moveTo(0, -r);
          ctx.quadraticCurveTo(r * 0.65, -r * 0.1, 0, r); // Pointy right-curve
          ctx.quadraticCurveTo(-r * 0.65, -r * 0.1, 0, -r); // Pointy left-curve
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Leaf middle vein
          ctx.strokeStyle = "rgba(0, 0, 0, 0.18)";
          ctx.lineWidth = 1.0;
          ctx.beginPath();
          ctx.moveTo(0, -r * 0.7);
          ctx.lineTo(0, r * 0.7);
          ctx.stroke();

          ctx.restore();
        };

        // 1. CASCADING IVY LEAF CANOPY (CAPE - Flowing Back-Left)
        ctx.save();
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = penHero;
        ctx.lineJoin = "round";

        // Back deep leaf cape layer
        ctx.fillStyle = darkLeafGreen;
        ctx.beginPath();
        ctx.moveTo(-5, bounce);
        ctx.quadraticCurveTo(
          -14 + windSway,
          5 + bounce,
          -16 + windSway,
          15 + bounce,
        );
        ctx.quadraticCurveTo(-9 + windSway, 17 + bounce, -2, 16 + bounce);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Front bright ivy layer
        ctx.fillStyle = leafGreen;
        ctx.beginPath();
        ctx.moveTo(-2, 1 + bounce);
        ctx.quadraticCurveTo(
          -10 + windSway * 0.8,
          8 + bounce,
          -12 + windSway * 0.8,
          15 + bounce,
        );
        ctx.quadraticCurveTo(-5 + windSway * 0.8, 16 + bounce, 1, 14 + bounce);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Organic leaf veins
        ctx.strokeStyle = "rgba(0, 0, 0, 0.15)";
        ctx.lineWidth = 1.0;
        ctx.beginPath();
        ctx.moveTo(-3, 1 + bounce);
        ctx.lineTo(-10 + windSway, 10 + bounce);
        ctx.stroke();
        ctx.restore();

        // 2. LINEN SHIRT & LAYERED TUNIC (BODY)
        // Neutral linen under-shirt
        ctx.fillStyle = "#faf0e6";
        ctx.beginPath();
        ctx.rect(-8, bounce, 14, 16);
        ctx.fill();
        ctx.stroke();

        // Leaf Shoulder Pauldrons (Using drawLeaf!)
        drawLeaf(-9, 1, 4.5, Math.PI / 4, leafGreen);
        drawLeaf(5, 1, 4.5, -Math.PI / 4, leafGreen);

        // Leafy Vest Overlap (Left side)
        ctx.fillStyle = leafGreen;
        ctx.beginPath();
        ctx.moveTo(-8, bounce);
        ctx.lineTo(-2, bounce);
        ctx.lineTo(-8, 11 + bounce);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Leafy Vest Overlap (Right side)
        ctx.beginPath();
        ctx.moveTo(6, bounce);
        ctx.lineTo(0, bounce);
        ctx.lineTo(6, 11 + bounce);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Layered Foliage Skirt
        ctx.fillStyle = darkLeafGreen;
        ctx.beginPath();
        ctx.moveTo(-8.5, 9 + bounce);
        ctx.lineTo(6.5, 9 + bounce);
        ctx.lineTo(8, 16 + bounce);
        ctx.lineTo(-10, 16 + bounce);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Foliage kilt curved detail scales
        ctx.fillStyle = leafGreen;
        for (let i = -8; i <= 4; i += 4) {
          ctx.beginPath();
          ctx.arc(i + 2, 16 + bounce, 2.2, Math.PI, 0);
          ctx.fill();
          ctx.stroke();
        }

        // Crossed leather chest laces
        ctx.strokeStyle = strapColor;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-4, 2 + bounce);
        ctx.lineTo(2, 6 + bounce);
        ctx.moveTo(2, 2 + bounce);
        ctx.lineTo(-4, 6 + bounce);
        ctx.stroke();

        // Woven Leather Belt
        ctx.fillStyle = strapColor;
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = penHero;
        ctx.beginPath();
        ctx.rect(-8.5, 8 + bounce, 15, 3);
        ctx.fill();
        ctx.stroke();

        // Solstice Golden Sun Buckle
        ctx.fillStyle = sunGold;
        ctx.beginPath();
        ctx.arc(0, 9.5 + bounce, 2.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.strokeStyle = sunGold;
        ctx.lineWidth = 0.8;
        for (let r = 0; r < 8; r++) {
          let angle = (r * Math.PI) / 4;
          ctx.beginPath();
          ctx.moveTo(0, 9.5 + bounce);
          ctx.lineTo(
            0 + Math.cos(angle) * 4.5,
            9.5 + bounce + Math.sin(angle) * 4.5,
          );
          ctx.stroke();
        }
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = penHero;

        // 3. SHADOWY FOREST HOOD (OBLITERATES FACE)
        ctx.save();

        // Cavity shadow background
        ctx.fillStyle = "#0c1a10"; // Deep forest shadow cavity
        ctx.beginPath();
        ctx.roundRect(-8, -14 + bounce, 16, 14, [4]);
        ctx.fill();
        ctx.stroke();

        // 4. NATURE GLOW EYES (Facing Right, Peeking from shadow)
        ctx.fillStyle = "#55efc4"; // Glowing mint nature sparks
        ctx.shadowBlur = 6;
        ctx.shadowColor = "#2ecc71";
        ctx.beginPath();
        ctx.arc(1.5, -9 + bounce, 1.3, 0, Math.PI * 2);
        ctx.arc(5.0, -9 + bounce, 1.0, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // 5. ORGANIC DRUID FOLIAGE CANOPY (Layered leaf shroud wrapping head)
        // Draw deepest background leaves
        drawLeaf(-7, -10, 5.0, -Math.PI / 3, darkLeafGreen); // Back-left upper
        drawLeaf(-6, -4, 4.5, -Math.PI / 1.6, darkLeafGreen); // Back-left lower

        // Branch/Vine Hair Locks peeking from the back of the head
        ctx.fillStyle = "#a26938"; // Rich Auburn branch hair
        ctx.beginPath();
        ctx.arc(-9, -7 + bounce, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(-8, -2 + bounce, 4.0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Draw front-facing leaves
        drawLeaf(-4, -15, 5.5, -Math.PI / 6, leafGreen); // Top left
        drawLeaf(0, -17, 6.0, 0, darkLeafGreen); // Top center
        drawLeaf(4, -15, 5.5, Math.PI / 6, leafGreen); // Top right
        drawLeaf(5, -5, 5.5, Math.PI / 2.4, leafGreen); // Front-right (face mask drape)
        drawLeaf(1, -3, 6.0, Math.PI / 1.8, darkLeafGreen); // Chin / low mask drape
        drawLeaf(-3, -1, 4.8, -Math.PI / 2.2, leafGreen); // Lower-left neck base

        // 6. WOVEN VINE CROWN & 3D BLOOMING WILDFLOWERS
        ctx.strokeStyle = "#27ae60";
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(-11, -12 + bounce);
        ctx.quadraticCurveTo(0, -15 + bounce, 11, -12 + bounce);
        ctx.stroke();

        let flowersList = [
          { x: -5, y: -14, pCol: "#ff7675", cCol: "#ffd23f" }, // Rose
          { x: 1, y: -16, pCol: "#ffd23f", cCol: "#ff7675" }, // Daisy
          { x: 6, y: -13, pCol: "#54a0ff", cCol: "#ffffff" }, // Bluebell
        ];

        flowersList.forEach((fl) => {
          ctx.save();
          ctx.translate(fl.x, fl.y + bounce);
          ctx.fillStyle = fl.pCol;
          ctx.strokeStyle = "#000000";
          ctx.lineWidth = 0.8;
          for (let i = 0; i < 5; i++) {
            let angle = (i * Math.PI * 2) / 5;
            ctx.beginPath();
            ctx.arc(
              Math.cos(angle) * 1.5,
              Math.sin(angle) * 1.5,
              1.5,
              0,
              Math.PI * 2,
            );
            ctx.fill();
            ctx.stroke();
          }
          // Inner core bulb
          ctx.fillStyle = fl.cCol;
          ctx.beginPath();
          ctx.arc(0, 0, 1.0, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.restore();
        });

        ctx.restore();

        // 7. DRIFTING SUMMER FLOWER SPORES (ACTIVE WIND TRAIL)
        if (options.isMainHero && !window.isGamePaused) {
          ctx.save();
          for (let i = 0; i < 3; i++) {
            let seed = Math.sin(i * 78.91);
            let t = (time / 900 + seed * 6) % 1.0;
            let sparkX = -6 - t * 22 + Math.sin(t * Math.PI * 2) * 4;
            let sparkY = -6 - t * 15 + bounce;
            let alpha = 1.0 - t;
            ctx.fillStyle =
              i % 2 === 0
                ? `rgba(255, 210, 63, ${alpha * 0.75})`
                : `rgba(255, 118, 117, ${alpha * 0.75})`;
            ctx.beginPath();
            ctx.arc(sparkX, sparkY, 1.2 * (1.0 - t), 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.restore();
        }
        break;
      }

      default: // "knight" Classic Plate Armor
        // Draw Cape
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = penHero;
        ctx.fillStyle = capeColor;
        ctx.beginPath();
        ctx.moveTo(-6, bounce);
        ctx.lineTo(-18, 15);
        ctx.lineTo(-2, 18);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Draw Body
        ctx.fillStyle = bodyColor;
        ctx.beginPath();
        ctx.rect(-8, bounce, 14, 16);
        ctx.fill();
        ctx.stroke();

        // Draw Helmet
        ctx.fillStyle = armorColor;
        ctx.beginPath();
        ctx.rect(-10, -14 + bounce, 18, 16);
        ctx.fill();
        ctx.stroke();

        // Helmet Visor / Eyes
        ctx.fillStyle = "#2c3e50";
        ctx.beginPath();
        ctx.rect(0, -8 + bounce, 6, 4);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = eyeColor;
        ctx.beginPath();
        ctx.rect(-5, -20 + bounce, 4, 6);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.rect(-9, -16 + bounce, 8, 4);
        ctx.fill();
        ctx.stroke();
        break;
    }

    // Crown of Tempests Aura
    if (
      equipped.helmet &&
      equipped.helmet.isUniqueTempest &&
      (!options.deathAnimationTimer || options.deathAnimationTimer === 0)
    ) {
      ctx.save();
      ctx.translate(0, -14 + bounce);
      ctx.strokeStyle = "#00d2ff";
      ctx.lineWidth = 2.0;
      ctx.shadowBlur = 10;
      ctx.shadowColor = "#00d2ff";
      ctx.beginPath();
      ctx.moveTo(-6, -2);
      ctx.quadraticCurveTo(-14, -12, -18, -8);
      ctx.quadraticCurveTo(-10, -5, -4, 0);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(6, -2);
      ctx.quadraticCurveTo(14, -12, 18, -8);
      ctx.quadraticCurveTo(10, -5, 4, 0);
      ctx.stroke();
      ctx.restore();
    }

    // UNIQUE: Maelstrom Gale-Glaive "Gale Resonance" Canvas Aura
    if (
      stats.galeResonanceTimer > 0 &&
      (!options.deathAnimationTimer || options.deathAnimationTimer === 0)
    ) {
      ctx.save();
      ctx.translate(0, bounce);
      ctx.strokeStyle = "rgba(0, 255, 204, 0.45)";
      ctx.lineWidth = 1.8;
      ctx.shadowBlur = 10;
      ctx.shadowColor = "#00ffcc";
      ctx.beginPath();
      ctx.arc(0, 0, 24 + Math.sin(Date.now() / 100) * 3, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // Weapon
    ctx.save();
    ctx.translate(2, 6 + bounce);
    let isStaff = equipped.weapon && equipped.weapon.isUniqueStaff;
    let isUniqueSword = equipped.weapon && equipped.weapon.isUniqueSword;
    let isSingularity = equipped.weapon && equipped.weapon.isUniqueSingularity;
    let isMaelstrom = equipped.weapon && equipped.weapon.isUniqueMaelstrom;

    if (isSingularity) {
      ctx.rotate(-Math.PI / 8);
      if (options.slashFrame) {
        ctx.translate(15, -10);
        ctx.rotate(-Math.PI / 2.3);
      }
      ctx.fillStyle = "#1e1e24";
      ctx.beginPath();
      ctx.rect(-2, -2, 4, 10);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#110221";
      ctx.strokeStyle = "#8e44ad";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-9, 8);
      ctx.lineTo(9, 8);
      ctx.lineTo(12, 12);
      ctx.lineTo(-12, 12);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      let singPulse = Math.sin(Date.now() / 120) * 0.15 + 0.85;
      ctx.fillStyle = `rgba(37, 3, 60, ${singPulse})`;
      ctx.strokeStyle = "#e84393";
      ctx.beginPath();
      ctx.moveTo(-3, 12);
      ctx.lineTo(-1.5, 42);
      ctx.lineTo(1.5, 42);
      ctx.lineTo(3, 12);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      if (options.slashFrame) {
        ctx.fillStyle = "rgba(142, 68, 173, 0.35)";
        ctx.beginPath();
        ctx.arc(0, 20, 35, 0, Math.PI / 2);
        ctx.lineTo(0, 0);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = "rgba(232, 67, 147, 0.6)";
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    } else if (isMaelstrom) {
      ctx.rotate(-Math.PI / 8);
      if (options.slashFrame) {
        ctx.translate(15, -10);
        ctx.rotate(-Math.PI / 2.3);
      }
      ctx.fillStyle = "#5c503b";
      ctx.beginPath();
      ctx.rect(-1, -6, 2, 44);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#2ecc71";
      ctx.beginPath();
      ctx.moveTo(-4, 30);
      ctx.lineTo(0, 48);
      ctx.lineTo(4, 30);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#27ae60";
      ctx.beginPath();
      ctx.moveTo(-3, -2);
      ctx.lineTo(0, -12);
      ctx.lineTo(3, -2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      if (options.slashFrame) {
        ctx.fillStyle = "rgba(46, 204, 113, 0.35)";
        ctx.beginPath();
        ctx.arc(0, 20, 35, 0, Math.PI / 2);
        ctx.lineTo(0, 0);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = "rgba(39, 174, 96, 0.6)";
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    } else if (isStaff) {
      ctx.rotate(-Math.PI / 8);
      if (options.slashFrame) {
        ctx.translate(15, -10);
        ctx.rotate(-Math.PI / 2.3);
      }
      ctx.fillStyle = "#1e1e24";
      ctx.beginPath();
      ctx.rect(-1.5, -4, 3, 34);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#f1c40f";
      ctx.beginPath();
      ctx.moveTo(-7, 30);
      ctx.quadraticCurveTo(0, 26, 7, 30);
      ctx.lineTo(9, 36);
      ctx.quadraticCurveTo(0, 32, -9, 36);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      let gemPulse = 3.5 + Math.sin(Date.now() / 150) * 1.2;
      ctx.fillStyle = "#e74c3c";
      ctx.beginPath();
      ctx.arc(0, 34, gemPulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(-1, 33, 1, 0, Math.PI * 2);
      ctx.fill();
      if (options.slashFrame) {
        ctx.fillStyle = "rgba(230, 126, 34, 0.35)";
        ctx.beginPath();
        ctx.arc(0, 20, 35, 0, Math.PI / 2);
        ctx.lineTo(0, 0);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = "rgba(231, 76, 60, 0.6)";
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    } else if (isUniqueSword) {
      ctx.rotate(-Math.PI / 8);
      if (options.slashFrame) {
        ctx.translate(15, -10);
        ctx.rotate(-Math.PI / 2.3);
      }
      ctx.fillStyle = "#1e1e24";
      ctx.beginPath();
      ctx.rect(-2, -2, 4, 10);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#d4af37";
      ctx.beginPath();
      ctx.arc(0, -3, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.rect(-7, 8, 14, 4);
      ctx.fill();
      ctx.stroke();
      let bleedPulse = Math.sin(Date.now() / 100) * 0.15 + 0.85;
      let bladeColor = `rgba(192, 57, 43, ${bleedPulse})`;
      ctx.fillStyle =
        window.mob && window.mob.flashTimer > 0 ? "#ffffff" : bladeColor;
      ctx.strokeStyle = "#960018";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-3.5, 12);
      ctx.lineTo(-2, 37);
      ctx.lineTo(2, 37);
      ctx.lineTo(3.5, 12);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#ff7f7f";
      ctx.beginPath();
      ctx.rect(-0.8, 14, 1.6, 18);
      ctx.fill();
      if (options.slashFrame) {
        ctx.fillStyle = "rgba(192, 57, 43, 0.35)";
        ctx.beginPath();
        ctx.arc(0, 20, 35, 0, Math.PI / 2);
        ctx.lineTo(0, 0);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = "rgba(150, 0, 24, 0.6)";
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    } else {
      let weapItem = equipped.weapon;
      let tierColor = window.getTierColor(weapItem ? weapItem.statsRolled : 0);
      let rgbVals = window.hexToRgbValues
        ? window.hexToRgbValues(tierColor)
        : "236, 240, 241";

      if (options.slashFrame) {
        ctx.translate(15, -10);
        ctx.rotate(-Math.PI / 2.3);

        // --- Sleek, classic sword rendering ---
        ctx.fillStyle = "#7f8c8d";
        ctx.beginPath();
        ctx.rect(-2, -2, 4, 10);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#8e44ad";
        ctx.beginPath();
        ctx.rect(-5, 8, 10, 4);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#ecf0f1";
        ctx.beginPath();
        ctx.rect(-2, 12, 4, 25);
        ctx.fill();
        ctx.stroke();

        // Premium dynamic slash color trail inheriting quality
        ctx.fillStyle = `rgba(${rgbVals}, 0.35)`;
        ctx.beginPath();
        ctx.arc(0, 20, 35, 0, Math.PI / 2);
        ctx.lineTo(0, 0);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = `rgba(${rgbVals}, 0.55)`;
        ctx.lineWidth = 2;
        ctx.stroke();
      } else {
        ctx.rotate(-Math.PI / 8);

        ctx.fillStyle = "#7f8c8d";
        ctx.beginPath();
        ctx.rect(-2, -2, 4, 10);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#8e44ad";
        ctx.beginPath();
        ctx.rect(-5, 8, 10, 4);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#ecf0f1";
        ctx.beginPath();
        ctx.rect(-2, 12, 4, 25);
        ctx.fill();
        ctx.stroke();
      }
    }
    ctx.restore();

    if (
      equipped.weapon &&
      equipped.weapon.isUniqueSingularity &&
      stats.singularityState === "pulsing" &&
      (!options.deathAnimationTimer || options.deathAnimationTimer === 0)
    ) {
      ctx.save();
      ctx.translate(0, -35 + bounce);
      ctx.rotate(Date.now() / 300);
      ctx.strokeStyle = "#e84393";
      ctx.lineWidth = 1.8;
      ctx.shadowBlur = 10;
      ctx.shadowColor = "#e84393";
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        let angle = (i * Math.PI) / 3;
        ctx.lineTo(Math.cos(angle) * 9, Math.sin(angle) * 9);
      }
      ctx.closePath();
      ctx.stroke();
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(0, 0, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    ctx.restore();
  };

  // --- MISSING MAIN RENDER LOOP ---
  window.draw = function () {
    window.nowMs = window.Date.now();
    const ctx = window.ctx;
    const canvas = window.canvas;
    if (!ctx || !canvas) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let tier = window.getStageTier();

    const penSky = 1.0;
    const penFar = 1.3;
    const penBgScenery = 1.3;
    const penFgScenery = 1.5;
    const penHero = 1.8;
    const penBoss = 2.4;

    // 1. SKY & BACKGROUND FILL
    if (window.playerStats.isUberBoss) {
      let skyGrad = ctx.createLinearGradient(0, 0, 0, 230);
      skyGrad.addColorStop(0, "#0d011a");
      skyGrad.addColorStop(0.5, "#25033c");
      skyGrad.addColorStop(1, "#030005");
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, canvas.width, 230);
      let singPulse = 45 + Math.sin(Date.now() / 150) * 10;
      let singGrad = ctx.createRadialGradient(
        canvas.width / 2,
        110,
        5,
        canvas.width / 2,
        110,
        singPulse,
      );
      singGrad.addColorStop(0, "#000000");
      singGrad.addColorStop(0.3, "#e84393");
      singGrad.addColorStop(0.7, "rgba(142, 68, 173, 0.15)");
      singGrad.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = singGrad;
      ctx.beginPath();
      ctx.arc(canvas.width / 2, 110, singPulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(155, 89, 182, 0.45)";
      ctx.lineWidth = 1.5;
      ctx.save();
      ctx.translate(canvas.width / 2, 110);
      ctx.rotate(Date.now() / 500);
      ctx.beginPath();
      ctx.ellipse(0, 0, singPulse * 1.6, singPulse * 0.4, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    } else if (window.playerStats.isPrestigeBossMode) {
      let skyGrad = ctx.createLinearGradient(0, 0, 0, 230);
      skyGrad.addColorStop(0, "#0a0302");
      skyGrad.addColorStop(0.5, "#2d0802");
      skyGrad.addColorStop(1, "#9e2a02");
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, canvas.width, 230);
      ctx.fillStyle = "#0c0302";
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 1.5;
      for (let i = 40; i < canvas.width; i += 180) {
        ctx.beginPath();
        ctx.rect(i, 0, 35, 230);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(i, 30);
        ctx.quadraticCurveTo(i - 40, 60, i - 90, 60);
        ctx.lineTo(i - 90, 75);
        ctx.quadraticCurveTo(i - 40, 75, i, 45);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
      ctx.strokeStyle = "#1b1412";
      ctx.lineWidth = 2.5;
      for (let x = 110; x < canvas.width; x += 180) {
        let chainLength = 90 + Math.sin(Date.now() / 400 + x) * 15;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, chainLength);
        ctx.stroke();
        ctx.fillStyle = "#110a08";
        for (let y = 10; y < chainLength; y += 12) {
          ctx.beginPath();
          ctx.ellipse(x, y, 4, 6, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        }
      }
      let lavaHorizonGrad = ctx.createLinearGradient(0, 210, 0, 230);
      lavaHorizonGrad.addColorStop(0, "rgba(230, 126, 34, 0)");
      lavaHorizonGrad.addColorStop(0.5, "#e67e22");
      lavaHorizonGrad.addColorStop(1, "#f1c40f");
      ctx.fillStyle = lavaHorizonGrad;
      ctx.fillRect(0, 210, canvas.width, 20);
    } else if (window.playerStats.isCrucibleMode) {
      let skyGrad = ctx.createLinearGradient(0, 0, 0, 230);
      skyGrad.addColorStop(0, "#05010c");
      skyGrad.addColorStop(1, "#150221");
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, canvas.width, 230);
      ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
      for (let i = 0; i < 25; i++) {
        let size = (Math.sin(Date.now() / 200 + i) * 0.5 + 0.5) * 1.5;
        ctx.fillRect((i * 47) % canvas.width, (i * 13) % 190, size, size);
      }
      let pulseRad = 65 + Math.sin(Date.now() / 250) * 15;
      let spaceGlow = ctx.createRadialGradient(
        canvas.width / 2,
        110,
        2,
        canvas.width / 2,
        110,
        pulseRad,
      );
      spaceGlow.addColorStop(0, "rgba(155, 89, 182, 0.45)");
      spaceGlow.addColorStop(0.5, "rgba(232, 67, 147, 0.15)");
      spaceGlow.addColorStop(1, "rgba(155, 89, 182, 0)");
      ctx.fillStyle = spaceGlow;
      ctx.beginPath();
      ctx.arc(canvas.width / 2, 110, pulseRad, 0, Math.PI * 2);
      ctx.fill();
    } else if (window.playerStats.isDungeonMode) {
      let caveGrad = ctx.createLinearGradient(0, 0, 0, 230);
      if (window.playerStats.currentDungeon === "gold") {
        caveGrad.addColorStop(0, "#0f0800");
        caveGrad.addColorStop(1, "#1d1205");
      } else if (window.playerStats.currentDungeon === "mat") {
        caveGrad.addColorStop(0, "#040d08");
        caveGrad.addColorStop(1, "#0d2115");
      } else {
        caveGrad.addColorStop(0, "#06070a");
        caveGrad.addColorStop(1, "#12181f");
      }
      ctx.fillStyle = caveGrad;
      ctx.fillRect(0, 0, canvas.width, 230);
      ctx.fillStyle =
        window.playerStats.currentDungeon === "gold"
          ? "#140a00"
          : window.playerStats.currentDungeon === "mat"
            ? "#050f0a"
            : "#0d1117";
      ctx.beginPath();
      ctx.moveTo(0, 230);
      ctx.quadraticCurveTo(180, 40, 380, 230);
      ctx.quadraticCurveTo(580, 20, 800, 230);
      ctx.fill();
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = penFar;
      ctx.stroke();
      if (window.playerStats.currentDungeon === "gold") {
        ctx.strokeStyle = "#1b1108";
        ctx.lineWidth = 6;
        for (let i = 100; i < canvas.width; i += 220) {
          ctx.beginPath();
          ctx.moveTo(i - 40, 230);
          ctx.lineTo(i - 40, 90);
          ctx.lineTo(i + 40, 90);
          ctx.lineTo(i + 40, 230);
          ctx.stroke();
          ctx.strokeStyle = "#000000";
          ctx.lineWidth = penFar;
          ctx.stroke();
        }
      } else if (window.playerStats.currentDungeon === "equip") {
        // Vaulted roof support girders/trusses (Dark structural framework)
        ctx.save();
        ctx.strokeStyle = "#07080a";
        ctx.lineWidth = 14;
        ctx.beginPath();
        // Horizontal main support truss
        ctx.moveTo(0, 30);
        ctx.lineTo(canvas.width, 30);
        ctx.stroke();

        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 2;
        // Diagonal lattice bracing lines
        for (let tx = 0; tx < canvas.width; tx += 60) {
          ctx.beginPath();
          ctx.moveTo(tx, 0);
          ctx.lineTo(tx + 30, 30);
          ctx.lineTo(tx + 60, 0);
          ctx.stroke();
        }
        ctx.restore();

        // 1. Central Smeltery Hearth (Glowing Background Furnace)
        let hearthX = canvas.width / 2;
        let hearthY = 230;
        let hearthW = 120;
        let hearthH = 140;

        ctx.save();
        ctx.fillStyle = "#0c0d12"; // Inner deep fire pit shadow
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(hearthX - hearthW / 2, hearthY);
        ctx.lineTo(hearthX - hearthW / 2, hearthY - hearthH + 30);
        ctx.quadraticCurveTo(
          hearthX,
          hearthY - hearthH - 10,
          hearthX + hearthW / 2,
          hearthY - hearthH + 30,
        );
        ctx.lineTo(hearthX + hearthW / 2, hearthY);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Slow, heavily dampened breathing core (period slowed to 1.8 seconds, amplitude reduced to 0.035)
        let firePulse = 0.965 + Math.sin(Date.now() / 1800) * 0.035;
        let fireGrad = ctx.createRadialGradient(
          hearthX,
          hearthY - 10,
          5,
          hearthX,
          hearthY - 10,
          (hearthW / 2) * firePulse,
        );
        fireGrad.addColorStop(0, "#ffffff");
        fireGrad.addColorStop(0.25, "#f1c40f"); // Searing gold
        fireGrad.addColorStop(0.55, "#e67e22"); // Molten orange
        fireGrad.addColorStop(0.88, "#960018"); // Ashy crimson
        fireGrad.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = fireGrad;
        ctx.beginPath();
        ctx.moveTo(hearthX - hearthW / 2 + 5, hearthY);
        ctx.lineTo(hearthX - hearthW / 2 + 5, hearthY - hearthH + 35);
        ctx.quadraticCurveTo(
          hearthX,
          hearthY - hearthH,
          hearthX + hearthW / 2 - 5,
          hearthY - hearthH + 35,
        );
        ctx.lineTo(hearthX + hearthW / 2 - 5, hearthY);
        ctx.closePath();
        ctx.fill();

        // Solid iron horizontal structural band and rivets across the furnace face
        ctx.strokeStyle = "#101317";
        ctx.lineWidth = 4;
        ctx.fillStyle = "#1e222b";
        ctx.beginPath();
        ctx.rect(hearthX - hearthW / 2 - 4, hearthY - 45, hearthW + 8, 12);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = "#0c0d12";
        for (let rx = -hearthW / 2; rx <= hearthW / 2; rx += 24) {
          ctx.beginPath();
          ctx.arc(hearthX + rx, hearthY - 39, 2.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        }

        // Bricked Border (Heavier industrial frame)
        ctx.fillStyle = "#1e222b";
        ctx.lineWidth = 2;
        for (let angle = Math.PI; angle <= Math.PI * 2; angle += Math.PI / 10) {
          let bx = hearthX + Math.cos(angle) * (hearthW / 2 + 10);
          let by = hearthY - hearthH + 30 + Math.sin(angle) * 30;
          ctx.beginPath();
          ctx.arc(bx, by, 8, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        }
        ctx.restore();

        // 2. Silhouette Gearworks (Slowed down significantly to feel heavy and non-distracting)
        let drawBackgroundGear = (
          gx,
          gy,
          radius,
          teeth,
          speedMult,
          direction,
        ) => {
          ctx.save();
          ctx.translate(gx, gy);
          ctx.rotate((Date.now() / speedMult) * direction);
          ctx.fillStyle = "#0c0d12"; // Solid silhouette dark grey
          ctx.strokeStyle = "#000000";
          ctx.lineWidth = 2;

          // Base gear circle
          ctx.beginPath();
          ctx.arc(0, 0, radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // Draw gear teeth
          for (let j = 0; j < teeth; j++) {
            ctx.save();
            ctx.rotate((j * Math.PI * 2) / teeth);
            ctx.beginPath();
            ctx.rect(
              -radius * 0.12,
              -radius - radius * 0.15,
              radius * 0.24,
              radius * 0.25,
            );
            ctx.fill();
            ctx.stroke();
            ctx.restore();
          }

          // Inner axle cutout
          ctx.fillStyle = "#030406";
          ctx.beginPath();
          ctx.arc(0, 0, radius * 0.35, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.restore();
        };

        // Rotations slowed down to 11s and 9.5s periods
        drawBackgroundGear(110, 75, 45, 12, 11000, 1); // Clockwise
        drawBackgroundGear(690, 95, 35, 10, 9500, -1); // Counter-clockwise

        // 3. Detailed Industrial Pipe & Valve Networks
        ctx.save();
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 8;
        ctx.lineJoin = "round";

        // Draw master horizontal pipe path
        ctx.beginPath();
        ctx.moveTo(-10, 50);
        ctx.lineTo(240, 50);
        ctx.lineTo(240, 110);
        ctx.lineTo(560, 110);
        ctx.lineTo(560, 50);
        ctx.lineTo(canvas.width + 10, 50);
        ctx.stroke();

        // Draw secondary vertical feed pipes
        ctx.beginPath();
        ctx.moveTo(110, 50);
        ctx.lineTo(110, 160);
        ctx.moveTo(690, 50);
        ctx.lineTo(690, 160);
        ctx.stroke();

        // Outer copper pipe shading
        ctx.strokeStyle = "#7e5109"; // Weathered bronze/copper
        ctx.lineWidth = 5;
        ctx.stroke();

        // Inner glowing core line (Hot thermal energy flow)
        let pipePulse = 0.5 + Math.sin(Date.now() / 180) * 0.5;
        ctx.strokeStyle = `rgba(241, 196, 15, ${0.6 + pipePulse * 0.4})`; // Pulsing gold steam
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Draw Pressure Gauges
        let drawPressureGauge = (pgX, pgY) => {
          ctx.fillStyle = "#f8fafc";
          ctx.strokeStyle = "#000000";
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(pgX, pgY, 11, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // Copper bezel
          ctx.strokeStyle = "#7e5109";
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.arc(pgX, pgY, 9, 0, Math.PI * 2);
          ctx.stroke();

          // Moving Indicator Needle
          let angle = -Math.PI / 1.5 + Math.sin(Date.now() / 400 + pgX) * 0.4;
          ctx.strokeStyle = "#c0392b"; // Red needle
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(pgX, pgY);
          ctx.lineTo(pgX + Math.cos(angle) * 7, pgY + Math.sin(angle) * 7);
          ctx.stroke();
        };
        drawPressureGauge(240, 80);
        drawPressureGauge(560, 80);
        ctx.restore();

        // 4. Zero-Allocation Floating Foundry Sparks (Deterministically generated)
        ctx.save();
        for (let j = 0; j < 12; j++) {
          let seed = Math.sin(j * 432.18);
          // Normalize time factor to a loop of 1.4 seconds
          let sparkTime = (Date.now() / 1400 + seed) % 1.0;

          // Spawn along the width of the canvas, rising upward
          let spX =
            ((j * 73) % (canvas.width + 40)) -
            20 +
            Math.sin(sparkTime * Math.PI * 2 + j) * 8;
          let spY = 230 - sparkTime * 180; // Rise from floor level (230) up to 50

          let spAlpha =
            Math.min(1.0, (1.0 - sparkTime) * 1.5) * (0.3 + (j % 4) * 0.25);
          let spSize = 1.0 + (j % 3) * 0.8;

          ctx.fillStyle =
            j % 2 === 0
              ? `rgba(255, 170, 0, ${spAlpha})`
              : `rgba(255, 220, 80, ${spAlpha})`;
          ctx.fillRect(spX, spY, spSize, spSize);
        }
        ctx.restore();

        // 5. Heavy Iron Hanging Chains and Glowing Pendulum Lanterns
        for (let i = 180; i < canvas.width; i += 220) {
          ctx.save();
          // Asynchronous, physics-aligned subtle sway logic
          // Use a unique period and a non-rational phase modifier per loop index
          let period = 1500 + (i % 3) * 200; // Varying rates: 1500ms, 1700ms, 1900ms
          let phase = i * 0.77; // Breaking neat 2*PI spatial alignments
          let swingAngle = Math.sin(Date.now() / period + phase) * 0.032; // Highly subtle, heavy 0.032 radians arc

          ctx.translate(i, 0);
          ctx.rotate(swingAngle);

          // Draw Heavy Hanging Chain (vertical dark loops)
          ctx.strokeStyle = "#000000";
          ctx.lineWidth = 2.5;
          let chainLen = 140;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(0, chainLen);
          ctx.stroke();

          // Overlay individual chain links
          ctx.fillStyle = "#2c3e50";
          for (let y = 10; y < chainLen; y += 14) {
            ctx.beginPath();
            ctx.arc(0, y, 2, 0, Math.PI * 2);
            ctx.fill();
          }

          // Draw detailed Iron Lantern Housing at bottom of the chain
          let ly = chainLen;
          ctx.translate(0, ly);

          // Lantern Cap
          ctx.fillStyle = "#1e272e";
          ctx.strokeStyle = "#000000";
          ctx.lineWidth = penFar;
          ctx.beginPath();
          ctx.moveTo(-10, 0);
          ctx.lineTo(10, 0);
          ctx.lineTo(6, -6);
          ctx.lineTo(-6, -6);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Lantern Glowing Glass Body
          let pulse = 0.8 + Math.sin(Date.now() / 150 + i * 1.3) * 0.2;
          ctx.fillStyle = `rgba(241, 196, 15, ${0.4 + pulse * 0.45})`; // Warm firelight glow
          ctx.beginPath();
          ctx.moveTo(-7, 0);
          ctx.lineTo(7, 0);
          ctx.lineTo(5, 14);
          ctx.lineTo(-5, 14);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // White-hot lantern filament
          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.arc(0, 6, 2.5, 0, Math.PI * 2);
          ctx.fill();

          // Lantern Iron Guard Cage (Vertical side bars)
          ctx.strokeStyle = "#1e272e";
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.moveTo(-7, 0);
          ctx.lineTo(-5, 14);
          ctx.moveTo(7, 0);
          ctx.lineTo(5, 14);
          ctx.moveTo(0, 0);
          ctx.lineTo(0, 14); // center guard bar
          ctx.stroke();

          // Bottom Cap & Finial Ring
          ctx.fillStyle = "#1e272e";
          ctx.beginPath();
          ctx.rect(-5, 14, 10, 3);
          ctx.fill();
          ctx.stroke();

          ctx.restore();
        }
      }
    } else {
      let skyGrad = ctx.createLinearGradient(0, 0, 0, 230);
      if (window.playerStats.isBossMode) {
        skyGrad.addColorStop(0, "#140618");
        skyGrad.addColorStop(1, "#030005");
      } else {
        if (tier === 0) {
          skyGrad.addColorStop(0, "#121829"); // Deep night-indigo blue
          skyGrad.addColorStop(0.45, "#4a154b"); // Plum violet
          skyGrad.addColorStop(0.8, "#ff7675"); // Warm sunset peach
          skyGrad.addColorStop(1, "#ffeaa7"); // Horizon golden dawn mist
        } else if (tier === 1) {
          skyGrad.addColorStop(0, "#080b18"); // Deep midnight blue
          skyGrad.addColorStop(0.5, "#0d1b2a"); // Midnight teal
          skyGrad.addColorStop(1, "#1b263b"); // Horizon twilight teal
        } else if (tier === 2) {
          skyGrad.addColorStop(0, "#5a0e0e");
          skyGrad.addColorStop(1, "#0e0202");
        } else if (tier === 3) {
          skyGrad.addColorStop(0, "#082113");
          skyGrad.addColorStop(1, "#193623");
        } else {
          skyGrad.addColorStop(0, "#070313");
          skyGrad.addColorStop(1, "#020005");
        }
      }
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, canvas.width, 230);

      if (tier === 0) {
        // 1. Giant Solstice Dawn Sun (Radiating light)
        ctx.save();
        let sunPulse = 35 + Math.sin(Date.now() / 600) * 1.5;
        let sunGrad = ctx.createRadialGradient(
          180,
          90,
          2,
          180,
          90,
          sunPulse + 30,
        );
        sunGrad.addColorStop(0, "#ffffff");
        sunGrad.addColorStop(0.2, "#ffe082");
        sunGrad.addColorStop(0.6, "rgba(255, 118, 117, 0.15)");
        sunGrad.addColorStop(1, "rgba(255, 118, 117, 0)");
        ctx.fillStyle = sunGrad;
        ctx.beginPath();
        ctx.arc(180, 90, sunPulse + 30, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // 2. Stylized Fluffy Pixel-Art Clouds
        ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
        let cloudScroll1 = ((Date.now() / 320) % (canvas.width + 120)) - 60;
        let cloudScroll2 =
          ((Date.now() / 480 + 350) % (canvas.width + 120)) - 60;

        ctx.beginPath();
        ctx.arc(cloudScroll1, 40, 12, 0, Math.PI * 2);
        ctx.arc(cloudScroll1 + 14, 35, 16, 0, Math.PI * 2);
        ctx.arc(cloudScroll1 + 28, 40, 10, 0, Math.PI * 2);
        ctx.arc(cloudScroll1 - 10, 43, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
        ctx.lineWidth = penSky;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(cloudScroll2, 60, 9, 0, Math.PI * 2);
        ctx.arc(cloudScroll2 + 12, 56, 13, 0, Math.PI * 2);
        ctx.arc(cloudScroll2 + 24, 60, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // 3. Jagged Distant Violet Peaks (Parallax Mountain Range)
        ctx.fillStyle = "#271b3e"; // Deep violet
        ctx.beginPath();
        ctx.moveTo(0, 230);
        ctx.lineTo(0, 150);
        ctx.lineTo(100, 90);
        ctx.lineTo(180, 160);
        ctx.lineTo(290, 75);
        ctx.lineTo(390, 150);
        ctx.lineTo(510, 65);
        ctx.lineTo(610, 160);
        ctx.lineTo(680, 105);
        ctx.lineTo(800, 230);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = penSky;
        ctx.stroke();

        // 4. Horizon Dawn Mist Overlap
        let horizonMist = ctx.createLinearGradient(0, 120, 0, 230);
        horizonMist.addColorStop(0, "rgba(255, 234, 167, 0)");
        horizonMist.addColorStop(0.7, "rgba(255, 234, 167, 0.15)");
        horizonMist.addColorStop(1, "rgba(255, 234, 167, 0.45)");
        ctx.fillStyle = horizonMist;
        ctx.fillRect(0, 120, canvas.width, 110);

        // 5. Silhouette Pine Forest Row (Jagged horizon tree lines)
        ctx.save();
        ctx.fillStyle = "#0c1f13"; // Deepest pine silhouette green
        ctx.beginPath();
        ctx.moveTo(0, 230);
        let treeX = 0;
        while (treeX < canvas.width + 30) {
          let py = 175 + Math.sin(treeX * 0.01) * 6; // slow hill wave
          let treeHeight =
            12 + Math.sin(treeX * 0.05) * 4 + (treeX % 3 === 0 ? 3 : -2); // varied natural heights

          ctx.lineTo(treeX, py);
          ctx.lineTo(treeX + 4, py - treeHeight * 0.4); // First branch tier (left)
          ctx.lineTo(treeX + 2, py - treeHeight * 0.35); // Inward notch
          ctx.lineTo(treeX + 6, py - treeHeight * 0.7); // Second branch tier (left)
          ctx.lineTo(treeX + 4, py - treeHeight * 0.65); // Inward notch
          ctx.lineTo(treeX + 8, py - treeHeight); // Apex / Spire tip
          ctx.lineTo(treeX + 12, py - treeHeight * 0.65); // Second branch tier (right)
          ctx.lineTo(treeX + 10, py - treeHeight * 0.7); // Inward notch
          ctx.lineTo(treeX + 14, py - treeHeight * 0.35); // First branch tier (right)
          ctx.lineTo(treeX + 12, py - treeHeight * 0.4); // Inward notch
          ctx.lineTo(treeX + 16, py); // Base right

          treeX += 13 + (treeX % 4); // overlapping spacing
        }
        ctx.lineTo(canvas.width, 230);
        ctx.closePath();
        ctx.fill();

        // Soft dark green contour stroke instead of harsh black to keep it misty and cohesive
        ctx.strokeStyle = "#07130a";
        ctx.lineWidth = 1.0;
        ctx.stroke();
        ctx.restore();
      } else if (tier === 1) {
        // 1. Clean Atmospheric Twilight Sky
        let skyGrad = ctx.createLinearGradient(0, 0, 0, 230);
        skyGrad.addColorStop(0, "#060a12");
        skyGrad.addColorStop(1, "#121b2d");
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, canvas.width, 230);

        // 2. Flowing Vector Aurora Ribbon (Three-layered, vertical-fading curtains)
        ctx.save();
        let auroraTime = Date.now() / 2200;

        // Ribbon A: Luminous Emerald-Teal (Primary sweeping ribbon)
        let gA = ctx.createLinearGradient(0, 15, 0, 115);
        gA.addColorStop(0, "rgba(0, 255, 136, 0.0)");
        gA.addColorStop(0.5, "rgba(0, 255, 136, 0.16)");
        gA.addColorStop(1, "rgba(0, 255, 136, 0.0)");
        ctx.fillStyle = gA;

        let waveA1 = Math.sin(auroraTime) * 12;
        let waveA2 = Math.cos(auroraTime * 0.9) * 8;

        ctx.beginPath();
        ctx.moveTo(0, 45 + waveA1);
        ctx.bezierCurveTo(
          canvas.width * 0.35,
          15 + waveA2,
          canvas.width * 0.65,
          85 - waveA1,
          canvas.width,
          35 + waveA2,
        );
        ctx.lineTo(canvas.width, 75 + waveA2);
        ctx.bezierCurveTo(
          canvas.width * 0.65,
          115 - waveA1,
          canvas.width * 0.35,
          55 + waveA2,
          0,
          85 + waveA1,
        );
        ctx.closePath();
        ctx.fill();

        // Ribbon B: Electric Cyan (Secondary crossing ribbon)
        let gB = ctx.createLinearGradient(0, 25, 0, 125);
        gB.addColorStop(0, "rgba(0, 240, 255, 0.0)");
        gB.addColorStop(0.5, "rgba(0, 240, 255, 0.14)");
        gB.addColorStop(1, "rgba(0, 240, 255, 0.0)");
        ctx.fillStyle = gB;

        let waveB1 = Math.cos(auroraTime * 1.1) * 10;
        let waveB2 = Math.sin(auroraTime * 0.7) * 14;

        ctx.beginPath();
        ctx.moveTo(0, 60 + waveB1);
        ctx.bezierCurveTo(
          canvas.width * 0.25,
          85 + waveB2,
          canvas.width * 0.75,
          25 - waveB1,
          canvas.width,
          50 + waveB2,
        );
        ctx.lineTo(canvas.width, 85 + waveB2);
        ctx.bezierCurveTo(
          canvas.width * 0.75,
          55 - waveB1,
          canvas.width * 0.25,
          115 + waveB2,
          0,
          95 + waveB1,
        );
        ctx.closePath();
        ctx.fill();

        // Ribbon C: Soft Cosmic Purple (Deep background accent)
        let gC = ctx.createLinearGradient(0, 35, 0, 135);
        gC.addColorStop(0, "rgba(155, 89, 182, 0.0)");
        gC.addColorStop(0.5, "rgba(155, 89, 182, 0.1)");
        gC.addColorStop(1, "rgba(155, 89, 182, 0.0)");
        ctx.fillStyle = gC;

        let waveC1 = Math.sin(auroraTime * 1.3) * 8;

        ctx.beginPath();
        ctx.moveTo(0, 75 + waveC1);
        ctx.bezierCurveTo(
          canvas.width * 0.45,
          105 - waveC1,
          canvas.width * 0.55,
          45 + waveC1,
          canvas.width,
          85 - waveC1,
        );
        ctx.lineTo(canvas.width, 105 - waveC1);
        ctx.bezierCurveTo(
          canvas.width * 0.55,
          65 + waveC1,
          canvas.width * 0.45,
          125 - waveC1,
          0,
          95 + waveC1,
        );
        ctx.closePath();
        ctx.fill();

        ctx.restore();

        // 3. Twinkling Celestial Pixel Stars
        for (let i = 0; i < 12; i++) {
          let starX = (i * 123 + 17) % canvas.width;
          let starY = (i * 37 + 11) % 110;
          let pulse = 0.3 + Math.sin(Date.now() / 350 + i) * 0.7;
          ctx.fillStyle = `rgba(255, 255, 255, ${0.15 + pulse * 0.5})`;
          ctx.fillRect(
            starX,
            starY,
            i % 4 === 0 ? 1.5 : 0.8,
            i % 4 === 0 ? 1.5 : 0.8,
          );
        }

        // 4. Elegant 4-Point Sparkle Stars (✦)
        let drawSparkleStar = (cx, cy, size, pulseSpeed, offset) => {
          let scale = 0.4 + Math.sin(Date.now() / pulseSpeed + offset) * 0.6;
          let s = size * scale;
          if (s <= 0.5) return;
          ctx.fillStyle = `rgba(165, 243, 252, ${0.3 + scale * 0.6})`;
          ctx.beginPath();
          ctx.moveTo(cx, cy - s);
          ctx.quadraticCurveTo(cx, cy, cx + s, cy);
          ctx.quadraticCurveTo(cx, cy, cx, cy + s);
          ctx.quadraticCurveTo(cx, cy, cx - s, cy);
          ctx.quadraticCurveTo(cx, cy, cx, cy - s);
          ctx.closePath();
          ctx.fill();
        };
        drawSparkleStar(240, 35, 6, 600, 0);
        drawSparkleStar(480, 25, 4.5, 850, 2);
        drawSparkleStar(110, 55, 5, 700, 4);
        drawSparkleStar(630, 45, 5.5, 900, 1);

        // 5. Slow Drifting Shooting Star (Diagonal gliding streak)
        let shootTime = Date.now() / 4000;
        let shootX = ((shootTime * 180) % (canvas.width + 250)) - 100;
        let shootY = 20 + shootX * 0.25;
        if (shootX > -50 && shootX < canvas.width + 50) {
          let cometGrad = ctx.createLinearGradient(
            shootX,
            shootY,
            shootX - 35,
            shootY - 9,
          );
          cometGrad.addColorStop(0, "rgba(255, 255, 255, 0.85)");
          cometGrad.addColorStop(0.3, "rgba(56, 189, 248, 0.4)");
          cometGrad.addColorStop(1, "rgba(56, 189, 248, 0.0)");
          ctx.strokeStyle = cometGrad;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(shootX, shootY);
          ctx.lineTo(shootX - 35, shootY - 9);
          ctx.stroke();
        }

        // 3. Layered Geometric Mountain Spires with Crisp Snowcaps
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = penFar;
        ctx.lineJoin = "round";

        let drawGeometricPeak = (peakX, peakY, width, height) => {
          // Base Mountain
          ctx.fillStyle = "#1c233a";
          ctx.beginPath();
          ctx.moveTo(peakX - width, 230);
          ctx.lineTo(peakX, peakY);
          ctx.lineTo(peakX + width, 230);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Geometric Snowcap
          let capHeight = height * 0.35;
          let capY = peakY + capHeight;
          let capLeftX = peakX - width * (capHeight / height);
          let capRightX = peakX + width * (capHeight / height);

          ctx.fillStyle = "#f8fafc";
          ctx.beginPath();
          ctx.moveTo(peakX, peakY);
          ctx.lineTo(capRightX, capY);
          ctx.lineTo(peakX + width * 0.1, capY + 3);
          ctx.lineTo(peakX, capY - 2);
          ctx.lineTo(peakX - width * 0.1, capY + 4);
          ctx.lineTo(capLeftX, capY);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        };

        drawGeometricPeak(150, 100, 140, 130);
        drawGeometricPeak(520, 80, 160, 150);
        drawGeometricPeak(330, 115, 120, 115);

        // 4. Subtle Arctic Valley Fog
        let fogGrad = ctx.createLinearGradient(0, 150, 0, 230);
        fogGrad.addColorStop(0, "rgba(224, 242, 254, 0)");
        fogGrad.addColorStop(1, "rgba(224, 242, 254, 0.08)");
        ctx.fillStyle = fogGrad;
        ctx.fillRect(0, 150, canvas.width, 80);

        // 5. Clean, Non-distracting Ancient Ruins Pillars
        ctx.fillStyle = "#111625";
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = penFar;

        let drawCleanPillar = (x, y, w, h) => {
          ctx.beginPath();
          ctx.rect(x, y, w, h);
          ctx.fill();
          ctx.stroke();

          // Slabs
          ctx.beginPath();
          ctx.rect(x - 3, y, w + 6, 6);
          ctx.fill();
          ctx.stroke();

          // Vertical fractures
          ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(x + w / 2, y + 6);
          ctx.lineTo(x + w / 2, y + h);
          ctx.stroke();
          ctx.strokeStyle = "#000000";
          ctx.lineWidth = penFar;
        };

        drawCleanPillar(45, 80, 18, 150);
        drawCleanPillar(715, 95, 18, 135);

        // 6. Crisp Geometric Glacial Ground Wall
        let groundWallGrad = ctx.createLinearGradient(0, 180, 0, 230);
        groundWallGrad.addColorStop(0, "#101b2b");
        groundWallGrad.addColorStop(1, "#080d16");
        ctx.fillStyle = groundWallGrad;

        ctx.beginPath();
        ctx.moveTo(0, 230);
        ctx.lineTo(0, 185);
        ctx.lineTo(220, 175);
        ctx.lineTo(460, 188);
        ctx.lineTo(620, 170);
        ctx.lineTo(canvas.width, 185);
        ctx.lineTo(canvas.width, 230);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Luminescent Ice Ledge Stroke
        ctx.strokeStyle = "#38bdf8";
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        ctx.moveTo(0, 185);
        ctx.lineTo(220, 175);
        ctx.lineTo(460, 188);
        ctx.lineTo(620, 170);
        ctx.lineTo(canvas.width, 185);
        ctx.stroke();

        // Fine White Ledge Highlight
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1.0;
        ctx.beginPath();
        ctx.moveTo(0, 184);
        ctx.lineTo(220, 174);
        ctx.lineTo(460, 187);
        ctx.lineTo(620, 169);
        ctx.lineTo(canvas.width, 184);
        ctx.stroke();
      } else if (tier === 2) {
        // 1. Soot and Ash Sky Gradient
        let skyGrad = ctx.createLinearGradient(0, 0, 0, 230);
        skyGrad.addColorStop(0, "#080201"); // Ashy soot
        skyGrad.addColorStop(0.6, "#240602"); // Crimson dust
        skyGrad.addColorStop(1, "#3f0c02"); // Horizon orange-red
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, canvas.width, 230);

        // 2. Billowing Volcanic Storm Clouds with Orange Rim-Lighting
        ctx.fillStyle = "#160f0f";
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 1.8;
        let drawBillow = (cx, cy, r) => {
          ctx.save();
          ctx.beginPath();
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          // Luminous under-glow highlighting
          ctx.strokeStyle = "#d35400";
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.arc(cx, cy, r - 1.5, Math.PI * 0.2, Math.PI * 0.8);
          ctx.stroke();
          ctx.restore();
        };
        drawBillow(100, 15, 30);
        drawBillow(140, 10, 40);
        drawBillow(190, 15, 30);
        drawBillow(600, 15, 35);
        drawBillow(650, 10, 42);

        // 3. Rising Volcanic Ash Embers (Deterministic lightweight loop)
        for (let i = 0; i < 15; i++) {
          let emberX =
            ((i * 97 + Date.now() * 0.05) % (canvas.width + 20)) - 10;
          let emberY = 210 - ((i * 41 + Date.now() * 0.12) % 180);
          let size = 1.5 + (i % 3) * 0.8;
          let alpha = 0.2 + (i % 4) * 0.2;
          ctx.fillStyle = `rgba(230, 126, 34, ${alpha})`;
          ctx.fillRect(emberX, emberY, size, size);
        }

        // Set outlining defaults for background structures
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = penFar;
        ctx.lineJoin = "round";

        // 4. Far Left Dormant Volcano with Shaded Side Profile
        ctx.fillStyle = "#2d0b06";
        ctx.beginPath();
        ctx.moveTo(-50, 230);
        ctx.lineTo(80, 130);
        ctx.lineTo(110, 130);
        ctx.lineTo(240, 230);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Dimensional Shading on the right slope
        ctx.fillStyle = "#1e0402";
        ctx.beginPath();
        ctx.moveTo(95, 130);
        ctx.lineTo(240, 230);
        ctx.lineTo(110, 130);
        ctx.closePath();
        ctx.fill();

        // 5. Active Center-Right Volcano with Erupting Caldera Pool
        ctx.fillStyle = "#2d0b06";
        ctx.beginPath();
        ctx.moveTo(220, 230);
        ctx.lineTo(330, 95); // Left caldera lip
        ctx.lineTo(370, 95); // Right caldera lip
        ctx.lineTo(480, 230);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Dimensional shading on the left slope of Active Peak
        ctx.fillStyle = "#1e0402";
        ctx.beginPath();
        ctx.moveTo(330, 95);
        ctx.lineTo(220, 230);
        ctx.lineTo(350, 95);
        ctx.closePath();
        ctx.fill();

        // Active boiling crater core (glowing pool inside caldera)
        ctx.fillStyle = "#ff2200";
        ctx.beginPath();
        ctx.ellipse(350, 95, 20, 4, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // 6. Erupting Magma Fountain (Spewing droplets loop)
        let erTime = Date.now() / 1200;
        let erX = 350;
        let erY = 95;
        for (let i = 0; i < 6; i++) {
          let tSeed = (erTime + i * 1.5) % 1.0;
          let dropX = erX + Math.sin(i * 12 + erTime * 0.5) * 35 * tSeed;
          let dropY = erY - 55 * Math.sin(tSeed * Math.PI) + 10 * tSeed;
          let r = 2.0 * (1.0 - tSeed * 0.4);
          if (tSeed > 0.1) {
            ctx.fillStyle = i % 2 === 0 ? "#ffd700" : "#ff5500";
            ctx.strokeStyle = "#000000";
            ctx.lineWidth = 1.0;
            ctx.beginPath();
            ctx.arc(dropX, dropY, r, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
          }
        }

        // 7. Winding Molten Fissure Cracks (Static paths, creeping inner flow)
        let drawMoltenFissure = (startX, startY, segmentPoints, delay) => {
          ctx.save();

          // Outer solid orange crack
          ctx.strokeStyle = "#e67e22";
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.moveTo(startX, startY);
          segmentPoints.forEach((pt) => ctx.lineTo(pt.x, pt.y));
          ctx.stroke();

          // Viscous, slow-creeping flow inside crack (Slowed divisor to 110)
          ctx.strokeStyle = "#ffd700";
          ctx.lineWidth = 0.8;
          ctx.setLineDash([8, 12]);
          ctx.lineDashOffset = -(Date.now() / 110 + delay * 15) % 20;
          ctx.beginPath();
          ctx.moveTo(startX, startY);
          segmentPoints.forEach((pt) => ctx.lineTo(pt.x, pt.y));
          ctx.stroke();

          ctx.restore();
        };

        drawMoltenFissure(
          100,
          135,
          [
            { x: 85, y: 155 },
            { x: 95, y: 175 },
            { x: 75, y: 195 },
            { x: 80, y: 230 },
          ],
          0,
        );
        drawMoltenFissure(
          350,
          98,
          [
            { x: 360, y: 125 },
            { x: 345, y: 155 },
            { x: 370, y: 185 },
            { x: 355, y: 230 },
          ],
          2,
        );

        // 8. Branching Molten Lava Waterfalls (Static rock channels, creeping flow)
        let drawWaterfall = (tx, ty, bx, by, delay) => {
          ctx.save();
          let ctrlX = (tx + bx) / 2;
          let ctrlY = (ty + by) / 2;

          // Rigid outer black outlined channel
          ctx.strokeStyle = "#000000";
          ctx.lineWidth = 6.5;
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(tx, ty);
          ctx.quadraticCurveTo(ctrlX, ctrlY, bx, by);
          ctx.stroke();

          // Rigid orange lava stream
          ctx.strokeStyle = "#ff4500";
          ctx.lineWidth = 4.5;
          ctx.beginPath();
          ctx.moveTo(tx, ty);
          ctx.quadraticCurveTo(ctrlX, ctrlY, bx, by);
          ctx.stroke();

          // Heavy creeping liquid core highlight (Slowed divisor to 80)
          ctx.strokeStyle = "#ffd700";
          ctx.lineWidth = 2.0;
          ctx.setLineDash([12, 18]);
          ctx.lineDashOffset = -(Date.now() / 80 + delay * 10) % 30;
          ctx.beginPath();
          ctx.moveTo(tx, ty);
          ctx.quadraticCurveTo(ctrlX, ctrlY, bx, by);
          ctx.stroke();

          ctx.restore();
        };
        drawWaterfall(350, 95, 330, 150, 0);
        drawWaterfall(330, 150, 310, 230, 2);
        drawWaterfall(330, 150, 360, 230, 4);

        // 9. Mid-Ground Obsidian Basalt Crags
        ctx.fillStyle = "#160402";
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = penFar;

        ctx.beginPath();
        ctx.moveTo(0, 230);
        ctx.lineTo(80, 160);
        ctx.lineTo(130, 185);
        ctx.lineTo(220, 140);
        ctx.lineTo(290, 195);
        ctx.lineTo(410, 150);
        ctx.lineTo(490, 210);
        ctx.lineTo(600, 135);
        ctx.lineTo(680, 180);
        ctx.lineTo(800, 115);
        ctx.lineTo(canvas.width, 230);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // 10. Hexagonal Basalt Pillar Clusters (Edges)
        let drawBasaltCluster = (baseX, height, width, count) => {
          ctx.save();
          ctx.fillStyle = "#120302";
          ctx.strokeStyle = "#000000";
          ctx.lineWidth = penFar;

          for (let i = 0; i < count; i++) {
            let colX = baseX + i * (width * 0.7);
            let colH =
              height - Math.sin(i * 1.5) * 20 - (i % 2 === 0 ? 10 : -10);
            let colY = 230 - colH;

            // Hexagonal flat top cap
            ctx.beginPath();
            ctx.moveTo(colX - width / 2, colY);
            ctx.lineTo(colX - width / 4, colY - 5);
            ctx.lineTo(colX + width / 4, colY - 5);
            ctx.lineTo(colX + width / 2, colY);
            ctx.lineTo(colX + width / 4, colY + 3);
            ctx.lineTo(colX - width / 4, colY + 3);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Column shaft
            ctx.beginPath();
            ctx.rect(colX - width / 2, colY, width, colH);
            ctx.fill();
            ctx.stroke();

            // Column edge highlight
            ctx.strokeStyle = "rgba(255, 255, 255, 0.04)";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(colX, colY + 3);
            ctx.lineTo(colX, 230);
            ctx.stroke();
            ctx.strokeStyle = "#000000";
            ctx.lineWidth = penFar;
          }
          ctx.restore();
        };
        drawBasaltCluster(20, 95, 16, 4);
        drawBasaltCluster(730, 110, 16, 4);

        // 11. Slow Undulating Molten Lava River (Subtle, high-viscosity basaltic wave)
        let lavaBaseGrad = ctx.createLinearGradient(0, 215, 0, 230);
        lavaBaseGrad.addColorStop(0, "#ffd700");
        lavaBaseGrad.addColorStop(0.3, "#ff5500");
        lavaBaseGrad.addColorStop(1, "#3c0401");
        ctx.fillStyle = lavaBaseGrad;
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 2.0;

        ctx.beginPath();
        ctx.moveTo(0, 230);
        for (let x = 0; x <= canvas.width; x += 30) {
          // Locked wave to tight 1.0px height to avoid fast water look
          let waveY = 224 + Math.sin(Date.now() / 500 + x * 0.06) * 1.0;
          ctx.lineTo(x, waveY);
        }
        ctx.lineTo(canvas.width, 230);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // 12. Spawning & Deflating Magma Bubble Domes
        for (let i = 0; i < 3; i++) {
          let bubbleX =
            ((i * 240 + Date.now() * 0.02) % (canvas.width - 60)) + 30;
          let bubbleCycle = (Date.now() / 600 + i * 2) % Math.PI;
          let bubbleR = 5.0 * Math.sin(bubbleCycle);
          let bubbleY = 224 + Math.sin(Date.now() / 500 + bubbleX * 0.06) * 1.0;
          if (bubbleR > 1.0) {
            ctx.save();
            ctx.fillStyle = "#ff5500";
            ctx.strokeStyle = "#000000";
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.arc(bubbleX, bubbleY, bubbleR, Math.PI, 0); // half circle bubble dome
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            // Specular light highlight on the dome
            ctx.fillStyle = "#ffd700";
            ctx.beginPath();
            ctx.arc(
              bubbleX - bubbleR * 0.3,
              bubbleY - bubbleR * 0.4,
              bubbleR * 0.2,
              0,
              Math.PI * 2,
            );
            ctx.fill();
            ctx.restore();
          }
        }
      } else if (tier === 3) {
        let mistGrad = ctx.createLinearGradient(0, 170, 0, 230);
        mistGrad.addColorStop(0, "rgba(39, 174, 96, 0)");
        mistGrad.addColorStop(1, "rgba(39, 174, 96, 0.12)");
        ctx.fillStyle = mistGrad;
        ctx.fillRect(0, 170, canvas.width, 60);
        ctx.fillStyle = "#0c1f13";
        ctx.beginPath();
        ctx.moveTo(0, 230);
        ctx.quadraticCurveTo(80, 180, 160, 200);
        ctx.quadraticCurveTo(240, 175, 340, 210);
        ctx.quadraticCurveTo(460, 160, 580, 205);
        ctx.quadraticCurveTo(680, 190, 800, 230);
        ctx.fill();
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = penFar;
        ctx.stroke();
        ctx.fillStyle = "#07140c";
        ctx.beginPath();
        ctx.ellipse(50, 170, 80, 50, 0, 0, Math.PI * 2);
        ctx.ellipse(750, 160, 90, 60, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      } else if (tier === 4) {
        let nebula = ctx.createRadialGradient(
          canvas.width / 2,
          100,
          5,
          canvas.width / 2,
          100,
          120,
        );
        nebula.addColorStop(0, "rgba(155, 89, 182, 0.3)");
        nebula.addColorStop(1, "rgba(155, 89, 182, 0)");
        ctx.fillStyle = nebula;
        ctx.beginPath();
        ctx.arc(canvas.width / 2, 100, 120, 0, Math.PI * 2);
        ctx.fill();
        let starPulse = Math.sin(Date.now() / 300) * 0.4 + 0.6;
        ctx.fillStyle = `rgba(255, 255, 255, ${0.4 * starPulse})`;
        for (let i = 0; i < 30; i++) {
          ctx.fillRect(
            (i * 59 + 23) % canvas.width,
            (i * 29 + 11 + 50) % 190,
            1.5,
            1.5,
          );
        }
        ctx.fillStyle = "#100221";
        let hover = Math.sin(Date.now() / 400) * 4;
        ctx.beginPath();
        ctx.moveTo(120, 190 + hover);
        ctx.lineTo(140, 100 + hover);
        ctx.lineTo(160, 190 + hover);
        ctx.lineTo(140, 215 + hover);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = penFar;
        ctx.stroke();
        ctx.fillStyle = "#0b0116";
        ctx.beginPath();
        ctx.moveTo(520, 200 - hover);
        ctx.lineTo(535, 125 - hover);
        ctx.lineTo(550, 200 - hover);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = "#130426";
        ctx.beginPath();
        ctx.ellipse(
          320,
          170 + hover * 1.5,
          45,
          12,
          Math.PI / 12,
          0,
          Math.PI * 2,
        );
        ctx.ellipse(
          650,
          140 - hover * 1.2,
          35,
          10,
          -Math.PI / 8,
          0,
          Math.PI * 2,
        );
        ctx.fill();
        ctx.stroke();
      } else if (tier === 5) {
        let goldenGlow = ctx.createLinearGradient(0, 0, 0, 230);
        goldenGlow.addColorStop(0, "#1c1400");
        goldenGlow.addColorStop(0.6, "#2d1f05");
        goldenGlow.addColorStop(1, "#120a00");
        ctx.fillStyle = goldenGlow;
        ctx.fillRect(0, 0, canvas.width, 230);
        let gearAngle = Date.now() / 4000;
        ctx.save();
        ctx.translate(canvas.width / 2 + 100, 80);
        ctx.rotate(gearAngle);
        ctx.strokeStyle = "#f1c40f";
        ctx.lineWidth = 1.5;
        ctx.fillStyle = "rgba(241, 196, 15, 0.05)";
        ctx.beginPath();
        ctx.arc(0, 0, 45, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        for (let i = 0; i < 8; i++) {
          ctx.rotate(Math.PI / 4);
          ctx.fillRect(-6, -55, 12, 10);
          ctx.strokeRect(-6, -55, 12, 10);
        }
        ctx.restore();
        ctx.fillStyle = "#2d1a04";
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = penFar;
        let hover = Math.sin(Date.now() / 350) * 5;
        ctx.beginPath();
        ctx.roundRect(140, 40 + hover, 24, 110, [3]);
        ctx.roundRect(580, 50 - hover, 20, 95, [3]);
        ctx.fill();
        ctx.stroke();
      } else {
        let cyberSky = ctx.createLinearGradient(0, 0, 0, 230);
        cyberSky.addColorStop(0, "#01040a");
        cyberSky.addColorStop(1, "#000000");
        ctx.fillStyle = cyberSky;
        ctx.fillRect(0, 0, canvas.width, 230);
        ctx.strokeStyle = "rgba(52, 152, 219, 0.25)";
        ctx.lineWidth = 1.0;
        let horizonY = 150;
        for (let i = -100; i < canvas.width + 100; i += 60) {
          ctx.beginPath();
          ctx.moveTo(i, horizonY);
          ctx.lineTo(i * 1.8 - canvas.width * 0.4, 230);
          ctx.stroke();
        }
        ctx.fillStyle = "rgba(46, 204, 113, 0.45)";
        for (let i = 0; i < 15; i++) {
          let rx = (i * 57) % canvas.width;
          let ry = ((Date.now() / 6 + i * 35) % 190) + 40;
          ctx.fillRect(rx, ry, 1.2, 12);
        }
      }
    }

    // 2. BACKGROUND SCENERY & VEGETATION (Every element outlined)
    window.bgScenery.forEach((s) => {
      s.seed = s.seed || Math.random();
      let ts = s.size;
      ctx.save();
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = penBgScenery * ts;
      ctx.lineJoin = "round";

      if (
        window.playerStats.isCrucibleMode ||
        window.playerStats.isPrestigeBossMode ||
        window.playerStats.isUberBoss
      ) {
        ctx.restore();
        return;
      }
      if (window.playerStats.isDungeonMode) {
        let isCeiling = s.seed < 0.45;
        if (isCeiling) {
          let h = 35 + s.seed * 50 * ts;
          let w = 12 + s.seed * 22 * ts;
          if (window.playerStats.currentDungeon === "equip") {
            // Hanging iron structural girder supporting the roof
            ctx.fillStyle = "#1e242c";
            ctx.beginPath();
            ctx.rect(s.x - 4, 0, 8, h);
            ctx.fill();
            ctx.stroke();
            // Horizontal cross brackets along the structural shaft
            ctx.fillStyle = "#0c0d12";
            for (let gy = 10; gy < h; gy += 15) {
              ctx.beginPath();
              ctx.rect(s.x - 6, gy, 12, 3);
              ctx.fill();
              ctx.stroke();
            }
          } else {
            let color =
              window.playerStats.currentDungeon === "gold"
                ? "#332211"
                : "#1b2d1f";
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.moveTo(s.x - w / 2, 0);
            ctx.lineTo(s.x, h);
            ctx.lineTo(s.x + w / 2, 0);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            ctx.strokeStyle = "rgba(255,255,255,0.06)";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(s.x, h);
            ctx.lineTo(s.x - w / 4, 0);
            ctx.stroke();
          }
        } else {
          let h = 22 + s.seed * 45 * ts;
          let w = 10 + s.seed * 18 * ts;
          if (window.playerStats.currentDungeon === "equip") {
            // Vertical floor support pillar
            ctx.fillStyle = "#1e242c";
            ctx.beginPath();
            ctx.rect(s.x - 6, 230 - h, 12, h);
            ctx.fill();
            ctx.stroke();
            // Cast-iron bolted plates at base
            ctx.fillStyle = "#0c0d12";
            ctx.beginPath();
            ctx.rect(s.x - 8, 224, 16, 6);
            ctx.fill();
            ctx.stroke();
          } else {
            let color =
              window.playerStats.currentDungeon === "gold"
                ? "#261a0c"
                : "#121f16";
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.moveTo(s.x - w / 2, 230);
            ctx.lineTo(s.x, 230 - h);
            ctx.lineTo(s.x + w / 2, 230);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            ctx.strokeStyle = "rgba(255,255,255,0.04)";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(s.x, 230 - h);
            ctx.lineTo(s.x + w / 4, 230);
            ctx.stroke();
          }
        }
      } else {
        if (s.type === "tree") {
          let tx = s.x,
            ty = s.y - 68 * ts; // Raised canopy height from 40 to 68 to make trees towering!
          if (tier === 0) {
            if (s.seed < 0.35) {
              // --- THE ELDER OAK (Fantasy Stylized - Thick & Robust) ---
              // Ancient thick trunk with root flares
              ctx.fillStyle = "#3b220c"; // Rich warm bark
              ctx.beginPath();
              ctx.moveTo(tx - 7 * ts, s.y);
              ctx.lineTo(tx - 3.5 * ts, ty + 20 * ts);
              // Left heavy fork
              ctx.quadraticCurveTo(
                tx - 12 * ts,
                ty + 12 * ts,
                tx - 18 * ts,
                ty + 4 * ts,
              );
              ctx.lineTo(tx - 14 * ts, ty + 2 * ts);
              ctx.quadraticCurveTo(tx - 4 * ts, ty + 10 * ts, tx, ty + 15 * ts);
              // Right heavy fork
              ctx.quadraticCurveTo(
                tx + 4 * ts,
                ty + 10 * ts,
                tx + 14 * ts,
                ty + 2 * ts,
              );
              ctx.lineTo(tx + 18 * ts, ty + 4 * ts);
              ctx.quadraticCurveTo(
                tx + 12 * ts,
                ty + 12 * ts,
                tx + 3.5 * ts,
                ty + 20 * ts,
              );
              ctx.lineTo(tx + 7 * ts, s.y);
              ctx.closePath();
              ctx.fill();
              ctx.stroke();

              // Strong bark details
              ctx.strokeStyle = "#1a0f07";
              ctx.lineWidth = 1.8 * ts;
              ctx.beginPath();
              ctx.moveTo(tx - 2 * ts, s.y - 3 * ts);
              ctx.quadraticCurveTo(
                tx - 3 * ts,
                ty + 30 * ts,
                tx - 1 * ts,
                ty + 22 * ts,
              );
              ctx.moveTo(tx + 2 * ts, s.y - 8 * ts);
              ctx.quadraticCurveTo(tx + 1 * ts, ty + 32 * ts, tx, ty + 24 * ts);
              ctx.stroke();
              ctx.strokeStyle = "#000000"; // reset
              ctx.lineWidth = penBgScenery * ts;

              // Leafy Canopy Clumps (Thicker, overlapping foliage clouds)
              let drawCanopyClump = (cx, cy, r, c1, c2) => {
                let foliageGrad = ctx.createRadialGradient(
                  cx - r * 0.3,
                  cy - r * 0.3,
                  1,
                  cx,
                  cy,
                  r,
                );
                foliageGrad.addColorStop(0, c1);
                foliageGrad.addColorStop(1, c2);
                ctx.fillStyle = foliageGrad;
                ctx.beginPath();
                ctx.arc(cx, cy, r, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
              };

              // Base depth layers (Large and voluminous)
              drawCanopyClump(tx, ty - 12 * ts, 36 * ts, "#123318", "#081d0c");
              drawCanopyClump(
                tx - 22 * ts,
                ty - 2 * ts,
                28 * ts,
                "#123318",
                "#081d0c",
              );
              drawCanopyClump(
                tx + 22 * ts,
                ty - 2 * ts,
                28 * ts,
                "#123318",
                "#081d0c",
              );

              // Mid-green body
              drawCanopyClump(tx, ty - 18 * ts, 30 * ts, "#1e8449", "#114620");
              drawCanopyClump(
                tx - 16 * ts,
                ty - 6 * ts,
                22 * ts,
                "#1e8449",
                "#114620",
              );
              drawCanopyClump(
                tx + 16 * ts,
                ty - 6 * ts,
                22 * ts,
                "#1e8449",
                "#114620",
              );

              // High-fidelity highlights
              drawCanopyClump(
                tx - 8 * ts,
                ty - 24 * ts,
                16 * ts,
                "#58d68d",
                "#145a32",
              );
              drawCanopyClump(
                tx + 8 * ts,
                ty - 24 * ts,
                16 * ts,
                "#58d68d",
                "#145a32",
              );
            } else if (s.seed < 0.7) {
              // --- HIGHLAND SPRUCE (Dense, Wide, & Majestic) ---
              // Sturdy thick trunk
              ctx.fillStyle = "#2d1a04";
              ctx.beginPath();
              ctx.rect(tx - 4 * ts, ty + 10 * ts, 8 * ts, s.y - (ty + 10 * ts));
              ctx.fill();
              ctx.stroke();

              // Wide scalloped boughs (Overlapping dense pine layers)
              let drawPineBough = (by, w, h, c1, c2) => {
                ctx.save();
                let boughGrad = ctx.createLinearGradient(
                  tx - w,
                  by,
                  tx + w,
                  by + h,
                );
                boughGrad.addColorStop(0, c1);
                boughGrad.addColorStop(1, c2);
                ctx.fillStyle = boughGrad;

                ctx.beginPath();
                ctx.moveTo(tx, by);
                ctx.lineTo(tx + w, by + h);
                // Beautiful scalloped branch needles
                let toothCount = 7;
                for (let i = 0; i <= toothCount; i++) {
                  let ratio = i / toothCount;
                  let kx = tx + w - ratio * w * 2;
                  let ky =
                    by +
                    h -
                    Math.sin(ratio * Math.PI) * (h * 0.2) +
                    (i % 2 === 0 ? 3 * ts : -2 * ts);
                  ctx.lineTo(kx, ky);
                }
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
                ctx.restore();
              };

              // Tier 1 (Fat Base)
              drawPineBough(
                ty + 15 * ts,
                38 * ts,
                20 * ts,
                "#11381c",
                "#051308",
              );
              // Tier 2 (Lower Mid)
              drawPineBough(
                ty - 2 * ts,
                30 * ts,
                16 * ts,
                "#195c2b",
                "#09240f",
              );
              // Tier 3 (Upper Mid)
              drawPineBough(
                ty - 16 * ts,
                22 * ts,
                13 * ts,
                "#228b22",
                "#0c3b17",
              );
              // Tier 4 (Top Spire)
              drawPineBough(
                ty - 28 * ts,
                14 * ts,
                11 * ts,
                "#58d68d",
                "#145229",
              );

              // Hanging pine cones (Earthy brown droplets)
              ctx.fillStyle = "#5c3a21";
              let drawPineCone = (cx, cy) => {
                ctx.beginPath();
                ctx.ellipse(cx, cy, 2.2 * ts, 4.2 * ts, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
              };
              drawPineCone(tx - 18 * ts, ty + 28 * ts);
              drawPineCone(tx + 18 * ts, ty + 28 * ts);
              drawPineCone(tx - 12 * ts, ty + 10 * ts);
              drawPineCone(tx + 12 * ts, ty + 10 * ts);
            } else {
              // --- GOLDEN WHISPERING ASPEN (Fluffy Gold Clouds) ---
              // Thicker white birch trunk with characteristic bark eye knots
              ctx.fillStyle = "#f1f5f9"; // Solid slate white
              ctx.beginPath();
              ctx.rect(tx - 3 * ts, ty - 15 * ts, 6 * ts, s.y - (ty - 15 * ts));
              ctx.fill();
              ctx.stroke();

              // Black birch knots
              ctx.fillStyle = "#1e293b";
              for (let kY = ty - 10 * ts; kY < s.y - 10 * ts; kY += 14 * ts) {
                ctx.beginPath();
                ctx.ellipse(
                  tx - 3 * ts,
                  kY,
                  2.5 * ts,
                  1.2 * ts,
                  0,
                  0,
                  Math.PI * 2,
                );
                ctx.ellipse(
                  tx + 3 * ts,
                  kY + 7 * ts,
                  2.5 * ts,
                  1.2 * ts,
                  0,
                  0,
                  Math.PI * 2,
                );
                ctx.fill();
              }

              // Main branches reaching up into the canopy
              ctx.strokeStyle = "#475569";
              ctx.lineWidth = 1.8 * ts;
              ctx.beginPath();
              ctx.moveTo(tx, ty - 5 * ts);
              ctx.quadraticCurveTo(
                tx - 10 * ts,
                ty - 15 * ts,
                tx - 16 * ts,
                ty - 24 * ts,
              );
              ctx.moveTo(tx, ty - 10 * ts);
              ctx.quadraticCurveTo(
                tx + 10 * ts,
                ty - 20 * ts,
                tx + 16 * ts,
                ty - 28 * ts,
              );
              ctx.stroke();
              ctx.strokeStyle = "#000000"; // reset
              ctx.lineWidth = penBgScenery * ts;

              // High-fidelity layered autumn cloud clusters (Matches the cozy Oak styling!)
              let drawAspenClump = (cx, cy, r, c1, c2) => {
                let foliageGrad = ctx.createRadialGradient(
                  cx - r * 0.3,
                  cy - r * 0.3,
                  1,
                  cx,
                  cy,
                  r,
                );
                foliageGrad.addColorStop(0, c1);
                foliageGrad.addColorStop(1, c2);
                ctx.fillStyle = foliageGrad;
                ctx.beginPath();
                ctx.arc(cx, cy, r, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
              };

              // Base Warm Amber Layer
              drawAspenClump(tx, ty - 14 * ts, 30 * ts, "#d35400", "#7e2200");
              drawAspenClump(
                tx - 18 * ts,
                ty - 6 * ts,
                22 * ts,
                "#d35400",
                "#7e2200",
              );
              drawAspenClump(
                tx + 18 * ts,
                ty - 6 * ts,
                22 * ts,
                "#d35400",
                "#7e2200",
              );

              // Bright Golden-Orange Mid-Layer
              drawAspenClump(tx, ty - 20 * ts, 24 * ts, "#f39c12", "#ca6f1e");
              drawAspenClump(
                tx - 14 * ts,
                ty - 10 * ts,
                18 * ts,
                "#f39c12",
                "#ca6f1e",
              );
              drawAspenClump(
                tx + 14 * ts,
                ty - 10 * ts,
                18 * ts,
                "#f39c12",
                "#ca6f1e",
              );

              // Sun-kissed Yellow Highlights
              drawAspenClump(
                tx - 6 * ts,
                ty - 26 * ts,
                13 * ts,
                "#f9e79f",
                "#f1c40f",
              );
              drawAspenClump(
                tx + 6 * ts,
                ty - 26 * ts,
                13 * ts,
                "#f9e79f",
                "#f1c40f",
              );
            }
          } else if (tier === 1) {
            if (s.seed < 0.55) {
              // --- FROZEN ALPINE SPRUCE (Snow-covered evergreens) ---
              ctx.fillStyle = "#1c0d02"; // Dark wood
              ctx.beginPath();
              ctx.rect(tx - 3 * ts, ty + 10 * ts, 6 * ts, s.y - (ty + 10 * ts));
              ctx.fill();
              ctx.stroke();

              let drawSnowyBough = (by, w, h, foliageColor, snowColor) => {
                ctx.save();
                // 1. Dark Pine Needles Base
                ctx.fillStyle = foliageColor;
                ctx.beginPath();
                ctx.moveTo(tx, by);
                ctx.lineTo(tx + w, by + h);
                let toothCount = 5;
                for (let i = 0; i <= toothCount; i++) {
                  let ratio = i / toothCount;
                  let kx = tx + w - ratio * w * 2;
                  let ky =
                    by +
                    h -
                    Math.sin(ratio * Math.PI) * (h * 0.2) +
                    (i % 2 === 0 ? 2 * ts : -2 * ts);
                  ctx.lineTo(kx, ky);
                }
                ctx.closePath();
                ctx.fill();
                ctx.stroke();

                // 2. Thick Snow Blanket overlay
                ctx.fillStyle = snowColor;
                ctx.beginPath();
                ctx.moveTo(tx, by);
                ctx.lineTo(tx + w * 0.8, by + h * 0.8);
                ctx.quadraticCurveTo(
                  tx,
                  by + h * 0.4,
                  tx - w * 0.8,
                  by + h * 0.8,
                );
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
                ctx.restore();
              };

              // 4 Overlapping thick snow layers
              drawSnowyBough(
                ty + 15 * ts,
                32 * ts,
                16 * ts,
                "#09240f",
                "#cbd5e1",
              ); // bottom shadow
              drawSnowyBough(
                ty + 13 * ts,
                28 * ts,
                14 * ts,
                "#0c3b17",
                "#ffffff",
              ); // bottom snow
              drawSnowyBough(
                ty - 2 * ts,
                22 * ts,
                12 * ts,
                "#0c3b17",
                "#cbd5e1",
              ); // mid shadow
              drawSnowyBough(
                ty - 4 * ts,
                18 * ts,
                10 * ts,
                "#1a5e2f",
                "#ffffff",
              ); // mid snow
              drawSnowyBough(
                ty - 16 * ts,
                12 * ts,
                8 * ts,
                "#1a5e2f",
                "#ffffff",
              ); // top
            } else {
              // --- FROZEN DECIDUOUS LARCH ---
              ctx.fillStyle = "#1c0d02";
              ctx.beginPath();
              ctx.moveTo(tx - 2 * ts, s.y);
              ctx.lineTo(tx - 0.5 * ts, ty + 10 * ts);
              ctx.quadraticCurveTo(tx - 8 * ts, ty, tx - 14 * ts, ty - 10 * ts);
              ctx.moveTo(tx + 2 * ts, s.y);
              ctx.lineTo(tx + 0.5 * ts, ty + 10 * ts);
              ctx.quadraticCurveTo(tx + 8 * ts, ty, tx + 14 * ts, ty - 10 * ts);
              ctx.stroke();
              ctx.fill();

              // Ice-crystals clumps on branches
              let drawIceSpire = (ix, iy, r) => {
                let grad = ctx.createRadialGradient(ix, iy, 1, ix, iy, r);
                grad.addColorStop(0, "#ffffff");
                grad.addColorStop(1, "rgba(56, 189, 248, 0.65)");
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.arc(ix, iy, r, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
              };
              drawIceSpire(tx - 14 * ts, ty - 10 * ts, 8 * ts);
              drawIceSpire(tx + 14 * ts, ty - 10 * ts, 8 * ts);
              drawIceSpire(tx, ty + 5 * ts, 10 * ts);
            }
          } else if (tier === 2) {
            if (s.seed < 0.5) {
              ctx.fillStyle = "#110502";
              ctx.beginPath();
              ctx.moveTo(tx - 12 * ts, 230);
              ctx.lineTo(tx, ty - 15 * ts);
              ctx.lineTo(tx + 12 * ts, 230);
              ctx.fill();
              ctx.stroke();
            } else {
              ctx.fillStyle = "#210904";
              ctx.beginPath();
              ctx.moveTo(tx - 32 * ts, 230);
              ctx.lineTo(tx - 12 * ts, ty + 14 * ts);
              ctx.lineTo(tx - 6 * ts, ty + 7 * ts);
              ctx.lineTo(tx - 5 * ts, ty + 10 * ts);
              ctx.lineTo(tx + 5 * ts, ty + 10 * ts);
              ctx.lineTo(tx + 8 * ts, ty + 13 * ts);
              ctx.lineTo(tx + 32 * ts, 230);
              ctx.closePath();
              ctx.fill();
              ctx.stroke();
            }
          } else if (tier === 3) {
            if (s.seed < 0.5) {
              ctx.fillStyle = "#5c503b";
              ctx.beginPath();
              ctx.rect(tx - 4 * ts, ty, 8 * ts, 40 * ts);
              ctx.fill();
              ctx.stroke();
              ctx.fillStyle = "#144222";
              ctx.beginPath();
              ctx.ellipse(tx, ty, 20 * ts, 15 * ts, 0, 0, Math.PI * 2);
              ctx.fill();
              ctx.stroke();
              ctx.fillStyle = "#1b5e30";
              ctx.beginPath();
              ctx.ellipse(
                tx - 6 * ts,
                ty + 5 * ts,
                15 * ts,
                10 * ts,
                0,
                0,
                Math.PI * 2,
              );
              ctx.fill();
              ctx.stroke();
              ctx.strokeStyle = "#3e321e";
              ctx.lineWidth = 3 * ts;
              ctx.beginPath();
              ctx.moveTo(tx - 4 * ts, 210);
              ctx.quadraticCurveTo(tx - 12 * ts, 220, tx - 18 * ts, 230);
              ctx.moveTo(tx + 4 * ts, 210);
              ctx.quadraticCurveTo(tx + 12 * ts, 220, tx + 18 * ts, 230);
              ctx.stroke();
            } else {
              ctx.fillStyle = "#4a3c28";
              ctx.beginPath();
              ctx.rect(tx - 3 * ts, ty, 6 * ts, 40 * ts);
              ctx.fill();
              ctx.stroke();
              ctx.fillStyle = "#0c2b18";
              ctx.beginPath();
              ctx.arc(tx, ty, 16 * ts, 0, Math.PI * 2);
              ctx.fill();
              ctx.stroke();
              ctx.strokeStyle = "#1b4f30";
              ctx.lineWidth = 2 * ts;
              ctx.beginPath();
              ctx.moveTo(tx - 10 * ts, ty);
              ctx.lineTo(tx - 10 * ts, ty + 25 * ts);
              ctx.moveTo(tx + 8 * ts, ty + 3 * ts);
              ctx.lineTo(tx + 8 * ts, ty + 30 * ts);
              ctx.stroke();
            }
          } else if (tier === 4) {
            ctx.fillStyle = "#4a154b";
            let hover = Math.sin(Date.now() / 200 + s.seed * 100) * 4;
            ctx.beginPath();
            ctx.moveTo(tx, ty + hover - 12 * ts);
            ctx.lineTo(tx + 12 * ts, ty + hover + 8 * ts);
            ctx.lineTo(tx, ty + hover + 28 * ts);
            ctx.lineTo(tx - 12 * ts, ty + hover + 8 * ts);
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = "#8e44ad";
            ctx.beginPath();
            ctx.moveTo(tx, ty + hover - 12 * ts);
            ctx.lineTo(tx + 5 * ts, ty + hover + 8 * ts);
            ctx.lineTo(tx, ty + hover + 28 * ts);
            ctx.fill();
            ctx.stroke();
          }
        } else {
          let bx = s.x,
            by = s.y,
            bs = ts;
          if (tier === 0) {
            if (s.seed < 0.4) {
              ctx.fillStyle = "#113f21";
              ctx.beginPath();
              ctx.arc(bx, by, 16 * bs, 0, Math.PI * 2);
              ctx.fill();
              ctx.stroke();
              ctx.fillStyle = "#1e8449";
              ctx.beginPath();
              ctx.arc(bx + 8 * bs, by, 12 * bs, 0, Math.PI * 2);
              ctx.fill();
              ctx.stroke();
              ctx.beginPath();
              ctx.arc(bx - 8 * bs, by, 12 * bs, 0, Math.PI * 2);
              ctx.fill();
              ctx.stroke();
              ctx.fillStyle = "#e74c3c";
              ctx.beginPath();
              ctx.arc(bx - 6 * bs, by - 4 * bs, 2, 0, Math.PI * 2);
              ctx.arc(bx + 4 * bs, by + 2 * bs, 2, 0, Math.PI * 2);
              ctx.arc(bx + 8 * bs, by - 6 * bs, 2, 0, Math.PI * 2);
              ctx.fill();
              ctx.stroke();
            } else if (s.seed < 0.75) {
              ctx.fillStyle = "#27ae60";
              for (let i = 0; i < 5; i++) {
                ctx.save();
                ctx.translate(bx, by);
                ctx.rotate(-Math.PI / 4 + (i * Math.PI) / 8);
                ctx.beginPath();
                ctx.ellipse(0, -10 * bs, 4 * bs, 12 * bs, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
                ctx.restore();
              }
            } else {
              ctx.fillStyle = "#1e3d29";
              ctx.beginPath();
              ctx.arc(bx, by, 14 * bs, 0, Math.PI * 2);
              ctx.fill();
              ctx.stroke();
              ctx.fillStyle = "#e84393";
              ctx.beginPath();
              ctx.arc(bx - 4 * bs, by - 6 * bs, 3, 0, Math.PI * 2);
              ctx.arc(bx + 6 * bs, by - 2 * bs, 3, 0, Math.PI * 2);
              ctx.arc(bx + 1 * bs, by + 4 * bs, 2, 0, Math.PI * 2);
              ctx.fill();
              ctx.stroke();
            }
          } else if (tier === 1) {
            if (s.seed < 0.5) {
              // --- ANCIENT ALPS STONE ARCHWAY ---
              ctx.fillStyle = "#334155"; // Grey slate
              // Left Pillar
              ctx.beginPath();
              ctx.rect(bx - 14 * bs, by - 24 * bs, 6 * bs, 24 * bs);
              ctx.fill();
              ctx.stroke();
              // Right Pillar
              ctx.beginPath();
              ctx.rect(bx + 8 * bs, by - 24 * bs, 6 * bs, 24 * bs);
              ctx.fill();
              ctx.stroke();
              // Lintel arch brick
              ctx.fillStyle = "#475569";
              ctx.beginPath();
              ctx.roundRect(bx - 18 * bs, by - 30 * bs, 36 * bs, 7 * bs, [
                2 * bs,
              ]);
              ctx.fill();
              ctx.stroke();

              // ICICLES hanging from archway
              ctx.fillStyle = "rgba(209, 250, 255, 0.7)";
              ctx.strokeStyle = "#475569";
              ctx.lineWidth = 0.8;
              let drawIcicle = (ix, iy, ih) => {
                ctx.beginPath();
                ctx.moveTo(ix - 1.5 * bs, iy);
                ctx.lineTo(ix, iy + ih * bs);
                ctx.lineTo(ix + 1.5 * bs, iy);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
              };
              drawIcicle(bx - 6 * bs, by - 23 * bs, 6);
              drawIcicle(bx + 4 * bs, by - 23 * bs, 8);
              drawIcicle(bx - 12 * bs, by - 23 * bs, 5);
              ctx.lineWidth = penBgScenery * bs; // reset
            } else {
              // --- ANCIENT FALLEN OBELISK ---
              ctx.fillStyle = "#1e293b"; // Dark slate
              ctx.beginPath();
              ctx.rect(bx - 10 * bs, by - 6 * bs, 20 * bs, 6 * bs);
              ctx.fill();
              ctx.stroke();

              ctx.save();
              ctx.translate(bx, by - 6 * bs);
              ctx.rotate(0.35 + s.seed * 0.4);
              ctx.fillStyle = "#334155";
              ctx.beginPath();
              ctx.rect(-6 * bs, -15 * bs, 12 * bs, 15 * bs);
              ctx.fill();
              ctx.stroke();
              ctx.restore();
            }
          } else if (tier === 2) {
            if (s.seed < 0.5) {
              ctx.fillStyle = "#2c1e1c";
              ctx.beginPath();
              ctx.ellipse(bx, by, 22 * bs, 10 * bs, 0, 0, Math.PI * 2);
              ctx.fill();
              ctx.stroke();
              ctx.fillStyle = "#f1c40f";
              ctx.beginPath();
              ctx.moveTo(bx - 8 * bs, by);
              ctx.lineTo(bx, by - 6 * bs);
              ctx.lineTo(bx + 8 * bs, by);
              ctx.closePath();
              ctx.fill();
              ctx.stroke();
            } else {
              ctx.fillStyle = "#3d0e05";
              ctx.beginPath();
              ctx.arc(bx, by, 10 * bs, Math.PI, 0);
              ctx.fill();
              ctx.stroke();
              let sizePulse =
                Math.abs(Math.sin(Date.now() / 300 + s.seed * 10)) * 4 + 2;
              ctx.fillStyle = "#e67e22";
              ctx.beginPath();
              ctx.arc(
                bx - 2 * bs,
                by - 3 * bs,
                sizePulse * bs * 0.4,
                0,
                Math.PI * 2,
              );
              ctx.fill();
              ctx.stroke();
            }
          } else if (tier === 3) {
            if (s.seed < 0.5) {
              ctx.fillStyle = "#0a2614";
              ctx.beginPath();
              ctx.ellipse(bx, by, 26 * bs, 7 * bs, 0, 0, Math.PI * 2);
              ctx.fill();
              ctx.stroke();
            } else {
              ctx.strokeStyle = "#1b4f30";
              ctx.lineWidth = 2;
              ctx.beginPath();
              ctx.moveTo(bx - 4, by);
              ctx.lineTo(bx - 2, by - 14 * bs);
              ctx.moveTo(bx + 4, by);
              ctx.lineTo(bx + 2, by - 12 * bs);
              ctx.stroke();
              ctx.fillStyle = "#5c3d1e";
              ctx.beginPath();
              ctx.rect(bx - 3.5, by - 14 * bs, 3, 5 * bs);
              ctx.fill();
              ctx.stroke();
              ctx.beginPath();
              ctx.rect(bx + 2.5, by - 12 * bs, 3, 4 * bs);
              ctx.fill();
              ctx.stroke();
            }
          } else if (tier === 4) {
            ctx.fillStyle = "rgba(142, 68, 173, 0.25)";
            ctx.beginPath();
            ctx.arc(bx, by, 22 * bs, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
          }
        }
      }
      ctx.restore();
    });

    // 3. GROUND FLOOR
    ctx.save();
    let floorPatternOffset = Math.sin(Date.now() / 2400) * 15;
    let microShift = Math.cos(Date.now() / 500) * 1.5;
    let totalShift = floorPatternOffset + microShift;

    if (window.playerStats.isUberBoss) {
      let groundGrad = ctx.createLinearGradient(0, 230, 0, 320);
      groundGrad.addColorStop(0, "#05010a");
      groundGrad.addColorStop(1, "#120224");
      ctx.fillStyle = groundGrad;
      ctx.fillRect(0, 230, canvas.width, 90);
      ctx.strokeStyle = "rgba(142, 68, 173, 0.45)";
      ctx.lineWidth = 1;
      for (let i = -100; i < canvas.width + 100; i += 50) {
        let gx = i - ((window.groundScroll + totalShift) % 50);
        ctx.beginPath();
        ctx.moveTo(gx, 230);
        ctx.lineTo(gx - 30, 320);
        ctx.stroke();
      }
    } else if (window.playerStats.isPrestigeBossMode) {
      let groundGrad = ctx.createLinearGradient(0, 230, 0, 320);
      groundGrad.addColorStop(0, "#1c1110");
      groundGrad.addColorStop(1, "#080302");
      ctx.fillStyle = groundGrad;
      ctx.fillRect(0, 230, canvas.width, 90);
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, 230);
      ctx.lineTo(canvas.width, 230);
      ctx.moveTo(0, 250);
      ctx.lineTo(canvas.width, 250);
      ctx.moveTo(0, 274);
      ctx.lineTo(canvas.width, 274);
      ctx.moveTo(0, 298);
      ctx.lineTo(canvas.width, 298);
      ctx.stroke();
      for (let i = -60; i < canvas.width + 60; i += 80) {
        let offset = i - ((window.groundScroll + totalShift) % 80);
        ctx.beginPath();
        ctx.moveTo(offset, 230);
        ctx.lineTo(offset + 5, 250);
        ctx.moveTo(offset + 40, 250);
        ctx.lineTo(offset + 45, 274);
        ctx.moveTo(offset - 10, 274);
        ctx.lineTo(offset - 5, 320);
        ctx.stroke();
      }
      let fissurePulse = Math.sin(Date.now() / 150) * 0.2 + 0.8;
      ctx.strokeStyle = `rgba(230, 126, 34, ${fissurePulse})`;
      ctx.lineWidth = 2;
      for (let i = 100; i < canvas.width; i += 180) {
        let ox = i - ((window.groundScroll + totalShift * 1.5) % 180);
        ctx.beginPath();
        ctx.moveTo(ox, 230);
        ctx.lineTo(ox + 8, 250);
        ctx.lineTo(ox - 12, 274);
        ctx.stroke();
      }
    } else if (window.playerStats.isCrucibleMode) {
      let groundGrad = ctx.createLinearGradient(0, 230, 0, 320);
      groundGrad.addColorStop(0, "#0a0316");
      groundGrad.addColorStop(1, "#030005");
      ctx.fillStyle = groundGrad;
      ctx.fillRect(0, 230, canvas.width, 90);
      ctx.strokeStyle = "rgba(155, 89, 182, 0.45)";
      ctx.lineWidth = 1;
      for (let i = -100; i < canvas.width + 100; i += 40) {
        let gx = i - ((window.groundScroll + totalShift) % 40);
        ctx.beginPath();
        ctx.moveTo(gx, 230);
        ctx.lineTo(gx - 20, 320);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.moveTo(0, 245);
      ctx.lineTo(canvas.width, 245);
      ctx.moveTo(0, 265);
      ctx.lineTo(canvas.width, 265);
      ctx.stroke();
    } else if (window.playerStats.isDungeonMode) {
      if (window.playerStats.currentDungeon === "gold") {
        let groundGrad = ctx.createLinearGradient(0, 230, 0, 320);
        groundGrad.addColorStop(0, "#2c1c0a");
        groundGrad.addColorStop(1, "#120a03");
        ctx.fillStyle = groundGrad;
        ctx.fillRect(0, 230, canvas.width, 90);
        ctx.strokeStyle = "rgba(241, 196, 15, 0.35)";
        ctx.lineWidth = 2;
        for (let i = -100; i < canvas.width + 100; i += 120) {
          let gx = i - ((window.groundScroll + totalShift) % 120);
          ctx.beginPath();
          ctx.moveTo(gx, 250);
          ctx.quadraticCurveTo(gx + 20, 260, gx + 40, 255);
          ctx.quadraticCurveTo(gx + 60, 245, gx + 80, 265);
          ctx.stroke();
        }
        ctx.fillStyle = "#3e2723";
        ctx.strokeStyle = "#5d6d7e";
        ctx.lineWidth = 2;
        for (let i = -60; i < canvas.width + 60; i += 40) {
          ctx.fillRect(
            i - ((window.groundScroll + totalShift) % 40),
            265,
            8,
            20,
          );
        }
        ctx.beginPath();
        ctx.moveTo(0, 268);
        ctx.lineTo(canvas.width, 268);
        ctx.moveTo(0, 282);
        ctx.lineTo(canvas.width, 282);
        ctx.stroke();
      } else if (window.playerStats.currentDungeon === "mat") {
        let groundGrad = ctx.createLinearGradient(0, 230, 0, 320);
        groundGrad.addColorStop(0, "#19221c");
        groundGrad.addColorStop(1, "#0a0e0b");
        ctx.fillStyle = groundGrad;
        ctx.fillRect(0, 230, canvas.width, 90);
        ctx.strokeStyle = "#0f1511";
        ctx.lineWidth = 1.5;
        for (let i = -120; i < canvas.width + 120; i += 100) {
          let gx = i - ((window.groundScroll + totalShift) % 100);
          ctx.beginPath();
          ctx.moveTo(gx, 230);
          ctx.lineTo(gx - 30, 320);
          ctx.stroke();
          ctx.fillStyle = "#1e2821";
          ctx.beginPath();
          ctx.arc(gx + 5, 245, 2, 0, Math.PI * 2);
          ctx.arc(gx - 15, 280, 2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = "rgba(46, 204, 113, 0.3)";
        ctx.strokeStyle = "#2ecc71";
        ctx.lineWidth = 1;
        for (let i = -150; i < canvas.width + 150; i += 180) {
          let gx = i - ((window.groundScroll + totalShift) % 180);
          ctx.beginPath();
          ctx.ellipse(gx + 40, 262, 35, 12, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          let bubbleOffset = (Date.now() / 15 + gx) % 24;
          if (bubbleOffset < 12) {
            ctx.fillStyle = "rgba(46, 204, 113, 0.55)";
            ctx.beginPath();
            ctx.arc(
              gx + 30 + bubbleOffset,
              262 - bubbleOffset / 4,
              2 + bubbleOffset / 6,
              0,
              Math.PI * 2,
            );
            ctx.fill();
          }
        }
      } else {
        // 1. Volcanic Iron-Vault Ground Base (Rich deep soot)
        let groundGrad = ctx.createLinearGradient(0, 230, 0, 320);
        groundGrad.addColorStop(0, "#11161b"); // Slate industrial iron
        groundGrad.addColorStop(1, "#07090c"); // Deep coal-black
        ctx.fillStyle = groundGrad;
        ctx.fillRect(0, 230, canvas.width, 90);

        // 2. Thick Molten Orange Under-Grate Seams
        let pulse = 0.8 + Math.sin(Date.now() / 250) * 0.2;
        ctx.strokeStyle = `rgba(230, 126, 34, ${0.4 + pulse * 0.4})`; // Molten orange seams
        ctx.lineWidth = 4;
        ctx.beginPath();
        // Horizontal molten lines peeking through iron plate joints
        ctx.moveTo(0, 252);
        ctx.lineTo(canvas.width, 252);
        ctx.moveTo(0, 276);
        ctx.lineTo(canvas.width, 276);
        ctx.stroke();

        ctx.strokeStyle = `rgba(241, 196, 15, ${0.4 + pulse * 0.5})`; // White-hot inner core line
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // 3. Rigid Heavy Iron-Grate Plate Panels (Locked solid to window.groundScroll - NO swaying)
        ctx.fillStyle = "#1c2229";
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = penFar;

        // Draw top horizon outline of the vault plates
        ctx.beginPath();
        ctx.moveTo(0, 230);
        ctx.lineTo(canvas.width, 230);
        ctx.stroke();

        // We draw vertical plate seams scrolling linearly on groundScroll only (NO swaying totalShift!)
        let scrollOffset = window.groundScroll % 80;
        for (let i = -80; i < canvas.width + 80; i += 80) {
          let gx = i - scrollOffset;

          // Draw solid dark iron-plate border cuts
          ctx.beginPath();
          ctx.moveTo(gx, 230);
          ctx.lineTo(gx, 320);
          ctx.stroke();

          // Draw heavy rivets on the plate corners
          ctx.fillStyle = "#0c0f13";
          ctx.beginPath();
          ctx.arc(gx - 4, 235, 1.5, 0, Math.PI * 2);
          ctx.arc(gx + 4, 235, 1.5, 0, Math.PI * 2);
          ctx.arc(gx - 4, 315, 1.5, 0, Math.PI * 2);
          ctx.arc(gx + 4, 315, 1.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        }
      }
    } else {
      if (tier === 0) {
        let groundGrad = ctx.createLinearGradient(0, 230, 0, 320);
        groundGrad.addColorStop(0, "#194d22");
        groundGrad.addColorStop(0.15, "#223d1c");
        groundGrad.addColorStop(1, "#0c1a0c");
        ctx.fillStyle = groundGrad;
        ctx.fillRect(0, 230, canvas.width, 90);

        ctx.fillStyle = "#1e4d22";
        for (let i = -20; i < canvas.width + 20; i += 8) {
          let gx = i - ((window.groundScroll + totalShift * 0.4) % 8);
          let h = 4 + Math.sin(i * 1.7) * 3;
          let bend = Math.sin(Date.now() / 300 + i) * 2.5;
          ctx.beginPath();
          ctx.moveTo(gx, 230);
          ctx.quadraticCurveTo(gx + bend, 230 - h, gx + bend + 1, 230 - h);
          ctx.quadraticCurveTo(gx + 3, 230, gx + 6, 230);
          ctx.fill();
        }
      } else if (tier === 1) {
        // Thick snow-tundra ground fill
        let groundGrad = ctx.createLinearGradient(0, 230, 0, 320);
        groundGrad.addColorStop(0, "#f8fafc"); // Pristine snow surface
        groundGrad.addColorStop(0.15, "#cbd5e1"); // Shadow snow layer
        groundGrad.addColorStop(1, "#1e293b"); // Deep frozen slate base
        ctx.fillStyle = groundGrad;
        ctx.fillRect(0, 230, canvas.width, 90);

        // Wind-swept horizontal snow drift patterns
        ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
        ctx.lineWidth = 1.5;
        for (let i = -120; i < canvas.width + 120; i += 120) {
          let gx = i - ((window.groundScroll + totalShift) % 120);
          ctx.beginPath();
          ctx.moveTo(gx, 250);
          ctx.quadraticCurveTo(gx + 30, 255, gx + 60, 250);
          ctx.stroke();
        }

        // Glacial blue ice cracks deep under snow
        ctx.strokeStyle = "#38bdf8";
        ctx.lineWidth = 1.0;
        for (let i = -160; i < canvas.width + 160; i += 160) {
          let gx = i - ((window.groundScroll + totalShift) % 160);
          ctx.beginPath();
          ctx.moveTo(gx, 265);
          ctx.lineTo(gx + 12, 285);
          ctx.lineTo(gx - 4, 310);
          ctx.stroke();
        }

        // Horizon snow drift fluff sitting on the border
        ctx.fillStyle = "#f8fafc";
        ctx.beginPath();
        ctx.moveTo(0, 230);
        for (let x = 0; x < canvas.width + 20; x += 20) {
          ctx.quadraticCurveTo(x - 10, 230 - 3, x, 230);
        }
        ctx.lineTo(canvas.width, 230);
        ctx.closePath();
        ctx.fill();
      } else if (tier === 2) {
        // 1. Obsidian Basalt Ground Base
        let groundGrad = ctx.createLinearGradient(0, 230, 0, 320);
        groundGrad.addColorStop(0, "#120302"); // Dark cooled basalt
        groundGrad.addColorStop(0.3, "#080100"); // Depth shadows
        groundGrad.addColorStop(1, "#020000"); // Pitch black
        ctx.fillStyle = groundGrad;
        ctx.fillRect(0, 230, canvas.width, 90);

        // 2. Cooling Plate Boundaries (Procedural Index-Based Random Spider Fractures)
        let drawCrackedTectonicGrid = (lineW, color) => {
          ctx.save();
          ctx.strokeStyle = color;
          ctx.lineWidth = lineW;
          ctx.lineCap = "round";
          ctx.lineJoin = "round";

          // Fast sine-based hash to deterministically randomize crack shapes based on grid index
          let hash = (val) => {
            let x = Math.sin(val) * 10000;
            return x - Math.floor(x);
          };

          let spacing = 120; // Structural grid gap
          let startI = Math.floor(window.groundScroll / spacing) - 2;
          let endI = startI + Math.ceil(canvas.width / spacing) + 4;

          for (let i = startI; i <= endI; i++) {
            let worldX = i * spacing;
            let gx = worldX - window.groundScroll;

            // Generate unique, non-repeating offsets for each coordinate index
            let h1 = hash(i) * 14 - 7;
            let h2 = hash(i + 0.5) * 14 - 7;
            let h3 = hash(i + 1.2) * 18 - 9;
            let h4 = hash(i + 1.9) * 18 - 9;
            let h5 = hash(i + 2.5) * 14 - 7;

            // Major jagged vertical/diagonal fissure (cooling crack)
            ctx.beginPath();
            ctx.moveTo(gx, 230);
            ctx.lineTo(gx - 10 + h1, 248);
            ctx.lineTo(gx + 8 + h2, 268);
            ctx.lineTo(gx - 18 + h3, 292);
            ctx.lineTo(gx + 12 + h4, 320);
            ctx.stroke();

            // Branching diagonal spider cracks (procedurally distributed via hash)
            if (hash(i + 3.1) > 0.3) {
              ctx.beginPath();
              ctx.moveTo(gx + 8 + h2, 268);
              ctx.lineTo(gx + 45 + h5, 275);
              ctx.lineTo(gx + 72 + h1, 262);
              ctx.lineTo(gx + 115 + h3, 280);
              ctx.stroke();
            }

            if (hash(i + 4.2) > 0.4) {
              ctx.beginPath();
              ctx.moveTo(gx - 12 + h1, 248);
              ctx.lineTo(gx + 30 + h4, 252);
              ctx.lineTo(gx + 65 + h2, 238);
              ctx.stroke();
            }

            if (hash(i + 5.7) > 0.3) {
              ctx.beginPath();
              ctx.moveTo(gx - 18 + h3, 292);
              ctx.lineTo(gx + 40 + h1, 305);
              ctx.lineTo(gx + 90 + h5, 295);
              ctx.lineTo(gx + 130 + h2, 315);
              ctx.stroke();
            }
          }
          ctx.restore();
        };

        // Render deep, glowing lava crust crack under-glow first
        drawCrackedTectonicGrid(3.5, "rgba(192, 57, 43, 0.75)");

        // Render thin bright golden-yellow molten core on top
        let pulse = 0.7 + Math.sin(Date.now() / 200) * 0.3;
        drawCrackedTectonicGrid(
          1.5,
          `rgba(241, 196, 15, ${0.45 + pulse * 0.45})`,
        );
      } else if (tier === 3) {
        let groundGrad = ctx.createLinearGradient(0, 230, 0, 320);
        groundGrad.addColorStop(0, "#0e1a12");
        groundGrad.addColorStop(1, "#050a07");
        ctx.fillStyle = groundGrad;
        ctx.fillRect(0, 230, canvas.width, 90);
        ctx.strokeStyle = "#142c1d";
        ctx.lineWidth = 3;
        for (let i = -120; i < canvas.width + 120; i += 90) {
          let gx = i - ((window.groundScroll + totalShift) % 90);
          ctx.beginPath();
          ctx.moveTo(gx, 245);
          ctx.quadraticCurveTo(gx + 40, 260, gx + 80, 248);
          ctx.stroke();
        }
        for (let i = -200; i < canvas.width + 200; i += 220) {
          let gx = i - ((window.groundScroll + totalShift) % 220);
          let pop = (Date.now() / 25 + i) % 70;
          if (pop < 35) {
            ctx.fillStyle = "#193f26";
            ctx.strokeStyle = "#27ae60";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(gx + 60, 270, pop / 8, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
          } else if (pop < 42) {
            ctx.strokeStyle =
              "rgba(46, 204, 113, " + (1 - (pop - 35) / 7) + ")";
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.ellipse(
              gx + 60,
              270,
              (pop - 35) * 3,
              (pop - 35) * 1.2,
              0,
              0,
              Math.PI * 2,
            );
            ctx.stroke();
          }
        }
      } else {
        let groundGrad = ctx.createLinearGradient(0, 230, 0, 320);
        groundGrad.addColorStop(0, "#0a0114");
        groundGrad.addColorStop(1, "#030005");
        ctx.fillStyle = groundGrad;
        ctx.fillRect(0, 230, canvas.width, 90);
        ctx.strokeStyle = "rgba(155, 89, 182, 0.35)";
        ctx.lineWidth = 1;
        for (let h = 230; h <= 320; h += 14) {
          ctx.beginPath();
          ctx.moveTo(0, h);
          ctx.lineTo(canvas.width, h);
          ctx.stroke();
        }
        for (let i = -200; i < canvas.width + 200; i += 60) {
          let gx = i - ((window.groundScroll + totalShift) % 60);
          ctx.beginPath();
          ctx.moveTo(gx, 230);
          ctx.lineTo(gx * 1.5 - canvas.width * 0.25, 320);
          ctx.stroke();
        }
      }
    }
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.moveTo(0, 230);
    ctx.lineTo(canvas.width, 230);
    ctx.stroke();
    ctx.restore();

    window.beams.forEach((bm) => {
      ctx.save();
      ctx.globalAlpha = (bm.life / bm.maxLife) * 0.7;
      let beamGrad = ctx.createLinearGradient(bm.x - 20, 0, bm.x + 20, 0);
      beamGrad.addColorStop(0, "rgba(255,255,255,0)");
      beamGrad.addColorStop(0.5, bm.color);
      beamGrad.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = beamGrad;
      ctx.fillRect(bm.x - 25, 0, 50, 230);
      ctx.restore();
    });

    // 4. DYNAMIC HERO RENDERING
    let hx = window.hero.x;
    let hy = window.hero.y;
    ctx.save();
    let bounce = 0;
    let slumpRotation = 0;
    let Yoffset = 0;
    let deathOpacity = 1.0;

    if (window.deathAnimationTimer > 0) {
      let t =
        (window.deathMaxFrames - window.deathAnimationTimer) /
        window.deathMaxFrames;
      slumpRotation = (t * Math.PI) / 2.2;
      Yoffset = t * 18;
      bounce = 0;
      deathOpacity = Math.max(0, 1.0 - t * 0.85);
      ctx.translate(hx + 12, hy + 15 + Yoffset);
      ctx.rotate(-slumpRotation);
      ctx.globalAlpha = deathOpacity;
    } else {
      ctx.translate(hx + 12, hy + 15);
      bounce =
        !window.mob || !window.mob.isStopped
          ? Math.abs(Math.sin(Date.now() / 150)) * 3
          : 0;
    }

    window.drawSingleHero(
      ctx,
      0,
      0,
      1.0,
      window.equippedSlots,
      window.playerStats,
      bounce,
      {
        slashFrame: window.hero.slashFrame,
        deathAnimationTimer: window.deathAnimationTimer,
        isMainHero: true,
      },
    );

    ctx.restore();

    // 5. STYLIZED MONSTERS DRAW
    if (window.mob) {
      window.drawSingleMob(ctx, window.mob);
      let bHp = BigNum.from(window.mob.hp);
      let bMaxHp = BigNum.from(window.mob.maxHp);
      let hpPct = Math.max(
        0,
        Math.min(
          1,
          Number(
            bHp.div(bMaxHp).m * Math.pow(10, Math.min(15, bHp.div(bMaxHp).e)),
          ),
        ),
      );

      if (
        hpPct < 1.0 &&
        window.mob.type !== "boss" &&
        window.mob.type !== "dungeon_boss" &&
        window.mob.type !== "prestige_boss" &&
        window.mob.type !== "rift_guardian" &&
        window.mob.type !== "aegis_goliath" &&
        window.mob.type !== "chronos_arbitrator" &&
        window.mob.type !== "nexus_overseer"
      ) {
        let barW = window.mob.w;
        let barX = window.mob.x;
        ctx.fillStyle = "#111111";
        ctx.beginPath();
        ctx.rect(barX, window.mob.y - 13, barW, 7);
        ctx.fill();

        // High-performance percentage lerp replaces heavy float trailing HP updates
        window.mob.trailingPct =
          window.mob.trailingPct !== undefined ? window.mob.trailingPct : hpPct;
        if (window.mob.trailingPct > hpPct) {
          window.mob.trailingPct = Math.max(
            hpPct,
            window.mob.trailingPct - 0.015,
          );
        } else {
          window.mob.trailingPct = hpPct;
        }
        let trailingPct = window.mob.trailingPct;

        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.rect(barX, window.mob.y - 13, trailingPct * barW, 7);
        ctx.fill();
        ctx.fillStyle = "#e74c3c";
        ctx.beginPath();
        ctx.rect(barX, window.mob.y - 13, hpPct * barW, 7);
        ctx.fill();
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 2;
        ctx.strokeRect(barX, window.mob.y - 13, barW, 7);

        // Bleed Stacks Row
        if (window.mob.bleedStacks > 0) {
          let dotSize = 2.2;
          let dotSpacing = 3;
          let totalWidth = 5 * (dotSize * 2) + 4 * dotSpacing;
          let startDotX = barX + (barW - totalWidth) / 2;
          let dotY = window.mob.y - 4;
          for (let i = 0; i < 5; i++) {
            ctx.beginPath();
            ctx.arc(
              startDotX + i * (dotSize * 2 + dotSpacing) + dotSize,
              dotY,
              dotSize,
              0,
              Math.PI * 2,
            );
            ctx.fillStyle = i < window.mob.bleedStacks ? "#e74c3c" : "#2c3e50";
            ctx.fill();
            ctx.strokeStyle = "#000000";
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
        // Poison Stacks Row (Stacked slightly higher)
        if (window.mob.poisonStacks > 0) {
          let dotSize = 2.2;
          let dotSpacing = 3;
          let totalWidth = 5 * (dotSize * 2) + 4 * dotSpacing;
          let startDotX = barX + (barW - totalWidth) / 2;
          let dotY = window.mob.y - 9;
          for (let i = 0; i < 5; i++) {
            ctx.beginPath();
            ctx.arc(
              startDotX + i * (dotSize * 2 + dotSpacing) + dotSize,
              dotY,
              dotSize,
              0,
              Math.PI * 2,
            );
            ctx.fillStyle = i < window.mob.poisonStacks ? "#2ecc71" : "#1a301f";
            ctx.fill();
            ctx.strokeStyle = "#000000";
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }
    }

    // 6. FAIRIES
    window.activeFairies.forEach((f) => {
      let flap = Math.abs(Math.sin(Date.now() / 100 + f.offset)) * 8 + 2;
      let hover = Math.sin(Date.now() / 200 + f.offset) * 10;
      let fx = f.x;
      let fy = f.y + hover;
      ctx.save();
      ctx.shadowBlur = 15;
      ctx.shadowColor = f.color || "#ffb6c1";
      ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
      ctx.beginPath();
      ctx.ellipse(fx - 4, fy - 4, 6, flap, Math.PI / 6, 0, Math.PI * 2);
      ctx.ellipse(fx + 4, fy - 4, 6, flap, -Math.PI / 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = f.color || "#ffb6c1";
      ctx.beginPath();
      ctx.arc(fx, fy, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    });

    // 6.5. FOREGROUND SCENERY OBJECTS (Outlines unified)
    window.fgScenery.forEach((s) => {
      let sx = s.x,
        sy = s.y,
        ss = s.size;
      s.seed = s.seed || Math.random();

      ctx.save();
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = penFgScenery * ss;
      ctx.lineJoin = "round";

      if (
        window.playerStats.isCrucibleMode ||
        window.playerStats.isPrestigeBossMode ||
        window.playerStats.isUberBoss
      ) {
        ctx.restore();
        return; // Block foreground scenery in space / lava castle
      }
      if (window.playerStats.isDungeonMode) {
        if (window.playerStats.currentDungeon === "gold") {
          if (s.type === "grass") {
            ctx.fillStyle = "#f1c40f";
            ctx.beginPath();
            ctx.moveTo(sx - 5 * ss, sy);
            ctx.lineTo(sx - 2 * ss, sy - 6 * ss);
            ctx.lineTo(sx + 4 * ss, sy - 7 * ss);
            ctx.lineTo(sx + 7 * ss, sy - 2 * ss);
            ctx.lineTo(sx + 2 * ss, sy);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(sx, sy - 5 * ss, 1.5, 1.5);
          } else if (s.type === "flower") {
            ctx.fillStyle = "#3e2723";
            ctx.beginPath();
            ctx.rect(sx - 2, sy - 30 * ss, 4, 30 * ss);
            ctx.fill();
            ctx.stroke();
            ctx.beginPath();
            ctx.rect(sx - 2, sy - 30 * ss, 12 * ss, 3 * ss);
            ctx.fill();
            ctx.stroke();
            let lx = sx + 8 * ss,
              ly = sy - 27 * ss;
            ctx.fillStyle = "#2c3e50";
            ctx.beginPath();
            ctx.rect(lx - 3, ly, 6, 8);
            ctx.fill();
            ctx.stroke();
            let glow = ctx.createRadialGradient(
              lx,
              ly + 4,
              1,
              lx,
              ly + 4,
              16 * ss,
            );
            glow.addColorStop(0, "rgba(241, 196, 15, 0.8)");
            glow.addColorStop(1, "rgba(241, 196, 15, 0)");
            ctx.fillStyle = glow;
            ctx.beginPath();
            ctx.arc(lx, ly + 4, 16 * ss, 0, Math.PI * 2);
            ctx.fill();
          } else {
            ctx.fillStyle = "#5c4033";
            ctx.beginPath();
            ctx.rect(sx - 10 * ss, sy - 20 * ss, 20 * ss, 20 * ss);
            ctx.fill();
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(sx - 10 * ss, sy - 20 * ss);
            ctx.lineTo(sx + 10 * ss, sy);
            ctx.stroke();
          }
        } else if (window.playerStats.currentDungeon === "mat") {
          if (s.type === "grass") {
            ctx.fillStyle = "#27ae60";
            ctx.beginPath();
            ctx.ellipse(sx, sy - 3 * ss, 9 * ss, 5 * ss, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
          } else if (s.type === "flower") {
            ctx.fillStyle = "#95a5a6";
            ctx.beginPath();
            ctx.rect(sx - 1.5 * ss, sy - 12 * ss, 3 * ss, 12 * ss);
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = "#2ecc71";
            ctx.beginPath();
            ctx.arc(sx, sy - 12 * ss, 7 * ss, Math.PI, 0);
            ctx.fill();
            ctx.stroke();
          } else {
            ctx.fillStyle = "#7f8c8d";
            ctx.beginPath();
            ctx.rect(sx - 8 * ss, sy - 18 * ss, 16 * ss, 18 * ss);
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = "#34495e";
            ctx.beginPath();
            ctx.rect(sx - 8 * ss, sy - 15 * ss, 16 * ss, 2 * ss);
            ctx.fill();
            ctx.stroke();
            ctx.beginPath();
            ctx.rect(sx - 8 * ss, sy - 6 * ss, 16 * ss, 2 * ss);
            ctx.fill();
            ctx.stroke();
          }
        } else if (window.playerStats.currentDungeon === "equip") {
          if (s.type === "grass") {
            // Robust stacks of refined metal ingots
            let w = 18 * ss;
            let h = 6 * ss;
            ctx.fillStyle = "#34495e"; // Steel body
            ctx.strokeStyle = "#000000";
            ctx.lineWidth = penFgScenery * ss;

            // Bottom Left Bar
            ctx.beginPath();
            ctx.roundRect(sx - w * 0.7, sy - h, w, h, [1.5]);
            ctx.fill();
            ctx.stroke();

            // Bottom Right Bar
            ctx.beginPath();
            ctx.roundRect(sx - w * 0.1, sy - h, w, h, [1.5]);
            ctx.fill();
            ctx.stroke();

            // Top Center Bar
            ctx.beginPath();
            ctx.roundRect(sx - w * 0.4, sy - h * 1.8, w, h, [1.5]);
            ctx.fill();
            ctx.stroke();

            // Shiny metallic reflection line highlights
            ctx.strokeStyle = "rgba(255, 255, 255, 0.22)";
            ctx.lineWidth = 1.2 * ss;
            ctx.beginPath();
            ctx.moveTo(sx - w * 0.2, sy - h * 1.4);
            ctx.lineTo(sx + w * 0.4, sy - h * 1.4);
            ctx.stroke();
          } else if (s.type === "flower") {
            // Thick brass steam exhaust pipe
            let pipeW = 10 * ss;
            let pipeH = 22 * ss;

            // Main vertical pipe body
            ctx.fillStyle = "#7e5109"; // Weathered brass
            ctx.strokeStyle = "#000000";
            ctx.lineWidth = penFgScenery * ss;
            ctx.beginPath();
            ctx.rect(sx - pipeW / 2, sy - pipeH, pipeW, pipeH);
            ctx.fill();
            ctx.stroke();

            // Heavy flange joint collar at base
            ctx.fillStyle = "#1e222b";
            ctx.beginPath();
            ctx.roundRect(
              sx - pipeW * 0.8,
              sy - 4 * ss,
              pipeW * 1.6,
              4 * ss,
              [1],
            );
            ctx.fill();
            ctx.stroke();

            // Flared bell mouth at the top of the exhaust
            ctx.fillStyle = "#1e222b";
            ctx.beginPath();
            ctx.moveTo(sx - pipeW * 0.8, sy - pipeH);
            ctx.lineTo(sx + pipeW * 0.8, sy - pipeH);
            ctx.lineTo(sx + pipeW * 0.5, sy - pipeH + 4 * ss);
            ctx.lineTo(sx - pipeW * 0.5, sy - pipeH + 4 * ss);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Zero-allocation rising steam puff animation
            ctx.save();
            let animTime = (Date.now() / 900 + s.seed * 5) % 1.0;
            let steamY = sy - pipeH - animTime * 15 * ss;
            let steamR = (2.5 + animTime * 4.5) * ss;
            let steamAlpha = (1.0 - animTime) * 0.45;
            ctx.fillStyle = `rgba(220, 224, 230, ${steamAlpha})`;
            ctx.beginPath();
            ctx.arc(
              sx + Math.sin(animTime * 5) * 3 * ss,
              steamY,
              steamR,
              0,
              Math.PI * 2,
            );
            ctx.fill();
            ctx.restore();
          } else {
            // Sturdy wooden stump base
            let stumpW = 18 * ss;
            let stumpH = 12 * ss;
            ctx.fillStyle = "#5c3a21"; // Rich wood stump
            ctx.strokeStyle = "#000000";
            ctx.lineWidth = penFgScenery * ss;
            ctx.beginPath();
            ctx.rect(sx - stumpW / 2, sy - stumpH, stumpW, stumpH);
            ctx.fill();
            ctx.stroke();

            // Stump bark grain texture lines
            ctx.strokeStyle = "#3d2514";
            ctx.lineWidth = 1 * ss;
            ctx.beginPath();
            ctx.moveTo(sx - stumpW * 0.2, sy - stumpH + 2 * ss);
            ctx.lineTo(sx - stumpW * 0.2, sy - 2 * ss);
            ctx.moveTo(sx + stumpW * 0.25, sy - stumpH + 3 * ss);
            ctx.lineTo(sx + stumpW * 0.25, sy - 1 * ss);
            ctx.stroke();

            // Robust steel anvil sitting on top
            let anvilY = sy - stumpH;
            ctx.fillStyle = "#2c3e50"; // Dark forge steel
            ctx.strokeStyle = "#000000";
            ctx.lineWidth = penFgScenery * ss;
            ctx.beginPath();
            // Horn (pointed left beak)
            ctx.moveTo(sx - 11 * ss, anvilY - 8 * ss);
            ctx.quadraticCurveTo(
              sx - 5 * ss,
              anvilY - 7 * ss,
              sx - 3 * ss,
              anvilY - 8 * ss,
            );
            // Block flat top surface
            ctx.lineTo(sx + 8 * ss, anvilY - 8 * ss);
            // Heel (right step edge)
            ctx.lineTo(sx + 9 * ss, anvilY - 6 * ss);
            ctx.lineTo(sx + 4 * ss, anvilY - 6 * ss);
            // Narrow waisted mid-section
            ctx.lineTo(sx + 3 * ss, anvilY - 3 * ss);
            // Flanged bottom base feet
            ctx.lineTo(sx + 7 * ss, anvilY);
            ctx.lineTo(sx - 7 * ss, anvilY);
            ctx.lineTo(sx - 3 * ss, anvilY - 3 * ss);
            ctx.lineTo(sx - 4 * ss, anvilY - 6 * ss);
            ctx.lineTo(sx - 11 * ss, anvilY - 6 * ss);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Shiny horizontal reflection highlight on top of anvil block
            ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
            ctx.lineWidth = 1 * ss;
            ctx.beginPath();
            ctx.moveTo(sx - 3 * ss, anvilY - 7 * ss);
            ctx.lineTo(sx + 7 * ss, anvilY - 7 * ss);
            ctx.stroke();
          }
        }
      } else {
        if (tier === 0) {
          if (s.type === "grass") {
            let sway = Math.sin(Date.now() / 220 + s.seed * 80) * 3.5 * ss;

            // 1. Shadow grass blades in background (Darker forest green)
            ctx.fillStyle = "#1e4620";
            ctx.beginPath();
            // Back blade 1
            ctx.moveTo(sx - 2 * ss, sy);
            ctx.quadraticCurveTo(
              sx - 6 * ss + sway,
              sy - 14 * ss,
              sx - 11 * ss + sway,
              sy - 19 * ss,
            );
            ctx.quadraticCurveTo(
              sx - 2 * ss + sway,
              sy - 8 * ss,
              sx + 2 * ss,
              sy,
            );
            // Back blade 2
            ctx.moveTo(sx + 3 * ss, sy);
            ctx.quadraticCurveTo(
              sx + 8 * ss + sway,
              sy - 16 * ss,
              sx + 5 * ss + sway,
              sy - 23 * ss,
            );
            ctx.quadraticCurveTo(
              sx + 8 * ss + sway,
              sy - 10 * ss,
              sx + 7 * ss,
              sy,
            );
            ctx.fill();
            ctx.stroke();

            // 2. Main foreground grass blades (Vibrant meadow green)
            ctx.fillStyle = "#2ecc71";
            ctx.beginPath();
            // Center tall blade
            ctx.moveTo(sx - 1 * ss, sy);
            ctx.quadraticCurveTo(
              sx + sway * 0.7,
              sy - 18 * ss,
              sx - 2 * ss + sway,
              sy - 25 * ss,
            );
            ctx.quadraticCurveTo(
              sx + 1 * ss + sway * 0.5,
              sy - 12 * ss,
              sx + 3 * ss,
              sy,
            );
            // Left blade
            ctx.moveTo(sx - 4 * ss, sy);
            ctx.quadraticCurveTo(
              sx - 8 * ss + sway * 1.2,
              sy - 10 * ss,
              sx - 12 * ss + sway * 1.2,
              sy - 13 * ss,
            );
            ctx.quadraticCurveTo(
              sx - 5 * ss + sway,
              sy - 5 * ss,
              sx - 1 * ss,
              sy,
            );
            ctx.fill();
            ctx.stroke();

            // 3. Tiny Clover Leaves at the Base (Adds lovely high-fidelity details!)
            ctx.fillStyle = "#27ae60";
            let drawCloverLeaf = (cx, cy, r) => {
              ctx.beginPath();
              ctx.arc(cx - r * 0.5, cy, r, 0, Math.PI * 2);
              ctx.arc(cx + r * 0.5, cy, r, 0, Math.PI * 2);
              ctx.arc(cx, cy - r * 0.5, r, 0, Math.PI * 2);
              ctx.closePath();
              ctx.fill();
              ctx.stroke();
            };
            drawCloverLeaf(sx - 5 * ss, sy - 2 * ss, 2 * ss);
            drawCloverLeaf(sx + 6 * ss, sy - 3 * ss, 1.8 * ss);
          } else if (s.type === "flower") {
            let swayF = Math.sin(Date.now() / 200 + s.seed * 100) * 3 * ss;
            let fx = sx + swayF;
            let fy = sy - 16 * ss;

            // 1. Organic curving stem (Green vines)
            ctx.strokeStyle = "#1b5e20";
            ctx.lineWidth = 1.8 * ss;
            ctx.beginPath();
            ctx.moveTo(sx, sy);
            ctx.quadraticCurveTo(sx + swayF * 0.5, sy - 8 * ss, fx, fy);
            ctx.stroke();
            ctx.strokeStyle = "#000000"; // reset
            ctx.lineWidth = penFgScenery * ss;

            // Delicate pointed stem leaves
            ctx.fillStyle = "#27ae60";
            ctx.beginPath();
            ctx.ellipse(
              sx - 2 * ss + swayF * 0.3,
              sy - 6 * ss,
              5 * ss,
              2 * ss,
              Math.PI / 4,
              0,
              Math.PI * 2,
            );
            ctx.ellipse(
              sx + 2 * ss + swayF * 0.4,
              sy - 10 * ss,
              4.5 * ss,
              1.8 * ss,
              -Math.PI / 4,
              0,
              Math.PI * 2,
            );
            ctx.fill();
            ctx.stroke();

            // 2. Layered Blooming Flower Head (Swaying with the stem)
            // Shadow/Base Petal ring
            ctx.fillStyle = "#7e1b1b"; // Dark contrast base
            for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 3) {
              ctx.beginPath();
              ctx.arc(
                fx + Math.cos(angle) * 6 * ss,
                fy + Math.sin(angle) * 6 * ss,
                5 * ss,
                0,
                Math.PI * 2,
              );
              ctx.fill();
              ctx.stroke();
            }

            // Bright Colorful Main Petals
            ctx.fillStyle = s.color;
            for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 3) {
              ctx.beginPath();
              ctx.arc(
                fx + Math.cos(angle) * 5 * ss,
                fy + Math.sin(angle) * 5 * ss,
                4.2 * ss,
                0,
                Math.PI * 2,
              );
              ctx.fill();
              ctx.stroke();
            }

            // Glowing Golden Flower Center Core
            let centerGrad = ctx.createRadialGradient(
              fx - 1 * ss,
              fy - 1 * ss,
              0.5,
              fx,
              fy,
              4 * ss,
            );
            centerGrad.addColorStop(0, "#ffffff");
            centerGrad.addColorStop(0.4, "#f1c40f");
            centerGrad.addColorStop(1, "#ca8a04");
            ctx.fillStyle = centerGrad;
            ctx.beginPath();
            ctx.arc(fx, fy, 4 * ss, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
          } else {
            if (s.seed < 0.5) {
              // Majestic layered default bush (Larger, more voluminous!)
              ctx.fillStyle = "#14421e"; // Deep shadow base
              ctx.beginPath();
              ctx.arc(sx, sy - 12 * ss, 22 * ss, 0, Math.PI * 2);
              ctx.arc(sx - 16 * ss, sy - 8 * ss, 16 * ss, 0, Math.PI * 2);
              ctx.arc(sx + 16 * ss, sy - 8 * ss, 16 * ss, 0, Math.PI * 2);
              ctx.fill();
              ctx.stroke();

              ctx.fillStyle = "#196f3d"; // Bright highlight layer
              ctx.beginPath();
              ctx.arc(sx, sy - 14 * ss, 16 * ss, 0, Math.PI * 2);
              ctx.arc(sx - 11 * ss, sy - 10 * ss, 12 * ss, 0, Math.PI * 2);
              ctx.arc(sx + 11 * ss, sy - 10 * ss, 12 * ss, 0, Math.PI * 2);
              ctx.fill();
              ctx.stroke();
            } else {
              if (s.seed < 0.75) {
                // --- PREMIUM WILD BERRY BUSH (Scaled up & layered) ---
                let bx = sx,
                  by = sy,
                  bs = ss * 1.35; // Expanded volume scale factor
                // Base dark foliage layer
                ctx.fillStyle = "#144222";
                ctx.beginPath();
                ctx.arc(bx, by - 6 * bs, 16 * bs, 0, Math.PI * 2);
                ctx.arc(bx - 10 * bs, by - 2 * bs, 11 * bs, 0, Math.PI * 2);
                ctx.arc(bx + 10 * bs, by - 2 * bs, 11 * bs, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();

                // Highlight leafy layer
                ctx.fillStyle = "#2ecc71";
                ctx.beginPath();
                ctx.arc(bx - 3 * bs, by - 8 * bs, 11 * bs, 0, Math.PI * 2);
                ctx.arc(bx + 3 * bs, by - 6 * bs, 10 * bs, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();

                // Glowing Wild Berries (Ruby red circles with specular highlights!)
                ctx.fillStyle = "#ef4444";
                let drawBerry = (bxOffset, byOffset, br) => {
                  ctx.beginPath();
                  ctx.arc(
                    bx + bxOffset * bs,
                    by + byOffset * bs,
                    br * bs,
                    0,
                    Math.PI * 2,
                  );
                  ctx.fill();
                  ctx.stroke();
                  ctx.fillStyle = "#fff";
                  ctx.beginPath();
                  ctx.arc(
                    bx + (bxOffset - 0.5) * bs,
                    by + (byOffset - 0.5) * bs,
                    br * 0.3 * bs,
                    0,
                    Math.PI * 2,
                  );
                  ctx.fill();
                  ctx.fillStyle = "#ef4444"; // reset
                };
                drawBerry(-8, -6, 2.2);
                drawBerry(6, -8, 2.5);
                drawBerry(-2, -2, 2.0);
                drawBerry(8, -1, 2.2);
              } else {
                // --- PREMIUM WILD FERNS / LEAFY SHRUBS (Scaled up & dense) ---
                ctx.fillStyle = "#1e824c";
                let fs = ss * 1.35; // Expanded height scale factor
                for (let i = 0; i < 4; i++) {
                  let curve = Math.sin(Date.now() / 180 + s.seed * 50 + i) * 3;
                  ctx.beginPath();
                  ctx.moveTo(sx - 8 + i * 5, sy);
                  ctx.quadraticCurveTo(
                    sx + curve,
                    sy - 28 * fs,
                    sx - 12 + i * 8 + curve,
                    sy - 32 * fs,
                  );
                  ctx.quadraticCurveTo(sx + curve, sy - 12, sx + 8, sy);
                  ctx.fill();
                  ctx.stroke();
                }
              }
            }
          }
        } else if (tier === 1) {
          if (s.type === "grass") {
            // --- COZY FROST-BITTEN ALPINE GRASS ---
            let sway = Math.sin(Date.now() / 200 + s.seed * 50) * 2 * ss;
            // Dark frozen backing blade
            ctx.fillStyle = "#1e293b";
            ctx.beginPath();
            ctx.moveTo(sx - 3 * ss, sy);
            ctx.quadraticCurveTo(
              sx - 5 * ss + sway,
              sy - 14 * ss,
              sx - 9 * ss + sway,
              sy - 18 * ss,
            );
            ctx.quadraticCurveTo(
              sx - 1 * ss + sway,
              sy - 8 * ss,
              sx + 2 * ss,
              sy,
            );
            ctx.fill();
            ctx.stroke();

            // Light blue/teal frost blade
            ctx.fillStyle = "#93c5fd"; // Soft ice blue
            ctx.beginPath();
            ctx.moveTo(sx - 1 * ss, sy);
            ctx.quadraticCurveTo(
              sx + sway,
              sy - 16 * ss,
              sx - 3 * ss + sway,
              sy - 21 * ss,
            );
            ctx.quadraticCurveTo(
              sx + 1 * ss + sway,
              sy - 10 * ss,
              sx + 3 * ss,
              sy,
            );
            ctx.fill();
            ctx.stroke();

            // Tiny white snowcap on the grass tip
            ctx.fillStyle = "#ffffff";
            ctx.beginPath();
            ctx.arc(sx - 3 * ss + sway, sy - 21 * ss, 2 * ss, 0, Math.PI * 2);
            ctx.fill();
          } else if (s.type === "flower") {
            // --- GLACIAL FROST CRYSTAL ---
            let hover = Math.sin(Date.now() / 250 + s.seed * 100) * 3 * ss;
            let cx = sx,
              cy = sy - 12 * ss + hover;

            ctx.save();
            ctx.shadowBlur = 10 * ss;
            ctx.shadowColor = "#38bdf8";

            // Translucent outer blue shard
            ctx.fillStyle = "rgba(14, 165, 233, 0.4)";
            ctx.beginPath();
            ctx.moveTo(cx, cy - 14 * ss);
            ctx.lineTo(cx + 8 * ss, cy);
            ctx.lineTo(cx, cy + 14 * ss);
            ctx.lineTo(cx - 8 * ss, cy);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Bright white core shard
            ctx.fillStyle = "#ffffff";
            ctx.beginPath();
            ctx.moveTo(cx, cy - 10 * ss);
            ctx.lineTo(cx + 5 * ss, cy);
            ctx.lineTo(cx, cy + 10 * ss);
            ctx.lineTo(cx - 5 * ss, cy);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            ctx.restore();

            // Tiny sparkly ice particles drifting upward
            ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
            let sparkY = (Date.now() / 20 + s.seed * 100) % 25;
            ctx.fillRect(cx - 4 * ss, cy - sparkY, 1.2 * ss, 1.2 * ss);
          } else {
            // --- MOSS-COVERED SNOWY RUIN BRICK (Replaces bushes) ---
            ctx.fillStyle = "#334155"; // Slate stone
            ctx.beginPath();
            ctx.rect(sx - 12 * ss, sy - 12 * ss, 24 * ss, 12 * ss);
            ctx.fill();
            ctx.stroke();

            // Frosty moss patch
            ctx.fillStyle = "#164d1f";
            ctx.beginPath();
            ctx.rect(sx - 12 * ss, sy - 12 * ss, 14 * ss, 3 * ss);
            ctx.fill();

            // Fluffy snow cap on the stone block
            ctx.fillStyle = "#ffffff";
            ctx.beginPath();
            ctx.roundRect(sx - 14 * ss, sy - 15 * ss, 28 * ss, 4.5 * ss, [
              1.5 * ss,
            ]);
            ctx.fill();
            ctx.stroke();
          }
        } else if (tier === 2) {
          if (s.type === "grass") {
            // Active Volcanic Fumarole (Puffing ash and sparks)
            ctx.fillStyle = "#1c0b08";
            ctx.strokeStyle = "#000000";
            ctx.lineWidth = penFgScenery * ss;
            ctx.beginPath();
            ctx.moveTo(sx - 9 * ss, sy);
            ctx.lineTo(sx - 4 * ss, sy - 7 * ss);
            ctx.lineTo(sx + 4 * ss, sy - 7 * ss);
            ctx.lineTo(sx + 9 * ss, sy);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Glowing molten core inside mouth
            ctx.fillStyle = "#e67e22";
            ctx.beginPath();
            ctx.ellipse(sx, sy - 7 * ss, 4 * ss, 1.5 * ss, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Translucent, expanding volcanic soot clouds
            let animT = (Date.now() / 800 + s.seed * 10) % 1.0;
            let puffY = sy - 8 * ss - animT * 22 * ss;
            let puffR = (2.2 + animT * 4.5) * ss;
            let puffAlpha = (1.0 - animT) * 0.45;

            ctx.fillStyle = `rgba(100, 95, 95, ${puffAlpha})`;
            ctx.beginPath();
            ctx.arc(
              sx + Math.sin(animT * 4) * 3 * ss,
              puffY,
              puffR,
              0,
              Math.PI * 2,
            );
            ctx.fill();

            // Rising single golden spark
            let sparkY =
              sy - 8 * ss - ((Date.now() / 400 + s.seed * 15) % 1.0) * 30 * ss;
            ctx.fillStyle = "#ffd700";
            ctx.fillRect(
              sx + Math.cos(Date.now() / 150 + s.seed * 5) * 3 * ss,
              sparkY,
              1.2 * ss,
              1.2 * ss,
            );
          } else if (s.type === "flower") {
            // Sharp Glowing Fire Crystal Cluster
            ctx.save();
            ctx.strokeStyle = "#000000";
            ctx.lineWidth = penFgScenery * ss;
            ctx.lineJoin = "miter";

            // Middle Crystal (Tallest)
            ctx.fillStyle = "#e74c3c";
            ctx.beginPath();
            ctx.moveTo(sx, sy);
            ctx.lineTo(sx - 3 * ss, sy - 14 * ss);
            ctx.lineTo(sx, sy - 18 * ss);
            ctx.lineTo(sx + 3 * ss, sy - 14 * ss);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Left side Crystal
            ctx.fillStyle = "#d35400";
            ctx.beginPath();
            ctx.moveTo(sx - 2 * ss, sy);
            ctx.lineTo(sx - 8 * ss, sy - 10 * ss);
            ctx.lineTo(sx - 5 * ss, sy - 13 * ss);
            ctx.lineTo(sx, sy - 6 * ss);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Right side Crystal
            ctx.fillStyle = "#ffd700";
            ctx.beginPath();
            ctx.moveTo(sx + 2 * ss, sy);
            ctx.lineTo(sx + 7 * ss, sy - 8 * ss);
            ctx.lineTo(sx + 4 * ss, sy - 11 * ss);
            ctx.lineTo(sx, sy - 5 * ss);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Glowing inner facet (pulses over time)
            let pulse = 0.5 + Math.sin(Date.now() / 180 + s.seed * 50) * 0.5;
            ctx.fillStyle = `rgba(255, 242, 0, ${0.45 + pulse * 0.45})`;
            ctx.beginPath();
            ctx.moveTo(sx, sy - 4 * ss);
            ctx.lineTo(sx - 1.2 * ss, sy - 12 * ss);
            ctx.lineTo(sx, sy - 15 * ss);
            ctx.lineTo(sx + 1.2 * ss, sy - 12 * ss);
            ctx.closePath();
            ctx.fill();

            ctx.restore();
          } else {
            // Scorched Roots & Basalt Brimstone Stone
            ctx.strokeStyle = "#000000";
            ctx.lineWidth = penFgScenery * ss;
            ctx.lineCap = "round";
            ctx.lineJoin = "round";

            // Basalt base stone
            ctx.fillStyle = "#2d0b06";
            ctx.beginPath();
            ctx.moveTo(sx - 12 * ss, sy);
            ctx.lineTo(sx - 6 * ss, sy - 8 * ss);
            ctx.lineTo(sx + 6 * ss, sy - 8 * ss);
            ctx.lineTo(sx + 12 * ss, sy);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = "#ff5500";
            ctx.beginPath();
            ctx.rect(sx - 3 * ss, sy - 8 * ss, 6 * ss, 2 * ss);
            ctx.fill();

            // Burnt black roots wrapping around the hot stone
            ctx.fillStyle = "#110200";
            ctx.beginPath();
            ctx.moveTo(sx - 14 * ss, sy);
            ctx.quadraticCurveTo(sx - 6 * ss, sy - 11 * ss, sx, sy - 4 * ss);
            ctx.lineTo(sx - 2 * ss, sy);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(sx + 14 * ss, sy);
            ctx.quadraticCurveTo(
              sx + 4 * ss,
              sy - 14 * ss,
              sx - 2 * ss,
              sy - 6 * ss,
            );
            ctx.lineTo(sx + 1 * ss, sy);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
          }
        } else if (tier === 3) {
          if (s.type === "grass") {
            ctx.fillStyle = "#144222";
            ctx.beginPath();
            ctx.ellipse(sx, sy - 2 * ss, 12 * ss, 4 * ss, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
          } else if (s.type === "flower") {
            ctx.fillStyle = "#5c503b";
            ctx.beginPath();
            ctx.rect(sx - 1.5 * ss, sy - 14 * ss, 3 * ss, 14 * ss);
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = "#9b59b6";
            ctx.beginPath();
            ctx.arc(sx, sy - 14 * ss, 7 * ss, Math.PI, 0);
            ctx.fill();
            ctx.stroke();
          } else {
            ctx.fillStyle = "#0c1a0c";
            ctx.beginPath();
            ctx.ellipse(sx, sy, 15 * ss, 7 * ss, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
          }
        } else {
          if (s.type === "grass") {
            let rot = Date.now() / 800 + s.seed * 100;
            ctx.fillStyle = "rgba(155, 89, 182, 0.7)";
            ctx.save();
            ctx.translate(sx, sy - 8);
            ctx.rotate(rot);
            ctx.beginPath();
            ctx.rect(-2 * ss, -2 * ss, 4 * ss, 4 * ss);
            ctx.fill();
            ctx.stroke();
            ctx.restore();
          } else if (s.type === "flower") {
            let hover = Math.sin(Date.now() / 300 + s.seed * 100) * 6;
            ctx.fillStyle = "#9b59b6";
            ctx.beginPath();
            ctx.moveTo(sx, sy - 16 + hover);
            ctx.lineTo(sx + 4 * ss, sy - 8 + hover);
            ctx.lineTo(sx, sy + hover);
            ctx.lineTo(sx - 4 * ss, sy - 8 + hover);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
          } else {
            let angle = Date.now() / 200;
            ctx.save();
            ctx.translate(sx, sy - 4);
            ctx.rotate(angle);
            let grad = ctx.createRadialGradient(0, 0, 1, 0, 0, 14 * ss);
            grad.addColorStop(0, "#000");
            grad.addColorStop(0.5, "#8e44ad");
            grad.addColorStop(1, "rgba(26,188,156,0)");
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.ellipse(0, 0, 16 * ss, 6 * ss, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            ctx.restore();
          }
        }
      }
      ctx.restore();
    });

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

    // Spawn floating morning fireflies in the Forest environment (Tier 0)
    if (
      window.getStageTier() === 0 &&
      !window.playerStats.isDungeonMode &&
      !window.playerStats.isCrucibleMode &&
      !window.playerStats.isPrestigeBossMode &&
      !window.isGamePaused
    ) {
      if (Math.random() < 0.12 && window.particles.length < 300) {
        window.particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * 240, // Spawn across the entire vertical height of the sky!
          vx: (Math.random() - 0.5) * 0.6,
          vy: -window.randFloat(0.15, 0.45), // Slow, drifting vertical float
          radius: window.randFloat(1.0, 2.5), // Beautiful pulsing bodies
          color:
            Math.random() > 0.45
              ? "rgba(163, 253, 131, 0.65)" // Glowing soft gold-green
              : "rgba(254, 240, 138, 0.55)", // Soft morning sun yellow
          alpha: 1.0,
          gravity: -0.005, // Drifts upward
          life: window.randInt(120, 200), // Longer lifespan to fill empty areas
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

    // 7. REVIVE EFFECT
    if (window.reviveTimer > 0) {
      ctx.save();
      let t = (90 - window.reviveTimer) / 90;
      let beamX = window.hero.x + 12;
      let groundY = 230;
      ctx.lineWidth = 3 * (1 - t);
      for (let i = 0; i < 3; i++) {
        let ringProgress = (t + i * 0.25) % 1.0;
        let ringAlpha = (1 - ringProgress) * 0.8;
        ctx.strokeStyle = `rgba(241, 196, 15, ${ringAlpha})`;
        ctx.beginPath();
        ctx.ellipse(
          beamX,
          groundY,
          ringProgress * 120,
          ringProgress * 25,
          0,
          0,
          Math.PI * 2,
        );
        ctx.stroke();
      }
      let outerBeam = ctx.createLinearGradient(beamX - 45, 0, beamX + 45, 0);
      outerBeam.addColorStop(0, "rgba(26, 188, 15, 0)");
      outerBeam.addColorStop(0.5, "rgba(26, 188, 15, " + 0.35 * (1 - t) + ")");
      outerBeam.addColorStop(1, "rgba(26, 188, 15, 0)");
      ctx.fillStyle = outerBeam;
      ctx.fillRect(beamX - 45, 0, 90, groundY);
      let innerBeam = ctx.createLinearGradient(beamX - 15, 0, beamX + 15, 0);
      innerBeam.addColorStop(0, "rgba(255, 255, 255, 0)");
      innerBeam.addColorStop(
        0.5,
        "rgba(255, 243, 176, " + 0.85 * (1 - t) + ")",
      );
      innerBeam.addColorStop(1, "rgba(255, 255, 255, 0)");
      ctx.fillStyle = innerBeam;
      ctx.fillRect(beamX - 15, 0, 30, groundY);
      ctx.fillStyle = "rgba(254, 211, 48, " + (1 - t) + ")";
      for (let i = 0; i < 10; i++) {
        let sparkSeed = Math.sin(i * 45.3) * 0.5 + 0.5;
        let sparkY = groundY - ((t * 220 + sparkSeed * 180) % 180);
        ctx.beginPath();
        ctx.arc(
          beamX + Math.sin(t * 8 + i) * 12 * sparkSeed,
          sparkY,
          (2 + sparkSeed * 3.5) * (1 - t),
          0,
          Math.PI * 2,
        );
        ctx.fill();
      }
      if (t < 0.3) {
        ctx.fillStyle = `rgba(255, 253, 235, ${(1 - t / 0.3) * 0.5})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      ctx.restore();
      window.reviveTimer--;
    }

    if (window.deathAnimationTimer > 0) {
      ctx.save();
      let t =
        (window.deathMaxFrames - window.deathAnimationTimer) /
        window.deathMaxFrames;
      let centerX = window.hero.x + 12;
      let centerY = window.hero.y + 15;
      let vignette = ctx.createRadialGradient(
        centerX,
        centerY,
        Math.max(10, 200 * (1 - t)),
        centerX,
        centerY,
        Math.max(100, 600 * (1 - t)),
      );
      vignette.addColorStop(0, "rgba(0, 0, 0, 0)");
      vignette.addColorStop(0.5, "rgba(20, 0, 0, " + t * 0.6 + ")");
      vignette.addColorStop(1, "rgba(0, 0, 0, " + t * 0.95 + ")");
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.restore();
    }

    // 8. PROJECTILES
    window.projectiles.forEach((proj) => {
      ctx.save();
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 2.0;
      let currentRad =
        proj.r + Math.sin(Date.now() / 80 + proj.pulseOffset) * 2;
      if (proj.isMaelstromCrescent) {
        ctx.fillStyle = "#2ecc71";
        ctx.beginPath();
        ctx.arc(proj.x, proj.y, currentRad, -Math.PI / 3, Math.PI / 3, false);
        ctx.quadraticCurveTo(
          proj.x - currentRad / 2,
          proj.y,
          proj.x,
          proj.y - currentRad * Math.sin(Math.PI / 3),
        );
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 1.2;
        ctx.stroke();
      } else {
        ctx.fillStyle = "#c0392b";
        ctx.beginPath();
        ctx.arc(proj.x, proj.y, currentRad + 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = "#e67e22";
        ctx.beginPath();
        ctx.arc(proj.x, proj.y, currentRad, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = "#f1c40f";
        ctx.beginPath();
        ctx.arc(proj.x, proj.y, currentRad * 0.55, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(proj.x - 2, proj.y - 2, currentRad * 0.25, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    });

    if (window.getStageTier() === 1 && !window.playerStats.isDungeonMode) {
      ctx.save();
      ctx.fillStyle = "rgba(240, 248, 255, 0.85)";
      ctx.shadowColor = "#ffffff";
      ctx.shadowBlur = 2;
      window.snowflakes.forEach((sf) => {
        ctx.beginPath();
        ctx.arc(sf.x, sf.y, sf.r, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();
    }

    // 9. BOSS UI
    if (
      window.mob &&
      [
        "boss",
        "dungeon_boss",
        "prestige_boss",
        "rift_guardian",
        "aegis_goliath",
        "chronos_arbitrator",
        "nexus_overseer",
      ].includes(window.mob.type)
    ) {
      ctx.save();
      let bossName = "Threat Detected";
      let barColor = "#e74c3c";
      let barGlow = "#c0392b";
      if (window.mob.type === "prestige_boss") {
        bossName = "Hooktail, The Scarlet Calamity";
        barColor = "#e67e22";
        barGlow = "#f1c40f";
      } else if (window.mob.type === "aegis_goliath") {
        bossName = "Aegis Goliath, The Iron Sentinel";
        barColor = "#3498db";
        barGlow = "#2ecc71";
      } else if (window.mob.type === "chronos_arbitrator") {
        bossName = "Chronos Arbitrator, The Timeless God";
        barColor = "#f1c40f";
        barGlow = "#dca04c";
      } else if (window.mob.type === "nexus_overseer") {
        bossName = "Nexus Overseer, The Glitch Singularity";
        barColor = "#ff007f";
        barGlow = "#e84393";
      } else if (window.mob.type === "dungeon_boss") {
        if (window.mob.isCrucible) {
          bossName = "Astral Guardian";
          barColor = "#8e44ad";
          barGlow = "#e84393";
        } else {
          let dType =
            window.mob.visualType === "gilded_vault_keeper"
              ? "gold"
              : window.mob.visualType === "corrosive_abomination"
                ? "mat"
                : window.mob.visualType === "overlord_iron_vault"
                  ? "equip"
                  : window.playerStats.currentDungeon || "gold";
          if (dType === "gold") {
            bossName = "Gilded Vault Keeper";
            barColor = "#f1c40f";
            barGlow = "#d4af37";
          } else if (dType === "mat") {
            bossName = "Corrosive Abomination";
            barColor = "#2ecc71";
            barGlow = "#27ae60";
          } else {
            bossName = "Overlord of the Iron Vault";
            barColor = "#3498db";
            barGlow = "#2980b9";
          }
        }
      } else {
        bossName = "Stage Warden";
      }

      let barW = canvas.width * (canvas.width <= 420 ? 0.75 : 0.55);
      let barH = 14;
      let barX = (canvas.width - barW) / 2;
      let barY = 52;
      ctx.fillStyle = "#111111";
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 3;
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(barX, barY, barW, barH, 4);
      else ctx.rect(barX, barY, barW, barH);
      ctx.fill();
      ctx.stroke();

      let bHp = BigNum.from(window.mob.hp);
      let bMaxHp = BigNum.from(window.mob.maxHp);
      let hpPct = Math.max(
        0,
        Math.min(
          1,
          Number(
            bHp.div(bMaxHp).m * Math.pow(10, Math.min(15, bHp.div(bMaxHp).e)),
          ),
        ),
      );

      // High-performance percentage lerp replaces heavy float trailing HP updates
      window.mob.trailingPct =
        window.mob.trailingPct !== undefined ? window.mob.trailingPct : hpPct;
      if (window.mob.trailingPct > hpPct) {
        window.mob.trailingPct = Math.max(
          hpPct,
          window.mob.trailingPct - 0.012,
        );
      } else {
        window.mob.trailingPct = hpPct;
      }
      let trailingPct = window.mob.trailingPct;

      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      if (ctx.roundRect)
        ctx.roundRect(
          barX + 2,
          barY + 2,
          Math.max(0, (barW - 4) * trailingPct),
          barH - 4,
          2,
        );
      else
        ctx.rect(
          barX + 2,
          barY + 2,
          Math.max(0, (barW - 4) * trailingPct),
          barH - 4,
        );
      ctx.fill();

      let fillGrad = ctx.createLinearGradient(barX, barY, barX, barY + barH);
      fillGrad.addColorStop(0, barColor);
      fillGrad.addColorStop(1, barGlow);
      ctx.fillStyle = fillGrad;
      ctx.beginPath();
      if (ctx.roundRect)
        ctx.roundRect(
          barX + 2,
          barY + 2,
          Math.max(0, (barW - 4) * hpPct),
          barH - 4,
          2,
        );
      else
        ctx.rect(barX + 2, barY + 2, Math.max(0, (barW - 4) * hpPct), barH - 4);
      ctx.fill();

      if (window.mob.funnyTextTimer > 0 && window.mob.funnyText) {
        ctx.save();
        ctx.translate(barX + barW / 2, barY + barH / 2);
        // Removed rotation to match straight retro arcade aesthetic
        ctx.font = "900 13px 'Arial Black', 'Impact', sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 3.5;
        ctx.lineJoin = "round";
        ctx.strokeText(window.mob.funnyText.toUpperCase(), 0, 0);
        ctx.fillStyle = "#ffffff"; // Solid white fill to match the reference style
        ctx.fillText(window.mob.funnyText.toUpperCase(), 0, 0);
        ctx.restore();
      }

      ctx.font = "bold 11px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 3;
      ctx.strokeText(bossName, canvas.width / 2, barY - 4);
      ctx.fillStyle = "#ffffff";
      ctx.fillText(bossName, canvas.width / 2, barY - 4);

      // Boss Bleed Row
      if (window.mob.bleedStacks > 0) {
        let dotSize = 3.5;
        let dotSpacing = 5;
        let totalWidth = 5 * (dotSize * 2) + 4 * dotSpacing;
        let startDotX = (canvas.width - totalWidth) / 2;
        let dotY = barY + barH + 7;
        for (let i = 0; i < 5; i++) {
          ctx.beginPath();
          ctx.arc(
            startDotX + i * (dotSize * 2 + dotSpacing) + dotSize,
            dotY,
            dotSize,
            0,
            Math.PI * 2,
          );
          if (i < window.mob.bleedStacks) {
            ctx.fillStyle = "#e74c3c";
            ctx.shadowColor = "#e74c3c";
            ctx.shadowBlur = 4;
          } else {
            ctx.fillStyle = "rgba(44, 62, 80, 0.7)";
          }
          ctx.fill();
          ctx.strokeStyle = "#000000";
          ctx.lineWidth = 1.2;
          ctx.stroke();
          ctx.shadowBlur = 0;
        }
      }
      // Boss Poison Row (Ticked slightly lower)
      if (window.mob.poisonStacks > 0) {
        let dotSize = 3.5;
        let dotSpacing = 5;
        let totalWidth = 5 * (dotSize * 2) + 4 * dotSpacing;
        let startDotX = (canvas.width - totalWidth) / 2;
        let dotY = barY + barH + 17;
        for (let i = 0; i < 5; i++) {
          ctx.beginPath();
          ctx.arc(
            startDotX + i * (dotSize * 2 + dotSpacing) + dotSize,
            dotY,
            dotSize,
            0,
            Math.PI * 2,
          );
          if (i < window.mob.poisonStacks) {
            ctx.fillStyle = "#2ecc71";
            ctx.shadowColor = "#2ecc71";
            ctx.shadowBlur = 4;
          } else {
            ctx.fillStyle = "rgba(26, 82, 40, 0.7)";
          }
          ctx.fill();
          ctx.strokeStyle = "#000000";
          ctx.lineWidth = 1.2;
          ctx.stroke();
          ctx.shadowBlur = 0;
        }
      }
      ctx.restore();
    }

    // 10. BUFF ICONS & DPS HUD
    let pStats = window.resolvePlayerStats();
    let activeBuffsList = [];
    let potDurationMax = 18000 * (1 + pStats.int * 0.001);
    let normalBuffMax = window.checkArtifactTrait("extend_buffs") ? 900 : 600;

    if (window.playerStats.frenzyTimer > 0)
      activeBuffsList.push({
        icon: "🔥",
        timer: window.playerStats.frenzyTimer,
        max: normalBuffMax,
        color: "#e67e22",
      });
    if (window.playerStats.adrenalineTimer > 0)
      activeBuffsList.push({
        icon: "⚡",
        timer: window.playerStats.adrenalineTimer,
        max: normalBuffMax,
        color: "#f1c40f",
      });
    if (window.playerStats.atkPotionTimer > 0)
      activeBuffsList.push({
        icon: "⚔️",
        timer: window.playerStats.atkPotionTimer,
        max: potDurationMax,
        color: "#2ecc71",
      });
    if (window.playerStats.hpPotionTimer > 0)
      activeBuffsList.push({
        icon: "❤️",
        timer: window.playerStats.hpPotionTimer,
        max: potDurationMax,
        color: "#e74c3c",
      });
    if (window.playerStats.defPotionTimer > 0)
      activeBuffsList.push({
        icon: "🛡️",
        timer: window.playerStats.defPotionTimer,
        max: potDurationMax,
        color: "#3498db",
      });
    if (window.playerStats.hastePotionTimer > 0)
      activeBuffsList.push({
        icon: "👟",
        timer: window.playerStats.hastePotionTimer,
        max: potDurationMax,
        color: "#f1c40f",
      });
    if (window.playerStats.xpPotionTimer > 0)
      activeBuffsList.push({
        icon: "🧠",
        timer: window.playerStats.xpPotionTimer,
        max: potDurationMax,
        color: "#a855f7",
      });
    if (window.playerStats.dropPotionTimer > 0)
      activeBuffsList.push({
        icon: "🍀",
        timer: window.playerStats.dropPotionTimer,
        max: potDurationMax,
        color: "#22c55e",
      });
    if (window.playerStats.qlyPotionTimer > 0)
      activeBuffsList.push({
        icon: "💎",
        timer: window.playerStats.qlyPotionTimer,
        max: potDurationMax,
        color: "#ec4899",
      });

    if (
      window.equippedSlots.weapon &&
      window.equippedSlots.weapon.isUniqueSingularity
    ) {
      if (window.playerStats.singularityState === "dormant")
        activeBuffsList.push({
          icon: "🌌",
          timer: window.playerStats.singularityTimer || 1800,
          max: 1800,
          color: "#5b2c6f",
        });
      else if (window.playerStats.singularityState === "pulsing")
        activeBuffsList.push({
          icon: "💫",
          timer: window.playerStats.singularityTimer || 420,
          max: 420,
          color: Math.floor(Date.now() / 150) % 2 === 0 ? "#ff007f" : "#8e44ad",
        });
      else if (window.playerStats.singularityState === "storing")
        activeBuffsList.push({
          icon: "⚛️",
          timer: window.playerStats.singularityTimer || 300,
          max: 300,
          color: "#e84393",
        });
    }

    let startX = 15;
    let startY = 10;
    let iconSize = 28;
    let spacing = 8;
    activeBuffsList.forEach((buff, idx) => {
      let bx = startX + idx * (iconSize + spacing);
      let by = startY;
      ctx.save();
      ctx.fillStyle = "#1c1c1c";
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 2;
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(bx, by, iconSize, iconSize, 4);
      else ctx.rect(bx, by, iconSize, iconSize);
      ctx.fill();
      ctx.stroke();
      let progressPct = Math.min(1, buff.timer / buff.max);
      ctx.beginPath();
      ctx.arc(
        bx + iconSize / 2,
        by + iconSize / 2,
        iconSize / 2 - 2,
        -Math.PI / 2,
        -Math.PI / 2 + Math.PI * 2 * progressPct,
      );
      ctx.strokeStyle = buff.color;
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.fillStyle = "#ffffff";
      ctx.font = "12px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(buff.icon, bx + iconSize / 2, by + iconSize / 2);
      let secondsLeft = Math.ceil(buff.timer / 60);
      ctx.font = "bold 8px monospace";
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 2;
      ctx.strokeText(secondsLeft + "s", bx + iconSize / 2, by + iconSize + 6);
      ctx.fillText(secondsLeft + "s", bx + iconSize / 2, by + iconSize + 6);
      ctx.restore();
    });

    window.particles.forEach((pt) => {
      ctx.save();
      if (pt.alpha !== undefined) ctx.globalAlpha = pt.alpha;
      ctx.fillStyle = pt.color;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    window.effects.forEach((eff) => {
      ctx.save();
      let hx = eff.x;
      let hy = eff.y - 5; // Align centered vertically with text

      if (eff.type === "regen") {
        // 1. Draw Cel-Shaded RPG Crimson Heart
        ctx.beginPath();
        ctx.moveTo(hx, hy - 4);
        ctx.bezierCurveTo(hx - 4, hy - 9, hx - 9, hy - 4, hx - 9, hy + 1);
        ctx.quadraticCurveTo(hx - 9, hy + 6, hx, hy + 12);
        ctx.quadraticCurveTo(hx + 9, hy + 6, hx + 9, hy + 1);
        ctx.bezierCurveTo(hx + 9, hy - 4, hx + 4, hy - 9, hx, hy - 4);
        ctx.closePath();

        ctx.fillStyle = "#e74c3c"; // Crimson red
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 3.5;
        ctx.lineJoin = "round";
        ctx.stroke();
        ctx.fill();

        // 16-bit Specs highlight shine
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(hx - 2.5, hy - 3.5, 1.5, 0, Math.PI * 2);
        ctx.fill();

        // 2. Draw +n Green Healing Numbers
        let hitText = `+${window.formatNumber(eff.amount)}`;
        ctx.font = "bold 15px monospace";
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 3.5;
        ctx.lineJoin = "round";
        ctx.strokeText(hitText, hx + 14, hy + 4);
        ctx.fillStyle = eff.color || "#2ecc71";
        ctx.fillText(hitText, hx + 14, hy + 4);
      } else if (eff.type === "crit") {
        let fixedAngle = 0.35; // Completely static, NO SPINNING as the text floats!

        // 1. Draw 3-Layer Vector Spiky Cartoon Explosion (💥 Silhouette)
        let spikes = 6; // 6 prominent points for an asymmetric comic explosion feel

        // Layer 1: Outer Crimson-Red Blast (Asymmetric & spiky)
        ctx.beginPath();
        for (let i = 0; i < spikes * 2; i++) {
          let angle = (i * Math.PI) / spikes + fixedAngle;
          let r = i % 2 === 0 ? 14 : 3.5; // High contrast between points and valleys
          ctx.lineTo(hx + Math.cos(angle) * r, hy + Math.sin(angle) * r);
        }
        ctx.closePath();
        ctx.fillStyle = "#e74c3c"; // Vibrant red-orange
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 3.5;
        ctx.lineJoin = "round";
        ctx.stroke();
        ctx.fill();

        // Layer 2: Inner Golden-Yellow Blast
        ctx.beginPath();
        for (let i = 0; i < spikes * 2; i++) {
          let angle = (i * Math.PI) / spikes + fixedAngle;
          let r = i % 2 === 0 ? 9 : 2.5;
          ctx.lineTo(hx + Math.cos(angle) * r, hy + Math.sin(angle) * r);
        }
        ctx.closePath();
        ctx.fillStyle = "#f1c40f"; // Bright gold-yellow
        ctx.fill();

        // Layer 3: Central White-Hot Core Flash
        ctx.beginPath();
        for (let i = 0; i < spikes * 2; i++) {
          let angle = (i * Math.PI) / spikes + fixedAngle;
          let r = i % 2 === 0 ? 5.5 : 1.5;
          ctx.lineTo(hx + Math.cos(angle) * r, hy + Math.sin(angle) * r);
        }
        ctx.closePath();
        ctx.fillStyle = "#ffffff";
        ctx.fill();

        // 2. Draw Heavy Gold-to-Crimson Gradient Typography (No leading "+")
        let hitText = window.formatNumber(eff.amount);
        ctx.font = "900 18px 'Arial Black', Impact, sans-serif";
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 4.5;
        ctx.lineJoin = "round";
        ctx.strokeText(hitText, hx + 16, hy + 5);

        let textGrad = ctx.createLinearGradient(
          hx + 16,
          hy - 10,
          hx + 16,
          hy + 10,
        );
        textGrad.addColorStop(0, "#fff200"); // Yellow Gold
        textGrad.addColorStop(0.5, "#f39c12"); // Vibrant Orange
        textGrad.addColorStop(1, "#ee5253"); // Searing Red-Orange
        ctx.fillStyle = textGrad;
        ctx.fillText(hitText, hx + 16, hy + 5);
      } else if (eff.type === "block") {
        // 1. Draw Symmetric Steel Heater Shield
        ctx.beginPath();
        ctx.moveTo(hx - 6, hy - 6);
        ctx.lineTo(hx + 6, hy - 6);
        ctx.quadraticCurveTo(hx + 6, hy, hx + 5, hy + 3);
        ctx.quadraticCurveTo(hx, hy + 10, hx, hy + 10);
        ctx.quadraticCurveTo(hx - 5, hy + 3, hx - 6, hy);
        ctx.quadraticCurveTo(hx - 6, hy, hx - 6, hy - 6);
        ctx.closePath();

        ctx.fillStyle = "#3498db"; // Sturdy Steel Blue
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 3.5;
        ctx.lineJoin = "round";
        ctx.stroke();
        ctx.fill();

        // Silver/White Cross Emblem
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(hx, hy - 5);
        ctx.lineTo(hx, hy + 8);
        ctx.moveTo(hx - 4, hy + 1);
        ctx.lineTo(hx + 4, hy + 1);
        ctx.stroke();

        // 2. Draw Text "BLOCK" (Sleek Blue)
        ctx.font = "bold 15px monospace";
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 3.5;
        ctx.lineJoin = "round";
        ctx.strokeText("BLOCK", hx + 13, hy + 4);
        ctx.fillStyle = "#3498db";
        ctx.fillText("BLOCK", hx + 13, hy + 4);
      } else if (eff.type === "parry") {
        // 1. Draw Crossed Steel Sabers (💥 Parry Clash) - Perfectly sized & crisp outlines
        ctx.save();
        ctx.translate(hx, hy);

        // Saber 1 (bottom-left to top-right)
        ctx.save();
        ctx.rotate(Math.PI / 4);
        ctx.fillStyle = "#ecf0f1"; // Clean silver-white
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 1.5; // Proper thin outline
        ctx.lineJoin = "round";
        ctx.beginPath();
        ctx.rect(-2.5, -18, 5, 22); // Wider, longer blade
        ctx.fill();
        ctx.stroke();

        // Blade edge highlight
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.rect(0, -18, 2.5, 22);
        ctx.fill();

        // Crossguard
        ctx.fillStyle = "#f1c40f"; // Gold
        ctx.beginPath();
        ctx.rect(-6, 4, 12, 3);
        ctx.fill();
        ctx.stroke();

        // Red Pommel
        ctx.fillStyle = "#e74c3c";
        ctx.beginPath();
        ctx.arc(0, 10, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();

        // Saber 2 (bottom-right to top-left)
        ctx.save();
        ctx.rotate(-Math.PI / 4);
        ctx.fillStyle = "#ecf0f1"; // Clean silver-white
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 1.5;
        ctx.lineJoin = "round";
        ctx.beginPath();
        ctx.rect(-2.5, -18, 5, 22);
        ctx.fill();
        ctx.stroke();

        // Blade edge highlight
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.rect(0, -18, 2.5, 22);
        ctx.fill();

        // Crossguard
        ctx.fillStyle = "#f1c40f"; // Gold
        ctx.beginPath();
        ctx.rect(-6, 4, 12, 3);
        ctx.fill();
        ctx.stroke();

        // Red Pommel
        ctx.fillStyle = "#e74c3c";
        ctx.beginPath();
        ctx.arc(0, 10, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();

        ctx.restore();

        // 2. Draw Text "PARRY" (Vibrant Purple)
        ctx.font = "bold 15px monospace";
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 3.5;
        ctx.lineJoin = "round";
        ctx.strokeText("PARRY", hx + 13, hy + 4);
        ctx.fillStyle = "#9b59b6";
        ctx.fillText("PARRY", hx + 13, hy + 4);
      } else if (eff.type === "barrier") {
        // 1. Draw concentric circles with black shadows/under-stroke first
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 4.0;
        ctx.lineJoin = "round";
        ctx.beginPath();
        ctx.arc(hx, hy, 8, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(hx, hy, 4, 0, Math.PI * 2);
        ctx.stroke();

        // Core cross outlines
        ctx.beginPath();
        ctx.moveTo(hx - 4, hy);
        ctx.lineTo(hx + 4, hy);
        ctx.moveTo(hx, hy - 4);
        ctx.lineTo(hx, hy + 4);
        ctx.stroke();

        // 2. Colored overlay
        ctx.strokeStyle = "#9b59b6"; // Arcane Purple
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.arc(hx, hy, 8, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(hx, hy, 4, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1.0;
        ctx.beginPath();
        ctx.moveTo(hx - 3, hy);
        ctx.lineTo(hx + 3, hy);
        ctx.moveTo(hx, hy - 3);
        ctx.lineTo(hx, hy + 3);
        ctx.stroke();

        // 2. Draw Text "BARRIER -X%"
        let hitText = `BARRIER -${eff.amount}%`;
        ctx.font = "bold 15px monospace";
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 3.5;
        ctx.lineJoin = "round";
        ctx.strokeText(hitText, hx + 14, hy + 4);
        ctx.fillStyle = "#9b59b6";
        ctx.fillText(hitText, hx + 14, hy + 4);
      } else if (eff.type === "lightning") {
        // 1. Draw Sharp Golden Lightning Bolt
        ctx.beginPath();
        ctx.moveTo(hx + 2.5, hy - 9);
        ctx.lineTo(hx - 5, hy + 1.5);
        ctx.lineTo(hx - 0.5, hy + 1.5);
        ctx.lineTo(hx - 4.5, hy + 10);
        ctx.lineTo(hx + 4.5, hy - 0.5);
        ctx.lineTo(hx, hy - 0.5);
        ctx.closePath();

        ctx.fillStyle = "#f1c40f"; // Yellow lightning
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 3.5;
        ctx.lineJoin = "round";
        ctx.stroke();
        ctx.fill();

        // Flash inner shine
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1.0;
        ctx.beginPath();
        ctx.moveTo(hx + 1, hy - 6);
        ctx.lineTo(hx - 3, hy + 1);
        ctx.stroke();

        // 2. Draw Damage Text (Bright Yellow)
        let hitText = window.formatNumber(eff.amount);
        ctx.font = "bold 15px monospace";
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 3.5;
        ctx.lineJoin = "round";
        ctx.strokeText(hitText, hx + 14, hy + 4);
        ctx.fillStyle = "#f1c40f";
        ctx.fillText(hitText, hx + 14, hy + 4);
      } else if (eff.type === "fire") {
        // 1. Draw 2-Layer Flickering Fire Flame
        // Outer Flame (Vibrant Orange)
        ctx.beginPath();
        ctx.moveTo(hx, hy - 9);
        ctx.quadraticCurveTo(hx - 7, hy - 2, hx - 7, hy + 4);
        ctx.quadraticCurveTo(hx - 7, hy + 9.5, hx, hy + 9.5);
        ctx.quadraticCurveTo(hx + 7, hy + 9.5, hx + 7, hy + 4);
        ctx.quadraticCurveTo(hx + 7, hy - 2, hx, hy - 9);
        ctx.closePath();
        ctx.fillStyle = "#e67e22"; // Orange
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 3.5;
        ctx.lineJoin = "round";
        ctx.stroke();
        ctx.fill();

        // Inner Flame Core (Hot Yellow)
        ctx.beginPath();
        ctx.moveTo(hx, hy - 4);
        ctx.quadraticCurveTo(hx - 4, hy + 1, hx - 4, hy + 5.5);
        ctx.quadraticCurveTo(hx - 4, hy + 8, hx, hy + 8);
        ctx.quadraticCurveTo(hx + 4, hy + 8, hx + 4, hy + 5.5);
        ctx.quadraticCurveTo(hx + 4, hy + 1, hx, hy - 4);
        ctx.closePath();
        ctx.fillStyle = "#f1c40f"; // Hot Yellow
        ctx.fill();

        // 2. Draw Damage Text (Orange)
        let hitText = window.formatNumber(eff.amount);
        ctx.font = "bold 15px monospace";
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 3.5;
        ctx.lineJoin = "round";
        ctx.strokeText(hitText, hx + 14, hy + 4);
        ctx.fillStyle = "#e67e22";
        ctx.fillText(hitText, hx + 14, hy + 4);
      } else if (eff.type === "frost") {
        // 1. Draw Sharp Geometric Ice Shard
        ctx.beginPath();
        ctx.moveTo(hx, hy - 9);
        ctx.lineTo(hx + 6, hy);
        ctx.lineTo(hx, hy + 9);
        ctx.lineTo(hx - 6, hy);
        ctx.closePath();

        ctx.fillStyle = "#dff9fb"; // Icy white
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 3.5;
        ctx.lineJoin = "round";
        ctx.stroke();
        ctx.fill();

        // Inner frost veins (Light Blue)
        ctx.strokeStyle = "#3498db";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(hx - 4, hy);
        ctx.lineTo(hx + 4, hy);
        ctx.moveTo(hx, hy - 6);
        ctx.lineTo(hx, hy + 6);
        ctx.stroke();

        // 2. Draw Damage Text (Cool Ice Blue)
        let hitText = window.formatNumber(eff.amount);
        ctx.font = "bold 15px monospace";
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 3.5;
        ctx.lineJoin = "round";
        ctx.strokeText(hitText, hx + 14, hy + 4);
        ctx.fillStyle = "#3498db";
        ctx.fillText(hitText, hx + 14, hy + 4);
      } else if (eff.type === "slash") {
        // 1. Draw Crossed Swords (Cel-Shaded)
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 3.5;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        // Blade 1 outline
        ctx.beginPath();
        ctx.moveTo(hx - 8, hy + 8);
        ctx.lineTo(hx + 8, hy - 8);
        ctx.stroke();

        // Blade 2 outline
        ctx.beginPath();
        ctx.moveTo(hx + 8, hy + 8);
        ctx.lineTo(hx - 8, hy - 8);
        ctx.stroke();

        // Fill Blade 1 (Silver)
        ctx.strokeStyle = "#ecf0f1";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(hx - 8, hy + 8);
        ctx.lineTo(hx + 8, hy - 8);
        ctx.stroke();

        // Fill Blade 2 (Silver)
        ctx.beginPath();
        ctx.moveTo(hx + 8, hy + 8);
        ctx.lineTo(hx - 8, hy - 8);
        ctx.stroke();

        // Crossguards (Gold dots)
        ctx.fillStyle = "#f1c40f";
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(hx - 3, hy + 3, 2, 0, Math.PI * 2);
        ctx.arc(hx + 3, hy + 3, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // 2. Draw Damage Text (White)
        let hitText = window.formatNumber(eff.amount);
        ctx.font = "bold 15px monospace";
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 3.5;
        ctx.lineJoin = "round";
        ctx.strokeText(hitText, hx + 14, hy + 4);
        ctx.fillStyle = eff.color || "#fff";
        ctx.fillText(hitText, hx + 14, hy + 4);
      } else if (eff.type === "dagger") {
        // 1. Draw sharp pointed stiletto (Cel-Shaded) - Highly visible & beautifully outlined
        ctx.save();
        ctx.translate(hx, hy);
        ctx.rotate(-Math.PI / 4); // Angled up-right

        // Blade outline - scaled up nicely to prevent black lines overlapping the face
        ctx.fillStyle = "#ecf0f1"; // Clean silver-white
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 1.5; // Appropriate thin stroke
        ctx.lineJoin = "round";
        ctx.beginPath();
        ctx.moveTo(-4, 4);
        ctx.lineTo(0, -18);
        ctx.lineTo(4, 4);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Shimmer highlight on blade half
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.moveTo(0, -18);
        ctx.lineTo(4, 4);
        ctx.lineTo(0, 4);
        ctx.closePath();
        ctx.fill();

        // Gold Guard (Larger, more visible)
        ctx.fillStyle = "#f1c40f";
        ctx.beginPath();
        ctx.roundRect(-8, 4, 16, 4, [2]);
        ctx.fill();
        ctx.stroke();

        // Wood Hilt (Larger, more visible)
        ctx.fillStyle = "#5c3a21";
        ctx.beginPath();
        ctx.rect(-2.5, 8, 5, 10);
        ctx.fill();
        ctx.stroke();

        // Pommel jewel
        ctx.fillStyle = "#e74c3c";
        ctx.beginPath();
        ctx.arc(0, 18, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();

        // 2. Draw Damage Text (Muted Steel Blue)
        let hitText = window.formatNumber(eff.amount);
        ctx.font = "bold 15px monospace";
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 3.5;
        ctx.lineJoin = "round";
        ctx.strokeText(hitText, hx + 14, hy + 4);
        ctx.fillStyle = eff.color || "#fff";
        ctx.fillText(hitText, hx + 14, hy + 4);
      } else if (eff.type === "echo") {
        // 1. Draw Ghostly Purple Skull/Wisp (Cel-Shaded)
        ctx.fillStyle = "#9b59b6";
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 3.5;
        ctx.lineJoin = "round";
        ctx.beginPath();
        ctx.arc(hx, hy - 2, 6, Math.PI, 0, false);
        ctx.quadraticCurveTo(hx + 6, hy + 6, hx + 3, hy + 8);
        ctx.lineTo(hx - 3, hy + 8);
        ctx.quadraticCurveTo(hx - 6, hy + 6, hx - 6, hy - 2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Black eyes
        ctx.fillStyle = "#000000";
        ctx.beginPath();
        ctx.arc(hx - 2, hy - 2, 1.5, 0, Math.PI * 2);
        ctx.arc(hx + 2, hy - 2, 1.5, 0, Math.PI * 2);
        ctx.fill();

        // 2. Draw Damage Text (Soft Purple)
        let hitText = window.formatNumber(eff.amount);
        ctx.font = "bold 15px monospace";
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 3.5;
        ctx.lineJoin = "round";
        ctx.strokeText(hitText, hx + 14, hy + 4);
        ctx.fillStyle = eff.color || "#9b59b6";
        ctx.fillText(hitText, hx + 14, hy + 4);
      } else if (eff.type === "counter") {
        // 1. Draw Golden Mini Heater Shield (Cel-Shaded)
        ctx.fillStyle = "#f1c40f"; // Golden counter shield
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 3.5;
        ctx.lineJoin = "round";
        ctx.beginPath();
        ctx.moveTo(hx - 6, hy - 6);
        ctx.lineTo(hx + 6, hy - 6);
        ctx.quadraticCurveTo(hx + 6, hy, hx + 5, hy + 3);
        ctx.quadraticCurveTo(hx, hy + 9, hx, hy + 9);
        ctx.quadraticCurveTo(hx - 5, hy + 3, hx - 6, hy);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Red interior crest
        ctx.fillStyle = "#e74c3c";
        ctx.beginPath();
        ctx.moveTo(hx - 3, hy - 4);
        ctx.lineTo(hx + 3, hy - 4);
        ctx.quadraticCurveTo(hx + 3, hy, hx, hy + 5);
        ctx.quadraticCurveTo(hx - 3, hy, hx - 3, hy - 4);
        ctx.closePath();
        ctx.fill();

        // 2. Draw Damage Text (Golden Orange)
        let hitText = window.formatNumber(eff.amount);
        ctx.font = "bold 15px monospace";
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 3.5;
        ctx.lineJoin = "round";
        ctx.strokeText(hitText, hx + 14, hy + 4);
        ctx.fillStyle = eff.color || "#f1c40f";
        ctx.fillText(hitText, hx + 14, hy + 4);
      } else if (eff.type === "aegis_counter") {
        // 1. Draw Purple Aegis Shield (Cel-Shaded)
        ctx.fillStyle = "#8e44ad"; // Void purple
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 3.5;
        ctx.lineJoin = "round";
        ctx.beginPath();
        ctx.moveTo(hx - 6, hy - 6);
        ctx.lineTo(hx + 6, hy - 6);
        ctx.lineTo(hx + 8, hy + 2);
        ctx.lineTo(hx, hy + 10);
        ctx.lineTo(hx - 8, hy + 2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Glowing cyan core center cross
        ctx.strokeStyle = "#00ffff";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(hx, hy - 4);
        ctx.lineTo(hx, hy + 7);
        ctx.moveTo(hx - 4, hy + 1);
        ctx.lineTo(hx + 4, hy + 1);
        ctx.stroke();

        // 2. Draw Damage Text (Glowing Purple-Pink)
        let hitText = window.formatNumber(eff.amount);
        ctx.font = "bold 15px monospace";
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 3.5;
        ctx.lineJoin = "round";
        ctx.strokeText(hitText, hx + 14, hy + 4);
        ctx.fillStyle = eff.color || "#8e44ad";
        ctx.fillText(hitText, hx + 14, hy + 4);
      } else if (eff.type === "parry_counter") {
        // 1. Draw Crossed Mini Steel Sabers (Cel-Shaded)
        ctx.save();
        ctx.translate(hx, hy);
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 1.5;
        ctx.lineJoin = "round";

        // Saber 1 (bottom-left to top-right)
        ctx.save();
        ctx.rotate(Math.PI / 4);
        ctx.fillStyle = "#ecf0f1";
        ctx.beginPath();
        ctx.rect(-1.2, -10, 2.4, 12);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = "#f1c40f";
        ctx.fillRect(-3, 2, 6, 1.5);
        ctx.strokeRect(-3, 2, 6, 1.5);
        ctx.restore();

        // Saber 2 (bottom-right to top-left)
        ctx.save();
        ctx.rotate(-Math.PI / 4);
        ctx.fillStyle = "#ecf0f1";
        ctx.beginPath();
        ctx.rect(-1.2, -10, 2.4, 12);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = "#f1c40f";
        ctx.fillRect(-3, 2, 6, 1.5);
        ctx.strokeRect(-3, 2, 6, 1.5);
        ctx.restore();

        ctx.restore();

        // 2. Draw Damage Text (Vibrant Parry Purple)
        let hitText = window.formatNumber(eff.amount);
        ctx.font = "bold 15px monospace";
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 3.5;
        ctx.lineJoin = "round";
        ctx.strokeText(hitText, hx + 14, hy + 4);
        ctx.fillStyle = eff.color || "#9b59b6";
        ctx.fillText(hitText, hx + 14, hy + 4);
      } else if (eff.type === "bleed") {
        // 1. Draw Shiny Crimson Blood Droplet
        ctx.fillStyle = "#c0392b"; // Deep crimson blood
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 3.5;
        ctx.lineJoin = "round";
        ctx.beginPath();
        ctx.moveTo(hx, hy - 8);
        ctx.quadraticCurveTo(hx - 6, hy, hx - 6, hy + 4);
        ctx.quadraticCurveTo(hx - 6, hy + 9, hx, hy + 9);
        ctx.quadraticCurveTo(hx + 6, hy + 9, hx + 6, hy + 4);
        ctx.quadraticCurveTo(hx + 6, hy - 2, hx, hy - 8);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Specular shine
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.ellipse(hx - 2, hy + 2, 1.2, 2.5, Math.PI / 4, 0, Math.PI * 2);
        ctx.fill();

        // 2. Draw Damage Text (Dark Crimson)
        let hitText = window.formatNumber(eff.amount);
        ctx.font = "bold 15px monospace";
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 3.5;
        ctx.lineJoin = "round";
        ctx.strokeText(hitText, hx + 14, hy + 4);
        ctx.fillStyle = eff.color || "#960018";
        ctx.fillText(hitText, hx + 14, hy + 4);
      } else if (eff.type === "poison") {
        // 1. Draw 2-Layer Bubbling Toxic Spore / Biohazard Droplet
        ctx.beginPath();
        ctx.arc(hx, hy, 6, 0, Math.PI * 2);
        ctx.fillStyle = "#2ecc71"; // Vibrant toxic green
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 3.5;
        ctx.lineJoin = "round";
        ctx.stroke();
        ctx.fill();

        // Draw tiny inner bubbles / nucleus
        ctx.fillStyle = "#27ae60";
        ctx.beginPath();
        ctx.arc(hx - 2, hy - 2, 1.5, 0, Math.PI * 2);
        ctx.arc(hx + 2, hy + 2, 1.2, 0, Math.PI * 2);
        ctx.fill();

        // White specular shine
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(hx - 2, hy - 2, 0.6, 0, Math.PI * 2);
        ctx.fill();

        // 2. Draw Damage Text (Vibrant Green)
        let hitText = window.formatNumber(eff.amount);
        ctx.font = "bold 15px monospace";
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 3.5;
        ctx.lineJoin = "round";
        ctx.strokeText(hitText, hx + 14, hy + 4);
        ctx.fillStyle = eff.color || "#2ecc71";
        ctx.fillText(hitText, hx + 14, hy + 4);
      } else if (eff.type === "item_drop") {
        ctx.font = "bold 13px sans-serif";
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 3.5;
        ctx.lineJoin = "round";

        let text = eff.text;
        let iconColor = eff.iconColor || "#ffb6c1";
        let itemType = eff.itemType || "soul";

        let textWidth = ctx.measureText(text).width;

        ctx.strokeText(text, hx, hy);
        ctx.fillStyle = eff.color || "#ffffff";
        ctx.fillText(text, hx, hy);

        ctx.save();
        ctx.translate(hx + textWidth + 8, hy - 4);
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 1.5;
        ctx.fillStyle = iconColor;

        if (itemType === "soul") {
          ctx.beginPath();
          ctx.moveTo(0, -6);
          ctx.bezierCurveTo(-4, 0, -4, 5, 0, 5);
          ctx.bezierCurveTo(4, 5, 4, 0, 0, -6);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.arc(-1.2, 1.2, 0.7, 0, Math.PI * 2);
          ctx.fill();
        } else if (itemType === "scrap") {
          ctx.beginPath();
          ctx.moveTo(-3, -3);
          ctx.lineTo(3, -5);
          ctx.lineTo(5, 2);
          ctx.lineTo(-2, 4);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        } else if (itemType === "core") {
          ctx.beginPath();
          ctx.rect(-3.5, -3.5, 7, 7);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(-1, -1, 2, 2);
        } else if (itemType === "key") {
          ctx.beginPath();
          ctx.arc(-1.5, -1.5, 2.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(1, -1.5);
          ctx.lineTo(5, -1.5);
          ctx.lineTo(5, 1);
          ctx.stroke();
        } else if (itemType === "shard") {
          ctx.beginPath();
          ctx.moveTo(0, -5);
          ctx.lineTo(3.5, 0);
          ctx.lineTo(0, 5);
          ctx.lineTo(-3.5, 0);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, 3.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        }
        ctx.restore();
      } else {
        ctx.font = "bold 18px sans-serif";
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 4;
        ctx.lineJoin = "miter";
        ctx.miterLimit = 2;
        ctx.strokeText(eff.text, eff.x, eff.y);
        ctx.fillStyle = eff.color;
        ctx.fillText(eff.text, eff.x, eff.y);
      }
      ctx.restore();
    });

    // Render Crucible Cinematic Wave Transition Splash
    if (
      window.playerStats.isCrucibleMode &&
      window.crucibleTransitionSplash &&
      window.crucibleTransitionSplash.timer > 0
    ) {
      ctx.save();
      let splash = window.crucibleTransitionSplash;
      let progress = (splash.maxTimer - splash.timer) / splash.maxTimer;
      let opacity = 1.0;

      // Smoothly fade in/out
      if (progress < 0.15) opacity = progress / 0.15;
      else if (progress > 0.85) opacity = (1.0 - progress) / 0.15;

      ctx.globalAlpha = opacity;
      let cy = canvas.height / 2;

      // Draw translucent dark background banner
      ctx.fillStyle = "rgba(10, 8, 16, 0.88)";
      ctx.strokeStyle = splash.color;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.rect(0, cy - 35, canvas.width, 65);
      ctx.fill();
      ctx.stroke();

      // Draw Title Text
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = "900 13px 'Arial Black', Impact, sans-serif";
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 4;
      ctx.strokeText(splash.title, canvas.width / 2, cy - 12);
      ctx.fillStyle = splash.color;
      ctx.fillText(splash.title, canvas.width / 2, cy - 12);

      // Draw Subtitle Description
      ctx.font = "bold 9.5px monospace";
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 3;
      ctx.strokeText(splash.sub, canvas.width / 2, cy + 12);
      ctx.fillStyle = "#ffffff";
      ctx.fillText(splash.sub, canvas.width / 2, cy + 12);

      ctx.restore();
      splash.timer--;
    }

    // Render Void Suppression Orbs on canvas
    if (window.activeRiftOrbs && window.activeRiftOrbs.length > 0) {
      window.activeRiftOrbs.forEach((orb) => {
        if (orb.type === "glimmering_pixie") {
          ctx.save();

          let flap = Math.abs(Math.sin(Date.now() / 80 + orb.id)) * 6 + 2;
          let hover = orb.pauseTimer > 0 ? Math.sin(Date.now() / 100) * 1.5 : 0;
          let ox = orb.x;
          let oy = orb.y + hover;

          // 1. Draw glowing outer radial backdrop
          let glowGrad = ctx.createRadialGradient(
            ox,
            oy,
            1,
            ox,
            oy,
            orb.radius * 2,
          );
          glowGrad.addColorStop(0, "rgba(46, 204, 113, 0.45)");
          glowGrad.addColorStop(0.6, "rgba(85, 239, 196, 0.15)");
          glowGrad.addColorStop(1, "rgba(0,0,0,0)");
          ctx.fillStyle = glowGrad;
          ctx.beginPath();
          ctx.arc(ox, oy, orb.radius * 2, 0, Math.PI * 2);
          ctx.fill();

          // 2. Draw flapping wings
          ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
          ctx.strokeStyle = "#000000";
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.ellipse(ox - 4, oy - 2, 5, flap, Math.PI / 6, 0, Math.PI * 2);
          ctx.ellipse(ox + 4, oy - 2, 5, flap, -Math.PI / 6, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // 3. Draw central sprite core ball
          let coreGrad = ctx.createRadialGradient(
            ox - 2,
            oy - 2,
            1,
            ox,
            oy,
            orb.radius,
          );
          if (window.isGamePaused) {
            coreGrad.addColorStop(0, "#cbd5e1");
            coreGrad.addColorStop(1, "#475569");
          } else {
            coreGrad.addColorStop(0, "#ffffff"); // White-hot center
            coreGrad.addColorStop(0.3, "#2ecc71"); // Emerald
            coreGrad.addColorStop(1, "#145a32"); // Deep forest green
          }
          ctx.fillStyle = coreGrad;
          ctx.beginPath();
          ctx.arc(ox, oy, orb.radius, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = "#000000";
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // 4. Draw outer shrinking timer ring
          let progress = orb.timer / orb.maxTimer;
          ctx.strokeStyle = "rgba(255, 255, 255, 0.6)";
          ctx.lineWidth = 1.0;
          ctx.beginPath();
          ctx.arc(ox, oy, orb.radius * 1.5 * progress, 0, Math.PI * 2);
          ctx.stroke();

          ctx.restore();
          return;
        }

        if (orb.type === "aetheric_spark") {
          ctx.save();

          // 1. Draw glowing outer radial backdrop
          let glowGrad = ctx.createRadialGradient(
            orb.x,
            orb.y,
            2,
            orb.x,
            orb.y,
            orb.radius * 2,
          );
          glowGrad.addColorStop(0, "rgba(255, 215, 0, 0.4)");
          glowGrad.addColorStop(0.6, "rgba(241, 196, 15, 0.15)");
          glowGrad.addColorStop(1, "rgba(0,0,0,0)");
          ctx.fillStyle = glowGrad;
          ctx.beginPath();
          ctx.arc(orb.x, orb.y, orb.radius * 2, 0, Math.PI * 2);
          ctx.fill();

          // 2. Draw central core with bright yellow radial gradient
          let coreGrad = ctx.createRadialGradient(
            orb.x - 2,
            orb.y - 2,
            1,
            orb.x,
            orb.y,
            orb.radius,
          );
          if (window.isGamePaused) {
            coreGrad.addColorStop(0, "#cbd5e1");
            coreGrad.addColorStop(1, "#64748b");
          } else {
            coreGrad.addColorStop(0, "#ffffff"); // White-hot center
            coreGrad.addColorStop(0.5, "#ffd700"); // Rich gold
            coreGrad.addColorStop(1, "#b58700"); // Dark bronze/gold
          }
          ctx.fillStyle = coreGrad;
          ctx.beginPath();
          ctx.arc(orb.x, orb.y, orb.radius, 0, Math.PI * 2);
          ctx.fill();

          // Cel-shaded outline
          ctx.strokeStyle = "#000000";
          ctx.lineWidth = 1.8;
          ctx.stroke();

          // 3. Draw Orbiting Star Rays
          if (!window.isGamePaused) {
            ctx.strokeStyle = "#ffd700";
            ctx.lineWidth = 1.5;
            let rot = Date.now() / 100 + orb.id;
            ctx.save();
            ctx.translate(orb.x, orb.y);
            ctx.rotate(rot);
            for (let j = 0; j < 4; j++) {
              ctx.rotate(Math.PI / 2);
              ctx.beginPath();
              ctx.moveTo(0, -orb.radius * 1.1);
              ctx.lineTo(0, -orb.radius * 1.5);
              ctx.stroke();
            }
            ctx.restore();
          }

          // 4. Draw shrinking outer countdown ring
          let progress = orb.timer / orb.maxTimer;
          ctx.strokeStyle = "#ffffff";
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.arc(orb.x, orb.y, orb.radius * 1.5 * progress, 0, Math.PI * 2);
          ctx.stroke();

          ctx.restore();
          return;
        }

        if (orb.type === "aetheric_conduit") {
          ctx.save();

          // 1. Draw Dotted Connecting Path
          ctx.strokeStyle = "rgba(0, 210, 255, 0.22)";
          ctx.lineWidth = 1.8;
          ctx.setLineDash([4, 6]);
          ctx.beginPath();
          ctx.moveTo(orb.x, orb.y);
          ctx.lineTo(orb.endX, orb.endY);
          ctx.stroke();
          ctx.setLineDash([]); // Reset

          // 2. Draw Solid Glowing Active Traced Path
          if (orb.progress > 0) {
            let px = orb.x + orb.progress * (orb.endX - orb.x);
            let py = orb.y + orb.progress * (orb.endY - orb.y);

            ctx.strokeStyle = "#00d2ff"; // Neon Cyan
            ctx.lineWidth = 3.0;
            ctx.beginPath();
            ctx.moveTo(orb.x, orb.y);
            ctx.lineTo(px, py);
            ctx.stroke();

            // Draw spark following their finger
            let pulse = 2.5 + Math.sin(Date.now() / 80) * 1.5;
            ctx.fillStyle = "#ffffff";
            ctx.beginPath();
            ctx.arc(px, py, pulse, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = "#00ffff";
            ctx.lineWidth = 1;
            ctx.stroke();
          }

          // 3. Draw Start Crystal (A)
          let startGrad = ctx.createRadialGradient(
            orb.x - 2,
            orb.y - 2,
            1,
            orb.x,
            orb.y,
            orb.radius,
          );
          startGrad.addColorStop(0, "#ffffff");
          startGrad.addColorStop(0.4, "#00d2ff");
          startGrad.addColorStop(1, "#031d0d");
          ctx.fillStyle = startGrad;

          ctx.beginPath();
          ctx.arc(orb.x, orb.y, orb.radius, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = "#000000";
          ctx.lineWidth = 1.8;
          ctx.stroke();

          // 4. Draw End Crystal (B)
          let endGrad = ctx.createRadialGradient(
            orb.endX - 2,
            orb.endY - 2,
            1,
            orb.endX,
            orb.endY,
            orb.radius,
          );
          endGrad.addColorStop(0, "#ffffff");
          endGrad.addColorStop(0.4, "#ff007f"); // Contrasting hot pink target
          endGrad.addColorStop(1, "#110521");
          ctx.fillStyle = endGrad;

          ctx.beginPath();
          ctx.arc(orb.endX, orb.endY, orb.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // Glowing receiver ring if fully charged
          if (orb.connected) {
            ctx.strokeStyle = "#2ecc71"; // Flashes green
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.arc(orb.endX, orb.endY, orb.radius * 1.5, 0, Math.PI * 2);
            ctx.stroke();
          }

          ctx.restore();
          return;
        }

        if (orb.type === "perfect_strike") {
          ctx.save();

          // 1. Draw central core bullseye
          ctx.fillStyle = "rgba(231, 76, 60, 0.25)"; // Soft red center glow
          ctx.beginPath();
          ctx.arc(orb.x, orb.y, orb.radius, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = "#e74c3c"; // Crimson core
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(orb.x, orb.y, orb.radius * 0.4, 0, Math.PI * 2);
          ctx.stroke();

          // Crosshairs
          ctx.beginPath();
          ctx.moveTo(orb.x - orb.radius * 1.5, orb.y);
          ctx.lineTo(orb.x + orb.radius * 1.5, orb.y);
          ctx.moveTo(orb.x, orb.y - orb.radius * 1.5);
          ctx.lineTo(orb.x, orb.y + orb.radius * 1.5);
          ctx.stroke();

          // 2. Draw outer shrinking alignment ring
          let progress = orb.timer / orb.maxTimer;
          let outerR = orb.radius + orb.radius * 2.5 * progress;

          // Check sweet spot window (10-25 frames) to dynamically shift ring color to neon green
          let isPerfect = orb.timer >= 10 && orb.timer <= 25;
          ctx.strokeStyle = isPerfect ? "#2ecc71" : "#f1c40f"; // Green for perfect alignment, yellow-orange otherwise
          ctx.lineWidth = isPerfect ? 2.5 : 1.5;

          ctx.beginPath();
          ctx.arc(orb.x, orb.y, outerR, 0, Math.PI * 2);
          ctx.stroke();

          // Center micro dot
          ctx.strokeStyle = "#000000";
          ctx.lineWidth = 1.0;
          ctx.strokeRect(orb.x - 1, orb.y - 1, 2, 2);

          ctx.restore();
          return;
        }

        if (orb.type === "anomalous_shard") {
          // 1. Draw glowing outer warning base
          let warningGrad = ctx.createLinearGradient(
            orb.x - 12,
            orb.y,
            orb.x + 12,
            orb.y,
          );
          warningGrad.addColorStop(0, "rgba(255, 34, 0, 0)");
          warningGrad.addColorStop(0.5, "rgba(255, 34, 0, 0.35)");
          warningGrad.addColorStop(1, "rgba(255, 34, 0, 0)");
          ctx.fillStyle = warningGrad;
          ctx.fillRect(orb.x - 22, orb.y - 4, 44, 6);

          // 2. Draw the Basalt Crystal Cluster
          ctx.strokeStyle = "#000000";
          ctx.lineWidth = 1.8;
          ctx.lineJoin = "round";

          // Left Shard (Smaller)
          ctx.fillStyle = "#1e272e"; // Dark slate
          ctx.beginPath();
          ctx.moveTo(orb.x - 12, orb.y);
          ctx.lineTo(orb.x - 14, orb.y - 14);
          ctx.lineTo(orb.x - 8, orb.y - 18);
          ctx.lineTo(orb.x - 4, orb.y);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Right Shard (Medium)
          ctx.fillStyle = "#2c3e50"; // Steel stone
          ctx.beginPath();
          ctx.moveTo(orb.x + 4, orb.y);
          ctx.lineTo(orb.x + 8, orb.y - 18);
          ctx.lineTo(orb.x + 14, orb.y - 14);
          ctx.lineTo(orb.x + 12, orb.y);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Center Main Shard (Tallest, glowing crimson core)
          let stoneGrad = ctx.createLinearGradient(
            orb.x - 8,
            orb.y,
            orb.x + 8,
            orb.y - 28,
          );
          stoneGrad.addColorStop(0, "#1c1c1f");
          stoneGrad.addColorStop(0.5, "#ff3300"); // Core glow
          stoneGrad.addColorStop(1, "#111116");
          ctx.fillStyle = stoneGrad;

          ctx.beginPath();
          ctx.moveTo(orb.x - 8, orb.y);
          ctx.lineTo(orb.x - 10, orb.y - 24);
          ctx.lineTo(orb.x, orb.y - 32); // Tall central point
          ctx.lineTo(orb.x + 10, orb.y - 24);
          ctx.lineTo(orb.x + 8, orb.y);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Draw micro light highlights on crystal edges
          ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
          ctx.lineWidth = 1.0;
          ctx.beginPath();
          ctx.moveTo(orb.x - 10, orb.y - 24);
          ctx.lineTo(orb.x, orb.y - 32);
          ctx.lineTo(orb.x + 10, orb.y - 24);
          ctx.stroke();

          // 3. Draw mini health bar below the shard (Y-offset 234)
          let barW = 24;
          let barH = 3;
          let barX = orb.x - barW / 2;
          let barY = orb.y + 4;

          ctx.fillStyle = "#111111";
          ctx.fillRect(barX, barY, barW, barH);

          let hpPct = orb.hp / orb.maxHp;
          ctx.fillStyle = "#ff2200"; // Red HP fill
          ctx.fillRect(barX, barY, barW * hpPct, barH);

          ctx.strokeStyle = "#000000";
          ctx.lineWidth = 0.8;
          ctx.strokeRect(barX, barY, barW, barH);

          ctx.restore();
          return;
        }

        ctx.save();

        // 1. Draw glowing outer radial backdrop
        let glowGrad = ctx.createRadialGradient(
          orb.x,
          orb.y,
          2,
          orb.x,
          orb.y,
          orb.radius * 1.5,
        );
        glowGrad.addColorStop(0, "rgba(255, 0, 127, 0.45)");
        glowGrad.addColorStop(0.6, "rgba(142, 68, 173, 0.15)");
        glowGrad.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.arc(orb.x, orb.y, orb.radius * 1.5, 0, Math.PI * 2);
        ctx.fill();

        // 2. Draw core ball with radial gradient
        let coreGrad = ctx.createRadialGradient(
          orb.x - 3,
          orb.y - 3,
          1,
          orb.x,
          orb.y,
          orb.radius,
        );
        if (window.isGamePaused) {
          coreGrad.addColorStop(0, "#7f8c8d");
          coreGrad.addColorStop(1, "#2c3e50");
        } else {
          coreGrad.addColorStop(0, "#ffffff"); // White-hot core
          coreGrad.addColorStop(0.3, "#ff007f"); // Neon magenta
          coreGrad.addColorStop(1, "#110521"); // Dark void purple
        }
        ctx.fillStyle = coreGrad;
        ctx.beginPath();
        ctx.arc(orb.x, orb.y, orb.radius, 0, Math.PI * 2);
        ctx.fill();

        // Cel-shaded black outline
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 1.8;
        ctx.stroke();

        // 3. Draw shrinking outer countdown boundary
        let progress = orb.timer / orb.maxTimer;
        ctx.strokeStyle = "#00ffff"; // Glowing neon cyan
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(orb.x, orb.y, orb.radius * 1.6 * progress, 0, Math.PI * 2);
        ctx.stroke();

        // 4. Draw Orbiting Spark Satellites
        let rot = Date.now() / 150 + orb.id; // Offset rotation by ID
        ctx.fillStyle = "#ff007f";
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 1.0;
        for (let i = 0; i < 2; i++) {
          let angle = rot + i * Math.PI;
          let sx = orb.x + Math.cos(angle) * (orb.radius * 1.3);
          let sy = orb.y + Math.sin(angle) * (orb.radius * 1.3);
          ctx.beginPath();
          ctx.arc(sx, sy, 2.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        }

        ctx.restore();
      });
    }

    if (
      window.isGamePaused &&
      document.getElementById("death-overlay") &&
      document.getElementById("death-overlay").style.display === "flex"
    ) {
      window.renderNemesisPreview(window.playerStats.killedByMob);
    }
  };

  window.toggleMenuHub = function () {
    let overlay = document.getElementById("menu-hub-overlay");
    let card = document.getElementById("menu-hub-card");
    if (!overlay || !card) return;

    if (overlay.style.display === "none" || overlay.style.display === "") {
      window.hideTooltip();
      overlay.style.display = "flex";
      window.updateHubAlerts();

      // Clear dynamic positioning on first load so it defaults to centered Flexbox
      card.style.top = "";
      card.style.left = "";

      // Wire up dragging handlers
      window.makeWindowDraggable(
        card,
        document.getElementById("menu-hub-handle"),
      );
    } else {
      overlay.style.display = "none";
      window.hideTooltip();
    }
  };

  window.toggleDungeonMenu = function (event) {
    // Bypassed standalone absolute menu wrapper - simply redirect directly to native tab
    if (event) event.stopPropagation();
    window.switchTab("activities");
  };

  window.showGuidebook = function () {
    window.toggleMenuHub(); // Dismiss the hub panel first

    if (typeof window.showCustomConfirm === "function") {
      window.showCustomConfirm(
        "📖 Hoor\\'s Tactical Guidebook",
        `Welcome, Hero! Optimize your build with these tactical tips:<br><br>
         • <strong style="color:var(--accent-blue);">Deflection Mastery:</strong> Equip a Shield to enable Block Rate (capped at 20% / 30% / 40%), or a Dagger to enable Parry (capped at 15% / 25% / 35%).<br>
         • <strong style="color:var(--accent-purple);">Arcane Barrier:</strong> Holding a Tome absorbs a base 20% of incoming damage before Defense checks. INT scales this up to a 35% cap.<br>
         • <strong style="color:var(--accent-green);">Alchemical Synergy:</strong> High INT increases potion durations and unlocks potion sparring chances with select Relics.<br>
         • <strong style="color:var(--text-gold);">Ascension PP:</strong> Slaying Hooktail on higher Stage challenges grants a massive amount of extra Prestige Points! Scale the slider on the Altar before initiating fights.`,
        "Got it!",
        "Exit",
        "var(--accent-purple)",
        function () {},
      );
    }
  };

  window.updateSyncStatus = function (status) {
    let dot = document.getElementById("sync-dot");
    let text = document.getElementById("sync-status-text");
    if (!dot || !text) return;

    if (status === "syncing") {
      dot.style.background = "#f1c40f";
      text.innerText = "SYNCING";
      text.style.color = "#f1c40f";
    } else if (status === "connected") {
      dot.style.background = "#2ecc71";
      text.innerText = "CONNECTED";
      text.style.color = "#2ecc71";
      window.isCloudSynced = true;
    } else {
      dot.style.background = "#7f8c8d";
      text.innerText = "OFFLINE";
      text.style.color = "#7f8c8d";
      window.isCloudSynced = false;
    }
  };

  window.toggleEcoMode = function () {
    window.playerStats.ecoMode = !window.playerStats.ecoMode;
    window.updateEcoModeStyle();
    window.invalidatePlayerStats();
    if (typeof window.updateUI === "function") window.updateUI();
    if (typeof window.saveGame === "function") window.saveGame();
  };

  window.updateEcoModeStyle = function () {
    let active = window.playerStats.ecoMode === true;
    let btn = document.getElementById("settings-toggle-eco");
    if (btn) {
      btn.innerText = active ? "Saver: ON" : "Saver: OFF";
      btn.className = active ? "btn-action" : "btn-action un";
    }
  };

  window.toggleDpsOverlay = function () {
    window.playerStats.showDpsOverlay = !window.playerStats.showDpsOverlay;
    window.updateDpsOverlayStyle();
    window.invalidatePlayerStats();
    if (typeof window.updateUI === "function") window.updateUI();
    if (typeof window.saveGame === "function") window.saveGame();
  };

  window.updateDpsOverlayStyle = function () {
    let showOverlay = window.playerStats.showDpsOverlay === true;
    let toggleBtn = document.getElementById("settings-toggle-dps-overlay");

    if (toggleBtn) {
      toggleBtn.innerText = showOverlay ? "Overlay: ON" : "Overlay: OFF";
      toggleBtn.className = showOverlay ? "btn-action" : "btn-action un";
    }

    window.updateDpsOverlayPosition();
  };

  window.updateDpsOverlayPosition = function () {
    let badge = document.getElementById("dps-overlay-badge");
    let canvasContainer = document.getElementById("canvas-container");
    if (!badge || !canvasContainer) return;

    if (!window.playerStats.showDpsOverlay) {
      badge.style.display = "none";
      return;
    }

    badge.style.display = "flex";

    let containerWidth = canvasContainer.clientWidth;
    let containerHeight = canvasContainer.clientHeight;
    let badgeWidth = badge.offsetWidth || 100;
    let badgeHeight = badge.offsetHeight || 32;

    let x = window.playerStats.dpsOverlayX;
    let y = window.playerStats.dpsOverlayY;

    if (x === null || y === null) {
      x = containerWidth - badgeWidth - 10;
      y = containerHeight - badgeHeight - 10;
      window.playerStats.dpsOverlayX = x;
      window.playerStats.dpsOverlayY = y;
    }

    x = Math.max(0, Math.min(containerWidth - badgeWidth, x));
    y = Math.max(0, Math.min(containerHeight - badgeHeight, y));

    badge.style.left = x + "px";
    badge.style.top = y + "px";
  };

  window.initDpsOverlayDrag = function () {
    let badge = document.getElementById("dps-overlay-badge");
    let canvasContainer = document.getElementById("canvas-container");
    if (!badge || !canvasContainer) return;

    let isDragging = false;
    let startX = 0,
      startY = 0;
    let initialLeft = 0,
      initialTop = 0;

    badge.addEventListener("pointerdown", function (e) {
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      initialLeft = window.playerStats.dpsOverlayX || 0;
      initialTop = window.playerStats.dpsOverlayY || 0;
      badge.setPointerCapture(e.pointerId);
      e.stopPropagation();
    });

    badge.addEventListener("pointermove", function (e) {
      if (!isDragging) return;
      let dx = e.clientX - startX;
      let dy = e.clientY - startY;

      let x = initialLeft + dx;
      let y = initialTop + dy;

      let containerWidth = canvasContainer.clientWidth;
      let containerHeight = canvasContainer.clientHeight;
      let badgeWidth = badge.offsetWidth;
      let badgeHeight = badge.offsetHeight;

      x = Math.max(0, Math.min(containerWidth - badgeWidth, x));
      y = Math.max(0, Math.min(containerHeight - badgeHeight, y));

      window.playerStats.dpsOverlayX = x;
      window.playerStats.dpsOverlayY = y;

      badge.style.left = x + "px";
      badge.style.top = y + "px";
      e.stopPropagation();
    });

    const stopDrag = function (e) {
      if (isDragging) {
        isDragging = false;
        badge.releasePointerCapture(e.pointerId);
        if (typeof window.saveGame === "function") window.saveGame();
        e.stopPropagation();
      }
    };

    badge.addEventListener("pointerup", stopDrag);
    badge.addEventListener("pointercancel", stopDrag);
  };

  window.updateTitleSelector = function () {
    let selector = document.getElementById("title-selector");
    if (!selector) return;

    let currentlySelected = window.playerStats.equippedTitle || "";
    let unlocked = window.playerStats.unlockedTitles || [];

    // Clear and rebuild
    selector.innerHTML = '<option value="">[No Title Equipped]</option>';
    unlocked.forEach((tKey) => {
      let tData = window.TITLES_DATA[tKey];
      if (tData) {
        let opt = document.createElement("option");
        opt.value = tKey;
        opt.innerText = tData.name;
        if (currentlySelected === tKey) {
          opt.selected = true;
        }
        selector.appendChild(opt);
      }
    });

    let descEl = document.getElementById("selected-title-desc");
    if (descEl) {
      let activeTitle = window.playerStats.equippedTitle;
      if (activeTitle && window.TITLES_DATA[activeTitle]) {
        let tData = window.TITLES_DATA[activeTitle];
        let statBonusText = [];
        if (tData.stats) {
          for (let sKey in tData.stats) {
            let label = window.getStatLabel(sKey);
            let val = tData.stats[sKey];
            let isPct = [
              "drop",
              "qly",
              "critChance",
              "critDamage",
              "block",
              "parry",
              "gold",
              "fairySpawn",
              "rareSpawn",
            ].includes(sKey);
            let valStr = isPct ? `+${(val * 100).toFixed(0)}%` : `+${val}`;
            statBonusText.push(`${label} ${valStr}`);
          }
        }
        let bonusStr =
          statBonusText.length > 0 ? ` (${statBonusText.join(", ")})` : "";
        descEl.innerHTML = `${tData.desc}<br><span style="color:${tData.color || "#ff007f"}; font-weight:bold;">Active Bonus: ${bonusStr || "Cosmetic Only"}</span>`;
      } else {
        descEl.innerText =
          "Select an unlocked title from the drop-down to equip it.";
      }
    }
  };

  window.openCavernSigilSackAnimation = function (newItem) {
    let overlay = document.createElement("div");
    overlay.id = "sack-opening-overlay";
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

    let color = window.getTierColor(newItem.statsRolled);
    let stars = newItem.statsRolled;

    overlay.innerHTML = `
        <style>
          .cavern-anim-wrapper {
            position: relative;
            width: 300px;
            height: 300px;
            display: flex;
            justify-content: center;
            align-items: center;
          }
          .cavern-runic-circle {
            position: absolute;
            width: 260px;
            height: 260px;
            border: 2px dashed rgba(168, 85, 247, 0.4);
            border-radius: 50%;
            animation: runicSpin 15s linear infinite;
          }
          .cavern-runic-circle::before {
            content: "";
            position: absolute;
            top: 10px; left: 10px; right: 10px; bottom: 10px;
            border: 1px dashed rgba(0, 210, 255, 0.25);
            border-radius: 50%;
            animation: runicSpinReverse 8s linear infinite;
          }
          .sack-anim-container {
            position: relative;
            z-index: 2;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 180px;
          }
          .sack-svg {
            animation: sackViolentShake 0.6s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
            overflow: visible !important;
          }
          .sack-string {
            animation: stringUntie 0.4s cubic-bezier(0.25, 0.8, 0.25, 1) forwards;
            animation-delay: 0.5s;
          }
          .sack-neck {
            animation: neckOpen 0.5s cubic-bezier(0.25, 0.8, 0.25, 1.25) forwards;
            animation-delay: 0.52s;
          }
          .portal-blast {
            position: absolute;
            width: 10px;
            height: 10px;
            background: radial-gradient(circle, #fff 0%, ${color} 60%, transparent 100%);
            border-radius: 50%;
            opacity: 0;
            transform: scale(0);
            animation: portalErupt 0.6s cubic-bezier(0.1, 0.8, 0.25, 1) forwards;
            animation-delay: 0.55s;
            pointer-events: none;
          }

          @keyframes runicSpin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          @keyframes runicSpinReverse {
            0% { transform: rotate(360deg); }
            100% { transform: rotate(0deg); }
          }
          @keyframes sackViolentShake {
            0% { transform: scale(1) rotate(0deg); }
            10% { transform: scale(1.1) rotate(-12deg); }
            20% { transform: scale(1.1) rotate(14deg); }
            30% { transform: scale(1.1) rotate(-14deg); }
            40% { transform: scale(1.1) rotate(12deg); }
            50% { transform: scale(1.1) rotate(-8deg); }
            60% { transform: scale(1.05) rotate(6deg); }
            70% { transform: scale(1.02) rotate(-3deg); }
            80% { transform: scale(1.01) rotate(1deg); }
            100% { transform: scale(1) rotate(0deg); }
          }
          @keyframes stringUntie {
            0% { transform: translateY(0) scale(1); opacity: 1; }
            100% { transform: translateY(18px) scale(0.3); opacity: 0; }
          }
          @keyframes neckOpen {
            0% { transform: scaleX(1) scaleY(1); }
            100% { transform: scaleX(1.4) scaleY(0.6) translateY(3px); }
          }
          @keyframes portalErupt {
            0% { opacity: 0; transform: scale(0); }
            50% { opacity: 1; }
            100% { opacity: 0; transform: scale(25); }
          }
        </style>
        <div style="text-align:center; color:white; animation: toastFadeIn 0.3s ease-out;">
          <div class="cavern-anim-wrapper">
            <div class="cavern-runic-circle"></div>
            <div class="portal-blast"></div>
            <div class="sack-anim-container">
                        <svg class="sack-svg" width="130" height="130" viewBox="0 0 64 64">
                          <defs>
                            <!-- Luxurious Void Velvet Body Gradient -->
                            <linearGradient id="g_premium_velvet" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stop-color="#7d3c98" />
                              <stop offset="60%" stop-color="#4a154b" />
                              <stop offset="100%" stop-color="#110521" />
                            </linearGradient>
                            <!-- Glowing Magic Celestial Teal Lining -->
                            <linearGradient id="g_magic_celestial" x1="0" y1="0" x2="1" y2="1">
                              <stop offset="0%" stop-color="#00ffff" />
                              <stop offset="100%" stop-color="#008b8b" />
                            </linearGradient>
                            <!-- Polished Gold Metallic Gradient -->
                            <linearGradient id="g_polished_gold" x1="0" y1="0" x2="1" y2="1">
                              <stop offset="0%" stop-color="#ffeaa7" />
                              <stop offset="50%" stop-color="#f1c40f" />
                              <stop offset="100%" stop-color="#9a7d0a" />
                            </linearGradient>
                            <!-- Dark shadow mask for folds -->
                            <linearGradient id="g_fold_shadow" x1="0" y1="0" x2="1" y2="0">
                              <stop offset="0%" stop-color="rgba(0,0,0,0.4)" />
                              <stop offset="100%" stop-color="rgba(0,0,0,0)" />
                            </linearGradient>
                          </defs>

                          <!-- Soft Blurred Base Drop-Shadow -->
                          <ellipse cx="32" cy="58" rx="20" ry="3.5" fill="rgba(0,0,0,0.55)" />

                          <!-- Flared Open Neck Sleeve with Glow -->
                          <g class="sack-neck" style="transform-origin: 32px 28px;">
                            <!-- Glowing Teal Lining Inside -->
                            <path d="M20 16 C25 9, 39 9, 44 16 C39 12, 25 12, 20 16 Z" fill="url(#g_magic_celestial)" opacity="0.8" style="filter: drop-shadow(0 0 3px #00ffff);" />
                            <!-- Left Flared Neck Sleeve -->
                            <path d="M24 28 L18 14 C22 10, 32 10, 32 16 L32 28 Z" fill="url(#g_premium_velvet)" stroke="#000" stroke-width="1.8" />
                            <!-- Right Flared Neck Sleeve -->
                            <path d="M40 28 L46 14 C42 10, 32 10, 32 16 L32 28 Z" fill="url(#g_premium_velvet)" stroke="#000" stroke-width="1.8" />
                            <!-- Fold lines on the collar -->
                            <path d="M24 28 Q32 22, 32 16" fill="none" stroke="rgba(0,0,0,0.3)" stroke-width="1.5" />
                            <path d="M40 28 Q32 22, 32 16" fill="none" stroke="rgba(0,0,0,0.3)" stroke-width="1.5" />
                          </g>

                          <!-- Main Velvet Pouch Body -->
                          <path d="M32 18 C20 18, 11 21, 11 38 C11 51, 18 58, 32 58 C46 58, 53 51, 53 38 C53 21, 44 18, 32 18 Z" fill="url(#g_premium_velvet)" stroke="#000" stroke-width="2.2" stroke-linejoin="round" />

                          <!-- Organic Fabric Creases & Depth Shadows -->
                          <path d="M11 38 Q18 42, 32 38" fill="none" stroke="rgba(0,0,0,0.25)" stroke-width="2" />
                          <path d="M32 18 Q23 35, 18 51" fill="none" stroke="url(#g_fold_shadow)" stroke-width="3" />
                          <path d="M32 18 Q41 35, 46 51" fill="none" stroke="url(#g_fold_shadow)" stroke-width="3" transform="scale(-1, 1) translate(-64, 0)" />

                          <!-- Glowing Cyber-Teal Runic Medallion (Sigil) on Front -->
                          <!-- Outer magic orbit ring -->
                          <circle cx="32" cy="40" r="10" fill="none" stroke="#00ffff" stroke-dasharray="2.5 3" stroke-width="1.2" opacity="0.8" style="filter: drop-shadow(0 0 4px #00ffff);" />
                          <!-- Metallic gold backing plate -->
                          <circle cx="32" cy="40" r="7.5" fill="url(#g_polished_gold)" stroke="#000" stroke-width="1.5" />
                          <!-- White-hot glowing core glyph -->
                          <polygon points="32,35.5 35.5,40 32,44.5 28.5,40" fill="#ffffff" stroke="#00ffff" stroke-width="1.2" style="filter: drop-shadow(0 0 3px #00ffff);" />

                          <!-- Cinched Braided Gold String & Loops -->
                          <g class="sack-string" style="transform-origin: 32px 28px;">
                            <!-- Main Cinch Band -->
                            <path d="M22 28 Q32 31.5, 42 28" fill="none" stroke="url(#g_polished_gold)" stroke-width="3.5" stroke-linecap="round" />
                            <path d="M24 29 Q32 32, 40 29" fill="none" stroke="#000" stroke-width="1.2" stroke-linecap="round" />

                            <!-- Left Ribbon Loop -->
                            <path d="M28 29 Q21 26, 25 33 Z" fill="url(#g_polished_gold)" stroke="#000" stroke-width="1.2" />
                            <!-- Right Ribbon Loop -->
                            <path d="M36 29 Q43 26, 39 33 Z" fill="url(#g_polished_gold)" stroke="#000" stroke-width="1.2" />

                            <!-- Central Tie Knot Node -->
                            <circle cx="32" cy="29.2" r="3.2" fill="#ffd700" stroke="#000" stroke-width="1.5" />
                            <circle cx="32" cy="29.2" r="1" fill="#fff" opacity="0.6" />

                            <!-- Left Hanging String Strand -->
                            <path d="M30 30 Q24 40, 18 43" fill="none" stroke="url(#g_polished_gold)" stroke-width="2.2" stroke-linecap="round" />
                            <circle cx="18" cy="43" r="1.5" fill="url(#g_polished_gold)" stroke="#000" stroke-width="0.8" />

                            <!-- Right Hanging String Strand -->
                            <path d="M34 30 Q40 40, 46 43" fill="none" stroke="url(#g_polished_gold)" stroke-width="2.2" stroke-linecap="round" />
                            <circle cx="46" cy="43" r="1.5" fill="url(#g_polished_gold)" stroke="#000" stroke-width="0.8" />
                          </g>
                        </svg>
                      </div>
          </div>
          <div style="font-size: 14px; font-weight: 900; color:#9b59b6; letter-spacing: 3px; text-shadow: 0 0 8px rgba(155,89,182,0.5); text-transform: uppercase;">TRANSMUTING CAVERN SIGIL...</div>
        </div>
      `;

    setTimeout(() => {
      let buffDescs = newItem.buffs
        .map(
          (b) =>
            `<span style="color:#2ecc71; display:block; font-size:10px; margin-bottom:2px;">• ☀️ ${b.name}: ${b.desc}</span>`,
        )
        .join("");
      let debuffDescs = newItem.debuffs
        .map(
          (d) =>
            `<span style="color:#e74c3c; display:block; font-size:10px; margin-bottom:2px;">• 🌑 ${d.name}: ${d.desc}</span>`,
        )
        .join("");

      overlay.innerHTML = `
          <div style="background:#15121b; border:3px solid ${color}; border-radius:12px; width:95%; max-width:400px; box-shadow:0 15px 45px rgba(0,0,0,0.95); text-align:center; padding:20px; animation: toastFadeIn 0.3s;">
            <h2 style="margin:0 0 10px 0; color:${color}; letter-spacing:2px; text-transform:uppercase; font-size:18px;">🔮 SIGIL UNBOXED!</h2>
            <div style="height:2px; background:linear-gradient(90deg, transparent, ${color}, transparent); margin-bottom:15px;"></div>
            <div style="text-align:center; margin-bottom:12px;">${window.getEquipIconHtml(newItem, 48)}</div>
            <h3 style="color:${color}; font-size:14px; margin:0 0 4px 0;">${newItem.name}</h3>
            <span style="font-size:10px; color:#aaa; font-family:monospace; display:block; margin-bottom:12px;">Quality: ${stars}★ ${window.getTierName(stars)}</span>

            <div style="background:#090610; border:1px solid #333; border-radius:6px; padding:12px; text-align:left; margin-bottom:15px; line-height:1.45;">
                          <strong style="color:#f1c40f; font-family:monospace; display:block; margin-bottom:6px; text-transform:uppercase; font-size:10px; letter-spacing:0.5px;">⚡ SIGIL MODIFIERS:</strong>
                          ${buffDescs}
                          ${debuffDescs}
                          <div style="border-top:1px dashed #333; margin-top:8px; padding-top:6px; display:flex; flex-direction:column; gap:2px; font-family:monospace; font-size:9.5px;">
                            <span style="color:#3498db; font-weight:bold;">💎 Focus Rewards: +${(newItem.rewardMultiplier * 100).toFixed(0)}% Gold/Loot Multiplier</span>
                            ${newItem.qualityBoost > 0 ? `<span style="color:#ff007f; font-weight:bold;">✨ Quality Boost: +${(newItem.qualityBoost * 100).toFixed(0)}% Drop Quality</span>` : ""}
                          </div>
                        </div>

            <button onclick="document.getElementById('sack-opening-overlay').remove(); window.setPauseState(false); window.updateUI(); window.renderInventory();" style="background:${color}; color:${stars === 4 || stars === 1 ? "#fff" : "#111"}; border:none; padding:10px; font-weight:bold; font-size:12px; border-radius:4px; cursor:pointer; width:100%; box-shadow:0 0 10px ${color}55;">Store in Sigil Sack</button>
          </div>
        `;
    }, 1100);
  };
})();
