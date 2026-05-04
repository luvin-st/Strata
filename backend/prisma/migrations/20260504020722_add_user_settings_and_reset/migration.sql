-- AlterTable
ALTER TABLE "User" ADD COLUMN     "defaultCategory" TEXT NOT NULL DEFAULT 'Work',
ADD COLUMN     "defaultPriority" TEXT NOT NULL DEFAULT 'medium',
ADD COLUMN     "profilePicture" TEXT,
ADD COLUMN     "resetToken" TEXT,
ADD COLUMN     "resetTokenExpiry" TIMESTAMP(3);
