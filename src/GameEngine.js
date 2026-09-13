// =====================================================
// SPACE MINER - CORE GAME ENGINE
// =====================================================

export class GameEngine {
  constructor() {
    // ==================================================
    // ORE TYPES
    // ==================================================

    this.oreTypes = {
      iron: {
        id: "iron",
        name: "Iron",
        symbol: "⚙️",
        price: 10,
        rarity: 45,
        color: "#8d99ae",
      },

      copper: {
        id: "copper",
        name: "Copper",
        symbol: "🟠",
        price: 18,
        rarity: 25,
        color: "#d8894a",
      },

      titanium: {
        id: "titanium",
        name: "Titanium",
        symbol: "🔷",
        price: 35,
        rarity: 15,
        color: "#67d5ff",
      },

      gold: {
        id: "gold",
        name: "Gold",
        symbol: "🟡",
        price: 60,
        rarity: 9,
        color: "#ffd21c",
      },

      crystal: {
        id: "crystal",
        name: "Crystal",
        symbol: "💎",
        price: 100,
        rarity: 5,
        color: "#d18cff",
      },

      uranium: {
        id: "uranium",
        name: "Uranium",
        symbol: "☢️",
        price: 180,
        rarity: 1,
        color: "#66ff66",
      },
    };

    // ==================================================
    // PLAYER
    // ==================================================

    this.player = {
      credits: 1000,

      ship: {
        name: "Starter",

        cargoCapacity: 100,

        miningSpeed: 1,

        level: 1,

        speed: 8,

        position: {
          x: 0,
          y: 0,
          z: 0,
        },
      },

      inventory: {
        // New inventory system
        ores: {
          iron: 0,
          copper: 0,
          titanium: 0,
          gold: 0,
          crystal: 0,
          uranium: 0,
        },

        // Total cargo in ore units
        ore: 0,
      },

      // Lifetime progression stats used by missions.
      progress: {
        totalMined: 0,
        totalCreditsEarned: 0,
        totalCreditsFromSales: 0,
        totalUpgrades: 0,
        reputation: 0,
      },
    };

    // ==================================================
    // UNIVERSE
    // ==================================================

    this.universe = {
      currentSector: 0,

      sectors:
        this.generateSectors(6),
    };

    // ==================================================
    // MINING STATION
    // ==================================================
    this.station = {
      name: "Mining Station",
      dockingRange: 6,
      position: {
        x: 0,
        y: 0,
        z: -22,
      },
    };

    this.stationContacts = [
      { id: "quartermaster", name: "Mira", role: "Quartermaster", icon: "📦", unlock: 0 },
      { id: "engineer", name: "Kade", role: "Chief Engineer", icon: "🔧", unlock: 20 },
      { id: "broker", name: "Voss", role: "Market Broker", icon: "💰", unlock: 40 },
      { id: "mission", name: "Commander Rhea", role: "Mission Officer", icon: "🎯", unlock: 60 },
    ];

    // ==================================================
    // ECONOMY / SHIP RESOURCES
    // ==================================================

    this.player.ship.fuel = 100;
    this.player.ship.maxFuel = 100;
    this.economy = {
      fuelPrice: 3,
      repairHullPrice: 5,
      repairShieldPrice: 2,
      marketUpdatedAt: Date.now(),
      marketCycle: Math.floor(Date.now() / 60000),
    };

    // ==================================================
    // COMBAT
    // ==================================================

    this.combat = {
      weaponDamage: 20,
      weaponRange: 32,
      fireCooldown: 0.45,
      fireTimer: 0,
      maxHealth: 100,
      maxShield: 60,
      health: 100,
      shield: 60,
      kills: 0,
      lastHitAt: 0,
      invulnerableUntil: 0,
      projectiles: [],
    };

    // ==================================================
    // MISSIONS
    // ==================================================

    this.missions = [
      {
        id: 1,
        title: "Mining Contract",
        description: "Mine 50 units of ore",
        type: "mined",
        target: 50,
        progress: 0,
        completed: false,
        reward: 500,
      },
      {
        id: 2,
        title: "First Paycheck",
        description: "Earn 1000 credits from mining and combat",
        type: "credits",
        target: 1000,
        progress: 0,
        completed: false,
        reward: 1000,
      },
      {
        id: 3,
        title: "Pirate Hunter",
        description: "Destroy 3 enemy ships",
        type: "kills",
        target: 3,
        progress: 0,
        completed: false,
        reward: 750,
      },
      {
        id: 4,
        title: "Ship Upgrade",
        description: "Purchase your first ship upgrade",
        type: "upgrades",
        target: 1,
        progress: 0,
        completed: false,
        reward: 1500,
      },
    ];

    // ==================================================
    // MINING STATE
    // ==================================================

    this.miningActive = false;

    this.miningProgress = 0;

    this.miningTarget = null;

    // ==================================================
    // MIGRATION SUPPORT
    // ==================================================

    this.normalizePlayer();
  }

  // ====================================================
  // RANDOM NUMBER
  // ====================================================

  randomBetween(min, max) {
    return (
      min +
      Math.random() *
        (max - min)
    );
  }

  // ====================================================
  // RANDOM ORE TYPE
  // ====================================================

  getRandomOreType(sectorLevel = 0) {
    const unlockedBySector = [
      ["iron", "copper", "titanium"],
      ["iron", "copper", "titanium", "gold"],
      ["copper", "titanium", "gold", "crystal"],
      ["titanium", "gold", "crystal", "uranium"],
      ["gold", "crystal", "uranium"],
      ["crystal", "uranium"],
    ];
    const allowed = unlockedBySector[Math.max(0, Math.min(5, sectorLevel))];
    const entries = allowed.map((id) => this.oreTypes[id]);
    const totalWeight = entries.reduce((sum, ore) => sum + ore.rarity, 0);
    let random = Math.random() * totalWeight;
    for (const ore of entries) {
      random -= ore.rarity;
      if (random <= 0) return ore.id;
    }
    return entries[0]?.id || "iron";
  }

