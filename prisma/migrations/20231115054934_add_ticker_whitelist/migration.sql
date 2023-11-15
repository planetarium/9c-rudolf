-- CreateTable
CREATE TABLE "TickerWhitelist" (
    "id" TEXT NOT NULL,
    "ticker" TEXT NOT NULL,

    CONSTRAINT "TickerWhitelist_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TickerWhitelist_ticker_key" ON "TickerWhitelist"("ticker");
