"use client";

import React, { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

function ArchitecturalLightRings() {
  const outerRing = useRef<THREE.Mesh>(null);
  const innerRing = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();
    if (outerRing.current) {
      outerRing.current.rotation.z += delta * 0.06;
      outerRing.current.rotation.x = 1.18 + Math.sin(t * 0.25) * 0.04;
    }
    if (innerRing.current) {
      innerRing.current.rotation.z -= delta * 0.09;
      innerRing.current.rotation.y = Math.cos(t * 0.2) * 0.08;
    }
  });

  return (
    <group position={[1.4, 0.2, -1.5]}>
      <mesh ref={outerRing} rotation={[1.18, 0.22, 0]}>
        <torusGeometry args={[2.55, 0.008, 16, 140]} />
        <meshStandardMaterial
          color="#d8c6a8"
          emissive="#c83e2b"
          emissiveIntensity={0.25}
          metalness={0.9}
          roughness={0.2}
          transparent
          opacity={0.42}
        />
      </mesh>
      <mesh ref={innerRing} rotation={[1.05, -0.3, 0.4]}>
        <torusGeometry args={[1.9, 0.006, 16, 120]} />
        <meshStandardMaterial
          color="#f4f1ea"
          metalness={0.9}
          roughness={0.18}
          transparent
          opacity={0.22}
        />
      </mesh>
    </group>
  );
}

export default function HeroAmbient3D() {
  return (
    <div className="pointer-events-none absolute inset-0 opacity-75">
      <Canvas
        dpr={[1, 1.5]}
        camera={{ position: [0, 0, 6], fov: 40 }}
        gl={{ antialias: true, alpha: true, powerPreference: "low-power" }}
      >
        <ambientLight intensity={0.5} />
        <pointLight position={[4, 4, 4]} intensity={1.2} color="#f5e9d3" />
        <ArchitecturalLightRings />
      </Canvas>
    </div>
  );
}
