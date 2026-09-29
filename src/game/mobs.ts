/**
 * Minecraft Web 3D - Blocky Mob Entities (Pigs, Sheep & Multi-Species Marine Fish)
 */
import * as THREE from 'three';
import { World } from './world';
import { BlockType } from './constants';
import { audio } from './audio';

export type MobType =
  | 'pig'
  | 'sheep'
  | 'fish'
  | 'fish_cod'
  | 'fish_salmon'
  | 'fish_tropical'
  | 'fish_clownfish'
  | 'fish_puffer'
  | 'fish_pufferfish'
  | 'fish_goldfish'
  | 'fish_blue_tang';

export function isFishMob(type: MobType): boolean {
  return type === 'fish' || type.startsWith('fish_');
}

// Helper: Procedural pixel canvas texture generator for high-detail mob skins
function createPixelTexture(drawFn: (ctx: CanvasRenderingContext2D) => void): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 16;
  canvas.height = 16;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  drawFn(ctx);
  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  return texture;
}

// Cached animal textures
const pigSkinTex = createPixelTexture((ctx) => {
  ctx.fillStyle = '#f39e94';
  ctx.fillRect(0, 0, 16, 16);
  // Subtle skin variations & shading
  const spots = ['#e88b81', '#f8b4ab', '#df7e74', '#f1a89f'];
  for (let x = 0; x < 16; x += 2) {
    for (let y = 0; y < 16; y += 2) {
      if ((x * 3 + y * 7) % 5 === 0) {
        ctx.fillStyle = spots[(x + y) % spots.length];
        ctx.fillRect(x, y, 2, 2);
      }
    }
  }
});

const pigSnoutTex = createPixelTexture((ctx) => {
  ctx.fillStyle = '#e07870';
  ctx.fillRect(0, 0, 16, 16);
  ctx.fillStyle = '#6e2824';
  ctx.fillRect(3, 5, 3, 6);
  ctx.fillRect(10, 5, 3, 6);
  ctx.fillStyle = '#f39e94';
  ctx.fillRect(0, 0, 16, 2);
});

const sheepWoolTex = createPixelTexture((ctx) => {
  ctx.fillStyle = '#f4f4f0';
  ctx.fillRect(0, 0, 16, 16);
  const woolShades = ['#e8e8e2', '#ffffff', '#dfdfd8', '#f8f8f6'];
  for (let x = 0; x < 16; x += 2) {
    for (let y = 0; y < 16; y += 2) {
      ctx.fillStyle = woolShades[(x * 7 + y * 13) % woolShades.length];
      ctx.fillRect(x, y, 2, 2);
    }
  }
  // Soft curl shadows
  ctx.fillStyle = '#d4d4cb';
  ctx.fillRect(2, 4, 2, 1);
  ctx.fillRect(8, 10, 2, 1);
  ctx.fillRect(12, 3, 2, 1);
});

const sheepSkinTex = createPixelTexture((ctx) => {
  ctx.fillStyle = '#dfbca2';
  ctx.fillRect(0, 0, 16, 16);
  ctx.fillStyle = '#cfab91';
  ctx.fillRect(0, 12, 16, 4);
  ctx.fillStyle = '#e8cbaf';
  ctx.fillRect(4, 2, 8, 4);
});

// Marine Fish Pixel-Art Textures (Authentic Minecraft aquatic species)
const fishCodTex = createPixelTexture((ctx) => {
  ctx.fillStyle = '#9e8170';
  ctx.fillRect(0, 0, 16, 16);
  ctx.fillStyle = '#baa08f';
  ctx.fillRect(0, 4, 16, 6);
  ctx.fillStyle = '#7a5f4f';
  ctx.fillRect(0, 12, 16, 4);
  // Scale texture
  ctx.fillStyle = '#b39582';
  for (let x = 2; x < 14; x += 3) {
    for (let y = 3; y < 13; y += 3) {
      ctx.fillRect(x, y, 2, 1);
    }
  }
});

