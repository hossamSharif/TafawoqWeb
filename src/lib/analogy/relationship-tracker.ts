/**
 * relationship-tracker.ts
 * Tracks analogy relationship type usage across practice sessions
 * Ensures diverse coverage of all 22 relationship types (User Story 5)
 *
 * Features:
 * - Track relationship types used in each session
 * - Recommend least-used relationships for next session
 * - Calculate coverage statistics
 * - Persist tracking data to localStorage or database
 *
 * @see specs/1-gat-exam-v3/data-model.md - AnalogyRelationship
 */

import { getAllAnalogyRelationshipIds } from '@/lib/constants/analogy-relationships';

export interface RelationshipUsageRecord {
  /** Relationship type ID */
  relationshipType: string;
  /** Number of times used */
  count: number;
  /** Last used timestamp */
  lastUsed: Date | null;
  /** Session IDs where this type was used */
  sessionIds: string[];
}

export interface CoverageStats {
  /** Total number of relationship types (22) */
  totalTypes: number;
  /** Number of types encountered at least once */
  typesEncountered: number;
  /** Coverage percentage (0-100) */
  coveragePercent: number;
  /** Least used types (for recommendations) */
  leastUsedTypes: string[];
  /** Most used types */
  mostUsedTypes: string[];
  /** Never encountered types */
  neverEncounteredTypes: string[];
}

export class AnalogyRelationshipTracker {
  private storageKey = 'analogy-relationship-usage';
  private usageMap: Map<string, RelationshipUsageRecord>;

  constructor() {
    this.usageMap = new Map();
    this.loadFromStorage();
  }

  /**
   * Record usage of relationship types from a practice session
   * @param sessionId - Unique session identifier
   * @param relationshipTypes - Array of relationship types used in the session
   */
  recordSession(sessionId: string, relationshipTypes: string[]): void {
    const now = new Date();

    for (const relType of relationshipTypes) {
      const existing = this.usageMap.get(relType);

      if (existing) {
        // Update existing record
        existing.count += 1;
        existing.lastUsed = now;
        if (!existing.sessionIds.includes(sessionId)) {
          existing.sessionIds.push(sessionId);
        }
      } else {
        // Create new record
        this.usageMap.set(relType, {
          relationshipType: relType,
          count: 1,
          lastUsed: now,
          sessionIds: [sessionId],
        });
      }
    }

    this.saveToStorage();
  }

  /**
   * Get coverage statistics for all relationship types
   */
  getCoverageStats(): CoverageStats {
    const allTypes = getAllAnalogyRelationshipIds();
    const totalTypes = allTypes.length;

    const encountered: string[] = [];
    const neverEncountered: string[] = [];
    const usageCounts: Array<{ type: string; count: number }> = [];

    for (const relType of allTypes) {
      const usage = this.usageMap.get(relType);

      if (usage && usage.count > 0) {
        encountered.push(relType);
        usageCounts.push({ type: relType, count: usage.count });
      } else {
        neverEncountered.push(relType);
        usageCounts.push({ type: relType, count: 0 });
      }
    }

    // Sort by usage count
    const sortedByUsage = [...usageCounts].sort((a, b) => a.count - b.count);

    const leastUsedTypes = sortedByUsage.slice(0, 5).map(u => u.type);
    const mostUsedTypes = sortedByUsage
      .slice()
      .reverse()
      .slice(0, 5)
      .map(u => u.type);

    return {
      totalTypes,
      typesEncountered: encountered.length,
      coveragePercent: (encountered.length / totalTypes) * 100,
      leastUsedTypes,
      mostUsedTypes,
      neverEncounteredTypes: neverEncountered,
    };
  }

  /**
   * Get recommended relationship types for next session
   * Prioritizes never-encountered types, then least-used types
   *
   * @param count - Number of types to recommend
   * @returns Array of recommended relationship type IDs
   */
  getRecommendedTypes(count: number): string[] {
    const stats = this.getCoverageStats();

    // First, include never-encountered types
    const recommendations: string[] = [];

    for (const type of stats.neverEncounteredTypes) {
      if (recommendations.length >= count) break;
      recommendations.push(type);
    }

    // Then add least-used types
    for (const type of stats.leastUsedTypes) {
      if (recommendations.length >= count) break;
      if (!recommendations.includes(type)) {
        recommendations.push(type);
      }
    }

    // If still not enough, add random types
    const allTypes = getAllAnalogyRelationshipIds();
    while (recommendations.length < count) {
      const randomType = allTypes[Math.floor(Math.random() * allTypes.length)];
      if (!recommendations.includes(randomType)) {
        recommendations.push(randomType);
      }
    }

    return recommendations;
  }

