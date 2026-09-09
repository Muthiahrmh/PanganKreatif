-- Rekening bersama (escrow): dana pemasok baru boleh diteruskan setelah
-- UMKM menyatakan barangnya diterima.

-- 1. Perjalanan barang untuk satu kontribusi UMKM
CREATE TYPE "FulfillmentStatus" AS ENUM ('menunggu', 'dikirim', 'diterima', 'komplain');

ALTER TABLE "procurement_order_items"
  ADD COLUMN "fulfillment_status" "FulfillmentStatus" NOT NULL DEFAULT 'menunggu',
  ADD COLUMN "shipped_at"      TIMESTAMP(3),
  ADD COLUMN "auto_confirm_at" TIMESTAMP(3),
  ADD COLUMN "received_at"     TIMESTAMP(3),
  ADD COLUMN "received_note"   TEXT,
  ADD COLUMN "complaint_at"    TIMESTAMP(3),
  ADD COLUMN "complaint_note"  TEXT;

-- 2. Penanda pelepasan dana pada transaksi
ALTER TABLE "transactions"
  ADD COLUMN "escrow_released_at"    TIMESTAMP(3),
  ADD COLUMN "escrow_release_reason" TEXT,
  ADD COLUMN "escrow_release_note"   TEXT,
  ADD COLUMN "escrow_released_by"    TEXT;

-- 3. Indeks untuk dua kueri yang sering dipakai:
--    (a) mencari item yang sudah lewat batas konfirmasi otomatis
--    (b) memisahkan dana yang ditahan dari yang siap diteruskan
CREATE INDEX "procurement_order_items_auto_confirm_idx"
  ON "procurement_order_items" ("auto_confirm_at")
  WHERE "fulfillment_status" = 'dikirim'::"FulfillmentStatus";

CREATE INDEX "transactions_escrow_idx"
  ON "transactions" ("escrow_released_at", "payout_status")
  WHERE "status" = 'success'::"TransactionStatus";

-- 4. Data lama.
--    Aturan baru tidak boleh membuat uang yang sudah beredar sebelum ini
--    ikut tertahan. Jadi seluruh transaksi yang sudah berhasil sebelum
--    migrasi ini langsung dianggap lepas, dengan alasan yang jelas
--    supaya tetap bisa dibedakan dari pelepasan yang sebenarnya.
UPDATE "transactions"
SET "escrow_released_at"    = COALESCE("paid_at", "created_at"),
    "escrow_release_reason" = 'migrasi_data_lama'
WHERE "status" = 'success'
  AND "escrow_released_at" IS NULL;

--    Item pada pesanan yang sudah ditandai terkirim sebelum migrasi
--    dianggap sudah diterima juga.
UPDATE "procurement_order_items" i
SET "fulfillment_status" = 'diterima',
    "shipped_at"         = o."created_at",
    "received_at"        = o."created_at",
    "received_note"      = 'Ditandai otomatis saat migrasi data lama'
FROM "procurement_orders" o
WHERE o."id" = i."order_id"
  AND o."status" = 'delivered'
  AND i."status" = 'paid';
