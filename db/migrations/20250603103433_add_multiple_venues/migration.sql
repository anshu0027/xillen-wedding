/*
  Warnings:

  - You are about to drop the `Venue` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Venue" DROP CONSTRAINT "Venue_eventId_fkey";

-- DropTable
DROP TABLE "Venue";

-- CreateTable
CREATE TABLE "venues" (
    "id" SERIAL NOT NULL,
    "eventId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "address1" TEXT NOT NULL,
    "address2" TEXT,
    "country" TEXT NOT NULL,
    "city" TEXT,
    "state_column" TEXT,
    "zip_code" TEXT,
    "locationType" TEXT,
    "indoorOutdoor" TEXT,
    "venueAsInsured" BOOLEAN,
    "ceremonyVenueName" TEXT,
    "ceremonyVenueAddress1" TEXT,
    "ceremonyVenueAddress2" TEXT,
    "ceremonyVenueCountry" TEXT,
    "ceremonyVenueCity" TEXT,
    "ceremony_venue_state" TEXT,
    "ceremony_venue_zip" TEXT,
    "ceremonyVenueType" TEXT,
    "ceremonyVenueIndoorOutdoor" TEXT,
    "ceremonyVenueAsInsured" BOOLEAN,
    "rehearsalVenueName" TEXT,
    "rehearsalVenueAddress1" TEXT,
    "rehearsalVenueAddress2" TEXT,
    "rehearsalVenueCountry" TEXT,
    "rehearsalVenueCity" TEXT,
    "rehearsal_venue_state" TEXT,
    "rehearsal_venue_zip" TEXT,
    "rehearsalVenueType" TEXT,
    "rehearsalVenueIndoorOutdoor" TEXT,
    "rehearsalVenueAsInsured" BOOLEAN,
    "brunchVenueName" TEXT,
    "brunchVenueAddress1" TEXT,
    "brunchVenueAddress2" TEXT,
    "brunchVenueCountry" TEXT,
    "brunchVenueCity" TEXT,
    "brunch_venue_state" TEXT,
    "brunch_venue_zip" TEXT,
    "brunchVenueType" TEXT,
    "brunchVenueIndoorOutdoor" TEXT,
    "brunchVenueAsInsured" BOOLEAN,

    CONSTRAINT "venues_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "venues_eventId_key" ON "venues"("eventId");

-- AddForeignKey
ALTER TABLE "venues" ADD CONSTRAINT "venues_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
