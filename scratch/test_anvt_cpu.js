const { findJourneys } = require('../src/lib/engine.ts');

console.log("Testing search: 'Anand Vihar' to 'Chopan'...");
const results = findJourneys("Anand Vihar", "Chopan", "2026-08-30", "easy");
console.log("Found journeys:", results.length);
results.forEach((j, i) => {
  console.log(`\nOption ${i + 1}: ${j.origin.name} (${j.origin.code}) -> ${j.destination.name} (${j.destination.code})`);
  console.log(`Interchanges: ${j.interchangeCount}, Risk: ${j.riskLevel}, Total Duration: ${Math.floor(j.totalDurationMinutes / 60)}h ${j.totalDurationMinutes % 60}m, Fare: ₹${j.totalCost}`);
  j.legs.forEach((l, li) => {
    if (l.type === 'train') {
      console.log(`  Leg ${li + 1}: Train ${l.train.number} ${l.train.name} (${l.from.code} ${l.departure} -> ${l.to.code} ${l.arrival})`);
    } else {
      console.log(`  Transfer at ${l.from.name}: ${l.transfer.durationMinutes}m`);
    }
  });
});
