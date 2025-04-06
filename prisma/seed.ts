import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.healthData.deleteMany();
  await prisma.user.deleteMany();

  const users = await prisma.user.createMany({
    data: [
      { email: 'john.doe@example.com', name: 'John Doe' },
      { email: 'jane.doe@example.com', name: 'Jane Doe' },
      { email: 'max.mustermann@example.com', name: 'Max Mustermann' },
    ],
  });

  const createdUsers = await prisma.user.findMany();

  const startDate = new Date('2025-01-01');
  const days = 90;

  const healthData = [];

  for (const user of createdUsers) {
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);

      healthData.push({
        userId: user.id,
        date,
        steps: getRandomInt(7000, 15000),
        heartRate: getRandomInt(60, 85),
        sleepHours: parseFloat((Math.random() * 3 + 5).toFixed(1)), // 5.0 - 8.0 Stunden
        weight: parseFloat((getWeightForUser(user.email) + Math.random() * 0.6 - 0.3).toFixed(1)),
        calories: parseFloat((Math.random() * 500 + 1500).toFixed(0)), // Kalorienverbrauch 1500-2000
        respiratoryRate: getRandomInt(12, 20), // Atemfrequenz 12-20
        bloodPressure: `${getRandomInt(110, 130)}/${getRandomInt(70, 90)}`, // Blutdruck
        bloodGroup: getRandomBloodGroup(),
        bmi: parseFloat((getWeightForUser(user.email) / Math.pow(getHeightForUser(user.email), 2)).toFixed(1)), // BMI
        bodyTemp: parseFloat((36.5 + Math.random() * 1).toFixed(1)), // Körpertemperatur 36.5-37.5
        oxygenSaturation: parseFloat((Math.random() * 5 + 95).toFixed(1)), // Sauerstoffsättigung 95-100
        stairSteps: getRandomInt(0, 100), // Treppenstufen
        elevation: getRandomInt(0, 200), // Höhenmeter
        muscleMass: parseFloat((Math.random() * 2 + 30).toFixed(1)), // Muskelmasse in kg
        bodyFat: parseFloat((Math.random() * 15 + 20).toFixed(1)), // Körperfettanteil 20-35%
        medications: getMedicationsForUser(user.email), // Medikamente
      });
    }
  }

  await prisma.healthData.createMany({ data: healthData });
}

function getWeightForUser(email: string): number {
  if (email.includes('john')) return 72;
  if (email.includes('jane')) return 65;
  if (email.includes('max')) return 80;
  return 70;
}

function getHeightForUser(email: string): number {
  if (email.includes('john')) return 1.75; // John hat eine Höhe von 1,75m
  if (email.includes('jane')) return 1.65; // Jane hat eine Höhe von 1,65m
  if (email.includes('max')) return 1.80; // Max hat eine Höhe von 1,80m
  return 1.75; // Standardhöhe
}

function getRandomBloodGroup(): string {
  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  return bloodGroups[Math.floor(Math.random() * bloodGroups.length)];
}

function getMedicationsForUser(email: string): string {
  if (email.includes('john')) return 'Aspirin';
  if (email.includes('jane')) return 'Paracetamol';
  if (email.includes('max')) return 'Ibuprofen';
  return 'None';
}

function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
