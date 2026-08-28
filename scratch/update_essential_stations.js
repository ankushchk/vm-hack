const fs = require('fs');
const path = require('path');

const stationsPath = path.join(__dirname, '..', 'src', 'data', 'all_stations.json');
let allStations = JSON.parse(fs.readFileSync(stationsPath, 'utf8'));

const existingCodes = new Set(allStations.map(s => s.code.toUpperCase()));
const existingIds = new Set(allStations.map(s => s.id.toUpperCase()));

const essentialStations = [
  { id: "ANVT", code: "ANVT", name: "Anand Vihar Terminal", city: "Delhi", state: "Delhi", transferMinutes: 15, complexity: "medium" },
  { id: "CPU", code: "CPU", name: "Chopan", city: "Chopan", state: "Uttar Pradesh", transferMinutes: 10, complexity: "medium" },
  { id: "NDLS", code: "NDLS", name: "New Delhi", city: "Delhi", state: "Delhi", transferMinutes: 15, complexity: "high" },
  { id: "NZM", code: "NZM", name: "Hazrat Nizamuddin", city: "Delhi", state: "Delhi", transferMinutes: 12, complexity: "medium" },
  { id: "DLI", code: "DLI", name: "Old Delhi", city: "Delhi", state: "Delhi", transferMinutes: 15, complexity: "high" },
  { id: "DEC", code: "DEC", name: "Delhi Cantt", city: "Delhi", state: "Delhi", transferMinutes: 10, complexity: "low" },
  { id: "DEE", code: "DEE", name: "Delhi Sarai Rohilla", city: "Delhi", state: "Delhi", transferMinutes: 12, complexity: "medium" },
  { id: "RNQ", code: "RNQ", name: "Renukoot", city: "Renukoot", state: "Uttar Pradesh", transferMinutes: 8, complexity: "low" },
  { id: "GHD", code: "GHD", name: "Garhwa Road", city: "Garhwa", state: "Jharkhand", transferMinutes: 10, complexity: "low" },
  { id: "DTO", code: "DTO", name: "Daltonganj", city: "Daltonganj", state: "Jharkhand", transferMinutes: 8, complexity: "low" },
  { id: "BRKA", code: "BRKA", name: "Barkakana", city: "Barkakana", state: "Jharkhand", transferMinutes: 10, complexity: "medium" },
  { id: "MURI", code: "MURI", name: "Muri", city: "Muri", state: "Jharkhand", transferMinutes: 10, complexity: "low" },
  { id: "RNC", code: "RNC", name: "Ranchi", city: "Ranchi", state: "Jharkhand", transferMinutes: 12, complexity: "medium" },
  { id: "HTE", code: "HTE", name: "Hatia", city: "Ranchi", state: "Jharkhand", transferMinutes: 10, complexity: "medium" },
  { id: "CAR", code: "CAR", name: "Chunar", city: "Chunar", state: "Uttar Pradesh", transferMinutes: 8, complexity: "low" },
  { id: "PRYJ", code: "PRYJ", name: "Prayagraj", city: "Prayagraj", state: "Uttar Pradesh", transferMinutes: 12, complexity: "high" },
  { id: "CNB", code: "CNB", name: "Kanpur Central", city: "Kanpur", state: "Uttar Pradesh", transferMinutes: 12, complexity: "high" },
  { id: "DDU", code: "DDU", name: "Pt. Deen Dayal Upadhyaya (Mughalsarai)", city: "Mughalsarai", state: "Uttar Pradesh", transferMinutes: 15, complexity: "high" },
  { id: "BSB", code: "BSB", name: "Varanasi", city: "Varanasi", state: "Uttar Pradesh", transferMinutes: 12, complexity: "high" },
  { id: "GKP", code: "GKP", name: "Gorakhpur", city: "Gorakhpur", state: "Uttar Pradesh", transferMinutes: 12, complexity: "high" },
  { id: "LKO", code: "LKO", name: "Lucknow", city: "Lucknow", state: "Uttar Pradesh", transferMinutes: 12, complexity: "high" },
  { id: "PNBE", code: "PNBE", name: "Patna", city: "Patna", state: "Bihar", transferMinutes: 12, complexity: "high" },
  { id: "GAYA", code: "GAYA", name: "Gaya", city: "Gaya", state: "Bihar", transferMinutes: 10, complexity: "medium" },
  { id: "DHN", code: "DHN", name: "Dhanbad", city: "Dhanbad", state: "Jharkhand", transferMinutes: 10, complexity: "medium" },
  { id: "ASN", code: "ASN", name: "Asansol", city: "Asansol", state: "West Bengal", transferMinutes: 10, complexity: "medium" },
  { id: "HWH", code: "HWH", name: "Howrah (Kolkata)", city: "Kolkata", state: "West Bengal", transferMinutes: 15, complexity: "high" },
  { id: "SDAH", code: "SDAH", name: "Sealdah (Kolkata)", city: "Kolkata", state: "West Bengal", transferMinutes: 15, complexity: "high" },
  { id: "KOAA", code: "KOAA", name: "Kolkata Terminal", city: "Kolkata", state: "West Bengal", transferMinutes: 12, complexity: "medium" },
  { id: "SHM", code: "SHM", name: "Shalimar", city: "Kolkata", state: "West Bengal", transferMinutes: 10, complexity: "medium" },
  { id: "MMCT", code: "MMCT", name: "Mumbai Central", city: "Mumbai", state: "Maharashtra", transferMinutes: 12, complexity: "high" },
  { id: "CSMT", code: "CSMT", name: "Chhatrapati Shivaji Maharaj Terminus", city: "Mumbai", state: "Maharashtra", transferMinutes: 15, complexity: "high" },
  { id: "BDTS", code: "BDTS", name: "Bandra Terminus", city: "Mumbai", state: "Maharashtra", transferMinutes: 12, complexity: "medium" },
  { id: "DDR", code: "DDR", name: "Dadar", city: "Mumbai", state: "Maharashtra", transferMinutes: 10, complexity: "high" },
  { id: "LTT", code: "LTT", name: "Lokmanya Tilak Terminus", city: "Mumbai", state: "Maharashtra", transferMinutes: 12, complexity: "medium" },
  { id: "PNVL", code: "PNVL", name: "Panvel", city: "Mumbai", state: "Maharashtra", transferMinutes: 10, complexity: "medium" },
  { id: "KYN", code: "KYN", name: "Kalyan", city: "Mumbai", state: "Maharashtra", transferMinutes: 10, complexity: "high" },
  { id: "PUNE", code: "PUNE", name: "Pune", city: "Pune", state: "Maharashtra", transferMinutes: 10, complexity: "medium" },
  { id: "MAO", code: "MAO", name: "Madgaon (Goa)", city: "Goa", state: "Goa", transferMinutes: 8, complexity: "low" },
  { id: "KRMI", code: "KRMI", name: "Karmali (Goa)", city: "Goa", state: "Goa", transferMinutes: 8, complexity: "low" },
  { id: "VSG", code: "VSG", name: "Vasco da Gama", city: "Goa", state: "Goa", transferMinutes: 8, complexity: "low" },
  { id: "KOTA", code: "KOTA", name: "Kota", city: "Kota", state: "Rajasthan", transferMinutes: 10, complexity: "medium" },
  { id: "BRC", code: "BRC", name: "Vadodara", city: "Vadodara", state: "Gujarat", transferMinutes: 10, complexity: "medium" },
  { id: "ADI", code: "ADI", name: "Ahmedabad", city: "Ahmedabad", state: "Gujarat", transferMinutes: 12, complexity: "high" },
  { id: "ST", code: "ST", name: "Surat", city: "Surat", state: "Gujarat", transferMinutes: 10, complexity: "medium" },
  { id: "BPL", code: "BPL", name: "Bhopal", city: "Bhopal", state: "Madhya Pradesh", transferMinutes: 10, complexity: "medium" },
  { id: "JHS", code: "JHS", name: "Virangana Lakshmibai (Jhansi)", city: "Jhansi", state: "Uttar Pradesh", transferMinutes: 10, complexity: "medium" },
  { id: "GWL", code: "GWL", name: "Gwalior", city: "Gwalior", state: "Madhya Pradesh", transferMinutes: 8, complexity: "low" },
  { id: "AGC", code: "AGC", name: "Agra Cantt", city: "Agra", state: "Uttar Pradesh", transferMinutes: 10, complexity: "medium" },
  { id: "JP", code: "JP", name: "Jaipur", city: "Jaipur", state: "Rajasthan", transferMinutes: 10, complexity: "medium" },
  { id: "NGP", code: "NGP", name: "Nagpur", city: "Nagpur", state: "Maharashtra", transferMinutes: 10, complexity: "medium" },
  { id: "MAS", code: "MAS", name: "Chennai Central", city: "Chennai", state: "Tamil Nadu", transferMinutes: 15, complexity: "high" },
  { id: "SBC", code: "SBC", name: "KSR Bengaluru", city: "Bengaluru", state: "Karnataka", transferMinutes: 12, complexity: "high" },
  { id: "YPR", code: "YPR", name: "Yesvantpur", city: "Bengaluru", state: "Karnataka", transferMinutes: 12, complexity: "medium" },
  { id: "HYB", code: "HYB", name: "Hyderabad Deccan", city: "Hyderabad", state: "Telangana", transferMinutes: 10, complexity: "medium" },
  { id: "SC", code: "SC", name: "Secunderabad", city: "Hyderabad", state: "Telangana", transferMinutes: 12, complexity: "high" },
  { id: "GHY", code: "GHY", name: "Guwahati", city: "Guwahati", state: "Assam", transferMinutes: 12, complexity: "medium" },
  { id: "BBS", code: "BBS", name: "Bhubaneswar", city: "Bhubaneswar", state: "Odisha", transferMinutes: 10, complexity: "medium" },
  { id: "VSKP", code: "VSKP", name: "Visakhapatnam", city: "Visakhapatnam", state: "Andhra Pradesh", transferMinutes: 12, complexity: "medium" },
];

let added = 0;
for (const st of essentialStations) {
  const existingIdx = allStations.findIndex(s => s.code.toUpperCase() === st.code.toUpperCase() || s.id.toUpperCase() === st.id.toUpperCase());
  if (existingIdx !== -1) {
    allStations[existingIdx] = { ...allStations[existingIdx], ...st };
  } else {
    allStations.unshift(st);
    added++;
  }
}

fs.writeFileSync(stationsPath, JSON.stringify(allStations, null, 2));
console.log(`Updated all_stations.json. Added ${added} new stations. Total stations: ${allStations.length}`);
