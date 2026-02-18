-- AlterTable
ALTER TABLE "ChatMessage" ADD COLUMN     "sentimentLabel" TEXT,
ADD COLUMN     "sentimentScore" INTEGER DEFAULT 0;

-- AlterTable
ALTER TABLE "ChatSession" ADD COLUMN     "currentMood" TEXT;
