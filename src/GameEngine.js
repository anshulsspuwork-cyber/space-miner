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

  generateEnemyPosition() {
    let position;
    do {
      position = {
        x: this.randomBetween(-27, 27),
        y: this.randomBetween(-12, 12),
        z: this.randomBetween(-27, 27),
      };
    } while (
      Math.sqrt(position.x * position.x + position.y * position.y + position.z * position.z) < 12
    );
    return position;
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
      health: type.health,
      maxHealth: type.health,
      speed: type.speed,
      damage: type.damage,
      reward: type.reward,
      scale: type.scale,
      attackCooldown: this.randomBetween(0.8, 1.8),
      projectileSpeed: 15 + sectorLevel * 1.5,
      projectileRange: 30,
      respawnAt: null,
      destroyed: false,
    };
  }

  generateEnemies(count, sectorLevel = 0) {
    const enemies = [];
    for (let i = 0; i < count; i += 1) enemies.push(this.createEnemy(i, sectorLevel));
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
      const distance = this.getDistanceToEnemy(enemy);
      const ship = this.player.ship.position;
      const dx = ship.x - enemy.position.x;
      const dy = ship.y - enemy.position.y;
      const dz = ship.z - enemy.position.z;
      const len = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;

      if (distance < 25 && distance > 8) {
        enemy.position.x += (dx / len) * enemy.speed * dt;
        enemy.position.y += (dy / len) * enemy.speed * dt;
        enemy.position.z += (dz / len) * enemy.speed * dt;
      }

      if (distance <= 24 && enemy.attackCooldown <= 0 && now >= this.combat.invulnerableUntil) {
        this.combat.projectiles.push({
          id: `${enemy.id}-${now}-${Math.random().toString(36).slice(2, 7)}`,
          enemyId: enemy.id,
          position: { ...enemy.position },
          velocity: { x: (dx / len) * enemy.projectileSpeed, y: (dy / len) * enemy.projectileSpeed, z: (dz / len) * enemy.projectileSpeed },
          damage: enemy.damage,
          distance: 0,
          maxDistance: enemy.projectileRange,
        });
        enemy.attackCooldown = this.randomBetween(1.4, 2.4);
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
    this.player.ship.position = {
      x: position.x,
      y: position.y,
      z: position.z,
    };
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
            definition.price;
        }
      }
    );

    this.player.credits +=
      totalCredits;
    this.player.progress.totalCreditsEarned += totalCredits;
    this.player.progress.totalCreditsFromSales += totalCredits;

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
      };
    } else {
      this.player.progress.totalMined = Number(this.player.progress.totalMined || 0);
      this.player.progress.totalCreditsEarned = Number(this.player.progress.totalCreditsEarned || 0);
      this.player.progress.totalCreditsFromSales = Number(this.player.progress.totalCreditsFromSales || 0);
      this.player.progress.totalUpgrades = Number(this.player.progress.totalUpgrades || 0);
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
      sector.enemies.forEach((enemy) => { enemy.sectorLevel = index; });
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