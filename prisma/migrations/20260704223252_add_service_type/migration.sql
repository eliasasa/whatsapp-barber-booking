-- CreateEnum
CREATE TYPE "ServiceType" AS ENUM ('LOCAL', 'MOBILE');

-- AlterTable
ALTER TABLE "AdminUser" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "BotState" ADD COLUMN     "serviceType" "ServiceType" NOT NULL DEFAULT 'LOCAL';
