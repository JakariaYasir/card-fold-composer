import { useRef, useState, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";
import type { FaceType } from "@/pages/Index";

interface BookCardProps {
  selectedFace: FaceType;
  onFaceSelect: (face: FaceType) => void;
  faceTextures: Record<FaceType, string | null>;
}

export function BookCard({ selectedFace, onFaceSelect, faceTextures }: BookCardProps) {
  const groupRef = useRef<THREE.Group>(null);
  const leftPageRef = useRef<THREE.Group>(null);
  const rightPageRef = useRef<THREE.Group>(null);
  const [hoveredFace, setHoveredFace] = useState<FaceType | null>(null);
  
  // Create textures from data URLs
  const textures = useRef<Record<FaceType, THREE.Texture | null>>({
    "front-left": null,
    "back-left": null,
    "front-right": null,
    "back-right": null,
  });

  useEffect(() => {
    Object.entries(faceTextures).forEach(([face, dataURL]) => {
      if (dataURL && dataURL !== textures.current[face as FaceType]?.userData.dataURL) {
        const texture = new THREE.TextureLoader().load(dataURL);
        texture.flipY = false;
        texture.userData.dataURL = dataURL;
        textures.current[face as FaceType] = texture;
      }
    });
  }, [faceTextures]);

  // Gentle rotation animation
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.1;
    }
  });

  const createFaceMaterial = (face: FaceType) => {
    const isSelected = selectedFace === face;
    const isHovered = hoveredFace === face;
    const texture = textures.current[face];
    
    const baseColor = isSelected ? "#3b82f6" : isHovered ? "#60a5fa" : "#ffffff";
    
    return new THREE.MeshStandardMaterial({
      map: texture,
      color: texture ? "#ffffff" : baseColor,
      roughness: 0.3,
      metalness: 0.1,
      emissive: isSelected ? "#1e40af" : isHovered ? "#2563eb" : "#000000",
      emissiveIntensity: isSelected ? 0.1 : isHovered ? 0.05 : 0,
    });
  };

  const handleFaceClick = (face: FaceType) => {
    onFaceSelect(face);
  };

  // Card dimensions (realistic book proportions)
  const cardWidth = 2.5;
  const cardHeight = 3.5;
  const cardThickness = 0.1;
  const pageThickness = 0.05;

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {/* Left Page */}
      <group ref={leftPageRef} position={[-cardWidth / 4, 0, 0]}>
        {/* Front face of left page */}
        <mesh
          position={[0, 0, pageThickness / 2]}
          onClick={() => handleFaceClick("front-left")}
          onPointerEnter={() => setHoveredFace("front-left")}
          onPointerLeave={() => setHoveredFace(null)}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[cardWidth / 2, cardHeight, pageThickness]} />
          <primitive object={createFaceMaterial("front-left")} attach="material-4" />
          {/* Other faces with neutral material */}
          <meshStandardMaterial attach="material-0" color="#f8f9fa" roughness={0.8} />
          <meshStandardMaterial attach="material-1" color="#f8f9fa" roughness={0.8} />
          <meshStandardMaterial attach="material-2" color="#f8f9fa" roughness={0.8} />
          <meshStandardMaterial attach="material-3" color="#f8f9fa" roughness={0.8} />
          <meshStandardMaterial attach="material-5" color="#e9ecef" roughness={0.8} />
        </mesh>

        {/* Back face of left page */}
        <mesh
          position={[0, 0, -pageThickness / 2]}
          onClick={() => handleFaceClick("back-left")}
          onPointerEnter={() => setHoveredFace("back-left")}
          onPointerLeave={() => setHoveredFace(null)}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[cardWidth / 2, cardHeight, pageThickness]} />
          <meshStandardMaterial attach="material-0" color="#f8f9fa" roughness={0.8} />
          <meshStandardMaterial attach="material-1" color="#f8f9fa" roughness={0.8} />
          <meshStandardMaterial attach="material-2" color="#f8f9fa" roughness={0.8} />
          <meshStandardMaterial attach="material-3" color="#f8f9fa" roughness={0.8} />
          <meshStandardMaterial attach="material-4" color="#e9ecef" roughness={0.8} />
          <primitive object={createFaceMaterial("back-left")} attach="material-5" />
        </mesh>

        {/* Left page label */}
        {selectedFace === "front-left" || selectedFace === "back-left" ? (
          <Text
            position={[0, cardHeight / 2 + 0.3, 0]}
            fontSize={0.2}
            color="#3b82f6"
            anchorX="center"
            anchorY="middle"
            font="/fonts/inter-bold.woff"
          >
            Page 1 - {selectedFace === "front-left" ? "Front" : "Back"}
          </Text>
        ) : null}
      </group>

      {/* Right Page */}
      <group ref={rightPageRef} position={[cardWidth / 4, 0, 0]}>
        {/* Front face of right page */}
        <mesh
          position={[0, 0, pageThickness / 2]}
          onClick={() => handleFaceClick("front-right")}
          onPointerEnter={() => setHoveredFace("front-right")}
          onPointerLeave={() => setHoveredFace(null)}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[cardWidth / 2, cardHeight, pageThickness]} />
          <primitive object={createFaceMaterial("front-right")} attach="material-4" />
          <meshStandardMaterial attach="material-0" color="#f8f9fa" roughness={0.8} />
          <meshStandardMaterial attach="material-1" color="#f8f9fa" roughness={0.8} />
          <meshStandardMaterial attach="material-2" color="#f8f9fa" roughness={0.8} />
          <meshStandardMaterial attach="material-3" color="#f8f9fa" roughness={0.8} />
          <meshStandardMaterial attach="material-5" color="#e9ecef" roughness={0.8} />
        </mesh>

        {/* Back face of right page */}
        <mesh
          position={[0, 0, -pageThickness / 2]}
          onClick={() => handleFaceClick("back-right")}
          onPointerEnter={() => setHoveredFace("back-right")}
          onPointerLeave={() => setHoveredFace(null)}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[cardWidth / 2, cardHeight, pageThickness]} />
          <meshStandardMaterial attach="material-0" color="#f8f9fa" roughness={0.8} />
          <meshStandardMaterial attach="material-1" color="#f8f9fa" roughness={0.8} />
          <meshStandardMaterial attach="material-2" color="#f8f9fa" roughness={0.8} />
          <meshStandardMaterial attach="material-3" color="#f8f9fa" roughness={0.8} />
          <meshStandardMaterial attach="material-4" color="#e9ecef" roughness={0.8} />
          <primitive object={createFaceMaterial("back-right")} attach="material-5" />
        </mesh>

        {/* Right page label */}
        {selectedFace === "front-right" || selectedFace === "back-right" ? (
          <Text
            position={[0, cardHeight / 2 + 0.3, 0]}
            fontSize={0.2}
            color="#3b82f6"
            anchorX="center"
            anchorY="middle"
            font="/fonts/inter-bold.woff"
          >
            Page 2 - {selectedFace === "front-right" ? "Front" : "Back"}
          </Text>
        ) : null}
      </group>

      {/* Binding/Spine */}
      <mesh position={[0, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.05, cardHeight, cardThickness]} />
        <meshStandardMaterial color="#8b5a3c" roughness={0.7} metalness={0.1} />
      </mesh>

      {/* Selection indicator */}
      {hoveredFace && (
        <mesh
          position={[
            hoveredFace.includes("left") ? -cardWidth / 4 : cardWidth / 4,
            cardHeight / 2 + 0.1,
            hoveredFace.includes("front") ? pageThickness / 2 : -pageThickness / 2
          ]}
        >
          <sphereGeometry args={[0.05]} />
          <meshStandardMaterial 
            color="#fbbf24" 
            emissive="#f59e0b" 
            emissiveIntensity={0.5} 
          />
        </mesh>
      )}
    </group>
  );
}
