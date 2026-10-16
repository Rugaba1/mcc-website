export interface SurfaceDefinition {
  sortOrder: number;
  name: string;
  type: string;
  category: string;
  mask: string;
  sampleLayer?: string;
  sampleProductId?: number;
}

export interface SceneDefinition {
  id: string;
  name: string;
  category: string;
  specifier: string;
  baseImage: string;
  originalSize: { width: number; height: number };
  surfaces: SurfaceDefinition[];
}

export const ALL_ROOM_SCENES: SceneDefinition[] = [
  {
    "id": "bathroom_1",
    "name": "Bathroom 1",
    "category": "Bathroom",
    "specifier": "Best_Tile\\Images\\Bathroom_1",
    "baseImage": "/scenes/bathroom_1/base.jpg",
    "originalSize": {
      "width": 2000,
      "height": 1150
    },
    "surfaces": [
      {
        "sortOrder": 1,
        "name": "Floor",
        "type": "FLOOR",
        "category": "Floor",
        "mask": "/scenes/bathroom_1/masks/mask_1.png"
      },
      {
        "sortOrder": 2,
        "name": "Wall",
        "type": "WALL",
        "category": "Wall",
        "mask": "/scenes/bathroom_1/masks/mask_2.png"
      },
      {
        "sortOrder": 3,
        "name": "Shower Walls",
        "type": "WALL",
        "category": "Wall",
        "mask": "/scenes/bathroom_1/masks/mask_3.png"
      },
      {
        "sortOrder": 4,
        "name": "Countertop",
        "type": "COUNTER",
        "category": "Counter",
        "mask": "/scenes/bathroom_1/masks/mask_4.png"
      },
      {
        "sortOrder": 5,
        "name": "Cabinets",
        "type": "CABINETS",
        "category": "Cabinet",
        "mask": "/scenes/bathroom_1/masks/mask_5.png"
      },
      {
        "sortOrder": 6,
        "name": "Painted Walls",
        "type": "PAINTED WALL",
        "category": "Paint",
        "mask": "/scenes/bathroom_1/masks/mask_6.png"
      },
      {
        "sortOrder": 7,
        "name": "Trim",
        "type": "TRIM",
        "category": "Paint",
        "mask": "/scenes/bathroom_1/masks/mask_7.png"
      }
    ]
  },
  {
    "id": "bathroom_2",
    "name": "Bathroom 2",
    "category": "Bathroom",
    "specifier": "Best_Tile\\Images\\Bathroom_2",
    "baseImage": "/scenes/bathroom_2/base.jpg",
    "originalSize": {
      "width": 2000,
      "height": 1150
    },
    "surfaces": [
      {
        "sortOrder": 1,
        "name": "Floor",
        "type": "FLOOR",
        "category": "Floor",
        "mask": "/scenes/bathroom_2/masks/mask_1.png"
      },
      {
        "sortOrder": 2,
        "name": "Shower Floor",
        "type": "FLOOR",
        "category": "Floor",
        "mask": "/scenes/bathroom_2/masks/mask_2.png"
      },
      {
        "sortOrder": 3,
        "name": "Shower Surround",
        "type": "WALL",
        "category": "Wall",
        "mask": "/scenes/bathroom_2/masks/mask_3.png"
      },
      {
        "sortOrder": 4,
        "name": "Wall",
        "type": "WALL",
        "category": "Wall",
        "mask": "/scenes/bathroom_2/masks/mask_4.png"
      },
      {
        "sortOrder": 5,
        "name": "Shower Wall",
        "type": "WALL",
        "category": "Wall",
        "mask": "/scenes/bathroom_2/masks/mask_5.png"
      },
      {
        "sortOrder": 6,
        "name": "Shower Curb",
        "type": "COUNTER",
        "category": "Counter",
        "mask": "/scenes/bathroom_2/masks/mask_6.png"
      },
      {
        "sortOrder": 7,
        "name": "Trim",
        "type": "TRIM",
        "category": "Paint",
        "mask": "/scenes/bathroom_2/masks/mask_7.png"
      },
      {
        "sortOrder": 8,
        "name": "Painted Walls",
        "type": "PAINTED WALL",
        "category": "Paint",
        "mask": "/scenes/bathroom_2/masks/mask_8.png"
      }
    ]
  },
  {
    "id": "bathroom_3",
    "name": "Bathroom 3",
    "category": "Bathroom",
    "specifier": "Best_Tile\\Images\\Bathroom_3",
    "baseImage": "/scenes/bathroom_3/base.jpg",
    "originalSize": {
      "width": 2000,
      "height": 1150
    },
    "surfaces": [
      {
        "sortOrder": 1,
        "name": "Floor",
        "type": "FLOOR",
        "category": "Floor",
        "mask": "/scenes/bathroom_3/masks/mask_1.png"
      },
      {
        "sortOrder": 2,
        "name": "Shower Floor",
        "type": "FLOOR",
        "category": "Floor",
        "mask": "/scenes/bathroom_3/masks/mask_2.png"
      },
      {
        "sortOrder": 3,
        "name": "Shower Walls",
        "type": "WALL",
        "category": "Wall",
        "mask": "/scenes/bathroom_3/masks/mask_3.png"
      },
      {
        "sortOrder": 4,
        "name": "Shower Accent",
        "type": "WALL",
        "category": "Wall",
        "mask": "/scenes/bathroom_3/masks/mask_4.png"
      },
      {
        "sortOrder": 5,
        "name": "Shower Niche",
        "type": "WALL",
        "category": "Wall",
        "mask": "/scenes/bathroom_3/masks/mask_5.png"
      },
      {
        "sortOrder": 6,
        "name": "Shower Bench",
        "type": "WALL",
        "category": "Wall",
        "mask": "/scenes/bathroom_3/masks/mask_6.png"
      },
      {
        "sortOrder": 7,
        "name": "Trim",
        "type": "TRIM",
        "category": "Paint",
        "mask": "/scenes/bathroom_3/masks/mask_7.png"
      },
      {
        "sortOrder": 8,
        "name": "Painted Walls",
        "type": "PAINTED WALL",
        "category": "Paint",
        "mask": "/scenes/bathroom_3/masks/mask_8.png"
      }
    ]
  },
  {
    "id": "bathroom_4",
    "name": "Bathroom 4",
    "category": "Bathroom",
    "specifier": "Best_Tile\\Images\\Bathroom_4",
    "baseImage": "/scenes/bathroom_4/base.jpg",
    "originalSize": {
      "width": 2000,
      "height": 1150
    },
    "surfaces": [
      {
        "sortOrder": 1,
        "name": "Floor",
        "type": "FLOOR",
        "category": "Floor",
        "mask": "/scenes/bathroom_4/masks/mask_1.png"
      },
      {
        "sortOrder": 2,
        "name": "Walls",
        "type": "WALL",
        "category": "Wall",
        "mask": "/scenes/bathroom_4/masks/mask_2.png"
      },
      {
        "sortOrder": 3,
        "name": "Accent Wall",
        "type": "WALL",
        "category": "Wall",
        "mask": "/scenes/bathroom_4/masks/mask_3.png"
      },
      {
        "sortOrder": 4,
        "name": "Countertop",
        "type": "COUNTER",
        "category": "Counter",
        "mask": "/scenes/bathroom_4/masks/mask_4.png"
      },
      {
        "sortOrder": 5,
        "name": "Cabinets",
        "type": "CABINETS",
        "category": "Cabinet",
        "mask": "/scenes/bathroom_4/masks/mask_5.png"
      },
      {
        "sortOrder": 6,
        "name": "Trim",
        "type": "TRIM",
        "category": "Paint",
        "mask": "/scenes/bathroom_4/masks/mask_6.png"
      }
    ]
  },
  {
    "id": "bathroom_5",
    "name": "Bathroom 5",
    "category": "Bathroom",
    "specifier": "Best_Tile\\Images\\Bathroom_5",
    "baseImage": "/scenes/bathroom_5/base.jpg",
    "originalSize": {
      "width": 2000,
      "height": 1150
    },
    "surfaces": [
      {
        "sortOrder": 1,
        "name": "Floor",
        "type": "FLOOR",
        "category": "Floor",
        "mask": "/scenes/bathroom_5/masks/mask_1.png"
      },
      {
        "sortOrder": 2,
        "name": "Shower Floor",
        "type": "FLOOR",
        "category": "Floor",
        "mask": "/scenes/bathroom_5/masks/mask_2.png"
      },
      {
        "sortOrder": 3,
        "name": "Backsplash",
        "type": "BACKSPLASH",
        "category": "Backsplash",
        "mask": "/scenes/bathroom_5/masks/mask_3.png"
      },
      {
        "sortOrder": 4,
        "name": "Shower Surround",
        "type": "WALL",
        "category": "Wall",
        "mask": "/scenes/bathroom_5/masks/mask_4.png"
      },
      {
        "sortOrder": 5,
        "name": "Shower Walls",
        "type": "WALL",
        "category": "Wall",
        "mask": "/scenes/bathroom_5/masks/mask_5.png"
      },
      {
        "sortOrder": 6,
        "name": "Shower Accent",
        "type": "WALL",
        "category": "Wall",
        "mask": "/scenes/bathroom_5/masks/mask_6.png"
      },
      {
        "sortOrder": 7,
        "name": "Shower Curb",
        "type": "COUNTER",
        "category": "Counter",
        "mask": "/scenes/bathroom_5/masks/mask_7.png"
      },
      {
        "sortOrder": 8,
        "name": "Countertop",
        "type": "COUNTER",
        "category": "Counter",
        "mask": "/scenes/bathroom_5/masks/mask_8.png"
      },
      {
        "sortOrder": 9,
        "name": "Cabinet",
        "type": "CABINETS",
        "category": "Cabinet",
        "mask": "/scenes/bathroom_5/masks/mask_9.png"
      },
      {
        "sortOrder": 10,
        "name": "Trim",
        "type": "TRIM",
        "category": "Paint",
        "mask": "/scenes/bathroom_5/masks/mask_10.png"
      },
      {
        "sortOrder": 11,
        "name": "Painted Walls",
        "type": "PAINTED WALL",
        "category": "Paint",
        "mask": "/scenes/bathroom_5/masks/mask_11.png"
      }
    ]
  },
  {
    "id": "kitchen_1",
    "name": "Kitchen 1",
    "category": "Kitchen",
    "specifier": "Best_Tile\\Images\\Kitchen_1",
    "baseImage": "/scenes/kitchen_1/base.jpg",
    "originalSize": {
      "width": 2000,
      "height": 1150
    },
    "surfaces": [
      {
        "sortOrder": 1,
        "name": "Floor",
        "type": "FLOOR",
        "category": "Floor",
        "mask": "/scenes/kitchen_1/masks/mask_1.png"
      },
      {
        "sortOrder": 2,
        "name": "Backsplash",
        "type": "BACKSPLASH",
        "category": "Backsplash",
        "mask": "/scenes/kitchen_1/masks/mask_2.png"
      },
      {
        "sortOrder": 3,
        "name": "Countertops",
        "type": "COUNTER",
        "category": "Counter",
        "mask": "/scenes/kitchen_1/masks/mask_3.png"
      },
      {
        "sortOrder": 4,
        "name": "Island Countertop",
        "type": "COUNTER",
        "category": "Counter",
        "mask": "/scenes/kitchen_1/masks/mask_4.png"
      },
      {
        "sortOrder": 5,
        "name": "Cabinets",
        "type": "CABINETS",
        "category": "Cabinet",
        "mask": "/scenes/kitchen_1/masks/mask_5.png"
      },
      {
        "sortOrder": 6,
        "name": "Island Cabinets",
        "type": "CABINETS",
        "category": "Cabinet",
        "mask": "/scenes/kitchen_1/masks/mask_6.png"
      },
      {
        "sortOrder": 7,
        "name": "Painted Walls",
        "type": "PAINTED WALL",
        "category": "Paint",
        "mask": "/scenes/kitchen_1/masks/mask_7.png"
      },
      {
        "sortOrder": 8,
        "name": "Trim",
        "type": "TRIM",
        "category": "Paint",
        "mask": "/scenes/kitchen_1/masks/mask_8.png"
      }
    ]
  },
  {
    "id": "kitchen_2",
    "name": "Kitchen 2",
    "category": "Kitchen",
    "specifier": "Best_Tile\\Images\\Kitchen_2",
    "baseImage": "/scenes/kitchen_2/base.jpg",
    "originalSize": {
      "width": 2000,
      "height": 1150
    },
    "surfaces": [
      {
        "sortOrder": 1,
        "name": "Floor",
        "type": "FLOOR",
        "category": "Floor",
        "mask": "/scenes/kitchen_2/masks/mask_1.png"
      },
      {
        "sortOrder": 2,
        "name": "Backsplash",
        "type": "BACKSPLASH",
        "category": "Backsplash",
        "mask": "/scenes/kitchen_2/masks/mask_2.png"
      },
      {
        "sortOrder": 3,
        "name": "Countertops",
        "type": "COUNTER",
        "category": "Counter",
        "mask": "/scenes/kitchen_2/masks/mask_3.png"
      },
      {
        "sortOrder": 4,
        "name": "Island Countertop",
        "type": "COUNTER",
        "category": "Counter",
        "mask": "/scenes/kitchen_2/masks/mask_4.png"
      },
      {
        "sortOrder": 5,
        "name": "Cabinets",
        "type": "CABINETS",
        "category": "Cabinet",
        "mask": "/scenes/kitchen_2/masks/mask_5.png"
      },
      {
        "sortOrder": 6,
        "name": "Island Cabinets",
        "type": "CABINETS",
        "category": "Cabinet",
        "mask": "/scenes/kitchen_2/masks/mask_6.png"
      },
      {
        "sortOrder": 7,
        "name": "Painted Walls",
        "type": "PAINTED WALL",
        "category": "Paint",
        "mask": "/scenes/kitchen_2/masks/mask_7.png"
      },
      {
        "sortOrder": 8,
        "name": "Trim",
        "type": "TRIM",
        "category": "Paint",
        "mask": "/scenes/kitchen_2/masks/mask_8.png"
      }
    ]
  },
  {
    "id": "kitchen_3",
    "name": "Kitchen 3",
    "category": "Kitchen",
    "specifier": "Best_Tile\\Images\\Kitchen_3",
    "baseImage": "/scenes/kitchen_3/base.jpg",
    "originalSize": {
      "width": 2000,
      "height": 1150
    },
    "surfaces": [
      {
        "sortOrder": 1,
        "name": "Floor",
        "type": "FLOOR",
        "category": "Floor",
        "mask": "/scenes/kitchen_3/masks/mask_1.png"
      },
      {
        "sortOrder": 2,
        "name": "Backsplash",
        "type": "BACKSPLASH",
        "category": "Backsplash",
        "mask": "/scenes/kitchen_3/masks/mask_2.png"
      },
      {
        "sortOrder": 3,
        "name": "Countertops",
        "type": "COUNTER",
        "category": "Counter",
        "mask": "/scenes/kitchen_3/masks/mask_3.png"
      },
      {
        "sortOrder": 4,
        "name": "Island Countertop",
        "type": "COUNTER",
        "category": "Counter",
        "mask": "/scenes/kitchen_3/masks/mask_4.png"
      },
      {
        "sortOrder": 5,
        "name": "Cabinets",
        "type": "CABINETS",
        "category": "Cabinet",
        "mask": "/scenes/kitchen_3/masks/mask_5.png"
      },
      {
        "sortOrder": 6,
        "name": "Island Cabinets",
        "type": "CABINETS",
        "category": "Cabinet",
        "mask": "/scenes/kitchen_3/masks/mask_6.png"
      },
      {
        "sortOrder": 7,
        "name": "Painted Walls",
        "type": "PAINTED WALL",
        "category": "Paint",
        "mask": "/scenes/kitchen_3/masks/mask_7.png"
      },
      {
        "sortOrder": 8,
        "name": "Trim",
        "type": "TRIM",
        "category": "Paint",
        "mask": "/scenes/kitchen_3/masks/mask_8.png"
      }
    ]
  },
  {
    "id": "kitchen_4",
    "name": "Kitchen 4",
    "category": "Kitchen",
    "specifier": "Best_Tile\\Images\\Kitchen_4",
    "baseImage": "/scenes/kitchen_4/base.jpg",
    "originalSize": {
      "width": 2000,
      "height": 1150
    },
    "surfaces": [
      {
        "sortOrder": 1,
        "name": "Floor",
        "type": "FLOOR",
        "category": "Floor",
        "mask": "/scenes/kitchen_4/masks/mask_1.png"
      },
      {
        "sortOrder": 2,
        "name": "Backsplash",
        "type": "BACKSPLASH",
        "category": "Backsplash",
        "mask": "/scenes/kitchen_4/masks/mask_2.png"
      },
      {
        "sortOrder": 3,
        "name": "Countertops",
        "type": "COUNTER",
        "category": "Counter",
        "mask": "/scenes/kitchen_4/masks/mask_3.png"
      },
      {
        "sortOrder": 4,
        "name": "Island Countertop",
        "type": "COUNTER",
        "category": "Counter",
        "mask": "/scenes/kitchen_4/masks/mask_4.png"
      },
      {
        "sortOrder": 5,
        "name": "Cabinets",
        "type": "CABINETS",
        "category": "Cabinet",
        "mask": "/scenes/kitchen_4/masks/mask_5.png"
      },
      {
        "sortOrder": 6,
        "name": "Island Cabinets",
        "type": "CABINETS",
        "category": "Cabinet",
        "mask": "/scenes/kitchen_4/masks/mask_6.png"
      },
      {
        "sortOrder": 7,
        "name": "Painted Walls",
        "type": "PAINTED WALL",
        "category": "Paint",
        "mask": "/scenes/kitchen_4/masks/mask_7.png"
      },
      {
        "sortOrder": 8,
        "name": "Trim",
        "type": "TRIM",
        "category": "Paint",
        "mask": "/scenes/kitchen_4/masks/mask_8.png"
      }
    ]
  },
  {
    "id": "kitchen_5",
    "name": "Kitchen 5",
    "category": "Kitchen",
    "specifier": "Best_Tile\\Images\\Kitchen_5",
    "baseImage": "/scenes/kitchen_5/base.jpg",
    "originalSize": {
      "width": 2000,
      "height": 1150
    },
    "surfaces": [
      {
        "sortOrder": 1,
        "name": "Floor",
        "type": "FLOOR",
        "category": "Floor",
        "mask": "/scenes/kitchen_5/masks/mask_1.png"
      },
      {
        "sortOrder": 2,
        "name": "Backsplash",
        "type": "BACKSPLASH",
        "category": "Backsplash",
        "mask": "/scenes/kitchen_5/masks/mask_2.png"
      },
      {
        "sortOrder": 3,
        "name": "Accent",
        "type": "BACKSPLASH",
        "category": "Backsplash",
        "mask": "/scenes/kitchen_5/masks/mask_3.png"
      },
      {
        "sortOrder": 4,
        "name": "Countertops",
        "type": "COUNTER",
        "category": "Counter",
        "mask": "/scenes/kitchen_5/masks/mask_4.png"
      },
      {
        "sortOrder": 5,
        "name": "Cabinets",
        "type": "CABINETS",
        "category": "Cabinet",
        "mask": "/scenes/kitchen_5/masks/mask_5.png"
      }
    ]
  },
  {
    "id": "laundry_room_1",
    "name": "Laundry Room 1",
    "category": "Laundry Room",
    "specifier": "Best_Tile\\Images\\Laundry_Room_1",
    "baseImage": "/scenes/laundry_room_1/base.jpg",
    "originalSize": {
      "width": 2000,
      "height": 1149
    },
    "surfaces": [
      {
        "sortOrder": 1,
        "name": "Floor",
        "type": "FLOOR",
        "category": "Floor",
        "mask": "/scenes/laundry_room_1/masks/mask_1.png"
      },
      {
        "sortOrder": 2,
        "name": "Accent Wall",
        "type": "WALL",
        "category": "Wall",
        "mask": "/scenes/laundry_room_1/masks/mask_2.png"
      },
      {
        "sortOrder": 3,
        "name": "Countertops",
        "type": "COUNTER",
        "category": "Counter",
        "mask": "/scenes/laundry_room_1/masks/mask_3.png"
      },
      {
        "sortOrder": 4,
        "name": "Cabinets",
        "type": "CABINETS",
        "category": "Cabinet",
        "mask": "/scenes/laundry_room_1/masks/mask_4.png"
      },
      {
        "sortOrder": 5,
        "name": "Painted Walls",
        "type": "PAINTED WALL",
        "category": "Paint",
        "mask": "/scenes/laundry_room_1/masks/mask_5.png"
      },
      {
        "sortOrder": 6,
        "name": "Trim",
        "type": "TRIM",
        "category": "Paint",
        "mask": "/scenes/laundry_room_1/masks/mask_6.png"
      }
    ]
  },
  {
    "id": "foyer_1",
    "name": "Foyer 1",
    "category": "Foyer",
    "specifier": "Best_Tile\\Images\\Foyer_1",
    "baseImage": "/scenes/foyer_1/base.jpg",
    "originalSize": {
      "width": 2000,
      "height": 1150
    },
    "surfaces": [
      {
        "sortOrder": 1,
        "name": "Floor",
        "type": "FLOOR",
        "category": "Floor",
        "mask": "/scenes/foyer_1/masks/mask_1.png"
      },
      {
        "sortOrder": 2,
        "name": "Painted Walls",
        "type": "PAINTED WALL",
        "category": "Paint",
        "mask": "/scenes/foyer_1/masks/mask_2.png"
      },
      {
        "sortOrder": 3,
        "name": "Trim",
        "type": "TRIM",
        "category": "Paint",
        "mask": "/scenes/foyer_1/masks/mask_3.png"
      }
    ]
  },
  {
    "id": "dining_room_1",
    "name": "Dining Room 1",
    "category": "Dining Room",
    "specifier": "Best_Tile\\Images\\Dining_Room_1",
    "baseImage": "/scenes/dining_room_1/base.jpg",
    "originalSize": {
      "width": 2000,
      "height": 1150
    },
    "surfaces": [
      {
        "sortOrder": 1,
        "name": "Floor",
        "type": "FLOOR",
        "category": "Floor",
        "mask": "/scenes/dining_room_1/masks/mask_1.png"
      },
      {
        "sortOrder": 2,
        "name": "Painted Walls",
        "type": "PAINTED WALL",
        "category": "Paint",
        "mask": "/scenes/dining_room_1/masks/mask_2.png"
      },
      {
        "sortOrder": 3,
        "name": "Trim",
        "type": "TRIM",
        "category": "Paint",
        "mask": "/scenes/dining_room_1/masks/mask_3.png"
      }
    ]
  },
  {
    "id": "living_room_1",
    "name": "Living Room 1",
    "category": "Living Room",
    "specifier": "Best_Tile\\Images\\Living_Room_1",
    "baseImage": "/scenes/living_room_1/base.jpg",
    "originalSize": {
      "width": 2000,
      "height": 1150
    },
    "surfaces": [
      {
        "sortOrder": 1,
        "name": "Floor",
        "type": "FLOOR",
        "category": "Floor",
        "mask": "/scenes/living_room_1/masks/mask_1.png"
      },
      {
        "sortOrder": 2,
        "name": "Fireplace",
        "type": "FIREPLACE",
        "category": "Wall",
        "mask": "/scenes/living_room_1/masks/mask_2.png"
      },
      {
        "sortOrder": 3,
        "name": "Cabinets",
        "type": "CABINETS",
        "category": "Cabinet",
        "mask": "/scenes/living_room_1/masks/mask_3.png"
      },
      {
        "sortOrder": 4,
        "name": "Painted Walls",
        "type": "PAINTED WALL",
        "category": "Paint",
        "mask": "/scenes/living_room_1/masks/mask_4.png"
      },
      {
        "sortOrder": 5,
        "name": "Trim",
        "type": "TRIM",
        "category": "Paint",
        "mask": "/scenes/living_room_1/masks/mask_5.png"
      }
    ]
  },
  {
    "id": "basement_1",
    "name": "Basement 1",
    "category": "Basement",
    "specifier": "Best_Tile\\Images\\Basement_1",
    "baseImage": "/scenes/basement_1/base.jpg",
    "originalSize": {
      "width": 2000,
      "height": 1150
    },
    "surfaces": [
      {
        "sortOrder": 1,
        "name": "Floor",
        "type": "FLOOR",
        "category": "Floor",
        "mask": "/scenes/basement_1/masks/mask_1.png"
      },
      {
        "sortOrder": 2,
        "name": "Backsplash",
        "type": "BACKSPLASH",
        "category": "Backsplash",
        "mask": "/scenes/basement_1/masks/mask_2.png"
      },
      {
        "sortOrder": 3,
        "name": "Countertops",
        "type": "COUNTER",
        "category": "Counter",
        "mask": "/scenes/basement_1/masks/mask_3.png"
      },
      {
        "sortOrder": 4,
        "name": "Fireplace",
        "type": "FIREPLACE",
        "category": "Wall",
        "mask": "/scenes/basement_1/masks/mask_4.png"
      },
      {
        "sortOrder": 5,
        "name": "Cabinets",
        "type": "CABINETS",
        "category": "Cabinet",
        "mask": "/scenes/basement_1/masks/mask_5.png"
      },
      {
        "sortOrder": 6,
        "name": "Painted Walls",
        "type": "PAINTED WALL",
        "category": "Paint",
        "mask": "/scenes/basement_1/masks/mask_6.png"
      },
      {
        "sortOrder": 7,
        "name": "Trim",
        "type": "TRIM",
        "category": "Paint",
        "mask": "/scenes/basement_1/masks/mask_7.png"
      }
    ]
  }
];

export const DEFAULT_SCENE: SceneDefinition = ALL_ROOM_SCENES.find(s => s.id === "bathroom_5") || ALL_ROOM_SCENES[0];
