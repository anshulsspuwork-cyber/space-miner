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
    };

    // ==================================================
    // UNIVERSE
    // ==================================================

    this.universe = {
      currentSector: 0,

      sectors:
        this.generateSectors(10),
    };

    // ==================================================
    // MISSIONS
    // ==================================================

    this.missions = [
      {
        id: 1,
        title: "Mine 50 Ore",
        target: 50,
        completed: false,
        reward: 500,
      },

      {
        id: 2,
        title: "Earn 1000 Credits",
        target: 1000,
        completed: false,
        reward: 1000,
      },

      {
        id: 3,
        title: "Upgrade Ship",
        target: 1,
        completed: false,
        reward: 2000,
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

  getRandomOreType() {
    const entries =
      Object.values(
        this.oreTypes
      );

    const totalWeight =
      entries.reduce(
        (sum, ore) =>
          sum + ore.rarity,
        0
      );

    let random =
      Math.random() *
      totalWeight;

    for (const ore of entries) {
      random -= ore.rarity;

      if (random <= 0) {
        return ore.id;
      }
    }

    return "iron";
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
            Math.floor(
              this.randomBetween(
                8,
                15
              )
            )
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

  generateAsteroids(count) {
    const asteroids = [];

    for (
      let i = 0;
      i < count;
      i++
    ) {
      asteroids.push(
        this.createAsteroid(i)
      );
    }

    return asteroids;
  }

  // ====================================================
  // CREATE ASTEROID
  // ====================================================

  createAsteroid(id) {
    const oreType =
      this.getRandomOreType();

    const ore =
      this.randomBetween(
        15,
        60
      );

    return {
      id,

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
    const oreType =
      this.getRandomOreType();

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
      sectorId >=
        this.universe.sectors
          .length
    ) {
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
    this.missions.forEach(
      (mission) => {
        if (
          mission.completed
        ) {
          return;
        }

        if (
          mission.id === 1 &&
          this.player.inventory
            .ore >=
            mission.target
        ) {
          mission.completed =
            true;

          this.player.credits +=
            mission.reward;
        }

        if (
          mission.id === 2 &&
          this.player.credits >=
            mission.target
        ) {
          mission.completed =
            true;

          this.player.credits +=
            mission.reward;
        }

        if (
          mission.id === 3 &&
          this.player.ship.level >=
            mission.target
        ) {
          mission.completed =
            true;

          this.player.credits +=
            mission.reward;
        }
      }
    );
  }

  // ====================================================
  // NORMALIZE OLD SAVES
  // ====================================================

  normalizePlayer() {
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

      this.normalizePlayer();

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

      missions:
        this.missions,

      oreTypes:
        this.oreTypes,

      miningActive:
        this.miningActive,

      miningProgress:
        this.miningProgress,

      miningTarget:
        this.miningTarget,
    };
  }
}