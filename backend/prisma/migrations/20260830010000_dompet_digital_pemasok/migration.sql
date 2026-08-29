-- AlterTable
ALTER TABLE "supplier_profiles" ADD COLUMN     "ewallet_number" TEXT,
ADD COLUMN     "ewallet_holder" TEXT,
ADD COLUMN     "ewallet_providers" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
