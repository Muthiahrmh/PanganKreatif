-- AlterTable
ALTER TABLE "products" ADD COLUMN     "bulk_min_qty" INTEGER,
ADD COLUMN     "bulk_price" DECIMAL(12,2);

-- AlterTable
ALTER TABLE "transactions" ADD COLUMN     "commission_rate" DECIMAL(5,4) NOT NULL DEFAULT 0,
ADD COLUMN     "platform_fee" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "supplier_payout" DECIMAL(12,2) NOT NULL DEFAULT 0;
