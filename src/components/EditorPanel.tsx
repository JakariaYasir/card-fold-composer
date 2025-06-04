"use client";

import { useEffect, useRef, useState } from "react";
import * as fabric from "fabric";
import {
  ImageIcon,
  Type,
  Bold,
  Italic,
  AlignLeft,
  AlignCenter,
  Trash2,
  Copy,
  Eraser,
} from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Slider } from "./ui/slider";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { useToast } from "@/hooks/use-toast";

interface EditorPanelProps {
  fabricCanvas: fabric.Canvas | null;
  setFabricCanvas: (canvas: fabric.Canvas | null) => void;
}

export function EditorPanel({
  fabricCanvas,
  setFabricCanvas,
}: EditorPanelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedObject, setSelectedObject] = useState<fabric.Object | null>(
    null
  );
  const [textColor, setTextColor] = useState("#000000");
  const [fontSize, setFontSize] = useState(32);
  const [opacity, setOpacity] = useState(100);
  const { toast } = useToast();

  useEffect(() => {
    if (canvasRef.current && !fabricCanvas) {
      // Canvas dimensions optimized for card faces (3:4 aspect ratio like real cards)
      const width = 375; // Card width
      const height = 525; // Card height (3:4 ratio)

      const canvas = new fabric.Canvas(canvasRef.current, {
        width,
        height,
        backgroundColor: "rgba(255,255,255,1)",
        selection: true,
        preserveObjectStacking: true,
      });

      // Add subtle grid lines for design guidance
      if (canvas.width && canvas.height) {
        const gridSize = 25;
        for (let i = 0; i < canvas.width; i += gridSize) {
          canvas.add(
            new fabric.Line([i, 0, i, canvas.height], {
              stroke: "#f1f5f9",
              strokeWidth: 1,
              selectable: false,
              evented: false,
              excludeFromExport: true,
            })
          );
        }
        for (let i = 0; i < canvas.height; i += gridSize) {
          canvas.add(
            new fabric.Line([0, i, canvas.width, i], {
              stroke: "#f1f5f9",
              strokeWidth: 1,
              selectable: false,
              evented: false,
              excludeFromExport: true,
            })
          );
        }
      }

      // Set up event listeners
      const handleSelectionCreated = (e: any) => {
        const selected = e.selected?.[0];
        setSelectedObject(selected || null);

        if (selected && selected.type === "i-text") {
          const iText = selected as fabric.IText;
          setTextColor((iText.fill as string) || "#000000");
          setFontSize((iText.fontSize as number) || 32);
          setOpacity((iText.opacity || 1) * 100);
        } else if (selected) {
          setOpacity((selected.opacity || 1) * 100);
        }
      };

      const handleSelectionUpdated = (e: any) => {
        const selected = e.selected?.[0];
        setSelectedObject(selected || null);

        if (selected && selected.type === "i-text") {
          const iText = selected as fabric.IText;
          setTextColor((iText.fill as string) || "#000000");
          setFontSize((iText.fontSize as number) || 32);
          setOpacity((iText.opacity || 1) * 100);
        } else if (selected) {
          setOpacity((selected.opacity || 1) * 100);
        }
      };

      const handleSelectionCleared = () => {
        setSelectedObject(null);
      };

      canvas.on("selection:created", handleSelectionCreated);
      canvas.on("selection:updated", handleSelectionUpdated);
      canvas.on("selection:cleared", handleSelectionCleared);

      setFabricCanvas(canvas);

      return () => {
        canvas.dispose();
      };
    }
  }, []);

  // Cleanup when component unmounts
  useEffect(() => {
    return () => {
      if (fabricCanvas) {
        setFabricCanvas(null);
      }
    };
  }, []);

  const addText = () => {
    if (fabricCanvas) {
      const text = new fabric.IText("Your Text", {
        left: fabricCanvas.width! / 2,
        top: fabricCanvas.height! / 2,
        fontSize,
        fill: textColor,
        fontFamily: "Arial",
        originX: "center",
        originY: "center",
        opacity: opacity / 100,
        editable: true,
        flipY: false,
      });
      fabricCanvas.add(text);
      fabricCanvas.setActiveObject(text);
      fabricCanvas.renderAll();
    }
  };

  // Image upload functionality
  const addImage = () => {
    if (!fabricCanvas) return;

    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.style.display = "none";

    const handleFileSelect = (event: Event) => {
      const target = event.target as HTMLInputElement;
      const file = target.files?.[0];

      if (!file) return;

      if (!file.type.startsWith("image/")) {
        toast({
          title: "Invalid file",
          description: "Please select an image file",
          variant: "destructive",
        });
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image smaller than 10MB",
          variant: "destructive",
        });
        return;
      }

      const reader = new FileReader();

      reader.onload = (e) => {
        const dataURL = e.target?.result as string;
        if (!dataURL) return;

        fabric.Image.fromURL(dataURL, {
          crossOrigin: "anonymous",
        })
          .then((img) => {
            if (!fabricCanvas) return;

            const canvasWidth = fabricCanvas.width!;
            const canvasHeight = fabricCanvas.height!;
            const maxWidth = canvasWidth * 0.6;
            const maxHeight = canvasHeight * 0.6;

            const imgWidth = img.width!;
            const imgHeight = img.height!;

            const scaleX = maxWidth / imgWidth;
            const scaleY = maxHeight / imgHeight;
            const scale = Math.min(scaleX, scaleY);

            img.set({
              left: canvasWidth / 2,
              top: canvasHeight / 2,
              originX: "center",
              originY: "center",
              scaleX: scale,
              scaleY: scale,
              opacity: opacity / 100,
            });

            fabricCanvas.add(img);
            fabricCanvas.setActiveObject(img);
            fabricCanvas.renderAll();

            toast({
              title: "Image added",
              description: "Image successfully added to canvas",
            });
          })
          .catch((error) => {
            console.error("Error loading image:", error);
            toast({
              title: "Error",
              description: "Failed to load image",
              variant: "destructive",
            });
          });
      };

      reader.onerror = () => {
        toast({
          title: "Error",
          description: "Failed to read file",
          variant: "destructive",
        });
      };

      reader.readAsDataURL(file);
    };

    input.addEventListener("change", handleFileSelect);
    document.body.appendChild(input);
    input.click();
    document.body.removeChild(input);
  };

  const handleDelete = () => {
    if (fabricCanvas && selectedObject) {
      fabricCanvas.remove(selectedObject);
      fabricCanvas.renderAll();
      setSelectedObject(null);
    }
  };

  const handleCopy = () => {
    if (fabricCanvas && selectedObject) {
      selectedObject.clone().then((cloned: fabric.Object) => {
        cloned.set({
          left: (cloned.left || 0) + 20,
          top: (cloned.top || 0) + 20,
        });
        fabricCanvas.add(cloned);
        fabricCanvas.setActiveObject(cloned);
        fabricCanvas.renderAll();
      });
    }
  };

  const handleTextAlign = (align: string) => {
    if (fabricCanvas && selectedObject && selectedObject.type === "i-text") {
      (selectedObject as fabric.IText).set("textAlign", align);
      fabricCanvas.renderAll();
    }
  };

  const handleFontStyle = (style: "bold" | "italic") => {
    if (fabricCanvas && selectedObject && selectedObject.type === "i-text") {
      const iText = selectedObject as fabric.IText;
      const currentFontWeight = iText.fontWeight === "bold" ? "normal" : "bold";
      const currentFontStyle =
        iText.fontStyle === "italic" ? "normal" : "italic";

      if (style === "bold") {
        iText.set("fontWeight", currentFontWeight);
      } else {
        iText.set("fontStyle", currentFontStyle);
      }

      fabricCanvas.renderAll();
    }
  };

  const handleOpacityChange = (value: number[]) => {
    const newOpacity = value[0];
    setOpacity(newOpacity);

    if (fabricCanvas && selectedObject) {
      selectedObject.set("opacity", newOpacity / 100);
      fabricCanvas.renderAll();
    }
  };

  const clearCanvas = () => {
    if (fabricCanvas) {
      fabricCanvas.getObjects().forEach((obj) => {
        if (obj.type !== "line") {
          fabricCanvas.remove(obj);
        }
      });
      fabricCanvas.renderAll();

      toast({
        title: "Canvas cleared",
        description: "All objects have been removed from the canvas",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Design Editor</CardTitle>
        <p className="text-sm text-muted-foreground">
          Design the selected card face with text and images
        </p>
      </CardHeader>
      <CardContent>
        <div className="border border-border rounded-md mb-4 overflow-hidden bg-white">
          <canvas
            ref={canvasRef}
            className="w-full"
            style={{ maxHeight: "420px" }}
          />
        </div>

        <Tabs defaultValue="tools">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="tools">Tools</TabsTrigger>
            <TabsTrigger value="properties">Properties</TabsTrigger>
          </TabsList>

          <TabsContent value="tools" className="space-y-4">
            <div className="grid grid-cols-4 gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={addText}
                title="Add Text"
              >
                <Type className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={addImage}
                title="Add Image"
              >
                <ImageIcon className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleDelete}
                disabled={!selectedObject}
                title="Delete"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleCopy}
                disabled={!selectedObject}
                title="Duplicate"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>

            <Button
              variant="destructive"
              onClick={clearCanvas}
              className="w-full"
            >
              <Eraser className="h-4 w-4 mr-2" />
              Clear Canvas
            </Button>
          </TabsContent>

          <TabsContent value="properties" className="space-y-4">
            {selectedObject?.type === "i-text" ? (
              <>
                <div className="grid grid-cols-4 gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleFontStyle("bold")}
                    title="Bold"
                  >
                    <Bold className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleFontStyle("italic")}
                    title="Italic"
                  >
                    <Italic className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleTextAlign("left")}
                    title="Align Left"
                  >
                    <AlignLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleTextAlign("center")}
                    title="Align Center"
                  >
                    <AlignCenter className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="text-color">Text Color</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="text-color"
                      type="color"
                      value={textColor}
                      onChange={(e) => {
                        setTextColor(e.target.value);
                        if (selectedObject) {
                          selectedObject.set("fill", e.target.value);
                          fabricCanvas?.renderAll();
                        }
                      }}
                      className="w-12 h-8 p-0"
                    />
                    <Input
                      type="text"
                      value={textColor}
                      onChange={(e) => {
                        setTextColor(e.target.value);
                        if (selectedObject) {
                          selectedObject.set("fill", e.target.value);
                          fabricCanvas?.renderAll();
                        }
                      }}
                      className="flex-1"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="font-size">Font Size: {fontSize}px</Label>
                  <Slider
                    id="font-size"
                    min={16}
                    max={80}
                    step={1}
                    value={[fontSize]}
                    onValueChange={(value) => {
                      const newSize = value[0];
                      setFontSize(newSize);
                      if (selectedObject) {
                        selectedObject.set("fontSize", newSize);
                        fabricCanvas?.renderAll();
                      }
                    }}
                  />
                </div>
              </>
            ) : null}

            <div className="space-y-2">
              <Label htmlFor="opacity">Opacity: {opacity}%</Label>
              <Slider
                id="opacity"
                min={0}
                max={100}
                step={1}
                value={[opacity]}
                onValueChange={handleOpacityChange}
              />
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
