// ======================================== SUPURRFLUID.JS ========================================
import { CONSTANTS, showMobileControls, virtualKeys } from './main.js';

export function createSupurrFluidScene() {
  scene("supurr-fluid", () => {
    showMobileControls();

    const VIRTUAL_W = CONSTANTS.VIRTUAL_W;
    const VIRTUAL_H = CONSTANTS.VIRTUAL_H;

    // ======================================== SUPERFLUID PHYSICS CONSTANTS ========================================
    const ACCELERATION = 30; 
    const MAX_SPEED = 600;    
    const JUMP_FORCE = 780;   

    // ======================================== GROUND (BOTTOM) ========================================
    const groundY = VIRTUAL_H;
    for (let i = 0; i < 12; i++) {  // VISUAL GROUND
      add([
        sprite("groundPlatform"),
        pos(i * 250, groundY),
        scale(vec2(2, 1)),
        z(3),
      ]);
    }
    
    add([ // COLLISION GROUND
      rect(VIRTUAL_W * 3 + 250, 80),
      pos(0, groundY),
      area(),
      body({ isStatic: true }),
      opacity(0),
      "ground",
      z(4)
    ]);

    // ======================================== CEILING (TOP - UPSIDE DOWN) ========================================
    const ceilingY = 80;
    for (let i = 0; i < 12; i++) { // VISUAL CEILING 
      add([
        sprite("groundPlatform"),
        pos(i * 250, ceilingY),
        scale(vec2(2, -1)), 
        z(3),
      ]);
    }
    
    add([ // COLLISION CEILING
      rect(VIRTUAL_W * 3 + 250, 80),
      pos(0, 0),
      area(),
      body({ isStatic: true }),
      opacity(0),
      "ceiling",
      z(4)
    ]);

    // ======================================== LEFT WALL ========================================
    for (let i = 0; i < 3; i++) {
      add([
        sprite("leftWall"),
        pos(0, i * 250),
        scale(vec2(1, 1)),
        z(1),
      ]);
    }
    
    add([
      rect(50, VIRTUAL_H),
      pos(0, 0),
      area(),
      body({ isStatic: true }),
      opacity(0),
      "wall",
      z(2)
    ]);

    // ======================================== RIGHT WALL ========================================
    for (let i = 0; i < 3; i++) {
      add([
        sprite("rightWall"),
        pos(VIRTUAL_W * 3 + 250, i * 250),
        scale(vec2(1, 1)),
        anchor("topright"),
        z(1),
      ]);
    }
    
    add([
      rect(50, VIRTUAL_H),
      pos(VIRTUAL_W * 3 + 200, 0),
      area(),
      body({ isStatic: true }),
      opacity(0),
      "wall",
      z(2)
    ]);

    // ======================================== PLAYER (SUPERFLUID CAT) ========================================
    const player = add([
      sprite("niels", { frame: 11 }),
      pos(VIRTUAL_W / 2, groundY - 100),
      area({
        width: 90,
        height: 90,
        offset: vec2(0, 0),
      }),
      body({
        drag: 0,  
      }),
      scale(0.8),
      anchor("center"),
      z(10),
      {
        facingRight: true,
        velocityX: 0, 
        curState: "idle",
      },
      "player"
    ]);

    // ======================================== WALL COLLISION (DAMPING) ========================================
    let isCollidingWithWall = false;

    player.onCollide("wall", () => {
      isCollidingWithWall = true;
      player.velocityX *= 0.3;  
    });

    player.onCollideEnd("wall", () => {
      isCollidingWithWall = false;
    });

    // ======================================== SUPERFLUID CONTROLS ========================================
    player.onUpdate(() => {
      const leftPressed = isKeyDown("left") || virtualKeys.left;
      const rightPressed = isKeyDown("right") || virtualKeys.right;

      // SUPERFLUID MOVEMENT
      if (leftPressed) {
        player.velocityX -= ACCELERATION * dt();
        player.facingRight = false;
      }
      
      if (rightPressed) {
        player.velocityX += ACCELERATION * dt();
        player.facingRight = true;
      }

      player.velocityX = Math.max(-MAX_SPEED, Math.min(MAX_SPEED, player.velocityX));
      player.move(player.velocityX, 0);
      updatePlayerAnim(player);
    });

    // ======================================== JUMP ========================================
    onKeyPress("space", () => {
      if (player.isGrounded()) {
        player.jump(JUMP_FORCE);
        player.curState = "jumpStart";
        player.use(sprite("niels", { frame: 8 }));
      }
    });

    // ======================================== ANIMATION HELPER ========================================
    function updatePlayerAnim(player) {
      const grounded = player.isGrounded();
      let newState;

      if (!grounded) {
        if (player.vel.y < -700) {
          newState = "jumpStart";  
        } else if (player.vel.y > 20) {
          newState = "fall";      
        } else {
          newState = "jumpMid";   
        }
      } else if (Math.abs(player.velocityX) > 50) {
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

      }

      player.flipX = !player.facingRight;
    }

    // ======================================== CAMERA ========================================
    player.onUpdate(() => {
      setCamPos(player.pos.x, VIRTUAL_H / 2 + 40);
    });

    // ======================================== DEBUG INFO ========================================
    onUpdate(() => {
      const debugText = get("debugInfo")[0];
      if (!debugText) {
        add([
          text("", { size: 12, font: "SpaceLetters" }),
          pos(10, VIRTUAL_H - 60),
          color(0, 255, 255),
          fixed(),
          z(999),
          "debugInfo"
        ]);
      } else {
        debugText.text = `Velocity X: ${player.velocityX.toFixed(1)} | Velocity Y: ${player.vel.y.toFixed(1)}\nPos: (${player.pos.x.toFixed(0)}, ${player.pos.y.toFixed(0)})`;
      }
    });

    // ======================================== RETURN TO MENU ========================================
    onKeyPress("escape", () => {
      go("menu");
    });

    // ======================================== UI HINTS ========================================
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
      text("suPURR Fluid Cat", {
        size: 18,
        font: "SpaceLetters",
      }),
      pos(VIRTUAL_W / 2, 30),
      anchor("center"),
      fixed(),
      color(0, 200, 255),
      opacity(0.9),
      z(100),
    ]);

    add([
      text("Frictionless momentum! Hit walls to slow down.", {
        size: 12,
        font: "SpaceLetters",
      }),
      pos(VIRTUAL_W / 2, 55),
      anchor("center"),
      fixed(),
      color(150, 220, 255),
      opacity(0.8),
      z(100),
    ]);
  });
}