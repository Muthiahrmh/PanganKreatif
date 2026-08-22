-- AlterTable
ALTER TABLE "transactions" ADD COLUMN     "distribution_margin" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "margin_rate" DECIMAL(5,4) NOT NULL DEFAULT 0,
ADD COLUMN     "payout_proof_path" TEXT;
