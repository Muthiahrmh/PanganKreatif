-- AlterTable
ALTER TABLE "users" ADD COLUMN     "email_verified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "email_verified_at" TIMESTAMP(3),
ADD COLUMN     "verify_sent_at" TIMESTAMP(3),
ADD COLUMN     "verify_token_expires" TIMESTAMP(3),
ADD COLUMN     "verify_token_hash" TEXT;
