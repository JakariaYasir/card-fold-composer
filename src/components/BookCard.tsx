
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
  const [isAnimating, setIsAnimating] = useState(false);
  
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

  // Enhanced animation for folding/unfolding pages
  useFrame((state, delta) => {
    if (groupRef.current) {
      // Gentle floating animation
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.05;
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.02;
    }

    // Smooth page opening/closing animation
    if (leftPageRef.current && rightPageRef.current) {
      const speed = 4; // Animation speed
      const maxRotation = Math.PI * 0.2; // Maximum opening angle
      
      // Determine target rotations based on selected face
      const targetLeftRotation = selectedFace.includes("left") ? maxRotation : 0;
      const targetRightRotation = selectedFace.includes("right") ? -maxRotation : 0;
      
      // Smooth interpolation with easing
      leftPageRef.current.rotation.y = THREE.MathUtils.lerp(
        leftPageRef.current.rotation.y,
        targetLeftRotation,
        delta * speed
      );
      
      rightPageRef.current.rotation.y = THREE.MathUtils.lerp(
        rightPageRef.current.rotation.y,
        targetRightRotation,
        delta * speed
      );

      // Add subtle scale animation when opening
      const leftScale = 1 + Math.abs(leftPageRef.current.rotation.y) * 0.02;
      const rightScale = 1 + Math.abs(rightPageRef.current.rotation.y) * 0.02;
      
      leftPageRef.current.scale.setScalar(leftScale);
      rightPageRef.current.scale.setScalar(rightScale);
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
      roughness: 0.2,
      metalness: 0.05,
      emissive: isSelected ? new THREE.Color("#1e40af") : isHovered ? new THREE.Color("#2563eb") : new THREE.Color("#000000"),
      emissiveIntensity: isSelected ? 0.15 : isHovered ? 0.08 : 0,
    });
  };

  const handleFaceClick = (face: FaceType) => {
    setIsAnimating(true);
    onFaceSelect(face);
    setTimeout(() => setIsAnimating(false), 800);
  };

  // Card dimensions (realistic proportions)
  const cardWidth = 2.5;
  const cardHeight = 3.5;
  const cardThickness = 0.1;
  const pageThickness = 0.08;

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

      {/* Enhanced selection indicator */}
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
            emissiveIntensity={0.8} 
          />
        </mesh>
      )}
    </group>
  );
}
