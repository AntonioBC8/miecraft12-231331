/**
 * Minecraft Web 3D - Player Physics & Collision Engine
 */
import * as THREE from 'three';
import {
  BlockType,
  BLOCK_CONFIGS,
  GRAVITY,
  JUMP_VELOCITY,
  PLAYER_SPEED,
  SPRINT_SPEED,
  FLY_SPEED,
  PLAYER_HEIGHT,
  PLAYER_WIDTH,
  EYE_HEIGHT,
  Y_MIN,
  isDoor,
} from './constants';
import { World } from './world';
import { audio } from './audio';

export interface PlayerInput {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  jump: boolean;
  crouch: boolean;
  sprint: boolean;
  fly: boolean;
}

export class PlayerPhysics {
  public position: THREE.Vector3;
  public velocity: THREE.Vector3 = new THREE.Vector3();
  public onGround: boolean = false;
  public inWater: boolean = false;
  public headInWater: boolean = false;
  public inLava: boolean = false;
  public isFlying: boolean = false;
  public isSprinting: boolean = false;
  public fallStartY: number = 0;
  public isFalling: boolean = false;

  private world: World;
  private halfWidth: number = 0.28; // Player radius in X and Z
  private stepTimer: number = 0;
  private cactusTimer: number = 0;
  private lavaTimer: number = 0;

  constructor(world: World, startPos: THREE.Vector3) {
    this.world = world;
    this.position = startPos.clone();
    this.fallStartY = this.position.y;
  }

