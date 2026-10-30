/**
 * Ruins of Valdor - Client Game Loop (game.js)
 *
 * Technologies: JavaScript (ES6+), XML via DOMParser, REST API with C++ backend
 * Handles character creation, 38 monster types, poison status ticks, and defensive stance.
 */

const API_URL = "/api";

let player = {
    name: "Valen the Brave",
    heroClass: "Rune Knight",
    styleId: "knight",
    sprite: "🛡️",
    level: 1,
    hp: 100,
    maxHp: 100,
    mana: 50,
    maxMana: 50,
    gold: 25,
    xp: 0,
    wins: 0,
    deaths: 0
};

let currentEnemy = null;
let monstersList = [];
let isActing = false;
let statusEffects = { poisonTurns: 0, burnTurns: 0 };

// 1. Fetch & Parse XML with DOMParser
async function loadMonstersFromXML() {
    log("📜 Fetching monster data from enemies.xml...");
    try {
        const res = await fetch("enemies.xml");
        const xmlText = await res.text();

        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, "application/xml");

        const parserError = xmlDoc.querySelector("parsererror");
        if (parserError) {
            throw new Error("XML Parsing failed: " + parserError.textContent);
        }

        const monsterNodes = xmlDoc.getElementsByTagName("monster");
        monstersList = [];

        for (let i = 0; i < monsterNodes.length; i++) {
            const node = monsterNodes[i];
            const getVal = (tag, fallback = "") => {
                const el = node.getElementsByTagName(tag)[0];
                return el ? el.textContent.trim() : fallback;
            };

            const specialAbility =
                getVal("specialAbility") ||
                getVal("ability") ||
                (getVal("specialMove").toLowerCase().includes("poison") || getVal("element").toLowerCase().includes("poison")
                    ? "poison"
                    : getVal("specialMove").toLowerCase().includes("shield") || getVal("specialMove").toLowerCase().includes("shell")
                    ? "defensive_stance"
                    : "none");

            monstersList.push({
                id: node.getAttribute("id") || `monster_${i}`,
                name: getVal("name", "Unknown Creature"),
                maxHp: parseInt(getVal("maxHp", "50"), 10),
                hp: parseInt(getVal("maxHp", "50"), 10),
                atk: parseInt(getVal("attackPower", "12"), 10),
                gold: parseInt(getVal("goldReward", "20"), 10),
                sprite: getVal("sprite", "👾"),
                element: getVal("element", "Neutral"),
                weakness: getVal("weakness", "None"),
                specialMove: getVal("specialMove", "Strike"),
                specialAbility: specialAbility,
                expReward: parseInt(getVal("expReward", "25"), 10),
                lore: getVal("lore", "A denizen of the ruins."),
                isDefending: false
            });
        }

        log(`✨ Successfully parsed ${monstersList.length} monsters from XML via DOMParser.`);
        spawnEnemy();
    } catch (err) {
        log(`❌ Error loading XML: ${err.message}`);
        monstersList = [
            { id: "goblin", name: "Cave Goblin", maxHp: 45, hp: 45, atk: 10, gold: 15, sprite: "👺", element: "Earth", weakness: "Fire", specialAbility: "none", lore: "Scavenger of the ruins." },
            { id: "skeleton", name: "Skeleton Knight", maxHp: 75, hp: 75, atk: 16, gold: 30, sprite: "💀", element: "Undead", weakness: "Holy", specialAbility: "defensive_stance", lore: "Ancient sentry." }
        ];
        spawnEnemy();
    }
}

