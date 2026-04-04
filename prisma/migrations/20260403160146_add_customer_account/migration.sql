-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "customerAccount" VARCHAR(5) NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'customer',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_customerAccount_key" ON "User"("customerAccount");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
