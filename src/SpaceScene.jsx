import React, { useEffect, useRef, useState } from "react";
import * as BABYLON from "babylonjs";

export default function SpaceScene({
  asteroids,
  enemies = [],
  enemyProjectiles = [],
  spaceEvent = { active: null },
  selectedAsteroid,
  selectedEnemy = null,
  miningActive,
  miningProgress = 0,
  shipPosition,
  shipSpeed,
  shipFuel = 100,
  stationPosition,
  onAsteroidClick,
  onEnemyClick,
  onFireWeapon,
  onShipMove,
}) {
  const canvasRef = useRef(null);
  const asteroidsRef = useRef(asteroids || []);
  const enemiesRef = useRef(enemies || []);
  const enemyProjectilesRef = useRef(enemyProjectiles || []);
  const spaceEventRef = useRef(spaceEvent || { active: null });

  useEffect(() => {
    enemyProjectilesRef.current = enemyProjectiles || [];
  }, [enemyProjectiles]);
  useEffect(() => {
    spaceEventRef.current = spaceEvent || { active: null };
  }, [spaceEvent]);
  const selectedRef = useRef(selectedAsteroid);
  const selectedEnemyRef = useRef(selectedEnemy);
  const miningRef = useRef(miningActive);
  const shipPositionRef = useRef(shipPosition || { x: 0, y: 0, z: 0 });
  const shipSpeedRef = useRef(shipSpeed || 8);
  const shipFuelRef = useRef(Number(shipFuel ?? 100));
  const stationPositionRef = useRef(stationPosition || { x: 0, y: 0, z: -22 });
  const onAsteroidClickRef = useRef(onAsteroidClick);
  const onEnemyClickRef = useRef(onEnemyClick);
  const onFireWeaponRef = useRef(onFireWeapon);
  const onShipMoveRef = useRef(onShipMove);
  const [localTargetId, setLocalTargetId] = useState(selectedAsteroid ?? null);
  const localTargetIdRef = useRef(selectedAsteroid ?? null);
  const [localEnemyTargetId, setLocalEnemyTargetId] = useState(selectedEnemy ?? null);
  const localEnemyTargetIdRef = useRef(selectedEnemy ?? null);

  useEffect(() => { asteroidsRef.current = asteroids || []; }, [asteroids]);
  useEffect(() => { enemiesRef.current = enemies || []; }, [enemies]);
  useEffect(() => {
    selectedRef.current = selectedAsteroid;
    if (selectedAsteroid !== null && selectedAsteroid !== undefined) {
      localTargetIdRef.current = selectedAsteroid;
      setLocalTargetId(selectedAsteroid);
    }
  }, [selectedAsteroid]);
  useEffect(() => {
    selectedEnemyRef.current = selectedEnemy;
    if (selectedEnemy !== null && selectedEnemy !== undefined) {
      localEnemyTargetIdRef.current = selectedEnemy;
      setLocalEnemyTargetId(selectedEnemy);
    }
  }, [selectedEnemy]);
  useEffect(() => { miningRef.current = miningActive; }, [miningActive]);
  useEffect(() => { shipPositionRef.current = shipPosition || { x: 0, y: 0, z: 0 }; }, [shipPosition]);
  useEffect(() => { shipSpeedRef.current = shipSpeed || 8; }, [shipSpeed]);
  useEffect(() => { shipFuelRef.current = Number(shipFuel ?? 100); }, [shipFuel]);
  useEffect(() => { stationPositionRef.current = stationPosition || { x: 0, y: 0, z: -22 }; }, [stationPosition]);
  useEffect(() => { onAsteroidClickRef.current = onAsteroidClick; }, [onAsteroidClick]);
  useEffect(() => { onEnemyClickRef.current = onEnemyClick; }, [onEnemyClick]);
  useEffect(() => { onFireWeaponRef.current = onFireWeapon; }, [onFireWeapon]);
  useEffect(() => { onShipMoveRef.current = onShipMove; }, [onShipMove]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = new BABYLON.Engine(canvas, true, {
      preserveDrawingBuffer: true,
      stencil: true,
      adaptToDeviceRatio: true,
    });
    const scene = new BABYLON.Scene(engine);
    scene.clearColor = new BABYLON.Color4(0.002, 0.004, 0.015, 1);

    const camera = new BABYLON.ArcRotateCamera(
      "SpaceCamera",
      Math.PI,
      Math.PI / 2.8,
      28,
      BABYLON.Vector3.Zero(),
      scene
    );
    // Desktop: Babylon handles mouse camera controls.
    // Mobile/tablet: do NOT attach Babylon's touch camera input because the
    // game uses its own joystick/buttons and touch gestures must never rotate
    // or fight the camera.
    const isTouchDevice = window.matchMedia && window.matchMedia("(pointer: coarse)").matches;
    if (!isTouchDevice) {
      camera.attachControl(canvas, true);
    }
    camera.lowerRadiusLimit = 10;
    camera.upperRadiusLimit = 65;
    camera.wheelPrecision = 35;
    camera.panningSensibility = 0;
    camera.minZ = 0.1;

    const hemi = new BABYLON.HemisphericLight("SpaceLight", new BABYLON.Vector3(0, 1, 0), scene);
    hemi.intensity = 1.15;
    const shipLight = new BABYLON.PointLight("ShipLight", new BABYLON.Vector3(0, 3, 0), scene);
    shipLight.intensity = 1.2;
    shipLight.range = 18;

    for (let i = 0; i < 500; i += 1) {
      const star = BABYLON.MeshBuilder.CreateSphere(`Star${i}`, { diameter: 0.035 + Math.random() * 0.09 }, scene);
      star.position = new BABYLON.Vector3(
        (Math.random() - 0.5) * 180,
        (Math.random() - 0.5) * 120,
        (Math.random() - 0.5) * 180
      );
      const mat = new BABYLON.StandardMaterial(`StarMat${i}`, scene);
      mat.emissiveColor = new BABYLON.Color3(1, 1, 1);
      mat.disableLighting = true;
      star.material = mat;
    }

    // ---------------- PLAYER SHIP ----------------
    // The ship's nose is LOCAL +Z. This makes its orientation and movement easy to keep consistent.
    const ship = new BABYLON.TransformNode("PlayerShip", scene);
    const p = shipPositionRef.current || { x: 0, y: 0, z: 0 };
    ship.position = new BABYLON.Vector3(p.x || 0, p.y || 0, p.z || 0);

    const hullMat = new BABYLON.StandardMaterial("ShipHullMat", scene);
    hullMat.diffuseColor = new BABYLON.Color3(0.035, 0.32, 0.72);
    hullMat.emissiveColor = new BABYLON.Color3(0.008, 0.07, 0.18);

    const hull = BABYLON.MeshBuilder.CreateCylinder("ShipHull", {
      height: 4.8,
      diameterTop: 0,
      diameterBottom: 1.55,
      tessellation: 6,
    }, scene);
    hull.parent = ship;
    hull.rotation.x = Math.PI / 2;
    hull.material = hullMat;

    const cockpitMat = new BABYLON.StandardMaterial("CockpitMat", scene);
    cockpitMat.diffuseColor = new BABYLON.Color3(0.02, 0.1, 0.18);
    cockpitMat.emissiveColor = new BABYLON.Color3(0, 0.28, 0.55);
    const cockpit = BABYLON.MeshBuilder.CreateSphere("ShipCockpit", { diameter: 0.9, segments: 12 }, scene);
    cockpit.parent = ship;
    cockpit.position = new BABYLON.Vector3(0, 0.3, 1.05);
    cockpit.scaling = new BABYLON.Vector3(0.95, 0.5, 1.15);
    cockpit.material = cockpitMat;

    const wingMat = new BABYLON.StandardMaterial("WingMat", scene);
    wingMat.diffuseColor = new BABYLON.Color3(0.02, 0.16, 0.36);
    const wingL = BABYLON.MeshBuilder.CreateBox("ShipWingL", { width: 2.5, height: 0.16, depth: 0.72 }, scene);
    wingL.parent = ship;
    wingL.position = new BABYLON.Vector3(-0.75, 0, 0.1);
    wingL.rotation.y = -0.18;
    wingL.material = wingMat;
    const wingR = wingL.clone("ShipWingR");
    wingR.parent = ship;
    wingR.position.x = 0.75;
    wingR.rotation.y = 0.18;

    const noseMat = new BABYLON.StandardMaterial("ShipNoseMat", scene);
    noseMat.emissiveColor = new BABYLON.Color3(0.05, 0.95, 1);
    noseMat.disableLighting = true;
    const nose = BABYLON.MeshBuilder.CreateSphere("ShipNoseLight", { diameter: 0.25 }, scene);
    nose.parent = ship;
    nose.position = new BABYLON.Vector3(0, 0, 2.25);
    nose.material = noseMat;

    const engineMat = new BABYLON.StandardMaterial("EngineGlowMat", scene);
    engineMat.emissiveColor = new BABYLON.Color3(0, 0.9, 1);
    engineMat.disableLighting = true;
    const engineGlow = BABYLON.MeshBuilder.CreateSphere("EngineGlow", { diameter: 0.75 }, scene);
    engineGlow.parent = ship;
    engineGlow.position = new BABYLON.Vector3(0, 0, -2.05);
    engineGlow.material = engineMat;

    const shipRing = BABYLON.MeshBuilder.CreateTorus("PlayerRing", { diameter: 5.5, thickness: 0.05, tessellation: 48 }, scene);
    shipRing.parent = ship;
    shipRing.rotation.x = Math.PI / 2;
    const shipRingMat = new BABYLON.StandardMaterial("PlayerRingMat", scene);
    shipRingMat.emissiveColor = new BABYLON.Color3(0, 0.8, 1);
    shipRingMat.disableLighting = true;
    shipRingMat.alpha = 0.7;
    shipRing.material = shipRingMat;

    const label = BABYLON.MeshBuilder.CreatePlane("PlayerLabel", { width: 4.2, height: 0.9 }, scene);
    label.parent = ship;
    label.position = new BABYLON.Vector3(0, 3, 0);
    label.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;
    const labelTex = new BABYLON.DynamicTexture("PlayerLabelTex", { width: 512, height: 128 }, scene, true);
    labelTex.hasAlpha = true;
    labelTex.drawText("YOU  •  PLAYER SHIP", 256, 78, "bold 42px Arial", "#8fffff", "transparent", true);
    const labelMat = new BABYLON.StandardMaterial("PlayerLabelMat", scene);
    labelMat.diffuseTexture = labelTex;
    labelMat.opacityTexture = labelTex;
    labelMat.emissiveTexture = labelTex;
    labelMat.disableLighting = true;
    labelMat.backFaceCulling = false;
    label.material = labelMat;

    const oreColors = {
      iron: new BABYLON.Color3(0.38, 0.36, 0.35),
      copper: new BABYLON.Color3(0.65, 0.3, 0.12),
      titanium: new BABYLON.Color3(0.18, 0.55, 0.75),
      gold: new BABYLON.Color3(0.9, 0.65, 0.08),
      crystal: new BABYLON.Color3(0.55, 0.18, 0.85),
      uranium: new BABYLON.Color3(0.15, 0.8, 0.2),
    };

    const asteroidMeshes = new Map();
    const miningParticles = new Map();
    let beam = null;
    let beamCore = null;
    let beamMaterial = null;
    let beamCoreMaterial = null;
    let weaponBeam = null;
    let weaponBeamMaterial = null;
    let weaponBeamUntil = 0;
    let enemyTargetRing = null;
    const enemyMeshes = new Map();
    const enemyProjectileMeshes = new Map();
  const spaceEventMeshes = new Map();
    const enemyExplosionBursts = [];
    let targetRing = null;
    let lastBurstIds = new Set();
    const bursts = [];

    const disposeWeaponBeam = () => {
      if (weaponBeam) weaponBeam.dispose();
      weaponBeam = null;
      if (weaponBeamMaterial) weaponBeamMaterial.dispose();
      weaponBeamMaterial = null;
      weaponBeamUntil = 0;
    };

    const showWeaponBeam = (enemyMesh) => {
      if (!enemyMesh) return;
      const yaw = ship.rotation.y;
      const start = ship.position.add(new BABYLON.Vector3(Math.sin(yaw) * 2.2, 0, Math.cos(yaw) * 2.2));
      const end = enemyMesh.getAbsolutePosition();
      const direction = end.subtract(start);
      const length = direction.length();
      if (length < 0.01) return;

      if (!weaponBeam) {
        weaponBeam = BABYLON.MeshBuilder.CreateCylinder("WeaponBeam", { height: length, diameter: 0.12, tessellation: 10 }, scene);
        weaponBeamMaterial = new BABYLON.StandardMaterial("WeaponBeamMat", scene);
        weaponBeamMaterial.emissiveColor = new BABYLON.Color3(1, 0.25, 0.08);
        weaponBeamMaterial.disableLighting = true;
        weaponBeam.material = weaponBeamMaterial;
      }
      weaponBeam.setEnabled(true);
      aimCylinder(weaponBeam, start, end);
      weaponBeamUntil = performance.now() + 130;
    };

    const createEnemyExplosion = (mesh, id) => {
      const material = new BABYLON.StandardMaterial(`EnemyExplosionMat${id}_${Date.now()}`, scene);
      material.emissiveColor = new BABYLON.Color3(1, 0.25, 0.05);
      material.disableLighting = true;
      const pieces = [];
      const center = mesh.position.clone();
      for (let i = 0; i < 18; i += 1) {
        const piece = BABYLON.MeshBuilder.CreatePolyhedron(`EnemyExplosion${id}_${i}`, { type: 1, size: 0.12 + Math.random() * 0.16 }, scene);
        piece.position = center.clone();
        piece.material = material;
        const velocity = new BABYLON.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5);
        if (velocity.lengthSquared() < 0.01) velocity.z = 1;
        velocity.normalize().scaleInPlace(3 + Math.random() * 5);
        pieces.push({ mesh: piece, velocity });
      }
      enemyExplosionBursts.push({ pieces, material, time: performance.now() });
    };

    const makeEnemy = (enemy) => {
      if (!enemy) return null;

      const root = new BABYLON.TransformNode(`Enemy${enemy.id}`, scene);
      const pos = enemy.position || { x: 0, y: 0, z: 0 };
      root.position.set(pos.x || 0, pos.y || 0, pos.z || 0);
      root.scaling.set(enemy.scale || 1, enemy.scale || 1, enemy.scale || 1);
      root.metadata = { enemyId: enemy.id, destroyed: false };

      const makeMat = (name, diffuse, emissive = null, alpha = 1) => {
        const mat = new BABYLON.StandardMaterial(`${name}${enemy.id}`, scene);
        mat.diffuseColor = diffuse;
        mat.specularColor = new BABYLON.Color3(0.25, 0.25, 0.28);
        if (emissive) mat.emissiveColor = emissive;
        if (alpha < 1) mat.alpha = alpha;
        return mat;
      };

      const glowMat = (name, color) => {
        const mat = new BABYLON.StandardMaterial(`${name}${enemy.id}`, scene);
        mat.emissiveColor = color;
        mat.disableLighting = true;
        return mat;
      };

      const addBox = (name, options, position, material, rotation = null) => {
        const part = BABYLON.MeshBuilder.CreateBox(`${name}${enemy.id}`, options, scene);
        part.parent = root;
        part.position = new BABYLON.Vector3(position.x, position.y, position.z);
        if (rotation) part.rotation = new BABYLON.Vector3(rotation.x || 0, rotation.y || 0, rotation.z || 0);
        part.material = material;
        return part;
      };

      const addCylinder = (name, options, position, material, rotation = null) => {
        const part = BABYLON.MeshBuilder.CreateCylinder(`${name}${enemy.id}`, options, scene);
        part.parent = root;
        part.position = new BABYLON.Vector3(position.x, position.y, position.z);
        if (rotation) part.rotation = new BABYLON.Vector3(rotation.x || 0, rotation.y || 0, rotation.z || 0);
        part.material = material;
        return part;
      };

      const addSphere = (name, options, position, material, scaling = null) => {
        const part = BABYLON.MeshBuilder.CreateSphere(`${name}${enemy.id}`, options, scene);
        part.parent = root;
        part.position = new BABYLON.Vector3(position.x, position.y, position.z);
        if (scaling) part.scaling = new BABYLON.Vector3(scaling.x, scaling.y, scaling.z);
        part.material = material;
        return part;
      };

      const parts = [];
      const type = String(enemy.type || "PIRATE").toUpperCase();

      if (type === "SCOUT") {
        // TRADER / CARGO SHIP — chunky rectangular freighter silhouette.
        const hullMat = makeMat("TraderHull", new BABYLON.Color3(0.12, 0.19, 0.25), new BABYLON.Color3(0.015, 0.035, 0.055));
        const cargoMat = makeMat("TraderCargo", new BABYLON.Color3(0.23, 0.32, 0.38), new BABYLON.Color3(0.025, 0.045, 0.06));
        const accentMat = makeMat("TraderAccent", new BABYLON.Color3(0.07, 0.22, 0.34), new BABYLON.Color3(0.01, 0.08, 0.13));
        const lightMat = glowMat("TraderLight", new BABYLON.Color3(0.1, 0.65, 1));

        parts.push(addBox("TraderHull", { width: 1.55, height: 1.05, depth: 3.25 }, { x: 0, y: 0, z: 0 }, hullMat));
        parts.push(addBox("TraderCargo1", { width: 1.9, height: 1.25, depth: 1.0 }, { x: 0, y: 0, z: -0.85 }, cargoMat));
        parts.push(addBox("TraderCargo2", { width: 1.85, height: 1.18, depth: 0.85 }, { x: 0, y: 0, z: -1.65 }, cargoMat));
        parts.push(addBox("TraderBridge", { width: 1.15, height: 0.7, depth: 0.8 }, { x: 0, y: 0.15, z: 1.45 }, accentMat));
        parts.push(addBox("TraderWingL", { width: 1.15, height: 0.16, depth: 1.25 }, { x: -1.05, y: -0.05, z: -0.25 }, accentMat, { x: 0, y: -0.08, z: 0 }));
        parts.push(addBox("TraderWingR", { width: 1.15, height: 0.16, depth: 1.25 }, { x: 1.05, y: -0.05, z: -0.25 }, accentMat, { x: 0, y: 0.08, z: 0 }));
        parts.push(addCylinder("TraderAntenna", { height: 1.0, diameter: 0.08, tessellation: 8 }, { x: 0, y: 0.7, z: -0.1 }, accentMat));
        parts.push(addSphere("TraderCockpit", { diameter: 0.62, segments: 12 }, { x: 0, y: 0.35, z: 1.75 }, lightMat, { x: 1.15, y: 0.55, z: 1.2 }));
        parts.push(addSphere("TraderEngineL", { diameter: 0.36 }, { x: -0.58, y: 0, z: -1.95 }, lightMat));
        parts.push(addSphere("TraderEngineR", { diameter: 0.36 }, { x: 0.58, y: 0, z: -1.95 }, lightMat));
      } else if (type === "RAIDER") {
        // SECURITY SHIP — sleek patrol fighter with wide swept wings.
        const hullMat = makeMat("SecurityHull", new BABYLON.Color3(0.22, 0.28, 0.32), new BABYLON.Color3(0.02, 0.035, 0.05));
        const wingMat = makeMat("SecurityWing", new BABYLON.Color3(0.08, 0.15, 0.21), new BABYLON.Color3(0.01, 0.025, 0.04));
        const accentMat = makeMat("SecurityAccent", new BABYLON.Color3(0.3, 0.36, 0.39), new BABYLON.Color3(0.025, 0.035, 0.04));
        const lightMat = glowMat("SecurityLight", new BABYLON.Color3(0.1, 0.55, 1));

        parts.push(addCylinder("SecurityHull", { height: 3.8, diameterTop: 0.12, diameterBottom: 1.05, tessellation: 6 }, { x: 0, y: 0, z: 0 }, hullMat, { x: Math.PI / 2, y: 0, z: 0 }));
        parts.push(addBox("SecurityWingL", { width: 2.7, height: 0.16, depth: 1.0 }, { x: -1.0, y: 0, z: -0.15 }, wingMat, { x: 0, y: -0.28, z: 0 }));
        parts.push(addBox("SecurityWingR", { width: 2.7, height: 0.16, depth: 1.0 }, { x: 1.0, y: 0, z: -0.15 }, wingMat, { x: 0, y: 0.28, z: 0 }));
        parts.push(addBox("SecurityTailL", { width: 0.22, height: 0.65, depth: 0.85 }, { x: -0.52, y: 0.28, z: -1.45 }, accentMat, { x: 0.2, y: 0, z: -0.1 }));
        parts.push(addBox("SecurityTailR", { width: 0.22, height: 0.65, depth: 0.85 }, { x: 0.52, y: 0.28, z: -1.45 }, accentMat, { x: 0.2, y: 0, z: 0.1 }));
        parts.push(addSphere("SecurityCockpit", { diameter: 0.72, segments: 12 }, { x: 0, y: 0.28, z: 1.05 }, lightMat, { x: 0.95, y: 0.45, z: 1.3 }));
        parts.push(addSphere("SecurityEngineL", { diameter: 0.34 }, { x: -0.48, y: 0, z: -1.85 }, lightMat));
        parts.push(addSphere("SecurityEngineR", { diameter: 0.34 }, { x: 0.48, y: 0, z: -1.85 }, lightMat));
        parts.push(addBox("SecurityGunL", { width: 0.18, height: 0.18, depth: 1.0 }, { x: -1.25, y: -0.02, z: 0.75 }, accentMat));
        parts.push(addBox("SecurityGunR", { width: 0.18, height: 0.18, depth: 1.0 }, { x: 1.25, y: -0.02, z: 0.75 }, accentMat));
      } else {
        // PIRATE SHIP — aggressive red fighter with pointed nose and tall fins.
        const hullMat = makeMat("PirateHull", new BABYLON.Color3(0.28, 0.045, 0.04), new BABYLON.Color3(0.12, 0.008, 0.006));
        const wingMat = makeMat("PirateWing", new BABYLON.Color3(0.12, 0.025, 0.03), new BABYLON.Color3(0.05, 0.004, 0.006));
        const metalMat = makeMat("PirateMetal", new BABYLON.Color3(0.23, 0.24, 0.25), new BABYLON.Color3(0.02, 0.02, 0.02));
        const lightMat = glowMat("PirateLight", new BABYLON.Color3(1, 0.05, 0.02));

        parts.push(addCylinder("PirateHull", { height: 4.2, diameterTop: 0.05, diameterBottom: 1.15, tessellation: 5 }, { x: 0, y: 0, z: 0 }, hullMat, { x: Math.PI / 2, y: 0, z: 0 }));
        parts.push(addBox("PirateWingL", { width: 2.9, height: 0.18, depth: 1.15 }, { x: -1.05, y: 0, z: -0.1 }, wingMat, { x: 0, y: -0.45, z: 0.08 }));
        parts.push(addBox("PirateWingR", { width: 2.9, height: 0.18, depth: 1.15 }, { x: 1.05, y: 0, z: -0.1 }, wingMat, { x: 0, y: 0.45, z: -0.08 }));
        parts.push(addBox("PirateFinL", { width: 0.2, height: 1.25, depth: 0.65 }, { x: -0.48, y: 0.65, z: -0.9 }, hullMat, { x: -0.2, y: 0, z: -0.15 }));
        parts.push(addBox("PirateFinR", { width: 0.2, height: 1.25, depth: 0.65 }, { x: 0.48, y: 0.65, z: -0.9 }, hullMat, { x: -0.2, y: 0, z: 0.15 }));
        parts.push(addSphere("PirateCockpit", { diameter: 0.7, segments: 12 }, { x: 0, y: 0.25, z: 1.25 }, metalMat, { x: 0.95, y: 0.45, z: 1.3 }));
        parts.push(addSphere("PirateEngineL", { diameter: 0.48 }, { x: -0.55, y: 0, z: -1.95 }, lightMat));
        parts.push(addSphere("PirateEngineR", { diameter: 0.48 }, { x: 0.55, y: 0, z: -1.95 }, lightMat));
        parts.push(addBox("PirateGunL", { width: 0.22, height: 0.22, depth: 1.15 }, { x: -1.3, y: -0.08, z: 0.55 }, metalMat));
        parts.push(addBox("PirateGunR", { width: 0.22, height: 0.22, depth: 1.15 }, { x: 1.3, y: -0.08, z: 0.55 }, metalMat));
      }

      parts.forEach((part) => {
        part.metadata = { enemyId: enemy.id, destroyed: false };
        part.isPickable = true;
        part.actionManager = new BABYLON.ActionManager(scene);
        part.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPickTrigger, () => {
          const id = part.metadata?.enemyId;
          const current = enemiesRef.current.find((item) => item.id === id);
          if (!current || current.destroyed) return;
          localEnemyTargetIdRef.current = id;
          setLocalEnemyTargetId(id);
          if (onEnemyClickRef.current) onEnemyClickRef.current(id);
        }));
      });

      enemyMeshes.set(enemy.id, root);
      return root;
    };

    const disposeEnemyTargetRing = () => {
      if (enemyTargetRing) enemyTargetRing.dispose();
      enemyTargetRing = null;
    };

    const ensureEnemyTargetRing = (target) => {
      if (!target || !target.isEnabled()) {
        disposeEnemyTargetRing();
        return;
      }
      if (!enemyTargetRing) {
        enemyTargetRing = BABYLON.MeshBuilder.CreateTorus("EnemyTargetRing", { diameter: 3.2, thickness: 0.1, tessellation: 36 }, scene);
        const mat = new BABYLON.StandardMaterial("EnemyTargetRingMat", scene);
        mat.emissiveColor = new BABYLON.Color3(1, 0.12, 0.05);
        mat.disableLighting = true;
        enemyTargetRing.material = mat;
      }
      enemyTargetRing.position = target.position.clone();
      enemyTargetRing.scaling.set(1.2, 1.2, 1.2);
      enemyTargetRing.rotation.y += 0.035;
    };

    (enemiesRef.current || []).forEach(makeEnemy);

    const makeAsteroid = (asteroid) => {
      if (!asteroid) return null;
      const mesh = BABYLON.MeshBuilder.CreateIcoSphere(`Asteroid${asteroid.id}`, {
        radius: 1,
        subdivisions: 1,
      }, scene);
      const pos = asteroid.position || { x: 0, y: 0, z: 0 };
      mesh.position.set(pos.x || 0, pos.y || 0, pos.z || 0);
      const rot = asteroid.rotation || { x: 0, y: 0, z: 0 };
      mesh.rotation.set(rot.x || 0, rot.y || 0, rot.z || 0);
      const mat = new BABYLON.StandardMaterial(`AsteroidMat${asteroid.id}`, scene);
      mat.diffuseColor = oreColors[asteroid.oreType] || oreColors.iron;
      mat.specularColor = new BABYLON.Color3(0.18, 0.18, 0.18);
      mesh.material = mat;
      mesh.metadata = { asteroidId: asteroid.id, lastMined: false, baseSize: asteroid.size || 1.2, originalOre: asteroid.ore || 1 };
      mesh.isPickable = true;
      mesh.actionManager = new BABYLON.ActionManager(scene);
      mesh.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPickTrigger, () => {
        const id = mesh.metadata?.asteroidId;
        const current = asteroidsRef.current.find((a) => a.id === id);
        if (!current || current.mined) return;
        localTargetIdRef.current = id;
        setLocalTargetId(id);
        if (onAsteroidClickRef.current) onAsteroidClickRef.current(id);
      }));
      asteroidMeshes.set(asteroid.id, mesh);
      return mesh;
    };

    (asteroidsRef.current || []).forEach(makeAsteroid);

    const disposeBeam = () => {
      if (beam) beam.dispose();
      if (beamCore) beamCore.dispose();
      beam = null;
      beamCore = null;
      if (beamMaterial) beamMaterial.dispose();
      if (beamCoreMaterial) beamCoreMaterial.dispose();
      beamMaterial = null;
      beamCoreMaterial = null;
    };

    const aimCylinder = (mesh, start, end) => {
      const direction = end.subtract(start);
      const length = direction.length();
      if (length < 0.0001) return;

      const dir = direction.scale(1 / length);
      const up = BABYLON.Axis.Y;
      const axis = BABYLON.Vector3.Cross(up, dir);
      const dot = Math.max(-1, Math.min(1, BABYLON.Vector3.Dot(up, dir)));

      mesh.position = start.add(end).scale(0.5);
      mesh.scaling.y = length / mesh.getBoundingInfo().boundingBox.extendSize.y / 2;

      if (axis.lengthSquared() > 0.000001) {
        axis.normalize();
        mesh.rotationQuaternion = BABYLON.Quaternion.RotationAxis(
          axis,
          Math.acos(dot)
        );
      } else if (dot < 0) {
        mesh.rotationQuaternion = BABYLON.Quaternion.RotationAxis(
          BABYLON.Axis.X,
          Math.PI
        );
      } else {
        mesh.rotationQuaternion = BABYLON.Quaternion.Identity();
      }
    };

    const updateBeam = (target) => {
      if (!target) {
        disposeBeam();
        return;
      }

      const yaw = ship.rotation.y;
      const start = ship.position.add(
        new BABYLON.Vector3(
          Math.sin(yaw) * 2.15,
          0,
          Math.cos(yaw) * 2.15
        )
      );
      const end = target.getAbsolutePosition();
      const direction = end.subtract(start);
      const distance = direction.length();
      if (distance < 0.01) {
        disposeBeam();
        return;
      }

      if (!beam) {
        beam = BABYLON.MeshBuilder.CreateCylinder(
          "MiningBeam",
          { height: distance, diameter: 0.17, tessellation: 12 },
          scene
        );
        beamMaterial = new BABYLON.StandardMaterial("MiningBeamMat", scene);
        beamMaterial.emissiveColor = new BABYLON.Color3(0, 0.8, 1);
        beamMaterial.disableLighting = true;
        beamMaterial.alpha = 0.85;
        beam.material = beamMaterial;
      }

      if (!beamCore) {
        beamCore = BABYLON.MeshBuilder.CreateCylinder(
          "MiningBeamCore",
          { height: distance, diameter: 0.055, tessellation: 8 },
          scene
        );
        beamCoreMaterial = new BABYLON.StandardMaterial("MiningBeamCoreMat", scene);
        beamCoreMaterial.emissiveColor = new BABYLON.Color3(0.8, 1, 1);
        beamCoreMaterial.disableLighting = true;
        beamCore.material = beamCoreMaterial;
      }

      aimCylinder(beam, start, end);
      aimCylinder(beamCore, start, end);
    };

    const disposeTargetRing = () => {
      if (targetRing) targetRing.dispose();
      targetRing = null;
    };

    const ensureTargetRing = (target) => {
      if (!target || !target.isEnabled()) {
        disposeTargetRing();
        return;
      }
      if (!targetRing) {
        targetRing = BABYLON.MeshBuilder.CreateTorus("TargetRing", { diameter: 3, thickness: 0.08, tessellation: 36 }, scene);
        const mat = new BABYLON.StandardMaterial("TargetRingMat", scene);
        mat.emissiveColor = new BABYLON.Color3(0, 1, 0.65);
        mat.disableLighting = true;
        targetRing.material = mat;
      }
      targetRing.position = target.position.clone();
      const size = Number(target.scaling.x || 1);
      targetRing.scaling.set(size, size, size);
      targetRing.rotation.z += 0.025;
    };

    const startMiningEffect = (mesh) => {
      const id = mesh.metadata?.asteroidId;
      if (id === undefined || miningParticles.has(id)) return;
      const material = new BABYLON.StandardMaterial(`MineParticleMat${id}`, scene);
      material.emissiveColor = new BABYLON.Color3(0, 1, 0.65);
      material.disableLighting = true;
      const particles = [];
      for (let i = 0; i < 9; i += 1) {
        const particle = BABYLON.MeshBuilder.CreateSphere(`MineParticle${id}_${i}`, { diameter: 0.08 }, scene);
        particle.parent = mesh;
        particle.material = material;
        particles.push({ mesh: particle, phase: Math.random() * Math.PI * 2 });
      }
      miningParticles.set(id, { particles, material });
    };

    const stopMiningEffect = (id) => {
      const effect = miningParticles.get(id);
      if (!effect) return;
      effect.particles.forEach((p) => p.mesh.dispose());
      effect.material.dispose();
      miningParticles.delete(id);
    };

    const createBurst = (mesh, id) => {
      if (lastBurstIds.has(id)) return;
      lastBurstIds.add(id);
      const material = new BABYLON.StandardMaterial(`BurstMat${id}_${Date.now()}`, scene);
      material.diffuseColor = new BABYLON.Color3(0.1, 0.8, 0.7);
      material.emissiveColor = new BABYLON.Color3(0, 0.9, 0.6);
      material.disableLighting = true;
      const pieces = [];
      const center = mesh.position.clone();
      for (let i = 0; i < 14; i += 1) {
        const piece = BABYLON.MeshBuilder.CreatePolyhedron(`Burst${id}_${i}`, { type: 1, size: 0.12 + Math.random() * 0.14 }, scene);
        piece.position = center.clone();
        piece.material = material;
        const velocity = new BABYLON.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5);
        if (velocity.lengthSquared() < 0.01) velocity.z = 1;
        velocity.normalize().scaleInPlace(2.5 + Math.random() * 4);
        pieces.push({ mesh: piece, velocity });
      }
      bursts.push({ pieces, material, time: performance.now() });
    };

    // ---------------- SPACE STATION ----------------
    const stationPos = stationPositionRef.current || { x: 0, y: 0, z: -22 };
    const adBillboards = [];
    const station = new BABYLON.TransformNode("MiningStation", scene);
    station.position = new BABYLON.Vector3(stationPos.x || 0, stationPos.y || 0, stationPos.z || -22);

    const stationBodyMat = new BABYLON.StandardMaterial("StationBodyMat", scene);
    stationBodyMat.diffuseColor = new BABYLON.Color3(0.06, 0.1, 0.16);
    stationBodyMat.emissiveColor = new BABYLON.Color3(0.015, 0.05, 0.09);

    const stationGlowMat = new BABYLON.StandardMaterial("StationGlowMat", scene);
    stationGlowMat.emissiveColor = new BABYLON.Color3(0, 0.85, 1);
    stationGlowMat.disableLighting = true;

    const stationCore = BABYLON.MeshBuilder.CreateCylinder("StationCore", {
      height: 2.8,
      diameter: 5.2,
      tessellation: 32,
    }, scene);
    stationCore.parent = station;
    stationCore.rotation.x = Math.PI / 2;
    stationCore.material = stationBodyMat;

    const stationRing = BABYLON.MeshBuilder.CreateTorus("StationRing", {
      diameter: 9,
      thickness: 0.32,
      tessellation: 48,
    }, scene);
    stationRing.parent = station;
    stationRing.rotation.x = Math.PI / 2;
    stationRing.material = stationGlowMat;

    const stationDock = BABYLON.MeshBuilder.CreateCylinder("StationDock", {
      height: 0.35,
      diameter: 6.5,
      tessellation: 32,
    }, scene);
    stationDock.parent = station;
    stationDock.position.z = 0.8;
    stationDock.material = stationGlowMat;

    const stationLightMat = new BABYLON.StandardMaterial("StationLightMat", scene);
    stationLightMat.emissiveColor = new BABYLON.Color3(0.2, 1, 0.55);
    stationLightMat.disableLighting = true;
    for (let i = 0; i < 8; i += 1) {
      const a = (Math.PI * 2 * i) / 8;
      const light = BABYLON.MeshBuilder.CreateSphere(`StationLight${i}`, { diameter: 0.3 }, scene);
      light.parent = station;
      light.position.set(Math.cos(a) * 4.1, Math.sin(a) * 4.1, 0);
      light.material = stationLightMat;
    }

    const stationLabel = BABYLON.MeshBuilder.CreatePlane("StationLabel", { width: 5.6, height: 1 }, scene);
    stationLabel.parent = station;
    stationLabel.position.y = 5.2;
    stationLabel.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;
    const stationLabelTex = new BABYLON.DynamicTexture("StationLabelTex", { width: 640, height: 128 }, scene, true);
    stationLabelTex.hasAlpha = true;
    stationLabelTex.drawText("MINING STATION", 320, 78, "bold 44px Arial", "#79ffff", "transparent", true);
    const stationLabelMat = new BABYLON.StandardMaterial("StationLabelMat", scene);
    stationLabelMat.diffuseTexture = stationLabelTex;
    stationLabelMat.opacityTexture = stationLabelTex;
    stationLabelMat.emissiveTexture = stationLabelTex;
    stationLabelMat.disableLighting = true;
    stationLabelMat.backFaceCulling = false;
    stationLabel.material = stationLabelMat;

    // ---------------- 3D SPACE AD BILLBOARDS ----------------
    // Large, readable in-universe advertising structures around the station.
    // These are placeholder surfaces; real Google ads are not rendered into
    // the BabylonJS canvas.
    const createAdBillboard = (name, offset, title, subtitle, accent) => {
      const root = new BABYLON.TransformNode(name, scene);
      root.parent = station;
      root.position = new BABYLON.Vector3(offset.x, offset.y, offset.z);
      // Keep the whole advertising structure facing the player so the ad face
      // never turns edge-on when the player approaches from another direction.
      root.billboardMode = BABYLON.Mesh.BILLBOARDMODE_Y;
      root.rotation.y = 0;

      const color = new BABYLON.Color3(accent.r, accent.g, accent.b);
      const dimColor = new BABYLON.Color3(accent.r * 0.16, accent.g * 0.16, accent.b * 0.16);

      // Heavy outer frame.
      const frameMat = new BABYLON.StandardMaterial(`${name}FrameMat`, scene);
      frameMat.diffuseColor = new BABYLON.Color3(0.015, 0.025, 0.04);
      frameMat.emissiveColor = dimColor;
      frameMat.disableLighting = true;

      const frame = BABYLON.MeshBuilder.CreateBox(`${name}Frame`, {
        width: 9.2,
        height: 4.8,
        depth: 0.28,
      }, scene);
      frame.parent = root;
      frame.material = frameMat;

      // Four illuminated rails make the billboard read clearly from a distance.
      const railMat = new BABYLON.StandardMaterial(`${name}RailMat`, scene);
      railMat.emissiveColor = color;
      railMat.disableLighting = true;

      const rails = [
        { x: 0, y: 2.42, w: 8.9, h: 0.11 },
        { x: 0, y: -2.42, w: 8.9, h: 0.11 },
        { x: -4.55, y: 0, w: 0.11, h: 4.7 },
        { x: 4.55, y: 0, w: 0.11, h: 4.7 },
      ];
      rails.forEach((rail, index) => {
        const mesh = BABYLON.MeshBuilder.CreateBox(`${name}Rail${index}`, {
          width: rail.w,
          height: rail.h,
          depth: 0.34,
        }, scene);
        mesh.parent = root;
        mesh.position.x = rail.x;
        mesh.position.y = rail.y;
        mesh.material = railMat;
      });

      // Large readable advertising face.
      const panel = BABYLON.MeshBuilder.CreatePlane(`${name}Panel`, {
        width: 8.65,
        height: 4.25,
      }, scene);
      panel.parent = root;
      panel.position.z = -0.18;
      panel.material = null;

      const texture = new BABYLON.DynamicTexture(`${name}Texture`, {
        width: 1200,
        height: 590,
      }, scene, true);
      texture.hasAlpha = false;
      const ctx = texture.getContext();
      ctx.fillStyle = '#030912';
      ctx.fillRect(0, 0, 1200, 590);

      const accentCss = `rgb(${Math.round(accent.r * 255)}, ${Math.round(accent.g * 255)}, ${Math.round(accent.b * 255)})`;
      const softCss = `rgba(${Math.round(accent.r * 255)}, ${Math.round(accent.g * 255)}, ${Math.round(accent.b * 255)}, 0.18)`;

      ctx.fillStyle = softCss;
      ctx.fillRect(38, 38, 1124, 514);
      ctx.strokeStyle = accentCss;
      ctx.lineWidth = 10;
      ctx.strokeRect(24, 24, 1152, 542);

      ctx.textAlign = 'center';
      ctx.fillStyle = '#a7c0c5';
      ctx.font = 'bold 30px Arial';
      ctx.fillText('SPACE MINER • COMMERCIAL NETWORK', 600, 82);

      ctx.fillStyle = accentCss;
      ctx.font = 'bold 86px Arial';
      ctx.fillText(title, 600, 225);

      ctx.fillStyle = '#f1ffff';
      ctx.font = 'bold 38px Arial';
      ctx.fillText(subtitle, 600, 300);

      ctx.fillStyle = '#7f9ba0';
      ctx.font = '26px Arial';
      ctx.fillText('YOUR BRAND COULD APPEAR HERE', 600, 410);

      ctx.fillStyle = accentCss;
      ctx.font = 'bold 25px Arial';
      ctx.fillText('ADVERTISEMENT', 600, 500);
      texture.update();

      const panelMat = new BABYLON.StandardMaterial(`${name}PanelMat`, scene);
      panelMat.diffuseTexture = texture;
      panelMat.emissiveTexture = texture;
      panelMat.emissiveColor = new BABYLON.Color3(0.8, 0.8, 0.8);
      panelMat.disableLighting = true;
      panelMat.backFaceCulling = false;
      panel.material = panelMat;

      // Support mast and feet make it look like a physical station structure.
      const supportMat = new BABYLON.StandardMaterial(`${name}SupportMat`, scene);
      supportMat.diffuseColor = new BABYLON.Color3(0.035, 0.05, 0.07);
        supportMat.emissiveColor = dimColor;
      supportMat.disableLighting = true;

      const mast = BABYLON.MeshBuilder.CreateBox(`${name}Mast`, {
        width: 0.28,
        height: 2.8,
        depth: 0.28,
      }, scene);
      mast.parent = root;
      mast.position.y = -3.55;
      mast.material = supportMat;

      const foot = BABYLON.MeshBuilder.CreateBox(`${name}Foot`, {
        width: 2.1,
        height: 0.24,
        depth: 0.9,
      }, scene);
      foot.parent = root;
      foot.position.y = -4.9;
      foot.material = supportMat;

      const beaconMat = new BABYLON.StandardMaterial(`${name}BeaconMat`, scene);
      beaconMat.emissiveColor = color;
      beaconMat.disableLighting = true;
      const beacon = BABYLON.MeshBuilder.CreateSphere(`${name}Beacon`, {
        diameter: 0.32,
      }, scene);
      beacon.parent = root;
      beacon.position.set(0, 2.75, -0.08);
      beacon.material = beaconMat;

      adBillboards.push({ root, panel, beacon });
      return root;
    };

    createAdBillboard(
      'StationAdNorth',
      { x: -10.5, y: 4.2, z: 0 },
      'NOVA FUEL',
      'POWER YOUR NEXT VOYAGE',
      { r: 0.1, g: 0.85, b: 1 }
    );
    createAdBillboard(
      'StationAdSouth',
      { x: 10.5, y: 4.0, z: 0 },
      'GALACTIC GEAR',
      'SHIP PARTS • UPGRADES • REPAIRS',
      { r: 0.2, g: 1, b: 0.55 }
    );

    const dockingRing = BABYLON.MeshBuilder.CreateTorus("DockingRangeRing", {
      diameter: 12,
      thickness: 0.045,
      tessellation: 64,
    }, scene);
    dockingRing.parent = station;
    dockingRing.rotation.x = Math.PI / 2;
    const dockingRingMat = new BABYLON.StandardMaterial("DockingRangeRingMat", scene);
    dockingRingMat.emissiveColor = new BABYLON.Color3(0.1, 0.9, 0.65);
    dockingRingMat.disableLighting = true;
    dockingRingMat.alpha = 0.35;
    dockingRing.material = dockingRingMat;

    // ---------------- KEYBOARD ----------------
    const keys = { forward: false, backward: false, left: false, right: false, up: false, down: false };
    const clearKeys = () => Object.keys(keys).forEach((key) => { keys[key] = false; });
    const setKey = (code, value, event) => {
      let handled = true;
      switch (code) {
        case "KeyW": case "ArrowUp": keys.forward = value; break;
        case "KeyS": case "ArrowDown": keys.backward = value; break;
        case "KeyA": case "ArrowLeft": keys.left = value; break;
        case "KeyD": case "ArrowRight": keys.right = value; break;
        case "Space": keys.up = value; break;
        case "ShiftLeft": case "ShiftRight": keys.down = value; break;
        default: handled = false;
      }
      if (handled) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    const keyDown = (event) => {
      if (event.code === "KeyF") {
        if (event.repeat) return;
        event.preventDefault();
        event.stopPropagation();
        const id = selectedEnemyRef.current ?? localEnemyTargetIdRef.current;
        if (id !== null && id !== undefined && onFireWeaponRef.current) {
          const result = onFireWeaponRef.current(id);
          if (result?.success) {
            const mesh = enemyMeshes.get(id);
            if (mesh) showWeaponBeam(mesh);
          }
        }
        return;
      }
      setKey(event.code, true, event);
    };
    const keyUp = (event) => setKey(event.code, false, event);
    window.addEventListener("keydown", keyDown, true);
    window.addEventListener("keyup", keyUp, true);
    window.addEventListener("blur", clearKeys);

    // ---------------- MOBILE CONTROLS ----------------
    // These controls use Pointer Events so Android/iOS browsers reliably
    // receive touch input. The controls sit above the canvas and capture the
    // pointer, while Babylon camera input is disabled on coarse-pointer devices.
    let joystickX = 0;
    let joystickY = 0;
    let joystickPointerId = null;
    let mobileUp = false;
    let mobileDown = false;
    const root = canvas.parentElement;
    const mobileLayer = document.createElement("div");
    mobileLayer.style.cssText = `position:absolute;inset:0;z-index:30;pointer-events:none;touch-action:none;display:${isTouchDevice ? "block" : "none"};`;

    const joystick = document.createElement("div");
    joystick.setAttribute("aria-label", "Movement joystick");
    joystick.style.cssText = "position:absolute;left:max(18px, env(safe-area-inset-left));bottom:max(18px, env(safe-area-inset-bottom));width:126px;height:126px;border:2px solid rgba(0,255,220,.55);border-radius:50%;background:rgba(0,15,25,.42);pointer-events:auto;touch-action:none;user-select:none;-webkit-user-select:none;-webkit-touch-callout:none;";
    const knob = document.createElement("div");
    knob.style.cssText = "position:absolute;left:41px;top:41px;width:40px;height:40px;border-radius:50%;background:rgba(0,255,220,.62);box-shadow:0 0 18px rgba(0,255,220,.75);pointer-events:none;";
    joystick.appendChild(knob);

    const vertical = document.createElement("div");
    vertical.style.cssText = "position:absolute;right:max(18px, env(safe-area-inset-right));bottom:max(18px, env(safe-area-inset-bottom));display:flex;flex-direction:column;gap:10px;pointer-events:none;";
    const makeButton = (text, label) => {
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = text;
      b.setAttribute("aria-label", label);
      b.style.cssText = "width:62px;height:56px;border:1px solid rgba(0,255,220,.58);border-radius:11px;background:rgba(0,12,22,.78);color:#bfffff;font-size:23px;font-weight:900;touch-action:none;user-select:none;-webkit-user-select:none;-webkit-tap-highlight-color:transparent;pointer-events:auto;";
      return b;
    };
    const upButton = makeButton("▲", "Move up");
    const downButton = makeButton("▼", "Move down");
    vertical.appendChild(upButton);
    vertical.appendChild(downButton);
    mobileLayer.appendChild(joystick);
    mobileLayer.appendChild(vertical);
    root.appendChild(mobileLayer);

    const joystickUpdate = (clientX, clientY) => {
      const rect = joystick.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      let dx = (clientX - cx) / (rect.width / 2);
      let dy = (clientY - cy) / (rect.height / 2);
      const len = Math.sqrt(dx * dx + dy * dy);
      if (len > 1) { dx /= len; dy /= len; }
      joystickX = dx;
      joystickY = dy;
      knob.style.transform = `translate(${dx * 35}px, ${dy * 35}px)`;
    };

    const joystickStart = (event) => {
      if (joystickPointerId !== null) return;
      joystickPointerId = event.pointerId;
      try { joystick.setPointerCapture(event.pointerId); } catch (_) {}
      joystickUpdate(event.clientX, event.clientY);
      event.preventDefault();
      event.stopPropagation();
    };
    const joystickMove = (event) => {
      if (event.pointerId !== joystickPointerId) return;
      joystickUpdate(event.clientX, event.clientY);
      event.preventDefault();
      event.stopPropagation();
    };
    const joystickEnd = (event) => {
      if (event.pointerId !== joystickPointerId) return;
      joystickPointerId = null;
      joystickX = 0;
      joystickY = 0;
      knob.style.transform = "translate(0, 0)";
      event.preventDefault();
      event.stopPropagation();
    };

    joystick.addEventListener("pointerdown", joystickStart);
    joystick.addEventListener("pointermove", joystickMove);
    joystick.addEventListener("pointerup", joystickEnd);
    joystick.addEventListener("pointercancel", joystickEnd);
    joystick.addEventListener("lostpointercapture", () => {
      joystickPointerId = null;
      joystickX = 0;
      joystickY = 0;
      knob.style.transform = "translate(0, 0)";
    });

    const bindHold = (button, setter) => {
      const start = (event) => {
        setter(true);
        event.preventDefault();
        event.stopPropagation();
        try { button.setPointerCapture(event.pointerId); } catch (_) {}
      };
      const end = (event) => {
        setter(false);
        event.preventDefault();
        event.stopPropagation();
      };
      button.addEventListener("pointerdown", start);
      button.addEventListener("pointerup", end);
      button.addEventListener("pointercancel", end);
      button.addEventListener("lostpointercapture", () => setter(false));
      return () => {
        button.removeEventListener("pointerdown", start);
        button.removeEventListener("pointerup", end);
        button.removeEventListener("pointercancel", end);
      };
    };
    const unbindUp = bindHold(upButton, (v) => { mobileUp = v; });
    const unbindDown = bindHold(downButton, (v) => { mobileDown = v; });

    let lastTime = performance.now();
    let lastReported = { x: ship.position.x, y: ship.position.y, z: ship.position.z };

    const updateMovement = () => {
      const now = performance.now();
      const delta = Math.min(0.05, Math.max(0, (now - lastTime) / 1000));
      lastTime = now;

      // If React changed the position externally (sector travel, load, etc.), sync the 3D ship.
      const prop = shipPositionRef.current || { x: 0, y: 0, z: 0 };
      // React state is reported frequently while the 3D ship moves. Do not
      // snap the Babylon ship back to those small, slightly-lagged updates;
      // doing so creates visible camera/ship jitter. Only accept a large
      // external correction (sector jump, load, respawn, etc.).
      const propDistance = Math.hypot(
        (prop.x || 0) - ship.position.x,
        (prop.y || 0) - ship.position.y,
        (prop.z || 0) - ship.position.z
      );
      if (propDistance > 2.0) ship.position.set(prop.x || 0, prop.y || 0, prop.z || 0);

      let forward = (keys.forward ? 1 : 0) - (keys.backward ? 1 : 0);
      let strafe = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
      let verticalMove = (keys.up || mobileUp ? 1 : 0) - (keys.down || mobileDown ? 1 : 0);
      if (Math.abs(joystickY) > 0.05) forward = -joystickY;
      if (Math.abs(joystickX) > 0.05) strafe = joystickX;

      const length = Math.sqrt(forward * forward + strafe * strafe + verticalMove * verticalMove);
      if (length > 1) { forward /= length; strafe /= length; verticalMove /= length; }

      if (Math.abs(forward) > 0.001 || Math.abs(strafe) > 0.001 || Math.abs(verticalMove) > 0.001) {
        // IMPORTANT: movement is completely independent of the camera.
        // W/joystick-up = world +Z, S/down = world -Z, A/left = world -X,
        // D/right = world +X. This prevents camera movement from feeding back
        // into the controls and eliminates the oscillation/shaking loop.
        const horizontal = new BABYLON.Vector3(strafe, 0, forward);
        if (horizontal.lengthSquared() > 0.000001) horizontal.normalize();

        // Never move the visual ship when the game engine has no fuel.
        // Otherwise the render loop could move the Babylon ship while the
        // engine rejects the position update, causing it to snap back and shake.
        const fuelAvailable = Number(shipFuelRef.current) > 0.001;
        if (fuelAvailable) {
          const speed = Number(shipSpeedRef.current) || 8;
          ship.position.x += horizontal.x * speed * delta;
          ship.position.z += horizontal.z * speed * delta;
          ship.position.y += verticalMove * speed * delta;

          ship.position.x = Math.max(-30, Math.min(30, ship.position.x));
          ship.position.y = Math.max(-15, Math.min(15, ship.position.y));
          ship.position.z = Math.max(-30, Math.min(30, ship.position.z));

          if (horizontal.lengthSquared() > 0.000001) {
            // Ship nose is +Z, so the nose follows the actual travel direction.
            ship.rotation.y = Math.atan2(horizontal.x, horizontal.z);
          }
          ship.rotation.x = -verticalMove * 0.18;
        }
      }

      const pulse = 0.8 + Math.sin(now * 0.02) * 0.2;
      engineGlow.scaling.set(pulse, pulse, pulse);
      // Keep the chase camera locked to the ship every render frame.
      // Smoothing the target itself caused a feedback loop: movement changed
      // the target, the target changed the camera direction, and that changed
      // the next movement vector, producing shaking/oscillation.
      camera.target.copyFrom(ship.position);

      // Animate the station so it is easy to spot while flying.
      stationRing.rotation.z += 0.004;
      dockingRing.rotation.z -= 0.002;
      adBillboards.forEach((billboard, index) => {
        billboard.root.rotation.z = Math.sin(now * 0.0008 + index) * 0.015;
        billboard.beacon.scaling.setAll(0.9 + Math.sin(now * 0.004 + index) * 0.12);
      });

      const moved = Math.abs(ship.position.x - lastReported.x) > 0.05 || Math.abs(ship.position.y - lastReported.y) > 0.05 || Math.abs(ship.position.z - lastReported.z) > 0.05;
      if (moved && onShipMoveRef.current) {
        lastReported = { x: ship.position.x, y: ship.position.y, z: ship.position.z };
        onShipMoveRef.current(lastReported);
      }
    };

    const render = () => {
      updateMovement();
      const current = asteroidsRef.current || [];

      current.forEach((asteroid) => {
        let mesh = asteroidMeshes.get(asteroid.id);
        if (!mesh) mesh = makeAsteroid(asteroid);
        if (!mesh) return;

        const pos = asteroid.position || { x: 0, y: 0, z: 0 };
        mesh.position.set(pos.x || 0, pos.y || 0, pos.z || 0);

        if (asteroid.mined) {
          if (!mesh.metadata.lastMined) createBurst(mesh, asteroid.id);
          mesh.metadata.lastMined = true;
          stopMiningEffect(asteroid.id);
          mesh.setEnabled(false);
          return;
        }

        if (mesh.metadata.lastMined) {
          // Same mesh is reused when GameEngine respawns the asteroid.
          mesh.metadata.lastMined = false;
          mesh.metadata.baseSize = asteroid.size || 1.2;
          mesh.metadata.originalOre = asteroid.ore || 1;
          mesh.rotation.set(asteroid.rotation?.x || 0, asteroid.rotation?.y || 0, asteroid.rotation?.z || 0);
        }
        mesh.setEnabled(true);
        mesh.metadata.baseSize = asteroid.size || mesh.metadata.baseSize || 1.2;
        mesh.metadata.originalOre = asteroid.ore || mesh.metadata.originalOre || 1;
        const ratio = Math.max(0.25, Math.min(1, (asteroid.remainingOre || 0) / (mesh.metadata.originalOre || 1)));
        const visualSize = (mesh.metadata.baseSize || 1.2) * (0.72 + ratio * 0.28);
        mesh.scaling.set(visualSize, visualSize, visualSize);
        mesh.rotation.x += 0.001;
        mesh.rotation.y += 0.0015;
        const mat = mesh.material;
        if (mat) {
          mat.diffuseColor = oreColors[asteroid.oreType] || oreColors.iron;
          const target = selectedRef.current === asteroid.id;
          mat.emissiveColor = miningRef.current && target ? new BABYLON.Color3(0.02, 0.3, 0.2) : target ? new BABYLON.Color3(0.01, 0.08, 0.06) : new BABYLON.Color3(0, 0, 0);
        }
      });

      // ---------------- ENEMIES ----------------
      const currentEnemies = enemiesRef.current || [];
      currentEnemies.forEach((enemy) => {
        let mesh = enemyMeshes.get(enemy.id);
        if (!mesh) mesh = makeEnemy(enemy);
        if (!mesh) return;

        const pos = enemy.position || { x: 0, y: 0, z: 0 };
        mesh.position.set(pos.x || 0, pos.y || 0, pos.z || 0);
        if (enemy.destroyed || enemy.health <= 0) {
          if (!mesh.metadata.destroyed) {
            mesh.metadata.destroyed = true;
            createEnemyExplosion(mesh, enemy.id);
          }
          mesh.setEnabled(false);
          return;
        }

        mesh.metadata.destroyed = false;
        mesh.setEnabled(true);
        const scale = enemy.scale || 1;
        mesh.scaling.set(scale, scale, scale);
        mesh.rotation.x += 0.006;
        mesh.rotation.y += 0.01;
        const mat = mesh.material;
        if (mat) {
          const target = selectedEnemyRef.current === enemy.id || localEnemyTargetIdRef.current === enemy.id;
          mat.emissiveColor = target ? new BABYLON.Color3(0.6, 0.03, 0.01) : new BABYLON.Color3(0.18, 0.01, 0.01);
        }
      });

      // ---------------- SPACE EVENT ----------------
      const activeEvent = spaceEventRef.current?.active || null;
      if (activeEvent) {
        let eventRoot = spaceEventMeshes.get(activeEvent.id);
        if (!eventRoot) {
          eventRoot = new BABYLON.TransformNode(`SpaceEvent${activeEvent.id}`, scene);
          const coreMat = new BABYLON.StandardMaterial(`SpaceEventCoreMat${activeEvent.id}`, scene);
          coreMat.emissiveColor = activeEvent.type === "cache" ? new BABYLON.Color3(1, 0.65, 0.08) : activeEvent.type === "distress" ? new BABYLON.Color3(1, 0.12, 0.12) : new BABYLON.Color3(0.1, 0.8, 1);
          coreMat.disableLighting = true;
          const core = BABYLON.MeshBuilder.CreateSphere(`SpaceEventCore${activeEvent.id}`, { diameter: 0.9, segments: 12 }, scene);
          core.parent = eventRoot;
          core.material = coreMat;
          const ring = BABYLON.MeshBuilder.CreateTorus(`SpaceEventRing${activeEvent.id}`, { diameter: 2.2, thickness: 0.07, tessellation: 32 }, scene);
          ring.parent = eventRoot;
          ring.rotation.x = Math.PI / 2;
          ring.material = coreMat;
          const beacon = BABYLON.MeshBuilder.CreateCylinder(`SpaceEventBeacon${activeEvent.id}`, { height: 2.4, diameterTop: 0.02, diameterBottom: 0.18, tessellation: 8 }, scene);
          beacon.parent = eventRoot;
          beacon.position.y = 1.2;
          beacon.material = coreMat;
          const light = new BABYLON.PointLight(`SpaceEventLight${activeEvent.id}`, new BABYLON.Vector3(0, 0, 0), scene);
          light.parent = eventRoot;
          light.intensity = 1.5;
          light.range = 7;
          light.diffuse = coreMat.emissiveColor;
          spaceEventMeshes.set(activeEvent.id, eventRoot);
        }
        const eventPos = activeEvent.position || { x: 0, y: 0, z: 0 };
        eventRoot.position.set(eventPos.x || 0, eventPos.y || 0, eventPos.z || 0);
        eventRoot.setEnabled(true);
        eventRoot.rotation.y += 0.012;
        const pulse = 1 + Math.sin(performance.now() * 0.006) * 0.12;
        eventRoot.scaling.set(pulse, pulse, pulse);
      }
      spaceEventMeshes.forEach((mesh, id) => {
        if (!activeEvent || id !== activeEvent.id) {
          mesh.dispose();
          spaceEventMeshes.delete(id);
        }
      });

      // ---------------- ENEMY PROJECTILES ----------------
      const currentProjectiles = enemyProjectilesRef.current || [];
      const projectileIds = new Set(currentProjectiles.map((projectile) => projectile.id));
      currentProjectiles.forEach((projectile) => {
        let mesh = enemyProjectileMeshes.get(projectile.id);
        if (!mesh) {
          mesh = BABYLON.MeshBuilder.CreateSphere(`EnemyProjectile${projectile.id}`, { diameter: 0.28, segments: 8 }, scene);
          const mat = new BABYLON.StandardMaterial(`EnemyProjectileMat${projectile.id}`, scene);
          mat.emissiveColor = new BABYLON.Color3(1, 0.08, 0.03);
          mat.diffuseColor = new BABYLON.Color3(0.8, 0.03, 0.01);
          mat.disableLighting = true;
          mesh.material = mat;
          enemyProjectileMeshes.set(projectile.id, mesh);
        }
        const pos = projectile.position || { x: 0, y: 0, z: 0 };
        mesh.position.set(pos.x || 0, pos.y || 0, pos.z || 0);
        mesh.scaling.setAll(1 + Math.sin(performance.now() * 0.02) * 0.15);
      });
      enemyProjectileMeshes.forEach((mesh, id) => {
        if (!projectileIds.has(id)) {
          mesh.dispose();
          enemyProjectileMeshes.delete(id);
        }
      });

      const enemyIds = new Set(currentEnemies.map((enemy) => enemy.id));
      enemyMeshes.forEach((mesh, id) => {
        if (!enemyIds.has(id)) {
          mesh.dispose();
          enemyMeshes.delete(id);
        }
      });

      const enemyTargetId = selectedEnemyRef.current ?? localEnemyTargetIdRef.current;
      const enemyTarget = enemyTargetId !== null && enemyTargetId !== undefined ? enemyMeshes.get(enemyTargetId) : null;
      ensureEnemyTargetRing(enemyTarget);

      if (weaponBeam && performance.now() > weaponBeamUntil) {
        disposeWeaponBeam();
      }

      for (let i = enemyExplosionBursts.length - 1; i >= 0; i -= 1) {
        const burst = enemyExplosionBursts[i];
        const age = (performance.now() - burst.time) / 1000;
        burst.pieces.forEach((piece) => {
          piece.mesh.position.addInPlace(piece.velocity.scale(0.016));
          piece.velocity.scaleInPlace(0.94);
          piece.mesh.rotation.x += 0.08;
          piece.mesh.rotation.y += 0.07;
        });
        burst.material.alpha = Math.max(0, 1 - age * 1.5);
        if (age > 0.7) {
          burst.pieces.forEach((piece) => piece.mesh.dispose());
          burst.material.dispose();
          enemyExplosionBursts.splice(i, 1);
        }
      }

      // Remove meshes belonging to asteroids that no longer exist in the current sector.
      const ids = new Set(current.map((a) => a.id));
      asteroidMeshes.forEach((mesh, id) => {
        if (!ids.has(id)) {
          stopMiningEffect(id);
          mesh.dispose();
          asteroidMeshes.delete(id);
        }
      });

      const targetId = selectedRef.current ?? localTargetIdRef.current;
      const target = targetId !== null && targetId !== undefined ? asteroidMeshes.get(targetId) : null;
      ensureTargetRing(target);
      if (miningRef.current && target && target.isEnabled()) {
        startMiningEffect(target);
        updateBeam(target);
      } else {
        if (targetId !== null && targetId !== undefined) stopMiningEffect(targetId);
        disposeBeam();
      }

      miningParticles.forEach((effect, id) => {
        effect.particles.forEach((particle, index) => {
          const angle = nowAngle(performance.now(), index);
          const radius = 0.75 + Math.sin(performance.now() * 0.004 + index) * 0.12;
          particle.mesh.position.set(Math.cos(angle) * radius, Math.sin(angle) * radius, Math.sin(angle * 1.4) * 0.5);
        });
      });

      const now = performance.now();
      for (let i = bursts.length - 1; i >= 0; i -= 1) {
        const burst = bursts[i];
        const age = (now - burst.time) / 1000;
        burst.pieces.forEach((piece) => {
          piece.mesh.position.addInPlace(piece.velocity.scale(0.016));
          piece.velocity.scaleInPlace(0.94);
          piece.mesh.rotation.x += 0.06;
          piece.mesh.rotation.y += 0.08;
        });
        burst.material.alpha = Math.max(0, 1 - age * 1.6);
        if (age > 0.65) {
          burst.pieces.forEach((piece) => piece.mesh.dispose());
          burst.material.dispose();
          bursts.splice(i, 1);
        }
      }

      scene.render();
    };

    const nowAngle = (now, index) => now * 0.003 + index;
    engine.runRenderLoop(render);

    const resize = () => engine.resize();
    window.addEventListener("resize", resize);

    return () => {
      engine.stopRenderLoop(render);
      window.removeEventListener("keydown", keyDown, true);
      window.removeEventListener("keyup", keyUp, true);
      window.removeEventListener("blur", clearKeys);
      window.removeEventListener("resize", resize);
      joystick.removeEventListener("pointerdown", joystickStart);
      joystick.removeEventListener("pointermove", joystickMove);
      joystick.removeEventListener("pointerup", joystickEnd);
      joystick.removeEventListener("pointercancel", joystickEnd);
      unbindUp();
      unbindDown();
      mobileLayer.remove();
      disposeBeam();
      disposeWeaponBeam();
      disposeTargetRing();
      disposeEnemyTargetRing();
      miningParticles.forEach((effect) => {
        effect.particles.forEach((particle) => particle.mesh.dispose());
        effect.material.dispose();
      });
      bursts.forEach((burst) => {
        burst.pieces.forEach((piece) => piece.mesh.dispose());
        burst.material.dispose();
      });
      enemyExplosionBursts.forEach((burst) => {
        burst.pieces.forEach((piece) => piece.mesh.dispose());
        burst.material.dispose();
      });
      enemyMeshes.forEach((mesh) => mesh.dispose());
      asteroidMeshes.forEach((mesh) => mesh.dispose());
      adBillboards.forEach((billboard) => billboard.root.dispose());
      station.dispose();
      scene.dispose();
      engine.dispose();
    };
  }, []);

  const stationPos = stationPosition || { x: 0, y: 0, z: -22 };
  const targetId = selectedAsteroid ?? localTargetId;
  const target = (asteroids || []).find((asteroid) => asteroid.id === targetId) || null;
  const enemyTargetId = selectedEnemy ?? localEnemyTargetId;
  const enemyTarget = (enemies || []).find((enemy) => enemy.id === enemyTargetId) || null;
  const distance = target && shipPosition ? Math.sqrt(
    Math.pow((shipPosition.x || 0) - (target.position?.x || 0), 2) +
    Math.pow((shipPosition.y || 0) - (target.position?.y || 0), 2) +
    Math.pow((shipPosition.z || 0) - (target.position?.z || 0), 2)
  ) : null;
  const progress = target && target.remainingOre > 0 ? Math.min(100, (miningProgress / target.remainingOre) * 100) : 0;

  return (
    <div className="space-scene" style={{ position: "relative", width: "100%", height: "100%", minHeight: 0, overflow: "hidden", touchAction: "none" }}>
      <canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block", touchAction: "none" }} />

      <div style={{ position: "absolute", left: "50%", top: "50%", width: 34, height: 34, transform: "translate(-50%,-50%)", pointerEvents: "none", zIndex: 10 }}>
        <div style={{ position: "absolute", left: 0, top: "50%", width: 34, height: 1, background: "rgba(0,255,220,.85)" }} />
        <div style={{ position: "absolute", top: 0, left: "50%", width: 1, height: 34, background: "rgba(0,255,220,.85)" }} />
        <div style={{ position: "absolute", left: "50%", top: "50%", width: 5, height: 5, transform: "translate(-50%,-50%)", borderRadius: "50%", background: "#00ffdc", boxShadow: "0 0 8px #00ffdc" }} />
      </div>

      <div style={{ position: "absolute", left: 18, top: 72, zIndex: 20, pointerEvents: "none", padding: "9px 12px", border: "1px solid rgba(0,255,220,.45)", borderRadius: 8, background: "rgba(0,8,13,.78)", color: "#bfffff", fontFamily: "Arial, sans-serif", backdropFilter: "blur(6px)" }}>
        <div style={{ color: "#00ffdc", fontSize: 10, fontWeight: 900, letterSpacing: 1 }}>🏪 MINING STATION</div>
        <div style={{ marginTop: 4, fontSize: 11, fontWeight: 800 }}>{stationDistanceLabel(stationPos, shipPosition)}</div>
      </div>

      {enemyTarget && !enemyTarget.destroyed ? (
        <div style={{ position: "absolute", top: 72, right: 18, width: "min(320px, calc(100% - 30px))", padding: "11px 13px", zIndex: 20, pointerEvents: "none", border: "1px solid rgba(255,75,45,.65)", borderRadius: 8, background: "rgba(18,5,5,.88)", color: "#fff", fontFamily: "Arial, sans-serif", backdropFilter: "blur(6px)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", color: "#ff6545", fontSize: 10, fontWeight: 900, letterSpacing: 1.3 }}>
            <span>⚔️ ENEMY TARGET</span><span>#{enemyTarget.id + 1}</span>
          </div>
          <div style={{ marginTop: 6, fontSize: 17, fontWeight: 900 }}>☠️ {enemyTarget.type}</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 6, marginTop: 8 }}>
            <TargetStat label="HP" value={`${Math.max(0, Number(enemyTarget.health || 0)).toFixed(0)} / ${enemyTarget.maxHealth}`} />
            <TargetStat label="REWARD" value={`${enemyTarget.reward} CR`} />
          </div>
          <div style={{ marginTop: 7, height: 6, borderRadius: 4, overflow: "hidden", background: "rgba(255,255,255,.1)" }}>
            <div style={{ width: `${Math.min(100, Math.max(0, (enemyTarget.health / enemyTarget.maxHealth) * 100))}%`, height: "100%", background: "#ff4b35" }} />
          </div>
          <div style={{ marginTop: 8, textAlign: "center", fontSize: 10, fontWeight: 900, color: "#ffb19f" }}>🎯 CLICK ENEMY TO TARGET • PRESS F OR USE FIRE BUTTON</div>
        </div>
      ) : null}

      {target && !target.mined ? (
        <div style={{ position: "absolute", top: 72, left: "50%", transform: "translateX(-50%)", width: "min(340px, calc(100% - 30px))", padding: "11px 13px", zIndex: 20, pointerEvents: "none", border: "1px solid rgba(0,255,157,.6)", borderRadius: 8, background: "rgba(0,8,13,.86)", color: "#fff", fontFamily: "Arial, sans-serif", backdropFilter: "blur(6px)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", color: "#00ff9d", fontSize: 10, fontWeight: 900, letterSpacing: 1.3 }}>
            <span>🎯 TARGET LOCK</span><span>#{target.id + 1}</span>
          </div>
          <div style={{ marginTop: 6, fontSize: 17, fontWeight: 900 }}>{oreSymbol(target.oreType)} {oreName(target.oreType)}</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 6, marginTop: 8 }}>
            <TargetStat label="ORE" value={`${Number(target.remainingOre || 0).toFixed(1)}`} />
            <TargetStat label="VALUE" value={`${orePrice(target.oreType)} CR`} />
            <TargetStat label="DIST" value={distance === null ? "--" : `${distance.toFixed(1)}m`} />
          </div>
          <div style={{ marginTop: 8, textAlign: "center", fontSize: 10, fontWeight: 900, color: miningActive ? "#00ff9d" : distance !== null && distance <= 8 ? "#7dffcf" : "#ffcc66" }}>
            {miningActive ? "⛏️ MINING IN PROGRESS" : distance !== null && distance <= 8 ? "✓ IN MINING RANGE" : "⚠️ MOVE CLOSER TO MINE"}
          </div>
          {miningActive && <div style={{ marginTop: 7, height: 6, borderRadius: 4, overflow: "hidden", background: "rgba(255,255,255,.1)" }}><div style={{ width: `${progress}%`, height: "100%", background: "#00ff9d", transition: "width .08s linear" }} /></div>}
        </div>
      ) : (
        <div style={{ position: "absolute", left: "50%", bottom: 20, transform: "translateX(-50%)", zIndex: 20, pointerEvents: "none", padding: "7px 11px", borderRadius: 6, background: "rgba(0,0,0,.5)", color: "rgba(210,240,235,.75)", fontSize: 10, whiteSpace: "nowrap" }}>
          🎯 Click an asteroid to target it
        </div>
      )}

      <div className="space-scene-title">🚀 SPACE SECTOR</div>
      <div className="space-scene-controls">
        <span>⌨️ W/A/S/D = Move relative to camera</span>
        <span>SPACE = UP</span>
        <span>SHIFT = DOWN</span>
        <span>🖱️ Drag = Rotate</span>
        <span>🔍 Wheel = Zoom</span>
        <span>⛏️ Click asteroid = Target / Mine</span>
        <span>⚔️ Click enemy = Target • F = Fire</span>
      </div>
    </div>
  );
}

