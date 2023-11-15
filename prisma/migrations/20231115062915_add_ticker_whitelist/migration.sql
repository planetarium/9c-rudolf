-- CreateTable
CREATE TABLE "TickerWhitelist" (
    "id" SERIAL NOT NULL,
    "ticker" TEXT NOT NULL,

    CONSTRAINT "TickerWhitelist_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TickerWhitelist_ticker_key" ON "TickerWhitelist"("ticker");

INSERT INTO "TickerWhitelist"(ticker) VALUES
('NCG'), ('FAV_CRYSTAL'), ('Item_NT_400000'), ('Item_NT_500000'), ('Item_T_40100015'), ('Item_T_40100016'), ('Item_T_40100017'), ('Item_T_10130002');
