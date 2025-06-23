import { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { 
  OrbitControls, 
  MeshDistortMaterial, 
  Float, 
  Environment,
  ContactShadows,
  Sparkles,
  PerspectiveCamera,
  MeshTransmissionMaterial
} from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';

interface BacteriaProps {
  position: [number, number, number];
  color: string;
  scale?: number;
}

function Bacteria({ position, color, scale = 1 }: BacteriaProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.5;
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2 + position[0]) * 0.1;
      
      // Escala suave al hover
      const targetScale = hovered ? scale * 1.2 : scale;
      meshRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
    }
  });

  return (
    <Float speed={1.5} rotationIntensity={0.5} floatIntensity={0.5}>
      <group position={position}>
        <mesh 
          ref={meshRef} 
          scale={scale}
          onPointerOver={() => setHovered(true)}
          onPointerOut={() => setHovered(false)}
        >
          <sphereGeometry args={[0.5, 64, 32]} />
          <MeshDistortMaterial
            color={color}
            emissive={color}
            emissiveIntensity={0.5}
            roughness={0.1}
            metalness={0.8}
            distort={0.4}
            speed={2}
            transparent
            opacity={0.9}
          />
        </mesh>
        
        {/* Núcleo brillante */}
        <mesh scale={0.3}>
          <sphereGeometry args={[0.5, 32, 16]} />
          <meshBasicMaterial color="white" />
        </mesh>
        
        {/* Ojos */}
        <group>
          <mesh position={[-0.15, 0.1, 0.4]} scale={0.15}>
            <sphereGeometry />
            <meshStandardMaterial color="white" emissive="white" emissiveIntensity={0.5} />
          </mesh>
          <mesh position={[0.15, 0.1, 0.4]} scale={0.15}>
            <sphereGeometry />
            <meshStandardMaterial color="white" emissive="white" emissiveIntensity={0.5} />
          </mesh>
          {/* Pupilas */}
          <mesh position={[-0.15, 0.1, 0.47]} scale={0.08}>
            <sphereGeometry />
            <meshBasicMaterial color="black" />
          </mesh>
          <mesh position={[0.15, 0.1, 0.47]} scale={0.08}>
            <sphereGeometry />
            <meshBasicMaterial color="black" />
          </mesh>
        </group>
      </group>
    </Float>
  );
}

function Intestine() {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.3) * 0.1;
      meshRef.current.rotation.z = Math.cos(state.clock.elapsedTime * 0.2) * 0.05;
    }
  });

  return (
    <group>
      <mesh ref={meshRef} castShadow receiveShadow>
        <torusKnotGeometry args={[2, 0.8, 256, 32]} />
        <MeshTransmissionMaterial
          backside
          backsideThickness={5}
          thickness={2}
          transmission={0.9}
          chromaticAberration={0.1}
          anisotropicBlur={0.1}
          distortion={0.1}
          distortionScale={0.1}
          temporalDistortion={0.2}
          iridescence={1}
          iridescenceIOR={1}
          iridescenceThicknessRange={[0, 1400]}
          color="#64B5F6"
          emissive="#2196F3"
          emissiveIntensity={0.2}
        />
      </mesh>
      
      {/* Partículas internas */}
      <Sparkles
        count={100}
        scale={4}
        size={2}
        speed={0.5}
        color="#64B5F6"
      />
    </group>
  );
}

function Pill() {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.3;
      groupRef.current.rotation.z = Math.sin(state.clock.elapsedTime) * 0.1;
      
      const scale = hovered ? 1.1 : 1;
      groupRef.current.scale.lerp(new THREE.Vector3(scale, scale, scale), 0.1);
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={0.8}>
      <group 
        ref={groupRef}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        {/* Parte superior */}
        <mesh position={[0, 0.7, 0]} castShadow>
          <capsuleGeometry args={[0.6, 0.8, 8, 32]} />
          <meshPhysicalMaterial
            color="#FF6B6B"
            emissive="#FF6B6B"
            emissiveIntensity={0.2}
            metalness={0.3}
            roughness={0.1}
            clearcoat={1}
            clearcoatRoughness={0}
            reflectivity={1}
            envMapIntensity={1}
          />
        </mesh>
        
        {/* Parte inferior */}
        <mesh position={[0, -0.7, 0]} castShadow>
          <capsuleGeometry args={[0.6, 0.8, 8, 32]} />
          <meshPhysicalMaterial
            color="#4ECDC4"
            emissive="#4ECDC4"
            emissiveIntensity={0.2}
            metalness={0.3}
            roughness={0.1}
            clearcoat={1}
            clearcoatRoughness={0}
            reflectivity={1}
            envMapIntensity={1}
          />
        </mesh>
        
        {/* Línea divisoria brillante */}
        <mesh position={[0, 0, 0]} scale={[1.1, 0.05, 1.1]}>
          <cylinderGeometry args={[0.6, 0.6, 1, 32]} />
          <meshBasicMaterial color="white" />
        </mesh>
        
        {/* Brillo especular */}
        <mesh position={[-0.2, 0.8, 0.4]} scale={[0.3, 0.15, 0.1]}>
          <sphereGeometry />
          <meshBasicMaterial color="white" opacity={0.8} transparent />
        </mesh>
        
        {/* Partículas mágicas alrededor */}
        <Sparkles
          count={50}
          scale={2}
          size={3}
          speed={1}
          color="white"
          opacity={0.5}
        />
      </group>
    </Float>
  );
}

