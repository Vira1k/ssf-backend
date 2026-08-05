-- AlterTable
ALTER TABLE "Schedule" ADD COLUMN     "replacementVolunteerId" INTEGER;

-- AddForeignKey
ALTER TABLE "Schedule" ADD CONSTRAINT "Schedule_replacementVolunteerId_fkey" FOREIGN KEY ("replacementVolunteerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
