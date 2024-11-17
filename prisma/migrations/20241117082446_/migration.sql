/*
  Warnings:

  - A unique constraint covering the columns `[tableNo]` on the table `Table` will be added. If there are existing duplicate values, this will fail.
  - Changed the type of `tableNo` on the `Table` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "Table" ADD COLUMN     "tableName" TEXT,
DROP COLUMN "tableNo",
ADD COLUMN     "tableNo" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Table_tableNo_key" ON "Table"("tableNo");
