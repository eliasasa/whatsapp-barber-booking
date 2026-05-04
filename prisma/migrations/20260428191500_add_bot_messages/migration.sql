-- CreateEnum
CREATE TYPE "BotMessageKey" AS ENUM ('GREETING');

-- CreateTable
CREATE TABLE "BotMessage" (
    "id" TEXT NOT NULL,
    "key" "BotMessageKey" NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BotMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BotMessage_key_key" ON "BotMessage"("key");
