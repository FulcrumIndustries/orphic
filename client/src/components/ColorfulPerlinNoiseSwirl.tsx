import React, { useRef, useEffect } from "react";
import * as THREE from "three";

// Shader code for the refined Perlin noise swirl effect
const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  uniform float time;
  varying vec2 vUv;
  
  // Classic Perlin noise implementation
  vec3 mod289(vec3 x) {
    return x - floor(x * (1.0 / 289.0)) * 289.0;
  }
  
  vec4 mod289(vec4 x) {
    return x - floor(x * (1.0 / 289.0)) * 289.0;
  }
  
  vec4 permute(vec4 x) {
    return mod289(((x*34.0)+1.0)*x);
  }
  
  vec4 taylorInvSqrt(vec4 r) {
    return 1.79284291400159 - 0.85373472095314 * r;
  }
  
  vec3 fade(vec3 t) {
    return t*t*t*(t*(t*6.0-15.0)+10.0);
  }
  
  float cnoise(vec3 P) {
    vec3 Pi0 = floor(P);
    vec3 Pi1 = Pi0 + vec3(1.0);
    Pi0 = mod289(Pi0);
    Pi1 = mod289(Pi1);
    vec3 Pf0 = fract(P);
    vec3 Pf1 = Pf0 - vec3(1.0);
    vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
    vec4 iy = vec4(Pi0.yy, Pi1.yy);
    vec4 iz0 = Pi0.zzzz;
    vec4 iz1 = Pi1.zzzz;
  
    vec4 ixy = permute(permute(ix) + iy);
    vec4 ixy0 = permute(ixy + iz0);
    vec4 ixy1 = permute(ixy + iz1);
  
    vec4 gx0 = ixy0 * (1.0 / 7.0);
    vec4 gy0 = fract(floor(gx0) * (1.0 / 7.0)) - 0.5;
    gx0 = fract(gx0);
    vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
    vec4 sz0 = step(gz0, vec4(0.0));
    gx0 -= sz0 * (step(0.0, gx0) - 0.5);
    gy0 -= sz0 * (step(0.0, gy0) - 0.5);
  
    vec4 gx1 = ixy1 * (1.0 / 7.0);
    vec4 gy1 = fract(floor(gx1) * (1.0 / 7.0)) - 0.5;
    gx1 = fract(gx1);
    vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
    vec4 sz1 = step(gz1, vec4(0.0));
    gx1 -= sz1 * (step(0.0, gx1) - 0.5);
    gy1 -= sz1 * (step(0.0, gy1) - 0.5);
  
    vec3 g000 = vec3(gx0.x,gy0.x,gz0.x);
    vec3 g100 = vec3(gx0.y,gy0.y,gz0.y);
    vec3 g010 = vec3(gx0.z,gy0.z,gz0.z);
    vec3 g110 = vec3(gx0.w,gy0.w,gz0.w);
    vec3 g001 = vec3(gx1.x,gy1.x,gz1.x);
    vec3 g101 = vec3(gx1.y,gy1.y,gz1.y);
    vec3 g011 = vec3(gx1.z,gy1.z,gz1.z);
    vec3 g111 = vec3(gx1.w,gy1.w,gz1.w);
  
    vec4 norm0 = taylorInvSqrt(vec4(dot(g000, g000), dot(g010, g010), dot(g100, g100), dot(g110, g110)));
    g000 *= norm0.x;
    g010 *= norm0.y;
    g100 *= norm0.z;
    g110 *= norm0.w;
    vec4 norm1 = taylorInvSqrt(vec4(dot(g001, g001), dot(g011, g011), dot(g101, g101), dot(g111, g111)));
    g001 *= norm1.x;
    g011 *= norm1.y;
    g101 *= norm1.z;
    g111 *= norm1.w;
  
    float n000 = dot(g000, Pf0);
    float n100 = dot(g100, vec3(Pf1.x, Pf0.yz));
    float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z));
    float n110 = dot(g110, vec3(Pf1.xy, Pf0.z));
    float n001 = dot(g001, vec3(Pf0.xy, Pf1.z));
    float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));
    float n011 = dot(g011, vec3(Pf0.x, Pf1.yz));
    float n111 = dot(g111, Pf1);
  
    vec3 fade_xyz = fade(Pf0);
    vec4 n_z = mix(vec4(n000, n100, n010, n110), vec4(n001, n101, n011, n111), fade_xyz.z);
    vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);
    float n_xyz = mix(n_yz.x, n_yz.y, fade_xyz.x); 
    return 2.2 * n_xyz;
  }
  
  // Function to blend RGB colors
  vec3 blendColors(vec3 base, vec3 blend, float opacity) {
    return base * (1.0 - opacity) + blend * opacity;
  }
  
  void main() {
    // Create coordinates centered around the middle
    vec2 p = vUv * 2.0 - 1.0;
    
    // Calculate angle and distance from center
    float angle = atan(p.y, p.x);
    float radius = length(p);
    
    // Enhanced rotation with time
    float rotationSpeed = 0.2;
    float rotationAngle = time * rotationSpeed;
    
    // Rotate the coordinates
    float s = sin(rotationAngle);
    float c = cos(rotationAngle);
    vec2 rotatedP = vec2(
      p.x * c - p.y * s,
      p.x * s + p.y * c
    );
    
    // Create the swirl effect
    float swirl = 4.0; // Increased swirl intensity
    float noiseScale = 2.5; // Scale of the noise
    float flowSpeed = 0.15; // Flow animation speed
    
    // Modify angle based on radius to create swirl
    float swirlAngle = angle + swirl * pow(radius, 0.8) + rotationAngle * 0.5;
    
    // Use noise to create turbulent flow
    float noise = cnoise(vec3(
      radius * cos(swirlAngle) * noiseScale,
      radius * sin(swirlAngle) * noiseScale,
      time * flowSpeed
    ));
    
    // Secondary subtle noise for detail
    float detailNoise = cnoise(vec3(
      radius * cos(swirlAngle) * noiseScale * 3.0,
      radius * sin(swirlAngle) * noiseScale * 3.0,
      time * flowSpeed * 1.2 + 10.0
    )) * 0.3;
    
    // Combine noise
    float finalNoise = noise + detailNoise;
    
    // Subtle color base with less variation
    vec3 darkBlue = vec3(0.05, 0.1, 0.2);
    vec3 midBlue = vec3(0.1, 0.2, 0.4);
    vec3 lightBlue = vec3(0.2, 0.4, 0.7);
    vec3 accent = vec3(0.3, 0.5, 0.8);
    
    // Apply sine wave to time for smoother color cycling
    float colorCycle = sin(time * 0.1) * 0.5 + 0.5;
    
    // Blend base colors based on noise
    vec3 baseColor;
    if (finalNoise < -0.2) {
      baseColor = mix(darkBlue, midBlue, (finalNoise + 1.0) * 0.5);
    } else if (finalNoise < 0.2) {
      baseColor = mix(midBlue, lightBlue, (finalNoise + 0.2) / 0.4);
    } else {
      baseColor = mix(lightBlue, accent, (finalNoise - 0.2) / 0.8);
    }
    
    // Apply subtle color variation based on angle and time
    float angleVar = (sin(angle * 3.0 + time * 0.2) * 0.5 + 0.5) * 0.15;
    vec3 color = blendColors(baseColor, accent, angleVar);
    
    // Add subtle highlights in the flow direction
    float highlight = max(0.0, finalNoise * 1.2);
    color += vec3(0.1, 0.15, 0.2) * highlight * (sin(time * 0.3) * 0.25 + 0.75);
    
    // Vignette effect
    float vignette = 1.0 - smoothstep(0.5, 1.5, radius);
    color *= vignette;
    
    // Additional subtle glow in the center
    float centerGlow = (1.0 - min(1.0, radius * 2.0)) * 0.2;
    color += vec3(0.1, 0.2, 0.4) * centerGlow;
    
    gl_FragColor = vec4(color, 1.0);
  }
