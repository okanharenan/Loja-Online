-- AlterTable
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "stripeSessionId" TEXT;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "stripeCheckoutUrl" TEXT;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "stripePaymentIntentId" TEXT;