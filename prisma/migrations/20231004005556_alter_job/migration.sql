/*
  Warnings:

  - You are about to drop the column `finishedAt` on the `Job` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Job` table. All the data in the column will be lost.
  - Changed the type of `actionType` on the `Job` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "ActionType" AS ENUM ('CLAIM_ITEMS', 'TRANSFER_ASSETS');

-- AlterTable
ALTER TABLE "Job" DROP COLUMN "finishedAt",
DROP COLUMN "status",
DROP COLUMN "actionType",
ADD COLUMN     "actionType" "ActionType" NOT NULL;