// 2. Fetch Player Profile from C++ Backend (SQLite persistent DB)
async function loadPlayerFromCpp() {
    try {
        const res = await fetch(`${API_URL}/player`);
        if (res.ok) {
            const data = await res.json();
            player.name = data.name || player.name;
            player.heroClass = data.class || player.heroClass;
            player.styleId = data.styleId || player.styleId || "knight";
            player.sprite = data.sprite || player.sprite || "🛡️";
            player.level = data.level || player.level;
            player.hp = data.hp !== undefined ? data.hp : player.hp;
            player.maxHp = data.maxHp !== undefined ? data.maxHp : player.maxHp;
            player.mana = data.mana !== undefined ? data.mana : player.mana;
            player.maxMana = data.maxMana !== undefined ? data.maxMana : player.maxMana;
            player.gold = data.gold !== undefined ? data.gold : player.gold;
            player.xp = data.xp || 0;
            player.wins = data.wins || 0;
            player.deaths = data.deaths || 0;

            const ind = document.getElementById("cpp-status-indicator");
            if (ind) {
                ind.innerText = "Connected (Port 8080/Proxy)";
                ind.style.color = "#68d391";
            }
            log(`💾 Loaded character profile "${player.name}" from SQLite via C++ API.`);
        }
    } catch (e) {
        const ind = document.getElementById("cpp-status-indicator");
        if (ind) {
            ind.innerText = "Offline (Local mode)";
            ind.style.color = "#fc8181";
        }
        log("⚠️ C++ server unreachable. Running with client-side fallback state.");
    }
    updateUI();
}

// 3. Save Game state to SQLite via C++ POST
async function saveGame() {
    try {
        const payload = `name=${encodeURIComponent(player.name)}&class=${encodeURIComponent(player.heroClass)}&styleId=${encodeURIComponent(player.styleId)}&sprite=${encodeURIComponent(player.sprite)}&hp=${player.hp}&maxHp=${player.maxHp}&mana=${player.mana}&maxMana=${player.maxMana}&gold=${player.gold}&xp=${player.xp}&level=${player.level}&wins=${player.wins}&deaths=${player.deaths}`;
        const res = await fetch(`${API_URL}/save`, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: payload
        });
        if (res.ok) {
            log(`<span class="log-cpp">💾 Game successfully saved to SQLite via C++ backend!</span>`);
        } else {
            log("❌ Server returned error during save.");
        }
    } catch (e) {
        log("❌ Failed to contact C++ backend to save.");
    }
}

// 4. Character Creation in Client
async function promptCharacterCreation() {
    // Cycle archetype or prompt using DOM
    const archetypes = [
        { name: "Valen the Brave", class: "Rune Knight", sprite: "🛡️", styleId: "knight", hp: 110, mana: 45 },
        { name: "Aurelia Sunfire", class: "Pyromancer", sprite: "🧙‍♂️", styleId: "mage", hp: 85, mana: 80 },
        { name: "Kaelen Shadowveil", class: "Shadow Rogue", sprite: "🥷", styleId: "rogue", hp: 92, mana: 50 },
        { name: "Seraphina Dawn", class: "Sun Templar", sprite: "⚜️", styleId: "paladin", hp: 105, mana: 60 },
        { name: "Thorne Oakenshield", class: "Storm Ranger", sprite: "🏹", styleId: "ranger", hp: 98, mana: 55 }
    ];

    // Find next archetype to cycle
    const curIdx = archetypes.findIndex(a => a.styleId === player.styleId);
    const nextArch = archetypes[(curIdx + 1) % archetypes.length];

    try {
        const payload = `name=${encodeURIComponent(nextArch.name)}&class=${encodeURIComponent(nextArch.class)}&styleId=${encodeURIComponent(nextArch.styleId)}&sprite=${encodeURIComponent(nextArch.sprite)}&hp=${nextArch.hp}&maxHp=${nextArch.hp}&mana=${nextArch.mana}&maxMana=${nextArch.mana}`;
        const res = await fetch(`${API_URL}/player/create`, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: payload
        });

        if (res.ok) {
            player.name = nextArch.name;
            player.heroClass = nextArch.class;
            player.styleId = nextArch.styleId;
            player.sprite = nextArch.sprite;
            player.hp = nextArch.hp;
            player.maxHp = nextArch.hp;
            player.mana = nextArch.mana;
            player.maxMana = nextArch.mana;
            player.level = 1;
            player.xp = 0;
            statusEffects = { poisonTurns: 0, burnTurns: 0 };
            log(`✨ Switched hero archetype to ${player.name} (${player.heroClass})! Persisted in SQLite.`);
            updateUI();
            spawnEnemy();
        }
    } catch (e) {
        log("❌ Character creation failed: " + e.message);
    }
}

