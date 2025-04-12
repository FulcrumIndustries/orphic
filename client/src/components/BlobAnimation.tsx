import { useEffect, useRef } from "react";
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

interface BlobAnimationProps {
  progress: number;
  baseColor?: string;
}

const BlobAnimation = ({ progress, baseColor }: BlobAnimationProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInitializedRef = useRef<boolean>(false);

  useEffect(() => {
    // First, let's clear any existing canvases in the container
    if (containerRef.current) {
      while (containerRef.current.firstChild) {
        containerRef.current.removeChild(containerRef.current.firstChild);
      }
    }

    // If no container, reset initialization and return
    if (!containerRef.current) {
      isInitializedRef.current = false;
      return;
    }

    // Reset initialization status when container is empty
    isInitializedRef.current = false;

    // Initialize variables
    let scene: THREE.Scene;
    let camera: THREE.PerspectiveCamera;
    let renderer: THREE.WebGLRenderer;
    let controls: OrbitControls;
    let bloomPass: UnrealBloomPass;
    let bloomComposer: EffectComposer;
    let material: THREE.ShaderMaterial;
    let animationFrameId: number;
    let startTime = Date.now();

    // Define shader code
    const vertexShader = `
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 camPos;
      
      void main() {
        vUv = uv;
        vNormal = normal;
        camPos = cameraPosition;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;

    const fragmentShader = `
      uniform vec4 resolution;
      varying vec3 vNormal;
      uniform sampler2D perlinnoise;
      uniform sampler2D sparknoise;
      uniform float time;
      uniform vec3 color0;
      uniform vec3 color1;
      uniform vec3 color2;
      uniform vec3 color5;
      uniform float progress;
      varying vec3 camPos;
      varying vec2 vUv;

      vec3 rgbcol(vec3 col) {
        return vec3(col.r/255.0, col.g/255.0, col.b/255.0);
      }

      vec2 UnityPolarCoordinates(vec2 UV, vec2 Center, float RadialScale, float LengthScale) {
        vec2 delta = UV - Center;
        float radius = length(delta) * 2.0 * RadialScale;
        float angle = atan(delta.x, delta.y) * 1.0/6.28 * LengthScale;
        return vec2(radius, angle);
      }

      void main() {
        vec2 uv = vUv;
        float pct = distance(vUv, vec2(0.5));
        
        // Colors based on progress
        vec3 baseColor0 = mix(vec3(255, 160, 122), vec3(255, 99, 71), progress/100.0); // Light to dark orange
        vec3 baseColor1 = mix(vec3(255, 127, 80), vec3(255, 69, 0), progress/100.0);   // Medium to dark orange
        vec3 baseColor2 = mix(vec3(255, 99, 71), vec3(220, 20, 60), progress/100.0);   // Red to crimson
        vec3 baseColor5 = mix(vec3(64, 27, 0), vec3(128, 0, 0), progress/100.0);       // Dark orange-brown to dark red
        
        vec3 rgbcolor0 = rgbcol(color0);
        vec3 rgbcolor1 = rgbcol(color1);
        vec3 rgbcolor2 = rgbcol(color2);
        vec3 rgbcolor5 = rgbcol(color5);
        
        // Set solid background with gradient
        float y = smoothstep(0.16, 0.525, pct);
        vec3 backcolor = mix(rgbcolor0, rgbcolor5, y);
        gl_FragColor = vec4(backcolor, 1.0);
        
        // Set polar coordinates
        vec2 center = vec2(0.5);
        vec2 cor = UnityPolarCoordinates(vec2(vUv.x, vUv.y), center, 1.0, 1.0);
        
        // Set textures with animation based on time and progress
        vec2 newUv = vec2(cor.x + time, cor.x * 0.2 + cor.y);
        vec3 noisetex = texture2D(perlinnoise, mod(newUv, 1.0)).rgb;
        vec3 noisetex2 = texture2D(sparknoise, mod(newUv, 1.0)).rgb;
        
        // Animation speed influenced by progress
        float speedFactor = mix(1.0, 2.0, progress / 100.0);
        
        // Set textures tones
        float tone0 = 1.0 - smoothstep(0.3, 0.6, noisetex.r);
        float tone1 = smoothstep(0.3, 0.6, noisetex2.r);
        
        // Set opacity for each tone
        float opacity0 = tone0 < 0.29 ? 0.0 : 1.0;
        float opacity1 = tone1 < 0.49 ? 0.0 : 1.0;
        
        // Set final render with layered effects
        if (opacity1 > 0.0) {
          gl_FragColor = vec4(rgbcolor2, 0.0) * vec4(opacity1);
        } else if (opacity0 > 0.0) {
          gl_FragColor = vec4(rgbcolor1, 0.0) * vec4(opacity0);
        }
        
        // Add intensity based on progress
        gl_FragColor.rgb *= (0.8 + progress/100.0 * 0.4);
      }
    `;

    // Set colors (default orange/red scheme if baseColor not provided)
    const getDefaultColors = () => {
      // Parse baseColor if provided
      let baseColorRGB: number[] | null = null;
      if (baseColor) {
        // Handle different color formats
        if (baseColor.startsWith("#")) {
          const hex = baseColor.slice(1);
          const r = parseInt(hex.slice(0, 2), 16);
          const g = parseInt(hex.slice(2, 4), 16);
          const b = parseInt(hex.slice(4, 6), 16);
          baseColorRGB = [r, g, b];
        } else if (baseColor.startsWith("rgb")) {
          // Extract RGB values from rgb(r,g,b) format
          const rgbValues = baseColor.match(/\d+/g);
          if (rgbValues && rgbValues.length >= 3) {
            baseColorRGB = rgbValues.slice(0, 3).map((v) => parseInt(v));
          }
        }
      }

      // If we have a valid baseColor, use it to influence the color scheme
      if (baseColorRGB) {
        const [r, g, b] = baseColorRGB;

        // Derive color scheme from the base color
        return {
          color0: [
            Math.max(r * 0.1, 10),
            Math.max(g * 0.05, 0),
            Math.max(b * 0.1, 5),
          ], // Dark background
          color1: [
            Math.min(r * 1.2, 255),
            Math.min(g * 0.8, 255),
            Math.min(b * 0.6, 255),
          ], // Medium accent
          color2: [
            Math.min(r * 1.5, 255),
            Math.min(g * 1.2, 255),
            Math.min(b * 0.8, 255),
          ], // Bright highlight
          color5: [
            Math.max(r * 0.3, 20),
            Math.max(g * 0.2, 10),
            Math.max(b * 0.15, 5),
          ], // Dark accent
        };
      }

      // Default color schemes based on progress
      if (progress < 33) {
        return {
          color0: [15, 0, 10], // Dark purple-black
          color1: [213, 60, 5], // Orange-red
          color2: [237, 156, 10], // Gold-orange
          color5: [64, 27, 0], // Dark brown
        };
      } else if (progress < 66) {
        return {
          color0: [20, 0, 10], // Dark purple-black
          color1: [223, 70, 15], // Brighter orange-red
          color2: [247, 166, 20], // Brighter gold-orange
          color5: [74, 37, 10], // Dark brown-red
        };
      } else {
        return {
          color0: [25, 0, 10], // Dark purple-black
          color1: [233, 80, 25], // Bright orange-red
          color2: [257, 176, 30], // Bright gold
          color5: [84, 47, 20], // Brown-red
        };
      }
    };

    // Create scene with postprocessing
    const createScene = () => {
      // Create scene and camera
      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(
        75,
        1, // Square aspect ratio for our widget
        0.1,
        1000
      );
      camera.position.set(0, 0, 2.5);

      // Create renderer
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setClearColor(0x000000, 0);
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(130, 130);

      // Add renderer to DOM
      containerRef.current!.appendChild(renderer.domElement);

      // Setup post-processing
      const renderScene = new RenderPass(scene, camera);
      bloomPass = new UnrealBloomPass(
        new THREE.Vector2(130, 130),
        1.5,
        0.4,
        0.85
      );

      bloomPass.threshold = 0;
      bloomPass.strength = 3.5;
      bloomPass.radius = 0.39;

      bloomComposer = new EffectComposer(renderer);
      bloomComposer.addPass(renderScene);
      bloomComposer.addPass(bloomPass);
    };

    // Create the glowing sphere
    const createSphere = () => {
      const geometry = new THREE.SphereGeometry(1, 30, 30);

      // Load textures
      const textureLoader = new THREE.TextureLoader();
      const perlinTexture = textureLoader.load(
        "https://raw.githubusercontent.com/pizza3/asset/master/noise9.jpg"
      );
      const sparkTexture = textureLoader.load(
        "https://raw.githubusercontent.com/pizza3/asset/master/sparklenoise.jpg"
      );

      // Get colors (use provided baseColor if available)
      const colors = getDefaultColors();

      // Create shader material
      material = new THREE.ShaderMaterial({
        uniforms: {
          time: { value: 0.0 },
          perlinnoise: { value: perlinTexture },
          sparknoise: { value: sparkTexture },
          color0: { value: new THREE.Vector3(...colors.color0) },
          color1: { value: new THREE.Vector3(...colors.color1) },
          color2: { value: new THREE.Vector3(...colors.color2) },
          color5: { value: new THREE.Vector3(...colors.color5) },
          progress: { value: progress },
          resolution: { value: new THREE.Vector4(130, 130, 1, 1) },
        },
        vertexShader,
        fragmentShader,
      });

      const mesh = new THREE.Mesh(geometry, material);
      mesh.scale.set(0.78, 0.78, 0.78);
      scene.add(mesh);
    };

    // Animation loop
    const animate = () => {
      // Make sure we're still initialized (component hasn't unmounted)
      if (!isInitializedRef.current) return;

      const elapsedMilliseconds = Date.now() - startTime;

      // Update time uniform
      if (material) {
        material.uniforms.time.value = elapsedMilliseconds / (1000 * 2);
        material.uniforms.progress.value = progress;

        // Update bloom effect based on progress
        bloomPass.strength = 1.5 + (progress / 100) * 2;
      }

      // Render
      bloomComposer.render();

      // Continue animation loop
      animationFrameId = requestAnimationFrame(animate);
    };

    // Initialize everything
    createScene();
    createSphere();
    isInitializedRef.current = true;
    animate();

    // Clean up on unmount or before re-render
    return () => {
      // Stop the animation loop
      cancelAnimationFrame(animationFrameId);

      // Set initialization to false to prevent further renders
      isInitializedRef.current = false;

      // Dispose of materials and textures
      if (material) {
        if (material.uniforms.perlinnoise?.value) {
          material.uniforms.perlinnoise.value.dispose();
        }
        if (material.uniforms.sparknoise?.value) {
          material.uniforms.sparknoise.value.dispose();
        }
        material.dispose();
      }

      // Dispose of the renderer and composer
      if (renderer) {
        renderer.dispose();
        renderer.forceContextLoss();
        renderer.domElement.remove();
      }

      if (bloomComposer) {
        bloomComposer.dispose();
      }

      // Clear out the container
      if (containerRef.current) {
        while (containerRef.current.firstChild) {
          containerRef.current.removeChild(containerRef.current.firstChild);
        }
      }
    };
  }, [progress, baseColor]);

  return (
    <div
      ref={containerRef}
      className="relative flex items-center justify-center w-[130px] h-[130px] mx-auto"
    />
  );
};

export default BlobAnimation;
