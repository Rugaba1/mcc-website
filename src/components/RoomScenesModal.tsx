"use client";

import React, { useState } from "react";
import Image from "next/image";
import { ALL_ROOM_SCENES, SceneDefinition } from "@/data/scenes";
import { X, Check, Home } from "lucide-react";

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 select-none">
      <div className="w-full max-w-4xl max-h-[90vh] bg-dark  -stone-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 -b -stone-800 flex items-center justify-between bg-dark/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/20  -primary/40 flex items-center justify-center text-primary">
              <Home className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold  tracking-wide">
                Select Room Scene
              </h2>
              <p className="text-xs ">
                Choose from 15 authentic spaces (Bathrooms, Kitchens, Living Room, etc.)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg   hover:bg-surface transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category Filters Bar */}
        <div className="px-5 py-3 -b -stone-800 bg-dark/30 flex gap-1.5 overflow-x-auto no-scrollbar">
          {categories.map((cat) => {
            const isCatActive = activeCategory === cat;
            const count = ALL_ROOM_SCENES.filter(s =>
              cat === "All" ? true : (s.category.toLowerCase().includes(cat.toLowerCase()) || s.name.toLowerCase().includes(cat.toLowerCase()))
            ).length;

            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`text-xs px-3 py-1.5 rounded-full font-medium whitespace-nowrap transition-all  ${isCatActive
                  ? "bg-primary  -primary font-semibold shadow-sm"
                  : "bg-surface/80 -stone-700/80 text-ivory/70  hover:bg-surface"
                  }`}
              >
                <span>{cat}</span>
                <span className="ml-1.5 opacity-60 text-[10px]">({count})</span>
              </button>
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
                className={`group relative rounded-xl overflow-hidden  cursor-pointer transition-all duration-200 text-left ${isSelected
                  ? "-primary ring-2 ring-primary/50 bg-surface/90 shadow-xl"
                  : "-stone-800 hover:-stone-600 bg-dark/60 hover:bg-surface/50"
                  }`}
              >
                {/* Scene Preview Image */}
                <div className="relative w-full h-40 bg-dark overflow-hidden">
                  <Image
                    src={scene.baseImage}
                    alt={scene.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    unoptimized
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-muted via-transparent to-transparent opacity-80" />

                  {/* Surface count pill */}
                  <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/70  -stone-700/80 text-[11px] font-medium text-ivory/70 backdrop-blur-sm">
                    {scene.surfaces.length} Surfaces
                  </div>

                  {isSelected && (
                    <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-primary  text-[11px] font-bold flex items-center gap-1 shadow-md">
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
      </div>
    </div>
  );
};
