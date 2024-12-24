/*
  Warnings:

  - You are about to drop the column `tableId` on the `Voucher` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Voucher" DROP CONSTRAINT "Voucher_tableId_fkey";

-- AlterTable
ALTER TABLE "Voucher" DROP COLUMN "tableId";
