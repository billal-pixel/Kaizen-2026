import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export type ThreeBgStyle = 'cyber_grid' | 'neural_constellation' | 'floating_prisms' | 'starfield_warp';
export type ThreeBgIntensity = 'subtle' | 'balanced' | 'vivid';

interface ThreeBackgroundProps {
  style?: ThreeBgStyle;
  intensity?: ThreeBgIntensity;
  speed?: number; // 0.5, 1, 1.5
  theme?: 'light' | 'dark';
  interactive?: boolean;
  enabled?: boolean;
}

export const ThreeBackground: React.FC<ThreeBackgroundProps> = React.memo(({
  style = 'cyber_grid',
  intensity = 'balanced',
  speed = 1,
  theme = 'light',
  interactive = true,
  enabled = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });

  useEffect(() => {
    if (!enabled || !containerRef.current) return;

    const container = containerRef.current;
    let animationFrameId: number;

    // Dimensions
    let width = window.innerWidth;
    let height = window.innerHeight;

    // Renderer with high-performance WebGL
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      });
    } catch {
      return;
    }

    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Scene & Perspective Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 1000);
    camera.position.z = 30;

    // Unified Sky Blue Color Matrix
    const isDark = theme === 'dark';
    const primarySky = isDark ? 0x38bdf8 : 0x0284c7;   // Sky-400 : Sky-600
    const secondarySky = isDark ? 0x0ea5e9 : 0x0369a1; // Sky-500 : Sky-700
    const accentSky = isDark ? 0x7dd3fc : 0x38bdf8;    // Sky-300 : Sky-400
    const highlightSky = isDark ? 0xe0f2fe : 0xbae6fd; // Sky-100 : Sky-200
    const fogColor = isDark ? 0x082f49 : 0xe0f2fe;     // Deep Sky-950 : Sky-100

    scene.fog = new THREE.FogExp2(fogColor, 0.015);

    // Sky-Tinted Atmospheric Directional & Ambient Lighting
    const ambientLight = new THREE.AmbientLight(0xe0f2fe, isDark ? 0.9 : 1.4);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(primarySky, isDark ? 1.6 : 1.2);
    dirLight1.position.set(25, 30, 25);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(secondarySky, isDark ? 1.3 : 0.9);
    dirLight2.position.set(-25, -20, 15);
    scene.add(dirLight2);

    // Cleanup references array
    const cleanupFns: Array<() => void> = [];

    // ========================================================
    // Ambient Sky Blue 3D Atmospheric Dust (Across all styles)
    // ========================================================
    const dustCount = 140;
    const dustGeo = new THREE.BufferGeometry();
    const dustPos = new Float32Array(dustCount * 3);
    for (let i = 0; i < dustCount * 3; i += 3) {
      dustPos[i] = (Math.random() - 0.5) * 85;
      dustPos[i + 1] = (Math.random() - 0.5) * 55;
      dustPos[i + 2] = (Math.random() - 0.5) * 65;
    }
    dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
    const dustMat = new THREE.PointsMaterial({
      color: accentSky,
      size: 0.55,
      transparent: true,
      opacity: isDark ? 0.5 : 0.4,
    });
    const ambientDust = new THREE.Points(dustGeo, dustMat);
    scene.add(ambientDust);

    cleanupFns.push(() => {
      dustGeo.dispose();
      dustMat.dispose();
    });

    // Variable for active animation callback
    let onAnimate: (() => void) | undefined;

    // ==========================================
    // 1. STYLE: CYBER GRID (3D Undulating Sky Grid)
    // ==========================================
    if (style === 'cyber_grid') {
      camera.position.set(0, 10, 24);
      camera.lookAt(0, 0, 0);

      const gridWidth = 130;
      const gridDepth = 130;
      const segments = 42;
      const geometry = new THREE.PlaneGeometry(gridWidth, gridDepth, segments, segments);
      geometry.rotateX(-Math.PI / 2.3);

      const posAttr = geometry.attributes.position;
      const originalY = new Float32Array(posAttr.count);
      for (let i = 0; i < posAttr.count; i++) {
        originalY[i] = posAttr.getY(i);
      }

      // Sky Blue Wireframe Grid Material
      const gridMaterial = new THREE.MeshStandardMaterial({
        color: primarySky,
        wireframe: true,
        roughness: 0.3,
        metalness: 0.7,
        transparent: true,
        opacity: isDark ? 0.75 : 0.55,
      });

      const terrain = new THREE.Mesh(geometry, gridMaterial);
      terrain.position.y = -6;
      scene.add(terrain);

      // Glowing Sky Blue Horizon Particles
      const particleCount = 260;
      const particleGeo = new THREE.BufferGeometry();
      const particlePositions = new Float32Array(particleCount * 3);
      for (let i = 0; i < particleCount * 3; i += 3) {
        particlePositions[i] = (Math.random() - 0.5) * 100;
        particlePositions[i + 1] = Math.random() * 22 - 4;
        particlePositions[i + 2] = (Math.random() - 0.5) * 80;
      }
      particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));

      const particleMat = new THREE.PointsMaterial({
        color: secondarySky,
        size: 0.65,
        transparent: true,
        opacity: isDark ? 0.8 : 0.6,
      });
      const particles = new THREE.Points(particleGeo, particleMat);
      scene.add(particles);

      // 4 Floating Polyhedral Sky Crystal Markers
      const markerGroup = new THREE.Group();
      const polyGeos = [
        new THREE.IcosahedronGeometry(2.5, 0),
        new THREE.OctahedronGeometry(2.2, 0),
        new THREE.TetrahedronGeometry(2.4, 0),
        new THREE.DodecahedronGeometry(2.0, 0),
      ];

      const markers = polyGeos.map((geo, idx) => {
        const mat = new THREE.MeshStandardMaterial({
          color: idx % 2 === 0 ? primarySky : accentSky,
          wireframe: true,
          transparent: true,
          opacity: isDark ? 0.85 : 0.65,
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set((idx - 1.5) * 16, 6 + idx * 1.5, -15 - idx * 4);
        markerGroup.add(mesh);
        return mesh;
      });
      scene.add(markerGroup);

      let clock = 0;
      const updateCyberGrid = () => {
        clock += 0.016 * speed;

        // Fluid 3D Wave elevation on terrain vertices
        for (let i = 0; i < posAttr.count; i++) {
          const x = posAttr.getX(i);
          const z = posAttr.getZ(i);
          const elevation =
            Math.sin(x * 0.12 + clock * 1.8) * 1.8 +
            Math.cos(z * 0.11 + clock * 1.3) * 1.9 +
            Math.sin((x + z) * 0.07 + clock) * 1.4;
          posAttr.setY(i, originalY[i] + elevation);
        }
        posAttr.needsUpdate = true;

        // Rotate polyhedral markers in 3D
        markers.forEach((m, idx) => {
          m.rotation.x += (0.008 + idx * 0.002) * speed;
          m.rotation.y += (0.012 + idx * 0.003) * speed;
          m.position.y += Math.sin(clock * 1.4 + idx * 2) * 0.02;
        });

        particles.rotation.y += 0.0009 * speed;
      };

      cleanupFns.push(() => {
        geometry.dispose();
        gridMaterial.dispose();
        particleGeo.dispose();
        particleMat.dispose();
        polyGeos.forEach((g) => g.dispose());
      });

      onAnimate = updateCyberGrid;
    }

    // ===================================================
    // 2. STYLE: NEURAL CONSTELLATION (Sky Blue Nodes & Rings)
    // ===================================================
    else if (style === 'neural_constellation') {
      camera.position.set(0, 0, 32);

      const nodeCount = 150;
      const nodeGeo = new THREE.BufferGeometry();
      const nodePos = new Float32Array(nodeCount * 3);
      const nodeVel: Array<{ vx: number; vy: number; vz: number }> = [];

      for (let i = 0; i < nodeCount; i++) {
        nodePos[i * 3] = (Math.random() - 0.5) * 60;
        nodePos[i * 3 + 1] = (Math.random() - 0.5) * 40;
        nodePos[i * 3 + 2] = (Math.random() - 0.5) * 45;

        nodeVel.push({
          vx: (Math.random() - 0.5) * 0.04 * speed,
          vy: (Math.random() - 0.5) * 0.04 * speed,
          vz: (Math.random() - 0.5) * 0.04 * speed,
        });
      }
      nodeGeo.setAttribute('position', new THREE.BufferAttribute(nodePos, 3));

      const nodeMat = new THREE.PointsMaterial({
        color: primarySky,
        size: 0.9,
        transparent: true,
        opacity: isDark ? 0.9 : 0.75,
      });
      const nodeMesh = new THREE.Points(nodeGeo, nodeMat);
      scene.add(nodeMesh);

      // Line mesh for dynamic connections between nearby sky blue nodes
      const maxLines = 180;
      const linePositions = new Float32Array(maxLines * 6);
      const lineGeo = new THREE.BufferGeometry();
      lineGeo.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));

      const lineMat = new THREE.LineBasicMaterial({
        color: secondarySky,
        transparent: true,
        opacity: isDark ? 0.45 : 0.35,
      });
      const lineMesh = new THREE.LineSegments(lineGeo, lineMat);
      scene.add(lineMesh);

      // Central Gyroscope / Orbital Sky Blue Tech Rings
      const ringGroup = new THREE.Group();
      const ring1 = new THREE.Mesh(
        new THREE.TorusGeometry(8, 0.08, 14, 64),
        new THREE.MeshBasicMaterial({ color: primarySky, transparent: true, opacity: isDark ? 0.55 : 0.4 })
      );
      const ring2 = new THREE.Mesh(
        new THREE.TorusGeometry(12.5, 0.07, 14, 72),
        new THREE.MeshBasicMaterial({ color: secondarySky, transparent: true, opacity: isDark ? 0.45 : 0.3 })
      );
      const ring3 = new THREE.Mesh(
        new THREE.TorusGeometry(17, 0.06, 14, 80),
        new THREE.MeshBasicMaterial({ color: accentSky, transparent: true, opacity: isDark ? 0.35 : 0.25 })
      );
      ringGroup.add(ring1, ring2, ring3);
      scene.add(ringGroup);

      const updateNeural = () => {
        const positions = nodeGeo.attributes.position.array as Float32Array;

        // Move nodes
        for (let i = 0; i < nodeCount; i++) {
          positions[i * 3] += nodeVel[i].vx;
          positions[i * 3 + 1] += nodeVel[i].vy;
          positions[i * 3 + 2] += nodeVel[i].vz;

          // Bounce bounds
          if (Math.abs(positions[i * 3]) > 32) nodeVel[i].vx *= -1;
          if (Math.abs(positions[i * 3 + 1]) > 22) nodeVel[i].vy *= -1;
          if (Math.abs(positions[i * 3 + 2]) > 26) nodeVel[i].vz *= -1;
        }
        nodeGeo.attributes.position.needsUpdate = true;

        // Dynamic Line Connections
        let lineIdx = 0;
        const connectionDistSq = 95;
        for (let i = 0; i < nodeCount && lineIdx < maxLines * 6; i++) {
          for (let j = i + 1; j < nodeCount && lineIdx < maxLines * 6; j++) {
            const dx = positions[i * 3] - positions[j * 3];
            const dy = positions[i * 3 + 1] - positions[j * 3 + 1];
            const dz = positions[i * 3 + 2] - positions[j * 3 + 2];
            const distSq = dx * dx + dy * dy + dz * dz;

            if (distSq < connectionDistSq) {
              linePositions[lineIdx++] = positions[i * 3];
              linePositions[lineIdx++] = positions[i * 3 + 1];
              linePositions[lineIdx++] = positions[i * 3 + 2];
              linePositions[lineIdx++] = positions[j * 3];
              linePositions[lineIdx++] = positions[j * 3 + 1];
              linePositions[lineIdx++] = positions[j * 3 + 2];
            }
          }
        }
        lineGeo.setDrawRange(0, lineIdx / 3);
        lineGeo.attributes.position.needsUpdate = true;

        // Rotate Rings
        ring1.rotation.x += 0.006 * speed;
        ring1.rotation.y += 0.009 * speed;
        ring2.rotation.y -= 0.007 * speed;
        ring2.rotation.z += 0.005 * speed;
        ring3.rotation.x -= 0.004 * speed;
        ring3.rotation.z -= 0.006 * speed;
      };

      cleanupFns.push(() => {
        nodeGeo.dispose();
        nodeMat.dispose();
        lineGeo.dispose();
        lineMat.dispose();
        ring1.geometry.dispose();
        ring2.geometry.dispose();
        ring3.geometry.dispose();
      });

      onAnimate = updateNeural;
    }

    // ==========================================
    // 3. STYLE: FLOATING PRISMS (3D Sky Blue Crystals)
    // ==========================================
    else if (style === 'floating_prisms') {
      camera.position.set(0, 0, 30);

      const prismGroup = new THREE.Group();
      const geometries = [
        new THREE.IcosahedronGeometry(2.5, 0),
        new THREE.DodecahedronGeometry(2.3, 0),
        new THREE.OctahedronGeometry(2.2, 0),
        new THREE.TetrahedronGeometry(2.6, 0),
        new THREE.BoxGeometry(2.3, 2.3, 2.3),
      ];

      const prismList: Array<{
        mesh: THREE.Mesh;
        rotSpeedX: number;
        rotSpeedY: number;
        floatSpeed: number;
        initY: number;
      }> = [];

      const count = 22;
      for (let i = 0; i < count; i++) {
        const geo = geometries[i % geometries.length];
        const isWire = i % 2 === 0;
        const color = i % 3 === 0 ? primarySky : i % 3 === 1 ? secondarySky : accentSky;

        const mat = new THREE.MeshStandardMaterial({
          color,
          roughness: 0.2,
          metalness: 0.8,
          wireframe: isWire,
          transparent: true,
          opacity: isDark ? 0.7 : 0.5,
        });

        const mesh = new THREE.Mesh(geo, mat);
        const posX = (Math.random() - 0.5) * 55;
        const posY = (Math.random() - 0.5) * 35;
        const posZ = (Math.random() - 0.5) * 40;

        mesh.position.set(posX, posY, posZ);
        mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);

        prismGroup.add(mesh);
        prismList.push({
          mesh,
          rotSpeedX: (Math.random() - 0.5) * 0.016 * speed,
          rotSpeedY: (Math.random() - 0.5) * 0.016 * speed,
          floatSpeed: (0.5 + Math.random() * 0.8) * speed,
          initY: posY,
        });
      }
      scene.add(prismGroup);

      let t = 0;
      const updatePrisms = () => {
        t += 0.016 * speed;
        prismList.forEach((p, idx) => {
          p.mesh.rotation.x += p.rotSpeedX;
          p.mesh.rotation.y += p.rotSpeedY;
          p.mesh.position.y = p.initY + Math.sin(t * p.floatSpeed + idx) * 1.6;
        });
      };

      cleanupFns.push(() => {
        geometries.forEach((g) => g.dispose());
        prismList.forEach((p) => (p.mesh.material as THREE.Material).dispose());
      });

      onAnimate = updatePrisms;
    }

    // ==========================================
    // 4. STYLE: STARFIELD WARP (3D Sky Blue Cosmic Stream)
    // ==========================================
    else {
      camera.position.set(0, 0, 10);

      const starCount = 650;
      const starGeo = new THREE.BufferGeometry();
      const starPos = new Float32Array(starCount * 3);
      const starSpeeds = new Float32Array(starCount);

      for (let i = 0; i < starCount; i++) {
        starPos[i * 3] = (Math.random() - 0.5) * 65;
        starPos[i * 3 + 1] = (Math.random() - 0.5) * 50;
        starPos[i * 3 + 2] = (Math.random() - 0.5) * 75;
        starSpeeds[i] = 0.16 + Math.random() * 0.28;
      }
      starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));

      const starMat = new THREE.PointsMaterial({
        color: primarySky,
        size: 0.7,
        transparent: true,
        opacity: isDark ? 0.9 : 0.7,
      });
      const starField = new THREE.Points(starGeo, starMat);
      scene.add(starField);

      const updateStarfield = () => {
        const positions = starGeo.attributes.position.array as Float32Array;
        for (let i = 0; i < starCount; i++) {
          positions[i * 3 + 2] += starSpeeds[i] * speed;
          // Loop back when star passes camera depth
          if (positions[i * 3 + 2] > 25) {
            positions[i * 3 + 2] = -48;
            positions[i * 3] = (Math.random() - 0.5) * 65;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 50;
          }
        }
        starGeo.attributes.position.needsUpdate = true;
        starField.rotation.z += 0.0006 * speed;
      };

      cleanupFns.push(() => {
        starGeo.dispose();
        starMat.dispose();
      });

      onAnimate = updateStarfield;
    }

    // ==========================================
    // Interactive Mouse Tilt & Parallax Camera
    // ==========================================
    const handleMouseMove = (e: MouseEvent) => {
      if (!interactive) return;
      const nx = (e.clientX / window.innerWidth) * 2 - 1;
      const ny = -(e.clientY / window.innerHeight) * 2 + 1;
      mouseRef.current.targetX = nx * 3.8;
      mouseRef.current.targetY = ny * 2.8;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    // Window Resize Listener
    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);

    // Main 3D Render Loop
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      // Smooth camera interpolation for fluid 3D parallax
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.05;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.05;

      camera.position.x = mouseRef.current.x;
      camera.position.y += (mouseRef.current.y - camera.position.y) * 0.03;

      // Rotate ambient volumetric dust gently
      if (ambientDust) {
        ambientDust.rotation.y += 0.0004 * speed;
        ambientDust.rotation.x += 0.0002 * speed;
      }

      if (onAnimate) {
        onAnimate();
      }

      renderer.render(scene, camera);
    };

    animate();

    // Comprehensive Cleanup on change / unmount
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      cleanupFns.forEach((fn) => fn());
      renderer.dispose();
      if (container) {
        container.innerHTML = '';
      }
    };
  }, [style, speed, theme, interactive, enabled]);

  if (!enabled) return null;

  // Prominent sky-blue 3D presence across whole background
  const opacityClass =
    intensity === 'subtle'
      ? 'opacity-50 dark:opacity-60'
      : intensity === 'vivid'
      ? 'opacity-95 dark:opacity-95'
      : 'opacity-75 dark:opacity-85';

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className={`fixed inset-0 pointer-events-none z-0 overflow-hidden transition-opacity duration-700 ease-in-out ${opacityClass}`}
    />
  );
});
