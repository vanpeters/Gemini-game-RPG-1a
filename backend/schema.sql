-- Ruins of Valdor RPG - SQLite Database Schema
-- Defines persistent storage for player character, inventory, and combat history.

CREATE TABLE IF NOT EXISTS characters (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    class TEXT DEFAULT 'Warrior',
    style_id TEXT DEFAULT 'knight',
    sprite TEXT DEFAULT '🛡️',
    level INTEGER DEFAULT 1,
    hp INTEGER DEFAULT 100,
    max_hp INTEGER DEFAULT 100,
    mana INTEGER DEFAULT 50,
    max_mana INTEGER DEFAULT 50,
    gold INTEGER DEFAULT 25,
    xp INTEGER DEFAULT 0,
    wins INTEGER DEFAULT 0,
    deaths INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS inventory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    character_id INTEGER DEFAULT 1,
    item_id TEXT NOT NULL,
    item_name TEXT NOT NULL,
    item_type TEXT NOT NULL, -- 'weapon', 'armor', 'potion', 'relic'
    power INTEGER DEFAULT 0,
    quantity INTEGER DEFAULT 1,
    FOREIGN KEY(character_id) REFERENCES characters(id)
);

CREATE TABLE IF NOT EXISTS combat_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    character_id INTEGER DEFAULT 1,
    monster_name TEXT NOT NULL,
    action TEXT NOT NULL,
    damage_dealt INTEGER DEFAULT 0,
    damage_taken INTEGER DEFAULT 0,
    gold_earned INTEGER DEFAULT 0,
    result TEXT DEFAULT 'ongoing', -- 'victory', 'defeat', 'fled', 'turn'
    logged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed default hero if not present
INSERT OR IGNORE INTO characters (id, name, class, level, hp, max_hp, mana, max_mana, gold, xp, wins, deaths)
VALUES (1, 'Valen the Brave', 'Rune Knight', 1, 100, 100, 50, 50, 25, 0, 0, 0);

-- Seed starting items
INSERT OR IGNORE INTO inventory (id, character_id, item_id, item_name, item_type, power, quantity)
VALUES 
(1, 1, 'rusty_sword', 'Valdor Iron Sword', 'weapon', 14, 1),
(2, 1, 'leather_tunic', 'Chainmail Hauberk', 'armor', 5, 1),
(3, 1, 'health_potion', 'Crimson Elixir', 'potion', 35, 3),
(4, 1, 'mana_potion', 'Aether Draught', 'potion', 25, 2);
