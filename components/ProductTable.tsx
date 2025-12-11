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
import {
  Package,
  DollarSign,
  TrendingUp,
  Eye,
  Edit,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { EditProductDialog } from "@/components/EditProductDialog";
import { DeleteButton } from "@/components/DeleteButton";

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
            <TableHead className="hidden sm:table-cell">Category</TableHead>
            <TableHead className="hidden sm:table-cell">Quantity</TableHead>
            <TableHead className="hidden md:table-cell">
              Selling Price
            </TableHead>
            <TableHead className="hidden lg:table-cell">Profit</TableHead>
            <TableHead className="text-right min-w-[120px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => (
            <TableRow key={product.id} className="hover:bg-accent">
              <TableCell className="font-medium">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    {product.name}
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground sm:hidden">
                    {product.category && (
                      <span className="px-2 py-0.5 rounded bg-muted text-xs">
                        {product.category.name}
                      </span>
                    )}
                    <span>Qty: {product.quantity}</span>
                    <span>Price: {product.sellingPrice.toFixed(2)} ETB</span>
                    <span
                      className={
                        product.profit >= 0 ? "text-green-400" : "text-red-400"
                      }
                    >
                      Profit: {product.profit.toFixed(2)} ETB
                    </span>
                  </div>
                </div>
              </TableCell>
              <TableCell className="hidden sm:table-cell">
                {product.category ? (
                  <span className="px-2 py-1 rounded bg-muted text-xs">
                    {product.category.name}
                  </span>
                ) : (
                  <span className="text-muted-foreground text-sm">—</span>
                )}
              </TableCell>
              <TableCell className="hidden sm:table-cell">
                {product.quantity}
              </TableCell>
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
                <div className="flex items-center justify-end gap-1.5 sm:gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push(`/products/${product.id}`)}
                    className="h-10 w-10 sm:h-9 sm:w-9 p-0 touch-manipulation"
                    title="View Details"
                  >
                    <Eye className="h-5 w-5 sm:h-4 sm:w-4" />
                  </Button>
                  <EditProductDialog
                    product={product}
                    trigger={
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-10 w-10 sm:h-9 sm:w-9 p-0 touch-manipulation"
                        title="Edit Product"
                      >
                        <Edit className="h-5 w-5 sm:h-4 sm:w-4" />
                      </Button>
                    }
                  />
                  <DeleteButton
                    productId={product.id}
                    productName={product.name}
                    trigger={
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-10 w-10 sm:h-9 sm:w-9 p-0 text-destructive hover:text-destructive touch-manipulation"
                        title="Delete Product"
                      >
                        <Trash2 className="h-5 w-5 sm:h-4 sm:w-4" />
                      </Button>
                    }
                  />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
