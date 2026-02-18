-- AlterTable
ALTER TABLE "ChatSession" ADD COLUMN     "isRestricted" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "EndUser" ADD COLUMN     "isBlocked" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "KnowledgeChunk" ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "sourceType" TEXT NOT NULL DEFAULT 'text';

-- AlterTable
ALTER TABLE "Tenant" ADD COLUMN     "chatConfig" JSONB;

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT,
    "role" TEXT NOT NULL DEFAULT 'admin',
    "tenantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
