-- AlterTable
ALTER TABLE "users" ADD COLUMN     "otp_hash" TEXT,
ADD COLUMN     "otp_expires" TIMESTAMP(3),
ADD COLUMN     "otp_sent_at" TIMESTAMP(3),
ADD COLUMN     "otp_attempts" INTEGER NOT NULL DEFAULT 0;
