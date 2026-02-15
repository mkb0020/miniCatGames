// ======================================== MENU.JS ========================================
import { CONSTANTS, hideMobileControls } from './main.js';

export function createMenuScene() {
  scene("menu", () => {
    hideMobileControls();

    const centerX = CONSTANTS.VIRTUAL_W / 2;
    const centerY = CONSTANTS.VIRTUAL_H / 2;

    // ======================================== TITLE ========================================
    add([
      text("CATastrophe2", {
        size: 48,
        font: "SpaceLetters",
      }),
      pos(centerX, 80),
      anchor("center"),
      color(255, 61, 170), 
      z(10),
    ]);

    add([
      text("Mini-Games", {
        size: 24,
        font: "SpaceLetters",
      }),
      pos(centerX, 130),
      anchor("center"),
      color(200, 200, 255),
      z(10),
    ]);

    // ======================================== GAME BUTTONS ========================================
    const buttonData = [
      { name: "Entanglement", scene: "entanglement", color: [255, 61, 170] },
      { name: "suPURR Fluid", scene: "supurr-fluid", color: [0, 200, 255] },
      { name: "Photo-Electric", scene: "photo-electric", color: [100, 255, 100] },
      { name: "Particle Accelerator", scene: "particle-accelerator", color: [255, 200, 50] },
      { name: "Double Slit", scene: "double-slit", color: [200, 100, 255] },
    ];

    const startY = 190;
    const spacing = 55;

    buttonData.forEach((btn, index) => {
      createMenuButton(
        centerX,
        startY + (index * spacing),
        btn.name,
        btn.scene,
        btn.color
      );
    });

    // ======================================== FOOTER ========================================
    add([
      text("Press M to toggle mobile controls", {
        size: 14,
        font: "SpaceLetters",
      }),
      pos(centerX, CONSTANTS.VIRTUAL_H - 30),
      anchor("center"),
      color(150, 150, 150),
      opacity(0.7),
      z(10),
    ]);
  });
}

// ======================================== BUTTON CREATION ========================================
function createMenuButton(x, y, label, sceneName, buttonColor) {
  const buttonWidth = 350;
  const buttonHeight = 45;
  const halfWidth = buttonWidth / 2;
  const halfHeight = buttonHeight / 2;

  const bg = add([
    rect(buttonWidth, buttonHeight, { radius: 8 }),
    pos(x, y),
    anchor("center"),
    color(30, 30, 50),
    outline(3, rgb(buttonColor[0], buttonColor[1], buttonColor[2])),
    z(5),
    area(),
    "menuButton",
    {
      label: label,
      sceneName: sceneName,
      buttonColor: buttonColor,
      isHovered: false,
    }
  ]);

  const txt = add([
    text(label, {
      size: 20,
      font: "SpaceLetters",
    }),
    pos(x, y),
    anchor("center"),
    color(255, 255, 255),
    z(6),
  ]);

  bg.onUpdate(() => {
    const mPos = mousePos();
    const isHovering = 
      mPos.x >= x - halfWidth &&
      mPos.x <= x + halfWidth &&
      mPos.y >= y - halfHeight &&
      mPos.y <= y + halfHeight;

    if (isHovering && !bg.isHovered) {
      bg.isHovered = true;
      bg.color = rgb(buttonColor[0] * 0.3, buttonColor[1] * 0.3, buttonColor[2] * 0.3);
      txt.color = rgb(buttonColor[0], buttonColor[1], buttonColor[2]);
      txt.scale = vec2(1.05, 1.05);
    } else if (!isHovering && bg.isHovered) {
      bg.isHovered = false;
      bg.color = rgb(30, 30, 50);
      txt.color = rgb(255, 255, 255);
      txt.scale = vec2(1, 1);
    }
  });

  bg.onClick(() => {
    if (sceneName === "entanglement" || 
        sceneName === "supurr-fluid" || 
        sceneName === "photo-electric" || 
        sceneName === "particle-accelerator" || 
        sceneName === "double-slit") {
      
      try {
        go(sceneName);
      } catch (error) {
        console.log(`Scene "${sceneName}" not implemented yet!`);
        
        const comingSoon = add([
          text(`${label}\nComing Soon!`, {
            size: 32,
            font: "SpaceLetters",
            align: "center",
          }),
          pos(CONSTANTS.VIRTUAL_W / 2, CONSTANTS.VIRTUAL_H / 2),
          anchor("center"),
          color(buttonColor[0], buttonColor[1], buttonColor[2]),
          opacity(0),
          z(999),
        ]);

        tween(
          0,
          1,
          0.3,
          (val) => comingSoon.opacity = val,
          easings.easeOutQuad
        ).then(() => {
          wait(1.5, () => {
            tween(
              1,
              0,
              0.3,
              (val) => comingSoon.opacity = val,
              easings.easeInQuad
            ).then(() => {
              destroy(comingSoon);
            });
          });
        });
      }
    }
  });

  add([
    text(`${label.charAt(0)}`, {
      size: 14,
      font: "SpaceLetters",
    }),
    pos(x - halfWidth + 15, y),
    anchor("center"),
    color(buttonColor[0], buttonColor[1], buttonColor[2]),
    opacity(0.5),
    z(6),
  ]);

  return bg;
}