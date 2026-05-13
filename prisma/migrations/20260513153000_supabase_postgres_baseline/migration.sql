-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('STUDENT', 'LANDOWNER');

-- CreateEnum
CREATE TYPE "AvailabilityStatus" AS ENUM ('AVAILABLE', 'FULL', 'INACTIVE');

-- CreateTable
CREATE TABLE "account" (
    "account_id" SERIAL NOT NULL,
    "account_type" "AccountType" NOT NULL,
    "email" TEXT NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "student_id" INTEGER,
    "landowner_id" INTEGER,

    CONSTRAINT "account_pkey" PRIMARY KEY ("account_id")
);

-- CreateTable
CREATE TABLE "boarding_house" (
    "boardinghouse_id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "location" VARCHAR(255) NOT NULL,
    "availability_status" "AvailabilityStatus" NOT NULL DEFAULT 'AVAILABLE',
    "amenities" TEXT NOT NULL,
    "landowner_id" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "contact_number" TEXT,
    "distance_fron_university" VARCHAR(255) NOT NULL,
    "reference_map" TEXT,
    "view_count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "boarding_house_pkey" PRIMARY KEY ("boardinghouse_id")
);

-- CreateTable
CREATE TABLE "boardinghouse_photos" (
    "photo_id" SERIAL NOT NULL,
    "boardinghouse_id" INTEGER NOT NULL,
    "photo_url" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "boardinghouse_photos_pkey" PRIMARY KEY ("photo_id")
);

-- CreateTable
CREATE TABLE "favorites" (
    "favorite_id" SERIAL NOT NULL,
    "student_id" INTEGER NOT NULL,
    "boardinghouse_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "favorites_pkey" PRIMARY KEY ("favorite_id")
);

-- CreateTable
CREATE TABLE "property_views" (
    "view_id" SERIAL NOT NULL,
    "boardinghouse_id" INTEGER NOT NULL,
    "student_id" INTEGER NOT NULL,
    "viewed_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "property_views_pkey" PRIMARY KEY ("view_id")
);

-- CreateTable
CREATE TABLE "landowner" (
    "landowner_id" SERIAL NOT NULL,
    "firstName" VARCHAR(100) NOT NULL,
    "middleName" VARCHAR(100),
    "lastName" VARCHAR(100) NOT NULL,
    "email" TEXT NOT NULL,
    "address" VARCHAR(255) NOT NULL,
    "gender" VARCHAR(50) NOT NULL,
    "mobile_no" VARCHAR(50) NOT NULL,
    "birthdate" DATE NOT NULL,

    CONSTRAINT "landowner_pkey" PRIMARY KEY ("landowner_id")
);

-- CreateTable
CREATE TABLE "rooms" (
    "room_id" SERIAL NOT NULL,
    "room_type" VARCHAR(255) NOT NULL,
    "description" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "availability_status" "AvailabilityStatus" NOT NULL DEFAULT 'AVAILABLE',
    "student_id" INTEGER,
    "boardinghouse_id" INTEGER NOT NULL,

    CONSTRAINT "rooms_pkey" PRIMARY KEY ("room_id")
);

-- CreateTable
CREATE TABLE "student" (
    "student_id" SERIAL NOT NULL,
    "firstName" VARCHAR(100) NOT NULL,
    "middleName" VARCHAR(100),
    "lastName" VARCHAR(100) NOT NULL,
    "email" TEXT NOT NULL,
    "address" VARCHAR(255) NOT NULL,
    "gender" VARCHAR(50) NOT NULL,
    "age" INTEGER NOT NULL,
    "mobile_no" VARCHAR(50) NOT NULL,
    "birthdate" DATE NOT NULL,

    CONSTRAINT "student_pkey" PRIMARY KEY ("student_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "account_email_key" ON "account"("email");

-- CreateIndex
CREATE UNIQUE INDEX "account_student_id_key" ON "account"("student_id");

-- CreateIndex
CREATE UNIQUE INDEX "account_landowner_id_key" ON "account"("landowner_id");

-- CreateIndex
CREATE INDEX "boarding_house_landowner_id_idx" ON "boarding_house"("landowner_id");

-- CreateIndex
CREATE INDEX "boardinghouse_photos_boardinghouse_id_idx" ON "boardinghouse_photos"("boardinghouse_id");

-- CreateIndex
CREATE INDEX "favorites_boardinghouse_id_idx" ON "favorites"("boardinghouse_id");

-- CreateIndex
CREATE UNIQUE INDEX "uniq_favorite" ON "favorites"("student_id", "boardinghouse_id");

-- CreateIndex
CREATE INDEX "property_views_boardinghouse_id_idx" ON "property_views"("boardinghouse_id");

-- CreateIndex
CREATE UNIQUE INDEX "property_views_student_id_boardinghouse_id_key" ON "property_views"("student_id", "boardinghouse_id");

-- CreateIndex
CREATE UNIQUE INDEX "landowner_email_key" ON "landowner"("email");

-- CreateIndex
CREATE INDEX "rooms_boardinghouse_id_idx" ON "rooms"("boardinghouse_id");

-- CreateIndex
CREATE INDEX "rooms_student_id_idx" ON "rooms"("student_id");

-- CreateIndex
CREATE UNIQUE INDEX "student_email_key" ON "student"("email");

-- AddForeignKey
ALTER TABLE "account" ADD CONSTRAINT "fk_account_landowner" FOREIGN KEY ("landowner_id") REFERENCES "landowner"("landowner_id") ON DELETE SET NULL ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "account" ADD CONSTRAINT "fk_account_student" FOREIGN KEY ("student_id") REFERENCES "student"("student_id") ON DELETE SET NULL ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "boarding_house" ADD CONSTRAINT "fk_boardinghouse_landowner" FOREIGN KEY ("landowner_id") REFERENCES "landowner"("landowner_id") ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "boardinghouse_photos" ADD CONSTRAINT "fk_photos_boardinghouse" FOREIGN KEY ("boardinghouse_id") REFERENCES "boarding_house"("boardinghouse_id") ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "favorites" ADD CONSTRAINT "fk_favorite_boardinghouse" FOREIGN KEY ("boardinghouse_id") REFERENCES "boarding_house"("boardinghouse_id") ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "favorites" ADD CONSTRAINT "fk_favorite_student" FOREIGN KEY ("student_id") REFERENCES "student"("student_id") ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "property_views" ADD CONSTRAINT "property_views_boardinghouse_id_fkey" FOREIGN KEY ("boardinghouse_id") REFERENCES "boarding_house"("boardinghouse_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property_views" ADD CONSTRAINT "property_views_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "student"("student_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rooms" ADD CONSTRAINT "fk_rooms_boardinghouse" FOREIGN KEY ("boardinghouse_id") REFERENCES "boarding_house"("boardinghouse_id") ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "rooms" ADD CONSTRAINT "fk_rooms_student" FOREIGN KEY ("student_id") REFERENCES "student"("student_id") ON DELETE SET NULL ON UPDATE RESTRICT;

