// ======================================== ENTANGLEMENT.JS ========================================
import { CONSTANTS, showMobileControls, virtualKeys } from './main.js';

// ======================================== SPRITE PLATFORM CREATION ========================================
function createSpritePlatform(x, y, width, height, moveRange, moveSpeed, isActive = true) {
  const spriteWidth = 250;
  const scaleX = width / spriteWidth;
  const scaleY = 0.5;

  const spriteLayer = add([
    sprite("platform"),
    pos(x, y),
    anchor("center"), 
    scale(vec2(scaleX, scaleY)),
    opacity(1.0),
    z(6),
  ]);

  const collisionLayer = add([
    rect(width, height),
    pos(x - width/2, y - height/2),
    opacity(0),
    "oneWayPlatform",
    z(7)
  ]);

  collisionLayer.width = width;
  collisionLayer.height = height;
  collisionLayer.spriteLayer = spriteLayer;
  
  collisionLayer.centerX = x;
  collisionLayer.centerY = y;
  collisionLayer.isActive = isActive;
  collisionLayer.deltaX = 0;  

  // ========================================== MOVEMENT SETTINGS  ==========================================
  if (isActive) {
    const startCenterX = x;
    const minCenterX = startCenterX - moveRange;
    const maxCenterX = startCenterX + moveRange;

    let direction = 1;
    let lastCenterX = x;

    collisionLayer.onUpdate(() => {
      collisionLayer.centerX += moveSpeed * direction * dt();

      if (collisionLayer.centerX > maxCenterX) {
        collisionLayer.centerX = maxCenterX;
        direction = -1;
      }
      if (collisionLayer.centerX < minCenterX) {
        collisionLayer.centerX = minCenterX;
        direction = 1;
      }

      const deltaX = collisionLayer.centerX - lastCenterX;
      lastCenterX = collisionLayer.centerX;

      collisionLayer.pos.x = collisionLayer.centerX - width/2;
      collisionLayer.pos.y = y - height/2; 
      spriteLayer.pos.x = collisionLayer.centerX;
      spriteLayer.pos.y = y;

      collisionLayer.deltaX = deltaX;
    });
  } else {
    collisionLayer.onUpdate(() => {
      if (!collisionLayer.deltaX) {
        collisionLayer.deltaX = 0;
      }
    });
  }

  return collisionLayer;
}

// ======================================== GROUND CREATION ========================================
function createSpriteGround(x, y, width, height) {
  const segmentWidth = 500;
  const numSegments = Math.floor(width / segmentWidth);
  for (let i = 0; i < numSegments; i++) {
    add([
      sprite("groundPlatform"),
      pos(x + (i * segmentWidth), y),
      scale(vec2(2, 2)),
      z(3),
    ]);
  }

  add([
    rect(width, height),
    pos(x, y),
    area(),
    body({ isStatic: true }),
    opacity(0),
    "ground",
    z(4) 
  ]);
}

// ======================================== ONE WAY PLATFORM SETUP ========================================
function setupOneWayPlatforms(player) {
  const hitboxHeight = player.area.height || 90;
  const hitboxOffsetY = player.area.offset?.y || 10;
  const hitboxWidth = player.area.width || 90;

  player.onUpdate(() => {
    let currentlyRiding = null;
    const platforms = get("oneWayPlatform");
    for (const platform of platforms) {
      const playerBottom = player.pos.y + (hitboxHeight / 2) + hitboxOffsetY;
      const platformTop = platform.pos.y;
      
      const playerLeft = player.pos.x - (hitboxWidth / 2);
      const playerRight = player.pos.x + (hitboxWidth / 2);
      const platformLeft = platform.pos.x;
      const platformRight = platform.pos.x + platform.width;
      
      const horizontalOverlap = playerRight > platformLeft && playerLeft < platformRight;
      const verticalDistance = playerBottom - platformTop;
      
      if (
        horizontalOverlap &&
        player.vel.y >= 0 &&
        verticalDistance >= -5 &&
        verticalDistance <= 15
      ) {
        player.pos.y = platformTop - (hitboxHeight / 2) - hitboxOffsetY;
        player.vel.y = 0;
        currentlyRiding = platform;
        break; 
      }
    }
    
    if (currentlyRiding && currentlyRiding.deltaX) {
      player.pos.x += currentlyRiding.deltaX;
    }
    
    player.ridingPlatform = currentlyRiding;
  });
}

