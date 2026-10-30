/**
 * Ruins of Valdor - C++ RPG REST Server
 *
 * Technologies: C++17, cpp-httplib, SQLite3
 * Manages combat calculations, status effect verification, and persistent database storage.
 */

#define CPPHTTPLIB_OPENSSL_SUPPORT 0
#include "httplib.h"
#include <sqlite3.h>
#include <iostream>
#include <sstream>
#include <fstream>
#include <string>
#include <vector>
#include <cstdlib>
#include <ctime>
#include <unistd.h>
#include <sys/resource.h>

sqlite3* db = nullptr;
time_t serverStartTime = 0;
long totalCombatCalculations = 0;

// Escape simple strings for JSON
std::string jsonEscape(const std::string& input) {
    std::ostringstream ss;
    for (char c : input) {
        if (c == '"') ss << "\\\"";
        else if (c == '\\') ss << "\\\\";
        else if (c == '\b') ss << "\\b";
        else if (c == '\f') ss << "\\f";
        else if (c == '\n') ss << "\\n";
        else if (c == '\r') ss << "\\r";
        else if (c == '\t') ss << "\\t";
        else ss << c;
    }
    return ss.str();
}

// Helper to execute SQL queries
bool executeSQL(const std::string& query, std::string* errOut = nullptr) {
    char* errMsg = nullptr;
    int rc = sqlite3_exec(db, query.c_str(), nullptr, nullptr, &errMsg);
    if (rc != SQLITE_OK) {
        if (errMsg) {
            if (errOut) *errOut = errMsg;
            sqlite3_free(errMsg);
        }
        return false;
    }
    return true;
}

// Initialize database schema
void initDatabase() {
    int rc = sqlite3_open("rpg.db", &db);
    if (rc != SQLITE_OK) {
        std::cerr << "Cannot open database: " << sqlite3_errmsg(db) << std::endl;
        return;
    }

    // Try reading schema.sql
    std::ifstream schemaFile("backend/schema.sql");
    if (!schemaFile.is_open()) {
        schemaFile.open("schema.sql");
    }

    if (schemaFile.is_open()) {
        std::stringstream buffer;
        buffer << schemaFile.rdbuf();
        executeSQL(buffer.str());
    } else {
        executeSQL("CREATE TABLE IF NOT EXISTS characters ("
                   "id INTEGER PRIMARY KEY, name TEXT, class TEXT DEFAULT 'Warrior', "
                   "style_id TEXT DEFAULT 'knight', sprite TEXT DEFAULT '🛡️', "
                   "level INT DEFAULT 1, hp INT DEFAULT 100, max_hp INT DEFAULT 100, "
                   "mana INT DEFAULT 50, max_mana INT DEFAULT 50, gold INT DEFAULT 25, "
                   "xp INT DEFAULT 0, wins INT DEFAULT 0, deaths INT DEFAULT 0, "
                   "created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);");
    }

    // Run safe migrations for new columns
    executeSQL("ALTER TABLE characters ADD COLUMN style_id TEXT DEFAULT 'knight';");
    executeSQL("ALTER TABLE characters ADD COLUMN sprite TEXT DEFAULT '🛡️';");

    // Ensure hero row 1 exists
    executeSQL("INSERT OR IGNORE INTO characters (id, name, class, style_id, sprite, level, hp, max_hp, mana, max_mana, gold, xp, wins, deaths) "
               "VALUES (1, 'Valen the Brave', 'Rune Knight', 'knight', '🛡️', 1, 100, 100, 50, 50, 25, 0, 0, 0);");

    std::cout << "[C++ Engine] SQLite Database initialized (rpg.db)." << std::endl;
}

// Helpers to extract parameters
int extractInt(const std::string& body, const std::string& key, int defaultVal) {
    size_t pos = body.find("\"" + key + "\":");
    if (pos != std::string::npos) {
        size_t start = pos + key.length() + 3;
        while (start < body.length() && (body[start] == ' ' || body[start] == '"')) start++;
        return std::atoi(body.c_str() + start);
    }
    pos = body.find(key + "=");
    if (pos != std::string::npos) {
        size_t start = pos + key.length() + 1;
        return std::atoi(body.c_str() + start);
    }
    return defaultVal;
}

