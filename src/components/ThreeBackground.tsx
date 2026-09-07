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

export const ThreeBackground: React.FC<ThreeBackgroundProps> = ({
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

    // Renderer
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      });
    } catch {
      // WebGL not supported
      return;
    }

    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Scene & Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 1000);
    camera.position.z = 30;

    // Color Configuration based on Light / Dark theme
    const isDark = theme === 'dark';
    const primaryColor = isDark ? 0x22d3ee : 0x0d9488; // cyan-400 : teal-600
    const secondaryColor = isDark ? 0x38bdf8 : 0x0284c7; // sky-400 : sky-600
    const accentColor = isDark ? 0x818cf8 : 0x4f46e5; // indigo-400 : indigo-600
    const fogColor = isDark ? 0x071324 : 0xf8fafc;

    scene.fog = new THREE.FogExp2(fogColor, 0.018);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, isDark ? 0.6 : 1.2);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(primaryColor, isDark ? 1.5 : 1.0);
    dirLight1.position.set(20, 25, 20);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(secondaryColor, isDark ? 1.2 : 0.8);
    dirLight2.position.set(-20, -15, 10);
    scene.add(dirLight2);

    // Cleanup references
    const cleanupFns: Array<() => void> = [];

    // ==========================================
    // 1. STYLE: CYBER GRID (3D Undulating Terrain)
    // ==========================================
    if (style === 'cyber_grid') {
      camera.position.set(0, 10, 24);
      camera.lookAt(0, 0, 0);

      const gridWidth = 90;
      const gridDepth = 90;
      const segments = 36;
      const geometry = new THREE.PlaneGeometry(gridWidth, gridDepth, segments, segments);
      geometry.rotateX(-Math.PI / 2.3);

      const posAttr = geometry.attributes.position;
      const originalY = new Float32Array(posAttr.count);
      for (let i = 0; i < posAttr.count; i++) {
        originalY[i] = posAttr.getY(i);
      }

      // Wireframe Grid Material
      const gridMaterial = new THREE.MeshStandardMaterial({
        color: primaryColor,
        wireframe: true,
        roughness: 0.4,
        metalness: 0.6,
        transparent: true,
        opacity: isDark ? 0.6 : 0.35,
      });

      const terrain = new THREE.Mesh(geometry, gridMaterial);
      terrain.position.y = -6;
      scene.add(terrain);

      // Glowing Horizon Particles
      const particleCount = 180;
      const particleGeo = new THREE.BufferGeometry();
      const particlePositions = new Float32Array(particleCount * 3);
      for (let i = 0; i < particleCount * 3; i += 3) {
        particlePositions[i] = (Math.random() - 0.5) * 80;
        particlePositions[i + 1] = Math.random() * 18 - 4;
        particlePositions[i + 2] = (Math.random() - 0.5) * 60;
      }
      particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));

      const particleMat = new THREE.PointsMaterial({
        color: secondaryColor,
        size: 0.5,
        transparent: true,
        opacity: isDark ? 0.7 : 0.4,
      });
      const particles = new THREE.Points(particleGeo, particleMat);
      scene.add(particles);

      // 3 Floating Polyhedral Markers in Distance
      const markerGroup = new THREE.Group();
      const polyGeos = [
        new THREE.IcosahedronGeometry(2.5, 0),
        new THREE.OctahedronGeometry(2, 0),
        new THREE.TetrahedronGeometry(2.2, 0),
      ];

      const markers = polyGeos.map((geo, idx) => {
        const mat = new THREE.MeshStandardMaterial({
          color: idx === 0 ? primaryColor : idx === 1 ? secondaryColor : accentColor,
          wireframe: true,
          transparent: true,
          opacity: isDark ? 0.8 : 0.45,
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set((idx - 1) * 18, 6 + idx * 1.5, -15 - idx * 4);
        markerGroup.add(mesh);
        return mesh;
      });
      scene.add(markerGroup);

      let clock = 0;
      const updateCyberGrid = () => {
        clock += 0.015 * speed;

        // Wave animation on terrain vertices
        for (let i = 0; i < posAttr.count; i++) {
          const x = posAttr.getX(i);
          const z = posAttr.getZ(i);
          const elevation =
            Math.sin(x * 0.14 + clock * 1.8) * 1.6 +
            Math.cos(z * 0.12 + clock * 1.2) * 1.8 +
            Math.sin((x + z) * 0.08 + clock) * 1.2;
          posAttr.setY(i, originalY[i] + elevation);
        }
        posAttr.needsUpdate = true;

        // Rotate polyhedral markers
        markers.forEach((m, idx) => {
          m.rotation.x += (0.008 + idx * 0.002) * speed;
          m.rotation.y += (0.012 + idx * 0.003) * speed;
          m.position.y += Math.sin(clock * 1.5 + idx * 2) * 0.015;
        });

        particles.rotation.y += 0.0008 * speed;
      };

      cleanupFns.push(() => {
        geometry.dispose();
        gridMaterial.dispose();
        particleGeo.dispose();
        particleMat.dispose();
        polyGeos.forEach((g) => g.dispose());
      });

      var onAnimate = updateCyberGrid;
    }

    // ===================================================
    // 2. STYLE: NEURAL CONSTELLATION (Nodes, Lines, Rings)
    // ===================================================
    else if (style === 'neural_constellation') {
      camera.position.set(0, 0, 32);

      const nodeCount = 120;
      const nodeGeo = new THREE.BufferGeometry();
      const nodePos = new Float32Array(nodeCount * 3);
      const nodeVel: Array<{ vx: number; vy: number; vz: number }> = [];

      for (let i = 0; i < nodeCount; i++) {
        nodePos[i * 3] = (Math.random() - 0.5) * 55;
        nodePos[i * 3 + 1] = (Math.random() - 0.5) * 35;
        nodePos[i * 3 + 2] = (Math.random() - 0.5) * 40;

        nodeVel.push({
          vx: (Math.random() - 0.5) * 0.04 * speed,
          vy: (Math.random() - 0.5) * 0.04 * speed,
          vz: (Math.random() - 0.5) * 0.04 * speed,
        });
      }
      nodeGeo.setAttribute('position', new THREE.BufferAttribute(nodePos, 3));

      const nodeMat = new THREE.PointsMaterial({
        color: primaryColor,
        size: 0.8,
        transparent: true,
        opacity: isDark ? 0.85 : 0.6,
      });
      const nodeMesh = new THREE.Points(nodeGeo, nodeMat);
      scene.add(nodeMesh);

      // Line mesh for dynamic connections between nearby nodes
      const maxLines = 150;
      const linePositions = new Float32Array(maxLines * 6);
      const lineGeo = new THREE.BufferGeometry();
      lineGeo.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));

      const lineMat = new THREE.LineBasicMaterial({
        color: secondaryColor,
        transparent: true,
        opacity: isDark ? 0.35 : 0.2,
      });
      const lineMesh = new THREE.LineSegments(lineGeo, lineMat);
      scene.add(lineMesh);

      // Central Gyroscope / Orbital Tech Rings
      const ringGroup = new THREE.Group();
      const ring1 = new THREE.Mesh(
        new THREE.TorusGeometry(8, 0.06, 12, 60),
        new THREE.MeshBasicMaterial({ color: primaryColor, transparent: true, opacity: isDark ? 0.45 : 0.25 })
      );
      const ring2 = new THREE.Mesh(
        new THREE.TorusGeometry(12, 0.06, 12, 70),
        new THREE.MeshBasicMaterial({ color: secondaryColor, transparent: true, opacity: isDark ? 0.35 : 0.2 })
      );
      const ring3 = new THREE.Mesh(
        new THREE.TorusGeometry(16, 0.05, 12, 80),
        new THREE.MeshBasicMaterial({ color: accentColor, transparent: true, opacity: isDark ? 0.25 : 0.15 })
      );
      ringGroup.add(ring1, ring2, ring3);
      scene.add(ringGroup);

      let step = 0;
      const updateNeural = () => {
        step += 0.01 * speed;
        const positions = nodeGeo.attributes.position.array as Float32Array;

        // Move nodes
        for (let i = 0; i < nodeCount; i++) {
          positions[i * 3] += nodeVel[i].vx;
          positions[i * 3 + 1] += nodeVel[i].vy;
          positions[i * 3 + 2] += nodeVel[i].vz;

          // Bounce bounds
          if (Math.abs(positions[i * 3]) > 30) nodeVel[i].vx *= -1;
          if (Math.abs(positions[i * 3 + 1]) > 20) nodeVel[i].vy *= -1;
          if (Math.abs(positions[i * 3 + 2]) > 25) nodeVel[i].vz *= -1;
        }
        nodeGeo.attributes.position.needsUpdate = true;

        // Dynamic Line Connections
        let lineIdx = 0;
        const connectionDistSq = 90; // dist ~ 9.5
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
        ring1.rotation.x += 0.005 * speed;
        ring1.rotation.y += 0.008 * speed;
        ring2.rotation.y -= 0.006 * speed;
        ring2.rotation.z += 0.004 * speed;
        ring3.rotation.x -= 0.003 * speed;
        ring3.rotation.z -= 0.005 * speed;
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

      var onAnimate = updateNeural;
    }

    // ==========================================
    // 3. STYLE: FLOATING PRISMS (3D Crystals)
    // ==========================================
    else if (style === 'floating_prisms') {
      camera.position.set(0, 0, 30);

      const prismGroup = new THREE.Group();
      const geometries = [
        new THREE.IcosahedronGeometry(2.4, 0),
        new THREE.DodecahedronGeometry(2.2, 0),
        new THREE.OctahedronGeometry(2.0, 0),
        new THREE.TetrahedronGeometry(2.5, 0),
        new THREE.BoxGeometry(2.2, 2.2, 2.2),
      ];

      const prismList: Array<{
        mesh: THREE.Mesh;
        rotSpeedX: number;
        rotSpeedY: number;
        floatSpeed: number;
        initY: number;
      }> = [];

      const count = 18;
      for (let i = 0; i < count; i++) {
        const geo = geometries[i % geometries.length];
        const mat = new THREE.MeshStandardMaterial({
          color: i % 3 === 0 ? primaryColor : i % 3 === 1 ? secondaryColor : accentColor,
          roughness: 0.2,
          metalness: 0.8,
          wireframe: i % 2 === 0,
          transparent: true,
          opacity: isDark ? 0.55 : 0.35,
        });

        const mesh = new THREE.Mesh(geo, mat);
        const posX = (Math.random() - 0.5) * 50;
        const posY = (Math.random() - 0.5) * 30;
        const posZ = (Math.random() - 0.5) * 35;

        mesh.position.set(posX, posY, posZ);
        mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);

        prismGroup.add(mesh);
        prismList.push({
          mesh,
          rotSpeedX: (Math.random() - 0.5) * 0.015 * speed,
          rotSpeedY: (Math.random() - 0.5) * 0.015 * speed,
          floatSpeed: (0.5 + Math.random() * 0.8) * speed,
          initY: posY,
        });
      }
      scene.add(prismGroup);

      let t = 0;
      const updatePrisms = () => {
        t += 0.015 * speed;
        prismList.forEach((p, idx) => {
          p.mesh.rotation.x += p.rotSpeedX;
          p.mesh.rotation.y += p.rotSpeedY;
          p.mesh.position.y = p.initY + Math.sin(t * p.floatSpeed + idx) * 1.5;
        });
      };

      cleanupFns.push(() => {
        geometries.forEach((g) => g.dispose());
        prismList.forEach((p) => (p.mesh.material as THREE.Material).dispose());
      });

      var onAnimate = updatePrisms;
    }

    // ==========================================
    // 4. STYLE: STARFIELD WARP (3D Cyber Stream)
    // ==========================================
    else {
      camera.position.set(0, 0, 10);

      const starCount = 500;
      const starGeo = new THREE.BufferGeometry();
      const starPos = new Float32Array(starCount * 3);
      const starSpeeds = new Float32Array(starCount);

      for (let i = 0; i < starCount; i++) {
        starPos[i * 3] = (Math.random() - 0.5) * 60;
        starPos[i * 3 + 1] = (Math.random() - 0.5) * 45;
        starPos[i * 3 + 2] = (Math.random() - 0.5) * 70;
        starSpeeds[i] = 0.15 + Math.random() * 0.25;
      }
      starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));

      const starMat = new THREE.PointsMaterial({
        color: primaryColor,
        size: 0.6,
        transparent: true,
        opacity: isDark ? 0.8 : 0.5,
      });
      const starField = new THREE.Points(starGeo, starMat);
      scene.add(starField);

      const updateStarfield = () => {
        const positions = starGeo.attributes.position.array as Float32Array;
        for (let i = 0; i < starCount; i++) {
          positions[i * 3 + 2] += starSpeeds[i] * speed;
          // Loop back when star passes the camera
          if (positions[i * 3 + 2] > 25) {
            positions[i * 3 + 2] = -45;
            positions[i * 3] = (Math.random() - 0.5) * 60;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 45;
          }
        }
        starGeo.attributes.position.needsUpdate = true;
        starField.rotation.z += 0.0005 * speed;
      };

      cleanupFns.push(() => {
        starGeo.dispose();
        starMat.dispose();
      });

      var onAnimate = updateStarfield;
    }

    // ==========================================
    // Interactive Mouse Tilt & Parallax Camera
    // ==========================================
    const handleMouseMove = (e: MouseEvent) => {
      if (!interactive) return;
      const nx = (e.clientX / window.innerWidth) * 2 - 1;
      const ny = -(e.clientY / window.innerHeight) * 2 + 1;
      mouseRef.current.targetX = nx * 3.5;
      mouseRef.current.targetY = ny * 2.5;
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

    // Main Render Loop
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      // Smooth camera interpolation for fluid 3D parallax
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.05;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.05;

      camera.position.x = mouseRef.current.x;
      camera.position.y += (mouseRef.current.y - camera.position.y) * 0.03;

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

  // Compute container opacity based on intensity
  const opacityClass =
    intensity === 'subtle'
      ? 'opacity-35 dark:opacity-30'
      : intensity === 'vivid'
      ? 'opacity-85 dark:opacity-80'
      : 'opacity-60 dark:opacity-55';

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className={`fixed inset-0 pointer-events-none z-0 overflow-hidden transition-opacity duration-700 ease-in-out ${opacityClass}`}
    />
  );
};