  getSectorUnlockLevel(sectorId) {
    return Math.max(1, Number(sectorId) + 1);
  }

  isSectorUnlocked(sectorId) {
    return Number(sectorId) >= 0 && Number(sectorId) < this.universe.sectors.length && this.player.ship.level >= this.getSectorUnlockLevel(sectorId);
  }

  getSectorInfo(sectorId) {
    const sector = this.universe.sectors[sectorId];
    if (!sector) return null;
    return {
      ...sector,
      unlocked: this.isSectorUnlocked(sectorId),
      requiredLevel: this.getSectorUnlockLevel(sectorId),
    };
  }

  // ====================================================
  // GENERATE SECTORS
  // ====================================================

  generateSectors(count) {
    const sectors = [];

    for (
      let i = 0;
      i < count;
      i++
    ) {
      sectors.push({
        id: i,

        name:
          `Sector ${i + 1}`,

        asteroids:
          this.generateAsteroids(
            Math.floor(this.randomBetween(8, 15)),
            i
          ),

        enemies:
          this.generateEnemies(
            Math.floor(this.randomBetween(3, 6)),
            i
          ),
      });
    }

    return sectors;
  }

  // ====================================================
  // RANDOM ASTEROID POSITION
  // ====================================================

  generateAsteroidPosition() {
    return {
      x: this.randomBetween(
        -25,
        25
      ),

      y: this.randomBetween(
        -12,
        12
      ),

      z: this.randomBetween(
        -25,
        25
      ),
    };
  }

  // ====================================================
  // GENERATE ASTEROIDS
  // ====================================================

  generateAsteroids(count, sectorLevel = 0) {
    const asteroids = [];

    for (
      let i = 0;
      i < count;
      i++
    ) {
      asteroids.push(
        this.createAsteroid(i, sectorLevel)
      );
    }

    return asteroids;
  }

  // ====================================================
  // CREATE ASTEROID
  // ====================================================

  createAsteroid(id, sectorLevel = 0) {
    const oreType = this.getRandomOreType(sectorLevel);

    const ore =
      this.randomBetween(
        15,
        60
      );

    return {
      id,
      sectorLevel,

      position:
        this.generateAsteroidPosition(),

      oreType,

      ore,

      remainingOre: ore,

      mined: false,

      respawnAt: null,

      size:
        this.randomBetween(
          0.8,
          1.8
        ),

      rotation: {
        x:
          Math.random() *
          Math.PI,

        y:
          Math.random() *
          Math.PI,

        z:
          Math.random() *
          Math.PI,
      },
    };
  }

  // ====================================================
  // RESPAWN ASTEROID
  // ====================================================

  respawnAsteroid(
    asteroid
  ) {
    const oreType = this.getRandomOreType(asteroid.sectorLevel || 0);

    const ore =
      this.randomBetween(
        15,
        60
      );

    asteroid.position =
      this.generateAsteroidPosition();

    asteroid.oreType =
      oreType;

    asteroid.ore =
      ore;

    asteroid.remainingOre =
      ore;

    asteroid.mined = false;

    asteroid.respawnAt = null;

    asteroid.size =
      this.randomBetween(
        0.8,
        1.8
      );

    asteroid.rotation = {
      x:
        Math.random() *
        Math.PI,

      y:
        Math.random() *
        Math.PI,

      z:
        Math.random() *
        Math.PI,
    };
  }

  // ====================================================
  // UPDATE ASTEROID RESPAWNS
  // ====================================================

  updateAsteroidRespawns() {
    const now =
      Date.now();

    this.universe.sectors.forEach(
      (sector) => {
        sector.asteroids.forEach(
          (asteroid) => {
            if (
              asteroid.mined &&
              asteroid.respawnAt &&
              now >=
                asteroid.respawnAt
            ) {
              this.respawnAsteroid(
                asteroid
              );
            }
          }
        );
      }
    );
  }

  // ====================================================
  // ENEMY GENERATION
  // ====================================================

  generateEnemyPosition(existingPositions = []) {
    let position;
    let attempts = 0;
    do {
      // Keep NPCs reasonably close to the playable area so they are visible
      // when entering a sector, while still spreading them around the player.
      position = {
        x: this.randomBetween(-22, 22),
        y: this.randomBetween(-9, 9),
        z: this.randomBetween(-22, 22),
      };
      attempts += 1;

      const distanceFromOrigin = Math.sqrt(
        position.x * position.x +
        position.y * position.y +
        position.z * position.z
      );

      let tooCloseToAnotherNpc = false;
      for (let i = 0; i < existingPositions.length; i += 1) {
        const other = existingPositions[i];
        const dx = position.x - other.x;
        const dy = position.y - other.y;
        const dz = position.z - other.z;
        if (Math.sqrt(dx * dx + dy * dy + dz * dz) < 5) {
          tooCloseToAnotherNpc = true;
          break;
        }
      }

      if (distanceFromOrigin >= 10 && !tooCloseToAnotherNpc) {
        break;
      }
    } while (attempts < 50);
    return position;
  }

  generateEnemyRoamTarget() {
    return {
      x: this.randomBetween(-24, 24),
      y: this.randomBetween(-10, 10),
      z: this.randomBetween(-24, 24),
    };
  }

