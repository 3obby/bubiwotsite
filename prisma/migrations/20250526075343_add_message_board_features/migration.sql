-- AlterTable
ALTER TABLE "Post" ADD COLUMN     "effectiveValue" DECIMAL(12,8) NOT NULL DEFAULT 0,
ADD COLUMN     "expiresAt" TIMESTAMP(3),
ADD COLUMN     "stake" DECIMAL(12,8) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Reply" ADD COLUMN     "effectiveValue" DECIMAL(12,8) NOT NULL DEFAULT 0,
ADD COLUMN     "expiresAt" TIMESTAMP(3),
ADD COLUMN     "stake" DECIMAL(12,8) NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "EmojiReaction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "postId" TEXT,
    "replyId" TEXT,
    "emoji" TEXT NOT NULL,
    "amount" DECIMAL(12,8) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmojiReaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EmojiReaction_postId_idx" ON "EmojiReaction"("postId");

-- CreateIndex
CREATE INDEX "EmojiReaction_replyId_idx" ON "EmojiReaction"("replyId");

-- CreateIndex
CREATE INDEX "EmojiReaction_userId_idx" ON "EmojiReaction"("userId");

-- CreateIndex
CREATE INDEX "EmojiReaction_emoji_idx" ON "EmojiReaction"("emoji");

-- CreateIndex
CREATE INDEX "EmojiReaction_createdAt_idx" ON "EmojiReaction"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "EmojiReaction_userId_postId_emoji_key" ON "EmojiReaction"("userId", "postId", "emoji");

-- CreateIndex
CREATE UNIQUE INDEX "EmojiReaction_userId_replyId_emoji_key" ON "EmojiReaction"("userId", "replyId", "emoji");

-- CreateIndex
CREATE INDEX "Post_effectiveValue_createdAt_idx" ON "Post"("effectiveValue", "createdAt");

-- CreateIndex
CREATE INDEX "Post_expiresAt_idx" ON "Post"("expiresAt");

-- CreateIndex
CREATE INDEX "Reply_postId_effectiveValue_idx" ON "Reply"("postId", "effectiveValue");

-- CreateIndex
CREATE INDEX "Reply_expiresAt_idx" ON "Reply"("expiresAt");

-- AddForeignKey
ALTER TABLE "EmojiReaction" ADD CONSTRAINT "EmojiReaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmojiReaction" ADD CONSTRAINT "EmojiReaction_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmojiReaction" ADD CONSTRAINT "EmojiReaction_replyId_fkey" FOREIGN KEY ("replyId") REFERENCES "Reply"("id") ON DELETE CASCADE ON UPDATE CASCADE;