  public update(
    delta: number,
    input: PlayerInput,
    cameraYaw: number,
    onDamage?: (amount: number) => void,
    cameraPitch: number = 0
  ) {
    // 1. Water detection at feet & eyes (includes waterlogged underwater flora)
    const feetBlock = this.world.getBlock(
      Math.floor(this.position.x),
      Math.floor(this.position.y + 0.2),
      Math.floor(this.position.z)
    );
    const headBlock = this.world.getBlock(
      Math.floor(this.position.x),
      Math.floor(this.position.y + EYE_HEIGHT),
      Math.floor(this.position.z)
    );

    const isWaterBlock = (b: BlockType) =>
      b === BlockType.WATER ||
      b === BlockType.KELP ||
      b === BlockType.SEA_PICKLE;

    const prevInWater = this.inWater;
    this.inWater = isWaterBlock(feetBlock) || isWaterBlock(headBlock);
    this.headInWater = isWaterBlock(headBlock);

    this.inLava = feetBlock === BlockType.LAVA || headBlock === BlockType.LAVA;

    if (!prevInWater && this.inWater) {
      audio.playSplash();
    }

    // Lava burning damage
    if (this.inLava && onDamage) {
      this.lavaTimer += delta;
      if (this.lavaTimer > 0.4) {
        this.lavaTimer = 0;
        onDamage(8);
        audio.playHurt();
      }
    } else {
      this.lavaTimer = Math.max(0, this.lavaTimer - delta);
    }

    // Cactus prick damage
    const px = Math.floor(this.position.x);
    const py = Math.floor(this.position.y);
    const pz = Math.floor(this.position.z);
    const nearCactus =
      this.world.getBlock(px, py, pz) === BlockType.CACTUS ||
      this.world.getBlock(px + 1, py, pz) === BlockType.CACTUS ||
      this.world.getBlock(px - 1, py, pz) === BlockType.CACTUS ||
      this.world.getBlock(px, py, pz + 1) === BlockType.CACTUS ||
      this.world.getBlock(px, py, pz - 1) === BlockType.CACTUS;

    if (nearCactus && onDamage) {
      this.cactusTimer += delta;
      if (this.cactusTimer > 0.5) {
        this.cactusTimer = 0;
        onDamage(2);
        audio.playHurt();
      }
    } else {
      this.cactusTimer = Math.max(0, this.cactusTimer - delta);
    }

    // Creative Flight State
    if (input.fly && !this.isFlying) {
      this.isFlying = true;
      this.velocity.set(0, 0, 0);
    } else if (!input.fly && this.isFlying) {
      this.isFlying = false;
    }

    // Creative Flight Movement
    if (this.isFlying) {
      this.updateFlight(delta, input, cameraYaw);
      return;
    }

    // 2. Walking / Sprinting speed calculation
    this.isSprinting = input.sprint && input.forward;
    const speed = this.isSprinting ? SPRINT_SPEED : PLAYER_SPEED;

    // Movement direction vector relative to camera look angle
    const moveDir = new THREE.Vector3();
    if (input.forward) moveDir.z -= 1;
    if (input.backward) moveDir.z += 1;
    if (input.left) moveDir.x -= 1;
    if (input.right) moveDir.x += 1;

    if (this.inWater || this.inLava) {
      // Fluid drag and swimming inertia physics (viscous fluid physics)
      const baseFluidSpeed = this.inLava ? PLAYER_SPEED * 0.40 : PLAYER_SPEED * 0.70;
      const swimSpeed = this.isSprinting ? baseFluidSpeed * 1.35 : baseFluidSpeed;

      if (moveDir.lengthSq() > 0) {
        moveDir.normalize();
        moveDir.applyAxisAngle(new THREE.Vector3(0, 1, 0), cameraYaw);
        this.velocity.x += (moveDir.x * swimSpeed - this.velocity.x) * 6.0 * delta;
        this.velocity.z += (moveDir.z * swimSpeed - this.velocity.z) * 6.0 * delta;

        this.stepTimer += delta * (this.isSprinting ? 1.6 : 1.1);
        if (this.stepTimer > 0.42) {
          this.stepTimer = 0;
          audio.playStep(this.inLava ? BlockType.LAVA : BlockType.WATER);
        }
      } else {
        // Fluid drag smoothly dampens horizontal movement
        this.velocity.x *= Math.pow(0.12, delta);
        this.velocity.z *= Math.pow(0.12, delta);
      }

      // Minecraft Flowing Current Push: water/lava pushes player along downstream slope!
      const curWx = Math.floor(this.position.x);
      const curWy = Math.floor(this.position.y + 0.2);
      const curWz = Math.floor(this.position.z);
      const flow = this.world.getFluidFlowDirection(curWx, curWy, curWz);
      if (flow.lengthSq() > 0.001) {
        const pushForce = this.inLava ? 1.8 : 3.0;
        this.velocity.x += flow.x * pushForce * delta;
        this.velocity.z += flow.y * pushForce * delta;
      }
    } else if (moveDir.lengthSq() > 0) {
      moveDir.normalize();
      moveDir.applyAxisAngle(new THREE.Vector3(0, 1, 0), cameraYaw);
      this.velocity.x = moveDir.x * speed;
      this.velocity.z = moveDir.z * speed;

      // Footstep audio
      if (this.onGround) {
        this.stepTimer += delta * (this.isSprinting ? 1.6 : 1.0);
        if (this.stepTimer > 0.36) {
          this.stepTimer = 0;
          const standingOnBlock = this.world.getBlock(
            Math.floor(this.position.x),
            Math.floor(this.position.y - 0.2),
            Math.floor(this.position.z)
          );
          audio.playStep(standingOnBlock);
        }
      }
    } else {
      this.velocity.x = 0;
      this.velocity.z = 0;
    }

    // 3. Vertical physics (Buoyancy, Submerging/Diving, Swimming, Jumping in viscous fluid)
    if (this.inWater) {
      this.isFalling = false;
      this.fallStartY = this.position.y;

      const swimSpeed = this.isSprinting ? PLAYER_SPEED * 1.15 : PLAYER_SPEED * 0.70;

      if (input.jump) {
        // Swimming up / breaching water surface onto shore
        if (!this.headInWater) {
          this.velocity.y = 5.2; // Jump breach onto land!
        } else {
          this.velocity.y = 3.2; // Viscous swim upward
        }
      } else if (input.crouch) {
        // Explicit dive down
        this.velocity.y = -2.8;
      } else if (input.forward && Math.abs(cameraPitch) > 0.15) {
        // Directional diving based on camera look angle (look down = dive down, look up = swim up)
        const verticalSwim = Math.sin(cameraPitch) * swimSpeed * 0.85;
        this.velocity.y += (verticalSwim - this.velocity.y) * 5.0 * delta;
      } else {
        // Viscous buoyancy: comfortable exploration underwater
        if (this.headInWater) {
          this.velocity.y *= Math.pow(0.18, delta);
          this.velocity.y -= 0.15 * delta;
        } else {
          // Floating at water surface with gentle bobbing
          const targetBob = Math.sin(Date.now() * 0.0035) * 0.15;
          this.velocity.y += (targetBob - this.velocity.y) * 5.0 * delta;
        }
      }
      this.onGround = false;
    } else {
      if (input.jump && this.onGround) {
        this.velocity.y = JUMP_VELOCITY;
        this.onGround = false;
        this.fallStartY = this.position.y;
        this.isFalling = false;
      } else if (!this.onGround) {
        this.velocity.y -= GRAVITY * delta;
        if (this.velocity.y < 0 && !this.isFalling) {
          this.isFalling = true;
          this.fallStartY = this.position.y;
        }
      }
    }

    // 4. Horizontal movement with auto step-up (smoothly step onto shores, beaches & block steps)
    const dispX = this.velocity.x * delta;
    const dispZ = this.velocity.z * delta;

    if (dispX !== 0) {
      this.position.x += dispX;
      if (this.checkCollision()) {
        // Try step up: 1.05 blocks when in water (seamless beach/riverbank exit), 0.6 on land
        let stepped = false;
        if (this.onGround || this.inWater) {
          const stepHeight = this.inWater ? 1.05 : 0.6;
          this.position.y += stepHeight;
          if (!this.checkCollision()) {
            stepped = true;
          } else {
            this.position.y -= stepHeight;
          }
        }
        if (!stepped) {
          this.position.x -= dispX;
          this.velocity.x = 0;
        }
      }
    }

    if (dispZ !== 0) {
      this.position.z += dispZ;
      if (this.checkCollision()) {
        let stepped = false;
        if (this.onGround || this.inWater) {
          const stepHeight = this.inWater ? 1.05 : 0.6;
          this.position.y += stepHeight;
          if (!this.checkCollision()) {
            stepped = true;
          } else {
            this.position.y -= stepHeight;
          }
        }
        if (!stepped) {
          this.position.z -= dispZ;
          this.velocity.z = 0;
        }
      }
    }

    // 5. Vertical movement resolution
    const dispY = this.velocity.y * delta;

    if (dispY < 0) {
      // Falling down
      const targetY = this.position.y + dispY;
      const minX = Math.floor(this.position.x - this.halfWidth + 0.05);
      const maxX = Math.floor(this.position.x + this.halfWidth - 0.05);
      const minZ = Math.floor(this.position.z - this.halfWidth + 0.05);
      const maxZ = Math.floor(this.position.z + this.halfWidth - 0.05);
      const floorY = Math.floor(targetY);

      let landed = false;
      let highestFloor = -Infinity;

      for (let x = minX; x <= maxX; x++) {
        for (let z = minZ; z <= maxZ; z++) {
          const block = this.world.getBlock(x, floorY, z);
          if (block === BlockType.LILY_PAD) {
            landed = true;
            highestFloor = Math.max(highestFloor, floorY + 1.0);
          } else if (block !== BlockType.AIR && BLOCK_CONFIGS[block].solid) {
            if (isDoor(block) && this.world.isDoorOpen(x, floorY, z)) {
              continue;
            }
            landed = true;
            highestFloor = Math.max(highestFloor, floorY + 1.0);
          }
        }
      }

      if (landed) {
        this.position.y = highestFloor;
        this.velocity.y = 0;
        this.onGround = true;

        if (this.isFalling && !this.inWater && onDamage) {
          const fallDist = this.fallStartY - this.position.y;
          if (fallDist > 4.0) {
            const dmg = Math.floor((fallDist - 3.5) * 12);
            if (dmg > 0) {
              onDamage(dmg);
              audio.playHurt();
            }
          }
        }
        this.isFalling = false;
        this.fallStartY = this.position.y;
      } else {
        this.position.y = targetY;
        this.onGround = false;
      }
    } else if (dispY > 0) {
      // Jumping / moving up
      const targetY = this.position.y + dispY;
      const minX = Math.floor(this.position.x - this.halfWidth + 0.05);
      const maxX = Math.floor(this.position.x + this.halfWidth - 0.05);
      const minZ = Math.floor(this.position.z - this.halfWidth + 0.05);
      const maxZ = Math.floor(this.position.z + this.halfWidth - 0.05);
      const ceilY = Math.floor(targetY + PLAYER_HEIGHT);

      let hitCeil = false;
      for (let x = minX; x <= maxX; x++) {
        for (let z = minZ; z <= maxZ; z++) {
          const block = this.world.getBlock(x, ceilY, z);
          if (block !== BlockType.AIR && BLOCK_CONFIGS[block].solid) {
            hitCeil = true;
            break;
          }
        }
        if (hitCeil) break;
      }

      if (hitCeil) {
        this.velocity.y = 0;
      } else {
        this.position.y = targetY;
      }
      this.onGround = false;
    } else {
      // dispY === 0, check if still standing on floor
      const minX = Math.floor(this.position.x - this.halfWidth + 0.05);
      const maxX = Math.floor(this.position.x + this.halfWidth - 0.05);
      const minZ = Math.floor(this.position.z - this.halfWidth + 0.05);
      const maxZ = Math.floor(this.position.z + this.halfWidth - 0.05);
      const checkY = Math.floor(this.position.y - 0.05);

      let hasFloor = false;
      for (let x = minX; x <= maxX; x++) {
        for (let z = minZ; z <= maxZ; z++) {
          const block = this.world.getBlock(x, checkY, z);
          if (block === BlockType.LILY_PAD || (block !== BlockType.AIR && BLOCK_CONFIGS[block].solid)) {
            hasFloor = true;
            break;
          }
        }
        if (hasFloor) break;
      }
      this.onGround = hasFloor;
    }

    // 6. Void boundary protection (only triggers if falling beneath bedrock into deep void)
    if (this.position.y < Y_MIN - 4) {
      if (onDamage) onDamage(delta * 35);
      if (this.position.y < Y_MIN - 35) {
        this.position.set(0.5, 30, 0.5);
        this.velocity.set(0, 0, 0);
        if (onDamage) onDamage(100);
      }
    }
  }