  createEnemy(id, sectorLevel = 0) {
    const types = [
      { name: "RAIDER", health: 80, speed: 3.2, damage: 7, reward: 120, scale: 1.0 },
      { name: "SCOUT", health: 55, speed: 4.6, damage: 5, reward: 90, scale: 0.8 },
      { name: "PIRATE", health: 120, speed: 2.5, damage: 10, reward: 220, scale: 1.25 },
    ];
    const baseType = types[Math.floor(Math.random() * types.length)];
    const difficulty = 1 + sectorLevel * 0.22;
    const type = {
      ...baseType,
      health: Math.round(baseType.health * difficulty),
      speed: baseType.speed * (1 + sectorLevel * 0.04),
      damage: Math.round(baseType.damage * difficulty),
      reward: Math.round(baseType.reward * difficulty),
    };
    return {
      id,
      sectorLevel,
      type: type.name,
      position: this.generateEnemyPosition(),
      roamTarget: this.generateEnemyRoamTarget(),
      roamWait: this.randomBetween(0.2, 1.5),
      health: type.health,
      maxHealth: type.health,
      speed: type.speed,
      damage: type.damage,
      reward: type.reward,
      scale: type.scale,
      attackCooldown: this.randomBetween(0.8, 1.8),
      projectileSpeed: 15 + sectorLevel * 1.5,
      projectileRange: 60,
      respawnAt: null,
      destroyed: false,
    };
  }

  generateEnemies(count, sectorLevel = 0) {
    const enemies = [];
    const positions = [];
    for (let i = 0; i < count; i += 1) {
      const enemy = this.createEnemy(i, sectorLevel);
      enemy.position = this.generateEnemyPosition(positions);
      positions.push({ ...enemy.position });
      enemies.push(enemy);
    }
    return enemies;
  }

