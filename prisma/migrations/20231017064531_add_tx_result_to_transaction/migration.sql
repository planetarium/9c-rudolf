-- CreateEnum
CREATE TYPE "TxResult" AS ENUM ('INVALID', 'STAGING', 'SUCCESS', 'FAILURE');

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "lastStatus" "TxResult",
ADD COLUMN     "statusUpdatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