bool extractBool(const std::string& body, const std::string& key, bool defaultVal) {
    std::string val = "";
    size_t pos = body.find("\"" + key + "\":");
    if (pos != std::string::npos) {
        size_t start = pos + key.length() + 3;
        while (start < body.length() && (body[start] == ' ' || body[start] == '"')) start++;
        return body.substr(start, 4) == "true";
    }
    pos = body.find(key + "=");
    if (pos != std::string::npos) {
        size_t start = pos + key.length() + 1;
        size_t end = body.find("&", start);
        if (end == std::string::npos) end = body.length();
        val = body.substr(start, end - start);
        return val == "true" || val == "1";
    }
    return defaultVal;
}

// URL decode helper
std::string urlDecode(const std::string& str) {
    std::string res;
    char ch;
    int i, ii;
    for (i = 0; i < (int)str.length(); i++) {
        if (str[i] == '%') {
            sscanf(str.substr(i + 1, 2).c_str(), "%x", &ii);
            ch = static_cast<char>(ii);
            res += ch;
            i += 2;
        } else if (str[i] == '+') {
            res += ' ';
        } else {
            res += str[i];
        }
    }
    return res;
}

std::string extractString(const std::string& body, const std::string& key, const std::string& defaultVal) {
    size_t pos = body.find("\"" + key + "\":\"");
    if (pos != std::string::npos) {
        size_t start = pos + key.length() + 4;
        size_t end = body.find("\"", start);
        if (end != std::string::npos) return body.substr(start, end - start);
    }
    pos = body.find(key + "=");
    if (pos != std::string::npos) {
        size_t start = pos + key.length() + 1;
        size_t end = body.find("&", start);
        if (end == std::string::npos) end = body.length();
        return urlDecode(body.substr(start, end - start));
    }
    return defaultVal;
}

