/*
  Warnings:

  - You are about to drop the column `teachingDay` on the `Group` table. All the data in the column will be lost.
  - You are about to drop the column `volunteerId` on the `Group` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Group" DROP CONSTRAINT "Group_volunteerId_fkey";

-- DropIndex
DROP INDEX "Group_volunteerId_key";

-- AlterTable
ALTER TABLE "Group" DROP COLUMN "teachingDay",
DROP COLUMN "volunteerId";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "groupId" INTEGER;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE SET NULL ON UPDATE CASCADE;
