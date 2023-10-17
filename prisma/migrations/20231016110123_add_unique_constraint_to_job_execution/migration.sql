/*
  Warnings:

  - A unique constraint covering the columns `[jobId,retries]` on the table `JobExecution` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "JobExecution_jobId_retries_key" ON "JobExecution"("jobId", "retries");
