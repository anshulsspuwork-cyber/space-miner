import React, {
  useEffect,
  useRef,
  useState,
} from "react";

import * as BABYLON from "babylonjs";

import "./Game.css";

export default function SpaceScene({
  asteroids,
  selectedAsteroid,
  miningActive,
  miningProgress = 0,
  shipPosition,
  shipSpeed,
  onAsteroidClick,
  onShipMove,
}) {
  const canvasRef = useRef(null);

  const asteroidsRef =
    useRef(asteroids || []);

  const selectedRef =
    useRef(selectedAsteroid);

  const miningRef =
    useRef(miningActive);

  const shipPositionRef =
    useRef(shipPosition);

  const shipSpeedRef =
    useRef(shipSpeed);

  const onAsteroidClickRef =
    useRef(onAsteroidClick);

  const onShipMoveRef =
    useRef(onShipMove);

  const [localTargetId, setLocalTargetId] =
    useState(selectedAsteroid);

  // =====================================================
  // KEEP REACT DATA UPDATED
  // =====================================================

  useEffect(() => {
    asteroidsRef.current =
      asteroids || [];
  }, [asteroids]);

  useEffect(() => {
    selectedRef.current =
      selectedAsteroid;
  }, [selectedAsteroid]);

  useEffect(() => {
    miningRef.current =
      miningActive;
  }, [miningActive]);

  useEffect(() => {
    shipPositionRef.current =
      shipPosition;
  }, [shipPosition]);

  useEffect(() => {
    shipSpeedRef.current =
      shipSpeed;
  }, [shipSpeed]);

  useEffect(() => {
    onAsteroidClickRef.current =
      onAsteroidClick;
  }, [onAsteroidClick]);

  useEffect(() => {
    onShipMoveRef.current =
      onShipMove;
  }, [onShipMove]);

  // =====================================================
  // CREATE 3D WORLD
  // =====================================================

  useEffect(() => {
    const canvas =
      canvasRef.current;

    if (!canvas) {
      return;
    }

    // =====================================================
    // BABYLON ENGINE
    // =====================================================

    const engine =
      new BABYLON.Engine(
        canvas,
        true,
        {
          preserveDrawingBuffer: true,
          stencil: true,
          adaptToDeviceRatio: true,
        }
      );

    const scene =
      new BABYLON.Scene(engine);

    scene.clearColor =
      new BABYLON.Color4(
        0.002,
        0.004,
        0.015,
        1
      );

    // =====================================================
    // CAMERA
    // =====================================================

    const camera =
      new BABYLON.ArcRotateCamera(
        "Camera",
        -Math.PI / 2,
        Math.PI / 2.7,
        32,
        BABYLON.Vector3.Zero(),
        scene
      );

    camera.attachControl(
      canvas,
      true
    );

    camera.lowerRadiusLimit = 12;
    camera.upperRadiusLimit = 70;
    camera.wheelPrecision = 45;
    camera.panningSensibility = 0;

    // =====================================================
    // LIGHTS
    // =====================================================

    const hemiLight =
      new BABYLON.HemisphericLight(
        "SpaceLight",
        new BABYLON.Vector3(
          0,
          1,
          0
        ),
        scene
      );

    hemiLight.intensity = 1.2;

    const pointLight =
      new BABYLON.PointLight(
        "ShipLight",
        new BABYLON.Vector3(
          0,
          3,
          0
        ),
        scene
      );

    pointLight.intensity = 1.5;

    // =====================================================
    // STARS
    // =====================================================

    for (
      let i = 0;
      i < 450;
      i++
    ) {
      const star =
        BABYLON.MeshBuilder.CreateSphere(
          `Star${i}`,
          {
            diameter:
              0.03 +
              Math.random() * 0.1,
          },
          scene
        );

      star.position =
        new BABYLON.Vector3(
          (Math.random() - 0.5) *
            150,

          (Math.random() - 0.5) *
            100,

          (Math.random() - 0.5) *
            150
        );

      const material =
        new BABYLON.StandardMaterial(
          `StarMaterial${i}`,
          scene
        );

      material.emissiveColor =
        new BABYLON.Color3(
          1,
          1,
          1
        );

      material.disableLighting =
        true;

      star.material =
        material;
    }

    // =====================================================
    // PLAYER SHIP
    // =====================================================

    // Larger, recognizable player ship used as the main scale reference.
    const ship = new BABYLON.TransformNode("PlayerShip", scene);

    const initialPosition = shipPositionRef.current || { x: 0, y: 0, z: 0 };
    ship.position = new BABYLON.Vector3(
      initialPosition.x || 0,
      initialPosition.y || 0,
      initialPosition.z || 0
    );

    const shipBody = BABYLON.MeshBuilder.CreateCylinder(
      "PlayerShipBody",
      { height: 5.2, diameterTop: 0.05, diameterBottom: 1.7, tessellation: 6 },
      scene
    );
    shipBody.parent = ship;
    shipBody.rotation.z = Math.PI / 2;

    const shipMaterial = new BABYLON.StandardMaterial("ShipMaterial", scene);
    shipMaterial.diffuseColor = new BABYLON.Color3(0.04, 0.48, 0.95);
    shipMaterial.emissiveColor = new BABYLON.Color3(0.01, 0.12, 0.3);
    shipBody.material = shipMaterial;

    const cockpit = BABYLON.MeshBuilder.CreateSphere(
      "ShipCockpit",
      { diameter: 1.0, segments: 12 },
      scene
    );
    cockpit.parent = ship;
    cockpit.position = new BABYLON.Vector3(1.25, 0.32, 0);
    cockpit.scaling = new BABYLON.Vector3(1.2, 0.45, 0.8);

    const cockpitMaterial = new BABYLON.StandardMaterial("CockpitMaterial", scene);
    cockpitMaterial.diffuseColor = new BABYLON.Color3(0.02, 0.12, 0.2);
    cockpitMaterial.emissiveColor = new BABYLON.Color3(0, 0.35, 0.65);
    cockpit.material = cockpitMaterial;

    const wingMaterial = new BABYLON.StandardMaterial("WingMaterial", scene);
    wingMaterial.diffuseColor = new BABYLON.Color3(0.025, 0.2, 0.42);

    const leftWing = BABYLON.MeshBuilder.CreateBox(
      "ShipLeftWing",
      { width: 2.6, height: 0.18, depth: 0.65 },
      scene
    );
    leftWing.parent = ship;
    leftWing.position = new BABYLON.Vector3(-0.15, 0, -1.05);
    leftWing.rotation.y = -0.2;
    leftWing.material = wingMaterial;

    const rightWing = leftWing.clone("ShipRightWing");
    rightWing.parent = ship;
    rightWing.position.z = 1.05;
    rightWing.rotation.y = 0.2;

    const noseLight = BABYLON.MeshBuilder.CreateSphere(
      "ShipNoseLight",
      { diameter: 0.28 },
      scene
    );
    noseLight.parent = ship;
    noseLight.position = new BABYLON.Vector3(2.45, 0, 0);
    const noseMaterial = new BABYLON.StandardMaterial("ShipNoseMaterial", scene);
    noseMaterial.emissiveColor = new BABYLON.Color3(0.1, 0.9, 1);
    noseMaterial.disableLighting = true;
    noseLight.material = noseMaterial;

    // ENGINE GLOW
    // =====================================================

    const engineGlow =
      BABYLON.MeshBuilder.CreateSphere(
        "EngineGlow",
        {
          diameter: 0.8,
        },
        scene
      );

    engineGlow.parent =
      ship;

    engineGlow.position =
      new BABYLON.Vector3(
        -2,
        0,
        0
      );

    const engineMaterial =
      new BABYLON.StandardMaterial(
        "EngineMaterial",
        scene
      );

    engineMaterial.emissiveColor =
      new BABYLON.Color3(
        0,
        0.9,
        1
      );

    engineMaterial.disableLighting =
      true;

    engineGlow.material =
      engineMaterial;

    // =====================================================
    // PLAYER REFERENCE MARKER
    // =====================================================

    const shipRing = BABYLON.MeshBuilder.CreateTorus(
      "PlayerReferenceRing",
      { diameter: 6.2, thickness: 0.055, tessellation: 48 },
      scene
    );
    shipRing.parent = ship;
    shipRing.rotation.x = Math.PI / 2;

    const ringMaterial = new BABYLON.StandardMaterial("PlayerReferenceMaterial", scene);
    ringMaterial.emissiveColor = new BABYLON.Color3(0, 0.85, 1);
    ringMaterial.disableLighting = true;
    ringMaterial.alpha = 0.75;
    shipRing.material = ringMaterial;

    const labelPlane = BABYLON.MeshBuilder.CreatePlane(
      "PlayerShipLabel",
      { width: 4.5, height: 1.1 },
      scene
    );
    labelPlane.parent = ship;
    labelPlane.position = new BABYLON.Vector3(0, 3.1, 0);
    labelPlane.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;

    const labelTexture = new BABYLON.DynamicTexture(
      "PlayerShipLabelTexture",
      { width: 512, height: 128 },
      scene,
      true
    );
    labelTexture.hasAlpha = true;
    labelTexture.drawText(
      "YOU  •  PLAYER SHIP",
      256,
      78,
      "bold 42px Arial",
      "#8fffff",
      "transparent",
      true
    );

    const labelMaterial = new BABYLON.StandardMaterial(
      "PlayerShipLabelMaterial",
      scene
    );
    labelMaterial.diffuseTexture = labelTexture;
    labelMaterial.opacityTexture = labelTexture;
    labelMaterial.emissiveTexture = labelTexture;
    labelMaterial.disableLighting = true;
    labelMaterial.backFaceCulling = false;
    labelPlane.material = labelMaterial;

    // ASTEROID COLORS
    // =====================================================

    const asteroidColors = {
      iron:
        new BABYLON.Color3(
          0.38,
          0.36,
          0.35
        ),

      copper:
        new BABYLON.Color3(
          0.65,
          0.3,
          0.12
        ),

      titanium:
        new BABYLON.Color3(
          0.18,
          0.55,
          0.75
        ),

      gold:
        new BABYLON.Color3(
          0.9,
          0.65,
          0.08
        ),

      crystal:
        new BABYLON.Color3(
          0.55,
          0.18,
          0.85
        ),

      uranium:
        new BABYLON.Color3(
          0.15,
          0.8,
          0.2
        ),
    };

    // =====================================================
    // ASTEROID STORAGE
    // =====================================================

    const asteroidMeshes =
      new Map();

    // =====================================================
    // CREATE ASTEROID
    // =====================================================

    const createAsteroid =
      (asteroid) => {
        if (!asteroid) {
          return null;
        }

        const mesh =
          BABYLON.MeshBuilder.CreateIcoSphere(
            `Asteroid${asteroid.id}`,
            {
              radius:
                asteroid.size || 1.2,

              subdivisions: 1,
            },
            scene
          );

        const position =
          asteroid.position || {
            x: 0,
            y: 0,
            z: 0,
          };

        mesh.position =
          new BABYLON.Vector3(
            position.x || 0,
            position.y || 0,
            position.z || 0
          );

        const rotation =
          asteroid.rotation || {
            x: 0,
            y: 0,
            z: 0,
          };

        mesh.rotation =
          new BABYLON.Vector3(
            rotation.x || 0,
            rotation.y || 0,
            rotation.z || 0
          );

        const material =
          new BABYLON.StandardMaterial(
            `AsteroidMaterial${asteroid.id}`,
            scene
          );

        material.diffuseColor =
          asteroidColors[
            asteroid.oreType
          ] ||
          asteroidColors.iron;

        material.specularColor =
          new BABYLON.Color3(
            0.2,
            0.2,
            0.2
          );

        mesh.material =
          material;

        mesh.metadata = {
          asteroidId:
            asteroid.id,
        };

        // =====================================================
        // CLICK ASTEROID
        // =====================================================

        mesh.actionManager =
          new BABYLON.ActionManager(
            scene
          );

        mesh.actionManager.registerAction(
          new BABYLON.ExecuteCodeAction(
            BABYLON.ActionManager
              .OnPickTrigger,

            () => {
              const current =
                asteroidsRef.current.find(
                  (item) =>
                    item.id ===
                    asteroid.id
                );

              if (
                current &&
                !current.mined
              ) {
                setLocalTargetId(
                  current.id
                );

                onAsteroidClickRef.current(
                  current.id
                );
              }
            }
          )
        );

        asteroidMeshes.set(
          asteroid.id,
          mesh
        );

        return mesh;
      };

    // =====================================================
    // CREATE INITIAL ASTEROIDS
    // =====================================================

    (
      asteroidsRef.current || []
    ).forEach(
      createAsteroid
    );

    // =====================================================
    // LASER
    // =====================================================

    let laser = null;
    let laserCore = null;
    let targetRing = null;

    const disposeLaser =
      () => {
        if (laser) {
          laser.dispose();
          laser = null;
        }

        if (laserCore) {
          laserCore.dispose();
          laserCore = null;
        }

        if (targetRing) {
          targetRing.dispose();
          targetRing = null;
        }
      };

    const createLaser =
      (targetMesh) => {
        if (!targetMesh) {
          return;
        }

        disposeLaser();

        const start =
          ship.position.clone();

        const end =
          targetMesh.position.clone();

        const direction =
          end.subtract(start);

        const distance =
          direction.length();

        if (
          distance < 0.001
        ) {
          return;
        }

        const normalized =
          direction.normalize();

        // =====================================================
        // OUTER LASER
        // =====================================================

        laser =
          BABYLON.MeshBuilder.CreateCylinder(
            "MiningLaser",
            {
              height: distance,
              diameter: 0.16,
              tessellation: 12,
            },
            scene
          );

        laser.position =
          start.add(
            normalized.scale(
              distance / 2
            )
          );

        // =====================================================
        // LASER ROTATION
        //
        // We DO NOT use:
        // Quaternion.FromUnitVectors()
        //
        // That function does not exist in BabylonJS.
        // =====================================================

        const axis =
          BABYLON.Vector3.Cross(
            BABYLON.Axis.Y,
            normalized
          );

        const dot =
          BABYLON.Vector3.Dot(
            BABYLON.Axis.Y,
            normalized
          );

        const clamped =
          Math.max(
            -1,
            Math.min(
              1,
              dot
            )
          );

        const angle =
          Math.acos(
            clamped
          );

        if (
          axis.length() >
          0.0001
        ) {
          axis.normalize();

          laser.rotationQuaternion =
            BABYLON.Quaternion.RotationAxis(
              axis,
              angle
            );
        } else if (
          dot < 0
        ) {
          laser.rotationQuaternion =
            BABYLON.Quaternion.RotationAxis(
              BABYLON.Axis.X,
              Math.PI
            );
        }

        const material =
          new BABYLON.StandardMaterial(
            "LaserMaterial",
            scene
          );

        material.emissiveColor =
          new BABYLON.Color3(
            0,
            0.9,
            1
          );

        material.disableLighting =
          true;

        material.alpha =
          0.9;

        laser.material =
          material;

        // =====================================================
        // INNER LASER
        // =====================================================

        laserCore =
          BABYLON.MeshBuilder.CreateCylinder(
            "MiningLaserCore",
            {
              height: distance,
              diameter: 0.045,
              tessellation: 8,
            },
            scene
          );

        laserCore.position =
          laser.position.clone();

        if (
          laser.rotationQuaternion
        ) {
          laserCore.rotationQuaternion =
            laser.rotationQuaternion.clone();
        }

        const coreMaterial =
          new BABYLON.StandardMaterial(
            "LaserCoreMaterial",
            scene
          );

        coreMaterial.emissiveColor =
          new BABYLON.Color3(
            0.8,
            1,
            1
          );

        coreMaterial.disableLighting =
          true;

        laserCore.material =
          coreMaterial;

        // =====================================================
        // TARGET RING
        // =====================================================

        targetRing =
          BABYLON.MeshBuilder.CreateTorus(
            "MiningTarget",
            {
              diameter: 3,
              thickness: 0.08,
              tessellation: 32,
            },
            scene
          );

        targetRing.position =
          targetMesh.position.clone();

        const ringMaterial =
          new BABYLON.StandardMaterial(
            "TargetMaterial",
            scene
          );

        ringMaterial.emissiveColor =
          new BABYLON.Color3(
            0,
            1,
            0.7
          );

        ringMaterial.disableLighting =
          true;

        targetRing.material =
          ringMaterial;
      };

    // =====================================================
    // KEYBOARD CONTROLS
    // =====================================================

    const keys = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      up: false,
      down: false,
    };

    const clearKeys =
      () => {
        keys.forward = false;
        keys.backward = false;
        keys.left = false;
        keys.right = false;
        keys.up = false;
        keys.down = false;
      };

    const keyDown =
      (event) => {
        switch (event.code) {
          case "KeyW":
          case "ArrowUp":
            keys.forward = true;
            break;

          case "KeyS":
          case "ArrowDown":
            keys.backward = true;
            break;

          case "KeyA":
          case "ArrowLeft":
            keys.left = true;
            break;

          case "KeyD":
          case "ArrowRight":
            keys.right = true;
            break;

          case "Space":
            keys.up = true;
            break;

          case "ShiftLeft":
          case "ShiftRight":
            keys.down = true;
            break;

          default:
            return;
        }

        // Prevent browser actions
        // such as scrolling and
        // activating buttons.

        event.preventDefault();
        event.stopPropagation();
      };

    const keyUp =
      (event) => {
        switch (event.code) {
          case "KeyW":
          case "ArrowUp":
            keys.forward = false;
            break;

          case "KeyS":
          case "ArrowDown":
            keys.backward = false;
            break;

          case "KeyA":
          case "ArrowLeft":
            keys.left = false;
            break;

          case "KeyD":
          case "ArrowRight":
            keys.right = false;
            break;

          case "Space":
            keys.up = false;
            break;

          case "ShiftLeft":
          case "ShiftRight":
            keys.down = false;
            break;

          default:
            return;
        }

        event.preventDefault();
        event.stopPropagation();
      };

    window.addEventListener(
      "keydown",
      keyDown,
      true
    );

    window.addEventListener(
      "keyup",
      keyUp,
      true
    );

    window.addEventListener(
      "blur",
      clearKeys
    );

    // =====================================================
    // MOBILE JOYSTICK
    // =====================================================

    let joystickActive =
      false;

    let joystickX = 0;
    let joystickY = 0;

    let joystickTouchId =
      null;

    const sceneContainer =
      canvas.parentElement;

    // =====================================================
    // JOYSTICK
    // =====================================================

    const joystick =
      document.createElement(
        "div"
      );

    joystick.className =
      "mobile-joystick";

    joystick.innerHTML = `
      <div class="joystick-ring">
        <div class="joystick-knob"></div>
      </div>
    `;

    const knob =
      joystick.querySelector(
        ".joystick-knob"
      );

    sceneContainer?.appendChild(
      joystick
    );

    const updateJoystick =
      (touch) => {
        const ring =
          joystick.querySelector(
            ".joystick-ring"
          );

        if (!ring) {
          return;
        }

        const rect =
          ring.getBoundingClientRect();

        const centerX =
          rect.left +
          rect.width / 2;

        const centerY =
          rect.top +
          rect.height / 2;

        let dx =
          touch.clientX -
          centerX;

        let dy =
          touch.clientY -
          centerY;

        const radius =
          rect.width / 2;

        const distance =
          Math.sqrt(
            dx * dx +
            dy * dy
          );

        if (
          distance > radius
        ) {
          dx =
            (dx / distance) *
            radius;

          dy =
            (dy / distance) *
            radius;
        }

        joystickX =
          dx / radius;

        joystickY =
          dy / radius;

        if (knob) {
          knob.style.transform =
            `translate(${dx}px, ${dy}px)`;
        }
      };

    const touchStart =
      (event) => {
        if (
          joystickTouchId !==
          null
        ) {
          return;
        }

        const touch =
          event.changedTouches[0];

        joystickTouchId =
          touch.identifier;

        joystickActive =
          true;

        updateJoystick(
          touch
        );

        event.preventDefault();
      };

    const touchMove =
      (event) => {
        if (
          !joystickActive
        ) {
          return;
        }

        for (
          const touch of
            event.changedTouches
        ) {
          if (
            touch.identifier ===
            joystickTouchId
          ) {
            updateJoystick(
              touch
            );

            event.preventDefault();

            break;
          }
        }
      };

    const touchEnd =
      (event) => {
        for (
          const touch of
            event.changedTouches
        ) {
          if (
            touch.identifier ===
            joystickTouchId
          ) {
            joystickTouchId =
              null;

            joystickActive =
              false;

            joystickX = 0;
            joystickY = 0;

            if (knob) {
              knob.style.transform =
                "translate(0px, 0px)";
            }

            break;
          }
        }
      };

    joystick.addEventListener(
      "touchstart",
      touchStart,
      {
        passive: false,
      }
    );

    joystick.addEventListener(
      "touchmove",
      touchMove,
      {
        passive: false,
      }
    );

    joystick.addEventListener(
      "touchend",
      touchEnd
    );

    joystick.addEventListener(
      "touchcancel",
      touchEnd
    );

    // =====================================================
    // MOBILE UP / DOWN CONTROLS
    // =====================================================

    const verticalControls =
      document.createElement(
        "div"
      );

    verticalControls.className =
      "mobile-vertical-controls";

    verticalControls.innerHTML = `
      <button
        class="vertical-btn up-btn"
        type="button"
      >
        ▲
      </button>

      <button
        class="vertical-btn down-btn"
        type="button"
      >
        ▼
      </button>
    `;

    sceneContainer?.appendChild(
      verticalControls
    );

    let mobileUp = false;
    let mobileDown = false;

    const upButton =
      verticalControls.querySelector(
        ".up-btn"
      );

    const downButton =
      verticalControls.querySelector(
        ".down-btn"
      );

    const startUp =
      (event) => {
        event.preventDefault();
        mobileUp = true;
      };

    const stopUp =
      (event) => {
        event.preventDefault();
        mobileUp = false;
      };

    const startDown =
      (event) => {
        event.preventDefault();
        mobileDown = true;
      };

    const stopDown =
      (event) => {
        event.preventDefault();
        mobileDown = false;
      };

    if (upButton) {
      upButton.addEventListener(
        "touchstart",
        startUp,
        {
          passive: false,
        }
      );

      upButton.addEventListener(
        "touchend",
        stopUp
      );

      upButton.addEventListener(
        "touchcancel",
        stopUp
      );

      upButton.addEventListener(
        "mousedown",
        startUp
      );

      upButton.addEventListener(
        "mouseup",
        stopUp
      );

      upButton.addEventListener(
        "mouseleave",
        stopUp
      );
    }

    if (downButton) {
      downButton.addEventListener(
        "touchstart",
        startDown,
        {
          passive: false,
        }
      );

      downButton.addEventListener(
        "touchend",
        stopDown
      );

      downButton.addEventListener(
        "touchcancel",
        stopDown
      );

      downButton.addEventListener(
        "mousedown",
        startDown
      );

      downButton.addEventListener(
        "mouseup",
        stopDown
      );

      downButton.addEventListener(
        "mouseleave",
        stopDown
      );
    }

    // =====================================================
    // MOVEMENT
    // =====================================================

    let lastFrame =
      performance.now();

    let lastReportedX =
      ship.position.x;

    let lastReportedY =
      ship.position.y;

    let lastReportedZ =
      ship.position.z;

    const updateMovement =
      () => {
        const now =
          performance.now();

        const delta =
          Math.min(
            0.05,
            (now - lastFrame) /
              1000
          );

        lastFrame =
          now;

        let forward = 0;
        let strafe = 0;
        let vertical = 0;

        // =====================================================
        // FORWARD / BACKWARD
        // =====================================================

        if (
          keys.forward
        ) {
          forward += 1;
        }

        if (
          keys.backward
        ) {
          forward -= 1;
        }

        // =====================================================
        // LEFT / RIGHT
        // =====================================================

        if (
          keys.left
        ) {
          strafe -= 1;
        }

        if (
          keys.right
        ) {
          strafe += 1;
        }

        // =====================================================
        // UP / DOWN
        // =====================================================

        if (
          keys.up ||
          mobileUp
        ) {
          vertical += 1;
        }

        if (
          keys.down ||
          mobileDown
        ) {
          vertical -= 1;
        }

        // =====================================================
        // MOBILE JOYSTICK
        // =====================================================

        if (
          Math.abs(
            joystickY
          ) > 0.05
        ) {
          forward =
            -joystickY;
        }

        if (
          Math.abs(
            joystickX
          ) > 0.05
        ) {
          strafe =
            joystickX;
        }

        // =====================================================
        // NORMALIZE MOVEMENT
        // =====================================================

        const movementLength =
          Math.sqrt(
            forward *
              forward +
              strafe *
                strafe +
              vertical *
                vertical
          );

        if (
          movementLength > 1
        ) {
          forward /=
            movementLength;

          strafe /=
            movementLength;

          vertical /=
            movementLength;
        }

        // =====================================================
        // MOVE SHIP — CAMERA RELATIVE
        // =====================================================

        if (forward !== 0 || strafe !== 0 || vertical !== 0) {
          const speed = shipSpeedRef.current || 8;

          // W always means forward from the current camera view.
          // S is backward and A/D are camera-relative strafing.
          let cameraForward = camera.target.subtract(camera.position);
          cameraForward.y = 0;

          if (cameraForward.lengthSquared() < 0.0001) {
            cameraForward = new BABYLON.Vector3(0, 0, 1);
          } else {
            cameraForward.normalize();
          }

          const cameraRight = BABYLON.Vector3.Cross(
            cameraForward,
            BABYLON.Axis.Y
          ).normalize();

          const movement = cameraForward.scale(forward).add(
            cameraRight.scale(strafe)
          );

          if (movement.lengthSquared() > 0.0001) {
            movement.normalize();
          }

          ship.position.x += movement.x * speed * delta;
          ship.position.z += movement.z * speed * delta;
          ship.position.y += vertical * speed * delta;

        // WORLD LIMITS
          // =====================================================

          ship.position.x =
            Math.max(
              -30,
              Math.min(
                30,
                ship.position.x
              )
            );

          ship.position.y =
            Math.max(
              -15,
              Math.min(
                15,
                ship.position.y
              )
            );

          ship.position.z =
            Math.max(
              -30,
              Math.min(
                30,
                ship.position.z
              )
            );

          // =====================================================
          // SHIP ROTATION
          // =====================================================

          if (movement.lengthSquared() > 0.0001) {
            // Ship hull points along local +X.
            ship.rotation.y = Math.atan2(
              movement.z,
              movement.x
            );
          }

          ship.rotation.x = -vertical * 0.25;

          // =====================================================
          // ENGINE EFFECT
          // =====================================================

          const pulse =
            0.8 +
            Math.sin(
              now * 0.02
            ) *
              0.2;

          engineGlow.scaling.x =
            pulse;

          engineGlow.scaling.y =
            pulse;

          engineGlow.scaling.z =
            pulse;

          // =====================================================
          // SEND POSITION TO REACT
          // =====================================================

          const moved =
            Math.abs(
              ship.position.x -
                lastReportedX
            ) > 0.05 ||
            Math.abs(
              ship.position.y -
                lastReportedY
            ) > 0.05 ||
            Math.abs(
              ship.position.z -
                lastReportedZ
            ) > 0.05;

          if (moved) {
            lastReportedX =
              ship.position.x;

            lastReportedY =
              ship.position.y;

            lastReportedZ =
              ship.position.z;

            if (
              onShipMoveRef.current
            ) {
              onShipMoveRef.current({
                x: ship.position.x,
                y: ship.position.y,
                z: ship.position.z,
              });
            }
          }
        }

        // =====================================================
        // CAMERA FOLLOWS SHIP
        // =====================================================

        camera.target =
          ship.position.clone();
      };

    // =====================================================
    // RENDER LOOP
    // =====================================================

    engine.runRenderLoop(
      () => {
        updateMovement();

        const currentAsteroids =
          asteroidsRef.current ||
          [];

        // =====================================================
        // UPDATE ASTEROIDS
        // =====================================================

        currentAsteroids.forEach(
          (asteroid) => {
            if (!asteroid) {
              return;
            }

            let mesh =
              asteroidMeshes.get(
                asteroid.id
              );

            // New asteroid
            if (!mesh) {
              mesh =
                createAsteroid(
                  asteroid
                );
            }

            if (!mesh) {
              return;
            }

            const position =
              asteroid.position || {
                x: 0,
                y: 0,
                z: 0,
              };

            mesh.position =
              new BABYLON.Vector3(
                position.x || 0,
                position.y || 0,
                position.z || 0
              );

            // =====================================================
            // MINED ASTEROID
            // =====================================================

            if (
              asteroid.mined
            ) {
              mesh.setEnabled(
                false
              );
            } else {
              mesh.setEnabled(
                true
              );

              const size =
                asteroid.size ||
                1.2;

              mesh.scaling =
                new BABYLON.Vector3(
                  size,
                  size,
                  size
                );

              const material =
                mesh.material;

              if (
                material
              ) {
                material.diffuseColor =
                  asteroidColors[
                    asteroid.oreType
                  ] ||
                  asteroidColors.iron;
              }
            }

            // =====================================================
            // ASTEROID ROTATION
            // =====================================================

            if (
              !asteroid.mined
            ) {
              mesh.rotation.x +=
                0.001;

              mesh.rotation.y +=
                0.002;
            }
          }
        );

        // =====================================================
        // MINING LASER
        // =====================================================

        const targetId =
          selectedRef.current;

        if (
          miningRef.current &&
          targetId !== null &&
          targetId !== undefined
        ) {
          const target =
            asteroidMeshes.get(
              targetId
            );

          if (
            target &&
            target.isEnabled()
          ) {
            createLaser(
              target
            );

            if (
              targetRing
            ) {
              targetRing.position =
                target.position.clone();

              targetRing.rotation.z +=
                0.025;
            }
          }
        } else {
          disposeLaser();
        }

        // =====================================================
        // ENGINE GLOW
        // =====================================================

        const pulse =
          0.85 +
          Math.sin(
            performance.now() *
              0.01
          ) *
            0.15;

        engineGlow.scaling =
          new BABYLON.Vector3(
            pulse,
            pulse,
            pulse
          );

        // =====================================================
        // RENDER
        // =====================================================

        scene.render();
      }
    );

    // =====================================================
    // RESIZE
    // =====================================================

    const resize =
      () => {
        engine.resize();
      };

    window.addEventListener(
      "resize",
      resize
    );

    // =====================================================
    // CLEANUP
    // =====================================================

    return () => {
      window.removeEventListener(
        "keydown",
        keyDown,
        true
      );

      window.removeEventListener(
        "keyup",
        keyUp,
        true
      );

      window.removeEventListener(
        "blur",
        clearKeys
      );

      window.removeEventListener(
        "resize",
        resize
      );

      joystick.remove();

      verticalControls.remove();

      disposeLaser();

      engine.dispose();
    };
  }, []);

  // =====================================================
  // TARGET DATA FOR HUD
  // =====================================================

  const displayTargetId =
    selectedAsteroid !== null &&
    selectedAsteroid !== undefined
      ? selectedAsteroid
      : localTargetId;

  const targetAsteroid =
    displayTargetId !== null &&
    displayTargetId !== undefined
      ? (asteroids || []).find(
          (asteroid) =>
            asteroid.id === displayTargetId
        )
      : null;

  const targetOre =
    targetAsteroid?.oreType || "iron";

  const targetDistance =
    targetAsteroid && shipPosition
      ? Math.sqrt(
          Math.pow(
            (shipPosition.x || 0) -
              (targetAsteroid.position?.x || 0),
            2
          ) +
            Math.pow(
              (shipPosition.y || 0) -
                (targetAsteroid.position?.y || 0),
              2
            ) +
            Math.pow(
              (shipPosition.z || 0) -
                (targetAsteroid.position?.z || 0),
              2
            )
        )
      : null;

  // =====================================================
  // UI
  // =====================================================

  return (
    <div
      className="space-scene"
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        minHeight: "0",
        overflow: "hidden",
        touchAction: "none",
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          width: "100%",
          height: "100%",
          display: "block",
          touchAction: "none",
        }}
      />

      {/* =================================================
          CENTER CROSSHAIR
      ================================================== */}

      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: "34px",
          height: "34px",
          transform: "translate(-50%, -50%)",
          zIndex: 20,
          pointerEvents: "none",
        }}
      >
        <span
          style={{
            position: "absolute",
            left: "0",
            top: "50%",
            width: "34px",
            height: "1px",
            background: "rgba(0,255,220,0.85)",
            boxShadow: "0 0 5px rgba(0,255,220,0.8)",
          }}
        />
        <span
          style={{
            position: "absolute",
            top: "0",
            left: "50%",
            width: "1px",
            height: "34px",
            background: "rgba(0,255,220,0.85)",
            boxShadow: "0 0 5px rgba(0,255,220,0.8)",
          }}
        />
        <span
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            width: "5px",
            height: "5px",
            transform: "translate(-50%, -50%)",
            borderRadius: "50%",
            background: "#00ffdc",
            boxShadow: "0 0 8px #00ffdc",
          }}
        />
      </div>

      {/* =================================================
          TARGET HUD
      ================================================== */}

      {targetAsteroid &&
        !targetAsteroid.mined && (
          <div
            style={{
              position: "absolute",
              top: "82px",
              left: "50%",
              transform: "translateX(-50%)",
              width: "min(330px, calc(100% - 30px))",
              padding: "12px 14px",
              zIndex: 25,
              pointerEvents: "none",
              border: "1px solid rgba(0,255,157,0.65)",
              borderRadius: "8px",
              background: "rgba(0,8,13,0.88)",
              boxShadow:
                "0 0 20px rgba(0,255,157,0.12)",
              backdropFilter: "blur(7px)",
              color: "#fff",
              fontFamily:
                "Arial, Helvetica, sans-serif",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "7px",
                color: "#00ff9d",
                fontSize: "10px",
                fontWeight: "900",
                letterSpacing: "1.5px",
              }}
            >
              <span>🎯 TARGET LOCK</span>

              <span
                style={{
                  color: "#7caaa0",
                  letterSpacing: "0",
                }}
              >
                #{targetAsteroid.id + 1}
              </span>
            </div>

            <div
              style={{
                marginBottom: "8px",
                fontSize: "17px",
                fontWeight: "900",
              }}
            >
              {getOreSymbol(targetOre)}{" "}
              {getOreName(targetOre)}
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(4, 1fr)",
                gap: "6px",
              }}
            >
              <TargetStat
                label="ORE"
                value={Number(
                  targetAsteroid.remainingOre ??
                    targetAsteroid.ore ??
                    0
                ).toFixed(1)}
              />

              <TargetStat
                label="VALUE"
                value={`${getOrePrice(
                  targetOre
                )} CR`}
              />

              <TargetStat
                label="DIST"
                value={
                  targetDistance !== null
                    ? `${targetDistance.toFixed(1)}m`
                    : "--"
                }
              />

              <TargetStat
                label="SIZE"
                value={Number(
                  targetAsteroid.size || 1.2
                ).toFixed(1)}
              />
            </div>

            <div
              style={{
                marginTop: "9px",
                padding: "6px",
                textAlign: "center",
                borderRadius: "5px",
                fontSize: "10px",
                fontWeight: "900",
                letterSpacing: "0.7px",
                color: miningActive
                  ? "#00ff9d"
                  : targetDistance !== null &&
                    targetDistance <= 8
                  ? "#7dffcf"
                  : "#ffcc66",
                background:
                  miningActive
                    ? "rgba(0,255,157,0.08)"
                    : targetDistance !== null &&
                      targetDistance <= 8
                    ? "rgba(0,255,157,0.06)"
                    : "rgba(255,180,0,0.07)",
                border:
                  miningActive
                    ? "1px solid rgba(0,255,157,0.22)"
                    : targetDistance !== null &&
                      targetDistance <= 8
                    ? "1px solid rgba(0,255,157,0.18)"
                    : "1px solid rgba(255,190,70,0.2)",
              }}
            >
              {miningActive
                ? "⛏️ MINING IN PROGRESS"
                : targetDistance !== null &&
                  targetDistance <= 8
                ? "✓ IN MINING RANGE"
                : "⚠️ MOVE CLOSER TO MINE"}
            </div>

            {miningActive && (
              <div
                style={{
                  marginTop: "8px",
                }}
              >
                <div
                  style={{
                    width: "100%",
                    height: "6px",
                    overflow: "hidden",
                    borderRadius: "4px",
                    background:
                      "rgba(255,255,255,0.1)",
                  }}
                >
                  <div
                    style={{
                      width: `${Math.min(
                        100,
                        targetAsteroid.remainingOre >
                          0
                          ? (miningProgress /
                              targetAsteroid.remainingOre) *
                            100
                          : 0
                      )}%`,
                      height: "100%",
                      borderRadius: "4px",
                      background: "#00ff9d",
                      boxShadow:
                        "0 0 8px rgba(0,255,157,0.6)",
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

      {!targetAsteroid && (
        <div
          style={{
            position: "absolute",
            left: "50%",
            bottom: "24px",
            transform: "translateX(-50%)",
            zIndex: 20,
            pointerEvents: "none",
            padding: "7px 11px",
            borderRadius: "6px",
            background:
              "rgba(0,0,0,0.5)",
            color: "rgba(210,240,235,0.75)",
            fontSize: "10px",
            whiteSpace: "nowrap",
          }}
        >
          🎯 Click an asteroid to target it
        </div>
      )}

      {/* =================================================
          OLD SCENE TITLE
      ================================================== */}

      <div className="space-scene-title">
        🚀 SPACE SECTOR
      </div>

      <div className="space-scene-controls">
        <span>
          ⌨️ W/A/S/D = Camera-relative movement
        </span>

        <span>
          SPACE = UP
        </span>

        <span>
          SHIFT = DOWN
        </span>

        <span>
          🖱️ Drag = Rotate
        </span>

        <span>
          🔍 Wheel = Zoom
        </span>

        <span>
          ⛏️ Click = Mine
        </span>
      </div>
    </div>
  );
}

// =====================================================
// TARGET HUD STAT
// =====================================================

function TargetStat({ label, value }) {
  return (
    <div
      style={{
        padding: "6px 4px",
        borderRadius: "5px",
        background: "rgba(255,255,255,0.035)",
        textAlign: "center",
      }}
    >
      <div
        style={{
          color: "#6f918a",
          fontSize: "8px",
          fontWeight: "700",
          letterSpacing: "0.8px",
        }}
      >
        {label}
      </div>

      <div
        style={{
          marginTop: "2px",
          color: "#eafff8",
          fontSize: "11px",
          fontWeight: "900",
        }}
      >
        {value}
      </div>
    </div>
  );
}

// =====================================================
// ORE DISPLAY HELPERS
// =====================================================

function getOreSymbol(type) {
  const symbols = {
    iron: "⚙️",
    copper: "🟠",
    titanium: "🔷",
    gold: "🟡",
    crystal: "💎",
    uranium: "☢️",
  };

  return symbols[type] || "🪨";
}

function getOreName(type) {
  const names = {
    iron: "IRON",
    copper: "COPPER",
    titanium: "TITANIUM",
    gold: "GOLD",
    crystal: "CRYSTAL",
    uranium: "URANIUM",
  };

  return names[type] || "UNKNOWN ORE";
}

function getOrePrice(type) {
  const prices = {
    iron: 10,
    copper: 18,
    titanium: 35,
    gold: 60,
    crystal: 100,
    uranium: 180,
  };

  return prices[type] || 0;
}