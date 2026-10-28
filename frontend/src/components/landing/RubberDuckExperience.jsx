import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/**
 * RubberDuckExperience:
 * Manages the Three.js viewport for the authentic 3D Rubber Duck, lighting,
 * high-dive jump physics into the swimming pool, physical ripples, floating bobbing,
 * and a synchronized scroll journey guiding the user through academy sections.
 */
export const RubberDuckExperience = () => {
  const containerRef = useRef(null);
  const [loadError, setLoadError] = useState(false);
  const enteredWaterRef = useRef(false);
  const [motionDisabled, setMotionDisabled] = useState(() => (
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ));

  useEffect(() => {
    // Check prefers-reduced-motion
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleMotionChange = (e) => setMotionDisabled(e.matches);
    mediaQuery.addEventListener('change', handleMotionChange);

    return () => mediaQuery.removeEventListener('change', handleMotionChange);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Check WebGL availability
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) {
      setLoadError(true);
      return;
    }

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance',
      });
    } catch {
      setLoadError(true);
      return;
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, window.innerWidth < 768 ? 1 : 1.35));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    // Scene & Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(0, 1.2, 7.5);

    // Dynamic Lighting
    const ambientLight = new THREE.AmbientLight(0xdcf8f6, 1.6);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfff5e6, 2.8);
    sunLight.position.set(5, 12, 6);
    scene.add(sunLight);

    const waterBounceLight = new THREE.DirectionalLight(0x16b8b0, 1.4);
    waterBounceLight.position.set(-4, -6, 2);
    scene.add(waterBounceLight);

    const rimLight = new THREE.PointLight(0x5eead4, 2.2, 18);
    rimLight.position.set(0, -1, 3);
    scene.add(rimLight);

    // Ripple Rings (Lightweight animated geometry when duck hits water & swims)
    const ripples = [];
    const rippleGeo = new THREE.RingGeometry(0.1, 0.22, 32);
    rippleGeo.rotateX(-Math.PI * 0.5);
    const rippleMat = new THREE.MeshBasicMaterial({
      color: 0x5eead4,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
    });

    for (let i = 0; i < 5; i++) {
      const ring = new THREE.Mesh(rippleGeo, rippleMat.clone());
      ring.position.set(0, -0.6, 0);
      ring.visible = false;
      scene.add(ring);
      ripples.push(ring);
    }

    const triggerRipple = (originX, originY, originZ, maxScale = 4.5, duration = 1.8) => {
      const ring = ripples.find((r) => !r.visible) || ripples[0];
      ring.visible = true;
      ring.position.set(originX, originY, originZ);
      ring.scale.set(0.1, 0.1, 0.1);
      ring.material.opacity = 0.9;

      gsap.to(ring.scale, {
        x: maxScale,
        y: maxScale,
        z: maxScale,
        duration,
        ease: 'power2.out',
      });
      gsap.to(ring.material, {
        opacity: 0,
        duration,
        ease: 'power2.out',
        onComplete: () => {
          ring.visible = false;
        },
      });
    };

    // Splash Particles (Subtle droplets)
    const splashCount = 18;
    const splashGeo = new THREE.DodecahedronGeometry(0.06);
    const splashMat = new THREE.MeshStandardMaterial({
      color: 0xecfeff,
      roughness: 0.1,
      metalness: 0.1,
      transparent: true,
      opacity: 0.85,
    });
    const splashGroup = new THREE.Group();
    const splashMeshes = [];
    for (let i = 0; i < splashCount; i++) {
      const drop = new THREE.Mesh(splashGeo, splashMat);
      drop.visible = false;
      splashMeshes.push(drop);
      splashGroup.add(drop);
    }
    scene.add(splashGroup);

    const triggerSplash = (cx, cy, cz) => {
      splashMeshes.forEach((drop) => {
        drop.visible = true;
        drop.position.set(cx, cy, cz);
        const angle = Math.random() * Math.PI * 2;
        const speed = 0.6 + Math.random() * 1.4;
        const targetX = cx + Math.cos(angle) * speed;
        const targetZ = cz + Math.sin(angle) * speed;
        const targetY = cy + 0.8 + Math.random() * 1.2;

        gsap.to(drop.position, {
          x: targetX,
          y: targetY,
          z: targetZ,
          duration: 0.45 + Math.random() * 0.25,
          ease: 'power1.out',
          onComplete: () => {
            gsap.to(drop.position, {
              y: cy - 0.2,
              duration: 0.5,
              ease: 'power2.in',
              onComplete: () => {
                drop.visible = false;
              },
            });
          },
        });
      });
    };

    // Duck Container Object
    const duckPivot = new THREE.Group();
    scene.add(duckPivot);

    let duckModel = null;
    const clock = new THREE.Clock();
    let scrollTriggerInstance = null;
    let diveTimeline = null;

    // Load authentic GLB model
    const loader = new GLTFLoader();
    loader.load(
      '/rubber_duck.glb',
      (gltf) => {
        duckModel = gltf.scene;
        const duckScale = window.innerWidth < 768 ? 0.34 : 0.5;
        duckModel.scale.setScalar(duckScale);
        duckPivot.add(duckModel);

        // Initial Pose: Above Header / Diving board ready to jump
        duckPivot.position.set(2.4, 4.2, 0);
        duckPivot.rotation.set(-0.2, -0.6, 0.15);

        // If reduced motion is requested, place directly into resting water pose
        if (motionDisabled) {
          duckPivot.position.set(2.1, -0.65, 0);
          duckPivot.rotation.set(0, -0.3, 0);
          enteredWaterRef.current = true;
          return;
        }

        // Jump sequence: diving from header into pool water
        diveTimeline = gsap.timeline({
          delay: 0.35,
          onComplete: () => {
            enteredWaterRef.current = true;
            triggerRipple(duckPivot.position.x, -0.65, duckPivot.position.z, 5.0, 2.2);
            triggerSplash(duckPivot.position.x, -0.65, duckPivot.position.z);
          },
        });

        // 1. Spring anticipation jump upwards
        diveTimeline.to(duckPivot.position, {
          x: 2.2,
          y: 4.8,
          duration: 0.45,
          ease: 'power2.out',
        });
        diveTimeline.to(
          duckPivot.rotation,
          {
            x: 0.75,
            y: -0.4,
            z: -0.2,
            duration: 0.45,
            ease: 'power2.out',
          },
          '<'
        );

        // 2. High Dive Arc downwards into water
        diveTimeline.to(duckPivot.position, {
          x: 1.8,
          y: -1.2, // Plunge under water line
          duration: 0.85,
          ease: 'power2.in',
        });
        diveTimeline.to(
          duckPivot.rotation,
          {
            x: 1.25,
            y: 0.1,
            z: 0.05,
            duration: 0.85,
            ease: 'power2.in',
          },
          '<'
        );

        // 3. Buoyant bounce back to pool surface (-0.65)
        diveTimeline.to(duckPivot.position, {
          x: 1.7,
          y: -0.5,
          duration: 0.7,
          ease: 'elastic.out(1.2, 0.45)',
        });
        diveTimeline.to(
          duckPivot.rotation,
          {
            x: 0.05,
            y: 0.3,
            z: -0.05,
            duration: 0.8,
            ease: 'elastic.out(1.1, 0.4)',
          },
          '<'
        );

        diveTimeline.to(duckPivot.position, {
          x: 1.6,
          y: -0.65,
          duration: 0.6,
          ease: 'power1.inOut',
        });

        // Coordinate Scroll-Driven Duck Journey through sections
        initScrollAnimation(duckPivot);
      },
      undefined,
      (err) => {
        console.error('Failed to load rubber duck model:', err);
        setLoadError(true);
      }
    );

    // Scroll Choreography
    const initScrollAnimation = (pivot) => {
      // Create a smooth GSAP timeline scrubbed to scroll
      if (motionDisabled) return;
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: document.body,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 1.2,
        },
      });

      scrollTriggerInstance = tl.scrollTrigger;

      // Section 1 -> 2: Swim across hero towards benefits/about (shift to left on RTL)
      tl.to(
        pivot.position,
        {
          x: -2.2,
          y: -0.45,
          z: 0.5,
          ease: 'sine.inOut',
        },
        0.1
      );
      tl.to(
        pivot.rotation,
        {
          x: 0.1,
          y: -1.2,
          z: 0.1,
          ease: 'sine.inOut',
        },
        0.1
      );

      // Section 2 -> 3: Travel towards coaches carousel (center right, buoyant inspection)
      tl.to(
        pivot.position,
        {
          x: 2.4,
          y: -0.7,
          z: -0.2,
          ease: 'sine.inOut',
        },
        0.35
      );
      tl.to(
        pivot.rotation,
        {
          x: -0.05,
          y: 0.9,
          z: -0.08,
          ease: 'sine.inOut',
        },
        0.35
      );

      // Section 3 -> 4: Glide along facilities & Olympic pool lanes (center lane)
      tl.to(
        pivot.position,
        {
          x: 0.0,
          y: -0.5,
          z: 1.2,
          ease: 'sine.inOut',
        },
        0.6
      );
      tl.to(
        pivot.rotation,
        {
          x: 0.15,
          y: 0.0,
          z: 0.0,
          ease: 'sine.inOut',
        },
        0.6
      );

      // Section 4 -> 5: Float towards news & announcements (left side)
      tl.to(
        pivot.position,
        {
          x: -2.3,
          y: -0.6,
          z: 0.2,
          ease: 'sine.inOut',
        },
        0.8
      );
      tl.to(
        pivot.rotation,
        {
          x: 0.0,
          y: -0.85,
          z: 0.1,
          ease: 'sine.inOut',
        },
        0.8
      );

      // Section 5 -> 6: Final CTA pool dock celebration (center stage invitation)
      tl.to(
        pivot.position,
        {
          x: 1.8,
          y: -0.3,
          z: 1.5,
          ease: 'sine.inOut',
        },
        1.0
      );
      tl.to(
        pivot.rotation,
        {
          x: -0.1,
          y: 0.5,
          z: -0.05,
          ease: 'sine.inOut',
        },
        1.0
      );
    };

    // Render Loop with natural bobbing physics
    let animId;
    let lastRippleTime = 0;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      if (duckModel && enteredWaterRef.current) {
        // Natural water buoyancy bobbing (sine harmonic oscillation)
        if (!motionDisabled) {
          duckModel.position.y = Math.sin(elapsedTime * 2.2) * 0.06;
          duckModel.rotation.z = Math.cos(elapsedTime * 1.8) * 0.035;
          duckModel.rotation.y = Math.sin(elapsedTime * 1.2) * 0.02;
        }

        // Periodic gentle swimming ripples
        if (!motionDisabled && elapsedTime - lastRippleTime > 1.6) {
          lastRippleTime = elapsedTime;
          triggerRipple(duckPivot.position.x, duckPivot.position.y - 0.1, duckPivot.position.z, 2.6, 2.0);
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    // Window resize handler
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);

      // Responsive adjustments for mobile viewports
      if (window.innerWidth < 768) {
        camera.position.set(0, 1.0, 9.2);
      } else {
        camera.position.set(0, 1.2, 7.5);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      if (scrollTriggerInstance) scrollTriggerInstance.kill();
      diveTimeline?.kill();
      gsap.killTweensOf(duckPivot.position);
      gsap.killTweensOf(duckPivot.rotation);
      ripples.forEach((ripple) => {
        gsap.killTweensOf(ripple.scale);
        gsap.killTweensOf(ripple.material);
        ripple.geometry.dispose();
        ripple.material.dispose();
      });
      splashMeshes.forEach((drop) => gsap.killTweensOf(drop.position));
      rippleGeo.dispose();
      splashGeo.dispose();
      splashMat.dispose();
      clock.stop();
      renderer.dispose();
      if (renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, [motionDisabled]);

  if (loadError) {
    return null; // Graceful fallback: background water canvas and cards will handle the presentation perfectly
  }

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 pointer-events-none z-10 overflow-hidden"
      aria-hidden="true"
    />
  );
};

export default RubberDuckExperience;
