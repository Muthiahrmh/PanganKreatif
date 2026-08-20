-- CreateEnum
CREATE TYPE "Role" AS ENUM ('umkm', 'supplier', 'admin');

-- CreateEnum
CREATE TYPE "ProcurementStatus" AS ENUM ('open', 'closed', 'delivered');

-- CreateEnum
CREATE TYPE "ItemStatus" AS ENUM ('pending', 'paid');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('pending', 'success', 'failed');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "phone" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "umkm_profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "business_name" TEXT NOT NULL,
    "business_type" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "address" TEXT NOT NULL,

    CONSTRAINT "umkm_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supplier_profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "group_name" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "address" TEXT NOT NULL,

    CONSTRAINT "supplier_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "supplier_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "price" DECIMAL(12,2) NOT NULL,
    "stock" INTEGER NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_records" (
    "id" TEXT NOT NULL,
    "umkm_id" TEXT NOT NULL,
    "product_name" TEXT NOT NULL,
    "quantity" DECIMAL(12,2) NOT NULL,
    "date" DATE NOT NULL,

    CONSTRAINT "sales_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "forecast_results" (
    "id" TEXT NOT NULL,
    "umkm_id" TEXT NOT NULL,
    "product_name" TEXT NOT NULL,
    "predicted_quantity" DECIMAL(12,2) NOT NULL,
    "period" DATE NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "forecast_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "procurement_orders" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "total_quantity" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "status" "ProcurementStatus" NOT NULL DEFAULT 'open',
    "deadline" DATE NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "procurement_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "procurement_order_items" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "umkm_id" TEXT NOT NULL,
    "quantity" DECIMAL(12,2) NOT NULL,
    "status" "ItemStatus" NOT NULL DEFAULT 'pending',

    CONSTRAINT "procurement_order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" TEXT NOT NULL,
    "order_item_id" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "payment_proof_url" TEXT,
    "status" "TransactionStatus" NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "umkm_profiles_user_id_key" ON "umkm_profiles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "supplier_profiles_user_id_key" ON "supplier_profiles"("user_id");

-- AddForeignKey
ALTER TABLE "umkm_profiles" ADD CONSTRAINT "umkm_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_profiles" ADD CONSTRAINT "supplier_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "supplier_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_records" ADD CONSTRAINT "sales_records_umkm_id_fkey" FOREIGN KEY ("umkm_id") REFERENCES "umkm_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "forecast_results" ADD CONSTRAINT "forecast_results_umkm_id_fkey" FOREIGN KEY ("umkm_id") REFERENCES "umkm_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "procurement_orders" ADD CONSTRAINT "procurement_orders_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "procurement_order_items" ADD CONSTRAINT "procurement_order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "procurement_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "procurement_order_items" ADD CONSTRAINT "procurement_order_items_umkm_id_fkey" FOREIGN KEY ("umkm_id") REFERENCES "umkm_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_order_item_id_fkey" FOREIGN KEY ("order_item_id") REFERENCES "procurement_order_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
