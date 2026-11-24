"use client";

import React, { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, Environment, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import type { WheelFinish, WheelStyle } from "@/db/schema";

interface WheelStudio3DProps {
  paintHex: string;
  paintFinish: string;
  wheelStyle: WheelStyle;
  wheelFinish: WheelFinish;
  sizeInches: number;
  reducedMotion?: boolean;
}

const FINISH_MATERIALS: Record<
  WheelFinish,
  { color: string; metalness: number; roughness: number; accent: string }
> = {
  silver: { color: "#dcdfe4", metalness: 0.92, roughness: 0.16, accent: "#f4f6f9" },
  bicolor: { color: "#e5e8ed", metalness: 0.94, roughness: 0.14, accent: "#1b1d22" },
  anthracite: { color: "#5e646e", metalness: 0.88, roughness: 0.24, accent: "#888f9b" },
  titanium: { color: "#9da2aa", metalness: 0.9, roughness: 0.2, accent: "#cfd4dc" },
  bronze: { color: "#a5855c", metalness: 0.86, roughness: 0.24, accent: "#cfb085" },
  "matte-black": { color: "#26292f", metalness: 0.55, roughness: 0.52, accent: "#3d424b" },
  "gloss-black": { color: "#191b20", metalness: 0.85, roughness: 0.12, accent: "#737a86" },
};

function SculptedWheelAssembly({
  paintHex,
  paintFinish,
  wheelStyle,
  wheelFinish,
  sizeInches,
  reducedMotion,
}: WheelStudio3DProps) {
  const wheelRef = useRef<THREE.Group>(null);
  const finishMat = FINISH_MATERIALS[wheelFinish] ?? FINISH_MATERIALS.silver;

  const isMatte = paintFinish.toLowerCase().includes("mat");
  const isSatin = paintFinish.toLowerCase().includes("satin");

  // Scale rim radius relative to tire so 17" -> 21" changes rim-to-sidewall proportions visibly
  const rimRadius = useMemo(
    () => 1.05 + (Math.min(21, Math.max(17, sizeInches)) - 17) * 0.055,
    [sizeInches]
  );
  const tireOuterRadius = 1.56;
  const tireTube = (tireOuterRadius - rimRadius) * 0.62;
  const tireMajor = rimRadius + tireTube * 0.72;

  useFrame((_, delta) => {
    if (!reducedMotion && wheelRef.current) {
      wheelRef.current.rotation.z -= delta * 0.28;
    }
  });

  const spokes = useMemo(() => {
    if (wheelStyle === "sport-5") {
      return Array.from({ length: 5 }).map((_, i) => ({
        angle: (i * Math.PI * 2) / 5,
        width: 0.17,
        skew: 0,
        dual: false,
      }));
    }
    if (wheelStyle === "aero-5") {
      return Array.from({ length: 5 }).map((_, i) => ({
        angle: (i * Math.PI * 2) / 5,
        width: 0.24,
        skew: 0.14,
        dual: false,
      }));
    }
    if (wheelStyle === "diamond-10") {
      return Array.from({ length: 10 }).map((_, i) => ({
        angle: (i * Math.PI * 2) / 10,
        width: 0.095,
        skew: 0,
        dual: false,
      }));
    }
    if (wheelStyle === "turbine-15") {
      return Array.from({ length: 15 }).map((_, i) => ({
        angle: (i * Math.PI * 2) / 15,
        width: 0.068,
        skew: 0.22,
        dual: false,
      }));
    }
    // forged-y (5 Y-shaped twin spokes)
    return Array.from({ length: 5 }).map((_, i) => ({
      angle: (i * Math.PI * 2) / 5,
      width: 0.078,
      skew: 0,
      dual: true,
    }));
  }, [wheelStyle]);

  return (
    <group position={[0, 0.12, 0]} rotation={[0.05, -0.45, 0]}>
      {/* Sculpted Painted Fender Arch Sample behind/above wheel — live clearcoat paint preview */}
      <group position={[0, 0.02, -0.18]}>
        <mesh rotation={[0, 0, Math.PI * 0.12]} castShadow receiveShadow>
          <torusGeometry args={[1.92, 0.26, 36, 96, Math.PI * 0.76]} />
          <meshPhysicalMaterial
            color={paintHex}
            metalness={isMatte ? 0.35 : 0.72}
            roughness={isMatte ? 0.48 : isSatin ? 0.28 : 0.12}
            clearcoat={isMatte ? 0.1 : isSatin ? 0.45 : 1.0}
            clearcoatRoughness={isMatte ? 0.5 : 0.08}
          />
        </mesh>
        {/* Subtle brushed chrome trim accent on fender lip */}
        <mesh rotation={[0, 0, Math.PI * 0.14]} position={[0, 0, 0.19]}>
          <torusGeometry args={[1.71, 0.022, 16, 80, Math.PI * 0.72]} />
          <meshStandardMaterial color="#cfd4dc" metalness={0.95} roughness={0.14} />
        </mesh>
      </group>

      {/* Stationary Brake Caliper (Racing Vermilion) */}
      <group position={[rimRadius * 0.54, 0.18, -0.04]} rotation={[0, 0, -0.25]}>
        <mesh castShadow>
          <boxGeometry args={[0.32, 0.68, 0.32]} />
          <meshPhysicalMaterial
            color="#c83e2b"
            metalness={0.3}
            roughness={0.22}
            clearcoat={0.9}
          />
        </mesh>
        <mesh position={[0.05, 0, 0.17]}>
          <boxGeometry args={[0.14, 0.42, 0.02]} />
          <meshStandardMaterial color="#f4f1ea" metalness={0.2} roughness={0.4} />
        </mesh>
      </group>

      {/* Rotating Wheel, Tire, Rotor & Spokes */}
      <group ref={wheelRef}>
        {/* Tire */}
        <mesh castShadow receiveShadow>
          <torusGeometry args={[tireMajor, tireTube, 36, 96]} />
          <meshStandardMaterial color="#181a1e" roughness={0.78} metalness={0.05} />
        </mesh>

        {/* Outer Tire Shoulder Cylinder for realistic tread width */}
        <mesh rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[tireOuterRadius - 0.03, tireOuterRadius - 0.03, 0.72, 72, 1, true]} />
          <meshStandardMaterial color="#141619" roughness={0.85} metalness={0.05} side={THREE.DoubleSide} />
        </mesh>

        {/* Alloy Outer Lip */}
        <mesh position={[0, 0, 0.27]} castShadow>
          <torusGeometry args={[rimRadius, 0.055, 24, 96]} />
          <meshStandardMaterial
            color={finishMat.color}
            metalness={finishMat.metalness}
            roughness={finishMat.roughness}
          />
        </mesh>

        {/* Alloy Inner Barrel */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[rimRadius - 0.02, rimRadius - 0.04, 0.62, 64, 1, true]} />
          <meshStandardMaterial
            color={finishMat.accent}
            metalness={0.78}
            roughness={0.32}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* Ventilated Steel Brake Rotor */}
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -0.05]}>
          <cylinderGeometry args={[rimRadius * 0.78, rimRadius * 0.78, 0.08, 64]} />
          <meshStandardMaterial color="#7e848e" metalness={0.85} roughness={0.34} />
        </mesh>

        {/* Spokes */}
        {spokes.map((s, idx) => {
          const spokeLen = rimRadius - 0.24;
          if (s.dual) {
            // Forged Y-Spoke architecture
            return (
              <group key={idx} rotation={[0, 0, s.angle]}>
                <mesh position={[0, 0.34, 0.22]} castShadow>
                  <boxGeometry args={[0.12, 0.36, 0.09]} />
                  <meshStandardMaterial
                    color={finishMat.color}
                    metalness={finishMat.metalness}
                    roughness={finishMat.roughness}
                  />
                </mesh>
                <mesh
                  position={[-0.14, 0.45 + spokeLen * 0.34, 0.23]}
                  rotation={[0, 0, 0.26]}
                  castShadow
                >
                  <boxGeometry args={[s.width, spokeLen * 0.62, 0.08]} />
                  <meshStandardMaterial
                    color={finishMat.color}
                    metalness={finishMat.metalness}
                    roughness={finishMat.roughness}
                  />
                </mesh>
                <mesh
                  position={[0.14, 0.45 + spokeLen * 0.34, 0.23]}
                  rotation={[0, 0, -0.26]}
                  castShadow
                >
                  <boxGeometry args={[s.width, spokeLen * 0.62, 0.08]} />
                  <meshStandardMaterial
                    color={finishMat.color}
                    metalness={finishMat.metalness}
                    roughness={finishMat.roughness}
                  />
                </mesh>
              </group>
            );
          }

          return (
            <group key={idx} rotation={[0, 0, s.angle]}>
              <mesh
                position={[s.skew * 0.4, 0.24 + spokeLen * 0.5, 0.22]}
                rotation={[0, 0, -s.skew]}
                castShadow
              >
                <boxGeometry args={[s.width, spokeLen, 0.09]} />
                <meshStandardMaterial
                  color={wheelFinish === "bicolor" && idx % 2 === 1 ? finishMat.accent : finishMat.color}
                  metalness={finishMat.metalness}
                  roughness={finishMat.roughness}
                />
              </mesh>
            </group>
          );
        })}

        {/* Center Hub Cap & 5 Machined Lug Bolts */}
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.2]}>
          <cylinderGeometry args={[0.28, 0.32, 0.16, 36]} />
          <meshStandardMaterial
            color={finishMat.accent}
            metalness={0.85}
            roughness={0.22}
          />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.29]}>
          <cylinderGeometry args={[0.13, 0.13, 0.04, 32]} />
          <meshStandardMaterial color="#141518" metalness={0.6} roughness={0.3} />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.315]}>
          <torusGeometry args={[0.085, 0.014, 12, 32]} />
          <meshStandardMaterial color="#c83e2b" metalness={0.5} roughness={0.25} />
        </mesh>

        {Array.from({ length: 5 }).map((_, i) => {
          const a = (i * Math.PI * 2) / 5;
          return (
            <mesh
              key={i}
              position={[Math.cos(a) * 0.2, Math.sin(a) * 0.2, 0.27]}
              rotation={[Math.PI / 2, 0, 0]}
            >
              <cylinderGeometry args={[0.026, 0.026, 0.06, 6]} />
              <meshStandardMaterial color="#d8dde4" metalness={0.95} roughness={0.15} />
            </mesh>
          );
        })}
      </group>
    </group>
  );
}

export default function WheelStudio3D(props: WheelStudio3DProps) {
  return (
    <div className="relative h-full w-full">
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: [0.4, 0.35, 4.7], fov: 36 }}
        gl={{ antialias: true, alpha: true }}
      >
        <color attach="background" args={["#101215"]} />
        <ambientLight intensity={0.45} />
        <spotLight
          position={[4, 6, 5]}
          angle={0.42}
          penumbra={0.9}
          intensity={2.2}
          castShadow
        />
        <directionalLight position={[-5, 3, 2]} intensity={1.1} color="#dce6ff" />
        <pointLight position={[2, -2, 3]} intensity={0.6} color="#ffded7" />

        <Environment preset="studio" />

        <SculptedWheelAssembly {...props} />

        <ContactShadows
          position={[0, -1.52, 0]}
          opacity={0.65}
          scale={8}
          blur={2.4}
          far={3.5}
        />

        <OrbitControls
          enablePan={false}
          enableZoom={true}
          minDistance={3.2}
          maxDistance={6.8}
          minPolarAngle={Math.PI * 0.28}
          maxPolarAngle={Math.PI * 0.68}
          autoRotate={!props.reducedMotion}
          autoRotateSpeed={0.55}
        />
      </Canvas>
    </div>
  );
}