// 5. Server-Side C++ Combat Verification with Abilities & Defensive Stance
async function executeCombatAction(action) {
    if (isActing || !currentEnemy || currentEnemy.hp <= 0) return;
    isActing = true;
    setButtonsDisabled(true);

    try {
        const payload = `action=${action}&monsterName=${encodeURIComponent(currentEnemy.name)}&monsterAbility=${encodeURIComponent(currentEnemy.specialAbility || 'none')}&isEnemyDefending=${currentEnemy.isDefending ? 'true' : 'false'}&playerHp=${player.hp}&playerMaxHp=${player.maxHp}&playerMana=${player.mana}&enemyHp=${currentEnemy.hp}&enemyMaxHp=${currentEnemy.maxHp}&enemyAtk=${currentEnemy.atk}`;

        const res = await fetch(`${API_URL}/combat/verify`, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: payload
        });

        if (res.ok) {
            const result = await res.json();

            if (result.damageMitigated) {
                log(`<span class="log-crit">🛡️ DEFENSIVE STANCE: ${currentEnemy.name}'s shell absorbed 50% damage!</span>`);
            }

            if (result.critical) {
                log(`<span class="log-crit">💥 CRITICAL HIT!</span> You strike ${currentEnemy.name} for <span class="log-damage">${result.damageDealt} DMG</span>!`);
            } else if (action === "fireball") {
                log(`<span class="log-spell">🔥 Fireball incantation!</span> Scorched ${currentEnemy.name} for <span class="log-damage">${result.damageDealt} DMG</span>! (-${result.manaCost} MP)`);
            } else if (action === "thunder") {
                log(`<span class="log-spell">⚡ Lightning Storm!</span> Shocked ${currentEnemy.name} for <span class="log-damage">${result.damageDealt} DMG</span>! (-${result.manaCost} MP)`);
            } else if (action === "potion") {
                log(`<span class="log-heal">🧪 Drank potion!</span> Restored ${result.healAmount} HP and cured status ailments.`);
                statusEffects = { poisonTurns: 0, burnTurns: 0 };
            } else {
                log(`⚔️ You strike ${currentEnemy.name} for <span class="log-damage">${result.damageDealt} DMG</span>.`);
            }

            log(`<span class="log-cpp">[C++ Calc #${result.calculationId}]: ${result.engineMessage}</span>`);

            if (result.enterDefensiveStance) {
                currentEnemy.isDefending = true;
                log(`<span class="log-crit">🛡️ ${currentEnemy.name} braced into a Defensive Stance (-50% DMG next turn)!</span>`);
            } else {
                currentEnemy.isDefending = false;
            }

            if (result.poisonInflicted) {
                statusEffects.poisonTurns = 3;
                log(`<span class="log-damage">🤢 You have been Poisoned! (Taking damage for 3 turns)</span>`);
            }

            if (result.lifeDrained > 0) {
                log(`<span class="log-heal">🩸 ${currentEnemy.name} drained life and healed +${result.lifeDrained} HP!</span>`);
            }

            currentEnemy.hp = result.enemyHp;
            player.hp = result.playerHp;
            player.mana = result.playerMana;

            triggerEnemyHitAnimation();
            updateUI();

            if (currentEnemy.hp <= 0) {
                handleVictory();
                return;
            }

            // Retaliation & Poison Tick
            setTimeout(() => {
                if (result.damageTaken > 0) {
                    log(`<span class="log-damage">${currentEnemy.name} counter-attacks for ${result.damageTaken} DMG!</span>`);
                }

                // Process poison tick
                if (statusEffects.poisonTurns > 0) {
                    const poisonDmg = 6;
                    player.hp = Math.max(0, player.hp - poisonDmg);
                    log(`<span class="log-damage">🤢 Poison damages you for ${poisonDmg} HP! (${statusEffects.poisonTurns - 1} turns remaining)</span>`);
                    statusEffects.poisonTurns -= 1;
                }

                updateUI();
                if (player.hp <= 0) {
                    handleDefeat();
                } else {
                    isActing = false;
                    setButtonsDisabled(false);
                }
            }, 450);
        } else {
            fallbackCombatAction(action);
        }
    } catch (e) {
        fallbackCombatAction(action);
    }
}

