-- DropForeignKey
ALTER TABLE "Voucher" DROP CONSTRAINT "Voucher_tableId_fkey";

-- AlterTable
ALTER TABLE "Voucher" ALTER COLUMN "tableId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "TableVoucher" (
    "id" SERIAL NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "tableId" INTEGER,
    "voucherId" INTEGER,

    CONSTRAINT "TableVoucher_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "TableVoucher" ADD CONSTRAINT "TableVoucher_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "Table"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TableVoucher" ADD CONSTRAINT "TableVoucher_voucherId_fkey" FOREIGN KEY ("voucherId") REFERENCES "Voucher"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Voucher" ADD CONSTRAINT "Voucher_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "Table"("id") ON DELETE SET NULL ON UPDATE CASCADE;
