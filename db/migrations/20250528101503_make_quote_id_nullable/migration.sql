-- DropForeignKey
ALTER TABLE "Policy" DROP CONSTRAINT "Policy_quoteId_fkey";

-- AlterTable
ALTER TABLE "Policy" ALTER COLUMN "quoteId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Policy" ADD CONSTRAINT "Policy_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "quote"("id") ON DELETE SET NULL ON UPDATE CASCADE;
