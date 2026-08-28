import { Station } from "@/lib/types";

export const stations: Station[] = [
  { id: "NDLS", name: "New Delhi", code: "NDLS", city: "Delhi", state: "Delhi", transferMinutes: 12, complexity: "high" },
  { id: "DLI", name: "Old Delhi", code: "DLI", city: "Delhi", state: "Delhi", transferMinutes: 10, complexity: "medium" },
  { id: "NZM", name: "Hazrat Nizamuddin", code: "NZM", city: "Delhi", state: "Delhi", transferMinutes: 10, complexity: "medium" },
  { id: "AGC", name: "Agra Cantt", code: "AGC", city: "Agra", state: "UP", transferMinutes: 8, complexity: "low" },
  { id: "GWL", name: "Gwalior", code: "GWL", city: "Gwalior", state: "MP", transferMinutes: 7, complexity: "low" },
  { id: "JHS", name: "Jhansi", code: "JHS", city: "Jhansi", state: "UP", transferMinutes: 7, complexity: "low" },
  { id: "BPL", name: "Bhopal", code: "BPL", city: "Bhopal", state: "MP", transferMinutes: 8, complexity: "medium" },
  { id: "NGP", name: "Nagpur", code: "NGP", city: "Nagpur", state: "MH", transferMinutes: 9, complexity: "medium" },
  { id: "BSL", name: "Bhusaval", code: "BSL", city: "Bhusaval", state: "MH", transferMinutes: 8, complexity: "low" },
  { id: "MMCT", name: "Mumbai Central", code: "MMCT", city: "Mumbai", state: "MH", transferMinutes: 12, complexity: "high" },
  { id: "DDR", name: "Dadar", code: "DDR", city: "Mumbai", state: "MH", transferMinutes: 10, complexity: "medium" },
  { id: "BDTS", name: "Bandra Terminus", code: "BDTS", city: "Mumbai", state: "MH", transferMinutes: 10, complexity: "medium" },
  { id: "PUNE", name: "Pune", code: "PUNE", city: "Pune", state: "MH", transferMinutes: 9, complexity: "medium" },
  { id: "ST", name: "Surat", code: "ST", city: "Surat", state: "GJ", transferMinutes: 8, complexity: "low" },
  { id: "BRC", name: "Vadodara", code: "BRC", city: "Vadodara", state: "GJ", transferMinutes: 8, complexity: "low" },
  { id: "ADI", name: "Ahmedabad", code: "ADI", city: "Ahmedabad", state: "GJ", transferMinutes: 9, complexity: "medium" },
  { id: "JP", name: "Jaipur", code: "JP", city: "Jaipur", state: "RJ", transferMinutes: 8, complexity: "medium" },
  { id: "KOTA", name: "Kota", code: "KOTA", city: "Kota", state: "RJ", transferMinutes: 7, complexity: "low" },
  { id: "UJJ", name: "Ujjain", code: "UJJ", city: "Ujjain", state: "MP", transferMinutes: 6, complexity: "low" },
  { id: "HBJ", name: "Habibganj", code: "HBJ", city: "Bhopal", state: "MP", transferMinutes: 6, complexity: "low" },
  { id: "HYB", name: "Hyderabad Deccan", code: "HYB", city: "Hyderabad", state: "TG", transferMinutes: 9, complexity: "medium" },
  { id: "SBC", name: "KSR Bengaluru City", code: "SBC", city: "Bengaluru", state: "KA", transferMinutes: 9, complexity: "medium" },
  { id: "MAS", name: "Chennai Central", code: "MAS", city: "Chennai", state: "TN", transferMinutes: 10, complexity: "medium" },
  { id: "MAO", name: "Madgaon", code: "MAO", city: "Goa", state: "GA", transferMinutes: 7, complexity: "low" },
  { id: "VSG", name: "Vasco da Gama", code: "VSG", city: "Goa", state: "GA", transferMinutes: 6, complexity: "low" },
  { id: "ERS", name: "Ernakulam Jn", code: "ERS", city: "Kochi", state: "KL", transferMinutes: 8, complexity: "low" },
  { id: "BSB", name: "Varanasi Jn", code: "BSB", city: "Varanasi", state: "UP", transferMinutes: 8, complexity: "medium" },
  { id: "LKO", name: "Lucknow Charbagh", code: "LKO", city: "Lucknow", state: "UP", transferMinutes: 8, complexity: "medium" },
  { id: "PNBE", name: "Patna Jn", code: "PNBE", city: "Patna", state: "BR", transferMinutes: 8, complexity: "medium" },
  { id: "HWH", name: "Howrah", code: "HWH", city: "Kolkata", state: "WB", transferMinutes: 12, complexity: "high" },
];

export function getStation(id: string) {
  return stations.find((s) => s.id === id)!;
}
export function getStationByName(name: string) {
  return stations.find((s) => s.name.toLowerCase() === name.toLowerCase() || s.city.toLowerCase() === name.toLowerCase());
}
