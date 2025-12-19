/**
 * Interface for entities that can be exported to Excel
 * Follows Interface Segregation Principle
 */
export interface IExportable {
  exportToExcel(): void;
}
