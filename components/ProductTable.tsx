"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Product } from "@/lib/api";
import { useRouter } from "next/navigation";
import { Package, DollarSign, TrendingUp, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProductTableProps {
  products: Product[];
}

export function ProductTable({ products }: ProductTableProps) {
  const router = useRouter();

  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-[150px]">Name</TableHead>
            <TableHead className="hidden sm:table-cell">Quantity</TableHead>
            <TableHead className="hidden md:table-cell">Selling Price</TableHead>
            <TableHead className="hidden lg:table-cell">Profit</TableHead>
            <TableHead className="text-right min-w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => (
            <TableRow key={product.id} className="cursor-pointer hover:bg-accent">
              <TableCell className="font-medium">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    {product.name}
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground sm:hidden">
                    <span>Qty: {product.quantity}</span>
                    <span>Price: {product.sellingPrice.toFixed(2)} ETB</span>
                    <span className={product.profit >= 0 ? "text-green-400" : "text-red-400"}>
                      Profit: {product.profit.toFixed(2)} ETB
                    </span>
                  </div>
                </div>
              </TableCell>
              <TableCell className="hidden sm:table-cell">{product.quantity}</TableCell>
              <TableCell className="hidden md:table-cell">
                <div className="flex items-center gap-1">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  {product.sellingPrice.toFixed(2)} ETB
                </div>
              </TableCell>
              <TableCell className="hidden lg:table-cell">
                <span
                  className={`font-semibold ${
                    product.profit >= 0 ? "text-green-400" : "text-red-400"
                  }`}
                >
                  <TrendingUp className="h-4 w-4 inline mr-1" />
                  {product.profit.toFixed(2)} ETB
                </span>
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push(`/products/${product.id}`)}
                  className="w-full sm:w-auto"
                >
                  <Eye className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">View</span>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

