-- AlterTable
ALTER TABLE "users" ADD COLUMN     "levelAssignedAt" TIMESTAMP(3),
ADD COLUMN     "testAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "testScore" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "level_history" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "oldLevel" TEXT NOT NULL,
    "newLevel" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "changedBy" TEXT NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "level_history_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "level_history" ADD CONSTRAINT "level_history_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
