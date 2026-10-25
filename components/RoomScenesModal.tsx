"use client";

import React, { useState } from "react";
import Image from "next/image";
import { ALL_ROOM_SCENES, SceneDefinition } from "../data/scenes";
import { X, Check, Home } from "lucide-react";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { ScrollArea } from "./ui/scroll-area";

interface RoomScenesModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSceneId: string;
  onSelectScene: (scene: SceneDefinition) => void;
  allScenes?: SceneDefinition[];
}

export const RoomScenesModal: React.FC<RoomScenesModalProps> = ({
  isOpen,
  onClose,
  currentSceneId,
  onSelectScene,
  allScenes = ALL_ROOM_SCENES,
}) => {
  const [activeCategory, setActiveCategory] = useState<string>("All");

  if (!isOpen) return null;

  const categories = [
    "All",
    "Bathroom",
    "Kitchen",
    "Living Room",
    "Dining Room",
    "Foyer",
    "Basement",
    "Laundry Room",
  ];

  const scenesList = allScenes && allScenes.length > 0 ? allScenes : ALL_ROOM_SCENES;

  const filteredScenes = scenesList.filter((s) => {
    if (activeCategory === "All") return true;
    return s.category.toLowerCase().includes(activeCategory.toLowerCase()) ||
      s.name.toLowerCase().includes(activeCategory.toLowerCase());
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-5xl *:max-w-full bg-background">
        <DialogHeader>
          <DialogTitle>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8   bg-primary/20  flex items-center justify-center text-primary">
                <Home className="w-4 h-4" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-foreground">
                  Select Room Scene
                </h1>

              </div>
            </div>
          </DialogTitle>
          <DialogDescription>
            <p className="text-md ">
              Choose from 15 authentic spaces (Bathrooms, Kitchens, Living Room, etc.)
            </p>
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="w-full max-h-[80vh]  overflow-hidden flex flex-col">
          {/* Modal Header */}


          {/* Category Filters Bar */}
          <div className="px-5 py-3 border-b border-border bg-muted flex gap-1.5 overflow-x-auto no-scrollbar">
            {categories.map((cat) => {
              const isCatActive = activeCategory === cat;
              const count = ALL_ROOM_SCENES.filter(s =>
                cat === "All" ? true : (s.category.toLowerCase().includes(cat.toLowerCase()) || s.name.toLowerCase().includes(cat.toLowerCase()))
              ).length;

              return (
                <Button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`text-xs px-3 py-1.5  font-medium whitespace-nowrap transition-all  ${isCatActive
                    ? "bg-primary text-primary-foreground border border-primary font-semibold shadow-sm"
                    : "bg-background/80 text-foreground border border-border hover:bg-background"
                    }`}
                >
                  <span>{cat}</span>
                  <span className="ml-1.5 opacity-60 text-[10px]">({count})</span>
                </Button>
              );
            })}
          </div>

          {/* Room Scenes Grid */}
          <div className="flex-1 overflow-y-auto p-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {filteredScenes.map((scene) => {
              const isSelected = scene.id === currentSceneId;
              return (
                <div
                  key={scene.id}
                  onClick={() => {
                    onSelectScene(scene);
                    onClose();
                  }}
                  className={`group relative   overflow-hidden  cursor-pointer transition-all duration-200 text-left ${isSelected
                    ? "border border-primary ring-2 ring-primary/50 bg-background/90 shadow-xl"
                    : "border border-border bg-card hover:bg-background"
                    }`}
                >
                  {/* Scene Preview Image */}
                  <div className="relative w-full h-40 bg-inverse overflow-hidden">
                    <Image
                      src={scene.baseImage}
                      alt={scene.name}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      unoptimized
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-muted via-transparent to-transparent opacity-80" />

                    {/* Surface count pill */}
                    <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-overlay/70 text-overlay-foreground border border-overlay/70 text-[11px] font-medium backdrop-blur-sm">
                      {scene.surfaces.length} Surfaces
                    </div>

                    {isSelected && (
                      <div className="absolute top-2 right-2 px-2 py-0.5   bg-primary  text-[11px] font-bold flex items-center gap-1 shadow-md">
                        <Check className="w-3 h-3" />
                        <span>CURRENT</span>
                      </div>
                    )}
                  </div>

                  {/* Card Meta */}
                  <div className="p-3">
                    <h3 className="text-sm font-semibold  group-hover:text-primary transition-colors">
                      {scene.name}
                    </h3>
                    <div className="flex items-center justify-between text-xs  mt-1">
                      <span>{scene.category}</span>
                      <span className="text-[10px]  uppercase tracking-wider font-mono">
                        {scene.originalSize.width}x{scene.originalSize.height}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </DialogContent>

    </Dialog>
  );
};
