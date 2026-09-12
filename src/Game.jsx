import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";

import { GameEngine } from "./GameEngine";
import SpaceScene from "./SpaceScene";
import "./Game.css";

export default function Game() {
  const [game, setGame] = useState(null);
  const [gameState, setGameState] = useState(null);

  const [selectedAsteroid, setSelectedAsteroid] =
    useState(null);

  const [message, setMessage] =
    useState("");

  // Sidebar is open by default.
  const [sidebarOpen, setSidebarOpen] =
    useState(true);

  const animationFrameRef =
    useRef(null);

  const lastTimeRef =
    useRef(Date.now());

  // ==================================================
  // INITIALIZE
  // ==================================================

  useEffect(() => {
    const engine = new GameEngine();

    engine.loadGame();

    setGame(engine);

    setGameState(
      engine.getGameState()
    );

    return () => {
      if (
        animationFrameRef.current
      ) {
        cancelAnimationFrame(
          animationFrameRef.current
        );
      }
    };
  }, []);

  // ==================================================
  // GAME LOOP
  // ==================================================

  useEffect(() => {
    if (!game) {
      return;
    }

    const loop = () => {
      const now = Date.now();

      const delta =
        now -
        lastTimeRef.current;

      lastTimeRef.current =
        now;

      // Update mining + asteroid regeneration
      game.updateMining(delta);

      setGameState(
        game.getGameState()
      );

      animationFrameRef.current =
        requestAnimationFrame(
          loop
        );
    };

    animationFrameRef.current =
      requestAnimationFrame(
        loop
      );

    return () => {
      if (
        animationFrameRef.current
      ) {
        cancelAnimationFrame(
          animationFrameRef.current
        );
      }
    };
  }, [game]);

  // ==================================================
  // SAVE
  // ==================================================

  useEffect(() => {
    if (!game) {
      return;
    }

    const save =
      setInterval(() => {
        game.saveGame();
      }, 5000);

    return () => {
      clearInterval(save);
    };
  }, [game]);

  // ==================================================
  // MESSAGE
  // ==================================================

  const showMessage = useCallback(
    (text) => {
      setMessage(text);

      setTimeout(() => {
        setMessage("");
      }, 2500);
    },
    []
  );

  // ==================================================
  // ASTEROID CLICK
  // ==================================================

  const handleMineAsteroid =
    useCallback(
      (asteroidId) => {
        if (!game) {
          return;
        }

        const result =
          game.startMining(
            asteroidId
          );

        showMessage(
          result.message
        );

        if (result.success) {
          setSelectedAsteroid(
            asteroidId
          );

          setGameState(
            game.getGameState()
          );
        }
      },
      [game, showMessage]
    );

  // ==================================================
  // SHIP MOVEMENT
  // ==================================================

  const handleShipMove =
    useCallback(
      (position) => {
        if (!game) {
          return;
        }

        game.setShipPosition(
          position
        );
      },
      [game]
    );

  // ==================================================
  // SELL
  // ==================================================

  const handleSellOre = () => {
    if (!game || !gameState) {
      return;
    }

    const ore =
      gameState.player
        .inventory.ore;

    if (ore <= 0) {
      showMessage(
        "📦 Cargo is empty."
      );

      return;
    }

    const earned =
      game.sellOre();

    showMessage(
      `💰 Sold ${ore.toFixed(
        1
      )} ore for ${earned.toFixed(
        0
      )} credits!`
    );

    setGameState(
      game.getGameState()
    );
  };

  // ==================================================
  // UPGRADE
  // ==================================================

  const handleUpgradeShip =
    () => {
      if (!game) {
        return;
      }

      if (
        game.upgradeShip()
      ) {
        showMessage(
          "🚀 Ship upgraded!"
        );

        setGameState(
          game.getGameState()
        );
      } else {
        showMessage(
          "❌ Not enough credits!"
        );
      }
    };

  // ==================================================
  // TRAVEL
  // ==================================================

  const handleTravel =
    (sectorId) => {
      if (!game) {
        return;
      }

      game.travelToSector(
        sectorId
      );

      setSelectedAsteroid(
        null
      );

      setGameState(
        game.getGameState()
      );

      showMessage(
        `🚀 Travelling to Sector ${
          sectorId + 1
        }`
      );
    };

  // ==================================================
  // TOGGLE SIDEBAR
  // ==================================================

  const toggleSidebar = () => {
    setSidebarOpen(
      (open) => !open
    );
  };

  // ==================================================
  // LOADING
  // ==================================================

  if (!gameState) {
    return (
      <div className="loading">
        Loading SPACE MINER...
      </div>
    );
  }

  // ==================================================
  // GAME DATA
  // ==================================================

  const {
    player,
    universe,
    currentSector,
    missions,
    oreTypes,
    miningActive,
    miningProgress,
    miningTarget,
  } = gameState;

  const currentAsteroid =
    miningTarget !== null
      ? currentSector
          ?.asteroids?.[
            miningTarget
          ]
      : null;

  const miningPercentage =
    currentAsteroid &&
    currentAsteroid.remainingOre >
      0
      ? Math.min(
          100,
          (miningProgress /
            currentAsteroid
              .remainingOre) *
            100
        )
      : 0;

  // ==================================================
  // INVENTORY
  // ==================================================

  const inventoryEntries =
    Object.entries(
      player.inventory
        .ores || {}
    ).filter(
      ([, amount]) =>
        amount > 0.01
    );

  // ==================================================
  // TOTAL CARGO VALUE
  // ==================================================

  const cargoValue =
    inventoryEntries.reduce(
      (total, [type, amount]) => {
        const ore =
          oreTypes[type];

        if (!ore) {
          return total;
        }

        return (
          total +
          amount *
            ore.price
        );
      },
      0
    );

  // ==================================================
  // RENDER
  // ==================================================

  return (
    <div className="space-game">

      {/* ==================================================
          FULL SCREEN SPACE
      ================================================== */}

      <div className="space-world">

        <SpaceScene
          asteroids={
            currentSector.asteroids
          }

          selectedAsteroid={
            selectedAsteroid
          }

          miningActive={
            miningActive
          }

          shipPosition={
            player.ship.position
          }

          shipSpeed={
            player.ship.speed
          }

          onAsteroidClick={
            handleMineAsteroid
          }

          onShipMove={
            handleShipMove
          }
        />

      </div>

      {/* ==================================================
          TOP BAR
      ================================================== */}

      <div className="space-top-bar">

        <div className="game-logo">
          🚀 SPACE MINER
        </div>

        <div className="top-bar-info">

          <span>
            🌌{" "}
            {currentSector.name}
          </span>

          <span>
            💰{" "}
            {player.credits.toFixed(
              0
            )} CR
          </span>

          <span>
            📦{" "}
            {player.inventory.ore.toFixed(
              1
            )}
            /
            {
              player.ship
                .cargoCapacity
            }
          </span>

        </div>

        <button
          className="sidebar-toggle"
          onClick={
            toggleSidebar
          }
          aria-label="Toggle game panel"
        >
          {sidebarOpen
            ? "✕"
            : "☰"}
        </button>

      </div>

      {/* ==================================================
          MESSAGE
      ================================================== */}

      {message && (
        <div className="floating-message">
          {message}
        </div>
      )}

      {/* ==================================================
          MINING OVERLAY
      ================================================== */}

      {miningActive &&
        currentAsteroid && (
          <div className="floating-mining">

            <div className="mining-title">
              ⛏️ MINING
            </div>

            <div className="mining-ore">
              {
                oreTypes[
                  currentAsteroid
                    .oreType
                ]?.symbol
              }{" "}
              {
                oreTypes[
                  currentAsteroid
                    .oreType
                ]?.name
              }
            </div>

            <div className="mining-value">
              {
                oreTypes[
                  currentAsteroid
                    .oreType
                ]?.price
              }{" "}
              CR / ore
            </div>

            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{
                  width: `${miningPercentage}%`,
                }}
              />
            </div>

            <div className="mining-percent">
              {miningPercentage.toFixed(
                0
              )}
              %
            </div>

          </div>
        )}

      {/* ==================================================
          SIDEBAR BACKDROP
      ================================================== */}

      {sidebarOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() =>
            setSidebarOpen(false)
          }
        />
      )}

      {/* ==================================================
          SIDEBAR
      ================================================== */}

      <aside
        className={`game-sidebar ${
          sidebarOpen
            ? "sidebar-open"
            : "sidebar-closed"
        }`}
      >

        {/* SIDEBAR HEADER */}

        <div className="sidebar-header">

          <div>
            <div className="sidebar-title">
              CONTROL PANEL
            </div>

            <div className="sidebar-sector">
              🌌{" "}
              {currentSector.name}
            </div>
          </div>

          <button
            className="sidebar-close"
            onClick={() =>
              setSidebarOpen(false)
            }
          >
            ✕
          </button>

        </div>

        {/* ==================================================
            SHIP STATUS
        ================================================== */}

        <div className="panel">

          <h3>
            🚀 SHIP STATUS
          </h3>

          <div className="status-row">
            <span>Name</span>
            <strong>
              {player.ship.name}
            </strong>
          </div>

          <div className="status-row">
            <span>Level</span>
            <strong>
              {player.ship.level}
            </strong>
          </div>

          <div className="status-row">
            <span>Cargo</span>
            <strong>
              {player.inventory.ore.toFixed(
                1
              )}
              /
              {
                player.ship
                  .cargoCapacity
              }
            </strong>
          </div>

          <div className="status-row">
            <span>Mining</span>
            <strong>
              {player.ship.miningSpeed.toFixed(
                1
              )}{" "}
              ore/s
            </strong>
          </div>

          <div className="status-row">
            <span>Speed</span>
            <strong>
              {player.ship.speed.toFixed(
                1
              )}{" "}
              m/s
            </strong>
          </div>

        </div>

        {/* ==================================================
            CREDITS
        ================================================== */}

        <div className="panel">

          <h3>
            💰 CREDITS
          </h3>

          <div className="credits-display">
            {player.credits.toFixed(
              0
            )}{" "}
            CR
          </div>

          <button
            className="btn btn-sell"
            onClick={
              handleSellOre
            }
          >
            💰 SELL ALL ORE
          </button>

        </div>

        {/* ==================================================
            CARGO
        ================================================== */}

        <div className="panel">

          <h3>
            📦 CARGO
          </h3>

          <div className="cargo-summary">
            <span>
              Capacity
            </span>

            <strong>
              {player.inventory.ore.toFixed(
                1
              )}
              /
              {
                player.ship
                  .cargoCapacity
              }
            </strong>
          </div>

          <div className="cargo-summary">
            <span>
              Value
            </span>

            <strong>
              {cargoValue.toFixed(
                0
              )}{" "}
              CR
            </strong>
          </div>

          {inventoryEntries.length ===
          0 ? (
            <p className="empty-text">
              Cargo empty
            </p>
          ) : (
            <div className="cargo-list">

              {inventoryEntries.map(
                ([type, amount]) => {
                  const ore =
                    oreTypes[type];

                  return (
                    <div
                      key={type}
                      className="cargo-item"
                    >
                      <span>
                        {ore?.symbol}{" "}
                        {ore?.name ||
                          type}
                      </span>

                      <strong>
                        {amount.toFixed(
                          1
                        )}
                      </strong>
                    </div>
                  );
                }
              )}

            </div>
          )}

        </div>

        {/* ==================================================
            UPGRADE
        ================================================== */}

        <div className="panel">

          <h3>
            🔧 UPGRADE SHIP
          </h3>

          <div className="upgrade-cost">
            Cost:{" "}
            <strong>
              {
                500 *
                player.ship
                  .level
              }{" "}
              CR
            </strong>
          </div>

          <button
            className="btn btn-upgrade"
            onClick={
              handleUpgradeShip
            }
          >
            🚀 UPGRADE
          </button>

        </div>

        {/* ==================================================
            SECTORS
        ================================================== */}

        <div className="panel">

          <h3>
            🌌 SECTORS
          </h3>

          <div className="sector-list">

            {universe.sectors.map(
              (
                sector,
                index
              ) => (
                <button
                  key={
                    sector.id
                  }
                  className={`sector-btn ${
                    universe.currentSector ===
                    index
                      ? "active"
                      : ""
                  }`}
                  onClick={() =>
                    handleTravel(
                      index
                    )
                  }
                >
                  SECTOR{" "}
                  {index + 1}
                </button>
              )
            )}

          </div>

        </div>

        {/* ==================================================
            ORE MARKET
        ================================================== */}

        <div className="panel">

          <h3>
            📈 ORE MARKET
          </h3>

          {Object.values(
            oreTypes
          ).map((ore) => (
            <div
              key={ore.id}
              className="ore-market-row"
            >
              <span>
                {ore.symbol}{" "}
                {ore.name}
              </span>

              <strong>
                {ore.price} CR
              </strong>
            </div>
          ))}

        </div>

        {/* ==================================================
            MISSIONS
        ================================================== */}

        <div className="panel">

          <h3>
            🎯 MISSIONS
          </h3>

          {missions.map(
            (mission) => (
              <div
                key={
                  mission.id
                }
                className={`mission ${
                  mission.completed
                    ? "completed"
                    : ""
                }`}
              >

                <p>
                  {
                    mission.title
                  }
                </p>

                <p className="reward">
                  +
                  {
                    mission.reward
                  }{" "}
                  CR
                </p>

                {mission.completed && (
                  <p>
                    ✅ Completed
                  </p>
                )}

              </div>
            )
          )}

        </div>

        {/* ==================================================
            CONTROLS
        ================================================== */}

        <div className="panel">

          <h3>
            🎮 CONTROLS
          </h3>

          <p>
            ⌨️{" "}
            <strong>
              W / A / S / D
            </strong>
            {" → "}Move
          </p>

          <p>
            ⬆️{" "}
            <strong>
              SPACE
            </strong>
            {" → "}Up
          </p>

          <p>
            ⬇️{" "}
            <strong>
              SHIFT
            </strong>
            {" → "}Down
          </p>

          <p>
            🖱️ Drag → Camera
          </p>

          <p>
            🔍 Wheel → Zoom
          </p>

          <p>
            ⛏️ Click asteroid
            → Mine
          </p>

          <p>
            📱 Joystick → Move
          </p>

        </div>

      </aside>

    </div>
  );
}