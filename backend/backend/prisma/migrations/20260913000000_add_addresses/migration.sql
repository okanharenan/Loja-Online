-- CreateTable
CREATE TABLE IF NOT EXISTS "addresses" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "label" TEXT,
    "recipientName" TEXT NOT NULL,
    "zipCode" TEXT NOT NULL,
    "street" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "complement" TEXT,
    "neighborhood" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "addresses_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
    ALTER TABLE "addresses" ADD CONSTRAINT "addresses_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- AlterTable
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "shippingRecipientName" TEXT;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "shippingStreet" TEXT;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "shippingNumber" TEXT;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "shippingComplement" TEXT;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "shippingNeighborhood" TEXT;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "shippingCity" TEXT;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "shippingState" TEXT;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "shippingZipCode" TEXT;