  private updateFlight(delta: number, input: PlayerInput, cameraYaw: number) {
    const moveDir = new THREE.Vector3();
    if (input.forward) moveDir.z -= 1;
    if (input.backward) moveDir.z += 1;
    if (input.left) moveDir.x -= 1;
    if (input.right) moveDir.x += 1;

    const flySpeed = input.sprint ? FLY_SPEED * 1.85 : FLY_SPEED;

    if (moveDir.lengthSq() > 0) {
      moveDir.normalize();
      moveDir.applyAxisAngle(new THREE.Vector3(0, 1, 0), cameraYaw);
      this.position.x += moveDir.x * flySpeed * delta;
      this.position.z += moveDir.z * flySpeed * delta;
    }

    if (input.jump) {
      this.position.y += flySpeed * delta;
    }
    if (input.crouch) {
      this.position.y -= flySpeed * delta;
    }
  }

  // Check if player's body volume intersects any solid blocks
  // Strictly checks Y from pos.y + 0.08 (just above the floor) to pos.y + PLAYER_HEIGHT - 0.05
  public checkCollision(): boolean {
    const minX = Math.floor(this.position.x - this.halfWidth + 0.02);
    const maxX = Math.floor(this.position.x + this.halfWidth - 0.02);
    const minY = Math.floor(this.position.y + 0.08);
    const maxY = Math.floor(this.position.y + PLAYER_HEIGHT - 0.05);
    const minZ = Math.floor(this.position.z - this.halfWidth + 0.02);
    const maxZ = Math.floor(this.position.z + this.halfWidth - 0.02);

    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        for (let z = minZ; z <= maxZ; z++) {
          const block = this.world.getBlock(x, y, z);
          if (block !== BlockType.AIR && BLOCK_CONFIGS[block].solid) {
            if (isDoor(block) && this.world.isDoorOpen(x, y, z)) {
              continue; // Player can freely walk through open doors!
            }
            return true;
          }
        }
      }
    }
    return false;
  }
}
