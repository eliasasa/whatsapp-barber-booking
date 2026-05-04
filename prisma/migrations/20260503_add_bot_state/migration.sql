-- CreateTable
CREATE TABLE "BotState" (
    "id" TEXT NOT NULL,
    "paused" BOOLEAN NOT NULL DEFAULT false,
    "lastPing" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BotState_pkey" PRIMARY KEY ("id")
);

-- Insert default singleton row
INSERT INTO "BotState" ("id", "paused") VALUES ('global', false) ON CONFLICT ("id") DO NOTHING;
