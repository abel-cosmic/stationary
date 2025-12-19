import {
  parseExcelFile,
  parseExcelFileMultipleSheets,
} from "@/lib/excel-utils";
import type { CreateProductData, CreateCategoryData } from "@/types/api";

export interface ImportResult {
  success: number;
  failed: number;
  errors: string[];
}

export interface ImportOptions {
  categories: boolean;
  products: boolean;
  sellHistory: boolean;
  analytics: boolean;
}

/**
 * Parse Excel file and detect available sheets
 */
export async function detectAvailableSheets(file: File): Promise<string[]> {
  try {
    return await parseExcelFileMultipleSheets(file);
  } catch (error) {
    console.error("Error reading file:", error);
    // Return default assumption if sheet detection fails
    return ["Products"];
  }
}

/**
 * Auto-select import options based on available sheets
 */
export function getDefaultImportOptions(
  availableSheets: string[]
): ImportOptions {
  return {
    categories: availableSheets.includes("Categories"),
    products:
      availableSheets.includes("Products") || availableSheets.length > 0,
    sellHistory: availableSheets.includes("Sell History"),
    analytics: false, // Analytics is read-only, not importable
  };
}

/**
 * Validate category data from Excel row
 */
export function validateCategoryRow(
  row: Record<string, unknown>,
  existingNames: Set<string>,
  t: (key: string, options?: Record<string, unknown>) => string
): { valid: boolean; data?: CreateCategoryData; error?: string } {
  const categoryName = String(row["Category Name"] || row["Name"] || "").trim();

  if (!categoryName) {
    return { valid: false, error: t("common.import.categoryNameRequired") };
  }

  if (existingNames.has(categoryName)) {
    return {
      valid: false,
      error: t("common.import.duplicateCategoryName", { name: categoryName }),
    };
  }

  return {
    valid: true,
    data: { name: categoryName },
  };
}

/**
 * Validate product data from Excel row
 */
export function validateProductRow(
  row: Record<string, unknown>,
  t: (key: string, options?: Record<string, unknown>) => string
): { valid: boolean; data?: CreateProductData; error?: string } {
  const productData: CreateProductData = {
    name: String(row["Product Name"] || row["Name"] || "").trim(),
    initialPrice: parseFloat(
      String(row["Initial Price (ETB)"] || row["Initial Price"] || "0")
    ),
    sellingPrice: parseFloat(
      String(row["Selling Price (ETB)"] || row["Selling Price"] || "0")
    ),
    quantity: parseInt(String(row["Quantity"] || row["Stock"] || "0")),
  };

  if (!productData.name) {
    return { valid: false, error: t("common.import.productNameRequired") };
  }

  if (productData.initialPrice <= 0) {
    return {
      valid: false,
      error: t("common.import.initialPriceMustBePositive"),
    };
  }

  if (productData.sellingPrice <= 0) {
    return {
      valid: false,
      error: t("common.import.sellingPriceMustBePositive"),
    };
  }

  if (productData.quantity < 0 || isNaN(productData.quantity)) {
    return {
      valid: false,
      error: t("common.import.quantityMustBeNonNegative"),
    };
  }

  return { valid: true, data: productData };
}

/**
 * Import categories from Excel file
 */
export async function importCategories(
  file: File,
  availableSheets: string[],
  createCategory: (data: CreateCategoryData) => Promise<unknown>,
  t: (key: string) => string
): Promise<ImportResult> {
  let successCount = 0;
  let failedCount = 0;
  const errors: string[] = [];

  try {
    const sheetName = availableSheets.includes("Categories")
      ? "Categories"
      : availableSheets[0] || undefined;
    const data = await parseExcelFile(file, sheetName);

    const existingCategoryNames = new Set<string>();

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      try {
        const validation = validateCategoryRow(row, existingCategoryNames, t);

        if (!validation.valid || !validation.data) {
          throw new Error(validation.error || "Validation failed");
        }

        existingCategoryNames.add(validation.data.name);
        await createCategory(validation.data);
        successCount++;
      } catch (error) {
        failedCount++;
        const errorMsg =
          error instanceof Error
            ? error.message
            : t("common.errors.unknownError");
        const rowIndex = i + 2; // +2 because Excel rows are 1-indexed and we have a header
        errors.push(
          `${t("common.import.categories")} - ${t(
            "common.import.row"
          )} ${rowIndex}: ${errorMsg}`
        );
      }
    }
  } catch (error) {
    errors.push(
      `${t("common.import.categories")} ${t("common.import.sheetsFound")}: ${
        error instanceof Error ? error.message : t("common.import.failedToRead")
      }`
    );
  }

  return { success: successCount, failed: failedCount, errors };
}

/**
 * Import products from Excel file
 */
export async function importProducts(
  file: File,
  availableSheets: string[],
  createProduct: (data: CreateProductData) => Promise<unknown>,
  t: (key: string) => string
): Promise<ImportResult> {
  let successCount = 0;
  let failedCount = 0;
  const errors: string[] = [];

  try {
    const sheetName = availableSheets.includes("Products")
      ? "Products"
      : availableSheets[0] || undefined;
    const data = await parseExcelFile(file, sheetName);

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      try {
        const validation = validateProductRow(row, t);

        if (!validation.valid || !validation.data) {
          throw new Error(validation.error || "Validation failed");
        }

        await createProduct(validation.data);
        successCount++;
      } catch (error) {
        failedCount++;
        const errorMsg =
          error instanceof Error
            ? error.message
            : t("common.errors.unknownError");
        const rowIndex = i + 2; // +2 because Excel rows are 1-indexed and we have a header
        errors.push(
          `${t("common.import.products")} - ${t(
            "common.import.row"
          )} ${rowIndex}: ${errorMsg}`
        );
      }
    }
  } catch (error) {
    errors.push(
      `${t("common.import.products")} ${t("common.import.sheetsFound")}: ${
        error instanceof Error ? error.message : t("common.errors.unknownError")
      }`
    );
  }

  return { success: successCount, failed: failedCount, errors };
}

/**
 * Process import based on options
 */
export async function processImport(
  file: File,
  importOptions: ImportOptions,
  availableSheets: string[],
  createCategory: (data: CreateCategoryData) => Promise<unknown>,
  createProduct: (data: CreateProductData) => Promise<unknown>,
  t: (key: string) => string
): Promise<ImportResult> {
  if (!importOptions.products && !importOptions.sellHistory) {
    throw new Error("Please select at least one option to import");
  }

  let totalSuccess = 0;
  let totalFailed = 0;
  const allErrors: string[] = [];

  // Import Categories
  if (importOptions.categories) {
    const result = await importCategories(
      file,
      availableSheets,
      createCategory,
      t
    );
    totalSuccess += result.success;
    totalFailed += result.failed;
    allErrors.push(...result.errors);
  }

  // Import Products
  if (importOptions.products) {
    const result = await importProducts(
      file,
      availableSheets,
      createProduct,
      t
    );
    totalSuccess += result.success;
    totalFailed += result.failed;
    allErrors.push(...result.errors);
  }

  // Note: Sell History import would require matching products by ID/Name
  if (importOptions.sellHistory) {
    allErrors.push(
      "Sell History import is not yet supported. Please import products first, then record sales manually."
    );
  }

  return {
    success: totalSuccess,
    failed: totalFailed,
    errors: allErrors.slice(0, 10), // Limit to first 10 errors
  };
}
