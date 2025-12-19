/**
 * Interface for Excel file parsing operations
 * Follows Interface Segregation Principle - focused interface for Excel operations
 */
export interface IExcelParser {
  parseFile(file: File, sheetName?: string): Promise<Record<string, unknown>[]>;
  parseMultipleSheets(file: File): Promise<string[]>;
}
