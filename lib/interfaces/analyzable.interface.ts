/**
 * Interface for entities that have analytics data
 * Follows Interface Segregation Principle
 */
export interface IAnalyzable {
  getAnalytics(): Record<string, unknown>;
}
