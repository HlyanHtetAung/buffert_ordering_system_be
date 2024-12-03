-- DropForeignKey
ALTER TABLE "Menu" DROP CONSTRAINT "Menu_categoryId_fkey";

-- AlterTable
ALTER TABLE "Menu" ALTER COLUMN "categoryId" DROP NOT NULL,
ALTER COLUMN "categoryId" DROP DEFAULT;
