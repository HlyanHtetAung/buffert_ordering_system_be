/*
  Warnings:

  - Added the required column `quantity` to the `VoucherMenu` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "VoucherMenu" ADD COLUMN     "quantity" INTEGER NOT NULL;
