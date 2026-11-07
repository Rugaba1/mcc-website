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
      <DialogContent className="flex h-[calc(100dvh-1rem)] max-h-[calc(100dvh-1rem)] w-[calc(100vw-1rem)] max-w-none flex-col gap-3 overflow-hidden p-3 sm:h-auto sm:max-h-[calc(100dvh-2rem)] sm:w-full sm:max-w-5xl sm:gap-4 sm:overflow-y-auto sm:p-6 *:max-w-full bg-background">
        <DialogHeader className="pr-8 sm:pr-0">
          <DialogTitle>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8   bg-primary/20  flex items-center justify-center text-primary">
                <Home className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xl font-semibold text-foreground sm:text-2xl">
                  Select Room Scene
                </span>

              </div>
            </div>
          </DialogTitle>
          <DialogDescription>
            <span className="text-sm sm:text-base">
              Choose from 15 authentic spaces (Bathrooms, Kitchens, Living Room, etc.)
            </span>
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="min-h-0 w-full max-h-[80vh] flex-1 overflow-hidden flex flex-col">
          {/* Modal Header */}


          {/* Category Filters Bar */}
          <div className="flex gap-1.5 overflow-x-auto border-b border-border bg-muted px-3 py-3 no-scrollbar sm:px-5">
            {categories.map((cat) => {
              const isCatActive = activeCategory === cat;
              const count = scenesList.filter(s =>
                cat === "All" ? true : (s.category.toLowerCase().includes(cat.toLowerCase()) || s.name.toLowerCase().includes(cat.toLowerCase()))
              ).length;

              return (
                <Button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                    aria-pressed={isCatActive}
                    className={`min-h-11 text-xs px-3 py-1.5 font-medium whitespace-nowrap transition-all ${isCatActive
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
          <ul className="grid min-w-0 grid-cols-1 gap-4 p-3 sm:grid-cols-2 sm:p-5 md:grid-cols-3">
            {filteredScenes.map((scene) => {
              const isSelected = scene.id === currentSceneId;
              return (
                <li key={scene.id} className="min-w-0">
                <button
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => {
                    onSelectScene(scene);
                    onClose();
                  }}
                  className={`group relative block min-h-11 w-full overflow-hidden cursor-pointer transition-all duration-200 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary ${isSelected
                    ? "border border-primary ring-2 ring-primary/50 bg-background/90 shadow-xl"
                    : "border border-border bg-card hover:bg-background"
                    }`}
                >
                  {/* Scene Preview Image */}
                  <span className="relative block h-40 w-full overflow-hidden bg-inverse">
                    <Image
                      src={scene.baseImage}
                      alt=""
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-300"

                    />
                    <span aria-hidden="true" className="absolute inset-0 bg-linear-to-t from-muted via-transparent to-transparent opacity-80" />

                    {/* Surface count pill */}
                    <span className="absolute bottom-2 left-2 px-2 py-0.5 bg-overlay/70 text-overlay-foreground border border-overlay/70 text-[11px] font-medium backdrop-blur-sm">
                      {scene.surfaces.length} Surfaces
                    </span>

                    {isSelected && (
                      <span className="absolute top-2 right-2 px-2 py-0.5 bg-primary text-[11px] font-bold flex items-center gap-1 shadow-md">
                        <Check aria-hidden="true" className="w-3 h-3" />
                        <span>CURRENT</span>
                      </span>
                    )}
                  </span>

                  {/* Card Meta */}
                  <span className="block p-3">
                    <span className="block text-sm font-semibold group-hover:text-primary transition-colors">
                      {scene.name}
                    </span>
                    <span className="mt-1 flex items-center justify-between text-xs">
                      <span>{scene.category}</span>
                      <span className="text-[10px]  uppercase tracking-wider font-mono">
                        {scene.originalSize.width}x{scene.originalSize.height}
                      </span>
                    </span>
                  </span>
                </button>
                </li>
              );
            })}
          </ul>
        </ScrollArea>
      </DialogContent>

    </Dialog>
  );
};
