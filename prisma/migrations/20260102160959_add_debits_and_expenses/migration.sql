-- CreateEnum
CREATE TYPE "DebitStatus" AS ENUM ('PENDING', 'PARTIAL', 'PAID');

-- CreateTable
CREATE TABLE "Debit" (
    "id" SERIAL NOT NULL,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "paidAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" "DebitStatus" NOT NULL DEFAULT 'PENDING',
    "customerName" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "paidAt" TIMESTAMP(3),

    CONSTRAINT "Debit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DebitItem" (
    "id" SERIAL NOT NULL,
    "debitId" INTEGER NOT NULL,
    "sellHistoryId" INTEGER NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DebitItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupplyExpense" (
    "id" SERIAL NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "supplier" TEXT,
    "quantity" INTEGER,
    "unitPrice" DOUBLE PRECISION,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupplyExpense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyExpense" (
    "id" SERIAL NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "category" TEXT,
    "notes" TEXT,
    "expenseDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyExpense_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DebitItem_sellHistoryId_key" ON "DebitItem"("sellHistoryId");

-- AddForeignKey
ALTER TABLE "DebitItem" ADD CONSTRAINT "DebitItem_debitId_fkey" FOREIGN KEY ("debitId") REFERENCES "Debit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DebitItem" ADD CONSTRAINT "DebitItem_sellHistoryId_fkey" FOREIGN KEY ("sellHistoryId") REFERENCES "SellHistory"("id") ON DELETE CASCADE ON UPDATE CASCADE;