int main(int argc, char* argv[]) {
    srand(static_cast<unsigned int>(time(nullptr)));
    serverStartTime = time(nullptr);

    int port = 8080;
    if (argc > 1) {
        port = std::atoi(argv[1]);
        if (port <= 0) port = 8080;
    }

    initDatabase();

    httplib::Server svr;

    // CORS pre-flight & headers
    svr.set_pre_routing_handler([](const auto& req, auto& res) {
        res.set_header("Access-Control-Allow-Origin", "*");
        res.set_header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
        res.set_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        if (req.method == "OPTIONS") return httplib::Server::HandlerResponse::Handled;
        return httplib::Server::HandlerResponse::Unhandled;
    });

    // 1. GET /api/player -> Load profile from SQLite
    svr.Get("/api/player", [](const httplib::Request&, httplib::Response& res) {
        sqlite3_stmt* stmt = nullptr;
        const char* sql = "SELECT id, name, class, style_id, sprite, level, hp, max_hp, mana, max_mana, gold, xp, wins, deaths FROM characters WHERE id = 1";

        if (sqlite3_prepare_v2(db, sql, -1, &stmt, nullptr) == SQLITE_OK) {
            if (sqlite3_step(stmt) == SQLITE_ROW) {
                int id = sqlite3_column_int(stmt, 0);
                std::string name = (const char*)sqlite3_column_text(stmt, 1);
                std::string heroClass = sqlite3_column_text(stmt, 2) ? (const char*)sqlite3_column_text(stmt, 2) : "Warrior";
                std::string styleId = sqlite3_column_text(stmt, 3) ? (const char*)sqlite3_column_text(stmt, 3) : "knight";
                std::string sprite = sqlite3_column_text(stmt, 4) ? (const char*)sqlite3_column_text(stmt, 4) : "🛡️";
                int level = sqlite3_column_int(stmt, 5);
                int hp = sqlite3_column_int(stmt, 6);
                int maxHp = sqlite3_column_int(stmt, 7);
                int mana = sqlite3_column_int(stmt, 8);
                int maxMana = sqlite3_column_int(stmt, 9);
                int gold = sqlite3_column_int(stmt, 10);
                int xp = sqlite3_column_int(stmt, 11);
                int wins = sqlite3_column_int(stmt, 12);
                int deaths = sqlite3_column_int(stmt, 13);

                std::stringstream json;
                json << "{"
                     << "\"id\":" << id << ","
                     << "\"name\":\"" << jsonEscape(name) << "\","
                     << "\"class\":\"" << jsonEscape(heroClass) << "\","
                     << "\"styleId\":\"" << jsonEscape(styleId) << "\","
                     << "\"sprite\":\"" << jsonEscape(sprite) << "\","
                     << "\"level\":" << level << ","
                     << "\"hp\":" << hp << ","
                     << "\"maxHp\":" << maxHp << ","
                     << "\"mana\":" << mana << ","
                     << "\"maxMana\":" << maxMana << ","
                     << "\"gold\":" << gold << ","
                     << "\"xp\":" << xp << ","
                     << "\"wins\":" << wins << ","
                     << "\"deaths\":" << deaths << ","
                     << "\"source\":\"SQLite (via C++ engine)\""
                     << "}";
                res.set_content(json.str(), "application/json");
            } else {
                executeSQL("INSERT OR REPLACE INTO characters (id, name, class, style_id, sprite, level, hp, max_hp, mana, max_mana, gold, xp, wins, deaths) "
                           "VALUES (1, 'Valen the Brave', 'Rune Knight', 'knight', '🛡️', 1, 100, 100, 50, 50, 25, 0, 0, 0);");
                res.set_content("{\"id\":1,\"name\":\"Valen the Brave\",\"class\":\"Rune Knight\",\"styleId\":\"knight\",\"sprite\":\"🛡️\",\"level\":1,\"hp\":100,\"maxHp\":100,\"mana\":50,\"maxMana\":50,\"gold\":25,\"xp\":0,\"wins\":0,\"deaths\":0,\"source\":\"SQLite Seed\"}", "application/json");
            }
            sqlite3_finalize(stmt);
        } else {
            res.status = 500;
            res.set_content("{\"error\":\"Failed to query character table\"}", "application/json");
        }
    });

    // 2. POST /api/player/create -> Character Creation System
    svr.Post("/api/player/create", [](const httplib::Request& req, httplib::Response& res) {
        std::string name = extractString(req.body, "name", "Valen the Brave");
        std::string heroClass = extractString(req.body, "class", "Rune Knight");
        std::string styleId = extractString(req.body, "styleId", "knight");
        std::string sprite = extractString(req.body, "sprite", "🛡️");
        int hp = extractInt(req.body, "hp", 110);
        int maxHp = extractInt(req.body, "maxHp", 110);
        int mana = extractInt(req.body, "mana", 50);
        int maxMana = extractInt(req.body, "maxMana", 50);

        std::string query = "INSERT OR REPLACE INTO characters (id, name, class, style_id, sprite, level, hp, max_hp, mana, max_mana, gold, xp, wins, deaths, updated_at) "
                            "VALUES (1, '" + jsonEscape(name) + "', '" + jsonEscape(heroClass) + "', '" + jsonEscape(styleId) + "', '" + jsonEscape(sprite) + "', "
                            "1, " + std::to_string(hp) + ", " + std::to_string(maxHp) + ", " + std::to_string(mana) + ", " + std::to_string(maxMana) + ", 25, 0, 0, 0, CURRENT_TIMESTAMP);";

        std::string err;
        if (executeSQL(query, &err)) {
            std::cout << "[C++ Engine] Created new character in SQLite: " << name << " (" << heroClass << ")" << std::endl;
            std::stringstream json;
            json << "{"
                 << "\"status\":\"success\","
                 << "\"message\":\"Character profile forged and saved in SQLite\","
                 << "\"name\":\"" << jsonEscape(name) << "\","
                 << "\"class\":\"" << jsonEscape(heroClass) << "\","
                 << "\"styleId\":\"" << jsonEscape(styleId) << "\","
                 << "\"sprite\":\"" << jsonEscape(sprite) << "\","
                 << "\"hp\":" << hp << ","
                 << "\"maxHp\":" << maxHp << ","
                 << "\"mana\":" << mana << ","
                 << "\"maxMana\":" << maxMana
                 << "}";
            res.set_content(json.str(), "application/json");
        } else {
            res.status = 500;
            res.set_content("{\"status\":\"error\",\"message\":\"" + jsonEscape(err) + "\"}", "application/json");
        }
    });

    // 3. POST /api/save -> Persist to SQLite
    svr.Post("/api/save", [](const httplib::Request& req, httplib::Response& res) {
        std::string name = extractString(req.body, "name", "");
        std::string heroClass = extractString(req.body, "class", "");
        std::string styleId = extractString(req.body, "styleId", "");
        std::string sprite = extractString(req.body, "sprite", "");
        int hp = extractInt(req.body, "hp", 100);
        int maxHp = extractInt(req.body, "maxHp", 100);
        int mana = extractInt(req.body, "mana", 50);
        int maxMana = extractInt(req.body, "maxMana", 50);
        int gold = extractInt(req.body, "gold", 0);
        int xp = extractInt(req.body, "xp", 0);
        int level = extractInt(req.body, "level", 1);
        int wins = extractInt(req.body, "wins", 0);
        int deaths = extractInt(req.body, "deaths", 0);

        std::string query = "UPDATE characters SET hp=" + std::to_string(hp) +
                            ", max_hp=" + std::to_string(maxHp) +
                            ", mana=" + std::to_string(mana) +
                            ", max_mana=" + std::to_string(maxMana) +
                            ", gold=" + std::to_string(gold) +
                            ", xp=" + std::to_string(xp) +
                            ", level=" + std::to_string(level) +
                            ", wins=" + std::to_string(wins) +
                            ", deaths=" + std::to_string(deaths);

        if (!name.empty()) query += ", name='" + jsonEscape(name) + "'";
        if (!heroClass.empty()) query += ", class='" + jsonEscape(heroClass) + "'";
        if (!styleId.empty()) query += ", style_id='" + jsonEscape(styleId) + "'";
        if (!sprite.empty()) query += ", sprite='" + jsonEscape(sprite) + "'";

        query += ", updated_at=CURRENT_TIMESTAMP WHERE id=1;";

        std::string err;
        if (executeSQL(query, &err)) {
            std::cout << "[C++ Engine] Saved game to SQLite: HP=" << hp << " Gold=" << gold << std::endl;
            res.set_content("{\"status\":\"success\",\"message\":\"Game persisted to SQLite via C++ backend\",\"hp\":" + std::to_string(hp) + ",\"gold\":" + std::to_string(gold) + "}", "application/json");
        } else {
            res.status = 500;
            res.set_content("{\"status\":\"error\",\"message\":\"" + jsonEscape(err) + "\"}", "application/json");
        }
    });

    // 4. POST /api/combat/verify -> Advanced C++ combat verification with monster abilities (defensive stance, poison, drain)
    svr.Post("/api/combat/verify", [](const httplib::Request& req, httplib::Response& res) {
        totalCombatCalculations++;
        std::string action = extractString(req.body, "action", "attack");
        std::string monsterName = extractString(req.body, "monsterName", "Enemy");
        std::string monsterAbility = extractString(req.body, "monsterAbility", "none");
        bool isEnemyDefending = extractBool(req.body, "isEnemyDefending", false);
        int playerHp = extractInt(req.body, "playerHp", 100);
        int playerMaxHp = extractInt(req.body, "playerMaxHp", 100);
        int playerMana = extractInt(req.body, "playerMana", 50);
        int enemyHp = extractInt(req.body, "enemyHp", 50);
        int enemyMaxHp = extractInt(req.body, "enemyMaxHp", 50);
        int enemyAtk = extractInt(req.body, "enemyAtk", 12);

        int damageDealt = 0;
        int damageTaken = 0;
        int manaCost = 0;
        int healAmount = 0;
        bool isCritical = false;
        std::string abilityTriggered = "none";
        int statusDamage = 0;
        std::string logMsg;

        // 1. Calculate Player Action
        if (action == "attack") {
            int roll = (rand() % 100);
            isCritical = (roll < 18);
            damageDealt = 12 + (rand() % 9); // 12-20
            if (isCritical) damageDealt = static_cast<int>(damageDealt * 1.8f);
            logMsg = isCritical ? "C++ engine rolled a CRITICAL Strike!" : "C++ verified weapon strike.";
        } else if (action == "fireball") {
            manaCost = 15;
            if (playerMana >= manaCost) {
                playerMana -= manaCost;
                damageDealt = 25 + (rand() % 15);
                logMsg = "C++ verified Pyromantic Fireball incantation.";
            } else {
                damageDealt = 5;
                logMsg = "Insufficient mana! Fizzled into sparks.";
            }
        } else if (action == "thunder") {
            manaCost = 25;
            if (playerMana >= manaCost) {
                playerMana -= manaCost;
                damageDealt = 38 + (rand() % 20);
                logMsg = "C++ verified Cataclysmic Lightning strike.";
            } else {
                damageDealt = 8;
                logMsg = "Insufficient mana for lightning.";
            }
        } else if (action == "potion") {
            healAmount = 35;
            playerHp = std::min(playerMaxHp, playerHp + healAmount);
            logMsg = "C++ verified Crimson Potion consumption (+35 HP).";
        }

        // Apply Defensive Stance Mitigation if enemy is defending
        bool damageMitigated = false;
        if (isEnemyDefending && damageDealt > 0) {
            damageDealt = std::max(1, damageDealt / 2);
            damageMitigated = true;
            logMsg += " [Shield absorbed 50% damage!]";
        }

        // Apply hero damage to enemy
        enemyHp = std::max(0, enemyHp - damageDealt);

        // 2. Enemy Counter-Action & Special Ability Calculation
        bool enterDefensiveStance = false;
        bool poisonInflicted = false;
        int lifeDrained = 0;

        if (enemyHp > 0 && action != "potion_wait") {
            damageTaken = std::max(4, (rand() % enemyAtk) + (enemyAtk / 3));

            // Check Special Abilities
            if (monsterAbility == "defensive_stance") {
                // 35% chance to brace into defensive stance for next turn
                if (!isEnemyDefending && (rand() % 100) < 40) {
                    enterDefensiveStance = true;
                    abilityTriggered = "defensive_stance";
                    logMsg += " The beast braces into an impenetrable Defensive Stance!";
                }
            } else if (monsterAbility == "poison") {
                // 45% chance to inflict poison
                if ((rand() % 100) < 45) {
                    poisonInflicted = true;
                    abilityTriggered = "poison";
                    logMsg += " Venomous toxin delivered! You are Poisoned!";
                }
            } else if (monsterAbility == "life_drain") {
                // Siphons 50% of damage dealt back as HP
                lifeDrained = std::max(4, damageTaken / 2);
                enemyHp = std::min(enemyMaxHp, enemyHp + lifeDrained);
                abilityTriggered = "life_drain";
                logMsg += " Life Siphoned! Monster restored +" + std::to_string(lifeDrained) + " HP.";
            } else if (monsterAbility == "burn") {
                if ((rand() % 100) < 40) {
                    abilityTriggered = "burn";
                    logMsg += " Searing flames ignite your armor!";
                }
            } else if (monsterAbility == "berserk") {
                if (enemyHp < (enemyMaxHp * 4 / 10)) {
                    damageTaken += 6;
                    abilityTriggered = "berserk";
                    logMsg += " Monster enters Berserk Rage! (+6 ATK)";
                }
            }

            playerHp = std::max(0, playerHp - damageTaken);
        }

        // Record combat log into SQLite
        std::string logQuery = "INSERT INTO combat_logs (character_id, monster_name, action, damage_dealt, damage_taken, result) "
                               "VALUES (1, '" + jsonEscape(monsterName) + "', '" + jsonEscape(action) + "', " +
                               std::to_string(damageDealt) + ", " + std::to_string(damageTaken) + ", '" +
                               (enemyHp == 0 ? "victory" : (playerHp == 0 ? "defeat" : "turn")) + "');";
        executeSQL(logQuery);

        std::stringstream json;
        json << "{"
             << "\"verified\":true,"
             << "\"action\":\"" << jsonEscape(action) << "\","
             << "\"damageDealt\":" << damageDealt << ","
             << "\"damageTaken\":" << damageTaken << ","
             << "\"healAmount\":" << healAmount << ","
             << "\"critical\":" << (isCritical ? "true" : "false") << ","
             << "\"manaCost\":" << manaCost << ","
             << "\"playerHp\":" << playerHp << ","
             << "\"playerMana\":" << playerMana << ","
             << "\"enemyHp\":" << enemyHp << ","
             << "\"calculationId\":" << totalCombatCalculations << ","
             << "\"abilityTriggered\":\"" << jsonEscape(abilityTriggered) << "\","
             << "\"enterDefensiveStance\":" << (enterDefensiveStance ? "true" : "false") << ","
             << "\"damageMitigated\":" << (damageMitigated ? "true" : "false") << ","
             << "\"poisonInflicted\":" << (poisonInflicted ? "true" : "false") << ","
             << "\"lifeDrained\":" << lifeDrained << ","
             << "\"engineMessage\":\"" << jsonEscape(logMsg) << "\""
             << "}";
        res.set_content(json.str(), "application/json");
    });

    // 5. GET /api/inventory -> Return items
    svr.Get("/api/inventory", [](const httplib::Request&, httplib::Response& res) {
        sqlite3_stmt* stmt = nullptr;
        const char* sql = "SELECT id, item_id, item_name, item_type, power, quantity FROM inventory WHERE character_id = 1";

        if (sqlite3_prepare_v2(db, sql, -1, &stmt, nullptr) == SQLITE_OK) {
            std::stringstream json;
            json << "[";
            bool first = true;
            while (sqlite3_step(stmt) == SQLITE_ROW) {
                if (!first) json << ",";
                first = false;
                json << "{"
                     << "\"id\":" << sqlite3_column_int(stmt, 0) << ","
                     << "\"itemId\":\"" << jsonEscape((const char*)sqlite3_column_text(stmt, 1)) << "\","
                     << "\"name\":\"" << jsonEscape((const char*)sqlite3_column_text(stmt, 2)) << "\","
                     << "\"type\":\"" << jsonEscape((const char*)sqlite3_column_text(stmt, 3)) << "\","
                     << "\"power\":" << sqlite3_column_int(stmt, 4) << ","
                     << "\"quantity\":" << sqlite3_column_int(stmt, 5)
                     << "}";
            }
            json << "]";
            sqlite3_finalize(stmt);
            res.set_content(json.str(), "application/json");
        } else {
            res.set_content("[]", "application/json");
        }
    });

    // 6. GET /api/combat_logs -> Return recent combat events
    svr.Get("/api/combat_logs", [](const httplib::Request&, httplib::Response& res) {
        sqlite3_stmt* stmt = nullptr;
        const char* sql = "SELECT id, monster_name, action, damage_dealt, damage_taken, result, logged_at FROM combat_logs ORDER BY id DESC LIMIT 15";

        if (sqlite3_prepare_v2(db, sql, -1, &stmt, nullptr) == SQLITE_OK) {
            std::stringstream json;
            json << "[";
            bool first = true;
            while (sqlite3_step(stmt) == SQLITE_ROW) {
                if (!first) json << ",";
                first = false;
                json << "{"
                     << "\"id\":" << sqlite3_column_int(stmt, 0) << ","
                     << "\"monsterName\":\"" << jsonEscape((const char*)sqlite3_column_text(stmt, 1)) << "\","
                     << "\"action\":\"" << jsonEscape((const char*)sqlite3_column_text(stmt, 2)) << "\","
                     << "\"damageDealt\":" << sqlite3_column_int(stmt, 3) << ","
                     << "\"damageTaken\":" << sqlite3_column_int(stmt, 4) << ","
                     << "\"result\":\"" << jsonEscape((const char*)sqlite3_column_text(stmt, 5)) << "\","
                     << "\"loggedAt\":\"" << jsonEscape((const char*)sqlite3_column_text(stmt, 6)) << "\""
                     << "}";
            }
            json << "]";
            sqlite3_finalize(stmt);
            res.set_content(json.str(), "application/json");
        } else {
            res.set_content("[]", "application/json");
        }
    });

    // 7. POST /api/db/query -> SQL Console
    svr.Post("/api/db/query", [](const httplib::Request& req, httplib::Response& res) {
        std::string sql = extractString(req.body, "sql", "");
        if (sql.empty()) {
            res.status = 400;
            res.set_content("{\"error\":\"SQL query missing\"}", "application/json");
            return;
        }

        sqlite3_stmt* stmt = nullptr;
        if (sqlite3_prepare_v2(db, sql.c_str(), -1, &stmt, nullptr) == SQLITE_OK) {
            int cols = sqlite3_column_count(stmt);
            std::stringstream json;
            json << "{\"columns\":[";
            for (int i = 0; i < cols; ++i) {
                if (i > 0) json << ",";
                json << "\"" << jsonEscape(sqlite3_column_name(stmt, i)) << "\"";
            }
            json << "],\"rows\":[";
            bool firstRow = true;
            while (sqlite3_step(stmt) == SQLITE_ROW) {
                if (!firstRow) json << ",";
                firstRow = false;
                json << "[";
                for (int i = 0; i < cols; ++i) {
                    if (i > 0) json << ",";
                    int type = sqlite3_column_type(stmt, i);
                    if (type == SQLITE_INTEGER) {
                        json << sqlite3_column_int64(stmt, i);
                    } else if (type == SQLITE_FLOAT) {
                        json << sqlite3_column_double(stmt, i);
                    } else if (type == SQLITE_NULL) {
                        json << "null";
                    } else {
                        const char* text = (const char*)sqlite3_column_text(stmt, i);
                        json << "\"" << jsonEscape(text ? text : "") << "\"";
                    }
                }
                json << "]";
            }
            json << "],\"status\":\"success\"}";
            sqlite3_finalize(stmt);
            res.set_content(json.str(), "application/json");
        } else {
            std::string err = sqlite3_errmsg(db);
            res.status = 400;
            res.set_content("{\"status\":\"error\",\"error\":\"" + jsonEscape(err) + "\"}", "application/json");
        }
    });

    // 8. GET /api/cpp/status -> Telemetry
    svr.Get("/api/cpp/status", [](const httplib::Request&, httplib::Response& res) {
        time_t now = time(nullptr);
        long uptime = static_cast<long>(now - serverStartTime);

        long residentKb = 0;
        std::ifstream statm("/proc/self/statm");
        if (statm.is_open()) {
            long size, resident;
            statm >> size >> resident;
            residentKb = resident * (sysconf(_SC_PAGESIZE) / 1024);
        }

        std::stringstream json;
        json << "{"
             << "\"status\":\"online\","
             << "\"engine\":\"C++17 (gcc " << __GNUC__ << "." << __GNUC_MINOR__ << ")\","
             << "\"sqliteVersion\":\"" << SQLITE_VERSION << "\","
             << "\"pid\":" << getpid() << ","
             << "\"uptimeSeconds\":" << uptime << ","
             << "\"memoryRssKb\":" << residentKb << ","
             << "\"combatCalculations\":" << totalCombatCalculations << ","
             << "\"port\":8080"
             << "}";
        res.set_content(json.str(), "application/json");
    });

    std::cout << "⚔️  Ruins of Valdor - C++ RPG Backend listening on http://0.0.0.0:" << port << std::endl;
    svr.listen("0.0.0.0", port);

    if (db) sqlite3_close(db);
    return 0;
}