// ======================================== SCENE CREATION ========================================
export function createEntanglementScene() {
  scene("entanglement", () => {
    showMobileControls();

    const LEVEL_HEIGHT = 4000;
    const VIRTUAL_W = CONSTANTS.VIRTUAL_W;
    const VIRTUAL_H = CONSTANTS.VIRTUAL_H;
    const MOVE_SPEED = CONSTANTS.MOVE_SPEED;
    const JUMP_FORCE = CONSTANTS.JUMP_FORCE;

    // ======================================== PLATFORM DATA ========================================
    // SMALLER Y = HIGHER UP
    // PLAYER STARTS AT Y=3900, VICTORY IS Y=100
    const PLATFORM_COUNT = 25;
    const SPACING = LEVEL_HEIGHT / PLATFORM_COUNT;
    const platformData = [];

    for (let i = 1; i < PLATFORM_COUNT; i++) {
      platformData.push({
        xStart: rand(200, VIRTUAL_W - 200),
        y: LEVEL_HEIGHT - (i * SPACING),
        width: 180,
        height: 40,
        moveRange: rand(150, 300), 
        moveSpeed: rand(40, 100)
      });
    }

    // ======================================== PLAYER 1 (NORMAL CONTROLS) ========================================
    const player1 = add([
      sprite("niels", { frame: 11 }),
      pos(VIRTUAL_W / 3, LEVEL_HEIGHT - 100),
      area({
        width: 90,
        height: 90,
        offset: vec2(0, 0),
      }),
      body(),
      scale(0.7),
      anchor("center"),
      z(10),
      {
        facingRight: true,
        isMoving: false,
        curState: "idle",
        ridingPlatform: null,
        side: "normal"
      },
      "player1"
    ]);

    // ======================================== PLAYER 2 (INVERTED CONTROLS) - PINK ENTANGLED TWIN ========================================
    const player2 = add([
      sprite("niels", { frame: 11 }),
      pos((VIRTUAL_W / 3) * 2, LEVEL_HEIGHT - 100),
      area({
        width: 90,
        height: 90,
        offset: vec2(0, 0),
      }),
      body(),
      scale(0.7),
      anchor("center"),
      color(rgb(255, 61, 170)), // PINK!
      z(10), 
      {
        facingRight: true,
        isMoving: false,
        curState: "idle",
        ridingPlatform: null,
        side: "inverted"
      },
      "player2"
    ]);

    // ======================================== GROUND ========================================
    createSpriteGround(0, LEVEL_HEIGHT - 40, VIRTUAL_W, 40);

    // ======================================== PLATFORMS (SINGLE SET) ========================================
    platformData.forEach((data, index) => {
      createSpritePlatform(
        data.xStart,
        data.y,
        data.width,
        data.height,
        data.moveRange,
        data.moveSpeed,
        true
      );
    });

    // ======================================== ONE-WAY PLATFORM SETUP ========================================
    setupOneWayPlatforms(player1);
    setupOneWayPlatforms(player2);

    // ======================================== WALLS ========================================
    const WALL_SEGMENT_HEIGHT = 250 * 2;
    const WALL_BUFFER = 2;
    const activeWallSegments = new Map();

    function createWallSegment(index) {
      const yPos = LEVEL_HEIGHT - (index * WALL_SEGMENT_HEIGHT);

      const leftWall = add([
        sprite("leftWall"),
        pos(0, yPos),
        scale(vec2(0.7, 2)), 
        area(),
        body({ isStatic: true }),
        z(1), 
        "wallSegment"
      ]);

      const rightWall = add([
        sprite("rightWall"),
        pos(VIRTUAL_W, yPos),
        scale(vec2(0.7, 2)), 
        area(),
        body({ isStatic: true }),
        anchor("topright"),
        z(1),
        "wallSegment"
      ]);

      activeWallSegments.set(index, [leftWall, rightWall]);
    }

    function removeWallSegment(index) {
      const segment = activeWallSegments.get(index);
      if (!segment) return;
      segment.forEach(obj => destroy(obj));
      activeWallSegments.delete(index);
    }

    // ======================================== CONTROLS ========================================
    function handlePlayer(player, invertControls) {
      const leftKey = invertControls ? "right" : "left";
      const rightKey = invertControls ? "left" : "right";

      player.onUpdate(() => {
        player.isMoving = false;

        const leftPressed = isKeyDown(leftKey) || virtualKeys[leftKey];
        const rightPressed = isKeyDown(rightKey) || virtualKeys[rightKey];

        if (leftPressed) {
          player.move(-MOVE_SPEED, 0);
          player.facingRight = false;
          player.isMoving = true;
        }

        if (rightPressed) {
          player.move(MOVE_SPEED, 0);
          player.facingRight = true;
          player.isMoving = true;
        }

        if (player.pos.y > LEVEL_HEIGHT + 300) {
          player.pos = vec2(
            player.side === "normal" ? VIRTUAL_W / 3 : (VIRTUAL_W / 3) * 2,
            LEVEL_HEIGHT - 200
          );
          player.ridingPlatform = null;
        }

        updatePlayerAnim(player);
      });
    }

    handlePlayer(player1, false);  
    handlePlayer(player2, true);    

    // ======================================== JUMP ========================================
    onKeyPress("space", () => {
      if (player1.isGrounded() || player1.ridingPlatform) {
        player1.jump(JUMP_FORCE);
        player1.curState = "jumpStart";
        player1.use(sprite("niels", { frame: 8 }));
        player1.ridingPlatform = null; 
      }
      if (player2.isGrounded() || player2.ridingPlatform) {
        player2.jump(JUMP_FORCE);
        player2.curState = "jumpStart";
        player2.use(sprite("niels", { frame: 8 }));
        player2.use(color(rgb(255, 61, 170))); // REAPPLY TINT
        player2.ridingPlatform = null;
      }
    });

    // ======================================== CAMERA ========================================
    onUpdate(() => {
      const avgY = (player1.pos.y + player2.pos.y) / 2;
      const camY = Math.max(avgY + 50, VIRTUAL_H / 2);
      setCamPos(VIRTUAL_W / 2, camY);

      const currentSegment = Math.floor((LEVEL_HEIGHT - camY) / WALL_SEGMENT_HEIGHT);

      for (let i = currentSegment - WALL_BUFFER; i <= currentSegment + WALL_BUFFER; i++) {
        if (i >= 0 && i <= LEVEL_HEIGHT / WALL_SEGMENT_HEIGHT) {
          if (!activeWallSegments.has(i)) {
            createWallSegment(i);
          }
        }
      }

      for (const index of activeWallSegments.keys()) {
        if (Math.abs(index - currentSegment) > WALL_BUFFER + 1) {
          removeWallSegment(index);
        }
      }
    });

    // ======================================== ANIMATION HELPER ========================================
    function updatePlayerAnim(player) {
      const grounded = player.isGrounded() || player.ridingPlatform;
      let newState;

      if (!grounded) {
        if (player.vel.y < -700) {
          newState = "jumpStart";  
        } else if (player.vel.y > 20) {
          newState = "fall";      
        } else {
          newState = "jumpMid";   
        }
      } else if (player.isMoving) {
        newState = "walk";
      } else {
        newState = "idle";
      }

      if (newState !== player.curState) {
        player.curState = newState;

        if (newState === "walk") {
          player.use(sprite("niels"));
          player.play("walk");
        } else if (newState === "jumpStart") {
          player.use(sprite("niels", { frame: 8 }));
          player.stop();
        } else if (newState === "jumpMid") {
          player.use(sprite("niels", { frame: 9 }));
          player.stop();
        } else if (newState === "fall") {
          player.use(sprite("niels", { frame: 10 }));
          player.stop();
        } else {
          player.use(sprite("niels", { frame: 11 }));
          player.stop();
        }

        if (player.side === "inverted") {
          player.use(color(rgb(255, 61, 170)));
        }
      }

      player.flipX = !player.facingRight;
    }

    // ======================================== SUCCESS CHECK ========================================
    const goalY = 100;
    let victoryShown = false;
    
    add([
      rect(VIRTUAL_W, 20),
      pos(0, goalY - 10),
      color(rgb(100, 255, 100)),
      opacity(0.3),
      z(1),
      "goal"
    ]);
    
    add([
      text("GOAL", { size: 32 }),
      pos(VIRTUAL_W / 2, goalY),
      anchor("center"),
      color(255, 255, 255),
      z(2)
    ]);
    
    onUpdate(() => {
      if (!victoryShown && player1.pos.y < goalY && player2.pos.y < goalY) {
        victoryShown = true;
        add([
          text("🎉 ENTANGLEMENT COMPLETE! 🎉", { size: 32 }),
          pos(VIRTUAL_W / 2, camPos().y - 100),
          anchor("center"),
          color(255, 200, 100),
          z(999), 
          "victory"
        ]);
        
        // Return to menu after victory
        wait(3, () => {
          go("menu");
        });
      }
    });

    // ======================================== RETURN TO MENU ========================================
    onKeyPress("escape", () => {
      go("menu");
    });

    // UI hints
    add([
      text("ESC - Return to Menu", {
        size: 14,
        font: "SpaceLetters",
      }),
      pos(10, 10),
      fixed(),
      color(200, 200, 200),
      opacity(0.7),
      z(100),
    ]);

    add([
      text("Normal Cat", {
        size: 16,
        font: "SpaceLetters",
      }),
      pos(VIRTUAL_W / 3, VIRTUAL_H - 30),
      anchor("center"),
      fixed(),
      color(255, 255, 255),
      opacity(0.8),
      z(100),
    ]);

    add([
      text("Entangled Cat", {
        size: 16,
        font: "SpaceLetters",
      }),
      pos((VIRTUAL_W / 3) * 2, VIRTUAL_H - 30),
      anchor("center"),
      fixed(),
      color(255, 61, 170),
      opacity(0.8),
      z(100),
    ]);
  });
}