  getDistanceToEnemy(enemy) {
    const ship = this.player.ship.position;
    const p = enemy.position;
    const dx = ship.x - p.x;
    const dy = ship.y - p.y;
    const dz = ship.z - p.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  fireWeapon(enemyId) {
    const sector = this.getCurrentSector();
    const enemy = sector?.enemies?.find((item) => item.id === enemyId);

    if (!enemy || enemy.destroyed || enemy.health <= 0) {
      return { success: false, damage: 0, message: "Enemy target unavailable." };
    }

    if (this.combat.fireTimer > 0) {
      return { success: false, cooldown: true, damage: 0, message: "Weapon cooling down." };
    }

    const distance = this.getDistanceToEnemy(enemy);
    if (distance > this.combat.weaponRange) {
      return { success: false, damage: 0, message: `Target out of range: ${distance.toFixed(1)}m` };
    }

    const damage = this.combat.weaponDamage;
    enemy.health = Math.max(0, enemy.health - damage);
    this.combat.fireTimer = this.combat.fireCooldown;

    if (enemy.health <= 0) {
      enemy.destroyed = true;
      enemy.respawnAt = Date.now() + this.randomBetween(8000, 16000);
      this.player.credits += enemy.reward;
      this.player.progress.totalCreditsEarned += enemy.reward;
      this.combat.kills += 1;
      this.player.progress.reputation = Number(this.player.progress.reputation || 0) + 8;
      this.checkMissions();
      return {
        success: true,
        damage,
        destroyed: true,
        reward: enemy.reward,
        message: `Enemy destroyed! +${enemy.reward} CR`,
      };
    }

    return {
      success: true,
      damage,
      destroyed: false,
      message: `Hit ${enemy.type} for ${damage} damage.`,
    };
  }

  updateCombat(deltaTime) {
    const dt = Math.max(0, deltaTime / 1000);
    this.combat.fireTimer = Math.max(0, this.combat.fireTimer - dt);

    const sector = this.getCurrentSector();
    if (!sector) return;
    if (!Array.isArray(sector.enemies)) sector.enemies = this.generateEnemies(4);

    const now = Date.now();
    if (now >= this.combat.invulnerableUntil) {
      this.combat.invulnerableUntil = 0;
    }

    sector.enemies.forEach((enemy) => {
      if (enemy.destroyed) {
        if (enemy.respawnAt && now >= enemy.respawnAt) {
          const fresh = this.createEnemy(enemy.id, enemy.sectorLevel || this.universe.currentSector);
          Object.assign(enemy, fresh);
        }
        return;
      }

      enemy.attackCooldown = Math.max(0, Number(enemy.attackCooldown || 0) - dt);
      enemy.roamWait = Math.max(0, Number(enemy.roamWait || 0) - dt);

      // NPCs now wander through the sector using independent waypoints.
      // They never steer toward the player, so they feel like independent ships.
      if (!enemy.roamTarget || enemy.roamWait <= 0) {
        enemy.roamTarget = this.generateEnemyRoamTarget();
        enemy.roamWait = this.randomBetween(1.5, 4.0);
      }

      const tx = enemy.roamTarget.x - enemy.position.x;
      const ty = enemy.roamTarget.y - enemy.position.y;
      const tz = enemy.roamTarget.z - enemy.position.z;
      const targetDistance = Math.sqrt(tx * tx + ty * ty + tz * tz);

      if (targetDistance > 0.8) {
        const targetLen = targetDistance || 1;
        enemy.position.x += (tx / targetLen) * enemy.speed * dt;
        enemy.position.y += (ty / targetLen) * enemy.speed * dt;
        enemy.position.z += (tz / targetLen) * enemy.speed * dt;
      } else {
        enemy.roamTarget = this.generateEnemyRoamTarget();
        enemy.roamWait = this.randomBetween(0.4, 1.2);
      }

      // Keep NPCs inside the sector play area.
      enemy.position.x = Math.max(-26, Math.min(26, enemy.position.x));
      enemy.position.y = Math.max(-11, Math.min(11, enemy.position.y));
      enemy.position.z = Math.max(-26, Math.min(26, enemy.position.z));

      const ship = this.player.ship.position;
      const dx = ship.x - enemy.position.x;
      const dy = ship.y - enemy.position.y;
      const dz = ship.z - enemy.position.z;
      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
      const len = distance || 1;

      // Hostile ships can still fire when they happen to pass within range,
      // but firing does not change their random movement path.
      if (distance <= 55 && distance >= 8 && enemy.attackCooldown <= 0) {
        this.combat.projectiles.push({
          id: `${enemy.id}-${now}-${Math.random().toString(36).slice(2, 7)}`,
          enemyId: enemy.id,
          position: { ...enemy.position },
          velocity: {
            x: (dx / len) * enemy.projectileSpeed,
            y: (dy / len) * enemy.projectileSpeed,
            z: (dz / len) * enemy.projectileSpeed,
          },
          damage: enemy.damage,
          distance: 0,
          maxDistance: enemy.projectileRange,
        });
        enemy.attackCooldown = 2.0;
      }
    });

    // Enemy projectiles only damage the player when they actually reach the ship.
    for (let i = this.combat.projectiles.length - 1; i >= 0; i -= 1) {
      const projectile = this.combat.projectiles[i];
      const speed = Math.sqrt(projectile.velocity.x ** 2 + projectile.velocity.y ** 2 + projectile.velocity.z ** 2);
      projectile.position.x += projectile.velocity.x * dt;
      projectile.position.y += projectile.velocity.y * dt;
      projectile.position.z += projectile.velocity.z * dt;
      projectile.distance += speed * dt;
      const ship = this.player.ship.position;
      const pdx = ship.x - projectile.position.x;
      const pdy = ship.y - projectile.position.y;
      const pdz = ship.z - projectile.position.z;
      const hitDistance = Math.sqrt(pdx * pdx + pdy * pdy + pdz * pdz);
      if (hitDistance <= 1.6) {
        this.applyPlayerDamage(projectile.damage);
        this.combat.projectiles.splice(i, 1);
      } else if (projectile.distance >= projectile.maxDistance) {
        this.combat.projectiles.splice(i, 1);
      }
    }

    // Small shield regeneration when the player has not been hit recently.
    if (now - this.combat.lastHitAt > 3500 && this.combat.shield < this.combat.maxShield) {
      this.combat.shield = Math.min(this.combat.maxShield, this.combat.shield + 10 * dt);
    }
  }

  applyPlayerDamage(amount) {
    if (Date.now() < this.combat.invulnerableUntil) return;
    let damage = Math.max(0, Number(amount) || 0);
    const shieldDamage = Math.min(this.combat.shield, damage);
    this.combat.shield -= shieldDamage;
    damage -= shieldDamage;
    if (damage > 0) this.combat.health = Math.max(0, this.combat.health - damage);
    this.combat.lastHitAt = Date.now();

    if (this.combat.health <= 0) {
      this.player.credits = Math.max(0, this.player.credits - 150);
      this.combat.health = this.combat.maxHealth;
      this.combat.shield = this.combat.maxShield;
      this.combat.invulnerableUntil = Date.now() + 3500;
      this.player.ship.position = { x: 0, y: 0, z: -22 };
    }
  }

  // ====================================================
  // SET SHIP POSITION
  // ====================================================

  setShipPosition(
    position
  ) {
    const previous = this.player.ship.position || { x: 0, y: 0, z: 0 };
    const dx = Number(position.x || 0) - Number(previous.x || 0);
    const dy = Number(position.y || 0) - Number(previous.y || 0);
    const dz = Number(position.z || 0) - Number(previous.z || 0);
    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
    const fuel = Number(this.player.ship.fuel ?? this.player.ship.maxFuel ?? 100);
    if (fuel <= 0 && distance > 0) return;
    const maxDistance = fuel > 0 ? distance : 0;
    this.player.ship.position = {
      x: previous.x + (dx * (maxDistance ? 1 : 0)),
      y: previous.y + (dy * (maxDistance ? 1 : 0)),
      z: previous.z + (dz * (maxDistance ? 1 : 0)),
    };
    if (distance > 0) this.consumeFuel(distance);
  }

  // ====================================================
  // GET SHIP POSITION
  // ====================================================

  getShipPosition() {
    return {
      ...this.player.ship.position,
    };
  }

  // ====================================================
  // DISTANCE TO ASTEROID
  // ====================================================

  getDistanceToAsteroid(
    asteroid
  ) {
    const ship =
      this.player.ship.position;

    const asteroidPosition =
      asteroid.position;

    const dx =
      ship.x -
      asteroidPosition.x;

    const dy =
      ship.y -
      asteroidPosition.y;

    const dz =
      ship.z -
      asteroidPosition.z;

    return Math.sqrt(
      dx * dx +
        dy * dy +
        dz * dz
    );
  }

  // ====================================================
  // DISTANCE TO MINING STATION
  // ====================================================
  getDistanceToStation() {
    const ship = this.player.ship.position;
    const station = this.station.position;
    const dx = ship.x - station.x;
    const dy = ship.y - station.y;
    const dz = ship.z - station.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  // ====================================================
  // DOCKING CHECK
  // ====================================================
  isDocked() {
    return this.getDistanceToStation() <= this.station.dockingRange;
  }

  // ====================================================
  // DYNAMIC MARKET
  // ====================================================
  updateMarket() {
    const cycle = Math.floor(Date.now() / 60000);
    if (cycle !== this.economy.marketCycle) {
      this.economy.marketCycle = cycle;
      this.economy.marketUpdatedAt = Date.now();
    }
  }

  getMarketPrice(oreType) {
    this.updateMarket();
    const ore = this.oreTypes[oreType];
    if (!ore) return 0;
    const sectorLevel = this.universe.currentSector || 0;
    const seed = Math.sin((this.economy.marketCycle + 1) * (ore.rarity + 3) * 12.9898 + (sectorLevel + 1) * 78.233);
    const fluctuation = 0.82 + ((seed + 1) / 2) * 0.46;
    const sectorBonus = 1 + sectorLevel * 0.035;
    return Math.max(1, Math.round(ore.price * fluctuation * sectorBonus));
  }

  getMarketPrices() {
    this.updateMarket();
    return Object.fromEntries(Object.keys(this.oreTypes).map((id) => [id, this.getMarketPrice(id)]));
  }

  // ====================================================
  // FUEL
  // ====================================================
  consumeFuel(distance) {
    if (!this.player.ship) return;
    const amount = Math.max(0, Number(distance || 0)) * 0.035;
    this.player.ship.fuel = Math.max(0, Number(this.player.ship.fuel ?? this.player.ship.maxFuel ?? 100) - amount);
  }

  refuelAtStation() {
    if (!this.isDocked()) return { success: false, message: `Dock at the station to refuel.` };
    const maxFuel = Number(this.player.ship.maxFuel || 100);
    const fuel = Number(this.player.ship.fuel || 0);
    const needed = Math.max(0, maxFuel - fuel);
    if (needed < 0.01) return { success: false, message: "Fuel tank is already full." };
    const cost = Math.ceil(needed * this.economy.fuelPrice);
    if (this.player.credits < cost) return { success: false, message: `Refueling needs ${cost} CR.` };
    this.player.credits -= cost;
    this.player.ship.fuel = maxFuel;
    return { success: true, cost, message: `Refueled ${needed.toFixed(1)} units for ${cost} CR.` };
  }

  repairShipAtStation() {
    if (!this.isDocked()) return { success: false, message: "Dock at the station to repair your ship." };
    const hullMissing = Math.max(0, this.combat.maxHealth - this.combat.health);
    const shieldMissing = Math.max(0, this.combat.maxShield - this.combat.shield);
    const cost = Math.ceil(hullMissing * this.economy.repairHullPrice + shieldMissing * this.economy.repairShieldPrice);
    if (hullMissing < 0.01 && shieldMissing < 0.01) return { success: false, message: "Ship systems are already fully repaired." };
    if (this.player.credits < cost) return { success: false, message: `Repair needs ${cost} CR.` };
    this.player.credits -= cost;
    this.combat.health = this.combat.maxHealth;
    this.combat.shield = this.combat.maxShield;
    this.combat.invulnerableUntil = Date.now() + 1500;
    return { success: true, cost, message: `Ship repaired for ${cost} CR.` };
  }

  // ====================================================
  // SELL ORE AT STATION
  // ====================================================
  sellOreAtStation() {
    if (!this.isDocked()) {
      return {
        success: false,
        credits: 0,
        message: `Too far from the station. Move within ${this.station.dockingRange}m to dock.`,
      };
    }

    const cargo = this.player.inventory.ore;
    if (cargo <= 0) {
      return {
        success: false,
        credits: 0,
        message: "Cargo hold is empty.",
      };
    }

    const credits = this.sellOre();
    return {
      success: true,
      credits,
      message: `Sold ${cargo.toFixed(1)} ore for ${credits.toFixed(0)} credits.`,
    };
  }

  // ====================================================
  // START MINING
  // ====================================================

  startMining(
    asteroidId
  ) {
    const sector =
      this.universe.sectors[
        this.universe.currentSector
      ];

    const asteroid =
      sector?.asteroids?.[
        asteroidId
      ];

    if (!asteroid) {
      return {
        success: false,
        message:
          "Asteroid not found.",
      };
    }

    if (asteroid.mined) {
      return {
        success: false,
        message:
          "This asteroid is depleted.",
      };
    }

    // Cargo check
    if (
      this.player.inventory.ore >=
      this.player.ship.cargoCapacity
    ) {
      return {
        success: false,
        message:
          "Cargo hold is full.",
      };
    }

    // Distance check
    const distance =
      this.getDistanceToAsteroid(
        asteroid
      );

    const miningRange = 8;

    if (
      distance >
      miningRange
    ) {
      return {
        success: false,
        message:
          `Too far away! Move closer. Distance: ${distance.toFixed(
            1
          )}`,
      };
    }

    this.miningActive = true;

    this.miningProgress = 0;

    this.miningTarget =
      asteroidId;

    return {
      success: true,
      message:
        "Mining started.",
    };
  }

  // ====================================================
  // UPDATE MINING
  // ====================================================

  updateMining(
    deltaTime
  ) {
    this.updateAsteroidRespawns();

    if (
      !this.miningActive ||
      this.miningTarget === null
    ) {
      return;
    }

    const sector =
      this.universe.sectors[
        this.universe.currentSector
      ];

    const asteroid =
      sector?.asteroids?.[
        this.miningTarget
      ];

    if (!asteroid) {
      this.stopMining();
      return;
    }

    if (asteroid.mined) {
      this.stopMining();
      return;
    }

    // Check distance continuously
    const distance =
      this.getDistanceToAsteroid(
        asteroid
      );

    if (distance > 10) {
      this.stopMining();
      return;
    }

    // Cargo
    const currentCargo =
      this.player.inventory.ore;

    const capacity =
      this.player.ship
        .cargoCapacity;

    const remainingCargo =
      capacity -
      currentCargo;

    if (
      remainingCargo <= 0
    ) {
      this.stopMining();
      return;
    }

    // Mining
    const orePerSecond =
      this.player.ship
        .miningSpeed;

    const oreToMine =
      orePerSecond *
      (deltaTime / 1000);

    this.miningProgress +=
      oreToMine;

    // Finished asteroid
    if (
      this.miningProgress >=
      asteroid.remainingOre
    ) {
      this.completeMining();
      return;
    }

    // Cargo becomes full
    if (
      this.player.inventory
        .ore +
        this.miningProgress >=
      capacity
    ) {
      this.completeMining(
        true
      );
    }
  }

  // ====================================================
  // COMPLETE MINING
  // ====================================================

  completeMining(
    cargoLimited = false
  ) {
    if (
      this.miningTarget === null
    ) {
      return 0;
    }

    const sector =
      this.universe.sectors[
        this.universe.currentSector
      ];

    const asteroid =
      sector?.asteroids?.[
        this.miningTarget
      ];

    if (!asteroid) {
      this.stopMining();
      return 0;
    }

    const capacity =
      this.player.ship
        .cargoCapacity;

    const currentCargo =
      this.player.inventory.ore;

    const remainingCargo =
      Math.max(
        0,
        capacity -
          currentCargo
      );

    const oreGained =
      Math.min(
        asteroid.remainingOre,
        this.miningProgress,
        remainingCargo
      );

    // Add specific ore type
    const oreType =
      asteroid.oreType;

    if (
      !this.player.inventory
        .ores[oreType]
    ) {
      this.player.inventory
        .ores[oreType] = 0;
    }

    this.player.inventory
      .ores[oreType] +=
      oreGained;

    this.player.inventory.ore +=
      oreGained;
    this.player.progress.totalMined += oreGained;

    asteroid.remainingOre -=
      oreGained;

    // Asteroid fully depleted
    if (
      asteroid.remainingOre <=
        0.01 ||
      !cargoLimited
    ) {
      asteroid.remainingOre =
        0;

      asteroid.mined = true;

      // Random respawn between
      // 8 and 20 seconds
      asteroid.respawnAt =
        Date.now() +
        this.randomBetween(
          8000,
          20000
        );
    }

    this.miningActive =
      false;

    this.miningProgress =
      0;

    this.miningTarget =
      null;

    this.checkMissions();

    return oreGained;
  }

  // ====================================================
  // STOP MINING
  // ====================================================

  stopMining() {
    this.miningActive =
      false;

    this.miningProgress =
      0;

    this.miningTarget =
      null;
  }

  // ====================================================
  // SELL ORE
  // ====================================================

  sellOre() {
    const ores =
      this.player.inventory
        .ores;

    let totalCredits = 0;

    Object.entries(
      ores
    ).forEach(
      ([oreType, amount]) => {
        const definition =
          this.oreTypes[
            oreType
          ];

        if (
          definition &&
          amount > 0
        ) {
          totalCredits +=
            amount *
            this.getMarketPrice(oreType);
        }
      }
    );

    this.player.credits +=
      totalCredits;
    this.player.progress.totalCreditsEarned += totalCredits;
    this.player.progress.totalCreditsFromSales += totalCredits;
    this.player.progress.reputation = Number(this.player.progress.reputation || 0) + Math.max(1, Math.floor(totalCredits / 250));

    // Empty inventory
    Object.keys(
      this.player.inventory
        .ores
    ).forEach(
      (oreType) => {
        this.player.inventory
          .ores[oreType] = 0;
      }
    );

    this.player.inventory.ore =
      0;

    this.checkMissions();

    return totalCredits;
  }

  // ====================================================
  // UPGRADE SHIP
  // ====================================================

  upgradeShip() {
    const upgradeCost =
      500 *
      this.player.ship.level;

    if (
      this.player.credits <
      upgradeCost
    ) {
      return false;
    }

    this.player.credits -=
      upgradeCost;

    this.player.ship.level +=
      1;

    this.player.ship
      .cargoCapacity +=
      50;

    this.player.ship
      .miningSpeed +=
      0.5;

    this.player.ship.speed +=
      1.5;
    this.player.ship.maxFuel += 10;
    this.player.ship.fuel = this.player.ship.maxFuel;
    this.player.progress.totalUpgrades += 1;

    this.combat.weaponDamage += 5;
    this.combat.maxShield += 10;
    this.combat.maxHealth += 10;
    this.combat.health = this.combat.maxHealth;
    this.combat.shield = this.combat.maxShield;

    this.checkMissions();

    return true;
  }

  // ====================================================
  // TRAVEL
  // ====================================================

  travelToSector(
    sectorId
  ) {
    if (
      sectorId < 0 ||
      sectorId >= this.universe.sectors.length
    ) {
      return false;
    }

    if (!this.isSectorUnlocked(sectorId)) {
      return false;
    }

    this.stopMining();

    this.universe
      .currentSector =
      sectorId;

    // Start ship in center
    this.player.ship.position = {
      x: 0,
      y: 0,
      z: 0,
    };

    return true;
  }

  // ====================================================
  // MISSIONS
  // ====================================================

  checkMissions() {
    const progress = this.player.progress || {};

    this.missions.forEach((mission) => {
      if (mission.completed) return;

      if (mission.type === "mined") {
        mission.progress = Math.min(mission.target, Number(progress.totalMined || 0));
      } else if (mission.type === "credits") {
        mission.progress = Math.min(mission.target, Number(progress.totalCreditsEarned || 0));
      } else if (mission.type === "kills") {
        mission.progress = Math.min(mission.target, Number(this.combat.kills || 0));
      } else if (mission.type === "upgrades") {
        mission.progress = Math.min(mission.target, Number(progress.totalUpgrades || 0));
      }

      if (mission.progress >= mission.target) {
        mission.completed = true;
        this.player.credits += mission.reward;
        this.player.progress.reputation = Number(this.player.progress.reputation || 0) + 10;
        // Mission rewards are deliberately not counted toward the
        // "earn credits" objective, preventing reward chains.
      }
    });
  }

  // ====================================================
  // NORMALIZE OLD SAVES
  // ====================================================

  normalizePlayer() {
    if (!this.player.progress) {
      this.player.progress = {
        totalMined: 0,
        totalCreditsEarned: 0,
        totalCreditsFromSales: 0,
        totalUpgrades: 0,
        reputation: 0,
      };
    } else {
      this.player.progress.totalMined = Number(this.player.progress.totalMined || 0);
      this.player.progress.totalCreditsEarned = Number(this.player.progress.totalCreditsEarned || 0);
      this.player.progress.totalCreditsFromSales = Number(this.player.progress.totalCreditsFromSales || 0);
      this.player.progress.totalUpgrades = Number(this.player.progress.totalUpgrades || 0);
      this.player.progress.reputation = Number(this.player.progress.reputation || 0);
    }

    // Convert old mission saves to the current mission structure.
    const defaults = [
      { id: 1, title: "Mining Contract", description: "Mine 50 units of ore", type: "mined", target: 50, reward: 500 },
      { id: 2, title: "First Paycheck", description: "Earn 1000 credits from mining and combat", type: "credits", target: 1000, reward: 1000 },
      { id: 3, title: "Pirate Hunter", description: "Destroy 3 enemy ships", type: "kills", target: 3, reward: 750 },
      { id: 4, title: "Ship Upgrade", description: "Purchase your first ship upgrade", type: "upgrades", target: 1, reward: 1500 },
    ];
    if (!Array.isArray(this.missions) || this.missions.length !== defaults.length || this.missions.some((m) => !m.type)) {
      this.missions = defaults.map((m) => ({ ...m, progress: 0, completed: false }));
    } else {
      this.missions = this.missions.map((mission, index) => ({
        ...defaults[index],
        ...mission,
        progress: Number(mission.progress || 0),
        completed: Boolean(mission.completed),
      }));
    }

    if (
      !this.player.inventory
    ) {
      this.player.inventory = {};
    }

    if (
      !this.player.inventory
        .ores
    ) {
      this.player.inventory
        .ores = {
          iron: 0,
          copper: 0,
          titanium: 0,
          gold: 0,
          crystal: 0,
          uranium: 0,
        };
    }

    // Old save compatibility
    if (
      typeof this.player
        .inventory.ore ===
      "number"
    ) {
      const oldOre =
        this.player.inventory
          .ore;

      const existing =
        Object.values(
          this.player.inventory
            .ores
        ).reduce(
          (sum, amount) =>
            sum + amount,
          0
        );

      if (
        oldOre > 0 &&
        existing === 0
      ) {
        this.player.inventory
          .ores.iron =
          oldOre;
      }
    }

    if (!this.player.ship.maxFuel || typeof this.player.ship.maxFuel !== "number") this.player.ship.maxFuel = 100;
    if (typeof this.player.ship.fuel !== "number") this.player.ship.fuel = this.player.ship.maxFuel;
    this.player.ship.fuel = Math.max(0, Math.min(this.player.ship.maxFuel, this.player.ship.fuel));

    if (!this.economy) this.economy = { fuelPrice: 3, repairHullPrice: 5, repairShieldPrice: 2, marketUpdatedAt: Date.now(), marketCycle: Math.floor(Date.now() / 60000) };
    if (typeof this.economy.fuelPrice !== "number") this.economy.fuelPrice = 3;
    if (typeof this.economy.repairHullPrice !== "number") this.economy.repairHullPrice = 5;
    if (typeof this.economy.repairShieldPrice !== "number") this.economy.repairShieldPrice = 2;
    if (typeof this.economy.marketCycle !== "number") this.economy.marketCycle = Math.floor(Date.now() / 60000);

    if (
      !this.player.ship
        .position
    ) {
      this.player.ship.position =
        {
          x: 0,
          y: 0,
          z: 0,
        };
    }

    if (
      !this.player.ship.speed
    ) {
      this.player.ship.speed =
        8;
    }

    if (!this.combat) {
      this.combat = {
        weaponDamage: 20,
        weaponRange: 32,
        fireCooldown: 0.45,
        fireTimer: 0,
        maxHealth: 100,
        maxShield: 60,
        health: 100,
        shield: 60,
        kills: 0,
        lastHitAt: 0,
        invulnerableUntil: 0,
      };
    }

    this.combat.projectiles = [];

    ["weaponDamage", "weaponRange", "fireCooldown", "maxHealth", "maxShield", "health", "shield", "kills", "lastHitAt", "invulnerableUntil"].forEach((key) => {
      if (typeof this.combat[key] !== "number") {
        const defaults = { weaponDamage: 20, weaponRange: 32, fireCooldown: 0.45, maxHealth: 100, maxShield: 60, health: 100, shield: 60, kills: 0, lastHitAt: 0, invulnerableUntil: 0 };
        this.combat[key] = defaults[key];
      }
    });
    if (!Array.isArray(this.universe.sectors) || this.universe.sectors.length < 6) {
      this.universe.sectors = this.generateSectors(6);
      this.universe.currentSector = 0;
    }

    this.universe.sectors.forEach((sector, index) => {
      sector.id = index;
      sector.name = sector.name || `Sector ${index + 1}`;
      sector.requiredLevel = this.getSectorUnlockLevel(index);
      if (!Array.isArray(sector.asteroids)) sector.asteroids = this.generateAsteroids(10, index);
      if (!Array.isArray(sector.enemies)) sector.enemies = this.generateEnemies(4, index);
      sector.asteroids.forEach((asteroid) => { asteroid.sectorLevel = index; });
      // Normalize old saves and guarantee every sector has NPCs.
      if (sector.enemies.length < 3) {
        const needed = 3 - sector.enemies.length;
        const startId = sector.enemies.reduce((max, enemy) => Math.max(max, Number(enemy.id) || 0), -1) + 1;
        for (let i = 0; i < needed; i += 1) {
          sector.enemies.push(this.createEnemy(startId + i, index));
        }
      }
      sector.enemies.forEach((enemy, enemyIndex) => {
        enemy.sectorLevel = index;
        if (!enemy.position) enemy.position = this.generateEnemyPosition();
        if (!enemy.roamTarget) enemy.roamTarget = this.generateEnemyRoamTarget();
        if (typeof enemy.roamWait !== "number") enemy.roamWait = this.randomBetween(0.2, 1.5);
        if (typeof enemy.projectileSpeed !== "number") enemy.projectileSpeed = 15 + index * 1.5;
        if (typeof enemy.projectileRange !== "number") enemy.projectileRange = 60;
        if (typeof enemy.attackCooldown !== "number") enemy.attackCooldown = 1 + enemyIndex * 0.25;
        if (typeof enemy.damage !== "number") enemy.damage = 7 + index;
      });
    });

    // Old asteroid compatibility
    this.universe.sectors.forEach(
      (sector) => {
        sector.asteroids.forEach(
          (asteroid) => {
            if (
              !asteroid.position
            ) {
              asteroid.position =
                {
                  x:
                    (asteroid.x -
                      50) /
                    2,

                  y: 0,

                  z:
                    (asteroid.y -
                      50) /
                    2,
                };
            }

            if (
              !asteroid.oreType
            ) {
              asteroid.oreType =
                "iron";
            }

            if (
              typeof asteroid
                .remainingOre !==
              "number"
            ) {
              asteroid.remainingOre =
                asteroid.mined
                  ? 0
                  : asteroid.ore;
            }

            if (
              typeof asteroid
                .size !==
              "number"
            ) {
              asteroid.size =
                1.2;
            }

            if (
              !asteroid.rotation
            ) {
              asteroid.rotation =
                {
                  x: 0,
                  y: 0,
                  z: 0,
                };
            }

            if (
              asteroid.mined &&
              !asteroid.respawnAt
            ) {
              asteroid.respawnAt =
                Date.now() +
                this.randomBetween(
                  5000,
                  15000
                );
            }
          }
        );
      }
    );
  }

  // ====================================================
  // STATION HUB / NPCs
  // ====================================================

  getReputationRank() {
    const rep = Number(this.player.progress?.reputation || 0);
    if (rep >= 100) return { name: "Elite Miner", next: null, progress: 100 };
    if (rep >= 60) return { name: "Veteran", next: 100, progress: rep };
    if (rep >= 40) return { name: "Trusted", next: 60, progress: rep };
    if (rep >= 20) return { name: "Regular", next: 40, progress: rep };
    return { name: "Newcomer", next: 20, progress: rep };
  }

  interactWithStationContact(contactId) {
    if (!this.isDocked()) return { success: false, message: "Dock at the Mining Station to speak with station personnel." };
    const contact = this.stationContacts.find((item) => item.id === contactId);
    if (!contact) return { success: false, message: "Station contact unavailable." };
    const rep = Number(this.player.progress?.reputation || 0);
    if (rep < contact.unlock) {
      return { success: false, message: `${contact.name} is not available yet. Reputation ${contact.unlock} required.` };
    }
    const lines = {
      quartermaster: "Cargo supplies are ready. Keep your hold clear before long mining runs.",
      engineer: "Your ship is holding together. Bring credits and I can keep improving it.",
      broker: "Watch the market cycle. Rare ores can spike when deeper sectors open up.",
      mission: "The frontier needs miners who can fight and deliver. Check your contracts regularly.",
    };
    return { success: true, message: `${contact.name} — ${lines[contact.id]}` };
  }

  // ====================================================
  // SAVE GAME
  // ====================================================

  saveGame() {
    const saveData = {
      player: this.player,

      universe:
        this.universe,

      missions:
        this.missions,

      combat:
        this.combat,

      economy:
        this.economy,
    };

    localStorage.setItem(
      "spaceGameSave",
      JSON.stringify(
        saveData
      )
    );
  }

  // ====================================================
  // LOAD GAME
  // ====================================================

  loadGame() {
    const saveData =
      localStorage.getItem(
        "spaceGameSave"
      );

    if (!saveData) {
      return false;
    }

    try {
      const data =
        JSON.parse(
          saveData
        );

      if (
        data.player
      ) {
        this.player =
          data.player;
      }

      if (
        data.universe
      ) {
        this.universe =
          data.universe;
      }

      if (
        data.missions
      ) {
        this.missions =
          data.missions;
      }

      if (data.combat) {
        this.combat = data.combat;
      }

      if (data.economy) {
        this.economy = {
          ...this.economy,
          ...data.economy,
        };
      }

      this.normalizePlayer();
      this.checkMissions();

      this.stopMining();

      return true;
    } catch (error) {
      console.error(
        "Failed to load save:",
        error
      );

      return false;
    }
  }

  // ====================================================
  // CURRENT SECTOR
  // ====================================================

  getCurrentSector() {
    return (
      this.universe
        .sectors[
        this.universe
          .currentSector
      ]
    );
  }

  // ====================================================
  // GAME STATE
  // ====================================================

  getGameState() {
    return {
      player:
        this.player,

      universe:
        this.universe,

      currentSector:
        this.getCurrentSector(),

      sectorInfo:
        this.universe.sectors.map((sector, index) => ({
          id: index,
          name: sector.name,
          requiredLevel: this.getSectorUnlockLevel(index),
          unlocked: this.isSectorUnlocked(index),
          asteroidCount: sector.asteroids?.filter((a) => !a.mined).length || 0,
          danger: index + 1,
        })),

      enemies:
        this.getCurrentSector()?.enemies || [],

      combat: {
        ...this.combat,
        projectiles: this.combat.projectiles.map((projectile) => ({
          id: projectile.id,
          enemyId: projectile.enemyId,
          position: { ...projectile.position },
          damage: projectile.damage,
        })),
      },

      missions:
        this.missions,

      oreTypes:
        this.oreTypes,

      market: {
        prices: this.getMarketPrices(),
        updatedAt: this.economy?.marketUpdatedAt ?? Date.now(),
        cycle: this.economy?.marketCycle ?? Math.floor(Date.now() / 60000),
      },

      economy: {
        fuelPrice: this.economy?.fuelPrice ?? 3,
        repairHullPrice: this.economy?.repairHullPrice ?? 5,
        repairShieldPrice: this.economy?.repairShieldPrice ?? 2,
      },

      reputation: this.getReputationRank(),

      stationContacts: this.stationContacts.map((contact) => ({
        ...contact,
        available: Number(this.player.progress?.reputation || 0) >= contact.unlock && this.isDocked(),
      })),

      station: {
        ...this.station,
        distance: this.getDistanceToStation(),
        docked: this.isDocked(),
      },

      miningActive:
        this.miningActive,

      miningProgress:
        this.miningProgress,

      miningTarget:
        this.miningTarget,
    };
  }
}