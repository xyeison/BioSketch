import { useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { 
  Text, 
  Float, 
  Environment,
  PerspectiveCamera,
  RoundedBox,
  Sphere,
  Torus,
  Cone,
  Box,
  Ring,
  MeshDistortMaterial,
  MeshTransmissionMaterial,
  Sparkles,
  Cloud,
  Stars
} from '@react-three/drei';
import { EffectComposer, Bloom, DepthOfField, Noise } from '@react-three/postprocessing';
import * as THREE from 'three';

// Componente para el probiótico
function Probiotic() {
  const ref = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y = state.clock.elapsedTime * 0.3;
      ref.current.position.y = Math.sin(state.clock.elapsedTime) * 0.2;
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.5}>
      <group ref={ref}>
        <RoundedBox args={[1.5, 3, 1.5]} radius={0.5} smoothness={4}>
          <meshPhysicalMaterial
            color="#FF6B6B"
            emissive="#FF4444"
            emissiveIntensity={0.2}
            metalness={0.3}
            roughness={0.1}
            clearcoat={1}
            clearcoatRoughness={0}
          />
        </RoundedBox>
        <Text
          position={[0, 0, 0.8]}
          fontSize={0.3}
          color="white"
          anchorX="center"
          anchorY="middle"
        >
          ProBio+
        </Text>
        <Sparkles count={30} scale={3} size={2} speed={0.5} color="white" />
      </group>
    </Float>
  );
}

// Sistema digestivo saludable
function HealthyIntestine() {
  const ref = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
    }
  });

  return (
    <group>
      <mesh ref={ref}>
        <torusKnotGeometry args={[2, 0.6, 128, 16]} />
        <meshPhysicalMaterial
          color="#4ECDC4"
          emissive="#2196F3"
          emissiveIntensity={0.3}
          metalness={0.2}
          roughness={0.3}
          clearcoat={0.5}
        />
      </mesh>
      <Sparkles count={50} scale={5} size={1} speed={0.3} color="#4ECDC4" />
    </group>
  );
}

// Intestino inflamado
function InflamedIntestine() {
  const ref = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (ref.current) {
      const time = state.clock.elapsedTime;
      ref.current.scale.x = 1 + Math.sin(time * 2) * 0.1;
      ref.current.scale.y = 1 + Math.cos(time * 2) * 0.1;
    }
  });

  return (
    <group>
      <mesh ref={ref}>
        <torusKnotGeometry args={[2, 0.8, 128, 16]} />
        <MeshDistortMaterial
          color="#FF4444"
          emissive="#CC0000"
          emissiveIntensity={0.5}
          distort={0.3}
          speed={2}
          roughness={0.5}
        />
      </mesh>
      <Sparkles count={30} scale={5} size={2} speed={1} color="#FF6666" />
    </group>
  );
}

// Bacterias buenas
function GoodBacteria({ position }: { position: [number, number, number] }) {
  return (
    <Float speed={3} floatIntensity={2}>
      <group position={position}>
        <Sphere args={[0.5, 32, 16]}>
          <meshPhysicalMaterial
            color="#4CAF50"
            emissive="#2E7D32"
            emissiveIntensity={0.5}
            metalness={0.8}
            roughness={0.2}
            clearcoat={1}
          />
        </Sphere>
        <Text
          position={[0, 0, 0.6]}
          fontSize={0.5}
          color="white"
        >
          😊
        </Text>
      </group>
    </Float>
  );
}

// Bacterias malas
function BadBacteria({ position }: { position: [number, number, number] }) {
  const ref = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.z = state.clock.elapsedTime * 2;
    }
  });

  return (
    <group position={position}>
      <mesh ref={ref}>
        <coneGeometry args={[0.5, 1, 6]} />
        <meshPhysicalMaterial
          color="#E91E63"
          emissive="#880E4F"
          emissiveIntensity={0.5}
          metalness={0.5}
          roughness={0.3}
        />
      </mesh>
      <Text
        position={[0, 0, 0.6]}
        fontSize={0.5}
        color="white"
      >
        😈
      </Text>
    </group>
  );
}

// Batalla entre bacterias
function BacterialBattle() {
  return (
    <group>
      {/* Bacterias buenas */}
      <GoodBacteria position={[-2, 1, 0]} />
      <GoodBacteria position={[-2.5, -1, 0]} />
      <GoodBacteria position={[-1.5, 0, 1]} />
      
      {/* Bacterias malas */}
      <BadBacteria position={[2, 1, 0]} />
      <BadBacteria position={[2.5, -1, 0]} />
      <BadBacteria position={[1.5, 0, -1]} />
      
      {/* Efectos de batalla */}
      <Sparkles count={100} scale={6} size={3} speed={2} color="#FFD700" />
    </group>
  );
}