function AnimatedBackground() {
  const { viewport } = useThree();
  
  return (
    <>
      {/* Gradiente de fondo animado */}
      <mesh scale={[viewport.width * 2, viewport.height * 2, 1]} position={[0, 0, -10]}>
        <planeGeometry />
        <meshBasicMaterial>
          <canvasTexture
            attach="map"
            image={(() => {
              const canvas = document.createElement('canvas');
              canvas.width = 512;
              canvas.height = 512;
              const ctx = canvas.getContext('2d')!;
              const gradient = ctx.createRadialGradient(256, 256, 0, 256, 256, 512);
              gradient.addColorStop(0, '#1a0033');
              gradient.addColorStop(0.5, '#0a0a0a');
              gradient.addColorStop(1, '#000000');
              ctx.fillStyle = gradient;
              ctx.fillRect(0, 0, 512, 512);
              return canvas;
            })()}
          />
        </meshBasicMaterial>
      </mesh>
      
      {/* Partículas ambientales */}
      <Sparkles
        count={200}
        scale={[viewport.width, viewport.height, 10]}
        size={1}
        speed={0.2}
        opacity={0.3}
        color="#667eea"
      />
    </>
  );
}

interface Scene3DProps {
  currentDrawing: string;
  onSceneReady?: () => void;
}

export default function Scene3D({ currentDrawing, onSceneReady }: Scene3DProps) {
  const [showBacteria, setShowBacteria] = useState(false);
  const [showIntestine, setShowIntestine] = useState(false);
  const [showPill, setShowPill] = useState(false);
  
  useEffect(() => {
    // Reset all con fade out
    setShowBacteria(false);
    setShowIntestine(false);
    setShowPill(false);
    
    // Show based on current drawing con fade in
    setTimeout(() => {
      switch(currentDrawing) {
        case 'bacterias':
          setShowBacteria(true);
          break;
        case 'intestino':
        case 'intestino_lento':
          setShowIntestine(true);
          break;
        case 'probiotico':
          setShowPill(true);
          break;
        case 'equilibrio':
          setShowIntestine(true);
          setTimeout(() => setShowBacteria(true), 500);
          break;
      }
    }, 300);
    
    if (onSceneReady) {
      onSceneReady();
    }
  }, [currentDrawing, onSceneReady]);

  return (
    <div style={{ width: '100%', height: '500px', borderRadius: '20px', overflow: 'hidden' }}>
      <Canvas shadows dpr={[1, 2]}>
        <PerspectiveCamera makeDefault position={[0, 0, 10]} fov={45} />
        
        {/* Iluminación cinematográfica */}
        <ambientLight intensity={0.2} />
        <spotLight
          position={[10, 10, 10]}
          angle={0.15}
          penumbra={1}
          intensity={1}
          castShadow
          shadow-mapSize={2048}
        />
        <pointLight position={[-10, -10, -10]} intensity={0.5} color="#667eea" />
        <pointLight position={[10, 0, -5]} intensity={0.5} color="#764ba2" />
        
        {/* Fondo animado */}
        <AnimatedBackground />
        
        {/* Environment map para reflejos */}
        <Environment preset="city" />
        
        {/* Objetos con transiciones suaves */}
        <group>
          {showPill && <Pill />}
          
          {showIntestine && <Intestine />}
          
          {showBacteria && (
            <>
              <Bacteria position={[-2.5, 1, 0]} color="#4CAF50" />
              <Bacteria position={[2.5, -1, 0]} color="#66BB6A" scale={0.8} />
              <Bacteria position={[0, 0, 1]} color="#81C784" scale={1.2} />
              <Bacteria position={[-1.5, -1.5, -1]} color="#4CAF50" scale={0.9} />
              <Bacteria position={[1.5, 1.5, -0.5]} color="#66BB6A" scale={1.1} />
            </>
          )}
        </group>
        
        {/* Sombras de contacto */}
        <ContactShadows
          opacity={0.4}
          scale={10}
          blur={2}
          far={4}
          position={[0, -3, 0]}
        />
        
        {/* Controles de órbita suaves */}
        <OrbitControls
          enablePan={false}
          enableZoom={false}
          minPolarAngle={Math.PI / 3}
          maxPolarAngle={Math.PI / 2}
          autoRotate
          autoRotateSpeed={0.5}
        />
        
        {/* Post-processing */}
        <EffectComposer>
          <Bloom
            intensity={0.5}
            luminanceThreshold={0.5}
            luminanceSmoothing={0.9}
          />
          <Vignette
            offset={0.3}
            darkness={0.5}
          />
        </EffectComposer>
      </Canvas>
    </div>
  );
}