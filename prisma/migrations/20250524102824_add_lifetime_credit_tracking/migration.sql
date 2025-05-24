-- AlterTable
ALTER TABLE "User" ADD COLUMN     "lifetimeAllocated" DECIMAL(16,8) NOT NULL DEFAULT 0,
ADD COLUMN     "lifetimeCollected" DECIMAL(16,8) NOT NULL DEFAULT 0,
ADD COLUMN     "lifetimeCollections" INTEGER NOT NULL DEFAULT 0;