// Sistema inmune / Defensas
function ImmuneSystem() {
  return (
    <group>
      <Float speed={1}>
        <Ring args={[2, 2.5, 32]} rotation={[Math.PI / 2, 0, 0]}>
          <meshPhysicalMaterial
            color="#2196F3"
            emissive="#1565C0"
            emissiveIntensity={0.5}
            metalness={0.8}
            roughness={0.1}
            transparent
            opacity={0.8}
          />
        </Ring>
      </Float>
      <Sphere args={[1.5, 32, 16]}>
        <MeshTransmissionMaterial
          color="#64B5F6"
          transmission={0.9}
          thickness={2}
          roughness={0.1}
          chromaticAberration={0.1}
          anisotropicBlur={0.5}
        />
      </Sphere>
      <Text fontSize={1} color="#2196F3">🛡️</Text>
    </group>
  );
}

// Proceso digestivo
function DigestiveProcess() {
  const groupRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.2;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Estómago */}
      <mesh position={[0, 2, 0]}>
        <sphereGeometry args={[1, 32, 16]} />
        <meshPhysicalMaterial color="#FFB74D" emissive="#F57C00" emissiveIntensity={0.3} />
      </mesh>
      
      {/* Intestino */}
      <mesh position={[0, -1, 0]}>
        <torusGeometry args={[1.5, 0.5, 16, 32]} />
        <meshPhysicalMaterial color="#4FC3F7" emissive="#0288D1" emissiveIntensity={0.3} />
      </mesh>
      
      {/* Flujo de nutrientes */}
      <Sparkles count={50} scale={4} size={2} speed={1} color="#FFD700" />
    </group>
  );
}

// Alivio / Bienestar
function Relief() {
  return (
    <group>
      <Float speed={0.5}>
        <Text fontSize={3} color="#4CAF50">😌</Text>
      </Float>
      <Cloud
        opacity={0.5}
        speed={0.4}
        width={10}
        depth={1.5}
        segments={20}
      />
      <Stars radius={100} depth={50} count={1000} factor={4} fade speed={1} />
    </group>
  );
}

interface DynamicVisualizationProps {
  scene: string;
}

export default function DynamicVisualization({ scene }: DynamicVisualizationProps) {
  const renderScene = () => {
    switch(scene) {
      case 'probiotico':
        return <Probiotic />;
      case 'intestino':
        return <HealthyIntestine />;
      case 'intestino_inflamado':
        return <InflamedIntestine />;
      case 'bacterias_buenas':
        return (
          <>
            <GoodBacteria position={[-2, 0, 0]} />
            <GoodBacteria position={[2, 0, 0]} />
            <GoodBacteria position={[0, 2, 0]} />
            <GoodBacteria position={[0, -2, 0]} />
          </>
        );
      case 'bacterias_malas':
        return (
          <>
            <BadBacteria position={[-2, 0, 0]} />
            <BadBacteria position={[2, 0, 0]} />
            <BadBacteria position={[0, 2, 0]} />
            <BadBacteria position={[0, -2, 0]} />
          </>
        );
      case 'batalla':
        return <BacterialBattle />;
      case 'defensas':
        return <ImmuneSystem />;
      case 'digestion':
        return <DigestiveProcess />;
      case 'alivio':
        return <Relief />;
      default:
        return <Probiotic />;
    }
  };

  return (
    <div style={{ width: '100%', height: '600px', borderRadius: '20px', overflow: 'hidden' }}>
      <Canvas shadows dpr={[1, 2]}>
        <PerspectiveCamera makeDefault position={[0, 0, 8]} fov={45} />
        
        {/* Iluminación dinámica */}
        <ambientLight intensity={0.3} />
        <spotLight
          position={[10, 10, 10]}
          angle={0.15}
          penumbra={1}
          intensity={1}
          castShadow
        />
        <pointLight position={[-10, -10, -10]} intensity={0.5} color="#667eea" />
        
        {/* Fondo dinámico */}
        <color attach="background" args={['#000814']} />
        <Stars radius={100} depth={50} count={5000} factor={4} fade speed={1} />
        
        {/* Environment para reflejos */}
        <Environment preset="city" />
        
        {/* Escena dinámica */}
        {renderScene()}
        
        {/* Post-processing mejorado */}
        <EffectComposer>
          <Bloom
            intensity={0.8}
            luminanceThreshold={0.3}
            luminanceSmoothing={0.9}
          />
          <DepthOfField
            focusDistance={0}
            focalLength={0.02}
            bokehScale={2}
            height={480}
          />
          <Noise opacity={0.02} />
        </EffectComposer>
      </Canvas>
    </div>
  );
}