const fishSalmonTex = createPixelTexture((ctx) => {
  ctx.fillStyle = '#c0392b';
  ctx.fillRect(0, 0, 16, 16);
  // Salmon green head stripe
  ctx.fillStyle = '#27ae60';
  ctx.fillRect(10, 0, 6, 16);
  ctx.fillStyle = '#e74c3c';
  ctx.fillRect(0, 4, 10, 8);
  ctx.fillStyle = '#962d22';
  ctx.fillRect(0, 12, 16, 4);
});

const fishTropicalTex = createPixelTexture((ctx) => {
  // Clownfish vibrant orange & clean white stripes
  ctx.fillStyle = '#e67e22';
  ctx.fillRect(0, 0, 16, 16);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(4, 0, 3, 16);
  ctx.fillRect(11, 0, 3, 16);
  ctx.fillStyle = '#2c3e50';
  ctx.fillRect(3, 0, 1, 16);
  ctx.fillRect(7, 0, 1, 16);
  ctx.fillRect(10, 0, 1, 16);
  ctx.fillRect(14, 0, 1, 16);
});

const fishPufferTex = createPixelTexture((ctx) => {
  ctx.fillStyle = '#f1c40f';
  ctx.fillRect(0, 0, 16, 16);
  ctx.fillStyle = '#e67e22';
  ctx.fillRect(0, 10, 16, 6);
  // Spots & spikes markings
  ctx.fillStyle = '#d35400';
  ctx.fillRect(2, 2, 2, 2);
  ctx.fillRect(8, 4, 2, 2);
  ctx.fillRect(12, 2, 2, 2);
  ctx.fillRect(5, 11, 2, 2);
});

export class Mob {
  public group: THREE.Group;
  public type: MobType;
  public position: THREE.Vector3;
  public velocity: THREE.Vector3 = new THREE.Vector3();
  public health: number = 10;
  public isDead: boolean = false;
  public onDeath?: (type: MobType, pos: THREE.Vector3) => void;
  public hurtTimer: number = 0; // Deterministic hurt flash timer (never breaks custom textures)

  private legs: THREE.Mesh[] = [];
  private head: THREE.Group;
  private tailFin: THREE.Group | null = null;
  private walkTime: number = 0;
  private changeDirTimer: number = 0;
  private moveDir: THREE.Vector3 = new THREE.Vector3();
  private isMoving: boolean = false;
  private world: World;
  private isInWater: boolean = false;
  private suffocateTimer: number = 0;

  constructor(type: MobType, startPos: THREE.Vector3, world: World, scene: THREE.Scene) {
    this.type = type;
    this.position = startPos.clone();
    this.world = world;
    this.group = new THREE.Group();
    this.head = new THREE.Group();

    this.buildModel();
    this.group.position.copy(this.position);
    scene.add(this.group);
  }

