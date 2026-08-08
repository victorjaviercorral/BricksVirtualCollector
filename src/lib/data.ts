export interface LegoSet {
  id: string;
  name: string;
  theme: string;
  pieces: number;
  image: string;
  featured?: boolean;
  bricks: number;
  views: number;
}

export const MOCK_USER = {
  id: "anon_84f9",
  alias: "MasterBuilder_84",
  verified: true,
  joinDate: "2024-01-15",
  totalSets: 142,
  totalPieces: 125430,
  totalBricks: 1450,
  totalViews: 8500,
  badges: ["Classic Space Master", "Top 5% Curators", "100k Pieces Club"]
};

export const MOCK_SETS: LegoSet[] = [
  {
    id: "10305",
    name: "Castillo de los Caballeros del León",
    theme: "Icons",
    pieces: 4514,
    image: "https://images.unsplash.com/photo-1587654780291-39c9404d746b?q=80&w=1000&auto=format&fit=crop",
    featured: true,
    bricks: 890,
    views: 3400
  },
  {
    id: "10497",
    name: "Explorador Galáctico",
    theme: "Icons",
    pieces: 1254,
    image: "https://images.unsplash.com/photo-1611784964653-53d917f6312a?q=80&w=1000&auto=format&fit=crop",
    bricks: 420,
    views: 1200
  },
  {
    id: "75192",
    name: "Halcón Milenario UCS",
    theme: "Star Wars",
    pieces: 7541,
    image: "https://images.unsplash.com/photo-1599839619722-39751411ea63?q=80&w=1000&auto=format&fit=crop",
    featured: true,
    bricks: 1250,
    views: 5600
  },
  {
    id: "21058",
    name: "Gran Pirámide de Guiza",
    theme: "Architecture",
    pieces: 1476,
    image: "https://images.unsplash.com/photo-1585366119957-e9730b6d0f60?q=80&w=1000&auto=format&fit=crop",
    bricks: 210,
    views: 950
  }
];

export const MOCK_BOUNTIES = [
  { id: "6990", name: "Monorail Transport System", theme: "Space", bounty: 500, claimed: false },
  { id: "10179", name: "Ultimate Collector's Millennium Falcon", theme: "Star Wars", bounty: 300, claimed: false }
];
