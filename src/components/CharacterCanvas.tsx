import React, { useEffect, useRef } from 'react';
import { ArmorEquipment } from '../game/engine';
import { ARMOR_DEFENSE } from '../game/constants';

interface CharacterCanvasProps {
  armor: ArmorEquipment;
  rotation?: number; // 0 to 360 degrees
  className?: string;
}

export const CharacterCanvas: React.FC<CharacterCanvasProps> = ({
  armor,
  rotation = 0,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingEnabled = false;

    // Scale & center Steve
    const cx = canvas.width / 2;
    const cy = 20;

    // Material colors for armor rendering
    const getArmorColors = (pieceId: string | null) => {
      if (!pieceId) return null;
      const config = ARMOR_DEFENSE[pieceId];
      if (!config) return null;
      switch (config.material) {
        case 'leather':
          return { main: '#7b4421', highlight: '#9c5b2f', dark: '#522b11' };
        case 'copper':
          return { main: '#c8683e', highlight: '#df7e53', dark: '#914322' };
        case 'iron':
          return { main: '#d5d5d5', highlight: '#f0f0f0', dark: '#9e9e9e' };
        case 'gold':
          return { main: '#f3ca3e', highlight: '#ffea78', dark: '#b8941f' };
        case 'titanium':
          return { main: '#8fa0aa', highlight: '#c8d6dd', dark: '#52626c' };
        case 'diamond':
          return { main: '#4dedf4', highlight: '#94ffff', dark: '#24a1a7' };
        default:
          return null;
      }
    };

    const helmetColors = getArmorColors(armor.helmet);
    const chestColors = getArmorColors(armor.chestplate);
    const legsColors = getArmorColors(armor.leggings);
    const bootsColors = getArmorColors(armor.boots);

    // Dynamic rotation offset for 3D effect
    const rotRad = (rotation * Math.PI) / 180;
    const sway = Math.sin(rotRad) * 4;

    ctx.save();
    ctx.translate(cx, cy);

    // 1. Shadow underneath
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    ctx.ellipse(0, 155, 30, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Head (32x32 px)
    const headX = -16 + sway;
    const headY = 4;
    // Base Skin Face
    ctx.fillStyle = '#d9a07a';
    ctx.fillRect(headX, headY, 32, 32);
    // Hair
    ctx.fillStyle = '#4a2e18';
    ctx.fillRect(headX, headY, 32, 10);
    ctx.fillRect(headX, headY + 10, 6, 8);
    ctx.fillRect(headX + 26, headY + 10, 6, 8);
    // Eyes
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(headX + 6, headY + 14, 6, 4);
    ctx.fillRect(headX + 20, headY + 14, 6, 4);
    ctx.fillStyle = '#3461c9';
    ctx.fillRect(headX + 10, headY + 14, 4, 4);
    ctx.fillRect(headX + 20, headY + 14, 4, 4);
    // Nose
    ctx.fillStyle = '#c58b68';
    ctx.fillRect(headX + 14, headY + 18, 4, 4);
    // Beard / Mouth
    ctx.fillStyle = '#6b4226';
    ctx.fillRect(headX + 12, headY + 24, 8, 4);
    ctx.fillRect(headX + 10, headY + 26, 12, 2);

    // HELMET OVERLAY
    if (helmetColors) {
      ctx.fillStyle = helmetColors.main;
      // Helmet crown and brow
      ctx.fillRect(headX - 2, headY - 2, 36, 14);
      // Cheeks and neck guards
      ctx.fillRect(headX - 2, headY + 12, 6, 18);
      ctx.fillRect(headX + 28, headY + 12, 6, 18);
      // Visor brow highlight
      ctx.fillStyle = helmetColors.highlight;
      ctx.fillRect(headX - 2, headY - 2, 36, 3);
      ctx.fillRect(headX + 12, headY + 6, 8, 4);
      // Dark border details
      ctx.fillStyle = helmetColors.dark;
      ctx.fillRect(headX - 2, headY + 10, 36, 2);
    }

    // 3. Torso (32x48 px)
    const torsoX = -16;
    const torsoY = 38;
    // Base Cyan Shirt
    ctx.fillStyle = '#00a8a8';
    ctx.fillRect(torsoX, torsoY, 32, 48);
    // Shirt neck opening
    ctx.fillStyle = '#d9a07a';
    ctx.fillRect(torsoX + 12, torsoY, 8, 6);

    // CHESTPLATE TORSO OVERLAY
    if (chestColors) {
      ctx.fillStyle = chestColors.main;
      ctx.fillRect(torsoX - 2, torsoY - 1, 36, 50);
      ctx.fillStyle = chestColors.highlight;
      ctx.fillRect(torsoX, torsoY + 2, 32, 4);
      ctx.fillRect(torsoX + 12, torsoY + 10, 8, 18);
      ctx.fillStyle = chestColors.dark;
      ctx.fillRect(torsoX - 2, torsoY + 46, 36, 3);
    }

    // 4. Left Arm (12x48 px)
    const armLX = -30;
    const armLY = 38;
    ctx.fillStyle = '#00a8a8';
    ctx.fillRect(armLX, armLY, 12, 20); // sleeve
    ctx.fillStyle = '#d9a07a';
    ctx.fillRect(armLX, armLY + 20, 12, 28); // skin

    // Left Arm Armor
    if (chestColors) {
      ctx.fillStyle = chestColors.main;
      ctx.fillRect(armLX - 2, armLY - 2, 16, 26);
      ctx.fillStyle = chestColors.highlight;
      ctx.fillRect(armLX - 2, armLY - 2, 16, 4);
      ctx.fillStyle = chestColors.dark;
      ctx.fillRect(armLX - 2, armLY + 22, 16, 2);
    }

    // 5. Right Arm (12x48 px)
    const armRX = 18;
    const armRY = 38;
    ctx.fillStyle = '#00a8a8';
    ctx.fillRect(armRX, armRY, 12, 20); // sleeve
    ctx.fillStyle = '#d9a07a';
    ctx.fillRect(armRX, armRY + 20, 12, 28); // skin

    // Right Arm Armor
    if (chestColors) {
      ctx.fillStyle = chestColors.main;
      ctx.fillRect(armRX - 2, armRY - 2, 16, 26);
      ctx.fillStyle = chestColors.highlight;
      ctx.fillRect(armRX - 2, armRY - 2, 16, 4);
      ctx.fillStyle = chestColors.dark;
      ctx.fillRect(armRX - 2, armRY + 22, 16, 2);
    }

    // 6. Left Leg (14x56 px)
    const legLX = -15;
    const legLY = 86;
    // Base Blue Jeans
    ctx.fillStyle = '#2c3b7a';
    ctx.fillRect(legLX, legLY, 14, 56);
    // Base Shoe
    ctx.fillStyle = '#444444';
    ctx.fillRect(legLX, legLY + 46, 14, 10);

    // Left Leggings & Boots Armor
    if (legsColors) {
      ctx.fillStyle = legsColors.main;
      ctx.fillRect(legLX - 1, legLY, 16, 42);
      ctx.fillStyle = legsColors.highlight;
      ctx.fillRect(legLX - 1, legLY + 18, 16, 4); // knee pad
      ctx.fillStyle = legsColors.dark;
      ctx.fillRect(legLX - 1, legLY + 40, 16, 2);
    }
    if (bootsColors) {
      ctx.fillStyle = bootsColors.main;
      ctx.fillRect(legLX - 2, legLY + 40, 18, 16);
      ctx.fillStyle = bootsColors.highlight;
      ctx.fillRect(legLX - 2, legLY + 40, 18, 3);
      ctx.fillStyle = bootsColors.dark;
      ctx.fillRect(legLX - 2, legLY + 53, 18, 3);
    }

    // 7. Right Leg (14x56 px)
    const legRX = 1;
    const legRY = 86;
    // Base Blue Jeans
    ctx.fillStyle = '#2c3b7a';
    ctx.fillRect(legRX, legRY, 14, 56);
    // Base Shoe
    ctx.fillStyle = '#444444';
    ctx.fillRect(legRX, legRY + 46, 14, 10);

    // Right Leggings & Boots Armor
    if (legsColors) {
      ctx.fillStyle = legsColors.main;
      ctx.fillRect(legRX - 1, legLY, 16, 42);
      ctx.fillStyle = legsColors.highlight;
      ctx.fillRect(legRX - 1, legLY + 18, 16, 4); // knee pad
      ctx.fillStyle = legsColors.dark;
      ctx.fillRect(legRX - 1, legLY + 40, 16, 2);
    }
    if (bootsColors) {
      ctx.fillStyle = bootsColors.main;
      ctx.fillRect(legRX - 2, legLY + 40, 18, 16);
      ctx.fillStyle = bootsColors.highlight;
      ctx.fillRect(legRX - 2, legLY + 40, 18, 3);
      ctx.fillStyle = bootsColors.dark;
      ctx.fillRect(legRX - 2, legLY + 53, 18, 3);
    }

    ctx.restore();
  }, [armor, rotation]);

  return (
    <canvas
      ref={canvasRef}
      width={140}
      height={180}
      className={`pixelated drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)] ${className}`}
    />
  );
};
