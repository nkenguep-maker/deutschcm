-- AlterTable
ALTER TABLE "language_centers" ADD COLUMN     "address" TEXT,
ADD COLUMN     "centerType" TEXT,
ADD COLUMN     "foundedAt" TIMESTAMP(3),
ADD COLUMN     "maxAdmins" INTEGER NOT NULL DEFAULT 5,
ADD COLUMN     "openingHours" JSONB,
ADD COLUMN     "rccm" TEXT,
ADD COLUMN     "region" TEXT,
ADD COLUMN     "socialMedia" JSONB,
ADD COLUMN     "website" TEXT;

-- AlterTable
ALTER TABLE "teachers" ADD COLUMN     "availabilitySchedule" JSONB,
ADD COLUMN     "certifications" TEXT[],
ADD COLUMN     "diploma" TEXT,
ADD COLUMN     "hourlyRate" INTEGER,
ADD COLUMN     "maxStudents" INTEGER NOT NULL DEFAULT 20,
ADD COLUMN     "yearsExp" INTEGER;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "availability" TEXT,
ADD COLUMN     "classCode" TEXT,
ADD COLUMN     "dateOfBirth" TIMESTAMP(3),
ADD COLUMN     "gender" TEXT,
ADD COLUMN     "germanLevel" TEXT,
ADD COLUMN     "learningGoal" TEXT,
ADD COLUMN     "onboardingDone" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "preferredSchedule" TEXT;
