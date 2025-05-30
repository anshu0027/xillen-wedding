/*
  Warnings:

  - A unique constraint covering the columns `[policyId]` on the table `Event` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[eventId]` on the table `Policy` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[policyHolderId]` on the table `Policy` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[eventId]` on the table `quote` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[policyHolderId]` on the table `quote` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "Event" DROP CONSTRAINT "Event_quoteId_fkey";

-- DropForeignKey
ALTER TABLE "PolicyHolder" DROP CONSTRAINT "PolicyHolder_quoteId_fkey";

-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "policyId" INTEGER,
ALTER COLUMN "quoteId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Policy" ADD COLUMN     "eventId" INTEGER,
ADD COLUMN     "policyHolderId" INTEGER;

-- AlterTable
ALTER TABLE "PolicyHolder" ADD COLUMN     "policyId" INTEGER,
ALTER COLUMN "quoteId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "quote" ADD COLUMN     "eventId" INTEGER,
ADD COLUMN     "policyHolderId" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "Event_policyId_key" ON "Event"("policyId");

-- CreateIndex
CREATE UNIQUE INDEX "Policy_eventId_key" ON "Policy"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "Policy_policyHolderId_key" ON "Policy"("policyHolderId");

-- CreateIndex
CREATE UNIQUE INDEX "quote_eventId_key" ON "quote"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "quote_policyHolderId_key" ON "quote"("policyHolderId");

-- AddForeignKey
ALTER TABLE "quote" ADD CONSTRAINT "quote_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quote" ADD CONSTRAINT "quote_policyHolderId_fkey" FOREIGN KEY ("policyHolderId") REFERENCES "PolicyHolder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Policy" ADD CONSTRAINT "Policy_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Policy" ADD CONSTRAINT "Policy_policyHolderId_fkey" FOREIGN KEY ("policyHolderId") REFERENCES "PolicyHolder"("id") ON DELETE SET NULL ON UPDATE CASCADE;
