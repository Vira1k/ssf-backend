/*
  Warnings:

  - Made the column `homeworkSubmitted` on table `Attendance` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Attendance" ALTER COLUMN "homeworkSubmitted" SET NOT NULL;

-- CreateTable
CREATE TABLE "VolunteerAttendance" (
    "id" SERIAL NOT NULL,
    "attendanceDate" TIMESTAMP(3) NOT NULL,
    "volunteerId" INTEGER NOT NULL,
    "groupId" INTEGER NOT NULL,
    "isPresent" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VolunteerAttendance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VolunteerAttendance_volunteerId_groupId_attendanceDate_key" ON "VolunteerAttendance"("volunteerId", "groupId", "attendanceDate");

-- AddForeignKey
ALTER TABLE "VolunteerAttendance" ADD CONSTRAINT "VolunteerAttendance_volunteerId_fkey" FOREIGN KEY ("volunteerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VolunteerAttendance" ADD CONSTRAINT "VolunteerAttendance_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
