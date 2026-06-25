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

window.getStageTier = function() {
    let st = window.playerStats.stage;
    if (st <= 100) return 0; // Forest (Stages 1-100)
    if (st <= 200) return 1; // Peaks/Ruins (Stages 101-200)
    if (st <= 300) return 2; // Inferno (Stages 201-300)
    if (st <= 400) return 3; // Swamp (Stages 301-400)
    if (st <= 500) return 4; // Void (Stages 401-500)
    if (st <= 600) return 5; // Temporal Sanctorum (Stages 501-600)
    return 6;                // Cyberspace Nexus (Stages 601+)
};

// --- VISUAL EFFECT & PARTICLE SPAWNERS ---

window.spawnDeathParticles = function(x, y, mobType) {
    if (window.particles.length > 250) return;
    let count = 15;
    let colors = ["#2ecc71", "#27ae60", "#a3fd83"]; // Default Slime Green
    let speed = 4;

    // Dynamically match debris colors to the exact monster type / theme
        if (window.mob) {
            let vType = window.mob.visualType;
            let isGoldDungeon = window.playerStats.currentDungeon === 'gold' && window.playerStats.isDungeonMode;
            let isMatDungeon = window.playerStats.currentDungeon === 'mat' && window.playerStats.isDungeonMode;
            let isEquipDungeon = window.playerStats.currentDungeon === 'equip' && window.playerStats.isDungeonMode;

            if (isGoldDungeon || ["coin_elemental", "hoard_mimic", "gilded_scuttler"].includes(vType)) {
                colors = ["#ffd700", "#f1c40f", "#b7950b", "#ffffff"];
            } else if (isMatDungeon || ["swamp_basilisk", "toxic_fly", "marsh_ghost"].includes(vType)) {
            colors = ["#2ecc71", "#27ae60", "#9b59b6", "#1abc9c"];
        } else if (isEquipDungeon || ["golem", "gargoyle", "wyrmling"].includes(vType)) {
            colors = ["#34495e", "#5d6d7e", "#7f8c8d", "#1a252f"];
        } else if (vType && ["magma_elemental", "lava_serpent", "hell_bat"].includes(vType)) {
            colors = ["#ff5500", "#d35400", "#e74c3c", "#2c0e08"];
        } else if (vType && ["void_orb", "void_crawler", "void_spectre", "void_wraith", "rift_drifter"].includes(vType)) {
            colors = ["#9b59b6", "#8e44ad", "#e84393", "#110221"];
        } else if (vType && ["clockwork_scarab", "temporal_watcher", "clockwork_drone", "star_weaver"].includes(vType)) {
            colors = ["#dca04c", "#f1c40f", "#b7950b", "#7f8c8d"];
        } else if (vType && ["neon_spider", "cyber_wraith", "wireframe_orb"].includes(vType)) {
            colors = ["#00d2ff", "#ff007f", "#3498db", "#ffffff"];
        } else if (window.mob.type === "prestige_boss") {
            colors = ["#d35400", "#ff3300", "#111116", "#ffeaa7"];
        } else if (window.mob.type === "aegis_goliath") {
            colors = ["#3498db", "#2980b9", "#7f8c8d", "#ffffff"];
        } else if (window.mob.type === "chronos_arbitrator") {
            colors = ["#f1c40f", "#dca04c", "#7f8c8d", "#111116"];
        } else if (window.mob.type === "nexus_overseer") {
            colors = ["#ff007f", "#e84393", "#00b894", "#111111"];
        } else if (mobType === "rift_guardian" || mobType === "void_spectre" || mobType === "void_crawler" || mobType === "void_orb") {
            count = 45; colors = ["#9b59b6", "#8e44ad", "#e84393", "#110221"]; speed = 6;
        } else if (mobType === "boss" || mobType === "dungeon_boss") {
            count = 40; colors = ["#e74c3c", "#e67e22", "#f1c40f", "#ffffff"]; speed = 7;
        } else if (mobType === "prestige_boss") {
            count = 60; colors = ["#d35400", "#ff3300", "#111116", "#ffeaa7"]; speed = 8;
        } else if (mobType === "dungeon_miniboss") {
            count = 25; colors = ["#1abc9c", "#16a085", "#34495e"]; speed = 5;
        } else {
            let tier = window.getStageTier();
            if (tier === 1) colors = ["#3498db", "#ecf0f1", "#bdc3c7"];
            else if (tier === 2) colors = ["#e74c3c", "#e67e22", "#2c0e08"];
            else if (tier === 3) colors = ["#27ae60", "#1b4f30", "#9b59b6"];
            else if (tier === 4) colors = ["#8e44ad", "#e84393", "#0d011a"];
        }
    }

    for (let i = 0; i < count; i++) {
        let angle = Math.random() * Math.PI * 2;
        let velocity = window.randFloat(1, speed);
        window.particles.push({
            x: x, y: y,
            vx: Math.cos(angle) * velocity, vy: Math.sin(angle) * velocity - window.randFloat(1, 3),
            radius: window.randFloat(1.5, 4.5), color: colors[Math.floor(Math.random() * colors.length)],
            alpha: 1, fade: true, maxLife: window.randInt(25, 45), life: window.randInt(25, 45)
        });
    }
};

window.spawnTemperParticles = function(isSuccess) {
    let cvs = document.getElementById('gameCanvas');
    let w = cvs ? cvs.width : 750;
    let h = cvs ? cvs.height : 250;
    let colors = isSuccess ? ["#f1c40f", "#2ecc71", "#ffffff"] : ["#7f8c8d", "#c0392b", "#2c3e50"];

    for(let i=0; i<50; i++) {
        window.particles.push({
            x: w / 2, y: h / 2,
            vx: (Math.random() - 0.5) * 16, vy: (Math.random() - 0.5) * 16,
            radius: Math.random() * 4 + 1.5, color: colors[Math.floor(Math.random() * colors.length)], alpha: 1, life: isSuccess ? 45 : 30
        });
    }
};

window.spawnPurchaseCelebration = function(theme, color, rarity) {
    if (window.particles.length > 300) return;
    let cvs = document.getElementById('gameCanvas');
    let spawnX = cvs ? cvs.width / 2 : 375;
    let spawnY = cvs ? cvs.height / 2 : 125;

    let count = 25; let speed = 5; let text = "PURCHASED!";

    if (theme === 'gacha') { count = 55; speed = 8; text = "🎰 DISPENSED! 🎰"; }
    else if (theme === 'altar') { count = 65; speed = 11; text = "🔮 RIFT OPENED! 🔮"; }
    else if (theme === 'alchemy') { count = 20; speed = 4; text = "🧪 BREWED!"; }

    if (rarity === 5 || rarity === "UNIQUE") {
        count = Math.floor(count * 2.5); speed *= 1.4; text = rarity === "UNIQUE" ? "✨ UNIQUE TROPHY! ✨" : "🔥 MYTHIC PULL! 🔥";
    } else if (rarity === 4) {
        count = Math.floor(count * 1.8); speed *= 1.2; text = "🌟 LEGENDARY PULL! 🌟";
    }

    for (let i = 0; i < count; i++) {
        window.particles.push({
            x: spawnX + window.randFloat(-15, 15), y: spawnY + window.randFloat(-10, 10),
            vx: (Math.random() - 0.5) * speed, vy: (Math.random() - 0.7) * speed - 2.5,
            radius: window.randFloat(1.5, (rarity === 5 || rarity === "UNIQUE") ? 5.0 : 3.5),
            color: color || "#f1c40f", alpha: 1, life: window.randInt(25, 60)
        });
    }

    window.effects.push({ x: spawnX - 70, y: spawnY - 15, text: text, color: color || "#f1c40f", life: 80 });

    if (rarity === 5 || rarity === 4 || rarity === "UNIQUE" || theme === 'altar') {
        window.beams.push({ x: spawnX, color: color || "#f1c40f", life: 50, maxLife: 50 });
        if (cvs) { cvs.classList.add('shake'); setTimeout(() => cvs.classList.remove('shake'), 400); }
    }
};

window.spawnDamageEffect = function(amount, type, isCrit) {
    if (!window.mob) return;

    const isBoss = (window.mob.type === "boss" || window.mob.type === "dungeon_boss" || window.mob.type === "prestige_boss" || window.mob.type === "rift_guardian" || window.mob.type === "aegis_goliath" || window.mob.type === "chronos_arbitrator" || window.mob.type === "nexus_overseer");
        if (isBoss && amount >= window.mob.maxHp * 0.60) {
            const funnyPhrases = ["OUCH!!", "OW!!!", "OWWY!!", "OOF!!!", "MY SPINE!!", "NOT THE FACE!!", "STOP IT!!", "BRUH!!!", "REALLY?!", "HELP!!"];
            window.mob.funnyText = funnyPhrases[Math.floor(Math.random() * funnyPhrases.length)];
        window.mob.funnyTextTimer = 60;
    }

    let hitColor = "#ecf0f1";
    let hitText = window.formatNumber(amount);
    const icons = { slash: "⚔️", dagger: "🗡️", lightning: "⚡", fire: "🔥", frost: "❄️", echo: "👻", counter: "🛡️", bleed: "🩸" };

    if (isCrit) {
        hitColor = "#e74c3c"; hitText = "💥 " + window.formatNumber(amount);
    } else {
        if (type === 'lightning') hitColor = "#f1c40f";
        else if (type === 'fire') hitColor = "#e67e22";
        else if (type === 'frost') hitColor = "#3498db";
        else if (type === 'echo') hitColor = "#9b59b6";
        else if (type === 'counter') hitColor = "#f1c40f";
        else if (type === 'bleed') hitColor = "#960018";
    }

    if (type !== 'slash') hitText = `${icons[type]} ${hitText}`;

    let offsetX = window.randFloat(-40, 40);
        let offsetY = window.randFloat(-50, 15);

        window.effects.push({
            x: window.mob.x + window.mob.w / 2 + offsetX, y: window.mob.y + offsetY,
            vx: window.randFloat(-1.2, 1.2),
            vy: window.randFloat(-1.5, -0.6),
            text: hitText, color: hitColor, life: 40
        });

        let existingTotal = window.effects.find(e => e.isCumulative && e.life > 0);
        if (existingTotal) {
            existingTotal.amount += amount;
            existingTotal.text = `TOTAL: ${window.formatNumber(existingTotal.amount)}`;
            existingTotal.life = 55;
            existingTotal.x = window.mob.x + window.mob.w / 2 - 25;
            existingTotal.y = window.mob.y - 25;
        } else {
            window.effects.push({
                x: window.mob.x + window.mob.w / 2 - 25, y: window.mob.y - 25,
                vx: 0, vy: -0.4,
                text: `TOTAL: ${window.formatNumber(amount)}`, color: "#f1c40f", life: 55, isCumulative: true, amount: amount
            });
        }
};

window.renderNemesisPreview = function(mobData) {
    const dCanvas = document.getElementById('death-enemy-canvas');
    if (!dCanvas) return;
    const dCtx = dCanvas.getContext('2d');
    dCtx.clearRect(0, 0, dCanvas.width, dCanvas.height);

    if (!mobData) {
        dCtx.fillStyle = "#c0392b"; dCtx.font = "bold 20px sans-serif";
        dCtx.textAlign = "center"; dCtx.textBaseline = "middle"; dCtx.fillText("💀", 30, 30);
        return;
    }

    let renderMob = JSON.parse(JSON.stringify(mobData));
    renderMob.flashTimer = 0;
    let maxDim = Math.max(renderMob.w, renderMob.h);
    let scale = maxDim > 0 ? 40 / maxDim : 1.0;

    dCtx.save();
    dCtx.translate(30, 30); dCtx.scale(scale, scale);
    dCtx.translate(-(renderMob.x + renderMob.w / 2), -(renderMob.y + renderMob.h / 2));
    window.drawSingleMob(dCtx, renderMob);
    dCtx.restore();
};

// --- CORE MOB DRAWING ENGINE ---

