// doubleSlit.js 

// ======================================== GAME MODULE TEMPLATE ========================================
// Copy this file to create a new mini-game!
// 1. Rename the file (e.g., myGame.js)
// 2. Update the scene name and function name
// 3. Import and register in main.js
// 4. Update the sceneName in menu.js to match

import { CONSTANTS, showMobileControls, hideMobileControls, virtualKeys } from './main.js';

export function createMyGameScene() {
  scene("my-game", () => {
    
    // Show mobile controls if this game needs them
    showMobileControls();
    
    // ======================================== CONSTANTS ========================================
    const LEVEL_WIDTH = CONSTANTS.VIRTUAL_W;
    const LEVEL_HEIGHT = CONSTANTS.VIRTUAL_H;
    
    // ======================================== PLAYER SETUP ========================================
    const player = add([
      sprite("niels", { frame: 11 }),
      pos(LEVEL_WIDTH / 2, LEVEL_HEIGHT - 100),
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
      },
      "player"
    ]);
    
    // ======================================== GAME OBJECTS ========================================
    // Add your platforms, enemies, collectibles, etc. here
    
    add([
      rect(LEVEL_WIDTH, 40),
      pos(0, LEVEL_HEIGHT - 40),
      area(),
      body({ isStatic: true }),
      color(50, 50, 70),
      "ground"
    ]);
    
    // ======================================== CONTROLS ========================================
    player.onUpdate(() => {
      player.isMoving = false;
      
      // Support both keyboard and virtual keys
      if (isKeyDown("left") || virtualKeys.left) {
        player.move(-CONSTANTS.MOVE_SPEED, 0);
        player.facingRight = false;
        player.isMoving = true;
      }
      
      if (isKeyDown("right") || virtualKeys.right) {
        player.move(CONSTANTS.MOVE_SPEED, 0);
        player.facingRight = true;
        player.isMoving = true;
      }
      
      // Update animation based on state
      if (player.isMoving && player.isGrounded()) {
        if (player.curAnim() !== "walk") {
          player.play("walk");
        }
      } else {
        if (player.curAnim() === "walk") {
          player.stop();
          player.use(sprite("niels", { frame: 11 }));
        }
      }
      
      player.flipX = !player.facingRight;
    });
    
    // Jump
    onKeyPress("space", () => {
      if (player.isGrounded()) {
        player.jump(CONSTANTS.JUMP_FORCE);
      }
    });
    
    // ======================================== GAME LOGIC ========================================
    // Add your game-specific logic here
    
    onUpdate(() => {
      // Update camera
      setCamPos(player.pos);
      
      // Win condition
      // if (player.pos.y < 100) {
      //   go("victory");
      // }
      
      // Lose condition
      // if (player.pos.y > LEVEL_HEIGHT + 100) {
      //   go("menu");
      // }
    });
    
    // ======================================== RETURN TO MENU ========================================
    onKeyPress("escape", () => {
      go("menu");
    });
    
    // Add UI hint
    add([
      text("ESC - Return to Menu", {
        size: 16,
        font: "monospace",
      }),
      pos(10, 10),
      fixed(),
      color(200, 200, 200),
      opacity(0.7),
      z(100),
    ]);
  });
}