function TargetStat({ label, value }) {
  return <div style={{ padding: "5px 3px", borderRadius: 5, background: "rgba(255,255,255,.035)", textAlign: "center" }}><div style={{ color: "#6f918a", fontSize: 8, fontWeight: 700 }}>{label}</div><div style={{ marginTop: 2, color: "#eafff8", fontSize: 11, fontWeight: 900 }}>{value}</div></div>;
}

function oreSymbol(type) {
  return ({ iron: "⚙️", copper: "🟠", titanium: "🔷", gold: "🟡", crystal: "💎", uranium: "☢️" })[type] || "🪨";
}
function oreName(type) {
  return ({ iron: "IRON", copper: "COPPER", titanium: "TITANIUM", gold: "GOLD", crystal: "CRYSTAL", uranium: "URANIUM" })[type] || "UNKNOWN ORE";
}
function orePrice(type) {
  return ({ iron: 10, copper: 18, titanium: 35, gold: 60, crystal: 100, uranium: 180 })[type] || 0;
}

function stationDistanceLabel(stationPosition, shipPosition) {
  if (!shipPosition) return "DISTANCE --";
  const dx = (shipPosition.x || 0) - (stationPosition?.x || 0);
  const dy = (shipPosition.y || 0) - (stationPosition?.y || 0);
  const dz = (shipPosition.z || 0) - (stationPosition?.z || 0);
  const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
  return distance <= 6 ? "✓ DOCKING RANGE" : `DISTANCE ${distance.toFixed(1)}m`;
}
