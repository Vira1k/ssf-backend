/*
  Warnings:

  - Added the required column `maxMarks` to the `Mark` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Mark" ADD COLUMN     "maxMarks" INTEGER NOT NULL,
ADD COLUMN     "remarks" TEXT;
