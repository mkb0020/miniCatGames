// ======================================== PHOTOELECTRIC.JS ========================================
// PHASE 1: COLLECT PHOTONS (AMMO) BEFORE TIMER RUNS OUT
// PHASE 2: DEFEAT ENEMY WITH ELECTRON BULLETS (COLLECTED PHOTONS FROM PHASE 1)
import { CONSTANTS, showMobileControls, virtualKeys } from './main.js';

export function createPhotoElectricScene() {
  scene("photo-electric", () => {
    showMobileControls();

    const VIRTUAL_W = CONSTANTS.VIRTUAL_W;
    const VIRTUAL_H = CONSTANTS.VIRTUAL_H;

    // ======================================== GAME CONSTANTS ========================================
    const SPEED = 550;         
    const JUMP_FORCE = 900;   
    const gameLength = 1500;
    const gameHeight = VIRTUAL_H - 90;
    const groundSegmentWidth = 250; 
    const numGroundSegments = Math.floor(gameLength / groundSegmentWidth);

    // ======================================== GROUND (BOTTOM) ========================================
    const groundY = VIRTUAL_H - 5;
    for (let i = 0; i < numGroundSegments; i++) {  // VISUAL GROUND
      add([
        sprite("groundPlatform"),
        pos(i * groundSegmentWidth, groundY),
        scale(vec2(2, 1)),
        z(2),
        "phase1"
      ]);
    }
    
    add([ // COLLISION GROUND
      rect(gameLength, 80),
      pos(0, groundY),
      area(),
      body({ isStatic: true }),
      opacity(0),
      "ground",
      "phase1",
      z(4)
    ]);

    // ======================================== CEILING (TOP - UPSIDE DOWN) ========================================
    const ceilingY = 90;
    for (let i = 0; i < numGroundSegments; i++) { // VISUAL CEILING 
      add([
        sprite("groundPlatform"),
        pos(i * 250, ceilingY),
        scale(vec2(2, -1)), 
        z(2),
        "phase1"
      ]);
    }
    
    add([ // COLLISION CEILING
      rect(gameLength, -100),
      pos(0, 0),
      area(),
      body({ isStatic: true }),
      opacity(0),
      "ceiling",
      "phase1",
      z(4)
    ]);

    // ======================================== LEFT WALL ========================================
    for (let i = 0; i < 3; i++) {
      add([
        sprite("leftWall"),
        pos(0, i * 250),
        scale(vec2(1, 1)),
        z(3),
        "phase1"
      ]);
    }
    
    add([
      rect(50, VIRTUAL_H),
      pos(0, 0),
      area(),
      body({ isStatic: true }),
      opacity(0),
      "wall",
      "phase1",
      z(4)
    ]);

    // ======================================== RIGHT WALL ========================================
    for (let i = 0; i < 3; i++) {
      add([
        sprite("rightWall"),
        pos(gameLength + 30, i * 250),
        scale(vec2(1, 1)),
        anchor("topright"),
        z(4),
        "phase1"
      ]);
    }
    
    add([
      rect(50, VIRTUAL_H),
      pos(gameLength, 0),
      area(),
      body({ isStatic: true }),
      opacity(0),
      "wall",
      "phase1",
      z(3)
    ]);

    // ======================================== PLAYER ========================================
    const hitboxWidth = 90;
    const hitboxHeight = 90;
    const offsetX = 5;
    const offsetY = 0;
    const player = add([
      sprite("niels", { frame: 11 }),
      pos(VIRTUAL_W / 2, groundY - 100),
      area({
        width: hitboxWidth,
        height: hitboxHeight,
        offset: vec2(offsetX, offsetY)
      }),
      body(),
      scale(0.8),
      anchor("center"),
      z(10),
      {
        speed: SPEED,
        playerJumpForce: JUMP_FORCE,
        maxFallSpeed: 1000,
        airControl: 1,
        groundControl: 1.0,
        isMoving: false,
        facingRight: true,
        curState: 'idle'
      },
      "player",
      "phase1"
    ]);

    let isCollidingWithWall = false;
    player.onCollide("wall", () => {
      isCollidingWithWall = true;
      player.vel.x *= 0.3; 
    });
    player.onCollideEnd("wall", () => {
      isCollidingWithWall = false;
    });

    // ======================================== CONTROLS ========================================
    player.onUpdate(() => {
      let moveDir = 0;
      if (isKeyDown("left") || virtualKeys.left) moveDir -= 1;
      if (isKeyDown("right") || virtualKeys.right) moveDir += 1;
      
      const control = player.isGrounded() ? player.groundControl : player.airControl;
      player.move(moveDir * player.speed * control, 0);
      player.isMoving = moveDir !== 0;
      
      if (moveDir !== 0) {
        player.facingRight = moveDir > 0;
        player.flipX = !player.facingRight;
      }
      
      if ((isKeyDown("space") || virtualKeys.space) && player.isGrounded()) {
        player.jump(player.playerJumpForce);
      }

      // ======================================== ANIMATIONS ========================================
      if (!player.isGrounded()) {
        if (player.vel.y < -700) {
          player.frame = 8;
        } else if (player.vel.y < 20) {
          player.frame = 9;
        } else {
          player.frame = 10;
        }
        player.curState = "jump";
      } else {
        if (player.isMoving) {
          if (player.curState !== "walk") {
            player.play("walk");
            player.curState = "walk";
          }
        } else {
          player.stop();
          player.frame = 11;
          player.curState = "idle";
        }
      }

    });

    // ======================================== PHOTON SYSTEM ========================================
    let photonsCollected = 0;
    let gameTime = 15;
    let gameActive = true;

    const timerText = add([
      text("TIME: 30", { size: 32, font: "SpaceLetters" }),
      pos(50, 50),
      fixed(),
      color(0, 255, 255),
      z(100),
      "phase1UI"
    ]);

    const photonText = add([
      text("PHOTONS: 0", { size: 32, font: "SpaceLetters"}),
      pos(50, 90),
      fixed(),
      color(0, 255, 255),
      z(100),
      "phase1UI"
    ]);

    const timerLoop = loop(1, () => {
      if (!gameActive) return;

      gameTime--;
      timerText.text = "TIME: " + gameTime;

      if (gameTime <= 0) {
        startPhase2(photonsCollected);
      }
    });

    // ======================================== PHOTON SPAWNING ========================================
    function spawnPhoton() {
      if (!gameActive) return;

      const x = rand(120, gameLength - 60);
      const y = rand(140, gameHeight - 120);

      const photon = add([
        sprite("photon", { anim: "blink" }), 
        pos(x, y),
        area(),
        scale(1.5),
        anchor("center"),
        z(5),
        "photon",
        "phase1",
        {
          floatOffset: rand(0, 100)
        }
      ]);

      photon.onUpdate(() => {
        photon.pos.y += Math.sin(time() * 4 + photon.floatOffset) * 0.3;
      });

      wait(rand(0.8, 1.8), () => {
        if (photon.exists()) destroy(photon);
      });
    }

    const spawnLoop = loop(0.4, () => {
      if (gameActive) {
        spawnPhoton();
      }
    });

    player.onCollide("photon", (p) => {
      if (!gameActive) return;

      photonsCollected++;
      photonText.text = "Photons: " + photonsCollected;
      destroy(p);
    });

    // ======================================== CAMERA (PHASE 1) ========================================
    player.onUpdate(() => {
      setCamPos(player.pos.x, VIRTUAL_H / 2 + 40);
    });

    // ======================================== PHASE 2: CATLING GUN SHOOTER ========================================
    function startPhase2(bullets) {
      gameActive = false;
      get("phase1").forEach(obj => destroy(obj));
      get("phase1UI").forEach(obj => destroy(obj));

      setCamPos(VIRTUAL_W / 2, VIRTUAL_H / 2);

      // ======================================== PHASE 2 VARIABLES ========================================
      let bulletsRemaining = bullets;
      let enemyHealth = 10;
      let aimX = VIRTUAL_W / 2;
      let aimY = VIRTUAL_H / 2;
      const aimSpeed = 220; 

      // ======================================== BACKGROUND ========================================
      add([
        rect(VIRTUAL_W, VIRTUAL_H),
        pos(0, 0),
        color(20, 10, 30),
        opacity(0),
        z(0),
        "phase2"
      ]);

      // ======================================== CATLING GUN ========================================
      const gunX = VIRTUAL_W / 2;
      const gunY = VIRTUAL_H - 80;

      const gun = add([
        sprite("catlingGun", { frame: 1 }),
        pos(gunX, gunY),
        anchor("center"),
        scale(1.7),
        z(11),
        "phase2"
      ]);

      // ======================================== CROSSHAIR ========================================
      const crosshair = add([
        sprite("crossHair"),
        pos(aimX, aimY),
        anchor("center"),
        scale(2.5),
        z(10),
        "phase2"
      ]);

      // ======================================== QUANTUM ENEMY ========================================
      const enemy = add([
        sprite("enemy"),
        pos(rand(100, VIRTUAL_W - 100), rand(100, VIRTUAL_H - 200)),
        area(),
        anchor("center"),
        z(5),
        "enemy",
        "phase2",
        {
          health: enemyHealth
        }
      ]);

      const teleportLoop = loop(rand(1, 2.5), () => { // ENEMY TELEPORTATION LOOP
        if (enemy.exists()) {
          enemy.pos = vec2(
            rand(100, VIRTUAL_W - 100),
            rand(100, VIRTUAL_H - 200)
          );
        }
      });

      // ======================================== UI (PHASE 2) ========================================
      const bulletsUI = add([
        text(`ELECTRON BULLETS: ${bulletsRemaining}`, { size: 25, font: "SpaceLetters"}),
        pos(15, 15),
        fixed(),
        color(0, 255, 255),
        z(100),
        "phase2UI"
      ]);

      const enemyHealthUI = add([
        text(`ENEMY HP: ${enemyHealth}`, { size: 25, font: "SpaceLetters"}),
        pos(700, 15),
        fixed(),
        color(255, 50, 100),
        z(100),
        "phase2UI"
      ]);



      // ======================================== AIMING CONTROLS ========================================
      onUpdate("phase2", () => {
        if (isKeyDown("left") || virtualKeys.left) aimX -= aimSpeed * dt();
        if (isKeyDown("right") || virtualKeys.right) aimX += aimSpeed * dt();
        if (isKeyDown("up")) aimY -= aimSpeed * dt();
        if (isKeyDown("down")) aimY += aimSpeed * dt();

        aimX = Math.max(50, Math.min(VIRTUAL_W - 50, aimX));
        aimY = Math.max(50, Math.min(VIRTUAL_H - 150, aimY)); 

        crosshair.pos = vec2(aimX, aimY);

        let gunFrame;
        if (aimX < VIRTUAL_W / 3) {
          gunFrame = 0; 
        } else if (aimX < (VIRTUAL_W * 2) / 3) {
          gunFrame = 1; 
        } else {
          gunFrame = 2; 
        }
        gun.frame = gunFrame;
      });

      // ======================================== SHOOTING ========================================
      onKeyPress("space", () => {
        if (bulletsRemaining > 0 && enemy.exists()) {
          bulletsRemaining--;
          bulletsUI.text = `Electron Bullets: ${bulletsRemaining}`;

          const bullet = add([
            circle(8),
            pos(gunX, gunY - 40),
            color(100, 200, 255),
            area(),
            z(12),
            "bullet",
            "phase2",
            {
              targetX: aimX,
              targetY: aimY
            }
          ]);

         
          const dx = bullet.targetX - bullet.pos.x;
          const dy = bullet.targetY - bullet.pos.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const speed = 3200; 

       
          bullet.onUpdate(() => {
            bullet.move(
              (dx / dist) * speed,
              (dy / dist) * speed
            );

            if (bullet.pos.y < -50 || bullet.pos.y > VIRTUAL_H + 50 ||
                bullet.pos.x < -50 || bullet.pos.x > VIRTUAL_W + 50) {
              destroy(bullet);
            }
          });

          // ======================================== HIT DETECTION ========================================
          bullet.onCollide("enemy", () => {
            enemy.health--;
            enemyHealthUI.text = `ENEMY HP: ${enemy.health}`;
            destroy(bullet);

            enemy.color = rgb(255, 255, 255);
            wait(0.1, () => {
              if (enemy.exists()) {
                enemy.color = rgb(200, 0, 255);
              }
            });

            if (enemy.health <= 0) {
              showVictory();
            }
          });

          if (bulletsRemaining <= 0) {
            wait(1, () => {
              if (enemy.exists() && enemy.health > 0) {
                showDefeat();
              }
            });
          }
        }
      });

      // ======================================== VICTORY ========================================
      function showVictory() {
        destroy(enemy);

        add([
          rect(VIRTUAL_W, VIRTUAL_H),
          pos(0, 0),
          color(0, 0, 0),
          opacity(0.7),
          fixed(),
          z(200),
          "endScreen"
        ]);

        add([
          text("PURRFECT VICTORY!", { size: 72, font: "SpaceLetters"}),
          pos(VIRTUAL_W / 2, VIRTUAL_H / 2 - 80),
          anchor("center"),
          color(100, 255, 100),
          fixed(),
          z(201),
          "endScreen"
        ]);



        add([
          text("SPACE - Play Again | ESC - Menu", { size: 20, font: "SpaceLetters"}),
          pos(VIRTUAL_W / 2, VIRTUAL_H / 2 + 70),
          anchor("center"),
          color(0, 255, 255),
          fixed(),
          z(201),
          "endScreen"
        ]);

        onKeyPress("space", () => {
          go("photo-electric");
        });
      }

      // ======================================== DEFEAT ========================================
      function showDefeat() {
        add([
          rect(VIRTUAL_W, VIRTUAL_H),
          pos(0, 0),
          color(0, 0, 0),
          opacity(0.7),
          fixed(),
          z(200),
          "endScreen"
        ]);

        add([
          text("BUMMER!", { size: 64, font: "SpaceLetters"}),
          pos(VIRTUAL_W / 2, VIRTUAL_H / 2 - 80),
          anchor("center"),
          color(255, 100, 100),
          fixed(),
          z(201),
          "endScreen"
        ]);

        add([
          text(`Enemy Health Remaining: ${enemy.health}`, { size: 28, font: "SpaceLetters"}),
          pos(VIRTUAL_W / 2, VIRTUAL_H / 2 - 10),
          anchor("center"),
          color(200, 200, 200),
          fixed(),
          z(201),
          "endScreen"
        ]);

        add([
          text("SPACE - Try Again | ESC - Menu", { size: 20, font: "SpaceLetters"}),
          pos(VIRTUAL_W / 2, VIRTUAL_H / 2 + 60),
          anchor("center"),
          color(200, 200, 200),
          fixed(),
          z(201),
          "endScreen"
        ]);

        onKeyPress("space", () => {
          go("photo-electric");
        });
      }
    }

    // ======================================== RETURN TO MENU ========================================
    onKeyPress("escape", () => {
      go("menu");
    });

    // ======================================== UI HINTS (PHASE 1) ========================================
    add([
      text("ESC - Menu", {
        size: 14,
        font: "SpaceLetters",
      }),
      pos(10, 10),
      fixed(),
      color(0, 255, 255),
      opacity(0.7),
      z(100),
      "phase1UI"
    ]);



  });
}