-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "alias" TEXT NOT NULL DEFAULT 'anon',
    "hasLoggedIn" BOOLEAN NOT NULL DEFAULT false,
    "credits" DECIMAL(12,8) NOT NULL DEFAULT 0.000777,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BurnedCredit" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" DECIMAL(12,8) NOT NULL,
    "action" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "globalBalanceId" TEXT,

    CONSTRAINT "BurnedCredit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GlobalTokenBalance" (
    "id" TEXT NOT NULL,
    "totalIssued" DECIMAL(20,8) NOT NULL DEFAULT 0,
    "totalBurned" DECIMAL(20,8) NOT NULL DEFAULT 0,
    "circulating" DECIMAL(20,8) NOT NULL DEFAULT 0,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GlobalTokenBalance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BurnedCredit_userId_idx" ON "BurnedCredit"("userId");

-- CreateIndex
CREATE INDEX "BurnedCredit_globalBalanceId_idx" ON "BurnedCredit"("globalBalanceId");

-- AddForeignKey
ALTER TABLE "BurnedCredit" ADD CONSTRAINT "BurnedCredit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BurnedCredit" ADD CONSTRAINT "BurnedCredit_globalBalanceId_fkey" FOREIGN KEY ("globalBalanceId") REFERENCES "GlobalTokenBalance"("id") ON DELETE SET NULL ON UPDATE CASCADE;