`;

const ColorfulPerlinNoiseSwirl: React.FC = () => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.OrthographicCamera | null>(null);
  const materialRef = useRef<THREE.ShaderMaterial | null>(null);
  const frameIdRef = useRef<number | null>(null);
  const timeRef = useRef<number>(0); // Added to keep track of time independently
  const hasInitialized = useRef<boolean>(false);

  // Helper function to remove any existing canvas elements
  const cleanupExistingCanvas = (container: HTMLElement) => {
    // Find and remove any existing canvas elements
    const existingCanvases = container.querySelectorAll("canvas");
    if (existingCanvases.length > 0) {
      console.log(
        `Found ${existingCanvases.length} existing canvas(es), removing them before initialization`
      );
      existingCanvases.forEach((canvas) => {
        container.removeChild(canvas);
      });
    }
  };

  // Set up the Three.js scene
  useEffect(() => {
    // Check if we've already initialized this component or if the ref isn't ready
    if (!canvasRef.current || hasInitialized.current) return;

    // Mark as initialized to prevent duplicate setup
    hasInitialized.current = true;

    console.log("Initializing ColorfulPerlinNoiseSwirl animation");

    // Clean up any existing canvas elements (failsafe)
    cleanupExistingCanvas(canvasRef.current);

    // Initialize scene, camera, and renderer
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
    camera.position.z = 1;
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0); // Transparent background
    canvasRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Create plane with shader material
    const geometry = new THREE.PlaneGeometry(2, 2);
    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        time: { value: 0.0 },
      },
      transparent: true,
    });
    materialRef.current = material;

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    // Handle window resize
    const handleResize = () => {
      if (!rendererRef.current) return;
      rendererRef.current.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", handleResize);

    // Animation loop - using timestamp-based animation
    const animate = (timestamp: number) => {
      if (
        !materialRef.current ||
        !rendererRef.current ||
        !sceneRef.current ||
        !cameraRef.current
      ) {
        frameIdRef.current = requestAnimationFrame(animate);
        return;
      }

      // Increment time based on timestamp to ensure smooth animation
      timeRef.current += 0.01; // Use a constant increment for consistent animation
      materialRef.current.uniforms.time.value = timeRef.current;

      rendererRef.current.render(sceneRef.current, cameraRef.current);
      frameIdRef.current = requestAnimationFrame(animate);
    };

    // Start the animation
    frameIdRef.current = requestAnimationFrame(animate);
    console.log("Animation started");

    // Cleanup on unmount
    return () => {
      if (frameIdRef.current) {
        cancelAnimationFrame(frameIdRef.current);
        console.log("Animation stopped");
      }
      window.removeEventListener("resize", handleResize);

      if (rendererRef.current) {
        rendererRef.current.dispose();
      }

      geometry.dispose();

      if (materialRef.current) {
        materialRef.current.dispose();
      }

      if (canvasRef.current && rendererRef.current?.domElement) {
        canvasRef.current.removeChild(rendererRef.current.domElement);
      }

      // Reset initialization flag when component unmounts
      hasInitialized.current = false;
    };
  }, []);

  return <div ref={canvasRef} className="absolute inset-0 z-0" />;
};

export default ColorfulPerlinNoiseSwirl;