window.drawSingleMob = function(c, m) {
    if (!m) return;
    let t = m.visualTier;
    c.save();

    let penWidth = (m.type === "boss" || m.type === "dungeon_boss" || m.type === "prestige_boss" || m.type === "rift_guardian" || m.type === "aegis_goliath" || m.type === "chronos_arbitrator" || m.type === "nexus_overseer") ? 2.4 : 1.8;
    c.strokeStyle = "#000000";
    c.lineWidth = penWidth;
    c.lineJoin = "round";

    if (m.flashTimer > 0) {
        c.fillStyle = "#ffffff";
    } else {
        c.fillStyle = (m.type === "boss" || m.type === "dungeon_boss" || m.type === "dungeon_miniboss") ? "#34495e" : "#555";
    }

    if (m.type === "mob") {
        if (m.isRare) {
            c.save();
            let auraPulse = 1 + Math.sin(Date.now() / 150) * 0.12;
            let auraGrad = c.createRadialGradient(
                m.x + m.w / 2, m.y + m.h / 2, 2,
                m.x + m.w / 2, m.y + m.h / 2, Math.max(m.w, m.h) * 1.15 * auraPulse
            );
            auraGrad.addColorStop(0, "rgba(241, 196, 15, 0.45)");
            auraGrad.addColorStop(0.6, "rgba(230, 126, 34, 0.18)");
            auraGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
            c.fillStyle = auraGrad;
            c.beginPath();
            c.arc(m.x + m.w / 2, m.y + m.h / 2, Math.max(m.w, m.h) * 1.15 * auraPulse, 0, Math.PI * 2);
            c.fill();
            c.restore();
        }

        let vType = m.visualType;
        if (!vType) {
            let fallbacks = { 0: "slime", 1: "golem", 2: "magma_elemental", 3: "marsh_ghost", 4: "void_orb" };
            vType = fallbacks[t] || "slime";
        }

        if (vType === "slime") {
                        let squish = Math.sin(Date.now() / 100) * 3.5;
                        let wScale = m.w / 2 + squish;
                        let hScale = m.h / 2 - squish;
                        let cx = m.x + m.w / 2;
                        let cy = m.y + m.h - 10 + squish / 2;

                        let slimeGrad = c.createRadialGradient(cx - 3, cy - 5, 2, cx, cy, m.w * 0.75);
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
                            c.ellipse(cx - wScale * 0.4, cy - hScale * 0.4, wScale * 0.25, hScale * 0.2, Math.PI / 4, 0, Math.PI * 2);
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
                            c.ellipse(cx + 4, stemTopY - 12, 5, 2.5, -Math.PI / 6, 0, Math.PI * 2);
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
                            c.arc(cx - eyeOffsetX - eyeRadius * 0.2, cy - eyeOffsetY - eyeRadius * 0.2, eyeRadius * 0.3, 0, Math.PI * 2);
                            c.arc(cx + eyeOffsetX - eyeRadius * 0.2, cy - eyeOffsetY - eyeRadius * 0.2, eyeRadius * 0.3, 0, Math.PI * 2);
                            c.fill();

                            c.strokeStyle = "#1e272e";
                            c.lineWidth = 2;
                            c.beginPath();
                            c.arc(cx, cy + hScale * 0.05, wScale * 0.12, 0, Math.PI);
                            c.stroke();

                            c.fillStyle = "rgba(231, 76, 60, 0.4)";
                            c.beginPath();
                            c.ellipse(cx - eyeOffsetX - 2, cy - eyeOffsetY + 3, 2.5, 1.2, 0, 0, Math.PI * 2);
                            c.ellipse(cx + eyeOffsetX + 2, cy - eyeOffsetY + 3, 2.5, 1.2, 0, 0, Math.PI * 2);
                            c.fill();
                        }
                    }
                    else if (vType === "coin_elemental") {
                        let cx = m.x + m.w / 2;
                        let cy = m.y + m.h / 2 + Math.sin(Date.now() / 150) * 3;
                        let coreGrad = c.createRadialGradient(cx, cy, 1, cx, cy, 10);
                        coreGrad.addColorStop(0, "#ffffff");
                        coreGrad.addColorStop(0.5, "#ffd700");
                        coreGrad.addColorStop(1, "rgba(255, 215, 0, 0)");
                        c.fillStyle = coreGrad;
                        c.beginPath(); c.arc(cx, cy, 12, 0, Math.PI * 2); c.fill();

                        c.strokeStyle = "rgba(241, 196, 15, 0.35)";
                        c.lineWidth = 1;
                        c.save(); c.translate(cx, cy); c.rotate(Math.PI / 6);
                        c.beginPath(); c.ellipse(0, 0, 22, 7, 0, 0, Math.PI * 2); c.stroke(); c.restore();
                        c.save(); c.translate(cx, cy); c.rotate(-Math.PI / 4);
                        c.beginPath(); c.ellipse(0, 0, 26, 8, 0, 0, Math.PI * 2); c.stroke(); c.restore();

                        for (let i = 0; i < 6; i++) {
                            let angle = (Date.now() / 600) + (i * Math.PI * 2 / 6);
                            let dist = 18 + Math.sin(Date.now() / 150 + i) * 3;
                            let ox = cx + Math.cos(angle) * dist * 1.3;
                            let oy = cy + Math.sin(angle) * dist * 0.5;

                            let rot = angle * 2;
                            let cw = 6 * Math.abs(Math.sin(rot));
                            let ch = 6;

                            c.save();
                            c.translate(ox, oy);
                            c.rotate(Math.PI / 12);

                            c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#b7950b";
                            c.beginPath(); c.ellipse(0, 0, cw + 1.2, ch + 1.2, 0, 0, Math.PI * 2); c.fill(); c.stroke();

                            if (m.flashTimer === 0) {
                                c.fillStyle = "#ffd700";
                                c.beginPath(); c.ellipse(0, 0, cw, ch, 0, 0, Math.PI * 2); c.fill();
                                c.strokeStyle = "#b7950b"; c.lineWidth = 0.8;
                                c.beginPath(); c.ellipse(0, 0, cw * 0.8, ch * 0.8, 0, 0, Math.PI * 2); c.stroke();
                                c.fillStyle = "rgba(255,255,255,0.75)";
                                c.beginPath(); c.ellipse(-cw * 0.3, -ch * 0.3, cw * 0.25, ch * 0.2, Math.PI/4, 0, Math.PI * 2); c.fill();
                            }
                            c.restore();
                        }
                    }
                    else if (vType === "hoard_mimic") {
                        let cx = m.x + m.w / 2;
                        let cy = m.y + m.h - 15;
                        let time = Date.now();
                        let snap = Math.abs(Math.sin(time / 200));
                        let lidAngle = -snap * 0.45;

                        c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#4a2d18";
                        c.beginPath(); c.rect(cx - 15, cy - 8, 30, 16); c.fill(); c.stroke();

                        c.fillStyle = "#ffd700";
                        c.beginPath(); c.ellipse(cx, cy - 8, 12, 3, 0, 0, Math.PI * 2); c.fill(); c.stroke();

                        c.fillStyle = "#ffd700";
                        c.strokeStyle = "#4d2e1a"; c.lineWidth = 1;
                        for (let i = -12; i <= 12; i += 6) {
                            c.beginPath();
                            c.moveTo(cx + i - 2, cy - 8 - lidAngle * 10);
                            c.lineTo(cx + i, cy - 4 - lidAngle * 10);
                            c.lineTo(cx + i + 2, cy - 8 - lidAngle * 10);
                            c.closePath(); c.fill(); c.stroke();

                            c.beginPath();
                            c.moveTo(cx + i - 2, cy - 8);
                            c.lineTo(cx + i, cy - 11);
                            c.lineTo(cx + i + 2, cy - 8);
                            c.closePath(); c.fill(); c.stroke();
                        }

                        if (m.flashTimer === 0) {
                            let tSway = Math.sin(time / 80) * 6;
                            c.strokeStyle = "#8e44ad"; c.lineWidth = 3.5; c.lineCap = "round";
                            c.beginPath();
                            c.moveTo(cx, cy - 8);
                            c.quadraticCurveTo(cx - 6 + tSway / 2, cy - 12, cx - 12 + tSway, cy - 16);
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
                        c.beginPath(); c.rect(-30, -10, 30, 10); c.fill(); c.stroke();
                        c.fillStyle = "#7f8c8d";
                        c.fillRect(-17, -10, 4, 10); c.strokeRect(-17, -10, 4, 10);
                        c.fillStyle = "#ffd700";
                        c.fillRect(-16, -2, 2, 5); c.strokeRect(-16, -2, 2, 5);
                        c.restore();

                        if (snap > 0.6 && Math.random() < 0.1 && window.particles.length < 250 && !window.isGamePaused) {
                            window.particles.push({
                                x: cx + window.randFloat(-8, 8), y: cy - 9,
                                vx: window.randFloat(-1, 1), vy: -window.randFloat(1, 2.5),
                                radius: window.randFloat(1, 2), color: "#ffd700", alpha: 0.9, life: window.randInt(15, 30)
                            });
                        }
                    }
                    else if (vType === "gilded_scuttler") {
                        let cx = m.x + m.w / 2;
                        let cy = m.y + m.h - 15;
                        let time = Date.now();
                        let legWalk = Math.sin(time / 60) * 3;

                        c.strokeStyle = m.flashTimer > 0 ? "#ffffff" : "#b7950b"; c.lineWidth = 2.4;
                        for (let i = -1; i <= 1; i += 2) {
                            let legX = cx + (i * 12);
                            c.beginPath();
                            c.moveTo(legX, cy + 4);
                            c.lineTo(legX + (i * 6) + legWalk * i, cy + 12);
                            c.stroke();

                            c.beginPath();
                            c.moveTo(legX - (i * 4), cy + 4);
                            c.lineTo(legX - (i * 10) - legWalk * i, cy + 12);
                            c.stroke();
                        }

                        c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#ffd700";
                        c.beginPath(); c.ellipse(cx - 10, cy - 2, 4, 3, 0, 0, Math.PI * 2); c.fill(); c.stroke();
                        c.beginPath();
                        c.moveTo(cx - 12, cy - 2);
                        c.quadraticCurveTo(cx - 18, cy - 8 + legWalk, cx - 22, cy - 4);
                        c.quadraticCurveTo(cx - 16, cy, cx - 12, cy - 2);
                        c.fill(); c.stroke();

                        let sAngle = Math.PI / 12 + Math.sin(time / 150) * 0.05;
                        c.save();
                        c.translate(cx + 2, cy - 2);
                        c.rotate(sAngle);

                        c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#967507";
                        c.beginPath(); c.arc(0, 0, 13.5, 0, Math.PI * 2); c.fill(); c.stroke();

                        c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#ffd700";
                        c.beginPath(); c.arc(0, 0, 12, 0, Math.PI * 2); c.fill(); c.stroke();

                        if (m.flashTimer === 0) {
                            c.strokeStyle = "#b7950b"; c.lineWidth = 1.2;
                            c.beginPath(); c.arc(0, 0, 10, 0, Math.PI * 2); c.stroke();

                            c.strokeStyle = "#4d2e1a"; c.lineWidth = 1.5;
                            c.beginPath();
                            c.moveTo(-4, -4); c.lineTo(4, 4);
                            c.moveTo(4, -4); c.lineTo(-4, 4);
                            c.moveTo(0, -5); c.lineTo(0, 5);
                            c.stroke();

                            c.fillStyle = "rgba(255, 255, 255, 0.8)";
                            c.beginPath(); c.arc(-5, -5, 2, 0, Math.PI * 2); c.fill();
                        }
                        c.restore();

                        if (m.flashTimer === 0) {
                            c.fillStyle = "#ff0055";
                            c.beginPath(); c.arc(cx - 12, cy - 3, 1.2, 0, Math.PI * 2); c.fill();
                        }
                    }
                    else if (vType === "golem") {
                        let hover = Math.sin(Date.now() / 120) * 2;
                        let blockColor = m.flashTimer > 0 ? "#ffffff" : "#4e545c";
                        let shadowColor = m.flashTimer > 0 ? "#ffffff" : "#2f353d";
                        let rubyColor = m.isRare ? "#ff007f" : "#ff3333";

                        c.fillStyle = shadowColor; c.beginPath(); c.roundRect(m.x + 2, m.y + 10 + hover, m.w - 4, m.h - 10, [6]); c.fill(); c.stroke();
                        c.fillStyle = blockColor; c.beginPath(); c.roundRect(m.x + 4, m.y + 12 + hover, m.w - 8, m.h - 14, [4]); c.fill(); c.stroke();
                        c.fillStyle = shadowColor; c.beginPath(); c.rect(m.x + 6, m.y + hover, m.w - 12, 10); c.fill(); c.stroke();
                        c.fillStyle = blockColor; c.beginPath(); c.rect(m.x + 8, m.y + 2 + hover, m.w - 16, 8); c.fill(); c.stroke();

                        if (m.flashTimer === 0) {
                            c.fillStyle = rubyColor; c.shadowBlur = 8; c.shadowColor = rubyColor;
                            c.beginPath(); c.moveTo(m.x + 8, m.y + 4 + hover); c.lineTo(m.x + 13, m.y + 7 + hover); c.lineTo(m.x + 8, m.y + 8 + hover); c.closePath(); c.fill(); c.stroke();
                            c.beginPath(); c.moveTo(m.x + m.w - 8, m.y + 4 + hover); c.lineTo(m.x + m.w - 13, m.y + 7 + hover); c.lineTo(m.x + m.w - 8, m.y + 8 + hover); c.closePath(); c.fill(); c.stroke();
                            c.shadowBlur = 0;
                        }

                        c.fillStyle = shadowColor; c.beginPath(); c.rect(m.x - 4, m.y + 12 + hover, 5, 8); c.fill(); c.stroke();
                        c.beginPath(); c.rect(m.x + m.w - 1, m.y + 12 + hover, 5, 8); c.fill(); c.stroke();
                        c.fillStyle = blockColor; c.beginPath(); c.rect(m.x - 3, m.y + 13 + hover, 3, 6); c.fill(); c.stroke();
                        c.beginPath(); c.rect(m.x + m.w - 2, m.y + 13 + hover, 3, 6); c.fill(); c.stroke();

                        if (m.flashTimer === 0) {
                            c.strokeStyle = "#1b1d22"; c.lineWidth = 1.5; c.beginPath(); c.moveTo(m.x + 8, m.y + 18 + hover); c.lineTo(m.x + 14, m.y + 24 + hover); c.moveTo(m.x + m.w - 8, m.y + 16 + hover); c.lineTo(m.x + m.w - 12, m.y + 22 + hover); c.stroke();
                            c.fillStyle = rubyColor; c.beginPath(); c.arc(m.x + m.w / 2, m.y + m.h / 2 + 4 + hover, 3, 0, Math.PI * 2); c.fill(); c.stroke();
                        }
                    }
                    else if (vType === "wyrmling") {
                        let cx = m.x + m.w / 2; let cy = m.y + m.h / 2 + Math.sin(Date.now() / 100) * 3;

                        for (let i = 3; i >= 0; i--) {
                            let segX = cx + (i * 8); let segY = cy + Math.sin(Date.now() / 150 - i) * 5;
                            c.fillStyle = m.flashTimer > 0 ? "#ffffff" : (m.isRare ? "#9b59b6" : "#4a5568");
                            c.beginPath(); c.arc(segX, segY, 8.5 - i * 1.3, 0, Math.PI * 2); c.fill(); c.stroke();
                        }

                        c.fillStyle = m.flashTimer > 0 ? "#ffffff" : (m.isRare ? "#9b59b6" : "#4a5568");
                        c.beginPath(); c.arc(cx, cy - 13, 8.5, 0, Math.PI * 2); c.fill(); c.stroke();

                        if (m.flashTimer === 0) {
                            c.fillStyle = m.isRare ? "#f1c40f" : "#e74c3c";
                            c.beginPath(); c.arc(cx - 3, cy - 15, 1.8, 0, Math.PI * 2); c.arc(cx + 3, cy - 15, 1.8, 0, Math.PI * 2); c.fill();
                        }
                    }
        else if (vType === "rift_drifter") {
            let hover = Math.sin(Date.now() / 110) * 6; let cx = m.x + m.w / 2; let cy = m.y + m.h / 2 + hover;
            let coreGrad = c.createRadialGradient(cx, cy, 1, cx, cy, 12);
            coreGrad.addColorStop(0, "#ffffff"); coreGrad.addColorStop(0.4, "#e84393"); coreGrad.addColorStop(1, "rgba(142, 68, 173, 0)");
            c.fillStyle = coreGrad; c.beginPath(); c.arc(cx, cy, 12, 0, Math.PI * 2); c.fill();
            c.fillStyle = "#8e44ad"; c.strokeStyle = "#000000"; c.lineWidth = 1.5;
            for (let i = 0; i < 3; i++) {
                let angle = (Date.now() / 180) + (i * Math.PI * 2 / 3);
                let sx = cx + Math.cos(angle) * 16; let sy = cy + Math.sin(angle) * 8;
                c.beginPath(); c.moveTo(sx, sy - 4); c.lineTo(sx + 3, sy); c.lineTo(sx, sy + 4); c.lineTo(sx - 3, sy); ctx.closePath(); c.fill(); c.stroke();
            }
        }
        else if (vType === "star_weaver") {
            let cx = m.x + m.w / 2; let cy = m.y + m.h / 2 + Math.sin(Date.now() / 130) * 4;
            c.save(); c.strokeStyle = "#3498db"; c.lineWidth = 1.8; c.shadowBlur = 10; c.shadowColor = "#3498db";
            c.beginPath(); c.moveTo(cx, cy - 12); c.lineTo(cx + 10, cy); c.lineTo(cx + 6, cy + 10); c.lineTo(cx - 6, cy + 10); c.lineTo(cx - 10, cy); c.closePath(); c.stroke();
            c.fillStyle = "#ffffff"; let joints = [[cx, cy - 12], [cx + 10, cy], [cx + 6, cy + 10], [cx - 6, cy + 10], [cx - 10, cy]];
            joints.forEach(j => { c.beginPath(); c.arc(j[0], j[1], 2.5, 0, Math.PI * 2); c.fill(); c.stroke(); });
            c.strokeStyle = "#ffffff"; c.lineWidth = 1.5;
            for (let i = 0; i < 4; i++) {
                let side = i % 2 === 0 ? -1 : 1; let legYOffset = (i < 2 ? -4 : 4); let swing = Math.sin(Date.now() / 80 + i) * 6;
                c.beginPath(); c.moveTo(cx + (10 * side), cy + legYOffset); c.lineTo(cx + (22 * side) + swing, cy + legYOffset - 4); c.lineTo(cx + (26 * side) + swing, cy + legYOffset + 14); c.stroke();
            }
            c.restore();
        }
        else if (vType === "void_wraith") {
            let hover = Math.sin(Date.now() / 150) * 6; let cx = m.x + m.w / 2; let cy = m.y + m.h / 2 - 2 + hover;
            c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#1b0a2a"; c.strokeStyle = "#000000"; c.lineWidth = 1.8;
            c.beginPath(); c.moveTo(cx, cy - 16); c.quadraticCurveTo(cx - 12, cy - 6, cx - 10, cy + 14); c.lineTo(cx - 4, cy + 8); c.lineTo(cx, cy + 18); c.lineTo(cx + 4, cy + 8); c.lineTo(cx + 10, cy + 14); c.quadraticCurveTo(cx + 13, cy - 6, cx, cy - 16); c.closePath(); c.fill(); c.stroke();
            if (m.flashTimer === 0) {
                c.strokeStyle = "#8e44ad"; c.lineWidth = 2.0; let clawSwing = Math.sin(Date.now() / 100) * 3;
                c.beginPath(); c.moveTo(cx - 8, cy + 2); c.lineTo(cx - 16 + clawSwing, cy + 4); c.lineTo(cx - 20 + clawSwing, cy + 1); c.moveTo(cx - 8, cy + 2); c.lineTo(cx - 17 + clawSwing, cy + 7); c.stroke();
                c.fillStyle = "#e84393"; c.shadowBlur = 6; c.shadowColor = "#e84393";
                c.beginPath(); c.ellipse(cx - 3, cy - 5, 1.2, 3, Math.PI / 12, 0, Math.PI * 2); c.ellipse(cx + 1, cy - 5, 1.2, 3, -Math.PI / 12, 0, Math.PI * 2); c.fill(); c.shadowBlur = 0;
            }
        }
        else if (vType === "sprout") {
            let squish = Math.sin(Date.now() / 110) * 2.5; let wScale = m.w / 2 + squish; let hScale = m.h / 2 - squish;
            let cx = m.x + m.w / 2; let cy = m.y + m.h;
            c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#fdf6e2"; c.beginPath(); c.ellipse(cx, cy - hScale * 0.4, wScale * 0.65, hScale * 0.45, 0, 0, Math.PI * 2); c.fill(); c.stroke();
            if (m.flashTimer === 0) {
                c.fillStyle = "#1e272e"; let eyeOffsetX = wScale * 0.22; let eyeY = cy - hScale * 0.45; let eyeSize = Math.max(1, hScale * 0.12);
                c.beginPath(); c.arc(cx - eyeOffsetX, eyeY, eyeSize, 0, Math.PI * 2); c.arc(cx + eyeOffsetX, eyeY, eyeSize, 0, Math.PI * 2); c.fill();
                c.fillStyle = "rgba(231, 76, 60, 0.45)"; c.beginPath(); c.ellipse(cx - eyeOffsetX - 3, eyeY + 3, 3, 1.5, 0, 0, Math.PI * 2); c.ellipse(cx + eyeOffsetX + 3, eyeY + 3, 3, 1.5, 0, 0, Math.PI * 2); c.fill();
            }
            let capY = cy - hScale * 1.05; c.fillStyle = m.flashTimer > 0 ? "#ffffff" : (m.isRare ? "#f1c40f" : "#ff6b1a");
            c.beginPath(); c.ellipse(cx, capY, wScale * 1.25, hScale * 0.85, 0, Math.PI, 0); c.lineTo(cx + wScale * 1.25, capY + hScale * 0.1); c.quadraticCurveTo(cx, capY + hScale * 0.4, cx - wScale * 1.25, capY + hScale * 0.1); c.closePath(); c.fill(); c.stroke();
            if (m.flashTimer === 0) { c.fillStyle = "rgba(255, 255, 255, 0.5)"; c.beginPath(); c.ellipse(cx - wScale * 0.5, capY - hScale * 0.35, wScale * 0.3, hScale * 0.15, -Math.PI / 6, 0, Math.PI * 2); c.fill(); }
        }
        else if (vType === "thorn_wyrm") {
            let cx = m.x + m.w / 2; let cy = m.y + m.h / 2 + 10; let time = Date.now() / 130;
            c.strokeStyle = "#000000"; c.lineWidth = 2;
            for (let i = 0; i < 5; i++) {
                let segX = cx + (i * 9); let segY = cy + Math.sin(time - i * 0.8) * 5;
                c.beginPath(); c.moveTo(segX, segY + 4); c.lineTo(segX - 3, segY + 12 + Math.sin(time * 2 + i) * 3); c.stroke();
            }
            for (let i = 4; i >= 0; i--) {
                let segX = cx + (i * 9); let segY = cy + Math.sin(time - i * 0.8) * 5; let radius = 10 - (i * 1.1);
                c.fillStyle = m.flashTimer > 0 ? "#ffffff" : (m.isRare ? "#e67e22" : "#27ae60");
                c.beginPath(); c.arc(segX, segY, radius, 0, Math.PI * 2); c.fill(); c.stroke();
                if (m.flashTimer === 0) {
                    c.fillStyle = m.isRare ? "#f1c40f" : "#1e8449";
                    c.beginPath(); c.moveTo(segX + 2, segY - radius); c.quadraticCurveTo(segX + 5, segY - radius - 6, segX, segY - radius - 8); c.quadraticCurveTo(segX - 3, segY - radius - 4, segX - 2, segY - radius); c.closePath(); c.fill(); c.stroke();
                }
            }
            c.fillStyle = m.flashTimer > 0 ? "#ffffff" : (m.isRare ? "#f39c12" : "#2ecc71");
            let hX = cx - 8; let hY = cy + Math.sin(time) * 5; c.beginPath(); c.arc(hX, hY, 11, 0, Math.PI * 2); c.fill(); c.stroke();
            if (m.flashTimer === 0) {
                c.fillStyle = m.isRare ? "#ffea75" : "#2ecc71"; c.beginPath(); c.moveTo(hX - 4, hY - 8); c.quadraticCurveTo(hX - 12, hY - 16, hX - 15, hY - 14); c.quadraticCurveTo(hX - 8, hY - 6, hX - 2, hY - 6); c.closePath(); c.fill(); c.stroke();
                c.fillStyle = "#ffffff"; c.beginPath(); c.arc(hX - 4, hY - 2, 2.5, 0, Math.PI * 2); c.fill(); c.stroke();
                c.fillStyle = "#1e272e"; c.beginPath(); c.arc(hX - 5, hY - 2, 1.2, 0, Math.PI * 2); c.fill();
            }
        }
        else if (vType === "gargoyle") {
            let cx = m.x + m.w / 2; let cy = m.y + m.h / 2; let wings = Math.sin(Date.now() / 90) * 11;
            c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#34495e";
            c.beginPath(); c.moveTo(cx - 3, cy); c.lineTo(cx - 22, cy - 14 + wings); c.lineTo(cx - 10, cy + 8); c.moveTo(cx + 3, cy); c.lineTo(cx + 22, cy - 14 + wings); c.lineTo(cx + 10, cy + 8); c.closePath(); c.fill(); c.stroke();
            c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#5d6d7e"; c.beginPath(); c.ellipse(cx, cy + 6, 8, 11, 0, 0, Math.PI * 2); c.fill(); c.stroke();
            c.beginPath(); c.arc(cx, cy - 10, 7.5, 0, Math.PI * 2); c.fill(); c.stroke();
            if (m.flashTimer === 0) { c.fillStyle = "#f1c40f"; c.beginPath(); c.arc(cx - 2.5, cy - 11, 1.8, 0, Math.PI * 2); c.arc(cx + 2.5, cy - 11, 1.8, 0, Math.PI * 2); c.fill(); }
        }
        else if (vType === "magma_elemental") {
            let flicker = Math.sin(Date.now() / 60) * 3; let cx = m.x + m.w / 2; let cy = m.y + m.h / 2;
            c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#1a0805"; c.beginPath(); c.roundRect(cx - 14, cy - 6, 28, 22, [4]); c.fill(); c.stroke();
            if (m.flashTimer === 0) { c.strokeStyle = "#ff5500"; c.lineWidth = 2; c.beginPath(); c.moveTo(cx - 6, cy); c.stroke(); }
            c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#d35400"; c.beginPath(); c.moveTo(cx - 14, cy); c.quadraticCurveTo(cx - 24 - flicker, cy + 4, cx - 20, cy + 12); c.lineTo(cx - 11, cy + 6); c.moveTo(cx + 14, cy); c.quadraticCurveTo(cx + 24 + flicker, cy + 4, cx + 20, cy + 12); c.lineTo(cx + 11, cy + 6); c.closePath(); c.fill(); c.stroke();
            c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#2d110b"; c.beginPath(); c.arc(cx, cy - 12, 8, 0, Math.PI * 2); c.fill(); c.stroke();
            c.fillStyle = "#e67e22"; c.beginPath(); c.moveTo(cx - 6, cy - 18); c.quadraticCurveTo(cx, cy - 28 - flicker, cx + 6, cy - 18); c.quadraticCurveTo(cx + 3, cy - 12, cx - 3, cy - 12); c.closePath(); c.fill(); c.stroke();
            if (m.flashTimer === 0) { c.fillStyle = "#f1c40f"; c.beginPath(); c.arc(cx - 3, cy - 12, 1.5, 0, Math.PI * 2); c.arc(cx + 3, cy - 12, 1.5, 0, Math.PI * 2); c.fill(); }
        }
        else if (vType === "lava_serpent") {
            let cx = m.x + m.w / 2; let cy = m.y + m.h / 2 + 5; let time = Date.now() / 140;
            if (Math.random() < 0.15 && window.particles.length < 200 && !window.isGamePaused) {
                window.particles.push({ x: cx + window.randFloat(0, 30), y: cy - 10, vx: -window.randFloat(0.5, 1.5), vy: -window.randFloat(1, 2.5), radius: window.randFloat(1, 3), color: "rgba(230, 126, 34, 0.4)", alpha: 0.8, life: window.randInt(15, 30) });
            }
            for (let i = 5; i >= 0; i--) {
                let segX = cx + (i * 10); let segY = cy + Math.sin(time - i * 0.8) * 6; let radius = 10.5 - (i * 1.1);
                c.fillStyle = m.flashTimer > 0 ? "#ffffff" : (m.isRare ? "#ff8c00" : "#1c0905"); c.beginPath(); c.arc(segX, segY, radius, 0, Math.PI * 2); c.fill(); c.stroke();
                if (m.flashTimer === 0) {
                    c.fillStyle = m.isRare ? "#ffffff" : "#ff3300"; c.beginPath(); c.arc(segX, segY, radius * 0.45, 0, Math.PI * 2); c.fill();
                    c.fillStyle = "#2c110c"; c.beginPath(); c.moveTo(segX + 1, segY - radius); c.lineTo(segX - 3, segY - radius - 5); c.lineTo(segX - 4, segY - radius); c.closePath(); c.fill(); c.stroke();
                }
            }
            c.fillStyle = m.flashTimer > 0 ? "#ffffff" : (m.isRare ? "#ff4500" : "#110200");
            let hX = cx - 8; let hY = cy + Math.sin(time) * 6;
            c.beginPath(); c.moveTo(hX + 10, hY - 10); c.lineTo(hX - 12, hY - 8); c.lineTo(hX - 14, hY + 2); c.lineTo(hX + 10, hY + 11); c.closePath(); c.fill(); c.stroke();
            if (m.flashTimer === 0) {
                c.fillStyle = "#e67e22"; c.beginPath(); c.moveTo(hX + 4, hY - 9); c.quadraticCurveTo(hX + 12, hY - 18, hX + 16, hY - 16); c.lineTo(hX + 6, hY - 4); c.closePath(); c.fill(); c.stroke();
                c.fillStyle = "#f1c40f"; c.beginPath(); c.arc(hX - 3, hY - 2, 2, 0, Math.PI * 2); c.fill();
            }
        }
        else if (vType === "hell_bat") {
            let cx = m.x + m.w / 2; let cy = m.y + m.h / 2 + Math.sin(Date.now() / 110) * 3; let batWing = Math.sin(Date.now() / 70) * 11;
            c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#1e1f26"; c.beginPath(); c.ellipse(cx, cy, 7, 11, 0, 0, Math.PI*2); c.fill(); c.stroke();
            c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#962d22"; c.beginPath(); c.moveTo(cx - 5, cy - 2); c.quadraticCurveTo(cx - 18, cy - 12 - batWing, cx - 22, cy - 5 - batWing); c.quadraticCurveTo(cx - 12, cy, cx - 5, cy - 2); c.moveTo(cx + 5, cy - 2); c.quadraticCurveTo(cx + 18, cy - 12 - batWing, cx + 22, cy - 5 - batWing); c.quadraticCurveTo(cx + 12, cy, cx + 5, cy - 2); c.closePath(); c.fill(); c.stroke();
            if (m.flashTimer === 0) { c.fillStyle = "#ff6b6b"; c.beginPath(); c.arc(cx - 2, cy - 4, 1.5, 0, Math.PI * 2); c.arc(cx + 2, cy - 4, 1.5, 0, Math.PI * 2); c.fill(); }
        }
        else if (vType === "swamp_basilisk") {
            let cx = m.x + m.w / 2; let cy = m.y + m.h / 2 + 5; let time = Date.now() / 150;
            for (let i = 5; i >= 0; i--) {
                let segX = cx + (i * 10); let segY = cy + Math.sin(time - i * 0.8) * 6; let radius = 10.5 - (i * 1.1);
                c.fillStyle = m.flashTimer > 0 ? "#ffffff" : (m.isRare ? "#00b894" : "#1a3a22"); c.beginPath(); c.arc(segX, segY, radius, 0, Math.PI * 2); c.fill(); c.stroke();
                if (m.flashTimer === 0) { c.fillStyle = m.isRare ? "#ff007f" : "#9b59b6"; c.beginPath(); c.moveTo(segX + 2, segY - radius); c.lineTo(segX - 2, segY - radius - 6); c.lineTo(segX - 4, segY - radius); c.closePath(); c.fill(); c.stroke(); }
            }
            c.fillStyle = m.flashTimer > 0 ? "#ffffff" : (m.isRare ? "#00b894" : "#122c19");
            let hX = cx - 8; let hY = cy + Math.sin(time) * 6; c.beginPath(); c.moveTo(hX + 11, hY - 11); c.lineTo(hX - 13, hY - 5); c.lineTo(hX - 11, hY + 6); c.lineTo(hX + 11, hY + 11); c.closePath(); c.fill(); c.stroke();
            if (m.flashTimer === 0) {
                c.fillStyle = "#ffffff"; c.beginPath(); c.moveTo(hX - 10, hY - 1); c.lineTo(hX - 13, hY + 4); c.lineTo(hX - 7, hY + 2); c.closePath(); c.fill();
                c.fillStyle = "#f1c40f"; c.beginPath(); c.arc(hX - 3, hY - 3, 2, 0, Math.PI * 2); c.fill();
            }
        }
        else if (vType === "toxic_fly") {
            let cx = m.x + m.w / 2; let cy = m.y + m.h / 2 + Math.sin(Date.now() / 110) * 4; let wing = Math.sin(Date.now() / 60) * 11;
            c.fillStyle = "rgba(46, 204, 113, 0.4)"; c.beginPath(); c.ellipse(cx - 7, cy - 4, 5, 12 + wing, -Math.PI / 4, 0, Math.PI * 2); c.ellipse(cx + 7, cy - 4, 5, 12 + wing, Math.PI / 4, 0, Math.PI * 2); c.fill(); c.stroke();
            c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#2c3e50"; c.beginPath(); c.arc(cx, cy, 6, 0, Math.PI * 2); c.fill(); c.stroke();
            c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#2ecc71"; c.beginPath(); c.ellipse(cx, cy + 9, 5, 7, 0, 0, Math.PI * 2); c.fill(); c.stroke();
        }
        else if (vType === "void_orb") {
            let hover = Math.sin(Date.now() / 150) * 4; let cx = m.x + m.w / 2; let cy = m.y + m.h / 2 + hover;
            c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#0d011a"; c.beginPath(); c.arc(cx, cy, 14, 0, Math.PI * 2); c.fill(); c.stroke();
            if (m.flashTimer === 0) { c.strokeStyle = "#8e44ad"; c.lineWidth = 1.8; c.save(); c.translate(cx, cy); c.rotate(Date.now() / 800); c.beginPath(); c.ellipse(0, 0, 22, 6, 0, 0, Math.PI * 2); c.stroke(); c.restore(); }
        }
        else if (vType === "void_crawler") {
            let cx = m.x + m.w / 2; let cy = m.y + m.h / 2 + 5; let time = Date.now() / 150;
            c.strokeStyle = "#000000"; c.lineWidth = 1.8;
            for (let i = 0; i < 6; i++) { let segX = cx + (i * 9); let segY = cy + Math.sin(time - i * 0.7) * 5.5; c.beginPath(); c.moveTo(segX, segY + 2); c.lineTo(segX - 5, segY + 14 + Math.sin(time * 3.5 + i) * 4); c.stroke(); }
            for (let i = 6; i >= 0; i--) {
                let segX = cx + (i * 9); let segY = cy + Math.sin(time - i * 0.7) * 5.5; let radius = 10 - (i * 1.1);
                c.fillStyle = m.flashTimer > 0 ? "#ffffff" : (m.isRare ? "#ff007f" : "#1a022b"); c.beginPath(); c.arc(segX, segY, radius, 0, Math.PI * 2); c.fill(); c.stroke();
                if (m.flashTimer === 0) { c.strokeStyle = "#8e44ad"; c.lineWidth = 1.5; c.beginPath(); c.moveTo(segX - 2, segY - radius + 3); c.lineTo(segX + 2, segY - radius + 3); c.stroke(); }
            }
            c.fillStyle = m.flashTimer > 0 ? "#ffffff" : (m.isRare ? "#ff007f" : "#11001c"); let hX = cx - 8; let hY = cy + Math.sin(time) * 5.5; c.beginPath(); c.arc(hX, hY, 10.5, 0, Math.PI * 2); c.fill(); c.stroke();
            if (m.flashTimer === 0) {
                c.strokeStyle = "#8e44ad"; c.lineWidth = 1.8; c.beginPath(); c.moveTo(hX - 4, hY - 6); c.quadraticCurveTo(hX - 15, hY - 14 + Math.sin(time * 3) * 4, hX - 22, hY - 10 + Math.sin(time * 3) * 4); c.stroke();
                c.fillStyle = "#ff007f"; c.beginPath(); c.arc(hX - 5, hY - 3, 1.5, 0, Math.PI * 2); c.arc(hX - 2, hY - 1, 1.2, 0, Math.PI * 2); c.arc(hX - 5, hY + 1, 1.2, 0, Math.PI * 2); c.fill();
            }
        }
        else if (vType === "clockwork_scarab") {
            let cx = m.x + m.w / 2; let cy = m.y + m.h / 2 + Math.sin(Date.now() / 100) * 3;
            c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#dca04c"; c.beginPath(); c.ellipse(cx, cy, 12, 9, 0, 0, Math.PI * 2); c.fill(); c.stroke();
            if (m.flashTimer === 0) {
                c.strokeStyle = "#4d2e1a"; c.lineWidth = 1.2; c.beginPath(); c.moveTo(cx, cy - 9); c.lineTo(cx, cy + 9); c.stroke();
                c.save(); c.translate(cx, cy); c.rotate((Date.now() / 1500) % (Math.PI * 2)); c.fillStyle = "#f1c40f"; c.beginPath(); c.arc(0, 0, 4, 0, Math.PI * 2); c.fill(); c.stroke(); c.restore();
            }
            c.strokeStyle = "#7a5c1f"; c.lineWidth = 1.8;
            for (let i = -1; i <= 1; i += 2) {
                let legSwing = Math.sin(Date.now() / 80 + i) * 3;
                c.beginPath(); c.moveTo(cx + 6 * i, cy); c.lineTo(cx + (14 * i) + legSwing, cy + 6); c.stroke();
                c.beginPath(); c.moveTo(cx + 6 * i, cy - 4); c.lineTo(cx + (15 * i) + legSwing, cy - 6); c.stroke();
            }
        }
        else if (vType === "neon_spider") {
            let cx = m.x + m.w / 2; let cy = m.y + m.h / 2;
            c.strokeStyle = m.flashTimer > 0 ? "#ffffff" : "#ff007f"; c.lineWidth = 2.0; c.beginPath(); c.arc(cx, cy, 6, 0, Math.PI * 2); c.stroke();
            for (let i = 0; i < 4; i++) {
                let side = i % 2 === 0 ? -1 : 1; let yDir = i < 2 ? -1 : 1;
                c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx + 12 * side, cy + 4 * yDir); c.lineTo(cx + 16 * side, cy + 14 * yDir); c.stroke();
            }
        }
        else if (vType === "wireframe_orb") {
            let cx = m.x + m.w / 2; let cy = m.y + m.h / 2;
            c.strokeStyle = m.flashTimer > 0 ? "#ffffff" : "#3498db"; c.lineWidth = 1.5; c.save(); c.translate(cx, cy); c.rotate(Date.now() / 600); c.strokeRect(-10, -10, 20, 20); c.restore();
        }

        if (m.isRare) {
            c.save(); let glowTime = Date.now() / 200; let hx = m.x + m.w / 2; let hy = m.y - 10 + Math.sin(glowTime) * 2.5;
            c.strokeStyle = "#f1c40f"; c.lineWidth = 1.8; c.beginPath(); c.ellipse(hx, hy, 11, 3.2, 0, 0, Math.PI * 2); c.stroke();
            c.fillStyle = "#ffffff";
            for (let i = 0; i < 3; i++) {
                let sparkAngle = glowTime + i * (Math.PI * 2 / 3); let sx = hx + Math.cos(sparkAngle) * 11; let sy = hy + Math.sin(sparkAngle) * 3.2;
                c.fillRect(sx - 1.2, sy - 1.2, 2.4, 2.4);
            }
            c.restore();
        }
    }
    else if (m.type === "rift_guardian" || m.type === "aegis_goliath") {
        let hover = Math.sin(Date.now() / 150) * 8; let cx = m.x + m.w / 2; let cy = m.y + m.h / 2 + hover;
        c.save(); c.translate(cx, cy);
        for (let i = 0; i < 3; i++) {
            let pulseScale = 1.0 + Math.sin(Date.now() / 250 + i * 2) * 0.12; let rot = (Date.now() / 1200) + (i * Math.PI / 3); let size = 45 * pulseScale;
            c.save(); c.rotate(rot); c.strokeStyle = m.flashTimer > 0 ? "#ffffff" : "rgba(52, 152, 219, 0.45)"; c.lineWidth = 1.5; c.beginPath();
            for (let side = 0; side < 6; side++) { let angle = (side * Math.PI) / 3; c.lineTo(Math.cos(angle) * size, Math.sin(angle) * size); }
            c.closePath(); c.stroke(); c.restore();
        }
        c.save(); c.strokeStyle = "#2c3e50"; c.lineWidth = 2.5;
        for (let i = -1; i <= 1; i += 2) {
            let chainSway = Math.sin(Date.now() / 300 + i * 1.5) * 4;
            c.beginPath(); c.moveTo(i * 20, -50); c.quadraticCurveTo(i * 25, 0, i * 15 + chainSway, 30); c.stroke();
        }
        c.restore();
        c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#1a1c23"; c.strokeStyle = "#000000"; c.lineWidth = 2.4;
        c.beginPath(); c.moveTo(0, -18); c.lineTo(16, -18); c.lineTo(22, -4); c.lineTo(0, 24); c.lineTo(-22, -4); c.lineTo(-16, -18); c.closePath(); c.fill(); c.stroke();
        if (m.flashTimer === 0) {
            let pulseRad = 6 + Math.sin(Date.now() / 100) * 1.5; let runicGlow = c.createRadialGradient(0, -2, 1, 0, -2, pulseRad + 8);
            runicGlow.addColorStop(0, "#ffffff"); runicGlow.addColorStop(0.3, "#2ecc71"); runicGlow.addColorStop(0.8, "#3498db"); runicGlow.addColorStop(1, "rgba(0,0,0,0)");
            c.fillStyle = runicGlow; c.beginPath(); c.arc(0, -2, pulseRad + 8, 0, Math.PI * 2); c.fill();
            c.strokeStyle = "#ffffff"; c.lineWidth = 2; c.beginPath(); c.moveTo(0, -10); c.lineTo(0, 6); c.moveTo(-7, -2); c.lineTo(7, -2); c.stroke();
        }
        for (let i = 0; i < 3; i++) {
            let angle = (Date.now() / 300) + (i * Math.PI * 2 / 3); let px = Math.cos(angle) * 35; let py = Math.sin(angle) * 12;
            c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#34495e"; c.strokeStyle = "#000000"; c.lineWidth = 1.5;
            c.beginPath(); c.roundRect(px - 5, py - 7, 10, 14, [2]); c.fill(); c.stroke();
            if (m.flashTimer === 0) { c.fillStyle = "#2ecc71"; c.beginPath(); c.arc(px, py, 1.8, 0, Math.PI * 2); c.fill(); }
        }
        c.restore();
    }
    else if (m.type === "chronos_arbitrator") {
        let hover = Math.sin(Date.now() / 200) * 8; let cx = m.x + m.w / 2; let cy = m.y + m.h / 2 + hover;
        c.save(); c.translate(cx, cy);
        let drawVectorGear = (ctx, x, y, radius, teeth, rot, color) => {
            ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.fillStyle = m.flashTimer > 0 ? "#ffffff" : color; ctx.strokeStyle = "#000000"; ctx.lineWidth = 2.0;
            ctx.beginPath(); ctx.arc(0, 0, radius - 4, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
            for (let i = 0; i < teeth; i++) {
                let teethAngle = (i * Math.PI * 2) / teeth; ctx.save(); ctx.rotate(teethAngle); ctx.beginPath(); ctx.rect(-3, -radius - 3, 6, 8); ctx.fill(); ctx.stroke(); ctx.restore();
            }
            ctx.fillStyle = "#111116"; ctx.beginPath(); ctx.arc(0, 0, radius * 0.35, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
            ctx.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#f1c40f";
            for (let i = 0; i < 4; i++) { let angle = (i * Math.PI) / 2; ctx.beginPath(); ctx.arc(Math.cos(angle) * (radius * 0.6), Math.sin(angle) * (radius * 0.6), 2, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }
            ctx.restore();
        };
        drawVectorGear(c, -35, -28, 22, 10, -((Date.now() / 400) % (Math.PI * 2)), "#7f8c8d");
        drawVectorGear(c, 38, 24, 25, 12, ((Date.now() / 500) % (Math.PI * 2)) + 0.5, "#d35400");
        drawVectorGear(c, 0, 0, 44, 16, (Date.now() / 1500) % (Math.PI * 2), "#f1c40f");
        c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#fdf6e2"; c.strokeStyle = "#000000"; c.lineWidth = 2.4;
        c.beginPath(); c.moveTo(0, -25); c.quadraticCurveTo(-20, -20, -20, 0); c.lineTo(-12, 28); c.lineTo(12, 28); c.lineTo(20, 0); c.quadraticCurveTo(20, -20, 0, -25); c.closePath(); c.fill(); c.stroke();
        if (m.flashTimer === 0) {
            c.strokeStyle = "#1a0f02"; c.lineWidth = 1.5; c.beginPath(); c.moveTo(-10, -10); c.lineTo(-4, -4); c.lineTo(-8, 2); c.moveTo(10, -8); c.lineTo(6, -2); c.stroke();
            c.fillStyle = "#ffffff"; c.shadowBlur = 8; c.shadowColor = "#f1c40f"; c.beginPath(); c.arc(-6, -5, 3, 0, Math.PI * 2); c.arc(6, -5, 3, 0, Math.PI * 2); c.fill(); c.shadowBlur = 0;
        }
        c.strokeStyle = "#111116"; c.lineWidth = 2.5; c.lineCap = "round"; let hrAngle = Date.now() / 10000; c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(hrAngle) * 15, Math.sin(hrAngle) * 15); c.stroke();
        let minAngle = Date.now() / 1800; c.strokeStyle = "#d35400"; c.lineWidth = 1.8; c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(minAngle) * 24, Math.sin(minAngle) * 24); c.stroke();
        c.restore();
    }
    else if (m.type === "nexus_overseer") {
        let cx = m.x + m.w / 2; let cy = m.y + m.h / 2;
        let isGlitchedFrame = (Math.sin(Date.now() / 10) > 0.85);
        let px = cx + (isGlitchedFrame ? window.randFloat(-4, 4) : 0); let py = cy + (isGlitchedFrame ? window.randFloat(-3, 3) : 0);
        c.save(); c.translate(px, py); c.rotate(Date.now() / 800); c.strokeStyle = m.flashTimer > 0 ? "#ffffff" : "#ff007f"; c.lineWidth = 2.0;
        let cycle = Math.floor(Date.now() / 5000) % 3;
        if (cycle === 0) {
            c.strokeRect(-18, -18, 36, 36); c.strokeRect(-12, -12, 24, 24);
            c.beginPath(); c.moveTo(-18, -18); c.lineTo(-12, -12); c.moveTo(18, -18); c.lineTo(12, -12); c.moveTo(-18, 18); c.lineTo(-12, 12); c.moveTo(18, 18); c.lineTo(12, 12); c.stroke();
        } else if (cycle === 1) {
            c.beginPath(); c.moveTo(0, -22); c.lineTo(-18, 14); c.lineTo(18, 14); c.closePath(); c.moveTo(0, -22); c.lineTo(0, 18); c.lineTo(-18, 14); c.moveTo(0, 18); c.lineTo(18, 14); c.stroke();
        } else {
            c.beginPath(); for (let i = 0; i < 5; i++) { let angle = (i * Math.PI * 2) / 5; c.lineTo(Math.cos(angle) * 22, Math.sin(angle) * 22); } c.closePath(); c.stroke();
        }
        if (m.flashTimer === 0) {
            let eyePulse = 6 + Math.sin(Date.now() / 150) * 1.5; c.fillStyle = "#00b894"; c.beginPath(); c.arc(0, 0, eyePulse, 0, Math.PI * 2); c.fill(); c.strokeStyle = "#000000"; c.lineWidth = 1.5; c.stroke();
            c.fillStyle = "#ff007f"; c.fillRect(-1.2, -4, 2.4, 8);
        }
        c.restore();
    }
    else if (m.type === "dungeon_boss") {
            let bounce = 0; let coreColor = "#9b59b6"; let glowColor = "#e84393"; let shadowColor = "#1a052e";
            if (m.isCrucible) {
                bounce = Math.sin(Date.now() / 150) * 4; coreColor = m.flashTimer > 0 ? "#ffffff" : "#9b59b6";

                // Core Astral Matrix rings
                c.strokeStyle = glowColor; c.lineWidth = 1.8; c.save(); c.translate(m.x + m.w / 2, m.y + m.h / 2 + bounce); c.rotate(Date.now() / 700); c.beginPath(); c.ellipse(0, 0, m.w * 0.8, m.h * 0.18, 0, 0, Math.PI * 2); c.stroke(); c.restore();
                c.strokeStyle = "#9b59b6"; c.save(); c.translate(m.x + m.w / 2, m.y + m.h / 2 + bounce); c.rotate(-Date.now() / 500); c.beginPath(); c.ellipse(0, 0, m.w * 0.6, m.h * 0.22, 0, 0, Math.PI * 2); c.stroke(); c.restore();

                c.fillStyle = shadowColor; c.beginPath(); c.moveTo(m.x + m.w / 2, m.y + bounce); c.lineTo(m.x + m.w, m.y + m.h * 0.4 + bounce); c.lineTo(m.x + m.w * 0.8, m.y + m.h * 0.95 + bounce); c.lineTo(m.x + m.w * 0.2, m.y + m.h * 0.95 + bounce); c.lineTo(m.x, m.y + m.h * 0.4 + bounce); c.closePath(); c.fill(); c.strokeStyle = "#000000"; c.lineWidth = 2.4; c.stroke();
                if (m.flashTimer === 0) {
                    let coreRadius = 8 + Math.sin(Date.now() / 100) * 3; c.fillStyle = coreColor; c.shadowBlur = 12; c.shadowColor = coreColor; c.beginPath(); c.arc(m.x + m.w / 2, m.y + m.h / 2 - 10 + bounce, coreRadius, 0, Math.PI * 2); c.fill(); c.stroke(); c.shadowBlur = 0;
                    c.fillStyle = "#ffffff"; c.beginPath(); c.arc(m.x + m.w / 2, m.y + m.h / 2 - 10 + bounce, 3, 0, Math.PI * 2); c.fill();
                }
                c.fillStyle = "#2c3e50"; c.beginPath(); c.moveTo(m.x + m.w * 0.3, m.y + bounce); c.quadraticCurveTo(m.x + m.w * 0.1, m.y - 15 + bounce, m.x + m.w * 0.05, m.y - 20 + bounce); c.lineTo(m.x + m.w * 0.4, m.y - 5 + bounce); c.closePath(); c.fill(); c.stroke();
                                c.beginPath(); c.moveTo(m.x + m.w * 0.7, m.y + bounce); c.quadraticCurveTo(m.x + m.w * 0.9, m.y - 15 + bounce, m.x + m.w * 0.95, m.y - 20 + bounce); c.lineTo(m.x + m.w * 0.6, m.y - 5 + bounce); c.closePath(); c.fill(); c.stroke();
                            } else {
                                let dType = window.playerStats.currentDungeon || 'gold';
                                if (dType === 'gold') {
                                    let bx = m.x;
                                    let by = m.y;
                                    let bw = m.w;
                                    let bh = m.h;
                                    let cy = by + bh - 5;

                                    let coinRows = [
                                        { y: cy, count: 9, size: 10, shift: 0 },
                                        { y: cy - 5, count: 7, size: 9, shift: 6 },
                                        { y: cy - 10, count: 5, size: 9, shift: 12 },
                                        { y: cy - 15, count: 3, size: 8, shift: 18 }
                                    ];

                                    coinRows.forEach(row => {
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
                                            c.beginPath(); c.ellipse(0, 0, scaleW + 0.8, scaleH + 0.8, 0, 0, Math.PI * 2); c.fill(); c.stroke();

                                            if (m.flashTimer === 0) {
                                                let goldGrad = c.createLinearGradient(-scaleW, -scaleH, scaleW, scaleH);
                                                goldGrad.addColorStop(0, "#fff1a8");
                                                goldGrad.addColorStop(0.5, "#ffd700");
                                                goldGrad.addColorStop(1, "#b58700");
                                                c.fillStyle = goldGrad;
                                                c.beginPath(); c.ellipse(0, 0, scaleW, scaleH, 0, 0, Math.PI * 2); c.fill();

                                                c.strokeStyle = "#805c00"; c.lineWidth = 0.8;
                                                c.beginPath(); c.ellipse(0, 0, scaleW * 0.78, scaleH * 0.78, 0, 0, Math.PI * 2); c.stroke();

                                                c.fillStyle = "rgba(255, 255, 255, 0.85)";
                                                c.beginPath(); c.ellipse(-scaleW * 0.35, -scaleH * 0.35, scaleW * 0.22, scaleH * 0.18, Math.PI / 4, 0, Math.PI * 2); c.fill();
                                            }
                                            c.restore();
                                        }
                                    });

                                    let hover = Math.sin(Date.now() / 150) * 4;
                                    let idolX = bx + bw / 2;
                                    let idolY = cy - 28 + hover;

                                    c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#424949";
                                    c.strokeStyle = "#000000"; c.lineWidth = 2.4;
                                    let wingSwing = Math.sin(Date.now() / 100) * 0.18;

                                    c.save();
                                    c.translate(idolX - 10, idolY - 10);
                                    c.rotate(-Math.PI / 6 - wingSwing);
                                    c.beginPath();
                                    c.moveTo(0, 0); c.lineTo(-45, -20); c.lineTo(-30, 10); c.lineTo(-40, 25); c.lineTo(-10, 15);
                                    c.closePath(); c.fill(); c.stroke();
                                    if (m.flashTimer === 0) {
                                        c.fillStyle = "#ffd700";
                                        c.beginPath();
                                        c.moveTo(-15, -6); c.lineTo(-40, -18); c.lineTo(-30, 2); c.closePath(); c.fill(); c.stroke();
                                    }
                                    c.restore();

                                    c.save();
                                    c.translate(idolX + 10, idolY - 10);
                                    c.rotate(Math.PI / 6 + wingSwing);
                                    c.beginPath();
                                    c.moveTo(0, 0); c.lineTo(45, -20); c.lineTo(30, 10); c.lineTo(40, 25); c.lineTo(10, 15);
                                    c.closePath(); c.fill(); c.stroke();
                                    if (m.flashTimer === 0) {
                                        c.fillStyle = "#ffd700";
                                        c.beginPath();
                                        c.moveTo(15, -6); c.lineTo(40, -18); c.lineTo(30, 2); c.closePath(); c.fill(); c.stroke();
                                    }
                                    c.restore();

                                    c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#5d6d7e";
                                    c.beginPath(); c.ellipse(idolX, idolY + 12, 16, 24, 0, 0, Math.PI * 2); c.fill(); c.stroke();

                                    if (m.flashTimer === 0) {
                                        c.fillStyle = "#ffd700";
                                        c.beginPath(); c.arc(idolX, idolY + 10, 6, 0, Math.PI * 2); c.fill(); c.stroke();
                                        c.fillStyle = "#e67e22";
                                        c.beginPath(); c.arc(idolX, idolY + 10, 2.5, 0, Math.PI * 2); c.fill(); c.stroke();
                                    }

                                    c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#4d5656";
                                    c.beginPath(); c.arc(idolX, idolY - 14, 12, 0, Math.PI * 2); c.fill(); c.stroke();

                                    c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#ffd700";
                                    c.beginPath();
                                    c.moveTo(idolX - 8, idolY - 22);
                                    c.quadraticCurveTo(idolX - 22, idolY - 34, idolX - 25, idolY - 28);
                                    c.quadraticCurveTo(idolX - 16, idolY - 18, idolX - 10, idolY - 18);
                                    c.closePath(); c.fill(); c.stroke();

                                    c.beginPath();
                                    c.moveTo(idolX + 8, idolY - 22);
                                    c.quadraticCurveTo(idolX + 22, idolY - 34, idolX + 25, idolY - 28);
                                    c.quadraticCurveTo(idolX + 16, idolY - 18, idolX + 10, idolY - 18);
                                    c.closePath(); c.fill(); c.stroke();

                                    if (m.flashTimer === 0) {
                                        c.fillStyle = "#ff2200"; c.shadowBlur = 6; c.shadowColor = "#ff2200";
                                        c.beginPath(); c.arc(idolX - 4, idolY - 14, 2, 0, Math.PI * 2); c.arc(idolX + 4, idolY - 14, 2, 0, Math.PI * 2); c.fill();
                                        c.shadowBlur = 0;
                                    }

                                    if (!window.isGamePaused && Math.random() < 0.15 && window.particles.length < 250) {
                                        window.particles.push({
                                            x: idolX, y: idolY - 8,
                                            vx: -window.randFloat(2, 4), vy: window.randFloat(-1, 1),
                                            radius: window.randFloat(2, 4), color: "#ff5500", alpha: 0.9, life: window.randInt(25, 45)
                                        });
                                        window.particles.push({
                                            x: idolX, y: idolY - 8,
                                            vx: -window.randFloat(1.5, 3.5), vy: window.randFloat(-0.8, 0.8),
                                            radius: window.randFloat(1.5, 3), color: "#f1c40f", alpha: 0.9, life: window.randInt(20, 35)
                                        });
                                    }
                                } else if (dType === 'mat') {
                                    let bx = m.x;
                                    let by = m.y;
                                    let bw = m.w;
                                    let bh = m.h;
                                    let cx = bx + bw / 2;
                                    let cy = by + bh - 10;
                                    let time = Date.now();

                                    c.save();
                                    c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "rgba(39, 174, 96, 0.4)";
                                    c.beginPath(); c.ellipse(cx, cy, bw * 0.75, 12, 0, 0, Math.PI * 2); c.fill(); c.stroke();

                                    let wpRot = (time / 180) % (Math.PI * 2);
                                    c.strokeStyle = "rgba(46, 204, 113, 0.8)"; c.lineWidth = 1.8;
                                    c.save(); c.translate(cx, cy); c.rotate(wpRot);
                                    c.beginPath(); c.ellipse(0, 0, bw * 0.6, 6, 0, 0, Math.PI * 2); c.stroke(); c.restore();
                                    c.save(); c.translate(cx, cy); c.rotate(-wpRot * 1.5);
                                    c.beginPath(); c.ellipse(0, 0, bw * 0.4, 4, 0, 0, Math.PI * 2); c.stroke(); c.restore();
                                    c.restore();

                                    let pulseHeight = Math.sin(time / 120) * 5;
                                    let vortexTopY = by + 20 + pulseHeight;
                                    let vortexWidth = bw * 0.6;

                                    let vortexGrad = c.createLinearGradient(cx - vortexWidth/2, by, cx + vortexWidth/2, cy);
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
                                    c.quadraticCurveTo(cx - vortexWidth * 0.75, (cy + vortexTopY) / 2, cx - vortexWidth * 0.5, vortexTopY);
                                    c.bezierCurveTo(cx - vortexWidth * 0.2, vortexTopY - 12, cx + vortexWidth * 0.2, vortexTopY - 12, cx + vortexWidth * 0.5, vortexTopY);
                                    c.quadraticCurveTo(cx + vortexWidth * 0.75, (cy + vortexTopY) / 2, cx + vortexWidth * 0.4, cy);
                                    c.closePath(); c.fill(); c.stroke();

                                    c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#27ae60";
                                    for (let i = -1; i <= 1; i += 2) {
                                        let sway = Math.sin(time / 140 + i * 2) * 8;
                                        let pX = cx + (i * vortexWidth * 0.4);
                                        let pY = cy - 22;

                                        c.beginPath();
                                        c.moveTo(pX, pY);
                                        c.quadraticCurveTo(pX + (i * 22) + sway, pY - 15 + sway/2, pX + (i * 35) + sway, pY + 4 + sway);
                                        c.quadraticCurveTo(pX + (i * 22) + sway, pY - 5 + sway/2, pX, pY + 8);
                                        c.closePath(); c.fill(); c.stroke();
                                    }

                                    if (m.flashTimer === 0) {
                                        c.fillStyle = "#ffffff";
                                        c.beginPath(); c.arc(cx, vortexTopY + 14, 8, 0, Math.PI * 2); c.fill(); c.stroke();
                                        c.fillStyle = "#9b59b6";
                                        c.beginPath(); c.arc(cx, vortexTopY + 14, 3.5, 0, Math.PI * 2); c.fill(); c.stroke();
                                        c.fillStyle = "#000000";
                                        c.beginPath(); c.arc(cx - 0.5, vortexTopY + 14, 1.5, 0, Math.PI * 2); c.fill();

                                        let eyeOffsets = [
                                            { dx: -12, dy: 30, r: 4, color: "#e74c3c" },
                                            { dx: 14, dy: 24, r: 5, color: "#f1c40f" },
                                            { dx: -6, dy: 44, r: 3, color: "#3498db" }
                                        ];
                                        eyeOffsets.forEach(eye => {
                                            let ex = cx + eye.dx;
                                            let ey = vortexTopY + eye.dy;
                                            c.fillStyle = "#ffffff";
                                            c.beginPath(); c.arc(ex, ey, eye.r, 0, Math.PI * 2); c.fill(); c.stroke();
                                            c.fillStyle = eye.color;
                                            c.beginPath(); c.arc(ex, ey, eye.r * 0.5, 0, Math.PI * 2); c.fill(); c.stroke();
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
                                        c.beginPath(); c.ellipse(cx - 8, vortexTopY + 15 + dropProgress, 1.5, 3, 0, 0, Math.PI * 2); c.fill();
                                        let dropProgress2 = (time / 8 + 15) % 40;
                                        c.fillStyle = "#7bed9f";
                                        c.beginPath(); c.ellipse(cx + 10, vortexTopY + 10 + dropProgress2, 1.2, 2.5, 0, 0, Math.PI * 2); c.fill();
                                    }
                                } else if (dType === 'equip') {
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
                                        let angle = shardOrbitAngle + (i * Math.PI * 2 / shardCount);
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
                                            c.moveTo(0, -10); c.lineTo(2.5, 2); c.lineTo(1, 10); c.lineTo(-1, 10); c.lineTo(-2.5, 2);
                                            c.closePath(); c.fill(); c.stroke();
                                        } else {
                                            c.beginPath();
                                            c.moveTo(-5, -6); c.lineTo(5, -6); c.lineTo(4, 2); c.lineTo(0, 8); c.lineTo(-4, 2);
                                            c.closePath(); c.fill(); c.stroke();
                                        }
                                        c.restore();
                                    }
                                    c.restore();

                                    let suitY = cy - 8 + hover;
                                    c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#2c3e50";
                                    c.strokeStyle = "#000000"; c.lineWidth = 2.4;

                                    c.beginPath();
                                    c.roundRect(cx - 26, suitY - 14, 11, 11, [3]);
                                    c.roundRect(cx + 15, suitY - 14, 11, 11, [3]);
                                    c.fill(); c.stroke();

                                    c.beginPath();
                                    c.moveTo(cx - 15, suitY - 8);
                                    c.lineTo(cx + 15, suitY - 8);
                                    c.lineTo(cx + 12, suitY + 18);
                                    c.lineTo(cx, suitY + 28);
                                    c.lineTo(cx - 12, suitY + 18);
                                    c.closePath(); c.fill(); c.stroke();

                                    if (m.flashTimer === 0) {
                                        let corePulse = 4 + Math.sin(time / 80) * 1.5;
                                        let furnaceGrad = c.createRadialGradient(cx, suitY + 4, 1, cx, suitY + 4, corePulse + 6);
                                        furnaceGrad.addColorStop(0, "#ffffff");
                                        furnaceGrad.addColorStop(0.4, "#e67e22");
                                        furnaceGrad.addColorStop(1, "rgba(211, 84, 0, 0)");
                                        c.fillStyle = furnaceGrad;
                                        c.beginPath(); c.arc(cx, suitY + 4, corePulse + 6, 0, Math.PI * 2); c.fill();

                                        c.strokeStyle = "#1a252f"; c.lineWidth = 2.0;
                                        c.beginPath();
                                        c.moveTo(cx - 6, suitY + 4); c.lineTo(cx + 6, suitY + 4);
                                        c.moveTo(cx, suitY - 2); c.lineTo(cx, suitY + 10);
                                        c.stroke();
                                    }

                                    c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#1a252f";
                                    c.beginPath(); c.roundRect(cx - 9, suitY - 32, 18, 16, [4]); c.fill(); c.stroke();
                                    if (m.flashTimer === 0) {
                                        c.fillStyle = "#ff5500";
                                        c.beginPath(); c.rect(cx - 6, suitY - 25, 12, 2.5); c.fill();
                                    }

                                    c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#2c3e50";
                                    c.beginPath(); c.ellipse(cx - 22, suitY + 12, 4.5, 4.5, 0, 0, Math.PI * 2); c.fill(); c.stroke();

                                    c.strokeStyle = "#5d6d7e"; c.lineWidth = 3.0;
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
                                    c.closePath(); c.fill(); c.stroke();

                                    c.beginPath();
                                    c.moveTo(ax - 18, ay - 8);
                                    c.quadraticCurveTo(ax - 28, ay - 11, ax - 30, ay - 5);
                                    c.quadraticCurveTo(ax - 18, ay, ax - 18, ay + 2);
                                    c.closePath(); c.fill(); c.stroke();

                                    if (m.flashTimer === 0) {
                                        let heatGrad = c.createLinearGradient(ax - 20, ay - 7, ax + 15, ay - 2);
                                        heatGrad.addColorStop(0, "#ffeaa7");
                                        heatGrad.addColorStop(0.5, "#d35400");
                                        heatGrad.addColorStop(1, "rgba(27, 29, 34, 0)");
                                        c.fillStyle = heatGrad;
                                        c.beginPath(); c.rect(ax - 15, ay - 7, 28, 4); c.fill();
                                    }
                                }
                            }
        }
    else if (m.type === "prestige_boss") {
        let hoverY = Math.sin(Date.now() / 150) * 6; let jawOpen = Math.abs(Math.sin(Date.now() / 400)) * 12;
        c.save(); c.translate(m.x, m.y + hoverY);
        let baseW = 70; let baseH = 80; let scaleX = m.w / baseW; let scaleY = m.h / baseH; c.scale(scaleX, scaleY);

        let auraGlow = c.createRadialGradient(baseW/2, baseH/2, 10, baseW/2, baseH/2, 100);
        auraGlow.addColorStop(0, "rgba(231, 76, 60, 0.45)"); auraGlow.addColorStop(0.5, "rgba(142, 68, 173, 0.15)"); auraGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
        c.fillStyle = auraGlow; c.beginPath(); c.arc(baseW/2 + 30, baseH/2, 80, 0, Math.PI * 2); c.fill();

        for (let i = 6; i >= 1; i--) {
            let segX = baseW / 2 + (i * 18); let segY = baseH / 2 + Math.sin(Date.now() / 180 + i * 0.7) * 8;
            c.save(); c.fillStyle = i % 2 === 0 ? "#111116" : "#5a0e0e"; c.strokeStyle = "#000000"; c.lineWidth = 2.4 / Math.max(scaleX, scaleY);
            c.beginPath(); c.arc(segX, segY, 26 - (i * 2.2), 0, Math.PI * 2); c.fill(); c.stroke(); c.restore();

            if (!window.isGamePaused && Math.random() < 0.20 && window.particles.length < 200) {
                window.particles.push({
                    x: m.x + (segX * scaleX), y: m.y + hoverY + (segY * scaleY) - 30, vx: window.randFloat(-0.4, 0.2), vy: -window.randFloat(1.2, 2.2),
                    gravity: -0.06, radius: window.randFloat(3.0, 5.0), growth: 0.15,
                    color: "rgba(30, 30, 35, 0.65)", alpha: 0.75, fade: true, maxLife: 80, life: window.randInt(60, 80)
                });
            }
        }

        c.save(); c.fillStyle = "#d35400"; c.strokeStyle = "#000000"; c.lineWidth = 2.4 / Math.max(scaleX, scaleY); c.lineJoin = "round";
        c.beginPath(); c.moveTo(baseW - 25, -20); c.quadraticCurveTo(baseW + 5, -50, baseW + 22, -45); c.quadraticCurveTo(baseW - 3, -25, baseW - 30, -5); c.closePath(); c.fill(); c.stroke(); c.restore();

        c.save(); c.fillStyle = "#110202"; c.strokeStyle = "#e74c3c"; c.lineWidth = 3 / Math.max(scaleX, scaleY); c.lineJoin = "round";
        let wingFlap = Math.sin(Date.now() / 100) * 12; c.translate(baseW / 2 + 50, baseH / 2 + 10); c.rotate(wingFlap * Math.PI / 180);
        c.beginPath(); c.moveTo(0, 0); c.lineTo(50, -30); c.lineTo(60, 5); c.lineTo(40, 15); c.lineTo(55, 35); c.lineTo(5, 22); c.closePath(); c.fill(); c.stroke(); c.restore();

        c.save(); c.strokeStyle = "#000000"; c.lineWidth = 2.4 / Math.max(scaleX, scaleY); c.lineJoin = "round";
        c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#111115";
        c.beginPath(); c.moveTo(baseW - 5, -15); c.lineTo(baseW - 20, 10); c.lineTo(baseW - 15, -25); c.lineTo(baseW - 35, 12); c.lineTo(5, 5); c.lineTo(-10, 18); c.lineTo(-15, 30); c.lineTo(5, 38); c.lineTo(baseW - 10, 38); c.lineTo(baseW, 15); c.closePath(); c.fill(); c.stroke();

        if (m.flashTimer === 0) {
            c.fillStyle = "#ff0000"; c.beginPath(); c.ellipse(22, 18, 8, 6, Math.PI / 12, 0, Math.PI * 2); c.fill();
            c.fillStyle = "#f1c40f"; c.beginPath(); c.ellipse(22, 18, 2, 5, Math.PI / 12, 0, Math.PI * 2); c.fill();
        }

        c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#1c2833"; c.beginPath(); c.moveTo(-10, 18); c.lineTo(-26, 23); c.lineTo(-10, 28); c.closePath(); c.fill(); c.stroke();
        c.save(); c.translate(15, 38); c.rotate(-jawOpen * Math.PI / 180); c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#631c15";
        c.beginPath(); c.moveTo(0, 0); c.lineTo(-25, 4); c.lineTo(5, 15); c.lineTo(baseW - 15, 10); c.closePath(); c.fill(); c.stroke();
        c.fillStyle = "#ffeaa7"; c.beginPath(); c.moveTo(-15, 2); c.lineTo(-12, 9); c.lineTo(-9, 2); c.fill(); c.restore(); c.restore();

        c.save(); c.strokeStyle = "#000000"; c.lineWidth = 2.4 / Math.max(scaleX, scaleY); c.lineJoin = "round";
        let tailSwayTime = Date.now() / 150;
        for (let i = 1; i <= 6; i++) {
            let segmentSway = Math.sin(tailSwayTime - i * 0.4) * (i * 2.0);
            let segX = 100 + (i * 12) + segmentSway; let segY = 48 - (i * 4) + (i * i * 0.5); let r = 18 - (i * 2.0);
            c.fillStyle = i % 2 === 0 ? "#111116" : "#4a0a0a"; c.beginPath(); c.arc(segX, segY, r, 0, Math.PI * 2); c.fill(); c.stroke();
        }
        let tipSway = Math.sin(tailSwayTime - 6 * 0.4) * 12; let tipX = 100 + 72 + tipSway; let tipY = 48 - 24 + 18;
        c.fillStyle = "#d35400"; c.beginPath(); c.moveTo(tipX, tipY); c.quadraticCurveTo(tipX + 18, tipY - 8, tipX + 28, tipY - 22); c.quadraticCurveTo(tipX + 12, tipY - 14, tipX + 2, tipY - 4); c.closePath(); c.fill(); c.stroke();
        c.restore(); c.restore();
    }
    else {
            let currentTier = t !== undefined ? t : window.getStageTier();
            let bounce = 0;

            if (currentTier === 0) {
                // Background glow layer for Rare targets to immediately signify high-tier spawns
                if (m.isRare) {
                    c.save();
                    let auraPulse = 1 + Math.sin(Date.now() / 150) * 0.12;
                    let auraGrad = c.createRadialGradient(
                        m.x + m.w / 2, m.y + m.h / 2, 2,
                        m.x + m.w / 2, m.y + m.h / 2, Math.max(m.w, m.h) * 1.15 * auraPulse
                    );
                    auraGrad.addColorStop(0, "rgba(241, 196, 15, 0.45)");
                    auraGrad.addColorStop(0.6, "rgba(230, 126, 34, 0.18)");
                    auraGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
                    c.fillStyle = auraGrad;
                    c.beginPath();
                    c.arc(m.x + m.w / 2, m.y + m.h / 2, Math.max(m.w, m.h) * 1.15 * auraPulse, 0, Math.PI * 2);
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
                                    { dx: -6,  stretchX: -26, kneeY: -25, tipY: 10, col: legColorMid },
                                    { dx: 6,   stretchX: 26,  kneeY: -25, tipY: 10, col: legColorHighlight },
                                    { dx: 12,  stretchX: 36,  kneeY: -15, tipY: 10, col: legColorDark },
                                    { dx: -16, stretchX: -46, kneeY: -5,  tipY: 10, col: legColorDark },
                                    { dx: 16,  stretchX: 46,  kneeY: -5,  tipY: 10, col: legColorDark }
                                ];

                                legOffsets.forEach((leg, index) => {
                                    let legRootX = m.x + m.w / 2 + leg.dx;
                                    let kneeX = legRootX + leg.stretchX * 0.6;
                                    let kneeY = legYBase + leg.kneeY + Math.sin(Date.now() / 120 + index) * 3;
                                    let tipX = legRootX + leg.stretchX;
                                    let tipY = m.y + m.h + leg.tipY;

                                    c.fillStyle = leg.col;
                                    c.beginPath();
                                    c.moveTo(legRootX, legYBase);
                                    c.quadraticCurveTo(kneeX - 4 * Math.sign(leg.stretchX), kneeY - 4, kneeX, kneeY);
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
                                    c.moveTo(-4, 20); c.lineTo(4, 32);
                                    c.moveTo(4, 20); c.lineTo(-4, 32);
                                    c.stroke();
                                    c.restore();
                                }

                                // ==========================================
                                // 2. TWISTED ANCIENT TRUNK & STRIATIONS
                                // ==========================================
                                c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#462810";
                                c.beginPath();
                                c.moveTo(m.x + m.w * 0.32, m.y + m.h * 0.3); // Left shoulder
                                c.quadraticCurveTo(m.x + m.w * 0.20, m.y + m.h * 0.6, m.x + m.w * 0.12, m.y + m.h - 12); // Left flare
                                c.lineTo(m.x + m.w * 0.88, m.y + m.h - 12); // Right base flare
                                c.quadraticCurveTo(m.x + m.w * 0.80, m.y + m.h * 0.6, m.x + m.w * 0.68, m.y + m.h * 0.3); // Right shoulder
                                c.closePath(); c.fill(); c.stroke();

                                if (m.flashTimer === 0) {
                                    c.fillStyle = "#5d381b"; // Midtone wood plates
                                    c.beginPath();
                                    c.moveTo(m.x + m.w * 0.35, m.y + m.h * 0.35);
                                    c.bezierCurveTo(m.x + m.w * 0.25, m.y + m.h * 0.6, m.x + m.w * 0.3, m.y + m.h * 0.75, m.x + m.w * 0.22, m.y + m.h - 13);
                                    c.lineTo(m.x + m.w * 0.78, m.y + m.h - 13);
                                    c.bezierCurveTo(m.x + m.w * 0.7, m.y + m.h * 0.75, m.x + m.w * 0.75, m.y + m.h * 0.6, m.x + m.w * 0.65, m.y + m.h * 0.32);
                                    c.closePath(); c.fill(); c.stroke();

                                    c.strokeStyle = "#251205";
                                    c.lineWidth = 2.4;
                                    c.beginPath();
                                    c.moveTo(m.x + m.w * 0.44, m.y + m.h * 0.32);
                                    c.quadraticCurveTo(m.x + m.w * 0.38, m.y + m.h * 0.55, m.x + m.w * 0.42, m.y + m.h - 14);
                                    c.moveTo(m.x + m.w * 0.56, m.y + m.h * 0.32);
                                    c.quadraticCurveTo(m.x + m.w * 0.62, m.y + m.h * 0.58, m.x + m.w * 0.58, m.y + m.h - 14);
                                    c.moveTo(m.x + m.w * 0.25, m.y + m.h * 0.52);
                                    c.quadraticCurveTo(m.x + m.w * 0.18, m.y + m.h * 0.75, m.x + m.w * 0.26, m.y + m.h - 14);
                                    c.stroke();

                                    c.strokeStyle = "#1b7a43";
                                    c.lineWidth = 1.8;
                                    c.beginPath();
                                    c.moveTo(m.x + m.w * 0.28, m.y + m.h * 0.75);
                                    c.quadraticCurveTo(m.x + m.w * 0.5, m.y + m.h * 0.68, m.x + m.w * 0.72, m.y + m.h * 0.72);
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
                                    c.quadraticCurveTo(m.x + m.w * 0.3, m.y + m.h * 0.48, m.x + m.w * 0.24, m.y + m.h * 0.6);
                                    c.moveTo(m.x + m.w * 0.82, m.y + m.h * 0.45);
                                    c.quadraticCurveTo(m.x + m.w * 0.7, m.y + m.h * 0.48, m.x + m.w * 0.76, m.y + m.h * 0.6);
                                    c.stroke();
                                }

                                // ==========================================
                                // 4. CLAW BRACKETS (ARMS)
                                // ==========================================
                                let armColor = m.flashTimer > 0 ? "#ffffff" : "#462810";

                                c.fillStyle = armColor;
                                c.beginPath();
                                c.moveTo(m.x + m.w * 0.28, m.y + m.h * 0.32);
                                c.quadraticCurveTo(m.x - 22, m.y + m.h * 0.28, m.x - 28, m.y + m.h * 0.5); // Elbow joint
                                c.lineTo(m.x - 18, m.y + m.h * 0.52);
                                c.quadraticCurveTo(m.x - 8, m.y + m.h * 0.34, m.x + m.w * 0.28, m.y + m.h * 0.38);
                                c.closePath(); c.fill(); c.stroke();

                                c.beginPath();
                                c.moveTo(m.x - 28, m.y + m.h * 0.5);
                                c.lineTo(m.x - 34, m.y + m.h * 0.64);
                                c.lineTo(m.x - 24, m.y + m.h * 0.52);
                                c.lineTo(m.x - 18, m.y + m.h * 0.67);
                                c.lineTo(m.x - 15, m.y + m.h * 0.51);
                                c.closePath(); c.fill(); c.stroke();

                                c.beginPath();
                                c.moveTo(m.x + m.w * 0.72, m.y + m.h * 0.32);
                                c.quadraticCurveTo(m.x + m.w + 22, m.y + m.h * 0.24, m.x + m.w + 28, m.y + m.h * 0.15); // Elbow joint
                                c.lineTo(m.x + m.w + 19, m.y + m.h * 0.12);
                                c.quadraticCurveTo(m.x + m.w + 10, m.y + m.h * 0.28, m.x + m.w * 0.72, m.y + m.h * 0.38);
                                c.closePath(); c.fill(); c.stroke();

                                c.beginPath();
                                c.moveTo(m.x + m.w + 28, m.y + m.h * 0.15);
                                c.lineTo(m.x + m.w + 36, m.y + m.h * 0.08);
                                c.lineTo(m.x + m.w + 24, m.y + m.h * 0.12);
                                c.lineTo(m.x + m.w + 30, m.y + m.h * 0.2);
                                c.lineTo(m.x + m.w + 19, m.y + m.h * 0.14);
                                c.closePath(); c.fill(); c.stroke();

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
                                        { dx: 10,  dy: -2, rx: 4, ry: 4, rot: 0 },
                                        { dx: -4,  dy: -6, rx: 2.2, ry: 2.2, rot: 0 },
                                        { dx: 4,   dy: -6, rx: 2.2, ry: 2.2, rot: 0 },
                                        { dx: -15, dy: 3,  rx: 1.8, ry: 1.8, rot: 0 },
                                        { dx: 15,  dy: 3,  rx: 1.8, ry: 1.8, rot: 0 },
                                        { dx: -6,  dy: 1,  rx: 1.5, ry: 1.5, rot: 0 },
                                        { dx: 6,   dy: 1,  rx: 1.5, ry: 1.5, rot: 0 }
                                    ];

                                    eyeCluster.forEach(eye => {
                                        c.beginPath();
                                        c.ellipse(m.x + m.w * 0.5 + eye.dx, eyeCenterY + eye.dy, eye.rx, eye.ry, eye.rot, 0, Math.PI * 2);
                                        c.fill();
                                    });
                                    c.restore();

                                    c.strokeStyle = "#150802";
                                    c.lineWidth = 3.0;
                                    c.beginPath();
                                    c.moveTo(m.x + m.w * 0.32, eyeCenterY - 10);
                                    c.quadraticCurveTo(m.x + m.w * 0.5, eyeCenterY - 4, m.x + m.w * 0.68, eyeCenterY - 10);
                                    c.stroke();
                                }

                                // Gaping Jagged Mouth Hollow (Glowing Green Rift Core)
                                c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#1a0802"; // Void interior
                                c.beginPath();
                                c.ellipse(m.x + m.w * 0.5, mouthCenterY, m.w * 0.22, m.h * 0.09, 0, 0, Math.PI * 2);
                                c.fill(); c.stroke();

                                if (m.flashTimer === 0) {
                                    c.save();
                                    let mouthPulse = 1.0 + Math.sin(Date.now() / 100) * 0.08;
                                    let mouthGrad = c.createRadialGradient(
                                        m.x + m.w * 0.5, mouthCenterY, 2,
                                        m.x + m.w * 0.5, mouthCenterY, m.w * 0.22 * mouthPulse
                                    );
                                    mouthGrad.addColorStop(0, "#ffffff");
                                    mouthGrad.addColorStop(0.4, "#00ff88");
                                    mouthGrad.addColorStop(0.8, "#2ecc71");
                                    mouthGrad.addColorStop(1, "rgba(46, 204, 113, 0)");
                                    c.fillStyle = mouthGrad;
                                    c.shadowBlur = 15;
                                    c.shadowColor = "#00ff88";

                                    c.beginPath();
                                    c.ellipse(m.x + m.w * 0.5, mouthCenterY, m.w * 0.22, m.h * 0.09, 0, 0, Math.PI * 2);
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
                                        { ox: 0,        oy: -mH * 0.8, len: 11 },
                                        { ox: mW * 0.3,  oy: -mH * 0.6, len: 10 },
                                        { ox: mW * 0.7,  oy: -mH * 0.3, len: 6 }
                                    ];
                                    upperTeeth.forEach(tooth => {
                                        c.beginPath();
                                        c.moveTo(tX + tooth.ox - 3, tY + tooth.oy);
                                        c.lineTo(tX + tooth.ox, tY + tooth.oy + tooth.len);
                                        c.lineTo(tX + tooth.ox + 3, tY + tooth.oy);
                                        c.closePath(); c.fill(); c.stroke();
                                    });

                                    let lowerTeeth = [
                                                                            { ox: -mW * 0.5, oy: mH * 0.4, len: 8 },
                                                                            { ox: -mW * 0.15, oy: mH * 0.7, len: 10 },
                                                                            { ox: mW * 0.15,  oy: mH * 0.7, len: 10 },
                                                                            { ox: mW * 0.5,   oy: mH * 0.4, len: 8 }
                                                                        ];
                                                                        lowerTeeth.forEach(tooth => {
                                                                            c.beginPath();
                                                                            c.moveTo(tX + tooth.ox - 3, tY + tooth.oy);
                                                                            c.lineTo(tX + tooth.ox, tY + tooth.oy - tooth.len);
                                                                            c.lineTo(tX + tooth.ox + 3, tY + tooth.oy);
                                                                            c.closePath(); c.fill(); c.stroke();
                                                                        });

                                                                        // Dripping Green Slime/Venom droplets
                                                                        let venomOffset = (Date.now() / 8) % 35;
                                                                        c.fillStyle = "#00ff88";
                                                                        c.beginPath();
                                                                        c.ellipse(tX - 8, tY + 4 + venomOffset, 1.2, 3, 0, 0, Math.PI * 2);
                                                                        c.ellipse(tX + 10, tY + 2 + (venomOffset * 0.8), 1.0, 2.5, 0, 0, Math.PI * 2);
                                                                        c.fill();
                                                                    }

                                                    // 6. Multi-Layer Foliage Canopy
                let cx = m.x + m.w / 2;
                let cy = m.y + m.h * 0.08;
                let r = m.w * 0.9;

                // Layer 1: Base Deep Forest Green
                c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#1a461e";
                c.beginPath();
                c.arc(cx, cy, r, 0, Math.PI * 2);
                c.arc(cx - r * 0.5, cy - r * 0.2, r * 0.75, 0, Math.PI * 2);
                c.arc(cx + r * 0.5, cy - r * 0.2, r * 0.75, 0, Math.PI * 2);
                c.arc(cx, cy - r * 0.5, r * 0.85, 0, Math.PI * 2);
                c.fill(); c.stroke();

                // Layer 2: Vibrant Mid-Green
                c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#2ecc71";
                c.beginPath();
                c.arc(cx, cy, r * 0.8, 0, Math.PI * 2);
                c.arc(cx - r * 0.4, cy - r * 0.5, r * 0.6, 0, Math.PI * 2);
                c.arc(cx + r * 0.4, cy - r * 0.5, r * 0.6, 0, Math.PI * 2);
                c.fill(); c.stroke();

                // Layer 3: Highlighted vibrant light-green (Adds foliage depth)
                c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#52be80";
                c.beginPath();
                c.arc(cx - r * 0.2, cy - r * 0.3, r * 0.4, 0, Math.PI * 2);
                c.arc(cx + r * 0.2, cy - r * 0.3, r * 0.4, 0, Math.PI * 2);
                c.fill(); c.stroke();

                // 7. Hanging moss/ivy strands swaying dynamically
                if (m.flashTimer === 0) {
                    c.fillStyle = "#164d1f";
                    for (let i = 0; i < 5; i++) {
                        let ivyOffset = -r * 0.6 + (i * r * 0.3);
                        let ivyX = cx + ivyOffset;
                        let ivyY = cy + r * 0.3;
                        let ivySway = Math.sin(Date.now() / 200 + i) * 4;
                        c.beginPath();
                        c.moveTo(ivyX - 3.5, ivyY);
                        c.quadraticCurveTo(ivyX + ivySway, ivyY + 16, ivyX + ivySway + 1, ivyY + 24);
                        c.quadraticCurveTo(ivyX + 4.5 + ivySway, ivyY + 16, ivyX + 3.5, ivyY);
                        c.closePath(); c.fill(); c.stroke();
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
                                dy: Math.sin(angle) * dist - (r * 0.1),
                                sizeMod: window.randFloat(0.9, 1.25),
                                eyeRot: window.randFloat(-Math.PI / 10, Math.PI / 10)
                            });
                        }
                    }
                    c.save();
                    c.shadowBlur = 12;
                    c.shadowColor = "#ff2200";

                    let eyePulse = 1 + Math.sin(Date.now() / 150) * 0.08;

                    m.appleOffsets.forEach(ap => {
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
                        fruitGrad.addColorStop(1, "#c0392b");   // Crimson base
                        c.fillStyle = fruitGrad;

                        c.beginPath();
                        c.arc(0, 0, rRadius, 0, Math.PI * 2);
                        c.fill();
                        c.stroke();

                        // Menacing black reptilian slit pupil right in the center!
                        c.fillStyle = "#000000";
                        c.beginPath();
                        c.ellipse(0, 0, rRadius * 0.20, rRadius * 0.70, 0, 0, Math.PI * 2);
                        c.fill();

                        // Micro white specular highlight reflecting light
                        c.fillStyle = "#ffffff";
                        c.beginPath();
                        c.arc(-rRadius * 0.25, -rRadius * 0.25, rRadius * 0.15, 0, Math.PI * 2);
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
            c.beginPath(); c.rect(m.x + 4, m.y + m.h - 16, m.w - 8, 16); c.fill(); c.stroke();
            c.fillStyle = blockColor;
            c.beginPath(); c.rect(m.x + 8, m.y + m.h - 14, 12, 14); c.fill(); c.stroke();
            c.beginPath(); c.rect(m.x + m.w - 20, m.y + m.h - 14, 12, 14); c.fill(); c.stroke();

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
                c.moveTo(m.x + m.w/2, m.y + m.h/2 + 5 + bounceOffset);
                c.lineTo(m.x + 10, m.y + 35 + bounceOffset);
                c.moveTo(m.x + m.w/2, m.y + m.h/2 + 5 + bounceOffset);
                c.lineTo(m.x + m.w - 10, m.y + 35 + bounceOffset);
                c.moveTo(m.x + m.w/2, m.y + m.h/2 + 5 + bounceOffset);
                c.lineTo(m.x + m.w/2, m.y + m.h - 22 + bounceOffset);
                c.stroke();

                let coreGrad = c.createRadialGradient(
                    m.x + m.w/2, m.y + m.h/2 + 5 + bounceOffset, 1,
                    m.x + m.w/2, m.y + m.h/2 + 5 + bounceOffset, 8
                );
                coreGrad.addColorStop(0, "#ffffff");
                coreGrad.addColorStop(0.3, "#ff3b30");
                coreGrad.addColorStop(1, "rgba(255, 0, 0, 0)");
                c.fillStyle = coreGrad;
                c.beginPath();
                c.arc(m.x + m.w/2, m.y + m.h/2 + 5 + bounceOffset, 8, 0, Math.PI * 2);
                c.fill();
                c.stroke();

                c.shadowBlur = 0;
            }
        }
        else {
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
                    let coreGrad = c.createRadialGradient(cx, cy + 16, 2, cx, cy + 16, corePulse);
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
            }
            else if (currentTier === 3) {
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
                c.ellipse(cx - 20, cy - 10, 12, 12, 0, 0, Math.PI*2);
                c.ellipse(cx + 20, cy - 10, 12, 12, 0, 0, Math.PI*2);
                c.fill();
                c.stroke();

                // Bog face
                c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#1a120a";
                c.beginPath();
                c.arc(cx, cy - 22, 12, 0, Math.PI*2);
                c.fill();
                c.stroke();

                if (m.flashTimer === 0) {
                    // Glowing toxic green swamp eyes
                    c.fillStyle = "#2ecc71";
                    c.beginPath();
                    c.arc(cx - 4, cy - 22, 2.2, 0, Math.PI*2);
                    c.arc(cx + 4, cy - 22, 2.2, 0, Math.PI*2);
                    c.fill();
                }
            }
            else if (currentTier === 4) {
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
                    c.beginPath(); c.arc(cx, cy, 28, 0, Math.PI*2); c.fill();
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
                    c.arc(cx, cy, 3.5, 0, Math.PI*2);
                    c.arc(cx - 8, cy - 8, 1.8, 0, Math.PI*2);
                    c.arc(cx + 8, cy - 8, 1.8, 0, Math.PI*2);
                    c.arc(cx - 8, cy + 8, 1.8, 0, Math.PI*2);
                    c.arc(cx + 8, cy + 8, 1.8, 0, Math.PI*2);
                    c.fill();
                }
            }
            else if (currentTier === 5) {
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
            }
            else if (currentTier === 6) {
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
            }
            else if (currentTier === 7) {
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
                c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "rgba(241, 196, 15, 0.08)";
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

                c.strokeStyle = "#111116"; c.lineWidth = 2.5; c.lineCap = "round"; let hrAngle = Date.now() / 10000; c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(hrAngle) * 15, Math.sin(hrAngle) * 15); c.stroke();
                let minAngle = Date.now() / 1800; c.strokeStyle = "#d35400"; c.lineWidth = 1.8; c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(minAngle) * 22, Math.sin(minAngle) * 22); c.stroke();
                c.restore();
            }
            else {
                // TIER 8+: Nexus Overseer (The Glitch Singularity - exclusive T3 Altar Summon)
                let cx = m.x + m.w / 2; let cy = m.y + m.h / 2;
                let isGlitchedFrame = (Math.sin(Date.now() / 10) > 0.85);
                let px = cx + (isGlitchedFrame ? window.randFloat(-4, 4) : 0); let py = cy + (isGlitchedFrame ? window.randFloat(-3, 3) : 0);
                c.save(); c.translate(px, py); c.rotate(Date.now() / 800); c.strokeStyle = m.flashTimer > 0 ? "#ffffff" : "#ff007f"; c.lineWidth = 2.0;
                let cycle = Math.floor(Date.now() / 5000) % 3;
                if (cycle === 0) {
                    c.strokeRect(-18, -18, 36, 36); c.strokeRect(-12, -12, 24, 24);
                    c.beginPath(); c.moveTo(-18, -18); c.lineTo(-12, -12); c.moveTo(18, -18); c.lineTo(12, -12); c.moveTo(-18, 18); c.lineTo(-12, 12); c.moveTo(18, 18); c.lineTo(12, 12); c.stroke();
                } else if (cycle === 1) {
                    c.beginPath(); c.moveTo(0, -22); c.lineTo(-18, 14); c.lineTo(18, 14); c.closePath(); c.moveTo(0, -22); c.lineTo(0, 18); c.lineTo(-18, 14); c.moveTo(0, 18); c.lineTo(18, 14); c.stroke();
                } else {
                    c.beginPath(); for (let i = 0; i < 5; i++) { let angle = (i * Math.PI * 2) / 5; c.lineTo(Math.cos(angle) * 22, Math.sin(angle) * 22); } c.closePath(); c.stroke();
                    c.beginPath(); for (let i = 0; i < 5; i++) { let angle = (i * Math.PI * 2) / 5; c.moveTo(0, 0); c.lineTo(Math.cos(angle) * 22, Math.sin(angle) * 22); } c.stroke();
                }
                c.restore();
                if (m.flashTimer === 0) {
                    let eyePulse = 6 + Math.sin(Date.now() / 150) * 1.5; c.fillStyle = "#00b894"; c.beginPath(); c.arc(px, py, eyePulse, 0, Math.PI * 2); c.fill(); c.strokeStyle = "#000000"; c.lineWidth = 1.5; c.stroke();
                    c.fillStyle = "#ff007f"; c.fillRect(px - 1.2, py - 4, 2.4, 8);
                }
            }
        }

        if (m.flashTimer === 0) {
            c.fillStyle = "#ff007f";
            c.beginPath(); c.rect(m.x + 12, m.y + 7 + bounce, m.w - 24, 2); c.fill(); c.stroke();
        }
    }
    c.restore();
};
// --- MISSING DPS CALCULATOR ---
window.calculateActiveDps = function() {
    let now = Date.now();
    window.damageHistory = window.damageHistory.filter(d => now - d.time <= 3000);
    if (window.damageHistory.length === 0) return "0.0";
    let totalDamage = window.damageHistory.reduce((sum, d) => sum + d.amount, 0);
    let avgDps = totalDamage / 3;
    return avgDps.toLocaleString(undefined, {minimumFractionDigits: 1, maximumFractionDigits: 1});
};

