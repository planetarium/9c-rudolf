-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "nonce" BIGINT NOT NULL,
    "raw" BYTEA NOT NULL,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_id_key" ON "Transaction"("id");

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_nonce_key" ON "Transaction"("nonce");

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;
