/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `rooms` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "public"."RoomVisibility" AS ENUM ('PUBLIC', 'PRIVATE');

-- CreateEnum
CREATE TYPE "public"."MembershipStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "public"."Role" ADD VALUE 'OWNER';
ALTER TYPE "public"."Role" ADD VALUE 'VIEWER';

-- DropForeignKey
ALTER TABLE "public"."accounts" DROP CONSTRAINT "accounts_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."refresh_tokens" DROP CONSTRAINT "refresh_tokens_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."room_members" DROP CONSTRAINT "room_members_roomId_fkey";

-- DropForeignKey
ALTER TABLE "public"."room_members" DROP CONSTRAINT "room_members_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."rooms" DROP CONSTRAINT "rooms_ownerId_fkey";

-- AlterTable
ALTER TABLE "public"."room_members" ADD COLUMN     "status" "public"."MembershipStatus" NOT NULL DEFAULT 'ACCEPTED';

-- AlterTable
ALTER TABLE "public"."rooms" ADD COLUMN     "visibility" "public"."RoomVisibility" NOT NULL DEFAULT 'PUBLIC';

-- CreateTable
CREATE TABLE "public"."room_invitations" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "invitedId" TEXT NOT NULL,
    "inviterId" TEXT NOT NULL,
    "status" "public"."MembershipStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "room_invitations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "room_invitations_status_idx" ON "public"."room_invitations"("status");

-- CreateIndex
CREATE UNIQUE INDEX "room_invitations_roomId_invitedId_key" ON "public"."room_invitations"("roomId", "invitedId");

-- CreateIndex
CREATE INDEX "room_members_roomId_status_idx" ON "public"."room_members"("roomId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "rooms_name_key" ON "public"."rooms"("name");

-- CreateIndex
CREATE INDEX "rooms_visibility_idx" ON "public"."rooms"("visibility");

-- AddForeignKey
ALTER TABLE "public"."accounts" ADD CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."refresh_tokens" ADD CONSTRAINT "refresh_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."rooms" ADD CONSTRAINT "rooms_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."room_members" ADD CONSTRAINT "room_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."room_members" ADD CONSTRAINT "room_members_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "public"."rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."room_invitations" ADD CONSTRAINT "room_invitations_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "public"."rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."room_invitations" ADD CONSTRAINT "room_invitations_invitedId_fkey" FOREIGN KEY ("invitedId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."room_invitations" ADD CONSTRAINT "room_invitations_inviterId_fkey" FOREIGN KEY ("inviterId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
