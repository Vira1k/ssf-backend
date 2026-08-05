-- CreateTable
CREATE TABLE "VolunteerAvailability" (
    "id" SERIAL NOT NULL,
    "volunteerId" INTEGER NOT NULL,
    "scheduleId" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL,
    "reason" TEXT,
    "alternativeName" TEXT,
    "alternativeMobile" TEXT,
    "alternativeMessage" TEXT,
    "approvedBy" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VolunteerAvailability_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "VolunteerAvailability" ADD CONSTRAINT "VolunteerAvailability_volunteerId_fkey" FOREIGN KEY ("volunteerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VolunteerAvailability" ADD CONSTRAINT "VolunteerAvailability_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "Schedule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
