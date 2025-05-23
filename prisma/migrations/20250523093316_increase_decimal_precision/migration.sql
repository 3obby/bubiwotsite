/*
  Warnings:

  - Added the required column `balanceAfter` to the `BurnedCredit` table without a default value. This is not possible if the table is not empty.
  - Added the required column `balanceBefore` to the `BurnedCredit` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "BurnedCredit_globalBalanceId_idx";

-- AlterTable
ALTER TABLE "BurnedCredit" ADD COLUMN     "balanceAfter" DECIMAL(12,8) NOT NULL,
ADD COLUMN     "balanceBefore" DECIMAL(12,8) NOT NULL;

-- AlterTable
ALTER TABLE "GlobalTokenBalance" ALTER COLUMN "totalIssued" SET DATA TYPE DECIMAL(28,8),
ALTER COLUMN "totalBurned" SET DATA TYPE DECIMAL(28,8),
ALTER COLUMN "circulating" SET DATA TYPE DECIMAL(28,8);

-- CreateTable
CREATE TABLE "TransactionRecord" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "transactionType" TEXT NOT NULL,
    "amount" DECIMAL(12,8) NOT NULL,
    "balanceBefore" DECIMAL(12,8) NOT NULL,
    "balanceAfter" DECIMAL(12,8) NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TransactionRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TransactionRecord_userId_idx" ON "TransactionRecord"("userId");

-- CreateIndex
CREATE INDEX "TransactionRecord_transactionType_idx" ON "TransactionRecord"("transactionType");

-- CreateIndex
CREATE INDEX "TransactionRecord_createdAt_idx" ON "TransactionRecord"("createdAt");

-- CreateIndex
CREATE INDEX "BurnedCredit_createdAt_idx" ON "BurnedCredit"("createdAt");

-- CreateIndex
CREATE INDEX "GlobalTokenBalance_timestamp_idx" ON "GlobalTokenBalance"("timestamp");

-- AddForeignKey
ALTER TABLE "TransactionRecord" ADD CONSTRAINT "TransactionRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
