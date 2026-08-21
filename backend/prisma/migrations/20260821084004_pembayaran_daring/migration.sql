/*
  Warnings:

  - A unique constraint covering the columns `[gateway_order_id]` on the table `transactions` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "transactions" ADD COLUMN     "gateway_order_id" TEXT,
ADD COLUMN     "paid_at" TIMESTAMP(3),
ADD COLUMN     "payment_channel" TEXT,
ADD COLUMN     "snap_token" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "transactions_gateway_order_id_key" ON "transactions"("gateway_order_id");
