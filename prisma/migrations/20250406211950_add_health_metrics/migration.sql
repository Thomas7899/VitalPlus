/*
  Warnings:

  - You are about to drop the column `createdAt` on the `HealthData` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "HealthData" DROP COLUMN "createdAt",
ADD COLUMN     "bloodGroup" TEXT,
ADD COLUMN     "bloodPressure" TEXT,
ADD COLUMN     "bmi" DOUBLE PRECISION,
ADD COLUMN     "bodyFat" DOUBLE PRECISION,
ADD COLUMN     "bodyTemp" DOUBLE PRECISION,
ADD COLUMN     "calories" DOUBLE PRECISION,
ADD COLUMN     "elevation" DOUBLE PRECISION,
ADD COLUMN     "height" DOUBLE PRECISION,
ADD COLUMN     "medications" TEXT,
ADD COLUMN     "muscleMass" DOUBLE PRECISION,
ADD COLUMN     "oxygenSaturation" DOUBLE PRECISION,
ADD COLUMN     "respiratoryRate" INTEGER,
ADD COLUMN     "stairSteps" INTEGER;
