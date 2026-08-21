-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('gateway', 'transfer', 'cash');

-- CreateEnum
CREATE TYPE "PayoutStatus" AS ENUM ('pending', 'paid');

-- AlterTable
ALTER TABLE "supplier_profiles" ADD COLUMN     "bank_account_holder" TEXT,
ADD COLUMN     "bank_account_number" TEXT,
ADD COLUMN     "bank_name" TEXT;

-- AlterTable
ALTER TABLE "transactions" ADD COLUMN     "payment_method" "PaymentMethod" NOT NULL DEFAULT 'gateway',
ADD COLUMN     "payout_at" TIMESTAMP(3),
ADD COLUMN     "payout_note" TEXT,
ADD COLUMN     "payout_status" "PayoutStatus" NOT NULL DEFAULT 'pending';
