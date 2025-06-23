import { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sphere, Box, MeshDistortMaterial, Float, Text3D, Center } from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';

interface BacteriaProps {
  position: [number, number, number];
  color: string;
  scale?: number;
}

function Bacteria({ position, color, scale = 1 }: BacteriaProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.5;
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2) * 0.1;
    }
  });

  return (
    <Float speed={1.5} rotationIntensity={0.5} floatIntensity={0.5}>
      <group position={position} scale={scale}>
        <Sphere ref={meshRef} args={[0.5, 32, 16]}>
          <MeshDistortMaterial
            color={color}
            attach="material"
            distort={0.3}
            speed={2}
            roughness={0.2}
            metalness={0.8}
          />
        </Sphere>
        {/* Eyes */}
        <Sphere position={[-0.15, 0.1, 0.4]} args={[0.08, 16, 16]}>
          <meshStandardMaterial color="white" />
        </Sphere>
        <Sphere position={[0.15, 0.1, 0.4]} args={[0.08, 16, 16]}>
          <meshStandardMaterial color="white" />
        </Sphere>
        {/* Pupils */}
        <Sphere position={[-0.15, 0.1, 0.45]} args={[0.04, 16, 16]}>
          <meshStandardMaterial color="black" />
        </Sphere>
        <Sphere position={[0.15, 0.1, 0.45]} args={[0.04, 16, 16]}>
          <meshStandardMaterial color="black" />
        </Sphere>
      </group>
    </Float>
  );
}

function Intestine() {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
    }
  });

  return (
    <group>
      <mesh ref={meshRef}>
        <torusKnotGeometry args={[2, 0.6, 100, 16]} />
        <meshStandardMaterial
          color="#64B5F6"
          roughness={0.4}
          metalness={0.3}
          emissive="#2196F3"
          emissiveIntensity={0.2}
        />
      </mesh>
    </group>
  );
}

function Pill() {
  const groupRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.3;
      groupRef.current.rotation.z = Math.sin(state.clock.elapsedTime) * 0.1;
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={0.8}>
      <group ref={groupRef}>
        {/* Top half */}
        <mesh position={[0, 0.5, 0]}>
          <capsuleGeometry args={[0.5, 1, 4, 16]} />
          <meshStandardMaterial
            color="#FF6B6B"
            roughness={0.2}
            metalness={0.8}
            emissive="#FF6B6B"
            emissiveIntensity={0.3}
          />
        </mesh>
        {/* Bottom half */}
        <mesh position={[0, -0.5, 0]}>
          <capsuleGeometry args={[0.5, 1, 4, 16]} />
          <meshStandardMaterial
            color="#4ECDC4"
            roughness={0.2}
            metalness={0.8}
            emissive="#4ECDC4"
            emissiveIntensity={0.3}
          />
        </mesh>
      </group>
    </Float>
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
    // Reset all
    setShowBacteria(false);
    setShowIntestine(false);
    setShowPill(false);
    
    // Show based on current drawing
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
    }, 100);
    
    if (onSceneReady) {
      onSceneReady();
    }
  }, [currentDrawing, onSceneReady]);

  return (
    <div style={{ width: '100%', height: '400px' }}>
      <Canvas camera={{ position: [0, 0, 8], fov: 50 }}>
        {/* Lighting */}
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <pointLight position={[-10, -10, -10]} intensity={0.5} color="#4ECDC4" />
        <spotLight
          position={[5, 5, 5]}
          angle={0.3}
          penumbra={1}
          intensity={2}
          castShadow
        />
        
        {/* Background */}
        <color attach="background" args={['#f5f5f5']} />
        
        {/* Objects */}
        {showPill && <Pill />}
        
        {showIntestine && <Intestine />}
        
        {showBacteria && (
          <>
            <Bacteria position={[-2, 1, 0]} color="#4CAF50" />
            <Bacteria position={[2, -1, 0]} color="#66BB6A" scale={0.8} />
            <Bacteria position={[0, 0, 1]} color="#81C784" scale={1.2} />
            <Bacteria position={[-1, -1.5, -1]} color="#4CAF50" scale={0.9} />
            <Bacteria position={[1.5, 1.5, -0.5]} color="#66BB6A" scale={1.1} />
          </>
        )}
        
        <OrbitControls
          enablePan={false}
          enableZoom={false}
          maxPolarAngle={Math.PI / 2}
          minPolarAngle={Math.PI / 2}
        />
      </Canvas>
    </div>
  );
}