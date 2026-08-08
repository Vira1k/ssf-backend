-- CreateIndex
CREATE INDEX "Attendance_groupId_attendanceDate_idx" ON "Attendance"("groupId", "attendanceDate");

-- CreateIndex
CREATE INDEX "Schedule_volunteerId_status_idx" ON "Schedule"("volunteerId", "status");

-- CreateIndex
CREATE INDEX "TeachingReport_groupId_reportDate_idx" ON "TeachingReport"("groupId", "reportDate");
