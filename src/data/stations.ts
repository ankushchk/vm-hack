import { Station } from "@/lib/types";
import allStationsData from "./all_stations.json";

export const stations: Station[] = allStationsData as Station[];

// Pre-built index maps for fast O(1) lookups
const stationMapByCode = new Map<string, Station>();
const stationMapByName = new Map<string, Station>();
const stationMapByCity = new Map<string, Station[]>();

for (const s of stations) {
  stationMapByCode.set(s.code.toUpperCase(), s);
  stationMapByName.set(s.name.toLowerCase(), s);
  
  if (s.city) {
    const c = s.city.toLowerCase();
    if (!stationMapByCity.has(c)) {
      stationMapByCity.set(c, []);
    }
    stationMapByCity.get(c)!.push(s);
  }
}

export function getStation(id: string): Station {
  if (!id) {
    return { id: "NDLS", code: "NDLS", name: "New Delhi", city: "Delhi", state: "Delhi", transferMinutes: 12, complexity: "high" };
  }
  const upper = id.toUpperCase();
  const found = stationMapByCode.get(upper) || stations.find((s) => s.id === id || s.code === upper || s.name.toLowerCase() === id.toLowerCase());
  if (found) return found;

  return {
    id: id,
    code: id.slice(0, 4).toUpperCase(),
    name: id,
    city: id,
    state: "",
    transferMinutes: 8,
    complexity: "low"
  };
}

export function getStationName(id: string): string {
  const st = getStation(id);
  return st ? st.name : id;
}

export function getStationByName(query: string): Station {
  if (!query) return getStation("NDLS");
  const q = query.trim().toLowerCase();
  const directMatch = stationMapByName.get(q);
  if (directMatch) return directMatch;

  const codeMatch = stationMapByCode.get(q.toUpperCase());
  if (codeMatch) return codeMatch;

  const cityMatches = stationMapByCity.get(q);
  if (cityMatches && cityMatches.length > 0) return cityMatches[0];

  const found = stations.find((s) => 
    s.name.toLowerCase() === q || 
    s.code.toLowerCase() === q || 
    s.city.toLowerCase() === q
  );
  if (found) return found;

  return getStation(query);
}

export const POPULAR_STATIONS: Station[] = [
  getStation("NDLS"),
  getStation("MMCT"),
  getStation("CSMT"),
  getStation("HWH"),
  getStation("SBC"),
  getStation("MAS"),
  getStation("MAO"),
  getStation("PUNE"),
  getStation("JP"),
  getStation("ADI"),
  getStation("BSB"),
  getStation("HYB")
];

export function searchStations(query: string, limit = 50): Station[] {
  if (!query || query.trim() === "") {
    return POPULAR_STATIONS;
  }

  const q = query.trim().toLowerCase();
  const qUpper = query.trim().toUpperCase();

  // Exact code match first
  const exactCode = stationMapByCode.get(qUpper);
  
  const codePrefix: Station[] = [];
  const namePrefix: Station[] = [];
  const cityPrefix: Station[] = [];
  const substringMatches: Station[] = [];

  for (const s of stations) {
    if (exactCode && s.code === exactCode.code) continue;

    const sCode = s.code.toLowerCase();
    const sName = s.name.toLowerCase();
    const sCity = s.city.toLowerCase();

    if (sCode.startsWith(q)) {
      codePrefix.push(s);
    } else if (sName.startsWith(q)) {
      namePrefix.push(s);
    } else if (sCity.startsWith(q)) {
      cityPrefix.push(s);
    } else if (sName.includes(q) || sCity.includes(q) || sCode.includes(q)) {
      substringMatches.push(s);
    }

    if (codePrefix.length + namePrefix.length + cityPrefix.length + substringMatches.length >= limit * 2) {
      break;
    }
  }

  const results: Station[] = [];
  if (exactCode) results.push(exactCode);
  results.push(...codePrefix, ...namePrefix, ...cityPrefix, ...substringMatches);

  return results.slice(0, limit);
}
