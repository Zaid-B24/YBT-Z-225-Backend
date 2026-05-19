-- AlterEnum
ALTER TYPE "OrderStatus" ADD VALUE 'REFUNDED';

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "refundAmount" DOUBLE PRECISION,
ADD COLUMN     "refundRazorpayId" TEXT,
ADD COLUMN     "refundedAt" TIMESTAMP(3);
