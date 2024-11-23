/*
  Warnings:

  - A unique constraint covering the columns `[token]` on the table `Voucher` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Voucher_token_key" ON "Voucher"("token");