function fallbackCombatAction(action) {
    let dmg = 0;
    if (action === "fireball" && player.mana >= 15) {
        player.mana -= 15;
        dmg = Math.floor(Math.random() * 22) + 16;
        log(`<span class="log-spell">🔥 Cast Fireball!</span> Hit ${currentEnemy.name} for ${dmg} DMG!`);
    } else if (action === "thunder" && player.mana >= 25) {
        player.mana -= 25;
        dmg = Math.floor(Math.random() * 30) + 24;
        log(`<span class="log-spell">⚡ Cast Lightning!</span> Hit ${currentEnemy.name} for ${dmg} DMG!`);
    } else if (action === "potion") {
        player.hp = Math.min(player.maxHp, player.hp + 35);
        statusEffects = { poisonTurns: 0, burnTurns: 0 };
        log(`<span class="log-heal">🧪 Consumed healing potion (+35 HP).</span>`);
    } else {
        dmg = Math.floor(Math.random() * 15) + 10;
        log(`⚔️ You strike ${currentEnemy.name} for ${dmg} DMG.`);
    }

    if (currentEnemy.isDefending) {
        dmg = Math.max(1, Math.floor(dmg / 2));
        log(`🛡️ Defensive Stance absorbed 50% damage!`);
        currentEnemy.isDefending = false;
    }

    currentEnemy.hp = Math.max(0, currentEnemy.hp - dmg);
    triggerEnemyHitAnimation();
    updateUI();

    if (currentEnemy.hp <= 0) {
        handleVictory();
        return;
    }

    setTimeout(() => {
        const eDmg = Math.floor(Math.random() * currentEnemy.atk) + 4;
        player.hp = Math.max(0, player.hp - eDmg);
        log(`<span class="log-damage">${currentEnemy.name} retaliates for ${eDmg} DMG!</span>`);

        if (currentEnemy.specialAbility === "defensive_stance" && Math.random() < 0.4) {
            currentEnemy.isDefending = true;
            log(`🛡️ ${currentEnemy.name} enters Defensive Stance!`);
        } else if (currentEnemy.specialAbility === "poison" && Math.random() < 0.45) {
            statusEffects.poisonTurns = 3;
            log(`🤢 You are Poisoned!`);
        }

        updateUI();
        if (player.hp <= 0) {
            handleDefeat();
        } else {
            isActing = false;
            setButtonsDisabled(false);
        }
    }, 450);
}

function handleVictory() {
    statusEffects = { poisonTurns: 0, burnTurns: 0 };
    const goldGained = currentEnemy.gold;
    const xpGained = currentEnemy.expReward || 30;

    log(`🏆 <span class="log-crit">VICTORY!</span> Defeated ${currentEnemy.name}! Found <span class="log-gold">+${goldGained} Gold</span> and gained +${xpGained} XP.`);
    player.gold += goldGained;
    player.xp += xpGained;
    player.wins += 1;

    let didLevelUp = false;
    if (player.xp >= player.level * 100) {
        player.level += 1;
        player.maxHp += 15;
        player.hp = player.maxHp;
        player.maxMana += 10;
        player.mana = player.maxMana;
        didLevelUp = true;
        log(`🌟 <span class="log-heal">LEVEL UP! Reached Level ${player.level}! Stats increased!</span>`);
    }

    // Inject animated reward preview inside combat-log window
    const box = document.getElementById("combat-log");
    if (box) {
        const rewardEl = document.createElement("div");
        rewardEl.className = "reward-preview-banner";
        rewardEl.innerHTML = `
            <span class="reward-gold">💰 +${goldGained} Gold</span>
            <span class="reward-xp">⭐ +${xpGained} XP</span>
            ${didLevelUp ? `<span class="reward-levelup">LEVEL UP! Lv.${player.level}</span>` : ''}
        `;
        box.prepend(rewardEl);
        setTimeout(() => rewardEl.remove(), 2600);
    }

    updateUI();
    saveGame();

    setTimeout(() => {
        spawnEnemy();
        isActing = false;
        setButtonsDisabled(false);
    }, 1200);
}

function handleDefeat() {
    statusEffects = { poisonTurns: 0, burnTurns: 0 };
    log(`💀 <span class="log-damage">You have fallen in combat!</span> The guardians of Valdor carry you back to the sanctuary campfire.`);
    player.deaths += 1;
    player.hp = player.maxHp;
    player.mana = player.maxMana;
    player.gold = Math.max(0, player.gold - 10);
    updateUI();
    saveGame();

    setTimeout(() => {
        spawnEnemy();
        isActing = false;
        setButtonsDisabled(false);
    }, 1500);
}

