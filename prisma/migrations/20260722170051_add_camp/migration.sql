/*
  Warnings:

  - A unique constraint covering the columns `[campId,name]` on the table `Group` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `campId` to the `Group` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Group_name_key";

-- AlterTable
ALTER TABLE "Group" ADD COLUMN     "campId" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "Camp" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Camp_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Camp_name_key" ON "Camp"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Group_campId_name_key" ON "Group"("campId", "name");

-- AddForeignKey
ALTER TABLE "Group" ADD CONSTRAINT "Group_campId_fkey" FOREIGN KEY ("campId") REFERENCES "Camp"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