  /**
   * Get usage record for a specific relationship type
   */
  getUsageRecord(relationshipType: string): RelationshipUsageRecord | null {
    return this.usageMap.get(relationshipType) || null;
  }

  /**
   * Get all usage records
   */
  getAllUsageRecords(): RelationshipUsageRecord[] {
    return Array.from(this.usageMap.values());
  }

  /**
   * Reset all tracking data (for testing or user request)
   */
  reset(): void {
    this.usageMap.clear();
    this.saveToStorage();
  }

  /**
   * Load tracking data from localStorage
   */
  private loadFromStorage(): void {
    if (typeof window === 'undefined') return; // Server-side guard

    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const data = JSON.parse(stored);

        // Restore Map from stored array
        this.usageMap = new Map();
        for (const record of data) {
          this.usageMap.set(record.relationshipType, {
            ...record,
            lastUsed: record.lastUsed ? new Date(record.lastUsed) : null,
          });
        }
      }
    } catch (error) {
      console.error('Failed to load relationship tracking data:', error);
      this.usageMap = new Map();
    }
  }

  /**
   * Save tracking data to localStorage
   */
  private saveToStorage(): void {
    if (typeof window === 'undefined') return; // Server-side guard

    try {
      const data = Array.from(this.usageMap.values());
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save relationship tracking data:', error);
    }
  }

  /**
   * Export tracking data as JSON (for backup or transfer)
   */
  exportData(): string {
    const data = Array.from(this.usageMap.values());
    return JSON.stringify(data, null, 2);
  }

  /**
   * Import tracking data from JSON (for restore or transfer)
   */
  importData(jsonData: string): void {
    try {
      const data = JSON.parse(jsonData);

      this.usageMap = new Map();
      for (const record of data) {
        this.usageMap.set(record.relationshipType, {
          ...record,
          lastUsed: record.lastUsed ? new Date(record.lastUsed) : null,
        });
      }

      this.saveToStorage();
    } catch (error) {
      console.error('Failed to import relationship tracking data:', error);
      throw new Error('Invalid tracking data format');
    }
  }
}

/**
 * Singleton instance for global tracking
 */
let globalTracker: AnalogyRelationshipTracker | null = null;

/**
 * Get the global relationship tracker instance
 */
export function getAnalogyRelationshipTracker(): AnalogyRelationshipTracker {
  if (!globalTracker) {
    globalTracker = new AnalogyRelationshipTracker();
  }
  return globalTracker;
}

/**
 * Helper function to generate balanced analogy questions based on tracking
 * Prioritizes least-used relationship types
 *
 * @param totalCount - Total number of analogy questions to generate
 * @returns Array of relationship types to use for generation
 */
export function generateBalancedRelationshipTypes(totalCount: number): string[] {
  const tracker = getAnalogyRelationshipTracker();
  const stats = tracker.getCoverageStats();

  // If we haven't covered all types yet, prioritize uncovered types
  if (stats.neverEncounteredTypes.length > 0) {
    const types: string[] = [];

    // Add all never-encountered types
    types.push(...stats.neverEncounteredTypes);

    // Fill remaining with least-used types
    const remaining = totalCount - types.length;
    if (remaining > 0) {
      const leastUsed = stats.leastUsedTypes.filter(t => !types.includes(t));
      types.push(...leastUsed.slice(0, remaining));
    }

    // If still need more, cycle through all types
    const allTypes = getAllAnalogyRelationshipIds();
    while (types.length < totalCount) {
      const nextType = allTypes[types.length % allTypes.length];
      types.push(nextType);
    }

    return types.slice(0, totalCount);
  }

  // All types have been encountered, distribute evenly
  const allTypes = getAllAnalogyRelationshipIds();
  const types: string[] = [];

  // Distribute questions evenly across all types
  const perType = Math.floor(totalCount / allTypes.length);
  const remainder = totalCount % allTypes.length;

  for (let i = 0; i < allTypes.length; i++) {
    const count = perType + (i < remainder ? 1 : 0);
    for (let j = 0; j < count; j++) {
      types.push(allTypes[i]);
    }
  }

  // Shuffle for variety
  return shuffleArray(types).slice(0, totalCount);
}

/**
 * Shuffle array helper
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