function spawnEnemy() {
    if (!monstersList.length) return;
    const template = monstersList[Math.floor(Math.random() * monstersList.length)];
    currentEnemy = { ...template, hp: template.maxHp, isDefending: false };
    log(`⚠️ A wild <b>${currentEnemy.name}</b> appears! [${currentEnemy.element}] Ability: [${currentEnemy.specialAbility}]`);
    updateUI();
}

function triggerEnemyHitAnimation() {
    const sprite = document.getElementById("monster-sprite");
    if (!sprite) return;
    sprite.classList.add("hit");
    setTimeout(() => sprite.classList.remove("hit"), 200);
}

function setButtonsDisabled(disabled) {
    document.getElementById("btn-attack").disabled = disabled;
    document.getElementById("btn-spell").disabled = disabled;
    document.getElementById("btn-thunder").disabled = disabled;
    document.getElementById("btn-heal").disabled = disabled;
    document.getElementById("btn-save").disabled = disabled;
}

function log(msg) {
    const box = document.getElementById("combat-log");
    if (!box) return;
    box.innerHTML += `<p>${msg}</p>`;
    box.scrollTop = box.scrollHeight;
}

function updateUI() {
    const el = (id) => document.getElementById(id);
    if (!el("player-name")) return;

    el("player-name").innerText = `${player.sprite || '🛡️'} ${player.name}`;
    el("player-gold").innerText = player.gold;
    el("player-level").innerText = player.level;
    el("player-xp").innerText = player.xp;
    el("player-wins").innerText = player.wins;
    el("player-deaths").innerText = player.deaths;

    const classBadge = el("player-class-badge");
    if (classBadge) classBadge.innerText = player.heroClass || "Rune Knight";

    el("player-hp-text").innerText = `${player.hp} / ${player.maxHp}${statusEffects.poisonTurns > 0 ? ` (🤢 Poisoned: ${statusEffects.poisonTurns})` : ''}`;
    el("player-hp-bar").style.width = `${Math.max(0, Math.min(100, (player.hp / player.maxHp) * 100))}%`;

    el("player-mana-text").innerText = `${player.mana} / ${player.maxMana}`;
    el("player-mana-bar").style.width = `${Math.max(0, Math.min(100, (player.mana / player.maxMana) * 100))}%`;

    if (currentEnemy) {
        el("monster-name").innerText = `${currentEnemy.name}${currentEnemy.isDefending ? ' [🛡️ DEFENDING]' : ''}`;
        el("monster-sprite").innerText = currentEnemy.sprite;
        el("monster-hp-text").innerText = `${currentEnemy.hp} / ${currentEnemy.maxHp}`;
        el("monster-hp-bar").style.width = `${Math.max(0, Math.min(100, (currentEnemy.hp / currentEnemy.maxHp) * 100))}%`;
        if (el("monster-element")) el("monster-element").innerText = `${currentEnemy.element} · ${currentEnemy.specialAbility}`;
        if (el("monster-weakness")) el("monster-weakness").innerText = `Weak: ${currentEnemy.weakness || "None"}`;
        if (el("monster-lore")) el("monster-lore").innerText = currentEnemy.lore || "";
    }
}

// Bind button clicks
document.getElementById("btn-attack").onclick = () => executeCombatAction("attack");
document.getElementById("btn-spell").onclick = () => executeCombatAction("fireball");
document.getElementById("btn-thunder").onclick = () => executeCombatAction("thunder");
document.getElementById("btn-heal").onclick = () => executeCombatAction("potion");
document.getElementById("btn-save").onclick = saveGame;

// Allow clicking on hero title row to trigger character creation in standalone mode
const heroTitleRow = document.querySelector(".hero-title-row");
if (heroTitleRow) {
    heroTitleRow.style.cursor = "pointer";
    heroTitleRow.title = "Click to customize Hero Name and Visual Style";
    heroTitleRow.onclick = promptCharacterCreation;
}

// Start game
loadPlayerFromCpp().then(loadMonstersFromXML);
