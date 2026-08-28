export type Station = {
  id: string;
  name: string;
  code: string;
  city: string;
  state: string;
  transferMinutes: number; // min walk time inside station
  complexity: "low" | "medium" | "high";
};

export type TrainStop = {
  stationId: string;
  arrival: string | null; // HH:MM or null for origin
  departure: string | null; // HH:MM
  day: number; // day offset from origin departure
  platform?: string;
};

export type Train = {
  id: string;
  number: string;
  name: string;
  originId: string;
  destinationId: string;
  departure: string; // HH:MM
  arrival: string; // HH:MM next day maybe
  durationMinutes: number;
  fare: { sleeper: number; ac3: number; ac2: number };
  classes: string[];
  days: string[]; // Mon..Sun
  reliability: number; // 0-100 on-time %
  avgDelay: number; // minutes
  stops: TrainStop[];
};

export type Transfer = {
  fromStationId: string;
  toStationId: string;
  requiresStationChange: boolean;
  stationChangeTransferMinutes?: number; // 15-25
  requiredWalkingMinutes: number;
  durationMinutes: number; // buffer: departure2 - arrival1
  usableBuffer: number;
  risk: "low" | "medium" | "high" | "invalid";
  riskLabel: string;
  reason: string;
};

export type JourneyLeg =
  | { type: "train"; train: Train; from: Station; to: Station; departure: string; arrival: string; dayOffset: number }
  | { type: "transfer"; transfer: Transfer; from: Station; to: Station };

export type Journey = {
  id: string;
  origin: Station;
  destination: Station;
  legs: JourneyLeg[];
  totalDurationMinutes: number;
  totalCost: number;
  interchangeCount: number;
  riskyTransfer: Transfer | null;
  riskLevel: "low" | "medium" | "high";
  safetyScore: number;
  speedScore: number;
  costScore: number;
  reasons: string[];
  whyNotFaster?: string;
  date: string;
};

export type Preference = "easy" | "fastest" | "cheapest";

export type SavedJourney = Journey & { savedAt: string };
