-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateOfBirth" TIMESTAMP(3),
    "gender" TEXT,
    "height" DOUBLE PRECISION,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HealthData" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "steps" INTEGER,
    "heartRate" INTEGER,
    "sleepHours" DOUBLE PRECISION,
    "weight" DOUBLE PRECISION,
    "calories" DOUBLE PRECISION,
    "respiratoryRate" INTEGER,
    "bloodPressureSystolic" INTEGER,
    "bloodPressureDiastolic" INTEGER,
    "bloodGroup" TEXT,
    "bmi" DOUBLE PRECISION,
    "bodyTemp" DOUBLE PRECISION,
    "oxygenSaturation" DOUBLE PRECISION,
    "stairSteps" INTEGER,
    "elevation" DOUBLE PRECISION,
    "muscleMass" DOUBLE PRECISION,
    "bodyFat" DOUBLE PRECISION,
    "mealType" TEXT,
    "medications" TEXT,

    CONSTRAINT "HealthData_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- AddForeignKey
ALTER TABLE "HealthData" ADD CONSTRAINT "HealthData_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
