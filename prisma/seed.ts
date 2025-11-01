import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const prisma = new PrismaClient();

async function main() {
  console.log('Lösche alte Daten...');
  await prisma.$executeRawUnsafe('TRUNCATE TABLE "Calories" RESTART IDENTITY CASCADE;').catch(() => console.log('Tabelle "Calories" nicht gefunden, wird übersprungen.'));
  await prisma.healthData.deleteMany();
  await prisma.user.deleteMany();
  console.log('Alte Daten gelöscht.');

  console.log('Erstelle neuen Benutzer mit fester ID...');
  const hashedPassword = await bcrypt.hash('password123', 10);

  const user = await prisma.user.create({
    data: {
      id: '2fbb9c24-cdf8-49db-9b74-0762017445a1', 
      email: 'john.doe@example.com',
      name: 'John Doe',
      height: 1.75,
      gender: 'männlich',
      dateOfBirth: new Date('1990-01-01'),
      password: hashedPassword,
    },
  });

  const year = 2025;
  const startDate = new Date(year, 0, 1); 
  const endDate = new Date(year, 11, 31);

  const healthData = [];
  console.log(`Generiere Gesundheitsdaten für das Jahr ${year}...`);
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const [systolic, diastolic] = getRandomBloodPressure();

      const breakfastTime = new Date(d);
      breakfastTime.setHours(getRandomInt(7, 9), getRandomInt(0, 59));

      healthData.push({
        userId: user.id,
        date: breakfastTime,
        steps: getRandomInt(7000, 15000),
        heartRate: getRandomInt(60, 85),
        sleepHours: parseFloat((Math.random() * 3 + 5).toFixed(1)), 
        weight: parseFloat((getInitialWeight(user.gender) + Math.random() * 2 - 1).toFixed(1)),
        calories: getRandomInt(400, 700),
        mealType: 'Frühstück',
        respiratoryRate: getRandomInt(12, 20), 
        bloodPressureSystolic: systolic,
        bloodPressureDiastolic: diastolic,
        bmi: parseFloat((getInitialWeight(user.gender) / Math.pow(user.height || 1.75, 2)).toFixed(1)), 
        bodyTemp: parseFloat((36.5 + Math.random() * 1).toFixed(1)), 
        oxygenSaturation: parseFloat((Math.random() * 5 + 95).toFixed(1)), 
        stairSteps: getRandomInt(0, 100), 
        elevation: getRandomInt(0, 200), 
        muscleMass: parseFloat((Math.random() * 2 + 30).toFixed(1)), 
        bodyFat: parseFloat((Math.random() * 15 + 20).toFixed(1)), 
      });

      const lunchTime = new Date(d);
      lunchTime.setHours(getRandomInt(12, 14), getRandomInt(0, 59));
      healthData.push({ userId: user.id, date: lunchTime, calories: getRandomInt(500, 900), mealType: 'Mittagessen' });

      const dinnerTime = new Date(d);
      dinnerTime.setHours(getRandomInt(18, 20), getRandomInt(0, 59));
      healthData.push({ userId: user.id, date: dinnerTime, calories: getRandomInt(500, 800), mealType: 'Abendessen' });

      if (Math.random() > 0.5) {
        const snackTime = new Date(d);
        snackTime.setHours(getRandomInt(15, 16), getRandomInt(0, 59));
        healthData.push({ userId: user.id, date: snackTime, calories: getRandomInt(100, 300), mealType: 'Snacks' });
      }
    }

  await prisma.healthData.createMany({ data: healthData });
  console.log('Seed-Daten erfolgreich erstellt.');
}

function getInitialWeight(gender: string | null): number {
  if (gender === 'männlich') return 75;
  if (gender === 'weiblich') return 65;
  return 70;
}

function getRandomBloodPressure(): [number, number] {
  const chance = Math.random();
  let systolic: number, diastolic: number;
  if (chance < 0.7) {
    // 70% Chance für normalen Blutdruck
    [systolic, diastolic] = [getRandomInt(110, 125), getRandomInt(70, 80)];
  } else if (chance < 0.9) {
    // 20% Chance für erhöhten Blutdruck / Stufe 1
    [systolic, diastolic] = [getRandomInt(130, 145), getRandomInt(85, 95)];
  } else {
    // 10% Chance für höheren Blutdruck
    [systolic, diastolic] = [getRandomInt(145, 160), getRandomInt(95, 105)];
  }
  return [systolic, diastolic];
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
