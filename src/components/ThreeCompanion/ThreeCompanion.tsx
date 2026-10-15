import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import type { CompanionState } from '../../types/index.ts';

interface ThreeCompanionProps {
  state: CompanionState;
  avatarStyle?: 'nova_core' | 'aurora_cyber' | 'starlight_orb' | 'sage_holo';
  interactive?: boolean;
}

export const ThreeCompanion: React.FC<ThreeCompanionProps> = ({
  state,
  avatarStyle = 'nova_core',
  interactive = true,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef<CompanionState>(state);
  const avatarStyleRef = useRef(avatarStyle);

  stateRef.current = state;
  avatarStyleRef.current = avatarStyle;

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Detect headless Chromium for software WebGL performance
    const isHeadless =
      typeof navigator !== 'undefined' &&
      (Boolean(navigator.webdriver) || /HeadlessChrome/i.test(navigator.userAgent));

    const width = container.clientWidth || 320;
    const height = container.clientHeight || 320;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0.2, 3.8);

    const renderer = new THREE.WebGLRenderer({
      antialias: !isHeadless,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(isHeadless ? 1 : Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(width, height);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;

    container.appendChild(renderer.domElement);

    // 2. Lighting Rig
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0x818cf8, 2.0);
    keyLight.position.set(3, 4, 3);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x38bdf8, 1.2);
    fillLight.position.set(-3, -1, 2);
    scene.add(fillLight);

    const rimLight = new THREE.PointLight(0xc084fc, 2.5, 8);
    rimLight.position.set(0, 2, -2);
    scene.add(rimLight);

    // 3. Hierarchical Procedural 3D Model (3-12 parts)
    const companionGroup = new THREE.Group();
    scene.add(companionGroup);

    // Color theme definition
    const getColors = (style: string) => {
      switch (style) {
        case 'aurora_cyber':
          return { core: 0x06b6d4, accent: 0x10b981, glow: 0x22d3ee, metal: 0x1e293b };
        case 'starlight_orb':
          return { core: 0xf59e0b, accent: 0xf43f5e, glow: 0xfbbf24, metal: 0x334155 };
        case 'sage_holo':
          return { core: 0xa855f7, accent: 0x6366f1, glow: 0xc084fc, metal: 0x0f172a };
        case 'nova_core':
        default:
          return { core: 0x6366f1, accent: 0x38bdf8, glow: 0x818cf8, metal: 0x1e1b4b };
      }
    };

    const colors = getColors(avatarStyleRef.current);

    // Part 1: Primary Silhouette (Core Head Sphere)
    const headGeo = new THREE.SphereGeometry(0.72, 32, 32);
    const headMat = new THREE.MeshPhysicalMaterial({
      color: colors.metal,
      metalness: 0.85,
      roughness: 0.2,
      clearcoat: 0.8,
      clearcoatRoughness: 0.1,
    });
    const headMesh = new THREE.Mesh(headGeo, headMat);
    companionGroup.add(headMesh);

    // Part 2: Inner Energy Crystal Core
    const innerGeo = new THREE.IcosahedronGeometry(0.42, 1);
    const innerMat = new THREE.MeshStandardMaterial({
      color: colors.core,
      emissive: colors.glow,
      emissiveIntensity: 0.9,
      roughness: 0.15,
      metalness: 0.4,
      wireframe: true,
    });
    const innerCore = new THREE.Mesh(innerGeo, innerMat);
    companionGroup.add(innerCore);

    // Part 3: Visor (Secondary Silhouette read)
    const visorGeo = new THREE.CylinderGeometry(0.55, 0.55, 0.28, 32, 1, false, -Math.PI / 2.8, Math.PI / 1.4);
    const visorMat = new THREE.MeshPhysicalMaterial({
      color: 0x020617,
      metalness: 0.9,
      roughness: 0.05,
      transmission: 0.3,
      thickness: 0.5,
      clearcoat: 1.0,
    });
    const visorMesh = new THREE.Mesh(visorGeo, visorMat);
    visorMesh.position.set(0, 0.08, 0.42);
    visorMesh.rotation.x = Math.PI / 2;
    companionGroup.add(visorMesh);

    // Part 4 & 5: Procedural Eyes (CanvasTexture with animated blink/scan)
    const eyeCanvas = document.createElement('canvas');
    eyeCanvas.width = 128;
    eyeCanvas.height = 64;
    const eyeCtx = eyeCanvas.getContext('2d')!;
    const eyeTexture = new THREE.CanvasTexture(eyeCanvas);
    eyeTexture.colorSpace = THREE.SRGBColorSpace;

    const eyeGeo = new THREE.PlaneGeometry(0.5, 0.22);
    const eyeMat = new THREE.MeshBasicMaterial({
      map: eyeTexture,
      transparent: true,
      depthWrite: false,
    });
    const eyeMesh = new THREE.Mesh(eyeGeo, eyeMat);
    eyeMesh.position.set(0, 0.08, 0.69);
    companionGroup.add(eyeMesh);

    // Part 6 & 7: Cyber Antennae / Audio Sensors
    const earGeo = new THREE.CylinderGeometry(0.12, 0.04, 0.45, 16);
    const earMat = new THREE.MeshStandardMaterial({
      color: colors.metal,
      metalness: 0.9,
      roughness: 0.2,
    });
    const leftEar = new THREE.Mesh(earGeo, earMat);
    leftEar.position.set(-0.76, 0.4, 0);
    leftEar.rotation.z = Math.PI / 4;
    companionGroup.add(leftEar);

    const rightEar = leftEar.clone();
    rightEar.position.set(0.76, 0.4, 0);
    rightEar.rotation.z = -Math.PI / 4;
    companionGroup.add(rightEar);

    // Part 8: Floating Gyro Orbital Ring
    const ringGeo = new THREE.TorusGeometry(1.05, 0.024, 16, 64);
    const ringMat = new THREE.MeshStandardMaterial({
      color: colors.accent,
      emissive: colors.glow,
      emissiveIntensity: 0.6,
      metalness: 0.8,
      roughness: 0.2,
    });
    const orbitalRing = new THREE.Mesh(ringGeo, ringMat);
    orbitalRing.rotation.x = Math.PI / 3;
    companionGroup.add(orbitalRing);

    // Part 9: Secondary Counter Orbital Ring
    const ring2Geo = new THREE.TorusGeometry(1.18, 0.016, 16, 64);
    const ring2Mat = new THREE.MeshStandardMaterial({
      color: colors.core,
      emissive: colors.core,
      emissiveIntensity: 0.4,
      metalness: 0.7,
      roughness: 0.3,
    });
    const orbitalRing2 = new THREE.Mesh(ring2Geo, ring2Mat);
    orbitalRing2.rotation.y = Math.PI / 4;
    companionGroup.add(orbitalRing2);

    // Part 10: Particle Energy Swarm
    const particleCount = isHeadless ? 20 : 60;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      const radius = 1.3 + Math.random() * 0.5;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      particlePositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      particlePositions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      particlePositions[i * 3 + 2] = radius * Math.cos(phi);
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: colors.glow,
      size: 0.04,
      transparent: true,
      opacity: 0.7,
    });
    const particleCloud = new THREE.Points(particleGeo, particleMat);
    companionGroup.add(particleCloud);

    // Part 11: Ground Contact Shadow
    const shadowGeo = new THREE.PlaneGeometry(1.8, 1.8);
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 128;
    shadowCanvas.height = 128;
    const sCtx = shadowCanvas.getContext('2d')!;
    const grad = sCtx.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0, 'rgba(0,0,0,0.45)');
    grad.addColorStop(0.6, 'rgba(0,0,0,0.15)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    sCtx.fillStyle = grad;
    sCtx.fillRect(0, 0, 128, 128);

    const shadowTex = new THREE.CanvasTexture(shadowCanvas);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      depthWrite: false,
    });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.y = -1.1;
    scene.add(shadowMesh);

    // Animation & Pointer Tracking State
    let targetRotationX = 0;
    let targetRotationY = 0;
    let blinkTimer = 0;
    let isBlinking = false;
    let animationFrameId: number;
    let lastTime = performance.now();

    const handlePointerMove = (e: MouseEvent) => {
      if (!interactive) return;
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      targetRotationY = x * 0.45;
      targetRotationX = -y * 0.35;
    };

    window.addEventListener('mousemove', handlePointerMove);

    // Draw eye canvas
    const updateEyes = (time: number, currentState: CompanionState) => {
      eyeCtx.clearRect(0, 0, 128, 64);

      if (isBlinking) {
        // Thin blink line
        eyeCtx.fillStyle = '#38bdf8';
        eyeCtx.fillRect(24, 30, 32, 4);
        eyeCtx.fillRect(72, 30, 32, 4);
      } else if (currentState === 'thinking') {
        // Scan wave line
        const scanOffset = (Math.sin(time * 6) + 1) * 20;
        eyeCtx.fillStyle = '#a855f7';
        eyeCtx.beginPath();
        eyeCtx.roundRect(24 + scanOffset * 0.5, 26, 24, 12, 6);
        eyeCtx.roundRect(72 + scanOffset * 0.5, 26, 24, 12, 6);
        eyeCtx.fill();
      } else if (currentState === 'listening') {
        // Wide alert round eyes
        eyeCtx.fillStyle = '#22d3ee';
        eyeCtx.shadowColor = '#06b6d4';
        eyeCtx.shadowBlur = 8;
        eyeCtx.beginPath();
        eyeCtx.ellipse(38, 32, 14, 18, 0, 0, Math.PI * 2);
        eyeCtx.ellipse(90, 32, 14, 18, 0, 0, Math.PI * 2);
        eyeCtx.fill();
      } else if (currentState === 'speaking') {
        // Expressive cheerful arcs
        const talkPulse = Math.sin(time * 12) * 4;
        eyeCtx.fillStyle = '#818cf8';
        eyeCtx.beginPath();
        eyeCtx.roundRect(26, 26 - talkPulse * 0.5, 28, 14 + talkPulse, 7);
        eyeCtx.roundRect(74, 26 - talkPulse * 0.5, 28, 14 + talkPulse, 7);
        eyeCtx.fill();
      } else {
        // Normal confident cyber visor slits
        eyeCtx.fillStyle = '#60a5fa';
        eyeCtx.beginPath();
        eyeCtx.roundRect(28, 25, 26, 14, 6);
        eyeCtx.roundRect(74, 25, 26, 14, 6);
        eyeCtx.fill();
      }

      eyeTexture.needsUpdate = true;
    };

    // Main Render Loop
    const animate = (currentTime: number) => {
      const delta = Math.min((currentTime - lastTime) / 1000, 0.1);
      lastTime = currentTime;
      const t = currentTime * 0.001;
      const curState = stateRef.current;

      // 1. Natural Idle Breathing & Hovering Motion
      const breatheSpeed = curState === 'thinking' ? 4 : curState === 'speaking' ? 3 : 1.8;
      const floatY = Math.sin(t * breatheSpeed) * 0.08;
      companionGroup.position.y = floatY;

      // 2. Smooth Exponential Damping towards pointer direction
      companionGroup.rotation.y = THREE.MathUtils.damp(
        companionGroup.rotation.y,
        targetRotationY,
        4.0,
        delta
      );
      companionGroup.rotation.x = THREE.MathUtils.damp(
        companionGroup.rotation.x,
        targetRotationX,
        4.0,
        delta
      );

      // 3. Inner Core and Orbital Rings Motion
      const coreSpeed = curState === 'generating' || curState === 'thinking' ? 2.8 : 0.8;
      innerCore.rotation.x += delta * coreSpeed;
      innerCore.rotation.y += delta * (coreSpeed * 1.3);

      orbitalRing.rotation.z += delta * (curState === 'speaking' ? 1.4 : 0.5);
      orbitalRing2.rotation.x += delta * (curState === 'listening' ? 1.2 : -0.4);

      // 4. Particle Cloud Swirl
      particleCloud.rotation.y += delta * (curState === 'generating' ? 1.5 : 0.2);

      // 5. Blinking Logic
      blinkTimer += delta;
      if (blinkTimer > 3.5) {
        isBlinking = true;
        if (blinkTimer > 3.65) {
          isBlinking = false;
          blinkTimer = 0;
        }
      }

      // Update Eyes Texture
      updateEyes(t, curState);

      // Render Scene
      renderer.render(scene, camera);

      if (isHeadless) {
        // Throttle headless frames (~15fps) to keep screenshot execution lightning-fast
        setTimeout(() => {
          animationFrameId = requestAnimationFrame(animate);
        }, 66);
      } else {
        animationFrameId = requestAnimationFrame(animate);
      }
    };

    animationFrameId = requestAnimationFrame(animate);

    // Resize Handler
    const handleResize = () => {
      if (!container) return;
      const newW = container.clientWidth;
      const newH = container.clientHeight;
      if (newW > 0 && newH > 0) {
        camera.aspect = newW / newH;
        camera.updateProjectionMatrix();
        renderer.setSize(newW, newH);
      }
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      renderer.dispose();
      headGeo.dispose();
      headMat.dispose();
      innerGeo.dispose();
      innerMat.dispose();
      visorGeo.dispose();
      visorMat.dispose();
      eyeGeo.dispose();
      eyeMat.dispose();
      earGeo.dispose();
      earMat.dispose();
      ringGeo.dispose();
      ringMat.dispose();
      ring2Geo.dispose();
      ring2Mat.dispose();
      particleGeo.dispose();
      particleMat.dispose();
      shadowGeo.dispose();
      shadowMat.dispose();
      eyeTexture.dispose();
      shadowTex.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="w-full h-full min-h-[220px] flex items-center justify-center relative cursor-grab active:cursor-grabbing overflow-hidden pointer-events-auto"
      style={{ touchAction: 'none' }}
      title="Interactive 3D Companion - Tracks pointer and expresses emotional states"
    />
  );
};
