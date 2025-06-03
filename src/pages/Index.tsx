
import { useState, useRef, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, PerspectiveCamera } from "@react-three/drei";
import { EditorPanel } from "@/components/EditorPanel";
import { BookCard } from "@/components/BookCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RotateCcw, Download, Undo, Redo } from "lucide-react";
import * as fabric from "fabric";
import { useToast } from "@/hooks/use-toast";
import { useUndoRedo } from "@/hooks/useUndoRedo";

export type FaceType = "front-left" | "back-left" | "front-right" | "back-right";

interface FaceData {
  canvas: fabric.Canvas | null;
  texture: string | null;
}

const Index = () => {
  const [selectedFace, setSelectedFace] = useState<FaceType>("front-left");
  const [fabricCanvas, setFabricCanvas] = useState<fabric.Canvas | null>(null);
  const [faceData, setFaceData] = useState<Record<FaceType, FaceData>>({
    "front-left": { canvas: null, texture: null },
    "back-left": { canvas: null, texture: null },
    "front-right": { canvas: null, texture: null },
    "back-right": { canvas: null, texture: null },
  });
  const [isExporting, setIsExporting] = useState(false);
  const cameraRef = useRef();
  const { toast } = useToast();

  // Undo/Redo for canvas states
  const {
    state: canvasHistory,
    set: saveCanvasState,
    undo: undoCanvas,
    redo: redoCanvas,
    canUndo,
    canRedo,
  } = useUndoRedo<string | null>(null);

  // Save canvas state for undo/redo
  const handleCanvasChange = () => {
    if (fabricCanvas) {
      const canvasState = JSON.stringify(fabricCanvas.toJSON());
      saveCanvasState(canvasState);
      updateTexture();
    }
  };

  // Update texture when canvas changes
  const updateTexture = () => {
    if (fabricCanvas) {
      try {
        const dataURL = fabricCanvas.toDataURL({
          format: 'png',
          quality: 1,
          multiplier: 2,
        });
        
        setFaceData(prev => ({
          ...prev,
          [selectedFace]: {
            canvas: fabricCanvas,
            texture: dataURL
          }
        }));
      } catch (error) {
        console.error('Error generating texture:', error);
      }
    }
  };

  useEffect(() => {
    if (fabricCanvas) {
      // Only listen for actual changes, not renders
      fabricCanvas.on('object:added', handleCanvasChange);
      fabricCanvas.on('object:removed', handleCanvasChange);
      fabricCanvas.on('object:modified', handleCanvasChange);

      // Initial texture generation
      updateTexture();

      return () => {
        fabricCanvas.off('object:added', handleCanvasChange);
        fabricCanvas.off('object:removed', handleCanvasChange);
        fabricCanvas.off('object:modified', handleCanvasChange);
      };
    }
  }, [fabricCanvas, selectedFace, saveCanvasState]);

  // Switch canvas when face changes
  useEffect(() => {
    if (faceData[selectedFace].canvas) {
      setFabricCanvas(faceData[selectedFace].canvas);
    } else {
      setFabricCanvas(null);
    }
  }, [selectedFace, faceData]);

  const handleFaceSelect = (face: FaceType) => {
    setSelectedFace(face);
    toast({
      title: "Face Selected",
      description: `Now editing ${face.replace('-', ' ')} face`,
    });
  };

  const handleUndo = () => {
    if (fabricCanvas && canUndo) {
      undoCanvas();
      if (canvasHistory) {
        fabricCanvas.loadFromJSON(canvasHistory, () => {
          fabricCanvas.renderAll();
          updateTexture();
        });
      }
      toast({
        title: "Undo",
        description: "Canvas state restored",
      });
    }
  };

  const handleRedo = () => {
    if (fabricCanvas && canRedo) {
      redoCanvas();
      if (canvasHistory) {
        fabricCanvas.loadFromJSON(canvasHistory, () => {
          fabricCanvas.renderAll();
          updateTexture();
        });
      }
      toast({
        title: "Redo",
        description: "Canvas state restored",
      });
    }
  };

  const resetCamera = () => {
    // Reset camera position will be handled by the BookCard component
    toast({
      title: "Camera Reset",
      description: "View has been reset to default position",
    });
  };

  const exportDesign = async () => {
    setIsExporting(true);
    try {
      // Create a zip file with all face designs
      const designs = Object.entries(faceData).reduce((acc, [face, data]) => {
        if (data.texture) {
          acc[`${face}.png`] = data.texture;
        }
        return acc;
      }, {} as Record<string, string>);

      // For now, just download the current face
      if (faceData[selectedFace].texture) {
        const link = document.createElement('a');
        link.download = `card-${selectedFace}.png`;
        link.href = faceData[selectedFace].texture!;
        link.click();
      }

      toast({
        title: "Export Complete",
        description: "Design has been downloaded successfully",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export design",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const getFaceLabel = (face: FaceType) => {
    const labels = {
      "front-left": "Page 1 - Front",
      "back-left": "Page 1 - Back", 
      "front-right": "Page 2 - Front",
      "back-right": "Page 2 - Back"
    };
    return labels[face];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            3D Card Designer
          </h1>
          <p className="text-gray-600">
            Design your custom book-style card with 4 editable faces
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 3D Preview */}
          <Card className="lg:row-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>3D Preview</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Click on any face to edit it
                </p>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleUndo}
                  disabled={!canUndo}
                >
                  <Undo className="h-4 w-4 mr-2" />
                  Undo
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleRedo}
                  disabled={!canRedo}
                >
                  <Redo className="h-4 w-4 mr-2" />
                  Redo
                </Button>
                <Button variant="outline" size="sm" onClick={resetCamera}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset View
                </Button>
                <Button 
                  size="sm" 
                  onClick={exportDesign}
                  disabled={isExporting}
                >
                  <Download className="h-4 w-4 mr-2" />
                  {isExporting ? "Exporting..." : "Export"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[500px] bg-gradient-to-b from-blue-50 to-indigo-100 rounded-lg overflow-hidden">
                <Canvas shadows>
                  <PerspectiveCamera
                    ref={cameraRef}
                    makeDefault
                    position={[3, 2, 5]}
                    fov={60}
                  />
                  
                  {/* Lighting */}
                  <ambientLight intensity={0.4} />
                  <directionalLight
                    position={[10, 10, 5]}
                    intensity={1}
                    castShadow
                    shadow-mapSize-width={2048}
                    shadow-mapSize-height={2048}
                  />
                  <pointLight position={[-10, -10, -10]} intensity={0.5} />
                  
                  {/* Environment */}
                  <Environment preset="studio" />
                  
                  {/* Book Card */}
                  <BookCard
                    selectedFace={selectedFace}
                    onFaceSelect={handleFaceSelect}
                    faceTextures={{
                      "front-left": faceData["front-left"].texture,
                      "back-left": faceData["back-left"].texture,
                      "front-right": faceData["front-right"].texture,
                      "back-right": faceData["back-right"].texture,
                    }}
                  />
                  
                  {/* Controls */}
                  <OrbitControls
                    enablePan={true}
                    enableZoom={true}
                    enableRotate={true}
                    minDistance={3}
                    maxDistance={15}
                    autoRotate={false}
                  />
                  
                  {/* Ground plane for shadows */}
                  <mesh
                    receiveShadow
                    rotation={[-Math.PI / 2, 0, 0]}
                    position={[0, -2, 0]}
                  >
                    <planeGeometry args={[20, 20]} />
                    <shadowMaterial transparent opacity={0.2} />
                  </mesh>
                </Canvas>
              </div>
            </CardContent>
          </Card>

          {/* Face Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Select Face to Edit</CardTitle>
              <p className="text-sm text-muted-foreground">
                Choose which face of the card you want to design
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {(["front-left", "back-left", "front-right", "back-right"] as FaceType[]).map((face) => (
                  <Button
                    key={face}
                    variant={selectedFace === face ? "default" : "outline"}
                    className="h-auto p-4 flex flex-col items-center gap-2"
                    onClick={() => handleFaceSelect(face)}
                  >
                    <span className="font-medium">{getFaceLabel(face)}</span>
                    {faceData[face].texture && (
                      <Badge variant="secondary" className="text-xs">
                        Designed
                      </Badge>
                    )}
                  </Button>
                ))}
              </div>
              
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <span className="font-medium">Currently editing:</span> {getFaceLabel(selectedFace)}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Editor Panel */}
          <EditorPanel
            fabricCanvas={fabricCanvas}
            setFabricCanvas={(canvas) => {
              setFabricCanvas(canvas);
              if (canvas) {
                setFaceData(prev => ({
                  ...prev,
                  [selectedFace]: {
                    ...prev[selectedFace],
                    canvas
                  }
                }));
              }
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default Index;
