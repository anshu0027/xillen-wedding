-- CreateEnum
CREATE TYPE "StepStatus" AS ENUM ('STEP1', 'STEP2', 'STEP3', 'COMPLETE');

-- CreateEnum
CREATE TYPE "QuoteSource" AS ENUM ('CUSTOMER', 'ADMIN');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phone" VARCHAR(15),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quote" (
    "id" SERIAL NOT NULL,
    "quoteNumber" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "email" TEXT NOT NULL,
    "coverageLevel" INTEGER,
    "liabilityCoverage" DOUBLE PRECISION,
    "liquorLiability" BOOLEAN DEFAULT false,
    "covidDisclosure" BOOLEAN,
    "specialActivities" BOOLEAN,
    "totalPremium" DOUBLE PRECISION,
    "basePremium" DOUBLE PRECISION,
    "liabilityPremium" DOUBLE PRECISION,
    "liquorLiabilityPremium" DOUBLE PRECISION,
    "status" "StepStatus" NOT NULL DEFAULT 'STEP1',
    "source" "QuoteSource" NOT NULL DEFAULT 'CUSTOMER',
    "isCustomerGenerated" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "convertedToPolicy" BOOLEAN NOT NULL DEFAULT false,
    "emailSent" BOOLEAN NOT NULL DEFAULT false,
    "emailSentAt" TIMESTAMP(3),
    "residentState" TEXT,

    CONSTRAINT "quote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Event" (
    "id" SERIAL NOT NULL,
    "quoteId" INTEGER NOT NULL,
    "eventType" TEXT NOT NULL,
    "eventDate" TIMESTAMP(3) NOT NULL,
    "maxGuests" INTEGER NOT NULL,
    "honoree1FirstName" TEXT,
    "honoree1LastName" TEXT,
    "honoree2FirstName" TEXT,
    "honoree2LastName" TEXT,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Venue" (
    "id" SERIAL NOT NULL,
    "eventId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "address1" TEXT NOT NULL,
    "address2" TEXT,
    "country" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state_column" TEXT,
    "zip_code" TEXT,
    "locationType" TEXT,
    "ceremonyLocationType" TEXT,
    "indoorOutdoor" TEXT,
    "venueAsInsured" BOOLEAN,

    CONSTRAINT "Venue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PolicyHolder" (
    "id" SERIAL NOT NULL,
    "quoteId" INTEGER NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "relationship" TEXT,
    "hearAboutUs" TEXT,
    "address" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state_column" TEXT,
    "zip_code" TEXT,
    "legalNotices" BOOLEAN,
    "completingFormName" TEXT,

    CONSTRAINT "PolicyHolder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Policy" (
    "id" SERIAL NOT NULL,
    "policyNumber" TEXT NOT NULL,
    "quoteId" INTEGER NOT NULL,
    "pdfUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "emailSent" BOOLEAN NOT NULL DEFAULT false,
    "emailSentAt" TIMESTAMP(3),

    CONSTRAINT "Policy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" SERIAL NOT NULL,
    "policyId" INTEGER NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "method" TEXT,
    "reference" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "quote_quoteNumber_key" ON "quote"("quoteNumber");

-- CreateIndex
CREATE INDEX "quote_userId_idx" ON "quote"("userId");

-- CreateIndex
CREATE INDEX "quote_status_idx" ON "quote"("status");

-- CreateIndex
CREATE INDEX "quote_source_idx" ON "quote"("source");

-- CreateIndex
CREATE INDEX "quote_convertedToPolicy_idx" ON "quote"("convertedToPolicy");

-- CreateIndex
CREATE UNIQUE INDEX "Event_quoteId_key" ON "Event"("quoteId");

-- CreateIndex
CREATE UNIQUE INDEX "Venue_eventId_key" ON "Venue"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "PolicyHolder_quoteId_key" ON "PolicyHolder"("quoteId");

-- CreateIndex
CREATE UNIQUE INDEX "Policy_policyNumber_key" ON "Policy"("policyNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Policy_quoteId_key" ON "Policy"("quoteId");

-- CreateIndex
CREATE INDEX "Payment_status_idx" ON "Payment"("status");

-- CreateIndex
CREATE INDEX "Payment_policyId_idx" ON "Payment"("policyId");

-- AddForeignKey
ALTER TABLE "quote" ADD CONSTRAINT "quote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "quote"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Venue" ADD CONSTRAINT "Venue_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PolicyHolder" ADD CONSTRAINT "PolicyHolder_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "quote"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Policy" ADD CONSTRAINT "Policy_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "quote"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_policyId_fkey" FOREIGN KEY ("policyId") REFERENCES "Policy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