// --- MISSING MAIN RENDER LOOP ---
window.draw = function() {
    const ctx = window.ctx;
    const canvas = window.canvas;
    if (!ctx || !canvas) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let tier = window.getStageTier();

    const penSky = 1.0; const penFar = 1.3; const penBgScenery = 1.3;
    const penFgScenery = 1.5; const penHero = 1.8; const penBoss = 2.4;

    // 1. SKY & BACKGROUND FILL
    if (window.playerStats.isUberBoss) {
        let skyGrad = ctx.createLinearGradient(0, 0, 0, 230);
        skyGrad.addColorStop(0, "#0d011a"); skyGrad.addColorStop(0.5, "#25033c"); skyGrad.addColorStop(1, "#030005");
        ctx.fillStyle = skyGrad; ctx.fillRect(0, 0, canvas.width, 230);
        let singPulse = 45 + Math.sin(Date.now() / 150) * 10;
        let singGrad = ctx.createRadialGradient(canvas.width / 2, 110, 5, canvas.width / 2, 110, singPulse);
        singGrad.addColorStop(0, "#000000"); singGrad.addColorStop(0.3, "#e84393"); singGrad.addColorStop(0.7, "rgba(142, 68, 173, 0.15)"); singGrad.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = singGrad; ctx.beginPath(); ctx.arc(canvas.width / 2, 110, singPulse, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = "rgba(155, 89, 182, 0.45)"; ctx.lineWidth = 1.5; ctx.save(); ctx.translate(canvas.width / 2, 110); ctx.rotate(Date.now() / 500);
        ctx.beginPath(); ctx.ellipse(0, 0, singPulse * 1.6, singPulse * 0.4, 0, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
    } else if (window.playerStats.isPrestigeBossMode) {
        let skyGrad = ctx.createLinearGradient(0, 0, 0, 230);
        skyGrad.addColorStop(0, "#0a0302"); skyGrad.addColorStop(0.5, "#2d0802"); skyGrad.addColorStop(1, "#9e2a02");
        ctx.fillStyle = skyGrad; ctx.fillRect(0, 0, canvas.width, 230);
        ctx.fillStyle = "#0c0302"; ctx.strokeStyle = "#000000"; ctx.lineWidth = 1.5;
        for (let i = 40; i < canvas.width; i += 180) {
            ctx.beginPath(); ctx.rect(i, 0, 35, 230); ctx.fill(); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(i, 30); ctx.quadraticCurveTo(i - 40, 60, i - 90, 60); ctx.lineTo(i - 90, 75); ctx.quadraticCurveTo(i - 40, 75, i, 45); ctx.closePath(); ctx.fill(); ctx.stroke();
        }
        ctx.strokeStyle = "#1b1412"; ctx.lineWidth = 2.5;
        for (let x = 110; x < canvas.width; x += 180) {
            let chainLength = 90 + Math.sin(Date.now() / 400 + x) * 15;
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, chainLength); ctx.stroke();
            ctx.fillStyle = "#110a08";
            for (let y = 10; y < chainLength; y += 12) { ctx.beginPath(); ctx.ellipse(x, y, 4, 6, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }
        }
        let lavaHorizonGrad = ctx.createLinearGradient(0, 210, 0, 230);
        lavaHorizonGrad.addColorStop(0, "rgba(230, 126, 34, 0)"); lavaHorizonGrad.addColorStop(0.5, "#e67e22"); lavaHorizonGrad.addColorStop(1, "#f1c40f");
        ctx.fillStyle = lavaHorizonGrad; ctx.fillRect(0, 210, canvas.width, 20);
    } else if (window.playerStats.isCrucibleMode) {
        let skyGrad = ctx.createLinearGradient(0, 0, 0, 230);
        skyGrad.addColorStop(0, "#05010c"); skyGrad.addColorStop(1, "#150221");
        ctx.fillStyle = skyGrad; ctx.fillRect(0, 0, canvas.width, 230);
        ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
        for (let i = 0; i < 25; i++) { let size = (Math.sin(Date.now() / 200 + i) * 0.5 + 0.5) * 1.5; ctx.fillRect((i * 47) % canvas.width, (i * 13) % 190, size, size); }
        let pulseRad = 65 + Math.sin(Date.now() / 250) * 15;
        let spaceGlow = ctx.createRadialGradient(canvas.width / 2, 110, 2, canvas.width / 2, 110, pulseRad);
        spaceGlow.addColorStop(0, "rgba(155, 89, 182, 0.45)"); spaceGlow.addColorStop(0.5, "rgba(232, 67, 147, 0.15)"); spaceGlow.addColorStop(1, "rgba(155, 89, 182, 0)");
        ctx.fillStyle = spaceGlow; ctx.beginPath(); ctx.arc(canvas.width / 2, 110, pulseRad, 0, Math.PI * 2); ctx.fill();
    } else if (window.playerStats.isDungeonMode) {
        let caveGrad = ctx.createLinearGradient(0, 0, 0, 230);
        if (window.playerStats.currentDungeon === 'gold') { caveGrad.addColorStop(0, "#0f0800"); caveGrad.addColorStop(1, "#1d1205"); }
        else if (window.playerStats.currentDungeon === 'mat') { caveGrad.addColorStop(0, "#040d08"); caveGrad.addColorStop(1, "#0d2115"); }
        else { caveGrad.addColorStop(0, "#06070a"); caveGrad.addColorStop(1, "#12181f"); }
        ctx.fillStyle = caveGrad; ctx.fillRect(0, 0, canvas.width, 230);
        ctx.fillStyle = window.playerStats.currentDungeon === 'gold' ? "#140a00" : (window.playerStats.currentDungeon === 'mat' ? "#050f0a" : "#0d1117");
        ctx.beginPath(); ctx.moveTo(0, 230); ctx.quadraticCurveTo(180, 40, 380, 230); ctx.quadraticCurveTo(580, 20, 800, 230); ctx.fill();
        ctx.strokeStyle = "#000000"; ctx.lineWidth = penFar; ctx.stroke();
        if (window.playerStats.currentDungeon === 'gold') {
            ctx.strokeStyle = "#1b1108"; ctx.lineWidth = 6;
            for (let i = 100; i < canvas.width; i += 220) { ctx.beginPath(); ctx.moveTo(i - 40, 230); ctx.lineTo(i - 40, 90); ctx.lineTo(i + 40, 90); ctx.lineTo(i + 40, 230); ctx.stroke(); ctx.strokeStyle = "#000000"; ctx.lineWidth = penFar; ctx.stroke(); }
        } else if (window.playerStats.currentDungeon === 'equip') {
            ctx.strokeStyle = "#1b2126"; ctx.lineWidth = 2;
            for (let i = 180; i < canvas.width; i += 250) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.bezierCurveTo(i - 10, 70, i + 15, 130, i, 190); ctx.stroke(); ctx.strokeStyle = "#000000"; ctx.lineWidth = penFar; ctx.stroke(); ctx.fillStyle = "#13181c"; ctx.beginPath(); ctx.rect(i - 6, 190, 12, 8); ctx.fill(); ctx.stroke(); }
        }
    } else {
        let skyGrad = ctx.createLinearGradient(0, 0, 0, 230);
        if (window.playerStats.isBossMode) { skyGrad.addColorStop(0, "#140618"); skyGrad.addColorStop(1, "#030005"); }
        else {
            if (tier===0) { skyGrad.addColorStop(0, "#2c3e50"); skyGrad.addColorStop(1, "#3498db"); }
            else if (tier===1) { skyGrad.addColorStop(0, "#2c3e50"); skyGrad.addColorStop(1, "#1a252f"); }
            else if (tier===2) { skyGrad.addColorStop(0, "#5a0e0e"); skyGrad.addColorStop(1, "#0e0202"); }
            else if (tier===3) { skyGrad.addColorStop(0, "#082113"); skyGrad.addColorStop(1, "#193623"); }
            else { skyGrad.addColorStop(0, "#070313"); skyGrad.addColorStop(1, "#020005"); }
        }
        ctx.fillStyle = skyGrad; ctx.fillRect(0, 0, canvas.width, 230);

        if (tier === 0) {
            ctx.fillStyle = "rgba(255,255,255,0.06)";
            let cloudScroll1 = (Date.now() / 250) % (canvas.width + 100) - 50; let cloudScroll2 = (Date.now() / 400 + 300) % (canvas.width + 100) - 50;
            ctx.beginPath(); ctx.arc(cloudScroll1, 55, 20, 0, Math.PI*2); ctx.arc(cloudScroll1 + 25, 50, 25, 0, Math.PI*2); ctx.arc(cloudScroll1 - 25, 58, 15, 0, Math.PI*2); ctx.fill();
            ctx.strokeStyle = "rgba(0, 0, 0, 0.15)"; ctx.lineWidth = penSky; ctx.stroke();
            ctx.beginPath(); ctx.arc(cloudScroll2, 80, 15, 0, Math.PI*2); ctx.arc(cloudScroll2 + 18, 75, 20, 0, Math.PI*2); ctx.fill(); ctx.stroke();
            ctx.fillStyle = "#1e3d29"; ctx.beginPath(); ctx.moveTo(0, 230); ctx.quadraticCurveTo(100, 160, 220, 230); ctx.quadraticCurveTo(350, 145, 480, 230); ctx.quadraticCurveTo(620, 165, 800, 230); ctx.fill();
            ctx.strokeStyle = "#000000"; ctx.lineWidth = penFar; ctx.stroke();
            ctx.fillStyle = "#154f2c"; ctx.beginPath(); ctx.moveTo(0, 230); ctx.quadraticCurveTo(150, 180, 320, 230); ctx.quadraticCurveTo(500, 170, 680, 230); ctx.quadraticCurveTo(740, 200, 800, 230); ctx.fill(); ctx.stroke();
        } else if (tier === 1) {
            ctx.fillStyle = "rgba(255, 255, 255, 0.2)"; for(let i = 0; i < 20; i++) { ctx.fillRect((i * 37) % canvas.width, (i * 13) % 130, 1, 1); }
            ctx.fillStyle = "#1c2833"; ctx.beginPath(); ctx.moveTo(0, 230); ctx.lineTo(100, 130); ctx.lineTo(180, 180); ctx.lineTo(310, 110); ctx.lineTo(450, 200); ctx.lineTo(580, 125); ctx.lineTo(700, 190); ctx.lineTo(800, 230); ctx.lineTo(0, 230); ctx.closePath(); ctx.fill();
            ctx.strokeStyle = "#000000"; ctx.lineWidth = penFar; ctx.stroke();
            ctx.fillStyle = "#ecf0f1"; ctx.lineWidth = penSky;
            ctx.beginPath(); ctx.moveTo(100, 130); ctx.lineTo(85, 145); ctx.lineTo(115, 145); ctx.closePath(); ctx.fill(); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(310, 110); ctx.lineTo(290, 135); ctx.lineTo(330, 135); ctx.closePath(); ctx.fill(); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(580, 125); ctx.lineTo(565, 140); ctx.lineTo(595, 140); ctx.closePath(); ctx.fill(); ctx.stroke();
            ctx.fillStyle = "#2c3e50"; ctx.beginPath(); ctx.moveTo(0, 230); ctx.lineTo(150, 160); ctx.lineTo(280, 230); ctx.lineTo(440, 150); ctx.lineTo(600, 230); ctx.lineTo(700, 170); ctx.lineTo(800, 230); ctx.lineTo(0, 230); ctx.closePath(); ctx.fill(); ctx.strokeStyle = "#000000"; ctx.lineWidth = penFar; ctx.stroke();
            ctx.fillStyle = "#ecf0f1"; ctx.lineWidth = penSky;
            ctx.beginPath(); ctx.moveTo(150, 160); ctx.lineTo(135, 172); ctx.lineTo(165, 172); ctx.closePath(); ctx.fill(); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(440, 150); ctx.lineTo(420, 165); ctx.lineTo(460, 165); ctx.closePath(); ctx.fill(); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(700, 170); ctx.lineTo(685, 180); ctx.lineTo(715, 180); ctx.closePath(); ctx.fill(); ctx.stroke();
        } else if (tier === 2) {
            ctx.fillStyle = "rgba(230, 126, 34, 0.08)"; ctx.fillRect(0, 0, canvas.width, 230);
            for (let i = 0; i < 8; i++) { ctx.fillStyle = "#e67e22"; ctx.fillRect((Date.now() / 15 + i * 90) % (canvas.width + 20) - 10, 210 - ((Date.now() / 8 + i * 43) % 150), 2, 2); }
            ctx.fillStyle = "#200401"; ctx.beginPath(); ctx.moveTo(0, 230); ctx.lineTo(80, 140); ctx.lineTo(120, 165); ctx.lineTo(250, 90); ctx.lineTo(320, 175); ctx.lineTo(500, 100); ctx.lineTo(620, 190); ctx.lineTo(720, 130); ctx.lineTo(800, 230); ctx.fill(); ctx.strokeStyle = "#000000"; ctx.lineWidth = penFar; ctx.stroke();
            ctx.strokeStyle = "#e74c3c"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(250, 90); ctx.lineTo(250, 110); ctx.moveTo(500, 100); ctx.lineTo(500, 125); ctx.stroke();
            ctx.fillStyle = "#110200"; ctx.beginPath(); ctx.moveTo(0, 230); ctx.lineTo(80, 190); ctx.lineTo(95, 192); ctx.lineTo(140, 165); ctx.lineTo(160, 165); ctx.lineTo(210, 200); ctx.lineTo(220, 198); ctx.lineTo(300, 230); ctx.moveTo(300, 230); ctx.lineTo(380, 175); ctx.lineTo(395, 178); ctx.lineTo(440, 155); ctx.lineTo(460, 155); ctx.lineTo(520, 195); ctx.lineTo(650, 230); ctx.closePath(); ctx.fill(); ctx.stroke();
            ctx.strokeStyle = "#e74c3c"; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(140, 165); ctx.lineTo(160, 165); ctx.moveTo(440, 155); ctx.lineTo(460, 155); ctx.stroke();
        } else if (tier === 3) {
            let mistGrad = ctx.createLinearGradient(0, 170, 0, 230); mistGrad.addColorStop(0, "rgba(39, 174, 96, 0)"); mistGrad.addColorStop(1, "rgba(39, 174, 96, 0.12)");
            ctx.fillStyle = mistGrad; ctx.fillRect(0, 170, canvas.width, 60);
            ctx.fillStyle = "#0c1f13"; ctx.beginPath(); ctx.moveTo(0, 230); ctx.quadraticCurveTo(80, 180, 160, 200); ctx.quadraticCurveTo(240, 175, 340, 210); ctx.quadraticCurveTo(460, 160, 580, 205); ctx.quadraticCurveTo(680, 190, 800, 230); ctx.fill(); ctx.strokeStyle = "#000000"; ctx.lineWidth = penFar; ctx.stroke();
            ctx.fillStyle = "#07140c"; ctx.beginPath(); ctx.ellipse(50, 170, 80, 50, 0, 0, Math.PI*2); ctx.ellipse(750, 160, 90, 60, 0, 0, Math.PI*2); ctx.fill(); ctx.stroke();
        } else if (tier === 4) {
            let nebula = ctx.createRadialGradient(canvas.width / 2, 100, 5, canvas.width / 2, 100, 120);
            nebula.addColorStop(0, "rgba(155, 89, 182, 0.3)"); nebula.addColorStop(1, "rgba(155, 89, 182, 0)");
            ctx.fillStyle = nebula; ctx.beginPath(); ctx.arc(canvas.width / 2, 100, 120, 0, Math.PI * 2); ctx.fill();
            let starPulse = Math.sin(Date.now() / 300) * 0.4 + 0.6; ctx.fillStyle = `rgba(255, 255, 255, ${0.4 * starPulse})`;
            for (let i = 0; i < 30; i++) { ctx.fillRect((i * 59 + 23) % canvas.width, (i * 29 + 11 + 50) % 190, 1.5, 1.5); }
            ctx.fillStyle = "#100221"; let hover = Math.sin(Date.now() / 400) * 4;
            ctx.beginPath(); ctx.moveTo(120, 190 + hover); ctx.lineTo(140, 100 + hover); ctx.lineTo(160, 190 + hover); ctx.lineTo(140, 215 + hover); ctx.closePath(); ctx.fill(); ctx.strokeStyle = "#000000"; ctx.lineWidth = penFar; ctx.stroke();
            ctx.fillStyle = "#0b0116"; ctx.beginPath(); ctx.moveTo(520, 200 - hover); ctx.lineTo(535, 125 - hover); ctx.lineTo(550, 200 - hover); ctx.closePath(); ctx.fill(); ctx.stroke();
            ctx.fillStyle = "#130426"; ctx.beginPath(); ctx.ellipse(320, 170 + hover * 1.5, 45, 12, Math.PI / 12, 0, Math.PI * 2); ctx.ellipse(650, 140 - hover * 1.2, 35, 10, -Math.PI / 8, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        } else if (tier === 5) {
            let goldenGlow = ctx.createLinearGradient(0, 0, 0, 230);
            goldenGlow.addColorStop(0, "#1c1400"); goldenGlow.addColorStop(0.6, "#2d1f05"); goldenGlow.addColorStop(1, "#120a00");
            ctx.fillStyle = goldenGlow; ctx.fillRect(0, 0, canvas.width, 230);
            let gearAngle = Date.now() / 4000; ctx.save(); ctx.translate(canvas.width / 2 + 100, 80); ctx.rotate(gearAngle); ctx.strokeStyle = "#f1c40f"; ctx.lineWidth = 1.5; ctx.fillStyle = "rgba(241, 196, 15, 0.05)";
            ctx.beginPath(); ctx.arc(0, 0, 45, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
            for (let i = 0; i < 8; i++) { ctx.rotate(Math.PI / 4); ctx.fillRect(-6, -55, 12, 10); ctx.strokeRect(-6, -55, 12, 10); }
            ctx.restore();
            ctx.fillStyle = "#2d1a04"; ctx.strokeStyle = "#000000"; ctx.lineWidth = penFar; let hover = Math.sin(Date.now() / 350) * 5;
            ctx.beginPath(); ctx.roundRect(140, 40 + hover, 24, 110, [3]); ctx.roundRect(580, 50 - hover, 20, 95, [3]); ctx.fill(); ctx.stroke();
        } else {
            let cyberSky = ctx.createLinearGradient(0, 0, 0, 230);
            cyberSky.addColorStop(0, "#01040a"); cyberSky.addColorStop(1, "#000000"); ctx.fillStyle = cyberSky; ctx.fillRect(0, 0, canvas.width, 230);
            ctx.strokeStyle = "rgba(52, 152, 219, 0.25)"; ctx.lineWidth = 1.0; let horizonY = 150;
            for (let i = -100; i < canvas.width + 100; i += 60) { ctx.beginPath(); ctx.moveTo(i, horizonY); ctx.lineTo(i * 1.8 - (canvas.width * 0.4), 230); ctx.stroke(); }
            ctx.fillStyle = "rgba(46, 204, 113, 0.45)";
            for (let i = 0; i < 15; i++) { let rx = (i * 57) % canvas.width; let ry = (Date.now() / 6 + i * 35) % 190 + 40; ctx.fillRect(rx, ry, 1.2, 12); }
        }
    }

    // 2. BACKGROUND SCENERY & VEGETATION (Every element outlined)
    window.bgScenery.forEach(s => {
        s.seed = s.seed || Math.random(); let ts = s.size;
        ctx.save(); ctx.strokeStyle = "#000000"; ctx.lineWidth = penBgScenery * ts; ctx.lineJoin = "round";

        if (window.playerStats.isCrucibleMode || window.playerStats.isPrestigeBossMode || window.playerStats.isUberBoss) { ctx.restore(); return; }
        if (window.playerStats.isDungeonMode) {
            let isCeiling = s.seed < 0.45;
            if (isCeiling) {
                let h = 35 + s.seed * 50 * ts; let w = 12 + s.seed * 22 * ts;
                let color = window.playerStats.currentDungeon === 'gold' ? "#332211" : (window.playerStats.currentDungeon === 'mat' ? "#1b2d1f" : "#20262e");
                ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(s.x - w/2, 0); ctx.lineTo(s.x, h); ctx.lineTo(s.x + w/2, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
                ctx.strokeStyle = "rgba(255,255,255,0.06)"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(s.x, h); ctx.lineTo(s.x - w/4, 0); ctx.stroke();
            } else {
                let h = 22 + s.seed * 45 * ts; let w = 10 + s.seed * 18 * ts;
                let color = window.playerStats.currentDungeon === 'gold' ? "#261a0c" : (window.playerStats.currentDungeon === 'mat' ? "#121f16" : "#191e24");
                ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(s.x - w/2, 230); ctx.lineTo(s.x, 230 - h); ctx.lineTo(s.x + w/2, 230); ctx.closePath(); ctx.fill(); ctx.stroke();
                ctx.strokeStyle = "rgba(255,255,255,0.04)"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(s.x, 230 - h); ctx.lineTo(s.x + w/4, 230); ctx.stroke();
            }
        } else {
                    if (s.type === 'tree') {
                        let tx = s.x, ty = s.y - 40 * ts;
                        if (tier === 0) {
                            if (s.seed < 0.35) {
                                // Oak Tree Canopy & Trunk Outlined
                                ctx.fillStyle = "#5c4033"; ctx.beginPath(); ctx.rect(tx - 6*ts, ty, 12*ts, 40*ts); ctx.fill(); ctx.stroke();
                                ctx.fillStyle = "#3e2723"; ctx.beginPath(); ctx.rect(tx + 2*ts, ty, 4*ts, 40*ts); ctx.fill(); ctx.stroke();

                                ctx.fillStyle = "#165e34"; ctx.beginPath(); ctx.arc(tx, ty - 12*ts, 24 * ts, 0, Math.PI*2); ctx.fill(); ctx.stroke();
                                ctx.fillStyle = "#1e8449"; ctx.beginPath(); ctx.arc(tx - 10*ts, ty - 5*ts, 18 * ts, 0, Math.PI*2); ctx.fill(); ctx.stroke();
                                ctx.beginPath(); ctx.arc(tx + 10*ts, ty - 5*ts, 18 * ts, 0, Math.PI*2); ctx.fill(); ctx.stroke();
                                ctx.fillStyle = "#2ecc71"; ctx.beginPath(); ctx.arc(tx, ty - 18*ts, 15 * ts, 0, Math.PI*2); ctx.fill(); ctx.stroke();
                            } else if (s.seed < 0.7) {
                                // Spruce Tree Outlined
                                ctx.fillStyle = "#3d2a1d"; ctx.beginPath(); ctx.rect(tx - 4*ts, ty, 8*ts, 40*ts); ctx.fill(); ctx.stroke();

                                ctx.fillStyle = "#0e3a1d"; ctx.beginPath(); ctx.moveTo(tx - 25*ts, ty + 15*ts); ctx.lineTo(tx, ty - 15*ts); ctx.lineTo(tx + 25*ts, ty + 15*ts); ctx.closePath(); ctx.fill(); ctx.stroke();
                                ctx.fillStyle = "#145229"; ctx.beginPath(); ctx.moveTo(tx - 20*ts, ty - 2*ts); ctx.lineTo(tx, ty - 25*ts); ctx.lineTo(tx + 20*ts, ty - 2*ts); ctx.closePath(); ctx.fill(); ctx.stroke();
                                ctx.fillStyle = "#2ecc71"; ctx.beginPath(); ctx.moveTo(tx - 14*ts, ty - 15*ts); ctx.lineTo(tx, ty - 32*ts); ctx.lineTo(tx + 14*ts, ty - 15*ts); ctx.closePath(); ctx.fill(); ctx.stroke();
                            } else {
                                // Slender Aspen Outlined
                                ctx.fillStyle = "#dcdde1"; ctx.beginPath(); ctx.rect(tx - 3*ts, ty - 15*ts, 6*ts, 55*ts); ctx.fill(); ctx.stroke();
                                ctx.fillStyle = "#2f3640"; ctx.beginPath(); ctx.rect(tx - 3*ts, ty + 15*ts, 3*ts, 2); ctx.fill(); ctx.stroke();
                                ctx.beginPath(); ctx.rect(tx, ty - 5*ts, 3*ts, 2); ctx.fill(); ctx.stroke();

                                ctx.fillStyle = "#27ae60"; ctx.beginPath(); ctx.ellipse(tx, ty - 20*ts, 16*ts, 22*ts, 0, 0, Math.PI*2); ctx.fill(); ctx.stroke();
                                                        ctx.fillStyle = "#f1c40f"; ctx.beginPath(); ctx.ellipse(tx - 6*ts, ty - 18*ts, 10*ts, 14*ts, 0, 0, Math.PI*2); ctx.fill(); ctx.stroke();
                                                        ctx.beginPath(); ctx.ellipse(tx + 6*ts, ty - 24*ts, 8*ts, 12*ts, 0, 0, Math.PI*2); ctx.fill(); ctx.stroke();
                                                    }

                                                    // Draw a detailed procedural cobweb clinging to the trunk branches inside the Tier 0 scope
                                                    if (s.seed < 0.45) {
                                                        ctx.save();
                                                        ctx.strokeStyle = "rgba(255, 255, 255, 0.16)";
                                                        ctx.lineWidth = 0.8;
                                                        let webX = tx + (s.seed > 0.22 ? -15 : 15) * ts;
                                                        let webY = ty - 12 * ts;
                                                        let webRad = 22 * ts;
                                                        let lines = 6;
                                                        for (let j = 0; j < lines; j++) {
                                                            let angle = (j * Math.PI) / (lines - 1) + (s.seed > 0.2 ? Math.PI : 0);
                                                            ctx.beginPath();
                                                            ctx.moveTo(webX, webY);
                                                            ctx.lineTo(webX + Math.cos(angle) * webRad, webY + Math.sin(angle) * webRad);
                                                            ctx.stroke();
                                                        }
                                                        for (let rVal = 5; rVal <= webRad; rVal += 5) {
                                                            ctx.beginPath();
                                                            for (let j = 0; j < lines; j++) {
                                                                let angle = (j * Math.PI) / (lines - 1) + (s.seed > 0.2 ? Math.PI : 0);
                                                                let px = webX + Math.cos(angle) * rVal;
                                                                let py = webY + Math.sin(angle) * rVal;
                                                                if (j === 0) ctx.moveTo(px, py);
                                                                else ctx.lineTo(px, py);
                                                            }
                                                            ctx.stroke();
                                                        }
                                                        ctx.restore();
                                                    }
                                                } else if (tier === 1) {
                                                    if (s.seed < 0.5) {
                                                        ctx.strokeStyle = "#34495e"; ctx.lineWidth = 4 * ts; ctx.beginPath();
                        ctx.moveTo(tx, 230); ctx.lineTo(tx, ty + 10 * ts); ctx.quadraticCurveTo(tx - 10 * ts, ty, tx - 18 * ts, ty - 10 * ts);
                        ctx.moveTo(tx, ty + 15 * ts); ctx.quadraticCurveTo(tx + 8 * ts, ty + 5 * ts, tx + 14 * ts, ty - 5 * ts); ctx.stroke();
                    } else {
                        ctx.fillStyle = "#2c3e50"; ctx.beginPath(); ctx.moveTo(tx - 15*ts, 230); ctx.lineTo(tx, ty - 10*ts); ctx.lineTo(tx + 15*ts, 230); ctx.fill(); ctx.stroke();
                    }
                } else if (tier === 2) {
                    if (s.seed < 0.5) {
                        ctx.fillStyle = "#110502"; ctx.beginPath(); ctx.moveTo(tx - 12*ts, 230); ctx.lineTo(tx, ty - 15*ts); ctx.lineTo(tx + 12*ts, 230); ctx.fill(); ctx.stroke();
                    } else {
                        ctx.fillStyle = "#210904"; ctx.beginPath(); ctx.moveTo(tx - 32*ts, 230); ctx.lineTo(tx - 12*ts, ty + 14*ts); ctx.lineTo(tx - 6*ts, ty + 7*ts); ctx.lineTo(tx - 5*ts, ty + 10*ts); ctx.lineTo(tx + 5*ts, ty + 10*ts); ctx.lineTo(tx + 8*ts, ty + 13*ts); ctx.lineTo(tx + 32*ts, 230); ctx.closePath(); ctx.fill(); ctx.stroke();
                    }
                } else if (tier === 3) {
                    if (s.seed < 0.5) {
                        ctx.fillStyle = "#5c503b"; ctx.beginPath(); ctx.rect(tx - 4*ts, ty, 8*ts, 40*ts); ctx.fill(); ctx.stroke();
                        ctx.fillStyle = "#144222"; ctx.beginPath(); ctx.ellipse(tx, ty, 20*ts, 15*ts, 0, 0, Math.PI*2); ctx.fill(); ctx.stroke();
                        ctx.fillStyle = "#1b5e30"; ctx.beginPath(); ctx.ellipse(tx - 6*ts, ty + 5*ts, 15*ts, 10*ts, 0, 0, Math.PI*2); ctx.fill(); ctx.stroke();
                        ctx.strokeStyle = "#3e321e"; ctx.lineWidth = 3*ts; ctx.beginPath();
                        ctx.moveTo(tx - 4*ts, 210); ctx.quadraticCurveTo(tx - 12*ts, 220, tx - 18*ts, 230);
                        ctx.moveTo(tx + 4*ts, 210); ctx.quadraticCurveTo(tx + 12*ts, 220, tx + 18*ts, 230); ctx.stroke();
                    } else {
                        ctx.fillStyle = "#4a3c28"; ctx.beginPath(); ctx.rect(tx - 3*ts, ty, 6*ts, 40*ts); ctx.fill(); ctx.stroke();
                        ctx.fillStyle = "#0c2b18"; ctx.beginPath(); ctx.arc(tx, ty, 16*ts, 0, Math.PI*2); ctx.fill(); ctx.stroke();
                        ctx.strokeStyle = "#1b4f30"; ctx.lineWidth = 2*ts; ctx.beginPath();
                        ctx.moveTo(tx - 10*ts, ty); ctx.lineTo(tx - 10*ts, ty + 25*ts);
                        ctx.moveTo(tx + 8*ts, ty + 3*ts); ctx.lineTo(tx + 8*ts, ty + 30*ts); ctx.stroke();
                    }
                } else if (tier === 4) {
                    ctx.fillStyle = "#4a154b"; let hover = Math.sin(Date.now() / 200 + s.seed * 100) * 4;
                    ctx.beginPath(); ctx.moveTo(tx, ty + hover - 12*ts); ctx.lineTo(tx + 12*ts, ty + hover + 8*ts); ctx.lineTo(tx, ty + hover + 28*ts); ctx.lineTo(tx - 12*ts, ty + hover + 8*ts); ctx.fill(); ctx.stroke();
                    ctx.fillStyle = "#8e44ad"; ctx.beginPath(); ctx.moveTo(tx, ty + hover - 12*ts); ctx.lineTo(tx + 5*ts, ty + hover + 8*ts); ctx.lineTo(tx, ty + hover + 28*ts); ctx.fill(); ctx.stroke();
                }
            } else {
                let bx = s.x, by = s.y, bs = ts;
                if (tier === 0) {
                    if (s.seed < 0.4) {
                        ctx.fillStyle = "#113f21"; ctx.beginPath(); ctx.arc(bx, by, 16 * bs, 0, Math.PI*2); ctx.fill(); ctx.stroke();
                        ctx.fillStyle = "#1e8449"; ctx.beginPath(); ctx.arc(bx + 8 * bs, by, 12 * bs, 0, Math.PI*2); ctx.fill(); ctx.stroke();
                        ctx.beginPath(); ctx.arc(bx - 8 * bs, by, 12 * bs, 0, Math.PI*2); ctx.fill(); ctx.stroke();
                        ctx.fillStyle = "#e74c3c"; ctx.beginPath(); ctx.arc(bx - 6*bs, by - 4*bs, 2, 0, Math.PI*2); ctx.arc(bx + 4*bs, by + 2*bs, 2, 0, Math.PI*2); ctx.arc(bx + 8*bs, by - 6*bs, 2, 0, Math.PI*2); ctx.fill(); ctx.stroke();
                    } else if (s.seed < 0.75) {
                        ctx.fillStyle = "#27ae60";
                        for (let i = 0; i < 5; i++) {
                            ctx.save(); ctx.translate(bx, by); ctx.rotate(-Math.PI/4 + (i * Math.PI/8));
                            ctx.beginPath(); ctx.ellipse(0, -10*bs, 4*bs, 12*bs, 0, 0, Math.PI*2); ctx.fill(); ctx.stroke(); ctx.restore();
                        }
                    } else {
                        ctx.fillStyle = "#1e3d29"; ctx.beginPath(); ctx.arc(bx, by, 14 * bs, 0, Math.PI*2); ctx.fill(); ctx.stroke();
                        ctx.fillStyle = "#e84393"; ctx.beginPath(); ctx.arc(bx - 4*bs, by - 6*bs, 3, 0, Math.PI*2); ctx.arc(bx + 6*bs, by - 2*bs, 3, 0, Math.PI*2); ctx.arc(bx + 1*bs, by + 4*bs, 2, 0, Math.PI*2); ctx.fill(); ctx.stroke();
                    }
                } else if (tier === 1) {
                    if (s.seed < 0.5) {
                        ctx.fillStyle = "#5d6d7e"; ctx.beginPath(); ctx.roundRect(bx - 16*bs, by - 12*bs, 32*bs, 12*bs, [4*bs, 4*bs, 0, 0]); ctx.fill(); ctx.stroke();
                    } else {
                        ctx.fillStyle = "#47525e"; ctx.beginPath(); ctx.arc(bx, by, 12*bs, 0, Math.PI*2); ctx.fill(); ctx.stroke();
                        ctx.fillStyle = "#27ae60"; ctx.beginPath(); ctx.ellipse(bx - 3*bs, by - 6*bs, 8*bs, 4*bs, 0, 0, Math.PI*2); ctx.fill(); ctx.stroke();
                    }
                } else if (tier === 2) {
                    if (s.seed < 0.5) {
                        ctx.fillStyle = "#2c1e1c"; ctx.beginPath(); ctx.ellipse(bx, by, 22*bs, 10*bs, 0, 0, Math.PI*2); ctx.fill(); ctx.stroke();
                        ctx.fillStyle = "#f1c40f"; ctx.beginPath(); ctx.moveTo(bx - 8*bs, by); ctx.lineTo(bx, by - 6*bs); ctx.lineTo(bx + 8*bs, by); ctx.closePath(); ctx.fill(); ctx.stroke();
                    } else {
                        ctx.fillStyle = "#3d0e05"; ctx.beginPath(); ctx.arc(bx, by, 10*bs, Math.PI, 0); ctx.fill(); ctx.stroke();
                        let sizePulse = Math.abs(Math.sin(Date.now() / 300 + s.seed * 10)) * 4 + 2;
                        ctx.fillStyle = "#e67e22"; ctx.beginPath(); ctx.arc(bx - 2*bs, by - 3*bs, sizePulse*bs*0.4, 0, Math.PI*2); ctx.fill(); ctx.stroke();
                    }
                } else if (tier === 3) {
                    if (s.seed < 0.5) {
                        ctx.fillStyle = "#0a2614"; ctx.beginPath(); ctx.ellipse(bx, by, 26*bs, 7*bs, 0, 0, Math.PI*2); ctx.fill(); ctx.stroke();
                    } else {
                        ctx.strokeStyle = "#1b4f30"; ctx.lineWidth = 2; ctx.beginPath();
                        ctx.moveTo(bx - 4, by); ctx.lineTo(bx - 2, by - 14*bs); ctx.moveTo(bx + 4, by); ctx.lineTo(bx + 2, by - 12*bs); ctx.stroke();
                        ctx.fillStyle = "#5c3d1e"; ctx.beginPath(); ctx.rect(bx - 3.5, by - 14*bs, 3, 5*bs); ctx.fill(); ctx.stroke();
                        ctx.beginPath(); ctx.rect(bx + 2.5, by - 12*bs, 3, 4*bs); ctx.fill(); ctx.stroke();
                    }
                } else if (tier === 4) {
                    ctx.fillStyle = "rgba(142, 68, 173, 0.25)"; ctx.beginPath(); ctx.arc(bx, by, 22*bs, 0, Math.PI*2); ctx.fill(); ctx.stroke();
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
            groundGrad.addColorStop(0, "#05010a"); groundGrad.addColorStop(1, "#120224");
            ctx.fillStyle = groundGrad; ctx.fillRect(0, 230, canvas.width, 90);
            ctx.strokeStyle = "rgba(142, 68, 173, 0.45)"; ctx.lineWidth = 1;
            for (let i = -100; i < canvas.width + 100; i += 50) { let gx = i - ((window.groundScroll + totalShift) % 50); ctx.beginPath(); ctx.moveTo(gx, 230); ctx.lineTo(gx - 30, 320); ctx.stroke(); }
        } else if (window.playerStats.isPrestigeBossMode) {
            let groundGrad = ctx.createLinearGradient(0, 230, 0, 320);
            groundGrad.addColorStop(0, "#1c1110"); groundGrad.addColorStop(1, "#080302");
            ctx.fillStyle = groundGrad; ctx.fillRect(0, 230, canvas.width, 90);
            ctx.strokeStyle = "#000000"; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(0, 230); ctx.lineTo(canvas.width, 230); ctx.moveTo(0, 250); ctx.lineTo(canvas.width, 250); ctx.moveTo(0, 274); ctx.lineTo(canvas.width, 274); ctx.moveTo(0, 298); ctx.lineTo(canvas.width, 298); ctx.stroke();
            for (let i = -60; i < canvas.width + 60; i += 80) { let offset = (i - ((window.groundScroll + totalShift) % 80)); ctx.beginPath(); ctx.moveTo(offset, 230); ctx.lineTo(offset + 5, 250); ctx.moveTo(offset + 40, 250); ctx.lineTo(offset + 45, 274); ctx.moveTo(offset - 10, 274); ctx.lineTo(offset - 5, 320); ctx.stroke(); }
            let fissurePulse = Math.sin(Date.now() / 150) * 0.2 + 0.8; ctx.strokeStyle = `rgba(230, 126, 34, ${fissurePulse})`; ctx.lineWidth = 2;
            for (let i = 100; i < canvas.width; i += 180) { let ox = i - ((window.groundScroll + totalShift * 1.5) % 180); ctx.beginPath(); ctx.moveTo(ox, 230); ctx.lineTo(ox + 8, 250); ctx.lineTo(ox - 12, 274); ctx.stroke(); }
        } else if (window.playerStats.isCrucibleMode) {
            let groundGrad = ctx.createLinearGradient(0, 230, 0, 320);
            groundGrad.addColorStop(0, "#0a0316"); groundGrad.addColorStop(1, "#030005");
            ctx.fillStyle = groundGrad; ctx.fillRect(0, 230, canvas.width, 90);
            ctx.strokeStyle = "rgba(155, 89, 182, 0.45)"; ctx.lineWidth = 1;
            for (let i = -100; i < canvas.width + 100; i += 40) { let gx = i - ((window.groundScroll + totalShift) % 40); ctx.beginPath(); ctx.moveTo(gx, 230); ctx.lineTo(gx - 20, 320); ctx.stroke(); }
            ctx.beginPath(); ctx.moveTo(0, 245); ctx.lineTo(canvas.width, 245); ctx.moveTo(0, 265); ctx.lineTo(canvas.width, 265); ctx.stroke();
        } else if (window.playerStats.isDungeonMode) {
            if (window.playerStats.currentDungeon === 'gold') {
                let groundGrad = ctx.createLinearGradient(0, 230, 0, 320); groundGrad.addColorStop(0, "#2c1c0a"); groundGrad.addColorStop(1, "#120a03");
                ctx.fillStyle = groundGrad; ctx.fillRect(0, 230, canvas.width, 90);
                ctx.strokeStyle = "rgba(241, 196, 15, 0.35)"; ctx.lineWidth = 2;
                for (let i = -100; i < canvas.width + 100; i += 120) { let gx = i - ((window.groundScroll + totalShift) % 120); ctx.beginPath(); ctx.moveTo(gx, 250); ctx.quadraticCurveTo(gx + 20, 260, gx + 40, 255); ctx.quadraticCurveTo(gx + 60, 245, gx + 80, 265); ctx.stroke(); }
                ctx.fillStyle = "#3e2723"; ctx.strokeStyle = "#5d6d7e"; ctx.lineWidth = 2;
                for (let i = -60; i < canvas.width + 60; i += 40) { ctx.fillRect(i - ((window.groundScroll + totalShift) % 40), 265, 8, 20); }
                ctx.beginPath(); ctx.moveTo(0, 268); ctx.lineTo(canvas.width, 268); ctx.moveTo(0, 282); ctx.lineTo(canvas.width, 282); ctx.stroke();
            } else if (window.playerStats.currentDungeon === 'mat') {
                let groundGrad = ctx.createLinearGradient(0, 230, 0, 320); groundGrad.addColorStop(0, "#19221c"); groundGrad.addColorStop(1, "#0a0e0b");
                ctx.fillStyle = groundGrad; ctx.fillRect(0, 230, canvas.width, 90);
                ctx.strokeStyle = "#0f1511"; ctx.lineWidth = 1.5;
                for (let i = -120; i < canvas.width + 120; i += 100) { let gx = i - ((window.groundScroll + totalShift) % 100); ctx.beginPath(); ctx.moveTo(gx, 230); ctx.lineTo(gx - 30, 320); ctx.stroke(); ctx.fillStyle = "#1e2821"; ctx.beginPath(); ctx.arc(gx + 5, 245, 2, 0, Math.PI*2); ctx.arc(gx - 15, 280, 2, 0, Math.PI*2); ctx.fill(); }
                ctx.fillStyle = "rgba(46, 204, 113, 0.3)"; ctx.strokeStyle = "#2ecc71"; ctx.lineWidth = 1;
                for (let i = -150; i < canvas.width + 150; i += 180) {
                    let gx = i - ((window.groundScroll + totalShift) % 180); ctx.beginPath(); ctx.ellipse(gx + 40, 262, 35, 12, 0, 0, Math.PI*2); ctx.fill(); ctx.stroke();
                    let bubbleOffset = (Date.now() / 15 + gx) % 24; if (bubbleOffset < 12) { ctx.fillStyle = "rgba(46, 204, 113, 0.55)"; ctx.beginPath(); ctx.arc(gx + 30 + bubbleOffset, 262 - bubbleOffset/4, 2 + bubbleOffset/6, 0, Math.PI*2); ctx.fill(); }
                }
            } else {
                let groundGrad = ctx.createLinearGradient(0, 230, 0, 320); groundGrad.addColorStop(0, "#1c2229"); groundGrad.addColorStop(1, "#0c0f13");
                ctx.fillStyle = groundGrad; ctx.fillRect(0, 230, canvas.width, 90);
                ctx.strokeStyle = "#10141a"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, 230); ctx.lineTo(canvas.width, 230); ctx.moveTo(0, 252); ctx.lineTo(canvas.width, 252); ctx.moveTo(0, 276); ctx.lineTo(canvas.width, 276); ctx.stroke();
                for (let i = -100; i < canvas.width + 100; i += 80) { let gx = i - ((window.groundScroll + totalShift) % 80); ctx.beginPath(); ctx.moveTo(gx, 230); ctx.lineTo(gx, 252); ctx.moveTo(gx + 40, 252); ctx.lineTo(gx + 40, 276); ctx.moveTo(gx + 10, 276); ctx.lineTo(gx + 10, 300); ctx.stroke(); }
            }
        } else {
            if (tier === 0) {
                let groundGrad = ctx.createLinearGradient(0, 230, 0, 320);
                groundGrad.addColorStop(0, "#194d22"); groundGrad.addColorStop(0.15, "#223d1c"); groundGrad.addColorStop(1, "#0c1a0c");
                ctx.fillStyle = groundGrad; ctx.fillRect(0, 230, canvas.width, 90);

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
                let groundGrad = ctx.createLinearGradient(0, 230, 0, 320); groundGrad.addColorStop(0, "#2c3e50"); groundGrad.addColorStop(1, "#111a24");
                ctx.fillStyle = groundGrad; ctx.fillRect(0, 230, canvas.width, 90);
                ctx.strokeStyle = "rgba(52, 152, 219, 0.4)"; ctx.shadowColor = "#3498db"; ctx.lineWidth = 1.5;
                for (let i = -160; i < canvas.width + 160; i += 160) { ctx.save(); let gx = i - ((window.groundScroll + totalShift) % 160); ctx.shadowBlur = Math.sin(Date.now() / 180 + i) * 5 + 5; ctx.beginPath(); ctx.moveTo(gx, 238); ctx.lineTo(gx + 30, 255); ctx.lineTo(gx + 10, 285); ctx.lineTo(gx + 80, 295); ctx.stroke(); ctx.restore(); }
                ctx.strokeStyle = "#1a252f"; ctx.lineWidth = 1.5;
                for (let i = -100; i < canvas.width + 100; i += 100) { let gx = i - ((window.groundScroll + totalShift) % 100); ctx.beginPath(); ctx.moveTo(gx, 230); ctx.quadraticCurveTo(gx + 50, 260, gx + 100, 230); ctx.moveTo(gx + 20, 260); ctx.lineTo(gx - 30, 300); ctx.stroke(); }
            } else if (tier === 2) {
                let groundGrad = ctx.createLinearGradient(0, 230, 0, 320); groundGrad.addColorStop(0, "#1a0805"); groundGrad.addColorStop(1, "#080201");
                ctx.fillStyle = groundGrad; ctx.fillRect(0, 230, canvas.width, 90);
                let pulse = Math.sin(Date.now() / 150) * 0.15 + 0.85;
                for (let i = -140; i < canvas.width + 140; i += 140) {
                    let gx = i - ((window.groundScroll + totalShift) % 140); ctx.strokeStyle = `rgba(230, 126, 34, ${0.8 * pulse})`; ctx.lineWidth = 4;
                    ctx.beginPath(); ctx.moveTo(gx, 230); ctx.quadraticCurveTo(gx + 35, 255, gx + 20, 275); ctx.quadraticCurveTo(gx + 5, 295, gx + 70, 300); ctx.stroke();
                    ctx.strokeStyle = `rgba(241, 196, 15, ${0.9 * pulse})`; ctx.lineWidth = 1.5;
                    ctx.beginPath(); ctx.moveTo(gx, 230); ctx.quadraticCurveTo(gx + 35, 255, gx + 20, 275); ctx.quadraticCurveTo(gx + 5, 295, gx + 70, 300); ctx.stroke();
                }
            } else if (tier === 3) {
                let groundGrad = ctx.createLinearGradient(0, 230, 0, 320); groundGrad.addColorStop(0, "#0e1a12"); groundGrad.addColorStop(1, "#050a07");
                ctx.fillStyle = groundGrad; ctx.fillRect(0, 230, canvas.width, 90);
                ctx.strokeStyle = "#142c1d"; ctx.lineWidth = 3;
                for (let i = -120; i < canvas.width + 120; i += 90) { let gx = i - ((window.groundScroll + totalShift) % 90); ctx.beginPath(); ctx.moveTo(gx, 245); ctx.quadraticCurveTo(gx + 40, 260, gx + 80, 248); ctx.stroke(); }
                for (let i = -200; i < canvas.width + 200; i += 220) {
                    let gx = i - ((window.groundScroll + totalShift) % 220); let pop = (Date.now() / 25 + i) % 70;
                    if (pop < 35) { ctx.fillStyle = "#193f26"; ctx.strokeStyle = "#27ae60"; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(gx + 60, 270, pop/8, 0, Math.PI*2); ctx.fill(); ctx.stroke(); }
                    else if (pop < 42) { ctx.strokeStyle = "rgba(46, 204, 113, " + (1 - (pop-35)/7) + ")"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(gx + 60, 270, (pop-35)*3, (pop-35)*1.2, 0, 0, Math.PI*2); ctx.stroke(); }
                }
            } else {
                let groundGrad = ctx.createLinearGradient(0, 230, 0, 320); groundGrad.addColorStop(0, "#0a0114"); groundGrad.addColorStop(1, "#030005");
                ctx.fillStyle = groundGrad; ctx.fillRect(0, 230, canvas.width, 90);
                ctx.strokeStyle = "rgba(155, 89, 182, 0.35)"; ctx.lineWidth = 1;
                for (let h = 230; h <= 320; h += 14) { ctx.beginPath(); ctx.moveTo(0, h); ctx.lineTo(canvas.width, h); ctx.stroke(); }
                for (let i = -200; i < canvas.width + 200; i += 60) { let gx = i - ((window.groundScroll + totalShift) % 60); ctx.beginPath(); ctx.moveTo(gx, 230); ctx.lineTo(gx * 1.5 - (canvas.width * 0.25), 320); ctx.stroke(); }
            }
        }
    ctx.strokeStyle = "#000000"; ctx.lineWidth = 2.0; ctx.beginPath(); ctx.moveTo(0, 230); ctx.lineTo(canvas.width, 230); ctx.stroke();
    ctx.restore();

    window.beams.forEach(bm => {
        ctx.save(); ctx.globalAlpha = bm.life / bm.maxLife * 0.7;
        let beamGrad = ctx.createLinearGradient(bm.x - 20, 0, bm.x + 20, 0);
        beamGrad.addColorStop(0, "rgba(255,255,255,0)"); beamGrad.addColorStop(0.5, bm.color); beamGrad.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = beamGrad; ctx.fillRect(bm.x - 25, 0, 50, 230); ctx.restore();
    });

    // 4. DYNAMIC HERO RENDERING
    let hx = window.hero.x; let hy = window.hero.y;
    ctx.save();
    let bounce = 0; let slumpRotation = 0; let Yoffset = 0; let deathOpacity = 1.0;

    if (window.deathAnimationTimer > 0) {
        let t = (window.deathMaxFrames - window.deathAnimationTimer) / window.deathMaxFrames;
        slumpRotation = t * Math.PI / 2.2; Yoffset = t * 18; bounce = 0; deathOpacity = Math.max(0, 1.0 - t * 0.85);
        ctx.translate(hx + 12, hy + 15 + Yoffset); ctx.rotate(-slumpRotation); ctx.globalAlpha = deathOpacity;
    } else {
        ctx.translate(hx + 12, hy + 15); bounce = (!window.mob || !window.mob.isStopped) ? Math.abs(Math.sin(Date.now() / 150)) * 3 : 0;
    }

    ctx.strokeStyle = "#000000"; ctx.lineWidth = penHero; ctx.lineJoin = "round";

    if (window.equippedSlots.subweapon) {
        const subType = window.equippedSlots.subweapon.subType;
        let isAegis = window.equippedSlots.subweapon.isUniqueAegis;
        let isWatch = window.equippedSlots.subweapon.isUniqueWatch;
        let isChronicle = window.equippedSlots.subweapon.isUniqueChronicle;

        if (subType === "shield") {
            ctx.save(); ctx.translate(8, 4 + bounce); ctx.fillStyle = isAegis ? "#25033c" : "#7f8c8d";
            ctx.beginPath(); ctx.moveTo(-6, -8); ctx.lineTo(6, -8); ctx.lineTo(8, 0); ctx.lineTo(0, 10); ctx.lineTo(-8, 0); ctx.closePath(); ctx.fill();
            ctx.strokeStyle = isAegis ? "#8e44ad" : "#000000"; ctx.lineWidth = penHero + 0.5; ctx.stroke();
            if (isAegis) { ctx.strokeStyle = "#e84393"; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.moveTo(0, -6); ctx.lineTo(0, 6); ctx.moveTo(-5, 0); ctx.lineTo(5, 0); ctx.stroke(); }
            else { ctx.strokeStyle = "#f1c40f"; ctx.lineWidth = 1.2; ctx.stroke(); }
            ctx.restore();
            if (isAegis && window.deathAnimationTimer === 0) {
                ctx.save(); ctx.translate(8, 4 + bounce); let orbitTime = Date.now() / 250; ctx.fillStyle = "#110221"; ctx.strokeStyle = "#8e44ad"; ctx.lineWidth = 1.0;
                for (let i = 0; i < 2; i++) { let angle = orbitTime + (i * Math.PI); let ox = Math.cos(angle) * 14; let oy = Math.sin(angle) * 6; ctx.beginPath(); ctx.arc(ox, oy, 2.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }
                ctx.restore();
            }
        } else if (subType === "tome") {
            ctx.save(); let tomeFloat = Math.sin(Date.now() / 200) * 5; ctx.translate(24, -6 + bounce + tomeFloat); ctx.rotate(-Math.PI / 12);
            if (isWatch) {
                ctx.fillStyle = "#d4af37"; ctx.strokeStyle = "#000000"; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.arc(0, 0, 8, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
                ctx.fillStyle = "#fdf6e2"; ctx.beginPath(); ctx.arc(0, 0, 5.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
                ctx.strokeStyle = "#111"; ctx.lineWidth = 1.2; let clockTime = Date.now() / 300; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(clockTime) * 4.5, Math.sin(clockTime) * 4.5); ctx.stroke();
            } else if (isChronicle) {
                ctx.fillStyle = "#111116"; ctx.strokeStyle = "#f1c40f"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.roundRect(-5, -7, 10, 14, [1.5]); ctx.fill(); ctx.stroke();
                ctx.fillStyle = "#fff"; ctx.fillRect(3.5, -6, 1.5, 12);
                let pulseRad = 12 + Math.sin(Date.now() / 150) * 2; ctx.strokeStyle = "rgba(241, 196, 15, 0.25)"; ctx.lineWidth = 1.0; ctx.beginPath(); ctx.arc(0, 0, pulseRad, 0, Math.PI * 2); ctx.stroke();
            } else {
                let auraRadius = 14 + Math.sin(Date.now() / 150) * 4; let auraGrad = ctx.createRadialGradient(0, -1, 1, 0, -1, auraRadius);
                auraGrad.addColorStop(0, "rgba(155, 89, 182, 0.65)"); auraGrad.addColorStop(0.5, "rgba(52, 152, 219, 0.25)"); auraGrad.addColorStop(1, "rgba(155, 89, 182, 0)");
                ctx.fillStyle = auraGrad; ctx.beginPath(); ctx.arc(0, -1, auraRadius, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = "#8e44ad"; ctx.beginPath(); ctx.roundRect(-6, -8, 12, 14, [1.5]); ctx.fill(); ctx.strokeStyle = "#000000"; ctx.lineWidth = penHero; ctx.stroke();
                ctx.fillStyle = "#f5f5dc"; ctx.beginPath(); ctx.rect(4, -7, 1.5, 12); ctx.fill(); ctx.stroke();
                ctx.fillStyle = "#f1c40f"; ctx.beginPath(); ctx.arc(0, -1, 1.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
            }
            ctx.restore();
        } else if (subType === "dagger") {
            ctx.save(); ctx.translate(8, 8 + bounce); ctx.rotate(Math.PI / 4);
            ctx.fillStyle = "#1c1c1f"; ctx.beginPath(); ctx.arc(0, 10, 2.5, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = "#000000"; ctx.lineWidth = 1.2; ctx.stroke();
            ctx.fillStyle = "#342240"; ctx.beginPath(); ctx.rect(-1.5, 3, 3, 7); ctx.fill(); ctx.stroke();
            ctx.fillStyle = "#2c3e50"; ctx.beginPath(); ctx.moveTo(-8, 3); ctx.quadraticCurveTo(0, -2, 8, 3); ctx.quadraticCurveTo(0, 2, -8, 3); ctx.closePath(); ctx.fill(); ctx.stroke();
            ctx.fillStyle = "#7f8c8d"; ctx.beginPath(); ctx.moveTo(-2.5, 2.5); ctx.lineTo(0, -12); ctx.lineTo(2.5, 2.5); ctx.closePath(); ctx.fill(); ctx.stroke();
            ctx.fillStyle = "#ffffff"; ctx.beginPath(); ctx.moveTo(0, 2.5); ctx.lineTo(0, -12); ctx.lineTo(2.5, 2.5); ctx.closePath(); ctx.fill();
            if (Math.random() < 0.20 && !window.isGamePaused) {
                window.particles.push({ x: hx + 20, y: hy + 18 + bounce, vx: -window.randFloat(0.3, 0.8), vy: -window.randFloat(0.5, 1.2), radius: window.randFloat(1, 2.2), color: "rgba(142, 68, 173, 0.25)", alpha: 0.8, life: window.randInt(15, 30) });
            }
            ctx.restore();
            let mistCycle = (Date.now() / 150) % 6; ctx.fillStyle = "rgba(46, 204, 113, " + (0.55 - (mistCycle / 12)) + ")";
            ctx.beginPath(); ctx.arc(0, -16 - mistCycle, 1.2 + (mistCycle / 3), 0, Math.PI * 2); ctx.fill();
        }
    }

    ctx.strokeStyle = "#000000"; ctx.lineWidth = penHero;
    ctx.fillStyle = "#c0392b"; ctx.beginPath(); ctx.moveTo(-6, bounce); ctx.lineTo(-18, 15); ctx.lineTo(-2, 18); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#95a5a6"; ctx.beginPath(); ctx.rect(-8, bounce, 14, 16); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#bdc3c7"; ctx.beginPath(); ctx.rect(-10, -14 + bounce, 18, 16); ctx.fill(); ctx.stroke();

    if (window.equippedSlots.helmet && window.equippedSlots.helmet.isUniqueTempest && window.deathAnimationTimer === 0) {
        ctx.save(); ctx.translate(0, -14 + bounce); ctx.strokeStyle = "#00d2ff"; ctx.lineWidth = 2.0; ctx.shadowBlur = 10; ctx.shadowColor = "#00d2ff";
        ctx.beginPath(); ctx.moveTo(-6, -2); ctx.quadraticCurveTo(-14, -12, -18, -8); ctx.quadraticCurveTo(-10, -5, -4, 0); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(6, -2); ctx.quadraticCurveTo(14, -12, 18, -8); ctx.quadraticCurveTo(10, -5, 4, 0); ctx.stroke();
        ctx.restore();
    }

    ctx.fillStyle = "#2c3e50"; ctx.beginPath(); ctx.rect(0, -8 + bounce, 6, 4); ctx.fill(); ctx.stroke();
    ctx.fillStyle = window.playerStats.frenzyTimer > 0 ? "#f1c40f" : "#e74c3c"; ctx.beginPath(); ctx.rect(-5, -20 + bounce, 4, 6); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.rect(-9, -16 + bounce, 8, 4); ctx.fill(); ctx.stroke();

    ctx.save(); ctx.translate(2, 6 + bounce);
    let isStaff = window.equippedSlots.weapon && window.equippedSlots.weapon.isUniqueStaff;
    let isUniqueSword = window.equippedSlots.weapon && window.equippedSlots.weapon.isUniqueSword;
    let isSingularity = window.equippedSlots.weapon && window.equippedSlots.weapon.isUniqueSingularity;
    let isMaelstrom = window.equippedSlots.weapon && window.equippedSlots.weapon.isUniqueMaelstrom;

    if (isSingularity) {
        ctx.rotate(-Math.PI / 8);
        if (window.hero.slashFrame) { ctx.translate(15, -10); ctx.rotate(-Math.PI / 2.3); }
        ctx.fillStyle = "#1e1e24"; ctx.beginPath(); ctx.rect(-2, -2, 4, 10); ctx.fill(); ctx.stroke();
        ctx.fillStyle = "#110221"; ctx.strokeStyle = "#8e44ad"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(-9, 8); ctx.lineTo(9, 8); ctx.lineTo(12, 12); ctx.lineTo(-12, 12); ctx.closePath(); ctx.fill(); ctx.stroke();
        let singPulse = Math.sin(Date.now() / 120) * 0.15 + 0.85; ctx.fillStyle = `rgba(37, 3, 60, ${singPulse})`; ctx.strokeStyle = "#e84393";
        ctx.beginPath(); ctx.moveTo(-3, 12); ctx.lineTo(-1.5, 42); ctx.lineTo(1.5, 42); ctx.lineTo(3, 12); ctx.closePath(); ctx.fill(); ctx.stroke();
        if (window.hero.slashFrame) {
            ctx.fillStyle = "rgba(142, 68, 173, 0.35)"; ctx.beginPath(); ctx.arc(0, 20, 35, 0, Math.PI/2); ctx.lineTo(0,0); ctx.closePath(); ctx.fill();
            ctx.strokeStyle = "rgba(232, 67, 147, 0.6)"; ctx.lineWidth = 2; ctx.stroke();
        }
    } else if (isMaelstrom) {
        ctx.rotate(-Math.PI / 8);
        if (window.hero.slashFrame) { ctx.translate(15, -10); ctx.rotate(-Math.PI / 2.3); }
        ctx.fillStyle = "#5c503b"; ctx.beginPath(); ctx.rect(-1, -6, 2, 44); ctx.fill(); ctx.stroke();
        ctx.fillStyle = "#2ecc71"; ctx.beginPath(); ctx.moveTo(-4, 30); ctx.lineTo(0, 48); ctx.lineTo(4, 30); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.fillStyle = "#27ae60"; ctx.beginPath(); ctx.moveTo(-3, -2); ctx.lineTo(0, -12); ctx.lineTo(3, -2); ctx.closePath(); ctx.fill(); ctx.stroke();
        if (window.hero.slashFrame) {
            ctx.fillStyle = "rgba(46, 204, 113, 0.35)"; ctx.beginPath(); ctx.arc(0, 20, 35, 0, Math.PI/2); ctx.lineTo(0,0); ctx.closePath(); ctx.fill();
            ctx.strokeStyle = "rgba(39, 174, 96, 0.6)"; ctx.lineWidth = 2; ctx.stroke();
        }
    } else if (isStaff) {
        ctx.rotate(-Math.PI / 8);
        if (window.hero.slashFrame) { ctx.translate(15, -10); ctx.rotate(-Math.PI / 2.3); }
        ctx.fillStyle = "#1e1e24"; ctx.beginPath(); ctx.rect(-1.5, -4, 3, 34); ctx.fill(); ctx.stroke();
        ctx.fillStyle = "#f1c40f"; ctx.beginPath(); ctx.moveTo(-7, 30); ctx.quadraticCurveTo(0, 26, 7, 30); ctx.lineTo(9, 36); ctx.quadraticCurveTo(0, 32, -9, 36); ctx.closePath(); ctx.fill(); ctx.stroke();
        let gemPulse = 3.5 + Math.sin(Date.now() / 150) * 1.2; ctx.fillStyle = "#e74c3c"; ctx.beginPath(); ctx.arc(0, 34, gemPulse, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.fillStyle = "#ffffff"; ctx.beginPath(); ctx.arc(-1, 33, 1, 0, Math.PI * 2); ctx.fill();
        if (window.hero.slashFrame) {
            ctx.fillStyle = "rgba(230, 126, 34, 0.35)"; ctx.beginPath(); ctx.arc(0, 20, 35, 0, Math.PI/2); ctx.lineTo(0,0); ctx.closePath(); ctx.fill();
            ctx.strokeStyle = "rgba(231, 76, 60, 0.6)"; ctx.lineWidth = 2; ctx.stroke();
        }
    } else if (isUniqueSword) {
        ctx.rotate(-Math.PI / 8);
        if (window.hero.slashFrame) { ctx.translate(15, -10); ctx.rotate(-Math.PI / 2.3); }
        ctx.fillStyle = "#1e1e24"; ctx.beginPath(); ctx.rect(-2, -2, 4, 10); ctx.fill(); ctx.stroke();
        ctx.fillStyle = "#d4af37"; ctx.beginPath(); ctx.arc(0, -3, 3, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.rect(-7, 8, 14, 4); ctx.fill(); ctx.stroke();
        let bleedPulse = Math.sin(Date.now() / 100) * 0.15 + 0.85; let bladeColor = `rgba(192, 57, 43, ${bleedPulse})`;
        ctx.fillStyle = (window.mob && window.mob.flashTimer > 0) ? "#ffffff" : bladeColor; ctx.strokeStyle = "#960018"; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(-3.5, 12); ctx.lineTo(-2, 37); ctx.lineTo(2, 37); ctx.lineTo(3.5, 12); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.fillStyle = "#ff7f7f"; ctx.beginPath(); ctx.rect(-0.8, 14, 1.6, 18); ctx.fill();
        if (window.hero.slashFrame) {
            ctx.fillStyle = "rgba(192, 57, 43, 0.35)"; ctx.beginPath(); ctx.arc(0, 20, 35, 0, Math.PI/2); ctx.lineTo(0,0); ctx.closePath(); ctx.fill();
            ctx.strokeStyle = "rgba(150, 0, 24, 0.6)"; ctx.lineWidth = 2; ctx.stroke();
        }
    } else {
        if (window.hero.slashFrame) {
            ctx.translate(15, -10); ctx.rotate(-Math.PI / 2.3);
            ctx.fillStyle = "#7f8c8d"; ctx.beginPath(); ctx.rect(-2, -2, 4, 10); ctx.fill(); ctx.stroke();
            ctx.fillStyle = "#8e44ad"; ctx.beginPath(); ctx.rect(-5, 8, 10, 4); ctx.fill(); ctx.stroke();
            ctx.fillStyle = "#ecf0f1"; ctx.beginPath(); ctx.rect(-2, 12, 4, 25); ctx.fill(); ctx.stroke();
            ctx.fillStyle = "rgba(236, 240, 241, 0.4)"; ctx.beginPath(); ctx.arc(0, 20, 35, 0, Math.PI/2); ctx.lineTo(0,0); ctx.closePath(); ctx.fill();
            ctx.strokeStyle = "rgba(0, 0, 0, 0.55)"; ctx.lineWidth = 2; ctx.stroke();
        } else {
            ctx.rotate(-Math.PI / 8);
            ctx.fillStyle = "#7f8c8d"; ctx.beginPath(); ctx.rect(-2, -2, 4, 10); ctx.fill(); ctx.stroke();
            ctx.fillStyle = "#8e44ad"; ctx.beginPath(); ctx.rect(-5, 8, 10, 4); ctx.fill(); ctx.stroke();
            ctx.fillStyle = "#ecf0f1"; ctx.beginPath(); ctx.rect(-2, 12, 4, 25); ctx.fill(); ctx.stroke();
        }
    }
    ctx.restore();

    if (window.equippedSlots.weapon && window.equippedSlots.weapon.isUniqueSingularity && window.playerStats.singularityState === "pulsing" && window.deathAnimationTimer === 0) {
        ctx.save(); ctx.translate(0, -35 + bounce); ctx.rotate(Date.now() / 300); ctx.strokeStyle = "#e84393"; ctx.lineWidth = 1.8; ctx.shadowBlur = 10; ctx.shadowColor = "#e84393";
        ctx.beginPath(); for (let i = 0; i < 6; i++) { let angle = (i * Math.PI) / 3; ctx.lineTo(Math.cos(angle) * 9, Math.sin(angle) * 9); } ctx.closePath(); ctx.stroke();
        ctx.fillStyle = "#ffffff"; ctx.beginPath(); ctx.arc(0, 0, 2, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    }
    ctx.restore();

    // 5. STYLIZED MONSTERS DRAW
    if (window.mob) {
        window.drawSingleMob(ctx, window.mob);
        if (window.mob.hp < window.mob.maxHp && window.mob.type !== "boss" && window.mob.type !== "dungeon_boss" && window.mob.type !== "prestige_boss" && window.mob.type !== "rift_guardian" && window.mob.type !== "aegis_goliath" && window.mob.type !== "chronos_arbitrator" && window.mob.type !== "nexus_overseer") {
            let barW = window.mob.w; let barX = window.mob.x;
            ctx.fillStyle = "#111111"; ctx.beginPath(); ctx.rect(barX, window.mob.y - 13, barW, 7); ctx.fill();
            let trailingPct = Math.max(0, Math.min(1, (window.mob.trailingHp !== undefined ? window.mob.trailingHp : window.mob.hp) / window.mob.maxHp));
            ctx.fillStyle = "#ffffff"; ctx.beginPath(); ctx.rect(barX, window.mob.y - 13, trailingPct * barW, 7); ctx.fill();
            let hpPct = Math.max(0, Math.min(1, window.mob.hp / window.mob.maxHp));
            ctx.fillStyle = "#e74c3c"; ctx.beginPath(); ctx.rect(barX, window.mob.y - 13, hpPct * barW, 7); ctx.fill();
            ctx.strokeStyle = "#000000"; ctx.lineWidth = 2; ctx.strokeRect(barX, window.mob.y - 13, barW, 7);

            if (window.mob.bleedStacks > 0) {
                let dotSize = 2.5; let dotSpacing = 4; let totalWidth = 5 * (dotSize * 2) + 4 * dotSpacing; let startDotX = barX + (barW - totalWidth) / 2; let dotY = window.mob.y - 2;
                for (let i = 0; i < 5; i++) {
                    ctx.beginPath(); ctx.arc(startDotX + i * (dotSize * 2 + dotSpacing) + dotSize, dotY, dotSize, 0, Math.PI * 2);
                    ctx.fillStyle = i < window.mob.bleedStacks ? "#e74c3c" : "#2c3e50"; ctx.fill();
                    ctx.strokeStyle = "#000000"; ctx.lineWidth = 1; ctx.stroke();
                }
            }
        }
    }

    // 6. FAIRIES
    window.activeFairies.forEach(f => {
        let flap = Math.abs(Math.sin(Date.now() / 100 + f.offset)) * 8 + 2; let hover = Math.sin(Date.now() / 200 + f.offset) * 10;
        let fx = f.x; let fy = f.y + hover;
        ctx.save(); ctx.shadowBlur = 15; ctx.shadowColor = f.color || "#ffb6c1";
        ctx.fillStyle = "rgba(255, 255, 255, 0.85)"; ctx.beginPath(); ctx.ellipse(fx - 4, fy - 4, 6, flap, Math.PI/6, 0, Math.PI*2); ctx.ellipse(fx + 4, fy - 4, 6, flap, -Math.PI/6, 0, Math.PI*2); ctx.fill();
        ctx.strokeStyle = "#000000"; ctx.lineWidth = 1.5; ctx.stroke();
        ctx.fillStyle = f.color || "#ffb6c1"; ctx.beginPath(); ctx.arc(fx, fy, 6, 0, Math.PI*2); ctx.fill(); ctx.stroke();
        ctx.restore();
    });

    // 6.5. FOREGROUND SCENERY OBJECTS (Outlines unified)
    window.fgScenery.forEach(s => {
        let sx = s.x, sy = s.y, ss = s.size;
        s.seed = s.seed || Math.random();

        ctx.save();
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = penFgScenery * ss;
        ctx.lineJoin = "round";

        if (window.playerStats.isCrucibleMode || window.playerStats.isPrestigeBossMode || window.playerStats.isUberBoss) {
            ctx.restore();
            return; // Block foreground scenery in space / lava castle
        }
        if (window.playerStats.isDungeonMode) {
            if (window.playerStats.currentDungeon === 'gold') {
                if (s.type === 'grass') {
                    ctx.fillStyle = "#f1c40f"; ctx.beginPath();
                    ctx.moveTo(sx - 5*ss, sy); ctx.lineTo(sx - 2*ss, sy - 6*ss); ctx.lineTo(sx + 4*ss, sy - 7*ss); ctx.lineTo(sx + 7*ss, sy - 2*ss); ctx.lineTo(sx + 2*ss, sy); ctx.closePath(); ctx.fill(); ctx.stroke();
                    ctx.fillStyle = "#ffffff"; ctx.fillRect(sx, sy - 5*ss, 1.5, 1.5);
                } else if (s.type === 'flower') {
                    ctx.fillStyle = "#3e2723"; ctx.beginPath(); ctx.rect(sx - 2, sy - 30*ss, 4, 30*ss); ctx.fill(); ctx.stroke();
                    ctx.beginPath(); ctx.rect(sx - 2, sy - 30*ss, 12*ss, 3*ss); ctx.fill(); ctx.stroke();
                    let lx = sx + 8*ss, ly = sy - 27*ss;
                    ctx.fillStyle = "#2c3e50"; ctx.beginPath(); ctx.rect(lx - 3, ly, 6, 8); ctx.fill(); ctx.stroke();
                    let glow = ctx.createRadialGradient(lx, ly + 4, 1, lx, ly + 4, 16*ss);
                    glow.addColorStop(0, "rgba(241, 196, 15, 0.8)"); glow.addColorStop(1, "rgba(241, 196, 15, 0)");
                    ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(lx, ly + 4, 16*ss, 0, Math.PI*2); ctx.fill();
                } else {
                    ctx.fillStyle = "#5c4033"; ctx.beginPath(); ctx.rect(sx - 10*ss, sy - 20*ss, 20*ss, 20*ss); ctx.fill(); ctx.stroke();
                    ctx.beginPath(); ctx.moveTo(sx - 10*ss, sy - 20*ss); ctx.lineTo(sx + 10*ss, sy); ctx.stroke();
                }
            } else if (window.playerStats.currentDungeon === 'mat') {
                if (s.type === 'grass') {
                    ctx.fillStyle = "#27ae60"; ctx.beginPath(); ctx.ellipse(sx, sy - 3*ss, 9*ss, 5*ss, 0, 0, Math.PI*2); ctx.fill(); ctx.stroke();
                    ctx.fillStyle = "#2ecc71"; ctx.beginPath(); ctx.arc(sx, sy - 5*ss, 2.5*ss, 0, Math.PI*2); ctx.fill(); ctx.stroke();
                } else if (s.type === 'flower') {
                    ctx.fillStyle = "#95a5a6"; ctx.beginPath(); ctx.rect(sx - 1.5*ss, sy - 12*ss, 3*ss, 12*ss); ctx.fill(); ctx.stroke();
                    ctx.fillStyle = "#2ecc71"; ctx.beginPath(); ctx.arc(sx, sy - 12*ss, 7*ss, Math.PI, 0); ctx.fill(); ctx.stroke();
                } else {
                    ctx.fillStyle = "#7f8c8d"; ctx.beginPath(); ctx.rect(sx - 8*ss, sy - 18*ss, 16*ss, 18*ss); ctx.fill(); ctx.stroke();
                    ctx.fillStyle = "#34495e"; ctx.beginPath(); ctx.rect(sx - 8*ss, sy - 15*ss, 16*ss, 2*ss); ctx.fill(); ctx.stroke();
                    ctx.beginPath(); ctx.rect(sx - 8*ss, sy - 6*ss, 16*ss, 2*ss); ctx.fill(); ctx.stroke();
                }
            } else {
                if (s.type === 'grass') {
                    ctx.fillStyle = "#34495e"; ctx.beginPath(); ctx.moveTo(sx - 4*ss, sy); ctx.lineTo(sx, sy - 14*ss); ctx.lineTo(sx + 4*ss, sy); ctx.closePath(); ctx.fill(); ctx.stroke();
                } else if (s.type === 'flower') {
                    ctx.fillStyle = "#ecf0f1"; ctx.beginPath(); ctx.arc(sx, sy - 4*ss, 4*ss, 0, Math.PI*2); ctx.fill(); ctx.stroke();
                    ctx.beginPath(); ctx.rect(sx - 2*ss, sy - 2*ss, 4*ss, 3*ss); ctx.fill(); ctx.stroke();
                } else {
                    ctx.fillStyle = "#2c3e50"; ctx.beginPath(); ctx.rect(sx - 1.5, sy - 16*ss, 3, 16*ss); ctx.fill(); ctx.stroke();
                    ctx.fillStyle = "#7f8c8d"; ctx.beginPath(); ctx.arc(sx, sy - 14*ss, 6*ss, 0, Math.PI*2); ctx.fill(); ctx.stroke();
                }
            }
        } else {
            if (tier === 0) {
                if (s.type === 'grass') {
                    ctx.fillStyle = "#2ecc71";
                    let sway = Math.sin(Date.now() / 250 + s.seed * 100) * 4 * ss;
                    ctx.beginPath(); ctx.moveTo(sx, sy); ctx.quadraticCurveTo(sx - 3*ss + sway, sy - 15*ss, sx - 8*ss + sway, sy - 22*ss); ctx.quadraticCurveTo(sx - 2*ss + sway, sy - 10*ss, sx + 2*ss, sy);
                    ctx.moveTo(sx + 3*ss, sy); ctx.quadraticCurveTo(sx + 5*ss + sway, sy - 18*ss, sx + 2*ss + sway, sy - 26*ss); ctx.quadraticCurveTo(sx + 7*ss + sway, sy - 12*ss, sx + 8*ss, sy); ctx.fill(); ctx.stroke();
                } else if (s.type === 'flower') {
                    let swayF = Math.sin(Date.now() / 200 + s.seed * 100) * 3 * ss; let fx = sx + swayF, fy = sy - 14*ss;
                    ctx.fillStyle = "#27ae60"; ctx.beginPath(); ctx.rect(sx - 1*ss, sy - 14*ss, 2*ss, 14*ss); ctx.fill(); ctx.stroke();
                    ctx.beginPath(); ctx.ellipse(sx - 4*ss, sy - 6*ss, 4*ss, 2*ss, Math.PI/4, 0, Math.PI*2); ctx.ellipse(sx + 4*ss, sy - 10*ss, 4*ss, 2*ss, -Math.PI/4, 0, Math.PI*2); ctx.fill(); ctx.stroke();

                    ctx.fillStyle = s.color;
                    for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 3) {
                        ctx.beginPath(); ctx.arc(fx + Math.cos(angle)*5*ss, fy + Math.sin(angle)*5*ss, 4*ss, 0, Math.PI*2); ctx.fill(); ctx.stroke();
                    }
                    ctx.fillStyle = "#f1c40f"; ctx.beginPath(); ctx.arc(fx, fy, 3.5*ss, 0, Math.PI*2); ctx.fill(); ctx.stroke();
                } else {
                                    if (s.seed < 0.5) {
                                        ctx.fillStyle = "#196f3d"; ctx.beginPath(); ctx.arc(sx, sy - 10*ss, 16*ss, 0, Math.PI*2); ctx.arc(sx - 12*ss, sy - 6*ss, 12*ss, 0, Math.PI*2); ctx.arc(sx + 12*ss, sy - 6*ss, 12*ss, 0, Math.PI*2); ctx.fill(); ctx.stroke();
                                    } else {
                                        ctx.fillStyle = "#1e824c";
                                        for (let i = 0; i < 4; i++) {
                                            let curve = Math.sin(Date.now() / 180 + s.seed * 50 + i) * 3;
                                            ctx.beginPath(); ctx.moveTo(sx - 6 + i*4, sy);
                                            ctx.quadraticCurveTo(sx + curve, sy - 25*ss, sx - 10 + i*6 + curve, sy - 28*ss);
                                            ctx.quadraticCurveTo(sx + curve, sy - 10, sx + 6, sy); ctx.fill(); ctx.stroke();
                                        }
                                    }

                                    // Nested glistening spider egg sacs inside the foreground bushes of Tier 0
                                    if (s.seed < 0.4) {
                                        ctx.save();
                                        // Glistening cobwebs anchoring the egg cluster
                                        ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
                                        ctx.lineWidth = 0.8;
                                        ctx.beginPath();
                                        ctx.moveTo(sx - 8 * ss, sy - 10 * ss); ctx.lineTo(sx + 8 * ss, sy - 4 * ss);
                                        ctx.moveTo(sx - 4 * ss, sy - 16 * ss); ctx.lineTo(sx + 4 * ss, sy - 2 * ss);
                                        ctx.stroke();

                                        // Silk-wrapped egg sac cluster (3 small overlapping textured orbs)
                                        ctx.fillStyle = "rgba(240, 240, 245, 0.9)";
                                        ctx.strokeStyle = "#150802";
                                        ctx.lineWidth = 1.0;
                                        ctx.beginPath(); ctx.arc(sx - 2 * ss, sy - 10 * ss, 3.5 * ss, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
                                        ctx.beginPath(); ctx.arc(sx + 2 * ss, sy - 8 * ss, 3.2 * ss, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
                                        ctx.beginPath(); ctx.arc(sx, sy - 13 * ss, 2.8 * ss, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
                                        ctx.restore();
                                    }
                                }
                            } else if (tier === 1) {
                if (s.type === 'grass') {
                    ctx.fillStyle = "#7f8c8d"; ctx.beginPath(); ctx.arc(sx, sy - 2*ss, 4*ss, 0, Math.PI*2); ctx.fill(); ctx.stroke();
                } else if (s.type === 'flower') {
                    ctx.fillStyle = "#7f8c8d"; ctx.strokeStyle = "#5d6d7e"; ctx.lineWidth = 1;
                    ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx - 10*ss, sy - 12*ss); ctx.lineTo(sx + 10*ss, sy - 12*ss); ctx.closePath(); ctx.fill(); ctx.stroke();
                } else {
                    ctx.strokeStyle = "#5d6d7e"; ctx.lineWidth = 1.5;
                    ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx - 8*ss, sy - 15*ss); ctx.moveTo(sx, sy); ctx.lineTo(sx + 8*ss, sy - 18*ss); ctx.stroke();
                }
            } else if (tier === 2) {
                if (s.type === 'grass') {
                    let hover = (Date.now() / 15 + s.seed * 300) % 30; ctx.fillStyle = "rgba(231, 76, 60, " + (1 - hover/30) + ")";
                    ctx.beginPath(); ctx.arc(sx, sy - hover, 2.5*ss, 0, Math.PI*2); ctx.fill(); ctx.stroke();
                } else if (s.type === 'flower') {
                    ctx.fillStyle = "#110200"; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.quadraticCurveTo(sx - 3*ss, sy - 8*ss, sx - 6*ss, sy - 12*ss); ctx.lineTo(sx + 6*ss, sy); ctx.fill(); ctx.stroke();
                } else {
                    ctx.fillStyle = "#2c0e08"; ctx.beginPath(); ctx.moveTo(sx - 14*ss, sy); ctx.lineTo(sx, sy - 6*ss); ctx.lineTo(sx + 14*ss, sy); ctx.closePath(); ctx.fill(); ctx.stroke();
                }
            } else if (tier === 3) {
                if (s.type === 'grass') {
                    ctx.fillStyle = "#144222"; ctx.beginPath(); ctx.ellipse(sx, sy - 2*ss, 12*ss, 4*ss, 0, 0, Math.PI*2); ctx.fill(); ctx.stroke();
                } else if (s.type === 'flower') {
                    ctx.fillStyle = "#5c503b"; ctx.beginPath(); ctx.rect(sx - 1.5*ss, sy - 14*ss, 3*ss, 14*ss); ctx.fill(); ctx.stroke();
                    ctx.fillStyle = "#9b59b6"; ctx.beginPath(); ctx.arc(sx, sy - 14*ss, 7*ss, Math.PI, 0); ctx.fill(); ctx.stroke();
                } else {
                    ctx.fillStyle = "#0c1a0c"; ctx.beginPath(); ctx.ellipse(sx, sy, 15*ss, 7*ss, 0, 0, Math.PI*2); ctx.fill(); ctx.stroke();
                }
            } else {
                if (s.type === 'grass') {
                    let rot = Date.now() / 800 + s.seed * 100; ctx.fillStyle = "rgba(155, 89, 182, 0.7)";
                    ctx.save(); ctx.translate(sx, sy - 8); ctx.rotate(rot); ctx.beginPath(); ctx.rect(-2*ss, -2*ss, 4*ss, 4*ss); ctx.fill(); ctx.stroke(); ctx.restore();
                } else if (s.type === 'flower') {
                    let hover = Math.sin(Date.now() / 300 + s.seed * 100) * 6;
                    ctx.fillStyle = "#9b59b6"; ctx.beginPath(); ctx.moveTo(sx, sy - 16 + hover); ctx.lineTo(sx + 4*ss, sy - 8 + hover); ctx.lineTo(sx, sy + hover); ctx.lineTo(sx - 4*ss, sy - 8 + hover); ctx.closePath(); ctx.fill(); ctx.stroke();
                } else {
                    let angle = Date.now() / 200; ctx.save(); ctx.translate(sx, sy - 4); ctx.rotate(angle);
                    let grad = ctx.createRadialGradient(0, 0, 1, 0, 0, 14*ss); grad.addColorStop(0, "#000"); grad.addColorStop(0.5, "#8e44ad"); grad.addColorStop(1, "rgba(26,188,156,0)");
                    ctx.fillStyle = grad; ctx.beginPath(); ctx.ellipse(0, 0, 16*ss, 6*ss, 0, 0, Math.PI*2); ctx.fill(); ctx.stroke(); ctx.restore();
                }
            }
        }
        ctx.restore();
    });

    // 7. REVIVE EFFECT
    if (window.reviveTimer > 0) {
        ctx.save();
        let t = (90 - window.reviveTimer) / 90; let beamX = window.hero.x + 12; let groundY = 230;
        ctx.lineWidth = 3 * (1 - t);
        for (let i = 0; i < 3; i++) {
            let ringProgress = (t + i * 0.25) % 1.0; let ringAlpha = (1 - ringProgress) * 0.8;
            ctx.strokeStyle = `rgba(241, 196, 15, ${ringAlpha})`; ctx.beginPath(); ctx.ellipse(beamX, groundY, ringProgress * 120, ringProgress * 25, 0, 0, Math.PI * 2); ctx.stroke();
        }
        let outerBeam = ctx.createLinearGradient(beamX - 45, 0, beamX + 45, 0);
        outerBeam.addColorStop(0, "rgba(26, 188, 15, 0)"); outerBeam.addColorStop(0.5, "rgba(26, 188, 15, " + (0.35 * (1 - t)) + ")"); outerBeam.addColorStop(1, "rgba(26, 188, 15, 0)");
        ctx.fillStyle = outerBeam; ctx.fillRect(beamX - 45, 0, 90, groundY);
        let innerBeam = ctx.createLinearGradient(beamX - 15, 0, beamX + 15, 0);
        innerBeam.addColorStop(0, "rgba(255, 255, 255, 0)"); innerBeam.addColorStop(0.5, "rgba(255, 243, 176, " + (0.85 * (1 - t)) + ")"); innerBeam.addColorStop(1, "rgba(255, 255, 255, 0)");
        ctx.fillStyle = innerBeam; ctx.fillRect(beamX - 15, 0, 30, groundY);
        ctx.fillStyle = "rgba(254, 211, 48, " + (1 - t) + ")";
        for (let i = 0; i < 10; i++) {
            let sparkSeed = Math.sin(i * 45.3) * 0.5 + 0.5; let sparkY = groundY - (((t * 220) + (sparkSeed * 180)) % 180);
            ctx.beginPath(); ctx.arc(beamX + Math.sin(t * 8 + i) * 12 * sparkSeed, sparkY, (2 + sparkSeed * 3.5) * (1 - t), 0, Math.PI * 2); ctx.fill();
        }
        if (t < 0.3) { ctx.fillStyle = `rgba(255, 253, 235, ${(1 - (t / 0.3)) * 0.5})`; ctx.fillRect(0, 0, canvas.width, canvas.height); }
        ctx.restore();
        window.reviveTimer--;
    }

    if (window.deathAnimationTimer > 0) {
        ctx.save(); let t = (window.deathMaxFrames - window.deathAnimationTimer) / window.deathMaxFrames; let centerX = window.hero.x + 12; let centerY = window.hero.y + 15;
        let vignette = ctx.createRadialGradient(centerX, centerY, Math.max(10, 200 * (1 - t)), centerX, centerY, Math.max(100, 600 * (1 - t)));
        vignette.addColorStop(0, "rgba(0, 0, 0, 0)"); vignette.addColorStop(0.5, "rgba(20, 0, 0, " + (t * 0.60) + ")"); vignette.addColorStop(1, "rgba(0, 0, 0, " + (t * 0.95) + ")");
        ctx.fillStyle = vignette; ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.restore();
    }

    // 8. PROJECTILES
    window.projectiles.forEach(proj => {
        ctx.save(); ctx.strokeStyle = "#000000"; ctx.lineWidth = 2.0;
        let currentRad = proj.r + Math.sin(Date.now() / 80 + proj.pulseOffset) * 2;
        if (proj.isMaelstromCrescent) {
            ctx.fillStyle = "#2ecc71"; ctx.beginPath(); ctx.arc(proj.x, proj.y, currentRad, -Math.PI / 3, Math.PI / 3, false); ctx.quadraticCurveTo(proj.x - currentRad / 2, proj.y, proj.x, proj.y - currentRad * Math.sin(Math.PI / 3)); ctx.closePath(); ctx.fill(); ctx.stroke();
            ctx.strokeStyle = "#fff"; ctx.lineWidth = 1.2; ctx.stroke();
        } else {
            ctx.fillStyle = "#c0392b"; ctx.beginPath(); ctx.arc(proj.x, proj.y, currentRad + 3, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
            ctx.fillStyle = "#e67e22"; ctx.beginPath(); ctx.arc(proj.x, proj.y, currentRad, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
            ctx.fillStyle = "#f1c40f"; ctx.beginPath(); ctx.arc(proj.x, proj.y, currentRad * 0.55, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
            ctx.fillStyle = "#ffffff"; ctx.beginPath(); ctx.arc(proj.x - 2, proj.y - 2, currentRad * 0.25, 0, Math.PI * 2); ctx.fill();
        }
        ctx.restore();
    });

    if (window.getStageTier() === 1 && !window.playerStats.isDungeonMode) {
        ctx.save(); ctx.fillStyle = "rgba(240, 248, 255, 0.85)"; ctx.shadowColor = "#ffffff"; ctx.shadowBlur = 2;
        window.snowflakes.forEach(sf => { ctx.beginPath(); ctx.arc(sf.x, sf.y, sf.r, 0, Math.PI * 2); ctx.fill(); });
        ctx.restore();
    }

    // 9. BOSS UI
    if (window.mob && ["boss", "dungeon_boss", "prestige_boss", "rift_guardian", "aegis_goliath", "chronos_arbitrator", "nexus_overseer"].includes(window.mob.type)) {
        ctx.save();
        let bossName = "Threat Detected"; let barColor = "#e74c3c"; let barGlow = "#c0392b";
        if (window.mob.type === "prestige_boss") { bossName = "Hooktail, The Scarlet Calamity"; barColor = "#e67e22"; barGlow = "#f1c40f"; }
        else if (window.mob.type === "aegis_goliath") { bossName = "Aegis Goliath, The Iron Sentinel"; barColor = "#3498db"; barGlow = "#2ecc71"; }
        else if (window.mob.type === "chronos_arbitrator") { bossName = "Chronos Arbitrator, The Timeless God"; barColor = "#f1c40f"; barGlow = "#dca04c"; }
        else if (window.mob.type === "nexus_overseer") { bossName = "Nexus Overseer, The Glitch Singularity"; barColor = "#ff007f"; barGlow = "#e84393"; }
        else if (window.mob.type === "dungeon_boss") {
            if (window.mob.isCrucible) { bossName = "Astral Guardian"; barColor = "#8e44ad"; barGlow = "#e84393"; }
            else {
                let dType = window.playerStats.currentDungeon || 'gold';
                if (dType === 'gold') { bossName = "Gilded Vault Keeper"; barColor = "#f1c40f"; barGlow = "#d4af37"; }
                else if (dType === 'mat') { bossName = "Corrosive Abomination"; barColor = "#2ecc71"; barGlow = "#27ae60"; }
                else { bossName = "Overlord of the Iron Vault"; barColor = "#3498db"; barGlow = "#2980b9"; }
            }
        } else { bossName = "Stage Warden"; }

        let barW = canvas.width * (canvas.width <= 420 ? 0.75 : 0.55); let barH = 14; let barX = (canvas.width - barW) / 2; let barY = 52;
        ctx.fillStyle = "#111111"; ctx.strokeStyle = "#000000"; ctx.lineWidth = 3; ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(barX, barY, barW, barH, 4); else ctx.rect(barX, barY, barW, barH);
        ctx.fill(); ctx.stroke();

        let trailingPct = Math.max(0, Math.min(1, (window.mob.trailingHp || window.mob.hp) / window.mob.maxHp));
        ctx.fillStyle = "#ffffff"; ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(barX + 2, barY + 2, Math.max(0, (barW - 4) * trailingPct), barH - 4, 2); else ctx.rect(barX + 2, barY + 2, Math.max(0, (barW - 4) * trailingPct), barH - 4);
        ctx.fill();

        let hpPct = Math.max(0, Math.min(1, window.mob.hp / window.mob.maxHp));
        let fillGrad = ctx.createLinearGradient(barX, barY, barX, barY + barH);
        fillGrad.addColorStop(0, barColor); fillGrad.addColorStop(1, barGlow);
        ctx.fillStyle = fillGrad; ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(barX + 2, barY + 2, Math.max(0, (barW - 4) * hpPct), barH - 4, 2); else ctx.rect(barX + 2, barY + 2, Math.max(0, (barW - 4) * hpPct), barH - 4);
        ctx.fill();

        if (window.mob.funnyTextTimer > 0 && window.mob.funnyText) {
            ctx.save(); ctx.font = "bold 9px monospace"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.strokeStyle = "#000000"; ctx.lineWidth = 3;
            ctx.strokeText(window.mob.funnyText, barX + barW / 2, barY + barH / 2); ctx.fillStyle = "#ffffff"; ctx.fillText(window.mob.funnyText, barX + barW / 2, barY + barH / 2); ctx.restore();
        }

        ctx.font = "bold 11px sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "bottom"; ctx.strokeStyle = "#000000"; ctx.lineWidth = 3;
        ctx.strokeText(bossName, canvas.width / 2, barY - 4); ctx.fillStyle = "#ffffff"; ctx.fillText(bossName, canvas.width / 2, barY - 4);

        if (window.mob.bleedStacks > 0) {
            let dotSize = 4; let dotSpacing = 6; let totalWidth = 5 * (dotSize * 2) + 4 * dotSpacing; let startDotX = (canvas.width - totalWidth) / 2; let dotY = barY + barH + 7;
            for (let i = 0; i < 5; i++) {
                ctx.beginPath(); ctx.arc(startDotX + i * (dotSize * 2 + dotSpacing) + dotSize, dotY, dotSize, 0, Math.PI * 2);
                if (i < window.mob.bleedStacks) { ctx.fillStyle = "#e74c3c"; ctx.shadowColor = "#e74c3c"; ctx.shadowBlur = 4; } else { ctx.fillStyle = "rgba(44, 62, 80, 0.7)"; }
                ctx.fill(); ctx.strokeStyle = "#000000"; ctx.lineWidth = 1.2; ctx.stroke(); ctx.shadowBlur = 0;
            }
        }
        ctx.restore();
    }

    // 10. BUFF ICONS & DPS HUD
    let pStats = window.resolvePlayerStats(); let activeBuffsList = [];
        let potDurationMax = 18000 * (1 + pStats.int * 0.001); let normalBuffMax = window.checkArtifactTrait("extend_buffs") ? 900 : 600;

        if (window.playerStats.frenzyTimer > 0) activeBuffsList.push({ icon: "🔥", timer: window.playerStats.frenzyTimer, max: normalBuffMax, color: "#e67e22" });
        if (window.playerStats.adrenalineTimer > 0) activeBuffsList.push({ icon: "⚡", timer: window.playerStats.adrenalineTimer, max: normalBuffMax, color: "#f1c40f" });
        if (window.playerStats.atkPotionTimer > 0) activeBuffsList.push({ icon: "⚔️", timer: window.playerStats.atkPotionTimer, max: potDurationMax, color: "#2ecc71" });
        if (window.playerStats.hpPotionTimer > 0) activeBuffsList.push({ icon: "❤️", timer: window.playerStats.hpPotionTimer, max: potDurationMax, color: "#e74c3c" });
        if (window.playerStats.defPotionTimer > 0) activeBuffsList.push({ icon: "🛡️", timer: window.playerStats.defPotionTimer, max: potDurationMax, color: "#3498db" });
        if (window.playerStats.hastePotionTimer > 0) activeBuffsList.push({ icon: "👟", timer: window.playerStats.hastePotionTimer, max: potDurationMax, color: "#f1c40f" });
        if (window.playerStats.xpPotionTimer > 0) activeBuffsList.push({ icon: "🧠", timer: window.playerStats.xpPotionTimer, max: potDurationMax, color: "#a855f7" });
        if (window.playerStats.dropPotionTimer > 0) activeBuffsList.push({ icon: "🍀", timer: window.playerStats.dropPotionTimer, max: potDurationMax, color: "#22c55e" });
        if (window.playerStats.qlyPotionTimer > 0) activeBuffsList.push({ icon: "💎", timer: window.playerStats.qlyPotionTimer, max: potDurationMax, color: "#ec4899" });

    if (window.equippedSlots.weapon && window.equippedSlots.weapon.isUniqueSingularity) {
        if (window.playerStats.singularityState === "dormant") activeBuffsList.push({ icon: "🌌", timer: window.playerStats.singularityTimer || 1800, max: 1800, color: "#5b2c6f" });
        else if (window.playerStats.singularityState === "pulsing") activeBuffsList.push({ icon: "💫", timer: window.playerStats.singularityTimer || 420, max: 420, color: Math.floor(Date.now() / 150) % 2 === 0 ? "#ff007f" : "#8e44ad" });
        else if (window.playerStats.singularityState === "storing") activeBuffsList.push({ icon: "⚛️", timer: window.playerStats.singularityTimer || 300, max: 300, color: "#e84393" });
    }

    let startX = 15; let startY = 10; let iconSize = 28; let spacing = 8;
    activeBuffsList.forEach((buff, idx) => {
        let bx = startX + idx * (iconSize + spacing); let by = startY;
        ctx.save(); ctx.fillStyle = "#1c1c1c"; ctx.strokeStyle = "#000000"; ctx.lineWidth = 2; ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(bx, by, iconSize, iconSize, 4); else ctx.rect(bx, by, iconSize, iconSize);
        ctx.fill(); ctx.stroke();
        let progressPct = Math.min(1, buff.timer / buff.max); ctx.beginPath();
        ctx.arc(bx + iconSize / 2, by + iconSize / 2, iconSize / 2 - 2, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * progressPct));
        ctx.strokeStyle = buff.color; ctx.lineWidth = 2.5; ctx.stroke();
        ctx.fillStyle = "#ffffff"; ctx.font = "12px sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(buff.icon, bx + iconSize / 2, by + iconSize / 2);
        let secondsLeft = Math.ceil(buff.timer / 60); ctx.font = "bold 8px monospace"; ctx.strokeStyle = "#000000"; ctx.lineWidth = 2;
        ctx.strokeText(secondsLeft + "s", bx + iconSize / 2, by + iconSize + 6); ctx.fillText(secondsLeft + "s", bx + iconSize / 2, by + iconSize + 6);
        ctx.restore();
    });

    window.particles.forEach(pt => {
        ctx.save(); if (pt.alpha !== undefined) ctx.globalAlpha = pt.alpha;
        ctx.fillStyle = pt.color; ctx.beginPath(); ctx.arc(pt.x, pt.y, pt.radius, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    });

    window.effects.forEach(eff => {
        ctx.font = "bold 18px sans-serif"; ctx.strokeStyle = "#000000"; ctx.lineWidth = 4; ctx.lineJoin = "miter"; ctx.miterLimit = 2;
        ctx.strokeText(eff.text, eff.x, eff.y); ctx.fillStyle = eff.color; ctx.fillText(eff.text, eff.x, eff.y);
    });

    if (window.isGamePaused && document.getElementById('death-overlay') && document.getElementById('death-overlay').style.display === "flex") {
        window.renderNemesisPreview(window.playerStats.killedByMob);
    }
};