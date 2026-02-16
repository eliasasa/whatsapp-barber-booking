/*
  Warnings:

  - A unique constraint covering the columns `[weekday]` on the table `Availability` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Availability_weekday_key" ON "Availability"("weekday");
