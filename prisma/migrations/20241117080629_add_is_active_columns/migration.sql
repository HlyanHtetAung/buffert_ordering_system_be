-- AlterTable
ALTER TABLE "Table" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Voucher" ALTER COLUMN "isActive" SET DEFAULT true;

-- AlterTable
ALTER TABLE "VoucherMenu" ADD COLUMN     "isDone" BOOLEAN NOT NULL DEFAULT false;
