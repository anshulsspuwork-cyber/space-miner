import React, { useCallback, useEffect, useRef, useState } from "react";
import { GameEngine } from "./GameEngine";
import SpaceScene from "./SpaceScene";
import "./Game.css";

export default function Game() {
  const [game, setGame] = useState(null);
  const [gameState, setGameState] = useState(null);
  const [selectedAsteroid, setSelectedAsteroid] = useState(null);
  const [selectedEnemy, setSelectedEnemy] = useState(null);
  const [message, setMessage] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const animationFrameRef = useRef(null);
  const lastTimeRef = useRef(Date.now());
  const messageTimerRef = useRef(null);
  const skipNextUnloadSaveRef = useRef(false);

  const showMessage = useCallback((text, duration = 2500) => {
    setMessage(text);
    if (messageTimerRef.current) clearTimeout(messageTimerRef.current);
    messageTimerRef.current = setTimeout(() => setMessage(""), duration);
  }, []);

  useEffect(() => {
    const engine = new GameEngine();
    engine.loadGame();
    setGame(engine);
    setGameState(engine.getGameState());

    const saveBeforeExit = () => {
      if (skipNextUnloadSaveRef.current) return;
      engine.saveGame();
    };
    window.addEventListener("beforeunload", saveBeforeExit);

    return () => {
      window.removeEventListener("beforeunload", saveBeforeExit);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (messageTimerRef.current) clearTimeout(messageTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!game) return;

    lastTimeRef.current = Date.now();
    const loop = () => {
      const now = Date.now();
      const delta = now - lastTimeRef.current;
      lastTimeRef.current = now;
      game.updateMining(delta);
      game.updateCombat(delta);
      setGameState(game.getGameState());
      animationFrameRef.current = requestAnimationFrame(loop);
    };

    animationFrameRef.current = requestAnimationFrame(loop);
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [game]);

  useEffect(() => {
    if (!game) return;
    const save = setInterval(() => game.saveGame(), 5000);
    return () => clearInterval(save);
  }, [game]);

  const handleMineAsteroid = useCallback((asteroidId) => {
    if (!game) return;
    const result = game.startMining(asteroidId);
    showMessage(result.message);

    if (result.success) {
      setSelectedAsteroid(asteroidId);
      setSelectedEnemy(null);
      setGameState(game.getGameState());
    }
  }, [game, showMessage]);

  const handleShipMove = useCallback((position) => {
    if (!game) return;
    game.setShipPosition(position);
  }, [game]);

  const handleEnemyClick = useCallback((enemyId) => {
    setSelectedEnemy(enemyId);
    setSelectedAsteroid(null);
  }, []);

  const handleFireWeapon = useCallback((enemyId) => {
    if (!game) return { success: false };
    const result = game.fireWeapon(enemyId);
    if (result.success) {
      showMessage(result.message);
      setGameState(game.getGameState());
      if (result.destroyed) {
        setSelectedEnemy(null);
        game.saveGame();
      }
    } else if (!result.cooldown && result.message) {
      showMessage(`⚠️ ${result.message}`, 1200);
    }
    return result;
  }, [game, showMessage]);

  const handleFireSelectedEnemy = useCallback(() => {
    if (selectedEnemy === null || selectedEnemy === undefined) {
      showMessage("⚠️ Select an enemy first.", 1500);
      return;
    }
    handleFireWeapon(selectedEnemy);
  }, [selectedEnemy, handleFireWeapon, showMessage]);

  const handleSellOre = () => {
    if (!game || !gameState) return;
    const result = game.sellOreAtStation();
    if (result.success) game.saveGame();
    showMessage(result.success ? `💰 ${result.message}` : `⚠️ ${result.message}`);
    setGameState(game.getGameState());
  };

  const handleUpgradeShip = () => {
    if (!game || !gameState) return;

    if (!gameState.station.docked) {
      showMessage("⚠️ Dock at the Mining Station to upgrade your ship.");
      return;
    }

    if (game.upgradeShip()) {
      game.saveGame();
      showMessage("🚀 Ship upgraded! Cargo, mining and speed increased.");
      setGameState(game.getGameState());
    } else {
      showMessage("❌ Not enough credits for this upgrade.");
    }
  };

  const handleManualSave = useCallback(() => {
    if (!game) return;
    game.saveGame();
    setGameState(game.getGameState());
    showMessage("💾 Game saved successfully.", 1800);
  }, [game, showMessage]);

  const handleNewGame = useCallback(() => {
    const confirmed = window.confirm(
      "START A NEW GAME?\n\nYour current save will be permanently deleted and SPACE MINER will start from the beginning.\n\nThis cannot be undone."
    );

    if (!confirmed) return;

    skipNextUnloadSaveRef.current = true;
    game?.stopMining();
    localStorage.removeItem("spaceGameSave");
    window.location.reload();
  }, [game]);

  const handleResetGame = useCallback(() => {
    const confirmed = window.confirm(
      "RESET SPACE MINER?\n\nThis will permanently delete your saved credits, cargo, upgrades, missions, kills, and unlocked sectors. The game will start from the beginning.\n\nThis cannot be undone."
    );

    if (!confirmed) return;

    skipNextUnloadSaveRef.current = true;
    game?.stopMining();
    localStorage.removeItem("spaceGameSave");
    window.location.reload();
  }, [game]);

  const handleTravel = (sectorId) => {
    if (!game) return;
    const target = gameState?.sectorInfo?.[sectorId];
    if (target && !target.unlocked) {
      showMessage(`🔒 Sector ${sectorId + 1} requires Ship Level ${target.requiredLevel}.`);
      return;
    }
    const success = game.travelToSector(sectorId);
    if (!success) {
      showMessage(`⚠️ Sector ${sectorId + 1} is locked.`);
      return;
    }
    game.saveGame();
    setSelectedAsteroid(null);
    setSelectedEnemy(null);
    showMessage(`🚀 Travelling to Sector ${sectorId + 1}`);
    setGameState(game.getGameState());
  };

  if (!gameState) {
    return <div className="loading">🚀 Loading SPACE MINER...</div>;
  }

  const {
    player,
    universe,
    currentSector,
    missions,
    oreTypes,
    miningActive,
    miningProgress,
    miningTarget,
    station,
    enemies,
    combat,
    sectorInfo,
  } = gameState;

  const currentAsteroid = miningTarget !== null && miningTarget !== undefined
    ? currentSector?.asteroids?.[miningTarget]
    : null;

  const miningPercentage = currentAsteroid && currentAsteroid.remainingOre > 0
    ? Math.min(100, (miningProgress / currentAsteroid.remainingOre) * 100)
    : 0;

  const inventoryEntries = Object.entries(player.inventory.ores || {}).filter(([, amount]) => amount > 0.01);

  const cargoValue = inventoryEntries.reduce((total, [type, amount]) => {
    return total + amount * (oreTypes[type]?.price || 0);
  }, 0);

  const stationDistance = station?.distance ?? 999;
  const docked = Boolean(station?.docked);
  const cargoFull = player.inventory.ore >= player.ship.cargoCapacity - 0.01;
  const nextUpgradeCost = 500 * player.ship.level;

  return (
    <div className="space-game">
      <div className="space-world">
        <SpaceScene
          asteroids={currentSector?.asteroids || []}
          enemies={enemies || currentSector?.enemies || []}
          enemyProjectiles={combat?.projectiles || []}
          selectedAsteroid={selectedAsteroid}
          selectedEnemy={selectedEnemy}
          miningActive={miningActive}
          miningProgress={miningProgress}
          shipPosition={player.ship.position}
          shipSpeed={player.ship.speed}
          stationPosition={station?.position || { x: 0, y: 0, z: -22 }}
          onAsteroidClick={handleMineAsteroid}
          onEnemyClick={handleEnemyClick}
          onFireWeapon={handleFireWeapon}
          onShipMove={handleShipMove}
        />
      </div>

      <div className="space-top-bar">
        <div className="game-logo">🚀 SPACE MINER</div>
        <div className="top-bar-info">
          <div className="top-stat"><span>SECTOR</span><strong>{universe.currentSector + 1}</strong></div>
          <div className="top-stat"><span>CREDITS</span><strong>💰 {player.credits.toFixed(0)}</strong></div>
          <div className={`top-stat cargo-top ${cargoFull ? "danger" : ""}`}>
            <span>CARGO</span>
            <strong>{player.inventory.ore.toFixed(1)} / {player.ship.cargoCapacity}</strong>
          </div>
          <div className="top-combat-stat"><span>HULL</span><strong>🛡️ {combat.health.toFixed(0)} / {combat.shield.toFixed(0)}</strong></div>
          <div className={`top-dock ${docked ? "docked" : ""}`}>
            {docked ? "✓ DOCKED" : `🏪 ${stationDistance.toFixed(1)}m`}
          </div>
        </div>
        <button className="sidebar-toggle" onClick={() => setSidebarOpen((open) => !open)} aria-label="Toggle sidebar">
          {sidebarOpen ? "✕" : "☰"}
        </button>
      </div>

      {message && <div className="game-message">{message}</div>}

      {miningActive && currentAsteroid && (
        <div className="floating-mining">
          <div className="floating-mining-title">
            ⛏️ MINING {oreTypes[currentAsteroid.oreType]?.symbol} {oreTypes[currentAsteroid.oreType]?.name}
          </div>
          <div className="floating-progress"><div style={{ width: `${miningPercentage}%` }} /></div>
          <div className="floating-mining-meta">{miningPercentage.toFixed(0)}% • {player.ship.miningSpeed.toFixed(1)} ore/sec</div>
        </div>
      )}

      {sidebarOpen && <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} />}

      <aside className={`game-sidebar ${sidebarOpen ? "open" : "closed"}`}>
        <div className="sidebar-header">
          <div>
            <div className="sidebar-kicker">COMMAND DECK</div>
            <h2>SHIP CONTROL</h2>
          </div>
          <button onClick={() => setSidebarOpen(false)}>✕</button>
        </div>

        <section className="panel station-panel">
          <div className="panel-title-row">
            <h3>🏪 MINING STATION</h3>
            <span className={docked ? "status-good" : "status-warn"}>{docked ? "DOCKED" : "IN SPACE"}</span>
          </div>
          <p className="station-distance">
            {docked ? "✓ You are inside docking range." : `Distance: ${stationDistance.toFixed(1)}m`}
          </p>
          <button
            className="btn btn-sell"
            onClick={handleSellOre}
            disabled={!docked || player.inventory.ore <= 0}
          >
            {docked ? "💰 SELL ALL CARGO" : "🔒 FLY TO STATION"}
          </button>
          <p className="station-hint">
            {docked ? "Sell your cargo here. Upgrades are also available while docked." : "Fly to the glowing station and enter the green docking ring."}
          </p>
        </section>

        <section className="panel">
          <h3>🚀 SHIP STATUS</h3>
          <div className="stat-grid">
            <div><span>SHIP</span><strong>{player.ship.name}</strong></div>
            <div><span>LEVEL</span><strong>{player.ship.level}</strong></div>
            <div><span>SPEED</span><strong>{player.ship.speed.toFixed(1)} m/s</strong></div>
            <div><span>MINING</span><strong>{player.ship.miningSpeed.toFixed(1)} /s</strong></div>
          </div>
          <div className="cargo-meter-label"><span>CARGO CAPACITY</span><strong>{player.inventory.ore.toFixed(1)} / {player.ship.cargoCapacity}</strong></div>
          <div className="cargo-meter"><div style={{ width: `${Math.min(100, (player.inventory.ore / player.ship.cargoCapacity) * 100)}%` }} /></div>
          <div className="cargo-value">Estimated cargo value: <strong>{cargoValue.toFixed(0)} CR</strong></div>
        </section>

        <section className="panel combat-panel">
          <div className="panel-title-row"><h3>⚔️ COMBAT</h3><span className={combat.health > 35 ? "status-good" : "status-warn"}>{combat.health > 0 ? "ACTIVE" : "DISABLED"}</span></div>
          <div className="combat-bars">
            <div className="combat-bar-row"><span>HULL</span><strong>{combat.health.toFixed(0)} / {combat.maxHealth.toFixed(0)}</strong></div>
            <div className="combat-bar hull"><div style={{ width: `${Math.min(100, (combat.health / combat.maxHealth) * 100)}%` }} /></div>
            <div className="combat-bar-row"><span>SHIELD</span><strong>{combat.shield.toFixed(0)} / {combat.maxShield.toFixed(0)}</strong></div>
            <div className="combat-bar shield"><div style={{ width: `${Math.min(100, (combat.shield / combat.maxShield) * 100)}%` }} /></div>
          </div>
          <div className="combat-stats"><span>WEAPON <strong>{combat.weaponDamage.toFixed(0)} DMG</strong></span><span>KILLS <strong>{combat.kills}</strong></span></div>
          <div className="combat-stats progression-stats"><span>MINED <strong>{(player.progress?.totalMined || 0).toFixed(0)}</strong></span><span>UPGRADES <strong>{player.progress?.totalUpgrades || 0}</strong></span></div>
          <button className="btn btn-fire" onClick={handleFireSelectedEnemy} disabled={selectedEnemy === null || selectedEnemy === undefined || combat.health <= 0}>
            {selectedEnemy === null || selectedEnemy === undefined ? "🎯 SELECT ENEMY" : "🔫 FIRE WEAPON"}
          </button>
          <p className="station-hint">Click an enemy to target it. Weapons only fire when you press F or this button.</p>
        </section>

        <section className="panel">
          <h3>💰 WALLET</h3>
          <div className="big-credits">{player.credits.toFixed(0)} <small>CR</small></div>
        </section>

        <section className="panel">
          <h3>📦 CARGO</h3>
          {inventoryEntries.length === 0 ? (
            <p className="empty-text">Cargo hold empty. Find an asteroid to start mining.</p>
          ) : (
            inventoryEntries.map(([type, amount]) => {
              const ore = oreTypes[type];
              return (
                <div key={type} className="cargo-item">
                  <span>{ore?.symbol} {ore?.name || type}</span>
                  <strong>{amount.toFixed(1)}</strong>
                </div>
              );
            })
          )}
        </section>

        <section className="panel">
          <h3>🔧 SHIP UPGRADE</h3>
          <div className="upgrade-info">
            <p>Next level: <strong>{player.ship.level + 1}</strong></p>
            <p>Cost: <strong>{nextUpgradeCost} CR</strong></p>
            <p className="upgrade-bonus">+50 cargo • +0.5 mining/s • +1.5 speed</p>
          </div>
          <button className="btn btn-upgrade" onClick={handleUpgradeShip} disabled={!docked || player.credits < nextUpgradeCost}>
            {!docked ? "🔒 DOCK TO UPGRADE" : player.credits < nextUpgradeCost ? "NOT ENOUGH CREDITS" : "🚀 UPGRADE SHIP"}
          </button>
        </section>

        <section className="panel">
          <h3>🌌 SECTORS</h3>
          <p className="station-hint">Upgrade your ship to unlock deeper sectors. Higher sectors contain rarer ores and stronger enemies.</p>
          <div className="sector-list">
            {universe.sectors.map((sector, index) => {
            const info = sectorInfo?.[index] || { unlocked: index === 0, requiredLevel: index + 1, asteroidCount: 0, danger: index + 1 };
            const unlocked = Boolean(info.unlocked);
            return (
              <button
                key={sector.id}
                className={`sector-btn ${universe.currentSector === index ? "active" : ""} ${!unlocked ? "locked" : ""}`}
                onClick={() => handleTravel(index)}
                disabled={!unlocked}
              >
                <span>{unlocked ? "🌌" : "🔒"} SECTOR {index + 1}</span>
                <small>{unlocked ? `${info.asteroidCount} asteroids • Danger ${info.danger}/6` : `Requires Ship Level ${info.requiredLevel}`}</small>
              </button>
            );
          })}
          </div>
        </section>

        <section className="panel">
          <h3>📈 ORE MARKET</h3>
          {Object.values(oreTypes).map((ore) => (
            <div key={ore.id} className="ore-market-row">
              <span>{ore.symbol} {ore.name}</span>
              <strong>{ore.price} CR</strong>
            </div>
          ))}
        </section>

        <section className="panel missions-panel">
          <div className="panel-title-row">
            <h3>🎯 MISSIONS</h3>
            <span className="mission-count">{missions.filter((mission) => mission.completed).length}/{missions.length}</span>
          </div>
          {missions.map((mission) => {
            const progress = Math.min(100, (Number(mission.progress || 0) / Math.max(1, Number(mission.target || 1))) * 100);
            return (
              <div key={mission.id} className={`mission ${mission.completed ? "completed" : ""}`}>
                <div className="mission-top">
                  <div>
                    <strong>{mission.title}</strong>
                    <small>{mission.description}</small>
                  </div>
                  <div className="reward">+{mission.reward} CR</div>
                </div>
                <div className="mission-progress-row">
                  <span>{mission.completed ? "COMPLETE" : `${Number(mission.progress || 0).toFixed(0)} / ${mission.target}`}</span>
                  <span>{progress.toFixed(0)}%</span>
                </div>
                <div className="mission-progress"><div style={{ width: `${progress}%` }} /></div>
                {mission.completed && <div className="mission-complete">✓ REWARD CLAIMED</div>}
              </div>
            );
          })}
        </section>

        <section className="panel game-data-panel">
          <div className="panel-title-row">
            <h3>💾 GAME DATA</h3>
            <span className="save-label">SAVE</span>
          </div>
          <p className="station-hint">Auto-save runs every 5 seconds. You can also save manually or start a completely new game.</p>
          <div className="game-data-buttons">
            <button className="btn btn-save" onClick={handleManualSave}>
              💾 SAVE GAME
            </button>
            <button className="btn btn-new-game" onClick={handleNewGame}>
              🆕 NEW GAME
            </button>
            <button className="btn btn-reset" onClick={handleResetGame}>
              ↻ RESET GAME
            </button>
          </div>
        </section>

        <section className="panel controls-panel">
          <h3>🎮 CONTROLS</h3>
          <p>W / A / S / D → Move</p>
          <p>SPACE → Up</p>
          <p>SHIFT → Down</p>
          <p>🖱️ Drag → Rotate camera</p>
          <p>🔍 Wheel → Zoom</p>
          <p>⛏️ Click asteroid → Target / Mine</p>
          <p>⚔️ Click enemy → Target • F → Fire weapon</p>
          <p>📱 Joystick → Move</p>
        </section>
      </aside>
    </div>
  );
}
