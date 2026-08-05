/*
  Warnings:

  - You are about to drop the column `date` on the `Attendance` table. All the data in the column will be lost.
  - You are about to drop the column `markedById` on the `Attendance` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Attendance` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[studentId,attendanceDate]` on the table `Attendance` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `groupId` to the `Attendance` table without a default value. This is not possible if the table is not empty.
  - Added the required column `isPresent` to the `Attendance` table without a default value. This is not possible if the table is not empty.
  - Added the required column `volunteerId` to the `Attendance` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Attendance" DROP CONSTRAINT "Attendance_markedById_fkey";

-- DropIndex
DROP INDEX "Attendance_studentId_date_key";

-- AlterTable
ALTER TABLE "Attendance" DROP COLUMN "date",
DROP COLUMN "markedById",
DROP COLUMN "status",
ADD COLUMN     "attendanceDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "groupId" INTEGER NOT NULL,
ADD COLUMN     "homeworkSubmitted" BOOLEAN DEFAULT false,
ADD COLUMN     "isPresent" BOOLEAN NOT NULL,
ADD COLUMN     "remarks" TEXT,
ADD COLUMN     "volunteerId" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Attendance_studentId_attendanceDate_key" ON "Attendance"("studentId", "attendanceDate");

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_volunteerId_fkey" FOREIGN KEY ("volunteerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