  private buildModel() {
    if (isFishMob(this.type)) {
      this.buildFishModel();
      return;
    }

    const isPig = this.type === 'pig';

    // Materials with authentic Minecraft palette & textures
    const pigSkinMat = new THREE.MeshLambertMaterial({ map: pigSkinTex });
    const pigSnoutMat = new THREE.MeshLambertMaterial({ map: pigSnoutTex });
    const pigNostrilMat = new THREE.MeshLambertMaterial({ color: 0x6e2824 });
    const pigHoofMat = new THREE.MeshLambertMaterial({ color: 0x5a2d24 });

    const sheepWoolMat = new THREE.MeshLambertMaterial({ map: sheepWoolTex });
    const sheepSkinMat = new THREE.MeshLambertMaterial({ map: sheepSkinTex });
    const sheepHoofMat = new THREE.MeshLambertMaterial({ color: 0x2b2b2b });

    // 1. Body
    if (isPig) {
      const bodyGeo = new THREE.BoxGeometry(0.78, 0.58, 1.08);
      const bodyMesh = new THREE.Mesh(bodyGeo, pigSkinMat);
      bodyMesh.position.y = 0.65;
      this.group.add(bodyMesh);

      // Tail
      const tailGeo = new THREE.BoxGeometry(0.06, 0.06, 0.12);
      const tailMesh = new THREE.Mesh(tailGeo, pigSnoutMat);
      tailMesh.position.set(0, 0.75, -0.58);
      this.group.add(tailMesh);
    } else {
      // Sheep fluffy wool body
      const woolGeo = new THREE.BoxGeometry(0.86, 0.68, 1.16);
      const woolMesh = new THREE.Mesh(woolGeo, sheepWoolMat);
      woolMesh.position.y = 0.65;
      this.group.add(woolMesh);
    }

    // 2. Head
    const headGeo = new THREE.BoxGeometry(0.48, 0.48, 0.48);
    const headMesh = new THREE.Mesh(headGeo, isPig ? pigSkinMat : sheepSkinMat);
    headMesh.position.set(0, 0, 0);
    this.head.add(headMesh);

    if (isPig) {
      // Snout block
      const snoutGeo = new THREE.BoxGeometry(0.26, 0.16, 0.12);
      const snoutMesh = new THREE.Mesh(snoutGeo, pigSnoutMat);
      snoutMesh.position.set(0, -0.09, 0.28);
      this.head.add(snoutMesh);

      // Nostrils
      const nostrilL = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.05, 0.02), pigNostrilMat);
      nostrilL.position.set(-0.06, -0.09, 0.35);
      const nostrilR = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.05, 0.02), pigNostrilMat);
      nostrilR.position.set(0.06, -0.09, 0.35);
      this.head.add(nostrilL);
      this.head.add(nostrilR);

      // Floppy pig ears
      const earL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.12, 0.06), pigSnoutMat);
      earL.position.set(-0.24, 0.18, 0.08);
      earL.rotation.z = -0.3;
      const earR = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.12, 0.06), pigSnoutMat);
      earR.position.set(0.24, 0.18, 0.08);
      earR.rotation.z = 0.3;
      this.head.add(earL);
      this.head.add(earR);
    } else {
      // Sheep wool cap on top of head
      const woolCapGeo = new THREE.BoxGeometry(0.52, 0.22, 0.52);
      const woolCapMesh = new THREE.Mesh(woolCapGeo, sheepWoolMat);
      woolCapMesh.position.set(0, 0.16, 0);
      this.head.add(woolCapMesh);

      // Sheep ears
      const earL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.06, 0.08), sheepSkinMat);
      earL.position.set(-0.28, 0.06, 0.02);
      const earR = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.06, 0.08), sheepSkinMat);
      earR.position.set(0.28, 0.06, 0.02);
      this.head.add(earL);
      this.head.add(earR);
    }

    // Eyes with white sclera & dark pupils
    const eyeWhiteGeo = new THREE.BoxGeometry(0.08, 0.06, 0.02);
    const eyeWhiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const eyePupilGeo = new THREE.BoxGeometry(0.04, 0.06, 0.03);
    const eyePupilMat = new THREE.MeshBasicMaterial({ color: 0x111111 });

    const eyeLeftWhite = new THREE.Mesh(eyeWhiteGeo, eyeWhiteMat);
    eyeLeftWhite.position.set(-0.16, 0.05, 0.25);
    const eyeLeftPupil = new THREE.Mesh(eyePupilGeo, eyePupilMat);
    eyeLeftPupil.position.set(-0.18, 0.05, 0.255);

    const eyeRightWhite = new THREE.Mesh(eyeWhiteGeo, eyeWhiteMat);
    eyeRightWhite.position.set(0.16, 0.05, 0.25);
    const eyeRightPupil = new THREE.Mesh(eyePupilGeo, eyePupilMat);
    eyeRightPupil.position.set(0.18, 0.05, 0.255);

    this.head.add(eyeLeftWhite);
    this.head.add(eyeLeftPupil);
    this.head.add(eyeRightWhite);
    this.head.add(eyeRightPupil);

    this.head.position.set(0, 0.85, 0.65);
    this.group.add(this.head);

    // 3. Four Legs with hooves
    const legGeo = new THREE.BoxGeometry(0.2, 0.36, 0.2);
    const hoofGeo = new THREE.BoxGeometry(0.2, 0.09, 0.2);
    const legPositions = [
      [-0.25, 0.27, 0.35],
      [0.25, 0.27, 0.35],
      [-0.25, 0.27, -0.35],
      [0.25, 0.27, -0.35],
    ];

    for (let i = 0; i < 4; i++) {
      const legGroup = new THREE.Group();
      legGroup.position.set(legPositions[i][0], legPositions[i][1], legPositions[i][2]);

      const legMesh = new THREE.Mesh(legGeo, isPig ? pigSkinMat : sheepSkinMat);
      legMesh.position.y = 0;
      legGroup.add(legMesh);

      const hoofMesh = new THREE.Mesh(hoofGeo, isPig ? pigHoofMat : sheepHoofMat);
      hoofMesh.position.y = -0.18;
      legGroup.add(hoofMesh);

      this.group.add(legGroup);
      this.legs.push(legGroup as unknown as THREE.Mesh);
    }

    this.group.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  }

  private buildFishModel() {
    let fishTex = fishCodTex;
    let finColor = 0xbcaaa4;
    let isPuffer = false;

    if (this.type === 'fish_salmon') {
      fishTex = fishSalmonTex;
      finColor = 0xff7675;
    } else if (this.type === 'fish_clownfish' || this.type === 'fish_tropical') {
      fishTex = fishTropicalTex;
      finColor = 0xf39c12;
    } else if (this.type === 'fish_pufferfish' || this.type === 'fish_puffer') {
      fishTex = fishPufferTex;
      finColor = 0xe67e22;
      isPuffer = true;
    } else if (this.type === 'fish_goldfish') {
      fishTex = fishPufferTex;
      finColor = 0xffdd59;
    } else if (this.type === 'fish_blue_tang') {
      fishTex = fishTropicalTex;
      finColor = 0xf1c40f;
    }

    const fishMat = new THREE.MeshLambertMaterial({ map: fishTex });
    const finMat = new THREE.MeshLambertMaterial({ color: finColor });
    const eyeMat = new THREE.MeshLambertMaterial({ color: 0x0f172a });

    if (isPuffer) {
      // Pufferfish: boxy plump body with spikes
      const bodyGeo = new THREE.BoxGeometry(0.38, 0.38, 0.44);
      const bodyMesh = new THREE.Mesh(bodyGeo, fishMat);
      bodyMesh.position.y = 0.2;
      this.group.add(bodyMesh);

      // Spikes
      const spikeGeo = new THREE.BoxGeometry(0.08, 0.08, 0.08);
      const topSpike = new THREE.Mesh(spikeGeo, finMat);
      topSpike.position.set(0, 0.42, 0);
      this.group.add(topSpike);

      const botSpike = new THREE.Mesh(spikeGeo, finMat);
      botSpike.position.set(0, -0.02, 0);
      this.group.add(botSpike);

      const leftSpike = new THREE.Mesh(spikeGeo, finMat);
      leftSpike.position.set(-0.22, 0.2, 0);
      this.group.add(leftSpike);

      const rightSpike = new THREE.Mesh(spikeGeo, finMat);
      rightSpike.position.set(0.22, 0.2, 0);
      this.group.add(rightSpike);

      // Tail
      this.tailFin = new THREE.Group();
      this.tailFin.position.set(0, 0.2, -0.22);
      const tailGeo = new THREE.BoxGeometry(0.04, 0.24, 0.18);
      const tailMesh = new THREE.Mesh(tailGeo, finMat);
      tailMesh.position.set(0, 0, -0.09);
      this.tailFin.add(tailMesh);
      this.group.add(this.tailFin);

      // Eyes
      const eyeGeo = new THREE.BoxGeometry(0.06, 0.06, 0.06);
      const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
      eyeL.position.set(-0.16, 0.25, 0.18);
      const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
      eyeR.position.set(0.16, 0.25, 0.18);
      this.group.add(eyeL);
      this.group.add(eyeR);
    } else {
      // Fish body: upright vertical fish body (width X: 0.18, height Y: 0.32, length Z: 0.68)
      const bodyGeo = new THREE.BoxGeometry(0.18, 0.32, 0.68);
      const bodyMesh = new THREE.Mesh(bodyGeo, fishMat);
      bodyMesh.position.y = 0.2;
      this.group.add(bodyMesh);

      // Dorsal Fin on TOP of back
      const dorsalGeo = new THREE.BoxGeometry(0.04, 0.18, 0.32);
      const dorsalMesh = new THREE.Mesh(dorsalGeo, finMat);
      dorsalMesh.position.set(0, 0.42, -0.05);
      this.group.add(dorsalMesh);

      // Pectoral Fins (side fins)
      const finL = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.04, 0.18), finMat);
      finL.position.set(-0.13, 0.15, 0.12);
      finL.rotation.z = -0.3;
      this.group.add(finL);

      const finR = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.04, 0.18), finMat);
      finR.position.set(0.13, 0.15, 0.12);
      finR.rotation.z = 0.3;
      this.group.add(finR);

      // Animated Tail Fin (wags horizontally left-to-right)
      this.tailFin = new THREE.Group();
      this.tailFin.position.set(0, 0.2, -0.34);
      const tailGeo = new THREE.BoxGeometry(0.04, 0.34, 0.24);
      const tailMesh = new THREE.Mesh(tailGeo, finMat);
      tailMesh.position.set(0, 0, -0.12);
      this.tailFin.add(tailMesh);
      this.group.add(this.tailFin);

      // Eyes facing front-sides
      const eyeGeo = new THREE.BoxGeometry(0.04, 0.06, 0.06);
      const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
      eyeL.position.set(-0.1, 0.24, 0.26);
      const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
      eyeR.position.set(0.1, 0.24, 0.26);
      this.group.add(eyeL);
      this.group.add(eyeR);
    }

    this.group.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  }

  public update(delta: number) {
    if (this.isDead) return;

    // Tick hurt damage flash without altering base textures
    if (this.hurtTimer > 0) {
      this.hurtTimer -= delta;
      if (this.hurtTimer <= 0) {
        this.group.traverse((child) => {
          if (child instanceof THREE.Mesh && child.material) {
            const mat = child.material as THREE.MeshLambertMaterial;
            if (mat.emissive) {
              mat.emissive.setHex(0x000000);
            }
          }
        });
      }
    }

    // Check water immersion
    const currentBlock = this.world.getBlock(
      Math.floor(this.position.x),
      Math.floor(this.position.y),
      Math.floor(this.position.z)
    );
    const footBlock = this.world.getBlock(
      Math.floor(this.position.x),
      Math.floor(this.position.y - 0.2),
      Math.floor(this.position.z)
    );
    this.isInWater = currentBlock === BlockType.WATER || footBlock === BlockType.WATER;

    if (isFishMob(this.type)) {
      this.updateFish(delta);
      return;
    }

    this.updateAnimal(delta);
  }

  private updateFish(delta: number) {
    if (this.isInWater) {
      this.suffocateTimer = 0;
      this.changeDirTimer -= delta;

      if (this.changeDirTimer <= 0) {
        this.changeDirTimer = 2.5 + Math.random() * 3.5;
        this.pickFishSwimDirection();
      }

      // Check obstacle ahead
      const nextX = this.position.x + this.moveDir.x * 1.8 * delta;
      const nextY = this.position.y + this.moveDir.y * 1.8 * delta;
      const nextZ = this.position.z + this.moveDir.z * 1.8 * delta;

      const targetBlock = this.world.getBlock(Math.floor(nextX), Math.floor(nextY), Math.floor(nextZ));
      if (targetBlock === BlockType.WATER) {
        this.position.x = nextX;
        this.position.y = nextY;
        this.position.z = nextZ;
      } else {
        // Obstacle hit -> reverse/steer
        this.pickFishSwimDirection();
      }

      // Smooth rotation towards swim direction (upright body with dorsal fin always pointing up)
      const targetAngle = Math.atan2(this.moveDir.x, this.moveDir.z);
      this.group.rotation.y = THREE.MathUtils.lerp(this.group.rotation.y, targetAngle, delta * 5.0);
      this.group.rotation.x = THREE.MathUtils.lerp(this.group.rotation.x, -this.moveDir.y * 0.40, delta * 5.0);
      this.group.rotation.z = 0; // Always upright, never swimming on side!

      // Wag tail fin horizontally left to right
      if (this.tailFin) {
        this.tailFin.rotation.y = Math.sin(performance.now() * 0.015) * 0.65;
      }
    } else {
      // Stranded on land! Flop around and apply gravity
      this.velocity.y -= 18 * delta;
      this.position.y += this.velocity.y * delta;
      this.position.x += this.velocity.x * delta;
      this.position.z += this.velocity.z * delta;
      this.velocity.x *= 0.9;
      this.velocity.z *= 0.9;

      const floorY = Math.floor(this.position.y);
      const below = this.world.getBlock(Math.floor(this.position.x), floorY, Math.floor(this.position.z));
      if (below !== BlockType.AIR && below !== BlockType.WATER) {
        this.position.y = floorY + 1;
        this.velocity.y = 2.8 + Math.random() * 2.0; // Flop jump
        this.velocity.x = (Math.random() - 0.5) * 2.0;
        this.velocity.z = (Math.random() - 0.5) * 2.0;
        this.group.rotation.z = Math.PI / 2; // Lie on side when flopping on land
      }

      if (this.tailFin) {
        this.tailFin.rotation.y = Math.sin(performance.now() * 0.025) * 1.0;
      }

      this.suffocateTimer += delta;
      if (this.suffocateTimer > 8.0) {
        this.takeDamage(2);
        this.suffocateTimer = 0;
      }
    }

    this.group.position.copy(this.position);
  }

  private pickFishSwimDirection() {
    // Probe 8 directions to find clear water
    const angles = [0, Math.PI / 4, Math.PI / 2, (3 * Math.PI) / 4, Math.PI, -(3 * Math.PI) / 4, -Math.PI / 2, -Math.PI / 4];
    const candidateDirs: THREE.Vector3[] = [];

    for (const angle of angles) {
      for (const pitch of [-0.25, 0, 0.25]) {
        const dir = new THREE.Vector3(
          Math.sin(angle) * Math.cos(pitch),
          pitch,
          Math.cos(angle) * Math.cos(pitch)
        ).normalize();
        const testX = Math.floor(this.position.x + dir.x * 2.0);
        const testY = Math.floor(this.position.y + dir.y * 2.0);
        const testZ = Math.floor(this.position.z + dir.z * 2.0);
        if (this.world.getBlock(testX, testY, testZ) === BlockType.WATER) {
          candidateDirs.push(dir);
        }
      }
    }

    if (candidateDirs.length > 0) {
      const chosen = candidateDirs[Math.floor(Math.random() * candidateDirs.length)];
      this.moveDir.copy(chosen);
    } else {
      const angle = Math.random() * Math.PI * 2;
      this.moveDir.set(Math.sin(angle), (Math.random() - 0.5) * 0.4, Math.cos(angle)).normalize();
    }
  }

  private updateAnimal(delta: number) {
    this.changeDirTimer -= delta;
    if (this.changeDirTimer <= 0) {
      this.changeDirTimer = 2.0 + Math.random() * 3.5;
      this.isMoving = Math.random() > 0.35;
      if (this.isMoving) {
        const angle = Math.random() * Math.PI * 2;
        this.moveDir.set(Math.sin(angle), 0, Math.cos(angle)).normalize();
        this.group.rotation.y = angle;
      }
    }

    // Apply knockback / horizontal momentum decay
    this.position.x += this.velocity.x * delta;
    this.position.z += this.velocity.z * delta;
    this.velocity.x *= 0.88;
    this.velocity.z *= 0.88;

    // Animal in water: Natural buoyancy (smoothly floats atop water)
    if (this.isInWater) {
      const blockAbove = this.world.getBlock(
        Math.floor(this.position.x),
        Math.floor(this.position.y + 0.6),
        Math.floor(this.position.z)
      );

      if (blockAbove === BlockType.WATER) {
        // Submerged -> float up vigorously to surface
        this.velocity.y = Math.min(4.5, this.velocity.y + 22.0 * delta);
        this.position.y += this.velocity.y * delta;
      } else {
        // Floating on water surface: smooth buoyant surface equilibrium with gentle bobbing
        const surfaceTarget = Math.floor(this.position.y) + 0.42 + Math.sin(performance.now() * 0.005 + this.position.x) * 0.04;
        this.position.y = THREE.MathUtils.lerp(this.position.y, surfaceTarget, delta * 7.0);
        this.velocity.y = 0;
      }

      // Realistic animal swimming pose: head tilted comfortably above water
      this.head.rotation.x = -0.28;

      // Rapid dog-paddle swimming leg animation in water
      this.walkTime += delta * 12;
      const legAngle = Math.sin(this.walkTime) * 0.50;
      if (this.legs.length === 4) {
        this.legs[0].rotation.x = legAngle;
        this.legs[1].rotation.x = -legAngle;
        this.legs[2].rotation.x = -legAngle * 0.7;
        this.legs[3].rotation.x = legAngle * 0.7;
      }

      // Smooth surface swimming navigation in water
      if (this.isMoving) {
        const swimSpeed = 1.1;
        this.position.x += this.moveDir.x * swimSpeed * delta;
        this.position.z += this.moveDir.z * swimSpeed * delta;
      }
    } else {
      // Land head reset
      this.head.rotation.x = 0;

      // Land gravity
      this.velocity.y -= 22 * delta;
      this.position.y += this.velocity.y * delta;

      // Floor collision
      const floorY = Math.floor(this.position.y);
      const blockBelow = this.world.getBlock(
        Math.floor(this.position.x),
        floorY,
        Math.floor(this.position.z)
      );

      if (blockBelow !== BlockType.AIR && blockBelow !== BlockType.WATER) {
        this.position.y = floorY + 1;
        this.velocity.y = 0;
      }

      // Movement on land
      if (this.isMoving) {
        const speed = 1.3;
        const nextX = this.position.x + this.moveDir.x * speed * delta;
        const nextZ = this.position.z + this.moveDir.z * speed * delta;

        const blockAhead = this.world.getBlock(
          Math.floor(nextX),
          Math.floor(this.position.y + 0.3),
          Math.floor(nextZ)
        );

        if (blockAhead === BlockType.AIR || blockAhead === BlockType.WATER) {
          this.position.x = nextX;
          this.position.z = nextZ;
        } else {
          // Try jumping or turn away
          const blockAbove = this.world.getBlock(
            Math.floor(nextX),
            Math.floor(this.position.y + 1.3),
            Math.floor(nextZ)
          );
          if (blockAbove === BlockType.AIR) {
            this.velocity.y = 5.2; // Hop over 1 block
            this.position.x = nextX;
            this.position.z = nextZ;
          } else {
            this.changeDirTimer = 0; // Turn around
          }
        }

        // Leg swinging animation
        this.walkTime += delta * 7;
        const legAngle = Math.sin(this.walkTime) * 0.45;
        if (this.legs.length === 4) {
          this.legs[0].rotation.x = legAngle;
          this.legs[1].rotation.x = -legAngle;
          this.legs[2].rotation.x = -legAngle;
          this.legs[3].rotation.x = legAngle;
        }
      } else {
        // Idle legs
        this.legs.forEach((l) => (l.rotation.x = 0));
      }
    }

    this.group.position.copy(this.position);
  }

  // Take damage and apply authentic knockback push away from attacker
  public takeDamage(amount: number, attackerPos?: THREE.Vector3, knockbackForce: number = 7.0): boolean {
    this.health -= amount;
    audio.playHurt();

    // Apply Knockback push away from attacker
    if (attackerPos) {
      const dx = this.position.x - attackerPos.x;
      const dz = this.position.z - attackerPos.z;
      const dist = Math.hypot(dx, dz) || 1;
      this.velocity.x = (dx / dist) * knockbackForce;
      this.velocity.z = (dz / dist) * knockbackForce;
      this.velocity.y = 4.2; // Slight upward pop
    }

    // Authentic Minecraft red damage flash using emissive overlay (preserves textures perfectly)
    this.hurtTimer = 0.22;
    this.group.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        const mat = child.material as THREE.MeshLambertMaterial;
        if (mat.emissive) {
          mat.emissive.setHex(0xbb1111);
        }
      }
    });

    if (this.health <= 0) {
      this.die();
      return true;
    }
    return false;
  }

  public die() {
    this.isDead = true;
    if (this.onDeath) {
      this.onDeath(this.type, this.position.clone());
    }
    // Tumble over
    this.group.rotation.z = Math.PI / 2;
    setTimeout(() => {
      if (this.group.parent) {
        this.group.parent.remove(this.group);
      }
    }, 400);
  }
}
